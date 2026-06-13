import {
    DEFAULT_PAGE_SIZE,
    DEFAULT_RETENTION_DAYS,
    IP_PREFIXES,
    MAX_RETENTION_DAYS,
    MIN_RETENTION_DAYS,
    OPERATION_RESULTS,
    OPERATION_TYPES,
    OPERATORS,
    RESOURCE_PREFIXES,
    STORAGE_KEY_CONFIG,
    STORAGE_KEY_LOGS,
} from './constants'

export function generateId() {
  return 'log_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateResourceName() {
  const prefix = randomItem(RESOURCE_PREFIXES)
  if (prefix === '用户') {
    return `用户 ${randomItem(OPERATORS)}`
  }
  return `${prefix}#${randomInt(100, 9999)}`
}

export function generateIpAddress() {
  return randomItem(IP_PREFIXES) + randomInt(1, 254)
}

export function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

export function formatDateKey(date) {
  if (!date) return ''
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function generateSingleLog(timestamp) {
  const opType = randomItem(OPERATION_TYPES)
  const result = Math.random() < 0.85 ? OPERATION_RESULTS.SUCCESS : OPERATION_RESULTS.FAILURE
  const operator = randomItem(OPERATORS)
  const resource = generateResourceName()
  const ip = generateIpAddress()

  const requestParams = {}
  if (opType === '登录' || opType === '登出') {
    requestParams.device = randomItem(['Chrome/Windows', 'Firefox/Mac', 'Safari/iOS', 'Chrome/Android'])
    requestParams.browser = randomItem(['Chrome 120', 'Firefox 121', 'Safari 17'])
  } else if (opType === '新增' || opType === '修改') {
    requestParams.fields = randomInt(3, 10)
    requestParams.source = randomItem(['web', 'api', 'import'])
  } else if (opType === '删除') {
    requestParams.reason = randomItem(['用户请求', '数据过期', '管理员操作', '系统清理'])
    requestParams.cascade = Math.random() > 0.5
  } else if (opType === '导出') {
    requestParams.format = randomItem(['CSV', 'Excel', 'PDF'])
    requestParams.recordCount = randomInt(10, 5000)
  } else if (opType === '权限变更') {
    requestParams.fromRole = randomItem(['viewer', 'editor', 'admin'])
    requestParams.toRole = randomItem(['viewer', 'editor', 'admin'])
  }

  const beforeData = opType === '修改' ? { status: randomItem(['active', 'inactive']), value: randomInt(10, 999) } : null
  const afterData = opType === '修改' ? { status: randomItem(['active', 'inactive']), value: randomInt(10, 999) } : null

  return {
    id: generateId(),
    timestamp,
    operator,
    operationType: opType,
    resource,
    result,
    ip,
    requestParams,
    beforeData,
    afterData,
    duration: randomInt(10, 3000),
    sessionId: 'sess_' + Math.random().toString(36).slice(2, 10),
    userAgent: randomItem([
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
    ]),
  }
}

export function generateMockLogs(count = 200) {
  const now = Date.now()
  const logs = []
  for (let i = 0; i < count; i++) {
    const offset = Math.random() * 30 * 24 * 60 * 60 * 1000
    const ts = now - offset
    logs.push(generateSingleLog(ts))
  }
  logs.sort((a, b) => b.timestamp - a.timestamp)
  return logs
}

export function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs))
    return true
  } catch {
    return false
  }
}

export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG)
    if (!raw) return { retentionDays: DEFAULT_RETENTION_DAYS }
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { retentionDays: DEFAULT_RETENTION_DAYS }
    return { retentionDays: DEFAULT_RETENTION_DAYS, ...parsed }
  } catch {
    return { retentionDays: DEFAULT_RETENTION_DAYS }
  }
}

export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config))
    return true
  } catch {
    return false
  }
}

export function validateRetentionDays(days) {
  const num = Number(days)
  if (isNaN(num)) return { valid: false, error: '请输入有效数字' }
  if (!Number.isInteger(num)) return { valid: false, error: '请输入整数' }
  if (num < MIN_RETENTION_DAYS) return { valid: false, error: `最少保留 ${MIN_RETENTION_DAYS} 天` }
  if (num > MAX_RETENTION_DAYS) return { valid: false, error: `最多保留 ${MAX_RETENTION_DAYS} 天` }
  return { valid: true, value: num }
}

export function filterLogs(logs, filters = {}) {
  let result = [...logs]

  if (filters.operator && filters.operator.trim()) {
    const kw = filters.operator.trim().toLowerCase()
    result = result.filter((log) => log.operator.toLowerCase().includes(kw))
  }

  if (filters.operationTypes !== undefined && filters.operationTypes !== null) {
    result = result.filter((log) => filters.operationTypes.includes(log.operationType))
  }

  if (filters.result && filters.result !== 'all') {
    result = result.filter((log) => log.result === filters.result)
  }

  if (filters.startDate) {
    const startTs = new Date(filters.startDate).getTime()
    if (!isNaN(startTs)) {
      result = result.filter((log) => log.timestamp >= startTs)
    }
  }

  if (filters.endDate) {
    const endTs = new Date(filters.endDate).getTime() + 24 * 60 * 60 * 1000 - 1
    if (!isNaN(endTs)) {
      result = result.filter((log) => log.timestamp <= endTs)
    }
  }

  if (filters.resource && filters.resource.trim()) {
    const kw = filters.resource.trim().toLowerCase()
    result = result.filter((log) => log.resource.toLowerCase().includes(kw))
  }

  return result
}

export function paginateLogs(logs, page, pageSize = DEFAULT_PAGE_SIZE) {
  const total = logs.length
  const totalPage = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: logs.slice(start, end),
    total,
    totalPage,
    currentPage,
    pageSize,
  }
}

export function cleanupExpiredLogs(logs, retentionDays) {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
  const remaining = logs.filter((log) => log.timestamp >= cutoff)
  const removedCount = logs.length - remaining.length
  return { logs: remaining, removedCount }
}

export function exportToCsv(logs) {
  const headers = ['操作时间', '操作人', '操作类型', '操作对象', '操作结果', 'IP地址']
  const rows = logs.map((log) => [
    formatDateTime(log.timestamp),
    log.operator,
    log.operationType,
    log.resource,
    log.result,
    log.ip,
  ])
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  return csvContent
}

export function downloadCsv(csvContent, filename) {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function buildTrendData(logs) {
  const now = new Date()
  const days = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    days.push({
      date: formatDateKey(d),
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      total: 0,
      failed: 0,
    })
  }

  const dayMap = {}
  days.forEach((d) => {
    dayMap[d.date] = d
  })

  const thirtyDaysAgo = new Date(days[0].date).getTime()
  logs.forEach((log) => {
    if (log.timestamp < thirtyDaysAgo) return
    const dateKey = formatDateKey(log.timestamp)
    if (dayMap[dateKey]) {
      dayMap[dateKey].total++
      if (log.result === OPERATION_RESULTS.FAILURE) {
        dayMap[dateKey].failed++
      }
    }
  })

  return days.map((d) => ({
    ...d,
    failureRate: d.total > 0 ? d.failed / d.total : 0,
    isAnomaly: d.total > 0 && (d.failed / d.total) > 0.2,
  }))
}

export function countRecentFailures(logs, hours = 24) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  return logs.filter((log) => log.timestamp >= cutoff && log.result === OPERATION_RESULTS.FAILURE).length
}

export function initLogsIfNeeded() {
  const existing = loadLogs()
  if (existing.length === 0) {
    const logs = generateMockLogs(200)
    saveLogs(logs)
    return logs
  }
  return existing
}
