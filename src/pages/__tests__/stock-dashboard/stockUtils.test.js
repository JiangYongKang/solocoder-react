import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  PRICE_MIN,
  PRICE_MAX,
  PRICE_FLUCTUATION_RATE,
  KLINE_DAYS,
  TIMESHARE_MINUTES,
  ALERT_TYPE_UPPER,
  ALERT_TYPE_LOWER,
  ALERT_STATUS_ENABLED,
  ALERT_STATUS_TRIGGERED,
  ALERT_STATUS_DISABLED,
  SORT_ORDER_ASC,
  SORT_ORDER_DESC,
  LIST_TYPE_ALL,
  LIST_TYPE_GAINERS,
  LIST_TYPE_LOSERS,
  STORAGE_KEY_WATCHLIST,
  STORAGE_KEY_ALERTS,
} from '../../stock-dashboard/constants'

import {
  generateBasePrice,
  generateNextPrice,
  calculateChange,
  getPriceColor,
  formatPrice,
  formatPercent,
  formatChange,
  generateKLineData,
  generateTimeShareData,
  generateId,
  formatDate,
  checkAlertTrigger,
  createAlert,
  updateAlertStatus,
  deleteAlert,
  getAlertsByStockCode,
  sortStocks,
  filterStockList,
  validateStockCode,
  initializeStockData,
  updateStockPrice,
  moveWatchlistItem,
} from '../../stock-dashboard/stockUtils'

import {
  loadWatchlist,
  saveWatchlist,
  loadAlerts,
  saveAlerts,
} from '../../stock-dashboard/storage'

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

describe('generateBasePrice', () => {
  it('生成的价格在 PRICE_MIN 和 PRICE_MAX 之间', () => {
    for (let i = 0; i < 100; i++) {
      const price = generateBasePrice()
      expect(price).toBeGreaterThanOrEqual(PRICE_MIN)
      expect(price).toBeLessThanOrEqual(PRICE_MAX)
      expect(Number.isInteger(price)).toBe(true)
    }
  })
})

describe('generateNextPrice', () => {
  it('价格在默认波动范围内变化', () => {
    const basePrice = 100
    for (let i = 0; i < 100; i++) {
      const nextPrice = generateNextPrice(basePrice)
      const maxChange = basePrice * PRICE_FLUCTUATION_RATE
      expect(Math.abs(nextPrice - basePrice)).toBeLessThanOrEqual(maxChange + 0.01)
    }
  })

  it('支持自定义波动率', () => {
    const basePrice = 100
    const customRate = 0.1
    for (let i = 0; i < 100; i++) {
      const nextPrice = generateNextPrice(basePrice, customRate)
      const maxChange = basePrice * customRate
      expect(Math.abs(nextPrice - basePrice)).toBeLessThanOrEqual(maxChange + 0.01)
    }
  })

  it('价格始终为正数', () => {
    for (let i = 0; i < 100; i++) {
      const nextPrice = generateNextPrice(0.01)
      expect(nextPrice).toBeGreaterThan(0)
    }
  })

  it('价格保留两位小数', () => {
    const price = generateNextPrice(100)
    const decimalPart = (price * 100) % 1
    expect(decimalPart).toBeCloseTo(0, 5)
  })
})

describe('calculateChange', () => {
  it('价格上涨时返回正数', () => {
    const result = calculateChange(110, 100)
    expect(result.change).toBe(10)
    expect(result.changePercent).toBe(10)
  })

  it('价格下跌时返回负数', () => {
    const result = calculateChange(90, 100)
    expect(result.change).toBe(-10)
    expect(result.changePercent).toBe(-10)
  })

  it('价格不变时返回0', () => {
    const result = calculateChange(100, 100)
    expect(result.change).toBe(0)
    expect(result.changePercent).toBe(0)
  })

  it('昨收价为0时涨跌幅为0', () => {
    const result = calculateChange(100, 0)
    expect(result.changePercent).toBe(0)
  })

  it('结果保留两位小数', () => {
    const result = calculateChange(100.333, 100)
    const changeStr = result.change.toFixed(2)
    const percentStr = result.changePercent.toFixed(2)
    expect(result.change).toBeCloseTo(parseFloat(changeStr), 2)
    expect(result.changePercent).toBeCloseTo(parseFloat(percentStr), 2)
  })
})

