import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateId,
  createSlide,
  createInitialSlides,
  createTextElement,
  createImageElement,
  createShapeElement,
  addSlide,
  deleteSlide,
  duplicateSlide,
  reorderSlides,
  addElement,
  deleteElement,
  updateElement,
  updateSlide,
  getSlideById,
  getElementById,
  clampNumber,
  clampElementSize,
  clampFontSize,
  isValidColor,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  exportToJson,
  validateElement,
  validateSlide,
  validateSlides,
  importFromJson,
  isPointInElement,
  findElementAtPoint,
  calculateScaledCanvasSize,
  screenToCanvas,
  constrainToCanvas,
  getNextSlideIndex,
  canGoToPrevSlide,
  canGoToNextSlide,
  cloneElement,
} from '../../slides-editor/slidesEditorCore.js'
import {
  ELEMENT_TYPES,
  SHAPE_TYPES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_COLORS,
  DEFAULT_FONT_SIZE,
  DEFAULT_BORDER_WIDTH,
  MIN_ELEMENT_SIZE,
  MAX_ELEMENT_SIZE,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
} from '../../slides-editor/constants.js'

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

  it('should use custom prefix', () => {
    const id = generateId('custom')
    expect(id.startsWith('custom_')).toBe(true)
  })
})

describe('createSlide', () => {
  it('should create a slide with correct structure', () => {
    const slide = createSlide()
    expect(typeof slide.id).toBe('string')
    expect(Array.isArray(slide.elements)).toBe(true)
    expect(slide.elements).toHaveLength(0)
    expect(slide.backgroundColor).toBe(DEFAULT_COLORS.BACKGROUND)
  })

  it('should create unique slides', () => {
    const slide1 = createSlide()
    const slide2 = createSlide()
    expect(slide1.id).not.toBe(slide2.id)
  })
})

describe('createInitialSlides', () => {
  it('should create an array with one slide', () => {
    const slides = createInitialSlides()
    expect(Array.isArray(slides)).toBe(true)
    expect(slides).toHaveLength(1)
  })
})

describe('createTextElement', () => {
  it('should create a text element with defaults', () => {
    const el = createTextElement(100, 200)
    expect(el.id).toBeDefined()
    expect(el.type).toBe(ELEMENT_TYPES.TEXT)
    expect(el.x).toBe(100)
    expect(el.y).toBe(200)
    expect(el.width).toBe(200)
    expect(el.height).toBe(40)
    expect(el.content).toBe('双击编辑文本')
    expect(el.fontSize).toBe(DEFAULT_FONT_SIZE)
    expect(el.color).toBe(DEFAULT_COLORS.TEXT)
    expect(el.bold).toBe(false)
    expect(el.italic).toBe(false)
  })

  it('should create a text element with custom text', () => {
    const el = createTextElement(0, 0, 'Hello World')
    expect(el.content).toBe('Hello World')
  })
})

describe('createImageElement', () => {
  it('should create an image element', () => {
    const el = createImageElement(50, 50, 'data:image/png;base64,abc')
    expect(el.id).toBeDefined()
    expect(el.type).toBe(ELEMENT_TYPES.IMAGE)
    expect(el.x).toBe(50)
    expect(el.y).toBe(50)
    expect(el.src).toBe('data:image/png;base64,abc')
    expect(el.width).toBe(200)
    expect(el.height).toBe(150)
  })

  it('should create an image element with custom size', () => {
    const el = createImageElement(0, 0, 'test.jpg', 300, 200)
    expect(el.width).toBe(300)
    expect(el.height).toBe(200)
  })
})

describe('createShapeElement', () => {
  it('should create a rectangle shape', () => {
    const el = createShapeElement(SHAPE_TYPES.RECTANGLE, 10, 20)
    expect(el.type).toBe(ELEMENT_TYPES.SHAPE)
    expect(el.shapeType).toBe(SHAPE_TYPES.RECTANGLE)
    expect(el.x).toBe(10)
    expect(el.y).toBe(20)
    expect(el.width).toBe(120)
    expect(el.height).toBe(100)
    expect(el.fillColor).toBe(DEFAULT_COLORS.FILL)
    expect(el.borderColor).toBe(DEFAULT_COLORS.BORDER)
    expect(el.borderWidth).toBe(DEFAULT_BORDER_WIDTH)
  })

  it('should create a circle shape', () => {
    const el = createShapeElement(SHAPE_TYPES.CIRCLE, 0, 0)
    expect(el.shapeType).toBe(SHAPE_TYPES.CIRCLE)
  })

  it('should create a triangle shape', () => {
    const el = createShapeElement(SHAPE_TYPES.TRIANGLE, 0, 0)
    expect(el.shapeType).toBe(SHAPE_TYPES.TRIANGLE)
  })
})

