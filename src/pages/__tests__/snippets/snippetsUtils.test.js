import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import {
  LANGUAGES,
  LANGUAGE_LABELS,
  highlightCode,
  escapeRegExp,
  highlightSearchTerm,
  generateSnippetId,
  createSnippet,
  loadSnippets,
  saveSnippets,
  addSnippet,
  updateSnippet,
  deleteSnippet,
  toggleFavorite,
  getAllLanguages,
  filterSnippets,
  sortSnippets,
  snippetsToJson,
  jsonToSnippets,
  mergeSnippets,
  formatDate,
  renderMarkdown,
  copyToClipboard,
  downloadJsonFile,
} from '@/pages/snippets/snippetsUtils'

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

function createMockDocument() {
  let bodyChildren = []
  return {
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        href: '',
        download: '',
        click: vi.fn(),
      }
      return el
    },
    body: {
      appendChild: (el) => {
        bodyChildren.push(el)
      },
      removeChild: (el) => {
        bodyChildren = bodyChildren.filter((c) => c !== el)
      },
      get children() {
        return bodyChildren
      },
    },
  }
}

function createMockURL() {
  return {
    createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
    revokeObjectURL: vi.fn(),
  }
}

const originalLocalStorage = globalThis.localStorage
let originalDocument
let originalURL

beforeAll(() => {
  originalDocument = globalThis.document
  originalURL = globalThis.URL
  if (!globalThis.document) {
    globalThis.document = createMockDocument()
  }
  if (!globalThis.URL) {
    globalThis.URL = createMockURL()
  } else if (!globalThis.URL.createObjectURL) {
    globalThis.URL = { ...globalThis.URL, ...createMockURL() }
  }
})

afterAll(() => {
  if (originalDocument !== undefined) {
    globalThis.document = originalDocument
  } else {
    delete globalThis.document
  }
  if (originalURL !== undefined) {
    globalThis.URL = originalURL
  } else {
    delete globalThis.URL
  }
})

beforeEach(() => {
  globalThis.localStorage = createMockLocalStorage()
})

afterEach(() => {
  if (originalLocalStorage) {
    globalThis.localStorage = originalLocalStorage
  } else {
    delete globalThis.localStorage
  }
})

