import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  HORIZONTAL_ALIGN,
  VERTICAL_ALIGN,
  BORDER_STYLE,
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
} from '../../grid-editor/constants'
import {
  generateId,
  createDefaultCell,
  createInitialGrid,
  clampCols,
  clampRows,
  clampCellWidth,
  clampCellHeight,
  getCellAtPosition,
  getCellsInRect,
  canMergeCells,
  mergeCells,
  canSplitCell,
  splitCell,
  updateGridDimensions,
  updateCellStyle,
  horizontalAlignToCSS,
  verticalAlignToCSS,
  generateHTML,
  generateCSS,
  generateFullCode,
  loadFromStorage,
  saveToStorage,
  clearStorage,
} from '../../grid-editor/gridEditorCore'

function createMockLocalStorage() {
  const store = new Map()
  return {
    get length() {
      return store.size
    },
    key: (i) => {
      const keys = Array.from(store.keys())
      return keys[i] ?? null
    },
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value))
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}

describe('generateId', () => {
  it('should generate string ids with prefix', () => {
    const id = generateId('test')
    expect(typeof id).toBe('string')
    expect(id.startsWith('test_')).toBe(true)
  })

  it('should generate unique ids', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i += 1) {
      ids.add(generateId('cell'))
    }
    expect(ids.size).toBe(100)
  })

  it('should use default prefix "cell"', () => {
    const id = generateId()
    expect(id.startsWith('cell_')).toBe(true)
  })
})

describe('createDefaultCell', () => {
  it('should create a cell with default values', () => {
    const cell = createDefaultCell(1, 1)
    expect(cell.id).toBeDefined()
    expect(cell.col).toBe(1)
    expect(cell.row).toBe(1)
    expect(cell.colSpan).toBe(1)
    expect(cell.rowSpan).toBe(1)
    expect(cell.horizontalAlign).toBe(DEFAULT_HORIZONTAL_ALIGN)
    expect(cell.verticalAlign).toBe(DEFAULT_VERTICAL_ALIGN)
    expect(cell.borderColor).toBe(DEFAULT_BORDER_COLOR)
    expect(cell.borderWidth).toBe(DEFAULT_BORDER_WIDTH)
    expect(cell.borderStyle).toBe(DEFAULT_BORDER_STYLE)
  })

  it('should override default values with overrides', () => {
    const overrides = {
      colSpan: 2,
      rowSpan: 3,
      horizontalAlign: HORIZONTAL_ALIGN.LEFT,
      borderColor: '#ff0000',
    }
    const cell = createDefaultCell(2, 3, overrides)
    expect(cell.col).toBe(2)
    expect(cell.row).toBe(3)
    expect(cell.colSpan).toBe(2)
    expect(cell.rowSpan).toBe(3)
    expect(cell.horizontalAlign).toBe(HORIZONTAL_ALIGN.LEFT)
    expect(cell.borderColor).toBe('#ff0000')
  })
})

describe('createInitialGrid', () => {
  it('should create a 3x3 grid by default', () => {
    const grid = createInitialGrid()
    expect(grid.cols).toBe(DEFAULT_COLS)
    expect(grid.rows).toBe(DEFAULT_ROWS)
    expect(grid.cellWidth).toBe(DEFAULT_CELL_WIDTH)
    expect(grid.cellHeight).toBe(DEFAULT_CELL_HEIGHT)
    expect(grid.cells).toHaveLength(9)
    expect(grid.showGridLines).toBe(true)
    expect(grid.autoNumbering).toBe(false)
  })

  it('should create grid with custom dimensions', () => {
    const grid = createInitialGrid(4, 5)
    expect(grid.cols).toBe(4)
    expect(grid.rows).toBe(5)
    expect(grid.cells).toHaveLength(20)
  })

  it('should clamp dimensions to valid range', () => {
    const grid1 = createInitialGrid(0, 0)
    expect(grid1.cols).toBe(MIN_COLS)
    expect(grid1.rows).toBe(MIN_ROWS)

    const grid2 = createInitialGrid(100, 100)
    expect(grid2.cols).toBe(MAX_COLS)
    expect(grid2.rows).toBe(MAX_ROWS)
  })

  it('should handle non-numeric input', () => {
    const grid = createInitialGrid('abc', null)
    expect(grid.cols).toBe(DEFAULT_COLS)
    expect(grid.rows).toBe(DEFAULT_ROWS)
  })

  it('should create cells in correct positions', () => {
    const grid = createInitialGrid(2, 2)
    const positions = grid.cells.map((c) => `${c.col},${c.row}`).sort()
    expect(positions).toEqual(['1,1', '1,2', '2,1', '2,2'])
  })
})

