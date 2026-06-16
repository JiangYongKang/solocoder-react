export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE']

export const MOCK_TEMPLATES = [
  {
    name: '用户列表',
    value: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        list: [
          { id: 1, name: '张三', age: 25, email: 'zhangsan@example.com' },
          { id: 2, name: '李四', age: 30, email: 'lisi@example.com' },
          { id: 3, name: '王五', age: 28, email: 'wangwu@example.com' },
        ],
        total: 3,
      },
    }, null, 2),
  },
  {
    name: '商品详情',
    value: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        id: 1001,
        name: '智能手机 Pro',
        price: 3999,
        stock: 150,
        description: '高性能智能手机，配备最新处理器',
        images: [
          'https://example.com/img1.jpg',
          'https://example.com/img2.jpg',
        ],
      },
    }, null, 2),
  },
  {
    name: '分页数据',
    value: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        list: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          title: `项目 ${i + 1}`,
          createdAt: '2024-01-01 12:00:00',
        })),
        pagination: {
          page: 1,
          pageSize: 10,
          total: 100,
          totalPages: 10,
        },
      },
    }, null, 2),
  },
  {
    name: '错误响应',
    value: JSON.stringify({
      code: 500,
      message: '服务器内部错误',
      data: null,
    }, null, 2),
  },
  {
    name: '空数据',
    value: JSON.stringify({
      code: 0,
      message: 'success',
      data: {
        list: [],
        total: 0,
      },
    }, null, 2),
  },
]

export function generateId() {
  return `ni-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyKeyValue() {
  return { id: generateId(), key: '', value: '', enabled: true }
}

export function wildcardMatch(pattern, url) {
  if (!pattern || !url) return false

  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')

  const regex = new RegExp(`^${regexStr}$`)
  return regex.test(url)
}

export function matchFirstRule(rules, url) {
  if (!Array.isArray(rules) || rules.length === 0) return null

  for (const rule of rules) {
    if (!rule.enabled) continue
    if (wildcardMatch(rule.urlPattern, url)) {
      return rule
    }
  }

  return null
}

export function matchAllRules(rules, url) {
  if (!Array.isArray(rules) || rules.length === 0) return []

  return rules.filter((rule) => rule.enabled && wildcardMatch(rule.urlPattern, url))
}

export function createRequestRule(name = '', urlPattern = '') {
  return {
    id: generateId(),
    name,
    urlPattern,
    enabled: true,
    modifyHeaders: [],
  }
}

export function createResponseRule(name = '', urlPattern = '', mockBody = '') {
  return {
    id: generateId(),
    name,
    urlPattern,
    enabled: true,
    mockBody,
  }
}

export function sortRulesByPriority(rules) {
  if (!Array.isArray(rules)) return []
  return [...rules]
}

export function moveRule(rules, fromIndex, toIndex) {
  if (!Array.isArray(rules)) return []
  if (fromIndex < 0 || fromIndex >= rules.length) return rules
  if (toIndex < 0 || toIndex >= rules.length) return rules

  const result = [...rules]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}

export function enableAllRules(rules) {
  if (!Array.isArray(rules)) return []
  return rules.map((rule) => ({ ...rule, enabled: true }))
}

export function disableAllRules(rules) {
  if (!Array.isArray(rules)) return []
  return rules.map((rule) => ({ ...rule, enabled: false }))
}

export function formatJson(jsonString) {
  if (jsonString == null || jsonString === '') return ''
  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return jsonString
  }
}

export function minifyJson(jsonString) {
  if (jsonString == null || jsonString === '') return ''
  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed)
  } catch {
    return jsonString
  }
}

export function isValidJson(jsonString) {
  if (jsonString == null || jsonString === '') return true
  try {
    JSON.parse(jsonString)
    return true
  } catch {
    return false
  }
}

export function getJsonErrorLine(jsonString) {
  if (jsonString == null || jsonString === '') return null
  try {
    JSON.parse(jsonString)
    return null
  } catch (e) {
    const match = e.message?.match(/line (\d+)/i)
    if (match) {
      return parseInt(match[1], 10)
    }
    return 1
  }
}

export function escapeHtml(text) {
  if (text == null) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function highlightJson(jsonString) {
  if (!isValidJson(jsonString)) {
    return escapeHtml(jsonString)
  }

  let formatted = formatJson(jsonString)
  formatted = escapeHtml(formatted)

  formatted = formatted.replace(
    /(&quot;(?:\\.|[^&"])*&quot;(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'ni-json-number'
      if (/^&quot;/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'ni-json-key'
        } else {
          cls = 'ni-json-string'
        }
      } else if (/true|false/.test(match)) {
        cls = 'ni-json-boolean'
      } else if (/null/.test(match)) {
        cls = 'ni-json-null'
      }
      return `<span class="${cls}">${match}</span>`
    }
  )

  return formatted
}

export function modifyRequestHeaders(headers, ruleHeaders) {
  const result = { ...headers }

  if (!Array.isArray(ruleHeaders)) {
    return result
  }

  for (const kv of ruleHeaders) {
    if (!kv.enabled || !kv.key) continue
    result[kv.key] = kv.value
  }

  return result
}

export function modifyResponseBody(originalBody, mockBody) {
  if (mockBody == null || mockBody === '') {
    return originalBody
  }

  if (isValidJson(mockBody)) {
    return mockBody
  }

  return mockBody
}

export function createMockTemplate(name, body) {
  return {
    id: generateId(),
    name,
    body,
    createdAt: Date.now(),
  }
}

export function createLogEntry({
  method,
  url,
  statusCode,
  duration,
  intercepted = false,
  requestHeaders = {},
  requestBody = '',
  responseHeaders = {},
  originalResponseBody = '',
  finalResponseBody = '',
  hitRequestRule = null,
  hitResponseRule = null,
}) {
  return {
    id: generateId(),
    timestamp: Date.now(),
    method,
    url,
    statusCode,
    duration,
    intercepted,
    requestHeaders,
    requestBody,
    responseHeaders,
    originalResponseBody,
    finalResponseBody,
    hitRequestRule,
    hitResponseRule,
  }
}

export function filterLogs(logs, filters = {}) {
  if (!Array.isArray(logs)) return []

  return logs.filter((log) => {
    if (filters.method && log.method !== filters.method) return false
    if (filters.statusCode) {
      if (filters.statusCode === '2xx') {
        if (log.statusCode < 200 || log.statusCode >= 300) return false
      } else if (filters.statusCode === '4xx') {
        if (log.statusCode < 400 || log.statusCode >= 500) return false
      } else if (filters.statusCode === '5xx') {
        if (log.statusCode < 500 || log.statusCode >= 600) return false
      }
    }
    if (filters.intercepted === true && !log.intercepted) return false
    if (filters.intercepted === false && log.intercepted) return false

    return true
  })
}

export function sortLogsByTime(logs, descending = true) {
  if (!Array.isArray(logs)) return []
  const result = [...logs]
  result.sort((a, b) => {
    const diff = a.timestamp - b.timestamp
    return descending ? -diff : diff
  })
  return result
}

export function getStatusCodeCategory(statusCode) {
  if (!statusCode) return 'unknown'
  if (statusCode >= 200 && statusCode < 300) return 'success'
  if (statusCode >= 400 && statusCode < 500) return 'warning'
  if (statusCode >= 500) return 'error'
  return 'unknown'
}

export function formatTimestamp(ts) {
  if (!ts) return ''
  const date = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${ms}`
}

