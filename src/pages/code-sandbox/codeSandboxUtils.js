import { HIGHLIGHT_COLORS, JS_KEYWORDS, LANGUAGES, OUTPUT_LINE_PREFIX, PYTHON_KEYWORDS } from './constants'

export const escapeHtml = (text) => {
  if (typeof text !== 'string') return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const getKeywords = (language) => {
  if (language === LANGUAGES.PYTHON) return PYTHON_KEYWORDS
  return JS_KEYWORDS
}

export const highlightSyntax = (code, language) => {
  if (typeof code !== 'string' || code === '') return ''
  const keywords = getKeywords(language)

  const commentRegex = language === LANGUAGES.PYTHON
    ? /(#[^\n]*)/g
    : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g

  const stringRegex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g

  const numberRegex = /\b(\d+(?:\.\d+)?)\b/g

  const placeholders = []
  let placeholderIdx = 0
  let result = code

  result = result.replace(stringRegex, (match) => {
    const placeholder = `__STR_${placeholderIdx}__`
    placeholders.push({
      placeholder,
      replacement: `<span style="color:${HIGHLIGHT_COLORS.string}">${escapeHtml(match)}</span>`,
    })
    placeholderIdx++
    return placeholder
  })

  result = result.replace(commentRegex, (match) => {
    const placeholder = `__CMT_${placeholderIdx}__`
    placeholders.push({
      placeholder,
      replacement: `<span style="color:${HIGHLIGHT_COLORS.comment}">${escapeHtml(match)}</span>`,
    })
    placeholderIdx++
    return placeholder
  })

  result = escapeHtml(result)

  result = result.replace(numberRegex, (match, p1, offset, str) => {
    const before = offset > 0 ? str[offset - 1] : ''
    if (before === '>' || before === ';') {
      return match
    }
    return `<span style="color:${HIGHLIGHT_COLORS.number}">${match}</span>`
  })

  const keywordPattern = new RegExp(
    `\\b(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'g'
  )

  result = result.replace(keywordPattern, (match) => {
    return `<span style="color:${HIGHLIGHT_COLORS.keyword};font-weight:600">${match}</span>`
  })

  placeholders.forEach(({ placeholder, replacement }) => {
    result = result.replace(placeholder, replacement)
  })

  return result
}

export const handleTabKey = (e) => {
  const textarea = e.target
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value

  if (e.key === 'Tab') {
    e.preventDefault()
    const newValue = value.substring(0, start) + '  ' + value.substring(end)
    return {
      newValue,
      newCursorStart: start + 2,
      newCursorEnd: start + 2,
    }
  }
  return null
}

export const handleBracketCompletion = (e) => {
  const textarea = e.target
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  const key = e.key

  const openBrackets = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'",
    '`': '`',
  }

  const closeBrackets = {
    ')': '(',
    ']': '[',
    '}': '{',
  }

  if (openBrackets[key]) {
    e.preventDefault()
    const selectedText = value.substring(start, end)
    const newValue = value.substring(0, start) + key + selectedText + openBrackets[key] + value.substring(end)
    const newCursorStart = start + 1
    const newCursorEnd = selectedText ? newCursorStart + selectedText.length : newCursorStart
    return { newValue, newCursorStart, newCursorEnd }
  }

  if (closeBrackets[key] && start === end) {
    const nextChar = value[start]
    if (nextChar === key) {
      e.preventDefault()
      return {
        newValue: value,
        newCursorStart: start + 1,
        newCursorEnd: start + 1,
      }
    }
  }

  return null
}

class PythonInterpreter {
  constructor(stdin = '') {
    this.output = []
    this.variables = {}
    this.stdinLines = stdin.split('\n')
    this.stdinIndex = 0
    this.unsupportedFunctions = new Set()
  }

  log(...args) {
    const line = args.map((a) => this.pyStringify(a)).join(' ')
    this.output.push({ type: 'log', content: line })
  }

  error(message) {
    this.output.push({ type: 'error', content: message })
  }

  pyStringify(value) {
    if (value === null || value === undefined) return 'None'
    if (typeof value === 'boolean') return value ? 'True' : 'False'
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    if (Array.isArray(value)) {
      return '[' + value.map((v) => this.pyStringify(v)).join(', ') + ']'
    }
    if (typeof value === 'object') {
      if (value.__pyType === 'tuple') {
        return '(' + value.items.map((v) => this.pyStringify(v)).join(', ') + ')'
      }
      if (value.__pyType === 'range') {
        return `range(${value.start}, ${value.stop}, ${value.step})`
      }
      const entries = Object.entries(value)
      return '{' + entries.map(([k, v]) => `${this.pyStringify(k)}: ${this.pyStringify(v)}`).join(', ') + '}'
    }
    return String(value)
  }

  pyLen(obj) {
    if (obj === null || obj === undefined) return 0
    if (typeof obj === 'string') return obj.length
    if (Array.isArray(obj)) return obj.length
    if (typeof obj === 'object') {
      if (obj.__pyType === 'range') {
        const count = Math.ceil((obj.stop - obj.start) / obj.step)
        return Math.max(0, count)
      }
      return Object.keys(obj).length
    }
    return 0
  }

  pyRange(...args) {
    let start, stop, step
    if (args.length === 1) {
      start = 0
      stop = args[0]
      step = 1
    } else if (args.length === 2) {
      [start, stop] = args
      step = 1
    } else {
      [start, stop, step] = args
    }
    return { __pyType: 'range', start, stop, step }
  }

  rangeToArray(rangeObj) {
    const result = []
    if (rangeObj.step > 0) {
      for (let i = rangeObj.start; i < rangeObj.stop; i += rangeObj.step) {
        result.push(i)
      }
    } else if (rangeObj.step < 0) {
      for (let i = rangeObj.start; i > rangeObj.stop; i += rangeObj.step) {
        result.push(i)
      }
    }
    return result
  }

  pySum(iterable) {
    let arr
    if (iterable && iterable.__pyType === 'range') {
      arr = this.rangeToArray(iterable)
    } else if (Array.isArray(iterable)) {
      arr = iterable
    } else {
      arr = []
    }
    return arr.reduce((a, b) => a + b, 0)
  }

  pyMax(...args) {
    let values
    if (args.length === 1) {
      const arg = args[0]
      if (arg && arg.__pyType === 'range') {
        values = this.rangeToArray(arg)
      } else if (Array.isArray(arg)) {
        values = arg
      } else {
        values = []
      }
    } else {
      values = args
    }
    if (values.length === 0) return undefined
    return Math.max(...values)
  }

  pyMin(...args) {
    let values
    if (args.length === 1) {
      const arg = args[0]
      if (arg && arg.__pyType === 'range') {
        values = this.rangeToArray(arg)
      } else if (Array.isArray(arg)) {
        values = arg
      } else {
        values = []
      }
    } else {
      values = args
    }
    if (values.length === 0) return undefined
    return Math.min(...values)
  }

  pyAbs(value) {
    return Math.abs(value)
  }

  pyRound(value, ndigits = 0) {
    const factor = Math.pow(10, ndigits)
    return Math.round(value * factor) / factor
  }

  pyInt(value) {
    if (typeof value === 'boolean') return value ? 1 : 0
    if (typeof value === 'number') return Math.trunc(value)
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  pyFloat(value) {
    if (typeof value === 'boolean') return value ? 1.0 : 0.0
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? 0.0 : parsed
    }
    return 0.0
  }

  pyStr(value) {
    return this.pyStringify(value)
  }

  pyBool(value) {
    return !!value
  }

  pyList(iterable) {
    if (iterable && iterable.__pyType === 'range') {
      return this.rangeToArray(iterable)
    }
    if (Array.isArray(iterable)) return [...iterable]
    if (typeof iterable === 'string') return iterable.split('')
    return []
  }

  pyTuple(iterable) {
    const items = this.pyList(iterable)
    return { __pyType: 'tuple', items }
  }

  pyDict(...args) {
    if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      return { ...args[0] }
    }
    return {}
  }

  pySet(iterable) {
    const arr = this.pyList(iterable)
    return [...new Set(arr)]
  }

  pySorted(iterable, key = null, reverse = false) {
    const arr = this.pyList(iterable)
    const sorted = [...arr].sort((a, b) => {
      let valA = a
      let valB = b
      if (typeof key === 'function') {
        valA = key(a)
        valB = key(b)
      }
      if (valA < valB) return -1
      if (valA > valB) return 1
      return 0
    })
    return reverse ? sorted.reverse() : sorted
  }

  pyReversed(iterable) {
    const arr = this.pyList(iterable)
    return [...arr].reverse()
  }

  pyEnumerate(iterable, start = 0) {
    const arr = this.pyList(iterable)
    return arr.map((item, idx) => ({ __pyType: 'tuple', items: [start + idx, item] }))
  }

  pyZip(...iterables) {
    const arrs = iterables.map((it) => this.pyList(it))
    const minLen = Math.min(...arrs.map((a) => a.length))
    const result = []
    for (let i = 0; i < minLen; i++) {
      result.push({ __pyType: 'tuple', items: arrs.map((a) => a[i]) })
    }
    return result
  }

  pyMap(func, iterable) {
    const arr = this.pyList(iterable)
    return arr.map((item) => (typeof func === 'function' ? func(item) : item))
  }

  pyFilter(func, iterable) {
    const arr = this.pyList(iterable)
    return arr.filter((item) => (typeof func === 'function' ? func(item) : !!item))
  }

  pyReduce(func, iterable, initial) {
    const arr = this.pyList(iterable)
    if (initial !== undefined) {
      return arr.reduce((acc, item) => (typeof func === 'function' ? func(acc, item) : acc), initial)
    }
    if (arr.length === 0) return undefined
    return arr.slice(1).reduce((acc, item) => (typeof func === 'function' ? func(acc, item) : acc), arr[0])
  }

  pyInput(prompt = '') {
    if (prompt) {
      this.output.push({ type: 'log', content: String(prompt) })
    }
    if (this.stdinIndex < this.stdinLines.length) {
      const line = this.stdinLines[this.stdinIndex]
      this.stdinIndex++
      return line
    }
    return ''
  }

  pyFormat(template, ...args) {
    if (typeof template !== 'string') return String(template)
    let result = template
    if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      Object.entries(args[0]).forEach(([key, value]) => {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), this.pyStringify(value))
      })
    } else {
      args.forEach((arg, idx) => {
        result = result.replace(new RegExp(`\\{${idx}\\}`, 'g'), this.pyStringify(arg))
      })
      let i = 0
      result = result.replace(/\{\}/g, () => {
        if (i < args.length) {
          return this.pyStringify(args[i++])
        }
        return '{}'
      })
    }
    return result
  }

  unsupported(name) {
    if (!this.unsupportedFunctions.has(name)) {
      this.unsupportedFunctions.add(name)
      this.output.push({ type: 'log', content: `该函数暂不支持：${name}` })
    }
    return undefined
  }

  buildContext() {
    const self = this
    return {
      print: (...args) => self.log(...args),
      range: (...args) => self.pyRange(...args),
      len: (obj) => self.pyLen(obj),
      sum: (it) => self.pySum(it),
      max: (...args) => self.pyMax(...args),
      min: (...args) => self.pyMin(...args),
      abs: (v) => self.pyAbs(v),
      round: (v, n) => self.pyRound(v, n),
      int: (v) => self.pyInt(v),
      float: (v) => self.pyFloat(v),
      str: (v) => self.pyStr(v),
      bool: (v) => self.pyBool(v),
      list: (it) => self.pyList(it),
      tuple: (it) => self.pyTuple(it),
      dict: (...args) => self.pyDict(...args),
      set: (it) => self.pySet(it),
      sorted: (it, k, r) => self.pySorted(it, k, r),
      reversed: (it) => self.pyReversed(it),
      enumerate: (it, s) => self.pyEnumerate(it, s),
      zip: (...its) => self.pyZip(...its),
      map: (f, it) => self.pyMap(f, it),
      filter: (f, it) => self.pyFilter(f, it),
      reduce: (f, it, i) => self.pyReduce(f, it, i),
      input: (p) => self.pyInput(p),
      format: (t, ...a) => self.pyFormat(t, ...a),
      open: () => self.unsupported('open'),
      os: {
        path: {
          exists: () => self.unsupported('os.path.exists'),
          join: () => self.unsupported('os.path.join'),
        },
      },
      sys: {
        argv: [],
        exit: () => self.unsupported('sys.exit'),
      },
      math: {
        sqrt: (v) => Math.sqrt(v),
        pow: (b, e) => Math.pow(b, e),
        sin: (v) => Math.sin(v),
        cos: (v) => Math.cos(v),
        tan: (v) => Math.tan(v),
        log: (v) => Math.log(v),
        log2: (v) => Math.log2(v),
        log10: (v) => Math.log10(v),
        exp: (v) => Math.exp(v),
        floor: (v) => Math.floor(v),
        ceil: (v) => Math.ceil(v),
        pi: Math.PI,
        e: Math.E,
      },
      json: {
        dumps: (v) => JSON.stringify(v),
        loads: (s) => {
          try {
            return JSON.parse(s)
          } catch {
            return {}
          }
        },
      },
      True: true,
      False: false,
      None: null,
    }
  }
}

const pythonReserved = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield',
])

const isValidJsIdentifier = (name) => {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) && !pythonReserved.has(name)
}

const extractPythonVariables = (code) => {
  const varAssignRegex = /^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm
  const forVarRegex = /for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in/g
  const importAsRegex = /import\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+as\s+([a-zA-Z_][a-zA-Z0-9_]*))?/g
  const fromImportRegex = /from\s+[a-zA-Z_][a-zA-Z0-9_.]*\s+import\s+([a-zA-Z_][a-zA-Z0-9_,\s*]+)/g

  const variables = {}
  let match

  while ((match = varAssignRegex.exec(code)) !== null) {
    const name = match[2]
    if (isValidJsIdentifier(name)) variables[name] = null
  }

  while ((match = forVarRegex.exec(code)) !== null) {
    const name = match[1]
    if (isValidJsIdentifier(name)) variables[name] = null
  }

  while ((match = importAsRegex.exec(code)) !== null) {
    const alias = match[2] || match[1]
    if (isValidJsIdentifier(alias)) variables[alias] = null
  }

  while ((match = fromImportRegex.exec(code)) !== null) {
    const imports = match[1].split(',').map((s) => s.trim())
    imports.forEach((imp) => {
      const asMatch = imp.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+as\s+([a-zA-Z_][a-zA-Z0-9_]*))?$/)
      if (asMatch) {
        const alias = asMatch[2] || asMatch[1]
        if (isValidJsIdentifier(alias)) variables[alias] = null
      }
    })
  }

  return variables
}

const removePythonComments = (code) => {
  const lines = code.split('\n')
  const result = []
  let inString = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let newLine = ''
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      const prevChar = j > 0 ? line[j - 1] : ''

      if (inString) {
        newLine += char
        if (char === inString && prevChar !== '\\') {
          inString = null
        }
      } else {
        if (char === '"' || char === "'" || char === '`') {
          inString = char
          newLine += char
        } else if (char === '#') {
          break
        } else {
          newLine += char
        }
      }
    }
    result.push(newLine)
  }
  return result.join('\n')
}

