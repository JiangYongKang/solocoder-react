import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  loadFromStorage,
  saveToStorage,
  screenToWorld,
  worldToScreen,
  clampZoom,
  clampLineWidth,
  clampEraserSize,
  clampFontSize,
  createBrushShape,
  createRectangleShape,
  createCircleShape,
  createLineShape,
  createTextShape,
  normalizeRectangle,
  normalizeCircle,
  snapLineToAngle,
  addShape,
  addBrushPoint,
  updateShape,
  undo,
  redo,
  pushHistory,
  canUndo,
  canRedo,
  downloadJson,
  importFromJson,
  fitToView,
  findTextAtPoint,
  generateId,
  getShapesBounds as coreGetShapesBounds,
} from './whiteboardCore.js'
import {
  TOOL_TYPES,
  SHAPE_TYPES,
  DEFAULT_ZOOM,
  DEFAULT_COLOR,
  DEFAULT_LINE_WIDTH,
  DEFAULT_ERASER_SIZE,
  DEFAULT_FONT_SIZE,
  PRESET_COLORS,
  MIN_LINE_WIDTH,
  MAX_LINE_WIDTH,
  MIN_ERASER_SIZE,
  MAX_ERASER_SIZE,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
} from './constants.js'
import './whiteboard.css'

const distance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

const pointNearRect = (px, py, rx, ry, rw, rh, radius) => {
  const closestX = Math.max(rx, Math.min(px, rx + rw))
  const closestY = Math.max(ry, Math.min(py, ry + rh))
  return distance(px, py, closestX, closestY) <= radius
}

const pointNearEllipse = (px, py, cx, cy, rx, ry, radius) => {
  if (rx === 0 || ry === 0) return distance(px, py, cx, cy) <= radius
  const nx = (px - cx) / rx
  const ny = (py - cy) / ry
  const dist = Math.sqrt(nx * nx + ny * ny)
  if (dist <= 1) return true
  const ratio = 1 / dist
  return distance(px, py, cx + (px - cx) * ratio, cy + (py - cy) * ratio) <= radius
}

const pointNearLine = (px, py, x1, y1, x2, y2, radius) => {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1
  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1
  if (lenSq !== 0) param = dot / lenSq
  let xx, yy
  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }
  return distance(px, py, xx, yy) <= radius
}

const isShapeIntersectingPoint = (shape, px, py, radius) => {
  switch (shape.type) {
    case SHAPE_TYPES.BRUSH:
      return shape.points?.some((p) => distance(p.x, p.y, px, py) <= radius) || false
    case SHAPE_TYPES.RECTANGLE: {
      const r = normalizeRectangle(shape.x, shape.y, shape.width, shape.height)
      return pointNearRect(px, py, r.x, r.y, r.width, r.height, radius)
    }
    case SHAPE_TYPES.CIRCLE: {
      const c = normalizeCircle(shape.cx, shape.cy, shape.rx, shape.ry)
      return pointNearEllipse(px, py, c.cx, c.cy, c.rx, c.ry, radius)
    }
    case SHAPE_TYPES.LINE:
      return pointNearLine(px, py, shape.x1, shape.y1, shape.x2, shape.y2, radius)
    case SHAPE_TYPES.TEXT: {
      const charCount = shape.text?.length || 1
      const approxWidth = Math.max(charCount * (shape.fontSize || 16) * 0.6, shape.fontSize || 16)
      const approxHeight = (shape.fontSize || 16) * 1.2
      const top = shape.y - approxHeight
      const left = shape.x
      return pointNearRect(px, py, left, top, approxWidth, approxHeight, radius)
    }
    default:
      return false
  }
}

