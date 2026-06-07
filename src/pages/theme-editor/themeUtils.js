import { getDefaultConfig, LIGHT_COLORS, DARK_COLORS, THEME_MODES } from './themeConfig'

export const STORAGE_KEY = 'solocoder-theme-editor-config'

export const loadConfigFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultConfig()
    const parsed = JSON.parse(raw)
    return mergeConfigWithDefaults(parsed)
  } catch {
    return getDefaultConfig()
  }
}

export const saveConfigToStorage = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    return true
  } catch {
    return false
  }
}

export const clearConfigStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export const mergeConfigWithDefaults = (partial) => {
  const defaults = getDefaultConfig()
  const baseColors = partial?.mode === THEME_MODES.DARK ? DARK_COLORS : LIGHT_COLORS

  return {
    mode: partial?.mode || defaults.mode,
    colors: {
      ...baseColors,
      ...(partial?.colors || {}),
    },
    typography: {
      ...defaults.typography,
      ...(partial?.typography || {}),
    },
  }
}

export const isValidHexColor = (color) => {
  if (typeof color !== 'string') return false
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)
}

export const validateConfig = (config) => {
  const errors = []

  if (!config) {
    errors.push('配置为空')
    return { valid: false, errors }
  }

  if (config.mode !== THEME_MODES.LIGHT && config.mode !== THEME_MODES.DARK) {
    errors.push('无效的主题模式')
  }

  if (typeof config.colors !== 'object' || config.colors === null) {
    errors.push('颜色配置无效')
  } else {
    for (const [key, value] of Object.entries(config.colors)) {
      if (!isValidHexColor(value)) {
        errors.push(`颜色 ${key} 格式无效: ${value}`)
      }
    }
  }

  if (typeof config.typography !== 'object' || config.typography === null) {
    errors.push('字体配置无效')
  } else {
    const { fontSize, lineHeight, paragraphSpacing } = config.typography
    if (typeof fontSize !== 'number' || fontSize < 12 || fontSize > 24) {
      errors.push('字体大小必须在 12-24px 之间')
    }
    if (typeof lineHeight !== 'number' || lineHeight < 1 || lineHeight > 3) {
      errors.push('行高必须在 1-3 之间')
    }
    if (typeof paragraphSpacing !== 'number' || paragraphSpacing < 0 || paragraphSpacing > 48) {
      errors.push('段落间距必须在 0-48px 之间')
    }
  }

  return { valid: errors.length === 0, errors }
}

export const exportConfigToJson = (config) => {
  return JSON.stringify(config, null, 2)
}

export const parseConfigFromJson = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString)
    const { valid, errors } = validateConfig(parsed)
    if (!valid) {
      return { success: false, errors }
    }
    return { success: true, config: mergeConfigWithDefaults(parsed) }
  } catch (e) {
    return { success: false, errors: [`JSON 解析失败: ${e.message}`] }
  }
}

export const applyThemeToDocument = (config, rootElement) => {
  const target = rootElement || document.documentElement
  const { colors, typography } = config

  const setColorVar = (name, value) => {
    target.style.setProperty(`--te-${name}`, value)
    target.style.setProperty(`--te-${name}-rgb`, hexToRgbString(value))
  }

  setColorVar('primary', colors.primary)
  setColorVar('background', colors.background)
  setColorVar('surface', colors.surface)
  setColorVar('text', colors.text)
  setColorVar('text-secondary', colors.textSecondary)
  setColorVar('border', colors.border)
  setColorVar('accent', colors.accent)
  setColorVar('success', colors.success)
  setColorVar('warning', colors.warning)
  setColorVar('error', colors.error)

  target.style.setProperty('--te-font-size', `${typography.fontSize}px`)
  target.style.setProperty('--te-line-height', typography.lineHeight)
  target.style.setProperty('--te-paragraph-spacing', `${typography.paragraphSpacing}px`)

  target.dataset.themeMode = config.mode
}

export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

export const hexToRgbString = (hex) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return '0, 0, 0'
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`
}

export const hexToRgba = (hex, alpha) => {
  const rgbStr = hexToRgbString(hex)
  return `rgba(${rgbStr}, ${alpha})`
}

export const getContrastColor = (hexColor) => {
  const rgb = hexToRgb(hexColor)
  if (!rgb) return '#000000'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export const triggerDownload = (content, filename, mimeType = 'application/json') => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