const processFStrings = (code) => {
  return code.replace(/f"([^"\\]*(?:\\.[^"\\]*)*)"/g, (_, content) => {
    let result = ''
    let inBrace = false
    let braceContent = ''
    let i = 0
    while (i < content.length) {
      const ch = content[i]
      if (ch === '{') {
        if (content[i + 1] === '{') {
          result += '{'
          i += 2
        } else {
          inBrace = true
          braceContent = ''
          i++
        }
      } else if (ch === '}' && inBrace) {
        if (content[i + 1] === '}') {
          braceContent += '}'
          i += 2
        } else {
          result += `\${${braceContent}}`
          inBrace = false
          i++
        }
      } else {
        if (inBrace) {
          braceContent += ch
        } else {
          result += ch
        }
        i++
      }
    }
    return `\`${result}\``
  }).replace(/f'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, content) => {
    let result = ''
    let inBrace = false
    let braceContent = ''
    let i = 0
    while (i < content.length) {
      const ch = content[i]
      if (ch === '{') {
        if (content[i + 1] === '{') {
          result += '{'
          i += 2
        } else {
          inBrace = true
          braceContent = ''
          i++
        }
      } else if (ch === '}' && inBrace) {
        if (content[i + 1] === '}') {
          braceContent += '}'
          i += 2
        } else {
          result += `\${${braceContent}}`
          inBrace = false
          i++
        }
      } else {
        if (inBrace) {
          braceContent += ch
        } else {
          result += ch
        }
        i++
      }
    }
    return `\`${result}\``
  })
}

