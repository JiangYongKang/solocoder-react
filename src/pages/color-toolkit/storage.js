const STORAGE_KEY = 'color-toolkit-favorites'

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined'

const safeParseJSON = (str) => {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

const generateId = () => {
  return `fav_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

export const loadFavorites = (storage = isBrowser() ? localStorage : null) => {
  if (!storage) return []

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = safeParseJSON(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.map((item) => ({
      id: item.id || generateId(),
      hex: item.hex || '',
      source: item.source || '',
      createdAt: item.createdAt || Date.now(),
      order: item.order ?? 0,
    }))
  } catch {
    return []
  }
}

export const saveFavorites = (favorites, storage = isBrowser() ? localStorage : null) => {
  if (!storage) return

  try {
    const data = Array.isArray(favorites) ? favorites : []
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // no-op
  }
}

export const addFavorite = (hex, source, favorites = []) => {
  const exists = favorites.some((f) => f.hex.toUpperCase() === hex.toUpperCase())
  if (exists) return { favorites, added: false }

  const newFavorite = {
    id: generateId(),
    hex: hex.toUpperCase(),
    source: source || '',
    createdAt: Date.now(),
    order: favorites.length,
  }

  return {
    favorites: [...favorites, newFavorite],
    added: true,
    newFavorite,
  }
}

export const deleteFavorite = (id, favorites = []) => {
  return favorites.filter((f) => f.id !== id)
}

export const clearFavorites = () => {
  return []
}

export const reorderFavorites = (favorites, fromIndex, toIndex) => {
  if (!Array.isArray(favorites) || favorites.length < 2) return favorites
  if (fromIndex < 0 || fromIndex >= favorites.length) return favorites
  if (toIndex < 0 || toIndex >= favorites.length) return favorites
  if (fromIndex === toIndex) return favorites

  const result = [...favorites]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)

  return result.map((item, index) => ({
    ...item,
    order: index,
  }))
}

export const isFavorite = (hex, favorites = []) => {
  return favorites.some((f) => f.hex.toUpperCase() === hex.toUpperCase())
}

export const exportFavoritesToJSON = (favorites = []) => {
  const data = favorites.map(({ id, hex, source, createdAt }) => ({
    id,
    hex,
    source,
    createdAt,
  }))
  return JSON.stringify(data, null, 2)
}

export const downloadFavorites = (favorites = [], filename = 'color-favorites.json') => {
  if (!isBrowser()) return

  const json = exportFavoritesToJSON(favorites)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const copyAllHex = (favorites = []) => {
  const hexes = favorites.map((f) => f.hex).join(', ')
  return hexes
}

export const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
