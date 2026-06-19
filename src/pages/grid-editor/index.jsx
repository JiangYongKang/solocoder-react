import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './grid-editor.css'
import {
  HORIZONTAL_ALIGN,
  VERTICAL_ALIGN,
  BORDER_STYLE,
  HORIZONTAL_ALIGN_LABELS,
  VERTICAL_ALIGN_LABELS,
  BORDER_STYLE_LABELS,
  MIN_COLS,
  MAX_COLS,
  MIN_ROWS,
  MAX_ROWS,
  MIN_CELL_WIDTH,
  MAX_CELL_WIDTH,
  MIN_CELL_HEIGHT,
  MAX_CELL_HEIGHT,
  MIN_BORDER_WIDTH,
  MAX_BORDER_WIDTH,
  DEFAULT_BORDER_WIDTH,
  DEFAULT_BORDER_COLOR,
} from './constants'
import {
  createInitialGrid,
  updateGridDimensions,
  clampCellWidth,
  clampCellHeight,
  canMergeCells,
  mergeCells,
  canSplitCell,
  splitCell,
  updateCellStyle,
  generateHTML,
  generateCSS,
  generateFullCode,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  horizontalAlignToCSS,
  verticalAlignToCSS,
} from './gridEditorCore'

let _initStorageCache = null

function _getInitStorage() {
  if (!_initStorageCache) {
    _initStorageCache = loadFromStorage()
  }
  return _initStorageCache
}

function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const menuWidth = 180
  const menuHeight = Math.max(items.length * 40 + 16, 80)

  let adjustedX = x
  let adjustedY = y
  if (adjustedX + menuWidth + 8 > vw) adjustedX = vw - menuWidth - 8
  if (adjustedX < 8) adjustedX = 8
  if (adjustedY + menuHeight + 8 > vh) adjustedY = vh - menuHeight - 8
  if (adjustedY < 8) adjustedY = 8

  return (
    <div
      ref={menuRef}
      className="ge-context-menu"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`ge-context-menu-item ${item.danger ? 'danger' : ''}`}
          onClick={() => {
            item.onClick?.()
            onClose()
          }}
        >
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function CodeModal({ grid, onClose }) {
  const [codeMode, setCodeMode] = useState('full')
  const [copySuccess, setCopySuccess] = useState(false)

  const getCode = () => {
    switch (codeMode) {
      case 'html':
        return generateHTML(grid)
      case 'css':
        return generateCSS(grid)
      case 'full':
      default:
        return generateFullCode(grid)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCode())
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      alert('复制失败: ' + (err?.message || '请手动复制'))
    }
  }

  return (
    <div className="ge-modal-overlay" onClick={onClose}>
      <div className="ge-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ge-modal-header">
          <h3 className="ge-modal-title">生成代码</h3>
          <button className="ge-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="ge-modal-body">
          <div className="ge-code-tabs">
            <button
              className={`ge-code-tab ${codeMode === 'full' ? 'active' : ''}`}
              onClick={() => setCodeMode('full')}
            >
              完整 HTML
            </button>
            <button
              className={`ge-code-tab ${codeMode === 'html' ? 'active' : ''}`}
              onClick={() => setCodeMode('html')}
            >
              HTML
            </button>
            <button
              className={`ge-code-tab ${codeMode === 'css' ? 'active' : ''}`}
              onClick={() => setCodeMode('css')}
            >
              CSS
            </button>
          </div>
          <pre className="ge-code-preview">{getCode()}</pre>
        </div>
        <div className="ge-modal-footer">
          {copySuccess && <span className="ge-copy-success">✓ 已复制到剪贴板</span>}
          <button className="ge-btn" onClick={onClose}>关闭</button>
          <button className="ge-btn ge-btn-primary" onClick={handleCopy}>
            复制代码
          </button>
        </div>
      </div>
    </div>
  )
}

