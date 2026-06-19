
const STORAGE_KEY = 'text-diff-history'
const MAX_HISTORY = 10

export const loadHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, MAX_HISTORY)
  } catch {
    return []
  }
}

export const saveHistory = (history) => {
  try {
    const limited = Array.isArray(history) ? history.slice(0, MAX_HISTORY) : []
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
  } catch {
    // ignore
  }
}

export const addHistoryItem = (item) => {
  const history = loadHistory()
  const newItem = {
    id: Date.now().toString(),
    titleA: item?.titleA || '文本 A',
    titleB: item?.titleB || '文本 B',
    textA: item?.textA || '',
    textB: item?.textB || '',
    timestamp: Date.now(),
  }

  const filtered = history.filter(
    (h) => !(h.textA === newItem.textA && h.textB === newItem.textB)
  )

  filtered.unshift(newItem)
  saveHistory(filtered)
  return filtered.slice(0, MAX_HISTORY)
}

export const removeHistoryItem = (id) => {
  const history = loadHistory()
  const filtered = history.filter((h) => h.id !== id)
  saveHistory(filtered)
  return filtered
}

export const clearHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  return []
}
