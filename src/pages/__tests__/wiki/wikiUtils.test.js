import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateId,
  formatDate,
  escapeHtml,
  loadData,
  saveData,
  filterSpaces,
  getSpaceById,
  getPagesBySpaceId,
  getPageCountInSpace,
  createSpace,
  updateSpace,
  deleteSpace,
  getRootPages,
  getPageById,
  getPagePath,
  getChildPages,
  createPage,
  updatePage,
  savePageVersion,
  restoreVersion,
  deletePage,
  movePage,
  getDescendantPageIds,
  markdownToHtml,
  diffContent,
  searchAllPages,
  highlightText,
  highlightTextSafe,
  addTagToPage,
  removeTagFromPage,
  getAllTagsInSpace,
  getTagCloudSize,
  filterPagesByTag,
  getSpaceMembers,
  addMemberToSpace,
  removeMemberFromSpace,
  getCurrentUser,
  isPageDescendant,
} from '../../wiki/wikiUtils'
import { STORAGE_KEY, getDefaultData, ROLE_TYPES } from '../../wiki/constants.js'

describe('基础工具函数', () => {
  describe('generateId', () => {
    it('应该生成带前缀的唯一 ID', () => {
      const id1 = generateId('space')
      const id2 = generateId('page')
      expect(id1.startsWith('space-')).toBe(true)
      expect(id2.startsWith('page-')).toBe(true)
      expect(id1).not.toBe(id2)
    })

    it('不传入前缀时应该使用默认前缀', () => {
      const id = generateId()
      expect(id.startsWith('id-')).toBe(true)
    })

    it('连续调用应该生成不同的 ID', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('formatDate', () => {
    it('应该正确格式化时间戳', () => {
      const result = formatDate(1700000000000)
      expect(typeof result).toBe('string')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    })

    it('null 或 NaN 应该返回 "-"', () => {
      expect(formatDate(null)).toBe('-')
      expect(formatDate(undefined)).toBe('-')
      expect(formatDate(NaN)).toBe('-')
    })
  })

  describe('escapeHtml', () => {
    it('应该正确转义 HTML 特殊字符', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
      expect(escapeHtml('&')).toBe('&amp;')
      expect(escapeHtml('"')).toBe('&quot;')
      expect(escapeHtml("'")).toBe('&#39;')
    })

    it('非字符串输入应该返回空字符串', () => {
      expect(escapeHtml(null)).toBe('')
      expect(escapeHtml(undefined)).toBe('')
      expect(escapeHtml(123)).toBe('')
    })
  })
})

describe('localStorage 持久化', () => {
  let store = {}

  beforeEach(() => {
    store = {}
  })

  describe('saveData', () => {
    it('应该成功保存数据到 localStorage', () => {
      const mockStorage = {
        getItem: vi.fn((key) => (key in store ? store[key] : null)),
        setItem: vi.fn((key, value) => {
          store[key] = String(value)
        }),
      }
      const data = getDefaultData()
      const result = saveData(data, mockStorage)
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalled()
      const parsed = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(parsed.spaces.length).toBe(data.spaces.length)
    })

    it('localStorage 抛错时应该返回 false', () => {
      const mockStorage = {
        setItem: vi.fn(() => {
          throw new Error('storage full')
        }),
      }
      expect(saveData({}, mockStorage)).toBe(false)
    })
  })

  describe('loadData', () => {
    it('localStorage 为空时应该返回初始状态', () => {
      const mockStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      }
      const data = loadData(mockStorage)
      const defaults = getDefaultData()
      expect(data.spaces.length).toBe(defaults.spaces.length)
      expect(data.pages.length).toBe(defaults.pages.length)
    })

    it('应该正确加载已保存的数据', () => {
      const custom = {
        spaces: [{ id: 'test', name: 'Test', description: '', members: [] }],
        pages: [],
        members: [],
        currentUserId: 'test-user',
      }
      const mockStorage = {
        getItem: vi.fn((key) => (key === STORAGE_KEY ? JSON.stringify(custom) : null)),
        setItem: vi.fn(),
      }
      const data = loadData(mockStorage)
      expect(data.spaces.length).toBe(1)
      expect(data.spaces[0].id).toBe('test')
    })

    it('损坏的数据应该回退到初始状态', () => {
      const mockStorage = {
        getItem: vi.fn((key) => (key === STORAGE_KEY ? 'invalid json' : null)),
        setItem: vi.fn(),
      }
      const data = loadData(mockStorage)
      const defaults = getDefaultData()
      expect(data.spaces.length).toBe(defaults.spaces.length)
    })

    it('缺失必要字段的数据应该回退到初始状态', () => {
      const mockStorage = {
        getItem: vi.fn((key) => (key === STORAGE_KEY ? JSON.stringify({ foo: 'bar' }) : null)),
        setItem: vi.fn(),
      }
      const data = loadData(mockStorage)
      const defaults = getDefaultData()
      expect(data.spaces.length).toBe(defaults.spaces.length)
    })

    it('localStorage 抛错时应该返回初始状态', () => {
      const mockStorage = {
        getItem: vi.fn(() => {
          throw new Error('read error')
        }),
        setItem: vi.fn(),
      }
      const data = loadData(mockStorage)
      const defaults = getDefaultData()
      expect(data.spaces.length).toBe(defaults.spaces.length)
    })
  })
})

describe('空间管理', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('filterSpaces', () => {
    it('应该根据关键词过滤空间', () => {
      const result = filterSpaces(testData.spaces, '技术')
      expect(result.length).toBe(1)
      expect(result[0].name).toBe('技术文档')
    })

    it('搜索应该不区分大小写', () => {
      const r1 = filterSpaces(testData.spaces, '技术')
      const r2 = filterSpaces(testData.spaces, '技术'.toUpperCase())
      expect(r1.length).toBe(r2.length)
    })

    it('空关键词应该返回所有空间', () => {
      const result = filterSpaces(testData.spaces, '')
      expect(result.length).toBe(testData.spaces.length)
    })

    it('null 或 undefined 关键词应该返回所有空间', () => {
      expect(filterSpaces(testData.spaces, null).length).toBe(testData.spaces.length)
      expect(filterSpaces(testData.spaces, undefined).length).toBe(testData.spaces.length)
    })
  })

  describe('getSpaceById', () => {
    it('应该根据 ID 正确查找空间', () => {
      const space = getSpaceById(testData, 'space-tech')
      expect(space).not.toBeNull()
      expect(space.name).toBe('技术文档')
    })

    it('找不到时应该返回 null', () => {
      expect(getSpaceById(testData, 'not-exist')).toBeNull()
    })
  })

  describe('getPagesBySpaceId', () => {
    it('应该返回指定空间的所有页面', () => {
      const pages = getPagesBySpaceId(testData, 'space-tech')
      expect(pages.length).toBeGreaterThan(0)
      pages.forEach((p) => expect(p.spaceId).toBe('space-tech'))
    })

    it('空空间应该返回空数组', () => {
      const pages = getPagesBySpaceId(testData, 'not-exist')
      expect(pages).toEqual([])
    })
  })

  describe('getPageCountInSpace', () => {
    it('应该返回正确的页面数量', () => {
      const count = getPageCountInSpace(testData, 'space-tech')
      const pages = getPagesBySpaceId(testData, 'space-tech')
      expect(count).toBe(pages.length)
    })
  })

  describe('createSpace', () => {
    it('应该创建新空间', () => {
      const result = createSpace(testData, '新空间', '空间描述')
      const newSpace = result.spaces.find((s) => s.name === '新空间')
      expect(newSpace).toBeTruthy()
      expect(newSpace.description).toBe('空间描述')
      expect(newSpace.members).toContain(testData.currentUserId)
    })

    it('空名称不应该创建空间', () => {
      const result = createSpace(testData, '', '描述')
      expect(result).toEqual(testData)
    })

    it('新空间应该有正确的默认属性', () => {
      const result = createSpace(testData, '测试空间', '')
      const newSpace = result.spaces.find((s) => s.name === '测试空间')
      expect(newSpace.description).toBe('')
      expect(typeof newSpace.createdAt).toBe('number')
      expect(typeof newSpace.updatedAt).toBe('number')
    })
  })

  describe('updateSpace', () => {
    it('应该正确更新空间信息', () => {
      const result = updateSpace(testData, 'space-tech', { name: '新名称' })
      const space = getSpaceById(result, 'space-tech')
      expect(space.name).toBe('新名称')
      expect(typeof space.updatedAt).toBe('number')
    })

    it('不存在的空间应该返回原数据', () => {
      const result = updateSpace(testData, 'not-exist', { name: 'xxx' })
      expect(result).toEqual(testData)
    })
  })

  describe('deleteSpace', () => {
    it('应该删除空间及其所有页面', () => {
      const techPages = getPagesBySpaceId(testData, 'space-tech')
      expect(techPages.length).toBeGreaterThan(0)
      const result = deleteSpace(testData, 'space-tech')
      expect(getSpaceById(result, 'space-tech')).toBeNull()
      expect(getPagesBySpaceId(result, 'space-tech').length).toBe(0)
    })

    it('不应该影响其他空间', () => {
      const result = deleteSpace(testData, 'space-tech')
      expect(result.spaces.length).toBe(testData.spaces.length - 1)
      expect(getSpaceById(result, 'space-product')).not.toBeNull()
    })
  })
})

