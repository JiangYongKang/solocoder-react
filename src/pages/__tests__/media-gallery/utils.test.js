import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MEDIA_TYPES,
  generateMediaId,
  getFileExtension,
  getMediaType,
  formatDate,
  formatDateTime,
  formatFileSize,
  extractDateFromItem,
  getAllTags,
  getAllTypes,
  getAllDates,
  filterMedia,
  sortMedia,
  createMediaItem,
  addMediaItem,
  deleteMediaItems,
  toggleFavorite,
  setFavoriteBatch,
  updateMediaTags,
  loadMediaData,
  saveMediaData,
  readFileAsDataUrl,
} from '@/pages/media-gallery/utils'

function createMockLocalStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
  }
}

function createMockFileReader() {
  return function MockFileReader() {
    this.result = null
    this.error = null
    this.onload = null
    this.onerror = null
    this.readAsDataURL = function (file) {
      const content = typeof file === 'object' && file !== null ? '[mock data url]' : ''
      queueMicrotask(() => {
        this.result = `data:application/octet-stream;base64,${btoa(content)}`
        this.onload?.({ target: this })
      })
    }
  }
}

const originalLocalStorage = globalThis.localStorage
const originalFileReader = globalThis.FileReader

beforeEach(() => {
  globalThis.localStorage = createMockLocalStorage()
  globalThis.FileReader = createMockFileReader()
})

afterEach(() => {
  if (originalLocalStorage) {
    globalThis.localStorage = originalLocalStorage
  } else {
    delete globalThis.localStorage
  }
  if (originalFileReader) {
    globalThis.FileReader = originalFileReader
  } else {
    delete globalThis.FileReader
  }
  vi.restoreAllMocks()
})

