import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_PAGE_WIDTH,
  DEFAULT_PAGE_HEIGHT,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_MARGIN,
  LINES_PER_PAGE,
} from '../../pdf-reader/constants'
import {
  clampZoom,
  validatePageNumber,
  saveCurrentPage,
  loadCurrentPage,
  saveZoom,
  loadZoom,
  generateBookmarkId,
  createBookmark,
  saveBookmarks,
  loadBookmarks,
  addBookmark,
  removeBookmark,
  findBookmarkByPage,
  isChapterTitle,
  extractTableOfContents,
  splitTextToLines,
  paginatePlainText,
  searchTextInPages,
  getSearchMatchesOnPage,
  getTotalSearchCount,
  findNextMatch,
  findPrevMatch,
  calculateFitWidthZoom,
  calculateFitPageZoom,
  saveCustomDocument,
  loadCustomDocument,
  clearCustomDocument,
  measureTextLines,
  getLineYPosition,
  calculateRenderPageSize,
} from '../../pdf-reader/pdfReaderUtils'

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

beforeEach(() => {
  globalThis.localStorage.clear()
})

describe('clampZoom', () => {
  it('正常范围内的缩放值原样返回', () => {
    expect(clampZoom(100)).toBe(100)
    expect(clampZoom(50)).toBe(50)
    expect(clampZoom(200)).toBe(200)
    expect(clampZoom(150)).toBe(150)
  })

  it('低于最小值被夹到最小值', () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM)
    expect(clampZoom(-50)).toBe(MIN_ZOOM)
    expect(clampZoom(10)).toBe(MIN_ZOOM)
  })

  it('高于最大值被夹到最大值', () => {
    expect(clampZoom(300)).toBe(MAX_ZOOM)
    expect(clampZoom(1000)).toBe(MAX_ZOOM)
  })

  it('非数字值返回默认值', () => {
    expect(clampZoom('abc')).toBe(DEFAULT_ZOOM)
    expect(clampZoom(null)).toBe(DEFAULT_ZOOM)
    expect(clampZoom(undefined)).toBe(DEFAULT_ZOOM)
    expect(clampZoom(NaN)).toBe(DEFAULT_ZOOM)
  })

  it('字符串数字正常转换', () => {
    expect(clampZoom('150')).toBe(150)
    expect(clampZoom('75')).toBe(75)
  })
})

describe('validatePageNumber', () => {
  it('有效页码正常返回', () => {
    expect(validatePageNumber(1, 10)).toBe(1)
    expect(validatePageNumber(5, 10)).toBe(5)
    expect(validatePageNumber(10, 10)).toBe(10)
  })

  it('非整数返回 null', () => {
    expect(validatePageNumber(1.5, 10)).toBeNull()
    expect(validatePageNumber('abc', 10)).toBeNull()
    expect(validatePageNumber(null, 10)).toBeNull()
    expect(validatePageNumber(undefined, 10)).toBeNull()
  })

  it('超出范围返回 null', () => {
    expect(validatePageNumber(0, 10)).toBeNull()
    expect(validatePageNumber(-1, 10)).toBeNull()
    expect(validatePageNumber(11, 10)).toBeNull()
    expect(validatePageNumber(100, 10)).toBeNull()
  })

  it('字符串数字正常转换', () => {
    expect(validatePageNumber('3', 10)).toBe(3)
  })
})

