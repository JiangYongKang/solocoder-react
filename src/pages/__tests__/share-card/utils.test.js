import { describe, it, expect, beforeEach } from 'vitest'
import {
  createDefaultConfig,
  validateConfig,
  sanitizeConfig,
  deepClone,
  deepMerge,
  serializeConfig,
  deserializeConfig,
  getTemplateById,
  applyTemplate,
  switchBackgroundMode,
  getCardDimensions,
  getLayoutConfig,
  calculateLogoPosition,
  calculateQRCodePosition,
  calculateTextPosition,
  getGradientCoords,
  generateQRMatrix,
  wrapText,
  saveLastConfig,
  loadLastConfig,
  loadSavedConfigs,
  saveConfigToList,
  deleteConfigFromList,
  formatTimestamp,
  clamp,
  isValidHexColor,
  isValidColor,
  isRgbaColor,
  generateId,
} from '@/pages/share-card/utils.js'
import {
  DEFAULT_CONFIG,
  TEMPLATES,
  BACKGROUND_MODES,
  GRADIENT_DIRECTIONS,
  STORAGE_KEY_CONFIGS,
} from '@/pages/share-card/constants.js'

function createMockStorage() {
  const store = {}
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

describe('Share Card - Utility Functions', () => {
  describe('generateId', () => {
    it('should generate non-empty string ids', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should generate unique ids', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('clamp', () => {
    it('should return value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
    })

    it('should clamp to min when value is below', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    it('should clamp to max when value is above', () => {
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('should handle boundary values', () => {
      expect(clamp(0, 0, 10)).toBe(0)
      expect(clamp(10, 0, 10)).toBe(10)
    })
  })

  describe('isValidHexColor', () => {
    it('should accept 3-digit hex colors', () => {
      expect(isValidHexColor('#fff')).toBe(true)
      expect(isValidHexColor('#000')).toBe(true)
      expect(isValidHexColor('#abc')).toBe(true)
    })

    it('should accept 6-digit hex colors', () => {
      expect(isValidHexColor('#ffffff')).toBe(true)
      expect(isValidHexColor('#000000')).toBe(true)
      expect(isValidHexColor('#a1b2c3')).toBe(true)
    })

    it('should be case insensitive', () => {
      expect(isValidHexColor('#ABC')).toBe(true)
      expect(isValidHexColor('#ABCDEF')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(isValidHexColor('fff')).toBe(false)
      expect(isValidHexColor('#ffff')).toBe(false)
      expect(isValidHexColor('#ggg')).toBe(false)
      expect(isValidHexColor('#12345g')).toBe(false)
      expect(isValidHexColor('')).toBe(false)
      expect(isValidHexColor(null)).toBe(false)
    })
  })

  describe('isRgbaColor', () => {
    it('should accept rgb format without alpha', () => {
      expect(isRgbaColor('rgb(255,0,0)')).toBe(true)
      expect(isRgbaColor('rgb(0,0,0)')).toBe(true)
      expect(isRgbaColor('rgb(128,128,128)')).toBe(true)
    })

    it('should accept rgba format with alpha channel', () => {
      expect(isRgbaColor('rgba(255,0,0,0.5)')).toBe(true)
      expect(isRgbaColor('rgba(0,0,0,0)')).toBe(true)
      expect(isRgbaColor('rgba(255,255,255,1)')).toBe(true)
      expect(isRgbaColor('rgba(100,150,200,0.75)')).toBe(true)
    })

    it('should accept rgba format without alpha (three arguments)', () => {
      expect(isRgbaColor('rgba(255,0,0)')).toBe(true)
      expect(isRgbaColor('rgba(0,0,0)')).toBe(true)
      expect(isRgbaColor('rgba(128,128,128)')).toBe(true)
    })

    it('should handle spaces around numbers', () => {
      expect(isRgbaColor('rgba( 255 , 0 , 0 , 0.5 )')).toBe(true)
      expect(isRgbaColor('rgb( 255 , 0 , 0 )')).toBe(true)
      expect(isRgbaColor('rgba(   255   ,   0   ,   0   ,   0.5   )')).toBe(true)
      expect(isRgbaColor('rgba( 255 , 0 , 0 )')).toBe(true)
    })

    it('should handle alpha with decimal values', () => {
      expect(isRgbaColor('rgba(255,0,0,0)')).toBe(true)
      expect(isRgbaColor('rgba(255,0,0,1)')).toBe(true)
      expect(isRgbaColor('rgba(255,0,0,0.0)')).toBe(true)
      expect(isRgbaColor('rgba(255,0,0,0.123)')).toBe(true)
      expect(isRgbaColor('rgba(255,0,0,.5)')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(isRgbaColor('#fff')).toBe(false)
      expect(isRgbaColor('red')).toBe(false)
      expect(isRgbaColor('rgba(255,0)')).toBe(false)
      expect(isRgbaColor('rgba(255,0,0,0.5,0.5)')).toBe(false)
      expect(isRgbaColor('rgba(-1,0,0,1)')).toBe(false)
      expect(isRgbaColor('')).toBe(false)
      expect(isRgbaColor(null)).toBe(false)
      expect(isRgbaColor(undefined)).toBe(false)
      expect(isRgbaColor(123)).toBe(false)
    })

    it('should reject invalid characters', () => {
      expect(isRgbaColor('rgba(abc,0,0,1)')).toBe(false)
      expect(isRgbaColor('rgba(255,gg,0,1)')).toBe(false)
      expect(isRgbaColor('rgba[255,0,0,1]')).toBe(false)
      expect(isRgbaColor('rgba{255,0,0,1}')).toBe(false)
    })

    it('should be case sensitive for function name', () => {
      expect(isRgbaColor('RGBA(255,0,0,1)')).toBe(false)
      expect(isRgbaColor('Rgb(255,0,0)')).toBe(false)
      expect(isRgbaColor('Rgba(255,0,0,1)')).toBe(false)
    })
  })

  describe('isValidColor', () => {
    it('should accept hex colors', () => {
      expect(isValidColor('#fff')).toBe(true)
      expect(isValidColor('#ffffff')).toBe(true)
    })

    it('should accept rgb/rgba colors', () => {
      expect(isValidColor('rgb(255,0,0)')).toBe(true)
      expect(isValidColor('rgba(255,0,0,0.5)')).toBe(true)
      expect(isValidColor('rgba(0,0,0,0)')).toBe(true)
    })

    it('should reject invalid colors', () => {
      expect(isValidColor('red')).toBe(false)
      expect(isValidColor('')).toBe(false)
      expect(isValidColor(null)).toBe(false)
    })
  })

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42)
      expect(deepClone('hello')).toBe('hello')
      expect(deepClone(null)).toBe(null)
      expect(deepClone(undefined)).toBe(undefined)
      expect(deepClone(true)).toBe(true)
    })

    it('should clone arrays', () => {
      const arr = [1, 2, { a: 3 }]
      const cloned = deepClone(arr)
      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
      expect(cloned[2]).not.toBe(arr[2])
    })

    it('should clone nested objects', () => {
      const obj = { a: { b: { c: 42 } }, d: [1, 2] }
      const cloned = deepClone(obj)
      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.a).not.toBe(obj.a)
      expect(cloned.a.b).not.toBe(obj.a.b)
      expect(cloned.d).not.toBe(obj.d)
    })
  })

  describe('deepMerge', () => {
    it('should merge shallow properties', () => {
      const target = { a: 1, b: 2 }
      const source = { b: 3, c: 4 }
      const result = deepMerge(target, source)
      expect(result).toEqual({ a: 1, b: 3, c: 4 })
    })

    it('should merge nested objects', () => {
      const target = { a: { b: 1, c: 2 } }
      const source = { a: { c: 3, d: 4 } }
      const result = deepMerge(target, source)
      expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } })
    })

    it('should not mutate original objects', () => {
      const target = { a: { b: 1 } }
      const source = { a: { c: 2 } }
      const frozenTarget = JSON.stringify(target)
      const frozenSource = JSON.stringify(source)
      deepMerge(target, source)
      expect(JSON.stringify(target)).toBe(frozenTarget)
      expect(JSON.stringify(source)).toBe(frozenSource)
    })

    it('should override arrays instead of merging', () => {
      const target = { a: [1, 2, 3] }
      const source = { a: [4, 5] }
      const result = deepMerge(target, source)
      expect(result.a).toEqual([4, 5])
    })
  })

  describe('createDefaultConfig', () => {
    it('should return a valid default config', () => {
      const config = createDefaultConfig()
      expect(config).toEqual(DEFAULT_CONFIG)
    })

    it('should return a deep clone, not the same reference', () => {
      const config1 = createDefaultConfig()
      const config2 = createDefaultConfig()
      expect(config1).toEqual(config2)
      expect(config1).not.toBe(config2)
      expect(config1.background).not.toBe(config2.background)
    })
  })

  describe('validateConfig', () => {
    it('should validate the default config as true', () => {
      expect(validateConfig(createDefaultConfig())).toBe(true)
    })

    it('should reject null/undefined/non-object', () => {
      expect(validateConfig(null)).toBe(false)
      expect(validateConfig(undefined)).toBe(false)
      expect(validateConfig('config')).toBe(false)
      expect(validateConfig(123)).toBe(false)
    })

    it('should reject invalid cardSize', () => {
      const config = createDefaultConfig()
      config.cardSize = 'invalid'
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject missing background', () => {
      const config = createDefaultConfig()
      delete config.background
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid background mode', () => {
      const config = createDefaultConfig()
      config.background.mode = 'invalid-mode'
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid title fontSize', () => {
      const config = createDefaultConfig()
      config.title.fontSize = -10
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid title color', () => {
      const config = createDefaultConfig()
      config.title.color = 'not-a-color'
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid text alignment', () => {
      const config = createDefaultConfig()
      config.title.alignment = 'invalid'
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject non-boolean bold', () => {
      const config = createDefaultConfig()
      config.title.bold = 'yes'
      expect(validateConfig(config)).toBe(false)
    })
  })

  describe('sanitizeConfig', () => {
    it('should return a valid config for valid input', () => {
      const config = createDefaultConfig()
      const sanitized = sanitizeConfig(config)
      expect(validateConfig(sanitized)).toBe(true)
    })

    it('should return default config for null input', () => {
      const result = sanitizeConfig(null)
      expect(result).toEqual(DEFAULT_CONFIG)
    })

    it('should fill in missing fields with defaults', () => {
      const partial = { cardSize: 'square' }
      const sanitized = sanitizeConfig(partial)
      expect(validateConfig(sanitized)).toBe(true)
      expect(sanitized.title.text).toBe(DEFAULT_CONFIG.title.text)
    })

    it('should preserve valid custom values', () => {
      const config = createDefaultConfig()
      config.title.text = 'My Custom Title'
      config.cardSize = 'portrait'
      const sanitized = sanitizeConfig(config)
      expect(sanitized.title.text).toBe('My Custom Title')
      expect(sanitized.cardSize).toBe('portrait')
    })
  })

  describe('getTemplateById', () => {
    it('should find template by valid id', () => {
      const template = getTemplateById('tech-gradient')
      expect(template).toBeTruthy()
      expect(template.id).toBe('tech-gradient')
    })

    it('should return null for non-existent id', () => {
      expect(getTemplateById('nonexistent')).toBe(null)
    })

    it('should have all templates with valid configs', () => {
      TEMPLATES.forEach((template) => {
        expect(template.id).toBeTruthy()
        expect(template.name).toBeTruthy()
        expect(validateConfig({ ...DEFAULT_CONFIG, ...template.config })).toBe(true)
      })
    })
  })

  describe('applyTemplate', () => {
    it('should apply template config and set templateId', () => {
      const base = createDefaultConfig()
      const result = applyTemplate(base, 'tech-gradient')
      expect(result.templateId).toBe('tech-gradient')
      expect(result.background.mode).toBe(BACKGROUND_MODES.GRADIENT)
    })

    it('should return original config for invalid template id', () => {
      const base = createDefaultConfig()
      base.title.text = 'Original'
      const result = applyTemplate(base, 'nonexistent')
      expect(result.title.text).toBe('Original')
      expect(result.templateId).toBeFalsy()
    })

    it('should not mutate original config', () => {
      const base = createDefaultConfig()
      const frozen = JSON.stringify(base)
      applyTemplate(base, 'tech-gradient')
      expect(JSON.stringify(base)).toBe(frozen)
    })
  })

  describe('switchBackgroundMode', () => {
    it('should switch to new mode', () => {
      const config = createDefaultConfig()
      config.background.mode = BACKGROUND_MODES.COLOR
      const result = switchBackgroundMode(config, BACKGROUND_MODES.GRADIENT)
      expect(result.background.mode).toBe(BACKGROUND_MODES.GRADIENT)
    })

    it('should preserve other background settings', () => {
      const config = createDefaultConfig()
      config.background.color = '#ff0000'
      config.background.gradientStart = '#00ff00'
      config.background.gradientEnd = '#0000ff'
      const result = switchBackgroundMode(config, BACKGROUND_MODES.IMAGE)
      expect(result.background.color).toBe('#ff0000')
      expect(result.background.gradientStart).toBe('#00ff00')
      expect(result.background.gradientEnd).toBe('#0000ff')
    })

    it('should store previous mode', () => {
      const config = createDefaultConfig()
      config.background.mode = BACKGROUND_MODES.COLOR
      const result = switchBackgroundMode(config, BACKGROUND_MODES.GRADIENT)
      expect(result.background._previousMode).toBe(BACKGROUND_MODES.COLOR)
    })
  })

  describe('getCardDimensions', () => {
    it('should return square dimensions', () => {
      const dims = getCardDimensions('square')
      expect(dims).toEqual({ width: 600, height: 600 })
    })

    it('should return portrait dimensions', () => {
      const dims = getCardDimensions('portrait')
      expect(dims).toEqual({ width: 600, height: 1000 })
    })

    it('should default to square for invalid size', () => {
      const dims = getCardDimensions('invalid')
      expect(dims).toEqual({ width: 600, height: 600 })
    })
  })

  describe('getLayoutConfig', () => {
    it('should return square layout', () => {
      const layout = getLayoutConfig('square')
      expect(layout.title.x).toBe(300)
      expect(layout.title.y).toBe(220)
    })

    it('should return portrait layout', () => {
      const layout = getLayoutConfig('portrait')
      expect(layout.title.x).toBe(300)
      expect(layout.title.y).toBe(280)
    })

    it('should have all required layout fields', () => {
      const layout = getLayoutConfig('square')
      expect(layout.logo).toBeTruthy()
      expect(layout.logo.top).toBeTruthy()
      expect(layout.logo.bottom).toBeTruthy()
      expect(layout.title).toBeTruthy()
      expect(layout.description).toBeTruthy()
      expect(layout.qrcode).toBeTruthy()
    })
  })

  describe('calculateLogoPosition', () => {
    it('should calculate top position for square', () => {
      const pos = calculateLogoPosition('square', 'top', 80)
      expect(pos.x).toBe(300)
      expect(pos.y).toBe(80)
      expect(pos.width).toBe(80)
      expect(pos.height).toBe(80)
    })

    it('should calculate bottom position for portrait', () => {
      const pos = calculateLogoPosition('portrait', 'bottom', 100)
      expect(pos.x).toBe(300)
      expect(pos.y).toBe(900)
      expect(pos.width).toBe(100)
      expect(pos.height).toBe(100)
    })
  })

  describe('calculateQRCodePosition', () => {
    it('should calculate bottom position centered', () => {
      const pos = calculateQRCodePosition('square', 'bottom', 120)
      expect(pos.width).toBe(120)
      expect(pos.height).toBe(120)
      expect(pos.x + pos.width / 2).toBe(300)
      expect(pos.y + pos.height / 2).toBe(500)
    })

    it('should correctly center in portrait', () => {
      const pos = calculateQRCodePosition('portrait', 'bottom', 140)
      expect(pos.width).toBe(140)
      expect(pos.x + pos.width / 2).toBe(300)
    })
  })

  describe('calculateTextPosition', () => {
    it('should return title position', () => {
      const pos = calculateTextPosition('square', 'title')
      expect(pos.x).toBe(300)
      expect(pos.y).toBe(220)
      expect(pos.maxWidth).toBe(500)
    })

    it('should return description position with lineHeight', () => {
      const pos = calculateTextPosition('portrait', 'description')
      expect(pos.x).toBe(300)
      expect(pos.y).toBe(400)
      expect(pos.lineHeight).toBeGreaterThan(1)
    })
  })

  describe('getGradientCoords', () => {
    it('should return horizontal gradient coords', () => {
      const coords = getGradientCoords(GRADIENT_DIRECTIONS.HORIZONTAL, 600, 600)
      expect(coords).toEqual({ x1: 0, y1: 0, x2: 600, y2: 0 })
    })

    it('should return vertical gradient coords', () => {
      const coords = getGradientCoords(GRADIENT_DIRECTIONS.VERTICAL, 600, 600)
      expect(coords).toEqual({ x1: 0, y1: 0, x2: 0, y2: 600 })
    })

    it('should return diagonal gradient coords', () => {
      const coords = getGradientCoords(GRADIENT_DIRECTIONS.DIAGONAL, 600, 1000)
      expect(coords).toEqual({ x1: 0, y1: 0, x2: 600, y2: 1000 })
    })
  })

  describe('generateQRMatrix', () => {
    it('should generate a square matrix of correct size', () => {
      const size = 21
      const matrix = generateQRMatrix('test', size)
      expect(Array.isArray(matrix)).toBe(true)
      expect(matrix.length).toBe(size)
      matrix.forEach((row) => {
        expect(row.length).toBe(size)
      })
    })

    it('should only contain 0s and 1s', () => {
      const matrix = generateQRMatrix('https://example.com', 25)
      const allValid = matrix.every((row) =>
        row.every((cell) => cell === 0 || cell === 1)
      )
      expect(allValid).toBe(true)
    })

    it('should generate consistent matrix for same input', () => {
      const matrix1 = generateQRMatrix('same content', 21)
      const matrix2 = generateQRMatrix('same content', 21)
      expect(matrix1).toEqual(matrix2)
    })

    it('should generate different matrix for different content', () => {
      const matrix1 = generateQRMatrix('content A', 21)
      const matrix2 = generateQRMatrix('content B', 21)
      expect(matrix1).not.toEqual(matrix2)
    })

    it('should have finder patterns in top-left corner', () => {
      const matrix = generateQRMatrix('test', 21)
      expect(matrix[0][0]).toBe(1)
      expect(matrix[0][6]).toBe(1)
      expect(matrix[6][0]).toBe(1)
      expect(matrix[3][3]).toBe(1)
    })

    it('should handle empty string', () => {
      const matrix = generateQRMatrix('', 21)
      expect(matrix.length).toBe(21)
      expect(Array.isArray(matrix)).toBe(true)
    })
  })

  describe('wrapText', () => {
    function createMockCtx() {
      return {
        measureText: (text) => ({
          width: text.length * 10,
        }),
      }
    }

    it('should return empty array for empty text', () => {
      const ctx = createMockCtx()
      const lines = wrapText(ctx, '', 100)
      expect(lines).toEqual([])
    })

    it('should keep short text on one line', () => {
      const ctx = createMockCtx()
      const lines = wrapText(ctx, 'Hello', 500)
      expect(lines).toEqual(['Hello'])
    })

    it('should wrap long text into multiple lines', () => {
      const ctx = createMockCtx()
      const longText = 'a'.repeat(50)
      const lines = wrapText(ctx, longText, 100)
      expect(lines.length).toBeGreaterThan(1)
      lines.forEach((line) => {
        expect(line.length * 10).toBeLessThanOrEqual(100 + 10)
      })
    })

    it('should handle explicit newlines', () => {
      const ctx = createMockCtx()
      const lines = wrapText(ctx, 'Line1\nLine2\nLine3', 500)
      expect(lines).toEqual(['Line1', 'Line2', 'Line3'])
    })
  })

  describe('Config Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const original = createDefaultConfig()
      original.title.text = 'Test Title'
      original.cardSize = 'portrait'

      const json = serializeConfig(original)
      expect(typeof json).toBe('string')
      expect(json.length).toBeGreaterThan(0)

      const deserialized = deserializeConfig(json)
      expect(deserialized.title.text).toBe('Test Title')
      expect(deserialized.cardSize).toBe('portrait')
    })

    it('should handle invalid JSON in deserialize', () => {
      const result = deserializeConfig('not valid json')
      expect(result).toEqual(DEFAULT_CONFIG)
    })

    it('serialized JSON should be parseable', () => {
      const config = createDefaultConfig()
      const json = serializeConfig(config)
      expect(() => JSON.parse(json)).not.toThrow()
    })
  })

  describe('formatTimestamp', () => {
    it('should format timestamp correctly', () => {
      const timestamp = new Date('2024-01-15T10:30:00').getTime()
      const result = formatTimestamp(timestamp)
      expect(result).toBe('2024-01-15 10:30:00')
    })

    it('should pad single digits with leading zeros', () => {
      const timestamp = new Date('2024-01-05T09:05:03').getTime()
      const result = formatTimestamp(timestamp)
      expect(result).toBe('2024-01-05 09:05:03')
    })
  })

  describe('Storage Functions', () => {
    let storage

    beforeEach(() => {
      storage = createMockStorage()
    })

    describe('saveLastConfig / loadLastConfig', () => {
      it('should save and load last config', () => {
        const config = createDefaultConfig()
        config.title.text = 'Last Saved'
        saveLastConfig(config, storage)

        const loaded = loadLastConfig(storage)
        expect(loaded).toBeTruthy()
        expect(loaded.title.text).toBe('Last Saved')
      })

      it('should return null when no config saved', () => {
        const loaded = loadLastConfig(storage)
        expect(loaded).toBe(null)
      })

      it('should handle null storage gracefully', () => {
        expect(() => saveLastConfig(createDefaultConfig(), null)).not.toThrow()
        expect(loadLastConfig(null)).toBe(null)
      })
    })

    describe('loadSavedConfigs', () => {
      it('should return empty array when no configs saved', () => {
        const list = loadSavedConfigs(storage)
        expect(list).toEqual([])
      })

      it('should handle corrupted data', () => {
        storage.setItem(STORAGE_KEY_CONFIGS, 'invalid json')
        const list = loadSavedConfigs(storage)
        expect(list).toEqual([])
      })

      it('should handle non-array data', () => {
        storage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify({ not: 'array' }))
        const list = loadSavedConfigs(storage)
        expect(list).toEqual([])
      })
    })

    describe('saveConfigToList', () => {
      it('should add config to list', () => {
        const config = createDefaultConfig()
        config.title.text = 'Saved 1'
        const list = saveConfigToList(config, storage)
        expect(list.length).toBe(1)
        expect(list[0].timestamp).toBeTruthy()
        expect(list[0].id).toBeTruthy()
      })

      it('should prepend new configs', () => {
        const config1 = createDefaultConfig()
        config1.title.text = 'First'
        saveConfigToList(config1, storage)

        const config2 = createDefaultConfig()
        config2.title.text = 'Second'
        const list = saveConfigToList(config2, storage)

        expect(list.length).toBe(2)
        const loadedFirst = deserializeConfig(list[0].config)
        expect(loadedFirst.title.text).toBe('Second')
      })

      it('should limit to 20 configs', () => {
        for (let i = 0; i < 25; i++) {
          const config = createDefaultConfig()
          config.title.text = `Config ${i}`
          saveConfigToList(config, storage)
        }
        const list = loadSavedConfigs(storage)
        expect(list.length).toBe(20)
      })
    })

    describe('deleteConfigFromList', () => {
      it('should delete config by id', () => {
        const config = createDefaultConfig()
        saveConfigToList(config, storage)
        const list = loadSavedConfigs(storage)
        const id = list[0].id

        const newList = deleteConfigFromList(id, storage)
        expect(newList.length).toBe(0)
      })

      it('should not affect other configs', () => {
        saveConfigToList(createDefaultConfig(), storage)
        saveConfigToList(createDefaultConfig(), storage)
        const listBefore = loadSavedConfigs(storage)
        const idToDelete = listBefore[0].id
        const keptId = listBefore[1].id

        const listAfter = deleteConfigFromList(idToDelete, storage)
        expect(listAfter.length).toBe(1)
        expect(listAfter[0].id).toBe(keptId)
      })

      it('should handle non-existent id gracefully', () => {
        saveConfigToList(createDefaultConfig(), storage)
        const listBefore = loadSavedConfigs(storage)
        const listAfter = deleteConfigFromList('nonexistent-id', storage)
        expect(listAfter.length).toBe(listBefore.length)
      })
    })
  })
})