function makeTestSnippets() {
  const now = 1700000000000
  const day = 24 * 60 * 60 * 1000
  return [
    {
      id: 's1',
      title: 'Array 去重',
      language: LANGUAGES.JAVASCRIPT,
      code: `function unique(arr) {\n  return [...new Set(arr)]\n}`,
      notes: '使用 Set 实现数组去重',
      favorite: true,
      createdAt: now - day * 3,
      updatedAt: now - day * 3,
    },
    {
      id: 's2',
      title: '防抖函数',
      language: LANGUAGES.TYPESCRIPT,
      code: `function debounce(fn, delay) {\n  let timer = null\n  return (...args) => {\n    if (timer) clearTimeout(timer)\n    timer = setTimeout(() => fn(...args), delay)\n  }\n}`,
      notes: 'TypeScript 防抖函数',
      favorite: false,
      createdAt: now - day * 2,
      updatedAt: now - day * 2,
    },
    {
      id: 's3',
      title: '斐波那契数列',
      language: LANGUAGES.PYTHON,
      code: `def fibonacci(n):\n    a, b = 0, 1\n    result = []\n    for _ in range(n):\n        result.append(a)\n        a, b = b, a + b\n    return result`,
      notes: '经典的斐波那契数列',
      favorite: true,
      createdAt: now - day,
      updatedAt: now - day,
    },
    {
      id: 's4',
      title: 'Flex 居中布局',
      language: LANGUAGES.CSS,
      code: `.center {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}`,
      notes: '常用 Flex 布局',
      favorite: false,
      createdAt: now - 3600000,
      updatedAt: now - 3600000,
    },
    {
      id: 's5',
      title: '响应式表单',
      language: LANGUAGES.HTML,
      code: `<form>\n  <input type="text" />\n  <button type="submit">提交</button>\n</form>`,
      notes: '基础 HTML 表单',
      favorite: false,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

describe('LANGUAGES and LANGUAGE_LABELS', () => {
  it('定义了所有支持的语言', () => {
    expect(LANGUAGES.JAVASCRIPT).toBe('javascript')
    expect(LANGUAGES.TYPESCRIPT).toBe('typescript')
    expect(LANGUAGES.PYTHON).toBe('python')
    expect(LANGUAGES.CSS).toBe('css')
    expect(LANGUAGES.HTML).toBe('html')
  })

  it('语言标签正确映射', () => {
    expect(LANGUAGE_LABELS[LANGUAGES.JAVASCRIPT]).toBe('JavaScript')
    expect(LANGUAGE_LABELS[LANGUAGES.TYPESCRIPT]).toBe('TypeScript')
    expect(LANGUAGE_LABELS[LANGUAGES.PYTHON]).toBe('Python')
    expect(LANGUAGE_LABELS[LANGUAGES.CSS]).toBe('CSS')
    expect(LANGUAGE_LABELS[LANGUAGES.HTML]).toBe('HTML')
  })
})

describe('highlightCode', () => {
  it('空代码返回空字符串', () => {
    expect(highlightCode('', LANGUAGES.JAVASCRIPT)).toBe('')
    expect(highlightCode(null, LANGUAGES.JAVASCRIPT)).toBe('')
    expect(highlightCode(undefined, LANGUAGES.JAVASCRIPT)).toBe('')
  })

  it('对 JavaScript 代码进行语法高亮', () => {
    const code = 'const x = 1\n// comment\nlet str = "hello"'
    const result = highlightCode(code, LANGUAGES.JAVASCRIPT)
    expect(result).toContain('hl-keyword')
    expect(result).toContain('hl-comment')
    expect(result).toContain('hl-string')
    expect(result).toContain('hl-number')
  })

  it('对 TypeScript 代码进行语法高亮', () => {
    const code = 'const x: number = 1\n// comment'
    const result = highlightCode(code, LANGUAGES.TYPESCRIPT)
    expect(result).toContain('hl-keyword')
    expect(result).toContain('hl-comment')
  })

  it('对 Python 代码进行语法高亮', () => {
    const code = 'def foo():\n    # comment\n    return "hello"'
    const result = highlightCode(code, LANGUAGES.PYTHON)
    expect(result).toContain('hl-keyword')
    expect(result).toContain('hl-comment')
    expect(result).toContain('hl-string')
  })

  it('对 CSS 代码进行语法高亮', () => {
    const code = `.box {\n  color: #ff0000;\n  width: 100px;\n  /* comment */\n}`
    const result = highlightCode(code, LANGUAGES.CSS)
    expect(result).toContain('hl-keyword')
    expect(result).toContain('hl-comment')
    expect(result).toContain('hl-string')
    expect(result).toContain('hl-number')
  })

  it('对 HTML 代码进行语法高亮', () => {
    const code = '<!-- comment -->\n<div class="test">hello</div>'
    const result = highlightCode(code, LANGUAGES.HTML)
    expect(result).toContain('hl-keyword')
    expect(result).toContain('hl-comment')
    expect(result).toContain('hl-string')
  })

  it('转义 HTML 特殊字符', () => {
    const code = '<script>alert("xss")</script>'
    const result = highlightCode(code, LANGUAGES.JAVASCRIPT)
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
    expect(result).not.toContain('<script>')
  })

  it('保留换行符', () => {
    const code = 'line1\nline2\nline3'
    const result = highlightCode(code, LANGUAGES.JAVASCRIPT)
    expect(result.split('\n').length).toBe(3)
  })
})

describe('escapeRegExp', () => {
  it('转义正则特殊字符', () => {
    expect(escapeRegExp('a.b*c?d+e^f$g[h]i(j)k|l{m}n')).toBe(
      'a\\.b\\*c\\?d\\+e\\^f\\$g\\[h\\]i\\(j\\)k\\|l\\{m\\}n'
    )
  })

  it('空字符串返回空', () => {
    expect(escapeRegExp('')).toBe('')
  })
})

describe('highlightSearchTerm', () => {
  it('高亮搜索词', () => {
    const result = highlightSearchTerm('Hello World', 'hello')
    expect(result).toContain('<mark')
    expect(result).toContain('hl-search')
    expect(result).toContain('Hello')
  })

  it('搜索词不区分大小写', () => {
    const r1 = highlightSearchTerm('Test Code', 'test')
    const r2 = highlightSearchTerm('Test Code', 'TEST')
    expect(r1).toContain('<mark')
    expect(r2).toContain('<mark')
  })

  it('空搜索词不做修改', () => {
    expect(highlightSearchTerm('test', '')).toBe('test')
    expect(highlightSearchTerm('test', null)).toBe('test')
    expect(highlightSearchTerm('test', undefined)).toBe('test')
  })

  it('空文本返回原输入', () => {
    expect(highlightSearchTerm('', 'test')).toBe('')
    expect(highlightSearchTerm(null, 'test')).toBe(null)
    expect(highlightSearchTerm(undefined, 'test')).toBe(undefined)
  })

  it('搜索词包含特殊正则字符时正常工作', () => {
    const result = highlightSearchTerm('a.b', 'a.b')
    expect(result).toContain('<mark')
  })
})

describe('generateSnippetId', () => {
  it('生成非空字符串 ID', () => {
    const id = generateSnippetId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(id.startsWith('snippet-')).toBe(true)
  })

  it('生成的 ID 不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateSnippetId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('createSnippet', () => {
  it('创建新的代码片段', () => {
    const snippet = createSnippet({
      title: '测试片段',
      language: LANGUAGES.JAVASCRIPT,
      code: 'console.log("hello")',
      notes: '这是备注',
    })
    expect(snippet.id).toBeTruthy()
    expect(snippet.title).toBe('测试片段')
    expect(snippet.language).toBe(LANGUAGES.JAVASCRIPT)
    expect(snippet.code).toBe('console.log("hello")')
    expect(snippet.notes).toBe('这是备注')
    expect(snippet.favorite).toBe(false)
    expect(typeof snippet.createdAt).toBe('number')
    expect(typeof snippet.updatedAt).toBe('number')
  })

  it('使用默认值', () => {
    const snippet = createSnippet({})
    expect(snippet.title).toBe('未命名片段')
    expect(snippet.language).toBe(LANGUAGES.JAVASCRIPT)
    expect(snippet.code).toBe('')
    expect(snippet.notes).toBe('')
  })
})

describe('loadSnippets and saveSnippets', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveSnippets 将数据存入 localStorage', () => {
    const snippets = [{ id: 'a', title: 'test' }]
    saveSnippets(snippets)
    const raw = localStorage.getItem('code-snippets-data')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw)).toEqual(snippets)
  })

  it('saveSnippets 异常时不报错', () => {
    const originalSetItem = localStorage.setItem
    localStorage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    expect(() => saveSnippets([{ id: 'a' }])).not.toThrow()
    localStorage.setItem = originalSetItem
  })

  it('loadSnippets localStorage 为空时返回初始化数据', () => {
    expect(localStorage.getItem('code-snippets-data')).toBeNull()
    const result = loadSnippets()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    const saved = localStorage.getItem('code-snippets-data')
    expect(saved).toBeTruthy()
    expect(JSON.parse(saved)).toEqual(result)
  })

  it('loadSnippets localStorage 有合法数组时直接返回', () => {
    const mockItems = [
      { id: 'custom-1', title: '自定义', language: 'javascript', code: '' },
    ]
    localStorage.setItem('code-snippets-data', JSON.stringify(mockItems))
    const result = loadSnippets()
    expect(result).toEqual(mockItems)
  })

  it('loadSnippets localStorage 有非数组值时回退到初始化数据', () => {
    localStorage.setItem('code-snippets-data', JSON.stringify({ not: 'an array' }))
    const result = loadSnippets()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('loadSnippets localStorage JSON 非法时回退到初始化数据', () => {
    localStorage.setItem('code-snippets-data', 'invalid json {{{')
    const result = loadSnippets()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('loadSnippets localStorage.getItem 异常时回退到初始化数据', () => {
    const originalGetItem = localStorage.getItem
    localStorage.getItem = () => {
      throw new Error('SecurityError')
    }
    const result = loadSnippets()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    localStorage.getItem = originalGetItem
  })
})

describe('addSnippet', () => {
  it('添加新片段到列表末尾', () => {
    const items = makeTestSnippets()
    const newItem = createSnippet({ title: '新片段', code: 'test' })
    const result = addSnippet(items, newItem)
    expect(result.length).toBe(items.length + 1)
    expect(result[result.length - 1].id).toBe(newItem.id)
  })

  it('不修改原始数组', () => {
    const items = makeTestSnippets()
    const originalLength = items.length
    const newItem = createSnippet({ title: '新', code: 'test' })
    addSnippet(items, newItem)
    expect(items.length).toBe(originalLength)
  })
})

describe('updateSnippet', () => {
  it('更新指定 ID 的片段', () => {
    const items = makeTestSnippets()
    const result = updateSnippet(items, 's1', { title: '新标题' })
    expect(result.find((s) => s.id === 's1').title).toBe('新标题')
  })

  it('更新 updatedAt 时间戳', () => {
    const items = makeTestSnippets()
    const originalUpdatedAt = items.find((s) => s.id === 's1').updatedAt
    const result = updateSnippet(items, 's1', { code: 'new code' })
    expect(result.find((s) => s.id === 's1').updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
  })

  it('不修改其他片段', () => {
    const items = makeTestSnippets()
    const result = updateSnippet(items, 's1', { title: '新标题' })
    expect(result.find((s) => s.id === 's2').title).toBe('防抖函数')
  })

  it('不修改原始数组', () => {
    const items = makeTestSnippets()
    updateSnippet(items, 's1', { title: '新标题' })
    expect(items.find((s) => s.id === 's1').title).toBe('Array 去重')
  })
})

describe('deleteSnippet', () => {
  it('删除指定 ID 的片段', () => {
    const items = makeTestSnippets()
    const result = deleteSnippet(items, 's1')
    expect(result.find((s) => s.id === 's1')).toBeUndefined()
    expect(result.length).toBe(items.length - 1)
  })

  it('不修改原始数组', () => {
    const items = makeTestSnippets()
    deleteSnippet(items, 's1')
    expect(items.find((s) => s.id === 's1')).toBeDefined()
    expect(items.length).toBe(5)
  })
})

describe('toggleFavorite', () => {
  it('切换收藏状态（已收藏 -> 未收藏）', () => {
    const items = makeTestSnippets()
    const result = toggleFavorite(items, 's1')
    expect(result.find((s) => s.id === 's1').favorite).toBe(false)
  })

  it('切换收藏状态（未收藏 -> 已收藏）', () => {
    const items = makeTestSnippets()
    const result = toggleFavorite(items, 's2')
    expect(result.find((s) => s.id === 's2').favorite).toBe(true)
  })

  it('更新 updatedAt', () => {
    const items = makeTestSnippets()
    const originalUpdatedAt = items.find((s) => s.id === 's1').updatedAt
    const result = toggleFavorite(items, 's1')
    expect(result.find((s) => s.id === 's1').updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
  })

  it('不修改其他项', () => {
    const items = makeTestSnippets()
    const result = toggleFavorite(items, 's1')
    expect(result.find((s) => s.id === 's2').favorite).toBe(false)
  })

  it('不修改原始数组', () => {
    const items = makeTestSnippets()
    toggleFavorite(items, 's1')
    expect(items.find((s) => s.id === 's1').favorite).toBe(true)
  })
})

describe('getAllLanguages', () => {
  it('收集所有不重复的语言', () => {
    const items = makeTestSnippets()
    const langs = getAllLanguages(items)
    expect(langs).toContain(LANGUAGES.JAVASCRIPT)
    expect(langs).toContain(LANGUAGES.TYPESCRIPT)
    expect(langs).toContain(LANGUAGES.PYTHON)
    expect(langs).toContain(LANGUAGES.CSS)
    expect(langs).toContain(LANGUAGES.HTML)
  })

  it('按预设顺序排序', () => {
    const items = [
      { id: 'a', language: LANGUAGES.HTML },
      { id: 'b', language: LANGUAGES.JAVASCRIPT },
      { id: 'c', language: LANGUAGES.PYTHON },
    ]
    const langs = getAllLanguages(items)
    expect(langs.indexOf(LANGUAGES.JAVASCRIPT)).toBeLessThan(langs.indexOf(LANGUAGES.PYTHON))
    expect(langs.indexOf(LANGUAGES.PYTHON)).toBeLessThan(langs.indexOf(LANGUAGES.HTML))
  })

  it('空数组返回空', () => {
    expect(getAllLanguages([])).toEqual([])
  })
})

describe('filterSnippets', () => {
  it('无筛选条件返回全部', () => {
    const items = makeTestSnippets()
    const result = filterSnippets(items)
    expect(result).toHaveLength(items.length)
  })

  it('按语言筛选', () => {
    const items = makeTestSnippets()
    const result = filterSnippets(items, { language: LANGUAGES.JAVASCRIPT })
    expect(result.every((s) => s.language === LANGUAGES.JAVASCRIPT)).toBe(true)
    expect(result.length).toBe(1)
  })

  it('按收藏筛选', () => {
    const items = makeTestSnippets()
    const result = filterSnippets(items, { favoriteOnly: true })
    expect(result.every((s) => s.favorite)).toBe(true)
    expect(result.length).toBe(2)
  })

  it('按搜索词筛选（匹配标题）', () => {
    const items = makeTestSnippets()
    const result = filterSnippets(items, { searchTerm: '去重' })
    expect(result.map((s) => s.id)).toEqual(['s1'])
  })

  it('按搜索词筛选（匹配代码内容）', () => {
    const items = makeTestSnippets()
    const result = filterSnippets(items, { searchTerm: 'Set' })
    expect(result.map((s) => s.id)).toContain('s1')
  })

  it('按搜索词筛选（匹配备注）', () => {
    const items = makeTestSnippets()
    const result = filterSnippets(items, { searchTerm: '经典' })
    expect(result.map((s) => s.id)).toEqual(['s3'])
  })

  it('搜索词不区分大小写', () => {
    const items = makeTestSnippets()
    const r1 = filterSnippets(items, { searchTerm: 'FIBONACCI' })
    const r2 = filterSnippets(items, { searchTerm: 'fibonacci' })
    expect(r1.length).toBe(r2.length)
  })

  it('组合筛选条件（AND 关系）', () => {
    const items = makeTestSnippets()
    const result = filterSnippets(items, { language: LANGUAGES.JAVASCRIPT, favoriteOnly: true })
    expect(result.every((s) => s.language === LANGUAGES.JAVASCRIPT && s.favorite)).toBe(true)
    expect(result.map((s) => s.id)).toEqual(['s1'])
  })

  it('不修改原始数据', () => {
    const items = makeTestSnippets()
    const originalIds = items.map((i) => i.id)
    filterSnippets(items, { favoriteOnly: true })
    expect(items.map((i) => i.id)).toEqual(originalIds)
  })
})

describe('sortSnippets', () => {
  it('收藏的片段优先显示', () => {
    const items = makeTestSnippets()
    const sorted = sortSnippets(items)
    const firstFavoriteIdx = sorted.findIndex((s) => s.favorite)
    const firstNotFavoriteIdx = sorted.findIndex((s) => !s.favorite)
    expect(firstFavoriteIdx).toBeLessThan(firstNotFavoriteIdx)
  })

  it('按创建时间降序（默认）', () => {
    const items = makeTestSnippets().filter((s) => !s.favorite)
    const sorted = sortSnippets(items)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].createdAt >= sorted[i].createdAt).toBe(true)
    }
  })

  it('按创建时间升序', () => {
    const items = makeTestSnippets().filter((s) => !s.favorite)
    const sorted = sortSnippets(items, 'createdAt', 'asc')
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].createdAt <= sorted[i].createdAt).toBe(true)
    }
  })

  it('按名称升序', () => {
    const items = makeTestSnippets().filter((s) => !s.favorite)
    const sorted = sortSnippets(items, 'title', 'asc')
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].title <= sorted[i].title).toBe(true)
    }
  })

  it('按名称降序', () => {
    const items = makeTestSnippets().filter((s) => !s.favorite)
    const sorted = sortSnippets(items, 'title', 'desc')
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].title >= sorted[i].title).toBe(true)
    }
  })

  it('不修改原始数组', () => {
    const items = makeTestSnippets()
    const originalOrder = items.map((i) => i.id)
    sortSnippets(items, 'title', 'asc')
    expect(items.map((i) => i.id)).toEqual(originalOrder)
  })
})

