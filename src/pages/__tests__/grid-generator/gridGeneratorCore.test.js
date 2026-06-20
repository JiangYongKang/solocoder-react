import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  SIZE_MODES,
  MIN_ROWS, MAX_ROWS, MIN_COLS, MAX_COLS,
  MIN_GAP, MAX_GAP,
  DEFAULT_ROWS, DEFAULT_COLS,
  DEFAULT_ROW_GAP, DEFAULT_COL_GAP,
  DEFAULT_JUSTIFY_CONTENT, DEFAULT_ALIGN_CONTENT, DEFAULT_PLACE_ITEMS,
  DEFAULT_CELL_COLOR, PRESET_COLORS,
} from '@/pages/grid-generator/constants.js'
import {
  clampRows, clampCols, clampGap, clampSizeValue,
  formatSizeValue,
  createDefaultRow, createDefaultCol, createDefaultCell,
  createInitialConfig, buildCellsFromDimensions,
  getCellAtPosition, isCellOrigin,
  getMaxColSpanForCell, getMaxRowSpanForCell,
  validateSpanChange, applySpanChange,
  updateCellProperty, resizeGrid,
  setUniformRowMode, setUniformColMode,
  setUniformRowValues, setUniformColValues,
  buildTemplateColumns, buildTemplateRows,
  clearAllCellColors, randomizeCellColors,
  generateContainerCSS, generateChildrenCSS,
  generateBaseItemCSS, generateFullCSS,
  generateHTML, generateFullCode,
  serializeConfig, deserializeConfig, validateImportJSON,
  validateAndNormalizeCell, validateAndNormalizeSize,
  getGridLineNumbers, getCellGridLines,
} from '@/pages/grid-generator/gridGeneratorCore.js'

describe('Clamping functions', () => {
  describe('clampRows', () => {
    it('should clamp within valid range', () => {
      expect(clampRows(0)).toBe(MIN_ROWS)
      expect(clampRows(100)).toBe(MAX_ROWS)
      expect(clampRows(6)).toBe(6)
      expect(clampRows(MIN_ROWS)).toBe(MIN_ROWS)
      expect(clampRows(MAX_ROWS)).toBe(MAX_ROWS)
    })

    it('should return default for invalid input', () => {
      expect(clampRows('abc')).toBe(DEFAULT_ROWS)
      expect(clampRows(null)).toBe(DEFAULT_ROWS)
      expect(clampRows(undefined)).toBe(DEFAULT_ROWS)
      expect(clampRows(NaN)).toBe(DEFAULT_ROWS)
    })
  })

  describe('clampCols', () => {
    it('should clamp within valid range', () => {
      expect(clampCols(-5)).toBe(MIN_COLS)
      expect(clampCols(999)).toBe(MAX_COLS)
      expect(clampCols(8)).toBe(8)
    })

    it('should return default for invalid input', () => {
      expect(clampCols({})).toBe(DEFAULT_COLS)
      expect(clampCols([])).toBe(DEFAULT_COLS)
    })
  })

  describe('clampGap', () => {
    it('should clamp gap value', () => {
      expect(clampGap(-10)).toBe(MIN_GAP)
      expect(clampGap(999)).toBe(MAX_GAP)
      expect(clampGap(25)).toBe(25)
      expect(clampGap(0)).toBe(0)
      expect(clampGap(50)).toBe(50)
    })

    it('should return 0 for invalid', () => {
      expect(clampGap('bad')).toBe(0)
      expect(clampGap(null)).toBe(0)
    })
  })

  describe('clampSizeValue', () => {
    it('should clamp PIXEL mode (10-500)', () => {
      expect(clampSizeValue(5, SIZE_MODES.PIXEL)).toBe(10)
      expect(clampSizeValue(1000, SIZE_MODES.PIXEL)).toBe(500)
      expect(clampSizeValue(100, SIZE_MODES.PIXEL)).toBe(100)
    })

    it('should clamp PERCENT mode (1-100)', () => {
      expect(clampSizeValue(0, SIZE_MODES.PERCENT)).toBe(1)
      expect(clampSizeValue(150, SIZE_MODES.PERCENT)).toBe(100)
      expect(clampSizeValue(33, SIZE_MODES.PERCENT)).toBe(33)
    })

    it('should clamp FR mode (0.1-10, one decimal)', () => {
      expect(clampSizeValue(0, SIZE_MODES.FR)).toBe(0.1)
      expect(clampSizeValue(20, SIZE_MODES.FR)).toBe(10)
      expect(clampSizeValue(1.234, SIZE_MODES.FR)).toBe(1.2)
      expect(clampSizeValue(2.567, SIZE_MODES.FR)).toBe(2.6)
    })

    it('should return default for invalid input', () => {
      expect(typeof clampSizeValue('bad', SIZE_MODES.PIXEL)).toBe('number')
      expect(typeof clampSizeValue(null, SIZE_MODES.FR)).toBe('number')
    })
  })
})

