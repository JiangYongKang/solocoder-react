export const STORAGE_KEY = 'solocoder-rich-editor-content'
export const HISTORY_LIMIT = 100
export const INPUT_MERGE_DELAY = 800

export const IMAGE_URL_REGEX = /^(https?:\/\/\S+\.(png|jpe?g|gif|webp|svg|bmp)(\?\S*)?|data:image\/[a-z0-9+\/.-]+;base64,\S+)$/i

export const DEFAULT_CONTENT = `# 欢迎使用富文本编辑器

这是一个支持 **Markdown** 的实时编辑器。

## 功能特点

- 支持 **加粗**、*斜体*、~~删除线~~、<u>下划线</u>（注：下划线需用 HTML 标签 \`<u>\`）
- 支持标题 H1-H3
- 支持引用、有序列表、无序列表、代码块
- 支持插入图片和超链接
- 支持撤销和重做（Ctrl+Z / Ctrl+Y）
- 自动保存到 localStorage
- 直接粘贴图片 URL 会自动转换为 Markdown 图片语法

### 代码示例

\`\`\`js
function hello() {
  console.log('Hello, World!')
}
\`\`\`

> 提示：内容会自动保存，刷新页面不会丢失。

[访问 React 官网](https://react.dev)
`

export const createHistoryState = (content = DEFAULT_CONTENT, cursor = null) => ({
  content,
  cursor: cursor || { start: content.length, end: content.length },
})

export const createHistory = () => ({
  past: [],
  present: createHistoryState(),
  future: [],
})

export const pushHistory = (history, newState, limit = HISTORY_LIMIT) => {
  if (!history) return history
  const presentContent = typeof history.present === 'string' ? history.present : history.present?.content
  const newContent = typeof newState === 'string' ? newState : newState?.content
  if (newContent === presentContent) return history

  const normalizedState = typeof newState === 'string'
    ? createHistoryState(newState)
    : { ...createHistoryState(newState.content), cursor: newState.cursor || { start: newState.content.length, end: newState.content.length } }

  const normalizedPresent = typeof history.present === 'string'
    ? createHistoryState(history.present)
    : history.present

  const newPast = [...history.past, normalizedPresent]
  if (newPast.length > limit) {
    newPast.shift()
  }
  return {
    past: newPast,
    present: normalizedState,
    future: [],
  }
}

export const undoHistory = (history) => {
  if (!history || history.past.length === 0) return history
  const newPast = [...history.past]
  const previous = newPast.pop()
  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  }
}

export const redoHistory = (history) => {
  if (!history || history.future.length === 0) return history
  const newFuture = [...history.future]
  const next = newFuture.shift()
  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  }
}

export const canUndo = (history) => !!(history && history.past && history.past.length > 0)
export const canRedo = (history) => !!(history && history.future && history.future.length > 0)

export const getHistoryContent = (state) => {
  if (typeof state === 'string') return state
  return state?.content || ''
}

export const getHistoryCursor = (state) => {
  if (typeof state === 'string' || !state?.cursor) {
    const content = typeof state === 'string' ? state : state?.content || ''
    return { start: content.length, end: content.length }
  }
  return state.cursor
}

export const saveToStorage = (content) => {
  try {
    localStorage.setItem(STORAGE_KEY, content)
    return true
  } catch {
    return false
  }
}

export const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw || DEFAULT_CONTENT
  } catch {
    return DEFAULT_CONTENT
  }
}

