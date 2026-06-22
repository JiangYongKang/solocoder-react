import {
  DEFAULT_GRID_SIZE,
  MIN_GRID_SIZE,
  MAX_GRID_SIZE,
  DEFAULT_FOREGROUND_COLOR,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_GRID_LINE_COLOR,
  DEFAULT_CHARACTERS,
  DEFAULT_FONT_FAMILY,
  GRID_LINE_WIDTH,
  EXPORT_FORMAT_VERSION,
  STORAGE_KEY,
} from './constants.js'

export function createEmptyGlyph(size = DEFAULT_GRID_SIZE) {
  const clampedSize = Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, size))
  const grid = []
  for (let y = 0; y < clampedSize; y++) {
    const row = []
    for (let x = 0; x < clampedSize; x++) {
      row.push(0)
    }
    grid.push(row)
  }
  return grid
}

export function cloneGlyph(glyph) {
  if (!glyph || !Array.isArray(glyph)) return []
  return glyph.map(row => [...row])
}

export function setPixel(glyph, x, y, value = 1) {
  if (!glyph || !Array.isArray(glyph)) return glyph
  const size = glyph.length
  if (x < 0 || x >= size || y < 0 || y >= size) return glyph
  const cloned = cloneGlyph(glyph)
  cloned[y][x] = value ? 1 : 0
  return cloned
}

export function getPixel(glyph, x, y) {
  if (!glyph || !Array.isArray(glyph)) return 0
  const size = glyph.length
  if (x < 0 || x >= size || y < 0 || y >= size) return 0
  return glyph[y][x]
}

export function togglePixel(glyph, x, y) {
  if (!glyph || !Array.isArray(glyph)) return glyph
  const size = glyph.length
  if (x < 0 || x >= size || y < 0 || y >= size) return glyph
  const current = getPixel(glyph, x, y)
  return setPixel(glyph, x, y, current ? 0 : 1)
}

export function clearGlyph(glyph) {
  if (!glyph || !Array.isArray(glyph)) return glyph
  const size = glyph.length
  return createEmptyGlyph(size)
}

export function resizeGlyph(glyph, newSize, preserveContent = true) {
  const clampedSize = Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, newSize))
  const newGlyph = createEmptyGlyph(clampedSize)

  if (!preserveContent || !glyph || !Array.isArray(glyph)) {
    return newGlyph
  }

  const oldSize = glyph.length
  const offsetX = Math.floor((clampedSize - oldSize) / 2)
  const offsetY = Math.floor((clampedSize - oldSize) / 2)

  for (let y = 0; y < oldSize; y++) {
    for (let x = 0; x < oldSize; x++) {
      const newX = x + offsetX
      const newY = y + offsetY
      if (newX >= 0 && newX < clampedSize && newY >= 0 && newY < clampedSize) {
        newGlyph[newY][newX] = glyph[y][x]
      }
    }
  }

  return newGlyph
}

export function encodeGlyphToBase64(glyph) {
  if (!glyph || !Array.isArray(glyph)) return ''
  const bits = []
  for (let y = 0; y < glyph.length; y++) {
    for (let x = 0; x < glyph[y].length; x++) {
      bits.push(glyph[y][x] ? '1' : '0')
    }
  }
  const bitString = bits.join('')
  const bytes = []
  for (let i = 0; i < bitString.length; i += 8) {
    const chunk = bitString.slice(i, i + 8).padEnd(8, '0')
    bytes.push(parseInt(chunk, 2))
  }
  return btoa(String.fromCharCode(...bytes))
}

export function decodeGlyphFromBase64(base64, size = DEFAULT_GRID_SIZE) {
  if (!base64 || typeof base64 !== 'string') {
    return createEmptyGlyph(size)
  }
  try {
    const clampedSize = Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, size))
    const binaryString = atob(base64)
    const bits = []
    for (let i = 0; i < binaryString.length; i++) {
      const charCode = binaryString.charCodeAt(i)
      bits.push(charCode.toString(2).padStart(8, '0'))
    }
    const allBits = bits.join('')
    const glyph = createEmptyGlyph(clampedSize)
    const totalPixels = clampedSize * clampedSize
    for (let i = 0; i < totalPixels && i < allBits.length; i++) {
      const y = Math.floor(i / clampedSize)
      const x = i % clampedSize
      glyph[y][x] = allBits[i] === '1' ? 1 : 0
    }
    return glyph
  } catch (e) {
    return createEmptyGlyph(size)
  }
}

