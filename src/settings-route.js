import { assertModelPoolSize, MODEL_POOL_LIMITS, normalizeModelPool } from './model-pool.js'
import { checkModelAvailability } from './model-availability.js'

const ROUTER_SETTINGS_PATH = '/dsh-tiered-model-router/config'
const ROUTER_MODELS_PATH = '/dsh-tiered-model-router/models'
const ROUTER_MODEL_CHECK_PATH = '/dsh-tiered-model-router/check-model'
const MAX_BODY_BYTES = 128 * 1024
const MODEL_LIST_TIMEOUT_MS = 5_000
const MODEL_INFO_TIMEOUT_MS = 2_500

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function sendJson(res, status, value) {
  if (res.headersSent) return
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(value))
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    let settled = false
    const fail = (error) => {
      if (settled) return
      settled = true
      reject(error)
    }
    req.on('data', (chunk) => {
      if (settled) return
      size += Buffer.byteLength(chunk)
      if (size > MAX_BODY_BYTES) {
        fail(new Error('request body is too large'))
        try { req.destroy() } catch { /* best effort */ }
        return
      }
      chunks.push(Buffer.from(chunk))
    })
    req.on('end', () => {
      if (settled) return
      settled = true
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', fail)
  })
}

function revisionOf(value) {
  if (value === undefined) return undefined
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError('expectedRevision must be a non-negative integer')
  return value
}

function viewOf(settings, namespace) {
  const descriptor = settings.describe({ redactSecrets: true }).find((candidate) => String(candidate.ns) === namespace)
  if (!descriptor) throw new Error(`settings namespace "${namespace}" is not registered`)
  return {
    value: descriptor.value,
    ...descriptor.base === undefined ? {} : { base: descriptor.base },
    ...descriptor.user === undefined ? {} : { user: descriptor.user },
    revision: descriptor.revision,
    writable: settings.writable === true,
    mode: 'route',
  }
}

function validateOps(ops) {
  if (!Array.isArray(ops) || ops.length === 0) throw new TypeError('ops must be a non-empty array')
  for (const op of ops) {
    if (!isRecord(op) || (op.op !== 'set' && op.op !== 'unset')) throw new TypeError('each op must be { op: set|unset, path }')
    if (!Array.isArray(op.path) || op.path.some((part) => typeof part !== 'string')) throw new TypeError('each op path must be an array of strings')
    if (op.op === 'set' && !Object.prototype.hasOwnProperty.call(op, 'value')) throw new TypeError('set operations require a value')
  }
  return ops
}

function requestFields(payload) {
  if (!isRecord(payload)) throw new TypeError('request body must be an object')
  const provider = String(payload.provider ?? '').trim()
  const model = String(payload.model ?? '').trim()
  if (!provider || !model) throw new TypeError('模型提供商和模型不能为空')
  if (provider.length > 200 || model.length > 500) throw new TypeError('模型提供商或模型名称过长')
  return { provider, model }
}

async function callWithTimeout(call, timeoutMs) {
  const controller = typeof AbortController === 'function' ? new AbortController() : undefined
  let timer
  const task = Promise.resolve().then(() => call(controller?.signal))
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      try { controller?.abort() } catch { /* best effort */ }
      const error = new Error('model discovery timed out')
      error.code = 'MODEL_DISCOVERY_TIMEOUT'
      reject(error)
    }, timeoutMs)
  })
  try { return await Promise.race([task, timeout]) } finally { clearTimeout(timer) }
}

async function modelPoolOf(llm) {
  if (!llm || typeof llm.listProviders !== 'function') return []
  let providers
  try { providers = llm.listProviders() } catch { return [] }
  if (!Array.isArray(providers)) return []
  if (providers.length > MODEL_POOL_LIMITS.providers) {
    const error = new Error('模型池过大，暂不支持')
    error.code = 'MODEL_POOL_TOO_LARGE'
    throw error
  }
  const rows = []
  let modelCount = 0
  for (const provider of providers) {
    const id = String(provider?.id ?? '').trim()
    if (!id) continue
    const models = []
    try {
      if (typeof llm.listModels === 'function') {
        const listed = await callWithTimeout((signal) => llm.listModels(id, signal), MODEL_LIST_TIMEOUT_MS)
        if (Array.isArray(listed)) {
          modelCount += listed.length
          if (modelCount > MODEL_POOL_LIMITS.models) {
            const error = new Error('模型池过大，暂不支持')
            error.code = 'MODEL_POOL_TOO_LARGE'
            throw error
          }
          const seen = new Set()
          for (const model of listed) {
            const modelId = String(model?.id ?? '').trim()
            if (!modelId || seen.has(modelId)) continue
            seen.add(modelId)
            let reasoningEfforts = []
            try {
              if (typeof llm.resolveModelInfo === 'function') {
                const info = await callWithTimeout((signal) => llm.resolveModelInfo(id, modelId, signal), MODEL_INFO_TIMEOUT_MS)
                if (Array.isArray(info?.reasoning?.efforts)) {
                  reasoningEfforts = info.reasoning.efforts
                    .map((effort) => String(effort?.id ?? '').trim())
                    .filter(Boolean)
                }
              }
            } catch {
              // Capability metadata is optional; the route remains selectable.
            }
            models.push({ id: modelId, name: String(model?.name ?? modelId), reasoningEfforts })
          }
        }
      }
    } catch (error) {
      // A provider can disappear or reject discovery while the settings page
      // is open; the current route remains usable through its custom option.
      if (error?.code === 'MODEL_POOL_TOO_LARGE') throw error
    }
    rows.push({
      id,
      name: String(provider?.name ?? id),
      models,
    })
  }
  const normalized = normalizeModelPool(rows)
  assertModelPoolSize(normalized)
  return normalized
}

