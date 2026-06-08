import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  STORAGE_KEY,
  RECENT_LIMIT,
  DEFAULT_CATEGORIES,
  DEFAULT_ARTICLES,
  generateId,
  createInitialState,
  loadData,
  saveData,
  findCategoryById,
  findArticleById,
  getCategoryPath,
  getChildCategories,
  getArticlesByCategory,
  createCategory,
  renameCategory,
  getDescendantCategoryIds,
  deleteCategory,
  toggleCategoryExpand,
  isDescendantCategory,
  moveCategory,
  createArticle,
  updateArticle,
  deleteArticle,
  toggleFavorite,
  addRecent,
  searchArticles,
  highlightText,
  sortArticles,
  escapeHtml,
  extractTOC,
  markdownToHtml,
  formatDate,
} from '../../knowledge-base/kbUtils'

describe('常量定义', () => {
  it('STORAGE_KEY 应该是正确的值', () => {
    expect(STORAGE_KEY).toBe('knowledge-base-data')
  })

  it('RECENT_LIMIT 应该是 20', () => {
    expect(RECENT_LIMIT).toBe(20)
  })

  it('DEFAULT_CATEGORIES 应该包含根分类', () => {
    expect(Array.isArray(DEFAULT_CATEGORIES)).toBe(true)
    expect(DEFAULT_CATEGORIES.length).toBeGreaterThan(0)
    expect(DEFAULT_CATEGORIES[0].id).toBe('cat-root')
  })

  it('DEFAULT_ARTICLES 应该包含示例文章', () => {
    expect(Array.isArray(DEFAULT_ARTICLES)).toBe(true)
    expect(DEFAULT_ARTICLES.length).toBeGreaterThan(0)
    DEFAULT_ARTICLES.forEach((a) => {
      expect(a).toHaveProperty('id')
      expect(a).toHaveProperty('title')
      expect(a).toHaveProperty('content')
      expect(a).toHaveProperty('categoryId')
    })
  })
})

describe('基础工具函数', () => {
  describe('generateId', () => {
    it('应该生成带前缀的唯一 ID', () => {
      const id1 = generateId('cat')
      const id2 = generateId('art')
      expect(id1.startsWith('cat-')).toBe(true)
      expect(id2.startsWith('art-')).toBe(true)
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

  describe('createInitialState', () => {
    it('应该创建包含 categories、articles、favorites、recent 的初始状态', () => {
      const state = createInitialState()
      expect(state).toHaveProperty('categories')
      expect(state).toHaveProperty('articles')
      expect(state).toHaveProperty('favorites')
      expect(state).toHaveProperty('recent')
      expect(Array.isArray(state.categories)).toBe(true)
      expect(Array.isArray(state.articles)).toBe(true)
      expect(Array.isArray(state.favorites)).toBe(true)
      expect(Array.isArray(state.recent)).toBe(true)
    })

    it('favorites 应该正确初始化为默认收藏的文章 ID', () => {
      const state = createInitialState()
      const favArticles = DEFAULT_ARTICLES.filter((a) => a.isFavorite)
      expect(state.favorites).toEqual(favArticles.map((a) => a.id))
    })

    it('recent 应该初始化为空数组', () => {
      const state = createInitialState()
      expect(state.recent).toEqual([])
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
})

describe('localStorage 持久化', () => {
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
      }),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('saveData', () => {
    it('应该成功保存数据到 localStorage', () => {
      const data = createInitialState()
      const result = saveData(data)
      expect(result).toBe(true)
      expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(parsed.categories.length).toBe(data.categories.length)
    })

    it('localStorage 抛错时应该返回 false', () => {
      vi.stubGlobal('localStorage', {
        setItem: vi.fn(() => {
          throw new Error('storage full')
        }),
      })
      expect(saveData({})).toBe(false)
    })
  })

  describe('loadData', () => {
    it('localStorage 为空时应该返回初始状态', () => {
      const data = loadData()
      expect(data.categories.length).toBe(DEFAULT_CATEGORIES.length)
      expect(data.articles.length).toBe(DEFAULT_ARTICLES.length)
    })

    it('应该正确加载已保存的数据', () => {
      const custom = {
        categories: [{ id: 'test', name: 'Test', parentId: null, children: [] }],
        articles: [],
        favorites: [],
        recent: [],
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
      const data = loadData()
      expect(data.categories.length).toBe(1)
      expect(data.categories[0].id).toBe('test')
    })

    it('损坏的数据应该回退到初始状态', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json')
      const data = loadData()
      expect(data.categories.length).toBe(DEFAULT_CATEGORIES.length)
    })

    it('缺失必要字段的数据应该回退到初始状态', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }))
      const data = loadData()
      expect(data.categories.length).toBe(DEFAULT_CATEGORIES.length)
    })

    it('localStorage 抛错时应该返回初始状态', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => {
          throw new Error('read error')
        }),
      })
      const data = loadData()
      expect(data.categories.length).toBe(DEFAULT_CATEGORIES.length)
    })
  })
})

