import { ELEMENT_TYPES, SHAPE_TYPES } from './constants.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js'

function MiniElement({ element }) {
  const scaleX = 100 / CANVAS_WIDTH
  const scaleY = 100 / CANVAS_HEIGHT

  const style = {
    position: 'absolute',
    left: `${element.x * scaleX}%`,
    top: `${element.y * scaleY}%`,
    width: `${element.width * scaleX}%`,
    height: `${element.height * scaleY}%`,
    overflow: 'hidden',
  }

  if (element.type === ELEMENT_TYPES.TEXT) {
    return (
      <div
        style={{
          ...style,
          color: element.color,
          fontSize: `${element.fontSize * scaleY}%`,
          fontWeight: element.bold ? 'bold' : 'normal',
          fontStyle: element.italic ? 'italic' : 'normal',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {element.content}
      </div>
    )
  }

  if (element.type === ELEMENT_TYPES.IMAGE) {
    return (
      <div style={style}>
        <img src={element.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
    )
  }

  if (element.type === ELEMENT_TYPES.SHAPE) {
    return (
      <div style={style}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
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
      </div>
    )
  }

  return null
}

export default function SlideThumbnail({ slide, index, isActive, onClick, onDragStart, onDragOver, onDrop, isDragging, isDragOver }) {
  return (
    <div
      className={`se-thumbnail ${isActive ? 'active' : ''} ${isDragging ? 'se-thumbnail-dragging' : ''} ${isDragOver ? 'se-drag-over' : ''}`}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="se-thumbnail-index">{index + 1}</div>
      <div className="se-thumbnail-content" style={{ backgroundColor: slide.backgroundColor }}>
        <div className="se-thumbnail-mini-elements">
          {slide.elements.map((el) => (
            <MiniElement key={el.id} element={el} />
          ))}
        </div>
      </div>
    </div>
  )
}
