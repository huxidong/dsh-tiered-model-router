import test from 'node:test'
import assert from 'node:assert/strict'
import { checkModelAvailability } from '../src/model-availability.js'

function llmFrom(streamFactory) {
  return { stream: (options) => streamFactory(options) }
}

test('availability probe marks a normal finish as available', async () => {
  let request
  const result = await checkModelAvailability(llmFrom((options) => {
    request = options
    return (async function* () {
      yield { type: 'finish', reason: { kind: 'stop' } }
    })()
  }), { provider: 'p', model: 'm' })
  assert.equal(result.status, 'available')
  assert.equal(request.provider, 'p')
  assert.equal(request.model, 'm')
  assert.equal(request.maxTokens, 1)
  assert.equal(request.messages[0].source.kind, 'user')
})

test('availability probe identifies quota exhaustion without throwing', async () => {
  const result = await checkModelAvailability(llmFrom(() => (async function* () {
    yield { type: 'finish', reason: { kind: 'error', failure: { code: 'QUOTA', message: 'quota exhausted' } } }
  })()), { provider: 'p', model: 'm' })
  assert.deepEqual(result, {
    status: 'unavailable',
    code: 'QUOTA',
    reason: 'quota',
    message: '模型不可用：账户余额或调用额度已耗尽',
  })
})

test('transport errors remain unknown rather than being mistaken for quota', async () => {
  const result = await checkModelAvailability(llmFrom(() => { throw Object.assign(new Error('offline'), { code: 'ECONNRESET' }) }), { provider: 'p', model: 'm' })
  assert.equal(result.status, 'unknown')
  assert.equal(result.code, 'ECONNRESET')
})

test('a stream that ignores cancellation is still bounded by timeout', async () => {
  const started = Date.now()
  const result = await checkModelAvailability(llmFrom(() => ({
    [Symbol.asyncIterator]() {
      return {
        next: () => new Promise(() => {}),
        return: async () => ({ done: true }),
      }
    },
  })), { provider: 'p', model: 'm', timeoutMs: 25 })
  assert.equal(result.status, 'unknown')
  assert.equal(result.code, 'CHECK_TIMEOUT')
  assert.ok(Date.now() - started < 1000)
})

test('missing route fields fail closed for the check request only', async () => {
  const result = await checkModelAvailability({ stream() { throw new Error('must not run') } }, { provider: '', model: '' })
  assert.equal(result.status, 'unknown')
  assert.equal(result.code, 'INVALID_REQUEST')
})
