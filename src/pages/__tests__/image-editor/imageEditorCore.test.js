import { describe, it, expect } from 'vitest'
import {
  clamp,
  clampFilters,
  resetFilters,
  areFiltersDefault,
  validateImageType,
  getImageFileExtension,
  calculateFitScale,
  screenToImageCoords,
  imageToScreenCoords,
  applyBrightness,
  applyContrast,
  applySaturation,
  applyHue,
  applyBlur,
  applyFiltersToData,
  normalizeCropRect,
  applyRatioToCrop,
  createTextAnnotation,
  createBrushAnnotation,
  addAnnotation,
  removeAnnotation,
  updateAnnotation,
  addBrushPoint,
  isPointInTextAnnotation,
  findTextAnnotationAtPoint,
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
  canUndo,
  canRedo,
  createEditorState,
  cloneEditorState,
  getExportFileName,
  isValidColor,
  clampBrushSize,
  clampFontSize,
  clampRotation,
  clampQuality,
  getRatioByType,
  generateId,
} from '../../image-editor/imageEditorCore.js'
import {
  DEFAULT_FILTERS,
  FILTER_RANGES,
  CROP_RATIOS,
  EXPORT_FORMATS,
} from '../../image-editor/constants.js'

describe('imageEditorCore - clamp', () => {
  it('should clamp value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })
})

describe('imageEditorCore - clampFilters', () => {
  it('should clamp all filter values within their ranges', () => {
    const input = {
      brightness: 200,
      contrast: -200,
      saturation: 50,
      hue: 0,
      blur: 100,
    }
    const result = clampFilters(input)
    expect(result.brightness).toBe(FILTER_RANGES.brightness.max)
    expect(result.contrast).toBe(FILTER_RANGES.contrast.min)
    expect(result.saturation).toBe(50)
    expect(result.hue).toBe(0)
    expect(result.blur).toBe(FILTER_RANGES.blur.max)
  })

  it('should keep valid values unchanged', () => {
    const input = { ...DEFAULT_FILTERS }
    const result = clampFilters(input)
    expect(result).toEqual(DEFAULT_FILTERS)
  })
})

describe('imageEditorCore - resetFilters', () => {
  it('should return default filters', () => {
    const result = resetFilters()
    expect(result).toEqual(DEFAULT_FILTERS)
    expect(result).not.toBe(DEFAULT_FILTERS)
  })
})

describe('imageEditorCore - areFiltersDefault', () => {
  it('should return true for default filters', () => {
    expect(areFiltersDefault(DEFAULT_FILTERS)).toBe(true)
    expect(areFiltersDefault({ ...DEFAULT_FILTERS })).toBe(true)
  })

  it('should return false for modified filters', () => {
    expect(areFiltersDefault({ ...DEFAULT_FILTERS, brightness: 10 })).toBe(false)
    expect(areFiltersDefault({ ...DEFAULT_FILTERS, blur: 5 })).toBe(false)
  })

  it('should return true for null or undefined', () => {
    expect(areFiltersDefault(null)).toBe(true)
    expect(areFiltersDefault(undefined)).toBe(true)
  })
})

describe('imageEditorCore - validateImageType', () => {
  it('should accept PNG, JPEG, WebP', () => {
    expect(validateImageType({ type: 'image/png' })).toBe(true)
    expect(validateImageType({ type: 'image/jpeg' })).toBe(true)
    expect(validateImageType({ type: 'image/webp' })).toBe(true)
  })

  it('should reject other types', () => {
    expect(validateImageType({ type: 'image/gif' })).toBe(false)
    expect(validateImageType({ type: 'application/pdf' })).toBe(false)
    expect(validateImageType({ type: 'text/plain' })).toBe(false)
  })

  it('should handle null/undefined', () => {
    expect(validateImageType(null)).toBe(false)
    expect(validateImageType(undefined)).toBe(false)
    expect(validateImageType({})).toBe(false)
  })
})

describe('imageEditorCore - getImageFileExtension', () => {
  it('should return correct extensions', () => {
    expect(getImageFileExtension({ type: 'image/png' })).toBe('png')
    expect(getImageFileExtension({ type: 'image/jpeg' })).toBe('jpg')
    expect(getImageFileExtension({ type: 'image/webp' })).toBe('webp')
  })

  it('should default to png', () => {
    expect(getImageFileExtension(null)).toBe('png')
    expect(getImageFileExtension({})).toBe('png')
    expect(getImageFileExtension({ type: 'image/unknown' })).toBe('png')
  })
})

describe('imageEditorCore - calculateFitScale', () => {
  it('should fit image within container', () => {
    const result = calculateFitScale(1000, 500, 500, 500)
    expect(result.scale).toBe(0.5)
    expect(result.displayWidth).toBe(500)
    expect(result.displayHeight).toBe(250)
    expect(result.offsetX).toBe(0)
    expect(result.offsetY).toBe(125)
  })

  it('should handle portrait image', () => {
    const result = calculateFitScale(400, 800, 500, 500)
    expect(result.scale).toBe(0.625)
    expect(result.displayWidth).toBe(250)
    expect(result.displayHeight).toBe(500)
    expect(result.offsetX).toBe(125)
    expect(result.offsetY).toBe(0)
  })

  it('should handle invalid inputs', () => {
    const result = calculateFitScale(0, 0, 0, 0)
    expect(result.scale).toBe(1)
  })
})

describe('imageEditorCore - coordinate transforms', () => {
  it('screenToImageCoords should convert correctly', () => {
    const result = screenToImageCoords(150, 125, 0, 0, 0.5)
    expect(result.x).toBe(300)
    expect(result.y).toBe(250)
  })

  it('imageToScreenCoords should convert correctly', () => {
    const result = imageToScreenCoords(300, 250, 0, 0, 0.5)
    expect(result.x).toBe(150)
    expect(result.y).toBe(125)
  })

  it('should be inverse operations', () => {
    const original = { x: 100, y: 200 }
    const screen = imageToScreenCoords(original.x, original.y, 10, 20, 0.5)
    const back = screenToImageCoords(screen.x, screen.y, 10, 20, 0.5)
    expect(back.x).toBeCloseTo(original.x)
    expect(back.y).toBeCloseTo(original.y)
  })
})

describe('imageEditorCore - pixel filters', () => {
  const createTestData = () => {
    const data = new Uint8ClampedArray(4 * 4)
    for (let i = 0; i < 4; i++) {
      data[i * 4] = 100
      data[i * 4 + 1] = 150
      data[i * 4 + 2] = 200
      data[i * 4 + 3] = 255
    }
    return data
  }

  it('applyBrightness should not change data when amount is 0', () => {
    const data = createTestData()
    const original = new Uint8ClampedArray(data)
    applyBrightness(data, 0)
    expect(data).toEqual(original)
  })

  it('applyBrightness should increase brightness', () => {
    const data = createTestData()
    applyBrightness(data, 100)
    expect(data[0]).toBeGreaterThan(100)
    expect(data[1]).toBeGreaterThan(150)
    expect(data[2]).toBeGreaterThan(200)
  })

  it('applyBrightness should decrease brightness', () => {
    const data = createTestData()
    applyBrightness(data, -50)
    expect(data[0]).toBeLessThan(100)
    expect(data[1]).toBeLessThan(150)
    expect(data[2]).toBeLessThan(200)
  })

  it('applyContrast should not change data when amount is 0', () => {
    const data = createTestData()
    const original = new Uint8ClampedArray(data)
    applyContrast(data, 0)
    expect(data).toEqual(original)
  })

  it('applySaturation should not change data when amount is 0', () => {
    const data = createTestData()
    const original = new Uint8ClampedArray(data)
    applySaturation(data, 0)
    expect(data).toEqual(original)
  })

  it('applyHue should not change data when amount is 0', () => {
    const data = createTestData()
    const original = new Uint8ClampedArray(data)
    applyHue(data, 0)
    expect(data).toEqual(original)
  })

  it('applyBlur should not change data when amount is 0', () => {
    const width = 2
    const height = 2
    const data = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 100
      data[i + 1] = 150
      data[i + 2] = 200
      data[i + 3] = 255
    }
    const original = new Uint8ClampedArray(data)
    applyBlur(data, width, height, 0)
    expect(data).toEqual(original)
  })

  it('applyBlur should not change data when amount is negative', () => {
    const width = 2
    const height = 2
    const data = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 100
      data[i + 1] = 150
      data[i + 2] = 200
      data[i + 3] = 255
    }
    const original = new Uint8ClampedArray(data)
    applyBlur(data, width, height, -5)
    expect(data).toEqual(original)
  })

  it('applyBlur should blur the image (uniform color stays the same)', () => {
    const width = 3
    const height = 3
    const data = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128
      data[i + 1] = 128
      data[i + 2] = 128
      data[i + 3] = 255
    }
    const original = new Uint8ClampedArray(data)
    applyBlur(data, width, height, 2)
    expect(data).toEqual(original)
  })

  it('applyBlur should actually blur edges', () => {
    const width = 3
    const height = 3
    const data = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        if (x === 0 && y === 0) {
          data[idx] = 255
          data[idx + 1] = 0
          data[idx + 2] = 0
          data[idx + 3] = 255
        } else {
          data[idx] = 0
          data[idx + 1] = 0
          data[idx + 2] = 255
          data[idx + 3] = 255
        }
      }
    }
    applyBlur(data, width, height, 1)
    const centerIdx = (1 * width + 1) * 4
    expect(data[centerIdx]).toBeGreaterThan(0)
    expect(data[centerIdx]).toBeLessThan(255)
  })

  it('applyFiltersToData should return filtered data', () => {
    const width = 2
    const height = 2
    const data = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128
      data[i + 1] = 128
      data[i + 2] = 128
      data[i + 3] = 255
    }
    const imageData = { data, width, height }
    const result = applyFiltersToData(imageData, DEFAULT_FILTERS)
    expect(result.width).toBe(width)
    expect(result.height).toBe(height)
    expect(result.data).toBeInstanceOf(Uint8ClampedArray)
    expect(result.data.length).toBe(width * height * 4)
  })
})

