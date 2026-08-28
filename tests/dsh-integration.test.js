import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const upstream = process.env.DSH_UPSTREAM_DIR ?? 'C:/Users/X13/AppData/Local/Temp/deepseek-harness'
const load = (relative) => import(pathToFileURL(`${upstream}/${relative}`).href)

const router = await import('../src/index.js')
const dshAvailable = existsSync(`${upstream}/packages/core/agent-loop/lib/index.js`)
const dsh = dshAvailable
  ? await Promise.all([
    load('vendor/cordis/lib/index.js'),
    load('packages/llm/llm/lib/index.js'),
    load('packages/core/session/lib/index.js'),
    load('packages/core/system-prompt/lib/index.js'),
    load('packages/core/tools/lib/index.js'),
    load('packages/core/agent/lib/index.js'),
    load('packages/core/agent-loop/lib/index.js'),
    load('packages/settings/settings/lib/index.js'),
  ])
  : undefined
const [{ Context } = {}, llm, session, systemPrompt, tools, agent, agentLoop, settings] = dsh ?? []

class TestAdapter extends llm.LlmAdapter {
  requests = []
  async *stream(options) {
    this.requests.push(options)
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: 'ok' }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: 'ok' } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
  resolveModel(provider, model) {
    return Promise.resolve({
      provider, id: model, name: model,
      reasoning: {
        efforts: ['low', 'high', 'max'].map((id) => ({ id: llm.ReasoningEffortId(id), name: id })),
        defaultEffort: llm.ReasoningEffortId('high'),
      },
    })
  }
}

class MemorySettings extends (settings?.SettingsProvider ?? class {}) {
  constructor(ctx, options = {}) {
    super(ctx)
    this.doc = structuredClone(options.doc ?? {})
  }

  get writable() { return true }

  load() { return Promise.resolve(structuredClone(this.doc)) }

  persist(namespace, section) {
    this.doc[namespace] = structuredClone(section)
    return Promise.resolve()
  }
}

async function makeHarness(config) {
  const ctx = new Context()
  await ctx.plugin(llm.LlmRuntime)
  await ctx.plugin(session.default ?? session.SessionStore)
  await ctx.plugin(systemPrompt.default ?? systemPrompt)
  await ctx.plugin(tools.default ?? tools.ToolRuntime)
  await ctx.plugin(agent.default ?? agent.AgentRegistry)
  await ctx.plugin(agentLoop.default ?? agentLoop.AgentLoop, { agents: [] })
  const adapter = new TestAdapter()
  ctx.llm.registerAdapter(['p'], adapter)
  await ctx.plugin({ name: router.name, apply: (pluginCtx) => router.apply(pluginCtx, config) })
  return { ctx, adapter }
}

async function makeSettingsHarness(config, settingsDoc = {}) {
  const ctx = new Context()
  await ctx.plugin(settings.SettingsProvider === undefined ? { apply() {} } : MemorySettings, { doc: settingsDoc })
  await ctx.plugin(llm.LlmRuntime)
  await ctx.plugin(session.default ?? session.SessionStore)
  await ctx.plugin(systemPrompt.default ?? systemPrompt)
  await ctx.plugin(tools.default ?? tools.ToolRuntime)
  await ctx.plugin(agent.default ?? agent.AgentRegistry)
  await ctx.plugin(agentLoop.default ?? agentLoop.AgentLoop, { agents: [] })
  const adapter = new TestAdapter()
  ctx.llm.registerAdapter(['p'], adapter)
  await ctx.plugin({ name: router.name, apply: (pluginCtx) => router.apply(pluginCtx, config) })
  return { ctx, adapter, settings: ctx.settings }
}

function send(subject, content) {
  subject.followup(llm.createUserMessage({
    content: [{ type: 'text', text: content }],
    source: { kind: 'user' },
  }))
}

test('real DSH loop receives routed request and records changed request header', { skip: !dshAvailable }, async () => {
  const { ctx, adapter } = await makeHarness({
    tiers: {
      easy: { provider: 'p', model: 'dsh-fast', reasoningEffort: 'low' },
      standard: { provider: 'p', model: 'dsh-standard', reasoningEffort: 'high' },
      hard: { provider: 'p', model: 'dsh-strong', reasoningEffort: 'max' },
    },
  })
  const subject = ctx.agentLoop.create(session.SessionId('router-integration'), { provider: 'p', model: 'dsh-standard' })
  send(subject, 'hello')
  await subject.whenIdle()
  assert.equal(adapter.requests.length, 1)
  assert.equal(adapter.requests[0].provider, 'p')
  assert.equal(adapter.requests[0].model, 'dsh-fast')
  assert.equal(adapter.requests[0].reasoningEffort, 'low')
  assert.ok(subject.session.events.some((event) => event.type === 'request/header' && event.data.header.config.model === 'dsh-fast'))
})

test('real DSH loop preserves an explicitly selected unknown route', { skip: !dshAvailable }, async () => {
  const { ctx, adapter } = await makeHarness({
    tiers: {
      easy: { provider: 'p', model: 'dsh-fast' },
      standard: { provider: 'p', model: 'dsh-standard' },
      hard: { provider: 'p', model: 'dsh-strong' },
    },
  })
  const subject = ctx.agentLoop.create(session.SessionId('router-manual'), { provider: 'p', model: 'manual-model' })
  send(subject, 'hello')
  await subject.whenIdle()
  assert.equal(adapter.requests.length, 1)
  assert.equal(adapter.requests[0].model, 'manual-model')
})

test('real DSH Settings registration overrides and updates routing live', { skip: !dshAvailable }, async () => {
  const config = {
    tiers: {
      easy: { provider: 'p', model: 'composition-easy', reasoningEffort: 'low' },
      standard: { provider: 'p', model: 'composition-standard', reasoningEffort: 'high' },
      hard: { provider: 'p', model: 'composition-hard', reasoningEffort: 'max' },
    },
  }
  const { ctx, adapter, settings: provider } = await makeSettingsHarness(config, {
    'dsh-tiered-model-router': { tiers: { easy: { model: 'settings-easy' } } },
  })
  const subject = ctx.agentLoop.create(session.SessionId('router-settings'), { provider: 'p', model: 'composition-standard' })
  send(subject, 'hello')
  await subject.whenIdle()
  assert.equal(adapter.requests.at(-1).model, 'settings-easy')

  await provider.update('dsh-tiered-model-router', { tiers: { easy: { model: 'updated-easy' } } })
  const second = ctx.agentLoop.create(session.SessionId('router-settings-updated'), { provider: 'p', model: 'composition-standard' })
  send(second, 'hello')
  await second.whenIdle()
  assert.equal(adapter.requests.at(-1).model, 'updated-easy')
})

test('malformed persisted settings do not disable the composition route', { skip: !dshAvailable }, async () => {
  const config = {
    tiers: {
      easy: { provider: 'p', model: 'composition-easy' },
      standard: { provider: 'p', model: 'composition-standard' },
      hard: { provider: 'p', model: 'composition-hard' },
    },
  }
  const { ctx, adapter } = await makeSettingsHarness(config, {
    'dsh-tiered-model-router': { tiers: { easy: { provider: 'p' } } },
  })
  const subject = ctx.agentLoop.create(session.SessionId('router-settings-invalid'), { provider: 'p', model: 'composition-standard' })
  send(subject, 'hello')
  await subject.whenIdle()
  assert.equal(adapter.requests.at(-1).model, 'composition-easy')
})
