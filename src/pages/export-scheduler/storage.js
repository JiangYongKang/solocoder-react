import {
  STORAGE_KEY_TASKS,
  STORAGE_KEY_RECORDS,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_ENGINE,
  DEFAULT_NOTIFICATION_SETTINGS,
  TASK_STATUS_RUNNING,
  FREQUENCY_ONCE,
} from './constants.js'
import { calculateNextExecutionTime } from './utils.js'

export function loadTasks(storage) {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY_TASKS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeTask).filter(Boolean)
  } catch {
    return []
  }
}

export function saveTasks(tasks, storage) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks))
  } catch { /* ignore */ }
}

export function loadRecords(storage) {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY_RECORDS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveRecords(records, storage) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records))
  } catch { /* ignore */ }
}

export function loadSettings(storage) {
  if (!storage) return { ...DEFAULT_NOTIFICATION_SETTINGS }
  try {
    const raw = storage.getItem(STORAGE_KEY_SETTINGS)
    if (!raw) return { ...DEFAULT_NOTIFICATION_SETTINGS }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_NOTIFICATION_SETTINGS }
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_NOTIFICATION_SETTINGS.enabled,
      onlyFailure: typeof parsed.onlyFailure === 'boolean' ? parsed.onlyFailure : DEFAULT_NOTIFICATION_SETTINGS.onlyFailure,
      duration: [3, 5, 10].includes(parsed.duration) ? parsed.duration : DEFAULT_NOTIFICATION_SETTINGS.duration,
    }
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS }
  }
}

export function saveSettings(settings, storage) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings))
  } catch { /* ignore */ }
}

export function loadEngineState(storage) {
  if (!storage) return { running: true }
  try {
    const raw = storage.getItem(STORAGE_KEY_ENGINE)
    if (!raw) return { running: true }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { running: true }
    return {
      running: typeof parsed.running === 'boolean' ? parsed.running : true,
    }
  } catch {
    return { running: true }
  }
}

export function saveEngineState(state, storage) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY_ENGINE, JSON.stringify(state))
  } catch { /* ignore */ }
}

function normalizeTask(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.id !== 'string' || !raw.id) return null
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null

  return {
    id: raw.id,
    name: raw.name.trim(),
    dataSource: raw.dataSource || 'orders',
    fields: Array.isArray(raw.fields) ? raw.fields : [],
    format: raw.format || 'csv',
    frequency: raw.frequency || FREQUENCY_ONCE,
    executionTime: raw.executionTime || '00:00',
    weekDays: Array.isArray(raw.weekDays) ? raw.weekDays : [],
    monthDay: typeof raw.monthDay === 'number' ? raw.monthDay : 1,
    status: [TASK_STATUS_RUNNING, 'paused', 'completed'].includes(raw.status) ? raw.status : TASK_STATUS_RUNNING,
    nextExecutionTime: typeof raw.nextExecutionTime === 'number' ? raw.nextExecutionTime : null,
    retryState: raw.retryState || { retryCount: 0, isRetrying: false, failed: false },
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
  }
}

export function recalculateNextExecutionForOverdueTasks(tasks, now) {
  return tasks.map((task) => {
    if (task.status !== TASK_STATUS_RUNNING) return task
    if (!task.nextExecutionTime) return task
    if (task.nextExecutionTime > now) return task
    if (task.retryState && task.retryState.isRetrying) return task

    const newNext = calculateNextExecutionTime(
      task.frequency,
      task.executionTime,
      task.weekDays,
      task.monthDay,
      new Date(now)
    )
    return { ...task, nextExecutionTime: newNext, updatedAt: now }
  })
}
