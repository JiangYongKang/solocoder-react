import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  STORAGE_KEY_RECORDS,
  STORAGE_KEY_GOALS,
  SPORT_TYPES,
  SPORT_MAP,
  SPORT_KEYS,
  DEFAULT_GOALS,
  DEFAULT_BODY_WEIGHT,
} from '../../fitness-tracker/constants'
import {
  generateId,
  formatDate,
  formatDateTime,
  getDateKey,
  getWeekKey,
  getMonthKey,
  getTodayKey,
  getCurrentWeekKey,
  getCurrentMonthKey,
  calculateCalories,
  loadRecords,
  saveRecords,
  loadGoals,
  saveGoals,
  validateRecord,
  createRecord,
  deleteRecord,
  filterRecords,
  sortRecords,
  paginateRecords,
  getRecordList,
  calculateDailySummary,
  calculateWeeklySummary,
  calculateMonthlySummary,
  calculateSummaryByDimension,
  buildTrendData,
  buildSportDistribution,
  validateGoals,
  setGoals,
  calculateDailyProgress,
  calculateWeeklyProgress,
  getWeekDates,
} from '../../fitness-tracker/utils'

const createMockLocalStorage = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

let originalLocalStorage

beforeAll(() => {
  originalLocalStorage = globalThis.localStorage
  globalThis.localStorage = createMockLocalStorage()
})

afterAll(() => {
  globalThis.localStorage = originalLocalStorage
})

const makeValidRecordData = (overrides = {}) => ({
  sportKey: 'running',
  duration: 30,
  distance: 5,
  ...overrides,
})

const makeRecord = (overrides = {}) => {
  const base = {
    id: 'fit_test',
    sportKey: 'running',
    duration: 30,
    distance: 5,
    timestamp: Date.now(),
    dateKey: formatDate(Date.now()),
    calories: 294,
  }
  return { ...base, ...overrides }
}

describe('generateId', () => {
  it('生成的ID以 fit_ 开头', () => {
    expect(generateId()).toMatch(/^fit_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('formatDate', () => {
  it('格式化日期字符串为 YYYY-MM-DD', () => {
    expect(formatDate('2025-06-08')).toBe('2025-06-08')
    expect(formatDate('2025/06/08')).toBe('2025-06-08')
    expect(formatDate('')).toBe('')
  })

  it('接受时间戳', () => {
    const ts = new Date(2025, 5, 8).getTime()
    expect(formatDate(ts)).toBe('2025-06-08')
  })
})

describe('formatDateTime', () => {
  it('格式化时间戳为日期时间字符串', () => {
    const ts = new Date(2025, 5, 8, 14, 30).getTime()
    const result = formatDateTime(ts)
    expect(result).toMatch(/^2025-06-08 \d{2}:\d{2}$/)
  })

  it('空值返回空字符串', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime(undefined)).toBe('')
  })
})

describe('getDateKey / getWeekKey / getMonthKey', () => {
  it('getDateKey 返回 YYYY-MM-DD', () => {
    const ts = new Date(2025, 5, 8).getTime()
    expect(getDateKey(ts)).toBe('2025-06-08')
  })

  it('getWeekKey 返回 ISO 周格式', () => {
    const ts = new Date(2025, 0, 6).getTime()
    expect(getWeekKey(ts)).toMatch(/^\d{4}-W\d{2}$/)
  })

  it('getMonthKey 返回 YYYY-MM', () => {
    const ts = new Date(2025, 5, 8).getTime()
    expect(getMonthKey(ts)).toBe('2025-06')
  })
})

describe('getTodayKey / getCurrentWeekKey / getCurrentMonthKey', () => {
  it('返回当前日期/周/月的 key', () => {
    const now = new Date()
    expect(getTodayKey()).toBe(formatDate(now))
    expect(getCurrentWeekKey()).toBe(getWeekKey(now))
    expect(getCurrentMonthKey()).toBe(getMonthKey(now))
  })
})

describe('calculateCalories', () => {
  it('跑步 30 分钟约消耗 294 千卡（60kg）', () => {
    expect(calculateCalories('running', 30)).toBe(294)
  })

  it('瑜伽 30 分钟约消耗 75 千卡（60kg）', () => {
    expect(calculateCalories('yoga', 30)).toBe(75)
  })

  it('无效运动类型返回 0', () => {
    expect(calculateCalories('invalid', 30)).toBe(0)
  })

  it('支持自定义体重', () => {
    expect(calculateCalories('running', 30, 70)).toBe(343)
  })

  it('时长为 0 返回 0', () => {
    expect(calculateCalories('running', 0)).toBe(0)
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveRecords 保存到 localStorage', () => {
    const records = [{ id: '1', sportKey: 'running' }]
    const result = saveRecords(records)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_RECORDS)).toBe(JSON.stringify(records))
  })

  it('loadRecords 从 localStorage 读取', () => {
    const records = [{ id: '1', sportKey: 'running' }]
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records))
    const result = loadRecords()
    expect(result).toEqual(records)
  })

  it('loadRecords localStorage 为空时返回空数组', () => {
    expect(loadRecords()).toEqual([])
  })

  it('loadRecords localStorage 数据损坏时返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_RECORDS, 'invalid-json')
    expect(loadRecords()).toEqual([])
  })

  it('loadRecords localStorage 数据非数组时返回空数组', () => { {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify({ not: 'array' }))
    expect(loadRecords()).toEqual([])
  }})

  it('saveGoals 保存到 localStorage', () => {
    const goals = { dailyMinutes: 60, weeklySessions: 5 }
    const result = saveGoals(goals)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_GOALS)).toBe(JSON.stringify(goals))
  })

  it('loadGoals 从 localStorage 读取', () => {
    const goals = { dailyMinutes: 60, weeklySessions: 5 }
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals))
    const result = loadGoals()
    expect(result).toEqual(goals)
  })

  it('loadGoals localStorage 为空时返回默认目标', () => {
    expect(loadGoals()).toEqual({ ...DEFAULT_GOALS })
  })

  it('loadGoals 数据损坏时返回默认目标', () => {
    localStorage.setItem(STORAGE_KEY_GOALS, 'invalid')
    expect(loadGoals()).toEqual({ ...DEFAULT_GOALS })
  })

  it('loadGoals 字段缺失时使用默认值', () => {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify({ dailyMinutes: 60 }))
    const result = loadGoals()
    expect(result.dailyMinutes).toBe(60)
    expect(result.weeklySessions).toBe(DEFAULT_GOALS.weeklySessions)
  })
})

