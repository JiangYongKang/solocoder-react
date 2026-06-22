import { describe, it, expect } from 'vitest'
import {
  generateId,
  clampValue,
  createBackgroundLayer,
  createTextLayer,
  createInitialState,
  addLayer,
  removeLayer,
  updateLayer,
  moveLayerPosition,
  reorderLayers,
  selectLayer,
  setCanvasSize,
  clampFontSize,
  clampStrokeWidth,
  clampShadowBlur,
  clampShadowOffset,
  clampBgOpacity,
  pushHistory,
  canUndo,
  canRedo,
  undo,
  redo,
  hitTestTextLayer,
  getSelectedLayer,
  serializeState,
  isValidColor,
  sanitizeColor,
  drawPoster,
} from '../../poster-designer/posterDesignerCore.js'
import {
  DEFAULT_CANVAS_SIZE,
  DEFAULT_BG_COLOR,
  DEFAULT_FONT,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  MIN_STROKE_WIDTH,
  MAX_STROKE_WIDTH,
  MIN_SHADOW_BLUR,
  MAX_SHADOW_BLUR,
  MIN_SHADOW_OFFSET,
  MAX_SHADOW_OFFSET,
  MIN_BG_OPACITY,
  MAX_BG_OPACITY,
  MAX_HISTORY,
} from '../../poster-designer/constants.js'