describe('clamp functions', () => {
  describe('clampCols', () => {
    it('should clamp to min and max', () => {
      expect(clampCols(0)).toBe(MIN_COLS)
      expect(clampCols(100)).toBe(MAX_COLS)
      expect(clampCols(6)).toBe(6)
    })

    it('should return default for invalid input', () => {
      expect(clampCols('abc')).toBe(DEFAULT_COLS)
      expect(clampCols(null)).toBe(DEFAULT_COLS)
      expect(clampCols(undefined)).toBe(DEFAULT_COLS)
    })
  })

  describe('clampRows', () => {
    it('should clamp to min and max', () => {
      expect(clampRows(0)).toBe(MIN_ROWS)
      expect(clampRows(100)).toBe(MAX_ROWS)
      expect(clampRows(6)).toBe(6)
    })

    it('should return default for invalid input', () => {
      expect(clampRows('abc')).toBe(DEFAULT_ROWS)
      expect(clampRows(null)).toBe(DEFAULT_ROWS)
    })
  })

  describe('clampCellWidth', () => {
    it('should clamp to valid range', () => {
      expect(clampCellWidth(10)).toBe(40)
      expect(clampCellWidth(300)).toBe(200)
      expect(clampCellWidth(100)).toBe(100)
    })

    it('should return default for invalid input', () => {
      expect(clampCellWidth('abc')).toBe(DEFAULT_CELL_WIDTH)
    })
  })

  describe('clampCellHeight', () => {
    it('should clamp to valid range', () => {
      expect(clampCellHeight(10)).toBe(40)
      expect(clampCellHeight(300)).toBe(200)
      expect(clampCellHeight(100)).toBe(100)
    })

    it('should return default for invalid input', () => {
      expect(clampCellHeight('abc')).toBe(DEFAULT_CELL_HEIGHT)
    })
  })
})

describe('getCellAtPosition', () => {
  let grid

  beforeEach(() => {
    grid = createInitialGrid(3, 3)
  })

  it('should return cell at given position', () => {
    const cell = getCellAtPosition(grid.cells, 2, 2)
    expect(cell).not.toBeNull()
    expect(cell.col).toBe(2)
    expect(cell.row).toBe(2)
  })

  it('should return null for out of bounds position', () => {
    expect(getCellAtPosition(grid.cells, 0, 1)).toBeNull()
    expect(getCellAtPosition(grid.cells, 1, 0)).toBeNull()
    expect(getCellAtPosition(grid.cells, 10, 1)).toBeNull()
    expect(getCellAtPosition(grid.cells, 1, 10)).toBeNull()
  })

  it('should return null for invalid input', () => {
    expect(getCellAtPosition(null, 1, 1)).toBeNull()
    expect(getCellAtPosition(undefined, 1, 1)).toBeNull()
  })

  it('should find merged cell covering position', () => {
    const cells = [
      createDefaultCell(1, 1, { colSpan: 2, rowSpan: 2 }),
      createDefaultCell(3, 1),
      createDefaultCell(3, 2),
      createDefaultCell(1, 3),
      createDefaultCell(2, 3),
      createDefaultCell(3, 3),
    ]
    expect(getCellAtPosition(cells, 1, 1)?.colSpan).toBe(2)
    expect(getCellAtPosition(cells, 2, 1)?.colSpan).toBe(2)
    expect(getCellAtPosition(cells, 1, 2)?.colSpan).toBe(2)
    expect(getCellAtPosition(cells, 2, 2)?.colSpan).toBe(2)
  })
})

