import {
  METRIC_TYPES,
  METRIC_LABELS,
  METRIC_UNITS,
  METRIC_RANGES,
  FPS_COLOR_ZONES,
  ALERT_CONDITIONS,
  ALERT_CONDITION_LABELS,
  ALERT_STATUS,
  WATERFALL_PHASES,
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_COLORS,
  SIMULATION_RANGES,
  SMOOTHING_FACTOR,
  MAX_ALERT_HISTORY,
  WATERFALL_PHASE_TIME_RANGES,
} from './constants'

let _idCounter = 0

export function generateId(prefix = 'id') {
  _idCounter += 1
  return `${prefix}_${Date.now().toString(36)}_${_idCounter.toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function randomInRange(min, max) {
  if (min > max) [min, max] = [max, min]
  return Math.random() * (max - min) + min
}

export function randomInt(min, max) {
  return Math.floor(randomInRange(min, max + 1))
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function smoothValue(currentValue, targetValue, factor = SMOOTHING_FACTOR) {
  if (typeof currentValue !== 'number' || isNaN(currentValue)) return targetValue
  if (typeof targetValue !== 'number' || isNaN(targetValue)) return currentValue
  const diff = targetValue - currentValue
  return currentValue + diff * factor
}

export function generateSimulatedTargetValue(metricType) {
  const range = SIMULATION_RANGES[metricType]
  if (!range) return 0
  const { min, max, baseline, volatility } = range
  const trend = (Math.random() - 0.5) * volatility
  const target = baseline + trend
  return clamp(target, min, max)
}

export function getFpsStatus(fps) {
  for (let i = FPS_COLOR_ZONES.length - 1; i >= 0; i--) {
    const zone = FPS_COLOR_ZONES[i]
    if (fps >= zone.from) return zone
  }
  return FPS_COLOR_ZONES[0]
}

export function checkAlertCondition(rule, value) {
  if (!rule || typeof rule === 'object' && rule === null) return false
  if (typeof value !== 'number' || isNaN(value)) return false

  const { condition, threshold } = rule
  const thresh = Number(threshold)
  if (isNaN(thresh)) return false

  switch (condition) {
    case ALERT_CONDITIONS.LESS_THAN:
      return value < thresh
    case ALERT_CONDITIONS.GREATER_THAN:
      return value > thresh
    default:
      return false
  }
}

export function evaluateAlerts(currentMetrics, alertRules) {
  if (!Array.isArray(alertRules)) return { isAlerting: false, triggeredRules: [] }

  const triggeredRules = []
  const enabledRules = alertRules.filter((r) => r && r.enabled)

  for (const rule of enabledRules) {
    const value = currentMetrics[rule.metricType]
    if (checkAlertCondition(rule, value)) {
      triggeredRules.push(rule)
    }
  }

  return {
    isAlerting: triggeredRules.length > 0,
    triggeredRules,
  }
}

export function getRuleDescription(rule) {
  if (!rule) return ''
  const metricLabel = METRIC_LABELS[rule.metricType] || rule.metricType
  const conditionLabel = ALERT_CONDITION_LABELS[rule.condition] || rule.condition
  const unit = METRIC_UNITS[rule.metricType] || ''
  return `${metricLabel} ${conditionLabel} ${rule.threshold}${unit}`
}

export function addAlertRule(rules, ruleData) {
  if (!Array.isArray(rules)) rules = []

  const errors = validateAlertRule(ruleData)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  const newRule = {
    id: generateId('rule'),
    metricType: ruleData.metricType,
    condition: ruleData.condition,
    threshold: Number(ruleData.threshold),
    enabled: true,
    lastTriggeredAt: null,
    createdAt: Date.now(),
  }

  return { success: true, rules: [...rules, newRule], rule: newRule }
}

export function validateAlertRule(data) {
  const errors = {}
  if (!data) return { data: '规则数据不能为空' }

  if (!data.metricType || !Object.values(METRIC_TYPES).includes(data.metricType)) {
    errors.metricType = '请选择有效的指标类型'
  }

  if (!data.condition || !Object.values(ALERT_CONDITIONS).includes(data.condition)) {
    errors.condition = '请选择有效的条件'
  }

  const threshold = Number(data.threshold)
  if (data.threshold === '' || data.threshold === null || data.threshold === undefined) {
    errors.threshold = '阈值不能为空'
  } else if (isNaN(threshold)) {
    errors.threshold = '阈值必须是有效的数字'
  } else {
    const range = METRIC_RANGES[data.metricType]
    if (range) {
      if (threshold < range.min || threshold > range.max) {
        errors.threshold = `阈值应在 ${range.min} 到 ${range.max} 之间`
      }
    }
  }

  return errors
}

export function toggleAlertRule(rules, ruleId) {
  if (!Array.isArray(rules)) return { success: false, rules: rules || [] }

  const idx = rules.findIndex((r) => r.id === ruleId)
  if (idx === -1) return { success: false, rules }

  const newRules = [...rules]
  newRules[idx] = { ...newRules[idx], enabled: !newRules[idx].enabled }
  return { success: true, rules: newRules }
}

export function deleteAlertRule(rules, ruleId) {
  if (!Array.isArray(rules)) return { success: false, rules: rules || [] }

  const idx = rules.findIndex((r) => r.id === ruleId)
  if (idx === -1) return { success: false, rules }

  return { success: true, rules: rules.filter((r) => r.id !== ruleId) }
}

export function updateRuleLastTriggered(rules, ruleIds, timestamp) {
  if (!Array.isArray(rules)) return rules
  const ts = timestamp || Date.now()
  return rules.map((r) =>
    ruleIds.includes(r.id) ? { ...r, lastTriggeredAt: ts } : r
  )
}

export function createAlertRecord(rule, value, timestamp) {
  const ts = timestamp || Date.now()
  const metricUnit = METRIC_UNITS[rule.metricType] || ''
  const triggerInfo = `${METRIC_LABELS[rule.metricType] || rule.metricType}=${Number(value).toFixed(1)}${metricUnit} ${ALERT_CONDITION_LABELS[rule.condition] || rule.condition} 阈值 ${rule.threshold}${metricUnit}`

  return {
    id: generateId('alert'),
    ruleId: rule.id,
    ruleDescription: getRuleDescription(rule),
    metricType: rule.metricType,
    value: Number(value),
    threshold: Number(rule.threshold),
    condition: rule.condition,
    triggerInfo,
    triggeredAt: ts,
    resolvedAt: null,
    duration: null,
    status: ALERT_STATUS.PENDING,
    confirmedAt: null,
  }
}

export function addAlertRecord(records, record) {
  if (!Array.isArray(records)) records = []
  const newRecords = [record, ...records]
  if (newRecords.length > MAX_ALERT_HISTORY) {
    return newRecords.slice(0, MAX_ALERT_HISTORY)
  }
  return newRecords
}

export function confirmAlertRecord(records, recordId) {
  if (!Array.isArray(records)) return { success: false, records: records || [] }

  const idx = records.findIndex((r) => r.id === recordId)
  if (idx === -1) return { success: false, records }
  if (records[idx].status === ALERT_STATUS.CONFIRMED) return { success: true, records }

  const newRecords = [...records]
  newRecords[idx] = {
    ...newRecords[idx],
    status: ALERT_STATUS.CONFIRMED,
    confirmedAt: Date.now(),
  }
  return { success: true, records: newRecords }
}

export function confirmAllAlertRecords(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return { success: false, records: records || [] }
  }

  const now = Date.now()
  const newRecords = records.map((r) =>
    r.status === ALERT_STATUS.PENDING
      ? { ...r, status: ALERT_STATUS.CONFIRMED, confirmedAt: now }
      : r
  )
  const changed = newRecords.some((r, i) => r.status !== records[i].status)
  return { success: changed, records: newRecords }
}

export function sortAlertRecords(records, sortBy = 'triggeredAt', order = 'desc') {
  if (!Array.isArray(records) || records.length === 0) return records || []

  return [...records].sort((a, b) => {
    let va = a[sortBy]
    let vb = b[sortBy]

    if (va === null || va === undefined) va = -Infinity
    if (vb === null || vb === undefined) vb = -Infinity

    if (typeof va === 'string') {
      return order === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    }

    return order === 'asc' ? va - vb : vb - va
  })
}

export function exportAlertRecordsToCsv(records) {
  if (!Array.isArray(records) || records.length === 0) return ''

  const headers = [
    '触发时间',
    '规则描述',
    '指标类型',
    '触发值',
    '阈值',
    '条件',
    '状态',
    '确认时间',
  ]

  const statusMap = {
    [ALERT_STATUS.PENDING]: '待确认',
    [ALERT_STATUS.CONFIRMED]: '已确认',
  }

  const conditionMap = {
    [ALERT_CONDITIONS.LESS_THAN]: '低于',
    [ALERT_CONDITIONS.GREATER_THAN]: '高于',
  }

  const rows = records.map((r) => [
    formatDateTime(r.triggeredAt),
    r.ruleDescription,
    METRIC_LABELS[r.metricType] || r.metricType,
    `${Number(r.value).toFixed(1)}${METRIC_UNITS[r.metricType] || ''}`,
    `${r.threshold}${METRIC_UNITS[r.metricType] || ''}`,
    conditionMap[r.condition] || r.condition,
    statusMap[r.status] || r.status,
    r.confirmedAt ? formatDateTime(r.confirmedAt) : '',
  ])

  const escapeCsv = (val) => {
    const str = String(val ?? '')
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
}

export function downloadCsv(csvContent, filename) {
  if (!csvContent) return
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function generateWaterfallData() {
  const phases = []
  let currentStart = 0

  const phaseData = WATERFALL_PHASES.map((phase) => {
    const timeRange = WATERFALL_PHASE_TIME_RANGES[phase.key]
    const duration = timeRange ? randomInRange(timeRange.min, timeRange.max) : randomInRange(10, 100)
    return { phase, duration }
  })

  for (let i = 0; i < phaseData.length; i++) {
    const { phase, duration } = phaseData[i]
    let start = currentStart

    if (phase.key === 'resource') {
      const prevPhase = phases.find((p) => p.key === 'dom')
      if (prevPhase) {
        start = prevPhase.start + prevPhase.duration * 0.3
      }
    } else if (phase.key === 'fp') {
      const ttfbPhase = phases.find((p) => p.key === 'ttfb')
      const downloadPhase = phases.find((p) => p.key === 'download')
      if (ttfbPhase && downloadPhase) {
        start = ttfbPhase.start + randomInRange(ttfbPhase.duration * 0.5, ttfbPhase.duration + downloadPhase.duration * 0.5)
      }
    } else if (phase.key === 'fcp') {
      const fpPhase = phases.find((p) => p.key === 'fp')
      if (fpPhase) {
        start = fpPhase.start + randomInRange(fpPhase.duration * 0.5, fpPhase.duration + 50)
      }
    } else {
      if (i > 0) {
        const prev = phases[i - 1]
        if (phase.key === 'dom') {
          start = prev.start + prev.duration * 0.8
        } else {
          start = prev.start + prev.duration
        }
      }
    }

    phases.push({
      key: phase.key,
      name: phase.name,
      color: phase.color,
      start: Math.round(start),
      duration: Math.round(duration),
    })

    currentStart = Math.max(currentStart, start + duration)
  }

  const totalTime = Math.round(phases.reduce((max, p) => Math.max(max, p.start + p.duration), 0))

  return {
    phases,
    totalTime,
  }
}

export function sortWaterfallPhases(phases) {
  if (!Array.isArray(phases)) return []
  return [...phases].sort((a, b) => a.start - b.start)
}

export function generateMockResourceList() {
  const resources = []
  const mockResources = [
    { path: '/static/js/main.chunk.js', type: RESOURCE_TYPES.JS, sizeRange: [200, 800], timeRange: [50, 300] },
    { path: '/static/js/vendor.chunk.js', type: RESOURCE_TYPES.JS, sizeRange: [100, 400], timeRange: [30, 200] },
    { path: '/static/js/app.chunk.js', type: RESOURCE_TYPES.JS, sizeRange: [50, 200], timeRange: [20, 150] },
    { path: '/static/css/main.css', type: RESOURCE_TYPES.CSS, sizeRange: [30, 150], timeRange: [20, 100] },
    { path: '/static/css/vendor.css', type: RESOURCE_TYPES.CSS, sizeRange: [20, 80], timeRange: [15, 80] },
    { path: '/static/images/logo.png', type: RESOURCE_TYPES.IMAGE, sizeRange: [10, 100], timeRange: [30, 150] },
    { path: '/static/images/banner.jpg', type: RESOURCE_TYPES.IMAGE, sizeRange: [50, 300], timeRange: [50, 250] },
    { path: '/static/images/icon.svg', type: RESOURCE_TYPES.IMAGE, sizeRange: [1, 20], timeRange: [10, 50] },
    { path: '/static/images/avatar1.png', type: RESOURCE_TYPES.IMAGE, sizeRange: [10, 80], timeRange: [20, 100] },
    { path: '/static/images/avatar2.png', type: RESOURCE_TYPES.IMAGE, sizeRange: [10, 80], timeRange: [20, 100] },
    { path: '/static/fonts/roboto.woff2', type: RESOURCE_TYPES.FONT, sizeRange: [30, 100], timeRange: [30, 150] },
    { path: '/static/fonts/roboto-bold.woff2', type: RESOURCE_TYPES.FONT, sizeRange: [30, 100], timeRange: [30, 150] },
    { path: '/index.html', type: RESOURCE_TYPES.HTML, sizeRange: [5, 30], timeRange: [10, 80] },
    { path: '/api/config', type: RESOURCE_TYPES.OTHER, sizeRange: [1, 10], timeRange: [50, 300] },
    { path: '/api/user', type: RESOURCE_TYPES.OTHER, sizeRange: [2, 15], timeRange: [80, 400] },
  ]

  for (const mock of mockResources) {
    const [sizeMin, sizeMax] = mock.sizeRange
    const [timeMin, timeMax] = mock.timeRange
    resources.push({
      id: generateId('res'),
      path: mock.path,
      type: mock.type,
      size: Number(randomInRange(sizeMin, sizeMax).toFixed(1)),
      loadTime: Math.round(randomInRange(timeMin, timeMax)),
    })
  }

  return resources
}

export function aggregateResourceByType(resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return Object.values(RESOURCE_TYPES).map((type) => ({
      type,
      label: RESOURCE_TYPE_LABELS[type],
      color: RESOURCE_TYPE_COLORS[type],
      totalSize: 0,
      count: 0,
    }))
  }

  const aggregateMap = {}

  for (const type of Object.values(RESOURCE_TYPES)) {
    aggregateMap[type] = {
      type,
      label: RESOURCE_TYPE_LABELS[type],
      color: RESOURCE_TYPE_COLORS[type],
      totalSize: 0,
      count: 0,
    }
  }

  for (const resource of resources) {
    const type = resource.type || RESOURCE_TYPES.OTHER
    const entry = aggregateMap[type] || aggregateMap[RESOURCE_TYPES.OTHER]
    entry.totalSize += Number(resource.size) || 0
    entry.count += 1
  }

  const result = Object.values(aggregateMap)
  result.totalSize = result.reduce((sum, item) => sum + item.totalSize, 0)
  return result
}

export function formatFileSize(sizeKB) {
  const size = Number(sizeKB) || 0
  if (size >= 1024) {
    return `${(size / 1024).toFixed(2)} MB`
  }
  return `${size.toFixed(1)} KB`
}

export function sortResources(resources, sortBy = 'size', order = 'desc') {
  if (!Array.isArray(resources)) return []

  return [...resources].sort((a, b) => {
    const va = a[sortBy]
    const vb = b[sortBy]

    if (typeof va === 'string' && typeof vb === 'string') {
      return order === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    }

    return order === 'asc'
      ? (va || 0) - (vb || 0)
      : (vb || 0) - (va || 0)
  })
}

export function calculateTreemapLayout(items, width, height) {
  if (!Array.isArray(items) || items.length === 0 || width <= 0 || height <= 0) {
    return []
  }

  const validItems = items.filter((item) => item && item.totalSize > 0)
  if (validItems.length === 0) return []

  const totalSize = validItems.reduce((sum, item) => sum + item.totalSize, 0)
  if (totalSize <= 0) return []

  const padding = 4
  const innerW = width - padding * 2
  const innerH = height - padding * 2
  const availableArea = innerW * innerH

  const layouts = validItems.map((item, idx) => ({
    ...item,
    value: (item.totalSize / totalSize) * availableArea,
    _index: idx,
  }))

  const result = squarify(layouts, {
    x: padding,
    y: padding,
    width: innerW,
    height: innerH,
  })

  const maxX = width
  const maxY = height
  return result.map((item) => {
    const x = Math.min(Math.max(item.x, 0), maxX)
    const y = Math.min(Math.max(item.y, 0), maxY)
    let w = item.width
    let h = item.height
    if (x + w > maxX) w = Math.max(1, maxX - x)
    if (y + h > maxY) h = Math.max(1, maxY - y)
    return {
      ...item,
      x,
      y,
      width: w,
      height: h,
    }
  })
}

function squarify(items, rect) {
  if (items.length === 0) return []

  const result = []
  let remaining = [...items].sort((a, b) => b.value - a.value)
  let currentRect = { ...rect }

  while (remaining.length > 0) {
    const row = []
    let rowValue = 0
    let bestRatio = Infinity

    const isVertical = currentRect.height >= currentRect.width
    const side = isVertical ? currentRect.width : currentRect.height

    for (let i = 0; i < remaining.length; i++) {
      row.push(remaining[i])
      rowValue += remaining[i].value

      const side2 = rowValue / side
      const ratios = row.map((item) => {
        const r = item.value / side2
        return Math.max(r, 1 / r)
      })
      const maxRatio = Math.max(...ratios)

      if (maxRatio <= bestRatio) {
        bestRatio = maxRatio
      } else {
        row.pop()
        break
      }
    }

    const actualRowValue = row.reduce((s, item) => s + item.value, 0)
    const rowSize = isVertical
      ? actualRowValue / currentRect.width
      : actualRowValue / currentRect.height

    let position = isVertical ? currentRect.y : currentRect.x

    for (const item of row) {
      const itemSize = isVertical
        ? item.value / rowSize
        : item.value / rowSize

      let layout
      if (isVertical) {
        layout = {
          ...item,
          x: currentRect.x,
          y: position,
          width: rowSize,
          height: itemSize,
        }
      } else {
        layout = {
          ...item,
          x: position,
          y: currentRect.y,
          width: itemSize,
          height: rowSize,
        }
      }
      result.push(layout)
      position += itemSize
    }

    if (isVertical) {
      currentRect = {
        ...currentRect,
        x: currentRect.x + rowSize,
        width: currentRect.width - rowSize,
      }
    } else {
      currentRect = {
        ...currentRect,
        y: currentRect.y + rowSize,
        height: currentRect.height - rowSize,
      }
    }

    remaining = remaining.slice(row.length)
  }

  return result
}

export function formatDateTime(timestamp) {
  if (!timestamp || isNaN(timestamp)) return '-'
  const date = new Date(Number(timestamp))
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

export function formatTimeOnly(timestamp) {
  if (!timestamp || isNaN(timestamp)) return ''
  const date = new Date(Number(timestamp))
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${h}:${min}:${s}`
}

export function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return 0
  return Math.max(0, Number(endTime) - Number(startTime))
}

export function formatDuration(ms) {
  const duration = Number(ms) || 0
  if (duration < 1000) return `${duration}ms`
  const seconds = Math.floor(duration / 1000)
  const msRemain = duration % 1000
  if (seconds < 60) return `${seconds}s ${msRemain}ms`
  const minutes = Math.floor(seconds / 60)
  const secRemain = seconds % 60
  return `${minutes}m ${secRemain}s`
}
