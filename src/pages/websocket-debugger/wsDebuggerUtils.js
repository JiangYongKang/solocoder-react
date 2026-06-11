const HISTORY_STORAGE_KEY = 'ws-debugger-history'
const SETTINGS_STORAGE_KEY = 'ws-debugger-settings'

export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
}

export const DIRECTION = {
  SENT: 'sent',
  RECEIVED: 'received',
  SYSTEM: 'system',
}

export const DEFAULT_WS_URL = 'wss://echo.websocket.org'

export const MESSAGE_TEMPLATES = [
  { label: 'Ping', content: '{"type":"ping"}' },
  { label: 'Subscribe', content: '{"type":"subscribe","channel":""}' },
  { label: 'Unsubscribe', content: '{"type":"unsubscribe","channel":""}' },
  { label: 'Auth', content: '{"type":"auth","token":""}' },
]

export const DEFAULT_HEARTBEAT_INTERVAL = 10
export const DEFAULT_HEARTBEAT_TIMEOUT_THRESHOLD = 3
export const DEFAULT_HEARTBEAT_ENABLED = true
export const DEFAULT_RECONNECT_ENABLED = true
export const DEFAULT_RECONNECT_MAX_RETRIES = 5
export const DEFAULT_RECONNECT_INTERVAL = 3

const ECHO_SERVER_PATTERNS = [
  /echo\.websocket\.org/i,
  /ws\.ifelse\.io/i,
  /echo-server/i,
  /websocket\.org/i,
]

export function isEchoServer(url) {
  if (!url || typeof url !== 'string') return false
  return ECHO_SERVER_PATTERNS.some((pattern) => pattern.test(url))
}

export function isPongResponse(content) {
  if (!content || typeof content !== 'string') return false
  try {
    const parsed = JSON.parse(content)
    return parsed && parsed.type === 'pong'
  } catch {
    return content.trim().toLowerCase() === 'pong'
  }
}

const CLOSE_CODE_DESCRIPTIONS = {
  1000: '正常关闭',
  1001: '端点离开',
  1002: '协议错误',
  1003: '数据类型不支持',
  1005: '未收到状态码',
  1006: '连接异常中断',
  1007: '数据格式错误',
  1008: '违反政策',
  1009: '消息过大',
  1010: '扩展协商失败',
  1011: '服务器内部错误',
  1012: '服务重启',
  1013: '请稍后重试',
  1014: '服务器处理错误',
  1015: 'TLS 握手失败',
}

export function formatCloseError(code, reason) {
  const codeStr = code != null ? String(code) : 'N/A'
  const description = CLOSE_CODE_DESCRIPTIONS[code] || '未知错误'
  const parts = [`[${codeStr}] ${description}`]
  if (reason && reason.trim()) {
    parts.push(`: ${reason.trim()}`)
  }
  return parts.join('')
}

export function highlightKeyword(text, keyword) {
  if (!text || !keyword || keyword.trim() === '') return escapeHtml(text)
  const kw = keyword.trim()
  const lowerKw = kw.toLowerCase()
  const lowerText = text.toLowerCase()
  const kwLen = kw.length

  const indices = []
  let pos = 0
  while (pos < lowerText.length) {
    const idx = lowerText.indexOf(lowerKw, pos)
    if (idx === -1) break
    indices.push(idx)
    pos = idx + kwLen
  }

  if (indices.length === 0) return escapeHtml(text)

  const parts = []
  let lastEnd = 0
  for (const idx of indices) {
    if (idx > lastEnd) {
      parts.push(escapeHtml(text.slice(lastEnd, idx)))
    }
    parts.push(`<span class="ws-log-highlight">${escapeHtml(text.slice(idx, idx + kwLen))}</span>`)
    lastEnd = idx + kwLen
  }
  if (lastEnd < text.length) {
    parts.push(escapeHtml(text.slice(lastEnd)))
  }

  return parts.join('')
}