const findOperandEnd = (str, startIdx) => {
  let i = startIdx
  let inString = null
  let parenDepth = 0
  let foundNonSpace = false

  while (i < str.length) {
    const ch = str[i]
    const prevChar = i > 0 ? str[i - 1] : ''

    if (inString) {
      if (ch === inString && prevChar !== '\\') {
        inString = null
      }
      i++
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
      foundNonSpace = true
      i++
      continue
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      parenDepth++
      foundNonSpace = true
      i++
      continue
    }

    if (ch === ')' || ch === ']' || ch === '}') {
      if (parenDepth === 0) {
        return i
      }
      parenDepth--
      foundNonSpace = true
      i++
      continue
    }

    if (parenDepth > 0) {
      if (ch !== ' ' && ch !== '\t') foundNonSpace = true
      i++
      continue
    }

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      if (foundNonSpace) {
        return i
      }
      i++
      continue
    }

    if (ch === ';' || ch === ',') {
      return i
    }

    const logicalOp = str.slice(i).match(/^(and\b|or\b|&&|\|\||==|!=|<=|>=|<|>)/)
    if (logicalOp) {
      return i
    }

    foundNonSpace = true
    i++
  }
  return i
}

const findOperandStart = (str, endIdx) => {
  let i = endIdx - 1
  let inString = null
  let parenDepth = 0
  let foundNonSpace = false

  while (i >= 0) {
    const ch = str[i]
    const nextChar = i < str.length - 1 ? str[i + 1] : ''

    if (inString) {
      if (ch === inString && nextChar !== '\\') {
        inString = null
      }
      i--
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
      foundNonSpace = true
      i--
      continue
    }

    if (ch === ')' || ch === ']' || ch === '}') {
      parenDepth++
      foundNonSpace = true
      i--
      continue
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      if (parenDepth === 0) {
        return i + 1
      }
      parenDepth--
      foundNonSpace = true
      i--
      continue
    }

    if (parenDepth > 0) {
      if (ch !== ' ' && ch !== '\t') foundNonSpace = true
      i--
      continue
    }

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      if (foundNonSpace) {
        return i + 1
      }
      i--
      continue
    }

    if (ch === ';' || ch === ',') {
      return i + 1
    }

    if (i >= 1) {
      const twoChar = str.slice(i - 1, i + 1)
      if (twoChar === '&&' || twoChar === '||' || twoChar === '==' || twoChar === '!=' || twoChar === '<=' || twoChar === '>=') {
        return i + 1
      }
    }

    if (ch === '<' || ch === '>' || ch === '!') {
      return i + 1
    }

    const andOrMatch = str.slice(Math.max(0, i - 3), i + 1).match(/(^|\s)(and|or)$/)
    if (andOrMatch) {
      return i + 1
    }

    foundNonSpace = true
    i--
  }
  return Math.max(0, i + 1)
}

