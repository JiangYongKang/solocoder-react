import { useEffect, useState } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT, ELEMENT_TYPES, SHAPE_TYPES } from './constants.js'
import { calculateScaledCanvasSize, canGoToNextSlide, canGoToPrevSlide, getNextSlideIndex } from './slidesEditorCore.js'

function PlayerElement({ element }) {
  const style = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    overflow: 'hidden',
    boxSizing: 'border-box',
  }

  if (element.type === ELEMENT_TYPES.TEXT) {
    return (
      <div
        style={{
          ...style,
          color: element.color,
          fontSize: element.fontSize,
          fontWeight: element.bold ? 'bold' : 'normal',
          fontStyle: element.italic ? 'italic' : 'normal',
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: '4px',
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

export default function FullscreenPlayer({ slides, startIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [containerSize, setContainerSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      setContainerSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const goToPrev = () => {
    if (canGoToPrevSlide(currentIndex)) {
      setCurrentIndex(getNextSlideIndex(currentIndex, slides.length, -1))
      setAnimationKey((k) => k + 1)
    }
  }

  const goToNext = () => {
    if (canGoToNextSlide(currentIndex, slides.length)) {
      setCurrentIndex(getNextSlideIndex(currentIndex, slides.length, 1))
      setAnimationKey((k) => k + 1)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        goToPrev()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, slides.length, onClose])

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width

    if (x < width * 0.25) {
      goToPrev()
    } else if (x > width * 0.75) {
      goToNext()
    }
  }

  const currentSlide = slides[currentIndex]
  const { width: slideWidth, height: slideHeight } = calculateScaledCanvasSize(
    containerSize.width - 100,
    containerSize.height - 100
  )

  const scale = slideWidth / CANVAS_WIDTH

  return (
    <div className="se-fullscreen-player" onClick={handleClick}>
      <button className="se-fullscreen-close" onClick={(e) => { e.stopPropagation(); onClose() }}>
        ✕ 退出 (ESC)
      </button>
      <button
        className="se-fullscreen-nav se-fullscreen-prev"
        onClick={(e) => { e.stopPropagation(); goToPrev() }}
        disabled={!canGoToPrevSlide(currentIndex)}
      >
        ‹
      </button>
      <button
        className="se-fullscreen-nav se-fullscreen-next"
        onClick={(e) => { e.stopPropagation(); goToNext() }}
        disabled={!canGoToNextSlide(currentIndex, slides.length)}
      >
        ›
      </button>

      <div
        key={animationKey}
        className="se-fullscreen-slide"
        style={{
          width: slideWidth,
          height: slideHeight,
          backgroundColor: currentSlide.backgroundColor,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: 'relative',
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {currentSlide.elements.map((el) => (
            <PlayerElement key={el.id} element={el} />
          ))}
        </div>
      </div>

      <div className="se-fullscreen-counter">
        {currentIndex + 1} / {slides.length}
      </div>
    </div>
  )
}