describe('getPriceColor', () => {
  it('上涨返回 up', () => {
    expect(getPriceColor(1)).toBe('up')
    expect(getPriceColor(0.01)).toBe('up')
  })

  it('下跌返回 down', () => {
    expect(getPriceColor(-1)).toBe('down')
    expect(getPriceColor(-0.01)).toBe('down')
  })

  it('平盘返回 flat', () => {
    expect(getPriceColor(0)).toBe('flat')
  })
})

describe('formatPrice', () => {
  it('格式化价格为两位小数', () => {
    expect(formatPrice(100)).toBe('100.00')
    expect(formatPrice(99.9)).toBe('99.90')
    expect(formatPrice(123.45)).toBe('123.45')
  })

  it('处理字符串输入', () => {
    expect(formatPrice('100')).toBe('100.00')
  })
})

describe('formatPercent', () => {
  it('正数带+号', () => {
    expect(formatPercent(5.5)).toBe('+5.50%')
    expect(formatPercent(0.01)).toBe('+0.01%')
  })

  it('负数带-号', () => {
    expect(formatPercent(-5.5)).toBe('-5.50%')
    expect(formatPercent(-0.01)).toBe('-0.01%')
  })

  it('零不带符号', () => {
    expect(formatPercent(0)).toBe('0.00%')
  })
})

describe('formatChange', () => {
  it('正数带+号', () => {
    expect(formatChange(5.5)).toBe('+5.50')
    expect(formatChange(0.01)).toBe('+0.01')
  })

  it('负数带-号', () => {
    expect(formatChange(-5.5)).toBe('-5.50')
    expect(formatChange(-0.01)).toBe('-0.01')
  })

  it('零不带符号', () => {
    expect(formatChange(0)).toBe('0.00')
  })
})