const replacePythonInOperator = (expr) => {
  const tokens = []
  const positions = []
  let i = 0
  let inString = null
  let parenDepth = 0

  while (i < expr.length) {
    const ch = expr[i]
    const prevChar = i > 0 ? expr[i - 1] : ''

    if (inString) {
      tokens.push(ch)
      if (ch === inString && prevChar !== '\\') {
        inString = null
      }
      i++
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
      tokens.push(ch)
      i++
      continue
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      parenDepth++
      tokens.push(ch)
      i++
      continue
    }
    if (ch === ')' || ch === ']' || ch === '}') {
      parenDepth--
      tokens.push(ch)
      i++
      continue
    }

    const notInMatch = expr.slice(i).match(/^not\s+in\b/)
    if (notInMatch) {
      positions.push({ type: 'not_in', start: tokens.length, length: notInMatch[0].length })
      tokens.push(...notInMatch[0].split(''))
      i += notInMatch[0].length
      continue
    }

    const inMatch = expr.slice(i).match(/^in\b/)
    if (inMatch) {
      positions.push({ type: 'in', start: tokens.length, length: inMatch[0].length })
      tokens.push(...inMatch[0].split(''))
      i += inMatch[0].length
      continue
    }

    tokens.push(ch)
    i++
  }

  let result = tokens.join('')

  for (let j = positions.length - 1; j >= 0; j--) {
    const pos = positions[j]
    const opStart = pos.start
    const opEnd = pos.start + pos.length

    const leftStart = findOperandStart(result, opStart)
    const left = result.slice(leftStart, opStart).trim()

    const rightEnd = findOperandEnd(result, opEnd)
    const right = result.slice(opEnd, rightEnd).trim()

    if (left && right) {
      const replacement = pos.type === 'not_in'
        ? `!list(${right}).includes(${left})`
        : `list(${right}).includes(${left})`
      result = result.slice(0, leftStart) + replacement + result.slice(rightEnd)
    }
  }

  return result
}

