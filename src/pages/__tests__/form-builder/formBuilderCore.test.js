import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  createField,
  reorderFields,
  deleteField,
  updateField,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  exportToJsonSchema,
  addOption,
  updateOption,
  deleteOption,
} from '../../form-builder/formBuilderCore'

describe('FIELD_TYPES', () => {
  it('should contain all 8 field types', () => {
    expect(Object.keys(FIELD_TYPES)).toHaveLength(8)
    expect(FIELD_TYPES.TEXT).toBe('text')
    expect(FIELD_TYPES.TEXTAREA).toBe('textarea')
    expect(FIELD_TYPES.SELECT).toBe('select')
    expect(FIELD_TYPES.RADIO).toBe('radio')
    expect(FIELD_TYPES.CHECKBOX).toBe('checkbox')
    expect(FIELD_TYPES.DATE).toBe('date')
    expect(FIELD_TYPES.NUMBER).toBe('number')
    expect(FIELD_TYPES.SWITCH).toBe('switch')
  })
})

describe('FIELD_TYPE_LABELS', () => {
  it('should map all types to Chinese labels', () => {
    expect(FIELD_TYPE_LABELS[FIELD_TYPES.TEXT]).toBe('单行文本框')
    expect(FIELD_TYPE_LABELS[FIELD_TYPES.TEXTAREA]).toBe('多行文本框')
    expect(FIELD_TYPE_LABELS[FIELD_TYPES.SELECT]).toBe('下拉选择框')
    expect(FIELD_TYPE_LABELS[FIELD_TYPES.RADIO]).toBe('单选框组')
    expect(FIELD_TYPE_LABELS[FIELD_TYPES.CHECKBOX]).toBe('多选框组')
    expect(FIELD_TYPE_LABELS[FIELD_TYPES.DATE]).toBe('日期选择器')
    expect(FIELD_TYPE_LABELS[FIELD_TYPES.NUMBER]).toBe('数字输入框')
    expect(FIELD_TYPE_LABELS[FIELD_TYPES.SWITCH]).toBe('开关')
  })
})

describe('createField', () => {
  it('should create a text field with base properties', () => {
    const field = createField(FIELD_TYPES.TEXT)
    expect(field).toHaveProperty('id')
    expect(typeof field.id).toBe('string')
    expect(field.type).toBe(FIELD_TYPES.TEXT)
    expect(field.label).toBe('单行文本框')
    expect(field.required).toBe(false)
    expect(field.placeholder).toBe('')
  })

  it('should create a select field with default options', () => {
    const field = createField(FIELD_TYPES.SELECT)
    expect(field.type).toBe(FIELD_TYPES.SELECT)
    expect(Array.isArray(field.options)).toBe(true)
    expect(field.options).toHaveLength(2)
    expect(field.options[0]).toEqual({ label: '选项1', value: 'option1' })
    expect(field.options[1]).toEqual({ label: '选项2', value: 'option2' })
  })

  it('should create a radio field with default options', () => {
    const field = createField(FIELD_TYPES.RADIO)
    expect(field.type).toBe(FIELD_TYPES.RADIO)
    expect(Array.isArray(field.options)).toBe(true)
    expect(field.options).toHaveLength(2)
  })

  it('should create a checkbox field with default options', () => {
    const field = createField(FIELD_TYPES.CHECKBOX)
    expect(field.type).toBe(FIELD_TYPES.CHECKBOX)
    expect(Array.isArray(field.options)).toBe(true)
    expect(field.options).toHaveLength(2)
  })

  it('should create a number field with min/max as null', () => {
    const field = createField(FIELD_TYPES.NUMBER)
    expect(field.type).toBe(FIELD_TYPES.NUMBER)
    expect(field.min).toBe(null)
    expect(field.max).toBe(null)
  })

  it('should create a date field without options', () => {
    const field = createField(FIELD_TYPES.DATE)
    expect(field.type).toBe(FIELD_TYPES.DATE)
    expect(field.options).toBeUndefined()
  })

  it('should generate unique IDs for each field', () => {
    const f1 = createField(FIELD_TYPES.TEXT)
    const f2 = createField(FIELD_TYPES.TEXT)
    expect(f1.id).not.toBe(f2.id)
  })
})

