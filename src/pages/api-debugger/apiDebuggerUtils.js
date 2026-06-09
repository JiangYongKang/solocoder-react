const HISTORY_STORAGE_KEY = 'api-debugger-history'
const ENV_STORAGE_KEY = 'api-debugger-environments'

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export const CONTENT_TYPE_PRESETS = [
  { label: 'JSON', value: 'application/json' },
  { label: 'Form URL Encoded', value: 'application/x-www-form-urlencoded' },
  { label: 'Form Data', value: 'multipart/form-data' },
  { label: 'Plain Text', value: 'text/plain' },
  { label: 'XML', value: 'application/xml' },
]

export const BODY_METHODS = ['POST', 'PUT', 'PATCH']

export function isBodyMethod(method) {
  return BODY_METHODS.includes(method)
}

export function createEmptyKeyValue() {
  return { id: generateId(), key: '', value: '', enabled: true }
}

export function generateId() {
  return `kv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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

export function replaceEnvVariables(text, envVariables) {
  if (text == null) return ''
  if (!envVariables || typeof envVariables !== 'object') return String(text)

  let result = String(text)
  const pattern = /\{\{\s*([^}\s]+)\s*\}\}/g

  result = result.replace(pattern, (_, varName) => {
    if (Object.prototype.hasOwnProperty.call(envVariables, varName)) {
      return String(envVariables[varName])
    }
    return _
  })

  return result
}

export function buildQueryString(params) {
  if (!Array.isArray(params)) return ''

  const enabledParams = params.filter(
    (p) => p.enabled && p.key && p.key.trim() !== ''
  )

  if (enabledParams.length === 0) return ''

  return enabledParams
    .map((p) => {
      const key = encodeURIComponent(p.key.trim())
      const value = encodeURIComponent(p.value || '')
      return `${key}=${value}`
    })
    .join('&')
}

export function buildUrl(baseUrl, queryParams, envVariables) {
  if (!baseUrl) return ''

  const processedUrl = replaceEnvVariables(baseUrl, envVariables)
  const processedParams = queryParams.map((p) => ({
    ...p,
    key: replaceEnvVariables(p.key, envVariables),
    value: replaceEnvVariables(p.value, envVariables),
  }))

  const queryString = buildQueryString(processedParams)
  if (!queryString) return processedUrl

  const separator = processedUrl.includes('?') ? '&' : '?'
  return `${processedUrl}${separator}${queryString}`
}

export function parseQueryString(queryString) {
  if (!queryString) return []
  const clean = queryString.startsWith('?') ? queryString.slice(1) : queryString
  if (!clean) return []

  return clean.split('&').map((pair) => {
    const [key, value] = pair.split('=')
    return {
      id: generateId(),
      key: key ? decodeURIComponent(key) : '',
      value: value ? decodeURIComponent(value) : '',
      enabled: true,
    }
  })
}

export function getStatusCodeCategory(statusCode) {
  if (statusCode == null || typeof statusCode !== 'number') return 'unknown'
  if (statusCode >= 200 && statusCode < 300) return 'success'
  if (statusCode >= 300 && statusCode < 400) return 'redirect'
  if (statusCode >= 400 && statusCode < 500) return 'client-error'
  if (statusCode >= 500 && statusCode < 600) return 'server-error'
  return 'unknown'
}

export function formatBytes(bytes) {
  if (bytes == null || typeof bytes !== 'number' || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatDuration(ms) {
  if (ms == null || typeof ms !== 'number' || ms < 0) return '0 ms'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

export function formatTimestamp(timestamp) {
  if (timestamp == null) return ''
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function createHistoryRecord({ method, url, request, response }) {
  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    method,
    url,
    timestamp: Date.now(),
    favorite: false,
    statusCode: response?.statusCode,
    duration: response?.duration,
    request: {
      method,
      url,
      queryParams: request?.queryParams || [],
      headers: request?.headers || [],
      body: request?.body || '',
    },
  }
}

export function addHistory(history, record) {
  return [record, ...history].slice(0, 100)
}

export function deleteHistory(history, id) {
  return history.filter((h) => h.id !== id)
}

export function clearHistory() {
  return []
}

export function toggleHistoryFavorite(history, id) {
  return history.map((h) =>
    h.id === id ? { ...h, favorite: !h.favorite } : h
  )
}

export function sortHistory(history) {
  return [...history].sort((a, b) => {
    if (a.favorite !== b.favorite) {
      return a.favorite ? -1 : 1
    }
    return (b.timestamp || 0) - (a.timestamp || 0)
  })
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return []
}

export function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  } catch {
    // ignore
  }
}

export function createEnvironment(name, variables = []) {
  return {
    id: `env-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    variables,
  }
}

