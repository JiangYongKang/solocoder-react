import { describe, it, expect, beforeEach } from 'vitest'
import {
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
} from '../../error-monitor/utils.js'
import { ERROR_TYPE_LIST } from '../../error-monitor/constants.js'

const createMockError = (overrides = {}) => {
  const now = Date.now()
  return {
    id: `err_${Math.random()}`,
    type: 'TypeError',
    message: 'Cannot read property of undefined',
    occurredAt: now,
    occurredAtFormatted: '2024-01-01 12:00:00',
    dateKey: '2024-01-01',
    count: 5,
    resolved: false,
    resolvedAt: null,
    callStack: [],
    ...overrides,
  }
}

describe('isInTimeRange', () => {
  it('当时间在范围内时返回 true', () => {
    const timestamp = Date.now()
    expect(isInTimeRange(timestamp, timestamp - 1000, timestamp + 1000)).toBe(true)
  })

  it('当时间早于开始时间时返回 false', () => {
    const timestamp = Date.now()
    expect(isInTimeRange(timestamp - 2000, timestamp - 1000, timestamp + 1000)).toBe(false)
  })

  it('当时间晚于结束时间时返回 false', () => {
    const timestamp = Date.now()
    expect(isInTimeRange(timestamp + 2000, timestamp - 1000, timestamp + 1000)).toBe(false)
  })

  it('开始时间为 null 时只检查结束时间', () => {
    const timestamp = Date.now()
    expect(isInTimeRange(timestamp, null, timestamp + 1000)).toBe(true)
    expect(isInTimeRange(timestamp + 2000, null, timestamp + 1000)).toBe(false)
  })

  it('结束时间为 null 时只检查开始时间', () => {
    const timestamp = Date.now()
    expect(isInTimeRange(timestamp, timestamp - 1000, null)).toBe(true)
    expect(isInTimeRange(timestamp - 2000, timestamp - 1000, null)).toBe(false)
  })

  it('两端都为 null 时始终返回 true', () => {
    expect(isInTimeRange(Date.now(), null, null)).toBe(true)
  })
})

describe('getTimeRange', () => {
  const now = Date.now()
  const msPerHour = 60 * 60 * 1000
  const msPerDay = 24 * msPerHour

  it('1h 范围返回最近 1 小时', () => {
    const range = getTimeRange('1h', null, null, now)
    expect(range.endTime).toBe(now)
    expect(now - range.startTime).toBeCloseTo(msPerHour, -3)
  })

  it('today 范围返回今天开始到现在', () => {
    const range = getTimeRange('today', null, null, now)
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    expect(range.startTime).toBe(today.getTime())
    expect(range.endTime).toBe(now)
  })

  it('7d 范围返回最近 7 天', () => {
    const range = getTimeRange('7d', null, null, now)
    expect(range.endTime).toBe(now)
    expect(now - range.startTime).toBeCloseTo(7 * msPerDay, -3)
  })

  it('30d 范围返回最近 30 天', () => {
    const range = getTimeRange('30d', null, null, now)
    expect(range.endTime).toBe(now)
    expect(now - range.startTime).toBeCloseTo(30 * msPerDay, -3)
  })

  it('custom 范围返回自定义时间', () => {
    const customStart = now - 100000
    const customEnd = now - 50000
    const range = getTimeRange('custom', customStart, customEnd, now)
    expect(range.startTime).toBe(customStart)
    expect(range.endTime).toBe(customEnd)
  })

  it('未知范围键返回 null 范围', () => {
    const range = getTimeRange('unknown', null, null, now)
    expect(range.startTime).toBeNull()
    expect(range.endTime).toBeNull()
  })
})