describe('树形结构操作', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('getRootPages', () => {
    it('应该返回指定空间的根页面', () => {
      const rootPages = getRootPages(testData.pages, 'space-tech')
      rootPages.forEach((p) => {
        expect(p.parentId).toBeNull()
        expect(p.spaceId).toBe('space-tech')
      })
      expect(rootPages.length).toBeGreaterThan(0)
    })
  })

  describe('getPageById', () => {
    it('应该根据 ID 正确查找页面', () => {
      const page = getPageById(testData, testData.pages[0].id)
      expect(page).not.toBeNull()
      expect(page.id).toBe(testData.pages[0].id)
    })

    it('找不到时应该返回 null', () => {
      expect(getPageById(testData, 'not-exist')).toBeNull()
    })
  })

  describe('getPagePath', () => {
    it('应该返回从根到目标页面的完整路径', () => {
      const parentPage = testData.pages.find((p) => p.children && p.children.length > 0)
      const childId = parentPage.children[0]
      const path = getPagePath(testData, childId)
      expect(path.length).toBeGreaterThan(1)
      expect(path[0].id).toBe(parentPage.id)
      expect(path[path.length - 1].id).toBe(childId)
    })

    it('根页面路径应该只包含自己', () => {
      const rootPage = testData.pages.find((p) => !p.parentId)
      const path = getPagePath(testData, rootPage.id)
      expect(path.length).toBe(1)
    })

    it('不存在的页面应该返回空路径', () => {
      const path = getPagePath(testData, 'not-exist')
      expect(path).toEqual([])
    })
  })

  describe('getChildPages', () => {
    it('应该返回指定页面的直接子页面', () => {
      const parentPage = testData.pages.find((p) => p.children && p.children.length > 0)
      const children = getChildPages(testData, parentPage.id)
      expect(children.length).toBe(parentPage.children.length)
      children.forEach((c) => expect(c.parentId).toBe(parentPage.id))
    })

    it('叶子节点应该返回空数组', () => {
      const leafPage = testData.pages.find((p) => !p.children || p.children.length === 0)
      const children = getChildPages(testData, leafPage.id)
      expect(children).toEqual([])
    })
  })

  describe('getDescendantPageIds', () => {
    it('应该返回所有后代页面 ID', () => {
      const parentPage = testData.pages.find((p) => p.children && p.children.length > 0)
      const ids = getDescendantPageIds(testData.pages, parentPage.id)
      expect(ids).toContain(parentPage.id)
      for (const childId of parentPage.children) {
        expect(ids).toContain(childId)
      }
    })

    it('叶子节点应该只包含自身', () => {
      const leafPage = testData.pages.find((p) => !p.children || p.children.length === 0)
      const ids = getDescendantPageIds(testData.pages, leafPage.id)
      expect(ids).toEqual([leafPage.id])
    })
  })

  describe('createPage', () => {
    it('应该创建根页面', () => {
      const beforeCount = testData.pages.length
      const result = createPage(testData, 'space-tech', null, '新页面')
      expect(result.pages.length).toBe(beforeCount + 1)
      const newPage = result.pages.find((p) => p.title === '新页面')
      expect(newPage).toBeTruthy()
      expect(newPage.parentId).toBeNull()
      expect(newPage.spaceId).toBe('space-tech')
    })

    it('应该创建子页面', () => {
      const parentPage = testData.pages[0]
      const result = createPage(testData, parentPage.spaceId, parentPage.id, '子页面')
      const newPage = result.pages.find((p) => p.title === '子页面')
      expect(newPage.parentId).toBe(parentPage.id)
      const updatedParent = getPageById(result, parentPage.id)
      expect(updatedParent.children).toContain(newPage.id)
    })

    it('新页面应该有初始版本', () => {
      const result = createPage(testData, 'space-tech', null, '版本测试')
      const newPage = result.pages.find((p) => p.title === '版本测试')
      expect(Array.isArray(newPage.versions)).toBe(true)
      expect(newPage.versions.length).toBe(1)
      expect(newPage.versions[0].version).toBe(1)
    })

    it('不指定标题时应该使用默认标题', () => {
      const result = createPage(testData, 'space-tech', null)
      const newPage = result.pages[result.pages.length - 1]
      expect(newPage.title).toBe('未命名页面')
    })
  })

  describe('updatePage', () => {
    it('应该正确更新页面字段', () => {
      const pageId = testData.pages[0].id
      const oldTime = testData.pages[0].updatedAt
      vi.useFakeTimers().setSystemTime(oldTime + 100000)
      const result = updatePage(testData, pageId, { title: '新标题' })
      vi.useRealTimers()
      const updated = getPageById(result, pageId)
      expect(updated.title).toBe('新标题')
      expect(updated.updatedAt).toBeGreaterThan(oldTime)
    })

    it('应该可以同时更新多个字段', () => {
      const pageId = testData.pages[0].id
      const result = updatePage(testData, pageId, { title: 'T', content: 'C' })
      const updated = getPageById(result, pageId)
      expect(updated.title).toBe('T')
      expect(updated.content).toBe('C')
    })
  })

  describe('deletePage', () => {
    it('应该删除页面及其所有子页面', () => {
      const parentPage = testData.pages.find((p) => p.children && p.children.length > 0)
      const childId = parentPage.children[0]
      const result = deletePage(testData, parentPage.id)
      expect(getPageById(result, parentPage.id)).toBeNull()
      expect(getPageById(result, childId)).toBeNull()
    })

    it('应该从父页面的 children 中移除', () => {
      const parentPage = testData.pages.find((p) => p.children && p.children.length > 0)
      const childId = parentPage.children[0]
      const result = deletePage(testData, childId)
      const updatedParent = getPageById(result, parentPage.id)
      expect(updatedParent.children).not.toContain(childId)
    })
  })

  describe('movePage', () => {
    it('应该将页面移动到另一个页面下', () => {
      const page = testData.pages.find((p) => p.parentId)
      const newParent = testData.pages.find((p) => p.id !== page.id && p.children.length === 0)
      const result = movePage(testData, page.id, newParent.id)
      const movedPage = getPageById(result, page.id)
      expect(movedPage.parentId).toBe(newParent.id)
      const newParentUpdated = getPageById(result, newParent.id)
      expect(newParentUpdated.children).toContain(page.id)
    })

    it('不应该将页面移动到自己的后代中', () => {
      const parentPage = testData.pages.find((p) => p.children && p.children.length > 0)
      const childId = parentPage.children[0]
      const result = movePage(testData, parentPage.id, childId)
      expect(result).toEqual(testData)
    })

    it('应该从原父节点的 children 中移除', () => {
      const page = testData.pages.find((p) => p.parentId)
      const oldParentId = page.parentId
      const newParent = testData.pages.find((p) => p.id !== page.id && p.id !== oldParentId)
      const result = movePage(testData, page.id, newParent.id)
      const oldParentUpdated = getPageById(result, oldParentId)
      expect(oldParentUpdated.children).not.toContain(page.id)
    })
  })

  describe('isPageDescendant', () => {
    it('应该正确判断后代关系', () => {
      const parentPage = testData.pages.find((p) => p.children && p.children.length > 0)
      const childId = parentPage.children[0]
      expect(isPageDescendant(testData, parentPage.id, childId)).toBe(true)
      expect(isPageDescendant(testData, childId, parentPage.id)).toBe(false)
    })

    it('节点不应该是自己的后代', () => {
      const pageId = testData.pages[0].id
      expect(isPageDescendant(testData, pageId, pageId)).toBe(false)
    })
  })
})

