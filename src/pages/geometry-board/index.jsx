import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  loadFromStorage,
  saveToStorage,
  screenToWorld,
  worldToScreen,
  clampZoom,
  createPoint,
  createLine,
  createCircle,
  addShape,
  removeShape,
  removeShapes,
  updateShape,
  getShapeById,
  groupShapesByType,
  hitTest,
  getLineLength,
  getCircleRadius,
  formatCoordinate,
  formatLength,
  formatAngle,
  getLineMidpoint,
  getPointLabelPosition,
  getCircleRadiusEndpoint,
  fitToView,
  resetView,
  exportToSvg,
  downloadSvg,
  findAngleMeasurement,
  distance,
} from './geometryBoardCore.js'
import {
  TOOL_TYPES,
  SHAPE_TYPES,
  GRID_SIZE,
  POINT_RADIUS,
  SELECTED_POINT_RADIUS,
  HANDLE_RADIUS,
  COLORS,
} from './constants.js'
import './geometry-board.css'

function GeometryBoardPage() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  const [shapes, setShapes] = useState(() => loadFromStorage())
  const [selectedShapeIds, setSelectedShapeIds] = useState([])
  const [currentTool, setCurrentTool] = useState(TOOL_TYPES.SELECT)
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 400, y: 300 })
  const [isPanning, setIsPanning] = useState(false)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingState, setDrawingState] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragInfo, setDragInfo] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  const panStartRef = useRef({ x: 0, y: 0 })
  const shapesRef = useRef(shapes)
  const selectedRef = useRef(selectedShapeIds)

  useEffect(() => { shapesRef.current = shapes }, [shapes])
  useEffect(() => { selectedRef.current = selectedShapeIds }, [selectedShapeIds])

  useEffect(() => {
    saveToStorage(shapes)
  }, [shapes])

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setCanvasSize({ width: rect.width, height: rect.height })
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setPan({ x: rect.width / 2, y: rect.height / 2 })
      setCanvasSize({ width: rect.width, height: rect.height })
    }
  }, [])

  const drawGrid = useCallback((ctx) => {
    const scaledGrid = GRID_SIZE * zoom
    const startX = pan.x % scaledGrid
    const startY = pan.y % scaledGrid

    ctx.save()
    ctx.strokeStyle = COLORS.GRID_LINE
    ctx.lineWidth = 1

    ctx.beginPath()
    for (let x = startX; x < canvasSize.width + scaledGrid; x += scaledGrid) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasSize.height)
    }
    for (let y = startY; y < canvasSize.height + scaledGrid; y += scaledGrid) {
      ctx.moveTo(0, y)
      ctx.lineTo(canvasSize.width, y)
    }
    ctx.stroke()

    const axisXScreenY = pan.y
    const axisYScreenX = pan.x

    ctx.strokeStyle = COLORS.AXIS_LINE
    ctx.lineWidth = 2
    ctx.beginPath()
    if (axisXScreenY >= -100 && axisXScreenY <= canvasSize.height + 100) {
      ctx.moveTo(0, axisXScreenY)
      ctx.lineTo(canvasSize.width, axisXScreenY)
    }
    if (axisYScreenX >= -100 && axisYScreenX <= canvasSize.width + 100) {
      ctx.moveTo(axisYScreenX, 0)
      ctx.lineTo(axisYScreenX, canvasSize.height)
    }
    ctx.stroke()

    ctx.fillStyle = COLORS.AXIS_LINE
    const arrowMargin = 15
    if (axisXScreenY >= -100 && axisXScreenY <= canvasSize.height + 100) {
      const xArrowX = canvasSize.width - arrowMargin
      ctx.beginPath()
      ctx.moveTo(xArrowX, axisXScreenY)
      ctx.lineTo(xArrowX - 10, axisXScreenY - 6)
      ctx.lineTo(xArrowX - 10, axisXScreenY + 6)
      ctx.closePath()
      ctx.fill()
    }
    if (axisYScreenX >= -100 && axisYScreenX <= canvasSize.width + 100) {
      const yArrowY = arrowMargin
      ctx.beginPath()
      ctx.moveTo(axisYScreenX, yArrowY)
      ctx.lineTo(axisYScreenX - 6, yArrowY + 10)
      ctx.lineTo(axisYScreenX + 6, yArrowY + 10)
      ctx.closePath()
      ctx.fill()
    }

    ctx.fillStyle = COLORS.AXIS_LINE
    ctx.font = '12px sans-serif'
    if (axisXScreenY >= -100 && axisXScreenY <= canvasSize.height + 100) {
      ctx.fillText('X', canvasSize.width - arrowMargin - 2, axisXScreenY - 8)
    }
    if (axisYScreenX >= -100 && axisYScreenX <= canvasSize.width + 100) {
      ctx.fillText('Y', axisYScreenX + 8, arrowMargin + 10)
    }
    if (pan.x >= -50 && pan.x <= canvasSize.width + 50 && pan.y >= -50 && pan.y <= canvasSize.height + 50) {
      ctx.fillText('O', pan.x + 4, pan.y + 14)
    }

    ctx.restore()
  }, [zoom, pan.x, pan.y, canvasSize.width, canvasSize.height])

  const drawShape = useCallback((ctx, shape, isSelected) => {
    const color = isSelected ? COLORS.SELECTED : shape.color
    ctx.save()
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 2

    switch (shape.type) {
      case SHAPE_TYPES.POINT: {
        const screen = worldToScreen(shape.x, shape.y, pan.x, pan.y, zoom)
        const r = (isSelected ? SELECTED_POINT_RADIUS : POINT_RADIUS)
        ctx.beginPath()
        ctx.arc(screen.x, screen.y, r, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = COLORS.LABEL
        ctx.font = `${12 * Math.max(0.7, zoom)}px sans-serif`
        const label = `(${formatCoordinate(shape.x)}, ${formatCoordinate(shape.y)})`
        ctx.fillText(label, screen.x + 10, screen.y - 8)
        break
      }
      case SHAPE_TYPES.LINE: {
        const s1 = worldToScreen(shape.x1, shape.y1, pan.x, pan.y, zoom)
        const s2 = worldToScreen(shape.x2, shape.y2, pan.x, pan.y, zoom)
        ctx.beginPath()
        ctx.moveTo(s1.x, s1.y)
        ctx.lineTo(s2.x, s2.y)
        ctx.stroke()

        const endR = isSelected ? SELECTED_POINT_RADIUS : POINT_RADIUS
        ctx.beginPath()
        ctx.arc(s1.x, s1.y, endR, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(s2.x, s2.y, endR, 0, Math.PI * 2)
        ctx.fill()

        if (isSelected) {
          ctx.fillStyle = COLORS.HANDLE
          ctx.beginPath()
          ctx.arc(s1.x, s1.y, HANDLE_RADIUS, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(s2.x, s2.y, HANDLE_RADIUS, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = COLORS.LABEL
        ctx.font = `${12 * Math.max(0.7, zoom)}px sans-serif`
        const label1 = `(${formatCoordinate(shape.x1)}, ${formatCoordinate(shape.y1)})`
        const label2 = `(${formatCoordinate(shape.x2)}, ${formatCoordinate(shape.y2)})`
        ctx.fillText(label1, s1.x + 10, s1.y - 8)
        ctx.fillText(label2, s2.x + 10, s2.y - 8)

        const mid = getLineMidpoint(shape)
        const midScreen = worldToScreen(mid.x, mid.y, pan.x, pan.y, zoom)
        const len = getLineLength(shape)
        ctx.fillText(formatLength(len), midScreen.x + 8, midScreen.y - 6)
        break
      }
      case SHAPE_TYPES.CIRCLE: {
        const center = worldToScreen(shape.cx, shape.cy, pan.x, pan.y, zoom)
        const rScreen = shape.r * zoom
        ctx.beginPath()
        ctx.arc(center.x, center.y, rScreen, 0, Math.PI * 2)
        ctx.stroke()

        const centerR = isSelected ? SELECTED_POINT_RADIUS : POINT_RADIUS
        ctx.beginPath()
        ctx.arc(center.x, center.y, centerR, 0, Math.PI * 2)
        ctx.fill()

        const radiusEnd = getCircleRadiusEndpoint(shape)
        const radiusEndScreen = worldToScreen(radiusEnd.x, radiusEnd.y, pan.x, pan.y, zoom)
        ctx.setLineDash([4, 2])
        ctx.beginPath()
        ctx.moveTo(center.x, center.y)
        ctx.lineTo(radiusEndScreen.x, radiusEndScreen.y)
        ctx.stroke()
        ctx.setLineDash([])

        if (isSelected) {
          ctx.fillStyle = COLORS.HANDLE
          ctx.beginPath()
          ctx.arc(center.x, center.y, HANDLE_RADIUS, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(radiusEndScreen.x, radiusEndScreen.y, HANDLE_RADIUS, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = COLORS.LABEL
        ctx.font = `${12 * Math.max(0.7, zoom)}px sans-serif`
        ctx.fillText(`(${formatCoordinate(shape.cx)}, ${formatCoordinate(shape.cy)})`, center.x + 10, center.y - 10)
        ctx.fillText(`r=${formatLength(shape.r)}`, radiusEndScreen.x + 6, radiusEndScreen.y - 6)
        break
      }
    }
    ctx.restore()
  }, [pan.x, pan.y, zoom])

  const drawAngleMeasurement = useCallback((ctx) => {
    const angleInfo = findAngleMeasurement(shapesRef.current, selectedRef.current)
    if (!angleInfo) return

    const vertexScreen = worldToScreen(angleInfo.vertex.x, angleInfo.vertex.y, pan.x, pan.y, zoom)
    const p1Screen = worldToScreen(angleInfo.point1.x, angleInfo.point1.y, pan.x, pan.y, zoom)
    const p2Screen = worldToScreen(angleInfo.point2.x, angleInfo.point2.y, pan.x, pan.y, zoom)

    const angle1 = Math.atan2(p1Screen.y - vertexScreen.y, p1Screen.x - vertexScreen.x)
    const angle2 = Math.atan2(p2Screen.y - vertexScreen.y, p2Screen.x - vertexScreen.x)

    let startAngle = angle1
    let endAngle = angle2
    let counterclockwise = false

    let diff = endAngle - startAngle
    while (diff > Math.PI) { diff -= 2 * Math.PI }
    while (diff < -Math.PI) { diff += 2 * Math.PI }
    if (diff < 0) {
      counterclockwise = true
    }

    const arcRadius = Math.min(40, distance(vertexScreen.x, vertexScreen.y, p1Screen.x, p1Screen.y) / 2,
      distance(vertexScreen.x, vertexScreen.y, p2Screen.x, p2Screen.y) / 2)

    ctx.save()
    ctx.strokeStyle = COLORS.ANGLE_ARC
    ctx.fillStyle = COLORS.ANGLE_ARC
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(vertexScreen.x, vertexScreen.y, arcRadius, startAngle, endAngle, counterclockwise)
    ctx.stroke()

    const midAngle = startAngle + (counterclockwise ? diff / 2 : diff / 2)
    const labelRadius = arcRadius + 16
    const labelX = vertexScreen.x + Math.cos(midAngle) * labelRadius
    const labelY = vertexScreen.y + Math.sin(midAngle) * labelRadius

    ctx.font = `${13 * Math.max(0.7, zoom)}px sans-serif`
    ctx.fontWeight = '600'
    ctx.fillText(formatAngle(angleInfo.angle), labelX - 16, labelY + 4)
    ctx.restore()
  }, [pan.x, pan.y, zoom])

  const drawPreview = useCallback((ctx) => {
    if (!isDrawing || !drawingState) return

    ctx.save()
    ctx.strokeStyle = COLORS.DEFAULT_SHAPE
    ctx.fillStyle = COLORS.DEFAULT_SHAPE
    ctx.setLineDash([5, 5])
    ctx.lineWidth = 2

    switch (drawingState.tool) {
      case TOOL_TYPES.LINE: {
        const s1 = worldToScreen(drawingState.startX, drawingState.startY, pan.x, pan.y, zoom)
        const s2 = worldToScreen(drawingState.endX, drawingState.endY, pan.x, pan.y, zoom)
        ctx.beginPath()
        ctx.moveTo(s1.x, s1.y)
        ctx.lineTo(s2.x, s2.y)
        ctx.stroke()

        ctx.setLineDash([])
        ctx.beginPath()
        ctx.arc(s1.x, s1.y, POINT_RADIUS, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = COLORS.LABEL
        ctx.font = `${12 * Math.max(0.7, zoom)}px sans-serif`
        ctx.fillText(`(${formatCoordinate(drawingState.startX)}, ${formatCoordinate(drawingState.startY)})`, s1.x + 10, s1.y - 8)
        ctx.fillText(`(${formatCoordinate(drawingState.endX)}, ${formatCoordinate(drawingState.endY)})`, s2.x + 10, s2.y - 8)

        const len = distance(drawingState.startX, drawingState.startY, drawingState.endX, drawingState.endY)
        const midX = (s1.x + s2.x) / 2
        const midY = (s1.y + s2.y) / 2
        ctx.fillStyle = COLORS.LABEL
        ctx.fillText(formatLength(len), midX + 8, midY - 6)
        break
      }
      case TOOL_TYPES.CIRCLE: {
        const center = worldToScreen(drawingState.cx, drawingState.cy, pan.x, pan.y, zoom)
        const rScreen = drawingState.r * zoom
        ctx.beginPath()
        ctx.arc(center.x, center.y, rScreen, 0, Math.PI * 2)
        ctx.stroke()

        ctx.setLineDash([])
        ctx.beginPath()
        ctx.arc(center.x, center.y, POINT_RADIUS, 0, Math.PI * 2)
        ctx.fill()

        const radiusEndScreen = worldToScreen(drawingState.cx + drawingState.r, drawingState.cy, pan.x, pan.y, zoom)
        ctx.setLineDash([4, 2])
        ctx.beginPath()
        ctx.moveTo(center.x, center.y)
        ctx.lineTo(radiusEndScreen.x, radiusEndScreen.y)
        ctx.stroke()

        ctx.setLineDash([])
        ctx.fillStyle = COLORS.LABEL
        ctx.font = `${12 * Math.max(0.7, zoom)}px sans-serif`
        ctx.fillText(`(${formatCoordinate(drawingState.cx)}, ${formatCoordinate(drawingState.cy)})`, center.x + 10, center.y - 10)
        ctx.fillText(`r=${formatLength(drawingState.r)}`, radiusEndScreen.x + 6, radiusEndScreen.y - 6)
        break
      }
    }
    ctx.restore()
  }, [isDrawing, drawingState, pan.x, pan.y, zoom])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, rect.width, rect.height)

    drawGrid(ctx)
    shapes.forEach((shape) => {
      drawShape(ctx, shape, selectedShapeIds.includes(shape.id))
    })
    drawAngleMeasurement(ctx)
    drawPreview(ctx)
  }, [shapes, selectedShapeIds, zoom, pan, isDrawing, drawingState, drawGrid, drawShape, drawAngleMeasurement, drawPreview])

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

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top

    if (e.button === 1 || isSpacePressed) {
      setIsPanning(true)
      panStartRef.current = { x: sx - pan.x, y: sy - pan.y }
      return
    }

    const world = screenToWorld(sx, sy, pan.x, pan.y, zoom)

    if (currentTool === TOOL_TYPES.POINT) {
      const newPoint = createPoint(world.x, world.y)
      setShapes((prev) => addShape(prev, newPoint))
      setSelectedShapeIds([newPoint.id])
      return
    }

    if (currentTool === TOOL_TYPES.LINE) {
      setIsDrawing(true)
      setDrawingState({
        tool: TOOL_TYPES.LINE,
        startX: world.x,
        startY: world.y,
        endX: world.x,
        endY: world.y,
      })
      return
    }

    if (currentTool === TOOL_TYPES.CIRCLE) {
      setIsDrawing(true)
      setDrawingState({
        tool: TOOL_TYPES.CIRCLE,
        cx: world.x,
        cy: world.y,
        r: 0,
        startX: world.x,
        startY: world.y,
      })
      return
    }

    if (currentTool === TOOL_TYPES.SELECT) {
      const hit = hitTest(shapesRef.current, world.x, world.y, zoom)

      if (hit) {
        if (!e.shiftKey) {
          setSelectedShapeIds([hit.shapeId])
        } else {
          setSelectedShapeIds((prev) => {
            if (prev.includes(hit.shapeId)) {
              return prev.filter((id) => id !== hit.shapeId)
            }
            return [...prev, hit.shapeId]
          })
        }

        if (hit.hitType !== 'body' || selectedShapeIds.includes(hit.shapeId)) {
          const shape = getShapeById(shapesRef.current, hit.shapeId)
          if (shape) {
            setIsDragging(true)
            setDragInfo({
              shapeId: hit.shapeId,
              hitType: hit.hitType,
              startWorldX: world.x,
              startWorldY: world.y,
              shape: { ...shape },
            })
          }
        }
      } else {
        if (!e.shiftKey) {
          setSelectedShapeIds([])
        }
      }
    }
  }

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top

    if (isPanning) {
      setPan({ x: sx - panStartRef.current.x, y: sy - panStartRef.current.y })
      return
    }

    const world = screenToWorld(sx, sy, pan.x, pan.y, zoom)

    if (isDrawing && drawingState) {
      if (drawingState.tool === TOOL_TYPES.LINE) {
        setDrawingState((prev) => ({ ...prev, endX: world.x, endY: world.y }))
      } else if (drawingState.tool === TOOL_TYPES.CIRCLE) {
        const r = distance(drawingState.cx, drawingState.cy, world.x, world.y)
        setDrawingState((prev) => ({ ...prev, r }))
      }
      return
    }

    if (isDragging && dragInfo) {
      const dx = world.x - dragInfo.startWorldX
      const dy = world.y - dragInfo.startWorldY

      let updates = {}
      const shape = dragInfo.shape

      switch (shape.type) {
        case SHAPE_TYPES.POINT:
          updates = { x: shape.x + dx, y: shape.y + dy }
          break
        case SHAPE_TYPES.LINE:
          if (dragInfo.hitType === 'endpoint1') {
            updates = { x1: shape.x1 + dx, y1: shape.y1 + dy }
          } else if (dragInfo.hitType === 'endpoint2') {
            updates = { x2: shape.x2 + dx, y2: shape.y2 + dy }
          } else {
            updates = {
              x1: shape.x1 + dx, y1: shape.y1 + dy,
              x2: shape.x2 + dx, y2: shape.y2 + dy,
            }
          }
          break
        case SHAPE_TYPES.CIRCLE:
          if (dragInfo.hitType === 'radius') {
            const newRadius = Math.max(1, distance(shape.cx, shape.cy, world.x, world.y))
            updates = { r: newRadius }
          } else if (dragInfo.hitType === 'center' || dragInfo.hitType === 'body') {
            updates = { cx: shape.cx + dx, cy: shape.cy + dy }
          }
          break
      }

      setShapes((prev) => updateShape(prev, dragInfo.shapeId, updates))
      return
    }
  }

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
      return
    }

    if (isDrawing && drawingState) {
      if (drawingState.tool === TOOL_TYPES.LINE) {
        const len = distance(drawingState.startX, drawingState.startY, drawingState.endX, drawingState.endY)
        if (len > 2) {
          const newLine = createLine(drawingState.startX, drawingState.startY, drawingState.endX, drawingState.endY)
          setShapes((prev) => addShape(prev, newLine))
          setSelectedShapeIds([newLine.id])
        }
      } else if (drawingState.tool === TOOL_TYPES.CIRCLE) {
        if (drawingState.r > 2) {
          const newCircle = createCircle(drawingState.cx, drawingState.cy, drawingState.r)
          setShapes((prev) => addShape(prev, newCircle))
          setSelectedShapeIds([newCircle.id])
        }
      }
      setIsDrawing(false)
      setDrawingState(null)
      return
    }

    if (isDragging) {
      setIsDragging(false)
      setDragInfo(null)
    }
  }

  const handleMouseLeave = () => {
    if (isPanning) setIsPanning(false)
    if (isDragging) {
      setIsDragging(false)
      setDragInfo(null)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key === ' ') {
        setIsSpacePressed(true)
        e.preventDefault()
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedShapeIds.length > 0) {
          setShapes((prev) => removeShapes(prev, selectedShapeIds))
          setSelectedShapeIds([])
        }
      }

      if (e.key === 'Escape') {
        setSelectedShapeIds([])
        setIsDrawing(false)
        setDrawingState(null)
        setIsDragging(false)
        setDragInfo(null)
      }

      if (e.key === 'v' || e.key === 'V') setCurrentTool(TOOL_TYPES.SELECT)
      if (e.key === 'p' || e.key === 'P') setCurrentTool(TOOL_TYPES.POINT)
      if (e.key === 'l' || e.key === 'L') setCurrentTool(TOOL_TYPES.LINE)
      if (e.key === 'c' || e.key === 'C') setCurrentTool(TOOL_TYPES.CIRCLE)
    }

    const handleKeyUp = (e) => {
      if (e.key === ' ') setIsSpacePressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedShapeIds])

  const handleFitToView = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const { panX, panY, zoom: newZoom } = fitToView(shapes, rect.width, rect.height, 80)
      setPan({ x: panX, y: panY })
      setZoom(newZoom)
    }
  }

  const handleResetView = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const { panX, panY, zoom: newZoom } = resetView(rect.width, rect.height)
      setPan({ x: panX, y: panY })
      setZoom(newZoom)
    }
  }

  const handleClearAll = () => {
    setShapes([])
    setSelectedShapeIds([])
    setShowClearConfirm(false)
  }

  const handleExportSvg = () => {
    setShowExportModal(true)
  }

  const handleDownloadSvg = () => {
    const svgContent = exportToSvg(shapes, 1200, 900)
    downloadSvg(svgContent, `geometry-board-${Date.now()}.svg`)
  }

  const handleCopySvg = async () => {
    const svgContent = exportToSvg(shapes, 1200, 900)
    try {
      await navigator.clipboard.writeText(svgContent)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = svgContent
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedShapeIds.length > 0) {
      setShapes((prev) => removeShapes(prev, selectedShapeIds))
      setSelectedShapeIds([])
    }
  }

  const handleSelectShape = (id) => {
    setSelectedShapeIds((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((x) => x !== id) : []
      }
      return [id]
    })
    const shape = getShapeById(shapes, id)
    if (shape && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      let targetX, targetY
      switch (shape.type) {
        case SHAPE_TYPES.POINT:
          targetX = shape.x; targetY = shape.y; break
        case SHAPE_TYPES.LINE:
          targetX = (shape.x1 + shape.x2) / 2; targetY = (shape.y1 + shape.y2) / 2; break
        case SHAPE_TYPES.CIRCLE:
          targetX = shape.cx; targetY = shape.cy; break
        default:
          return
      }
      const screen = worldToScreen(targetX, targetY, pan.x, pan.y, zoom)
      if (screen.x < 50 || screen.x > rect.width - 50 || screen.y < 50 || screen.y > rect.height - 50) {
        const newPanX = rect.width / 2 - targetX * zoom
        const newPanY = rect.height / 2 - targetY * zoom
        setPan({ x: newPanX, y: newPanY })
      }
    }
  }

  const grouped = groupShapesByType(shapes)
  const angleInfo = findAngleMeasurement(shapes, selectedShapeIds)
  const svgContent = showExportModal ? exportToSvg(shapes, 1200, 900) : ''

  return (
    <div className="gb-page">
      <div className="gb-header">
        <button className="gb-back-btn" onClick={() => navigate('/')}>← 返回首页</button>
        <h1 className="gb-title">几何画板</h1>
      </div>

      <div className="gb-toolbar-top">
        <div className="gb-toolbar-left">
          <button
            className={`gb-tool-btn ${currentTool === TOOL_TYPES.SELECT ? 'active' : ''}`}
            onClick={() => setCurrentTool(TOOL_TYPES.SELECT)}
            title="选择 (V)"
          >
            🖱️ 选择
          </button>
          <button
            className={`gb-tool-btn ${currentTool === TOOL_TYPES.POINT ? 'active' : ''}`}
            onClick={() => setCurrentTool(TOOL_TYPES.POINT)}
            title="点 (P)"
          >
            • 点
          </button>
          <button
            className={`gb-tool-btn ${currentTool === TOOL_TYPES.LINE ? 'active' : ''}`}
            onClick={() => setCurrentTool(TOOL_TYPES.LINE)}
            title="线段 (L)"
          >
            ╱ 线段
          </button>
          <button
            className={`gb-tool-btn ${currentTool === TOOL_TYPES.CIRCLE ? 'active' : ''}`}
            onClick={() => setCurrentTool(TOOL_TYPES.CIRCLE)}
            title="圆 (C)"
          >
            ○ 圆
          </button>
        </div>

        <div className="gb-toolbar-center">
          <button className="gb-action-btn" onClick={handleDeleteSelected} disabled={selectedShapeIds.length === 0}>
            🗑️ 删除
          </button>
          <button className="gb-action-btn" onClick={() => setShowClearConfirm(true)} disabled={shapes.length === 0}>
            🧹 清空画布
          </button>
        </div>

        <div className="gb-toolbar-right">
          <button className="gb-action-btn" onClick={handleFitToView}>
            ⤢ 适应全部
          </button>
          <button className="gb-action-btn" onClick={handleResetView}>
            🔄 重置视图
          </button>
          <button className="gb-action-btn gb-action-btn-primary" onClick={handleExportSvg}>
            📤 导出 SVG
          </button>
        </div>
      </div>

      <div className="gb-main">
        <div
          ref={containerRef}
          className="gb-canvas-wrapper"
          style={{ width: canvasSize.width, height: canvasSize.height }}
        >
          {selectedShapeIds.length > 0 && (
            <div className="gb-measurement-info">
              <div className="gb-measurement-title">测量信息</div>
              {selectedShapeIds.map((id) => {
                const shape = getShapeById(shapes, id)
                if (!shape) return null
                if (shape.type === SHAPE_TYPES.POINT) {
                  return (
                    <div key={id} className="gb-measurement-item">
                      点坐标: <span className="gb-measurement-value">({formatCoordinate(shape.x)}, {formatCoordinate(shape.y)})</span>
                    </div>
                  )
                }
                if (shape.type === SHAPE_TYPES.LINE) {
                  return (
                    <div key={id} className="gb-measurement-item">
                      线段长度: <span className="gb-measurement-value">{formatLength(getLineLength(shape))}</span>
                    </div>
                  )
                }
                if (shape.type === SHAPE_TYPES.CIRCLE) {
                  return (
                    <div key={id}>
                      <div className="gb-measurement-item">
                        圆心坐标: <span className="gb-measurement-value">({formatCoordinate(shape.cx)}, {formatCoordinate(shape.cy)})</span>
                      </div>
                      <div className="gb-measurement-item">
                        半径: <span className="gb-measurement-value">{formatLength(getCircleRadius(shape))}</span>
                      </div>
                    </div>
                  )
                }
                return null
              })}
              {angleInfo && (
                <div className="gb-measurement-item">
                  夹角: <span className="gb-measurement-value">{formatAngle(angleInfo.angle)}</span>
                </div>
              )}
            </div>
          )}

          <canvas
            ref={canvasRef}
            className={`gb-canvas ${isPanning ? 'panning' : ''} ${currentTool === TOOL_TYPES.SELECT ? 'select-mode' : ''}`}
            style={{
              cursor: isSpacePressed || isPanning ? 'grab' :
                currentTool === TOOL_TYPES.SELECT ? 'default' : 'crosshair',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
          />

          <div className="gb-zoom-controls">
            <button className="gb-zoom-btn" onClick={() => setZoom(clampZoom(zoom - 0.1))} title="缩小">−</button>
            <div className="gb-zoom-info">{Math.round(zoom * 100)}%</div>
            <button className="gb-zoom-btn" onClick={() => setZoom(clampZoom(zoom + 0.1))} title="放大">+</button>
            <button className="gb-zoom-btn" onClick={handleFitToView} title="适应全部" style={{ fontSize: '14px' }}>⤢</button>
          </div>

          <div className="gb-hint">
            <span>滚轮缩放 · 中键/空格键拖拽平移</span>
            <span>选择两条共端点线段或三个点显示角度</span>
            <span>Delete 删除 · Esc 取消 · 快捷键 V/P/L/C</span>
          </div>
        </div>

        <div className="gb-sidebar">
          <div className="gb-panel">
            <div className="gb-panel-title">图形列表</div>

            <div className="gb-shape-group">
              <div className="gb-shape-group-title">
                <span>• 点</span>
                <span className="gb-shape-group-count">{grouped.points.length}</span>
              </div>
              {grouped.points.length === 0 ? (
                <div className="gb-empty-state">暂无点</div>
              ) : (
                <ul className="gb-shape-list">
                  {grouped.points.map((p, idx) => (
                    <li
                      key={p.id}
                      className={`gb-shape-item ${selectedShapeIds.includes(p.id) ? 'selected' : ''}`}
                      onClick={() => handleSelectShape(p.id)}
                    >
                      <span className="gb-shape-item-name">
                        <span className="gb-shape-item-icon">•</span>
                        点{idx + 1} ({formatCoordinate(p.x)}, {formatCoordinate(p.y)})
                      </span>
                      <button
                        className="gb-shape-item-delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShapes((prev) => removeShape(prev, p.id))
                          setSelectedShapeIds((prev) => prev.filter((id) => id !== p.id))
                        }}
                      >×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="gb-shape-group">
              <div className="gb-shape-group-title">
                <span>╱ 线段</span>
                <span className="gb-shape-group-count">{grouped.lines.length}</span>
              </div>
              {grouped.lines.length === 0 ? (
                <div className="gb-empty-state">暂无线段</div>
              ) : (
                <ul className="gb-shape-list">
                  {grouped.lines.map((l, idx) => (
                    <li
                      key={l.id}
                      className={`gb-shape-item ${selectedShapeIds.includes(l.id) ? 'selected' : ''}`}
                      onClick={() => handleSelectShape(l.id)}
                    >
                      <span className="gb-shape-item-name">
                        <span className="gb-shape-item-icon">╱</span>
                        线段{idx + 1} · {formatLength(getLineLength(l))}
                      </span>
                      <button
                        className="gb-shape-item-delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShapes((prev) => removeShape(prev, l.id))
                          setSelectedShapeIds((prev) => prev.filter((id) => id !== l.id))
                        }}
                      >×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="gb-shape-group">
              <div className="gb-shape-group-title">
                <span>○ 圆</span>
                <span className="gb-shape-group-count">{grouped.circles.length}</span>
              </div>
              {grouped.circles.length === 0 ? (
                <div className="gb-empty-state">暂无圆</div>
              ) : (
                <ul className="gb-shape-list">
                  {grouped.circles.map((c, idx) => (
                    <li
                      key={c.id}
                      className={`gb-shape-item ${selectedShapeIds.includes(c.id) ? 'selected' : ''}`}
                      onClick={() => handleSelectShape(c.id)}
                    >
                      <span className="gb-shape-item-name">
                        <span className="gb-shape-item-icon">○</span>
                        圆{idx + 1} · r={formatLength(getCircleRadius(c))}
                      </span>
                      <button
                        className="gb-shape-item-delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShapes((prev) => removeShape(prev, c.id))
                          setSelectedShapeIds((prev) => prev.filter((id) => id !== c.id))
                        }}
                      >×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {showExportModal && (
        <div className="gb-modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="gb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gb-modal-header">
              <h2 className="gb-modal-title">导出 SVG</h2>
              <button className="gb-modal-close" onClick={() => setShowExportModal(false)}>×</button>
            </div>
            <div className="gb-modal-body">
              <pre className="gb-code-block">{svgContent}</pre>
            </div>
            <div className="gb-modal-footer">
              <button className="gb-action-btn" onClick={handleCopySvg}>📋 复制代码</button>
              <button className="gb-action-btn gb-action-btn-primary" onClick={handleDownloadSvg}>💾 下载 SVG</button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="gb-modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="gb-modal gb-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="gb-modal-header">
              <h2 className="gb-modal-title">确认清空</h2>
              <button className="gb-modal-close" onClick={() => setShowClearConfirm(false)}>×</button>
            </div>
            <div className="gb-modal-body">
              <p className="gb-confirm-text">确定要清空画布上的所有图形吗？此操作无法撤销。</p>
            </div>
            <div className="gb-modal-footer">
              <button className="gb-action-btn" onClick={() => setShowClearConfirm(false)}>取消</button>
              <button className="gb-action-btn gb-action-btn-danger" onClick={handleClearAll}>确认清空</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GeometryBoardPage