describe('validateRecord', () => {
  it('验证通过时返回空对象', () => {
    const errors = validateRecord(makeValidRecordData())
    expect(Object.keys(errors).length).toBe(0)
  })

  it('运动类型为空时报错', () => {
    expect(validateRecord(makeValidRecordData({ sportKey: '' })).sportKey).toBeTruthy()
  })

  it('运动类型无效时报错', () => {
    expect(validateRecord(makeValidRecordData({ sportKey: 'invalid' })).sportKey).toBeTruthy()
  })

  it('时长为空时报错', () => {
    expect(validateRecord(makeValidRecordData({ duration: '' })).duration).toBeTruthy()
  })

  it('时长为非正整数时报错', () => {
    expect(validateRecord(makeValidRecordData({ duration: 0 })).duration).toBeTruthy()
    expect(validateRecord(makeValidRecordData({ duration: -10 })).duration).toBeTruthy()
    expect(validateRecord(makeValidRecordData({ duration: 30.5 })).duration).toBeTruthy()
    expect(validateRecord(makeValidRecordData({ duration: 'abc' })).duration).toBeTruthy()
  })

  it('时长超过 600 分钟时报错', () => {
    expect(validateRecord(makeValidRecordData({ duration: 601 })).duration).toBeTruthy()
  })

  it('时长为 600 分钟时通过', () => {
    expect(validateRecord(makeValidRecordData({ duration: 600 })).duration).toBeFalsy()
  })

  it('距离为负数时报错', () => {
    expect(validateRecord(makeValidRecordData({ distance: -1 })).distance).toBeTruthy()
  })

  it('距离为空时通过', () => {
    expect(validateRecord(makeValidRecordData({ distance: '' })).distance).toBeFalsy()
    expect(validateRecord(makeValidRecordData({ distance: undefined })).distance).toBeFalsy()
    expect(validateRecord(makeValidRecordData({ distance: null })).distance).toBeFalsy()
  })

  it('距离为 0 时通过', () => {
    expect(validateRecord(makeValidRecordData({ distance: 0 })).distance).toBeFalsy()
  })
})