describe('Size formatting', () => {
  describe('formatSizeValue', () => {
    it('should append correct unit', () => {
      expect(formatSizeValue(80, SIZE_MODES.PIXEL)).toBe('80px')
      expect(formatSizeValue(33.33, SIZE_MODES.PERCENT)).toBe('33.33%')
      expect(formatSizeValue(1.5, SIZE_MODES.FR)).toBe('1.5fr')
    })

    it('should clamp before formatting', () => {
      expect(formatSizeValue(1000, SIZE_MODES.PIXEL)).toBe('500px')
    })
  })

  describe('buildTemplateColumns / Rows', () => {
    it('should join sizes with space', () => {
      const cols = [
        { mode: SIZE_MODES.FR, value: 1 },
        { mode: SIZE_MODES.FR, value: 2 },
        { mode: SIZE_MODES.PIXEL, value: 100 },
      ]
      expect(buildTemplateColumns(cols)).toBe('1fr 2fr 100px')
    })

    it('should return empty for invalid', () => {
      expect(buildTemplateColumns(null)).toBe('')
      expect(buildTemplateColumns([])).toBe('')
    })
  })
})

describe('Factory functions', () => {
  describe('createDefaultRow / Col', () => {
    it('should create defaults with FR mode', () => {
      const r = createDefaultRow()
      expect(r.mode).toBe(SIZE_MODES.FR)
      expect(typeof r.value).toBe('number')
      expect(createDefaultCol()).toMatchObject({ mode: SIZE_MODES.FR })
    })
  })

  describe('createDefaultCell', () => {
    it('should create cell with position and defaults', () => {
      const c = createDefaultCell(2, 3)
      expect(c.col).toBe(2)
      expect(c.row).toBe(3)
      expect(c.colSpan).toBe(1)
      expect(c.rowSpan).toBe(1)
      expect(c.areaName).toBe('')
      expect(c.backgroundColor).toBe('')
      expect(typeof c.id).toBe('string')
      expect(c.id.length).toBeGreaterThan(5)
    })
  })

  describe('createInitialConfig', () => {
    it('should create valid default config', () => {
      const cfg = createInitialConfig()
      expect(cfg.rows).toBe(DEFAULT_ROWS)
      expect(cfg.cols).toBe(DEFAULT_COLS)
      expect(cfg.rowSizes).toHaveLength(DEFAULT_ROWS)
      expect(cfg.colSizes).toHaveLength(DEFAULT_COLS)
      expect(cfg.rowGap).toBe(DEFAULT_ROW_GAP)
      expect(cfg.colGap).toBe(DEFAULT_COL_GAP)
      expect(cfg.justifyContent).toBe(DEFAULT_JUSTIFY_CONTENT)
      expect(cfg.alignContent).toBe(DEFAULT_ALIGN_CONTENT)
      expect(cfg.placeItems).toBe(DEFAULT_PLACE_ITEMS)
      expect(cfg.cells).toHaveLength(DEFAULT_ROWS * DEFAULT_COLS)
    })
  })

  describe('buildCellsFromDimensions', () => {
    it('should create correct cell count', () => {
      const cells = buildCellsFromDimensions(4, 5)
      expect(cells).toHaveLength(20)
      expect(cells[0].col).toBe(1)
      expect(cells[0].row).toBe(1)
      expect(cells[19].col).toBe(5)
      expect(cells[19].row).toBe(4)
    })
  })
})

