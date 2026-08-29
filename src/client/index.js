import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'

const ROUTER_SETTINGS_NAMESPACE = 'dsh-tiered-model-router'
const ROUTER_SETTINGS_PATH = '/dsh-tiered-model-router/config'
const ROUTER_MODELS_PATH = '/dsh-tiered-model-router/models'
const ROUTER_MODEL_CHECK_PATH = '/dsh-tiered-model-router/check-model'
const MODEL_SELECTION_PROJECTION_KEY = 'dsh-tiered-model-router.modelSelection'

const TIERS = ['easy', 'standard', 'hard']
const TIER_LABELS = { easy: '简单', standard: '标准', hard: '困难' }
const DEFAULT_ROUTE = { provider: '', model: '', reasoningEffort: '', maxTokens: '' }
const DEFAULT_POLICY = {
  defaultTier: 'standard',
  routeSubagents: false,
  standardAtStep: 2,
  hardAtStep: 3,
  hardAfterToolFailures: 2,
  standardAtChars: 500,
  hardAtChars: 2500,
  preserveMaxTokens: true,
  clearReasoningEffortWhenUnset: true,
  maxRoutingDepth: 3,
  reasoningFallback: 'next-higher',
  reasoningLevelOrder: ['off', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'],
  easyKeywords: [],
  standardKeywords: [],
  hardKeywords: [],
  hardTools: [],
  failureExclude: [],
}

const POLICY_LIST_KEYS = ['easyKeywords', 'standardKeywords', 'hardKeywords', 'hardTools', 'failureExclude', 'reasoningLevelOrder']

const styles = {
  section: { display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 28px', maxWidth: 920 },
  heading: { margin: 0, fontSize: 22, lineHeight: 1.25, fontWeight: 650, color: 'var(--dsw-fg-primary, #1f2329)' },
  description: { margin: '6px 0 0', color: 'var(--dsw-fg-secondary, #667085)', fontSize: 13, lineHeight: 1.5 },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 38 },
  label: { color: 'var(--dsw-fg-primary, #1f2329)', fontSize: 14, lineHeight: 1.35 },
  hint: { color: 'var(--dsw-fg-secondary, #667085)', fontSize: 12, lineHeight: 1.4 },
  group: { borderTop: '1px solid var(--dsw-border-subtle, #e5e7eb)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 12 },
  groupTitle: { margin: 0, fontSize: 15, fontWeight: 620, color: 'var(--dsw-fg-primary, #1f2329)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid var(--dsw-border-default, #d0d5dd)', borderRadius: 6, padding: '8px 10px', font: 'inherit', color: 'var(--dsw-fg-primary, #1f2329)', background: 'var(--dsw-bg-input, #fff)' },
  textarea: { width: '100%', minHeight: 82, boxSizing: 'border-box', border: '1px solid var(--dsw-border-default, #d0d5dd)', borderRadius: 6, padding: '8px 10px', font: 'inherit', lineHeight: 1.4, resize: 'vertical', color: 'var(--dsw-fg-primary, #1f2329)', background: 'var(--dsw-bg-input, #fff)' },
  select: { width: '100%', boxSizing: 'border-box', border: '1px solid var(--dsw-border-default, #d0d5dd)', borderRadius: 6, padding: '8px 10px', font: 'inherit', color: 'var(--dsw-fg-primary, #1f2329)', background: 'var(--dsw-bg-input, #fff)' },
  check: { display: 'flex', alignItems: 'flex-start', gap: 9, minHeight: 32 },
  actions: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, paddingTop: 4 },
  button: { border: '1px solid var(--dsw-border-default, #d0d5dd)', borderRadius: 6, padding: '8px 14px', font: 'inherit', cursor: 'pointer', background: 'var(--dsw-bg-input, #fff)', color: 'var(--dsw-fg-primary, #1f2329)' },
  primary: { background: 'var(--dsw-accent, #2563eb)', borderColor: 'var(--dsw-accent, #2563eb)', color: '#fff' },
  notice: { border: '1px solid var(--dsw-border-subtle, #e5e7eb)', borderRadius: 6, padding: '10px 12px', color: 'var(--dsw-fg-secondary, #667085)', fontSize: 13, lineHeight: 1.45 },
  error: { borderColor: '#f2b8b5', background: '#fff7f6', color: '#9b1c1c' },
  modelSelectRoot: { position: 'relative', display: 'inline-flex', minWidth: 0 },
  modelTrigger: { display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0, maxWidth: 220, height: 28, border: 0, borderRadius: 24, padding: '0 4px 0 8px', color: 'var(--dsw-alias-label-secondary, #667085)', background: 'transparent', font: 'inherit', fontSize: 13, fontWeight: 500, lineHeight: '20px', cursor: 'pointer' },
  modelTriggerLabel: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  modelTriggerEffort: { flex: 'none', color: 'var(--dsw-alias-label-caption, #98a2b3)' },
  actualModel: { minWidth: 0, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--dsw-alias-label-caption, #98a2b3)', fontSize: 12, lineHeight: '18px' },
  modelChevron: { flex: 'none', color: 'var(--dsw-alias-label-caption, #98a2b3)', fontSize: 12 },
  modelMenu: { position: 'absolute', zIndex: 100, right: 0, bottom: 'calc(100% + 8px)', width: 'min(280px, calc(100vw - 32px))', maxHeight: 'min(380px, calc(100vh - 96px))', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4, padding: 5, border: '1px solid var(--dsw-alias-border-inverted, #d0d5dd)', borderRadius: 10, background: 'var(--dsw-specific-menu, #fff)', color: 'var(--dsw-alias-label-primary, #1f2329)', boxShadow: '0 8px 24px rgba(16, 24, 40, .16)' },
  modelMenuButton: { width: '100%', minHeight: 34, border: 0, borderRadius: 7, padding: '7px 9px', textAlign: 'left', background: 'transparent', color: 'inherit', font: 'inherit', cursor: 'pointer' },
  modelMenuButtonActive: { background: 'var(--dsw-alias-interactive-bg-hover, #f2f4f7)' },
  modelMenuSection: { display: 'flex', flexDirection: 'column', gap: 3 },
  modelMenuTitle: { padding: '5px 9px 2px', color: 'var(--dsw-alias-label-tertiary, #98a2b3)', fontSize: 12, lineHeight: '18px' },
  modelMenuSubtext: { display: 'block', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--dsw-alias-label-tertiary, #98a2b3)', fontSize: 12, lineHeight: '17px' },
  modelMenuRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  try { return structuredClone(value) } catch {
    try { return JSON.parse(JSON.stringify(value)) } catch {
      if (Array.isArray(value)) return [...value]
      if (isRecord(value)) return { ...value }
      return value
    }
  }
}

function listText(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string').join('\n')
  return typeof value === 'string' ? value : ''
}

function parseList(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
  return String(value ?? '').split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
}

function draftFromValue(value) {
  const source = isRecord(value) ? value : {}
  const tiers = isRecord(source.tiers) ? source.tiers : {}
  const policy = isRecord(source.policy) ? source.policy : {}
  const result = {
    enabled: source.enabled !== false,
    tiers: {},
    policy: { ...DEFAULT_POLICY },
  }
  for (const tier of TIERS) {
    const route = isRecord(tiers[tier]) ? tiers[tier] : {}
    result.tiers[tier] = {
      ...DEFAULT_ROUTE,
      ...clone(route),
      provider: typeof route.provider === 'string' ? route.provider : '',
      model: typeof route.model === 'string' ? route.model : '',
      reasoningEffort: typeof route.reasoningEffort === 'string' ? route.reasoningEffort : '',
      maxTokens: Number.isSafeInteger(route.maxTokens) && route.maxTokens >= 1 ? String(route.maxTokens) : '',
    }
  }
  for (const [key, fallback] of Object.entries(DEFAULT_POLICY)) {
    const candidate = policy[key]
    if (Array.isArray(fallback)) result.policy[key] = listText(candidate)
    else if (typeof fallback === 'boolean') result.policy[key] = typeof candidate === 'boolean' ? candidate : fallback
    else if (key === 'defaultTier') result.policy[key] = TIERS.includes(candidate) ? candidate : fallback
    else if (key === 'reasoningFallback') result.policy[key] = ['next-higher', 'nearest', 'none'].includes(candidate) ? candidate : fallback
    else result.policy[key] = Number.isSafeInteger(candidate) && candidate >= 1 ? candidate : fallback
  }
  for (const [key, candidate] of Object.entries(policy)) {
    if (!(key in result.policy)) result.policy[key] = clone(candidate)
  }
  return result
}

function numberOrFallback(value, fallback) {
  const number = Number(value)
  return Number.isSafeInteger(number) && number >= 1 ? number : fallback
}

function routeValue(route) {
  const result = isRecord(route) ? clone(route) : {}
  result.provider = String(route.provider ?? '').trim()
  result.model = String(route.model ?? '').trim()
  const effort = String(route.reasoningEffort ?? '').trim()
  if (effort) result.reasoningEffort = effort
  else delete result.reasoningEffort
  const maxTokens = numberOrFallback(route.maxTokens, 0)
  if (maxTokens > 0) result.maxTokens = maxTokens
  else delete result.maxTokens
  return result
}

function valueForSave(draft) {
  const policy = { ...draft.policy }
  policy.standardAtStep = numberOrFallback(policy.standardAtStep, DEFAULT_POLICY.standardAtStep)
  policy.hardAtStep = numberOrFallback(policy.hardAtStep, DEFAULT_POLICY.hardAtStep)
  policy.hardAfterToolFailures = numberOrFallback(policy.hardAfterToolFailures, DEFAULT_POLICY.hardAfterToolFailures)
  policy.standardAtChars = numberOrFallback(policy.standardAtChars, DEFAULT_POLICY.standardAtChars)
  policy.hardAtChars = numberOrFallback(policy.hardAtChars, DEFAULT_POLICY.hardAtChars)
  if (policy.hardAtChars < policy.standardAtChars) policy.hardAtChars = policy.standardAtChars
  if (policy.hardAtStep < policy.standardAtStep) policy.hardAtStep = policy.standardAtStep
  for (const key of POLICY_LIST_KEYS) policy[key] = parseList(policy[key])
  return {
    enabled: Boolean(draft.enabled),
    tiers: Object.fromEntries(TIERS.map((tier) => [tier, routeValue(draft.tiers[tier])])),
    policy,
  }
}

function operationsForDraft(draft) {
  const next = valueForSave(draft)
  const operations = [
    { op: 'set', path: ['enabled'], value: next.enabled },
  ]
  for (const tier of TIERS) {
    const raw = draft.tiers[tier] ?? DEFAULT_ROUTE
    operations.push(
      { op: 'set', path: ['tiers', tier, 'provider'], value: next.tiers[tier].provider },
      { op: 'set', path: ['tiers', tier, 'model'], value: next.tiers[tier].model },
    )
    const effort = String(raw.reasoningEffort ?? '').trim()
    operations.push(effort
      ? { op: 'set', path: ['tiers', tier, 'reasoningEffort'], value: effort }
      : { op: 'unset', path: ['tiers', tier, 'reasoningEffort'] })
    const maxTokens = numberOrFallback(raw.maxTokens, 0)
    operations.push(maxTokens > 0
      ? { op: 'set', path: ['tiers', tier, 'maxTokens'], value: maxTokens }
      : { op: 'unset', path: ['tiers', tier, 'maxTokens'] })
  }
  for (const [key, fieldValue] of Object.entries(next.policy)) {
    operations.push({ op: 'set', path: ['policy', key], value: fieldValue })
  }
  return operations
}

function setNested(previous, path, value) {
  const next = clone(previous)
  let cursor = next
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index]
    if (!isRecord(cursor[key])) cursor[key] = {}
    cursor = cursor[key]
  }
  cursor[path[path.length - 1]] = value
  return next
}

function notify(listeners) {
  for (const listener of [...listeners]) {
    try { listener() } catch { /* one broken subscriber must not break the scope */ }
  }
}

class HttpSettingsScope {
  constructor(path = ROUTER_SETTINGS_PATH) {
    this.path = path
    this.listeners = new Set()
    this.snapshot = { status: 'loading', value: undefined, base: undefined, user: undefined, revision: undefined, writable: false, mode: 'route' }
  }

  getSnapshot = () => this.snapshot

  subscribe = (listener) => {
    if (typeof listener !== 'function') return () => {}
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  publish(next) {
    this.snapshot = next
    notify(this.listeners)
  }

  async load() {
    if (typeof fetch !== 'function') {
      this.publish({ ...this.snapshot, status: 'unavailable', writable: false })
      return
    }
    try {
      const response = await fetch(this.path, { headers: { accept: 'application/json' } })
      const payload = await response.json()
      if (!response.ok || payload?.ok !== true) throw new Error(String(payload?.error ?? `settings route returned HTTP ${response.status}`))
      this.publish({
        status: 'ready',
        value: payload.value,
        base: payload.base,
        user: payload.user,
        revision: payload.revision,
        writable: payload.writable === true,
        mode: 'route',
      })
    } catch {
      this.publish({ ...this.snapshot, status: 'unavailable', writable: false })
    }
  }

  async write(payload) {
    if (typeof fetch !== 'function') throw new Error('当前 DSH 没有可用的插件设置通道')
    const revision = this.snapshot.revision
    const body = JSON.stringify({ ...payload, ...Number.isSafeInteger(revision) ? { expectedRevision: revision } : {} })
    const response = await fetch(this.path, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body })
    let result
    try { result = await response.json() } catch { throw new Error(`settings route returned HTTP ${response.status}`) }
    if (!response.ok || result?.ok !== true) throw new Error(String(result?.error ?? `settings write failed (HTTP ${response.status})`))
    this.publish({
      status: 'ready',
      value: result.value,
      base: result.base,
      user: result.user,
      revision: result.revision,
      writable: result.writable === true,
      mode: 'route',
    })
  }

  mutate = (ops) => this.write({ action: 'mutate', ops })
  replace = (section) => this.write({ action: 'replace', section })
}

class HybridSettingsScope {
  constructor(nativeScope) {
    this.nativeScope = nativeScope
    this.httpScope = new HttpSettingsScope()
    this.listeners = new Set()
    this.snapshot = nativeScope?.getSnapshot?.() ?? this.httpScope.getSnapshot()
    this.fallbackStarted = false
    this.nativeDispose = typeof nativeScope?.subscribe === 'function'
      ? nativeScope.subscribe(() => this.syncNative())
      : undefined
    this.syncNative()
  }

  getSnapshot = () => this.snapshot

  subscribe = (listener) => {
    if (typeof listener !== 'function') return () => {}
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  publish(next) {
    this.snapshot = next
    notify(this.listeners)
  }

  syncNative() {
    const next = this.nativeScope?.getSnapshot?.()
    if (!next) return
    if (next.status === 'unavailable') {
      this.startFallback()
      return
    }
    this.publish(next)
  }

  startFallback() {
    if (this.fallbackStarted) return
    this.fallbackStarted = true
    this.httpScope.subscribe(() => this.publish(this.httpScope.getSnapshot()))
    this.publish(this.httpScope.getSnapshot())
    this.httpScope.load()
  }

  useNative() {
    return this.snapshot?.mode !== 'route' && this.snapshot?.status === 'ready' && this.snapshot?.writable === true
  }

  mutate = (ops) => this.useNative() && typeof this.nativeScope?.mutate === 'function'
    ? this.nativeScope.mutate(ops)
    : this.httpScope.mutate(ops)

  replace = (section) => this.useNative() && typeof this.nativeScope?.replace === 'function'
    ? this.nativeScope.replace(section)
    : this.httpScope.replace(section)

  set = (field, value) => this.useNative() && typeof this.nativeScope?.set === 'function'
    ? this.nativeScope.set(field, value)
    : this.httpScope.mutate([{ op: 'set', path: String(field).split('.').filter(Boolean), value }])

  unset = (field) => this.useNative() && typeof this.nativeScope?.unset === 'function'
    ? this.nativeScope.unset(field)
    : this.httpScope.mutate([{ op: 'unset', path: String(field).split('.').filter(Boolean) }])
}

function useModelPool() {
  const [reloadKey, setReloadKey] = useState(0)
  const [snapshot, setSnapshot] = useState({ status: 'loading', providers: [], error: '' })
  useEffect(() => {
    let active = true
    if (typeof fetch !== 'function') {
      setSnapshot({ status: 'unavailable', providers: [], error: '当前环境不支持读取模型池' })
      return () => { active = false }
    }
    setSnapshot({ status: 'loading', providers: [], error: '' })
    fetch(ROUTER_MODELS_PATH, { headers: { accept: 'application/json' } })
      .then(async (response) => {
        let payload
        try { payload = await response.json() } catch { throw new Error('模型池返回了无效数据') }
        if (!response.ok || payload?.ok !== true || !Array.isArray(payload.providers)) {
          throw new Error(String(payload?.error ?? `模型池读取失败（HTTP ${response.status}）`))
        }
        if (active) setSnapshot({ status: 'ready', providers: payload.providers, error: '' })
      })
      .catch((error) => {
        if (active) setSnapshot({ status: 'error', providers: [], error: String(error?.message ?? error ?? '模型池读取失败') })
      })
    return () => { active = false }
  }, [reloadKey])
  return { ...snapshot, reload: () => setReloadKey((value) => value + 1) }
}

const MODEL_CHECK_CACHE_TTL_MS = 2 * 60 * 1000
const modelCheckCache = new Map()
const modelCheckInflight = new Map()

function modelCheckKey(provider, model) {
  return `${String(provider ?? '').trim()}\u0000${String(model ?? '').trim()}`
}

async function requestModelCheck(provider, model, options = {}) {
  const normalizedProvider = String(provider ?? '').trim()
  const normalizedModel = String(model ?? '').trim()
  if (!normalizedProvider || !normalizedModel) return { status: 'unknown', code: 'INVALID_REQUEST', message: '模型提供商和模型不能为空' }
  const key = modelCheckKey(normalizedProvider, normalizedModel)
  const now = Date.now()
  const cached = modelCheckCache.get(key)
  if (!options.force && cached && cached.expiresAt > now) return cached.value
  const inflight = modelCheckInflight.get(key)
  if (inflight) return inflight
  if (typeof fetch !== 'function') return { status: 'unknown', code: 'CHECK_UNAVAILABLE', message: '当前环境不支持模型可用性检查' }
  const pending = (async () => {
    let value
    try {
      const response = await fetch(ROUTER_MODEL_CHECK_PATH, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ provider: normalizedProvider, model: normalizedModel }),
      })
      let payload
      try { payload = await response.json() } catch { throw new Error(`模型可用性检查返回了无效数据（HTTP ${response.status}）`) }
      if (!response.ok || payload?.ok !== true) throw new Error(String(payload?.error ?? `模型可用性检查失败（HTTP ${response.status}）`))
      value = {
        status: ['available', 'unavailable', 'unknown'].includes(payload.status) ? payload.status : 'unknown',
        code: String(payload.code ?? 'CHECK_UNKNOWN'),
        reason: String(payload.reason ?? 'unknown'),
        message: String(payload.message ?? '模型可用性暂时无法确认'),
      }
    } catch (error) {
      value = { status: 'unknown', code: 'CHECK_REQUEST_FAILED', reason: 'temporary-failure', message: String(error?.message ?? error ?? '模型可用性暂时无法确认') }
    }
    modelCheckCache.set(key, { value, expiresAt: Date.now() + MODEL_CHECK_CACHE_TTL_MS })
    while (modelCheckCache.size > 64) modelCheckCache.delete(modelCheckCache.keys().next().value)
    return value
  })()
  modelCheckInflight.set(key, pending)
  try { return await pending } finally { modelCheckInflight.delete(key) }
}

