/** Normalize provider/model discovery into one stable UI and validation shape. */

function text(value) {
  const result = String(value ?? '').trim()
  return result || undefined
}

/**
 * Providers are the authoritative owner of a model route in DSH. A model's
 * optional provider field is therefore ignored in favor of its parent row.
 */
export function normalizeModelPool(input) {
  if (!Array.isArray(input)) return []
  const providers = []
  const providerSeen = new Set()
  for (const rawProvider of input) {
    const id = text(rawProvider?.id ?? rawProvider?.provider)
    if (!id || providerSeen.has(id)) continue
    providerSeen.add(id)
    const name = text(rawProvider?.name ?? rawProvider?.displayName) ?? id
    const models = []
    const modelSeen = new Set()
    for (const rawModel of Array.isArray(rawProvider?.models) ? rawProvider.models : []) {
      const modelId = text(rawModel?.id ?? rawModel?.model)
      if (!modelId || modelSeen.has(modelId)) continue
      modelSeen.add(modelId)
      const modelName = text(rawModel?.name ?? rawModel?.displayName) ?? modelId
      const reasoningEfforts = Array.isArray(rawModel?.reasoningEfforts)
        ? rawModel.reasoningEfforts.map(text).filter(Boolean)
        : []
      models.push({
        id: modelId,
        name: modelName,
        reasoningEfforts: [...new Set(reasoningEfforts)],
      })
    }
    providers.push({ id, name, models })
  }
  return providers
}

export function modelPoolContains(pool, provider, model) {
  const providerRow = Array.isArray(pool) ? pool.find((row) => row?.id === provider) : undefined
  return Boolean(providerRow?.models?.some((row) => row?.id === model))
}

export const MODEL_POOL_LIMITS = Object.freeze({ providers: 32, models: 200 })

export function modelPoolStats(pool) {
  const providers = Array.isArray(pool) ? pool.length : 0
  const models = Array.isArray(pool)
    ? pool.reduce((total, provider) => total + (Array.isArray(provider?.models) ? provider.models.length : 0), 0)
    : 0
  return { providers, models }
}

export function assertModelPoolSize(pool, limits = MODEL_POOL_LIMITS) {
  const stats = modelPoolStats(pool)
  if (stats.providers > limits.providers || stats.models > limits.models) {
    const error = new Error('模型池过大，暂不支持')
    error.code = 'MODEL_POOL_TOO_LARGE'
    error.stats = stats
    throw error
  }
  return stats
}
