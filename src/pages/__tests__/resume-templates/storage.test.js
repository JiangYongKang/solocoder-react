import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadResumeState,
  saveResumeState,
  clearResumeState,
  loadFavorites,
  saveFavorites,
  clearFavorites,
  loadRatings,
  saveRatings,
  clearRatings,
  clearAllStorage,
} from '../../resume-templates/storage'
import { createDefaultResumeState } from '../../resume-templates/resumeTemplatesCore'

function createMockLocalStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value))
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    _getStore: () => store,
  }
}

describe('storage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  describe('resume state storage', () => {
    it('loadResumeState should return default when nothing stored', () => {
      const result = loadResumeState()
      expect(result.selectedTemplateId).toBeDefined()
      expect(Array.isArray(result.modules)).toBe(true)
    })

    it('saveResumeState and loadResumeState should persist data', () => {
      const state = createDefaultResumeState()
      state.selectedTemplateId = 'dark'
      expect(saveResumeState(state)).toBe(true)
      const loaded = loadResumeState()
      expect(loaded.selectedTemplateId).toBe('dark')
    })

    it('loadResumeState should return default for invalid JSON', () => {
      mockStorage.setItem('resume-templates-state', 'not json')
      const result = loadResumeState()
      expect(result.selectedTemplateId).toBeDefined()
      expect(Array.isArray(result.modules)).toBe(true)
    })

    it('loadResumeState should return default for missing fields', () => {
      mockStorage.setItem('resume-templates-state', JSON.stringify({ foo: 1 }))
      const result = loadResumeState()
      expect(result.selectedTemplateId).toBeDefined()
    })

    it('clearResumeState should remove data', () => {
      const state = createDefaultResumeState()
      saveResumeState(state)
      expect(clearResumeState()).toBe(true)
      expect(mockStorage.getItem('resume-templates-state')).toBe(null)
    })

    it('should handle localStorage throws gracefully', () => {
      vi.stubGlobal('window', {
        localStorage: {
          getItem: () => {
            throw new Error('fail')
          },
          setItem: () => {
            throw new Error('fail')
          },
          removeItem: () => {
            throw new Error('fail')
          },
        },
      })
      const defaultState = loadResumeState()
      expect(defaultState.modules).toBeDefined()
      expect(saveResumeState({})).toBe(false)
      expect(clearResumeState()).toBe(false)
    })
  })

  describe('favorites storage', () => {
    it('loadFavorites should return empty object when nothing stored', () => {
      expect(loadFavorites()).toEqual({})
    })

    it('saveFavorites and loadFavorites should persist data', () => {
      const favorites = { tpl1: true, tpl2: true }
      expect(saveFavorites(favorites)).toBe(true)
      const loaded = loadFavorites()
      expect(loaded).toEqual(favorites)
    })

    it('loadFavorites should return empty object for invalid JSON', () => {
      mockStorage.setItem('resume-templates-favorites', 'not json')
      expect(loadFavorites()).toEqual({})
    })

    it('clearFavorites should remove data', () => {
      saveFavorites({ tpl1: true })
      expect(clearFavorites()).toBe(true)
      expect(mockStorage.getItem('resume-templates-favorites')).toBe(null)
    })
  })

  describe('ratings storage', () => {
    it('loadRatings should return empty object when nothing stored', () => {
      expect(loadRatings()).toEqual({})
    })

    it('saveRatings and loadRatings should persist data', () => {
      const ratings = { tpl1: 4, tpl2: 5 }
      expect(saveRatings(ratings)).toBe(true)
      const loaded = loadRatings()
      expect(loaded).toEqual(ratings)
    })

    it('loadRatings should return empty object for invalid JSON', () => {
      mockStorage.setItem('resume-templates-ratings', 'not json')
      expect(loadRatings()).toEqual({})
    })

    it('clearRatings should remove data', () => {
      saveRatings({ tpl1: 4 })
      expect(clearRatings()).toBe(true)
      expect(mockStorage.getItem('resume-templates-ratings')).toBe(null)
    })
  })

  describe('clearAllStorage', () => {
    it('should clear all storage items', () => {
      saveResumeState(createDefaultResumeState())
      saveFavorites({ tpl1: true })
      saveRatings({ tpl1: 4 })
      expect(clearAllStorage()).toBe(true)
      expect(mockStorage.getItem('resume-templates-state')).toBe(null)
      expect(mockStorage.getItem('resume-templates-favorites')).toBe(null)
      expect(mockStorage.getItem('resume-templates-ratings')).toBe(null)
    })
  })

  describe('no window environment', () => {
    it('should handle missing window gracefully', () => {
      vi.stubGlobal('window', undefined)
      expect(Array.isArray(loadResumeState().modules)).toBe(true)
      expect(saveResumeState({})).toBe(false)
      expect(clearResumeState()).toBe(false)
      expect(loadFavorites()).toEqual({})
      expect(saveFavorites({})).toBe(false)
      expect(clearFavorites()).toBe(false)
      expect(loadRatings()).toEqual({})
      expect(saveRatings({})).toBe(false)
      expect(clearRatings()).toBe(false)
      expect(clearAllStorage()).toBe(false)
    })
  })
})
