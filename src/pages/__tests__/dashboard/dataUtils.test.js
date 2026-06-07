import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isDateInRange,
  filterDataByDateRange,
  getPreviousPeriod,
  sumMetric,
  avgMetric,
  calculateMetricValue,
  calculateTrend,
  buildSummaryMetrics,
  buildLineChartData,
  buildBarChartData,
  buildPieChartData,
  formatNumber,
  reorderLayout,
  validateDateRange,
  saveLayoutToStorage,
  loadLayoutFromStorage,
  clearLayoutStorage,
  LAYOUT_STORAGE_KEY,
} from '@/pages/dashboard/utils/dataUtils'

const mockData = [
  {
    date: '2024-01-01',
    totalSales: 10000,
    orderCount: 100,
    userCount: 500,
    conversionRate: 20,
    byCategory: { 电子产品: { sales: 4000, orders: 40, users: 200 }, 服装: { sales: 3000, orders: 30, users: 150 } },
  },
  {
    date: '2024-01-02',
    totalSales: 20000,
    orderCount: 200,
    userCount: 800,
    conversionRate: 25,
    byCategory: { 电子产品: { sales: 8000, orders: 80, users: 300 }, 服装: { sales: 6000, orders: 60, users: 250 } },
  },
  {
    date: '2024-01-03',
    totalSales: 30000,
    orderCount: 300,
    userCount: 1000,
    conversionRate: 30,
    byCategory: { 电子产品: { sales: 12000, orders: 120, users: 400 }, 服装: { sales: 9000, orders: 90, users: 300 } },
  },
  {
    date: '2024-01-10',
    totalSales: 50000,
    orderCount: 500,
    userCount: 2000,
    conversionRate: 25,
    byCategory: { 电子产品: { sales: 20000, orders: 200, users: 800 }, 服装: { sales: 15000, orders: 150, users: 600 } },
  },
]

describe('isDateInRange', () => {
  it('should return true for date within range', () => {
    expect(isDateInRange('2024-01-15', '2024-01-01', '2024-01-31')).toBe(true)
    expect(isDateInRange('2024-01-01', '2024-01-01', '2024-01-31')).toBe(true)
    expect(isDateInRange('2024-01-31', '2024-01-01', '2024-01-31')).toBe(true)
  })

  it('should return false for date outside range', () => {
    expect(isDateInRange('2023-12-31', '2024-01-01', '2024-01-31')).toBe(false)
    expect(isDateInRange('2024-02-01', '2024-01-01', '2024-01-31')).toBe(false)
  })

  it('should return false for null or undefined inputs', () => {
    expect(isDateInRange(null, '2024-01-01', '2024-01-31')).toBe(false)
    expect(isDateInRange('2024-01-15', null, '2024-01-31')).toBe(false)
    expect(isDateInRange('2024-01-15', '2024-01-01', null)).toBe(false)
  })
})

describe('filterDataByDateRange', () => {
  it('should filter data within the date range (inclusive)', () => {
    const result = filterDataByDateRange(mockData, '2024-01-01', '2024-01-03')
    expect(result).toHaveLength(3)
    expect(result.map((d) => d.date)).toEqual(['2024-01-01', '2024-01-02', '2024-01-03'])
  })

  it('should return empty array for non-overlapping range', () => {
    const result = filterDataByDateRange(mockData, '2024-02-01', '2024-02-10')
    expect(result).toHaveLength(0)
  })

  it('should return empty array for invalid input', () => {
    expect(filterDataByDateRange(null, '2024-01-01', '2024-01-31')).toEqual([])
    expect(filterDataByDateRange(undefined, '2024-01-01', '2024-01-31')).toEqual([])
  })
})

describe('getPreviousPeriod', () => {
  it('should return the immediately preceding period of same length', () => {
    const result = getPreviousPeriod('2024-02-01', '2024-02-10')
    expect(result.startDate).toBe('2024-01-22')
    expect(result.endDate).toBe('2024-01-31')
  })

  it('should handle single-day range', () => {
    const result = getPreviousPeriod('2024-01-15', '2024-01-15')
    expect(result.startDate).toBe('2024-01-14')
    expect(result.endDate).toBe('2024-01-14')
  })

  it('should handle month boundary crossing', () => {
    const result = getPreviousPeriod('2024-03-01', '2024-03-05')
    expect(result.startDate).toBe('2024-02-25')
    expect(result.endDate).toBe('2024-02-29')
  })
})

describe('sumMetric', () => {
  it('should sum numeric values for a given metric key', () => {
    expect(sumMetric(mockData, 'totalSales')).toBe(110000)
    expect(sumMetric(mockData, 'orderCount')).toBe(1100)
  })

  it('should return 0 for empty or invalid input', () => {
    expect(sumMetric([], 'totalSales')).toBe(0)
    expect(sumMetric(null, 'totalSales')).toBe(0)
  })

  it('should handle missing or non-numeric values gracefully', () => {
    const badData = [{ totalSales: null }, { totalSales: 'abc' }, {}]
    expect(sumMetric(badData, 'totalSales')).toBe(0)
  })
})

