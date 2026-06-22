import {
  DEFAULT_CANVAS_SIZE,
  DEFAULT_BG_COLOR,
  DEFAULT_FONT,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_SHADOW_COLOR,
  DEFAULT_SHADOW_BLUR,
  DEFAULT_SHADOW_OFFSET_X,
  DEFAULT_SHADOW_OFFSET_Y,
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
} from './constants.js'

let idCounter = 0

export function generateId(prefix = 'layer') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function createBackgroundLayer(overrides = {}) {
  return {
    id: 'bg',
    type: 'background',
    color: DEFAULT_BG_COLOR,
    image: null,
    imageOpacity: 1,
    ...overrides,
  }
}

export function createTextLayer(overrides = {}) {
  return {
    id: generateId('text'),
    type: 'text',
    text: '双击编辑文字',
    fontFamily: DEFAULT_FONT,
    fontSize: DEFAULT_FONT_SIZE,
    color: DEFAULT_TEXT_COLOR,
    strokeColor: DEFAULT_STROKE_COLOR,
    strokeWidth: DEFAULT_STROKE_WIDTH,
    shadowColor: DEFAULT_SHADOW_COLOR,
    shadowBlur: DEFAULT_SHADOW_BLUR,
    shadowOffsetX: DEFAULT_SHADOW_OFFSET_X,
    shadowOffsetY: DEFAULT_SHADOW_OFFSET_Y,
    x: 100,
    y: 100,
    ...overrides,
  }
}

export function createInitialState() {
  return {
    canvasWidth: DEFAULT_CANVAS_SIZE.width,
    canvasHeight: DEFAULT_CANVAS_SIZE.height,
    layers: [createBackgroundLayer()],
    selectedLayerId: null,
  }
}

export function addLayer(state, layer) {
  return {
    ...state,
    layers: [...state.layers, layer],
    selectedLayerId: layer.id,
  }
}

export function removeLayer(state, layerId) {
  if (layerId === 'bg') return state
  const newLayers = state.layers.filter((l) => l.id !== layerId)
  const newSelectedId = state.selectedLayerId === layerId ? null : state.selectedLayerId
  return {
    ...state,
    layers: newLayers,
    selectedLayerId: newSelectedId,
  }
}

export function updateLayer(state, layerId, updates) {
  return {
    ...state,
    layers: state.layers.map((l) => (l.id === layerId ? { ...l, ...updates } : l)),
    selectedLayerId: state.selectedLayerId,
  }
}

export function moveLayerPosition(state, layerId, newIndex) {
  const layers = [...state.layers]
  const currentIndex = layers.findIndex((l) => l.id === layerId)
  if (currentIndex === -1) return state
  if (layerId === 'bg') return state
  if (newIndex < 1 || newIndex >= layers.length) return state
  const [layer] = layers.splice(currentIndex, 1)
  layers.splice(newIndex, 0, layer)
  return { ...state, layers }
}

export function reorderLayers(state, fromIndex, toIndex) {
  const layers = [...state.layers]
  if (fromIndex < 1 || toIndex < 1) return state
  if (fromIndex >= layers.length || toIndex >= layers.length) return state
  const [layer] = layers.splice(fromIndex, 1)
  layers.splice(toIndex, 0, layer)
  return { ...state, layers }
}

export function selectLayer(state, layerId) {
  return { ...state, selectedLayerId: layerId }
}

export function setCanvasSize(state, width, height) {
  return { ...state, canvasWidth: width, canvasHeight: height }
}

export function clampFontSize(size) {
  return clampValue(size, MIN_FONT_SIZE, MAX_FONT_SIZE)
}

export function clampStrokeWidth(width) {
  return clampValue(width, MIN_STROKE_WIDTH, MAX_STROKE_WIDTH)
}

export function clampShadowBlur(blur) {
  return clampValue(blur, MIN_SHADOW_BLUR, MAX_SHADOW_BLUR)
}

export function clampShadowOffset(offset) {
  return clampValue(offset, MIN_SHADOW_OFFSET, MAX_SHADOW_OFFSET)
}

export function clampBgOpacity(opacity) {
  return clampValue(opacity, MIN_BG_OPACITY, MAX_BG_OPACITY)
}

export function serializeState(state) {
  return {
    ...state,
    layers: state.layers.map((layer) => {
      if (layer.type === 'background') {
        return { ...layer, image: null }
      }
      return { ...layer }
    }),
  }
}

export function pushHistory(history, historyIndex, state) {
  const newHistory = history.slice(0, historyIndex + 1)
  const serializable = serializeState(state)
  const snapshot = JSON.parse(JSON.stringify(serializable))
  newHistory.push(snapshot)
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift()
    return { history: newHistory, historyIndex: newHistory.length - 1 }
  }
  return { history: newHistory, historyIndex: newHistory.length - 1 }
}

export function isValidColor(color) {
  if (typeof color !== 'string') return false
  const trimmed = color.trim()
  if (!trimmed) return false
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return true
  if (/^#([0-9a-f]{4}|[0-9a-f]{8})$/i.test(trimmed)) return true
  const rgbaMatch = /^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(0|1|0?\.\d+|1\.0)\s*)?\)$/i.exec(trimmed)
  if (rgbaMatch) {
    const r = Number(rgbaMatch[1])
    const g = Number(rgbaMatch[2])
    const b = Number(rgbaMatch[3])
    return r <= 255 && g <= 255 && b <= 255
  }
  const hslaMatch = /^hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*(?:,\s*(0|1|0?\.\d+|1\.0)\s*)?\)$/i.exec(trimmed)
  if (hslaMatch) {
    const h = Number(hslaMatch[1])
    const s = Number(hslaMatch[2])
    const l = Number(hslaMatch[3])
    return h <= 360 && s <= 100 && l <= 100
  }
  return false
}

