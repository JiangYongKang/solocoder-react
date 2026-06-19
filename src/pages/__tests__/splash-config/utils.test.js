import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateId,
  clamp,
  isValidHexColor,
  isRgbaColor,
  isValidColor,
  deepClone,
  deepMerge,
  createDefaultConfig,
  validateLogoSize,
  normalizeLogoSize,
  validateFontSize,
  normalizeFontSize,
  validateCountdownSeconds,
  normalizeCountdownSeconds,
  validateLogoFile,
  formatCountdownText,
  getTemplateById,
  applyTemplate,
  switchBackgroundMode,
  getGradientAngle,
  buildBackgroundStyle,
  getSkipButtonPositionStyle,
  getScreenDimensions,
  validateConfig,
  sanitizeConfig,
  serializeConfig,
  deserializeConfig,
  validateImportedConfig,
  saveLastConfig,
  loadLastConfig,
  loadSavedConfigs,
  saveConfigToList,
  deleteConfigFromList,
  renameConfigInList,
  formatTimestamp,
} from '@/pages/splash-config/utils.js'
import {
  DEFAULT_CONFIG,
  TEMPLATES,
  BACKGROUND_MODES,
  GRADIENT_DIRECTIONS,
  IMAGE_FIT_MODES,
  SKIP_BUTTON_POSITIONS,
  MIN_LOGO_SIZE,
  MAX_LOGO_SIZE,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  MIN_COUNTDOWN_SECONDS,
  MAX_COUNTDOWN_SECONDS,
  MAX_LOGO_FILE_SIZE,
  STORAGE_KEY_CONFIGS,
  STORAGE_KEY_LAST,
  PRESET_SCREEN_RATIOS,
} from '@/pages/splash-config/constants.js'

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

