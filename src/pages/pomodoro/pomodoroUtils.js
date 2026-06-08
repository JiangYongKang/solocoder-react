import {
  PHASES,
  DEFAULT_SETTINGS,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_RECORDS,
} from './constants'

export function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function getPhaseDuration(phase, settings) {
  const s = { ...DEFAULT_SETTINGS }
  if (settings && typeof settings === 'object') {
    if (settings.workMinutes !== undefined && !isNaN(Number(settings.workMinutes))) {
      s.workMinutes = Number(settings.workMinutes)
    }
    if (settings.shortBreakMinutes !== undefined && !isNaN(Number(settings.shortBreakMinutes))) {
      s.shortBreakMinutes = Number(settings.shortBreakMinutes)
    }
    if (settings.longBreakMinutes !== undefined && !isNaN(Number(settings.longBreakMinutes))) {
      s.longBreakMinutes = Number(settings.longBreakMinutes)
    }
  }
  switch (phase) {
    case PHASES.WORK:
      return s.workMinutes * 60
    case PHASES.SHORT_BREAK:
      return s.shortBreakMinutes * 60
    case PHASES.LONG_BREAK:
      return s.longBreakMinutes * 60
    default:
      return s.workMinutes * 60
  }
}

export function getNextPhase(currentPhase, completedWorkPomodoros, settings) {
  const s = { ...DEFAULT_SETTINGS }
  if (settings && typeof settings === 'object') {
    if (settings.longBreakInterval !== undefined && !isNaN(Number(settings.longBreakInterval))) {
      s.longBreakInterval = Number(settings.longBreakInterval)
    }
  }
  if (currentPhase === PHASES.WORK) {
    const newCount = completedWorkPomodoros + 1
    if (newCount > 0 && newCount % s.longBreakInterval === 0) {
      return { phase: PHASES.LONG_BREAK, completedWorkPomodoros: newCount }
    }
    return { phase: PHASES.SHORT_BREAK, completedWorkPomodoros: newCount }
  }
  return { phase: PHASES.WORK, completedWorkPomodoros }
}

export function validateSettings(settings) {
  const errors = {}
  const s = settings || {}

  const workMinutes = Number(s.workMinutes)
  if (s.workMinutes === undefined || s.workMinutes === '' || isNaN(workMinutes) || workMinutes < 1 || workMinutes > 120) {
    errors.workMinutes = '工作时长必须是1-120分钟之间的数字'
  }

  const shortBreakMinutes = Number(s.shortBreakMinutes)
  if (s.shortBreakMinutes === undefined || s.shortBreakMinutes === '' || isNaN(shortBreakMinutes) || shortBreakMinutes < 1 || shortBreakMinutes > 60) {
    errors.shortBreakMinutes = '短休时长必须是1-60分钟之间的数字'
  }

  const longBreakMinutes = Number(s.longBreakMinutes)
  if (s.longBreakMinutes === undefined || s.longBreakMinutes === '' || isNaN(longBreakMinutes) || longBreakMinutes < 1 || longBreakMinutes > 120) {
    errors.longBreakMinutes = '长休时长必须是1-120分钟之间的数字'
  }

  const longBreakInterval = Number(s.longBreakInterval)
  if (s.longBreakInterval === undefined || s.longBreakInterval === '' || isNaN(longBreakInterval) || longBreakInterval < 2 || longBreakInterval > 6) {
    errors.longBreakInterval = '长休间隔必须是2-6之间的数字'
  }

  return errors
}

export function normalizeSettings(settings) {
  const errors = validateSettings(settings)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  return {
    success: true,
    settings: {
      workMinutes: Number(settings.workMinutes),
      shortBreakMinutes: Number(settings.shortBreakMinutes),
      longBreakMinutes: Number(settings.longBreakMinutes),
      longBreakInterval: Number(settings.longBreakInterval),
    },
  }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_SETTINGS }
    const normalized = normalizeSettings(parsed)
    if (!normalized.success) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...normalized.settings }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  const normalized = normalizeSettings(settings)
  if (!normalized.success) {
    return { success: false, errors: normalized.errors }
  }
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(normalized.settings))
    return { success: true, settings: normalized.settings }
  } catch {
    return { success: false, errors: { storage: '保存失败' } }
  }
}

export function generateRecordId() {
  return 'pom_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function createPomodoroRecord(taskName, durationMinutes, phase) {
  return {
    id: generateRecordId(),
    taskName: (taskName || '').trim() || '未命名任务',
    durationMinutes: Number(durationMinutes) || 0,
    phase: phase || PHASES.WORK,
    completedAt: Date.now(),
  }
}

export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r) =>
        r &&
        typeof r === 'object' &&
        typeof r.completedAt === 'number' &&
        typeof r.durationMinutes === 'number'
    )
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

export function addRecord(records, newRecord) {
  if (!newRecord || !newRecord.id) return records
  return [newRecord, ...records]
}

export function getDateKey(timestamp) {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getLastNDays(n) {
  const days = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    days.push({
      key: getDateKey(d.getTime()),
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      timestamp: d.getTime(),
    })
  }
  return days
}

export function buildDailyStats(records, days) {
  const dayMap = {}
  days.forEach((d) => {
    dayMap[d.key] = { date: d.key, label: d.label, count: 0, minutes: 0 }
  })
  records.forEach((r) => {
    if (r.phase !== PHASES.WORK) return
    const key = getDateKey(r.completedAt)
    if (dayMap[key]) {
      dayMap[key].count += 1
      dayMap[key].minutes += r.durationMinutes
    }
  })
  return days.map((d) => dayMap[d.key])
}

export function calculateSummary(records) {
  const workRecords = records.filter((r) => r.phase === PHASES.WORK)
  const totalPomodoros = workRecords.length
  const totalMinutes = workRecords.reduce((sum, r) => sum + r.durationMinutes, 0)

  let dailyAvg = 0
  if (workRecords.length > 0) {
    const dateSet = new Set(workRecords.map((r) => getDateKey(r.completedAt)))
    const dayCount = Math.max(1, dateSet.size)
    dailyAvg = Number((totalPomodoros / dayCount).toFixed(1))
  }

  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  return {
    totalPomodoros,
    totalMinutes,
    totalHours,
    remainingMinutes,
    dailyAvg,
  }
}

export function updateDocumentTitle(remainingSeconds, phaseLabel) {
  if (typeof document === 'undefined') return
  if (remainingSeconds > 0) {
    document.title = `${formatTime(remainingSeconds)} - ${phaseLabel}`
  } else {
    document.title = '番茄钟计时器'
  }
}

export function resetDocumentTitle() {
  if (typeof document === 'undefined') return
  document.title = '番茄钟计时器'
}

export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const result = await Notification.requestPermission()
    return result
  } catch {
    return 'denied'
  }
}

export function sendNotification(title, body) {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission !== 'granted') return false
  try {
    new Notification(title, { body })
    return true
  } catch {
    return false
  }
}

export function playBeep() {
  if (typeof AudioContext === 'undefined' && typeof globalThis.webkitAudioContext === 'undefined') {
    return false
  }
  try {
    const AudioCtx = AudioContext || globalThis.webkitAudioContext
    const ctx = new AudioCtx()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.frequency.value = 880
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
    return true
  } catch {
    return false
  }
}
