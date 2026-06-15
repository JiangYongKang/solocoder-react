export const MOUSE_EVENT_TYPES = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'contextmenu']

export const MOUSE_EVENT_COLORS = {
  click: '#3498db',
  dblclick: '#9b59b6',
  mousedown: '#2ecc71',
  mouseup: '#e67e22',
  mousemove: '#95a5a6',
  contextmenu: '#e74c3c',
}

export const MOUSE_EVENT_LABELS = {
  click: 'click',
  dblclick: 'dblclick',
  mousedown: 'mousedown',
  mouseup: 'mouseup',
  mousemove: 'mousemove',
  contextmenu: 'contextmenu',
}

export const MOUSE_BUTTONS = {
  0: '左键',
  1: '中键',
  2: '右键',
}

export const MODIFIER_KEYS = ['ctrl', 'shift', 'alt', 'meta']

export const MODIFIER_KEY_LABELS = {
  ctrl: 'Ctrl',
  shift: 'Shift',
  alt: 'Alt',
  meta: 'Meta',
}

export const MODIFIER_KEY_COLORS = {
  ctrl: '#3498db',
  shift: '#e74c3c',
  alt: '#f39c12',
  meta: '#9b59b6',
}

export function generateId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatTimestamp(ts) {
  if (ts == null) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${ms}`
}

export function createKeyEventRecord(event, sequence) {
  return {
    id: generateId(),
    type: 'key',
    sequence,
    key: event.key || '',
    keyCode: event.keyCode || 0,
    code: event.code || '',
    ctrlKey: !!event.ctrlKey,
    shiftKey: !!event.shiftKey,
    altKey: !!event.altKey,
    metaKey: !!event.metaKey,
    repeat: !!event.repeat,
    timestamp: event.timestamp || Date.now(),
  }
}

export function createMouseEventRecord(event, sequence, offsetX, offsetY) {
  return {
    id: generateId(),
    type: 'mouse',
    sequence,
    eventType: event.type || '',
    button: event.button != null ? event.button : -1,
    buttons: event.buttons || 0,
    x: offsetX != null ? offsetX : (event.clientX || 0),
    y: offsetY != null ? offsetY : (event.clientY || 0),
    ctrlKey: !!event.ctrlKey,
    shiftKey: !!event.shiftKey,
    altKey: !!event.altKey,
    metaKey: !!event.metaKey,
    timestamp: event.timestamp || Date.now(),
  }
}

export function filterKeyEvents(events, { keyword = '', keyFilter = '', modifiers = [] } = {}) {
  if (!Array.isArray(events)) return []

  return events.filter((event) => {
    if (event.type !== 'key') return false

    if (keyFilter && event.key.toLowerCase() !== keyFilter.toLowerCase()) {
      return false
    }

    if (modifiers && modifiers.length > 0) {
      const hasAllModifiers = modifiers.every((mod) => {
        switch (mod) {
          case 'ctrl':
            return event.ctrlKey
          case 'shift':
            return event.shiftKey
          case 'alt':
            return event.altKey
          case 'meta':
            return event.metaKey
          default:
            return false
        }
      })
      if (!hasAllModifiers) return false
    }

    if (keyword) {
      const kw = keyword.toLowerCase()
      const searchText = [
        event.key,
        String(event.keyCode),
        event.code,
        formatTimestamp(event.timestamp),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!searchText.includes(kw)) return false
    }

    return true
  })
}

export function filterMouseEvents(events, { keyword = '', eventTypes = [] } = {}) {
  if (!Array.isArray(events)) return []

  return events.filter((event) => {
    if (event.type !== 'mouse') return false

    if (eventTypes && eventTypes.length > 0 && !eventTypes.includes(event.eventType)) {
      return false
    }

    if (keyword) {
      const kw = keyword.toLowerCase()
      const buttonLabel = MOUSE_BUTTONS[event.button] || ''
      const searchText = [
        event.eventType,
        `X:${event.x}`,
        `Y:${event.y}`,
        buttonLabel,
        formatTimestamp(event.timestamp),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!searchText.includes(kw)) return false
    }

    return true
  })
}

export function renumberEvents(events) {
  if (!Array.isArray(events)) return []
  return events.map((event, index) => ({
    ...event,
    sequence: index + 1,
  }))
}

export function calculateFrequency(events, windowSeconds = 30, now = Date.now()) {
  if (!Array.isArray(events) || events.length === 0) {
    return Array(windowSeconds).fill(0)
  }

  const result = Array(windowSeconds).fill(0)
  const startTime = now - windowSeconds * 1000

  for (const event of events) {
    const ts = event.timestamp || 0
    if (ts < startTime || ts > now) continue
    const bucketIndex = Math.floor((ts - startTime) / 1000)
    if (bucketIndex >= 0 && bucketIndex < windowSeconds) {
      result[bucketIndex]++
    }
  }

  return result
}

export function getMaxFrequency(frequencyData) {
  if (!Array.isArray(frequencyData) || frequencyData.length === 0) return 0
  const max = Math.max(...frequencyData)
  if (max === 0) return 10
  return Math.ceil(max / 10) * 10
}

export function exportToJson(events) {
  if (!Array.isArray(events)) return '[]'
  return JSON.stringify(
    events.map((e) => ({ ...e })),
    null,
    2
  )
}

export function downloadJsonFile(jsonContent, fileName) {
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function throttle(fn, delay) {
  let lastTime = 0
  let lastResult
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      lastResult = fn.apply(this, args)
    }
    return lastResult
  }
}

export function getMouseButtonLabel(button) {
  return MOUSE_BUTTONS[button] || '未知'
}

export function getActiveModifiers(event) {
  const modifiers = []
  if (event.ctrlKey) modifiers.push('ctrl')
  if (event.shiftKey) modifiers.push('shift')
  if (event.altKey) modifiers.push('alt')
  if (event.metaKey) modifiers.push('meta')
  return modifiers
}
