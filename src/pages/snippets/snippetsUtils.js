const STORAGE_KEY = 'code-snippets-data'

export const LANGUAGES = {
  JAVASCRIPT: 'javascript',
  TYPESCRIPT: 'typescript',
  PYTHON: 'python',
  CSS: 'css',
  HTML: 'html',
}

export const LANGUAGE_LABELS = {
  [LANGUAGES.JAVASCRIPT]: 'JavaScript',
  [LANGUAGES.TYPESCRIPT]: 'TypeScript',
  [LANGUAGES.PYTHON]: 'Python',
  [LANGUAGES.CSS]: 'CSS',
  [LANGUAGES.HTML]: 'HTML',
}

const JS_KEYWORDS = new Set([
  'var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'new', 'class', 'extends', 'super', 'this',
  'import', 'export', 'from', 'default', 'as', 'async', 'await', 'try', 'catch',
  'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'null', 'undefined',
  'true', 'false', 'void', 'delete', 'yield', 'static', 'public', 'private',
  'protected', 'interface', 'implements', 'enum', 'type', 'namespace', 'module',
  'declare', 'abstract', 'readonly', 'any', 'number', 'string', 'boolean', 'object',
  'symbol', 'bigint', 'unknown', 'never', 'Array', 'Object', 'String', 'Number',
  'Boolean', 'Promise', 'Map', 'Set', 'Date', 'JSON', 'console', 'window', 'document'
])

const PY_KEYWORDS = new Set([
  'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue',
  'pass', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'lambda',
  'yield', 'global', 'nonlocal', 'in', 'is', 'not', 'and', 'or', 'None', 'True', 'False',
  'self', 'async', 'await', 'print', 'range', 'len', 'str', 'int', 'float', 'list',
  'dict', 'set', 'tuple', 'bool', 'type', 'open', 'input', 'abs', 'max', 'min', 'sum'
])

const CSS_KEYWORDS = new Set([
  'color', 'background', 'background-color', 'background-image', 'font-size',
  'font-family', 'font-weight', 'margin', 'padding', 'border', 'border-radius',
  'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom',
  'float', 'clear', 'overflow', 'z-index', 'flex', 'grid', 'justify-content',
  'align-items', 'text-align', 'line-height', 'letter-spacing', 'box-shadow',
  'transition', 'transform', 'animation', 'opacity', 'cursor', 'outline', 'none',
  'auto', 'inherit', 'initial', 'unset', 'important', 'relative', 'absolute',
  'fixed', 'static', 'sticky', 'block', 'inline', 'inline-block', 'flex', 'grid'
])

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const TOKEN_START = '\u0000TOK'
const TOKEN_END = 'KON\u0001'
const TOKEN_REGEX = new RegExp(`${TOKEN_START}(\\d+)${TOKEN_END}`, 'g')

function protectTokens(text, patterns) {
  const tokens = []
  let protectedText = text
  for (const { regex, className } of patterns) {
    protectedText = protectedText.replace(regex, (match) => {
      const token = `${TOKEN_START}${tokens.length}${TOKEN_END}`
      tokens.push({ text: match, className })
      return token
    })
  }
  return { protectedText, tokens }
}

function restoreTokens(protectedText, tokens) {
  return protectedText.replace(TOKEN_REGEX, (_, idx) => {
    const { text, className } = tokens[Number(idx)]
    return `<span class="${className}">${text}</span>`
  })
}

export function highlightCode(code, language) {
  if (!code) return ''
  const escaped = escapeHtml(code)
  const lines = escaped.split('\n')

  return lines.map((line) => highlightLine(line, language)).join('\n')
}

function highlightLine(line, language) {
  if (!language) return line

  switch (language) {
    case LANGUAGES.JAVASCRIPT:
    case LANGUAGES.TYPESCRIPT:
      return highlightJsTs(line)
    case LANGUAGES.PYTHON:
      return highlightPython(line)
    case LANGUAGES.CSS:
      return highlightCss(line)
    case LANGUAGES.HTML:
      return highlightHtml(line)
    default:
      return line
  }
}

