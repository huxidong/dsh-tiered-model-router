/**
 * Resolve a requested reasoning level against the exact capabilities reported
 * by DSH. The resolver is deliberately independent from providers so new
 * model families can use the same routing policy without code changes.
 */

export const DEFAULT_REASONING_LEVEL_ORDER = Object.freeze([
  'off', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra',
])

const FALLBACK_STRATEGIES = new Set(['next-higher', 'nearest', 'none'])

function text(value) {
  const normalized = String(value ?? '').trim().toLocaleLowerCase()
  return normalized || undefined
}

function unique(values) {
  return [...new Set(values.map(text).filter(Boolean))]
}

function normalizedOrder(value) {
  const order = unique(Array.isArray(value) ? value : DEFAULT_REASONING_LEVEL_ORDER)
  return order.length > 0 ? order : [...DEFAULT_REASONING_LEVEL_ORDER]
}

/**
 * Return the adapter-declared effort ids, or undefined when DSH did not expose
 * reasoning metadata for this model. An empty array is an explicit declaration
 * that the model has no selectable reasoning efforts.
 */
export function declaredReasoningEfforts(modelInfo) {
  const efforts = modelInfo?.reasoning?.efforts
  if (!Array.isArray(efforts)) return undefined
  return efforts
    .map((effort) => String(effort?.id ?? '').trim())
    .filter(Boolean)
}

/**
 * Resolve a configured effort against model capabilities.
 *
 * - An exact supported effort always wins.
 * - `next-higher` selects the smallest supported level above the request. If
 *   no higher level exists, it selects the strongest lower level so the request
 *   still remains valid instead of sending an unsupported id.
 * - `nearest` selects the closest known level, preferring the higher one.
 * - `none` preserves the configured value for providers with custom semantics.
 *
 * When DSH has not supplied reasoning metadata, the original value is kept so
 * third-party adapters remain forward-compatible. When DSH explicitly reports
 * no efforts, the model default is used when available, otherwise the effort is
 * removed from the request.
 */
export function resolveReasoningEffort(requested, modelInfo, options = {}) {
  const requestedText = text(requested)
  if (!requestedText) return undefined

  const declared = declaredReasoningEfforts(modelInfo)
  if (declared === undefined) return String(requested).trim()

  const supported = declared.map((id) => ({ id, key: text(id) })).filter((entry) => entry.key)
  if (supported.length === 0) {
    const defaultEffort = text(modelInfo?.reasoning?.defaultEffort)
    return defaultEffort ? String(modelInfo.reasoning.defaultEffort).trim() : undefined
  }

  const exact = supported.find((entry) => entry.key === requestedText)
  if (exact) return exact.id

  const strategy = FALLBACK_STRATEGIES.has(options.strategy) ? options.strategy : 'next-higher'
  if (strategy === 'none') return String(requested).trim()

  const order = normalizedOrder(options.levelOrder)
  const rank = new Map(order.map((level, index) => [level, index]))
  const requestedRank = rank.get(requestedText)
  if (requestedRank === undefined) {
    const defaultEffort = text(modelInfo?.reasoning?.defaultEffort)
    const defaultEntry = supported.find((entry) => entry.key === defaultEffort)
    return defaultEntry?.id ?? supported[0].id
  }

  const ranked = supported
    .map((entry, index) => ({ ...entry, rank: rank.get(entry.key), index }))
    .filter((entry) => entry.rank !== undefined)

  if (ranked.length === 0) {
    const defaultEffort = text(modelInfo?.reasoning?.defaultEffort)
    const defaultEntry = supported.find((entry) => entry.key === defaultEffort)
    return defaultEntry?.id ?? supported[0].id
  }

  if (strategy === 'nearest') {
    ranked.sort((left, right) => {
      const distance = Math.abs(left.rank - requestedRank) - Math.abs(right.rank - requestedRank)
      if (distance !== 0) return distance
      return right.rank - left.rank || left.index - right.index
    })
    return ranked[0].id
  }

  const higher = ranked.filter((entry) => entry.rank > requestedRank)
  if (higher.length > 0) {
    higher.sort((left, right) => left.rank - right.rank || left.index - right.index)
    return higher[0].id
  }

  const lower = ranked.filter((entry) => entry.rank < requestedRank)
  if (lower.length > 0) {
    lower.sort((left, right) => right.rank - left.rank || left.index - right.index)
    return lower[0].id
  }
  return ranked[0].id
}