export function addEnvironment(environments, env) {
  return [...environments, env]
}

export function deleteEnvironment(environments, id) {
  return environments.filter((e) => e.id !== id)
}

export function updateEnvironment(environments, id, updates) {
  return environments.map((e) =>
    e.id === id ? { ...e, ...updates } : e
  )
}

export function envToVariablesObject(env) {
  if (!env || !Array.isArray(env.variables)) return {}
  const result = {}
  for (const v of env.variables) {
    if (v.enabled && v.key && v.key.trim() !== '') {
      result[v.key.trim()] = v.value || ''
    }
  }
  return result
}

export function loadEnvironments() {
  try {
    const raw = localStorage.getItem(ENV_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return createDefaultEnvironments()
}

export function saveEnvironments(environments) {
  try {
    localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify(environments))
  } catch {
    // ignore
  }
}

export function createDefaultEnvironments() {
  return [
    createEnvironment('开发环境', [
      { id: generateId(), key: 'baseUrl', value: 'http://localhost:3000', enabled: true },
      { id: generateId(), key: 'token', value: 'dev-token-123', enabled: true },
    ]),
    createEnvironment('生产环境', [
      { id: generateId(), key: 'baseUrl', value: 'https://api.example.com', enabled: true },
      { id: generateId(), key: 'token', value: '', enabled: false },
    ]),
  ]
}

export function buildHeaders(headersArray, envVariables) {
  const result = {}
  if (!Array.isArray(headersArray)) return result

  for (const h of headersArray) {
    if (h.enabled && h.key && h.key.trim() !== '') {
      const processedKey = replaceEnvVariables(h.key.trim(), envVariables)
      const processedValue = replaceEnvVariables(h.value || '', envVariables)
      result[processedKey] = processedValue
    }
  }

  return result
}

export function hasContentType(headersArray, contentType) {
  if (!Array.isArray(headersArray)) return false
  return headersArray.some(
    (h) =>
      h.enabled &&
      h.key &&
      h.key.toLowerCase().trim() === 'content-type' &&
      h.value &&
      h.value.toLowerCase().includes(contentType.toLowerCase())
  )
}

export function ensureContentTypeHeader(headersArray, contentType) {
  if (!Array.isArray(headersArray)) return headersArray

  const existingIdx = headersArray.findIndex(
    (h) => h.key && h.key.toLowerCase().trim() === 'content-type'
  )

  if (existingIdx >= 0) {
    return headersArray.map((h, i) =>
      i === existingIdx ? { ...h, value: contentType, enabled: true } : h
    )
  }

  return [
    ...headersArray,
    { id: generateId(), key: 'Content-Type', value: contentType, enabled: true },
  ]
}


export function escapeHtml(text) {
  if (text == null) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function highlightJson(jsonString) {
  if (jsonString == null || jsonString === '') return ''

  const escaped = escapeHtml(jsonString)

  let result = escaped
  result = result.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"(\s*:)?/g, (match, str, colon) => {
    if (colon) {
      return `<span class="hl-property">"${str}"</span>${colon}`
    }
    return `<span class="hl-string">"${str}"</span>`
  })

  result = result.replace(/\b(-?\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>')

  result = result.replace(/\b(true|false|null)\b/g, '<span class="hl-keyword">$1</span>')

  return result
}

export function extractResponseContentType(responseHeaders) {
  if (!responseHeaders) return ''
  if (typeof responseHeaders === 'string') return responseHeaders

  if (typeof responseHeaders === 'object') {
    const ct = responseHeaders['content-type'] || responseHeaders['Content-Type']
    return ct || ''
  }

  return ''
}

export function isJsonContentType(contentType) {
  if (!contentType) return false
  return String(contentType).toLowerCase().includes('application/json')
}

export function tryParseResponseBody(body, contentType) {
  if (!body) return { text: body || '', formatted: body || '', isJson: false }

  if (isJsonContentType(contentType) || isValidJson(body)) {
    try {
      const parsed = JSON.parse(body)
      return {
        text: body,
        formatted: JSON.stringify(parsed, null, 2),
        isJson: true,
      }
    } catch {
      // fall through
    }
  }

  return { text: body, formatted: body, isJson: false }
}