function makeTestItems() {
  const now = 1700000000000
  const day = 24 * 60 * 60 * 1000
  return [
    {
      id: 'm1',
      name: '风景照片.jpg',
      size: 1024 * 1024 * 2.5,
      type: MEDIA_TYPES.IMAGE,
      dataUrl: 'data:image/jpeg;base64,aaa',
      tags: ['风景', '自然', '旅行'],
      favorite: true,
      createdAt: now - day * 2,
      updatedAt: now - day * 2,
    },
    {
      id: 'm2',
      name: '人像摄影.png',
      size: 1024 * 1024 * 3.2,
      type: MEDIA_TYPES.IMAGE,
      dataUrl: 'data:image/png;base64,bbb',
      tags: ['人像', '摄影'],
      favorite: false,
      createdAt: now - day * 5,
      updatedAt: now - day * 5,
    },
    {
      id: 'm3',
      name: '产品演示视频.mp4',
      size: 1024 * 1024 * 45,
      type: MEDIA_TYPES.VIDEO,
      dataUrl: 'data:video/mp4;base64,ccc',
      tags: ['视频', '产品', '工作'],
      favorite: false,
      createdAt: now - day * 7,
      updatedAt: now - day * 7,
    },
    {
      id: 'm4',
      name: '背景音乐.mp3',
      size: 1024 * 1024 * 5.6,
      type: MEDIA_TYPES.AUDIO,
      dataUrl: 'data:audio/mp3;base64,ddd',
      tags: ['音乐', '音频'],
      favorite: true,
      createdAt: now - day * 10,
      updatedAt: now - day * 10,
    },
    {
      id: 'm5',
      name: '项目文档.pdf',
      size: 1024 * 1024 * 1.2,
      type: MEDIA_TYPES.DOCUMENT,
      dataUrl: null,
      tags: ['文档', '工作'],
      favorite: false,
      createdAt: now - day * 4,
      updatedAt: now - day * 4,
    },
    {
      id: 'm6',
      name: '未知文件.xyz',
      size: 512,
      type: MEDIA_TYPES.OTHER,
      dataUrl: null,
      tags: [],
      favorite: false,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

const STORAGE_KEY = 'media-gallery-data'

describe('generateMediaId', () => {
  it('生成非空字符串 ID', () => {
    const id = generateMediaId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(id.startsWith('media-')).toBe(true)
  })

  it('生成的 ID 不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateMediaId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('getFileExtension', () => {
  it('从文件名提取后缀并转为小写', () => {
    expect(getFileExtension('photo.JPG')).toBe('jpg')
    expect(getFileExtension('report.PDF')).toBe('pdf')
    expect(getFileExtension('archive.tar.gz')).toBe('gz')
  })

  it('无后缀文件返回空字符串', () => {
    expect(getFileExtension('noextension')).toBe('')
    expect(getFileExtension('.hidden')).toBe('')
    expect(getFileExtension('')).toBe('')
  })
})

describe('getMediaType', () => {
  it('识别图片类型', () => {
    expect(getMediaType('a.jpg')).toBe(MEDIA_TYPES.IMAGE)
    expect(getMediaType('a.jpeg')).toBe(MEDIA_TYPES.IMAGE)
    expect(getMediaType('a.png')).toBe(MEDIA_TYPES.IMAGE)
    expect(getMediaType('a.gif')).toBe(MEDIA_TYPES.IMAGE)
    expect(getMediaType('a.webp')).toBe(MEDIA_TYPES.IMAGE)
    expect(getMediaType('a.svg')).toBe(MEDIA_TYPES.IMAGE)
    expect(getMediaType('a.bmp')).toBe(MEDIA_TYPES.IMAGE)
  })

  it('识别视频类型', () => {
    expect(getMediaType('a.mp4')).toBe(MEDIA_TYPES.VIDEO)
    expect(getMediaType('a.webm')).toBe(MEDIA_TYPES.VIDEO)
    expect(getMediaType('a.mov')).toBe(MEDIA_TYPES.VIDEO)
  })

  it('识别音频类型', () => {
    expect(getMediaType('a.mp3')).toBe(MEDIA_TYPES.AUDIO)
    expect(getMediaType('a.wav')).toBe(MEDIA_TYPES.AUDIO)
    expect(getMediaType('a.ogg')).toBe(MEDIA_TYPES.AUDIO)
  })

  it('识别文档类型', () => {
    expect(getMediaType('a.pdf')).toBe(MEDIA_TYPES.DOCUMENT)
    expect(getMediaType('a.doc')).toBe(MEDIA_TYPES.DOCUMENT)
    expect(getMediaType('a.docx')).toBe(MEDIA_TYPES.DOCUMENT)
    expect(getMediaType('a.txt')).toBe(MEDIA_TYPES.DOCUMENT)
    expect(getMediaType('a.md')).toBe(MEDIA_TYPES.DOCUMENT)
  })

  it('未知类型返回 other', () => {
    expect(getMediaType('a.xyz')).toBe(MEDIA_TYPES.OTHER)
    expect(getMediaType('noextension')).toBe(MEDIA_TYPES.OTHER)
  })
})

describe('formatDate', () => {
  it('格式化时间戳为 YYYY-MM-DD', () => {
    const ts = new Date('2024-01-15T09:30:00').getTime()
    const result = formatDate(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result).toContain('2024')
    expect(result).toContain('01')
    expect(result).toContain('15')
  })

  it('支持字符串格式的数字时间戳', () => {
    const ts = String(new Date('2024-01-15T09:30:00').getTime())
    const result = formatDate(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('支持可解析的日期字符串', () => {
    const result = formatDate('2024-01-15')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('null/undefined 返回 -', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
  })

  it('NaN 返回 -', () => {
    expect(formatDate(NaN)).toBe('-')
  })

  it('无效字符串如 "invalid" 返回 -', () => {
    expect(formatDate('invalid')).toBe('-')
  })

  it('空字符串返回 -', () => {
    expect(formatDate('')).toBe('-')
  })

  it('布尔值返回 -', () => {
    expect(formatDate(true)).toBe('-')
    expect(formatDate(false)).toBe('-')
  })
})

describe('formatDateTime', () => {
  it('格式化时间戳为 YYYY-MM-DD HH:mm', () => {
    const ts = new Date('2024-01-15T09:30:00').getTime()
    const result = formatDateTime(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })

  it('支持字符串格式的数字时间戳', () => {
    const ts = String(new Date('2024-01-15T09:30:00').getTime())
    const result = formatDateTime(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })

  it('null/undefined 返回 -', () => {
    expect(formatDateTime(null)).toBe('-')
    expect(formatDateTime(undefined)).toBe('-')
  })

  it('NaN 返回 -', () => {
    expect(formatDateTime(NaN)).toBe('-')
  })

  it('无效字符串如 "invalid" 返回 -', () => {
    expect(formatDateTime('invalid')).toBe('-')
  })

  it('空字符串返回 -', () => {
    expect(formatDateTime('')).toBe('-')
  })

  it('布尔值返回 -', () => {
    expect(formatDateTime(true)).toBe('-')
    expect(formatDateTime(false)).toBe('-')
  })
})

describe('formatFileSize', () => {
  it('格式化字节', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(512)).toBe('512 B')
  })

  it('格式化 KB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('格式化 MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB')
  })

  it('格式化 GB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB')
  })

  it('无效值返回 -', () => {
    expect(formatFileSize(null)).toBe('-')
    expect(formatFileSize(undefined)).toBe('-')
    expect(formatFileSize(NaN)).toBe('-')
  })
})

describe('extractDateFromItem', () => {
  it('从 item 中提取日期字符串', () => {
    const ts = new Date('2024-01-15T09:30:00').getTime()
    const item = { createdAt: ts }
    expect(extractDateFromItem(item)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('没有 createdAt 返回 -', () => {
    expect(extractDateFromItem({})).toBe('-')
    expect(extractDateFromItem({ createdAt: null })).toBe('-')
  })
})

describe('getAllTags', () => {
  it('收集所有不重复的标签并排序', () => {
    const items = makeTestItems()
    const tags = getAllTags(items)
    expect(Array.isArray(tags)).toBe(true)
    expect(tags).toEqual([...new Set(tags)])
    expect(tags).toContain('风景')
    expect(tags).toContain('工作')
    expect(tags).toContain('旅行')
  })

  it('空数组返回空', () => {
    expect(getAllTags([])).toEqual([])
  })
})

describe('getAllTypes', () => {
  it('收集所有不重复的类型', () => {
    const items = makeTestItems()
    const types = getAllTypes(items)
    expect(types).toContain(MEDIA_TYPES.IMAGE)
    expect(types).toContain(MEDIA_TYPES.VIDEO)
    expect(types).toContain(MEDIA_TYPES.AUDIO)
    expect(types).toContain(MEDIA_TYPES.DOCUMENT)
    expect(types).toContain(MEDIA_TYPES.OTHER)
  })

  it('空数组返回空', () => {
    expect(getAllTypes([])).toEqual([])
  })
})

describe('getAllDates', () => {
  it('收集所有不重复的日期并按倒序排列', () => {
    const items = makeTestItems()
    const dates = getAllDates(items)
    expect(Array.isArray(dates)).toBe(true)
    expect(dates.length).toBeGreaterThan(0)
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1] >= dates[i]).toBe(true)
    }
  })

  it('不截断日期列表，返回所有可用日期', () => {
    const items = []
    const now = 1700000000000
    const day = 24 * 60 * 60 * 1000
    for (let i = 0; i < 15; i++) {
      items.push({
        id: `d${i}`,
        name: `test${i}.jpg`,
        size: 100,
        type: MEDIA_TYPES.IMAGE,
        dataUrl: null,
        tags: [],
        favorite: false,
        createdAt: now - i * day,
        updatedAt: now - i * day,
      })
    }
    const dates = getAllDates(items)
    expect(dates.length).toBe(15)
  })

  it('空数组返回空', () => {
    expect(getAllDates([])).toEqual([])
  })
})

describe('filterMedia', () => {
  it('无筛选条件返回全部', () => {
    const items = makeTestItems()
    const result = filterMedia(items)
    expect(result).toHaveLength(items.length)
  })

  it('按收藏筛选', () => {
    const items = makeTestItems()
    const result = filterMedia(items, { favoriteOnly: true })
    expect(result.every((i) => i.favorite)).toBe(true)
    expect(result.length).toBe(2)
  })

  it('按标签筛选（任一标签匹配即可）', () => {
    const items = makeTestItems()
    const result = filterMedia(items, { tags: ['工作'] })
    expect(result.length).toBe(2)
    expect(result.map((i) => i.id).sort()).toEqual(['m3', 'm5'].sort())
  })

  it('按多个标签筛选', () => {
    const items = makeTestItems()
    const result = filterMedia(items, { tags: ['风景', '音乐'] })
    expect(result.map((i) => i.id).sort()).toEqual(['m1', 'm4'].sort())
  })

  it('按类型筛选', () => {
    const items = makeTestItems()
    const result = filterMedia(items, { types: [MEDIA_TYPES.IMAGE] })
    expect(result.every((i) => i.type === MEDIA_TYPES.IMAGE)).toBe(true)
    expect(result.length).toBe(2)
  })

  it('按多个类型筛选', () => {
    const items = makeTestItems()
    const result = filterMedia(items, { types: [MEDIA_TYPES.VIDEO, MEDIA_TYPES.AUDIO] })
    expect(result.map((i) => i.id).sort()).toEqual(['m3', 'm4'].sort())
  })

  it('按日期筛选', () => {
    const items = makeTestItems()
    const dates = getAllDates(items)
    const result = filterMedia(items, { dates: [dates[0]] })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((i) => extractDateFromItem(i) === dates[0])).toBe(true)
  })

  it('按搜索词筛选（匹配文件名）', () => {
    const items = makeTestItems()
    const result = filterMedia(items, { searchTerm: '视频' })
    expect(result.map((i) => i.id)).toEqual(['m3'])
  })

  it('按搜索词筛选（匹配标签）', () => {
    const items = makeTestItems()
    const result = filterMedia(items, { searchTerm: '旅行' })
    expect(result.map((i) => i.id)).toEqual(['m1'])
  })

  it('搜索词不区分大小写', () => {
    const items = makeTestItems()
    const r1 = filterMedia(items, { searchTerm: 'PHOTO' })
    const r2 = filterMedia(items, { searchTerm: 'photo' })
    expect(r1.length).toBe(r2.length)
  })

  it('组合筛选条件（AND 关系）', () => {
    const items = makeTestItems()
    const result = filterMedia(items, { types: [MEDIA_TYPES.IMAGE], favoriteOnly: true })
    expect(result.every((i) => i.type === MEDIA_TYPES.IMAGE && i.favorite)).toBe(true)
    expect(result.map((i) => i.id)).toEqual(['m1'])
  })

  it('不修改原始数据', () => {
    const items = makeTestItems()
    const originalIds = items.map((i) => i.id)
    filterMedia(items, { favoriteOnly: true })
    expect(items.map((i) => i.id)).toEqual(originalIds)
  })
})

describe('sortMedia', () => {
  it('按日期降序（默认）', () => {
    const items = makeTestItems()
    const sorted = sortMedia(items)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].createdAt >= sorted[i].createdAt).toBe(true)
    }
  })

  it('按日期升序', () => {
    const items = makeTestItems()
    const sorted = sortMedia(items, 'date', 'asc')
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].createdAt <= sorted[i].createdAt).toBe(true)
    }
  })

  it('按名称升序', () => {
    const items = makeTestItems()
    const sorted = sortMedia(items, 'name', 'asc')
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].name <= sorted[i].name).toBe(true)
    }
  })

  it('按名称降序', () => {
    const items = makeTestItems()
    const sorted = sortMedia(items, 'name', 'desc')
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].name >= sorted[i].name).toBe(true)
    }
  })

  it('按大小升序', () => {
    const items = makeTestItems()
    const sorted = sortMedia(items, 'size', 'asc')
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].size <= sorted[i].size).toBe(true)
    }
  })

  it('按大小降序', () => {
    const items = makeTestItems()
    const sorted = sortMedia(items, 'size', 'desc')
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].size >= sorted[i].size).toBe(true)
    }
  })

  it('不修改原始数组', () => {
    const items = makeTestItems()
    const originalOrder = items.map((i) => i.id)
    sortMedia(items, 'name', 'asc')
    expect(items.map((i) => i.id)).toEqual(originalOrder)
  })
})

