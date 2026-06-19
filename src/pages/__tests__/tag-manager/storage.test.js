import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  loadTags,
  saveTags,
  loadTrendData,
  saveTrendData,
  createTag,
  updateTag,
  deleteTag,
} from '../../tag-manager/storage.js'
import {
  STORAGE_KEY,
  MOCK_TAGS,
  DEFAULT_COLOR,
} from '../../tag-manager/constants.js'
import { generateTagId } from '../../tag-manager/utils.js'

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

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('saveTags', () => {
    it('成功保存到 localStorage', () => {
      const tags = [{ id: 'tag_1', name: '测试' }]
      const result = saveTags(tags)
      expect(result).toBe(true)
      expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(tags))
    })

    it('localStorage 异常时返回 false', () => {
      const originalSetItem = localStorage.setItem
      localStorage.setItem = () => {
        throw new Error('storage error')
      }
      const result = saveTags([{ id: 'tag_1' }])
      expect(result).toBe(false)
      localStorage.setItem = originalSetItem
    })
  })

  describe('loadTags', () => {
    it('从 localStorage 读取数据', () => {
      const tags = [{ id: 'tag_1', name: '测试' }]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tags))
      const result = loadTags()
      expect(result).toEqual(tags)
    })

    it('localStorage 为空时返回 mock 数据', () => {
      const result = loadTags()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(MOCK_TAGS.length)
    })

    it('localStorage 数据损坏时返回 mock 数据', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json')
      const result = loadTags()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(MOCK_TAGS.length)
    })

    it('localStorage 异常时返回 mock 数据', () => {
      const originalGetItem = localStorage.getItem
      localStorage.getItem = () => {
        throw new Error('storage error')
      }
      const result = loadTags()
      expect(Array.isArray(result)).toBe(true)
      localStorage.getItem = originalGetItem
    })
  })

  describe('saveTrendData', () => {
    it('成功保存趋势数据', () => {
      const trendData = [{ date: '1/1', tag_1: 5 }]
      const result = saveTrendData(trendData)
      expect(result).toBe(true)
      expect(localStorage.getItem(STORAGE_KEY + '_trend')).toBe(JSON.stringify(trendData))
    })
  })

  describe('loadTrendData', () => {
    it('从 localStorage 读取趋势数据', () => {
      const trendData = [{ date: '1/1', tag_1: 5 }]
      localStorage.setItem(STORAGE_KEY + '_trend', JSON.stringify(trendData))
      const result = loadTrendData([])
      expect(result).toEqual(trendData)
    })

    it('localStorage 为空时生成新数据', () => {
      const tags = [{ id: 'tag_1', name: '测试' }]
      const result = loadTrendData(tags)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(7)
    })
  })
})

