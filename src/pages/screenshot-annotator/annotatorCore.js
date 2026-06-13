import {
    ACCEPTED_IMAGE_TYPES,
    ANNOTATION_TYPES,
    DEFAULT_FILL_OPACITY,
    DEFAULT_FONT_SIZE,
    DEFAULT_LINE_WIDTH,
    DEFAULT_RECT_BORDER_RADIUS,
    HANDLE_TYPES,
    HISTORY_LIMIT,
    HIT_TOLERANCE,
} from './constants.js'

let idCounter = 0

export const generateId = (prefix = 'ann') => {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export const validateImageType = (file) => {
  if (!file || !file.type) return false
  return ACCEPTED_IMAGE_TYPES.includes(file.type)
}

export const calculateImageFit = (imgWidth, imgHeight, canvasWidth, canvasHeight) => {
  if (
    imgWidth <= 0 ||
    imgHeight <= 0 ||
    canvasWidth <= 0 ||
    canvasHeight <= 0 ||
    !isFinite(imgWidth) ||
    !isFinite(imgHeight) ||
    !isFinite(canvasWidth) ||
    !isFinite(canvasHeight)
  ) {
    return { scale: 1, offsetX: 0, offsetY: 0, drawWidth: imgWidth, drawHeight: imgHeight }
  }
  const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight, 1)
  const drawWidth = imgWidth * scale
  const drawHeight = imgHeight * scale
  const offsetX = (canvasWidth - drawWidth) / 2
  const offsetY = (canvasHeight - drawHeight) / 2
  return { scale, offsetX, offsetY, drawWidth, drawHeight }
}

export const createArrow = (x1, y1, x2, y2, color, lineWidth = DEFAULT_LINE_WIDTH) => ({
  id: generateId('arrow'),
  type: ANNOTATION_TYPES.ARROW,
  x1,
  y1,
  x2,
  y2,
  color,
  lineWidth,
})

export const createRectangle = (
  x,
  y,
  width,
  height,
  color,
  lineWidth = DEFAULT_LINE_WIDTH,
  fillOpacity = DEFAULT_FILL_OPACITY,
  borderRadius = DEFAULT_RECT_BORDER_RADIUS
) => ({
  id: generateId('rect'),
  type: ANNOTATION_TYPES.RECTANGLE,
  x,
  y,
  width,
  height,
  color,
  lineWidth,
  fillOpacity,
  borderRadius,
})

export const createEllipse = (
  cx,
  cy,
  rx,
  ry,
  color,
  lineWidth = DEFAULT_LINE_WIDTH,
  fillOpacity = DEFAULT_FILL_OPACITY
) => ({
  id: generateId('ellipse'),
  type: ANNOTATION_TYPES.ELLIPSE,
  cx,
  cy,
  rx,
  ry,
  color,
  lineWidth,
  fillOpacity,
})

export const createText = (x, y, text, color, fontSize = DEFAULT_FONT_SIZE) => ({
  id: generateId('text'),
  type: ANNOTATION_TYPES.TEXT,
  x,
  y,
  text,
  color,
  fontSize,
})

export const createBrush = (points, color, lineWidth = DEFAULT_LINE_WIDTH) => {
  const safePoints = points
    ? points.map((p) => ({ x: p.x, y: p.y }))
    : []
  return {
    id: generateId('brush'),
    type: ANNOTATION_TYPES.BRUSH,
    points: safePoints,
    color,
    lineWidth,
  }
}

export const normalizeRect = (x, y, width, height) => {
  const nx = width >= 0 ? x : x + width
  const ny = height >= 0 ? y : y + height
  const nWidth = Math.abs(width)
  const nHeight = Math.abs(height)
  return { x: nx, y: ny, width: nWidth, height: nHeight }
}

export const normalizeEllipse = (cx, cy, rx, ry) => ({
  cx,
  cy,
  rx: Math.abs(rx),
  ry: Math.abs(ry),
})

export const addAnnotation = (annotations, annotation) => {
  if (!Array.isArray(annotations)) {
    return [annotation]
  }
  return [...annotations, annotation]
}

export const removeAnnotations = (annotations, ids) => {
  if (!Array.isArray(annotations)) return []
  const idSet = Array.isArray(ids) ? new Set(ids) : new Set([ids])
  return annotations.filter((a) => !idSet.has(a.id))
}

