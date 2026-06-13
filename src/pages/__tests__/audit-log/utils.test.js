import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
    DEFAULT_RETENTION_DAYS,
    MAX_RETENTION_DAYS,
    MIN_RETENTION_DAYS,
    OPERATION_RESULTS,
    OPERATION_TYPES,
    STORAGE_KEY_CONFIG,
    STORAGE_KEY_LOGS,
} from '../../audit-log/constants'
import {
    buildTrendData,
    cleanupExpiredLogs,
    countRecentFailures,
    exportToCsv,
    filterLogs,
    formatDateKey,
    formatDateTime,
    generateId,
    generateIpAddress,
    generateMockLogs,
    generateResourceName,
    generateSingleLog,
    loadConfig,
    loadLogs,
    paginateLogs,
    saveConfig,
    saveLogs,
    validateRetentionDays,
} from '../../audit-log/utils'

const createMockLocalStorage = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

let originalLocalStorage

beforeAll(() => {
  originalLocalStorage = globalThis.localStorage
  globalThis.localStorage = createMockLocalStorage()
})

afterAll(() => {
  globalThis.localStorage = originalLocalStorage
})

describe('generateId', () => {
  it('生成的ID以 log_ 开头', () => {
    expect(generateId()).toMatch(/^log_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('generateResourceName', () => {
  it('返回非空字符串', () => {
    const name = generateResourceName()
    expect(typeof name).toBe('string')
    expect(name.length).toBeGreaterThan(0)
  })

  it('生成的资源名称包含已知前缀之一', () => {
    const prefixes = ['订单', '用户', '角色', '配置', '报表', '权限', '商品', '部门']
    const name = generateResourceName()
    const hasPrefix = prefixes.some((p) => name.startsWith(p))
    expect(hasPrefix).toBe(true)
  })
})

describe('generateIpAddress', () => {
  it('返回合法的 IP 地址格式', () => {
    const ip = generateIpAddress()
    expect(ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/)
  })
})

describe('formatDateTime', () => {
  it('格式化时间戳为 yyyy-MM-dd HH:mm:ss', () => {
    const ts = new Date(2025, 5, 15, 10, 30, 45).getTime()
    expect(formatDateTime(ts)).toBe('2025-06-15 10:30:45')
  })

  it('空值返回空字符串', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime(undefined)).toBe('')
    expect(formatDateTime('')).toBe('')
  })

  it('补零正确', () => {
    const ts = new Date(2025, 0, 5, 3, 7, 9).getTime()
    expect(formatDateTime(ts)).toBe('2025-01-05 03:07:09')
  })
})

describe('formatDateKey', () => {
  it('提取日期键', () => {
    const ts = new Date(2025, 5, 15).getTime()
    expect(formatDateKey(ts)).toBe('2025-06-15')
  })

  it('空值返回空字符串', () => {
    expect(formatDateKey('')).toBe('')
    expect(formatDateKey(null)).toBe('')
  })
})

describe('generateSingleLog', () => {
  it('生成包含所有必需字段的日志', () => {
    const ts = Date.now()
    const log = generateSingleLog(ts)
    expect(log.id).toBeTruthy()
    expect(log.timestamp).toBe(ts)
    expect(OPERATION_TYPES).toContain(log.operationType)
    expect([OPERATION_RESULTS.SUCCESS, OPERATION_RESULTS.FAILURE]).toContain(log.result)
    expect(typeof log.operator).toBe('string')
    expect(typeof log.resource).toBe('string')
    expect(typeof log.ip).toBe('string')
    expect(log.requestParams).toBeDefined()
    expect(typeof log.sessionId).toBe('string')
  })
})

describe('generateMockLogs', () => {
  it('生成指定数量的日志', () => {
    const logs = generateMockLogs(50)
    expect(logs.length).toBe(50)
  })

  it('默认生成 200 条', () => {
    const logs = generateMockLogs()
    expect(logs.length).toBe(200)
  })

  it('按时间戳降序排列', () => {
    const logs = generateMockLogs(20)
    for (let i = 1; i < logs.length; i++) {
      expect(logs[i - 1].timestamp).toBeGreaterThanOrEqual(logs[i].timestamp)
    }
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveLogs 保存到 localStorage', () => {
    const logs = [{ id: '1', operator: 'admin' }]
    const result = saveLogs(logs)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_LOGS)).toBe(JSON.stringify(logs))
  })

  it('loadLogs 从 localStorage 读取', () => {
    const logs = [{ id: '1', operator: 'admin' }]
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs))
    expect(loadLogs()).toEqual(logs)
  })

  it('loadLogs localStorage 为空时返回空数组', () => {
    expect(loadLogs()).toEqual([])
  })

  it('loadLogs 数据损坏时返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_LOGS, 'invalid-json')
    expect(loadLogs()).toEqual([])
  })

  it('loadLogs 数据非数组时返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify({ not: 'array' }))
    expect(loadLogs()).toEqual([])
  })

  it('saveConfig 保存到 localStorage', () => {
    const config = { retentionDays: 60 }
    const result = saveConfig(config)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_CONFIG)).toBe(JSON.stringify(config))
  })

  it('loadConfig 从 localStorage 读取', () => {
    const config = { retentionDays: 60 }
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config))
    expect(loadConfig()).toEqual(config)
  })

  it('loadConfig 为空时返回默认配置', () => {
    const config = loadConfig()
    expect(config.retentionDays).toBe(DEFAULT_RETENTION_DAYS)
  })

  it('loadConfig 数据损坏时返回默认配置', () => {
    localStorage.setItem(STORAGE_KEY_CONFIG, 'invalid')
    expect(loadConfig().retentionDays).toBe(DEFAULT_RETENTION_DAYS)
  })
})

describe('validateRetentionDays', () => {
  it('有效天数验证通过', () => {
    const result = validateRetentionDays(90)
    expect(result.valid).toBe(true)
    expect(result.value).toBe(90)
  })

  it('最小天数验证通过', () => {
    const result = validateRetentionDays(MIN_RETENTION_DAYS)
    expect(result.valid).toBe(true)
  })

  it('最大天数验证通过', () => {
    const result = validateRetentionDays(MAX_RETENTION_DAYS)
    expect(result.valid).toBe(true)
  })

  it('小于最小天数报错', () => {
    const result = validateRetentionDays(MIN_RETENTION_DAYS - 1)
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('大于最大天数报错', () => {
    const result = validateRetentionDays(MAX_RETENTION_DAYS + 1)
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('非数字报错', () => {
    const result = validateRetentionDays('abc')
    expect(result.valid).toBe(false)
  })

  it('小数报错', () => {
    const result = validateRetentionDays(90.5)
    expect(result.valid).toBe(false)
  })
})

describe('filterLogs', () => {
  const makeLog = (id, overrides = {}) => ({
    id,
    timestamp: Date.now(),
    operator: 'admin',
    operationType: '登录',
    resource: '订单#100',
    result: OPERATION_RESULTS.SUCCESS,
    ip: '192.168.1.1',
    ...overrides,
  })

  const logs = [
    makeLog('1', { operator: '张伟', operationType: '登录', resource: '订单#100', result: OPERATION_RESULTS.SUCCESS }),
    makeLog('2', { operator: '李娜', operationType: '修改', resource: '用户 admin', result: OPERATION_RESULTS.FAILURE }),
    makeLog('3', { operator: '张伟', operationType: '删除', resource: '配置#200', result: OPERATION_RESULTS.SUCCESS }),
    makeLog('4', { operator: 'admin', operationType: '导出', resource: '报表#300', result: OPERATION_RESULTS.FAILURE }),
    makeLog('5', { operator: '王芳', operationType: '权限变更', resource: '角色#400', result: OPERATION_RESULTS.SUCCESS }),
  ]

  it('无筛选条件返回全部', () => {
    expect(filterLogs(logs, {}).length).toBe(5)
  })

  it('按操作人模糊匹配', () => {
    expect(filterLogs(logs, { operator: '张' }).length).toBe(2)
    expect(filterLogs(logs, { operator: 'admin' }).length).toBe(1)
  })

  it('按操作类型筛选', () => {
    expect(filterLogs(logs, { operationTypes: ['登录'] }).length).toBe(1)
    expect(filterLogs(logs, { operationTypes: ['登录', '修改'] }).length).toBe(2)
  })

  it('空操作类型不筛选', () => {
    expect(filterLogs(logs, { operationTypes: [] }).length).toBe(0)
  })

  it('按操作结果筛选', () => {
    expect(filterLogs(logs, { result: OPERATION_RESULTS.SUCCESS }).length).toBe(3)
    expect(filterLogs(logs, { result: OPERATION_RESULTS.FAILURE }).length).toBe(2)
    expect(filterLogs(logs, { result: 'all' }).length).toBe(5)
  })

  it('按操作对象模糊匹配', () => {
    expect(filterLogs(logs, { resource: '订单' }).length).toBe(1)
    expect(filterLogs(logs, { resource: '#' }).length).toBe(4)
  })

  it('按起始日期筛选', () => {
    const now = new Date()
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const twoDaysAgo = todayMidnight - 2 * 24 * 60 * 60 * 1000 + 1000
    const yesterday = todayMidnight - 24 * 60 * 60 * 1000 + 1000
    const logs2 = [
      makeLog('1', { timestamp: twoDaysAgo }),
      makeLog('2', { timestamp: yesterday }),
    ]
    const startDate = new Date(yesterday).toISOString().split('T')[0]
    const result = filterLogs(logs2, { startDate })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('2')
  })

  it('按结束日期筛选', () => {
    const now = new Date()
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const twoDaysAgo = todayMidnight - 2 * 24 * 60 * 60 * 1000 + 1000
    const yesterday = todayMidnight - 24 * 60 * 60 * 1000 + 1000
    const logs2 = [
      makeLog('1', { timestamp: twoDaysAgo }),
      makeLog('2', { timestamp: yesterday }),
    ]
    const endDate = new Date(twoDaysAgo).toISOString().split('T')[0]
    const result = filterLogs(logs2, { endDate })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('组合筛选', () => {
    const result = filterLogs(logs, {
      operator: '张',
      operationTypes: ['登录'],
      result: OPERATION_RESULTS.SUCCESS,
    })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('空关键词不筛选', () => {
    expect(filterLogs(logs, { operator: '   ' }).length).toBe(5)
    expect(filterLogs(logs, { resource: '   ' }).length).toBe(5)
  })
})

describe('paginateLogs', () => {
  const logs = Array.from({ length: 55 }, (_, i) => ({ id: String(i + 1) }))

  it('第一页正确', () => {
    const result = paginateLogs(logs, 1, 20)
    expect(result.items.length).toBe(20)
    expect(result.items[0].id).toBe('1')
    expect(result.items[19].id).toBe('20')
    expect(result.currentPage).toBe(1)
    expect(result.totalPage).toBe(3)
    expect(result.total).toBe(55)
  })

  it('最后一页正确', () => {
    const result = paginateLogs(logs, 3, 20)
    expect(result.items.length).toBe(15)
    expect(result.currentPage).toBe(3)
  })

  it('页码超出范围时修正', () => {
    const result = paginateLogs(logs, 100, 20)
    expect(result.currentPage).toBe(3)
  })

  it('页码小于1时修正', () => {
    const result = paginateLogs(logs, 0, 20)
    expect(result.currentPage).toBe(1)
  })

  it('空列表返回第一页', () => {
    const result = paginateLogs([], 1, 20)
    expect(result.items.length).toBe(0)
    expect(result.totalPage).toBe(1)
  })

  it('自定义每页条数', () => {
    const result = paginateLogs(logs, 1, 50)
    expect(result.items.length).toBe(50)
    expect(result.totalPage).toBe(2)
  })
})

describe('cleanupExpiredLogs', () => {
  it('清理过期日志', () => {
    const now = Date.now()
    const logs = [
      { id: '1', timestamp: now - 100 * 24 * 60 * 60 * 1000 },
      { id: '2', timestamp: now - 10 * 24 * 60 * 60 * 1000 },
      { id: '3', timestamp: now },
    ]
    const result = cleanupExpiredLogs(logs, 30)
    expect(result.logs.length).toBe(2)
    expect(result.removedCount).toBe(1)
  })

  it('无需清理时返回原数据', () => {
    const now = Date.now()
    const logs = [
      { id: '1', timestamp: now },
      { id: '2', timestamp: now - 1000 },
    ]
    const result = cleanupExpiredLogs(logs, 90)
    expect(result.logs.length).toBe(2)
    expect(result.removedCount).toBe(0)
  })

  it('全部过期时清理全部', () => {
    const now = Date.now()
    const logs = [
      { id: '1', timestamp: now - 200 * 24 * 60 * 60 * 1000 },
      { id: '2', timestamp: now - 300 * 24 * 60 * 60 * 1000 },
    ]
    const result = cleanupExpiredLogs(logs, 90)
    expect(result.logs.length).toBe(0)
    expect(result.removedCount).toBe(2)
  })

  it('空列表不变', () => {
    const result = cleanupExpiredLogs([], 90)
    expect(result.logs.length).toBe(0)
    expect(result.removedCount).toBe(0)
  })
})

describe('exportToCsv', () => {
  it('生成 CSV 字符串', () => {
    const logs = [
      {
        timestamp: new Date(2025, 5, 15, 10, 30, 0).getTime(),
        operator: 'admin',
        operationType: '登录',
        resource: '订单#100',
        result: '成功',
        ip: '192.168.1.1',
      },
    ]
    const csv = exportToCsv(logs)
    const lines = csv.split('\n')
    expect(lines.length).toBe(2)
    expect(lines[0]).toContain('操作时间')
    expect(lines[0]).toContain('操作人')
    expect(lines[0]).toContain('操作类型')
    expect(lines[0]).toContain('操作对象')
    expect(lines[0]).toContain('操作结果')
    expect(lines[0]).toContain('IP地址')
    expect(lines[1]).toContain('admin')
    expect(lines[1]).toContain('登录')
    expect(lines[1]).toContain('成功')
  })

  it('空列表只返回表头', () => {
    const csv = exportToCsv([])
    const lines = csv.split('\n')
    expect(lines.length).toBe(1)
    expect(lines[0]).toContain('操作时间')
  })

  it('处理包含双引号的数据', () => {
    const logs = [
      {
        timestamp: Date.now(),
        operator: 'test"user',
        operationType: '登录',
        resource: '订单#100',
        result: '成功',
        ip: '1.1.1.1',
      },
    ]
    const csv = exportToCsv(logs)
    expect(csv).toContain('test""user')
  })
})

describe('buildTrendData', () => {
  it('返回 30 天数据', () => {
    const data = buildTrendData([])
    expect(data.length).toBe(30)
  })

  it('每天数据包含必需字段', () => {
    const data = buildTrendData([])
    data.forEach((d) => {
      expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(d.label).toBeTruthy()
      expect(typeof d.total).toBe('number')
      expect(typeof d.failed).toBe('number')
      expect(typeof d.failureRate).toBe('number')
      expect(typeof d.isAnomaly).toBe('boolean')
    })
  })

  it('正确统计日志数', () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const logs = [
      { timestamp: today + 1000, result: OPERATION_RESULTS.SUCCESS },
      { timestamp: today + 2000, result: OPERATION_RESULTS.SUCCESS },
      { timestamp: today + 3000, result: OPERATION_RESULTS.SUCCESS },
      { timestamp: today + 4000, result: OPERATION_RESULTS.SUCCESS },
      { timestamp: today + 5000, result: OPERATION_RESULTS.FAILURE },
    ]
    const data = buildTrendData(logs)
    const todayEntry = data.find((d) => d.date === formatDateKey(today))
    expect(todayEntry).toBeDefined()
    expect(todayEntry.total).toBe(5)
    expect(todayEntry.failed).toBe(1)
    expect(todayEntry.failureRate).toBeCloseTo(1 / 5)
    expect(todayEntry.isAnomaly).toBe(false)
  })

  it('失败率超过 20% 标记异常', () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const logs = [
      { timestamp: today + 1000, result: OPERATION_RESULTS.SUCCESS },
      { timestamp: today + 2000, result: OPERATION_RESULTS.FAILURE },
      { timestamp: today + 3000, result: OPERATION_RESULTS.FAILURE },
    ]
    const data = buildTrendData(logs)
    const todayEntry = data.find((d) => d.date === formatDateKey(today))
    expect(todayEntry.isAnomaly).toBe(true)
  })

  it('忽略 30 天前的日志', () => {
    const oldTs = Date.now() - 31 * 24 * 60 * 60 * 1000
    const logs = [{ timestamp: oldTs, result: OPERATION_RESULTS.SUCCESS }]
    const data = buildTrendData(logs)
    const totalOps = data.reduce((sum, d) => sum + d.total, 0)
    expect(totalOps).toBe(0)
  })

  it('无日志时所有天 total 为 0', () => {
    const data = buildTrendData([])
    data.forEach((d) => {
      expect(d.total).toBe(0)
      expect(d.failed).toBe(0)
      expect(d.isAnomaly).toBe(false)
    })
  })
})

describe('countRecentFailures', () => {
  it('统计 24 小时内失败操作', () => {
    const now = Date.now()
    const logs = [
      { timestamp: now - 1000, result: OPERATION_RESULTS.FAILURE },
      { timestamp: now - 2000, result: OPERATION_RESULTS.SUCCESS },
      { timestamp: now - 23 * 60 * 60 * 1000, result: OPERATION_RESULTS.FAILURE },
      { timestamp: now - 25 * 60 * 60 * 1000, result: OPERATION_RESULTS.FAILURE },
    ]
    expect(countRecentFailures(logs, 24)).toBe(2)
  })

  it('无失败操作返回 0', () => {
    const now = Date.now()
    const logs = [
      { timestamp: now - 1000, result: OPERATION_RESULTS.SUCCESS },
    ]
    expect(countRecentFailures(logs, 24)).toBe(0)
  })

  it('空列表返回 0', () => {
    expect(countRecentFailures([], 24)).toBe(0)
  })

  it('自定义小时数', () => {
    const now = Date.now()
    const logs = [
      { timestamp: now - 1000, result: OPERATION_RESULTS.FAILURE },
      { timestamp: now - 2 * 60 * 60 * 1000, result: OPERATION_RESULTS.FAILURE },
      { timestamp: now - 5 * 60 * 60 * 1000, result: OPERATION_RESULTS.FAILURE },
    ]
    expect(countRecentFailures(logs, 3)).toBe(2)
  })
})
