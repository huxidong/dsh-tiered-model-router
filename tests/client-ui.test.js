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

function loadPlugin(React, fetch) {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  let plugin
  vm.runInNewContext(source, {
    structuredClone,
    window: { __ModuleLoader__: { load(entry) { plugin = entry.factory((id) => id === 'react' ? React : undefined) } } },
    console,
    fetch,
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
      easyKeywords: ['hello'], standardKeywords: ['code'], hardKeywords: ['production'],
      hardTools: ['apply_patch'], failureExclude: ['todo_write'],
    },
  }
  let snapshot = { status: 'ready', value: initial, base: initial, writable: true, mode: 'host' }
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
  const modelIds = ['easy-old', 'easy-new', 'standard-old', 'hard-old', 'hard-new']
  const fetchStub = async (url) => {
    if (url === '/dsh-tiered-model-router/models') {
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            ok: true,
            providers: [{ id: 'p', name: '测试提供商', models: modelIds.map((id) => ({ id, name: id, reasoningEfforts: ['off', 'high', 'max'] })) }],
          }
        },
      }
    }
    if (url === '/dsh-tiered-model-router/check-model') {
      return { ok: true, status: 200, async json() { return { ok: true, status: 'available', code: 'OK', message: '模型可用' } } }
    }
    throw new Error(`unexpected fetch: ${url}`)
  }
  const plugin = loadPlugin(React, fetchStub)
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
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
    const modelInput = [...dom.window.document.querySelectorAll('select')].find((select) => select.value === 'easy-old')
    assert.ok(modelInput)
    await act(async () => {
      Simulate.change(modelInput, { target: { value: 'easy-new' } })
    })
    const hardInput = [...dom.window.document.querySelectorAll('select')].find((select) => select.value === 'hard-old')
    assert.ok(hardInput)
    await act(async () => {
      Simulate.change(hardInput, { target: { value: 'hard-new' } })
    })
    const standardChars = [...dom.window.document.querySelectorAll('input')].find((input) => input.value === '500')
    assert.ok(standardChars)
    await act(async () => {
      Simulate.change(standardChars, { target: { value: '600' } })
    })
    const easyKeywords = [...dom.window.document.querySelectorAll('textarea')].find((textarea) => textarea.value === 'hello')
    assert.ok(easyKeywords)
    await act(async () => {
      Simulate.change(easyKeywords, { target: { value: 'hello\nhi' } })
    })
    const saveButton = [...dom.window.document.querySelectorAll('button')].find((button) => button.textContent === '保存')
    assert.ok(saveButton)
    await act(async () => { saveButton.click() })
    assert.ok(operations.some((operation) => operation.op === 'set' && operation.path.join('.') === 'tiers.easy.model' && operation.value === 'easy-new'))
    assert.ok(operations.some((operation) => operation.op === 'set' && operation.path.join('.') === 'tiers.hard.model' && operation.value === 'hard-new'))
    assert.ok(operations.some((operation) => operation.op === 'set' && operation.path.join('.') === 'policy.standardAtChars' && operation.value === 600))
    assert.ok(operations.some((operation) => operation.op === 'set' && operation.path.join('.') === 'policy.easyKeywords' && operation.value.join(',') === 'hello,hi'))

    snapshot = { ...snapshot, writable: false }
    await act(async () => { for (const listener of listeners) listener() })
    assert.equal([...dom.window.document.querySelectorAll('input')].some((input) => input.disabled), true)
    assert.equal([...dom.window.document.querySelectorAll('button')].find((button) => button.textContent === '保存').disabled, true)

    snapshot = { status: 'loading', value: undefined, base: initial, writable: true, mode: 'host' }
    await act(async () => { for (const listener of listeners) listener() })
    assert.ok([...dom.window.document.querySelectorAll('select')].find((select) => select.value === 'easy-old'))
    assert.equal([...dom.window.document.querySelectorAll('button')].find((button) => button.textContent === '恢复组合配置').disabled, false)
    await act(async () => { root.unmount() })
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key]
      else Object.defineProperty(globalThis, key, { configurable: true, value })
    }
  }
})