export const updateAnnotation = (annotations, id, updates) => {
  if (!Array.isArray(annotations)) return []
  return annotations.map((a) => (a.id === id ? { ...a, ...updates } : a))
}

export const addBrushPoint = (brushAnnotation, point) => {
  if (!brushAnnotation) return null
  if (brushAnnotation.type !== ANNOTATION_TYPES.BRUSH) return brushAnnotation
  return {
    ...brushAnnotation,
    points: [...brushAnnotation.points, { x: point.x, y: point.y }],
  }
}

export const distance = (x1, y1, x2, y2) => {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

export const pointNearLine = (px, py, x1, y1, x2, y2, tolerance = HIT_TOLERANCE) => {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) {
    return distance(px, py, x1, y1) <= tolerance
  }
  const t = ((px - x1) * dx + (py - y1) * dy) / lenSq
  const nearestX = x1 + t * dx
  const nearestY = y1 + t * dy
  return distance(px, py, nearestX, nearestY) <= tolerance
}

export const pointInRect = (px, py, x, y, width, height) => {
  const r = normalizeRect(x, y, width, height)
  return px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height
}

export const pointNearRectEdge = (px, py, x, y, width, height, tolerance = HIT_TOLERANCE) => {
  const r = normalizeRect(x, y, width, height)
  const onLeft = Math.abs(px - r.x) <= tolerance && py >= r.y - tolerance && py <= r.y + r.height + tolerance
  const onRight = Math.abs(px - (r.x + r.width)) <= tolerance && py >= r.y - tolerance && py <= r.y + r.height + tolerance
  const onTop = Math.abs(py - r.y) <= tolerance && px >= r.x - tolerance && px <= r.x + r.width + tolerance
  const onBottom = Math.abs(py - (r.y + r.height)) <= tolerance && px >= r.x - tolerance && px <= r.x + r.width + tolerance
  return onLeft || onRight || onTop || onBottom
}

export const pointInEllipse = (px, py, cx, cy, rx, ry) => {
  const e = normalizeEllipse(cx, cy, rx, ry)
  if (e.rx === 0 || e.ry === 0) return false
  const dx = px - e.cx
  const dy = py - e.cy
  return (dx * dx) / (e.rx * e.rx) + (dy * dy) / (e.ry * e.ry) <= 1
}

export const pointNearEllipseEdge = (px, py, cx, cy, rx, ry, tolerance = HIT_TOLERANCE) => {
  const e = normalizeEllipse(cx, cy, rx, ry)
  if (e.rx === 0 || e.ry === 0) return false
  const dx = px - e.cx
  const dy = py - e.cy
  const val = (dx * dx) / (e.rx * e.rx) + (dy * dy) / (e.ry * e.ry)
  if (val > 1 + 2) return false
  if (val <= 0.5) return false
  const t = 1 / Math.sqrt(val || 1)
  const edgeX = e.cx + dx * t
  const edgeY = e.cy + dy * t
  return distance(px, py, edgeX, edgeY) <= tolerance
}

export const pointInBrush = (px, py, brushAnnotation) => {
  if (!brushAnnotation) return false
  if (brushAnnotation.type !== ANNOTATION_TYPES.BRUSH) return false
  const points = brushAnnotation.points || []
  if (points.length < 2) return false
  const tol = (brushAnnotation.lineWidth || HIT_TOLERANCE) / 2 + HIT_TOLERANCE
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    if (pointNearLine(px, py, p1.x, p1.y, p2.x, p2.y, tol)) {
      return true
    }
  }
  return false
}

export const measureTextWidth = (text, fontSize = DEFAULT_FONT_SIZE) => {
  if (!text) return 0
  return text.length * fontSize * 0.6
}

export const pointInText = (px, py, textAnnotation) => {
  if (!textAnnotation) return false
  if (textAnnotation.type !== ANNOTATION_TYPES.TEXT) return false
  const { x, y, text, fontSize = DEFAULT_FONT_SIZE } = textAnnotation
  if (!text) return false
  const width = measureTextWidth(text, fontSize)
  const height = fontSize * 1.2
  const top = y - height
  const bottom = y + fontSize * 0.2
  const left = x
  const right = x + width
  return px >= left && px <= right && py >= top && py <= bottom
}

