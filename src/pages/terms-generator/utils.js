import { COMMON_VARIABLES } from './constants.js'

export const escapeHtml = (text) => {
  if (text == null) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const extractVariables = (content) => {
  if (typeof content !== 'string') return []
  const regex = /\{([^{}]+)\}/g
  const seen = new Set()
  const result = []
  let match
  while ((match = regex.exec(content)) !== null) {
    const varName = match[1].trim()
    if (varName && !seen.has(varName)) {
      seen.add(varName)
      result.push(varName)
    }
  }
  return result
}

export const replaceVariables = (content, variables) => {
  if (typeof content !== 'string') return ''
  const vars = variables && typeof variables === 'object' ? variables : {}
  return content.replace(/\{([^{}]+)\}/g, (match, key) => {
    const trimmedKey = key.trim()
    const value = vars[trimmedKey]
    return value != null && value !== '' ? String(value) : match
  })
}

export const getTemplateSections = (content) => {
  if (typeof content !== 'string') return []
  const lines = content.split('\n')
  const sections = []
  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)$/)
    if (match) {
      sections.push({
        level: match[1].length,
        title: match[2].trim(),
      })
    }
  }
  return sections
}

export const renderMarkdownToHtml = (content) => {
  if (!content || typeof content !== 'string') return ''

  const segments = []
  const lines = content.split('\n')
  let inCodeBlock = false
  let codeBlockLines = []
  let normalLines = []

  const flushNormal = () => {
    if (normalLines.length > 0) {
      segments.push({ type: 'normal', content: normalLines.join('\n') })
      normalLines = []
    }
  }

  const flushCodeBlock = () => {
    if (codeBlockLines.length > 0 || inCodeBlock) {
      segments.push({ type: 'code', content: codeBlockLines.join('\n') })
      codeBlockLines = []
      inCodeBlock = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fenceMatch = line.match(/^\s*```/)

    if (fenceMatch) {
      if (!inCodeBlock) {
        flushNormal()
        inCodeBlock = true
      } else {
        flushCodeBlock()
      }
    } else {
      if (inCodeBlock) {
        codeBlockLines.push(line)
      } else {
        normalLines.push(line)
      }
    }
  }

  if (inCodeBlock) {
    flushCodeBlock()
  } else {
    flushNormal()
  }

  const renderedSegments = segments.map((seg) => {
    if (seg.type === 'code') {
      return `<pre class="md-code-block"><code>${escapeHtml(seg.content)}</code></pre>`
    }

    let html = escapeHtml(seg.content)

    const inlineCodeSlots = []
    html = html.replace(/`([^`]+)`/g, (_match, code) => {
      const slotIndex = inlineCodeSlots.length
      inlineCodeSlots.push(`<code class="md-inline-code">${code}</code>`)
      return `\x00INLINE_CODE_${slotIndex}\x00`
    })

    html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>')
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')

    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>')

    const htmlLines = html.split('\n')
    const processed = []
    let inList = false
    let listType = null

    for (let i = 0; i < htmlLines.length; i++) {
      const line = htmlLines[i]
      const olMatch = line.match(/^(\d+)\.\s+(.*)$/)
      const ulMatch = line.match(/^[-*]\s+(.*)$/)

      if (olMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) processed.push(`</${listType}>`)
          processed.push('<ol class="md-list">')
          inList = true
          listType = 'ol'
        }
        processed.push(`<li class="md-list-item">${olMatch[2]}</li>`)
      } else if (ulMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) processed.push(`</${listType}>`)
          processed.push('<ul class="md-list">')
          inList = true
          listType = 'ul'
        }
        processed.push(`<li class="md-list-item">${ulMatch[1]}</li>`)
      } else {
        if (inList) {
          processed.push(`</${listType}>`)
          inList = false
          listType = null
        }
        processed.push(line)
      }
    }
    if (inList) processed.push(`</${listType}>`)
    html = processed.join('\n')

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>')

    for (let si = 0; si < inlineCodeSlots.length; si++) {
      html = html.replace(`\x00INLINE_CODE_${si}\x00`, inlineCodeSlots[si])
    }

    html = html.split('\n').map((line) => {
      const trimmed = line.trim()
      if (trimmed === '' || line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<ol') ||
          line.startsWith('</ul') || line.startsWith('</ol') || line.startsWith('<li') || line.startsWith('</li') ||
          line.startsWith('<pre') || line.startsWith('</pre') || line.startsWith('<br')) {
        return line
      }
      return `<p class="md-paragraph">${line}</p>`
    }).join('\n')

    html = html.replace(/(<\/?(h[1-4]|ul|ol|li|pre|p)[^>]*>)\s*<p class="md-paragraph"><\/p>/g, '$1')
    html = html.replace(/<p class="md-paragraph"><\/p>/g, '')

    return html
  })

  return renderedSegments.join('\n')
}

export const splitLines = (text) => {
  if (typeof text !== 'string') return []
  if (text === '') return []
  return text.split('\n')
}

export const computeLCSMatrix = (arr1, arr2) => {
  const m = arr1.length
  const n = arr2.length
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  return dp
}