export function generateId() {
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatTimestampMs(date) {
  if (date == null) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const pad = (n, len = 2) => String(n).padStart(len, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

export function formatConnectionDuration(seconds) {
  if (seconds == null || typeof seconds !== 'number' || seconds < 0) return '00:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function isValidJson(str) {
  if (str == null || str === '') return false
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

export function formatJson(str) {
  if (str == null || str === '') return str
  try {
    const parsed = JSON.parse(str)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return str
  }
}

export function tryFormatMessage(content) {
  if (content == null) return ''
  if (typeof content !== 'string') return String(content)
  if (isValidJson(content)) {
    return formatJson(content)
  }
  return content
}

export function truncateMessage(content, maxLen = 100) {
  if (content == null) return ''
  const str = String(content)
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '...'
}

export function createLogEntry(direction, content, meta = {}) {
  return {
    id: generateId(),
    direction,
    content,
    timestamp: Date.now(),
    expanded: false,
    meta,
  }
}

export function createSystemLog(message) {
  return createLogEntry(DIRECTION.SYSTEM, message)
}

export function createHistoryEntry(url) {
  return {
    id: generateId(),
    url,
    lastConnectedAt: Date.now(),
  }
}

export function addHistory(history, entry) {
  const filtered = history.filter((h) => h.url !== entry.url)
  return [entry, ...filtered].slice(0, 50)
}

export function deleteHistory(history, id) {
  return history.filter((h) => h.id !== id)
}

export function clearHistory() {
  return []
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return []
}

export function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  } catch {
    // ignore
  }
}

export function createDefaultSettings() {
  return {
    heartbeatEnabled: DEFAULT_HEARTBEAT_ENABLED,
    heartbeatInterval: DEFAULT_HEARTBEAT_INTERVAL,
    heartbeatTimeoutThreshold: DEFAULT_HEARTBEAT_TIMEOUT_THRESHOLD,
    reconnectEnabled: DEFAULT_RECONNECT_ENABLED,
    reconnectMaxRetries: DEFAULT_RECONNECT_MAX_RETRIES,
    reconnectInterval: DEFAULT_RECONNECT_INTERVAL,
  }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        return {
          ...createDefaultSettings(),
          ...parsed,
        }
      }
    }
  } catch {
    // ignore
  }
  return createDefaultSettings()
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

export function clampValue(value, min, max, fallback) {
  const num = Number(value)
  if (isNaN(num)) return fallback
  return Math.min(Math.max(num, min), max)
}

export function getStatusColor(status) {
  switch (status) {
    case CONNECTION_STATUS.CONNECTED:
      return '#27ae60'
    case CONNECTION_STATUS.CONNECTING:
      return '#f39c12'
    case CONNECTION_STATUS.DISCONNECTED:
      return '#e74c3c'
    case CONNECTION_STATUS.ERROR:
      return '#95a5a6'
    default:
      return '#95a5a6'
  }
}

export function getStatusText(status, errorReason = '') {
  switch (status) {
    case CONNECTION_STATUS.CONNECTED:
      return '已连接'
    case CONNECTION_STATUS.CONNECTING:
      return '连接中...'
    case CONNECTION_STATUS.DISCONNECTED:
      return '已断开'
    case CONNECTION_STATUS.ERROR:
      return errorReason || '错误'
    default:
      return '未知'
  }
}

export function escapeHtml(text) {
  if (text == null) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function highlightJson(jsonString, keyword = '') {
  if (jsonString == null || jsonString === '') return ''
  const escaped = escapeHtml(jsonString)
  let result = escaped
  result = result.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"(\s*:)?/g, (match, str, colon) => {
    if (colon) {
      return `<span class="ws-hl-property">"${str}"</span>${colon}`
    }
    return `<span class="ws-hl-string">"${str}"</span>`
  })
  result = result.replace(/\b(-?\d+\.?\d*)\b/g, '<span class="ws-hl-number">$1</span>')
  result = result.replace(/\b(true|false|null)\b/g, '<span class="ws-hl-keyword">$1</span>')
  if (keyword && keyword.trim()) {
    result = applyKeywordHighlight(result, keyword)
  }
  return result
}

function applyKeywordHighlight(html, keyword) {
  const kw = keyword.trim()
  if (!kw) return html
  const lowerKw = kw.toLowerCase()
  return html.replace(/>([^<]+)</g, (match, text) => {
    const lowerText = text.toLowerCase()
    if (lowerText.includes(lowerKw)) {
      const highlighted = text.replace(
        new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
        '<span class="ws-log-highlight">$1</span>'
      )
      return `>${highlighted}<`
    }
    return match
  })
}

export function formatMessageForDisplay(content, expanded, keyword = '') {
  if (content == null) return ''
  const isLong = String(content).length > 100
  if (!expanded && isLong) {
    const truncated = truncateMessage(content, 100)
    return keyword && keyword.trim()
      ? highlightKeyword(truncated, keyword)
      : escapeHtml(truncated)
  }
  const formatted = tryFormatMessage(content)
  if (isValidJson(formatted)) {
    return highlightJson(formatted, keyword)
  }
  return keyword && keyword.trim()
    ? highlightKeyword(formatted, keyword)
    : escapeHtml(formatted)
}

export function filterLogs(logs, keyword) {
  if (!keyword || keyword.trim() === '') return logs
  const lower = keyword.toLowerCase()
  return logs.filter((log) => {
    const content = String(log.content).toLowerCase()
    return content.includes(lower)
  })
}

export function shouldAutoScroll(container) {
  if (!container) return true
  const threshold = 80
  return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
}
