import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  HTTP_METHODS,
  CONTENT_TYPE_PRESETS,
  BODY_METHODS,
  isBodyMethod,
  createEmptyKeyValue,
  generateId,
  formatJson,
  minifyJson,
  isValidJson,
  replaceEnvVariables,
  buildQueryString,
  buildUrl,
  parseQueryString,
  getStatusCodeCategory,
  formatBytes,
  formatDuration,
  formatTimestamp,
  createHistoryRecord,
  addHistory,
  deleteHistory,
  clearHistory,
  toggleHistoryFavorite,
  sortHistory,
  loadHistory,
  saveHistory,
  createEnvironment,
  addEnvironment,
  deleteEnvironment,
  updateEnvironment,
  envToVariablesObject,
  loadEnvironments,
  saveEnvironments,
  createDefaultEnvironments,
  buildHeaders,
  hasContentType,
  ensureContentTypeHeader,
  highlightJson,
  extractResponseContentType,
  isJsonContentType,
  tryParseResponseBody,
  escapeHtml,
} from '@/pages/api-debugger/apiDebuggerUtils'

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
  vi.restoreAllMocks()
})

describe('HTTP_METHODS 和 CONTENT_TYPE_PRESETS 常量', () => {
  it('HTTP_METHODS 包含所有支持的方法', () => {
    expect(HTTP_METHODS).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  })

  it('CONTENT_TYPE_PRESETS 包含常用 Content-Type', () => {
    expect(CONTENT_TYPE_PRESETS.length).toBeGreaterThan(0)
    expect(CONTENT_TYPE_PRESETS.find((p) => p.value === 'application/json')).toBeDefined()
    expect(CONTENT_TYPE_PRESETS.find((p) => p.value === 'application/x-www-form-urlencoded')).toBeDefined()
  })

  it('BODY_METHODS 包含需要请求体的方法', () => {
    expect(BODY_METHODS).toEqual(['POST', 'PUT', 'PATCH'])
  })
})

describe('isBodyMethod', () => {
  it('POST/PUT/PATCH 返回 true', () => {
    expect(isBodyMethod('POST')).toBe(true)
    expect(isBodyMethod('PUT')).toBe(true)
    expect(isBodyMethod('PATCH')).toBe(true)
  })

  it('GET/DELETE 返回 false', () => {
    expect(isBodyMethod('GET')).toBe(false)
    expect(isBodyMethod('DELETE')).toBe(false)
  })

  it('其他方法返回 false', () => {
    expect(isBodyMethod('OPTIONS')).toBe(false)
    expect(isBodyMethod('')).toBe(false)
    expect(isBodyMethod(null)).toBe(false)
    expect(isBodyMethod(undefined)).toBe(false)
  })
})

