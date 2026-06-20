import {
  MIN_ROWS, MAX_ROWS, MIN_COLS, MAX_COLS,
  DEFAULT_ROWS, DEFAULT_COLS,
  MIN_GAP, MAX_GAP, DEFAULT_ROW_GAP, DEFAULT_COL_GAP,
  SIZE_MODES, DEFAULT_SIZE_MODE, DEFAULT_PIXEL_SIZE, DEFAULT_FR_SIZE, DEFAULT_PERCENT_SIZE,
  DEFAULT_JUSTIFY_CONTENT, DEFAULT_ALIGN_CONTENT, DEFAULT_PLACE_ITEMS,
  DEFAULT_CELL_COLOR, PRESET_COLORS,
  generateId,
} from './constants.js'

function isNumericInput(n) {
  if (typeof n === 'number') return Number.isFinite(n)
  if (typeof n === 'string') {
    const trimmed = n.trim()
    return trimmed !== '' && Number.isFinite(Number(trimmed))
  }
  return false
}

export function clampRows(n) {
  if (!isNumericInput(n)) return DEFAULT_ROWS
  const num = Number(n)
  return Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.floor(num)))
}

export function clampCols(n) {
  if (!isNumericInput(n)) return DEFAULT_COLS
  const num = Number(n)
  return Math.max(MIN_COLS, Math.min(MAX_COLS, Math.floor(num)))
}

export function clampGap(n) {
  const num = Number(n)
  if (!Number.isFinite(num)) return 0
  return Math.max(MIN_GAP, Math.min(MAX_GAP, Math.floor(num)))
}

export function clampSizeValue(value, mode) {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    switch (mode) {
      case SIZE_MODES.PIXEL: return DEFAULT_PIXEL_SIZE
      case SIZE_MODES.PERCENT: return DEFAULT_PERCENT_SIZE
      case SIZE_MODES.FR: return DEFAULT_FR_SIZE
      default: return DEFAULT_FR_SIZE
    }
  }
  switch (mode) {
    case SIZE_MODES.PIXEL: return Math.max(10, Math.min(500, num))
    case SIZE_MODES.PERCENT: return Math.max(1, Math.min(100, num))
    case SIZE_MODES.FR: return Math.max(0.1, Math.min(10, Math.round(num * 10) / 10))
    default: return num
  }
}

export function formatSizeValue(value, mode) {
  const v = clampSizeValue(value, mode)
  switch (mode) {
    case SIZE_MODES.PIXEL: return `${v}px`
    case SIZE_MODES.PERCENT: return `${v}%`
    case SIZE_MODES.FR: return `${v}fr`
    default: return `${v}`
  }
}

export function createDefaultRow() {
  return {
    mode: DEFAULT_SIZE_MODE,
    value: DEFAULT_FR_SIZE,
  }
}

export function createDefaultCol() {
  return {
    mode: DEFAULT_SIZE_MODE,
    value: DEFAULT_FR_SIZE,
  }
}

export function createDefaultCell(col, row) {
  return {
    id: generateId('cell'),
    col,
    row,
    colSpan: 1,
    rowSpan: 1,
    areaName: '',
    backgroundColor: '',
  }
}

export function createInitialConfig() {
  const rows = clampRows(DEFAULT_ROWS)
  const cols = clampCols(DEFAULT_COLS)
  return {
    rows,
    cols,
    rowSizes: Array.from({ length: rows }, () => createDefaultRow()),
    colSizes: Array.from({ length: cols }, () => createDefaultCol()),
    rowGap: DEFAULT_ROW_GAP,
    colGap: DEFAULT_COL_GAP,
    justifyContent: DEFAULT_JUSTIFY_CONTENT,
    alignContent: DEFAULT_ALIGN_CONTENT,
    placeItems: DEFAULT_PLACE_ITEMS,
    cells: buildCellsFromDimensions(rows, cols),
  }
}

export function buildCellsFromDimensions(rows, cols) {
  const r = clampRows(rows)
  const c = clampCols(cols)
  const cells = []
  for (let row = 1; row <= r; row += 1) {
    for (let col = 1; col <= c; col += 1) {
      cells.push(createDefaultCell(col, row))
    }
  }
  return cells
}

