import { describe, it, expect, beforeEach } from 'vitest'
import {
  getProvinces,
  getCities,
  getDistricts,
  getStreets,
  getAddressPath,
  getDistrictCoordinate,
  fuzzyMatchAddresses,
  loadHistory,
  saveHistory,
  addToHistory,
  removeFromHistory,
  lngLatToMapXY,
} from '@/pages/address-cascade/addressUtils.js'
import { STORAGE_KEY, MAX_HISTORY } from '@/pages/address-cascade/addressData.js'

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

describe('getProvinces', () => {
  it('returns an array of provinces', () => {
    const provinces = getProvinces()
    expect(Array.isArray(provinces)).toBe(true)
    expect(provinces.length).toBeGreaterThan(0)
  })

  it('each province has code, name, lng, lat', () => {
    const provinces = getProvinces()
    provinces.forEach((p) => {
      expect(p.code).toBeTruthy()
      expect(p.name).toBeTruthy()
      expect(typeof p.lng).toBe('number')
      expect(typeof p.lat).toBe('number')
    })
  })

  it('includes known provinces', () => {
    const provinces = getProvinces()
    const names = provinces.map((p) => p.name)
    expect(names).toContain('北京市')
    expect(names).toContain('上海市')
    expect(names).toContain('广东省')
    expect(names).toContain('浙江省')
    expect(names).toContain('四川省')
  })
})

describe('getCities', () => {
  it('returns cities for a valid province code', () => {
    const cities = getCities('440000')
    expect(cities.length).toBeGreaterThan(0)
    const names = cities.map((c) => c.name)
    expect(names).toContain('广州市')
    expect(names).toContain('深圳市')
  })

  it('returns empty array for invalid province code', () => {
    expect(getCities('999999')).toEqual([])
    expect(getCities('')).toEqual([])
  })
})

describe('getDistricts', () => {
  it('returns districts for valid province and city', () => {
    const districts = getDistricts('440000', '440300')
    expect(districts.length).toBeGreaterThan(0)
    const names = districts.map((d) => d.name)
    expect(names).toContain('南山区')
    expect(names).toContain('福田区')
  })

  it('returns empty array for invalid codes', () => {
    expect(getDistricts('440000', '999999')).toEqual([])
    expect(getDistricts('999999', '440300')).toEqual([])
    expect(getDistricts('', '')).toEqual([])
  })
})

describe('getStreets', () => {
  it('returns streets for valid codes', () => {
    const streets = getStreets('440000', '440300', '440305')
    expect(streets.length).toBeGreaterThan(0)
    const names = streets.map((s) => s.name)
    expect(names).toContain('粤海街道')
  })

  it('returns empty array for invalid codes', () => {
    expect(getStreets('440000', '440300', '999999')).toEqual([])
    expect(getStreets('', '', '')).toEqual([])
  })
})

describe('getAddressPath', () => {
  it('returns full path with all four levels', () => {
    const path = getAddressPath('440000', '440300', '440305', '440305005')
    expect(path).toBe('广东省 / 深圳市 / 南山区 / 粤海街道')
  })

  it('returns partial path without street', () => {
    const path = getAddressPath('440000', '440300', '440305')
    expect(path).toBe('广东省 / 深圳市 / 南山区')
  })

  it('returns partial path without district and street', () => {
    const path = getAddressPath('440000', '440300')
    expect(path).toBe('广东省 / 深圳市')
  })

  it('returns province only', () => {
    const path = getAddressPath('440000')
    expect(path).toBe('广东省')
  })

  it('returns empty string for invalid codes', () => {
    expect(getAddressPath('999999')).toBe('')
    expect(getAddressPath('')).toBe('')
  })
})

describe('getDistrictCoordinate', () => {
  it('returns district coordinate when available', () => {
    const coord = getDistrictCoordinate('440000', '440300', '440305')
    expect(coord).not.toBeNull()
    expect(coord.lng).toBeCloseTo(113.93, 1)
    expect(coord.lat).toBeCloseTo(22.53, 1)
  })

  it('falls back to city coordinate if district lacks coordinates', () => {
    const coord = getDistrictCoordinate('110000', '110100', '110101')
    expect(coord).not.toBeNull()
    expect(typeof coord.lng).toBe('number')
    expect(typeof coord.lat).toBe('number')
  })

  it('returns null for invalid codes', () => {
    expect(getDistrictCoordinate('999999', '440300', '440305')).toBeNull()
  })
})

