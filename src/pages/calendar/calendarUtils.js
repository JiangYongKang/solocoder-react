import { STORAGE_KEY, CATEGORIES, MIN_EVENT_MINUTES } from './constants.js'

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function getCategoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
}

export function formatDate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatTime(date) {
  const d = new Date(date)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function formatDateTime(date) {
  return `${formatDate(date)} ${formatTime(date)}`
}

export function parseDateTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`)
}

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function startOfWeek(date) {
  const d = startOfDay(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function endOfWeek(date) {
  return endOfDay(addDays(startOfWeek(date), 6))
}

export function startOfMonth(date) {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfMonth(date) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  d.setHours(23, 59, 59, 999)
  return d
}

export function addMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function getWeekDates(date) {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function getMonthGridDates(date) {
  const monthStart = startOfMonth(date)
  const gridStart = startOfWeek(monthStart)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

export function isSameDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

export function isSameMonth(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth()
}

export function isToday(date) {
  return isSameDay(date, new Date())
}

export function getMinutesFromStart(date) {
  const d = new Date(date)
  return d.getHours() * 60 + d.getMinutes()
}

export function getEventDurationMinutes(event) {
  const start = new Date(event.startTime).getTime()
  const end = new Date(event.endTime).getTime()
  return Math.max(0, Math.round((end - start) / 60000))
}

export function eventsOverlap(a, b) {
  const aStart = new Date(a.startTime).getTime()
  const aEnd = new Date(a.endTime).getTime()
  const bStart = new Date(b.startTime).getTime()
  const bEnd = new Date(b.endTime).getTime()
  return aStart < bEnd && bStart < aEnd
}

export function findConflicts(events, event, excludeId = null) {
  return events.filter((e) => {
    if (excludeId && e.id === excludeId) return false
    return eventsOverlap(e, event)
  })
}

export function hasConflict(events, event, excludeId = null) {
  return findConflicts(events, event, excludeId).length > 0
}

export function filterEventsByDay(events, date) {
  const dayStart = startOfDay(date).getTime()
  const dayEnd = endOfDay(date).getTime()
  return events.filter((e) => {
    const s = new Date(e.startTime).getTime()
    const en = new Date(e.endTime).getTime()
    return s < dayEnd && en > dayStart
  })
}

export function filterEventsByWeek(events, date) {
  const weekStart = startOfWeek(date).getTime()
  const weekEnd = endOfWeek(date).getTime()
  return events.filter((e) => {
    const s = new Date(e.startTime).getTime()
    const en = new Date(e.endTime).getTime()
    return s < weekEnd && en > weekStart
  })
}

export function filterEventsByMonth(events, date) {
  const monthStart = startOfMonth(date).getTime()
  const monthEnd = endOfMonth(date).getTime()
  return events.filter((e) => {
    const s = new Date(e.startTime).getTime()
    const en = new Date(e.endTime).getTime()
    return s < monthEnd && en > monthStart
  })
}

export function searchEvents(events, query) {
  if (!query || typeof query !== 'string') return events
  const lower = query.trim().toLowerCase()
  if (!lower) return events
  return events.filter((e) => e.title && e.title.toLowerCase().includes(lower))
}

export function getMatchingEventIds(events, query) {
  return new Set(searchEvents(events, query).map((e) => e.id))
}

export function validateEvent(event, existingEvents = [], excludeId = null) {
  const errors = {}

  if (!event || typeof event !== 'object') {
    return { valid: false, errors: { event: '无效的事件数据' } }
  }

  if (!event.title || typeof event.title !== 'string' || !event.title.trim()) {
    errors.title = '标题不能为空'
  } else if (event.title.length > 200) {
    errors.title = '标题不能超过200个字符'
  }

  if (!event.startTime) {
    errors.startTime = '请选择开始时间'
  }

  if (!event.endTime) {
    errors.endTime = '请选择结束时间'
  }

  if (event.startTime && event.endTime) {
    const start = new Date(event.startTime).getTime()
    const end = new Date(event.endTime).getTime()
    if (isNaN(start)) {
      errors.startTime = '开始时间格式无效'
    }
    if (isNaN(end)) {
      errors.endTime = '结束时间格式无效'
    }
    if (!isNaN(start) && !isNaN(end)) {
      if (end <= start) {
        errors.endTime = '结束时间必须晚于开始时间'
      } else if ((end - start) / 60000 < MIN_EVENT_MINUTES) {
        errors.endTime = `事件时长不能少于 ${MIN_EVENT_MINUTES} 分钟`
      }
    }
  }

  if (!event.category || !CATEGORIES.some((c) => c.id === event.category)) {
    errors.category = '请选择有效的分类'
  }

  if (Object.keys(errors).length === 0 && event.startTime && event.endTime) {
    const conflicts = findConflicts(existingEvents, event, excludeId)
    if (conflicts.length > 0) {
      errors.conflict = `该时段与事件「${conflicts[0].title}」存在时间冲突`
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function createEvent(events, data) {
  const { valid, errors } = validateEvent(data, events)
  if (!valid) {
    return { success: false, errors }
  }
  const category = getCategoryById(data.category)
  const newEvent = {
    id: generateId(),
    title: data.title.trim(),
    startTime: new Date(data.startTime).toISOString(),
    endTime: new Date(data.endTime).toISOString(),
    category: data.category,
    color: data.color || category.color,
  }
  return { success: true, event: newEvent, events: [...events, newEvent] }
}

export function updateEvent(events, id, data) {
  const index = events.findIndex((e) => e.id === id)
  if (index === -1) {
    return { success: false, errors: { id: '事件不存在' } }
  }
  const merged = { ...events[index], ...data }
  if (data.startTime) {
    merged.startTime = new Date(data.startTime).toISOString()
  }
  if (data.endTime) {
    merged.endTime = new Date(data.endTime).toISOString()
  }
  const { valid, errors } = validateEvent(merged, events, id)
  if (!valid) {
    return { success: false, errors }
  }
  if (data.category) {
    merged.color = data.color || getCategoryById(data.category).color
  }
  const updated = [...events]
  updated[index] = merged
  return { success: true, event: merged, events: updated }
}

export function deleteEvent(events, id) {
  const exists = events.some((e) => e.id === id)
  if (!exists) {
    return { success: false, events }
  }
  return { success: true, events: events.filter((e) => e.id !== id) }
}

export function getDefaultEvents() {
  const today = startOfDay(new Date())
  const t = (offsetHours, minutes = 0) => {
    const d = new Date(today)
    d.setHours(offsetHours, minutes, 0, 0)
    return d.toISOString()
  }
  return [
    {
      id: generateId(),
      title: '团队站会',
      startTime: t(9),
      endTime: t(9, 30),
      category: 'meeting',
      color: getCategoryById('meeting').color,
    },
    {
      id: generateId(),
      title: '项目代码评审',
      startTime: t(14),
      endTime: t(15, 30),
      category: 'work',
      color: getCategoryById('work').color,
    },
    {
      id: generateId(),
      title: '健身',
      startTime: t(18),
      endTime: t(19, 30),
      category: 'personal',
      color: getCategoryById('personal').color,
    },
  ]
}

export function loadEvents(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return getDefaultEvents()
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) {
      const defaults = getDefaultEvents()
      saveEvents(defaults, storage)
      return defaults
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return getDefaultEvents()
    }
    return parsed.filter((e) => e && e.id && e.title && e.startTime && e.endTime)
  } catch {
    return getDefaultEvents()
  }
}

export function saveEvents(events, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch {
    // ignore storage errors
  }
}

export function snapTimeToSlot(date, slotMinutes = 15) {
  const d = new Date(date)
  const totalMinutes = d.getHours() * 60 + d.getMinutes()
  const snappedTotal = Math.round(totalMinutes / slotMinutes) * slotMinutes
  d.setHours(0, 0, 0, 0)
  d.setTime(d.getTime() + snappedTotal * 60 * 1000)
  return d
}

export const PIXELS_PER_MINUTE_RATIO = (hourHeight) => hourHeight / 60

export function pixelsToMinutes(pixels, hourHeight) {
  return pixels / PIXELS_PER_MINUTE_RATIO(hourHeight)
}

export function minutesToPixels(minutes, hourHeight) {
  return minutes * PIXELS_PER_MINUTE_RATIO(hourHeight)
}

export function getDayViewEventPosition(event, dayDate, hourHeight) {
  const dayStart = startOfDay(dayDate)
  const dayEndExclusive = addDays(dayStart, 1)
  const eventStart = new Date(event.startTime)
  const eventEnd = new Date(event.endTime)

  const clampedStartMs = Math.max(dayStart.getTime(), eventStart.getTime())
  const clampedEndMs = Math.min(dayEndExclusive.getTime(), eventEnd.getTime())

  const clampedStart = new Date(clampedStartMs)
  const minutesFromDayStart = clampedStart.getHours() * 60 + clampedStart.getMinutes() + clampedStart.getSeconds() / 60 + clampedStart.getMilliseconds() / 60000
  const durationMin = Math.max(0, (clampedEndMs - clampedStartMs) / 60000)

  return {
    top: minutesToPixels(minutesFromDayStart, hourHeight),
    height: Math.max(24, minutesToPixels(durationMin, hourHeight) - 2),
    startsBeforeDay: eventStart.getTime() < dayStart.getTime(),
    endsAfterDay: eventEnd.getTime() > dayEndExclusive.getTime(),
  }
}

export function getWeekViewEventPosition(event, dayDate, hourHeight) {
  return getDayViewEventPosition(event, dayDate, hourHeight)
}