export function sanitizeColor(color, fallback) {
  return isValidColor(color) ? color : fallback
}

export function restoreBackgroundImage(state) {
  const bgLayer = state.layers.find((l) => l.type === 'background')
  if (!bgLayer || !bgLayer.imageSrc) return Promise.resolve(state)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        ...state,
        layers: state.layers.map((l) =>
          l.id === bgLayer.id ? { ...l, image: img } : l
        ),
      })
    }
    img.onerror = () => {
      resolve(state)
    }
    img.src = bgLayer.imageSrc
  })
}

export function canUndo(historyIndex) {
  return historyIndex > 0
}

export function canRedo(history, historyIndex) {
  return historyIndex < history.length - 1
}

export function undo(history, historyIndex) {
  if (!canUndo(historyIndex)) return { historyIndex }
  const newIndex = historyIndex - 1
  return { state: history[newIndex], historyIndex: newIndex }
}

export function redo(history, historyIndex) {
  if (!canRedo(history, historyIndex)) return { historyIndex }
  const newIndex = historyIndex + 1
  return { state: history[newIndex], historyIndex: newIndex }
}

export function hitTestTextLayer(layer, px, py, ctx) {
  if (layer.type !== 'text') return false
  ctx.save()
  ctx.font = `${layer.fontSize}px ${layer.fontFamily}`
  const metrics = ctx.measureText(layer.text || '')
  const textWidth = metrics.width
  const textHeight = layer.fontSize
  const left = layer.x
  const top = layer.y - textHeight * 0.85
  const right = left + textWidth
  const bottom = layer.y + textHeight * 0.15
  ctx.restore()
  return px >= left && px <= right && py >= top && py <= bottom
}

export function findLayerAtPoint(state, px, py, ctx) {
  for (let i = state.layers.length - 1; i >= 0; i--) {
    const layer = state.layers[i]
    if (layer.type === 'text' && hitTestTextLayer(layer, px, py, ctx)) {
      return layer
    }
  }
  return null
}

export function exportCanvasToPng(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(false)
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `poster-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      resolve(true)
    }, 'image/png')
  })
}

function isHTMLImageElement(obj) {
  if (typeof obj === 'undefined' || obj === null) return false
  if (typeof HTMLImageElement !== 'undefined' && obj instanceof HTMLImageElement) return true
  if (obj.nodeName === 'IMG' && typeof obj.naturalWidth === 'number') return true
  return false
}

export function drawPoster(ctx, state, canvasWidth, canvasHeight) {
  const { layers } = state

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  const bg = layers.find((l) => l.type === 'background')
  if (bg) {
    const bgColor = sanitizeColor(bg.color, DEFAULT_BG_COLOR)
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    if (bg.image && isHTMLImageElement(bg.image)) {
      ctx.save()
      try {
        ctx.globalAlpha = clampBgOpacity(bg.imageOpacity)
        ctx.drawImage(bg.image, 0, 0, canvasWidth, canvasHeight)
      } catch {
        // image draw failed, color fill already in place as fallback
      } finally {
        ctx.restore()
      }
    }
  }

  const textLayers = layers.filter((l) => l.type === 'text')
  textLayers.forEach((layer) => {
    ctx.save()
    ctx.font = `${clampFontSize(layer.fontSize)}px ${layer.fontFamily || DEFAULT_FONT}`
    ctx.textBaseline = 'alphabetic'

    const shadowColor = sanitizeColor(layer.shadowColor, DEFAULT_SHADOW_COLOR)
    const shadowBlur = clampShadowBlur(layer.shadowBlur)
    const shadowOffsetX = clampShadowOffset(layer.shadowOffsetX)
    const shadowOffsetY = clampShadowOffset(layer.shadowOffsetY)
    if (shadowBlur > 0 || shadowOffsetX !== 0 || shadowOffsetY !== 0) {
      ctx.shadowColor = shadowColor
      ctx.shadowBlur = shadowBlur
      ctx.shadowOffsetX = shadowOffsetX
      ctx.shadowOffsetY = shadowOffsetY
    }

    const strokeWidth = clampStrokeWidth(layer.strokeWidth)
    if (strokeWidth > 0) {
      const strokeColor = sanitizeColor(layer.strokeColor, DEFAULT_STROKE_COLOR)
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = strokeWidth
      ctx.lineJoin = 'round'
      try {
        ctx.strokeText(layer.text, layer.x, layer.y)
      } catch {
        // skip stroke on error
      }
    }

    const textColor = sanitizeColor(layer.color, DEFAULT_TEXT_COLOR)
    ctx.fillStyle = textColor
    try {
      ctx.fillText(layer.text, layer.x, layer.y)
    } catch {
      // skip fill on error
    }
    ctx.restore()
  })
}

export function getSelectedLayer(state) {
  if (!state.selectedLayerId) return null
  return state.layers.find((l) => l.id === state.selectedLayerId) || null
}
