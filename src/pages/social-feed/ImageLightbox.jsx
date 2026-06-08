import { useEffect, useCallback } from 'react'

export default function ImageLightbox({ images, currentIndex, onClose, onPrev, onNext }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrev?.()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNext?.()
      }
    },
    [onClose, onPrev, onNext]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  if (!images || images.length === 0 || currentIndex < 0 || currentIndex >= images.length) {
    return null
  }

  const canPrev = currentIndex > 0
  const canNext = currentIndex < images.length - 1

  return (
    <div className="sf-lightbox" role="dialog" aria-modal="true">
      <div className="sf-lightbox-backdrop" onClick={onClose} />
      <button
        type="button"
        className="sf-lightbox-close"
        onClick={onClose}
        aria-label="关闭"
      >
        ×
      </button>

      <button
        type="button"
        className="sf-lightbox-nav sf-lightbox-prev"
        onClick={(e) => {
          e.stopPropagation()
          if (canPrev) onPrev?.()
        }}
        disabled={!canPrev}
        aria-label="上一张"
      >
        ‹
      </button>

      <button
        type="button"
        className="sf-lightbox-nav sf-lightbox-next"
        onClick={(e) => {
          e.stopPropagation()
          if (canNext) onNext?.()
        }}
        disabled={!canNext}
        aria-label="下一张"
      >
        ›
      </button>

      <img
        src={images[currentIndex]}
        alt=""
        className="sf-lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="sf-lightbox-counter">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}