describe('版本管理', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('savePageVersion', () => {
    it('应该创建新版本', () => {
      const pageId = testData.pages[0].id
      const oldVersionCount = testData.pages[0].versions.length
      const result = savePageVersion(testData, pageId)
      const updatedPage = getPageById(result, pageId)
      expect(updatedPage.versions.length).toBe(oldVersionCount + 1)
      expect(updatedPage.versions[oldVersionCount].version).toBe(oldVersionCount + 1)
    })

    it('新版本应该保存当前内容', () => {
      const pageId = testData.pages[0].id
      const updated = updatePage(testData, pageId, { title: '修改标题', content: '修改内容' })
      const result = savePageVersion(updated, pageId)
      const page = getPageById(result, pageId)
      const latestVersion = page.versions[page.versions.length - 1]
      expect(latestVersion.title).toBe('修改标题')
      expect(latestVersion.content).toBe('修改内容')
    })

    it('不存在的页面应该返回原数据', () => {
      const result = savePageVersion(testData, 'not-exist')
      expect(result).toEqual(testData)
    })
  })

  describe('restoreVersion', () => {
    it('应该恢复到指定版本', () => {
      const page = testData.pages.find((p) => p.versions && p.versions.length >= 2)
      const oldVersion = page.versions[0]
      const result = restoreVersion(testData, page.id, oldVersion.id)
      const restoredPage = getPageById(result, page.id)
      expect(restoredPage.title).toBe(oldVersion.title)
      expect(restoredPage.content).toBe(oldVersion.content)
    })

    it('不存在的版本应该返回原数据', () => {
      const pageId = testData.pages[0].id
      const result = restoreVersion(testData, pageId, 'not-exist')
      expect(result).toEqual(testData)
    })
  })
})

