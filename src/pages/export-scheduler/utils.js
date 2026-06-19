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
  FAILURE_REASONS,
  DATA_SOURCE_FIELDS,
  DATA_SOURCE_LABEL_MAP,
  EXPORT_FORMAT_CSV,
  EXPORT_FORMAT_JSON,
  EXPORT_FORMAT_EXCEL,
  EXPORT_FORMAT_EXTENSIONS,
  MAX_RETRY_COUNT,
  MOCK_MIN_ROWS,
  MOCK_MAX_ROWS,
} from './constants.js'

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function calculateNextExecutionTime(frequency, executionTime, weekDays, monthDay, fromTime) {
  const from = fromTime instanceof Date ? fromTime : new Date(fromTime)
  const [hours, minutes] = executionTime.split(':').map(Number)
  const next = new Date(from)
  next.setHours(hours, minutes, 0, 0)

  if (next <= from) {
    next.setDate(next.getDate() + 1)
  }

  if (frequency === FREQUENCY_ONCE) {
    const candidate = new Date(from)
    candidate.setHours(hours, minutes, 0, 0)
    if (candidate <= from) {
      candidate.setDate(candidate.getDate() + 1)
    }
    return candidate.getTime()
  }

  if (frequency === FREQUENCY_DAILY) {
    return next.getTime()
  }

  if (frequency === FREQUENCY_WEEKLY) {
    const days = Array.isArray(weekDays) ? weekDays.sort((a, b) => a - b) : []
    if (days.length === 0) return null
    const currentDay = from.getDay()
    let minDaysAhead = Infinity
    for (const d of days) {
      let diff = d - currentDay
      if (diff < 0) diff += 7
      if (diff === 0) {
        const candidate = new Date(from)
        candidate.setHours(hours, minutes, 0, 0)
        if (candidate > from) {
          minDaysAhead = 0
          break
        }
        diff = 7
      }
      if (diff < minDaysAhead) minDaysAhead = diff
    }
    const result = new Date(from)
    result.setDate(result.getDate() + minDaysAhead)
    result.setHours(hours, minutes, 0, 0)
    return result.getTime()
  }

  if (frequency === FREQUENCY_MONTHLY) {
    const day = Math.max(1, Math.min(28, monthDay || 1))
    const candidate = new Date(from.getFullYear(), from.getMonth(), day, hours, minutes, 0, 0)
    if (candidate <= from) {
      const nextMonth = from.getMonth() + 1
      candidate.setFullYear(from.getFullYear() + Math.floor(nextMonth / 12), nextMonth % 12, day)
    }
    return candidate.getTime()
  }

  return null
}

export function taskStatusTransition(currentStatus, action) {
  switch (action) {
    case 'pause':
      if (currentStatus === TASK_STATUS_RUNNING) return TASK_STATUS_PAUSED
      return currentStatus
    case 'resume':
      if (currentStatus === TASK_STATUS_PAUSED) return TASK_STATUS_RUNNING
      return currentStatus
    case 'complete':
      if (currentStatus === TASK_STATUS_RUNNING) return TASK_STATUS_COMPLETED
      return currentStatus
    case 'retry_exhausted':
      if (currentStatus === TASK_STATUS_RUNNING) return TASK_STATUS_PAUSED
      return currentStatus
    case 'manual_resume':
      if (currentStatus === TASK_STATUS_PAUSED) return TASK_STATUS_RUNNING
      return currentStatus
    default:
      return currentStatus
  }
}

export function retryStateMachine(state, action) {
  const defaultState = { retryCount: 0, isRetrying: false, failed: false }
  const s = state || defaultState

  switch (action) {
    case 'execute':
      return { retryCount: 0, isRetrying: false, failed: false }
    case 'fail':
      if (s.retryCount >= MAX_RETRY_COUNT) {
        return { retryCount: s.retryCount, isRetrying: false, failed: true }
      }
      return { retryCount: s.retryCount, isRetrying: true, failed: false }
    case 'retry':
      if (s.isRetrying && s.retryCount < MAX_RETRY_COUNT) {
        return { retryCount: s.retryCount + 1, isRetrying: true, failed: false }
      }
      return s
    case 'retry_fail':
      if (s.retryCount >= MAX_RETRY_COUNT) {
        return { retryCount: MAX_RETRY_COUNT, isRetrying: false, failed: true }
      }
      return { retryCount: s.retryCount + 1, isRetrying: true, failed: false }
    case 'retry_success':
      return { retryCount: 0, isRetrying: false, failed: false }
    case 'reset':
      return { ...defaultState }
    default:
      return s
  }
}

export function shouldTriggerExecution(task, currentTime) {
  if (task.status !== TASK_STATUS_RUNNING) return false
  if (!task.nextExecutionTime) return false
  if (task.retryState && task.retryState.isRetrying) return false
  return currentTime >= task.nextExecutionTime
}

