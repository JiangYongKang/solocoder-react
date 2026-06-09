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
  STORAGE_KEY,
} from './constants.js'

let idCounter = 0

export function generateId(prefix = 'element') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function createSlide() {
  return {
    id: generateId('slide'),
    elements: [],
    backgroundColor: DEFAULT_COLORS.BACKGROUND,
  }
}

export function createInitialSlides() {
  return [createSlide()]
}

export function createTextElement(x, y, text = '双击编辑文本') {
  return {
    id: generateId('text'),
    type: ELEMENT_TYPES.TEXT,
    x,
    y,
    width: 200,
    height: 40,
    content: text,
    fontSize: DEFAULT_FONT_SIZE,
    color: DEFAULT_COLORS.TEXT,
    bold: false,
    italic: false,
  }
}

export function createImageElement(x, y, src, width = 200, height = 150) {
  return {
    id: generateId('image'),
    type: ELEMENT_TYPES.IMAGE,
    x,
    y,
    width,
    height,
    src,
  }
}

export function createShapeElement(shapeType, x, y, width = 120, height = 100) {
  return {
    id: generateId('shape'),
    type: ELEMENT_TYPES.SHAPE,
    shapeType,
    x,
    y,
    width,
    height,
    fillColor: DEFAULT_COLORS.FILL,
    borderColor: DEFAULT_COLORS.BORDER,
    borderWidth: DEFAULT_BORDER_WIDTH,
  }
}

export function addSlide(slides) {
  if (!Array.isArray(slides)) return [createSlide()]
  return [...slides, createSlide()]
}

export function deleteSlide(slides, slideId) {
  if (!Array.isArray(slides)) return []
  if (slides.length <= 1) return slides
  return slides.filter((s) => s.id !== slideId)
}

export function duplicateSlide(slides, slideId) {
  if (!Array.isArray(slides)) return []
  const index = slides.findIndex((s) => s.id === slideId)
  if (index === -1) return slides
  const source = slides[index]
  const duplicated = {
    ...source,
    id: generateId('slide'),
    elements: source.elements.map((el) => ({
      ...el,
      id: generateId(el.type),
    })),
  }
  const result = [...slides]
  result.splice(index + 1, 0, duplicated)
  return result
}

export function reorderSlides(slides, fromIndex, toIndex) {
  if (!Array.isArray(slides)) return []
  if (fromIndex < 0 || fromIndex >= slides.length) return slides
  if (toIndex < 0 || toIndex >= slides.length) return slides
  if (fromIndex === toIndex) return slides
  const result = [...slides]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}

export function addElement(slides, slideId, element) {
  if (!Array.isArray(slides)) return slides
  return slides.map((slide) => {
    if (slide.id !== slideId) return slide
    return {
      ...slide,
      elements: [...slide.elements, element],
    }
  })
}

export function deleteElement(slides, slideId, elementId) {
  if (!Array.isArray(slides)) return slides
  return slides.map((slide) => {
    if (slide.id !== slideId) return slide
    return {
      ...slide,
      elements: slide.elements.filter((el) => el.id !== elementId),
    }
  })
}

export function updateElement(slides, slideId, elementId, updates) {
  if (!Array.isArray(slides)) return slides
  return slides.map((slide) => {
    if (slide.id !== slideId) return slide
    return {
      ...slide,
      elements: slide.elements.map((el) =>
        el.id === elementId ? { ...el, ...updates } : el
      ),
    }
  })
}

export function updateSlide(slides, slideId, updates) {
  if (!Array.isArray(slides)) return slides
  return slides.map((slide) =>
    slide.id === slideId ? { ...slide, ...updates } : slide
  )
}

export function getSlideById(slides, slideId) {
  if (!Array.isArray(slides)) return null
  return slides.find((s) => s.id === slideId) || null
}

export function getElementById(slide, elementId) {
  if (!slide || !Array.isArray(slide.elements)) return null
  return slide.elements.find((el) => el.id === elementId) || null
}

export function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function clampElementSize(width, height) {
  return {
    width: clampNumber(width, MIN_ELEMENT_SIZE, MAX_ELEMENT_SIZE),
    height: clampNumber(height, MIN_ELEMENT_SIZE, MAX_ELEMENT_SIZE),
  }
}

export function clampFontSize(size) {
  return clampNumber(size, MIN_FONT_SIZE, MAX_FONT_SIZE)
}

export function isValidColor(color) {
  if (typeof color !== 'string') return false
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) return true
  if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(color)) return true
  if (/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i.test(color)) return true
  return false
}

export function loadFromStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { slides: createInitialSlides() }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return { slides: createInitialSlides() }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      return { slides: createInitialSlides() }
    }
    return { slides: parsed.slides }
  } catch {
    return { slides: createInitialSlides() }
  }
}

