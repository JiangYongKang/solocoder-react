import {
  DEFAULT_FILTERS,
  FILTER_RANGES,
  ACCEPTED_IMAGE_TYPES,
  HISTORY_LIMIT,
  MIN_CROP_SIZE,
  RATIO_VALUES,
  EXPORT_FORMAT_NAMES,
} from './constants.js'

let idCounter = 0

export const generateId = (prefix = 'item') => {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export const clampFilters = (filters) => {
  const result = {}
  Object.keys(filters).forEach((key) => {
    if (FILTER_RANGES[key]) {
      result[key] = clamp(filters[key], FILTER_RANGES[key].min, FILTER_RANGES[key].max)
    } else {
      result[key] = filters[key]
    }
  })
  return result
}

export const resetFilters = () => ({ ...DEFAULT_FILTERS })

export const areFiltersDefault = (filters) => {
  if (!filters) return true
  return Object.keys(DEFAULT_FILTERS).every((key) => filters[key] === DEFAULT_FILTERS[key])
}

export const validateImageType = (file) => {
  if (!file || !file.type) return false
  return ACCEPTED_IMAGE_TYPES.includes(file.type)
}

export const getImageFileExtension = (file) => {
  if (!file || !file.type) return 'png'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/webp') return 'webp'
  return 'png'
}

export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    if (!validateImageType(file)) {
      reject(new Error('不支持的图片格式，仅支持 PNG、JPG、WebP'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

export const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('图片源为空'))
      return
    }
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('加载图片失败'))
    img.src = src
  })
}

export const calculateFitScale = (imgWidth, imgHeight, containerWidth, containerHeight) => {
  if (imgWidth <= 0 || imgHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
    return { scale: 1, offsetX: 0, offsetY: 0, displayWidth: imgWidth, displayHeight: imgHeight }
  }
  const scale = Math.min(containerWidth / imgWidth, containerHeight / imgHeight)
  const displayWidth = imgWidth * scale
  const displayHeight = imgHeight * scale
  const offsetX = (containerWidth - displayWidth) / 2
  const offsetY = (containerHeight - displayHeight) / 2
  return { scale, offsetX, offsetY, displayWidth, displayHeight }
}

export const screenToImageCoords = (screenX, screenY, offsetX, offsetY, scale) => {
  return {
    x: (screenX - offsetX) / scale,
    y: (screenY - offsetY) / scale,
  }
}

export const imageToScreenCoords = (imgX, imgY, offsetX, offsetY, scale) => {
  return {
    x: imgX * scale + offsetX,
    y: imgY * scale + offsetY,
  }
}

export const applyBrightness = (data, amount) => {
  if (amount === 0) return data
  const factor = 1 + amount / 100
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] * factor, 0, 255)
    data[i + 1] = clamp(data[i + 1] * factor, 0, 255)
    data[i + 2] = clamp(data[i + 2] * factor, 0, 255)
  }
  return data
}

export const applyContrast = (data, amount) => {
  if (amount === 0) return data
  const factor = (259 * (amount + 255)) / (255 * (259 - amount))
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(factor * (data[i] - 128) + 128, 0, 255)
    data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128, 0, 255)
    data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128, 0, 255)
  }
  return data
}

export const applySaturation = (data, amount) => {
  if (amount === 0) return data
  const factor = 1 + amount / 100
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    data[i] = clamp(gray + (r - gray) * factor, 0, 255)
    data[i + 1] = clamp(gray + (g - gray) * factor, 0, 255)
    data[i + 2] = clamp(gray + (b - gray) * factor, 0, 255)
  }
  return data
}

export const applyHue = (data, amount) => {
  if (amount === 0) return data
  const hueDeg = amount * 1.8
  const hueRad = (hueDeg * Math.PI) / 180
  const cos = Math.cos(hueRad)
  const sin = Math.sin(hueRad)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const newR = r * (0.213 + cos * 0.787 - sin * 0.213) + g * (0.715 - cos * 0.715 - sin * 0.715) + b * (0.072 - cos * 0.072 + sin * 0.928)
    const newG = r * (0.213 - cos * 0.213 + sin * 0.143) + g * (0.715 + cos * 0.285 + sin * 0.140) + b * (0.072 - cos * 0.072 - sin * 0.283)
    const newB = r * (0.213 - cos * 0.213 - sin * 0.787) + g * (0.715 - cos * 0.715 + sin * 0.715) + b * (0.072 + cos * 0.928 + sin * 0.072)
    data[i] = clamp(newR, 0, 255)
    data[i + 1] = clamp(newG, 0, 255)
    data[i + 2] = clamp(newB, 0, 255)
  }
  return data
}

