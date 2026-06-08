import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './spreadsheet.css'
import {
  DEFAULT_ROW_HEIGHT,
  MIN_COL_WIDTH,
  MIN_ROW_HEIGHT,
  colIndexToLetter,
  cellRefToIndex,
  getCellRawValue,
  getCellDisplayValue,
  getCellStyle,
  isFormula,
  evaluateFormula,
  recomputeDependents,
  exportCSV,
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
  saveToLocalStorage,
  loadFromLocalStorage,
} from './spreadsheetUtils'

const ALIGN_OPTIONS = [
  { id: 'left', label: '左对齐', icon: '⯇' },
  { id: 'center', label: '居中', icon: '≡' },
  { id: 'right', label: '右对齐', icon: '⯈' },
]

const SpreadsheetPage = () => {
  const [state, setState] = useState(() => {
    const saved = loadFromLocalStorage()
    return saved || createInitialState()
  })
  const [selection, setSelection] = useState({
    start: { row: 0, col: 0 },
    end: { row: 0, col: 0 },
  })
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)
  const editInputRef = useRef(null)
  const globalListenersRef = useRef([])

  const { cells, rows, cols, colWidths, rowHeights } = state

  const totalWidth = useMemo(() => {
    let total = 50
    for (let c = 0; c < cols; c++) {
      total += colWidths[c] || 100
    }
    return total
  }, [cols, colWidths])

  const totalHeight = useMemo(() => {
    let total = 32
    for (let r = 0; r < rows; r++) {
      total += rowHeights[r] || DEFAULT_ROW_HEIGHT
    }
    return total
  }, [rows, rowHeights])

  const activeCell = selection?.start

  const activeCellRef = useMemo(() => {
    if (!activeCell) return ''
    return cellRefToIndex(activeCell.row, activeCell.col)
  }, [activeCell])

  const getSelectionRange = useCallback(() => {
    if (!selection?.start || !selection?.end) return null
    return {
      minRow: Math.min(selection.start.row, selection.end.row),
      maxRow: Math.max(selection.start.row, selection.end.row),
      minCol: Math.min(selection.start.col, selection.end.col),
      maxCol: Math.max(selection.start.col, selection.end.col),
    }
  }, [selection])

  const isInSelection = useCallback((row, col) => {
    const range = getSelectionRange()
    if (!range) return false
    return (
      row >= range.minRow &&
      row <= range.maxRow &&
      col >= range.minCol &&
      col <= range.maxCol
    )
  }, [getSelectionRange])

  const isSelectedCell = useCallback((row, col) => {
    return activeCell && activeCell.row === row && activeCell.col === col
  }, [activeCell])

  const handleCellClick = useCallback((row, col, e) => {
    if (e.shiftKey && selection?.start) {
      setSelection({
        start: selection.start,
        end: { row, col },
      })
    } else {
      setSelection({
        start: { row, col },
        end: { row, col },
      })
    }
    setEditing(null)
    setContextMenu(null)
  }, [selection])

  const handleCellDoubleClick = useCallback((row, col) => {
    const key = cellRefToIndex(row, col)
    const raw = getCellRawValue(cells, row, col)
    setSelection({
      start: { row, col },
      end: { row, col },
    })
    setEditing({ row, col, key })
    setEditValue(raw)
  }, [cells])

  const startEditing = useCallback(() => {
    if (!activeCell) return
    const key = cellRefToIndex(activeCell.row, activeCell.col)
    const raw = getCellRawValue(cells, activeCell.row, activeCell.col)
    setEditing({ row: activeCell.row, col: activeCell.col, key })
    setEditValue(raw)
  }, [activeCell, cells])

  const commitEdit = useCallback((moveToNext = true) => {
    if (!editing) return
    const { key } = editing

    setState(prev => {
      const existing = prev.cells[key] || { raw: '', display: '', style: {} }
      const newCell = { ...existing, raw: editValue }
      let newCells = { ...prev.cells, [key]: newCell }

      if (isFormula(editValue)) {
        const display = evaluateFormula(editValue, newCells)
        newCells[key] = { ...newCell, display: String(display) }
      } else {
        newCells[key] = { ...newCell, display: editValue }
      }

      newCells = recomputeDependents(newCells, key, prev.rows, prev.cols)

      return { ...prev, cells: newCells }
    })

    setEditing(null)

    if (moveToNext && activeCell && activeCell.row + 1 < rows) {
      const newRow = activeCell.row + 1
      setSelection({
        start: { row: newRow, col: activeCell.col },
        end: { row: newRow, col: activeCell.col },
      })
    }
  }, [editing, editValue, activeCell, rows])

  const cancelEdit = useCallback(() => {
    setEditing(null)
  }, [])

  const applyStyle = useCallback((styleUpdate) => {
    setState(prev => ({
      ...prev,
      cells: applyStyleToSelection(prev.cells, selection, styleUpdate),
    }))
  }, [selection])

  const toggleBold = useCallback(() => {
    if (!activeCell) return
    const currentStyle = getCellStyle(cells, activeCell.row, activeCell.col)
    applyStyle({ bold: !currentStyle.bold })
  }, [activeCell, cells, applyStyle])

  const toggleItalic = useCallback(() => {
    if (!activeCell) return
    const currentStyle = getCellStyle(cells, activeCell.row, activeCell.col)
    applyStyle({ italic: !currentStyle.italic })
  }, [activeCell, cells, applyStyle])

  const handleBgColorChange = useCallback((e) => {
    applyStyle({ bgColor: e.target.value })
  }, [applyStyle])

  const handleFgColorChange = useCallback((e) => {
    applyStyle({ color: e.target.value })
  }, [applyStyle])

  const setAlign = useCallback((align) => {
    applyStyle({ align })
  }, [applyStyle])

  const handleKeyDown = useCallback((e) => {
    if (editing) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        commitEdit(true)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        cancelEdit()
        return
      }
      return
    }

    if (!activeCell) return

    const { row, col } = activeCell

    if (e.key === 'ArrowUp' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      const newRow = Math.max(0, row - 1)
      setSelection({
        start: { row: newRow, col },
        end: { row: newRow, col },
      })
      return
    }
    if (e.key === 'ArrowDown' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      const newRow = Math.min(rows - 1, row + 1)
      setSelection({
        start: { row: newRow, col },
        end: { row: newRow, col },
      })
      return
    }
    if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      const newCol = Math.max(0, col - 1)
      setSelection({
        start: { row, col: newCol },
        end: { row, col: newCol },
      })
      return
    }
    if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      const newCol = Math.min(cols - 1, col + 1)
      setSelection({
        start: { row, col: newCol },
        end: { row, col: newCol },
      })
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      startEditing()
      return
    }

    if (e.key === 'F2') {
      e.preventDefault()
      startEditing()
      return
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      e.preventDefault()
      const data = copyCellsToClipboardData(cells, selection)
      if (navigator.clipboard) {
        navigator.clipboard.writeText(data).catch(() => {})
      }
      return
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
      e.preventDefault()
      if (navigator.clipboard) {
        navigator.clipboard.readText().then(text => {
          const data = parseClipboardData(text)
          if (data.length > 0 && activeCell) {
            setState(prev => {
              const newCells = pasteClipboardData(prev.cells, data, activeCell.row, activeCell.col, prev.rows, prev.cols)
              return { ...prev, cells: newCells }
            })
          }
        }).catch(() => {})
      }
      return
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault()
      setSelection({
        start: { row: 0, col: 0 },
        end: { row: rows - 1, col: cols - 1 },
      })
      return
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      toggleBold()
      return
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault()
      toggleItalic()
      return
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      const range = getSelectionRange()
      if (!range) return
      setState(prev => {
        const newCells = { ...prev.cells }
        for (let r = range.minRow; r <= range.maxRow; r++) {
          for (let c = range.minCol; c <= range.maxCol; c++) {
            const key = cellRefToIndex(r, c)
            if (newCells[key]) {
              newCells[key] = { ...newCells[key], raw: '', display: '' }
            }
          }
        }
        return { ...prev, cells: newCells }
      })
      return
    }

    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1 && !e.key.startsWith('Arrow')) {
      e.preventDefault()
      const key = cellRefToIndex(row, col)
      setEditing({ row, col, key })
      setEditValue(e.key)
    }
  }, [editing, commitEdit, cancelEdit, activeCell, rows, cols, startEditing, cells, selection, getSelectionRange, toggleBold, toggleItalic])

  const handleMouseDown = useCallback((row, col, e) => {
    if (e.button !== 0) return
    setSelection({
      start: { row, col },
      end: { row, col },
    })
    setContextMenu(null)

    const handleMouseMove = (moveEvent) => {
      const target = moveEvent.target
      if (!target || !target.dataset) return
      const tRow = target.dataset.row
      const tCol = target.dataset.col
      if (tRow !== undefined && tCol !== undefined) {
        setSelection(prev => ({
          start: prev.start,
          end: { row: parseInt(tRow, 10), col: parseInt(tCol, 10) },
        }))
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      globalListenersRef.current = globalListenersRef.current.filter(
        l => l.handler !== handleMouseMove && l.handler !== handleMouseUp
      )
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    globalListenersRef.current.push({ event: 'mousemove', handler: handleMouseMove })
    globalListenersRef.current.push({ event: 'mouseup', handler: handleMouseUp })
  }, [])

  const handleContextMenu = useCallback((e, type, index) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      index,
    })
  }, [])

  const handleContextMenuItem = useCallback((action) => {
    if (!contextMenu) return
    const { type, index } = contextMenu

    setState(prev => {
      if (type === 'row') {
        if (action === 'insert-above') return insertRow(prev, index)
        if (action === 'insert-below') return insertRow(prev, index + 1)
        if (action === 'delete') return deleteRow(prev, index)
      }
      if (type === 'col') {
        if (action === 'insert-left') return insertCol(prev, index)
        if (action === 'insert-right') return insertCol(prev, index + 1)
        if (action === 'delete') return deleteCol(prev, index)
      }
      return prev
    })

    setContextMenu(null)
  }, [contextMenu])

  const handleColResizeStart = useCallback((colIndex, e) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = colWidths[colIndex] || 100

    const handleMouseMove = (moveEvent) => {
      const diff = moveEvent.clientX - startX
      const newWidth = Math.max(MIN_COL_WIDTH, startWidth + diff)
      setState(prev => ({
        ...prev,
        colWidths: { ...prev.colWidths, [colIndex]: newWidth },
      }))
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      globalListenersRef.current = globalListenersRef.current.filter(
        l => l.handler !== handleMouseMove && l.handler !== handleMouseUp
      )
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    globalListenersRef.current.push({ event: 'mousemove', handler: handleMouseMove })
    globalListenersRef.current.push({ event: 'mouseup', handler: handleMouseUp })
  }, [colWidths])

  const handleRowResizeStart = useCallback((rowIndex, e) => {
    e.preventDefault()
    e.stopPropagation()
    const startY = e.clientY
    const startHeight = rowHeights[rowIndex] || DEFAULT_ROW_HEIGHT

    const handleMouseMove = (moveEvent) => {
      const diff = moveEvent.clientY - startY
      const newHeight = Math.max(MIN_ROW_HEIGHT, startHeight + diff)
      setState(prev => ({
        ...prev,
        rowHeights: { ...prev.rowHeights, [rowIndex]: newHeight },
      }))
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      globalListenersRef.current = globalListenersRef.current.filter(
        l => l.handler !== handleMouseMove && l.handler !== handleMouseUp
      )
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    globalListenersRef.current.push({ event: 'mousemove', handler: handleMouseMove })
    globalListenersRef.current.push({ event: 'mouseup', handler: handleMouseUp })
  }, [rowHeights])

  const handleExportCSV = useCallback(() => {
    exportCSV(cells, rows, cols)
  }, [cells, rows, cols])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImportFile = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      e.target.value = ''
      return
    }

    try {
      const text = await file.text()
      setState(prev => {
        const result = importCSV(text, prev.cells, prev.rows, prev.cols)
        const newColWidths = { ...prev.colWidths }
        const newRowHeights = { ...prev.rowHeights }
        for (let c = 0; c < result.cols; c++) {
          if (newColWidths[c] === undefined) newColWidths[c] = 100
        }
        for (let r = 0; r < result.rows; r++) {
          if (newRowHeights[r] === undefined) newRowHeights[r] = DEFAULT_ROW_HEIGHT
        }
        return {
          cells: result.cells,
          rows: result.rows,
          cols: result.cols,
          colWidths: newColWidths,
          rowHeights: newRowHeights,
        }
      })
      setErrorMessage('')
    } catch {
      setErrorMessage('CSV 导入失败，请检查文件格式是否正确')
      setTimeout(() => setErrorMessage(''), 3000)
    } finally {
      e.target.value = ''
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    saveToLocalStorage(state)
  }, [state])

  useEffect(() => {
    return () => {
      for (const listener of globalListenersRef.current) {
        document.removeEventListener(listener.event, listener.handler)
      }
      globalListenersRef.current = []
    }
  }, [])

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editing])

  const activeCellStyle = activeCell ? getCellStyle(cells, activeCell.row, activeCell.col) : {}

  const gridTemplateColumns = useMemo(() => {
    const parts = ['50px']
    for (let c = 0; c < cols; c++) {
      parts.push(`${colWidths[c] || 100}px`)
    }
    return parts.join(' ')
  }, [cols, colWidths])

  const getCellStyleObj = useCallback((row, col) => {
    const style = getCellStyle(cells, row, col)
    const cssStyle = {}
    if (style.bold) cssStyle.fontWeight = '700'
    if (style.italic) cssStyle.fontStyle = 'italic'
    if (style.bgColor) cssStyle.backgroundColor = style.bgColor
    if (style.color) cssStyle.color = style.color
    if (style.align) cssStyle.justifyContent = style.align
    return cssStyle
  }, [cells])

  const renderGrid = () => {
    const items = []

    items.push(
      <div
        key="corner"
        className="ss-corner"
        style={{ gridRow: 1, gridColumn: 1 }}
      />
    )

    for (let c = 0; c < cols; c++) {
      const isColSelected = selection &&
        selection.start &&
        selection.end &&
        c >= Math.min(selection.start.col, selection.end.col) &&
        c <= Math.max(selection.start.col, selection.end.col)
      items.push(
        <div
          key={`col-${c}`}
          className={`ss-col-header ${isColSelected ? 'selected' : ''}`}
          style={{ gridRow: 1, gridColumn: c + 2, width: colWidths[c] || 100 }}
          onContextMenu={(e) => handleContextMenu(e, 'col', c)}
          data-col={c}
        >
          {colIndexToLetter(c)}
          <div
            className="ss-col-resize"
            onMouseDown={(e) => handleColResizeStart(c, e)}
          />
        </div>
      )
    }

    for (let r = 0; r < rows; r++) {
      const isRowSelected = selection &&
        selection.start &&
        selection.end &&
        r >= Math.min(selection.start.row, selection.end.row) &&
        r <= Math.max(selection.start.row, selection.end.row)
      items.push(
        <div
          key={`row-${r}`}
          className={`ss-row-header ${isRowSelected ? 'selected' : ''}`}
          style={{ gridRow: r + 2, gridColumn: 1, height: rowHeights[r] || DEFAULT_ROW_HEIGHT }}
          onContextMenu={(e) => handleContextMenu(e, 'row', r)}
          data-row={r}
        >
          {r + 1}
          <div
            className="ss-row-resize"
            onMouseDown={(e) => handleRowResizeStart(r, e)}
          />
        </div>
      )
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = cellRefToIndex(r, c)
        const display = getCellDisplayValue(cells, r, c)
        const isSelected = isSelectedCell(r, c)
        const inSelection = isInSelection(r, c)
        const isEditing = editing && editing.row === r && editing.col === c
        const cellStyle = getCellStyleObj(r, c)

        items.push(
          <div
            key={key}
            className={`ss-cell ${isSelected ? 'selected' : ''} ${inSelection && !isSelected ? 'in-selection' : ''}`}
            style={{
              gridRow: r + 2,
              gridColumn: c + 2,
              width: colWidths[c] || 100,
              height: rowHeights[r] || DEFAULT_ROW_HEIGHT,
              ...cellStyle,
            }}
            onClick={(e) => handleCellClick(r, c, e)}
            onDoubleClick={() => handleCellDoubleClick(r, c)}
            onMouseDown={(e) => handleMouseDown(r, c, e)}
            data-row={r}
            data-col={c}
          >
            {isEditing ? (
              <input
                ref={editInputRef}
                className="ss-cell-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => commitEdit(false)}
              />
            ) : (
              display
            )}
          </div>
        )
      }
    }

    return items
  }

  return (
    <div className="ss-page" tabIndex={0} onKeyDown={handleKeyDown} ref={containerRef}>
      <header className="ss-header">
        <div className="ss-header-left">
          <Link to="/" className="ss-back-link">← 返回首页</Link>
          <h1 className="ss-title">轻量级电子表格</h1>
        </div>
        <div className="ss-cell-info">{activeCellRef}</div>
      </header>

      <div className="ss-toolbar">
        <div className="ss-toolbar-group">
          <button
            type="button"
            className={`ss-toolbar-btn ss-bold ${activeCellStyle.bold ? 'active' : ''}`}
            onClick={toggleBold}
            title="加粗 (Ctrl+B)"
          >
            B
          </button>
          <button
            type="button"
            className={`ss-toolbar-btn ss-italic ${activeCellStyle.italic ? 'active' : ''}`}
            onClick={toggleItalic}
            title="斜体 (Ctrl+I)"
          >
            I
          </button>
        </div>

        <div className="ss-toolbar-group">
          <span className="ss-toolbar-label">背景</span>
          <input
            type="color"
            className="ss-color-input"
            value={activeCellStyle.bgColor || '#ffffff'}
            onChange={handleBgColorChange}
            title="背景颜色"
          />
          <span className="ss-toolbar-label">字体</span>
          <input
            type="color"
            className="ss-color-input"
            value={activeCellStyle.color || '#000000'}
            onChange={handleFgColorChange}
            title="字体颜色"
          />
        </div>

        <div className="ss-toolbar-group">
          {ALIGN_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              className={`ss-toolbar-btn ${activeCellStyle.align === opt.id ? 'active' : ''}`}
              onClick={() => setAlign(opt.id)}
              title={opt.label}
            >
              {opt.icon}
            </button>
          ))}
        </div>

        <div className="ss-toolbar-group">
          <button
            type="button"
            className="ss-toolbar-btn"
            onClick={handleExportCSV}
            title="导出 CSV"
          >
            📤 导出
          </button>
          <button
            type="button"
            className="ss-toolbar-btn"
            onClick={handleImportClick}
            title="导入 CSV"
          >
            📥 导入
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="ss-error-message">
          {errorMessage}
        </div>
      )}

      <div className="ss-container">
        <div className="ss-grid-wrapper" style={{ width: totalWidth, height: totalHeight }}>
          <div
            className="ss-grid"
            style={{
              gridTemplateColumns,
              gridAutoRows: 'min-content',
            }}
          >
            {renderGrid()}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      {contextMenu && (
        <div
          className="ss-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'row' && (
            <>
              <div
                className="ss-context-menu-item"
                onClick={() => handleContextMenuItem('insert-above')}
              >
                在上方插入行
              </div>
              <div
                className="ss-context-menu-item"
                onClick={() => handleContextMenuItem('insert-below')}
              >
                在下方插入行
              </div>
              <div className="ss-context-menu-divider" />
              <div
                className="ss-context-menu-item"
                onClick={() => handleContextMenuItem('delete')}
              >
                删除行
              </div>
            </>
          )}
          {contextMenu.type === 'col' && (
            <>
              <div
                className="ss-context-menu-item"
                onClick={() => handleContextMenuItem('insert-left')}
              >
                在左侧插入列
              </div>
              <div
                className="ss-context-menu-item"
                onClick={() => handleContextMenuItem('insert-right')}
              >
                在右侧插入列
              </div>
              <div className="ss-context-menu-divider" />
              <div
                className="ss-context-menu-item"
                onClick={() => handleContextMenuItem('delete')}
              >
                删除列
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SpreadsheetPage
