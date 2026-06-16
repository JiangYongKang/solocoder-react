import { ERROR_TYPE_LIST, ERROR_TYPE_COLORS } from './constants.js'

const isInTimeRange = (timestamp, startTime, endTime) => {
  if (startTime !== null && timestamp < startTime) return false
  if (endTime !== null && timestamp > endTime) return false
  return true
}

const getTimeRange = (rangeKey, customStart = null, customEnd = null, now = Date.now()) => {
  const msPerHour = 60 * 60 * 1000
  const msPerDay = 24 * msPerHour

  const endTime = now

  switch (rangeKey) {
    case '1h':
      return { startTime: now - msPerHour, endTime }
    case 'today': {
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      return { startTime: today.getTime(), endTime }
    }
    case '7d':
      return { startTime: now - 7 * msPerDay, endTime }
    case '30d':
      return { startTime: now - 30 * msPerDay, endTime }
    case 'custom':
      return { startTime: customStart, endTime: customEnd }
    default:
      return { startTime: null, endTime: null }
  }
}

const filterErrorsByTimeRange = (errors, startTime, endTime) => {
  if (!Array.isArray(errors)) return []
  if (startTime === null && endTime === null) return [...errors]
  return errors.filter((err) => isInTimeRange(err.occurredAt, startTime, endTime))
}

const filterErrorsByResolved = (errors, includeResolved) => {
  if (!Array.isArray(errors)) return []
  if (includeResolved) return [...errors]
  return errors.filter((err) => !err.resolved)
}

const filterErrorsByType = (errors, types) => {
  if (!Array.isArray(errors)) return []
  if (!types || types.length === 0) return [...errors]
  return errors.filter((err) => types.includes(err.type))
}

const sortErrors = (errors, sortKey) => {
  if (!Array.isArray(errors)) return []
  const sorted = [...errors]

  switch (sortKey) {
    case 'time-desc':
      sorted.sort((a, b) => b.occurredAt - a.occurredAt)
      break
    case 'time-asc':
      sorted.sort((a, b) => a.occurredAt - b.occurredAt)
      break
    case 'count-desc':
      sorted.sort((a, b) => b.count - a.count)
      break
    case 'count-asc':
      sorted.sort((a, b) => a.count - b.count)
      break
    case 'type-asc':
      sorted.sort((a, b) => a.type.localeCompare(b.type))
      break
    case 'type-desc':
      sorted.sort((a, b) => b.type.localeCompare(a.type))
      break
    default:
      break
  }

  return sorted
}

const paginateErrors = (errors, page, pageSize) => {
  if (!Array.isArray(errors)) return { data: [], total: 0, totalPages: 0 }
  const total = errors.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const data = errors.slice(start, end)
  return { data, total, totalPages }
}

const getSummaryStats = (errors, now = Date.now()) => {
  if (!Array.isArray(errors)) {
    return { total: 0, todayNew: 0, unresolved: 0 }
  }

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const todayStart = today.getTime()

  let total = 0
  let todayNew = 0
  let unresolved = 0

  errors.forEach((err) => {
    total += err.count
    if (err.occurredAt >= todayStart) {
      todayNew += err.count
    }
    if (!err.resolved) {
      unresolved += err.count
    }
  })

  return { total, todayNew, unresolved }
}

const getErrorTypeDistribution = (errors) => {
  if (!Array.isArray(errors)) return []

  const typeCounts = {}
  ERROR_TYPE_LIST.forEach((type) => {
    typeCounts[type] = 0
  })

  errors.forEach((err) => {
    if (typeCounts[err.type] !== undefined) {
      typeCounts[err.type] += err.count
    }
  })

  return ERROR_TYPE_LIST.map((type) => ({
    type,
    name: type,
    value: typeCounts[type],
    color: ERROR_TYPE_COLORS[type],
  }))
}