describe('getCellsInRect', () => {
  let cells

  beforeEach(() => {
    const grid = createInitialGrid(4, 4)
    cells = grid.cells
  })

  it('should return cells within rectangle', () => {
    const result = getCellsInRect(cells, 1, 1, 2, 2)
    expect(result).toHaveLength(4)
    const ids = result.map((c) => `${c.col},${c.row}`).sort()
    expect(ids).toEqual(['1,1', '1,2', '2,1', '2,2'])
  })

  it('should handle reverse coordinates', () => {
    const result = getCellsInRect(cells, 2, 2, 1, 1)
    expect(result).toHaveLength(4)
  })

  it('should return null if rect includes partial merged cell', () => {
    const mergedCells = [
      createDefaultCell(1, 1, { colSpan: 3, rowSpan: 1 }),
      createDefaultCell(1, 2),
      createDefaultCell(2, 2),
      createDefaultCell(3, 2),
      createDefaultCell(4, 1),
      createDefaultCell(4, 2),
    ]
    const result = getCellsInRect(mergedCells, 1, 1, 2, 2)
    expect(result).toBeNull()
  })

  it('should include fully contained merged cells', () => {
    const mergedCells = [
      createDefaultCell(1, 1, { colSpan: 2, rowSpan: 2 }),
      createDefaultCell(3, 1),
      createDefaultCell(4, 1),
      createDefaultCell(3, 2),
      createDefaultCell(4, 2),
      createDefaultCell(1, 3),
      createDefaultCell(2, 3),
      createDefaultCell(3, 3),
      createDefaultCell(4, 3),
    ]
    const result = getCellsInRect(mergedCells, 1, 1, 4, 3)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(9)
  })

  it('should return empty array for invalid input', () => {
    expect(getCellsInRect(null, 1, 1, 2, 2)).toEqual([])
  })
})

describe('canMergeCells', () => {
  let grid

  beforeEach(() => {
    grid = createInitialGrid(4, 4)
  })

  it('should return true for valid merge area', () => {
    expect(canMergeCells(grid.cells, 1, 1, 2, 2, 4, 4)).toBe(true)
  })

  it('should return false for single cell', () => {
    expect(canMergeCells(grid.cells, 1, 1, 1, 1, 4, 4)).toBe(false)
  })

  it('should return false for out of bounds', () => {
    expect(canMergeCells(grid.cells, 1, 1, 5, 5, 4, 4)).toBe(false)
  })

  it('should return false for negative coordinates', () => {
    expect(canMergeCells(grid.cells, -1, -1, 2, 2, 4, 4)).toBe(false)
  })

  it('should return false for invalid input', () => {
    expect(canMergeCells(null, 1, 1, 2, 2, 4, 4)).toBe(false)
  })
})

describe('mergeCells', () => {
  let grid

  beforeEach(() => {
    grid = createInitialGrid(4, 4)
  })

  it('should merge cells into one', () => {
    const newCells = mergeCells(grid.cells, 1, 1, 2, 2)
    expect(newCells).toHaveLength(grid.cells.length - 3)

    const merged = newCells.find((c) => c.col === 1 && c.row === 1)
    expect(merged).toBeDefined()
    expect(merged.colSpan).toBe(2)
    expect(merged.rowSpan).toBe(2)
  })

  it('should not mutate original array', () => {
    const originalLength = grid.cells.length
    mergeCells(grid.cells, 1, 1, 2, 2)
    expect(grid.cells).toHaveLength(originalLength)
  })

  it('should return original array if cannot merge', () => {
    const result = mergeCells(grid.cells, 1, 1, 1, 1)
    expect(result).toBe(grid.cells)
  })

  it('should return empty array for invalid input', () => {
    expect(mergeCells(null, 1, 1, 2, 2)).toEqual([])
  })

  it('should preserve first cell\'s style properties', () => {
    const styledCell = createDefaultCell(1, 1, {
      borderColor: '#ff0000',
      horizontalAlign: HORIZONTAL_ALIGN.RIGHT,
    })
    const otherCell = createDefaultCell(2, 1)
    const cells = [styledCell, otherCell]

    const result = mergeCells(cells, 1, 1, 2, 1)
    const merged = result.find((c) => c.col === 1 && c.row === 1)
    expect(merged.borderColor).toBe('#ff0000')
    expect(merged.horizontalAlign).toBe(HORIZONTAL_ALIGN.RIGHT)
  })
})

