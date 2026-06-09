import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  loadFromStorage,
  saveToStorage,
  addSlide,
  deleteSlide,
  duplicateSlide,
  reorderSlides,
  addElement,
  deleteElement,
  updateElement,
  createTextElement,
  createImageElement,
  createShapeElement,
  findElementAtPoint,
  screenToCanvas,
  constrainToCanvas,
  clampElementSize,
  clampFontSize,
  downloadJson,
  importFromJson,
  getSlideById,
  getElementById,
  clampNumber,
} from './slidesEditorCore.js'
import {
  ELEMENT_TYPES,
  SHAPE_TYPES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MIN_ELEMENT_SIZE,
} from './constants.js'
import './slides-editor.css'
import SlideThumbnail from './SlideThumbnail.jsx'
import SlideElement from './SlideElement.jsx'
import PropertyPanel from './PropertyPanel.jsx'
import FullscreenPlayer from './FullscreenPlayer.jsx'

function SlidesEditorPage() {
  const navigate = useNavigate()
  const initialState = loadFromStorage()
  const [slides, setSlides] = useState(initialState.slides)
  const [currentSlideId, setCurrentSlideId] = useState(initialState.slides[0]?.id)
  const [selectedElementId, setSelectedElementId] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isEditingText, setIsEditingText] = useState(false)
  const [editTextValue, setEditTextValue] = useState('')

  const canvasContainerRef = useRef(null)
  const canvasRef = useRef(null)
  const imageInputRef = useRef(null)
  const importInputRef = useRef(null)
  const fileRef = useRef(null)

  const dragStateRef = useRef({
    isDragging: false,
    isResizing: false,
    resizeDirection: null,
    startX: 0,
    startY: 0,
    elementStartX: 0,
    elementStartY: 0,
    elementStartWidth: 0,
    elementStartHeight: 0,
    elementId: null,
  })

  const [draggingSlideId, setDraggingSlideId] = useState(null)
  const [dragOverSlideId, setDragOverSlideId] = useState(null)

  const currentSlide = getSlideById(slides, currentSlideId)
  const selectedElement = currentSlide ? getElementById(currentSlide, selectedElementId) : null

  useEffect(() => {
    saveToStorage({ slides })
  }, [slides])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFullscreen) return
      if (isEditingText) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && currentSlideId) {
          setSlides((prev) => deleteElement(prev, currentSlideId, selectedElementId))
          setSelectedElementId(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, currentSlideId, isFullscreen, isEditingText])

  const getCanvasScale = useCallback(() => {
    if (!canvasRef.current) return 1
    return canvasRef.current.offsetWidth / CANVAS_WIDTH
  }, [])

  const handleCanvasMouseDown = (e) => {
    if (isEditingText) return
    setSelectedElementId(null)
  }

  const handleElementMouseDown = (e, element) => {
    if (isEditingText) return
    setSelectedElementId(element.id)

    const rect = canvasRef.current.getBoundingClientRect()
    const scale = getCanvasScale()
    const pos = screenToCanvas(e.clientX, e.clientY, rect.left, rect.top, scale)

    dragStateRef.current = {
      isDragging: true,
      isResizing: false,
      resizeDirection: null,
      startX: pos.x,
      startY: pos.y,
      elementStartX: element.x,
      elementStartY: element.y,
      elementStartWidth: element.width,
      elementStartHeight: element.height,
      elementId: element.id,
    }

    const handleMouseMove = (moveEvent) => {
      if (!dragStateRef.current.isDragging) return
      const moveRect = canvasRef.current.getBoundingClientRect()
      const moveScale = getCanvasScale()
      const movePos = screenToCanvas(moveEvent.clientX, moveEvent.clientY, moveRect.left, moveRect.top, moveScale)

      const dx = movePos.x - dragStateRef.current.startX
      const dy = movePos.y - dragStateRef.current.startY

      let newX = dragStateRef.current.elementStartX + dx
      let newY = dragStateRef.current.elementStartY + dy

      const constrained = constrainToCanvas(
        newX,
        newY,
        dragStateRef.current.elementStartWidth,
        dragStateRef.current.elementStartHeight
      )

      setSlides((prev) =>
        updateElement(prev, currentSlideId, dragStateRef.current.elementId, {
          x: constrained.x,
          y: constrained.y,
        })
      )
    }

    const handleMouseUp = () => {
      dragStateRef.current.isDragging = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleResizeStart = (e, element, direction) => {
    if (isEditingText) return
    e.stopPropagation()
    setSelectedElementId(element.id)

    const rect = canvasRef.current.getBoundingClientRect()
    const scale = getCanvasScale()
    const pos = screenToCanvas(e.clientX, e.clientY, rect.left, rect.top, scale)

    dragStateRef.current = {
      isDragging: false,
      isResizing: true,
      resizeDirection: direction,
      startX: pos.x,
      startY: pos.y,
      elementStartX: element.x,
      elementStartY: element.y,
      elementStartWidth: element.width,
      elementStartHeight: element.height,
      elementId: element.id,
    }

    const handleMouseMove = (moveEvent) => {
      if (!dragStateRef.current.isResizing) return
      const moveRect = canvasRef.current.getBoundingClientRect()
      const moveScale = getCanvasScale()
      const movePos = screenToCanvas(moveEvent.clientX, moveEvent.clientY, moveRect.left, moveRect.top, moveScale)

      const dx = movePos.x - dragStateRef.current.startX
      const dy = movePos.y - dragStateRef.current.startY
      const dir = dragStateRef.current.resizeDirection

      let newX = dragStateRef.current.elementStartX
      let newY = dragStateRef.current.elementStartY
      let newWidth = dragStateRef.current.elementStartWidth
      let newHeight = dragStateRef.current.elementStartHeight

      if (dir.includes('e')) {
        newWidth = dragStateRef.current.elementStartWidth + dx
      }
      if (dir.includes('w')) {
        newWidth = dragStateRef.current.elementStartWidth - dx
        newX = dragStateRef.current.elementStartX + dx
      }
      if (dir.includes('s')) {
        newHeight = dragStateRef.current.elementStartHeight + dy
      }
      if (dir.includes('n')) {
        newHeight = dragStateRef.current.elementStartHeight - dy
        newY = dragStateRef.current.elementStartY + dy
      }

      if (element.type === ELEMENT_TYPES.IMAGE) {
        const aspectRatio = dragStateRef.current.elementStartWidth / dragStateRef.current.elementStartHeight
        if (dir === 'se' || dir === 'nw') {
          if (Math.abs(dx) > Math.abs(dy)) {
            newHeight = newWidth / aspectRatio
            if (dir === 'nw') {
              newY = dragStateRef.current.elementStartY + (dragStateRef.current.elementStartHeight - newHeight)
            }
          } else {
            newWidth = newHeight * aspectRatio
            if (dir === 'nw') {
              newX = dragStateRef.current.elementStartX + (dragStateRef.current.elementStartWidth - newWidth)
            }
          }
        }
      }

      const clamped = clampElementSize(newWidth, newHeight)
      newWidth = clamped.width
      newHeight = clamped.height

      newX = clampNumber(newX, 0, CANVAS_WIDTH - newWidth)
      newY = clampNumber(newY, 0, CANVAS_HEIGHT - newHeight)

      setSlides((prev) =>
        updateElement(prev, currentSlideId, dragStateRef.current.elementId, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        })
      )
    }

    const handleMouseUp = () => {
      dragStateRef.current.isResizing = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleCanvasClick = (e) => {
    if (isEditingText) return
    if (e.target !== canvasRef.current && e.target !== canvasContainerRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const scale = getCanvasScale()
    const pos = screenToCanvas(e.clientX, e.clientY, rect.left, rect.top, scale)

    if (currentSlideId) {
      const found = findElementAtPoint(currentSlide, pos.x, pos.y)
      if (!found) {
        setSelectedElementId(null)
      }
    }
  }

  const handleAddText = () => {
    if (!currentSlideId) return
    const el = createTextElement(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2 - 20)
    setSlides((prev) => addElement(prev, currentSlideId, el))
    setSelectedElementId(el.id)
  }

  const handleAddImageClick = () => {
    imageInputRef.current?.click()
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file || !currentSlideId) {
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        const maxSize = 400
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width = width * ratio
          height = height * ratio
        }
        const el = createImageElement(
          CANVAS_WIDTH / 2 - width / 2,
          CANVAS_HEIGHT / 2 - height / 2,
          ev.target.result,
          width,
          height
        )
        setSlides((prev) => addElement(prev, currentSlideId, el))
        setSelectedElementId(el.id)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleAddShape = (shapeType) => {
    if (!currentSlideId) return
    const el = createShapeElement(shapeType, CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT / 2 - 50)
    setSlides((prev) => addElement(prev, currentSlideId, el))
    setSelectedElementId(el.id)
  }

  const handleUpdateElement = (updates) => {
    if (!currentSlideId || !selectedElementId) return
    const processed = { ...updates }
    if (processed.fontSize !== undefined) {
      processed.fontSize = clampFontSize(processed.fontSize)
    }
    if (processed.width !== undefined || processed.height !== undefined) {
      const w = processed.width !== undefined ? processed.width : selectedElement.width
      const h = processed.height !== undefined ? processed.height : selectedElement.height
      const clamped = clampElementSize(w, h)
      processed.width = clamped.width
      processed.height = clamped.height
    }
    setSlides((prev) => updateElement(prev, currentSlideId, selectedElementId, processed))
  }

  const handleDeleteElement = () => {
    if (!currentSlideId || !selectedElementId) return
    setSlides((prev) => deleteElement(prev, currentSlideId, selectedElementId))
    setSelectedElementId(null)
  }

  const handleAddSlide = () => {
    setSlides((prev) => {
      const newSlides = addSlide(prev)
      const newSlideId = newSlides[newSlides.length - 1].id
      setTimeout(() => setCurrentSlideId(newSlideId), 0)
      return newSlides
    })
    setSelectedElementId(null)
  }

  const handleDeleteSlide = () => {
    if (!currentSlideId) return
    if (slides.length <= 1) return
    const currentIndex = slides.findIndex((s) => s.id === currentSlideId)
    setSlides((prev) => {
      const newSlides = deleteSlide(prev, currentSlideId)
      const nextIndex = Math.min(currentIndex, newSlides.length - 1)
      setTimeout(() => setCurrentSlideId(newSlides[nextIndex]?.id), 0)
      return newSlides
    })
    setSelectedElementId(null)
  }

  const handleDuplicateSlide = () => {
    if (!currentSlideId) return
    setSlides((prev) => {
      const currentIndex = prev.findIndex((s) => s.id === currentSlideId)
      const newSlides = duplicateSlide(prev, currentSlideId)
      setTimeout(() => setCurrentSlideId(newSlides[currentIndex + 1]?.id), 0)
      return newSlides
    })
    setSelectedElementId(null)
  }

  const handleSelectSlide = (slideId) => {
    setCurrentSlideId(slideId)
    setSelectedElementId(null)
    setIsEditingText(false)
  }

  const handleSlideDragStart = (e, slideId) => {
    setDraggingSlideId(slideId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleSlideDragOver = (e, slideId) => {
    e.preventDefault()
    if (draggingSlideId && draggingSlideId !== slideId) {
      setDragOverSlideId(slideId)
    }
  }

  const handleSlideDrop = (e, targetSlideId) => {
    e.preventDefault()
    if (!draggingSlideId || draggingSlideId === targetSlideId) {
      setDraggingSlideId(null)
      setDragOverSlideId(null)
      return
    }
    const fromIndex = slides.findIndex((s) => s.id === draggingSlideId)
    const toIndex = slides.findIndex((s) => s.id === targetSlideId)
    setSlides((prev) => reorderSlides(prev, fromIndex, toIndex))
    setDraggingSlideId(null)
    setDragOverSlideId(null)
  }

  const handleDoubleClickText = (element) => {
    if (element.type !== ELEMENT_TYPES.TEXT) return
    setIsEditingText(true)
    setEditTextValue(element.content)
  }

  const handleEditTextChange = (value) => {
    setEditTextValue(value)
    if (currentSlideId && selectedElementId) {
      setSlides((prev) => updateElement(prev, currentSlideId, selectedElementId, { content: value }))
    }
  }

  const handleEditTextBlur = () => {
    setIsEditingText(false)
  }

  const handleEditTextKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditingText(false)
    }
  }

  const handlePlay = () => {
    setIsFullscreen(true)
    setSelectedElementId(null)
    setIsEditingText(false)
  }

  const handleCloseFullscreen = () => {
    setIsFullscreen(false)
  }

  const handleExport = () => {
    downloadJson(slides, `slides-${Date.now()}.json`)
  }

  const handleImportClick = () => {
    importInputRef.current?.click()
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      e.target.value = ''
      return
    }
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const result = importFromJson(json)
      if (result.valid) {
        setSlides(result.data)
        setCurrentSlideId(result.data[0]?.id)
        setSelectedElementId(null)
      } else {
        alert(`导入失败: ${result.error}`)
      }
    } catch {
      alert('导入失败：无效的 JSON 文件')
    }
    e.target.value = ''
  }

  const handleCanvasDoubleClick = (e) => {
    if (!currentSlideId) return
    if (e.target !== canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const scale = getCanvasScale()
    const pos = screenToCanvas(e.clientX, e.clientY, rect.left, rect.top, scale)

    const el = createTextElement(pos.x - 100, pos.y - 20, '')
    setSlides((prev) => addElement(prev, currentSlideId, el))
    setSelectedElementId(el.id)
    setIsEditingText(true)
    setEditTextValue('')
  }

  return (
    <div className="slides-editor">
      <div className="se-header">
        <div className="se-header-left">
          <button className="se-btn" onClick={() => navigate('/')}>
            ← 返回
          </button>
          <h1 className="se-title">幻灯片编辑器</h1>
        </div>
        <div className="se-header-right">
          <button className="se-btn" onClick={handleImportClick}>
            📥 导入
          </button>
          <button className="se-btn" onClick={handleExport}>
            📤 导出
          </button>
          <button className="se-btn se-btn-primary" onClick={handlePlay}>
            ▶ 播放
          </button>
        </div>
      </div>

      <div className="se-toolbar">
        <div className="se-toolbar-group">
          <span className="se-tool-label">插入:</span>
          <button className="se-btn" onClick={handleAddText}>
            T 文本
          </button>
          <button className="se-btn" onClick={handleAddImageClick}>
            🖼 图片
          </button>
        </div>
        <div className="se-toolbar-group">
          <span className="se-tool-label">形状:</span>
          <button className="se-btn" onClick={() => handleAddShape(SHAPE_TYPES.RECTANGLE)}>
            ▭ 矩形
          </button>
          <button className="se-btn" onClick={() => handleAddShape(SHAPE_TYPES.CIRCLE)}>
            ◯ 圆形
          </button>
          <button className="se-btn" onClick={() => handleAddShape(SHAPE_TYPES.TRIANGLE)}>
            △ 三角形
          </button>
        </div>
      </div>

      <div className="se-main">
        <div className="se-sidebar">
          <div className="se-sidebar-header">
            <span className="se-sidebar-title">幻灯片</span>
            <div className="se-sidebar-actions">
              <button
                className="se-icon-btn"
                onClick={handleAddSlide}
                title="新增页面"
              >
                +
              </button>
              <button
                className="se-icon-btn"
                onClick={handleDuplicateSlide}
                title="复制页面"
              >
                ⎘
              </button>
              <button
                className="se-icon-btn"
                onClick={handleDeleteSlide}
                title="删除页面"
                disabled={slides.length <= 1}
              >
                🗑
              </button>
            </div>
          </div>
          <div className="se-thumbnails-list">
            {slides.map((slide, index) => (
              <SlideThumbnail
                key={slide.id}
                slide={slide}
                index={index}
                isActive={slide.id === currentSlideId}
                onClick={() => handleSelectSlide(slide.id)}
                onDragStart={(e) => handleSlideDragStart(e, slide.id)}
                onDragOver={(e) => handleSlideDragOver(e, slide.id)}
                onDrop={(e) => handleSlideDrop(e, slide.id)}
                isDragging={draggingSlideId === slide.id}
                isDragOver={dragOverSlideId === slide.id}
              />
            ))}
          </div>
        </div>

        <div className="se-canvas-wrapper" ref={canvasContainerRef}>
          <div className="se-canvas-container">
            <div
              ref={canvasRef}
              className="se-canvas"
              style={{
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                backgroundColor: currentSlide?.backgroundColor || '#ffffff',
              }}
              onMouseDown={handleCanvasMouseDown}
              onClick={handleCanvasClick}
              onDoubleClick={handleCanvasDoubleClick}
            >
              {currentSlide?.elements.map((element) => (
                <SlideElement
                  key={element.id}
                  element={element}
                  isSelected={element.id === selectedElementId}
                  scale={getCanvasScale()}
                  onMouseDown={handleElementMouseDown}
                  onResizeStart={handleResizeStart}
                  onDoubleClick={handleDoubleClickText}
                  isEditing={isEditingText && element.id === selectedElementId}
                  editText={editTextValue}
                  onEditTextChange={handleEditTextChange}
                  onEditTextBlur={handleEditTextBlur}
                  onEditTextKeyDown={handleEditTextKeyDown}
                />
              ))}
            </div>
          </div>
        </div>

        <PropertyPanel
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
        />
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="se-hidden-input"
        onChange={handleImageUpload}
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        className="se-hidden-input"
        onChange={handleImportFile}
      />

      {isFullscreen && (
        <FullscreenPlayer
          slides={slides}
          startIndex={slides.findIndex((s) => s.id === currentSlideId)}
          onClose={handleCloseFullscreen}
        />
      )}
    </div>
  )
}

export default SlidesEditorPage
