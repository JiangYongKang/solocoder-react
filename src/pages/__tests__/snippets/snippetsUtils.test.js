import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

const originalLocalStorage = globalThis.localStorage

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
