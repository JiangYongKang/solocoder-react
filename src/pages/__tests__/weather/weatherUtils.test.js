import { describe, it, expect, beforeEach } from 'vitest'
import {
  searchCities,
  getCityById,
  getCityByName,
  seededRandom,
  generateWeatherData,
  loadFavorites,
  saveFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  loadHistory,
  saveHistory,
  addToHistory,
  removeFromHistory,
  clearHistory,
  formatWeekday,
  formatDateShort,
  niceNumber,
  niceScale,
  linearScale,
  calculateTemperatureChartLayout,
} from '../../weather/weatherUtils.js'
import {
  CITIES,
  MAX_HISTORY_ITEMS,
  FAVORITES_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  WEATHER_TYPES,
  WEEKDAY_NAMES,
} from '../../weather/constants.js'

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

const TEST_CITY = CITIES[0]
const TEST_CITY_2 = CITIES[1]
const TEST_CITY_3 = CITIES[2]

describe('searchCities', () => {
  it('空或无效关键词返回空数组', () => {
    expect(searchCities('')).toEqual([])
    expect(searchCities(null)).toEqual([])
    expect(searchCities(undefined)).toEqual([])
    expect(searchCities(123)).toEqual([])
    expect(searchCities('   ')).toEqual([])
  })

  it('按城市名称搜索，大小写不敏感', () => {
    const results = searchCities('北京')
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((c) => c.name.includes('北京'))).toBe(true)
  })

  it('按省份名称搜索', () => {
    const results = searchCities('广东')
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((c) => c.province.includes('广东'))).toBe(true)
  })

  it('支持模糊匹配', () => {
    const results = searchCities('南')
    expect(results.length).toBeGreaterThan(0)
    expect(
      results.every(
        (c) => c.name.includes('南') || c.province.includes('南')
      )
    ).toBe(true)
  })

  it('无匹配时返回空数组', () => {
    expect(searchCities('不存在的城市xyz')).toEqual([])
  })
})

describe('getCityById / getCityByName', () => {
  it('getCityById 能正确查找', () => {
    const city = getCityById(TEST_CITY.id)
    expect(city).not.toBeNull()
    expect(city.id).toBe(TEST_CITY.id)
    expect(city.name).toBe(TEST_CITY.name)
  })

  it('getCityById 找不到返回 null', () => {
    expect(getCityById('nonexistent')).toBeNull()
  })

  it('getCityByName 能正确查找', () => {
    const city = getCityByName(TEST_CITY.name)
    expect(city).not.toBeNull()
    expect(city.name).toBe(TEST_CITY.name)
  })

  it('getCityByName 找不到返回 null', () => {
    expect(getCityByName('不存在的城市')).toBeNull()
  })
})

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

