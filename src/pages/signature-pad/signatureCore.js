import {
    DEFAULT_COLOR,
    DEFAULT_LINE_WIDTH,
    DEFAULT_SMOOTHING,
    HISTORY_MAX_ITEMS,
    MAX_LINE_WIDTH,
    MAX_SMOOTHING,
    MIN_LINE_WIDTH,
    MIN_SMOOTHING,
    STORAGE_KEY,
    THUMBNAIL_HEIGHT,
    THUMBNAIL_WIDTH,
} from './constants.js'

let idCounter = 0

export const generateId = (prefix = 'sig') => {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export const clampLineWidth = (width) => clamp(width, MIN_LINE_WIDTH, MAX_LINE_WIDTH)

export const clampSmoothing = (level) => clamp(level, MIN_SMOOTHING, MAX_SMOOTHING)

export const createStroke = (color = DEFAULT_COLOR, lineWidth = DEFAULT_LINE_WIDTH) => ({
  id: generateId('stroke'),
  color,
  lineWidth,
  points: [],
})

export const addPointToStroke = (stroke, point) => {
  if (!stroke) return stroke
  return {
    ...stroke,
    points: [...stroke.points, { x: point.x, y: point.y }],
  }
}

export const smoothPoints = (points, smoothingLevel = DEFAULT_SMOOTHING) => {
  if (!Array.isArray(points) || points.length < 3) return points || []

  const level = clampSmoothing(smoothingLevel)
  if (level === 0) return points

  const windowSize = Math.min(level + 2, points.length)
  const halfWindow = Math.floor(windowSize / 2)

  const result = []
  for (let i = 0; i < points.length; i++) {
    if (i === 0 || i === points.length - 1) {
      result.push({ x: points[i].x, y: points[i].y })
      continue
    }

    let sumX = 0
    let sumY = 0
    let count = 0

    const start = Math.max(0, i - halfWindow)
    const end = Math.min(points.length - 1, i + halfWindow)

    for (let j = start; j <= end; j++) {
      const distance = Math.abs(j - i)
      const weight = 1 - distance / (halfWindow + 1)
      sumX += points[j].x * weight
      sumY += points[j].y * weight
      count += weight
    }

    result.push({
      x: count > 0 ? sumX / count : points[i].x,
      y: count > 0 ? sumY / count : points[i].y,
    })
  }

  return result
}

export const getBezierPoints = (points, smoothingLevel = DEFAULT_SMOOTHING) => {
  const smoothed = smoothPoints(points, smoothingLevel)
  if (smoothed.length < 2) return smoothed

  const bezierPoints = [{ x: smoothed[0].x, y: smoothed[0].y }]

  for (let i = 1; i < smoothed.length; i++) {
    const prev = smoothed[i - 1]
    const curr = smoothed[i]
    const midX = (prev.x + curr.x) / 2
    const midY = (prev.y + curr.y) / 2

    bezierPoints.push({
      x: curr.x,
      y: curr.y,
      cpX: midX,
      cpY: midY,
    })
  }

  return bezierPoints
}

export const createHistory = () => ({
  past: [],
  present: [],
  future: [],
})

export const pushHistory = (history, newStrokes, limit = 50) => {
  if (!history) return { past: [], present: newStrokes, future: [] }

  const presentJson = JSON.stringify(history.present)
  const newJson = JSON.stringify(newStrokes)
  if (presentJson === newJson) return history

  const newPast = [...history.past, history.present]
  if (newPast.length > limit) {
    newPast.shift()
  }

  return {
    past: newPast,
    present: newStrokes,
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

export const strokeToPathData = (stroke, smoothingLevel = DEFAULT_SMOOTHING) => {
  if (!stroke || !stroke.points || stroke.points.length < 2) return ''

  if (smoothingLevel === 0 || stroke.points.length < 3) {
    let path = `M ${stroke.points[0].x} ${stroke.points[0].y}`
    for (let i = 1; i < stroke.points.length; i++) {
      path += ` L ${stroke.points[i].x} ${stroke.points[i].y}`
    }
    return path
  }

  const bezierPoints = getBezierPoints(stroke.points, smoothingLevel)
  if (bezierPoints.length < 2) return ''

  let path = `M ${bezierPoints[0].x} ${bezierPoints[0].y}`

  for (let i = 1; i < bezierPoints.length; i++) {
    const p = bezierPoints[i]
    path += ` Q ${p.cpX} ${p.cpY}, ${p.x} ${p.y}`
  }

  return path
}

export const isCanvasEmpty = (strokes) => {
  if (!Array.isArray(strokes)) return true
  return strokes.length === 0 || strokes.every((s) => !s.points || s.points.length < 2)
}

export const getStrokesBounds = (strokes) => {
  if (!Array.isArray(strokes) || strokes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  strokes.forEach((stroke) => {
    if (!stroke.points) return
    stroke.points.forEach((p) => {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    })
  })

  if (minX === Infinity) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export const canvasToDataURL = (canvas, format = 'image/png') => {
  if (!canvas) return ''
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height
  const ctx = tempCanvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
  ctx.drawImage(canvas, 0, 0)
  return tempCanvas.toDataURL(format)
}

export const generateFileName = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `signature_${timestamp}.png`
}

export const downloadDataURL = (dataUrl, filename) => {
  if (!dataUrl || typeof document === 'undefined') return
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export const createThumbnail = (dataUrl, targetWidth = THUMBNAIL_WIDTH, targetHeight = THUMBNAIL_HEIGHT) => {
  return new Promise((resolve) => {
    if (!dataUrl || typeof Image === 'undefined') {
      resolve('')
      return
    }

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, targetWidth, targetHeight)

      const scale = Math.min(targetWidth / img.width, targetHeight / img.height)
      const x = (targetWidth - img.width * scale) / 2
      const y = (targetHeight - img.height * scale) / 2

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve('')
    img.src = dataUrl
  })
}

export const createSignatureRecord = async (dataUrl) => {
  const thumbnail = await createThumbnail(dataUrl)
  return {
    id: generateId('record'),
    dataUrl,
    thumbnail,
    createdAt: Date.now(),
  }
}

export const loadSignaturesFromStorage = (storage = typeof window !== 'undefined' ? window.localStorage : null) => {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) => item && typeof item.id === 'string' && typeof item.dataUrl === 'string' && typeof item.createdAt === 'number'
    )
  } catch {
    return []
  }
}

export const saveSignaturesToStorage = (signatures, storage = typeof window !== 'undefined' ? window.localStorage : null) => {
  if (!storage) return
  try {
    const trimmed = Array.isArray(signatures) ? signatures.slice(-HISTORY_MAX_ITEMS) : []
    storage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // ignore storage errors
  }
}

export const addSignatureToHistory = (history, newRecord, maxItems = HISTORY_MAX_ITEMS) => {
  if (!Array.isArray(history)) history = []
  const updated = [newRecord, ...history]
  if (updated.length > maxItems) {
    return updated.slice(0, maxItems)
  }
  return updated
}

export const removeSignatureFromHistory = (history, id) => {
  if (!Array.isArray(history)) return []
  return history.filter((item) => item.id !== id)
}

export const dataURLToImage = (dataUrl) => {
  return new Promise((resolve, reject) => {
    if (!dataUrl || typeof Image === 'undefined') {
      reject(new Error('Invalid environment'))
      return
    }
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

export const isValidColor = (color) => {
  if (typeof color !== 'string') return false
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) return true
  if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(color)) return true
  if (/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i.test(color)) return true
  return false
}

export const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const drawStrokesOnCanvas = (ctx, strokes, smoothingLevel = DEFAULT_SMOOTHING) => {
  if (!ctx || !Array.isArray(strokes)) return

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  strokes.forEach((stroke) => {
    if (!stroke.points || stroke.points.length < 2) return

    ctx.strokeStyle = stroke.color || DEFAULT_COLOR
    ctx.lineWidth = stroke.lineWidth || DEFAULT_LINE_WIDTH

    if (smoothingLevel === 0 || stroke.points.length < 3) {
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    } else {
      const bezierPoints = getBezierPoints(stroke.points, smoothingLevel)
      ctx.beginPath()
      ctx.moveTo(bezierPoints[0].x, bezierPoints[0].y)

      for (let i = 1; i < bezierPoints.length; i++) {
        const p = bezierPoints[i]
        ctx.quadraticCurveTo(p.cpX, p.cpY, p.x, p.y)
      }

      ctx.stroke()
    }
  })

  ctx.restore()
}
