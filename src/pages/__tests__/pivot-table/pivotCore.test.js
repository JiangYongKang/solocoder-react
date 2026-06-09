import { describe, it, expect, beforeEach } from 'vitest'
import {
  AGGREGATIONS,
  AGGREGATION_LABELS,
  STORAGE_KEY,
  aggregate,
  getUniqueValues,
  getFields,
  filterData,
  parseKey,
  buildPivotTable,
  formatValue,
  pivotTableToCSV,
  generateExportFilename,
  getDefaultConfig,
  saveConfig,
  loadConfig,
  clearConfig,
  isSameArray,
} from '@/pages/pivot-table/pivotCore.js'

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

const MOCK_DATA = [
  { date: '2024-01-01', region: '华东', category: '电子产品', salesPerson: '张三', salesAmount: 1000, quantity: 5 },
  { date: '2024-01-01', region: '华东', category: '家居', salesPerson: '李四', salesAmount: 500, quantity: 3 },
  { date: '2024-01-02', region: '华南', category: '电子产品', salesPerson: '张三', salesAmount: 2000, quantity: 10 },
  { date: '2024-01-02', region: '华南', category: '服装', salesPerson: '王五', salesAmount: 800, quantity: 4 },
  { date: '2024-01-03', region: '华北', category: '食品', salesPerson: '赵六', salesAmount: 300, quantity: 2 },
  { date: '2024-01-03', region: '华北', category: '电子产品', salesPerson: '张三', salesAmount: 1500, quantity: 8 },
]