describe('filterErrorsByTimeRange', () => {
  const now = Date.now()
  const errors = [
    createMockError({ id: '1', occurredAt: now - 3600000 }),
    createMockError({ id: '2', occurredAt: now - 1800000 }),
    createMockError({ id: '3', occurredAt: now }),
  ]

  it('过滤指定时间范围内的错误', () => {
    const filtered = filterErrorsByTimeRange(errors, now - 2000000, now - 1000000)
    expect(filtered.length).toBe(1)
    expect(filtered[0].id).toBe('2')
  })

  it('空数组返回空数组', () => {
    expect(filterErrorsByTimeRange([], now - 1000, now)).toEqual([])
  })

  it('非数组输入返回空数组', () => {
    expect(filterErrorsByTimeRange(null, now - 1000, now)).toEqual([])
    expect(filterErrorsByTimeRange(undefined, now - 1000, now)).toEqual([])
  })

  it('时间范围都为 null 时返回所有错误', () => {
    const filtered = filterErrorsByTimeRange(errors, null, null)
    expect(filtered.length).toBe(3)
  })
})

describe('filterErrorsByResolved', () => {
  const errors = [
    createMockError({ id: '1', resolved: false }),
    createMockError({ id: '2', resolved: true }),
    createMockError({ id: '3', resolved: false }),
  ]

  it('includeResolved 为 true 时返回所有错误', () => {
    const filtered = filterErrorsByResolved(errors, true)
    expect(filtered.length).toBe(3)
  })

  it('includeResolved 为 false 时只返回未解决的错误', () => {
    const filtered = filterErrorsByResolved(errors, false)
    expect(filtered.length).toBe(2)
    expect(filtered.every((e) => !e.resolved)).toBe(true)
  })

  it('空数组返回空数组', () => {
    expect(filterErrorsByResolved([], false)).toEqual([])
  })

  it('非数组输入返回空数组', () => {
    expect(filterErrorsByResolved(null, false)).toEqual([])
  })
})

describe('filterErrorsByType', () => {
  const errors = [
    createMockError({ id: '1', type: 'TypeError' }),
    createMockError({ id: '2', type: 'ReferenceError' }),
    createMockError({ id: '3', type: 'NetworkError' }),
    createMockError({ id: '4', type: 'TypeError' }),
  ]

  it('过滤指定类型的错误', () => {
    const filtered = filterErrorsByType(errors, ['TypeError'])
    expect(filtered.length).toBe(2)
    expect(filtered.every((e) => e.type === 'TypeError')).toBe(true)
  })

  it('支持多种类型过滤', () => {
    const filtered = filterErrorsByType(errors, ['TypeError', 'ReferenceError'])
    expect(filtered.length).toBe(3)
    expect(filtered.map((e) => e.type)).toContain('TypeError')
    expect(filtered.map((e) => e.type)).toContain('ReferenceError')
  })

  it('空类型数组返回所有错误', () => {
    const filtered = filterErrorsByType(errors, [])
    expect(filtered.length).toBe(4)
  })

  it('空数组返回空数组', () => {
    expect(filterErrorsByType([], ['TypeError'])).toEqual([])
  })

  it('非数组输入返回空数组', () => {
    expect(filterErrorsByType(null, ['TypeError'])).toEqual([])
  })
})

describe('sortErrors', () => {
  const now = Date.now()
  const errors = [
    createMockError({ id: '1', type: 'TypeError', count: 10, occurredAt: now - 10000 }),
    createMockError({ id: '2', type: 'ReferenceError', count: 5, occurredAt: now - 5000 }),
    createMockError({ id: '3', type: 'NetworkError', count: 20, occurredAt: now }),
  ]

  it('按时间降序排序', () => {
    const sorted = sortErrors(errors, 'time-desc')
    expect(sorted[0].id).toBe('3')
    expect(sorted[2].id).toBe('1')
  })

  it('按时间升序排序', () => {
    const sorted = sortErrors(errors, 'time-asc')
    expect(sorted[0].id).toBe('1')
    expect(sorted[2].id).toBe('3')
  })

  it('按发生次数降序排序', () => {
    const sorted = sortErrors(errors, 'count-desc')
    expect(sorted[0].id).toBe('3')
    expect(sorted[2].id).toBe('2')
  })

  it('按发生次数升序排序', () => {
    const sorted = sortErrors(errors, 'count-asc')
    expect(sorted[0].id).toBe('2')
    expect(sorted[2].id).toBe('3')
  })

  it('按错误类型字母升序排序', () => {
    const sorted = sortErrors(errors, 'type-asc')
    expect(sorted[0].type).toBe('NetworkError')
    expect(sorted[2].type).toBe('TypeError')
  })

  it('按错误类型字母降序排序', () => {
    const sorted = sortErrors(errors, 'type-desc')
    expect(sorted[0].type).toBe('TypeError')
    expect(sorted[2].type).toBe('NetworkError')
  })

  it('空数组返回空数组', () => {
    expect(sortErrors([], 'time-desc')).toEqual([])
  })

  it('非数组输入返回空数组', () => {
    expect(sortErrors(null, 'time-desc')).toEqual([])
  })

  it('不修改原始数组', () => {
    const original = [...errors]
    sortErrors(errors, 'time-asc')
    expect(errors).toEqual(original)
  })
})

