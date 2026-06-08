import { describe, it, expect } from 'vitest'
import {
  DEFAULT_ROWS,
  DEFAULT_COLS,
  DEFAULT_COL_WIDTH,
  DEFAULT_ROW_HEIGHT,
  MIN_COL_WIDTH,
  MIN_ROW_HEIGHT,
  STORAGE_KEY,
  colIndexToLetter,
  colLetterToIndex,
  parseCellRef,
  cellRefToIndex,
  parseRange,
  getCellsInRange,
  getCellRawValue,
  getCellDisplayValue,
  getCellStyle,
  createCell,
  isFormula,
  evaluateFormula,
  findFormulaDependencies,
  computeAllFormulas,
  recomputeDependents,
  parseCSV,
  toCSV,
  importCSV,
  copyCellsToClipboardData,
  parseClipboardData,
  pasteClipboardData,
  createInitialState,
  insertRow,
  deleteRow,
  insertCol,
  deleteCol,
  applyStyleToSelection,
} from '../../spreadsheet/spreadsheetUtils'

describe('常量定义', () => {
  it('DEFAULT_ROWS 应该等于 50', () => {
    expect(DEFAULT_ROWS).toBe(50)
  })

  it('DEFAULT_COLS 应该等于 26', () => {
    expect(DEFAULT_COLS).toBe(26)
  })

  it('DEFAULT_COL_WIDTH 应该是合理的正数', () => {
    expect(typeof DEFAULT_COL_WIDTH).toBe('number')
    expect(DEFAULT_COL_WIDTH).toBeGreaterThan(0)
  })

  it('DEFAULT_ROW_HEIGHT 应该是合理的正数', () => {
    expect(typeof DEFAULT_ROW_HEIGHT).toBe('number')
    expect(DEFAULT_ROW_HEIGHT).toBeGreaterThan(0)
  })

  it('MIN_COL_WIDTH 应该小于等于 DEFAULT_COL_WIDTH', () => {
    expect(MIN_COL_WIDTH).toBeLessThanOrEqual(DEFAULT_COL_WIDTH)
  })

  it('MIN_ROW_HEIGHT 应该小于等于 DEFAULT_ROW_HEIGHT', () => {
    expect(MIN_ROW_HEIGHT).toBeLessThanOrEqual(DEFAULT_ROW_HEIGHT)
  })

  it('STORAGE_KEY 应该是合理的字符串', () => {
    expect(typeof STORAGE_KEY).toBe('string')
    expect(STORAGE_KEY.length).toBeGreaterThan(0)
  })
})

describe('列索引与字母转换', () => {
  it('colIndexToLetter - 基础字母 A-Z', () => {
    expect(colIndexToLetter(0)).toBe('A')
    expect(colIndexToLetter(1)).toBe('B')
    expect(colIndexToLetter(25)).toBe('Z')
  })

  it('colIndexToLetter - 多字母列', () => {
    expect(colIndexToLetter(26)).toBe('AA')
    expect(colIndexToLetter(27)).toBe('AB')
    expect(colIndexToLetter(51)).toBe('AZ')
    expect(colIndexToLetter(52)).toBe('BA')
    expect(colIndexToLetter(701)).toBe('ZZ')
  })

  it('colIndexToLetter - 负数应该返回空字符串', () => {
    expect(colIndexToLetter(-1)).toBe('')
  })

  it('colLetterToIndex - 基础字母 A-Z', () => {
    expect(colLetterToIndex('A')).toBe(0)
    expect(colLetterToIndex('B')).toBe(1)
    expect(colLetterToIndex('Z')).toBe(25)
  })

  it('colLetterToIndex - 支持小写字母', () => {
    expect(colLetterToIndex('a')).toBe(0)
    expect(colLetterToIndex('b')).toBe(1)
    expect(colLetterToIndex('z')).toBe(25)
  })

  it('colLetterToIndex - 多字母列', () => {
    expect(colLetterToIndex('AA')).toBe(26)
    expect(colLetterToIndex('AB')).toBe(27)
    expect(colLetterToIndex('AZ')).toBe(51)
    expect(colLetterToIndex('BA')).toBe(52)
    expect(colLetterToIndex('ZZ')).toBe(701)
  })

  it('colLetterToIndex - 无效输入应该返回 -1', () => {
    expect(colLetterToIndex('')).toBe(-1)
    expect(colLetterToIndex(null)).toBe(-1)
    expect(colLetterToIndex(undefined)).toBe(-1)
    expect(colLetterToIndex('123')).toBe(-1)
    expect(colLetterToIndex('A1')).toBe(-1)
  })
})

