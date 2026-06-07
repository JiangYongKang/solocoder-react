import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isValidHexColor,
  validateConfig,
  mergeConfigWithDefaults,
  parseConfigFromJson,
  exportConfigToJson,
  hexToRgb,
  hexToRgbString,
  hexToRgba,
  getContrastColor,
  loadConfigFromStorage,
  saveConfigToStorage,
  clearConfigStorage,
  applyThemeToDocument,
  STORAGE_KEY,
} from '../../theme-editor/themeUtils'
import {
  getDefaultConfig,
  getColorsByMode,
  THEME_MODES,
  LIGHT_COLORS,
  DARK_COLORS,
  DEFAULT_TYPOGRAPHY,
} from '../../theme-editor/themeConfig'

describe('themeConfig', () => {
  describe('getDefaultConfig', () => {
    it('应该返回包含 mode、colors、typography 的完整配置对象', () => {
      const config = getDefaultConfig()
      expect(config).toHaveProperty('mode')
      expect(config).toHaveProperty('colors')
      expect(config).toHaveProperty('typography')
      expect(config.mode).toBe(THEME_MODES.LIGHT)
    })

    it('每次调用应该返回独立的对象，避免引用污染', () => {
      const config1 = getDefaultConfig()
      const config2 = getDefaultConfig()
      config1.colors.primary = '#000000'
      expect(config2.colors.primary).toBe(LIGHT_COLORS.primary)
    })
  })

  describe('getColorsByMode', () => {
    it('light 模式应该返回亮色配色', () => {
      const colors = getColorsByMode(THEME_MODES.LIGHT)
      expect(colors).toEqual(LIGHT_COLORS)
    })

    it('dark 模式应该返回暗色配色', () => {
      const colors = getColorsByMode(THEME_MODES.DARK)
      expect(colors).toEqual(DARK_COLORS)
    })
  })
})

describe('themeUtils - 颜色验证与转换', () => {
  describe('isValidHexColor', () => {
    it('应该接受 6 位十六进制颜色', () => {
      expect(isValidHexColor('#aa3bff')).toBe(true)
      expect(isValidHexColor('#AA3BFF')).toBe(true)
      expect(isValidHexColor('#ffffff')).toBe(true)
      expect(isValidHexColor('#000000')).toBe(true)
    })

    it('应该接受 3 位十六进制颜色', () => {
      expect(isValidHexColor('#fff')).toBe(true)
      expect(isValidHexColor('#000')).toBe(true)
      expect(isValidHexColor('#aF3')).toBe(true)
    })

    it('应该拒绝无效格式', () => {
      expect(isValidHexColor('')).toBe(false)
      expect(isValidHexColor('aa3bff')).toBe(false)
      expect(isValidHexColor('#gggggg')).toBe(false)
      expect(isValidHexColor('#12345')).toBe(false)
      expect(isValidHexColor('#1234567')).toBe(false)
      expect(isValidHexColor(null)).toBe(false)
      expect(isValidHexColor(undefined)).toBe(false)
      expect(isValidHexColor(123)).toBe(false)
      expect(isValidHexColor({})).toBe(false)
    })
  })

  describe('hexToRgb', () => {
    it('应该正确转换十六进制颜色为 RGB', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 })
    })

    it('无效颜色应该返回 null', () => {
      expect(hexToRgb('invalid')).toBe(null)
      expect(hexToRgb('#ggg')).toBe(null)
    })
  })

  describe('hexToRgbString', () => {
    it('应该返回 "r, g, b" 格式字符串', () => {
      expect(hexToRgbString('#ffffff')).toBe('255, 255, 255')
      expect(hexToRgbString('#000000')).toBe('0, 0, 0')
      expect(hexToRgbString('#ff0000')).toBe('255, 0, 0')
    })

    it('无效颜色应该返回默认 "0, 0, 0"', () => {
      expect(hexToRgbString('invalid')).toBe('0, 0, 0')
    })
  })

  describe('hexToRgba', () => {
    it('应该返回带 alpha 通道的 rgba 字符串', () => {
      expect(hexToRgba('#ffffff', 0.1)).toBe('rgba(255, 255, 255, 0.1)')
      expect(hexToRgba('#ff0000', 0.3)).toBe('rgba(255, 0, 0, 0.3)')
      expect(hexToRgba('#00ff00', 0.5)).toBe('rgba(0, 255, 0, 0.5)')
    })
  })

  describe('getContrastColor', () => {
    it('亮色背景应该返回黑色', () => {
      expect(getContrastColor('#ffffff')).toBe('#000000')
      expect(getContrastColor('#ffff00')).toBe('#000000')
    })

    it('暗色背景应该返回白色', () => {
      expect(getContrastColor('#000000')).toBe('#ffffff')
      expect(getContrastColor('#0000ff')).toBe('#ffffff')
    })

    it('无效颜色应该返回默认黑色', () => {
      expect(getContrastColor('invalid')).toBe('#000000')
    })
  })
})