const getTrendData = (errors, rangeKey, startTime, endTime, now = Date.now()) => {
  if (!Array.isArray(errors)) return []

  const points = []
  const msPerHour = 60 * 60 * 1000
  const msPerDay = 24 * msPerHour

  let step
  let labelFormat
  let pointCount

  const actualStart = startTime !== null ? startTime : (errors.length > 0 ? errors[errors.length - 1].occurredAt : now)
  const actualEnd = endTime !== null ? endTime : now

  const rangeMs = actualEnd - actualStart

  if (rangeMs <= msPerHour) {
    step = 5 * 60 * 1000
    labelFormat = 'time'
    pointCount = 12
  } else if (rangeMs <= 24 * msPerHour) {
    step = msPerHour
    labelFormat = 'hour'
    pointCount = 24
  } else if (rangeMs <= 7 * msPerDay) {
    step = msPerDay
    labelFormat = 'day'
    pointCount = 7
  } else {
    step = msPerDay
    labelFormat = 'day'
    pointCount = 30
  }

  const typeData = {}
  ERROR_TYPE_LIST.forEach((type) => {
    typeData[type] = new Array(pointCount).fill(0)
  })

  for (let i = 0; i < pointCount; i++) {
    const pointTime = actualEnd - (pointCount - 1 - i) * step
    let label
    const date = new Date(pointTime)

    if (labelFormat === 'time') {
      label = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    } else if (labelFormat === 'hour') {
      label = `${String(date.getHours()).padStart(2, '0')}:00`
    } else {
      label = `${date.getMonth() + 1}/${date.getDate()}`
    }

    points.push({ time: pointTime, label, types: {} })
  }

  errors.forEach((err) => {
    for (let i = 0; i < pointCount; i++) {
      const pointTime = points[i].time
      const nextPointTime = i < pointCount - 1 ? points[i + 1].time : actualEnd + step

      if (err.occurredAt >= pointTime && err.occurredAt < nextPointTime) {
        if (!points[i].types[err.type]) {
          points[i].types[err.type] = 0
        }
        points[i].types[err.type] += err.count
        break
      }
    }
  })

  return points
}

const markErrorResolved = (errors, errorId, resolved = true) => {
  if (!Array.isArray(errors)) return []
  return errors.map((err) => {
    if (err.id === errorId) {
      return {
        ...err,
        resolved,
        resolvedAt: resolved ? Date.now() : null,
      }
    }
    return err
  })
}

const markAllResolved = (errors) => {
  if (!Array.isArray(errors)) return []
  const now = Date.now()
  return errors.map((err) => ({
    ...err,
    resolved: true,
    resolvedAt: now,
  }))
}

const generateDailySummaries = (errors, daysBack = 30, now = Date.now()) => {
  const errorList = Array.isArray(errors) ? errors : []

  const msPerDay = 24 * 60 * 60 * 1000
  const summaries = []

  for (let i = 0; i < daysBack; i++) {
    const date = new Date(now - i * msPerDay)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const dayErrors = errorList.filter(
      (err) => err.occurredAt >= dayStart.getTime() && err.occurredAt <= dayEnd.getTime()
    )

    const total = dayErrors.reduce((sum, err) => sum + err.count, 0)
    const resolved = dayErrors.filter((e) => e.resolved).reduce((sum, err) => sum + err.count, 0)
    const unresolved = total - resolved

    const typeSet = new Set(dayErrors.map((e) => e.type))

    summaries.push({
      date: dateKey,
      dateKey,
      total,
      resolved,
      unresolved,
      newTypes: typeSet.size,
      errorIds: dayErrors.map((e) => e.id),
    })
  }

  return summaries.sort((a, b) => (a.date < b.date ? 1 : -1))
}

const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0'
  if (num >= 10000) return (num / 10000).toFixed(2) + '万'
  return num.toLocaleString('zh-CN')
}

const getTodayCount = (errors, now = Date.now()) => {
  if (!Array.isArray(errors)) return 0
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return errors
    .filter((err) => err.occurredAt >= today.getTime())
    .reduce((sum, err) => sum + err.count, 0)
}

export {
  isInTimeRange,
  getTimeRange,
  filterErrorsByTimeRange,
  filterErrorsByResolved,
  filterErrorsByType,
  sortErrors,
  paginateErrors,
  getSummaryStats,
  getErrorTypeDistribution,
  getTrendData,
  markErrorResolved,
  markAllResolved,
  generateDailySummaries,
  formatNumber,
  getTodayCount,
}