describe('分类查找与导航', () => {
  describe('findCategoryById', () => {
    it('应该根据 ID 正确查找分类', () => {
      const cat = findCategoryById(DEFAULT_CATEGORIES, 'cat-root')
      expect(cat).not.toBeNull()
      expect(cat.id).toBe('cat-root')
      expect(cat.name).toBe('知识库')
    })

    it('找不到时应该返回 null', () => {
      expect(findCategoryById(DEFAULT_CATEGORIES, 'not-exist')).toBeNull()
    })

    it('空数组应该返回 null', () => {
      expect(findCategoryById([], 'cat-root')).toBeNull()
    })
  })

  describe('findArticleById', () => {
    it('应该根据 ID 正确查找文章', () => {
      const article = findArticleById(DEFAULT_ARTICLES, DEFAULT_ARTICLES[0].id)
      expect(article).not.toBeNull()
      expect(article.id).toBe(DEFAULT_ARTICLES[0].id)
    })

    it('找不到时应该返回 null', () => {
      expect(findArticleById(DEFAULT_ARTICLES, 'not-exist')).toBeNull()
    })
  })

  describe('getCategoryPath', () => {
    it('应该返回从根到目标分类的完整路径', () => {
      const path = getCategoryPath(DEFAULT_CATEGORIES, 'cat-1-1-1')
      expect(path.length).toBe(4)
      expect(path[0].id).toBe('cat-root')
      expect(path[1].id).toBe('cat-1')
      expect(path[2].id).toBe('cat-1-1')
      expect(path[3].id).toBe('cat-1-1-1')
    })

    it('根分类路径应该只包含自己', () => {
      const path = getCategoryPath(DEFAULT_CATEGORIES, 'cat-root')
      expect(path.length).toBe(1)
      expect(path[0].id).toBe('cat-root')
    })

    it('不存在的分类应该返回空路径', () => {
      const path = getCategoryPath(DEFAULT_CATEGORIES, 'not-exist')
      expect(path).toEqual([])
    })
  })

  describe('getChildCategories', () => {
    it('应该返回指定父分类的直接子分类', () => {
      const children = getChildCategories(DEFAULT_CATEGORIES, 'cat-root')
      expect(children.length).toBe(2)
      expect(children.map((c) => c.id).sort()).toEqual(['cat-1', 'cat-2'].sort())
    })

    it('叶子节点应该返回空数组', () => {
      const children = getChildCategories(DEFAULT_CATEGORIES, 'cat-1-2')
      expect(children).toEqual([])
    })
  })

  describe('getArticlesByCategory', () => {
    it('应该返回指定分类下的所有文章', () => {
      const initial = createInitialState()
      const articles = getArticlesByCategory(initial.articles, 'cat-1-1-1')
      expect(articles.length).toBeGreaterThanOrEqual(1)
      articles.forEach((a) => expect(a.categoryId).toBe('cat-1-1-1'))
    })

    it('空分类应该返回空数组', () => {
      const articles = getArticlesByCategory(DEFAULT_ARTICLES, 'empty-category')
      expect(articles).toEqual([])
    })
  })
})

