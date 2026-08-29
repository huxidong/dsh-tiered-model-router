import test from 'node:test'
import assert from 'node:assert/strict'
import { installSettingsRoute, ROUTER_SETTINGS_PATH, ROUTER_MODELS_PATH, ROUTER_MODEL_CHECK_PATH } from '../src/settings-route.js'

function response() {
  return {
    status: undefined,
    headers: undefined,
    body: '',
    headersSent: false,
    writeHead(status, headers) { this.status = status; this.headers = headers; this.headersSent = true },
    end(body = '') { this.body += body },
  }
}

function request(method, url, body = '') {
  const listeners = new Map()
  return {
    method,
    url,
    on(event, callback) { listeners.set(event, callback) },
    emit(event, value) { listeners.get(event)?.(value) },
    body,
  }
}

test('settings route reads and mutates only the router namespace', async () => {
  const routes = []
  let user = {}
  let revision = 0
  const settings = {
    writable: true,
    describe() {
      return [{ ns: 'dsh-tiered-model-router', value: { enabled: true, tiers: {} }, base: { enabled: true }, user, revision }]
    },
    async mutate(namespace, ops, expectedRevision) {
      assert.equal(namespace, 'dsh-tiered-model-router')
      assert.equal(expectedRevision, revision)
      assert.equal(ops[0].path.join('.'), 'tiers.easy.model')
      user = { tiers: { easy: { model: ops[0].value } } }
      revision += 1
    },
    async replace(namespace, section, expectedRevision) {
      assert.equal(namespace, 'dsh-tiered-model-router')
      assert.equal(expectedRevision, revision)
      user = section
      revision += 1
    },
  }
  const ctx = {
    inject(_names, callback) {
      callback({
        webServer: { register(spec) { routes.push(spec); return () => {} } },
        settings,
        effect(factory) { return factory() },
      })
    },
  }
  installSettingsRoute(ctx, 'dsh-tiered-model-router')
  assert.equal(routes.length, 3)
  assert.ok(routes.some((candidate) => candidate.path === ROUTER_MODELS_PATH))
  assert.ok(routes.some((candidate) => candidate.path === ROUTER_MODEL_CHECK_PATH))
  const route = routes.find((candidate) => candidate.path === ROUTER_SETTINGS_PATH)

  const getResponse = response()
  await route.handler(request('GET', ROUTER_SETTINGS_PATH), getResponse)
  assert.equal(getResponse.status, 200)
  assert.equal(JSON.parse(getResponse.body).ok, true)
  assert.equal(JSON.parse(getResponse.body).writable, true)

  const postResponse = response()
  const postRequest = request('POST', ROUTER_SETTINGS_PATH, JSON.stringify({
    ops: [{ op: 'set', path: ['tiers', 'easy', 'model'], value: 'new-model' }],
    expectedRevision: 0,
  }))
  const postPromise = route.handler(postRequest, postResponse)
  postRequest.emit('data', Buffer.from(postRequest.body))
  postRequest.emit('end')
  await postPromise
  assert.equal(postResponse.status, 200)
  assert.equal(JSON.parse(postResponse.body).revision, 1)
})

test('settings route rejects malformed requests without throwing', async () => {
  const routes = []
  const ctx = {
    inject(_names, callback) {
      callback({ webServer: { register(spec) { routes.push(spec); return () => {} } }, settings: { writable: true, describe: () => [{ ns: 'router', value: {}, revision: 0 }], mutate: async () => {}, replace: async () => {} } })
    },
  }
  installSettingsRoute(ctx, 'router')
  const res = response()
  const req = request('POST', ROUTER_SETTINGS_PATH, '{')
  const promise = routes[0].handler(req, res)
  req.emit('data', Buffer.from(req.body))
  req.emit('end')
  await promise
  assert.equal(res.status, 400)
  assert.equal(JSON.parse(res.body).ok, false)
})

test('model discovery rejects an oversized pool with a bounded error', async () => {
  const routes = []
  const llm = {
    listProviders: () => [{ id: 'p', name: 'P' }],
    listModels: async () => Array.from({ length: 201 }, (_, index) => ({ id: `m-${index}` })),
  }
  const ctx = {
    inject(_names, callback) {
      callback({
        webServer: { register(spec) { routes.push(spec); return () => {} } },
        settings: { writable: true, describe: () => [{ ns: 'router', value: {}, revision: 0 }], mutate: async () => {}, replace: async () => {} },
        llm,
      })
    },
  }
  installSettingsRoute(ctx, 'router')
  const res = response()
  await routes.find((candidate) => candidate.path === ROUTER_MODELS_PATH).handler(request('GET', ROUTER_MODELS_PATH), res)
  assert.equal(res.status, 413)
  assert.equal(JSON.parse(res.body).code, 'model-pool-too-large')
  assert.equal(JSON.parse(res.body).error, '模型池过大，暂不支持')
})

test('model check refuses an unlisted model before provider I/O', async () => {
  const routes = []
  let streamed = false
  const llm = {
    listProviders: () => [{ id: 'p', name: 'P' }],
    listModels: async () => [{ id: 'listed' }],
    stream: () => { streamed = true; throw new Error('must not stream') },
  }
  const ctx = {
    inject(_names, callback) {
      callback({
        webServer: { register(spec) { routes.push(spec); return () => {} } },
        settings: { writable: true, describe: () => [{ ns: 'router', value: {}, revision: 0 }], mutate: async () => {}, replace: async () => {} },
        llm,
      })
    },
  }
  installSettingsRoute(ctx, 'router')
  const res = response()
  const req = request('POST', ROUTER_MODEL_CHECK_PATH, JSON.stringify({ provider: 'p', model: 'private' }))
  const promise = routes.find((candidate) => candidate.path === ROUTER_MODEL_CHECK_PATH).handler(req, res)
  req.emit('data', Buffer.from(req.body))
  req.emit('end')
  await promise
  const body = JSON.parse(res.body)
  assert.equal(res.status, 200)
  assert.equal(body.status, 'unavailable')
  assert.equal(body.code, 'MODEL_NOT_LISTED')
  assert.equal(streamed, false)
})
