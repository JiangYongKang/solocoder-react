import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  loadFavorites,
  saveFavorites,
  addFavorite,
  deleteFavorite,
  clearFavorites,
  reorderFavorites,
  isFavorite,
  exportFavoritesToJSON,
  copyAllHex,
  formatDate,
} from '../../color-toolkit/storage.js'

const createMockStorage = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    _store: store,
  }
}

let mockLocalStorage

beforeEach(() => {
  mockLocalStorage = createMockStorage()
})

afterEach(() => {
  mockLocalStorage.clear()
})

describe('loadFavorites', () => {
  it('should return empty array when no data in storage', () => {
    expect(loadFavorites(mockLocalStorage)).toEqual([])
  })

  it('should load saved favorites from storage', () => {
    const testData = [
      { id: '1', hex: '#FF0000', source: 'test', createdAt: 1234567890, order: 0 },
    ]
    mockLocalStorage.setItem('color-toolkit-favorites', JSON.stringify(testData))

    const loaded = loadFavorites(mockLocalStorage)
    expect(loaded).toEqual(testData)
  })

  it('should return empty array for invalid JSON', () => {
    mockLocalStorage.setItem('color-toolkit-favorites', 'invalid json')
    expect(loadFavorites(mockLocalStorage)).toEqual([])
  })

  it('should return empty array for non-array data', () => {
    mockLocalStorage.setItem('color-toolkit-favorites', '{"not":"array"}')
    expect(loadFavorites(mockLocalStorage)).toEqual([])
  })

  it('should return empty array when storage is null', () => {
    expect(loadFavorites(null)).toEqual([])
  })

  it('should generate id for items without id', () => {
    const testData = [{ hex: '#FF0000', source: 'test' }]
    mockLocalStorage.setItem('color-toolkit-favorites', JSON.stringify(testData))

    const loaded = loadFavorites(mockLocalStorage)
    expect(loaded[0].id).toBeTruthy()
    expect(loaded[0].hex).toBe('#FF0000')
  })
})

describe('saveFavorites', () => {
  it('should save favorites to storage', () => {
    const favorites = [{ id: '1', hex: '#FF0000', source: 'test', createdAt: 1234567890, order: 0 }]
    saveFavorites(favorites, mockLocalStorage)

    const saved = JSON.parse(mockLocalStorage.getItem('color-toolkit-favorites'))
    expect(saved).toEqual(favorites)
  })

  it('should not throw when storage is null', () => {
    expect(() => saveFavorites([], null)).not.toThrow()
  })

  it('should save empty array for non-array input', () => {
    saveFavorites('not array', mockLocalStorage)
    const saved = JSON.parse(mockLocalStorage.getItem('color-toolkit-favorites'))
    expect(saved).toEqual([])
  })
})

describe('addFavorite', () => {
  it('should add new favorite', () => {
    const { favorites, added, newFavorite } = addFavorite('#FF0000', '调色板生成', [])

    expect(added).toBe(true)
    expect(favorites.length).toBe(1)
    expect(newFavorite.hex).toBe('#FF0000')
    expect(newFavorite.source).toBe('调色板生成')
    expect(newFavorite.id).toBeTruthy()
    expect(newFavorite.createdAt).toBeTruthy()
  })

  it('should not add duplicate colors', () => {
    const existing = [{ id: '1', hex: '#FF0000', source: 'test', createdAt: 123, order: 0 }]
    const { favorites, added } = addFavorite('#ff0000', 'test', existing)

    expect(added).toBe(false)
    expect(favorites.length).toBe(1)
    expect(favorites).toBe(existing)
  })

  it('should normalize hex to uppercase', () => {
    const { newFavorite } = addFavorite('#ff0000', 'test', [])
    expect(newFavorite.hex).toBe('#FF0000')
  })

  it('should set default source when not provided', () => {
    const { newFavorite } = addFavorite('#FF0000', '', [])
    expect(newFavorite.source).toBe('')
  })

  it('should use empty array as default for favorites', () => {
    const result = addFavorite('#FF0000', 'test')
    expect(result.favorites.length).toBe(1)
  })
})

