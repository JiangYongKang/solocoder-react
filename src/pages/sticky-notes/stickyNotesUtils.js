import {
  NOTE_COLORS,
  DEFAULT_TAGS,
  TAG_COLORS,
  TRASH_RETENTION_DAYS,
  REMINDER_STATUS_PENDING,
  REMINDER_STATUS_TRIGGERED,
  REMINDER_STATUS_DISMISSED,
  STORAGE_KEY_NOTES,
  STORAGE_KEY_VIEW,
  STORAGE_KEY_TRASH,
  STORAGE_KEY_ARCHIVE,
  VIEW_GRID,
} from './constants.js'

export function generateId() {
  return 'sn_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function getContrastColor(hexColor) {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#333333' : '#ffffff'
}

export function formatDateTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(baseDate, days) {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + days)
  return date.getTime()
}

export function calculateExpireDate(option, customDate = null) {
  const now = Date.now()
  switch (option) {
    case '3days':
      return addDays(now, 3)
    case '1week':
      return addDays(now, 7)
    case '2weeks':
      return addDays(now, 14)
    case '1month':
      return addDays(now, 30)
    case 'custom':
      return customDate ? new Date(customDate).getTime() : null
    default:
      return null
  }
}

export function isExpired(note, now = Date.now()) {
  if (!note || !note.expireAt) return false
  return note.expireAt < now
}

export function shouldTriggerReminder(note, now = Date.now()) {
  if (!note || !note.reminderAt) return false
  if (note.reminderStatus === REMINDER_STATUS_TRIGGERED) return false
  if (note.reminderStatus === REMINDER_STATUS_DISMISSED) return false
  return note.reminderAt <= now
}

export function markReminderTriggered(notes, noteId) {
  return notes.map(note =>
    note.id === noteId
      ? { ...note, reminderStatus: REMINDER_STATUS_TRIGGERED }
      : note
  )
}

export function markReminderDismissed(notes, noteId) {
  return notes.map(note =>
    note.id === noteId
      ? { ...note, reminderStatus: REMINDER_STATUS_DISMISSED }
      : note
  )
}

export function clearReminder(notes, noteId) {
  return notes.map(note =>
    note.id === noteId
      ? { ...note, reminderAt: null, reminderStatus: REMINDER_STATUS_PENDING }
      : note
  )
}

export function setReminder(notes, noteId, reminderAt) {
  return notes.map(note =>
    note.id === noteId
      ? { ...note, reminderAt, reminderStatus: reminderAt ? REMINDER_STATUS_PENDING : REMINDER_STATUS_PENDING }
      : note
  )
}

export function filterByTags(notes, selectedTags) {
  if (!selectedTags || selectedTags.length === 0) return notes
  return notes.filter(note =>
    selectedTags.every(tag => note.tags?.includes(tag))
  )
}

export function searchNotes(notes, query) {
  if (!query || !query.trim()) return notes
  const lowerQuery = query.trim().toLowerCase()
  return notes.filter(note =>
    note.title?.toLowerCase().includes(lowerQuery) ||
    note.content?.toLowerCase().includes(lowerQuery)
  )
}

export function filterExpiredNotes(notes, now = Date.now()) {
  return notes.filter(note => isExpired(note, now))
}

export function filterActiveNotes(notes, now = Date.now()) {
  return notes.filter(note => !isExpired(note, now))
}