describe('localStorage 相关函数', () => {
  it('saveCurrentPage 和 loadCurrentPage 正常工作', () => {
    expect(saveCurrentPage(5)).toBe(true)
    expect(loadCurrentPage()).toBe(5)
  })

  it('loadCurrentPage 默认返回 1', () => {
    expect(loadCurrentPage()).toBe(1)
  })

  it('saveCurrentPage 对无效参数返回 false', () => {
    expect(saveCurrentPage(0)).toBe(false)
    expect(saveCurrentPage(-1)).toBe(false)
    expect(saveCurrentPage('abc')).toBe(false)
  })

  it('saveZoom 和 loadZoom 正常工作', () => {
    expect(saveZoom(150)).toBe(true)
    expect(loadZoom()).toBe(150)
  })

  it('saveZoom 会自动 clamp', () => {
    saveZoom(999)
    expect(loadZoom()).toBe(MAX_ZOOM)
  })

  it('loadZoom 默认返回 DEFAULT_ZOOM', () => {
    expect(loadZoom()).toBe(DEFAULT_ZOOM)
  })

  it('saveCustomDocument / loadCustomDocument / clearCustomDocument', () => {
    const text = 'Hello World\n测试文本'
    expect(saveCustomDocument(text)).toBe(true)
    expect(loadCustomDocument()).toBe(text)
    expect(clearCustomDocument()).toBe(true)
    expect(loadCustomDocument()).toBe('')
  })

  it('saveCustomDocument 非字符串返回 false', () => {
    expect(saveCustomDocument(null)).toBe(false)
    expect(saveCustomDocument(123)).toBe(false)
  })
})

describe('书签相关函数', () => {
  it('generateBookmarkId 生成唯一 ID', () => {
    const id1 = generateBookmarkId()
    const id2 = generateBookmarkId()
    expect(typeof id1).toBe('string')
    expect(id1.startsWith('bm_')).toBe(true)
    expect(id1).not.toBe(id2)
  })

  it('createBookmark 创建书签', () => {
    const bm = createBookmark(5, '测试标题')
    expect(bm.page).toBe(5)
    expect(bm.title).toBe('测试标题')
    expect(typeof bm.id).toBe('string')
    expect(typeof bm.createdAt).toBe('number')
  })

  it('createBookmark 自动生成默认标题', () => {
    const bm = createBookmark(3, '')
    expect(bm.title).toBe('第3页')
  })

  it('addBookmark 添加书签', () => {
    const bm1 = createBookmark(1, '第一页')
    const bm2 = createBookmark(2, '第二页')
    let list = addBookmark([], bm1)
    expect(list.length).toBe(1)
    list = addBookmark(list, bm2)
    expect(list.length).toBe(2)
  })

  it('addBookmark 空输入安全处理', () => {
    const bm = createBookmark(1, '第一页')
    expect(addBookmark(null, bm).length).toBe(1)
    expect(addBookmark([], null).length).toBe(0)
  })

  it('removeBookmark 删除书签', () => {
    const bm1 = createBookmark(1, '第一页')
    const bm2 = createBookmark(2, '第二页')
    const list = [bm1, bm2]
    const result = removeBookmark(list, bm1.id)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe(bm2.id)
  })

  it('findBookmarkByPage 按页码查找', () => {
    const bm1 = createBookmark(1, '第一页')
    const bm2 = createBookmark(5, '第五页')
    const list = [bm1, bm2]
    expect(findBookmarkByPage(list, 5)?.id).toBe(bm2.id)
    expect(findBookmarkByPage(list, 3)).toBeNull()
  })

  it('saveBookmarks 和 loadBookmarks', () => {
    const bm1 = createBookmark(1, '第一页')
    const bm2 = createBookmark(2, '第二页')
    expect(saveBookmarks([bm1, bm2])).toBe(true)
    const loaded = loadBookmarks()
    expect(loaded.length).toBe(2)
    expect(loaded[0].page).toBe(1)
    expect(loaded[1].page).toBe(2)
  })
})