describe('Markdown 渲染', () => {
  describe('markdownToHtml', () => {
    it('应该正确渲染标题', () => {
      const html = markdownToHtml('# Hello\n## World')
      expect(html).toContain('<h1')
      expect(html).toContain('<h2')
      expect(html).toContain('Hello')
      expect(html).toContain('World')
    })

    it('应该正确渲染粗体和斜体', () => {
      const html = markdownToHtml('**粗体** *斜体*')
      expect(html).toContain('<strong>粗体</strong>')
      expect(html).toContain('<em>斜体</em>')
    })

    it('应该正确渲染代码块', () => {
      const html = markdownToHtml('```js\nconst x = 1;\n```')
      expect(html).toContain('<pre><code')
      expect(html).toContain('const x = 1;')
    })

    it('应该正确渲染列表', () => {
      const html = markdownToHtml('- 项1\n- 项2')
      expect(html).toContain('<ul>')
      expect(html.match(/<li>/g)?.length).toBe(2)
    })

    it('应该正确渲染表格', () => {
      const md = `| 列1 | 列2 |\n| --- | --- |\n| 内容1 | 内容2 |`
      const html = markdownToHtml(md)
      expect(html).toContain('<table>')
      expect(html).toContain('<th>列1</th>')
      expect(html).toContain('<td>内容1</td>')
    })

    it('应该正确渲染链接和图片', () => {
      const html = markdownToHtml('[链接](https://example.com)![图片](img.png)')
      expect(html).toContain('<a')
      expect(html).toContain('href="https://example.com"')
      expect(html).toContain('<img')
      expect(html).toContain('src="img.png"')
    })

    it('空内容应该返回空字符串', () => {
      expect(markdownToHtml('')).toBe('')
      expect(markdownToHtml(null)).toBe('')
    })
  })
})

