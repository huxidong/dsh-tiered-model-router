import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

async function loadBundle() {
  const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  let plugin
  const React = {
    createElement() { return null },
    useEffect() {},
    useMemo(factory) { return factory() },
    useState(initial) { return [typeof initial === 'function' ? initial() : initial, () => {}] },
  }
  vm.runInNewContext(source, {
    window: { __ModuleLoader__: { load(entry) { plugin = entry.factory((id) => id === 'react' ? React : undefined) } } },
    console,
  }, { filename: 'lib/client.js' })
  return plugin
}

test('browser bundle registers a native settings section without a DOM', async () => {
  const plugin = await loadBundle()
  assert.deepEqual(Array.from(plugin.inject), ['slots', 'settingsScope', 'sessions', 'modelDirectories'])
  assert.equal('TieredRouterSection' in plugin, false)
  const registrations = []
  const scope = { getSnapshot: () => ({ status: 'unavailable', value: undefined }), subscribe: () => () => {} }
  const ctx = {
    settingsScope: { bind: (spec) => { assert.equal(spec.namespace, 'dsh-tiered-model-router'); return scope } },
    slots: {
      inject: (_name, callback) => registrations.push(callback()),
      register: (options, component) => ({ options, component }),
    },
  }
  plugin.apply(ctx)
  assert.equal(registrations.length, 1)
  assert.equal(registrations[0].options.id, 'tiered-model-router')
  assert.equal(typeof registrations[0].component, 'function')
})

test('browser bundle shadows the native model seat when DSH model services are available', async () => {
  const plugin = await loadBundle()
  const registrations = []
  const scope = { getSnapshot: () => ({ status: 'unavailable', value: undefined }), subscribe: () => () => {} }
  const sessions = { subagentAddress: () => undefined }
  const modelDirectories = { directoryFor: () => ({ store: {}, load: async () => {}, select: async () => {} }) }
  const ctx = {
    settingsScope: { bind: () => scope },
    sessions,
    modelDirectories,
    slots: {
      inject: (_name, callback) => registrations.push(callback()),
      register: (options, component) => ({ options, component }),
    },
  }
  plugin.apply(ctx)
  assert.equal(registrations.length, 2)
  const model = registrations.find((entry) => entry.options.name === 'conversation.input.model')
  assert.ok(model)
  assert.equal(model.options.priority, -100)
  assert.equal(typeof model.component, 'function')
})

test('browser bundle tolerates a missing settings scope', async () => {
  const plugin = await loadBundle()
  assert.doesNotThrow(() => plugin.apply({ settingsScope: { bind: () => { throw new Error('unavailable') } }, slots: {} }))
})
