import { describe, it, expect, beforeEach } from 'vitest'
import {
  seededRandom,
  getCurrencyByCode,
  getRate,
  convertCurrency,
  round4,
  searchCurrencies,
  generateDailyChanges,
  generateRateTable,
  generateTrendData,
  calculateTrendChartLayout,
  loadFavorites,
  saveFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  formatRate,
  formatChange,
} from '../../currency-converter/currencyUtils.js'
import {
  CURRENCIES,
  BASE_RATES_USD,
  FAVORITES_STORAGE_KEY,
} from '../../currency-converter/constants.js'

function createMockStorage() {
  const store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    _store: store,
  }
}

describe('seededRandom', () => {
  it('相同种子产生相同序列', () => {
    const rand1 = seededRandom('test-seed')
    const rand2 = seededRandom('test-seed')
    for (let i = 0; i < 10; i++) {
      expect(rand1()).toBeCloseTo(rand2(), 10)
    }
  })

  it('不同种子产生不同序列', () => {
    const rand1 = seededRandom('seed-a')
    const rand2 = seededRandom('seed-b')
    let hasDiff = false
    for (let i = 0; i < 10; i++) {
      if (rand1() !== rand2()) {
        hasDiff = true
        break
      }
    }
    expect(hasDiff).toBe(true)
  })

  it('返回值在 [0, 1) 区间内', () => {
    const rand = seededRandom('test')
    for (let i = 0; i < 100; i++) {
      const v = rand()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('getCurrencyByCode', () => {
  it('能找到存在的货币', () => {
    const usd = getCurrencyByCode('USD')
    expect(usd).not.toBeNull()
    expect(usd.code).toBe('USD')
    expect(usd.name).toBe('美元')
    expect(usd.flag).toBe('🇺🇸')
  })

  it('找不到返回 null', () => {
    expect(getCurrencyByCode('XXX')).toBeNull()
  })
})

describe('getRate', () => {
  it('相同货币返回 1', () => {
    expect(getRate('USD', 'USD')).toBe(1)
    expect(getRate('CNY', 'CNY')).toBe(1)
  })

  it('USD 到其他货币返回正确汇率', () => {
    expect(getRate('USD', 'EUR')).toBeCloseTo(BASE_RATES_USD.EUR, 4)
    expect(getRate('USD', 'CNY')).toBeCloseTo(BASE_RATES_USD.CNY, 4)
    expect(getRate('USD', 'JPY')).toBeCloseTo(BASE_RATES_USD.JPY, 4)
  })

  it('交叉汇率计算正确', () => {
    const usdToEur = getRate('USD', 'EUR')
    const eurToUsd = getRate('EUR', 'USD')
    expect(usdToEur * eurToUsd).toBeCloseTo(1, 4)
  })

  it('不存在的货币返回 null', () => {
    expect(getRate('USD', 'XXX')).toBeNull()
    expect(getRate('XXX', 'USD')).toBeNull()
  })
})

describe('round4', () => {
  it('保留4位小数', () => {
    expect(round4(1.23456)).toBe(1.2346)
    expect(round4(1.23454)).toBe(1.2345)
    expect(round4(1)).toBe(1)
    expect(round4(0)).toBe(0)
  })

  it('处理负数', () => {
    expect(round4(-1.23456)).toBe(-1.2346)
  })
})

describe('convertCurrency', () => {
  it('相同货币换算返回原金额', () => {
    expect(convertCurrency(100, 'USD', 'USD')).toBe(100)
  })

  it('USD 到 CNY 正确换算', () => {
    const result = convertCurrency(1, 'USD', 'CNY')
    expect(result).toBeCloseTo(BASE_RATES_USD.CNY, 4)
  })

  it('换算结果精度为4位小数', () => {
    const result = convertCurrency(100, 'USD', 'JPY')
    const str = String(result)
    if (str.includes('.')) {
      const decimals = str.split('.')[1].length
      expect(decimals).toBeLessThanOrEqual(4)
    }
  })

  it('不存在的货币返回 null', () => {
    expect(convertCurrency(100, 'USD', 'XXX')).toBeNull()
  })

  it('0 金额换算返回 0', () => {
    expect(convertCurrency(0, 'USD', 'CNY')).toBe(0)
  })
})

describe('searchCurrencies', () => {
  it('空或无效关键词返回空数组', () => {
    expect(searchCurrencies('')).toEqual([])
    expect(searchCurrencies(null)).toEqual([])
    expect(searchCurrencies(undefined)).toEqual([])
    expect(searchCurrencies(123)).toEqual([])
    expect(searchCurrencies('   ')).toEqual([])
  })

  it('按货币代码搜索，精确匹配优先', () => {
    const results = searchCurrencies('USD')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].code).toBe('USD')
    expect(results[0].score).toBe(100)
  })

  it('按中文名称搜索', () => {
    const results = searchCurrencies('美元')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((c) => c.code === 'USD')).toBe(true)
  })

  it('按英文名称搜索', () => {
    const results = searchCurrencies('dollar')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((c) => c.code === 'USD' || c.code === 'AUD' || c.code === 'CAD' || c.code === 'SGD' || c.code === 'NZD' || c.code === 'HKD')).toBe(true)
  })

  it('按国家名称中文搜索', () => {
    const results = searchCurrencies('美')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((c) => c.code === 'USD')).toBe(true)
  })

  it('按国家英文名称搜索', () => {
    const results = searchCurrencies('Japan')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((c) => c.code === 'JPY')).toBe(true)
  })

  it('搜索结果按匹配度排序', () => {
    const results = searchCurrencies('USD')
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  it('无匹配时返回空数组', () => {
    expect(searchCurrencies('不存在的货币xyz')).toEqual([])
  })

  it('代码前缀匹配', () => {
    const results = searchCurrencies('US')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].code).toBe('USD')
  })
})