describe('单元格引用解析', () => {
  it('parseCellRef - 应该正确解析基础引用', () => {
    expect(parseCellRef('A1')).toEqual({ row: 0, col: 0 })
    expect(parseCellRef('B2')).toEqual({ row: 1, col: 1 })
    expect(parseCellRef('Z10')).toEqual({ row: 9, col: 25 })
  })

  it('parseCellRef - 支持多字母列', () => {
    expect(parseCellRef('AA1')).toEqual({ row: 0, col: 26 })
    expect(parseCellRef('AB5')).toEqual({ row: 4, col: 27 })
  })

  it('parseCellRef - 支持小写字母', () => {
    expect(parseCellRef('a1')).toEqual({ row: 0, col: 0 })
    expect(parseCellRef('b2')).toEqual({ row: 1, col: 1 })
  })

  it('parseCellRef - 无效输入应该返回 null', () => {
    expect(parseCellRef(null)).toBeNull()
    expect(parseCellRef(undefined)).toBeNull()
    expect(parseCellRef('')).toBeNull()
    expect(parseCellRef('ABC')).toBeNull()
    expect(parseCellRef('123')).toBeNull()
    expect(parseCellRef('A-1')).toBeNull()
  })

  it('cellRefToIndex - 应该正确生成单元格引用', () => {
    expect(cellRefToIndex(0, 0)).toBe('A1')
    expect(cellRefToIndex(1, 1)).toBe('B2')
    expect(cellRefToIndex(9, 25)).toBe('Z10')
    expect(cellRefToIndex(0, 26)).toBe('AA1')
  })

  it('parseCellRef 和 cellRefToIndex 应该互逆', () => {
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 30; c++) {
        const ref = cellRefToIndex(r, c)
        const parsed = parseCellRef(ref)
        expect(parsed).toEqual({ row: r, col: c })
      }
    }
  })
})

describe('单元格范围解析', () => {
  it('parseRange - 应该正确解析基础范围', () => {
    expect(parseRange('A1:B2')).toEqual({
      start: { row: 0, col: 0 },
      end: { row: 1, col: 1 },
    })
  })

  it('parseRange - 应该自动规范顺序', () => {
    expect(parseRange('B2:A1')).toEqual({
      start: { row: 0, col: 0 },
      end: { row: 1, col: 1 },
    })
  })

  it('parseRange - 无效输入应该返回 null', () => {
    expect(parseRange(null)).toBeNull()
    expect(parseRange(undefined)).toBeNull()
    expect(parseRange('')).toBeNull()
    expect(parseRange('A1')).toBeNull()
    expect(parseRange('A1:')).toBeNull()
    expect(parseRange(':B2')).toBeNull()
    expect(parseRange('XX:YY')).toBeNull()
  })

  it('getCellsInRange - 应该返回范围内所有单元格', () => {
    const range = parseRange('A1:B2')
    const cells = getCellsInRange(range)
    expect(cells.length).toBe(4)
    expect(cells).toContainEqual({ row: 0, col: 0 })
    expect(cells).toContainEqual({ row: 0, col: 1 })
    expect(cells).toContainEqual({ row: 1, col: 0 })
    expect(cells).toContainEqual({ row: 1, col: 1 })
  })

  it('getCellsInRange - 单个单元格范围', () => {
    const range = parseRange('A1:A1')
    const cells = getCellsInRange(range)
    expect(cells.length).toBe(1)
    expect(cells[0]).toEqual({ row: 0, col: 0 })
  })
})

