import {
  REGIONS,
  ALERT_LEVELS,
  ALERT_TITLES,
  ALERT_RESOURCES,
  HEALTH_WEIGHTS,
  MAX_ALERT_COUNT,
  MAX_TREND_POINTS,
  METRIC_TYPES,
} from './constants'

export function randomInRange(min, max) {
  return min + Math.random() * (max - min)
}

export function randomInt(min, max) {
  return Math.floor(randomInRange(min, max + 1))
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function calculateHealthScore(metrics) {
  if (!metrics || typeof metrics !== 'object') return 0
  const cpu = typeof metrics.cpu === 'number' ? metrics.cpu : 0
  const mem = typeof metrics.memory === 'number' ? metrics.memory : 0
  const disk = typeof metrics.disk === 'number' ? metrics.disk : 0
  const weightedUsage = cpu * HEALTH_WEIGHTS.cpu + mem * HEALTH_WEIGHTS.memory + disk * HEALTH_WEIGHTS.disk
  return Math.round(100 - weightedUsage)
}

export function getHealthLabel(score) {
  if (typeof score !== 'number' || isNaN(score)) return '需关注'
  if (score >= 90) return '优秀'
  if (score >= 70) return '良好'
  return '需关注'
}

export function getHealthColor(score) {
  if (typeof score !== 'number' || isNaN(score)) return '#ef4444'
  if (score >= 90) return '#10b981'
  if (score >= 70) return '#f59e0b'
  return '#ef4444'
}

export function classifyAlertLevel(value) {
  if (typeof value !== 'number' || isNaN(value)) return ALERT_LEVELS.INFO
  if (value >= 90) return ALERT_LEVELS.CRITICAL
  if (value >= 70) return ALERT_LEVELS.WARNING
  return ALERT_LEVELS.INFO
}

export function filterAlertsByLevel(alerts, level) {
  if (!Array.isArray(alerts)) return []
  if (!level || level === 'all') return alerts
  return alerts.filter((a) => a.level === level)
}

export function generateAlert(silenced = false) {
  const titleIdx = randomInt(0, ALERT_TITLES.length - 1)
  const resourceIdx = randomInt(0, ALERT_RESOURCES.length - 1)
  const value = randomInRange(50, 99)
  const level = classifyAlertLevel(value)
  const now = Date.now()
  return {
    id: `alert_${now}_${randomInt(1000, 9999)}`,
    level,
    title: ALERT_TITLES[titleIdx],
    resource: ALERT_RESOURCES[resourceIdx],
    time: now,
    silenced,
  }
}

export function addAlertToList(alerts, newAlert) {
  if (!Array.isArray(alerts)) return [newAlert]
  const list = [newAlert, ...alerts]
  return list.slice(0, MAX_ALERT_COUNT)
}

export function generateRegionData() {
  return REGIONS.map((region) => ({
    ...region,
    instances: randomInt(12, 85),
    alerts: randomInt(0, 15),
    cost: randomInt(1200, 28000),
  }))
}

export function fluctuateRegionData(regionData) {
  if (!Array.isArray(regionData)) return []
  return regionData.map((r) => ({
    ...r,
    instances: Math.max(1, r.instances + randomInt(-3, 3)),
    alerts: Math.max(0, r.alerts + randomInt(-2, 2)),
    cost: Math.max(0, r.cost + randomInt(-500, 500)),
  }))
}

export function generateMetrics() {
  return {
    [METRIC_TYPES.CPU]: clamp(randomInRange(20, 95), 0, 100),
    [METRIC_TYPES.MEMORY]: clamp(randomInRange(25, 90), 0, 100),
    [METRIC_TYPES.DISK]: clamp(randomInRange(30, 85), 0, 100),
  }
}

export function fluctuateMetrics(prev) {
  if (!prev) return generateMetrics()
  return {
    [METRIC_TYPES.CPU]: clamp(prev.cpu + randomInRange(-8, 8), 0, 100),
    [METRIC_TYPES.MEMORY]: clamp(prev.memory + randomInRange(-6, 6), 0, 100),
    [METRIC_TYPES.DISK]: clamp(prev.disk + randomInRange(-4, 4), 0, 100),
  }
}

export function filterDataByRegion(data, regionId) {
  if (!regionId || regionId === 'all') return data
  if (!data) return data
  return { ...data, regionId }
}

export function generateInitialTrendData() {
  const now = Date.now()
  const points = []
  const count = Math.min(MAX_TREND_POINTS, 30)
  for (let i = count; i >= 1; i--) {
    const ts = now - i * 5000
    points.push({
      time: ts,
      cpu: clamp(randomInRange(20, 80), 0, 100),
      memory: clamp(randomInRange(25, 85), 0, 100),
      disk: clamp(randomInRange(30, 75), 0, 100),
    })
  }
  return points
}

export function appendTrendPoint(points, newPoint) {
  if (!Array.isArray(points)) return newPoint ? [newPoint] : []
  const list = newPoint ? [...points, newPoint] : [...points]
  if (list.length > MAX_TREND_POINTS) {
    return list.slice(list.length - MAX_TREND_POINTS)
  }
  return list
}

export function evictOldTrendPoints(points, timeRange) {
  if (!Array.isArray(points)) return []
  const cutoff = Date.now() - timeRange
  return points.filter((p) => p.time >= cutoff)
}

export function computeTrendStats(points, metric) {
  if (!Array.isArray(points) || points.length === 0) {
    return { max: 0, min: 0, avg: 0 }
  }
  const values = points.map((p) => p[metric]).filter((v) => typeof v === 'number')
  if (values.length === 0) return { max: 0, min: 0, avg: 0 }
  const max = Math.max(...values)
  const min = Math.min(...values)
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  return { max: Math.round(max * 10) / 10, min: Math.round(min * 10) / 10, avg: Math.round(avg * 10) / 10 }
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return ''
  const diff = Date.now() - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${Math.floor(diff / 86400000)} 天前`
}

export function formatCost(cost) {
  if (typeof cost !== 'number') return '¥0'
  if (cost >= 10000) return `¥${(cost / 10000).toFixed(1)}万`
  return `¥${cost.toLocaleString()}`
}

export function loadAutoRefreshState() {
  try {
    const val = localStorage.getItem('cloud-monitor-auto-refresh')
    if (val === 'false') return false
    return true
  } catch {
    return true
  }
}

export function saveAutoRefreshState(enabled) {
  try {
    localStorage.setItem('cloud-monitor-auto-refresh', enabled ? 'true' : 'false')
  } catch { /* ignore */ }
}

export function getGaugeColor(value) {
  if (typeof value !== 'number' || isNaN(value)) return '#10b981'
  if (value < 60) return '#10b981'
  if (value < 80) return '#f59e0b'
  return '#ef4444'
}