describe('addSlide', () => {
  it('should add a new slide to the end', () => {
    const slides = [createSlide()]
    const result = addSlide(slides)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(slides[0].id)
  })

  it('should not mutate the original array', () => {
    const slides = [createSlide()]
    const result = addSlide(slides)
    expect(slides).toHaveLength(1)
    expect(result).toHaveLength(2)
  })

  it('should handle non-array input', () => {
    const result = addSlide(null)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
  })
})

describe('deleteSlide', () => {
  it('should delete a slide by id', () => {
    const slide1 = createSlide()
    const slide2 = createSlide()
    const slides = [slide1, slide2]
    const result = deleteSlide(slides, slide1.id)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(slide2.id)
  })

  it('should not delete the last remaining slide', () => {
    const slide = createSlide()
    const slides = [slide]
    const result = deleteSlide(slides, slide.id)
    expect(result).toHaveLength(1)
  })

  it('should handle non-existent id', () => {
    const slide = createSlide()
    const slides = [slide, createSlide()]
    const result = deleteSlide(slides, 'non-existent')
    expect(result).toHaveLength(2)
  })

  it('should not mutate the original array', () => {
    const slides = [createSlide(), createSlide()]
    deleteSlide(slides, slides[0].id)
    expect(slides).toHaveLength(2)
  })
})

describe('duplicateSlide', () => {
  it('should duplicate a slide with new IDs', () => {
    const slide = createSlide()
    const textEl = createTextElement(10, 10, 'test')
    slide.elements = [textEl]
    const slides = [slide]
    const result = duplicateSlide(slides, slide.id)

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(slide.id)
    expect(result[1].id).not.toBe(slide.id)
    expect(result[1].elements).toHaveLength(1)
    expect(result[1].elements[0].id).not.toBe(textEl.id)
    expect(result[1].elements[0].content).toBe('test')
  })

  it('should insert duplicated slide after the original', () => {
    const slide1 = createSlide()
    const slide2 = createSlide()
    const slides = [slide1, slide2]
    const result = duplicateSlide(slides, slide1.id)
    expect(result).toHaveLength(3)
    expect(result[0].id).toBe(slide1.id)
    expect(result[1].id).not.toBe(slide1.id)
    expect(result[2].id).toBe(slide2.id)
  })

  it('should handle non-existent id', () => {
    const slides = [createSlide()]
    const result = duplicateSlide(slides, 'non-existent')
    expect(result).toHaveLength(1)
  })
})

describe('reorderSlides', () => {
  it('should reorder slides', () => {
    const slide1 = createSlide()
    const slide2 = createSlide()
    const slide3 = createSlide()
    const slides = [slide1, slide2, slide3]
    const result = reorderSlides(slides, 0, 2)
    expect(result[0].id).toBe(slide2.id)
    expect(result[1].id).toBe(slide3.id)
    expect(result[2].id).toBe(slide1.id)
  })

  it('should return same array for same index', () => {
    const slides = [createSlide(), createSlide()]
    const result = reorderSlides(slides, 0, 0)
    expect(result).toEqual(slides)
  })

  it('should handle invalid indices', () => {
    const slides = [createSlide(), createSlide()]
    expect(reorderSlides(slides, -1, 0)).toBe(slides)
    expect(reorderSlides(slides, 0, 10)).toBe(slides)
    expect(reorderSlides(slides, 10, 0)).toBe(slides)
  })

  it('should not mutate the original array', () => {
    const slides = [createSlide(), createSlide()]
    const original = [...slides]
    reorderSlides(slides, 0, 1)
    expect(slides[0].id).toBe(original[0].id)
  })
})