function highlightJsTs(line) {
  const patterns = [
    { regex: /\/\/.*$/g, className: 'hl-comment' },
    { regex: /\/\*.*?\*\//g, className: 'hl-comment' },
    { regex: /`[^`]*`|"[^"]*"|'[^']*'/g, className: 'hl-string' },
    { regex: /\b\d+\.?\d*\b/g, className: 'hl-number' },
  ]

  const { protectedText, tokens } = protectTokens(line, patterns)

  let result = protectedText.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, (match) => {
    if (JS_KEYWORDS.has(match)) {
      const token = `${TOKEN_START}${tokens.length}${TOKEN_END}`
      tokens.push({ text: match, className: 'hl-keyword' })
      return token
    }
    return match
  })

  return restoreTokens(result, tokens)
}

function highlightPython(line) {
  const patterns = [
    { regex: /#.*$/g, className: 'hl-comment' },
    { regex: /"""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*'/g, className: 'hl-string' },
    { regex: /\b\d+\.?\d*\b/g, className: 'hl-number' },
  ]

  const { protectedText, tokens } = protectTokens(line, patterns)

  let result = protectedText.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
    if (PY_KEYWORDS.has(match)) {
      const token = `${TOKEN_START}${tokens.length}${TOKEN_END}`
      tokens.push({ text: match, className: 'hl-keyword' })
      return token
    }
    return match
  })

  return restoreTokens(result, tokens)
}

function highlightCss(line) {
  const patterns = [
    { regex: /\/\*.*?\*\//g, className: 'hl-comment' },
    { regex: /"[^"]*"|'[^']*'/g, className: 'hl-string' },
    { regex: /#[0-9a-fA-F]{3,8}\b/g, className: 'hl-string' },
    { regex: /\b\d+\.?\d*(?:px|em|rem|%|vh|vw|s|ms|deg)?\b/g, className: 'hl-number' },
  ]

  const { protectedText, tokens } = protectTokens(line, patterns)

  let result = protectedText.replace(/([a-z-]+)(?=\s*:)/g, (match) => {
    if (CSS_KEYWORDS.has(match)) {
      const token = `${TOKEN_START}${tokens.length}${TOKEN_END}`
      tokens.push({ text: match, className: 'hl-keyword' })
      return token
    }
    return match
  })

  return restoreTokens(result, tokens)
}

function highlightHtml(line) {
  const patterns = [
    { regex: /&lt;!--[\s\S]*?--&gt;/g, className: 'hl-comment' },
    { regex: /="[^"]*"|='[^']*'/g, className: 'hl-string' },
  ]

  const { protectedText, tokens } = protectTokens(line, patterns)

  let result = protectedText.replace(/&lt;(\/)?([a-zA-Z0-9-]+)/g, (match, closing, tag) => {
    const slash = closing || ''
    return `&lt;${slash}<span class="hl-keyword">${tag}</span>`
  })

  return restoreTokens(result, tokens)
}

export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm || !text) return text
  const escaped = escapeRegExp(searchTerm)
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<mark class="hl-search">$1</mark>')
}

export function generateSnippetId() {
  return `snippet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createSnippet({ title, language, code, notes = '' }) {
  const now = Date.now()
  return {
    id: generateSnippetId(),
    title: title || '未命名片段',
    language: language || LANGUAGES.JAVASCRIPT,
    code: code || '',
    notes: notes || '',
    favorite: false,
    createdAt: now,
    updatedAt: now,
  }
}

export function loadSnippets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  const initial = createInitialSnippets()
  saveSnippets(initial)
  return initial
}

export function saveSnippets(snippets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets))
  } catch {
    // ignore
  }
}

function createInitialSnippets() {
  return [
    {
      id: generateSnippetId(),
      title: 'Array 去重',
      language: LANGUAGES.JAVASCRIPT,
      code: `function unique(arr) {
  return [...new Set(arr)]
}

// 示例
const nums = [1, 2, 2, 3, 3, 3, 4]
console.log(unique(nums)) // [1, 2, 3, 4]`,
      notes: '使用 Set 实现简单高效的数组去重',
      favorite: true,
      createdAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 86400000 * 3,
    },
    {
      id: generateSnippetId(),
      title: '防抖函数',
      language: LANGUAGES.TYPESCRIPT,
      code: `function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}`,
      notes: 'TypeScript 泛型版本的防抖函数',
      favorite: false,
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000 * 2,
    },
    {
      id: generateSnippetId(),
      title: '斐波那契数列',
      language: LANGUAGES.PYTHON,
      code: `def fibonacci(n):
    """生成斐波那契数列前 n 项"""
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print(fibonacci(10))  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]`,
      notes: '经典的斐波那契数列实现',
      favorite: true,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: generateSnippetId(),
      title: 'Flex 居中布局',
      language: LANGUAGES.CSS,
      code: `.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.vertical-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}`,
      notes: '常用的 Flex 布局片段',
      favorite: false,
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
    },
    {
      id: generateSnippetId(),
      title: '响应式表单结构',
      language: LANGUAGES.HTML,
      code: `<form class="contact-form">
  <label for="name">姓名</label>
  <input type="text" id="name" name="name" required />

  <label for="email">邮箱</label>
  <input type="email" id="email" name="email" required />

  <label for="message">留言</label>
  <textarea id="message" name="message" rows="4"></textarea>

  <button type="submit">提交</button>
</form>`,
      notes: '基础 HTML 表单结构模板',
      favorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]
}

export function addSnippet(snippets, snippet) {
  return [...snippets, snippet]
}

export function updateSnippet(snippets, id, updates) {
  return snippets.map((s) =>
    s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
  )
}

export function deleteSnippet(snippets, id) {
  return snippets.filter((s) => s.id !== id)
}

export function toggleFavorite(snippets, id) {
  return snippets.map((s) =>
    s.id === id ? { ...s, favorite: !s.favorite, updatedAt: Date.now() } : s
  )
}

export function getAllLanguages(snippets) {
  const langSet = new Set()
  for (const s of snippets) {
    if (s.language) {
      langSet.add(s.language)
    }
  }
  return Array.from(langSet).sort((a, b) => {
    const order = Object.values(LANGUAGES)
    return order.indexOf(a) - order.indexOf(b)
  })
}

export function filterSnippets(snippets, { language = null, searchTerm = '', favoriteOnly = false } = {}) {
  return snippets.filter((s) => {
    if (favoriteOnly && !s.favorite) return false

    if (language && s.language !== language) return false

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const titleMatch = s.title && s.title.toLowerCase().includes(term)
      const codeMatch = s.code && s.code.toLowerCase().includes(term)
      const notesMatch = s.notes && s.notes.toLowerCase().includes(term)
      if (!titleMatch && !codeMatch && !notesMatch) return false
    }

    return true
  })
}

