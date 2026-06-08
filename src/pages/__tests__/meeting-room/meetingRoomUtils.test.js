import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateId,
  formatDate,
  formatTime,
  formatTimeRange,
  startOfDay,
  isSameDay,
  getTimeSlots,
  getHoursRange,
  buildDateTime,
  getCurrentUser,
  setCurrentUser,
  bookingsOverlap,
  findConflicts,
  hasConflict,
  isBookingExpired,
  cleanupExpiredBookings,
  validateBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  getBookingsForRoomAndDate,
  isSlotBooked,
  getBookingForSlot,
  filterBookingsByUser,
  sortBookingsByDateTime,
  loadBookings,
  saveBookings,
  areHoursConsecutive,
  hoursToRange,
  getDefaultBookings,
} from '@/pages/meeting-room/meetingRoomUtils.js'
import {
  STORAGE_KEY,
  CURRENT_USER_KEY,
  DEFAULT_CURRENT_USER,
  MEETING_ROOMS,
  START_HOUR,
  END_HOUR,
  VIEW_MODES,
  VIEW_MODE_LABELS,
} from '@/pages/meeting-room/constants.js'

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

function makeBooking(overrides = {}) {
  return {
    id: overrides.id !== undefined ? overrides.id : generateId(),
    bookedBy: overrides.bookedBy !== undefined ? overrides.bookedBy : '张三',
    title: overrides.title !== undefined ? overrides.title : '测试会议',
    roomId: overrides.roomId !== undefined ? overrides.roomId : 'A',
    date: overrides.date !== undefined ? overrides.date : '2025-01-15',
    startHour: overrides.startHour !== undefined ? overrides.startHour : 9,
    endHour: overrides.endHour !== undefined ? overrides.endHour : 10,
    createdAt: overrides.createdAt !== undefined ? overrides.createdAt : new Date().toISOString(),
  }
}

describe('meetingRoomUtils - generateId', () => {
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
})

describe('meetingRoomUtils - date and time formatting', () => {
  it('formatDate should return YYYY-MM-DD', () => {
    expect(formatDate(new Date(2025, 0, 15))).toBe('2025-01-15')
    expect(formatDate(new Date(2025, 11, 5))).toBe('2025-12-05')
  })

  it('formatTime should format hour to HH:00', () => {
    expect(formatTime(8)).toBe('08:00')
    expect(formatTime(9)).toBe('09:00')
    expect(formatTime(20)).toBe('20:00')
  })

  it('formatTimeRange should return range string', () => {
    expect(formatTimeRange(9, 11)).toBe('09:00 - 11:00')
    expect(formatTimeRange(14, 16)).toBe('14:00 - 16:00')
  })

  it('startOfDay should set time to midnight', () => {
    const d = startOfDay(new Date(2025, 0, 15, 14, 30, 45))
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(d.getSeconds()).toBe(0)
    expect(d.getMilliseconds()).toBe(0)
  })

  it('isSameDay should compare dates correctly', () => {
    expect(isSameDay(new Date(2025, 0, 15, 10), new Date(2025, 0, 15, 20))).toBe(true)
    expect(isSameDay(new Date(2025, 0, 15), new Date(2025, 0, 16))).toBe(false)
    expect(isSameDay('2025-01-15', new Date(2025, 0, 15))).toBe(true)
  })
})

describe('meetingRoomUtils - time slots and ranges', () => {
  it('getTimeSlots should return slots from START_HOUR to END_HOUR', () => {
    const slots = getTimeSlots()
    expect(slots.length).toBe(END_HOUR - START_HOUR)
    expect(slots[0].start).toBe(START_HOUR)
    expect(slots[0].end).toBe(START_HOUR + 1)
    expect(slots[slots.length - 1].start).toBe(END_HOUR - 1)
    expect(slots[slots.length - 1].end).toBe(END_HOUR)
  })

  it('getHoursRange should return array of hours', () => {
    expect(getHoursRange(9, 12)).toEqual([9, 10, 11])
    expect(getHoursRange(8, 9)).toEqual([8])
  })

  it('buildDateTime should create correct Date object', () => {
    const d = buildDateTime('2025-01-15', 14)
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(14)
    expect(d.getMinutes()).toBe(0)
  })
})

