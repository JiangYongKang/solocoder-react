import { describe, it, expect } from 'vitest'
import {
  HTTP_METHODS,
  MOCK_TEMPLATES,
  generateId,
  createEmptyKeyValue,
  wildcardMatch,
  matchFirstRule,
  matchAllRules,
  createRequestRule,
  createResponseRule,
  sortRulesByPriority,
  moveRule,
  enableAllRules,
  disableAllRules,
  formatJson,
  minifyJson,
  isValidJson,
  getJsonErrorLine,
  escapeHtml,
  highlightJson,
  modifyRequestHeaders,
  modifyResponseBody,
  createMockTemplate,
  createLogEntry,
  filterLogs,
  sortLogsByTime,
  getStatusCodeCategory,
  formatTimestamp,
  formatDuration,
  executeInterceptorChain,
  exportRulesToJson,
  importRulesFromJson,
} from '@/pages/network-interceptor/networkInterceptorUtils'

describe('HTTP_METHODS 常量', () => {
  it('包含所有支持的 HTTP 方法', () => {
    expect(HTTP_METHODS).toEqual(['GET', 'POST', 'PUT', 'DELETE'])
  })
})

describe('MOCK_TEMPLATES 常量', () => {
  it('包含预设的 Mock 模板', () => {
    expect(Array.isArray(MOCK_TEMPLATES)).toBe(true)
    expect(MOCK_TEMPLATES.length).toBeGreaterThan(0)
    MOCK_TEMPLATES.forEach((t) => {
      expect(t).toHaveProperty('name')
      expect(t).toHaveProperty('value')
      expect(typeof t.name).toBe('string')
      expect(typeof t.value).toBe('string')
    })
  })

  it('所有模板值都是有效的 JSON', () => {
    MOCK_TEMPLATES.forEach((t) => {
      expect(() => JSON.parse(t.value)).not.toThrow()
    })
  })
})

describe('generateId', () => {
  it('生成唯一 ID', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(typeof id1).toBe('string')
    expect(id1).not.toBe(id2)
  })

  it('ID 以 ni- 开头', () => {
    const id = generateId()
    expect(id.startsWith('ni-')).toBe(true)
  })
})

describe('createEmptyKeyValue', () => {
  it('创建空的键值对对象', () => {
    const kv = createEmptyKeyValue()
    expect(kv).toHaveProperty('id')
    expect(kv).toHaveProperty('key')
    expect(kv).toHaveProperty('value')
    expect(kv).toHaveProperty('enabled')
    expect(kv.key).toBe('')
    expect(kv.value).toBe('')
    expect(kv.enabled).toBe(true)
  })
})

describe('wildcardMatch', () => {
  it('精确匹配', () => {
    expect(wildcardMatch('/api/login', '/api/login')).toBe(true)
    expect(wildcardMatch('/api/login', '/api/logout')).toBe(false)
  })

  it('通配符 * 匹配任意字符', () => {
    expect(wildcardMatch('/api/user*', '/api/user')).toBe(true)
    expect(wildcardMatch('/api/user*', '/api/user/123')).toBe(true)
    expect(wildcardMatch('/api/user*', '/api/users')).toBe(true)
    expect(wildcardMatch('/api/user*', '/api/other')).toBe(false)
  })

  it('通配符在中间', () => {
    expect(wildcardMatch('/api/*/detail', '/api/user/detail')).toBe(true)
    expect(wildcardMatch('/api/*/detail', '/api/product/detail')).toBe(true)
    expect(wildcardMatch('/api/*/detail', '/api/user/list')).toBe(false)
  })

  it('多个通配符', () => {
    expect(wildcardMatch('/*/user/*', '/api/user/123')).toBe(true)
    expect(wildcardMatch('/*/user/*', '/admin/user/456')).toBe(true)
    expect(wildcardMatch('/*/user/*', '/api/product/123')).toBe(false)
  })

  it('空值处理', () => {
    expect(wildcardMatch('', '/api/user')).toBe(false)
    expect(wildcardMatch('/api/user', '')).toBe(false)
    expect(wildcardMatch(null, '/api/user')).toBe(false)
    expect(wildcardMatch('/api/user', null)).toBe(false)
    expect(wildcardMatch(undefined, '/api/user')).toBe(false)
    expect(wildcardMatch('/api/user', undefined)).toBe(false)
  })

  it('特殊字符转义', () => {
    expect(wildcardMatch('/api/user.json', '/api/user.json')).toBe(true)
    expect(wildcardMatch('/api/user*.json', '/api/user123.json')).toBe(true)
    expect(wildcardMatch('/api/v1/user', '/api/v2/user')).toBe(false)
  })
})

