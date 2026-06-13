import { STORAGE_KEYS, MAX_SNIPPETS, MAX_HISTORY } from './constants'

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export const loadSnippets = () => {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEYS.SNIPPETS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export const saveSnippets = (snippets) => {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem(STORAGE_KEYS.SNIPPETS, JSON.stringify(snippets))
    return true
  } catch {
    return false
  }
}

export const createSnippet = ({ name, language, code }) => {
  const now = Date.now()
  const lineCount = code ? code.split('\n').length : 0
  return {
    id: generateId(),
    name: name || '未命名片段',
    language,
    code: code || '',
    lineCount,
    createdAt: now,
    updatedAt: now,
  }
}

export const addSnippet = (snippets, snippet) => {
  const newList = [snippet, ...snippets]
  if (newList.length > MAX_SNIPPETS) {
    return newList.slice(0, MAX_SNIPPETS)
  }
  return newList
}

export const updateSnippet = (snippets, id, data) => {
  return snippets.map((s) => {
    if (s.id !== id) return s
    const lineCount = data.code !== undefined ? (data.code || '').split('\n').length : s.lineCount
    return {
      ...s,
      ...data,
      lineCount,
      updatedAt: Date.now(),
    }
  })
}

export const renameSnippet = (snippets, id, newName) => {
  return updateSnippet(snippets, id, { name: newName })
}

export const deleteSnippet = (snippets, id) => {
  return snippets.filter((s) => s.id !== id)
}

export const loadHistory = () => {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export const saveHistory = (history) => {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history))
    return true
  } catch {
    return false
  }
}

export const createHistoryItem = ({ language, code, duration, success, error }) => {
  return {
    id: generateId(),
    language,
    code: code || '',
    duration: duration || 0,
    success: !!success,
    error: error || null,
    timestamp: Date.now(),
  }
}

export const addHistoryItem = (history, item) => {
  const newList = [item, ...history]
  if (newList.length > MAX_HISTORY) {
    return newList.slice(0, MAX_HISTORY)
  }
  return newList
}

export const clearHistory = () => {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.removeItem(STORAGE_KEYS.HISTORY)
    return true
  } catch {
    return false
  }
}

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export const truncateCode = (code, maxLen = 50) => {
  if (typeof code !== 'string') return ''
  const clean = code.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLen) return clean
  return clean.slice(0, maxLen) + '...'
}

export const countLines = (code) => {
  if (typeof code !== 'string') return 0
  if (code === '') return 0
  return code.split('\n').length
}
