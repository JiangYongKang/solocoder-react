import {
  SHAPE_TYPES,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  GRID_SIZE,
  HIT_RADIUS,
  POINT_RADIUS,
  SELECTED_POINT_RADIUS,
  STORAGE_KEY,
} from './constants.js'

let idCounter = 0

export function generateId(prefix = 'shape') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function clampZoom(zoom) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
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

export function createPoint(x, y, color = '#2563eb') {
  return {
    id: generateId('point'),
    type: SHAPE_TYPES.POINT,
    x,
    y,
    color,
  }
}

export function createLine(x1, y1, x2, y2, color = '#2563eb') {
  return {
    id: generateId('line'),
    type: SHAPE_TYPES.LINE,
    x1,
    y1,
    x2,
    y2,
    color,
  }
}

export function createCircle(cx, cy, r, color = '#2563eb') {
  return {
    id: generateId('circle'),
    type: SHAPE_TYPES.CIRCLE,
    cx,
    cy,
    r: Math.abs(r),
    color,
  }
}

export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

export function getLineLength(line) {
  return distance(line.x1, line.y1, line.x2, line.y2)
}

export function getCircleRadius(circle) {
  return Math.abs(circle.r)
}

export function formatCoordinate(value) {
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2)
}

export function formatLength(value) {
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2)
}