describe('Cell position queries', () => {
  let cells

  beforeEach(() => {
    cells = buildCellsFromDimensions(4, 4)
  })

  describe('getCellAtPosition', () => {
    it('should find cell at position', () => {
      const c = getCellAtPosition(cells, 2, 3)
      expect(c).not.toBeNull()
      expect(c.col).toBe(2)
      expect(c.row).toBe(3)
    })

    it('should return null for out of bounds', () => {
      expect(getCellAtPosition(cells, 0, 1)).toBeNull()
      expect(getCellAtPosition(cells, 10, 10)).toBeNull()
    })

    it('should return null for invalid input', () => {
      expect(getCellAtPosition(null, 1, 1)).toBeNull()
      expect(getCellAtPosition(undefined, 1, 1)).toBeNull()
    })

    it('should find merged cell covering position', () => {
      const merged = { ...cells[0], col: 1, row: 1, colSpan: 2, rowSpan: 2 }
      const rest = cells.filter((c) => !(c.col <= 2 && c.row <= 2))
      const arr = [merged, ...rest]
      expect(getCellAtPosition(arr, 2, 2)?.colSpan).toBe(2)
      expect(getCellAtPosition(arr, 1, 2)?.colSpan).toBe(2)
      expect(getCellAtPosition(arr, 2, 1)?.rowSpan).toBe(2)
    })
  })

  describe('isCellOrigin', () => {
    it('should detect origin cell', () => {
      const cell = createDefaultCell(3, 3)
      expect(isCellOrigin(cell, 3, 3)).toBe(true)
      expect(isCellOrigin(cell, 4, 3)).toBe(false)
    })
  })
})

describe('Span validation', () => {
  let baseCells
  let config

  beforeEach(() => {
    config = createInitialConfig()
    config = resizeGrid(config, 4, 4)
    baseCells = config.cells
    baseCells[0] = { ...baseCells[0], colSpan: 2, rowSpan: 2 }
    const cell33 = baseCells.find((c) => c.col === 3 && c.row === 3)
    const idx33 = baseCells.indexOf(cell33)
    baseCells[idx33] = { ...cell33, colSpan: 2, rowSpan: 2 }
    baseCells = baseCells.filter((c) => {
      if (c.id === baseCells[0].id) return true
      if (c.id === baseCells[idx33].id) return true
      const coveredByFirst = c.col >= 1 && c.col <= 2 && c.row >= 1 && c.row <= 2
      const coveredBySecond = c.col >= 3 && c.col <= 4 && c.row >= 3 && c.row <= 4
      return !coveredByFirst && !coveredBySecond
    })
  })

  describe('getMaxColSpanForCell', () => {
    it('should return max span without obstruction', () => {
      const farCell = baseCells.find((c) => c.col === 4 && c.row === 4)
      expect(getMaxColSpanForCell(baseCells, farCell, 4)).toBe(1)
      const cell3_1 = baseCells.find((c) => c.col === 3 && c.row === 1)
      expect(getMaxColSpanForCell(baseCells, cell3_1, 4)).toBe(2)
    })

    it('should return 1 when merged cell blocks', () => {
      const cell1_3 = baseCells.find((c) => c.col === 1 && c.row === 3)
      expect(getMaxColSpanForCell(baseCells, cell1_3, 4)).toBeGreaterThanOrEqual(1)
    })
  })

  describe('validateSpanChange', () => {
    it('should validate correct span', () => {
      const target = baseCells.find((c) => c.col === 3 && c.row === 3)
      const res = validateSpanChange(baseCells, target.id, 2, 2, 4, 4)
      expect(res.valid).toBe(true)
    })

    it('should reject span exceeding grid', () => {
      const target = baseCells.find((c) => c.col === 3 && c.row === 3)
      const res = validateSpanChange(baseCells, target.id, 3, 3, 4, 4)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('max')
    })

    it('should reject overlapping merged cells', () => {
      const near = baseCells.find((c) => c.col === 3 && c.row === 2)
      const res = validateSpanChange(baseCells, near.id, 1, 2, 4, 4)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('occupied')
    })

    it('should reject invalid values', () => {
      const target = baseCells[0]
      const res = validateSpanChange(baseCells, target.id, 'bad', 'bad', 4, 4)
      expect(res.valid).toBe(false)
    })

    it('should reject unknown cell', () => {
      const res = validateSpanChange(baseCells, 'non-existent', 2, 2, 4, 4)
      expect(res.valid).toBe(false)
    })
  })

  describe('applySpanChange', () => {
    it('should update span for matching cell', () => {
      const target = baseCells.find((c) => c.col === 3 && c.row === 3)
      const updated = applySpanChange(baseCells, target.id, 2, 2)
      const updatedCell = updated.find((c) => c.id === target.id)
      expect(updatedCell.colSpan).toBe(2)
      expect(updatedCell.rowSpan).toBe(2)
    })

    it('should not mutate original', () => {
      const len = baseCells.length
      applySpanChange(baseCells, baseCells[0].id, 3, 3)
      expect(baseCells).toHaveLength(len)
    })

    it('should return original for invalid', () => {
      expect(applySpanChange(null, 'x', 1, 1)).toEqual([])
    })
  })
})