describe('createEmptyKeyValue 和 generateId', () => {
  it('createEmptyKeyValue 创建空的键值对对象', () => {
    const kv = createEmptyKeyValue()
    expect(kv).toHaveProperty('id')
    expect(kv.key).toBe('')
    expect(kv.value).toBe('')
    expect(kv.enabled).toBe(true)
  })

  it('generateId 生成非空字符串 ID', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(id.startsWith('kv-')).toBe(true)
  })

  it('generateId 生成不重复的 ID', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('formatJson', () => {
  it('格式化有效的 JSON 字符串', () => {
    const input = '{"name":"test","age":18}'
    const result = formatJson(input)
    expect(result).toBe(JSON.stringify({ name: 'test', age: 18 }, null, 2))
    expect(result).toContain('\n')
    expect(result).toContain('  ')
  })

  it('空字符串或 null/undefined 返回空字符串', () => {
    expect(formatJson('')).toBe('')
    expect(formatJson(null)).toBe('')
    expect(formatJson(undefined)).toBe('')
  })

  it('无效 JSON 返回原字符串', () => {
    const invalid = '{invalid json}'
    expect(formatJson(invalid)).toBe(invalid)
  })

  it('数组 JSON 正常格式化', () => {
    const input = '[1,2,3]'
    const result = formatJson(input)
    expect(result).toBe(JSON.stringify([1, 2, 3], null, 2))
  })
})

describe('minifyJson', () => {
  it('压缩格式化的 JSON', () => {
    const formatted = JSON.stringify({ a: 1, b: 2 }, null, 2)
    const result = minifyJson(formatted)
    expect(result).toBe('{"a":1,"b":2}')
    expect(result).not.toContain('\n')
    expect(result).not.toContain('  ')
  })

  it('空字符串或 null/undefined 返回空字符串', () => {
    expect(minifyJson('')).toBe('')
    expect(minifyJson(null)).toBe('')
    expect(minifyJson(undefined)).toBe('')
  })

  it('无效 JSON 返回原字符串', () => {
    const invalid = '{invalid}'
    expect(minifyJson(invalid)).toBe(invalid)
  })
})

describe('isValidJson', () => {
  it('空字符串视为有效', () => {
    expect(isValidJson('')).toBe(true)
    expect(isValidJson(null)).toBe(true)
    expect(isValidJson(undefined)).toBe(true)
  })

  it('有效 JSON 返回 true', () => {
    expect(isValidJson('{}')).toBe(true)
    expect(isValidJson('[]')).toBe(true)
    expect(isValidJson('{"a":1}')).toBe(true)
    expect(isValidJson('[1,2,3]')).toBe(true)
    expect(isValidJson('"hello"')).toBe(true)
    expect(isValidJson('123')).toBe(true)
    expect(isValidJson('true')).toBe(true)
    expect(isValidJson('null')).toBe(true)
  })

  it('无效 JSON 返回 false', () => {
    expect(isValidJson('{a:1}')).toBe(false)
    expect(isValidJson('{"a":1')).toBe(false)
    expect(isValidJson('hello')).toBe(false)
    expect(isValidJson('undefined')).toBe(false)
  })
})

describe('replaceEnvVariables', () => {
  it('替换单个变量', () => {
    const result = replaceEnvVariables('Hello {{name}}', { name: 'World' })
    expect(result).toBe('Hello World')
  })

  it('替换多个变量', () => {
    const result = replaceEnvVariables('{{a}} + {{b}} = {{c}}', { a: '1', b: '2', c: '3' })
    expect(result).toBe('1 + 2 = 3')
  })

  it('变量名前后有空格也能匹配', () => {
    const result = replaceEnvVariables('{{  name  }}', { name: 'test' })
    expect(result).toBe('test')
  })

  it('不存在的变量保持原样', () => {
    const result = replaceEnvVariables('Hello {{unknown}}', { name: 'World' })
    expect(result).toBe('Hello {{unknown}}')
  })

  it('null/undefined 文本返回空字符串', () => {
    expect(replaceEnvVariables(null, {})).toBe('')
    expect(replaceEnvVariables(undefined, {})).toBe('')
  })

  it('非对象环境变量不报错，返回原文本', () => {
    expect(replaceEnvVariables('test', null)).toBe('test')
    expect(replaceEnvVariables('test', undefined)).toBe('test')
    expect(replaceEnvVariables('test', [])).toBe('test')
  })

  it('URL 中的变量替换', () => {
    const result = replaceEnvVariables('{{baseUrl}}/api/users/{{id}}', {
      baseUrl: 'https://api.example.com',
      id: '123',
    })
    expect(result).toBe('https://api.example.com/api/users/123')
  })

  it('变量值为空字符串正常替换', () => {
    const result = replaceEnvVariables('prefix{{empty}}suffix', { empty: '' })
    expect(result).toBe('prefixsuffix')
  })

  it('嵌套变量名不做递归替换', () => {
    const result = replaceEnvVariables('{{outer}}', { outer: '{{inner}}', inner: 'value' })
    expect(result).toBe('{{inner}}')
  })
})

describe('buildQueryString', () => {
  it('构建查询字符串', () => {
    const params = [
      { id: '1', key: 'page', value: '1', enabled: true },
      { id: '2', key: 'size', value: '10', enabled: true },
    ]
    expect(buildQueryString(params)).toBe('page=1&size=10')
  })

  it('只包含启用的参数', () => {
    const params = [
      { id: '1', key: 'a', value: '1', enabled: true },
      { id: '2', key: 'b', value: '2', enabled: false },
    ]
    expect(buildQueryString(params)).toBe('a=1')
  })

  it('忽略空 key 的参数', () => {
    const params = [
      { id: '1', key: '', value: '1', enabled: true },
      { id: '2', key: '  ', value: '2', enabled: true },
      { id: '3', key: 'a', value: '1', enabled: true },
    ]
    expect(buildQueryString(params)).toBe('a=1')
  })

  it('空数组或非数组返回空字符串', () => {
    expect(buildQueryString([])).toBe('')
    expect(buildQueryString(null)).toBe('')
    expect(buildQueryString(undefined)).toBe('')
  })

  it('对 key 和 value 进行 URL 编码', () => {
    const params = [
      { id: '1', key: 'user name', value: '张三&李四', enabled: true },
    ]
    const result = buildQueryString(params)
    expect(result).toContain(encodeURIComponent('user name'))
    expect(result).toContain(encodeURIComponent('张三&李四'))
  })

  it('空 value 也正常处理', () => {
    const params = [
      { id: '1', key: 'flag', value: '', enabled: true },
    ]
    expect(buildQueryString(params)).toBe('flag=')
  })
})

describe('buildUrl', () => {
  it('拼接 URL 和查询参数', () => {
    const result = buildUrl(
      'https://api.example.com/users',
      [{ id: '1', key: 'page', value: '1', enabled: true }],
      {}
    )
    expect(result).toBe('https://api.example.com/users?page=1')
  })

  it('URL 已有 query 时使用 & 连接', () => {
    const result = buildUrl(
      'https://api.example.com?a=1',
      [{ id: '1', key: 'b', value: '2', enabled: true }],
      {}
    )
    expect(result).toBe('https://api.example.com?a=1&b=2')
  })

  it('没有启用的参数时不添加查询字符串', () => {
    const result = buildUrl(
      'https://api.example.com',
      [{ id: '1', key: 'a', value: '1', enabled: false }],
      {}
    )
    expect(result).toBe('https://api.example.com')
  })

  it('空 URL 返回空字符串', () => {
    expect(buildUrl('', [], {})).toBe('')
    expect(buildUrl(null, [], {})).toBe('')
    expect(buildUrl(undefined, [], {})).toBe('')
  })

  it('替换 URL 中的环境变量', () => {
    const result = buildUrl(
      '{{baseUrl}}/users',
      [],
      { baseUrl: 'https://api.example.com' }
    )
    expect(result).toBe('https://api.example.com/users')
  })

  it('替换参数中的环境变量', () => {
    const result = buildUrl(
      'https://api.example.com',
      [{ id: '1', key: 'token', value: '{{authToken}}', enabled: true }],
      { authToken: 'abc123' }
    )
    expect(result).toBe('https://api.example.com?token=abc123')
  })
})

describe('parseQueryString', () => {
  it('解析简单查询字符串', () => {
    const result = parseQueryString('a=1&b=2')
    expect(result).toHaveLength(2)
    expect(result[0].key).toBe('a')
    expect(result[0].value).toBe('1')
    expect(result[0].enabled).toBe(true)
    expect(result[1].key).toBe('b')
    expect(result[1].value).toBe('2')
  })

  it('处理带问号前缀', () => {
    const result = parseQueryString('?a=1')
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('a')
  })

  it('空字符串返回空数组', () => {
    expect(parseQueryString('')).toEqual([])
    expect(parseQueryString(null)).toEqual([])
    expect(parseQueryString(undefined)).toEqual([])
  })

  it('只有问号返回空数组', () => {
    expect(parseQueryString('?')).toEqual([])
  })

  it('解码 URL 编码的参数', () => {
    const result = parseQueryString('name=%E5%BC%A0%E4%B8%89&q=hello%20world')
    expect(result[0].key).toBe('name')
    expect(result[0].value).toBe('张三')
    expect(result[1].value).toBe('hello world')
  })

  it('处理没有 value 的参数', () => {
    const result = parseQueryString('flag')
    expect(result[0].key).toBe('flag')
    expect(result[0].value).toBe('')
  })
})

describe('getStatusCodeCategory', () => {
  it('2xx 返回 success', () => {
    expect(getStatusCodeCategory(200)).toBe('success')
    expect(getStatusCodeCategory(201)).toBe('success')
    expect(getStatusCodeCategory(299)).toBe('success')
  })

  it('3xx 返回 redirect', () => {
    expect(getStatusCodeCategory(300)).toBe('redirect')
    expect(getStatusCodeCategory(302)).toBe('redirect')
    expect(getStatusCodeCategory(399)).toBe('redirect')
  })

  it('4xx 返回 client-error', () => {
    expect(getStatusCodeCategory(400)).toBe('client-error')
    expect(getStatusCodeCategory(404)).toBe('client-error')
    expect(getStatusCodeCategory(499)).toBe('client-error')
  })

  it('5xx 返回 server-error', () => {
    expect(getStatusCodeCategory(500)).toBe('server-error')
    expect(getStatusCodeCategory(503)).toBe('server-error')
    expect(getStatusCodeCategory(599)).toBe('server-error')
  })

  it('其他或无效值返回 unknown', () => {
    expect(getStatusCodeCategory(0)).toBe('unknown')
    expect(getStatusCodeCategory(100)).toBe('unknown')
    expect(getStatusCodeCategory(600)).toBe('unknown')
    expect(getStatusCodeCategory(null)).toBe('unknown')
    expect(getStatusCodeCategory(undefined)).toBe('unknown')
    expect(getStatusCodeCategory('abc')).toBe('unknown')
  })
})

describe('formatBytes', () => {
  it('字节级别显示 B', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(100)).toBe('100 B')
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('KB 级别显示 KB', () => {
    expect(formatBytes(1024)).toBe('1.00 KB')
    expect(formatBytes(1536)).toBe('1.50 KB')
  })

  it('MB 级别显示 MB', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB')
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.50 MB')
  })

  it('无效值返回 0 B', () => {
    expect(formatBytes(null)).toBe('0 B')
    expect(formatBytes(undefined)).toBe('0 B')
    expect(formatBytes(-1)).toBe('0 B')
    expect(formatBytes('abc')).toBe('0 B')
  })
})

describe('formatDuration', () => {
  it('毫秒级别显示 ms', () => {
    expect(formatDuration(0)).toBe('0 ms')
    expect(formatDuration(100)).toBe('100 ms')
    expect(formatDuration(999)).toBe('999 ms')
  })

  it('秒级别显示 s', () => {
    expect(formatDuration(1000)).toBe('1.00 s')
    expect(formatDuration(1500)).toBe('1.50 s')
    expect(formatDuration(12345)).toBe('12.35 s')
  })

  it('无效值返回 0 ms', () => {
    expect(formatDuration(null)).toBe('0 ms')
    expect(formatDuration(undefined)).toBe('0 ms')
    expect(formatDuration(-1)).toBe('0 ms')
    expect(formatDuration('abc')).toBe('0 ms')
  })
})

describe('formatTimestamp', () => {
  it('格式化时间戳为 MM-DD HH:mm:ss', () => {
    const ts = new Date('2024-01-15T09:30:45').getTime()
    const result = formatTimestamp(ts)
    expect(result).toMatch(/^\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    expect(result).toContain('01-15')
    expect(result).toContain('09:30:45')
  })

  it('空值或无效值返回空字符串', () => {
    expect(formatTimestamp(null)).toBe('')
    expect(formatTimestamp(undefined)).toBe('')
    expect(formatTimestamp(0)).toBeTruthy()
    expect(formatTimestamp('invalid')).toBe('')
  })
})

describe('历史记录管理', () => {
  function makeHistoryItem(id, method = 'GET', favorite = false, timestamp = 1000) {
    return {
      id,
      method,
      url: `https://example.com/${id}`,
      timestamp,
      favorite,
      statusCode: 200,
      duration: 100,
      request: { method, url: `https://example.com/${id}`, queryParams: [], headers: [], body: '' },
    }
  }

  it('createHistoryRecord 创建历史记录', () => {
    const record = createHistoryRecord({
      method: 'GET',
      url: 'https://example.com',
      request: { queryParams: [], headers: [], body: '' },
      response: { statusCode: 200, duration: 150 },
    })
    expect(record.id).toBeTruthy()
    expect(record.method).toBe('GET')
    expect(record.url).toBe('https://example.com')
    expect(record.timestamp).toBeGreaterThan(0)
    expect(record.favorite).toBe(false)
    expect(record.statusCode).toBe(200)
    expect(record.duration).toBe(150)
  })

  it('addHistory 添加记录到开头，限制最多 100 条', () => {
    let history = []
    const r1 = makeHistoryItem('a')
    const r2 = makeHistoryItem('b')
    history = addHistory(history, r1)
    history = addHistory(history, r2)
    expect(history[0].id).toBe('b')
    expect(history[1].id).toBe('a')

    const many = Array.from({ length: 150 }, (_, i) => makeHistoryItem(`item-${i}`))
    let bigHistory = []
    for (const item of many) {
      bigHistory = addHistory(bigHistory, item)
    }
    expect(bigHistory.length).toBe(100)
  })

  it('deleteHistory 删除指定 ID', () => {
    const history = [makeHistoryItem('a'), makeHistoryItem('b'), makeHistoryItem('c')]
    const result = deleteHistory(history, 'b')
    expect(result.map((h) => h.id)).toEqual(['a', 'c'])
  })

  it('clearHistory 清空历史', () => {
    expect(clearHistory()).toEqual([])
  })

  it('toggleHistoryFavorite 切换收藏状态', () => {
    const history = [makeHistoryItem('a', 'GET', false)]
    const toggled = toggleHistoryFavorite(history, 'a')
    expect(toggled[0].favorite).toBe(true)
    const toggledAgain = toggleHistoryFavorite(toggled, 'a')
    expect(toggledAgain[0].favorite).toBe(false)
  })

  it('sortHistory 收藏优先，按时间倒序', () => {
    const history = [
      makeHistoryItem('a', 'GET', false, 1000),
      makeHistoryItem('b', 'GET', true, 500),
      makeHistoryItem('c', 'GET', false, 2000),
      makeHistoryItem('d', 'GET', true, 1500),
    ]
    const sorted = sortHistory(history)
    const ids = sorted.map((h) => h.id)
    expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('a'))
    expect(ids.indexOf('d')).toBeLessThan(ids.indexOf('a'))
    const favoriteIds = sorted.filter((h) => h.favorite).map((h) => h.id)
    expect(favoriteIds).toEqual(['d', 'b'])
    const normalIds = sorted.filter((h) => !h.favorite).map((h) => h.id)
    expect(normalIds).toEqual(['c', 'a'])
  })

  it('saveHistory 和 loadHistory 持久化', () => {
    const history = [makeHistoryItem('test')]
    saveHistory(history)
    const loaded = loadHistory()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe('test')
  })

  it('loadHistory localStorage 为空返回空数组', () => {
    expect(loadHistory()).toEqual([])
  })

  it('loadHistory 异常时返回空数组', () => {
    localStorage.getItem = () => { throw new Error('test') }
    expect(loadHistory()).toEqual([])
  })

  it('saveHistory 异常时不报错', () => {
    localStorage.setItem = () => { throw new Error('test') }
    expect(() => saveHistory([makeHistoryItem('a')])).not.toThrow()
  })
})

describe('环境变量管理', () => {
  it('createEnvironment 创建环境', () => {
    const env = createEnvironment('测试环境', [])
    expect(env.id).toBeTruthy()
    expect(env.name).toBe('测试环境')
    expect(env.variables).toEqual([])
  })

  it('addEnvironment 添加环境', () => {
    const envs = [createEnvironment('A')]
    const newEnv = createEnvironment('B')
    const result = addEnvironment(envs, newEnv)
    expect(result).toHaveLength(2)
    expect(result[1].id).toBe(newEnv.id)
  })

  it('deleteEnvironment 删除环境', () => {
    const env1 = createEnvironment('A')
    const env2 = createEnvironment('B')
    const result = deleteEnvironment([env1, env2], env1.id)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(env2.id)
  })

  it('updateEnvironment 更新环境', () => {
    const env = createEnvironment('Old', [])
    const result = updateEnvironment([env], env.id, { name: 'New' })
    expect(result[0].name).toBe('New')
  })

  it('envToVariablesObject 转换为对象，只包含启用的变量', () => {
    const env = createEnvironment('test', [
      { id: '1', key: 'a', value: '1', enabled: true },
      { id: '2', key: 'b', value: '2', enabled: false },
      { id: '3', key: '', value: '3', enabled: true },
      { id: '4', key: '  ', value: '4', enabled: true },
    ])
    const result = envToVariablesObject(env)
    expect(result).toEqual({ a: '1' })
    expect(result).not.toHaveProperty('b')
  })

  it('envToVariablesObject 处理 null/undefined', () => {
    expect(envToVariablesObject(null)).toEqual({})
    expect(envToVariablesObject(undefined)).toEqual({})
  })

  it('createDefaultEnvironments 创建默认环境', () => {
    const defaults = createDefaultEnvironments()
    expect(defaults.length).toBeGreaterThan(0)
    expect(defaults[0].name).toBeTruthy()
  })

  it('saveEnvironments 和 loadEnvironments 持久化', () => {
    const envs = [createEnvironment('测试')]
    saveEnvironments(envs)
    const loaded = loadEnvironments()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].name).toBe('测试')
  })

  it('loadEnvironments 为空时返回默认环境', () => {
    const loaded = loadEnvironments()
    expect(Array.isArray(loaded)).toBe(true)
    expect(loaded.length).toBeGreaterThan(0)
  })

  it('loadEnvironments 异常时返回默认环境', () => {
    localStorage.getItem = () => { throw new Error('test') }
    const loaded = loadEnvironments()
    expect(Array.isArray(loaded)).toBe(true)
    expect(loaded.length).toBeGreaterThan(0)
  })
})

describe('buildHeaders', () => {
  it('构建 headers 对象，只包含启用的', () => {
    const headersArray = [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
      { id: '2', key: 'Authorization', value: 'Bearer token', enabled: true },
      { id: '3', key: 'X-Old', value: 'old', enabled: false },
    ]
    const result = buildHeaders(headersArray, {})
    expect(result['Content-Type']).toBe('application/json')
    expect(result['Authorization']).toBe('Bearer token')
    expect(result).not.toHaveProperty('X-Old')
  })

  it('替换 headers 中的环境变量', () => {
    const headersArray = [
      { id: '1', key: 'Authorization', value: 'Bearer {{token}}', enabled: true },
    ]
    const result = buildHeaders(headersArray, { token: 'abc123' })
    expect(result['Authorization']).toBe('Bearer abc123')
  })

  it('忽略空 key', () => {
    const headersArray = [
      { id: '1', key: '', value: 'val', enabled: true },
      { id: '2', key: 'Valid', value: 'yes', enabled: true },
    ]
    const result = buildHeaders(headersArray, {})
    expect(Object.keys(result)).toEqual(['Valid'])
  })

  it('非数组返回空对象', () => {
    expect(buildHeaders(null, {})).toEqual({})
    expect(buildHeaders(undefined, {})).toEqual({})
  })
})

