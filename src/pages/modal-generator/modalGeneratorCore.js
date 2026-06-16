import {
  MODAL_TYPES,
  ANIMATION_TYPES,
  ANIMATION_CLASS_MAP,
  MIN_WIDTH,
  MAX_WIDTH,
  DEFAULT_WIDTH,
  MIN_MASK_OPACITY,
  MAX_MASK_OPACITY,
  DEFAULT_MASK_OPACITY,
  MIN_ANIMATION_DURATION,
  MAX_ANIMATION_DURATION,
  DEFAULT_ANIMATION_DURATION,
  MIN_FORM_FIELDS,
  MAX_FORM_FIELDS,
  DEFAULT_FORM_FIELDS,
  DEFAULT_CONFIRM_TEXT,
  DEFAULT_CANCEL_TEXT,
  DEFAULT_TITLE,
  DEFAULT_CONTENT,
  PRESET_COLORS,
} from './constants'

export function createDefaultFormFields(count = DEFAULT_FORM_FIELDS) {
  const parsed = Number(count)
  const isValid = count !== null && count !== undefined && count !== '' && !Number.isNaN(parsed)
  const num = Math.max(MIN_FORM_FIELDS, Math.min(MAX_FORM_FIELDS, isValid ? parsed : DEFAULT_FORM_FIELDS))
  const fields = []
  for (let i = 0; i < num; i += 1) {
    fields.push({
      id: `field_${i + 1}`,
      label: `输入框${i + 1}`,
      placeholder: `请输入${i + 1}`,
    })
  }
  return fields
}

export function createDefaultConfig() {
  return {
    type: MODAL_TYPES.CONFIRM,
    title: DEFAULT_TITLE,
    content: DEFAULT_CONTENT,
    width: DEFAULT_WIDTH,
    confirmText: DEFAULT_CONFIRM_TEXT,
    cancelText: DEFAULT_CANCEL_TEXT,
    confirmColor: PRESET_COLORS[0],
    cancelColor: PRESET_COLORS[7],
    maskOpacity: DEFAULT_MASK_OPACITY,
    closeOnMaskClick: true,
    showCloseButton: true,
    animation: ANIMATION_TYPES.FADE,
    animationDuration: DEFAULT_ANIMATION_DURATION,
    formFields: createDefaultFormFields(DEFAULT_FORM_FIELDS),
  }
}

export function createConfigByType(type) {
  const base = createDefaultConfig()
  const config = { ...base, type }

  switch (type) {
    case MODAL_TYPES.ALERT:
      config.showCloseButton = true
      break
    case MODAL_TYPES.FORM:
      config.formFields = createDefaultFormFields(DEFAULT_FORM_FIELDS)
      config.title = '表单弹窗'
      config.content = '请填写以下信息：'
      break
    case MODAL_TYPES.INFO:
      config.showCloseButton = true
      config.title = '信息提示'
      config.content = '这是一条信息提示。'
      break
    case MODAL_TYPES.CONFIRM:
    default:
      break
  }

  return config
}

export function getAnimationClass(animationType) {
  return ANIMATION_CLASS_MAP[animationType] || ANIMATION_CLASS_MAP[ANIMATION_TYPES.FADE]
}

export function clampWidth(width) {
  const parsed = Number(width)
  const isValid = width !== null && width !== undefined && width !== '' && !Number.isNaN(parsed)
  const num = isValid ? parsed : DEFAULT_WIDTH
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, num))
}

export function clampMaskOpacity(opacity) {
  const parsed = Number(opacity)
  const isValid = opacity !== null && opacity !== undefined && opacity !== '' && !Number.isNaN(parsed)
  const num = isValid ? parsed : DEFAULT_MASK_OPACITY
  return Math.max(MIN_MASK_OPACITY, Math.min(MAX_MASK_OPACITY, num))
}

export function clampAnimationDuration(duration) {
  const parsed = Number(duration)
  const isValid = duration !== null && duration !== undefined && duration !== '' && !Number.isNaN(parsed)
  const num = isValid ? parsed : DEFAULT_ANIMATION_DURATION
  return Math.max(MIN_ANIMATION_DURATION, Math.min(MAX_ANIMATION_DURATION, num))
}

export function clampFormFieldCount(count) {
  const parsed = Number(count)
  const isValid = count !== null && count !== undefined && count !== '' && !Number.isNaN(parsed)
  const num = isValid ? parsed : DEFAULT_FORM_FIELDS
  return Math.max(MIN_FORM_FIELDS, Math.min(MAX_FORM_FIELDS, Math.floor(num)))
}

export function updateFormFieldsCount(formFields, newCount) {
  if (!Array.isArray(formFields)) {
    return createDefaultFormFields(newCount)
  }

  const count = clampFormFieldCount(newCount)
  const current = [...formFields]

  if (current.length > count) {
    return current.slice(0, count)
  }

  while (current.length < count) {
    const idx = current.length + 1
    current.push({
      id: `field_${idx}`,
      label: `输入框${idx}`,
      placeholder: `请输入${idx}`,
    })
  }

  return current
}

export function updateFormField(formFields, fieldId, updates) {
  if (!Array.isArray(formFields)) return []
  return formFields.map((field) => {
    if (field.id === fieldId) {
      return { ...field, ...updates }
    }
    return field
  })
}

export function isValidHexColor(color) {
  if (typeof color !== 'string') return false
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)
}

function escapeString(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
}