describe('canSplitCell', () => {
  it('should return true for merged cell', () => {
    const cell = createDefaultCell(1, 1, { colSpan: 2, rowSpan: 1 })
    expect(canSplitCell(cell)).toBe(true)
  })

  it('should return false for regular cell', () => {
    const cell = createDefaultCell(1, 1)
    expect(canSplitCell(cell)).toBe(false)
  })

  it('should return false for null/undefined', () => {
    expect(canSplitCell(null)).toBe(false)
    expect(canSplitCell(undefined)).toBe(false)
  })
})

describe('splitCell', () => {
  it('should split merged cell into individual cells', () => {
    const merged = createDefaultCell(1, 1, {
      colSpan: 3,
      rowSpan: 2,
      borderColor: '#ff0000',
      horizontalAlign: HORIZONTAL_ALIGN.RIGHT,
    })
    const other = createDefaultCell(4, 1)
    const cells = [merged, other]

    const result = splitCell(cells, merged.id)
    expect(result).toHaveLength(7)

    const newCells = result.filter((c) => c.id !== merged.id && c.id !== other.id)
    expect(newCells).toHaveLength(6)

    newCells.forEach((cell) => {
      expect(cell.colSpan).toBe(1)
      expect(cell.rowSpan).toBe(1)
      expect(cell.borderColor).toBe('#ff0000')
      expect(cell.horizontalAlign).toBe(HORIZONTAL_ALIGN.RIGHT)
    })

    const positions = newCells.map((c) => `${c.col},${c.row}`).sort()
    expect(positions).toEqual(['1,1', '1,2', '2,1', '2,2', '3,1', '3,2'])
  })

  it('should return original array if cell not found', () => {
    const cells = [createDefaultCell(1, 1)]
    const result = splitCell(cells, 'non-existent-id')
    expect(result).toBe(cells)
  })

  it('should return original array for regular cell', () => {
    const cell = createDefaultCell(1, 1)
    const cells = [cell]
    const result = splitCell(cells, cell.id)
    expect(result).toBe(cells)
  })

  it('should return empty array for invalid input', () => {
    expect(splitCell(null, 'id')).toEqual([])
  })
})

