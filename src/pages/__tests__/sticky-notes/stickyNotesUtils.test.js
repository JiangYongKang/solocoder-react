import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateId,
  getContrastColor,
  formatDateTime,
  formatDate,
  addDays,
  calculateExpireDate,
  isExpired,
  shouldTriggerReminder,
  markReminderTriggered,
  filterByTags,
  searchNotes,
  filterExpiredNotes,
  filterActiveNotes,
  createNote,
  updateNote,
  deleteNote,
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
  getTimeUntilReminder,
} from '@/pages/sticky-notes/stickyNotesUtils'
import {
  NOTE_COLORS,
  DEFAULT_TAGS,
  TRASH_RETENTION_DAYS,
  REMINDER_STATUS_PENDING,
  REMINDER_STATUS_TRIGGERED,
  VIEW_GRID,
  VIEW_LIST,
  STORAGE_KEY_NOTES,
  STORAGE_KEY_VIEW,
  STORAGE_KEY_TRASH,
  STORAGE_KEY_ARCHIVE,
} from '@/pages/sticky-notes/constants'

function createMockStorage() {
  const store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
    _store: store,
  }
}

function makeNote(overrides = {}) {
  return createNote({
    title: 'Test Note',
    content: 'Test Content',
    ...overrides,
  })
}

