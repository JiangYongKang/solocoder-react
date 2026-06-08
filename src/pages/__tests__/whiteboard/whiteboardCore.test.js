import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateId,
  clampZoom,
  clampLineWidth,
  clampEraserSize,
  clampFontSize,
  screenToWorld,
  worldToScreen,
  createBrushShape,
  createRectangleShape,
  createCircleShape,
  createLineShape,
  createTextShape,
  normalizeRectangle,
  normalizeCircle,
  snapLineToAngle,
  addShape,
  removeShape,
  updateShape,
  addBrushPoint,
  undo,
  redo,
  pushHistory,
  canUndo,
  canRedo,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  exportToJson,
  validateShape,
  importFromJson,
  getShapesBounds,
  fitToView,
  isPointInText,
  findTextAtPoint,
  isValidColor,
} from '../../whiteboard/whiteboardCore.js'
import {
  MIN_ZOOM,
  MAX_ZOOM,
  MIN_LINE_WIDTH,
  MAX_LINE_WIDTH,
  MIN_ERASER_SIZE,
  MAX_ERASER_SIZE,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  SHAPE_TYPES,
  DEFAULT_COLOR,
  DEFAULT_LINE_WIDTH,
  DEFAULT_FONT_SIZE,
} from '../../whiteboard/constants.js'

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
})

describe('clamp functions', () => {
  it('clampZoom should clamp to MIN_ZOOM', () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM)
    expect(clampZoom(-1)).toBe(MIN_ZOOM)
  })

  it('clampZoom should clamp to MAX_ZOOM', () => {
    expect(clampZoom(10)).toBe(MAX_ZOOM)
  })

  it('clampZoom should return value within range', () => {
    expect(clampZoom(1.0)).toBe(1.0)
    expect(clampZoom(0.75)).toBe(0.75)
  })

  it('clampLineWidth should clamp to min/max', () => {
    expect(clampLineWidth(0)).toBe(MIN_LINE_WIDTH)
    expect(clampLineWidth(100)).toBe(MAX_LINE_WIDTH)
    expect(clampLineWidth(5)).toBe(5)
  })

  it('clampEraserSize should clamp to min/max', () => {
    expect(clampEraserSize(0)).toBe(MIN_ERASER_SIZE)
    expect(clampEraserSize(200)).toBe(MAX_ERASER_SIZE)
    expect(clampEraserSize(30)).toBe(30)
  })

  it('clampFontSize should clamp to min/max', () => {
    expect(clampFontSize(0)).toBe(MIN_FONT_SIZE)
    expect(clampFontSize(200)).toBe(MAX_FONT_SIZE)
    expect(clampFontSize(24)).toBe(24)
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
})

describe('shape creation', () => {
  it('createBrushShape should create brush shape', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 10 }]
    const shape = createBrushShape(points, '#ff0000', 3)
    expect(shape.type).toBe(SHAPE_TYPES.BRUSH)
    expect(shape.points).toHaveLength(2)
    expect(shape.color).toBe('#ff0000')
    expect(shape.lineWidth).toBe(3)
    expect(typeof shape.id).toBe('string')
  })

  it('createBrushShape should use defaults', () => {
    const shape = createBrushShape()
    expect(shape.points).toEqual([])
    expect(shape.color).toBe(DEFAULT_COLOR)
    expect(shape.lineWidth).toBe(DEFAULT_LINE_WIDTH)
  })

  it('createRectangleShape should create rectangle', () => {
    const shape = createRectangleShape(10, 20, 100, 50, '#000', 2)
    expect(shape.type).toBe(SHAPE_TYPES.RECTANGLE)
    expect(shape.x).toBe(10)
    expect(shape.y).toBe(20)
    expect(shape.width).toBe(100)
    expect(shape.height).toBe(50)
    expect(shape.color).toBe('#000')
    expect(shape.lineWidth).toBe(2)
  })

  it('createCircleShape should create circle', () => {
    const shape = createCircleShape(50, 50, 30, 30, '#00f', 1)
    expect(shape.type).toBe(SHAPE_TYPES.CIRCLE)
    expect(shape.cx).toBe(50)
    expect(shape.cy).toBe(50)
    expect(shape.rx).toBe(30)
    expect(shape.ry).toBe(30)
  })

  it('createLineShape should create line', () => {
    const shape = createLineShape(0, 0, 100, 100, '#f00', 2)
    expect(shape.type).toBe(SHAPE_TYPES.LINE)
    expect(shape.x1).toBe(0)
    expect(shape.y1).toBe(0)
    expect(shape.x2).toBe(100)
    expect(shape.y2).toBe(100)
  })

  it('createTextShape should create text', () => {
    const shape = createTextShape(50, 100, 'Hello', '#333', 20)
    expect(shape.type).toBe(SHAPE_TYPES.TEXT)
    expect(shape.x).toBe(50)
    expect(shape.y).toBe(100)
    expect(shape.text).toBe('Hello')
    expect(shape.color).toBe('#333')
    expect(shape.fontSize).toBe(20)
  })

  it('createTextShape should use defaults', () => {
    const shape = createTextShape(0, 0, 'test')
    expect(shape.color).toBe(DEFAULT_COLOR)
    expect(shape.fontSize).toBe(DEFAULT_FONT_SIZE)
  })
})

