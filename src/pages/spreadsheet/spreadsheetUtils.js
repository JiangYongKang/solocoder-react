export const DEFAULT_ROWS = 50
export const DEFAULT_COLS = 26
export const DEFAULT_COL_WIDTH = 100
export const DEFAULT_ROW_HEIGHT = 32
export const MIN_COL_WIDTH = 40
export const MIN_ROW_HEIGHT = 20
export const STORAGE_KEY = 'solocoder-spreadsheet-data'

export const colIndexToLetter = (index) => {
  if (index < 0) return ''
  let result = ''
  let n = index
  while (n >= 26) {
    result = String.fromCharCode((n % 26) + 65) + result
    n = Math.floor(n / 26) - 1
  }
  result = String.fromCharCode(n + 65) + result
  return result
}

export const colLetterToIndex = (letter) => {
  if (!letter || typeof letter !== 'string') return -1
  const upper = letter.toUpperCase()
  let result = 0
  for (let i = 0; i < upper.length; i++) {
    const code = upper.charCodeAt(i)
    if (code < 65 || code > 90) return -1
    result = result * 26 + (code - 64)
  }
  return result - 1
}

export const parseCellRef = (ref) => {
  if (!ref || typeof ref !== 'string') return null
  const match = ref.match(/^([A-Za-z]+)(\d+)$/)
  if (!match) return null
  const colIndex = colLetterToIndex(match[1])
  const rowIndex = parseInt(match[2], 10) - 1
  if (colIndex < 0 || rowIndex < 0) return null
  return { row: rowIndex, col: colIndex }
}

export const cellRefToIndex = (row, col) => {
  return `${colIndexToLetter(col)}${row + 1}`
}

export const parseRange = (range) => {
  if (!range || typeof range !== 'string') return null
  const parts = range.split(':')
  if (parts.length !== 2) return null
  const start = parseCellRef(parts[0].trim())
  const end = parseCellRef(parts[1].trim())
  if (!start || !end) return null
  const minRow = Math.min(start.row, end.row)
  const maxRow = Math.max(start.row, end.row)
  const minCol = Math.min(start.col, end.col)
  const maxCol = Math.max(start.col, end.col)
  return {
    start: { row: minRow, col: minCol },
    end: { row: maxRow, col: maxCol },
  }
}

export const getCellsInRange = (range) => {
  const cells = []
  for (let r = range.start.row; r <= range.end.row; r++) {
    for (let c = range.start.col; c <= range.end.col; c++) {
      cells.push({ row: r, col: c })
    }
  }
  return cells
}

export const getCellRawValue = (cells, row, col) => {
  const key = cellRefToIndex(row, col)
  return cells[key]?.raw ?? ''
}

export const getCellDisplayValue = (cells, row, col) => {
  const key = cellRefToIndex(row, col)
  return cells[key]?.display ?? ''
}

export const getCellStyle = (cells, row, col) => {
  const key = cellRefToIndex(row, col)
  return cells[key]?.style ?? {}
}

export const createCell = (raw = '', style = {}) => ({
  raw,
  display: '',
  style,
})

export const isFormula = (value) => {
  return typeof value === 'string' && value.startsWith('=')
}

