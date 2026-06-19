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
  ALLOWED_LOGO_TYPES,
  STORAGE_KEY_CONFIGS,
  STORAGE_KEY_LAST,
  PRESET_SCREEN_RATIOS,
} from './constants.js'

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function isValidHexColor(color) {
  if (typeof color !== 'string') return false
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)
}

export function isRgbaColor(color) {
  if (typeof color !== 'string') return false
  return /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(color)
}

export function isValidColor(color) {
  return isValidHexColor(color) || isRgbaColor(color)
}

export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(deepClone)
  const result = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepClone(obj[key])
    }
  }
  return result
}

export function deepMerge(target, source) {
  const result = deepClone(target)
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const srcVal = source[key]
      const tgtVal = result[key]
      if (
        srcVal !== null &&
        typeof srcVal === 'object' &&
        !Array.isArray(srcVal) &&
        tgtVal !== null &&
        typeof tgtVal === 'object' &&
        !Array.isArray(tgtVal)
      ) {
        result[key] = deepMerge(tgtVal, srcVal)
      } else {
        result[key] = deepClone(srcVal)
      }
    }
  }
  return result
}

export function createDefaultConfig() {
  return deepClone(DEFAULT_CONFIG)
}

export function validateLogoSize(size) {
  if (typeof size !== 'number' || Number.isNaN(size)) return false
  return size >= MIN_LOGO_SIZE && size <= MAX_LOGO_SIZE
}

export function normalizeLogoSize(size) {
  if (typeof size !== 'number' || Number.isNaN(size)) return DEFAULT_CONFIG.brand.logo.size
  return clamp(size, MIN_LOGO_SIZE, MAX_LOGO_SIZE)
}

export function validateFontSize(size) {
  if (typeof size !== 'number' || Number.isNaN(size)) return false
  return size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE
}

export function normalizeFontSize(size) {
  if (typeof size !== 'number' || Number.isNaN(size)) return MIN_FONT_SIZE
  return clamp(size, MIN_FONT_SIZE, MAX_FONT_SIZE)
}

export function validateCountdownSeconds(seconds) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return false
  return Number.isInteger(seconds) && seconds >= MIN_COUNTDOWN_SECONDS && seconds <= MAX_COUNTDOWN_SECONDS
}

export function normalizeCountdownSeconds(seconds) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return MIN_COUNTDOWN_SECONDS
  const intVal = Math.round(seconds)
  return clamp(intVal, MIN_COUNTDOWN_SECONDS, MAX_COUNTDOWN_SECONDS)
}

export function validateLogoFile(file) {
  if (!file) return { valid: false, error: '未选择文件' }
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return { valid: false, error: '仅支持 PNG、JPG、SVG 格式' }
  }
  if (file.size > MAX_LOGO_FILE_SIZE) {
    return { valid: false, error: '文件大小超过 1MB 限制' }
  }
  return { valid: true, error: null }
}

export function formatCountdownText(format, seconds) {
  if (typeof format !== 'string') return ''
  return format.replace(/\{n\}/g, String(seconds))
}

export function getTemplateById(id) {
  return TEMPLATES.find((t) => t.id === id) || null
}

export function applyTemplate(config, templateId) {
  const template = getTemplateById(templateId)
  if (!template) return config
  const merged = deepMerge(config, template.config)
  merged.templateId = templateId
  return merged
}

export function switchBackgroundMode(config, newMode) {
  if (!Object.values(BACKGROUND_MODES).includes(newMode)) {
    return config
  }
  const result = deepClone(config)
  const oldMode = result.background.mode
  result.background._previousMode = oldMode
  result.background.mode = newMode
  return result
}

export function getGradientAngle(direction) {
  switch (direction) {
    case GRADIENT_DIRECTIONS.HORIZONTAL:
      return 'to right'
    case GRADIENT_DIRECTIONS.VERTICAL:
      return 'to bottom'
    case GRADIENT_DIRECTIONS.DIAGONAL:
      return 'to bottom right'
    default:
      return 'to bottom right'
  }
}

