export const parseUrl = (url) => {
  if (typeof url !== 'string' || url.trim() === '') {
    return {
      success: false,
      error: '请输入 URL',
      protocol: '',
      hostname: '',
      port: '',
      pathname: '',
      search: '',
      hash: '',
    }
  }

  try {
    const urlObj = new URL(url)
    return {
      success: true,
      error: null,
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || '',
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
    }
  } catch (e) {
    return {
      success: false,
      error: e.message || 'URL 解析失败',
      protocol: '',
      hostname: '',
      port: '',
      pathname: '',
      search: '',
      hash: '',
    }
  }
}

export const parseQueryParams = (search) => {
  const params = []
  if (typeof search !== 'string' || search.trim() === '') {
    return params
  }

  const cleanSearch = search.startsWith('?') ? search.slice(1) : search
  if (cleanSearch === '') {
    return params
  }

  const pairs = cleanSearch.split('&')
  for (const pair of pairs) {
    if (pair === '') continue
    const [key, value] = pair.split('=')
    try {
      params.push({
        key: key ? decodeURIComponent(key.replace(/\+/g, ' ')) : '',
        value: value !== undefined ? decodeURIComponent(value.replace(/\+/g, ' ')) : '',
      })
    } catch {
      params.push({
        key: key || '',
        value: value !== undefined ? value : '',
      })
    }
  }
  return params
}

export const buildQueryString = (params) => {
  if (!Array.isArray(params) || params.length === 0) {
    return ''
  }

  const pairs = []
  for (const param of params) {
    if (!param || param.key === '' && param.value === '') continue
    try {
      const encodedKey = encodeURIComponent(param.key || '').replace(/%20/g, '+')
      const encodedValue = encodeURIComponent(param.value || '').replace(/%20/g, '+')
      pairs.push(`${encodedKey}=${encodedValue}`)
    } catch {
      pairs.push(`${param.key || ''}=${param.value || ''}`)
    }
  }

  return pairs.length > 0 ? `?${pairs.join('&')}` : ''
}

export const buildUrl = (parts) => {
  const { protocol, hostname, port, pathname, search, hash } = parts
  let url = ''

  if (protocol) {
    url += protocol
    if (!protocol.endsWith('//')) {
      url += '//'
    }
  }

  if (hostname) {
    url += hostname
  }

  if (port) {
    url += `:${port}`
  }

  if (pathname) {
    if (!pathname.startsWith('/')) {
      url += '/'
    }
    url += pathname
  } else if (hostname) {
    url += '/'
  }

  if (search) {
    if (!search.startsWith('?')) {
      url += '?'
    }
    url += search
  }

  if (hash) {
    if (!hash.startsWith('#')) {
      url += '#'
    }
    url += hash
  }

  return url
}

export const urlEncode = (text) => {
  if (typeof text !== 'string') {
    return { success: false, error: '输入必须是字符串', result: '' }
  }
  try {
    return { success: true, error: null, result: encodeURIComponent(text) }
  } catch (e) {
    return { success: false, error: e.message || '编码失败', result: '' }
  }
}

export const urlDecode = (text) => {
  if (typeof text !== 'string') {
    return { success: false, error: '输入必须是字符串', result: '' }
  }
  try {
    return { success: true, error: null, result: decodeURIComponent(text.replace(/\+/g, ' ')) }
  } catch (e) {
    return { success: false, error: e.message || '解码失败', result: '' }
  }
}

export const encodeQueryParamsOnly = (url) => {
  if (typeof url !== 'string' || url.trim() === '') {
    return { success: false, error: '请输入 URL', result: '' }
  }

  const parsed = parseUrl(url)
  if (!parsed.success) {
    return { success: false, error: parsed.error, result: url }
  }

  const params = parseQueryParams(parsed.search)
  const encodedPairs = []
  for (const param of params) {
    const encodedKey = encodeURIComponent(param.key || '').replace(/%20/g, '+')
    const encodedValue = encodeURIComponent(param.value || '').replace(/%20/g, '+')
    encodedPairs.push(`${encodedKey}=${encodedValue}`)
  }

  const newSearch = encodedPairs.length > 0 ? `?${encodedPairs.join('&')}` : ''

  const newUrl = buildUrl({
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port,
    pathname: parsed.pathname,
    search: newSearch,
    hash: parsed.hash,
  })

  return { success: true, error: null, result: newUrl }
}

export const base64Encode = (text) => {
  if (typeof text !== 'string') {
    return { success: false, error: '输入必须是字符串', result: '' }
  }
  try {
    const encoded = btoa(unescape(encodeURIComponent(text)))
    return { success: true, error: null, result: encoded }
  } catch (e) {
    return { success: false, error: e.message || 'Base64 编码失败', result: '' }
  }
}

