export const STORAGE_KEY = 'knowledge-base-data'
export const RECENT_LIMIT = 20

export const DEFAULT_CATEGORIES = [
  {
    id: 'cat-root',
    name: '知识库',
    parentId: null,
    children: ['cat-1', 'cat-2'],
    isExpanded: true,
  },
  {
    id: 'cat-1',
    name: '技术',
    parentId: 'cat-root',
    children: ['cat-1-1', 'cat-1-2'],
    isExpanded: true,
  },
  {
    id: 'cat-1-1',
    name: '前端',
    parentId: 'cat-1',
    children: ['cat-1-1-1'],
    isExpanded: false,
  },
  {
    id: 'cat-1-1-1',
    name: 'React',
    parentId: 'cat-1-1',
    children: [],
    isExpanded: false,
  },
  {
    id: 'cat-1-2',
    name: '后端',
    parentId: 'cat-1',
    children: [],
    isExpanded: false,
  },
  {
    id: 'cat-2',
    name: '产品',
    parentId: 'cat-root',
    children: [],
    isExpanded: false,
  },
]

export const DEFAULT_ARTICLES = [
  {
    id: 'art-1',
    title: 'React Hooks 入门指南',
    content: `# React Hooks 入门指南

## 什么是 Hooks

Hooks 是 React 16.8 引入的新特性，让你在不编写 class 的情况下使用 state 以及其他的 React 特性。

## useState

\`useState\` 是最基础的 Hook，用于在函数组件中添加状态。

\`\`\`js
const [count, setCount] = useState(0)
\`\`\`

## useEffect

\`useEffect\` 用于处理副作用，例如数据获取、订阅等。

## 总结

- Hooks 让函数组件拥有了类组件的能力
- useState 管理本地状态
- useEffect 处理副作用
`,
    categoryId: 'cat-1-1-1',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 2,
    isFavorite: true,
  },
  {
    id: 'art-2',
    title: '产品需求文档写作规范',
    content: `# 产品需求文档写作规范

## 文档结构

1. 项目背景
2. 用户画像
3. 功能说明
4. 交互流程
5. 非功能需求

## 注意事项

- 语言简洁明了
- 图文结合
- 可测试性
`,
    categoryId: 'cat-2',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: false,
  },
]

export const generateId = (prefix = 'id') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const createInitialState = () => ({
  categories: DEFAULT_CATEGORIES,
  articles: DEFAULT_ARTICLES,
  favorites: DEFAULT_ARTICLES.filter((a) => a.isFavorite).map((a) => a.id),
  recent: [],
})

export const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.categories && parsed.articles) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  const initial = createInitialState()
  saveData(initial)
  return initial
}

export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export const findCategoryById = (categories, id) => {
  return categories.find((c) => c.id === id) || null
}

export const findArticleById = (articles, id) => {
  return articles.find((a) => a.id === id) || null
}

export const getCategoryPath = (categories, categoryId) => {
  const path = []
  let current = findCategoryById(categories, categoryId)
  while (current) {
    path.unshift({ id: current.id, name: current.name })
    current = current.parentId ? findCategoryById(categories, current.parentId) : null
  }
  return path
}

export const getChildCategories = (categories, parentId) => {
  return categories.filter((c) => c.parentId === parentId)
}

export const getArticlesByCategory = (articles, categoryId) => {
  return articles.filter((a) => a.categoryId === categoryId)
}

export const createCategory = (data, parentId, name) => {
  const now = Date.now()
  const id = generateId('cat')
  const newCategory = {
    id,
    name,
    parentId,
    children: [],
    isExpanded: true,
    createdAt: now,
    updatedAt: now,
  }
  const categories = [...data.categories, newCategory]
  if (parentId) {
    const parentIndex = categories.findIndex((c) => c.id === parentId)
    if (parentIndex !== -1) {
      categories[parentIndex] = {
        ...categories[parentIndex],
        children: [...categories[parentIndex].children, id],
        isExpanded: true,
      }
    }
  }
  return { ...data, categories }
}

export const renameCategory = (data, categoryId, newName) => {
  const categories = data.categories.map((c) =>
    c.id === categoryId ? { ...c, name: newName, updatedAt: Date.now() } : c
  )
  return { ...data, categories }
}