describe('meetingRoomUtils - current user', () => {
  let storage
  beforeEach(() => {
    storage = createMockStorage()
  })

  it('getCurrentUser should return default when storage empty', () => {
    expect(getCurrentUser(storage)).toBe(DEFAULT_CURRENT_USER)
  })

  it('setCurrentUser and getCurrentUser should round-trip', () => {
    setCurrentUser('测试用户', storage)
    expect(getCurrentUser(storage)).toBe('测试用户')
  })

  it('should not throw when storage is unavailable', () => {
    expect(() => getCurrentUser(null)).not.toThrow()
    expect(() => setCurrentUser('test', null)).not.toThrow()
    expect(getCurrentUser(null)).toBe(DEFAULT_CURRENT_USER)
  })
})

describe('meetingRoomUtils - booking overlap and conflict', () => {
  it('bookingsOverlap should detect overlapping same room same day', () => {
    const a = makeBooking({ startHour: 9, endHour: 11 })
    const b = makeBooking({ startHour: 10, endHour: 12 })
    expect(bookingsOverlap(a, b)).toBe(true)
  })

  it('bookingsOverlap should return false for non-overlapping', () => {
    const a = makeBooking({ startHour: 9, endHour: 10 })
    const b = makeBooking({ startHour: 10, endHour: 11 })
    expect(bookingsOverlap(a, b)).toBe(false)
  })

  it('bookingsOverlap should return false for different rooms', () => {
    const a = makeBooking({ roomId: 'A', startHour: 9, endHour: 11 })
    const b = makeBooking({ roomId: 'B', startHour: 9, endHour: 11 })
    expect(bookingsOverlap(a, b)).toBe(false)
  })

  it('bookingsOverlap should return false for different days', () => {
    const a = makeBooking({ date: '2025-01-15', startHour: 9, endHour: 11 })
    const b = makeBooking({ date: '2025-01-16', startHour: 9, endHour: 11 })
    expect(bookingsOverlap(a, b)).toBe(false)
  })

  it('findConflicts should list all conflicting bookings', () => {
    const existing = [
      makeBooking({ id: 'b1', startHour: 9, endHour: 10 }),
      makeBooking({ id: 'b2', startHour: 10, endHour: 12 }),
    ]
    const newBooking = makeBooking({ startHour: 9, endHour: 11 })
    const conflicts = findConflicts(existing, newBooking)
    expect(conflicts.length).toBe(2)
  })

  it('findConflicts should exclude the given id', () => {
    const existing = [makeBooking({ id: 'b1', startHour: 9, endHour: 11 })]
    const conflicts = findConflicts(existing, existing[0], 'b1')
    expect(conflicts.length).toBe(0)
  })

  it('hasConflict should return boolean', () => {
    const existing = [makeBooking({ startHour: 9, endHour: 11 })]
    const conflict = makeBooking({ startHour: 10, endHour: 12 })
    const noConflict = makeBooking({ startHour: 11, endHour: 12 })
    expect(hasConflict(existing, conflict)).toBe(true)
    expect(hasConflict(existing, noConflict)).toBe(false)
  })
})

