import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  TEMPLATES,
  MODULE_TYPES,
} from '../../resume-editor/constants'
import {
  generateId,
  createBasicInfoModule,
  createJobIntentionModule,
  createEducationItem,
  createEducationModule,
  createWorkItem,
  createWorkExperienceModule,
  createProjectItem,
  createProjectExperienceModule,
  createSkillsModule,
  createSelfEvaluationModule,
  createCustomModule,
  createDefaultResumeState,
  reorderModules,
  deleteModule,
  canDeleteModule,
  toggleModuleVisibility,
  updateModuleData,
  updateModuleTitle,
  addModule,
  addListItem,
  deleteListItem,
  updateListItem,
  validatePhone,
  validateEmail,
  validateBasicInfo,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  validateResumeData,
  exportToJson,
  downloadJson,
  parseJsonImport,
  getModuleLabel,
  getVisibleModules,
} from '../../resume-editor/resumeCore'

describe('generateId', () => {
  it('should generate string IDs', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('should generate unique IDs', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })

  it('should include the prefix', () => {
    const id = generateId('test')
    expect(id.startsWith('test_')).toBe(true)
  })
})

describe('Module creation functions', () => {
  it('createBasicInfoModule should return correct structure', () => {
    const mod = createBasicInfoModule()
    expect(mod.type).toBe(MODULE_TYPES.BASIC_INFO)
    expect(mod.visible).toBe(true)
    expect(typeof mod.id).toBe('string')
    expect(mod.data).toEqual({
      name: '',
      phone: '',
      email: '',
      location: '',
      homepage: '',
    })
  })

  it('createJobIntentionModule should return correct structure', () => {
    const mod = createJobIntentionModule()
    expect(mod.type).toBe(MODULE_TYPES.JOB_INTENTION)
    expect(mod.visible).toBe(true)
    expect(mod.data).toEqual({
      position: '',
      salary: '',
      city: '',
      status: '',
    })
  })

  it('createEducationItem should return correct structure', () => {
    const item = createEducationItem()
    expect(typeof item.id).toBe('string')
    expect(item.startDate).toBe('')
    expect(item.endDate).toBe('')
    expect(item.school).toBe('')
    expect(item.major).toBe('')
    expect(item.degree).toBe('')
    expect(item.description).toBe('')
  })

  it('createEducationModule should include one default item', () => {
    const mod = createEducationModule()
    expect(mod.type).toBe(MODULE_TYPES.EDUCATION)
    expect(mod.visible).toBe(true)
    expect(Array.isArray(mod.data.items)).toBe(true)
    expect(mod.data.items).toHaveLength(1)
    expect(typeof mod.title).toBe('string')
  })

  it('createWorkItem should return correct structure', () => {
    const item = createWorkItem()
    expect(typeof item.id).toBe('string')
    expect(item.startDate).toBe('')
    expect(item.endDate).toBe('')
    expect(item.company).toBe('')
    expect(item.position).toBe('')
    expect(item.description).toBe('')
  })

  it('createWorkExperienceModule should include one default item', () => {
    const mod = createWorkExperienceModule()
    expect(mod.type).toBe(MODULE_TYPES.WORK_EXPERIENCE)
    expect(Array.isArray(mod.data.items)).toBe(true)
    expect(mod.data.items).toHaveLength(1)
  })

  it('createProjectItem should return correct structure', () => {
    const item = createProjectItem()
    expect(typeof item.id).toBe('string')
    expect(item.startDate).toBe('')
    expect(item.endDate).toBe('')
    expect(item.name).toBe('')
    expect(item.role).toBe('')
    expect(item.description).toBe('')
  })

  it('createProjectExperienceModule should include one default item', () => {
    const mod = createProjectExperienceModule()
    expect(mod.type).toBe(MODULE_TYPES.PROJECT_EXPERIENCE)
    expect(Array.isArray(mod.data.items)).toBe(true)
    expect(mod.data.items).toHaveLength(1)
  })

  it('createSkillsModule should return correct structure', () => {
    const mod = createSkillsModule()
    expect(mod.type).toBe(MODULE_TYPES.SKILLS)
    expect(mod.visible).toBe(true)
    expect(mod.data.content).toBe('')
    expect(typeof mod.title).toBe('string')
  })

  it('createSelfEvaluationModule should return correct structure', () => {
    const mod = createSelfEvaluationModule()
    expect(mod.type).toBe(MODULE_TYPES.SELF_EVALUATION)
    expect(mod.visible).toBe(true)
    expect(mod.data.content).toBe('')
  })

  it('createCustomModule should use provided name', () => {
    const mod = createCustomModule('获奖经历')
    expect(mod.type).toBe(MODULE_TYPES.CUSTOM)
    expect(mod.title).toBe('获奖经历')
    expect(mod.visible).toBe(true)
    expect(mod.data.content).toBe('')
  })

  it('createCustomModule should fallback to default name', () => {
    const mod = createCustomModule('')
    expect(mod.title).toBe('自定义模块')
  })

  it('createDefaultResumeState should include all standard modules', () => {
    const state = createDefaultResumeState()
    expect(state.templateId).toBe(TEMPLATES.CLASSIC)
    expect(Array.isArray(state.modules)).toBe(true)
    const types = state.modules.map((m) => m.type)
    expect(types).toContain(MODULE_TYPES.BASIC_INFO)
    expect(types).toContain(MODULE_TYPES.JOB_INTENTION)
    expect(types).toContain(MODULE_TYPES.EDUCATION)
    expect(types).toContain(MODULE_TYPES.WORK_EXPERIENCE)
    expect(types).toContain(MODULE_TYPES.PROJECT_EXPERIENCE)
    expect(types).toContain(MODULE_TYPES.SKILLS)
    expect(types).toContain(MODULE_TYPES.SELF_EVALUATION)
  })
})

