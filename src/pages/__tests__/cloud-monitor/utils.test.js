import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ALERT_LEVELS,
  HEALTH_WEIGHTS,
  MAX_ALERT_COUNT,
  MAX_TREND_POINTS,
  METRIC_TYPES,
} from '../../cloud-monitor/constants'
import {
  randomInRange,
  randomInt,
  clamp,
  calculateHealthScore,
  getHealthLabel,
  getHealthColor,
  classifyAlertLevel,
  filterAlertsByLevel,
  generateAlert,
  addAlertToList,
  generateRegionData,
  fluctuateRegionData,
  generateMetrics,
  fluctuateMetrics,
  filterDataByRegion,
  generateInitialTrendData,
  appendTrendPoint,
  evictOldTrendPoints,
  computeTrendStats,
  formatTimeAgo,
  formatCost,
  loadAutoRefreshState,
  saveAutoRefreshState,
  getGaugeColor,
} from '../../cloud-monitor/utils'

describe('数学工具函数', () => {
  it('randomInRange 返回指定范围内的数字', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomInRange(10, 20)
      expect(val).toBeGreaterThanOrEqual(10)
      expect(val).toBeLessThanOrEqual(20)
    }
  })

  it('randomInt 返回指定范围内的整数', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomInt(1, 10)
      expect(Number.isInteger(val)).toBe(true)
      expect(val).toBeGreaterThanOrEqual(1)
      expect(val).toBeLessThanOrEqual(10)
    }
  })

  it('clamp 将值限制在范围内', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })
})

describe('健康评分计算算法', () => {
  it('计算健康评分 = 100 - 加权平均使用率', () => {
    const metrics = { cpu: 50, memory: 40, disk: 30 }
    const expected = 100 - (50 * 0.4 + 40 * 0.35 + 30 * 0.25)
    expect(calculateHealthScore(metrics)).toBe(Math.round(expected))
  })

  it('所有使用率为0时评分为100', () => {
    expect(calculateHealthScore({ cpu: 0, memory: 0, disk: 0 })).toBe(100)
  })

  it('所有使用率为100时评分为0', () => {
    expect(calculateHealthScore({ cpu: 100, memory: 100, disk: 100 })).toBe(0)
  })

  it('缺少指标时默认为0计算', () => {
    expect(calculateHealthScore({ cpu: 50 })).toBe(
      Math.round(100 - (50 * 0.4 + 0 * 0.35 + 0 * 0.25))
    )
  })

  it('空对象缺少指标按0计算返回100', () => {
    expect(calculateHealthScore({})).toBe(100)
  })

  it('null/undefined 返回0', () => {
    expect(calculateHealthScore(null)).toBe(0)
    expect(calculateHealthScore(undefined)).toBe(0)
  })

  it('权重配比验证：CPU 40%, 内存 35%, 磁盘 25%', () => {
    const metrics = { cpu: 100, memory: 0, disk: 0 }
    expect(calculateHealthScore(metrics)).toBe(60)

    const metrics2 = { cpu: 0, memory: 100, disk: 0 }
    expect(calculateHealthScore(metrics2)).toBe(65)

    const metrics3 = { cpu: 0, memory: 0, disk: 100 }
    expect(calculateHealthScore(metrics3)).toBe(75)
  })

  it('非数字值按0计算', () => {
    const metrics = { cpu: 'high', memory: null, disk: undefined }
    expect(calculateHealthScore(metrics)).toBe(100)
  })
})

describe('健康标签与颜色', () => {
  it('getHealthLabel: >=90 返回优秀', () => {
    expect(getHealthLabel(95)).toBe('优秀')
    expect(getHealthLabel(90)).toBe('优秀')
  })

  it('getHealthLabel: 70-89 返回良好', () => {
    expect(getHealthLabel(89)).toBe('良好')
    expect(getHealthLabel(70)).toBe('良好')
  })

  it('getHealthLabel: <70 返回需关注', () => {
    expect(getHealthLabel(69)).toBe('需关注')
    expect(getHealthLabel(0)).toBe('需关注')
  })

  it('getHealthLabel: 非数字返回需关注', () => {
    expect(getHealthLabel(NaN)).toBe('需关注')
    expect(getHealthLabel(null)).toBe('需关注')
  })

  it('getHealthColor: >=90 绿色', () => {
    expect(getHealthColor(95)).toBe('#10b981')
  })

  it('getHealthColor: 70-89 黄色', () => {
    expect(getHealthColor(75)).toBe('#f59e0b')
  })

  it('getHealthColor: <70 红色', () => {
    expect(getHealthColor(50)).toBe('#ef4444')
  })
})