describe('meetingRoomUtils - expired booking cleanup', () => {
  it('isBookingExpired should detect expired bookings', () => {
    const pastBooking = makeBooking({ date: '2020-01-01', startHour: 9, endHour: 10 })
    expect(isBookingExpired(pastBooking, new Date(2025, 0, 15))).toBe(true)
  })

  it('isBookingExpired should return false for future bookings', () => {
    const futureBooking = makeBooking({ date: '2030-01-01', startHour: 9, endHour: 10 })
    expect(isBookingExpired(futureBooking, new Date(2025, 0, 15))).toBe(false)
  })

  it('cleanupExpiredBookings should filter out expired bookings', () => {
    const bookings = [
      makeBooking({ id: 'b1', date: '2020-01-01', startHour: 9, endHour: 10 }),
      makeBooking({ id: 'b2', date: '2030-01-01', startHour: 9, endHour: 10 }),
    ]
    const result = cleanupExpiredBookings(bookings, new Date(2025, 0, 15))
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('b2')
  })
})

describe('meetingRoomUtils - validation', () => {
  it('should reject empty bookedBy', () => {
    const result = validateBooking(makeBooking({ bookedBy: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors.bookedBy).toBeTruthy()
  })

  it('should reject empty title', () => {
    const result = validateBooking(makeBooking({ title: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeTruthy()
  })

  it('should reject invalid roomId', () => {
    const result = validateBooking(makeBooking({ roomId: 'INVALID' }))
    expect(result.valid).toBe(false)
    expect(result.errors.roomId).toBeTruthy()
  })

  it('should reject invalid startHour', () => {
    const result = validateBooking(makeBooking({ startHour: 6 }))
    expect(result.valid).toBe(false)
    expect(result.errors.startHour).toBeTruthy()
  })

  it('should reject endHour before startHour', () => {
    const result = validateBooking(makeBooking({ startHour: 12, endHour: 10 }))
    expect(result.valid).toBe(false)
    expect(result.errors.endHour).toBeTruthy()
  })

  it('should reject bookings with time conflicts', () => {
    const existing = [makeBooking({ startHour: 9, endHour: 11 })]
    const result = validateBooking(
      makeBooking({ startHour: 10, endHour: 12 }),
      existing
    )
    expect(result.valid).toBe(false)
    expect(result.errors.conflict).toBeTruthy()
  })

  it('should accept a valid booking', () => {
    const result = validateBooking(makeBooking())
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors).length).toBe(0)
  })

  it('should reject booking with bookedBy too long', () => {
    const longName = 'a'.repeat(51)
    const result = validateBooking(makeBooking({ bookedBy: longName }))
    expect(result.valid).toBe(false)
    expect(result.errors.bookedBy).toBeTruthy()
  })

  it('should reject booking with title too long', () => {
    const longTitle = 'a'.repeat(201)
    const result = validateBooking(makeBooking({ title: longTitle }))
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeTruthy()
  })
})

describe('meetingRoomUtils - CRUD operations', () => {
  it('createBooking should add a new booking with generated id', () => {
    const result = createBooking([], makeBooking({ id: undefined }))
    expect(result.success).toBe(true)
    expect(result.bookings.length).toBe(1)
    expect(result.bookings[0].id).toBeTruthy()
  })

  it('createBooking should return errors for invalid data', () => {
    const result = createBooking([], makeBooking({ title: '' }))
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('createBooking should not mutate original array', () => {
    const original = []
    createBooking(original, makeBooking({ id: undefined }))
    expect(original.length).toBe(0)
  })

  it('updateBooking should update existing booking', () => {
    const booking = makeBooking({ id: 'b1', title: 'Original' })
    const result = updateBooking([booking], 'b1', { title: 'Updated' })
    expect(result.success).toBe(true)
    expect(result.bookings[0].title).toBe('Updated')
  })

  it('updateBooking should fail for non-existent id', () => {
    const result = updateBooking([], 'nope', { title: 'X' })
    expect(result.success).toBe(false)
    expect(result.errors.id).toBeTruthy()
  })

  it('updateBooking should validate and reject conflicts', () => {
    const bookings = [
      makeBooking({ id: 'b1', startHour: 9, endHour: 10 }),
      makeBooking({ id: 'b2', startHour: 11, endHour: 12 }),
    ]
    const result = updateBooking(bookings, 'b2', { startHour: 9, endHour: 10 })
    expect(result.success).toBe(false)
    expect(result.errors.conflict).toBeTruthy()
  })

  it('deleteBooking should remove booking by id', () => {
    const bookings = [makeBooking({ id: 'b1' }), makeBooking({ id: 'b2' })]
    const result = deleteBooking(bookings, 'b1')
    expect(result.success).toBe(true)
    expect(result.bookings.length).toBe(1)
    expect(result.bookings[0].id).toBe('b2')
  })

  it('deleteBooking should handle non-existent id gracefully', () => {
    const bookings = [makeBooking({ id: 'b1' })]
    const result = deleteBooking(bookings, 'nope')
    expect(result.success).toBe(false)
    expect(result.bookings.length).toBe(1)
  })
})

describe('meetingRoomUtils - booking queries', () => {
  const date = '2025-01-15'
  const bookings = [
    makeBooking({ id: 'b1', roomId: 'A', date, startHour: 9, endHour: 11 }),
    makeBooking({ id: 'b2', roomId: 'A', date, startHour: 14, endHour: 15 }),
    makeBooking({ id: 'b3', roomId: 'B', date, startHour: 9, endHour: 10 }),
    makeBooking({ id: 'b4', roomId: 'A', date: '2025-01-16', startHour: 9, endHour: 10 }),
  ]

  it('getBookingsForRoomAndDate should filter correctly', () => {
    const result = getBookingsForRoomAndDate(bookings, 'A', date)
    expect(result.length).toBe(2)
    expect(result.every((b) => b.id === 'b1' || b.id === 'b2')).toBe(true)
  })

  it('isSlotBooked should detect booked slots', () => {
    expect(isSlotBooked(bookings, 'A', date, 9)).toBe(true)
    expect(isSlotBooked(bookings, 'A', date, 10)).toBe(true)
    expect(isSlotBooked(bookings, 'A', date, 11)).toBe(false)
    expect(isSlotBooked(bookings, 'A', date, 14)).toBe(true)
    expect(isSlotBooked(bookings, 'B', date, 9)).toBe(true)
    expect(isSlotBooked(bookings, 'A', '2025-01-17', 9)).toBe(false)
  })

  it('getBookingForSlot should return correct booking', () => {
    const b = getBookingForSlot(bookings, 'A', date, 9)
    expect(b).toBeTruthy()
    expect(b.id).toBe('b1')
    expect(getBookingForSlot(bookings, 'A', date, 12)).toBeFalsy()
  })

  it('filterBookingsByUser should filter by bookedBy', () => {
    const mixed = [
      makeBooking({ id: 'u1', bookedBy: '张三' }),
      makeBooking({ id: 'u2', bookedBy: '李四' }),
      makeBooking({ id: 'u3', bookedBy: '张三' }),
    ]
    const result = filterBookingsByUser(mixed, '张三')
    expect(result.length).toBe(2)
    expect(result.every((b) => b.bookedBy === '张三')).toBe(true)
  })

  it('sortBookingsByDateTime should sort by date then hour', () => {
    const unsorted = [
      makeBooking({ id: '3', date: '2025-01-15', startHour: 14 }),
      makeBooking({ id: '1', date: '2025-01-15', startHour: 9 }),
      makeBooking({ id: '2', date: '2025-01-14', startHour: 9 }),
    ]
    const sorted = sortBookingsByDateTime(unsorted)
    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('1')
    expect(sorted[2].id).toBe('3')
  })
})

describe('meetingRoomUtils - localStorage persistence', () => {
  let storage
  const FIXED_FUTURE_DATE = '2099-06-15'
  beforeEach(() => {
    storage = createMockStorage()
  })

  it('loadBookings should return defaults and persist when storage empty', () => {
    const bookings = loadBookings(storage, FIXED_FUTURE_DATE)
    expect(Array.isArray(bookings)).toBe(true)
    expect(bookings.length).toBe(2)
    expect(bookings[0].bookedBy).toBe('李四')
    expect(bookings[0].title).toBe('产品需求评审')
    expect(bookings[0].roomId).toBe('A')
    expect(bookings[0].date).toBe(FIXED_FUTURE_DATE)
    expect(bookings[0].startHour).toBe(9)
    expect(bookings[0].endHour).toBe(11)
    expect(bookings[1].bookedBy).toBe('王五')
    expect(bookings[1].title).toBe('技术方案讨论')
    expect(bookings[1].roomId).toBe('B')
    expect(bookings[1].date).toBe(FIXED_FUTURE_DATE)
    expect(bookings[1].startHour).toBe(14)
    expect(bookings[1].endHour).toBe(16)
    expect(storage.getItem(STORAGE_KEY)).toBeTruthy()
  })

  it('saveBookings and loadBookings should round-trip correctly', () => {
    const testBookings = [makeBooking({ id: 'persist-1', title: 'Persisted', date: '2099-01-01' })]
    saveBookings(testBookings, storage)
    const loaded = loadBookings(storage)
    expect(loaded.length).toBe(1)
    expect(loaded[0].title).toBe('Persisted')
  })

  it('loadBookings should return defaults for corrupted JSON', () => {
    storage.setItem(STORAGE_KEY, '{bad json')
    const bookings = loadBookings(storage, FIXED_FUTURE_DATE)
    expect(Array.isArray(bookings)).toBe(true)
    expect(bookings.length).toBe(2)
    expect(bookings[0].bookedBy).toBe('李四')
    expect(bookings[1].bookedBy).toBe('王五')
    expect(bookings.every((b) => b.date === FIXED_FUTURE_DATE)).toBe(true)
  })

  it('loadBookings should return defaults for non-array data', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ not: 'array' }))
    const bookings = loadBookings(storage, FIXED_FUTURE_DATE)
    expect(Array.isArray(bookings)).toBe(true)
    expect(bookings.length).toBe(2)
    expect(bookings[0].bookedBy).toBe('李四')
    expect(bookings[0].title).toBe('产品需求评审')
    expect(bookings[0].roomId).toBe('A')
    expect(bookings[0].date).toBe(FIXED_FUTURE_DATE)
    expect(bookings[1].bookedBy).toBe('王五')
    expect(bookings[1].title).toBe('技术方案讨论')
    expect(bookings[1].roomId).toBe('B')
    expect(bookings[1].date).toBe(FIXED_FUTURE_DATE)
  })

  it('loadBookings should filter out invalid booking entries', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: '1', bookedBy: 'test', title: 'Valid', roomId: 'A', date: '2099-01-15', startHour: 9, endHour: 10 },
        { id: '2' },
        null,
      ])
    )
    const bookings = loadBookings(storage)
    expect(bookings.length).toBe(1)
    expect(bookings[0].id).toBe('1')
    expect(bookings[0].bookedBy).toBe('test')
  })

  it('should not throw when storage is unavailable', () => {
    expect(() => loadBookings(null)).not.toThrow()
    expect(() => saveBookings([], null)).not.toThrow()
  })

  it('saveBookings should cleanup expired bookings before saving', () => {
    const now = new Date(2025, 0, 15)
    const bookings = [
      makeBooking({ id: 'expired', date: '2020-01-01', startHour: 9, endHour: 10 }),
      makeBooking({ id: 'valid', date: '2030-01-01', startHour: 9, endHour: 10 }),
    ]
    saveBookings(bookings, storage)
    const saved = JSON.parse(storage.getItem(STORAGE_KEY))
    expect(saved.some((b) => b.id === 'expired')).toBe(false)
    expect(saved.some((b) => b.id === 'valid')).toBe(true)
  })
})