describe('reorderFields', () => {
  it('should return empty array for non-array input', () => {
    expect(reorderFields(null, 0, 1)).toEqual([])
    expect(reorderFields(undefined, 0, 1)).toEqual([])
    expect(reorderFields('not-array', 0, 1)).toEqual([])
  })

  it('should return same array for invalid indices', () => {
    const fields = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(reorderFields(fields, -1, 1)).toEqual(fields)
    expect(reorderFields(fields, 0, 99)).toEqual(fields)
    expect(reorderFields(fields, 99, 0)).toEqual(fields)
  })

  it('should return same array when from and to are same', () => {
    const fields = [{ id: 'a' }, { id: 'b' }]
    expect(reorderFields(fields, 1, 1)).toEqual(fields)
  })

  it('should reorder fields correctly moving forward', () => {
    const fields = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = reorderFields(fields, 0, 2)
    expect(result.map((f) => f.id)).toEqual(['b', 'c', 'a'])
  })

  it('should reorder fields correctly moving backward', () => {
    const fields = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = reorderFields(fields, 2, 0)
    expect(result.map((f) => f.id)).toEqual(['c', 'a', 'b'])
  })

  it('should not mutate original array', () => {
    const fields = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const original = [...fields]
    reorderFields(fields, 0, 2)
    expect(fields).toEqual(original)
  })
})

describe('deleteField', () => {
  it('should return empty array for non-array input', () => {
    expect(deleteField(null, 'x')).toEqual([])
    expect(deleteField(undefined, 'x')).toEqual([])
  })

  it('should delete field by id', () => {
    const fields = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = deleteField(fields, 'b')
    expect(result.map((f) => f.id)).toEqual(['a', 'c'])
  })

  it('should return same array when id not found', () => {
    const fields = [{ id: 'a' }, { id: 'b' }]
    const result = deleteField(fields, 'x')
    expect(result).toEqual(fields)
  })

  it('should not mutate original array', () => {
    const fields = [{ id: 'a' }, { id: 'b' }]
    deleteField(fields, 'a')
    expect(fields).toHaveLength(2)
  })
})

describe('updateField', () => {
  it('should return empty array for non-array input', () => {
    expect(updateField(null, 'x', {})).toEqual([])
    expect(updateField(undefined, 'x', {})).toEqual([])
  })

  it('should update a field by id', () => {
    const fields = [
      { id: 'a', label: 'Old' },
      { id: 'b', label: 'B' },
    ]
    const result = updateField(fields, 'a', { label: 'New', required: true })
    expect(result[0].label).toBe('New')
    expect(result[0].required).toBe(true)
    expect(result[1].label).toBe('B')
  })

  it('should return same array when id not found', () => {
    const fields = [{ id: 'a', label: 'A' }]
    const result = updateField(fields, 'x', { label: 'New' })
    expect(result[0].label).toBe('A')
  })

  it('should not mutate original array', () => {
    const fields = [{ id: 'a', label: 'Old' }]
    updateField(fields, 'a', { label: 'New' })
    expect(fields[0].label).toBe('Old')
  })
})

function createMockLocalStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)) },
    removeItem: (key) => { store.delete(key) },
    clear: () => { store.clear() },
  }
}

describe('localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('should return default state when nothing stored', () => {
    const result = loadFromStorage()
    expect(result).toEqual({ fields: [] })
  })

  it('should save and load state correctly', () => {
    const testState = { fields: [{ id: 'a', type: 'text' }] }
    const saved = saveToStorage(testState)
    expect(saved).toBe(true)
    const loaded = loadFromStorage()
    expect(loaded).toEqual(testState)
  })

  it('should return default state for invalid JSON', () => {
    mockStorage.setItem('form-builder-state', 'invalid-json')
    const result = loadFromStorage()
    expect(result).toEqual({ fields: [] })
  })

  it('should return default state for missing fields array', () => {
    mockStorage.setItem('form-builder-state', JSON.stringify({ foo: 'bar' }))
    const result = loadFromStorage()
    expect(result).toEqual({ fields: [] })
  })

  it('should clear storage correctly', () => {
    saveToStorage({ fields: [{ id: 'a' }] })
    const cleared = clearStorage()
    expect(cleared).toBe(true)
    const loaded = loadFromStorage()
    expect(loaded).toEqual({ fields: [] })
  })

  it('should handle localStorage throws', () => {
    vi.stubGlobal('window', { localStorage: {
      getItem: () => { throw new Error('fail') },
      setItem: () => { throw new Error('fail') },
      removeItem: () => { throw new Error('fail') },
    }})
    expect(loadFromStorage()).toEqual({ fields: [] })
    expect(saveToStorage({ fields: [] })).toBe(false)
    expect(clearStorage()).toBe(false)
  })
})