describe('reorderModules', () => {
  it('should return empty array for non-array input', () => {
    expect(reorderModules(null, 0, 1)).toEqual([])
    expect(reorderModules(undefined, 0, 1)).toEqual([])
  })

  it('should return same array for invalid indices', () => {
    const mods = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(reorderModules(mods, -1, 1)).toEqual(mods)
    expect(reorderModules(mods, 0, 99)).toEqual(mods)
    expect(reorderModules(mods, 99, 0)).toEqual(mods)
  })

  it('should return same array when from and to are same', () => {
    const mods = [{ id: 'a' }, { id: 'b' }]
    expect(reorderModules(mods, 1, 1)).toEqual(mods)
  })

  it('should reorder moving forward', () => {
    const mods = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = reorderModules(mods, 0, 2)
    expect(result.map((m) => m.id)).toEqual(['b', 'c', 'a'])
  })

  it('should reorder moving backward', () => {
    const mods = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = reorderModules(mods, 2, 0)
    expect(result.map((m) => m.id)).toEqual(['c', 'a', 'b'])
  })

  it('should not mutate original array', () => {
    const mods = [{ id: 'a' }, { id: 'b' }]
    const originalIds = mods.map((m) => m.id)
    reorderModules(mods, 0, 1)
    expect(mods.map((m) => m.id)).toEqual(originalIds)
  })
})

describe('deleteModule', () => {
  it('should return empty array for non-array input', () => {
    expect(deleteModule(null, 'x')).toEqual([])
    expect(deleteModule(undefined, 'x')).toEqual([])
  })

  it('should delete non-basic-info module', () => {
    const mods = [
      { id: 'basic', type: MODULE_TYPES.BASIC_INFO },
      { id: 'edu', type: MODULE_TYPES.EDUCATION },
    ]
    const result = deleteModule(mods, 'edu')
    expect(result.map((m) => m.id)).toEqual(['basic'])
  })

  it('should NOT delete basic info module', () => {
    const mods = [
      { id: 'basic', type: MODULE_TYPES.BASIC_INFO },
      { id: 'edu', type: MODULE_TYPES.EDUCATION },
    ]
    const result = deleteModule(mods, 'basic')
    expect(result.map((m) => m.id)).toEqual(['basic', 'edu'])
  })

  it('should return same array when id not found', () => {
    const mods = [{ id: 'a' }]
    const result = deleteModule(mods, 'x')
    expect(result).toEqual(mods)
  })
})

describe('canDeleteModule', () => {
  it('should return false for basic info module', () => {
    expect(canDeleteModule({ type: MODULE_TYPES.BASIC_INFO })).toBe(false)
  })

  it('should return true for other module types', () => {
    expect(canDeleteModule({ type: MODULE_TYPES.EDUCATION })).toBe(true)
    expect(canDeleteModule({ type: MODULE_TYPES.CUSTOM })).toBe(true)
  })

  it('should return false for null/undefined', () => {
    expect(canDeleteModule(null)).toBe(false)
    expect(canDeleteModule(undefined)).toBe(false)
  })
})