const tokenize = (formula) => {
  const tokens = []
  let i = 0
  const s = formula.slice(1)

  while (i < s.length) {
    const ch = s[i]

    if (/\s/.test(ch)) {
      i++
      continue
    }

    if (/\d/.test(ch) || (ch === '.' && /\d/.test(s[i + 1]))) {
      let num = ''
      while (i < s.length && (/\d/.test(s[i]) || s[i] === '.')) {
        num += s[i]
        i++
      }
      tokens.push({ type: 'number', value: parseFloat(num) })
      continue
    }

    if (ch === '"') {
      let str = ''
      i++
      while (i < s.length && s[i] !== '"') {
        if (s[i] === '\\' && i + 1 < s.length) {
          str += s[i + 1]
          i += 2
        } else {
          str += s[i]
          i++
        }
      }
      i++
      tokens.push({ type: 'string', value: str })
      continue
    }

    if (/[A-Za-z]/.test(ch)) {
      let ident = ''
      while (i < s.length && /[A-Za-z0-9_]/.test(s[i])) {
        ident += s[i]
        i++
      }

      if (/^[A-Za-z]+\d+$/.test(ident)) {
        tokens.push({ type: 'cell', value: ident.toUpperCase() })
      } else if (i < s.length && s[i] === '(') {
        tokens.push({ type: 'func', value: ident.toUpperCase() })
      } else {
        tokens.push({ type: 'ident', value: ident })
      }
      continue
    }

    if (ch === ':' && tokens.length > 0 && tokens[tokens.length - 1].type === 'cell') {
      i++
      let ident = ''
      while (i < s.length && /[A-Za-z0-9]/.test(s[i])) {
        ident += s[i]
        i++
      }
      if (/^[A-Za-z]+\d+$/.test(ident)) {
        const startCell = tokens.pop().value
        tokens.push({ type: 'range', value: `${startCell}:${ident.toUpperCase()}` })
      }
      continue
    }

    if ('+-*/(),'.includes(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
      continue
    }

    i++
  }

  return tokens
}

const toNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return val
  const n = parseFloat(String(val))
  return isNaN(n) ? 0 : n
}

const getRangeValues = (cells, rangeStr) => {
  const range = parseRange(rangeStr)
  if (!range) return []
  const cellsInRange = getCellsInRange(range)
  return cellsInRange.map(({ row, col }) => getCellRawValue(cells, row, col))
}

const executeFunction = (name, args, cells) => {
  const values = []
  for (const arg of args) {
    if (arg.type === 'range') {
      const rangeVals = getRangeValues(cells, arg.value)
      for (const v of rangeVals) values.push(v)
    } else {
      values.push(arg.evaluated)
    }
  }

  switch (name) {
    case 'SUM': {
      let sum = 0
      for (const v of values) {
        sum += toNumber(v)
      }
      return sum
    }
    case 'AVG': {
      const nums = values.filter((v) => v !== '' && v !== null && v !== undefined && !isNaN(parseFloat(v)))
      if (nums.length === 0) return 0
      let sum = 0
      for (const v of nums) sum += toNumber(v)
      return sum / nums.length
    }
    case 'MAX': {
      const nums = values.map((v) => toNumber(v))
      if (nums.length === 0) return 0
      return Math.max(...nums)
    }
    case 'MIN': {
      const nums = values.map((v) => toNumber(v))
      if (nums.length === 0) return 0
      return Math.min(...nums)
    }
    case 'COUNT': {
      return values.filter((v) => v !== '' && v !== null && v !== undefined && !isNaN(parseFloat(v))).length
    }
    default:
      throw new Error(`Unknown function: ${name}`)
  }
}