describe('分类操作', () => {
  describe('createCategory', () => {
    it('应该在指定父分类下创建新分类', () => {
      const initial = createInitialState()
      const result = createCategory(initial, 'cat-1', '新分类')
      const newCat = result.categories.find((c) => c.name === '新分类')
      expect(newCat).toBeTruthy()
      expect(newCat.parentId).toBe('cat-1')
      const parent = result.categories.find((c) => c.id === 'cat-1')
      expect(parent.children).toContain(newCat.id)
      expect(parent.isExpanded).toBe(true)
    })

    it('新分类应该有正确的默认属性', () => {
      const initial = createInitialState()
      const result = createCategory(initial, 'cat-root', '测试分类')
      const newCat = result.categories.find((c) => c.name === '测试分类')
      expect(newCat.children).toEqual([])
      expect(newCat.isExpanded).toBe(true)
      expect(typeof newCat.createdAt).toBe('number')
      expect(typeof newCat.updatedAt).toBe('number')
    })
  })

  describe('renameCategory', () => {
    it('应该正确重命名分类', () => {
      const initial = createInitialState()
      const result = renameCategory(initial, 'cat-1', '重命名技术')
      const cat = result.categories.find((c) => c.id === 'cat-1')
      expect(cat.name).toBe('重命名技术')
      expect(typeof cat.updatedAt).toBe('number')
    })

    it('不存在的分类应该返回原数据', () => {
      const initial = createInitialState()
      const result = renameCategory(initial, 'not-exist', 'xxx')
      expect(result).toEqual(initial)
    })
  })

  describe('getDescendantCategoryIds', () => {
    it('应该返回所有后代分类 ID（包含自身）', () => {
      const ids = getDescendantCategoryIds(DEFAULT_CATEGORIES, 'cat-1')
      expect(ids).toContain('cat-1')
      expect(ids).toContain('cat-1-1')
      expect(ids).toContain('cat-1-1-1')
      expect(ids).toContain('cat-1-2')
    })

    it('叶子节点应该只包含自身', () => {
      const ids = getDescendantCategoryIds(DEFAULT_CATEGORIES, 'cat-2')
      expect(ids).toEqual(['cat-2'])
    })
  })

  describe('deleteCategory', () => {
    it('应该删除分类及其所有后代分类和文章', () => {
      const initial = createInitialState()
      const result = deleteCategory(initial, 'cat-1')
      expect(result.categories.find((c) => c.id === 'cat-1')).toBeUndefined()
      expect(result.categories.find((c) => c.id === 'cat-1-1')).toBeUndefined()
      expect(result.categories.find((c) => c.id === 'cat-1-1-1')).toBeUndefined()
      const articlesInCat1 = result.articles.filter((a) => a.categoryId === 'cat-1-1-1')
      expect(articlesInCat1.length).toBe(0)
    })

    it('不应该删除根分类', () => {
      const initial = createInitialState()
      const result = deleteCategory(initial, 'cat-root')
      expect(result).toEqual(initial)
    })

    it('应该同步清理 favorites 和 recent 中被删除的文章', () => {
      let initial = createInitialState()
      initial = { ...initial, recent: [initial.articles[0].id] }
      const result = deleteCategory(initial, 'cat-1-1-1')
      expect(result.recent.includes(initial.articles[0].id)).toBe(false)
    })
  })

  describe('toggleCategoryExpand', () => {
    it('应该切换分类的展开状态', () => {
      const initial = createInitialState()
      const expanded = initial.categories.find((c) => c.id === 'cat-1').isExpanded
      const result = toggleCategoryExpand(initial, 'cat-1')
      expect(result.categories.find((c) => c.id === 'cat-1').isExpanded).toBe(!expanded)
    })
  })

  describe('isDescendantCategory', () => {
    it('应该正确判断后代关系', () => {
      expect(isDescendantCategory(DEFAULT_CATEGORIES, 'cat-1', 'cat-1-1-1')).toBe(true)
      expect(isDescendantCategory(DEFAULT_CATEGORIES, 'cat-1-1', 'cat-1-1-1')).toBe(true)
      expect(isDescendantCategory(DEFAULT_CATEGORIES, 'cat-1', 'cat-2')).toBe(false)
      expect(isDescendantCategory(DEFAULT_CATEGORIES, 'cat-1-2', 'cat-1')).toBe(false)
    })

    it('节点不应该是自己的后代', () => {
      expect(isDescendantCategory(DEFAULT_CATEGORIES, 'cat-1', 'cat-1')).toBe(false)
    })
  })

  describe('moveCategory', () => {
    it('应该将分类移动到另一个分类内部', () => {
      const initial = createInitialState()
      const result = moveCategory(initial, 'cat-2', 'cat-1', 'inside')
      const cat2 = result.categories.find((c) => c.id === 'cat-2')
      expect(cat2.parentId).toBe('cat-1')
      const cat1 = result.categories.find((c) => c.id === 'cat-1')
      expect(cat1.children).toContain('cat-2')
    })

    it('应该将分类移动到同层另一个分类之前', () => {
      const initial = createInitialState()
      const root = initial.categories.find((c) => c.id === 'cat-root')
      expect(root.children).toEqual(['cat-1', 'cat-2'])
      const result = moveCategory(initial, 'cat-2', 'cat-1', 'before')
      const newRoot = result.categories.find((c) => c.id === 'cat-root')
      expect(newRoot.children).toEqual(['cat-2', 'cat-1'])
      const cat2 = result.categories.find((c) => c.id === 'cat-2')
      expect(cat2.parentId).toBe('cat-root')
    })

    it('应该将分类移动到同层另一个分类之后', () => {
      const initial = createInitialState()
      const root = initial.categories.find((c) => c.id === 'cat-root')
      expect(root.children).toEqual(['cat-1', 'cat-2'])
      const result = moveCategory(initial, 'cat-1', 'cat-2', 'after')
      const newRoot = result.categories.find((c) => c.id === 'cat-root')
      expect(newRoot.children).toEqual(['cat-2', 'cat-1'])
      const cat1 = result.categories.find((c) => c.id === 'cat-1')
      expect(cat1.parentId).toBe('cat-root')
    })

    it('应该将深层分类移动到另一个深层分类之前', () => {
      const initial = createInitialState()
      const cat11 = initial.categories.find((c) => c.id === 'cat-1-1')
      expect(cat11.children).toEqual(['cat-1-1-1'])
      const withNewChild = createCategory(initial, 'cat-1-1', '新增子分类')
      const newCatId = withNewChild.categories.find((c) => c.name === '新增子分类').id
      const newCat11 = withNewChild.categories.find((c) => c.id === 'cat-1-1')
      expect(newCat11.children).toEqual(['cat-1-1-1', newCatId])
      const result = moveCategory(withNewChild, newCatId, 'cat-1-1-1', 'before')
      const finalCat11 = result.categories.find((c) => c.id === 'cat-1-1')
      expect(finalCat11.children).toEqual([newCatId, 'cat-1-1-1'])
    })

    it('拖拽到根节点 before 应该转为 inside（根节点无同级）', () => {
      const initial = createInitialState()
      const beforeRoot = initial.categories.find((c) => c.id === 'cat-root')
      const beforeChildren = [...beforeRoot.children]
      const result = moveCategory(initial, 'cat-2', 'cat-root', 'before')
      const cat2 = result.categories.find((c) => c.id === 'cat-2')
      expect(cat2.parentId).toBe('cat-root')
      const afterRoot = result.categories.find((c) => c.id === 'cat-root')
      expect(afterRoot.children).toEqual(expect.arrayContaining(beforeChildren))
      expect(afterRoot.children).toContain('cat-2')
    })

    it('拖拽到根节点 after 应该转为 inside（根节点无同级）', () => {
      const initial = createInitialState()
      const result = moveCategory(initial, 'cat-2', 'cat-root', 'after')
      const cat2 = result.categories.find((c) => c.id === 'cat-2')
      expect(cat2.parentId).toBe('cat-root')
      const afterRoot = result.categories.find((c) => c.id === 'cat-root')
      expect(afterRoot.children).toContain('cat-2')
    })

    it('目标节点不在父级 children 中（防御性），before 应该插入到开头', () => {
      const initial = createInitialState()
      const tampered = {
        ...initial,
        categories: initial.categories.map((c) =>
          c.id === 'cat-root' ? { ...c, children: ['cat-1'] } : c
        ),
      }
      const result = moveCategory(tampered, 'cat-2', 'cat-1', 'before')
      const newRoot = result.categories.find((c) => c.id === 'cat-root')
      expect(newRoot.children[0]).toBe('cat-2')
    })

    it('目标节点不在父级 children 中（防御性），after 应该插入到末尾', () => {
      const initial = createInitialState()
      const tampered = {
        ...initial,
        categories: initial.categories.map((c) =>
          c.id === 'cat-root' ? { ...c, children: ['cat-1'] } : c
        ),
      }
      const result = moveCategory(tampered, 'cat-2', 'cat-1', 'after')
      const newRoot = result.categories.find((c) => c.id === 'cat-root')
      expect(newRoot.children[newRoot.children.length - 1]).toBe('cat-2')
    })

    it('不应该将分类移动到自己的后代中', () => {
      const initial = createInitialState()
      const result = moveCategory(initial, 'cat-1', 'cat-1-1', 'inside')
      expect(result).toEqual(initial)
    })

    it('不应该将分类移动到自己', () => {
      const initial = createInitialState()
      const result = moveCategory(initial, 'cat-1', 'cat-1', 'inside')
      expect(result).toEqual(initial)
    })

    it('移动后应该从原父节点的 children 中移除', () => {
      const initial = createInitialState()
      const cat1Before = initial.categories.find((c) => c.id === 'cat-1')
      expect(cat1Before.children).toContain('cat-1-1')
      const result = moveCategory(initial, 'cat-1-1', 'cat-2', 'inside')
      const cat1After = result.categories.find((c) => c.id === 'cat-1')
      expect(cat1After.children).not.toContain('cat-1-1')
      const cat2After = result.categories.find((c) => c.id === 'cat-2')
      expect(cat2After.children).toContain('cat-1-1')
    })

    it('移动到新父节点内部时应该展开新父节点', () => {
      const initial = createInitialState()
      const cat2Before = initial.categories.find((c) => c.id === 'cat-2')
      expect(cat2Before.isExpanded).toBe(false)
      const result = moveCategory(initial, 'cat-1-1', 'cat-2', 'inside')
      const cat2After = result.categories.find((c) => c.id === 'cat-2')
      expect(cat2After.isExpanded).toBe(true)
    })
  })
})

