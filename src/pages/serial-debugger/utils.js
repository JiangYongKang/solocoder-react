import {
  DATA_BITS,
  STOP_BITS,
  PARITY_OPTIONS,
  PARITY_MAP,
  MAX_HISTORY_ITEMS,
  MAX_PINNED_ITEMS,
  DIRECTIONS,
  EXPORT_FORMATS,
} from './constants'

export function asciiToHex(str) {
  if (typeof str !== 'string') return ''
  let result = ''
  for (let i = 0; i < str.length; i++) {
    const hex = str.charCodeAt(i).toString(16).toUpperCase()
    result += (hex.length === 1 ? '0' + hex : hex) + ' '
  }
  return result.trim()
}

export function hexToAscii(hexStr) {
  if (typeof hexStr !== 'string') return ''
  const cleaned = hexStr.replace(/\s+/g, '')
  if (cleaned.length % 2 !== 0) return ''
  let result = ''
  for (let i = 0; i < cleaned.length; i += 2) {
    const hex = cleaned.substr(i, 2)
    if (!/^[0-9A-Fa-f]{2}$/.test(hex)) return ''
    result += String.fromCharCode(parseInt(hex, 16))
  }
  return result
}

export function isValidHex(hexStr) {
  if (typeof hexStr !== 'string') return false
  const cleaned = hexStr.replace(/\s+/g, '')
  if (cleaned.length === 0) return true
  if (cleaned.length % 2 !== 0) return false
  return /^[0-9A-Fa-f]+$/.test(cleaned)
}

export function formatHexString(hexStr) {
  if (typeof hexStr !== 'string') return ''
  const cleaned = hexStr.replace(/\s+/g, '').toUpperCase()
  let result = ''
  for (let i = 0; i < cleaned.length; i += 2) {
    if (i > 0) result += ' '
    result += cleaned.substr(i, 2)
  }
  return result
}

export function formatTimestamp(date) {
  if (date === null || date === undefined || date === '') return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const pad = (n, len = 2) => String(n).padStart(len, '0')
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  const seconds = pad(d.getSeconds())
  const ms = pad(d.getMilliseconds(), 3)
  return `[${hours}:${minutes}:${seconds}.${ms}]`
}

export function validateBaudRate(baudRate) {
  const num = Number(baudRate)
  if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
    return { valid: false, error: '波特率必须是正整数' }
  }
  if (num < 300 || num > 921600) {
    return { valid: false, error: '波特率范围应在 300 - 921600 之间' }
  }
  return { valid: true }
}

export function validateDataBits(dataBits) {
  const num = Number(dataBits)
  if (!DATA_BITS.includes(num)) {
    return { valid: false, error: `数据位必须是 ${DATA_BITS.join('/')} 之一` }
  }
  return { valid: true }
}

export function validateStopBits(stopBits) {
  const num = Number(stopBits)
  if (!STOP_BITS.includes(num)) {
    return { valid: false, error: `停止位必须是 ${STOP_BITS.join('/')} 之一` }
  }
  return { valid: true }
}

export function validateParity(parity) {
  const validValues = PARITY_OPTIONS.map((p) => p.value)
  if (!validValues.includes(parity)) {
    return { valid: false, error: `校验位必须是 ${validValues.join('/')} 之一` }
  }
  return { valid: true }
}

export function validatePort(port) {
  if (!port && port !== 0) {
    return { valid: false, error: '串口号不能为空' }
  }
  return { valid: true }
}

export function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    return { valid: false, error: '配置必须是对象' }
  }

  const portResult = validatePort(config.port)
  if (!portResult.valid) return portResult

  const baudResult = validateBaudRate(config.baudRate)
  if (!baudResult.valid) return baudResult

  const dataBitsResult = validateDataBits(config.dataBits)
  if (!dataBitsResult.valid) return dataBitsResult

  const stopBitsResult = validateStopBits(config.stopBits)
  if (!stopBitsResult.valid) return stopBitsResult

  const parityResult = validateParity(config.parity)
  if (!parityResult.valid) return parityResult

  return { valid: true }
}

export function formatConfigSummary(config) {
  if (!config) return ''
  const parityChar = PARITY_MAP[config.parity] || 'N'
  return `${config.port} ${config.baudRate}-${config.dataBits}-${parityChar}-${config.stopBits}`
}