describe('paginateErrors', () => {
  const errors = Array.from({ length: 25 }, (_, i) => createMockError({ id: String(i) }))

  it('返回正确的分页数据', () => {
    const result = paginateErrors(errors, 2, 10)
    expect(result.data.length).toBe(10)
    expect(result.data[0].id).toBe('10')
    expect(result.total).toBe(25)
    expect(result.totalPages).toBe(3)
  })

  it('第一页返回前 N 条', () => {
    const result = paginateErrors(errors, 1, 10)
    expect(result.data.length).toBe(10)
    expect(result.data[0].id).toBe('0')
  })

  it('最后一页返回剩余数据', () => {
    const result = paginateErrors(errors, 3, 10)
    expect(result.data.length).toBe(5)
    expect(result.data[0].id).toBe('20')
  })

  it('空数组返回空结果', () => {
    const result = paginateErrors([], 1, 10)
    expect(result.data).toEqual([])
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(0)
  })

  it('非数组输入返回空结果', () => {
    const result = paginateErrors(null, 1, 10)
    expect(result.data).toEqual([])
    expect(result.total).toBe(0)
  })
})

describe('getSummaryStats', () => {
  const now = Date.now()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const errors = [
    createMockError({ id: '1', count: 10, resolved: false, occurredAt: today.getTime() + 3600000 }),
    createMockError({ id: '2', count: 5, resolved: true, occurredAt: today.getTime() + 7200000 }),
    createMockError({ id: '3', count: 8, resolved: false, occurredAt: today.getTime() - 86400000 }),
  ]

  it('计算总错误数', () => {
    const stats = getSummaryStats(errors, now)
    expect(stats.total).toBe(23)
  })

  it('计算今日新增', () => {
    const stats = getSummaryStats(errors, now)
    expect(stats.todayNew).toBe(15)
  })

  it('计算未解决数', () => {
    const stats = getSummaryStats(errors, now)
    expect(stats.unresolved).toBe(18)
  })

  it('空数组返回零统计', () => {
    const stats = getSummaryStats([], now)
    expect(stats.total).toBe(0)
    expect(stats.todayNew).toBe(0)
    expect(stats.unresolved).toBe(0)
  })

  it('非数组输入返回零统计', () => {
    const stats = getSummaryStats(null, now)
    expect(stats.total).toBe(0)
    expect(stats.todayNew).toBe(0)
    expect(stats.unresolved).toBe(0)
  })
})

describe('getErrorTypeDistribution', () => {
  const errors = [
    createMockError({ id: '1', type: 'TypeError', count: 10 }),
    createMockError({ id: '2', type: 'TypeError', count: 5 }),
    createMockError({ id: '3', type: 'ReferenceError', count: 8 }),
    createMockError({ id: '4', type: 'NetworkError', count: 3 }),
  ]

  it('返回所有错误类型的分布', () => {
    const distribution = getErrorTypeDistribution(errors)
    expect(distribution.length).toBe(ERROR_TYPE_LIST.length)
  })

  it('正确计算每种类型的数量', () => {
    const distribution = getErrorTypeDistribution(errors)
    const typeError = distribution.find((d) => d.type === 'TypeError')
    const refError = distribution.find((d) => d.type === 'ReferenceError')
    const netError = distribution.find((d) => d.type === 'NetworkError')

    expect(typeError.value).toBe(15)
    expect(refError.value).toBe(8)
    expect(netError.value).toBe(3)
  })

  it('空数组返回所有类型值为 0', () => {
    const distribution = getErrorTypeDistribution([])
    distribution.forEach((d) => {
      expect(d.value).toBe(0)
    })
  })

  it('非数组输入返回所有类型值为 0', () => {
    const distribution = getErrorTypeDistribution(null)
    distribution.forEach((d) => {
      expect(d.value).toBe(0)
    })
  })

  it('每个条目包含必要字段', () => {
    const distribution = getErrorTypeDistribution(errors)
    distribution.forEach((d) => {
      expect(d).toHaveProperty('type')
      expect(d).toHaveProperty('name')
      expect(d).toHaveProperty('value')
      expect(d).toHaveProperty('color')
    })
  })
})