describe('normalize functions', () => {
  it('normalizeRectangle should handle positive values', () => {
    const result = normalizeRectangle(10, 20, 100, 50)
    expect(result).toEqual({ x: 10, y: 20, width: 100, height: 50 })
  })

  it('normalizeRectangle should handle negative width', () => {
    const result = normalizeRectangle(110, 20, -100, 50)
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
  })

  it('normalizeRectangle should handle negative height', () => {
    const result = normalizeRectangle(10, 70, 100, -50)
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
  })

  it('normalizeRectangle should handle both negative', () => {
    const result = normalizeRectangle(110, 70, -100, -50)
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
  })

  it('normalizeCircle should make radii absolute', () => {
    const result = normalizeCircle(50, 50, -30, -40)
    expect(result.cx).toBe(50)
    expect(result.cy).toBe(50)
    expect(result.rx).toBe(30)
    expect(result.ry).toBe(40)
  })
})

describe('snapLineToAngle', () => {
  it('should snap to horizontal (0 degrees)', () => {
    const result = snapLineToAngle(0, 0, 100, 5)
    expect(Math.abs(result.y2 - result.y1)).toBeLessThan(1)
    expect(result.x2).toBeGreaterThan(result.x1)
  })

  it('should snap to vertical (90 degrees)', () => {
    const result = snapLineToAngle(0, 0, 5, 100)
    expect(Math.abs(result.x2 - result.x1)).toBeLessThan(1)
    expect(result.y2).toBeGreaterThan(result.y1)
  })

  it('should snap to 45 degrees', () => {
    const result = snapLineToAngle(0, 0, 100, 95)
    const dx = result.x2 - result.x1
    const dy = result.y2 - result.y1
    expect(Math.abs(dx - dy)).toBeLessThan(1)
  })

  it('should snap to -45 degrees', () => {
    const result = snapLineToAngle(0, 0, 100, -95)
    const dx = result.x2 - result.x1
    const dy = result.y2 - result.y1
    expect(Math.abs(dx + dy)).toBeLessThan(1)
  })

  it('should preserve start point', () => {
    const result = snapLineToAngle(10, 20, 100, 100)
    expect(result.x1).toBe(10)
    expect(result.y1).toBe(20)
  })
})

describe('shape operations', () => {
  it('addShape should add shape to array', () => {
    const shape = createRectangleShape(0, 0, 10, 10)
    const result = addShape([], shape)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(shape)
  })

  it('addShape should not mutate original', () => {
    const original = []
    const shape = createRectangleShape(0, 0, 10, 10)
    addShape(original, shape)
    expect(original).toHaveLength(0)
  })

  it('removeShape should remove by id', () => {
    const shape = createRectangleShape(0, 0, 10, 10)
    const shapes = [shape]
    const result = removeShape(shapes, shape.id)
    expect(result).toHaveLength(0)
  })

  it('updateShape should update by id', () => {
    const shape = createRectangleShape(0, 0, 10, 10)
    const shapes = [shape]
    const result = updateShape(shapes, shape.id, { width: 100, height: 50 })
    expect(result[0].width).toBe(100)
    expect(result[0].height).toBe(50)
    expect(shape.width).toBe(10)
  })

  it('addBrushPoint should add point to brush', () => {
    const brush = createBrushShape([{ x: 0, y: 0 }])
    const result = addBrushPoint(brush, { x: 10, y: 10 })
    expect(result.points).toHaveLength(2)
    expect(result.points[1]).toEqual({ x: 10, y: 10 })
  })

  it('addBrushPoint should not mutate original', () => {
    const brush = createBrushShape([{ x: 0, y: 0 }])
    addBrushPoint(brush, { x: 10, y: 10 })
    expect(brush.points).toHaveLength(1)
  })

  it('addBrushPoint should ignore non-brush shapes', () => {
    const rect = createRectangleShape(0, 0, 10, 10)
    const result = addBrushPoint(rect, { x: 10, y: 10 })
    expect(result).toBe(rect)
  })
})