describe('generateKLineData', () => {
  it('生成指定天数的K线数据', () => {
    const data = generateKLineData(100, 30)
    expect(data.length).toBe(30)
  })

  it('默认生成 KLINE_DAYS 天数据', () => {
    const data = generateKLineData(100)
    expect(data.length).toBe(KLINE_DAYS)
  })

  it('每条K线包含必要字段', () => {
    const data = generateKLineData(100, 1)
    const item = data[0]
    expect(item).toHaveProperty('date')
    expect(item).toHaveProperty('open')
    expect(item).toHaveProperty('close')
    expect(item).toHaveProperty('high')
    expect(item).toHaveProperty('low')
    expect(item).toHaveProperty('volume')
    expect(item).toHaveProperty('isUp')
  })

  it('最高价大于等于开盘价和收盘价', () => {
    const data = generateKLineData(100, 10)
    data.forEach((item) => {
      expect(item.high).toBeGreaterThanOrEqual(item.open)
      expect(item.high).toBeGreaterThanOrEqual(item.close)
    })
  })

  it('最低价小于等于开盘价和收盘价', () => {
    const data = generateKLineData(100, 10)
    data.forEach((item) => {
      expect(item.low).toBeLessThanOrEqual(item.open)
      expect(item.low).toBeLessThanOrEqual(item.close)
    })
  })

  it('isUp 正确反映涨跌', () => {
    const data = generateKLineData(100, 10)
    data.forEach((item) => {
      expect(item.isUp).toBe(item.close >= item.open)
    })
  })

  it('成交量为正数', () => {
    const data = generateKLineData(100, 10)
    data.forEach((item) => {
      expect(item.volume).toBeGreaterThan(0)
      expect(Number.isInteger(item.volume)).toBe(true)
    })
  })

  it('日期格式正确', () => {
    const data = generateKLineData(100, 5)
    data.forEach((item) => {
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it('后一天的开盘价等于前一天的收盘价', () => {
    const data = generateKLineData(100, 10)
    for (let i = 1; i < data.length; i++) {
      expect(data[i].open).toBeCloseTo(data[i - 1].close, 5)
    }
  })
})

describe('generateTimeShareData', () => {
  it('生成分时数据点数量正确', () => {
    const data = generateTimeShareData(100)
    expect(data.length).toBe(TIMESHARE_MINUTES + 1)
  })

  it('每条数据包含时间和价格', () => {
    const data = generateTimeShareData(100)
    data.forEach((item) => {
      expect(item).toHaveProperty('time')
      expect(item).toHaveProperty('price')
      expect(item).toHaveProperty('minute')
    })
  })

  it('起始价格等于昨收价', () => {
    const prevClose = 100
    const data = generateTimeShareData(prevClose)
    expect(data[0].price).toBe(prevClose)
  })

  it('时间格式正确', () => {
    const data = generateTimeShareData(100)
    data.forEach((item) => {
      expect(item.time).toMatch(/^\d{2}:\d{2}$/)
    })
  })

  it('起始时间为 09:30', () => {
    const data = generateTimeShareData(100)
    expect(data[0].time).toBe('09:30')
  })
})

describe('generateId', () => {
  it('生成的ID为字符串', () => {
    expect(typeof generateId()).toBe('string')
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
  it('格式化日期对象为 YYYY-MM-DD', () => {
    const date = new Date(2025, 0, 15)
    expect(formatDate(date)).toBe('2025-01-15')
  })

  it('格式化日期字符串', () => {
    expect(formatDate('2025-01-15')).toBe('2025-01-15')
    expect(formatDate('2025/01/15')).toBe('2025-01-15')
  })
})

describe('checkAlertTrigger', () => {
  it('非启用状态的预警不触发', () => {
    const alert = { type: ALERT_TYPE_UPPER, targetPrice: 100, status: ALERT_STATUS_DISABLED }
    expect(checkAlertTrigger(alert, 150)).toBe(false)
  })

  it('已触发状态的预警不重复触发', () => {
    const alert = { type: ALERT_TYPE_UPPER, targetPrice: 100, status: ALERT_STATUS_TRIGGERED }
    expect(checkAlertTrigger(alert, 150)).toBe(false)
  })

  it('价格上限预警：价格超过目标价触发', () => {
    const alert = { type: ALERT_TYPE_UPPER, targetPrice: 100, status: ALERT_STATUS_ENABLED }
    expect(checkAlertTrigger(alert, 100)).toBe(true)
    expect(checkAlertTrigger(alert, 101)).toBe(true)
    expect(checkAlertTrigger(alert, 99)).toBe(false)
  })

  it('价格下限预警：价格低于目标价触发', () => {
    const alert = { type: ALERT_TYPE_LOWER, targetPrice: 100, status: ALERT_STATUS_ENABLED }
    expect(checkAlertTrigger(alert, 100)).toBe(true)
    expect(checkAlertTrigger(alert, 99)).toBe(true)
    expect(checkAlertTrigger(alert, 101)).toBe(false)
  })

  it('未知预警类型不触发', () => {
    const alert = { type: 'unknown', targetPrice: 100, status: ALERT_STATUS_ENABLED }
    expect(checkAlertTrigger(alert, 150)).toBe(false)
  })
})

describe('createAlert', () => {
  it('创建预警返回正确结构', () => {
    const alert = createAlert('AAPL', '苹果公司', ALERT_TYPE_UPPER, 150, true)
    expect(alert.id).toBeTruthy()
    expect(alert.stockCode).toBe('AAPL')
    expect(alert.stockName).toBe('苹果公司')
    expect(alert.type).toBe(ALERT_TYPE_UPPER)
    expect(alert.targetPrice).toBe(150)
    expect(alert.notify).toBe(true)
    expect(alert.status).toBe(ALERT_STATUS_ENABLED)
    expect(alert.createdAt).toBeTruthy()
  })

  it('targetPrice 转换为数字', () => {
    const alert = createAlert('AAPL', '苹果', ALERT_TYPE_UPPER, '150.5')
    expect(typeof alert.targetPrice).toBe('number')
    expect(alert.targetPrice).toBe(150.5)
  })

  it('默认开启通知', () => {
    const alert = createAlert('AAPL', '苹果', ALERT_TYPE_UPPER, 100)
    expect(alert.notify).toBe(true)
  })
})

describe('updateAlertStatus', () => {
  it('更新指定预警的状态', () => {
    const alerts = [
      { id: '1', status: ALERT_STATUS_ENABLED },
      { id: '2', status: ALERT_STATUS_ENABLED },
    ]
    const result = updateAlertStatus(alerts, '1', ALERT_STATUS_DISABLED)
    expect(result[0].status).toBe(ALERT_STATUS_DISABLED)
    expect(result[1].status).toBe(ALERT_STATUS_ENABLED)
  })

  it('不修改原数组', () => {
    const alerts = [{ id: '1', status: ALERT_STATUS_ENABLED }]
    const original = [...alerts]
    updateAlertStatus(alerts, '1', ALERT_STATUS_DISABLED)
    expect(alerts).toEqual(original)
  })
})

describe('deleteAlert', () => {
  it('删除指定预警', () => {
    const alerts = [
      { id: '1', name: 'alert1' },
      { id: '2', name: 'alert2' },
    ]
    const result = deleteAlert(alerts, '1')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('2')
  })

  it('不修改原数组', () => {
    const alerts = [{ id: '1' }, { id: '2' }]
    const original = [...alerts]
    deleteAlert(alerts, '1')
    expect(alerts).toEqual(original)
  })
})

describe('getAlertsByStockCode', () => {
  it('筛选指定股票的预警', () => {
    const alerts = [
      { id: '1', stockCode: 'AAPL' },
      { id: '2', stockCode: 'GOOGL' },
      { id: '3', stockCode: 'AAPL' },
    ]
    const result = getAlertsByStockCode(alerts, 'AAPL')
    expect(result.length).toBe(2)
    expect(result.every((a) => a.stockCode === 'AAPL')).toBe(true)
  })

  it('没有匹配时返回空数组', () => {
    const alerts = [{ id: '1', stockCode: 'AAPL' }]
    const result = getAlertsByStockCode(alerts, 'GOOGL')
    expect(result).toEqual([])
  })
})

describe('sortStocks', () => {
  const makeStocks = () => [
    { code: 'AAPL', name: '苹果', price: 150, change: 5, changePercent: 3.45, volume: 1000000, amount: 150000000 },
    { code: 'GOOGL', name: '谷歌', price: 200, change: -2, changePercent: -1.0, volume: 500000, amount: 100000000 },
    { code: 'TSLA', name: '特斯拉', price: 250, change: 10, changePercent: 4.17, volume: 2000000, amount: 500000000 },
  ]

  it('按涨跌幅降序排序', () => {
    const result = sortStocks(makeStocks(), 'changePercent', SORT_ORDER_DESC)
    expect(result[0].code).toBe('TSLA')
    expect(result[1].code).toBe('AAPL')
    expect(result[2].code).toBe('GOOGL')
  })

  it('按涨跌幅升序排序', () => {
    const result = sortStocks(makeStocks(), 'changePercent', SORT_ORDER_ASC)
    expect(result[0].code).toBe('GOOGL')
    expect(result[1].code).toBe('AAPL')
    expect(result[2].code).toBe('TSLA')
  })

  it('按价格降序排序', () => {
    const result = sortStocks(makeStocks(), 'price', SORT_ORDER_DESC)
    expect(result[0].code).toBe('TSLA')
    expect(result[1].code).toBe('GOOGL')
    expect(result[2].code).toBe('AAPL')
  })

  it('按成交量降序排序', () => {
    const result = sortStocks(makeStocks(), 'volume', SORT_ORDER_DESC)
    expect(result[0].code).toBe('TSLA')
    expect(result[1].code).toBe('AAPL')
    expect(result[2].code).toBe('GOOGL')
  })

  it('按成交额降序排序', () => {
    const result = sortStocks(makeStocks(), 'amount', SORT_ORDER_DESC)
    expect(result[0].code).toBe('TSLA')
    expect(result[1].code).toBe('AAPL')
    expect(result[2].code).toBe('GOOGL')
  })

  it('按代码排序', () => {
    const result = sortStocks(makeStocks(), 'code', SORT_ORDER_DESC)
    expect(result[0].code).toBe('TSLA')
  })

  it('不修改原数组', () => {
    const stocks = makeStocks()
    const original = [...stocks]
    sortStocks(stocks, 'price', SORT_ORDER_DESC)
    expect(stocks.map((s) => s.code)).toEqual(original.map((s) => s.code))
  })
})

describe('filterStockList', () => {
  const makeStocks = () => [
    { code: 'S1', changePercent: 5.0 },
    { code: 'S2', changePercent: 3.0 },
    { code: 'S3', changePercent: 1.0 },
    { code: 'S4', changePercent: -1.0 },
    { code: 'S5', changePercent: -3.0 },
    { code: 'S6', changePercent: -5.0 },
  ]

  it('全部列表返回所有股票', () => {
    const result = filterStockList(makeStocks(), LIST_TYPE_ALL)
    expect(result.length).toBe(6)
  })

  it('涨幅榜返回正涨幅股票且不超过10只', () => {
    const result = filterStockList(makeStocks(), LIST_TYPE_GAINERS)
    expect(result.length).toBe(3)
    expect(result.every((s) => s.changePercent > 0)).toBe(true)
    expect(result[0].changePercent).toBeGreaterThan(result[1].changePercent)
  })

  it('跌幅榜返回负涨幅股票且不超过10只，按跌幅从大到小排列', () => {
    const result = filterStockList(makeStocks(), LIST_TYPE_LOSERS)
    expect(result.length).toBe(3)
    expect(result.every((s) => s.changePercent < 0)).toBe(true)
    expect(result[0].changePercent).toBeLessThan(result[1].changePercent)
  })

  it('涨幅榜不超过10只', () => {
    const manyStocks = Array.from({ length: 20 }, (_, i) => ({
      code: `S${i}`,
      changePercent: i + 1,
    }))
    const result = filterStockList(manyStocks, LIST_TYPE_GAINERS)
    expect(result.length).toBe(10)
  })
})

describe('validateStockCode', () => {
  it('美股代码有效', () => {
    expect(validateStockCode('AAPL')).toBe(true)
    expect(validateStockCode('GOOGL')).toBe(true)
    expect(validateStockCode('TSLA')).toBe(true)
    expect(validateStockCode('F')).toBe(true)
  })

  it('A股代码有效', () => {
    expect(validateStockCode('000001')).toBe(true)
    expect(validateStockCode('600519')).toBe(true)
    expect(validateStockCode('300001')).toBe(true)
  })

  it('空代码无效', () => {
    expect(validateStockCode('')).toBe(false)
    expect(validateStockCode('   ')).toBe(false)
    expect(validateStockCode(null)).toBe(false)
    expect(validateStockCode(undefined)).toBe(false)
  })

  it('格式错误的代码无效', () => {
    expect(validateStockCode('123')).toBe(false)
    expect(validateStockCode('12345')).toBe(false)
    expect(validateStockCode('ABCDEF')).toBe(false)
    expect(validateStockCode('AAPL123')).toBe(false)
    expect(validateStockCode('00001')).toBe(false)
    expect(validateStockCode('0000001')).toBe(false)
  })

  it('忽略大小写', () => {
    expect(validateStockCode('aapl')).toBe(true)
    expect(validateStockCode('Aapl')).toBe(true)
  })
})

describe('initializeStockData', () => {
  it('初始化股票数据包含所有必要字段', () => {
    const stock = initializeStockData({ code: 'TEST', name: '测试' })
    expect(stock.code).toBe('TEST')
    expect(stock.name).toBe('测试')
    expect(stock).toHaveProperty('price')
    expect(stock).toHaveProperty('prevClose')
    expect(stock).toHaveProperty('open')
    expect(stock).toHaveProperty('high')
    expect(stock).toHaveProperty('low')
    expect(stock).toHaveProperty('volume')
    expect(stock).toHaveProperty('amount')
    expect(stock).toHaveProperty('change')
    expect(stock).toHaveProperty('changePercent')
  })

  it('价格在合理范围内', () => {
    for (let i = 0; i < 20; i++) {
      const stock = initializeStockData({ code: 'TEST', name: '测试' })
      expect(stock.price).toBeGreaterThanOrEqual(PRICE_MIN * 0.8)
      expect(stock.price).toBeLessThanOrEqual(PRICE_MAX * 1.2)
    }
  })

  it('最高价大于等于当前价', () => {
    const stock = initializeStockData({ code: 'TEST', name: '测试' })
    expect(stock.high).toBeGreaterThanOrEqual(stock.price)
  })

  it('最低价小于等于当前价', () => {
    const stock = initializeStockData({ code: 'TEST', name: '测试' })
    expect(stock.low).toBeLessThanOrEqual(stock.price)
  })

  it('股票代码转大写', () => {
    const stock = initializeStockData({ code: 'aapl', name: '苹果' })
    expect(stock.code).toBe('AAPL')
  })
})

describe('updateStockPrice', () => {
  it('更新价格后涨跌额正确', () => {
    const stock = {
      code: 'TEST',
      price: 100,
      prevClose: 95,
      open: 96,
      high: 100,
      low: 95,
      volume: 1000000,
      amount: 100000000,
      change: 5,
      changePercent: 5.26,
    }
    const updated = updateStockPrice(stock)
    const expectedChange = Number((updated.price - stock.prevClose).toFixed(2))
    expect(updated.change).toBe(expectedChange)
  })

  it('最高价只升不降', () => {
    const stock = {
      code: 'TEST',
      price: 100,
      prevClose: 100,
      open: 100,
      high: 100,
      low: 100,
      volume: 1000,
      amount: 100000,
      change: 0,
      changePercent: 0,
    }
    const updated = updateStockPrice(stock)
    expect(updated.high).toBeGreaterThanOrEqual(stock.high)
  })

  it('最低价只降不升', () => {
    const stock = {
      code: 'TEST',
      price: 100,
      prevClose: 100,
      open: 100,
      high: 100,
      low: 100,
      volume: 1000,
      amount: 100000,
      change: 0,
      changePercent: 0,
    }
    const updated = updateStockPrice(stock)
    expect(updated.low).toBeLessThanOrEqual(stock.low)
  })

  it('成交量递增', () => {
    const stock = {
      code: 'TEST',
      price: 100,
      prevClose: 100,
      open: 100,
      high: 100,
      low: 100,
      volume: 1000,
      amount: 100000,
      change: 0,
      changePercent: 0,
    }
    const updated = updateStockPrice(stock)
    expect(updated.volume).toBeGreaterThan(stock.volume)
  })
})

describe('moveWatchlistItem', () => {
  it('向下移动项目', () => {
    const list = ['A', 'B', 'C', 'D']
    const result = moveWatchlistItem(list, 0, 2)
    expect(result).toEqual(['B', 'C', 'A', 'D'])
  })

  it('向上移动项目', () => {
    const list = ['A', 'B', 'C', 'D']
    const result = moveWatchlistItem(list, 3, 1)
    expect(result).toEqual(['A', 'D', 'B', 'C'])
  })

  it('不修改原数组', () => {
    const list = ['A', 'B', 'C']
    const original = [...list]
    moveWatchlistItem(list, 0, 2)
    expect(list).toEqual(original)
  })

  it('移动到相同位置不改变', () => {
    const list = ['A', 'B', 'C']
    const result = moveWatchlistItem(list, 1, 1)
    expect(result).toEqual(list)
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('watchlist storage', () => {
    it('saveWatchlist 保存到 localStorage', () => {
      const list = [{ code: 'AAPL', name: '苹果' }]
      const result = saveWatchlist(list)
      expect(result).toBe(true)
      expect(localStorage.getItem(STORAGE_KEY_WATCHLIST)).toBe(JSON.stringify(list))
    })

    it('loadWatchlist 从 localStorage 读取', () => {
      const list = [{ code: 'AAPL', name: '苹果' }]
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(list))
      const result = loadWatchlist()
      expect(result).toEqual(list)
    })

    it('loadWatchlist 为空时返回空数组', () => {
      expect(loadWatchlist()).toEqual([])
    })

    it('loadWatchlist 数据损坏时返回空数组', () => {
      localStorage.setItem(STORAGE_KEY_WATCHLIST, 'invalid-json')
      expect(loadWatchlist()).toEqual([])
    })

    it('loadWatchlist 非数组时返回空数组', () => {
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify({ not: 'array' }))
      expect(loadWatchlist()).toEqual([])
    })
  })

  describe('alerts storage', () => {
    it('saveAlerts 保存到 localStorage', () => {
      const alerts = [{ id: '1', stockCode: 'AAPL' }]
      const result = saveAlerts(alerts)
      expect(result).toBe(true)
      expect(localStorage.getItem(STORAGE_KEY_ALERTS)).toBe(JSON.stringify(alerts))
    })

    it('loadAlerts 从 localStorage 读取', () => {
      const alerts = [{ id: '1', stockCode: 'AAPL' }]
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts))
      const result = loadAlerts()
      expect(result).toEqual(alerts)
    })

    it('loadAlerts 为空时返回空数组', () => {
      expect(loadAlerts()).toEqual([])
    })

    it('loadAlerts 数据损坏时返回空数组', () => {
      localStorage.setItem(STORAGE_KEY_ALERTS, 'invalid-json')
      expect(loadAlerts()).toEqual([])
    })

    it('loadAlerts 非数组时返回空数组', () => {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify({ not: 'array' }))
      expect(loadAlerts()).toEqual([])
    })
  })
})