export function formatAngle(degrees) {
  const rounded = Math.round(degrees * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}°` : rounded.toFixed(1) + '°'
}

export function calculateAngleDegrees(x1, y1, x2, y2, x3, y3) {
  const v1x = x1 - x2
  const v1y = y1 - y2
  const v2x = x3 - x2
  const v2y = y3 - y2

  const dot = v1x * v2x + v1y * v2y
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y)
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y)

  if (mag1 === 0 || mag2 === 0) return 0

  let cosAngle = dot / (mag1 * mag2)
  cosAngle = Math.max(-1, Math.min(1, cosAngle))
  const radians = Math.acos(cosAngle)
  const degrees = radians * (180 / Math.PI)

  return Math.min(degrees, 180)
}

export function findSharedVertex(line1, line2) {
  const p1 = { x: line1.x1, y: line1.y1 }
  const p2 = { x: line1.x2, y: line1.y2 }
  const p3 = { x: line2.x1, y: line2.y1 }
  const p4 = { x: line2.x2, y: line2.y2 }

  const eps = 0.001
  if (distance(p1.x, p1.y, p3.x, p3.y) < eps) return { vertex: p1, other1: p2, other2: p4 }
  if (distance(p1.x, p1.y, p4.x, p4.y) < eps) return { vertex: p1, other1: p2, other2: p3 }
  if (distance(p2.x, p2.y, p3.x, p3.y) < eps) return { vertex: p2, other1: p1, other2: p4 }
  if (distance(p2.x, p2.y, p4.x, p4.y) < eps) return { vertex: p2, other1: p1, other2: p3 }
  return null
}

export function isPointNearPoint(px, py, pointX, pointY, radius = HIT_RADIUS) {
  return distance(px, py, pointX, pointY) <= radius
}

export function isPointNearLineSegment(px, py, x1, y1, x2, y2, radius = HIT_RADIUS) {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1
  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1
  if (lenSq !== 0) param = dot / lenSq
  let xx, yy
  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }
  return distance(px, py, xx, yy) <= radius
}

export function isPointNearCircleEdge(px, py, cx, cy, r, radius = HIT_RADIUS) {
  const distToCenter = distance(px, py, cx, cy)
  return Math.abs(distToCenter - Math.abs(r)) <= radius
}

export function isPointNearCircleCenter(px, py, cx, cy, radius = HIT_RADIUS) {
  return distance(px, py, cx, cy) <= radius
}

export function hitTest(shapes, worldX, worldY, zoom) {
  const scaledHit = HIT_RADIUS / zoom
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i]
    switch (shape.type) {
      case SHAPE_TYPES.POINT:
        if (isPointNearPoint(worldX, worldY, shape.x, shape.y, scaledHit)) {
          return { shapeId: shape.id, hitType: 'body' }
        }
        break
      case SHAPE_TYPES.LINE:
        if (isPointNearPoint(worldX, worldY, shape.x1, shape.y1, scaledHit)) {
          return { shapeId: shape.id, hitType: 'endpoint1' }
        }
        if (isPointNearPoint(worldX, worldY, shape.x2, shape.y2, scaledHit)) {
          return { shapeId: shape.id, hitType: 'endpoint2' }
        }
        if (isPointNearLineSegment(worldX, worldY, shape.x1, shape.y1, shape.x2, shape.y2, scaledHit)) {
          return { shapeId: shape.id, hitType: 'body' }
        }
        break
      case SHAPE_TYPES.CIRCLE:
        if (isPointNearPoint(worldX, worldY, shape.cx, shape.cy, scaledHit)) {
          return { shapeId: shape.id, hitType: 'center' }
        }
        const edgeX = shape.cx + shape.r
        const edgeY = shape.cy
        if (isPointNearPoint(worldX, worldY, edgeX, edgeY, scaledHit)) {
          return { shapeId: shape.id, hitType: 'radius' }
        }
        if (isPointNearCircleEdge(worldX, worldY, shape.cx, shape.cy, shape.r, scaledHit)) {
          return { shapeId: shape.id, hitType: 'body' }
        }
        break
    }
  }
  return null
}

export function addShape(shapes, shape) {
  return [...shapes, shape]
}

export function removeShape(shapes, shapeId) {
  return shapes.filter((s) => s.id !== shapeId)
}

export function removeShapes(shapes, shapeIds) {
  return shapes.filter((s) => !shapeIds.includes(s.id))
}

export function updateShape(shapes, shapeId, updates) {
  return shapes.map((s) => (s.id === shapeId ? { ...s, ...updates } : s))
}

export function getShapeById(shapes, id) {
  return shapes.find((s) => s.id === id) || null
}

export function getShapesByType(shapes, type) {
  return shapes.filter((s) => s.type === type)
}

export function groupShapesByType(shapes) {
  return {
    points: getShapesByType(shapes, SHAPE_TYPES.POINT),
    lines: getShapesByType(shapes, SHAPE_TYPES.LINE),
    circles: getShapesByType(shapes, SHAPE_TYPES.CIRCLE),
  }
}

export function getShapesBounds(shapes) {
  if (!shapes || shapes.length === 0) {
    return { minX: -GRID_SIZE * 2, minY: -GRID_SIZE * 2, maxX: GRID_SIZE * 2, maxY: GRID_SIZE * 2, width: GRID_SIZE * 4, height: GRID_SIZE * 4 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  shapes.forEach((shape) => {
    switch (shape.type) {
      case SHAPE_TYPES.POINT:
        minX = Math.min(minX, shape.x)
        minY = Math.min(minY, shape.y)
        maxX = Math.max(maxX, shape.x)
        maxY = Math.max(maxY, shape.y)
        break
      case SHAPE_TYPES.LINE:
        minX = Math.min(minX, shape.x1, shape.x2)
        minY = Math.min(minY, shape.y1, shape.y2)
        maxX = Math.max(maxX, shape.x1, shape.x2)
        maxY = Math.max(maxY, shape.y1, shape.y2)
        break
      case SHAPE_TYPES.CIRCLE:
        minX = Math.min(minX, shape.cx - shape.r)
        minY = Math.min(minY, shape.cy - shape.r)
        maxX = Math.max(maxX, shape.cx + shape.r)
        maxY = Math.max(maxY, shape.cy + shape.r)
        break
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
  const bounds = getShapesBounds(shapes)
  const contentWidth = bounds.width || GRID_SIZE * 4
  const contentHeight = bounds.height || GRID_SIZE * 4
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

export function resetView(containerWidth, containerHeight) {
  return {
    panX: containerWidth / 2,
    panY: containerHeight / 2,
    zoom: DEFAULT_ZOOM,
  }
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

export function getGridParams(panX, panY, zoom, width, height) {
  const scaledGrid = GRID_SIZE * zoom
  const startX = panX % scaledGrid
  const startY = panY % scaledGrid
  return { scaledGrid, startX, startY }
}

export function getLineMidpoint(line) {
  return {
    x: (line.x1 + line.x2) / 2,
    y: (line.y1 + line.y2) / 2,
  }
}

export function getPointLabelPosition(point) {
  return {
    x: point.x + 10,
    y: point.y - 10,
  }
}

export function getCircleRadiusEndpoint(circle) {
  return {
    x: circle.cx + circle.r,
    y: circle.cy,
  }
}

export function exportToSvg(shapes, width, height) {
  const bounds = getShapesBounds(shapes)
  const padding = 60
  const viewBoxMinX = bounds.minX - padding
  const viewBoxMinY = bounds.minY - padding
  const viewBoxWidth = bounds.width + padding * 2
  const viewBoxHeight = bounds.height + padding * 2

  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}">\n`
  svg += `  <defs>\n`
  svg += `    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">\n`
  svg += `      <polygon points="0 0, 10 3.5, 0 7" fill="#333333" />\n`
  svg += `    </marker>\n`
  svg += `  </defs>\n`

  const gridRange = Math.max(Math.ceil(viewBoxWidth / GRID_SIZE), Math.ceil(viewBoxHeight / GRID_SIZE)) + 2
  const gridStartX = Math.floor(viewBoxMinX / GRID_SIZE) * GRID_SIZE
  const gridStartY = Math.floor(viewBoxMinY / GRID_SIZE) * GRID_SIZE

  svg += `  <!-- Grid Lines -->\n`
  svg += `  <g stroke="#e5e5e5" stroke-width="0.5">\n`
  for (let i = 0; i <= gridRange; i++) {
    const gx = gridStartX + i * GRID_SIZE
    svg += `    <line x1="${gx}" y1="${viewBoxMinY}" x2="${gx}" y2="${viewBoxMinY + viewBoxHeight}" />\n`
  }
  for (let i = 0; i <= gridRange; i++) {
    const gy = gridStartY + i * GRID_SIZE
    svg += `    <line x1="${viewBoxMinX}" y1="${gy}" x2="${viewBoxMinX + viewBoxWidth}" y2="${gy}" />\n`
  }
  svg += `  </g>\n`

  svg += `  <!-- Axes -->\n`
  svg += `  <g stroke="#333333" stroke-width="2">\n`
  svg += `    <line x1="${viewBoxMinX}" y1="0" x2="${viewBoxMinX + viewBoxWidth}" y2="0" marker-end="url(#arrowhead)" />\n`
  svg += `    <line x1="0" y1="${viewBoxMinY + viewBoxHeight}" x2="0" y2="${viewBoxMinY}" marker-end="url(#arrowhead)" />\n`
  svg += `  </g>\n`
  svg += `  <text x="${viewBoxMinX + viewBoxWidth - 20}" y="-10" font-family="sans-serif" font-size="14" fill="#333333">X</text>\n`
  svg += `  <text x="10" y="${viewBoxMinY + 20}" font-family="sans-serif" font-size="14" fill="#333333">Y</text>\n`
  svg += `  <text x="-5" y="15" font-family="sans-serif" font-size="12" fill="#333333">O</text>\n`

  const grouped = groupShapesByType(shapes)

  svg += `  <!-- Points -->\n`
  grouped.points.forEach((p) => {
    svg += `  <circle cx="${p.x}" cy="${p.y}" r="${POINT_RADIUS}" fill="${p.color}" />\n`
    const labelPos = getPointLabelPosition(p)
    svg += `  <text x="${labelPos.x}" y="${labelPos.y}" font-family="sans-serif" font-size="12" fill="#374151">(${formatCoordinate(p.x)}, ${formatCoordinate(p.y)})</text>\n`
  })

  svg += `  <!-- Lines -->\n`
  grouped.lines.forEach((l) => {
    svg += `  <line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${l.color}" stroke-width="2" />\n`
    svg += `  <circle cx="${l.x1}" cy="${l.y1}" r="${POINT_RADIUS}" fill="${l.color}" />\n`
    svg += `  <circle cx="${l.x2}" cy="${l.y2}" r="${POINT_RADIUS}" fill="${l.color}" />\n`
    const mid = getLineMidpoint(l)
    const len = getLineLength(l)
    svg += `  <text x="${mid.x + 8}" y="${mid.y - 8}" font-family="sans-serif" font-size="12" fill="#374151">${formatLength(len)}</text>\n`
  })

  svg += `  <!-- Circles -->\n`
  grouped.circles.forEach((c) => {
    svg += `  <circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="none" stroke="${c.color}" stroke-width="2" />\n`
    svg += `  <circle cx="${c.cx}" cy="${c.cy}" r="${POINT_RADIUS}" fill="${c.color}" />\n`
    const radiusEnd = getCircleRadiusEndpoint(c)
    svg += `  <line x1="${c.cx}" y1="${c.cy}" x2="${radiusEnd.x}" y2="${radiusEnd.y}" stroke="${c.color}" stroke-width="1" stroke-dasharray="4,2" />\n`
    svg += `  <text x="${c.cx + 8}" y="${c.cy - 10}" font-family="sans-serif" font-size="12" fill="#374151">(${formatCoordinate(c.cx)}, ${formatCoordinate(c.cy)})</text>\n`
    svg += `  <text x="${radiusEnd.x + 5}" y="${radiusEnd.y - 5}" font-family="sans-serif" font-size="12" fill="#374151">r=${formatLength(c.r)}</text>\n`
  })

  svg += `</svg>\n`
  return svg
}

