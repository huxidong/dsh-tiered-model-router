import { classifyTask } from './classifier.js'
import { Config, normalizeConfig, tierForRoute } from './config.js'
import { rewriteCallConfig } from './route.js'
import { beginTurn, createStateStore, escalate } from './state.js'

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
  return Boolean(agent?.parent || agent?.parentAgent || agent?.options?.parent)
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
  let source = () => config
  const updateFromSource = () => {
    try {
      const next = normalizeConfig(source())
      if (next) config = next
      else safeLog(ctx, 'dsh-tiered-model-router ignored an invalid settings value; keeping the last valid configuration')
    } catch (error) {
      safeLog(ctx, 'dsh-tiered-model-router could not apply settings; keeping the last valid configuration', error)
    }
  }
  installOptionalSettings(ctx, config, (next) => { source = next }, updateFromSource)
  const store = createStateStore()
  const disposers = []
  const on = (event, listener) => {
    try {
      const dispose = ctx?.on?.(event, listener)
      if (typeof dispose === 'function') disposers.push(dispose)
    } catch (error) { safeLog(ctx, `dsh-tiered-model-router could not subscribe to ${event}`, error) }
  }

  on('agent/pre-step', async (payload, next) => {
    try {
      if (!config.enabled) return passPreStep(payload, next)
      if (!payload?.agent || (isSubagent(payload.agent) && !config.policy.routeSubagents)) return passPreStep(payload, next)
      let state = store.get(payload.agent)
      if (!state || state.turn !== payload.turn) {
        const classification = classifyTask(payload.messages, config.policy)
        state = beginTurn(store, payload.agent, payload.turn, classification.tier, config)
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
    try {
      if (!config.enabled) return resolved
      const agent = payload?.agent
      const state = store.get(agent)
      if (!state || state.turn !== payload?.turn || (isSubagent(agent) && !config.policy.routeSubagents)) return resolved
      if (payload.step >= config.policy.hardAtStep) escalate(state, 'hard')
      else if (payload.step >= config.policy.standardAtStep) escalate(state, 'standard')
      const existingTier = tierForRoute(resolved, config.tiers)
      if (config.policy.preserveExplicitSelection && !config.policy.takeOverUnknownSelection && !existingTier) {
        state.managed = false
      }
      if (!state.managed) return resolved
      const route = config.tiers[state.tier]
      if (!route) return resolved
      return rewriteCallConfig(resolved, route, config.policy)
    } catch (error) {
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