describe('toggleModuleVisibility', () => {
  it('should return empty array for non-array input', () => {
    expect(toggleModuleVisibility(null, 'x')).toEqual([])
  })

  it('should toggle visibility of matching module', () => {
    const mods = [
      { id: 'a', visible: true },
      { id: 'b', visible: true },
    ]
    const result = toggleModuleVisibility(mods, 'a')
    expect(result[0].visible).toBe(false)
    expect(result[1].visible).toBe(true)
  })

  it('should not mutate original array', () => {
    const mods = [{ id: 'a', visible: true }]
    toggleModuleVisibility(mods, 'a')
    expect(mods[0].visible).toBe(true)
  })
})

describe('updateModuleData', () => {
  it('should return empty array for non-array input', () => {
    expect(updateModuleData(null, 'x', {})).toEqual([])
  })

  it('should update module data shallow merge', () => {
    const mods = [
      { id: 'basic', data: { name: 'Alice', phone: '123' } },
      { id: 'b', data: {} },
    ]
    const result = updateModuleData(mods, 'basic', { name: 'Bob', email: 'a@b.com' })
    expect(result[0].data).toEqual({
      name: 'Bob',
      phone: '123',
      email: 'a@b.com',
    })
    expect(result[1].data).toEqual({})
  })

  it('should not mutate original', () => {
    const mods = [{ id: 'a', data: { name: 'A' } }]
    updateModuleData(mods, 'a', { name: 'B' })
    expect(mods[0].data.name).toBe('A')
  })
})

describe('updateModuleTitle', () => {
  it('should return empty array for non-array input', () => {
    expect(updateModuleTitle(null, 'x', 't')).toEqual([])
  })

  it('should update title of matching module', () => {
    const mods = [
      { id: 'a', title: 'Old' },
      { id: 'b', title: 'B' },
    ]
    const result = updateModuleTitle(mods, 'a', 'New')
    expect(result[0].title).toBe('New')
    expect(result[1].title).toBe('B')
  })
})

describe('addModule', () => {
  it('should return array with new module for non-array input', () => {
    const newMod = { id: 'x' }
    expect(addModule(null, newMod)).toEqual([newMod])
  })

  it('should return original if newModule is falsy', () => {
    const mods = [{ id: 'a' }]
    expect(addModule(mods, null)).toEqual(mods)
    expect(addModule(mods, undefined)).toEqual(mods)
  })

  it('should append module to end by default', () => {
    const mods = [{ id: 'a' }]
    const newMod = { id: 'b' }
    const result = addModule(mods, newMod)
    expect(result.map((m) => m.id)).toEqual(['a', 'b'])
  })

  it('should insert module at specified index', () => {
    const mods = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const newMod = { id: 'x' }
    const result = addModule(mods, newMod, 1)
    expect(result.map((m) => m.id)).toEqual(['a', 'x', 'b', 'c'])
  })

  it('should ignore invalid index and append', () => {
    const mods = [{ id: 'a' }]
    const newMod = { id: 'b' }
    const result = addModule(mods, newMod, -1)
    expect(result.map((m) => m.id)).toEqual(['a', 'b'])
  })
})

describe('List item manipulation (add/delete/update)', () => {
  function makeEduModule(id = 'edu') {
    return {
      id,
      type: MODULE_TYPES.EDUCATION,
      data: { items: [{ id: 'i1', school: 'S1' }, { id: 'i2', school: 'S2' }] },
    }
  }

  it('addListItem should append new item for list module', () => {
    const mods = [makeEduModule()]
    const result = addListItem(mods, 'edu')
    expect(result[0].data.items).toHaveLength(3)
    expect(typeof result[0].data.items[2].id).toBe('string')
  })

  it('addListItem should ignore non-list modules', () => {
    const mods = [
      { id: 'basic', type: MODULE_TYPES.BASIC_INFO, data: { name: 'x' } },
    ]
    const result = addListItem(mods, 'basic')
    expect(result[0].data).toEqual({ name: 'x' })
  })

  it('addListItem should return empty for non-array input', () => {
    expect(addListItem(null, 'x')).toEqual([])
  })

  it('addListItem should handle missing items array', () => {
    const mods = [
      { id: 'edu', type: MODULE_TYPES.EDUCATION, data: {} },
    ]
    const result = addListItem(mods, 'edu')
    expect(Array.isArray(result[0].data.items)).toBe(true)
    expect(result[0].data.items).toHaveLength(1)
  })

  it('deleteListItem should remove item by id', () => {
    const mods = [makeEduModule()]
    const result = deleteListItem(mods, 'edu', 'i1')
    expect(result[0].data.items.map((i) => i.id)).toEqual(['i2'])
  })

  it('deleteListItem should ignore non-list modules', () => {
    const mods = [
      { id: 'basic', type: MODULE_TYPES.BASIC_INFO, data: { name: 'x' } },
    ]
    const result = deleteListItem(mods, 'basic', 'any')
    expect(result[0].data).toEqual({ name: 'x' })
  })

  it('updateListItem should update specific item', () => {
    const mods = [makeEduModule()]
    const result = updateListItem(mods, 'edu', 'i1', { school: 'NewS' })
    expect(result[0].data.items[0].school).toBe('NewS')
    expect(result[0].data.items[1].school).toBe('S2')
  })

  it('updateListItem should ignore non-list modules', () => {
    const mods = [
      { id: 'basic', type: MODULE_TYPES.BASIC_INFO, data: { name: 'x' } },
    ]
    const result = updateListItem(mods, 'basic', 'any', { foo: 'bar' })
    expect(result[0].data).toEqual({ name: 'x' })
  })
})

