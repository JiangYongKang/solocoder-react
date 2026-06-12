import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    CANVAS_MIN_HEIGHT,
    CANVAS_MIN_WIDTH,
    DEFAULT_COLOR,
    DEFAULT_LINE_WIDTH,
    DEFAULT_SMOOTHING,
    HISTORY_MAX_ITEMS,
    MAX_LINE_WIDTH,
    MAX_SMOOTHING,
    MIN_LINE_WIDTH,
    MIN_SMOOTHING,
    PRESET_COLORS,
    TEMPLATES,
    TEMPLATE_TYPES,
} from './constants.js'
import './signature-pad.css'
import {
    addPointToStroke,
    addSignatureToHistory,
    canRedo,
    canUndo,
    canvasToDataURL,
    clampLineWidth,
    clampSmoothing,
    createHistory,
    createSignatureRecord,
    createStroke,
    dataURLToImage,
    downloadDataURL,
    drawStrokesOnCanvas,
    formatDate,
    generateFileName,
    isCanvasEmpty,
    loadSignaturesFromStorage,
    pushHistory,
    redoHistory,
    removeSignatureFromHistory,
    saveSignaturesToStorage,
    undoHistory,
} from './signatureCore.js'

function SignaturePadPage() {
  const canvasRef = useRef(null)
  const canvasContainerRef = useRef(null)

  const [strokes, setStrokes] = useState([])
  const [history, setHistory] = useState(createHistory())
  const [currentStroke, setCurrentStroke] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const [color, setColor] = useState(DEFAULT_COLOR)
  const [lineWidth, setLineWidth] = useState(DEFAULT_LINE_WIDTH)
  const [smoothing, setSmoothing] = useState(DEFAULT_SMOOTHING)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const colorInputRef = useRef(null)

  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedSignatureSlot, setSelectedSignatureSlot] = useState(null)
  const [templateSignatures, setTemplateSignatures] = useState({})
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  const [signatureHistory, setSignatureHistory] = useState(() => loadSignaturesFromStorage())
  const [showPreviewModal, setShowPreviewModal] = useState(null)

  const lastPointRef = useRef(null)

  useEffect(() => {
    saveSignaturesToStorage(signatureHistory)
  }, [signatureHistory])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvasContainerRef.current
    if (!canvas || !container) return

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      const isMobile = window.innerWidth <= 480
      const minWidth = isMobile ? Math.min(300, rect.width) : CANVAS_MIN_WIDTH
      const width = Math.max(minWidth, Math.min(rect.width, CANVAS_MIN_WIDTH))
      const height = isMobile ? 250 : CANVAS_MIN_HEIGHT
      const dpr = window.devicePixelRatio || 1

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      drawStrokesOnCanvas(ctx, strokes, smoothing)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [strokes, smoothing])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    drawStrokesOnCanvas(ctx, strokes, smoothing)

    if (currentStroke && currentStroke.points.length > 1) {
      drawStrokesOnCanvas(ctx, [currentStroke], smoothing)
    }
    ctx.restore()
  }, [strokes, currentStroke, smoothing])

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    const coords = getCanvasCoords(e)
    if (!coords) return

    const newStroke = createStroke(color, lineWidth)
    const strokeWithPoint = addPointToStroke(newStroke, coords)

    setIsDrawing(true)
    setCurrentStroke(strokeWithPoint)
    lastPointRef.current = coords
  }

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentStroke) return
    e.preventDefault()

    const coords = getCanvasCoords(e)
    if (!coords) return

    const updatedStroke = addPointToStroke(currentStroke, coords)
    setCurrentStroke(updatedStroke)
    lastPointRef.current = coords
  }

  const handleMouseUp = () => {
    if (!isDrawing || !currentStroke) return

    if (currentStroke.points.length >= 2) {
      const newStrokes = [...strokes, currentStroke]
      setStrokes(newStrokes)
      setHistory((h) => pushHistory(h, newStrokes))
    }

    setIsDrawing(false)
    setCurrentStroke(null)
    lastPointRef.current = null
  }

  const handleUndo = useCallback(() => {
    if (!canUndo(history)) return
    const result = undoHistory(history)
    setHistory(result)
    setStrokes(result.present)
  }, [history])

  const handleRedo = useCallback(() => {
    if (!canRedo(history)) return
    const result = redoHistory(history)
    setHistory(result)
    setStrokes(result.present)
  }, [history])

  const handleClear = () => {
    if (isCanvasEmpty(strokes)) return
    if (!window.confirm('确定要清空画布吗？此操作无法撤销。')) return

    setStrokes([])
    setHistory(createHistory())
  }

  const handleExport = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (isCanvasEmpty(strokes)) {
      if (!window.confirm('画布为空，确定要导出空白签名吗？')) return
    }

    const dataUrl = canvasToDataURL(canvas)
    const filename = generateFileName()
    downloadDataURL(dataUrl, filename)
  }

  const handleSaveToHistory = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (isCanvasEmpty(strokes)) {
      alert('请先绘制签名')
      return
    }

    const dataUrl = canvasToDataURL(canvas)
    const record = await createSignatureRecord(dataUrl)
    setSignatureHistory((prev) => addSignatureToHistory(prev, record))
    alert('签名已保存到历史记录')
  }

  const handleDeleteSignature = (id) => {
    if (!window.confirm('确定要删除这条签名记录吗？')) return
    setSignatureHistory((prev) => removeSignatureFromHistory(prev, id))
  }

  const handleUseSignature = async (item) => {
    try {
      const img = await dataURLToImage(item.dataUrl)
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      const rect = canvas.getBoundingClientRect()

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, rect.width, rect.height)

      const scale = Math.min((rect.width - 40) / img.width, (rect.height - 40) / img.height, 1)
      const x = (rect.width - img.width * scale) / 2
      const y = (rect.height - img.height * scale) / 2

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

      setStrokes([])
      setHistory(createHistory())
    } catch {
      alert('加载签名失败')
    }
  }

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template)
    setTemplateSignatures({})
    setSelectedSignatureSlot(null)
    setShowTemplateModal(false)
  }

  const handleSlotClick = (slotId) => {
    setSelectedSignatureSlot(slotId)
    setStrokes([])
    setHistory(createHistory())
  }

  const handleAssignSignatureToSlot = () => {
    if (!selectedSignatureSlot) return
    if (isCanvasEmpty(strokes)) {
      alert('请先绘制签名')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvasToDataURL(canvas)
    setTemplateSignatures((prev) => ({
      ...prev,
      [selectedSignatureSlot]: dataUrl,
    }))

    setStrokes([])
    setHistory(createHistory())
    setSelectedSignatureSlot(null)
  }

  const handleCloseTemplate = () => {
    setSelectedTemplate(null)
    setTemplateSignatures({})
    setSelectedSignatureSlot(null)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div className="sp-header-left">
          <Link to="/" className="sp-back-link">← 返回首页</Link>
          <h1 className="sp-title">电子签名板</h1>
        </div>
      </div>

      <div className="sp-toolbar">
        <div className="sp-toolbar-section">
          <div className="sp-toolbar-label">颜色</div>
          <div className="sp-color-picker-wrap">
            <div
              className="sp-color-current"
              style={{ backgroundColor: color }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="预设颜色"
            />
            <input
              ref={colorInputRef}
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="sp-color-input"
              title="自定义颜色"
            />
          </div>
          {showColorPicker && (
            <div className="sp-color-presets">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className={`sp-color-swatch ${color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    setColor(c)
                    setShowColorPicker(false)
                  }}
                  title={c}
                />
              ))}
            </div>
          )}
        </div>

        <div className="sp-toolbar-section">
          <div className="sp-toolbar-label">
            粗细: <span className="sp-value">{lineWidth}px</span>
          </div>
          <div className="sp-slider-wrap">
            <input
              type="range"
              min={MIN_LINE_WIDTH}
              max={MAX_LINE_WIDTH}
              value={lineWidth}
              onChange={(e) => setLineWidth(clampLineWidth(Number(e.target.value)))}
              className="sp-slider"
            />
            <div
              className="sp-thickness-preview"
              style={{ width: `${lineWidth}px`, height: `${lineWidth}px`, backgroundColor: color }}
            />
          </div>
        </div>

        <div className="sp-toolbar-section">
          <div className="sp-toolbar-label">
            平滑: <span className="sp-value">{smoothing}</span>
          </div>
          <input
            type="range"
            min={MIN_SMOOTHING}
            max={MAX_SMOOTHING}
            value={smoothing}
            onChange={(e) => setSmoothing(clampSmoothing(Number(e.target.value)))}
            className="sp-slider"
          />
        </div>

        <div className="sp-toolbar-divider" />

        <button className="sp-btn" onClick={handleUndo} disabled={!canUndo(history)} title="撤销 (Ctrl+Z)">
          ↶ 撤销
        </button>
        <button className="sp-btn" onClick={handleRedo} disabled={!canRedo(history)} title="重做 (Ctrl+Y)">
          ↷ 重做
        </button>
        <button className="sp-btn sp-btn-danger" onClick={handleClear} disabled={isCanvasEmpty(strokes)}>
          🗑️ 清空
        </button>

        <div className="sp-toolbar-divider" />

        <button className="sp-btn" onClick={() => setShowTemplateModal(true)}>
          📄 选择文档模板
        </button>

        <div className="sp-toolbar-divider" />

        <button className="sp-btn sp-btn-primary" onClick={handleExport}>
          💾 导出 PNG
        </button>
        <button className="sp-btn sp-btn-secondary" onClick={handleSaveToHistory}>
          ⭐ 保存到历史
        </button>
      </div>

      <div className="sp-main">
        {selectedTemplate ? (
          <div className="sp-template-layout">
            <div className="sp-template-preview">
              <div className="sp-template-header">
                <h3 className="sp-template-name">{selectedTemplate.name}</h3>
                <button className="sp-btn sp-btn-sm" onClick={handleCloseTemplate}>
                  关闭模板
                </button>
              </div>
              <div className="sp-template-content">
                <pre className="sp-template-text">{selectedTemplate.content}</pre>
                {selectedTemplate.signaturePositions.map((slot) => (
                  <button
                    key={slot.id}
                    className={`sp-slot-marker ${selectedSignatureSlot === slot.id ? 'active' : ''} ${templateSignatures[slot.id] ? 'filled' : ''}`}
                    style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    onClick={() => handleSlotClick(slot.id)}
                  >
                    {templateSignatures[slot.id] ? (
                      <img src={templateSignatures[slot.id]} alt={slot.label} />
                    ) : (
                      <span>{slot.label}</span>
                    )}
                  </button>
                ))}
              </div>
              {selectedSignatureSlot && (
                <div className="sp-template-actions">
                  <span className="sp-slot-hint">
                    当前正在为「{selectedTemplate.signaturePositions.find((s) => s.id === selectedSignatureSlot)?.label}」签名
                  </span>
                  <button className="sp-btn sp-btn-sm sp-btn-primary" onClick={handleAssignSignatureToSlot}>
                    ✓ 确认签名
                  </button>
                </div>
              )}
            </div>

            <div className="sp-canvas-section">
              <div className="sp-canvas-wrapper" ref={canvasContainerRef}>
                <canvas
                  ref={canvasRef}
                  className="sp-canvas"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleMouseDown}
                  onTouchMove={handleMouseMove}
                  onTouchEnd={handleMouseUp}
                />
              </div>
              <div className="sp-canvas-hint">
                <span>按住鼠标或触摸绘制签名</span>
                <span>Ctrl+Z 撤销 · Ctrl+Y 重做</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="sp-canvas-section">
            <div className="sp-canvas-wrapper" ref={canvasContainerRef}>
              <canvas
                ref={canvasRef}
                className="sp-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
              />
            </div>
            <div className="sp-canvas-hint">
              <span>按住鼠标或触摸绘制签名</span>
              <span>Ctrl+Z 撤销 · Ctrl+Y 重做</span>
            </div>
          </div>
        )}
      </div>

      <div className="sp-history">
        <div className="sp-history-header">
          <h3 className="sp-history-title">
            签名历史
            <span className="sp-history-count">({signatureHistory.length}/{HISTORY_MAX_ITEMS})</span>
          </h3>
        </div>
        {signatureHistory.length === 0 ? (
          <div className="sp-history-empty">
            <div className="sp-empty-icon">📝</div>
            <div className="sp-empty-text">暂无保存的签名</div>
            <div className="sp-empty-hint">绘制签名后点击「保存到历史」即可保存</div>
          </div>
        ) : (
          <div className="sp-history-grid">
            {signatureHistory.map((item) => (
              <div key={item.id} className="sp-history-item">
                <div className="sp-history-thumb" onClick={() => setShowPreviewModal(item)}>
                  <img src={item.thumbnail} alt="签名缩略图" />
                </div>
                <div className="sp-history-date">{formatDate(item.createdAt)}</div>
                <div className="sp-history-actions">
                  <button className="sp-btn sp-btn-xs" onClick={() => setShowPreviewModal(item)}>
                    查看
                  </button>
                  <button className="sp-btn sp-btn-xs sp-btn-secondary" onClick={() => handleUseSignature(item)}>
                    使用
                  </button>
                  <button className="sp-btn sp-btn-xs sp-btn-danger" onClick={() => handleDeleteSignature(item.id)}>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTemplateModal && (
        <div className="sp-modal" onClick={(e) => e.target === e.currentTarget && setShowTemplateModal(false)}>
          <div className="sp-modal-content">
            <div className="sp-modal-header">
              <h3>选择文档模板</h3>
              <button className="sp-btn sp-btn-sm" onClick={() => setShowTemplateModal(false)}>
                ✕
              </button>
            </div>
            <div className="sp-template-list">
              {TEMPLATES.filter((t) => t.id !== TEMPLATE_TYPES.NONE).map((template) => (
                <button
                  key={template.id}
                  className="sp-template-card"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="sp-template-card-icon">📄</div>
                  <div className="sp-template-card-name">{template.name}</div>
                  <div className="sp-template-card-slots">
                    {template.signaturePositions.length} 个签名位
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && (
        <div className="sp-modal" onClick={(e) => e.target === e.currentTarget && setShowPreviewModal(null)}>
          <div className="sp-modal-content sp-preview-modal">
            <div className="sp-modal-header">
              <h3>签名预览</h3>
              <button className="sp-btn sp-btn-sm" onClick={() => setShowPreviewModal(null)}>
                ✕
              </button>
            </div>
            <div className="sp-preview-content">
              <img src={showPreviewModal.dataUrl} alt="签名预览" />
              <div className="sp-preview-date">
                创建时间: {formatDate(showPreviewModal.createdAt)}
              </div>
            </div>
            <div className="sp-preview-actions">
              <button
                className="sp-btn sp-btn-secondary"
                onClick={() => {
                  handleUseSignature(showPreviewModal)
                  setShowPreviewModal(null)
                }}
              >
                使用此签名
              </button>
              <button
                className="sp-btn sp-btn-primary"
                onClick={() => {
                  downloadDataURL(showPreviewModal.dataUrl, generateFileName())
                }}
              >
                下载 PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SignaturePadPage