export const hitTestAnnotation = (px, py, annotation, tolerance = HIT_TOLERANCE) => {
  if (!annotation) return false
  switch (annotation.type) {
    case ANNOTATION_TYPES.ARROW: {
      const lw = annotation.lineWidth || DEFAULT_LINE_WIDTH
      return pointNearLine(px, py, annotation.x1, annotation.y1, annotation.x2, annotation.y2, lw / 2 + tolerance)
    }
    case ANNOTATION_TYPES.RECTANGLE: {
      const fill = annotation.fillOpacity || 0
      if (fill > 0 && pointInRect(px, py, annotation.x, annotation.y, annotation.width, annotation.height)) {
        return true
      }
      const lw = annotation.lineWidth || DEFAULT_LINE_WIDTH
      return pointNearRectEdge(px, py, annotation.x, annotation.y, annotation.width, annotation.height, lw / 2 + tolerance)
    }
    case ANNOTATION_TYPES.ELLIPSE: {
      const fill = annotation.fillOpacity || 0
      if (fill > 0 && pointInEllipse(px, py, annotation.cx, annotation.cy, annotation.rx, annotation.ry)) {
        return true
      }
      return pointNearEllipseEdge(px, py, annotation.cx, annotation.cy, annotation.rx, annotation.ry, tolerance)
    }
    case ANNOTATION_TYPES.TEXT:
      return pointInText(px, py, annotation)
    case ANNOTATION_TYPES.BRUSH:
      return pointInBrush(px, py, annotation)
    default:
      return false
  }
}

export const findAnnotationAt = (annotations, px, py) => {
  if (!Array.isArray(annotations)) return null
  for (let i = annotations.length - 1; i >= 0; i--) {
    const ann = annotations[i]
    if (hitTestAnnotation(px, py, ann)) {
      return ann
    }
  }
  return null
}

export const getAnnotationBounds = (annotation) => {
  if (!annotation) return { x: 0, y: 0, width: 0, height: 0 }
  switch (annotation.type) {
    case ANNOTATION_TYPES.ARROW: {
      const minX = Math.min(annotation.x1, annotation.x2)
      const minY = Math.min(annotation.y1, annotation.y2)
      const maxX = Math.max(annotation.x1, annotation.x2)
      const maxY = Math.max(annotation.y1, annotation.y2)
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    }
    case ANNOTATION_TYPES.RECTANGLE: {
      return normalizeRect(annotation.x, annotation.y, annotation.width, annotation.height)
    }
    case ANNOTATION_TYPES.ELLIPSE: {
      const e = normalizeEllipse(annotation.cx, annotation.cy, annotation.rx, annotation.ry)
      return { x: e.cx - e.rx, y: e.cy - e.ry, width: e.rx * 2, height: e.ry * 2 }
    }
    case ANNOTATION_TYPES.TEXT: {
      const { x, y, text, fontSize = DEFAULT_FONT_SIZE } = annotation
      const width = measureTextWidth(text, fontSize)
      return { x, y: y - fontSize * 1.2, width, height: fontSize * 1.4 }
    }
    case ANNOTATION_TYPES.BRUSH: {
      const points = annotation.points || []
      if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
      let minX = points[0].x
      let minY = points[0].y
      let maxX = points[0].x
      let maxY = points[0].y
      for (let i = 1; i < points.length; i++) {
        minX = Math.min(minX, points[i].x)
        minY = Math.min(minY, points[i].y)
        maxX = Math.max(maxX, points[i].x)
        maxY = Math.max(maxY, points[i].y)
      }
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    }
    default:
      return { x: 0, y: 0, width: 0, height: 0 }
  }
}