function useModelAvailability(provider, model) {
  const [snapshot, setSnapshot] = useState({ status: 'idle', code: '', message: '' })
  useEffect(() => {
    let active = true
    if (!String(provider ?? '').trim() || !String(model ?? '').trim()) {
      setSnapshot({ status: 'idle', code: '', message: '' })
      return () => { active = false }
    }
    setSnapshot({ status: 'checking', code: 'CHECKING', message: '正在检查模型是否可用…' })
    requestModelCheck(provider, model).then((result) => {
      if (active) setSnapshot(result)
    })
    return () => { active = false }
  }, [provider, model])
  return snapshot
}

function field(props, label, value, onChange, type = 'text', extra = {}) {
  return React.createElement('label', { style: styles.field, key: props },
    React.createElement('span', { style: styles.hint }, label),
    React.createElement('input', {
      ...extra,
      style: styles.input,
      type,
      value: value ?? '',
      onChange,
    }),
  )
}

function listField(key, label, value, onChange, placeholder, disabled) {
  return React.createElement('label', { style: styles.field, key },
    React.createElement('span', { style: styles.hint }, label),
    React.createElement('textarea', {
      style: styles.textarea,
      value: value ?? '',
      onChange,
      placeholder,
      disabled,
      spellCheck: false,
    }),
  )
}

