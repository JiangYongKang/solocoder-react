import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadHistory,
  saveHistory,
  addHistoryItem,
  deleteHistoryItem,
  clearAllHistory,
  formatTimestamp,
} from '../../json-to-ts/storage'
import { STORAGE_KEY, MAX_HISTORY_ITEMS } from '../../json-to-ts/constants'

describe('storage', () => {
  const mockLocalStorage = (() => {
    let store = {}
    return {
      getItem: (key) => store[key] || null,
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
  })()

  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: mockLocalStorage })
    mockLocalStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('loadHistory', () => {
    it('应该从 localStorage 加载历史记录', () => {
      const testData = [{ id: '1', jsonText: '{"a":1}', rootName: 'Test', timestamp: Date.now() }]
      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(testData))
      const result = loadHistory()
      expect(result).toEqual(testData)
    })

    it('localStorage 为空时应该返回空数组', () => {
      const result = loadHistory()
      expect(result).toEqual([])
    })

    it('localStorage 数据无效时应该返回空数组', () => {
      mockLocalStorage.setItem(STORAGE_KEY, 'invalid json')
      const result = loadHistory()
      expect(result).toEqual([])
    })

    it('localStorage 数据不是数组时应该返回空数组', () => {
      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'array' }))
      const result = loadHistory()
      expect(result).toEqual([])
    })
  })

  describe('saveHistory', () => {
    it('应该保存历史记录到 localStorage', () => {
      const testData = [{ id: '1', jsonText: '{"a":1}', rootName: 'Test', timestamp: Date.now() }]
      const result = saveHistory(testData)
      expect(result).toBe(true)
      const saved = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY))
      expect(saved).toEqual(testData)
    })

    it('应该限制保存的历史记录数量', () => {
      const manyItems = []
      for (let i = 0; i < 50; i++) {
        manyItems.push({ id: String(i), jsonText: `{"a":${i}}`, rootName: 'Test', timestamp: Date.now() })
      }
      saveHistory(manyItems)
      const saved = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY))
      expect(saved.length).toBe(MAX_HISTORY_ITEMS)
    })

    it('非数组输入应该保存为空数组', () => {
      saveHistory(null)
      const saved = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY))
      expect(saved).toEqual([])
    })
  })

  describe('addHistoryItem', () => {
    it('应该添加新的历史记录项', () => {
      const existing = []
      const itemData = {
        jsonText: '{"id":1,"name":"Test"}',
        rootName: 'User',
        generatedCode: 'export interface User { id: number; name: string }',
        summary: '{"id":1,"name":"Test"}',
      }
      const result = addHistoryItem(itemData, existing)
      expect(result.length).toBe(1)
      expect(result[0].jsonText).toBe(itemData.jsonText)
      expect(result[0].rootName).toBe(itemData.rootName)
      expect(result[0].id).toBeDefined()
      expect(result[0].timestamp).toBeDefined()
    })

    it('应该将新记录添加到列表开头', () => {
      const existing = [
        { id: 'old1', jsonText: '{"a":1}', rootName: 'Test', timestamp: 1000 },
      ]
      const itemData = {
        jsonText: '{"b":2}',
        rootName: 'Test2',
        generatedCode: '',
        summary: '{"b":2}',
      }
      const result = addHistoryItem(itemData, existing)
      expect(result.length).toBe(2)
      expect(result[0].jsonText).toBe('{"b":2}')
      expect(result[1].id).toBe('old1')
    })

    it('相同内容和根类型名的记录应该更新时间戳并移到顶部', () => {
      const existing = [
        { id: 'old1', jsonText: '{"a":1}', rootName: 'Test', timestamp: 1000, generatedCode: 'old code', summary: 'old summary' },
      ]
      const itemData = {
        jsonText: '{"a":1}',
        rootName: 'Test',
        generatedCode: 'new code',
        summary: 'new summary',
      }
      const result = addHistoryItem(itemData, existing)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('old1')
      expect(result[0].timestamp).toBeGreaterThan(1000)
      expect(result[0].generatedCode).toBe('new code')
      expect(result[0].summary).toBe('new summary')
    })

    it('空 JSON 文本不应该添加记录', () => {
      const existing = []
      const itemData = {
        jsonText: '',
        rootName: 'Test',
        generatedCode: '',
        summary: '',
      }
      const result = addHistoryItem(itemData, existing)
      expect(result.length).toBe(0)
    })

    it('应该限制历史记录总数不超过最大值', () => {
      const existing = []
      for (let i = MAX_HISTORY_ITEMS - 1; i >= 0; i--) {
        existing.push({
          id: String(i),
          jsonText: `{"a":${i}}`,
          rootName: 'Test',
          timestamp: 1000 + i,
          generatedCode: '',
          summary: '',
        })
      }
      const itemData = {
        jsonText: '{"new":true}',
        rootName: 'Test',
        generatedCode: '',
        summary: '',
      }
      const result = addHistoryItem(itemData, existing)
      expect(result.length).toBe(MAX_HISTORY_ITEMS)
      expect(result[0].jsonText).toBe('{"new":true}')
      expect(result[result.length - 1].id).toBe('1')
    })

    it('existingHistory 非数组时应该被当作空数组处理', () => {
      const itemData = {
        jsonText: '{"a":1}',
        rootName: 'Test',
        generatedCode: '',
        summary: '',
      }
      const result = addHistoryItem(itemData, null)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(1)
    })
  })

  describe('deleteHistoryItem', () => {
    it('应该删除指定 ID 的历史记录', () => {
      const existing = [
        { id: '1', jsonText: '{"a":1}', rootName: 'Test', timestamp: 1000 },
        { id: '2', jsonText: '{"b":2}', rootName: 'Test', timestamp: 2000 },
      ]
      const result = deleteHistoryItem('1', existing)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('2')
    })

    it('删除不存在的 ID 应该不改变列表', () => {
      const existing = [
        { id: '1', jsonText: '{"a":1}', rootName: 'Test', timestamp: 1000 },
      ]
      const result = deleteHistoryItem('999', existing)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('1')
    })

    it('existingHistory 非数组时应该返回空数组', () => {
      const result = deleteHistoryItem('1', null)
      expect(result).toEqual([])
    })
  })

  describe('clearAllHistory', () => {
    it('应该清空所有历史记录', () => {
      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: '1', jsonText: '{}' }]))
      const result = clearAllHistory()
      expect(result).toEqual([])
      expect(mockLocalStorage.getItem(STORAGE_KEY)).toBe('[]')
    })
  })

  describe('formatTimestamp', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('应该格式化刚刚过去的时间', () => {
      const now = Date.now()
      expect(formatTimestamp(now - 30 * 1000)).toBe('刚刚')
    })

    it('应该格式化分钟级别的时间', () => {
      const now = Date.now()
      expect(formatTimestamp(now - 5 * 60 * 1000)).toBe('5 分钟前')
    })

    it('应该格式化小时级别的时间', () => {
      const now = Date.now()
      expect(formatTimestamp(now - 3 * 60 * 60 * 1000)).toBe('3 小时前')
    })

    it('应该格式化天级别的时间', () => {
      const now = Date.now()
      expect(formatTimestamp(now - 2 * 24 * 60 * 60 * 1000)).toBe('2 天前')
    })

    it('超过7天应该显示完整日期时间', () => {
      const oldDate = new Date('2024-01-01T10:30:00Z').getTime()
      expect(formatTimestamp(oldDate)).toBe('2024-01-01 10:30')
    })

    it('无效时间戳应该返回空字符串', () => {
      expect(formatTimestamp(null)).toBe('')
      expect(formatTimestamp(undefined)).toBe('')
      expect(formatTimestamp(NaN)).toBe('')
      expect(formatTimestamp('not a number')).toBe('')
    })

    it('非数字输入应该返回空字符串', () => {
      expect(formatTimestamp('2024-01-01')).toBe('')
      expect(formatTimestamp({})).toBe('')
      expect(formatTimestamp([])).toBe('')
    })
  })
})