describe('matchFirstRule', () => {
  const rules = [
    { id: '1', name: '规则1', urlPattern: '/api/user/*', enabled: true },
    { id: '2', name: '规则2', urlPattern: '/api/*', enabled: true },
    { id: '3', name: '规则3', urlPattern: '/other/*', enabled: true },
  ]

  it('返回第一个匹配的规则', () => {
    const result = matchFirstRule(rules, '/api/user/123')
    expect(result).not.toBeNull()
    expect(result.id).toBe('1')
  })

  it('按顺序匹配，优先返回前面的规则', () => {
    const result = matchFirstRule(rules, '/api/product')
    expect(result).not.toBeNull()
    expect(result.id).toBe('2')
  })

  it('跳过禁用的规则', () => {
    const disabledRules = [
      { id: '1', name: '规则1', urlPattern: '/api/*', enabled: false },
      { id: '2', name: '规则2', urlPattern: '/api/*', enabled: true },
    ]
    const result = matchFirstRule(disabledRules, '/api/user')
    expect(result).not.toBeNull()
    expect(result.id).toBe('2')
  })

  it('没有匹配时返回 null', () => {
    const result = matchFirstRule(rules, '/test/not/match')
    expect(result).toBeNull()
  })

  it('空规则列表返回 null', () => {
    expect(matchFirstRule([], '/api/user')).toBeNull()
    expect(matchFirstRule(null, '/api/user')).toBeNull()
    expect(matchFirstRule(undefined, '/api/user')).toBeNull()
  })
})

describe('matchAllRules', () => {
  const rules = [
    { id: '1', name: '规则1', urlPattern: '/api/user/*', enabled: true },
    { id: '2', name: '规则2', urlPattern: '/api/*', enabled: true },
    { id: '3', name: '规则3', urlPattern: '/other/*', enabled: true },
  ]

  it('返回所有匹配的规则', () => {
    const result = matchAllRules(rules, '/api/user/123')
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(2)
    expect(result[0].id).toBe('1')
    expect(result[1].id).toBe('2')
  })

  it('跳过禁用的规则', () => {
    const disabledRules = [
      { id: '1', name: '规则1', urlPattern: '/api/*', enabled: false },
      { id: '2', name: '规则2', urlPattern: '/api/*', enabled: true },
    ]
    const result = matchAllRules(disabledRules, '/api/user')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('2')
  })

  it('没有匹配时返回空数组', () => {
    const result = matchAllRules(rules, '/test/not/match')
    expect(result).toEqual([])
  })

  it('空规则列表返回空数组', () => {
    expect(matchAllRules([], '/api/user')).toEqual([])
    expect(matchAllRules(null, '/api/user')).toEqual([])
    expect(matchAllRules(undefined, '/api/user')).toEqual([])
  })
})

describe('createRequestRule', () => {
  it('创建默认的请求拦截规则', () => {
    const rule = createRequestRule()
    expect(rule).toHaveProperty('id')
    expect(rule).toHaveProperty('name')
    expect(rule).toHaveProperty('urlPattern')
    expect(rule).toHaveProperty('enabled')
    expect(rule).toHaveProperty('modifyHeaders')
    expect(rule.enabled).toBe(true)
    expect(Array.isArray(rule.modifyHeaders)).toBe(true)
    expect(rule.modifyHeaders.length).toBe(0)
  })

  it('可以指定名称和 URL 模式', () => {
    const rule = createRequestRule('测试规则', '/api/*')
    expect(rule.name).toBe('测试规则')
    expect(rule.urlPattern).toBe('/api/*')
  })
})

describe('createResponseRule', () => {
  it('创建默认的响应拦截规则', () => {
    const rule = createResponseRule()
    expect(rule).toHaveProperty('id')
    expect(rule).toHaveProperty('name')
    expect(rule).toHaveProperty('urlPattern')
    expect(rule).toHaveProperty('enabled')
    expect(rule).toHaveProperty('mockBody')
    expect(rule.enabled).toBe(true)
    expect(rule.mockBody).toBe('')
  })

  it('可以指定参数', () => {
    const rule = createResponseRule('测试规则', '/api/*', '{}')
    expect(rule.name).toBe('测试规则')
    expect(rule.urlPattern).toBe('/api/*')
    expect(rule.mockBody).toBe('{}')
  })
})

describe('sortRulesByPriority', () => {
  it('返回规则数组的副本', () => {
    const rules = [{ id: '1' }, { id: '2' }]
    const result = sortRulesByPriority(rules)
    expect(result).not.toBe(rules)
    expect(result).toEqual(rules)
  })

  it('空输入返回空数组', () => {
    expect(sortRulesByPriority([])).toEqual([])
    expect(sortRulesByPriority(null)).toEqual([])
    expect(sortRulesByPriority(undefined)).toEqual([])
  })

  it('启用的规则排在禁用规则前面', () => {
    const rules = [
      { id: '1', name: '规则1', enabled: false },
      { id: '2', name: '规则2', enabled: true },
      { id: '3', name: '规则3', enabled: false },
      { id: '4', name: '规则4', enabled: true },
    ]
    const result = sortRulesByPriority(rules)
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('4')
    expect(result[2].id).toBe('1')
    expect(result[3].id).toBe('3')
    expect(result[0].enabled).toBe(true)
    expect(result[1].enabled).toBe(true)
    expect(result[2].enabled).toBe(false)
    expect(result[3].enabled).toBe(false)
  })

  it('按 priority 数值从小到大排序', () => {
    const rules = [
      { id: '1', name: '规则1', enabled: true, priority: 3 },
      { id: '2', name: '规则2', enabled: true, priority: 1 },
      { id: '3', name: '规则3', enabled: true, priority: 2 },
    ]
    const result = sortRulesByPriority(rules)
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('3')
    expect(result[2].id).toBe('1')
    expect(result[0].priority).toBe(1)
    expect(result[1].priority).toBe(2)
    expect(result[2].priority).toBe(3)
  })

  it('优先按 enabled 排序，同组内按 priority 排序', () => {
    const rules = [
      { id: '1', name: '规则1', enabled: false, priority: 1 },
      { id: '2', name: '规则2', enabled: true, priority: 3 },
      { id: '3', name: '规则3', enabled: true, priority: 1 },
      { id: '4', name: '规则4', enabled: false, priority: 2 },
    ]
    const result = sortRulesByPriority(rules)
    expect(result.map((r) => r.id)).toEqual(['3', '2', '1', '4'])
    expect(result[0].enabled).toBe(true)
    expect(result[0].priority).toBe(1)
    expect(result[1].enabled).toBe(true)
    expect(result[1].priority).toBe(3)
    expect(result[2].enabled).toBe(false)
    expect(result[2].priority).toBe(1)
    expect(result[3].enabled).toBe(false)
    expect(result[3].priority).toBe(2)
  })

  it('没有 priority 字段的规则保持原有相对顺序', () => {
    const rules = [
      { id: '1', name: '规则1', enabled: true },
      { id: '2', name: '规则2', enabled: true },
      { id: '3', name: '规则3', enabled: true },
    ]
    const result = sortRulesByPriority(rules)
    expect(result.map((r) => r.id)).toEqual(['1', '2', '3'])
  })

  it('部分有 priority 部分没有时，没有的保持稳定', () => {
    const rules = [
      { id: '1', name: '规则1', enabled: true },
      { id: '2', name: '规则2', enabled: true, priority: 1 },
      { id: '3', name: '规则3', enabled: true },
    ]
    const result = sortRulesByPriority(rules)
    expect(result[0].id).toBe('2')
    expect(result.map((r) => r.id).slice(1)).toEqual(expect.arrayContaining(['1', '3']))
  })

  it('不修改原数组', () => {
    const rules = [
      { id: '1', name: '规则1', enabled: false },
      { id: '2', name: '规则2', enabled: true },
    ]
    const originalOrder = rules.map((r) => ({ ...r }))
    sortRulesByPriority(rules)
    expect(rules.map((r) => r.id)).toEqual(originalOrder.map((r) => r.id))
    expect(rules.map((r) => r.enabled)).toEqual(originalOrder.map((r) => r.enabled))
  })
})

describe('moveRule', () => {
  const rules = [
    { id: '1', name: '规则1' },
    { id: '2', name: '规则2' },
    { id: '3', name: '规则3' },
  ]

  it('向下移动规则', () => {
    const result = moveRule(rules, 0, 2)
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('3')
    expect(result[2].id).toBe('1')
  })

  it('向上移动规则', () => {
    const result = moveRule(rules, 2, 0)
    expect(result[0].id).toBe('3')
    expect(result[1].id).toBe('1')
    expect(result[2].id).toBe('2')
  })

  it('不修改原数组', () => {
    const original = [...rules]
    moveRule(rules, 0, 2)
    expect(rules).toEqual(original)
  })

  it('索引越界时返回原数组', () => {
    const result = moveRule(rules, -1, 1)
    expect(result).toEqual(rules)

    const result2 = moveRule(rules, 10, 1)
    expect(result2).toEqual(rules)

    const result3 = moveRule(rules, 1, -1)
    expect(result3).toEqual(rules)

    const result4 = moveRule(rules, 1, 10)
    expect(result4).toEqual(rules)
  })

  it('空输入返回空数组', () => {
    expect(moveRule(null, 0, 1)).toEqual([])
    expect(moveRule(undefined, 0, 1)).toEqual([])
  })
})

describe('enableAllRules', () => {
  it('启用所有规则', () => {
    const rules = [
      { id: '1', enabled: false },
      { id: '2', enabled: true },
      { id: '3', enabled: false },
    ]
    const result = enableAllRules(rules)
    expect(result.every((r) => r.enabled)).toBe(true)
  })

  it('不修改原数组', () => {
    const rules = [{ id: '1', enabled: false }]
    enableAllRules(rules)
    expect(rules[0].enabled).toBe(false)
  })

  it('空输入返回空数组', () => {
    expect(enableAllRules([])).toEqual([])
    expect(enableAllRules(null)).toEqual([])
    expect(enableAllRules(undefined)).toEqual([])
  })
})

describe('disableAllRules', () => {
  it('禁用所有规则', () => {
    const rules = [
      { id: '1', enabled: true },
      { id: '2', enabled: false },
      { id: '3', enabled: true },
    ]
    const result = disableAllRules(rules)
    expect(result.every((r) => !r.enabled)).toBe(true)
  })

  it('不修改原数组', () => {
    const rules = [{ id: '1', enabled: true }]
    disableAllRules(rules)
    expect(rules[0].enabled).toBe(true)
  })

  it('空输入返回空数组', () => {
    expect(disableAllRules([])).toEqual([])
    expect(disableAllRules(null)).toEqual([])
    expect(disableAllRules(undefined)).toEqual([])
  })
})

describe('formatJson', () => {
  it('格式化有效的 JSON 字符串', () => {
    const input = '{"a":1,"b":2}'
    const output = formatJson(input)
    expect(output).toBe('{\n  "a": 1,\n  "b": 2\n}')
  })

  it('无效 JSON 返回原字符串', () => {
    const input = '{invalid json'
    const output = formatJson(input)
    expect(output).toBe(input)
  })

  it('空值处理', () => {
    expect(formatJson('')).toBe('')
    expect(formatJson(null)).toBe('')
    expect(formatJson(undefined)).toBe('')
  })
})

describe('minifyJson', () => {
  it('压缩有效的 JSON 字符串', () => {
    const input = '{\n  "a": 1,\n  "b": 2\n}'
    const output = minifyJson(input)
    expect(output).toBe('{"a":1,"b":2}')
  })

  it('无效 JSON 返回原字符串', () => {
    const input = '{invalid json'
    const output = minifyJson(input)
    expect(output).toBe(input)
  })

  it('空值处理', () => {
    expect(minifyJson('')).toBe('')
    expect(minifyJson(null)).toBe('')
    expect(minifyJson(undefined)).toBe('')
  })
})

describe('isValidJson', () => {
  it('验证有效的 JSON', () => {
    expect(isValidJson('{"a":1}')).toBe(true)
    expect(isValidJson('[1,2,3]')).toBe(true)
    expect(isValidJson('"string"')).toBe(true)
    expect(isValidJson('123')).toBe(true)
    expect(isValidJson('true')).toBe(true)
    expect(isValidJson('null')).toBe(true)
  })

  it('验证无效的 JSON', () => {
    expect(isValidJson('{invalid}')).toBe(false)
    expect(isValidJson('{a: 1}')).toBe(false)
    expect(isValidJson('undefined')).toBe(false)
  })

  it('空字符串视为有效', () => {
    expect(isValidJson('')).toBe(true)
    expect(isValidJson(null)).toBe(true)
    expect(isValidJson(undefined)).toBe(true)
  })
})

describe('getJsonErrorLine', () => {
  it('有效 JSON 返回 null', () => {
    expect(getJsonErrorLine('{"a":1}')).toBeNull()
  })

  it('无效 JSON 返回行号', () => {
    const result = getJsonErrorLine('{\n  "a": 1\n  invalid\n}')
    expect(result).not.toBeNull()
    expect(typeof result).toBe('number')
  })

  it('空值返回 null', () => {
    expect(getJsonErrorLine('')).toBeNull()
    expect(getJsonErrorLine(null)).toBeNull()
    expect(getJsonErrorLine(undefined)).toBeNull()
  })
})

describe('escapeHtml', () => {
  it('转义 HTML 特殊字符', () => {
    const result = escapeHtml('<div class="test">&</div>')
    expect(result).toBe('&lt;div class=&quot;test&quot;&gt;&amp;&lt;/div&gt;')
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
    expect(result).toContain('&amp;')
    expect(result).toContain('&quot;')
  })

  it('空值返回空字符串', () => {
    expect(escapeHtml('')).toBe('')
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })
})

describe('highlightJson', () => {
  it('对有效 JSON 进行语法高亮', () => {
    const result = highlightJson('{"name": "test", "age": 25, "active": true, "data": null}')
    expect(result).toContain('ni-json-key')
    expect(result).toContain('ni-json-string')
    expect(result).toContain('ni-json-number')
    expect(result).toContain('ni-json-boolean')
    expect(result).toContain('ni-json-null')
  })

  it('对无效 JSON 进行 HTML 转义', () => {
    const result = highlightJson('{invalid <script>}')
    expect(result).not.toContain('<script>')
  })
})

describe('modifyRequestHeaders', () => {
  it('添加和覆盖请求头', () => {
    const headers = { 'Content-Type': 'text/plain', 'X-Custom': 'value1' }
    const ruleHeaders = [
      { key: 'Authorization', value: 'Bearer token', enabled: true },
      { key: 'Content-Type', value: 'application/json', enabled: true },
    ]
    const result = modifyRequestHeaders(headers, ruleHeaders)
    expect(result['Authorization']).toBe('Bearer token')
    expect(result['Content-Type']).toBe('application/json')
    expect(result['X-Custom']).toBe('value1')
  })

  it('跳过禁用的请求头', () => {
    const headers = {}
    const ruleHeaders = [
      { key: 'Authorization', value: 'Bearer token', enabled: false },
      { key: 'X-Custom', value: 'value', enabled: true },
    ]
    const result = modifyRequestHeaders(headers, ruleHeaders)
    expect(result['Authorization']).toBeUndefined()
    expect(result['X-Custom']).toBe('value')
  })

  it('跳过空 key 的请求头', () => {
    const headers = {}
    const ruleHeaders = [
      { key: '', value: 'value', enabled: true },
      { key: 'X-Valid', value: 'value', enabled: true },
    ]
    const result = modifyRequestHeaders(headers, ruleHeaders)
    expect(Object.keys(result).length).toBe(1)
    expect(result['X-Valid']).toBe('value')
  })

  it('不修改原 headers 对象', () => {
    const headers = { 'X-Original': 'value' }
    const ruleHeaders = [{ key: 'X-New', value: 'new', enabled: true }]
    modifyRequestHeaders(headers, ruleHeaders)
    expect(headers['X-New']).toBeUndefined()
  })

  it('空规则 headers 返回原 headers 副本', () => {
    const headers = { 'X-Test': 'value' }
    const result1 = modifyRequestHeaders(headers, [])
    expect(result1).toEqual(headers)
    expect(result1).not.toBe(headers)

    const result2 = modifyRequestHeaders(headers, null)
    expect(result2).toEqual(headers)

    const result3 = modifyRequestHeaders(headers, undefined)
    expect(result3).toEqual(headers)
  })
})

describe('modifyResponseBody', () => {
  it('使用 Mock 数据替换响应体', () => {
    const original = '{"code":0,"data":null}'
    const mock = '{"code":0,"data":{"id":1}}'
    const result = modifyResponseBody(original, mock)
    expect(result).toBe(mock)
  })

  it('空 Mock 数据返回原始响应体', () => {
    const original = '{"code":0}'
    expect(modifyResponseBody(original, '')).toBe(original)
    expect(modifyResponseBody(original, null)).toBe(original)
    expect(modifyResponseBody(original, undefined)).toBe(original)
  })

  it('非 JSON Mock 数据也能替换', () => {
    const original = '{"code":0}'
    const mock = 'plain text response'
    const result = modifyResponseBody(original, mock)
    expect(result).toBe(mock)
  })
})

describe('createMockTemplate', () => {
  it('创建 Mock 模板对象', () => {
    const template = createMockTemplate('测试模板', '{}')
    expect(template).toHaveProperty('id')
    expect(template).toHaveProperty('name')
    expect(template).toHaveProperty('body')
    expect(template).toHaveProperty('createdAt')
    expect(template.name).toBe('测试模板')
    expect(template.body).toBe('{}')
    expect(typeof template.createdAt).toBe('number')
  })
})

describe('createLogEntry', () => {
  it('创建日志条目', () => {
    const log = createLogEntry({
      method: 'GET',
      url: '/api/test',
      statusCode: 200,
      duration: 100,
      intercepted: true,
    })
    expect(log).toHaveProperty('id')
    expect(log).toHaveProperty('timestamp')
    expect(log).toHaveProperty('method')
    expect(log).toHaveProperty('url')
    expect(log).toHaveProperty('statusCode')
    expect(log).toHaveProperty('duration')
    expect(log).toHaveProperty('intercepted')
    expect(log.method).toBe('GET')
    expect(log.url).toBe('/api/test')
    expect(log.statusCode).toBe(200)
    expect(log.duration).toBe(100)
    expect(log.intercepted).toBe(true)
    expect(typeof log.timestamp).toBe('number')
  })

  it('设置默认值', () => {
    const log = createLogEntry({
      method: 'GET',
      url: '/api/test',
      statusCode: 200,
      duration: 100,
    })
    expect(log.intercepted).toBe(false)
    expect(log.requestHeaders).toEqual({})
    expect(log.requestBody).toBe('')
  })
})

describe('filterLogs', () => {
  const logs = [
    { id: '1', method: 'GET', url: '/api/a', statusCode: 200, intercepted: true },
    { id: '2', method: 'POST', url: '/api/b', statusCode: 400, intercepted: false },
    { id: '3', method: 'GET', url: '/api/c', statusCode: 500, intercepted: true },
    { id: '4', method: 'PUT', url: '/api/d', statusCode: 201, intercepted: false },
    { id: '5', method: 'DELETE', url: '/api/e', statusCode: 404, intercepted: true },
  ]

  it('按请求方法过滤', () => {
    const result = filterLogs(logs, { method: 'GET' })
    expect(result.length).toBe(2)
    expect(result.every((l) => l.method === 'GET')).toBe(true)
  })

  it('按状态码分类过滤 - 2xx', () => {
    const result = filterLogs(logs, { statusCode: '2xx' })
    expect(result.length).toBe(2)
    expect(result.every((l) => l.statusCode >= 200 && l.statusCode < 300)).toBe(true)
  })

  it('按状态码分类过滤 - 4xx', () => {
    const result = filterLogs(logs, { statusCode: '4xx' })
    expect(result.length).toBe(2)
    expect(result.every((l) => l.statusCode >= 400 && l.statusCode < 500)).toBe(true)
  })

  it('按状态码分类过滤 - 5xx', () => {
    const result = filterLogs(logs, { statusCode: '5xx' })
    expect(result.length).toBe(1)
    expect(result[0].statusCode).toBe(500)
  })

  it('按是否被拦截过滤', () => {
    const intercepted = filterLogs(logs, { intercepted: true })
    expect(intercepted.length).toBe(3)
    expect(intercepted.every((l) => l.intercepted)).toBe(true)

    const notIntercepted = filterLogs(logs, { intercepted: false })
    expect(notIntercepted.length).toBe(2)
    expect(notIntercepted.every((l) => !l.intercepted)).toBe(true)
  })

  it('组合多个过滤条件', () => {
    const result = filterLogs(logs, { method: 'GET', statusCode: '2xx' })
    expect(result.length).toBe(1)
    expect(result[0].method).toBe('GET')
    expect(result[0].statusCode).toBe(200)
  })

  it('空过滤条件返回所有日志', () => {
    const result = filterLogs(logs, {})
    expect(result.length).toBe(5)
  })

  it('空日志数组返回空数组', () => {
    expect(filterLogs([], { method: 'GET' })).toEqual([])
    expect(filterLogs(null, { method: 'GET' })).toEqual([])
    expect(filterLogs(undefined, { method: 'GET' })).toEqual([])
  })
})

