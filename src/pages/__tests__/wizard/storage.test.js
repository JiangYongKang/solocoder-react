import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createEmptyDraft,
  saveDraft,
  loadDraft,
  mergeWithDefaults,
  clearDraft,
  clampStep,
} from '../../wizard/utils/storage'

const STORAGE_KEY = 'wizard_draft'

describe('createEmptyDraft', () => {
  it('should return a draft with currentStep 0 and default empty data', () => {
    const draft = createEmptyDraft()
    expect(draft.currentStep).toBe(0)
    expect(draft.data.name).toBe('')
    expect(draft.data.email).toBe('')
    expect(draft.data.phone).toBe('')
    expect(draft.data.province).toBe('')
    expect(draft.data.city).toBe('')
    expect(draft.data.address).toBe('')
    expect(Array.isArray(draft.data.interests)).toBe(true)
    expect(draft.data.interests.length).toBe(0)
    expect(draft.data.notification).toBe('')
    expect(draft.data.frequency).toBe('')
  })
})

describe('clampStep', () => {
  it('should return valid step numbers unchanged', () => {
    expect(clampStep(0)).toBe(0)
    expect(clampStep(1)).toBe(1)
    expect(clampStep(2)).toBe(2)
    expect(clampStep(3)).toBe(3)
  })

  it('should clamp out-of-range positive values to max (3)', () => {
    expect(clampStep(4)).toBe(3)
    expect(clampStep(5)).toBe(3)
    expect(clampStep(100)).toBe(3)
  })

  it('should clamp negative values to 0', () => {
    expect(clampStep(-1)).toBe(0)
    expect(clampStep(-10)).toBe(0)
  })

  it('should return 0 for non-number inputs', () => {
    expect(clampStep('abc')).toBe(0)
    expect(clampStep(null)).toBe(0)
    expect(clampStep(undefined)).toBe(0)
    expect(clampStep(NaN)).toBe(0)
  })

  it('should floor decimal values', () => {
    expect(clampStep(1.7)).toBe(1)
    expect(clampStep(2.9)).toBe(2)
  })
})

describe('mergeWithDefaults', () => {
  it('should fill in missing fields with defaults', () => {
    const parsed = { currentStep: 2, data: { name: '张三' } }
    const result = mergeWithDefaults(parsed)
    expect(result.currentStep).toBe(2)
    expect(result.data.name).toBe('张三')
    expect(result.data.email).toBe('')
    expect(Array.isArray(result.data.interests)).toBe(true)
  })

  it('should clamp out-of-range currentStep values', () => {
    expect(mergeWithDefaults({ currentStep: 5 }).currentStep).toBe(3)
    expect(mergeWithDefaults({ currentStep: -1 }).currentStep).toBe(0)
    expect(mergeWithDefaults({ currentStep: 100 }).currentStep).toBe(3)
  })

  it('should default currentStep to 0 if not a number', () => {
    expect(mergeWithDefaults({ currentStep: 'abc' }).currentStep).toBe(0)
    expect(mergeWithDefaults({}).currentStep).toBe(0)
  })

  it('should ensure interests is always an array', () => {
    expect(mergeWithDefaults({ data: { interests: 'not-array' } }).data.interests).toEqual([])
    expect(mergeWithDefaults({ data: {} }).data.interests).toEqual([])
  })
})

describe('storage with localStorage mock', () => {
  let store = {}

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => (key in store ? store[key] : null)),
      setItem: vi.fn((key, value) => {
        store[key] = String(value)
      }),
      removeItem: vi.fn((key) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      }),
    })
  })

  describe('saveDraft', () => {
    it('should save draft as JSON string under STORAGE_KEY', () => {
      const draft = createEmptyDraft()
      const result = saveDraft(draft)
      expect(result).toBe(true)
      expect(store[STORAGE_KEY]).toBe(JSON.stringify(draft))
    })
  })

  describe('loadDraft', () => {
    it('should return empty draft when nothing stored', () => {
      const result = loadDraft()
      expect(result).toEqual(createEmptyDraft())
    })

    it('should parse and return stored draft', () => {
      const original = { currentStep: 1, data: { ...createEmptyDraft().data, name: '李四' } }
      store[STORAGE_KEY] = JSON.stringify(original)
      const result = loadDraft()
      expect(result.currentStep).toBe(1)
      expect(result.data.name).toBe('李四')
    })

    it('should clamp out-of-range currentStep from stored draft', () => {
      store[STORAGE_KEY] = JSON.stringify({ currentStep: 99, data: createEmptyDraft().data })
      const result = loadDraft()
      expect(result.currentStep).toBe(3)
    })

    it('should return empty draft on JSON parse error', () => {
      store[STORAGE_KEY] = 'not-valid-json{{{'
      const result = loadDraft()
      expect(result).toEqual(createEmptyDraft())
    })
  })

  describe('clearDraft', () => {
    it('should remove draft from storage', () => {
      store[STORAGE_KEY] = 'something'
      const result = clearDraft()
      expect(result).toBe(true)
      expect(store[STORAGE_KEY]).toBeUndefined()
    })
  })
})