describe('getTrendData', () => {
  const now = Date.now()
  const errors = [
    createMockError({ id: '1', type: 'TypeError', count: 5, occurredAt: now - 3600000 }),
    createMockError({ id: '2', type: 'ReferenceError', count: 3, occurredAt: now - 1800000 }),
    createMockError({ id: '3', type: 'TypeError', count: 2, occurredAt: now - 900000 }),
  ]

  it('返回趋势数据数组', () => {
    const trend = getTrendData(errors, '1h', now - 3600000, now, now)
    expect(Array.isArray(trend)).toBe(true)
    expect(trend.length).toBeGreaterThan(0)
  })

  it('每个数据点包含时间和标签', () => {
    const trend = getTrendData(errors, '1h', now - 3600000, now, now)
    trend.forEach((point) => {
      expect(point).toHaveProperty('time')
      expect(point).toHaveProperty('label')
      expect(point).toHaveProperty('types')
    })
  })

  it('空数组返回趋势点但值为 0', () => {
    const trend = getTrendData([], '1h', now - 3600000, now, now)
    expect(trend.length).toBeGreaterThan(0)
    trend.forEach((point) => {
      ERROR_TYPE_LIST.forEach((type) => {
        expect(point.types[type] || 0).toBe(0)
      })
    })
  })

  it('非数组输入返回空数组', () => {
    const trend = getTrendData(null, '1h', now - 3600000, now, now)
    expect(trend).toEqual([])
  })
})

describe('markErrorResolved', () => {
  const errors = [
    createMockError({ id: '1', resolved: false }),
    createMockError({ id: '2', resolved: false }),
    createMockError({ id: '3', resolved: true }),
  ]

  it('标记指定错误为已解决', () => {
    const result = markErrorResolved(errors, '1', true)
    expect(result.find((e) => e.id === '1').resolved).toBe(true)
    expect(result.find((e) => e.id === '1').resolvedAt).not.toBeNull()
  })

  it('标记指定错误为未解决', () => {
    const result = markErrorResolved(errors, '3', false)
    expect(result.find((e) => e.id === '3').resolved).toBe(false)
    expect(result.find((e) => e.id === '3').resolvedAt).toBeNull()
  })

  it('不影响其他错误', () => {
    const result = markErrorResolved(errors, '1', true)
    expect(result.find((e) => e.id === '2').resolved).toBe(false)
  })

  it('不修改原始数组', () => {
    const original = JSON.parse(JSON.stringify(errors))
    markErrorResolved(errors, '1', true)
    expect(errors).toEqual(original)
  })

  it('空数组返回空数组', () => {
    expect(markErrorResolved([], '1', true)).toEqual([])
  })

  it('非数组输入返回空数组', () => {
    expect(markErrorResolved(null, '1', true)).toEqual([])
  })
})

describe('markAllResolved', () => {
  const errors = [
    createMockError({ id: '1', resolved: false }),
    createMockError({ id: '2', resolved: false }),
    createMockError({ id: '3', resolved: true }),
  ]

  it('将所有错误标记为已解决', () => {
    const result = markAllResolved(errors)
    expect(result.every((e) => e.resolved)).toBe(true)
    expect(result.every((e) => e.resolvedAt !== null)).toBe(true)
  })

  it('不修改原始数组', () => {
    const original = JSON.parse(JSON.stringify(errors))
    markAllResolved(errors)
    expect(errors).toEqual(original)
  })

  it('空数组返回空数组', () => {
    expect(markAllResolved([])).toEqual([])
  })

  it('非数组输入返回空数组', () => {
    expect(markAllResolved(null)).toEqual([])
  })
})