export const getDescendantCategoryIds = (categories, categoryId) => {
  const ids = []
  const queue = [categoryId]
  while (queue.length > 0) {
    const currentId = queue.shift()
    ids.push(currentId)
    const children = categories.filter((c) => c.parentId === currentId)
    for (const child of children) {
      queue.push(child.id)
    }
  }
  return ids
}

export const deleteCategory = (data, categoryId) => {
  if (categoryId === 'cat-root') return data
  const descendantIds = new Set(getDescendantCategoryIds(data.categories, categoryId))
  const categories = data.categories.filter((c) => !descendantIds.has(c.id))
  const parentIndex = categories.findIndex((c) => c.id === data.categories.find((x) => x.id === categoryId)?.parentId)
  if (parentIndex !== -1) {
    categories[parentIndex] = {
      ...categories[parentIndex],
      children: categories[parentIndex].children.filter((id) => id !== categoryId),
    }
  }
  const articles = data.articles.filter((a) => !descendantIds.has(a.categoryId))
  const favorites = data.favorites.filter((id) => articles.some((a) => a.id === id))
  const recent = data.recent.filter((id) => articles.some((a) => a.id === id))
  return { ...data, categories, articles, favorites, recent }
}

export const toggleCategoryExpand = (data, categoryId) => {
  const categories = data.categories.map((c) =>
    c.id === categoryId ? { ...c, isExpanded: !c.isExpanded } : c
  )
  return { ...data, categories }
}

export const isDescendantCategory = (categories, ancestorId, descendantId) => {
  let current = findCategoryById(categories, descendantId)
  while (current && current.parentId) {
    if (current.parentId === ancestorId) return true
    current = findCategoryById(categories, current.parentId)
  }
  return false
}

export const moveCategory = (data, sourceId, targetId, position = 'inside') => {
  if (sourceId === targetId) return data
  if (isDescendantCategory(data.categories, sourceId, targetId)) return data
  if (targetId !== 'cat-root' && !findCategoryById(data.categories, targetId)) return data

  const effectivePosition = targetId === 'cat-root' ? 'inside' : position

  let categories = [...data.categories.map((c) => ({ ...c }))]

  const sourceIndex = categories.findIndex((c) => c.id === sourceId)
  if (sourceIndex === -1) return data
  const source = categories[sourceIndex]
  const oldParentId = source.parentId

  const newParentId = effectivePosition === 'inside'
    ? targetId
    : (findCategoryById(categories, targetId)?.parentId || 'cat-root')
  source.parentId = newParentId

  if (oldParentId) {
    const oldParentIndex = categories.findIndex((c) => c.id === oldParentId)
    if (oldParentIndex !== -1) {
      categories[oldParentIndex] = {
        ...categories[oldParentIndex],
        children: categories[oldParentIndex].children.filter((id) => id !== sourceId),
      }
    }
  }

  if (effectivePosition === 'inside') {
    const newParentIndex = categories.findIndex((c) => c.id === newParentId)
    if (newParentIndex !== -1) {
      categories[newParentIndex] = {
        ...categories[newParentIndex],
        children: [...categories[newParentIndex].children.filter((id) => id !== sourceId), sourceId],
        isExpanded: true,
      }
    }
  } else {
    const parentIndex = categories.findIndex((c) => c.id === newParentId)
    if (parentIndex !== -1) {
      const siblings = categories[parentIndex].children.filter((id) => id !== sourceId)
      const targetIdx = siblings.indexOf(targetId)
      if (targetIdx === -1) {
        if (effectivePosition === 'before') {
          siblings.unshift(sourceId)
        } else {
          siblings.push(sourceId)
        }
      } else {
        if (effectivePosition === 'before') {
          siblings.splice(targetIdx, 0, sourceId)
        } else {
          siblings.splice(targetIdx + 1, 0, sourceId)
        }
      }
      categories[parentIndex] = {
        ...categories[parentIndex],
        children: siblings,
      }
    }
  }

  return { ...data, categories }
}

export const createArticle = (data, categoryId, title = '未命名文章') => {
  const now = Date.now()
  const id = generateId('art')
  const newArticle = {
    id,
    title,
    content: `# ${title}\n\n在此输入内容...\n`,
    categoryId,
    createdAt: now,
    updatedAt: now,
    isFavorite: false,
  }
  return { ...data, articles: [...data.articles, newArticle] }
}

export const updateArticle = (data, articleId, updates) => {
  const articles = data.articles.map((a) =>
    a.id === articleId ? { ...a, ...updates, updatedAt: Date.now() } : a
  )
  return { ...data, articles }
}

