import { maxTier } from './classifier.js'
import { tierForRoute } from './config.js'

export function createStateStore() {
  const states = new WeakMap()
  return {
    get(agent) { return agent && typeof agent === 'object' ? states.get(agent) : undefined },
    set(agent, state) { if (agent && typeof agent === 'object') states.set(agent, state); return state },
    delete(agent) { if (agent && typeof agent === 'object') states.delete(agent) },
  }
}

export function beginTurn(store, agent, turn, classifiedTier, config) {
  const currentRoute = agent?.options
  const recognized = tierForRoute(currentRoute, config.tiers) !== undefined
  const managed = !config.policy.preserveExplicitSelection
    || config.policy.takeOverUnknownSelection
    || recognized
    || !currentRoute?.provider || !currentRoute?.model
  const state = {
    turn, tier: classifiedTier, initialTier: classifiedTier, managed,
    consecutiveToolFailures: 0, lastRequestStep: 0,
  }
  store.set(agent, state)
  return state
}

export function escalate(state, tier) {
  if (state) state.tier = maxTier(state.tier, tier)
  return state?.tier
}