describe('createMediaItem', () => {
  it('创建新的媒体项并自动推断类型', () => {
    const item = createMediaItem({
      name: 'test.png',
      size: 1024,
      dataUrl: 'data:image/png;base64,xxx',
      tags: ['测试'],
    })
    expect(item.id).toBeTruthy()
    expect(item.name).toBe('test.png')
    expect(item.size).toBe(1024)
    expect(item.type).toBe(MEDIA_TYPES.IMAGE)
    expect(item.tags).toEqual(['测试'])
    expect(item.favorite).toBe(false)
    expect(typeof item.createdAt).toBe('number')
    expect(typeof item.updatedAt).toBe('number')
  })

  it('没有 dataUrl 时默认为 null', () => {
    const item = createMediaItem({ name: 'a.txt', size: 100 })
    expect(item.dataUrl).toBe(null)
  })

  it('没有 tags 时默认为空数组', () => {
    const item = createMediaItem({ name: 'a.jpg', size: 100 })
    expect(item.tags).toEqual([])
  })

  it('可显式指定 type 覆盖自动推断', () => {
    const item = createMediaItem({
      name: 'test.xyz',
      size: 100,
      type: MEDIA_TYPES.IMAGE,
    })
    expect(item.type).toBe(MEDIA_TYPES.IMAGE)
  })
})

