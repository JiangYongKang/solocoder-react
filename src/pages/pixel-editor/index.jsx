import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DEFAULT_GRID_WIDTH,
  DEFAULT_GRID_HEIGHT,
  MIN_GRID_SIZE,
  MAX_GRID_SIZE,
  CANVAS_BASE_SIZE,
  MIN_ZOOM,
  MAX_ZOOM,
  BRUSH_SIZES,
  TOOLS,
  DEFAULT_PALETTE,
  GRID_LINE_COLOR,
} from './constants.js'
import {
  createEmptyGrid,
  validateGridSize,
  cloneGrid,
  getPixel,
  applyBrush,
  applyEraser,
  floodFill,
  createHistory,
  pushHistory,
  undo,
  redo,
  canUndo,
  canRedo,
  addColorToPalette,
  removeColorFromPalette,
  exportToJSON,
  validateAndParseJSON,
  saveEditorData,
  loadEditorData,
  downloadJSONFile,
  canvasToPNG,
  downloadPNG,
  renderGridToCanvas,
  renderPreview,
  getCellFromMouseEvent,
  calculateZoomedCellSize,
} from './pixelEditorCore.js'
import './pixel-editor.css'

function PixelEditorPage() {
  const navigate = useNavigate()

  const canvasRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const exportCanvasRef = useRef(null)
  const isDrawingRef = useRef(false)
  const lastCellRef = useRef(null)
  const previousToolRef = useRef(null)
  const fileInputRef = useRef(null)

  function getInitialState() {
    const saved = loadEditorData()
    if (saved && saved.gridWidth && saved.gridHeight && saved.grid) {
      const sizeCheck = validateGridSize(saved.gridWidth, saved.gridHeight)
      if (sizeCheck.valid) {
        return {
          width: sizeCheck.width,
          height: sizeCheck.height,
          grid: saved.grid,
          palette: Array.isArray(saved.palette) && saved.palette.length > 0 ? saved.palette : null,
          currentColor: saved.currentColor || null,
        }
      }
    }
    return {
      width: DEFAULT_GRID_WIDTH,
      height: DEFAULT_GRID_HEIGHT,
      grid: null,
      palette: null,
      currentColor: null,
    }
  }

  const initial = getInitialState()

  const [gridWidth, setGridWidth] = useState(initial.width)
  const [gridHeight, setGridHeight] = useState(initial.height)
  const [grid, setGrid] = useState(() => initial.grid || createEmptyGrid(initial.width, initial.height))
  const [currentColor, setCurrentColor] = useState(initial.currentColor || '#000000')
  const [palette, setPalette] = useState(() => initial.palette || [...DEFAULT_PALETTE])
  const [tool, setTool] = useState(TOOLS.BRUSH)
  const [brushSize, setBrushSize] = useState(1)
  const [zoom, setZoom] = useState(2)
  const [history, setHistory] = useState(createHistory())
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportScale, setExportScale] = useState(1)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importError, setImportError] = useState('')
  const [importPendingData, setImportPendingData] = useState(null)

  const stateRef = useRef({ grid, currentColor, tool, brushSize, history })
  useEffect(() => {
    stateRef.current = { grid, currentColor, tool, brushSize, history }
  }, [grid, currentColor, tool, brushSize, history])

  useEffect(() => {
    saveEditorData({
      gridWidth,
      gridHeight,
      grid,
      palette,
      currentColor,
    })
  }, [gridWidth, gridHeight, grid, palette, currentColor])

  const baseCellSize = Math.floor(CANVAS_BASE_SIZE / Math.max(gridWidth, gridHeight))
  const cellSize = calculateZoomedCellSize(baseCellSize, zoom)

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    renderGridToCanvas(canvas, stateRef.current.grid, cellSize, true, GRID_LINE_COLOR)
  }, [cellSize])

  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    renderPreview(canvas, stateRef.current.grid)
  }, [])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas, grid])

  useEffect(() => {
    drawPreview()
  }, [drawPreview, grid])

  const pushToHistory = useCallback((prevGrid) => {
    setHistory((h) => pushHistory(h, prevGrid))
  }, [])

  const handleUndo = useCallback(() => {
    const { state: newState, history: newHistory } = undo(stateRef.current.history, stateRef.current.grid)
    if (newState !== stateRef.current.grid) {
      setGrid(newState)
      setHistory(newHistory)
    }
  }, [])

  const handleRedo = useCallback(() => {
    const { state: newState, history: newHistory } = redo(stateRef.current.history, stateRef.current.grid)
    if (newState !== stateRef.current.grid) {
      setGrid(newState)
      setHistory(newHistory)
    }
  }, [])

  const handleToolClick = useCallback((newTool) => {
    if (newTool === TOOLS.PICKER) {
      previousToolRef.current = stateRef.current.tool
    }
    setTool(newTool)
  }, [])

  const handleColorSelect = useCallback((color) => {
    setCurrentColor(color)
  }, [])

  const handleAddCustomColor = useCallback(() => {
    setPalette((p) => addColorToPalette(p, stateRef.current.currentColor))
  }, [])

  const handleRemoveColor = useCallback((e, color) => {
    e.stopPropagation()
    setPalette((p) => removeColorFromPalette(p, color))
  }, [])

  const handleGridSizeChange = useCallback((dimension, value) => {
    const num = parseInt(value, 10)
    if (isNaN(num)) return
    const clamped = Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, num))
    const newWidth = dimension === 'width' ? clamped : gridWidth
    const newHeight = dimension === 'height' ? clamped : gridHeight
    setGridWidth(newWidth)
    setGridHeight(newHeight)
    const newGrid = createEmptyGrid(newWidth, newHeight)
    for (let y = 0; y < Math.min(gridHeight, newHeight); y++) {
      for (let x = 0; x < Math.min(gridWidth, newWidth); x++) {
        newGrid[y][x] = grid[y][x]
      }
    }
    setGrid(newGrid)
    setHistory(createHistory())
  }, [gridWidth, gridHeight, grid])

  const processCell = useCallback((x, y) => {
    const { grid: g, currentColor: cc, tool: t, brushSize: bs } = stateRef.current

    if (t === TOOLS.PICKER) {
      const color = getPixel(g, x, y)
      if (color) {
        setCurrentColor(color)
      }
      if (previousToolRef.current) {
        setTool(previousToolRef.current)
        previousToolRef.current = null
      }
      return null
    }

    if (t === TOOLS.FILL) {
      return floodFill(g, x, y, cc)
    }

    if (t === TOOLS.ERASER) {
      return applyEraser(g, x, y, bs)
    }

    if (t === TOOLS.BRUSH) {
      return applyBrush(g, x, y, cc, bs)
    }

    return null
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    const canvas = canvasRef.current
    if (!canvas) return

    const { grid: g, tool: t } = stateRef.current
    const cell = getCellFromMouseEvent(canvas, g, e, cellSize)
    if (!cell) return

    isDrawingRef.current = true
    lastCellRef.current = cell

    if (t === TOOLS.PICKER) {
      processCell(cell.x, cell.y)
      isDrawingRef.current = false
      return
    }

    if (t === TOOLS.FILL) {
      const prevGrid = cloneGrid(g)
      const result = processCell(cell.x, cell.y)
      if (result && result !== g) {
        pushToHistory(prevGrid)
        setGrid(result)
      }
      isDrawingRef.current = false
      return
    }

    const prevGrid = cloneGrid(g)
    const result = processCell(cell.x, cell.y)
    if (result && result !== g) {
      pushToHistory(prevGrid)
      setGrid(result)
    }
  }, [cellSize, processCell, pushToHistory])

  const handleMouseMove = useCallback((e) => {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return

    const { grid: g, tool: t } = stateRef.current
    if (t === TOOLS.FILL || t === TOOLS.PICKER) return

    const cell = getCellFromMouseEvent(canvas, g, e, cellSize)
    if (!cell) return

    const last = lastCellRef.current
    if (last && last.x === cell.x && last.y === cell.y) return
    lastCellRef.current = cell

    setGrid((currentGrid) => {
      if (t === TOOLS.ERASER) {
        return applyEraser(currentGrid, cell.x, cell.y, stateRef.current.brushSize)
      }
      if (t === TOOLS.BRUSH) {
        return applyBrush(currentGrid, cell.x, cell.y, stateRef.current.currentColor, stateRef.current.brushSize)
      }
      return currentGrid
    })
  }, [cellSize])

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false
    lastCellRef.current = null
  }, [])

  const handleMouseLeave = useCallback(() => {
    isDrawingRef.current = false
    lastCellRef.current = null
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.5 : 0.5
    setZoom((z) => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta))
      return newZoom
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const wheelHandler = (e) => handleWheel(e)
    canvas.addEventListener('wheel', wheelHandler, { passive: false })
    return () => canvas.removeEventListener('wheel', wheelHandler)
  }, [handleWheel])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  const handleClearCanvas = useCallback(() => {
    const prevGrid = cloneGrid(grid)
    pushToHistory(prevGrid)
    setGrid(createEmptyGrid(gridWidth, gridHeight))
  }, [grid, gridWidth, gridHeight, pushToHistory])

  const handleExportJSON = useCallback(() => {
    const json = exportToJSON(grid, gridWidth, gridHeight, palette)
    downloadJSONFile(json, `pixel-art-${gridWidth}x${gridHeight}.json`)
  }, [grid, gridWidth, gridHeight, palette])

  const handleOpenImport = useCallback(() => {
    setImportError('')
    setImportPendingData(null)
    setShowImportModal(true)
  }, [])

  const handleImportFile = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result
      if (typeof content !== 'string') {
        setImportError('无法读取文件')
        return
      }
      const result = validateAndParseJSON(content)
      if (!result.valid) {
        setImportError(result.error || '导入失败')
        setImportPendingData(null)
        return
      }
      if (result.data.width !== gridWidth || result.data.height !== gridHeight) {
        setImportError(`导入的画布尺寸 (${result.data.width}×${result.data.height}) 与当前画布 (${gridWidth}×${gridHeight}) 不匹配`)
        setImportPendingData(null)
        return
      }
      setImportError('')
      setImportPendingData(result.data)
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [gridWidth, gridHeight])

  const handleConfirmImport = useCallback(() => {
    if (!importPendingData) return
    const prevGrid = cloneGrid(grid)
    pushToHistory(prevGrid)
    setGridWidth(importPendingData.width)
    setGridHeight(importPendingData.height)
    setGrid(importPendingData.grid)
    if (importPendingData.palette && importPendingData.palette.length > 0) {
      setPalette(importPendingData.palette)
    }
    setHistory(createHistory())
    setShowImportModal(false)
    setImportPendingData(null)
    setImportError('')
  }, [importPendingData, grid, pushToHistory])

  const handleOpenExportPNG = useCallback(() => {
    setExportScale(1)
    setShowExportModal(true)
  }, [])

  const handleExportPNG = useCallback(() => {
    const canvas = document.createElement('canvas')
    renderGridToCanvas(canvas, grid, 1, false, GRID_LINE_COLOR)
    const dataUrl = canvasToPNG(canvas, exportScale)
    downloadPNG(dataUrl, `pixel-art-${gridWidth * exportScale}x${gridHeight * exportScale}.png`)
    setShowExportModal(false)
  }, [grid, gridWidth, gridHeight, exportScale])

  const canUndoFlag = canUndo(history)
  const canRedoFlag = canRedo(history)

  return (
    <div className="pixel-editor-page">
      <div className="pixel-editor-header">
        <div className="pixel-editor-header-left">
          <button className="pixel-editor-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="pixel-editor-title">像素画编辑器</h1>
        </div>
        <div className="pixel-editor-header-actions">
          <button className="pixel-editor-btn" onClick={handleUndo} disabled={!canUndoFlag} title="撤销 (Ctrl+Z)">
            ↶ 撤销
          </button>
          <button className="pixel-editor-btn" onClick={handleRedo} disabled={!canRedoFlag} title="重做 (Ctrl+Y)">
            ↷ 重做
          </button>
          <button className="pixel-editor-btn" onClick={handleClearCanvas}>
            🗑 清空
          </button>
          <button className="pixel-editor-btn" onClick={handleOpenImport}>
            📥 导入JSON
          </button>
          <button className="pixel-editor-btn" onClick={handleExportJSON}>
            📤 导出JSON
          </button>
          <button className="pixel-editor-btn pixel-editor-btn--primary" onClick={handleOpenExportPNG}>
            💾 导出PNG
          </button>
        </div>
      </div>

      <div className="pixel-editor-main">
        <div className="pixel-editor-left-panel">
          <div className="pixel-editor-section">
            <h3 className="pixel-editor-panel-title">绘制工具</h3>
            <div className="pixel-editor-tools">
              <button
                className={`pixel-editor-tool-btn ${tool === TOOLS.BRUSH ? 'pixel-editor-tool-btn--active' : ''}`}
                onClick={() => handleToolClick(TOOLS.BRUSH)}
              >
                <span className="pixel-editor-tool-icon">✏️</span>
                <span>笔刷</span>
              </button>
              <button
                className={`pixel-editor-tool-btn ${tool === TOOLS.FILL ? 'pixel-editor-tool-btn--active' : ''}`}
                onClick={() => handleToolClick(TOOLS.FILL)}
              >
                <span className="pixel-editor-tool-icon">🪣</span>
                <span>填充</span>
              </button>
              <button
                className={`pixel-editor-tool-btn ${tool === TOOLS.ERASER ? 'pixel-editor-tool-btn--active' : ''}`}
                onClick={() => handleToolClick(TOOLS.ERASER)}
              >
                <span className="pixel-editor-tool-icon">🧽</span>
                <span>橡皮</span>
              </button>
              <button
                className={`pixel-editor-tool-btn ${tool === TOOLS.PICKER ? 'pixel-editor-tool-btn--active' : ''}`}
                onClick={() => handleToolClick(TOOLS.PICKER)}
              >
                <span className="pixel-editor-tool-icon">💧</span>
                <span>吸管</span>
              </button>
            </div>
          </div>

          <div className="pixel-editor-section">
            <h3 className="pixel-editor-panel-title">笔刷大小</h3>
            <div className="pixel-editor-brush-sizes">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  className={`pixel-editor-brush-size-btn ${brushSize === size ? 'pixel-editor-brush-size-btn--active' : ''}`}
                  onClick={() => setBrushSize(size)}
                >
                  {size}×{size}
                </button>
              ))}
            </div>
          </div>

          <div className="pixel-editor-section">
            <h3 className="pixel-editor-panel-title">画布尺寸</h3>
            <div className="pixel-editor-grid-size" style={{ marginBottom: '8px' }}>
              <label>宽:</label>
              <input
                type="number"
                min={MIN_GRID_SIZE}
                max={MAX_GRID_SIZE}
                value={gridWidth}
                onChange={(e) => handleGridSizeChange('width', e.target.value)}
              />
            </div>
            <div className="pixel-editor-grid-size">
              <label>高:</label>
              <input
                type="number"
                min={MIN_GRID_SIZE}
                max={MAX_GRID_SIZE}
                value={gridHeight}
                onChange={(e) => handleGridSizeChange('height', e.target.value)}
              />
            </div>
            <p className="pixel-editor-hint" style={{ marginTop: '8px' }}>
              范围: {MIN_GRID_SIZE}×{MIN_GRID_SIZE} ~ {MAX_GRID_SIZE}×{MAX_GRID_SIZE}
            </p>
          </div>

          <div className="pixel-editor-section">
            <h3 className="pixel-editor-panel-title">预览</h3>
            <div className="pixel-editor-preview">
              <canvas
                ref={previewCanvasRef}
                className="pixel-editor-preview-canvas"
                width={gridWidth}
                height={gridHeight}
                style={{ width: '128px', height: '128px' }}
              />
              <span className="pixel-editor-preview-info">{gridWidth} × {gridHeight}</span>
              <span className="pixel-editor-zoom-info">缩放: {Math.round(zoom * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="pixel-editor-center">
          <div className="pixel-editor-canvas-wrapper">
            <canvas
              ref={canvasRef}
              className="pixel-editor-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ width: gridWidth * cellSize, height: gridHeight * cellSize }}
            />
          </div>
          <p className="pixel-editor-hint" style={{ marginTop: '12px' }}>
            鼠标滚轮缩放 (100%-{MAX_ZOOM * 100}%) · Ctrl+Z 撤销 · Ctrl+Y 重做
          </p>
        </div>

        <div className="pixel-editor-right-panel">
          <div className="pixel-editor-section">
            <h3 className="pixel-editor-panel-title">调色板</h3>
            <div className="pixel-editor-palette">
              {palette.map((color, index) => (
                <div
                  key={`${color}-${index}`}
                  className={`pixel-editor-palette-color ${currentColor === color ? 'pixel-editor-palette-color--selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                >
                  {palette.length > 1 && (
                    <button
                      className="pixel-editor-palette-color-delete"
                      onClick={(e) => handleRemoveColor(e, color)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="pixel-editor-color-picker-row">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
              />
              <button
                className="pixel-editor-btn"
                onClick={handleAddCustomColor}
              >
                添加到调色板
              </button>
            </div>
          </div>

          <div className="pixel-editor-section">
            <h3 className="pixel-editor-panel-title">当前颜色</h3>
            <div
              style={{
                width: '100%',
                height: '60px',
                backgroundColor: currentColor,
                border: `2px solid ${currentColor === '#FFFFFF' || currentColor === '#ffffff' ? '#555' : 'transparent'}`,
                borderRadius: '6px',
                marginBottom: '8px',
              }}
            />
            <div style={{ fontSize: '13px', color: '#888', fontFamily: 'monospace', textAlign: 'center' }}>
              {currentColor.toUpperCase()}
            </div>
          </div>

          <div className="pixel-editor-section">
            <h3 className="pixel-editor-panel-title">操作提示</h3>
            <p className="pixel-editor-hint">
              • <strong>笔刷</strong>: 点击或拖拽绘制像素<br />
              • <strong>填充</strong>: 点击填充连通区域<br />
              • <strong>橡皮</strong>: 擦除像素为透明<br />
              • <strong>吸管</strong>: 拾取画布颜色<br />
              • <strong>滚轮</strong>: 缩放画布
            </p>
          </div>
        </div>
      </div>

      {showExportModal && (
        <div className="pixel-editor-modal-backdrop" onClick={() => setShowExportModal(false)}>
          <div className="pixel-editor-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="pixel-editor-modal-title">导出 PNG</h2>
            <div className="pixel-editor-modal-body">
              <p>选择导出放大倍数：</p>
              <div className="pixel-editor-scale-options">
                {[1, 2, 4, 8, 16].map((scale) => (
                  <button
                    key={scale}
                    className={`pixel-editor-scale-btn ${exportScale === scale ? 'pixel-editor-scale-btn--active' : ''}`}
                    onClick={() => setExportScale(scale)}
                  >
                    {scale}x<br />
                    <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.8 }}>
                      {gridWidth * scale}×{gridHeight * scale}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="pixel-editor-modal-footer">
              <button className="pixel-editor-btn" onClick={() => setShowExportModal(false)}>
                取消
              </button>
              <button className="pixel-editor-btn pixel-editor-btn--primary" onClick={handleExportPNG}>
                导出
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="pixel-editor-modal-backdrop" onClick={() => { setShowImportModal(false); setImportPendingData(null); setImportError(''); }}>
          <div className="pixel-editor-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="pixel-editor-modal-title">导入 JSON</h2>
            <div className="pixel-editor-modal-body">
              <p>选择 JSON 文件导入：</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="pixel-editor-file-input"
                onChange={handleImportFile}
              />
              <button
                className="pixel-editor-btn"
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                📁 选择文件
              </button>
              {importError && <p className="error" style={{ marginTop: '12px' }}>{importError}</p>}
              {importPendingData && !importError && (
                <p style={{ marginTop: '12px', color: '#00d4ff' }}>
                  ✓ 已读取: {importPendingData.width}×{importPendingData.height} 画布
                </p>
              )}
            </div>
            <div className="pixel-editor-modal-footer">
              <button
                className="pixel-editor-btn"
                onClick={() => { setShowImportModal(false); setImportPendingData(null); setImportError(''); }}
              >
                取消
              </button>
              <button
                className="pixel-editor-btn pixel-editor-btn--primary"
                onClick={handleConfirmImport}
                disabled={!importPendingData}
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={exportCanvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default PixelEditorPage