function checkbox(key, label, checked, onChange, hint, disabled = false) {
  return React.createElement('label', { key, style: styles.check },
    React.createElement('input', { type: 'checkbox', checked: Boolean(checked), onChange, disabled, style: { marginTop: 3 } }),
    React.createElement('span', null,
      React.createElement('span', { style: styles.label }, label),
      hint ? React.createElement('div', { style: styles.hint }, hint) : null,
    ),
  )
}

function selectField(key, label, value, onChange, options, disabled, emptyLabel) {
  const current = String(value ?? '')
  const known = options.some((option) => option.id === current)
  return React.createElement('label', { style: styles.field, key },
    React.createElement('span', { style: styles.hint }, label),
    React.createElement('select', {
      style: styles.select,
      value: current,
      onChange: (event) => onChange(event.target.value),
      disabled,
    },
    React.createElement('option', { value: '' }, emptyLabel),
    !known && current ? React.createElement('option', { value: current, disabled: true }, `当前：${current}（未在模型池）`) : null,
    options.map((option) => React.createElement('option', { key: option.id, value: option.id }, option.label)),
    ),
  )
}

function readSnapshot(store) {
  try { return store?.getSnapshot?.() ?? EMPTY_SNAPSHOT } catch { return EMPTY_SNAPSHOT }
}

