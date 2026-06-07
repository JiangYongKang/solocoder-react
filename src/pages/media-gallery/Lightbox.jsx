import { useEffect, useCallback } from 'react'
import { formatFileSize, formatDateTime, MEDIA_TYPES } from './utils'

const TYPE_LABELS = {
  [MEDIA_TYPES.IMAGE]: '图片',
  [MEDIA_TYPES.VIDEO]: '视频',
  [MEDIA_TYPES.AUDIO]: '音频',
  [MEDIA_TYPES.DOCUMENT]: '文档',
  [MEDIA_TYPES.OTHER]: '其他',
}

export default function Lightbox({ items, currentIndex, onClose, onPrev, onNext }) {
  const currentItem = items[currentIndex]

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

  if (!currentItem) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.()
    }
  }

  const canPrev = currentIndex > 0
  const canNext = currentIndex < items.length - 1

  return (
    <div className="mg-lightbox" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <button
        type="button"
        className="mg-lightbox-close"
        onClick={onClose}
        aria-label="关闭 (Esc)"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <button
        type="button"
        className={`mg-lightbox-nav mg-lightbox-prev ${!canPrev ? 'mg-lightbox-nav-disabled' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          if (canPrev) onPrev?.()
        }}
        aria-label="上一张 (←)"
        disabled={!canPrev}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        type="button"
        className={`mg-lightbox-nav mg-lightbox-next ${!canNext ? 'mg-lightbox-nav-disabled' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          if (canNext) onNext?.()
        }}
        aria-label="下一张 (→)"
        disabled={!canNext}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div className="mg-lightbox-content" onClick={(e) => e.stopPropagation()}>
        <div className="mg-lightbox-media">
          {currentItem.dataUrl && currentItem.type === MEDIA_TYPES.IMAGE && (
            <img src={currentItem.dataUrl} alt={currentItem.name} />
          )}
          {currentItem.dataUrl && currentItem.type === MEDIA_TYPES.VIDEO && (
            <video src={currentItem.dataUrl} controls />
          )}
          {currentItem.dataUrl && currentItem.type === MEDIA_TYPES.AUDIO && (
            <div className="mg-lightbox-audio-wrap">
              <audio src={currentItem.dataUrl} controls />
            </div>
          )}
          {(!currentItem.dataUrl || currentItem.type === MEDIA_TYPES.DOCUMENT || currentItem.type === MEDIA_TYPES.OTHER) && (
            <div className="mg-lightbox-placeholder">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              <p>{currentItem.name}</p>
              <span>该文件类型暂不支持预览</span>
            </div>
          )}
        </div>

        <div className="mg-lightbox-info">
          <h3 className="mg-lightbox-title">{currentItem.name}</h3>
          <div className="mg-lightbox-meta">
            <div>
              <span className="mg-lightbox-meta-label">类型：</span>
              <span>{TYPE_LABELS[currentItem.type] || '未知'}</span>
            </div>
            <div>
              <span className="mg-lightbox-meta-label">大小：</span>
              <span>{formatFileSize(currentItem.size)}</span>
            </div>
            <div>
              <span className="mg-lightbox-meta-label">创建时间：</span>
              <span>{formatDateTime(currentItem.createdAt)}</span>
            </div>
          </div>
          {currentItem.tags && currentItem.tags.length > 0 && (
            <div className="mg-lightbox-tags">
              {currentItem.tags.map((tag) => (
                <span key={tag} className="mg-lightbox-tag">{tag}</span>
              ))}
            </div>
          )}
          <div className="mg-lightbox-counter">
            {currentIndex + 1} / {items.length}
          </div>
        </div>
      </div>
    </div>
  )
}