describe('posterDesignerCore', () => {
  describe('generateId', () => {
    it('should generate id with default prefix', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.startsWith('layer_')).toBe(true)
    })

    it('should generate id with custom prefix', () => {
      const id = generateId('text')
      expect(id.startsWith('text_')).toBe(true)
    })

    it('should generate unique ids', () => {
      const a = generateId()
      const b = generateId()
      expect(a).not.toBe(b)
    })
  })

  describe('clampValue', () => {
    it('should clamp value within range', () => {
      expect(clampValue(5, 0, 10)).toBe(5)
    })

    it('should clamp to min', () => {
      expect(clampValue(-1, 0, 10)).toBe(0)
    })

    it('should clamp to max', () => {
      expect(clampValue(15, 0, 10)).toBe(10)
    })

    it('should handle equal min and max', () => {
      expect(clampValue(5, 3, 3)).toBe(3)
    })
  })

  describe('createBackgroundLayer', () => {
    it('should create background layer with defaults', () => {
      const bg = createBackgroundLayer()
      expect(bg.id).toBe('bg')
      expect(bg.type).toBe('background')
      expect(bg.color).toBe(DEFAULT_BG_COLOR)
      expect(bg.image).toBeNull()
      expect(bg.imageOpacity).toBe(1)
    })

    it('should override properties', () => {
      const bg = createBackgroundLayer({ color: '#ff0000', imageOpacity: 0.5 })
      expect(bg.color).toBe('#ff0000')
      expect(bg.imageOpacity).toBe(0.5)
    })
  })

  describe('createTextLayer', () => {
    it('should create text layer with defaults', () => {
      const layer = createTextLayer()
      expect(layer.type).toBe('text')
      expect(layer.text).toBe('双击编辑文字')
      expect(layer.fontFamily).toBe(DEFAULT_FONT)
      expect(layer.fontSize).toBe(DEFAULT_FONT_SIZE)
      expect(layer.color).toBe(DEFAULT_TEXT_COLOR)
      expect(layer.strokeWidth).toBe(0)
      expect(layer.shadowBlur).toBe(0)
      expect(layer.id.startsWith('text_')).toBe(true)
    })

    it('should override properties', () => {
      const layer = createTextLayer({ text: 'Hello', fontSize: 72, x: 200, y: 300 })
      expect(layer.text).toBe('Hello')
      expect(layer.fontSize).toBe(72)
      expect(layer.x).toBe(200)
      expect(layer.y).toBe(300)
    })
  })

  describe('createInitialState', () => {
    it('should create initial state with default canvas size', () => {
      const state = createInitialState()
      expect(state.canvasWidth).toBe(DEFAULT_CANVAS_SIZE.width)
      expect(state.canvasHeight).toBe(DEFAULT_CANVAS_SIZE.height)
      expect(state.layers).toHaveLength(1)
      expect(state.layers[0].type).toBe('background')
      expect(state.selectedLayerId).toBeNull()
    })
  })

  describe('addLayer', () => {
    it('should add layer and select it', () => {
      const state = createInitialState()
      const layer = createTextLayer({ text: 'test' })
      const newState = addLayer(state, layer)
      expect(newState.layers).toHaveLength(2)
      expect(newState.layers[1]).toBe(layer)
      expect(newState.selectedLayerId).toBe(layer.id)
    })

    it('should not modify original state', () => {
      const state = createInitialState()
      const layer = createTextLayer()
      addLayer(state, layer)
      expect(state.layers).toHaveLength(1)
    })
  })

  describe('removeLayer', () => {
    it('should remove text layer and deselect if selected', () => {
      const state = createInitialState()
      const layer = createTextLayer({ text: 'test' })
      const withLayer = addLayer(state, layer)
      const removed = removeLayer(withLayer, layer.id)
      expect(removed.layers).toHaveLength(1)
      expect(removed.selectedLayerId).toBeNull()
    })

    it('should not remove background layer', () => {
      const state = createInitialState()
      const removed = removeLayer(state, 'bg')
      expect(removed.layers).toHaveLength(1)
      expect(removed.layers[0].type).toBe('background')
    })

    it('should keep selection if removing non-selected layer', () => {
      const state = createInitialState()
      const layer1 = createTextLayer({ text: 'A' })
      const layer2 = createTextLayer({ text: 'B' })
      let s = addLayer(state, layer1)
      s = addLayer(s, layer2)
      const removed = removeLayer(s, layer1.id)
      expect(removed.selectedLayerId).toBe(layer2.id)
    })
  })

  describe('updateLayer', () => {
    it('should update specified properties of a layer', () => {
      const state = createInitialState()
      const newState = updateLayer(state, 'bg', { color: '#ff0000' })
      expect(newState.layers[0].color).toBe('#ff0000')
    })

    it('should not modify other layers', () => {
      const state = createInitialState()
      const layer = createTextLayer({ text: 'test' })
      const withLayer = addLayer(state, layer)
      const updated = updateLayer(withLayer, 'bg', { color: '#00ff00' })
      const textLayer = updated.layers.find((l) => l.id === layer.id)
      expect(textLayer.text).toBe('test')
    })

    it('should return same state if layer not found', () => {
      const state = createInitialState()
      const newState = updateLayer(state, 'nonexistent', { color: 'red' })
      expect(newState.layers).toEqual(state.layers)
    })
  })

  describe('moveLayerPosition', () => {
    it('should move layer to new index', () => {
      const state = createInitialState()
      const layer1 = createTextLayer({ text: 'A' })
      const layer2 = createTextLayer({ text: 'B' })
      let s = addLayer(state, layer1)
      s = addLayer(s, layer2)
      const moved = moveLayerPosition(s, layer1.id, 2)
      expect(moved.layers[1].id).toBe(layer2.id)
      expect(moved.layers[2].id).toBe(layer1.id)
    })

    it('should not move background layer', () => {
      const state = createInitialState()
      const layer = createTextLayer()
      const s = addLayer(state, layer)
      const moved = moveLayerPosition(s, 'bg', 2)
      expect(moved.layers[0].id).toBe('bg')
    })

    it('should not move to index 0 (background)', () => {
      const state = createInitialState()
      const layer = createTextLayer()
      const s = addLayer(state, layer)
      const moved = moveLayerPosition(s, layer.id, 0)
      expect(moved.layers[0].id).toBe('bg')
    })
  })

  describe('reorderLayers', () => {
    it('should reorder layers from one index to another', () => {
      const state = createInitialState()
      const layer1 = createTextLayer({ text: 'A' })
      const layer2 = createTextLayer({ text: 'B' })
      const layer3 = createTextLayer({ text: 'C' })
      let s = addLayer(state, layer1)
      s = addLayer(s, layer2)
      s = addLayer(s, layer3)
      const reordered = reorderLayers(s, 1, 3)
      expect(reordered.layers[1].id).toBe(layer2.id)
      expect(reordered.layers[2].id).toBe(layer3.id)
      expect(reordered.layers[3].id).toBe(layer1.id)
    })

    it('should not allow reordering background (index 0)', () => {
      const state = createInitialState()
      const layer = createTextLayer()
      const s = addLayer(state, layer)
      const reordered = reorderLayers(s, 0, 1)
      expect(reordered.layers).toEqual(s.layers)
    })

    it('should not allow moving to index 0', () => {
      const state = createInitialState()
      const layer = createTextLayer()
      const s = addLayer(state, layer)
      const reordered = reorderLayers(s, 1, 0)
      expect(reordered.layers).toEqual(s.layers)
    })
  })

  describe('selectLayer', () => {
    it('should select layer by id', () => {
      const state = createInitialState()
      const layer = createTextLayer()
      const s = addLayer(state, layer)
      const selected = selectLayer(s, layer.id)
      expect(selected.selectedLayerId).toBe(layer.id)
    })

    it('should deselect by passing null', () => {
      const state = createInitialState()
      const selected = selectLayer(state, null)
      expect(selected.selectedLayerId).toBeNull()
    })
  })

  describe('setCanvasSize', () => {
    it('should update canvas dimensions', () => {
      const state = createInitialState()
      const newState = setCanvasSize(state, 800, 800)
      expect(newState.canvasWidth).toBe(800)
      expect(newState.canvasHeight).toBe(800)
    })

    it('should preserve layers', () => {
      const state = createInitialState()
      const layer = createTextLayer()
      const withLayer = addLayer(state, layer)
      const resized = setCanvasSize(withLayer, 1920, 1080)
      expect(resized.layers).toHaveLength(2)
    })
  })

  describe('clamp functions', () => {
    it('clampFontSize should clamp between MIN and MAX', () => {
      expect(clampFontSize(0)).toBe(MIN_FONT_SIZE)
      expect(clampFontSize(50)).toBe(50)
      expect(clampFontSize(999)).toBe(MAX_FONT_SIZE)
    })

    it('clampStrokeWidth should clamp between MIN and MAX', () => {
      expect(clampStrokeWidth(-5)).toBe(MIN_STROKE_WIDTH)
      expect(clampStrokeWidth(5)).toBe(5)
      expect(clampStrokeWidth(999)).toBe(MAX_STROKE_WIDTH)
    })

    it('clampShadowBlur should clamp between MIN and MAX', () => {
      expect(clampShadowBlur(-10)).toBe(MIN_SHADOW_BLUR)
      expect(clampShadowBlur(20)).toBe(20)
      expect(clampShadowBlur(999)).toBe(MAX_SHADOW_BLUR)
    })

    it('clampShadowOffset should clamp between MIN and MAX', () => {
      expect(clampShadowOffset(-999)).toBe(MIN_SHADOW_OFFSET)
      expect(clampShadowOffset(10)).toBe(10)
      expect(clampShadowOffset(999)).toBe(MAX_SHADOW_OFFSET)
    })

    it('clampBgOpacity should clamp between 0 and 1', () => {
      expect(clampBgOpacity(-0.5)).toBe(MIN_BG_OPACITY)
      expect(clampBgOpacity(0.5)).toBe(0.5)
      expect(clampBgOpacity(2)).toBe(MAX_BG_OPACITY)
    })
  })

  describe('pushHistory', () => {
    it('should add snapshot to history', () => {
      const state = createInitialState()
      const result = pushHistory([], -1, state)
      expect(result.history).toHaveLength(1)
      expect(result.historyIndex).toBe(0)
    })

    it('should trim history when exceeding MAX_HISTORY', () => {
      const state = createInitialState()
      let history = [JSON.parse(JSON.stringify(state))]
      let historyIndex = 0
      for (let i = 0; i < MAX_HISTORY + 5; i++) {
        const newState = updateLayer(state, 'bg', { color: `#${i.toString(16).padStart(6, '0')}` })
        const result = pushHistory(history, historyIndex, newState)
        history = result.history
        historyIndex = result.historyIndex
      }
      expect(history.length).toBeLessThanOrEqual(MAX_HISTORY)
    })

    it('should truncate future history when pushing new state', () => {
      const state = createInitialState()
      const result1 = pushHistory([], -1, state)
      const result2 = pushHistory(result1.history, result1.historyIndex, updateLayer(state, 'bg', { color: '#aaa' }))
      const undoResult = undo(result2.history, result2.historyIndex)
      const afterUndo = pushHistory(result2.history, undoResult.historyIndex, updateLayer(state, 'bg', { color: '#bbb' }))
      expect(afterUndo.history.length).toBe(2)
    })
  })

  describe('canUndo / canRedo', () => {
    it('canUndo should return false at index 0', () => {
      expect(canUndo(0)).toBe(false)
    })

    it('canUndo should return true for index > 0', () => {
      expect(canUndo(1)).toBe(true)
    })

    it('canRedo should return false at last index', () => {
      expect(canRedo([{}], 0)).toBe(false)
    })

    it('canRedo should return true when there are future states', () => {
      expect(canRedo([{}, {}], 0)).toBe(true)
    })
  })

  describe('undo / redo', () => {
    it('undo should return previous state', () => {
      const state1 = createInitialState()
      const state2 = updateLayer(state1, 'bg', { color: '#ff0000' })
      const history = [state1, state2]
      const result = undo(history, 1)
      expect(result.state.layers[0].color).toBe(DEFAULT_BG_COLOR)
      expect(result.historyIndex).toBe(0)
    })

    it('redo should return next state', () => {
      const state1 = createInitialState()
      const state2 = updateLayer(state1, 'bg', { color: '#ff0000' })
      const history = [state1, state2]
      const result = redo(history, 0)
      expect(result.state.layers[0].color).toBe('#ff0000')
      expect(result.historyIndex).toBe(1)
    })

    it('undo at index 0 should return same index', () => {
      const result = undo([{}], 0)
      expect(result.historyIndex).toBe(0)
    })

    it('redo at last index should return same index', () => {
      const result = redo([{}], 0)
      expect(result.historyIndex).toBe(0)
    })
  })

  describe('hitTestTextLayer', () => {
    const createMockCtx = () => {
      let lastFont = ''
      return {
        save: () => {},
        restore: () => {},
        measureText: (text) => ({
          width: text.length * 20,
        }),
        get font() { return lastFont },
        set font(v) { lastFont = v },
      }
    }

    it('should return true when point is inside text bounds', () => {
      const ctx = createMockCtx()
      const layer = createTextLayer({ text: 'Hello', x: 100, y: 100, fontSize: 40 })
      expect(hitTestTextLayer(layer, 120, 90, ctx)).toBe(true)
    })

    it('should return false when point is outside text bounds', () => {
      const ctx = createMockCtx()
      const layer = createTextLayer({ text: 'Hello', x: 100, y: 100, fontSize: 40 })
      expect(hitTestTextLayer(layer, 50, 50, ctx)).toBe(false)
    })

    it('should return false for non-text layer', () => {
      const ctx = createMockCtx()
      const bg = createBackgroundLayer()
      expect(hitTestTextLayer(bg, 100, 100, ctx)).toBe(false)
    })
  })

  describe('getSelectedLayer', () => {
    it('should return null when no layer selected', () => {
      const state = createInitialState()
      expect(getSelectedLayer(state)).toBeNull()
    })

    it('should return selected layer', () => {
      const state = createInitialState()
      const layer = createTextLayer({ text: 'selected' })
      const s = addLayer(state, layer)
      const result = getSelectedLayer(s)
      expect(result.id).toBe(layer.id)
    })

    it('should return null if selected layer id does not exist', () => {
      const state = createInitialState()
      const s = selectLayer(state, 'nonexistent')
      expect(getSelectedLayer(s)).toBeNull()
    })
  })

  describe('integration: add and remove layers', () => {
    it('should add multiple text layers and remove them', () => {
      let state = createInitialState()
      const layer1 = createTextLayer({ text: 'Layer 1' })
      const layer2 = createTextLayer({ text: 'Layer 2' })
      state = addLayer(state, layer1)
      state = addLayer(state, layer2)
      expect(state.layers).toHaveLength(3)
      expect(state.selectedLayerId).toBe(layer2.id)

      state = removeLayer(state, layer1.id)
      expect(state.layers).toHaveLength(2)
      expect(state.selectedLayerId).toBe(layer2.id)

      state = removeLayer(state, layer2.id)
      expect(state.layers).toHaveLength(1)
      expect(state.selectedLayerId).toBeNull()
    })
  })

  describe('integration: undo/redo workflow', () => {
    it('should undo and redo layer addition', () => {
      const initial = createInitialState()
      let history = [JSON.parse(JSON.stringify(initial))]
      let historyIndex = 0

      const layer = createTextLayer({ text: 'Test' })
      const afterAdd = addLayer(initial, layer)
      const h1 = pushHistory(history, historyIndex, afterAdd)
      history = h1.history
      historyIndex = h1.historyIndex

      const undoResult = undo(history, historyIndex)
      expect(undoResult.state.layers).toHaveLength(1)
      expect(undoResult.historyIndex).toBe(0)

      const redoResult = redo(history, 0)
      expect(redoResult.state.layers).toHaveLength(2)
      expect(redoResult.historyIndex).toBe(1)
    })

    it('should undo and redo property change', () => {
      const initial = createInitialState()
      let history = [JSON.parse(JSON.stringify(initial))]
      let historyIndex = 0

      const changed = updateLayer(initial, 'bg', { color: '#ff0000' })
      const h1 = pushHistory(history, historyIndex, changed)
      history = h1.history
      historyIndex = h1.historyIndex

      const undoResult = undo(history, historyIndex)
      expect(undoResult.state.layers[0].color).toBe(DEFAULT_BG_COLOR)

      const redoResult = redo(history, undoResult.historyIndex)
      expect(redoResult.state.layers[0].color).toBe('#ff0000')
    })
  })

  describe('serializeState', () => {
    it('should strip image object from background layer', () => {
      const state = createInitialState()
      const fakeImage = { nodeName: 'IMG', naturalWidth: 100, naturalHeight: 100 }
      const withImage = updateLayer(state, 'bg', {
        image: fakeImage,
        imageSrc: 'data:image/png;base64,FAKE',
      })
      const serialized = serializeState(withImage)
      expect(serialized.layers[0].image).toBeNull()
      expect(serialized.layers[0].imageSrc).toBe('data:image/png;base64,FAKE')
    })

    it('should preserve text layers unchanged', () => {
      const state = createInitialState()
      const layer = createTextLayer({ text: 'Test' })
      const withText = addLayer(state, layer)
      const serialized = serializeState(withText)
      expect(serialized.layers).toHaveLength(2)
      expect(serialized.layers[1].text).toBe('Test')
      expect(serialized.layers[1].id).toBe(layer.id)
    })

    it('should allow JSON round-trip without errors', () => {
      const state = createInitialState()
      const fakeImage = { nodeName: 'IMG' }
      const withImage = updateLayer(state, 'bg', {
        image: fakeImage,
        imageSrc: 'data:image/png;base64,XX',
        imageOpacity: 0.5,
      })
      const serialized = serializeState(withImage)
      const roundTrip = JSON.parse(JSON.stringify(serialized))
      expect(roundTrip.layers[0].image).toBeNull()
      expect(roundTrip.layers[0].imageSrc).toBe('data:image/png;base64,XX')
      expect(roundTrip.layers[0].imageOpacity).toBe(0.5)
    })
  })

  describe('isValidColor', () => {
    it('should accept 3-digit HEX colors', () => {
      expect(isValidColor('#fff')).toBe(true)
      expect(isValidColor('#F00')).toBe(true)
      expect(isValidColor('#a1b')).toBe(true)
    })

    it('should accept 6-digit HEX colors', () => {
      expect(isValidColor('#ffffff')).toBe(true)
      expect(isValidColor('#FF0000')).toBe(true)
      expect(isValidColor('#1a2b3c')).toBe(true)
    })

    it('should accept 4-digit HEX (with alpha)', () => {
      expect(isValidColor('#ffff')).toBe(true)
      expect(isValidColor('#F00F')).toBe(true)
    })

    it('should accept 8-digit HEX (with alpha)', () => {
      expect(isValidColor('#ffffffff')).toBe(true)
      expect(isValidColor('#FF000080')).toBe(true)
    })

    it('should accept rgb() format', () => {
      expect(isValidColor('rgb(255, 0, 0)')).toBe(true)
      expect(isValidColor('rgb(0, 128, 255)')).toBe(true)
      expect(isValidColor('RGB(255,255,255)')).toBe(true)
    })

    it('should accept rgba() format with valid alpha', () => {
      expect(isValidColor('rgba(255, 0, 0, 0.5)')).toBe(true)
      expect(isValidColor('rgba(0, 0, 0, 1)')).toBe(true)
      expect(isValidColor('rgba(0, 0, 0, 0)')).toBe(true)
      expect(isValidColor('rgba(0, 0, 0, 1.0)')).toBe(true)
    })

    it('should accept hsl() format', () => {
      expect(isValidColor('hsl(120, 50%, 50%)')).toBe(true)
      expect(isValidColor('hsl(360, 100%, 0%)')).toBe(true)
    })

    it('should accept hsla() format', () => {
      expect(isValidColor('hsla(120, 50%, 50%, 0.5)')).toBe(true)
      expect(isValidColor('hsla(0, 100%, 100%, 1)')).toBe(true)
    })

    it('should reject invalid HEX formats', () => {
      expect(isValidColor('#ggg')).toBe(false)
      expect(isValidColor('#gggggg')).toBe(false)
      expect(isValidColor('red')).toBe(false)
      expect(isValidColor('#12')).toBe(false)
      expect(isValidColor('#12345')).toBe(false)
      expect(isValidColor('#1234567')).toBe(false)
      expect(isValidColor('#gggg')).toBe(false)
      expect(isValidColor('#gggggggg')).toBe(false)
    })

    it('should reject out-of-range rgb values', () => {
      expect(isValidColor('rgb(256, 0, 0)')).toBe(false)
      expect(isValidColor('rgb(0, 300, 0)')).toBe(false)
      expect(isValidColor('rgb(0, 0, -1)')).toBe(false)
    })

    it('should reject out-of-range hsl values', () => {
      expect(isValidColor('hsl(361, 50%, 50%)')).toBe(false)
      expect(isValidColor('hsl(120, 101%, 50%)')).toBe(false)
      expect(isValidColor('hsl(120, 50%, 101%)')).toBe(false)
    })

    it('should reject empty/null/non-string values', () => {
      expect(isValidColor('')).toBe(false)
      expect(isValidColor(null)).toBe(false)
      expect(isValidColor(undefined)).toBe(false)
      expect(isValidColor(123)).toBe(false)
      expect(isValidColor({})).toBe(false)
      expect(isValidColor('   ')).toBe(false)
    })

    it('should reject malformed formats', () => {
      expect(isValidColor('abc')).toBe(false)
      expect(isValidColor('rgb(0,0,0')).toBe(false)
      expect(isValidColor('hsl(abc)')).toBe(false)
      expect(isValidColor('blurple')).toBe(false)
    })
  })

  describe('sanitizeColor', () => {
    it('should return color if valid', () => {
      expect(sanitizeColor('#ff0000', '#000000')).toBe('#ff0000')
    })

    it('should return fallback if invalid', () => {
      expect(sanitizeColor('blurple', '#ffffff')).toBe('#ffffff')
      expect(sanitizeColor('', '#111111')).toBe('#111111')
    })
  })

  describe('integration: pushHistory with background image', () => {
    it('should store imageSrc and strip image object in snapshot', () => {
      const initial = createInitialState()
      const fakeImage = { nodeName: 'IMG', naturalWidth: 800, naturalHeight: 600 }
      const withImage = updateLayer(initial, 'bg', {
        image: fakeImage,
        imageSrc: 'data:image/png;base64,HELLO',
      })
      const result = pushHistory([], -1, withImage)
      const snapshot = result.history[0]
      expect(snapshot.layers[0].image).toBeNull()
      expect(snapshot.layers[0].imageSrc).toBe('data:image/png;base64,HELLO')
      expect(typeof snapshot).toBe('object')
      expect(() => JSON.stringify(snapshot)).not.toThrow()
    })
  })

  describe('regression: background color change must not clear image', () => {
    it('updateLayer color on bg should preserve image and imageSrc', () => {
      const initial = createInitialState()
      const fakeImage = { nodeName: 'IMG', naturalWidth: 800, naturalHeight: 600 }
      const withImage = updateLayer(initial, 'bg', {
        image: fakeImage,
        imageSrc: 'data:image/png;base64,ABC',
        imageOpacity: 0.7,
      })
      const colorChanged = updateLayer(withImage, 'bg', { color: '#00ff00' })
      const bg = colorChanged.layers[0]
      expect(bg.color).toBe('#00ff00')
      expect(bg.image).toBe(fakeImage)
      expect(bg.imageSrc).toBe('data:image/png;base64,ABC')
      expect(bg.imageOpacity).toBe(0.7)
    })

    it('updateLayer color on bg should preserve image even after multiple color changes', () => {
      const initial = createInitialState()
      const fakeImage = { nodeName: 'IMG', naturalWidth: 100, naturalHeight: 100 }
      const withImage = updateLayer(initial, 'bg', {
        image: fakeImage,
        imageSrc: 'data:image/png;base64,XYZ',
      })
      let state = withImage
      for (const color of ['#ff0000', '#00ff00', '#0000ff', '#4a90d9']) {
        state = updateLayer(state, 'bg', { color })
      }
      const bg = state.layers[0]
      expect(bg.color).toBe('#4a90d9')
      expect(bg.image).toBe(fakeImage)
      expect(bg.imageSrc).toBe('data:image/png;base64,XYZ')
    })

    it('updateLayer should only modify specified properties, never touch unrelated fields', () => {
      const initial = createInitialState()
      const fakeImage = { nodeName: 'IMG', naturalWidth: 200, naturalHeight: 200 }
      const withImage = updateLayer(initial, 'bg', {
        image: fakeImage,
        imageSrc: 'data:image/png;base64,MULTI',
        imageOpacity: 0.4,
        color: '#111111',
      })
      const opacityChanged = updateLayer(withImage, 'bg', { imageOpacity: 0.8 })
      const bg = opacityChanged.layers[0]
      expect(bg.image).toBe(fakeImage)
      expect(bg.imageSrc).toBe('data:image/png;base64,MULTI')
      expect(bg.color).toBe('#111111')
      expect(bg.imageOpacity).toBe(0.8)
    })
  })

  describe('drawPoster: fill-then-overlay rendering', () => {
    function createMockCtx() {
      const calls = []
      return {
        calls,
        clearRect(...args) { calls.push({ fn: 'clearRect', args }) },
        fillRect(...args) { calls.push({ fn: 'fillRect', args }) },
        drawImage(...args) { calls.push({ fn: 'drawImage', args }) },
        save() { calls.push({ fn: 'save' }) },
        restore() { calls.push({ fn: 'restore' }) },
        strokeText(...args) { calls.push({ fn: 'strokeText', args }) },
        fillText(...args) { calls.push({ fn: 'fillText', args }) },
        set fillStyle(v) { calls.push({ fn: 'fillStyle', value: v }) },
        set strokeStyle(v) { calls.push({ fn: 'strokeStyle', value: v }) },
        set globalAlpha(v) { calls.push({ fn: 'globalAlpha', value: v }) },
        set lineWidth(v) { calls.push({ fn: 'lineWidth', value: v }) },
        set lineJoin(v) { calls.push({ fn: 'lineJoin', value: v }) },
        set font(v) { calls.push({ fn: 'font', value: v }) },
        set textBaseline(v) { calls.push({ fn: 'textBaseline', value: v }) },
        set shadowColor(v) { calls.push({ fn: 'shadowColor', value: v }) },
        set shadowBlur(v) { calls.push({ fn: 'shadowBlur', value: v }) },
        set shadowOffsetX(v) { calls.push({ fn: 'shadowOffsetX', value: v }) },
        set shadowOffsetY(v) { calls.push({ fn: 'shadowOffsetY', value: v }) },
        setTransform(...args) { calls.push({ fn: 'setTransform', args }) },
      }
    }

    it('should draw color fill first, then overlay image on top', () => {
      const ctx = createMockCtx()
      const fakeImage = { nodeName: 'IMG', naturalWidth: 100, naturalHeight: 100 }
      const state = createInitialState()
      const withImage = updateLayer(state, 'bg', {
        color: '#336699',
        image: fakeImage,
        imageSrc: 'data:image/png;base64,TEST',
        imageOpacity: 0.6,
      })
      drawPoster(ctx, withImage, 800, 600)
      const fillRectCalls = ctx.calls.filter((c) => c.fn === 'fillRect')
      const drawImageCalls = ctx.calls.filter((c) => c.fn === 'drawImage')
      expect(fillRectCalls.length).toBeGreaterThanOrEqual(1)
      expect(drawImageCalls.length).toBe(1)
      const fillRectIndex = ctx.calls.findIndex((c) => c.fn === 'fillRect')
      const drawImageIndex = ctx.calls.findIndex((c) => c.fn === 'drawImage')
      expect(fillRectIndex).toBeLessThan(drawImageIndex)
      expect(drawImageCalls[0].args[0]).toBe(fakeImage)
      expect(drawImageCalls[0].args[1]).toBe(0)
      expect(drawImageCalls[0].args[2]).toBe(0)
      expect(drawImageCalls[0].args[3]).toBe(800)
      expect(drawImageCalls[0].args[4]).toBe(600)
    })

    it('should draw color fill even when no image is present', () => {
      const ctx = createMockCtx()
      const state = createInitialState()
      const withColor = updateLayer(state, 'bg', { color: '#ff5500' })
      drawPoster(ctx, withColor, 800, 600)
      const fillRectCalls = ctx.calls.filter((c) => c.fn === 'fillRect')
      const drawImageCalls = ctx.calls.filter((c) => c.fn === 'drawImage')
      expect(fillRectCalls.length).toBeGreaterThanOrEqual(1)
      expect(drawImageCalls.length).toBe(0)
      const fillStyleCall = ctx.calls.find((c) => c.fn === 'fillStyle' && c.value === '#ff5500')
      expect(fillStyleCall).toBeDefined()
    })

    it('should apply imageOpacity to globalAlpha when drawing image', () => {
      const ctx = createMockCtx()
      const fakeImage = { nodeName: 'IMG', naturalWidth: 100, naturalHeight: 100 }
      const state = createInitialState()
      const withImage = updateLayer(state, 'bg', {
        image: fakeImage,
        imageSrc: 'data:image/png;base64,OPA',
        imageOpacity: 0.35,
      })
      drawPoster(ctx, withImage, 800, 600)
      const alphaCall = ctx.calls.find((c) => c.fn === 'globalAlpha' && c.value === 0.35)
      expect(alphaCall).toBeDefined()
    })

    it('should fallback to color fill if drawImage throws', () => {
      const ctx = createMockCtx()
      const badImage = { nodeName: 'IMG', naturalWidth: 100, naturalHeight: 100 }
      const state = createInitialState()
      const withBadImage = updateLayer(state, 'bg', {
        color: '#aabbcc',
        image: badImage,
        imageSrc: 'data:image/png;base64,BAD',
      })
      const origDrawImage = ctx.drawImage
      ctx.drawImage = function () { throw new Error('broken image') }
      expect(() => drawPoster(ctx, withBadImage, 800, 600)).not.toThrow()
      ctx.drawImage = origDrawImage
      const fillRectCalls = ctx.calls.filter((c) => c.fn === 'fillRect')
      expect(fillRectCalls.length).toBeGreaterThanOrEqual(1)
    })

    it('should render text layers on top of background color and image', () => {
      const ctx = createMockCtx()
      const fakeImage = { nodeName: 'IMG', naturalWidth: 100, naturalHeight: 100 }
      const state = createInitialState()
      const withImage = updateLayer(state, 'bg', {
        image: fakeImage,
        imageSrc: 'data:image/png;base64,TXT',
      })
      const withText = addLayer(withImage, createTextLayer({ text: 'Hello', x: 50, y: 100 }))
      drawPoster(ctx, withText, 800, 600)
      const fillTextCalls = ctx.calls.filter((c) => c.fn === 'fillText')
      expect(fillTextCalls.length).toBe(1)
      expect(fillTextCalls[0].args[0]).toBe('Hello')
      const drawImageIndex = ctx.calls.findIndex((c) => c.fn === 'drawImage')
      const fillTextIndex = ctx.calls.findIndex((c) => c.fn === 'fillText')
      expect(drawImageIndex).toBeLessThan(fillTextIndex)
    })
  })
})