const evaluateTokens = (tokens, cells) => {
  let pos = 0

  const parseExpression = () => {
    let left = parseTerm()
    while (pos < tokens.length && (tokens[pos].value === '+' || tokens[pos].value === '-')) {
      const op = tokens[pos].value
      pos++
      const right = parseTerm()
      left = op === '+' ? toNumber(left) + toNumber(right) : toNumber(left) - toNumber(right)
    }
    return left
  }

  const parseTerm = () => {
    let left = parseFactor()
    while (pos < tokens.length && (tokens[pos].value === '*' || tokens[pos].value === '/')) {
      const op = tokens[pos].value
      pos++
      const right = parseFactor()
      left = op === '*' ? toNumber(left) * toNumber(right) : toNumber(right) === 0 ? '#DIV/0!' : toNumber(left) / toNumber(right)
    }
    return left
  }

  const parseFactor = () => {
    if (pos >= tokens.length) return 0

    const token = tokens[pos]

    if (token.type === 'number') {
      pos++
      return token.value
    }

    if (token.type === 'string') {
      pos++
      return token.value
    }

    if (token.type === 'cell') {
      pos++
      const ref = parseCellRef(token.value)
      if (!ref) return '#REF!'
      const raw = getCellRawValue(cells, ref.row, ref.col)
      if (isFormula(raw)) {
        return getCellDisplayValue(cells, ref.row, ref.col)
      }
      const num = parseFloat(raw)
      return isNaN(num) ? (raw || 0) : num
    }

    if (token.type === 'range') {
      pos++
      const vals = getRangeValues(cells, token.value)
      let sum = 0
      for (const v of vals) sum += toNumber(v)
      return sum
    }

    if (token.type === 'func') {
      pos++
      const funcName = token.value
      if (pos >= tokens.length || tokens[pos].value !== '(') {
        throw new Error('Expected ( after function name')
      }
      pos++
      const args = []
      while (pos < tokens.length && tokens[pos].value !== ')') {
        if (tokens[pos].type === 'range') {
          args.push({ type: 'range', value: tokens[pos].value })
          pos++
        } else {
          const val = parseExpression()
          args.push({ type: 'value', evaluated: val })
        }
        if (pos < tokens.length && tokens[pos].value === ',') {
          pos++
        }
      }
      if (pos < tokens.length && tokens[pos].value === ')') {
        pos++
      }
      return executeFunction(funcName, args, cells)
    }

    if (token.type === 'op' && token.value === '(') {
      pos++
      const val = parseExpression()
      if (pos < tokens.length && tokens[pos].value === ')') {
        pos++
      }
      return val
    }

    if (token.type === 'op' && token.value === '-') {
      pos++
      return -toNumber(parseFactor())
    }

    if (token.type === 'op' && token.value === '+') {
      pos++
      return toNumber(parseFactor())
    }

    pos++
    return 0
  }

  return parseExpression()
}

export const evaluateFormula = (formula, cells) => {
  if (!isFormula(formula)) {
    return formula
  }
  try {
    const tokens = tokenize(formula)
    const result = evaluateTokens(tokens, cells)
    if (typeof result === 'number' && !Number.isInteger(result)) {
      return Math.round(result * 1e10) / 1e10
    }
    return result
  } catch {
    return '#ERROR!'
  }
}

