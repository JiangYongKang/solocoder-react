import { useEffect, useRef } from 'react'
import { ELEMENT_TYPES, SHAPE_TYPES } from './constants.js'

export default function SlideElement({
  element,
  isSelected,
  onMouseDown,
  onResizeStart,
  onDoubleClick,
  isEditing,
  editText,
  onEditTextChange,
  onEditTextBlur,
  onEditTextKeyDown,
}) {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleMouseDown = (e) => {
    if (e.target.closest('.se-resize-handle')) return
    e.stopPropagation()
    onMouseDown(e, element)
  }

  const handleResizeStart = (e, direction) => {
    e.stopPropagation()
    onResizeStart(e, element, direction)
  }

  const style = {
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
  }

  const renderContent = () => {
    if (element.type === ELEMENT_TYPES.TEXT) {
      const textStyle = {
        color: element.color,
        fontSize: element.fontSize,
        fontWeight: element.bold ? 'bold' : 'normal',
        fontStyle: element.italic ? 'italic' : 'normal',
        width: '100%',
        height: '100%',
        padding: '4px',
        boxSizing: 'border-box',
      }

      if (isEditing) {
        return (
          <div className={`se-element-text editing`} style={textStyle}>
            <textarea
              ref={textareaRef}
              className="se-element-textarea"
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              onBlur={onEditTextBlur}
              onKeyDown={onEditTextKeyDown}
              style={{
                color: element.color,
                fontSize: element.fontSize,
                fontWeight: element.bold ? 'bold' : 'normal',
                fontStyle: element.italic ? 'italic' : 'normal',
              }}
            />
          </div>
        )
      }

      return (
        <div className="se-element-text" style={textStyle} onDoubleClick={(e) => {
          e.stopPropagation()
          onDoubleClick(element)
        }}>
          {element.content}
        </div>
      )
    }

    if (element.type === ELEMENT_TYPES.IMAGE) {
      return <img className="se-element-image" src={element.src} alt="" draggable={false} />
    }

    if (element.type === ELEMENT_TYPES.SHAPE) {
      return (
        <svg className="se-shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {element.shapeType === SHAPE_TYPES.RECTANGLE && (
            <rect
              x="0"
              y="0"
              width="100"
              height="100"
              fill={element.fillColor}
              stroke={element.borderColor}
              strokeWidth={element.borderWidth * 0.5}
            />
          )}
          {element.shapeType === SHAPE_TYPES.CIRCLE && (
            <ellipse
              cx="50"
              cy="50"
              rx="50"
              ry="50"
              fill={element.fillColor}
              stroke={element.borderColor}
              strokeWidth={element.borderWidth * 0.5}
            />
          )}
          {element.shapeType === SHAPE_TYPES.TRIANGLE && (
            <polygon
              points="50,0 100,100 0,100"
              fill={element.fillColor}
              stroke={element.borderColor}
              strokeWidth={element.borderWidth * 0.5}
            />
          )}
        </svg>
      )
    }

    return null
  }

  return (
    <div
      className={`se-element ${isSelected ? 'selected' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      {renderContent()}
      {isSelected && !isEditing && (
        <>
          <div className="se-resize-handle nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="se-resize-handle ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="se-resize-handle sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="se-resize-handle se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
        </>
      )}
    </div>
  )
}