describe('meetingRoomUtils - hour utilities', () => {
  it('areHoursConsecutive should detect consecutive hours', () => {
    expect(areHoursConsecutive([9, 10, 11])).toBe(true)
    expect(areHoursConsecutive([14, 15])).toBe(true)
    expect(areHoursConsecutive([9])).toBe(true)
  })

  it('areHoursConsecutive should return false for non-consecutive', () => {
    expect(areHoursConsecutive([9, 11])).toBe(false)
    expect(areHoursConsecutive([9, 10, 12])).toBe(false)
  })

  it('areHoursConsecutive should handle edge cases', () => {
    expect(areHoursConsecutive([])).toBe(false)
    expect(areHoursConsecutive(null)).toBe(false)
  })

  it('hoursToRange should convert sorted hours to range', () => {
    expect(hoursToRange([9, 10, 11])).toEqual({ startHour: 9, endHour: 12 })
    expect(hoursToRange([14])).toEqual({ startHour: 14, endHour: 15 })
  })

  it('hoursToRange should return null for empty/invalid input', () => {
    expect(hoursToRange([])).toBeNull()
    expect(hoursToRange(null)).toBeNull()
  })

  it('hoursToRange should work with unsorted hours', () => {
    expect(hoursToRange([11, 9, 10])).toEqual({ startHour: 9, endHour: 12 })
  })
})

