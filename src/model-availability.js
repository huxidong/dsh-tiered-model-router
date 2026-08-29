/**
 * Small, provider-neutral model availability probe.
 *
 * Model metadata can prove that a route exists, but it cannot prove that the
 * provider account still has quota. This module performs one bounded stream
 * request and classifies only stable DSH failure codes as definitive.
 */

export const MODEL_CHECK_TIMEOUT_MS = 8_000
export const MODEL_CHECK_MAX_TOKENS = 1

const DEFINITIVE_UNAVAILABLE_CODES = new Set([
  'QUOTA',
  'AUTH',
  'INVALID_CREDENTIAL',
  'MISSING_CREDENTIAL',
  'NO_ADAPTER',
  'MODEL_NOT_FOUND',
  'INVALID_MODEL',
  'INVALID_MODEL_INFO',
])

function text(value) {
  const result = String(value ?? '').trim()
  return result || undefined
}

function errorCode(value) {
  const direct = text(value?.code)
  if (direct) return direct.toUpperCase()
  const failure = value?.failure
  const nested = text(failure?.code)
  return nested ? nested.toUpperCase() : undefined
}

function errorMessage(value) {
  const direct = text(value?.message)
  if (direct) return direct
  const failure = text(value?.failure?.message)
  return failure ?? '模型可用性检查失败'
}

function classifyFailure(value) {
  const code = errorCode(value)
  if (code === 'QUOTA') {
    return { status: 'unavailable', code, reason: 'quota', message: '模型不可用：账户余额或调用额度已耗尽' }
  }
  if (DEFINITIVE_UNAVAILABLE_CODES.has(code)) {
    return { status: 'unavailable', code, reason: 'provider-rejected', message: errorMessage(value) }
  }
  return { status: 'unknown', code: code ?? 'CHECK_FAILED', reason: 'temporary-failure', message: errorMessage(value) }
}

function probeMessage() {
  const cryptoApi = globalThis.crypto
  const id = typeof cryptoApi?.randomUUID === 'function'
    ? cryptoApi.randomUUID()
    : `dsh-model-check-${Date.now()}-${Math.random().toString(16).slice(2)}`
  return {
    id,
    role: 'user',
    content: [{ type: 'text', text: '请只回复 1。' }],
    source: { kind: 'user' },
  }
}

function finishResult(reason) {
  if (!reason || typeof reason !== 'object') return undefined
  if (reason.kind === 'error') return classifyFailure(reason.failure)
  if (reason.kind === 'aborted') return { status: 'unknown', code: 'CHECK_ABORTED', reason: 'timeout', message: '模型可用性检查超时或被取消' }
  if (reason.kind === 'stop' || reason.kind === 'tool-calls' || reason.kind === 'max-tokens') {
    return { status: 'available', code: 'OK', reason: 'probe-succeeded', message: '模型可用' }
  }
  return undefined
}

async function consumeStream(stream, timeoutMs, controller) {
  const iterator = stream[Symbol.asyncIterator]()
  let timer
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => {
      try { controller?.abort() } catch { /* best effort */ }
      resolve({ status: 'unknown', code: 'CHECK_TIMEOUT', reason: 'timeout', message: '模型可用性检查超时，暂时无法确认' })
    }, timeoutMs)
  })
  const consume = (async () => {
    try {
      while (true) {
        const step = await iterator.next()
        if (step?.done) return { status: 'unknown', code: 'CHECK_NO_FINISH', reason: 'invalid-response', message: '模型可用性检查未返回完成状态' }
        const chunk = step.value
        if (chunk?.type !== 'finish') continue
        const result = finishResult(chunk.reason)
        if (result) return result
      }
    } catch (error) {
      return classifyFailure(error)
    }
  })()
  try {
    return await Promise.race([consume, timeout])
  } finally {
    clearTimeout(timer)
    // Do not wait for a provider iterator that ignored cancellation. A
    // best-effort return prevents well-behaved streams from leaking resources.
    try { await Promise.race([Promise.resolve(iterator.return?.()), new Promise((resolve) => setTimeout(resolve, 100))]) } catch { /* best effort */ }
  }
}

/**
 * Probe one exact provider/model route.
 * The function never throws for provider or transport failures; callers get a
 * three-state result (`available`, `unavailable`, `unknown`) instead.
 */
export async function checkModelAvailability(llm, options = {}) {
  const provider = text(options.provider)
  const model = text(options.model)
  if (!provider || !model) {
    return { status: 'unknown', code: 'INVALID_REQUEST', reason: 'invalid-request', message: '模型提供商和模型不能为空' }
  }
  if (!llm || typeof llm.stream !== 'function') {
    return { status: 'unknown', code: 'CHECK_UNAVAILABLE', reason: 'unsupported', message: '当前 DSH 不支持模型可用性检查' }
  }
  const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
    ? Math.min(Math.floor(options.timeoutMs), 30_000)
    : MODEL_CHECK_TIMEOUT_MS
  const controller = typeof AbortController === 'function' ? new AbortController() : undefined
  try {
    const request = {
      provider,
      model,
      messages: [probeMessage()],
      temperature: 0,
      maxTokens: MODEL_CHECK_MAX_TOKENS,
      ...(controller ? { signal: controller.signal } : {}),
    }
    let stream
    try {
      stream = await llm.stream(request)
    } catch (error) {
      return classifyFailure(error)
    }
    if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') {
      return { status: 'unknown', code: 'CHECK_INVALID_STREAM', reason: 'invalid-response', message: '模型可用性检查返回了无效结果' }
    }
    return await consumeStream(stream, timeoutMs, controller)
  } catch (error) {
    if (controller?.signal.aborted) {
      return { status: 'unknown', code: 'CHECK_TIMEOUT', reason: 'timeout', message: '模型可用性检查超时，暂时无法确认' }
    }
    return classifyFailure(error)
  }
}

export { DEFINITIVE_UNAVAILABLE_CODES }
