import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  CONNECTION_STATUS,
  DIRECTION,
  DEFAULT_WS_URL,
  MESSAGE_TEMPLATES,
  DEFAULT_HEARTBEAT_INTERVAL,
  DEFAULT_HEARTBEAT_TIMEOUT_THRESHOLD,
  DEFAULT_RECONNECT_ENABLED,
  DEFAULT_RECONNECT_MAX_RETRIES,
  DEFAULT_RECONNECT_INTERVAL,
  generateId,
  formatTimestampMs,
  formatConnectionDuration,
  isValidJson,
  formatJson,
  tryFormatMessage,
  truncateMessage,
  createLogEntry,
  createSystemLog,
  createHistoryEntry,
  addHistory,
  deleteHistory,
  clearHistory,
  loadHistory,
  saveHistory,
  createDefaultSettings,
  loadSettings,
  saveSettings,
  clampValue,
  getStatusColor,
  getStatusText,
  escapeHtml,
  highlightJson,
  filterLogs,
  shouldAutoScroll,
} from '@/pages/websocket-debugger/wsDebuggerUtils'

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

describe('常量', () => {
  it('CONNECTION_STATUS 包含所有状态', () => {
    expect(CONNECTION_STATUS.CONNECTED).toBe('connected')
    expect(CONNECTION_STATUS.CONNECTING).toBe('connecting')
    expect(CONNECTION_STATUS.DISCONNECTED).toBe('disconnected')
    expect(CONNECTION_STATUS.ERROR).toBe('error')
  })

  it('DIRECTION 包含所有方向', () => {
    expect(DIRECTION.SENT).toBe('sent')
    expect(DIRECTION.RECEIVED).toBe('received')
    expect(DIRECTION.SYSTEM).toBe('system')
  })

  it('DEFAULT_WS_URL 有默认值', () => {
    expect(DEFAULT_WS_URL).toBeTruthy()
    expect(DEFAULT_WS_URL).toContain('wss://')
  })

  it('MESSAGE_TEMPLATES 不为空', () => {
    expect(MESSAGE_TEMPLATES.length).toBeGreaterThan(0)
    MESSAGE_TEMPLATES.forEach((tpl) => {
      expect(tpl.label).toBeTruthy()
      expect(tpl.content).toBeTruthy()
    })
  })

  it('默认设置常量在合理范围内', () => {
    expect(DEFAULT_HEARTBEAT_INTERVAL).toBeGreaterThanOrEqual(5)
    expect(DEFAULT_HEARTBEAT_INTERVAL).toBeLessThanOrEqual(60)
    expect(DEFAULT_HEARTBEAT_TIMEOUT_THRESHOLD).toBeGreaterThanOrEqual(1)
    expect(DEFAULT_HEARTBEAT_TIMEOUT_THRESHOLD).toBeLessThanOrEqual(10)
    expect(DEFAULT_RECONNECT_MAX_RETRIES).toBeGreaterThanOrEqual(1)
    expect(DEFAULT_RECONNECT_MAX_RETRIES).toBeLessThanOrEqual(20)
    expect(DEFAULT_RECONNECT_INTERVAL).toBeGreaterThanOrEqual(1)
    expect(DEFAULT_RECONNECT_INTERVAL).toBeLessThanOrEqual(30)
  })
})

describe('generateId', () => {
  it('生成非空字符串 ID', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(id.startsWith('ws-')).toBe(true)
  })

  it('生成不重复的 ID', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('formatTimestampMs', () => {
  it('格式化时间戳为 HH:mm:ss.SSS', () => {
    const date = new Date('2024-06-15T14:32:05.123')
    const result = formatTimestampMs(date)
    expect(result).toBe('14:32:05.123')
  })

  it('接受时间戳数字', () => {
    const ts = new Date('2024-01-01T09:05:03.456').getTime()
    const result = formatTimestampMs(ts)
    expect(result).toBe('09:05:03.456')
  })

  it('补零', () => {
    const date = new Date('2024-06-15T01:02:03.004')
    const result = formatTimestampMs(date)
    expect(result).toBe('01:02:03.004')
  })

  it('空值或无效值返回空字符串', () => {
    expect(formatTimestampMs(null)).toBe('')
    expect(formatTimestampMs(undefined)).toBe('')
    expect(formatTimestampMs('invalid')).toBe('')
    expect(formatTimestampMs(NaN)).toBe('')
  })
})

describe('formatConnectionDuration', () => {
  it('格式化秒数为 HH:MM:SS', () => {
    expect(formatConnectionDuration(0)).toBe('00:00:00')
    expect(formatConnectionDuration(61)).toBe('00:01:01')
    expect(formatConnectionDuration(3661)).toBe('01:01:01')
    expect(formatConnectionDuration(3600)).toBe('01:00:00')
  })

  it('补零', () => {
    expect(formatConnectionDuration(5)).toBe('00:00:05')
    expect(formatConnectionDuration(600)).toBe('00:10:00')
  })

  it('无效值返回 00:00:00', () => {
    expect(formatConnectionDuration(null)).toBe('00:00:00')
    expect(formatConnectionDuration(undefined)).toBe('00:00:00')
    expect(formatConnectionDuration(-1)).toBe('00:00:00')
    expect(formatConnectionDuration('abc')).toBe('00:00:00')
  })
})

describe('isValidJson', () => {
  it('有效 JSON 返回 true', () => {
    expect(isValidJson('{}')).toBe(true)
    expect(isValidJson('[]')).toBe(true)
    expect(isValidJson('{"type":"ping"}')).toBe(true)
    expect(isValidJson('"hello"')).toBe(true)
    expect(isValidJson('123')).toBe(true)
  })

  it('无效 JSON 返回 false', () => {
    expect(isValidJson('{invalid}')).toBe(false)
    expect(isValidJson('hello')).toBe(false)
  })

  it('空值返回 false', () => {
    expect(isValidJson('')).toBe(false)
    expect(isValidJson(null)).toBe(false)
    expect(isValidJson(undefined)).toBe(false)
  })
})

describe('formatJson', () => {
  it('格式化有效的 JSON 字符串', () => {
    const input = '{"name":"test","age":18}'
    const result = formatJson(input)
    expect(result).toBe(JSON.stringify({ name: 'test', age: 18 }, null, 2))
    expect(result).toContain('\n')
  })

  it('空字符串或 null/undefined 原样返回', () => {
    expect(formatJson('')).toBe('')
    expect(formatJson(null)).toBe(null)
    expect(formatJson(undefined)).toBe(undefined)
  })

  it('无效 JSON 返回原字符串', () => {
    const invalid = '{invalid json}'
    expect(formatJson(invalid)).toBe(invalid)
  })
})

describe('tryFormatMessage', () => {
  it('JSON 格式化显示', () => {
    const result = tryFormatMessage('{"type":"ping"}')
    expect(result).toContain('\n')
    expect(result).toContain('  ')
  })

  it('非 JSON 纯文本原样返回', () => {
    expect(tryFormatMessage('hello world')).toBe('hello world')
  })

  it('null/undefined 返回空字符串', () => {
    expect(tryFormatMessage(null)).toBe('')
    expect(tryFormatMessage(undefined)).toBe('')
  })

  it('非字符串类型转为字符串', () => {
    expect(tryFormatMessage(123)).toBe('123')
  })
})

describe('truncateMessage', () => {
  it('短消息不截断', () => {
    expect(truncateMessage('hello', 100)).toBe('hello')
  })

  it('长消息截断并加省略号', () => {
    const long = 'a'.repeat(200)
    const result = truncateMessage(long, 100)
    expect(result.length).toBe(103)
    expect(result.endsWith('...')).toBe(true)
  })

  it('刚好等于长度不截断', () => {
    const msg = 'a'.repeat(100)
    expect(truncateMessage(msg, 100)).toBe(msg)
  })

  it('null/undefined 返回空字符串', () => {
    expect(truncateMessage(null)).toBe('')
    expect(truncateMessage(undefined)).toBe('')
  })

  it('自定义长度', () => {
    const msg = 'abcdef'
    expect(truncateMessage(msg, 3)).toBe('abc...')
  })
})

describe('createLogEntry', () => {
  it('创建发送日志', () => {
    const entry = createLogEntry(DIRECTION.SENT, 'hello')
    expect(entry.direction).toBe('sent')
    expect(entry.content).toBe('hello')
    expect(entry.id).toBeTruthy()
    expect(entry.timestamp).toBeGreaterThan(0)
    expect(entry.expanded).toBe(false)
  })

  it('创建接收日志', () => {
    const entry = createLogEntry(DIRECTION.RECEIVED, '{"type":"pong"}')
    expect(entry.direction).toBe('received')
    expect(entry.content).toBe('{"type":"pong"}')
  })

  it('带 meta 信息', () => {
    const entry = createLogEntry(DIRECTION.SENT, 'ping', { heartbeat: true })
    expect(entry.meta.heartbeat).toBe(true)
  })
})

describe('createSystemLog', () => {
  it('创建系统日志', () => {
    const entry = createSystemLog('连接成功')
    expect(entry.direction).toBe('system')
    expect(entry.content).toBe('连接成功')
    expect(entry.id).toBeTruthy()
  })
})

describe('连接历史管理', () => {
  it('createHistoryEntry 创建历史记录', () => {
    const entry = createHistoryEntry('wss://example.com')
    expect(entry.id).toBeTruthy()
    expect(entry.url).toBe('wss://example.com')
    expect(entry.lastConnectedAt).toBeGreaterThan(0)
  })

  it('addHistory 添加记录，相同 URL 更新时间', () => {
    const entry1 = createHistoryEntry('wss://example.com')
    let history = addHistory([], entry1)
    expect(history).toHaveLength(1)

    const entry2 = createHistoryEntry('wss://example.com')
    history = addHistory(history, entry2)
    expect(history).toHaveLength(1)
    expect(history[0].lastConnectedAt).toBe(entry2.lastConnectedAt)
  })

  it('addHistory 限制最多 50 条', () => {
    let history = []
    for (let i = 0; i < 60; i++) {
      const entry = createHistoryEntry(`wss://server-${i}.com`)
      history = addHistory(history, entry)
    }
    expect(history.length).toBe(50)
  })

  it('deleteHistory 删除指定 ID', () => {
    const e1 = createHistoryEntry('wss://a.com')
    const e2 = createHistoryEntry('wss://b.com')
    const history = addHistory(addHistory([], e1), e2)
    const result = deleteHistory(history, e1.id)
    expect(result).toHaveLength(1)
    expect(result[0].url).toBe('wss://b.com')
  })

  it('clearHistory 清空历史', () => {
    expect(clearHistory()).toEqual([])
  })

  it('saveHistory 和 loadHistory 持久化', () => {
    const entry = createHistoryEntry('wss://test.com')
    const history = [entry]
    saveHistory(history)
    const loaded = loadHistory()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].url).toBe('wss://test.com')
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
    expect(() => saveHistory([])).not.toThrow()
  })
})