describe('generateWeatherData', () => {
  it('city 为空时返回 null', () => {
    expect(generateWeatherData(null)).toBeNull()
    expect(generateWeatherData(undefined)).toBeNull()
  })

  it('生成的天气数据结构完整', () => {
    const data = generateWeatherData(TEST_CITY)
    expect(data).not.toBeNull()
    expect(data.city).toEqual(TEST_CITY)
    expect(data.current).toBeDefined()
    expect(data.forecast).toBeDefined()
    expect(data.forecast.length).toBe(7)
  })

  it('当前天气数据字段完整', () => {
    const data = generateWeatherData(TEST_CITY)
    const { current } = data
    expect(typeof current.temperature).toBe('number')
    expect(typeof current.feelsLike).toBe('number')
    expect(typeof current.humidity).toBe('number')
    expect(typeof current.windSpeed).toBe('number')
    expect(typeof current.visibility).toBe('number')
    expect(current.weatherType).toBeDefined()
    expect(current.icon).toBeDefined()
    expect(current.label).toBeDefined()
    expect(current.updateTime).toBeDefined()
  })

  it('weatherType 为有效值', () => {
    const data = generateWeatherData(TEST_CITY)
    const validTypes = Object.values(WEATHER_TYPES)
    expect(validTypes.includes(data.current.weatherType)).toBe(true)
    data.forecast.forEach((d) => {
      expect(validTypes.includes(d.weatherType)).toBe(true)
    })
  })

  it('预报列表第一天 isToday 为 true', () => {
    const data = generateWeatherData(TEST_CITY)
    expect(data.forecast[0].isToday).toBe(true)
    data.forecast.slice(1).forEach((d) => {
      expect(d.isToday).toBe(false)
    })
  })

  it('预报中最高温大于等于最低温', () => {
    const data = generateWeatherData(TEST_CITY)
    data.forecast.forEach((d) => {
      expect(d.high).toBeGreaterThanOrEqual(d.low)
    })
  })

  it('湿度在合理范围内', () => {
    const data = generateWeatherData(TEST_CITY)
    data.forecast.forEach((d) => {
      expect(d.humidity).toBeGreaterThanOrEqual(0)
      expect(d.humidity).toBeLessThanOrEqual(100)
    })
  })

  it('相同城市同日生成相同数据', () => {
    const data1 = generateWeatherData(TEST_CITY)
    const data2 = generateWeatherData(TEST_CITY)
    expect(data1.current.temperature).toBe(data2.current.temperature)
    expect(data1.forecast[0].high).toBe(data2.forecast[0].high)
  })

  it('weekday 为有效值', () => {
    const data = generateWeatherData(TEST_CITY)
    data.forecast.forEach((d) => {
      expect(WEEKDAY_NAMES.includes(d.weekday)).toBe(true)
    })
  })
})

describe('favorites 收藏管理', () => {
  it('addFavorite 添加城市', () => {
    const result = addFavorite([], TEST_CITY)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe(TEST_CITY.id)
    expect(result[0].name).toBe(TEST_CITY.name)
  })

  it('addFavorite 不重复添加', () => {
    const initial = [{ id: TEST_CITY.id, name: TEST_CITY.name, province: TEST_CITY.province }]
    const result = addFavorite(initial, TEST_CITY)
    expect(result.length).toBe(1)
  })

  it('addFavorite 不修改原数组', () => {
    const original = []
    const result = addFavorite(original, TEST_CITY)
    expect(original.length).toBe(0)
    expect(result).not.toBe(original)
  })

  it('addFavorite 无效 city 返回原数组', () => {
    const original = []
    expect(addFavorite(original, null)).toBe(original)
    expect(addFavorite(original, {})).toBe(original)
  })

  it('removeFavorite 移除指定城市', () => {
    const initial = [
      { id: TEST_CITY.id, name: TEST_CITY.name, province: TEST_CITY.province },
      { id: TEST_CITY_2.id, name: TEST_CITY_2.name, province: TEST_CITY_2.province },
    ]
    const result = removeFavorite(initial, TEST_CITY.id)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe(TEST_CITY_2.id)
  })

  it('removeFavorite 移除不存在的 id 返回原数组', () => {
    const initial = [{ id: TEST_CITY.id, name: TEST_CITY.name, province: TEST_CITY.province }]
    const result = removeFavorite(initial, 'nope')
    expect(result.length).toBe(1)
  })

  it('isFavorite 判断是否已收藏', () => {
    const initial = [{ id: TEST_CITY.id, name: TEST_CITY.name, province: TEST_CITY.province }]
    expect(isFavorite(initial, TEST_CITY.id)).toBe(true)
    expect(isFavorite(initial, TEST_CITY_2.id)).toBe(false)
  })
})

