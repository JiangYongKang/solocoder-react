import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import './sticky-notes.css'
import {
  NOTE_COLORS,
  DEFAULT_TAGS,
  VIEW_GRID,
  VIEW_LIST,
  VIEW_MAIN,
  VIEW_ARCHIVE,
  VIEW_TRASH,
  REMINDER_STATUS_PENDING,
  REMINDER_STATUS_TRIGGERED,
  REMINDER_STATUS_DISMISSED,
  EXPIRE_OPTIONS,
} from './constants.js'
import {
  getContrastColor,
  formatDateTime,
  formatDate,
  calculateExpireDate,
  isExpired,
  shouldTriggerReminder,
  markReminderTriggered,
  markReminderDismissed,
  clearReminder,
  setReminder,
  filterByTags,
  searchNotes,
  createNote,
  updateNote,
  addTagToNote,
  removeTagFromNote,
  getAllTags,
  reorderNotes,
  moveNoteById,
  archiveNote,
  unarchiveNote,
  moveToTrash,
  restoreFromTrash,
  permanentlyDelete,
  getTrashRetentionDays,
  shouldAutoCleanTrash,
  autoCleanTrash,
  getTagColor,
  loadNotes,
  saveNotes,
  loadArchivedNotes,
  saveArchivedNotes,
  loadTrashNotes,
  saveTrashNotes,
  loadViewPreference,
  saveViewPreference,
  requestNotificationPermission,
  showBrowserNotification,
  isPageVisible,
  getTimeUntilReminder,
} from './stickyNotesUtils.js'

function ColorPicker({ selectedColor, onColorChange, textColor }) {
  return (
    <div className="sn-note-color-picker">
      {NOTE_COLORS.map(color => (
        <div
          key={color}
          className={`sn-color-option ${selectedColor === color ? 'sn-color-option-active' : ''}`}
          style={{ background: color }}
          onClick={() => onColorChange(color)}
          title={color}
        />
      ))}
    </div>
  )
}

