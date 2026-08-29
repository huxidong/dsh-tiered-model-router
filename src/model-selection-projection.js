/**
 * Session projection for the model that actually handled the latest request.
 * The request header is the authoritative post-routing config; assistant
 * messages are accepted as a second signal for hosts that omit headers from
 * the client stream. Everything is plain JSON so it remains compatible with
 * DSH's optional session-projection service.
 */

export const MODEL_SELECTION_PROJECTION_KEY = 'dsh-tiered-model-router.modelSelection'

function routeOf(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const provider = String(value.provider ?? '').trim()
  const model = String(value.model ?? '').trim()
  if (!provider || !model) return undefined
  const reasoningEffort = String(value.reasoningEffort ?? '').trim()
  return {
    provider,
    model,
    ...(reasoningEffort ? { reasoningEffort } : {}),
  }
}

function routeFromHeader(event) {
  return routeOf(event?.data?.header?.config)
}

function routeFromAssistant(event) {
  const source = event?.data?.message?.source
  if (!source || typeof source !== 'object') return undefined
  return routeOf(source)
}

function project(value) {
  const route = routeOf(value?.lastUsed)
  const pending = routeOf(value?.pending)
  return {
    lastUsed: route ?? null,
    ...(pending ? { pending } : {}),
  }
}

const projectionSchema = { parse: project }

export const modelSelectionProjectionDefinition = {
  key: MODEL_SELECTION_PROJECTION_KEY,
  stateVersion: 1,
  schema: projectionSchema,
  init: () => ({ lastUsed: null, pending: null }),
  apply: (state, event) => {
    const current = state && typeof state === 'object' ? state : { lastUsed: null, pending: null }
    if (event?.type === 'request/header') {
      const route = routeFromHeader(event)
      return route ? { ...current, pending: route, lastUsed: route } : current
    }
    if (event?.type === 'assistant/message') {
      const route = routeFromAssistant(event)
      return route ? { ...current, pending: null, lastUsed: route } : current
    }
    return current
  },
  view: project,
}

/** Register the projection when DSH exposes the optional service. */
export function installModelSelectionProjection(ctx, safeLog = () => {}) {
  if (typeof ctx?.inject !== 'function') return undefined
  try {
    ctx.inject(['sessionProjections'], (projectionCtx) => {
      try {
        const registry = projectionCtx?.sessionProjections
        if (!registry || typeof registry.register !== 'function') return
        const dispose = registry.register(modelSelectionProjectionDefinition)
        if (typeof dispose === 'function') return dispose
      } catch (error) {
        safeLog(ctx, 'dsh-tiered-model-router model projection unavailable', error)
      }
      return undefined
    })
  } catch (error) {
    safeLog(ctx, 'dsh-tiered-model-router could not attach model projection', error)
  }
  return undefined
}

