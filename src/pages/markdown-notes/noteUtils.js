import {
    DEFAULT_NOTE_CONTENT,
    DEFAULT_PANEL_RATIO,
    NODE_TYPES,
    STORAGE_KEY,
    UI_STORAGE_KEY,
} from './constants.js'

export function generateId(prefix = 'node') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getDefaultData() {
  const notebookId = generateId('notebook')
  const folderId = generateId('folder')
  const noteId1 = generateId('note')
  const noteId2 = generateId('note')

  return {
    rootNotebooks: [notebookId],
    nodes: {
      [notebookId]: {
        id: notebookId,
        type: NODE_TYPES.NOTEBOOK,
        name: '我的笔记本',
        children: [folderId, noteId2],
        expanded: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      [folderId]: {
        id: folderId,
        type: NODE_TYPES.FOLDER,
        name: '工作笔记',
        parentId: notebookId,
        children: [noteId1],
        expanded: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      [noteId1]: {
        id: noteId1,
        type: NODE_TYPES.NOTE,
        title: '会议记录',
        parentId: folderId,
        content: `# 会议记录

**日期**：2024-01-15

## 议题

1. 项目进度汇报
2. 下周计划安排
3. 问题讨论

## 决议

- 完成 [[Markdown 笔记]] 功能开发
- 启动测试工作`,
        tags: ['工作', '会议'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      [noteId2]: {
        id: noteId2,
        type: NODE_TYPES.NOTE,
        title: 'Markdown 笔记',
        parentId: notebookId,
        content: DEFAULT_NOTE_CONTENT,
        tags: ['教程', 'Markdown'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  }
}

export function getDefaultUIState() {
  return {
    selectedNoteId: null,
    panelRatio: DEFAULT_PANEL_RATIO,
    expandedNodes: {},
    activeTags: [],
    searchQuery: '',
  }
}

export function loadData(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return getDefaultData()
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) {
      const defaults = getDefaultData()
      saveData(defaults, storage)
      return defaults
    }
    const parsed = JSON.parse(raw)
    if (!parsed.nodes || !Array.isArray(parsed.rootNotebooks)) {
      return getDefaultData()
    }
    return parsed
  } catch {
    return getDefaultData()
  }
}

export function saveData(data, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore storage errors
  }
}

export function loadUIState(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return getDefaultUIState()
  try {
    const raw = storage.getItem(UI_STORAGE_KEY)
    if (!raw) return getDefaultUIState()
    const parsed = JSON.parse(raw)
    return {
      ...getDefaultUIState(),
      ...parsed,
    }
  } catch {
    return getDefaultUIState()
  }
}

export function saveUIState(state, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(UI_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}

export function getNode(data, nodeId) {
  return data.nodes[nodeId] || null
}

export function getChildren(data, nodeId) {
  const node = getNode(data, nodeId)
  if (!node || !Array.isArray(node.children)) return []
  return node.children.map((id) => getNode(data, id)).filter(Boolean)
}

export function getPathToNode(data, nodeId) {
  const path = []
  let current = getNode(data, nodeId)
  while (current) {
    path.unshift({ id: current.id, name: current.name || current.title })
    current = current.parentId ? getNode(data, current.parentId) : null
  }
  return path
}

export function getPathString(data, nodeId) {
  return getPathToNode(data, nodeId)
    .map((p) => p.name)
    .join(' / ')
}

export function collectDescendantIds(data, nodeId) {
  const ids = []
  const node = getNode(data, nodeId)
  if (!node) return ids
  if (node.children) {
    for (const childId of node.children) {
      ids.push(childId)
      ids.push(...collectDescendantIds(data, childId))
    }
  }
  return ids
}

export function collectAllNotes(data) {
  const notes = []
  for (const nodeId of Object.keys(data.nodes)) {
    const node = data.nodes[nodeId]
    if (node.type === NODE_TYPES.NOTE) {
      notes.push(node)
    }
  }
  return notes
}

export function collectNotesInNotebook(data, notebookId) {
  const descendantIds = collectDescendantIds(data, notebookId)
  return descendantIds
    .map((id) => getNode(data, id))
    .filter((node) => node && node.type === NODE_TYPES.NOTE)
}

export function findNoteByTitle(data, title) {
  const notes = collectAllNotes(data)
  return notes.find((note) => note.title === title) || null
}

export function createNotebook(data, name) {
  const now = Date.now()
  const id = generateId('notebook')
  const newNode = {
    id,
    type: NODE_TYPES.NOTEBOOK,
    name,
    children: [],
    expanded: true,
    createdAt: now,
    updatedAt: now,
  }
  const newNodes = { ...data.nodes, [id]: newNode }
  return {
    ...data,
    rootNotebooks: [...data.rootNotebooks, id],
    nodes: newNodes,
  }
}

export function createFolder(data, parentId, name) {
  const parent = getNode(data, parentId)
  if (!parent) return data
  if (parent.type === NODE_TYPES.NOTE) return data

  const now = Date.now()
  const id = generateId('folder')
  const newNode = {
    id,
    type: NODE_TYPES.FOLDER,
    name,
    parentId,
    children: [],
    expanded: true,
    createdAt: now,
    updatedAt: now,
  }
  const newNodes = { ...data.nodes, [id]: newNode }
  newNodes[parentId] = {
    ...parent,
    children: [...(parent.children || []), id],
    updatedAt: now,
  }
  return { ...data, nodes: newNodes }
}

export function createNote(data, parentId, title, content = '') {
  const parent = getNode(data, parentId)
  if (!parent) return data
  if (parent.type === NODE_TYPES.NOTE) return data

  const now = Date.now()
  const id = generateId('note')
  const newNode = {
    id,
    type: NODE_TYPES.NOTE,
    title,
    parentId,
    content,
    tags: [],
    createdAt: now,
    updatedAt: now,
  }
  const newNodes = { ...data.nodes, [id]: newNode }
  newNodes[parentId] = {
    ...parent,
    children: [...(parent.children || []), id],
    updatedAt: now,
  }
  return { ...data, nodes: newNodes }
}

export function renameNode(data, nodeId, newName) {
  const node = getNode(data, nodeId)
  if (!node) return data

  const now = Date.now()
  const newNodes = { ...data.nodes }
  const updatedNode = { ...node, updatedAt: now }

  if (node.type === NODE_TYPES.NOTE) {
    updatedNode.title = newName
  } else {
    updatedNode.name = newName
  }

  newNodes[nodeId] = updatedNode

  if (node.parentId && newNodes[node.parentId]) {
    newNodes[node.parentId] = {
      ...newNodes[node.parentId],
      updatedAt: now,
    }
  }

  return { ...data, nodes: newNodes }
}

export function deleteNode(data, nodeId) {
  const node = getNode(data, nodeId)
  if (!node) return data

  const toDelete = new Set([nodeId, ...collectDescendantIds(data, nodeId)])
  const newNodes = {}
  for (const id of Object.keys(data.nodes)) {
    if (!toDelete.has(id)) {
      newNodes[id] = { ...data.nodes[id] }
    }
  }

  if (node.parentId && newNodes[node.parentId]) {
    newNodes[node.parentId] = {
      ...newNodes[node.parentId],
      children: (newNodes[node.parentId].children || []).filter((id) => id !== nodeId),
      updatedAt: Date.now(),
    }
  }

  const newRootNotebooks = data.rootNotebooks.filter((id) => id !== nodeId)

  return {
    ...data,
    rootNotebooks: newRootNotebooks,
    nodes: newNodes,
  }
}

export function moveNode(data, nodeId, newParentId, targetIndex = -1) {
  const node = getNode(data, nodeId)
  const newParent = getNode(data, newParentId)

  if (!node || !newParent) return data
  if (node.type === NODE_TYPES.NOTEBOOK) return data
  if (newParent.type === NODE_TYPES.NOTE) return data

  const descendantIds = collectDescendantIds(data, nodeId)
  if (descendantIds.includes(newParentId)) return data
  if (node.parentId === newParentId) return data

  const now = Date.now()
  const newNodes = { ...data.nodes }

  if (node.parentId && newNodes[node.parentId]) {
    newNodes[node.parentId] = {
      ...newNodes[node.parentId],
      children: (newNodes[node.parentId].children || []).filter((id) => id !== nodeId),
      updatedAt: now,
    }
  }

  newNodes[nodeId] = {
    ...node,
    parentId: newParentId,
    updatedAt: now,
  }

  const parentChildren = [...(newParent.children || [])]
  const safeIndex = targetIndex < 0 ? parentChildren.length : Math.min(targetIndex, parentChildren.length)
  parentChildren.splice(safeIndex, 0, nodeId)

  newNodes[newParentId] = {
    ...newParent,
    children: parentChildren,
    updatedAt: now,
  }

  return { ...data, nodes: newNodes }
}

export function toggleExpanded(data, nodeId) {
  const node = getNode(data, nodeId)
  if (!node || node.type === NODE_TYPES.NOTE) return data

  const newNodes = {
    ...data.nodes,
    [nodeId]: {
      ...node,
      expanded: !node.expanded,
    },
  }
  return { ...data, nodes: newNodes }
}

export function updateNoteContent(data, noteId, content) {
  const note = getNode(data, noteId)
  if (!note || note.type !== NODE_TYPES.NOTE) return data

  const newNodes = {
    ...data.nodes,
    [noteId]: {
      ...note,
      content,
      updatedAt: Date.now(),
    },
  }
  return { ...data, nodes: newNodes }
}

export function addTagToNote(data, noteId, tag) {
  const note = getNode(data, noteId)
  if (!note || note.type !== NODE_TYPES.NOTE) return data

  const trimmedTag = tag.trim()
  if (!trimmedTag) return data
  if (note.tags && note.tags.includes(trimmedTag)) return data

  const newNodes = {
    ...data.nodes,
    [noteId]: {
      ...note,
      tags: [...(note.tags || []), trimmedTag],
      updatedAt: Date.now(),
    },
  }
  return { ...data, nodes: newNodes }
}

export function removeTagFromNote(data, noteId, tag) {
  const note = getNode(data, noteId)
  if (!note || note.type !== NODE_TYPES.NOTE) return data

  const newNodes = {
    ...data.nodes,
    [noteId]: {
      ...note,
      tags: (note.tags || []).filter((t) => t !== tag),
      updatedAt: Date.now(),
    },
  }
  return { ...data, nodes: newNodes }
}

export function getAllTags(data) {
  const tagCount = {}
  const notes = collectAllNotes(data)
  for (const note of notes) {
    for (const tag of note.tags || []) {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    }
  }
  return Object.entries(tagCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function filterNotesByTags(data, tags) {
  if (!tags || tags.length === 0) return collectAllNotes(data)
  const notes = collectAllNotes(data)
  return notes.filter((note) => {
    const noteTags = note.tags || []
    return tags.every((tag) => noteTags.includes(tag))
  })
}

export function buildSearchIndex(data) {
  const notes = collectAllNotes(data)
  const index = notes.map((note) => ({
    id: note.id,
    title: note.title || '',
    content: note.content || '',
    path: getPathString(data, note.id),
  }))
  return index
}

export function searchNotes(index, query) {
  if (!query || !query.trim()) return []
  const lowerQuery = query.trim().toLowerCase()
  const results = []

  for (const item of index) {
    const titleLower = item.title.toLowerCase()
    const contentLower = item.content.toLowerCase()

    const titleMatch = titleLower.includes(lowerQuery)
    const contentMatch = contentLower.includes(lowerQuery)

    if (titleMatch || contentMatch) {
      let snippet
      if (contentMatch) {
        const idx = contentLower.indexOf(lowerQuery)
        const start = Math.max(0, idx - 50)
        const end = Math.min(item.content.length, idx + lowerQuery.length + 50)
        snippet = (start > 0 ? '...' : '') + item.content.slice(start, end) + (end < item.content.length ? '...' : '')
      } else {
        snippet = item.content.slice(0, 100) + (item.content.length > 100 ? '...' : '')
      }

      results.push({
        id: item.id,
        title: item.title,
        path: item.path,
        snippet,
        matchesTitle: titleMatch,
        matchesContent: contentMatch,
      })
    }
  }

  return results
}

export function highlightText(text, query) {
  if (!query || !text) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '{{{HIGHLIGHT}}}$1{{{/HIGHLIGHT}}}')
}

export function highlightTextSafe(text, query) {
  if (!query || !text) return escapeHtml(text)
  const escapedText = escapeHtml(text)
  const escapedQuery = escapeHtml(query)
  const escapedRegexQuery = escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedRegexQuery})`, 'gi')
  return escapedText.replace(regex, '<span class="highlight">$1</span>')
}

export function parseInternalLinks(content) {
  const linkRegex = /\[\[([^\]]+)\]\]/g
  const links = []
  let match
  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      title: match[1],
      index: match.index,
      fullMatch: match[0],
    })
  }
  return links
}

export function escapeHtml(text) {
  if (text == null) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderMarkdown(content, data) {
  if (!content) return ''

  const segments = []
  const lines = content.split('\n')
  let inCodeBlock = false
  let codeBlockLang = ''
  let codeBlockLines = []
  let normalLines = []

  function flushNormal() {
    if (normalLines.length > 0) {
      segments.push({ type: 'normal', content: normalLines.join('\n') })
      normalLines = []
    }
  }

  function flushCodeBlock() {
    if (codeBlockLines.length > 0 || inCodeBlock) {
      segments.push({ type: 'code', lang: codeBlockLang, content: codeBlockLines.join('\n') })
      codeBlockLang = ''
      codeBlockLines = []
      inCodeBlock = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fenceMatch = line.match(/^\s*```([\w+\-#]*)\s*$/)

    if (fenceMatch) {
      if (!inCodeBlock) {
        flushNormal()
        inCodeBlock = true
        codeBlockLang = fenceMatch[1] || ''
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
      const escapedCode = escapeHtml(seg.content)
      return `<pre class="code-block"><code>${escapedCode}</code></pre>`
    }

    let html = escapeHtml(seg.content)

    const inlineCodeSlots = []
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const slotIndex = inlineCodeSlots.length
      inlineCodeSlots.push(`<code class="inline-code">${code}</code>`)
      return `\x00INLINE_CODE_${slotIndex}\x00`
    })

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
          processed.push('<ol>')
          inList = true
          listType = 'ol'
        }
        processed.push(`<li>${olMatch[2]}</li>`)
      } else if (ulMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) processed.push(`</${listType}>`)
          processed.push('<ul>')
          inList = true
          listType = 'ul'
        }
        processed.push(`<li>${ulMatch[1]}</li>`)
      } else {
        if (inList) {
          processed.push(`</${listType}>`)
          inList = false
          listType = null
        }
        if (line.trim() === '') {
          processed.push('')
        } else {
          processed.push(line)
        }
      }
    }
    if (inList) processed.push(`</${listType}>`)

    html = processed.join('\n')

    const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g
    html = html.replace(tableRegex, (match, headerRow, bodyRows) => {
      const headers = headerRow.split('|').map((h) => h.trim()).filter(Boolean)
      const bodyLines = bodyRows.split('\n').filter(Boolean)

      let tableHtml = '<table><thead><tr>'
      for (const h of headers) {
        tableHtml += `<th>${h}</th>`
      }
      tableHtml += '</tr></thead><tbody>'

      for (const bodyLine of bodyLines) {
        const cells = bodyLine.split('|').map((c) => c.trim()).filter(Boolean)
        tableHtml += '<tr>'
        for (let i = 0; i < headers.length; i++) {
          tableHtml += `<td>${cells[i] || ''}</td>`
        }
        tableHtml += '</tr>'
      }
      tableHtml += '</tbody></table>'
      return tableHtml
    })

    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

    const linkRegex = /\[\[([^\]]+)\]\]/g
    html = html.replace(linkRegex, (match, title) => {
      const existingNote = findNoteByTitle(data, title)
      if (existingNote) {
        return `<a href="#" class="internal-link" data-note-id="${existingNote.id}" data-note-title="${title}">[[${title}]]</a>`
      } else {
        return `<a href="#" class="internal-link broken" data-note-title="${title}" data-create-new="true">[[${title}]]</a>`
      }
    })

    for (let si = 0; si < inlineCodeSlots.length; si++) {
      html = html.replace(`\x00INLINE_CODE_${si}\x00`, inlineCodeSlots[si])
    }

    html = html.split('\n').map((line) => {
      const trimmed = line.trim()
      if (trimmed === '' || line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<ol') ||
          line.startsWith('</ul') || line.startsWith('</ol') || line.startsWith('<li') || line.startsWith('</li') ||
          line.startsWith('<table') || line.startsWith('</table')) {
        return line
      }
      return `<p>${line}</p>`
    }).join('\n')

    return html
  })

  return renderedSegments.join('\n')
}