describe('告警级别分类与过滤', () => {
  it('classifyAlertLevel: >=90 严重', () => {
    expect(classifyAlertLevel(95)).toBe(ALERT_LEVELS.CRITICAL)
  })

  it('classifyAlertLevel: 70-89 警告', () => {
    expect(classifyAlertLevel(75)).toBe(ALERT_LEVELS.WARNING)
  })

  it('classifyAlertLevel: <70 信息', () => {
    expect(classifyAlertLevel(50)).toBe(ALERT_LEVELS.INFO)
  })

  it('classifyAlertLevel: 边界值', () => {
    expect(classifyAlertLevel(90)).toBe(ALERT_LEVELS.CRITICAL)
    expect(classifyAlertLevel(70)).toBe(ALERT_LEVELS.WARNING)
  })

  it('classifyAlertLevel: 非数字返回 INFO', () => {
    expect(classifyAlertLevel(NaN)).toBe(ALERT_LEVELS.INFO)
    expect(classifyAlertLevel(null)).toBe(ALERT_LEVELS.INFO)
  })

  it('filterAlertsByLevel: 按级别过滤', () => {
    const alerts = [
      { id: 1, level: ALERT_LEVELS.CRITICAL },
      { id: 2, level: ALERT_LEVELS.WARNING },
      { id: 3, level: ALERT_LEVELS.INFO },
      { id: 4, level: ALERT_LEVELS.CRITICAL },
    ]
    expect(filterAlertsByLevel(alerts, ALERT_LEVELS.CRITICAL)).toHaveLength(2)
    expect(filterAlertsByLevel(alerts, ALERT_LEVELS.WARNING)).toHaveLength(1)
    expect(filterAlertsByLevel(alerts, ALERT_LEVELS.INFO)).toHaveLength(1)
  })

  it('filterAlertsByLevel: all 或空返回全部', () => {
    const alerts = [
      { id: 1, level: ALERT_LEVELS.CRITICAL },
      { id: 2, level: ALERT_LEVELS.WARNING },
    ]
    expect(filterAlertsByLevel(alerts, 'all')).toHaveLength(2)
    expect(filterAlertsByLevel(alerts, '')).toHaveLength(2)
    expect(filterAlertsByLevel(alerts, null)).toHaveLength(2)
  })

  it('filterAlertsByLevel: 非数组返回空数组', () => {
    expect(filterAlertsByLevel(null, 'all')).toEqual([])
    expect(filterAlertsByLevel(undefined, 'all')).toEqual([])
  })
})

