import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadHistory,
  saveHistory,
  addHistoryItem,
  removeHistoryItem,
  clearHistory,
} from '../../text-diff/storage'

describe('storage', () => {
  const storeRef = { data: {} }
  const mockLocalStorage = {
    getItem: vi.fn((key) => storeRef.data[key] || null),
    setItem: vi.fn((key, value) => {
      storeRef.data[key] = value
    }),
    removeItem: vi.fn((key) => {
      delete storeRef.data[key]
    }),
    clear: vi.fn(() => {
      storeRef.data = {}
    }),
  }

  const resetMocks = () => {
    storeRef.data = {}
    vi.clearAllMocks()
  }

  beforeEach(() => {
    resetMocks()
    vi.stubGlobal('localStorage', mockLocalStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    resetMocks()
  })

  describe('loadHistory', () => {
    it('localStorage 为空时应该返回空数组', () => {
      const result = loadHistory()
      expect(result).toEqual([])
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('text-diff-history')
    })

    it('应该正确解析存储的历史记录', () => {
      const testData = [
        {
          id: '1',
          titleA: '文本 A',
          titleB: '文本 B',
          textA: 'hello',
          textB: 'world',
          timestamp: 1234567890,
        },
      ]
      mockLocalStorage.setItem('text-diff-history', JSON.stringify(testData))

      const result = loadHistory()
      expect(result).toEqual(testData)
    })

    it('JSON 解析失败时应该返回空数组', () => {
      mockLocalStorage.setItem('text-diff-history', 'invalid json')
      const result = loadHistory()
      expect(result).toEqual([])
    })

    it('存储的值不是数组时应该返回空数组', () => {
      mockLocalStorage.setItem('text-diff-history', JSON.stringify({ not: 'array' }))
      const result = loadHistory()
      expect(result).toEqual([])
    })

    it('应该限制最多返回 10 条记录', () => {
      const testData = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        titleA: `A${i}`,
        titleB: `B${i}`,
        textA: `textA${i}`,
        textB: `textB${i}`,
        timestamp: 1234567890 + i,
      }))
      mockLocalStorage.setItem('text-diff-history', JSON.stringify(testData))

      const result = loadHistory()
      expect(result.length).toBe(10)
      expect(result[0].id).toBe('0')
      expect(result[9].id).toBe('9')
    })
  })

  describe('saveHistory', () => {
    it('应该正确保存历史记录到 localStorage', () => {
      const testData = [
        {
          id: '1',
          titleA: 'A',
          titleB: 'B',
          textA: 'ta',
          textB: 'tb',
          timestamp: 123,
        },
      ]

      saveHistory(testData)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'text-diff-history',
        JSON.stringify(testData)
      )
    })

    it('应该限制最多保存 10 条记录', () => {
      const testData = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        titleA: `A${i}`,
        titleB: `B${i}`,
        textA: `ta${i}`,
        textB: `tb${i}`,
        timestamp: 123 + i,
      }))

      saveHistory(testData)
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
      expect(savedData.length).toBe(10)
    })

    it('输入不是数组时应该保存空数组', () => {
      saveHistory(null)
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
      expect(savedData).toEqual([])
    })

    it('localStorage 出错时不应该抛出异常', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Quota exceeded')
      })
      expect(() => saveHistory([{ id: '1', titleA: 'A', titleB: 'B', textA: '', textB: '', timestamp: 123 }])).not.toThrow()
    })
  })

  describe('addHistoryItem', () => {
    it('应该添加新的历史记录并返回更新后的列表', () => {
      const item = {
        titleA: '测试 A',
        titleB: '测试 B',
        textA: '文本内容 A',
        textB: '文本内容 B',
      }

      const result = addHistoryItem(item)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(1)
      expect(result[0].titleA).toBe('测试 A')
      expect(result[0].titleB).toBe('测试 B')
      expect(result[0].textA).toBe('文本内容 A')
      expect(result[0].textB).toBe('文本内容 B')
      expect(result[0].id).toBeDefined()
      expect(result[0].timestamp).toBeDefined()
      expect(typeof result[0].id).toBe('string')
      expect(typeof result[0].timestamp).toBe('number')
    })

    it('应该自动生成 id 和 timestamp', () => {
      const before = Date.now()
      const result = addHistoryItem({ titleA: 'A', titleB: 'B', textA: '', textB: '' })
      const after = Date.now()
      expect(result[0].timestamp).toBeGreaterThanOrEqual(before)
      expect(result[0].timestamp).toBeLessThanOrEqual(after)
      expect(result[0].id.length).toBeGreaterThan(0)
    })

    it('新记录应该添加到列表开头', () => {
      addHistoryItem({ titleA: '第一', titleB: '第一 B', textA: '1', textB: '1b' })
      const result = addHistoryItem({ titleA: '第二', titleB: '第二 B', textA: '2', textB: '2b' })
      expect(result[0].titleA).toBe('第二')
      expect(result[1].titleA).toBe('第一')
    })

    it('应该去重相同内容的记录', () => {
      addHistoryItem({ titleA: 'A', titleB: 'B', textA: 'hello', textB: 'world' })
      const result = addHistoryItem({ titleA: 'A2', titleB: 'B2', textA: 'hello', textB: 'world' })
      expect(result.length).toBe(1)
      expect(result[0].titleA).toBe('A2')
    })

    it('最多保存 10 条记录', () => {
      for (let i = 0; i < 15; i++) {
        addHistoryItem({
          titleA: `A${i}`,
          titleB: `B${i}`,
          textA: `ta${i}`,
          textB: `tb${i}`,
        })
      }
      const result = loadHistory()
      expect(result.length).toBe(10)
    })

    it('item 为 undefined 时应该使用默认值', () => {
      const result = addHistoryItem(undefined)
      expect(result[0].titleA).toBe('文本 A')
      expect(result[0].titleB).toBe('文本 B')
      expect(result[0].textA).toBe('')
      expect(result[0].textB).toBe('')
    })

    it('item 字段缺失时应该使用默认值', () => {
      const result = addHistoryItem({ textA: 'onlyA' })
      expect(result[0].titleA).toBe('文本 A')
      expect(result[0].titleB).toBe('文本 B')
      expect(result[0].textA).toBe('onlyA')
      expect(result[0].textB).toBe('')
    })
  })

  describe('removeHistoryItem', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(1000)
      addHistoryItem({ titleA: 'A1', titleB: 'B1', textA: 't1', textB: 'tb1' })
      vi.advanceTimersByTime(1)
      addHistoryItem({ titleA: 'A2', titleB: 'B2', textA: 't2', textB: 'tb2' })
      vi.advanceTimersByTime(1)
      addHistoryItem({ titleA: 'A3', titleB: 'B3', textA: 't3', textB: 'tb3' })
      vi.useRealTimers()
    })

    it('应该删除指定 id 的记录', () => {
      const history = loadHistory()
      expect(history.length).toBe(3)
      const idToRemove = history[1].id
      const result = removeHistoryItem(idToRemove)
      expect(result.length).toBe(2)
      expect(result.find((h) => h.id === idToRemove)).toBeUndefined()  
      expect(result[0].id).toBe(history[0].id)
      expect(result[1].id).toBe(history[2].id)
    })

    it('删除不存在的 id 时不应该改变列表', () => {
      const before = loadHistory()
      const result = removeHistoryItem('non-existent-id')
      expect(result.length).toBe(before.length)
      expect(result).toEqual(before)
    })

    it('删除后应该保存到 localStorage', () => {
      const history = loadHistory()
      expect(history.length).toBe(3)
      const idToRemove = history[0].id
      removeHistoryItem(idToRemove)
      const after = loadHistory()
      expect(after.length).toBe(2)
    })
  })

  describe('clearHistory', () => {
    beforeEach(() => {
      addHistoryItem({ titleA: 'A1', titleB: 'B1', textA: 't1', textB: 'tb1' })
      addHistoryItem({ titleA: 'A2', titleB: 'B2', textA: 't2', textB: 'tb2' })
    })

    it('应该清空所有历史记录', () => {
      const result = clearHistory()
      expect(result).toEqual([])
      const after = loadHistory()
      expect(after).toEqual([])
    })

    it('应该调用 localStorage.removeItem', () => {
      clearHistory()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('text-diff-history')
    })

    it('localStorage 出错时不应该抛出异常', () => {
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })
      expect(() => clearHistory()).not.toThrow()
    })
  })
})