describe('addElement', () => {
  it('should add element to the correct slide', () => {
    const slide1 = createSlide()
    const slide2 = createSlide()
    const slides = [slide1, slide2]
    const element = createTextElement(0, 0)
    const result = addElement(slides, slide1.id, element)

    expect(result[0].elements).toHaveLength(1)
    expect(result[1].elements).toHaveLength(0)
    expect(result[0].elements[0].id).toBe(element.id)
  })

  it('should not mutate the original slides', () => {
    const slide = createSlide()
    const slides = [slide]
    addElement(slides, slide.id, createTextElement(0, 0))
    expect(slide.elements).toHaveLength(0)
  })
})

describe('deleteElement', () => {
  it('should delete element from the correct slide', () => {
    const el1 = createTextElement(0, 0)
    const el2 = createTextElement(10, 10)
    const slide = createSlide()
    slide.elements = [el1, el2]
    const slides = [slide]
    const result = deleteElement(slides, slide.id, el1.id)

    expect(result[0].elements).toHaveLength(1)
    expect(result[0].elements[0].id).toBe(el2.id)
  })

  it('should handle non-existent element', () => {
    const slide = createSlide()
    slide.elements = [createTextElement(0, 0)]
    const slides = [slide]
    const result = deleteElement(slides, slide.id, 'non-existent')
    expect(result[0].elements).toHaveLength(1)
  })
})

describe('updateElement', () => {
  it('should update element properties', () => {
    const el = createTextElement(0, 0)
    const slide = createSlide()
    slide.elements = [el]
    const slides = [slide]
    const result = updateElement(slides, slide.id, el.id, { x: 100, y: 200, content: 'updated' })

    expect(result[0].elements[0].x).toBe(100)
    expect(result[0].elements[0].y).toBe(200)
    expect(result[0].elements[0].content).toBe('updated')
  })

  it('should not affect other elements', () => {
    const el1 = createTextElement(0, 0, 'el1')
    const el2 = createTextElement(10, 10, 'el2')
    const slide = createSlide()
    slide.elements = [el1, el2]
    const slides = [slide]
    const result = updateElement(slides, slide.id, el1.id, { content: 'updated' })

    expect(result[0].elements[0].content).toBe('updated')
    expect(result[0].elements[1].content).toBe('el2')
  })

  it('should not mutate the original', () => {
    const el = createTextElement(0, 0, 'original')
    const slide = createSlide()
    slide.elements = [el]
    const slides = [slide]
    updateElement(slides, slide.id, el.id, { content: 'changed' })
    expect(slide.elements[0].content).toBe('original')
  })
})

describe('updateSlide', () => {
  it('should update slide properties', () => {
    const slide = createSlide()
    const slides = [slide]
    const result = updateSlide(slides, slide.id, { backgroundColor: '#ff0000' })
    expect(result[0].backgroundColor).toBe('#ff0000')
  })
})

describe('getSlideById', () => {
  it('should find slide by id', () => {
    const slide1 = createSlide()
    const slide2 = createSlide()
    const slides = [slide1, slide2]
    expect(getSlideById(slides, slide1.id)).toBe(slide1)
    expect(getSlideById(slides, slide2.id)).toBe(slide2)
  })

  it('should return null for non-existent id', () => {
    const slides = [createSlide()]
    expect(getSlideById(slides, 'non-existent')).toBeNull()
    expect(getSlideById(null, 'test')).toBeNull()
  })
})

describe('getElementById', () => {
  it('should find element by id', () => {
    const el = createTextElement(0, 0)
    const slide = createSlide()
    slide.elements = [el]
    expect(getElementById(slide, el.id)).toBe(el)
  })

  it('should return null for non-existent id', () => {
    const slide = createSlide()
    expect(getElementById(slide, 'non-existent')).toBeNull()
    expect(getElementById(null, 'test')).toBeNull()
  })
})

describe('clampNumber', () => {
  it('should clamp value to min', () => {
    expect(clampNumber(-10, 0, 100)).toBe(0)
  })

  it('should clamp value to max', () => {
    expect(clampNumber(200, 0, 100)).toBe(100)
  })

  it('should return value within range', () => {
    expect(clampNumber(50, 0, 100)).toBe(50)
  })
})