export function getCellAtPosition(cells, col, row) {
  if (!Array.isArray(cells)) return null
  return cells.find((c) => {
    if (!c) return false
    const startCol = c.col
    const endCol = c.col + c.colSpan - 1
    const startRow = c.row
    const endRow = c.row + c.rowSpan - 1
    return col >= startCol && col <= endCol && row >= startRow && row <= endRow
  }) || null
}

export function isCellOrigin(cell, col, row) {
  return cell && cell.col === col && cell.row === row
}

function isMergedCell(cell) {
  return cell && (cell.colSpan > 1 || cell.rowSpan > 1)
}

export function getMaxColSpanForCell(cells, cell, totalCols) {
  if (!cell) return 1
  const available = totalCols - cell.col + 1
  if (available <= 1) return 1
  for (let span = 2; span <= available; span += 1) {
    const endCol = cell.col + span - 1
    for (let r = cell.row; r < cell.row + cell.rowSpan; r += 1) {
      for (let c = cell.col + 1; c <= endCol; c += 1) {
        const occupant = getCellAtPosition(cells, c, r)
        if (occupant && occupant.id !== cell.id && isMergedCell(occupant)) {
          return span - 1
        }
      }
    }
  }
  return available
}

export function getMaxRowSpanForCell(cells, cell, totalRows) {
  if (!cell) return 1
  const available = totalRows - cell.row + 1
  if (available <= 1) return 1
  for (let span = 2; span <= available; span += 1) {
    const endRow = cell.row + span - 1
    for (let r = cell.row + 1; r <= endRow; r += 1) {
      for (let c = cell.col; c < cell.col + cell.colSpan; c += 1) {
        const occupant = getCellAtPosition(cells, c, r)
        if (occupant && occupant.id !== cell.id && isMergedCell(occupant)) {
          return span - 1
        }
      }
    }
  }
  return available
}

export function validateSpanChange(cells, cellId, newColSpan, newRowSpan, totalRows, totalCols) {
  const cell = cells.find((c) => c.id === cellId)
  if (!cell) {
    return { valid: false, error: 'Cell not found' }
  }
  if (!Number.isFinite(newColSpan) || !Number.isFinite(newRowSpan)) {
    return { valid: false, error: 'Invalid span values' }
  }
  const cs = Math.max(1, Math.floor(newColSpan))
  const rs = Math.max(1, Math.floor(newRowSpan))

  if (cell.col + cs - 1 > totalCols) {
    return { valid: false, error: `Column span exceeds grid width (max ${totalCols - cell.col + 1})` }
  }
  if (cell.row + rs - 1 > totalRows) {
    return { valid: false, error: `Row span exceeds grid height (max ${totalRows - cell.row + 1})` }
  }

  const endCol = cell.col + cs - 1
  const endRow = cell.row + rs - 1
  for (let r = cell.row; r <= endRow; r += 1) {
    for (let c = cell.col; c <= endCol; c += 1) {
      const occupant = getCellAtPosition(cells, c, r)
      if (occupant && occupant.id !== cellId && isMergedCell(occupant)) {
        return { valid: false, error: `Space already occupied at col=${c}, row=${r}` }
      }
    }
  }
  return { valid: true }
}

export function applySpanChange(cells, cellId, newColSpan, newRowSpan) {
  if (!Array.isArray(cells)) return []
  const cell = cells.find((c) => c.id === cellId)
  if (!cell) return cells

  const updatedCell = {
    ...cell,
    colSpan: Math.max(1, Math.floor(newColSpan)),
    rowSpan: Math.max(1, Math.floor(newRowSpan)),
  }
  return cells.map((c) => (c.id === cellId ? updatedCell : c))
}

export function updateCellProperty(cells, cellId, property, value) {
  if (!Array.isArray(cells)) return []
  return cells.map((c) => {
    if (c.id !== cellId) return c
    return { ...c, [property]: value }
  })
}