export function saveToStorage(state, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
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

export function exportToJson(slides) {
  return {
    version: '1.0',
    slides,
    exportedAt: new Date().toISOString(),
  }
}

export function downloadJson(slides, filename = 'slides-editor.json') {
  if (typeof window === 'undefined' || !window.document) return false
  try {
    const data = exportToJson(slides)
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

export function validateElement(element) {
  if (!element || typeof element !== 'object') return false
  if (!element.id || typeof element.id !== 'string') return false
  if (!element.type || typeof element.type !== 'string') return false
  if (typeof element.x !== 'number' || typeof element.y !== 'number') return false
  if (typeof element.width !== 'number' || typeof element.height !== 'number') return false

  const validTypes = Object.values(ELEMENT_TYPES)
  if (!validTypes.includes(element.type)) return false

  switch (element.type) {
    case ELEMENT_TYPES.TEXT:
      return (
        typeof element.content === 'string' &&
        typeof element.fontSize === 'number' &&
        typeof element.color === 'string' &&
        typeof element.bold === 'boolean' &&
        typeof element.italic === 'boolean'
      )
    case ELEMENT_TYPES.IMAGE:
      return typeof element.src === 'string'
    case ELEMENT_TYPES.SHAPE: {
      const validShapes = Object.values(SHAPE_TYPES)
      if (!validShapes.includes(element.shapeType)) return false
      return (
        typeof element.fillColor === 'string' &&
        typeof element.borderColor === 'string' &&
        typeof element.borderWidth === 'number'
      )
    }
    default:
      return false
  }
}

export function validateSlide(slide) {
  if (!slide || typeof slide !== 'object') return false
  if (!slide.id || typeof slide.id !== 'string') return false
  if (!Array.isArray(slide.elements)) return false
  return slide.elements.every(validateElement)
}

export function validateSlides(slides) {
  if (!Array.isArray(slides)) return false
  if (slides.length === 0) return false
  return slides.every(validateSlide)
}

export function importFromJson(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    return { valid: false, error: '无效的 JSON 数据' }
  }
  if (!validateSlides(jsonData.slides)) {
    const invalidIdx = jsonData.slides?.findIndex?.((s) => !validateSlide(s))
    if (invalidIdx !== undefined && invalidIdx !== -1) {
      return { valid: false, error: `第 ${invalidIdx + 1} 页幻灯片数据无效` }
    }
    return { valid: false, error: '幻灯片数据无效' }
  }
  return { valid: true, data: jsonData.slides }
}

export function isPointInElement(px, py, element) {
  if (!element) return false
  return (
    px >= element.x &&
    px <= element.x + element.width &&
    py >= element.y &&
    py <= element.y + element.height
  )
}

export function findElementAtPoint(slide, px, py) {
  if (!slide || !Array.isArray(slide.elements)) return null
  for (let i = slide.elements.length - 1; i >= 0; i--) {
    const el = slide.elements[i]
    if (isPointInElement(px, py, el)) {
      return el
    }
  }
  return null
}

export function calculateScaledCanvasSize(containerWidth, containerHeight) {
  const containerRatio = containerWidth / containerHeight
  let width, height

  if (containerRatio > CANVAS_WIDTH / CANVAS_HEIGHT) {
    height = containerHeight
    width = height * (CANVAS_WIDTH / CANVAS_HEIGHT)
  } else {
    width = containerWidth
    height = width * (CANVAS_HEIGHT / CANVAS_WIDTH)
  }

  const scale = width / CANVAS_WIDTH
  return { width, height, scale }
}

export function screenToCanvas(screenX, screenY, canvasOffsetX, canvasOffsetY, scale) {
  return {
    x: (screenX - canvasOffsetX) / scale,
    y: (screenY - canvasOffsetY) / scale,
  }
}

export function constrainToCanvas(x, y, width, height) {
  return {
    x: clampNumber(x, 0, CANVAS_WIDTH - width),
    y: clampNumber(y, 0, CANVAS_HEIGHT - height),
  }
}

export function getNextSlideIndex(currentIndex, slidesLength, direction = 1) {
  if (slidesLength <= 1) return currentIndex
  let next = currentIndex + direction
  if (next < 0) next = 0
  if (next >= slidesLength) next = slidesLength - 1
  return next
}

export function canGoToPrevSlide(currentIndex) {
  return currentIndex > 0
}

export function canGoToNextSlide(currentIndex, slidesLength) {
  return currentIndex < slidesLength - 1
}

export function cloneElement(element) {
  if (!element) return null
  return {
    ...element,
    id: generateId(element.type),
  }
}