describe('clampElementSize', () => {
  it('should clamp width and height to min', () => {
    const result = clampElementSize(1, 1)
    expect(result.width).toBe(MIN_ELEMENT_SIZE)
    expect(result.height).toBe(MIN_ELEMENT_SIZE)
  })

  it('should clamp width and height to max', () => {
    const result = clampElementSize(99999, 99999)
    expect(result.width).toBe(MAX_ELEMENT_SIZE)
    expect(result.height).toBe(MAX_ELEMENT_SIZE)
  })

  it('should return values within range', () => {
    const result = clampElementSize(100, 200)
    expect(result.width).toBe(100)
    expect(result.height).toBe(200)
  })
})

describe('clampFontSize', () => {
  it('should clamp font size to min', () => {
    expect(clampFontSize(1)).toBe(MIN_FONT_SIZE)
  })

  it('should clamp font size to max', () => {
    expect(clampFontSize(1000)).toBe(MAX_FONT_SIZE)
  })

  it('should return font size within range', () => {
    expect(clampFontSize(24)).toBe(24)
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
  })

  it('should accept rgb colors', () => {
    expect(isValidColor('rgb(255, 0, 0)')).toBe(true)
  })

  it('should accept rgba colors', () => {
    expect(isValidColor('rgba(255, 0, 0, 0.5)')).toBe(true)
  })

  it('should reject invalid colors', () => {
    expect(isValidColor('red')).toBe(false)
    expect(isValidColor('#ggg')).toBe(false)
    expect(isValidColor(123)).toBe(false)
    expect(isValidColor(null)).toBe(false)
    expect(isValidColor(undefined)).toBe(false)
  })
})

describe('localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    mockStorage.clear()
  })

  it('loadFromStorage should return initial state for empty storage', () => {
    const result = loadFromStorage(mockStorage)
    expect(Array.isArray(result.slides)).toBe(true)
    expect(result.slides).toHaveLength(1)
  })

  it('saveToStorage should persist data', () => {
    const slides = [createSlide()]
    const saved = saveToStorage({ slides }, mockStorage)
    expect(saved).toBe(true)
    const loaded = loadFromStorage(mockStorage)
    expect(loaded.slides).toHaveLength(1)
    expect(loaded.slides[0].id).toBe(slides[0].id)
  })

  it('loadFromStorage should handle invalid JSON', () => {
    mockStorage.setItem('slides-editor-state', 'invalid')
    const result = loadFromStorage(mockStorage)
    expect(Array.isArray(result.slides)).toBe(true)
  })

  it('loadFromStorage should handle non-array slides', () => {
    mockStorage.setItem('slides-editor-state', JSON.stringify({ slides: 'not array' }))
    const result = loadFromStorage(mockStorage)
    expect(Array.isArray(result.slides)).toBe(true)
  })

  it('clearStorage should remove data', () => {
    saveToStorage({ slides: [createSlide()] }, mockStorage)
    const cleared = clearStorage(mockStorage)
    expect(cleared).toBe(true)
    const loaded = loadFromStorage(mockStorage)
    expect(loaded.slides).toHaveLength(1)
  })

  it('should handle storage being unavailable', () => {
    expect(loadFromStorage(null).slides).toHaveLength(1)
    expect(saveToStorage({ slides: [] }, null)).toBe(false)
    expect(clearStorage(null)).toBe(false)
  })

  it('should handle storage errors gracefully', () => {
    const badStorage = {
      getItem: () => { throw new Error('fail') },
      setItem: () => { throw new Error('fail') },
      removeItem: () => { throw new Error('fail') },
    }
    expect(loadFromStorage(badStorage).slides).toHaveLength(1)
    expect(saveToStorage({ slides: [] }, badStorage)).toBe(false)
    expect(clearStorage(badStorage)).toBe(false)
  })
})

describe('exportToJson', () => {
  it('should export with version and timestamp', () => {
    const slides = [createSlide()]
    const result = exportToJson(slides)
    expect(result.version).toBe('1.0')
    expect(result.slides).toBe(slides)
    expect(typeof result.exportedAt).toBe('string')
    expect(new Date(result.exportedAt).toString()).not.toBe('Invalid Date')
  })
})