export function resizeGrid(config, newRows, newCols) {
  const nr = clampRows(newRows)
  const nc = clampCols(newCols)
  const { cells, rowSizes, colSizes } = config

  const newRowSizes = Array.from({ length: nr }, (_, i) => rowSizes[i] || createDefaultRow())
  const newColSizes = Array.from({ length: nc }, (_, i) => colSizes[i] || createDefaultCol())

  const survivingCells = cells.filter((c) => {
    if (!c) return false
    const endCol = c.col + c.colSpan - 1
    const endRow = c.row + c.rowSpan - 1
    return c.col >= 1 && c.row >= 1 && endCol <= nc && endRow <= nr
  })

  const occupied = new Set()
  survivingCells.forEach((c) => {
    const endCol = c.col + c.colSpan - 1
    const endRow = c.row + c.rowSpan - 1
    for (let r = c.row; r <= endRow; r += 1) {
      for (let col = c.col; col <= endCol; col += 1) {
        occupied.add(`${col},${r}`)
      }
    }
  })

  const newCells = [...survivingCells]
  for (let row = 1; row <= nr; row += 1) {
    for (let col = 1; col <= nc; col += 1) {
      if (!occupied.has(`${col},${row}`)) {
        newCells.push(createDefaultCell(col, row))
      }
    }
  }

  newCells.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    return a.col - b.col
  })

  return {
    ...config,
    rows: nr,
    cols: nc,
    rowSizes: newRowSizes,
    colSizes: newColSizes,
    cells: newCells,
  }
}

export function setUniformRowMode(rowSizes, mode) {
  return rowSizes.map((r) => ({
    ...r,
    mode,
    value: mode === SIZE_MODES.PIXEL ? DEFAULT_PIXEL_SIZE
      : mode === SIZE_MODES.PERCENT ? DEFAULT_PERCENT_SIZE
      : DEFAULT_FR_SIZE,
  }))
}

export function setUniformColMode(colSizes, mode) {
  return colSizes.map((c) => ({
    ...c,
    mode,
    value: mode === SIZE_MODES.PIXEL ? DEFAULT_PIXEL_SIZE
      : mode === SIZE_MODES.PERCENT ? DEFAULT_PERCENT_SIZE
      : DEFAULT_FR_SIZE,
  }))
}

export function setUniformRowValues(rowSizes, value) {
  return rowSizes.map((r) => ({
    ...r,
    value: clampSizeValue(value, r.mode),
  }))
}

export function setUniformColValues(colSizes, value) {
  return colSizes.map((c) => ({
    ...c,
    value: clampSizeValue(value, c.mode),
  }))
}

export function buildTemplateColumns(colSizes) {
  if (!Array.isArray(colSizes) || colSizes.length === 0) return ''
  return colSizes.map((c) => formatSizeValue(c.value, c.mode)).join(' ')
}

export function buildTemplateRows(rowSizes) {
  if (!Array.isArray(rowSizes) || rowSizes.length === 0) return ''
  return rowSizes.map((r) => formatSizeValue(r.value, r.mode)).join(' ')
}

export function clearAllCellColors(cells) {
  if (!Array.isArray(cells)) return []
  return cells.map((c) => ({ ...c, backgroundColor: '' }))
}

export function randomizeCellColors(cells) {
  if (!Array.isArray(cells)) return []
  const palette = PRESET_COLORS
  return cells.map((c) => ({
    ...c,
    backgroundColor: palette[Math.floor(Math.random() * palette.length)],
  }))
}

export function generateContainerCSS(config) {
  if (!config) return ''
  const {
    colSizes, rowSizes, rowGap, colGap,
    justifyContent, alignContent, placeItems,
  } = config
  const lines = [
    '.grid-container {',
    '  display: grid;',
    `  grid-template-columns: ${buildTemplateColumns(colSizes)};`,
    `  grid-template-rows: ${buildTemplateRows(rowSizes)};`,
    `  row-gap: ${clampGap(rowGap)}px;`,
    `  column-gap: ${clampGap(colGap)}px;`,
    `  justify-content: ${justifyContent || DEFAULT_JUSTIFY_CONTENT};`,
    `  align-content: ${alignContent || DEFAULT_ALIGN_CONTENT};`,
    `  place-items: ${placeItems || DEFAULT_PLACE_ITEMS};`,
    `  width: 100%;`,
    '}',
  ]
  return lines.join('\n')
}