export const applyBlur = (data, width, height, amount) => {
  if (amount <= 0) return data
  const radius = Math.min(Math.round(amount), 50)
  if (radius < 1) return data
  const src = new Uint8ClampedArray(data)
  const w = width
  const h = height
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy
        if (ny < 0 || ny >= h) continue
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx
          if (nx < 0 || nx >= w) continue
          const idx = (ny * w + nx) * 4
          r += src[idx]
          g += src[idx + 1]
          b += src[idx + 2]
          a += src[idx + 3]
          count++
        }
      }
      const idx = (y * w + x) * 4
      data[idx] = r / count
      data[idx + 1] = g / count
      data[idx + 2] = b / count
      data[idx + 3] = a / count
    }
  }
  return data
}

export const applyFiltersToData = (imageData, filters) => {
  const data = new Uint8ClampedArray(imageData.data)
  const clamped = clampFilters(filters)
  applyBrightness(data, clamped.brightness)
  applyContrast(data, clamped.contrast)
  applySaturation(data, clamped.saturation)
  applyHue(data, clamped.hue)
  if (clamped.blur > 0) {
    applyBlur(data, imageData.width, imageData.height, clamped.blur)
  }
  if (typeof ImageData !== 'undefined') {
    return new ImageData(data, imageData.width, imageData.height)
  }
  return { data, width: imageData.width, height: imageData.height }
}

export const rotateImage90CW = (canvas) => {
  const newCanvas = document.createElement('canvas')
  newCanvas.width = canvas.height
  newCanvas.height = canvas.width
  const ctx = newCanvas.getContext('2d')
  ctx.translate(newCanvas.width, 0)
  ctx.rotate(Math.PI / 2)
  ctx.drawImage(canvas, 0, 0)
  return newCanvas
}

export const rotateImage90CCW = (canvas) => {
  const newCanvas = document.createElement('canvas')
  newCanvas.width = canvas.height
  newCanvas.height = canvas.width
  const ctx = newCanvas.getContext('2d')
  ctx.translate(0, newCanvas.height)
  ctx.rotate(-Math.PI / 2)
  ctx.drawImage(canvas, 0, 0)
  return newCanvas
}

export const rotateImageFree = (canvas, degrees) => {
  if (degrees === 0) return canvas
  const rad = (degrees * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  const newWidth = canvas.width * cos + canvas.height * sin
  const newHeight = canvas.width * sin + canvas.height * cos
  const newCanvas = document.createElement('canvas')
  newCanvas.width = newWidth
  newCanvas.height = newHeight
  const ctx = newCanvas.getContext('2d')
  ctx.translate(newWidth / 2, newHeight / 2)
  ctx.rotate(rad)
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)
  return newCanvas
}

export const flipImageHorizontal = (canvas) => {
  const newCanvas = document.createElement('canvas')
  newCanvas.width = canvas.width
  newCanvas.height = canvas.height
  const ctx = newCanvas.getContext('2d')
  ctx.translate(newCanvas.width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(canvas, 0, 0)
  return newCanvas
}

export const flipImageVertical = (canvas) => {
  const newCanvas = document.createElement('canvas')
  newCanvas.width = canvas.width
  newCanvas.height = canvas.height
  const ctx = newCanvas.getContext('2d')
  ctx.translate(0, newCanvas.height)
  ctx.scale(1, -1)
  ctx.drawImage(canvas, 0, 0)
  return newCanvas
}

export const cropImage = (canvas, x, y, width, height) => {
  const safeX = Math.max(0, Math.floor(x))
  const safeY = Math.max(0, Math.floor(y))
  const safeW = Math.max(MIN_CROP_SIZE, Math.min(Math.floor(width), canvas.width - safeX))
  const safeH = Math.max(MIN_CROP_SIZE, Math.min(Math.floor(height), canvas.height - safeY))
  const newCanvas = document.createElement('canvas')
  newCanvas.width = safeW
  newCanvas.height = safeH
  const ctx = newCanvas.getContext('2d')
  ctx.drawImage(canvas, safeX, safeY, safeW, safeH, 0, 0, safeW, safeH)
  return newCanvas
}

export const normalizeCropRect = (x, y, width, height) => {
  const nx = width >= 0 ? x : x + width
  const ny = height >= 0 ? y : y + height
  const nWidth = Math.abs(width)
  const nHeight = Math.abs(height)
  return { x: nx, y: ny, width: nWidth, height: nHeight }
}

export const applyRatioToCrop = (x1, y1, x2, y2, ratio, imageWidth, imageHeight) => {
  if (!ratio || ratio <= 0) {
    return normalizeCropRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1))
  }
  const startX = x1
  const startY = y1
  let dx = x2 - x1
  let dy = y2 - y1
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  if (absDx / absDy > ratio) {
    dx = absDy * ratio * Math.sign(dx || 1)
  } else {
    dy = (absDx / ratio) * Math.sign(dy || 1)
  }
  let endX = startX + dx
  let endY = startY + dy
  if (endX < 0) {
    endX = 0
    dy = (endX - startX) / ratio * Math.sign(dy || 1)
    endY = startY + dy
  }
  if (endX > imageWidth) {
    endX = imageWidth
    dy = (endX - startX) / ratio * Math.sign(dy || 1)
    endY = startY + dy
  }
  if (endY < 0) {
    endY = 0
    dx = (endY - startY) * ratio * Math.sign(dx || 1)
    endX = startX + dx
  }
  if (endY > imageHeight) {
    endY = imageHeight
    dx = (endY - startY) * ratio * Math.sign(dx || 1)
    endX = startX + dx
  }
  return normalizeCropRect(Math.min(startX, endX), Math.min(startY, endY), Math.abs(endX - startX), Math.abs(endY - startY))
}

