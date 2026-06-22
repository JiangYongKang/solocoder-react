import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DEFAULT_GRID_SIZE,
  MIN_GRID_SIZE,
  MAX_GRID_SIZE,
  DEFAULT_CELL_SIZE,
  DEFAULT_FOREGROUND_COLOR,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_GRID_LINE_COLOR,
  DEFAULT_CHARACTER_SPACING,
  MIN_CHARACTER_SPACING,
  MAX_CHARACTER_SPACING,
  DEFAULT_FONT_FAMILY,
  DEFAULT_PREVIEW_TEXT,
  DEFAULT_CHARACTERS,
} from './constants.js'
import {
  createEmptyGlyph,
  cloneGlyph,
  togglePixel,
  setPixel,
  resizeGlyph,
  renderGlyphToCanvas,
  renderPreviewText,
  getCellFromMouseEvent,
  generateCSSFontFace,
  exportToJSON,
  validateAndParseJSON,
  initializeGlyphs,
  addCharacter,
  removeCharacter,
  saveFontData,
  loadFontData,
  copyToClipboard,
  downloadJSONFile,
  isGlyphEmpty,
  countFilledPixels,
  flipGlyphHorizontal,
  flipGlyphVertical,
  rotateGlyph90,
  shiftGlyph,
  clearGlyph,
  getCharacterFromCodePoint,
  getCodePointString,
  validateGridSize,
} from './pixelFontCore.js'
import './pixel-font.css'