describe('meetingRoomUtils - constants integrity', () => {
  it('MEETING_ROOMS should have A, B, C rooms', () => {
    expect(MEETING_ROOMS.map((r) => r.id)).toEqual(['A', 'B', 'C'])
  })

  it('START_HOUR and END_HOUR should define valid range', () => {
    expect(END_HOUR).toBeGreaterThan(START_HOUR)
    expect(START_HOUR).toBeGreaterThanOrEqual(0)
    expect(END_HOUR).toBeLessThanOrEqual(24)
  })

  it('VIEW_MODES should have three view modes', () => {
    expect(Object.keys(VIEW_MODES).length).toBe(3)
    expect(VIEW_MODES.GRID).toBe('grid')
    expect(VIEW_MODES.MY_BOOKINGS).toBe('my_bookings')
    expect(VIEW_MODES.ALL_BOOKINGS).toBe('all_bookings')
  })

  it('VIEW_MODE_LABELS should have labels for all modes', () => {
    Object.values(VIEW_MODES).forEach((mode) => {
      expect(VIEW_MODE_LABELS[mode]).toBeTruthy()
      expect(typeof VIEW_MODE_LABELS[mode]).toBe('string')
    })
  })

  it('MEETING_ROOMS should have capacity information', () => {
    MEETING_ROOMS.forEach((room) => {
      expect(room.id).toBeTruthy()
      expect(room.name).toBeTruthy()
      expect(typeof room.capacity).toBe('number')
      expect(room.capacity).toBeGreaterThan(0)
    })
  })
})