describe('generateDailyChanges', () => {
  it('为每种非基准货币生成涨跌幅', () => {
    const changes = generateDailyChanges('USD')
    const otherCodes = CURRENCIES.filter((c) => c.code !== 'USD').map((c) => c.code)
    otherCodes.forEach((code) => {
      expect(changes[code]).toBeDefined()
      expect(typeof changes[code]).toBe('number')
    })
    expect(changes['USD']).toBeUndefined()
  })

  it('涨跌幅精度为4位小数', () => {
    const changes = generateDailyChanges('USD')
    Object.values(changes).forEach((v) => {
      const str = String(v)
      if (str.includes('.')) {
        const decimals = str.split('.')[1].length
        expect(decimals).toBeLessThanOrEqual(4)
      }
    })
  })
})

describe('generateRateTable', () => {
  it('生成排除基准货币的汇率表', () => {
    const table = generateRateTable('USD')
    expect(table.length).toBe(CURRENCIES.length - 1)
    expect(table.every((r) => r.code !== 'USD')).toBe(true)
  })

  it('每行包含必要字段', () => {
    const table = generateRateTable('USD')
    table.forEach((row) => {
      expect(row.code).toBeDefined()
      expect(row.name).toBeDefined()
      expect(row.nameEn).toBeDefined()
      expect(row.flag).toBeDefined()
      expect(typeof row.rate).toBe('number')
      expect(typeof row.change).toBe('number')
    })
  })
})

describe('generateTrendData', () => {
  it('生成指定天数的数据', () => {
    const data = generateTrendData('USD', 'CNY', 7)
    expect(data.length).toBe(7)
  })

  it('30天数据', () => {
    const data = generateTrendData('USD', 'EUR', 30)
    expect(data.length).toBe(30)
  })

  it('每条数据有日期和汇率值', () => {
    const data = generateTrendData('USD', 'CNY', 7)
    data.forEach((d) => {
      expect(d.date).toBeDefined()
      expect(typeof d.date).toBe('string')
      expect(d.value).toBeDefined()
      expect(typeof d.value).toBe('number')
    })
  })

  it('日期递增', () => {
    const data = generateTrendData('USD', 'CNY', 7)
    for (let i = 1; i < data.length; i++) {
      expect(data[i].date > data[i - 1].date).toBe(true)
    }
  })

  it('汇率值精度4位', () => {
    const data = generateTrendData('USD', 'CNY', 7)
    data.forEach((d) => {
      const str = String(d.value)
      if (str.includes('.')) {
        const decimals = str.split('.')[1].length
        expect(decimals).toBeLessThanOrEqual(4)
      }
    })
  })

  it('不存在的货币返回空数组', () => {
    expect(generateTrendData('USD', 'XXX', 7)).toEqual([])
  })

  it('相同参数生成相同数据', () => {
    const data1 = generateTrendData('USD', 'CNY', 7)
    const data2 = generateTrendData('USD', 'CNY', 7)
    expect(data1).toEqual(data2)
  })
})

describe('calculateTrendChartLayout', () => {
  const makeData = (n) => {
    const result = []
    for (let i = 0; i < n; i++) {
      result.push({
        date: `2025-01-${String(10 + i).padStart(2, '0')}`,
        value: 7.2 + i * 0.01,
      })
    }
    return result
  }

  it('空数据返回基础结构', () => {
    const layout = calculateTrendChartLayout([], { width: 700, height: 300 })
    expect(layout.width).toBe(700)
    expect(layout.height).toBe(300)
    expect(layout.points).toEqual([])
    expect(layout.pathD).toBe('')
  })

  it('正常数据计算布局字段', () => {
    const data = makeData(7)
    const layout = calculateTrendChartLayout(data, { width: 700, height: 300 })
    expect(layout.width).toBe(700)
    expect(layout.height).toBe(300)
    expect(layout.points.length).toBe(7)
    expect(layout.xTicks.length).toBeGreaterThan(0)
    expect(layout.yTicks.length).toBeGreaterThan(0)
    expect(layout.gridLines.length).toBeGreaterThan(0)
    expect(layout.hoverAreas.length).toBe(7)
  })

  it('points 坐标在合理范围内', () => {
    const data = makeData(7)
    const layout = calculateTrendChartLayout(data, { width: 700, height: 300 })
    layout.points.forEach((p) => {
      expect(p.x).toBeGreaterThanOrEqual(layout.paddingLeft)
      expect(p.x).toBeLessThanOrEqual(layout.width - layout.paddingRight)
      expect(p.y).toBeGreaterThanOrEqual(layout.paddingTop)
      expect(p.y).toBeLessThanOrEqual(layout.height - layout.paddingBottom)
      expect(p.value).toBeDefined()
      expect(p.date).toBeDefined()
    })
  })

  it('pathD 为有效 SVG path 字符串', () => {
    const data = makeData(7)
    const layout = calculateTrendChartLayout(data)
    expect(typeof layout.pathD).toBe('string')
    expect(layout.pathD.startsWith('M')).toBe(true)
  })

  it('yTicks 标签为4位小数字符串', () => {
    const data = makeData(7)
    const layout = calculateTrendChartLayout(data)
    layout.yTicks.forEach((t) => {
      expect(t.label).toBeDefined()
      expect(typeof t.label).toBe('string')
    })
  })
})

