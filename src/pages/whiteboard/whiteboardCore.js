import {
  STORAGE_KEY,
  MIN_ZOOM,
  MAX_ZOOM,
  MIN_LINE_WIDTH,
  MAX_LINE_WIDTH,
  MIN_ERASER_SIZE,
  MAX_ERASER_SIZE,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  SHAPE_TYPES,
} from './constants.js'

let idCounter = 0

export function generateId(prefix = 'shape') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function clampZoom(zoom) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
}

export function clampLineWidth(width) {
  return Math.max(MIN_LINE_WIDTH, Math.min(MAX_LINE_WIDTH, width))
}

export function clampEraserSize(size) {
  return Math.max(MIN_ERASER_SIZE, Math.min(MAX_ERASER_SIZE, size))
}

export function clampFontSize(size) {
  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size))
}

export function screenToWorld(screenX, screenY, panX, panY, zoom) {
  return {
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom,
  }
}

export function worldToScreen(worldX, worldY, panX, panY, zoom) {
  return {
    x: worldX * zoom + panX,
    y: worldY * zoom + panY,
  }
}

export function createBrushShape(points = [], color = '#333333', lineWidth = 2) {
  return {
    id: generateId(),
    type: SHAPE_TYPES.BRUSH,
    points: points.map((p) => ({ x: p.x, y: p.y })),
    color,
    lineWidth,
  }
}

export function createRectangleShape(x, y, width, height, color = '#333333', lineWidth = 2) {
  return {
    id: generateId(),
    type: SHAPE_TYPES.RECTANGLE,
    x,
    y,
    width,
    height,
    color,
    lineWidth,
  }
}

export function createCircleShape(cx, cy, rx, ry, color = '#333333', lineWidth = 2) {
  return {
    id: generateId(),
    type: SHAPE_TYPES.CIRCLE,
    cx,
    cy,
    rx,
    ry,
    color,
    lineWidth,
  }
}

export function createLineShape(x1, y1, x2, y2, color = '#333333', lineWidth = 2) {
  return {
    id: generateId(),
    type: SHAPE_TYPES.LINE,
    x1,
    y1,
    x2,
    y2,
    color,
    lineWidth,
  }
}

export function createTextShape(x, y, text, color = '#333333', fontSize = 16) {
  return {
    id: generateId(),
    type: SHAPE_TYPES.TEXT,
    x,
    y,
    text,
    color,
    fontSize,
  }
}

export function normalizeRectangle(x, y, width, height) {
  const nx = width >= 0 ? x : x + width
  const ny = height >= 0 ? y : y + height
  const nWidth = Math.abs(width)
  const nHeight = Math.abs(height)
  return { x: nx, y: ny, width: nWidth, height: nHeight }
}

export function normalizeCircle(cx, cy, rx, ry) {
  return {
    cx,
    cy,
    rx: Math.abs(rx),
    ry: Math.abs(ry),
  }
}

export function snapLineToAngle(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  const distance = Math.sqrt(dx * dx + dy * dy)

  const absAngle = Math.abs(angle)
  let snappedAngle = angle

  if (absAngle < 22.5 || absAngle > 157.5) {
    snappedAngle = dx >= 0 ? 0 : 180
  } else if (absAngle > 67.5 && absAngle < 112.5) {
    snappedAngle = dy >= 0 ? 90 : -90
  } else if (angle > 22.5 && angle < 67.5) {
    snappedAngle = 45
  } else if (angle > -67.5 && angle < -22.5) {
    snappedAngle = -45
  } else if (angle > 112.5 && angle < 157.5) {
    snappedAngle = 135
  } else if (angle > -157.5 && angle < -112.5) {
    snappedAngle = -135
  }

  const rad = snappedAngle * (Math.PI / 180)
  return {
    x1,
    y1,
    x2: x1 + distance * Math.cos(rad),
    y2: y1 + distance * Math.sin(rad),
  }
}

