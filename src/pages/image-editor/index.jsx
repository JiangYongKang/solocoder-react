import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './image-editor.css'
import {
  TOOL_TYPES,
  CROP_RATIOS,
  DEFAULT_FILTERS,
  FILTER_RANGES,
  EXPORT_FORMATS,
  EXPORT_FORMAT_NAMES,
  DEFAULT_FONT_SIZE,
  DEFAULT_BRUSH_SIZE,
  DEFAULT_COLOR,
  PRESET_COLORS,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  MIN_BRUSH_SIZE,
  MAX_BRUSH_SIZE,
} from './constants.js'
import {
  clamp,
  clampFilters,
  resetFilters,
  areFiltersDefault,
  validateImageType,
  getImageFileExtension,
  fileToDataUrl,
  loadImage,
  calculateFitScale,
  screenToImageCoords,
  imageToScreenCoords,
  applyFiltersToData,
  rotateImage90CW,
  rotateImage90CCW,
  rotateImageFree,
  flipImageHorizontal,
  flipImageVertical,
  cropImage,
  normalizeCropRect,
  applyRatioToCrop,
  createTextAnnotation,
  createBrushAnnotation,
  addAnnotation,
  updateAnnotation,
  addBrushPoint,
  findTextAnnotationAtPoint,
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
  canUndo,
  canRedo,
  getExportFileName,
  isValidColor,
  clampBrushSize,
  clampFontSize,
  clampQuality,
  getRatioByType,
} from './imageEditorCore.js'