describe('createTag', () => {
  let existingTags

  beforeEach(() => {
    existingTags = [
      { id: 'tag_1', name: '前端', parentId: null, color: '#3b82f6', resourceCount: 10, order: 0 },
      { id: 'tag_2', name: 'React', parentId: 'tag_1', color: '#0ea5e9', resourceCount: 6, order: 0 },
    ]
  })

  it('数据无效时返回失败', () => {
    const result = createTag(existingTags, { name: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功创建根标签', () => {
    const result = createTag(existingTags, {
      name: '后端',
      parentId: null,
      color: '#22c55e',
      resourceCount: 5,
    })
    expect(result.success).toBe(true)
    expect(result.tag.id).toMatch(/^tag_/)
    expect(result.tag.name).toBe('后端')
    expect(result.tag.parentId).toBe(null)
    expect(result.tag.color).toBe('#22c55e')
    expect(result.tag.resourceCount).toBe(5)
    expect(result.tag.order).toBe(1)
    expect(result.tags.length).toBe(3)
  })

  it('成功创建子标签', () => {
    const result = createTag(existingTags, {
      name: 'Vue',
      parentId: 'tag_1',
      color: '#10b981',
    })
    expect(result.success).toBe(true)
    expect(result.tag.parentId).toBe('tag_1')
    expect(result.tag.order).toBe(1)
  })

  it('未指定颜色时使用默认颜色', () => {
    const result = createTag(existingTags, {
      name: '新标签',
      parentId: null,
    })
    expect(result.success).toBe(true)
    expect(result.tag.color).toBe(DEFAULT_COLOR)
  })

  it('未指定资源计数时生成随机值', () => {
    const result = createTag(existingTags, {
      name: '新标签',
      parentId: null,
    })
    expect(result.success).toBe(true)
    expect(result.tag.resourceCount).toBeGreaterThanOrEqual(0)
    expect(result.tag.resourceCount).toBeLessThanOrEqual(50)
  })

  it('同级名称重复时返回失败', () => {
    const result = createTag(existingTags, {
      name: 'React',
      parentId: 'tag_1',
    })
    expect(result.success).toBe(false)
    expect(result.errors.name).toBeTruthy()
  })
})

describe('updateTag', () => {
  let existingTags

  beforeEach(() => {
    existingTags = [
      { id: 'tag_1', name: '前端', parentId: null, color: '#3b82f6', resourceCount: 10, order: 0 },
      { id: 'tag_2', name: 'React', parentId: 'tag_1', color: '#0ea5e9', resourceCount: 6, order: 0 },
      { id: 'tag_3', name: 'Vue', parentId: 'tag_1', color: '#10b981', resourceCount: 4, order: 1 },
    ]
  })

  it('标签不存在时返回失败', () => {
    const result = updateTag(existingTags, 'not_exist', { name: '新名称' })
    expect(result.success).toBe(false)
    expect(result.errors.id).toBeTruthy()
  })

  it('数据无效时返回失败', () => {
    const result = updateTag(existingTags, 'tag_1', { name: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功更新标签名称', () => {
    const result = updateTag(existingTags, 'tag_1', { name: '前端开发' })
    expect(result.success).toBe(true)
    expect(result.tag.name).toBe('前端开发')
    const updatedTag = result.tags.find((t) => t.id === 'tag_1')
    expect(updatedTag.name).toBe('前端开发')
  })

  it('成功更新标签颜色', () => {
    const result = updateTag(existingTags, 'tag_1', { color: '#ef4444' })
    expect(result.success).toBe(true)
    expect(result.tag.color).toBe('#ef4444')
  })

  it('同级名称重复时返回失败', () => {
    const result = updateTag(existingTags, 'tag_2', { name: 'Vue' })
    expect(result.success).toBe(false)
    expect(result.errors.name).toBeTruthy()
  })

  it('不修改其他标签', () => {
    const result = updateTag(existingTags, 'tag_1', { name: '新名称' })
    expect(result.tags.find((t) => t.id === 'tag_2').name).toBe('React')
    expect(result.tags.find((t) => t.id === 'tag_3').name).toBe('Vue')
  })
})

describe('deleteTag', () => {
  let existingTags

  beforeEach(() => {
    existingTags = [
      { id: 'tag_1', name: '前端', parentId: null, color: '#3b82f6', resourceCount: 10, order: 0 },
      { id: 'tag_2', name: 'React', parentId: 'tag_1', color: '#0ea5e9', resourceCount: 6, order: 0 },
      { id: 'tag_3', name: 'Vue', parentId: 'tag_1', color: '#10b981', resourceCount: 4, order: 1 },
      { id: 'tag_4', name: 'Hooks', parentId: 'tag_2', color: '#6366f1', resourceCount: 3, order: 0 },
      { id: 'tag_5', name: '后端', parentId: null, color: '#22c55e', resourceCount: 8, order: 1 },
    ]
  })

  it('标签不存在时返回失败', () => {
    const result = deleteTag(existingTags, 'not_exist')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('成功删除叶子标签', () => {
    const result = deleteTag(existingTags, 'tag_3')
    expect(result.success).toBe(true)
    expect(result.deletedCount).toBe(1)
    expect(result.tags.length).toBe(4)
    expect(result.tags.some((t) => t.id === 'tag_3')).toBe(false)
  })

  it('删除父标签时同时删除所有子标签', () => {
    const result = deleteTag(existingTags, 'tag_1')
    expect(result.success).toBe(true)
    expect(result.deletedCount).toBe(4)
    expect(result.tags.length).toBe(1)
    expect(result.tags[0].id).toBe('tag_5')
    expect(result.tags.some((t) => t.id === 'tag_1')).toBe(false)
    expect(result.tags.some((t) => t.id === 'tag_2')).toBe(false)
    expect(result.tags.some((t) => t.id === 'tag_3')).toBe(false)
    expect(result.tags.some((t) => t.id === 'tag_4')).toBe(false)
  })

  it('返回被删除标签的资源数', () => {
    const result = deleteTag(existingTags, 'tag_2')
    expect(result.success).toBe(true)
    expect(result.resourceCount).toBe(6)
  })
})
