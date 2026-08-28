import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyTask, extractMessageText } from '../src/classifier.js'
import { normalizeConfig } from '../src/config.js'

const config = normalizeConfig({
  tiers: {
    easy: { provider: 'p', model: 'easy' },
    standard: { provider: 'p', model: 'standard' },
    hard: { provider: 'p', model: 'hard' },
  },
})

test('extractMessageText ignores malformed content and keeps text blocks', () => {
  assert.equal(extractMessageText([
    null,
    { content: [{ type: 'text', text: 'hello' }, { type: 'image', url: 'x' }] },
    { content: 'world' },
    { content: [{ text: '!' }] },
    { content: [{ type: 'text', text: 42 }] },
  ]), 'hello world !')
})

test('classifies easy, standard and hard tasks deterministically', () => {
  assert.equal(classifyTask([{ content: 'hello' }], config.policy).tier, 'easy')
  assert.equal(classifyTask([{ content: 'please edit this file and run the test' }], config.policy).tier, 'standard')
  assert.equal(classifyTask([{ content: 'review the production migration and analyze the race condition' }], config.policy).tier, 'hard')
})

test('long input and tool intent never remain easy', () => {
  assert.equal(classifyTask([{ content: 'x'.repeat(2600) }], config.policy).tier, 'hard')
  assert.equal(classifyTask([{ content: 'run the command in the terminal' }], config.policy).tier, 'standard')
})

test('malformed input falls back to configured default without throwing', () => {
  assert.equal(classifyTask(undefined, config.policy).tier, 'standard')
  assert.equal(classifyTask([undefined, { content: [] }], config.policy).tier, 'standard')
})