describe('sortLogsByTime', () => {
  const logs = [
    { id: '1', timestamp: 1000 },
    { id: '3', timestamp: 3000 },
    { id: '2', timestamp: 2000 },
  ]

  it('按时间倒序排列（默认）', () => {
    const result = sortLogsByTime(logs)
    expect(result[0].id).toBe('3')
    expect(result[1].id).toBe('2')
    expect(result[2].id).toBe('1')
  })

  it('按时间正序排列', () => {
    const result = sortLogsByTime(logs, false)
    expect(result[0].id).toBe('1')
    expect(result[1].id).toBe('2')
    expect(result[2].id).toBe('3')
  })

  it('不修改原数组', () => {
    const original = [...logs]
    sortLogsByTime(logs)
    expect(logs).toEqual(original)
  })

  it('空输入返回空数组', () => {
    expect(sortLogsByTime([])).toEqual([])
    expect(sortLogsByTime(null)).toEqual([])
    expect(sortLogsByTime(undefined)).toEqual([])
  })
})

describe('getStatusCodeCategory', () => {
  it('返回正确的状态码分类', () => {
    expect(getStatusCodeCategory(200)).toBe('success')
    expect(getStatusCodeCategory(299)).toBe('success')
    expect(getStatusCodeCategory(400)).toBe('warning')
    expect(getStatusCodeCategory(499)).toBe('warning')
    expect(getStatusCodeCategory(500)).toBe('error')
    expect(getStatusCodeCategory(599)).toBe('error')
  })

  it('其他状态码返回 unknown', () => {
    expect(getStatusCodeCategory(100)).toBe('unknown')
    expect(getStatusCodeCategory(300)).toBe('unknown')
    expect(getStatusCodeCategory(0)).toBe('unknown')
    expect(getStatusCodeCategory(null)).toBe('unknown')
    expect(getStatusCodeCategory(undefined)).toBe('unknown')
  })
})

describe('formatTimestamp', () => {
  it('格式化时间戳为 HH:MM:SS.sss 格式', () => {
    const date = new Date('2024-01-01T12:30:45.123Z')
    const result = formatTimestamp(date.getTime())
    expect(typeof result).toBe('string')
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/)
  })

  it('空值返回空字符串', () => {
    expect(formatTimestamp(null)).toBe('')
    expect(formatTimestamp(undefined)).toBe('')
    expect(formatTimestamp(0)).toBe('')
  })
})

describe('formatDuration', () => {
  it('毫秒级显示', () => {
    expect(formatDuration(0)).toBe('0ms')
    expect(formatDuration(500)).toBe('500ms')
    expect(formatDuration(999)).toBe('999ms')
  })

  it('秒级显示', () => {
    expect(formatDuration(1000)).toBe('1.00s')
    expect(formatDuration(1500)).toBe('1.50s')
    expect(formatDuration(2000)).toBe('2.00s')
  })

  it('空值返回空字符串', () => {
    expect(formatDuration(null)).toBe('')
    expect(formatDuration(undefined)).toBe('')
  })
})

describe('executeInterceptorChain', () => {
  const requestRules = [
    {
      id: 'req1',
      name: '添加认证头',
      urlPattern: '/api/auth/*',
      enabled: true,
      modifyHeaders: [
        { key: 'Authorization', value: 'Bearer test-token', enabled: true },
      ],
    },
  ]

  const responseRules = [
    {
      id: 'res1',
      name: 'Mock 用户数据',
      urlPattern: '/api/user/*',
      enabled: true,
      mockBody: '{"code":0,"data":{"id":1,"name":"test"}}',
    },
  ]

  it('请求拦截规则匹配时修改请求头', () => {
    const result = executeInterceptorChain({
      method: 'GET',
      url: '/api/auth/login',
      requestHeaders: { 'Content-Type': 'application/json' },
      requestRules,
      responseRules,
    })
    expect(result.finalRequestHeaders['Authorization']).toBe('Bearer test-token')
    expect(result.finalRequestHeaders['Content-Type']).toBe('application/json')
    expect(result.hitRequestRule).not.toBeNull()
    expect(result.hitRequestRule.id).toBe('req1')
  })

  it('响应拦截规则匹配时修改响应体', () => {
    const result = executeInterceptorChain({
      method: 'GET',
      url: '/api/user/123',
      requestRules,
      responseRules,
      mockOriginalResponse: {
        statusCode: 200,
        headers: {},
        body: '{"code":0,"data":null}',
      },
    })
    expect(result.finalResponse.body).toBe(responseRules[0].mockBody)
    expect(result.hitResponseRule).not.toBeNull()
    expect(result.hitResponseRule.id).toBe('res1')
  })

  it('没有匹配规则时返回原始数据', () => {
    const result = executeInterceptorChain({
      method: 'GET',
      url: '/other/path',
      requestHeaders: { 'X-Custom': 'value' },
      requestRules,
      responseRules,
      mockOriginalResponse: {
        statusCode: 200,
        headers: {},
        body: '{"code":0}',
      },
    })
    expect(result.finalRequestHeaders['X-Custom']).toBe('value')
    expect(result.finalResponse.body).toBe('{"code":0}')
    expect(result.hitRequestRule).toBeNull()
    expect(result.hitResponseRule).toBeNull()
    expect(result.intercepted).toBe(false)
  })

  it('intercepted 标志正确设置', () => {
    const result1 = executeInterceptorChain({
      method: 'GET',
      url: '/api/auth/login',
      requestRules,
      responseRules,
    })
    expect(result1.intercepted).toBe(true)

    const result2 = executeInterceptorChain({
      method: 'GET',
      url: '/api/user/123',
      requestRules,
      responseRules,
    })
    expect(result2.intercepted).toBe(true)

    const result3 = executeInterceptorChain({
      method: 'GET',
      url: '/other',
      requestRules,
      responseRules,
    })
    expect(result3.intercepted).toBe(false)
  })

  it('禁用的规则不生效', () => {
    const disabledRules = [
      { ...requestRules[0], enabled: false },
    ]
    const result = executeInterceptorChain({
      method: 'GET',
      url: '/api/auth/login',
      requestHeaders: {},
      requestRules: disabledRules,
      responseRules: [],
    })
    expect(result.hitRequestRule).toBeNull()
    expect(result.intercepted).toBe(false)
  })
})