describe('imageEditorCore - crop rect utilities', () => {
  it('normalizeCropRect should handle negative width/height', () => {
    const result = normalizeCropRect(100, 200, -50, -30)
    expect(result.x).toBe(50)
    expect(result.y).toBe(170)
    expect(result.width).toBe(50)
    expect(result.height).toBe(30)
  })

  it('normalizeCropRect should handle positive values', () => {
    const result = normalizeCropRect(10, 20, 50, 60)
    expect(result).toEqual({ x: 10, y: 20, width: 50, height: 60 })
  })

  it('applyRatioToCrop should enforce 1:1 ratio', () => {
    const result = applyRatioToCrop(0, 0, 100, 50, 1, 1000, 1000)
    expect(result.width).toBeCloseTo(result.height)
  })

  it('applyRatioToCrop should enforce 16:9 ratio', () => {
    const result = applyRatioToCrop(0, 0, 160, 90, 16 / 9, 1000, 1000)
    expect(result.width / result.height).toBeCloseTo(16 / 9)
  })

  it('applyRatioToCrop should return free ratio when ratio is null', () => {
    const result = applyRatioToCrop(0, 0, 100, 50, null, 1000, 1000)
    expect(result).toEqual({ x: 0, y: 0, width: 100, height: 50 })
  })
})