describe('addMediaItem', () => {
  it('添加新项到列表末尾', () => {
    const items = makeTestItems()
    const newItem = createMediaItem({ name: 'new.jpg', size: 100 })
    const result = addMediaItem(items, newItem)
    expect(result.length).toBe(items.length + 1)
    expect(result[result.length - 1].id).toBe(newItem.id)
  })

  it('不修改原始数组', () => {
    const items = makeTestItems()
    const newItem = createMediaItem({ name: 'new.jpg', size: 100 })
    const originalLength = items.length
    addMediaItem(items, newItem)
    expect(items.length).toBe(originalLength)
  })
})

describe('deleteMediaItems', () => {
  it('删除指定 ID 的项', () => {
    const items = makeTestItems()
    const result = deleteMediaItems(items, ['m1', 'm3'])
    expect(result.find((i) => i.id === 'm1')).toBeUndefined()
    expect(result.find((i) => i.id === 'm3')).toBeUndefined()
    expect(result.length).toBe(items.length - 2)
  })

  it('空 ID 列表不删除任何项', () => {
    const items = makeTestItems()
    const result = deleteMediaItems(items, [])
    expect(result.length).toBe(items.length)
  })

  it('不修改原始数组', () => {
    const items = makeTestItems()
    deleteMediaItems(items, ['m1'])
    expect(items.length).toBe(6)
    expect(items.find((i) => i.id === 'm1')).toBeDefined()
  })
})

