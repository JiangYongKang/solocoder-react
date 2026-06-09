import {
  DEFAULT_GRID_WIDTH,
  DEFAULT_GRID_HEIGHT,
  MIN_GRID_SIZE,
  MAX_GRID_SIZE,
  HISTORY_LIMIT,
  STORAGE_KEY,
  DEFAULT_PALETTE,
  EMPTY_CELL_COLOR,
} from './constants.js'

export function createEmptyGrid(width = DEFAULT_GRID_WIDTH, height = DEFAULT_GRID_HEIGHT) {
  const grid = []
  for (let y = 0; y < height; y++) {
    const row = []
    for (let x = 0; x < width; x++) {
      row.push(EMPTY_CELL_COLOR)
    }
    grid.push(row)
  }
  return grid
}

export function validateGridSize(width, height) {
  const w = Number(width)
  const h = Number(height)
  if (
    Number.isInteger(w) && Number.isInteger(h) &&
    w >= MIN_GRID_SIZE && w <= MAX_GRID_SIZE &&
    h >= MIN_GRID_SIZE && h <= MAX_GRID_SIZE
  ) {
    return { valid: true, width: w, height: h }
  }
  return { valid: false, width: DEFAULT_GRID_WIDTH, height: DEFAULT_GRID_HEIGHT }
}

export function cloneGrid(grid) {
  return grid.map((row) => [...row])
}

export function isInBounds(grid, x, y) {
  if (!grid || !grid.length || !grid[0].length) return false
  return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length
}

export function getPixel(grid, x, y) {
  if (!isInBounds(grid, x, y)) return null
  return grid[y][x]
}

export function setPixel(grid, x, y, color) {
  if (!isInBounds(grid, x, y)) return grid
  const newGrid = cloneGrid(grid)
  newGrid[y][x] = color
  return newGrid
}

export function applyBrush(grid, centerX, centerY, color, brushSize = 1) {
  const newGrid = cloneGrid(grid)
  const half = Math.floor(brushSize / 2)
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      const x = centerX + dx
      const y = centerY + dy
      if (isInBounds(newGrid, x, y)) {
        newGrid[y][x] = color
      }
    }
  }
  return newGrid
}

export function applyEraser(grid, centerX, centerY, brushSize = 1) {
  return applyBrush(grid, centerX, centerY, EMPTY_CELL_COLOR, brushSize)
}

export function floodFill(grid, startX, startY, newColor) {
  if (!isInBounds(grid, startX, startY)) return grid
  const targetColor = grid[startY][startX]
  if (targetColor === newColor) return grid

  const newGrid = cloneGrid(grid)
  const stack = [[startX, startY]]
  const visited = new Set()

  while (stack.length > 0) {
    const [x, y] = stack.pop()
    const key = `${x},${y}`
    if (visited.has(key)) continue
    if (!isInBounds(newGrid, x, y)) continue
    if (newGrid[y][x] !== targetColor) continue

    visited.add(key)
    newGrid[y][x] = newColor

    stack.push([x + 1, y])
    stack.push([x - 1, y])
    stack.push([x, y + 1])
    stack.push([x, y - 1])
  }

  return newGrid
}

export function createHistory() {
  return {
    past: [],
    future: [],
  }
}

export function pushHistory(history, currentState) {
  const newPast = [...history.past, currentState]
  if (newPast.length > HISTORY_LIMIT) {
    newPast.shift()
  }
  return {
    past: newPast,
    future: [],
  }
}

export function undo(history, currentState) {
  if (history.past.length === 0) {
    return { state: currentState, history }
  }
  const newPast = [...history.past]
  const previous = newPast.pop()
  const newFuture = [currentState, ...history.future]
  return {
    state: previous,
    history: {
      past: newPast,
      future: newFuture,
    },
  }
}

export function redo(history, currentState) {
  if (history.future.length === 0) {
    return { state: currentState, history }
  }
  const newFuture = [...history.future]
  const next = newFuture.shift()
  const newPast = [...history.past, currentState]
  return {
    state: next,
    history: {
      past: newPast,
      future: newFuture,
    },
  }
}

export function canUndo(history) {
  return history.past.length > 0
}

export function canRedo(history) {
  return history.future.length > 0
}

export function isValidHexColor(color) {
  if (typeof color !== 'string') return false
  return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(color)
}

export function addColorToPalette(palette, color) {
  if (!isValidHexColor(color)) return palette
  if (palette.includes(color)) return palette
  return [...palette, color]
}

