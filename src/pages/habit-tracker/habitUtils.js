import {
  STORAGE_KEY_HABITS,
  STORAGE_KEY_CHECKINS,
  STORAGE_KEY_REMINDERS,
} from './constants'

export function generateId() {
  return 'hb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatDate(date) {
  if (!date) return ''
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getTodayKey() {
  return formatDate(new Date())
}

export function parseDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(dateKey, days) {
  const d = parseDate(dateKey)
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

export function getDaysInRange(startDate, endDate) {
  const result = []
  const current = new Date(parseDate(startDate))
  const end = parseDate(endDate)
  while (current <= end) {
    result.push(formatDate(current))
    current.setDate(current.getDate() + 1)
  }
  return result
}

export function getWeekMonday(dateKey) {
  const d = parseDate(dateKey)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return formatDate(d)
}

export function getDaysInCurrentMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

export function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HABITS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveHabits(habits) {
  try {
    localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(habits))
    return true
  } catch {
    return false
  }
}

export function loadCheckins() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHECKINS)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed
  } catch {
    return {}
  }
}

export function saveCheckins(checkins) {
  try {
    localStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(checkins))
    return true
  } catch {
    return false
  }
}

export function loadReminders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REMINDERS)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed
  } catch {
    return {}
  }
}

export function saveReminders(reminders) {
  try {
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(reminders))
    return true
  } catch {
    return false
  }
}

export function validateHabit(data) {
  const errors = {}
  if (!data.name || !data.name.trim()) {
    errors.name = '请输入习惯名称'
  } else if (data.name.trim().length > 50) {
    errors.name = '习惯名称不能超过50个字符'
  }
  if (!data.icon) {
    errors.icon = '请选择习惯图标'
  }
  if (!data.frequencyType) {
    errors.frequencyType = '请选择目标频率'
  }
  if (data.frequencyType === 'weekly') {
    const count = Number(data.frequencyCount)
    if (!data.frequencyCount || !Number.isInteger(count) || count < 1 || count > 7) {
      errors.frequencyCount = '每周次数应为1-7的整数'
    }
  }
  if (data.frequencyType === 'monthly') {
    const count = Number(data.frequencyCount)
    if (!data.frequencyCount || !Number.isInteger(count) || count < 1 || count > 31) {
      errors.frequencyCount = '每月天数应为1-31的整数'
    }
  }
  return errors
}

export function createHabit(habits, data) {
  const errors = validateHabit(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const habit = {
    id: generateId(),
    name: data.name.trim(),
    description: (data.description || '').trim(),
    icon: data.icon,
    frequencyType: data.frequencyType,
    frequencyCount: data.frequencyType === 'daily' ? 1 : Number(data.frequencyCount),
    archived: false,
    createdAt: Date.now(),
  }
  return { success: true, habit, habits: [...habits, habit] }
}

export function archiveHabit(habits, habitId) {
  return habits.map(h => h.id === habitId ? { ...h, archived: true } : h)
}

export function activateHabit(habits, habitId) {
  return habits.map(h => h.id === habitId ? { ...h, archived: false } : h)
}

export function checkin(checkins, habitId, dateKey) {
  const habitCheckins = checkins[habitId] || {}
  const currentCount = habitCheckins[dateKey] || 0
  return {
    ...checkins,
    [habitId]: {
      ...habitCheckins,
      [dateKey]: currentCount + 1,
    },
  }
}

export function uncheckin(checkins, habitId, dateKey) {
  const habitCheckins = checkins[habitId] || {}
  const currentCount = habitCheckins[dateKey] || 0
  if (currentCount <= 1) {
    const rest = { ...habitCheckins }
    delete rest[dateKey]
    return {
      ...checkins,
      [habitId]: rest,
    }
  }
  return {
    ...checkins,
    [habitId]: {
      ...habitCheckins,
      [dateKey]: currentCount - 1,
    },
  }
}

export function getCheckinCount(checkins, habitId, dateKey) {
  return (checkins[habitId] || {})[dateKey] || 0
}

export function isCheckedIn(checkins, habitId, dateKey) {
  return getCheckinCount(checkins, habitId, dateKey) > 0
}

export function calculateStreak(checkins, habitId) {
  const habitCheckins = checkins[habitId] || {}
  const today = getTodayKey()
  let streak = 0
  let currentDate = today

  if (!habitCheckins[today]) {
    const yesterday = addDays(today, -1)
    if (!habitCheckins[yesterday]) {
      return 0
    }
    currentDate = yesterday
  }

  while (habitCheckins[currentDate]) {
    streak++
    currentDate = addDays(currentDate, -1)
  }

  return streak
}

export function calculateMaxStreak(checkins, habitId) {
  const habitCheckins = checkins[habitId] || {}
  const dates = Object.keys(habitCheckins).filter(d => habitCheckins[d] > 0).sort()
  if (dates.length === 0) return 0
  let maxStreak = 1
  let currentStreak = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = parseDate(dates[i - 1])
    const curr = parseDate(dates[i])
    const diffDays = Math.round((curr - prev) / 86400000)
    if (diffDays === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }
  return maxStreak
}

export function getWeekTarget(frequencyType, frequencyCount) {
  if (frequencyType === 'daily') return 7
  if (frequencyType === 'weekly') return frequencyCount
  if (frequencyType === 'monthly') {
    return Math.round(frequencyCount * 7 / getDaysInCurrentMonth())
  }
  return 7
}

export function getMonthTarget(frequencyType, frequencyCount) {
  if (frequencyType === 'daily') return getDaysInCurrentMonth()
  if (frequencyType === 'weekly') return Math.round(frequencyCount * getDaysInCurrentMonth() / 7)
  if (frequencyType === 'monthly') return frequencyCount
  return 30
}

export function calculateWeekCompletion(checkins, habitId, frequencyType, frequencyCount) {
  const today = new Date()
  const todayKey = formatDate(today)
  const weekStart = getWeekMonday(todayKey)
  const days = getDaysInRange(weekStart, todayKey)
  const habitCheckins = checkins[habitId] || {}
  const completedDays = days.filter(d => habitCheckins[d] && habitCheckins[d] > 0).length
  const target = getWeekTarget(frequencyType, frequencyCount)
  const rate = target > 0 ? (completedDays / target) * 100 : 0
  return { completed: completedDays, target, rate }
}

export function calculateMonthCompletion(checkins, habitId, frequencyType, frequencyCount) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthStart = formatDate(new Date(year, month, 1))
  const todayKey = formatDate(today)
  const days = getDaysInRange(monthStart, todayKey)
  const habitCheckins = checkins[habitId] || {}
  const completedDays = days.filter(d => habitCheckins[d] && habitCheckins[d] > 0).length
  const target = getMonthTarget(frequencyType, frequencyCount)
  const rate = target > 0 ? (completedDays / target) * 100 : 0
  return { completed: completedDays, target, rate }
}

