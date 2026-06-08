import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadHistory,
  saveHistory,
  addHistoryItem,
  deleteHistoryItem,
  clearHistory,
  clearAllHistory,
  toggleFavorite,
  formatTimestamp,
} from '../../regex-tester/storage'
import { DEFAULT_FLAGS } from '../../regex-tester/regexUtils'

const STORAGE_KEY = 'regex_tester_history'

describe('History Storage Utils', () => {
  let mockStorage = {}
  let originalWindow

  beforeEach(() => {
    mockStorage = {}
    originalWindow = globalThis.window
    globalThis.window = {
      localStorage: {
        getItem: vi.fn((key) => mockStorage[key] ?? null),
        setItem: vi.fn((key, value) => {
          mockStorage[key] = String(value)
        }),
        removeItem: vi.fn((key) => {
          delete mockStorage[key]
        }),
        clear: vi.fn(() => {
          mockStorage = {}
        }),
      },
    }
  })

  afterEach(() => {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow
    } else {
      delete globalThis.window
    }
  })

  describe('loadHistory', () => {
    it('没有存储数据时应该返回空数组', () => {
      expect(loadHistory()).toEqual([])
    })

    it('应该正确解析存储的 JSON 数据', () => {
      const data = [{ id: '1', pattern: '\\d+', flags: DEFAULT_FLAGS, testText: 'test' }]
      mockStorage[STORAGE_KEY] = JSON.stringify(data)
      expect(loadHistory()).toEqual(data)
    })

    it('无效的 JSON 应该返回空数组', () => {
      mockStorage[STORAGE_KEY] = 'invalid json'
      expect(loadHistory()).toEqual([])
    })

    it('非数组数据应该返回空数组', () => {
      mockStorage[STORAGE_KEY] = JSON.stringify({ not: 'array' })
      expect(loadHistory()).toEqual([])
    })
  })

  describe('saveHistory', () => {
    it('应该成功保存数组到 localStorage', () => {
      const data = [{ id: '1', pattern: 'a' }]
      const result = saveHistory(data)
      expect(result).toBe(true)
      expect(mockStorage[STORAGE_KEY]).toBe(JSON.stringify(data))
    })

    it('非数组输入应该被当作空数组处理', () => {
      saveHistory(null)
      expect(mockStorage[STORAGE_KEY]).toBe(JSON.stringify([]))
    })

    it('应该限制保存数量不超过 100 条', () => {
      const data = Array.from({ length: 150 }, (_, i) => ({ id: String(i), pattern: String(i) }))
      saveHistory(data)
      const saved = JSON.parse(mockStorage[STORAGE_KEY])
      expect(saved.length).toBe(100)
      expect(saved[0].id).toBe('0')
      expect(saved[99].id).toBe('99')
    })
  })

  describe('addHistoryItem', () => {
    it('空正则表达式不应该添加', () => {
      const history = []
      const result = addHistoryItem('', DEFAULT_FLAGS, 'test', history)
      expect(result).toBe(history)
      expect(mockStorage[STORAGE_KEY]).toBeUndefined()
    })

    it('应该正确添加新的历史记录', () => {
      const result = addHistoryItem('\\d+', DEFAULT_FLAGS, 'test123', [])
      expect(result.length).toBe(1)
      expect(result[0].pattern).toBe('\\d+')
      expect(result[0].testText).toBe('test123')
      expect(result[0].flags).toEqual(DEFAULT_FLAGS)
      expect(result[0].favorite).toBe(false)
      expect(typeof result[0].id).toBe('string')
      expect(typeof result[0].timestamp).toBe('number')
    })

    it('相同的正则和文本应该更新时间戳而不是重复添加', () => {
      const oldTime = Date.now() - 100000
      const existing = [
        {
          id: 'old',
          pattern: '\\d+',
          flags: DEFAULT_FLAGS,
          testText: 'test',
          timestamp: oldTime,
          favorite: false,
        },
      ]
      const result = addHistoryItem('\\d+', DEFAULT_FLAGS, 'test', existing)
      expect(result.length).toBe(1)
      expect(result[0].timestamp).toBeGreaterThan(oldTime)
      expect(result[0].id).toBe('old')
    })

    it('新记录应该放在数组最前面', () => {
      const existing = [{ id: 'first', pattern: 'a', flags: DEFAULT_FLAGS, testText: '', timestamp: 1, favorite: false }]
      const result = addHistoryItem('b', DEFAULT_FLAGS, '', existing)
      expect(result.length).toBe(2)
      expect(result[0].pattern).toBe('b')
      expect(result[1].id).toBe('first')
    })

    it('应该自动保存到 localStorage', () => {
      addHistoryItem('test', DEFAULT_FLAGS, '', [])
      expect(mockStorage[STORAGE_KEY]).toBeDefined()
    })

    it('未传入历史记录时应该创建新数组', () => {
      const result = addHistoryItem('test', DEFAULT_FLAGS, '', undefined)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(1)
    })

    it('标志位不同时应该视为不同的记录', () => {
      const existing = [
        {
          id: '1',
          pattern: 'test',
          flags: { ...DEFAULT_FLAGS, ignoreCase: false },
          testText: '',
          timestamp: 1,
          favorite: false,
        },
      ]
      const result = addHistoryItem('test', { ...DEFAULT_FLAGS, ignoreCase: true }, '', existing)
      expect(result.length).toBe(2)
    })
  })

  describe('deleteHistoryItem', () => {
    it('应该正确删除指定 id 的记录', () => {
      const history = [
        { id: '1', pattern: 'a' },
        { id: '2', pattern: 'b' },
      ]
      const result = deleteHistoryItem('1', history)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('2')
    })

    it('删除不存在的 id 应该不影响数组', () => {
      const history = [{ id: '1', pattern: 'a' }]
      const result = deleteHistoryItem('nonexistent', history)
      expect(result.length).toBe(1)
    })

    it('应该自动保存到 localStorage', () => {
      const history = [{ id: '1', pattern: 'a' }]
      deleteHistoryItem('1', history)
      expect(mockStorage[STORAGE_KEY]).toBe(JSON.stringify([]))
    })
  })

  describe('clearHistory', () => {
    it('应该清除非收藏的历史记录', () => {
      const history = [
        { id: '1', pattern: 'a', favorite: false },
        { id: '2', pattern: 'b', favorite: true },
        { id: '3', pattern: 'c', favorite: false },
      ]
      const result = clearHistory(history)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('2')
    })

    it('应该自动保存到 localStorage', () => {
      clearHistory([{ id: '1', pattern: 'a', favorite: false }])
      expect(mockStorage[STORAGE_KEY]).toBe(JSON.stringify([]))
    })
  })

  describe('clearAllHistory', () => {
    it('应该清空所有历史记录包括收藏', () => {
      mockStorage[STORAGE_KEY] = JSON.stringify([
        { id: '1', pattern: 'a', favorite: true },
        { id: '2', pattern: 'b', favorite: false },
      ])
      const result = clearAllHistory()
      expect(result).toEqual([])
      expect(mockStorage[STORAGE_KEY]).toBe(JSON.stringify([]))
    })
  })

  describe('toggleFavorite', () => {
    it('应该切换收藏状态', () => {
      const history = [{ id: '1', pattern: 'a', favorite: false }]
      let result = toggleFavorite('1', history)
      expect(result[0].favorite).toBe(true)
      result = toggleFavorite('1', result)
      expect(result[0].favorite).toBe(false)
    })

    it('切换不存在的 id 应该不影响数组', () => {
      const history = [{ id: '1', pattern: 'a', favorite: false }]
      const result = toggleFavorite('nonexistent', history)
      expect(result[0].favorite).toBe(false)
    })

    it('应该自动保存到 localStorage', () => {
      const history = [{ id: '1', pattern: 'a', favorite: false }]
      toggleFavorite('1', history)
      const saved = JSON.parse(mockStorage[STORAGE_KEY])
      expect(saved[0].favorite).toBe(true)
    })
  })
})

describe('formatTimestamp', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该正确格式化刚刚发生的时间', () => {
    const now = Date.now()
    expect(formatTimestamp(now - 30 * 1000)).toBe('刚刚')
  })

  it('应该正确格式化分钟级时间差', () => {
    const now = Date.now()
    expect(formatTimestamp(now - 5 * 60 * 1000)).toBe('5 分钟前')
  })

  it('应该正确格式化小时级时间差', () => {
    const now = Date.now()
    expect(formatTimestamp(now - 3 * 60 * 60 * 1000)).toBe('3 小时前')
  })

  it('应该正确格式化天级时间差', () => {
    const now = Date.now()
    expect(formatTimestamp(now - 2 * 24 * 60 * 60 * 1000)).toBe('2 天前')
  })

  it('超过 7 天应该显示完整日期时间', () => {
    const ts = new Date('2025-01-01T10:30:00Z').getTime()
    const result = formatTimestamp(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })

  it('非数字时间戳应该返回空字符串', () => {
    expect(formatTimestamp(null)).toBe('')
    expect(formatTimestamp(undefined)).toBe('')
    expect(formatTimestamp('not a number')).toBe('')
  })
})
