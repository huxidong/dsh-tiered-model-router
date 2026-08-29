import test from 'node:test'
import assert from 'node:assert/strict'
import { installDshAdapter } from '../src/dsh-adapter.js'
import { normalizeConfig } from '../src/config.js'

function fakeContext() {
  const listeners = new Map()
  return {
    listeners,
    on(event, listener) {
      listeners.set(event, listener)
      return () => listeners.delete(event)
    },
  }
}

function fakeLlmContext(llm) {
  const ctx = fakeContext()
  ctx.get = (name) => name === 'llm' ? llm : undefined
  return ctx
}

function fakeSettingsContext(initial) {
  const listeners = new Map()
  let current = structuredClone(initial)
  const merge = (left, right) => {
    if (!left || typeof left !== 'object' || Array.isArray(left) || !right || typeof right !== 'object' || Array.isArray(right)) {
      return structuredClone(right === undefined ? left : right)
    }
    const result = structuredClone(left)
    for (const [key, value] of Object.entries(right)) result[key] = merge(result[key], value)
    return result
  }
  return {
    listeners,
    settings: {
      register(_namespace, _schema, { base }) {
        let value = merge(base, current)
        const watchers = new Set()
        return {
          get() { return value },
          watch(listener) { watchers.add(listener); return () => watchers.delete(listener) },
          set(next) {
            current = structuredClone(next)
            value = merge(base, current)
            for (const watcher of watchers) watcher(value)
          },
        }
      },
    },
    inject(_names, callback) { callback(this); return () => {} },
    effect(factory) { return factory() },
    on(event, listener) {
      listeners.set(event, listener)
      return () => listeners.delete(event)
    },
  }
}
function agent(options = { provider: 'p', model: 'standard' }, extra = {}) { return { options, ...extra } }
function baseConfig(extra = {}) {
  return {
    tiers: {
      easy: { provider: 'p', model: 'easy', reasoningEffort: 'low' },
      standard: { provider: 'p', model: 'standard', reasoningEffort: 'high' },
      hard: { provider: 'p', model: 'hard', reasoningEffort: 'max' },
    },
    policy: extra,
  }
}

