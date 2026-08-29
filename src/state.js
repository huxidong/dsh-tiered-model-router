import { maxTier } from './classifier.js'

export function createStateStore() {
  const states = new WeakMap()
  return {
    get(agent) { return agent && typeof agent === 'object' ? states.get(agent) : undefined },
    set(agent, state) { if (agent && typeof agent === 'object') states.set(agent, state); return state },
    delete(agent) { if (agent && typeof agent === 'object') states.delete(agent) },
  }
}

export function beginTurn(store, agent, turn, classifiedTier, config, currentTier) {
  // The enabled setting is the source of truth for ownership. The model-seat
  // UI turns it off before a manual selection, so an enabled router must also
  // take over a host's pre-existing/unknown route instead of showing Auto while
  // silently forwarding that route unchanged.
  const managed = config.enabled !== false
  const previous = store.get(agent)
  const sessionTier = config.policy.cacheAwareRouting === true
    ? maxTier(previous?.sessionTier ?? currentTier ?? classifiedTier, classifiedTier)
    : classifiedTier
  const state = {
    turn, tier: sessionTier, initialTier: classifiedTier, sessionTier, managed,
    consecutiveToolFailures: 0, lastRequestStep: 0, routingDepth: 0,
  }
  store.set(agent, state)
  return state
}

export function escalate(state, tier) {
  if (state) {
    state.tier = maxTier(state.tier, tier)
    state.sessionTier = maxTier(state.sessionTier ?? state.tier, tier)
  }
  return state?.tier
}
