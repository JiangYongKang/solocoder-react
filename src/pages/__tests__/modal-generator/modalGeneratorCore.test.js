import { describe, it, expect } from 'vitest'
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
} from '../../modal-generator/constants'
import {
  createDefaultFormFields,
  createDefaultConfig,
  createConfigByType,
  getAnimationClass,
  clampWidth,
  clampMaskOpacity,
  clampAnimationDuration,
  clampFormFieldCount,
  updateFormFieldsCount,
  updateFormField,
  isValidHexColor,
  generateCallCode,
  getAnimationStyle,
  hasConfirmButton,
  hasCancelButton,
  hasFormFields,
  highlightSyntax,
  hasButtonColor,
} from '../../modal-generator/modalGeneratorCore'

describe('MODAL_TYPES', () => {
  it('should contain all 4 modal types', () => {
    expect(Object.keys(MODAL_TYPES)).toHaveLength(4)
    expect(MODAL_TYPES.CONFIRM).toBe('confirm')
    expect(MODAL_TYPES.ALERT).toBe('alert')
    expect(MODAL_TYPES.FORM).toBe('form')
    expect(MODAL_TYPES.INFO).toBe('info')
  })
})

describe('ANIMATION_TYPES', () => {
  it('should contain all 6 animation types', () => {
    expect(Object.keys(ANIMATION_TYPES)).toHaveLength(6)
    expect(ANIMATION_TYPES.FADE).toBe('fade')
    expect(ANIMATION_TYPES.SLIDE_TOP).toBe('slideTop')
    expect(ANIMATION_TYPES.SLIDE_BOTTOM).toBe('slideBottom')
    expect(ANIMATION_TYPES.SCALE).toBe('scale')
    expect(ANIMATION_TYPES.SLIDE_LEFT).toBe('slideLeft')
    expect(ANIMATION_TYPES.SLIDE_RIGHT).toBe('slideRight')
  })
})

describe('PRESET_COLORS', () => {
  it('should contain 8 preset colors', () => {
    expect(PRESET_COLORS).toHaveLength(8)
    PRESET_COLORS.forEach((color) => {
      expect(isValidHexColor(color)).toBe(true)
    })
  })
})