describe('deleteFavorite', () => {
  it('should delete favorite by id', () => {
    const favorites = [
      { id: '1', hex: '#FF0000' },
      { id: '2', hex: '#00FF00' },
      { id: '3', hex: '#0000FF' },
    ]

    const result = deleteFavorite('2', favorites)
    expect(result.length).toBe(2)
    expect(result.find((f) => f.id === '2')).toBeUndefined()
  })

  it('should not throw when deleting non-existent id', () => {
    const favorites = [{ id: '1', hex: '#FF0000' }]
    const result = deleteFavorite('999', favorites)
    expect(result.length).toBe(1)
  })

  it('should use empty array as default', () => {
    const result = deleteFavorite('1')
    expect(result).toEqual([])
  })
})

describe('clearFavorites', () => {
  it('should return empty array', () => {
    expect(clearFavorites()).toEqual([])
  })
})

describe('reorderFavorites', () => {
  it('should reorder favorites correctly', () => {
    const favorites = [
      { id: '1', hex: '#FF0000', order: 0 },
      { id: '2', hex: '#00FF00', order: 1 },
      { id: '3', hex: '#0000FF', order: 2 },
    ]

    const result = reorderFavorites(favorites, 0, 2)
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('3')
    expect(result[2].id).toBe('1')
  })

  it('should update order property', () => {
    const favorites = [
      { id: '1', hex: '#FF0000', order: 0 },
      { id: '2', hex: '#00FF00', order: 1 },
    ]

    const result = reorderFavorites(favorites, 0, 1)
    expect(result[0].order).toBe(0)
    expect(result[1].order).toBe(1)
  })

  it('should return same array when fromIndex equals toIndex', () => {
    const favorites = [
      { id: '1', hex: '#FF0000', order: 0 },
      { id: '2', hex: '#00FF00', order: 1 },
    ]

    const result = reorderFavorites(favorites, 1, 1)
    expect(result).toBe(favorites)
  })

  it('should handle invalid indices gracefully', () => {
    const favorites = [
      { id: '1', hex: '#FF0000', order: 0 },
      { id: '2', hex: '#00FF00', order: 1 },
    ]

    expect(reorderFavorites(favorites, -1, 1)).toBe(favorites)
    expect(reorderFavorites(favorites, 0, 999)).toBe(favorites)
  })

  it('should return original for non-array or single element', () => {
    expect(reorderFavorites([], 0, 1)).toEqual([])
    expect(reorderFavorites([{ id: '1' }], 0, 1)).toEqual([{ id: '1' }])
  })

  it('should not mutate original array', () => {
    const favorites = [
      { id: '1', hex: '#FF0000', order: 0 },
      { id: '2', hex: '#00FF00', order: 1 },
    ]
    const originalCopy = [...favorites]

    reorderFavorites(favorites, 0, 1)
    expect(favorites).toEqual(originalCopy)
  })
})

describe('isFavorite', () => {
  it('should return true when color is in favorites', () => {
    const favorites = [{ id: '1', hex: '#FF0000' }]
    expect(isFavorite('#FF0000', favorites)).toBe(true)
    expect(isFavorite('#ff0000', favorites)).toBe(true)
  })

  it('should return false when color is not in favorites', () => {
    const favorites = [{ id: '1', hex: '#FF0000' }]
    expect(isFavorite('#00FF00', favorites)).toBe(false)
  })

  it('should use empty array as default', () => {
    expect(isFavorite('#FF0000')).toBe(false)
  })
})

describe('exportFavoritesToJSON', () => {
  it('should export favorites as formatted JSON', () => {
    const favorites = [
      { id: '1', hex: '#FF0000', source: 'test', createdAt: 1234567890, order: 0 },
    ]

    const json = exportFavoritesToJSON(favorites)
    const parsed = JSON.parse(json)

    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed[0].hex).toBe('#FF0000')
    expect(parsed[0].order).toBeUndefined()
  })

  it('should handle empty array', () => {
    const json = exportFavoritesToJSON([])
    expect(JSON.parse(json)).toEqual([])
  })
})

describe('copyAllHex', () => {
  it('should join all hex values with comma', () => {
    const favorites = [
      { hex: '#FF0000' },
      { hex: '#00FF00' },
      { hex: '#0000FF' },
    ]

    expect(copyAllHex(favorites)).toBe('#FF0000, #00FF00, #0000FF')
  })

  it('should return empty string for empty array', () => {
    expect(copyAllHex([])).toBe('')
  })
})

describe('formatDate', () => {
  it('should format timestamp to locale string', () => {
    const timestamp = new Date('2024-01-15T10:30:00').getTime()
    const formatted = formatDate(timestamp)

    expect(typeof formatted).toBe('string')
    expect(formatted.length).toBeGreaterThan(0)
  })
})
