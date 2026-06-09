import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateId,
  clampZoom,
  screenToWorld,
  worldToScreen,
  createPoint,
  createLine,
  createCircle,
  distance,
  getLineLength,
  getCircleRadius,
  formatCoordinate,
  formatLength,
  formatAngle,
  calculateAngleDegrees,
  findSharedVertex,
  isPointNearPoint,
  isPointNearLineSegment,
  isPointNearCircleEdge,
  isPointNearCircleCenter,
  hitTest,
  addShape,
  removeShape,
  removeShapes,
  updateShape,
  getShapeById,
  getShapesByType,
  groupShapesByType,
  getShapesBounds,
  fitToView,
  resetView,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  getGridParams,
  getLineMidpoint,
  getPointLabelPosition,
  getCircleRadiusEndpoint,
  exportToSvg,
  findAngleFromSelectedLines,
  findAngleFromSelectedPoints,
  findAngleMeasurement,
  validateShape,
} from '../../geometry-board/geometryBoardCore.js'
import {
  SHAPE_TYPES,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  GRID_SIZE,
  HIT_RADIUS,
} from '../../geometry-board/constants.js'

function createMockLocalStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)) },
    removeItem: (key) => { store.delete(key) },
    clear: () => { store.clear() },
  }
}

describe('generateId', () => {
  it('should generate string IDs', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('should generate unique IDs', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })

  it('should use prefix', () => {
    const id = generateId('test')
    expect(id.startsWith('test_')).toBe(true)
  })
})

describe('clampZoom', () => {
  it('should clamp to MIN_ZOOM', () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM)
    expect(clampZoom(-1)).toBe(MIN_ZOOM)
    expect(clampZoom(MIN_ZOOM - 0.1)).toBe(MIN_ZOOM)
  })

  it('should clamp to MAX_ZOOM', () => {
    expect(clampZoom(10)).toBe(MAX_ZOOM)
    expect(clampZoom(MAX_ZOOM + 1)).toBe(MAX_ZOOM)
  })

  it('should return value within range', () => {
    expect(clampZoom(1.0)).toBe(1.0)
    expect(clampZoom(0.75)).toBe(0.75)
    expect(clampZoom(2.0)).toBe(2.0)
  })
})

describe('screenToWorld / worldToScreen', () => {
  it('should convert screen to world coords', () => {
    const world = screenToWorld(100, 200, 10, 20, 2)
    expect(world.x).toBe((100 - 10) / 2)
    expect(world.y).toBe((200 - 20) / 2)
  })

  it('should convert world to screen coords', () => {
    const screen = worldToScreen(45, 90, 10, 20, 2)
    expect(screen.x).toBe(45 * 2 + 10)
    expect(screen.y).toBe(90 * 2 + 20)
  })

  it('should be inverse operations', () => {
    const panX = 50, panY = 100, zoom = 1.5
    const worldX = 200, worldY = 300
    const screen = worldToScreen(worldX, worldY, panX, panY, zoom)
    const world = screenToWorld(screen.x, screen.y, panX, panY, zoom)
    expect(world.x).toBeCloseTo(worldX)
    expect(world.y).toBeCloseTo(worldY)
  })

  it('should handle identity transform', () => {
    const world = screenToWorld(100, 200, 0, 0, 1)
    expect(world.x).toBe(100)
    expect(world.y).toBe(200)
  })
})

