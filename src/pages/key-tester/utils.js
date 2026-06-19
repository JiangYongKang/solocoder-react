import {
  PRESET_COMBINATIONS,
  MODIFIER_KEYS,
  MODIFIER_KEY_LABELS,
  MAX_LOG_ENTRIES,
  STORAGE_KEY_LOGS,
  STORAGE_KEY_FREQUENCY,
  STORAGE_KEY_LAYOUT,
  KEYBOARD_LAYOUTS,
} from './constants'

export function generateId() {
  return `key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const MODIFIER_KEY_GROUPS = {
  ControlLeft: 'Control',
  ControlRight: 'Control',
  ShiftLeft: 'Shift',
  ShiftRight: 'Shift',
  AltLeft: 'Alt',
  AltRight: 'Alt',
  MetaLeft: 'Meta',
  MetaRight: 'Meta',
}

function normalizeModifierKey(code) {
  return MODIFIER_KEY_GROUPS[code] || code
}

export function isModifierKey(code) {
  return MODIFIER_KEYS.includes(code)
}

export function getModifierKeyLabel(code) {
  return MODIFIER_KEY_LABELS[code] || code
}

export function getKeyDisplayLabel(code, layout = 'qwerty') {
  const layoutData = KEYBOARD_LAYOUTS[layout]
  if (!layoutData) return code

  for (const row of layoutData.rows) {
    for (const key of row) {
      if (key.code === code) {
        return key.label
      }
    }
  }
  return code
}

export function buildCombinationLabel(activeKeys) {
  if (!Array.isArray(activeKeys) || activeKeys.length === 0) {
    return ''
  }

  const orderedKeys = sortCombinationKeys([...activeKeys])
  return orderedKeys.map((code) => getModifierKeyLabel(code) || code).join('+')
}

export function sortCombinationKeys(keys) {
  const order = ['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight']

  return [...keys].sort((a, b) => {
    const aIndex = order.indexOf(a)
    const bIndex = order.indexOf(b)

    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

export function detectCombination(activeKeys) {
  if (!Array.isArray(activeKeys) || activeKeys.length < 2) {
    return null
  }

  const activeSet = new Set(activeKeys)
  const normalizedActiveSet = new Set(activeKeys.map(normalizeModifierKey))

  for (const preset of PRESET_COMBINATIONS) {
    const normalizedPresetSet = new Set(preset.keys.map(normalizeModifierKey))

    if (normalizedPresetSet.size === normalizedActiveSet.size) {
      let match = true
      for (const key of normalizedPresetSet) {
        if (!normalizedActiveSet.has(key)) {
          match = false
          break
        }
      }
      if (match) {
        return { ...preset }
      }
    }
  }

  const hasModifier = activeKeys.some((k) => isModifierKey(k))
  const hasNonModifier = activeKeys.some((k) => !isModifierKey(k))

  if (hasModifier && hasNonModifier) {
    return {
      keys: [...activeKeys],
      label: buildCombinationLabel(activeKeys),
      description: '自定义组合键',
      category: 'custom',
      isCustom: true,
    }
  }

  return null
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

export function getHeatmapColor(count, maxCount) {
  if (maxCount <= 0 || count <= 0) {
    return '#e8f4fd'
  }

  const ratio = Math.min(count / maxCount, 1)

  const lowColor = hexToRgb('#3498db')
  const midColor = hexToRgb('#f1c40f')
  const highColor = hexToRgb('#ff3b30')

  let r, g, b

  if (ratio < 0.5) {
    const t = ratio * 2
    r = lowColor.r + (midColor.r - lowColor.r) * t
    g = lowColor.g + (midColor.g - lowColor.g) * t
    b = lowColor.b + (midColor.b - lowColor.b) * t
  } else {
    const t = (ratio - 0.5) * 2
    r = midColor.r + (highColor.r - midColor.r) * t
    g = midColor.g + (highColor.g - midColor.g) * t
    b = midColor.b + (highColor.b - midColor.b) * t
  }

  return rgbToHex(r, g, b)
}

export function calculateFrequencyPercentage(count, total) {
  if (total <= 0) return 0
  return (count / total) * 100
}

export function addLogEntry(logs, entry, maxEntries = MAX_LOG_ENTRIES) {
  if (!Array.isArray(logs)) {
    logs = []
  }

  const newEntry = {
    id: generateId(),
    timestamp: Date.now(),
    ...entry,
  }

  const newLogs = [newEntry, ...logs]

  if (newLogs.length > maxEntries) {
    return {
      logs: newLogs.slice(0, maxEntries),
      evicted: newLogs.length - maxEntries,
    }
  }

  return {
    logs: newLogs,
    evicted: 0,
  }
}

export function filterLogsByKeyword(logs, keyword) {
  if (!Array.isArray(logs)) return []
  if (!keyword || !keyword.trim()) return logs

  const kw = keyword.trim().toLowerCase()

  return logs.filter((log) => {
    const searchText = [log.keyName, log.keyCode, log.eventType, formatTimestamp(log.timestamp)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return searchText.includes(kw)
  })
}

export function exportLogsToCsv(logs) {
  if (!Array.isArray(logs) || logs.length === 0) {
    return { success: false, error: '没有数据可导出' }
  }

  const headers = ['序号', '时间', '键名', '键码', '事件类型']
  const rows = logs.map((log, index) => [
    index + 1,
    formatTimestamp(log.timestamp),
    log.keyName || '',
    log.keyCode || '',
    log.eventType || '',
  ])

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')

  return { success: true, content: '\uFEFF' + csvContent }
}

export function downloadCsvFile(csvContent, filename = 'key-logs.csv') {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false
  }

  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
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

export function loadLogsFromStorage() {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY_LOGS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveLogsToStorage(logs) {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs))
    return true
  } catch {
    return false
  }
}

export function loadFrequencyFromStorage() {
  try {
    if (typeof localStorage === 'undefined') return {}
    const raw = localStorage.getItem(STORAGE_KEY_FREQUENCY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed
  } catch {
    return {}
  }
}

export function saveFrequencyToStorage(frequency) {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem(STORAGE_KEY_FREQUENCY, JSON.stringify(frequency))
    return true
  } catch {
    return false
  }
}

export function loadLayoutFromStorage() {
  try {
    if (typeof localStorage === 'undefined') return 'qwerty'
    const raw = localStorage.getItem(STORAGE_KEY_LAYOUT)
    if (!raw) return 'qwerty'
    if (KEYBOARD_LAYOUTS[raw]) return raw
    return 'qwerty'
  } catch {
    return 'qwerty'
  }
}

export function saveLayoutToStorage(layout) {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem(STORAGE_KEY_LAYOUT, layout)
    return true
  } catch {
    return false
  }
}

export function incrementFrequency(frequency, keyCode) {
  const newFrequency = { ...frequency }
  newFrequency[keyCode] = (newFrequency[keyCode] || 0) + 1
  return newFrequency
}

export function getMaxFrequency(frequency) {
  if (!frequency || typeof frequency !== 'object') return 0
  const values = Object.values(frequency)
  if (values.length === 0) return 0
  return Math.max(...values)
}

export function getTotalKeyPresses(frequency) {
  if (!frequency || typeof frequency !== 'object') return 0
  return Object.values(frequency).reduce((sum, count) => sum + count, 0)
}

export function getAllKeyCodesFromLayout(layoutName) {
  const layout = KEYBOARD_LAYOUTS[layoutName]
  if (!layout) return []

  const keyCodes = []
  for (const row of layout.rows) {
    for (const key of row) {
      keyCodes.push(key.code)
    }
  }
  return keyCodes
}

export function getKeyByCode(layoutName, code) {
  const layout = KEYBOARD_LAYOUTS[layoutName]
  if (!layout) return null

  for (const row of layout.rows) {
    for (const key of row) {
      if (key.code === code) {
        return { ...key }
      }
    }
  }
  return null
}

export function renumberLogs(logs) {
  if (!Array.isArray(logs)) return []
  return logs.map((log, index) => ({
    ...log,
    sequence: index + 1,
  }))
}