describe('Diff 对比', () => {
  describe('diffContent', () => {
    it('相同内容应该返回相同的 HTML', () => {
      const content = 'Hello World'
      const result = diffContent(content, content)
      expect(result.oldHtml).toBe(result.newHtml)
    })

    it('应该正确标记新增和删除的行', () => {
      const oldContent = 'line1\nline2\nline3'
      const newContent = 'line1\nline2-modified\nline3\nline4'
      const result = diffContent(oldContent, newContent)
      expect(result.oldHtml).toContain('diff-removed')
      expect(result.newHtml).toContain('diff-added')
    })

    it('应该正确标记新增的单词', () => {
      const oldContent = 'Hello World'
      const newContent = 'Hello React'
      const result = diffContent(oldContent, newContent)
      expect(result.oldHtml).toContain('diff-word-removed')
      expect(result.newHtml).toContain('diff-word-added')
    })

    it('应该正确转义 HTML', () => {
      const oldContent = '<script>'
      const newContent = '<script>'
      const result = diffContent(oldContent, newContent)
      expect(result.oldHtml).toContain('&lt;script&gt;')
      expect(result.newHtml).toContain('&lt;script&gt;')
    })
  })
})

describe('全文搜索', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('searchAllPages', () => {
    it('应该根据标题匹配搜索', () => {
      const results = searchAllPages(testData, 'React')
      expect(results.length).toBeGreaterThan(0)
      results.forEach((r) => {
        expect(r.titleMatch || r.contentMatch).toBe(true)
      })
    })

    it('应该根据内容匹配搜索', () => {
      const results = searchAllPages(testData, 'Hooks')
      expect(results.length).toBeGreaterThan(0)
    })

    it('搜索应该不区分大小写', () => {
      const r1 = searchAllPages(testData, 'react')
      const r2 = searchAllPages(testData, 'REACT')
      expect(r1.length).toBe(r2.length)
    })

    it('标题匹配的结果应该排在内容匹配之前', () => {
      const results = searchAllPages(testData, 'React')
      const titleMatchResults = results.filter((r) => r.titleMatch)
      const contentMatchResults = results.filter((r) => !r.titleMatch)
      if (titleMatchResults.length > 0 && contentMatchResults.length > 0) {
        expect(results[0].titleMatch).toBe(true)
      }
    })

    it('空关键词应该返回空数组', () => {
      expect(searchAllPages(testData, '')).toEqual([])
      expect(searchAllPages(testData, '   ')).toEqual([])
      expect(searchAllPages(testData, null)).toEqual([])
    })

    it('结果应该包含空间名称', () => {
      const results = searchAllPages(testData, 'React')
      results.forEach((r) => {
        expect(r.spaceName).toBeTruthy()
      })
    })

    it('结果应该包含摘要', () => {
      const results = searchAllPages(testData, 'React')
      results.forEach((r) => {
        expect(r.snippet).toBeTruthy()
      })
    })
  })

  describe('highlightText', () => {
    it('应该用标记包裹匹配的文本', () => {
      const result = highlightText('Hello React World', 'React')
      expect(result).toContain('|||HIGHLIGHT|||')
      expect(result).toContain('|||/HIGHLIGHT|||')
    })

    it('空关键词应该返回原文本', () => {
      expect(highlightText('test', '')).toBe('test')
    })

    it('应该支持转义特殊正则字符', () => {
      expect(() => highlightText('a.b', '.')).not.toThrow()
    })
  })

  describe('highlightTextSafe', () => {
    it('应该转义 HTML 并高亮关键词', () => {
      const result = highlightTextSafe('<div>React</div>', 'React')
      expect(result).toContain('&lt;div&gt;')
      expect(result).toContain('<span class="highlight">')
    })
  })
})