describe('generateDailySummaries', () => {
  const now = Date.now()
  const msPerDay = 24 * 60 * 60 * 1000

  const errors = [
    createMockError({ id: '1', type: 'TypeError', count: 5, resolved: false, occurredAt: now }),
    createMockError({ id: '2', type: 'ReferenceError', count: 3, resolved: true, occurredAt: now - msPerDay }),
    createMockError({ id: '3', type: 'TypeError', count: 2, resolved: false, occurredAt: now - msPerDay }),
  ]

  it('生成指定天数的摘要', () => {
    const summaries = generateDailySummaries(errors, 7, now)
    expect(summaries.length).toBe(7)
  })

  it('摘要按日期倒序排列', () => {
    const summaries = generateDailySummaries(errors, 7, now)
    for (let i = 1; i < summaries.length; i++) {
      expect(summaries[i - 1].date > summaries[i].date).toBe(true)
    }
  })

  it('正确计算每日统计', () => {
    const summaries = generateDailySummaries(errors, 7, now)
    const todaySummary = summaries[0]
    const yesterdaySummary = summaries[1]

    expect(todaySummary.total).toBe(5)
    expect(todaySummary.resolved).toBe(0)
    expect(todaySummary.unresolved).toBe(5)
    expect(todaySummary.newTypes).toBe(1)

    expect(yesterdaySummary.total).toBe(5)
    expect(yesterdaySummary.resolved).toBe(3)
    expect(yesterdaySummary.unresolved).toBe(2)
    expect(yesterdaySummary.newTypes).toBe(2)
  })

  it('每个摘要包含必要字段', () => {
    const summaries = generateDailySummaries(errors, 7, now)
    summaries.forEach((s) => {
      expect(s).toHaveProperty('date')
      expect(s).toHaveProperty('dateKey')
      expect(s).toHaveProperty('total')
      expect(s).toHaveProperty('resolved')
      expect(s).toHaveProperty('unresolved')
      expect(s).toHaveProperty('newTypes')
      expect(s).toHaveProperty('errorIds')
    })
  })

  it('空数组生成全零摘要', () => {
    const summaries = generateDailySummaries([], 7, now)
    expect(summaries.length).toBe(7)
    summaries.forEach((s) => {
      expect(s.total).toBe(0)
      expect(s.resolved).toBe(0)
      expect(s.unresolved).toBe(0)
      expect(s.newTypes).toBe(0)
    })
  })

  it('非数组输入生成全零摘要', () => {
    const summaries = generateDailySummaries(null, 7, now)
    expect(summaries.length).toBe(7)
  })
})

describe('formatNumber', () => {
  it('格式化普通数字', () => {
    expect(formatNumber(123)).toBe('123')
    expect(formatNumber(1234)).toBe('1,234')
  })

  it('格式化万级数字', () => {
    expect(formatNumber(10000)).toBe('1.00万')
    expect(formatNumber(12345)).toBe('1.23万')
  })

  it('处理 null 和 undefined', () => {
    expect(formatNumber(null)).toBe('0')
    expect(formatNumber(undefined)).toBe('0')
    expect(formatNumber(NaN)).toBe('0')
  })

  it('处理零', () => {
    expect(formatNumber(0)).toBe('0')
  })
})

describe('getTodayCount', () => {
  const now = Date.now()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const errors = [
    createMockError({ id: '1', count: 5, occurredAt: today.getTime() + 3600000 }),
    createMockError({ id: '2', count: 3, occurredAt: today.getTime() + 7200000 }),
    createMockError({ id: '3', count: 10, occurredAt: today.getTime() - 86400000 }),
  ]

  it('计算今天的错误总数', () => {
    expect(getTodayCount(errors, now)).toBe(8)
  })

  it('空数组返回 0', () => {
    expect(getTodayCount([], now)).toBe(0)
  })

  it('非数组输入返回 0', () => {
    expect(getTodayCount(null, now)).toBe(0)
  })
})
