export const DEFAULT_FLAGS = {
  global: true,
  ignoreCase: false,
  multiline: false,
  dotAll: false,
}

export const buildFlagsString = (flags) => {
  if (!flags || typeof flags !== 'object') return 'g'
  let str = ''
  if (flags.global) str += 'g'
  if (flags.ignoreCase) str += 'i'
  if (flags.multiline) str += 'm'
  if (flags.dotAll) str += 's'
  return str
}

export const parseFlagsString = (flagStr) => {
  const flags = {
    global: false,
    ignoreCase: false,
    multiline: false,
    dotAll: false,
  }
  if (typeof flagStr !== 'string') return flags
  for (const ch of flagStr) {
    switch (ch) {
      case 'g':
        flags.global = true
        break
      case 'i':
        flags.ignoreCase = true
        break
      case 'm':
        flags.multiline = true
        break
      case 's':
        flags.dotAll = true
        break
      default:
        break
    }
  }
  return flags
}

export const isValidRegex = (pattern) => {
  if (typeof pattern !== 'string') return false
  try {
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}

export const createRegex = (pattern, flags) => {
  const flagStr = buildFlagsString(flags)
  try {
    const re = new RegExp(pattern, flagStr)
    return { success: true, regex: re, error: null }
  } catch (err) {
    return { success: false, regex: null, error: err?.message || 'Invalid regex' }
  }
}

export const findAllMatches = (pattern, flags, text) => {
  if (typeof text !== 'string' || text === '') {
    return { matches: [], error: null }
  }

  const { success, regex, error } = createRegex(pattern, flags)
  if (!success) {
    return { matches: [], error }
  }

  const matches = []
  const usedFlags = buildFlagsString(flags)

  if (usedFlags.includes('g')) {
    let match
    let safetyCounter = 0
    const MAX_ITERATIONS = 10000
    while ((match = regex.exec(text)) !== null && safetyCounter < MAX_ITERATIONS) {
      const groups = []
      for (let i = 1; i < match.length; i++) {
        groups.push({
          index: i,
          value: match[i] !== undefined ? match[i] : null,
          start: match.index,
          end: match.index + (match[0]?.length || 0),
        })
      }

      const namedGroups = {}
      if (match.groups && typeof match.groups === 'object') {
        for (const key of Object.keys(match.groups)) {
          namedGroups[key] = match.groups[key]
        }
      }

      matches.push({
        index: matches.length,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
        groups,
        namedGroups,
      })

      if (match[0].length === 0) {
        regex.lastIndex++
      }
      safetyCounter++
    }
  } else {
    const match = regex.exec(text)
    if (match) {
      const groups = []
      for (let i = 1; i < match.length; i++) {
        groups.push({
          index: i,
          value: match[i] !== undefined ? match[i] : null,
          start: match.index,
          end: match.index + (match[0]?.length || 0),
        })
      }

      const namedGroups = {}
      if (match.groups && typeof match.groups === 'object') {
        for (const key of Object.keys(match.groups)) {
          namedGroups[key] = match.groups[key]
        }
      }

      matches.push({
        index: 0,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
        groups,
        namedGroups,
      })
    }
  }

  return { matches, error: null }
}

export const hasCaptureGroups = (pattern) => {
  if (typeof pattern !== 'string' || pattern === '') return false
  let hasGroup = false
  let escaped = false
  let inCharClass = false
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (inCharClass) {
      if (ch === ']') inCharClass = false
      continue
    }
    if (ch === '[') {
      inCharClass = true
      continue
    }
    if (ch === '(') {
      const next = pattern[i + 1]
      const next2 = pattern[i + 2]
      const next3 = pattern[i + 3]
      if (next === '?') {
        if (next2 === ':' || next2 === '=' || next2 === '!') {
          continue
        }
        if (next2 === '<' && (next3 === '=' || next3 === '!')) {
          continue
        }
      }
      hasGroup = true
      break
    }
  }
  return hasGroup
}

export const replaceText = (pattern, flags, text, replacement, replaceAll = true) => {
  if (typeof text !== 'string') {
    return { success: false, result: '', error: 'Invalid text' }
  }

  const actualFlags = { ...(flags || DEFAULT_FLAGS) }
  if (replaceAll) {
    actualFlags.global = true
  } else {
    actualFlags.global = false
  }

  const { success, regex, error } = createRegex(pattern, actualFlags)
  if (!success) {
    return { success: false, result: '', error }
  }

  try {
    const result = replaceAll ? text.replaceAll(regex, replacement) : text.replace(regex, replacement)
    return { success: true, result, error: null }
  } catch (err) {
    return { success: false, result: '', error: err?.message || 'Replacement failed' }
  }
}

export const buildHighlightSegments = (text, matches) => {
  if (typeof text !== 'string' || text === '') return []
  if (!Array.isArray(matches) || matches.length === 0) {
    return [{ type: 'text', value: text, start: 0, end: text.length }]
  }

  const sorted = [...matches].sort((a, b) => a.start - b.start)
  const segments = []
  let cursor = 0

  for (const m of sorted) {
    if (m.start > cursor) {
      segments.push({
        type: 'text',
        value: text.slice(cursor, m.start),
        start: cursor,
        end: m.start,
      })
    }
    if (m.end > m.start) {
      segments.push({
        type: 'match',
        value: text.slice(m.start, m.end),
        start: m.start,
        end: m.end,
        matchIndex: m.index,
      })
    }
    cursor = Math.max(cursor, m.end)
  }

  if (cursor < text.length) {
    segments.push({
      type: 'text',
      value: text.slice(cursor),
      start: cursor,
      end: text.length,
    })
  }

  return segments
}

export const escapeRegex = (str) => {
  if (typeof str !== 'string') return ''
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const truncateText = (text, maxLength = 50) => {
  if (typeof text !== 'string') return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
