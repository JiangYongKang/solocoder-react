import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    addAnnotation,
    addBrushPoint,
    calculateImageFit,
    canRedo,
    canUndo,
    cloneAnnotations,
    createArrow,
    createBrush,
    createEllipse,
    createRectangle,
    createText,
    findAnnotationAt,
    formatTimestamp,
    generateExportFilename,
    getAnnotationBounds,
    getHandles,
    hitTestHandle,
    moveAnnotation,
    normalizeEllipse,
    normalizeRect,
    pushHistory,
    redo,
    removeAnnotations,
    resizeAnnotation,
    undo,
    updateAnnotation,
    validateImageType
} from './annotatorCore.js'
import {
    ANNOTATION_TYPES,
    ARROW_HEAD_ANGLE,
    ARROW_HEAD_LENGTH,
    DEFAULT_CANVAS_HEIGHT,
    DEFAULT_CANVAS_WIDTH,
    DEFAULT_COLOR,
    DEFAULT_FILL_OPACITY,
    DEFAULT_FONT_SIZE,
    DEFAULT_LINE_WIDTH,
    DEFAULT_RECT_BORDER_RADIUS,
    FILL_OPACITY_OPTIONS,
    FONT_SIZE_OPTIONS,
    HANDLE_SIZE,
    HIT_TOLERANCE,
    LINE_WIDTH_OPTIONS,
    PRESET_COLORS,
    TOOL_TYPES,
} from './constants.js'
import './screenshot-annotator.css'
import {
    deleteSavedAnnotation,
    listSavedAnnotations,
    loadAnnotation,
    renameSavedAnnotation,
    saveAnnotations,
} from './storage.js'

const TOOL_LIST = [
  { type: TOOL_TYPES.SELECT, icon: '↖', label: '选择' },
  { type: TOOL_TYPES.ARROW, icon: '➤', label: '箭头' },
  { type: TOOL_TYPES.RECTANGLE, icon: '▭', label: '矩形' },
  { type: TOOL_TYPES.ELLIPSE, icon: '◯', label: '圆形' },
  { type: TOOL_TYPES.TEXT, icon: 'T', label: '文字' },
  { type: TOOL_TYPES.BRUSH, icon: '✎', label: '画笔' },
]

const loadImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => resolve({ img, dataUrl: e.target.result })
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const loadImageFromDataUrl = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