export const base64Decode = (text) => {
  if (typeof text !== 'string') {
    return { success: false, error: '输入必须是字符串', result: '' }
  }
  if (text.trim() === '') {
    return { success: false, error: '请输入 Base64 字符串', result: '' }
  }
  try {
    const decoded = decodeURIComponent(escape(atob(text.trim())))
    return { success: true, error: null, result: decoded }
  } catch {
    return { success: false, error: '非法的 Base64 字符串', result: '' }
  }
}

export const queryParamsToJson = (params) => {
  if (!Array.isArray(params)) {
    return { success: false, error: '参数格式错误', result: '', line: null }
  }

  const obj = {}
  for (const param of params) {
    if (!param) continue
    if (param.key !== '') {
      obj[param.key] = param.value || ''
    }
  }

  try {
    return {
      success: true,
      error: null,
      result: JSON.stringify(obj, null, 2),
      line: null,
    }
  } catch (e) {
    return { success: false, error: e.message || 'JSON 转换失败', result: '', line: null }
  }
}

export const jsonToQueryParams = (jsonText) => {
  if (typeof jsonText !== 'string' || jsonText.trim() === '') {
    return { success: false, error: '请输入 JSON 内容', params: [], line: null, column: null }
  }

  try {
    const obj = JSON.parse(jsonText)
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return { success: false, error: 'JSON 必须是对象类型', params: [], line: null, column: null }
    }

    const params = []
    for (const key of Object.keys(obj)) {
      const value = obj[key]
      params.push({
        key,
        value: value !== null && value !== undefined ? String(value) : '',
      })
    }

    return { success: true, error: null, params, line: null, column: null }
  } catch (e) {
    const msg = e.message || ''
    const lineMatch = msg.match(/line\s+(\d+)/i)
    const columnMatch = msg.match(/column\s+(\d+)/i)
    const posMatch = msg.match(/position\s+(\d+)/i)

    let line = lineMatch ? parseInt(lineMatch[1], 10) : null
    let column = columnMatch ? parseInt(columnMatch[1], 10) : null

    if (line === null && posMatch) {
      const pos = parseInt(posMatch[1], 10)
      const before = jsonText.slice(0, pos)
      line = before.split('\n').length
      const lastNewline = before.lastIndexOf('\n')
      column = lastNewline === -1 ? pos + 1 : pos - lastNewline
    }

    return {
      success: false,
      error: msg || 'JSON 解析错误',
      params: [],
      line,
      column,
    }
  }
}

export const parseBatchUrls = (text) => {
  if (typeof text !== 'string' || text.trim() === '') {
    return { success: false, error: '请输入 URL 列表', results: [] }
  }

  const lines = text.split('\n')
  const results = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === '') {
      results.push({
        index: i + 1,
        url: line,
        protocol: '',
        hostname: '',
        pathname: '',
        paramCount: 0,
        success: false,
        error: '空行',
      })
      continue
    }

    const parsed = parseUrl(line)
    if (!parsed.success) {
      results.push({
        index: i + 1,
        url: line,
        protocol: '',
        hostname: '',
        pathname: '',
        paramCount: 0,
        success: false,
        error: parsed.error,
      })
    } else {
      const params = parseQueryParams(parsed.search)
      results.push({
        index: i + 1,
        url: line,
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        pathname: parsed.pathname,
        paramCount: params.length,
        success: true,
        error: null,
      })
    }
  }

  return { success: true, error: null, results }
}

export const exportToCsv = (results) => {
  if (!Array.isArray(results) || results.length === 0) {
    return { success: false, error: '没有数据可导出', content: '' }
  }

  const headers = ['序号', '完整 URL', '协议', '主机名', '路径', '参数个数', '状态', '错误信息']
  const rows = [headers]

  for (const r of results) {
    rows.push([
      r.index,
      r.url,
      r.protocol,
      r.hostname,
      r.pathname,
      r.paramCount,
      r.success ? '成功' : '失败',
      r.error || '',
    ])
  }

  const escapeCsv = (value) => {
    const str = String(value ?? '')
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvContent = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')
  const bom = '\uFEFF'

  return { success: true, error: null, content: bom + csvContent }
}

export const downloadCsvFile = (content, filename = 'url-parse-results.csv') => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false
  try {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
    return true
  } catch {
    return false
  }
}

export const copyToClipboard = async (text) => {
  if (typeof navigator === 'undefined') return false
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through
  }
  try {
    if (typeof document !== 'undefined') {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return !!ok
    }
  } catch {
    // fall through
  }
  return false
}
