import { TIER_RANK } from './types.js'

function textFromContent(content, output) {
  if (typeof content === 'string') { output.push(content); return }
  if (!Array.isArray(content)) return
  for (const block of content) {
    if (typeof block === 'string') output.push(block)
    else if (block && typeof block === 'object' && typeof block.text === 'string') output.push(block.text)
  }
}

/** Extract only model-visible text; malformed blocks are ignored safely. */
export function extractMessageText(messages) {
  const output = []
  if (!Array.isArray(messages)) return ''
  for (const message of messages) {
    if (!message || typeof message !== 'object') continue
    textFromContent(message.content, output)
  }
  return output.join('\n').replace(/\s+/g, ' ').trim()
}

function includesAny(text, list) {
  return list.some((item) => item && text.includes(item))
}
function hasOperationIntent(text) {
  return /(?:\b(?:code|file|files|command|shell|terminal|tool|api|git|test|implement|modify|edit|create|write|read|search|debug)\b|代码|文件|命令|终端|工具|接口|仓库|实现|修改|创建|测试|调试)/i.test(text)
}

/**
 * Pure deterministic classifier. It intentionally favors a higher tier when
 * signals conflict; uncertainty should cost latency, not correctness.
 */
export function classifyTask(messages, policy) {
  const text = extractMessageText(messages)
  const normalized = text.toLocaleLowerCase()
  const hard = includesAny(normalized, policy.hardKeywords)
    || text.length >= policy.hardAtChars
  const standard = hard || includesAny(normalized, policy.standardKeywords)
    || hasOperationIntent(normalized)
    || text.length >= policy.standardAtChars
  if (hard) return { tier: 'hard', text, reasons: ['hard-signal'] }
  if (standard) return { tier: 'standard', text, reasons: ['standard-signal'] }
  if (includesAny(normalized, policy.easyKeywords)) return { tier: 'easy', text, reasons: ['easy-signal'] }
  return { tier: policy.defaultTier, text, reasons: ['default'] }
}

export function maxTier(a, b) {
  return TIER_RANK[a] >= TIER_RANK[b] ? a : b
}