export function encodeGlyphToHex(glyph) {
  if (!glyph || !Array.isArray(glyph)) return ''
  const hexRows = []
  for (let y = 0; y < glyph.length; y++) {
    let rowHex = ''
    for (let x = 0; x < glyph[y].length; x += 4) {
      let nibble = 0
      for (let i = 0; i < 4; i++) {
        if (x + i < glyph[y].length && glyph[y][x + i]) {
          nibble |= (1 << (3 - i))
        }
      }
      rowHex += nibble.toString(16).toUpperCase()
    }
    hexRows.push(rowHex)
  }
  return hexRows.join(',')
}

export function glyphToCSSDataURL(glyph, foregroundColor = DEFAULT_FOREGROUND_COLOR) {
  if (!glyph || !Array.isArray(glyph)) return ''
  if (typeof document === 'undefined') {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  }
  const size = glyph.length
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = foregroundColor
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (glyph[y][x]) {
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
  return canvas.toDataURL('image/png')
}

export function generateCSSFontFace(glyphs, fontFamily = DEFAULT_FONT_FAMILY, foregroundColor = DEFAULT_FOREGROUND_COLOR) {
  if (!glyphs || typeof glyphs !== 'object') {
    return ''
  }

  const glyphEntries = Object.entries(glyphs)
  if (glyphEntries.length === 0) {
    return ''
  }

  const sampleGlyph = glyphEntries[0][1]
  const size = sampleGlyph?.glyph?.length || DEFAULT_GRID_SIZE
  const sampleDataURL = glyphToCSSDataURL(sampleGlyph?.glyph || createEmptyGlyph(size), foregroundColor)

  const glyphData = []
  for (const [char, data] of glyphEntries) {
    if (data?.glyph) {
      const codePoint = char.codePointAt(0)
      const base64 = encodeGlyphToBase64(data.glyph)
      glyphData.push(`    /* ${char} (U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}) */
    "${codePoint}": "${base64}"`)
    }
  }

  return `@font-face {
  font-family: "${fontFamily}";
  src: url("${sampleDataURL}") format("embedded-opentype"),
       url("${sampleDataURL}") format("woff2"),
       url("${sampleDataURL}") format("woff"),
       url("${sampleDataURL}") format("truetype");
  font-weight: normal;
  font-style: normal;
}

/* ${fontFamily} - Pixel Font Data */
/* Grid Size: ${size}x${size} */
/* Characters: ${Object.keys(glyphs).length} */
:root {
  --pixel-font-family: "${fontFamily}";
  --pixel-font-size: ${size};
  --pixel-font-glyphs: {
${glyphData.join(',\n')}
  };
}

/* Usage:
   .pixel-text {
     font-family: var(--pixel-font-family);
     font-size: calc(var(--pixel-font-size) * 2px);
     image-rendering: pixelated;
   }
*/`
}

export function exportToJSON(glyphs, gridSize, fontFamily = DEFAULT_FONT_FAMILY) {
  const data = {
    version: EXPORT_FORMAT_VERSION,
    gridSize,
    fontFamily,
    createdAt: new Date().toISOString(),
    glyphs: {},
  }

  for (const [char, glyphData] of Object.entries(glyphs || {})) {
    if (glyphData?.glyph) {
      data.glyphs[char] = {
        glyph: glyphData.glyph,
        base64: encodeGlyphToBase64(glyphData.glyph),
        hex: encodeGlyphToHex(glyphData.glyph),
      }
    }
  }

  return JSON.stringify(data, null, 2)
}

export function validateAndParseJSON(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return { valid: false, error: '无效的 JSON 字符串' }
  }

  try {
    const data = JSON.parse(jsonString)

    if (data.version !== EXPORT_FORMAT_VERSION) {
      return { valid: false, error: `不支持的版本: ${data.version}` }
    }

    if (!data.gridSize || data.gridSize < MIN_GRID_SIZE || data.gridSize > MAX_GRID_SIZE) {
      return { valid: false, error: `网格尺寸必须在 ${MIN_GRID_SIZE} 到 ${MAX_GRID_SIZE} 之间` }
    }

    if (!data.glyphs || typeof data.glyphs !== 'object') {
      return { valid: false, error: '缺少字形数据' }
    }

    const glyphs = {}
    for (const [char, glyphData] of Object.entries(data.glyphs)) {
      if (!glyphData?.glyph || !Array.isArray(glyphData.glyph)) {
        return { valid: false, error: `字符 "${char}" 的字形数据无效` }
      }
      const glyphSize = glyphData.glyph.length
      if (glyphSize !== data.gridSize) {
        return { valid: false, error: `字符 "${char}" 的字形尺寸 (${glyphSize}) 与网格尺寸 (${data.gridSize}) 不匹配` }
      }
      for (const row of glyphData.glyph) {
        if (!Array.isArray(row) || row.length !== data.gridSize) {
          return { valid: false, error: `字符 "${char}" 的字形数据格式无效` }
        }
        for (const cell of row) {
          if (cell !== 0 && cell !== 1) {
            return { valid: false, error: `字符 "${char}" 的字形包含无效的像素值` }
          }
        }
      }
      glyphs[char] = { glyph: glyphData.glyph }
    }

    return {
      valid: true,
      data: {
        gridSize: data.gridSize,
        fontFamily: data.fontFamily || DEFAULT_FONT_FAMILY,
        glyphs,
      },
    }
  } catch (e) {
    return { valid: false, error: `JSON 解析失败: ${e.message}` }
  }
}