export function buildBackgroundStyle(background) {
  if (!background) return {}
  const style = {}
  switch (background.mode) {
    case BACKGROUND_MODES.COLOR:
      style.backgroundColor = background.color || '#FFFFFF'
      break
    case BACKGROUND_MODES.IMAGE: {
      if (background.image) {
        style.backgroundImage = `url(${background.image})`
        const fit = background.imageFit || IMAGE_FIT_MODES.COVER
        if (fit === IMAGE_FIT_MODES.STRETCH) {
          style.backgroundSize = '100% 100%'
        } else {
          style.backgroundSize = fit
        }
        style.backgroundRepeat = 'no-repeat'
        style.backgroundPosition = 'center'
      } else {
        style.backgroundColor = background.color || '#FFFFFF'
      }
      break
    }
    case BACKGROUND_MODES.GRADIENT: {
      const angle = getGradientAngle(background.gradientDirection)
      const start = background.gradientStart || '#667eea'
      const end = background.gradientEnd || '#764ba2'
      style.backgroundImage = `linear-gradient(${angle}, ${start}, ${end})`
      break
    }
    default:
      style.backgroundColor = '#FFFFFF'
  }
  return style
}

export function getSkipButtonPositionStyle(position) {
  switch (position) {
    case SKIP_BUTTON_POSITIONS.TOP_RIGHT:
      return { top: '16px', right: '16px', left: 'auto', bottom: 'auto' }
    case SKIP_BUTTON_POSITIONS.BOTTOM_RIGHT:
      return { bottom: '24px', right: '24px', left: 'auto', top: 'auto' }
    case SKIP_BUTTON_POSITIONS.BOTTOM_CENTER:
      return { bottom: '24px', left: '50%', right: 'auto', top: 'auto', transform: 'translateX(-50%)' }
    default:
      return { top: '16px', right: '16px', left: 'auto', bottom: 'auto' }
  }
}

export function getScreenDimensions(ratioKey) {
  const ratio = PRESET_SCREEN_RATIOS[ratioKey] || PRESET_SCREEN_RATIOS.IPHONE_X
  return { width: ratio.width, height: ratio.height, label: ratio.label }
}

export function validateConfig(config) {
  if (!config || typeof config !== 'object') return false

  if (!config.brand || typeof config.brand !== 'object') return false

  if (!config.brand.logo || typeof config.brand.logo !== 'object') return false
  if (!validateLogoSize(config.brand.logo.size)) return false

  if (!config.brand.title || typeof config.brand.title !== 'object') return false
  if (typeof config.brand.title.text !== 'string') return false
  if (!validateFontSize(config.brand.title.fontSize)) return false
  if (!isValidColor(config.brand.title.color)) return false
  if (typeof config.brand.title.bold !== 'boolean') return false

  if (!config.brand.subtitle || typeof config.brand.subtitle !== 'object') return false
  if (typeof config.brand.subtitle.text !== 'string') return false
  if (!validateFontSize(config.brand.subtitle.fontSize)) return false
  if (!isValidColor(config.brand.subtitle.color)) return false
  if (typeof config.brand.subtitle.bold !== 'boolean') return false

  if (!config.background || typeof config.background !== 'object') return false
  if (!Object.values(BACKGROUND_MODES).includes(config.background.mode)) return false
  if (config.background.mode === BACKGROUND_MODES.COLOR || config.background.mode === BACKGROUND_MODES.IMAGE) {
    if (!isValidColor(config.background.color)) return false
  }
  if (config.background.mode === BACKGROUND_MODES.GRADIENT) {
    if (!isValidColor(config.background.gradientStart)) return false
    if (!isValidColor(config.background.gradientEnd)) return false
    if (!Object.values(GRADIENT_DIRECTIONS).includes(config.background.gradientDirection)) return false
  }
  if (config.background.mode === BACKGROUND_MODES.IMAGE) {
    if (!Object.values(IMAGE_FIT_MODES).includes(config.background.imageFit)) return false
  }

  if (!config.interaction || typeof config.interaction !== 'object') return false

  if (!config.interaction.countdown || typeof config.interaction.countdown !== 'object') return false
  if (typeof config.interaction.countdown.enabled !== 'boolean') return false
  if (!validateCountdownSeconds(config.interaction.countdown.seconds)) return false
  if (typeof config.interaction.countdown.format !== 'string') return false

  if (!config.interaction.skipButton || typeof config.interaction.skipButton !== 'object') return false
  if (typeof config.interaction.skipButton.enabled !== 'boolean') return false
  if (typeof config.interaction.skipButton.text !== 'string') return false
  if (!Object.values(SKIP_BUTTON_POSITIONS).includes(config.interaction.skipButton.position)) return false
  if (!isValidColor(config.interaction.skipButton.color)) return false
  if (!isValidColor(config.interaction.skipButton.backgroundColor)) return false

  return true
}

