import {
  STORAGE_KEY_RECORDS,
  STORAGE_KEY_BUDGETS,
  STORAGE_KEY_TIMER,
  DEFAULT_PROJECTS,
  MAX_DURATION_HOURS,
} from './constants'

export function generateId() {
  return 'tt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatTimerDisplay(totalSeconds) {
  if (totalSeconds < 0) totalSeconds = 0
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatTimeHHMM(date) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function getDateKey(dateStr) {
  return formatDate(dateStr)
}

export function getProjectLabel(projectKey) {
  const p = DEFAULT_PROJECTS.find((proj) => proj.key === projectKey)
  return p ? p.label : projectKey
}

export function getProjectColor(projectKey) {
  const p = DEFAULT_PROJECTS.find((proj) => proj.key === projectKey)
  return p ? p.color : '#6b7280'
}

export function calculateDurationMs(startTime, endTime) {
  return new Date(endTime).getTime() - new Date(startTime).getTime()
}

export function msToHours(ms) {
  return ms / 3600000
}

export function msToFormattedHours(ms) {
  const hours = ms / 3600000
  return hours.toFixed(2)
}

export function validateManualEntry(data) {
  const errors = {}
  if (!data.project) {
    errors.project = '请选择项目'
  }
  if (!data.date) {
    errors.date = '请选择日期'
  }
  if (!data.startTime) {
    errors.startTime = '请输入开始时间'
  }
  if (!data.endTime) {
    errors.endTime = '请输入结束时间'
  }
  if (data.startTime && data.endTime && data.date) {
    const start = new Date(`${data.date}T${data.startTime}`)
    const end = new Date(`${data.date}T${data.endTime}`)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      errors.startTime = '时间格式无效'
      return errors
    }
    if (start >= end) {
      errors.endTime = '结束时间必须晚于开始时间'
    }
    const durationMs = end.getTime() - start.getTime()
    const durationHours = durationMs / 3600000
    if (durationHours > MAX_DURATION_HOURS) {
      errors.endTime = '时长不能超过24小时'
    }
  }
  return errors
}

export function createRecord(data) {
  const start = new Date(`${data.date}T${data.startTime}`)
  const end = new Date(`${data.date}T${data.endTime}`)
  return {
    id: generateId(),
    project: data.project,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationMs: end.getTime() - start.getTime(),
    note: (data.note || '').trim(),
    createdAt: Date.now(),
  }
}

export function createTimerRecord(project, startTime, endTime) {
  return {
    id: generateId(),
    project,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    durationMs: new Date(endTime).getTime() - new Date(startTime).getTime(),
    note: '',
    createdAt: Date.now(),
  }
}

export function updateRecord(records, id, data) {
  const index = records.findIndex((r) => r.id === id)
  if (index === -1) return records
  const updated = [...records]
  const start = new Date(`${data.date}T${data.startTime}`)
  const end = new Date(`${data.date}T${data.endTime}`)
  updated[index] = {
    ...updated[index],
    project: data.project,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationMs: end.getTime() - start.getTime(),
    note: (data.note || '').trim(),
  }
  return updated
}

export function deleteRecord(records, id) {
  return records.filter((r) => r.id !== id)
}

