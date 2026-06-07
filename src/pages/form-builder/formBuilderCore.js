export const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  DATE: 'date',
  NUMBER: 'number',
  SWITCH: 'switch',
}

export const FIELD_TYPE_LABELS = {
  [FIELD_TYPES.TEXT]: '单行文本框',
  [FIELD_TYPES.TEXTAREA]: '多行文本框',
  [FIELD_TYPES.SELECT]: '下拉选择框',
  [FIELD_TYPES.RADIO]: '单选框组',
  [FIELD_TYPES.CHECKBOX]: '多选框组',
  [FIELD_TYPES.DATE]: '日期选择器',
  [FIELD_TYPES.NUMBER]: '数字输入框',
  [FIELD_TYPES.SWITCH]: '开关',
}

const STORAGE_KEY = 'form-builder-state'
let idCounter = 0

export function generateId() {
  idCounter += 1
  return `field_${Date.now()}_${idCounter}`
}

function getNextOptionIndex(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return 1
  }
  let max = 0
  options.forEach((opt) => {
    if (opt && typeof opt.value === 'string') {
      const match = opt.value.match(/^option(\d+)$/)
      if (match) {
        const num = Number(match[1])
        if (num > max) max = num
      }
    }
  })
  return max + 1
}

export function createField(type) {
  const base = {
    id: generateId(),
    type,
    label: FIELD_TYPE_LABELS[type],
    required: false,
    placeholder: '',
  }

  switch (type) {
    case FIELD_TYPES.SELECT:
    case FIELD_TYPES.RADIO:
    case FIELD_TYPES.CHECKBOX:
      return {
        ...base,
        options: [
          { label: '选项1', value: 'option1' },
          { label: '选项2', value: 'option2' },
        ],
      }
    case FIELD_TYPES.NUMBER:
      return {
        ...base,
        min: null,
        max: null,
      }
    default:
      return base
  }
}

export function reorderFields(fields, fromIndex, toIndex) {
  if (!Array.isArray(fields)) return []
  if (fromIndex < 0 || fromIndex >= fields.length) return fields
  if (toIndex < 0 || toIndex >= fields.length) return fields
  if (fromIndex === toIndex) return fields

  const result = [...fields]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}

export function deleteField(fields, fieldId) {
  if (!Array.isArray(fields)) return []
  return fields.filter((f) => f.id !== fieldId)
}

export function updateField(fields, fieldId, updates) {
  if (!Array.isArray(fields)) return []
  return fields.map((f) =>
    f.id === fieldId ? { ...f, ...updates } : f
  )
}

export function loadFromStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { fields: [] }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { fields: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.fields)) {
      return { fields: [] }
    }
    return parsed
  } catch {
    return { fields: [] }
  }
}

export function saveToStorage(state) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

function buildJsonSchemaForField(field) {
  const schema = {}
  switch (field.type) {
    case FIELD_TYPES.TEXT:
    case FIELD_TYPES.TEXTAREA:
      schema.type = 'string'
      if (field.placeholder) schema.description = field.placeholder
      break
    case FIELD_TYPES.NUMBER:
      schema.type = 'number'
      if (field.min !== null && field.min !== undefined) schema.minimum = field.min
      if (field.max !== null && field.max !== undefined) schema.maximum = field.max
      break
    case FIELD_TYPES.DATE:
      schema.type = 'string'
      schema.format = 'date'
      break
    case FIELD_TYPES.SWITCH:
      schema.type = 'boolean'
      break
    case FIELD_TYPES.SELECT:
    case FIELD_TYPES.RADIO:
      schema.type = 'string'
      if (Array.isArray(field.options) && field.options.length > 0) {
        schema.enum = field.options.map((o) => o.value)
      }
      break
    case FIELD_TYPES.CHECKBOX:
      schema.type = 'array'
      schema.items = { type: 'string' }
      if (Array.isArray(field.options) && field.options.length > 0) {
        schema.items.enum = field.options.map((o) => o.value)
      }
      schema.uniqueItems = true
      break
    default:
      schema.type = 'string'
  }
  return schema
}

export function exportToJsonSchema(fields) {
  const properties = {}
  const required = []

  if (Array.isArray(fields)) {
    fields.forEach((field) => {
      const key = field.id
      properties[key] = {
        title: field.label,
        ...buildJsonSchemaForField(field),
      }
      if (field.required) {
        required.push(key)
      }
    })
  }

  const result = {
    type: 'object',
    properties,
  }
  if (required.length > 0) {
    result.required = required
  }
  return result
}

export function downloadJsonSchema(schema, filename = 'form-schema.json') {
  if (typeof window === 'undefined' || !window.document) {
    return false
  }
  try {
    const jsonStr = JSON.stringify(schema, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

export function addOption(field) {
  if (!field) return field
  if (!Array.isArray(field.options)) return field
  const idx = getNextOptionIndex(field.options)
  return {
    ...field,
    options: [
      ...field.options,
      { label: `选项${idx}`, value: `option${idx}` },
    ],
  }
}

export function updateOption(field, optionIndex, updates) {
  if (!field) return field
  if (!Array.isArray(field.options)) return field
  if (optionIndex < 0 || optionIndex >= field.options.length) return field
  const newOptions = field.options.map((opt, i) =>
    i === optionIndex ? { ...opt, ...updates } : opt
  )
  return { ...field, options: newOptions }
}

export function deleteOption(field, optionIndex) {
  if (!field) return field
  if (!Array.isArray(field.options)) return field
  if (optionIndex < 0 || optionIndex >= field.options.length) return field
  const newOptions = field.options.filter((_, i) => i !== optionIndex)
  return { ...field, options: newOptions }
}