export function createNote(overrides = {}) {
  const now = Date.now()
  return {
    id: generateId(),
    title: '',
    content: '',
    color: overrides.color || NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
    tags: [],
    reminderAt: null,
    reminderStatus: REMINDER_STATUS_PENDING,
    expireAt: null,
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function updateNote(notes, noteId, updates) {
  return notes.map(note =>
    note.id === noteId
      ? { ...note, ...updates, updatedAt: Date.now() }
      : note
  )
}

export function deleteNote(notes, noteId) {
  return notes.filter(note => note.id !== noteId)
}

export function addTagToNote(note, tag) {
  if (!note.tags) note.tags = []
  if (note.tags.includes(tag)) return note
  if (note.tags.length >= 3) return note
  if (!DEFAULT_TAGS.includes(tag)) return note
  return { ...note, tags: [...note.tags, tag] }
}

export function removeTagFromNote(note, tag) {
  if (!note.tags) return note
  return { ...note, tags: note.tags.filter(t => t !== tag) }
}

export function getAllTags(notes) {
  const tagSet = new Set()
  notes.forEach(note => {
    note.tags?.forEach(tag => tagSet.add(tag))
  })
  return Array.from(tagSet)
}

export function reorderNotes(notes, fromIndex, toIndex) {
  const result = [...notes]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result.map((note, idx) => ({ ...note, order: idx }))
}

export function moveNoteById(notes, noteId, targetIndex) {
  const fromIndex = notes.findIndex(n => n.id === noteId)
  if (fromIndex === -1) return notes
  const adjustedIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex
  return reorderNotes(notes, fromIndex, adjustedIndex)
}

export function archiveNote(notes, archivedNotes, noteId) {
  const note = notes.find(n => n.id === noteId)
  if (!note) return { notes, archivedNotes }
  const archivedNote = { ...note, archivedAt: Date.now() }
  return {
    notes: notes.filter(n => n.id !== noteId),
    archivedNotes: [...archivedNotes, archivedNote],
  }
}

export function unarchiveNote(notes, archivedNotes, noteId) {
  const note = archivedNotes.find(n => n.id === noteId)
  if (!note) return { notes, archivedNotes }
  const { archivedAt, ...restoredNote } = note
  return {
    notes: [...notes, { ...restoredNote, updatedAt: Date.now() }],
    archivedNotes: archivedNotes.filter(n => n.id !== noteId),
  }
}

export function moveToTrash(notes, trashNotes, noteId) {
  const note = notes.find(n => n.id === noteId)
  if (!note) return { notes, trashNotes }
  const trashedNote = { ...note, trashedAt: Date.now() }
  return {
    notes: notes.filter(n => n.id !== noteId),
    trashNotes: [...trashNotes, trashedNote],
  }
}

export function restoreFromTrash(notes, trashNotes, noteId) {
  const note = trashNotes.find(n => n.id === noteId)
  if (!note) return { notes, trashNotes }
  const { trashedAt, ...restoredNote } = note
  return {
    notes: [...notes, { ...restoredNote, updatedAt: Date.now() }],
    trashNotes: trashNotes.filter(n => n.id !== noteId),
  }
}

export function permanentlyDelete(trashNotes, noteId) {
  return trashNotes.filter(n => n.id !== noteId)
}

export function getTrashRetentionDays(trashNote, now = Date.now()) {
  if (!trashNote || !trashNote.trashedAt) return TRASH_RETENTION_DAYS
  const elapsedMs = now - trashNote.trashedAt
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24))
  return Math.max(0, TRASH_RETENTION_DAYS - elapsedDays)
}

export function shouldAutoCleanTrash(trashNote, now = Date.now()) {
  return getTrashRetentionDays(trashNote, now) <= 0
}

export function autoCleanTrash(trashNotes, now = Date.now()) {
  return trashNotes.filter(note => !shouldAutoCleanTrash(note, now))
}

export function getTagColor(tag) {
  return TAG_COLORS[tag] || '#6b7280'
}

export function loadNotes(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY_NOTES)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveNotes(notes, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes))
  } catch {
    // ignore
  }
}

export function loadArchivedNotes(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY_ARCHIVE)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveArchivedNotes(notes, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY_ARCHIVE, JSON.stringify(notes))
  } catch {
    // ignore
  }
}

export function loadTrashNotes(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY_TRASH)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveTrashNotes(notes, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY_TRASH, JSON.stringify(notes))
  } catch {
    // ignore
  }
}

export function loadViewPreference(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return VIEW_GRID
  try {
    const raw = storage.getItem(STORAGE_KEY_VIEW)
    return raw || VIEW_GRID
  } catch {
    return VIEW_GRID
  }
}

export function saveViewPreference(view, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY_VIEW, view)
  } catch {
    // ignore
  }
}

export function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return Promise.resolve('unsupported')
  if (Notification.permission === 'granted') return Promise.resolve('granted')
  if (Notification.permission === 'denied') return Promise.resolve('denied')
  return Notification.requestPermission()
}

export function showBrowserNotification(title, body) {
  if (typeof Notification === 'undefined') return null
  if (Notification.permission !== 'granted') return null
  try {
    return new Notification(title, { body, icon: '/favicon.svg' })
  } catch {
    return null
  }
}

export function isPageVisible() {
  if (typeof document === 'undefined') return true
  return document.visibilityState === 'visible'
}

export function getTimeUntilReminder(reminderAt, now = Date.now()) {
  if (!reminderAt) return null
  const diff = reminderAt - now
  if (diff <= 0) return { expired: true, text: '已到达' }
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return { expired: false, text: `${days}天后` }
  if (hours > 0) return { expired: false, text: `${hours}小时后` }
  if (minutes > 0) return { expired: false, text: `${minutes}分钟后` }
  return { expired: false, text: '即将到达' }
}
