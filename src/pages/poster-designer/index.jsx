import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createInitialState,
  createTextLayer,
  addLayer,
  removeLayer,
  updateLayer,
  reorderLayers,
  selectLayer,
  setCanvasSize,
  clampFontSize,
  clampBgOpacity,
  pushHistory,
  canUndo,
  canRedo,
  undo,
  redo,
  findLayerAtPoint,
  drawPoster,
  getSelectedLayer,
  exportCanvasToPng,
  isValidColor,
  restoreBackgroundImage,
  sanitizeColor,
} from './posterDesignerCore.js'
import {
  CANVAS_SIZES,
  CHINESE_FONTS,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  MIN_STROKE_WIDTH,
  MAX_STROKE_WIDTH,
  MIN_SHADOW_BLUR,
  MAX_SHADOW_BLUR,
  MIN_SHADOW_OFFSET,
  MAX_SHADOW_OFFSET,
  PRESET_COLORS,
} from './constants.js'
import './poster-designer.css'

function computeTextSelectionBox(selectedLayer, scale) {
  if (!selectedLayer || selectedLayer.type !== 'text') return null
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = `${selectedLayer.fontSize}px ${selectedLayer.fontFamily}`
  const metrics = ctx.measureText(selectedLayer.text || '')
  const textWidth = metrics.width
  const textHeight = selectedLayer.fontSize
  const top = selectedLayer.y - textHeight * 0.85
  const bottom = selectedLayer.y + textHeight * 0.15
  return {
    left: selectedLayer.x * scale,
    top: top * scale,
    width: textWidth * scale,
    height: (bottom - top) * scale,
  }
}