export const getHandles = (annotation, handleSize = 10) => {
  if (!annotation) return []
  const half = handleSize / 2
  switch (annotation.type) {
    case ANNOTATION_TYPES.ARROW:
      return [
        { type: HANDLE_TYPES.START, x: annotation.x1 - half, y: annotation.y1 - half, size: handleSize },
        { type: HANDLE_TYPES.END, x: annotation.x2 - half, y: annotation.y2 - half, size: handleSize },
      ]
    case ANNOTATION_TYPES.RECTANGLE: {
      const r = normalizeRect(annotation.x, annotation.y, annotation.width, annotation.height)
      return [
        { type: HANDLE_TYPES.NW, x: r.x - half, y: r.y - half, size: handleSize },
        { type: HANDLE_TYPES.NE, x: r.x + r.width - half, y: r.y - half, size: handleSize },
        { type: HANDLE_TYPES.SW, x: r.x - half, y: r.y + r.height - half, size: handleSize },
        { type: HANDLE_TYPES.SE, x: r.x + r.width - half, y: r.y + r.height - half, size: handleSize },
      ]
    }
    case ANNOTATION_TYPES.ELLIPSE: {
      const e = normalizeEllipse(annotation.cx, annotation.cy, annotation.rx, annotation.ry)
      return [
        { type: HANDLE_TYPES.NW, x: e.cx - e.rx - half, y: e.cy - e.ry - half, size: handleSize },
        { type: HANDLE_TYPES.NE, x: e.cx + e.rx - half, y: e.cy - e.ry - half, size: handleSize },
        { type: HANDLE_TYPES.SW, x: e.cx - e.rx - half, y: e.cy + e.ry - half, size: handleSize },
        { type: HANDLE_TYPES.SE, x: e.cx + e.rx - half, y: e.cy + e.ry - half, size: handleSize },
      ]
    }
    case ANNOTATION_TYPES.TEXT: {
      const bounds = getAnnotationBounds(annotation)
      return [
        { type: HANDLE_TYPES.MOVE, x: bounds.x + bounds.width / 2 - half, y: bounds.y - half - 4, size: handleSize },
      ]
    }
    case ANNOTATION_TYPES.BRUSH: {
      const bounds = getAnnotationBounds(annotation)
      return [
        { type: HANDLE_TYPES.MOVE, x: bounds.x + bounds.width / 2 - half, y: bounds.y - half - 4, size: handleSize },
      ]
    }
    default:
      return []
  }
}

export const hitTestHandle = (handles, px, py) => {
  if (!Array.isArray(handles)) return null
  for (const h of handles) {
    if (
      px >= h.x &&
      px <= h.x + h.size &&
      py >= h.y &&
      py <= h.y + h.size
    ) {
      return h
    }
  }
  return null
}

export const moveAnnotation = (annotation, dx, dy) => {
  if (!annotation) return null
  switch (annotation.type) {
    case ANNOTATION_TYPES.ARROW:
      return {
        ...annotation,
        x1: annotation.x1 + dx,
        y1: annotation.y1 + dy,
        x2: annotation.x2 + dx,
        y2: annotation.y2 + dy,
      }
    case ANNOTATION_TYPES.RECTANGLE:
      return {
        ...annotation,
        x: annotation.x + dx,
        y: annotation.y + dy,
      }
    case ANNOTATION_TYPES.ELLIPSE:
      return {
        ...annotation,
        cx: annotation.cx + dx,
        cy: annotation.cy + dy,
      }
    case ANNOTATION_TYPES.TEXT:
      return {
        ...annotation,
        x: annotation.x + dx,
        y: annotation.y + dy,
      }
    case ANNOTATION_TYPES.BRUSH:
      return {
        ...annotation,
        points: (annotation.points || []).map((p) => ({ x: p.x + dx, y: p.y + dy })),
      }
    default:
      return annotation
  }
}

