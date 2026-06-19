import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import './export-scheduler.css'
import {
  TASK_STATUS_RUNNING,
  TASK_STATUS_PAUSED,
  TASK_STATUS_COMPLETED,
  RECORD_STATUS_SUCCESS,
  RECORD_STATUS_FAILED,
  RECORD_STATUS_EXECUTING,
  RECORD_STATUS_RETRYING,
  FREQUENCY_ONCE,
  FREQUENCY_DAILY,
  FREQUENCY_WEEKLY,
  FREQUENCY_MONTHLY,
  ALL_FREQUENCIES,
  FREQUENCY_LABELS,
  DATA_SOURCES,
  DATA_SOURCE_FIELDS,
  DATA_SOURCE_LABEL_MAP,
  ALL_EXPORT_FORMATS,
  EXPORT_FORMAT_LABELS,
  EXPORT_FORMAT_CSV,
  EXPORT_FORMAT_JSON,
  EXPORT_FORMAT_EXCEL,
  WEEK_DAY_LABELS,
  MAX_RETRY_COUNT,
  FAILURE_PROBABILITY,
  EXPORT_MIN_DURATION_MS,
  EXPORT_MAX_DURATION_MS,
  TIMELINE_PAGE_SIZE,
  NOTIFICATION_DURATION_OPTIONS,
  DEFAULT_NOTIFICATION_SETTINGS,
} from './constants.js'
import {
  generateId,
  calculateNextExecutionTime,
  taskStatusTransition,
  retryStateMachine,
  shouldTriggerExecution,
  shouldSimulateFailure,
  selectRandomFailureReason,
  randomInt,
  generateExportData,
  formatExportContent,
  buildFileName,
  estimateFileSize,
  formatFileSize,
  formatDateTime,
  getFrequencyDescription,
  getStatusLabel,
  getRecordStatusLabel,
  createTask,
  validateTaskForm,
  paginateRecords,
  filterRecordsByTaskName,
  sortRecordsByTime,
  showBrowserNotification,
  requestNotificationPermission,
} from './utils.js'
import {
  loadTasks,
  saveTasks,
  loadRecords,
  saveRecords,
  loadSettings,
  saveSettings,
  loadEngineState,
  saveEngineState,
  recalculateNextExecutionForOverdueTasks,
} from './storage.js'

function CreateTaskModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '',
    dataSource: 'orders',
    fields: [],
    format: EXPORT_FORMAT_CSV,
    frequency: FREQUENCY_DAILY,
    executionTime: '08:00',
    weekDays: [],
    monthDay: 1,
  })
  const [errors, setErrors] = useState({})
  const availableFields = DATA_SOURCE_FIELDS[form.dataSource] || []

  const handleFieldToggle = (fieldId) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.includes(fieldId)
        ? prev.fields.filter((f) => f !== fieldId)
        : [...prev.fields, fieldId],
    }))
  }

  const handleWeekDayToggle = (day) => {
    setForm((prev) => ({
      ...prev,
      weekDays: prev.weekDays.includes(day)
        ? prev.weekDays.filter((d) => d !== day)
        : [...prev.weekDays, day],
    }))
  }

  const handleDataSourceChange = (ds) => {
    setForm((prev) => ({ ...prev, dataSource: ds, fields: [] }))
  }

  const handleSubmit = () => {
    const result = validateTaskForm(form)
    if (!result.valid) {
      setErrors(result.errors)
      return
    }
    onCreate(form)
    onClose()
  }

  return (
    <div className="es-modal-overlay" onClick={onClose}>
      <div className="es-modal" onClick={(e) => e.stopPropagation()}>
        <div className="es-modal-header">
          <h3 className="es-modal-title">创建导出任务</h3>
          <button className="es-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="es-form-field">
          <label className="es-form-label">任务名称<span className="es-form-required">*</span></label>
          <input
            className={`es-form-input ${errors.name ? 'error' : ''}`}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            maxLength={50}
            placeholder="不超过50字符"
          />
          {errors.name && <div className="es-form-error">{errors.name}</div>}
        </div>

        <div className="es-form-field">
          <label className="es-form-label">数据源<span className="es-form-required">*</span></label>
          <select
            className="es-form-select"
            value={form.dataSource}
            onChange={(e) => handleDataSourceChange(e.target.value)}
          >
            {DATA_SOURCES.map((ds) => (
              <option key={ds.id} value={ds.id}>{ds.label}</option>
            ))}
          </select>
          {errors.dataSource && <div className="es-form-error">{errors.dataSource}</div>}
        </div>

        <div className="es-form-field">
          <label className="es-form-label">导出字段<span className="es-form-required">*</span></label>
          <div className="es-field-checkboxes">
            {availableFields.map((f) => (
              <label key={f.id} className="es-field-checkbox">
                <input
                  type="checkbox"
                  checked={form.fields.includes(f.id)}
                  onChange={() => handleFieldToggle(f.id)}
                />
                {f.label}
              </label>
            ))}
          </div>
          {errors.fields && <div className="es-form-error">{errors.fields}</div>}
        </div>

        <div className="es-form-field">
          <label className="es-form-label">导出格式</label>
          <div className="es-format-radios">
            {ALL_EXPORT_FORMATS.map((fmt) => (
              <label key={fmt} className="es-format-radio">
                <input
                  type="radio"
                  name="format"
                  checked={form.format === fmt}
                  onChange={() => setForm((p) => ({ ...p, format: fmt }))}
                />
                {EXPORT_FORMAT_LABELS[fmt]}
              </label>
            ))}
          </div>
        </div>

        <div className="es-form-field">
          <label className="es-form-label">调度频率<span className="es-form-required">*</span></label>
          <select
            className="es-form-select"
            value={form.frequency}
            onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))}
          >
            {ALL_FREQUENCIES.map((f) => (
              <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
            ))}
          </select>
          {errors.frequency && <div className="es-form-error">{errors.frequency}</div>}
        </div>

        {form.frequency === FREQUENCY_WEEKLY && (
          <div className="es-form-field">
            <label className="es-form-label">执行星期<span className="es-form-required">*</span></label>
            <div className="es-weekday-checks">
              {WEEK_DAY_LABELS.map((label, idx) => (
                <div
                  key={idx}
                  className={`es-weekday-check ${form.weekDays.includes(idx) ? 'active' : ''}`}
                  onClick={() => handleWeekDayToggle(idx)}
                >
                  {label}
                </div>
              ))}
            </div>
            {errors.weekDays && <div className="es-form-error">{errors.weekDays}</div>}
          </div>
        )}

        {form.frequency === FREQUENCY_MONTHLY && (
          <div className="es-form-field">
            <label className="es-form-label">执行日期 (1-28)<span className="es-form-required">*</span></label>
            <div className="es-month-day-grid">
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  className={`es-month-day-btn ${form.monthDay === day ? 'active' : ''}`}
                  onClick={() => setForm((p) => ({ ...p, monthDay: day }))}
                >
                  {day}
                </div>
              ))}
            </div>
            {errors.monthDay && <div className="es-form-error">{errors.monthDay}</div>}
          </div>
        )}

        <div className="es-form-field">
          <label className="es-form-label">执行时间<span className="es-form-required">*</span></label>
          <input
            type="time"
            className={`es-form-input ${errors.executionTime ? 'error' : ''}`}
            value={form.executionTime}
            onChange={(e) => setForm((p) => ({ ...p, executionTime: e.target.value }))}
          />
          {errors.executionTime && <div className="es-form-error">{errors.executionTime}</div>}
        </div>

        <div className="es-modal-actions">
          <button className="es-btn es-btn-ghost" onClick={onClose}>取消</button>
          <button className="es-btn es-btn-primary" onClick={handleSubmit}>创建</button>
        </div>
      </div>
    </div>
  )
}