function PosterDesignerPage() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const bgInputRef = useRef(null)
  const dragLayerIndexRef = useRef(null)
  const isDraggingTextRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const layerStartPosRef = useRef({ x: 0, y: 0 })

  const [state, setState] = useState(() => createInitialState())
  const [history, setHistory] = useState(() => {
    const init = createInitialState()
    return [JSON.parse(JSON.stringify(init))]
  })
  const [historyIndex, setHistoryIndex] = useState(0)
  const [activeSizeIndex, setActiveSizeIndex] = useState(0)
  const [bgDragOver, setBgDragOver] = useState(false)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [colorInputStates, setColorInputStates] = useState({})
  const [toast, setToast] = useState(null)
  const canvasAreaRef = useRef(null)

  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])

  const applyRestoredState = useCallback((restoredState) => {
    setState(restoredState)
  }, [])

  const selectedLayer = getSelectedLayer(state)

  const canvasScale = useMemo(() => {
    if (containerSize.w === 0 || containerSize.h === 0) return 1
    const availW = containerSize.w - 48
    const availH = containerSize.h - 48
    return Math.min(availW / state.canvasWidth, availH / state.canvasHeight, 1)
  }, [containerSize, state.canvasWidth, state.canvasHeight])

  const textSelectionBox = useMemo(() => computeTextSelectionBox(selectedLayer, canvasScale), [selectedLayer, canvasScale])

  useEffect(() => {
    const area = canvasAreaRef.current
    if (!area) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height })
      }
    })
    observer.observe(area)
    return () => observer.disconnect()
  }, [])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const scale = canvasScale
    const w = state.canvasWidth
    const h = state.canvasHeight
    canvas.width = w * scale
    canvas.height = h * scale
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    drawPoster(ctx, state, w, h)
  }, [state, canvasScale])

  useEffect(() => {
    redraw()
  }, [redraw])

  const commitHistory = useCallback((newState) => {
    const result = pushHistory(history, historyIndex, newState)
    setHistory(result.history)
    setHistoryIndex(result.historyIndex)
  }, [history, historyIndex])

  const handleUndo = useCallback(() => {
    if (!canUndo(historyIndex)) return
    const result = undo(history, historyIndex)
    setHistoryIndex(result.historyIndex)
    restoreBackgroundImage(result.state).then((restored) => {
      applyRestoredState(restored)
    })
  }, [history, historyIndex, applyRestoredState])

  const handleRedo = useCallback(() => {
    if (!canRedo(history, historyIndex)) return
    const result = redo(history, historyIndex)
    setHistoryIndex(result.historyIndex)
    restoreBackgroundImage(result.state).then((restored) => {
      applyRestoredState(restored)
    })
  }, [history, historyIndex, applyRestoredState])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) handleRedo()
        else handleUndo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  const setColorInputValue = useCallback((key, value, fallbackColor) => {
    const valid = isValidColor(value)
    setColorInputStates((prev) => ({
      ...prev,
      [key]: { value, valid, error: valid ? null : '颜色格式无效' },
    }))
    if (valid) {
      return value
    }
    return fallbackColor
  }, [])

  const commitColorChange = useCallback((key, layerId, prop, fallbackColor) => {
    const input = colorInputStates[key]
    if (!input) return { changed: false }
    if (input.valid) {
      return { changed: true, value: input.value }
    }
    showToast(`颜色格式无效：${input.value}`)
    setColorInputStates((prev) => ({
      ...prev,
      [key]: { value: fallbackColor, valid: true, error: null },
    }))
    return { changed: false, value: fallbackColor }
  }, [colorInputStates, showToast])

  const handleCanvasSizeChange = (idx) => {
    setActiveSizeIndex(idx)
    const size = CANVAS_SIZES[idx]
    const newState = setCanvasSize(state, size.width, size.height)
    setState(newState)
    commitHistory(newState)
  }

  const handleAddTextLayer = () => {
    const layer = createTextLayer({
      x: state.canvasWidth / 4,
      y: state.canvasHeight / 3,
    })
    const newState = addLayer(state, layer)
    setState(newState)
    commitHistory(newState)
  }

  const handleSelectLayer = (layerId) => {
    setState((prev) => selectLayer(prev, layerId))
  }

  const handleDeleteLayer = (layerId) => {
    const newState = removeLayer(state, layerId)
    setState(newState)
    commitHistory(newState)
  }

  const handleLayerDragStart = (e, index) => {
    if (state.layers[index].id === 'bg') return
    dragLayerIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleLayerDragOver = (e) => {
    e.preventDefault()
  }

  const handleLayerDrop = (e, toIndex) => {
    e.preventDefault()
    const fromIndex = dragLayerIndexRef.current
    if (fromIndex === null || fromIndex === toIndex || fromIndex === 0 || toIndex === 0) return
    const newState = reorderLayers(state, fromIndex, toIndex)
    setState(newState)
    commitHistory(newState)
    dragLayerIndexRef.current = null
  }

  const handleLayerDragEnd = () => {
    dragLayerIndexRef.current = null
  }

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left) / canvasScale
    const my = (e.clientY - rect.top) / canvasScale

    const offscreen = document.createElement('canvas')
    offscreen.width = state.canvasWidth
    offscreen.height = state.canvasHeight
    const ctx = offscreen.getContext('2d')

    const hitLayer = findLayerAtPoint(state, mx, my, ctx)

    if (hitLayer && hitLayer.type === 'text') {
      setState((prev) => selectLayer(prev, hitLayer.id))
      isDraggingTextRef.current = true
      dragStartRef.current = { x: mx, y: my }
      layerStartPosRef.current = { x: hitLayer.x, y: hitLayer.y }
    } else {
      setState((prev) => selectLayer(prev, null))
      isDraggingTextRef.current = false
    }
  }

  const handleCanvasMouseMove = (e) => {
    if (!isDraggingTextRef.current || !state.selectedLayerId) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left) / canvasScale
    const my = (e.clientY - rect.top) / canvasScale

    const dx = mx - dragStartRef.current.x
    const dy = my - dragStartRef.current.y
    const newX = layerStartPosRef.current.x + dx
    const newY = layerStartPosRef.current.y + dy

    setState((prev) => updateLayer(prev, prev.selectedLayerId, { x: newX, y: newY }))
  }

  const handleCanvasMouseUp = () => {
    if (isDraggingTextRef.current && state.selectedLayerId) {
      commitHistory(state)
    }
    isDraggingTextRef.current = false
  }

  const handleBgColorTextChange = (e) => {
    const key = 'bg_color'
    const bg = state.layers.find((l) => l.type === 'background')
    const fallback = bg ? bg.color : '#4a90d9'
    setColorInputValue(key, e.target.value, fallback)
    const safeColor = sanitizeColor(e.target.value, fallback)
    setState((prev) => updateLayer(prev, 'bg', { color: safeColor }))
  }

  const handleBgColorTextCommit = () => {
    const key = 'bg_color'
    const bg = state.layers.find((l) => l.type === 'background')
    const fallback = bg ? bg.color : '#4a90d9'
    const result = commitColorChange(key, 'bg', 'color', fallback)
    const finalState = updateLayer(state, 'bg', { color: result.value })
    setState(finalState)
    if (result.changed) commitHistory(finalState)
  }

  const handleBgColorPickerChange = (color) => {
    const key = 'bg_color'
    setColorInputStates((prev) => ({
      ...prev,
      [key]: { value: color, valid: true, error: null },
    }))
    const newState = updateLayer(state, 'bg', { color })
    setState(newState)
    commitHistory(newState)
  }

  const handleBgImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const newState = updateLayer(state, 'bg', { image: img, imageSrc: ev.target.result })
        setState(newState)
        commitHistory(newState)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleBgImageDrop = (e) => {
    e.preventDefault()
    setBgDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleBgImageUpload(file)
  }

  const handleBgImageClick = () => {
    bgInputRef.current?.click()
  }

  const handleBgFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleBgImageUpload(file)
    e.target.value = ''
  }

  const handleBgOpacityChange = (opacity) => {
    const newState = updateLayer(state, 'bg', { imageOpacity: clampBgOpacity(opacity) })
    setState(newState)
    commitHistory(newState)
  }

  const handleRemoveBgImage = () => {
    const newState = updateLayer(state, 'bg', { image: null, imageSrc: null, imageOpacity: 1 })
    setState(newState)
    commitHistory(newState)
  }

  const handleTextPropChange = (prop, value) => {
    if (!state.selectedLayerId) return
    const newState = updateLayer(state, state.selectedLayerId, { [prop]: value })
    setState(newState)
  }

  const handleTextPropCommit = (prop, value) => {
    if (!state.selectedLayerId) return
    const newState = updateLayer(state, state.selectedLayerId, { [prop]: value })
    setState(newState)
    commitHistory(newState)
  }

  const handleTextColorTextChange = (prop, fallback) => (e) => {
    if (!state.selectedLayerId) return
    const key = `${state.selectedLayerId}_${prop}`
    setColorInputValue(key, e.target.value, fallback)
    const safeColor = sanitizeColor(e.target.value, fallback)
    setState((prev) => updateLayer(prev, prev.selectedLayerId, { [prop]: safeColor }))
  }

  const handleTextColorCommit = (prop, fallback) => () => {
    if (!state.selectedLayerId) return
    const key = `${state.selectedLayerId}_${prop}`
    const result = commitColorChange(key, state.selectedLayerId, prop, fallback)
    const finalState = updateLayer(state, state.selectedLayerId, { [prop]: result.value })
    setState(finalState)
    if (result.changed) commitHistory(finalState)
  }

  const handleTextColorPickerChange = (prop, value) => {
    if (!state.selectedLayerId) return
    const key = `${state.selectedLayerId}_${prop}`
    setColorInputStates((prev) => ({
      ...prev,
      [key]: { value, valid: true, error: null },
    }))
    const newState = updateLayer(state, state.selectedLayerId, { [prop]: value })
    setState(newState)
    commitHistory(newState)
  }

  const getColorInputState = (key, defaultValue) => {
    const input = colorInputStates[key]
    return input ?? { value: defaultValue, valid: true, error: null }
  }

  const handleExport = async () => {
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = state.canvasWidth
    exportCanvas.height = state.canvasHeight
    const ctx = exportCanvas.getContext('2d')
    drawPoster(ctx, state, state.canvasWidth, state.canvasHeight)
    await exportCanvasToPng(exportCanvas)
  }

  const renderLayerPanel = () => {
    const reversedLayers = [...state.layers].reverse()
    return (
      <div className="pd-layer-panel">
        <div className="pd-panel-title">
          <span>图层</span>
          <button className="pd-add-layer-btn" onClick={handleAddTextLayer}>
            + 文字
          </button>
        </div>
        <div className="pd-layer-list">
          {reversedLayers.map((layer) => {
            const originalIndex = state.layers.findIndex((l) => l.id === layer.id)
            const isSelected = state.selectedLayerId === layer.id
            return (
              <div
                key={layer.id}
                className={`pd-layer-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectLayer(layer.id)}
                draggable={layer.id !== 'bg'}
                onDragStart={(e) => handleLayerDragStart(e, originalIndex)}
                onDragOver={handleLayerDragOver}
                onDrop={(e) => handleLayerDrop(e, originalIndex)}
                onDragEnd={handleLayerDragEnd}
              >
                <span className="pd-layer-icon">
                  {layer.type === 'background' ? '🖼' : '📝'}
                </span>
                <span className="pd-layer-name">
                  {layer.type === 'background'
                    ? '背景'
                    : layer.text.length > 10
                      ? layer.text.slice(0, 10) + '…'
                      : layer.text}
                </span>
                {layer.id !== 'bg' && (
                  <button
                    className="pd-layer-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteLayer(layer.id)
                    }}
                    title="删除图层"
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderBgProps = () => {
    const bg = state.layers.find((l) => l.type === 'background')
    if (!bg) return null
    const bgColorInput = getColorInputState('bg_color', bg.color)
    const hasBgColorError = !bgColorInput.valid
    return (
      <div className="pd-props-section">
        <div className="pd-props-section-title">背景设置</div>
        <div className="pd-props-color-row">
          <span className="pd-props-label">颜色</span>
          <input
            type="color"
            className="pd-props-color-input"
            value={bg.color}
            onChange={(e) => handleBgColorPickerChange(e.target.value)}
          />
          <input
            type="text"
            className={`pd-props-color-hex ${hasBgColorError ? 'pd-input-error' : ''}`}
            value={bgColorInput.value}
            onChange={handleBgColorTextChange}
            onBlur={handleBgColorTextCommit}
          />
        </div>
        {hasBgColorError && (
          <div className="pd-field-error">颜色格式无效，请使用 #RGB / #RRGGBB 或 rgb()/rgba()</div>
        )}
        <div className="pd-props-preset-colors">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              className="pd-props-preset-swatch"
              style={{ backgroundColor: c }}
              onClick={() => handleBgColorPickerChange(c)}
            />
          ))}
        </div>
        <div
          className={`pd-bg-upload-area ${bgDragOver ? 'drag-over' : ''}`}
          onClick={handleBgImageClick}
          onDragOver={(e) => { e.preventDefault(); setBgDragOver(true) }}
          onDragLeave={() => setBgDragOver(false)}
          onDrop={handleBgImageDrop}
        >
          <span className="pd-bg-upload-text">
            {bg.image ? '点击或拖拽更换背景图片' : '点击或拖拽上传背景图片'}
          </span>
        </div>
        <input
          ref={bgInputRef}
          type="file"
          accept="image/*"
          className="pd-hidden-input"
          onChange={handleBgFileChange}
        />
        {bg.imageSrc && (
          <>
            <img className="pd-bg-preview" src={bg.imageSrc} alt="背景预览" />
            <div className="pd-props-row" style={{ marginTop: 8 }}>
              <span className="pd-props-label">透明度</span>
              <input
                type="range"
                className="pd-props-slider"
                min={0}
                max={1}
                step={0.05}
                value={bg.imageOpacity}
                onChange={(e) => handleBgOpacityChange(Number(e.target.value))}
              />
              <span className="pd-props-slider-value">
                {Math.round(bg.imageOpacity * 100)}%
              </span>
            </div>
            <button className="pd-bg-remove-btn" onClick={handleRemoveBgImage}>
              移除背景图片
            </button>
          </>
        )}
      </div>
    )
  }

  const renderTextProps = () => {
    if (!selectedLayer || selectedLayer.type !== 'text') return null
    return (
      <>
        <div className="pd-props-section">
          <div className="pd-props-section-title">文字内容</div>
          <textarea
            className="pd-props-textarea"
            value={selectedLayer.text}
            onChange={(e) => handleTextPropChange('text', e.target.value)}
            onBlur={() => handleTextPropCommit('text', selectedLayer.text)}
          />
        </div>
        <div className="pd-props-section">
          <div className="pd-props-section-title">字体样式</div>
          <div className="pd-props-row">
            <span className="pd-props-label">字体</span>
            <select
              className="pd-props-select"
              value={selectedLayer.fontFamily}
              onChange={(e) => handleTextPropCommit('fontFamily', e.target.value)}
            >
              {CHINESE_FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="pd-props-row">
            <span className="pd-props-label">字号</span>
            <input
              type="range"
              className="pd-props-slider"
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              value={selectedLayer.fontSize}
              onChange={(e) => handleTextPropChange('fontSize', Number(e.target.value))}
              onMouseUp={() => handleTextPropCommit('fontSize', selectedLayer.fontSize)}
            />
            <input
              type="number"
              className="pd-props-input"
              style={{ width: 56, flex: 'none' }}
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              value={selectedLayer.fontSize}
              onChange={(e) => handleTextPropChange('fontSize', clampFontSize(Number(e.target.value)))}
              onBlur={() => handleTextPropCommit('fontSize', selectedLayer.fontSize)}
            />
          </div>
          <div className="pd-props-color-row">
            <span className="pd-props-label">颜色</span>
            <input
              type="color"
              className="pd-props-color-input"
              value={selectedLayer.color}
              onChange={(e) => handleTextColorPickerChange('color', e.target.value)}
            />
            <input
              type="text"
              className={`pd-props-color-hex ${!getColorInputState(`${selectedLayer.id}_color`, selectedLayer.color).valid ? 'pd-input-error' : ''}`}
              value={getColorInputState(`${selectedLayer.id}_color`, selectedLayer.color).value}
              onChange={handleTextColorTextChange('color', '#ffffff')}
              onBlur={handleTextColorCommit('color', '#ffffff')}
            />
          </div>
          {!getColorInputState(`${selectedLayer.id}_color`, selectedLayer.color).valid && (
            <div className="pd-field-error">颜色格式无效</div>
          )}
        </div>
        <div className="pd-props-section">
          <div className="pd-props-section-title">描边</div>
          <div className="pd-props-color-row">
            <span className="pd-props-label">颜色</span>
            <input
              type="color"
              className="pd-props-color-input"
              value={selectedLayer.strokeColor}
              onChange={(e) => handleTextColorPickerChange('strokeColor', e.target.value)}
            />
            <input
              type="text"
              className={`pd-props-color-hex ${!getColorInputState(`${selectedLayer.id}_strokeColor`, selectedLayer.strokeColor).valid ? 'pd-input-error' : ''}`}
              value={getColorInputState(`${selectedLayer.id}_strokeColor`, selectedLayer.strokeColor).value}
              onChange={handleTextColorTextChange('strokeColor', '#000000')}
              onBlur={handleTextColorCommit('strokeColor', '#000000')}
            />
          </div>
          {!getColorInputState(`${selectedLayer.id}_strokeColor`, selectedLayer.strokeColor).valid && (
            <div className="pd-field-error">颜色格式无效</div>
          )}
          <div className="pd-props-row">
            <span className="pd-props-label">宽度</span>
            <input
              type="range"
              className="pd-props-slider"
              min={MIN_STROKE_WIDTH}
              max={MAX_STROKE_WIDTH}
              value={selectedLayer.strokeWidth}
              onChange={(e) => handleTextPropChange('strokeWidth', Number(e.target.value))}
              onMouseUp={() => handleTextPropCommit('strokeWidth', selectedLayer.strokeWidth)}
            />
            <span className="pd-props-slider-value">{selectedLayer.strokeWidth}px</span>
          </div>
        </div>
        <div className="pd-props-section">
          <div className="pd-props-section-title">阴影</div>
          <div className="pd-props-color-row">
            <span className="pd-props-label">颜色</span>
            <input
              type="color"
              className="pd-props-color-input"
              value={selectedLayer.shadowColor}
              onChange={(e) => handleTextColorPickerChange('shadowColor', e.target.value)}
            />
            <input
              type="text"
              className={`pd-props-color-hex ${!getColorInputState(`${selectedLayer.id}_shadowColor`, selectedLayer.shadowColor).valid ? 'pd-input-error' : ''}`}
              value={getColorInputState(`${selectedLayer.id}_shadowColor`, selectedLayer.shadowColor).value}
              onChange={handleTextColorTextChange('shadowColor', '#000000')}
              onBlur={handleTextColorCommit('shadowColor', '#000000')}
            />
          </div>
          {!getColorInputState(`${selectedLayer.id}_shadowColor`, selectedLayer.shadowColor).valid && (
            <div className="pd-field-error">颜色格式无效</div>
          )}
          <div className="pd-props-row">
            <span className="pd-props-label">X偏移</span>
            <input
              type="range"
              className="pd-props-slider"
              min={MIN_SHADOW_OFFSET}
              max={MAX_SHADOW_OFFSET}
              value={selectedLayer.shadowOffsetX}
              onChange={(e) => handleTextPropChange('shadowOffsetX', Number(e.target.value))}
              onMouseUp={() => handleTextPropCommit('shadowOffsetX', selectedLayer.shadowOffsetX)}
            />
            <span className="pd-props-slider-value">{selectedLayer.shadowOffsetX}</span>
          </div>
          <div className="pd-props-row">
            <span className="pd-props-label">Y偏移</span>
            <input
              type="range"
              className="pd-props-slider"
              min={MIN_SHADOW_OFFSET}
              max={MAX_SHADOW_OFFSET}
              value={selectedLayer.shadowOffsetY}
              onChange={(e) => handleTextPropChange('shadowOffsetY', Number(e.target.value))}
              onMouseUp={() => handleTextPropCommit('shadowOffsetY', selectedLayer.shadowOffsetY)}
            />
            <span className="pd-props-slider-value">{selectedLayer.shadowOffsetY}</span>
          </div>
          <div className="pd-props-row">
            <span className="pd-props-label">模糊</span>
            <input
              type="range"
              className="pd-props-slider"
              min={MIN_SHADOW_BLUR}
              max={MAX_SHADOW_BLUR}
              value={selectedLayer.shadowBlur}
              onChange={(e) => handleTextPropChange('shadowBlur', Number(e.target.value))}
              onMouseUp={() => handleTextPropCommit('shadowBlur', selectedLayer.shadowBlur)}
            />
            <span className="pd-props-slider-value">{selectedLayer.shadowBlur}</span>
          </div>
        </div>
      </>
    )
  }

  const renderPropsPanel = () => (
    <div className="pd-props-panel">
      {renderBgProps()}
      {renderTextProps()}
      {!selectedLayer && (
        <div className="pd-empty-props">选择图层以编辑属性</div>
      )}
    </div>
  )

  return (
    <div className="pd-page">
      <div className="pd-header">
        <button className="pd-back-btn" onClick={() => navigate('/')} aria-label="返回首页">
          ← 返回首页
        </button>
        <h1 className="pd-title">海报设计器</h1>
        <div className="pd-header-spacer" />
        <div className="pd-header-actions">
          <button
            className="pd-action-btn"
            onClick={handleUndo}
            disabled={!canUndo(historyIndex)}
            title="撤销 Ctrl+Z"
          >
            ↶ 撤销
          </button>
          <button
            className="pd-action-btn"
            onClick={handleRedo}
            disabled={!canRedo(history, historyIndex)}
            title="重做 Ctrl+Y"
          >
            ↷ 重做
          </button>
          <button
            className="pd-action-btn pd-action-btn-primary"
            onClick={handleExport}
            title="导出 PNG"
          >
            导出 PNG
          </button>
        </div>
      </div>

      <div className="pd-toolbar">
        {CANVAS_SIZES.map((size, idx) => (
          <button
            key={idx}
            className={`pd-size-btn ${activeSizeIndex === idx ? 'active' : ''}`}
            onClick={() => handleCanvasSizeChange(idx)}
          >
            {size.label}
          </button>
        ))}
        <span className="pd-size-info">
          {state.canvasWidth} × {state.canvasHeight}
        </span>
      </div>

      <div className="pd-main">
        {renderLayerPanel()}

        <div className="pd-canvas-area" ref={canvasAreaRef}>
          <div
            className="pd-canvas-wrapper"
            style={{
              width: state.canvasWidth * canvasScale,
              height: state.canvasHeight * canvasScale,
            }}
          >
            <canvas
              ref={canvasRef}
              className="pd-canvas"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            {textSelectionBox && (
              <div
                className="pd-text-selection-box"
                style={{
                  left: textSelectionBox.left,
                  top: textSelectionBox.top,
                  width: textSelectionBox.width,
                  height: textSelectionBox.height,
                }}
              />
            )}
          </div>
        </div>

        {renderPropsPanel()}
      </div>

      {toast && (
        <div className="pd-toast" role="alert">
          {toast}
        </div>
      )}
    </div>
  )
}

export default PosterDesignerPage