export function generateChildrenCSS(config) {
  if (!config || !Array.isArray(config.cells)) return ''
  const { cells } = config
  const lines = []
  const originCells = []

  cells.forEach((cell, idx) => {
    if (!cell) return
    const hasSpan = cell.colSpan > 1 || cell.rowSpan > 1
    const hasColor = cell.backgroundColor && cell.backgroundColor !== ''
    const hasArea = cell.areaName && cell.areaName.trim() !== ''
    if (!hasSpan && !hasColor && !hasArea) return
    originCells.push({ cell, idx })
  })

  if (originCells.length === 0) return ''

  lines.push('')
  originCells.forEach(({ cell, idx }) => {
    const selector = `.grid-item-${idx + 1}`
    const rules = []
    const trimmedAreaName = cell.areaName?.trim()
    if (trimmedAreaName) {
      rules.push(`  grid-area: ${trimmedAreaName};`)
    }
    if (cell.colSpan > 1) {
      rules.push(`  grid-column: ${cell.col} / span ${cell.colSpan};`)
    } else if (trimmedAreaName) {
      rules.push(`  grid-column: ${cell.col};`)
    }
    if (cell.rowSpan > 1) {
      rules.push(`  grid-row: ${cell.row} / span ${cell.rowSpan};`)
    } else if (trimmedAreaName) {
      rules.push(`  grid-row: ${cell.row};`)
    }
    if (cell.backgroundColor) {
      rules.push(`  background-color: ${cell.backgroundColor};`)
    }
    if (rules.length > 0) {
      lines.push(`${selector} {`)
      rules.forEach((r) => lines.push(r))
      lines.push('}')
      lines.push('')
    }
  })

  return lines.join('\n').trim()
}

export function generateBaseItemCSS() {
  return [
    '.grid-item {',
    '  min-height: 40px;',
    '  border: 1px solid rgba(0, 0, 0, 0.1);',
    '  background-color: #E5E7EB;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  box-sizing: border-box;',
    '}',
  ].join('\n')
}

export function generateFullCSS(config, options = {}) {
  if (!config) return ''
  const { containerOnly = false, includeBase = true } = options
  const parts = []
  parts.push('/* Container Styles */')
  parts.push(generateContainerCSS(config))
  if (!containerOnly) {
    if (includeBase) {
      parts.push('')
      parts.push('/* Base Item Styles */')
      parts.push(generateBaseItemCSS())
    }
    const children = generateChildrenCSS(config)
    if (children) {
      parts.push('')
      parts.push('/* Individual Item Styles */')
      parts.push(children)
    }
  }
  return parts.join('\n')
}

export function generateHTML(config) {
  if (!config || !Array.isArray(config.cells)) return ''
  const { cells } = config
  const lines = ['<div class="grid-container">']
  let idx = 0
  cells.forEach((cell) => {
    if (!cell) return
    if (!isCellOrigin(cell, cell.col, cell.row)) return
    idx += 1
    const hasSpan = cell.colSpan > 1 || cell.rowSpan > 1
    const hasColor = cell.backgroundColor && cell.backgroundColor !== ''
    const hasArea = cell.areaName && cell.areaName.trim() !== ''
    const needsClass = hasSpan || hasColor || hasArea
    const classAttr = needsClass ? ` class="grid-item grid-item-${idx}"` : ' class="grid-item"'
    const label = cell.colSpan > 1 || cell.rowSpan > 1
      ? `${cell.colSpan}×${cell.rowSpan}`
      : `${idx}`
    lines.push(`  <div${classAttr}>${label}</div>`)
  })
  lines.push('</div>')
  return lines.join('\n')
}

export function generateFullCode(config) {
  const css = generateFullCSS(config)
  const html = generateHTML(config)
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <title>CSS Grid Layout</title>',
    '  <style>',
    css.split('\n').map((l) => `    ${l}`).join('\n'),
    '  </style>',
    '</head>',
    '<body>',
    html.split('\n').map((l) => `  ${l}`).join('\n'),
    '</body>',
    '</html>',
  ].join('\n')
}