const EMPTY_SNAPSHOT = Object.freeze({})

function useExternalSnapshot(store) {
  const subscribe = typeof store?.subscribe === 'function' ? store.subscribe.bind(store) : () => () => {}
  const getSnapshot = () => readSnapshot(store)
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

function modelSelectionLabel(model) {
  return String(model?.name ?? model?.id ?? '').trim() || '模型'
}

function modelSelectionChoices(state) {
  const groups = Array.isArray(state?.groups) ? state.groups : []
  return groups.flatMap((group) => {
    const models = Array.isArray(group?.models) ? group.models : []
    return models.map((model) => ({
      provider: String(group?.id ?? '').trim(),
      model: String(model?.id ?? '').trim(),
      label: modelSelectionLabel(model),
      providerLabel: String(group?.name ?? group?.id ?? '').trim(),
      description: typeof model?.description === 'string' ? model.description : '',
      defaultEffort: model?.reasoning?.defaultEffort,
      efforts: Array.isArray(model?.reasoning?.efforts)
        ? model.reasoning.efforts.map((effort) => ({
          id: String(effort?.id ?? '').trim(),
          name: String(effort?.name ?? effort?.id ?? '').trim(),
          description: typeof effort?.description === 'string' ? effort.description : '',
        })).filter((effort) => effort.id)
        : [],
    })).filter((choice) => choice.provider && choice.model)
  })
}

const EMPTY_CHAT_ORDER = Object.freeze([])
const EMPTY_CHAT_NODES = Object.freeze({ get: () => undefined, values: () => EMPTY_CHAT_ORDER })
const EMPTY_CHAT_SNAPSHOT = Object.freeze({ order: EMPTY_CHAT_ORDER, nodes: EMPTY_CHAT_NODES })

function routeFromSource(source) {
  if (!source || typeof source !== 'object') return undefined
  const provider = String(source.provider ?? '').trim()
  const model = String(source.model ?? '').trim()
  return provider && model ? { provider, model } : undefined
}

function routesFromChatNode(node) {
  if (!node || typeof node !== 'object') return []
  const routes = node.data?.tokenUsage?.routes
  if (Array.isArray(routes)) {
    const attributed = routes.map(routeFromSource).filter(Boolean)
    if (attributed.length > 0) return attributed
  }
  const candidates = [
    node.data?.closing?.finalNode?.source,
    node.data?.finalNode?.source,
    node.data?.source,
  ]
  return candidates.map(routeFromSource).filter(Boolean)
}

function latestActualRoute(order, nodes) {
  const keys = Array.isArray(order) ? order : []
  for (let index = keys.length - 1; index >= 0; index -= 1) {
    let node
    try { node = nodes?.get?.(keys[index]) } catch { node = undefined }
    const routes = routesFromChatNode(node)
    if (routes.length > 0) return routes[routes.length - 1]
  }
  let values
  try { values = nodes?.values?.() } catch { values = undefined }
  if (!Array.isArray(values)) return undefined
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const routes = routesFromChatNode(values[index])
    if (routes.length > 0) return routes[routes.length - 1]
  }
  return undefined
}

