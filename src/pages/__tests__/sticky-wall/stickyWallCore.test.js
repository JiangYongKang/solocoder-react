import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateId,
  getRandomColor,
  formatTime,
  createNote,
  createEmptyState,
  addNote,
  updateNote,
  deleteNote,
  getNoteById,
  getActiveNotes,
  getArchivedNotes,
  archiveNote,
  unarchiveNote,
  bringToFront,
  moveNote,
  snapValueToGrid,
  clampZoom,
  screenToCanvas,
  canvasToScreen,
  loadFromStorage,
  saveToStorage,
  clearStorage,
  loadSettings,
  saveSettings,
  applyBold,
  applyItalic,
  applyUnderline,
  applyFontSize,
  applyFontColor,
  stripHtml,
  validateNote,
  sortNotesByZIndex,
} from '@/pages/sticky-wall/stickyWallCore.js'
import {
  PRESET_COLORS,
  GRID_SIZE,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  SETTINGS_KEY,
  Z_INDEX_BASE,
} from '@/pages/sticky-wall/constants.js'

function createMockStorage() {
  const store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    _store: store,
  }
}

describe('stickyWallCore', () => {
  describe('generateId', () => {
    it('should generate non-empty string ids', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should generate unique ids', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })

    it('should include the prefix in the id', () => {
      const id = generateId('custom')
      expect(id.startsWith('custom_')).toBe(true)
    })
  })

  describe('getRandomColor', () => {
    it('should return a color from PRESET_COLORS', () => {
      const color = getRandomColor()
      expect(PRESET_COLORS.includes(color)).toBe(true)
    })
  })

  describe('formatTime', () => {
    it('should return empty string for falsy timestamp', () => {
      expect(formatTime(null)).toBe('')
      expect(formatTime(undefined)).toBe('')
      expect(formatTime(0)).toBe('')
    })

    it('should format timestamp correctly', () => {
      const timestamp = new Date(2024, 0, 15, 14, 30).getTime()
      const result = formatTime(timestamp)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    })
  })

  describe('createNote', () => {
    it('should create a note with default properties', () => {
      const note = createNote(800, 600)
      expect(note.id).toBeTruthy()
      expect(typeof note.content).toBe('string')
      expect(PRESET_COLORS.includes(note.color)).toBe(true)
      expect(typeof note.x).toBe('number')
      expect(typeof note.y).toBe('number')
      expect(note.x).toBeGreaterThanOrEqual(0)
      expect(note.y).toBeGreaterThanOrEqual(0)
      expect(note.zIndex).toBe(Z_INDEX_BASE)
      expect(note.archived).toBe(false)
      expect(note.archivedAt).toBeNull()
      expect(note.bold).toBe(false)
      expect(note.italic).toBe(false)
      expect(note.underline).toBe(false)
      expect(note.fontSize).toBe(14)
      expect(note.fontColor).toBe('#1F2937')
    })

    it('should apply overrides correctly', () => {
      const overrides = {
        x: 100,
        y: 200,
        color: '#FF0000',
        content: 'Hello World',
        zIndex: 5,
      }
      const note = createNote(800, 600, overrides)
      expect(note.x).toBe(100)
      expect(note.y).toBe(200)
      expect(note.color).toBe('#FF0000')
      expect(note.content).toBe('Hello World')
      expect(note.zIndex).toBe(5)
    })
  })

  describe('createEmptyState', () => {
    it('should create empty state with notes array and nextZIndex', () => {
      const state = createEmptyState()
      expect(state.notes).toEqual([])
      expect(state.nextZIndex).toBe(Z_INDEX_BASE + 1)
    })
  })

  describe('addNote', () => {
    it('should add a note to the state', () => {
      const state = createEmptyState()
      const note = createNote(800, 600)
      const newState = addNote(state, note)
      expect(newState.notes.length).toBe(1)
      expect(newState.notes[0].id).toBe(note.id)
      expect(newState.nextZIndex).toBeGreaterThan(state.nextZIndex)
    })

    it('should not mutate the original state', () => {
      const state = createEmptyState()
      const note = createNote(800, 600)
      const frozen = JSON.stringify(state)
      addNote(state, note)
      expect(JSON.stringify(state)).toBe(frozen)
    })

    it('should assign zIndex if not provided', () => {
      const state = createEmptyState()
      const note = createNote(800, 600, { zIndex: undefined })
      const newState = addNote(state, note)
      expect(newState.notes[0].zIndex).toBeDefined()
    })

    it('should return original state if state or note is null', () => {
      expect(addNote(null, {})).toBeNull()
      expect(addNote(createEmptyState(), null)).toBeTruthy()
    })
  })

  describe('updateNote', () => {
    it('should update note fields', () => {
      let state = createEmptyState()
      const note = createNote(800, 600, { content: 'Original' })
      state = addNote(state, note)
      const updated = updateNote(state, note.id, { content: 'Updated' })
      expect(updated.notes[0].content).toBe('Updated')
    })

    it('should update updatedAt timestamp', () => {
      let state = createEmptyState()
      const note = createNote(800, 600)
      state = addNote(state, note)
      const before = state.notes[0].updatedAt
      const updated = updateNote(state, note.id, { content: 'test' })
      expect(updated.notes[0].updatedAt).toBeGreaterThanOrEqual(before)
    })

    it('should return same state for non-existent note id', () => {
      const state = createEmptyState()
      const updated = updateNote(state, 'non-existent', { content: 'test' })
      expect(updated).toEqual(state)
    })
  })

  describe('deleteNote', () => {
    it('should remove a note from state', () => {
      let state = createEmptyState()
      const note1 = createNote(800, 600)
      const note2 = createNote(800, 600)
      state = addNote(state, note1)
      state = addNote(state, note2)
      const deleted = deleteNote(state, note1.id)
      expect(deleted.notes.length).toBe(1)
      expect(deleted.notes[0].id).toBe(note2.id)
    })

    it('should do nothing for non-existent id', () => {
      let state = createEmptyState()
      const note = createNote(800, 600)
      state = addNote(state, note)
      const result = deleteNote(state, 'nope')
      expect(result.notes.length).toBe(1)
    })
  })

  describe('getNoteById', () => {
    it('should find a note by id', () => {
      let state = createEmptyState()
      const note = createNote(800, 600)
      state = addNote(state, note)
      const found = getNoteById(state, note.id)
      expect(found).toBeTruthy()
      expect(found.id).toBe(note.id)
    })

    it('should return null for non-existent id', () => {
      const state = createEmptyState()
      expect(getNoteById(state, 'nope')).toBeNull()
    })

    it('should return null for null state or id', () => {
      expect(getNoteById(null, 'test')).toBeNull()
      expect(getNoteById(createEmptyState(), null)).toBeNull()
    })
  })

  describe('getActiveNotes and getArchivedNotes', () => {
    it('should separate active and archived notes', () => {
      let state = createEmptyState()
      const activeNote = createNote(800, 600)
      const archivedNote = createNote(800, 600, { archived: true, archivedAt: Date.now() })
      state = addNote(state, activeNote)
      state = addNote(state, archivedNote)

      const active = getActiveNotes(state)
      const archived = getArchivedNotes(state)

      expect(active.length).toBe(1)
      expect(active[0].id).toBe(activeNote.id)
      expect(archived.length).toBe(1)
      expect(archived[0].id).toBe(archivedNote.id)
    })
  })

  describe('archiveNote and unarchiveNote', () => {
    it('should archive a note', () => {
      let state = createEmptyState()
      const note = createNote(800, 600)
      state = addNote(state, note)
      const archived = archiveNote(state, note.id)
      expect(archived.notes[0].archived).toBe(true)
      expect(archived.notes[0].archivedAt).not.toBeNull()
    })

    it('should unarchive a note', () => {
      let state = createEmptyState()
      const note = createNote(800, 600, { archived: true, archivedAt: Date.now() })
      state = addNote(state, note)
      const unarchived = unarchiveNote(state, note.id)
      expect(unarchived.notes[0].archived).toBe(false)
      expect(unarchived.notes[0].archivedAt).toBeNull()
    })
  })

  describe('bringToFront', () => {
    it('should increase zIndex of note to nextZIndex', () => {
      let state = createEmptyState()
      const note = createNote(800, 600)
      state = addNote(state, note)
      const initialZ = state.nextZIndex
      const brought = bringToFront(state, note.id)
      expect(brought.notes[0].zIndex).toBe(initialZ)
      expect(brought.nextZIndex).toBe(initialZ + 1)
    })
  })

  describe('moveNote', () => {
    it('should move note to new position', () => {
      let state = createEmptyState()
      const note = createNote(800, 600, { x: 0, y: 0 })
      state = addNote(state, note)
      const moved = moveNote(state, note.id, 100, 200, false)
      expect(moved.notes[0].x).toBe(100)
      expect(moved.notes[0].y).toBe(200)
    })

    it('should snap to grid when enabled', () => {
      let state = createEmptyState()
      const note = createNote(800, 600, { x: 0, y: 0 })
      state = addNote(state, note)
      const moved = moveNote(state, note.id, 15, 25, true)
      expect(moved.notes[0].x).toBe(snapValueToGrid(15))
      expect(moved.notes[0].y).toBe(snapValueToGrid(25))
    })

    it('should not allow negative coordinates', () => {
      let state = createEmptyState()
      const note = createNote(800, 600, { x: 50, y: 50 })
      state = addNote(state, note)
      const moved = moveNote(state, note.id, -10, -20, false)
      expect(moved.notes[0].x).toBe(0)
      expect(moved.notes[0].y).toBe(0)
    })
  })

  describe('snapValueToGrid', () => {
    it('should snap values to grid multiples', () => {
      expect(snapValueToGrid(0)).toBe(0)
      expect(snapValueToGrid(GRID_SIZE)).toBe(GRID_SIZE)
      expect(snapValueToGrid(GRID_SIZE / 2)).toBe(GRID_SIZE)
      expect(snapValueToGrid(GRID_SIZE / 3)).toBe(0)
    })

    it('should return 0 for non-number input', () => {
      expect(snapValueToGrid(null)).toBe(0)
      expect(snapValueToGrid('abc')).toBe(0)
      expect(snapValueToGrid(undefined)).toBe(0)
    })
  })

  describe('clampZoom', () => {
    it('should clamp zoom within valid range', () => {
      expect(clampZoom(MIN_ZOOM - 0.1)).toBe(MIN_ZOOM)
      expect(clampZoom(MAX_ZOOM + 0.1)).toBe(MAX_ZOOM)
      expect(clampZoom(1.0)).toBe(1.0)
    })

    it('should return default zoom for non-number input', () => {
      expect(clampZoom(null)).toBe(DEFAULT_ZOOM)
      expect(clampZoom('abc')).toBe(DEFAULT_ZOOM)
    })
  })

  describe('screenToCanvas and canvasToScreen', () => {
    it('should convert screen to canvas coordinates', () => {
      const result = screenToCanvas(200, 300, 2, 50, 50)
      expect(result.x).toBe(75)
      expect(result.y).toBe(125)
    })

    it('should convert canvas to screen coordinates', () => {
      const result = canvasToScreen(75, 125, 2, 50, 50)
      expect(result.x).toBe(200)
      expect(result.y).toBe(300)
    })

    it('should handle default pan values', () => {
      const result = screenToCanvas(200, 300, 2)
      expect(result.x).toBe(100)
      expect(result.y).toBe(150)
    })

    it('should handle zero zoom gracefully', () => {
      const result = screenToCanvas(100, 100, 0)
      expect(typeof result.x).toBe('number')
      expect(typeof result.y).toBe('number')
    })
  })

  describe('localStorage persistence', () => {
    let storage

    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadFromStorage should return empty state when storage is empty', () => {
      const state = loadFromStorage(storage)
      expect(state.notes).toEqual([])
    })

    it('saveToStorage and loadFromStorage should round-trip correctly', () => {
      let state = createEmptyState()
      const note = createNote(800, 600, { content: 'Persisted', x: 100, y: 200 })
      state = addNote(state, note)
      saveToStorage(state, storage)

      const loaded = loadFromStorage(storage)
      expect(loaded.notes.length).toBe(1)
      expect(loaded.notes[0].content).toBe('Persisted')
      expect(loaded.notes[0].x).toBe(100)
      expect(loaded.notes[0].y).toBe(200)
    })

    it('loadFromStorage should handle corrupted JSON gracefully', () => {
      storage.setItem(STORAGE_KEY, 'invalid json')
      const state = loadFromStorage(storage)
      expect(state.notes).toEqual([])
    })

    it('loadFromStorage should filter out invalid notes', () => {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          notes: [
            { id: 'valid', content: 'test', x: 0, y: 0, zIndex: 1, color: '#fff', archived: false },
            { invalid: 'note' },
            null,
          ],
        })
      )
      const state = loadFromStorage(storage)
      expect(state.notes.length).toBe(1)
      expect(state.notes[0].id).toBe('valid')
    })

    it('clearStorage should remove saved data', () => {
      let state = createEmptyState()
      const note = createNote(800, 600)
      state = addNote(state, note)
      saveToStorage(state, storage)
      expect(storage.getItem(STORAGE_KEY)).toBeTruthy()
      clearStorage(storage)
      expect(storage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('should handle null storage gracefully', () => {
      expect(() => loadFromStorage(null)).not.toThrow()
      expect(() => saveToStorage(createEmptyState(), null)).not.toThrow()
      expect(saveToStorage(createEmptyState(), null)).toBe(false)
    })
  })

  describe('settings persistence', () => {
    let storage

    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadSettings should return default settings when empty', () => {
      const settings = loadSettings(storage)
      expect(settings.snapToGrid).toBe(DEFAULT_SETTINGS.snapToGrid)
      expect(settings.zoom).toBe(DEFAULT_SETTINGS.zoom)
    })

    it('saveSettings and loadSettings should round-trip correctly', () => {
      const settings = { snapToGrid: false, zoom: 1.5 }
      saveSettings(settings, storage)
      const loaded = loadSettings(storage)
      expect(loaded.snapToGrid).toBe(false)
      expect(loaded.zoom).toBe(1.5)
    })

    it('should clamp zoom when loading settings', () => {
      saveSettings({ snapToGrid: true, zoom: 5.0 }, storage)
      const loaded = loadSettings(storage)
      expect(loaded.zoom).toBe(MAX_ZOOM)
    })

    it('should handle corrupted settings JSON', () => {
      storage.setItem(SETTINGS_KEY, 'not json')
      const settings = loadSettings(storage)
      expect(settings.snapToGrid).toBe(DEFAULT_SETTINGS.snapToGrid)
    })
  })

  describe('text formatting', () => {
    it('applyBold should wrap content in strong tags', () => {
      expect(applyBold('test')).toBe('<strong>test</strong>')
    })

    it('applyItalic should wrap content in em tags', () => {
      expect(applyItalic('test')).toBe('<em>test</em>')
    })

    it('applyUnderline should wrap content in u tags', () => {
      expect(applyUnderline('test')).toBe('<u>test</u>')
    })

    it('applyFontSize should apply font-size style', () => {
      const result = applyFontSize('test', 18)
      expect(result).toContain('font-size: 18px')
    })

    it('applyFontColor should apply color style', () => {
      const result = applyFontColor('test', '#FF0000')
      expect(result).toContain('color: #FF0000')
    })

    it('formatting functions should return empty string for non-string input', () => {
      expect(applyBold(null)).toBe('')
      expect(applyItalic(undefined)).toBe('')
      expect(applyUnderline(123)).toBe('')
      expect(applyFontSize(null, 14)).toBe('')
      expect(applyFontColor(null, '#fff')).toBe('')
    })
  })

  describe('stripHtml', () => {
    it('should remove all HTML tags', () => {
      expect(stripHtml('<strong>Hello</strong>')).toBe('Hello')
      expect(stripHtml('<p>Line 1</p><p>Line 2</p>')).toBe('Line 1Line 2')
      expect(stripHtml('<span style="color:red">Red</span>')).toBe('Red')
    })

    it('should return empty string for non-string input', () => {
      expect(stripHtml(null)).toBe('')
      expect(stripHtml(undefined)).toBe('')
      expect(stripHtml(123)).toBe('')
    })

    it('should handle empty string', () => {
      expect(stripHtml('')).toBe('')
    })
  })

  describe('validateNote', () => {
    it('should validate a correct note', () => {
      const note = createNote(800, 600)
      const result = validateNote(note)
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
    })

    it('should reject note without id', () => {
      const note = { ...createNote(800, 600), id: '' }
      const result = validateNote(note)
      expect(result.valid).toBe(false)
      expect(result.errors.id).toBeTruthy()
    })

    it('should reject note with negative coordinates', () => {
      const note = { ...createNote(800, 600), x: -1 }
      const result = validateNote(note)
      expect(result.valid).toBe(false)
      expect(result.errors.x).toBeTruthy()
    })

    it('should reject note with invalid zIndex', () => {
      const note = { ...createNote(800, 600), zIndex: 0 }
      const result = validateNote(note)
      expect(result.valid).toBe(false)
      expect(result.errors.zIndex).toBeTruthy()
    })

    it('should reject note without color', () => {
      const note = { ...createNote(800, 600), color: '' }
      const result = validateNote(note)
      expect(result.valid).toBe(false)
      expect(result.errors.color).toBeTruthy()
    })

    it('should reject null/undefined note', () => {
      expect(validateNote(null).valid).toBe(false)
      expect(validateNote(undefined).valid).toBe(false)
    })
  })

  describe('sortNotesByZIndex', () => {
    it('should sort notes by zIndex ascending', () => {
      const notes = [
        { id: 'a', zIndex: 3 },
        { id: 'b', zIndex: 1 },
        { id: 'c', zIndex: 2 },
      ]
      const sorted = sortNotesByZIndex(notes)
      expect(sorted.map((n) => n.id)).toEqual(['b', 'c', 'a'])
    })

    it('should not mutate original array', () => {
      const notes = [
        { id: 'a', zIndex: 3 },
        { id: 'b', zIndex: 1 },
      ]
      const frozen = JSON.stringify(notes)
      sortNotesByZIndex(notes)
      expect(JSON.stringify(notes)).toBe(frozen)
    })

    it('should return empty array for non-array input', () => {
      expect(sortNotesByZIndex(null)).toEqual([])
      expect(sortNotesByZIndex(undefined)).toEqual([])
      expect(sortNotesByZIndex('abc')).toEqual([])
    })
  })
})
