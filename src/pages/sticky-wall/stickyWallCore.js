import {
  STORAGE_KEY,
  SETTINGS_KEY,
  PRESET_COLORS,
  NOTE_WIDTH,
  NOTE_HEIGHT,
  GRID_SIZE,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  DEFAULT_SETTINGS,
  Z_INDEX_BASE,
} from './constants.js'

let idCounter = 0

export function generateId(prefix = 'note') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function getRandomColor() {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
}

export function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

export function createNote(canvasWidth = 800, canvasHeight = 600, overrides = {}) {
  const now = Date.now()
  const x = typeof overrides.x === 'number'
    ? overrides.x
    : Math.max(0, (canvasWidth - NOTE_WIDTH) / 2 + (Math.random() - 0.5) * 100)
  const y = typeof overrides.y === 'number'
    ? overrides.y
    : Math.max(0, (canvasHeight - NOTE_HEIGHT) / 2 + (Math.random() - 0.5) * 100)
  return {
    id: generateId(),
    content: '',
    color: overrides.color || getRandomColor(),
    x,
    y,
    width: overrides.width || NOTE_WIDTH,
    height: overrides.height || NOTE_HEIGHT,
    zIndex: overrides.zIndex || Z_INDEX_BASE,
    createdAt: now,
    updatedAt: now,
    archived: false,
    archivedAt: null,
    fontSize: 14,
    fontColor: '#1F2937',
    bold: false,
    italic: false,
    underline: false,
    ...overrides,
  }
}

export function createEmptyState() {
  return {
    notes: [],
    nextZIndex: Z_INDEX_BASE + 1,
  }
}

export function addNote(state, note) {
  if (!state || !note) return state
  const assignedZIndex = note.zIndex || state.nextZIndex
  const newNote = {
    ...note,
    zIndex: assignedZIndex,
  }
  return {
    ...state,
    notes: [...state.notes, newNote],
    nextZIndex: Math.max(state.nextZIndex + 1, assignedZIndex + 1),
  }
}

export function updateNote(state, noteId, updates) {
  if (!state || !noteId || !updates) return state
  return {
    ...state,
    notes: state.notes.map((note) => {
      if (note.id !== noteId) return note
      return {
        ...note,
        ...updates,
        updatedAt: Date.now(),
      }
    }),
  }
}

export function deleteNote(state, noteId) {
  if (!state || !noteId) return state
  return {
    ...state,
    notes: state.notes.filter((note) => note.id !== noteId),
  }
}

export function getNoteById(state, noteId) {
  if (!state || !noteId) return null
  return state.notes.find((note) => note.id === noteId) || null
}

export function getActiveNotes(state) {
  if (!state) return []
  return state.notes.filter((note) => !note.archived)
}

export function getArchivedNotes(state) {
  if (!state) return []
  return state.notes.filter((note) => note.archived)
}

export function archiveNote(state, noteId) {
  return updateNote(state, noteId, { archived: true, archivedAt: Date.now() })
}

export function unarchiveNote(state, noteId) {
  return updateNote(state, noteId, { archived: false, archivedAt: null })
}

export function bringToFront(state, noteId) {
  if (!state || !noteId) return state
  const newZIndex = state.nextZIndex
  return {
    ...updateNote(state, noteId, { zIndex: newZIndex }),
    nextZIndex: newZIndex + 1,
  }
}

export function moveNote(state, noteId, x, y, snapToGrid = false) {
  if (!state || !noteId) return state
  let newX = x
  let newY = y
  if (snapToGrid) {
    newX = snapValueToGrid(x)
    newY = snapValueToGrid(y)
  }
  newX = Math.max(0, newX)
  newY = Math.max(0, newY)
  return updateNote(state, noteId, { x: newX, y: newY })
}

export function snapValueToGrid(value) {
  if (typeof value !== 'number') return 0
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

export function clampZoom(zoom) {
  if (typeof zoom !== 'number') return DEFAULT_ZOOM
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
}

export function screenToCanvas(screenX, screenY, zoom, panX = 0, panY = 0) {
  const safeZoom = zoom || 1
  return {
    x: (screenX - panX) / safeZoom,
    y: (screenY - panY) / safeZoom,
  }
}

export function canvasToScreen(canvasX, canvasY, zoom, panX = 0, panY = 0) {
  const safeZoom = zoom || 1
  return {
    x: canvasX * safeZoom + panX,
    y: canvasY * safeZoom + panY,
  }
}

export function loadFromStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return createEmptyState()
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyState()
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.notes)) return createEmptyState()
    const validNotes = parsed.notes.filter((note) => note && typeof note.id === 'string')
    const maxZ = validNotes.reduce((max, n) => Math.max(max, n.zIndex || 0), 0)
    return {
      notes: validNotes,
      nextZIndex: maxZ + 1,
    }
  } catch {
    return createEmptyState()
  }
}

export function saveToStorage(state, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage || !state) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ notes: state.notes || [] }))
    return true
  } catch {
    return false
  }
}

export function clearStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return false
  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function loadSettings(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { ...DEFAULT_SETTINGS }
  try {
    const raw = storage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      zoom: clampZoom(parsed.zoom),
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage || !settings) return false
  try {
    const toSave = {
      ...DEFAULT_SETTINGS,
      ...settings,
      zoom: clampZoom(settings.zoom),
    }
    storage.setItem(SETTINGS_KEY, JSON.stringify(toSave))
    return true
  } catch {
    return false
  }
}

export function applyBold(content) {
  if (typeof content !== 'string') return ''
  return `<strong>${content}</strong>`
}

export function applyItalic(content) {
  if (typeof content !== 'string') return ''
  return `<em>${content}</em>`
}

export function applyUnderline(content) {
  if (typeof content !== 'string') return ''
  return `<u>${content}</u>`
}

export function applyFontSize(content, size) {
  if (typeof content !== 'string') return ''
  return `<span style="font-size: ${size}px">${content}</span>`
}

export function applyFontColor(content, color) {
  if (typeof content !== 'string') return ''
  return `<span style="color: ${color}">${content}</span>`
}

export function stripHtml(html) {
  if (typeof html !== 'string') return ''
  return html.replace(/<[^>]*>/g, '')
}

export function validateNote(note) {
  const errors = {}
  if (!note || typeof note !== 'object') {
    return { valid: false, errors: { note: 'invalid' } }
  }
  if (!note.id || typeof note.id !== 'string') {
    errors.id = 'ID不能为空'
  }
  if (typeof note.x !== 'number' || note.x < 0) {
    errors.x = 'X坐标必须为非负数'
  }
  if (typeof note.y !== 'number' || note.y < 0) {
    errors.y = 'Y坐标必须为非负数'
  }
  if (typeof note.zIndex !== 'number' || note.zIndex < 1) {
    errors.zIndex = 'Z层级必须为正整数'
  }
  if (!note.color || typeof note.color !== 'string') {
    errors.color = '颜色不能为空'
  }
  if (typeof note.archived !== 'boolean') {
    errors.archived = '归档状态必须为布尔值'
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

export function sortNotesByZIndex(notes) {
  if (!Array.isArray(notes)) return []
  return [...notes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
}
