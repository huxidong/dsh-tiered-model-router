import { installDshAdapter, ROUTER_SETTINGS_NAMESPACE } from './dsh-adapter.js'
import { Config } from './config.js'

export const name = 'dsh-tiered-model-router'
export { ROUTER_SETTINGS_NAMESPACE }
export { Config }
export { classifyTask, extractMessageText } from './classifier.js'
export { normalizeConfig } from './config.js'
export { rewriteCallConfig } from './route.js'
export { DEFAULT_REASONING_LEVEL_ORDER, declaredReasoningEfforts, resolveReasoningEffort } from './reasoning.js'
export { assertModelPoolSize, MODEL_POOL_LIMITS, modelPoolContains, modelPoolStats, normalizeModelPool } from './model-pool.js'
export { checkModelAvailability, MODEL_CHECK_TIMEOUT_MS, MODEL_CHECK_MAX_TOKENS } from './model-availability.js'

/** DSH native plugin entrypoint. */
export function apply(ctx, config) {
  return installDshAdapter(ctx, config)
}