describe('shape creation', () => {
  it('createPoint should create point shape', () => {
    const point = createPoint(10, 20, '#ff0000')
    expect(point.type).toBe(SHAPE_TYPES.POINT)
    expect(point.x).toBe(10)
    expect(point.y).toBe(20)
    expect(point.color).toBe('#ff0000')
    expect(typeof point.id).toBe('string')
  })

  it('createPoint should use default color', () => {
    const point = createPoint(0, 0)
    expect(point.color).toBe('#2563eb')
  })

  it('createLine should create line shape', () => {
    const line = createLine(0, 0, 100, 100, '#00ff00')
    expect(line.type).toBe(SHAPE_TYPES.LINE)
    expect(line.x1).toBe(0)
    expect(line.y1).toBe(0)
    expect(line.x2).toBe(100)
    expect(line.y2).toBe(100)
    expect(line.color).toBe('#00ff00')
  })

  it('createCircle should create circle shape with positive radius', () => {
    const circle = createCircle(50, 50, 30, '#0000ff')
    expect(circle.type).toBe(SHAPE_TYPES.CIRCLE)
    expect(circle.cx).toBe(50)
    expect(circle.cy).toBe(50)
    expect(circle.r).toBe(30)
    expect(circle.color).toBe('#0000ff')
  })

  it('createCircle should make radius absolute', () => {
    const circle = createCircle(0, 0, -50)
    expect(circle.r).toBe(50)
  })
})

describe('distance and measurement', () => {
  it('distance should calculate Euclidean distance', () => {
    expect(distance(0, 0, 3, 4)).toBe(5)
    expect(distance(0, 0, 0, 0)).toBe(0)
    expect(distance(10, 10, 13, 14)).toBe(5)
    expect(distance(-1, -1, 2, 3)).toBe(5)
  })

  it('getLineLength should return line length', () => {
    const line = createLine(0, 0, 3, 4)
    expect(getLineLength(line)).toBe(5)
  })

  it('getCircleRadius should return radius', () => {
    const circle = createCircle(0, 0, 25)
    expect(getCircleRadius(circle)).toBe(25)
  })

  it('formatCoordinate should format numbers', () => {
    expect(formatCoordinate(5)).toBe('5')
    expect(formatCoordinate(3.14159)).toBe('3.14')
    expect(formatCoordinate(2.5)).toBe('2.50')
    expect(formatCoordinate(-10)).toBe('-10')
  })

  it('formatLength should format numbers', () => {
    expect(formatLength(100)).toBe('100')
    expect(formatLength(3.14159)).toBe('3.14')
  })

  it('formatAngle should format angle with degree symbol', () => {
    expect(formatAngle(90)).toBe('90°')
    expect(formatAngle(45.5)).toBe('45.5°')
    expect(formatAngle(30.123)).toBe('30.1°')
  })
})

describe('angle calculation', () => {
  it('calculateAngleDegrees should return 90 for right angle', () => {
    const angle = calculateAngleDegrees(0, 1, 0, 0, 1, 0)
    expect(angle).toBeCloseTo(90, 3)
  })

  it('calculateAngleDegrees should return 45 degrees', () => {
    const angle = calculateAngleDegrees(1, 0, 0, 0, 1, 1)
    expect(angle).toBeCloseTo(45, 3)
  })

  it('calculateAngleDegrees should return 180 for straight line', () => {
    const angle = calculateAngleDegrees(-1, 0, 0, 0, 1, 0)
    expect(angle).toBeCloseTo(180, 3)
  })

  it('calculateAngleDegrees should return 0 for same direction', () => {
    const angle = calculateAngleDegrees(1, 0, 0, 0, 1, 0)
    expect(angle).toBeCloseTo(0, 3)
  })

  it('calculateAngleDegrees should clamp to 180 max', () => {
    const angle = calculateAngleDegrees(-1, -1, 0, 0, 1, 1)
    expect(angle).toBeLessThanOrEqual(180)
  })
})

describe('findSharedVertex', () => {
  it('should find shared vertex at first point', () => {
    const line1 = createLine(0, 0, 10, 10)
    const line2 = createLine(0, 0, 20, 0)
    const result = findSharedVertex(line1, line2)
    expect(result).not.toBeNull()
    expect(result.vertex.x).toBe(0)
    expect(result.vertex.y).toBe(0)
  })

  it('should find shared vertex at different endpoints', () => {
    const line1 = createLine(10, 10, 0, 0)
    const line2 = createLine(20, 0, 0, 0)
    const result = findSharedVertex(line1, line2)
    expect(result).not.toBeNull()
    expect(result.vertex.x).toBe(0)
    expect(result.vertex.y).toBe(0)
  })

  it('should return null for no shared vertex', () => {
    const line1 = createLine(0, 0, 10, 10)
    const line2 = createLine(20, 20, 30, 30)
    const result = findSharedVertex(line1, line2)
    expect(result).toBeNull()
  })
})

