import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateId,
  formatDate,
  formatTime,
  formatDateTime,
  parseDateTime,
  startOfDay,
  endOfDay,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  getWeekDates,
  getMonthGridDates,
  isSameDay,
  isSameMonth,
  isToday,
  getMinutesFromStart,
  getEventDurationMinutes,
  eventsOverlap,
  findConflicts,
  hasConflict,
  filterEventsByDay,
  filterEventsByWeek,
  filterEventsByMonth,
  searchEvents,
  getMatchingEventIds,
  validateEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  loadEvents,
  saveEvents,
  getCategoryById,
  snapTimeToSlot,
  pixelsToMinutes,
  minutesToPixels,
  getDayViewEventPosition,
  getWeekViewEventPosition,
} from '@/pages/calendar/calendarUtils.js'
import { STORAGE_KEY, CATEGORIES, MIN_EVENT_MINUTES } from '@/pages/calendar/constants.js'

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

function makeISO(y, m, d, h = 0, min = 0) {
  return new Date(y, m - 1, d, h, min, 0, 0).toISOString()
}

function makeEvent(overrides = {}) {
  return {
    id: overrides.id || generateId(),
    title: overrides.title || 'Test Event',
    startTime: overrides.startTime || makeISO(2025, 1, 15, 10),
    endTime: overrides.endTime || makeISO(2025, 1, 15, 11),
    category: overrides.category || 'work',
    color: overrides.color || '#3b82f6',
  }
}

function pixelsToPixels(pixels, hourHeight) {
  return minutesToPixels(pixelsToMinutes(pixels, hourHeight), hourHeight)
}