describe('文章操作', () => {
  describe('createArticle', () => {
    it('应该在指定分类下创建新文章', () => {
      const initial = createInitialState()
      const beforeCount = initial.articles.length
      const result = createArticle(initial, 'cat-root', '测试文章')
      expect(result.articles.length).toBe(beforeCount + 1)
      const newArt = result.articles[result.articles.length - 1]
      expect(newArt.title).toBe('测试文章')
      expect(newArt.categoryId).toBe('cat-root')
      expect(newArt.isFavorite).toBe(false)
    })

    it('不指定标题时应该使用默认标题', () => {
      const initial = createInitialState()
      const result = createArticle(initial, 'cat-root')
      const newArt = result.articles[result.articles.length - 1]
      expect(newArt.title).toBe('未命名文章')
      expect(newArt.content).toContain('# 未命名文章')
    })

    it('新文章应该包含创建和更新时间', () => {
      const initial = createInitialState()
      const result = createArticle(initial, 'cat-root', '时间测试')
      const newArt = result.articles[result.articles.length - 1]
      expect(typeof newArt.createdAt).toBe('number')
      expect(typeof newArt.updatedAt).toBe('number')
    })
  })

  describe('updateArticle', () => {
    it('应该正确更新文章字段并更新时间戳', () => {
      const initial = createInitialState()
      const id = initial.articles[0].id
      const oldTime = initial.articles[0].updatedAt
      vi.useFakeTimers().setSystemTime(oldTime + 100000)
      const result = updateArticle(initial, id, { title: '新标题' })
      vi.useRealTimers()
      const updated = result.articles.find((a) => a.id === id)
      expect(updated.title).toBe('新标题')
      expect(updated.updatedAt).toBeGreaterThan(oldTime)
    })

    it('应该可以同时更新多个字段', () => {
      const initial = createInitialState()
      const id = initial.articles[0].id
      const result = updateArticle(initial, id, { title: 'T', content: 'C' })
      const updated = result.articles.find((a) => a.id === id)
      expect(updated.title).toBe('T')
      expect(updated.content).toBe('C')
    })
  })

  describe('deleteArticle', () => {
    it('应该删除指定文章', () => {
      const initial = createInitialState()
      const id = initial.articles[0].id
      const result = deleteArticle(initial, id)
      expect(result.articles.find((a) => a.id === id)).toBeUndefined()
    })

    it('应该同步从收藏和最近浏览中移除', () => {
      let initial = createInitialState()
      const id = initial.articles[0].id
      initial = { ...initial, recent: [id] }
      initial = { ...initial, favorites: [id] }
      const result = deleteArticle(initial, id)
      expect(result.favorites.includes(id)).toBe(false)
      expect(result.recent.includes(id)).toBe(false)
    })
  })

  describe('toggleFavorite', () => {
    it('未收藏时应该添加到收藏夹', () => {
      const initial = createInitialState()
      const nonFavId = initial.articles.find((a) => !a.isFavorite).id
      const result = toggleFavorite(initial, nonFavId)
      expect(result.favorites.includes(nonFavId)).toBe(true)
      expect(result.articles.find((a) => a.id === nonFavId).isFavorite).toBe(true)
    })

    it('已收藏时应该从收藏夹移除', () => {
      const initial = createInitialState()
      const favId = initial.articles.find((a) => a.isFavorite).id
      const result = toggleFavorite(initial, favId)
      expect(result.favorites.includes(favId)).toBe(false)
      expect(result.articles.find((a) => a.id === favId).isFavorite).toBe(false)
    })
  })

  describe('addRecent', () => {
    it('应该将文章添加到最近浏览列表开头', () => {
      const initial = createInitialState()
      const id = initial.articles[0].id
      const result = addRecent(initial, id)
      expect(result.recent[0]).toBe(id)
    })

    it('重复浏览应该移到最前而不是重复添加', () => {
      let initial = createInitialState()
      initial = addRecent(initial, initial.articles[0].id)
      initial = addRecent(initial, initial.articles[1].id)
      initial = addRecent(initial, initial.articles[0].id)
      expect(initial.recent[0]).toBe(initial.articles[0].id)
      expect(initial.recent.filter((id) => id === initial.articles[0].id).length).toBe(1)
    })

    it('应该限制最近浏览记录不超过 RECENT_LIMIT 条', () => {
      let state = createInitialState()
      for (let i = 0; i < RECENT_LIMIT + 10; i++) {
        state = createArticle(state, 'cat-root', `文章 ${i}`)
        const newId = state.articles[state.articles.length - 1].id
        state = addRecent(state, newId)
      }
      expect(state.recent.length).toBe(RECENT_LIMIT)
    })
  })
})

