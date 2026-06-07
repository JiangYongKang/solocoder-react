import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  STORAGE_KEY,
  HISTORY_LIMIT,
  INPUT_MERGE_DELAY,
  DEFAULT_CONTENT,
  IMAGE_URL_REGEX,
  createHistory,
  createHistoryState,
  pushHistory,
  undoHistory,
  redoHistory,
  canUndo,
  canRedo,
  getHistoryContent,
  getHistoryCursor,
  saveToStorage,
  loadFromStorage,
  clearStorage,
  escapeHtml,
  markdownToHtml,
  wrapText,
  wrapLinePrefix,
  insertImage,
  insertLink,
  wrapCodeBlock,
  isValidUrl,
  isImageUrl,
  detectPastedContent,
  fileToBase64,
} from '../../rich-editor/editorUtils'

describe('常量定义', () => {
  it('应该定义正确的 STORAGE_KEY', () => {
    expect(STORAGE_KEY).toBe('solocoder-rich-editor-content')
  })

  it('应该定义 HISTORY_LIMIT 为 100', () => {
    expect(HISTORY_LIMIT).toBe(100)
  })

  it('应该定义 INPUT_MERGE_DELAY 为合理值', () => {
    expect(typeof INPUT_MERGE_DELAY).toBe('number')
    expect(INPUT_MERGE_DELAY).toBeGreaterThan(0)
  })

  it('DEFAULT_CONTENT 应该是合理的 Markdown 内容', () => {
    expect(typeof DEFAULT_CONTENT).toBe('string')
    expect(DEFAULT_CONTENT.length).toBeGreaterThan(0)
    expect(DEFAULT_CONTENT).toContain('# 欢迎使用富文本编辑器')
    expect(DEFAULT_CONTENT).toContain('**加粗**')
    expect(DEFAULT_CONTENT).toContain('*斜体*')
    expect(DEFAULT_CONTENT).toContain('~~删除线~~')
    expect(DEFAULT_CONTENT).toContain('<u>下划线</u>')
  })

  it('IMAGE_URL_REGEX 应该是正则表达式', () => {
    expect(IMAGE_URL_REGEX instanceof RegExp).toBe(true)
  })
})