describe('createRecord', () => {
  it('数据无效时返回失败', () => {
    const result = createRecord([], { sportKey: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功创建跑步记录（含距离）', () => {
    const result = createRecord([], makeValidRecordData())
    expect(result.success).toBe(true)
    expect(result.record.id).toBeTruthy()
    expect(result.record.sportKey).toBe('running')
    expect(result.record.duration).toBe(30)
    expect(result.record.distance).toBe(5)
    expect(result.record.timestamp).toBeTruthy()
    expect(result.record.dateKey).toBeTruthy()
    expect(result.record.calories).toBeGreaterThan(0)
    expect(result.records.length).toBe(1)
  })

  it('成功创建瑜伽记录（无距离）', () => {
    const result = createRecord([], makeValidRecordData({ sportKey: 'yoga', distance: '' }))
    expect(result.success).toBe(true)
    expect(result.record.sportKey).toBe('yoga')
    expect(result.record.distance).toBe(null)
  })

  it('新记录放在列表最前面', () => {
    const existing = [{ id: 'old', sportKey: 'running' }]
    const result = createRecord(existing, makeValidRecordData())
    expect(result.records[0].id).toBe(result.record.id)
    expect(result.records[1].id).toBe('old')
  })
})

describe('deleteRecord', () => {
  it('记录不存在时返回失败', () => {
    const result = deleteRecord([], 'not-exist')
    expect(result.success).toBe(false)
  })

  it('成功删除记录', () => {
    const existing = [
      { id: '1', sportKey: 'running' },
      { id: '2', sportKey: 'swimming' },
    ]
    const result = deleteRecord(existing, '1')
    expect(result.success).toBe(true)
    expect(result.records.length).toBe(1)
    expect(result.records[0].id).toBe('2')
  })
})

describe('filterRecords', () => {
  const makeRec = (id, overrides = {}) => {
    const baseTs = new Date(2025, 5, 10, 10, 0).getTime()
    const ts = overrides.timestamp !== undefined ? overrides.timestamp : baseTs
    return makeRecord({
      id,
      timestamp: ts,
      dateKey: formatDate(ts),
      ...overrides,
    })
  }
  const records = [
    makeRec('1', { sportKey: 'running', timestamp: new Date(2025, 5, 1).getTime() }),
    makeRec('2', { sportKey: 'yoga', timestamp: new Date(2025, 5, 5).getTime() }),
    makeRec('3', { sportKey: 'running', timestamp: new Date(2025, 5, 10).getTime() }),
    makeRec('4', { sportKey: 'swimming', timestamp: new Date(2025, 4, 20).getTime() }),
  ]

  it('无筛选条件返回全部', () => {
    expect(filterRecords(records, {}).length).toBe(4)
  })

  it('按运动类型筛选', () => {
    expect(filterRecords(records, { sportKey: 'running' }).length).toBe(2)
    expect(filterRecords(records, { sportKey: 'yoga' }).length).toBe(1)
    expect(filterRecords(records, { sportKey: 'all' }).length).toBe(4)
  })

  it('按日期范围筛选', () => {
    const result = filterRecords(records, {
      startDate: '2025-06-01',
      endDate: '2025-06-05',
    })
    expect(result.length).toBe(2)
  })

  it('按日期 key 筛选', () => {
    const d = formatDate(new Date(2025, 5, 1).getTime())
    const result = filterRecords(records, { dateKey: d })
    expect(result.length).toBe(1)
  })

  it('按月份筛选', () => {
    const result = filterRecords(records, { monthKey: '2025-06' })
    expect(result.length).toBe(3)
  })
})

describe('sortRecords', () => {
  const records = [
    { id: '1', timestamp: 100, duration: 30, calories: 294 },
    { id: '2', timestamp: 300, duration: 60, calories: 588 },
    { id: '3', timestamp: 200, duration: 45, calories: 441 },
  ]

  it('按时间戳降序（默认）', () => {
    const result = sortRecords(records)
    expect(result.map((r) => r.id)).toEqual(['2', '3', '1'])
  })

  it('按时间戳升序', () => {
    const result = sortRecords(records, 'timestamp', 'asc')
    expect(result.map((r) => r.id)).toEqual(['1', '3', '2'])
  })

  it('按时长降序', () => {
    const result = sortRecords(records, 'duration', 'desc')
    expect(result.map((r) => r.duration)).toEqual([60, 45, 30])
  })

  it('按热量降序', () => {
    const result = sortRecords(records, 'calories', 'desc')
    expect(result.map((r) => r.calories)).toEqual([588, 441, 294])
  })

  it('不修改原数组', () => {
    const original = [...records]
    sortRecords(records, 'duration')
    expect(records).toEqual(original)
  })
})

describe('paginateRecords', () => {
  const records = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }))

  it('第一页正确', () => {
    const result = paginateRecords(records, 1, 10)
    expect(result.items.length).toBe(10)
    expect(result.items[0].id).toBe('1')
    expect(result.items[9].id).toBe('10')
    expect(result.currentPage).toBe(1)
    expect(result.totalPage).toBe(3)
    expect(result.total).toBe(25)
  })

  it('最后一页正确', () => {
    const result = paginateRecords(records, 3, 10)
    expect(result.items.length).toBe(5)
    expect(result.currentPage).toBe(3)
  })

  it('页码超出范围时修正', () => {
    const result = paginateRecords(records, 100, 10)
    expect(result.currentPage).toBe(3)
  })

  it('页码小于1时修正', () => {
    const result = paginateRecords(records, 0, 10)
    expect(result.currentPage).toBe(1)
  })

  it('空列表返回第一页', () => {
    const result = paginateRecords([], 1, 10)
    expect(result.items.length).toBe(0)
    expect(result.totalPage).toBe(1)
  })
})

