import {
  TEMPLATES,
  MODULE_TYPES,
  MODULE_LABELS,
  MODULE_ICONS,
  DEFAULT_MODULE_CONTENT,
} from './constants'

let idCounter = 0

export function generateId(prefix = 'mod') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function escapeHtml(str) {
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
  return `<pre class="md-code-block"><code>${html}</code></pre>`
}

const renderInlineCode = (content) => {
  return `<code class="md-inline-code">${escapeHtml(content)}</code>`
}

const renderInlineStyles = (text) => {
  let result = text

  result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  result = result.replace(/(?<!\*)\*(?!\s)([^*\n]+?)(?<!\s)\*(?!\*)/g, '<em>$1</em>')
  result = result.replace(/(?<!_)_(?!\s)([^_\n]+?)(?<!\s)_(?!_)/g, '<em>$1</em>')
  result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>')

  result = result.replace(/`([^`]+)`/g, (_, code) => renderInlineCode(code))

  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img class="md-image" alt="$1" src="$2" />')
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="md-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  return result
}

const processLine = (line) => {
  let trimmed = line.trim()

  if (/^#{1,6}\s+/.test(trimmed)) {
    const level = trimmed.match(/^#{1,6}/)[0].length
    const content = trimmed.replace(/^#{1,6}\s+/, '')
    return `<h${level} class="md-heading md-h${level}">${renderInlineStyles(content)}</h${level}>`
  }

  if (/^>\s?/.test(trimmed)) {
    const content = trimmed.replace(/^>\s?/, '')
    return `<blockquote class="md-blockquote">${renderInlineStyles(content)}</blockquote>`
  }

  if (/^\d+\.\s+/.test(trimmed)) {
    const content = trimmed.replace(/^\d+\.\s+/, '')
    return { type: 'ol', content: renderInlineStyles(content) }
  }

  if (/^[-*+]\s+/.test(trimmed)) {
    const content = trimmed.replace(/^[-*+]\s+/, '')
    return { type: 'ul', content: renderInlineStyles(content) }
  }

  if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
    return '<hr class="md-hr" />'
  }

  if (trimmed === '') {
    return ''
  }

  return `<p class="md-paragraph">${renderInlineStyles(line)}</p>`
}

export function markdownToHtml(markdown) {
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
        htmlParts.push(`<${processed.type} class="md-list md-${processed.type}">`)
        currentList = { type: processed.type }
      }
      htmlParts.push(`<li class="md-list-item">${processed.content}</li>`)
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

export function createModule(type, content) {
  return {
    id: generateId(type),
    type,
    visible: true,
    expanded: false,
    content: content || DEFAULT_MODULE_CONTENT[type] || '',
  }
}

export function createDefaultModules() {
  return Object.values(MODULE_TYPES).map((type) => createModule(type))
}

export function createDefaultResumeState() {
  return {
    selectedTemplateId: TEMPLATES[0].id,
    modules: createDefaultModules(),
    filterMode: 'all',
  }
}

export function reorderModules(modules, fromIndex, toIndex) {
  if (!Array.isArray(modules)) return []
  if (fromIndex < 0 || fromIndex >= modules.length) return modules
  if (toIndex < 0 || toIndex >= modules.length) return modules
  if (fromIndex === toIndex) return modules

  const result = [...modules]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}

export function toggleModuleVisibility(modules, moduleId) {
  if (!Array.isArray(modules)) return []
  return modules.map((m) =>
    m.id === moduleId ? { ...m, visible: !m.visible } : m
  )
}

export function toggleModuleExpanded(modules, moduleId) {
  if (!Array.isArray(modules)) return []
  return modules.map((m) =>
    m.id === moduleId ? { ...m, expanded: !m.expanded } : m
  )
}

export function updateModuleContent(modules, moduleId, content) {
  if (!Array.isArray(modules)) return []
  return modules.map((m) =>
    m.id === moduleId ? { ...m, content } : m
  )
}

export function getVisibleModules(modules) {
  if (!Array.isArray(modules)) return []
  return modules.filter((m) => m && m.visible)
}

export function getModuleLabel(module) {
  if (!module) return ''
  return MODULE_LABELS[module.type] || module.type
}

export function getModuleIcon(module) {
  if (!module) return ''
  return MODULE_ICONS[module.type] || '📄'
}

export function getTemplateById(templateId) {
  return TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0]
}

export function filterTemplates(templates, filterMode, favorites) {
  if (!Array.isArray(templates)) return []
  if (filterMode === 'favorites') {
    return templates.filter((t) => favorites && favorites[t.id])
  }
  return templates
}

export function toggleFavorite(favorites, templateId) {
  if (!favorites || typeof favorites !== 'object') {
    return { [templateId]: true }
  }
  const next = { ...favorites }
  if (next[templateId]) {
    delete next[templateId]
  } else {
    next[templateId] = true
  }
  return next
}

export function isFavorite(favorites, templateId) {
  if (!favorites || typeof favorites !== 'object') return false
  return !!favorites[templateId]
}

export function setRating(ratings, templateId, rating) {
  if (!ratings || typeof ratings !== 'object') {
    if (rating <= 0) return {}
    return { [templateId]: Math.max(1, Math.min(5, rating)) }
  }
  const next = { ...ratings }
  if (rating <= 0) {
    delete next[templateId]
    return next
  }
  next[templateId] = Math.max(1, Math.min(5, rating))
  return next
}

export function getRating(ratings, templateId) {
  if (!ratings || typeof ratings !== 'object') return 0
  return ratings[templateId] || 0
}

export function getAverageRating(ratings) {
  if (!ratings || typeof ratings !== 'object') return 0
  const values = Object.values(ratings).filter((v) => typeof v === 'number' && v > 0)
  if (values.length === 0) return 0
  const sum = values.reduce((acc, v) => acc + v, 0)
  return sum / values.length
}

export function generateResumeMarkdown(modules) {
  const visible = getVisibleModules(modules)
  return visible.map((m) => m.content).join('\n\n---\n\n')
}

export function validateTemplate(template) {
  if (!template || typeof template !== 'object') {
    return { valid: false, message: '模板数据格式无效' }
  }
  if (!template.id || typeof template.id !== 'string') {
    return { valid: false, message: '模板缺少有效ID' }
  }
  if (!template.name || typeof template.name !== 'string') {
    return { valid: false, message: '模板缺少名称' }
  }
  if (!template.primaryColor || typeof template.primaryColor !== 'string') {
    return { valid: false, message: '模板缺少主色调' }
  }
  return { valid: true, message: '' }
}

export function validateModule(module) {
  if (!module || typeof module !== 'object') {
    return { valid: false, message: '模块数据格式无效' }
  }
  if (!module.id || typeof module.id !== 'string') {
    return { valid: false, message: '模块缺少有效ID' }
  }
  if (!module.type || typeof module.type !== 'string') {
    return { valid: false, message: '模块缺少类型' }
  }
  if (typeof module.visible !== 'boolean') {
    return { valid: false, message: '模块可见性格式错误' }
  }
  if (typeof module.content !== 'string') {
    return { valid: false, message: '模块内容格式错误' }
  }
  return { valid: true, message: '' }
}