describe('标签操作', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('addTagToPage', () => {
    it('应该添加标签到页面', () => {
      const pageId = testData.pages[0].id
      const result = addTagToPage(testData, pageId, '新标签')
      const page = getPageById(result, pageId)
      expect(page.tags).toContain('新标签')
    })

    it('不应该添加重复标签', () => {
      const pageId = testData.pages[0].id
      const existingTag = testData.pages[0].tags[0]
      const result = addTagToPage(testData, pageId, existingTag)
      expect(result).toEqual(testData)
    })

    it('空标签不应该添加', () => {
      const pageId = testData.pages[0].id
      const result = addTagToPage(testData, pageId, '   ')
      expect(result).toEqual(testData)
    })

    it('不存在的页面应该返回原数据', () => {
      const result = addTagToPage(testData, 'not-exist', '标签')
      expect(result).toEqual(testData)
    })
  })

  describe('removeTagFromPage', () => {
    it('应该从页面移除标签', () => {
      const page = testData.pages.find((p) => p.tags && p.tags.length > 0)
      const tagToRemove = page.tags[0]
      const result = removeTagFromPage(testData, page.id, tagToRemove)
      const updatedPage = getPageById(result, page.id)
      expect(updatedPage.tags).not.toContain(tagToRemove)
    })

    it('不存在的页面应该返回原数据', () => {
      const result = removeTagFromPage(testData, 'not-exist', '标签')
      expect(result).toEqual(testData)
    })
  })

  describe('getAllTagsInSpace', () => {
    it('应该返回空间内所有标签及其计数', () => {
      const tags = getAllTagsInSpace(testData, 'space-tech')
      expect(tags.length).toBeGreaterThan(0)
      tags.forEach((t) => {
        expect(t).toHaveProperty('name')
        expect(t).toHaveProperty('count')
        expect(t.count).toBeGreaterThan(0)
      })
    })

    it('应该按使用频次排序', () => {
      const tags = getAllTagsInSpace(testData, 'space-tech')
      for (let i = 0; i < tags.length - 1; i++) {
        expect(tags[i].count).toBeGreaterThanOrEqual(tags[i + 1].count)
      }
    })
  })

  describe('getTagCloudSize', () => {
    it('应该根据频次返回正确的字体大小比例', () => {
      expect(getTagCloudSize(10, 10)).toBe(1.5)
      expect(getTagCloudSize(6, 10)).toBe(1.3)
      expect(getTagCloudSize(1, 10)).toBe(0.85)
    })

    it('maxCount 为 0 时应该返回 1', () => {
      expect(getTagCloudSize(5, 0)).toBe(1)
    })
  })

  describe('filterPagesByTag', () => {
    it('应该根据标签过滤页面', () => {
      const pages = filterPagesByTag(testData, 'space-tech', 'React')
      expect(pages.length).toBeGreaterThan(0)
      pages.forEach((p) => {
        expect(p.tags).toContain('React')
      })
    })

    it('空标签应该返回所有页面', () => {
      const allPages = getPagesBySpaceId(testData, 'space-tech')
      const filtered = filterPagesByTag(testData, 'space-tech', '')
      expect(filtered.length).toBe(allPages.length)
    })
  })
})