function ScreenshotAnnotatorPage() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const pasteAreaRef = useRef(null)
  const textInputRef = useRef(null)
  const renameInputRef = useRef(null)

  const [canvasWidth, setCanvasWidth] = useState(DEFAULT_CANVAS_WIDTH)
  const [canvasHeight, setCanvasHeight] = useState(DEFAULT_CANVAS_HEIGHT)
  const [imageData, setImageData] = useState(null)
  const [imageInfo, setImageInfo] = useState(null)
  const [annotations, setAnnotations] = useState([])
  const [history, setHistory] = useState([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [currentTool, setCurrentTool] = useState(TOOL_TYPES.SELECT)
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [lineWidth, setLineWidth] = useState(DEFAULT_LINE_WIDTH)
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [fillOpacity, setFillOpacity] = useState(DEFAULT_FILL_OPACITY)
  const [selectedIds, setSelectedIds] = useState([])
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameId, setRenameId] = useState('')
  const [renameValue, setRenameValue] = useState('')
  const [saveName, setSaveName] = useState('')
  const [savedList, setSavedList] = useState([])
  const [pasteActive, setPasteActive] = useState(false)
  const [draggingTextInput, setDraggingTextInput] = useState(null)
  const [textInputPos, setTextInputPos] = useState(null)
  const [drawingState, setDrawingState] = useState({
    isDrawing: false,
    isDragging: false,
    isResizing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    handleType: null,
    handleAnnId: null,
    dragStart: null,
    previewAnn: null,
    multiSelect: false,
  })
  const dsRef = useRef(drawingState)
  useEffect(() => { dsRef.current = drawingState }, [drawingState])

  const colorRef = useRef(color)
  const lineWidthRef = useRef(lineWidth)
  const fontSizeRef = useRef(fontSize)
  const fillOpacityRef = useRef(fillOpacity)
  const selectedIdsRef = useRef(selectedIds)
  const annotationsRef = useRef(annotations)

  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { lineWidthRef.current = lineWidth }, [lineWidth])
  useEffect(() => { fontSizeRef.current = fontSize }, [fontSize])
  useEffect(() => { fillOpacityRef.current = fillOpacity }, [fillOpacity])
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])
  useEffect(() => { annotationsRef.current = annotations }, [annotations])

  const pushNewHistory = useCallback(
    (newAnns) => {
      const result = pushHistory(history, historyIndex, newAnns)
      setHistory(result.history)
      setHistoryIndex(result.historyIndex)
    },
    [history, historyIndex]
  )

  const handleImageLoaded = useCallback(
    async (img, dataUrl) => {
      const info = calculateImageFit(img.naturalWidth, img.naturalHeight, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT)
      setImageInfo({
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        ...info,
      })
      setImageData(dataUrl)
      setAnnotations([])
      setHistory([[]])
      setHistoryIndex(0)
      setSelectedIds([])
    },
    []
  )

  const handleFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (!validateImageType(file)) {
        alert('请上传支持的图片格式 (png, jpg, jpeg, gif, webp)')
        return
      }
      try {
        const { img, dataUrl } = await loadImage(file)
        await handleImageLoaded(img, dataUrl)
      } catch {
        alert('图片加载失败')
      }
      e.target.value = ''
    },
    [handleImageLoaded]
  )

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handlePasteAreaClick = useCallback(() => {
    setPasteActive(true)
    pasteAreaRef.current?.focus()
  }, [])

  const handlePaste = useCallback(
    async (e) => {
      if (!e.clipboardData) return
      const items = Array.from(e.clipboardData.items)
      const imageItem = items.find((item) => item.type.startsWith('image/'))
      if (!imageItem) {
        alert('剪贴板中没有图片')
        return
      }
      const file = imageItem.getAsFile()
      if (!file) return
      try {
        const { img, dataUrl } = await loadImage(file)
        await handleImageLoaded(img, dataUrl)
      } catch {
        alert('粘贴图片失败')
      }
    },
    [handleImageLoaded]
  )

  useEffect(() => {
    const onPaste = (e) => {
      if (e.target && e.target.tagName === 'INPUT') return
      if (e.target && e.target.tagName === 'TEXTAREA') return
      if (!imageData) {
        const items = Array.from(e.clipboardData?.items || [])
        const imageItem = items.find((item) => item.type.startsWith('image/'))
        if (imageItem) {
          e.preventDefault()
          handlePaste(e)
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [imageData, handlePaste])

  const getCanvasCoords = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width / (window.devicePixelRatio || 1)),
      y: (e.clientY - rect.top) * (canvas.height / rect.height / (window.devicePixelRatio || 1)),
    }
  }, [])

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasWidth * dpr
    canvas.height = canvasHeight * dpr
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    return ctx
  }, [canvasWidth, canvasHeight])

  const drawRoundedRect = (ctx, x, y, w, h, r) => {
    const radius = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + w - radius, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
    ctx.lineTo(x + w, y + h - radius)
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
    ctx.lineTo(x + radius, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  const drawArrowHead = (ctx, x1, y1, x2, y2, headLen, angleDeg) => {
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const a1 = angle + (Math.PI * (180 - angleDeg)) / 180
    const a2 = angle - (Math.PI * (180 - angleDeg)) / 180
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - headLen * Math.cos(a1), y2 - headLen * Math.sin(a1))
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - headLen * Math.cos(a2), y2 - headLen * Math.sin(a2))
    ctx.stroke()
  }

  const renderAnnotation = useCallback(
    (ctx, ann, isSelected, scale = 1) => {
      ctx.save()
      const colorVal = ann.color || DEFAULT_COLOR
      const lw = ann.lineWidth || DEFAULT_LINE_WIDTH
      ctx.strokeStyle = colorVal
      ctx.lineWidth = lw * scale
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.fillStyle = colorVal

      switch (ann.type) {
        case ANNOTATION_TYPES.ARROW: {
          ctx.beginPath()
          ctx.moveTo(ann.x1, ann.y1)
          ctx.lineTo(ann.x2, ann.y2)
          ctx.stroke()
          drawArrowHead(ctx, ann.x1, ann.y1, ann.x2, ann.y2, ARROW_HEAD_LENGTH * scale, ARROW_HEAD_ANGLE)
          break
        }
        case ANNOTATION_TYPES.RECTANGLE: {
          const r = normalizeRect(ann.x, ann.y, ann.width, ann.height)
          const fo = ann.fillOpacity ?? DEFAULT_FILL_OPACITY
          if (fo > 0) {
            ctx.save()
            ctx.globalAlpha = fo
            ctx.fillStyle = colorVal
            drawRoundedRect(ctx, r.x, r.y, r.width, r.height, (ann.borderRadius || DEFAULT_RECT_BORDER_RADIUS) * scale)
            ctx.fill()
            ctx.restore()
          }
          drawRoundedRect(ctx, r.x, r.y, r.width, r.height, (ann.borderRadius || DEFAULT_RECT_BORDER_RADIUS) * scale)
          ctx.stroke()
          break
        }
        case ANNOTATION_TYPES.ELLIPSE: {
          const e = normalizeEllipse(ann.cx, ann.cy, ann.rx, ann.ry)
          const fo = ann.fillOpacity ?? DEFAULT_FILL_OPACITY
          ctx.beginPath()
          ctx.ellipse(e.cx, e.cy, Math.max(0, e.rx), Math.max(0, e.ry), 0, 0, Math.PI * 2)
          if (fo > 0) {
            ctx.save()
            ctx.globalAlpha = fo
            ctx.fillStyle = colorVal
            ctx.fill()
            ctx.restore()
          }
          ctx.stroke()
          break
        }
        case ANNOTATION_TYPES.TEXT: {
          ctx.fillStyle = colorVal
          ctx.font = `${(ann.fontSize || DEFAULT_FONT_SIZE) * scale}px sans-serif`
          ctx.textBaseline = 'alphabetic'
          ctx.fillText(ann.text || '', ann.x, ann.y)
          if (isSelected) {
            const metrics = ctx.measureText(ann.text || '')
            const fs = (ann.fontSize || DEFAULT_FONT_SIZE) * scale
            ctx.save()
            ctx.strokeStyle = '#409eff'
            ctx.setLineDash([4 * scale, 4 * scale])
            ctx.lineWidth = 1 * scale
            ctx.strokeRect(ann.x - 2 * scale, ann.y - fs + 2 * scale, metrics.width + 4 * scale, fs + 2 * scale)
            ctx.restore()
          }
          break
        }
        case ANNOTATION_TYPES.BRUSH: {
          if (ann.points && ann.points.length > 0) {
            ctx.beginPath()
            ctx.moveTo(ann.points[0].x, ann.points[0].y)
            for (let i = 1; i < ann.points.length; i++) {
              ctx.lineTo(ann.points[i].x, ann.points[i].y)
            }
            ctx.stroke()
          }
          break
        }
      }

      if (isSelected && ann.type !== ANNOTATION_TYPES.TEXT) {
        const bounds = getAnnotationBounds(ann)
        if (bounds) {
          ctx.save()
          ctx.strokeStyle = '#409eff'
          ctx.setLineDash([4 * scale, 4 * scale])
          ctx.lineWidth = 1 * scale
          ctx.fillStyle = 'rgba(64, 158, 255, 0.05)'
          const minX = bounds.x
          const minY = bounds.y
          const maxX = bounds.x + bounds.width
          const maxY = bounds.y + bounds.height
          ctx.fillRect(minX - 2, minY - 2, maxX - minX + 4, maxY - minY + 4)
          ctx.strokeRect(minX - 2, minY - 2, maxX - minX + 4, maxY - minY + 4)
          ctx.restore()
        }
      }
      ctx.restore()
    },
    []
  )

  const renderAll = useCallback(() => {
    const ctx = setupCanvas()
    if (!ctx) return
    const canvas = canvasRef.current

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    if (imageInfo && imageData) {
      const img = canvas._loadedImg
      if (img) {
        ctx.drawImage(img, imageInfo.offsetX, imageInfo.offsetY, imageInfo.drawWidth, imageInfo.drawHeight)
      }
    }

    const all = dsRef.current.previewAnn ? [...annotations, dsRef.current.previewAnn] : annotations
    all.forEach((ann) => {
      renderAnnotation(ctx, ann, selectedIdsRef.current.includes(ann.id))
    })
  }, [canvasWidth, canvasHeight, imageInfo, imageData, annotations, renderAnnotation, setupCanvas])

  useEffect(() => {
    if (!imageData || !canvasRef.current) return
    const cacheImg = canvasRef.current._loadedImg
    if (cacheImg && cacheImg.src === imageData) {
      renderAll()
      return
    }
    loadImageFromDataUrl(imageData).then((img) => {
      if (canvasRef.current) {
        canvasRef.current._loadedImg = img
        renderAll()
      }
    }).catch(() => {})
  }, [imageData, renderAll])

  useEffect(() => {
    renderAll()
  }, [renderAll])

  const handleToolChange = useCallback(
    (type) => {
      setCurrentTool(type)
      if (type !== TOOL_TYPES.SELECT) {
        setSelectedIds([])
      }
      setDraggingTextInput(null)
      setTextInputPos(null)
    },
    []
  )

  const doDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return
    const after = removeAnnotations(annotations, selectedIds)
    setAnnotations(after)
    pushNewHistory(after)
    setSelectedIds([])
  }, [annotations, selectedIds, pushNewHistory])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo(historyIndex)) {
          const res = undo(annotations, history, historyIndex)
          setAnnotations(res.shapes)
          setHistoryIndex(res.historyIndex)
        }
      } else if (ctrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault()
        if (canRedo(history, historyIndex)) {
          const res = redo(annotations, history, historyIndex)
          setAnnotations(res.shapes)
          setHistoryIndex(res.historyIndex)
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault()
        doDeleteSelected()
      } else if (e.key === 'Escape') {
        setSelectedIds([])
        setDraggingTextInput(null)
        setTextInputPos(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [historyIndex, history, annotations, selectedIds, doDeleteSelected])

  const handleUndo = useCallback(() => {
    if (!canUndo(historyIndex)) return
    const res = undo(annotations, history, historyIndex)
    setAnnotations(res.shapes)
    setHistoryIndex(res.historyIndex)
  }, [annotations, history, historyIndex])

  const handleRedo = useCallback(() => {
    if (!canRedo(history, historyIndex)) return
    const res = redo(annotations, history, historyIndex)
    setAnnotations(res.shapes)
    setHistoryIndex(res.historyIndex)
  }, [annotations, history, historyIndex])

  const handleMouseDown = useCallback(
    (e) => {
      if (!imageData || draggingTextInput) return
      const { x, y } = getCanvasCoords(e)
      const shiftPressed = e.shiftKey

      if (currentTool === TOOL_TYPES.SELECT) {
        let handleHit = null
        for (const selId of selectedIds) {
          const ann = annotations.find((a) => a.id === selId)
          if (!ann) continue
          const handles = getHandles(ann)
          const hit = hitTestHandle(handles, x, y)
          if (hit) {
            handleHit = { handle: hit.type, annotationId: selId }
            break
          }
        }
        if (handleHit) {
          setDrawingState({
            isDrawing: false,
            isDragging: false,
            isResizing: true,
            startX: x,
            startY: y,
            currentX: x,
            currentY: y,
            handleType: handleHit.handle,
            handleAnnId: handleHit.annotationId,
            dragStart: null,
            previewAnn: null,
            multiSelect: false,
          })
          e.preventDefault()
          return
        }
        const found = findAnnotationAt(annotations, x, y, HIT_TOLERANCE)
        if (found) {
          let newSelected
          if (shiftPressed) {
            if (selectedIds.includes(found.id)) {
              newSelected = selectedIds.filter((id) => id !== found.id)
            } else {
              newSelected = [...selectedIds, found.id]
            }
          } else if (selectedIds.includes(found.id)) {
            newSelected = [...selectedIds]
          } else {
            newSelected = [found.id]
          }
          setSelectedIds(newSelected)
          const startPositions = newSelected.map((id) => {
            const ann = annotations.find((a) => a.id === id)
            return ann ? { id, ann: cloneAnnotations([ann])[0] } : null
          }).filter(Boolean)
          setDrawingState({
            isDrawing: false,
            isDragging: true,
            isResizing: false,
            startX: x,
            startY: y,
            currentX: x,
            currentY: y,
            handleType: null,
            handleAnnId: null,
            dragStart: { x, y, positions: startPositions },
            previewAnn: null,
            multiSelect: shiftPressed,
          })
          e.preventDefault()
          return
        }
        if (!shiftPressed) {
          setSelectedIds([])
        }
        return
      }

      if (currentTool === TOOL_TYPES.TEXT) {
        setTextInputPos({ x, y })
        setDraggingTextInput({ x, y, fontSize: fontSizeRef.current, color: colorRef.current })
        return
      }

      let preview = null
      const c = colorRef.current
      const lw = lineWidthRef.current
      const fs = fontSizeRef.current
      const fo = fillOpacityRef.current

      switch (currentTool) {
        case TOOL_TYPES.ARROW:
          preview = createArrow(x, y, x, y, c, lw)
          break
        case TOOL_TYPES.RECTANGLE:
          preview = createRectangle(x, y, 0, 0, c, lw, fo, DEFAULT_RECT_BORDER_RADIUS)
          break
        case TOOL_TYPES.ELLIPSE:
          preview = createEllipse(x, y, 0, 0, c, lw, fo)
          break
        case TOOL_TYPES.BRUSH:
          preview = createBrush([{ x, y }], c, lw)
          break
      }
      setDrawingState({
        isDrawing: true,
        isDragging: false,
        isResizing: false,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        handleType: null,
        handleAnnId: null,
        dragStart: null,
        previewAnn: preview,
        multiSelect: false,
      })
    },
    [currentTool, getCanvasCoords, annotations, selectedIds, imageData, draggingTextInput]
  )

  const handleMouseMove = useCallback(
    (e) => {
      const { x, y } = getCanvasCoords(e)
      const ds = dsRef.current
      setDrawingState((prev) => ({ ...prev, currentX: x, currentY: y }))

      if (ds.isDrawing && ds.previewAnn) {
        const ann = ds.previewAnn
        let newPreview = null
        const sx = ds.startX
        const sy = ds.startY
        switch (ann.type) {
          case ANNOTATION_TYPES.ARROW:
            newPreview = { ...ann, x1: sx, y1: sy, x2: x, y2: y }
            break
          case ANNOTATION_TYPES.RECTANGLE:
            newPreview = { ...ann, x: sx, y: sy, width: x - sx, height: y - sy }
            break
          case ANNOTATION_TYPES.ELLIPSE:
            newPreview = { ...ann, cx: (sx + x) / 2, cy: (sy + y) / 2, rx: Math.abs(x - sx) / 2, ry: Math.abs(y - sy) / 2 }
            break
          case ANNOTATION_TYPES.BRUSH:
            newPreview = addBrushPoint(ann, x, y)
            break
        }
        if (newPreview) {
          setDrawingState((prev) => ({ ...prev, previewAnn: newPreview }))
        }
        return
      }

      if (ds.isDragging && ds.dragStart) {
        const dx = x - ds.dragStart.x
        const dy = y - ds.dragStart.y
        if (dx === 0 && dy === 0) return
        const moved = ds.dragStart.positions.map(({ id, ann }) => {
          return { id, updated: moveAnnotation(ann, dx, dy) }
        })
        let newAnns = [...annotationsRef.current]
        moved.forEach(({ id, updated }) => {
          newAnns = updateAnnotation(newAnns, id, updated)
        })
        setAnnotations(newAnns)
        return
      }

      if (ds.isResizing && ds.handleAnnId && ds.handleType) {
        const ann = annotationsRef.current.find((a) => a.id === ds.handleAnnId)
        if (!ann) return
        const dx = x - ds.startX
        const dy = y - ds.startY
        const updated = resizeAnnotation(ann, ds.handleType, dx, dy)
        const newAnns = updateAnnotation(annotationsRef.current, ds.handleAnnId, updated)
        setAnnotations(newAnns)
        return
      }
    },
    [getCanvasCoords]
  )

  const handleMouseUp = useCallback(
    (e) => {
      const ds = dsRef.current

      if (ds.isDrawing && ds.previewAnn) {
        let finished = null
        const ann = ds.previewAnn
        switch (ann.type) {
          case ANNOTATION_TYPES.ARROW: {
            const dx = Math.abs(ann.x2 - ann.x1)
            const dy = Math.abs(ann.y2 - ann.y1)
            if (dx + dy > 3) finished = ann
            break
          }
          case ANNOTATION_TYPES.RECTANGLE: {
            if (Math.abs(ann.width) > 3 && Math.abs(ann.height) > 3) finished = ann
            break
          }
          case ANNOTATION_TYPES.ELLIPSE: {
            if (ann.rx > 1.5 && ann.ry > 1.5) finished = ann
            break
          }
          case ANNOTATION_TYPES.BRUSH: {
            if (ann.points && ann.points.length > 1) finished = ann
            break
          }
        }
        if (finished) {
          const after = addAnnotation(annotations, finished)
          setAnnotations(after)
          pushNewHistory(after)
          if (currentTool === TOOL_TYPES.SELECT) {
            setSelectedIds([finished.id])
          }
        }
        setDrawingState({
          isDrawing: false,
          isDragging: false,
          isResizing: false,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          handleType: null,
          handleAnnId: null,
          dragStart: null,
          previewAnn: null,
          multiSelect: false,
        })
        return
      }

      if (ds.isDragging && ds.dragStart) {
        pushNewHistory(annotations)
        setDrawingState({
          isDrawing: false,
          isDragging: false,
          isResizing: false,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          handleType: null,
          handleAnnId: null,
          dragStart: null,
          previewAnn: null,
          multiSelect: false,
        })
        return
      }

      if (ds.isResizing && ds.handleAnnId) {
        pushNewHistory(annotations)
        setDrawingState({
          isDrawing: false,
          isDragging: false,
          isResizing: false,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          handleType: null,
          handleAnnId: null,
          dragStart: null,
          previewAnn: null,
          multiSelect: false,
        })
        return
      }
    },
    [annotations, currentTool, pushNewHistory]
  )

  const handleTextSubmit = useCallback(
    (text) => {
      const pos = draggingTextInput
      setDraggingTextInput(null)
      setTextInputPos(null)
      if (!text || !pos) return
      const ann = createText(pos.x, pos.y, text, colorRef.current, fontSizeRef.current)
      const after = addAnnotation(annotations, ann)
      setAnnotations(after)
      pushNewHistory(after)
      setTimeout(() => textInputRef.current?.focus(), 50)
    },
    [annotations, draggingTextInput, pushNewHistory]
  )

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = canvasWidth
    exportCanvas.height = canvasHeight
    const ctx = exportCanvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    if (imageInfo && imageData) {
      const img = canvas._loadedImg
      if (img) {
        ctx.drawImage(img, imageInfo.offsetX, imageInfo.offsetY, imageInfo.drawWidth, imageInfo.drawHeight)
      }
    }
    annotations.forEach((ann) => renderAnnotation(ctx, ann, false, 1))
    exportCanvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = generateExportFilename()
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [canvasWidth, canvasHeight, imageInfo, imageData, annotations, renderAnnotation])

  const openSaveModal = useCallback(() => {
    setSaveName(`标注_${formatTimestamp(Date.now())}`)
    setShowSaveModal(true)
  }, [])

  const handleDoSave = useCallback(() => {
    if (!saveName.trim()) {
      alert('请输入标注名称')
      return
    }
    const saved = saveAnnotations(saveName.trim(), annotations, imageData)
    setShowSaveModal(false)
    if (!saved) {
      alert('保存失败，可能是数据过大，请尝试减小图片大小或清理已保存的标注')
    } else {
      setSavedList(listSavedAnnotations())
      alert('保存成功')
    }
  }, [saveName, annotations, imageData])

  const openLoadModal = useCallback(() => {
    setSavedList(listSavedAnnotations())
    setShowLoadModal(true)
  }, [])

  const handleLoadSaved = useCallback(
    async (id) => {
      const data = await loadAnnotation(id)
      if (!data) {
        alert('加载失败')
        return
      }
      if (data.imageDataUrl) {
        try {
          const img = await loadImageFromDataUrl(data.imageDataUrl)
          const info = calculateImageFit(img.naturalWidth, img.naturalHeight, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT)
          setImageInfo({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, ...info })
          setImageData(data.imageDataUrl)
          if (canvasRef.current) canvasRef.current._loadedImg = img
        } catch {
          alert('图片加载失败')
        }
      }
      setAnnotations(data.annotations || [])
      setHistory([data.annotations || []])
      setHistoryIndex(0)
      setSelectedIds([])
      setShowLoadModal(false)
    },
    []
  )

  const handleDeleteSaved = useCallback(
    (id) => {
      if (!confirm('确认删除该标注？')) return
      deleteSavedAnnotation(id)
      setSavedList(listSavedAnnotations())
    },
    []
  )

  const openRenameSaved = useCallback(
    (id, name) => {
      setRenameId(id)
      setRenameValue(name)
      setShowRenameModal(true)
    },
    []
  )

  const handleDoRename = useCallback(() => {
    if (!renameValue.trim()) {
      alert('请输入新名称')
      return
    }
    renameSavedAnnotation(renameId, renameValue.trim())
    setShowRenameModal(false)
    setSavedList(listSavedAnnotations())
  }, [renameId, renameValue])

  const renderHandles = () => {
    if (!imageData) return null
    const items = []
    selectedIds.forEach((id) => {
      const ann = annotations.find((a) => a.id === id)
      if (!ann) return
      const bounds = getAnnotationBounds(ann)
      if (bounds) {
        const minX = bounds.x
        const minY = bounds.y
        const maxX = bounds.x + bounds.width
        const maxY = bounds.y + bounds.height
        items.push(
          <div
            key={`box-${id}`}
            className="sa-selection-box"
            style={{
              left: minX - 2,
              top: minY - 2,
              width: maxX - minX + 4,
              height: maxY - minY + 4,
            }}
          />
        )
      }
      const handles = getHandles(ann)
      handles.forEach((h) => {
        items.push(
          <div
            key={`h-${id}-${h.type}`}
            className={`sa-handle ${h.type}`}
            style={{
              left: h.x,
              top: h.y,
              width: h.size,
              height: h.size,
            }}
          />
        )
      })
    })
    return items
  }

  return (
    <div className="sa-page">
      <div className="sa-header">
        <button className="sa-back-btn" onClick={() => navigate('/')}>
          ← 返回
        </button>
        <h1 className="sa-title">截图标注工具</h1>
      </div>

      <div className="sa-upload-bar">
        <button className="sa-action-btn sa-action-btn-primary" onClick={handleUploadClick}>
          📁 上传图片
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          onChange={handleFileSelect}
          className="sa-hidden-input"
        />
        <div
          ref={pasteAreaRef}
          tabIndex={0}
          className={`sa-upload-area ${pasteActive ? 'active' : ''}`}
          onClick={handlePasteAreaClick}
          onPaste={(e) => { e.preventDefault(); handlePaste(e) }}
        >
          <span className="sa-upload-area-icon">📋</span>
          <span>点击此处后按 Ctrl+V 粘贴图片</span>
        </div>
        {imageData && (
          <button className="sa-action-btn" onClick={handleUploadClick}>
            🔄 上传新图片
          </button>
        )}
      </div>

      <div className="sa-toolbar">
        <div className="sa-toolbar-section">
          <button
            className="sa-tool-btn"
            onClick={handleUndo}
            disabled={!canUndo(historyIndex)}
            title="撤销 (Ctrl+Z)"
          >
            ↶ 撤销
          </button>
          <button
            className="sa-tool-btn"
            onClick={handleRedo}
            disabled={!canRedo(history, historyIndex)}
            title="重做 (Ctrl+Y / Ctrl+Shift+Z)"
          >
            ↷ 重做
          </button>
          <span className="sa-tool-separator" />
          <button
            className={`sa-tool-btn danger`}
            onClick={doDeleteSelected}
            disabled={selectedIds.length === 0}
            title="删除选中元素 (Delete)"
          >
            🗑 删除
          </button>
        </div>

        <div className="sa-toolbar-section sa-style-config">
          <div className="sa-popup">
            <div
              className="sa-style-group"
              onClick={() => setShowColorPicker((v) => !v)}
            >
              <span>颜色</span>
              <div
                className="sa-color-current"
                style={{ background: color }}
              />
            </div>
            {showColorPicker && (
              <div className="sa-color-presets">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    className="sa-color-swatch"
                    style={{ background: c }}
                    onClick={() => { setColor(c); setShowColorPicker(false) }}
                    title={c}
                  />
                ))}
                <input
                  type="color"
                  className="sa-color-input"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="sa-style-group">
            <span>线条</span>
            <select
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              disabled={currentTool === TOOL_TYPES.TEXT || currentTool === TOOL_TYPES.SELECT}
            >
              {LINE_WIDTH_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}px</option>
              ))}
            </select>
          </div>
          <div className="sa-style-group">
            <span>字号</span>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              disabled={currentTool !== TOOL_TYPES.TEXT}
            >
              {FONT_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
          </div>
          <div className="sa-style-group">
            <span>填充</span>
            <select
              value={fillOpacity}
              onChange={(e) => setFillOpacity(Number(e.target.value))}
              disabled={currentTool !== TOOL_TYPES.RECTANGLE && currentTool !== TOOL_TYPES.ELLIPSE}
            >
              {FILL_OPACITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sa-toolbar-section">
          <button
            className="sa-action-btn sa-action-btn-primary"
            onClick={handleExport}
            disabled={!imageData}
          >
            💾 导出图片
          </button>
          <button
            className="sa-action-btn"
            onClick={openSaveModal}
            disabled={!imageData}
          >
            💽 保存标注
          </button>
          <button
            className="sa-action-btn"
            onClick={openLoadModal}
          >
            📂 加载标注
          </button>
        </div>
      </div>

      <div className="sa-main">
        <div className="sa-toolbar-left">
          {TOOL_LIST.map((t) => (
            <button
              key={t.type}
              className={`sa-side-tool ${currentTool === t.type ? 'active' : ''}`}
              onClick={() => handleToolChange(t.type)}
              title={t.label}
            >
              <span className="sa-side-tool-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="sa-canvas-wrapper">
          <div
            className="sa-canvas-container"
            style={{ width: canvasWidth, height: canvasHeight }}
          >
            <canvas
              ref={canvasRef}
              className={`sa-canvas ${currentTool}`}
              style={{ width: canvasWidth, height: canvasHeight }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            {imageData && selectedIds.length > 0 && (
              <div className="sa-selection-overlay">
                {renderHandles()}
              </div>
            )}
            {draggingTextInput && textInputPos && (
              <input
                ref={textInputRef}
                type="text"
                autoFocus
                className="sa-text-input-inline"
                style={{
                  left: textInputPos.x,
                  top: textInputPos.y - draggingTextInput.fontSize,
                  fontSize: `${draggingTextInput.fontSize}px`,
                  color: draggingTextInput.color,
                }}
                placeholder="输入文字后回车"
                onBlur={(e) => handleTextSubmit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleTextSubmit(e.target.value)
                  } else if (e.key === 'Escape') {
                    setDraggingTextInput(null)
                    setTextInputPos(null)
                  }
                }}
              />
            )}
            {imageData && (
              <div className="sa-hint">
                {currentTool === TOOL_TYPES.SELECT ? '点击选中元素 · Shift点击多选 · 拖拽移动 · 手柄调整 · Delete删除' : ''}
                {currentTool === TOOL_TYPES.ARROW ? '拖拽绘制箭头' : ''}
                {currentTool === TOOL_TYPES.RECTANGLE ? '拖拽绘制矩形' : ''}
                {currentTool === TOOL_TYPES.ELLIPSE ? '拖拽绘制椭圆' : ''}
                {currentTool === TOOL_TYPES.TEXT ? '点击画布位置添加文字' : ''}
                {currentTool === TOOL_TYPES.BRUSH ? '拖拽自由绘制' : ''}
              </div>
            )}
            {!imageData && (
              <div className="sa-upload-zone" onClick={handleUploadClick}>
                <div className="sa-upload-zone-icon">🖼️</div>
                <div className="sa-upload-zone-text">上传或粘贴图片开始标注</div>
                <div className="sa-upload-zone-hint">点击上方「上传图片」或在页面按 Ctrl+V 粘贴截图</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="sa-modal-mask" onClick={() => setShowSaveModal(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sa-modal-title">保存标注</h3>
            <div className="sa-modal-body">
              <div className="sa-form-row">
                <label>标注名称</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="输入标注名称"
                  ref={(el) => el && setTimeout(() => el.focus(), 30)}
                />
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                当前包含 {annotations.length} 个标注元素
              </div>
            </div>
            <div className="sa-modal-actions">
              <button className="sa-action-btn" onClick={() => setShowSaveModal(false)}>取消</button>
              <button className="sa-action-btn sa-action-btn-primary" onClick={handleDoSave}>确定保存</button>
            </div>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div className="sa-modal-mask" onClick={() => setShowLoadModal(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sa-modal-title">加载已保存的标注</h3>
            <div className="sa-modal-body">
              {savedList.length === 0 ? (
                <div className="sa-empty">暂无保存的标注数据</div>
              ) : (
                <div className="sa-save-list">
                  {savedList.map((item) => (
                    <div
                      key={item.id}
                      className="sa-save-item"
                      onClick={() => handleLoadSaved(item.id)}
                    >
                      <div className="sa-save-info">
                        <div className="sa-save-name">{item.name}</div>
                        <div className="sa-save-meta">
                          <span>{formatTimestamp(item.updatedAt || item.createdAt)}</span>
                          <span>{item.annotationsCount || 0} 个元素</span>
                        </div>
                      </div>
                      <div className="sa-save-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleLoadSaved(item.id)}
                          title="加载"
                        >
                          加载
                        </button>
                        <button
                          onClick={() => openRenameSaved(item.id, item.name)}
                          title="重命名"
                        >
                          重命名
                        </button>
                        <button
                          className="sa-save-delete"
                          onClick={() => handleDeleteSaved(item.id)}
                          title="删除"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="sa-modal-actions">
              <button className="sa-action-btn" onClick={() => setShowLoadModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showRenameModal && (
        <div className="sa-modal-mask" onClick={() => setShowRenameModal(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sa-modal-title">重命名标注</h3>
            <div className="sa-modal-body">
              <div className="sa-form-row">
                <label>新名称</label>
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                />
              </div>
            </div>
            <div className="sa-modal-actions">
              <button className="sa-action-btn" onClick={() => setShowRenameModal(false)}>取消</button>
              <button className="sa-action-btn sa-action-btn-primary" onClick={handleDoRename}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScreenshotAnnotatorPage
