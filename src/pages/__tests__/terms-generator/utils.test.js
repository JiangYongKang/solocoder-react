import { describe, it, expect } from 'vitest'
import {
  escapeHtml,
  extractVariables,
  replaceVariables,
  getTemplateSections,
  renderMarkdownToHtml,
  splitLines,
  computeLCSMatrix,
  computeLineDiff,
  validateTemplate,
  buildExportHtml,
  mergeVariableDefinitions,
  formatTimestamp,
} from '../../terms-generator/utils.js'
import { COMMON_VARIABLES } from '../../terms-generator/constants.js'

describe('escapeHtml', () => {
  it('应该正确转义 HTML 特殊字符', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('应该正确转义单引号', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s')
  })

  it('null 或 undefined 应该返回空字符串', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('普通文本应该保持不变', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })
})

describe('extractVariables', () => {
  it('应该从内容中提取变量名', () => {
    const content = '欢迎使用 {公司名称}，请访问 {公司网址}'
    const result = extractVariables(content)
    expect(result).toEqual(['公司名称', '公司网址'])
  })

  it('重复变量只返回一次', () => {
    const content = '{公司名称} 再次出现 {公司名称}'
    const result = extractVariables(content)
    expect(result).toEqual(['公司名称'])
  })

  it('没有变量时返回空数组', () => {
    expect(extractVariables('普通文本，没有变量')).toEqual([])
  })

  it('非字符串输入返回空数组', () => {
    expect(extractVariables(null)).toEqual([])
    expect(extractVariables(undefined)).toEqual([])
    expect(extractVariables(123)).toEqual([])
  })

  it('应该正确处理变量名周围的空白', () => {
    const content = '{ 公司名称 }'
    const result = extractVariables(content)
    expect(result).toEqual(['公司名称'])
  })

  it('空大括号不应该被提取', () => {
    expect(extractVariables('a {} b')).toEqual([])
  })
})

describe('replaceVariables', () => {
  it('应该正确替换变量值', () => {
    const content = '欢迎使用 {公司名称}，生效日期：{生效日期}'
    const vars = { '公司名称': '测试公司', '生效日期': '2024-01-01' }
    expect(replaceVariables(content, vars)).toBe('欢迎使用 测试公司，生效日期：2024-01-01')
  })

  it('缺失的变量应该保留原占位符', () => {
    const content = '{公司名称} - {未定义变量}'
    const vars = { '公司名称': '测试公司' }
    expect(replaceVariables(content, vars)).toBe('测试公司 - {未定义变量}')
  })

  it('空字符串值应该保留原占位符', () => {
    const content = '{公司名称}'
    const vars = { '公司名称': '' }
    expect(replaceVariables(content, vars)).toBe('{公司名称}')
  })

  it('非字符串内容返回空字符串', () => {
    expect(replaceVariables(null, {})).toBe('')
    expect(replaceVariables(undefined, {})).toBe('')
  })

  it('非对象变量参数不应该报错', () => {
    expect(replaceVariables('{a}', null)).toBe('{a}')
  })
})

describe('getTemplateSections', () => {
  it('应该提取 Markdown 标题作为章节', () => {
    const content = `# 一级标题
## 二级标题
### 三级标题
普通内容
#### 四级标题`
    const sections = getTemplateSections(content)
    expect(sections).toEqual([
      { level: 1, title: '一级标题' },
      { level: 2, title: '二级标题' },
      { level: 3, title: '三级标题' },
      { level: 4, title: '四级标题' },
    ])
  })

  it('非字符串输入返回空数组', () => {
    expect(getTemplateSections(null)).toEqual([])
    expect(getTemplateSections(undefined)).toEqual([])
  })

  it('没有标题时返回空数组', () => {
    expect(getTemplateSections('普通文本\n没有标题')).toEqual([])
  })

  it('应该处理标题前后的空白', () => {
    const content = '#  带空格的标题  '
    const sections = getTemplateSections(content)
    expect(sections[0].title).toBe('带空格的标题')
  })
})

describe('renderMarkdownToHtml', () => {
  it('空内容返回空字符串', () => {
    expect(renderMarkdownToHtml('')).toBe('')
    expect(renderMarkdownToHtml(null)).toBe('')
  })

  it('应该正确渲染 h1-h4 标题', () => {
    const html = renderMarkdownToHtml('# 标题一\n## 标题二\n### 标题三\n#### 标题四')
    expect(html).toContain('<h1>标题一</h1>')
    expect(html).toContain('<h2>标题二</h2>')
    expect(html).toContain('<h3>标题三</h3>')
    expect(html).toContain('<h4>标题四</h4>')
  })

  it('应该正确渲染加粗和斜体', () => {
    const html = renderMarkdownToHtml('**加粗文字** 和 *斜体文字* 和 ***粗斜体***')
    expect(html).toContain('<strong>加粗文字</strong>')
    expect(html).toContain('<em>斜体文字</em>')
    expect(html).toContain('<strong><em>粗斜体</em></strong>')
  })

  it('应该正确渲染无序列表', () => {
    const html = renderMarkdownToHtml('- 项目一\n- 项目二\n- 项目三')
    expect(html).toContain('<ul class="md-list">')
    expect(html).toContain('<li class="md-list-item">项目一</li>')
    expect(html).toContain('<li class="md-list-item">项目二</li>')
    expect(html).toContain('<li class="md-list-item">项目三</li>')
    expect(html).toContain('</ul>')
  })

  it('应该正确渲染有序列表', () => {
    const html = renderMarkdownToHtml('1. 第一步\n2. 第二步\n3. 第三步')
    expect(html).toContain('<ol class="md-list">')
    expect(html).toContain('<li class="md-list-item">第一步</li>')
    expect(html).toContain('<li class="md-list-item">第二步</li>')
    expect(html).toContain('<li class="md-list-item">第三步</li>')
    expect(html).toContain('</ol>')
  })

  it('应该正确渲染链接', () => {
    const html = renderMarkdownToHtml('[链接文字](https://example.com)')
    expect(html).toContain('<a href="https://example.com" target="_blank" rel="noopener" class="md-link">链接文字</a>')
  })

  it('应该正确渲染行内代码', () => {
    const html = renderMarkdownToHtml('使用 `const x = 1` 定义变量')
    expect(html).toContain('<code class="md-inline-code">const x = 1</code>')
  })

  it('应该正确渲染代码块', () => {
    const html = renderMarkdownToHtml('```\nfunction test() {\n  return 1\n}\n```')
    expect(html).toContain('<pre class="md-code-block">')
    expect(html).toContain('<code>')
  })

  it('应该正确渲染段落', () => {
    const html = renderMarkdownToHtml('这是一段普通文本')
    expect(html).toContain('<p class="md-paragraph">这是一段普通文本</p>')
  })

  it('应该对输出进行 HTML 转义', () => {
    const html = renderMarkdownToHtml('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('splitLines', () => {
  it('应该按换行符分割文本', () => {
    expect(splitLines('a\nb\nc')).toEqual(['a', 'b', 'c'])
  })

  it('非字符串输入返回空数组', () => {
    expect(splitLines(null)).toEqual([])
    expect(splitLines(undefined)).toEqual([])
    expect(splitLines(123)).toEqual([])
  })

  it('空字符串返回空数组', () => {
    expect(splitLines('')).toEqual([])
  })
})

describe('computeLCSMatrix', () => {
  it('应该正确计算 LCS 矩阵', () => {
    const arr1 = ['a', 'b', 'c']
    const arr2 = ['a', 'c', 'd']
    const dp = computeLCSMatrix(arr1, arr2)
    expect(Array.isArray(dp)).toBe(true)
    expect(dp.length).toBe(4)
    expect(dp[0].length).toBe(4)
    expect(dp[3][3]).toBe(2)
  })

  it('两个空数组返回 1x1 零矩阵', () => {
    const dp = computeLCSMatrix([], [])
    expect(dp.length).toBe(1)
    expect(dp[0].length).toBe(1)
    expect(dp[0][0]).toBe(0)
  })

  it('完全相同的数组返回正确的 LCS 长度', () => {
    const arr = ['x', 'y', 'z']
    const dp = computeLCSMatrix(arr, arr)
    expect(dp[3][3]).toBe(3)
  })

  it('完全不同的数组返回 0', () => {
    const dp = computeLCSMatrix(['a', 'b'], ['c', 'd'])
    expect(dp[2][2]).toBe(0)
  })
})

describe('computeLineDiff', () => {
  it('相同内容返回全部 equal', () => {
    const diff = computeLineDiff('a\nb', 'a\nb')
    expect(diff.every((d) => d.type === 'equal')).toBe(true)
    expect(diff.length).toBe(2)
  })

  it('应该识别新增行', () => {
    const diff = computeLineDiff('a', 'a\nb')
    const types = diff.map((d) => d.type)
    expect(types).toContain('added')
  })

  it('应该识别删除行', () => {
    const diff = computeLineDiff('a\nb', 'a')
    const types = diff.map((d) => d.type)
    expect(types).toContain('removed')
  })

  it('空文本返回空数组', () => {
    expect(computeLineDiff('', '')).toEqual([])
  })

  it('每个差异项应该包含 type 和 value', () => {
    const diff = computeLineDiff('hello', 'world')
    diff.forEach((d) => {
      expect(d).toHaveProperty('type')
      expect(d).toHaveProperty('value')
    })
  })
})

describe('validateTemplate', () => {
  it('有效模板应该返回 valid: true', () => {
    const template = {
      id: 'test',
      name: '测试模板',
      content: '# 测试内容',
      variables: [{ key: '公司名称', label: '公司名称', type: 'text' }],
    }
    const result = validateTemplate(template)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('非对象输入应该返回错误', () => {
    expect(validateTemplate(null).valid).toBe(false)
    expect(validateTemplate(undefined).valid).toBe(false)
    expect(validateTemplate('string').valid).toBe(false)
  })

  it('缺少 id 应该返回错误', () => {
    const result = validateTemplate({ name: 'test', content: '', variables: [] })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('空名称应该返回错误', () => {
    const result = validateTemplate({ id: 'test', name: '   ', content: '', variables: [] })
    expect(result.valid).toBe(false)
  })

  it('内容非字符串应该返回错误', () => {
    const result = validateTemplate({ id: 'test', name: 'test', content: 123, variables: [] })
    expect(result.valid).toBe(false)
  })

  it('变量非数组应该返回错误', () => {
    const result = validateTemplate({ id: 'test', name: 'test', content: '', variables: 'not-array' })
    expect(result.valid).toBe(false)
  })

  it('变量缺少 key 应该返回错误', () => {
    const result = validateTemplate({
      id: 'test',
      name: 'test',
      content: '',
      variables: [{ label: 'test' }],
    })
    expect(result.valid).toBe(false)
  })
})

describe('buildExportHtml', () => {
  it('应该生成完整的 HTML 文档', () => {
    const html = buildExportHtml('<p>内容</p>', '隐私政策', '测试公司', '2024-01-01')
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(html).toContain('<html')
    expect(html).toContain('<head>')
    expect(html).toContain('<body>')
    expect(html).toContain('</html>')
  })

  it('应该包含文档标题', () => {
    const html = buildExportHtml('', '用户协议', '', '')
    expect(html).toContain('用户协议')
  })

  it('应该包含生成日期', () => {
    const html = buildExportHtml('', '', '', '2024-06-20')
    expect(html).toContain('2024-06-20')
  })

  it('应该包含版权声明和公司名称', () => {
    const html = buildExportHtml('', '', '某某科技', '2024-06-20')
    expect(html).toContain('某某科技')
    expect(html).toContain('本文档由')
  })

  it('应该包含内联样式', () => {
    const html = buildExportHtml('', '', '', '')
    expect(html).toContain('<style>')
    expect(html).toContain('h1')
    expect(html).toContain('body')
  })

  it('应该包含内容区域', () => {
    const html = buildExportHtml('<p>我的内容</p>', '', '', '')
    expect(html).toContain('<p>我的内容</p>')
  })

  it('参数为空时使用默认值', () => {
    const html = buildExportHtml('', null, null, null)
    expect(html).toContain('条款文档')
  })
})

describe('mergeVariableDefinitions', () => {
  it('应该合并模板变量和内容提取的变量', () => {
    const templateVars = [{ key: '公司名称', label: '公司名称', type: 'text' }]
    const contentVars = ['公司名称', '生效日期']
    const merged = mergeVariableDefinitions(templateVars, contentVars)
    expect(merged.length).toBeGreaterThanOrEqual(2)
    expect(merged.find((v) => v.key === '公司名称')).toBeDefined()
    expect(merged.find((v) => v.key === '生效日期')).toBeDefined()
  })

  it('通用变量应该使用预设定义', () => {
    const merged = mergeVariableDefinitions([], ['公司网址'])
    const found = merged.find((v) => v.key === '公司网址')
    expect(found).toBeDefined()
    const commonVar = COMMON_VARIABLES.find((v) => v.key === '公司网址')
    expect(found.label).toBe(commonVar.label)
    expect(found.type).toBe(commonVar.type)
  })

  it('未知变量应该创建默认定义', () => {
    const merged = mergeVariableDefinitions([], ['自定义变量'])
    const found = merged.find((v) => v.key === '自定义变量')
    expect(found).toBeDefined()
    expect(found.label).toBe('自定义变量')
    expect(found.type).toBe('text')
  })

  it('重复变量不应该重复添加', () => {
    const templateVars = [{ key: '公司名称', label: '公司名称', type: 'text' }]
    const merged = mergeVariableDefinitions(templateVars, ['公司名称', '公司名称'])
    const found = merged.filter((v) => v.key === '公司名称')
    expect(found.length).toBe(1)
  })

  it('空输入返回空数组', () => {
    expect(mergeVariableDefinitions([], [])).toEqual([])
    expect(mergeVariableDefinitions(null, null)).toEqual([])
  })
})

describe('formatTimestamp', () => {
  it('应该格式化有效时间戳', () => {
    const ts = new Date('2024-01-15T10:30:00').getTime()
    const formatted = formatTimestamp(ts)
    expect(typeof formatted).toBe('string')
    expect(formatted.length).toBeGreaterThan(0)
  })

  it('无效输入返回空字符串', () => {
    expect(formatTimestamp(null)).toBe('')
    expect(formatTimestamp(undefined)).toBe('')
    expect(formatTimestamp('invalid')).toBe('')
  })

  it('0 时间戳应该返回有效格式', () => {
    const formatted = formatTimestamp(0)
    expect(typeof formatted).toBe('string')
    expect(formatted.length).toBeGreaterThan(0)
  })
})