describe('validateElement', () => {
  it('should validate text elements', () => {
    const valid = createTextElement(0, 0, 'test')
    expect(validateElement(valid)).toBe(true)
  })

  it('should validate image elements', () => {
    const valid = createImageElement(0, 0, 'test.jpg')
    expect(validateElement(valid)).toBe(true)
  })

  it('should validate shape elements', () => {
    const valid = createShapeElement(SHAPE_TYPES.RECTANGLE, 0, 0)
    expect(validateElement(valid)).toBe(true)
  })

  it('should reject null/undefined', () => {
    expect(validateElement(null)).toBe(false)
    expect(validateElement(undefined)).toBe(false)
  })

  it('should reject invalid types', () => {
    expect(validateElement({ id: 'x', type: 'unknown', x: 0, y: 0, width: 10, height: 10 })).toBe(false)
  })

  it('should reject text with wrong types', () => {
    const invalid = { ...createTextElement(0, 0), content: 123 }
    expect(validateElement(invalid)).toBe(false)
  })

  it('should reject shapes with invalid shapeType', () => {
    const invalid = { ...createShapeElement(SHAPE_TYPES.RECTANGLE, 0, 0), shapeType: 'invalid' }
    expect(validateElement(invalid)).toBe(false)
  })
})

describe('validateSlide', () => {
  it('should validate a slide', () => {
    const slide = createSlide()
    slide.elements = [createTextElement(0, 0)]
    expect(validateSlide(slide)).toBe(true)
  })

  it('should reject invalid slide', () => {
    expect(validateSlide(null)).toBe(false)
    expect(validateSlide({})).toBe(false)
  })

  it('should reject slide with invalid elements', () => {
    const slide = createSlide()
    slide.elements = [{ invalid: true }]
    expect(validateSlide(slide)).toBe(false)
  })
})

describe('validateSlides', () => {
  it('should validate slides array', () => {
    const slides = [createSlide()]
    expect(validateSlides(slides)).toBe(true)
  })

  it('should reject non-array', () => {
    expect(validateSlides(null)).toBe(false)
    expect(validateSlides('string')).toBe(false)
  })

  it('should reject empty array', () => {
    expect(validateSlides([])).toBe(false)
  })

  it('should reject array with invalid slide', () => {
    expect(validateSlides([null])).toBe(false)
  })
})

describe('importFromJson', () => {
  it('should reject non-object input', () => {
    expect(importFromJson(null).valid).toBe(false)
    expect(importFromJson('string').valid).toBe(false)
  })

  it('should reject invalid slides data', () => {
    expect(importFromJson({ slides: 'invalid' }).valid).toBe(false)
  })

  it('should reject slides with invalid elements', () => {
    expect(importFromJson({ slides: [{ id: 'x', elements: [{ invalid: true }] }] }).valid).toBe(false)
  })

  it('should accept valid data', () => {
    const slides = [createSlide()]
    const result = importFromJson({ slides })
    expect(result.valid).toBe(true)
    expect(result.data).toHaveLength(1)
  })
})

describe('isPointInElement', () => {
  it('should detect point inside element', () => {
    const el = createTextElement(10, 10)
    el.width = 100
    el.height = 50
    expect(isPointInElement(50, 30, el)).toBe(true)
    expect(isPointInElement(10, 10, el)).toBe(true)
    expect(isPointInElement(110, 60, el)).toBe(true)
  })

  it('should detect point outside element', () => {
    const el = createTextElement(10, 10)
    el.width = 100
    el.height = 50
    expect(isPointInElement(0, 0, el)).toBe(false)
    expect(isPointInElement(200, 200, el)).toBe(false)
  })

  it('should handle null element', () => {
    expect(isPointInElement(0, 0, null)).toBe(false)
  })
})