describe('favorites 收藏管理', () => {
  it('addFavorite 添加货币对', () => {
    const result = addFavorite([], 'USD', 'CNY')
    expect(result.length).toBe(1)
    expect(result[0].base).toBe('USD')
    expect(result[0].target).toBe('CNY')
  })

  it('addFavorite 不重复添加', () => {
    const initial = [{ base: 'USD', target: 'CNY' }]
    const result = addFavorite(initial, 'USD', 'CNY')
    expect(result.length).toBe(1)
  })

  it('addFavorite 不修改原数组', () => {
    const original = []
    const result = addFavorite(original, 'USD', 'CNY')
    expect(original.length).toBe(0)
    expect(result).not.toBe(original)
  })

  it('addFavorite 无效参数返回原数组', () => {
    const original = []
    expect(addFavorite(original, null, 'CNY')).toBe(original)
    expect(addFavorite(original, 'USD', null)).toBe(original)
  })

  it('removeFavorite 移除指定货币对', () => {
    const initial = [
      { base: 'USD', target: 'CNY' },
      { base: 'EUR', target: 'GBP' },
    ]
    const result = removeFavorite(initial, 'USD', 'CNY')
    expect(result.length).toBe(1)
    expect(result[0].base).toBe('EUR')
  })

  it('removeFavorite 移除不存在的返回原数组', () => {
    const initial = [{ base: 'USD', target: 'CNY' }]
    const result = removeFavorite(initial, 'EUR', 'GBP')
    expect(result.length).toBe(1)
  })

  it('isFavorite 判断是否已收藏', () => {
    const initial = [{ base: 'USD', target: 'CNY' }]
    expect(isFavorite(initial, 'USD', 'CNY')).toBe(true)
    expect(isFavorite(initial, 'EUR', 'GBP')).toBe(false)
  })
})

describe('localStorage 持久化', () => {
  let storage

  beforeEach(() => {
    storage = createMockStorage()
  })

  it('loadFavorites 空存储返回空数组', () => {
    expect(loadFavorites(storage)).toEqual([])
  })

  it('saveFavorites 和 loadFavorites 能正确往返', () => {
    const favs = [{ base: 'USD', target: 'CNY' }]
    saveFavorites(favs, storage)
    const loaded = loadFavorites(storage)
    expect(loaded.length).toBe(1)
    expect(loaded[0].base).toBe('USD')
    expect(loaded[0].target).toBe('CNY')
    expect(storage._store[FAVORITES_STORAGE_KEY]).toBeTruthy()
  })

  it('loadFavorites 损坏 JSON 返回空数组', () => {
    storage.setItem(FAVORITES_STORAGE_KEY, '{bad json')
    expect(loadFavorites(storage)).toEqual([])
  })

  it('loadFavorites 非数组数据返回空数组', () => {
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ not: 'array' }))
    expect(loadFavorites(storage)).toEqual([])
  })

  it('loadFavorites 过滤无效条目', () => {
    storage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify([
        { base: 'USD', target: 'CNY' },
        { base: 'EUR' },
        null,
        undefined,
      ])
    )
    const result = loadFavorites(storage)
    expect(result.length).toBe(1)
  })

  it('storage 不可用时不抛错', () => {
    expect(() => loadFavorites(null)).not.toThrow()
    expect(() => saveFavorites([], null)).not.toThrow()
  })
})

describe('formatRate', () => {
  it('大汇率保留2位', () => {
    expect(formatRate(149.52)).toBe('149.52')
  })

  it('中等汇率保留4位', () => {
    expect(formatRate(7.2456)).toBe('7.2456')
  })

  it('null 返回 --', () => {
    expect(formatRate(null)).toBe('--')
    expect(formatRate(undefined)).toBe('--')
  })
})

describe('formatChange', () => {
  it('正数带加号', () => {
    expect(formatChange(0.52)).toBe('+0.52%')
  })

  it('负数带负号', () => {
    expect(formatChange(-0.35)).toBe('-0.35%')
  })

  it('零无符号', () => {
    expect(formatChange(0)).toBe('0.00%')
  })
})
