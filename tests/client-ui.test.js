// This opt-in integration test uses the DSH checkout's browser dependencies
// when they are available; ordinary headless installs simply skip it.
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'

const upstream = process.env.DSH_UPSTREAM_DIR ?? 'C:/Users/X13/AppData/Local/Temp/deepseek-harness'
const browserPackage = `${upstream}/packages/client/ui-primitives/package.json`
const browserDepsAvailable = existsSync(browserPackage)

function loadPlugin(React) {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  let plugin
  vm.runInNewContext(source, {
    structuredClone,
    window: { __ModuleLoader__: { load(entry) { plugin = entry.factory((id) => id === 'react' ? React : undefined) } } },
    console,
  }, { filename: 'lib/client.js' })
  return plugin
}

test('settings section renders and persists a changed model route', { skip: !browserDepsAvailable }, async () => {
  const requireBrowser = createRequire(browserPackage)
  const React = requireBrowser('react')
  const ReactDomClient = requireBrowser('react-dom/client')
  const { Simulate } = requireBrowser('react-dom/test-utils')
  const act = React.act ?? requireBrowser('react-dom/test-utils').act
  const { JSDOM } = createRequire(`${upstream}/package.json`)('jsdom')
  const plugin = loadPlugin(React)
  const initial = {
    enabled: true,
    tiers: {
      easy: { provider: 'p', model: 'easy-old', reasoningEffort: 'low' },
      standard: { provider: 'p', model: 'standard-old', reasoningEffort: 'high' },
      hard: { provider: 'p', model: 'hard-old', reasoningEffort: 'max' },
    },
    policy: {
      defaultTier: 'standard', preserveExplicitSelection: true, takeOverUnknownSelection: false,
      routeSubagents: false, standardAtStep: 2, hardAtStep: 3, hardAfterToolFailures: 2,
      standardAtChars: 500, hardAtChars: 2500, preserveMaxTokens: true,
      clearReasoningEffortWhenUnset: true,
    },
  }
  let snapshot = { status: 'ready', value: initial, writable: true, mode: 'host' }
  const listeners = new Set()
  const operations = []
  const scope = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener) },
    mutate: async (nextOperations) => {
      operations.push(...nextOperations)
      snapshot = { ...snapshot, revision: (snapshot.revision ?? 0) + 1 }
      for (const listener of listeners) listener()
    },
  }
  let Component
  plugin.apply({
    settingsScope: { bind: () => scope },
    slots: {
      inject: (_name, callback) => { Component = callback().component },
      register: (options, component) => ({ options, component }),
    },
  })
  assert.equal(typeof Component, 'function')
  const useSnapshot = (selector) => selector(React.useSyncExternalStore(scope.subscribe, scope.getSnapshot, scope.getSnapshot))
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>')
  const previous = {
    window: globalThis.window, document: globalThis.document, navigator: globalThis.navigator,
    HTMLElement: globalThis.HTMLElement, IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
  }
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator })
  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  try {
    const root = ReactDomClient.createRoot(dom.window.document.getElementById('root'))
    const element = React.createElement(Component, { scope, useSnapshot })
    await act(async () => { root.render(element) })
    const modelInput = [...dom.window.document.querySelectorAll('input')].find((input) => input.value === 'easy-old')
    assert.ok(modelInput)
    await act(async () => {
      Simulate.change(modelInput, { target: { value: 'easy-new' } })
    })
    const hardInput = [...dom.window.document.querySelectorAll('input')].find((input) => input.value === 'hard-old')
    assert.ok(hardInput)
    await act(async () => {
      Simulate.change(hardInput, { target: { value: 'hard-new' } })
    })
    const standardChars = [...dom.window.document.querySelectorAll('input')].find((input) => input.value === '500')
    assert.ok(standardChars)
    await act(async () => {
      Simulate.change(standardChars, { target: { value: '600' } })
    })
    const saveButton = [...dom.window.document.querySelectorAll('button')].find((button) => button.textContent === '保存')
    assert.ok(saveButton)
    await act(async () => { saveButton.click() })
    assert.ok(operations.some((operation) => operation.op === 'set' && operation.path.join('.') === 'tiers.easy.model' && operation.value === 'easy-new'))
    assert.ok(operations.some((operation) => operation.op === 'set' && operation.path.join('.') === 'tiers.hard.model' && operation.value === 'hard-new'))
    assert.ok(operations.some((operation) => operation.op === 'set' && operation.path.join('.') === 'policy.standardAtChars' && operation.value === 600))
    await act(async () => { root.unmount() })
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key]
      else Object.defineProperty(globalThis, key, { configurable: true, value })
    }
  }
})
