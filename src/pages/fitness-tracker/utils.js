import {
  STORAGE_KEY_RECORDS,
  STORAGE_KEY_GOALS,
  SPORT_MAP,
  SPORT_KEYS,
  PAGE_SIZE,
  DEFAULT_GOALS,
  DEFAULT_BODY_WEIGHT,
} from './constants'

export function generateId() {
  return 'fit_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
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

export function formatDateTime(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ''
  const dateStr = formatDate(d)
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dateStr} ${h}:${min}`
}

export function getDateKey(timestamp) {
  return formatDate(timestamp)
}

export function getWeekKey(timestamp) {
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ''
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

export function getMonthKey(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function getTodayKey() {
  return formatDate(new Date())
}

export function getCurrentWeekKey() {
  return getWeekKey(new Date())
}

export function getCurrentMonthKey() {
  return getMonthKey(new Date())
}

export function calculateCalories(sportKey, durationMinutes, bodyWeight = DEFAULT_BODY_WEIGHT) {
  const sport = SPORT_MAP[sportKey]
  if (!sport) return 0
  const met = sport.met
  const hours = durationMinutes / 60
  return Math.round(met * bodyWeight * hours)
}

export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}

export function validateRecord(data) {
  const errors = {}
  if (!data.sportKey) {
    errors.sportKey = '请选择运动类型'
  } else if (!SPORT_KEYS.includes(data.sportKey)) {
    errors.sportKey = '运动类型无效'
  }
  const duration = Number(data.duration)
  if (data.duration === undefined || data.duration === null || data.duration === '') {
    errors.duration = '请输入运动时长'
  } else if (!Number.isInteger(duration) || duration <= 0) {
    errors.duration = '时长必须为正整数'
  } else if (duration > 600) {
    errors.duration = '时长不能超过600分钟'
  }
  if (data.distance !== undefined && data.distance !== null && data.distance !== '') {
    const dist = Number(data.distance)
    if (isNaN(dist) || dist < 0) {
      errors.distance = '距离必须为非负数'
    }
  }
  return errors
}

export function createRecord(records, data) {
  const errors = validateRecord(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const now = Date.now()
  const sport = SPORT_MAP[data.sportKey]
  const distanceValue = sport.hasDistance && data.distance !== undefined && data.distance !== null && data.distance !== ''
    ? Number(data.distance)
    : null
  const newRecord = {
    id: generateId(),
    sportKey: data.sportKey,
    duration: Number(data.duration),
    distance: distanceValue,
    timestamp: now,
    dateKey: formatDate(now),
    calories: calculateCalories(data.sportKey, Number(data.duration)),
  }
  const updated = [newRecord, ...records]
  return { success: true, record: newRecord, records: updated }
}

export function deleteRecord(records, id) {
  const exists = records.some((r) => r.id === id)
  if (!exists) {
    return { success: false, records }
  }
  return { success: true, records: records.filter((r) => r.id !== id) }
}

export function filterRecords(records, options = {}) {
  let result = [...records]

  if (options.sportKey && options.sportKey !== 'all') {
    result = result.filter((r) => r.sportKey === options.sportKey)
  }

  if (options.startDate) {
    const start = new Date(options.startDate).setHours(0, 0, 0, 0)
    result = result.filter((r) => r.timestamp >= start)
  }

  if (options.endDate) {
    const end = new Date(options.endDate).setHours(23, 59, 59, 999)
    result = result.filter((r) => r.timestamp <= end)
  }

  if (options.dateKey) {
    result = result.filter((r) => r.dateKey === options.dateKey)
  }

  if (options.weekKey) {
    result = result.filter((r) => getWeekKey(r.timestamp) === options.weekKey)
  }

  if (options.monthKey) {
    result = result.filter((r) => getMonthKey(r.timestamp) === options.monthKey)
  }

  return result
}

export function sortRecords(records, sortBy = 'timestamp', sortOrder = 'desc') {
  const order = sortOrder === 'desc' ? -1 : 1
  return [...records].sort((a, b) => {
    if (sortBy === 'timestamp') {
      return (a.timestamp - b.timestamp) * order
    }
    if (sortBy === 'duration') {
      return (a.duration - b.duration) * order
    }
    if (sortBy === 'calories') {
      return (a.calories - b.calories) * order
    }
    return 0
  })
}

export function paginateRecords(records, page, pageSize = PAGE_SIZE) {
  const totalPage = Math.max(1, Math.ceil(records.length / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: records.slice(start, end),
    total: records.length,
    totalPage,
    currentPage,
    pageSize,
  }
}

export function getRecordList(records, options = {}) {
  let result = filterRecords(records, options)
  result = sortRecords(result, options.sortBy || 'timestamp', options.sortOrder || 'desc')
  return paginateRecords(result, options.page || 1, options.pageSize || PAGE_SIZE)
}

export function calculateDailySummary(records, dateKey) {
  const dayRecords = records.filter((r) => r.dateKey === dateKey)
  const totalDuration = dayRecords.reduce((sum, r) => sum + r.duration, 0)
  const totalCalories = dayRecords.reduce((sum, r) => sum + r.calories, 0)
  const totalDistance = dayRecords.reduce((sum, r) => sum + (r.distance || 0), 0)
  const sessionCount = dayRecords.length
  return {
    totalDuration,
    totalCalories,
    totalDistance,
    sessionCount,
  }
}

export function calculateWeeklySummary(records, weekKey) {
  const weekRecords = records.filter((r) => getWeekKey(r.timestamp) === weekKey)
  const totalDuration = weekRecords.reduce((sum, r) => sum + r.duration, 0)
  const totalCalories = weekRecords.reduce((sum, r) => sum + r.calories, 0)
  const totalDistance = weekRecords.reduce((sum, r) => sum + (r.distance || 0), 0)
  const sessionCount = weekRecords.length
  const daySet = new Set(weekRecords.map((r) => r.dateKey))
  const avgDailyMinutes = daySet.size > 0 ? Math.round(totalDuration / daySet.size) : 0
  return {
    totalDuration,
    totalCalories,
    totalDistance,
    sessionCount,
    avgDailyMinutes,
  }
}

export function calculateMonthlySummary(records, monthKey) {
  const monthRecords = records.filter((r) => getMonthKey(r.timestamp) === monthKey)
  const totalDuration = monthRecords.reduce((sum, r) => sum + r.duration, 0)
  const totalCalories = monthRecords.reduce((sum, r) => sum + r.calories, 0)
  const totalDistance = monthRecords.reduce((sum, r) => sum + (r.distance || 0), 0)
  const sessionCount = monthRecords.length
  const daySet = new Set(monthRecords.map((r) => r.dateKey))
  const avgDailyMinutes = daySet.size > 0 ? Math.round(totalDuration / daySet.size) : 0
  return {
    totalDuration,
    totalCalories,
    totalDistance,
    sessionCount,
    avgDailyMinutes,
  }
}

export function calculateSummaryByDimension(records, dimension = 'day') {
  if (dimension === 'day') {
    return calculateDailySummary(records, getTodayKey())
  }
  if (dimension === 'week') {
    return calculateWeeklySummary(records, getCurrentWeekKey())
  }
  if (dimension === 'month') {
    return calculateMonthlySummary(records, getCurrentMonthKey())
  }
  return calculateDailySummary(records, getTodayKey())
}

export function buildTrendData(records, days = 30) {
  const result = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateKey = formatDate(d)
    const dayRecords = records.filter((r) => r.dateKey === dateKey)
    const calories = dayRecords.reduce((sum, r) => sum + r.calories, 0)
    const minutes = dayRecords.reduce((sum, r) => sum + r.duration, 0)
    result.push({
      date: dateKey,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      calories,
      minutes,
    })
  }
  return result
}

export function buildSportDistribution(records) {
  const totals = {}
  records.forEach((r) => {
    if (!totals[r.sportKey]) {
      totals[r.sportKey] = 0
    }
    totals[r.sportKey] += r.duration
  })
  return Object.entries(totals)
    .map(([key, value]) => ({
      key,
      name: SPORT_MAP[key]?.label || key,
      value,
      icon: SPORT_MAP[key]?.icon || '🏃',
    }))
    .sort((a, b) => b.value - a.value)
}

export function loadGoals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GOALS)
    if (!raw) return { ...DEFAULT_GOALS }
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_GOALS }
    return {
      dailyMinutes: typeof parsed.dailyMinutes === 'number' ? parsed.dailyMinutes : DEFAULT_GOALS.dailyMinutes,
      weeklySessions: typeof parsed.weeklySessions === 'number' ? parsed.weeklySessions : DEFAULT_GOALS.weeklySessions,
    }
  } catch {
    return { ...DEFAULT_GOALS }
  }
}

export function saveGoals(goals) {
  try {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals))
    return true
  } catch {
    return false
  }
}

export function validateGoals(goals) {
  const errors = {}
  const daily = Number(goals.dailyMinutes)
  if (goals.dailyMinutes === undefined || goals.dailyMinutes === null || goals.dailyMinutes === '') {
    errors.dailyMinutes = '请输入每日运动目标'
  } else if (!Number.isInteger(daily) || daily <= 0) {
    errors.dailyMinutes = '每日目标必须为正整数分钟'
  } else if (daily > 1440) {
    errors.dailyMinutes = '每日目标不能超过1440分钟'
  }
  const weekly = Number(goals.weeklySessions)
  if (goals.weeklySessions === undefined || goals.weeklySessions === null || goals.weeklySessions === '') {
    errors.weeklySessions = '请输入每周运动目标'
  } else if (!Number.isInteger(weekly) || weekly <= 0) {
    errors.weeklySessions = '每周目标必须为正整数次'
  } else if (weekly > 50) {
    errors.weeklySessions = '每周目标不能超过50次'
  }
  return errors
}

export function setGoals(currentGoals, newGoals) {
  const errors = validateGoals(newGoals)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const updated = {
    dailyMinutes: Number(newGoals.dailyMinutes),
    weeklySessions: Number(newGoals.weeklySessions),
  }
  return { success: true, goals: updated }
}

export function calculateDailyProgress(records, goalDailyMinutes) {
  const todayKey = getTodayKey()
  const todayRecords = records.filter((r) => r.dateKey === todayKey)
  const currentMinutes = todayRecords.reduce((sum, r) => sum + r.duration, 0)
  const percent = goalDailyMinutes > 0 ? Math.min((currentMinutes / goalDailyMinutes) * 100, 100) : 0
  const isCompleted = currentMinutes >= goalDailyMinutes && goalDailyMinutes > 0
  return {
    currentMinutes,
    goalMinutes: goalDailyMinutes,
    percent,
    isCompleted,
  }
}

export function calculateWeeklyProgress(records, goalWeeklySessions) {
  const weekKey = getCurrentWeekKey()
  const weekRecords = records.filter((r) => getWeekKey(r.timestamp) === weekKey)
  const currentSessions = weekRecords.length
  const percent = goalWeeklySessions > 0 ? Math.min((currentSessions / goalWeeklySessions) * 100, 100) : 0
  const isCompleted = currentSessions >= goalWeeklySessions && goalWeeklySessions > 0
  return {
    currentSessions,
    goalSessions: goalWeeklySessions,
    percent,
    isCompleted,
  }
}