export function generateId() {
  return `serial-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function addHistoryItem(history, item, maxItems = MAX_HISTORY_ITEMS) {
  if (!Array.isArray(history)) {
    history = []
  }

  const newItem = {
    id: generateId(),
    timestamp: Date.now(),
    ...item,
  }

  const newHistory = [newItem, ...history]

  if (newHistory.length > maxItems) {
    return {
      history: newHistory.slice(0, maxItems),
      evicted: newHistory.length - maxItems,
    }
  }

  return {
    history: newHistory,
    evicted: 0,
  }
}

export function filterHistoryByKeyword(history, keyword) {
  if (!Array.isArray(history)) return []
  if (!keyword || !keyword.trim()) return history

  const kw = keyword.trim().toLowerCase()

  return history.filter((item) => {
    const content = (item.content || '').toLowerCase()
    const format = (item.format || '').toLowerCase()
    return content.includes(kw) || format.includes(kw)
  })
}

export function togglePinnedItem(pinned, item, maxPinned = MAX_PINNED_ITEMS) {
  if (!Array.isArray(pinned)) {
    pinned = []
  }

  const exists = pinned.some((p) => p.id === item.id)

  if (exists) {
    return {
      pinned: pinned.filter((p) => p.id !== item.id),
      added: false,
      error: null,
    }
  }

  if (pinned.length >= maxPinned) {
    return {
      pinned,
      added: false,
      error: `最多只能固定 ${maxPinned} 条`,
    }
  }

  return {
    pinned: [...pinned, { ...item, pinned: true }],
    added: true,
    error: null,
  }
}

export function truncateText(text, maxLength = 50) {
  if (typeof text !== 'string') return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function formatLogEntry(entry, options = {}) {
  const {
    showTimestamp = true,
    showDirection = true,
    autoWrap = true,
    isHex = false,
  } = options

  let prefix = ''

  if (showTimestamp && entry.timestamp) {
    prefix += formatTimestamp(entry.timestamp) + ' '
  }

  if (showDirection && entry.direction) {
    prefix += entry.direction === DIRECTIONS.SEND ? '→ ' : '← '
  }

  let content = entry.content || ''

  if (isHex && entry.format === 'ascii') {
    content = asciiToHex(content)
  } else if (!isHex && entry.format === 'hex') {
    content = hexToAscii(content)
  }

  const result = prefix + content
  return autoWrap ? result + '\n' : result
}

export function buildExportContent(receiveLog, history, config, format = EXPORT_FORMATS.PLAIN_TEXT) {
  let content = ''

  if (format === EXPORT_FORMATS.WITH_HEADER) {
    const exportTime = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    content += '=== 串口调试日志 ===\n'
    content += `导出时间: ${exportTime}\n`
    content += `串口: ${config?.port || '-'}\n`
    content += `波特率: ${config?.baudRate || '-'}\n`
    content += `数据位: ${config?.dataBits || '-'}\n`
    content += `停止位: ${config?.stopBits || '-'}\n`
    content += `校验位: ${PARITY_MAP[config?.parity] || '-'}\n`
    content += '===================\n\n'
  }

  if (receiveLog && receiveLog.length > 0) {
    content += '--- 接收区日志 ---\n'
    for (const entry of receiveLog) {
      content += formatLogEntry(entry, {
        showTimestamp: true,
        showDirection: true,
        autoWrap: true,
      })
    }
    content += '\n'
  }

  if (history && history.length > 0) {
    content += '--- 发送历史 ---\n'
    history.forEach((item, index) => {
      const time = formatTimestamp(item.timestamp)
      const fmt = item.format === 'hex' ? 'Hex' : 'ASCII'
      content += `${index + 1}. ${time} [${fmt}] ${item.content || ''}\n`
    })
  }

  return content
}

export function downloadTextFile(content, filename = 'serial-log.txt') {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false
  }

  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)

    return true
  } catch {
    return false
  }
}

export function loadConfigFromStorage() {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem('serial_debugger_config')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    return parsed
  } catch {
    return null
  }
}

export function saveConfigToStorage(config) {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem('serial_debugger_config', JSON.stringify(config))
    return true
  } catch {
    return false
  }
}

export function loadHistoryFromStorage() {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem('serial_debugger_history')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveHistoryToStorage(history) {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem('serial_debugger_history', JSON.stringify(history))
    return true
  } catch {
    return false
  }
}

export function loadPinnedFromStorage() {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem('serial_debugger_pinned')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function savePinnedToStorage(pinned) {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem('serial_debugger_pinned', JSON.stringify(pinned))
    return true
  } catch {
    return false
  }
}