describe('单元格值访问', () => {
  const testCells = {
    A1: { raw: '10', display: '10', style: { bold: true } },
    B2: { raw: '=A1*2', display: '20', style: {} },
  }

  it('getCellRawValue - 应该获取原始值', () => {
    expect(getCellRawValue(testCells, 0, 0)).toBe('10')
    expect(getCellRawValue(testCells, 1, 1)).toBe('=A1*2')
  })

  it('getCellRawValue - 不存在的单元格应该返回空字符串', () => {
    expect(getCellRawValue(testCells, 99, 99)).toBe('')
  })

  it('getCellDisplayValue - 应该获取显示值', () => {
    expect(getCellDisplayValue(testCells, 0, 0)).toBe('10')
    expect(getCellDisplayValue(testCells, 1, 1)).toBe('20')
  })

  it('getCellDisplayValue - 不存在的单元格应该返回空字符串', () => {
    expect(getCellDisplayValue(testCells, 99, 99)).toBe('')
  })

  it('getCellStyle - 应该获取样式', () => {
    expect(getCellStyle(testCells, 0, 0)).toEqual({ bold: true })
  })

  it('getCellStyle - 不存在的单元格应该返回空对象', () => {
    expect(getCellStyle(testCells, 99, 99)).toEqual({})
  })

  it('createCell - 应该创建单元格对象', () => {
    const cell = createCell('hello', { bold: true })
    expect(cell.raw).toBe('hello')
    expect(cell.display).toBe('')
    expect(cell.style).toEqual({ bold: true })
  })

  it('createCell - 默认参数', () => {
    const cell = createCell()
    expect(cell.raw).toBe('')
    expect(cell.display).toBe('')
    expect(cell.style).toEqual({})
  })
})

describe('公式检测', () => {
  it('isFormula - 以 = 开头的字符串应该返回 true', () => {
    expect(isFormula('=A1+B2')).toBe(true)
    expect(isFormula('=SUM(A1:A5)')).toBe(true)
    expect(isFormula('=1+2')).toBe(true)
  })

  it('isFormula - 非公式应该返回 false', () => {
    expect(isFormula('hello')).toBe(false)
    expect(isFormula('123')).toBe(false)
    expect(isFormula('')).toBe(false)
    expect(isFormula(null)).toBe(false)
    expect(isFormula(undefined)).toBe(false)
    expect(isFormula(123)).toBe(false)
    expect(isFormula({})).toBe(false)
  })

  it('isFormula - = 不在开头应该返回 false', () => {
    expect(isFormula('A1=B2')).toBe(false)
    expect(isFormula(' =A1')).toBe(false)
  })
})