export function initializeGlyphs(characters = DEFAULT_CHARACTERS, size = DEFAULT_GRID_SIZE) {
  const glyphs = {}
  for (const char of characters) {
    glyphs[char] = {
      glyph: createEmptyGlyph(size),
    }
  }
  return glyphs
}

export function addCharacter(glyphs, char, size = DEFAULT_GRID_SIZE) {
  if (!char || typeof char !== 'string' || char.length === 0) {
    return glyphs
  }
  if (glyphs[char]) {
    return glyphs
  }
  return {
    ...glyphs,
    [char]: {
      glyph: createEmptyGlyph(size),
    },
  }
}

export function removeCharacter(glyphs, char) {
  if (!glyphs || !char || !glyphs[char]) {
    return glyphs
  }
  const newGlyphs = { ...glyphs }
  delete newGlyphs[char]
  return newGlyphs
}

export function renderGlyphToCanvas(canvas, glyph, cellSize, showGrid = true, gridLineColor = DEFAULT_GRID_LINE_COLOR, foregroundColor = DEFAULT_FOREGROUND_COLOR, backgroundColor = DEFAULT_BACKGROUND_COLOR) {
  if (!canvas || !glyph || !Array.isArray(glyph)) return

  const size = glyph.length
  const totalSize = size * cellSize

  canvas.width = totalSize
  canvas.height = totalSize

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, totalSize, totalSize)

  ctx.fillStyle = foregroundColor
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (glyph[y][x]) {
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
      }
    }
  }

  if (showGrid && cellSize > 4) {
    ctx.strokeStyle = gridLineColor
    ctx.lineWidth = GRID_LINE_WIDTH
    for (let i = 0; i <= size; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellSize, 0)
      ctx.lineTo(i * cellSize, totalSize)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * cellSize)
      ctx.lineTo(totalSize, i * cellSize)
      ctx.stroke()
    }
  }
}

export function renderPreviewText(canvas, text, glyphs, cellSize, characterSpacing = 1, foregroundColor = DEFAULT_FOREGROUND_COLOR, backgroundColor = DEFAULT_BACKGROUND_COLOR) {
  if (!canvas || !text || !glyphs) return

  const chars = Array.from(text)
  const glyphSize = Object.values(glyphs)[0]?.glyph?.length || DEFAULT_GRID_SIZE
  const charWidth = glyphSize * cellSize
  const spacing = characterSpacing * cellSize
  const totalWidth = chars.length * charWidth + (chars.length - 1) * spacing
  const totalHeight = glyphSize * cellSize

  canvas.width = totalWidth
  canvas.height = totalHeight

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, totalWidth, totalHeight)

  ctx.fillStyle = foregroundColor
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    const glyphData = glyphs[char]?.glyph || createEmptyGlyph(glyphSize)
    const offsetX = i * (charWidth + spacing)

    for (let y = 0; y < glyphSize; y++) {
      for (let x = 0; x < glyphSize; x++) {
        if (glyphData[y][x]) {
          ctx.fillRect(offsetX + x * cellSize, y * cellSize, cellSize, cellSize)
        }
      }
    }
  }
}