/**
 * Register a loopback-compatible settings route for this plugin.
 * DSH's generic settings RPC intentionally exposes only an allowlist of
 * namespaces; this route keeps the plugin decoupled from that core policy.
 */
export function installSettingsRoute(ctx, namespace) {
  if (typeof ctx?.inject !== 'function') return
  try {
    ctx.inject(['webServer', 'settings', 'llm'], (webCtx) => {
      try {
        const webServer = webCtx?.webServer
        const settings = webCtx?.settings
        const llm = webCtx?.llm ?? webCtx?.get?.('llm')
        if (!webServer || typeof webServer.register !== 'function') return
        if (!settings || typeof settings.describe !== 'function' || typeof settings.mutate !== 'function' || typeof settings.replace !== 'function') return
        const disposeConfigRoute = webServer.register({
          kind: 'prefix',
          path: ROUTER_SETTINGS_PATH,
          async handler(req, res) {
            const url = new URL(req.url ?? '/', 'http://dsh')
            const pathname = url.pathname.replace(/\/+$/, '') || '/'
            if (pathname !== ROUTER_SETTINGS_PATH) {
              sendJson(res, 404, { ok: false, error: 'not found' })
              return
            }
            if (req.method === 'GET') {
              try { sendJson(res, 200, { ok: true, ...viewOf(settings, namespace) }) } catch (error) {
                sendJson(res, 503, { ok: false, error: errorMessage(error) })
              }
              return
            }
            if (req.method !== 'POST') {
              sendJson(res, 405, { ok: false, error: 'method not allowed' })
              return
            }
            try {
              const body = await readRequestBody(req)
              let payload
              try { payload = body.trim().length === 0 ? {} : JSON.parse(body) } catch {
                sendJson(res, 400, { ok: false, error: 'invalid JSON body' })
                return
              }
              if (!isRecord(payload)) throw new TypeError('request body must be an object')
              const expectedRevision = revisionOf(payload.expectedRevision)
              if (payload.action === 'replace') {
                if (!isRecord(payload.section)) throw new TypeError('replace section must be an object')
                await settings.replace(namespace, payload.section, expectedRevision)
              } else {
                await settings.mutate(namespace, validateOps(payload.ops), expectedRevision)
              }
              sendJson(res, 200, { ok: true, ...viewOf(settings, namespace) })
            } catch (error) {
              const code = error?.code === 'SETTINGS_CONFLICT' ? 'settings-conflict' : 'settings-rejected'
              sendJson(res, code === 'settings-conflict' ? 409 : 400, { ok: false, code, error: errorMessage(error) })
            }
          },
        })
        const disposeModelsRoute = webServer.register({
          kind: 'exact',
          path: ROUTER_MODELS_PATH,
          async handler(req, res) {
            if (req.method !== 'GET') {
              sendJson(res, 405, { ok: false, error: 'method not allowed' })
              return
            }
            try { sendJson(res, 200, { ok: true, providers: await modelPoolOf(llm) }) } catch (error) {
              const tooLarge = error?.code === 'MODEL_POOL_TOO_LARGE'
              sendJson(res, tooLarge ? 413 : 503, { ok: false, code: tooLarge ? 'model-pool-too-large' : 'model-pool-unavailable', error: errorMessage(error), providers: [] })
            }
          },
        })
        const disposeModelCheckRoute = webServer.register({
          kind: 'exact',
          path: ROUTER_MODEL_CHECK_PATH,
          async handler(req, res) {
            if (req.method !== 'POST') {
              sendJson(res, 405, { ok: false, error: 'method not allowed' })
              return
            }
            try {
              const body = await readRequestBody(req)
              let payload
              try { payload = body.trim().length === 0 ? {} : JSON.parse(body) } catch {
                sendJson(res, 400, { ok: false, error: 'invalid JSON body' })
                return
              }
              const { provider, model } = requestFields(payload)
              const pool = await modelPoolOf(llm)
              const providerRow = pool.find((row) => row.id === provider)
              const listed = providerRow?.models?.some((row) => row.id === model) === true
              if (!listed) {
                sendJson(res, 200, {
                  ok: true,
                  status: 'unavailable',
                  code: 'MODEL_NOT_LISTED',
                  reason: 'not-in-model-pool',
                  message: '模型不在当前模型池内，不能使用',
                })
                return
              }
              const result = await checkModelAvailability(llm, { provider, model })
              sendJson(res, 200, { ok: true, provider, model, ...result })
            } catch (error) {
              const tooLarge = error?.code === 'MODEL_POOL_TOO_LARGE'
              sendJson(res, tooLarge ? 413 : 503, {
                ok: false,
                code: tooLarge ? 'model-pool-too-large' : 'model-check-unavailable',
                error: errorMessage(error),
              })
            }
          },
        })
        if (typeof webCtx.effect === 'function') {
          webCtx.effect(() => () => {
            try { disposeConfigRoute?.() } catch { /* best effort */ }
            try { disposeModelsRoute?.() } catch { /* best effort */ }
            try { disposeModelCheckRoute?.() } catch { /* best effort */ }
          }, 'dsh-tiered-model-router: settings routes')
        }
      } catch (error) {
        try { ctx.logger?.warn?.(`dsh-tiered-model-router settings route registration failed: ${errorMessage(error)}`) } catch { /* optional logger */ }
      }
    })
  } catch (error) {
    try { ctx.logger?.warn?.(`dsh-tiered-model-router settings route unavailable: ${errorMessage(error)}`) } catch { /* optional logger */ }
  }
}

export { ROUTER_SETTINGS_PATH, ROUTER_MODELS_PATH, ROUTER_MODEL_CHECK_PATH, modelPoolOf }