describe('meetingRoomUtils - getDefaultBookings', () => {
  it('should return two default bookings', () => {
    const defaults = getDefaultBookings('2099-01-01')
    expect(Array.isArray(defaults)).toBe(true)
    expect(defaults.length).toBe(2)
  })

  it('should use the provided date', () => {
    const date = '2099-06-15'
    const defaults = getDefaultBookings(date)
    expect(defaults.every((b) => b.date === date)).toBe(true)
  })

  it('should fall back to current date when no date provided', () => {
    const defaults = getDefaultBookings()
    const today = formatDate(new Date())
    expect(defaults.every((b) => b.date === today)).toBe(true)
  })

  it('should have valid booking structure', () => {
    const defaults = getDefaultBookings('2099-01-01')
    defaults.forEach((b) => {
      expect(b.id).toBeTruthy()
      expect(b.bookedBy).toBeTruthy()
      expect(b.title).toBeTruthy()
      expect(b.roomId).toBeTruthy()
      expect(b.date).toBeTruthy()
      expect(typeof b.startHour).toBe('number')
      expect(typeof b.endHour).toBe('number')
      expect(b.createdAt).toBeTruthy()
    })
  })

  it('should generate unique ids for each call', () => {
    const a = getDefaultBookings('2099-01-01')
    const b = getDefaultBookings('2099-01-01')
    expect(a[0].id).not.toBe(b[0].id)
    expect(a[1].id).not.toBe(b[1].id)
  })
})

