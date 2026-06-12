import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateId,
  clamp,
  clampLineWidth,
  clampSmoothing,
  createStroke,
  addPointToStroke,
  smoothPoints,
  getBezierPoints,
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
  canUndo,
  canRedo,
  strokeToPathData,
  isCanvasEmpty,
  getStrokesBounds,
  generateFileName,
  loadSignaturesFromStorage,
  saveSignaturesToStorage,
  addSignatureToHistory,
  removeSignatureFromHistory,
  isValidColor,
  formatDate,
  drawStrokesOnCanvas,
} from '@/pages/signature-pad/signatureCore.js'
import {
  STORAGE_KEY,
  MIN_LINE_WIDTH,
  MAX_LINE_WIDTH,
  MIN_SMOOTHING,
  MAX_SMOOTHING,
  DEFAULT_COLOR,
  DEFAULT_LINE_WIDTH,
  HISTORY_MAX_ITEMS,
} from '@/pages/signature-pad/constants.js'

function createMockStorage() {
  const store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    _store: store,
  }
}

describe('signatureCore', () => {
  describe('generateId', () => {
    it('should generate non-empty string ids', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should generate unique ids', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })

    it('should include prefix when provided', () => {
      const id = generateId('test')
      expect(id.startsWith('test_')).toBe(true)
    })
  })

  describe('clamp', () => {
    it('should return value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(0, 0, 10)).toBe(0)
      expect(clamp(10, 0, 10)).toBe(10)
    })

    it('should clamp values below minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    it('should clamp values above maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10)
    })
  })

  describe('clampLineWidth', () => {
    it('should return valid line width within range', () => {
      expect(clampLineWidth(5)).toBe(5)
      expect(clampLineWidth(MIN_LINE_WIDTH)).toBe(MIN_LINE_WIDTH)
      expect(clampLineWidth(MAX_LINE_WIDTH)).toBe(MAX_LINE_WIDTH)
    })

    it('should clamp values below minimum', () => {
      expect(clampLineWidth(0)).toBe(MIN_LINE_WIDTH)
      expect(clampLineWidth(-5)).toBe(MIN_LINE_WIDTH)
    })

    it('should clamp values above maximum', () => {
      expect(clampLineWidth(100)).toBe(MAX_LINE_WIDTH)
    })
  })

  describe('clampSmoothing', () => {
    it('should return valid smoothing level within range', () => {
      expect(clampSmoothing(5)).toBe(5)
      expect(clampSmoothing(MIN_SMOOTHING)).toBe(MIN_SMOOTHING)
      expect(clampSmoothing(MAX_SMOOTHING)).toBe(MAX_SMOOTHING)
    })

    it('should clamp values below minimum', () => {
      expect(clampSmoothing(-1)).toBe(MIN_SMOOTHING)
    })

    it('should clamp values above maximum', () => {
      expect(clampSmoothing(100)).toBe(MAX_SMOOTHING)
    })
  })

  describe('createStroke', () => {
    it('should create a stroke with default values', () => {
      const stroke = createStroke()
      expect(stroke).toBeDefined()
      expect(stroke.id).toBeDefined()
      expect(stroke.color).toBe(DEFAULT_COLOR)
      expect(stroke.lineWidth).toBe(DEFAULT_LINE_WIDTH)
      expect(stroke.points).toEqual([])
    })

    it('should create a stroke with custom values', () => {
      const stroke = createStroke('#ff0000', 5)
      expect(stroke.color).toBe('#ff0000')
      expect(stroke.lineWidth).toBe(5)
      expect(stroke.points).toEqual([])
    })
  })

  describe('addPointToStroke', () => {
    it('should add a point to stroke', () => {
      const stroke = createStroke()
      const updated = addPointToStroke(stroke, { x: 10, y: 20 })
      expect(updated.points.length).toBe(1)
      expect(updated.points[0]).toEqual({ x: 10, y: 20 })
    })

    it('should not mutate original stroke', () => {
      const stroke = createStroke()
      addPointToStroke(stroke, { x: 10, y: 20 })
      expect(stroke.points.length).toBe(0)
    })

    it('should return original stroke if null', () => {
      expect(addPointToStroke(null, { x: 10, y: 20 })).toBeNull()
    })
  })

  describe('smoothPoints', () => {
    it('should return empty array for null/undefined input', () => {
      expect(smoothPoints(null)).toEqual([])
      expect(smoothPoints(undefined)).toEqual([])
    })

    it('should return original points if less than 3', () => {
      const points = [{ x: 0, y: 0 }, { x: 10, y: 10 }]
      expect(smoothPoints(points)).toEqual(points)
    })

    it('should return original points when smoothing level is 0', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 5, y: 3 },
        { x: 10, y: 10 },
        { x: 15, y: 8 },
        { x: 20, y: 20 },
      ]
      expect(smoothPoints(points, 0)).toEqual(points)
    })

    it('should smooth points with weighted moving average', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 5, y: 3 },
        { x: 10, y: 10 },
        { x: 15, y: 8 },
        { x: 20, y: 20 },
      ]
      const smoothed = smoothPoints(points, 5)
      expect(smoothed.length).toBe(points.length)
      expect(smoothed[0]).toEqual(points[0])
      expect(smoothed[smoothed.length - 1]).toEqual(points[points.length - 1])
    })

    it('should clamp smoothing level to valid range', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 5, y: 3 },
        { x: 10, y: 10 },
      ]
      const result1 = smoothPoints(points, -1)
      const result2 = smoothPoints(points, 100)
      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
    })
  })

  describe('getBezierPoints', () => {
    it('should return original points if less than 2', () => {
      expect(getBezierPoints([{ x: 0, y: 0 }])).toEqual([{ x: 0, y: 0 }])
      expect(getBezierPoints([])).toEqual([])
    })

    it('should return bezier points with control points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 5 },
      ]
      const bezier = getBezierPoints(points, 5)
      expect(bezier.length).toBe(3)
      expect(bezier[0]).toEqual({ x: 0, y: 0 })
      expect(bezier[1]).toHaveProperty('cp1x')
      expect(bezier[1]).toHaveProperty('cp1y')
      expect(bezier[1]).toHaveProperty('cp2x')
      expect(bezier[1]).toHaveProperty('cp2y')
      expect(bezier[2]).toEqual({ x: 20, y: 5 })
    })
  })

  describe('history management', () => {
    describe('createHistory', () => {
      it('should create empty history object', () => {
        const history = createHistory()
        expect(history).toEqual({
          past: [],
          present: [],
          future: [],
        })
      })
    })

    describe('pushHistory', () => {
      it('should push new state to history', () => {
        const history = createHistory()
        const newState = [{ id: 'stroke1', points: [] }]
        const result = pushHistory(history, newState)
        expect(result.present).toEqual(newState)
        expect(result.past).toEqual([[]])
        expect(result.future).toEqual([])
      })

      it('should not push if state is unchanged', () => {
        const state = [{ id: 'stroke1', points: [] }]
        const history = { past: [], present: state, future: [] }
        const result = pushHistory(history, state)
        expect(result).toBe(history)
      })

      it('should clear future when pushing new state', () => {
        const history = {
          past: [[]],
          present: [{ id: 'old' }],
          future: [[{ id: 'future' }]],
        }
        const newState = [{ id: 'new' }]
        const result = pushHistory(history, newState)
        expect(result.future).toEqual([])
      })

      it('should limit past history size', () => {
        let history = createHistory()
        for (let i = 0; i < 60; i++) {
          history = pushHistory(history, [{ id: `stroke${i}` }])
        }
        expect(history.past.length).toBeLessThanOrEqual(50)
      })

      it('should handle null history', () => {
        const newState = [{ id: 'stroke1' }]
        const result = pushHistory(null, newState)
        expect(result.present).toEqual(newState)
      })
    })

    describe('undoHistory', () => {
      it('should undo to previous state', () => {
        const pastState = [{ id: 'old' }]
        const presentState = [{ id: 'new' }]
        const history = {
          past: [pastState],
          present: presentState,
          future: [],
        }
        const result = undoHistory(history)
        expect(result.present).toEqual(pastState)
        expect(result.past).toEqual([])
        expect(result.future).toEqual([presentState])
      })

      it('should return original history when nothing to undo', () => {
        const history = { past: [], present: [], future: [] }
        const result = undoHistory(history)
        expect(result).toBe(history)
      })

      it('should handle null history', () => {
        expect(undoHistory(null)).toBeNull()
      })
    })

    describe('redoHistory', () => {
      it('should redo to next state', () => {
        const futureState = [{ id: 'future' }]
        const presentState = [{ id: 'present' }]
        const history = {
          past: [[{ id: 'old' }]],
          present: presentState,
          future: [futureState],
        }
        const result = redoHistory(history)
        expect(result.present).toEqual(futureState)
        expect(result.past).toContain(presentState)
        expect(result.future).toEqual([])
      })

      it('should return original history when nothing to redo', () => {
        const history = { past: [], present: [], future: [] }
        const result = redoHistory(history)
        expect(result).toBe(history)
      })

      it('should handle null history', () => {
        expect(redoHistory(null)).toBeNull()
      })
    })

    describe('canUndo / canRedo', () => {
      it('should correctly report undo/redo availability', () => {
        expect(canUndo({ past: [], present: [], future: [] })).toBe(false)
        expect(canUndo({ past: [[]], present: [], future: [] })).toBe(true)
        expect(canRedo({ past: [], present: [], future: [] })).toBe(false)
        expect(canRedo({ past: [], present: [], future: [[]] })).toBe(true)
        expect(canUndo(null)).toBe(false)
        expect(canRedo(null)).toBe(false)
      })
    })
  })

  describe('strokeToPathData', () => {
    it('should return empty string for invalid stroke', () => {
      expect(strokeToPathData(null)).toBe('')
      expect(strokeToPathData({ points: [] })).toBe('')
      expect(strokeToPathData({ points: [{ x: 0, y: 0 }] })).toBe('')
    })

    it('should generate valid SVG path data', () => {
      const stroke = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 5 },
        ],
      }
      const path = strokeToPathData(stroke, 0)
      expect(path).toContain('M')
      expect(path).toContain('0')
      expect(path).toContain('20')
    })
  })

  describe('isCanvasEmpty', () => {
    it('should return true for empty or invalid input', () => {
      expect(isCanvasEmpty(null)).toBe(true)
      expect(isCanvasEmpty(undefined)).toBe(true)
      expect(isCanvasEmpty([])).toBe(true)
      expect(isCanvasEmpty([{ points: [] }])).toBe(true)
      expect(isCanvasEmpty([{ points: [{ x: 0, y: 0 }] }])).toBe(true)
    })

    it('should return false when strokes exist', () => {
      const strokes = [
        { points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] },
      ]
      expect(isCanvasEmpty(strokes)).toBe(false)
    })
  })

  describe('getStrokesBounds', () => {
    it('should return zero bounds for empty strokes', () => {
      const bounds = getStrokesBounds([])
      expect(bounds).toEqual({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
        width: 0,
        height: 0,
      })
    })

    it('should calculate correct bounds for strokes', () => {
      const strokes = [
        {
          points: [
            { x: 10, y: 20 },
            { x: 50, y: 60 },
          ],
        },
        {
          points: [
            { x: 5, y: 15 },
            { x: 100, y: 120 },
          ],
        },
      ]
      const bounds = getStrokesBounds(strokes)
      expect(bounds.minX).toBe(5)
      expect(bounds.minY).toBe(15)
      expect(bounds.maxX).toBe(100)
      expect(bounds.maxY).toBe(120)
      expect(bounds.width).toBe(95)
      expect(bounds.height).toBe(105)
    })

    it('should handle strokes without points', () => {
      const strokes = [{ points: [] }]
      const bounds = getStrokesBounds(strokes)
      expect(bounds).toEqual({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
        width: 0,
        height: 0,
      })
    })
  })

  describe('generateFileName', () => {
    it('should generate filename with correct format', () => {
      const filename = generateFileName()
      expect(filename).toMatch(/^signature_\d{8}_\d{6}\.png$/)
    })
  })

  describe('localStorage persistence', () => {
    let storage

    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadSignaturesFromStorage should return empty array for empty storage', () => {
      const result = loadSignaturesFromStorage(storage)
      expect(result).toEqual([])
    })

    it('saveSignaturesToStorage and loadSignaturesFromStorage should round-trip correctly', () => {
      const signatures = [
        { id: 'test1', dataUrl: 'data:...', createdAt: Date.now(), thumbnail: 'data:...' },
      ]
      saveSignaturesToStorage(signatures, storage)
      const loaded = loadSignaturesFromStorage(storage)
      expect(loaded.length).toBe(1)
      expect(loaded[0].id).toBe('test1')
    })

    it('loadSignaturesFromStorage should handle corrupted JSON', () => {
      storage.setItem(STORAGE_KEY, '{bad json')
      const result = loadSignaturesFromStorage(storage)
      expect(result).toEqual([])
    })

    it('loadSignaturesFromStorage should filter out invalid entries', () => {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          { id: 'valid', dataUrl: 'data:...', createdAt: 123 },
          { id: 'missing_dataUrl', createdAt: 123 },
          null,
          'not-an-object',
        ])
      )
      const result = loadSignaturesFromStorage(storage)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('valid')
    })

    it('saveSignaturesToStorage should trim to max items', () => {
      const signatures = []
      for (let i = 0; i < 30; i++) {
        signatures.push({ id: `sig${i}`, dataUrl: 'data:...', createdAt: i })
      }
      saveSignaturesToStorage(signatures, storage)
      const loaded = loadSignaturesFromStorage(storage)
      expect(loaded.length).toBe(HISTORY_MAX_ITEMS)
    })

    it('should not throw when storage is unavailable', () => {
      expect(() => loadSignaturesFromStorage(null)).not.toThrow()
      expect(() => saveSignaturesToStorage([], null)).not.toThrow()
    })
  })

  describe('signature history operations', () => {
    describe('addSignatureToHistory', () => {
      it('should add new record to the beginning', () => {
        const history = [{ id: 'old' }]
        const newRecord = { id: 'new' }
        const result = addSignatureToHistory(history, newRecord)
        expect(result[0]).toBe(newRecord)
        expect(result[1].id).toBe('old')
      })

      it('should limit history to max items', () => {
        const history = []
        for (let i = 0; i < 25; i++) {
          history.push({ id: `old${i}` })
        }
        const newRecord = { id: 'new' }
        const result = addSignatureToHistory(history, newRecord, 20)
        expect(result.length).toBe(20)
        expect(result[0].id).toBe('new')
      })

      it('should handle null history', () => {
        const result = addSignatureToHistory(null, { id: 'new' })
        expect(result.length).toBe(1)
      })
    })

    describe('removeSignatureFromHistory', () => {
      it('should remove signature by id', () => {
        const history = [{ id: 'a' }, { id: 'b' }]
        const result = removeSignatureFromHistory(history, 'a')
        expect(result.length).toBe(1)
        expect(result[0].id).toBe('b')
      })

      it('should return empty array for null history', () => {
        const result = removeSignatureFromHistory(null, 'a')
        expect(result).toEqual([])
      })
    })
  })

  describe('isValidColor', () => {
    it('should validate hex colors', () => {
      expect(isValidColor('#000')).toBe(true)
      expect(isValidColor('#000000')).toBe(true)
      expect(isValidColor('#ff00ff')).toBe(true)
      expect(isValidColor('000000')).toBe(false)
      expect(isValidColor('#gggggg')).toBe(false)
    })

    it('should validate rgb colors', () => {
      expect(isValidColor('rgb(255, 0, 0)')).toBe(true)
      expect(isValidColor('rgb(0, 128, 255)')).toBe(true)
      expect(isValidColor('rgb(255,0,0)')).toBe(true)
    })

    it('should validate rgba colors', () => {
      expect(isValidColor('rgba(255, 0, 0, 0.5)')).toBe(true)
      expect(isValidColor('rgba(0, 0, 0, 1)')).toBe(true)
    })

    it('should reject invalid inputs', () => {
      expect(isValidColor(null)).toBe(false)
      expect(isValidColor(123)).toBe(false)
      expect(isValidColor({})).toBe(false)
      expect(isValidColor('red')).toBe(false)
    })
  })

  describe('formatDate', () => {
    it('should format timestamp to readable date string', () => {
      const timestamp = Date.now()
      const formatted = formatDate(timestamp)
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })
  })

  describe('drawStrokesOnCanvas', () => {
    it('should not throw when ctx is null', () => {
      expect(() => drawStrokesOnCanvas(null, [])).not.toThrow()
    })

    it('should handle empty strokes array', () => {
      const mockCtx = {
        save: () => {},
        restore: () => {},
      }
      expect(() => drawStrokesOnCanvas(mockCtx, [])).not.toThrow()
    })
  })
})
