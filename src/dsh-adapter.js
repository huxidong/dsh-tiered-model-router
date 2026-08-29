import { classifyTask } from './classifier.js'
import { Config, normalizeConfig, tierForRoute } from './config.js'
import { rewriteCallConfig } from './route.js'
import { resolveReasoningEffort } from './reasoning.js'
import { beginTurn, createStateStore, escalate } from './state.js'
import { installSettingsRoute } from './settings-route.js'
import { installModelSelectionProjection } from './model-selection-projection.js'

export const ROUTER_SETTINGS_NAMESPACE = 'dsh-tiered-model-router'

function safeLog(ctx, message, error) {
  try {
    const logger = ctx?.logger
    if (logger && typeof logger.warn === 'function') logger.warn(`${message}${error ? `: ${String(error?.message ?? error)}` : ''}`)
  } catch { /* logging must never affect routing */ }
}
function matchesTool(name, patterns) {
  const normalized = String(name ?? '').toLocaleLowerCase()
  return patterns.some((pattern) => {
    const escaped = String(pattern).replace(/[|\\{}()[\]^$+?.]/g, '\\$&').replaceAll('*', '.*')
    try { return new RegExp(`^${escaped}$`).test(normalized) } catch { return false }
  })
}
function isSubagent(agent) {
  const header = agent?.session?.header
  // `AgentOptions` deliberately has no parent field. DSH records the durable
  // subagent lineage on the Session header, which also survives restoration.
  if (header?.origin !== undefined) return header.origin === 'subagent'
  // Older DSH objects exposed parent fields directly. Do not use
  // `parentSession` alone here: ordinary session forks also carry it.
  return Boolean(agent?.parent || agent?.parentAgent || agent?.options?.parent)
}
function currentRouteOf(agent) {
  try {
    const header = typeof agent?.session?.requestHeader === 'function'
      ? agent.session.requestHeader()
      : agent?.session?.header
    const config = header?.config
    if (config && typeof config === 'object') return config
  } catch { /* a missing/restoring header must not block classification */ }
  // AgentOptions is only the seed for a brand-new session. It has not created
  // a provider cache yet, so using it as a sticky tier would suppress the
  // router's first useful classification. Only a durable request header (the
  // model that actually handled an earlier request) is cache-relevant.
  return undefined
}
function passPreStep(payload, next) {
  if (typeof next === 'function') return next()
  return { kind: 'enter', messages: Array.isArray(payload?.messages) ? payload.messages : [] }
}

/**
 * Attach the optional DSH Settings service without making the Host adapter
 * depend on it at module-load time. This keeps headless/minimal compositions
 * working while still using the native namespace registration when available.
 */
function installOptionalSettings(ctx, base, onSource, onChange) {
  if (typeof ctx?.inject !== 'function') return
  try {
    ctx.inject(['settings'], (settingsCtx) => {
      let scope
      try {
        const settings = settingsCtx?.settings
        if (!settings || typeof settings.register !== 'function') return
        scope = settings.register(ROUTER_SETTINGS_NAMESPACE, Config, { base })
      } catch (error) {
        safeLog(ctx, 'dsh-tiered-model-router could not register its settings namespace', error)
        return
      }
      if (!scope) return
      try {
        onSource(() => scope.get())
        onChange()
        const disposeWatch = typeof scope.watch === 'function'
          ? scope.watch(() => { onChange() })
          : undefined
        settingsCtx?.effect?.(() => () => {
          try { disposeWatch?.() } catch (error) { safeLog(ctx, 'dsh-tiered-model-router settings watcher cleanup failed', error) }
          onSource(() => base)
          onChange()
        }, 'dsh-tiered-model-router settings fallback')
      } catch (error) {
        safeLog(ctx, 'dsh-tiered-model-router settings integration failed; using composition config', error)
      }
    })
  } catch (error) {
    safeLog(ctx, 'dsh-tiered-model-router could not attach optional settings service', error)
  }
}

