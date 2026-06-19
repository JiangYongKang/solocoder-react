import { useState } from 'react'
import { buildHTML, generateFullCSS } from './loadingAnimationCore.js'
import { ANIMATION_TYPES, BACKGROUND_THEMES } from './constants.js'

function CompositionElement({ element, isSelected, onSelect, onDelete, isDragging }) {
  const handleMouseDown = (e) => {
    e.stopPropagation()
    onSelect(element.compositionId)
  }

  const html = buildHTML(element.animationType, element.config, `comp-${element.compositionId}`)
  const css = generateFullCSS(element.animationType, element.config, `comp-${element.compositionId}`)

  return (
    <div
      className={`composition-element ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'absolute',
        left: `${element.position.x}%`,
        top: `${element.position.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: 'move',
      }}
      onMouseDown={handleMouseDown}
    >
      <style>{css}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {isSelected && (
        <div className="element-controls">
          <button
            className="element-delete-btn"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(element.compositionId)
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export default function CompositionEditor({
  elements,
  onElementsChange,
  onDrop,
  selectedElementId,
  onSelectElement,
  backgroundTheme,
}) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    onDrop(e, { x, y })
  }

  const handleCanvasMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      onSelectElement(null)
    }
  }

  const handleCanvasMouseMove = (e) => {
    if (!isDragging || !selectedElementId) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const clampedX = Math.max(0, Math.min(100, x))
    const clampedY = Math.max(0, Math.min(100, y))

    onElementsChange(
      elements.map(el =>
        el.compositionId === selectedElementId
          ? { ...el, position: { x: clampedX, y: clampedY } }
          : el
      )
    )
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  const handleElementMouseDown = (elementId) => {
    onSelectElement(elementId)
    setIsDragging(true)
  }

  const handleDeleteElement = (elementId) => {
    onElementsChange(elements.filter(el => el.compositionId !== elementId))
    if (selectedElementId === elementId) {
      onSelectElement(null)
    }
  }

  const selectedElement = elements.find(el => el.compositionId === selectedElementId)

  const theme = BACKGROUND_THEMES[backgroundTheme]
  const gridStyle = {
    backgroundImage: `
      linear-gradient(${theme.grid} 1px, transparent 1px),
      linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)
    `,
    backgroundSize: '20px 20px',
  }

  return (
    <div className="composition-editor">
      <h3 className="panel-title">组合动画编辑器</h3>

      <div className="composition-canvas-wrapper">
        <div
          className="composition-canvas"
          style={{
            backgroundColor: theme.bg,
            ...gridStyle,
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {elements.length === 0 ? (
            <div className="canvas-placeholder">
              从左侧拖拽动画类型到此处
            </div>
          ) : (
            elements.map(element => (
              <div
                key={element.compositionId}
                onMouseDown={() => handleElementMouseDown(element.compositionId)}
              >
                <CompositionElement
                  element={element}
                  isSelected={selectedElementId === element.compositionId}
                  onSelect={onSelectElement}
                  onDelete={handleDeleteElement}
                  isDragging={isDragging && selectedElementId === element.compositionId}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {selectedElement && (
        <div className="element-properties">
          <h4 className="properties-title">
            元素属性 - {ANIMATION_TYPES[selectedElement.animationType]?.name}
          </h4>
          <div className="property-row">
            <label>X 位置:</label>
            <input
              type="number"
              min="0"
              max="100"
              value={selectedElement.position.x.toFixed(1)}
              onChange={(e) => {
                const x = parseFloat(e.target.value)
                onElementsChange(
                  elements.map(el =>
                    el.compositionId === selectedElementId
                      ? { ...el, position: { ...el.position, x: Math.max(0, Math.min(100, x)) } }
                      : el
                  )
                )
              }}
            />
            <span>%</span>
          </div>
          <div className="property-row">
            <label>Y 位置:</label>
            <input
              type="number"
              min="0"
              max="100"
              value={selectedElement.position.y.toFixed(1)}
              onChange={(e) => {
                const y = parseFloat(e.target.value)
                onElementsChange(
                  elements.map(el =>
                    el.compositionId === selectedElementId
                      ? { ...el, position: { ...el.position, y: Math.max(0, Math.min(100, y)) } }
                      : el
                  )
                )
              }}
            />
            <span>%</span>
          </div>
          <div className="property-row">
            <label>大小:</label>
            <input
              type="range"
              min="10"
              max="200"
              value={selectedElement.config.size}
              onChange={(e) => {
                const size = parseInt(e.target.value)
                onElementsChange(
                  elements.map(el =>
                    el.compositionId === selectedElementId
                      ? { ...el, config: { ...el.config, size } }
                      : el
                  )
                )
              }}
            />
            <span>{selectedElement.config.size}px</span>
          </div>
          <div className="property-row">
            <label>主色:</label>
            <input
              type="color"
              value={selectedElement.config.primaryColor}
              onChange={(e) => {
                onElementsChange(
                  elements.map(el =>
                    el.compositionId === selectedElementId
                      ? { ...el, config: { ...el.config, primaryColor: e.target.value } }
                      : el
                  )
                )
              }}
            />
          </div>
          <div className="property-row">
            <label>辅色:</label>
            <input
              type="color"
              value={selectedElement.config.secondaryColor}
              onChange={(e) => {
                onElementsChange(
                  elements.map(el =>
                    el.compositionId === selectedElementId
                      ? { ...el, config: { ...el.config, secondaryColor: e.target.value } }
                      : el
                  )
                )
              }}
            />
          </div>
          <div className="property-row">
            <label>速度:</label>
            <input
              type="range"
              min="0.3"
              max="5"
              step="0.1"
              value={selectedElement.config.speed}
              onChange={(e) => {
                const speed = parseFloat(e.target.value)
                onElementsChange(
                  elements.map(el =>
                    el.compositionId === selectedElementId
                      ? { ...el, config: { ...el.config, speed } }
                      : el
                  )
                )
              }}
            />
            <span>{selectedElement.config.speed}s</span>
          </div>
        </div>
      )}

      <div className="composition-actions">
        <button
          className="action-btn"
          onClick={() => onElementsChange([])}
          disabled={elements.length === 0}
        >
          清空画布
        </button>
        <span className="element-count">
          元素数量: {elements.length}
        </span>
      </div>
    </div>
  )
}