describe('公式计算', () => {
  it('evaluateFormula - 简单算术运算', () => {
    expect(evaluateFormula('=1+2', {})).toBe(3)
    expect(evaluateFormula('=5-3', {})).toBe(2)
    expect(evaluateFormula('=2*3', {})).toBe(6)
    expect(evaluateFormula('=6/2', {})).toBe(3)
  })

  it('evaluateFormula - 带括号的运算', () => {
    expect(evaluateFormula('=(1+2)*3', {})).toBe(9)
    expect(evaluateFormula('=2*(3+4)', {})).toBe(14)
    expect(evaluateFormula('=(1+2)*(3+4)', {})).toBe(21)
  })

  it('evaluateFormula - 负数', () => {
    expect(evaluateFormula('=-5', {})).toBe(-5)
    expect(evaluateFormula('=-5+3', {})).toBe(-2)
    expect(evaluateFormula('=5*-2', {})).toBe(-10)
  })

  it('evaluateFormula - 小数运算', () => {
    expect(evaluateFormula('=1.5+2.5', {})).toBe(4)
    expect(evaluateFormula('=0.1+0.2', {})).toBeCloseTo(0.3, 10)
  })

  it('evaluateFormula - 单元格引用', () => {
    const cells = {
      A1: { raw: '10', display: '10' },
      A2: { raw: '20', display: '20' },
    }
    expect(evaluateFormula('=A1+A2', cells)).toBe(30)
    expect(evaluateFormula('=A1*2', cells)).toBe(20)
  })

  it('evaluateFormula - 除法除零错误', () => {
    expect(evaluateFormula('=5/0', {})).toBe('#DIV/0!')
  })

  it('evaluateFormula - 非公式直接返回原值', () => {
    expect(evaluateFormula('hello', {})).toBe('hello')
    expect(evaluateFormula('123', {})).toBe('123')
  })

  it('evaluateFormula - SUM 函数', () => {
    const cells = {
      A1: { raw: '1', display: '1' },
      A2: { raw: '2', display: '2' },
      A3: { raw: '3', display: '3' },
    }
    expect(evaluateFormula('=SUM(A1:A3)', cells)).toBe(6)
    expect(evaluateFormula('=SUM(A1,A2,A3)', cells)).toBe(6)
    expect(evaluateFormula('=SUM(1,2,3)', cells)).toBe(6)
  })

  it('evaluateFormula - AVG 函数', () => {
    const cells = {
      A1: { raw: '10', display: '10' },
      A2: { raw: '20', display: '20' },
      A3: { raw: '30', display: '30' },
    }
    expect(evaluateFormula('=AVG(A1:A3)', cells)).toBe(20)
  })

  it('evaluateFormula - MAX 函数', () => {
    const cells = {
      A1: { raw: '10', display: '10' },
      A2: { raw: '30', display: '30' },
      A3: { raw: '20', display: '20' },
    }
    expect(evaluateFormula('=MAX(A1:A3)', cells)).toBe(30)
  })

  it('evaluateFormula - MIN 函数', () => {
    const cells = {
      A1: { raw: '10', display: '10' },
      A2: { raw: '30', display: '30' },
      A3: { raw: '20', display: '20' },
    }
    expect(evaluateFormula('=MIN(A1:A3)', cells)).toBe(10)
  })

  it('evaluateFormula - COUNT 函数', () => {
    const cells = {
      A1: { raw: '10', display: '10' },
      A2: { raw: 'hello', display: 'hello' },
      A3: { raw: '20', display: '20' },
      A4: { raw: '', display: '' },
    }
    expect(evaluateFormula('=COUNT(A1:A4)', cells)).toBe(2)
  })

  it('evaluateFormula - 复合公式', () => {
    const cells = {
      A1: { raw: '10', display: '10' },
      A2: { raw: '20', display: '20' },
      A3: { raw: '30', display: '30' },
    }
    expect(evaluateFormula('=SUM(A1:A3)/3', cells)).toBe(20)
    expect(evaluateFormula('=A1+A2*2', cells)).toBe(50)
  })

  it('evaluateFormula - 运算符优先级', () => {
    expect(evaluateFormula('=2+3*4', {})).toBe(14)
    expect(evaluateFormula('=(2+3)*4', {})).toBe(20)
    expect(evaluateFormula('=10-3+2', {})).toBe(9)
    expect(evaluateFormula('=8/2*2', {})).toBe(8)
  })

  it('evaluateFormula - 无效公式返回 #ERROR!', () => {
    expect(evaluateFormula('=UNKNOWN()', {})).toBe('#ERROR!')
  })
})