describe('snippetsToJson and jsonToSnippets', () => {
  it('snippetsToJson 序列化数组为格式化 JSON 字符串', () => {
    const items = makeTestSnippets().slice(0, 2)
    const json = snippetsToJson(items)
    expect(typeof json).toBe('string')
    expect(JSON.parse(json)).toEqual(items)
    expect(json).toContain('\n')
  })

  it('jsonToSnippets 解析 JSON 并规范化字段', () => {
    const json = JSON.stringify([
      { id: 'a', title: 'test', language: 'javascript', code: 'x' },
      { code: 'only code' },
    ])
    const result = jsonToSnippets(json)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(2)
    expect(result[0].title).toBe('test')
    expect(result[1].title).toBe('未命名片段')
    expect(result[1].id).toBeTruthy()
    expect(typeof result[1].createdAt).toBe('number')
    expect(result[1].favorite).toBe(false)
  })

  it('jsonToSnippets 遇到非数组抛出错误', () => {
    expect(() => jsonToSnippets('{"not": "array"}')).toThrow()
  })

  it('往返转换数据一致', () => {
    const items = makeTestSnippets()
    const json = snippetsToJson(items)
    const parsed = jsonToSnippets(json)
    expect(parsed).toEqual(items)
  })
})

describe('mergeSnippets', () => {
  it('合并模式：保留现有数据，添加新项', () => {
    const existing = [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
    ]
    const imported = [
      { id: 'b', title: 'B-Updated' },
      { id: 'c', title: 'C' },
    ]
    const result = mergeSnippets(existing, imported, false)
    expect(result.length).toBe(3)
    expect(result.find((s) => s.id === 'a').title).toBe('A')
    expect(result.find((s) => s.id === 'b').title).toBe('B')
    expect(result.find((s) => s.id === 'c').title).toBe('C')
  })

  it('覆盖模式：完全替换现有数据', () => {
    const existing = [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
    ]
    const imported = [
      { id: 'c', title: 'C' },
    ]
    const result = mergeSnippets(existing, imported, true)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('c')
  })

  it('不修改原始数组', () => {
    const existing = [{ id: 'a', title: 'A' }]
    const imported = [{ id: 'b', title: 'B' }]
    mergeSnippets(existing, imported, false)
    expect(existing.length).toBe(1)
  })
})

