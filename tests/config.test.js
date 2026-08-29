import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeConfig, tierForRoute } from '../src/config.js'

const routes = {
  easy: { provider: ' p ', model: 'easy', reasoningEffort: 'low' },
  standard: { provider: 'p', model: 'standard' },
  hard: { provider: 'p', model: 'hard', maxTokens: 2048 },
}

test('normalizes valid config and clamps inconsistent thresholds', () => {
  const config = normalizeConfig({ tiers: routes, policy: { standardAtChars: 3000, hardAtChars: 100 } })
  assert.equal(config.tiers.easy.provider, 'p')
  assert.equal(config.policy.standardAtChars, 100)
  assert.equal(config.policy.hardAtChars, 3000)
  assert.equal(tierForRoute({ provider: 'p', model: 'hard' }, config.tiers), 'hard')
})

test('malformed or identical routes request fail-open mode', () => {
  assert.equal(normalizeConfig(null), undefined)
  assert.equal(normalizeConfig({ tiers: { easy: routes.easy } }), undefined)
  assert.equal(normalizeConfig({ tiers: { easy: routes.easy, standard: routes.easy, hard: routes.easy } }), undefined)
})

test('custom hard keywords retain built-in multilingual safety signals', () => {
  const config = normalizeConfig({
    tiers: { easy: routes.easy, standard: routes.standard, hard: routes.hard },
    policy: { hardKeywords: ['production'] },
  })
  assert.ok(config.policy.hardKeywords.includes('production'))
  assert.ok(config.policy.hardKeywords.includes('数据库'))
  assert.ok(config.policy.hardKeywords.includes('并发'))
})