describe('Validation functions', () => {
  describe('validatePhone', () => {
    it('should reject empty/null', () => {
      expect(validatePhone('').valid).toBe(false)
      expect(validatePhone(null).valid).toBe(false)
      expect(validatePhone(undefined).valid).toBe(false)
    })

    it('should reject invalid format', () => {
      expect(validatePhone('12345').valid).toBe(false)
      expect(validatePhone('abcdefghijk').valid).toBe(false)
      expect(validatePhone('03812345678').valid).toBe(false)
      expect(validatePhone('12812345678').valid).toBe(false)
    })

    it('should accept valid Chinese mobile', () => {
      expect(validatePhone('13812345678').valid).toBe(true)
      expect(validatePhone('15812345678').valid).toBe(true)
      expect(validatePhone('18812345678').valid).toBe(true)
      expect(validatePhone(' 13812345678 ').valid).toBe(true)
    })
  })

  describe('validateEmail', () => {
    it('should reject empty/null', () => {
      expect(validateEmail('').valid).toBe(false)
      expect(validateEmail(null).valid).toBe(false)
    })

    it('should reject invalid format', () => {
      expect(validateEmail('notanemail').valid).toBe(false)
      expect(validateEmail('a@').valid).toBe(false)
      expect(validateEmail('@b.com').valid).toBe(false)
      expect(validateEmail('a b@c.com').valid).toBe(false)
    })

    it('should accept valid emails', () => {
      expect(validateEmail('a@b.com').valid).toBe(true)
      expect(validateEmail('user.name+tag@domain.co.uk').valid).toBe(true)
      expect(validateEmail(' test@test.com ').valid).toBe(true)
    })
  })

  describe('validateBasicInfo', () => {
    it('should return empty errors for null data', () => {
      expect(validateBasicInfo(null)).toEqual({})
    })

    it('should not require phone/email to be filled', () => {
      const errors = validateBasicInfo({ name: 'x', phone: '', email: '' })
      expect(errors.phone).toBeUndefined()
      expect(errors.email).toBeUndefined()
    })

    it('should validate phone format when provided', () => {
      const errors = validateBasicInfo({ phone: '123' })
      expect(errors.phone).toBeDefined()
    })

    it('should validate email format when provided', () => {
      const errors = validateBasicInfo({ email: 'bad' })
      expect(errors.email).toBeDefined()
    })

    it('should pass valid phone and email', () => {
      const errors = validateBasicInfo({ phone: '13812345678', email: 'a@b.com' })
      expect(errors.phone).toBeUndefined()
      expect(errors.email).toBeUndefined()
    })
  })
})

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
  }
}

describe('localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('loadFromStorage should return default when nothing stored', () => {
    const result = loadFromStorage()
    expect(result.templateId).toBe(TEMPLATES.CLASSIC)
    expect(Array.isArray(result.modules)).toBe(true)
  })

  it('saveToStorage and loadFromStorage should persist', () => {
    const state = { templateId: TEMPLATES.MODERN, modules: [] }
    expect(saveToStorage(state)).toBe(true)
    const loaded = loadFromStorage()
    expect(loaded).toEqual(state)
  })

  it('loadFromStorage should return default for invalid JSON', () => {
    mockStorage.setItem('resume-editor-state', 'not json')
    const result = loadFromStorage()
    expect(result.templateId).toBe(TEMPLATES.CLASSIC)
  })

  it('loadFromStorage should return default for missing fields', () => {
    mockStorage.setItem('resume-editor-state', JSON.stringify({ foo: 1 }))
    const result = loadFromStorage()
    expect(result.templateId).toBe(TEMPLATES.CLASSIC)
  })

  it('clearStorage should remove data', () => {
    saveToStorage({ templateId: TEMPLATES.MINIMAL, modules: [] })
    expect(clearStorage()).toBe(true)
    expect(mockStorage.getItem('resume-editor-state')).toBe(null)
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
    expect(loadFromStorage().templateId).toBe(TEMPLATES.CLASSIC)
    expect(saveToStorage({})).toBe(false)
    expect(clearStorage()).toBe(false)
  })
})

