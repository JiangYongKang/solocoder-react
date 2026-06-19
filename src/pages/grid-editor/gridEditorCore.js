import {
  DEFAULT_COLS,
  DEFAULT_ROWS,
  DEFAULT_CELL_WIDTH,
  DEFAULT_CELL_HEIGHT,
  DEFAULT_HORIZONTAL_ALIGN,
  DEFAULT_VERTICAL_ALIGN,
  DEFAULT_BORDER_COLOR,
  DEFAULT_BORDER_WIDTH,
  DEFAULT_BORDER_STYLE,
  MIN_COLS,
  MAX_COLS,
  MIN_ROWS,
  MAX_ROWS,
  MIN_CELL_WIDTH,
  MAX_CELL_WIDTH,
  MIN_CELL_HEIGHT,
  MAX_CELL_HEIGHT,
  HORIZONTAL_ALIGN,
  VERTICAL_ALIGN,
  STORAGE_KEY,
} from './constants'

let idCounter = 0

export function generateId(prefix = 'cell') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function createDefaultCell(col, row, overrides = {}) {
  return {
    id: generateId(),
    col,
    row,
    colSpan: 1,
    rowSpan: 1,
    horizontalAlign: DEFAULT_HORIZONTAL_ALIGN,
    verticalAlign: DEFAULT_VERTICAL_ALIGN,
    borderColor: DEFAULT_BORDER_COLOR,
    borderWidth: DEFAULT_BORDER_WIDTH,
    borderStyle: DEFAULT_BORDER_STYLE,
    ...overrides,
  }
}

export function createInitialGrid(cols = DEFAULT_COLS, rows = DEFAULT_ROWS) {
  const safeCols = clampCols(cols)
  const safeRows = clampRows(rows)
  const cells = []

  for (let row = 1; row <= safeRows; row += 1) {
    for (let col = 1; col <= safeCols; col += 1) {
      cells.push(createDefaultCell(col, row))
    }
  }

  return {
    cols: safeCols,
    rows: safeRows,
    cellWidth: DEFAULT_CELL_WIDTH,
    cellHeight: DEFAULT_CELL_HEIGHT,
    cells,
    showGridLines: true,
    autoNumbering: false,
  }
}

export function clampCols(cols) {
  if (typeof cols !== 'number') return DEFAULT_COLS
  return Math.max(MIN_COLS, Math.min(MAX_COLS, Math.floor(cols)))
}

export function clampRows(rows) {
  if (typeof rows !== 'number') return DEFAULT_ROWS
  return Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.floor(rows)))
}

export function clampCellWidth(width) {
  if (typeof width !== 'number') return DEFAULT_CELL_WIDTH
  return Math.max(MIN_CELL_WIDTH, Math.min(MAX_CELL_WIDTH, Math.floor(width)))
}

export function clampCellHeight(height) {
  if (typeof height !== 'number') return DEFAULT_CELL_HEIGHT
  return Math.max(MIN_CELL_HEIGHT, Math.min(MAX_CELL_HEIGHT, Math.floor(height)))
}

export function getCellAtPosition(cells, col, row) {
  if (!Array.isArray(cells)) return null

  for (const cell of cells) {
    if (
      col >= cell.col &&
      col < cell.col + cell.colSpan &&
      row >= cell.row &&
      row < cell.row + cell.rowSpan
    ) {
      return cell
    }
  }
  return null
}

export function getCellsInRect(cells, startCol, startRow, endCol, endRow) {
  if (!Array.isArray(cells)) return []

  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)
  const minRow = Math.min(startRow, endRow)
  const maxRow = Math.max(startRow, endRow)

  const result = []
  const seen = new Set()

  for (let col = minCol; col <= maxCol; col += 1) {
    for (let row = minRow; row <= maxRow; row += 1) {
      const cell = getCellAtPosition(cells, col, row)
      if (cell && !seen.has(cell.id)) {
        const cellEndCol = cell.col + cell.colSpan - 1
        const cellEndRow = cell.row + cell.rowSpan - 1

        if (cell.col >= minCol && cellEndCol <= maxCol &&
            cell.row >= minRow && cellEndRow <= maxRow) {
          result.push(cell)
          seen.add(cell.id)
        } else {
          return null
        }
      }
    }
  }

  return result
}

export function canMergeCells(cells, startCol, startRow, endCol, endRow, gridCols, gridRows) {
  if (!Array.isArray(cells)) return false
  if (startCol < 1 || startRow < 1 || endCol < 1 || endRow < 1) return false
  if (endCol > gridCols || endRow > gridRows) return false

  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)
  const minRow = Math.min(startRow, endRow)
  const maxRow = Math.max(startRow, endRow)

  if (minCol === maxCol && minRow === maxRow) return false

  const cellsInRect = getCellsInRect(cells, minCol, minRow, maxCol, maxRow)
  return cellsInRect !== null && cellsInRect.length > 1
}