function TagDropdown({ note, onAddTag, textColor }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const availableTags = DEFAULT_TAGS.filter(tag => !note.tags?.includes(tag))
  const isFull = note.tags?.length >= 3

  return (
    <div className="sn-tag-dropdown" ref={dropdownRef}>
      <button
        className="sn-tag-dropdown-btn"
        style={{ color: textColor }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isFull}
        title={isFull ? '最多添加3个标签' : '添加标签'}
      >
        + 标签
      </button>
      {isOpen && (
        <div className="sn-tag-dropdown-menu">
          {availableTags.length === 0 ? (
            <div style={{ padding: '8px', fontSize: '12px', color: 'var(--text)', opacity: 0.5 }}>
              没有可用标签
            </div>
          ) : (
            availableTags.map(tag => (
              <button
                key={tag}
                className="sn-tag-dropdown-item"
                onClick={() => {
                  onAddTag(tag)
                  setIsOpen(false)
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: getTagColor(tag),
                    marginRight: 8,
                  }}
                />
                {tag}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function NoteCard({
  note,
  view,
  onUpdate,
  onArchive,
  onDelete,
  onSetReminder,
  onSetExpire,
  onDragStart,
  onDragEnd,
  isDragging,
  isTrashed = false,
  isArchived = false,
  onRestore,
  onPermanentDelete,
  onUnarchive,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(note.title)
  const [editContent, setEditContent] = useState(note.content)
  const textColor = getContrastColor(note.color)
  const timeUntil = note.reminderAt ? getTimeUntilReminder(note.reminderAt) : null
  const expired = isExpired(note)
  const retentionDays = isTrashed ? getTrashRetentionDays(note) : null
  const cardRef = useRef(null)

  const readOnly = isTrashed || isArchived || !isEditing

  useEffect(() => {
    setEditTitle(note.title)
    setEditContent(note.content)
  }, [note.title, note.content])

  useEffect(() => {
    if (!isEditing) return
    function handleClickOutside(e) {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        handleFinishEdit()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditing, editTitle, editContent])

  const handleFinishEdit = () => {
    if (editTitle !== note.title || editContent !== note.content) {
      onUpdate(note.id, { title: editTitle, content: editContent })
    }
    setIsEditing(false)
  }

  const handleTitleChange = (e) => {
    if (isEditing) {
      setEditTitle(e.target.value)
    }
  }

  const handleContentChange = (e) => {
    if (isEditing) {
      setEditContent(e.target.value)
    }
  }

  const handleColorChange = (color) => {
    onUpdate(note.id, { color })
  }

  const handleAddTag = (tag) => {
    const updated = addTagToNote(note, tag)
    onUpdate(note.id, { tags: updated.tags })
  }

  const handleRemoveTag = (tag) => {
    const updated = removeTagFromNote(note, tag)
    onUpdate(note.id, { tags: updated.tags })
  }

  const handleDoubleClick = (e) => {
    if (!isTrashed && !isArchived && !isEditing) {
      e.stopPropagation()
      setIsEditing(true)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setEditTitle(note.title)
      setEditContent(note.content)
      setIsEditing(false)
    }
  }

  const cardClass = view === VIEW_LIST
    ? `sn-note-card-list ${isDragging ? 'dragging' : ''} ${isTrashed ? 'sn-trash-item' : ''} ${isArchived ? 'sn-archived-item' : ''}`
    : `sn-note-card ${isDragging ? 'dragging' : ''} ${isTrashed ? 'sn-trash-item' : ''} ${isArchived ? 'sn-archived-item' : ''}`

  if (view === VIEW_LIST) {
    return (
      <div
        ref={cardRef}
        className={cardClass}
        style={{ background: note.color, color: textColor }}
        draggable={!isTrashed && !isArchived && !isEditing}
        onDragStart={(e) => onDragStart?.(e, note)}
        onDragEnd={onDragEnd}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <input
              className="sn-note-title-list-edit"
              style={{ color: textColor }}
              value={editTitle}
              onChange={handleTitleChange}
              placeholder="标题..."
              autoFocus
            />
          ) : (
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {note.title || '无标题'}
            </div>
          )}
          {isEditing ? (
            <textarea
              className="sn-note-content-list-edit"
              style={{ color: textColor }}
              value={editContent}
              onChange={handleContentChange}
              placeholder="写点什么..."
              rows={2}
            />
          ) : (
            <div className="sn-note-content-list" style={{ color: textColor }}>
              {note.content || '无内容'}
            </div>
          )}
        </div>

        <div className="sn-note-tags">
          {note.tags?.map(tag => (
            <span
              key={tag}
              className="sn-note-tag"
              style={{ background: getTagColor(tag) }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div style={{ fontSize: 11, opacity: 0.7, whiteSpace: 'nowrap' }}>
          {formatDate(note.createdAt)}
        </div>

        {expired && (
          <span className="sn-expired-badge">已过期</span>
        )}

        {isTrashed && (
          <span className="sn-retention-days">
            剩余 {retentionDays} 天
          </span>
        )}

        <div className="sn-note-actions">
          {isTrashed ? (
            <>
              <button
                className="sn-action-btn"
                style={{ color: textColor }}
                onClick={() => onRestore?.(note.id)}
                title="恢复"
              >
                ↩
              </button>
              <button
                className="sn-action-btn sn-action-btn-danger"
                onClick={() => onPermanentDelete?.(note.id)}
                title="永久删除"
              >
                ✕
              </button>
            </>
          ) : isArchived ? (
            <>
              <button
                className="sn-action-btn"
                style={{ color: textColor }}
                onClick={() => onUnarchive?.(note.id)}
                title="取消归档"
              >
                ↩
              </button>
              <button
                className="sn-action-btn sn-action-btn-danger"
                onClick={() => onDelete?.(note.id)}
                title="删除"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <button
                className="sn-action-btn"
                style={{ color: textColor }}
                onClick={() => onSetReminder?.(note)}
                title="设置提醒"
              >
                ⏰
              </button>
              <button
                className="sn-action-btn"
                style={{ color: textColor }}
                onClick={() => onArchive?.(note.id)}
                title="归档"
              >
                📦
              </button>
              <button
                className="sn-action-btn sn-action-btn-danger"
                onClick={() => onDelete?.(note.id)}
                title="删除"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={cardRef}
      className={`${cardClass} ${isEditing ? 'sn-note-editing' : ''}`}
      style={{ background: note.color, color: textColor }}
      draggable={!isTrashed && !isArchived && !isEditing}
      onDragStart={(e) => onDragStart?.(e, note)}
      onDragEnd={onDragEnd}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="sn-note-header">
        {isEditing ? (
          <textarea
            className="sn-note-title"
            style={{ color: textColor }}
            value={editTitle}
            onChange={handleTitleChange}
            placeholder="标题..."
            rows={1}
            autoFocus
          />
        ) : (
          <div className="sn-note-title sn-note-title-readonly" style={{ color: textColor }}>
            {note.title || '无标题'}
          </div>
        )}
        {!isTrashed && !isArchived && (
          <ColorPicker
            selectedColor={note.color}
            onColorChange={handleColorChange}
            textColor={textColor}
          />
        )}
      </div>

      {isEditing ? (
        <textarea
          className="sn-note-content"
          style={{ color: textColor }}
          value={editContent}
          onChange={handleContentChange}
          placeholder="写点什么..."
        />
      ) : (
        <div className="sn-note-content sn-note-content-readonly" style={{ color: textColor }}>
          {note.content || '无内容'}
        </div>
      )}

      <div className="sn-note-tags">
        {note.tags?.map(tag => (
          <span
            key={tag}
            className="sn-note-tag"
            style={{ background: getTagColor(tag) }}
          >
            {tag}
            {!isTrashed && !isArchived && (
              <span
                className="sn-note-tag-remove"
                onClick={() => handleRemoveTag(tag)}
              >
                ✕
              </span>
            )}
          </span>
        ))}
        {!isTrashed && !isArchived && note.tags?.length < 3 && (
          <TagDropdown
            note={note}
            onAddTag={handleAddTag}
            textColor={textColor}
          />
        )}
      </div>

      <div className="sn-note-footer">
        <div className="sn-note-meta">
          <span>创建: {formatDate(note.createdAt)}</span>
          {note.reminderAt && (
            <span className={`sn-reminder-badge ${note.reminderStatus === REMINDER_STATUS_TRIGGERED ? 'triggered' : ''} ${note.reminderStatus === REMINDER_STATUS_DISMISSED ? 'dismissed' : ''}`}>
              ⏰ {formatDateTime(note.reminderAt)}
              {timeUntil && !timeUntil.expired && note.reminderStatus === REMINDER_STATUS_PENDING && ` (${timeUntil.text})`}
              {note.reminderStatus === REMINDER_STATUS_TRIGGERED && ' (已提醒)'}
              {note.reminderStatus === REMINDER_STATUS_DISMISSED && ' (已忽略)'}
            </span>
          )}
          {expired && (
            <span className="sn-expired-badge">
              已过期 {formatDate(note.expireAt)}
            </span>
          )}
          {isTrashed && (
            <span className="sn-retention-days">
              剩余 {retentionDays} 天自动清理
            </span>
          )}
        </div>

        <div className="sn-note-actions">
          {isEditing && !isTrashed && !isArchived ? (
            <>
              <button
                className="sn-action-btn"
                style={{ color: textColor }}
                onClick={handleFinishEdit}
                title="完成编辑"
              >
                ✓ 完成
              </button>
              <button
                className="sn-action-btn"
                style={{ color: textColor }}
                onClick={() => {
                  setEditTitle(note.title)
                  setEditContent(note.content)
                  setIsEditing(false)
                }}
                title="取消编辑"
              >
                ✕ 取消
              </button>
            </>
          ) : isTrashed ? (
            <>
              <button
                className="sn-action-btn"
                style={{ color: textColor }}
                onClick={() => onRestore?.(note.id)}
                title="恢复"
              >
                恢复
              </button>
              <button
                className="sn-action-btn sn-action-btn-danger"
                onClick={() => onPermanentDelete?.(note.id)}
                title="永久删除"
              >
                永久删除
              </button>
            </>
          ) : isArchived ? (
            <>
              <button
                className="sn-action-btn"
                style={{ color: textColor }}
                onClick={() => onUnarchive?.(note.id)}
                title="取消归档"
              >
                取消归档
              </button>
              <button
                className="sn-action-btn sn-action-btn-danger"
                onClick={() => onDelete?.(note.id)}
                title="删除"
              >
                删除
              </button>
            </>
          ) : (
            <>
              <button
                className="sn-action-btn"
                style={{ color: textColor }}
                onClick={() => onSetReminder?.(note)}
                title="设置提醒"
              >
                ⏰ 提醒
              </button>
              <button
                className="sn-action-btn"
                style={{ color: textColor }}
                onClick={() => onSetExpire?.(note)}
                title="设置过期"
              >
                📅 过期
              </button>
              <button
                className="sn-action-btn"
                style={{ color: textColor }}
                onClick={() => onArchive?.(note.id)}
                title="归档"
              >
                📦 归档
              </button>
              <button
                className="sn-action-btn sn-action-btn-danger"
                onClick={() => onDelete?.(note.id)}
                title="删除"
              >
                ✕ 删除
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ReminderModal({ note, onClose, onSave }) {
  const [reminderDate, setReminderDate] = useState(
    note?.reminderAt ? formatDate(note.reminderAt) : ''
  )
  const [reminderTime, setReminderTime] = useState(
    note?.reminderAt
      ? `${String(new Date(note.reminderAt).getHours()).padStart(2, '0')}:${String(new Date(note.reminderAt).getMinutes()).padStart(2, '0')}`
      : '09:00'
  )

  const handleSave = () => {
    if (!reminderDate) {
      onSave(null)
      return
    }
    const [year, month, day] = reminderDate.split('-').map(Number)
    const [hours, minutes] = reminderTime.split(':').map(Number)
    const reminderAt = new Date(year, month - 1, day, hours, minutes).getTime()
    onSave(reminderAt)
  }

  const handleClear = () => {
    onSave(null)
  }

  return (
    <div className="sn-modal-overlay" onClick={onClose}>
      <div className="sn-modal" onClick={e => e.stopPropagation()}>
        <div className="sn-modal-header">
          <h3 className="sn-modal-title">设置提醒</h3>
          <button className="sn-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="sn-form-row">
          <div className="sn-form-field">
            <label className="sn-form-label">日期</label>
            <input
              type="date"
              className="sn-form-input"
              value={reminderDate}
              onChange={e => setReminderDate(e.target.value)}
              min={formatDate(Date.now())}
            />
          </div>
          <div className="sn-form-field">
            <label className="sn-form-label">时间</label>
            <input
              type="time"
              className="sn-form-input"
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
            />
          </div>
        </div>

        <div className="sn-modal-actions">
          <button className="sn-btn sn-btn-ghost" onClick={handleClear}>
            清除提醒
          </button>
          <button className="sn-btn sn-btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="sn-btn sn-btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

function ExpireModal({ note, onClose, onSave }) {
  const [expireOption, setExpireOption] = useState('3days')
  const [customDate, setCustomDate] = useState('')

  const handleSave = () => {
    const expireAt = calculateExpireDate(
      expireOption,
      expireOption === 'custom' ? customDate : null
    )
    onSave(expireAt)
  }

  const handleClear = () => {
    onSave(null)
  }

  return (
    <div className="sn-modal-overlay" onClick={onClose}>
      <div className="sn-modal" onClick={e => e.stopPropagation()}>
        <div className="sn-modal-header">
          <h3 className="sn-modal-title">设置过期日期</h3>
          <button className="sn-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="sn-form-field">
          <label className="sn-form-label">过期选项</label>
          <select
            className="sn-form-input"
            value={expireOption}
            onChange={e => setExpireOption(e.target.value)}
          >
            {EXPIRE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {expireOption === 'custom' && (
          <div className="sn-form-field">
            <label className="sn-form-label">自定义日期</label>
            <input
              type="date"
              className="sn-form-input"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              min={formatDate(Date.now())}
            />
          </div>
        )}

        <div className="sn-modal-actions">
          <button className="sn-btn sn-btn-ghost" onClick={handleClear}>
            清除过期
          </button>
          <button className="sn-btn sn-btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="sn-btn sn-btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

function NotificationToast({ notification, onClose }) {
  return (
    <div className="sn-notification">
      <div className="sn-notification-header">
        <span className="sn-notification-title">
          <span className="sn-notification-icon">⏰</span>
          {notification.title || '便签提醒'}
        </span>
        <button className="sn-notification-close" onClick={() => onClose(notification.id)}>
          ✕
        </button>
      </div>
      <div className="sn-notification-body">
        {notification.body}
      </div>
    </div>
  )
}

export default function StickyNotesPage() {
  const [notes, setNotes] = useState(() => loadNotes())
  const [archivedNotes, setArchivedNotes] = useState(() => loadArchivedNotes())
  const [trashNotes, setTrashNotes] = useState(() => loadTrashNotes())
  const [view, setView] = useState(() => loadViewPreference())
  const [currentTab, setCurrentTab] = useState(VIEW_MAIN)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [reminderModalNote, setReminderModalNote] = useState(null)
  const [expireModalNote, setExpireModalNote] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [pendingReminders, setPendingReminders] = useState([])
  const [draggingNoteId, setDraggingNoteId] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  const wasHiddenRef = useRef(false)

  useEffect(() => { saveNotes(notes) }, [notes])
  useEffect(() => { saveArchivedNotes(archivedNotes) }, [archivedNotes])
  useEffect(() => { saveTrashNotes(trashNotes) }, [trashNotes])
  useEffect(() => { saveViewPreference(view) }, [view])

  useEffect(() => {
    const cleaned = autoCleanTrash(trashNotes)
    if (cleaned.length !== trashNotes.length) {
      setTrashNotes(cleaned)
    }
  }, [trashNotes])

  const checkReminders = useCallback(() => {
    const now = Date.now()
    const visible = isPageVisible()

    notes.forEach(note => {
      if (shouldTriggerReminder(note, now)) {
        if (visible) {
          const notificationId = `notif_${note.id}_${Date.now()}`
          setNotifications(prev => [...prev, {
            id: notificationId,
            noteId: note.id,
            title: note.title || '便签提醒',
            body: note.content || '您有一个便签提醒到达了',
          }])

          if (notificationPermission === 'granted') {
            showBrowserNotification(note.title || '便签提醒', note.content || '')
          }

          setNotes(prev => markReminderTriggered(prev, note.id))
        } else {
          setPendingReminders(prev => {
            if (prev.find(p => p.noteId === note.id)) return prev
            return [...prev, { noteId: note.id, note }]
          })
        }
      }
    })
  }, [notes, notificationPermission])

  useEffect(() => {
    const interval = setInterval(checkReminders, 1000)
    return () => clearInterval(interval)
  }, [checkReminders])

  useEffect(() => {
    function handleVisibilityChange() {
      if (isPageVisible() && wasHiddenRef.current) {
        pendingReminders.forEach(({ noteId, note }) => {
          const notificationId = `notif_${noteId}_${Date.now()}`
          setNotifications(prev => [...prev, {
            id: notificationId,
            noteId: noteId,
            title: note.title || '便签提醒',
            body: note.content || '您有一个便签提醒到达了',
          }])
          setNotes(prev => markReminderTriggered(prev, noteId))
        })
        setPendingReminders([])
        wasHiddenRef.current = false
      } else if (!isPageVisible()) {
        wasHiddenRef.current = true
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pendingReminders])

  useEffect(() => {
    checkReminders()
  }, [checkReminders])

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission()
    setNotificationPermission(result)
  }

  const handleCloseNotification = (notificationId) => {
    setNotifications(prev => {
      const notif = prev.find(n => n.id === notificationId)
      if (notif && notif.noteId) {
        setNotes(prevNotes => markReminderDismissed(prevNotes, notif.noteId))
      }
      return prev.filter(n => n.id !== notificationId)
    })
  }

  const handleCreateNote = useCallback(() => {
    const newNote = createNote()
    setNotes(prev => [newNote, ...prev].map((n, i) => ({ ...n, order: i })))
  }, [])

  const handleUpdateNote = useCallback((noteId, updates) => {
    setNotes(prev => updateNote(prev, noteId, updates))
  }, [])

  const handleArchiveNote = useCallback((noteId) => {
    const result = archiveNote(notes, archivedNotes, noteId)
    setNotes(result.notes)
    setArchivedNotes(result.archivedNotes)
  }, [notes, archivedNotes])

  const handleUnarchiveNote = useCallback((noteId) => {
    const result = unarchiveNote(notes, archivedNotes, noteId)
    setNotes(result.notes)
    setArchivedNotes(result.archivedNotes)
  }, [notes, archivedNotes])

  const handleDeleteNote = useCallback((noteId) => {
    if (currentTab === VIEW_ARCHIVE) {
      const result = moveToTrash(archivedNotes, trashNotes, noteId)
      setArchivedNotes(result.notes)
      setTrashNotes(result.trashNotes)
    } else {
      const result = moveToTrash(notes, trashNotes, noteId)
      setNotes(result.notes)
      setTrashNotes(result.trashNotes)
    }
  }, [notes, archivedNotes, trashNotes, currentTab])

  const handleRestoreNote = useCallback((noteId) => {
    const result = restoreFromTrash(notes, trashNotes, noteId)
    setNotes(result.notes)
    setTrashNotes(result.trashNotes)
  }, [notes, trashNotes])

  const handlePermanentDelete = useCallback((noteId) => {
    setTrashNotes(prev => permanentlyDelete(prev, noteId))
  }, [])

  const handleSetReminder = useCallback((note) => {
    setReminderModalNote(note)
  }, [])

  const handleSaveReminder = useCallback((reminderAt) => {
    if (reminderModalNote) {
      if (reminderAt) {
        setNotes(prev => setReminder(prev, reminderModalNote.id, reminderAt))
      } else {
        setNotes(prev => clearReminder(prev, reminderModalNote.id))
      }
    }
    setReminderModalNote(null)
  }, [reminderModalNote])

  const handleSetExpire = useCallback((note) => {
    setExpireModalNote(note)
  }, [])

  const handleSaveExpire = useCallback((expireAt) => {
    if (expireModalNote) {
      setNotes(prev => updateNote(prev, expireModalNote.id, { expireAt }))
    }
    setExpireModalNote(null)
  }, [expireModalNote])

  const handleTagToggle = useCallback((tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      }
      return [...prev, tag]
    })
  }, [])

  const handleClearTags = useCallback(() => {
    setSelectedTags([])
  }, [])

  const handleDragStart = useCallback((e, note) => {
    setDraggingNoteId(note.id)
    try {
      e.dataTransfer.setData('text/plain', note.id)
    } catch { /* ignore */ }
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingNoteId(null)
    setDropIndex(null)
  }, [])

  const getDropIndex = useCallback((container, clientY) => {
    const children = container.children
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child.dataset || child.dataset.index === undefined) continue
      const rect = child.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      if (clientY < midpoint) return i
    }
    return children.length
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    if (!draggingNoteId) return
    const container = e.currentTarget
    const targetIndex = getDropIndex(container, e.clientY)
    setDropIndex(targetIndex)
  }, [draggingNoteId, getDropIndex])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    if (!draggingNoteId) return

    const container = e.currentTarget
    const targetIndex = getDropIndex(container, e.clientY)

    if (currentTab === VIEW_MAIN) {
      setNotes(prev => moveNoteById(prev, draggingNoteId, targetIndex))
    }

    setDraggingNoteId(null)
    setDropIndex(null)
  }, [draggingNoteId, currentTab, getDropIndex])

  const handlePageClick = useCallback((e) => {
    if (e.target === e.currentTarget && currentTab === VIEW_MAIN) {
      handleCreateNote()
    }
  }, [currentTab, handleCreateNote])

  const allTags = getAllTags([...notes, ...archivedNotes, ...trashNotes])

  let displayNotes = []
  if (currentTab === VIEW_MAIN) {
    displayNotes = notes
  } else if (currentTab === VIEW_ARCHIVE) {
    displayNotes = archivedNotes
  } else if (currentTab === VIEW_TRASH) {
    displayNotes = trashNotes
  }

  if (currentTab === VIEW_MAIN) {
    displayNotes = filterByTags(displayNotes, selectedTags)
    displayNotes = searchNotes(displayNotes, searchQuery)
  }

  const containerClass = view === VIEW_GRID ? 'sn-notes-grid' : 'sn-notes-list'

  return (
    <div className="sn-page" onClick={handlePageClick}>
      <div className="sn-header">
        <div className="sn-header-left">
          <Link to="/" className="sn-back-link">← 返回首页</Link>
          <h1 className="sn-title">便签提醒</h1>
        </div>

        <div className="sn-header-right">
          <div className="sn-search-bar">
            <span className="sn-search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索便签..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          <div className="sn-view-toggle">
            <button
              className={`sn-view-btn ${view === VIEW_GRID ? 'sn-view-btn-active' : ''}`}
              onClick={() => setView(VIEW_GRID)}
            >
              网格
            </button>
            <button
              className={`sn-view-btn ${view === VIEW_LIST ? 'sn-view-btn-active' : ''}`}
              onClick={() => setView(VIEW_LIST)}
            >
              列表
            </button>
          </div>
        </div>
      </div>

      {notificationPermission !== 'granted' && notificationPermission !== 'denied' && notificationPermission !== 'unsupported' && (
        <div className="sn-permission-banner" onClick={e => e.stopPropagation()}>
          <span className="sn-permission-text">
            🔔 开启浏览器通知权限，以便在便签提醒到达时收到通知
          </span>
          <button className="sn-permission-btn" onClick={handleRequestPermission}>
            开启通知
          </button>
        </div>
      )}

      <div className="sn-nav-tabs" onClick={e => e.stopPropagation()}>
        <button
          className={`sn-nav-tab ${currentTab === VIEW_MAIN ? 'sn-nav-tab-active' : ''}`}
          onClick={() => setCurrentTab(VIEW_MAIN)}
        >
          全部 ({notes.length})
        </button>
        <button
          className={`sn-nav-tab ${currentTab === VIEW_ARCHIVE ? 'sn-nav-tab-active' : ''}`}
          onClick={() => setCurrentTab(VIEW_ARCHIVE)}
        >
          归档 ({archivedNotes.length})
        </button>
        <button
          className={`sn-nav-tab ${currentTab === VIEW_TRASH ? 'sn-nav-tab-active' : ''}`}
          onClick={() => setCurrentTab(VIEW_TRASH)}
        >
          回收站 ({trashNotes.length})
        </button>
      </div>

      {currentTab === VIEW_MAIN && allTags.length > 0 && (
        <div className="sn-tag-filter-bar" onClick={e => e.stopPropagation()}>
          <span className="sn-tag-filter-label">标签筛选:</span>
          <button
            className={`sn-tag-chip sn-tag-chip-all ${selectedTags.length === 0 ? 'sn-tag-chip-active' : ''}`}
            onClick={handleClearTags}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`sn-tag-chip ${selectedTags.includes(tag) ? 'sn-tag-chip-active' : ''}`}
              style={{ background: getTagColor(tag) }}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button className="sn-clear-tags-btn" onClick={handleClearTags}>
              清除筛选 ({selectedTags.length})
            </button>
          )}
        </div>
      )}

      <div
        className={`sn-notes-container ${containerClass}`}
        onClick={e => e.stopPropagation()}
        onDragOver={currentTab === VIEW_MAIN ? handleDragOver : undefined}
        onDrop={currentTab === VIEW_MAIN ? handleDrop : undefined}
      >
        {displayNotes.length === 0 ? (
          <div className="sn-empty-state">
            <div className="sn-empty-state-icon">
              {currentTab === VIEW_TRASH ? '🗑️' : currentTab === VIEW_ARCHIVE ? '📦' : '📝'}
            </div>
            <div className="sn-empty-state-text">
              {currentTab === VIEW_TRASH
                ? '回收站是空的'
                : currentTab === VIEW_ARCHIVE
                ? '归档区是空的'
                : searchQuery || selectedTags.length > 0
                ? '没有找到匹配的便签'
                : '点击右下角 + 按钮或页面空白处创建新便签'}
            </div>
          </div>
        ) : (
          displayNotes.map((note, index) => (
            <div key={note.id} data-index={index}>
              {dropIndex === index && draggingNoteId && (
                <div className="sn-drop-indicator" />
              )}
              <NoteCard
                note={note}
                view={view}
                onUpdate={handleUpdateNote}
                onArchive={handleArchiveNote}
                onDelete={handleDeleteNote}
                onSetReminder={handleSetReminder}
                onSetExpire={handleSetExpire}
                onDragStart={currentTab === VIEW_MAIN ? handleDragStart : undefined}
                onDragEnd={currentTab === VIEW_MAIN ? handleDragEnd : undefined}
                isDragging={draggingNoteId === note.id}
                isTrashed={currentTab === VIEW_TRASH}
                isArchived={currentTab === VIEW_ARCHIVE}
                onRestore={handleRestoreNote}
                onPermanentDelete={handlePermanentDelete}
                onUnarchive={handleUnarchiveNote}
              />
            </div>
          ))
        )}
        {dropIndex === displayNotes.length && draggingNoteId && (
          <div className="sn-drop-indicator" />
        )}
      </div>

      {currentTab === VIEW_MAIN && (
        <button
          className="sn-add-note-btn"
          onClick={(e) => {
            e.stopPropagation()
            handleCreateNote()
          }}
          title="新建便签"
        >
          +
        </button>
      )}

      {reminderModalNote && (
        <ReminderModal
          note={reminderModalNote}
          onClose={() => setReminderModalNote(null)}
          onSave={handleSaveReminder}
        />
      )}

      {expireModalNote && (
        <ExpireModal
          note={expireModalNote}
          onClose={() => setExpireModalNote(null)}
          onSave={handleSaveExpire}
        />
      )}

      {notifications.length > 0 && (
        <div className="sn-notification-container">
          {notifications.map(notification => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onClose={handleCloseNotification}
            />
          ))}
        </div>
      )}
    </div>
  )
}
