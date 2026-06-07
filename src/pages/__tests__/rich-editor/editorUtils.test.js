import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  STORAGE_KEY,
  HISTORY_LIMIT,
  DEFAULT_CONTENT,
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
  canUndo,
  canRedo,
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
} from '../../rich-editor/editorUtils'

describe('history - 操作栈', () => {
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
      expect(history.present).toBe(DEFAULT_CONTENT)
    })
  })

  describe('pushHistory', () => {
    it('应该将当前内容推入 past，present 变为新内容', () => {
      const history = createHistory()
      const newHistory = pushHistory(history, 'new content')
      expect(newHistory.past).toEqual([DEFAULT_CONTENT])
      expect(newHistory.present).toBe('new content')
      expect(newHistory.future).toEqual([])
    })

    it('相同内容不应该产生新记录', () => {
      const history = createHistory()
      const newHistory = pushHistory(history, DEFAULT_CONTENT)
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
      expect(history.present).toBe('v3')
    })

    it('应该限制历史记录数量不超过 HISTORY_LIMIT', () => {
      let history = createHistory()
      for (let i = 0; i < HISTORY_LIMIT + 10; i++) {
        history = pushHistory(history, `content-${i}`)
      }
      expect(history.past.length).toBe(HISTORY_LIMIT)
      expect(history.past[0]).toBe(`content-${9}`)
    })

    it('null 或 undefined 历史记录应该保持不变', () => {
      expect(pushHistory(null, 'new')).toBeNull()
      expect(pushHistory(undefined, 'new')).toBeUndefined()
    })
  })

  describe('undoHistory', () => {
    it('有历史记录时应该回退到上一版本', () => {
      let history = createHistory()
      history = pushHistory(history, 'v1')
      history = pushHistory(history, 'v2')
      const undone = undoHistory(history)
      expect(undone.present).toBe('v1')
      expect(undone.past).toEqual([DEFAULT_CONTENT])
      expect(undone.future).toEqual(['v2'])
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
    it('有未来记录时应该前进到下一版本', () => {
      let history = createHistory()
      history = pushHistory(history, 'v1')
      history = pushHistory(history, 'v2')
      history = undoHistory(history)
      const redone = redoHistory(history)
      expect(redone.present).toBe('v2')
      expect(redone.past).toEqual([DEFAULT_CONTENT, 'v1'])
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

describe('isValidUrl', () => {
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