describe('公式依赖检测', () => {
  it('findFormulaDependencies - 单个单元格引用', () => {
    expect(findFormulaDependencies('=A1+B2')).toEqual(expect.arrayContaining(['A1', 'B2']))
  })

  it('findFormulaDependencies - 范围引用', () => {
    const deps = findFormulaDependencies('=SUM(A1:B2)')
    expect(deps).toEqual(expect.arrayContaining(['A1', 'A2', 'B1', 'B2']))
    expect(deps.length).toBe(4)
  })

  it('findFormulaDependencies - 混合引用', () => {
    const deps = findFormulaDependencies('=SUM(A1:A3)+B1')
    expect(deps).toEqual(expect.arrayContaining(['A1', 'A2', 'A3', 'B1']))
  })

  it('findFormulaDependencies - 非公式返回空数组', () => {
    expect(findFormulaDependencies('hello')).toEqual([])
    expect(findFormulaDependencies('123')).toEqual([])
  })

  it('findFormulaDependencies - 无效公式返回空数组', () => {
    expect(findFormulaDependencies('=')).toEqual([])
  })
})

describe('公式批量计算', () => {
  it('computeAllFormulas - 应该计算所有公式', () => {
    const cells = {
      A1: { raw: '10', display: '' },
      A2: { raw: '20', display: '' },
      A3: { raw: '=A1+A2', display: '' },
    }
    const computed = computeAllFormulas(cells, 5, 5)
    expect(computed.A1.display).toBe('10')
    expect(computed.A2.display).toBe('20')
    expect(computed.A3.display).toBe('30')
  })

  it('computeAllFormulas - 应该正确处理依赖顺序', () => {
    const cells = {
      A1: { raw: '10', display: '' },
      A3: { raw: '=A1+A2', display: '' },
      A2: { raw: '20', display: '' },
    }
    const computed = computeAllFormulas(cells, 5, 5)
    expect(computed.A3.display).toBe('30')
  })

  it('computeAllFormulas - 嵌套公式', () => {
    const cells = {
      A1: { raw: '5', display: '' },
      A2: { raw: '=A1*2', display: '' },
      A3: { raw: '=A2+10', display: '' },
    }
    const computed = computeAllFormulas(cells, 5, 5)
    expect(computed.A2.display).toBe('10')
    expect(computed.A3.display).toBe('20')
  })

  it('recomputeDependents - 应该重新计算依赖单元格', () => {
    let cells = {
      A1: { raw: '10', display: '10' },
      A2: { raw: '20', display: '20' },
      A3: { raw: '=A1+A2', display: '30' },
    }
    cells.A1 = { ...cells.A1, raw: '100', display: '100' }
    const recomputed = recomputeDependents(cells, 'A1', 5, 5)
    expect(recomputed.A3.display).toBe('120')
  })

  it('recomputeDependents - 链式依赖', () => {
    let cells = {
      A1: { raw: '5', display: '5' },
      A2: { raw: '=A1*2', display: '10' },
      A3: { raw: '=A2+10', display: '20' },
    }
    cells.A1 = { ...cells.A1, raw: '10', display: '10' }
    const recomputed = recomputeDependents(cells, 'A1', 5, 5)
    expect(recomputed.A2.display).toBe('20')
    expect(recomputed.A3.display).toBe('30')
  })
})

describe('CSV 解析', () => {
  it('parseCSV - 简单数据', () => {
    const csv = 'a,b,c\n1,2,3'
    const result = parseCSV(csv)
    expect(result).toEqual([['a', 'b', 'c'], ['1', '2', '3']])
  })

  it('parseCSV - 带引号的字段', () => {
    const csv = '"hello, world","foo""bar",normal'
    const result = parseCSV(csv)
    expect(result).toEqual([['hello, world', 'foo"bar', 'normal']])
  })

  it('parseCSV - 带换行的引号字段', () => {
    const csv = '"line1\nline2",normal'
    const result = parseCSV(csv)
    expect(result).toEqual([['line1\nline2', 'normal']])
  })

  it('parseCSV - 空字符串', () => {
    expect(parseCSV('')).toEqual([])
    expect(parseCSV(null)).toEqual([])
    expect(parseCSV(undefined)).toEqual([])
  })

  it('parseCSV - 单行数据', () => {
    expect(parseCSV('a,b,c')).toEqual([['a', 'b', 'c']])
  })

  it('parseCSV - Windows 换行符 (\\r\\n)', () => {
    expect(parseCSV('a,b\r\nc,d')).toEqual([['a', 'b'], ['c', 'd']])
  })
})

