import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FONT_COLORS, FONT_SIZES, GRID_SIZE, PRESET_COLORS } from './constants.js'
import './sticky-wall.css'
import {
    addNote,
    archiveNote,
    bringToFront,
    createNote,
    deleteNote,
    formatTime,
    getActiveNotes,
    getArchivedNotes,
    loadFromStorage,
    loadSettings,
    moveNote,
    saveSettings,
    saveToStorage,
    sortNotesByZIndex,
    stripHtml,
    unarchiveNote,
    updateNote,
} from './stickyWallCore.js'

const StickyNote = ({
  note,
  isEditing,
  isDragging,
  onMouseDownHeader,
  onDoubleClickNote,
  onClickNote,
  onContentChange,
  onDelete,
  onArchive,
  onExitEdit,
  onToggleFormat,
  onFontSizeChange,
  onFontColorChange,
  onChangeColor,
}) => {
  const contentRef = useRef(null)

  const handleInput = (e) => {
    if (onContentChange) {
      onContentChange(note.id, e.target.innerHTML)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && isEditing) {
      e.preventDefault()
      onExitEdit?.(note.id)
    }
  }

  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.focus()
    }
  }, [isEditing])

  const contentStyle = {
    fontSize: `${note.fontSize || 14}px`,
    color: note.fontColor || '#1F2937',
    fontWeight: note.bold ? '700' : '400',
    fontStyle: note.italic ? 'italic' : 'normal',
    textDecoration: note.underline ? 'underline' : 'none',
  }

  const isEmpty = !note.content || stripHtml(note.content).trim() === ''

  return (
    <div
      className={`sw-note ${isEditing ? 'editing' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        backgroundColor: note.color,
        zIndex: note.zIndex,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClickNote?.(note.id)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClickNote?.(note.id)
      }}
    >
      <div
        className="sw-note-header"
        onMouseDown={(e) => {
          if (!isEditing) {
            e.stopPropagation()
            onMouseDownHeader?.(e, note.id)
          }
        }}
      >
        <span className="sw-note-time">{formatTime(note.createdAt)}</span>
        <div className="sw-note-actions">
          <button
            type="button"
            className="sw-note-action"
            title="归档"
            onClick={(e) => {
              e.stopPropagation()
              onArchive?.(note.id)
            }}
          >
            📁
          </button>
          <button
            type="button"
            className="sw-note-action delete"
            title="删除"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(note.id)
            }}
          >
            ×
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="sw-note-toolbar">
          <button
            type="button"
            className={`sw-toolbar-btn bold ${note.bold ? 'active' : ''}`}
            title="加粗"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFormat?.(note.id, 'bold')
            }}
          >
            B
          </button>
          <button
            type="button"
            className={`sw-toolbar-btn italic ${note.italic ? 'active' : ''}`}
            title="斜体"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFormat?.(note.id, 'italic')
            }}
          >
            I
          </button>
          <button
            type="button"
            className={`sw-toolbar-btn underline ${note.underline ? 'active' : ''}`}
            title="下划线"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFormat?.(note.id, 'underline')
            }}
          >
            U
          </button>
          <div className="sw-toolbar-divider" />
          <select
            className="sw-toolbar-select"
            value={note.fontSize || 14}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onFontSizeChange?.(note.id, Number(e.target.value))}
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
          <div className="sw-toolbar-divider" />
          {FONT_COLORS.slice(0, 5).map((color) => (
            <button
              key={color}
              type="button"
              className={`sw-toolbar-color ${note.fontColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              title={`字体颜色 ${color}`}
              onClick={(e) => {
                e.stopPropagation()
                onFontColorChange?.(note.id, color)
              }}
            />
          ))}
          <div className="sw-toolbar-divider" />
          {PRESET_COLORS.slice(0, 6).map((color) => (
            <button
              key={color}
              type="button"
              className={`sw-toolbar-color ${note.color === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              title={`便签颜色 ${color}`}
              onClick={(e) => {
                e.stopPropagation()
                onChangeColor?.(note.id, color)
              }}
            />
          ))}
        </div>
      )}

      <div
        ref={contentRef}
        className={`sw-note-content ${isEmpty && !isEditing ? 'empty' : ''}`}
        style={contentStyle}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder="双击编辑便签内容..."
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        dangerouslySetInnerHTML={{ __html: note.content || '' }}
      />
    </div>
  )
}

const ConfirmDialog = ({ title, message, onConfirm, onCancel }) => (
  <div className="sw-confirm-overlay" onClick={onCancel}>
    <div className="sw-confirm-dialog" onClick={(e) => e.stopPropagation()}>
      <h3 className="sw-confirm-title">{title}</h3>
      <p className="sw-confirm-message">{message}</p>
      <div className="sw-confirm-actions">
        <button type="button" className="sw-btn" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="sw-btn sw-btn-primary" onClick={onConfirm}>
          确认
        </button>
      </div>
    </div>
  </div>
)

const ArchiveDrawer = ({ open, archivedNotes, onClose, onRestore }) => (
  <>
    {open && <div className="sw-drawer-overlay" onClick={onClose} />}
    <div className={`sw-archive-drawer ${open ? 'open' : ''}`}>
      <div className="sw-archive-header">
        <h3 className="sw-archive-title">归档便签</h3>
        <button type="button" className="sw-archive-close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="sw-archive-list">
        {archivedNotes.length === 0 ? (
          <div className="sw-archive-empty">暂无归档便签</div>
        ) : (
          archivedNotes.map((note) => (
            <div
              key={note.id}
              className="sw-archive-item"
              style={{ backgroundColor: note.color }}
            >
              <div
                className="sw-archive-item-preview"
                dangerouslySetInnerHTML={{
                  __html: note.content || '<em>（空便签）</em>',
                }}
              />
              <div className="sw-archive-item-meta">
                <span className="sw-archive-item-time">{formatTime(note.archivedAt)}</span>
                <button
                  type="button"
                  className="sw-archive-item-restore"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRestore?.(note.id)
                  }}
                >
                  恢复
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </>
)

const StickyWallPage = () => {
  const [state, setState] = useState(() => loadFromStorage())
  const [settings, setSettings] = useState(() => loadSettings())
  const [editingId, setEditingId] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 700 })

  const canvasWrapperRef = useRef(null)
  const stateRef = useRef(state)
  const settingsRef = useRef(settings)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    saveToStorage(state)
  }, [state])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    const handleResize = () => {
      if (canvasWrapperRef.current) {
        const rect = canvasWrapperRef.current.getBoundingClientRect()
        setCanvasSize({ width: rect.width, height: rect.height })
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const activeNotes = sortNotesByZIndex(getActiveNotes(state))
  const archivedNotes = getArchivedNotes(state)

  const handleCreateNote = useCallback(() => {
    const note = createNote(canvasSize.width, canvasSize.height)
    setState((s) => addNote(s, note))
    setEditingId(note.id)
  }, [canvasSize])

  const handleDeleteNote = useCallback((noteId) => {
    setConfirmDelete(noteId)
  }, [])

  const confirmDeleteNote = useCallback(() => {
    if (confirmDelete) {
      setState((s) => deleteNote(s, confirmDelete))
      if (editingId === confirmDelete) {
        setEditingId(null)
      }
    }
    setConfirmDelete(null)
  }, [confirmDelete, editingId])

  const handleArchiveNote = useCallback((noteId) => {
    setState((s) => archiveNote(s, noteId))
    if (editingId === noteId) {
      setEditingId(null)
    }
  }, [editingId])

  const handleUnarchiveNote = useCallback((noteId) => {
    setState((s) => unarchiveNote(s, noteId))
  }, [])

  const handleBringToFront = useCallback((noteId) => {
    setState((s) => bringToFront(s, noteId))
  }, [])

  const handleContentChange = useCallback((noteId, content) => {
    setState((s) => updateNote(s, noteId, { content }))
  }, [])

  const handleExitEdit = useCallback((noteId) => {
    if (noteId && editingId !== noteId) return
    setEditingId(null)
  }, [editingId])

  const handleToggleFormat = useCallback((noteId, format) => {
    setState((s) => {
      const note = s.notes.find((n) => n.id === noteId)
      if (!note) return s
      return updateNote(s, noteId, { [format]: !note[format] })
    })
  }, [])

  const handleFontSizeChange = useCallback((noteId, size) => {
    setState((s) => updateNote(s, noteId, { fontSize: size }))
  }, [])

  const handleFontColorChange = useCallback((noteId, color) => {
    setState((s) => updateNote(s, noteId, { fontColor: color }))
  }, [])

  const handleChangeColor = useCallback((noteId, color) => {
    setState((s) => updateNote(s, noteId, { color }))
  }, [])

  const handleDoubleClickNote = useCallback((noteId) => {
    setEditingId(noteId)
    handleBringToFront(noteId)
  }, [handleBringToFront])

  const handleClickNote = useCallback((noteId) => {
    handleBringToFront(noteId)
  }, [handleBringToFront])

  const handleMouseDownHeader = useCallback((e, noteId) => {
    if (editingId) return
    const note = stateRef.current.notes.find((n) => n.id === noteId)
    if (!note) return
    handleBringToFront(noteId)
    setDraggingId(noteId)
    setDragOffset({
      x: e.clientX - note.x * settingsRef.current.zoom,
      y: e.clientY - note.y * settingsRef.current.zoom,
    })
  }, [editingId, handleBringToFront])

  useEffect(() => {
    if (!draggingId) return

    const handleMouseMove = (e) => {
      const zoom = settingsRef.current.zoom
      const newX = (e.clientX - dragOffset.x) / zoom
      const newY = (e.clientY - dragOffset.y) / zoom
      setState((s) => moveNote(s, draggingId, newX, newY, settingsRef.current.snapToGrid))
    }

    const handleMouseUp = () => {
      setDraggingId(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingId, dragOffset])

  const handleCanvasClick = useCallback(() => {
    if (editingId) {
      setEditingId(null)
    }
  }, [editingId])

  const handleZoomChange = useCallback((e) => {
    const zoomPercent = Number(e.target.value)
    const zoom = zoomPercent / 100
    setSettings((s) => ({ ...s, zoom }))
  }, [])

  const handleSnapToggle = useCallback((e) => {
    setSettings((s) => ({ ...s, snapToGrid: e.target.checked }))
  }, [])

  const zoomPercent = Math.round(settings.zoom * 100)

  return (
    <div className="sw-page">
      <header className="sw-header">
        <div className="sw-header-left">
          <Link to="/" className="sw-back-link">← 返回首页</Link>
          <h1 className="sw-title">便签墙</h1>
        </div>
        <div className="sw-header-right">
          <button type="button" className="sw-btn sw-btn-primary" onClick={handleCreateNote}>
            <span>＋</span> 新建便签
          </button>
          <button type="button" className="sw-btn" onClick={() => setArchiveOpen(true)}>
            📁 归档 ({archivedNotes.length})
          </button>
        </div>
      </header>

      <div className="sw-canvas-wrapper" ref={canvasWrapperRef}>
        <div
          className="sw-canvas"
          onClick={handleCanvasClick}
          style={{
            transform: `scale(${settings.zoom})`,
            width: `${canvasSize.width / settings.zoom}px`,
            height: `${canvasSize.height / settings.zoom}px`,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          }}
        >
          {activeNotes.length === 0 && !editingId && (
            <div className="sw-empty-tip">
              <div className="sw-empty-tip-icon">📝</div>
              <div className="sw-empty-tip-text">点击「新建便签」开始使用</div>
            </div>
          )}

          {activeNotes.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              isDragging={draggingId === note.id}
              onMouseDownHeader={handleMouseDownHeader}
              onDoubleClickNote={handleDoubleClickNote}
              onClickNote={handleClickNote}
              onContentChange={handleContentChange}
              onDelete={handleDeleteNote}
              onArchive={handleArchiveNote}
              onExitEdit={handleExitEdit}
              onToggleFormat={handleToggleFormat}
              onFontSizeChange={handleFontSizeChange}
              onFontColorChange={handleFontColorChange}
              onChangeColor={handleChangeColor}
            />
          ))}
        </div>

        <div className="sw-bottom-bar">
          <div className="sw-zoom-control">
            <span className="sw-zoom-label">{zoomPercent}%</span>
            <input
              type="range"
              className="sw-zoom-slider"
              min="50"
              max="200"
              value={zoomPercent}
              onChange={handleZoomChange}
            />
          </div>
          <label className="sw-settings-toggle">
            <input
              type="checkbox"
              checked={settings.snapToGrid}
              onChange={handleSnapToggle}
            />
            网格吸附
          </label>
        </div>
      </div>

      <ArchiveDrawer
        open={archiveOpen}
        archivedNotes={archivedNotes}
        onClose={() => setArchiveOpen(false)}
        onRestore={handleUnarchiveNote}
      />

      {confirmDelete && (
        <ConfirmDialog
          title="删除便签"
          message="确定要删除这张便签吗？此操作无法撤销。"
          onConfirm={confirmDeleteNote}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

export default StickyWallPage