describe('模拟数据生成器', () => {
  it('generateAlert 生成正确结构的告警', () => {
    const alert = generateAlert()
    expect(alert).toHaveProperty('id')
    expect(alert).toHaveProperty('level')
    expect(alert).toHaveProperty('title')
    expect(alert).toHaveProperty('resource')
    expect(alert).toHaveProperty('time')
    expect(alert).toHaveProperty('silenced')
    expect(typeof alert.time).toBe('number')
    expect(Object.values(ALERT_LEVELS)).toContain(alert.level)
  })

  it('generateAlert silenced 标记', () => {
    const alert = generateAlert(true)
    expect(alert.silenced).toBe(true)
  })

  it('addAlertToList 新告警添加到顶部', () => {
    const list = [{ id: 'old' }]
    const newAlert = { id: 'new' }
    const result = addAlertToList(list, newAlert)
    expect(result[0].id).toBe('new')
    expect(result).toHaveLength(2)
  })

  it('addAlertToList 超过最大数量时淘汰最旧的', () => {
    let list = []
    for (let i = 0; i < MAX_ALERT_COUNT + 10; i++) {
      list = addAlertToList(list, { id: `a_${i}` })
    }
    expect(list.length).toBe(MAX_ALERT_COUNT)
  })

  it('addAlertToList 非数组输入', () => {
    const result = addAlertToList(null, { id: 'a' })
    expect(result).toHaveLength(1)
  })

  it('generateRegionData 生成所有地域数据', () => {
    const data = generateRegionData()
    expect(data).toHaveLength(5)
    data.forEach((r) => {
      expect(r).toHaveProperty('id')
      expect(r).toHaveProperty('name')
      expect(r).toHaveProperty('instances')
      expect(r).toHaveProperty('alerts')
      expect(r).toHaveProperty('cost')
      expect(typeof r.instances).toBe('number')
      expect(typeof r.alerts).toBe('number')
      expect(typeof r.cost).toBe('number')
    })
  })

  it('fluctuateRegionData 波动后数据仍有效', () => {
    const data = generateRegionData()
    const result = fluctuateRegionData(data)
    expect(result).toHaveLength(data.length)
    result.forEach((r) => {
      expect(r.instances).toBeGreaterThanOrEqual(1)
      expect(r.alerts).toBeGreaterThanOrEqual(0)
    })
  })

  it('fluctuateRegionData 非数组返回空数组', () => {
    expect(fluctuateRegionData(null)).toEqual([])
    expect(fluctuateRegionData(undefined)).toEqual([])
  })

  it('generateMetrics 生成有效指标', () => {
    const m = generateMetrics()
    expect(m.cpu).toBeGreaterThanOrEqual(0)
    expect(m.cpu).toBeLessThanOrEqual(100)
    expect(m.memory).toBeGreaterThanOrEqual(0)
    expect(m.memory).toBeLessThanOrEqual(100)
    expect(m.disk).toBeGreaterThanOrEqual(0)
    expect(m.disk).toBeLessThanOrEqual(100)
  })

  it('fluctuateMetrics 基于前值波动且不越界', () => {
    const prev = { cpu: 50, memory: 50, disk: 50 }
    const next = fluctuateMetrics(prev)
    expect(next.cpu).toBeGreaterThanOrEqual(0)
    expect(next.cpu).toBeLessThanOrEqual(100)
    expect(next.memory).toBeGreaterThanOrEqual(0)
    expect(next.memory).toBeLessThanOrEqual(100)
    expect(next.disk).toBeGreaterThanOrEqual(0)
    expect(next.disk).toBeLessThanOrEqual(100)
  })

  it('fluctuateMetrics 边界值不越界', () => {
    const prev = { cpu: 0, memory: 100, disk: 0 }
    const next = fluctuateMetrics(prev)
    expect(next.cpu).toBeGreaterThanOrEqual(0)
    expect(next.cpu).toBeLessThanOrEqual(100)
    expect(next.memory).toBeGreaterThanOrEqual(0)
    expect(next.memory).toBeLessThanOrEqual(100)
  })

  it('fluctuateMetrics null 输入生成新指标', () => {
    const m = fluctuateMetrics(null)
    expect(m).toHaveProperty('cpu')
    expect(m).toHaveProperty('memory')
    expect(m).toHaveProperty('disk')
  })
})

describe('地域筛选数据过滤', () => {
  it('filterDataByRegion: all 返回原数据', () => {
    const data = { foo: 'bar', regionId: 'east' }
    const result = filterDataByRegion(data, 'all')
    expect(result).toEqual(data)
  })

  it('filterDataByRegion: 指定地域返回带 regionId 的数据', () => {
    const data = { foo: 'bar' }
    const result = filterDataByRegion(data, 'east')
    expect(result.regionId).toBe('east')
    expect(result.foo).toBe('bar')
  })

  it('filterDataByRegion: 空字符串返回原数据', () => {
    const data = { foo: 'bar' }
    const result = filterDataByRegion(data, '')
    expect(result).toEqual(data)
  })

  it('filterDataByRegion: null 数据直接返回', () => {
    expect(filterDataByRegion(null, 'east')).toBe(null)
  })
})