describe('history 历史记录管理', () => {
  it('addToHistory 添加到头部', () => {
    const result = addToHistory([], TEST_CITY)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe(TEST_CITY.id)
  })

  it('addToHistory 已存在的城市移到头部', () => {
    const initial = [
      { id: TEST_CITY.id, name: TEST_CITY.name, province: TEST_CITY.province },
      { id: TEST_CITY_2.id, name: TEST_CITY_2.name, province: TEST_CITY_2.province },
    ]
    const result = addToHistory(initial, TEST_CITY_2)
    expect(result.length).toBe(2)
    expect(result[0].id).toBe(TEST_CITY_2.id)
    expect(result[1].id).toBe(TEST_CITY.id)
  })

  it('addToHistory 限制最大数量', () => {
    let history = []
    for (let i = 0; i < 15; i++) {
      history = addToHistory(history, CITIES[i])
    }
    expect(history.length).toBe(MAX_HISTORY_ITEMS)
  })

  it('addToHistory 无效 city 返回原数组', () => {
    const original = []
    expect(addToHistory(original, null)).toBe(original)
    expect(addToHistory(original, {})).toBe(original)
  })

  it('removeFromHistory 移除指定记录', () => {
    const initial = [
      { id: TEST_CITY.id, name: TEST_CITY.name, province: TEST_CITY.province },
      { id: TEST_CITY_2.id, name: TEST_CITY_2.name, province: TEST_CITY_2.province },
    ]
    const result = removeFromHistory(initial, TEST_CITY.id)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe(TEST_CITY_2.id)
  })

  it('clearHistory 返回空数组', () => {
    expect(clearHistory()).toEqual([])
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
    const favs = [{ id: TEST_CITY.id, name: TEST_CITY.name, province: TEST_CITY.province }]
    saveFavorites(favs, storage)
    const loaded = loadFavorites(storage)
    expect(loaded.length).toBe(1)
    expect(loaded[0].id).toBe(TEST_CITY.id)
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
        { id: '1', name: 'Valid' },
        { id: '2' },
        null,
        undefined,
      ])
    )
    const result = loadFavorites(storage)
    expect(result.length).toBe(1)
  })

  it('loadHistory 空存储返回空数组', () => {
    expect(loadHistory(storage)).toEqual([])
  })

  it('saveHistory 和 loadHistory 能正确往返', () => {
    const h = [{ id: TEST_CITY.id, name: TEST_CITY.name, province: TEST_CITY.province }]
    saveHistory(h, storage)
    const loaded = loadHistory(storage)
    expect(loaded.length).toBe(1)
    expect(storage._store[HISTORY_STORAGE_KEY]).toBeTruthy()
  })

  it('loadHistory 损坏 JSON 返回空数组', () => {
    storage.setItem(HISTORY_STORAGE_KEY, 'not json')
    expect(loadHistory(storage)).toEqual([])
  })

  it('storage 不可用时不抛错', () => {
    expect(() => loadFavorites(null)).not.toThrow()
    expect(() => saveFavorites([], null)).not.toThrow()
    expect(() => loadHistory(null)).not.toThrow()
    expect(() => saveHistory([], null)).not.toThrow()
  })
})

describe('日期格式化', () => {
  it('formatWeekday 返回正确的星期名称', () => {
    // 2025-01-15 是周三
    expect(formatWeekday('2025-01-15')).toBe('周三')
    // 2025-01-12 是周日
    expect(formatWeekday('2025-01-12')).toBe('周日')
  })

  it('formatDateShort 返回 M/D 格式', () => {
    expect(formatDateShort('2025-01-15')).toBe('1/15')
    expect(formatDateShort('2025-12-05')).toBe('12/5')
  })
})

describe('刻度计算函数', () => {
  it('niceNumber 向上取整', () => {
    expect(niceNumber(3.2, true)).toBe(5)
    expect(niceNumber(32, true)).toBe(50)
  })

  it('niceNumber 不向上取整', () => {
    expect(niceNumber(5, false)).toBe(5)
    expect(niceNumber(6, false)).toBe(10)
  })

  it('niceScale min === max 时扩展范围', () => {
    const result = niceScale(50, 50, 5)
    expect(result.min).toBeLessThan(50)
    expect(result.max).toBeGreaterThan(50)
    expect(result.ticks.length).toBe(3)
  })

  it('niceScale 生成递增刻度', () => {
    const result = niceScale(0, 100, 5)
    for (let i = 1; i < result.ticks.length; i++) {
      expect(result.ticks[i]).toBeGreaterThan(result.ticks[i - 1])
    }
  })

  it('linearScale 创建线性缩放', () => {
    const scale = linearScale([0, 100], [0, 200])
    expect(scale(0)).toBe(0)
    expect(scale(50)).toBe(100)
    expect(scale(100)).toBe(200)
  })

  it('linearScale 支持反向', () => {
    const scale = linearScale([0, 100], [200, 0])
    expect(scale(0)).toBe(200)
    expect(scale(100)).toBe(0)
  })

  it('linearScale domain 为 0 返回中间值', () => {
    const scale = linearScale([50, 50], [0, 100])
    expect(scale(50)).toBe(50)
  })
})