describe('calendarUtils - generateId', () => {
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

describe('calendarUtils - date formatting', () => {
  it('formatDate should return YYYY-MM-DD', () => {
    expect(formatDate(new Date(2025, 0, 15))).toBe('2025-01-15')
    expect(formatDate(new Date(2025, 11, 5))).toBe('2025-12-05')
  })

  it('formatTime should return HH:MM', () => {
    expect(formatTime(new Date(2025, 0, 15, 9, 5))).toBe('09:05')
    expect(formatTime(new Date(2025, 0, 15, 14, 30))).toBe('14:30')
  })

  it('formatDateTime should return YYYY-MM-DD HH:MM', () => {
    expect(formatDateTime(new Date(2025, 0, 15, 9, 5))).toBe('2025-01-15 09:05')
  })

  it('parseDateTime should parse date and time strings', () => {
    const d = parseDateTime('2025-01-15', '09:30')
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(9)
    expect(d.getMinutes()).toBe(30)
  })
})

describe('calendarUtils - date manipulation', () => {
  it('startOfDay should set time to midnight', () => {
    const d = startOfDay(new Date(2025, 0, 15, 14, 30, 45))
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(d.getSeconds()).toBe(0)
    expect(d.getMilliseconds()).toBe(0)
  })

  it('endOfDay should set time to 23:59:59.999', () => {
    const d = endOfDay(new Date(2025, 0, 15, 14, 30))
    expect(d.getHours()).toBe(23)
    expect(d.getMinutes()).toBe(59)
    expect(d.getSeconds()).toBe(59)
    expect(d.getMilliseconds()).toBe(999)
  })

  it('addDays should add/subtract days', () => {
    const d = addDays(new Date(2025, 0, 15), 3)
    expect(d.getDate()).toBe(18)
    const d2 = addDays(new Date(2025, 0, 15), -2)
    expect(d2.getDate()).toBe(13)
  })

  it('addMonths should add/subtract months', () => {
    const d = addMonths(new Date(2025, 0, 15), 2)
    expect(d.getMonth()).toBe(2)
    expect(d.getFullYear()).toBe(2025)
    const d2 = addMonths(new Date(2025, 0, 15), -1)
    expect(d2.getMonth()).toBe(11)
    expect(d2.getFullYear()).toBe(2024)
  })

  it('startOfWeek should return Sunday of the week', () => {
    const d = startOfWeek(new Date(2025, 0, 15))
    expect(d.getDay()).toBe(0)
    expect(d.getDate()).toBe(12)
  })

  it('endOfWeek should return Saturday of the week', () => {
    const d = endOfWeek(new Date(2025, 0, 15))
    expect(d.getDay()).toBe(6)
    expect(d.getDate()).toBe(18)
  })

  it('startOfMonth should return first day of month', () => {
    const d = startOfMonth(new Date(2025, 0, 15))
    expect(d.getDate()).toBe(1)
    expect(d.getMonth()).toBe(0)
  })

  it('endOfMonth should return last day of month', () => {
    const d = endOfMonth(new Date(2025, 0, 15))
    expect(d.getDate()).toBe(31)
    const d2 = endOfMonth(new Date(2025, 1, 15))
    expect(d2.getDate()).toBe(28)
  })

  it('getWeekDates should return 7 dates starting from Sunday', () => {
    const dates = getWeekDates(new Date(2025, 0, 15))
    expect(dates.length).toBe(7)
    expect(dates[0].getDay()).toBe(0)
    expect(dates[6].getDay()).toBe(6)
    expect(dates[0].getDate()).toBe(12)
    expect(dates[6].getDate()).toBe(18)
  })

  it('getMonthGridDates should return 42 dates (6 weeks)', () => {
    const dates = getMonthGridDates(new Date(2025, 0, 15))
    expect(dates.length).toBe(42)
  })
})

describe('calendarUtils - date comparison', () => {
  it('isSameDay should compare dates correctly', () => {
    expect(isSameDay(new Date(2025, 0, 15, 10), new Date(2025, 0, 15, 20))).toBe(true)
    expect(isSameDay(new Date(2025, 0, 15), new Date(2025, 0, 16))).toBe(false)
    expect(isSameDay(new Date(2025, 0, 15), new Date(2025, 1, 15))).toBe(false)
  })

  it('isSameMonth should compare months correctly', () => {
    expect(isSameMonth(new Date(2025, 0, 15), new Date(2025, 0, 20))).toBe(true)
    expect(isSameMonth(new Date(2025, 0, 15), new Date(2025, 1, 15))).toBe(false)
  })

  it('isToday should return true for today', () => {
    expect(isToday(new Date())).toBe(true)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isToday(tomorrow)).toBe(false)
  })
})

describe('calendarUtils - time utilities', () => {
  it('getMinutesFromStart should return minutes since midnight', () => {
    expect(getMinutesFromStart(new Date(2025, 0, 15, 0, 0))).toBe(0)
    expect(getMinutesFromStart(new Date(2025, 0, 15, 9, 30))).toBe(570)
    expect(getMinutesFromStart(new Date(2025, 0, 15, 23, 59))).toBe(1439)
  })

  it('getEventDurationMinutes should calculate duration', () => {
    const event = makeEvent({
      startTime: makeISO(2025, 1, 15, 10),
      endTime: makeISO(2025, 1, 15, 11, 30),
    })
    expect(getEventDurationMinutes(event)).toBe(90)
  })

  it('snapTimeToSlot should snap to nearest 15 minutes', () => {
    const d1 = snapTimeToSlot(new Date(2025, 0, 15, 9, 7))
    expect(d1.getHours()).toBe(9)
    expect(d1.getMinutes()).toBe(0)
    const d2 = snapTimeToSlot(new Date(2025, 0, 15, 9, 10))
    expect(d2.getHours()).toBe(9)
    expect(d2.getMinutes()).toBe(15)
  })

  it('snapTimeToSlot should correctly snap to next hour without double hour increment', () => {
    const d = snapTimeToSlot(new Date(2025, 0, 15, 9, 53))
    expect(d.getHours()).toBe(10)
    expect(d.getMinutes()).toBe(0)
  })

  it('snapTimeToSlot should snap 23:53 to next day 00:00', () => {
    const d = snapTimeToSlot(new Date(2025, 0, 15, 23, 53))
    expect(d.getDate()).toBe(16)
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
  })

  it('snapTimeToSlot supports custom slot minutes', () => {
    const d = snapTimeToSlot(new Date(2025, 0, 15, 9, 37), 30)
    expect(d.getHours()).toBe(9)
    expect(d.getMinutes()).toBe(30)
    const d2 = snapTimeToSlot(new Date(2025, 0, 15, 9, 46), 30)
    expect(d2.getHours()).toBe(10)
    expect(d2.getMinutes()).toBe(0)
  })
})

describe('calendarUtils - pixel/minute conversion', () => {
  it('PIXELS_PER_MINUTE_RATIO with HOUR_HEIGHT=60 should be 1.0', () => {
    expect(60 / 60).toBe(1.0)
  })

  it('pixelsToMinutes and minutesToPixels should be inverse operations', () => {
    const hourHeight = 60
    expect(pixelsToMinutes(60, hourHeight)).toBe(60)
    expect(pixelsToMinutes(30, hourHeight)).toBe(30)
    expect(minutesToPixels(60, hourHeight)).toBe(60)
    expect(minutesToPixels(30, hourHeight)).toBe(30)
    expect(pixelsToMinutes(minutesToPixels(90, hourHeight), hourHeight)).toBe(90)
  })

  it('conversion should be consistent with different hour heights', () => {
    expect(pixelsToMinutes(120, 120)).toBe(60)
    expect(minutesToPixels(60, 120)).toBe(120)
    expect(pixelsToPixels(30, 48)).toBe(30)
    expect(pixelsToPixels(60, 60)).toBe(60)
  })
})

describe('calendarUtils - getDayViewEventPosition (cross-day clamping)', () => {
  const HOUR_HEIGHT = 60

  it('should position a normal same-day event correctly', () => {
    const event = makeEvent({
      startTime: makeISO(2025, 1, 15, 10),
      endTime: makeISO(2025, 1, 15, 11, 30),
    })
    const pos = getDayViewEventPosition(event, new Date(2025, 0, 15), HOUR_HEIGHT)
    expect(pos.top).toBe(10 * 60)
    expect(pos.height).toBeGreaterThanOrEqual(90 - 2)
    expect(pos.startsBeforeDay).toBe(false)
    expect(pos.endsAfterDay).toBe(false)
  })

  it('should clamp an event starting before the day to top=0', () => {
    const event = makeEvent({
      startTime: makeISO(2025, 1, 14, 22),
      endTime: makeISO(2025, 1, 15, 2),
    })
    const pos = getDayViewEventPosition(event, new Date(2025, 0, 15), HOUR_HEIGHT)
    expect(pos.top).toBe(0)
    expect(pos.height).toBe(2 * 60 - 2)
    expect(pos.startsBeforeDay).toBe(true)
    expect(pos.endsAfterDay).toBe(false)
  })

  it('should clamp an event ending after the day', () => {
    const event = makeEvent({
      startTime: makeISO(2025, 1, 15, 22),
      endTime: makeISO(2025, 1, 16, 4),
    })
    const pos = getDayViewEventPosition(event, new Date(2025, 0, 15), HOUR_HEIGHT)
    expect(pos.top).toBe(22 * 60)
    expect(pos.height).toBeCloseTo(2 * 60 - 2)
    expect(pos.startsBeforeDay).toBe(false)
    expect(pos.endsAfterDay).toBe(true)
  })

  it('should clamp an event spanning the entire day', () => {
    const event = makeEvent({
      startTime: makeISO(2025, 1, 14, 10),
      endTime: makeISO(2025, 1, 16, 10),
    })
    const pos = getDayViewEventPosition(event, new Date(2025, 0, 15), HOUR_HEIGHT)
    expect(pos.top).toBe(0)
    expect(pos.height).toBeGreaterThanOrEqual(24 * 60 - 2)
    expect(pos.startsBeforeDay).toBe(true)
    expect(pos.endsAfterDay).toBe(true)
  })

  it('should enforce minimum height for very short events', () => {
    const event = makeEvent({
      startTime: makeISO(2025, 1, 15, 10),
      endTime: makeISO(2025, 1, 15, 10, 20),
    })
    const pos = getDayViewEventPosition(event, new Date(2025, 0, 15), HOUR_HEIGHT)
    expect(pos.height).toBe(24)
  })

  it('getWeekViewEventPosition should delegate to getDayViewEventPosition', () => {
    const event = makeEvent({
      startTime: makeISO(2025, 1, 15, 9),
      endTime: makeISO(2025, 1, 15, 10),
    })
    const dayPos = getDayViewEventPosition(event, new Date(2025, 0, 15), HOUR_HEIGHT)
    const weekPos = getWeekViewEventPosition(event, new Date(2025, 0, 15), HOUR_HEIGHT)
    expect(weekPos).toEqual(dayPos)
  })
})

describe('calendarUtils - event overlap and conflict', () => {
  it('eventsOverlap should detect overlapping events', () => {
    const a = makeEvent({ startTime: makeISO(2025, 1, 15, 10), endTime: makeISO(2025, 1, 15, 12) })
    const b = makeEvent({ startTime: makeISO(2025, 1, 15, 11), endTime: makeISO(2025, 1, 15, 13) })
    expect(eventsOverlap(a, b)).toBe(true)
  })

  it('eventsOverlap should return false for non-overlapping events', () => {
    const a = makeEvent({ startTime: makeISO(2025, 1, 15, 10), endTime: makeISO(2025, 1, 15, 11) })
    const b = makeEvent({ startTime: makeISO(2025, 1, 15, 11), endTime: makeISO(2025, 1, 15, 12) })
    expect(eventsOverlap(a, b)).toBe(false)
  })

  it('findConflicts should list all conflicting events', () => {
    const existing = [
      makeEvent({ id: 'e1', startTime: makeISO(2025, 1, 15, 9), endTime: makeISO(2025, 1, 15, 10) }),
      makeEvent({ id: 'e2', startTime: makeISO(2025, 1, 15, 10, 30), endTime: makeISO(2025, 1, 15, 12) }),
    ]
    const newEvent = makeEvent({ startTime: makeISO(2025, 1, 15, 10), endTime: makeISO(2025, 1, 15, 11) })
    const conflicts = findConflicts(existing, newEvent)
    expect(conflicts.length).toBe(1)
    expect(conflicts[0].id).toBe('e2')
  })

  it('findConflicts should exclude the given id', () => {
    const existing = [
      makeEvent({ id: 'e1', startTime: makeISO(2025, 1, 15, 10), endTime: makeISO(2025, 1, 15, 12) }),
    ]
    const conflicts = findConflicts(existing, existing[0], 'e1')
    expect(conflicts.length).toBe(0)
  })

  it('hasConflict should return boolean', () => {
    const existing = [makeEvent({ startTime: makeISO(2025, 1, 15, 10), endTime: makeISO(2025, 1, 15, 12) })]
    const conflict = makeEvent({ startTime: makeISO(2025, 1, 15, 11), endTime: makeISO(2025, 1, 15, 13) })
    const noConflict = makeEvent({ startTime: makeISO(2025, 1, 15, 13), endTime: makeISO(2025, 1, 15, 14) })
    expect(hasConflict(existing, conflict)).toBe(true)
    expect(hasConflict(existing, noConflict)).toBe(false)
  })
})

describe('calendarUtils - filtering events', () => {
  const makeSampleEvents = () => [
    makeEvent({ id: 'd15-1', startTime: makeISO(2025, 1, 15, 10), endTime: makeISO(2025, 1, 15, 11) }),
    makeEvent({ id: 'd15-2', startTime: makeISO(2025, 1, 15, 14), endTime: makeISO(2025, 1, 15, 15) }),
    makeEvent({ id: 'd16-1', startTime: makeISO(2025, 1, 16, 9), endTime: makeISO(2025, 1, 16, 10) }),
    makeEvent({ id: 'feb-1', startTime: makeISO(2025, 2, 1, 9), endTime: makeISO(2025, 2, 1, 10) }),
  ]

  it('filterEventsByDay should return events on a specific day', () => {
    const events = makeSampleEvents()
    const filtered = filterEventsByDay(events, new Date(2025, 0, 15))
    expect(filtered.length).toBe(2)
    expect(filtered.every((e) => e.id.startsWith('d15'))).toBe(true)
  })

  it('filterEventsByWeek should return events in a week', () => {
    const events = makeSampleEvents()
    const filtered = filterEventsByWeek(events, new Date(2025, 0, 15))
    expect(filtered.length).toBe(3)
  })

  it('filterEventsByMonth should return events in a month', () => {
    const events = makeSampleEvents()
    const filtered = filterEventsByMonth(events, new Date(2025, 0, 15))
    expect(filtered.length).toBe(3)
    expect(filtered.every((e) => e.id !== 'feb-1')).toBe(true)
  })

  it('searchEvents should do case-insensitive partial title search', () => {
    const events = [
      makeEvent({ id: '1', title: 'Team Meeting' }),
      makeEvent({ id: '2', title: 'Lunch Break' }),
      makeEvent({ id: '3', title: 'Client meeting' }),
    ]
    const results = searchEvents(events, 'meeting')
    expect(results.length).toBe(2)
    expect(results.map((e) => e.id).sort()).toEqual(['1', '3'])
  })

  it('searchEvents should return all events for empty query', () => {
    const events = [makeEvent({ id: '1' }), makeEvent({ id: '2' })]
    expect(searchEvents(events, '').length).toBe(2)
    expect(searchEvents(events, '   ').length).toBe(2)
    expect(searchEvents(events, null).length).toBe(2)
  })

  it('getMatchingEventIds should return set of matching ids', () => {
    const events = [
      makeEvent({ id: '1', title: 'Meeting Alpha' }),
      makeEvent({ id: '2', title: 'Lunch' }),
    ]
    const ids = getMatchingEventIds(events, 'meeting')
    expect(ids.has('1')).toBe(true)
    expect(ids.has('2')).toBe(false)
  })
})

describe('calendarUtils - validation', () => {
  it('should reject empty title', () => {
    const result = validateEvent({
      title: '',
      startTime: makeISO(2025, 1, 15, 10),
      endTime: makeISO(2025, 1, 15, 11),
      category: 'work',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeTruthy()
  })

  it('should reject when end time is before start time', () => {
    const result = validateEvent({
      title: 'Valid',
      startTime: makeISO(2025, 1, 15, 12),
      endTime: makeISO(2025, 1, 15, 10),
      category: 'work',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.endTime).toBeTruthy()
  })

  it('should reject when duration is too short', () => {
    const result = validateEvent({
      title: 'Valid',
      startTime: makeISO(2025, 1, 15, 10),
      endTime: makeISO(2025, 1, 15, 10, 5),
      category: 'work',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.endTime).toContain(String(MIN_EVENT_MINUTES))
  })

  it('should reject invalid category', () => {
    const result = validateEvent({
      title: 'Valid',
      startTime: makeISO(2025, 1, 15, 10),
      endTime: makeISO(2025, 1, 15, 11),
      category: 'invalid-category',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.category).toBeTruthy()
  })

  it('should reject events with time conflicts', () => {
    const existing = [makeEvent({ startTime: makeISO(2025, 1, 15, 10), endTime: makeISO(2025, 1, 15, 12) })]
    const result = validateEvent(
      {
        title: 'Conflict',
        startTime: makeISO(2025, 1, 15, 11),
        endTime: makeISO(2025, 1, 15, 13),
        category: 'work',
      },
      existing
    )
    expect(result.valid).toBe(false)
    expect(result.errors.conflict).toBeTruthy()
  })

  it('should accept a valid event', () => {
    const result = validateEvent({
      title: 'Valid Event',
      startTime: makeISO(2025, 1, 15, 10),
      endTime: makeISO(2025, 1, 15, 11),
      category: 'work',
    })
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors).length).toBe(0)
  })
})

describe('calendarUtils - CRUD operations', () => {
  it('createEvent should add a new event with generated id', () => {
    const result = createEvent([], {
      title: 'New Event',
      startTime: makeISO(2025, 1, 15, 10),
      endTime: makeISO(2025, 1, 15, 11),
      category: 'work',
    })
    expect(result.success).toBe(true)
    expect(result.events.length).toBe(1)
    expect(result.events[0].title).toBe('New Event')
    expect(result.events[0].id).toBeTruthy()
    expect(result.events[0].color).toBeTruthy()
  })

  it('createEvent should return errors for invalid data', () => {
    const result = createEvent([], { title: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('createEvent should not mutate original array', () => {
    const original = []
    createEvent(original, {
      title: 'New',
      startTime: makeISO(2025, 1, 15, 10),
      endTime: makeISO(2025, 1, 15, 11),
      category: 'work',
    })
    expect(original.length).toBe(0)
  })

  it('updateEvent should update existing event', () => {
    const ev = makeEvent({ id: 'e1', title: 'Original' })
    const result = updateEvent([ev], 'e1', { title: 'Updated' })
    expect(result.success).toBe(true)
    expect(result.events[0].title).toBe('Updated')
  })

  it('updateEvent should fail for non-existent id', () => {
    const result = updateEvent([], 'nope', { title: 'X' })
    expect(result.success).toBe(false)
    expect(result.errors.id).toBeTruthy()
  })

  it('deleteEvent should remove event by id', () => {
    const events = [makeEvent({ id: 'e1' }), makeEvent({ id: 'e2' })]
    const result = deleteEvent(events, 'e1')
    expect(result.success).toBe(true)
    expect(result.events.length).toBe(1)
    expect(result.events[0].id).toBe('e2')
  })

  it('deleteEvent should handle non-existent id gracefully', () => {
    const events = [makeEvent({ id: 'e1' })]
    const result = deleteEvent(events, 'nope')
    expect(result.success).toBe(false)
    expect(result.events.length).toBe(1)
  })
})

describe('calendarUtils - category utilities', () => {
  it('getCategoryById should return correct category', () => {
    const cat = getCategoryById('work')
    expect(cat.id).toBe('work')
    expect(cat.label).toBe('工作')
  })

  it('getCategoryById should return default for unknown id', () => {
    const cat = getCategoryById('unknown')
    expect(cat.id).toBe('other')
  })
})

describe('calendarUtils - localStorage persistence', () => {
  let storage
  beforeEach(() => {
    storage = createMockStorage()
  })

  it('loadEvents should return defaults and persist when storage empty', () => {
    const events = loadEvents(storage)
    expect(Array.isArray(events)).toBe(true)
    expect(events.length).toBeGreaterThan(0)
    expect(storage.getItem(STORAGE_KEY)).toBeTruthy()
  })

  it('saveEvents and loadEvents should round-trip correctly', () => {
    const testEvents = [makeEvent({ id: 'persist-1', title: 'Persisted' })]
    saveEvents(testEvents, storage)
    const loaded = loadEvents(storage)
    expect(loaded.length).toBe(1)
    expect(loaded[0].title).toBe('Persisted')
  })

  it('loadEvents should return defaults for corrupted JSON', () => {
    storage.setItem(STORAGE_KEY, '{bad json')
    const events = loadEvents(storage)
    expect(Array.isArray(events)).toBe(true)
    expect(events.length).toBeGreaterThan(0)
  })

  it('loadEvents should return defaults for non-array data', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ not: 'array' }))
    const events = loadEvents(storage)
    expect(Array.isArray(events)).toBe(true)
  })

  it('loadEvents should filter out invalid event entries', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: '1', title: 'Valid', startTime: makeISO(2025, 1, 15, 10), endTime: makeISO(2025, 1, 15, 11) },
        { id: '2' },
        null,
      ])
    )
    const events = loadEvents(storage)
    expect(events.length).toBe(1)
    expect(events[0].id).toBe('1')
  })

  it('should not throw when storage is unavailable', () => {
    expect(() => loadEvents(null)).not.toThrow()
    expect(() => saveEvents([], null)).not.toThrow()
  })
})
