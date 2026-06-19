import { HISTORY_KEY, MAX_HISTORY_ITEMS, FORMAT_NAMES } from './constants.js'
import { calculateSavingsPercent } from './compressorUtils.js'

const isLocalStorageAvailable = () => {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export const safeLocalStorage = {
  getItem: (key) => {
    if (!isLocalStorageAvailable()) return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    if (!isLocalStorageAvailable()) return false
    try {
      localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  },
  removeItem: (key) => {
    if (!isLocalStorageAvailable()) return false
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
}

export const addToHistory = (item, maxItems = MAX_HISTORY_ITEMS) => {
  if (!item) return []

  const history = getHistory()
  const now = Date.now()

  const newItem = {
    id: item.id || `history_${now}`,
    name: item.name || 'unknown',
    quality: item.quality,
    scale: item.scale,
    format: item.format,
    originalSize: item.originalSize || 0,
    compressedSize: item.compressedSize || 0,
    originalWidth: item.originalWidth,
    originalHeight: item.originalHeight,
    compressedWidth: item.compressedWidth,
    compressedHeight: item.compressedHeight,
    compressedAt: item.compressedAt || new Date().toISOString(),
    lastAccessed: now,
  }

  const filtered = history.filter((h) => h.id !== newItem.id)
  const updated = [newItem, ...filtered]

  const evicted = lruEvict(updated, maxItems)
  safeLocalStorage.setItem(HISTORY_KEY, JSON.stringify(evicted))
  return evicted
}

export const addBatchToHistory = (items, maxItems = MAX_HISTORY_ITEMS) => {
  if (!Array.isArray(items) || items.length === 0) {
    return getHistory()
  }

  const history = getHistory()
  const existingIds = new Set(history.map((h) => h.id))
  const now = Date.now()

  const newItems = items
    .filter((item) => item && !existingIds.has(item.id))
    .map((item) => ({
      id: item.id || `history_${now}_${Math.random()}`,
      name: item.name || 'unknown',
      quality: item.quality,
      scale: item.scale,
      format: item.format,
      originalSize: item.originalSize || 0,
      compressedSize: item.compressedSize || 0,
      originalWidth: item.originalWidth,
      originalHeight: item.originalHeight,
      compressedWidth: item.compressedWidth,
      compressedHeight: item.compressedHeight,
      compressedAt: item.compressedAt || new Date().toISOString(),
      lastAccessed: now,
    }))

  const updated = [...newItems, ...history]
  const evicted = lruEvict(updated, maxItems)

  safeLocalStorage.setItem(HISTORY_KEY, JSON.stringify(evicted))
  return evicted
}

export const getHistory = () => {
  const stored = safeLocalStorage.getItem(HISTORY_KEY)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const removeFromHistory = (id) => {
  const history = getHistory()
  const updated = history.filter((h) => h.id !== id)
  safeLocalStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  return updated
}

export const clearHistory = () => {
  safeLocalStorage.removeItem(HISTORY_KEY)
  return []
}

export const lruEvict = (history, maxItems = MAX_HISTORY_ITEMS) => {
  if (!Array.isArray(history)) return []
  if (history.length <= maxItems) return history

  const sorted = [...history].sort((a, b) => {
    const aTime = a.lastAccessed || 0
    const bTime = b.lastAccessed || 0
    return bTime - aTime
  })

  return sorted.slice(0, maxItems)
}

export const accessHistoryItem = (id) => {
  const history = getHistory()
  const index = history.findIndex((h) => h.id === id)
  if (index === -1) return history

  const [item] = history.splice(index, 1)
  const accessedItem = {
    ...item,
    lastAccessed: Date.now(),
  }
  const updated = [accessedItem, ...history]

  safeLocalStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  return updated
}

export const formatHistoryItemDisplay = (item) => {
  if (!item) return null

  const formatName = FORMAT_NAMES[item.format] || 'UNKNOWN'
  const savingsPercent = calculateSavingsPercent(item.originalSize, item.compressedSize)

  return {
    ...item,
    formatName,
    savingsPercent,
  }
}
