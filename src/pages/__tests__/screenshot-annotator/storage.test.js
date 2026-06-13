import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  listSavedAnnotations,
  saveAnnotations,
  loadAnnotation,
  deleteSavedAnnotation,
  renameSavedAnnotation,
  clearAllSavedAnnotations,
} from '../../screenshot-annotator/storage.js'
import {
  STORAGE_KEY,
  IMAGE_STORAGE_KEY_PREFIX,
} from '../../screenshot-annotator/constants.js'

const createMockStorage = () => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
}

let mockLocalStorage

beforeEach(() => {
  mockLocalStorage = createMockStorage()
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  delete globalThis.localStorage
})

describe('listSavedAnnotations', () => {
  it('localStorage无数据时应返回空数组', () => {
    expect(listSavedAnnotations()).toEqual([])
  })

  it('应正确加载保存的列表', () => {
    const list = [{ id: '1', name: 'test' }]
    mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    expect(listSavedAnnotations()).toEqual(list)
  })

  it('损坏的JSON应返回空数组', () => {
    mockLocalStorage.setItem(STORAGE_KEY, 'invalid json')
    expect(listSavedAnnotations()).toEqual([])
  })

  it('非数组数据应返回空数组', () => {
    mockLocalStorage.setItem(STORAGE_KEY, '{"not":"array"}')
    expect(listSavedAnnotations()).toEqual([])
  })
})

describe('saveAnnotations', () => {
  it('应保存标注到localStorage', () => {
    const result = saveAnnotations('测试标注', [], null)
    expect(result).not.toBeNull()
    expect(result.name).toBe('测试标注')
    expect(result.annotationsCount).toBe(0)

    const list = listSavedAnnotations()
    expect(list.length).toBe(1)
    expect(list[0].id).toBe(result.id)
  })

  it('空名称应使用默认标注名', () => {
    const result = saveAnnotations('', [], null)
    expect(result).not.toBeNull()
    expect(result.name).toMatch(/^标注_/)
  })

  it('应正确记录标注数量', () => {
    const anns = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = saveAnnotations('test', anns, null)
    expect(result.annotationsCount).toBe(3)
  })

  it('小图片数据应内联存储', () => {
    const smallDataUrl = 'data:image/png;base64,abc'
    const result = saveAnnotations('test', [], smallDataUrl)
    expect(result.imageData).toBe(smallDataUrl)
    expect(result.imageHasExternalStorage).toBe(false)
    expect(result.imageStorageId).toBeNull()
  })

  it('大图片数据应使用外部存储', () => {
    const largeDataUrl = 'data:image/png;base64,' + 'x'.repeat(3 * 1024 * 1024)
    const result = saveAnnotations('test', [], largeDataUrl)
    expect(result.imageHasExternalStorage).toBe(true)
    expect(result.imageStorageId).toBeTruthy()

    const stored = mockLocalStorage.getItem(result.imageStorageId)
    expect(stored).toBe(largeDataUrl)
  })

  it('应深拷贝标注数据', () => {
    const anns = [{ id: 'a', type: 'brush', points: [{ x: 0, y: 0 }] }]
    const result = saveAnnotations('test', anns, null)
    anns[0].points[0].x = 999
    const list = listSavedAnnotations()
    expect(list[0].annotations[0].points[0].x).toBe(0)
  })

  it('保存失败时应返回null', () => {
    mockLocalStorage.setItem = () => { throw new Error('quota exceeded') }
    const result = saveAnnotations('test', [], null)
    expect(result).toBeNull()
  })
})