describe('toggleFavorite', () => {
  it('将收藏项切换为不收藏', () => {
    const items = makeTestItems()
    const result = toggleFavorite(items, 'm1')
    expect(result.find((i) => i.id === 'm1').favorite).toBe(false)
  })

  it('将未收藏项切换为收藏', () => {
    const items = makeTestItems()
    const result = toggleFavorite(items, 'm2')
    expect(result.find((i) => i.id === 'm2').favorite).toBe(true)
  })

  it('更新 updatedAt 时间戳', () => {
    const items = makeTestItems()
    const originalUpdatedAt = items.find((i) => i.id === 'm1').updatedAt
    const result = toggleFavorite(items, 'm1')
    expect(result.find((i) => i.id === 'm1').updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
  })

  it('不修改其他项', () => {
    const items = makeTestItems()
    const result = toggleFavorite(items, 'm1')
    expect(result.find((i) => i.id === 'm2').favorite).toBe(false)
  })

  it('不修改原始数组', () => {
    const items = makeTestItems()
    toggleFavorite(items, 'm1')
    expect(items.find((i) => i.id === 'm1').favorite).toBe(true)
  })
})

describe('setFavoriteBatch', () => {
  it('批量设置为收藏', () => {
    const items = makeTestItems()
    const result = setFavoriteBatch(items, ['m2', 'm3'], true)
    expect(result.find((i) => i.id === 'm2').favorite).toBe(true)
    expect(result.find((i) => i.id === 'm3').favorite).toBe(true)
  })

  it('批量取消收藏', () => {
    const items = makeTestItems()
    const result = setFavoriteBatch(items, ['m1', 'm4'], false)
    expect(result.find((i) => i.id === 'm1').favorite).toBe(false)
    expect(result.find((i) => i.id === 'm4').favorite).toBe(false)
  })

  it('不影响未选中的项', () => {
    const items = makeTestItems()
    const result = setFavoriteBatch(items, ['m2'], true)
    expect(result.find((i) => i.id === 'm1').favorite).toBe(true)
    expect(result.find((i) => i.id === 'm3').favorite).toBe(false)
  })

  it('空 ID 列表不改变任何项', () => {
    const items = makeTestItems()
    const result = setFavoriteBatch(items, [], true)
    expect(result.map((i) => i.favorite)).toEqual(items.map((i) => i.favorite))
  })
})

describe('updateMediaTags', () => {
  it('更新指定项的标签', () => {
    const items = makeTestItems()
    const result = updateMediaTags(items, 'm1', ['新标签', '测试'])
    expect(result.find((i) => i.id === 'm1').tags).toEqual(['新标签', '测试'])
  })

  it('更新 updatedAt', () => {
    const items = makeTestItems()
    const originalUpdatedAt = items.find((i) => i.id === 'm1').updatedAt
    const result = updateMediaTags(items, 'm1', [])
    expect(result.find((i) => i.id === 'm1').updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
  })

  it('不修改其他项', () => {
    const items = makeTestItems()
    const result = updateMediaTags(items, 'm1', ['修改'])
    expect(result.find((i) => i.id === 'm2').tags).toEqual(['人像', '摄影'])
  })

  it('不修改原始数组', () => {
    const items = makeTestItems()
    updateMediaTags(items, 'm1', ['修改'])
    expect(items.find((i) => i.id === 'm1').tags).toEqual(['风景', '自然', '旅行'])
  })
})

describe('saveMediaData', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('将数组序列化为 JSON 存入 localStorage', () => {
    const items = [{ id: 'a', name: 'test.jpg' }]
    saveMediaData(items)
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw)
    expect(parsed).toEqual(items)
  })

  it('保存空数组', () => {
    saveMediaData([])
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(JSON.parse(raw)).toEqual([])
  })

  it('localStorage.setItem 抛出异常时不报错', () => {
    const originalSetItem = localStorage.setItem
    localStorage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    expect(() => saveMediaData([{ id: 'a' }])).not.toThrow()
    localStorage.setItem = originalSetItem
  })
})