describe('时间序列数据追加与淘汰逻辑', () => {
  it('generateInitialTrendData 生成指定数量的数据点', () => {
    const data = generateInitialTrendData()
    expect(data.length).toBe(30)
    data.forEach((p) => {
      expect(p).toHaveProperty('time')
      expect(p).toHaveProperty('cpu')
      expect(p).toHaveProperty('memory')
      expect(p).toHaveProperty('disk')
      expect(p.cpu).toBeGreaterThanOrEqual(0)
      expect(p.cpu).toBeLessThanOrEqual(100)
    })
  })

  it('generateInitialTrendData 时间戳递增', () => {
    const data = generateInitialTrendData()
    for (let i = 1; i < data.length; i++) {
      expect(data[i].time).toBeGreaterThan(data[i - 1].time)
    }
  })

  it('appendTrendPoint 追加数据点', () => {
    const points = [{ time: 1, cpu: 50, memory: 50, disk: 50 }]
    const newPoint = { time: 2, cpu: 60, memory: 60, disk: 60 }
    const result = appendTrendPoint(points, newPoint)
    expect(result).toHaveLength(2)
    expect(result[1]).toEqual(newPoint)
  })

  it('appendTrendPoint 超过最大点数时淘汰最旧的', () => {
    let points = []
    for (let i = 0; i < MAX_TREND_POINTS + 10; i++) {
      points = appendTrendPoint(points, { time: i, cpu: 50, memory: 50, disk: 50 })
    }
    expect(points.length).toBeLessThanOrEqual(MAX_TREND_POINTS)
  })

  it('appendTrendPoint 非数组输入', () => {
    const result = appendTrendPoint(null, { time: 1, cpu: 50, memory: 50, disk: 50 })
    expect(result).toHaveLength(1)
  })

  it('appendTrendPoint 无新点时返回副本', () => {
    const points = [{ time: 1, cpu: 50, memory: 50, disk: 50 }]
    const result = appendTrendPoint(points, null)
    expect(result).toHaveLength(1)
    expect(result).not.toBe(points)
  })

  it('evictOldTrendPoints 淘汰超时数据点', () => {
    const now = Date.now()
    const points = [
      { time: now - 200000, cpu: 50, memory: 50, disk: 50 },
      { time: now - 100000, cpu: 60, memory: 60, disk: 60 },
      { time: now - 5000, cpu: 70, memory: 70, disk: 70 },
    ]
    const result = evictOldTrendPoints(points, 30000)
    expect(result).toHaveLength(1)
    expect(result[0].cpu).toBe(70)
  })

  it('evictOldTrendPoints 所有数据在范围内则保留', () => {
    const now = Date.now()
    const points = [
      { time: now - 1000, cpu: 50, memory: 50, disk: 50 },
      { time: now, cpu: 60, memory: 60, disk: 60 },
    ]
    const result = evictOldTrendPoints(points, 30000)
    expect(result).toHaveLength(2)
  })

  it('evictOldTrendPoints 非数组返回空数组', () => {
    expect(evictOldTrendPoints(null, 30000)).toEqual([])
    expect(evictOldTrendPoints(undefined, 30000)).toEqual([])
  })
})

describe('资源使用率聚合统计函数', () => {
  it('computeTrendStats 正确计算最大最小均值', () => {
    const points = [
      { time: 1, cpu: 20, memory: 30, disk: 40 },
      { time: 2, cpu: 80, memory: 50, disk: 60 },
      { time: 3, cpu: 50, memory: 70, disk: 80 },
    ]
    const stats = computeTrendStats(points, 'cpu')
    expect(stats.max).toBe(80)
    expect(stats.min).toBe(20)
    expect(stats.avg).toBe(50)
  })

  it('computeTrendStats 空数组返回0', () => {
    const stats = computeTrendStats([], 'cpu')
    expect(stats).toEqual({ max: 0, min: 0, avg: 0 })
  })

  it('computeTrendStats 非数组返回0', () => {
    const stats = computeTrendStats(null, 'cpu')
    expect(stats).toEqual({ max: 0, min: 0, avg: 0 })
  })

  it('computeTrendStats 单个数据点', () => {
    const points = [{ time: 1, cpu: 75, memory: 50, disk: 60 }]
    const stats = computeTrendStats(points, 'cpu')
    expect(stats.max).toBe(75)
    expect(stats.min).toBe(75)
    expect(stats.avg).toBe(75)
  })

  it('computeTrendStats 结果保留1位小数', () => {
    const points = [
      { time: 1, cpu: 33.333, memory: 50, disk: 60 },
      { time: 2, cpu: 66.666, memory: 50, disk: 60 },
    ]
    const stats = computeTrendStats(points, 'cpu')
    expect(stats.max).toBe(66.7)
    expect(stats.min).toBe(33.3)
    expect(stats.avg).toBe(50)
  })
})