describe('formatDate', () => {
  it('格式化时间戳为 YYYY-MM-DD HH:mm', () => {
    const ts = new Date('2024-01-15T09:30:00').getTime()
    const result = formatDate(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(result).toContain('2024')
    expect(result).toContain('01')
    expect(result).toContain('15')
  })

  it('null/undefined 返回 -', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
  })

  it('无效时间戳返回 -', () => {
    expect(formatDate('invalid')).toBe('-')
    expect(formatDate(0)).not.toBe('-')
  })
})

describe('sortSnippets - 空标题排序', () => {
  it('空标题在升序时排在末尾', () => {
    const items = [
      { id: 'a', title: 'Banana', favorite: false },
      { id: 'b', title: '', favorite: false },
      { id: 'c', title: 'Apple', favorite: false },
    ]
    const sorted = sortSnippets(items, 'title', 'asc')
    const ids = sorted.map((s) => s.id)
    expect(ids.indexOf('c')).toBeLessThan(ids.indexOf('a'))
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'))
  })

  it('空标题在降序时排在末尾', () => {
    const items = [
      { id: 'a', title: 'Banana', favorite: false },
      { id: 'b', title: '', favorite: false },
      { id: 'c', title: 'Apple', favorite: false },
    ]
    const sorted = sortSnippets(items, 'title', 'desc')
    const ids = sorted.map((s) => s.id)
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('c'))
    expect(ids.indexOf('c')).toBeLessThan(ids.indexOf('b'))
  })

  it('全是空白标题时顺序保持稳定，空标题排在末尾', () => {
    const items = [
      { id: 'a', title: '   ', favorite: false, createdAt: 2 },
      { id: 'b', title: 'Normal', favorite: false, createdAt: 1 },
      { id: 'c', title: '', favorite: false, createdAt: 3 },
      { id: 'd', title: 'Apple', favorite: false, createdAt: 4 },
    ]
    const sorted = sortSnippets(items, 'title', 'asc')
    const ids = sorted.map((s) => s.id)
    expect(ids.indexOf('d')).toBeLessThan(ids.indexOf('b'))
    expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('a'))
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('c'))
    expect(sorted).toHaveLength(4)
  })

  it('混合空标题和非空标题，空标题始终排末尾（降序）', () => {
    const items = [
      { id: 'a', title: 'Banana', favorite: false },
      { id: 'b', title: '   ', favorite: false },
      { id: 'c', title: 'Apple', favorite: false },
      { id: 'd', title: '', favorite: false },
    ]
    const sorted = sortSnippets(items, 'title', 'desc')
    const ids = sorted.map((s) => s.id)
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('c'))
    expect(ids.indexOf('c')).toBeLessThan(ids.indexOf('b'))
    expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('d'))
  })
})