export function mergeCells(cells, startCol, startRow, endCol, endRow) {
  if (!Array.isArray(cells)) return []

  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)
  const minRow = Math.min(startRow, endRow)
  const maxRow = Math.max(startRow, endRow)

  const cellsInRect = getCellsInRect(cells, minCol, minRow, maxCol, maxRow)
  if (!cellsInRect || cellsInRect.length <= 1) return cells

  const firstCell = cellsInRect[0]
  const mergedCell = {
    ...firstCell,
    col: minCol,
    row: minRow,
    colSpan: maxCol - minCol + 1,
    rowSpan: maxRow - minRow + 1,
  }

  const idsToRemove = new Set(cellsInRect.map((c) => c.id))
  const newCells = cells.filter((c) => !idsToRemove.has(c.id))
  newCells.push(mergedCell)

  return newCells
}

export function canSplitCell(cell) {
  if (!cell) return false
  return cell.colSpan > 1 || cell.rowSpan > 1
}

export function splitCell(cells, cellId) {
  if (!Array.isArray(cells)) return []

  const cell = cells.find((c) => c.id === cellId)
  if (!cell || !canSplitCell(cell)) return cells

  const newCells = []
  for (let row = cell.row; row < cell.row + cell.rowSpan; row += 1) {
    for (let col = cell.col; col < cell.col + cell.colSpan; col += 1) {
      newCells.push(createDefaultCell(col, row, {
        horizontalAlign: cell.horizontalAlign,
        verticalAlign: cell.verticalAlign,
        borderColor: cell.borderColor,
        borderWidth: cell.borderWidth,
        borderStyle: cell.borderStyle,
      }))
    }
  }

  return [...cells.filter((c) => c.id !== cellId), ...newCells]
}

export function updateGridDimensions(grid, newCols, newRows) {
  if (!grid) return grid

  const safeNewCols = clampCols(newCols)
  const safeNewRows = clampRows(newRows)

  let newCells = [...grid.cells]

  if (safeNewCols < grid.cols || safeNewRows < grid.rows) {
    newCells = newCells.filter((cell) => {
      const cellEndCol = cell.col + cell.colSpan - 1
      const cellEndRow = cell.row + cell.rowSpan - 1
      return cellEndCol <= safeNewCols && cellEndRow <= safeNewRows
    })
  }

  const occupied = new Set()
  newCells.forEach((cell) => {
    for (let r = cell.row; r < cell.row + cell.rowSpan; r += 1) {
      for (let c = cell.col; c < cell.col + cell.colSpan; c += 1) {
        occupied.add(`${c},${r}`)
      }
    }
  })

  for (let row = 1; row <= safeNewRows; row += 1) {
    for (let col = 1; col <= safeNewCols; col += 1) {
      if (!occupied.has(`${col},${row}`)) {
        newCells.push(createDefaultCell(col, row))
        occupied.add(`${col},${row}`)
      }
    }
  }

  newCells.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    return a.col - b.col
  })

  return {
    ...grid,
    cols: safeNewCols,
    rows: safeNewRows,
    cells: newCells,
  }
}

export function updateCellStyle(cells, cellIds, styleUpdates) {
  if (!Array.isArray(cells)) return []
  if (!Array.isArray(cellIds) || !styleUpdates) {
    return cells
  }

  const idSet = new Set(cellIds)
  return cells.map((cell) => {
    if (idSet.has(cell.id)) {
      return { ...cell, ...styleUpdates }
    }
    return cell
  })
}

export function horizontalAlignToCSS(align) {
  switch (align) {
    case HORIZONTAL_ALIGN.LEFT:
      return 'flex-start'
    case HORIZONTAL_ALIGN.RIGHT:
      return 'flex-end'
    case HORIZONTAL_ALIGN.CENTER:
    default:
      return 'center'
  }
}

export function verticalAlignToCSS(align) {
  switch (align) {
    case VERTICAL_ALIGN.TOP:
      return 'flex-start'
    case VERTICAL_ALIGN.BOTTOM:
      return 'flex-end'
    case VERTICAL_ALIGN.CENTER:
    default:
      return 'center'
  }
}

export function generateHTML(grid) {
  if (!grid || !Array.isArray(grid.cells)) return ''

  const lines = ['<div class="grid-container">']

  const sortedCells = [...grid.cells].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    return a.col - b.col
  })

  sortedCells.forEach((cell, index) => {
    const classNames = ['grid-item']
    if (cell.colSpan > 1 || cell.rowSpan > 1) {
      classNames.push(`grid-item-${index + 1}`)
    }

    let content = ''
    if (cell.colSpan > 1 || cell.rowSpan > 1) {
      content = `${cell.colSpan}×${cell.rowSpan}`
    }

    lines.push(`  <div class="${classNames.join(' ')}">${content}</div>`)
  })

  lines.push('</div>')
  return lines.join('\n')
}