export const computeLineDiff = (oldText, newText) => {
  const oldArr = splitLines(oldText)
  const newArr = splitLines(newText)
  const dp = computeLCSMatrix(oldArr, newArr)

  const result = []
  let i = oldArr.length
  let j = newArr.length

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldArr[i - 1] === newArr[j - 1]) {
      result.unshift({
        type: 'equal',
        value: oldArr[i - 1],
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'added',
        value: newArr[j - 1],
      })
      j--
    } else {
      result.unshift({
        type: 'removed',
        value: oldArr[i - 1],
      })
      i--
    }
  }

  return result
}

export const validateTemplate = (template) => {
  const errors = []

  if (!template || typeof template !== 'object') {
    return { valid: false, errors: ['模板必须是一个对象'] }
  }

  if (!template.id || typeof template.id !== 'string') {
    errors.push('模板必须有字符串类型的 id')
  }

  if (!template.name || typeof template.name !== 'string' || template.name.trim() === '') {
    errors.push('模板名称不能为空')
  }

  if (typeof template.content !== 'string') {
    errors.push('模板内容必须是字符串')
  }

  if (!Array.isArray(template.variables)) {
    errors.push('模板变量必须是数组')
  } else {
    template.variables.forEach((v, idx) => {
      if (!v || typeof v !== 'object') {
        errors.push(`变量[${idx}]必须是对象`)
        return
      }
      if (!v.key || typeof v.key !== 'string') {
        errors.push(`变量[${idx}]必须有字符串类型的 key`)
      }
      if (!v.label || typeof v.label !== 'string') {
        errors.push(`变量[${idx}]必须有字符串类型的 label`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export const buildExportHtml = (htmlContent, title, companyName, generateDate) => {
  const safeTitle = escapeHtml(title || '条款文档')
  const safeCompany = escapeHtml(companyName || '')
  const safeDate = escapeHtml(generateDate || new Date().toLocaleDateString())

  const styles = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
      line-height: 1.8;
      background: #fff;
    }
    h1 { font-size: 28px; color: #1a1a1a; margin: 0 0 8px 0; }
    h2 { font-size: 22px; color: #2a2a2a; margin: 32px 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #eee; }
    h3 { font-size: 18px; color: #333; margin: 24px 0 12px 0; }
    h4 { font-size: 16px; color: #444; margin: 20px 0 10px 0; }
    p { margin: 12px 0; text-align: justify; }
    strong { font-weight: 600; color: #1a1a1a; }
    em { font-style: italic; }
    ul, ol { margin: 12px 0; padding-left: 28px; }
    li { margin: 6px 0; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-family: Consolas, Monaco, monospace; font-size: 14px; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    .doc-header { text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #eee; }
    .doc-date { color: #666; font-size: 14px; }
    .doc-footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 13px; }
  `

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle}</title>
<style>${styles}</style>
</head>
<body>
  <div class="doc-header">
    <h1>${safeTitle}</h1>
    <div class="doc-date">生成日期：${safeDate}</div>
  </div>
  <div class="doc-content">
    ${htmlContent}
  </div>
  <div class="doc-footer">
    本文档由 ${safeCompany} 生成于 ${safeDate}
  </div>
</body>
</html>`
}

export const generateTemplateId = () => {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const createCustomTemplate = (name, description = '', content = '', variables = []) => {
  return {
    id: generateTemplateId(),
    name: name || '自定义模板',
    description: description || '',
    isDefault: false,
    variables: Array.isArray(variables) ? variables : [],
    content: content || '# 自定义模板\n\n请在此处编辑您的条款内容...\n\n## 章节一\n\n内容...\n',
    createdAt: Date.now(),
  }
}

export const mergeVariableDefinitions = (templateVars, contentExtractedVars) => {
  const commonKeys = new Set(COMMON_VARIABLES.map((v) => v.key))
  const templateKeySet = new Set((templateVars || []).map((v) => v.key))
  const merged = [...(templateVars || [])]

  for (const varName of contentExtractedVars || []) {
    if (!templateKeySet.has(varName)) {
      if (commonKeys.has(varName)) {
        const commonVar = COMMON_VARIABLES.find((v) => v.key === varName)
        if (commonVar) merged.push({ ...commonVar })
      } else {
        merged.push({
          key: varName,
          label: varName,
          type: 'text',
          placeholder: `请输入 ${varName}`,
        })
      }
      templateKeySet.add(varName)
    }
  }

  return merged
}

export const formatTimestamp = (timestamp) => {
  if (timestamp == null) return ''
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const copyToClipboard = async (text) => {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text || '')
      return { success: true }
    }
    return { success: false, error: 'Clipboard API not available' }
  } catch (err) {
    return { success: false, error: err?.message || 'Copy failed' }
  }
}

export const downloadHtmlFile = (htmlContent, filename) => {
  if (typeof document === 'undefined') return { success: false, error: 'DOM not available' }
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'terms-document.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return { success: true }
  } catch (err) {
    return { success: false, error: err?.message || 'Download failed' }
  }
}
