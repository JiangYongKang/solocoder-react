import {
  DEFAULT_CONFIG,
  TEMPLATES,
  CARD_SIZES,
  LAYOUT,
  BACKGROUND_MODES,
  GRADIENT_DIRECTIONS,
  TEXT_ALIGNMENTS,
  STORAGE_KEY_CONFIGS,
  STORAGE_KEY_LAST,
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

export function validateConfig(config) {
  if (!config || typeof config !== 'object') return false

  if (!['square', 'portrait'].includes(config.cardSize)) return false

  if (!config.background || typeof config.background !== 'object') return false
  if (!Object.values(BACKGROUND_MODES).includes(config.background.mode)) return false

  for (const field of ['title', 'description']) {
    if (!config[field] || typeof config[field] !== 'object') return false
    if (typeof config[field].text !== 'string') return false
    if (typeof config[field].fontSize !== 'number' || config[field].fontSize <= 0) return false
    if (!isValidColor(config[field].color)) return false
    if (!Object.values(TEXT_ALIGNMENTS).includes(config[field].alignment)) return false
    if (typeof config[field].bold !== 'boolean') return false
  }

  if (!config.logo || typeof config.logo !== 'object') return false
  if (typeof config.logo.enabled !== 'boolean') return false
  if (typeof config.logo.size !== 'number' || config.logo.size <= 0) return false

  if (!config.qrcode || typeof config.qrcode !== 'object') return false
  if (typeof config.qrcode.enabled !== 'boolean') return false
  if (typeof config.qrcode.content !== 'string') return false
  if (typeof config.qrcode.size !== 'number' || config.qrcode.size <= 0) return false

  return true
}

export function sanitizeConfig(config) {
  if (!validateConfig(config)) {
    return createDefaultConfig()
  }
  return deepMerge(createDefaultConfig(), config)
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
  const result = deepClone(config)
  const oldMode = result.background.mode
  result.background._previousMode = oldMode
  result.background.mode = newMode
  return result
}

export function getCardDimensions(cardSize) {
  const size = CARD_SIZES[cardSize] || CARD_SIZES.square
  return { width: size.width, height: size.height }
}

export function getLayoutConfig(cardSize) {
  return LAYOUT[cardSize] || LAYOUT.square
}

export function calculateLogoPosition(cardSize, position, size) {
  const layout = getLayoutConfig(cardSize)
  const pos = layout.logo[position] || layout.logo.top
  return {
    x: pos.x,
    y: pos.y,
    width: size,
    height: size,
  }
}

export function calculateQRCodePosition(cardSize, position, size) {
  const layout = getLayoutConfig(cardSize)
  const pos = layout.qrcode[position] || layout.qrcode.bottom
  return {
    x: pos.x - size / 2,
    y: pos.y - size / 2,
    width: size,
    height: size,
  }
}

export function calculateTextPosition(cardSize, textType) {
  const layout = getLayoutConfig(cardSize)
  return layout[textType] || layout.title
}

export function getGradientCoords(direction, width, height) {
  switch (direction) {
    case GRADIENT_DIRECTIONS.HORIZONTAL:
      return { x1: 0, y1: 0, x2: width, y2: 0 }
    case GRADIENT_DIRECTIONS.VERTICAL:
      return { x1: 0, y1: 0, x2: 0, y2: height }
    case GRADIENT_DIRECTIONS.DIAGONAL:
      return { x1: 0, y1: 0, x2: width, y2: height }
    default:
      return { x1: 0, y1: 0, x2: width, y2: height }
  }
}

export function generateQRMatrix(content, size = 21) {
  const matrix = []
  for (let i = 0; i < size; i++) {
    matrix[i] = new Array(size).fill(0)
  }

  const drawFinderPattern = (row, col) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4
        if (isOuter || isInner) {
          if (row + r < size && col + c < size) {
            matrix[row + r][col + c] = 1
          }
        }
      }
    }
  }

  drawFinderPattern(0, 0)
  drawFinderPattern(0, size - 7)
  drawFinderPattern(size - 7, 0)

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0
    matrix[i][6] = i % 2 === 0 ? 1 : 0
  }

  let seed = 0
  for (let i = 0; i < content.length; i++) {
    seed = (seed * 31 + content.charCodeAt(i)) >>> 0
  }

  const lcg = (seedValue) => {
    let s = seedValue >>> 0
    return () => {
      s = (1664525 * s + 1013904223) >>> 0
      return s / 0xffffffff
    }
  }
  const rand = lcg(seed || 12345)

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 0) {
        const inFinderArea =
          (r < 8 && c < 8) ||
          (r < 8 && c >= size - 8) ||
          (r >= size - 8 && c < 8)
        const inTimingArea = r === 6 || c === 6
        if (!inFinderArea && !inTimingArea) {
          matrix[r][c] = rand() > 0.5 ? 1 : 0
        }
      }
    }
  }

  return matrix
}

export function wrapText(ctx, text, maxWidth) {
  if (!text) return []
  const lines = []
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    if (paragraph === '') {
      lines.push('')
      continue
    }

    let currentLine = ''
    const chars = paragraph.split('')

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i]
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && currentLine !== '') {
        if (/\s/.test(char) || /[，。！？、；：]/.test(char)) {
          lines.push(currentLine.trim())
          currentLine = /\s/.test(char) ? '' : char
        } else {
          lines.push(currentLine)
          currentLine = char
        }
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      lines.push(currentLine.trim())
    }
  }

  return lines.length > 0 ? lines : ['']
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
      .filter((item) => item && item.id && item.timestamp && item.config)
      .map((item) => ({
        ...item,
        config: sanitizeConfig(item.config),
      }))
  } catch {
    return []
  }
}

export function saveConfigToList(config, storage) {
  const s = getStorage(storage)
  if (!s) return []
  try {
    const list = loadSavedConfigs(s)
    const newItem = {
      id: generateId(),
      name: formatTimestamp(Date.now()),
      timestamp: Date.now(),
      config: serializeConfig(config),
    }
    const newList = [newItem, ...list].slice(0, 20)
    s.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(newList))
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
    s.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(newList))
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

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('Invalid image file'))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function imageToDataURL(img) {
  try {
    const canvas = document.createElement('canvas')
    const maxDim = 512
    let { width, height } = img
    const scale = Math.min(1, maxDim / Math.max(width, height))
    width = Math.round(width * scale)
    height = Math.round(height * scale)
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

export function dataURLToImage(dataUrl) {
  return new Promise((resolve, reject) => {
    if (!dataUrl || typeof dataUrl !== 'string') {
      reject(new Error('Invalid data URL'))
      return
    }
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image from data URL'))
    img.src = dataUrl
  })
}