export function generateCallCode(config) {
  if (!config || typeof config !== 'object') {
    return "openModal({ type: 'confirm' })"
  }

  const lines = []
  lines.push('openModal({')

  lines.push(`  type: '${config.type || 'confirm'}',`)

  if (config.title !== undefined && config.title !== null) {
    lines.push(`  title: '${escapeString(String(config.title))}',`)
  }

  if (config.content !== undefined && config.content !== null) {
    lines.push(`  content: '${escapeString(String(config.content))}',`)
  }

  if (config.width !== undefined && config.width !== null) {
    lines.push(`  width: ${clampWidth(config.width)},`)
  }

  if (config.type === MODAL_TYPES.CONFIRM || config.type === MODAL_TYPES.FORM) {
    if (config.confirmText !== undefined && config.confirmText !== null) {
      lines.push(`  confirmText: '${escapeString(String(config.confirmText))}',`)
    }
    if (config.cancelText !== undefined && config.cancelText !== null) {
      lines.push(`  cancelText: '${escapeString(String(config.cancelText))}',`)
    }
  } else if (config.type === MODAL_TYPES.ALERT) {
    if (config.confirmText !== undefined && config.confirmText !== null) {
      lines.push(`  confirmText: '${escapeString(String(config.confirmText))}',`)
    }
  }

  if (hasButtonColor(config.type)) {
    if (config.confirmColor !== undefined && config.confirmColor !== null) {
      lines.push(`  confirmColor: '${escapeString(String(config.confirmColor))}',`)
    }

    if (hasCancelButton(config.type) && config.cancelColor !== undefined && config.cancelColor !== null) {
      lines.push(`  cancelColor: '${escapeString(String(config.cancelColor))}',`)
    }
  }

  if (config.maskOpacity !== undefined && config.maskOpacity !== null) {
    lines.push(`  maskOpacity: ${clampMaskOpacity(config.maskOpacity)},`)
  }

  if (config.closeOnMaskClick !== undefined) {
    lines.push(`  closeOnMaskClick: ${config.closeOnMaskClick},`)
  }

  if (config.showCloseButton !== undefined) {
    lines.push(`  showCloseButton: ${config.showCloseButton},`)
  }

  if (config.animation !== undefined && config.animation !== null) {
    lines.push(`  animation: '${escapeString(String(config.animation))}',`)
  }

  if (config.animationDuration !== undefined && config.animationDuration !== null) {
    lines.push(`  animationDuration: ${clampAnimationDuration(config.animationDuration)},`)
  }

  if (config.type === MODAL_TYPES.FORM && Array.isArray(config.formFields) && config.formFields.length > 0) {
    lines.push('  formFields: [')
    config.formFields.forEach((field) => {
      lines.push('    {')
      lines.push(`      label: '${escapeString(String(field.label || ''))}',`)
      lines.push(`      placeholder: '${escapeString(String(field.placeholder || ''))}',`)
      lines.push('    },')
    })
    lines.push('  ],')
  }

  lines.push('})')

  return lines.join('\n')
}

export function getAnimationStyle(animationType, duration) {
  const animDuration = clampAnimationDuration(duration)
  return {
    animationDuration: `${animDuration}ms`,
  }
}

export function hasConfirmButton(type) {
  return type === MODAL_TYPES.CONFIRM || type === MODAL_TYPES.ALERT || type === MODAL_TYPES.FORM
}

export function hasCancelButton(type) {
  return type === MODAL_TYPES.CONFIRM || type === MODAL_TYPES.FORM
}

export function hasFormFields(type) {
  return type === MODAL_TYPES.FORM
}

const JS_KEYWORDS = new Set(['true', 'false', 'null', 'undefined'])

export function highlightSyntax(code) {
  if (!code) return []

  const tokens = []
  let i = 0

  while (i < code.length) {
    const char = code[i]

    if (char === "'" || char === '"') {
      const quote = char
      let j = i + 1
      while (j < code.length && code[j] !== quote) {
        if (code[j] === '\\') {
          j += 2
        } else {
          j += 1
        }
      }
      if (j < code.length) {
        tokens.push({
          type: 'string',
          value: code.slice(i, j + 1),
        })
        i = j + 1
        continue
      }
    }

    if (/[0-9]/.test(char)) {
      let j = i
      while (j < code.length && /[0-9.]/.test(code[j])) {
        j += 1
      }
      tokens.push({
        type: 'number',
        value: code.slice(i, j),
      })
      i = j
      continue
    }

    if (/[a-zA-Z_$]/.test(char)) {
      let j = i
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) {
        j += 1
      }
      const word = code.slice(i, j)
      let type = 'identifier'
      if (JS_KEYWORDS.has(word)) {
        type = 'keyword'
      } else if (/^[a-z][a-zA-Z0-9]*$/.test(word) && code[j] === ':') {
        type = 'property'
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(word)) {
        type = 'function'
      }
      tokens.push({ type, value: word })
      i = j
      continue
    }

    if (char === '/' && code[i + 1] === '/') {
      let j = i
      while (j < code.length && code[j] !== '\n') {
        j += 1
      }
      tokens.push({
        type: 'comment',
        value: code.slice(i, j),
      })
      i = j
      continue
    }

    tokens.push({
      type: 'punctuation',
      value: char,
    })
    i += 1
  }

  return tokens
}

export function hasButtonColor(type) {
  return type === MODAL_TYPES.CONFIRM || type === MODAL_TYPES.ALERT || type === MODAL_TYPES.FORM
}