describe('meetingRoomUtils - additional validation edge cases', () => {
  it('should reject booking with only whitespace bookedBy', () => {
    const result = validateBooking(makeBooking({ bookedBy: '   ' }))
    expect(result.valid).toBe(false)
    expect(result.errors.bookedBy).toBeTruthy()
  })

  it('should reject booking with only whitespace title', () => {
    const result = validateBooking(makeBooking({ title: '   ' }))
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeTruthy()
  })

  it('should reject booking with startHour equal to END_HOUR', () => {
    const result = validateBooking(makeBooking({ startHour: END_HOUR, endHour: END_HOUR + 1 }))
    expect(result.valid).toBe(false)
    expect(result.errors.startHour).toBeTruthy()
  })

  it('should accept booking with endHour equal to END_HOUR', () => {
    const result = validateBooking(makeBooking({ startHour: END_HOUR - 1, endHour: END_HOUR }))
    expect(result.valid).toBe(true)
  })

  it('should reject booking with endHour equal to START_HOUR', () => {
    const result = validateBooking(makeBooking({ startHour: START_HOUR - 1, endHour: START_HOUR }))
    expect(result.valid).toBe(false)
  })

  it('should reject null booking', () => {
    const result = validateBooking(null)
    expect(result.valid).toBe(false)
    expect(result.errors.booking).toBeTruthy()
  })

  it('should reject booking with missing date', () => {
    const b = makeBooking()
    delete b.date
    const result = validateBooking(b)
    expect(result.valid).toBe(false)
    expect(result.errors.date).toBeTruthy()
  })

  it('should trim bookedBy and title in createBooking', () => {
    const result = createBooking([], makeBooking({
      id: undefined,
      bookedBy: '  张三  ',
      title: '  测试会议  ',
      date: '2099-01-01',
    }))
    expect(result.success).toBe(true)
    expect(result.bookings[0].bookedBy).toBe('张三')
    expect(result.bookings[0].title).toBe('测试会议')
  })

  it('should trim bookedBy and title in updateBooking', () => {
    const existing = [makeBooking({ id: 'b1', date: '2099-01-01' })]
    const result = updateBooking(existing, 'b1', {
      bookedBy: '  李四  ',
      title: '  更新的会议  ',
    })
    expect(result.success).toBe(true)
    expect(result.bookings[0].bookedBy).toBe('李四')
    expect(result.bookings[0].title).toBe('更新的会议')
  })
})

describe('meetingRoomUtils - additional overlap edge cases', () => {
  it('bookingsOverlap should return false for exact boundary touch (end == start)', () => {
    const a = makeBooking({ startHour: 9, endHour: 10 })
    const b = makeBooking({ startHour: 10, endHour: 11 })
    expect(bookingsOverlap(a, b)).toBe(false)
  })

  it('bookingsOverlap should return true for full containment', () => {
    const a = makeBooking({ startHour: 9, endHour: 15 })
    const b = makeBooking({ startHour: 10, endHour: 12 })
    expect(bookingsOverlap(a, b)).toBe(true)
    expect(bookingsOverlap(b, a)).toBe(true)
  })

  it('bookingsOverlap should return true for exact same time', () => {
    const a = makeBooking({ startHour: 9, endHour: 10 })
    const b = makeBooking({ startHour: 9, endHour: 10 })
    expect(bookingsOverlap(a, b)).toBe(true)
  })

  it('hasConflict should return false when excluding self', () => {
    const existing = [makeBooking({ id: 'b1', startHour: 9, endHour: 10 })]
    expect(hasConflict(existing, existing[0], 'b1')).toBe(false)
  })
})