describe('CSV 导出', () => {
  it('toCSV - 简单数据', () => {
    const cells = {
      A1: { raw: 'a', display: 'a' },
      B1: { raw: 'b', display: 'b' },
      A2: { raw: '1', display: '1' },
      B2: { raw: '2', display: '2' },
    }
    const csv = toCSV(cells, 2, 2)
    expect(csv).toBe('a,b\n1,2')
  })

  it('toCSV - 带特殊字符的字段', () => {
    const cells = {
      A1: { raw: 'hello, world', display: 'hello, world' },
      B1: { raw: 'say "hi"', display: 'say "hi"' },
    }
    const csv = toCSV(cells, 1, 2)
    expect(csv).toContain('"hello, world"')
    expect(csv).toContain('"say ""hi"""')
  })

  it('toCSV - 空单元格', () => {
    const cells = {
      A1: { raw: 'a', display: 'a' },
      B2: { raw: 'b', display: 'b' },
    }
    const csv = toCSV(cells, 2, 2)
    expect(csv).toBe('a,\n,b')
  })
})

describe('CSV 导入', () => {
  it('importCSV - 应该正确导入数据', () => {
    const csv = '1,2,3\n4,5,6'
    const result = importCSV(csv, {}, 50, 26)
    expect(result.cells.A1.raw).toBe('1')
    expect(result.cells.B1.raw).toBe('2')
    expect(result.cells.C1.raw).toBe('3')
    expect(result.cells.A2.raw).toBe('4')
    expect(result.cells.B2.raw).toBe('5')
    expect(result.cells.C2.raw).toBe('6')
  })

  it('importCSV - 应该计算公式', () => {
    const csv = '10,20,=A1+B1'
    const result = importCSV(csv, {}, 50, 26)
    expect(result.cells.A1.raw).toBe('10')
    expect(result.cells.B1.raw).toBe('20')
    expect(result.cells.C1.raw).toBe('=A1+B1')
    expect(result.cells.C1.display).toBe('30')
  })

  it('importCSV - 应该保留现有样式', () => {
    const existing = {
      A1: { raw: 'old', display: 'old', style: { bold: true } },
    }
    const csv = 'new'
    const result = importCSV(csv, existing, 50, 26)
    expect(result.cells.A1.raw).toBe('new')
    expect(result.cells.A1.style.bold).toBe(true)
  })
})

describe('复制粘贴', () => {
  it('copyCellsToClipboardData - 应该正确复制选中区域', () => {
    const cells = {
      A1: { raw: 'a', display: 'a' },
      B1: { raw: 'b', display: 'b' },
      A2: { raw: '1', display: '1' },
      B2: { raw: '2', display: '2' },
    }
    const selection = {
      start: { row: 0, col: 0 },
      end: { row: 1, col: 1 },
    }
    const result = copyCellsToClipboardData(cells, selection)
    expect(result).toBe('a\tb\n1\t2')
  })

  it('copyCellsToClipboardData - 单个单元格', () => {
    const cells = { A1: { raw: 'hello', display: 'hello' } }
    const selection = {
      start: { row: 0, col: 0 },
      end: { row: 0, col: 0 },
    }
    expect(copyCellsToClipboardData(cells, selection)).toBe('hello')
  })

  it('copyCellsToClipboardData - 空选区返回空字符串', () => {
    expect(copyCellsToClipboardData({}, null)).toBe('')
    expect(copyCellsToClipboardData({}, undefined)).toBe('')
  })

  it('parseClipboardData - 应该正确解析制表符分隔数据', () => {
    const text = 'a\tb\n1\t2'
    const result = parseClipboardData(text)
    expect(result).toEqual([['a', 'b'], ['1', '2']])
  })

  it('parseClipboardData - 空字符串返回空数组', () => {
    expect(parseClipboardData('')).toEqual([])
  })

  it('pasteClipboardData - 应该正确粘贴数据', () => {
    const data = [['a', 'b'], ['1', '2']]
    const result = pasteClipboardData({}, data, 0, 0, 50, 26)
    expect(result.A1.raw).toBe('a')
    expect(result.B1.raw).toBe('b')
    expect(result.A2.raw).toBe('1')
    expect(result.B2.raw).toBe('2')
  })

  it('pasteClipboardData - 应该计算粘贴的公式', () => {
    const data = [['10', '20', '=A1+B1']]
    const result = pasteClipboardData({}, data, 0, 0, 50, 26)
    expect(result.C1.display).toBe('30')
  })

  it('pasteClipboardData - 应该保留目标单元格样式', () => {
    const cells = {
      A1: { raw: 'old', display: 'old', style: { bold: true } },
    }
    const data = [['new']]
    const result = pasteClipboardData(cells, data, 0, 0, 50, 26)
    expect(result.A1.raw).toBe('new')
    expect(result.A1.style.bold).toBe(true)
  })
})