describe('renderMarkdown', () => {
  it('空字符串返回空字符串', () => {
    expect(renderMarkdown('')).toBe('')
    expect(renderMarkdown(null)).toBe('')
    expect(renderMarkdown(undefined)).toBe('')
  })

  it('转换标题语法', () => {
    expect(renderMarkdown('# H1')).toContain('<h1>')
    expect(renderMarkdown('## H2')).toContain('<h2>')
    expect(renderMarkdown('### H3')).toContain('<h3>')
    expect(renderMarkdown('#### H4')).toContain('<h4>')
    expect(renderMarkdown('##### H5')).toContain('<h5>')
    expect(renderMarkdown('###### H6')).toContain('<h6>')
  })

  it('转换粗体和斜体', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>')
    expect(renderMarkdown('*italic*')).toContain('<em>italic</em>')
    expect(renderMarkdown('***both***')).toContain('<strong><em>both</em></strong>')
  })

  it('转换行内代码', () => {
    expect(renderMarkdown('`code`')).toContain('<code>code</code>')
  })

  it('转换链接', () => {
    const result = renderMarkdown('[link](https://example.com)')
    expect(result).toContain('<a href="https://example.com"')
    expect(result).toContain('rel="noopener noreferrer"')
    expect(result).toContain('>link</a>')
  })

  it('转换无序列表', () => {
    const md = '- item1\n- item2\n- item3'
    const result = renderMarkdown(md)
    expect(result).toContain('<ul>')
    expect(result).not.toContain('<ol>')
    expect(result.match(/<li>/g)?.length).toBe(3)
  })

  it('转换有序列表', () => {
    const md = '1. first\n2. second'
    const result = renderMarkdown(md)
    expect(result).toContain('<ol>')
    expect(result).not.toContain('<ul>')
    expect(result.match(/<li>/g)?.length).toBe(2)
  })

  it('混合无序列表和有序列表互不干扰', () => {
    const md = '- unordered1\n- unordered2\n1. ordered1\n2. ordered2\n- more-unordered'
    const result = renderMarkdown(md)
    const ulCount = (result.match(/<ul>/g) || []).length
    const olCount = (result.match(/<ol>/g) || []).length
    expect(ulCount).toBe(2)
    expect(olCount).toBe(1)
    expect(result).not.toMatch(/<ol>[\s\S]*?<ul>[\s\S]*?<\/ul>[\s\S]*?<\/ol>/)
  })

  it('转换引用', () => {
    expect(renderMarkdown('> quote')).toContain('<blockquote>')
  })

  it('转换分隔线', () => {
    expect(renderMarkdown('---')).toContain('<hr />')
  })

  it('转换换行', () => {
    expect(renderMarkdown('line1\nline2')).toContain('<br />')
  })

  it('支持复合 Markdown', () => {
    const md = '# Title\n\n**bold** text with `code`'
    const result = renderMarkdown(md)
    expect(result).toContain('<h1>Title</h1>')
    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('<code>code</code>')
  })

  it('HTML 转义 - script 标签被转义', () => {
    const md = '<script>alert("xss")</script>'
    const result = renderMarkdown(md)
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('HTML 转义 - img onerror 事件被转义', () => {
    const md = '<img src="x" onerror="alert(1)" />'
    const result = renderMarkdown(md)
    expect(result).not.toContain('<img')
    expect(result).toContain('&lt;img')
    expect(result).not.toContain('onerror="alert(1)"')
  })

  it('HTML 转义 - 任意 HTML 标签被转义', () => {
    const md = '<div onclick="steal()">text</div>'
    const result = renderMarkdown(md)
    expect(result).not.toContain('<div')
    expect(result).toContain('&lt;div')
    expect(result).not.toContain('onclick="steal()"')
  })

  it('链接协议过滤 - javascript: 协议被拒绝', () => {
    const md = '[click](javascript:alert(1))'
    const result = renderMarkdown(md)
    expect(result).toContain('href="#"')
    expect(result).not.toContain('javascript:')
  })

  it('链接协议过滤 - data: 协议被拒绝', () => {
    const md = '[click](data:text/html,<script>alert(1)</script>)'
    const result = renderMarkdown(md)
    expect(result).toContain('href="#"')
    expect(result).not.toContain('data:')
  })

  it('链接协议过滤 - vbscript: 协议被拒绝', () => {
    const md = '[click](vbscript:msgbox(1))'
    const result = renderMarkdown(md)
    expect(result).toContain('href="#"')
    expect(result).not.toContain('vbscript:')
  })

  it('链接协议过滤 - http 和 https 允许', () => {
    const httpResult = renderMarkdown('[a](http://example.com)')
    expect(httpResult).toContain('href="http://example.com"')
    const httpsResult = renderMarkdown('[a](https://example.com)')
    expect(httpsResult).toContain('href="https://example.com"')
  })

  it('链接协议过滤 - mailto 和 tel 允许', () => {
    const mailtoResult = renderMarkdown('[email](mailto:test@example.com)')
    expect(mailtoResult).toContain('href="mailto:test@example.com"')
    const telResult = renderMarkdown('[call](tel:+1234567890)')
    expect(telResult).toContain('href="tel:+1234567890"')
  })

  it('链接协议过滤 - 相对路径和锚点允许', () => {
    const relativeResult = renderMarkdown('[a](./path/to/file)')
    expect(relativeResult).toContain('href="./path/to/file"')
    const anchorResult = renderMarkdown('[a](#section)')
    expect(anchorResult).toContain('href="#section"')
  })

  it('URL 无二次转义 - URL 中特殊字符只被转义一次', () => {
    const md = '[link](https://example.com?q=<x>&y="z")'
    const result = renderMarkdown(md)
    expect(result).toContain('href="https://example.com?q=&lt;x&gt;&amp;y=&quot;z&quot;"')
    expect(result).not.toContain('&amp;lt;')
    expect(result).not.toContain('&amp;amp;')
  })

  it('URL 无二次转义 - URL 在列表项中也只转义一次', () => {
    const md = '- [link](https://example.com?a=<b>)'
    const result = renderMarkdown(md)
    expect(result).toContain('href="https://example.com?a=&lt;b&gt;"')
    expect(result).not.toContain('&amp;lt;')
  })

  it('URL 无二次转义 - URL 在标题中也只转义一次', () => {
    const md = '# Title [link](https://example.com?c=<d>)'
    const result = renderMarkdown(md)
    expect(result).toContain('href="https://example.com?c=&lt;d&gt;"')
    expect(result).not.toContain('&amp;lt;')
  })

  it('XSS - 链接文本中的 HTML 也被转义', () => {
    const md = '[<img src=x onerror=alert(1)>](https://example.com)'
    const result = renderMarkdown(md)
    expect(result).not.toContain('<img')
    expect(result).toContain('&lt;img')
    expect(result).toContain('&gt;')
  })

  it('XSS - 代码块中的 HTML 被转义', () => {
    const md = '`<script>alert(1)</script>`'
    const result = renderMarkdown(md)
    expect(result).toContain('<code>')
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('XSS - 标题中的 HTML 被转义', () => {
    const md = '# <svg onload=alert(1)>'
    const result = renderMarkdown(md)
    expect(result).toContain('<h1>')
    expect(result).not.toContain('<svg')
    expect(result).toContain('&lt;svg')
  })
})

describe('copyToClipboard', () => {
  const originalClipboard = globalThis.navigator?.clipboard

  beforeEach(() => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(globalThis.navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      })
    } else {
      delete globalThis.navigator.clipboard
    }
    vi.restoreAllMocks()
  })

  it('调用 navigator.clipboard.writeText 并返回 Promise', async () => {
    const result = copyToClipboard('hello world')
    expect(result).toBeInstanceOf(Promise)
    await result
    expect(globalThis.navigator.clipboard.writeText).toHaveBeenCalledWith('hello world')
  })

  it('传递空字符串时也正常调用', async () => {
    await copyToClipboard('')
    expect(globalThis.navigator.clipboard.writeText).toHaveBeenCalledWith('')
  })

  it('传递特殊字符时正常调用', async () => {
    const text = '<script>alert("xss")</script>\nnewline\t\ttab'
    await copyToClipboard(text)
    expect(globalThis.navigator.clipboard.writeText).toHaveBeenCalledWith(text)
  })

  it('当 clipboard.writeText 失败时 Promise reject', async () => {
    const mockError = new Error('Clipboard access denied')
    globalThis.navigator.clipboard.writeText.mockRejectedValue(mockError)
    await expect(copyToClipboard('test')).rejects.toThrow('Clipboard access denied')
  })
})