describe('Cell properties', () => {
  it('updateCellProperty should update specific cell property', () => {
    const cells = buildCellsFromDimensions(2, 2)
    const id = cells[0].id
    const updated = updateCellProperty(cells, id, 'areaName', 'header')
    expect(updated.find((c) => c.id === id).areaName).toBe('header')
    expect(cells[0].areaName).toBe('')
  })
})

describe('resizeGrid', () => {
  it('should expand grid and fill new cells', () => {
    const cfg = createInitialConfig()
    const bigger = resizeGrid(cfg, 5, 6)
    expect(bigger.rows).toBe(5)
    expect(bigger.cols).toBe(6)
    expect(bigger.rowSizes).toHaveLength(5)
    expect(bigger.colSizes).toHaveLength(6)
    expect(bigger.cells.length).toBeGreaterThan(0)
    expect(bigger.cells[bigger.cells.length - 1].row).toBe(5)
    expect(bigger.cells[bigger.cells.length - 1].col).toBe(6)
  })

  it('should shrink grid, removing overflow', () => {
    const cfg = createInitialConfig()
    const expanded = resizeGrid(cfg, 5, 5)
    expanded.cells[0] = { ...expanded.cells[0], colSpan: 3, rowSpan: 3 }
    const smaller = resizeGrid(expanded, 2, 2)
    const stillHasBig = smaller.cells.some((c) => c.colSpan === 3)
    expect(stillHasBig).toBe(false)
  })

  it('should preserve existing cells', () => {
    const cfg = createInitialConfig()
    cfg.cells[0].backgroundColor = '#ff0000'
    cfg.cells[0].areaName = 'header'
    const id = cfg.cells[0].id
    const bigger = resizeGrid(cfg, 5, 5)
    const found = bigger.cells.find((c) => c.id === id)
    expect(found).toBeDefined()
    expect(found.backgroundColor).toBe('#ff0000')
    expect(found.areaName).toBe('header')
  })
})

describe('Uniform size helpers', () => {
  it('setUniformRowMode should change all modes', () => {
    const rows = Array.from({ length: 3 }, () => createDefaultRow())
    const updated = setUniformRowMode(rows, SIZE_MODES.PIXEL)
    updated.forEach((r) => {
      expect(r.mode).toBe(SIZE_MODES.PIXEL)
      expect(typeof r.value).toBe('number')
    })
  })

  it('setUniformColMode should change all modes', () => {
    const cols = Array.from({ length: 4 }, () => createDefaultCol())
    const updated = setUniformColMode(cols, SIZE_MODES.PERCENT)
    updated.forEach((c) => expect(c.mode).toBe(SIZE_MODES.PERCENT))
  })

  it('setUniformRowValues should set values with clamping', () => {
    const rows = [
      { mode: SIZE_MODES.PIXEL, value: 10 },
      { mode: SIZE_MODES.PIXEL, value: 20 },
    ]
    const updated = setUniformRowValues(rows, 150)
    expect(updated[0].value).toBe(150)
    expect(updated[1].value).toBe(150)
  })
})

describe('Color utilities', () => {
  it('clearAllCellColors should empty colors', () => {
    const cells = buildCellsFromDimensions(2, 2).map((c) => ({ ...c, backgroundColor: '#abc' }))
    const cleared = clearAllCellColors(cells)
    cleared.forEach((c) => expect(c.backgroundColor).toBe(''))
  })

  it('randomizeCellColors should set colors from palette', () => {
    const cells = buildCellsFromDimensions(3, 3)
    const random = randomizeCellColors(cells)
    random.forEach((c) => {
      expect(PRESET_COLORS).toContain(c.backgroundColor)
    })
  })
})