function PixelFontPage() {
  const navigate = useNavigate()

  const canvasRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const thumbnailCanvasRefs = useRef({})
  const fileInputRef = useRef(null)
  const isDrawingRef = useRef(false)
  const drawModeRef = useRef(null)
  const lastCellRef = useRef(null)

  function getInitialState() {
    const saved = loadFontData()
    if (saved && saved.glyphs && saved.gridSize) {
      const sizeCheck = validateGridSize(saved.gridSize)
      if (sizeCheck.valid) {
        return {
          gridSize: sizeCheck.size,
          glyphs: saved.glyphs,
          currentChar: saved.currentChar || Object.keys(saved.glyphs)[0] || 'A',
          fontFamily: saved.fontFamily || DEFAULT_FONT_FAMILY,
          foregroundColor: saved.foregroundColor || DEFAULT_FOREGROUND_COLOR,
          backgroundColor: saved.backgroundColor || DEFAULT_BACKGROUND_COLOR,
          characterSpacing: saved.characterSpacing || DEFAULT_CHARACTER_SPACING,
        }
      }
    }
    return {
      gridSize: DEFAULT_GRID_SIZE,
      glyphs: null,
      currentChar: 'A',
      fontFamily: DEFAULT_FONT_FAMILY,
      foregroundColor: DEFAULT_FOREGROUND_COLOR,
      backgroundColor: DEFAULT_BACKGROUND_COLOR,
      characterSpacing: DEFAULT_CHARACTER_SPACING,
    }
  }

  const initial = getInitialState()

  const [gridSize, setGridSize] = useState(initial.gridSize)
  const [glyphs, setGlyphs] = useState(() => initial.glyphs || initializeGlyphs(DEFAULT_CHARACTERS, initial.gridSize))
  const [currentChar, setCurrentChar] = useState(initial.currentChar)
  const [fontFamily, setFontFamily] = useState(initial.fontFamily)
  const [foregroundColor, setForegroundColor] = useState(initial.foregroundColor)
  const [backgroundColor, setBackgroundColor] = useState(initial.backgroundColor)
  const [characterSpacing, setCharacterSpacing] = useState(initial.characterSpacing)
  const [previewText, setPreviewText] = useState(DEFAULT_PREVIEW_TEXT)
  const [showGrid, setShowGrid] = useState(true)
  const [newCharInput, setNewCharInput] = useState('')
  const [showAddCharModal, setShowAddCharModal] = useState(false)
  const [showCSSModal, setShowCSSModal] = useState(false)
  const [cssContent, setCSSContent] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importError, setImportError] = useState('')
  const [importPendingData, setImportPendingData] = useState(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE)

  const stateRef = useRef({
    glyphs,
    currentChar,
    gridSize,
    foregroundColor,
    backgroundColor,
    showGrid,
    characterSpacing,
  })

  useEffect(() => {
    stateRef.current = {
      glyphs,
      currentChar,
      gridSize,
      foregroundColor,
      backgroundColor,
      showGrid,
      characterSpacing,
    }
  }, [glyphs, currentChar, gridSize, foregroundColor, backgroundColor, showGrid, characterSpacing])

  useEffect(() => {
    saveFontData({
      gridSize,
      glyphs,
      currentChar,
      fontFamily,
      foregroundColor,
      backgroundColor,
      characterSpacing,
    })
  }, [gridSize, glyphs, currentChar, fontFamily, foregroundColor, backgroundColor, characterSpacing])

  const currentGlyph = glyphs[currentChar]?.glyph || createEmptyGlyph(gridSize)

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const state = stateRef.current
    renderGlyphToCanvas(
      canvas,
      state.glyphs[state.currentChar]?.glyph || createEmptyGlyph(state.gridSize),
      cellSize,
      state.showGrid,
      DEFAULT_GRID_LINE_COLOR,
      state.foregroundColor,
      state.backgroundColor
    )
  }, [cellSize])

  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    const state = stateRef.current
    const previewCellSize = Math.max(4, Math.floor(16 * (16 / state.gridSize)))
    renderPreviewText(
      canvas,
      previewText,
      state.glyphs,
      previewCellSize,
      state.characterSpacing,
      state.foregroundColor,
      state.backgroundColor
    )
  }, [previewText])

  const drawThumbnail = useCallback((char, glyph) => {
    const canvas = thumbnailCanvasRefs.current[char]
    if (!canvas) return
    const thumbSize = Math.max(1, Math.floor(32 / gridSize))
    renderGlyphToCanvas(canvas, glyph, thumbSize, false, '', foregroundColor, backgroundColor)
  }, [gridSize, foregroundColor, backgroundColor])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas, currentGlyph, showGrid, foregroundColor, backgroundColor])

  useEffect(() => {
    drawPreview()
  }, [drawPreview, glyphs, previewText, characterSpacing, foregroundColor, backgroundColor])

  useEffect(() => {
    Object.entries(glyphs).forEach(([char, data]) => {
      if (data?.glyph) {
        drawThumbnail(char, data.glyph)
      }
    })
  }, [drawThumbnail, glyphs])

  const updateCurrentGlyph = useCallback((newGlyph) => {
    setGlyphs((prev) => ({
      ...prev,
      [currentChar]: { glyph: newGlyph },
    }))
  }, [currentChar])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    const canvas = canvasRef.current
    if (!canvas) return

    const state = stateRef.current
    const glyph = state.glyphs[state.currentChar]?.glyph || createEmptyGlyph(state.gridSize)
    const cell = getCellFromMouseEvent(canvas, glyph, e, cellSize)
    if (!cell) return

    isDrawingRef.current = true
    lastCellRef.current = cell

    const currentValue = glyph[cell.y][cell.x]
    drawModeRef.current = currentValue ? 0 : 1

    const newGlyph = setPixel(glyph, cell.x, cell.y, drawModeRef.current)
    updateCurrentGlyph(newGlyph)
  }, [cellSize, updateCurrentGlyph])

  const handleMouseMove = useCallback((e) => {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return

    const state = stateRef.current
    const glyph = state.glyphs[state.currentChar]?.glyph || createEmptyGlyph(state.gridSize)
    const cell = getCellFromMouseEvent(canvas, glyph, e, cellSize)
    if (!cell) return

    const last = lastCellRef.current
    if (last && last.x === cell.x && last.y === cell.y) return
    lastCellRef.current = cell

    setGlyphs((prev) => {
      const currentGlyphData = prev[state.currentChar]?.glyph || createEmptyGlyph(state.gridSize)
      const newGlyph = setPixel(currentGlyphData, cell.x, cell.y, drawModeRef.current)
      return {
        ...prev,
        [state.currentChar]: { glyph: newGlyph },
      }
    })
  }, [cellSize])

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false
    drawModeRef.current = null
    lastCellRef.current = null
  }, [])

  const handleMouseLeave = useCallback(() => {
    isDrawingRef.current = false
    drawModeRef.current = null
    lastCellRef.current = null
  }, [])

  const handleGridSizeChange = useCallback((value) => {
    const num = parseInt(value, 10)
    if (isNaN(num)) return
    const validation = validateGridSize(num)
    const newSize = validation.size
    if (newSize === gridSize) return

    setGridSize(newSize)
    setGlyphs((prev) => {
      const newGlyphs = {}
      for (const [char, data] of Object.entries(prev)) {
        if (data?.glyph) {
          newGlyphs[char] = {
            glyph: resizeGlyph(data.glyph, newSize, true),
          }
        }
      }
      return newGlyphs
    })
  }, [gridSize])

  const handleCellSizeChange = useCallback((value) => {
    const num = parseInt(value, 10)
    if (isNaN(num)) return
    setCellSize(num)
  }, [])

  const handleAddCharacter = useCallback(() => {
    const input = newCharInput.trim()
    if (!input) return

    let char = null
    if (/^U\+[0-9A-Fa-f]+$/.test(input)) {
      char = getCharacterFromCodePoint(input.slice(2))
    } else if (input.length >= 1) {
      char = input[0]
    }

    if (!char) {
      setImportError('无效的字符或 Unicode 码点')
      return
    }

    if (glyphs[char]) {
      setCurrentChar(char)
      setShowAddCharModal(false)
      setNewCharInput('')
      setImportError('')
      return
    }

    setGlyphs((prev) => addCharacter(prev, char, gridSize))
    setCurrentChar(char)
    setShowAddCharModal(false)
    setNewCharInput('')
    setImportError('')
  }, [newCharInput, glyphs, gridSize])

  const handleRemoveCharacter = useCallback((char) => {
    if (Object.keys(glyphs).length <= 1) return
    setGlyphs((prev) => removeCharacter(prev, char))
    if (currentChar === char) {
      const remaining = Object.keys(glyphs).filter((c) => c !== char)
      if (remaining.length > 0) {
        setCurrentChar(remaining[0])
      }
    }
  }, [glyphs, currentChar])

  const handleFlipHorizontal = useCallback(() => {
    updateCurrentGlyph(flipGlyphHorizontal(currentGlyph))
  }, [currentGlyph, updateCurrentGlyph])

  const handleFlipVertical = useCallback(() => {
    updateCurrentGlyph(flipGlyphVertical(currentGlyph))
  }, [currentGlyph, updateCurrentGlyph])

  const handleRotate90 = useCallback(() => {
    updateCurrentGlyph(rotateGlyph90(currentGlyph))
  }, [currentGlyph, updateCurrentGlyph])

  const handleShift = useCallback((direction) => {
    updateCurrentGlyph(shiftGlyph(currentGlyph, direction, 1))
  }, [currentGlyph, updateCurrentGlyph])

  const handleClear = useCallback(() => {
    updateCurrentGlyph(clearGlyph(currentGlyph))
  }, [currentGlyph, updateCurrentGlyph])

  const handleExportCSS = useCallback(() => {
    const css = generateCSSFontFace(glyphs, fontFamily, foregroundColor)
    setCSSContent(css)
    setShowCSSModal(true)
  }, [glyphs, fontFamily, foregroundColor])

  const handleCopyCSS = useCallback(() => {
    if (copyToClipboard(cssContent)) {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }, [cssContent])

  const handleExportJSON = useCallback(() => {
    const json = exportToJSON(glyphs, gridSize, fontFamily)
    downloadJSONFile(json, `${fontFamily}-${gridSize}x${gridSize}.json`)
  }, [glyphs, gridSize, fontFamily])

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
      setImportError('')
      setImportPendingData(result.data)
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleConfirmImport = useCallback(() => {
    if (!importPendingData) return
    setGridSize(importPendingData.gridSize)
    setGlyphs(importPendingData.glyphs)
    setFontFamily(importPendingData.fontFamily)
    const firstChar = Object.keys(importPendingData.glyphs)[0]
    if (firstChar) {
      setCurrentChar(firstChar)
    }
    setShowImportModal(false)
    setImportPendingData(null)
    setImportError('')
  }, [importPendingData])

  const handleOpenImport = useCallback(() => {
    setImportError('')
    setImportPendingData(null)
    setShowImportModal(true)
  }, [])

  const filledPixels = countFilledPixels(currentGlyph)
  const emptyGlyph = isGlyphEmpty(currentGlyph)
  const charCodePoint = getCodePointString(currentChar)

  return (
    <div className="pixel-font-page">
      <div className="pixel-font-header">
        <div className="pixel-font-header-left">
          <button className="pixel-font-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="pixel-font-title">像素字体生成器</h1>
        </div>
        <div className="pixel-font-header-actions">
          <button className="pixel-font-btn" onClick={handleOpenImport}>
            📥 导入JSON
          </button>
          <button className="pixel-font-btn" onClick={handleExportJSON}>
            📤 导出JSON
          </button>
          <button className="pixel-font-btn pixel-font-btn--primary" onClick={handleExportCSS}>
            🎨 导出CSS
          </button>
        </div>
      </div>

      <div className="pixel-font-main">
        <div className="pixel-font-left-panel">
          <div className="pixel-font-section">
            <h3 className="pixel-font-panel-title">当前字符</h3>
            <div className="pixel-font-current-char">
              <span className="pixel-font-char-display">{currentChar}</span>
              <span className="pixel-font-char-codepoint">{charCodePoint}</span>
            </div>
            <div className="pixel-font-char-stats">
              <span>填充像素: {filledPixels}/{gridSize * gridSize}</span>
              <span>{emptyGlyph ? '(空)' : `(已编辑)`}</span>
            </div>
          </div>

          <div className="pixel-font-section">
            <h3 className="pixel-font-panel-title">网格尺寸</h3>
            <div className="pixel-font-slider">
              <label>字号: {gridSize}×{gridSize}</label>
              <input
                type="range"
                min={MIN_GRID_SIZE}
                max={MAX_GRID_SIZE}
                step="1"
                value={gridSize}
                onChange={(e) => handleGridSizeChange(e.target.value)}
              />
              <div className="pixel-font-slider-range">
                <span>{MIN_GRID_SIZE}</span>
                <span>{MAX_GRID_SIZE}</span>
              </div>
            </div>
            <div className="pixel-font-slider">
              <label>单元格大小: {cellSize}px</label>
              <input
                type="range"
                min="8"
                max="40"
                step="1"
                value={cellSize}
                onChange={(e) => handleCellSizeChange(e.target.value)}
              />
            </div>
          </div>

          <div className="pixel-font-section">
            <h3 className="pixel-font-panel-title">颜色设置</h3>
            <div className="pixel-font-color-row">
              <label>前景色:</label>
              <input
                type="color"
                value={foregroundColor}
                onChange={(e) => setForegroundColor(e.target.value)}
              />
              <span className="pixel-font-color-value">{foregroundColor}</span>
            </div>
            <div className="pixel-font-color-row">
              <label>背景色:</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
              <span className="pixel-font-color-value">{backgroundColor}</span>
            </div>
            <div className="pixel-font-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                显示网格线
              </label>
            </div>
          </div>

          <div className="pixel-font-section">
            <h3 className="pixel-font-panel-title">预览设置</h3>
            <div className="pixel-font-slider">
              <label>字符间距: {characterSpacing}</label>
              <input
                type="range"
                min={MIN_CHARACTER_SPACING}
                max={MAX_CHARACTER_SPACING}
                step="1"
                value={characterSpacing}
                onChange={(e) => setCharacterSpacing(parseInt(e.target.value, 10))}
              />
            </div>
            <div className="pixel-font-input-row">
              <label>预览文本:</label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="输入预览文本..."
              />
            </div>
          </div>

          <div className="pixel-font-section">
            <h3 className="pixel-font-panel-title">字形变换</h3>
            <div className="pixel-font-transform-grid">
              <button className="pixel-font-small-btn" onClick={handleFlipHorizontal} title="水平翻转">
                ↔ 水平
              </button>
              <button className="pixel-font-small-btn" onClick={handleFlipVertical} title="垂直翻转">
                ↕ 垂直
              </button>
              <button className="pixel-font-small-btn" onClick={handleRotate90} title="顺时针旋转90°">
                ↻ 旋转
              </button>
              <button className="pixel-font-small-btn" onClick={() => handleShift('left')} title="左移">
                ← 左移
              </button>
              <button className="pixel-font-small-btn" onClick={() => handleShift('right')} title="右移">
                → 右移
              </button>
              <button className="pixel-font-small-btn" onClick={() => handleShift('up')} title="上移">
                ↑ 上移
              </button>
              <button className="pixel-font-small-btn" onClick={() => handleShift('down')} title="下移">
                ↓ 下移
              </button>
              <button className="pixel-font-small-btn pixel-font-small-btn--danger" onClick={handleClear} title="清空">
                🗑 清空
              </button>
            </div>
          </div>

          <div className="pixel-font-section">
            <h3 className="pixel-font-panel-title">字体名称</h3>
            <input
              type="text"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="pixel-font-input"
              placeholder="输入字体名称..."
            />
          </div>
        </div>

        <div className="pixel-font-center">
          <div className="pixel-font-canvas-wrapper">
            <canvas
              ref={canvasRef}
              className="pixel-font-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{
                width: gridSize * cellSize,
                height: gridSize * cellSize,
              }}
            />
          </div>
          <p className="pixel-font-hint">
            点击或拖拽绘制像素 · 支持连续绘制
          </p>

          <div className="pixel-font-preview-section">
            <h3 className="pixel-font-panel-title">文字预览</h3>
            <div className="pixel-font-preview-wrapper">
              <canvas
                ref={previewCanvasRef}
                className="pixel-font-preview-canvas"
              />
            </div>
          </div>
        </div>

        <div className="pixel-font-right-panel">
          <div className="pixel-font-section">
            <div className="pixel-font-section-header">
              <h3 className="pixel-font-panel-title">字符列表</h3>
              <button
                className="pixel-font-add-btn"
                onClick={() => {
                  setShowAddCharModal(true)
                  setImportError('')
                }}
              >
                + 添加
              </button>
            </div>
            <div className="pixel-font-character-grid">
              {Object.entries(glyphs).map(([char, data]) => (
                <div
                  key={char}
                  className={`pixel-font-character-item ${currentChar === char ? 'pixel-font-character-item--active' : ''}`}
                  onClick={() => setCurrentChar(char)}
                >
                  <canvas
                    ref={(el) => {
                      if (el) thumbnailCanvasRefs.current[char] = el
                    }}
                    width={32}
                    height={32}
                    className="pixel-font-character-thumb"
                  />
                  <span className="pixel-font-character-label">{char}</span>
                  {Object.keys(glyphs).length > 1 && (
                    <button
                      className="pixel-font-character-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveCharacter(char)
                      }}
                      title="删除字符"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pixel-font-section">
            <h3 className="pixel-font-panel-title">操作提示</h3>
            <p className="pixel-font-hint">
              • <strong>点击</strong>: 点亮/熄灭像素<br />
              • <strong>拖拽</strong>: 连续绘制多个像素<br />
              • <strong>调节字号</strong>: 已编辑内容自动居中适配<br />
              • <strong>添加字符</strong>: 支持直接输入或 Unicode 码点(如 U+0041)
            </p>
          </div>
        </div>
      </div>

      {showAddCharModal && (
        <div className="pixel-font-modal-backdrop" onClick={() => {
          setShowAddCharModal(false)
          setNewCharInput('')
          setImportError('')
        }}>
          <div className="pixel-font-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="pixel-font-modal-title">添加字符</h2>
            <div className="pixel-font-modal-body">
              <p>输入字符或 Unicode 码点（如 U+0041）：</p>
              <input
                type="text"
                value={newCharInput}
                onChange={(e) => setNewCharInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCharacter()
                  }
                }}
                className="pixel-font-input"
                placeholder="A 或 U+0041"
                autoFocus
              />
              {importError && <p className="pixel-font-error">{importError}</p>}
            </div>
            <div className="pixel-font-modal-footer">
              <button
                className="pixel-font-btn"
                onClick={() => {
                  setShowAddCharModal(false)
                  setNewCharInput('')
                  setImportError('')
                }}
              >
                取消
              </button>
              <button
                className="pixel-font-btn pixel-font-btn--primary"
                onClick={handleAddCharacter}
                disabled={!newCharInput.trim()}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showCSSModal && (
        <div className="pixel-font-modal-backdrop" onClick={() => setShowCSSModal(false)}>
          <div className="pixel-font-modal pixel-font-modal--large" onClick={(e) => e.stopPropagation()}>
            <h2 className="pixel-font-modal-title">CSS @font-face 导出</h2>
            <div className="pixel-font-modal-body">
              <textarea
                className="pixel-font-css-output"
                value={cssContent}
                readOnly
                rows={20}
              />
            </div>
            <div className="pixel-font-modal-footer">
              <button
                className="pixel-font-btn"
                onClick={() => setShowCSSModal(false)}
              >
                关闭
              </button>
              <button
                className={`pixel-font-btn pixel-font-btn--primary ${copySuccess ? 'pixel-font-btn--success' : ''}`}
                onClick={handleCopyCSS}
              >
                {copySuccess ? '✓ 已复制' : '📋 一键复制'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="pixel-font-modal-backdrop" onClick={() => {
          setShowImportModal(false)
          setImportPendingData(null)
          setImportError('')
        }}>
          <div className="pixel-font-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="pixel-font-modal-title">导入 JSON</h2>
            <div className="pixel-font-modal-body">
              <p>选择 JSON 文件导入：</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="pixel-font-file-input"
                onChange={handleImportFile}
              />
              <button
                className="pixel-font-btn"
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                📁 选择文件
              </button>
              {importError && <p className="pixel-font-error" style={{ marginTop: '12px' }}>{importError}</p>}
              {importPendingData && !importError && (
                <p style={{ marginTop: '12px', color: '#00d4ff' }}>
                  ✓ 已读取: {importPendingData.gridSize}×{importPendingData.gridSize} 网格, {Object.keys(importPendingData.glyphs).length} 个字符
                </p>
              )}
            </div>
            <div className="pixel-font-modal-footer">
              <button
                className="pixel-font-btn"
                onClick={() => {
                  setShowImportModal(false)
                  setImportPendingData(null)
                  setImportError('')
                }}
              >
                取消
              </button>
              <button
                className="pixel-font-btn pixel-font-btn--primary"
                onClick={handleConfirmImport}
                disabled={!importPendingData}
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PixelFontPage
