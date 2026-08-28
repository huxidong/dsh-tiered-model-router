import React, { useEffect, useMemo, useState } from 'react'

export const ROUTER_SETTINGS_NAMESPACE = 'dsh-tiered-model-router'

const TIERS = ['easy', 'standard', 'hard']
const TIER_LABELS = { easy: 'Easy', standard: 'Standard', hard: 'Hard' }
const DEFAULT_ROUTE = { provider: '', model: '', reasoningEffort: '', maxTokens: '' }
const DEFAULT_POLICY = {
  defaultTier: 'standard',
  preserveExplicitSelection: true,
  takeOverUnknownSelection: false,
  routeSubagents: false,
  standardAtStep: 2,
  hardAtStep: 3,
  hardAfterToolFailures: 2,
  standardAtChars: 500,
  hardAtChars: 2500,
  preserveMaxTokens: true,
  clearReasoningEffortWhenUnset: true,
}

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
  select: { width: '100%', boxSizing: 'border-box', border: '1px solid var(--dsw-border-default, #d0d5dd)', borderRadius: 6, padding: '8px 10px', font: 'inherit', color: 'var(--dsw-fg-primary, #1f2329)', background: 'var(--dsw-bg-input, #fff)' },
  check: { display: 'flex', alignItems: 'flex-start', gap: 9, minHeight: 32 },
  actions: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, paddingTop: 4 },
  button: { border: '1px solid var(--dsw-border-default, #d0d5dd)', borderRadius: 6, padding: '8px 14px', font: 'inherit', cursor: 'pointer', background: 'var(--dsw-bg-input, #fff)', color: 'var(--dsw-fg-primary, #1f2329)' },
  primary: { background: 'var(--dsw-accent, #2563eb)', borderColor: 'var(--dsw-accent, #2563eb)', color: '#fff' },
  notice: { border: '1px solid var(--dsw-border-subtle, #e5e7eb)', borderRadius: 6, padding: '10px 12px', color: 'var(--dsw-fg-secondary, #667085)', fontSize: 13, lineHeight: 1.45 },
  error: { borderColor: '#f2b8b5', background: '#fff7f6', color: '#9b1c1c' },
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  try { return structuredClone(value) } catch { return value }
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
      provider: typeof route.provider === 'string' ? route.provider : '',
      model: typeof route.model === 'string' ? route.model : '',
      reasoningEffort: typeof route.reasoningEffort === 'string' ? route.reasoningEffort : '',
      maxTokens: Number.isSafeInteger(route.maxTokens) && route.maxTokens >= 1 ? String(route.maxTokens) : '',
    }
  }
  for (const [key, fallback] of Object.entries(DEFAULT_POLICY)) {
    const candidate = policy[key]
    if (typeof fallback === 'boolean') result.policy[key] = typeof candidate === 'boolean' ? candidate : fallback
    else if (key === 'defaultTier') result.policy[key] = TIERS.includes(candidate) ? candidate : fallback
    else result.policy[key] = Number.isSafeInteger(candidate) && candidate >= 1 ? candidate : fallback
  }
  return result
}

function numberOrFallback(value, fallback) {
  const number = Number(value)
  return Number.isSafeInteger(number) && number >= 1 ? number : fallback
}