describe('时间格式化', () => {
  it('formatTimeAgo: 刚刚', () => {
    expect(formatTimeAgo(Date.now())).toBe('刚刚')
    expect(formatTimeAgo(Date.now() - 30000)).toBe('刚刚')
  })

  it('formatTimeAgo: N 分钟前', () => {
    expect(formatTimeAgo(Date.now() - 120000)).toBe('2 分钟前')
    expect(formatTimeAgo(Date.now() - 3500000)).toBe('58 分钟前')
  })

  it('formatTimeAgo: N 小时前', () => {
    expect(formatTimeAgo(Date.now() - 7200000)).toBe('2 小时前')
  })

  it('formatTimeAgo: N 天前', () => {
    expect(formatTimeAgo(Date.now() - 172800000)).toBe('2 天前')
  })

  it('formatTimeAgo: 空值返回空字符串', () => {
    expect(formatTimeAgo(null)).toBe('')
    expect(formatTimeAgo(0)).toBe('') 
  })
})

describe('费用格式化', () => {
  it('formatCost: 小于1万显示元', () => {
    expect(formatCost(9999)).toBe('¥9,999')
  })

  it('formatCost: 大于等于1万显示万', () => {
    expect(formatCost(10000)).toBe('¥1.0万')
    expect(formatCost(28000)).toBe('¥2.8万')
  })

  it('formatCost: 0', () => {
    expect(formatCost(0)).toBe('¥0')
  })

  it('formatCost: 非数字', () => {
    expect(formatCost(null)).toBe('¥0')
    expect(formatCost(undefined)).toBe('¥0')
    expect(formatCost('abc')).toBe('¥0')
  })
})

describe('自动刷新状态持久化', () => {
  let store

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => store[key] ?? null),
      setItem: vi.fn((key, val) => { store[key] = val }),
      removeItem: vi.fn((key) => { delete store[key] }),
      clear: vi.fn(() => { store = {} }),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loadAutoRefreshState 默认返回 true', () => {
    expect(loadAutoRefreshState()).toBe(true)
  })

  it('loadAutoRefreshState 读取 false', () => {
    store['cloud-monitor-auto-refresh'] = 'false'
    expect(loadAutoRefreshState()).toBe(false)
  })

  it('loadAutoRefreshState 读取 true', () => {
    store['cloud-monitor-auto-refresh'] = 'true'
    expect(loadAutoRefreshState()).toBe(true)
  })

  it('saveAutoRefreshState 保存状态', () => {
    saveAutoRefreshState(false)
    expect(store['cloud-monitor-auto-refresh']).toBe('false')
    saveAutoRefreshState(true)
    expect(store['cloud-monitor-auto-refresh']).toBe('true')
  })

  it('loadAutoRefreshState localStorage 异常时返回 true', () => {
    localStorage.getItem.mockImplementation(() => {
      throw new Error('access denied')
    })
    expect(loadAutoRefreshState()).toBe(true)
  })
})

describe('仪表盘颜色', () => {
  it('getGaugeColor: <60 绿色', () => {
    expect(getGaugeColor(30)).toBe('#10b981')
    expect(getGaugeColor(59)).toBe('#10b981')
  })

  it('getGaugeColor: 60-79 黄色', () => {
    expect(getGaugeColor(60)).toBe('#f59e0b')
    expect(getGaugeColor(79)).toBe('#f59e0b')
  })

  it('getGaugeColor: >=80 红色', () => {
    expect(getGaugeColor(80)).toBe('#ef4444')
    expect(getGaugeColor(95)).toBe('#ef4444')
  })

  it('getGaugeColor: 非数字返回绿色', () => {
    expect(getGaugeColor(NaN)).toBe('#10b981')
    expect(getGaugeColor(null)).toBe('#10b981')
  })
})
