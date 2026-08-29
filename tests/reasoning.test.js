import test from 'node:test'
import assert from 'node:assert/strict'
import {
  declaredReasoningEfforts,
  resolveReasoningEffort,
} from '../src/reasoning.js'

const model = (ids, defaultEffort) => ({
  reasoning: {
    efforts: ids.map((id) => ({ id })),
    ...(defaultEffort ? { defaultEffort } : {}),
  },
})

test('declared effort ids are detached safely', () => {
  assert.deepEqual(declaredReasoningEfforts(model(['off', 'high'])), ['off', 'high'])
  assert.equal(declaredReasoningEfforts({}), undefined)
})

test('next-higher raises low to the first supported level', () => {
  assert.equal(resolveReasoningEffort('low', model(['off', 'high'])), 'high')
  assert.equal(resolveReasoningEffort('medium', model(['off', 'high', 'max'])), 'high')
})

test('exact supported effort wins and max falls back to the strongest lower level', () => {
  assert.equal(resolveReasoningEffort('high', model(['off', 'high', 'max'])), 'high')
  assert.equal(resolveReasoningEffort('max', model(['off', 'high'])), 'high')
})

test('unknown metadata stays fail-open and explicit no-effort metadata clears the effort', () => {
  assert.equal(resolveReasoningEffort('low', {}, {}), 'low')
  assert.equal(resolveReasoningEffort('low', { reasoning: { efforts: [] } }), undefined)
})

test('fallback strategy and custom ordering are configurable', () => {
  const info = model(['off', 'high', 'max'])
  assert.equal(resolveReasoningEffort('low', info, { strategy: 'none' }), 'low')
  assert.equal(resolveReasoningEffort('low', info, { strategy: 'nearest', levelOrder: ['off', 'low', 'high', 'max'] }), 'high')
})