export const resizeAnnotation = (annotation, handleType, dx, dy) => {
  if (!annotation) return null
  switch (annotation.type) {
    case ANNOTATION_TYPES.ARROW:
      if (handleType === HANDLE_TYPES.START) {
        return { ...annotation, x1: annotation.x1 + dx, y1: annotation.y1 + dy }
      }
      if (handleType === HANDLE_TYPES.END) {
        return { ...annotation, x2: annotation.x2 + dx, y2: annotation.y2 + dy }
      }
      return annotation
    case ANNOTATION_TYPES.RECTANGLE: {
      let { x, y, width, height } = annotation
      if (handleType === HANDLE_TYPES.SE) {
        width += dx
        height += dy
      } else if (handleType === HANDLE_TYPES.NW) {
        x += dx
        y += dy
        width -= dx
        height -= dy
      } else if (handleType === HANDLE_TYPES.NE) {
        y += dy
        width += dx
        height -= dy
      } else if (handleType === HANDLE_TYPES.SW) {
        x += dx
        width -= dx
        height += dy
      }
      return { ...annotation, x, y, width, height }
    }
    case ANNOTATION_TYPES.ELLIPSE: {
      let { cx, cy, rx, ry } = normalizeEllipse(annotation.cx, annotation.cy, annotation.rx, annotation.ry)
      const nwX = cx - rx
      const nwY = cy - ry
      const neX = cx + rx
      const neY = cy - ry
      const swX = cx - rx
      const swY = cy + ry
      const seX = cx + rx
      const seY = cy + ry
      if (handleType === HANDLE_TYPES.SE) {
        const newSeX = seX + dx
        const newSeY = seY + dy
        cx = (nwX + newSeX) / 2
        cy = (nwY + newSeY) / 2
        rx = Math.abs((newSeX - nwX) / 2)
        ry = Math.abs((newSeY - nwY) / 2)
      } else if (handleType === HANDLE_TYPES.NW) {
        const newNwX = nwX + dx
        const newNwY = nwY + dy
        cx = (newNwX + seX) / 2
        cy = (newNwY + seY) / 2
        rx = Math.abs((seX - newNwX) / 2)
        ry = Math.abs((seY - newNwY) / 2)
      } else if (handleType === HANDLE_TYPES.NE) {
        const newNeX = neX + dx
        const newNeY = neY + dy
        cx = (swX + newNeX) / 2
        cy = (newNeY + swY) / 2
        rx = Math.abs((newNeX - swX) / 2)
        ry = Math.abs((swY - newNeY) / 2)
      } else if (handleType === HANDLE_TYPES.SW) {
        const newSwX = swX + dx
        const newSwY = swY + dy
        cx = (newSwX + neX) / 2
        cy = (neY + newSwY) / 2
        rx = Math.abs((neX - newSwX) / 2)
        ry = Math.abs((newSwY - neY) / 2)
      }
      return { ...annotation, cx, cy, rx, ry }
    }
    default:
      return annotation
  }
}

export const pushHistory = (history, historyIndex, newAnnotations, limit = HISTORY_LIMIT) => {
  if (!Array.isArray(history)) {
    return { history: [newAnnotations], historyIndex: 0 }
  }
  const isAtEnd = historyIndex >= history.length - 1
  const truncatedHistory = isAtEnd
    ? history.slice(0, historyIndex + 1)
    : history.slice(0, historyIndex)
  truncatedHistory.push(newAnnotations)
  if (truncatedHistory.length > limit) {
    const overflow = truncatedHistory.length - limit
    truncatedHistory.splice(0, overflow)
    return { history: truncatedHistory, historyIndex: truncatedHistory.length - 1 }
  }
  return { history: truncatedHistory, historyIndex: truncatedHistory.length - 1 }
}

export const canUndo = (historyIndex) => historyIndex > 0

export const canRedo = (history, historyIndex) => {
  if (!Array.isArray(history)) return false
  return historyIndex < history.length - 1
}

export const undo = (currentAnnotations, history, historyIndex) => {
  if (!canUndo(historyIndex)) {
    return { annotations: currentAnnotations, historyIndex }
  }
  const newIndex = historyIndex - 1
  return {
    annotations: cloneAnnotations(history[newIndex]),
    historyIndex: newIndex,
  }
}

export const redo = (currentAnnotations, history, historyIndex) => {
  if (!canRedo(history, historyIndex)) {
    return { annotations: currentAnnotations, historyIndex }
  }
  const newIndex = historyIndex + 1
  return {
    annotations: cloneAnnotations(history[newIndex]),
    historyIndex: newIndex,
  }
}

export const formatTimestamp = (timestamp) => {
  let d
  if (timestamp instanceof Date) {
    d = timestamp
  } else if (typeof timestamp === 'number' && isFinite(timestamp)) {
    d = new Date(timestamp)
  } else {
    return ''
  }
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

export const generateExportFilename = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const ts =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `标注截图_${ts}.png`
}

export const cloneAnnotations = (annotations) => {
  if (!Array.isArray(annotations)) return []
  return annotations.map((a) => {
    if (a.type === ANNOTATION_TYPES.BRUSH) {
      return {
        ...a,
        points: (a.points || []).map((p) => ({ ...p })),
      }
    }
    return { ...a }
  })
}