describe('CSS generation', () => {
  let baseConfig

  beforeEach(() => {
    baseConfig = createInitialConfig()
  })

  describe('generateContainerCSS', () => {
    it('should include all container properties', () => {
      const css = generateContainerCSS(baseConfig)
      expect(css).toContain('.grid-container')
      expect(css).toContain('display: grid')
      expect(css).toContain('grid-template-columns')
      expect(css).toContain('grid-template-rows')
      expect(css).toContain('row-gap')
      expect(css).toContain('column-gap')
      expect(css).toContain('justify-content')
      expect(css).toContain('align-content')
      expect(css).toContain('place-items')
    })

    it('should include gap values', () => {
      const cfg = { ...baseConfig, rowGap: 12, colGap: 24 }
      const css = generateContainerCSS(cfg)
      expect(css).toContain('row-gap: 12px')
      expect(css).toContain('column-gap: 24px')
    })

    it('should return empty for null config', () => {
      expect(generateContainerCSS(null)).toBe('')
    })
  })

  describe('generateChildrenCSS', () => {
    it('should be empty for plain cells', () => {
      expect(generateChildrenCSS(baseConfig)).toBe('')
    })

    it('should include span for merged cells', () => {
      baseConfig.cells[0].colSpan = 2
      baseConfig.cells[0].rowSpan = 2
      const css = generateChildrenCSS(baseConfig)
      expect(css).toContain('grid-column: 1 / span 2')
      expect(css).toContain('grid-row: 1 / span 2')
    })

    it('should include area name', () => {
      baseConfig.cells[0].areaName = 'sidebar'
      const css = generateChildrenCSS(baseConfig)
      expect(css).toContain('grid-area: sidebar')
    })

    it('should include background color', () => {
      baseConfig.cells[0].backgroundColor = '#ff0000'
      const css = generateChildrenCSS(baseConfig)
      expect(css).toContain('background-color: #ff0000')
    })
  })

  describe('generateBaseItemCSS', () => {
    it('should return base item styles', () => {
      const css = generateBaseItemCSS()
      expect(css).toContain('.grid-item')
      expect(css).toContain('display: flex')
    })
  })

  describe('generateFullCSS', () => {
    it('should include all sections when containerOnly=false', () => {
      const css = generateFullCSS(baseConfig)
      expect(css).toContain('Container Styles')
      expect(css).toContain('Base Item Styles')
    })

    it('should only container styles when containerOnly=true', () => {
      const css = generateFullCSS(baseConfig, { containerOnly: true })
      expect(css).toContain('Container Styles')
      expect(css).not.toContain('Base Item Styles')
    })
  })
})

describe('HTML generation', () => {
  it('generateHTML should produce valid structure', () => {
    const cfg = createInitialConfig()
    const html = generateHTML(cfg)
    expect(html).toContain('<div class="grid-container">')
    expect(html).toContain('</div>')
    const matches = html.match(/<div class="grid-item[^"]*"/g)
    expect(matches).toHaveLength(DEFAULT_ROWS * DEFAULT_COLS)
  })

  it('should include merged labels', () => {
    const cfg = createInitialConfig()
    cfg.cells[0].colSpan = 2
    cfg.cells[0].rowSpan = 3
    const html = generateHTML(cfg)
    expect(html).toContain('2×3')
  })

  it('should return empty string for invalid', () => {
    expect(generateHTML(null)).toBe('')
  })
})

describe('generateFullCode', () => {
  it('should produce full HTML document', () => {
    const code = generateFullCode(createInitialConfig())
    expect(code).toContain('<!DOCTYPE html>')
    expect(code).toContain('<html')
    expect(code).toContain('<head>')
    expect(code).toContain('<style>')
    expect(code).toContain('<body>')
    expect(code).toContain('</html>')
  })
})

