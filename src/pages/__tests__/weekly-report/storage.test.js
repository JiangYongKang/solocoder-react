import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  safeGetItem,
  safeSetItem,
  loadReports,
  saveReports,
  loadCurrentDraft,
  saveCurrentDraft,
  clearCurrentDraft,
  loadSelectedTemplate,
  saveSelectedTemplate
} from '../../weekly-report/storage.js'
import { STORAGE_KEY_WEEKLY_REPORTS } from '../../weekly-report/constants.js'

describe('storage 模块', () => {
  let store = {}

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
      })
    })
  })

  describe('safeGetItem / safeSetItem', () => {
    it('应该正确写入和读取 JSON 对象', () => {
      const data = { a: 1, b: [2, 3] }
      expect(safeSetItem('test-key', data)).toBe(true)
      expect(safeGetItem('test-key', null)).toEqual(data)
    })

    it('应该正确写入和读取数组', () => {
      const arr = [1, 2, 3]
      safeSetItem('arr', arr)
      expect(safeGetItem('arr', [])).toEqual(arr)
    })

    it('应该正确写入和读取字符串', () => {
      safeSetItem('str', 'hello')
      expect(safeGetItem('str', '')).toBe('hello')
    })

    it('key 不存在时应返回 fallback', () => {
      expect(safeGetItem('not-exist', 'fallback')).toBe('fallback')
    })

    it('值不是合法 JSON 时应返回 fallback', () => {
      localStorage.setItem('bad', '{not valid json')
      expect(safeGetItem('bad', 'fb')).toBe('fb')
    })

    it('safeSetItem 失败时返回 false', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(() => {
          throw new Error('quota exceeded')
        }),
        removeItem: vi.fn(),
        clear: vi.fn()
      })
      expect(safeSetItem('k', 'v')).toBe(false)
    })

    it('safeGetItem 读取异常时返回 fallback', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => {
          throw new Error('read error')
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      })
      expect(safeGetItem('k', 'fb')).toBe('fb')
    })
  })

  describe('loadReports / saveReports', () => {
    it('初始状态应返回空数组', () => {
      expect(loadReports()).toEqual([])
    })

    it('saveReports 之后能通过 loadReports 读取', () => {
      const data = [
        { id: 'r1', weekKey: '2024-W01', updatedAt: 2000 },
        { id: 'r2', weekKey: '2024-W02', updatedAt: 3000 }
      ]
      expect(saveReports(data)).toBe(true)
      const loaded = loadReports()
      expect(loaded).toHaveLength(2)
    })

    it('loadReports 应该按时间倒序排列', () => {
      const data = [
        { id: 'r1', weekKey: '2024-W01', updatedAt: 1000 },
        { id: 'r2', weekKey: '2024-W02', updatedAt: 3000 },
        { id: 'r3', weekKey: '2024-W03', updatedAt: 2000 }
      ]
      saveReports(data)
      const loaded = loadReports()
      expect(loaded[0].id).toBe('r2')
      expect(loaded[1].id).toBe('r3')
      expect(loaded[2].id).toBe('r1')
    })

    it('localStorage 存储的数据不是数组时应返回空数组', () => {
      localStorage.setItem(STORAGE_KEY_WEEKLY_REPORTS, JSON.stringify({ not: 'array' }))
      expect(loadReports()).toEqual([])
    })
  })

  describe('loadCurrentDraft / saveCurrentDraft / clearCurrentDraft', () => {
    it('初始状态应返回 null', () => {
      expect(loadCurrentDraft()).toBe(null)
    })

    it('保存后能读取草稿内容', () => {
      const draft = { summary: 'test', plan: '', problems: '' }
      saveCurrentDraft(draft)
      expect(loadCurrentDraft()).toEqual(draft)
    })

    it('clearCurrentDraft 应该清除草稿', () => {
      saveCurrentDraft({ summary: 'test' })
      clearCurrentDraft()
      expect(loadCurrentDraft()).toBe(null)
    })

    it('clearCurrentDraft 成功时返回 true', () => {
      expect(clearCurrentDraft()).toBe(true)
    })
  })

  describe('loadSelectedTemplate / saveSelectedTemplate', () => {
    it('默认应该返回 concise 模板', () => {
      expect(loadSelectedTemplate()).toBe('concise')
    })

    it('保存后能读取选中的模板', () => {
      saveSelectedTemplate('detailed')
      expect(loadSelectedTemplate()).toBe('detailed')
    })

    it('保存项目进度模板应该生效', () => {
      saveSelectedTemplate('project')
      expect(loadSelectedTemplate()).toBe('project')
    })
  })
})