describe('updateGridDimensions', () => {
  it('should handle grid expansion', () => {
    const grid = createInitialGrid(2, 2)
    const result = updateGridDimensions(grid, 3, 3)

    expect(result.cols).toBe(3)
    expect(result.rows).toBe(3)
    expect(result.cells).toHaveLength(9)

    const positions = result.cells.map((c) => `${c.col},${c.row}`).sort()
    expect(positions).toEqual([
      '1,1', '1,2', '1,3',
      '2,1', '2,2', '2,3',
      '3,1', '3,2', '3,3',
    ])
  })

  it('should remove overflow cells when shrinking', () => {
    const grid = createInitialGrid(4, 4)
    grid.cells.push(createDefaultCell(2, 2, { colSpan: 2, rowSpan: 2 }))
    grid.cells = grid.cells.filter((c) => !(c.col >= 2 && c.col <= 3 && c.row >= 2 && c.row <= 3 && c.colSpan === 1 && c.rowSpan === 1))

    const result = updateGridDimensions(grid, 3, 3)
    const overflowCell = result.cells.find((c) => c.colSpan === 2 && c.rowSpan === 2)
    expect(overflowCell).toBeDefined()

    const result2 = updateGridDimensions(grid, 2, 2)
    const overflowCell2 = result2.cells.find((c) => c.colSpan === 2 && c.rowSpan === 2)
    expect(overflowCell2).toBeUndefined()
  })

  it('should reorder cells even if dimensions are same', () => {
    const grid = createInitialGrid(3, 3)
    grid.cells = grid.cells.reverse()

    const result = updateGridDimensions(grid, 3, 3)
    expect(result).not.toBe(grid)
    expect(result.cols).toBe(3)
    expect(result.rows).toBe(3)

    const first = result.cells[0]
    expect(first.col).toBe(1)
    expect(first.row).toBe(1)
  })

  it('should handle null grid', () => {
    expect(updateGridDimensions(null, 3, 3)).toBeNull()
  })

  it('should preserve existing cells when expanding', () => {
    const grid = createInitialGrid(2, 2)
    const styledCell = createDefaultCell(1, 1, { borderColor: '#ff0000' })
    grid.cells[0] = styledCell
    const originalId = styledCell.id

    const result = updateGridDimensions(grid, 3, 3)
    const found = result.cells.find((c) => c.id === originalId)
    expect(found).toBeDefined()
    expect(found.borderColor).toBe('#ff0000')
  })

  it('should fill in missing cells when shrinking creates gaps', () => {
    const grid = createInitialGrid(3, 3)
    grid.cells[0] = createDefaultCell(1, 1, { colSpan: 2, rowSpan: 2 })
    grid.cells = grid.cells.filter((c) => !(c.col >= 1 && c.col <= 2 && c.row >= 1 && c.row <= 2 && c.id !== grid.cells[0].id))

    const result = updateGridDimensions(grid, 2, 2)
    expect(result.cells).toHaveLength(1)

    const result2 = updateGridDimensions(grid, 4, 4)
    expect(result2.cells).toHaveLength(13)
  })

  it('should sort cells by row then col', () => {
    const grid = createInitialGrid(3, 3)
    grid.cells = grid.cells.reverse()

    const result = updateGridDimensions(grid, 3, 3)
    for (let i = 0; i < result.cells.length - 1; i += 1) {
      const curr = result.cells[i]
      const next = result.cells[i + 1]
      if (curr.row === next.row) {
        expect(curr.col).toBeLessThan(next.col)
      } else {
        expect(curr.row).toBeLessThan(next.row)
      }
    }
  })
})

describe('updateCellStyle', () => {
  let cells

  beforeEach(() => {
    cells = [
      createDefaultCell(1, 1),
      createDefaultCell(2, 1),
      createDefaultCell(3, 1),
    ]
  })

  it('should update style for specified cells', () => {
    const ids = [cells[0].id, cells[2].id]
    const updates = {
      borderColor: '#ff0000',
      horizontalAlign: HORIZONTAL_ALIGN.RIGHT,
    }

    const result = updateCellStyle(cells, ids, updates)
    expect(result[0].borderColor).toBe('#ff0000')
    expect(result[0].horizontalAlign).toBe(HORIZONTAL_ALIGN.RIGHT)
    expect(result[1].borderColor).toBe(DEFAULT_BORDER_COLOR)
    expect(result[2].borderColor).toBe('#ff0000')
  })

  it('should not mutate original array', () => {
    const originalColor = cells[0].borderColor
    updateCellStyle(cells, [cells[0].id], { borderColor: '#ff0000' })
    expect(cells[0].borderColor).toBe(originalColor)
  })

  it('should return original array for invalid input', () => {
    expect(updateCellStyle(null, ['id'], {})).toEqual([])
    expect(updateCellStyle(cells, null, {})).toBe(cells)
    expect(updateCellStyle(cells, ['id'], null)).toBe(cells)
  })
})