export function getBrokenLinks(data) {
  const notes = collectAllNotes(data)
  const allNoteTitles = new Set(notes.map((n) => n.title))
  const brokenLinks = []

  for (const note of notes) {
    const links = parseInternalLinks(note.content)
    for (const link of links) {
      if (!allNoteTitles.has(link.title)) {
        brokenLinks.push({
          fromNoteId: note.id,
          fromNoteTitle: note.title,
          toNoteTitle: link.title,
        })
      }
    }
  }
  return brokenLinks
}

export function updateLinksOnRename(data, oldTitle, newTitle) {
  const notes = collectAllNotes(data)
  let newData = data
  const linkRegex = new RegExp(`\\[\\[${oldTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g')

  for (const note of notes) {
    if (note.content.includes(`[[${oldTitle}]]`)) {
      const newContent = note.content.replace(linkRegex, `[[${newTitle}]]`)
      newData = updateNoteContent(newData, note.id, newContent)
    }
  }
  return newData
}

export function markLinksBrokenOnDelete(data, deletedTitle) {
  const notes = collectAllNotes(data)
  let newData = data
  const linkRegex = new RegExp(`\\[\\[${deletedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g')

  for (const note of notes) {
    if (note.content.includes(`[[${deletedTitle}]]`)) {
      const newContent = note.content.replace(linkRegex, `[[${deletedTitle} (已删除)]]`)
      newData = updateNoteContent(newData, note.id, newContent)
    }
  }
  return newData
}

export function importNote(content, filename = 'untitled') {
  const title = filename.replace(/\.md$/i, '')
  return {
    title,
    content,
  }
}

export function exportNote(note) {
  const content = note.content || ''
  const filename = `${note.title || 'untitled'}.md`
  return {
    filename,
    content,
    blob: new Blob([content], { type: 'text/markdown;charset=utf-8' }),
  }
}

export function exportNotebook(data, notebookId) {
  const notes = collectNotesInNotebook(data, notebookId)
  const notebook = getNode(data, notebookId)
  const filename = `${notebook?.name || 'notebook'}.md`

  let content = `# ${notebook?.name || '笔记本导出'}\n\n`
  content += `导出时间: ${new Date().toLocaleString()}\n\n`
  content += `---\n\n`

  for (const note of notes) {
    const path = getPathString(data, note.id)
    content += `## ${note.title}\n\n`
    content += `路径: ${path}\n\n`
    content += `标签: ${(note.tags || []).join(', ')}\n\n`
    content += `${note.content}\n\n`
    content += `---\n\n`
  }

  return {
    filename,
    content,
    blob: new Blob([content], { type: 'text/markdown;charset=utf-8' }),
  }
}

export function hasChildWithName(data, parentId, name, excludeId = null) {
  const parent = getNode(data, parentId)
  if (!parent || !parent.children) return false
  for (const childId of parent.children) {
    if (childId === excludeId) continue
    const child = getNode(data, childId)
    if (!child) continue
    const childName = child.type === NODE_TYPES.NOTE ? child.title : child.name
    if (childName === name) return true
  }
  return false
}

export function hasRootNotebookWithName(data, name, excludeId = null) {
  for (const notebookId of data.rootNotebooks) {
    if (notebookId === excludeId) continue
    const notebook = getNode(data, notebookId)
    if (notebook && notebook.name === name) return true
  }
  return false
}