describe('初始状态创建', () => {
  it('createInitialState - 应该创建正确的初始状态', () => {
    const state = createInitialState()
    expect(state.cells).toEqual({})
    expect(state.rows).toBe(DEFAULT_ROWS)
    expect(state.cols).toBe(DEFAULT_COLS)
    expect(Object.keys(state.colWidths).length).toBe(DEFAULT_COLS)
    expect(Object.keys(state.rowHeights).length).toBe(DEFAULT_ROWS)
    for (let c = 0; c < DEFAULT_COLS; c++) {
      expect(state.colWidths[c]).toBe(DEFAULT_COL_WIDTH)
    }
    for (let r = 0; r < DEFAULT_ROWS; r++) {
      expect(state.rowHeights[r]).toBe(DEFAULT_ROW_HEIGHT)
    }
  })
})

describe('行列操作', () => {
  it('insertRow - 应该在指定位置插入新行', () => {
    const state = {
      ...createInitialState(),
      cells: {
        A1: { raw: 'row1', display: 'row1' },
        A2: { raw: 'row2', display: 'row2' },
      },
      rows: 2,
      cols: 1,
    }
    const result = insertRow(state, 1)
    expect(result.rows).toBe(3)
    expect(result.cells.A1.raw).toBe('row1')
    expect(result.cells.A2?.raw ?? '').toBe('')
    expect(result.cells.A3.raw).toBe('row2')
  })

  it('insertRow - 在开头插入', () => {
    const state = {
      ...createInitialState(),
      cells: {
        A1: { raw: 'old1', display: 'old1' },
        A2: { raw: 'old2', display: 'old2' },
      },
      rows: 2,
      cols: 1,
    }
    const result = insertRow(state, 0)
    expect(result.rows).toBe(3)
    expect(result.cells.A1?.raw ?? '').toBe('')
    expect(result.cells.A2.raw).toBe('old1')
    expect(result.cells.A3.raw).toBe('old2')
  })

  it('deleteRow - 应该删除指定行', () => {
    const state = {
      ...createInitialState(),
      cells: {
        A1: { raw: 'row1', display: 'row1' },
        A2: { raw: 'row2', display: 'row2' },
        A3: { raw: 'row3', display: 'row3' },
      },
      rows: 3,
      cols: 1,
    }
    const result = deleteRow(state, 1)
    expect(result.rows).toBe(2)
    expect(result.cells.A1.raw).toBe('row1')
    expect(result.cells.A2.raw).toBe('row3')
    expect(result.cells.A3).toBeUndefined()
  })

  it('deleteRow - 只有一行时不删除', () => {
    const state = {
      ...createInitialState(),
      cells: { A1: { raw: 'only', display: 'only' } },
      rows: 1,
      cols: 1,
    }
    const result = deleteRow(state, 0)
    expect(result).toBe(state)
  })

  it('insertCol - 应该在指定位置插入新列', () => {
    const state = {
      ...createInitialState(),
      cells: {
        A1: { raw: 'col1', display: 'col1' },
        B1: { raw: 'col2', display: 'col2' },
      },
      rows: 1,
      cols: 2,
    }
    const result = insertCol(state, 1)
    expect(result.cols).toBe(3)
    expect(result.cells.A1.raw).toBe('col1')
    expect(result.cells.B1?.raw ?? '').toBe('')
    expect(result.cells.C1.raw).toBe('col2')
  })

  it('deleteCol - 应该删除指定列', () => {
    const state = {
      ...createInitialState(),
      cells: {
        A1: { raw: 'col1', display: 'col1' },
        B1: { raw: 'col2', display: 'col2' },
        C1: { raw: 'col3', display: 'col3' },
      },
      rows: 1,
      cols: 3,
    }
    const result = deleteCol(state, 1)
    expect(result.cols).toBe(2)
    expect(result.cells.A1.raw).toBe('col1')
    expect(result.cells.B1.raw).toBe('col3')
    expect(result.cells.C1).toBeUndefined()
  })

  it('deleteCol - 只有一列时不删除', () => {
    const state = {
      ...createInitialState(),
      cells: { A1: { raw: 'only', display: 'only' } },
      rows: 1,
      cols: 1,
    }
    const result = deleteCol(state, 0)
    expect(result).toBe(state)
  })

  it('insertRow - 应该正确调整行高', () => {
    const state = createInitialState()
    state.rowHeights = { 0: 32, 1: 50 }
    state.rows = 2
    const result = insertRow(state, 1)
    expect(result.rows).toBe(3)
    expect(result.rowHeights[0]).toBe(32)
    expect(result.rowHeights[1]).toBe(DEFAULT_ROW_HEIGHT)
    expect(result.rowHeights[2]).toBe(50)
  })

  it('insertCol - 应该正确调整列宽', () => {
    const state = createInitialState()
    state.colWidths = { 0: 100, 1: 150 }
    state.cols = 2
    const result = insertCol(state, 1)
    expect(result.cols).toBe(3)
    expect(result.colWidths[0]).toBe(100)
    expect(result.colWidths[1]).toBe(DEFAULT_COL_WIDTH)
    expect(result.colWidths[2]).toBe(150)
  })
})

