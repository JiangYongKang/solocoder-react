import { DEFAULT_FLAGS, buildFlagsString } from './regexUtils'

const STORAGE_KEY = 'regex_tester_history'
const MAX_HISTORY_ITEMS = 100

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

const safeParseJSON = (str) => {
  try {
    const parsed = JSON.parse(str)
    return parsed
  } catch {
    return null
  }
}

const isBrowser = () => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export const loadHistory = () => {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = safeParseJSON(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export const saveHistory = (history) => {
  if (!isBrowser()) return false
  try {
    const arr = Array.isArray(history) ? history : []
    const toSave = arr.slice(0, MAX_HISTORY_ITEMS)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    return true
  } catch {
    return false
  }
}

export const addHistoryItem = (pattern, flags, testText, existingHistory) => {
  if (typeof pattern !== 'string' || pattern === '') {
    return Array.isArray(existingHistory) ? existingHistory : []
  }

  const history = Array.isArray(existingHistory) ? [...existingHistory] : []

  const existingIndex = history.findIndex(
    (item) =>
      item.pattern === pattern &&
      buildFlagsString(item.flags) === buildFlagsString(flags || DEFAULT_FLAGS) &&
      item.testText === testText
  )

  let newItem
  if (existingIndex >= 0) {
    newItem = {
      ...history[existingIndex],
      timestamp: Date.now(),
    }
    history.splice(existingIndex, 1)
  } else {
    newItem = {
      id: generateId(),
      pattern,
      flags: { ...DEFAULT_FLAGS, ...(flags || {}) },
      testText: typeof testText === 'string' ? testText : '',
      timestamp: Date.now(),
      favorite: false,
    }
  }

  history.unshift(newItem)

  while (history.length > MAX_HISTORY_ITEMS) {
    history.pop()
  }

  saveHistory(history)
  return history
}

export const deleteHistoryItem = (id, existingHistory) => {
  const history = Array.isArray(existingHistory) ? [...existingHistory] : []
  const filtered = history.filter((item) => item.id !== id)
  saveHistory(filtered)
  return filtered
}

export const clearHistory = (existingHistory) => {
  const history = Array.isArray(existingHistory) ? [...existingHistory] : []
  const favorites = history.filter((item) => item.favorite)
  saveHistory(favorites)
  return favorites
}

export const clearAllHistory = () => {
  saveHistory([])
  return []
}

export const toggleFavorite = (id, existingHistory) => {
  const history = Array.isArray(existingHistory) ? [...existingHistory] : []
  const idx = history.findIndex((item) => item.id === id)
  if (idx >= 0) {
    history[idx] = {
      ...history[idx],
      favorite: !history[idx].favorite,
    }
    saveHistory(history)
  }
  return history
}

export const formatTimestamp = (ts) => {
  if (typeof ts !== 'number' || isNaN(ts)) return ''
  const date = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60 * 1000) {
    return '刚刚'
  }
  if (diff < 60 * 60 * 1000) {
    const mins = Math.floor(diff / (60 * 1000))
    return `${mins} 分钟前`
  }
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours} 小时前`
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days} 天前`
  }

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}