const replaceOutsideStrings = (code, pattern, replacement) => {
  let result = ''
  let i = 0
  let inString = null

  const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')

  while (i < code.length) {
    const ch = code[i]
    const prevChar = i > 0 ? code[i - 1] : ''

    if (inString) {
      result += ch
      if (ch === inString && prevChar !== '\\') {
        inString = null
      }
      i++
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
      result += ch
      i++
      continue
    }

    globalPattern.lastIndex = i
    const match = globalPattern.exec(code)
    if (match && match.index === i) {
      result += typeof replacement === 'function' ? replacement(match[0]) : replacement
      i = globalPattern.lastIndex
      continue
    }

    result += ch
    i++
  }

  return result
}

const transformPythonToJs = (code) => {
  let transformed = removePythonComments(code)
  transformed = processFStrings(transformed)

  transformed = replaceOutsideStrings(transformed, /\.format\s*\(/, '.format(')

  transformed = replaceOutsideStrings(transformed, /\band\b/, '&&')
  transformed = replaceOutsideStrings(transformed, /\bor\b/, '||')
  transformed = replaceOutsideStrings(transformed, /\bnot(?!\s+in\b)\b/, '!')
  transformed = replaceOutsideStrings(transformed, /\bTrue\b/, 'true')
  transformed = replaceOutsideStrings(transformed, /\bFalse\b/, 'false')
  transformed = replaceOutsideStrings(transformed, /\bNone\b/, 'null')

  transformed = replaceOutsideStrings(transformed, /\blen\s*\(/, 'len(')
  transformed = replaceOutsideStrings(transformed, /\brange\s*\(/, 'range(')
  transformed = replaceOutsideStrings(transformed, /\bprint\s*\(/, 'print(')
  transformed = replaceOutsideStrings(transformed, /\binput\s*\(/, 'input(')

  const lines = transformed.split('\n')
  const jsLines = []
  const blockStack = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (line.trim() === '') {
      jsLines.push('')
      continue
    }

    const indent = line.match(/^(\s*)/)[1]
    const indentLevel = Math.floor(indent.length / 4)
    const trimmed = line.trim()

    const isElseOrElif = trimmed.startsWith('else') || trimmed.startsWith('elif')

    while (blockStack.length > 0) {
      const topIndent = blockStack[blockStack.length - 1]
      if (indentLevel < topIndent) {
        blockStack.pop()
        jsLines.push(' '.repeat(Math.max(0, blockStack.length) * 2) + '}')
      } else if (indentLevel === topIndent) {
        if (isElseOrElif) {
          blockStack.pop()
        } else {
          blockStack.pop()
          jsLines.push(' '.repeat(Math.max(0, blockStack.length) * 2) + '}')
        }
        break
      } else {
        break
      }
    }

    const defMatch = trimmed.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*)\)\s*:$/)
    if (defMatch) {
      const funcName = defMatch[1]
      const params = defMatch[2]
      jsLines.push(' '.repeat(indentLevel * 2) + `function ${funcName}(${params}) {`)
      blockStack.push(indentLevel)
      continue
    }

    const classMatch = trimmed.match(/^class\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\((.*)\))?\s*:$/)
    if (classMatch) {
      const className = classMatch[1]
      jsLines.push(' '.repeat(indentLevel * 2) + `class ${className} {`)
      blockStack.push(indentLevel)
      continue
    }

    const ifMatch = trimmed.match(/^if\s+(.*)\s*:$/)
    if (ifMatch) {
      const condition = replacePythonInOperator(ifMatch[1])
      jsLines.push(' '.repeat(indentLevel * 2) + `if (${condition}) {`)
      blockStack.push(indentLevel)
      continue
    }

    const elseIfMatch = trimmed.match(/^elif\s+(.*)\s*:$/)
    if (elseIfMatch) {
      const condition = replacePythonInOperator(elseIfMatch[1])
      jsLines.push(' '.repeat(indentLevel * 2) + `} else if (${condition}) {`)
      blockStack.push(indentLevel)
      continue
    }

    const elseMatch = trimmed.match(/^else\s*:$/)
    if (elseMatch) {
      jsLines.push(' '.repeat(indentLevel * 2) + '} else {')
      blockStack.push(indentLevel)
      continue
    }

    const forMatch = trimmed.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.*)\s*:$/)
    if (forMatch) {
      const varName = forMatch[1]
      const iterable = forMatch[2]
      jsLines.push(' '.repeat(indentLevel * 2) + `for (const ${varName} of list(${iterable})) {`)
      blockStack.push(indentLevel)
      continue
    }

    const whileMatch = trimmed.match(/^while\s+(.*)\s*:$/)
    if (whileMatch) {
      const condition = replacePythonInOperator(whileMatch[1])
      jsLines.push(' '.repeat(indentLevel * 2) + `while (${condition}) {`)
      blockStack.push(indentLevel)
      continue
    }

    if (trimmed === 'pass') {
      jsLines.push(' '.repeat(indentLevel * 2) + '// pass')
      continue
    }

    if (trimmed === 'break') {
      jsLines.push(' '.repeat(indentLevel * 2) + 'break;')
      continue
    }

    if (trimmed === 'continue') {
      jsLines.push(' '.repeat(indentLevel * 2) + 'continue;')
      continue
    }

    const returnMatch = trimmed.match(/^return\s*(.*)$/)
    if (returnMatch) {
      const retVal = returnMatch[1] ? replacePythonInOperator(returnMatch[1]) : ''
      jsLines.push(' '.repeat(indentLevel * 2) + `return ${retVal};`)
      continue
    }

    let processedLine = replacePythonInOperator(trimmed)
    if (!processedLine.endsWith(';') && !processedLine.endsWith('{') && !processedLine.endsWith('}')) {
      processedLine = processedLine + ';'
    }
    jsLines.push(' '.repeat(indentLevel * 2) + processedLine)
  }

  while (blockStack.length > 0) {
    blockStack.pop()
    jsLines.push(' '.repeat(Math.max(0, blockStack.length) * 2) + '}')
  }

  return jsLines.join('\n')
}