export const createTextAnnotation = (x, y, text, color, fontSize) => ({
  id: generateId('text'),
  type: 'text',
  x,
  y,
  text,
  color,
  fontSize,
})

export const createBrushAnnotation = (points, color, lineWidth) => ({
  id: generateId('brush'),
  type: 'brush',
  points: points.map((p) => ({ x: p.x, y: p.y })),
  color,
  lineWidth,
})

export const addAnnotation = (annotations, annotation) => {
  return [...annotations, annotation]
}

export const removeAnnotation = (annotations, annotationId) => {
  return annotations.filter((a) => a.id !== annotationId)
}

export const updateAnnotation = (annotations, annotationId, updates) => {
  return annotations.map((a) => (a.id === annotationId ? { ...a, ...updates } : a))
}

export const addBrushPoint = (brushAnnotation, point) => {
  if (!brushAnnotation || brushAnnotation.type !== 'brush') return brushAnnotation
  return {
    ...brushAnnotation,
    points: [...brushAnnotation.points, { x: point.x, y: point.y }],
  }
}

export const isPointInTextAnnotation = (px, py, textAnnotation) => {
  if (!textAnnotation || textAnnotation.type !== 'text') return false
  const charCount = textAnnotation.text?.length || 1
  const approxWidth = Math.max(charCount * textAnnotation.fontSize * 0.6, textAnnotation.fontSize)
  const approxHeight = textAnnotation.fontSize * 1.2
  const top = textAnnotation.y - approxHeight
  const bottom = textAnnotation.y + approxHeight * 0.2
  const left = textAnnotation.x
  const right = textAnnotation.x + approxWidth
  return px >= left && px <= right && py >= top && py <= bottom
}

export const findTextAnnotationAtPoint = (annotations, px, py) => {
  for (let i = annotations.length - 1; i >= 0; i--) {
    const ann = annotations[i]
    if (ann.type === 'text' && isPointInTextAnnotation(px, py, ann)) {
      return ann
    }
  }
  return null
}

export const createHistory = () => ({
  past: [],
  present: null,
  future: [],
})

export const pushHistory = (history, newState, limit = HISTORY_LIMIT) => {
  if (!history) return { past: [], present: newState, future: [] }
  if (JSON.stringify(history.present) === JSON.stringify(newState)) return history
  const newPast = history.present !== null ? [...history.past, history.present] : [...history.past]
  if (newPast.length > limit) {
    newPast.shift()
  }
  return {
    past: newPast,
    present: newState,
    future: [],
  }
}

export const undoHistory = (history) => {
  if (!history || history.past.length === 0) return history
  const newPast = [...history.past]
  const previous = newPast.pop()
  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  }
}

export const redoHistory = (history) => {
  if (!history || history.future.length === 0) return history
  const newFuture = [...history.future]
  const next = newFuture.shift()
  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  }
}

export const canUndo = (history) => !!(history && history.past && history.past.length > 0)
export const canRedo = (history) => !!(history && history.future && history.future.length > 0)

export const createEditorState = () => ({
  imageLoaded: false,
  filters: { ...DEFAULT_FILTERS },
  rotation: 0,
  flippedH: false,
  flippedV: false,
  annotations: [],
})

export const cloneEditorState = (state) => ({
  ...state,
  filters: { ...state.filters },
  annotations: state.annotations.map((a) =>
    a.type === 'brush'
      ? { ...a, points: a.points.map((p) => ({ ...p })) }
      : { ...a }
  ),
})

export const getExportFileName = (baseName, format) => {
  const ext = EXPORT_FORMAT_NAMES[format]?.toLowerCase() || 'png'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${baseName}-${timestamp}.${ext}`
}

export const isValidColor = (color) => {
  if (typeof color !== 'string') return false
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) return true
  if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(color)) return true
  if (/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i.test(color)) return true
  return false
}

export const clampBrushSize = (size) => clamp(size, 1, 50)
export const clampFontSize = (size) => clamp(size, 8, 72)
export const clampRotation = (deg) => clamp(deg, -180, 180)
export const clampQuality = (q) => clamp(q, 0, 100) / 100

export const getRatioByType = (ratioType) => RATIO_VALUES[ratioType] || null