describe('validateResumeData', () => {
  it('should reject null/undefined/non-object', () => {
    expect(validateResumeData(null).valid).toBe(false)
    expect(validateResumeData(undefined).valid).toBe(false)
    expect(validateResumeData('string').valid).toBe(false)
  })

  it('should reject invalid templateId', () => {
    expect(validateResumeData({ templateId: 'bogus', modules: [] }).valid).toBe(false)
    expect(validateResumeData({ modules: [] }).valid).toBe(false)
  })

  it('should reject non-array modules', () => {
    expect(validateResumeData({ templateId: TEMPLATES.CLASSIC, modules: 'x' }).valid).toBe(false)
  })

  it('should reject missing basic info module', () => {
    expect(
      validateResumeData({
        templateId: TEMPLATES.CLASSIC,
        modules: [{ id: 'x', type: MODULE_TYPES.EDUCATION, visible: true, data: {} }],
      }).valid
    ).toBe(false)
  })

  it('should reject modules without id/type/visible/data', () => {
    expect(
      validateResumeData({
        templateId: TEMPLATES.CLASSIC,
        modules: [{ type: MODULE_TYPES.BASIC_INFO, visible: true, data: {} }],
      }).valid
    ).toBe(false)
  })

  it('should accept valid resume data', () => {
    const valid = {
      templateId: TEMPLATES.CLASSIC,
      modules: [
        { id: 'b', type: MODULE_TYPES.BASIC_INFO, visible: true, data: {} },
        { id: 'e', type: MODULE_TYPES.EDUCATION, visible: false, title: 'Edu', data: {} },
      ],
    }
    expect(validateResumeData(valid).valid).toBe(true)
    expect(validateResumeData(valid).message).toBe('')
  })
})

describe('JSON import/export', () => {
  it('exportToJson should produce valid JSON string', () => {
    const state = createDefaultResumeState()
    const json = exportToJson(state)
    expect(typeof json).toBe('string')
    expect(JSON.parse(json)).toEqual(state)
  })

  it('parseJsonImport should return success for valid data', () => {
    const state = createDefaultResumeState()
    const json = exportToJson(state)
    const result = parseJsonImport(json)
    expect(result.success).toBe(true)
    expect(result.data.templateId).toBe(state.templateId)
  })

  it('parseJsonImport should return failure for invalid JSON', () => {
    const result = parseJsonImport('not valid json')
    expect(result.success).toBe(false)
    expect(result.data).toBe(null)
    expect(result.message.length).toBeGreaterThan(0)
  })

  it('parseJsonImport should return failure for structurally invalid data', () => {
    const result = parseJsonImport(JSON.stringify({ foo: 1 }))
    expect(result.success).toBe(false)
  })

  it('downloadJson should handle missing window gracefully', () => {
    vi.stubGlobal('window', undefined)
    expect(downloadJson('{}')).toBe(false)
  })
})

describe('getModuleLabel', () => {
  it('should return empty string for null', () => {
    expect(getModuleLabel(null)).toBe('')
  })

  it('should use module title for custom/skills/self_evaluation', () => {
    expect(getModuleLabel({ type: MODULE_TYPES.CUSTOM, title: '获奖' })).toBe('获奖')
    expect(getModuleLabel({ type: MODULE_TYPES.SKILLS, title: '技能' })).toBe('技能')
  })

  it('should use MODULE_LABELS for standard types', () => {
    expect(getModuleLabel({ type: MODULE_TYPES.EDUCATION })).toContain('教育')
    expect(getModuleLabel({ type: MODULE_TYPES.BASIC_INFO })).toContain('基本信息')
  })
})

describe('getVisibleModules', () => {
  it('should return empty array for non-array', () => {
    expect(getVisibleModules(null)).toEqual([])
    expect(getVisibleModules(undefined)).toEqual([])
  })

  it('should filter to only visible modules', () => {
    const mods = [
      { id: 'a', visible: true },
      { id: 'b', visible: false },
      { id: 'c', visible: true },
    ]
    const result = getVisibleModules(mods)
    expect(result.map((m) => m.id)).toEqual(['a', 'c'])
  })

  it('should filter out null/undefined entries', () => {
    const mods = [{ id: 'a', visible: true }, null, undefined]
    const result = getVisibleModules(mods)
    expect(result).toHaveLength(1)
  })
})
