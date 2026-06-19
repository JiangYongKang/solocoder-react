import { LOG_LEVELS, LOG_PATTERN, TRUNCATE_LENGTH } from './constants'

export function parseLogLine(line) {
  if (!line || !line.trim()) {
    return null
  }

  const match = line.match(LOG_PATTERN)
  if (!match) {
    return {
      isValid: false,
      raw: line,
      timestamp: null,
      level: null,
      module: null,
      content: line,
    }
  }

  const [, timestampStr, level, module, content] = match

  const timestamp = parseTimestamp(timestampStr)

  return {
    isValid: true,
    raw: line,
    timestamp,
    timestampStr,
    level: level.toUpperCase(),
    module,
    content,
  }
}

export function parseTimestamp(tsStr) {
  if (!tsStr) return null

  const parts = tsStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
  if (!parts) return null

  const [, year, month, day, hour, minute, second] = parts
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  )

  return isNaN(date.getTime()) ? null : date.getTime()
}

export function parseLogs(rawText) {
  if (!rawText) return []

  const lines = rawText.split('\n')
  const logs = []
  let id = 0

  for (const line of lines) {
    const parsed = parseLogLine(line)
    if (parsed) {
      logs.push({
        ...parsed,
        id: `log_${id++}`,
        collapsed: false,
        expanded: false,
      })
    }
  }

  return logs
}

export function isValidRegex(pattern) {
  if (!pattern) return true
  try {
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}

export function filterByRegex(logs, pattern, caseSensitive = true) {
  if (!pattern || !pattern.trim()) {
    return logs
  }

  try {
    const flags = caseSensitive ? '' : 'i'
    const regex = new RegExp(pattern, flags)
    return logs.filter((log) => {
      return regex.test(log.raw)
    })
  } catch {
    return logs
  }
}

export function getHighlightRanges(text, pattern, caseSensitive = true) {
  if (!pattern || !pattern.trim() || !text) {
    return []
  }

  try {
    const flags = caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(pattern, flags)
    const ranges = []
    let match

    while ((match = regex.exec(text)) !== null) {
      if (match.index === regex.lastIndex) {
        regex.lastIndex++
      }
      ranges.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      })
    }

    return ranges
  } catch {
    return []
  }
}

export function filterByTimeRange(logs, startTime, endTime) {
  let result = logs

  if (startTime != null && startTime !== '') {
    const startTs = typeof startTime === 'number' ? startTime : new Date(startTime).getTime()
    if (!isNaN(startTs)) {
      result = result.filter((log) => {
        if (!log.isValid || log.timestamp === null) return false
        return log.timestamp >= startTs
      })
    }
  }

  if (endTime != null && endTime !== '') {
    const endTs = typeof endTime === 'number' ? endTime : new Date(endTime).getTime()
    if (!isNaN(endTs)) {
      result = result.filter((log) => {
        if (!log.isValid || log.timestamp === null) return false
        return log.timestamp <= endTs
      })
    }
  }

  return result
}

export function validateTimeRange(startTime, endTime) {
  if (startTime == null || startTime === '' || endTime == null || endTime === '') {
    return { valid: true }
  }

  const startTs = typeof startTime === 'number' ? startTime : new Date(startTime).getTime()
  const endTs = typeof endTime === 'number' ? endTime : new Date(endTime).getTime()

  if (isNaN(startTs) || isNaN(endTs)) {
    return { valid: true }
  }

  if (startTs > endTs) {
    return { valid: false, error: '起始时间不能晚于结束时间' }
  }

  return { valid: true }
}

export function countByLevel(logs) {
  const counts = {
    ERROR: 0,
    WARN: 0,
    INFO: 0,
    DEBUG: 0,
  }

  for (const log of logs) {
    if (log.isValid && log.level && Object.prototype.hasOwnProperty.call(counts, log.level)) {
      counts[log.level]++
    }
  }

  return counts
}

export function getHourKey(timestamp) {
  if (timestamp == null) return null
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:00`
}

export function countKeywordByHour(logs, keyword, caseSensitive = false) {
  if (!keyword || !keyword.trim()) {
    return []
  }

  const kw = caseSensitive ? keyword : keyword.toLowerCase()
  const hourMap = {}
  const validLogs = logs.filter((log) => log.isValid && log.timestamp !== null)

  if (validLogs.length === 0) {
    return []
  }

  let minTs = Infinity
  let maxTs = -Infinity

  for (const log of validLogs) {
    if (log.timestamp < minTs) minTs = log.timestamp
    if (log.timestamp > maxTs) maxTs = log.timestamp

    const content = caseSensitive ? log.content : log.content.toLowerCase()
    if (content.includes(kw)) {
      const hourKey = getHourKey(log.timestamp)
      if (hourKey) {
        hourMap[hourKey] = (hourMap[hourKey] || 0) + 1
      }
    }
  }

  const result = []
  const startHour = new Date(minTs)
  startHour.setMinutes(0, 0, 0)
  const endHour = new Date(maxTs)
  endHour.setMinutes(0, 0, 0)

  let current = startHour.getTime()
  const end = endHour.getTime()

  while (current <= end) {
    const key = getHourKey(current)
    result.push({
      hour: key,
      count: hourMap[key] || 0,
    })
    current += 60 * 60 * 1000
  }

  return result
}

export function countMultipleKeywordsByHour(logs, keywords, caseSensitive = false) {
  const results = []
  for (const keyword of keywords) {
    if (keyword && keyword.trim()) {
      results.push({
        keyword,
        data: countKeywordByHour(logs, keyword, caseSensitive),
      })
    }
  }
  return results
}

export function isLongContent(content) {
  if (!content) return false
  return content.length > TRUNCATE_LENGTH
}

export function truncateContent(content) {
  if (!content) return ''
  if (content.length <= TRUNCATE_LENGTH) return content
  return content.slice(0, TRUNCATE_LENGTH) + '...'
}

export function formatDateTime(timestamp) {
  if (timestamp == null) return ''
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

export function getLogLevelBadgeClass(level) {
  const upper = level?.toUpperCase()
  switch (upper) {
    case LOG_LEVELS.ERROR:
      return 'log-level-error'
    case LOG_LEVELS.WARN:
      return 'log-level-warn'
    case LOG_LEVELS.INFO:
      return 'log-level-info'
    case LOG_LEVELS.DEBUG:
      return 'log-level-debug'
    default:
      return 'log-level-unknown'
  }
}

export function getStatsMax(counts) {
  return Math.max(1, ...Object.values(counts))
}

export function getMergedHourKeys(keywordResults) {
  const keySet = new Set()
  for (const result of keywordResults) {
    for (const item of result.data) {
      keySet.add(item.hour)
    }
  }
  return Array.from(keySet).sort()
}
