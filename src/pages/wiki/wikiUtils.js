import { STORAGE_KEY, getDefaultData, ROLE_LABELS } from './constants.js'

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatDate(timestamp) {
  if (timestamp == null || Number.isNaN(timestamp)) return '-'
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
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

export function loadData(storage) {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return getDefaultData()
  try {
    const raw = s.getItem(STORAGE_KEY)
    if (!raw) {
      const defaults = getDefaultData()
      saveData(defaults, s)
      return defaults
    }
    const parsed = JSON.parse(raw)
    if (!parsed.spaces || !Array.isArray(parsed.spaces) ||
        !parsed.pages || !Array.isArray(parsed.pages)) {
      return getDefaultData()
    }
    return parsed
  } catch {
    return getDefaultData()
  }
}

export function saveData(data, storage) {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return false
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function filterSpaces(spaces, keyword) {
  if (!keyword || typeof keyword !== 'string') return spaces
  const kw = keyword.trim().toLowerCase()
  if (!kw) return spaces
  return spaces.filter((s) => s.name?.toLowerCase().includes(kw))
}

export function getSpaceById(data, spaceId) {
  return data.spaces?.find((s) => s.id === spaceId) || null
}

export function getPagesBySpaceId(data, spaceId) {
  return data.pages?.filter((p) => p.spaceId === spaceId) || []
}

export function getPageCountInSpace(data, spaceId) {
  return getPagesBySpaceId(data, spaceId).length
}

export function createSpace(data, name, description) {
  if (!name || !name.trim()) return data
  const now = Date.now()
  const newSpace = {
    id: generateId('space'),
    name: name.trim(),
    description: description?.trim() || '',
    createdAt: now,
    updatedAt: now,
    members: [data.currentUserId],
  }
  return {
    ...data,
    spaces: [...data.spaces, newSpace],
  }
}

export function updateSpace(data, spaceId, updates) {
  const spaces = data.spaces.map((s) =>
    s.id === spaceId ? { ...s, ...updates, updatedAt: Date.now() } : s
  )
  return { ...data, spaces }
}

export function getDescendantPageIds(pages, pageId) {
  const ids = []
  const queue = [pageId]
  while (queue.length > 0) {
    const currentId = queue.shift()
    ids.push(currentId)
    const page = pages.find((p) => p.id === currentId)
    if (page?.children) {
      for (const childId of page.children) {
        queue.push(childId)
      }
    }
  }
  return ids
}

export function deleteSpace(data, spaceId) {
  const spacePages = getPagesBySpaceId(data, spaceId)
  const spacePageIds = new Set(spacePages.map((p) => p.id))

  const pages = data.pages.filter((p) => !spacePageIds.has(p.id))

  return {
    ...data,
    spaces: data.spaces.filter((s) => s.id !== spaceId),
    pages,
  }
}

export function getRootPages(pages, spaceId) {
  return pages.filter((p) => p.spaceId === spaceId && p.parentId === null)
}

export function getPageById(data, pageId) {
  return data.pages?.find((p) => p.id === pageId) || null
}

export function getPagePath(data, pageId) {
  const path = []
  let current = getPageById(data, pageId)
  while (current) {
    path.unshift({ id: current.id, title: current.title })
    current = current.parentId ? getPageById(data, current.parentId) : null
  }
  return path
}

export function getChildPages(data, parentId) {
  return data.pages?.filter((p) => p.parentId === parentId) || []
}

export function createPage(data, spaceId, parentId, title = '未命名页面') {
  const now = Date.now()
  const id = generateId('page')
  const newPage = {
    id,
    spaceId,
    parentId: parentId || null,
    title: title.trim(),
    content: `# ${title.trim()}\n\n在此输入内容...\n`,
    tags: [],
    children: [],
    createdAt: now,
    updatedAt: now,
    versions: [
      {
        id: generateId('v'),
        version: 1,
        title: title.trim(),
        content: `# ${title.trim()}\n\n在此输入内容...\n`,
        createdAt: now,
      },
    ],
  }

  const pages = [...data.pages, newPage]

  if (parentId) {
    const parentIndex = pages.findIndex((p) => p.id === parentId)
    if (parentIndex !== -1) {
      pages[parentIndex] = {
        ...pages[parentIndex],
        children: [...pages[parentIndex].children, id],
      }
    }
  }

  const spaces = data.spaces.map((s) =>
    s.id === spaceId ? { ...s, updatedAt: now } : s
  )

  return { ...data, pages, spaces }
}

export function updatePage(data, pageId, updates) {
  const pages = data.pages.map((p) =>
    p.id === pageId ? { ...p, ...updates, updatedAt: Date.now() } : p
  )
  return { ...data, pages }
}

export function savePageVersion(data, pageId) {
  const page = getPageById(data, pageId)
  if (!page) return data

  const now = Date.now()
  const newVersion = {
    id: generateId('v'),
    version: (page.versions?.length || 0) + 1,
    title: page.title,
    content: page.content,
    createdAt: now,
  }

  const pages = data.pages.map((p) =>
    p.id === pageId
      ? { ...p, versions: [...(p.versions || []), newVersion], updatedAt: now }
      : p
  )

  return { ...data, pages }
}

export function restoreVersion(data, pageId, versionId) {
  const page = getPageById(data, pageId)
  if (!page?.versions) return data

  const version = page.versions.find((v) => v.id === versionId)
  if (!version) return data

  return updatePage(data, pageId, {
    title: version.title,
    content: version.content,
  })
}

export function deletePage(data, pageId) {
  const page = getPageById(data, pageId)
  if (!page) return data

  const descendantIds = new Set(getDescendantPageIds(data.pages, pageId))
  const pages = data.pages.filter((p) => !descendantIds.has(p.id))

  if (page.parentId) {
    const parentIndex = pages.findIndex((p) => p.id === page.parentId)
    if (parentIndex !== -1) {
      pages[parentIndex] = {
        ...pages[parentIndex],
        children: pages[parentIndex].children.filter((id) => id !== pageId),
      }
    }
  }

  const spaces = data.spaces.map((s) =>
    s.id === page.spaceId ? { ...s, updatedAt: Date.now() } : s
  )

  return { ...data, pages, spaces }
}

export function movePage(data, pageId, newParentId) {
  const page = getPageById(data, pageId)
  if (!page) return data

  const descendantIds = getDescendantPageIds(data.pages, pageId)
  if (descendantIds.includes(newParentId)) return data

  const oldParentId = page.parentId

  const pages = data.pages.map((p) => ({ ...p }))

  const pageIndex = pages.findIndex((p) => p.id === pageId)
  if (pageIndex === -1) return data
  pages[pageIndex] = { ...pages[pageIndex], parentId: newParentId, updatedAt: Date.now() }

  if (oldParentId) {
    const oldParentIndex = pages.findIndex((p) => p.id === oldParentId)
    if (oldParentIndex !== -1) {
      pages[oldParentIndex] = {
        ...pages[oldParentIndex],
        children: pages[oldParentIndex].children.filter((id) => id !== pageId),
      }
    }
  }

  if (newParentId) {
    const newParentIndex = pages.findIndex((p) => p.id === newParentId)
    if (newParentIndex !== -1) {
      pages[newParentIndex] = {
        ...pages[newParentIndex],
        children: [...pages[newParentIndex].children, pageId],
      }
    }
  }

  return { ...data, pages }
}

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'heading'
}

export function markdownToHtml(markdown, options = {}) {
  if (typeof markdown !== 'string') return ''
  const { addHeadingIds = true } = options

  const lines = markdown.split('\n')
  const htmlParts = []
  let inCodeBlock = false
  let codeContent = []
  let codeLang = ''
  let currentList = null
  const slugCounts = {}

  const getUniqueSlug = (text) => {
    let slug = slugify(text)
    if (slugCounts[slug] != null) {
      slugCounts[slug]++
      slug = `${slug}-${slugCounts[slug]}`
    } else {
      slugCounts[slug] = 0
    }
    return slug
  }

  const renderCodeBlock = (content) => {
    const html = escapeHtml(content)
    return `<pre><code${codeLang ? ` class="language-${codeLang}"` : ''}>${html}</code></pre>`
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

    result = result.replace(/`([^`]+)`/g, (_, code) => renderInlineCode(code))

    result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" loading="lazy" />')
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

    return result
  }

  const flushList = () => {
    if (currentList) {
      htmlParts.push(`</${currentList.type}>`)
      currentList = null
    }
  }

  const processTable = (tableLines) => {
    if (tableLines.length < 2) return tableLines.map((l) => `<p>${l}</p>`)

    const headerCells = tableLines[0].split('|').map((c) => c.trim()).filter(Boolean)
    const separatorLine = tableLines[1]

    if (!/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(separatorLine.trim())) {
      return tableLines.map((l) => `<p>${l}</p>`)
    }

    let html = '<table><thead><tr>'
    for (const cell of headerCells) {
      html += `<th>${renderInlineStyles(cell)}</th>`
    }
    html += '</tr></thead><tbody>'

    for (let i = 2; i < tableLines.length; i++) {
      const cells = tableLines[i].split('|').map((c) => c.trim()).filter(Boolean)
      html += '<tr>'
      for (let j = 0; j < headerCells.length; j++) {
        html += `<td>${renderInlineStyles(cells[j] || '')}</td>`
      }
      html += '</tr>'
    }

    html += '</tbody></table>'
    return [html]
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (/^```/.test(trimmed)) {
      if (inCodeBlock) {
        htmlParts.push(renderCodeBlock(codeContent.join('\n')))
        codeContent = []
        codeLang = ''
        inCodeBlock = false
      } else {
        flushList()
        inCodeBlock = true
        codeLang = trimmed.replace(/^```/, '').trim()
      }
      i++
      continue
    }

    if (inCodeBlock) {
      codeContent.push(line)
      i++
      continue
    }

    if (trimmed.includes('|')) {
      const tableLines = [line]
      let j = i + 1
      while (j < lines.length && lines[j].trim().includes('|')) {
        tableLines.push(lines[j])
        j++
      }
      if (tableLines.length >= 2 && /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(tableLines[1].trim())) {
        flushList()
        htmlParts.push(...processTable(tableLines))
        i = j
        continue
      }
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      flushList()
      const match = trimmed.match(/^(#{1,6})\s+(.+)$/)
      const level = match[1].length
      const text = match[2].trim()
      const slug = addHeadingIds ? ` id="${getUniqueSlug(text)}"` : ''
      htmlParts.push(`<h${level}${slug}>${renderInlineStyles(text)}</h${level}>`)
      i++
      continue
    }

    if (/^>\s?/.test(trimmed)) {
      flushList()
      const content = trimmed.replace(/^>\s?/, '')
      htmlParts.push(`<blockquote>${renderInlineStyles(content)}</blockquote>`)
      i++
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s+/, '')
      if (!currentList || currentList.type !== 'ol') {
        flushList()
        htmlParts.push('<ol>')
        currentList = { type: 'ol' }
      }
      htmlParts.push(`<li>${renderInlineStyles(content)}</li>`)
      i++
      continue
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[-*+]\s+/, '')
      if (!currentList || currentList.type !== 'ul') {
        flushList()
        htmlParts.push('<ul>')
        currentList = { type: 'ul' }
      }
      htmlParts.push(`<li>${renderInlineStyles(content)}</li>`)
      i++
      continue
    }

    if (/^---+$/.test(trimmed)) {
      flushList()
      htmlParts.push('<hr />')
      i++
      continue
    }

    if (trimmed === '') {
      flushList()
      i++
      continue
    }

    flushList()
    htmlParts.push(`<p>${renderInlineStyles(line)}</p>`)
    i++
  }

  flushList()

  if (inCodeBlock) {
    htmlParts.push(renderCodeBlock(codeContent.join('\n')))
  }

  return htmlParts.join('\n')
}

export function diffContent(oldContent, newContent) {
  if (oldContent === newContent) {
    return { oldHtml: escapeHtml(oldContent), newHtml: escapeHtml(newContent) }
  }

  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')

  const tokenize = (line) => line.split(/(\s+|\b)/).filter(Boolean)

  const matchWords = (oldTokens, newTokens) => {
    const dp = Array(oldTokens.length + 1).fill(null).map(() => Array(newTokens.length + 1).fill(0))

    for (let i = 1; i <= oldTokens.length; i++) {
      for (let j = 1; j <= newTokens.length; j++) {
        if (oldTokens[i - 1] === newTokens[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        }
      }
    }

    const oldMarked = Array(oldTokens.length).fill(false)
    const newMarked = Array(newTokens.length).fill(false)

    let i = oldTokens.length
    let j = newTokens.length
    while (i > 0 && j > 0) {
      if (oldTokens[i - 1] === newTokens[j - 1]) {
        oldMarked[i - 1] = true
        newMarked[j - 1] = true
        i--
        j--
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--
      } else {
        j--
      }
    }

    return { oldMarked, newMarked }
  }

  let oldHtml = ''
  let newHtml = ''

  const maxLen = Math.max(oldLines.length, newLines.length)

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i]
    const newLine = newLines[i]

    if (oldLine === undefined) {
      newHtml += `<div class="diff-line diff-added"><span class="diff-gutter">+</span><span class="diff-content">${escapeHtml(newLine)}</span></div>`
      continue
    }
    if (newLine === undefined) {
      oldHtml += `<div class="diff-line diff-removed"><span class="diff-gutter">-</span><span class="diff-content">${escapeHtml(oldLine)}</span></div>`
      continue
    }

    if (oldLine === newLine) {
      oldHtml += `<div class="diff-line"><span class="diff-gutter"> </span><span class="diff-content">${escapeHtml(oldLine)}</span></div>`
      newHtml += `<div class="diff-line"><span class="diff-gutter"> </span><span class="diff-content">${escapeHtml(newLine)}</span></div>`
    } else {
      const oldTokens = tokenize(oldLine)
      const newTokens = tokenize(newLine)
      const { oldMarked, newMarked } = matchWords(oldTokens, newTokens)

      let oldLineHtml = '<div class="diff-line diff-removed"><span class="diff-gutter">-</span><span class="diff-content">'
      for (let k = 0; k < oldTokens.length; k++) {
        if (oldMarked[k]) {
          oldLineHtml += escapeHtml(oldTokens[k])
        } else {
          oldLineHtml += `<span class="diff-word-removed">${escapeHtml(oldTokens[k])}</span>`
        }
      }
      oldLineHtml += '</span></div>'
      oldHtml += oldLineHtml

      let newLineHtml = '<div class="diff-line diff-added"><span class="diff-gutter">+</span><span class="diff-content">'
      for (let k = 0; k < newTokens.length; k++) {
        if (newMarked[k]) {
          newLineHtml += escapeHtml(newTokens[k])
        } else {
          newLineHtml += `<span class="diff-word-added">${escapeHtml(newTokens[k])}</span>`
        }
      }
      newLineHtml += '</span></div>'
      newHtml += newLineHtml
    }
  }

  return { oldHtml, newHtml }
}

export function searchAllPages(data, keyword) {
  if (!keyword || typeof keyword !== 'string') return []
  const kw = keyword.trim().toLowerCase()
  if (!kw) return []

  const results = []

  for (const page of data.pages) {
    const titleLower = page.title?.toLowerCase() || ''
    const contentLower = page.content?.toLowerCase() || ''

    const titleMatch = titleLower.includes(kw)
    const contentMatch = contentLower.includes(kw)

    if (titleMatch || contentMatch) {
      let score = 0
      if (titleMatch) score += 10
      if (contentMatch) score += 1

      const titleOccurrences = (titleLower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      const contentOccurrences = (contentLower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      score += titleOccurrences * 5 + contentOccurrences

      let snippet
      if (contentMatch) {
        const idx = contentLower.indexOf(kw)
        const start = Math.max(0, idx - 50)
        const end = Math.min(page.content.length, idx + kw.length + 50)
        snippet = (start > 0 ? '...' : '') + page.content.slice(start, end) + (end < page.content.length ? '...' : '')
      } else {
        snippet = page.content.slice(0, 100) + (page.content.length > 100 ? '...' : '')
      }

      const space = getSpaceById(data, page.spaceId)

      results.push({
        pageId: page.id,
        title: page.title,
        spaceId: page.spaceId,
        spaceName: space?.name || '',
        snippet,
        score,
        titleMatch,
        contentMatch,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

export function highlightText(text, keyword) {
  if (!keyword || !text) return text
  const kw = keyword.trim()
  if (!kw) return text
  const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '|||HIGHLIGHT|||$1|||/HIGHLIGHT|||')
}

export function highlightTextSafe(text, keyword) {
  if (!keyword || !text) return escapeHtml(text)
  const escapedText = escapeHtml(text)
  const escapedQuery = escapeHtml(keyword.trim())
  if (!escapedQuery) return escapedText
  const escapedRegexQuery = escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedRegexQuery})`, 'gi')
  return escapedText.replace(regex, '<span class="highlight">$1</span>')
}

export function addTagToPage(data, pageId, tag) {
  const page = getPageById(data, pageId)
  if (!page) return data

  const trimmedTag = tag.trim()
  if (!trimmedTag) return data
  if (page.tags?.includes(trimmedTag)) return data

  return updatePage(data, pageId, {
    tags: [...(page.tags || []), trimmedTag],
  })
}

export function removeTagFromPage(data, pageId, tag) {
  const page = getPageById(data, pageId)
  if (!page) return data

  return updatePage(data, pageId, {
    tags: (page.tags || []).filter((t) => t !== tag),
  })
}

export function getAllTagsInSpace(data, spaceId) {
  const tagCount = {}
  const pages = getPagesBySpaceId(data, spaceId)

  for (const page of pages) {
    for (const tag of page.tags || []) {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    }
  }

  return Object.entries(tagCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function getTagCloudSize(count, maxCount) {
  if (maxCount <= 0) return 1
  const ratio = count / maxCount
  if (ratio >= 0.8) return 1.5
  if (ratio >= 0.5) return 1.3
  if (ratio >= 0.3) return 1.1
  if (ratio > 0.1) return 0.95
  return 0.85
}

export function filterPagesByTag(data, spaceId, tag) {
  const pages = getPagesBySpaceId(data, spaceId)
  if (!tag) return pages
  return pages.filter((p) => p.tags?.includes(tag))
}

export function getSpaceMembers(data, spaceId) {
  const space = getSpaceById(data, spaceId)
  if (!space?.members) return []

  return space.members
    .map((memberId) => data.members?.find((m) => m.id === memberId))
    .filter(Boolean)
    .map((m) => ({
      ...m,
      roleLabel: ROLE_LABELS[m.role] || m.role,
      joinedAtLabel: formatDate(m.joinedAt),
    }))
}

export function addMemberToSpace(data, spaceId, memberId) {
  const space = getSpaceById(data, spaceId)
  if (!space) return data
  if (space.members?.includes(memberId)) return data

  return updateSpace(data, spaceId, {
    members: [...(space.members || []), memberId],
  })
}

export function removeMemberFromSpace(data, spaceId, memberId) {
  const space = getSpaceById(data, spaceId)
  if (!space) return data

  return updateSpace(data, spaceId, {
    members: (space.members || []).filter((id) => id !== memberId),
  })
}

export function getCurrentUser(data) {
  return data.members?.find((m) => m.id === data.currentUserId) || null
}

export function isPageDescendant(data, ancestorId, descendantId) {
  if (ancestorId === descendantId) return false
  let current = getPageById(data, descendantId)
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true
    current = getPageById(data, current.parentId)
  }
  return false
}