export function generateCSS(grid) {
  if (!grid || !Array.isArray(grid.cells)) return ''

  const lines = []

  lines.push('.grid-container {')
  lines.push('  display: grid;')
  lines.push(`  grid-template-columns: repeat(${grid.cols}, ${grid.cellWidth}px);`)
  lines.push(`  grid-template-rows: repeat(${grid.rows}, ${grid.cellHeight}px);`)
  lines.push('  gap: 0;')
  lines.push('}')
  lines.push('')

  lines.push('.grid-item {')
  lines.push('  display: flex;')
  lines.push('  box-sizing: border-box;')
  lines.push('}')
  lines.push('')

  const sortedCells = [...grid.cells].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    return a.col - b.col
  })

  sortedCells.forEach((cell, index) => {
    const needsCustomSelector = cell.colSpan > 1 || cell.rowSpan > 1 ||
      cell.horizontalAlign !== DEFAULT_HORIZONTAL_ALIGN ||
      cell.verticalAlign !== DEFAULT_VERTICAL_ALIGN ||
      cell.borderColor !== DEFAULT_BORDER_COLOR ||
      cell.borderWidth !== DEFAULT_BORDER_WIDTH ||
      cell.borderStyle !== DEFAULT_BORDER_STYLE

    const selector = cell.colSpan > 1 || cell.rowSpan > 1
      ? `.grid-item-${index + 1}`
      : '.grid-item'

    if (needsCustomSelector || index === 0) {
      const cellLines = []

      if (cell.colSpan > 1 || cell.rowSpan > 1) {
        cellLines.push(`  grid-column: ${cell.col} / span ${cell.colSpan};`)
        cellLines.push(`  grid-row: ${cell.row} / span ${cell.rowSpan};`)
      }

      if (cell.horizontalAlign !== DEFAULT_HORIZONTAL_ALIGN || index === 0) {
        cellLines.push(`  justify-content: ${horizontalAlignToCSS(cell.horizontalAlign)};`)
      }
      if (cell.verticalAlign !== DEFAULT_VERTICAL_ALIGN || index === 0) {
        cellLines.push(`  align-items: ${verticalAlignToCSS(cell.verticalAlign)};`)
      }

      cellLines.push(`  border: ${cell.borderWidth}px ${cell.borderStyle} ${cell.borderColor};`)

      if (cellLines.length > 0) {
        lines.push(`${selector} {`)
        lines.push(...cellLines)
        lines.push('}')
        lines.push('')
      }
    }
  })

  return lines.join('\n').trim() + '\n'
}

export function generateFullCode(grid) {
  const html = generateHTML(grid)
  const css = generateCSS(grid)

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grid Layout</title>
  <style>
${css.split('\n').map((line) => `    ${line}`).join('\n')}
  </style>
</head>
<body>
${html.split('\n').map((line) => `  ${line}`).join('\n')}
</body>
</html>`
}

export function loadFromStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) {
    return { data: null, error: 'localStorage 不可用' }
  }

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) {
      return { data: null, error: null }
    }

    const parsed = JSON.parse(raw)

    if (!parsed || typeof parsed !== 'object') {
      return { data: null, error: '存储数据格式损坏' }
    }

    const { cols, rows, cellWidth, cellHeight, cells, showGridLines, autoNumbering } = parsed

    if (typeof cols !== 'number' || typeof rows !== 'number') {
      return { data: null, error: '存储数据格式损坏：缺少行列数' }
    }

    if (!Array.isArray(cells)) {
      return { data: null, error: '存储数据格式损坏：缺少单元格数组' }
    }

    for (const cell of cells) {
      if (!cell || typeof cell !== 'object' || !cell.id) {
        return { data: null, error: '存储数据格式损坏：无效的单元格数据' }
      }
    }

    return {
      data: {
        cols: clampCols(cols),
        rows: clampRows(rows),
        cellWidth: clampCellWidth(cellWidth ?? DEFAULT_CELL_WIDTH),
        cellHeight: clampCellHeight(cellHeight ?? DEFAULT_CELL_HEIGHT),
        cells,
        showGridLines: typeof showGridLines === 'boolean' ? showGridLines : true,
        autoNumbering: typeof autoNumbering === 'boolean' ? autoNumbering : false,
      },
      error: null,
    }
  } catch (e) {
    const msg = e?.message ? `: ${e.message}` : ''
    return { data: null, error: `读取存储数据失败${msg}` }
  }
}

export function saveToStorage(grid, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) {
    return { success: false, error: 'localStorage 不可用' }
  }

  try {
    const data = {
      cols: grid?.cols ?? DEFAULT_COLS,
      rows: grid?.rows ?? DEFAULT_ROWS,
      cellWidth: grid?.cellWidth ?? DEFAULT_CELL_WIDTH,
      cellHeight: grid?.cellHeight ?? DEFAULT_CELL_HEIGHT,
      cells: grid?.cells ?? [],
      showGridLines: grid?.showGridLines ?? true,
      autoNumbering: grid?.autoNumbering ?? false,
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return { success: true, error: null }
  } catch (e) {
    const msg = e?.message ? `: ${e.message}` : ''
    return { success: false, error: `保存数据失败${msg}` }
  }
}

export function clearStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) {
    return { success: false, error: 'localStorage 不可用' }
  }

  try {
    storage.removeItem(STORAGE_KEY)
    return { success: true, error: null }
  } catch (e) {
    const msg = e?.message ? `: ${e.message}` : ''
    return { success: false, error: `清除存储失败${msg}` }
  }
}