function WhiteboardPage() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const textInputRef = useRef(null)

  const [shapes, setShapes] = useState(() => loadFromStorage())
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [currentTool, setCurrentTool] = useState(TOOL_TYPES.BRUSH)
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [lineWidth, setLineWidth] = useState(DEFAULT_LINE_WIDTH)
  const [eraserSize, setEraserSize] = useState(DEFAULT_ERASER_SIZE)
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [currentShape, setCurrentShape] = useState(null)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [editingText, setEditingText] = useState(null)
  const [editingTextId, setEditingTextId] = useState(null)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const lineWidthRef = useRef(lineWidth)
  const fontSizeRef = useRef(fontSize)

  useEffect(() => {
    lineWidthRef.current = lineWidth
  }, [lineWidth])

  useEffect(() => {
    fontSizeRef.current = fontSize
  }, [fontSize])

  const drawGrid = useCallback(
    (ctx, w, h) => {
      const gridSize = 40
      ctx.strokeStyle = '#e5e5e5'
      ctx.lineWidth = 1 / zoom

      const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize
      const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize

      ctx.beginPath()
      for (let x = startX; x < startX + w + gridSize; x += gridSize) {
        ctx.moveTo(x, startY)
        ctx.lineTo(x, startY + h + gridSize)
      }
      for (let y = startY; y < startY + h + gridSize; y += gridSize) {
        ctx.moveTo(startX, y)
        ctx.lineTo(startX + w + gridSize, y)
      }
      ctx.stroke()
    },
    [zoom, pan.x, pan.y]
  )

  const drawShape = useCallback(
    (ctx, shape) => {
      ctx.save()
      ctx.strokeStyle = shape.color || DEFAULT_COLOR
      ctx.fillStyle = shape.color || DEFAULT_COLOR
      ctx.lineWidth = shape.lineWidth || lineWidthRef.current
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      switch (shape.type) {
        case SHAPE_TYPES.BRUSH:
          if (shape.points && shape.points.length > 1) {
            ctx.beginPath()
            ctx.moveTo(shape.points[0].x, shape.points[0].y)
            for (let i = 1; i < shape.points.length; i++) {
              ctx.lineTo(shape.points[i].x, shape.points[i].y)
            }
            ctx.stroke()
          }
          break
        case SHAPE_TYPES.RECTANGLE: {
          const r = normalizeRectangle(shape.x, shape.y, shape.width, shape.height)
          ctx.beginPath()
          ctx.rect(r.x, r.y, r.width, r.height)
          ctx.stroke()
          break
        }
        case SHAPE_TYPES.CIRCLE: {
          const c = normalizeCircle(shape.cx, shape.cy, shape.rx, shape.ry)
          ctx.beginPath()
          ctx.ellipse(c.cx, c.cy, c.rx, c.ry, 0, 0, Math.PI * 2)
          ctx.stroke()
          break
        }
        case SHAPE_TYPES.LINE:
          ctx.beginPath()
          ctx.moveTo(shape.x1, shape.y1)
          ctx.lineTo(shape.x2, shape.y2)
          ctx.stroke()
          break
        case SHAPE_TYPES.TEXT:
          ctx.font = `${shape.fontSize || fontSizeRef.current}px sans-serif`
          ctx.textBaseline = 'alphabetic'
          ctx.fillText(shape.text || '', shape.x, shape.y)
          break
      }
      ctx.restore()
    },
    []
  )

  const drawAll = useCallback(
    (ctx, width, height) => {
      ctx.save()
      ctx.fillStyle = '#fafafa'
      ctx.fillRect(0, 0, width, height)

      ctx.translate(pan.x, pan.y)
      ctx.scale(zoom, zoom)

      drawGrid(ctx, width / zoom, height / zoom)

      const allShapes = currentShape ? [...shapes, currentShape] : shapes
      allShapes.forEach((shape) => drawShape(ctx, shape))

      ctx.restore()
    },
    [shapes, currentShape, zoom, pan.x, pan.y, drawGrid, drawShape]
  )

  useEffect(() => {
    saveToStorage(shapes)
  }, [shapes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    drawAll(ctx, rect.width, rect.height)
  }, [shapes, currentShape, zoom, pan, drawAll])

  const handleUndo = useCallback(() => {
    if (!canUndo(historyIndex)) return
    const result = undo(shapes, history, historyIndex)
    setShapes(result.shapes)
    setHistoryIndex(result.historyIndex)
  }, [shapes, history, historyIndex])

  const handleRedo = useCallback(() => {
    if (!canRedo(history, historyIndex)) return
    const result = redo(shapes, history, historyIndex)
    setShapes(result.shapes)
    setHistoryIndex(result.historyIndex)
  }, [shapes, history, historyIndex])

  const handleFitToView = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const { panX, panY, zoom: newZoom } = fitToView(shapes, rect.width, rect.height, 80)
    setPan({ x: panX, y: panY })
    setZoom(newZoom)
  }, [shapes])

  const handleExportPng = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const bounds = coreGetShapesBounds(shapes)
    if (bounds.width === 0 && bounds.height === 0) {
      alert('画布为空，无法导出')
      return
    }

    const padding = 40
    const exportCanvas = document.createElement('canvas')
    const scale = 2
    exportCanvas.width = (bounds.width + padding * 2) * scale
    exportCanvas.height = (bounds.height + padding * 2) * scale
    const ctx = exportCanvas.getContext('2d')
    ctx.scale(scale, scale)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, bounds.width + padding * 2, bounds.height + padding * 2)
    ctx.translate(-bounds.minX + padding, -bounds.minY + padding)

    shapes.forEach((shape) => drawShape(ctx, shape))

    exportCanvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `whiteboard-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [shapes, drawShape])

  const handleExportJson = useCallback(() => {
    downloadJson(shapes, `whiteboard-${Date.now()}.json`)
  }, [shapes])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImportFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const json = JSON.parse(text)
        const result = importFromJson(json)
        if (result.valid) {
          setShapes(result.data)
          const hResult = pushHistory([], 0, result.data)
          setHistory(hResult.history)
          setHistoryIndex(hResult.historyIndex)
          setTimeout(() => handleFitToView(), 50)
        } else {
          alert(`导入失败: ${result.error}`)
        }
      } catch {
        alert('导入失败：无效的 JSON 文件')
      }
      e.target.value = ''
    },
    [handleFitToView]
  )

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key === 'Shift') {
        setIsShiftPressed(true)
      }
      if (e.key === ' ') {
        setIsSpacePressed(true)
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault()
        handleRedo()
      }
    }

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false)
      }
      if (e.key === ' ') {
        setIsSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleUndo, handleRedo])

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top

    if (e.button === 1 || isSpacePressed) {
      setIsPanning(true)
      setPanStart({ x: sx - pan.x, y: sy - pan.y })
      return
    }

    if (editingTextId) {
      return
    }

    const world = screenToWorld(sx, sy, pan.x, pan.y, zoom)

    if (currentTool === TOOL_TYPES.TEXT) {
      const existingText = findTextAtPoint(shapes, world.x, world.y)
      if (existingText) {
        setEditingTextId(existingText.id)
        setEditingText(existingText.text)
        const screenPos = worldToScreen(existingText.x, existingText.y, pan.x, pan.y, zoom)
        setTimeout(() => {
          if (textInputRef.current) {
            textInputRef.current.style.left = `${screenPos.x}px`
            textInputRef.current.style.top = `${screenPos.y - existingText.fontSize}px`
            textInputRef.current.style.fontSize = `${existingText.fontSize}px`
            textInputRef.current.style.color = existingText.color
            textInputRef.current.focus()
          }
        }, 0)
        return
      }
      const newText = createTextShape(world.x, world.y, '', color, fontSize)
      setEditingTextId(newText.id)
      setEditingText('')
      const tempShapes = addShape(shapes, newText)
      setShapes(tempShapes)
      const result = pushHistory(history, historyIndex, tempShapes)
      setHistory(result.history)
      setHistoryIndex(result.historyIndex)
      const screenPos = worldToScreen(world.x, world.y, pan.x, pan.y, zoom)
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.style.left = `${screenPos.x}px`
          textInputRef.current.style.top = `${screenPos.y - fontSize}px`
          textInputRef.current.style.fontSize = `${fontSize}px`
          textInputRef.current.style.color = color
          textInputRef.current.focus()
        }
      }, 0)
      return
    }

    if (currentTool === TOOL_TYPES.ERASER) {
      setIsDrawing(true)
      setCurrentShape({
        id: generateId('eraser'),
        type: 'eraser-preview',
        x: world.x,
        y: world.y,
        size: eraserSize,
      })
      const eraserRadius = eraserSize / 2 / zoom
      const newShapes = shapes.filter((shape) => !isShapeIntersectingPoint(shape, world.x, world.y, eraserRadius))
      if (newShapes.length !== shapes.length) {
        setShapes(newShapes)
        const result = pushHistory(history, historyIndex, newShapes)
        setHistory(result.history)
        setHistoryIndex(result.historyIndex)
      }
      return
    }

    setIsDrawing(true)

    switch (currentTool) {
      case TOOL_TYPES.BRUSH:
        setCurrentShape(createBrushShape([{ x: world.x, y: world.y }], color, lineWidth))
        break
      case TOOL_TYPES.RECTANGLE:
        setCurrentShape(createRectangleShape(world.x, world.y, 0, 0, color, lineWidth))
        break
      case TOOL_TYPES.CIRCLE:
        setCurrentShape(createCircleShape(world.x, world.y, 0, 0, color, lineWidth))
        break
      case TOOL_TYPES.LINE:
        setCurrentShape(createLineShape(world.x, world.y, world.x, world.y, color, lineWidth))
        break
    }
  }

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top

    if (isPanning) {
      setPan({ x: sx - panStart.x, y: sy - panStart.y })
      return
    }

    if (editingTextId) return

    const world = screenToWorld(sx, sy, pan.x, pan.y, zoom)

    if (isDrawing && currentShape) {
      switch (currentTool) {
        case TOOL_TYPES.BRUSH:
          setCurrentShape(addBrushPoint(currentShape, world))
          break
        case TOOL_TYPES.RECTANGLE:
          setCurrentShape({
            ...currentShape,
            width: world.x - currentShape.x,
            height: world.y - currentShape.y,
          })
          break
        case TOOL_TYPES.CIRCLE: {
          const startX = currentShape.cx
          const startY = currentShape.cy
          setCurrentShape({
            ...currentShape,
            rx: world.x - startX,
            ry: world.y - startY,
          })
          break
        }
        case TOOL_TYPES.LINE: {
          let line = { ...currentShape, x2: world.x, y2: world.y }
          if (isShiftPressed) {
            line = snapLineToAngle(line.x1, line.y1, line.x2, line.y2)
          }
          setCurrentShape(line)
          break
        }
        case TOOL_TYPES.ERASER: {
          setCurrentShape({
            ...currentShape,
            x: world.x,
            y: world.y,
          })
          const eraserRadius = eraserSize / 2 / zoom
          const newShapes = shapes.filter((shape) => !isShapeIntersectingPoint(shape, world.x, world.y, eraserRadius))
          if (newShapes.length !== shapes.length) {
            setShapes(newShapes)
          }
          break
        }
      }
    }
  }

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
      return
    }

    if (editingTextId) return

    if (isDrawing && currentShape) {
      if (currentTool === TOOL_TYPES.ERASER) {
        const result = pushHistory(history, historyIndex, shapes)
        setHistory(result.history)
        setHistoryIndex(result.historyIndex)
      } else if (currentTool === TOOL_TYPES.BRUSH) {
        if (currentShape.points && currentShape.points.length > 1) {
          const newShapes = addShape(shapes, currentShape)
          setShapes(newShapes)
          const result = pushHistory(history, historyIndex, newShapes)
          setHistory(result.history)
          setHistoryIndex(result.historyIndex)
        }
      } else {
        let valid = false
        switch (currentTool) {
          case TOOL_TYPES.RECTANGLE:
            valid = Math.abs(currentShape.width) > 1 || Math.abs(currentShape.height) > 1
            break
          case TOOL_TYPES.CIRCLE:
            valid = Math.abs(currentShape.rx) > 1 || Math.abs(currentShape.ry) > 1
            break
          case TOOL_TYPES.LINE:
            valid = distance(currentShape.x1, currentShape.y1, currentShape.x2, currentShape.y2) > 1
            break
        }
        if (valid) {
          const newShapes = addShape(shapes, currentShape)
          setShapes(newShapes)
          const result = pushHistory(history, historyIndex, newShapes)
          setHistory(result.history)
          setHistoryIndex(result.historyIndex)
        }
      }
    }

    setIsDrawing(false)
    setCurrentShape(null)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top

    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = clampZoom(zoom + delta)
    if (newZoom === zoom) return

    const worldX = (sx - pan.x) / zoom
    const worldY = (sy - pan.y) / zoom
    const newPanX = sx - worldX * newZoom
    const newPanY = sy - worldY * newZoom

    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  const handleTextInputChange = (e) => {
    setEditingText(e.target.value)
    if (editingTextId) {
      setShapes((prev) => updateShape(prev, editingTextId, { text: e.target.value }))
    }
  }

  const handleTextInputBlur = () => {
    if (editingTextId) {
      const result = pushHistory(history, historyIndex, shapes)
      setHistory(result.history)
      setHistoryIndex(result.historyIndex)
    }
    setEditingTextId(null)
    setEditingText(null)
  }

  const handleTextInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextInputBlur()
    }
    if (e.key === 'Escape') {
      handleTextInputBlur()
    }
  }

  return (
    <div className="wb-page">
      <div className="wb-header">
        <button className="wb-back-btn" onClick={() => navigate('/')} aria-label="返回首页">
          ← 返回首页
        </button>
        <h1 className="wb-title">协作白板</h1>
      </div>

      <div className="wb-toolbar-top">
        <div className="wb-toolbar-left">
          <button
            className={`wb-tool-btn ${currentTool === TOOL_TYPES.BRUSH ? 'active' : ''}`}
            onClick={() => setCurrentTool(TOOL_TYPES.BRUSH)}
            title="画笔"
          >
            ✏️ 画笔
          </button>
          <button
            className={`wb-tool-btn ${currentTool === TOOL_TYPES.RECTANGLE ? 'active' : ''}`}
            onClick={() => setCurrentTool(TOOL_TYPES.RECTANGLE)}
            title="矩形"
          >
            ▭ 矩形
          </button>
          <button
            className={`wb-tool-btn ${currentTool === TOOL_TYPES.CIRCLE ? 'active' : ''}`}
            onClick={() => setCurrentTool(TOOL_TYPES.CIRCLE)}
            title="圆形"
          >
            ◯ 圆形
          </button>
          <button
            className={`wb-tool-btn ${currentTool === TOOL_TYPES.LINE ? 'active' : ''}`}
            onClick={() => setCurrentTool(TOOL_TYPES.LINE)}
            title="直线"
          >
            ╱ 直线
          </button>
          <button
            className={`wb-tool-btn ${currentTool === TOOL_TYPES.TEXT ? 'active' : ''}`}
            onClick={() => setCurrentTool(TOOL_TYPES.TEXT)}
            title="文本"
          >
            T 文本
          </button>
          <button
            className={`wb-tool-btn ${currentTool === TOOL_TYPES.ERASER ? 'active' : ''}`}
            onClick={() => setCurrentTool(TOOL_TYPES.ERASER)}
            title="橡皮擦"
          >
            🧹 橡皮擦
          </button>
        </div>

        <div className="wb-toolbar-center">
          <button className="wb-action-btn" onClick={handleUndo} disabled={!canUndo(historyIndex)} title="撤销 (Ctrl+Z)">
            ↶ 撤销
          </button>
          <button
            className="wb-action-btn"
            onClick={handleRedo}
            disabled={!canRedo(history, historyIndex)}
            title="重做 (Ctrl+Y)"
          >
            ↷ 重做
          </button>
        </div>

        <div className="wb-toolbar-right">
          <button className="wb-action-btn" onClick={handleImportClick} title="导入 JSON">
            📥 导入 JSON
          </button>
          <button className="wb-action-btn" onClick={handleExportJson} title="导出 JSON">
            📤 导出 JSON
          </button>
          <button
            className="wb-action-btn wb-action-btn-primary"
            onClick={handleExportPng}
            title="导出 PNG"
          >
            🖼️ 导出 PNG
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="wb-hidden-input"
            onChange={handleImportFile}
          />
        </div>
      </div>

      <div className="wb-main">
        <div className="wb-sidebar">
          {(currentTool === TOOL_TYPES.BRUSH ||
            currentTool === TOOL_TYPES.RECTANGLE ||
            currentTool === TOOL_TYPES.CIRCLE ||
            currentTool === TOOL_TYPES.LINE ||
            currentTool === TOOL_TYPES.TEXT) && (
            <div className="wb-panel">
              <div className="wb-panel-title">颜色</div>
              <div className="wb-color-picker-wrap">
                <div
                  className="wb-color-current"
                  style={{ backgroundColor: color }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="wb-color-input"
                />
              </div>
              {showColorPicker && (
                <div className="wb-color-presets">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      className="wb-color-swatch"
                      style={{ backgroundColor: c }}
                      onClick={() => {
                        setColor(c)
                        setShowColorPicker(false)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {(currentTool === TOOL_TYPES.BRUSH ||
            currentTool === TOOL_TYPES.RECTANGLE ||
            currentTool === TOOL_TYPES.CIRCLE ||
            currentTool === TOOL_TYPES.LINE) && (
            <div className="wb-panel">
              <div className="wb-panel-title">线宽: {lineWidth}px</div>
              <input
                type="range"
                min={MIN_LINE_WIDTH}
                max={MAX_LINE_WIDTH}
                value={lineWidth}
                onChange={(e) => setLineWidth(clampLineWidth(Number(e.target.value)))}
                className="wb-slider"
              />
            </div>
          )}

          {currentTool === TOOL_TYPES.ERASER && (
            <div className="wb-panel">
              <div className="wb-panel-title">橡皮擦大小: {eraserSize}px</div>
              <input
                type="range"
                min={MIN_ERASER_SIZE}
                max={MAX_ERASER_SIZE}
                value={eraserSize}
                onChange={(e) => setEraserSize(clampEraserSize(Number(e.target.value)))}
                className="wb-slider"
              />
            </div>
          )}

          {currentTool === TOOL_TYPES.TEXT && (
            <div className="wb-panel">
              <div className="wb-panel-title">字号: {fontSize}px</div>
              <input
                type="range"
                min={MIN_FONT_SIZE}
                max={MAX_FONT_SIZE}
                value={fontSize}
                onChange={(e) => setFontSize(clampFontSize(Number(e.target.value)))}
                className="wb-slider"
              />
            </div>
          )}
        </div>

        <div className="wb-canvas-container">
          <canvas
            ref={canvasRef}
            className="wb-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              cursor: isSpacePressed || isPanning ? 'grab' : currentTool === TOOL_TYPES.TEXT ? 'text' : 'crosshair',
            }}
          />
          {editingTextId && (
            <input
              ref={textInputRef}
              type="text"
              className="wb-text-input"
              value={editingText || ''}
              onChange={handleTextInputChange}
              onBlur={handleTextInputBlur}
              onKeyDown={handleTextInputKeyDown}
              placeholder="输入文字..."
              autoFocus
            />
          )}
        </div>
      </div>

      <div className="wb-zoom-controls">
        <button
          className="wb-zoom-btn"
          onClick={() => setZoom(clampZoom(zoom - 0.1))}
          title="缩小"
        >
          −
        </button>
        <div className="wb-zoom-info">{Math.round(zoom * 100)}%</div>
        <button
          className="wb-zoom-btn"
          onClick={() => setZoom(clampZoom(zoom + 0.1))}
          title="放大"
        >
          +
        </button>
        <button
          className="wb-zoom-btn"
          onClick={handleFitToView}
          title="适应窗口"
          style={{ fontSize: '12px' }}
        >
          ⤢ 适应
        </button>
      </div>

      <div className="wb-hint">
        <span>滚轮缩放 · 中键/空格键拖拽平移 · 直线按住 Shift 锁定角度</span>
        <span>Ctrl+Z 撤销 · Ctrl+Y 重做</span>
      </div>
    </div>
  )
}

export default WhiteboardPage