test('model selector shows Auto only for router mode and disables routing after manual choice', { skip: !browserDepsAvailable }, async () => {
  const requireBrowser = createRequire(browserPackage)
  const React = requireBrowser('react')
  const ReactDomClient = requireBrowser('react-dom/client')
  const { JSDOM } = createRequire(`${upstream}/package.json`)('jsdom')
  const act = React.act ?? requireBrowser('react-dom/test-utils').act
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>')
  const previous = {
    window: globalThis.window, document: globalThis.document, navigator: globalThis.navigator,
    HTMLElement: globalThis.HTMLElement, IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
  }
  let routerSnapshot = { status: 'ready', value: { enabled: true }, base: { enabled: true }, writable: true, mode: 'host' }
  const routerListeners = new Set()
  const routerScope = {
    getSnapshot: () => routerSnapshot,
    subscribe: (listener) => { routerListeners.add(listener); return () => routerListeners.delete(listener) },
    set: async (field, value) => {
      assert.equal(field, 'enabled')
      routerSnapshot = { ...routerSnapshot, value: { ...routerSnapshot.value, enabled: value } }
      for (const listener of routerListeners) listener()
    },
  }
  let directorySnapshot = {
    current: { provider: 'p', model: 'minimax-m3' },
    routable: true,
    groups: [{ id: 'p', name: '测试提供商', models: [
      { id: 'minimax-m3', name: 'minimax-m3', reasoning: { defaultEffort: 'medium', efforts: [{ id: 'medium', name: 'medium' }] } },
      { id: 'other-model', name: 'other-model', reasoning: { efforts: [{ id: 'high', name: 'high' }] } },
    ] }],
    failures: [], status: 'ready', error: null,
  }
  let chatSnapshot = {
    order: [],
    nodes: { get: () => undefined, values: () => [] },
  }
  let modelSelectionProjection = { lastUsed: null, next: { provider: 'p', model: 'minimax-m3' } }
  const directoryListeners = new Set()
  let directoryLoads = 0
  const directory = {
    store: {
      getSnapshot: () => directorySnapshot,
      subscribe: (listener) => { directoryListeners.add(listener); return () => directoryListeners.delete(listener) },
    },
    async load() { directoryLoads += 1; return directorySnapshot },
    async select(selection) {
      directorySnapshot = { ...directorySnapshot, current: selection }
      for (const listener of directoryListeners) listener()
    },
  }
  const notices = []
  const sessions = {
    subagentAddress: () => undefined,
    scope: () => ({ get: (name) => name === 'conversation' ? { input: { for: () => ({ notify: (_level, text) => notices.push(text) }) } } : undefined }),
  }
  const modelDirectories = { directoryFor: () => directory }
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  let plugin
  vm.runInNewContext(source, {
    structuredClone,
    window: { __ModuleLoader__: { load(entry) { plugin = entry.factory((id) => id === 'react' ? React : undefined) } } },
    document: dom.window.document,
    console,
  }, { filename: 'lib/client.js' })
  const registrations = []
  plugin.apply({
    settingsScope: { bind: () => routerScope },
    sessions,
    modelDirectories,
    slots: {
      inject: (_name, callback) => registrations.push(callback()),
      register: (options, component) => ({ options, component }),
    },
  })
  const modelRegistration = registrations.find((entry) => entry.options.name === 'conversation.input.model')
  assert.ok(modelRegistration)
  const props = modelRegistration.options.inject('session-1')
  try {
    globalThis.window = dom.window
    globalThis.document = dom.window.document
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator })
    globalThis.HTMLElement = dom.window.HTMLElement
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    const root = ReactDomClient.createRoot(dom.window.document.getElementById('root'))
    const renderModel = () => root.render(React.createElement(modelRegistration.component, {
      locked: false,
      ...props,
      useChat: (selector) => selector(chatSnapshot),
      useProjection: (key) => key === 'dsh-tiered-model-router.modelSelection' ? modelSelectionProjection : undefined,
    }))
    await act(async () => { renderModel() })
    assert.ok(directoryLoads >= 1)
    assert.match(dom.window.document.body.textContent, /minimax-m3/)
    assert.match(dom.window.document.body.textContent, /Auto/)
    assert.match(dom.window.document.body.textContent, /实际：等待请求/)
    modelSelectionProjection = {
      lastUsed: { provider: 'p', model: 'minimax-m3' },
      next: { provider: 'p', model: 'minimax-m3' },
    }
    await act(async () => { renderModel() })
    assert.match(dom.window.document.body.textContent, /实际：p \/ minimax-m3/)
    routerSnapshot = { ...routerSnapshot, value: { enabled: false } }
    await act(async () => { for (const listener of routerListeners) listener() })
    assert.match(dom.window.document.body.textContent, /minimax-m3/)
    assert.doesNotMatch(dom.window.document.body.textContent, /Auto/)
    const trigger = [...dom.window.document.querySelectorAll('button')].find((button) => button.textContent.includes('minimax-m3'))
    assert.ok(trigger)
    routerSnapshot = { ...routerSnapshot, value: { enabled: true } }
    await act(async () => { for (const listener of routerListeners) listener() })
    await act(async () => { trigger.click() })
    const modelPane = [...dom.window.document.querySelectorAll('button')].find((button) => button.textContent.startsWith('模型'))
    assert.ok(modelPane)
    await act(async () => { modelPane.click() })
    const otherModel = [...dom.window.document.querySelectorAll('button')].find((button) => button.textContent.includes('other-model'))
    assert.ok(otherModel)
    await act(async () => { otherModel.click(); await new Promise((resolve) => setTimeout(resolve, 0)) })
    assert.equal(routerSnapshot.value.enabled, false)
    assert.ok(notices.some((text) => text.includes('自动路由已关闭')))
    await act(async () => { root.unmount() })
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key]
      else Object.defineProperty(globalThis, key, { configurable: true, value })
    }
  }
})