describe('stickyNotesUtils', () => {
  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should start with sn_ prefix', () => {
      expect(generateId().startsWith('sn_')).toBe(true)
    })
  })

  describe('getContrastColor', () => {
    it('should return dark color for light background', () => {
      expect(getContrastColor('#ffffff')).toBe('#333333')
      expect(getContrastColor('#fff3cd')).toBe('#333333')
    })

    it('should return light color for dark background', () => {
      expect(getContrastColor('#000000')).toBe('#ffffff')
      expect(getContrastColor('#333333')).toBe('#ffffff')
    })

    it('should handle colors with or without # prefix', () => {
      expect(getContrastColor('#ffffff')).toBe('#333333')
      expect(getContrastColor('ffffff')).toBe('#333333')
    })
  })

  describe('formatDateTime', () => {
    it('should format timestamp correctly', () => {
      const timestamp = new Date(2024, 5, 15, 14, 30).getTime()
      expect(formatDateTime(timestamp)).toBe('2024-06-15 14:30')
    })

    it('should return empty string for null', () => {
      expect(formatDateTime(null)).toBe('')
    })

    it('should pad single digits', () => {
      const timestamp = new Date(2024, 0, 5, 9, 5).getTime()
      expect(formatDateTime(timestamp)).toBe('2024-01-05 09:05')
    })
  })

  describe('formatDate', () => {
    it('should format date object', () => {
      expect(formatDate(new Date(2024, 5, 15))).toBe('2024-06-15')
    })

    it('should format timestamp', () => {
      const timestamp = new Date(2024, 5, 15).getTime()
      expect(formatDate(timestamp)).toBe('2024-06-15')
    })

    it('should return empty string for null', () => {
      expect(formatDate(null)).toBe('')
    })
  })

  describe('addDays', () => {
    it('should add days correctly', () => {
      const base = new Date(2024, 5, 15).getTime()
      const result = addDays(base, 3)
      expect(new Date(result).getDate()).toBe(18)
    })

    it('should subtract days correctly', () => {
      const base = new Date(2024, 5, 15).getTime()
      const result = addDays(base, -2)
      expect(new Date(result).getDate()).toBe(13)
    })

    it('should handle month boundaries', () => {
      const base = new Date(2024, 5, 30).getTime()
      const result = addDays(base, 2)
      expect(new Date(result).getMonth()).toBe(6)
      expect(new Date(result).getDate()).toBe(2)
    })
  })

  describe('calculateExpireDate', () => {
    it('should calculate 3 days', () => {
      const now = Date.now()
      const result = calculateExpireDate('3days')
      expect(result).toBeGreaterThan(now)
      const diffDays = Math.floor((result - now) / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(3)
    })

    it('should calculate 1 week', () => {
      const now = Date.now()
      const result = calculateExpireDate('1week')
      const diffDays = Math.floor((result - now) / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(7)
    })

    it('should calculate 2 weeks', () => {
      const now = Date.now()
      const result = calculateExpireDate('2weeks')
      const diffDays = Math.floor((result - now) / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(14)
    })

    it('should calculate 1 month', () => {
      const now = Date.now()
      const result = calculateExpireDate('1month')
      const diffDays = Math.floor((result - now) / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(30)
    })

    it('should use custom date when option is custom', () => {
      const customDate = new Date(2025, 0, 1).toISOString()
      const result = calculateExpireDate('custom', customDate)
      expect(new Date(result).getFullYear()).toBe(2025)
    })

    it('should return null for unknown option', () => {
      expect(calculateExpireDate('unknown')).toBeNull()
    })
  })

  describe('isExpired', () => {
    it('should return true for expired note', () => {
      const past = Date.now() - 1000
      const note = makeNote({ expireAt: past })
      expect(isExpired(note)).toBe(true)
    })

    it('should return false for future expire date', () => {
      const future = Date.now() + 1000
      const note = makeNote({ expireAt: future })
      expect(isExpired(note)).toBe(false)
    })

    it('should return false when no expire date', () => {
      const note = makeNote()
      expect(isExpired(note)).toBe(false)
    })

    it('should accept custom now parameter', () => {
      const now = new Date(2024, 5, 15).getTime()
      const expireAt = new Date(2024, 5, 10).getTime()
      const note = makeNote({ expireAt })
      expect(isExpired(note, now)).toBe(true)
    })
  })

  describe('shouldTriggerReminder', () => {
    it('should return true when reminder time reached', () => {
      const past = Date.now() - 1000
      const note = makeNote({ reminderAt: past, reminderStatus: REMINDER_STATUS_PENDING })
      expect(shouldTriggerReminder(note)).toBe(true)
    })

    it('should return false when already triggered', () => {
      const past = Date.now() - 1000
      const note = makeNote({ reminderAt: past, reminderStatus: REMINDER_STATUS_TRIGGERED })
      expect(shouldTriggerReminder(note)).toBe(false)
    })

    it('should return false when no reminder set', () => {
      const note = makeNote()
      expect(shouldTriggerReminder(note)).toBe(false)
    })

    it('should return false for future reminder', () => {
      const future = Date.now() + 1000
      const note = makeNote({ reminderAt: future, reminderStatus: REMINDER_STATUS_PENDING })
      expect(shouldTriggerReminder(note)).toBe(false)
    })

    it('should accept custom now parameter', () => {
      const now = new Date(2024, 5, 15).getTime()
      const reminderAt = new Date(2024, 5, 14).getTime()
      const note = makeNote({ reminderAt, reminderStatus: REMINDER_STATUS_PENDING })
      expect(shouldTriggerReminder(note, now)).toBe(true)
    })
  })

  describe('markReminderTriggered', () => {
    it('should mark reminder as triggered', () => {
      const note1 = makeNote({ id: 'n1', reminderStatus: REMINDER_STATUS_PENDING })
      const note2 = makeNote({ id: 'n2', reminderStatus: REMINDER_STATUS_PENDING })
      const result = markReminderTriggered([note1, note2], 'n1')
      expect(result[0].reminderStatus).toBe(REMINDER_STATUS_TRIGGERED)
      expect(result[1].reminderStatus).toBe(REMINDER_STATUS_PENDING)
    })
  })

  describe('filterByTags', () => {
    it('should return all notes when no tags selected', () => {
      const notes = [makeNote(), makeNote()]
      expect(filterByTags(notes, [])).toHaveLength(2)
      expect(filterByTags(notes, null)).toHaveLength(2)
    })

    it('should filter by single tag', () => {
      const notes = [
        makeNote({ id: 'n1', tags: ['工作'] }),
        makeNote({ id: 'n2', tags: ['个人'] }),
        makeNote({ id: 'n3', tags: ['工作', '紧急'] }),
      ]
      const result = filterByTags(notes, ['工作'])
      expect(result.map(n => n.id)).toEqual(['n1', 'n3'])
    })

    it('should filter by multiple tags (AND logic)', () => {
      const notes = [
        makeNote({ id: 'n1', tags: ['工作'] }),
        makeNote({ id: 'n2', tags: ['工作', '紧急'] }),
        makeNote({ id: 'n3', tags: ['工作', '紧急', '待办'] }),
      ]
      const result = filterByTags(notes, ['工作', '紧急'])
      expect(result.map(n => n.id)).toEqual(['n2', 'n3'])
    })

    it('should return empty when no notes match all tags', () => {
      const notes = [
        makeNote({ id: 'n1', tags: ['工作'] }),
        makeNote({ id: 'n2', tags: ['个人'] }),
      ]
      const result = filterByTags(notes, ['工作', '个人'])
      expect(result).toHaveLength(0)
    })
  })

  describe('searchNotes', () => {
    it('should return all notes when query is empty', () => {
      const notes = [makeNote(), makeNote()]
      expect(searchNotes(notes, '')).toHaveLength(2)
      expect(searchNotes(notes, '   ')).toHaveLength(2)
    })

    it('should search in title', () => {
      const notes = [
        makeNote({ id: 'n1', title: '会议记录' }),
        makeNote({ id: 'n2', title: '购物清单' }),
      ]
      const result = searchNotes(notes, '会议')
      expect(result.map(n => n.id)).toEqual(['n1'])
    })

    it('should search in content', () => {
      const notes = [
        makeNote({ id: 'n1', content: '需要买牛奶和面包' }),
        makeNote({ id: 'n2', content: '明天下午开会' }),
      ]
      const result = searchNotes(notes, '牛奶')
      expect(result.map(n => n.id)).toEqual(['n1'])
    })

    it('should be case insensitive', () => {
      const notes = [
        makeNote({ id: 'n1', title: 'Meeting Notes' }),
      ]
      expect(searchNotes(notes, 'meeting')).toHaveLength(1)
      expect(searchNotes(notes, 'MEETING')).toHaveLength(1)
    })
  })

  describe('filterExpiredNotes', () => {
    it('should return only expired notes', () => {
      const now = Date.now()
      const notes = [
        makeNote({ id: 'n1', expireAt: now - 1000 }),
        makeNote({ id: 'n2', expireAt: now + 1000 }),
        makeNote({ id: 'n3' }),
      ]
      const result = filterExpiredNotes(notes, now)
      expect(result.map(n => n.id)).toEqual(['n1'])
    })
  })

  describe('filterActiveNotes', () => {
    it('should return only non-expired notes', () => {
      const now = Date.now()
      const notes = [
        makeNote({ id: 'n1', expireAt: now - 1000 }),
        makeNote({ id: 'n2', expireAt: now + 1000 }),
        makeNote({ id: 'n3' }),
      ]
      const result = filterActiveNotes(notes, now)
      expect(result.map(n => n.id)).toEqual(['n2', 'n3'])
    })
  })

  describe('createNote', () => {
    it('should create note with default values', () => {
      const note = createNote()
      expect(note.id).toBeDefined()
      expect(note.title).toBe('')
      expect(note.content).toBe('')
      expect(NOTE_COLORS).toContain(note.color)
      expect(note.tags).toEqual([])
      expect(note.reminderAt).toBeNull()
      expect(note.expireAt).toBeNull()
      expect(note.createdAt).toBeDefined()
      expect(note.updatedAt).toBeDefined()
    })

    it('should override default values', () => {
      const note = createNote({ title: 'Custom', color: '#ff0000' })
      expect(note.title).toBe('Custom')
      expect(note.color).toBe('#ff0000')
    })
  })

  describe('updateNote', () => {
    it('should update note fields', () => {
      const notes = [makeNote({ id: 'n1', title: 'Old', updatedAt: 1000 })]
      const result = updateNote(notes, 'n1', { title: 'New' })
      expect(result[0].title).toBe('New')
      expect(result[0].updatedAt).toBeGreaterThan(1000)
    })

    it('should not affect other notes', () => {
      const notes = [
        makeNote({ id: 'n1' }),
        makeNote({ id: 'n2' }),
      ]
      const result = updateNote(notes, 'n1', { title: 'Updated' })
      expect(result[1].title).toBe(notes[1].title)
    })
  })

  describe('deleteNote', () => {
    it('should delete note by id', () => {
      const notes = [
        makeNote({ id: 'n1' }),
        makeNote({ id: 'n2' }),
      ]
      const result = deleteNote(notes, 'n1')
      expect(result.map(n => n.id)).toEqual(['n2'])
    })
  })

  describe('addTagToNote', () => {
    it('should add tag to note', () => {
      const note = makeNote({ tags: [] })
      const result = addTagToNote(note, '工作')
      expect(result.tags).toEqual(['工作'])
    })

    it('should not add duplicate tag', () => {
      const note = makeNote({ tags: ['工作'] })
      const result = addTagToNote(note, '工作')
      expect(result.tags).toEqual(['工作'])
    })

    it('should not add more than 3 tags', () => {
      const note = makeNote({ tags: ['工作', '个人', '学习'] })
      const result = addTagToNote(note, '紧急')
      expect(result.tags).toEqual(['工作', '个人', '学习'])
    })

    it('should not add invalid tag', () => {
      const note = makeNote({ tags: [] })
      const result = addTagToNote(note, '无效标签')
      expect(result.tags).toEqual([])
    })
  })

  describe('removeTagFromNote', () => {
    it('should remove tag from note', () => {
      const note = makeNote({ tags: ['工作', '个人'] })
      const result = removeTagFromNote(note, '工作')
      expect(result.tags).toEqual(['个人'])
    })

    it('should handle note without tags', () => {
      const note = makeNote()
      const result = removeTagFromNote(note, '工作')
      expect(result.tags).toEqual([])
    })
  })

  describe('getAllTags', () => {
    it('should collect all unique tags', () => {
      const notes = [
        makeNote({ tags: ['工作', '紧急'] }),
        makeNote({ tags: ['个人', '工作'] }),
        makeNote({ tags: ['学习'] }),
      ]
      const tags = getAllTags(notes)
      expect(tags).toHaveLength(4)
      expect(tags).toContain('工作')
      expect(tags).toContain('紧急')
      expect(tags).toContain('个人')
      expect(tags).toContain('学习')
    })

    it('should return empty array for no notes', () => {
      expect(getAllTags([])).toEqual([])
    })
  })

  describe('reorderNotes', () => {
    it('should reorder notes and update order property', () => {
      const notes = [
        makeNote({ id: 'n1', order: 0 }),
        makeNote({ id: 'n2', order: 1 }),
        makeNote({ id: 'n3', order: 2 }),
      ]
      const result = reorderNotes(notes, 0, 2)
      expect(result.map(n => n.id)).toEqual(['n2', 'n3', 'n1'])
      expect(result.map(n => n.order)).toEqual([0, 1, 2])
    })

    it('should move from middle to beginning', () => {
      const notes = [
        makeNote({ id: 'n1', order: 0 }),
        makeNote({ id: 'n2', order: 1 }),
        makeNote({ id: 'n3', order: 2 }),
      ]
      const result = reorderNotes(notes, 1, 0)
      expect(result.map(n => n.id)).toEqual(['n2', 'n1', 'n3'])
    })
  })

  describe('moveNoteById', () => {
    it('should move note by id', () => {
      const notes = [
        makeNote({ id: 'n1', order: 0 }),
        makeNote({ id: 'n2', order: 1 }),
        makeNote({ id: 'n3', order: 2 }),
      ]
      const result = moveNoteById(notes, 'n1', 2)
      expect(result.map(n => n.id)).toEqual(['n2', 'n3', 'n1'])
    })

    it('should return original if note not found', () => {
      const notes = [makeNote({ id: 'n1' })]
      const result = moveNoteById(notes, 'non-existent', 0)
      expect(result).toBe(notes)
    })
  })

  describe('archiveNote', () => {
    it('should move note from notes to archivedNotes', () => {
      const notes = [makeNote({ id: 'n1' }), makeNote({ id: 'n2' })]
      const archivedNotes = []
      const result = archiveNote(notes, archivedNotes, 'n1')
      expect(result.notes.map(n => n.id)).toEqual(['n2'])
      expect(result.archivedNotes.map(n => n.id)).toEqual(['n1'])
      expect(result.archivedNotes[0].archivedAt).toBeDefined()
    })

    it('should return unchanged if note not found', () => {
      const notes = [makeNote({ id: 'n1' })]
      const archivedNotes = []
      const result = archiveNote(notes, archivedNotes, 'non-existent')
      expect(result.notes).toBe(notes)
      expect(result.archivedNotes).toBe(archivedNotes)
    })
  })

  describe('unarchiveNote', () => {
    it('should move note from archivedNotes back to notes', () => {
      const notes = []
      const archivedNotes = [makeNote({ id: 'n1', archivedAt: Date.now() })]
      const result = unarchiveNote(notes, archivedNotes, 'n1')
      expect(result.notes.map(n => n.id)).toEqual(['n1'])
      expect(result.archivedNotes).toEqual([])
      expect(result.notes[0].archivedAt).toBeUndefined()
    })
  })

  describe('moveToTrash', () => {
    it('should move note to trash', () => {
      const notes = [makeNote({ id: 'n1' }), makeNote({ id: 'n2' })]
      const trashNotes = []
      const result = moveToTrash(notes, trashNotes, 'n1')
      expect(result.notes.map(n => n.id)).toEqual(['n2'])
      expect(result.trashNotes.map(n => n.id)).toEqual(['n1'])
      expect(result.trashNotes[0].trashedAt).toBeDefined()
    })
  })

  describe('restoreFromTrash', () => {
    it('should restore note from trash', () => {
      const notes = []
      const trashNotes = [makeNote({ id: 'n1', trashedAt: Date.now() })]
      const result = restoreFromTrash(notes, trashNotes, 'n1')
      expect(result.notes.map(n => n.id)).toEqual(['n1'])
      expect(result.trashNotes).toEqual([])
      expect(result.notes[0].trashedAt).toBeUndefined()
    })
  })

  describe('permanentlyDelete', () => {
    it('should permanently delete note from trash', () => {
      const trashNotes = [makeNote({ id: 'n1' }), makeNote({ id: 'n2' })]
      const result = permanentlyDelete(trashNotes, 'n1')
      expect(result.map(n => n.id)).toEqual(['n2'])
    })
  })

  describe('getTrashRetentionDays', () => {
    it('should return full retention days for newly trashed note', () => {
      const note = makeNote({ trashedAt: Date.now() })
      expect(getTrashRetentionDays(note)).toBe(TRASH_RETENTION_DAYS)
    })

    it('should decrease retention days as time passes', () => {
      const now = Date.now()
      const trashedAt = now - (10 * 24 * 60 * 60 * 1000)
      const note = makeNote({ trashedAt })
      expect(getTrashRetentionDays(note, now)).toBe(TRASH_RETENTION_DAYS - 10)
    })

    it('should not go below zero', () => {
      const now = Date.now()
      const trashedAt = now - (100 * 24 * 60 * 60 * 1000)
      const note = makeNote({ trashedAt })
      expect(getTrashRetentionDays(note, now)).toBe(0)
    })

    it('should return full days if no trashedAt', () => {
      const note = makeNote()
      expect(getTrashRetentionDays(note)).toBe(TRASH_RETENTION_DAYS)
    })
  })

  describe('shouldAutoCleanTrash', () => {
    it('should return true when retention days reached', () => {
      const now = Date.now()
      const trashedAt = now - (TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000)
      const note = makeNote({ trashedAt })
      expect(shouldAutoCleanTrash(note, now)).toBe(true)
    })

    it('should return false when still within retention period', () => {
      const note = makeNote({ trashedAt: Date.now() })
      expect(shouldAutoCleanTrash(note)).toBe(false)
    })
  })

  describe('autoCleanTrash', () => {
    it('should remove notes that exceed retention period', () => {
      const now = Date.now()
      const oldDate = now - ((TRASH_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000)
      const newDate = now - 1000
      const trashNotes = [
        makeNote({ id: 'n1', trashedAt: oldDate }),
        makeNote({ id: 'n2', trashedAt: newDate }),
      ]
      const result = autoCleanTrash(trashNotes, now)
      expect(result.map(n => n.id)).toEqual(['n2'])
    })
  })

  describe('getTagColor', () => {
    it('should return correct color for known tags', () => {
      DEFAULT_TAGS.forEach(tag => {
        expect(getTagColor(tag)).toBeDefined()
        expect(getTagColor(tag)).not.toBe('#6b7280')
      })
    })

    it('should return default color for unknown tag', () => {
      expect(getTagColor('unknown')).toBe('#6b7280')
    })
  })

  describe('localStorage operations', () => {
    let storage
    beforeEach(() => {
      storage = createMockStorage()
    })

    describe('loadNotes / saveNotes', () => {
      it('should return empty array when storage is empty', () => {
        expect(loadNotes(storage)).toEqual([])
      })

      it('should save and load notes', () => {
        const notes = [makeNote({ id: 'n1' })]
        saveNotes(notes, storage)
        expect(storage.getItem(STORAGE_KEY_NOTES)).toBe(JSON.stringify(notes))
        const loaded = loadNotes(storage)
        expect(loaded[0].id).toBe('n1')
      })

      it('should handle invalid JSON gracefully', () => {
        storage.setItem(STORAGE_KEY_NOTES, 'invalid json')
        expect(loadNotes(storage)).toEqual([])
      })
    })

    describe('loadArchivedNotes / saveArchivedNotes', () => {
      it('should return empty array when empty', () => {
        expect(loadArchivedNotes(storage)).toEqual([])
      })

      it('should save and load archived notes', () => {
        const notes = [makeNote({ id: 'a1' })]
        saveArchivedNotes(notes, storage)
        expect(storage.getItem(STORAGE_KEY_ARCHIVE)).toBe(JSON.stringify(notes))
        const loaded = loadArchivedNotes(storage)
        expect(loaded[0].id).toBe('a1')
      })
    })

    describe('loadTrashNotes / saveTrashNotes', () => {
      it('should return empty array when empty', () => {
        expect(loadTrashNotes(storage)).toEqual([])
      })

      it('should save and load trash notes', () => {
        const notes = [makeNote({ id: 't1' })]
        saveTrashNotes(notes, storage)
        expect(storage.getItem(STORAGE_KEY_TRASH)).toBe(JSON.stringify(notes))
        const loaded = loadTrashNotes(storage)
        expect(loaded[0].id).toBe('t1')
      })
    })

    describe('loadViewPreference / saveViewPreference', () => {
      it('should return default grid view when empty', () => {
        expect(loadViewPreference(storage)).toBe(VIEW_GRID)
      })

      it('should save and load view preference', () => {
        saveViewPreference(VIEW_LIST, storage)
        expect(storage.getItem(STORAGE_KEY_VIEW)).toBe(VIEW_LIST)
        expect(loadViewPreference(storage)).toBe(VIEW_LIST)
      })
    })

    it('should not throw when storage is null', () => {
      expect(() => loadNotes(null)).not.toThrow()
      expect(() => saveNotes([], null)).not.toThrow()
      expect(() => loadArchivedNotes(null)).not.toThrow()
      expect(() => saveArchivedNotes([], null)).not.toThrow()
      expect(() => loadTrashNotes(null)).not.toThrow()
      expect(() => saveTrashNotes([], null)).not.toThrow()
      expect(() => loadViewPreference(null)).not.toThrow()
      expect(() => saveViewPreference(VIEW_GRID, null)).not.toThrow()
    })
  })

  describe('getTimeUntilReminder', () => {
    it('should return null when no reminder', () => {
      expect(getTimeUntilReminder(null)).toBeNull()
    })

    it('should show expired when time passed', () => {
      const now = Date.now()
      const past = now - 1000
      expect(getTimeUntilReminder(past, now)).toEqual({ expired: true, text: '已到达' })
    })

    it('should show minutes for upcoming reminder', () => {
      const now = Date.now()
      const future = now + (5 * 60 * 1000)
      expect(getTimeUntilReminder(future, now)).toEqual({ expired: false, text: '5分钟后' })
    })

    it('should show hours for longer reminder', () => {
      const now = Date.now()
      const future = now + (3 * 60 * 60 * 1000)
      expect(getTimeUntilReminder(future, now)).toEqual({ expired: false, text: '3小时后' })
    })

    it('should show days for distant reminder', () => {
      const now = Date.now()
      const future = now + (5 * 24 * 60 * 60 * 1000)
      expect(getTimeUntilReminder(future, now)).toEqual({ expired: false, text: '5天后' })
    })

    it('should show 即将到达 for less than 1 minute', () => {
      const now = Date.now()
      const future = now + 30000
      expect(getTimeUntilReminder(future, now)).toEqual({ expired: false, text: '即将到达' })
    })
  })
})