describe('getRecordList', () => {
  const records = [
    makeRecord({ id: '1', sportKey: 'running', timestamp: 300 }),
    makeRecord({ id: '2', sportKey: 'yoga', timestamp: 200 }),
    makeRecord({ id: '3', sportKey: 'running', timestamp: 100 }),
  ]

  it('组合筛选、排序、分页', () => {
    const result = getRecordList(records, {
      sportKey: 'running',
      sortBy: 'timestamp',
      sortOrder: 'desc',
      page: 1,
      pageSize: 10,
    })
    expect(result.items.length).toBe(2)
    expect(result.items[0].timestamp).toBe(300)
    expect(result.items[1].timestamp).toBe(100)
  })

  it('无选项时返回全部并按时间戳降序', () => {
    const result = getRecordList(records, {})
    expect(result.items.length).toBe(3)
    expect(result.items[0].timestamp).toBe(300)
  })
})

describe('Summary calculations', () => {
  const wedTs = new Date(2025, 5, 4, 10, 0).getTime()
  const wed = formatDate(wedTs)
  const thuTs = new Date(2025, 5, 5, 10, 0).getTime()
  const thu = formatDate(thuTs)
  const friTs = new Date(2025, 5, 6, 10, 0).getTime()

  const records = [
    makeRecord({ id: '1', sportKey: 'running', duration: 30, distance: 5, timestamp: wedTs, dateKey: wed, calories: 294 }),
    makeRecord({ id: '2', sportKey: 'yoga', duration: 45, distance: null, timestamp: thuTs, dateKey: thu, calories: 112 }),
    makeRecord({ id: '3', sportKey: 'running', duration: 20, distance: 3, timestamp: friTs, dateKey: formatDate(friTs), calories: 196 }),
  ]

  it('calculateDailySummary 计算每日汇总', () => {
    const summary = calculateDailySummary(records, wed)
    expect(summary.totalDuration).toBe(30)
    expect(summary.totalCalories).toBe(294)
    expect(summary.totalDistance).toBe(5)
    expect(summary.sessionCount).toBe(1)
  })

  it('calculateDailySummary 无数据时返回 0', () => {
    const summary = calculateDailySummary([], wed)
    expect(summary.totalDuration).toBe(0)
    expect(summary.totalCalories).toBe(0)
    expect(summary.totalDistance).toBe(0)
    expect(summary.sessionCount).toBe(0)
  })

  it('calculateWeeklySummary 计算每周汇总（含日均）', () => {
    const weekKey = getWeekKey(wedTs)
    const summary = calculateWeeklySummary(records, weekKey)
    expect(summary.totalDuration).toBe(95)
    expect(summary.totalCalories).toBe(602)
    expect(summary.totalDistance).toBe(8)
    expect(summary.sessionCount).toBe(3)
    expect(summary.avgDailyMinutes).toBeGreaterThan(0)
  })

  it('calculateMonthlySummary 计算每月汇总（含日均）', () => {
    const monthKey = getMonthKey(wedTs)
    const summary = calculateMonthlySummary(records, monthKey)
    expect(summary.totalDuration).toBe(95)
    expect(summary.sessionCount).toBe(3)
    expect(typeof summary.avgDailyMinutes).toBe('number')
  })

  it('calculateSummaryByDimension 按维度切换', () => {
    const daySummary = calculateSummaryByDimension(records, 'day')
    expect(typeof daySummary.totalDuration).toBe('number')
    expect(typeof daySummary.totalCalories).toBe('number')
    expect(typeof daySummary.totalDistance).toBe('number')
    expect(typeof daySummary.sessionCount).toBe('number')

    const weekSummary = calculateSummaryByDimension(records, 'week')
    expect(typeof weekSummary.avgDailyMinutes).toBe('number')
    expect(typeof weekSummary.totalDuration).toBe('number')
    expect(typeof weekSummary.sessionCount).toBe('number')

    const monthSummary = calculateSummaryByDimension(records, 'month')
    expect(typeof monthSummary.avgDailyMinutes).toBe('number')
    expect(typeof monthSummary.totalDuration).toBe('number')
    expect(typeof monthSummary.sessionCount).toBe('number')
  })
})