describe('history - 操作栈', () => {
  describe('createHistoryState', () => {
    it('应该创建包含 content 和 cursor 的状态对象', () => {
      const state = createHistoryState('test content')
      expect(state).toHaveProperty('content', 'test content')
      expect(state).toHaveProperty('cursor')
      expect(state.cursor).toHaveProperty('start')
      expect(state.cursor).toHaveProperty('end')
    })

    it('不传入参数时应该使用 DEFAULT_CONTENT', () => {
      const state = createHistoryState()
      expect(state.content).toBe(DEFAULT_CONTENT)
      expect(state.cursor.start).toBe(DEFAULT_CONTENT.length)
      expect(state.cursor.end).toBe(DEFAULT_CONTENT.length)
    })

    it('应该正确保存自定义光标位置', () => {
      const state = createHistoryState('hello', { start: 2, end: 4 })
      expect(state.content).toBe('hello')
      expect(state.cursor).toEqual({ start: 2, end: 4 })
    })

    it('不传入 cursor 时应该默认到内容末尾', () => {
      const state = createHistoryState('abc')
      expect(state.cursor).toEqual({ start: 3, end: 3 })
    })
  })

  describe('createHistory', () => {
    it('应该返回包含 past、present、future 的初始历史记录对象', () => {
      const history = createHistory()
      expect(history).toHaveProperty('past')
      expect(history).toHaveProperty('present')
      expect(history).toHaveProperty('future')
      expect(Array.isArray(history.past)).toBe(true)
      expect(Array.isArray(history.future)).toBe(true)
      expect(history.past).toEqual([])
      expect(history.future).toEqual([])
    })

    it('present 应该是包含 content 和 cursor 的状态对象', () => {
      const history = createHistory()
      expect(typeof history.present).toBe('object')
      expect(history.present).toHaveProperty('content', DEFAULT_CONTENT)
      expect(history.present).toHaveProperty('cursor')
    })
  })

  describe('getHistoryContent', () => {
    it('应该从状态对象中提取 content', () => {
      expect(getHistoryContent({ content: 'hello', cursor: { start: 0, end: 0 } })).toBe('hello')
    })

    it('兼容旧的字符串格式', () => {
      expect(getHistoryContent('plain string')).toBe('plain string')
    })

    it('null 或 undefined 应该返回空字符串', () => {
      expect(getHistoryContent(null)).toBe('')
      expect(getHistoryContent(undefined)).toBe('')
    })
  })

  describe('getHistoryCursor', () => {
    it('应该从状态对象中提取 cursor', () => {
      expect(getHistoryCursor({ content: 'hello', cursor: { start: 2, end: 3 } })).toEqual({ start: 2, end: 3 })
    })

    it('兼容旧的字符串格式，返回末尾位置', () => {
      expect(getHistoryCursor('abcd')).toEqual({ start: 4, end: 4 })
    })

    it('状态对象缺失 cursor 时应该返回内容末尾位置', () => {
      expect(getHistoryCursor({ content: 'xyz' })).toEqual({ start: 3, end: 3 })
    })
  })

  describe('pushHistory', () => {
    it('接受字符串状态：应该将当前内容推入 past，present 变为新内容', () => {
      const history = createHistory()
      const newHistory = pushHistory(history, 'new content')
      expect(newHistory.past.length).toBe(1)
      expect(getHistoryContent(newHistory.past[0])).toBe(DEFAULT_CONTENT)
      expect(getHistoryContent(newHistory.present)).toBe('new content')
      expect(newHistory.future).toEqual([])
    })

    it('接受状态对象：应该完整保存 content 和 cursor', () => {
      const history = createHistory()
      const newState = createHistoryState('v1', { start: 5, end: 10 })
      const newHistory = pushHistory(history, newState)
      expect(getHistoryContent(newHistory.present)).toBe('v1')
      expect(getHistoryCursor(newHistory.present)).toEqual({ start: 5, end: 10 })
    })

    it('相同内容不应该产生新记录', () => {
      const history = createHistory()
      const newHistory = pushHistory(history, DEFAULT_CONTENT)
      expect(newHistory).toBe(history)
    })

    it('状态对象相同内容不应该产生新记录', () => {
      const history = createHistory()
      const sameState = createHistoryState(DEFAULT_CONTENT, { start: 0, end: 0 })
      const newHistory = pushHistory(history, sameState)
      expect(newHistory).toBe(history)
    })

    it('应该清空 future 栈', () => {
      let history = createHistory()
      history = pushHistory(history, 'v1')
      history = pushHistory(history, 'v2')
      history = undoHistory(history)
      expect(history.future.length).toBe(1)
      history = pushHistory(history, 'v3')
      expect(history.future).toEqual([])
      expect(getHistoryContent(history.present)).toBe('v3')
    })

    it('撤销重做后光标位置应该被保留', () => {
      let history = createHistory()
      history = pushHistory(history, createHistoryState('v1', { start: 1, end: 1 }))
      history = pushHistory(history, createHistoryState('v2', { start: 2, end: 2 }))
      history = undoHistory(history)
      expect(getHistoryCursor(history.present)).toEqual({ start: 1, end: 1 })
      history = redoHistory(history)
      expect(getHistoryCursor(history.present)).toEqual({ start: 2, end: 2 })
    })

    it('应该限制历史记录数量不超过 HISTORY_LIMIT', () => {
      let history = createHistory()
      for (let i = 0; i < HISTORY_LIMIT + 10; i++) {
        history = pushHistory(history, `content-${i}`)
      }
      expect(history.past.length).toBe(HISTORY_LIMIT)
      expect(getHistoryContent(history.past[0])).toBe(`content-${9}`)
    })

    it('null 或 undefined 历史记录应该保持不变', () => {
      expect(pushHistory(null, 'new')).toBeNull()
      expect(pushHistory(undefined, 'new')).toBeUndefined()
    })
  })

  describe('undoHistory', () => {
    it('有历史记录时应该回退到上一版本并恢复光标', () => {
      let history = createHistory()
      history = pushHistory(history, createHistoryState('v1', { start: 1, end: 1 }))
      history = pushHistory(history, createHistoryState('v2', { start: 2, end: 2 }))
      const undone = undoHistory(history)
      expect(getHistoryContent(undone.present)).toBe('v1')
      expect(getHistoryCursor(undone.present)).toEqual({ start: 1, end: 1 })
      expect(undone.future.length).toBe(1)
    })

    it('没有历史记录时应该保持不变', () => {
      const history = createHistory()
      const undone = undoHistory(history)
      expect(undone).toBe(history)
    })

    it('null 或 undefined 历史记录应该保持不变', () => {
      expect(undoHistory(null)).toBeNull()
      expect(undoHistory(undefined)).toBeUndefined()
    })
  })

  describe('redoHistory', () => {
    it('有未来记录时应该前进到下一版本并恢复光标', () => {
      let history = createHistory()
      history = pushHistory(history, createHistoryState('v1', { start: 1, end: 1 }))
      history = pushHistory(history, createHistoryState('v2', { start: 2, end: 2 }))
      history = undoHistory(history)
      const redone = redoHistory(history)
      expect(getHistoryContent(redone.present)).toBe('v2')
      expect(getHistoryCursor(redone.present)).toEqual({ start: 2, end: 2 })
      expect(redone.future).toEqual([])
    })

    it('没有未来记录时应该保持不变', () => {
      const history = createHistory()
      const redone = redoHistory(history)
      expect(redone).toBe(history)
    })

    it('null 或 undefined 历史记录应该保持不变', () => {
      expect(redoHistory(null)).toBeNull()
      expect(redoHistory(undefined)).toBeUndefined()
    })
  })

  describe('canUndo / canRedo', () => {
    it('canUndo 应该根据 past 是否为空返回布尔值', () => {
      expect(canUndo(createHistory())).toBe(false)
      const h = pushHistory(createHistory(), 'new')
      expect(canUndo(h)).toBe(true)
    })

    it('canRedo 应该根据 future 是否为空返回布尔值', () => {
      let h = createHistory()
      expect(canRedo(h)).toBe(false)
      h = pushHistory(h, 'v1')
      h = pushHistory(h, 'v2')
      h = undoHistory(h)
      expect(canRedo(h)).toBe(true)
    })

    it('null 或 undefined 历史记录应该返回 false', () => {
      expect(canUndo(null)).toBe(false)
      expect(canUndo(undefined)).toBe(false)
      expect(canRedo(null)).toBe(false)
      expect(canRedo(undefined)).toBe(false)
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

  describe('saveToStorage', () => {
    it('应该成功保存内容到 localStorage', () => {
      const result = saveToStorage('hello world')
      expect(result).toBe(true)
      expect(localStorage.getItem(STORAGE_KEY)).toBe('hello world')
    })

    it('localStorage 抛错时应该返回 false', () => {
      vi.stubGlobal('localStorage', {
        setItem: vi.fn(() => {
          throw new Error('storage full')
        }),
      })
      expect(saveToStorage('x')).toBe(false)
    })
  })

  describe('loadFromStorage', () => {
    it('localStorage 为空时应该返回默认内容', () => {
      expect(loadFromStorage()).toBe(DEFAULT_CONTENT)
    })

    it('应该正确加载已保存的内容', () => {
      localStorage.setItem(STORAGE_KEY, 'my custom content')
      expect(loadFromStorage()).toBe('my custom content')
    })

    it('localStorage 抛错时应该返回默认内容', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => {
          throw new Error('read error')
        }),
      })
      expect(loadFromStorage()).toBe(DEFAULT_CONTENT)
    })
  })

  describe('clearStorage', () => {
    it('应该清除已保存的内容', () => {
      saveToStorage('saved')
      clearStorage()
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('localStorage 抛错时应该返回 false', () => {
      vi.stubGlobal('localStorage', {
        removeItem: vi.fn(() => {
          throw new Error('remove error')
        }),
      })
      expect(clearStorage()).toBe(false)
    })
  })
})

describe('escapeHtml', () => {
  it('应该正确转义 HTML 特殊字符', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
    expect(escapeHtml('&')).toBe('&amp;')
    expect(escapeHtml('"')).toBe('&quot;')
    expect("'").toBe("'")
    expect(escapeHtml("'")).toBe('&#39;')
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('非字符串输入应该返回空字符串', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
    expect(escapeHtml(123)).toBe('')
    expect(escapeHtml({})).toBe('')
  })
})

describe('markdownToHtml', () => {
  it('空字符串应该返回空', () => {
    expect(markdownToHtml('')).toBe('')
    expect(markdownToHtml(null)).toBe('')
    expect(markdownToHtml(undefined)).toBe('')
  })

  it('应该正确渲染 H1-H3 标题', () => {
    expect(markdownToHtml('# 标题1')).toContain('<h1>标题1</h1>')
    expect(markdownToHtml('## 标题2')).toContain('<h2>标题2</h2>')
    expect(markdownToHtml('### 标题3')).toContain('<h3>标题3</h3>')
  })

  it('应该正确渲染加粗和斜体', () => {
    expect(markdownToHtml('**粗体**')).toContain('<strong>粗体</strong>')
    expect(markdownToHtml('__粗体__')).toContain('<strong>粗体</strong>')
    expect(markdownToHtml('*斜体*')).toContain('<em>斜体</em>')
    expect(markdownToHtml('_斜体_')).toContain('<em>斜体</em>')
  })

  it('应该正确渲染删除线和下划线', () => {
    expect(markdownToHtml('~~删除~~')).toContain('<del>删除</del>')
    expect(markdownToHtml('<u>下划线</u>')).toContain('<u>下划线</u>')
  })

  it('应该正确渲染行内代码', () => {
    expect(markdownToHtml('`code`')).toContain('<code>code</code>')
  })

  it('应该正确渲染引用块', () => {
    expect(markdownToHtml('> 引用内容')).toContain('<blockquote>引用内容</blockquote>')
  })

  it('应该正确渲染无序列表', () => {
    const md = '- 项目1\n- 项目2\n- 项目3'
    const html = markdownToHtml(md)
    expect(html).toContain('<ul>')
    expect(html).toContain('</ul>')
    expect(html.match(/<li>/g)?.length).toBe(3)
  })

  it('应该正确渲染有序列表', () => {
    const md = '1. 第一项\n2. 第二项\n3. 第三项'
    const html = markdownToHtml(md)
    expect(html).toContain('<ol>')
    expect(html).toContain('</ol>')
    expect(html.match(/<li>/g)?.length).toBe(3)
  })

  it('应该正确渲染代码块', () => {
    const md = '```\nconst x = 1;\n```'
    const html = markdownToHtml(md)
    expect(html).toContain('<pre><code>')
    expect(html).toContain('</code></pre>')
    expect(html).toContain('const x = 1;')
  })

  it('应该正确渲染超链接', () => {
    const html = markdownToHtml('[React](https://react.dev)')
    expect(html).toContain('<a')
    expect(html).toContain('href="https://react.dev"')
    expect(html).toContain('React</a>')
  })

  it('应该正确渲染图片', () => {
    const html = markdownToHtml('![alt](https://img.com/1.png)')
    expect(html).toContain('<img')
    expect(html).toContain('src="https://img.com/1.png"')
    expect(html).toContain('alt="alt"')
  })

  it('普通文本段落应该被 <p> 包裹', () => {
    const html = markdownToHtml('Hello world')
    expect(html).toContain('<p>Hello world</p>')
  })

  it('代码块中的内容不应该被转义以外的处理', () => {
    const md = '```\n# not a heading\n**not bold**\n```'
    const html = markdownToHtml(md)
    expect(html).not.toContain('<h1>')
    expect(html).not.toContain('<strong>')
    expect(html).toContain('# not a heading')
    expect(html).toContain('**not bold**')
  })
})

describe('文本操作 - wrapText', () => {
  it('应该正确用前后标记包裹选中文本', () => {
    const result = wrapText('hello world', 0, 5, '**')
    expect(result.text).toBe('**hello** world')
    expect(result.start).toBe(2)
    expect(result.end).toBe(7)
  })

  it('应该支持前后不同的标记', () => {
    const result = wrapText('text', 0, 4, '<u>', '</u>')
    expect(result.text).toBe('<u>text</u>')
    expect(result.start).toBe(3)
    expect(result.end).toBe(7)
  })

  it('空选区应该插入空标记对', () => {
    const result = wrapText('hello', 2, 2, '**')
    expect(result.text).toBe('he****llo')
  })

  it('应该处理反向选择（start > end）', () => {
    const result = wrapText('hello world', 5, 0, '**')
    expect(result.text).toBe('**hello** world')
  })

  it('非字符串输入应该返回安全默认值', () => {
    const result = wrapText(null, 0, 10, '**')
    expect(result.text).toBe('')
    expect(result.start).toBe(0)
    expect(result.end).toBe(0)
  })
})

describe('文本操作 - wrapLinePrefix', () => {
  it('应该在当前行前添加前缀', () => {
    const result = wrapLinePrefix('hello\nworld\nfoo', 7, 7, '> ')
    expect(result.text).toBe('hello\n> world\nfoo')
  })

  it('应该处理多行选择', () => {
    const result = wrapLinePrefix('a\nb\nc', 0, 3, '- ')
    expect(result.text).toBe('- a\n- b\nc')
  })

  it('已有前缀的行不应该重复添加', () => {
    const result = wrapLinePrefix('> existing\nnew', 11, 11, '> ')
    expect(result.text).toBe('> existing\n> new')
  })

  it('非字符串输入应该返回安全默认值', () => {
    const result = wrapLinePrefix(undefined, 0, 0, '# ')
    expect(result.text).toBe('')
    expect(result.start).toBe(0)
    expect(result.end).toBe(0)
  })
})

describe('文本操作 - insertImage', () => {
  it('应该正确插入 Markdown 图片语法', () => {
    const result = insertImage('text', 2, 2, 'https://img.com/1.png', 'alt')
    expect(result.text).toBe('te![alt](https://img.com/1.png)xt')
    expect(result.start).toBe(result.end)
  })

  it('应该替换选中内容', () => {
    const result = insertImage('hello world', 0, 5, 'img.png')
    expect(result.text).toBe('![](img.png) world')
  })

  it('空 alt 应该允许', () => {
    const result = insertImage('abc', 1, 1, 'img.png', '')
    expect(result.text).toBe('a![](img.png)bc')
  })

  it('非字符串输入应该返回安全默认值', () => {
    const result = insertImage(null, 0, 0, 'x', 'y')
    expect(result.text).toBe('')
    expect(result.start).toBe(0)
    expect(result.end).toBe(0)
  })
})

describe('文本操作 - insertLink', () => {
  it('应该正确插入 Markdown 链接语法', () => {
    const result = insertLink('text', 2, 2, 'https://a.com', 'link')
    expect(result.text).toBe('te[link](https://a.com)xt')
  })

  it('应该用选中内容作为链接文本', () => {
    const result = insertLink('hello world', 0, 5, 'https://a.com')
    expect(result.text).toBe('[hello](https://a.com) world')
  })

  it('无选中且无 text 时应该使用 URL 作为文本', () => {
    const result = insertLink('abc', 1, 1, 'https://a.com')
    expect(result.text).toBe('a[https://a.com](https://a.com)bc')
  })

  it('非字符串输入应该返回安全默认值', () => {
    const result = insertLink(undefined, 0, 0, 'x', 'y')
    expect(result.text).toBe('')
    expect(result.start).toBe(0)
    expect(result.end).toBe(0)
  })
})

describe('文本操作 - wrapCodeBlock', () => {
  it('应该正确包裹代码块', () => {
    const result = wrapCodeBlock('before code after', 7, 11, 'js')
    expect(result.text).toBe('before ```js\ncode\n``` after')
    expect(result.start).toBe(13)
    expect(result.end).toBe(17)
  })

  it('无选中内容时应该显示默认提示', () => {
    const result = wrapCodeBlock('abc', 1, 1, '')
    expect(result.text).toContain('在此输入代码')
  })

  it('空语言参数应该允许', () => {
    const result = wrapCodeBlock('x', 0, 1)
    expect(result.text).toContain('```\n')
  })

  it('非字符串输入应该返回安全默认值', () => {
    const result = wrapCodeBlock(null, 0, 0)
    expect(result.text).toBe('')
    expect(result.start).toBe(0)
    expect(result.end).toBe(0)
  })
})

describe('URL 检测 - isValidUrl', () => {
  it('应该接受标准 HTTP/HTTPS URL', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://example.com/path?q=1')).toBe(true)
    expect(isValidUrl('https://sub.domain.co.uk:8080/path')).toBe(true)
  })

  it('应该接受 data:image URL', () => {
    expect(isValidUrl('data:image/png;base64,abc123')).toBe(true)
  })

  it('应该接受相对路径 URL', () => {
    expect(isValidUrl('/path/to/image.png')).toBe(true)
    expect(isValidUrl('./image.png')).toBe(true)
    expect(isValidUrl('../images/logo.png')).toBe(true)
  })

  it('应该拒绝无效输入', () => {
    expect(isValidUrl('')).toBe(false)
    expect(isValidUrl('   ')).toBe(false)
    expect(isValidUrl(null)).toBe(false)
    expect(isValidUrl(undefined)).toBe(false)
    expect(isValidUrl(123)).toBe(false)
    expect(isValidUrl({})).toBe(false)
    expect(isValidUrl('not a url')).toBe(false)
  })
})

describe('图片 URL 检测 - isImageUrl', () => {
  it('应该接受常见扩展名的图片 HTTP URL', () => {
    expect(isImageUrl('https://example.com/image.png')).toBe(true)
    expect(isImageUrl('https://example.com/photo.jpg')).toBe(true)
    expect(isImageUrl('https://example.com/pic.jpeg')).toBe(true)
    expect(isImageUrl('https://example.com/anim.gif')).toBe(true)
    expect(isImageUrl('https://example.com/v.webp')).toBe(true)
    expect(isImageUrl('https://example.com/logo.svg')).toBe(true)
    expect(isImageUrl('https://example.com/img.bmp')).toBe(true)
  })

  it('应该接受带查询参数的图片 URL', () => {
    expect(isImageUrl('https://example.com/img.png?size=100&v=2')).toBe(true)
  })

  it('应该接受 data:image Base64 URL', () => {
    expect(isImageUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')).toBe(true)
    expect(isImageUrl('data:image/jpeg;base64,abc123')).toBe(true)
  })

  it('应该拒绝非图片 URL', () => {
    expect(isImageUrl('https://example.com')).toBe(false)
    expect(isImageUrl('https://example.com/page.html')).toBe(false)
    expect(isImageUrl('https://example.com/file.pdf')).toBe(false)
    expect(isImageUrl('https://example.com/script.js')).toBe(false)
  })

  it('应该拒绝无效输入', () => {
    expect(isImageUrl('')).toBe(false)
    expect(isImageUrl('   ')).toBe(false)
    expect(isImageUrl(null)).toBe(false)
    expect(isImageUrl(undefined)).toBe(false)
    expect(isImageUrl(123)).toBe(false)
    expect(isImageUrl('plain text')).toBe(false)
  })

  it('应该不区分大小写检测扩展名', () => {
    expect(isImageUrl('https://example.com/IMAGE.PNG')).toBe(true)
    expect(isImageUrl('https://example.com/Photo.JPG')).toBe(true)
  })
})

describe('粘贴检测 - detectPastedContent', () => {
  it('null/undefined clipboardData 应该返回 text 类型空内容', () => {
    expect(detectPastedContent(null)).toEqual({ type: 'text', content: '' })
    expect(detectPastedContent(undefined)).toEqual({ type: 'text', content: '' })
  })

  it('普通文本应该返回 text 类型', () => {
    const clipboardData = {
      items: [],
      getData: () => 'hello world',
    }
    expect(detectPastedContent(clipboardData)).toEqual({
      type: 'text',
      content: 'hello world',
    })
  })

  it('图片 URL 文本应该返回 image-url 类型', () => {
    const clipboardData = {
      items: [],
      getData: () => 'https://example.com/pic.png',
    }
    expect(detectPastedContent(clipboardData)).toEqual({
      type: 'image-url',
      url: 'https://example.com/pic.png',
    })
  })

  it('非图片 URL 文本应该返回 url 类型', () => {
    const clipboardData = {
      items: [],
      getData: () => 'https://example.com/page.html',
    }
    expect(detectPastedContent(clipboardData)).toEqual({
      type: 'url',
      url: 'https://example.com/page.html',
    })
  })

  it('剪贴板中的图片文件应该返回 image-file 类型', () => {
    const mockFile = new Blob(['fake'], { type: 'image/png' })
    mockFile.name = 'test.png'
    const clipboardData = {
      items: [
        {
          type: 'image/png',
          getAsFile: () => mockFile,
        },
      ],
      getData: () => '',
    }
    const result = detectPastedContent(clipboardData)
    expect(result.type).toBe('image-file')
    expect(result.file).toBe(mockFile)
  })

  it('items 中无 image 项时应该回退到文本检测', () => {
    const clipboardData = {
      items: [
        { type: 'text/plain', getAsFile: () => null },
      ],
      getData: () => 'just text',
    }
    expect(detectPastedContent(clipboardData)).toEqual({
      type: 'text',
      content: 'just text',
    })
  })

  it('图片文件项 getAsFile 返回 null 时应该回退', () => {
    const clipboardData = {
      items: [
        { type: 'image/png', getAsFile: () => null },
      ],
      getData: () => 'https://example.com/img.png',
    }
    expect(detectPastedContent(clipboardData)).toEqual({
      type: 'image-url',
      url: 'https://example.com/img.png',
    })
  })

  it('应该检测 data:image Base64 文本为 image-url', () => {
    const clipboardData = {
      items: [],
      getData: () => 'data:image/png;base64,abc123',
    }
    expect(detectPastedContent(clipboardData)).toEqual({
      type: 'image-url',
      url: 'data:image/png;base64,abc123',
    })
  })
})

describe('fileToBase64', () => {
  const originalFileReader = global.FileReader

  beforeEach(() => {
    class MockFileReader {
      onload = null
      onerror = null
      result = null
      error = null
      readAsDataURL(blob) {
        this.result = 'data:text/plain;base64,aGVsbG8gd29ybGQ='
        setTimeout(() => this.onload?.({ target: this }), 0)
      }
    }
    global.FileReader = MockFileReader
  })

  afterEach(() => {
    if (originalFileReader) {
      global.FileReader = originalFileReader
    } else {
      delete global.FileReader
    }
  })

  it('应该将 File/Blob 转换为 Base64 data URL', async () => {
    const mockFile = new Blob(['hello world'], { type: 'text/plain' })
    const result = await fileToBase64(mockFile)
    expect(typeof result).toBe('string')
    expect(result.startsWith('data:')).toBe(true)
    expect(result.includes('base64,')).toBe(true)
  })

  it('无效文件参数应该 reject', async () => {
    await expect(fileToBase64(null)).rejects.toThrow()
    await expect(fileToBase64(undefined)).rejects.toThrow()
    await expect(fileToBase64('not a blob')).rejects.toThrow()
  })
})