export function downloadSvg(svgContent, filename = 'geometry-board.svg') {
  if (typeof window === 'undefined' || !window.document) return false
  try {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
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

export function findAngleFromSelectedLines(shapes, selectedShapeIds) {
  if (selectedShapeIds.length !== 2) return null

  const line1 = getShapeById(shapes, selectedShapeIds[0])
  const line2 = getShapeById(shapes, selectedShapeIds[1])

  if (!line1 || !line2) return null
  if (line1.type !== SHAPE_TYPES.LINE || line2.type !== SHAPE_TYPES.LINE) return null

  const shared = findSharedVertex(line1, line2)
  if (!shared) return null

  const angle = calculateAngleDegrees(
    shared.other1.x, shared.other1.y,
    shared.vertex.x, shared.vertex.y,
    shared.other2.x, shared.other2.y
  )

  return {
    vertex: shared.vertex,
    point1: shared.other1,
    point2: shared.other2,
    angle,
    line1Id: line1.id,
    line2Id: line2.id,
  }
}

export function findAngleFromSelectedPoints(shapes, selectedShapeIds) {
  if (selectedShapeIds.length !== 3) return null

  const points = selectedShapeIds
    .map((id) => getShapeById(shapes, id))
    .filter((s) => s && s.type === SHAPE_TYPES.POINT)

  if (points.length !== 3) return null

  const angle = calculateAngleDegrees(
    points[0].x, points[0].y,
    points[1].x, points[1].y,
    points[2].x, points[2].y
  )

  return {
    vertex: { x: points[1].x, y: points[1].y },
    point1: { x: points[0].x, y: points[0].y },
    point2: { x: points[2].x, y: points[2].y },
    angle,
    pointIds: points.map((p) => p.id),
  }
}

export function findAngleMeasurement(shapes, selectedShapeIds) {
  return findAngleFromSelectedLines(shapes, selectedShapeIds) ||
    findAngleFromSelectedPoints(shapes, selectedShapeIds)
}

export function validateShape(shape) {
  if (!shape || typeof shape !== 'object') return false
  if (!shape.id || typeof shape.id !== 'string') return false
  if (!shape.type || typeof shape.type !== 'string') return false

  const validTypes = Object.values(SHAPE_TYPES)
  if (!validTypes.includes(shape.type)) return false

  switch (shape.type) {
    case SHAPE_TYPES.POINT:
      return typeof shape.x === 'number' && typeof shape.y === 'number'
    case SHAPE_TYPES.LINE:
      return (
        typeof shape.x1 === 'number' &&
        typeof shape.y1 === 'number' &&
        typeof shape.x2 === 'number' &&
        typeof shape.y2 === 'number'
      )
    case SHAPE_TYPES.CIRCLE:
      return (
        typeof shape.cx === 'number' &&
        typeof shape.cy === 'number' &&
        typeof shape.r === 'number'
      )
    default:
      return false
  }
}