describe('loadAnnotation', () => {
  it('应加载已保存的标注', () => {
    const saved = saveAnnotations('test', [{ id: 'a' }], null)
    const loaded = loadAnnotation(saved.id)
    expect(loaded).not.toBeNull()
    expect(loaded.name).toBe('test')
    expect(loaded.annotations).toEqual([{ id: 'a' }])
  })

  it('应加载内联图片数据', () => {
    const smallDataUrl = 'data:image/png;base64,abc'
    const saved = saveAnnotations('test', [], smallDataUrl)
    const loaded = loadAnnotation(saved.id)
    expect(loaded.imageDataUrl).toBe(smallDataUrl)
  })

  it('应加载外部存储图片数据', () => {
    const largeDataUrl = 'data:image/png;base64,' + 'x'.repeat(3 * 1024 * 1024)
    const saved = saveAnnotations('test', [], largeDataUrl)
    const loaded = loadAnnotation(saved.id)
    expect(loaded.imageDataUrl).toBe(largeDataUrl)
  })

  it('不存在的ID应返回null', () => {
    expect(loadAnnotation('nonexistent')).toBeNull()
  })
})

describe('deleteSavedAnnotation', () => {
  it('应删除指定标注', () => {
    const saved = saveAnnotations('test', [], null)
    const result = deleteSavedAnnotation(saved.id)
    expect(result).toBe(true)
    expect(listSavedAnnotations().length).toBe(0)
  })

  it('应同时删除外部存储的图片', () => {
    const largeDataUrl = 'data:image/png;base64,' + 'x'.repeat(3 * 1024 * 1024)
    const saved = saveAnnotations('test', [], largeDataUrl)
    const storageId = saved.imageStorageId
    expect(mockLocalStorage.getItem(storageId)).not.toBeNull()

    deleteSavedAnnotation(saved.id)
    expect(mockLocalStorage.getItem(storageId)).toBeNull()
  })

  it('删除不存在的ID应返回false', () => {
    expect(deleteSavedAnnotation('nonexistent')).toBe(false)
  })
})

describe('renameSavedAnnotation', () => {
  it('应重命名标注', () => {
    const saved = saveAnnotations('旧名称', [], null)
    const result = renameSavedAnnotation(saved.id, '新名称')
    expect(result).not.toBeNull()
    expect(result.name).toBe('新名称')

    const loaded = loadAnnotation(saved.id)
    expect(loaded.name).toBe('新名称')
  })

  it('重命名不存在的ID应返回null', () => {
    const result = renameSavedAnnotation('nonexistent', 'new')
    expect(result).toBeNull()
  })

  it('应更新updatedAt时间', () => {
    const saved = saveAnnotations('test', [], null)
    const beforeTime = saved.updatedAt
    const result = renameSavedAnnotation(saved.id, 'new')
    expect(result.updatedAt).toBeGreaterThanOrEqual(beforeTime)
  })
})

describe('clearAllSavedAnnotations', () => {
  it('应清除所有保存的标注', () => {
    saveAnnotations('test1', [], null)
    saveAnnotations('test2', [], null)
    expect(listSavedAnnotations().length).toBe(2)

    clearAllSavedAnnotations()
    expect(listSavedAnnotations().length).toBe(0)
  })

  it('应同时清除外部存储的图片', () => {
    const largeDataUrl = 'data:image/png;base64,' + 'x'.repeat(3 * 1024 * 1024)
    const saved = saveAnnotations('test', [], largeDataUrl)
    const storageId = saved.imageStorageId
    expect(mockLocalStorage.getItem(storageId)).not.toBeNull()

    clearAllSavedAnnotations()
    expect(mockLocalStorage.getItem(storageId)).toBeNull()
    expect(mockLocalStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('saveAnnotations - 同一张图片多个标注版本', () => {
  it('同一图片可以有多个标注版本', () => {
    const imageDataUrl = 'data:image/png;base64,abc'
    const save1 = saveAnnotations('版本1', [{ id: 'a' }], imageDataUrl)
    const save2 = saveAnnotations('版本2', [{ id: 'b' }, { id: 'c' }], imageDataUrl)

    expect(save1).not.toBeNull()
    expect(save2).not.toBeNull()
    expect(save1.id).not.toBe(save2.id)

    const list = listSavedAnnotations()
    expect(list.length).toBe(2)
  })
})
