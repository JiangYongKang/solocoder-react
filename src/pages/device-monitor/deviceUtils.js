import {
    ACCESS_STATE_LABELS,
    ALERT_CONDITIONS,
    ALERT_CONDITION_LABELS,
    ALERT_LEVELS,
    ALERT_LEVEL_COLORS,
    ALERT_LEVEL_LABELS,
    ALERT_RECORD_STORAGE_KEY,
    ALERT_RULE_STORAGE_KEY,
    ALERT_STATUS,
    CAMERA_STATUS_LABELS,
    DATA_POINT_COUNT,
    DEFAULT_METRIC_RANGES,
    DEVICE_METRIC_MAP,
    DEVICE_STATUS,
    DEVICE_STORAGE_KEY,
    DEVICE_TYPES,
    DEVICE_TYPE_LABELS,
    FIRMWARE_VERSIONS,
    LOCATIONS,
    METRIC_LABELS,
    METRIC_TYPES,
    METRIC_UNITS
} from './constants.js'

export function generateDeviceId() {
  return 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function generateAlertId() {
  return 'alert_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function generateRuleId() {
  return 'rule_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function generateMACAddress() {
  const hex = '0123456789ABCDEF'
  const parts = []
  for (let i = 0; i < 6; i++) {
    parts.push(hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)])
  }
  return parts.join(':')
}

export function randomInRange(min, max) {
  return min + Math.random() * (max - min)
}

export function randomInt(min, max) {
  return Math.floor(randomInRange(min, max + 1))
}

export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateInitialDataPoints(metricType, count = DATA_POINT_COUNT) {
  const range = DEFAULT_METRIC_RANGES[metricType] || { min: 0, max: 100 }
  const points = []
  const now = Date.now()
  let baseValue = randomInRange(range.min + (range.max - range.min) * 0.3, range.min + (range.max - range.min) * 0.7)

  for (let i = count - 1; i >= 0; i--) {
    const fluctuation = (range.max - range.min) * 0.05
    baseValue += randomInRange(-fluctuation, fluctuation)
    baseValue = Math.max(range.min, Math.min(range.max, baseValue))

    let value = baseValue
    if (metricType === METRIC_TYPES.ACCESS_STATE || metricType === METRIC_TYPES.CAMERA_STATUS) {
      value = Math.random() < 0.8 ? (range.min) : (range.max)
    }

    points.push({
      timestamp: now - i * 3000,
      value: Number(value.toFixed(2)),
    })
  }
  return points
}

export function generateMockDevices(count = 20) {
  const deviceTypes = Object.values(DEVICE_TYPES)
  const devices = []
  const typeCounts = {}
  deviceTypes.forEach((t) => {
    typeCounts[t] = 0
  })

  for (let i = 0; i < count; i++) {
    const type = deviceTypes[i % deviceTypes.length]
    typeCounts[type] += 1
    const metricType = DEVICE_METRIC_MAP[type]
    const range = DEFAULT_METRIC_RANGES[metricType] || { min: 0, max: 100 }
    const initialValue = randomInRange(range.min + (range.max - range.min) * 0.2, range.min + (range.max - range.min) * 0.8)

    const device = {
      id: generateDeviceId(),
      name: `${DEVICE_TYPE_LABELS[type]}${String(typeCounts[type]).padStart(3, '0')}`,
      type,
      mac: generateMACAddress(),
      location: randomChoice(LOCATIONS),
      firmwareVersion: randomChoice(FIRMWARE_VERSIONS[type]),
      status: DEVICE_STATUS.ONLINE,
      lastOnline: Date.now(),
      currentValue: Number(initialValue.toFixed(2)),
      metricType,
      dataPoints: generateInitialDataPoints(metricType),
      statusChangeAt: null,
      isAlerting: false,
    }
    devices.push(device)
  }
  return devices
}

export function loadDevices() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return generateMockDevices(20)
    }
    const raw = window.localStorage.getItem(DEVICE_STORAGE_KEY)
    if (!raw) {
      const devices = generateMockDevices(20)
      saveDevices(devices)
      return devices
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      const devices = generateMockDevices(20)
      saveDevices(devices)
      return devices
    }
    return parsed
  } catch {
    return generateMockDevices(20)
  }
}

export function saveDevices(devices) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    window.localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(devices))
    return true
  } catch {
    return false
  }
}