/** Install the host-specific DSH event bridge. All policy remains pure/testable. */
export function installDshAdapter(ctx, rawConfig) {
  let config
  try { config = normalizeConfig(rawConfig) } catch (error) {
    safeLog(ctx, 'dsh-tiered-model-router configuration could not be normalized; passing through', error)
    config = undefined
  }
  if (!config) {
    if (rawConfig !== undefined && rawConfig !== null) safeLog(ctx, 'dsh-tiered-model-router disabled because configuration is invalid or disabled')
    return () => {}
  }
  installModelSelectionProjection(ctx, safeLog)
  let llm
  try { llm = ctx?.get?.('llm') } catch (error) { safeLog(ctx, 'dsh-tiered-model-router could not access the llm service', error) }
  try {
    ctx?.inject?.(['llm'], (llmCtx) => {
      try { llm = llmCtx?.get?.('llm') ?? llmCtx?.llm ?? llm } catch (error) {
        safeLog(ctx, 'dsh-tiered-model-router llm capability lookup unavailable', error)
      }
    })
  } catch (error) { safeLog(ctx, 'dsh-tiered-model-router could not attach llm capability lookup', error) }

  const modelInfoCache = new Map()
  const MODEL_INFO_TTL_MS = 5 * 60 * 1000
  const MODEL_INFO_CACHE_LIMIT = 128
  const resolveModelInfo = (provider, model) => {
    if (!llm || typeof llm.resolveModelInfo !== 'function') return Promise.resolve(undefined)
    const key = `${String(provider)}\u0000${String(model)}`
    const now = Date.now()
    const cached = modelInfoCache.get(key)
    if (cached && cached.expiresAt > now) return cached.promise
    let promise
    try {
      promise = Promise.resolve(llm.resolveModelInfo(provider, model))
        .catch((error) => {
          safeLog(ctx, `dsh-tiered-model-router could not resolve capabilities for ${provider}/${model}`, error)
          return undefined
        })
    } catch (error) {
      safeLog(ctx, `dsh-tiered-model-router could not start capability lookup for ${provider}/${model}`, error)
      return Promise.resolve(undefined)
    }
    modelInfoCache.set(key, { promise, expiresAt: now + MODEL_INFO_TTL_MS })
    while (modelInfoCache.size > MODEL_INFO_CACHE_LIMIT) modelInfoCache.delete(modelInfoCache.keys().next().value)
    return promise
  }
  const routeWithResolvedReasoning = async (resolved, route, policy) => {
    if (!route?.reasoningEffort) return rewriteCallConfig(resolved, route, policy)
    const info = await resolveModelInfo(route.provider, route.model)
    // DSH treats an omitted `reasoning` block as "this model does not accept
    // explicit reasoningEffort". Do not forward a configured level when the
    // capability lookup is unavailable; letting the model use its own default
    // is safer than making the whole request fail with UNSUPPORTED_...
    const reasoningEffort = info?.reasoning
      ? resolveReasoningEffort(route.reasoningEffort, info, {
        strategy: policy.reasoningFallback,
        levelOrder: policy.reasoningLevelOrder,
      })
      : undefined
    const nextRoute = reasoningEffort === undefined
      ? { ...route, reasoningEffort: undefined }
      : { ...route, reasoningEffort }
    return rewriteCallConfig(resolved, nextRoute, policy)
  }
  const routeRequest = async (payload, resolved) => {
    if (!config.enabled) return resolved
    const agent = payload?.agent
    const state = store.get(agent)
    if (!state || state.turn !== payload?.turn || (isSubagent(agent) && !config.policy.routeSubagents)) return resolved
    if (config.policy.escalateOnSteps === true) {
      if (payload.step >= config.policy.hardAtStep) escalate(state, 'hard')
      else if (payload.step >= config.policy.standardAtStep) escalate(state, 'standard')
    }
    if (!state.managed) return resolved
    const route = config.tiers[state.tier]
    if (!route) return resolved
    if (state.routingDepth >= config.policy.maxRoutingDepth) {
      safeLog(ctx, `dsh-tiered-model-router reached max routing depth (${config.policy.maxRoutingDepth}); passing through`)
      return resolved
    }
    state.routingDepth += 1
    try { return await routeWithResolvedReasoning(resolved, route, config.policy) } finally { state.routingDepth -= 1 }
  }
  let source = () => config
  const updateFromSource = () => {
    try {
      const next = normalizeConfig(source())
      if (next) {
        config = next
        modelInfoCache.clear()
      }
      else safeLog(ctx, 'dsh-tiered-model-router ignored an invalid settings value; keeping the last valid configuration')
    } catch (error) {
      safeLog(ctx, 'dsh-tiered-model-router could not apply settings; keeping the last valid configuration', error)
    }
  }
  installOptionalSettings(ctx, config, (next) => { source = next }, updateFromSource)
  try { installSettingsRoute(ctx, ROUTER_SETTINGS_NAMESPACE) } catch (error) {
    safeLog(ctx, 'dsh-tiered-model-router settings route unavailable', error)
  }
  const store = createStateStore()
  const disposers = []
  const on = (event, listener) => {
    try {
      const dispose = ctx?.on?.(event, listener)
      if (typeof dispose === 'function') disposers.push(dispose)
    } catch (error) { safeLog(ctx, `dsh-tiered-model-router could not subscribe to ${event}`, error) }
  }

  // DSH's web model picker installs an agent-scoped `agent/request` listener.
  // Depending on load order, that listener can run after this composition
  // listener and restore the session's visible model. Install one prepended
  // per-agent finalizer so automatic routing remains authoritative while a
  // disabled router still passes the request through unchanged.
  on('agent/created', ({ agent }) => {
    try {
      if (!agent?.ctx || typeof agent.ctx.on !== 'function') return
      const dispose = agent.ctx.on('agent/request', async (payload, next) => {
        if (typeof next !== 'function') return {}
        const resolved = await next()
        try { return await routeRequest(payload, resolved) } catch (error) {
          safeLog(ctx, 'dsh-tiered-model-router final agent-scoped routing failed; passing through', error)
          return resolved
        }
      }, { prepend: true })
      if (typeof dispose === 'function') disposers.push(dispose)
    } catch (error) {
      safeLog(ctx, 'dsh-tiered-model-router could not install the agent-scoped finalizer', error)
    }
  })

  on('agent/pre-step', async (payload, next) => {
    try {
      if (!config.enabled) return passPreStep(payload, next)
      if (!payload?.agent || (isSubagent(payload.agent) && !config.policy.routeSubagents)) return passPreStep(payload, next)
      let state = store.get(payload.agent)
      if (!state || state.turn !== payload.turn) {
        const classification = classifyTask(payload.messages, config.policy)
        const currentTier = tierForRoute(currentRouteOf(payload.agent), config.tiers)
        state = beginTurn(store, payload.agent, payload.turn, classification.tier, config, currentTier)
      }
    } catch (error) {
      safeLog(ctx, 'dsh-tiered-model-router classification failed; passing through', error)
    }
    return passPreStep(payload, next)
  })

  on('tools/result', (exec, result) => {
    try {
      if (!config.enabled) return
      const agent = exec?.agent
      if (!agent || (isSubagent(agent) && !config.policy.routeSubagents)) return
      const state = store.get(agent)
      if (!state) return
      const hardTool = matchesTool(exec?.name, config.policy.hardTools)
      if (!result?.isError) {
        state.consecutiveToolFailures = 0
        if (hardTool) escalate(state, 'hard')
        return
      }
      if (matchesTool(exec?.name, config.policy.failureExclude)) return
      state.consecutiveToolFailures += 1
      if (hardTool || state.consecutiveToolFailures >= config.policy.hardAfterToolFailures) escalate(state, 'hard')
    } catch (error) { safeLog(ctx, 'dsh-tiered-model-router tool-result handling failed', error) }
  })

  on('agent/request', async (payload, next) => {
    if (typeof next !== 'function') return {}
    let resolved
    try { resolved = await next() } catch (error) {
      safeLog(ctx, 'dsh-tiered-model-router could not read the current request; passing through', error)
      throw error
    }
    try { return await routeRequest(payload, resolved) } catch (error) {
      safeLog(ctx, 'dsh-tiered-model-router routing failed; passing through', error)
      return resolved
    }
  })

  on('agent/disposed', (payload) => store.delete(payload?.agent))
  return () => {
    for (const dispose of disposers.splice(0)) {
      try { dispose() } catch (error) { safeLog(ctx, 'dsh-tiered-model-router listener cleanup failed', error) }
    }
  }
}