describe('章节标题识别', () => {
  it('isChapterTitle 识别中文章节', () => {
    expect(isChapterTitle('第一章 探索')).toBe(true)
    expect(isChapterTitle('第五章 测试标题')).toBe(true)
    expect(isChapterTitle('第十二章 结尾')).toBe(true)
    expect(isChapterTitle('第123章 数字章节')).toBe(true)
  })

  it('isChapterTitle 识别英文章节', () => {
    expect(isChapterTitle('Chapter 1')).toBe(true)
    expect(isChapterTitle('Chapter 12 Introduction')).toBe(true)
    expect(isChapterTitle('chapter 5')).toBe(true)
  })

  it('isChapterTitle 非章节标题返回 false', () => {
    expect(isChapterTitle('普通的段落文本')).toBe(false)
    expect(isChapterTitle('第一节 小节')).toBe(false)
    expect(isChapterTitle('')).toBe(false)
    expect(isChapterTitle(null)).toBe(false)
    expect(isChapterTitle(undefined)).toBe(false)
  })

  it('extractTableOfContents 提取目录', () => {
    const pages = [
      { content: '第一章 开始\n\n这是第一页的内容' },
      { content: '普通内容页' },
      { content: '第二章 中间\n\n更多内容' },
      { content: 'Chapter 3 End\n\n结束' },
    ]
    const toc = extractTableOfContents(pages)
    expect(toc.length).toBe(3)
    expect(toc[0].title).toBe('第一章 开始')
    expect(toc[0].page).toBe(1)
    expect(toc[1].title).toBe('第二章 中间')
    expect(toc[1].page).toBe(3)
    expect(toc[2].title).toBe('Chapter 3 End')
    expect(toc[2].page).toBe(4)
  })

  it('extractTableOfContents 空输入安全', () => {
    expect(extractTableOfContents(null)).toEqual([])
    expect(extractTableOfContents([])).toEqual([])
  })
})

describe('文本分页和换行', () => {
  it('splitTextToLines 按宽度换行', () => {
    const lines = splitTextToLines('Hello World', 50, 16)
    expect(lines.length).toBeGreaterThanOrEqual(1)
    expect(typeof lines[0]).toBe('string')
  })

  it('splitTextToLines 处理空段落', () => {
    const lines = splitTextToLines('第一段\n\n第二段', 500, 16)
    expect(lines).toContain('')
  })

  it('splitTextToLines 处理空文本', () => {
    expect(splitTextToLines('', 500, 16)).toEqual([])
    expect(splitTextToLines(null, 500, 16)).toEqual([])
  })

  it('splitTextToLines 中文按字符宽度换行', () => {
    const longText = '一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十'
    const lines = splitTextToLines(longText, 160, 16)
    expect(lines.length).toBeGreaterThan(1)
  })

  it('paginatePlainText 按行数分页', () => {
    const lines = Array.from({ length: 65 }, (_, i) => `Line ${i + 1}`)
    const text = lines.join('\n')
    const pages = paginatePlainText(text, LINES_PER_PAGE)
    const expectedPages = Math.ceil(65 / LINES_PER_PAGE)
    expect(pages.length).toBe(expectedPages)
    expect(pages[0].isChapterStart).toBe(false)
  })

  it('paginatePlainText 识别章节起始页', () => {
    const text = '第一章 测试\n一些内容\n更多内容'
    const pages = paginatePlainText(text, 10)
    expect(pages[0].isChapterStart).toBe(true)
  })

  it('paginatePlainText 空文本至少返回一页', () => {
    const pages = paginatePlainText('')
    expect(pages.length).toBe(1)
    expect(pages[0].content).toBe('')
  })

  it('measureTextLines 计算绘制行', () => {
    const lines = measureTextLines('测试文本', DEFAULT_PAGE_WIDTH, DEFAULT_FONT_SIZE, DEFAULT_MARGIN)
    expect(Array.isArray(lines)).toBe(true)
  })

  it('getLineYPosition 计算行 Y 坐标', () => {
    const y = getLineYPosition(0, DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT, DEFAULT_MARGIN)
    expect(typeof y).toBe('number')
    expect(y).toBe(DEFAULT_MARGIN + DEFAULT_FONT_SIZE)
    const y2 = getLineYPosition(3, DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT, DEFAULT_MARGIN)
    expect(y2).toBe(DEFAULT_MARGIN + DEFAULT_FONT_SIZE + 3 * DEFAULT_LINE_HEIGHT)
  })
})