function NotificationSettingsPanel({ settings, onUpdate }) {
  return (
    <div className="es-settings-panel">
      <div className="es-settings-row">
        <span className="es-settings-label">启用通知</span>
        <div className="es-settings-control">
          <button
            className={`es-toggle ${settings.enabled ? 'active' : ''}`}
            onClick={() => onUpdate({ ...settings, enabled: !settings.enabled })}
          />
        </div>
      </div>
      <div className="es-settings-row">
        <span className="es-settings-label">仅失败时通知</span>
        <div className="es-settings-control">
          <button
            className={`es-toggle ${settings.onlyFailure ? 'active' : ''}`}
            onClick={() => onUpdate({ ...settings, onlyFailure: !settings.onlyFailure })}
          />
        </div>
      </div>
      <div className="es-settings-row">
        <span className="es-settings-label">通知停留时长</span>
        <div className="es-settings-control">
          <select
            className="es-settings-select"
            value={settings.duration}
            onChange={(e) => onUpdate({ ...settings, duration: Number(e.target.value) })}
          >
            {NOTIFICATION_DURATION_OPTIONS.map((d) => (
              <option key={d} value={d}>{d} 秒</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), toast.duration * 1000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onClose])

  return (
    <div className={`es-toast ${toast.type}`}>
      <div className="es-toast-header">
        <span className="es-toast-title">{toast.title}</span>
        <button className="es-toast-close" onClick={() => onClose(toast.id)}>✕</button>
      </div>
      <div className="es-toast-body">{toast.body}</div>
    </div>
  )
}

export default function ExportSchedulerPage() {
  const [tasks, setTasks] = useState(() => loadTasks(localStorage))
  const [records, setRecords] = useState(() => loadRecords(localStorage))
  const [settings, setSettings] = useState(() => loadSettings(localStorage))
  const [engineState, setEngineState] = useState(() => loadEngineState(localStorage))
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [toasts, setToasts] = useState([])
  const [timelineFilter, setTimelineFilter] = useState('')
  const [timelinePage, setTimelinePage] = useState(1)
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  const executingTasksRef = useRef(new Set())
  const heartbeatRef = useRef(null)

  useEffect(() => { saveTasks(tasks, localStorage) }, [tasks])
  useEffect(() => { saveRecords(records, localStorage) }, [records])
  useEffect(() => { saveSettings(settings, localStorage) }, [settings])
  useEffect(() => { saveEngineState(engineState, localStorage) }, [engineState])

  const addToast = useCallback((title, body, type = 'success', duration = settings.duration) => {
    const id = generateId()
    setToasts((prev) => [...prev, { id, title, body, type, duration }])
  }, [settings.duration])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notifyUser = useCallback((task, recordStatus, count) => {
    if (!settings.enabled) return
    if (settings.onlyFailure && recordStatus === RECORD_STATUS_SUCCESS) return

    const title = `导出任务：${task.name}`
    const body = recordStatus === RECORD_STATUS_SUCCESS
      ? `导出成功，共 ${count} 条数据`
      : `导出失败`

    const notifSent = showBrowserNotification(title, body)
    if (!notifSent) {
      addToast(title, body, recordStatus === RECORD_STATUS_SUCCESS ? 'success' : 'failed')
    } else {
      addToast(title, body, recordStatus === RECORD_STATUS_SUCCESS ? 'success' : 'failed')
    }
  }, [settings, addToast])

  const executeExport = useCallback((task, isManual = false) => {
    if (executingTasksRef.current.has(task.id)) return
    executingTasksRef.current.add(task.id)

    const recordId = generateId()
    const executedAt = Date.now()

    const executingRecord = {
      id: recordId,
      taskId: task.id,
      taskName: task.name,
      dataSource: task.dataSource,
      status: RECORD_STATUS_EXECUTING,
      executedAt,
      triggerType: isManual ? 'manual' : 'auto',
    }
    setRecords((prev) => sortRecordsByTime([executingRecord, ...prev]))

    const duration = randomInt(EXPORT_MIN_DURATION_MS, EXPORT_MAX_DURATION_MS)

    setTimeout(() => {
      const failed = shouldSimulateFailure(FAILURE_PROBABILITY)

      if (failed) {
        const failureReason = selectRandomFailureReason()
        const currentRetryState = { retryCount: 0, isRetrying: false, failed: false }
        const newRetryState = retryStateMachine(currentRetryState, 'fail')

        setRecords((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? { ...r, status: RECORD_STATUS_FAILED, failureReason, duration: Math.round(duration / 1000) }
              : r
          )
        )

        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, retryState: newRetryState, updatedAt: Date.now() }
              : t
          )
        )

        notifyUser(task, RECORD_STATUS_FAILED, 0)

        if (newRetryState.isRetrying) {
          startRetrySequence(task.id, recordId, 1, failureReason)
        }
      } else {
        const data = generateExportData(task.dataSource, task.fields)
        const content = formatExportContent(data, task.format, task.fields)
        const fileSize = estimateFileSize(content)
        const fileName = buildFileName(task.dataSource, task.name, task.format)

        setRecords((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  status: RECORD_STATUS_SUCCESS,
                  fileSize,
                  rowCount: data.count,
                  duration: Math.round(duration / 1000),
                  fileName,
                  exportContent: content,
                  format: task.format,
                }
              : r
          )
        )

        const newNextTime = calculateNextExecutionTime(
          task.frequency,
          task.executionTime,
          task.weekDays,
          task.monthDay,
          new Date()
        )

        let newStatus = task.status
        if (task.frequency === FREQUENCY_ONCE) {
          newStatus = taskStatusTransition(task.status, 'complete')
        }

        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: newStatus,
                  nextExecutionTime: task.frequency === FREQUENCY_ONCE ? null : newNextTime,
                  retryState: { retryCount: 0, isRetrying: false, failed: false },
                  updatedAt: Date.now(),
                }
              : t
          )
        )

        notifyUser(task, RECORD_STATUS_SUCCESS, data.count)
      }

      executingTasksRef.current.delete(task.id)
    }, duration)
  }, [notifyUser])

  const startRetrySequence = useCallback((taskId, originalRecordId, retryCount, previousReason) => {
    setTimeout(() => {
      setTasks((currentTasks) => {
        const task = currentTasks.find((t) => t.id === taskId)
        if (!task || task.status !== TASK_STATUS_RUNNING) return currentTasks

        const retryRecordId = generateId()
        const retryRecord = {
          id: retryRecordId,
          taskId: task.id,
          taskName: task.name,
          dataSource: task.dataSource,
          status: RECORD_STATUS_RETRYING,
          executedAt: Date.now(),
          triggerType: 'retry',
          retryCount,
        }

        setRecords((prev) => sortRecordsByTime([retryRecord, ...prev]))

        const retryDuration = randomInt(EXPORT_MIN_DURATION_MS, EXPORT_MAX_DURATION_MS)

        setTimeout(() => {
          const failed = shouldSimulateFailure(FAILURE_PROBABILITY)

          if (failed) {
            const failureReason = selectRandomFailureReason()
            const newRetryState = retryStateMachine(
              { retryCount, isRetrying: true, failed: false },
              'retry_fail'
            )

            setRecords((prev) =>
              prev.map((r) =>
                r.id === retryRecordId
                  ? { ...r, status: RECORD_STATUS_FAILED, failureReason, duration: Math.round(retryDuration / 1000) }
                  : r
              )
            )

            if (newRetryState.failed) {
              setTasks((prev) =>
                prev.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        status: taskStatusTransition(t.status, 'retry_exhausted'),
                        retryState: newRetryState,
                        updatedAt: Date.now(),
                      }
                    : t
                )
              )
              addToast(`重试失败：${task.name}`, `已重试 ${MAX_RETRY_COUNT} 次仍失败，任务已暂停`, 'failed')
            } else {
              setTasks((prev) =>
                prev.map((t) =>
                  t.id === taskId
                    ? { ...t, retryState: newRetryState, updatedAt: Date.now() }
                    : t
                )
              )
              startRetrySequence(taskId, retryRecordId, retryCount + 1, failureReason)
            }
          } else {
            const data = generateExportData(task.dataSource, task.fields)
            const content = formatExportContent(data, task.format, task.fields)
            const fileSize = estimateFileSize(content)
            const fileName = buildFileName(task.dataSource, task.name, task.format)

            setRecords((prev) =>
              prev.map((r) =>
                r.id === retryRecordId
                  ? {
                      ...r,
                      status: RECORD_STATUS_SUCCESS,
                      fileSize,
                      rowCount: data.count,
                      duration: Math.round(retryDuration / 1000),
                      fileName,
                      exportContent: content,
                      format: task.format,
                    }
                  : r
              )
            )

            const newNextTime = calculateNextExecutionTime(
              task.frequency,
              task.executionTime,
              task.weekDays,
              task.monthDay,
              new Date()
            )

            setTasks((prev) =>
              prev.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      nextExecutionTime: task.frequency === FREQUENCY_ONCE ? null : newNextTime,
                      retryState: { retryCount: 0, isRetrying: false, failed: false },
                      updatedAt: Date.now(),
                    }
                  : t
              )
            )

            notifyUser(task, RECORD_STATUS_SUCCESS, data.count)
          }
        }, retryDuration)

        return currentTasks
      })
    }, 10000)
  }, [notifyUser, addToast])

  useEffect(() => {
    if (!engineState.running) return

    const overdueRecalculated = recalculateNextExecutionForOverdueTasks(tasks, Date.now())
    const hasChanges = overdueRecalculated.some((t, i) => t.nextExecutionTime !== tasks[i]?.nextExecutionTime)
    if (hasChanges) {
      setTasks(overdueRecalculated)
    }
  }, [])

  useEffect(() => {
    if (!engineState.running) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      return
    }

    heartbeatRef.current = setInterval(() => {
      const now = Date.now()
      setTasks((currentTasks) => {
        let updated = false
        const newTasks = currentTasks.map((task) => {
          if (shouldTriggerExecution(task, now)) {
            updated = true
            setTimeout(() => executeExport(task, false), 0)
            return { ...task, nextExecutionTime: null, updatedAt: now }
          }
          return task
        })
        return updated ? newTasks : currentTasks
      })
    }, 1000)

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
    }
  }, [engineState.running, executeExport])

  const handleCreateTask = useCallback((formData) => {
    const task = createTask(formData)
    setTasks((prev) => [task, ...prev])
  }, [])

  const handlePauseTask = useCallback((taskId) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: taskStatusTransition(t.status, 'pause'), updatedAt: Date.now() }
          : t
      )
    )
  }, [])

  const handleResumeTask = useCallback((taskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        const newStatus = taskStatusTransition(t.status, 'manual_resume')
        let nextTime = t.nextExecutionTime
        if (!nextTime && newStatus === TASK_STATUS_RUNNING) {
          nextTime = calculateNextExecutionTime(
            t.frequency, t.executionTime, t.weekDays, t.monthDay, new Date()
          )
        }
        return {
          ...t,
          status: newStatus,
          nextExecutionTime: nextTime,
          retryState: { retryCount: 0, isRetrying: false, failed: false },
          updatedAt: Date.now(),
        }
      })
    )
  }, [])

  const handleDeleteTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    setRecords((prev) => prev.filter((r) => r.taskId !== taskId))
  }, [])

  const handleManualExecute = useCallback((taskId) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    executeExport(task, true)
  }, [tasks, executeExport])

  const handleManualRetry = useCallback((taskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        return {
          ...t,
          retryState: { retryCount: 0, isRetrying: false, failed: false },
          updatedAt: Date.now(),
        }
      })
    )
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      executeExport({ ...task, retryState: { retryCount: 0, isRetrying: false, failed: false } }, true)
    }
  }, [tasks, executeExport])

  const handleToggleEngine = useCallback(() => {
    setEngineState((prev) => ({ running: !prev.running }))
  }, [])

  const handleRequestNotification = async () => {
    const result = await requestNotificationPermission()
    setNotificationPermission(result)
  }

  const handleDownload = useCallback((record) => {
    if (!record.exportContent || !record.fileName) return

    let mimeType = 'text/csv'
    if (record.format === EXPORT_FORMAT_JSON) {
      mimeType = 'application/json'
    } else if (record.format === EXPORT_FORMAT_EXCEL) {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    const blob = new Blob([record.exportContent], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = record.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const filteredRecords = filterRecordsByTaskName(records, timelineFilter)
  const sortedRecords = sortRecordsByTime(filteredRecords)
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / TIMELINE_PAGE_SIZE))
  const currentPage = Math.min(timelinePage, totalPages)
  const pageRecords = paginateRecords(sortedRecords, currentPage, TIMELINE_PAGE_SIZE)

  return (
    <div className="es-page">
      <div className="es-header">
        <div className="es-header-left">
          <Link to="/" className="es-back-link">← 返回首页</Link>
          <h1 className="es-title">数据导出调度器</h1>
        </div>
        <div className="es-header-right">
          <button className="es-btn es-btn-ghost" onClick={() => setShowSettings(!showSettings)}>
            ⚙ 通知设置
          </button>
          <div className="es-engine-toggle" onClick={handleToggleEngine} style={{ cursor: 'pointer' }}>
            <span className={`es-engine-dot ${engineState.running ? 'running' : 'stopped'}`} />
            <span>{engineState.running ? '调度运行中' : '调度已停止'}</span>
          </div>
          <button className="es-btn es-btn-primary" onClick={() => setShowCreateModal(true)}>
            + 创建任务
          </button>
        </div>
      </div>

      {notificationPermission !== 'granted' && notificationPermission !== 'denied' && notificationPermission !== 'unsupported' && (
        <div style={{ padding: '10px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14 }}>🔔 开启浏览器通知以便接收导出完成通知</span>
          <button className="es-btn es-btn-primary es-btn-sm" onClick={handleRequestNotification}>开启通知</button>
        </div>
      )}

      {showSettings && (
        <NotificationSettingsPanel
          settings={settings}
          onUpdate={setSettings}
        />
      )}

      {tasks.length === 0 ? (
        <div className="es-empty-state">
          <div className="es-empty-state-icon">📤</div>
          <div className="es-empty-state-text">暂无导出任务，点击「创建任务」开始</div>
        </div>
      ) : (
        <div className="es-task-grid">
          {tasks.map((task) => (
            <div key={task.id} className="es-task-card">
              <div className="es-task-card-header">
                <h3 className="es-task-name">{task.name}</h3>
                <span className={`es-task-status ${task.status}`}>
                  {getStatusLabel(task.status)}
                </span>
              </div>

              {task.retryState && task.retryState.failed && (
                <div className="es-task-retry-warning">
                  ⚠ 重试 {MAX_RETRY_COUNT} 次仍失败，任务已暂停
                </div>
              )}
              {task.retryState && task.retryState.isRetrying && (
                <div className="es-task-retry-warning" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                  🔄 重试中 (第 {task.retryState.retryCount} 次)
                </div>
              )}

              <div className="es-task-meta">
                <div className="es-task-meta-row">
                  <span className="es-task-meta-label">数据源</span>
                  <span>{DATA_SOURCE_LABEL_MAP[task.dataSource] || task.dataSource}</span>
                </div>
                <div className="es-task-meta-row">
                  <span className="es-task-meta-label">调度频率</span>
                  <span>{getFrequencyDescription(task)}</span>
                </div>
                <div className="es-task-meta-row">
                  <span className="es-task-meta-label">下次执行</span>
                  <span>{task.nextExecutionTime ? formatDateTime(task.nextExecutionTime) : (task.status === TASK_STATUS_COMPLETED ? '已完成' : '—')}</span>
                </div>
              </div>

              <div className="es-task-actions">
                {task.status === TASK_STATUS_RUNNING && (
                  <>
                    <button className="es-btn es-btn-ghost es-btn-sm" onClick={() => handleManualExecute(task.id)}>
                      ▶ 立即执行
                    </button>
                    <button className="es-btn es-btn-ghost es-btn-sm" onClick={() => handlePauseTask(task.id)}>
                      ⏸ 暂停
                    </button>
                  </>
                )}
                {task.status === TASK_STATUS_PAUSED && (
                  <>
                    <button className="es-btn es-btn-success es-btn-sm" onClick={() => handleResumeTask(task.id)}>
                      ▶ 恢复
                    </button>
                    {task.retryState && task.retryState.failed && (
                      <button className="es-btn es-btn-ghost es-btn-sm" onClick={() => handleManualRetry(task.id)}>
                        🔄 重试
                      </button>
                    )}
                  </>
                )}
                <button className="es-btn es-btn-danger es-btn-sm" onClick={() => handleDeleteTask(task.id)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="es-section-title">执行时间线</h2>
      <div className="es-timeline-filter">
        <input
          className="es-timeline-search"
          placeholder="按任务名称筛选..."
          value={timelineFilter}
          onChange={(e) => {
            setTimelineFilter(e.target.value)
            setTimelinePage(1)
          }}
        />
      </div>

      {sortedRecords.length === 0 ? (
        <div className="es-empty-state">
          <div className="es-empty-state-icon">📋</div>
          <div className="es-empty-state-text">暂无执行记录</div>
        </div>
      ) : (
        <>
          <div className="es-timeline-list">
            {pageRecords.map((record) => (
              <div key={record.id} className={`es-timeline-item ${record.status}`}>
                <div className="es-tl-time">{formatDateTime(record.executedAt)}</div>
                <div className="es-tl-task-name">{record.taskName}</div>
                <span className={`es-tl-status ${record.status}`}>
                  {record.status === RECORD_STATUS_RETRYING
                    ? `重试中(第${record.retryCount || 0}次)`
                    : getRecordStatusLabel(record.status)}
                </span>
                <div className="es-tl-detail">
                  {record.status === RECORD_STATUS_SUCCESS && (
                    <>
                      {record.rowCount} 条 · {formatFileSize(record.fileSize)} · {record.duration}s
                      {record.triggerType === 'manual' && ' · 手动'}
                    </>
                  )}
                  {record.status === RECORD_STATUS_FAILED && (
                    <>
                      {record.failureReason}
                      {record.duration && ` · ${record.duration}s`}
                    </>
                  )}
                  {record.status === RECORD_STATUS_EXECUTING && '导出中...'}
                  {record.status === RECORD_STATUS_RETRYING && '等待重试...'}
                </div>
                <div className="es-tl-actions">
                  {record.status === RECORD_STATUS_SUCCESS && (
                    <button className="es-btn es-btn-primary es-btn-sm" onClick={() => handleDownload(record)}>
                      下载
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="es-pagination">
              <button
                className="es-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setTimelinePage((p) => Math.max(1, p - 1))}
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((page) => (
                  <button
                    key={page}
                    className={`es-page-btn ${page === currentPage ? 'active' : ''}`}
                    onClick={() => setTimelinePage(page)}
                  >
                    {page}
                  </button>
                ))}
              <button
                className="es-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setTimelinePage((p) => Math.min(totalPages, p + 1))}
              >
                下一页
              </button>
              <span className="es-page-info">
                共 {sortedRecords.length} 条
              </span>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
        />
      )}

      {toasts.length > 0 && (
        <div className="es-notification-container">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </div>
      )}
    </div>
  )
}