function sessionProjectionOf(sessions, sessionId, key) {
  try { return sessions?.binding?.(sessionId)?.session?.projections?.faceOf?.(key) } catch { return undefined }
}

function ModelRouterSelect({ locked, available, directory, load, select, sessions, sessionId, routerScope, useChat, useProjection }) {
  const state = useExternalSnapshot(directory)
  const routerState = useExternalSnapshot(routerScope)
  const modelSelectionFace = useMemo(
    () => sessionProjectionOf(sessions, sessionId, MODEL_SELECTION_PROJECTION_KEY),
    [sessions, sessionId],
  )
  const legacyModelSelectionFace = useMemo(
    () => sessionProjectionOf(sessions, sessionId, 'modelSelection'),
    [sessions, sessionId],
  )
  const modelSelectionFromSession = useExternalSnapshot(modelSelectionFace)
  const legacyModelSelectionFromSession = useExternalSnapshot(legacyModelSelectionFace)
  const [open, setOpen] = useState(false)
  const [pane, setPane] = useState('root')
  const rootRef = useRef(null)

  useEffect(() => {
    if (!available) return undefined
    try { load?.() } catch { /* the host owns the refresh failure */ }
    return undefined
  }, [available, load])

  const current = state?.current && typeof state.current === 'object' ? state.current : undefined
  const choices = useMemo(() => modelSelectionChoices(state), [state])
  const currentChoice = choices.find((choice) => choice.provider === current?.provider && choice.model === current?.model)
  const modelLabel = currentChoice?.label || String(current?.model ?? '').trim() || '选择模型'
  const autoEnabled = routerState?.status === 'ready' ? routerState.value?.enabled !== false : false
  const displayEffort = autoEnabled ? 'Auto' : ''
  const chatSelector = typeof useChat === 'function' ? useChat : (selector) => selector(EMPTY_CHAT_SNAPSHOT)
  const chatOrder = chatSelector((snapshot) => snapshot?.order ?? EMPTY_CHAT_ORDER)
  const chatNodes = chatSelector((snapshot) => snapshot?.nodes ?? EMPTY_CHAT_NODES)
  const projectionSelector = typeof useProjection === 'function' ? useProjection : () => undefined
  const modelSelection = projectionSelector(MODEL_SELECTION_PROJECTION_KEY)
    ?? projectionSelector('modelSelection')
    ?? modelSelectionFromSession
    ?? legacyModelSelectionFromSession
  const actualRoute = useMemo(
    () => routeFromSource(modelSelection?.lastUsed) ?? latestActualRoute(chatOrder, chatNodes),
    [modelSelection, chatOrder, chatNodes],
  )
  const actualModelLabel = actualRoute ? `${actualRoute.provider} / ${actualRoute.model}` : ''

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    return () => document.removeEventListener('mousedown', closeOutside)
  }, [open])

  if (!available) return null

  const refresh = () => {
    try { load?.() } catch { /* the host owns the refresh failure */ }
  }
  const choose = async (choice) => {
    if (locked || state?.status === 'selecting') return
    if (choice.provider === current?.provider && choice.model === current?.model) {
      setOpen(false)
      await disableAutoAfterManualSelection()
      return
    }
    let accepted = false
    try { accepted = await Promise.resolve(select?.({ provider: choice.provider, model: choice.model })) } catch { accepted = false }
    if (!accepted) return
    setOpen(false)
    await disableAutoAfterManualSelection()
  }

  const chooseEffort = async (effort) => {
    if (locked || state?.status === 'selecting' || !current) return
    const currentEffort = current.reasoningEffort ?? currentChoice?.defaultEffort
    if (currentEffort === effort) {
      setOpen(false)
      await disableAutoAfterManualSelection()
      return
    }
    let accepted = false
    try {
      accepted = await Promise.resolve(select?.({
        provider: current.provider,
        model: current.model,
        ...(effort ? { reasoningEffort: effort } : {}),
      }))
    } catch { accepted = false }
    if (!accepted) return
    setOpen(false)
    await disableAutoAfterManualSelection()
  }

  async function disableAutoAfterManualSelection() {
    const snapshot = readSnapshot(routerScope)
    if (snapshot?.value?.enabled === false) return
    let disabled = false
    try {
      if (typeof routerScope?.set === 'function') {
        await routerScope.set('enabled', false)
        disabled = true
      } else if (typeof routerScope?.mutate === 'function') {
        await routerScope.mutate([{ op: 'set', path: ['enabled'], value: false }])
        disabled = true
      }
    } catch { /* selection remains valid; report the settings failure below */ }
    const message = disabled
      ? '已手动切换模型，自动路由已关闭。'
      : '已手动切换模型，但自动路由状态未能更新。'
    manualSelectionNotice(sessions, sessionId, message)
  }

  return React.createElement('div', { ref: rootRef, style: styles.modelSelectRoot },
    React.createElement('button', {
      type: 'button',
      style: { ...styles.modelTrigger, ...(locked ? { opacity: .55, cursor: 'default' } : {}) },
      disabled: locked,
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      title: autoEnabled ? `${modelLabel} · Auto` : modelLabel,
      onClick: () => {
        if (open) { setOpen(false); setPane('root') }
        else { setOpen(true); setPane('root'); refresh() }
      },
    },
    React.createElement('span', { style: styles.modelTriggerLabel }, modelLabel),
    displayEffort ? React.createElement('span', { style: styles.modelTriggerEffort }, displayEffort) : null,
    React.createElement('span', { style: styles.modelChevron, 'aria-hidden': true }, '⌄'),
    ),
    autoEnabled ? React.createElement('span', {
      style: styles.actualModel,
      role: 'status',
      title: actualModelLabel ? `最近一次实际调用：${actualModelLabel}` : '自动路由尚未完成模型调用',
    }, actualModelLabel ? `实际：${actualModelLabel}` : '实际：等待请求') : null,
    open ? React.createElement('div', { role: 'menu', style: styles.modelMenu, 'aria-busy': state?.status === 'loading' || state?.status === 'selecting' },
      pane === 'root' ? React.createElement(React.Fragment, null,
        React.createElement('button', { type: 'button', style: styles.modelMenuButton, onClick: () => setPane('model') },
          React.createElement('span', { style: styles.modelMenuRow },
            React.createElement('span', null, '模型'),
            React.createElement('span', { style: styles.hint }, modelLabel),
          ),
        ),
        currentChoice?.efforts?.length || currentChoice?.defaultEffort
          ? React.createElement('button', { type: 'button', style: styles.modelMenuButton, onClick: () => setPane('effort') },
            React.createElement('span', { style: styles.modelMenuRow },
              React.createElement('span', null, '推理等级'),
              React.createElement('span', { style: styles.hint }, autoEnabled ? 'Auto' : (current?.reasoningEffort ?? currentChoice?.defaultEffort ?? '')),
            ),
          )
          : null,
      ) : null,
      pane === 'model' ? React.createElement(React.Fragment, null,
        state?.status === 'loading' ? React.createElement('div', { style: styles.hint }, '正在刷新模型列表…') : null,
        state?.error ? React.createElement('div', { style: { ...styles.notice, ...styles.error } }, String(state.error)) : null,
        choices.length === 0 && state?.status === 'ready' ? React.createElement('div', { style: styles.hint }, '没有可用的模型。') : null,
        choices.map((choice) => React.createElement('button', {
        key: `${choice.provider}\u0000${choice.model}`,
        type: 'button',
        role: 'menuitemradio',
        'aria-checked': choice.provider === current?.provider && choice.model === current?.model,
        style: choice.provider === current?.provider && choice.model === current?.model ? { ...styles.modelMenuButton, ...styles.modelMenuButtonActive } : styles.modelMenuButton,
        disabled: state?.status === 'selecting',
        onClick: () => choose(choice),
        },
        React.createElement('span', { style: styles.modelMenuRow },
          React.createElement('span', null, choice.label),
          choice.providerLabel ? React.createElement('span', { style: styles.hint }, choice.providerLabel) : null,
        ),
        choice.description ? React.createElement('span', { style: styles.modelMenuSubtext }, choice.description) : null,
        )),
      ) : null,
      pane === 'effort' ? React.createElement(React.Fragment, null,
        React.createElement('div', { style: styles.modelMenuTitle }, '推理等级'),
        currentChoice?.defaultEffort && !currentChoice.efforts.some((effort) => effort.id === currentChoice.defaultEffort)
          ? React.createElement('button', { type: 'button', style: styles.modelMenuButton, onClick: () => chooseEffort('') }, '默认')
          : null,
        (currentChoice?.efforts ?? []).map((effort) => React.createElement('button', {
          key: effort.id,
          type: 'button',
          role: 'menuitemradio',
          'aria-checked': (current?.reasoningEffort ?? currentChoice?.defaultEffort) === effort.id,
          style: (current?.reasoningEffort ?? currentChoice?.defaultEffort) === effort.id ? { ...styles.modelMenuButton, ...styles.modelMenuButtonActive } : styles.modelMenuButton,
          disabled: state?.status === 'selecting',
          onClick: () => chooseEffort(effort.id),
        },
        React.createElement('span', { style: styles.modelMenuRow },
          React.createElement('span', null, effort.name || effort.id),
          autoEnabled && effort.id === (current?.reasoningEffort ?? currentChoice?.defaultEffort) ? React.createElement('span', { style: styles.hint }, '当前') : null,
        ),
        effort.description ? React.createElement('span', { style: styles.modelMenuSubtext }, effort.description) : null,
        )),
      ) : null,
    ) : null,
  )
}