export function getCellFromMouseEvent(canvas, glyph, event, cellSize) {
  if (!canvas || !glyph || !event) return null

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  const x = Math.floor(((event.clientX - rect.left) * scaleX) / cellSize)
  const y = Math.floor(((event.clientY - rect.top) * scaleY) / cellSize)

  const size = glyph.length
  if (x < 0 || x >= size || y < 0 || y >= size) return null

  return { x, y }
}

export function copyToClipboard(text) {
  if (!text || typeof text !== 'string') return false
  try {
    navigator.clipboard.writeText(text)
    return true
  } catch (e) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch (err) {
      document.body.removeChild(textarea)
      return false
    }
  }
}

export function downloadJSONFile(jsonString, filename) {
  if (!jsonString || typeof jsonString !== 'string') return
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'pixel-font.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function safeGetItem(key, fallback = null, storage = localStorage) {
  try {
    const item = storage?.getItem(key)
    if (!item) return fallback
    return JSON.parse(item)
  } catch (e) {
    return fallback
  }
}

export function safeSetItem(key, value, storage = localStorage) {
  try {
    storage?.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    return false
  }
}

export function saveFontData(data, storage = localStorage) {
  return safeSetItem(STORAGE_KEY, data, storage)
}

export function loadFontData(storage = localStorage) {
  return safeGetItem(STORAGE_KEY, null, storage)
}

export function clearFontData(storage = localStorage) {
  try {
    storage?.removeItem(STORAGE_KEY)
    return true
  } catch (e) {
    return false
  }
}

export function validateGridSize(size) {
  if (typeof size === 'number' && !Number.isInteger(size)) {
    return { valid: false, size: DEFAULT_GRID_SIZE }
  }
  const num = parseInt(size, 10)
  if (isNaN(num) || !Number.isInteger(num)) {
    return { valid: false, size: DEFAULT_GRID_SIZE }
  }
  if (num < MIN_GRID_SIZE || num > MAX_GRID_SIZE) {
    return { valid: false, size: Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, num)) }
  }
  return { valid: true, size: num }
}

export function isGlyphEmpty(glyph) {
  if (!glyph || !Array.isArray(glyph)) return true
  for (let y = 0; y < glyph.length; y++) {
    for (let x = 0; x < glyph[y].length; x++) {
      if (glyph[y][x]) return false
    }
  }
  return true
}

export function countFilledPixels(glyph) {
  if (!glyph || !Array.isArray(glyph)) return 0
  let count = 0
  for (let y = 0; y < glyph.length; y++) {
    for (let x = 0; x < glyph[y].length; x++) {
      if (glyph[y][x]) count++
    }
  }
  return count
}

export function flipGlyphHorizontal(glyph) {
  if (!glyph || !Array.isArray(glyph)) return glyph
  const cloned = cloneGlyph(glyph)
  for (let y = 0; y < cloned.length; y++) {
    cloned[y].reverse()
  }
  return cloned
}

export function flipGlyphVertical(glyph) {
  if (!glyph || !Array.isArray(glyph)) return glyph
  const cloned = cloneGlyph(glyph)
  cloned.reverse()
  return cloned
}

export function rotateGlyph90(glyph) {
  if (!glyph || !Array.isArray(glyph)) return glyph
  const size = glyph.length
  const rotated = createEmptyGlyph(size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      rotated[x][size - 1 - y] = glyph[y][x]
    }
  }
  return rotated
}

export function shiftGlyph(glyph, direction, amount = 1) {
  if (!glyph || !Array.isArray(glyph) || amount <= 0) return glyph
  const size = glyph.length
  const shifted = createEmptyGlyph(size)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!glyph[y][x]) continue
      let newX = x
      let newY = y
      switch (direction) {
        case 'left':
          newX = x - amount
          break
        case 'right':
          newX = x + amount
          break
        case 'up':
          newY = y - amount
          break
        case 'down':
          newY = y + amount
          break
        default:
          break
      }
      if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
        shifted[newY][newX] = 1
      }
    }
  }
  return shifted
}

export function getCharacterFromCodePoint(codePoint) {
  const num = parseInt(codePoint, 16)
  if (isNaN(num)) return null
  try {
    return String.fromCodePoint(num)
  } catch (e) {
    return null
  }
}

export function getCodePointString(char) {
  if (!char || typeof char !== 'string') return ''
  const code = char.codePointAt(0)
  return `U+${code.toString(16).toUpperCase().padStart(4, '0')}`
}