function routeValue(route) {
  const result = { provider: String(route.provider ?? '').trim(), model: String(route.model ?? '').trim() }
  const effort = String(route.reasoningEffort ?? '').trim()
  if (effort) result.reasoningEffort = effort
  const maxTokens = numberOrFallback(route.maxTokens, 0)
  if (maxTokens > 0) result.maxTokens = maxTokens
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

function checkbox(key, label, checked, onChange, hint) {
  return React.createElement('label', { key, style: styles.check },
    React.createElement('input', { type: 'checkbox', checked: Boolean(checked), onChange, style: { marginTop: 3 } }),
    React.createElement('span', null,
      React.createElement('span', { style: styles.label }, label),
      hint ? React.createElement('div', { style: styles.hint }, hint) : null,
    ),
  )
}

function RouteEditor({ tier, route, onChange }) {
  const update = (key) => (event) => onChange(key, event.target.value)
  return React.createElement('div', { style: styles.group, key: tier },
    React.createElement('h3', { style: styles.groupTitle }, TIER_LABELS[tier]),
    React.createElement('div', { style: styles.grid },
      field(`${tier}-provider`, 'Provider', route.provider, update('provider'), 'text', { placeholder: '例如 openai' }),
      field(`${tier}-model`, 'Model', route.model, update('model'), 'text', { placeholder: '例如 dsh-fast' }),
      field(`${tier}-effort`, 'Reasoning effort', route.reasoningEffort, update('reasoningEffort'), 'text', { placeholder: 'low / medium / high' }),
      field(`${tier}-tokens`, 'Max tokens（可选）', route.maxTokens, update('maxTokens'), 'number', { min: 1, step: 1, placeholder: '留空表示沿用' }),
    ),
  )
}

function PolicyEditor({ policy, onChange }) {
  const set = (key) => (event) => onChange(key, event.target.type === 'checkbox' ? event.target.checked : event.target.value)
  return React.createElement('div', { style: styles.group },
    React.createElement('h3', { style: styles.groupTitle }, 'Routing policy'),
    React.createElement('div', { style: styles.grid },
      React.createElement('label', { style: styles.field },
        React.createElement('span', { style: styles.hint }, 'Default tier'),
        React.createElement('select', { style: styles.select, value: policy.defaultTier, onChange: set('defaultTier') },
          TIERS.map((tier) => React.createElement('option', { key: tier, value: tier }, TIER_LABELS[tier])),
        ),
      ),
      field('standard-step', 'Standard at step', policy.standardAtStep, set('standardAtStep'), 'number', { min: 1, step: 1 }),
      field('hard-step', 'Hard at step', policy.hardAtStep, set('hardAtStep'), 'number', { min: 1, step: 1 }),
      field('tool-failures', 'Hard after tool failures', policy.hardAfterToolFailures, set('hardAfterToolFailures'), 'number', { min: 1, step: 1 }),
      field('standard-chars', 'Standard at characters', policy.standardAtChars, set('standardAtChars'), 'number', { min: 1, step: 1 }),
      field('hard-chars', 'Hard at characters', policy.hardAtChars, set('hardAtChars'), 'number', { min: 1, step: 1 }),
    ),
    React.createElement('div', { style: { display: 'grid', gap: 8 } },
      checkbox('preserve-explicit', '保留手动选择的模型', policy.preserveExplicitSelection, set('preserveExplicitSelection'), '识别到用户手动指定的 provider/model 时不接管。'),
      checkbox('take-over-unknown', '接管未知的手动模型', policy.takeOverUnknownSelection, set('takeOverUnknownSelection'), '关闭时，未知模型继续由用户选择。'),
      checkbox('subagents', '路由子代理', policy.routeSubagents, set('routeSubagents')),
      checkbox('preserve-max', '保留手动 max tokens', policy.preserveMaxTokens, set('preserveMaxTokens')),
      checkbox('clear-effort', '未配置 reasoning effort 时清除旧值', policy.clearReasoningEffortWhenUnset, set('clearReasoningEffortWhenUnset')),
    ),
  )
}

/** DSH settings-section component. All values arrive through slot injection. */
export function TieredRouterSection(props) {
  const { scope, useSnapshot } = props
  if (!scope || typeof useSnapshot !== 'function') return null
  const snapshot = useSnapshot((value) => value)
  const value = snapshot?.value
  const ready = snapshot?.status === 'ready' && isRecord(value)
  const [draft, setDraft] = useState(() => draftFromValue(value))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!dirty && ready) setDraft(draftFromValue(value))
  }, [value, ready, dirty])

  const changed = (path, nextValue) => {
    setDraft((previous) => setNested(previous, path, nextValue))
    setDirty(true)
    setError('')
  }

  const reset = () => {
    setDraft(draftFromValue(value))
    setDirty(false)
    setError('')
  }

  const save = async () => {
    if (saving || !ready) return
    setSaving(true)
    setError('')
    try {
      const operations = operationsForDraft(draft)
      if (typeof scope.mutate === 'function') {
        await scope.mutate(operations)
      } else if (typeof scope.set === 'function') {
        for (const operation of operations) await scope.set(operation.path.join('.'), operation.value)
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
    if (saving || typeof scope.mutate !== 'function') return
    setSaving(true)
    setError('')
    try {
      await scope.mutate([{ op: 'unset', path: [] }])
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
    if (!ready) return '配置尚未就绪，暂时不会修改模型路由。'
    return ''
  }, [snapshot?.status, ready])

  return React.createElement('div', { style: styles.section },
    React.createElement('div', null,
      React.createElement('h2', { style: styles.heading }, '模型路由'),
      React.createElement('p', { style: styles.description }, '根据任务难度在 Easy、Standard、Hard 三档之间自动切换模型。模型名称和 Provider 完全由你配置。'),
    ),
    statusNotice ? React.createElement('div', { style: styles.notice }, statusNotice) : null,
    error ? React.createElement('div', { style: { ...styles.notice, ...styles.error }, role: 'alert' }, error) : null,
    React.createElement('div', { style: styles.toolbar },
      checkbox('enabled', '启用自动模型路由', draft.enabled, (event) => changed(['enabled'], event.target.checked), '关闭后保留设置，但请求直接沿用 DSH 当前模型。'),
      dirty ? React.createElement('span', { style: styles.hint }, '有未保存的修改') : null,
    ),
    TIERS.map((tier) => React.createElement(RouteEditor, {
      key: tier,
      tier,
      route: draft.tiers[tier],
      onChange: (key, next) => changed(['tiers', tier, key], next),
    })),
    React.createElement(PolicyEditor, {
      policy: draft.policy,
      onChange: (key, next) => changed(['policy', key], next),
    }),
    React.createElement('div', { style: styles.actions },
      React.createElement('button', { type: 'button', style: styles.button, onClick: reset, disabled: saving || !dirty }, '放弃修改'),
      React.createElement('button', { type: 'button', style: styles.button, onClick: resetAll, disabled: saving || !ready || typeof scope.mutate !== 'function' }, '恢复组合配置'),
      React.createElement('button', { type: 'button', style: { ...styles.button, ...styles.primary }, onClick: save, disabled: saving || !ready || !dirty }, saving ? '保存中…' : '保存'),
    ),
  )
}

export const inject = ['slots', 'settingsScope']

export function apply(ctx) {
  let scope
  try {
    scope = ctx.settingsScope.bind({ namespace: ROUTER_SETTINGS_NAMESPACE })
  } catch (error) {
    try { ctx.logger?.warn?.(`dsh-tiered-model-router settings UI unavailable: ${String(error?.message ?? error)}`) } catch { /* optional logger */ }
    return
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
