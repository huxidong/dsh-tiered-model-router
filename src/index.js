import { installDshAdapter, ROUTER_SETTINGS_NAMESPACE } from './dsh-adapter.js'
import { Config } from './config.js'

export const name = 'dsh-tiered-model-router'
export { ROUTER_SETTINGS_NAMESPACE }
export { Config }
export { classifyTask, extractMessageText } from './classifier.js'
export { normalizeConfig } from './config.js'
export { rewriteCallConfig } from './route.js'

/** DSH native plugin entrypoint. */
export function apply(ctx, config) {
  return installDshAdapter(ctx, config)
}