function manualSelectionNotice(sessions, sessionId, text) {
  try {
    const actx = sessions?.scope?.(sessionId)
    const input = actx?.get?.('conversation')?.input?.for?.(actx)
    input?.notify?.('info', text)
  } catch { /* notifications are advisory and must never block selection */ }
}

function RouteEditor({ tier, route, onChange, disabled, modelPool }) {
  const providers = Array.isArray(modelPool?.providers) ? modelPool.providers : []
  const providerOptions = providers
    .filter((provider) => typeof provider?.id === 'string' && provider.id.trim())
    .map((provider) => ({ id: provider.id, label: `${provider.name ?? provider.id}（${provider.id}）` }))
  const selectedProvider = providers.find((provider) => provider?.id === route.provider)
  const modelOptions = Array.isArray(selectedProvider?.models)
    ? selectedProvider.models
      .filter((model) => typeof model?.id === 'string' && model.id.trim())
      .map((model) => ({ id: model.id, label: `${model.name ?? model.id}（${model.id}）` }))
    : []
  const selectedModel = selectedProvider?.models?.find((model) => model?.id === route.model)
  const effortOptions = Array.isArray(selectedModel?.reasoningEfforts)
    ? selectedModel.reasoningEfforts.map((effort) => ({ id: effort, label: effort }))
    : []
  const update = (key) => (value) => onChange(key, value)
  const updateProvider = (value) => {
    onChange('provider', value)
    if (value !== route.provider) {
      onChange('model', '')
      onChange('reasoningEffort', '')
    }
  }
  const updateModel = (value) => {
    onChange('model', value)
    if (value !== route.model) onChange('reasoningEffort', '')
  }
  const availability = useModelAvailability(route.provider, route.model)
  const availabilityNotice = availability.status === 'available'
    ? '已确认模型可用'
    : availability.status === 'unavailable'
      ? `模型不可用：${availability.message}`
      : availability.status === 'checking'
        ? availability.message
        : availability.status === 'unknown'
          ? `暂时无法确认模型可用性：${availability.message}`
          : ''
  return React.createElement('div', { style: styles.group, key: tier },
    React.createElement('h3', { style: styles.groupTitle }, TIER_LABELS[tier]),
    React.createElement('div', { style: styles.grid },
      selectField(`${tier}-provider`, '模型提供商', route.provider, updateProvider, providerOptions, disabled, '请选择模型提供商'),
      selectField(`${tier}-model`, '模型', route.model, updateModel, modelOptions, disabled || !route.provider, route.provider ? '请选择模型' : '请先选择一个模型提供商'),
      selectField(`${tier}-effort`, '推理等级', route.reasoningEffort, update('reasoningEffort'), effortOptions, disabled || !route.model, route.model ? '请选择推理等级' : '请先选择模型'),
      field(`${tier}-tokens`, '最大输出令牌（可选）', route.maxTokens, update('maxTokens'), 'number', { min: 1, step: 1, placeholder: '留空表示沿用', disabled }),
    ),
    !route.provider ? React.createElement('div', { style: styles.hint }, '请先选择一个模型提供商') : null,
    availabilityNotice ? React.createElement('div', {
      style: availability.status === 'unavailable' ? { ...styles.notice, ...styles.error } : styles.notice,
      role: availability.status === 'unavailable' ? 'alert' : undefined,
    }, availabilityNotice) : null,
  )
}