describe('exportToJsonSchema', () => {
  it('should return basic schema for non-array input', () => {
    const result = exportToJsonSchema(null)
    expect(result.type).toBe('object')
    expect(result.properties).toEqual({})
    expect(result.required).toBeUndefined()
  })

  it('should export empty fields correctly', () => {
    const result = exportToJsonSchema([])
    expect(result.type).toBe('object')
    expect(result.properties).toEqual({})
    expect(result.required).toBeUndefined()
  })

  it('should omit required when no fields are required', () => {
    const fields = [
      { id: 'f1', type: FIELD_TYPES.TEXT, label: 'A', required: false },
      { id: 'f2', type: FIELD_TYPES.TEXT, label: 'B', required: false },
    ]
    const result = exportToJsonSchema(fields)
    expect(result.required).toBeUndefined()
  })

  it('should export text field as string type', () => {
    const field = { id: 'f1', type: FIELD_TYPES.TEXT, label: '姓名', required: false, placeholder: '请输入姓名' }
    const result = exportToJsonSchema([field])
    expect(result.properties.f1).toBeDefined()
    expect(result.properties.f1.type).toBe('string')
    expect(result.properties.f1.title).toBe('姓名')
    expect(result.properties.f1.description).toBe('请输入姓名')
    expect(result.required).toBeUndefined()
  })

  it('should mark required fields in required array', () => {
    const field = { id: 'f1', type: FIELD_TYPES.TEXT, label: '姓名', required: true }
    const result = exportToJsonSchema([field])
    expect(result.required).toEqual(['f1'])
  })

  it('should export number field with min/max', () => {
    const field = { id: 'f1', type: FIELD_TYPES.NUMBER, label: '年龄', required: false, min: 0, max: 150 }
    const result = exportToJsonSchema([field])
    expect(result.properties.f1.type).toBe('number')
    expect(result.properties.f1.minimum).toBe(0)
    expect(result.properties.f1.maximum).toBe(150)
  })

  it('should export number field without min/max when null', () => {
    const field = { id: 'f1', type: FIELD_TYPES.NUMBER, label: '年龄', required: false, min: null, max: null }
    const result = exportToJsonSchema([field])
    expect(result.properties.f1.type).toBe('number')
    expect(result.properties.f1.minimum).toBeUndefined()
    expect(result.properties.f1.maximum).toBeUndefined()
  })

  it('should export date field with date format', () => {
    const field = { id: 'f1', type: FIELD_TYPES.DATE, label: '生日', required: false }
    const result = exportToJsonSchema([field])
    expect(result.properties.f1.type).toBe('string')
    expect(result.properties.f1.format).toBe('date')
  })

  it('should export switch field as boolean', () => {
    const field = { id: 'f1', type: FIELD_TYPES.SWITCH, label: '同意', required: false }
    const result = exportToJsonSchema([field])
    expect(result.properties.f1.type).toBe('boolean')
  })

  it('should export select field with enum', () => {
    const field = {
      id: 'f1',
      type: FIELD_TYPES.SELECT,
      label: '城市',
      required: false,
      options: [
        { label: '北京', value: 'bj' },
        { label: '上海', value: 'sh' },
      ],
    }
    const result = exportToJsonSchema([field])
    expect(result.properties.f1.type).toBe('string')
    expect(result.properties.f1.enum).toEqual(['bj', 'sh'])
  })

  it('should export radio field with enum', () => {
    const field = {
      id: 'f1',
      type: FIELD_TYPES.RADIO,
      label: '性别',
      required: false,
      options: [
        { label: '男', value: 'm' },
        { label: '女', value: 'f' },
      ],
    }
    const result = exportToJsonSchema([field])
    expect(result.properties.f1.type).toBe('string')
    expect(result.properties.f1.enum).toEqual(['m', 'f'])
  })

  it('should export checkbox field as array with uniqueItems', () => {
    const field = {
      id: 'f1',
      type: FIELD_TYPES.CHECKBOX,
      label: '爱好',
      required: false,
      options: [
        { label: '读书', value: 'read' },
        { label: '运动', value: 'sport' },
      ],
    }
    const result = exportToJsonSchema([field])
    expect(result.properties.f1.type).toBe('array')
    expect(result.properties.f1.items.type).toBe('string')
    expect(result.properties.f1.items.enum).toEqual(['read', 'sport'])
    expect(result.properties.f1.uniqueItems).toBe(true)
  })

  it('should export textarea field as string', () => {
    const field = { id: 'f1', type: FIELD_TYPES.TEXTAREA, label: '简介', required: false, placeholder: '' }
    const result = exportToJsonSchema([field])
    expect(result.properties.f1.type).toBe('string')
  })

  it('should handle empty options array gracefully', () => {
    const field = { id: 'f1', type: FIELD_TYPES.SELECT, label: '空', required: false, options: [] }
    const result = exportToJsonSchema([field])
    expect(result.properties.f1.enum).toBeUndefined()
  })
})