describe('imageEditorCore - annotations', () => {
  it('createTextAnnotation should create valid text annotation', () => {
    const ann = createTextAnnotation(10, 20, 'hello', '#ff0000', 24)
    expect(ann.type).toBe('text')
    expect(ann.x).toBe(10)
    expect(ann.y).toBe(20)
    expect(ann.text).toBe('hello')
    expect(ann.color).toBe('#ff0000')
    expect(ann.fontSize).toBe(24)
    expect(ann.id).toBeDefined()
  })

  it('createBrushAnnotation should create valid brush annotation', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 10 }]
    const ann = createBrushAnnotation(points, '#00ff00', 4)
    expect(ann.type).toBe('brush')
    expect(ann.points).toHaveLength(2)
    expect(ann.color).toBe('#00ff00')
    expect(ann.lineWidth).toBe(4)
    expect(ann.id).toBeDefined()
    expect(ann.points).not.toBe(points)
  })

  it('addAnnotation should add to list', () => {
    const ann = createTextAnnotation(0, 0, 'test', '#000', 16)
    const result = addAnnotation([], ann)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(ann)
  })

  it('removeAnnotation should remove by id', () => {
    const ann1 = createTextAnnotation(0, 0, 'a', '#000', 16)
    const ann2 = createTextAnnotation(10, 10, 'b', '#000', 16)
    const list = [ann1, ann2]
    const result = removeAnnotation(list, ann1.id)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(ann2.id)
  })

  it('updateAnnotation should update by id', () => {
    const ann = createTextAnnotation(0, 0, 'old', '#000', 16)
    const result = updateAnnotation([ann], ann.id, { text: 'new', x: 100 })
    expect(result[0].text).toBe('new')
    expect(result[0].x).toBe(100)
    expect(result[0].color).toBe('#000')
  })

  it('addBrushPoint should append point', () => {
    const ann = createBrushAnnotation([{ x: 0, y: 0 }], '#000', 2)
    const result = addBrushPoint(ann, { x: 10, y: 20 })
    expect(result.points).toHaveLength(2)
    expect(result.points[1]).toEqual({ x: 10, y: 20 })
  })

  it('isPointInTextAnnotation should detect point in text area', () => {
    const ann = createTextAnnotation(100, 100, 'Hello World', '#000', 20)
    expect(isPointInTextAnnotation(110, 95, ann)).toBe(true)
    expect(isPointInTextAnnotation(1000, 1000, ann)).toBe(false)
  })

  it('findTextAnnotationAtPoint should find topmost annotation', () => {
    const ann1 = createTextAnnotation(0, 50, 'first', '#000', 20)
    const ann2 = createTextAnnotation(10, 60, 'second', '#000', 20)
    const list = [ann1, ann2]
    const found = findTextAnnotationAtPoint(list, 15, 55)
    expect(found).toBeDefined()
  })
})