describe('设置管理', () => {
  it('createDefaultSettings 创建默认设置', () => {
    const settings = createDefaultSettings()
    expect(settings.heartbeatInterval).toBe(DEFAULT_HEARTBEAT_INTERVAL)
    expect(settings.heartbeatTimeoutThreshold).toBe(DEFAULT_HEARTBEAT_TIMEOUT_THRESHOLD)
    expect(settings.reconnectEnabled).toBe(DEFAULT_RECONNECT_ENABLED)
    expect(settings.reconnectMaxRetries).toBe(DEFAULT_RECONNECT_MAX_RETRIES)
    expect(settings.reconnectInterval).toBe(DEFAULT_RECONNECT_INTERVAL)
  })

  it('saveSettings 和 loadSettings 持久化', () => {
    const settings = {
      ...createDefaultSettings(),
      heartbeatInterval: 30,
      reconnectEnabled: false,
    }
    saveSettings(settings)
    const loaded = loadSettings()
    expect(loaded.heartbeatInterval).toBe(30)
    expect(loaded.reconnectEnabled).toBe(false)
  })

  it('loadSettings 合并不完整数据', () => {
    localStorage.setItem('ws-debugger-settings', JSON.stringify({ heartbeatInterval: 20 }))
    const loaded = loadSettings()
    expect(loaded.heartbeatInterval).toBe(20)
    expect(loaded.heartbeatTimeoutThreshold).toBe(DEFAULT_HEARTBEAT_TIMEOUT_THRESHOLD)
    expect(loaded.reconnectEnabled).toBe(DEFAULT_RECONNECT_ENABLED)
  })

  it('loadSettings localStorage 为空返回默认设置', () => {
    const loaded = loadSettings()
    expect(loaded).toEqual(createDefaultSettings())
  })

  it('loadSettings 异常时返回默认设置', () => {
    localStorage.getItem = () => { throw new Error('test') }
    const loaded = loadSettings()
    expect(loaded).toEqual(createDefaultSettings())
  })

  it('saveSettings 异常时不报错', () => {
    localStorage.setItem = () => { throw new Error('test') }
    expect(() => saveSettings(createDefaultSettings())).not.toThrow()
  })
})

describe('clampValue', () => {
  it('正常值不变', () => {
    expect(clampValue(5, 1, 10, 3)).toBe(5)
  })

  it('低于最小值时取最小值', () => {
    expect(clampValue(0, 1, 10, 3)).toBe(1)
  })

  it('高于最大值时取最大值', () => {
    expect(clampValue(20, 1, 10, 3)).toBe(10)
  })

  it('NaN 返回 fallback', () => {
    expect(clampValue(NaN, 1, 10, 3)).toBe(3)
    expect(clampValue('abc', 1, 10, 5)).toBe(5)
  })

  it('字符串数字正常解析', () => {
    expect(clampValue('7', 1, 10, 3)).toBe(7)
  })
})