describe('buildTrendData', () => {
  it('构建近 N 天趋势数据', () => {
    const data = buildTrendData([], 7)
    expect(data.length).toBe(7)
    data.forEach((d) => {
      expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(d.label).toMatch(/^\d{1,2}\/\d{1,2}$/)
      expect(typeof d.calories).toBe('number')
      expect(typeof d.minutes).toBe('number')
    })
  })

  it('默认构建近 30 天趋势数据', () => {
    const data = buildTrendData([])
    expect(data.length).toBe(30)
  })

  it('正确统计每天的热量和时长', () => {
    const todayTs = Date.now()
    const todayKey = formatDate(todayTs)
    const records = [
      makeRecord({ id: '1', timestamp: todayTs, dateKey: todayKey, duration: 30, calories: 294 }),
      makeRecord({ id: '2', timestamp: todayTs, dateKey: todayKey, duration: 20, calories: 196 }),
    ]
    const data = buildTrendData(records, 1)
    expect(data[0].calories).toBe(490)
    expect(data[0].minutes).toBe(50)
  })
})

describe('buildSportDistribution', () => {
  it('构建运动类型分布数据', () => {
    const records = [
      makeRecord({ id: '1', sportKey: 'running', duration: 30 }),
      makeRecord({ id: '2', sportKey: 'running', duration: 20 }),
      makeRecord({ id: '3', sportKey: 'yoga', duration: 45 }),
      makeRecord({ id: '4', sportKey: 'swimming', duration: 60 }),
    ]
    const data = buildSportDistribution(records)
    expect(data.length).toBe(3)
    expect(data[0].name).toBe('游泳')
    expect(data[0].value).toBe(60)
    expect(data[1].name).toBe('跑步')
    expect(data[1].value).toBe(50)
    expect(data[2].name).toBe('瑜伽')
    expect(data[2].value).toBe(45)
  })

  it('无数据时返回空数组', () => {
    expect(buildSportDistribution([])).toEqual([])
  })
})