export const findFormulaDependencies = (formula) => {
  if (!isFormula(formula)) return []
  const deps = new Set()
  try {
    const tokens = tokenize(formula)
    for (const token of tokens) {
      if (token.type === 'cell') {
        deps.add(token.value)
      } else if (token.type === 'range') {
        const range = parseRange(token.value)
        if (range) {
          const cells = getCellsInRange(range)
          for (const c of cells) {
            deps.add(cellRefToIndex(c.row, c.col))
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return [...deps]
}

export const computeAllFormulas = (cells, rows, cols) => {
  const result = { ...cells }
  const computed = new Set()

  const computeCell = (row, col, visiting = new Set()) => {
    const key = cellRefToIndex(row, col)
    if (computed.has(key)) return
    if (visiting.has(key)) return

    const cell = result[key]
    if (!cell || !isFormula(cell.raw)) {
      computed.add(key)
      return
    }

    visiting.add(key)
    const deps = findFormulaDependencies(cell.raw)
    for (const depKey of deps) {
      const dep = parseCellRef(depKey)
      if (dep && dep.row >= 0 && dep.row < rows && dep.col >= 0 && dep.col < cols) {
        computeCell(dep.row, dep.col, visiting)
      }
    }
    visiting.delete(key)

    const displayValue = evaluateFormula(cell.raw, result)
    result[key] = { ...cell, display: String(displayValue) }
    computed.add(key)
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      computeCell(r, c)
    }
  }

  for (const key of Object.keys(result)) {
    if (!result[key].display && result[key].raw && !isFormula(result[key].raw)) {
      result[key] = { ...result[key], display: result[key].raw }
    }
  }

  return result
}

export const recomputeDependents = (cells, changedKey, rows, cols) => {
  const result = { ...cells }
  const changedCell = parseCellRef(changedKey)
  if (!changedCell) return result

  const allFormulaKeys = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = cellRefToIndex(r, c)
      if (result[key] && isFormula(result[key].raw)) {
        allFormulaKeys.push(key)
      }
    }
  }

  const isAffected = (key, visited = new Set()) => {
    if (visited.has(key)) return false
    visited.add(key)
    const cell = result[key]
    if (!cell || !isFormula(cell.raw)) return false
    const deps = findFormulaDependencies(cell.raw)
    if (deps.includes(changedKey)) return true
    for (const depKey of deps) {
      if (allFormulaKeys.includes(depKey) && isAffected(depKey, visited)) {
        return true
      }
    }
    return false
  }

  const affectedKeys = allFormulaKeys.filter(key => isAffected(key))

  const recompute = (key, visiting = new Set()) => {
    if (visiting.has(key)) return
    const cell = result[key]
    if (!cell || !isFormula(cell.raw)) return

    visiting.add(key)
    const deps = findFormulaDependencies(cell.raw)
    for (const depKey of deps) {
      if (affectedKeys.includes(depKey) && result[depKey] && isFormula(result[depKey].raw)) {
        recompute(depKey, visiting)
      }
    }
    visiting.delete(key)

    const displayValue = evaluateFormula(cell.raw, result)
    result[key] = { ...cell, display: String(displayValue) }
  }

  for (const key of affectedKeys) {
    recompute(key)
  }

  return result
}

export const parseCSV = (csvText) => {
  if (!csvText || typeof csvText !== 'string') return []
  const rows = []
  let currentRow = []
  let currentField = ''
  let inQuotes = false
  let i = 0

  while (i < csvText.length) {
    const ch = csvText[i]
    const next = csvText[i + 1]

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          currentField += '"'
          i += 2
        } else {
          inQuotes = false
          i++
        }
      } else {
        currentField += ch
        i++
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
      } else if (ch === ',') {
        currentRow.push(currentField)
        currentField = ''
        i++
      } else if (ch === '\r') {
        i++
      } else if (ch === '\n') {
        currentRow.push(currentField)
        rows.push(currentRow)
        currentRow = []
        currentField = ''
        i++
      } else {
        currentField += ch
        i++
      }
    }
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField)
    rows.push(currentRow)
  }

  if (rows.length === 1 && rows[0].length === 1 && rows[0][0] === '') {
    return []
  }

  return rows
}

export const toCSV = (cells, rows, cols) => {
  const lines = []
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < cols; c++) {
      const raw = getCellRawValue(cells, r, c)
      if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
        const escaped = raw.replace(/"/g, '""')
        row.push(`"${escaped}"`)
      } else {
        row.push(raw)
      }
    }
    lines.push(row.join(','))
  }
  return lines.join('\n')
}

export const exportCSV = (cells, rows, cols, filename = 'spreadsheet.csv') => {
  if (typeof document === 'undefined') return false
  const csv = toCSV(cells, rows, cols)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
}

export const importCSV = (csvText, existingCells, maxRows, maxCols) => {
  const rows = parseCSV(csvText)
  const newCells = { ...existingCells }

  for (let r = 0; r < rows.length && r < maxRows; r++) {
    const rowData = rows[r]
    for (let c = 0; c < rowData.length && c < maxCols; c++) {
      const key = cellRefToIndex(r, c)
      const raw = rowData[c]
      newCells[key] = {
        raw,
        display: isFormula(raw) ? '' : raw,
        style: existingCells[key]?.style || {},
      }
    }
  }

  const finalRows = Math.max(maxRows, rows.length)
  const finalCols = Math.max(maxCols, rows.length > 0 ? Math.max(...rows.map(r => r.length)) : 0)

  return {
    cells: computeAllFormulas(newCells, finalRows, finalCols),
    rows: finalRows,
    cols: finalCols,
  }
}

