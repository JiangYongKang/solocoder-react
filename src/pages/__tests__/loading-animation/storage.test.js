import { createAnimationConfig } from '@/pages/loading-animation/loadingAnimationCore.js'
import {
    addToSaved,
    deleteAnimation,
    importAnimationJSON,
    loadSavedAnimations,
    MAX_SAVED_COUNT,
    removeFromSaved,
    saveAnimation,
    saveAnimations,
    STORAGE_KEY,
} from '@/pages/loading-animation/storage.js'
import { describe, expect, it } from 'vitest'

function createMockStorage(initialData = {}) {
  let data = { ...initialData }
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => { data[key] = String(value) },
    removeItem: (key) => { delete data[key] },
    clear: () => { data = {} },
  }
}

function createTestAnimation(type = 'spinner', overrides = {}) {
  return createAnimationConfig(type, overrides)
}

describe('Storage', () => {
  describe('loadSavedAnimations', () => {
    it('should return empty array when storage is empty', () => {
      const storage = createMockStorage()
      const result = loadSavedAnimations(storage)
      expect(result).toEqual([])
    })

    it('should return empty array when storage has invalid JSON', () => {
      const storage = createMockStorage({ [STORAGE_KEY]: 'not valid json' })
      const result = loadSavedAnimations(storage)
      expect(result).toEqual([])
    })

    it('should return empty array when storage data is not an array', () => {
      const storage = createMockStorage({ [STORAGE_KEY]: JSON.stringify({ not: 'array' }) })
      const result = loadSavedAnimations(storage)
      expect(result).toEqual([])
    })

    it('should load and filter valid saved animations', () => {
      const anim1 = createTestAnimation('spinner')
      const anim2 = createTestAnimation('pulse')
      const invalidAnim = { id: 'invalid', data: 'invalid' }
      const storageData = [anim1, invalidAnim, anim2]
      const storage = createMockStorage({ [STORAGE_KEY]: JSON.stringify(storageData) })

      const result = loadSavedAnimations(storage)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(anim1.id)
      expect(result[1].id).toBe(anim2.id)
    })
  })

  describe('saveAnimations', () => {
    it('should save animations array to storage', () => {
      const storage = createMockStorage()
      const animations = [createTestAnimation('spinner'), createTestAnimation('dots')]

      saveAnimations(animations, storage)

      const saved = JSON.parse(storage.getItem(STORAGE_KEY))
      expect(saved).toHaveLength(2)
    })
  })

  describe('saveAnimation', () => {
    it('should add new animation to empty list', () => {
      const anim = createTestAnimation('spinner')
      const result = saveAnimation([], anim)

      expect(result.saved).toHaveLength(1)
      expect(result.saved[0].id).toBe(anim.id)
      expect(result.wasAdded).toBe(true)
      expect(result.removedOldest).toBeNull()
    })

    it('should update existing animation with same id', () => {
      const anim = createTestAnimation('spinner')
      const originalList = [anim]

      const updatedConfig = { ...anim, name: 'Updated Spinner' }
      const result = saveAnimation(originalList, updatedConfig)

      expect(result.saved).toHaveLength(1)
      expect(result.saved[0].name).toBe('Updated Spinner')
      expect(result.wasAdded).toBe(false)
    })

    it('should prepend new animation and update timestamp', () => {
      const anim1 = createTestAnimation('spinner')
      const anim2 = createTestAnimation('pulse')
      const originalList = [anim1]

      const result = saveAnimation(originalList, anim2)

      expect(result.saved[0].id).toBe(anim2.id)
      expect(result.saved[1].id).toBe(anim1.id)
      expect(result.saved[0].updatedAt).toBeGreaterThanOrEqual(anim2.updatedAt)
    })

    it('should remove oldest when exceeding max count', () => {
      const MAX = 3
      const animations = []
      for (let i = 0; i < MAX; i++) {
        animations.push(createTestAnimation('spinner', { size: 10 + i * 10 }))
      }

      const newAnim = createTestAnimation('pulse')
      const oldest = animations[animations.length - 1]

      const result = saveAnimation(animations, newAnim, MAX)

      expect(result.saved).toHaveLength(MAX)
      expect(result.removedOldest.id).toBe(oldest.id)
      expect(result.wasAdded).toBe(true)
    })

    it('should use MAX_SAVED_COUNT when maxCount not provided', () => {
      const animations = []
      for (let i = 0; i < MAX_SAVED_COUNT; i++) {
        animations.push(createTestAnimation('spinner', { size: 10 + i }))
      }

      const newAnim = createTestAnimation('pulse')
      const result = saveAnimation(animations, newAnim)

      expect(result.saved).toHaveLength(MAX_SAVED_COUNT)
      expect(result.removedOldest).toBeDefined()
    })
  })

  describe('deleteAnimation', () => {
    it('should delete animation by id', () => {
      const anim1 = createTestAnimation('spinner')
      const anim2 = createTestAnimation('pulse')
      const originalList = [anim1, anim2]

      const result = deleteAnimation(originalList, anim1.id)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(anim2.id)
    })

    it('should return original array when id not found', () => {
      const anim = createTestAnimation('spinner')
      const originalList = [anim]

      const result = deleteAnimation(originalList, 'non-existent-id')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(anim.id)
    })
  })

  describe('addToSaved', () => {
    it('should add animation and persist to storage', () => {
      const storage = createMockStorage()
      const anim = createTestAnimation('spinner')

      const result = addToSaved([], anim, storage, 5)

      expect(result.saved).toHaveLength(1)
      const stored = JSON.parse(storage.getItem(STORAGE_KEY))
      expect(stored).toHaveLength(1)
      expect(stored[0].id).toBe(anim.id)
    })

    it('should handle max count and persist', () => {
      const MAX = 2
      const storage = createMockStorage()
      const anim1 = createTestAnimation('spinner')
      const anim2 = createTestAnimation('pulse')
      const initialList = [anim1, anim2]

      const newAnim = createTestAnimation('wave')
      const result = addToSaved(initialList, newAnim, storage, MAX)

      expect(result.saved).toHaveLength(MAX)
      expect(result.removedOldest.id).toBe(anim2.id)
      const stored = JSON.parse(storage.getItem(STORAGE_KEY))
      expect(stored).toHaveLength(MAX)
    })
  })

  describe('removeFromSaved', () => {
    it('should remove animation and persist to storage', () => {
      const storage = createMockStorage()
      const anim1 = createTestAnimation('spinner')
      const anim2 = createTestAnimation('pulse')
      const initialList = [anim1, anim2]

      saveAnimations(initialList, storage)

      const result = removeFromSaved(initialList, anim1.id, storage)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(anim2.id)
      const stored = JSON.parse(storage.getItem(STORAGE_KEY))
      expect(stored).toHaveLength(1)
    })
  })

  describe('importAnimationJSON', () => {
    it('should import single animation config', () => {
      const anim = createTestAnimation('spinner')
      const jsonData = JSON.stringify({
        type: 'single',
        data: {
          animationType: anim.animationType,
          config: anim.config,
          name: 'Imported Animation',
        },
      })

      const result = importAnimationJSON(jsonData)

      expect(result.success).toBe(true)
      expect(result.data.animationType).toBe('spinner')
      expect(result.data.name).toBe('Imported Animation')
    })

    it('should import composition config', () => {
      const jsonData = JSON.stringify({
        type: 'composition',
        data: {
          name: 'Imported Composition',
          elements: [
            { animationType: 'spinner', config: { size: 50 }, position: { x: 50, y: 50 } },
          ],
        },
      })

      const result = importAnimationJSON(jsonData)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Imported Composition')
      expect(result.data.elements).toHaveLength(1)
    })

    it('should return error for invalid JSON', () => {
      const result = importAnimationJSON('not json')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should return error for missing data field', () => {
      const result = importAnimationJSON(JSON.stringify({ type: 'single' }))
      expect(result.success).toBe(false)
      expect(result.error).toContain('Missing data field')
    })

    it('should return error for unknown type', () => {
      const result = importAnimationJSON(JSON.stringify({ type: 'unknown', data: {} }))
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unknown import type')
    })

    it('should return error for invalid animation type in single config', () => {
      const jsonData = JSON.stringify({
        type: 'single',
        data: { animationType: 'invalid', config: {} },
      })
      const result = importAnimationJSON(jsonData)
      expect(result.success).toBe(false)
    })

    it('should return error for missing elements in composition', () => {
      const jsonData = JSON.stringify({
        type: 'composition',
        data: { name: 'test' },
      })
      const result = importAnimationJSON(jsonData)
      expect(result.success).toBe(false)
    })

    it('should return error for bad element in composition', () => {
      const jsonData = JSON.stringify({
        type: 'composition',
        data: {
          name: 'test',
          elements: [{ animationType: 'invalid' }],
        },
      })
      const result = importAnimationJSON(jsonData)
      expect(result.success).toBe(false)
    })
  })
})