describe('calculateTemperatureChartLayout', () => {
  const makeForecast = () => {
    const result = []
    for (let i = 0; i < 7; i++) {
      result.push({
        date: `2025-01-${String(10 + i).padStart(2, '0')}`,
        weekday: WEEKDAY_NAMES[i],
        isToday: i === 0,
        high: 25 + i,
        low: 15 + i,
        humidity: 50 + i * 2,
      })
    }
    return result
  }

  it('计算布局的基础字段', () => {
    const forecast = makeForecast()
    const layout = calculateTemperatureChartLayout(forecast, { width: 600, height: 260 })
    expect(layout.width).toBe(600)
    expect(layout.height).toBe(260)
    expect(layout.chartWidth).toBe(600 - 45 - 30)
    expect(layout.chartHeight).toBe(260 - 30 - 40)
  })

  it('highPoints 和 lowPoints 数量正确', () => {
    const forecast = makeForecast()
    const layout = calculateTemperatureChartLayout(forecast)
    expect(layout.highPoints.length).toBe(7)
    expect(layout.lowPoints.length).toBe(7)
  })

  it('每个 point 有正确的值和坐标范围', () => {
    const forecast = makeForecast()
    const layout = calculateTemperatureChartLayout(forecast, { width: 600, height: 260 })
    layout.highPoints.forEach((p, i) => {
      expect(p.x).toBeGreaterThanOrEqual(layout.paddingLeft)
      expect(p.x).toBeLessThanOrEqual(layout.width - layout.paddingRight)
      expect(p.y).toBeGreaterThanOrEqual(layout.paddingTop)
      expect(p.y).toBeLessThanOrEqual(layout.height - layout.paddingBottom)
      expect(p.value).toBe(forecast[i].high)
      expect(p.index).toBe(i)
    })
    layout.lowPoints.forEach((p, i) => {
      expect(p.value).toBe(forecast[i].low)
    })
  })

  it('pathD 为有效 SVG path 字符串', () => {
    const forecast = makeForecast()
    const layout = calculateTemperatureChartLayout(forecast)
    expect(typeof layout.highPathD).toBe('string')
    expect(layout.highPathD.startsWith('M')).toBe(true)
    expect(typeof layout.lowPathD).toBe('string')
    expect(layout.lowPathD.startsWith('M')).toBe(true)
  })

  it('xTicks 数量正确并包含正确标签', () => {
    const forecast = makeForecast()
    const layout = calculateTemperatureChartLayout(forecast)
    expect(layout.xTicks.length).toBe(7)
    expect(layout.xTicks[0].label).toBe('今天')
    expect(layout.xTicks[1].label).toBe(forecast[1].weekday)
  })

  it('yTicks 带有度数符号', () => {
    const forecast = makeForecast()
    const layout = calculateTemperatureChartLayout(forecast)
    expect(layout.yTicks.length).toBeGreaterThan(0)
    layout.yTicks.forEach((t) => {
      expect(t.label.endsWith('°')).toBe(true)
    })
  })

  it('gridLines 数量和 yTicks 一致', () => {
    const forecast = makeForecast()
    const layout = calculateTemperatureChartLayout(forecast)
    expect(layout.gridLines.length).toBe(layout.yTicks.length)
  })

  it('xScale 函数返回正确坐标', () => {
    const forecast = makeForecast()
    const layout = calculateTemperatureChartLayout(forecast)
    expect(layout.xScale(0)).toBeCloseTo(layout.highPoints[0].x, 0)
    expect(layout.xScale(3)).toBeCloseTo(layout.highPoints[3].x, 0)
  })
})