describe('alignment to CSS mapping', () => {
  describe('horizontalAlignToCSS', () => {
    it('should map left to flex-start', () => {
      expect(horizontalAlignToCSS(HORIZONTAL_ALIGN.LEFT)).toBe('flex-start')
    })

    it('should map center to center', () => {
      expect(horizontalAlignToCSS(HORIZONTAL_ALIGN.CENTER)).toBe('center')
    })

    it('should map right to flex-end', () => {
      expect(horizontalAlignToCSS(HORIZONTAL_ALIGN.RIGHT)).toBe('flex-end')
    })

    it('should default to center for unknown values', () => {
      expect(horizontalAlignToCSS('unknown')).toBe('center')
    })
  })

  describe('verticalAlignToCSS', () => {
    it('should map top to flex-start', () => {
      expect(verticalAlignToCSS(VERTICAL_ALIGN.TOP)).toBe('flex-start')
    })

    it('should map center to center', () => {
      expect(verticalAlignToCSS(VERTICAL_ALIGN.CENTER)).toBe('center')
    })

    it('should map bottom to flex-end', () => {
      expect(verticalAlignToCSS(VERTICAL_ALIGN.BOTTOM)).toBe('flex-end')
    })

    it('should default to center for unknown values', () => {
      expect(verticalAlignToCSS('unknown')).toBe('center')
    })
  })
})

describe('code generation', () => {
  let simpleGrid
  let mergedGrid

  beforeEach(() => {
    simpleGrid = createInitialGrid(2, 2)
    mergedGrid = createInitialGrid(3, 3)
    mergedGrid.cells = mergeCells(mergedGrid.cells, 1, 1, 2, 2)
  })

  describe('generateHTML', () => {
    it('should generate valid HTML for simple grid', () => {
      const html = generateHTML(simpleGrid)
      expect(html).toContain('<div class="grid-container">')
      expect(html).toContain('</div>')
      expect(html.match(/<div class="grid-item"><\/div>/g)).toHaveLength(4)
    })

    it('should include merge labels for merged cells', () => {
      const html = generateHTML(mergedGrid)
      expect(html).toContain('2×2')
    })

    it('should return empty string for invalid input', () => {
      expect(generateHTML(null)).toBe('')
    })
  })

  describe('generateCSS', () => {
    it('should include grid-template-columns and rows', () => {
      const css = generateCSS(simpleGrid)
      expect(css).toContain('grid-template-columns: repeat(2, 100px)')
      expect(css).toContain('grid-template-rows: repeat(2, 100px)')
    })

    it('should include grid-column and grid-row for merged cells', () => {
      const css = generateCSS(mergedGrid)
      expect(css).toContain('grid-column: 1 / span 2')
      expect(css).toContain('grid-row: 1 / span 2')
    })

    it('should include justify-content and align-items', () => {
      const css = generateCSS(simpleGrid)
      expect(css).toContain('justify-content:')
      expect(css).toContain('align-items:')
    })

    it('should include border styles', () => {
      const css = generateCSS(simpleGrid)
      expect(css).toContain('border: 1px solid #333333')
    })

    it('should return empty string for invalid input', () => {
      expect(generateCSS(null)).toBe('')
    })

    it('should handle custom styles', () => {
      const grid = createInitialGrid(1, 1)
      grid.cells[0] = {
        ...grid.cells[0],
        horizontalAlign: HORIZONTAL_ALIGN.RIGHT,
        verticalAlign: VERTICAL_ALIGN.BOTTOM,
        borderColor: '#ff0000',
        borderWidth: 3,
        borderStyle: BORDER_STYLE.DASHED,
      }
      const css = generateCSS(grid)
      expect(css).toContain('justify-content: flex-end')
      expect(css).toContain('align-items: flex-end')
      expect(css).toContain('border: 3px dashed #ff0000')
    })
  })

  describe('generateFullCode', () => {
    it('should generate complete HTML document', () => {
      const code = generateFullCode(simpleGrid)
      expect(code).toContain('<!DOCTYPE html>')
      expect(code).toContain('<html')
      expect(code).toContain('<head>')
      expect(code).toContain('<body>')
      expect(code).toContain('<style>')
      expect(code).toContain('</style>')
      expect(code).toContain('</html>')
    })
  })
})