describe('imageEditorCore - history', () => {
  it('createHistory should return empty history', () => {
    const h = createHistory()
    expect(h.past).toEqual([])
    expect(h.present).toBeNull()
    expect(h.future).toEqual([])
  })

  it('pushHistory should add to history', () => {
    const h = createHistory()
    const h1 = pushHistory(h, 'state1')
    expect(h1.present).toBe('state1')
    const h2 = pushHistory(h1, 'state2')
    expect(h2.past).toHaveLength(1)
    expect(h2.present).toBe('state2')
    expect(h2.future).toEqual([])
  })

  it('undoHistory should revert to previous state', () => {
    const h = createHistory()
    const h1 = pushHistory(h, 'state1')
    const h2 = pushHistory(h1, 'state2')
    const hUndo = undoHistory(h2)
    expect(hUndo.present).toBe('state1')
    expect(hUndo.future).toHaveLength(1)
  })

  it('redoHistory should restore undone state', () => {
    const h = createHistory()
    const h1 = pushHistory(h, 'state1')
    const h2 = pushHistory(h1, 'state2')
    const hUndo = undoHistory(h2)
    const hRedo = redoHistory(hUndo)
    expect(hRedo.present).toBe('state2')
    expect(hRedo.future).toEqual([])
  })

  it('canUndo/canRedo should report correctly', () => {
    const h = createHistory()
    expect(canUndo(h)).toBe(false)
    expect(canRedo(h)).toBe(false)
    const h1 = pushHistory(h, 'state1')
    const h2 = pushHistory(h1, 'state2')
    const h3 = pushHistory(h2, 'state3')
    const h4 = pushHistory(h3, 'state4')
    expect(canUndo(h4)).toBe(true)
    expect(canRedo(h4)).toBe(false)
    const hUndo = undoHistory(h4)
    expect(canUndo(hUndo)).toBe(true)
    expect(canRedo(hUndo)).toBe(true)
    const hUndo2 = undoHistory(hUndo)
    expect(canUndo(hUndo2)).toBe(true)
    expect(canRedo(hUndo2)).toBe(true)
    const hUndo3 = undoHistory(hUndo2)
    expect(canUndo(hUndo3)).toBe(false)
    expect(canRedo(hUndo3)).toBe(true)
  })
})