export function sortSnippets(snippets, sortBy = 'createdAt', sortOrder = 'desc') {
  const sorted = [...snippets]
  const multiplier = sortOrder === 'asc' ? 1 : -1

  sorted.sort((a, b) => {
    if (a.favorite !== b.favorite) {
      return a.favorite ? -1 : 1
    }

    switch (sortBy) {
      case 'title': {
        const va = (a.title || '').trim()
        const vb = (b.title || '').trim()
        const aEmpty = va.length === 0
        const bEmpty = vb.length === 0
        if (aEmpty && bEmpty) return 0
        if (aEmpty) return 1
        if (bEmpty) return -1
        if (va < vb) return -1 * multiplier
        if (va > vb) return 1 * multiplier
        return 0
      }
      case 'createdAt':
      default: {
        const va = a.createdAt || 0
        const vb = b.createdAt || 0
        return (va - vb) * multiplier
      }
    }
  })

  return sorted
}

const MD_TOKEN_START = '\u0002MDT'
const MD_TOKEN_END = 'TDM\u0003'
const MD_TOKEN_REGEX = new RegExp(`${MD_TOKEN_START}(\\d+)${MD_TOKEN_END}`, 'g')

function mdEscapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isSafeUrl(url) {
  if (!url) return false
  const trimmed = url.trim()
  if (!trimmed) return false
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('http://') || lower.startsWith('https://')) return true
  if (lower.startsWith('mailto:')) return true
  if (lower.startsWith('tel:')) return true
  if (lower.startsWith('/') || lower.startsWith('./') || lower.startsWith('../')) return true
  if (/^#[a-zA-Z0-9_-]*$/.test(trimmed)) return true
  return false
}

function sanitizeUrl(url) {
  if (isSafeUrl(url)) return mdEscapeHtml(url)
  return '#'
}