export const copyCellsToClipboardData = (cells, selection) => {
  if (!selection || !selection.start || !selection.end) return ''
  const minRow = Math.min(selection.start.row, selection.end.row)
  const maxRow = Math.max(selection.start.row, selection.end.row)
  const minCol = Math.min(selection.start.col, selection.end.col)
  const maxCol = Math.max(selection.start.col, selection.end.col)

  const lines = []
  for (let r = minRow; r <= maxRow; r++) {
    const row = []
    for (let c = minCol; c <= maxCol; c++) {
      const key = cellRefToIndex(r, c)
      const raw = cells[key]?.raw ?? ''
      if (raw.includes('\t') || raw.includes('\n') || raw.includes('"')) {
        const escaped = raw.replace(/"/g, '""')
        row.push(`"${escaped}"`)
      } else {
        row.push(raw)
      }
    }
    lines.push(row.join('\t'))
  }
  return lines.join('\n')
}

export const parseClipboardData = (text) => {
  if (!text) return []
  const lines = text.split(/\r?\n/)
  return lines
    .filter(line => line !== '' || lines.length === 1)
    .map(line => {
      const fields = []
      let current = ''
      let inQuotes = false
      let i = 0
      while (i < line.length) {
        const ch = line[i]
        if (inQuotes) {
          if (ch === '"') {
            if (line[i + 1] === '"') {
              current += '"'
              i += 2
            } else {
              inQuotes = false
              i++
            }
          } else {
            current += ch
            i++
          }
        } else {
          if (ch === '"') {
            inQuotes = true
            i++
          } else if (ch === '\t') {
            fields.push(current)
            current = ''
            i++
          } else {
            current += ch
            i++
          }
        }
      }
      fields.push(current)
      return fields
    })
}

export const pasteClipboardData = (cells, clipboardData, targetRow, targetCol, maxRows, maxCols) => {
  const newCells = { ...cells }

  for (let r = 0; r < clipboardData.length; r++) {
    const row = clipboardData[r]
    for (let c = 0; c < row.length; c++) {
      const destRow = targetRow + r
      const destCol = targetCol + c
      if (destRow >= maxRows || destCol >= maxCols) continue
      const key = cellRefToIndex(destRow, destCol)
      const raw = row[c]
      newCells[key] = {
        raw,
        display: isFormula(raw) ? '' : raw,
        style: cells[key]?.style || {},
      }
    }
  }

  return computeAllFormulas(newCells, maxRows, maxCols)
}

export const createInitialState = () => {
  const colWidths = {}
  const rowHeights = {}
  for (let c = 0; c < DEFAULT_COLS; c++) {
    colWidths[c] = DEFAULT_COL_WIDTH
  }
  for (let r = 0; r < DEFAULT_ROWS; r++) {
    rowHeights[r] = DEFAULT_ROW_HEIGHT
  }
  return {
    cells: {},
    rows: DEFAULT_ROWS,
    cols: DEFAULT_COLS,
    colWidths,
    rowHeights,
  }
}

export const insertRow = (state, index) => {
  const newCells = {}
  for (const key of Object.keys(state.cells)) {
    const ref = parseCellRef(key)
    if (!ref) continue
    const newRow = ref.row >= index ? ref.row + 1 : ref.row
    const newKey = cellRefToIndex(newRow, ref.col)
    newCells[newKey] = state.cells[key]
  }

  const newRowHeights = {}
  for (let r = 0; r <= state.rows; r++) {
    if (r < index) {
      newRowHeights[r] = state.rowHeights[r] || DEFAULT_ROW_HEIGHT
    } else if (r === index) {
      newRowHeights[r] = DEFAULT_ROW_HEIGHT
    } else {
      newRowHeights[r] = state.rowHeights[r - 1] || DEFAULT_ROW_HEIGHT
    }
  }

  return {
    ...state,
    cells: computeAllFormulas(newCells, state.rows + 1, state.cols),
    rows: state.rows + 1,
    rowHeights: newRowHeights,
  }
}

export const deleteRow = (state, index) => {
  if (state.rows <= 1) return state

  const newCells = {}
  for (const key of Object.keys(state.cells)) {
    const ref = parseCellRef(key)
    if (!ref) continue
    if (ref.row === index) continue
    const newRow = ref.row > index ? ref.row - 1 : ref.row
    const newKey = cellRefToIndex(newRow, ref.col)
    newCells[newKey] = state.cells[key]
  }

  const newRowHeights = {}
  for (let r = 0; r < state.rows - 1; r++) {
    if (r < index) {
      newRowHeights[r] = state.rowHeights[r] || DEFAULT_ROW_HEIGHT
    } else {
      newRowHeights[r] = state.rowHeights[r + 1] || DEFAULT_ROW_HEIGHT
    }
  }

  return {
    ...state,
    cells: computeAllFormulas(newCells, state.rows - 1, state.cols),
    rows: state.rows - 1,
    rowHeights: newRowHeights,
  }
}

export const insertCol = (state, index) => {
  const newCells = {}
  for (const key of Object.keys(state.cells)) {
    const ref = parseCellRef(key)
    if (!ref) continue
    const newCol = ref.col >= index ? ref.col + 1 : ref.col
    const newKey = cellRefToIndex(ref.row, newCol)
    newCells[newKey] = state.cells[key]
  }

  const newColWidths = {}
  for (let c = 0; c <= state.cols; c++) {
    if (c < index) {
      newColWidths[c] = state.colWidths[c] || DEFAULT_COL_WIDTH
    } else if (c === index) {
      newColWidths[c] = DEFAULT_COL_WIDTH
    } else {
      newColWidths[c] = state.colWidths[c - 1] || DEFAULT_COL_WIDTH
    }
  }

  return {
    ...state,
    cells: computeAllFormulas(newCells, state.rows, state.cols + 1),
    cols: state.cols + 1,
    colWidths: newColWidths,
  }
}

export const deleteCol = (state, index) => {
  if (state.cols <= 1) return state

  const newCells = {}
  for (const key of Object.keys(state.cells)) {
    const ref = parseCellRef(key)
    if (!ref) continue
    if (ref.col === index) continue
    const newCol = ref.col > index ? ref.col - 1 : ref.col
    const newKey = cellRefToIndex(ref.row, newCol)
    newCells[newKey] = state.cells[key]
  }

  const newColWidths = {}
  for (let c = 0; c < state.cols - 1; c++) {
    if (c < index) {
      newColWidths[c] = state.colWidths[c] || DEFAULT_COL_WIDTH
    } else {
      newColWidths[c] = state.colWidths[c + 1] || DEFAULT_COL_WIDTH
    }
  }

  return {
    ...state,
    cells: computeAllFormulas(newCells, state.rows, state.cols - 1),
    cols: state.cols - 1,
    colWidths: newColWidths,
  }
}

export const applyStyleToSelection = (cells, selection, styleUpdate) => {
  if (!selection || !selection.start || !selection.end) return cells
  const newCells = { ...cells }
  const minRow = Math.min(selection.start.row, selection.end.row)
  const maxRow = Math.max(selection.start.row, selection.end.row)
  const minCol = Math.min(selection.start.col, selection.end.col)
  const maxCol = Math.max(selection.start.col, selection.end.col)

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const key = cellRefToIndex(r, c)
      const existing = newCells[key] || { raw: '', display: '', style: {} }
      newCells[key] = {
        ...existing,
        style: { ...existing.style, ...styleUpdate },
      }
    }
  }
  return newCells
}