export const executePythonCode = (code, stdin = '') => {
  const interpreter = new PythonInterpreter(stdin)
  try {
    const jsCode = transformPythonToJs(code)
    const variables = extractPythonVariables(code)
    const ctx = interpreter.buildContext()

    const ctxKeys = Object.keys(ctx)
    const ctxValues = Object.values(ctx)

    const varDeclarations = Object.keys(variables)
      .filter((v) => isValidJsIdentifier(v) && !ctxKeys.includes(v))
      .map((v) => `var ${v} = undefined;`)
      .join('\n')

    const varProxyGetters = ctxKeys
      .map((k) => `var ${k} = ctx.${k};`)
      .join('\n')

    const fullCode = `
      ${varProxyGetters}
      ${varDeclarations}
      ${jsCode}
    `

    const func = new Function('ctx', ...ctxKeys, fullCode)
    func(ctx, ...ctxValues)

    return {
      success: true,
      output: interpreter.output,
      error: null,
    }
  } catch (e) {
    interpreter.output.push({ type: 'error', content: `Error: ${e.message}` })
    return {
      success: false,
      output: interpreter.output,
      error: e.message,
    }
  }
}

export const executeJavaScriptCode = (code) => {
  const output = []
  try {
    const mockConsole = {
      log: (...args) => {
        output.push({
          type: 'log',
          content: args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '),
        })
      },
      error: (...args) => {
        output.push({
          type: 'error',
          content: args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '),
        })
      },
      warn: (...args) => {
        output.push({
          type: 'log',
          content: args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '),
        })
      },
      info: (...args) => {
        output.push({
          type: 'log',
          content: args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '),
        })
      },
    }

    const originalConsole = globalThis.console
    globalThis.console = mockConsole

    try {
      const func = new Function(code)
      func()
    } finally {
      globalThis.console = originalConsole
    }

    return {
      success: true,
      output,
      error: null,
    }
  } catch (e) {
    output.push({ type: 'error', content: `${e.name}: ${e.message}` })
    return {
      success: false,
      output,
      error: e.message,
    }
  }
}

export const executeCode = (code, language, stdin = '') => {
  if (language === LANGUAGES.PYTHON) {
    return executePythonCode(code, stdin)
  }
  return executeJavaScriptCode(code)
}

export const formatOutputLines = (output) => {
  if (!Array.isArray(output)) return []
  return output.map((item) => ({
    ...item,
    content: OUTPUT_LINE_PREFIX + (item.content || ''),
  }))
}

export const measureExecution = (fn) => {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const result = fn()
  const end = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const duration = Number((end - start).toFixed(2))
  return { result, duration }
}