describe('option manipulation functions', () => {
  describe('addOption', () => {
    it('should return field as-is when null or no options', () => {
      expect(addOption(null)).toBe(null)
      expect(addOption({ id: 'a' })).toEqual({ id: 'a' })
    })

    it('should add a new option incrementing index', () => {
      const field = {
        id: 'a',
        options: [
          { label: '选项1', value: 'option1' },
        ],
      }
      const result = addOption(field)
      expect(result.options).toHaveLength(2)
      expect(result.options[1]).toEqual({ label: '选项2', value: 'option2' })
    })

    it('should not produce duplicate option values after delete and add', () => {
      let field = {
        id: 'a',
        options: [
          { label: '选项1', value: 'option1' },
          { label: '选项2', value: 'option2' },
          { label: '选项3', value: 'option3' },
        ],
      }
      field = deleteOption(field, 1)
      expect(field.options.map((o) => o.value)).toEqual(['option1', 'option3'])
      field = addOption(field)
      const values = field.options.map((o) => o.value)
      const uniqueValues = new Set(values)
      expect(values.length).toBe(uniqueValues.size)
      expect(values).toEqual(['option1', 'option3', 'option4'])
    })

    it('should handle non-standard option values correctly', () => {
      const field = {
        id: 'a',
        options: [
          { label: '自定义', value: 'custom-value' },
        ],
      }
      const result = addOption(field)
      expect(result.options).toHaveLength(2)
      expect(result.options[1].value).toBe('option1')
    })

    it('should not mutate original field', () => {
      const field = { id: 'a', options: [] }
      const original = [...field.options]
      addOption(field)
      expect(field.options).toEqual(original)
    })
  })

  describe('updateOption', () => {
    it('should return field as-is for invalid input', () => {
      expect(updateOption(null, 0, {})).toBe(null)
      expect(updateOption({ id: 'a' }, 0, {})).toEqual({ id: 'a' })
    })

    it('should return field as-is for invalid index', () => {
      const field = { id: 'a', options: [{ label: 'a' }] }
      expect(updateOption(field, -1, { label: 'b' })).toBe(field)
      expect(updateOption(field, 99, { label: 'b' })).toBe(field)
    })

    it('should update option at index', () => {
      const field = {
        id: 'a',
        options: [
          { label: '选项1', value: 'option1' },
          { label: '选项2', value: 'option2' },
        ],
      }
      const result = updateOption(field, 0, { label: '新标签', value: 'new' })
      expect(result.options[0]).toEqual({ label: '新标签', value: 'new' })
      expect(result.options[1]).toEqual({ label: '选项2', value: 'option2' })
    })
  })

  describe('deleteOption', () => {
    it('should return field as-is for invalid input', () => {
      expect(deleteOption(null, 0)).toBe(null)
      expect(deleteOption({ id: 'a' }, 0)).toEqual({ id: 'a' })
    })

    it('should return field as-is for invalid index', () => {
      const field = { id: 'a', options: [{ label: 'a' }] }
      expect(deleteOption(field, -1, {})).toBe(field)
      expect(deleteOption(field, 99, {})).toBe(field)
    })

    it('should delete option at index', () => {
      const field = {
        id: 'a',
        options: [
          { label: '选项1', value: 'option1' },
          { label: '选项2', value: 'option2' },
        ],
      }
      const result = deleteOption(field, 0)
      expect(result.options).toHaveLength(1)
      expect(result.options[0]).toEqual({ label: '选项2', value: 'option2' })
    })

    it('should not mutate original field', () => {
      const field = {
        id: 'a',
        options: [{ label: 'a' }, { label: 'b' }],
      }
      deleteOption(field, 0)
      expect(field.options).toHaveLength(2)
    })
  })
})