describe('hit testing', () => {
  it('isPointNearPoint should detect nearby point', () => {
    expect(isPointNearPoint(0, 0, 0, 0, 10)).toBe(true)
    expect(isPointNearPoint(0, 0, 5, 0, 10)).toBe(true)
    expect(isPointNearPoint(0, 0, 100, 100, 10)).toBe(false)
  })

  it('isPointNearLineSegment should detect point on line', () => {
    expect(isPointNearLineSegment(5, 5, 0, 0, 10, 10, 1)).toBe(true)
    expect(isPointNearLineSegment(0, 0, 0, 0, 10, 10, 0)).toBe(true)
    expect(isPointNearLineSegment(10, 10, 0, 0, 10, 10, 0)).toBe(true)
  })

  it('isPointNearLineSegment should detect point near endpoint', () => {
    expect(isPointNearLineSegment(0, 5, 0, 0, 100, 0, 10)).toBe(true)
  })

  it('isPointNearLineSegment should detect point far from line', () => {
    expect(isPointNearLineSegment(0, 50, 0, 0, 100, 0, 10)).toBe(false)
  })

  it('isPointNearCircleEdge should detect point on circumference', () => {
    expect(isPointNearCircleEdge(10, 0, 0, 0, 10, 0)).toBe(true)
    expect(isPointNearCircleEdge(0, 10, 0, 0, 10, 0)).toBe(true)
  })

  it('isPointNearCircleEdge should detect point near edge', () => {
    expect(isPointNearCircleEdge(11, 0, 0, 0, 10, 5)).toBe(true)
  })

  it('isPointNearCircleCenter should detect point at center', () => {
    expect(isPointNearCircleCenter(0, 0, 0, 0, 10)).toBe(true)
    expect(isPointNearCircleCenter(100, 0, 0, 0, 10)).toBe(false)
  })

  it('hitTest should find point shape', () => {
    const point = createPoint(50, 50)
    const shapes = [point]
    const hit = hitTest(shapes, 50, 50, 1)
    expect(hit).not.toBeNull()
    expect(hit.shapeId).toBe(point.id)
  })

  it('hitTest should find line shape', () => {
    const line = createLine(0, 0, 100, 100)
    const shapes = [line]
    const hit = hitTest(shapes, 50, 50, 1)
    expect(hit).not.toBeNull()
    expect(hit.shapeId).toBe(line.id)
  })

  it('hitTest should find line endpoint', () => {
    const line = createLine(0, 0, 100, 100)
    const shapes = [line]
    const hit = hitTest(shapes, 0, 0, 1)
    expect(hit).not.toBeNull()
    expect(hit.hitType).toBe('endpoint1')
  })

  it('hitTest should find circle shape', () => {
    const circle = createCircle(50, 50, 30)
    const shapes = [circle]
    const hit = hitTest(shapes, 80, 50, 1)
    expect(hit).not.toBeNull()
    expect(hit.shapeId).toBe(circle.id)
  })

  it('hitTest should return null for empty shapes', () => {
    expect(hitTest([], 0, 0, 1)).toBeNull()
  })

  it('hitTest should return null when nothing hit', () => {
    const point = createPoint(50, 50)
    const hit = hitTest([point], 1000, 1000, 1)
    expect(hit).toBeNull()
  })
})

