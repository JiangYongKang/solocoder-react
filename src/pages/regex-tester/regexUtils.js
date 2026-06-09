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

export const REGEX_TOKEN_TYPES = {
  PLAIN: 'plain',
  ESCAPE: 'escape',
  CHAR_CLASS: 'charClass',
  QUANTIFIER: 'quantifier',
  GROUP: 'group',
  ALTERNATION: 'alternation',
  ANCHOR: 'anchor',
  SPECIAL: 'special',
  NAMED_GROUP: 'namedGroup',
}

export const tokenizeRegexPattern = (pattern) => {
  if (typeof pattern !== 'string' || pattern === '') {
    return []
  }

  const tokens = []
  let i = 0
  const len = pattern.length

  while (i < len) {
    const ch = pattern[i]

    if (ch === '\\' && i + 1 < len) {
      const next = pattern[i + 1]
      let tokenLen = 2
      if ('dDwWsSbBntrfv0'.includes(next)) {
        tokens.push({ type: REGEX_TOKEN_TYPES.ESCAPE, value: pattern.slice(i, i + tokenLen), start: i, end: i + tokenLen })
      } else if (next === 'x' && i + 3 < len) {
        tokenLen = 4
        tokens.push({ type: REGEX_TOKEN_TYPES.ESCAPE, value: pattern.slice(i, i + tokenLen), start: i, end: i + tokenLen })
      } else if (next === 'u' && i + 5 < len) {
        tokenLen = 6
        tokens.push({ type: REGEX_TOKEN_TYPES.ESCAPE, value: pattern.slice(i, i + tokenLen), start: i, end: i + tokenLen })
      } else if (next === 'u' && i + 2 < len && pattern[i + 2] === '{') {
        let j = i + 3
        while (j < len && pattern[j] !== '}') j++
        tokenLen = j - i + 1
        tokens.push({ type: REGEX_TOKEN_TYPES.ESCAPE, value: pattern.slice(i, i + tokenLen), start: i, end: i + tokenLen })
      } else if (next === 'p' && i + 2 < len && pattern[i + 2] === '{') {
        let j = i + 3
        while (j < len && pattern[j] !== '}') j++
        tokenLen = j - i + 1
        tokens.push({ type: REGEX_TOKEN_TYPES.ESCAPE, value: pattern.slice(i, i + tokenLen), start: i, end: i + tokenLen })
      } else if (next === 'k' && i + 2 < len && pattern[i + 2] === '<') {
        let j = i + 3
        while (j < len && pattern[j] !== '>') j++
        tokenLen = j - i + 1
        tokens.push({ type: REGEX_TOKEN_TYPES.ESCAPE, value: pattern.slice(i, i + tokenLen), start: i, end: i + tokenLen })
      } else {
        tokens.push({ type: REGEX_TOKEN_TYPES.ESCAPE, value: pattern.slice(i, i + 2), start: i, end: i + 2 })
      }
      i += tokenLen
      continue
    }

    if (ch === '[') {
      let j = i + 1
      if (pattern[j] === '^') j++
      if (pattern[j] === ']') j++
      while (j < len && pattern[j] !== ']') {
        if (pattern[j] === '\\') {
          j += 2
        } else {
          j++
        }
      }
      const end = Math.min(j + 1, len)
      tokens.push({ type: REGEX_TOKEN_TYPES.CHAR_CLASS, value: pattern.slice(i, end), start: i, end })
      i = end
      continue
    }

    if (ch === '(') {
      let tokenType = REGEX_TOKEN_TYPES.GROUP
      let end = i + 1
      if (pattern[i + 1] === '?') {
        if (pattern[i + 2] === ':' || pattern[i + 2] === '=' || pattern[i + 2] === '!') {
          end = i + 3
        } else if (pattern[i + 2] === '<' && (pattern[i + 3] === '=' || pattern[i + 3] === '!')) {
          end = i + 4
        } else if (pattern[i + 2] === '<') {
          tokenType = REGEX_TOKEN_TYPES.NAMED_GROUP
          let j = i + 3
          while (j < len && pattern[j] !== '>') j++
          end = Math.min(j + 1, len)
        }
      }
      tokens.push({ type: tokenType, value: pattern.slice(i, end), start: i, end })
      i = end
      continue
    }

    if (ch === ')') {
      tokens.push({ type: REGEX_TOKEN_TYPES.GROUP, value: ')', start: i, end: i + 1 })
      i++
      continue
    }

    if (ch === '*' || ch === '+' || ch === '?') {
      let end = i + 1
      if (pattern[i + 1] === '?') {
        end++
      }
      tokens.push({ type: REGEX_TOKEN_TYPES.QUANTIFIER, value: pattern.slice(i, end), start: i, end })
      i = end
      continue
    }

    if (ch === '{') {
      let j = i + 1
      while (j < len && /[\d,]/.test(pattern[j])) j++
      if (pattern[j] === '}') {
        let end = j + 1
        if (pattern[end] === '?') end++
        tokens.push({ type: REGEX_TOKEN_TYPES.QUANTIFIER, value: pattern.slice(i, end), start: i, end })
        i = end
        continue
      }
    }

    if (ch === '^' || ch === '$') {
      tokens.push({ type: REGEX_TOKEN_TYPES.ANCHOR, value: ch, start: i, end: i + 1 })
      i++
      continue
    }

    if (ch === '|') {
      tokens.push({ type: REGEX_TOKEN_TYPES.ALTERNATION, value: '|', start: i, end: i + 1 })
      i++
      continue
    }

    if (ch === '.') {
      tokens.push({ type: REGEX_TOKEN_TYPES.SPECIAL, value: '.', start: i, end: i + 1 })
      i++
      continue
    }

    tokens.push({ type: REGEX_TOKEN_TYPES.PLAIN, value: ch, start: i, end: i + 1 })
    i++
  }

  if (tokens.length <= 1) {
    return tokens
  }

  const merged = []
  let current = { ...tokens[0] }
  for (let k = 1; k < tokens.length; k++) {
    const t = tokens[k]
    if (t.type === current.type && t.start === current.end) {
      current.value += t.value
      current.end = t.end
    } else {
      merged.push(current)
      current = { ...t }
    }
  }
  merged.push(current)

  return merged
}