export function addShape(shapes, shape) {
  return [...shapes, shape]
}

export function removeShape(shapes, shapeId) {
  return shapes.filter((s) => s.id !== shapeId)
}

export function updateShape(shapes, shapeId, updates) {
  return shapes.map((s) => (s.id === shapeId ? { ...s, ...updates } : s))
}

export function addBrushPoint(brushShape, point) {
  if (!brushShape || brushShape.type !== SHAPE_TYPES.BRUSH) return brushShape
  return {
    ...brushShape,
    points: [...brushShape.points, { x: point.x, y: point.y }],
  }
}

export function undo(shapes, history, historyIndex) {
  if (historyIndex <= 0) return { shapes, historyIndex }
  const newIndex = historyIndex - 1
  return {
    shapes: newIndex === 0 ? [] : JSON.parse(JSON.stringify(history[newIndex - 1])),
    historyIndex: newIndex,
  }
}

export function redo(shapes, history, historyIndex) {
  if (historyIndex >= history.length) return { shapes, historyIndex }
  const newIndex = historyIndex + 1
  return {
    shapes: JSON.parse(JSON.stringify(history[newIndex - 1])),
    historyIndex: newIndex,
  }
}

export function pushHistory(history, historyIndex, shapes) {
  const newHistory = history.slice(0, historyIndex)
  newHistory.push(JSON.parse(JSON.stringify(shapes)))
  return {
    history: newHistory,
    historyIndex: newHistory.length,
  }
}

export function canUndo(historyIndex) {
  return historyIndex > 0
}

export function canRedo(history, historyIndex) {
  return historyIndex < history.length
}

export function loadFromStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveToStorage(shapes, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(shapes))
    return true
  } catch {
    return false
  }
}

export function clearStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return false
  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function exportToJson(shapes) {
  return {
    version: '1.0',
    shapes,
    exportedAt: new Date().toISOString(),
  }
}