describe('搜索与排序', () => {
  const testArticles = [
    { id: 'a1', title: 'React Hooks 使用指南', content: 'React Hooks 让函数组件更强大', categoryId: 'c1', updatedAt: 100 },
    { id: 'a2', title: 'Vue Composition API', content: 'Vue 3 的新特性', categoryId: 'c2', updatedAt: 200 },
    { id: 'a3', title: 'JavaScript 基础', content: 'JS 的 React 相关内容', categoryId: 'c1', updatedAt: 150 },
  ]

  describe('searchArticles', () => {
    it('应该根据标题匹配搜索', () => {
      const result = searchArticles(testArticles, 'React')
      expect(result.map((a) => a.id).sort()).toEqual(['a1', 'a3'].sort())
    })

    it('应该根据内容匹配搜索', () => {
      const result = searchArticles(testArticles, 'Vue 3')
      expect(result.map((a) => a.id)).toEqual(['a2'])
    })

    it('搜索应该不区分大小写', () => {
      const r1 = searchArticles(testArticles, 'react')
      const r2 = searchArticles(testArticles, 'REACT')
      expect(r1.map((a) => a.id).sort()).toEqual(r2.map((a) => a.id).sort())
    })

    it('空关键词应该返回空数组', () => {
      expect(searchArticles(testArticles, '')).toEqual([])
      expect(searchArticles(testArticles, '   ')).toEqual([])
      expect(searchArticles(testArticles, null)).toEqual([])
      expect(searchArticles(testArticles, undefined)).toEqual([])
    })
  })

  describe('highlightText', () => {
    it('应该用标记包裹匹配的文本', () => {
      const result = highlightText('Hello React World', 'React')
      expect(result).toContain('|||HIGHLIGHT|||')
      expect(result).toContain('|||/HIGHLIGHT|||')
      expect(result).toContain('React')
    })

    it('空关键词应该返回原文本', () => {
      expect(highlightText('test', '')).toBe('test')
      expect(highlightText('test', null)).toBe('test')
    })

    it('应该支持转义特殊正则字符', () => {
      expect(() => highlightText('a.b', '.')).not.toThrow()
    })
  })

  describe('sortArticles', () => {
    const categories = [
      { id: 'c1', name: '前端', parentId: null },
      { id: 'c2', name: '后端', parentId: null },
    ]

    it('应该按更新时间降序排序（默认）', () => {
      const sorted = sortArticles(testArticles, 'time', 'desc')
      expect(sorted.map((a) => a.id)).toEqual(['a2', 'a3', 'a1'])
    })

    it('应该按更新时间升序排序', () => {
      const sorted = sortArticles(testArticles, 'time', 'asc')
      expect(sorted.map((a) => a.id)).toEqual(['a1', 'a3', 'a2'])
    })

    it('应该按标题升序排序', () => {
      const sorted = sortArticles(testArticles, 'title', 'asc', categories)
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].title.localeCompare(sorted[i + 1].title, 'zh-CN') <= 0).toBe(true)
      }
    })

    it('应该按标题倒序排序', () => {
      const sortedAsc = sortArticles(testArticles, 'title', 'asc', categories)
      const sortedDesc = sortArticles(testArticles, 'title', 'desc', categories)
      expect(sortedDesc.map((a) => a.id)).toEqual([...sortedAsc.map((a) => a.id)].reverse())
    })

    it('应该按分类路径升序排序', () => {
      const sorted = sortArticles(testArticles, 'category', 'asc', categories)
      const ids = sorted.map((a) => a.id)
      const c1Idx = ids.indexOf('a1')
      const c2Idx = ids.indexOf('a2')
      expect(c1Idx !== -1).toBe(true)
      expect(c2Idx !== -1).toBe(true)
      expect(sorted[c1Idx].categoryId).toBe('c1')
      expect(sorted[c2Idx].categoryId).toBe('c2')
    })

    it('应该按分类路径倒序排序（与升序首元素分类不同）', () => {
      const sortedAsc = sortArticles(testArticles, 'category', 'asc', categories)
      const sortedDesc = sortArticles(testArticles, 'category', 'desc', categories)
      const ascFirstCat = sortedAsc[0].categoryId
      const descFirstCat = sortedDesc[0].categoryId
      expect(ascFirstCat).not.toBe(descFirstCat)
      expect(sortedDesc[sortedDesc.length - 1].categoryId).toBe(ascFirstCat)
    })
  })
})