export function loadRecords(storage) {
  try {
    const s = storage || localStorage
    const raw = s.getItem(STORAGE_KEY_RECORDS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveRecords(records, storage) {
  try {
    const s = storage || localStorage
    s.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}

export function loadBudgets(storage) {
  try {
    const s = storage || localStorage
    const raw = s.getItem(STORAGE_KEY_BUDGETS)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed
  } catch {
    return {}
  }
}

export function saveBudgets(budgets, storage) {
  try {
    const s = storage || localStorage
    s.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets))
    return true
  } catch {
    return false
  }
}

export function loadTimerState(storage) {
  try {
    const s = storage || localStorage
    const raw = s.getItem(STORAGE_KEY_TIMER)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveTimerState(state, storage) {
  try {
    const s = storage || localStorage
    s.setItem(STORAGE_KEY_TIMER, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearTimerState(storage) {
  try {
    const s = storage || localStorage
    s.removeItem(STORAGE_KEY_TIMER)
    return true
  } catch {
    return false
  }
}

export function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

export function getMonthRange(year, month) {
  const start = new Date(year, month, 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(year, month + 1, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function getQuarterRange() {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3)
  const start = new Date(now.getFullYear(), quarter * 3, 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now.getFullYear(), quarter * 3 + 3, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function getDateRange(preset, customStart, customEnd) {
  const now = new Date()
  switch (preset) {
    case 'this_week':
      return getWeekRange()
    case 'this_month':
      return getMonthRange(now.getFullYear(), now.getMonth())
    case 'last_month':
      return getMonthRange(now.getFullYear(), now.getMonth() - 1)
    case 'this_quarter':
      return getQuarterRange()
    case 'custom':
      return {
        start: customStart ? new Date(customStart) : new Date(0),
        end: customEnd ? new Date(customEnd + 'T23:59:59') : new Date(),
      }
    default:
      return { start: new Date(0), end: new Date() }
  }
}

export function filterRecordsByDateRange(records, dateRange) {
  if (!dateRange) return records
  const startMs = dateRange.start.getTime()
  const endMs = dateRange.end.getTime()
  return records.filter((r) => {
    const recordMs = new Date(r.startTime).getTime()
    return recordMs >= startMs && recordMs <= endMs
  })
}

export function filterRecordsByProject(records, projectKey) {
  if (!projectKey) return records
  return records.filter((r) => r.project === projectKey)
}

export function groupRecordsByDate(records) {
  const groups = {}
  records.forEach((r) => {
    const dateKey = getDateKey(r.startTime)
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(r)
  })
  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))
  return sortedKeys.map((key) => ({
    date: key,
    records: groups[key].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    ),
  }))
}

export function groupRecordsByProject(records) {
  const groups = {}
  records.forEach((r) => {
    if (!groups[r.project]) {
      groups[r.project] = []
    }
    groups[r.project].push(r)
  })
  return groups
}

export function calculateProjectSubtotals(records) {
  const totals = {}
  records.forEach((r) => {
    if (!totals[r.project]) {
      totals[r.project] = 0
    }
    totals[r.project] += r.durationMs
  })
  return totals
}

export function calculateProjectHours(records) {
  const totals = calculateProjectSubtotals(records)
  const result = {}
  Object.keys(totals).forEach((key) => {
    result[key] = msToHours(totals[key])
  })
  return result
}

export function buildBarChartData(records, dateRange) {
  const filtered = filterRecordsByDateRange(records, dateRange)
  const hours = calculateProjectHours(filtered)
  return DEFAULT_PROJECTS.map((p) => ({
    projectKey: p.key,
    projectLabel: p.label,
    color: p.color,
    hours: hours[p.key] || 0,
  })).filter((item) => item.hours > 0)
}

export function getBudgetProgress(records, budgets) {
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthRecords = records.filter((r) => {
    const rk = getDateKey(r.startTime).slice(0, 7)
    return rk === monthKey
  })
  const projectHours = calculateProjectHours(monthRecords)
  const monthBudgets = budgets[monthKey] || {}
  return DEFAULT_PROJECTS.map((p) => {
    const used = projectHours[p.key] || 0
    const budget = monthBudgets[p.key] || 0
    const percent = budget > 0 ? (used / budget) * 100 : 0
    const remaining = budget > 0 ? Math.max(0, budget - used) : 0
    let status = 'normal'
    if (budget > 0 && percent >= 100) status = 'over'
    else if (budget > 0 && percent >= 80) status = 'warning'
    return {
      projectKey: p.key,
      projectLabel: p.label,
      color: p.color,
      used,
      budget,
      percent: Math.min(percent, 999),
      remaining,
      status,
    }
  }).filter((item) => item.budget > 0)
}

export function setBudget(budgets, projectKey, hours) {
  const numHours = Number(hours)
  if (isNaN(numHours) || numHours < 0) {
    return { success: false, error: '预算必须是非负数' }
  }
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const updated = { ...budgets }
  if (!updated[monthKey]) updated[monthKey] = {}
  if (numHours === 0) {
    delete updated[monthKey][projectKey]
  } else {
    updated[monthKey] = { ...updated[monthKey], [projectKey]: numHours }
  }
  if (Object.keys(updated[monthKey]).length === 0) {
    delete updated[monthKey]
  }
  return { success: true, budgets: updated }
}

export function recordToFormData(record) {
  const start = new Date(record.startTime)
  const end = new Date(record.endTime)
  return {
    project: record.project,
    date: formatDate(record.startTime),
    startTime: formatTimeHHMM(start),
    endTime: formatTimeHHMM(end),
    note: record.note || '',
  }
}

export function generateCSV(records, projectFilter, dateRange) {
  let filtered = filterRecordsByDateRange(records, dateRange)
  if (projectFilter) {
    filtered = filterRecordsByProject(filtered, projectFilter)
  }
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )
  const header = '项目名称,日期,开始时间,结束时间,持续时长（小时）,备注'
  const rows = sorted.map((r) => {
    const projectLabel = getProjectLabel(r.project)
    const date = formatDate(r.startTime)
    const startT = formatTimeHHMM(new Date(r.startTime))
    const endT = formatTimeHHMM(new Date(r.endTime))
    const duration = msToFormattedHours(r.durationMs)
    const note = (r.note || '').replace(/"/g, '""')
    return `"${projectLabel}","${date}","${startT}","${endT}","${duration}","${note}"`
  })
  return [header, ...rows].join('\n')
}

export function getCSVFilename(dateRange) {
  const start = formatDate(dateRange.start.toISOString())
  const end = formatDate(dateRange.end.toISOString())
  return `工时记录_${start}_${end}.csv`
}

export function downloadCSV(csvContent, filename) {
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function updateDocumentTitle(elapsedSeconds, projectLabel) {
  const timeStr = formatTimerDisplay(elapsedSeconds)
  document.title = `${timeStr} - ${projectLabel}`
}

export function resetDocumentTitle() {
  document.title = 'Solocoder React'
}