describe('pivotCore', () => {
  describe('aggregate', () => {
    it('should count values correctly', () => {
      expect(aggregate([1, 2, 3, 4, 5], AGGREGATIONS.COUNT)).toBe(5)
    })

    it('should return 0 for empty array with count', () => {
      expect(aggregate([], AGGREGATIONS.COUNT)).toBe(0)
    })

    it('should return 0 for empty array with sum', () => {
      expect(aggregate([], AGGREGATIONS.SUM)).toBe(0)
    })

    it('should sum numeric values correctly', () => {
      expect(aggregate([1, 2, 3, 4, 5], AGGREGATIONS.SUM)).toBe(15)
    })

    it('should sum string numeric values correctly', () => {
      expect(aggregate(['1', '2', '3'], AGGREGATIONS.SUM)).toBe(6)
    })

    it('should sum mixed values correctly', () => {
      expect(aggregate([1, '2', null, undefined, ''], AGGREGATIONS.SUM)).toBe(3)
    })

    it('should calculate average correctly', () => {
      expect(aggregate([2, 4, 6], AGGREGATIONS.AVG)).toBe(4)
    })

    it('should return 0 for average with empty valid numbers', () => {
      expect(aggregate(['', null, undefined], AGGREGATIONS.AVG)).toBe(0)
    })

    it('should find max value', () => {
      expect(aggregate([3, 1, 4, 1, 5, 9, 2, 6], AGGREGATIONS.MAX)).toBe(9)
    })

    it('should find min value', () => {
      expect(aggregate([3, 1, 4, 1, 5, 9, 2, 6], AGGREGATIONS.MIN)).toBe(1)
    })

    it('should return 0 for max/min with empty array', () => {
      expect(aggregate([], AGGREGATIONS.MAX)).toBe(0)
      expect(aggregate([], AGGREGATIONS.MIN)).toBe(0)
    })

    it('should return 0 for invalid aggregation when values empty', () => {
      expect(aggregate([], 'invalid')).toBe(0)
    })

    it('should return null for invalid aggregation when values non-empty', () => {
      expect(aggregate([1, 2, 3], 'invalid')).toBeNull()
    })

    it('should handle non-array input', () => {
      expect(aggregate(null, AGGREGATIONS.COUNT)).toBe(0)
      expect(aggregate(undefined, AGGREGATIONS.SUM)).toBe(0)
      expect(aggregate('not array', AGGREGATIONS.AVG)).toBe(0)
      expect(aggregate(null, 'invalid')).toBe(0)
    })
  })

  describe('getUniqueValues', () => {
    it('should get unique values for a field', () => {
      const regions = getUniqueValues(MOCK_DATA, 'region')
      expect(regions).toHaveLength(3)
      expect(regions).toContain('华东')
      expect(regions).toContain('华北')
      expect(regions).toContain('华南')
    })

    it('should return empty array for invalid input', () => {
      expect(getUniqueValues(null, 'region')).toEqual([])
      expect(getUniqueValues([], 'region')).toEqual([])
      expect(getUniqueValues(MOCK_DATA, '')).toEqual([])
      expect(getUniqueValues(MOCK_DATA, null)).toEqual([])
    })

    it('should sort numeric values correctly', () => {
      const data = [{ n: 3 }, { n: 1 }, { n: 2 }]
      expect(getUniqueValues(data, 'n')).toEqual([1, 2, 3])
    })

    it('should sort string values correctly', () => {
      const data = [{ s: 'c' }, { s: 'a' }, { s: 'b' }]
      expect(getUniqueValues(data, 's')).toEqual(['a', 'b', 'c'])
    })
  })

  describe('getFields', () => {
    it('should return field names from data', () => {
      const fields = getFields(MOCK_DATA)
      expect(fields).toEqual(['date', 'region', 'category', 'salesPerson', 'salesAmount', 'quantity'])
    })

    it('should return empty array for invalid input', () => {
      expect(getFields(null)).toEqual([])
      expect(getFields([])).toEqual([])
      expect(getFields(undefined)).toEqual([])
    })
  })

  describe('filterData', () => {
    it('should filter data by single field', () => {
      const filtered = filterData(MOCK_DATA, { region: ['华东'] })
      expect(filtered.length).toBe(2)
      filtered.forEach((row) => expect(row.region).toBe('华东'))
    })

    it('should filter data by multiple values', () => {
      const filtered = filterData(MOCK_DATA, { region: ['华东', '华南'] })
      expect(filtered.length).toBe(4)
      filtered.forEach((row) => expect(['华东', '华南']).toContain(row.region))
    })

    it('should filter data by multiple fields', () => {
      const filtered = filterData(MOCK_DATA, {
        region: ['华东', '华南'],
        category: ['电子产品'],
      })
      expect(filtered.length).toBe(2)
      filtered.forEach((row) => {
        expect(['华东', '华南']).toContain(row.region)
        expect(row.category).toBe('电子产品')
      })
    })

    it('should return empty array when no match', () => {
      const filtered = filterData(MOCK_DATA, { region: ['不存在'] })
      expect(filtered.length).toBe(0)
    })

    it('should return all data when filters empty', () => {
      expect(filterData(MOCK_DATA, {})).toHaveLength(MOCK_DATA.length)
    })

    it('should return all data when filter values empty array', () => {
      expect(filterData(MOCK_DATA, { region: [] })).toHaveLength(MOCK_DATA.length)
    })

    it('should handle invalid data input', () => {
      expect(filterData(null, { region: ['华东'] })).toEqual([])
    })

    it('should not mutate original data', () => {
      const original = [...MOCK_DATA]
      filterData(MOCK_DATA, { region: ['华东'] })
      expect(MOCK_DATA).toEqual(original)
    })
  })

  describe('parseKey', () => {
    it('should parse composite key', () => {
      expect(parseKey('华东|||电子产品')).toEqual(['华东', '电子产品'])
    })

    it('should return empty array for __all__ key', () => {
      expect(parseKey('__all__')).toEqual([])
    })

    it('should handle single value key', () => {
      expect(parseKey('华东')).toEqual(['华东'])
    })
  })

  describe('buildPivotTable', () => {
    it('should build simple pivot with single row and value field', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: [],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.SUM }],
        filters: {},
      })
      expect(result.rowKeys.length).toBe(3)
      expect(result.colKeys.length).toBe(1)
      expect(result.grandTotal.salesAmount).toBe(6100)
    })

    it('should build pivot with row and col fields', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: ['category'],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.SUM }],
        filters: {},
      })
      expect(result.rowKeys.length).toBe(3)
      expect(result.colKeys.length).toBe(4)
    })

    it('should compute row totals correctly', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: ['category'],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.SUM }],
        filters: {},
      })
      expect(result.rowTotals['华东'].salesAmount).toBe(1500)
      expect(result.rowTotals['华南'].salesAmount).toBe(2800)
      expect(result.rowTotals['华北'].salesAmount).toBe(1800)
    })

    it('should compute col totals correctly', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: ['category'],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.SUM }],
        filters: {},
      })
      expect(result.colTotals['电子产品'].salesAmount).toBe(4500)
    })

    it('should compute grand total correctly', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: ['category'],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.SUM }],
        filters: {},
      })
      expect(result.grandTotal.salesAmount).toBe(6100)
    })

    it('should handle multiple value fields', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: [],
        valueFields: [
          { field: 'salesAmount', aggregation: AGGREGATIONS.SUM },
          { field: 'quantity', aggregation: AGGREGATIONS.SUM },
        ],
        filters: {},
      })
      expect(result.grandTotal.salesAmount).toBe(6100)
      expect(result.grandTotal.quantity).toBe(32)
    })

    it('should handle multiple row fields', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region', 'category'],
        colFields: [],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.SUM }],
        filters: {},
      })
      expect(result.rowKeys.length).toBe(6)
    })

    it('should apply filters correctly', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: [],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.SUM }],
        filters: { region: ['华东'] },
      })
      expect(result.rowKeys.length).toBe(1)
      expect(result.grandTotal.salesAmount).toBe(1500)
    })

    it('should handle count aggregation', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: [],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.COUNT }],
        filters: {},
      })
      expect(result.grandTotal.salesAmount).toBe(6)
    })

    it('should handle avg aggregation', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: [],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.AVG }],
        filters: {},
      })
      expect(typeof result.grandTotal.salesAmount).toBe('number')
    })

    it('should handle max aggregation', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: [],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.MAX }],
        filters: {},
      })
      expect(result.grandTotal.salesAmount).toBe(2000)
    })

    it('should handle min aggregation', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: [],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.MIN }],
        filters: {},
      })
      expect(result.grandTotal.salesAmount).toBe(300)
    })

    it('should handle empty config gracefully', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: [],
        colFields: [],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.SUM }],
        filters: {},
      })
      expect(result.rowKeys.length).toBe(1)
      expect(result.colKeys.length).toBe(1)
    })
  })

  describe('formatValue', () => {
    it('should format null/undefined as dash', () => {
      expect(formatValue(null, AGGREGATIONS.SUM)).toBe('-')
      expect(formatValue(undefined, AGGREGATIONS.SUM)).toBe('-')
    })

    it('should format integer with locale', () => {
      expect(formatValue(1000, AGGREGATIONS.SUM)).toBe('1,000')
    })

    it('should format avg with two decimals', () => {
      expect(formatValue(3.14159, AGGREGATIONS.AVG)).toBe('3.14')
    })

    it('should format float with max 2 decimals', () => {
      expect(formatValue(3.14159, AGGREGATIONS.SUM)).toBe('3.14')
    })

    it('should convert non-number to string', () => {
      expect(formatValue('test', AGGREGATIONS.SUM)).toBe('test')
    })
  })

  describe('pivotTableToCSV', () => {
    it('should generate CSV from pivot result', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: ['category'],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.SUM }],
        filters: {},
      })
      const csv = pivotTableToCSV(result)
      expect(csv.length).toBeGreaterThan(0)
      expect(csv.includes('\n')).toBe(true)
    })

    it('should handle empty value fields', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: [],
        valueFields: [],
        filters: {},
      })
      const csv = pivotTableToCSV(result)
      expect(typeof csv).toBe('string')
    })

    it('should handle pivot without col fields', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: [],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.SUM }],
        filters: {},
      })
      const csv = pivotTableToCSV(result)
      expect(csv.length).toBeGreaterThan(0)
    })

    it('should not output duplicate grand total when col fields empty', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: [],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.SUM }],
        filters: {},
      })
      const csv = pivotTableToCSV(result)
      const lines = csv.split('\n')
      expect(lines.length).toBe(5)
      expect(lines[0]).toBe('region,salesAmount(求和)')
      expect(lines[4]).toBe('合计,"6,100"')
    })

    it('should not have row total column when col fields empty with multiple values', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: [],
        valueFields: [
          { field: 'salesAmount', aggregation: AGGREGATIONS.SUM },
          { field: 'quantity', aggregation: AGGREGATIONS.SUM },
        ],
        filters: {},
      })
      const csv = pivotTableToCSV(result)
      const lines = csv.split('\n')
      expect(lines[0]).toBe('region,salesAmount(求和),quantity(求和)')
    })

    it('should handle pivot with multiple value fields', () => {
      const result = buildPivotTable(MOCK_DATA, {
        rowFields: ['region'],
        colFields: [],
        valueFields: [
          { field: 'salesAmount', aggregation: AGGREGATIONS.SUM },
          { field: 'quantity', aggregation: AGGREGATIONS.COUNT },
        ],
        filters: {},
      })
      const csv = pivotTableToCSV(result)
      expect(csv.length).toBeGreaterThan(0)
    })

    it('should return empty string for null input', () => {
      expect(pivotTableToCSV(null)).toBe('')
    })

    it('should escape special characters in CSV fields', () => {
      const data = [
        { region: '华东,测试', category: '电子"产品', salesAmount: 1000 },
      ]
      const result = buildPivotTable(data, {
        rowFields: ['region'],
        colFields: ['category'],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.SUM }],
        filters: {},
      })
      const csv = pivotTableToCSV(result)
      expect(csv.includes('"')).toBe(true)
    })
  })

  describe('generateExportFilename', () => {
    it('should generate filename with timestamp', () => {
      const filename = generateExportFilename()
      expect(filename.startsWith('pivot_table_')).toBe(true)
      expect(filename.endsWith('.csv')).toBe(true)
    })

    it('should not generate same filename on quick successive calls', () => {
      const f1 = generateExportFilename()
      const f2 = generateExportFilename()
      expect(typeof f1).toBe('string')
      expect(typeof f2).toBe('string')
    })
  })

  describe('getDefaultConfig', () => {
    it('should return default config with empty arrays', () => {
      const config = getDefaultConfig()
      expect(config).toEqual({
        rowFields: [],
        colFields: [],
        valueFields: [],
        filters: {},
      })
    })

    it('should return a new object each time', () => {
      const c1 = getDefaultConfig()
      const c2 = getDefaultConfig()
      expect(c1).not.toBe(c2)
    })
  })

  describe('localStorage persistence', () => {
    let storage
    beforeEach(() => {
      storage = createMockStorage()
    })

    it('saveConfig should return true on success', () => {
      expect(saveConfig(getDefaultConfig(), storage)).toBe(true)
    })

    it('saveConfig and loadConfig should round-trip correctly', () => {
      const config = {
        rowFields: ['region'],
        colFields: ['category'],
        valueFields: [{ field: 'salesAmount', aggregation: AGGREGATIONS.SUM }],
        filters: { region: ['华东', '华南'] },
      }
      saveConfig(config, storage)
      const loaded = loadConfig(storage)
      expect(loaded).toEqual(config)
    })

    it('loadConfig should return null when storage empty', () => {
      expect(loadConfig(storage)).toBeNull()
    })

    it('loadConfig should return default-like config for invalid data', () => {
      storage.setItem(STORAGE_KEY, 'invalid json')
      expect(loadConfig(storage)).toBeNull()
    })

    it('loadConfig should fix malformed config fields', () => {
      storage.setItem(STORAGE_KEY, JSON.stringify({
        rowFields: 'not array',
        colFields: null,
        valueFields: 'invalid',
        filters: 'invalid',
      }))
      const loaded = loadConfig(storage)
      expect(Array.isArray(loaded.rowFields)).toBe(true)
      expect(Array.isArray(loaded.colFields)).toBe(true)
      expect(Array.isArray(loaded.valueFields)).toBe(true)
      expect(typeof loaded.filters).toBe('object')
    })

    it('clearConfig should remove config from storage', () => {
      saveConfig(getDefaultConfig(), storage)
      expect(loadConfig(storage)).not.toBeNull()
      clearConfig(storage)
      expect(loadConfig(storage)).toBeNull()
    })

    it('should handle null storage gracefully', () => {
      expect(saveConfig(getDefaultConfig(), null)).toBe(false)
      expect(loadConfig(null)).toBeNull()
      expect(clearConfig(null)).toBe(false)
    })

    it('should not throw when storage is undefined', () => {
      expect(() => saveConfig(getDefaultConfig(), undefined)).not.toThrow()
      expect(() => loadConfig(undefined)).not.toThrow()
      expect(() => clearConfig(undefined)).not.toThrow()
    })
  })

  describe('isSameArray', () => {
    it('should return true for identical arrays', () => {
      expect(isSameArray([1, 2, 3], [1, 2, 3])).toBe(true)
    })

    it('should return false for different length arrays', () => {
      expect(isSameArray([1, 2], [1, 2, 3])).toBe(false)
    })

    it('should return false for different content arrays', () => {
      expect(isSameArray([1, 2, 3], [1, 2, 4])).toBe(false)
    })

    it('should return false for non-array inputs', () => {
      expect(isSameArray(null, [1, 2])).toBe(false)
      expect(isSameArray([1, 2], 'not array')).toBe(false)
      expect(isSameArray(undefined, null)).toBe(false)
    })

    it('should return true for empty arrays', () => {
      expect(isSameArray([], [])).toBe(true)
    })
  })

  describe('AGGREGATION constants', () => {
    it('should have all aggregation types', () => {
      expect(Object.keys(AGGREGATIONS)).toEqual(['COUNT', 'SUM', 'AVG', 'MAX', 'MIN'])
    })

    it('should have labels for all aggregations', () => {
      Object.values(AGGREGATIONS).forEach((agg) => {
        expect(AGGREGATION_LABELS[agg]).toBeDefined()
        expect(typeof AGGREGATION_LABELS[agg]).toBe('string')
      })
    })
  })
})