export const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export const escapeHtml = (str) => {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const renderCodeBlock = (content) => {
  const html = escapeHtml(content)
  return `<pre><code>${html}</code></pre>`
}

const renderInlineCode = (content) => {
  return `<code>${escapeHtml(content)}</code>`
}

const renderInlineStyles = (text) => {
  let result = text

  result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  result = result.replace(/(?<!\*)\*(?!\s)([^*\n]+?)(?<!\s)\*(?!\*)/g, '<em>$1</em>')
  result = result.replace(/(?<!_)_(?!\s)([^_\n]+?)(?<!\s)_(?!_)/g, '<em>$1</em>')
  result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  result = result.replace(/<u>([^<]+)<\/u>/g, '<u>$1</u>')

  result = result.replace(/`([^`]+)`/g, (_, code) => renderInlineCode(code))

  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />')
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  return result
}

const processLine = (line) => {
  let trimmed = line.trim()

  if (/^#{1,3}\s+/.test(trimmed)) {
    const level = trimmed.match(/^#{1,3}/)[0].length
    const content = trimmed.replace(/^#{1,3}\s+/, '')
    return `<h${level}>${renderInlineStyles(content)}</h${level}>`
  }

  if (/^>\s?/.test(trimmed)) {
    const content = trimmed.replace(/^>\s?/, '')
    return `<blockquote>${renderInlineStyles(content)}</blockquote>`
  }

  if (/^\d+\.\s+/.test(trimmed)) {
    const content = trimmed.replace(/^\d+\.\s+/, '')
    return { type: 'ol', content: renderInlineStyles(content) }
  }

  if (/^[-*+]\s+/.test(trimmed)) {
    const content = trimmed.replace(/^[-*+]\s+/, '')
    return { type: 'ul', content: renderInlineStyles(content) }
  }

  if (trimmed === '') {
    return ''
  }

  return `<p>${renderInlineStyles(line)}</p>`
}

export const markdownToHtml = (markdown) => {
  if (typeof markdown !== 'string') return ''

  const lines = markdown.split('\n')
  const htmlParts = []
  let inCodeBlock = false
  let codeContent = []
  let currentList = null

  const flushList = () => {
    if (currentList) {
      htmlParts.push(`</${currentList.type}>`)
      currentList = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (/^```/.test(line.trim())) {
      if (inCodeBlock) {
        htmlParts.push(renderCodeBlock(codeContent.join('\n')))
        codeContent = []
        inCodeBlock = false
      } else {
        flushList()
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeContent.push(line)
      continue
    }

    const processed = processLine(line)

    if (typeof processed === 'object' && processed !== null) {
      if (!currentList || currentList.type !== processed.type) {
        flushList()
        htmlParts.push(`<${processed.type}>`)
        currentList = { type: processed.type }
      }
      htmlParts.push(`<li>${processed.content}</li>`)
    } else {
      flushList()
      if (processed !== '') {
        htmlParts.push(processed)
      }
    }
  }

  flushList()

  if (inCodeBlock) {
    htmlParts.push(renderCodeBlock(codeContent.join('\n')))
  }

  return htmlParts.join('\n')
}

export const wrapText = (content, selectionStart, selectionEnd, before, after = before) => {
  if (typeof content !== 'string') return { text: '', start: 0, end: 0 }
  const start = Math.max(0, Math.min(selectionStart, selectionEnd))
  const end = Math.max(0, Math.max(selectionStart, selectionEnd))
  const selected = content.slice(start, end)
  const beforeText = content.slice(0, start)
  const afterText = content.slice(end)
  const newText = beforeText + before + selected + after + afterText
  const newStart = start + before.length
  const newEnd = newStart + (end - start)
  return { text: newText, start: newStart, end: newEnd }
}

export const wrapLinePrefix = (content, selectionStart, selectionEnd, prefix) => {
  if (typeof content !== 'string') return { text: '', start: 0, end: 0 }
  const start = Math.max(0, Math.min(selectionStart, selectionEnd))
  const end = Math.max(0, Math.max(selectionStart, selectionEnd))

  let lineStart = content.lastIndexOf('\n', start - 1) + 1
  if (lineStart < 0) lineStart = 0

  const beforeText = content.slice(0, lineStart)
  const targetLine = content.slice(lineStart, end)
  const afterText = content.slice(end)

  const lines = targetLine.split('\n')
  const prefixed = lines.map((line) => {
    if (line.startsWith(prefix)) return line
    return prefix + line
  }).join('\n')

  const newText = beforeText + prefixed + afterText
  const prefixLen = lines[0].startsWith(prefix) ? 0 : prefix.length
  return { text: newText, start: start + prefixLen, end: end + prefixLen * lines.length }
}

