import { useState, useRef, useEffect } from 'react'
import { MEDIA_TYPES, formatFileSize, extractDateFromItem } from './utils'

const TYPE_ICONS = {
  [MEDIA_TYPES.IMAGE]: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  [MEDIA_TYPES.VIDEO]: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  [MEDIA_TYPES.AUDIO]: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  [MEDIA_TYPES.DOCUMENT]: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  [MEDIA_TYPES.OTHER]: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  ),
}

export default function MediaThumb({
  item,
  onClick,
  selectMode = false,
  selected = false,
  onToggleSelect,
  onToggleFavorite,
}) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')
  const imgRef = useRef(null)

  useEffect(() => {
    if (!imgRef.current) return
    if (typeof IntersectionObserver === 'undefined') {
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [])

  const handleClick = (e) => {
    if (selectMode) {
      e.stopPropagation()
      onToggleSelect?.(item.id)
    } else {
      onClick?.(item)
    }
  }

  const handleFavoriteClick = (e) => {
    e.stopPropagation()
    onToggleFavorite?.(item.id)
  }

  return (
    <div
      ref={imgRef}
      className={`mg-thumb ${selected ? 'mg-thumb-selected' : ''} ${selectMode ? 'mg-thumb-select-mode' : ''}`}
      onClick={handleClick}
    >
      <div className="mg-thumb-image-wrap">
        {!loaded && (
          <div className="mg-thumb-placeholder">
            {TYPE_ICONS[item.type] || TYPE_ICONS[MEDIA_TYPES.OTHER]}
          </div>
        )}
        {inView && item.dataUrl && (
          <img
            src={item.dataUrl}
            alt={item.name}
            className={`mg-thumb-image ${loaded ? 'mg-thumb-image-loaded' : ''}`}
            onLoad={() => setLoaded(true)}
            loading="lazy"
          />
        )}
        {!item.dataUrl && (
          <div className="mg-thumb-placeholder">
            {TYPE_ICONS[item.type] || TYPE_ICONS[MEDIA_TYPES.OTHER]}
          </div>
        )}

        {selectMode && (
          <div className={`mg-thumb-checkbox ${selected ? 'mg-thumb-checkbox-checked' : ''}`}>
            {selected && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        )}

        <button
          type="button"
          className={`mg-thumb-fav ${item.favorite ? 'mg-thumb-fav-active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={item.favorite ? '取消收藏' : '收藏'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={item.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>

        <div className="mg-thumb-type-badge">
          {TYPE_ICONS[item.type] || TYPE_ICONS[MEDIA_TYPES.OTHER]}
        </div>
      </div>

      <div className="mg-thumb-info">
        <div className="mg-thumb-name" title={item.name}>{item.name}</div>
        <div className="mg-thumb-meta">
          <span>{formatFileSize(item.size)}</span>
          <span>{extractDateFromItem(item)}</span>
        </div>
      </div>
    </div>
  )
}
