export const applyRule = (text, rule) => {
  if (!text || !rule || !rule.enabled) {
    return { result: text || '', matches: [] }
  }

  const pattern = rule.groupPattern || rule.pattern
  let regex
  try {
    regex = new RegExp(pattern, 'g')
  } catch {
    return { result: text, matches: [] }
  }

  const matches = []
  let match

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      ruleId: rule.id,
      ruleName: rule.name,
    })
    if (match.index === regex.lastIndex) {
      regex.lastIndex++
    }
  }

  regex.lastIndex = 0
  const replacement = rule.replacement || '***'
  const result = text.replace(regex, replacement)

  return { result, matches }
}

export const applyRules = (text, rules) => {
  if (!text) return { result: '', matches: [], stats: {} }
  if (!rules || rules.length === 0) return { result: text, matches: [], stats: {} }

  const enabledRules = rules.filter((r) => r.enabled)
  if (enabledRules.length === 0) return { result: text, matches: [], stats: {} }

  let currentText = text
  const allMatches = []
  const stats = {}

  for (const rule of enabledRules) {
    const { result, matches } = applyRule(currentText, rule)
    currentText = result
    for (const m of matches) {
      allMatches.push(m)
      stats[rule.id] = (stats[rule.id] || 0) + 1
    }
  }

  return { result: currentText, matches: allMatches, stats }
}

export const countSensitiveInfo = (text, rules) => {
  if (!text) return { total: 0, details: {} }
  if (!rules || rules.length === 0) return { total: 0, details: {} }

  const details = {}
  let total = 0

  for (const rule of rules) {
    if (!rule.enabled) continue
    const pattern = rule.groupPattern || rule.pattern
    let regex
    try {
      regex = new RegExp(pattern, 'g')
    } catch {
      continue
    }

    const matches = text.match(regex)
    const count = matches ? matches.length : 0
    details[rule.id] = { count, name: rule.name }
    total += count
  }

  return { total, details }
}

export const buildHighlightSegments = (originalText, maskedText, rules) => {
  if (!originalText) return []
  if (!rules || rules.length === 0) return [{ type: 'normal', value: originalText }]

  const enabledRules = rules.filter((r) => r.enabled)
  if (enabledRules.length === 0) return [{ type: 'normal', value: originalText }]

  const allRanges = []

  for (const rule of enabledRules) {
    const pattern = rule.groupPattern || rule.pattern
    let regex
    try {
      regex = new RegExp(pattern, 'g')
    } catch {
      continue
    }

    let match
    while ((match = regex.exec(originalText)) !== null) {
      allRanges.push({
        start: match.index,
        end: match.index + match[0].length,
        ruleId: rule.id,
        ruleName: rule.name,
      })
      if (match.index === regex.lastIndex) {
        regex.lastIndex++
      }
    }
  }

  if (allRanges.length === 0) return [{ type: 'normal', value: originalText }]

  allRanges.sort((a, b) => a.start - b.start)

  const mergedRanges = []
  for (const range of allRanges) {
    if (mergedRanges.length > 0) {
      const last = mergedRanges[mergedRanges.length - 1]
      if (range.start <= last.end) {
        last.end = Math.max(last.end, range.end)
        continue
      }
    }
    mergedRanges.push({ start: range.start, end: range.end, ruleId: range.ruleId, ruleName: range.ruleName })
  }

  const segments = []
  let cursor = 0

  for (const range of mergedRanges) {
    if (cursor < range.start) {
      segments.push({ type: 'normal', value: originalText.slice(cursor, range.start) })
    }
    segments.push({
      type: 'masked',
      value: originalText.slice(range.start, range.end),
      ruleId: range.ruleId,
      ruleName: range.ruleName,
    })
    cursor = range.end
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