test('adapter routes a turn and escalates monotonically after tool failures', async () => {
  const ctx = fakeContext()
  const dispose = installDshAdapter(ctx, baseConfig({ hardAfterToolFailures: 2 }))
  const subject = agent()
  const preStep = ctx.listeners.get('agent/pre-step')
  const request = ctx.listeners.get('agent/request')
  const result = ctx.listeners.get('tools/result')
  await preStep({ agent: subject, turn: 1, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  assert.equal((await request({ agent: subject, turn: 1, step: 1 }, async () => ({ provider: 'p', model: 'standard', reasoningEffort: 'high' }))).model, 'easy')
  result({ agent: subject, name: 'safe-tool' }, { isError: true })
  result({ agent: subject, name: 'safe-tool' }, { isError: true })
  assert.equal((await request({ agent: subject, turn: 1, step: 2 }, async () => ({ provider: 'p', model: 'easy', reasoningEffort: 'low' }))).model, 'hard')
  dispose()
  assert.equal(ctx.listeners.size, 0)
})

test('missing event fields and missing next callback fail open', async () => {
  const ctx = fakeContext()
  installDshAdapter(ctx, baseConfig())
  const pre = ctx.listeners.get('agent/pre-step')
  const request = ctx.listeners.get('agent/request')
  assert.doesNotReject(async () => pre({ messages: [] }))
  assert.deepEqual(await request({}, undefined), {})
})

test('an enabled router takes over an existing unknown route', async () => {
  const ctx = fakeContext()
  installDshAdapter(ctx, baseConfig())
  const subject = agent({ provider: 'custom', model: 'manual' })
  await ctx.listeners.get('agent/pre-step')({ agent: subject, turn: 1, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  const current = { provider: 'custom', model: 'manual', temperature: 0.3 }
  assert.deepEqual(await ctx.listeners.get('agent/request')({ agent: subject, turn: 1, step: 1 }, async () => current), {
    provider: 'p', model: 'easy', temperature: 0.3,
  })
})

test('a disabled router preserves the manually selected route', async () => {
  const ctx = fakeContext()
  installDshAdapter(ctx, { ...baseConfig(), enabled: false })
  const subject = agent({ provider: 'custom', model: 'manual' })
  const current = { provider: 'custom', model: 'manual', temperature: 0.3 }
  assert.deepEqual(await ctx.listeners.get('agent/request')({ agent: subject, turn: 1, step: 1 }, async () => current), current)
})

test('configured hard tool escalates even when it succeeds', async () => {
  const ctx = fakeContext()
  installDshAdapter(ctx, baseConfig())
  const subject = agent()
  await ctx.listeners.get('agent/pre-step')({ agent: subject, turn: 1, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  const result = ctx.listeners.get('tools/result')
  result({ agent: subject, name: 'apply_patch' }, { isError: false })
  const routed = await ctx.listeners.get('agent/request')({ agent: subject, turn: 1, step: 1 }, async () => ({ provider: 'p', model: 'easy' }))
  assert.equal(routed.model, 'hard')
})

test('cache-aware routing holds an upgraded session tier across later turns', async () => {
  const ctx = fakeContext()
  installDshAdapter(ctx, baseConfig())
  const subject = agent()
  const preStep = ctx.listeners.get('agent/pre-step')
  const request = ctx.listeners.get('agent/request')
  await preStep({ agent: subject, turn: 1, step: 1, messages: [{ content: 'production migration with concurrency control' }] }, async () => ({ kind: 'enter', messages: [] }))
  assert.equal((await request({ agent: subject, turn: 1, step: 1 }, async () => ({ provider: 'p', model: 'standard' }))).model, 'hard')
  await preStep({ agent: subject, turn: 2, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  assert.equal((await request({ agent: subject, turn: 2, step: 1 }, async () => ({ provider: 'p', model: 'standard' }))).model, 'hard')
})

test('cache-aware routing keeps the first request on an already selected higher tier', async () => {
  const ctx = fakeContext()
  installDshAdapter(ctx, baseConfig())
  const subject = agent({ provider: 'p', model: 'hard' }, {
    session: { requestHeader: () => ({ config: { provider: 'p', model: 'hard' } }) },
  })
  const preStep = ctx.listeners.get('agent/pre-step')
  const request = ctx.listeners.get('agent/request')
  await preStep({ agent: subject, turn: 1, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  assert.equal((await request({ agent: subject, turn: 1, step: 1 }, async () => ({ provider: 'p', model: 'hard' }))).model, 'hard')
})

test('cache-aware routing can be disabled when per-turn downshifts are preferred', async () => {
  const ctx = fakeContext()
  installDshAdapter(ctx, baseConfig({ cacheAwareRouting: false }))
  const subject = agent()
  const preStep = ctx.listeners.get('agent/pre-step')
  const request = ctx.listeners.get('agent/request')
  await preStep({ agent: subject, turn: 1, step: 1, messages: [{ content: 'production migration with concurrency control' }] }, async () => ({ kind: 'enter', messages: [] }))
  assert.equal((await request({ agent: subject, turn: 1, step: 1 }, async () => ({ provider: 'p', model: 'standard' }))).model, 'hard')
  await preStep({ agent: subject, turn: 2, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  assert.equal((await request({ agent: subject, turn: 2, step: 1 }, async () => ({ provider: 'p', model: 'standard' }))).model, 'easy')
})

test('ordinary later steps do not change the model unless step escalation is enabled', async () => {
  const ctx = fakeContext()
  installDshAdapter(ctx, baseConfig())
  const subject = agent()
  const preStep = ctx.listeners.get('agent/pre-step')
  const request = ctx.listeners.get('agent/request')
  await preStep({ agent: subject, turn: 1, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  assert.equal((await request({ agent: subject, turn: 1, step: 3 }, async () => ({ provider: 'p', model: 'easy' }))).model, 'easy')
})

test('subagent sessions use their own task route by default', async () => {
  const ctx = fakeContext()
  installDshAdapter(ctx, baseConfig())
  const subject = agent({ provider: 'p', model: 'standard' }, {
    session: { header: { origin: 'subagent', parentSession: 'parent-session' } },
  })
  await ctx.listeners.get('agent/pre-step')({ agent: subject, turn: 1, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  const routed = await ctx.listeners.get('agent/request')({ agent: subject, turn: 1, step: 1 }, async () => ({ provider: 'p', model: 'standard' }))
  assert.equal(routed.model, 'easy')
})

test('subagent routing can be explicitly disabled', async () => {
  const ctx = fakeContext()
  installDshAdapter(ctx, baseConfig({ routeSubagents: false }))
  const subject = agent({ provider: 'p', model: 'standard' }, {
    session: { header: { origin: 'subagent', parentSession: 'parent-session' } },
  })
  const current = { provider: 'p', model: 'standard' }
  await ctx.listeners.get('agent/pre-step')({ agent: subject, turn: 1, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  assert.deepEqual(await ctx.listeners.get('agent/request')({ agent: subject, turn: 1, step: 1 }, async () => current), current)
})

test('a normal session fork with only parentSession is not treated as a subagent', async () => {
  const ctx = fakeContext()
  installDshAdapter(ctx, baseConfig({ routeSubagents: false }))
  const subject = agent({ provider: 'p', model: 'standard' }, {
    session: { header: { parentSession: 'forked-session' } },
  })
  const preStep = ctx.listeners.get('agent/pre-step')
  const request = ctx.listeners.get('agent/request')
  await preStep({ agent: subject, turn: 1, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  assert.equal((await request({ agent: subject, turn: 1, step: 1 }, async () => ({ provider: 'p', model: 'standard' }))).model, 'easy')
})

test('invalid config installs a no-op adapter', () => {
  const ctx = fakeContext()
  const dispose = installDshAdapter(ctx, { nope: true })
  assert.equal(ctx.listeners.size, 0)
  assert.doesNotThrow(dispose)
  assert.equal(normalizeConfig({ nope: true }), undefined)
})

test('settings overrides are read and applied live', async () => {
  const ctx = fakeSettingsContext({ enabled: true, tiers: { easy: { provider: 'p', model: 'gui-easy' } } })
  installDshAdapter(ctx, baseConfig())
  const subject = agent()
  await ctx.listeners.get('agent/pre-step')({ agent: subject, turn: 1, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  const first = await ctx.listeners.get('agent/request')({ agent: subject, turn: 1, step: 1 }, async () => ({ provider: 'p', model: 'standard' }))
  assert.equal(first.model, 'gui-easy')
})

test('settings integration is fail-open when a stored value is unusable', async () => {
  const identical = { provider: 'p', model: 'same', reasoningEffort: 'same', maxTokens: 1 }
  const ctx = fakeSettingsContext({ tiers: { easy: identical, standard: identical, hard: identical } })
  installDshAdapter(ctx, baseConfig())
  const subject = agent()
  await ctx.listeners.get('agent/pre-step')({ agent: subject, turn: 1, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  const routed = await ctx.listeners.get('agent/request')({ agent: subject, turn: 1, step: 1 }, async () => ({ provider: 'p', model: 'standard' }))
  assert.equal(routed.model, 'easy')
})

test('adapter raises an unsupported effort to the next declared model level', async () => {
  const ctx = fakeLlmContext({
    resolveModelInfo: async () => ({
      reasoning: {
        efforts: [{ id: 'off' }, { id: 'high' }],
        defaultEffort: 'high',
      },
    }),
  })
  installDshAdapter(ctx, baseConfig())
  const subject = agent()
  await ctx.listeners.get('agent/pre-step')({ agent: subject, turn: 1, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  const routed = await ctx.listeners.get('agent/request')({ agent: subject, turn: 1, step: 1 }, async () => ({ provider: 'p', model: 'standard' }))
  assert.equal(routed.model, 'easy')
  assert.equal(routed.reasoningEffort, 'high')
})

test('adapter does not crash when capability lookup fails', async () => {
  const ctx = fakeLlmContext({ resolveModelInfo: async () => { throw new Error('offline') } })
  installDshAdapter(ctx, baseConfig())
  const subject = agent()
  await ctx.listeners.get('agent/pre-step')({ agent: subject, turn: 1, step: 1, messages: [{ content: 'hello' }] }, async () => ({ kind: 'enter', messages: [] }))
  const routed = await ctx.listeners.get('agent/request')({ agent: subject, turn: 1, step: 1 }, async () => ({ provider: 'p', model: 'standard' }))
  assert.equal(routed.model, 'easy')
  assert.equal('reasoningEffort' in routed, false)
})