describe('findElementAtPoint', () => {
  it('should find element at point', () => {
    const el1 = createTextElement(10, 10)
    el1.width = 50
    el1.height = 50
    const el2 = createTextElement(100, 100)
    el2.width = 50
    el2.height = 50
    const slide = createSlide()
    slide.elements = [el1, el2]

    expect(findElementAtPoint(slide, 30, 30).id).toBe(el1.id)
    expect(findElementAtPoint(slide, 120, 120).id).toBe(el2.id)
  })

  it('should return null if no element at point', () => {
    const slide = createSlide()
    slide.elements = [createTextElement(10, 10)]
    expect(findElementAtPoint(slide, 1000, 1000)).toBeNull()
  })

  it('should return null for invalid slide', () => {
    expect(findElementAtPoint(null, 0, 0)).toBeNull()
  })

  it('should return topmost element', () => {
    const el1 = createTextElement(10, 10)
    el1.width = 100
    el1.height = 100
    const el2 = createTextElement(20, 20)
    el2.width = 50
    el2.height = 50
    const slide = createSlide()
    slide.elements = [el1, el2]

    expect(findElementAtPoint(slide, 30, 30).id).toBe(el2.id)
  })
})

describe('calculateScaledCanvasSize', () => {
  it('should scale to fit width when container is wide', () => {
    const result = calculateScaledCanvasSize(2000, 500)
    expect(result.width / result.height).toBeCloseTo(CANVAS_WIDTH / CANVAS_HEIGHT)
    expect(result.height).toBeLessThanOrEqual(500)
  })

  it('should scale to fit height when container is tall', () => {
    const result = calculateScaledCanvasSize(500, 2000)
    expect(result.width / result.height).toBeCloseTo(CANVAS_WIDTH / CANVAS_HEIGHT)
    expect(result.width).toBeLessThanOrEqual(500)
  })

  it('should calculate correct scale', () => {
    const result = calculateScaledCanvasSize(CANVAS_WIDTH, CANVAS_HEIGHT)
    expect(result.scale).toBeCloseTo(1)
  })
})

describe('screenToCanvas', () => {
  it('should convert screen coordinates to canvas', () => {
    const result = screenToCanvas(150, 250, 50, 50, 2)
    expect(result.x).toBe((150 - 50) / 2)
    expect(result.y).toBe((250 - 50) / 2)
  })
})

describe('constrainToCanvas', () => {
  it('should constrain position within canvas', () => {
    const result = constrainToCanvas(-10, -20, 100, 50)
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
  })

  it('should constrain to bottom right', () => {
    const result = constrainToCanvas(99999, 99999, 100, 50)
    expect(result.x).toBe(CANVAS_WIDTH - 100)
    expect(result.y).toBe(CANVAS_HEIGHT - 50)
  })

  it('should keep valid position', () => {
    const result = constrainToCanvas(100, 100, 100, 50)
    expect(result.x).toBe(100)
    expect(result.y).toBe(100)
  })
})

describe('slide navigation', () => {
  it('getNextSlideIndex should go forward', () => {
    expect(getNextSlideIndex(0, 5, 1)).toBe(1)
    expect(getNextSlideIndex(3, 5, 1)).toBe(4)
  })

  it('getNextSlideIndex should go backward', () => {
    expect(getNextSlideIndex(3, 5, -1)).toBe(2)
    expect(getNextSlideIndex(0, 5, -1)).toBe(0)
  })

  it('getNextSlideIndex should not go past bounds', () => {
    expect(getNextSlideIndex(4, 5, 1)).toBe(4)
    expect(getNextSlideIndex(0, 5, -1)).toBe(0)
    expect(getNextSlideIndex(0, 1, 1)).toBe(0)
  })

  it('canGoToPrevSlide should work', () => {
    expect(canGoToPrevSlide(0)).toBe(false)
    expect(canGoToPrevSlide(1)).toBe(true)
  })

  it('canGoToNextSlide should work', () => {
    expect(canGoToNextSlide(0, 1)).toBe(false)
    expect(canGoToNextSlide(0, 2)).toBe(true)
    expect(canGoToNextSlide(1, 2)).toBe(false)
  })
})

describe('cloneElement', () => {
  it('should clone element with new id', () => {
    const el = createTextElement(0, 0, 'original')
    const cloned = cloneElement(el)
    expect(cloned.id).not.toBe(el.id)
    expect(cloned.content).toBe('original')
    expect(cloned.x).toBe(0)
    expect(cloned.y).toBe(0)
  })

  it('should handle null', () => {
    expect(cloneElement(null)).toBeNull()
    expect(cloneElement(undefined)).toBeNull()
  })
})