export const debounce = (fn, wait) => {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function')
  }
  let timeoutId = null
  let lastArgs = null
  let lastContext = null
  const debounced = function (...args) {
    lastArgs = args
    lastContext = this
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      const ctx = lastContext
      const a = lastArgs
      timeoutId = null
      lastArgs = null
      lastContext = null
      fn.apply(ctx, a)
    }, wait)
  }
  debounced.cancel = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    lastArgs = null
    lastContext = null
  }
  debounced.flush = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
      const ctx = lastContext
      const a = lastArgs
      lastArgs = null
      lastContext = null
      if (a !== null) {
        fn.apply(ctx, a)
      }
    }
  }
  return debounced
}

const toCodePoints = (str) => {
  if (typeof str !== 'string') return []
  return Array.from(str)
}

const findCommonPrefix = (a, b) => {
  let i = 0
  const max = Math.min(a.length, b.length)
  while (i < max && a[i] === b[i]) i++
  return i
}

const findCommonSuffix = (a, b, prefixLen) => {
  let i = 0
  const maxA = a.length - prefixLen
  const maxB = b.length - prefixLen
  const max = Math.min(maxA, maxB)
  while (i < max && a[a.length - 1 - i] === b[b.length - 1 - i]) i++
  return i
}

const buildDiffFromLCS = (aArr, bArr) => {
  const n = aArr.length
  const m = bArr.length
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (aArr[i] === bArr[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
  }

  const ops = []
  let i = 0
  let j = 0

  while (i < n && j < m) {
    if (aArr[i] === bArr[j]) {
      ops.push({ type: 'equal', value: aArr[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'delete', value: aArr[i] })
      i++
    } else {
      ops.push({ type: 'insert', value: bArr[j] })
      j++
    }
  }

  while (i < n) {
    ops.push({ type: 'delete', value: aArr[i] })
    i++
  }
  while (j < m) {
    ops.push({ type: 'insert', value: bArr[j] })
    j++
  }

  const merged = []
  for (const op of ops) {
    if (merged.length > 0 && merged[merged.length - 1].type === op.type) {
      merged[merged.length - 1].value += op.value
    } else {
      merged.push({ type: op.type, value: op.value })
    }
  }

  return merged
}

export const computeDiff = (oldStr, newStr) => {
  if (typeof oldStr !== 'string') oldStr = ''
  if (typeof newStr !== 'string') newStr = ''
  if (oldStr === newStr) {
    return [{ type: 'equal', value: oldStr }]
  }

  const aArr = toCodePoints(oldStr)
  const bArr = toCodePoints(newStr)

  if (aArr.length === 0) {
    return [{ type: 'insert', value: newStr }]
  }
  if (bArr.length === 0) {
    return [{ type: 'delete', value: oldStr }]
  }

  const prefixLen = findCommonPrefix(aArr, bArr)
  const suffixLen = findCommonSuffix(aArr, bArr, prefixLen)

  const result = []

  if (prefixLen > 0) {
    result.push({ type: 'equal', value: aArr.slice(0, prefixLen).join('') })
  }

  const aMid = aArr.slice(prefixLen, aArr.length - suffixLen)
  const bMid = bArr.slice(prefixLen, bArr.length - suffixLen)

  if (aMid.length === 0 && bMid.length === 0) {
    // should not happen due to initial equality check
  } else if (aMid.length === 0) {
    result.push({ type: 'insert', value: bMid.join('') })
  } else if (bMid.length === 0) {
    result.push({ type: 'delete', value: aMid.join('') })
  } else {
    const midOps = buildDiffFromLCS(aMid, bMid)
    result.push(...midOps)
  }

  if (suffixLen > 0) {
    result.push({ type: 'equal', value: aArr.slice(aArr.length - suffixLen).join('') })
  }

  return result
}