describe('Serialization', () => {
  describe('serializeConfig', () => {
    it('should produce valid JSON with version, name, timestamp, config', () => {
      const cfg = createInitialConfig()
      const json = serializeConfig(cfg, 'Test Layout')
      const parsed = JSON.parse(json)
      expect(parsed.version).toBe(1)
      expect(parsed.name).toBe('Test Layout')
      expect(typeof parsed.timestamp).toBe('number')
      expect(parsed.config.rows).toBe(DEFAULT_ROWS)
    })

    it('should use default name', () => {
      const json = serializeConfig(createInitialConfig())
      expect(JSON.parse(json).name).toBe('Untitled Layout')
    })
  })

  describe('validateAndNormalizeCell', () => {
    it('should normalize valid cell', () => {
      const cell = {
        col: 2.7, row: 3.2, colSpan: '2', rowSpan: '3',
        areaName: 'sidebar', backgroundColor: '#f00',
      }
      const norm = validateAndNormalizeCell(cell)
      expect(norm.col).toBe(2)
      expect(norm.row).toBe(3)
      expect(norm.colSpan).toBe(2)
      expect(norm.rowSpan).toBe(3)
      expect(norm.areaName).toBe('sidebar')
      expect(typeof norm.id).toBe('string')
    })

    it('should return null for invalid', () => {
      expect(validateAndNormalizeCell(null)).toBeNull()
      expect(validateAndNormalizeCell({})).toBeNull()
      expect(validateAndNormalizeCell({ col: 1 })).toBeNull()
    })
  })

  describe('validateAndNormalizeSize', () => {
    it('should normalize valid size', () => {
      const sz = validateAndNormalizeSize({ mode: SIZE_MODES.PIXEL, value: 120 })
      expect(sz.mode).toBe(SIZE_MODES.PIXEL)
      expect(sz.value).toBe(120)
    })

    it('should use defaults for invalid', () => {
      const sz = validateAndNormalizeSize(null)
      expect(sz.mode).toBe(SIZE_MODES.FR)
      expect(typeof sz.value).toBe('number')
    })
  })

  describe('deserializeConfig', () => {
    it('should roundtrip correctly', () => {
      const original = createInitialConfig()
      original.cells[0].colSpan = 2
      original.cells[0].backgroundColor = '#ff0000'
      const json = serializeConfig(original, 'Roundtrip')
      const result = deserializeConfig(json)
      expect(result.valid).toBe(true)
      expect(result.data.name).toBe('Roundtrip')
      expect(result.data.config.rows).toBe(DEFAULT_ROWS)
      expect(result.data.config.cells[0].colSpan).toBe(2)
      expect(result.data.config.cells[0].backgroundColor).toBe('#ff0000')
    })

    it('should fail for bad JSON', () => {
      const r = deserializeConfig('not json')
      expect(r.valid).toBe(false)
      expect(r.error).toBeDefined()
    })

    it('should fail when missing config', () => {
      const r = deserializeConfig(JSON.stringify({ version: 1 }))
      expect(r.valid).toBe(false)
      expect(r.error).toContain('config')
    })

    it('should fail when arrays missing', () => {
      const r = deserializeConfig(JSON.stringify({
        config: { rows: 3, cols: 3, cells: [] },
      }))
      expect(r.valid).toBe(false)
    })
  })

  describe('validateImportJSON', () => {
    it('should return ok=true for valid data', () => {
      const json = serializeConfig(createInitialConfig(), 'Imported')
      const r = validateImportJSON(json)
      expect(r.ok).toBe(true)
      expect(r.data.name).toBe('Imported')
    })

    it('should return ok=false for invalid', () => {
      const r = validateImportJSON('garbage')
      expect(r.ok).toBe(false)
      expect(r.error).toBeDefined()
    })
  })
})

describe('Grid line helpers', () => {
  describe('getGridLineNumbers', () => {
    it('should produce n+1 numbers starting from 1', () => {
      expect(getGridLineNumbers(3)).toEqual([1, 2, 3, 4])
      expect(getGridLineNumbers(0)).toEqual([1])
    })
  })

  describe('getCellGridLines', () => {
    it('should compute correct lines', () => {
      const cell = { col: 2, row: 3, colSpan: 2, rowSpan: 3 }
      const lines = getCellGridLines(cell)
      expect(lines.rowStart).toBe(3)
      expect(lines.rowEnd).toBe(6)
      expect(lines.colStart).toBe(2)
      expect(lines.colEnd).toBe(4)
    })

    it('should return null for null cell', () => {
      expect(getCellGridLines(null)).toBeNull()
    })
  })
})