describe('loadMediaData', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('localStorage 为空时返回初始化数据并自动保存', () => {
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    const result = loadMediaData()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    const saved = localStorage.getItem(STORAGE_KEY)
    expect(saved).toBeTruthy()
    expect(JSON.parse(saved)).toEqual(result)
  })

  it('localStorage 有合法数组时直接返回', () => {
    const mockItems = [
      { id: 'custom-1', name: 'custom.jpg', type: 'image' },
      { id: 'custom-2', name: 'custom.png', type: 'image' },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockItems))
    const result = loadMediaData()
    expect(result).toEqual(mockItems)
  })

  it('localStorage 有非数组值时回退到初始化数据', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'an array' }))
    const result = loadMediaData()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('localStorage 存储的 JSON 非法时回退到初始化数据', () => {
    localStorage.setItem(STORAGE_KEY, 'this is not valid json {{{')
    const result = loadMediaData()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('localStorage.getItem 抛出异常时回退到初始化数据', () => {
    const originalGetItem = localStorage.getItem
    localStorage.getItem = () => {
      throw new Error('SecurityError')
    }
    const result = loadMediaData()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    localStorage.getItem = originalGetItem
  })
})

describe('readFileAsDataUrl', () => {
  function makeMockFile(name, content) {
    return {
      name,
      size: content.length,
      type: 'application/octet-stream',
      _content: content,
    }
  }

  it('返回一个 Promise', () => {
    const file = makeMockFile('test.txt', 'hello')
    const result = readFileAsDataUrl(file)
    expect(result).toBeInstanceOf(Promise)
  })

  it('读取成功时 resolve 为 data URL 字符串', async () => {
    const file = makeMockFile('test.txt', 'hello world')
    const result = await readFileAsDataUrl(file)
    expect(typeof result).toBe('string')
    expect(result.startsWith('data:')).toBe(true)
  })

  it('读取失败时 reject 错误', async () => {
    const originalFileReader = globalThis.FileReader
    globalThis.FileReader = function () {
      this.result = null
      this.error = new Error('Simulated read error')
      this.onload = null
      this.onerror = null
      this.readAsDataURL = function () {
        queueMicrotask(() => {
          this.onerror?.({ target: this })
        })
      }
    }
    const file = makeMockFile('test.txt', 'hello')
    await expect(readFileAsDataUrl(file)).rejects.toBeDefined()
    globalThis.FileReader = originalFileReader
  })
})