describe('avgMetric', () => {
  it('should return the average of a metric', () => {
    expect(avgMetric(mockData, 'totalSales')).toBe(27500)
  })

  it('should return 0 for empty input', () => {
    expect(avgMetric([], 'totalSales')).toBe(0)
  })
})

describe('calculateMetricValue', () => {
  it('should calculate sum for totalSales', () => {
    expect(calculateMetricValue(mockData, 'totalSales')).toBe(110000)
  })

  it('should calculate sum for orderCount', () => {
    expect(calculateMetricValue(mockData, 'orderCount')).toBe(1100)
  })

  it('should calculate conversionRate as percentage', () => {
    const result = calculateMetricValue(mockData, 'conversionRate')
    const expectedOrders = 1100
    const expectedUsers = 4300
    const expected = +((expectedOrders / expectedUsers) * 100).toFixed(2)
    expect(result).toBe(expected)
  })

  it('should return 0 for unknown metric key', () => {
    expect(calculateMetricValue(mockData, 'unknownKey')).toBe(0)
  })
})

describe('calculateTrend', () => {
  it('should return up direction when current > previous', () => {
    const result = calculateTrend(120, 100)
    expect(result.direction).toBe('up')
    expect(result.percent).toBe(20)
  })

  it('should return down direction when current < previous', () => {
    const result = calculateTrend(80, 100)
    expect(result.direction).toBe('down')
    expect(result.percent).toBe(20)
  })

  it('should return flat direction when values are nearly equal', () => {
    const result = calculateTrend(100, 100)
    expect(result.direction).toBe('flat')
    expect(result.percent).toBe(0)
  })

  it('should handle previous value of zero with positive current', () => {
    const result = calculateTrend(50, 0)
    expect(result.direction).toBe('up')
    expect(result.percent).toBe(100)
  })

  it('should handle previous value of zero with negative current', () => {
    const result = calculateTrend(-50, 0)
    expect(result.direction).toBe('down')
    expect(result.percent).toBe(100)
  })

  it('should handle previous value of zero with zero current', () => {
    const result = calculateTrend(0, 0)
    expect(result.direction).toBe('flat')
    expect(result.percent).toBe(0)
  })

  it('should handle negative previousValue correctly', () => {
    const result = calculateTrend(0, -100)
    expect(result.direction).toBe('up')
    expect(result.percent).toBe(100)
  })

  it('should handle both values negative (improvement)', () => {
    const result = calculateTrend(-50, -100)
    expect(result.direction).toBe('up')
    expect(result.percent).toBe(50)
  })

  it('should handle both values negative (worsening)', () => {
    const result = calculateTrend(-150, -100)
    expect(result.direction).toBe('down')
    expect(result.percent).toBe(50)
  })

  it('should return flat for NaN inputs', () => {
    expect(calculateTrend(NaN, 100)).toEqual({ direction: 'flat', percent: 0 })
    expect(calculateTrend(100, NaN)).toEqual({ direction: 'flat', percent: 0 })
    expect(calculateTrend('abc', 100)).toEqual({ direction: 'flat', percent: 0 })
  })
})

describe('buildSummaryMetrics', () => {
  it('should build summary metrics with values and trends', () => {
    const currentData = mockData.slice(0, 2)
    const prevData = mockData.slice(2, 4)
    const result = buildSummaryMetrics(currentData, prevData, ['totalSales', 'orderCount'])

    expect(result).toHaveLength(2)
    expect(result[0].key).toBe('totalSales')
    expect(result[0].value).toBe(30000)
    expect(result[0].trend).toBeDefined()
    expect(result[1].key).toBe('orderCount')
    expect(result[1].value).toBe(300)
  })
})

describe('buildLineChartData', () => {
  it('should build line chart data from all data', () => {
    const result = buildLineChartData(mockData, 'totalSales', null)
    expect(result).toHaveLength(4)
    expect(result[0]).toEqual({ date: '2024-01-01', value: 10000 })
    expect(result[3]).toEqual({ date: '2024-01-10', value: 50000 })
  })

  it('should filter by category when selected', () => {
    const result = buildLineChartData(mockData, 'totalSales', '电子产品')
    expect(result[0].value).toBe(4000)
    expect(result[1].value).toBe(8000)
  })

  it('should support orderCount metric', () => {
    const result = buildLineChartData(mockData, 'orderCount', '电子产品')
    expect(result[0].value).toBe(40)
    expect(result[1].value).toBe(80)
  })

  it('should support userCount metric', () => {
    const result = buildLineChartData(mockData, 'userCount', '电子产品')
    expect(result[0].value).toBe(200)
    expect(result[1].value).toBe(300)
  })

  it('should support conversionRate metric for category (derived from orders/users)', () => {
    const result = buildLineChartData(mockData, 'conversionRate', '电子产品')
    expect(result[0].value).toBeCloseTo((40 / 200) * 100)
  })

  it('should return empty array for invalid input', () => {
    expect(buildLineChartData(null, 'totalSales')).toEqual([])
  })
})