describe('Splash Config - Utility Functions', () => {
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

    it('should clamp to min when below', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    it('should clamp to max when above', () => {
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
    })

    it('should accept 6-digit hex colors', () => {
      expect(isValidHexColor('#ffffff')).toBe(true)
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
      expect(isValidHexColor('')).toBe(false)
      expect(isValidHexColor(null)).toBe(false)
      expect(isValidHexColor(undefined)).toBe(false)
    })
  })

  describe('isRgbaColor', () => {
    it('should accept rgb format without alpha', () => {
      expect(isRgbaColor('rgb(255,0,0)')).toBe(true)
    })

    it('should accept rgba format with alpha', () => {
      expect(isRgbaColor('rgba(255,0,0,0.5)')).toBe(true)
      expect(isRgbaColor('rgba(100,150,200,0.75)')).toBe(true)
    })

    it('should accept rgba without alpha (three args)', () => {
      expect(isRgbaColor('rgba(255,0,0)')).toBe(true)
    })

    it('should handle spaces around numbers', () => {
      expect(isRgbaColor('rgba( 255 , 0 , 0 , 0.5 )')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(isRgbaColor('#fff')).toBe(false)
      expect(isRgbaColor('rgba(255,0)')).toBe(false)
      expect(isRgbaColor('rgba(255,0,0,0.5,0.5)')).toBe(false)
      expect(isRgbaColor('rgba(-1,0,0,1)')).toBe(false)
      expect(isRgbaColor('')).toBe(false)
      expect(isRgbaColor(null)).toBe(false)
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

    it('should return a deep clone, not same reference', () => {
      const c1 = createDefaultConfig()
      const c2 = createDefaultConfig()
      expect(c1).toEqual(c2)
      expect(c1).not.toBe(c2)
      expect(c1.brand).not.toBe(c2.brand)
      expect(c1.background).not.toBe(c2.background)
    })
  })

  describe('Logo Size Validation', () => {
    it('validateLogoSize should accept valid sizes within range', () => {
      expect(validateLogoSize(30)).toBe(true)
      expect(validateLogoSize(80)).toBe(true)
      expect(validateLogoSize(150)).toBe(true)
      expect(validateLogoSize(MIN_LOGO_SIZE)).toBe(true)
      expect(validateLogoSize(MAX_LOGO_SIZE)).toBe(true)
    })

    it('validateLogoSize should reject invalid sizes', () => {
      expect(validateLogoSize(29)).toBe(false)
      expect(validateLogoSize(151)).toBe(false)
      expect(validateLogoSize(0)).toBe(false)
      expect(validateLogoSize(-10)).toBe(false)
      expect(validateLogoSize(NaN)).toBe(false)
      expect(validateLogoSize('80')).toBe(false)
      expect(validateLogoSize(null)).toBe(false)
      expect(validateLogoSize(undefined)).toBe(false)
    })

    it('normalizeLogoSize should clamp values to valid range', () => {
      expect(normalizeLogoSize(20)).toBe(MIN_LOGO_SIZE)
      expect(normalizeLogoSize(200)).toBe(MAX_LOGO_SIZE)
      expect(normalizeLogoSize(80)).toBe(80)
      expect(normalizeLogoSize(30)).toBe(30)
      expect(normalizeLogoSize(150)).toBe(150)
    })

    it('normalizeLogoSize should handle invalid inputs gracefully', () => {
      expect(typeof normalizeLogoSize(NaN)).toBe('number')
      expect(typeof normalizeLogoSize('80')).toBe('number')
      expect(typeof normalizeLogoSize(null)).toBe('number')
      expect(typeof normalizeLogoSize(undefined)).toBe('number')
    })
  })

  describe('Font Size Validation', () => {
    it('validateFontSize should accept valid sizes within range', () => {
      expect(validateFontSize(12)).toBe(true)
      expect(validateFontSize(28)).toBe(true)
      expect(validateFontSize(60)).toBe(true)
      expect(validateFontSize(MIN_FONT_SIZE)).toBe(true)
      expect(validateFontSize(MAX_FONT_SIZE)).toBe(true)
    })

    it('validateFontSize should reject invalid sizes', () => {
      expect(validateFontSize(11)).toBe(false)
      expect(validateFontSize(61)).toBe(false)
      expect(validateFontSize(-5)).toBe(false)
      expect(validateFontSize(NaN)).toBe(false)
      expect(validateFontSize('28')).toBe(false)
      expect(validateFontSize(null)).toBe(false)
      expect(validateFontSize(undefined)).toBe(false)
    })

    it('normalizeFontSize should clamp values to valid range', () => {
      expect(normalizeFontSize(5)).toBe(MIN_FONT_SIZE)
      expect(normalizeFontSize(100)).toBe(MAX_FONT_SIZE)
      expect(normalizeFontSize(28)).toBe(28)
    })

    it('normalizeFontSize should handle invalid inputs', () => {
      expect(typeof normalizeFontSize(NaN)).toBe('number')
      expect(typeof normalizeFontSize(null)).toBe('number')
    })
  })

  describe('Countdown Seconds Validation', () => {
    it('validateCountdownSeconds should accept valid integer seconds', () => {
      expect(validateCountdownSeconds(1)).toBe(true)
      expect(validateCountdownSeconds(5)).toBe(true)
      expect(validateCountdownSeconds(10)).toBe(true)
      expect(validateCountdownSeconds(MIN_COUNTDOWN_SECONDS)).toBe(true)
      expect(validateCountdownSeconds(MAX_COUNTDOWN_SECONDS)).toBe(true)
    })

    it('validateCountdownSeconds should reject non-integer or out-of-range values', () => {
      expect(validateCountdownSeconds(1.5)).toBe(false)
      expect(validateCountdownSeconds(0)).toBe(false)
      expect(validateCountdownSeconds(11)).toBe(false)
      expect(validateCountdownSeconds(-3)).toBe(false)
      expect(validateCountdownSeconds(NaN)).toBe(false)
      expect(validateCountdownSeconds('5')).toBe(false)
      expect(validateCountdownSeconds(null)).toBe(false)
      expect(validateCountdownSeconds(undefined)).toBe(false)
    })

    it('normalizeCountdownSeconds should round and clamp values', () => {
      expect(normalizeCountdownSeconds(1.2)).toBe(1)
      expect(normalizeCountdownSeconds(1.8)).toBe(2)
      expect(normalizeCountdownSeconds(0)).toBe(MIN_COUNTDOWN_SECONDS)
      expect(normalizeCountdownSeconds(20)).toBe(MAX_COUNTDOWN_SECONDS)
    })
  })

  describe('validateLogoFile', () => {
    function createMockFile({ size, type }) {
      return { size: size ?? 1024, type: type ?? 'image/png', name: 'test.png' }
    }

    it('should accept valid PNG/JPG/SVG files within size limit', () => {
      expect(validateLogoFile(createMockFile({ type: 'image/png', size: 500 * 1024 })).valid).toBe(true)
      expect(validateLogoFile(createMockFile({ type: 'image/jpeg', size: 100 * 1024 })).valid).toBe(true)
      expect(validateLogoFile(createMockFile({ type: 'image/svg+xml', size: 10 * 1024 })).valid).toBe(true)
    })

    it('should reject unsupported file types', () => {
      const result = validateLogoFile(createMockFile({ type: 'image/gif' }))
      expect(result.valid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should reject oversized files', () => {
      const result = validateLogoFile(createMockFile({ size: MAX_LOGO_FILE_SIZE + 1 }))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('1MB')
    })

    it('should reject null/undefined files', () => {
      expect(validateLogoFile(null).valid).toBe(false)
      expect(validateLogoFile(undefined).valid).toBe(false)
    })
  })

  describe('formatCountdownText', () => {
    it('should replace {n} placeholder with seconds', () => {
      expect(formatCountdownText('跳过 {n}s', 3)).toBe('跳过 3s')
      expect(formatCountdownText('{n}s 后进入', 5)).toBe('5s 后进入')
      expect(formatCountdownText('{n}', 10)).toBe('10')
    })

    it('should replace multiple placeholders', () => {
      expect(formatCountdownText('{n} / {n}', 2)).toBe('2 / 2')
    })

    it('should handle format without placeholder', () => {
      expect(formatCountdownText('跳过', 5)).toBe('跳过')
    })

    it('should handle empty format string', () => {
      expect(formatCountdownText('', 5)).toBe('')
    })

    it('should handle non-string format gracefully', () => {
      expect(formatCountdownText(null, 5)).toBe('')
      expect(formatCountdownText(undefined, 5)).toBe('')
      expect(formatCountdownText(123, 5)).toBe('')
    })
  })

  describe('Template Functions', () => {
    it('getTemplateById should find template by valid id', () => {
      const t = getTemplateById('minimal-white')
      expect(t).toBeTruthy()
      expect(t.id).toBe('minimal-white')
      expect(t.name).toBeTruthy()
      expect(t.config).toBeTruthy()
    })

    it('getTemplateById should return null for non-existent id', () => {
      expect(getTemplateById('nonexistent')).toBe(null)
    })

    it('all templates should have valid structure', () => {
      TEMPLATES.forEach((t) => {
        expect(t.id).toBeTruthy()
        expect(t.name).toBeTruthy()
        expect(t.config).toBeTruthy()
        expect(t.config.brand).toBeTruthy()
        expect(t.config.background).toBeTruthy()
        expect(t.config.interaction).toBeTruthy()
      })
    })

    it('applyTemplate should apply template config and set templateId', () => {
      const base = createDefaultConfig()
      base.brand.title.text = 'Original'
      const result = applyTemplate(base, 'minimal-white')
      expect(result.templateId).toBe('minimal-white')
      expect(result.brand.title.text).toBe('极简应用')
    })

    it('applyTemplate should return original config for invalid template id', () => {
      const base = createDefaultConfig()
      base.brand.title.text = 'Original'
      const result = applyTemplate(base, 'nonexistent')
      expect(result.templateId).toBe(null)
      expect(result.brand.title.text).toBe('Original')
    })

    it('applyTemplate should not mutate original config', () => {
      const base = createDefaultConfig()
      const frozen = JSON.stringify(base)
      applyTemplate(base, 'tech-dark')
      expect(JSON.stringify(base)).toBe(frozen)
    })
  })

  describe('Background Mode Switching', () => {
    it('switchBackgroundMode should switch to valid new mode', () => {
      const config = createDefaultConfig()
      config.background.mode = BACKGROUND_MODES.COLOR
      const result = switchBackgroundMode(config, BACKGROUND_MODES.GRADIENT)
      expect(result.background.mode).toBe(BACKGROUND_MODES.GRADIENT)
    })

    it('switchBackgroundMode should preserve other background settings', () => {
      const config = createDefaultConfig()
      config.background.color = '#ff0000'
      config.background.gradientStart = '#00ff00'
      config.background.gradientEnd = '#0000ff'
      const result = switchBackgroundMode(config, BACKGROUND_MODES.IMAGE)
      expect(result.background.color).toBe('#ff0000')
      expect(result.background.gradientStart).toBe('#00ff00')
      expect(result.background.gradientEnd).toBe('#0000ff')
    })

    it('switchBackgroundMode should NOT write _previousMode into config (no internal state pollution)', () => {
      const config = createDefaultConfig()
      config.background.mode = BACKGROUND_MODES.COLOR
      const result = switchBackgroundMode(config, BACKGROUND_MODES.GRADIENT)
      expect('_previousMode' in result.background).toBe(false)
      expect(result.background).not.toHaveProperty('_previousMode')
    })

    it('serialized config should not contain internal fields like _previousMode', () => {
      const config = createDefaultConfig()
      const switched = switchBackgroundMode(config, BACKGROUND_MODES.GRADIENT)
      const json = serializeConfig(switched)
      const parsed = JSON.parse(json)
      expect('_previousMode' in parsed.background).toBe(false)
      expect(parsed.background).not.toHaveProperty('_previousMode')
    })

    it('switchBackgroundMode should ignore invalid mode', () => {
      const config = createDefaultConfig()
      config.background.mode = BACKGROUND_MODES.COLOR
      const result = switchBackgroundMode(config, 'invalid-mode')
      expect(result.background.mode).toBe(BACKGROUND_MODES.COLOR)
    })

    it('switchBackgroundMode should not mutate original config', () => {
      const config = createDefaultConfig()
      const frozen = JSON.stringify(config)
      switchBackgroundMode(config, BACKGROUND_MODES.GRADIENT)
      expect(JSON.stringify(config)).toBe(frozen)
    })
  })

  describe('getGradientAngle', () => {
    it('should return correct CSS gradient angle for direction', () => {
      expect(getGradientAngle(GRADIENT_DIRECTIONS.HORIZONTAL)).toBe('to right')
      expect(getGradientAngle(GRADIENT_DIRECTIONS.VERTICAL)).toBe('to bottom')
      expect(getGradientAngle(GRADIENT_DIRECTIONS.DIAGONAL)).toBe('to bottom right')
    })

    it('should default to diagonal for unknown direction', () => {
      expect(getGradientAngle('unknown')).toBe('to bottom right')
    })
  })

  describe('buildBackgroundStyle', () => {
    it('should build color background style', () => {
      const bg = {
        mode: BACKGROUND_MODES.COLOR,
        color: '#ff0000',
      }
      const style = buildBackgroundStyle(bg)
      expect(style.backgroundColor).toBe('#ff0000')
    })

    it('should build image background style with cover fit', () => {
      const bg = {
        mode: BACKGROUND_MODES.IMAGE,
        image: 'data:image/png;base64,xxx',
        imageFit: IMAGE_FIT_MODES.COVER,
      }
      const style = buildBackgroundStyle(bg)
      expect(style.backgroundImage).toContain('url(')
      expect(style.backgroundSize).toBe('cover')
      expect(style.backgroundRepeat).toBe('no-repeat')
    })

    it('should build image background style with stretch fit', () => {
      const bg = {
        mode: BACKGROUND_MODES.IMAGE,
        image: 'data:image/png;base64,xxx',
        imageFit: IMAGE_FIT_MODES.STRETCH,
      }
      const style = buildBackgroundStyle(bg)
      expect(style.backgroundSize).toBe('100% 100%')
    })

    it('should fall back to color for image mode without image', () => {
      const bg = {
        mode: BACKGROUND_MODES.IMAGE,
        image: null,
        color: '#abcdef',
      }
      const style = buildBackgroundStyle(bg)
      expect(style.backgroundColor).toBe('#abcdef')
    })

    it('should build gradient background style', () => {
      const bg = {
        mode: BACKGROUND_MODES.GRADIENT,
        gradientStart: '#667eea',
        gradientEnd: '#764ba2',
        gradientDirection: GRADIENT_DIRECTIONS.DIAGONAL,
      }
      const style = buildBackgroundStyle(bg)
      expect(style.backgroundImage).toContain('linear-gradient')
      expect(style.backgroundImage).toContain('#667eea')
      expect(style.backgroundImage).toContain('#764ba2')
    })

    it('should return empty style for null input', () => {
      expect(buildBackgroundStyle(null)).toEqual({})
      expect(buildBackgroundStyle(undefined)).toEqual({})
    })
  })

  describe('getSkipButtonPositionStyle', () => {
    it('should return top-right position style', () => {
      const style = getSkipButtonPositionStyle(SKIP_BUTTON_POSITIONS.TOP_RIGHT)
      expect(style.top).toBe('16px')
      expect(style.right).toBe('16px')
      expect(style.left).toBe('auto')
    })

    it('should return bottom-right position style', () => {
      const style = getSkipButtonPositionStyle(SKIP_BUTTON_POSITIONS.BOTTOM_RIGHT)
      expect(style.bottom).toBe('24px')
      expect(style.right).toBe('24px')
    })

    it('should return bottom-center position style with transform', () => {
      const style = getSkipButtonPositionStyle(SKIP_BUTTON_POSITIONS.BOTTOM_CENTER)
      expect(style.bottom).toBe('24px')
      expect(style.left).toBe('50%')
      expect(style.transform).toBe('translateX(-50%)')
    })

    it('should default to top-right for unknown position', () => {
      const style = getSkipButtonPositionStyle('unknown')
      expect(style.top).toBe('16px')
      expect(style.right).toBe('16px')
    })
  })

  describe('getScreenDimensions', () => {
    it('should return iPhone X dimensions', () => {
      const dims = getScreenDimensions('IPHONE_X')
      expect(dims.width).toBe(375)
      expect(dims.height).toBe(812)
      expect(dims.label).toContain('iPhone')
    })

    it('should return Android dimensions', () => {
      const dims = getScreenDimensions('ANDROID')
      expect(dims.width).toBe(360)
      expect(dims.height).toBe(640)
      expect(dims.label).toContain('Android')
    })

    it('should default to iPhone X for unknown key', () => {
      const dims = getScreenDimensions('UNKNOWN')
      expect(dims.width).toBe(PRESET_SCREEN_RATIOS.IPHONE_X.width)
      expect(dims.height).toBe(PRESET_SCREEN_RATIOS.IPHONE_X.height)
    })
  })

  describe('validateConfig', () => {
    it('should validate default config as true', () => {
      expect(validateConfig(createDefaultConfig())).toBe(true)
    })

    it('should reject null/undefined/non-object', () => {
      expect(validateConfig(null)).toBe(false)
      expect(validateConfig(undefined)).toBe(false)
      expect(validateConfig('config')).toBe(false)
      expect(validateConfig(123)).toBe(false)
    })

    it('should reject missing brand', () => {
      const config = createDefaultConfig()
      delete config.brand
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid logo size', () => {
      const config = createDefaultConfig()
      config.brand.logo.size = -10
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid title fontSize', () => {
      const config = createDefaultConfig()
      config.brand.title.fontSize = -10
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid title color', () => {
      const config = createDefaultConfig()
      config.brand.title.color = 'not-a-color'
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject non-boolean bold', () => {
      const config = createDefaultConfig()
      config.brand.title.bold = 'yes'
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid background mode', () => {
      const config = createDefaultConfig()
      config.background.mode = 'invalid-mode'
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid gradient direction', () => {
      const config = createDefaultConfig()
      config.background.mode = BACKGROUND_MODES.GRADIENT
      config.background.gradientDirection = 'invalid'
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid image fit mode', () => {
      const config = createDefaultConfig()
      config.background.mode = BACKGROUND_MODES.IMAGE
      config.background.imageFit = 'invalid'
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid countdown seconds', () => {
      const config = createDefaultConfig()
      config.interaction.countdown.seconds = 100
      expect(validateConfig(config)).toBe(false)
    })

    it('should reject invalid skip button position', () => {
      const config = createDefaultConfig()
      config.interaction.skipButton.position = 'invalid'
      expect(validateConfig(config)).toBe(false)
    })
  })

  describe('sanitizeConfig', () => {
    it('should return valid config for valid input', () => {
      const config = createDefaultConfig()
      const result = sanitizeConfig(config)
      expect(validateConfig(result)).toBe(true)
    })

    it('should return default config for null input', () => {
      expect(sanitizeConfig(null)).toEqual(DEFAULT_CONFIG)
    })

    it('should fill in missing fields with defaults', () => {
      const partial = createDefaultConfig()
      partial.brand.title.text = 'Test'
      delete partial.brand.logo.image
      const sanitized = sanitizeConfig(partial)
      expect(validateConfig(sanitized)).toBe(true)
      expect(sanitized.brand.title.text).toBe('Test')
      expect(sanitized.background.mode).toBe(DEFAULT_CONFIG.background.mode)
    })

    it('should preserve valid custom values', () => {
      const config = createDefaultConfig()
      config.brand.title.text = 'My Custom App'
      config.brand.logo.size = 100
      const result = sanitizeConfig(config)
      expect(result.brand.title.text).toBe('My Custom App')
      expect(result.brand.logo.size).toBe(100)
    })

    it('should normalize out-of-range values', () => {
      const config = createDefaultConfig()
      config.brand.logo.size = 1000
      config.brand.title.fontSize = 0
      config.interaction.countdown.seconds = 50
      const result = sanitizeConfig(config)
      expect(result.brand.logo.size).toBeLessThanOrEqual(MAX_LOGO_SIZE)
      expect(result.brand.logo.size).toBeGreaterThanOrEqual(MIN_LOGO_SIZE)
      expect(result.brand.title.fontSize).toBeGreaterThanOrEqual(MIN_FONT_SIZE)
      expect(result.interaction.countdown.seconds).toBeLessThanOrEqual(MAX_COUNTDOWN_SECONDS)
    })

    it('should preserve valid fields when ONLY one field is out of range (partial sanitization)', () => {
      const config = createDefaultConfig()
      config.brand.title.text = 'My Precious App'
      config.brand.subtitle.text = 'Carefully Crafted Slogan'
      config.brand.title.fontSize = 24
      config.brand.title.color = '#336699'
      config.brand.logo.size = 200
      config.background.mode = BACKGROUND_MODES.GRADIENT
      config.background.gradientStart = '#ff0000'
      config.background.gradientEnd = '#0000ff'
      config.interaction.countdown.seconds = 5
      config.interaction.skipButton.text = '跳过'

      const result = sanitizeConfig(config)

      expect(result.brand.logo.size).toBe(MAX_LOGO_SIZE)
      expect(result.brand.title.text).toBe('My Precious App')
      expect(result.brand.subtitle.text).toBe('Carefully Crafted Slogan')
      expect(result.brand.title.fontSize).toBe(24)
      expect(result.brand.title.color).toBe('#336699')
      expect(result.background.mode).toBe(BACKGROUND_MODES.GRADIENT)
      expect(result.background.gradientStart).toBe('#ff0000')
      expect(result.background.gradientEnd).toBe('#0000ff')
      expect(result.interaction.countdown.seconds).toBe(5)
      expect(result.interaction.skipButton.text).toBe('跳过')
    })

    it('should preserve most fields when title color is invalid', () => {
      const config = createDefaultConfig()
      config.brand.title.text = 'Keep This'
      config.brand.title.color = 'not-a-color'
      config.brand.subtitle.text = 'Keep This Too'
      config.brand.logo.size = 80

      const result = sanitizeConfig(config)

      expect(result.brand.title.text).toBe('Keep This')
      expect(result.brand.title.color).toBe(DEFAULT_CONFIG.brand.title.color)
      expect(result.brand.subtitle.text).toBe('Keep This Too')
      expect(result.brand.logo.size).toBe(80)
    })

    it('should preserve most fields when skip button position is invalid', () => {
      const config = createDefaultConfig()
      config.brand.title.text = 'Preserved'
      config.brand.logo.size = 60
      config.background.mode = BACKGROUND_MODES.IMAGE
      config.background.imageFit = IMAGE_FIT_MODES.CONTAIN
      config.interaction.countdown.seconds = 7
      config.interaction.skipButton.position = 'invalid-position'
      config.interaction.skipButton.text = 'Skip'

      const result = sanitizeConfig(config)

      expect(result.brand.title.text).toBe('Preserved')
      expect(result.brand.logo.size).toBe(60)
      expect(result.background.mode).toBe(BACKGROUND_MODES.IMAGE)
      expect(result.background.imageFit).toBe(IMAGE_FIT_MODES.CONTAIN)
      expect(result.interaction.countdown.seconds).toBe(7)
      expect(result.interaction.skipButton.position).toBe(DEFAULT_CONFIG.interaction.skipButton.position)
      expect(result.interaction.skipButton.text).toBe('Skip')
    })

    it('should not discard entire config when input is partial object with only brand.title.text', () => {
      const partial = {
        brand: {
          title: { text: 'Minimal Input' },
        },
      }
      const result = sanitizeConfig(partial)
      expect(validateConfig(result)).toBe(true)
      expect(result.brand.title.text).toBe('Minimal Input')
      expect(result.brand.subtitle.text).toBe(DEFAULT_CONFIG.brand.subtitle.text)
      expect(result.background.mode).toBe(DEFAULT_CONFIG.background.mode)
      expect(result.interaction.countdown.seconds).toBe(DEFAULT_CONFIG.interaction.countdown.seconds)
    })

    it('should sanitize each nested field independently for type correctness', () => {
      const messy = {
        templateId: 123,
        brand: {
          logo: { image: 42, size: 'big' },
          title: { text: null, fontSize: 'huge', color: null, bold: 'yes' },
          subtitle: { text: 999, fontSize: -5, color: 123, bold: null },
        },
        background: {
          mode: 'weird-mode',
          color: 42,
          image: {},
          imageFit: 'bad-fit',
          gradientStart: 'no-color',
          gradientEnd: null,
          gradientDirection: 'sideways',
        },
        interaction: {
          countdown: { enabled: 'on', seconds: 'many', format: 123 },
          skipButton: {
            enabled: 'off',
            text: 777,
            position: 'nowhere',
            color: [],
            backgroundColor: {},
          },
        },
      }
      const result = sanitizeConfig(messy)
      expect(validateConfig(result)).toBe(true)
      expect(result.templateId).toBe(null)
      expect(result.brand.logo.size).toBe(DEFAULT_CONFIG.brand.logo.size)
      expect(validateLogoSize(result.brand.logo.size)).toBe(true)
      expect(typeof result.brand.title.bold).toBe('boolean')
      expect(result.background.mode).toBe(DEFAULT_CONFIG.background.mode)
      expect(result.interaction.countdown.seconds).toBe(DEFAULT_CONFIG.interaction.countdown.seconds)
    })

    it('should preserve valid preview settings', () => {
      const config = createDefaultConfig()
      config.preview = { screenRatio: 'ANDROID' }
      const result = sanitizeConfig(config)
      expect(result.preview.screenRatio).toBe('ANDROID')
    })

    it('should fall back to default preview.screenRatio for invalid values', () => {
      const config = createDefaultConfig()
      config.preview = { screenRatio: 'INVALID_RATIO' }
      const result = sanitizeConfig(config)
      expect(result.preview.screenRatio).toBe(DEFAULT_CONFIG.preview.screenRatio)
    })
  })

  describe('Config Serialization', () => {
    it('serializeConfig should return a valid JSON string', () => {
      const config = createDefaultConfig()
      const json = serializeConfig(config)
      expect(typeof json).toBe('string')
      expect(() => JSON.parse(json)).not.toThrow()
    })

    it('should serialize and deserialize correctly', () => {
      const original = createDefaultConfig()
      original.brand.title.text = 'Test Title'
      original.brand.subtitle.fontSize = 20
      original.background.mode = BACKGROUND_MODES.GRADIENT

      const json = serializeConfig(original)
      const deserialized = deserializeConfig(json)

      expect(deserialized.brand.title.text).toBe('Test Title')
      expect(deserialized.brand.subtitle.fontSize).toBe(20)
      expect(deserialized.background.mode).toBe(BACKGROUND_MODES.GRADIENT)
    })

    it('deserializeConfig should handle invalid JSON gracefully', () => {
      const result = deserializeConfig('not valid json')
      expect(result).toEqual(DEFAULT_CONFIG)
    })

    it('deserializeConfig should handle valid JSON but invalid config', () => {
      const result = deserializeConfig(JSON.stringify({ invalid: true }))
      expect(validateConfig(result)).toBe(true)
    })
  })

  describe('validateImportedConfig', () => {
    it('should validate a correct config', () => {
      const config = createDefaultConfig()
      const result = validateImportedConfig(config)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should report errors for null/non-object', () => {
      expect(validateImportedConfig(null).valid).toBe(false)
      expect(validateImportedConfig('string').valid).toBe(false)
    })

    it('should report missing required top-level fields', () => {
      const result = validateImportedConfig({})
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should report field validation errors', () => {
      const bad = createDefaultConfig()
      bad.brand.title.bold = 'invalid'
      const result = validateImportedConfig(bad)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('formatTimestamp', () => {
    it('should format timestamp correctly', () => {
      const ts = new Date('2024-01-15T10:30:00').getTime()
      expect(formatTimestamp(ts)).toBe('2024-01-15 10:30:00')
    })

    it('should pad single digits with zeros', () => {
      const ts = new Date('2024-01-05T09:05:03').getTime()
      expect(formatTimestamp(ts)).toBe('2024-01-05 09:05:03')
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
        config.brand.title.text = 'Last Saved'
        saveLastConfig(config, storage)
        const loaded = loadLastConfig(storage)
        expect(loaded).toBeTruthy()
        expect(loaded.brand.title.text).toBe('Last Saved')
      })

      it('loadLastConfig should return null when no config saved', () => {
        expect(loadLastConfig(storage)).toBe(null)
      })

      it('should handle null storage gracefully', () => {
        expect(() => saveLastConfig(createDefaultConfig(), null)).not.toThrow()
        expect(loadLastConfig(null)).toBe(null)
      })

      it('should save to correct storage key', () => {
        saveLastConfig(createDefaultConfig(), storage)
        expect(storage._store[STORAGE_KEY_LAST]).toBeTruthy()
      })
    })

    describe('loadSavedConfigs', () => {
      it('should return empty array when no configs saved', () => {
        expect(loadSavedConfigs(storage)).toEqual([])
      })

      it('should handle corrupted data', () => {
        storage.setItem(STORAGE_KEY_CONFIGS, 'invalid json')
        expect(loadSavedConfigs(storage)).toEqual([])
      })

      it('should handle non-array data', () => {
        storage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify({ not: 'array' }))
        expect(loadSavedConfigs(storage)).toEqual([])
      })
    })

    describe('saveConfigToList', () => {
      it('should add config to list with name', () => {
        const config = createDefaultConfig()
        config.brand.title.text = 'Saved 1'
        const list = saveConfigToList(config, 'My Config', storage)
        expect(list.length).toBe(1)
        expect(list[0].name).toBe('My Config')
        expect(list[0].timestamp).toBeTruthy()
        expect(list[0].id).toBeTruthy()
      })

      it('should use timestamp as default name when empty', () => {
        const list = saveConfigToList(createDefaultConfig(), '', storage)
        expect(list.length).toBe(1)
        expect(list[0].name).toBeTruthy()
      })

      it('should prepend new configs', () => {
        const c1 = createDefaultConfig()
        c1.brand.title.text = 'First'
        saveConfigToList(c1, 'Config A', storage)
        const c2 = createDefaultConfig()
        c2.brand.title.text = 'Second'
        const list = saveConfigToList(c2, 'Config B', storage)
        expect(list.length).toBe(2)
        expect(list[0].name).toBe('Config B')
      })

      it('should limit to 50 configs', () => {
        for (let i = 0; i < 60; i++) {
          saveConfigToList(createDefaultConfig(), `Config ${i}`, storage)
        }
        const list = loadSavedConfigs(storage)
        expect(list.length).toBe(50)
      })

      it('should handle null storage gracefully', () => {
        const list = saveConfigToList(createDefaultConfig(), 'Name', null)
        expect(list).toEqual([])
      })
    })

    describe('deleteConfigFromList', () => {
      it('should delete config by id', () => {
        saveConfigToList(createDefaultConfig(), 'To Delete', storage)
        const list = loadSavedConfigs(storage)
        const id = list[0].id
        const newList = deleteConfigFromList(id, storage)
        expect(newList.length).toBe(0)
      })

      it('should not affect other configs', () => {
        saveConfigToList(createDefaultConfig(), 'Keep 1', storage)
        saveConfigToList(createDefaultConfig(), 'Keep 2', storage)
        const listBefore = loadSavedConfigs(storage)
        const idToDelete = listBefore[0].id
        const keptId = listBefore[1].id
        const listAfter = deleteConfigFromList(idToDelete, storage)
        expect(listAfter.length).toBe(1)
        expect(listAfter[0].id).toBe(keptId)
      })

      it('should handle non-existent id gracefully', () => {
        saveConfigToList(createDefaultConfig(), 'Only', storage)
        const listBefore = loadSavedConfigs(storage)
        const listAfter = deleteConfigFromList('nonexistent', storage)
        expect(listAfter.length).toBe(listBefore.length)
      })
    })

    describe('renameConfigInList', () => {
      it('should rename config by id', () => {
        saveConfigToList(createDefaultConfig(), 'Old Name', storage)
        const list = loadSavedConfigs(storage)
        const id = list[0].id
        const newList = renameConfigInList(id, 'New Name', storage)
        expect(newList[0].name).toBe('New Name')
      })

      it('should not affect other configs', () => {
        saveConfigToList(createDefaultConfig(), 'A', storage)
        saveConfigToList(createDefaultConfig(), 'B', storage)
        const listBefore = loadSavedConfigs(storage)
        const idToRename = listBefore[0].id
        const otherId = listBefore[1].id
        const listAfter = renameConfigInList(idToRename, 'C', storage)
        const renamed = listAfter.find((i) => i.id === idToRename)
        const other = listAfter.find((i) => i.id === otherId)
        expect(renamed.name).toBe('C')
        expect(other.name).toBe('A')
      })
    })
  })
})