function PolicyEditor({ policy, onChange, disabled }) {
  const set = (key) => (event) => onChange(key, event.target.type === 'checkbox' ? event.target.checked : event.target.value)
  return React.createElement('div', { style: styles.group },
    React.createElement('h3', { style: styles.groupTitle }, '路由策略'),
    React.createElement('div', { style: styles.grid },
      React.createElement('label', { style: styles.field },
        React.createElement('span', { style: styles.hint }, '默认档位'),
        React.createElement('select', { style: styles.select, value: policy.defaultTier, onChange: set('defaultTier'), disabled },
          TIERS.map((tier) => React.createElement('option', { key: tier, value: tier }, TIER_LABELS[tier])),
        ),
      ),
      field('standard-step', '进入标准档的步骤', policy.standardAtStep, set('standardAtStep'), 'number', { min: 1, step: 1, disabled }),
      field('hard-step', '进入困难档的步骤', policy.hardAtStep, set('hardAtStep'), 'number', { min: 1, step: 1, disabled }),
      field('tool-failures', '工具连续失败多少次后进入困难档', policy.hardAfterToolFailures, set('hardAfterToolFailures'), 'number', { min: 1, step: 1, disabled }),
      field('standard-chars', '进入标准档的字符数', policy.standardAtChars, set('standardAtChars'), 'number', { min: 1, step: 1, disabled }),
      field('hard-chars', '达到困难档位的字符数', policy.hardAtChars, set('hardAtChars'), 'number', { min: 1, step: 1, disabled }),
      field('max-routing-depth', '最大路由递归深度', policy.maxRoutingDepth, set('maxRoutingDepth'), 'number', { min: 1, step: 1, disabled }),
    ),
    React.createElement('div', { style: { display: 'grid', gap: 8 } },
      checkbox('subagents', '路由子代理', policy.routeSubagents, set('routeSubagents'), undefined, disabled),
      checkbox('preserve-max', '保留手动最大输出令牌数', policy.preserveMaxTokens, set('preserveMaxTokens'), undefined, disabled),
      checkbox('clear-effort', '未配置推理等级时清除旧值', policy.clearReasoningEffortWhenUnset, set('clearReasoningEffortWhenUnset'), undefined, disabled),
    ),
    React.createElement('div', { style: styles.group },
      React.createElement('h3', { style: styles.groupTitle }, '关键词与工具匹配'),
      React.createElement('p', { style: styles.hint }, '每行一个，也可以用逗号分隔；留空表示关闭该类匹配。'),
      React.createElement('div', { style: styles.grid },
        listField('easy-keywords', '简单档关键词', policy.easyKeywords, set('easyKeywords'), '例如：hello\n翻译', disabled),
        listField('standard-keywords', '标准档关键词', policy.standardKeywords, set('standardKeywords'), '例如：code\n文件', disabled),
        listField('hard-keywords', '困难档关键词', policy.hardKeywords, set('hardKeywords'), '例如：production\n迁移', disabled),
        listField('hard-tools', '困难工具名称', policy.hardTools, set('hardTools'), '例如：apply_patch\nshell', disabled),
        listField('failure-exclude', '忽略的工具失败', policy.failureExclude, set('failureExclude'), '例如：todo_write', disabled),
      ),
    ),
  )
}