describe('validateGoals', () => {
  it('验证通过时返回空对象', () => {
    const errors = validateGoals({ dailyMinutes: 30, weeklySessions: 3 })
    expect(Object.keys(errors).length).toBe(0)
  })

  it('每日目标为空时报错', () => {
    expect(validateGoals({ dailyMinutes: '', weeklySessions: 3 }).dailyMinutes).toBeTruthy()
  })

  it('每日目标为非正整数时报错', () => {
    expect(validateGoals({ dailyMinutes: 0, weeklySessions: 3 }).dailyMinutes).toBeTruthy()
    expect(validateGoals({ dailyMinutes: -1, weeklySessions: 3 }).dailyMinutes).toBeTruthy()
    expect(validateGoals({ dailyMinutes: 30.5, weeklySessions: 3 }).dailyMinutes).toBeTruthy()
  })

  it('每日目标超过 1440 分钟时报错', () => {
    expect(validateGoals({ dailyMinutes: 1441, weeklySessions: 3 }).dailyMinutes).toBeTruthy()
  })

  it('每周目标为空时报错', () => {
    expect(validateGoals({ dailyMinutes: 30, weeklySessions: '' }).weeklySessions).toBeTruthy()
  })

  it('每周目标为非正整数时报错', () => {
    expect(validateGoals({ dailyMinutes: 30, weeklySessions: 0 }).weeklySessions).toBeTruthy()
    expect(validateGoals({ dailyMinutes: 30, weeklySessions: -1 }).weeklySessions).toBeTruthy()
  })

  it('每周目标超过 50 次时报错', () => {
    expect(validateGoals({ dailyMinutes: 30, weeklySessions: 51 }).weeklySessions).toBeTruthy()
  })
})

describe('setGoals', () => {
  it('数据无效时返回失败', () => {
    const result = setGoals({ dailyMinutes: 30, weeklySessions: 3 }, { dailyMinutes: '', weeklySessions: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功设置目标', () => {
    const result = setGoals({ dailyMinutes: 30, weeklySessions: 3 }, { dailyMinutes: 60, weeklySessions: 5 })
    expect(result.success).toBe(true)
    expect(result.goals.dailyMinutes).toBe(60)
    expect(result.goals.weeklySessions).toBe(5)
  })
})

describe('calculateDailyProgress / calculateWeeklyProgress', () => {
  const today = formatDate(Date.now())
  const todayTs = Date.now()
  const weekKey = getWeekKey(todayTs)

  const records = [
    makeRecord({ id: '1', timestamp: todayTs, dateKey: today, duration: 20 }),
    makeRecord({ id: '2', timestamp: todayTs, dateKey: today, duration: 25 }),
  ]

  it('calculateDailyProgress 计算每日进度', () => {
    const progress = calculateDailyProgress(records, 60)
    expect(progress.currentMinutes).toBe(45)
    expect(progress.goalMinutes).toBe(60)
    expect(progress.percent).toBeCloseTo(75)
    expect(progress.isCompleted).toBe(false)
  })

  it('calculateDailyProgress 达到目标', () => {
    const progress = calculateDailyProgress(records, 30)
    expect(progress.isCompleted).toBe(true)
    expect(progress.percent).toBe(100)
  })

  it('calculateWeeklyProgress 计算每周进度', () => {
    const progress = calculateWeeklyProgress(records, 5)
    expect(progress.currentSessions).toBe(2)
    expect(progress.goalSessions).toBe(5)
    expect(progress.percent).toBe(40)
    expect(progress.isCompleted).toBe(false)
  })

  it('calculateWeeklyProgress 达到目标', () => {
    const progress = calculateWeeklyProgress(records, 2)
    expect(progress.isCompleted).toBe(true)
    expect(progress.percent).toBe(100)
  })
})

describe('getWeekDates', () => {
  it('返回指定周的 7 个日期', () => {
    const weekKey = getWeekKey(new Date(2025, 5, 8).getTime())
    const dates = getWeekDates(weekKey)
    expect(dates.length).toBe(7)
    dates.forEach((d) => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it('无效周 key 返回空数组', () => {
    expect(getWeekDates('')).toEqual([])
    expect(getWeekDates('invalid')).toEqual([])
  })
})

describe('constants verification', () => {
  it('所有运动类型都有有效的 MET 值', () => {
    SPORT_TYPES.forEach((s) => {
      expect(typeof s.met).toBe('number')
      expect(s.met).toBeGreaterThan(0)
    })
  })

  it('SPORT_MAP 包含所有运动类型', () => {
    SPORT_KEYS.forEach((k) => {
      expect(SPORT_MAP[k]).toBeTruthy()
    })
  })

  it('DEFAULT_BODY_WEIGHT 为正数', () => {
    expect(DEFAULT_BODY_WEIGHT).toBeGreaterThan(0)
  })

  it('DEFAULT_GOALS 字段有效', () => {
    expect(DEFAULT_GOALS.dailyMinutes).toBeGreaterThan(0)
    expect(DEFAULT_GOALS.weeklySessions).toBeGreaterThan(0)
  })
})