describe('buildBarChartData', () => {
  it('should aggregate sales by category when no selection', () => {
    const categories = ['电子产品', '服装']
    const result = buildBarChartData(mockData, categories)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ category: '电子产品', value: 44000, metric: 'sales' })
    expect(result[1]).toEqual({ category: '服装', value: 33000, metric: 'sales' })
  })

  it('should show sub-metric breakdown when a category is selected (not just highlight)', () => {
    const categories = ['电子产品', '服装']
    const result = buildBarChartData(mockData, categories, '电子产品')
    expect(result).toHaveLength(3)
    expect(result[0].category).toBe('销售额')
    expect(result[0].value).toBe(44000)
    expect(result[0].metric).toBe('sales')
    expect(result[1].category).toBe('订单数')
    expect(result[1].metric).toBe('orders')
    expect(result[2].category).toBe('用户数')
    expect(result[2].metric).toBe('users')
    expect(result[1].value).toBeGreaterThan(0)
    expect(result[2].value).toBeGreaterThan(0)
  })

  it('should return empty array for invalid input', () => {
    expect(buildBarChartData(null, ['a'])).toEqual([])
  })
})

describe('buildPieChartData', () => {
  it('should aggregate sales by category for pie chart when no selection', () => {
    const categories = ['电子产品', '服装']
    const result = buildPieChartData(mockData, categories)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: '电子产品', value: 44000, metric: 'sales' })
    expect(result[1]).toEqual({ name: '服装', value: 33000, metric: 'sales' })
  })

  it('should show sub-metric breakdown when a category is selected (not just highlight)', () => {
    const categories = ['电子产品', '服装']
    const result = buildPieChartData(mockData, categories, '服装')
    expect(result).toHaveLength(3)
    expect(result[0].name).toBe('销售额')
    expect(result[0].value).toBe(33000)
    expect(result[0].metric).toBe('sales')
    expect(result[1].name).toBe('订单数')
    expect(result[1].metric).toBe('orders')
    expect(result[2].name).toBe('用户数')
    expect(result[2].metric).toBe('users')
    expect(result[1].value).toBeGreaterThan(0)
    expect(result[2].value).toBeGreaterThan(0)
  })
})

describe('formatNumber', () => {
  it('should format currency correctly', () => {
    expect(formatNumber(999, 'currency')).toBe('¥999')
    expect(formatNumber(15000, 'currency')).toBe('1.50万')
    expect(formatNumber(150000000, 'currency')).toBe('1.50亿')
  })

  it('should format percent correctly', () => {
    expect(formatNumber(12.5, 'percent')).toBe('12.50%')
  })

  it('should format plain numbers correctly', () => {
    expect(formatNumber(15000, 'number')).toBe('1.50万')
    expect(formatNumber(999, 'number')).toBe('999')
  })

  it('should handle null and undefined', () => {
    expect(formatNumber(null)).toBe('0')
    expect(formatNumber(undefined)).toBe('0')
  })
})

describe('reorderLayout', () => {
  it('should move an item from one index to another', () => {
    const layout = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
    const result = reorderLayout(layout, 0, 2)
    expect(result.map((i) => i.id)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('should not mutate the original array', () => {
    const layout = [{ id: 'a' }, { id: 'b' }]
    const copy = [...layout]
    reorderLayout(layout, 0, 1)
    expect(layout).toEqual(copy)
  })

  it('should return empty array for invalid input', () => {
    expect(reorderLayout(null, 0, 1)).toEqual([])
  })
})

describe('validateDateRange', () => {
  it('should return true for valid ranges', () => {
    expect(validateDateRange('2024-01-01', '2024-01-31')).toBe(true)
    expect(validateDateRange('2024-01-01', '2024-01-01')).toBe(true)
  })

  it('should return false for invalid ranges', () => {
    expect(validateDateRange('2024-01-31', '2024-01-01')).toBe(false)
    expect(validateDateRange(null, '2024-01-31')).toBe(false)
    expect(validateDateRange('2024-01-01', null)).toBe(false)
  })
})

describe('localStorage layout persistence', () => {
  let store = {}
  const mockLayout = [{ id: 'a' }, { id: 'b' }]

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => (key in store ? store[key] : null)),
      setItem: vi.fn((key, value) => {
        store[key] = String(value)
      }),
      removeItem: vi.fn((key) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      }),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should save and load layout from localStorage', () => {
    const saveResult = saveLayoutToStorage(mockLayout)
    expect(saveResult).toBe(true)

    const loaded = loadLayoutFromStorage()
    expect(loaded).toEqual(mockLayout)
  })

  it('should return null when nothing is stored', () => {
    expect(loadLayoutFromStorage()).toBe(null)
  })

  it('should clear stored layout', () => {
    saveLayoutToStorage(mockLayout)
    const clearResult = clearLayoutStorage()
    expect(clearResult).toBe(true)
    expect(loadLayoutFromStorage()).toBe(null)
  })

  it('should use the correct storage key', () => {
    saveLayoutToStorage(mockLayout)
    expect(store[LAYOUT_STORAGE_KEY]).toBeTruthy()
  })

  it('should return null when JSON parse fails', () => {
    store[LAYOUT_STORAGE_KEY] = 'invalid-json{{{'
    expect(loadLayoutFromStorage()).toBe(null)
  })
})