describe('history operations', () => {
  it('canUndo should return false for index 0', () => {
    expect(canUndo(0)).toBe(false)
    expect(canUndo(1)).toBe(true)
  })

  it('canRedo should check against history length', () => {
    expect(canRedo([1, 2, 3], 3)).toBe(false)
    expect(canRedo([1, 2, 3], 2)).toBe(true)
  })

  it('pushHistory should add to history and truncate redo', () => {
    const shape = createRectangleShape(0, 0, 10, 10)
    const shapes = [shape]
    const result = pushHistory([], 0, shapes)
    expect(result.history).toHaveLength(1)
    expect(result.historyIndex).toBe(1)
  })

  it('undo should go back in history', () => {
    const shape1 = createRectangleShape(0, 0, 10, 10)
    const shape2 = createCircleShape(50, 50, 10, 10)
    const history = [[shape1], [shape1, shape2]]
    const result = undo([shape1, shape2], history, 2)
    expect(result.historyIndex).toBe(1)
    expect(result.shapes).toHaveLength(1)
  })

  it('undo at index 0 should do nothing', () => {
    const result = undo([], [], 0)
    expect(result.historyIndex).toBe(0)
  })

  it('redo should go forward in history', () => {
    const shape1 = createRectangleShape(0, 0, 10, 10)
    const shape2 = createCircleShape(50, 50, 10, 10)
    const history = [[shape1], [shape1, shape2]]
    const result = redo([shape1], history, 1)
    expect(result.historyIndex).toBe(2)
    expect(result.shapes).toHaveLength(2)
  })

  it('redo at end should do nothing', () => {
    const history = [[1], [2]]
    const result = redo([], history, 2)
    expect(result.historyIndex).toBe(2)
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
    const shape = createRectangleShape(0, 0, 10, 10)
    const shapes = [shape]
    const saved = saveToStorage(shapes, mockStorage)
    expect(saved).toBe(true)
    const loaded = loadFromStorage(mockStorage)
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe(shape.id)
  })

  it('loadFromStorage should handle invalid JSON', () => {
    mockStorage.setItem('whiteboard-state', 'invalid')
    const result = loadFromStorage(mockStorage)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('loadFromStorage should handle non-array data', () => {
    mockStorage.setItem('whiteboard-state', JSON.stringify({ not: 'array' }))
    const result = loadFromStorage(mockStorage)
    expect(Array.isArray(result)).toBe(true)
  })

  it('clearStorage should remove data', () => {
    saveToStorage([createRectangleShape(0, 0, 10, 10)], mockStorage)
    const cleared = clearStorage(mockStorage)
    expect(cleared).toBe(true)
    const loaded = loadFromStorage(mockStorage)
    expect(loaded).toHaveLength(0)
  })

  it('should handle storage being unavailable', () => {
    expect(loadFromStorage(null)).toEqual([])
    expect(saveToStorage([], null)).toBe(false)
    expect(clearStorage(null)).toBe(false)
  })

  it('should handle storage errors gracefully', () => {
    const badStorage = {
      getItem: () => { throw new Error('fail') },
      setItem: () => { throw new Error('fail') },
      removeItem: () => { throw new Error('fail') },
    }
    expect(loadFromStorage(badStorage)).toEqual([])
    expect(saveToStorage([], badStorage)).toBe(false)
    expect(clearStorage(badStorage)).toBe(false)
  })
})

describe('export/import JSON', () => {
  it('exportToJson should export with version and timestamp', () => {
    const shapes = [createRectangleShape(0, 0, 10, 10)]
    const result = exportToJson(shapes)
    expect(result.version).toBe('1.0')
    expect(result.shapes).toBe(shapes)
    expect(typeof result.exportedAt).toBe('string')
    expect(new Date(result.exportedAt).toString()).not.toBe('Invalid Date')
  })

  it('validateShape should validate brush shapes', () => {
    const valid = createBrushShape([{ x: 0, y: 0 }, { x: 10, y: 10 }])
    expect(validateShape(valid)).toBe(true)

    const noPoints = createBrushShape([])
    expect(validateShape(noPoints)).toBe(false)

    const onePoint = createBrushShape([{ x: 0, y: 0 }])
    expect(validateShape(onePoint)).toBe(false)
  })

  it('validateShape should validate rectangle shapes', () => {
    const valid = createRectangleShape(0, 0, 10, 10)
    expect(validateShape(valid)).toBe(true)

    const invalid = { ...valid, x: 'not a number' }
    expect(validateShape(invalid)).toBe(false)
  })

  it('validateShape should validate circle shapes', () => {
    const valid = createCircleShape(0, 0, 10, 10)
    expect(validateShape(valid)).toBe(true)
  })

  it('validateShape should validate line shapes', () => {
    const valid = createLineShape(0, 0, 10, 10)
    expect(validateShape(valid)).toBe(true)
  })

  it('validateShape should validate text shapes', () => {
    const valid = createTextShape(0, 0, 'hello')
    expect(validateShape(valid)).toBe(true)

    const invalid = { ...valid, text: 123 }
    expect(validateShape(invalid)).toBe(false)
  })

  it('validateShape should reject null/undefined', () => {
    expect(validateShape(null)).toBe(false)
    expect(validateShape(undefined)).toBe(false)
  })

  it('validateShape should reject unknown types', () => {
    expect(validateShape({ id: 'x', type: 'unknown' })).toBe(false)
  })

  it('importFromJson should reject non-object input', () => {
    expect(importFromJson(null).valid).toBe(false)
    expect(importFromJson('string').valid).toBe(false)
  })

  it('importFromJson should reject missing shapes', () => {
    expect(importFromJson({}).valid).toBe(false)
  })

  it('importFromJson should reject non-array shapes', () => {
    expect(importFromJson({ shapes: 'not array' }).valid).toBe(false)
  })

  it('importFromJson should reject invalid shapes in array', () => {
    expect(importFromJson({ shapes: [{ invalid: true }] }).valid).toBe(false)
  })

  it('importFromJson should accept valid data', () => {
    const shapes = [
      createRectangleShape(0, 0, 10, 10),
      createBrushShape([{ x: 0, y: 0 }, { x: 10, y: 10 }]),
    ]
    const result = importFromJson({ shapes })
    expect(result.valid).toBe(true)
    expect(result.data).toHaveLength(2)
  })
})

describe('getShapesBounds', () => {
  it('should return zeros for empty shapes', () => {
    const result = getShapesBounds([])
    expect(result.minX).toBe(0)
    expect(result.minY).toBe(0)
    expect(result.maxX).toBe(0)
    expect(result.maxY).toBe(0)
    expect(result.width).toBe(0)
    expect(result.height).toBe(0)
  })

  it('should calculate bounds for brush', () => {
    const brush = createBrushShape([
      { x: 10, y: 20 },
      { x: 50, y: 60 },
      { x: 30, y: 40 },
    ])
    const result = getShapesBounds([brush])
    expect(result.minX).toBe(10)
    expect(result.minY).toBe(20)
    expect(result.maxX).toBe(50)
    expect(result.maxY).toBe(60)
    expect(result.width).toBe(40)
    expect(result.height).toBe(40)
  })

  it('should calculate bounds for rectangle', () => {
    const rect = createRectangleShape(10, 20, 100, 50)
    const result = getShapesBounds([rect])
    expect(result.minX).toBe(10)
    expect(result.minY).toBe(20)
    expect(result.maxX).toBe(110)
    expect(result.maxY).toBe(70)
  })

  it('should calculate bounds for rectangle with negative dimensions', () => {
    const rect = createRectangleShape(110, 70, -100, -50)
    const result = getShapesBounds([rect])
    expect(result.minX).toBe(10)
    expect(result.minY).toBe(20)
    expect(result.maxX).toBe(110)
    expect(result.maxY).toBe(70)
  })

  it('should calculate bounds for circle', () => {
    const circle = createCircleShape(50, 50, 30, 20)
    const result = getShapesBounds([circle])
    expect(result.minX).toBe(20)
    expect(result.minY).toBe(30)
    expect(result.maxX).toBe(80)
    expect(result.maxY).toBe(70)
  })

  it('should calculate bounds for line', () => {
    const line = createLineShape(10, 20, 100, 200)
    const result = getShapesBounds([line])
    expect(result.minX).toBe(10)
    expect(result.minY).toBe(20)
    expect(result.maxX).toBe(100)
    expect(result.maxY).toBe(200)
  })

  it('should calculate bounds for text', () => {
    const text = createTextShape(50, 100, 'Hello World', '#000', 16)
    const result = getShapesBounds([text])
    expect(result.minX).toBe(50)
    expect(result.maxX).toBeGreaterThan(50)
    expect(result.minY).toBeLessThanOrEqual(100)
    expect(result.maxY).toBeGreaterThanOrEqual(100)
  })

  it('should calculate bounds for multiple shapes', () => {
    const shapes = [
      createRectangleShape(0, 0, 50, 50),
      createRectangleShape(100, 100, 50, 50),
    ]
    const result = getShapesBounds(shapes)
    expect(result.minX).toBe(0)
    expect(result.minY).toBe(0)
    expect(result.maxX).toBe(150)
    expect(result.maxY).toBe(150)
  })
})

describe('fitToView', () => {
  it('should return defaults for empty shapes', () => {
    const result = fitToView([], 800, 600, 80)
    expect(result.zoom).toBe(1)
    expect(typeof result.panX).toBe('number')
    expect(typeof result.panY).toBe('number')
  })

  it('should calculate fit for shapes', () => {
    const shapes = [createRectangleShape(0, 0, 100, 100)]
    const result = fitToView(shapes, 1000, 800, 80)
    expect(result.zoom).toBeLessThanOrEqual(MAX_ZOOM)
    expect(result.zoom).toBeGreaterThanOrEqual(MIN_ZOOM)
    expect(typeof result.panX).toBe('number')
    expect(typeof result.panY).toBe('number')
  })

  it('should clamp zoom to valid range', () => {
    const shapes = [createRectangleShape(0, 0, 100000, 100000)]
    const result = fitToView(shapes, 100, 100, 0)
    expect(result.zoom).toBeGreaterThanOrEqual(MIN_ZOOM)
  })
})

describe('text hit testing', () => {
  it('isPointInText should detect point inside text', () => {
    const text = createTextShape(50, 100, 'Hello', '#000', 16)
    expect(isPointInText(55, 95, text)).toBe(true)
  })

  it('isPointInText should detect point outside text', () => {
    const text = createTextShape(50, 100, 'Hello', '#000', 16)
    expect(isPointInText(1000, 1000, text)).toBe(false)
  })

  it('isPointInText should return false for non-text shape', () => {
    const rect = createRectangleShape(0, 0, 10, 10)
    expect(isPointInText(5, 5, rect)).toBe(false)
  })

  it('findTextAtPoint should find text at point', () => {
    const text1 = createTextShape(50, 100, 'Hello', '#000', 16)
    const text2 = createTextShape(50, 200, 'World', '#000', 16)
    const found = findTextAtPoint([text1, text2], 55, 95)
    expect(found).toBeDefined()
    expect(found.text).toBe('Hello')
  })

  it('findTextAtPoint should return null if no text at point', () => {
    const text = createTextShape(50, 100, 'Hello', '#000', 16)
    expect(findTextAtPoint([text], 1000, 1000)).toBeNull()
  })

  it('findTextAtPoint should return null for empty shapes', () => {
    expect(findTextAtPoint([], 0, 0)).toBeNull()
  })
})

describe('isValidColor', () => {
  it('should accept hex short colors', () => {
    expect(isValidColor('#fff')).toBe(true)
    expect(isValidColor('#000')).toBe(true)
    expect(isValidColor('#F00')).toBe(true)
  })

  it('should accept hex long colors', () => {
    expect(isValidColor('#ffffff')).toBe(true)
    expect(isValidColor('#ff0000')).toBe(true)
    expect(isValidColor('#FF00FF')).toBe(true)
  })

  it('should accept rgb colors', () => {
    expect(isValidColor('rgb(255, 0, 0)')).toBe(true)
    expect(isValidColor('rgb(0,0,0)')).toBe(true)
  })

  it('should accept rgba colors', () => {
    expect(isValidColor('rgba(255, 0, 0, 0.5)')).toBe(true)
    expect(isValidColor('rgba(0,0,0,1)')).toBe(true)
  })

  it('should reject invalid colors', () => {
    expect(isValidColor('red')).toBe(false)
    expect(isValidColor('#ggg')).toBe(false)
    expect(isValidColor('#ff')).toBe(false)
    expect(isValidColor(123)).toBe(false)
    expect(isValidColor(null)).toBe(false)
  })
})
