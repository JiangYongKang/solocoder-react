import { STORAGE_KEY } from './constants.js'

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function truncateText(text, maxLength = 50) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function loadHistory(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item && typeof item === 'object' && item.id && item.content)
  } catch {
    return []
  }
}

export function saveHistory(history, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)))
  } catch {
  }
}

export function addHistoryItem(history, item) {
  const newItem = {
    id: item.id || generateId(),
    content: item.content || '',
    type: item.type || 'generate',
    timestamp: item.timestamp || Date.now(),
    thumbnail: item.thumbnail || null,
    options: item.options || {},
  }
  return [newItem, ...history.filter((h) => h.content !== newItem.content)].slice(0, 50)
}

export function deleteHistoryItem(history, id) {
  return history.filter((item) => item.id !== id)
}

export function clearHistory() {
  return []
}

export function renderQRToCanvas(matrix, canvas, size, options = {}) {
  const { foreground = '#000000', background = '#ffffff', quietZone = 4 } = options
  const ctx = canvas.getContext('2d')
  const matrixSize = matrix.length
  const totalModules = matrixSize + quietZone * 2
  const moduleSize = size / totalModules

  canvas.width = size
  canvas.height = size

  ctx.fillStyle = background
  ctx.fillRect(0, 0, size, size)

  ctx.fillStyle = foreground
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        const x = (quietZone + c) * moduleSize
        const y = (quietZone + r) * moduleSize
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(moduleSize) + 1, Math.ceil(moduleSize) + 1)
      }
    }
  }
}

export function drawLogoOnCanvas(canvas, logoImage, logoSizeRatio = 0.2) {
  const ctx = canvas.getContext('2d')
  const size = canvas.width
  const safeRatio = Math.max(0, Math.min(0.3, logoSizeRatio))
  const logoSize = size * safeRatio
  const logoX = (size - logoSize) / 2
  const logoY = (size - logoSize) / 2

  const padding = logoSize * 0.1
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2)

  ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize)
}

export function canvasToDataURL(canvas, type = 'image/png') {
  return canvas.toDataURL(type)
}

export function downloadCanvas(canvas, filename = 'qrcode.png') {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
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

export function getImageData(img, maxSize = 800) {
  const canvas = document.createElement('canvas')
  let { width, height } = img
  if (width > maxSize || height > maxSize) {
    const scale = maxSize / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function isValidHexColor(color) {
  return typeof color === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)
}