/** DSH settings-section component. All values arrive through slot injection. */
function TieredRouterSection(props) {
  const { scope, useSnapshot } = props
  if (!scope || typeof useSnapshot !== 'function') return null
  const snapshot = useSnapshot((value) => value)
  const value = snapshot?.value
  const fallbackValue = isRecord(snapshot?.base) ? snapshot.base : undefined
  const resolvedValue = isRecord(value) ? value : fallbackValue
  const ready = snapshot?.status === 'ready' && isRecord(value)
  const writable = snapshot?.writable === true
  const editable = ready && writable
  const resettable = writable && isRecord(resolvedValue)
    && (typeof scope.mutate === 'function' || typeof scope.replace === 'function')
  const [draft, setDraft] = useState(() => draftFromValue(resolvedValue))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const modelPool = useModelPool()

  useEffect(() => {
    if (!dirty && resolvedValue) setDraft(draftFromValue(resolvedValue))
  }, [value, fallbackValue, resolvedValue, dirty])

  const changed = (path, nextValue) => {
    setDraft((previous) => setNested(previous, path, nextValue))
    setDirty(true)
    setError('')
  }

  const reset = () => {
    setDraft(draftFromValue(resolvedValue))
    setDirty(false)
    setError('')
  }

  const save = async () => {
    if (saving || !editable) return
    const invalidTier = TIERS.find((tier) => !String(draft.tiers[tier]?.provider ?? '').trim() || !String(draft.tiers[tier]?.model ?? '').trim())
    if (invalidTier) {
      setError(`${TIER_LABELS[invalidTier]} 必须选择模型提供商和模型`)
      return
    }
    if (modelPool.status !== 'ready') {
      setError('模型池尚未加载完成，暂时不能保存')
      return
    }
    const unlistedTier = TIERS.find((tier) => {
      const provider = modelPool.providers.find((row) => row?.id === draft.tiers[tier]?.provider)
      return !provider?.models?.some((row) => row?.id === draft.tiers[tier]?.model)
    })
    if (unlistedTier) {
      setError(`${TIER_LABELS[unlistedTier]} 中的模型不在当前模型池内，请重新选择`)
      return
    }
    setSaving(true)
    setError('')
    try {
      const checks = await Promise.all(TIERS.map((tier) => {
        const route = draft.tiers[tier]
        return requestModelCheck(route.provider, route.model, { force: true })
      }))
      const unavailableIndex = checks.findIndex((result) => result?.status === 'unavailable')
      if (unavailableIndex >= 0) {
        const tier = TIERS[unavailableIndex]
        setError(`${TIER_LABELS[tier]} 的模型不可用：${checks[unavailableIndex].message}`)
        return
      }
      const operations = operationsForDraft(draft)
      if (typeof scope.mutate === 'function') {
        await scope.mutate(operations)
      } else if (typeof scope.replace === 'function') {
        // Compatibility with an older SettingsScope surface. New DSH builds
        // use mutate so optional fields can be explicitly unset atomically.
        await scope.replace(valueForSave(draft))
      } else {
        throw new Error('当前 DSH 版本不支持设置写入')
      }
      setDirty(false)
    } catch (saveError) {
      setError(String(saveError?.message ?? saveError ?? '保存失败'))
    } finally {
      setSaving(false)
    }
  }

  const resetAll = async () => {
    if (saving || !resettable) return
    setSaving(true)
    setError('')
    try {
      if (typeof scope.mutate === 'function') await scope.mutate([{ op: 'unset', path: [] }])
      else await scope.replace({})
      setDirty(false)
    } catch (resetError) {
      setError(String(resetError?.message ?? resetError ?? '重置失败'))
    } finally {
      setSaving(false)
    }
  }

  const statusNotice = useMemo(() => {
    if (snapshot?.status === 'loading') return '正在读取 DSH 设置…'
    if (snapshot?.status === 'unavailable') return '当前运行模式没有可写的 DSH Settings 服务；页面保持只读。'
    if (!ready && fallbackValue) return '持久化设置不可用，当前显示组合配置；可恢复组合配置来清除用户覆盖。'
    if (!ready) return '配置尚未就绪，暂时不会修改模型路由。'
    if (!writable) return '当前 DSH Settings 为只读，页面仅供查看。'
    return ''
  }, [snapshot?.status, ready, fallbackValue, writable])

  return React.createElement('div', { style: styles.section },
    React.createElement('div', null,
      React.createElement('h2', { style: styles.heading }, '模型路由'),
      React.createElement('p', { style: styles.description }, '根据任务难度在简单、标准、困难三档之间自动切换模型。模型名称和模型提供商完全由你配置。'),
    ),
    statusNotice ? React.createElement('div', { style: styles.notice }, statusNotice) : null,
    error ? React.createElement('div', { style: { ...styles.notice, ...styles.error }, role: 'alert' }, error) : null,
    modelPool.status === 'error' ? React.createElement('div', { style: { ...styles.notice, ...styles.error }, role: 'alert' }, modelPool.error || '模型池读取失败') : null,
    React.createElement('div', { style: styles.toolbar },
      checkbox('enabled', '启用自动模型路由', draft.enabled, (event) => changed(['enabled'], event.target.checked), '关闭后保留设置，但请求直接沿用 DSH 当前模型。', !editable),
      dirty ? React.createElement('span', { style: styles.hint }, '有未保存的修改') : null,
    ),
    React.createElement('div', { style: styles.toolbar },
      React.createElement('span', { style: styles.hint }, modelPool.status === 'loading' ? '正在读取模型池…' : `可选模型提供商：${modelPool.providers.length} 个`),
      React.createElement('button', { type: 'button', style: styles.button, onClick: modelPool.reload, disabled: modelPool.status === 'loading' }, '刷新模型池'),
    ),
    TIERS.map((tier) => React.createElement(RouteEditor, {
      key: tier,
      tier,
      route: draft.tiers[tier],
      disabled: !editable,
      modelPool,
      onChange: (key, next) => changed(['tiers', tier, key], next),
    })),
    React.createElement(PolicyEditor, {
      policy: draft.policy,
      disabled: !editable,
      onChange: (key, next) => changed(['policy', key], next),
    }),
    React.createElement('div', { style: styles.actions },
      React.createElement('button', { type: 'button', style: styles.button, onClick: reset, disabled: saving || !dirty }, '放弃修改'),
      React.createElement('button', { type: 'button', style: styles.button, onClick: resetAll, disabled: saving || !resettable }, '恢复组合配置'),
      React.createElement('button', { type: 'button', style: { ...styles.button, ...styles.primary }, onClick: save, disabled: saving || !editable || !dirty }, saving ? '保存中…' : '保存'),
    ),
  )
}

export const inject = ['slots', 'settingsScope', 'sessions', 'modelDirectories']

export function apply(ctx) {
  let scope
  try {
    const nativeScope = ctx.settingsScope.bind({ namespace: ROUTER_SETTINGS_NAMESPACE })
    scope = new HybridSettingsScope(nativeScope)
  } catch (error) {
    try { ctx.logger?.warn?.(`dsh-tiered-model-router native settings UI unavailable: ${String(error?.message ?? error)}`) } catch { /* optional logger */ }
    scope = new HttpSettingsScope()
    scope.load()
  }
  try {
    const sessions = ctx.sessions
    const modelDirectories = ctx.modelDirectories
    if (ctx.slots && typeof ctx.slots.inject === 'function' && modelDirectories && sessions) {
      ctx.slots.inject('conversation.input.model', () => ctx.slots.register({
        name: 'conversation.input.model',
        priority: -100,
        inject: (sessionId) => {
          let directory
          try { directory = modelDirectories.directoryFor(sessionId) } catch { return { available: false } }
          const available = typeof sessions.subagentAddress !== 'function' || sessions.subagentAddress(sessionId) === undefined
          return {
            available,
            directory: directory?.store,
            load: () => { if (available) directory?.load?.().catch?.(() => {}) },
            select: (selection) => available && typeof directory?.select === 'function'
              ? directory.select(selection).then(() => true, () => false)
              : Promise.resolve(false),
            sessions,
            sessionId,
            routerScope: scope,
          }
        },
      }, ModelRouterSelect))
    }
  } catch (error) {
    try { ctx.logger?.warn?.(`dsh-tiered-model-router model selector unavailable: ${String(error?.message ?? error)}`) } catch { /* optional logger */ }
  }
  const injected = () => ({ scope, hooks: { snapshot: scope } })
  try {
    ctx.slots.inject('settings.section', () => ctx.slots.register({
      name: 'settings.section',
      id: 'tiered-model-router',
      order: 20,
      label: () => '模型路由',
      inject: injected,
    }, TieredRouterSection))
  } catch (error) {
    try { ctx.logger?.warn?.(`dsh-tiered-model-router settings section unavailable: ${String(error?.message ?? error)}`) } catch { /* optional logger */ }
  }
}