describe('themeUtils - 配置验证', () => {
  describe('validateConfig', () => {
    it('空配置应该返回无效', () => {
      const result = validateConfig(null)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('有效配置应该通过验证', () => {
      const config = getDefaultConfig()
      const result = validateConfig(config)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('无效的主题模式应该报错', () => {
      const config = { ...getDefaultConfig(), mode: 'invalid' }
      const result = validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('主题模式'))).toBe(true)
    })

    it('无效的颜色格式应该报错', () => {
      const config = {
        ...getDefaultConfig(),
        colors: { ...getDefaultConfig().colors, primary: 'invalid' },
      }
      const result = validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('primary'))).toBe(true)
    })

    it('字体大小超出范围应该报错', () => {
      const config = {
        ...getDefaultConfig(),
        typography: { ...DEFAULT_TYPOGRAPHY, fontSize: 8 },
      }
      const result = validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('字体大小'))).toBe(true)
    })

    it('行高超出范围应该报错', () => {
      const config = {
        ...getDefaultConfig(),
        typography: { ...DEFAULT_TYPOGRAPHY, lineHeight: 5 },
      }
      const result = validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('行高'))).toBe(true)
    })

    it('段落间距超出范围应该报错', () => {
      const config = {
        ...getDefaultConfig(),
        typography: { ...DEFAULT_TYPOGRAPHY, paragraphSpacing: 100 },
      }
      const result = validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('段落间距'))).toBe(true)
    })
  })

  describe('mergeConfigWithDefaults', () => {
    it('空对象应该返回完整默认配置', () => {
      const result = mergeConfigWithDefaults({})
      expect(result.mode).toBe(THEME_MODES.LIGHT)
      expect(result.colors).toEqual(LIGHT_COLORS)
      expect(result.typography).toEqual(DEFAULT_TYPOGRAPHY)
    })

    it('应该保留传入的自定义配置', () => {
      const partial = {
        mode: THEME_MODES.DARK,
        colors: { primary: '#ff0000' },
        typography: { fontSize: 18 },
      }
      const result = mergeConfigWithDefaults(partial)
      expect(result.mode).toBe(THEME_MODES.DARK)
      expect(result.colors.primary).toBe('#ff0000')
      expect(result.typography.fontSize).toBe(18)
    })

    it('dark 模式下未指定的颜色应该使用暗色默认值', () => {
      const partial = { mode: THEME_MODES.DARK }
      const result = mergeConfigWithDefaults(partial)
      expect(result.colors.background).toBe(DARK_COLORS.background)
    })

    it('undefined 输入应该返回默认配置', () => {
      const result = mergeConfigWithDefaults(undefined)
      expect(result).toEqual(getDefaultConfig())
    })
  })
})

describe('themeUtils - JSON 导入导出', () => {
  describe('exportConfigToJson', () => {
    it('应该返回格式化的 JSON 字符串', () => {
      const config = getDefaultConfig()
      const json = exportConfigToJson(config)
      expect(typeof json).toBe('string')
      const parsed = JSON.parse(json)
      expect(parsed).toEqual(config)
    })
  })

  describe('parseConfigFromJson', () => {
    it('应该正确解析有效配置', () => {
      const config = getDefaultConfig()
      const json = JSON.stringify(config)
      const result = parseConfigFromJson(json)
      expect(result.success).toBe(true)
      expect(result.config).toEqual(config)
    })

    it('无效 JSON 应该返回错误', () => {
      const result = parseConfigFromJson('not valid json')
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('无效配置内容应该返回错误', () => {
      const json = JSON.stringify({ mode: 'invalid' })
      const result = parseConfigFromJson(json)
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})

describe('themeUtils - localStorage 持久化', () => {
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

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('saveConfigToStorage', () => {
    it('应该成功保存配置到 localStorage', () => {
      const config = getDefaultConfig()
      const result = saveConfigToStorage(config)
      expect(result).toBe(true)
      const stored = localStorage.getItem(STORAGE_KEY)
      expect(JSON.parse(stored)).toEqual(config)
    })
  })

  describe('loadConfigFromStorage', () => {
    it('localStorage 为空时应该返回默认配置', () => {
      const config = loadConfigFromStorage()
      expect(config).toEqual(getDefaultConfig())
    })

    it('应该正确加载已保存的配置', () => {
      const original = {
        ...getDefaultConfig(),
        typography: { ...DEFAULT_TYPOGRAPHY, fontSize: 20 },
      }
      saveConfigToStorage(original)
      const loaded = loadConfigFromStorage()
      expect(loaded.typography.fontSize).toBe(20)
    })

    it('损坏的 JSON 应该回退到默认配置', () => {
      localStorage.setItem(STORAGE_KEY, '{invalid json}')
      const config = loadConfigFromStorage()
      expect(config).toEqual(getDefaultConfig())
    })
  })

  describe('clearConfigStorage', () => {
    it('应该清除已保存的配置', () => {
      saveConfigToStorage(getDefaultConfig())
      clearConfigStorage()
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })
})

describe('themeUtils - CSS 变量应用', () => {
  it('applyThemeToDocument 应该正确设置 CSS 变量（包括 rgb 分量）', () => {
    const mockElement = {
      style: {},
      dataset: {},
    }
    mockElement.style.setProperty = function (key, value) {
      mockElement.style[key] = value
    }

    const config = getDefaultConfig()
    applyThemeToDocument(config, mockElement)

    expect(mockElement.style['--te-primary']).toBe(config.colors.primary)
    expect(mockElement.style['--te-background']).toBe(config.colors.background)
    expect(mockElement.style['--te-font-size']).toBe(`${config.typography.fontSize}px`)
    expect(mockElement.style['--te-line-height']).toBe(config.typography.lineHeight)
    expect(mockElement.dataset.themeMode).toBe(config.mode)

    expect(mockElement.style['--te-primary-rgb']).toBe('170, 59, 255')
    expect(mockElement.style['--te-success-rgb']).toBe('34, 197, 94')
    expect(mockElement.style['--te-error-rgb']).toBe('239, 68, 68')
    expect(mockElement.style['--te-warning-rgb']).toBe('245, 158, 11')
  })
})
