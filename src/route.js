import { routeKey } from './config.js'

/** Compare only provider/model identity. Effort and token defaults may differ. */
export function sameDestination(config, route) {
  return Boolean(config && route && routeKey(config) === routeKey(route))
}

/**
 * Return a new call config with only the selected route fields changed. Unknown
 * fields survive untouched so future DSH/LlmCallConfig additions are preserved.
 */
export function rewriteCallConfig(config, route, options = {}) {
  if (!config || typeof config !== 'object' || !route) return config
  const next = { ...config, provider: route.provider, model: route.model }
  const clearEffort = options.clearReasoningEffortWhenUnset !== false
  if (route.reasoningEffort !== undefined) next.reasoningEffort = route.reasoningEffort
  else if (clearEffort) delete next.reasoningEffort
  if (route.maxTokens !== undefined) next.maxTokens = route.maxTokens
  else if (options.preserveMaxTokens === false) delete next.maxTokens
  return next
}