export function loadAlertRules() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return []
    const raw = window.localStorage.getItem(ALERT_RULE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveAlertRules(rules) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    window.localStorage.setItem(ALERT_RULE_STORAGE_KEY, JSON.stringify(rules))
    return true
  } catch {
    return false
  }
}

export function loadAlertRecords() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return []
    const raw = window.localStorage.getItem(ALERT_RECORD_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveAlertRecords(records) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    window.localStorage.setItem(ALERT_RECORD_STORAGE_KEY, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}

export function getDeviceStatistics(devices) {
  if (!Array.isArray(devices)) {
    return { total: 0, online: 0, offline: 0, alert: 0 }
  }
  const stats = { total: devices.length, online: 0, offline: 0, alert: 0 }
  devices.forEach((d) => {
    if (d.isAlerting || d.status === DEVICE_STATUS.ALERT) {
      stats.alert += 1
    } else if (d.status === DEVICE_STATUS.ONLINE) {
      stats.online += 1
    } else {
      stats.offline += 1
    }
  })
  return stats
}

export function groupDevicesByType(devices) {
  const groups = {}
  const deviceTypes = Object.values(DEVICE_TYPES)
  deviceTypes.forEach((t) => {
    groups[t] = []
  })
  if (!Array.isArray(devices)) return groups
  devices.forEach((d) => {
    if (groups[d.type]) {
      groups[d.type].push(d)
    }
  })
  return groups
}

export function getGroupStatistics(groupDevices) {
  if (!Array.isArray(groupDevices)) {
    return { total: 0, online: 0, offline: 0, alert: 0 }
  }
  const stats = { total: groupDevices.length, online: 0, offline: 0, alert: 0 }
  groupDevices.forEach((d) => {
    if (d.isAlerting || d.status === DEVICE_STATUS.ALERT) {
      stats.alert += 1
    } else if (d.status === DEVICE_STATUS.ONLINE) {
      stats.online += 1
    } else {
      stats.offline += 1
    }
  })
  return stats
}

export function filterDevicesBySearch(devices, keyword) {
  if (!Array.isArray(devices)) return []
  if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') return devices
  const kw = keyword.trim().toLowerCase()
  return devices.filter((d) => {
    return (
      (d.name && d.name.toLowerCase().includes(kw)) ||
      (d.id && d.id.toLowerCase().includes(kw))
    )
  })
}

export function generateNextDataPoint(device) {
  if (!device) return null
  const metricType = device.metricType
  const range = DEFAULT_METRIC_RANGES[metricType] || { min: 0, max: 100 }
  const rangeSpan = range.max - range.min
  const lastValue = device.currentValue ?? (range.min + range.max) / 2

  if (metricType === METRIC_TYPES.ACCESS_STATE || metricType === METRIC_TYPES.CAMERA_STATUS) {
    const newValue = Math.random() < 0.9 ? lastValue : (lastValue === range.min ? range.max : range.min)
    const point = { timestamp: Date.now(), value: Number(newValue.toFixed(2)) }
    const dataPoints = [...(device.dataPoints || []), point]
    if (dataPoints.length > DATA_POINT_COUNT) {
      dataPoints.splice(0, dataPoints.length - DATA_POINT_COUNT)
    }
    return {
      ...device,
      currentValue: point.value,
      dataPoints,
      lastOnline: device.status === DEVICE_STATUS.ONLINE ? Date.now() : device.lastOnline,
    }
  }

  const prevTrend = typeof device.trend === 'number' ? device.trend : 0
  const trendStep = rangeSpan * 0.008
  let trend = prevTrend + randomInRange(-trendStep, trendStep)
  const maxTrend = rangeSpan * 0.03
  trend = Math.max(-maxTrend, Math.min(maxTrend, trend))

  const mid = (range.min + range.max) / 2
  const drift = -(lastValue - mid) * 0.015

  const noise = randomInRange(-rangeSpan * 0.015, rangeSpan * 0.015)

  let newValue = lastValue + trend + drift + noise
  newValue = Math.max(range.min, Math.min(range.max, newValue))

  if (newValue >= range.max - rangeSpan * 0.02) trend = -Math.abs(trend) * 0.5
  if (newValue <= range.min + rangeSpan * 0.02) trend = Math.abs(trend) * 0.5

  const point = {
    timestamp: Date.now(),
    value: Number(newValue.toFixed(2)),
  }

  const dataPoints = [...(device.dataPoints || []), point]
  if (dataPoints.length > DATA_POINT_COUNT) {
    dataPoints.splice(0, dataPoints.length - DATA_POINT_COUNT)
  }

  return {
    ...device,
    currentValue: point.value,
    trend,
    dataPoints,
    lastOnline: device.status === DEVICE_STATUS.ONLINE ? Date.now() : device.lastOnline,
  }
}

export function updateRandomDeviceStatuses(devices, options = {}) {
  if (!Array.isArray(devices) || devices.length === 0) return devices

  const { minOffline = 1, maxOffline = 2 } = options
  const result = devices.map((d) => ({ ...d }))

  const onlineIndices = []
  const offlineIndices = []
  result.forEach((d, i) => {
    if (d.status === DEVICE_STATUS.ONLINE) onlineIndices.push(i)
    else if (d.status === DEVICE_STATUS.OFFLINE) offlineIndices.push(i)
  })

  let switchedCount = 0

  const offlineCount = Math.min(randomInt(minOffline, maxOffline), onlineIndices.length)
  for (let i = 0; i < offlineCount; i++) {
    if (onlineIndices.length === 0) break
    const randIdx = randomInt(0, onlineIndices.length - 1)
    const deviceIdx = onlineIndices[randIdx]
    result[deviceIdx].status = DEVICE_STATUS.OFFLINE
    result[deviceIdx].statusChangeAt = Date.now()
    onlineIndices.splice(randIdx, 1)
    switchedCount++
  }

  offlineIndices.forEach((idx) => {
    if (Math.random() < 0.3) {
      result[idx].status = DEVICE_STATUS.ONLINE
      result[idx].statusChangeAt = Date.now()
      result[idx].lastOnline = Date.now()
      switchedCount++
    }
  })

  if (switchedCount === 0) {
    if (onlineIndices.length > 0) {
      const randIdx = randomInt(0, onlineIndices.length - 1)
      const deviceIdx = onlineIndices[randIdx]
      result[deviceIdx].status = DEVICE_STATUS.OFFLINE
      result[deviceIdx].statusChangeAt = Date.now()
    } else if (offlineIndices.length > 0) {
      const randIdx = randomInt(0, offlineIndices.length - 1)
      const deviceIdx = offlineIndices[randIdx]
      result[deviceIdx].status = DEVICE_STATUS.ONLINE
      result[deviceIdx].statusChangeAt = Date.now()
      result[deviceIdx].lastOnline = Date.now()
    }
  }

  return result
}

export function formatMetricValue(metricType, value) {
  if (value === null || value === undefined || isNaN(value)) return '-'
  const unit = METRIC_UNITS[metricType] || ''
  if (metricType === METRIC_TYPES.ACCESS_STATE) {
    const label = ACCESS_STATE_LABELS[Number(value)]
    return label ?? String(value)
  }
  if (metricType === METRIC_TYPES.CAMERA_STATUS) {
    const label = CAMERA_STATUS_LABELS[Number(value)]
    return label ?? String(value)
  }
  if (typeof value === 'number') {
    return `${value.toFixed(2)}${unit}`
  }
  return `${value}${unit}`
}

export function formatDateTime(timestamp) {
  if (timestamp === null || timestamp === undefined) return '-'
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return '-'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${mi}:${s}`
}

export function formatTimeOnly(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ''
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${h}:${mi}:${s}`
}

export function checkAlertCondition(rule, value) {
  if (!rule || value === null || value === undefined) return false
  const condition = rule.condition
  const threshold = Number(rule.threshold)
  if (isNaN(threshold)) return false
  const numValue = Number(value)
  if (isNaN(numValue)) return false

  switch (condition) {
    case ALERT_CONDITIONS.GREATER_THAN:
      return numValue > threshold
    case ALERT_CONDITIONS.LESS_THAN:
      return numValue < threshold
    case ALERT_CONDITIONS.EQUAL:
      return numValue === threshold
    default:
      return false
  }
}

export function getApplicableRules(rules, device) {
  if (!Array.isArray(rules) || !device) return []
  return rules.filter((r) => {
    if (!r.enabled) return false
    if (r.deviceType && r.deviceType !== device.type) return false
    if (r.metricType && r.metricType !== device.metricType) return false
    return true
  })
}

export function evaluateDeviceAlerts(device, rules) {
  if (!device || !Array.isArray(rules)) {
    return { isAlerting: false, triggeredRules: [], alertLevel: null }
  }
  const currentValue = device.currentValue
  if (currentValue === null || currentValue === undefined || isNaN(Number(currentValue))) {
    return { isAlerting: false, triggeredRules: [], alertLevel: null }
  }
  const applicable = getApplicableRules(rules, device)
  const triggered = []
  let maxLevel = null
  const levelOrder = { [ALERT_LEVELS.INFO]: 1, [ALERT_LEVELS.WARNING]: 2, [ALERT_LEVELS.CRITICAL]: 3 }

  applicable.forEach((rule) => {
    if (checkAlertCondition(rule, currentValue)) {
      triggered.push(rule)
      const level = levelOrder[rule.level] || 0
      const currentMax = maxLevel ? levelOrder[maxLevel] : 0
      if (level > currentMax) {
        maxLevel = rule.level
      }
    }
  })

  return {
    isAlerting: triggered.length > 0,
    triggeredRules: triggered,
    alertLevel: maxLevel,
  }
}

export function createAlertRecord(device, rule, value) {
  return {
    id: generateAlertId(),
    deviceId: device.id,
    deviceName: device.name,
    deviceType: device.type,
    ruleId: rule.id,
    metricType: rule.metricType || device.metricType,
    value,
    threshold: rule.threshold,
    condition: rule.condition,
    level: rule.level,
    message: buildAlertMessage(device, rule, value),
    status: ALERT_STATUS.PENDING,
    triggeredAt: Date.now(),
    resolvedAt: null,
    confirmedAt: null,
    duration: 0,
  }
}

export function buildAlertMessage(device, rule, value) {
  const deviceName = device?.name || '未知设备'
  const metricLabel = METRIC_LABELS[rule.metricType] || '指标'
  const conditionLabel = ALERT_CONDITION_LABELS[rule.condition] || ''
  const unit = METRIC_UNITS[rule.metricType] || ''
  const levelLabel = ALERT_LEVEL_LABELS[rule.level] || ''
  return `${deviceName} ${metricLabel} ${conditionLabel} ${rule.threshold}${unit}，当前值: ${value}${unit}（${levelLabel}）`
}

export function validateAlertRule(data) {
  const errors = {}
  if (!data.deviceType || !Object.values(DEVICE_TYPES).includes(data.deviceType)) {
    errors.deviceType = '请选择有效的设备类型'
  }
  if (!data.metricType || !Object.values(METRIC_TYPES).includes(data.metricType)) {
    errors.metricType = '请选择有效的监控指标'
  }
  if (!data.condition || !Object.values(ALERT_CONDITIONS).includes(data.condition)) {
    errors.condition = '请选择有效的告警条件'
  }
  if (!data.level || !Object.values(ALERT_LEVELS).includes(data.level)) {
    errors.level = '请选择有效的告警级别'
  }
  const threshold = Number(data.threshold)
  if (data.threshold === undefined || data.threshold === null || data.threshold === '' || isNaN(threshold)) {
    errors.threshold = '请输入有效的阈值'
  }
  return errors
}

export function addAlertRule(rules, data) {
  const errors = validateAlertRule(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const newRule = {
    id: generateRuleId(),
    deviceType: data.deviceType,
    metricType: data.metricType,
    condition: data.condition,
    threshold: Number(data.threshold),
    level: data.level,
    enabled: true,
    createdAt: Date.now(),
  }
  return {
    success: true,
    rule: newRule,
    rules: [...(Array.isArray(rules) ? rules : []), newRule],
  }
}

export function deleteAlertRule(rules, ruleId) {
  if (!Array.isArray(rules)) return { success: false, rules: [] }
  const exists = rules.some((r) => r.id === ruleId)
  if (!exists) return { success: false, rules }
  return {
    success: true,
    rules: rules.filter((r) => r.id !== ruleId),
  }
}

export function toggleAlertRule(rules, ruleId) {
  if (!Array.isArray(rules)) return { success: false, rules: [] }
  const updated = rules.map((r) => {
    if (r.id === ruleId) {
      return { ...r, enabled: !r.enabled }
    }
    return r
  })
  const changed = updated.some((r, i) => r.enabled !== rules[i].enabled)
  if (!changed) return { success: false, rules }
  return { success: true, rules: updated }
}

export function getRuleSummary(rule) {
  if (!rule) return ''
  const typeLabel = DEVICE_TYPE_LABELS[rule.deviceType] || '未知类型'
  const metricLabel = METRIC_LABELS[rule.metricType] || '未知指标'
  const conditionLabel = ALERT_CONDITION_LABELS[rule.condition] || ''
  const unit = METRIC_UNITS[rule.metricType] || ''
  const levelLabel = ALERT_LEVEL_LABELS[rule.level] || ''
  return `${typeLabel} ${metricLabel} ${conditionLabel} ${rule.threshold}${unit} ${levelLabel}`
}

export function filterAlertRecords(records, filters = {}) {
  if (!Array.isArray(records)) return []
  return records.filter((r) => {
    if (filters.level && filters.level !== 'all' && r.level !== filters.level) {
      return false
    }
    if (filters.status && filters.status !== 'all' && r.status !== filters.status) {
      return false
    }
    if (filters.startTime) {
      const start = new Date(filters.startTime).getTime()
      if (r.triggeredAt < start) return false
    }
    if (filters.endTime) {
      const end = new Date(filters.endTime).getTime() + 86400000
      if (r.triggeredAt > end) return false
    }
    if (filters.keyword && typeof filters.keyword === 'string' && filters.keyword.trim() !== '') {
      const kw = filters.keyword.trim().toLowerCase()
      const matchDevice = (r.deviceName && r.deviceName.toLowerCase().includes(kw)) ||
        (r.deviceId && r.deviceId.toLowerCase().includes(kw))
      const matchMessage = r.message && r.message.toLowerCase().includes(kw)
      if (!matchDevice && !matchMessage) return false
    }
    return true
  })
}

export function sortAlertRecords(records, sortBy = 'triggeredAt', sortOrder = 'desc') {
  if (!Array.isArray(records)) return []
  const order = sortOrder === 'asc' ? 1 : -1
  return [...records].sort((a, b) => {
    const va = a[sortBy]
    const vb = b[sortBy]
    if (va === vb) return 0
    return (va > vb ? 1 : -1) * order
  })
}

export function confirmAlertRecords(records, ids) {
  if (!Array.isArray(records) || !Array.isArray(ids) || ids.length === 0) {
    return { success: false, records }
  }
  const idSet = new Set(ids)
  const now = Date.now()
  const updated = records.map((r) => {
    if (idSet.has(r.id) && r.status === ALERT_STATUS.PENDING) {
      return { ...r, status: ALERT_STATUS.CONFIRMED, confirmedAt: now }
    }
    return r
  })
  return { success: true, records: updated }
}

export function resolveAlertRecords(records, ids) {
  if (!Array.isArray(records) || !Array.isArray(ids) || ids.length === 0) {
    return { success: false, records }
  }
  const idSet = new Set(ids)
  const now = Date.now()
  const updated = records.map((r) => {
    if (idSet.has(r.id) && r.status !== ALERT_STATUS.RESOLVED) {
      const duration = r.triggeredAt ? Math.floor((now - r.triggeredAt) / 1000) : 0
      return { ...r, status: ALERT_STATUS.RESOLVED, resolvedAt: now, duration }
    }
    return r
  })
  return { success: true, records: updated }
}

export function getAlertLevelColor(level) {
  return ALERT_LEVEL_COLORS[level] || '#999'
}

export function isNumericMetric(metricType) {
  return (
    metricType === METRIC_TYPES.TEMPERATURE ||
    metricType === METRIC_TYPES.HUMIDITY ||
    metricType === METRIC_TYPES.NETWORK_QUALITY
  )
}

export function isValueNormal(device) {
  if (!device) return true
  const metricType = device.metricType
  const range = DEFAULT_METRIC_RANGES[metricType]
  if (!range) return true
  const value = Number(device.currentValue)
  if (isNaN(value)) return true
  const lowThreshold = range.min + (range.max - range.min) * 0.1
  const highThreshold = range.max - (range.max - range.min) * 0.1
  return value >= lowThreshold && value <= highThreshold
}