describe('样式应用', () => {
  it('applyStyleToSelection - 应该对选中区域应用样式', () => {
    const cells = {}
    const selection = {
      start: { row: 0, col: 0 },
      end: { row: 1, col: 1 },
    }
    const result = applyStyleToSelection(cells, selection, { bold: true })
    expect(result.A1.style.bold).toBe(true)
    expect(result.B1.style.bold).toBe(true)
    expect(result.A2.style.bold).toBe(true)
    expect(result.B2.style.bold).toBe(true)
  })

  it('applyStyleToSelection - 应该合并现有样式', () => {
    const cells = {
      A1: { raw: '', display: '', style: { italic: true } },
    }
    const selection = {
      start: { row: 0, col: 0 },
      end: { row: 0, col: 0 },
    }
    const result = applyStyleToSelection(cells, selection, { bold: true })
    expect(result.A1.style.bold).toBe(true)
    expect(result.A1.style.italic).toBe(true)
  })

  it('applyStyleToSelection - 空选区不做修改', () => {
    const cells = { A1: { raw: 'a', display: 'a', style: {} } }
    const result = applyStyleToSelection(cells, null, { bold: true })
    expect(result).toBe(cells)
  })

  it('applyStyleToSelection - 应该反向选区也正常工作', () => {
    const cells = {}
    const selection = {
      start: { row: 1, col: 1 },
      end: { row: 0, col: 0 },
    }
    const result = applyStyleToSelection(cells, selection, { bold: true })
    expect(result.A1.style.bold).toBe(true)
    expect(result.B1.style.bold).toBe(true)
    expect(result.A2.style.bold).toBe(true)
    expect(result.B2.style.bold).toBe(true)
  })
})