export function calculateOverallCompletion(habits, checkins) {
  const activeHabits = habits.filter(h => !h.archived)
  if (activeHabits.length === 0) return { rate: 0, completed: 0, target: 0 }
  let totalCompleted = 0
  let totalTarget = 0
  activeHabits.forEach(h => {
    const weekCompletion = calculateWeekCompletion(checkins, h.id, h.frequencyType, h.frequencyCount)
    totalCompleted += weekCompletion.completed
    totalTarget += weekCompletion.target
  })
  const rate = totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0
  return { rate, completed: totalCompleted, target: totalTarget }
}

export function buildHeatmapGrid(checkins, habitId, yearOffset = 0) {
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() - yearOffset * 365)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 364)

  const startDayOfWeek = startDate.getDay()
  const adjustedStart = new Date(startDate)
  adjustedStart.setDate(adjustedStart.getDate() - ((startDayOfWeek + 6) % 7))

  const habitCheckins = checkins[habitId] || {}
  const todayKey = formatDate(today)
  const weeks = []
  const current = new Date(adjustedStart)

  while (current <= endDate || (yearOffset === 0 && current.getDay() !== 1)) {
    const week = []
    for (let i = 0; i < 7; i++) {
      const dateKey = formatDate(current)
      const inRange = current >= startDate && current <= endDate
      week.push({
        date: dateKey,
        count: inRange ? (habitCheckins[dateKey] || 0) : -1,
        isToday: dateKey === todayKey,
        inRange,
      })
      if (i < 6) current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
    current.setDate(current.getDate() + 1)
    if (weeks.length >= 54) break
  }

  return weeks
}

export function getHeatmapColor(count) {
  if (count <= 0) return '#ebedf0'
  if (count === 1) return '#9be9a8'
  if (count === 2) return '#40c463'
  if (count === 3) return '#30a14e'
  return '#216e39'
}

export function getProgressColor(rate) {
  if (rate > 100) return '#fbbf24'
  if (rate >= 80) return '#10b981'
  if (rate >= 60) return '#3b82f6'
  return '#9ca3af'
}

export function getMilestones(streak) {
  const milestones = []
  if (streak >= 7) milestones.push({ days: 7, icon: '🌟', label: '7天' })
  if (streak >= 30) milestones.push({ days: 30, icon: '💪', label: '30天' })
  if (streak >= 100) milestones.push({ days: 100, icon: '👑', label: '100天' })
  return milestones
}

export function getFrequencyLabel(frequencyType, frequencyCount) {
  if (frequencyType === 'daily') return '每天'
  if (frequencyType === 'weekly') return `每周 ${frequencyCount} 次`
  if (frequencyType === 'monthly') return `每月 ${frequencyCount} 天`
  return ''
}