export const deleteArticle = (data, articleId) => {
  const articles = data.articles.filter((a) => a.id !== articleId)
  const favorites = data.favorites.filter((id) => id !== articleId)
  const recent = data.recent.filter((id) => id !== articleId)
  return { ...data, articles, favorites, recent }
}

export const toggleFavorite = (data, articleId) => {
  const isFav = data.favorites.includes(articleId)
  const favorites = isFav
    ? data.favorites.filter((id) => id !== articleId)
    : [...data.favorites, articleId]
  const articles = data.articles.map((a) =>
    a.id === articleId ? { ...a, isFavorite: !isFav } : a
  )
  return { ...data, favorites, articles }
}

export const addRecent = (data, articleId) => {
  let recent = data.recent.filter((id) => id !== articleId)
  recent.unshift(articleId)
  if (recent.length > RECENT_LIMIT) {
    recent = recent.slice(0, RECENT_LIMIT)
  }
  return { ...data, recent }
}

export const searchArticles = (articles, keyword) => {
  if (!keyword || typeof keyword !== 'string') return []
  const kw = keyword.trim().toLowerCase()
  if (!kw) return []
  return articles.filter((a) => {
    const titleMatch = a.title?.toLowerCase().includes(kw)
    const contentMatch = a.content?.toLowerCase().includes(kw)
    return titleMatch || contentMatch
  })
}

export const highlightText = (text, keyword) => {
  if (!keyword || !text) return text
  const kw = keyword.trim()
  if (!kw) return text
  const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '|||HIGHLIGHT|||$1|||/HIGHLIGHT|||')
}

export const sortArticles = (articles, sortBy = 'time', sortOrder = 'desc', categories = []) => {
  const sorted = [...articles]
  const multiplier = sortOrder === 'asc' ? 1 : -1
  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'category': {
        const pathA = getCategoryPath(categories, a.categoryId).map((p) => p.name).join('/')
        const pathB = getCategoryPath(categories, b.categoryId).map((p) => p.name).join('/')
        return pathA.localeCompare(pathB, 'zh-CN') * multiplier
      }
      case 'title':
        return a.title.localeCompare(b.title, 'zh-CN') * multiplier
      case 'time':
      default:
        return (a.updatedAt - b.updatedAt) * multiplier
    }
  })
  return sorted
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

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'heading'
}

export const extractTOC = (markdown) => {
  if (!markdown || typeof markdown !== 'string') return []
  const lines = markdown.split('\n')
  const toc = []
  const slugCounts = {}
  let inCodeBlock = false

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      let slug = slugify(text)
      if (slugCounts[slug] != null) {
        slugCounts[slug]++
        slug = `${slug}-${slugCounts[slug]}`
      } else {
        slugCounts[slug] = 0
      }
      toc.push({ level, text, slug })
    }
  }
  return toc
}

export const markdownToHtml = (markdown, options = {}) => {
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
    result = result.replace(/<u>([^<]+)<\/u>/g, '<u>$1</u>')

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

  for (let i = 0; i < lines.length; i++) {
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
      continue
    }

    if (inCodeBlock) {
      codeContent.push(line)
      continue
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      flushList()
      const match = trimmed.match(/^(#{1,6})\s+(.+)$/)
      const level = match[1].length
      const text = match[2].trim()
      const slug = addHeadingIds ? ` id="${getUniqueSlug(text)}"` : ''
      htmlParts.push(`<h${level}${slug}>${renderInlineStyles(text)}</h${level}>`)
      continue
    }

    if (/^>\s?/.test(trimmed)) {
      flushList()
      const content = trimmed.replace(/^>\s?/, '')
      htmlParts.push(`<blockquote>${renderInlineStyles(content)}</blockquote>`)
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
      continue
    }

    if (/^---+$/.test(trimmed)) {
      flushList()
      htmlParts.push('<hr />')
      continue
    }

    if (trimmed === '') {
      flushList()
      continue
    }

    flushList()
    htmlParts.push(`<p>${renderInlineStyles(line)}</p>`)
  }

  flushList()

  if (inCodeBlock) {
    htmlParts.push(renderCodeBlock(codeContent.join('\n')))
  }

  return htmlParts.join('\n')
}

export const formatDate = (timestamp) => {
  if (timestamp == null || Number.isNaN(timestamp)) return '-'
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
