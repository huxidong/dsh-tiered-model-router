import Schema from '@deepseek-ai/schemastery'
import { TIERS, TIER_RANK } from './types.js'

const DEFAULT_HARD_KEYWORDS = [
  'architecture', 'architect', 'migration', 'security', 'vulnerability',
  'exploit', 'production', 'incident', 'root cause', 'race condition',
  'concurrency', 'deadlock', 'performance', 'database', 'schema change',
  'deploy', 'deployment', 'refactor', 'cross-file', 'breaking change',
  '架构', '迁移', '安全', '漏洞', '生产环境', '线上事故', '根因', '竞态',
  '并发', '死锁', '性能', '数据库', '部署', '重构', '跨文件', '破坏性变更',
  '删除全部', '清空数据', 'rm -rf', 'drop database',
]

const DEFAULT_STANDARD_KEYWORDS = [
  'code', 'coding', 'program', 'function', 'class', 'bug', 'debug', 'test',
  'file', 'files', 'command', 'shell', 'terminal', 'tool', 'api', 'config',
  'implement', 'modify', 'edit', 'create', 'write', 'read', 'search', 'git',
  '代码', '编程', '函数', '类', '调试', '测试', '文件', '命令', '终端', '工具',
  '接口', '配置', '实现', '修改', '创建', '读写', '搜索', '仓库',
]

const DEFAULT_EASY_KEYWORDS = [
  'hello', 'hi', 'thanks', 'thank you', '翻译', 'translate', 'summarize',
  'summary', '简单解释', 'what is', '定义', 'define', 'greet', '问候',
]

const DEFAULT_HARD_TOOLS = [
  'shell', 'bash', 'powershell', 'terminal', 'run_command', 'execute_code',
  'write_file', 'delete_file', 'apply_patch', 'database', 'deploy',
]

const RouteSchema = Schema.object({
  provider: Schema.string(),
  model: Schema.string(),
  reasoningEffort: Schema.string(),
  maxTokens: Schema.number(),
})

// Keep loader validation permissive; normalizeConfig is the semantic boundary
// and deliberately fails open when a host supplies malformed values.
export const Config = Schema.object({
  enabled: Schema.boolean(),
  tiers: Schema.object({
    easy: RouteSchema,
    standard: RouteSchema,
    hard: RouteSchema,
  }),
  policy: Schema.object({
    defaultTier: Schema.string(),
    preserveExplicitSelection: Schema.boolean(),
    takeOverUnknownSelection: Schema.boolean(),
    routeSubagents: Schema.boolean(),
    standardAtStep: Schema.number(),
    hardAtStep: Schema.number(),
    hardAfterToolFailures: Schema.number(),
    preserveMaxTokens: Schema.boolean(),
    clearReasoningEffortWhenUnset: Schema.boolean(),
    standardAtChars: Schema.number(),
    hardAtChars: Schema.number(),
    easyKeywords: Schema.array(Schema.string()),
    standardKeywords: Schema.array(Schema.string()),
    hardKeywords: Schema.array(Schema.string()),
    hardTools: Schema.array(Schema.string()),
    failureExclude: Schema.array(Schema.string()),
  }),
})

const defaults = Object.freeze({
  enabled: true,
  policy: Object.freeze({
    defaultTier: 'standard',
    preserveExplicitSelection: true,
    takeOverUnknownSelection: false,
    routeSubagents: false,
    standardAtStep: 2,
    hardAtStep: 3,
    hardAfterToolFailures: 2,
    preserveMaxTokens: true,
    clearReasoningEffortWhenUnset: true,
    standardAtChars: 500,
    hardAtChars: 2500,
    easyKeywords: DEFAULT_EASY_KEYWORDS,
    standardKeywords: DEFAULT_STANDARD_KEYWORDS,
    hardKeywords: DEFAULT_HARD_KEYWORDS,
    hardTools: DEFAULT_HARD_TOOLS,
    failureExclude: ['todo_write', 'job_output', 'job_list'],
  }),
})

