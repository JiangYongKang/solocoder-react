import { describe, it, expect, beforeEach } from 'vitest'
import {
  DEFAULT_GRID_WIDTH,
  DEFAULT_GRID_HEIGHT,
  MIN_GRID_SIZE,
  MAX_GRID_SIZE,
  HISTORY_LIMIT,
  DEFAULT_PALETTE,
  EMPTY_CELL_COLOR,
} from '@/pages/pixel-editor/constants.js'
import {
  createEmptyGrid,
  validateGridSize,
  cloneGrid,
  isInBounds,
  getPixel,
  setPixel,
  applyBrush,
  applyEraser,
  floodFill,
  createHistory,
  pushHistory,
  undo,
  redo,
  canUndo,
  canRedo,
  isValidHexColor,
  addColorToPalette,
  removeColorFromPalette,
  exportToJSON,
  validateAndParseJSON,
  saveEditorData,
  loadEditorData,
  clearEditorData,
  calculateCellSize,
  calculateZoomedCellSize,
} from '@/pages/pixel-editor/pixelEditorCore.js'

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

function createTestGrid(width, height, fillColor = null) {
  const grid = []
  for (let y = 0; y < height; y++) {
    const row = []
    for (let x = 0; x < width; x++) {
      row.push(fillColor)
    }
    grid.push(row)
  }
  return grid
}