export function downloadJson(shapes, filename = 'whiteboard.json') {
  if (typeof window === 'undefined' || !window.document) return false
  try {
    const data = exportToJson(shapes)
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

export function validateShape(shape) {
  if (!shape || typeof shape !== 'object') return false
  if (!shape.id || typeof shape.id !== 'string') return false
  if (!shape.type || typeof shape.type !== 'string') return false

  const validTypes = Object.values(SHAPE_TYPES)
  if (!validTypes.includes(shape.type)) return false

  switch (shape.type) {
    case SHAPE_TYPES.BRUSH:
      if (!Array.isArray(shape.points)) return false
      if (shape.points.length < 2) return false
      return shape.points.every((p) => typeof p.x === 'number' && typeof p.y === 'number')
    case SHAPE_TYPES.RECTANGLE:
      return (
        typeof shape.x === 'number' &&
        typeof shape.y === 'number' &&
        typeof shape.width === 'number' &&
        typeof shape.height === 'number'
      )
    case SHAPE_TYPES.CIRCLE:
      return (
        typeof shape.cx === 'number' &&
        typeof shape.cy === 'number' &&
        typeof shape.rx === 'number' &&
        typeof shape.ry === 'number'
      )
    case SHAPE_TYPES.LINE:
      return (
        typeof shape.x1 === 'number' &&
        typeof shape.y1 === 'number' &&
        typeof shape.x2 === 'number' &&
        typeof shape.y2 === 'number'
      )
    case SHAPE_TYPES.TEXT:
      return (
        typeof shape.x === 'number' &&
        typeof shape.y === 'number' &&
        typeof shape.text === 'string' &&
        typeof shape.fontSize === 'number'
      )
    default:
      return false
  }
}

export function importFromJson(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    return { valid: false, error: '无效的 JSON 数据' }
  }
  if (!Array.isArray(jsonData.shapes)) {
    return { valid: false, error: '缺少 shapes 数据' }
  }
  const invalidIdx = jsonData.shapes.findIndex((s) => !validateShape(s))
  if (invalidIdx !== -1) {
    return { valid: false, error: `第 ${invalidIdx + 1} 个图形数据无效` }
  }
  return { valid: true, data: jsonData.shapes }
}

export function getShapesBounds(shapes) {
  if (!shapes || shapes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  shapes.forEach((shape) => {
    switch (shape.type) {
      case SHAPE_TYPES.BRUSH:
        shape.points.forEach((p) => {
          minX = Math.min(minX, p.x)
          minY = Math.min(minY, p.y)
          maxX = Math.max(maxX, p.x)
          maxY = Math.max(maxY, p.y)
        })
        break
      case SHAPE_TYPES.RECTANGLE: {
        const r = normalizeRectangle(shape.x, shape.y, shape.width, shape.height)
        minX = Math.min(minX, r.x)
        minY = Math.min(minY, r.y)
        maxX = Math.max(maxX, r.x + r.width)
        maxY = Math.max(maxY, r.y + r.height)
        break
      }
      case SHAPE_TYPES.CIRCLE: {
        const c = normalizeCircle(shape.cx, shape.cy, shape.rx, shape.ry)
        minX = Math.min(minX, c.cx - c.rx)
        minY = Math.min(minY, c.cy - c.ry)
        maxX = Math.max(maxX, c.cx + c.rx)
        maxY = Math.max(maxY, c.cy + c.ry)
        break
      }
      case SHAPE_TYPES.LINE:
        minX = Math.min(minX, shape.x1, shape.x2)
        minY = Math.min(minY, shape.y1, shape.y2)
        maxX = Math.max(maxX, shape.x1, shape.x2)
        maxY = Math.max(maxY, shape.y1, shape.y2)
        break
      case SHAPE_TYPES.TEXT: {
        const charCount = shape.text?.length || 1
        const approxWidth = charCount * shape.fontSize * 0.6
        minX = Math.min(minX, shape.x)
        minY = Math.min(minY, shape.y - shape.fontSize)
        maxX = Math.max(maxX, shape.x + approxWidth)
        maxY = Math.max(maxY, shape.y)
        break
      }
    }
  })

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function fitToView(shapes, containerWidth, containerHeight, padding = 80) {
  if (!shapes || shapes.length === 0) {
    return { panX: containerWidth / 2, panY: containerHeight / 2, zoom: 1 }
  }

  const bounds = getShapesBounds(shapes)
  const contentWidth = bounds.width || 1
  const contentHeight = bounds.height || 1
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2

  const availableWidth = containerWidth - padding * 2
  const availableHeight = containerHeight - padding * 2

  const zoom = clampZoom(
    Math.min(availableWidth / contentWidth, availableHeight / contentHeight)
  )

  const panX = containerWidth / 2 - centerX * zoom
  const panY = containerHeight / 2 - centerY * zoom

  return { panX, panY, zoom }
}

export function isPointInText(x, y, textShape) {
  if (!textShape || textShape.type !== SHAPE_TYPES.TEXT) return false
  const charCount = textShape.text?.length || 1
  const approxWidth = Math.max(charCount * textShape.fontSize * 0.6, textShape.fontSize)
  const approxHeight = textShape.fontSize * 1.2
  const top = textShape.y - approxHeight
  const bottom = textShape.y + approxHeight * 0.2
  const left = textShape.x
  const right = textShape.x + approxWidth
  return x >= left && x <= right && y >= top && y <= bottom
}

export function findTextAtPoint(shapes, x, y) {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i]
    if (shape.type === SHAPE_TYPES.TEXT && isPointInText(x, y, shape)) {
      return shape
    }
  }
  return null
}

export function isValidColor(color) {
  if (typeof color !== 'string') return false
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) return true
  if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(color)) return true
  if (/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i.test(color)) return true
  return false
}