function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) }
function nonEmptyString(value) { return typeof value === 'string' && value.trim().length > 0 }
function positiveInteger(value, fallback) {
  return Number.isSafeInteger(value) && value >= 1 ? value : fallback
}
function normalizeList(value, fallback) {
  if (!Array.isArray(value)) return [...fallback]
  return value.filter(nonEmptyString).map((item) => item.trim().toLocaleLowerCase())
}
function normalizeRoute(value) {
  if (!isRecord(value) || !nonEmptyString(value.provider) || !nonEmptyString(value.model)) return undefined
  const route = { provider: value.provider.trim(), model: value.model.trim() }
  if (nonEmptyString(value.reasoningEffort)) route.reasoningEffort = value.reasoningEffort.trim()
  if (Number.isSafeInteger(value.maxTokens) && value.maxTokens >= 1) route.maxTokens = value.maxTokens
  return Object.freeze(route)
}
function sameRoute(a, b) {
  return a.provider === b.provider && a.model === b.model
    && a.reasoningEffort === b.reasoningEffort && a.maxTokens === b.maxTokens
}

/** Normalize untrusted loader/config input. Returns undefined to request fail-open mode. */
export function normalizeConfig(input) {
  if (!isRecord(input)) return undefined
  if (input.enabled !== undefined && typeof input.enabled !== 'boolean') return undefined
  const tiersInput = isRecord(input.tiers) ? input.tiers : undefined
  if (!tiersInput) return undefined
  const tiers = {}
  for (const tier of TIERS) {
    const route = normalizeRoute(tiersInput[tier])
    if (!route) return undefined
    tiers[tier] = route
  }
  if (TIERS.every((tier) => sameRoute(tiers.easy, tiers[tier]))) return undefined
  const policyInput = isRecord(input.policy) ? input.policy : {}
  const defaultTier = TIERS.includes(policyInput.defaultTier) ? policyInput.defaultTier : defaults.policy.defaultTier
  const standardAtChars = positiveInteger(policyInput.standardAtChars, defaults.policy.standardAtChars)
  const hardAtChars = positiveInteger(policyInput.hardAtChars, defaults.policy.hardAtChars)
  const policy = {
    ...defaults.policy,
    ...policyInput,
    defaultTier,
    standardAtStep: positiveInteger(policyInput.standardAtStep, defaults.policy.standardAtStep),
    hardAtStep: positiveInteger(policyInput.hardAtStep, defaults.policy.hardAtStep),
    hardAfterToolFailures: positiveInteger(policyInput.hardAfterToolFailures, defaults.policy.hardAfterToolFailures),
    standardAtChars: Math.min(standardAtChars, hardAtChars),
    hardAtChars: Math.max(hardAtChars, standardAtChars),
    easyKeywords: normalizeList(policyInput.easyKeywords, defaults.policy.easyKeywords),
    standardKeywords: normalizeList(policyInput.standardKeywords, defaults.policy.standardKeywords),
    hardKeywords: normalizeList(policyInput.hardKeywords, defaults.policy.hardKeywords),
    hardTools: normalizeList(policyInput.hardTools, defaults.policy.hardTools),
    failureExclude: normalizeList(policyInput.failureExclude, defaults.policy.failureExclude),
  }
  for (const key of ['preserveExplicitSelection', 'takeOverUnknownSelection', 'routeSubagents', 'preserveMaxTokens', 'clearReasoningEffortWhenUnset']) {
    policy[key] = typeof policy[key] === 'boolean' ? policy[key] : defaults.policy[key]
  }
  return Object.freeze({ enabled: input.enabled !== false, tiers: Object.freeze(tiers), policy: Object.freeze(policy) })
}

export function routeKey(route) {
  if (!route || !nonEmptyString(route.provider) || !nonEmptyString(route.model)) return ''
  return `${route.provider}\u0000${route.model}`
}

export function tierForRoute(route, tiers) {
  const key = routeKey(route)
  for (const tier of TIERS) if (routeKey(tiers[tier]) === key) return tier
  return undefined
}

export { defaults as DEFAULTS, DEFAULT_EASY_KEYWORDS, DEFAULT_STANDARD_KEYWORDS, DEFAULT_HARD_KEYWORDS, DEFAULT_HARD_TOOLS, TIER_RANK }