describe('pixelEditorCore', () => {
  describe('createEmptyGrid', () => {
    it('should create a grid with default dimensions', () => {
      const grid = createEmptyGrid()
      expect(grid.length).toBe(DEFAULT_GRID_HEIGHT)
      grid.forEach((row) => {
        expect(row.length).toBe(DEFAULT_GRID_WIDTH)
      })
    })

    it('should create a grid with custom dimensions', () => {
      const grid = createEmptyGrid(8, 12)
      expect(grid.length).toBe(12)
      grid.forEach((row) => {
        expect(row.length).toBe(8)
      })
    })

    it('should fill all cells with EMPTY_CELL_COLOR (null)', () => {
      const grid = createEmptyGrid(4, 4)
      grid.forEach((row) => {
        row.forEach((cell) => {
          expect(cell).toBeNull()
        })
      })
    })
  })

  describe('validateGridSize', () => {
    it('should accept valid size within range', () => {
      const result = validateGridSize(16, 16)
      expect(result.valid).toBe(true)
      expect(result.width).toBe(16)
      expect(result.height).toBe(16)
    })

    it('should accept minimum size', () => {
      const result = validateGridSize(MIN_GRID_SIZE, MIN_GRID_SIZE)
      expect(result.valid).toBe(true)
      expect(result.width).toBe(MIN_GRID_SIZE)
      expect(result.height).toBe(MIN_GRID_SIZE)
    })

    it('should accept maximum size', () => {
      const result = validateGridSize(MAX_GRID_SIZE, MAX_GRID_SIZE)
      expect(result.valid).toBe(true)
      expect(result.width).toBe(MAX_GRID_SIZE)
      expect(result.height).toBe(MAX_GRID_SIZE)
    })

    it('should reject size below minimum', () => {
      const result = validateGridSize(4, 16)
      expect(result.valid).toBe(false)
      expect(result.width).toBe(DEFAULT_GRID_WIDTH)
      expect(result.height).toBe(DEFAULT_GRID_HEIGHT)
    })

    it('should reject size above maximum', () => {
      const result = validateGridSize(100, 16)
      expect(result.valid).toBe(false)
    })

    it('should reject non-integer values', () => {
      expect(validateGridSize(16.5, 16).valid).toBe(false)
      expect(validateGridSize('abc', 16).valid).toBe(false)
      expect(validateGridSize(null, 16).valid).toBe(false)
    })

    it('should handle string numbers', () => {
      const result = validateGridSize('16', '32')
      expect(result.valid).toBe(true)
      expect(result.width).toBe(16)
      expect(result.height).toBe(32)
    })
  })

  describe('cloneGrid', () => {
    it('should create a deep copy of the grid', () => {
      const original = createTestGrid(4, 4, '#ff0000')
      const cloned = cloneGrid(original)
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned[0]).not.toBe(original[0])
    })

    it('should not mutate original when modifying clone', () => {
      const original = createTestGrid(4, 4, null)
      const cloned = cloneGrid(original)
      cloned[0][0] = '#ff0000'
      expect(original[0][0]).toBeNull()
    })
  })

  describe('isInBounds', () => {
    const grid = createTestGrid(10, 10, null)

    it('should return true for coordinates inside the grid', () => {
      expect(isInBounds(grid, 0, 0)).toBe(true)
      expect(isInBounds(grid, 5, 5)).toBe(true)
      expect(isInBounds(grid, 9, 9)).toBe(true)
    })

    it('should return false for negative coordinates', () => {
      expect(isInBounds(grid, -1, 0)).toBe(false)
      expect(isInBounds(grid, 0, -1)).toBe(false)
    })

    it('should return false for coordinates outside grid', () => {
      expect(isInBounds(grid, 10, 0)).toBe(false)
      expect(isInBounds(grid, 0, 10)).toBe(false)
      expect(isInBounds(grid, 100, 100)).toBe(false)
    })

    it('should return false for null or empty grid', () => {
      expect(isInBounds(null, 0, 0)).toBe(false)
      expect(isInBounds([], 0, 0)).toBe(false)
      expect(isInBounds([[]], 0, 0)).toBe(false)
    })
  })

  describe('getPixel', () => {
    it('should return correct pixel color', () => {
      const grid = createTestGrid(4, 4, null)
      grid[2][3] = '#ff0000'
      expect(getPixel(grid, 3, 2)).toBe('#ff0000')
    })

    it('should return null for empty cell', () => {
      const grid = createTestGrid(4, 4, null)
      expect(getPixel(grid, 0, 0)).toBeNull()
    })

    it('should return null for out of bounds', () => {
      const grid = createTestGrid(4, 4, '#ff0000')
      expect(getPixel(grid, 10, 10)).toBeNull()
    })
  })

  describe('setPixel', () => {
    it('should set pixel color at given coordinates', () => {
      const grid = createTestGrid(4, 4, null)
      const result = setPixel(grid, 2, 3, '#ff0000')
      expect(result[3][2]).toBe('#ff0000')
    })

    it('should not mutate the original grid', () => {
      const grid = createTestGrid(4, 4, null)
      const result = setPixel(grid, 0, 0, '#ff0000')
      expect(grid[0][0]).toBeNull()
      expect(result[0][0]).toBe('#ff0000')
    })

    it('should return original grid for out of bounds', () => {
      const grid = createTestGrid(4, 4, null)
      const result = setPixel(grid, 10, 10, '#ff0000')
      expect(result).toEqual(grid)
    })
  })

  describe('applyBrush', () => {
    it('should apply single pixel with brush size 1', () => {
      const grid = createTestGrid(4, 4, null)
      const result = applyBrush(grid, 1, 1, '#ff0000', 1)
      expect(result[1][1]).toBe('#ff0000')
    })

    it('should apply 3x3 area with brush size 3', () => {
      const grid = createTestGrid(5, 5, null)
      const result = applyBrush(grid, 2, 2, '#ff0000', 3)
      for (let y = 1; y <= 3; y++) {
        for (let x = 1; x <= 3; x++) {
          expect(result[y][x]).toBe('#ff0000')
        }
      }
      expect(result[0][0]).toBeNull()
      expect(result[4][4]).toBeNull()
    })

    it('should not go out of bounds at edges', () => {
      const grid = createTestGrid(3, 3, null)
      const result = applyBrush(grid, 0, 0, '#ff0000', 3)
      expect(result[0][0]).toBe('#ff0000')
      expect(result[1][1]).toBe('#ff0000')
    })

    it('should not mutate original grid', () => {
      const grid = createTestGrid(4, 4, null)
      const result = applyBrush(grid, 0, 0, '#ff0000', 1)
      expect(grid[0][0]).toBeNull()
      expect(result[0][0]).toBe('#ff0000')
    })
  })

  describe('applyEraser', () => {
    it('should set pixel to null (empty)', () => {
      const grid = createTestGrid(4, 4, '#ff0000')
      const result = applyEraser(grid, 1, 1, 1)
      expect(result[1][1]).toBeNull()
      expect(result[0][0]).toBe('#ff0000')
    })

    it('should erase 2x2 area with brush size 2', () => {
      const grid = createTestGrid(4, 4, '#ff0000')
      const result = applyEraser(grid, 1, 1, 2)
      expect(result[0][0]).toBeNull()
      expect(result[0][1]).toBeNull()
      expect(result[1][0]).toBeNull()
      expect(result[1][1]).toBeNull()
    })

    it('should use EMPTY_CELL_COLOR constant', () => {
      const grid = createTestGrid(2, 2, '#ff0000')
      const result = applyEraser(grid, 0, 0, 1)
      expect(result[0][0]).toBe(EMPTY_CELL_COLOR)
    })
  })

  describe('floodFill', () => {
    it('should fill connected region with same color', () => {
      const grid = createTestGrid(5, 5, null)
      const result = floodFill(grid, 2, 2, '#ff0000')
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          expect(result[y][x]).toBe('#ff0000')
        }
      }
    })

    it('should not fill across boundary colors', () => {
      const grid = createTestGrid(5, 5, null)
      for (let x = 0; x < 5; x++) {
        grid[2][x] = '#000000'
      }
      const result = floodFill(grid, 0, 0, '#ff0000')
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 5; x++) {
          expect(result[y][x]).toBe('#ff0000')
        }
      }
      for (let x = 0; x < 5; x++) {
        expect(result[2][x]).toBe('#000000')
      }
      for (let y = 3; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          expect(result[y][x]).toBeNull()
        }
      }
    })

    it('should not change grid if target color equals new color', () => {
      const grid = createTestGrid(3, 3, '#ff0000')
      const result = floodFill(grid, 1, 1, '#ff0000')
      expect(result).toEqual(grid)
    })

    it('should not change grid for out of bounds', () => {
      const grid = createTestGrid(3, 3, null)
      const result = floodFill(grid, 10, 10, '#ff0000')
      expect(result).toEqual(grid)
    })

    it('should fill only connected region (not diagonally)', () => {
      const grid = createTestGrid(5, 5, null)
      grid[0][2] = '#000000'
      grid[1][1] = '#000000'
      grid[2][0] = '#000000'
      const result = floodFill(grid, 0, 0, '#ff0000')
      expect(result[0][0]).toBe('#ff0000')
      expect(result[0][1]).toBe('#ff0000')
      expect(result[1][0]).toBe('#ff0000')
      expect(result[1][1]).toBe('#000000')
    })
  })

  describe('History management', () => {
    describe('createHistory', () => {
      it('should create empty history with past and future arrays', () => {
        const history = createHistory()
        expect(history.past).toEqual([])
        expect(history.future).toEqual([])
      })
    })

    describe('pushHistory', () => {
      it('should add state to past and clear future', () => {
        const history = { past: ['a'], future: ['b', 'c'] }
        const result = pushHistory(history, 'd')
        expect(result.past).toEqual(['a', 'd'])
        expect(result.future).toEqual([])
      })

      it('should limit history to HISTORY_LIMIT', () => {
        const past = []
        for (let i = 0; i < HISTORY_LIMIT; i++) {
          past.push(i)
        }
        const history = { past, future: [] }
        const result = pushHistory(history, 'new')
        expect(result.past.length).toBe(HISTORY_LIMIT)
        expect(result.past[0]).toBe(1)
        expect(result.past[HISTORY_LIMIT - 1]).toBe('new')
      })
    })

    describe('undo', () => {
      it('should restore previous state', () => {
        const history = { past: ['state1', 'state2'], future: [] }
        const { state, history: newHistory } = undo(history, 'state3')
        expect(state).toBe('state2')
        expect(newHistory.past).toEqual(['state1'])
        expect(newHistory.future).toEqual(['state3'])
      })

      it('should return current state when no past', () => {
        const history = { past: [], future: [] }
        const { state, history: newHistory } = undo(history, 'current')
        expect(state).toBe('current')
        expect(newHistory).toBe(history)
      })
    })

    describe('redo', () => {
      it('should restore next state', () => {
        const history = { past: ['state1'], future: ['state3', 'state4'] }
        const { state, history: newHistory } = redo(history, 'state2')
        expect(state).toBe('state3')
        expect(newHistory.past).toEqual(['state1', 'state2'])
        expect(newHistory.future).toEqual(['state4'])
      })

      it('should return current state when no future', () => {
        const history = { past: [], future: [] }
        const { state, history: newHistory } = redo(history, 'current')
        expect(state).toBe('current')
        expect(newHistory).toBe(history)
      })
    })

    describe('canUndo / canRedo', () => {
      it('should return true when history available', () => {
        expect(canUndo({ past: ['a'], future: [] })).toBe(true)
        expect(canRedo({ past: [], future: ['a'] })).toBe(true)
      })

      it('should return false when history empty', () => {
        expect(canUndo({ past: [], future: [] })).toBe(false)
        expect(canRedo({ past: [], future: [] })).toBe(false)
      })
    })
  })

  describe('Color and Palette functions', () => {
    describe('isValidHexColor', () => {
      it('should accept 6-digit hex colors', () => {
        expect(isValidHexColor('#ff0000')).toBe(true)
        expect(isValidHexColor('#000000')).toBe(true)
        expect(isValidHexColor('#ffffff')).toBe(true)
        expect(isValidHexColor('#123ABC')).toBe(true)
      })

      it('should accept 3-digit hex colors', () => {
        expect(isValidHexColor('#f00')).toBe(true)
        expect(isValidHexColor('#FFF')).toBe(true)
        expect(isValidHexColor('#abc')).toBe(true)
      })

      it('should reject invalid formats', () => {
        expect(isValidHexColor('ff0000')).toBe(false)
        expect(isValidHexColor('#ff000')).toBe(false)
        expect(isValidHexColor('#ff00000')).toBe(false)
        expect(isValidHexColor('#gggggg')).toBe(false)
        expect(isValidHexColor(null)).toBe(false)
        expect(isValidHexColor(123)).toBe(false)
        expect(isValidHexColor('')).toBe(false)
      })
    })

    describe('addColorToPalette', () => {
      it('should add new color to palette', () => {
        const palette = ['#000000', '#ffffff']
        const result = addColorToPalette(palette, '#ff0000')
        expect(result).toEqual(['#000000', '#ffffff', '#ff0000'])
      })

      it('should not add duplicate colors', () => {
        const palette = ['#000000', '#ff0000']
        const result = addColorToPalette(palette, '#ff0000')
        expect(result).toEqual(palette)
      })

      it('should not add invalid colors', () => {
        const palette = ['#000000']
        const result = addColorToPalette(palette, 'invalid')
        expect(result).toEqual(palette)
      })

      it('should not mutate original palette', () => {
        const palette = ['#000000']
        const original = [...palette]
        addColorToPalette(palette, '#ff0000')
        expect(palette).toEqual(original)
      })
    })

    describe('removeColorFromPalette', () => {
      it('should remove specified color', () => {
        const palette = ['#000000', '#ff0000', '#ffffff']
        const result = removeColorFromPalette(palette, '#ff0000')
        expect(result).toEqual(['#000000', '#ffffff'])
      })

      it('should return same palette if color not found', () => {
        const palette = ['#000000']
        const result = removeColorFromPalette(palette, '#ff0000')
        expect(result).toEqual(palette)
      })
    })
  })

  describe('JSON Import/Export', () => {
    describe('exportToJSON', () => {
      it('should export valid JSON string', () => {
        const grid = createTestGrid(4, 4, null)
        const json = exportToJSON(grid, 4, 4, ['#000000'])
        const parsed = JSON.parse(json)
        expect(parsed.version).toBe(1)
        expect(parsed.width).toBe(4)
        expect(parsed.height).toBe(4)
        expect(parsed.palette).toEqual(['#000000'])
        expect(parsed.grid).toEqual(grid)
      })

      it('should use default palette if not provided', () => {
        const grid = createTestGrid(2, 2, null)
        const json = exportToJSON(grid, 2, 2)
        const parsed = JSON.parse(json)
        expect(parsed.palette).toEqual(DEFAULT_PALETTE)
      })
    })

    describe('validateAndParseJSON', () => {
      it('should parse and validate correct JSON', () => {
        const grid = createTestGrid(8, 8, null)
        grid[0][0] = '#ff0000'
        const json = JSON.stringify({
          version: 1,
          width: 8,
          height: 8,
          palette: ['#ff0000'],
          grid,
        })
        const result = validateAndParseJSON(json)
        expect(result.valid).toBe(true)
        expect(result.data.width).toBe(8)
        expect(result.data.height).toBe(8)
        expect(result.data.grid).toEqual(grid)
        expect(result.data.palette).toEqual(['#ff0000'])
      })

      it('should reject invalid JSON format', () => {
        const result = validateAndParseJSON('not json')
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })

      it('should reject missing width/height', () => {
        const result = validateAndParseJSON(JSON.stringify({ grid: [] }))
        expect(result.valid).toBe(false)
      })

      it('should reject out of range grid size', () => {
        const result = validateAndParseJSON(JSON.stringify({
          width: 100,
          height: 100,
          grid: [],
        }))
        expect(result.valid).toBe(false)
      })

      it('should reject grid with wrong row count', () => {
        const result = validateAndParseJSON(JSON.stringify({
          width: 4,
          height: 4,
          grid: [[], [], []],
        }))
        expect(result.valid).toBe(false)
      })

      it('should reject grid with wrong column count', () => {
        const result = validateAndParseJSON(JSON.stringify({
          width: 4,
          height: 2,
          grid: [[null, null], [null, null, null]],
        }))
        expect(result.valid).toBe(false)
      })

      it('should reject grid with invalid colors', () => {
        const result = validateAndParseJSON(JSON.stringify({
          width: 2,
          height: 2,
          grid: [['invalid', null], [null, null]],
        }))
        expect(result.valid).toBe(false)
      })

      it('should accept null as empty cell color', () => {
        const result = validateAndParseJSON(JSON.stringify({
          width: 8,
          height: 8,
          grid: [
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, '#ff0000'],
          ],
        }))
        expect(result.valid).toBe(true)
      })

      it('should use default palette if not provided', () => {
        const grid = createTestGrid(8, 8, null)
        const result = validateAndParseJSON(JSON.stringify({
          width: 8,
          height: 8,
          grid,
        }))
        expect(result.valid).toBe(true)
        expect(result.data.palette).toEqual(DEFAULT_PALETTE)
      })
    })
  })

  describe('localStorage persistence', () => {
    let storage
    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadEditorData should return null when storage empty', () => {
      expect(loadEditorData(storage)).toBeNull()
    })

    it('saveEditorData and loadEditorData should round-trip correctly', () => {
      const data = {
        gridWidth: 16,
        gridHeight: 16,
        grid: createTestGrid(16, 16, null),
        palette: ['#000000'],
        currentColor: '#ff0000',
      }
      saveEditorData(data, storage)
      const loaded = loadEditorData(storage)
      expect(loaded).toEqual(data)
    })

    it('loadEditorData should return null for invalid JSON', () => {
      storage.setItem('pixel_editor_data', 'not json')
      expect(loadEditorData(storage)).toBeNull()
    })

    it('clearEditorData should remove stored data', () => {
      saveEditorData({ test: true }, storage)
      clearEditorData(storage)
      expect(loadEditorData(storage)).toBeNull()
    })

    it('should not throw when storage is null', () => {
      expect(() => saveEditorData({}, null)).not.toThrow()
      expect(() => loadEditorData(null)).not.toThrow()
      expect(() => clearEditorData(null)).not.toThrow()
    })
  })

  describe('Size calculations', () => {
    describe('calculateCellSize', () => {
      it('should calculate cell size for square grid', () => {
        expect(calculateCellSize(16, 16, 512)).toBe(32)
      })

      it('should use larger dimension for calculation', () => {
        expect(calculateCellSize(32, 16, 512)).toBe(16)
        expect(calculateCellSize(16, 32, 512)).toBe(16)
      })

      it('should floor the result', () => {
        expect(calculateCellSize(10, 10, 512)).toBe(51)
      })
    })

    describe('calculateZoomedCellSize', () => {
      it('should multiply cell size by zoom', () => {
        expect(calculateZoomedCellSize(32, 2)).toBe(64)
      })

      it('should handle fractional zoom', () => {
        expect(calculateZoomedCellSize(32, 1.5)).toBe(48)
      })

      it('should not go below 1', () => {
        expect(calculateZoomedCellSize(1, 0.1)).toBe(1)
      })
    })
  })
})