describe('meetingRoomUtils - additional CRUD edge cases', () => {
  it('createBooking should not add booking on validation failure', () => {
    const original = [makeBooking({ id: 'exist', date: '2099-01-01' })]
    const result = createBooking(original, makeBooking({ id: undefined, title: '' }))
    expect(result.success).toBe(false)
    expect(result.bookings).toBeUndefined()
  })

  it('updateBooking should not modify other fields when not specified', () => {
    const original = makeBooking({
      id: 'b1',
      bookedBy: '张三',
      title: '原标题',
      roomId: 'A',
      date: '2099-01-01',
      startHour: 9,
      endHour: 10,
    })
    const result = updateBooking([original], 'b1', { title: '新标题' })
    expect(result.success).toBe(true)
    expect(result.bookings[0].bookedBy).toBe('张三')
    expect(result.bookings[0].roomId).toBe('A')
    expect(result.bookings[0].startHour).toBe(9)
    expect(result.bookings[0].endHour).toBe(10)
  })

  it('sortBookingsByDateTime should not mutate original array', () => {
    const unsorted = [
      makeBooking({ id: '2', date: '2025-01-15', startHour: 14 }),
      makeBooking({ id: '1', date: '2025-01-15', startHour: 9 }),
    ]
    const originalIds = unsorted.map((b) => b.id)
    sortBookingsByDateTime(unsorted)
    expect(unsorted.map((b) => b.id)).toEqual(originalIds)
  })
})

describe('meetingRoomUtils - additional expired booking tests', () => {
  it('isBookingExpired should return false exactly at end time', () => {
    const booking = makeBooking({ date: '2025-01-15', startHour: 9, endHour: 10 })
    const exactlyAtEnd = buildDateTime('2025-01-15', 10)
    expect(isBookingExpired(booking, exactlyAtEnd)).toBe(false)
  })

  it('isBookingExpired should return true just after end time', () => {
    const booking = makeBooking({ date: '2025-01-15', startHour: 9, endHour: 10 })
    const justAfter = new Date(buildDateTime('2025-01-15', 10).getTime() + 1)
    expect(isBookingExpired(booking, justAfter)).toBe(true)
  })

  it('cleanupExpiredBookings should return empty array for all expired', () => {
    const bookings = [
      makeBooking({ date: '2020-01-01', startHour: 9, endHour: 10 }),
      makeBooking({ date: '2019-06-15', startHour: 14, endHour: 16 }),
    ]
    const result = cleanupExpiredBookings(bookings, new Date(2025, 0, 15))
    expect(result).toEqual([])
  })

  it('cleanupExpiredBookings should not mutate original array', () => {
    const bookings = [makeBooking({ date: '2020-01-01', startHour: 9, endHour: 10 })]
    cleanupExpiredBookings(bookings, new Date(2025, 0, 15))
    expect(bookings.length).toBe(1)
  })
})

describe('meetingRoomUtils - additional query tests', () => {
  it('getBookingsForRoomAndDate should return empty array when no matches', () => {
    const result = getBookingsForRoomAndDate([], 'A', '2099-01-01')
    expect(result).toEqual([])
  })

  it('filterBookingsByUser should return empty array when no matches', () => {
    const bookings = [makeBooking({ bookedBy: '张三' })]
    const result = filterBookingsByUser(bookings, '不存在的用户')
    expect(result).toEqual([])
  })

  it('isSlotBooked should return false for empty bookings', () => {
    expect(isSlotBooked([], 'A', '2099-01-01', 9)).toBe(false)
  })

  it('getBookingForSlot should return undefined for empty bookings', () => {
    expect(getBookingForSlot([], 'A', '2099-01-01', 9)).toBeFalsy()
  })
})