function MergeDialog({ startCol, startRow, endCol, endRow, onMerge, onCancel }) {
  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)
  const minRow = Math.min(startRow, endRow)
  const maxRow = Math.max(startRow, endRow)
  const colSpan = maxCol - minCol + 1
  const rowSpan = maxRow - minRow + 1

  return (
    <div className="ge-merge-dialog">
      <div className="ge-merge-info">
        <p>选中范围: <span className="range">({minCol}, {minRow}) - ({maxCol}, {maxRow})</span></p>
        <p>合并后大小: <span className="range">{colSpan} × {rowSpan}</span></p>
      </div>
      <div className="ge-merge-actions">
        <button className="ge-btn" onClick={onCancel}>取消</button>
        <button className="ge-btn ge-btn-primary" onClick={onMerge}>合并单元格</button>
      </div>
    </div>
  )
}

function GridCell({
  cell,
  cellWidth,
  cellHeight,
  selected,
  selecting,
  showNumber,
  onMouseDown,
  onMouseEnter,
  onContextMenu,
}) {
  const justify = horizontalAlignToCSS(cell.horizontalAlign)
  const align = verticalAlignToCSS(cell.verticalAlign)

  return (
    <div
      className={`ge-cell ${selected ? 'selected' : ''} ${selecting ? 'selecting' : ''}`}
      style={{
        gridColumn: `${cell.col} / span ${cell.colSpan}`,
        gridRow: `${cell.row} / span ${cell.rowSpan}`,
        width: `${cellWidth * cell.colSpan}px`,
        height: `${cellHeight * cell.rowSpan}px`,
        justifyContent: justify,
        alignItems: align,
        border: `${cell.borderWidth}px ${cell.borderStyle} ${cell.borderColor}`,
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onContextMenu={onContextMenu}
      data-col={cell.col}
      data-row={cell.row}
      data-id={cell.id}
    >
      {showNumber && (
        <span className="ge-cell-number">({cell.col},{cell.row})</span>
      )}
      {(cell.colSpan > 1 || cell.rowSpan > 1) && (
        <span className="ge-cell-merge-label">{cell.colSpan}×{cell.rowSpan}</span>
      )}
    </div>
  )
}

function GridEditorPage() {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const lastSaveAlertRef = useRef(0)

  const [grid, setGrid] = useState(() => {
    const saved = _getInitStorage()
    if (saved.data) {
      return saved.data
    }
    return createInitialGrid()
  })

  const [selectedCellIds, setSelectedCellIds] = useState([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [selectionEnd, setSelectionEnd] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [mergeDialog, setMergeDialog] = useState(null)
  const [codeModal, setCodeModal] = useState(false)
  const [codeMode, setCodeMode] = useState('css')
  const [copySuccess, setCopySuccess] = useState(false)
  const [colsInput, setColsInput] = useState(String(grid.cols))
  const [rowsInput, setRowsInput] = useState(String(grid.rows))

  const latestGridRef = useRef(grid)
  useEffect(() => {
    latestGridRef.current = grid
  }, [grid])

  useEffect(() => {
    const err = _initStorageCache?.error
    _initStorageCache = null
    if (err) {
      console.warn('读取本地存储失败:', err)
    }
  }, [])

  useEffect(() => {
    const result = saveToStorage(grid)
    if (!result.success) {
      const now = Date.now()
      if (now - lastSaveAlertRef.current >= 5000) {
        lastSaveAlertRef.current = now
        alert('保存本地存储失败，数据可能丢失: ' + result.error)
      }
    }
  }, [grid])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting && selectionStart && selectionEnd) {
        const { col: startCol, row: startRow } = selectionStart
        const { col: endCol, row: endRow } = selectionEnd

        if (startCol !== endCol || startRow !== endRow) {
          const curGrid = latestGridRef.current
          if (canMergeCells(curGrid.cells, startCol, startRow, endCol, endRow, curGrid.cols, curGrid.rows)) {
            setMergeDialog({ startCol, startRow, endCol, endRow })
          }
        }
      }
      setIsSelecting(false)
      setSelectionStart(null)
      setSelectionEnd(null)
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isSelecting, selectionStart, selectionEnd])

  const handleColsChange = (e) => {
    const val = e.target.value
    setColsInput(val)
    const num = parseInt(val, 10)
    if (!isNaN(num) && num >= MIN_COLS && num <= MAX_COLS) {
      setGrid((prev) => updateGridDimensions(prev, num, prev.rows))
    }
  }

  const handleColsBlur = () => {
    setColsInput(String(grid.cols))
  }

  const handleRowsChange = (e) => {
    const val = e.target.value
    setRowsInput(val)
    const num = parseInt(val, 10)
    if (!isNaN(num) && num >= MIN_ROWS && num <= MAX_ROWS) {
      setGrid((prev) => updateGridDimensions(prev, prev.cols, num))
    }
  }

  const handleRowsBlur = () => {
    setRowsInput(String(grid.rows))
  }

  const handleCellWidthChange = (e) => {
    const val = parseInt(e.target.value, 10)
    setGrid((prev) => ({ ...prev, cellWidth: clampCellWidth(val) }))
  }

  const handleCellHeightChange = (e) => {
    const val = parseInt(e.target.value, 10)
    setGrid((prev) => ({ ...prev, cellHeight: clampCellHeight(val) }))
  }

  const handleToggleGridLines = () => {
    setGrid((prev) => ({ ...prev, showGridLines: !prev.showGridLines }))
  }

  const handleToggleAutoNumbering = () => {
    setGrid((prev) => ({ ...prev, autoNumbering: !prev.autoNumbering }))
  }

  const handleCellMouseDown = (e, cell) => {
    if (e.button !== 0) return

    const isMultiSelect = e.ctrlKey || e.metaKey

    if (isMultiSelect) {
      setSelectedCellIds((prev) => {
        if (prev.includes(cell.id)) {
          return prev.filter((id) => id !== cell.id)
        }
        return [...prev, cell.id]
      })
    } else {
      setSelectedCellIds([cell.id])
      setIsSelecting(true)
      setSelectionStart({ col: cell.col, row: cell.row })
      setSelectionEnd({ col: cell.col, row: cell.row })
    }
  }

  const handleCellMouseEnter = (e, cell) => {
    if (!isSelecting) return

    const col = cell.col
    const row = cell.row
    setSelectionEnd({ col, row })
  }

  const handleCellContextMenu = (e, cell) => {
    e.preventDefault()
    e.stopPropagation()

    if (!selectedCellIds.includes(cell.id)) {
      setSelectedCellIds([cell.id])
    }

    const menuItems = []

    if (canSplitCell(cell)) {
      menuItems.push({
        label: '拆分单元格',
        icon: '✂️',
        onClick: () => {
          setGrid((prev) => ({
            ...prev,
            cells: splitCell(prev.cells, cell.id),
          }))
          setSelectedCellIds([])
        },
      })
    }

    if (menuItems.length > 0) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        items: menuItems,
      })
    }
  }

  const handleCanvasMouseDown = (e) => {
    if (e.target === gridRef.current || e.target.classList.contains('ge-grid')) {
      setSelectedCellIds([])
    }
  }

  const handleMerge = () => {
    if (!mergeDialog) return
    const { startCol, startRow, endCol, endRow } = mergeDialog
    setGrid((prev) => ({
      ...prev,
      cells: mergeCells(prev.cells, startCol, startRow, endCol, endRow),
    }))
    setMergeDialog(null)
    setSelectedCellIds([])
  }

  const handleStyleUpdate = (updates) => {
    if (selectedCellIds.length === 0) return
    setGrid((prev) => ({
      ...prev,
      cells: updateCellStyle(prev.cells, selectedCellIds, updates),
    }))
  }

  const handleHorizontalAlign = (align) => {
    handleStyleUpdate({ horizontalAlign: align })
  }

  const handleVerticalAlign = (align) => {
    handleStyleUpdate({ verticalAlign: align })
  }

  const handleBorderColor = (e) => {
    handleStyleUpdate({ borderColor: e.target.value })
  }

  const handleBorderWidth = (e) => {
    const val = parseInt(e.target.value, 10)
    handleStyleUpdate({ borderWidth: val })
  }

  const handleBorderStyle = (style) => {
    handleStyleUpdate({ borderStyle: style })
  }

  const handleReset = () => {
    if (confirm('确定要重置网格吗？所有更改将丢失。')) {
      clearStorage()
      const newGrid = createInitialGrid()
      setGrid(newGrid)
      setColsInput(String(newGrid.cols))
      setRowsInput(String(newGrid.rows))
      setSelectedCellIds([])
    }
  }

  const handleCopyCode = async () => {
    const code = codeMode === 'html' ? generateHTML(grid) : generateCSS(grid)
    try {
      await navigator.clipboard.writeText(code)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      alert('复制失败: ' + (err?.message || '请手动复制'))
    }
  }

  const getSelectingCells = () => {
    if (!selectionStart || !selectionEnd) return new Set()

    const minCol = Math.min(selectionStart.col, selectionEnd.col)
    const maxCol = Math.max(selectionStart.col, selectionEnd.col)
    const minRow = Math.min(selectionStart.row, selectionEnd.row)
    const maxRow = Math.max(selectionStart.row, selectionEnd.row)

    const selecting = new Set()
    for (const cell of grid.cells) {
      const cellEndCol = cell.col + cell.colSpan - 1
      const cellEndRow = cell.row + cell.rowSpan - 1

      if (
        cell.col >= minCol && cellEndCol <= maxCol &&
        cell.row >= minRow && cellEndRow <= maxRow
      ) {
        selecting.add(cell.id)
      }
    }
    return selecting
  }

  const selectedCells = grid.cells.filter((c) => selectedCellIds.includes(c.id))
  const firstSelected = selectedCells[0]
  const selectingIds = getSelectingCells()

  return (
    <div className="grid-editor-page">
      <div className="ge-header">
        <div className="ge-header-left">
          <button className="ge-btn" onClick={() => navigate('/')}>
            ← 返回
          </button>
          <h1 className="ge-title">定位器网格编辑器</h1>
        </div>
        <div className="ge-header-actions">
          <button
            className="ge-btn"
            onClick={handleToggleGridLines}
          >
            {grid.showGridLines ? '👁️ 隐藏网格线' : '👁️ 显示网格线'}
          </button>
          <button
            className="ge-btn"
            onClick={handleToggleAutoNumbering}
          >
            {grid.autoNumbering ? '🔢 关闭编号' : '🔢 自动编号'}
          </button>
          <button
            className="ge-btn ge-btn-primary"
            onClick={() => setCodeModal(true)}
          >
            📄 生成代码
          </button>
          <button
            className="ge-btn ge-btn-danger"
            onClick={handleReset}
          >
            🗑️ 重置
          </button>
        </div>
      </div>

      <div className="ge-main">
        <div className="ge-sidebar">
          <div className="ge-sidebar-section">
            <h3 className="ge-sidebar-section-title">网格配置</h3>

            <div className="ge-form-row">
              <div className="ge-form-group">
                <label className="ge-form-label">列数 ({MIN_COLS}-{MAX_COLS})</label>
                <input
                  type="number"
                  className="ge-form-input"
                  min={MIN_COLS}
                  max={MAX_COLS}
                  value={colsInput}
                  onChange={handleColsChange}
                  onBlur={handleColsBlur}
                />
              </div>
              <div className="ge-form-group">
                <label className="ge-form-label">行数 ({MIN_ROWS}-{MAX_ROWS})</label>
                <input
                  type="number"
                  className="ge-form-input"
                  min={MIN_ROWS}
                  max={MAX_ROWS}
                  value={rowsInput}
                  onChange={handleRowsChange}
                  onBlur={handleRowsBlur}
                />
              </div>
            </div>

            <div className="ge-form-group">
              <label className="ge-form-label">
                列宽 ({MIN_CELL_WIDTH}-{MAX_CELL_WIDTH}px)
                <span className="ge-slider-value">{grid.cellWidth}px</span>
              </label>
              <input
                type="range"
                className="ge-form-slider"
                min={MIN_CELL_WIDTH}
                max={MAX_CELL_WIDTH}
                value={grid.cellWidth}
                onChange={handleCellWidthChange}
              />
            </div>

            <div className="ge-form-group">
              <label className="ge-form-label">
                行高 ({MIN_CELL_HEIGHT}-{MAX_CELL_HEIGHT}px)
                <span className="ge-slider-value">{grid.cellHeight}px</span>
              </label>
              <input
                type="range"
                className="ge-form-slider"
                min={MIN_CELL_HEIGHT}
                max={MAX_CELL_HEIGHT}
                value={grid.cellHeight}
                onChange={handleCellHeightChange}
              />
            </div>
          </div>

          <div className="ge-sidebar-section">
            <h3 className="ge-sidebar-section-title">使用说明</h3>
            <div className="ge-help-text">
              <div>• 拖拽选中多个相邻单元格进行合并</div>
              <div>• 右键点击已合并单元格可拆分</div>
              <div>• 按住 Ctrl/Cmd 键可多选单元格</div>
              <div>• 选中单元格后可在右侧设置样式</div>
              <div>• 数据自动保存到本地存储</div>
            </div>
          </div>
        </div>

        <div className="ge-canvas-wrap" onMouseDown={handleCanvasMouseDown}>
          <div className="ge-canvas">
            <div
              ref={gridRef}
              className={`ge-grid ${grid.showGridLines ? 'show-grid-lines' : ''}`}
              style={{
                gridTemplateColumns: `repeat(${grid.cols}, ${grid.cellWidth}px)`,
                gridTemplateRows: `repeat(${grid.rows}, ${grid.cellHeight}px)`,
              }}
            >
              {grid.cells.map((cell) => (
                <GridCell
                  key={cell.id}
                  cell={cell}
                  cellWidth={grid.cellWidth}
                  cellHeight={grid.cellHeight}
                  selected={selectedCellIds.includes(cell.id)}
                  selecting={selectingIds.has(cell.id)}
                  showNumber={grid.autoNumbering}
                  onMouseDown={(e) => handleCellMouseDown(e, cell)}
                  onMouseEnter={(e) => handleCellMouseEnter(e, cell)}
                  onContextMenu={(e) => handleCellContextMenu(e, cell)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="ge-properties-panel">
          <h3 className="ge-sidebar-title">属性面板</h3>

          {selectedCells.length === 0 ? (
            <div className="ge-no-selection">
              请选择一个或多个单元格以编辑属性
            </div>
          ) : (
            <>
              <div className="ge-selection-info">
                已选择 {selectedCells.length} 个单元格
              </div>

              <div className="ge-sidebar-section">
                <h4 className="ge-sidebar-section-title">水平对齐</h4>
                <div className="ge-toggle-group">
                  {Object.values(HORIZONTAL_ALIGN).map((align) => (
                    <button
                      key={align}
                      className={`ge-toggle-btn ${firstSelected?.horizontalAlign === align ? 'active' : ''}`}
                      onClick={() => handleHorizontalAlign(align)}
                    >
                      {HORIZONTAL_ALIGN_LABELS[align]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ge-sidebar-section">
                <h4 className="ge-sidebar-section-title">垂直对齐</h4>
                <div className="ge-toggle-group">
                  {Object.values(VERTICAL_ALIGN).map((align) => (
                    <button
                      key={align}
                      className={`ge-toggle-btn ${firstSelected?.verticalAlign === align ? 'active' : ''}`}
                      onClick={() => handleVerticalAlign(align)}
                    >
                      {VERTICAL_ALIGN_LABELS[align]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ge-sidebar-section">
                <h4 className="ge-sidebar-section-title">边框样式</h4>

                <div className="ge-form-group">
                  <label className="ge-form-label">边框颜色</label>
                  <input
                    type="color"
                    className="ge-color-picker"
                    value={firstSelected?.borderColor || DEFAULT_BORDER_COLOR}
                    onChange={handleBorderColor}
                  />
                </div>

                <div className="ge-form-group">
                  <label className="ge-form-label">
                    边框粗细 ({MIN_BORDER_WIDTH}-{MAX_BORDER_WIDTH}px)
                    <span className="ge-slider-value">{firstSelected?.borderWidth || DEFAULT_BORDER_WIDTH}px</span>
                  </label>
                  <input
                    type="range"
                    className="ge-form-slider"
                    min={MIN_BORDER_WIDTH}
                    max={MAX_BORDER_WIDTH}
                    value={firstSelected?.borderWidth || DEFAULT_BORDER_WIDTH}
                    onChange={handleBorderWidth}
                  />
                  <div
                    className="ge-border-preview"
                    style={{
                      backgroundColor: firstSelected?.borderColor || DEFAULT_BORDER_COLOR,
                      height: `${firstSelected?.borderWidth || DEFAULT_BORDER_WIDTH}px`,
                    }}
                  />
                </div>

                <div className="ge-form-group">
                  <label className="ge-form-label">边框样式</label>
                  <div className="ge-toggle-group">
                    {Object.values(BORDER_STYLE).map((style) => (
                      <button
                        key={style}
                        className={`ge-toggle-btn ${firstSelected?.borderStyle === style ? 'active' : ''}`}
                        onClick={() => handleBorderStyle(style)}
                      >
                        {BORDER_STYLE_LABELS[style]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="ge-sidebar-section" style={{ marginTop: 'auto', borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
            <h3 className="ge-sidebar-title">代码预览</h3>
            <div className="ge-code-tabs">
              <button
                className={`ge-code-tab ${codeMode === 'html' ? 'active' : ''}`}
                onClick={() => setCodeMode('html')}
              >
                HTML
              </button>
              <button
                className={`ge-code-tab ${codeMode === 'css' ? 'active' : ''}`}
                onClick={() => setCodeMode('css')}
              >
                CSS
              </button>
            </div>
            <pre className="ge-code-preview" style={{
              maxHeight: '200px',
              fontSize: '11px',
              padding: '10px',
            }}>
              {codeMode === 'html' ? generateHTML(grid) : generateCSS(grid)}
            </pre>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                className="ge-btn"
                style={{ flex: 1, fontSize: '12px', padding: '6px 10px' }}
                onClick={handleCopyCode}
              >
                {copySuccess ? '✓ 已复制' : '📋 复制代码'}
              </button>
              <button
                className="ge-btn ge-btn-primary"
                style={{ flex: 1, fontSize: '12px', padding: '6px 10px' }}
                onClick={() => setCodeModal(true)}
              >
                展开
              </button>
            </div>
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {mergeDialog && (
        <div className="ge-modal-overlay" onClick={() => setMergeDialog(null)}>
          <div className="ge-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ge-modal-header">
              <h3 className="ge-modal-title">合并单元格</h3>
              <button className="ge-modal-close" onClick={() => setMergeDialog(null)}>×</button>
            </div>
            <div className="ge-modal-body">
              <MergeDialog
                startCol={mergeDialog.startCol}
                startRow={mergeDialog.startRow}
                endCol={mergeDialog.endCol}
                endRow={mergeDialog.endRow}
                onMerge={handleMerge}
                onCancel={() => setMergeDialog(null)}
              />
            </div>
          </div>
        </div>
      )}

      {codeModal && (
        <CodeModal
          grid={grid}
          onClose={() => setCodeModal(false)}
        />
      )}
    </div>
  )
}

export default GridEditorPage
