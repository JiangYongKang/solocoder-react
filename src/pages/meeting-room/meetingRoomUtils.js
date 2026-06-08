import {
  STORAGE_KEY,
  CURRENT_USER_KEY,
  DEFAULT_CURRENT_USER,
  MEETING_ROOMS,
  START_HOUR,
  END_HOUR,
} from './constants.js'

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatDate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatTime(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

export function formatTimeRange(startHour, endHour) {
  return `${formatTime(startHour)} - ${formatTime(endHour)}`
}

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
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

export function getTimeSlots() {
  const slots = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    slots.push({ start: h, end: h + 1, label: formatTimeRange(h, h + 1) })
  }
  return slots
}

export function getHoursRange(startHour, endHour) {
  const hours = []
  for (let h = startHour; h < endHour; h++) {
    hours.push(h)
  }
  return hours
}

export function buildDateTime(dateStr, hour) {
  return new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00`)
}

export function getCurrentUser(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return DEFAULT_CURRENT_USER
  try {
    const user = storage.getItem(CURRENT_USER_KEY)
    return user || DEFAULT_CURRENT_USER
  } catch {
    return DEFAULT_CURRENT_USER
  }
}

export function setCurrentUser(userName, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(CURRENT_USER_KEY, userName)
  } catch {
    // ignore storage errors
  }
}

export function bookingsOverlap(a, b) {
  if (a.roomId !== b.roomId) return false
  if (!isSameDay(a.date, b.date)) return false
  const aStart = a.startHour
  const aEnd = a.endHour
  const bStart = b.startHour
  const bEnd = b.endHour
  return aStart < bEnd && bStart < aEnd
}

export function findConflicts(bookings, booking, excludeId = null) {
  return bookings.filter((b) => {
    if (excludeId && b.id === excludeId) return false
    return bookingsOverlap(b, booking)
  })
}

export function hasConflict(bookings, booking, excludeId = null) {
  return findConflicts(bookings, booking, excludeId).length > 0
}

export function isBookingExpired(booking, now = new Date()) {
  const endTime = buildDateTime(booking.date, booking.endHour)
  return now.getTime() > endTime.getTime()
}

export function cleanupExpiredBookings(bookings, now = new Date()) {
  return bookings.filter((b) => !isBookingExpired(b, now))
}

export function validateBooking(booking, existingBookings = [], excludeId = null) {
  const errors = {}

  if (!booking || typeof booking !== 'object') {
    return { valid: false, errors: { booking: '无效的预约数据' } }
  }

  if (!booking.bookedBy || typeof booking.bookedBy !== 'string' || !booking.bookedBy.trim()) {
    errors.bookedBy = '预约人姓名不能为空'
  } else if (booking.bookedBy.length > 50) {
    errors.bookedBy = '预约人姓名不能超过50个字符'
  }

  if (!booking.title || typeof booking.title !== 'string' || !booking.title.trim()) {
    errors.title = '会议标题不能为空'
  } else if (booking.title.length > 200) {
    errors.title = '会议标题不能超过200个字符'
  }

  if (!booking.roomId || !MEETING_ROOMS.some((r) => r.id === booking.roomId)) {
    errors.roomId = '请选择有效的会议室'
  }

  if (!booking.date) {
    errors.date = '请选择日期'
  }

  if (typeof booking.startHour !== 'number' || booking.startHour < START_HOUR || booking.startHour >= END_HOUR) {
    errors.startHour = `开始时间必须在 ${formatTime(START_HOUR)} 到 ${formatTime(END_HOUR - 1)} 之间`
  }

  if (typeof booking.endHour !== 'number' || booking.endHour <= START_HOUR || booking.endHour > END_HOUR) {
    errors.endHour = `结束时间必须在 ${formatTime(START_HOUR + 1)} 到 ${formatTime(END_HOUR)} 之间`
  }

  if (typeof booking.startHour === 'number' && typeof booking.endHour === 'number') {
    if (booking.endHour <= booking.startHour) {
      errors.endHour = '结束时间必须晚于开始时间'
    }
  }

  if (Object.keys(errors).length === 0) {
    const conflicts = findConflicts(existingBookings, booking, excludeId)
    if (conflicts.length > 0) {
      const conflictInfo = conflicts
        .map((c) => `${formatTimeRange(c.startHour, c.endHour)}（${c.bookedBy}：${c.title}）`)
        .join('；')
      errors.conflict = `该时段与已有预约冲突：${conflictInfo}`
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function createBooking(bookings, data) {
  const { valid, errors } = validateBooking(data, bookings)
  if (!valid) {
    return { success: false, errors }
  }
  const newBooking = {
    id: generateId(),
    bookedBy: data.bookedBy.trim(),
    title: data.title.trim(),
    roomId: data.roomId,
    date: data.date,
    startHour: data.startHour,
    endHour: data.endHour,
    createdAt: new Date().toISOString(),
  }
  return { success: true, booking: newBooking, bookings: [...bookings, newBooking] }
}

export function updateBooking(bookings, id, data) {
  const index = bookings.findIndex((b) => b.id === id)
  if (index === -1) {
    return { success: false, errors: { id: '预约不存在' } }
  }
  const merged = { ...bookings[index], ...data }
  if (data.bookedBy) merged.bookedBy = data.bookedBy.trim()
  if (data.title) merged.title = data.title.trim()
  const { valid, errors } = validateBooking(merged, bookings, id)
  if (!valid) {
    return { success: false, errors }
  }
  const updated = [...bookings]
  updated[index] = merged
  return { success: true, booking: merged, bookings: updated }
}

export function deleteBooking(bookings, id) {
  const exists = bookings.some((b) => b.id === id)
  if (!exists) {
    return { success: false, bookings }
  }
  return { success: true, bookings: bookings.filter((b) => b.id !== id) }
}

export function getBookingsForRoomAndDate(bookings, roomId, dateStr) {
  return bookings.filter((b) => b.roomId === roomId && b.date === dateStr)
}

export function isSlotBooked(bookings, roomId, dateStr, hour) {
  return bookings.some(
    (b) => b.roomId === roomId && b.date === dateStr && hour >= b.startHour && hour < b.endHour
  )
}

export function getBookingForSlot(bookings, roomId, dateStr, hour) {
  return bookings.find(
    (b) => b.roomId === roomId && b.date === dateStr && hour >= b.startHour && hour < b.endHour
  )
}

export function filterBookingsByUser(bookings, userName) {
  return bookings.filter((b) => b.bookedBy === userName)
}

export function sortBookingsByDateTime(bookings) {
  return [...bookings].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return a.startHour - b.startHour
  })
}

export function getDefaultBookings() {
  const today = formatDate(new Date())
  return [
    {
      id: generateId(),
      bookedBy: '李四',
      title: '产品需求评审',
      roomId: 'A',
      date: today,
      startHour: 9,
      endHour: 11,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      bookedBy: '王五',
      title: '技术方案讨论',
      roomId: 'B',
      date: today,
      startHour: 14,
      endHour: 16,
      createdAt: new Date().toISOString(),
    },
  ]
}

export function loadBookings(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return getDefaultBookings()
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) {
      const defaults = getDefaultBookings()
      saveBookings(defaults, storage)
      return defaults
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return cleanupExpiredBookings(getDefaultBookings())
    }
    const validBookings = parsed.filter(
      (b) => b && b.id && b.bookedBy && b.title && b.roomId && b.date && typeof b.startHour === 'number' && typeof b.endHour === 'number'
    )
    return cleanupExpiredBookings(validBookings)
  } catch {
    return cleanupExpiredBookings(getDefaultBookings())
  }
}

export function saveBookings(bookings, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    const cleaned = cleanupExpiredBookings(bookings)
    storage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
  } catch {
    // ignore storage errors
  }
}

export function areHoursConsecutive(hours) {
  if (!Array.isArray(hours) || hours.length === 0) return false
  const sorted = [...hours].sort((a, b) => a - b)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) return false
  }
  return true
}

export function hoursToRange(hours) {
  if (!Array.isArray(hours) || hours.length === 0) return null
  const sorted = [...hours].sort((a, b) => a - b)
  return { startHour: sorted[0], endHour: sorted[sorted.length - 1] + 1 }
}