export function isOverdueTask(task, currentTime) {
  if (task.status !== TASK_STATUS_RUNNING) return false
  if (!task.nextExecutionTime) return false
  if (task.retryState && task.retryState.isRetrying) return false
  return currentTime > task.nextExecutionTime + 60000
}

export function selectRandomFailureReason() {
  return FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)]
}

export function shouldSimulateFailure(probability) {
  return Math.random() < probability
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateMockRow(dataSource, fields) {
  const fieldDefs = DATA_SOURCE_FIELDS[dataSource] || []
  const row = {}
  for (const fieldId of fields) {
    const def = fieldDefs.find((f) => f.id === fieldId)
    if (!def) continue
    row[fieldId] = generateFieldValue(fieldId, dataSource)
  }
  return row
}

function generateFieldValue(fieldId, dataSource) {
  switch (fieldId) {
    case 'orderNo':
      return `ORD-${randomInt(100000, 999999)}`
    case 'customerName':
      return `${['张', '李', '王', '赵', '刘', '陈'][randomInt(0, 5)]}${['伟', '芳', '敏', '强', '丽', '军'][randomInt(0, 5)]}`
    case 'amount':
      return (Math.random() * 10000).toFixed(2)
    case 'status':
      return ['待付款', '已付款', '已发货', '已完成', '已取消'][randomInt(0, 4)]
    case 'createdAt':
      return formatMockDate(new Date(Date.now() - randomInt(0, 30 * 86400000)))
    case 'userId':
      return `USR-${randomInt(10000, 99999)}`
    case 'username':
      return `user_${randomInt(100, 999)}`
    case 'email':
      return `user${randomInt(10, 999)}@example.com`
    case 'phone':
      return `1${randomInt(30, 99)}${randomInt(10000000, 99999999)}`
    case 'registeredAt':
      return formatMockDate(new Date(Date.now() - randomInt(0, 365 * 86400000)))
    case 'productId':
      return `PRD-${randomInt(10000, 99999)}`
    case 'productName':
      return ['无线耳机', '机械键盘', '显示器', '鼠标垫', '摄像头'][randomInt(0, 4)]
    case 'price':
      return (Math.random() * 5000).toFixed(2)
    case 'stock':
      return randomInt(0, 10000)
    case 'category':
      return ['电子产品', '家居', '服装', '食品', '运动'][randomInt(0, 4)]
    case 'logId':
      return `LOG-${randomInt(100000, 999999)}`
    case 'level':
      return ['DEBUG', 'INFO', 'WARN', 'ERROR'][randomInt(0, 3)]
    case 'message':
      return ['请求处理完成', '连接超时', '数据校验失败', '缓存命中', '服务重启'][randomInt(0, 4)]
    case 'source':
      return ['api-gateway', 'user-service', 'order-service', 'payment-service'][randomInt(0, 3)]
    case 'timestamp':
      return formatMockDate(new Date(Date.now() - randomInt(0, 7 * 86400000)))
    case 'id':
      return `ID-${randomInt(1000, 9999)}`
    case 'name':
      return ['项目A', '项目B', '任务C', '配置D'][randomInt(0, 3)]
    case 'value':
      return `${randomInt(10, 999)}`
    case 'type':
      return ['类型A', '类型B', '类型C'][randomInt(0, 2)]
    case 'updatedAt':
      return formatMockDate(new Date(Date.now() - randomInt(0, 14 * 86400000)))
    default:
      return `val_${randomInt(0, 999)}`
  }
}

function formatMockDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

export function generateExportData(dataSource, fields) {
  const rowCount = randomInt(MOCK_MIN_ROWS, MOCK_MAX_ROWS)
  const rows = []
  for (let i = 0; i < rowCount; i++) {
    rows.push(generateMockRow(dataSource, fields))
  }
  return { rows, count: rowCount }
}

export function formatToCSV(data, fields) {
  const fieldDefs = DATA_SOURCE_FIELDS[data.dataSource] || []
  const headers = fields.map((fId) => {
    const def = fieldDefs.find((f) => f.id === fId)
    return def ? def.label : fId
  })
  const lines = [headers.join(',')]
  for (const row of data.rows) {
    const values = fields.map((fId) => {
      const val = String(row[fId] ?? '')
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    })
    lines.push(values.join(','))
  }
  return lines.join('\n')
}

export function formatToJSON(data, fields) {
  const filtered = data.rows.map((row) => {
    const obj = {}
    for (const fId of fields) {
      obj[fId] = row[fId]
    }
    return obj
  })
  return JSON.stringify(filtered, null, 2)
}

export function formatExportContent(data, format, fields) {
  switch (format) {
    case EXPORT_FORMAT_CSV:
      return formatToCSV(data, fields)
    case EXPORT_FORMAT_JSON:
      return formatToJSON(data, fields)
    case EXPORT_FORMAT_EXCEL:
      return formatToCSV(data, fields)
    default:
      return formatToCSV(data, fields)
  }
}

export function buildFileName(dataSource, taskName, format) {
  const dsLabel = DATA_SOURCE_LABEL_MAP[dataSource] || dataSource
  const safeName = taskName.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50)
  const now = new Date()
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  const ext = EXPORT_FORMAT_EXTENSIONS[format] || '.csv'
  return `${dsLabel}_${safeName}_${ts}${ext}`
}

