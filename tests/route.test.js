import test from 'node:test'
import assert from 'node:assert/strict'
import { rewriteCallConfig } from '../src/route.js'

test('rewrite preserves unrelated and future fields', () => {
  const original = {
    provider: 'old', model: 'old-model', reasoningEffort: 'low', maxTokens: 777,
    temperature: 0.2, tools: [{ name: 'x' }], futureField: { keep: true },
  }
  const next = rewriteCallConfig(original, { provider: 'new', model: 'new-model', reasoningEffort: 'max' })
  assert.deepEqual(next, {
    provider: 'new', model: 'new-model', reasoningEffort: 'max', maxTokens: 777,
    temperature: 0.2, tools: [{ name: 'x' }], futureField: { keep: true },
  })
  assert.deepEqual(original, {
    provider: 'old', model: 'old-model', reasoningEffort: 'low', maxTokens: 777,
    temperature: 0.2, tools: [{ name: 'x' }], futureField: { keep: true },
  })
})

test('omitted effort clears inherited effort and optional max token policy is honored', () => {
  assert.deepEqual(rewriteCallConfig(
    { provider: 'old', model: 'old-model', reasoningEffort: 'high', maxTokens: 10 },
    { provider: 'new', model: 'new-model' },
    { preserveMaxTokens: false },
  ), { provider: 'new', model: 'new-model' })
})

test('invalid inputs fail open', () => {
  const value = { provider: 'p', model: 'm', temperature: 0.5 }
  assert.equal(rewriteCallConfig(value, undefined), value)
  assert.equal(rewriteCallConfig(undefined, { provider: 'p', model: 'm' }), undefined)
})