describe('createDefaultFormFields', () => {
  it('should create default number of form fields when no argument', () => {
    const fields = createDefaultFormFields()
    expect(Array.isArray(fields)).toBe(true)
    expect(fields).toHaveLength(DEFAULT_FORM_FIELDS)
  })

  it('should create specified number of form fields', () => {
    const fields = createDefaultFormFields(3)
    expect(fields).toHaveLength(3)
  })

  it('should clamp to min form fields', () => {
    const fields = createDefaultFormFields(0)
    expect(fields).toHaveLength(MIN_FORM_FIELDS)
  })

  it('should clamp to max form fields', () => {
    const fields = createDefaultFormFields(100)
    expect(fields).toHaveLength(MAX_FORM_FIELDS)
  })

  it('should handle negative numbers', () => {
    const fields = createDefaultFormFields(-5)
    expect(fields).toHaveLength(MIN_FORM_FIELDS)
  })

  it('should handle non-number input', () => {
    const fields = createDefaultFormFields('abc')
    expect(fields).toHaveLength(DEFAULT_FORM_FIELDS)
  })

  it('should handle null input', () => {
    const fields = createDefaultFormFields(null)
    expect(fields).toHaveLength(DEFAULT_FORM_FIELDS)
  })

  it('should create fields with id, label, and placeholder', () => {
    const fields = createDefaultFormFields(2)
    expect(fields[0]).toHaveProperty('id')
    expect(fields[0]).toHaveProperty('label')
    expect(fields[0]).toHaveProperty('placeholder')
    expect(typeof fields[0].id).toBe('string')
    expect(typeof fields[0].label).toBe('string')
    expect(typeof fields[0].placeholder).toBe('string')
  })

  it('should generate unique ids for each field', () => {
    const fields = createDefaultFormFields(5)
    const ids = fields.map((f) => f.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(5)
  })
})

describe('createDefaultConfig', () => {
  it('should return a complete default config object', () => {
    const config = createDefaultConfig()
    expect(config).toHaveProperty('type', MODAL_TYPES.CONFIRM)
    expect(config).toHaveProperty('title', DEFAULT_TITLE)
    expect(config).toHaveProperty('content', DEFAULT_CONTENT)
    expect(config).toHaveProperty('width', DEFAULT_WIDTH)
    expect(config).toHaveProperty('confirmText', DEFAULT_CONFIRM_TEXT)
    expect(config).toHaveProperty('cancelText', DEFAULT_CANCEL_TEXT)
    expect(config).toHaveProperty('confirmColor', PRESET_COLORS[0])
    expect(config).toHaveProperty('cancelColor', PRESET_COLORS[7])
    expect(config).toHaveProperty('maskOpacity', DEFAULT_MASK_OPACITY)
    expect(config).toHaveProperty('closeOnMaskClick', true)
    expect(config).toHaveProperty('showCloseButton', true)
    expect(config).toHaveProperty('animation', ANIMATION_TYPES.FADE)
    expect(config).toHaveProperty('animationDuration', DEFAULT_ANIMATION_DURATION)
    expect(config).toHaveProperty('formFields')
    expect(Array.isArray(config.formFields)).toBe(true)
  })

  it('should return new object each call', () => {
    const config1 = createDefaultConfig()
    const config2 = createDefaultConfig()
    expect(config1).not.toBe(config2)
  })
})

describe('createConfigByType', () => {
  it('should create confirm type config', () => {
    const config = createConfigByType(MODAL_TYPES.CONFIRM)
    expect(config.type).toBe(MODAL_TYPES.CONFIRM)
    expect(config.showCloseButton).toBe(true)
  })

  it('should create alert type config', () => {
    const config = createConfigByType(MODAL_TYPES.ALERT)
    expect(config.type).toBe(MODAL_TYPES.ALERT)
    expect(config.showCloseButton).toBe(true)
  })

  it('should create form type config with form fields', () => {
    const config = createConfigByType(MODAL_TYPES.FORM)
    expect(config.type).toBe(MODAL_TYPES.FORM)
    expect(config.title).toBe('表单弹窗')
    expect(config.content).toBe('请填写以下信息：')
    expect(Array.isArray(config.formFields)).toBe(true)
    expect(config.formFields).toHaveLength(DEFAULT_FORM_FIELDS)
  })

  it('should create info type config', () => {
    const config = createConfigByType(MODAL_TYPES.INFO)
    expect(config.type).toBe(MODAL_TYPES.INFO)
    expect(config.title).toBe('信息提示')
    expect(config.showCloseButton).toBe(true)
  })

  it('should return default config for unknown type', () => {
    const config = createConfigByType('unknown')
    expect(config.type).toBe('unknown')
    expect(config.title).toBe(DEFAULT_TITLE)
  })
})

describe('getAnimationClass', () => {
  it('should return correct class for fade animation', () => {
    expect(getAnimationClass(ANIMATION_TYPES.FADE)).toBe(ANIMATION_CLASS_MAP[ANIMATION_TYPES.FADE])
  })

  it('should return correct class for slideTop animation', () => {
    expect(getAnimationClass(ANIMATION_TYPES.SLIDE_TOP)).toBe(ANIMATION_CLASS_MAP[ANIMATION_TYPES.SLIDE_TOP])
  })

  it('should return correct class for slideBottom animation', () => {
    expect(getAnimationClass(ANIMATION_TYPES.SLIDE_BOTTOM)).toBe(ANIMATION_CLASS_MAP[ANIMATION_TYPES.SLIDE_BOTTOM])
  })

  it('should return correct class for scale animation', () => {
    expect(getAnimationClass(ANIMATION_TYPES.SCALE)).toBe(ANIMATION_CLASS_MAP[ANIMATION_TYPES.SCALE])
  })

  it('should return correct class for slideLeft animation', () => {
    expect(getAnimationClass(ANIMATION_TYPES.SLIDE_LEFT)).toBe(ANIMATION_CLASS_MAP[ANIMATION_TYPES.SLIDE_LEFT])
  })

  it('should return correct class for slideRight animation', () => {
    expect(getAnimationClass(ANIMATION_TYPES.SLIDE_RIGHT)).toBe(ANIMATION_CLASS_MAP[ANIMATION_TYPES.SLIDE_RIGHT])
  })

  it('should return fade class for unknown animation type', () => {
    expect(getAnimationClass('unknown')).toBe(ANIMATION_CLASS_MAP[ANIMATION_TYPES.FADE])
  })
})

describe('clampWidth', () => {
  it('should return default width for invalid input', () => {
    expect(clampWidth('abc')).toBe(DEFAULT_WIDTH)
    expect(clampWidth(null)).toBe(DEFAULT_WIDTH)
    expect(clampWidth(undefined)).toBe(DEFAULT_WIDTH)
  })

  it('should clamp to min width', () => {
    expect(clampWidth(0)).toBe(MIN_WIDTH)
    expect(clampWidth(100)).toBe(MIN_WIDTH)
    expect(clampWidth(-50)).toBe(MIN_WIDTH)
  })

  it('should clamp to max width', () => {
    expect(clampWidth(1000)).toBe(MAX_WIDTH)
    expect(clampWidth(9999)).toBe(MAX_WIDTH)
  })

  it('should return same value within range', () => {
    expect(clampWidth(400)).toBe(400)
    expect(clampWidth(500)).toBe(500)
    expect(clampWidth(MIN_WIDTH)).toBe(MIN_WIDTH)
    expect(clampWidth(MAX_WIDTH)).toBe(MAX_WIDTH)
  })

  it('should handle string numbers', () => {
    expect(clampWidth('400')).toBe(400)
  })
})

describe('clampMaskOpacity', () => {
  it('should return default opacity for invalid input', () => {
    expect(clampMaskOpacity('abc')).toBe(DEFAULT_MASK_OPACITY)
    expect(clampMaskOpacity(null)).toBe(DEFAULT_MASK_OPACITY)
  })

  it('should clamp to min opacity', () => {
    expect(clampMaskOpacity(-10)).toBe(MIN_MASK_OPACITY)
    expect(clampMaskOpacity(-100)).toBe(MIN_MASK_OPACITY)
  })

  it('should clamp to max opacity', () => {
    expect(clampMaskOpacity(150)).toBe(MAX_MASK_OPACITY)
    expect(clampMaskOpacity(999)).toBe(MAX_MASK_OPACITY)
  })

  it('should return same value within range', () => {
    expect(clampMaskOpacity(0)).toBe(0)
    expect(clampMaskOpacity(50)).toBe(50)
    expect(clampMaskOpacity(100)).toBe(100)
  })
})

describe('clampAnimationDuration', () => {
  it('should return default duration for invalid input', () => {
    expect(clampAnimationDuration('abc')).toBe(DEFAULT_ANIMATION_DURATION)
    expect(clampAnimationDuration(null)).toBe(DEFAULT_ANIMATION_DURATION)
  })

  it('should clamp to min duration', () => {
    expect(clampAnimationDuration(0)).toBe(MIN_ANIMATION_DURATION)
    expect(clampAnimationDuration(50)).toBe(MIN_ANIMATION_DURATION)
  })

  it('should clamp to max duration', () => {
    expect(clampAnimationDuration(2000)).toBe(MAX_ANIMATION_DURATION)
    expect(clampAnimationDuration(5000)).toBe(MAX_ANIMATION_DURATION)
  })

  it('should return same value within range', () => {
    expect(clampAnimationDuration(300)).toBe(300)
    expect(clampAnimationDuration(500)).toBe(500)
    expect(clampAnimationDuration(MIN_ANIMATION_DURATION)).toBe(MIN_ANIMATION_DURATION)
    expect(clampAnimationDuration(MAX_ANIMATION_DURATION)).toBe(MAX_ANIMATION_DURATION)
  })
})

describe('clampFormFieldCount', () => {
  it('should return default count for invalid input', () => {
    expect(clampFormFieldCount('abc')).toBe(DEFAULT_FORM_FIELDS)
    expect(clampFormFieldCount(null)).toBe(DEFAULT_FORM_FIELDS)
  })

  it('should clamp to min count', () => {
    expect(clampFormFieldCount(0)).toBe(MIN_FORM_FIELDS)
    expect(clampFormFieldCount(-5)).toBe(MIN_FORM_FIELDS)
  })

  it('should clamp to max count', () => {
    expect(clampFormFieldCount(10)).toBe(MAX_FORM_FIELDS)
    expect(clampFormFieldCount(100)).toBe(MAX_FORM_FIELDS)
  })

  it('should return integer value', () => {
    expect(Number.isInteger(clampFormFieldCount(2.5))).toBe(true)
    expect(clampFormFieldCount(2.7)).toBe(2)
  })

  it('should return same value within range', () => {
    expect(clampFormFieldCount(1)).toBe(1)
    expect(clampFormFieldCount(3)).toBe(3)
    expect(clampFormFieldCount(5)).toBe(5)
  })
})

describe('updateFormFieldsCount', () => {
  it('should return new fields array for null formFields', () => {
    const result = updateFormFieldsCount(null, 3)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(3)
  })

  it('should add fields when increasing count', () => {
    const fields = createDefaultFormFields(2)
    const result = updateFormFieldsCount(fields, 4)
    expect(result).toHaveLength(4)
    expect(result[0].id).toBe(fields[0].id)
    expect(result[1].id).toBe(fields[1].id)
  })

  it('should remove fields when decreasing count', () => {
    const fields = createDefaultFormFields(5)
    const result = updateFormFieldsCount(fields, 2)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(fields[0].id)
    expect(result[1].id).toBe(fields[1].id)
  })

  it('should not mutate original array', () => {
    const fields = createDefaultFormFields(3)
    const original = [...fields]
    updateFormFieldsCount(fields, 5)
    expect(fields).toHaveLength(3)
    expect(fields).toEqual(original)
  })

  it('should return same length for same count', () => {
    const fields = createDefaultFormFields(3)
    const result = updateFormFieldsCount(fields, 3)
    expect(result).toHaveLength(3)
  })
})

describe('updateFormField', () => {
  it('should return empty array for null input', () => {
    expect(updateFormField(null, 'id', {})).toEqual([])
  })

  it('should update field by id', () => {
    const fields = [
      { id: 'f1', label: 'Old Label', placeholder: 'Old Placeholder' },
      { id: 'f2', label: 'Label 2', placeholder: 'Placeholder 2' },
    ]
    const result = updateFormField(fields, 'f1', { label: 'New Label' })
    expect(result[0].label).toBe('New Label')
    expect(result[0].placeholder).toBe('Old Placeholder')
    expect(result[1].label).toBe('Label 2')
  })

  it('should return same array when id not found', () => {
    const fields = [{ id: 'f1', label: 'A' }]
    const result = updateFormField(fields, 'nonexistent', { label: 'B' })
    expect(result).toEqual(fields)
  })

  it('should not mutate original array', () => {
    const fields = [{ id: 'f1', label: 'Old' }]
    updateFormField(fields, 'f1', { label: 'New' })
    expect(fields[0].label).toBe('Old')
  })
})

describe('isValidHexColor', () => {
  it('should return true for valid 3-digit hex colors', () => {
    expect(isValidHexColor('#fff')).toBe(true)
    expect(isValidHexColor('#000')).toBe(true)
    expect(isValidHexColor('#abc')).toBe(true)
  })

  it('should return true for valid 6-digit hex colors', () => {
    expect(isValidHexColor('#ffffff')).toBe(true)
    expect(isValidHexColor('#000000')).toBe(true)
    expect(isValidHexColor('#3b82f6')).toBe(true)
    expect(isValidHexColor('#3B82F6')).toBe(true)
  })

  it('should return false for invalid hex colors', () => {
    expect(isValidHexColor('red')).toBe(false)
    expect(isValidHexColor('#ggg')).toBe(false)
    expect(isValidHexColor('#12345')).toBe(false)
    expect(isValidHexColor('#1234567')).toBe(false)
    expect(isValidHexColor('123456')).toBe(false)
  })

  it('should return false for non-string input', () => {
    expect(isValidHexColor(null)).toBe(false)
    expect(isValidHexColor(undefined)).toBe(false)
    expect(isValidHexColor(123)).toBe(false)
    expect(isValidHexColor({})).toBe(false)
  })
})

describe('generateCallCode', () => {
  it('should return basic openModal call for null config', () => {
    const code = generateCallCode(null)
    expect(code).toContain("openModal(")
    expect(code).toContain("type: 'confirm'")
  })

  it('should generate code with type and title', () => {
    const config = { type: MODAL_TYPES.ALERT, title: '提示' }
    const code = generateCallCode(config)
    expect(code).toContain("type: 'alert'")
    expect(code).toContain("title: '提示'")
  })

  it('should escape special characters in strings', () => {
    const config = { type: MODAL_TYPES.CONFIRM, title: "it's test", content: 'line1\nline2' }
    const code = generateCallCode(config)
    expect(code).toContain("title: 'it\\'s test'")
    expect(code).toContain("content: 'line1\\nline2'")
  })

  it('should include width property', () => {
    const config = { type: MODAL_TYPES.CONFIRM, width: 500 }
    const code = generateCallCode(config)
    expect(code).toContain('width: 500')
  })

  it('should include confirm and cancel text for confirm type', () => {
    const config = {
      type: MODAL_TYPES.CONFIRM,
      confirmText: '好的',
      cancelText: '算了',
    }
    const code = generateCallCode(config)
    expect(code).toContain("confirmText: '好的'")
    expect(code).toContain("cancelText: '算了'")
  })

  it('should include confirm text but not cancel for alert type', () => {
    const config = {
      type: MODAL_TYPES.ALERT,
      confirmText: '知道了',
      cancelText: '取消',
    }
    const code = generateCallCode(config)
    expect(code).toContain("confirmText: '知道了'")
    expect(code).not.toContain("cancelText:")
  })

  it('should include form fields for form type', () => {
    const config = {
      type: MODAL_TYPES.FORM,
      formFields: [
        { label: '姓名', placeholder: '请输入姓名' },
        { label: '邮箱', placeholder: '请输入邮箱' },
      ],
    }
    const code = generateCallCode(config)
    expect(code).toContain('formFields:')
    expect(code).toContain("label: '姓名'")
    expect(code).toContain("placeholder: '请输入姓名'")
    expect(code).toContain("label: '邮箱'")
  })

  it('should include mask settings', () => {
    const config = {
      type: MODAL_TYPES.CONFIRM,
      maskOpacity: 70,
      closeOnMaskClick: false,
    }
    const code = generateCallCode(config)
    expect(code).toContain('maskOpacity: 70')
    expect(code).toContain('closeOnMaskClick: false')
  })

  it('should include showCloseButton', () => {
    const config = { type: MODAL_TYPES.INFO, showCloseButton: true }
    const code = generateCallCode(config)
    expect(code).toContain('showCloseButton: true')
  })

  it('should include animation settings', () => {
    const config = {
      type: MODAL_TYPES.CONFIRM,
      animation: ANIMATION_TYPES.SCALE,
      animationDuration: 500,
    }
    const code = generateCallCode(config)
    expect(code).toContain("animation: 'scale'")
    expect(code).toContain('animationDuration: 500')
  })

  it('should include button colors', () => {
    const config = {
      type: MODAL_TYPES.CONFIRM,
      confirmColor: '#ff0000',
      cancelColor: '#00ff00',
    }
    const code = generateCallCode(config)
    expect(code).toContain("confirmColor: '#ff0000'")
    expect(code).toContain("cancelColor: '#00ff00'")
  })

  it('should close with })', () => {
    const config = createDefaultConfig()
    const code = generateCallCode(config)
    expect(code.endsWith('})')).toBe(true)
  })
})

describe('getAnimationStyle', () => {
  it('should return style object with animationDuration', () => {
    const style = getAnimationStyle(ANIMATION_TYPES.FADE, 300)
    expect(style).toHaveProperty('animationDuration')
    expect(typeof style.animationDuration).toBe('string')
    expect(style.animationDuration).toContain('ms')
  })

  it('should use clamped duration', () => {
    const style = getAnimationStyle(ANIMATION_TYPES.FADE, 9999)
    expect(style.animationDuration).toBe(`${MAX_ANIMATION_DURATION}ms`)
  })
})

describe('hasConfirmButton', () => {
  it('should return true for confirm type', () => {
    expect(hasConfirmButton(MODAL_TYPES.CONFIRM)).toBe(true)
  })

  it('should return true for alert type', () => {
    expect(hasConfirmButton(MODAL_TYPES.ALERT)).toBe(true)
  })

  it('should return true for form type', () => {
    expect(hasConfirmButton(MODAL_TYPES.FORM)).toBe(true)
  })

  it('should return false for info type', () => {
    expect(hasConfirmButton(MODAL_TYPES.INFO)).toBe(false)
  })
})

describe('hasCancelButton', () => {
  it('should return true for confirm type', () => {
    expect(hasCancelButton(MODAL_TYPES.CONFIRM)).toBe(true)
  })

  it('should return false for alert type', () => {
    expect(hasCancelButton(MODAL_TYPES.ALERT)).toBe(false)
  })

  it('should return true for form type', () => {
    expect(hasCancelButton(MODAL_TYPES.FORM)).toBe(true)
  })

  it('should return false for info type', () => {
    expect(hasCancelButton(MODAL_TYPES.INFO)).toBe(false)
  })
})

describe('hasFormFields', () => {
  it('should return false for confirm type', () => {
    expect(hasFormFields(MODAL_TYPES.CONFIRM)).toBe(false)
  })

  it('should return false for alert type', () => {
    expect(hasFormFields(MODAL_TYPES.ALERT)).toBe(false)
  })

  it('should return true for form type', () => {
    expect(hasFormFields(MODAL_TYPES.FORM)).toBe(true)
  })

  it('should return false for info type', () => {
    expect(hasFormFields(MODAL_TYPES.INFO)).toBe(false)
  })
})

describe('hasButtonColor', () => {
  it('should return true for confirm type', () => {
    expect(hasButtonColor(MODAL_TYPES.CONFIRM)).toBe(true)
  })

  it('should return true for alert type', () => {
    expect(hasButtonColor(MODAL_TYPES.ALERT)).toBe(true)
  })

  it('should return true for form type', () => {
    expect(hasButtonColor(MODAL_TYPES.FORM)).toBe(true)
  })

  it('should return false for info type', () => {
    expect(hasButtonColor(MODAL_TYPES.INFO)).toBe(false)
  })
})

describe('generateCallCode - info type color fields', () => {
  it('should not include confirmColor for info type', () => {
    const config = {
      type: MODAL_TYPES.INFO,
      title: '提示',
      content: '内容',
      confirmColor: '#ff0000',
      cancelColor: '#00ff00',
    }
    const code = generateCallCode(config)
    expect(code).not.toContain('confirmColor')
    expect(code).not.toContain('cancelColor')
  })

  it('should include confirmColor and cancelColor for confirm type', () => {
    const config = {
      type: MODAL_TYPES.CONFIRM,
      confirmColor: '#ff0000',
      cancelColor: '#00ff00',
    }
    const code = generateCallCode(config)
    expect(code).toContain('confirmColor')
    expect(code).toContain('cancelColor')
  })

  it('should include confirmColor but not cancelColor for alert type', () => {
    const config = {
      type: MODAL_TYPES.ALERT,
      confirmColor: '#ff0000',
      cancelColor: '#00ff00',
    }
    const code = generateCallCode(config)
    expect(code).toContain('confirmColor')
    expect(code).not.toContain('cancelColor')
  })
})

describe('highlightSyntax', () => {
  it('should return empty array for empty input', () => {
    expect(highlightSyntax('')).toEqual([])
    expect(highlightSyntax(null)).toEqual([])
    expect(highlightSyntax(undefined)).toEqual([])
  })

  it('should tokenize strings', () => {
    const tokens = highlightSyntax("'hello'")
    const stringTokens = tokens.filter((t) => t.type === 'string')
    expect(stringTokens.length).toBeGreaterThan(0)
    expect(stringTokens[0].value).toBe("'hello'")
  })

  it('should tokenize double-quoted strings', () => {
    const tokens = highlightSyntax('"world"')
    const stringTokens = tokens.filter((t) => t.type === 'string')
    expect(stringTokens.length).toBeGreaterThan(0)
    expect(stringTokens[0].value).toBe('"world"')
  })

  it('should tokenize numbers', () => {
    const tokens = highlightSyntax('42')
    const numberTokens = tokens.filter((t) => t.type === 'number')
    expect(numberTokens.length).toBeGreaterThan(0)
    expect(numberTokens[0].value).toBe('42')
  })

  it('should tokenize decimal numbers', () => {
    const tokens = highlightSyntax('3.14')
    const numberTokens = tokens.filter((t) => t.type === 'number')
    expect(numberTokens.length).toBeGreaterThan(0)
    expect(numberTokens[0].value).toBe('3.14')
  })

  it('should tokenize keywords (true/false/null/undefined)', () => {
    const tokens = highlightSyntax('true')
    const keywordTokens = tokens.filter((t) => t.type === 'keyword')
    expect(keywordTokens.length).toBeGreaterThan(0)
    expect(keywordTokens[0].value).toBe('true')
  })

  it('should tokenize false as keyword', () => {
    const tokens = highlightSyntax('false')
    const keywordTokens = tokens.filter((t) => t.type === 'keyword')
    expect(keywordTokens.length).toBeGreaterThan(0)
  })

  it('should tokenize property names followed by colon', () => {
    const tokens = highlightSyntax('name:')
    const propTokens = tokens.filter((t) => t.type === 'property')
    expect(propTokens.length).toBeGreaterThan(0)
    expect(propTokens[0].value).toBe('name')
  })

  it('should tokenize function call (capitalized identifier)', () => {
    const tokens = highlightSyntax('OpenModal')
    const funcTokens = tokens.filter((t) => t.type === 'function')
    expect(funcTokens.length).toBeGreaterThan(0)
  })

  it('should tokenize punctuation', () => {
    const tokens = highlightSyntax('{}')
    const punctTokens = tokens.filter((t) => t.type === 'punctuation')
    expect(punctTokens.length).toBeGreaterThan(0)
  })

  it('should handle strings with escaped quotes', () => {
    const tokens = highlightSyntax("'it\\'s'")
    const stringTokens = tokens.filter((t) => t.type === 'string')
    expect(stringTokens.length).toBeGreaterThan(0)
  })

  it('should produce tokens that can reconstruct the original code', () => {
    const code = "openModal({ title: 'Hello', count: 42 })"
    const tokens = highlightSyntax(code)
    const reconstructed = tokens.map((t) => t.value).join('')
    expect(reconstructed).toBe(code)
  })
})

describe('createConfigByType - form type content', () => {
  it('should have default content for form type', () => {
    const config = createConfigByType(MODAL_TYPES.FORM)
    expect(config.content).toBeTruthy()
    expect(typeof config.content).toBe('string')
    expect(config.content.length).toBeGreaterThan(0)
  })
})