describe('downloadJsonFile', () => {
  let mockCreateObjectURL
  let mockRevokeObjectURL
  let mockCreateElement
  let mockAppendChild
  let mockRemoveChild
  let mockClick

  beforeEach(() => {
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    mockRevokeObjectURL = vi.fn()
    globalThis.URL.createObjectURL = mockCreateObjectURL
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL

    mockClick = vi.fn()
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    }
    mockCreateElement = vi.fn().mockReturnValue(mockAnchor)
    mockAppendChild = vi.fn()
    mockRemoveChild = vi.fn()

    document.createElement = mockCreateElement
    document.body.appendChild = mockAppendChild
    document.body.removeChild = mockRemoveChild
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('创建 Blob 并触发下载', () => {
    downloadJsonFile('{"key":"value"}', 'test.json')

    expect(mockCreateObjectURL).toHaveBeenCalled()
    const blobArg = mockCreateObjectURL.mock.calls[0][0]
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg.type).toBe('application/json')

    expect(mockCreateElement).toHaveBeenCalledWith('a')
    expect(mockAppendChild).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(mockRemoveChild).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('设置正确的 href 和 download 属性', () => {
    let anchor
    mockCreateElement.mockImplementation((tag) => {
      const el = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      if (tag === 'a') anchor = el
      return el
    })

    downloadJsonFile('[]', 'snippets.json')

    expect(anchor.href).toBe('blob:mock-url')
    expect(anchor.download).toBe('snippets.json')
  })

  it('支持复杂 JSON 内容', () => {
    const complexJson = JSON.stringify({ items: [1, 2, 3], meta: { nested: true } }, null, 2)
    downloadJsonFile(complexJson, 'export.json')
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
    expect(mockClick).toHaveBeenCalledTimes(1)
  })
})