function ImageEditorPage() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const textInputRef = useRef(null)
  const canvasWrapperRef = useRef(null)

  const [originalImage, setOriginalImage] = useState(null)
  const [originalImageSrc, setOriginalImageSrc] = useState('')
  const [baseCanvas, setBaseCanvas] = useState(null)
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS })
  const [currentTool, setCurrentTool] = useState(TOOL_TYPES.NONE)
  const [cropRatio, setCropRatio] = useState(CROP_RATIOS.FREE)
  const [cropRect, setCropRect] = useState(null)
  const [isCropping, setIsCropping] = useState(false)
  const [cropStart, setCropStart] = useState(null)
  const [cropDragMode, setCropDragMode] = useState(null)
  const [cropDragStart, setCropDragStart] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [annotations, setAnnotations] = useState([])
  const [isDrawingBrush, setIsDrawingBrush] = useState(false)
  const [currentBrush, setCurrentBrush] = useState(null)
  const [brushColor, setBrushColor] = useState(DEFAULT_COLOR)
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE)
  const [textColor, setTextColor] = useState(DEFAULT_COLOR)
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [editingTextId, setEditingTextId] = useState(null)
  const [editingTextValue, setEditingTextValue] = useState('')
  const [editingTextPos, setEditingTextPos] = useState(null)
  const [draggingTextId, setDraggingTextId] = useState(null)
  const [dragTextOffset, setDragTextOffset] = useState({ x: 0, y: 0 })
  const [isComparing, setIsComparing] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState(EXPORT_FORMATS.PNG)
  const [exportQuality, setExportQuality] = useState(90)
  const [history, setHistory] = useState(createHistory())
  const [imageName, setImageName] = useState('image')
  const [displayInfo, setDisplayInfo] = useState({ scale: 1, offsetX: 0, offsetY: 0, displayWidth: 0, displayHeight: 0 })
  const [showColorPickerBrush, setShowColorPickerBrush] = useState(false)
  const [showColorPickerText, setShowColorPickerText] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const filtersRef = useRef(filters)
  const annotationsRef = useRef(annotations)
  const rotationRef = useRef(rotation)
  const displayInfoRef = useRef(displayInfo)
  const baseCanvasRef = useRef(baseCanvas)

  useEffect(() => { filtersRef.current = filters }, [filters])
  useEffect(() => { annotationsRef.current = annotations }, [annotations])
  useEffect(() => { rotationRef.current = rotation }, [rotation])
  useEffect(() => { displayInfoRef.current = displayInfo }, [displayInfo])
  useEffect(() => { baseCanvasRef.current = baseCanvas }, [baseCanvas])

  const snapshotState = useCallback(() => {
    if (!baseCanvasRef.current) return null
    const snapshotCanvas = document.createElement('canvas')
    snapshotCanvas.width = baseCanvasRef.current.width
    snapshotCanvas.height = baseCanvasRef.current.height
    snapshotCanvas.getContext('2d').drawImage(baseCanvasRef.current, 0, 0)
    return {
      canvas: snapshotCanvas,
      filters: { ...filtersRef.current },
      annotations: annotationsRef.current.map((a) =>
        a.type === 'brush'
          ? { ...a, points: a.points.map((p) => ({ ...p })) }
          : { ...a }
      ),
      rotation: rotationRef.current,
    }
  }, [])

  const saveHistory = useCallback(() => {
    const snapshot = snapshotState()
    if (snapshot) {
      setHistory((h) => pushHistory(h, snapshot))
    }
  }, [snapshotState])

  const restoreSnapshot = useCallback((snapshot) => {
    if (!snapshot) return
    const newBase = document.createElement('canvas')
    newBase.width = snapshot.canvas.width
    newBase.height = snapshot.canvas.height
    newBase.getContext('2d').drawImage(snapshot.canvas, 0, 0)
    setBaseCanvas(newBase)
    setFilters({ ...snapshot.filters })
    setAnnotations(snapshot.annotations.map((a) =>
      a.type === 'brush'
        ? { ...a, points: a.points.map((p) => ({ ...p })) }
        : { ...a }
    ))
    setRotation(snapshot.rotation)
  }, [])

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (!canUndo(h)) return h
      const result = undoHistory(h)
      restoreSnapshot(result.present)
      return result
    })
  }, [restoreSnapshot])

  const handleRedo = useCallback(() => {
    setHistory((h) => {
      if (!canRedo(h)) return h
      const result = redoHistory(h)
      restoreSnapshot(result.present)
      return result
    })
  }, [restoreSnapshot])

  const handleImageUpload = useCallback(async (file) => {
    if (!validateImageType(file)) {
      alert('不支持的图片格式，仅支持 PNG、JPG、WebP')
      return
    }
    try {
      const dataUrl = await fileToDataUrl(file)
      const img = await loadImage(dataUrl)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      setOriginalImage(img)
      setOriginalImageSrc(dataUrl)
      setBaseCanvas(canvas)
      setFilters({ ...DEFAULT_FILTERS })
      setRotation(0)
      setAnnotations([])
      setCurrentTool(TOOL_TYPES.NONE)
      setCropRect(null)
      setIsCropping(false)
      setImageName(file.name.replace(/\.[^.]+$/, '') || 'image')
      const snapshot = {
        canvas,
        filters: { ...DEFAULT_FILTERS },
        annotations: [],
        rotation: 0,
      }
      const snapCanvas = document.createElement('canvas')
      snapCanvas.width = canvas.width
      snapCanvas.height = canvas.height
      snapCanvas.getContext('2d').drawImage(canvas, 0, 0)
      setHistory(createHistory())
      setHistory((h) => pushHistory(h, {
        canvas: snapCanvas,
        filters: { ...DEFAULT_FILTERS },
        annotations: [],
        rotation: 0,
      }))
    } catch (err) {
      alert(err.message || '加载图片失败')
    }
  }, [])

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file)
    e.target.value = ''
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleImageUpload(file)
  }, [handleImageUpload])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const wrapper = canvasWrapperRef.current
    if (!canvas || !wrapper || !baseCanvas) return
    const wrapperRect = wrapper.getBoundingClientRect()
    const info = calculateFitScale(baseCanvas.width, baseCanvas.height, wrapperRect.width - 40, wrapperRect.height - 40)
    setDisplayInfo(info)
    const dpr = window.devicePixelRatio || 1
    canvas.width = info.displayWidth * dpr
    canvas.height = info.displayHeight * dpr
    canvas.style.width = `${info.displayWidth}px`
    canvas.style.height = `${info.displayHeight}px`
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, info.displayWidth, info.displayHeight)
    const sourceCanvas = isComparing && originalImage ? (() => {
      const c = document.createElement('canvas')
      c.width = originalImage.width
      c.height = originalImage.height
      c.getContext('2d').drawImage(originalImage, 0, 0)
      return c
    })() : baseCanvas
    const currentFilters = isComparing ? { ...DEFAULT_FILTERS } : filtersRef.current
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = sourceCanvas.width
    tempCanvas.height = sourceCanvas.height
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.drawImage(sourceCanvas, 0, 0)
    if (!areFiltersDefault(currentFilters)) {
      const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      const filtered = applyFiltersToData(imgData, currentFilters)
      if (currentFilters.blur > 0) {
        tempCtx.filter = `blur(${currentFilters.blur}px)`
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.putImageData(filtered, 0, 0)
        const blurred = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.filter = 'none'
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.putImageData(blurred, 0, 0)
      } else {
        tempCtx.putImageData(filtered, 0, 0)
      }
    } else if (currentFilters.blur > 0) {
      tempCtx.filter = `blur(${currentFilters.blur}px)`
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
      tempCtx.drawImage(sourceCanvas, 0, 0)
      tempCtx.filter = 'none'
    }
    ctx.drawImage(tempCanvas, 0, 0, info.displayWidth, info.displayHeight)
    const displayAnns = isComparing ? [] : annotationsRef.current
    displayAnns.forEach((ann) => {
      if (ann.type === 'text') {
        const screenPos = imageToScreenCoords(ann.x, ann.y, 0, 0, info.scale)
        ctx.fillStyle = ann.color
        ctx.font = `${ann.fontSize * info.scale}px sans-serif`
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(ann.text || '', screenPos.x, screenPos.y)
      } else if (ann.type === 'brush' && ann.points.length > 1) {
        ctx.strokeStyle = ann.color
        ctx.lineWidth = ann.lineWidth * info.scale
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        const firstPoint = imageToScreenCoords(ann.points[0].x, ann.points[0].y, 0, 0, info.scale)
        ctx.moveTo(firstPoint.x, firstPoint.y)
        for (let i = 1; i < ann.points.length; i++) {
          const p = imageToScreenCoords(ann.points[i].x, ann.points[i].y, 0, 0, info.scale)
          ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()
      }
    })
    if (currentBrush) {
      ctx.strokeStyle = brushColor
      ctx.lineWidth = brushSize * info.scale
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      const firstPoint = imageToScreenCoords(currentBrush.points[0].x, currentBrush.points[0].y, 0, 0, info.scale)
      ctx.moveTo(firstPoint.x, firstPoint.y)
      for (let i = 1; i < currentBrush.points.length; i++) {
        const p = imageToScreenCoords(currentBrush.points[i].x, currentBrush.points[i].y, 0, 0, info.scale)
        ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
    }
  }, [baseCanvas, originalImage, isComparing, currentBrush, brushColor, brushSize])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  useEffect(() => {
    if (!baseCanvas) return
    const handleResize = () => renderCanvas()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [baseCanvas, renderCanvas])

  const handleFilterChange = (key, value) => {
    const newFilters = clampFilters({ ...filters, [key]: Number(value) })
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    const newFilters = resetFilters()
    setFilters(newFilters)
    saveHistory()
  }

  const applyTransformToCanvas = (transformFn) => {
    if (!baseCanvas) return
    const newCanvas = transformFn(baseCanvas)
    setBaseCanvas(newCanvas)
    setRotation(0)
    saveHistory()
  }

  const handleRotateCW = () => applyTransformToCanvas(rotateImage90CW)
  const handleRotateCCW = () => applyTransformToCanvas(rotateImage90CCW)
  const handleFlipH = () => applyTransformToCanvas(flipImageHorizontal)
  const handleFlipV = () => applyTransformToCanvas(flipImageVertical)

  const handleFreeRotate = (deg) => {
    const d = clamp(Number(deg), -180, 180)
    setRotation(d)
  }

  const applyFreeRotation = () => {
    if (rotation === 0 || !baseCanvas) return
    applyTransformToCanvas((c) => rotateImageFree(c, rotation))
  }

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top,
    }
  }

  const handleCanvasMouseDown = (e) => {
    if (!baseCanvas) return
    const coords = getCanvasCoords(e)
    if (!coords) return
    const info = displayInfoRef.current
    const imgCoords = screenToImageCoords(coords.screenX, coords.screenY, 0, 0, info.scale)

    if (currentTool === TOOL_TYPES.CROP) {
      if (!cropRect) {
        setIsCropping(true)
        setCropStart({ x: imgCoords.x, y: imgCoords.y })
        setCropRect({ x: imgCoords.x, y: imgCoords.y, width: 0, height: 0 })
      } else {
        const handles = getCropHandles(cropRect, info.scale)
        let hitHandle = null
        for (const [name, hx, hy] of handles) {
          const dist = Math.sqrt((coords.screenX - hx) ** 2 + (coords.screenY - hy) ** 2)
          if (dist < 10) { hitHandle = name; break }
        }
        const inBox = coords.screenX >= info.scale * cropRect.x &&
          coords.screenX <= info.scale * (cropRect.x + cropRect.width) &&
          coords.screenY >= info.scale * cropRect.y &&
          coords.screenY <= info.scale * (cropRect.y + cropRect.height)
        if (hitHandle) {
          setCropDragMode(hitHandle)
          setCropDragStart({ ...coords, rect: { ...cropRect } })
        } else if (inBox) {
          setCropDragMode('move')
          setCropDragStart({ ...coords, rect: { ...cropRect }, startImg: { ...imgCoords } })
        } else {
          setIsCropping(true)
          setCropStart({ x: imgCoords.x, y: imgCoords.y })
          setCropRect({ x: imgCoords.x, y: imgCoords.y, width: 0, height: 0 })
        }
      }
      return
    }

    if (currentTool === TOOL_TYPES.TEXT) {
      const existing = findTextAnnotationAtPoint(annotationsRef.current, imgCoords.x, imgCoords.y)
      if (existing) {
        setDraggingTextId(existing.id)
        setDragTextOffset({ x: imgCoords.x - existing.x, y: imgCoords.y - existing.y })
      } else {
        setEditingTextId(null)
        const screenPos = imageToScreenCoords(imgCoords.x, imgCoords.y, 0, 0, info.scale)
        setEditingTextPos(screenPos)
        setEditingTextValue('')
        setTimeout(() => {
          if (textInputRef.current) {
            textInputRef.current.focus()
          }
        }, 0)
      }
      return
    }

    if (currentTool === TOOL_TYPES.BRUSH) {
      setIsDrawingBrush(true)
      setCurrentBrush(createBrushAnnotation([imgCoords], brushColor, brushSize))
      return
    }
  }

  const getCropHandles = (rect, scale) => {
    const x = rect.x * scale
    const y = rect.y * scale
    const w = rect.width * scale
    const h = rect.height * scale
    return [
      ['nw', x, y],
      ['n', x + w / 2, y],
      ['ne', x + w, y],
      ['e', x + w, y + h / 2],
      ['se', x + w, y + h],
      ['s', x + w / 2, y + h],
      ['sw', x, y + h],
      ['w', x, y + h / 2],
    ]
  }

  const handleCanvasMouseMove = (e) => {
    if (!baseCanvas) return
    const coords = getCanvasCoords(e)
    if (!coords) return
    const info = displayInfoRef.current
    const imgCoords = screenToImageCoords(coords.screenX, coords.screenY, 0, 0, info.scale)

    if (isCropping && cropStart) {
      const ratio = getRatioByType(cropRatio)
      const rect = applyRatioToCrop(
        cropStart.x, cropStart.y,
        clamp(imgCoords.x, 0, baseCanvas.width),
        clamp(imgCoords.y, 0, baseCanvas.height),
        ratio, baseCanvas.width, baseCanvas.height
      )
      setCropRect(rect)
      return
    }

    if (cropDragMode && cropDragStart) {
      const dxImg = (coords.screenX - cropDragStart.screenX) / info.scale
      const dyImg = (coords.screenY - cropDragStart.screenY) / info.scale
      const orig = cropDragStart.rect
      let newRect = { ...orig }
      const ratio = getRatioByType(cropRatio)
      if (cropDragMode === 'move') {
        newRect.x = clamp(orig.x + dxImg, 0, baseCanvas.width - orig.width)
        newRect.y = clamp(orig.y + dyImg, 0, baseCanvas.height - orig.height)
      } else {
        let x1 = orig.x, y1 = orig.y, x2 = orig.x + orig.width, y2 = orig.y + orig.height
        if (cropDragMode.includes('e')) x2 = clamp(orig.x + orig.width + dxImg, 0, baseCanvas.width)
        if (cropDragMode.includes('w')) x1 = clamp(orig.x + dxImg, 0, baseCanvas.width)
        if (cropDragMode.includes('s')) y2 = clamp(orig.y + orig.height + dyImg, 0, baseCanvas.height)
        if (cropDragMode.includes('n')) y1 = clamp(orig.y + dyImg, 0, baseCanvas.height)
        newRect = applyRatioToCrop(x1, y1, x2, y2, ratio, baseCanvas.width, baseCanvas.height)
      }
      setCropRect(newRect)
      return
    }

    if (draggingTextId) {
      setAnnotations((prev) => updateAnnotation(prev, draggingTextId, {
        x: clamp(imgCoords.x - dragTextOffset.x, 0, baseCanvas.width),
        y: clamp(imgCoords.y - dragTextOffset.y, 0, baseCanvas.height),
      }))
      return
    }

    if (isDrawingBrush && currentBrush) {
      setCurrentBrush(addBrushPoint(currentBrush, imgCoords))
      return
    }
  }

  const handleCanvasMouseUp = () => {
    if (isCropping) {
      setIsCropping(false)
      setCropStart(null)
      if (cropRect && cropRect.width < 10 && cropRect.height < 10) {
        setCropRect(null)
      }
    }
    if (cropDragMode) {
      setCropDragMode(null)
      setCropDragStart(null)
    }
    if (draggingTextId) {
      setDraggingTextId(null)
      saveHistory()
    }
    if (isDrawingBrush && currentBrush) {
      if (currentBrush.points.length > 1) {
        setAnnotations((prev) => addAnnotation(prev, currentBrush))
        saveHistory()
      }
      setIsDrawingBrush(false)
      setCurrentBrush(null)
    }
  }

  const handleConfirmCrop = () => {
    if (!baseCanvas || !cropRect) return
    const newCanvas = cropImage(baseCanvas, cropRect.x, cropRect.y, cropRect.width, cropRect.height)
    setBaseCanvas(newCanvas)
    setCropRect(null)
    setCurrentTool(TOOL_TYPES.NONE)
    setAnnotations([])
    saveHistory()
  }

  const handleCancelCrop = () => {
    setCropRect(null)
    setCurrentTool(TOOL_TYPES.NONE)
  }

  const handleTextInputChange = (e) => {
    setEditingTextValue(e.target.value)
  }

  const handleTextInputBlur = () => {
    if (editingTextValue.trim()) {
      const info = displayInfoRef.current
      const pos = editingTextPos
      if (pos) {
        const imgCoords = screenToImageCoords(pos.x, pos.y, 0, 0, info.scale)
        const textAnn = createTextAnnotation(imgCoords.x, imgCoords.y, editingTextValue, textColor, fontSize)
        setAnnotations((prev) => addAnnotation(prev, textAnn))
        saveHistory()
      }
    }
    setEditingTextId(null)
    setEditingTextValue('')
    setEditingTextPos(null)
  }

  const handleTextInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextInputBlur()
    }
    if (e.key === 'Escape') {
      setEditingTextId(null)
      setEditingTextValue('')
      setEditingTextPos(null)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
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
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  const handleExport = () => {
    if (!baseCanvas) return
    setShowExportDialog(true)
  }

  const doExport = () => {
    if (!baseCanvas) return
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = baseCanvas.width
    exportCanvas.height = baseCanvas.height
    const ctx = exportCanvas.getContext('2d')
    if (!areFiltersDefault(filters)) {
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = baseCanvas.width
      tempCanvas.height = baseCanvas.height
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.drawImage(baseCanvas, 0, 0)
      const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      const filtered = applyFiltersToData(imgData, filters)
      if (filters.blur > 0) {
        tempCtx.filter = `blur(${filters.blur}px)`
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.putImageData(filtered, 0, 0)
        const blurred = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.filter = 'none'
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.putImageData(blurred, 0, 0)
      } else {
        tempCtx.putImageData(filtered, 0, 0)
      }
      ctx.drawImage(tempCanvas, 0, 0)
    } else {
      ctx.drawImage(baseCanvas, 0, 0)
      if (filters.blur > 0) {
        ctx.filter = `blur(${filters.blur}px)`
        ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height)
        ctx.drawImage(baseCanvas, 0, 0)
        ctx.filter = 'none'
      }
    }
    annotations.forEach((ann) => {
      if (ann.type === 'text') {
        ctx.fillStyle = ann.color
        ctx.font = `${ann.fontSize}px sans-serif`
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(ann.text || '', ann.x, ann.y)
      } else if (ann.type === 'brush' && ann.points.length > 1) {
        ctx.strokeStyle = ann.color
        ctx.lineWidth = ann.lineWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(ann.points[0].x, ann.points[0].y)
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y)
        }
        ctx.stroke()
      }
    })
    const quality = exportFormat === EXPORT_FORMATS.JPEG ? clampQuality(exportQuality) : undefined
    const mime = exportFormat
    exportCanvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = getExportFileName(imageName, exportFormat)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, mime, quality)
    setShowExportDialog(false)
  }

  const toggleTool = (tool) => {
    setCurrentTool((prev) => (prev === tool ? TOOL_TYPES.NONE : tool))
    if (tool !== TOOL_TYPES.CROP) {
      setCropRect(null)
    }
    setEditingTextId(null)
    setEditingTextValue('')
    setEditingTextPos(null)
  }

  return (
    <div className="ie-page">
      <div className="ie-header">
        <button className="ie-back-btn" onClick={() => navigate('/')} aria-label="返回首页">
          ← 返回首页
        </button>
        <h1 className="ie-title">图片编辑器</h1>
      </div>

      <div className="ie-toolbar">
        <div className="ie-toolbar-left">
          <button
            className={`ie-tool-btn ${currentTool === TOOL_TYPES.CROP ? 'active' : ''}`}
            onClick={() => toggleTool(TOOL_TYPES.CROP)}
            disabled={!baseCanvas}
            title="裁剪"
          >
            ✂️ 裁剪
          </button>
          {currentTool === TOOL_TYPES.CROP && (
            <>
              <select
                className="ie-export-select"
                value={cropRatio}
                onChange={(e) => setCropRatio(e.target.value)}
                style={{ fontSize: '13px', padding: '5px 8px' }}
              >
                <option value={CROP_RATIOS.FREE}>自由比例</option>
                <option value={CROP_RATIOS.RATIO_1_1}>1:1</option>
                <option value={CROP_RATIOS.RATIO_4_3}>4:3</option>
                <option value={CROP_RATIOS.RATIO_16_9}>16:9</option>
              </select>
            </>
          )}
          <div className="ie-tool-separator" />
          <button className="ie-tool-btn" onClick={handleRotateCCW} disabled={!baseCanvas} title="逆时针旋转 90°">
            ↺ 左旋转
          </button>
          <button className="ie-tool-btn" onClick={handleRotateCW} disabled={!baseCanvas} title="顺时针旋转 90°">
            ↻ 右旋转
          </button>
          <input
            type="range"
            min={-180}
            max={180}
            value={rotation}
            onChange={(e) => handleFreeRotate(e.target.value)}
            className="ie-slider"
            style={{ width: '100px' }}
            disabled={!baseCanvas}
            title={`自由旋转: ${rotation}°`}
          />
          <span style={{ fontSize: '12px', color: rotation !== 0 ? '#409eff' : '#888', minWidth: '40px' }}>
            {rotation}°
          </span>
          {rotation !== 0 && (
            <button className="ie-tool-btn ie-action-btn-primary" onClick={applyFreeRotation} title="应用旋转">
              应用
            </button>
          )}
          <div className="ie-tool-separator" />
          <button className="ie-tool-btn" onClick={handleFlipH} disabled={!baseCanvas} title="水平翻转">
            ⇋ 水平翻转
          </button>
          <button className="ie-tool-btn" onClick={handleFlipV} disabled={!baseCanvas} title="垂直翻转">
            ⇅ 垂直翻转
          </button>
          <div className="ie-tool-separator" />
          <button
            className={`ie-tool-btn ${currentTool === TOOL_TYPES.TEXT ? 'active' : ''}`}
            onClick={() => toggleTool(TOOL_TYPES.TEXT)}
            disabled={!baseCanvas}
            title="添加文字"
          >
            T 文字
          </button>
          <button
            className={`ie-tool-btn ${currentTool === TOOL_TYPES.BRUSH ? 'active' : ''}`}
            onClick={() => toggleTool(TOOL_TYPES.BRUSH)}
            disabled={!baseCanvas}
            title="涂鸦画笔"
          >
            ✏️ 涂鸦
          </button>
        </div>

        <div className="ie-toolbar-center">
          <button className="ie-action-btn" onClick={handleUndo} disabled={!canUndo(history)} title="撤销 (Ctrl+Z)">
            ↶ 撤销
          </button>
          <button className="ie-action-btn" onClick={handleRedo} disabled={!canRedo(history)} title="重做 (Ctrl+Y)">
            ↷ 重做
          </button>
        </div>

        <div className="ie-toolbar-right">
          <button
            className="ie-action-btn"
            onClick={() => fileInputRef.current?.click()}
            title="上传图片"
          >
            📁 上传
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="ie-hidden-input"
            onChange={handleFileInputChange}
          />
          <button
            className="ie-action-btn ie-action-btn-primary"
            onClick={handleExport}
            disabled={!baseCanvas}
            title="导出图片"
          >
            💾 导出
          </button>
        </div>
      </div>

      <div className="ie-main">
        <div className="ie-sidebar-left">
          <div className="ie-thumb-panel">
            <h3 className="ie-panel-title">原图参考</h3>
            {originalImageSrc ? (
              <div className="ie-thumb-container">
                <img src={originalImageSrc} alt="原图" />
              </div>
            ) : (
              <div className="ie-thumb-container">
                <div className="ie-empty-state">
                  <div className="ie-empty-state-icon">🖼️</div>
                  <div className="ie-empty-state-text">暂无图片</div>
                </div>
              </div>
            )}
            {baseCanvas && (
              <div className="ie-thumb-info">
                尺寸: {baseCanvas.width} × {baseCanvas.height}
                <br />
                格式: {getImageFileExtension({ type: originalImage?.src?.includes('jpeg') ? 'image/jpeg' : 'image/png' }).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div
          className="ie-canvas-wrapper"
          ref={canvasWrapperRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {!baseCanvas ? (
            <div
              className={`ie-upload-zone ${isDragOver ? 'dragover' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="ie-upload-icon">📤</div>
              <div className="ie-upload-text">拖拽图片到此处，或点击上传</div>
              <div className="ie-upload-hint">支持 PNG、JPG、WebP 格式</div>
            </div>
          ) : (
            <>
              <div className="ie-canvas-container">
                <canvas
                  ref={canvasRef}
                  className={`ie-canvas ${currentTool}`}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
                {cropRect && (
                  <>
                    <div
                      className="ie-crop-box"
                      style={{
                        left: `${cropRect.x * displayInfo.scale}px`,
                        top: `${cropRect.y * displayInfo.scale}px`,
                        width: `${cropRect.width * displayInfo.scale}px`,
                        height: `${cropRect.height * displayInfo.scale}px`,
                      }}
                    >
                      <div className="ie-crop-grid" />
                      {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((dir) => (
                        <div key={dir} className={`ie-crop-handle ${dir}`} />
                      ))}
                    </div>
                    <div className="ie-crop-actions">
                      <button className="ie-action-btn" onClick={handleCancelCrop}>取消</button>
                      <button className="ie-action-btn ie-action-btn-primary" onClick={handleConfirmCrop}>确认裁剪</button>
                    </div>
                  </>
                )}
                {editingTextPos && (
                  <input
                    ref={textInputRef}
                    type="text"
                    className="ie-text-input-inline"
                    value={editingTextValue}
                    onChange={handleTextInputChange}
                    onBlur={handleTextInputBlur}
                    onKeyDown={handleTextInputKeyDown}
                    placeholder="输入文字..."
                    autoFocus
                    style={{
                      left: `${displayInfo.offsetX + editingTextPos.x}px`,
                      top: `${displayInfo.offsetY + editingTextPos.y - fontSize * displayInfo.scale}px`,
                      fontSize: `${fontSize * displayInfo.scale}px`,
                      color: textColor,
                    }}
                  />
                )}
              </div>
              <button
                className={`ie-compare-btn ${isComparing ? 'active' : ''}`}
                onMouseDown={() => setIsComparing(true)}
                onMouseUp={() => setIsComparing(false)}
                onMouseLeave={() => setIsComparing(false)}
                onTouchStart={() => setIsComparing(true)}
                onTouchEnd={() => setIsComparing(false)}
              >
                {isComparing ? '👁️ 显示原图' : '👁️ 按住对比原图'}
              </button>
              <div className="ie-hint">
                <span>Ctrl+Z 撤销 · Ctrl+Y 重做</span>
                <span>按住下方按钮对比原图</span>
              </div>
            </>
          )}
        </div>

        <div className="ie-sidebar-right">
          <div className="ie-panel">
            <h3 className="ie-panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              滤镜调节
              <button
                className="ie-tool-btn"
                style={{ padding: '3px 8px', fontSize: '11px' }}
                onClick={handleResetFilters}
                disabled={areFiltersDefault(filters) || !baseCanvas}
              >
                重置
              </button>
            </h3>
            {Object.entries(FILTER_RANGES).map(([key, range]) => (
              <div className="ie-slider-row" key={key}>
                <div className="ie-slider-label">
                  <span>
                    {key === 'brightness' && '亮度'}
                    {key === 'contrast' && '对比度'}
                    {key === 'saturation' && '饱和度'}
                    {key === 'hue' && '色相'}
                    {key === 'blur' && '模糊'}
                  </span>
                  <span className="ie-slider-value">{filters[key]}</span>
                </div>
                <input
                  type="range"
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  value={filters[key]}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="ie-slider"
                  disabled={!baseCanvas}
                />
              </div>
            ))}
          </div>

          {currentTool === TOOL_TYPES.TEXT && (
            <div className="ie-panel">
              <h3 className="ie-panel-title">文字设置</h3>
              <div className="ie-slider-row">
                <div className="ie-slider-label">
                  <span>字号</span>
                  <span className="ie-slider-value">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={MIN_FONT_SIZE}
                  max={MAX_FONT_SIZE}
                  value={fontSize}
                  onChange={(e) => setFontSize(clampFontSize(Number(e.target.value)))}
                  className="ie-slider"
                />
              </div>
              <div className="ie-color-picker-wrap">
                <div
                  className="ie-color-current"
                  style={{ backgroundColor: textColor }}
                  onClick={() => setShowColorPickerText(!showColorPickerText)}
                />
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="ie-color-input"
                />
              </div>
              {showColorPickerText && (
                <div className="ie-color-presets">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      className="ie-color-swatch"
                      style={{ backgroundColor: c }}
                      onClick={() => { setTextColor(c); setShowColorPickerText(false) }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {currentTool === TOOL_TYPES.BRUSH && (
            <div className="ie-panel">
              <h3 className="ie-panel-title">画笔设置</h3>
              <div className="ie-slider-row">
                <div className="ie-slider-label">
                  <span>线宽</span>
                  <span className="ie-slider-value">{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min={MIN_BRUSH_SIZE}
                  max={MAX_BRUSH_SIZE}
                  value={brushSize}
                  onChange={(e) => setBrushSize(clampBrushSize(Number(e.target.value)))}
                  className="ie-slider"
                />
              </div>
              <div className="ie-color-picker-wrap">
                <div
                  className="ie-color-current"
                  style={{ backgroundColor: brushColor }}
                  onClick={() => setShowColorPickerBrush(!showColorPickerBrush)}
                />
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="ie-color-input"
                />
              </div>
              {showColorPickerBrush && (
                <div className="ie-color-presets">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      className="ie-color-swatch"
                      style={{ backgroundColor: c }}
                      onClick={() => { setBrushColor(c); setShowColorPickerBrush(false) }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showExportDialog && (
        <div className="ie-export-dialog" onClick={(e) => e.target === e.currentTarget && setShowExportDialog(false)}>
          <div className="ie-export-dialog-inner">
            <h3 className="ie-export-dialog-title">导出图片</h3>
            <div className="ie-export-row">
              <label className="ie-export-label">导出格式</label>
              <select
                className="ie-export-select"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value={EXPORT_FORMATS.PNG}>{EXPORT_FORMAT_NAMES[EXPORT_FORMATS.PNG]}</option>
                <option value={EXPORT_FORMATS.JPEG}>{EXPORT_FORMAT_NAMES[EXPORT_FORMATS.JPEG]}</option>
              </select>
            </div>
            {exportFormat === EXPORT_FORMATS.JPEG && (
              <div className="ie-export-row">
                <div className="ie-slider-label">
                  <span>图片质量</span>
                  <span className="ie-slider-value">{exportQuality}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={exportQuality}
                  onChange={(e) => setExportQuality(Number(e.target.value))}
                  className="ie-slider"
                />
              </div>
            )}
            <div className="ie-export-actions">
              <button className="ie-action-btn" onClick={() => setShowExportDialog(false)}>取消</button>
              <button className="ie-action-btn ie-action-btn-primary" onClick={doExport}>导出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageEditorPage
