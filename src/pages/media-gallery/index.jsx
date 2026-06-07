import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FilterBar from './FilterBar'
import MediaThumb from './MediaThumb'
import Lightbox from './Lightbox'
import UploadButton from './UploadButton'
import {
  loadMediaData,
  saveMediaData,
  getAllTags,
  getAllTypes,
  getAllDates,
  filterMedia,
  sortMedia,
  toggleFavorite,
  setFavoriteBatch,
  deleteMediaItems,
  addMediaItem,
} from './utils'
import './media-gallery.css'

function ConfirmDialog({ visible, title, message, confirmText, onCancel, onConfirm }) {
  if (!visible) return null
  return (
    <div className="mg-dialog-mask" onClick={onCancel}>
      <div className="mg-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="mg-dialog-title">{title}</h3>
        <p className="mg-dialog-message">{message}</p>
        <div className="mg-dialog-actions">
          <button type="button" className="mg-btn" onClick={onCancel}>取消</button>
          <button type="button" className="mg-btn mg-btn-danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

function MediaGallery() {
  const navigate = useNavigate()
  const [items, setItems] = useState(() => loadMediaData())
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedDates, setSelectedDates] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, title: '', message: '', onConfirm: null })
  const [toast, setToast] = useState(null)
  const uploadBtnRef = useRef(null)

  useEffect(() => {
    saveMediaData(items)
  }, [items])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  const allTags = useMemo(() => getAllTags(items), [items])
  const allTypes = useMemo(() => getAllTypes(items), [items])
  const allDates = useMemo(() => getAllDates(items), [items])

  const filteredItems = useMemo(() => {
    const filtered = filterMedia(items, {
      tags: selectedTags,
      types: selectedTypes,
      dates: selectedDates,
      favoriteOnly,
      searchTerm,
    })
    return sortMedia(filtered, sortBy, sortOrder)
  }, [items, selectedTags, selectedTypes, selectedDates, favoriteOnly, searchTerm, sortBy, sortOrder])

  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleToggleFavorite = useCallback((id) => {
    setItems((prev) => toggleFavorite(prev, id))
  }, [])

  const handleItemClick = useCallback((item) => {
    const idx = filteredItems.findIndex((i) => i.id === item.id)
    if (idx >= 0) {
      setLightboxIndex(idx)
    }
  }, [filteredItems])

  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(null)
  }, [])

  const handlePrevLightbox = useCallback(() => {
    setLightboxIndex((prev) => (prev != null && prev > 0 ? prev - 1 : prev))
  }, [])

  const handleNextLightbox = useCallback(() => {
    setLightboxIndex((prev) =>
      prev != null && prev < filteredItems.length - 1 ? prev + 1 : prev
    )
  }, [filteredItems.length])

  const handleToggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleToggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      const next = !prev
      if (!next) {
        setSelectedIds(new Set())
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(filteredItems.map((i) => i.id)))
  }, [filteredItems])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleBatchFavorite = useCallback(() => {
    if (selectedIds.size === 0) return
    setItems((prev) => setFavoriteBatch(prev, Array.from(selectedIds), true))
    showToast(`已收藏 ${selectedIds.size} 项`)
  }, [selectedIds, showToast])

  const handleBatchUnfavorite = useCallback(() => {
    if (selectedIds.size === 0) return
    setItems((prev) => setFavoriteBatch(prev, Array.from(selectedIds), false))
    showToast(`已取消收藏 ${selectedIds.size} 项`)
  }, [selectedIds, showToast])

  const handleBatchDelete = useCallback(() => {
    if (selectedIds.size === 0) return
    setConfirmDialog({
      visible: true,
      title: '确认删除',
      message: `确定要删除选中的 ${selectedIds.size} 项吗？此操作不可撤销。`,
      onConfirm: () => {
        setItems((prev) => deleteMediaItems(prev, Array.from(selectedIds)))
        setSelectedIds(new Set())
        setSelectMode(false)
        showToast(`已删除 ${selectedIds.size} 项`)
      },
    })
  }, [selectedIds, showToast])

  const handleFilesAdded = useCallback(
    (newItems) => {
      setItems((prev) => {
        let result = prev
        for (const item of newItems) {
          result = addMediaItem(result, item)
        }
        return result
      })
      showToast(`已添加 ${newItems.length} 个文件`)
    },
    [showToast]
  )

  const handleUploadClick = useCallback(() => {
    uploadBtnRef.current?.querySelector('input')?.click()
  }, [])

  const handleSortOrderToggle = useCallback(() => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
  }, [])

  const handleToggleFavoriteOnly = useCallback(() => {
    setFavoriteOnly((prev) => !prev)
  }, [])

  return (
    <div className="mg-page">
      <FilterBar
        allTags={allTags}
        allTypes={allTypes}
        allDates={allDates}
        selectedTags={selectedTags}
        selectedTypes={selectedTypes}
        selectedDates={selectedDates}
        searchTerm={searchTerm}
        favoriteOnly={favoriteOnly}
        sortBy={sortBy}
        sortOrder={sortOrder}
        selectMode={selectMode}
        selectedCount={selectedIds.size}
        totalCount={items.length}
        onToggleTag={(t) =>
          setSelectedTags((prev) =>
            prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]
          )
        }
        onToggleType={(t) =>
          setSelectedTypes((prev) =>
            prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]
          )
        }
        onToggleDate={(d) =>
          setSelectedDates((prev) =>
            prev.includes(d) ? prev.filter((v) => v !== d) : [...prev, d]
          )
        }
        onSearchChange={setSearchTerm}
        onToggleFavoriteOnly={handleToggleFavoriteOnly}
        onSortChange={setSortBy}
        onSortOrderToggle={handleSortOrderToggle}
        onToggleSelectMode={handleToggleSelectMode}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onBatchFavorite={handleBatchFavorite}
        onBatchUnfavorite={handleBatchUnfavorite}
        onBatchDelete={handleBatchDelete}
        onUpload={handleUploadClick}
        onBack={handleBack}
      />

      <div ref={uploadBtnRef} style={{ display: 'none' }}>
        <UploadButton onFilesAdded={handleFilesAdded} />
      </div>

      <div className="mg-gallery-wrap">
        {filteredItems.length === 0 ? (
          <div className="mg-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p>暂无匹配的媒体文件</p>
            <span>尝试调整筛选条件，或上传新的文件</span>
            <UploadButton onFilesAdded={handleFilesAdded}>
              <button type="button" className="mg-btn mg-btn-primary">
                上传文件
              </button>
            </UploadButton>
          </div>
        ) : (
          <div className="mg-masonry">
            {filteredItems.map((item) => (
              <MediaThumb
                key={item.id}
                item={item}
                onClick={handleItemClick}
                selectMode={selectMode}
                selected={selectedIds.has(item.id)}
                onToggleSelect={handleToggleSelect}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxIndex != null && (
        <Lightbox
          items={filteredItems}
          currentIndex={lightboxIndex}
          onClose={handleCloseLightbox}
          onPrev={handlePrevLightbox}
          onNext={handleNextLightbox}
        />
      )}

      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="删除"
        onCancel={() => setConfirmDialog({ visible: false, title: '', message: '', onConfirm: null })}
        onConfirm={() => {
          confirmDialog.onConfirm?.()
          setConfirmDialog({ visible: false, title: '', message: '', onConfirm: null })
        }}
      />

      {toast && <div className={`mg-toast mg-toast-${toast.type}`}>{toast.message}</div>}
    </div>
  )
}

export default MediaGallery