export function serializeConfig(config, name = 'Untitled Layout') {
  const data = {
    version: 1,
    name,
    timestamp: Date.now(),
    config,
  }
  return JSON.stringify(data, null, 2)
}

export function validateAndNormalizeCell(cell) {
  if (!cell || typeof cell !== 'object') return null
  const colNum = Number(cell.col)
  const rowNum = Number(cell.row)
  if (!Number.isFinite(colNum) || !Number.isFinite(rowNum)) return null
  const colSpanNum = Number(cell.colSpan)
  const rowSpanNum = Number(cell.rowSpan)
  const normalized = {
    id: cell.id || generateId('cell'),
    col: Math.max(1, Math.floor(colNum)),
    row: Math.max(1, Math.floor(rowNum)),
    colSpan: Math.max(1, Number.isFinite(colSpanNum) ? Math.floor(colSpanNum) : 1),
    rowSpan: Math.max(1, Number.isFinite(rowSpanNum) ? Math.floor(rowSpanNum) : 1),
    areaName: typeof cell.areaName === 'string' ? cell.areaName : '',
    backgroundColor: typeof cell.backgroundColor === 'string' ? cell.backgroundColor : '',
  }
  return normalized
}

export function validateAndNormalizeSize(size) {
  if (!size || typeof size !== 'object') return createDefaultRow()
  const mode = Object.values(SIZE_MODES).includes(size.mode) ? size.mode : DEFAULT_SIZE_MODE
  return {
    mode,
    value: clampSizeValue(size.value, mode),
  }
}

export function deserializeConfig(jsonString) {
  try {
    const parsed = JSON.parse(jsonString)
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Root must be an object' }
    }
    if (!parsed.config || typeof parsed.config !== 'object') {
      return { valid: false, error: 'Missing "config" field' }
    }
    const c = parsed.config

    const rows = clampRows(c.rows)
    const cols = clampCols(c.cols)
    if (!Array.isArray(c.rowSizes)) {
      return { valid: false, error: 'rowSizes must be an array' }
    }
    if (!Array.isArray(c.colSizes)) {
      return { valid: false, error: 'colSizes must be an array' }
    }
    if (!Array.isArray(c.cells)) {
      return { valid: false, error: 'cells must be an array' }
    }

    const normalizedCells = c.cells
      .map(validateAndNormalizeCell)
      .filter((x) => x !== null)

    if (normalizedCells.length === 0) {
      return { valid: false, error: 'No valid cells found' }
    }

    const normalized = {
      rows,
      cols,
      rowSizes: Array.from({ length: rows }, (_, i) => validateAndNormalizeSize(c.rowSizes[i])),
      colSizes: Array.from({ length: cols }, (_, i) => validateAndNormalizeSize(c.colSizes[i])),
      rowGap: clampGap(c.rowGap),
      colGap: clampGap(c.colGap),
      justifyContent: c.justifyContent || DEFAULT_JUSTIFY_CONTENT,
      alignContent: c.alignContent || DEFAULT_ALIGN_CONTENT,
      placeItems: c.placeItems || DEFAULT_PLACE_ITEMS,
      cells: normalizedCells,
    }

    return {
      valid: true,
      data: {
        name: parsed.name || 'Imported Layout',
        timestamp: parsed.timestamp || Date.now(),
        config: normalized,
      },
    }
  } catch (e) {
    return { valid: false, error: `JSON parse error: ${e.message}` }
  }
}

export function validateImportJSON(jsonString) {
  const result = deserializeConfig(jsonString)
  if (!result.valid) {
    return { ok: false, error: result.error }
  }
  return { ok: true, data: result.data }
}

export function getGridLineNumbers(count) {
  return Array.from({ length: count + 1 }, (_, i) => i + 1)
}

export function getCellGridLines(cell) {
  if (!cell) return null
  return {
    rowStart: cell.row,
    rowEnd: cell.row + cell.rowSpan,
    colStart: cell.col,
    colEnd: cell.col + cell.colSpan,
  }
}

export { DEFAULT_CELL_COLOR, PRESET_COLORS }