describe('imageEditorCore - editor state', () => {
  it('createEditorState should return default state', () => {
    const state = createEditorState()
    expect(state.imageLoaded).toBe(false)
    expect(state.filters).toEqual(DEFAULT_FILTERS)
    expect(state.rotation).toBe(0)
    expect(state.flippedH).toBe(false)
    expect(state.flippedV).toBe(false)
    expect(state.annotations).toEqual([])
  })

  it('cloneEditorState should deep clone state', () => {
    const state = {
      ...createEditorState(),
      annotations: [createTextAnnotation(0, 0, 'test', '#000', 16)],
    }
    const cloned = cloneEditorState(state)
    expect(cloned).not.toBe(state)
    expect(cloned.filters).not.toBe(state.filters)
    expect(cloned.annotations).not.toBe(state.annotations)
    expect(cloned.annotations[0]).not.toBe(state.annotations[0])
  })
})

describe('imageEditorCore - export', () => {
  it('getExportFileName should generate correct filename', () => {
    const name = getExportFileName('photo', EXPORT_FORMATS.PNG)
    expect(name).toMatch(/^photo-.*\.png$/)
    const jpgName = getExportFileName('img', EXPORT_FORMATS.JPEG)
    expect(jpgName).toMatch(/^img-.*\.jpg$/)
  })
})

describe('imageEditorCore - color validation', () => {
  it('isValidColor should accept valid colors', () => {
    expect(isValidColor('#ff0000')).toBe(true)
    expect(isValidColor('#f00')).toBe(true)
    expect(isValidColor('rgb(255, 0, 0)')).toBe(true)
    expect(isValidColor('rgba(255, 0, 0, 0.5)')).toBe(true)
  })

  it('isValidColor should reject invalid colors', () => {
    expect(isValidColor('red')).toBe(false)
    expect(isValidColor('#gggggg')).toBe(false)
    expect(isValidColor('')).toBe(false)
    expect(isValidColor(null)).toBe(false)
    expect(isValidColor(123)).toBe(false)
  })
})

describe('imageEditorCore - clamp helpers', () => {
  it('clampBrushSize should clamp between 1 and 50', () => {
    expect(clampBrushSize(0)).toBe(1)
    expect(clampBrushSize(100)).toBe(50)
    expect(clampBrushSize(25)).toBe(25)
  })

  it('clampFontSize should clamp between 8 and 72', () => {
    expect(clampFontSize(0)).toBe(8)
    expect(clampFontSize(100)).toBe(72)
    expect(clampFontSize(24)).toBe(24)
  })

  it('clampRotation should clamp between -180 and 180', () => {
    expect(clampRotation(-200)).toBe(-180)
    expect(clampRotation(200)).toBe(180)
    expect(clampRotation(45)).toBe(45)
  })

  it('clampQuality should convert 0-100 to 0-1', () => {
    expect(clampQuality(0)).toBe(0)
    expect(clampQuality(100)).toBe(1)
    expect(clampQuality(50)).toBeCloseTo(0.5)
  })
})

describe('imageEditorCore - getRatioByType', () => {
  it('should return correct ratio values', () => {
    expect(getRatioByType(CROP_RATIOS.FREE)).toBeNull()
    expect(getRatioByType(CROP_RATIOS.RATIO_1_1)).toBe(1)
    expect(getRatioByType(CROP_RATIOS.RATIO_4_3)).toBeCloseTo(4 / 3)
    expect(getRatioByType(CROP_RATIOS.RATIO_16_9)).toBeCloseTo(16 / 9)
  })

  it('should return null for unknown types', () => {
    expect(getRatioByType('unknown')).toBeNull()
  })
})

describe('imageEditorCore - generateId', () => {
  it('should generate unique ids', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^item_\d+_\d+$/)
  })

  it('should use custom prefix', () => {
    const id = generateId('custom')
    expect(id).toMatch(/^custom_\d+_\d+$/)
  })
})
