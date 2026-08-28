/** @typedef {'easy'|'standard'|'hard'} Tier */

/** @typedef {{provider:string, model:string, reasoningEffort?:string, maxTokens?:number}} TierRoute */

/** @typedef {{
 * enabled?: boolean,
 * tiers: {easy: TierRoute, standard: TierRoute, hard: TierRoute},
 * policy?: object
 * }} RouterConfig */

export const TIERS = Object.freeze(['easy', 'standard', 'hard'])

/** @type {Readonly<Record<Tier, number>>} */
export const TIER_RANK = Object.freeze({ easy: 0, standard: 1, hard: 2 })