describe('localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  describe('loadFromStorage', () => {
    it('should return null when nothing stored', () => {
      const result = loadFromStorage(mockStorage)
      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })

    it('should load valid grid data', () => {
      const grid = createInitialGrid(3, 3)
      saveToStorage(grid, mockStorage)

      const result = loadFromStorage(mockStorage)
      expect(result.data).not.toBeNull()
      expect(result.data.cols).toBe(3)
      expect(result.data.rows).toBe(3)
      expect(result.data.cells).toHaveLength(9)
    })

    it('should return error for invalid JSON', () => {
      mockStorage.setItem('grid-editor-state', 'not json')
      const result = loadFromStorage(mockStorage)
      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })

    it('should return error for invalid data structure', () => {
      mockStorage.setItem('grid-editor-state', JSON.stringify({ foo: 1 }))
      const result = loadFromStorage(mockStorage)
      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })

    it('should return error when storage unavailable', () => {
      const result = loadFromStorage(null)
      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })

    it('should handle cells with invalid data', () => {
      const badData = {
        cols: 3,
        rows: 3,
        cells: [null, { id: 'valid' }, 'not a cell'],
      }
      mockStorage.setItem('grid-editor-state', JSON.stringify(badData))
      const result = loadFromStorage(mockStorage)
      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('saveToStorage', () => {
    it('should save grid to storage', () => {
      const grid = createInitialGrid(3, 3)
      const result = saveToStorage(grid, mockStorage)
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()

      const saved = JSON.parse(mockStorage.getItem('grid-editor-state'))
      expect(saved.cols).toBe(3)
      expect(saved.rows).toBe(3)
    })

    it('should return error when storage unavailable', () => {
      const result = saveToStorage(createInitialGrid(), null)
      expect(result.success).toBe(false)
      expect(result.error).not.toBeNull()
    })

    it('should handle storage errors gracefully', () => {
      const badStorage = {
        getItem: () => null,
        setItem: () => { throw new Error('quota exceeded') },
        removeItem: () => {},
      }
      const result = saveToStorage(createInitialGrid(), badStorage)
      expect(result.success).toBe(false)
      expect(result.error).toContain('quota exceeded')
    })

    it('should use defaults for null grid', () => {
      const result = saveToStorage(null, mockStorage)
      expect(result.success).toBe(true)
      const saved = JSON.parse(mockStorage.getItem('grid-editor-state'))
      expect(saved.cols).toBe(DEFAULT_COLS)
      expect(saved.rows).toBe(DEFAULT_ROWS)
    })
  })

  describe('clearStorage', () => {
    it('should remove grid from storage', () => {
      saveToStorage(createInitialGrid(), mockStorage)
      expect(mockStorage.getItem('grid-editor-state')).not.toBeNull()

      const result = clearStorage(mockStorage)
      expect(result.success).toBe(true)
      expect(mockStorage.getItem('grid-editor-state')).toBeNull()
    })

    it('should return error when storage unavailable', () => {
      const result = clearStorage(null)
      expect(result.success).toBe(false)
      expect(result.error).not.toBeNull()
    })

    it('should handle storage errors gracefully', () => {
      const badStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => { throw new Error('fail') },
      }
      const result = clearStorage(badStorage)
      expect(result.success).toBe(false)
      expect(result.error).toContain('fail')
    })
  })

  it('should round trip correctly', () => {
    const original = createInitialGrid(4, 5)
    original.cells[0] = {
      ...original.cells[0],
      borderColor: '#ff0000',
      horizontalAlign: HORIZONTAL_ALIGN.RIGHT,
      colSpan: 2,
    }
    original.autoNumbering = true
    original.showGridLines = false

    saveToStorage(original, mockStorage)
    const loaded = loadFromStorage(mockStorage)

    expect(loaded.data.cols).toBe(4)
    expect(loaded.data.rows).toBe(5)
    expect(loaded.data.autoNumbering).toBe(true)
    expect(loaded.data.showGridLines).toBe(false)
    expect(loaded.data.cells[0].borderColor).toBe('#ff0000')
    expect(loaded.data.cells[0].horizontalAlign).toBe(HORIZONTAL_ALIGN.RIGHT)
    expect(loaded.data.cells[0].colSpan).toBe(2)
  })
})