export function removeColorFromPalette(palette, color) {
  return palette.filter((c) => c !== color)
}

export function exportToJSON(grid, width, height, palette) {
  return JSON.stringify({
    version: 1,
    width,
    height,
    palette: palette || DEFAULT_PALETTE,
    grid,
  })
}

export function validateAndParseJSON(jsonStr) {
  try {
    const data = JSON.parse(jsonStr)
    if (typeof data !== 'object' || data === null) {
      return { valid: false, error: 'Invalid JSON structure' }
    }
    if (typeof data.width !== 'number' || typeof data.height !== 'number') {
      return { valid: false, error: 'Missing width or height' }
    }
    const sizeCheck = validateGridSize(data.width, data.height)
    if (!sizeCheck.valid) {
      return { valid: false, error: 'Grid size out of range (8-64)' }
    }
    if (!Array.isArray(data.grid)) {
      return { valid: false, error: 'Missing grid data' }
    }
    if (data.grid.length !== data.height) {
      return { valid: false, error: 'Grid height mismatch' }
    }
    for (let y = 0; y < data.grid.length; y++) {
      const row = data.grid[y]
      if (!Array.isArray(row) || row.length !== data.width) {
        return { valid: false, error: 'Grid row size mismatch' }
      }
      for (let x = 0; x < row.length; x++) {
        const cell = row[x]
        if (cell !== null && !isValidHexColor(cell)) {
          return { valid: false, error: `Invalid color at (${x},${y})` }
        }
      }
    }
    const palette = Array.isArray(data.palette) ? data.palette : DEFAULT_PALETTE
    return {
      valid: true,
      data: {
        width: data.width,
        height: data.height,
        grid: data.grid,
        palette,
      },
    }
  } catch {
    return { valid: false, error: 'Invalid JSON format' }
  }
}

export function saveEditorData(data, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function loadEditorData(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return null
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed
  } catch {
    return null
  }
}

export function clearEditorData(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function downloadJSONFile(content, filename = 'pixel-art.json') {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function canvasToPNG(canvas, scale = 1) {
  const tempCanvas = document.createElement('canvas')
  const width = canvas.width
  const height = canvas.height
  tempCanvas.width = width * scale
  tempCanvas.height = height * scale
  const ctx = tempCanvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(canvas, 0, 0, width * scale, height * scale)
  return tempCanvas.toDataURL('image/png')
}

export function downloadPNG(dataUrl, filename = 'pixel-art.png') {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function renderGridToCanvas(canvas, grid, cellSize, showGrid = true, gridLineColor = '#cccccc') {
  const ctx = canvas.getContext('2d')
  const width = grid[0].length
  const height = grid.length
  canvas.width = width * cellSize
  canvas.height = height * cellSize
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = grid[y][x]
      if (color) {
        ctx.fillStyle = color
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
      }
    }
  }

  if (showGrid) {
    ctx.strokeStyle = gridLineColor
    ctx.lineWidth = 1
    for (let x = 0; x <= width; x++) {
      ctx.beginPath()
      ctx.moveTo(x * cellSize + 0.5, 0)
      ctx.lineTo(x * cellSize + 0.5, height * cellSize)
      ctx.stroke()
    }
    for (let y = 0; y <= height; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * cellSize + 0.5)
      ctx.lineTo(width * cellSize, y * cellSize + 0.5)
      ctx.stroke()
    }
  }
}

export function renderPreview(canvas, grid) {
  const ctx = canvas.getContext('2d')
  const width = grid[0].length
  const height = grid.length
  canvas.width = width
  canvas.height = height
  ctx.clearRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = grid[y][x]
      if (color) {
        ctx.fillStyle = color
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
}

export function getCellFromMouseEvent(canvas, grid, event, cellSize, offsetX = 0, offsetY = 0) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const px = (event.clientX - rect.left) * scaleX
  const py = (event.clientY - rect.top) * scaleY
  const x = Math.floor((px - offsetX) / cellSize)
  const y = Math.floor((py - offsetY) / cellSize)
  if (isInBounds(grid, x, y)) {
    return { x, y }
  }
  return null
}

export function calculateCellSize(gridWidth, gridHeight, baseSize) {
  return Math.floor(baseSize / Math.max(gridWidth, gridHeight))
}

export function calculateZoomedCellSize(baseCellSize, zoom) {
  return Math.max(1, Math.floor(baseCellSize * zoom))
}