describe('成员管理', () => {
  let testData

  beforeEach(() => {
    testData = getDefaultData()
  })

  describe('getSpaceMembers', () => {
    it('应该返回空间成员列表', () => {
      const members = getSpaceMembers(testData, 'space-tech')
      expect(members.length).toBeGreaterThan(0)
      members.forEach((m) => {
        expect(m).toHaveProperty('name')
        expect(m).toHaveProperty('role')
        expect(m).toHaveProperty('roleLabel')
        expect(m).toHaveProperty('joinedAtLabel')
      })
    })

    it('不存在的空间应该返回空数组', () => {
      const members = getSpaceMembers(testData, 'not-exist')
      expect(members).toEqual([])
    })

    it('应该正确映射角色标签', () => {
      const members = getSpaceMembers(testData, 'space-tech')
      const admin = members.find((m) => m.role === ROLE_TYPES.ADMIN)
      expect(admin.roleLabel).toBe('管理员')
    })
  })

  describe('addMemberToSpace', () => {
    it('应该添加成员到空间', () => {
      const result = addMemberToSpace(testData, 'space-product', 'member-3')
      const members = getSpaceMembers(result, 'space-product')
      const memberIds = members.map((m) => m.id)
      expect(memberIds).toContain('member-3')
    })

    it('不应该重复添加', () => {
      const result = addMemberToSpace(testData, 'space-tech', 'member-1')
      expect(result).toEqual(testData)
    })
  })

  describe('removeMemberFromSpace', () => {
    it('应该从空间移除成员', () => {
      const result = removeMemberFromSpace(testData, 'space-tech', 'member-3')
      const members = getSpaceMembers(result, 'space-tech')
      const memberIds = members.map((m) => m.id)
      expect(memberIds).not.toContain('member-3')
    })
  })

  describe('getCurrentUser', () => {
    it('应该返回当前用户', () => {
      const user = getCurrentUser(testData)
      expect(user).not.toBeNull()
      expect(user.id).toBe(testData.currentUserId)
    })
  })
})