describe('shape operations', () => {
  it('addShape should add shape to array', () => {
    const shape = createPoint(0, 0)
    const result = addShape([], shape)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(shape)
  })

  it('addShape should not mutate original', () => {
    const original = []
    const shape = createPoint(0, 0)
    addShape(original, shape)
    expect(original).toHaveLength(0)
  })

  it('removeShape should remove by id', () => {
    const shape = createPoint(0, 0)
    const shapes = [shape]
    const result = removeShape(shapes, shape.id)
    expect(result).toHaveLength(0)
  })

  it('removeShape should handle non-existent id', () => {
    const shape = createPoint(0, 0)
    const result = removeShape([shape], 'non-existent')
    expect(result).toHaveLength(1)
  })

  it('removeShapes should remove multiple shapes', () => {
    const s1 = createPoint(0, 0)
    const s2 = createPoint(1, 1)
    const s3 = createPoint(2, 2)
    const result = removeShapes([s1, s2, s3], [s1.id, s3.id])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(s2.id)
  })

  it('updateShape should update by id', () => {
    const shape = createPoint(0, 0)
    const shapes = [shape]
    const result = updateShape(shapes, shape.id, { x: 100, y: 200 })
    expect(result[0].x).toBe(100)
    expect(result[0].y).toBe(200)
    expect(shape.x).toBe(0)
  })

  it('updateShape should handle non-existent id', () => {
    const shape = createPoint(0, 0)
    const result = updateShape([shape], 'non-existent', { x: 100 })
    expect(result).toHaveLength(1)
    expect(result[0].x).toBe(0)
  })

  it('getShapeById should find shape', () => {
    const shape = createPoint(0, 0)
    expect(getShapeById([shape], shape.id)).toBe(shape)
    expect(getShapeById([shape], 'missing')).toBeNull()
  })

  it('getShapesByType should filter by type', () => {
    const p1 = createPoint(0, 0)
    const l1 = createLine(0, 0, 1, 1)
    const c1 = createCircle(0, 0, 1)
    const shapes = [p1, l1, c1]
    expect(getShapesByType(shapes, SHAPE_TYPES.POINT)).toHaveLength(1)
    expect(getShapesByType(shapes, SHAPE_TYPES.LINE)).toHaveLength(1)
    expect(getShapesByType(shapes, SHAPE_TYPES.CIRCLE)).toHaveLength(1)
  })

  it('groupShapesByType should group by type', () => {
    const p1 = createPoint(0, 0)
    const l1 = createLine(0, 0, 1, 1)
    const c1 = createCircle(0, 0, 1)
    const grouped = groupShapesByType([p1, l1, c1])
    expect(grouped.points).toHaveLength(1)
    expect(grouped.lines).toHaveLength(1)
    expect(grouped.circles).toHaveLength(1)
  })
})

describe('getShapesBounds', () => {
  it('should return default bounds for empty shapes', () => {
    const result = getShapesBounds([])
    expect(typeof result.minX).toBe('number')
    expect(typeof result.maxX).toBe('number')
  })

  it('should calculate bounds for single point', () => {
    const point = createPoint(50, 100)
    const result = getShapesBounds([point])
    expect(result.minX).toBe(50)
    expect(result.maxX).toBe(50)
    expect(result.minY).toBe(100)
    expect(result.maxY).toBe(100)
  })

  it('should calculate bounds for line', () => {
    const line = createLine(10, 20, 100, 200)
    const result = getShapesBounds([line])
    expect(result.minX).toBe(10)
    expect(result.maxX).toBe(100)
    expect(result.minY).toBe(20)
    expect(result.maxY).toBe(200)
  })

  it('should calculate bounds for circle', () => {
    const circle = createCircle(50, 50, 30)
    const result = getShapesBounds([circle])
    expect(result.minX).toBe(20)
    expect(result.maxX).toBe(80)
    expect(result.minY).toBe(20)
    expect(result.maxY).toBe(80)
  })

  it('should calculate bounds for multiple shapes', () => {
    const shapes = [
      createPoint(0, 0),
      createPoint(100, 100),
    ]
    const result = getShapesBounds(shapes)
    expect(result.minX).toBe(0)
    expect(result.maxX).toBe(100)
    expect(result.minY).toBe(0)
    expect(result.maxY).toBe(100)
  })
})