describe('Markdown 处理', () => {
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

  describe('extractTOC', () => {
    it('应该从 Markdown 中提取标题并生成 TOC', () => {
      const md = `# H1 标题
## H2 标题
### H3 标题
普通文本
## 另一个 H2`
      const toc = extractTOC(md)
      expect(toc.length).toBe(4)
      expect(toc[0].level).toBe(1)
      expect(toc[0].text).toBe('H1 标题')
      expect(toc[1].level).toBe(2)
      expect(toc[2].level).toBe(3)
      expect(toc[3].text).toBe('另一个 H2')
    })

    it('应该为每个标题生成唯一 slug', () => {
      const md = `# 测试
## 测试
### 测试`
      const toc = extractTOC(md)
      const slugs = toc.map((t) => t.slug)
      expect(new Set(slugs).size).toBe(slugs.length)
    })

    it('代码块中的标题不应该被提取', () => {
      const md = `# 真实标题
\`\`\`
# 代码中的标题
## 也不是标题
\`\`\`
## 真实 H2`
      const toc = extractTOC(md)
      expect(toc.length).toBe(2)
      expect(toc[0].text).toBe('真实标题')
      expect(toc[1].text).toBe('真实 H2')
    })

    it('空内容应该返回空 TOC', () => {
      expect(extractTOC('')).toEqual([])
      expect(extractTOC(null)).toEqual([])
      expect(extractTOC(undefined)).toEqual([])
    })
  })

  describe('markdownToHtml', () => {
    it('应该正确渲染 H1-H6 标题并带 id 属性', () => {
      const html = markdownToHtml('# Hello World\n## Sub Heading')
      expect(html).toContain('<h1 id="hello-world">Hello World</h1>')
      expect(html).toContain('<h2 id="sub-heading">Sub Heading</h2>')
    })

    it('应该正确渲染粗体、斜体、删除线', () => {
      const html = markdownToHtml('**粗体** *斜体* ~~删除线~~')
      expect(html).toContain('<strong>粗体</strong>')
      expect(html).toContain('<em>斜体</em>')
      expect(html).toContain('<del>删除线</del>')
    })

    it('应该正确渲染行内代码', () => {
      const html = markdownToHtml('使用 `console.log` 打印')
      expect(html).toContain('<code>console.log</code>')
    })

    it('应该正确渲染代码块', () => {
      const html = markdownToHtml('```js\nconst x = 1;\n```')
      expect(html).toContain('<pre><code class="language-js">')
      expect(html).toContain('const x = 1;')
      expect(html).toContain('</code></pre>')
    })

    it('代码块中的内容不应该被 Markdown 转换', () => {
      const html = markdownToHtml('```\n**不是粗体**\n# 不是标题\n```')
      expect(html).not.toContain('<strong>')
      expect(html).not.toContain('<h1>')
      expect(html).toContain('**不是粗体**')
      expect(html).toContain('# 不是标题')
    })

    it('应该正确渲染引用块', () => {
      const html = markdownToHtml('> 引用内容')
      expect(html).toContain('<blockquote>引用内容</blockquote>')
    })

    it('应该正确渲染无序列表', () => {
      const html = markdownToHtml('- 项1\n- 项2\n- 项3')
      expect(html).toContain('<ul>')
      expect(html.match(/<li>/g)?.length).toBe(3)
    })

    it('应该正确渲染有序列表', () => {
      const html = markdownToHtml('1. 第一\n2. 第二')
      expect(html).toContain('<ol>')
      expect(html.match(/<li>/g)?.length).toBe(2)
    })

    it('应该正确渲染链接', () => {
      const html = markdownToHtml('[React](https://react.dev)')
      expect(html).toContain('<a')
      expect(html).toContain('href="https://react.dev"')
      expect(html).toContain('target="_blank"')
    })

    it('应该正确渲染图片', () => {
      const html = markdownToHtml('![alt](img.png)')
      expect(html).toContain('<img')
      expect(html).toContain('src="img.png"')
      expect(html).toContain('alt="alt"')
      expect(html).toContain('loading="lazy"')
    })

    it('应该正确渲染水平分割线', () => {
      const html = markdownToHtml('---')
      expect(html).toContain('<hr />')
    })

    it('普通文本应该被 p 标签包裹', () => {
      const html = markdownToHtml('Hello world')
      expect(html).toContain('<p>Hello world</p>')
    })

    it('空内容应该返回空字符串', () => {
      expect(markdownToHtml('')).toBe('')
      expect(markdownToHtml(null)).toBe('')
      expect(markdownToHtml(undefined)).toBe('')
    })

    it('相同标题应该生成不同的 id', () => {
      const html = markdownToHtml('# 测试\n## 测试')
      expect(html).toContain('id="测试"')
      expect(html).toContain('id="测试-1"')
    })
  })
})