describe('getStatusColor', () => {
  it('各状态返回对应颜色', () => {
    expect(getStatusColor(CONNECTION_STATUS.CONNECTED)).toBe('#27ae60')
    expect(getStatusColor(CONNECTION_STATUS.CONNECTING)).toBe('#f39c12')
    expect(getStatusColor(CONNECTION_STATUS.DISCONNECTED)).toBe('#e74c3c')
    expect(getStatusColor(CONNECTION_STATUS.ERROR)).toBe('#95a5a6')
    expect(getStatusColor('unknown')).toBe('#95a5a6')
  })
})

describe('getStatusText', () => {
  it('各状态返回对应文本', () => {
    expect(getStatusText(CONNECTION_STATUS.CONNECTED)).toBe('已连接')
    expect(getStatusText(CONNECTION_STATUS.CONNECTING)).toBe('连接中...')
    expect(getStatusText(CONNECTION_STATUS.DISCONNECTED)).toBe('已断开')
    expect(getStatusText(CONNECTION_STATUS.ERROR)).toBe('错误')
  })

  it('ERROR 状态显示错误原因', () => {
    expect(getStatusText(CONNECTION_STATUS.ERROR, '服务器无响应')).toBe('服务器无响应')
  })

  it('ERROR 状态无原因时显示默认文本', () => {
    expect(getStatusText(CONNECTION_STATUS.ERROR, '')).toBe('错误')
  })

  it('未知状态返回未知', () => {
    expect(getStatusText('unknown')).toBe('未知')
  })
})

describe('escapeHtml', () => {
  it('转义 HTML 特殊字符', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert("xss")&lt;/script&gt;'
    )
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('null/undefined 返回空字符串', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('无特殊字符保持不变', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
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
    expect(result).toContain('ws-hl-property')
  })

  it('高亮字符串值', () => {
    const result = highlightJson('{"name": "test"}')
    expect(result).toContain('ws-hl-string')
  })

  it('高亮数字', () => {
    const result = highlightJson('{"age": 18}')
    expect(result).toContain('ws-hl-number')
  })

  it('高亮关键字', () => {
    const result = highlightJson('{"a": true, "b": null}')
    expect(result).toContain('ws-hl-keyword')
  })

  it('转义 HTML', () => {
    const result = highlightJson('{"html": "<script>"}')
    expect(result).toContain('&lt;')
    expect(result).not.toContain('<script>')
  })
})

describe('filterLogs', () => {
  const sampleLogs = [
    createLogEntry(DIRECTION.SENT, '{"type":"ping"}'),
    createLogEntry(DIRECTION.RECEIVED, '{"type":"pong"}'),
    createLogEntry(DIRECTION.SYSTEM, '连接成功'),
    createLogEntry(DIRECTION.SENT, 'hello world'),
  ]

  it('空关键词返回全部', () => {
    expect(filterLogs(sampleLogs, '')).toHaveLength(4)
    expect(filterLogs(sampleLogs, null)).toHaveLength(4)
    expect(filterLogs(sampleLogs, '  ')).toHaveLength(4)
  })

  it('按内容过滤', () => {
    const result = filterLogs(sampleLogs, 'ping')
    expect(result).toHaveLength(1)
    expect(result[0].content).toBe('{"type":"ping"}')
  })

  it('不区分大小写', () => {
    const result = filterLogs(sampleLogs, 'HELLO')
    expect(result).toHaveLength(1)
  })

  it('匹配系统消息', () => {
    const result = filterLogs(sampleLogs, '连接')
    expect(result).toHaveLength(1)
    expect(result[0].direction).toBe('system')
  })

  it('无匹配返回空数组', () => {
    const result = filterLogs(sampleLogs, 'notfound')
    expect(result).toHaveLength(0)
  })
})

describe('shouldAutoScroll', () => {
  it('null 容器返回 true', () => {
    expect(shouldAutoScroll(null)).toBe(true)
  })

  it('在底部附近返回 true', () => {
    const el = {
      scrollHeight: 1000,
      scrollTop: 920,
      clientHeight: 100,
    }
    expect(shouldAutoScroll(el)).toBe(true)
  })

  it('不在底部返回 false', () => {
    const el = {
      scrollHeight: 1000,
      scrollTop: 0,
      clientHeight: 100,
    }
    expect(shouldAutoScroll(el)).toBe(false)
  })
})