describe('fitToView and resetView', () => {
  it('fitToView should return defaults for empty shapes', () => {
    const result = fitToView([], 800, 600, 80)
    expect(typeof result.zoom).toBe('number')
    expect(typeof result.panX).toBe('number')
    expect(typeof result.panY).toBe('number')
  })

  it('fitToView should calculate valid zoom', () => {
    const shapes = [createCircle(0, 0, 50)]
    const result = fitToView(shapes, 1000, 800, 80)
    expect(result.zoom).toBeLessThanOrEqual(MAX_ZOOM)
    expect(result.zoom).toBeGreaterThanOrEqual(MIN_ZOOM)
  })

  it('resetView should center origin', () => {
    const result = resetView(1000, 800)
    expect(result.panX).toBe(500)
    expect(result.panY).toBe(400)
    expect(result.zoom).toBe(DEFAULT_ZOOM)
  })
})

describe('localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    mockStorage.clear()
  })

  it('loadFromStorage should return empty array for empty storage', () => {
    const result = loadFromStorage(mockStorage)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('saveToStorage should persist data', () => {
    const shape = createPoint(0, 0)
    const saved = saveToStorage([shape], mockStorage)
    expect(saved).toBe(true)
    const loaded = loadFromStorage(mockStorage)
    expect(loaded).toHaveLength(1)
  })

  it('loadFromStorage should handle invalid JSON', () => {
    mockStorage.setItem('geometry-board-state', 'invalid json')
    const result = loadFromStorage(mockStorage)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('clearStorage should remove data', () => {
    saveToStorage([createPoint(0, 0)], mockStorage)
    const cleared = clearStorage(mockStorage)
    expect(cleared).toBe(true)
    expect(loadFromStorage(mockStorage)).toHaveLength(0)
  })

  it('should handle storage being unavailable', () => {
    expect(loadFromStorage(null)).toEqual([])
    expect(saveToStorage([], null)).toBe(false)
    expect(clearStorage(null)).toBe(false)
  })
})

describe('helper position functions', () => {
  it('getLineMidpoint should return midpoint', () => {
    const line = createLine(0, 0, 10, 20)
    const mid = getLineMidpoint(line)
    expect(mid.x).toBe(5)
    expect(mid.y).toBe(10)
  })

  it('getPointLabelPosition should return offset position', () => {
    const point = createPoint(100, 200)
    const pos = getPointLabelPosition(point)
    expect(pos.x).toBe(110)
    expect(pos.y).toBe(190)
  })

  it('getCircleRadiusEndpoint should return rightmost point', () => {
    const circle = createCircle(50, 50, 30)
    const endpoint = getCircleRadiusEndpoint(circle)
    expect(endpoint.x).toBe(80)
    expect(endpoint.y).toBe(50)
  })
})

describe('exportToSvg', () => {
  it('should produce valid SVG string', () => {
    const shapes = [
      createPoint(0, 0),
      createLine(0, 0, 100, 100),
      createCircle(50, 50, 30),
    ]
    const svg = exportToSvg(shapes, 800, 600)
    expect(svg.startsWith('<?xml')).toBe(true)
    expect(svg.includes('<svg')).toBe(true)
    expect(svg.includes('</svg>')).toBe(true)
    expect(svg.includes('xmlns="http://www.w3.org/2000/svg"')).toBe(true)
  })

  it('should include grid lines in SVG', () => {
    const svg = exportToSvg([], 800, 600)
    expect(svg.includes('Grid Lines')).toBe(true)
    expect(svg.includes('<line')).toBe(true)
  })

  it('should include axes in SVG', () => {
    const svg = exportToSvg([], 800, 600)
    expect(svg.includes('Axes')).toBe(true)
    expect(svg.includes('arrowhead')).toBe(true)
  })

  it('should include shapes in SVG', () => {
    const point = createPoint(10, 20)
    const line = createLine(0, 0, 100, 100)
    const circle = createCircle(50, 50, 30)
    const svg = exportToSvg([point, line, circle], 800, 600)
    expect(svg.includes('Points')).toBe(true)
    expect(svg.includes('Lines')).toBe(true)
    expect(svg.includes('Circles')).toBe(true)
  })

  it('should handle empty shapes', () => {
    const svg = exportToSvg([], 800, 600)
    expect(typeof svg).toBe('string')
    expect(svg.length).toBeGreaterThan(0)
  })
})

describe('angle measurement from selection', () => {
  it('findAngleFromSelectedLines should find angle from two connected lines', () => {
    const line1 = createLine(0, 0, 0, 10)
    const line2 = createLine(0, 0, 10, 0)
    const result = findAngleFromSelectedLines([line1, line2], [line1.id, line2.id])
    expect(result).not.toBeNull()
    expect(result.angle).toBeCloseTo(90, 3)
  })

  it('findAngleFromSelectedLines should return null for single line', () => {
    const line = createLine(0, 0, 10, 10)
    const result = findAngleFromSelectedLines([line], [line.id])
    expect(result).toBeNull()
  })

  it('findAngleFromSelectedLines should return null for disconnected lines', () => {
    const line1 = createLine(0, 0, 10, 10)
    const line2 = createLine(100, 100, 200, 200)
    const result = findAngleFromSelectedLines([line1, line2], [line1.id, line2.id])
    expect(result).toBeNull()
  })

  it('findAngleFromSelectedPoints should find angle from three points', () => {
    const p1 = createPoint(0, 10)
    const p2 = createPoint(0, 0)
    const p3 = createPoint(10, 0)
    const result = findAngleFromSelectedPoints([p1, p2, p3], [p1.id, p2.id, p3.id])
    expect(result).not.toBeNull()
    expect(result.angle).toBeCloseTo(90, 3)
  })

  it('findAngleFromSelectedPoints should return null for wrong count', () => {
    const p1 = createPoint(0, 0)
    const p2 = createPoint(1, 1)
    expect(findAngleFromSelectedPoints([p1, p2], [p1.id, p2.id])).toBeNull()
  })

  it('findAngleMeasurement should try lines first then points', () => {
    const line1 = createLine(0, 0, 0, 10)
    const line2 = createLine(0, 0, 10, 0)
    const result = findAngleMeasurement([line1, line2], [line1.id, line2.id])
    expect(result).not.toBeNull()
    expect(result.angle).toBeCloseTo(90, 3)
  })
})

describe('validateShape', () => {
  it('should validate point shapes', () => {
    expect(validateShape(createPoint(0, 0))).toBe(true)
    expect(validateShape({ id: 'x', type: SHAPE_TYPES.POINT, x: 'bad', y: 0 })).toBe(false)
  })

  it('should validate line shapes', () => {
    expect(validateShape(createLine(0, 0, 1, 1))).toBe(true)
    expect(validateShape({ id: 'x', type: SHAPE_TYPES.LINE, x1: 0 })).toBe(false)
  })

  it('should validate circle shapes', () => {
    expect(validateShape(createCircle(0, 0, 10))).toBe(true)
    expect(validateShape({ id: 'x', type: SHAPE_TYPES.CIRCLE, cx: 0 })).toBe(false)
  })

  it('should reject null/undefined', () => {
    expect(validateShape(null)).toBe(false)
    expect(validateShape(undefined)).toBe(false)
  })

  it('should reject unknown types', () => {
    expect(validateShape({ id: 'x', type: 'unknown' })).toBe(false)
  })
})

describe('grid parameters', () => {
  it('getGridParams should return scaled grid parameters', () => {
    const params = getGridParams(0, 0, 1, 800, 600)
    expect(params.scaledGrid).toBe(GRID_SIZE)
    expect(params.startX).toBe(0)
    expect(params.startY).toBe(0)
  })

  it('getGridParams should scale with zoom', () => {
    const params = getGridParams(0, 0, 2, 800, 600)
    expect(params.scaledGrid).toBe(GRID_SIZE * 2)
  })
})