export function formatDuration(ms) {
  if (ms == null) return ''
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function executeInterceptorChain({
  url,
  requestHeaders = {},
  requestRules = [],
  responseRules = [],
  mockOriginalResponse = null,
}) {
  const hitRequestRule = matchFirstRule(requestRules, url)
  const finalRequestHeaders = hitRequestRule
    ? modifyRequestHeaders(requestHeaders, hitRequestRule.modifyHeaders)
    : { ...requestHeaders }

  const originalResponse = mockOriginalResponse || {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: 0, message: 'success', data: null }),
  }

  const hitResponseRule = matchFirstRule(responseRules, url)
  const finalResponseBody = hitResponseRule
    ? modifyResponseBody(originalResponse.body, hitResponseRule.mockBody)
    : originalResponse.body

  const intercepted = !!(hitRequestRule || hitResponseRule)

  const finalResponse = {
    ...originalResponse,
    body: finalResponseBody,
  }

  return {
    finalRequestHeaders,
    originalResponse,
    finalResponse,
    hitRequestRule,
    hitResponseRule,
    intercepted,
  }
}

export function exportRulesToJson({ requestRules, responseRules, mockTemplates }) {
  const data = {
    version: 1,
    exportedAt: Date.now(),
    requestRules: requestRules || [],
    responseRules: responseRules || [],
    mockTemplates: mockTemplates || [],
  }
  return JSON.stringify(data, null, 2)
}

export function importRulesFromJson(jsonString) {
  try {
    const data = JSON.parse(jsonString)

    if (typeof data !== 'object' || data === null) {
      return { success: false, error: '格式错误：不是有效的 JSON 对象' }
    }

    const requestRules = Array.isArray(data.requestRules) ? data.requestRules : []
    const responseRules = Array.isArray(data.responseRules) ? data.responseRules : []
    const mockTemplates = Array.isArray(data.mockTemplates) ? data.mockTemplates : []

    for (const rule of requestRules) {
      if (!rule.id || !rule.urlPattern) {
        return { success: false, error: '格式错误：请求拦截规则缺少必要字段' }
      }
    }

    for (const rule of responseRules) {
      if (!rule.id || !rule.urlPattern) {
        return { success: false, error: '格式错误：响应拦截规则缺少必要字段' }
      }
    }

    return {
      success: true,
      data: {
        requestRules,
        responseRules,
        mockTemplates,
      },
    }
  } catch (e) {
    return { success: false, error: `JSON 解析失败：${e.message}` }
  }
}