export function estimateFileSize(content) {
  return new Blob([content]).size
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatDateTime(timestamp) {
  if (!timestamp) return ''
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

export function formatTime(timestamp) {
  if (!timestamp) return ''
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function getFrequencyDescription(task) {
  switch (task.frequency) {
    case FREQUENCY_ONCE:
      return `一次性 ${task.executionTime}`
    case FREQUENCY_DAILY:
      return `每天 ${task.executionTime}`
    case FREQUENCY_WEEKLY:
      if (task.weekDays && task.weekDays.length > 0) {
        const labels = task.weekDays.map((d) => `周${['日', '一', '二', '三', '四', '五', '六'][d]}`).join('、')
        return `每周 ${labels} ${task.executionTime}`
      }
      return `每周 ${task.executionTime}`
    case FREQUENCY_MONTHLY:
      return `每月 ${task.monthDay || 1} 日 ${task.executionTime}`
    default:
      return ''
  }
}

export function getStatusLabel(status) {
  switch (status) {
    case TASK_STATUS_RUNNING:
      return '运行中'
    case TASK_STATUS_PAUSED:
      return '已暂停'
    case TASK_STATUS_COMPLETED:
      return '已完成'
    default:
      return ''
  }
}

export function getRecordStatusLabel(status) {
  switch (status) {
    case RECORD_STATUS_SUCCESS:
      return '成功'
    case RECORD_STATUS_FAILED:
      return '失败'
    case RECORD_STATUS_EXECUTING:
      return '执行中'
    case RECORD_STATUS_RETRYING:
      return '重试中'
    default:
      return ''
  }
}

export function createTask(data) {
  const now = Date.now()
  const nextExecutionTime = calculateNextExecutionTime(
    data.frequency,
    data.executionTime,
    data.weekDays,
    data.monthDay,
    new Date(now)
  )
  return {
    id: generateId(),
    name: data.name,
    dataSource: data.dataSource,
    fields: data.fields,
    format: data.format,
    frequency: data.frequency,
    executionTime: data.executionTime,
    weekDays: data.weekDays || [],
    monthDay: data.monthDay || 1,
    status: TASK_STATUS_RUNNING,
    nextExecutionTime,
    retryState: { retryCount: 0, isRetrying: false, failed: false },
    createdAt: now,
    updatedAt: now,
  }
}

export function validateTaskForm(data) {
  const errors = {}
  if (!data.name || !data.name.trim()) {
    errors.name = '任务名称不能为空'
  } else if (data.name.trim().length > 50) {
    errors.name = '任务名称不超过50字符'
  }
  if (!data.dataSource) {
    errors.dataSource = '请选择数据源'
  }
  if (!data.fields || data.fields.length === 0) {
    errors.fields = '请至少选择一个导出字段'
  }
  if (!data.format) {
    errors.format = '请选择导出格式'
  }
  if (!data.frequency) {
    errors.frequency = '请选择调度频率'
  }
  if (!data.executionTime) {
    errors.executionTime = '请选择执行时间'
  }
  if (data.frequency === FREQUENCY_WEEKLY && (!data.weekDays || data.weekDays.length === 0)) {
    errors.weekDays = '请至少选择一天'
  }
  if (data.frequency === FREQUENCY_MONTHLY && (!data.monthDay || data.monthDay < 1 || data.monthDay > 28)) {
    errors.monthDay = '请选择1-28日'
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

export function paginateRecords(records, page, pageSize) {
  const start = (page - 1) * pageSize
  return records.slice(start, start + pageSize)
}

export function filterRecordsByTaskName(records, taskName) {
  if (!taskName) return records
  return records.filter((r) => r.taskName && r.taskName.includes(taskName))
}

export function sortRecordsByTime(records) {
  return [...records].sort((a, b) => b.executedAt - a.executedAt)
}

export function requestNotificationPermission() {
  if (typeof Notification === 'undefined') {
    return Promise.resolve('unsupported')
  }
  if (Notification.permission === 'granted') {
    return Promise.resolve('granted')
  }
  if (Notification.permission === 'denied') {
    return Promise.resolve('denied')
  }
  return Notification.requestPermission()
}

export function showBrowserNotification(title, body) {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission !== 'granted') return false
  try {
    new Notification(title, { body })
    return true
  } catch {
    return false
  }
}