describe('hasContentType', () => {
  it('检测是否存在指定 Content-Type', () => {
    const headers = [
      { id: '1', key: 'Content-Type', value: 'application/json; charset=utf-8', enabled: true },
    ]
    expect(hasContentType(headers, 'application/json')).toBe(true)
    expect(hasContentType(headers, 'text/html')).toBe(false)
  })

  it('禁用的 header 不参与检测', () => {
    const headers = [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: false },
    ]
    expect(hasContentType(headers, 'application/json')).toBe(false)
  })

  it('不区分大小写', () => {
    const headers = [
      { id: '1', key: 'content-type', value: 'APPLICATION/JSON', enabled: true },
    ]
    expect(hasContentType(headers, 'application/json')).toBe(true)
  })
})

describe('ensureContentTypeHeader', () => {
  it('已存在 Content-Type 时更新', () => {
    const headers = [
      { id: '1', key: 'Content-Type', value: 'text/plain', enabled: true },
      { id: '2', key: 'Accept', value: '*/*', enabled: true },
    ]
    const result = ensureContentTypeHeader(headers, 'application/json')
    expect(result.find((h) => h.key === 'Content-Type').value).toBe('application/json')
    expect(result.find((h) => h.key === 'Content-Type').enabled).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('不存在时添加新的', () => {
    const headers = [
      { id: '1', key: 'Accept', value: '*/*', enabled: true },
    ]
    const result = ensureContentTypeHeader(headers, 'application/json')
    expect(result).toHaveLength(2)
    const ct = result.find((h) => h.key === 'Content-Type')
    expect(ct).toBeDefined()
    expect(ct.value).toBe('application/json')
    expect(ct.enabled).toBe(true)
  })

  it('key 不区分大小写匹配', () => {
    const headers = [
      { id: '1', key: 'content-type', value: 'text/plain', enabled: true },
    ]
    const result = ensureContentTypeHeader(headers, 'application/json')
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe('application/json')
  })
})

describe('highlightJson', () => {
  it('空字符串返回空', () => {
    expect(highlightJson('')).toBe('')
    expect(highlightJson(null)).toBe('')
    expect(highlightJson(undefined)).toBe('')
  })

  it('高亮属性名', () => {
    const result = highlightJson('{"name": "test"}')
    expect(result).toContain('hl-property')
  })

  it('高亮字符串值', () => {
    const result = highlightJson('{"name": "test"}')
    expect(result).toContain('hl-string')
  })

  it('高亮数字', () => {
    const result = highlightJson('{"age": 18}')
    expect(result).toContain('hl-number')
  })

  it('高亮关键字 true/false/null', () => {
    const result = highlightJson('{"a": true, "b": false, "c": null}')
    expect(result).toContain('hl-keyword')
    const matches = result.match(/hl-keyword/g) || []
    expect(matches.length).toBeGreaterThanOrEqual(3)
  })

  it('转义 HTML 特殊字符', () => {
    const result = highlightJson('{"html": "<script>"}')
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
    expect(result).not.toContain('<script>')
  })
})

describe('extractResponseContentType', () => {
  it('从对象中提取 Content-Type', () => {
    expect(extractResponseContentType({ 'content-type': 'application/json' })).toBe('application/json')
    expect(extractResponseContentType({ 'Content-Type': 'text/html' })).toBe('text/html')
  })

  it('字符串直接返回', () => {
    expect(extractResponseContentType('application/json')).toBe('application/json')
  })

  it('空值或其他返回空字符串', () => {
    expect(extractResponseContentType(null)).toBe('')
    expect(extractResponseContentType(undefined)).toBe('')
    expect(extractResponseContentType({})).toBe('')
  })
})

describe('isJsonContentType', () => {
  it('识别 JSON Content-Type', () => {
    expect(isJsonContentType('application/json')).toBe(true)
    expect(isJsonContentType('application/json; charset=utf-8')).toBe(true)
    expect(isJsonContentType('APPLICATION/JSON')).toBe(true)
  })

  it('非 JSON 返回 false', () => {
    expect(isJsonContentType('text/html')).toBe(false)
    expect(isJsonContentType('')).toBe(false)
    expect(isJsonContentType(null)).toBe(false)
    expect(isJsonContentType(undefined)).toBe(false)
  })
})

describe('tryParseResponseBody', () => {
  it('JSON Content-Type 解析并格式化', () => {
    const result = tryParseResponseBody('{"a":1}', 'application/json')
    expect(result.isJson).toBe(true)
    expect(result.formatted).toBe(JSON.stringify({ a: 1 }, null, 2))
  })

  it('非 JSON Content-Type 但内容是 JSON 也解析', () => {
    const result = tryParseResponseBody('{"a":1}', 'text/plain')
    expect(result.isJson).toBe(true)
  })

  it('非 JSON 内容原样返回', () => {
    const html = '<html>hello</html>'
    const result = tryParseResponseBody(html, 'text/html')
    expect(result.isJson).toBe(false)
    expect(result.formatted).toBe(html)
    expect(result.text).toBe(html)
  })

  it('空 body 返回空', () => {
    const result = tryParseResponseBody('', 'application/json')
    expect(result.text).toBe('')
    expect(result.formatted).toBe('')
    expect(result.isJson).toBe(false)
  })

  it('null/undefined body', () => {
    const r1 = tryParseResponseBody(null, 'application/json')
    expect(r1.text).toBe('')
    expect(r1.formatted).toBe('')
    const r2 = tryParseResponseBody(undefined, 'application/json')
    expect(r2.text).toBe('')
    expect(r2.formatted).toBe('')
  })

  it('JSON Content-Type 但内容损坏，原样返回', () => {
    const badJson = '{not valid json'
    const result = tryParseResponseBody(badJson, 'application/json')
    expect(result.isJson).toBe(false)
    expect(result.formatted).toBe(badJson)
  })
})

describe('escapeHtml', () => {
  it('转义 & 符号', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('转义 < 和 > 符号', () => {
    expect(escapeHtml('<div>hello</div>')).toBe('&lt;div&gt;hello&lt;/div&gt;')
  })

  it('同时转义多种特殊字符', () => {
    expect(escapeHtml('<script>alert("xss&more")</script>')).toBe(
      '&lt;script&gt;alert("xss&amp;more")&lt;/script&gt;'
    )
  })

  it('null/undefined 返回空字符串', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('无特殊字符的文本保持不变', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })

  it('空字符串返回空字符串', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('数字被转换为字符串', () => {
    expect(escapeHtml(123)).toBe('123')
  })
})