describe('fuzzyMatchAddresses', () => {
  it('returns empty array for empty keyword', () => {
    expect(fuzzyMatchAddresses('')).toEqual([])
    expect(fuzzyMatchAddresses('   ')).toEqual([])
  })

  it('finds results by province name', () => {
    const results = fuzzyMatchAddresses('广东')
    expect(results.length).toBeGreaterThan(0)
    results.forEach((r) => {
      expect(r.label).toContain('广东')
    })
  })

  it('finds results by district name', () => {
    const results = fuzzyMatchAddresses('朝阳')
    expect(results.length).toBeGreaterThan(0)
    const hasChaoyang = results.some((r) => r.label.includes('朝阳'))
    expect(hasChaoyang).toBe(true)
  })

  it('finds results by street name', () => {
    const results = fuzzyMatchAddresses('粤海')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].label).toContain('粤海')
  })

  it('each result has correct structure', () => {
    const results = fuzzyMatchAddresses('南山')
    expect(results.length).toBeGreaterThan(0)
    results.forEach((r) => {
      expect(r.provinceCode).toBeTruthy()
      expect(r.cityCode).toBeTruthy()
      expect(r.districtCode).toBeTruthy()
      expect(r.label).toBeTruthy()
      expect(r.matchLevel).toBeTruthy()
    })
  })

  it('sorts results by match level (street first)', () => {
    const results = fuzzyMatchAddresses('海淀')
    if (results.length > 1) {
      const levels = results.map((r) => r.matchLevel)
      const levelOrder = { street: 0, district: 1, city: 2, province: 3 }
      for (let i = 1; i < levels.length; i++) {
        expect(levelOrder[levels[i]]).toBeGreaterThanOrEqual(levelOrder[levels[i - 1]])
      }
    }
  })

  it('limits results to 50', () => {
    const results = fuzzyMatchAddresses('区')
    expect(results.length).toBeLessThanOrEqual(50)
  })

  it('returns empty for non-matching keyword', () => {
    const results = fuzzyMatchAddresses('不存在的地址xyz')
    expect(results.length).toBe(0)
  })
})

describe('loadHistory / saveHistory', () => {
  let storage

  beforeEach(() => {
    storage = createMockStorage()
  })

  it('returns empty array when no history', () => {
    const history = loadHistory(storage)
    expect(history).toEqual([])
  })

  it('loads saved history', () => {
    const data = [
      { provinceCode: '440000', cityCode: '440300', districtCode: '440305', streetCode: '440305005', label: '广东省 / 深圳市 / 南山区 / 粤海街道', timestamp: Date.now() },
    ]
    saveHistory(data, storage)
    const loaded = loadHistory(storage)
    expect(loaded).toEqual(data)
  })

  it('handles corrupted data gracefully', () => {
    storage.setItem(STORAGE_KEY, 'not-valid-json')
    expect(loadHistory(storage)).toEqual([])
  })

  it('filters out invalid entries', () => {
    const data = [
      { provinceCode: '440000', cityCode: '440300', districtCode: '440305', streetCode: '', label: 'test', timestamp: 1 },
      { provinceCode: '', cityCode: '', districtCode: '', label: 'bad' },
    ]
    saveHistory(data, storage)
    const loaded = loadHistory(storage)
    expect(loaded.length).toBe(1)
    expect(loaded[0].provinceCode).toBe('440000')
  })
})