function mdProtectInline(text, tokens) {
  let result = text

  result = result.replace(/`([^`]+)`/g, (_, code) => {
    const idx = tokens.length
    tokens.push(`<code>${mdEscapeHtml(code)}</code>`)
    return `${MD_TOKEN_START}${idx}${MD_TOKEN_END}`
  })

  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, linkUrl) => {
    const idx = tokens.length
    const safeUrl = sanitizeUrl(linkUrl)
    tokens.push(`<a href="${safeUrl}" rel="noopener noreferrer">${mdEscapeHtml(linkText)}</a>`)
    return `${MD_TOKEN_START}${idx}${MD_TOKEN_END}`
  })

  result = result.replace(/\*\*\*([^*]+)\*\*\*/g, (_, content) => {
    const idx = tokens.length
    tokens.push(`<strong><em>${mdEscapeHtml(content)}</em></strong>`)
    return `${MD_TOKEN_START}${idx}${MD_TOKEN_END}`
  })

  result = result.replace(/\*\*([^*]+)\*\*/g, (_, content) => {
    const idx = tokens.length
    tokens.push(`<strong>${mdEscapeHtml(content)}</strong>`)
    return `${MD_TOKEN_START}${idx}${MD_TOKEN_END}`
  })

  result = result.replace(/\*([^*]+)\*/g, (_, content) => {
    const idx = tokens.length
    tokens.push(`<em>${mdEscapeHtml(content)}</em>`)
    return `${MD_TOKEN_START}${idx}${MD_TOKEN_END}`
  })

  return result
}

function mdRestoreInline(text, tokens) {
  return text.replace(MD_TOKEN_REGEX, (_, idx) => tokens[Number(idx)] || '')
}

export function renderMarkdown(md) {
  if (!md) return ''

  const lines = md.split('\n')
  const tokens = []
  const resultLines = []
  let i = 0

  const processContent = (rawContent) => {
    const protectedContent = mdProtectInline(rawContent, tokens)
    const escapedContent = mdEscapeHtml(protectedContent)
    return mdRestoreInline(escapedContent, tokens)
  }

  while (i < lines.length) {
    const rawLine = lines[i]

    if (/^######\s+(.+?)$/.test(rawLine)) {
      const rawContent = rawLine.replace(/^######\s+(.+?)$/, '$1')
      resultLines.push(`<h6>${processContent(rawContent)}</h6>`)
      i++
      continue
    }
    if (/^#####\s+(.+?)$/.test(rawLine)) {
      const rawContent = rawLine.replace(/^#####\s+(.+?)$/, '$1')
      resultLines.push(`<h5>${processContent(rawContent)}</h5>`)
      i++
      continue
    }
    if (/^####\s+(.+?)$/.test(rawLine)) {
      const rawContent = rawLine.replace(/^####\s+(.+?)$/, '$1')
      resultLines.push(`<h4>${processContent(rawContent)}</h4>`)
      i++
      continue
    }
    if (/^###\s+(.+?)$/.test(rawLine)) {
      const rawContent = rawLine.replace(/^###\s+(.+?)$/, '$1')
      resultLines.push(`<h3>${processContent(rawContent)}</h3>`)
      i++
      continue
    }
    if (/^##\s+(.+?)$/.test(rawLine)) {
      const rawContent = rawLine.replace(/^##\s+(.+?)$/, '$1')
      resultLines.push(`<h2>${processContent(rawContent)}</h2>`)
      i++
      continue
    }
    if (/^#\s+(.+?)$/.test(rawLine)) {
      const rawContent = rawLine.replace(/^#\s+(.+?)$/, '$1')
      resultLines.push(`<h1>${processContent(rawContent)}</h1>`)
      i++
      continue
    }

    if (/^---+$/.test(rawLine.trim())) {
      resultLines.push('<hr />')
      i++
      continue
    }

    if (/^>\s+(.+?)$/.test(rawLine)) {
      const rawContent = rawLine.replace(/^>\s+(.+?)$/, '$1')
      resultLines.push(`<blockquote>${processContent(rawContent)}</blockquote>`)
      i++
      continue
    }

    if (/^-\s+(.+?)$/.test(rawLine)) {
      const ulItems = []
      while (i < lines.length && /^-\s+(.+?)$/.test(lines[i])) {
        const rawContent = lines[i].replace(/^-\s+(.+?)$/, '$1')
        ulItems.push(`<li>${processContent(rawContent)}</li>`)
        i++
      }
      resultLines.push(`<ul>${ulItems.join('')}</ul>`)
      continue
    }

    if (/^\d+\.\s+(.+?)$/.test(rawLine)) {
      const olItems = []
      while (i < lines.length && /^\d+\.\s+(.+?)$/.test(lines[i])) {
        const rawContent = lines[i].replace(/^\d+\.\s+(.+?)$/, '$1')
        olItems.push(`<li>${processContent(rawContent)}</li>`)
        i++
      }
      resultLines.push(`<ol>${olItems.join('')}</ol>`)
      continue
    }

    resultLines.push(processContent(rawLine))
    i++
  }

  return resultLines.join('<br />')
}

export function snippetsToJson(snippets) {
  return JSON.stringify(snippets, null, 2)
}

export function jsonToSnippets(jsonString) {
  const parsed = JSON.parse(jsonString)
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid snippets data: expected an array')
  }
  return parsed.map((item) => ({
    id: item.id || generateSnippetId(),
    title: item.title || '未命名片段',
    language: item.language || LANGUAGES.JAVASCRIPT,
    code: item.code || '',
    notes: item.notes || '',
    favorite: !!item.favorite,
    createdAt: item.createdAt || Date.now(),
    updatedAt: item.updatedAt || Date.now(),
  }))
}

export function mergeSnippets(existing, imported, overwrite = false) {
  if (overwrite) {
    return imported
  }
  const existingMap = new Map(existing.map((s) => [s.id, s]))
  const result = [...existing]
  for (const item of imported) {
    if (!existingMap.has(item.id)) {
      result.push(item)
    }
  }
  return result
}

export function downloadJsonFile(content, filename) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function formatDate(timestamp) {
  if (timestamp == null) return '-'
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text)
}