export const insertImage = (content, selectionStart, selectionEnd, url, alt = '') => {
  if (typeof content !== 'string') return { text: '', start: 0, end: 0 }
  const start = Math.max(0, Math.min(selectionStart, selectionEnd))
  const end = Math.max(0, Math.max(selectionStart, selectionEnd))
  const markdown = `![${alt}](${url})`
  const newText = content.slice(0, start) + markdown + content.slice(end)
  const cursorPos = start + markdown.length
  return { text: newText, start: cursorPos, end: cursorPos }
}

export const insertLink = (content, selectionStart, selectionEnd, url, text = '') => {
  if (typeof content !== 'string') return { text: '', start: 0, end: 0 }
  const start = Math.max(0, Math.min(selectionStart, selectionEnd))
  const end = Math.max(0, Math.max(selectionStart, selectionEnd))
  const selected = text || content.slice(start, end) || url
  const markdown = `[${selected}](${url})`
  const newText = content.slice(0, start) + markdown + content.slice(end)
  const cursorPos = start + markdown.length
  return { text: newText, start: cursorPos, end: cursorPos }
}

export const wrapCodeBlock = (content, selectionStart, selectionEnd, lang = '') => {
  if (typeof content !== 'string') return { text: '', start: 0, end: 0 }
  const start = Math.max(0, Math.min(selectionStart, selectionEnd))
  const end = Math.max(0, Math.max(selectionStart, selectionEnd))
  const selected = content.slice(start, end) || '在此输入代码'
  const before = content.slice(0, start)
  const after = content.slice(end)
  const block = `\`\`\`${lang}\n${selected}\n\`\`\``
  const newText = before + block + after
  const blockStart = start + 3 + lang.length + 1
  const blockEnd = blockStart + selected.length
  return { text: newText, start: blockStart, end: blockEnd }
}

export const isValidUrl = (str) => {
  if (typeof str !== 'string' || str.trim() === '') return false
  try {
    new URL(str)
    return true
  } catch {
    return /^(data:image|\/|\.\/|\.\.\/)/.test(str)
  }
}

export const isImageUrl = (str) => {
  if (typeof str !== 'string' || str.trim() === '') return false
  return IMAGE_URL_REGEX.test(str.trim())
}

export const detectPastedContent = (clipboardData) => {
  if (!clipboardData) return { type: 'text', content: '' }

  const items = clipboardData.items || []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type && item.type.startsWith('image/')) {
      const file = item.getAsFile?.()
      if (file) {
        return { type: 'image-file', file }
      }
    }
  }

  const text = clipboardData.getData?.('text') || ''
  const trimmed = text.trim()
  if (isImageUrl(trimmed)) {
    return { type: 'image-url', url: trimmed }
  }

  if (isValidUrl(trimmed)) {
    return { type: 'url', url: trimmed }
  }

  return { type: 'text', content: text }
}

export const triggerDownload = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const exportAsMarkdown = (content, filename = 'document.md') => {
  triggerDownload(content, filename, 'text/markdown')
}

export const exportAsHtml = (content, filename = 'document.html') => {
  const body = markdownToHtml(content)
  const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${filename}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #333; }
    h1, h2, h3 { line-height: 1.25; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { font-family: ui-monospace, Consolas, monospace; background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #aa3bff; padding: 8px 16px; margin: 16px 0; background: #f9f5ff; color: #555; font-style: italic; }
    img { max-width: 100%; }
    a { color: #aa3bff; }
  </style>
</head>
<body>
${body}
</body>
</html>`
  triggerDownload(fullHtml, filename, 'text/html')
}

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      reject(new Error('Invalid file'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