describe('addToHistory', () => {
  it('adds entry to the beginning of history', () => {
    const history = [
      { provinceCode: '440000', cityCode: '440300', districtCode: '440305', streetCode: '', label: 'A', timestamp: 1 },
    ]
    const result = addToHistory(history, {
      provinceCode: '310000', cityCode: '310100', districtCode: '310115', streetCode: '', label: 'B',
    })
    expect(result[0].provinceCode).toBe('310000')
    expect(result.length).toBe(2)
  })

  it('removes duplicate entries', () => {
    const history = [
      { provinceCode: '440000', cityCode: '440300', districtCode: '440305', streetCode: '440305005', label: 'A', timestamp: 1 },
    ]
    const result = addToHistory(history, {
      provinceCode: '440000', cityCode: '440300', districtCode: '440305', streetCode: '440305005', label: 'A',
    })
    expect(result.length).toBe(1)
    expect(result[0].timestamp).toBeGreaterThan(1)
  })

  it('limits history to MAX_HISTORY', () => {
    const history = Array.from({ length: MAX_HISTORY + 5 }, (_, i) => ({
      provinceCode: `p${i}`,
      cityCode: `c${i}`,
      districtCode: `d${i}`,
      streetCode: `s${i}`,
      label: `item${i}`,
      timestamp: i,
    }))
    const result = addToHistory(history, {
      provinceCode: 'new', cityCode: 'new', districtCode: 'new', streetCode: '', label: 'new',
    })
    expect(result.length).toBeLessThanOrEqual(MAX_HISTORY)
  })

  it('ignores invalid entries', () => {
    const history = []
    const result = addToHistory(history, { provinceCode: '', cityCode: '', districtCode: '' })
    expect(result.length).toBe(0)
  })
})

describe('removeFromHistory', () => {
  it('removes matching entry', () => {
    const history = [
      { provinceCode: '440000', cityCode: '440300', districtCode: '440305', streetCode: '', label: 'A', timestamp: 1 },
      { provinceCode: '310000', cityCode: '310100', districtCode: '310115', streetCode: '', label: 'B', timestamp: 2 },
    ]
    const result = removeFromHistory(history, {
      provinceCode: '440000', cityCode: '440300', districtCode: '440305', streetCode: '',
    })
    expect(result.length).toBe(1)
    expect(result[0].provinceCode).toBe('310000')
  })

  it('returns same array if no match', () => {
    const history = [
      { provinceCode: '440000', cityCode: '440300', districtCode: '440305', streetCode: '', label: 'A', timestamp: 1 },
    ]
    const result = removeFromHistory(history, {
      provinceCode: '310000', cityCode: '310100', districtCode: '310115', streetCode: '',
    })
    expect(result.length).toBe(1)
  })
})

describe('lngLatToMapXY', () => {
  it('converts coordinates to x, y within bounds', () => {
    const { x, y } = lngLatToMapXY(116.41, 39.9, 800, 500)
    expect(x).toBeGreaterThan(0)
    expect(x).toBeLessThan(800)
    expect(y).toBeGreaterThan(0)
    expect(y).toBeLessThan(500)
  })

  it('top-left corner maps correctly', () => {
    const { x, y } = lngLatToMapXY(73, 54, 800, 500)
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(0)
  })

  it('bottom-right corner maps correctly', () => {
    const { x, y } = lngLatToMapXY(136, 3, 800, 500)
    expect(x).toBeCloseTo(800)
    expect(y).toBeCloseTo(500)
  })

  it('higher latitude produces smaller y', () => {
    const p1 = lngLatToMapXY(116, 30, 800, 500)
    const p2 = lngLatToMapXY(116, 40, 800, 500)
    expect(p2.y).toBeLessThan(p1.y)
  })

  it('higher longitude produces larger x', () => {
    const p1 = lngLatToMapXY(110, 30, 800, 500)
    const p2 = lngLatToMapXY(120, 30, 800, 500)
    expect(p2.x).toBeGreaterThan(p1.x)
  })
})

describe('cascade data consistency', () => {
  it('cities from a province have valid province code', () => {
    const provinces = getProvinces()
    provinces.forEach((p) => {
      const cities = getCities(p.code)
      cities.forEach((c) => {
        expect(c.code).toBeTruthy()
        expect(c.name).toBeTruthy()
      })
    })
  })

  it('districts from a city have valid codes', () => {
    const provinces = getProvinces()
    provinces.forEach((p) => {
      const cities = getCities(p.code)
      cities.forEach((c) => {
        const districts = getDistricts(p.code, c.code)
        districts.forEach((d) => {
          expect(d.code).toBeTruthy()
          expect(d.name).toBeTruthy()
        })
      })
    })
  })

  it('streets from a district have valid codes', () => {
    const provinces = getProvinces()
    provinces.forEach((p) => {
      const cities = getCities(p.code)
      cities.forEach((c) => {
        const districts = getDistricts(p.code, c.code)
        districts.forEach((d) => {
          const streets = getStreets(p.code, c.code, d.code)
          streets.forEach((s) => {
            expect(s.code).toBeTruthy()
            expect(s.name).toBeTruthy()
          })
        })
      })
    })
  })
})
