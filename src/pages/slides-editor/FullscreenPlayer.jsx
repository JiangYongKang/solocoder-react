import { useEffect, useState, useRef, useCallback } from 'react'
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
  const [prevIndex, setPrevIndex] = useState(null)
  const [containerSize, setContainerSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const transitionTimerRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      setContainerSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  const navigateTo = useCallback(
    (nextIndex) => {
      if (nextIndex === currentIndex) return
      setPrevIndex(currentIndex)
      setCurrentIndex(nextIndex)
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current)
      }
      transitionTimerRef.current = setTimeout(() => {
        setPrevIndex(null)
        transitionTimerRef.current = null
      }, 400)
    },
    [currentIndex]
  )

  const goToPrev = useCallback(() => {
    if (canGoToPrevSlide(currentIndex)) {
      navigateTo(getNextSlideIndex(currentIndex, slides.length, -1))
    }
  }, [currentIndex, slides.length, navigateTo])

  const goToNext = useCallback(() => {
    if (canGoToNextSlide(currentIndex, slides.length)) {
      navigateTo(getNextSlideIndex(currentIndex, slides.length, 1))
    }
  }, [currentIndex, slides.length, navigateTo])

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
  }, [goToPrev, goToNext, onClose])

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

  const { width: slideWidth, height: slideHeight } = calculateScaledCanvasSize(
    containerSize.width - 100,
    containerSize.height - 100
  )

  const scale = slideWidth / CANVAS_WIDTH

  const renderSlideContent = (slide) => (
    <div
      style={{
        position: 'relative',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {slide.elements.map((el) => (
        <PlayerElement key={el.id} element={el} />
      ))}
    </div>
  )

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
        className="se-fullscreen-slide-wrapper"
        style={{
          width: slideWidth,
          height: slideHeight,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {prevIndex !== null && slides[prevIndex] && (
          <div
            className="se-fullscreen-slide fade-out"
            style={{
              width: slideWidth,
              height: slideHeight,
              backgroundColor: slides[prevIndex].backgroundColor,
            }}
          >
            {renderSlideContent(slides[prevIndex])}
          </div>
        )}
        <div
          className={`se-fullscreen-slide ${prevIndex !== null ? 'fade-in' : 'visible'}`}
          style={{
            width: slideWidth,
            height: slideHeight,
            backgroundColor: slides[currentIndex].backgroundColor,
          }}
        >
          {renderSlideContent(slides[currentIndex])}
        </div>
      </div>

      <div className="se-fullscreen-counter">
        {currentIndex + 1} / {slides.length}
      </div>
    </div>
  )
}
