const computeSingleReplacement = (originalText, groups, replacement) => {
  if (!replacement) return '***'
  if (typeof replacement !== 'string') return String(replacement)
  if (!replacement.includes('$')) return replacement

  return replacement.replace(/\$(\d{1,2}|&)/g, (match, key) => {
    if (key === '&') {
      return originalText
    }
    const idx = parseInt(key, 10)
    if (idx >= 1 && idx <= groups.length) {
      const val = groups[idx - 1]
      return val == null ? '' : val
    }
    return match
  })
}

const collectMatchesFromOriginal = (text, rules) => {
  const allRawMatches = []

  for (const rule of rules) {
    if (!rule.enabled) continue
    const pattern = rule.groupPattern || rule.pattern
    let regex
    try {
      regex = new RegExp(pattern, 'g')
    } catch {
      continue
    }

    let match
    while ((match = regex.exec(text)) !== null) {
      allRawMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        original: match[0],
        groups: match.slice(1),
        ruleId: rule.id,
        ruleName: rule.name,
        replacement: rule.replacement || '***',
      })
      if (match.index === regex.lastIndex) {
        regex.lastIndex++
      }
    }
  }

  allRawMatches.sort((a, b) => a.start - b.start)

  const selected = []
  let lastEnd = -1
  for (const m of allRawMatches) {
    if (m.start >= lastEnd) {
      selected.push(m)
      lastEnd = m.end
    }
  }

  return selected
}

export const applyRule = (text, rule) => {
  if (!text || !rule || !rule.enabled) {
    return { result: text || '', matches: [] }
  }
  const rules = [rule]
  const selected = collectMatchesFromOriginal(text, rules)

  if (selected.length === 0) {
    return { result: text, matches: [] }
  }

  const parts = []
  let cursor = 0
  const matches = []

  for (const m of selected) {
    if (cursor < m.start) {
      parts.push(text.slice(cursor, m.start))
    }
    const replaced = computeSingleReplacement(m.original, m.groups, m.replacement)
    parts.push(replaced)
    cursor = m.end
    matches.push({
      start: m.start,
      end: m.end,
      original: m.original,
      ruleId: m.ruleId,
      ruleName: m.ruleName,
    })
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }

  return { result: parts.join(''), matches }
}

export const applyRules = (text, rules) => {
  if (!text) return { result: '', matches: [], stats: {} }
  if (!rules || rules.length === 0) return { result: text, matches: [], stats: {} }

  const enabledRules = rules.filter((r) => r.enabled)
  if (enabledRules.length === 0) return { result: text, matches: [], stats: {} }

  const selectedMatches = collectMatchesFromOriginal(text, enabledRules)

  if (selectedMatches.length === 0) {
    return { result: text, matches: [], stats: {} }
  }

  const parts = []
  let cursor = 0
  const stats = {}
  const matches = []

  for (const m of selectedMatches) {
    if (cursor < m.start) {
      parts.push(text.slice(cursor, m.start))
    }
    const replaced = computeSingleReplacement(m.original, m.groups, m.replacement)
    parts.push(replaced)
    cursor = m.end
    stats[m.ruleId] = (stats[m.ruleId] || 0) + 1
    matches.push({
      start: m.start,
      end: m.end,
      original: m.original,
      ruleId: m.ruleId,
      ruleName: m.ruleName,
    })
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }

  return { result: parts.join(''), matches, stats }
}

export const countSensitiveInfo = (text, rules) => {
  if (!text) return { total: 0, details: {} }
  if (!rules || rules.length === 0) return { total: 0, details: {} }

  const enabledRules = rules.filter((r) => r.enabled)
  if (enabledRules.length === 0) return { total: 0, details: {} }

  const selectedMatches = collectMatchesFromOriginal(text, enabledRules)

  const details = {}
  for (const rule of rules) {
    if (!rule.enabled) continue
    const count = selectedMatches.filter((m) => m.ruleId === rule.id).length
    if (count > 0) {
      details[rule.id] = { count, name: rule.name }
    }
  }

  const total = selectedMatches.length
  return { total, details }
}

export const buildHighlightSegments = (originalText, rules) => {
  if (!originalText) return []
  if (!rules || rules.length === 0) return [{ type: 'normal', value: originalText }]

  const enabledRules = rules.filter((r) => r.enabled)
  if (enabledRules.length === 0) return [{ type: 'normal', value: originalText }]

  const selectedMatches = collectMatchesFromOriginal(originalText, enabledRules)

  if (selectedMatches.length === 0) return [{ type: 'normal', value: originalText }]

  const segments = []
  let cursor = 0

  for (const m of selectedMatches) {
    if (cursor < m.start) {
      segments.push({ type: 'normal', value: originalText.slice(cursor, m.start) })
    }
    segments.push({
      type: 'masked',
      value: originalText.slice(m.start, m.end),
      ruleId: m.ruleId,
      ruleName: m.ruleName,
    })
    cursor = m.end
  }

  if (cursor < originalText.length) {
    segments.push({ type: 'normal', value: originalText.slice(cursor) })
  }

  return segments
}

export const processBatchLines = (text, rules) => {
  if (!text) return []
  const lines = text.split('\n')
  return lines.map((line, index) => {
    const { result, matches, stats } = applyRules(line, rules)
    return {
      lineNum: index + 1,
      original: line,
      masked: result,
      matches,
      stats,
    }
  })
}

export const generateCSV = (data, isBatchMode) => {
  const BOM = '\uFEFF'
  const escapeCSV = (str) => {
    const s = String(str == null ? '' : str)
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  let csv
  if (isBatchMode) {
    const rows = data.map((row) => `${escapeCSV(row.original)},${escapeCSV(row.masked)}`)
    csv = [escapeCSV('原文本'), escapeCSV('脱敏结果'), ...rows].join('\n')
  } else {
    const original = Array.isArray(data) ? data[0]?.original ?? '' : data.original ?? ''
    const masked = Array.isArray(data) ? data[0]?.masked ?? '' : data.masked ?? ''
    csv = [escapeCSV('原文本'), escapeCSV('脱敏结果'), escapeCSV(original), escapeCSV(masked)].join('\n')
  }

  return BOM + csv
}

export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'data-mask-result.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const validateRegex = (pattern) => {
  if (!pattern) return { valid: false, error: '正则表达式不能为空' }
  try {
    new RegExp(pattern)
    return { valid: true, error: null }
  } catch (e) {
    return { valid: false, error: e.message }
  }
}

export const debounce = (fn, delay) => {
  let timer = null
  const debounced = (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
  }
  return debounced
}

export const getStatsSummary = (stats, rules) => {
  const total = Object.values(stats).reduce((sum, v) => sum + v, 0)
  const details = []
  for (const rule of rules) {
    if (stats[rule.id]) {
      details.push({ name: rule.name, count: stats[rule.id] })
    }
  }
  return { total, details }
}
