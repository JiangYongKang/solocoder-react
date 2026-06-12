import { STORAGE_KEY, MAX_HISTORY_ITEMS } from './constants'

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

export const addHistoryItem = (itemData, existingHistory) => {
  if (!itemData || typeof itemData.jsonText !== 'string' || itemData.jsonText.trim() === '') {
    return Array.isArray(existingHistory) ? existingHistory : []
  }

  const history = Array.isArray(existingHistory) ? [...existingHistory] : []

  const existingIndex = history.findIndex(
    (item) =>
      item.jsonText === itemData.jsonText &&
      item.rootName === itemData.rootName
  )

  let newItem
  if (existingIndex >= 0) {
    newItem = {
      ...history[existingIndex],
      timestamp: Date.now(),
      generatedCode: itemData.generatedCode,
      summary: itemData.summary,
    }
    history.splice(existingIndex, 1)
  } else {
    newItem = {
      id: generateId(),
      jsonText: itemData.jsonText,
      rootName: itemData.rootName || 'RootType',
      generatedCode: itemData.generatedCode || '',
      summary: itemData.summary || '',
      timestamp: Date.now(),
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

export const clearAllHistory = () => {
  saveHistory([])
  return []
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

  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}