describe('搜索功能', () => {
  const testPages = [
    { content: '苹果香蕉橘子苹果' },
    { content: '葡萄西瓜苹果' },
    { content: '樱桃芒果' },
  ]

  it('searchTextInPages 搜索所有匹配', () => {
    const results = searchTextInPages(testPages, '苹果')
    expect(results.length).toBe(3)
    expect(results[0].page).toBe(1)
    expect(results[1].page).toBe(1)
    expect(results[2].page).toBe(2)
  })

  it('searchTextInPages 搜索不区分大小写', () => {
    const pages = [{ content: 'Hello World HELLO world' }]
    const results = searchTextInPages(pages, 'hello')
    expect(results.length).toBe(2)
  })

  it('searchTextInPages 空关键词返回空', () => {
    expect(searchTextInPages(testPages, '')).toEqual([])
    expect(searchTextInPages(testPages, '   ')).toEqual([])
    expect(searchTextInPages(testPages, null)).toEqual([])
  })

  it('searchTextInPages 无匹配返回空', () => {
    expect(searchTextInPages(testPages, '菠萝')).toEqual([])
  })

  it('getSearchMatchesOnPage 过滤指定页', () => {
    const matches = getSearchMatchesOnPage(testPages, '苹果', 1)
    expect(matches.length).toBe(2)
    const matches2 = getSearchMatchesOnPage(testPages, '苹果', 3)
    expect(matches2.length).toBe(0)
  })

  it('getTotalSearchCount 统计总数', () => {
    const results = searchTextInPages(testPages, '苹果')
    expect(getTotalSearchCount(results)).toBe(3)
    expect(getTotalSearchCount(null)).toBe(0)
    expect(getTotalSearchCount([])).toBe(0)
  })

  it('findNextMatch 查找下一个', () => {
    const results = searchTextInPages(testPages, '苹果')
    expect(findNextMatch(results, 0)).toBe(results[1])
    expect(findNextMatch(results, 1)).toBe(results[2])
    expect(findNextMatch(results, 2)).toBe(results[0])
  })

  it('findPrevMatch 查找上一个', () => {
    const results = searchTextInPages(testPages, '苹果')
    expect(findPrevMatch(results, 0)).toBe(results[2])
    expect(findPrevMatch(results, 2)).toBe(results[1])
  })

  it('findNextMatch / findPrevMatch 空数组安全', () => {
    expect(findNextMatch([], 0)).toBeNull()
    expect(findPrevMatch([], 0)).toBeNull()
  })
})

describe('缩放计算', () => {
  it('calculateFitWidthZoom 适应宽度计算', () => {
    const zoom = calculateFitWidthZoom(1200, DEFAULT_PAGE_WIDTH)
    expect(zoom).toBe(200)
    const zoom2 = calculateFitWidthZoom(300, DEFAULT_PAGE_WIDTH)
    expect(zoom2).toBe(50)
  })

  it('calculateFitWidthZoom 无效输入返回默认', () => {
    expect(calculateFitWidthZoom(0, 0)).toBe(DEFAULT_ZOOM)
    expect(calculateFitWidthZoom('abc', 'def')).toBe(DEFAULT_ZOOM)
  })

  it('calculateFitPageZoom 适应页面计算取较小值', () => {
    const zoom = calculateFitPageZoom(600, 800, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT)
    expect(zoom).toBe(100)
    const zoom2 = calculateFitPageZoom(300, 400, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT)
    expect(zoom2).toBe(50)
  })

  it('calculateRenderPageSize 计算渲染尺寸', () => {
    const size = calculateRenderPageSize(100, 600, 800)
    expect(size.width).toBe(600)
    expect(size.height).toBe(800)
    const size2 = calculateRenderPageSize(50, 600, 800)
    expect(size2.width).toBe(300)
    expect(size2.height).toBe(400)
    const size3 = calculateRenderPageSize(200, 600, 800)
    expect(size3.width).toBe(1200)
    expect(size3.height).toBe(1600)
  })
})