describe('complex scenario tests', () => {
  it('should handle multiple merge and split operations', () => {
    let grid = createInitialGrid(4, 4)

    grid.cells = mergeCells(grid.cells, 1, 1, 2, 2)
    expect(grid.cells).toHaveLength(13)

    grid.cells = mergeCells(grid.cells, 3, 3, 4, 4)
    expect(grid.cells).toHaveLength(10)

    const merged1 = grid.cells.find((c) => c.col === 1 && c.row === 1)
    grid.cells = splitCell(grid.cells, merged1.id)
    expect(grid.cells).toHaveLength(13)
  })

  it('should handle resize after merge', () => {
    let grid = createInitialGrid(4, 4)
    grid.cells = mergeCells(grid.cells, 1, 1, 2, 2)

    const resized = updateGridDimensions(grid, 2, 2)
    expect(resized.cells).toHaveLength(1)
    expect(resized.cells[0].colSpan).toBe(2)
    expect(resized.cells[0].rowSpan).toBe(2)

    const expanded = updateGridDimensions(grid, 5, 5)
    expect(expanded.cells).toHaveLength(25 - 3)
  })

  it('should preserve styles through dimension changes', () => {
    let grid = createInitialGrid(3, 3)
    grid.cells = updateCellStyle(grid.cells, [grid.cells[0].id], {
      borderColor: '#ff0000',
      borderWidth: 3,
      borderStyle: BORDER_STYLE.DASHED,
    })

    const resized = updateGridDimensions(grid, 4, 4)
    const styledCell = resized.cells.find((c) => c.col === 1 && c.row === 1)
    expect(styledCell.borderColor).toBe('#ff0000')
    expect(styledCell.borderWidth).toBe(3)
    expect(styledCell.borderStyle).toBe(BORDER_STYLE.DASHED)
  })

  it('should generate correct code after merge operations', () => {
    let grid = createInitialGrid(3, 3)
    grid.cells = mergeCells(grid.cells, 1, 1, 2, 2)
    grid.cells = mergeCells(grid.cells, 3, 1, 3, 3)

    const html = generateHTML(grid)
    const css = generateCSS(grid)

    expect(html).toContain('2×2')
    expect(html).toContain('1×3')
    expect(css).toContain('grid-column: 1 / span 2')
    expect(css).toContain('grid-row: 1 / span 2')
    expect(css).toContain('grid-column: 3 / span 1')
    expect(css).toContain('grid-row: 1 / span 3')
  })

  it('should handle getCellsInRect with multiple merged cells', () => {
    let grid = createInitialGrid(4, 4)
    grid.cells = mergeCells(grid.cells, 1, 1, 2, 2)
    grid.cells = mergeCells(grid.cells, 3, 3, 4, 4)

    const result = getCellsInRect(grid.cells, 1, 1, 4, 4)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(16 - 3 - 3)

    const partial = getCellsInRect(grid.cells, 2, 2, 3, 3)
    expect(partial).toBeNull()
  })

  it('should not allow merging when selection includes partial merged cells', () => {
    let grid = createInitialGrid(4, 4)
    grid.cells = mergeCells(grid.cells, 1, 1, 3, 1)

    const canMerge = canMergeCells(grid.cells, 2, 1, 2, 2, 4, 4)
    expect(canMerge).toBe(false)
  })
})