describe('exportRulesToJson', () => {
  it('导出规则为 JSON 字符串', () => {
    const data = {
      requestRules: [{ id: '1', name: '测试请求规则' }],
      responseRules: [{ id: '2', name: '测试响应规则' }],
      mockTemplates: [{ id: '3', name: '测试模板' }],
    }
    const jsonStr = exportRulesToJson(data)
    expect(typeof jsonStr).toBe('string')

    const parsed = JSON.parse(jsonStr)
    expect(parsed.version).toBe(1)
    expect(parsed.exportedAt).toBeDefined()
    expect(parsed.requestRules).toEqual(data.requestRules)
    expect(parsed.responseRules).toEqual(data.responseRules)
    expect(parsed.mockTemplates).toEqual(data.mockTemplates)
  })

  it('空数据也能导出', () => {
    const jsonStr = exportRulesToJson({})
    const parsed = JSON.parse(jsonStr)
    expect(parsed.requestRules).toEqual([])
    expect(parsed.responseRules).toEqual([])
    expect(parsed.mockTemplates).toEqual([])
  })
})

describe('importRulesFromJson', () => {
  it('成功导入有效的规则 JSON', () => {
    const data = {
      version: 1,
      requestRules: [
        { id: '1', name: '规则1', urlPattern: '/api/*', enabled: true, modifyHeaders: [] },
      ],
      responseRules: [
        { id: '2', name: '规则2', urlPattern: '/api/user/*', enabled: true, mockBody: '{}' },
      ],
      mockTemplates: [
        { id: '3', name: '模板1', body: '{}', createdAt: 1234567890 },
      ],
    }
    const result = importRulesFromJson(JSON.stringify(data))
    expect(result.success).toBe(true)
    expect(result.data.requestRules.length).toBe(1)
    expect(result.data.responseRules.length).toBe(1)
    expect(result.data.mockTemplates.length).toBe(1)
  })

  it('无效 JSON 返回错误', () => {
    const result = importRulesFromJson('{invalid json')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('非对象 JSON 返回错误', () => {
    const result = importRulesFromJson('"just a string"')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('缺少必要字段的规则返回错误', () => {
    const data = {
      requestRules: [{ name: '缺少 id 和 urlPattern' }],
      responseRules: [],
    }
    const result = importRulesFromJson(JSON.stringify(data))
    expect(result.success).toBe(false)
    expect(result.error).toContain('请求拦截规则')
  })

  it('响应规则缺少必要字段返回错误', () => {
    const data = {
      requestRules: [],
      responseRules: [{ name: '缺少 id 和 urlPattern' }],
    }
    const result = importRulesFromJson(JSON.stringify(data))
    expect(result.success).toBe(false)
    expect(result.error).toContain('响应拦截规则')
  })

  it('空数组规则可以导入', () => {
    const data = {
      requestRules: [],
      responseRules: [],
      mockTemplates: [],
    }
    const result = importRulesFromJson(JSON.stringify(data))
    expect(result.success).toBe(true)
    expect(result.data.requestRules).toEqual([])
    expect(result.data.responseRules).toEqual([])
    expect(result.data.mockTemplates).toEqual([])
  })
})