export function sanitizeConfig(config) {
  if (!validateConfig(config)) {
    return createDefaultConfig()
  }
  const sanitized = deepMerge(createDefaultConfig(), config)
  sanitized.brand.logo.size = normalizeLogoSize(sanitized.brand.logo.size)
  sanitized.brand.title.fontSize = normalizeFontSize(sanitized.brand.title.fontSize)
  sanitized.brand.subtitle.fontSize = normalizeFontSize(sanitized.brand.subtitle.fontSize)
  sanitized.interaction.countdown.seconds = normalizeCountdownSeconds(sanitized.interaction.countdown.seconds)
  return sanitized
}

export function serializeConfig(config) {
  const sanitized = sanitizeConfig(config)
  return JSON.stringify(sanitized)
}

export function deserializeConfig(jsonString) {
  try {
    const parsed = JSON.parse(jsonString)
    return sanitizeConfig(parsed)
  } catch {
    return createDefaultConfig()
  }
}

export function validateImportedConfig(config) {
  const errors = []
  if (!config || typeof config !== 'object') {
    errors.push('配置必须是一个对象')
    return { valid: false, errors }
  }
  if (!config.brand) errors.push('缺少 brand 字段')
  if (!config.background) errors.push('缺少 background 字段')
  if (!config.interaction) errors.push('缺少 interaction 字段')
  if (errors.length > 0) return { valid: false, errors }
  if (!validateConfig(config)) {
    errors.push('配置字段校验失败，请检查各字段类型和范围')
    return { valid: false, errors }
  }
  return { valid: true, errors: [] }
}

function getStorage(forceStorage) {
  if (forceStorage) return forceStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  return null
}

export function saveLastConfig(config, storage) {
  const s = getStorage(storage)
  if (!s) return
  try {
    const json = serializeConfig(config)
    s.setItem(STORAGE_KEY_LAST, json)
  } catch {
    // Ignore storage errors
  }
}

export function loadLastConfig(storage) {
  const s = getStorage(storage)
  if (!s) return null
  try {
    const raw = s.getItem(STORAGE_KEY_LAST)
    if (!raw) return null
    return deserializeConfig(raw)
  } catch {
    return null
  }
}

export function loadSavedConfigs(storage) {
  const s = getStorage(storage)
  if (!s) return []
  try {
    const raw = s.getItem(STORAGE_KEY_CONFIGS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item && item.id && item.timestamp && item.name && item.config)
      .map((item) => ({
        ...item,
        config: deserializeConfig(item.config),
      }))
  } catch {
    return []
  }
}

export function saveConfigToList(config, name, storage) {
  const s = getStorage(storage)
  if (!s) return []
  try {
    const list = loadSavedConfigs(s)
    const newItem = {
      id: generateId(),
      name: name || formatTimestamp(Date.now()),
      timestamp: Date.now(),
      config: serializeConfig(config),
    }
    const newList = [newItem, ...list].slice(0, 50)
    s.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(newList.map((i) => ({
      ...i,
      config: typeof i.config === 'string' ? i.config : serializeConfig(i.config),
    }))))
    return newList
  } catch {
    return []
  }
}

export function deleteConfigFromList(id, storage) {
  const s = getStorage(storage)
  if (!s) return []
  try {
    const list = loadSavedConfigs(s)
    const newList = list.filter((item) => item.id !== id)
    s.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(newList.map((i) => ({
      ...i,
      config: typeof i.config === 'string' ? i.config : serializeConfig(i.config),
    }))))
    return newList
  } catch {
    return []
  }
}

export function renameConfigInList(id, newName, storage) {
  const s = getStorage(storage)
  if (!s) return []
  try {
    const list = loadSavedConfigs(s)
    const newList = list.map((item) =>
      item.id === id ? { ...item, name: newName } : item
    )
    s.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(newList.map((i) => ({
      ...i,
      config: typeof i.config === 'string' ? i.config : serializeConfig(i.config),
    }))))
    return newList
  } catch {
    return []
  }
}

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function downloadConfigAsJson(config, filename) {
  const json = serializeConfig(config)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `splash-config-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function parseJsonFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('未选择文件'))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        resolve(parsed)
      } catch {
        reject(new Error('JSON 格式解析失败'))
      }
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsText(file)
  })
}
