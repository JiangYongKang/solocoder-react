import { describe, expect, it } from 'vitest'
import { TRUNCATE_LENGTH } from '../../log-analyzer/constants'
import {
  countByLevel,
  countKeywordByHour,
  countMultipleKeywordsByHour,
  filterByRegex,
  filterByTimeRange,
  formatDateTime,
  getHighlightRanges,
  getHourKey,
  getLogLevelBadgeClass,
  getStatsMax,
  isLongContent,
  isValidRegex,
  parseLogLine,
  parseLogs,
  parseTimestamp,
  truncateContent,
  validateTimeRange,
} from '../../log-analyzer/utils'

describe('parseTimestamp', () => {
  it('正确解析有效时间戳字符串', () => {
    const ts = parseTimestamp('2024-03-15 14:32:01')
    expect(ts).toBeTypeOf('number')
    const date = new Date(ts)
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(2)
    expect(date.getDate()).toBe(15)
    expect(date.getHours()).toBe(14)
    expect(date.getMinutes()).toBe(32)
    expect(date.getSeconds()).toBe(1)
  })

  it('空字符串返回 null', () => {
    expect(parseTimestamp('')).toBe(null)
  })

  it('null 返回 null', () => {
    expect(parseTimestamp(null)).toBe(null)
  })

  it('无效格式返回 null', () => {
    expect(parseTimestamp('invalid-date')).toBe(null)
  })

  it('补零正确解析', () => {
    const ts = parseTimestamp('2024-01-05 03:07:09')
    const date = new Date(ts)
    expect(date.getMonth()).toBe(0)
    expect(date.getDate()).toBe(5)
    expect(date.getHours()).toBe(3)
    expect(date.getMinutes()).toBe(7)
    expect(date.getSeconds()).toBe(9)
  })
})

describe('parseLogLine', () => {
  it('正确解析有效日志行', () => {
    const line = '[2024-03-15 14:32:01] [ERROR] [auth-service] 用户登录失败：密码错误'
    const result = parseLogLine(line)
    expect(result.isValid).toBe(true)
    expect(result.timestampStr).toBe('2024-03-15 14:32:01')
    expect(result.level).toBe('ERROR')
    expect(result.module).toBe('auth-service')
    expect(result.content).toBe('用户登录失败：密码错误')
    expect(result.timestamp).toBeTypeOf('number')
  })

  it('解析 INFO 级别日志', () => {
    const line = '[2024-03-15 08:15:32] [INFO] [auth-service] 用户登录成功'
    const result = parseLogLine(line)
    expect(result.isValid).toBe(true)
    expect(result.level).toBe('INFO')
    expect(result.module).toBe('auth-service')
  })

  it('解析 WARN 级别日志', () => {
    const line = '[2024-03-15 09:15:20] [WARN] [api-gateway] 请求频率过高'
    const result = parseLogLine(line)
    expect(result.isValid).toBe(true)
    expect(result.level).toBe('WARN')
  })

  it('解析 DEBUG 级别日志', () => {
    const line = '[2024-03-15 10:30:45] [DEBUG] [cache-service] 缓存命中率: 87.5%'
    const result = parseLogLine(line)
    expect(result.isValid).toBe(true)
    expect(result.level).toBe('DEBUG')
  })

  it('无法解析的行标记为无效', () => {
    const line = '这是一行无法解析的日志文本'
    const result = parseLogLine(line)
    expect(result.isValid).toBe(false)
    expect(result.timestamp).toBe(null)
    expect(result.level).toBe(null)
    expect(result.module).toBe(null)
    expect(result.content).toBe(line)
    expect(result.raw).toBe(line)
  })

  it('空行返回 null', () => {
    expect(parseLogLine('')).toBe(null)
  })

  it('只有空格的行返回 null', () => {
    expect(parseLogLine('   ')).toBe(null)
  })

  it('null 返回 null', () => {
    expect(parseLogLine(null)).toBe(null)
  })

  it('模块名包含特殊字符', () => {
    const line = '[2024-03-15 14:32:01] [ERROR] [auth-service-v2.0] 登录失败'
    const result = parseLogLine(line)
    expect(result.isValid).toBe(true)
    expect(result.module).toBe('auth-service-v2.0')
  })

  it('日志内容包含括号', () => {
    const line = '[2024-03-15 14:32:01] [INFO] [service] 处理请求 (id: 123)'
    const result = parseLogLine(line)
    expect(result.isValid).toBe(true)
    expect(result.content).toBe('处理请求 (id: 123)')
  })
})

describe('parseLogs', () => {
  it('解析多行日志', () => {
    const text = `[2024-03-15 08:15:32] [INFO] [auth-service] 登录成功
[2024-03-15 08:16:01] [ERROR] [auth-service] 登录失败
无效日志行
[2024-03-15 08:17:10] [WARN] [service] 警告信息`

    const logs = parseLogs(text)
    expect(logs.length).toBe(4)
    expect(logs[0].isValid).toBe(true)
    expect(logs[0].level).toBe('INFO')
    expect(logs[1].isValid).toBe(true)
    expect(logs[1].level).toBe('ERROR')
    expect(logs[2].isValid).toBe(false)
    expect(logs[3].isValid).toBe(true)
    expect(logs[3].level).toBe('WARN')
  })

  it('每条日志有唯一 id', () => {
    const text = `[2024-03-15 08:15:32] [INFO] [s1] a
[2024-03-15 08:15:33] [INFO] [s2] b
[2024-03-15 08:15:34] [INFO] [s3] c`
    const logs = parseLogs(text)
    const ids = new Set(logs.map((l) => l.id))
    expect(ids.size).toBe(3)
  })

  it('空文本返回空数组', () => {
    expect(parseLogs('')).toEqual([])
  })

  it('null 返回空数组', () => {
    expect(parseLogs(null)).toEqual([])
  })

  it('只有空行返回空数组', () => {
    expect(parseLogs('\n\n\n')).toEqual([])
  })
})

describe('isValidRegex', () => {
  it('有效正则返回 true', () => {
    expect(isValidRegex('error')).toBe(true)
    expect(isValidRegex('\\d+')).toBe(true)
    expect(isValidRegex('[a-z]+')).toBe(true)
  })

  it('空字符串返回 true', () => {
    expect(isValidRegex('')).toBe(true)
  })

  it('null 返回 true', () => {
    expect(isValidRegex(null)).toBe(true)
  })

  it('无效正则返回 false', () => {
    expect(isValidRegex('[')).toBe(false)
    expect(isValidRegex('*')).toBe(false)
    expect(isValidRegex('(?abc)')).toBe(false)
  })
})

describe('filterByRegex', () => {
  const makeLog = (id, raw, isValid = true) => {
    if (isValid) {
      const match = raw.match(/^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\]\s+\[(\w+)\]\s+\[([^\]]+)\]\s+(.*)$/)
      if (match) {
        return {
          id,
          isValid: true,
          raw,
          timestampStr: match[1],
          timestamp: new Date(match[1]).getTime(),
          level: match[2].toUpperCase(),
          module: match[3],
          content: match[4],
        }
      }
    }
    return {
      id,
      isValid: false,
      raw,
      timestamp: null,
      level: null,
      module: null,
      content: raw,
    }
  }

  const logs = [
    makeLog('1', '[2024-03-15 08:15:32] [INFO] [auth-service] 用户登录成功', true),
    makeLog('2', '[2024-03-15 09:10:00] [ERROR] [payment-service] 支付网关超时', true),
    makeLog('3', '[2024-03-15 10:00:00] [WARN] [inventory-service] 库存不足', true),
    makeLog('4', '[2024-03-15 11:00:00] [DEBUG] [cache-service] 缓存命中', true),
    makeLog('5', '这是无效行', false),
  ]

  it('空模式返回全部日志', () => {
    expect(filterByRegex(logs, '').length).toBe(5)
  })

  it('按内容过滤日志', () => {
    const result = filterByRegex(logs, '登录')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('正则表达式匹配', () => {
    const result = filterByRegex(logs, '用户.*成功')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('大小写敏感', () => {
    const result = filterByRegex(logs, 'ERROR', true)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('2')
  })

  it('大小写不敏感', () => {
    const result = filterByRegex(logs, 'error', false)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('2')
  })

  it('无效正则返回全部日志', () => {
    const result = filterByRegex(logs, '[')
    expect(result.length).toBe(5)
  })

  it('无效日志行也参与过滤', () => {
    const result = filterByRegex(logs, '无效')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('5')
  })

  it('搜索来源模块名能匹配到有效日志', () => {
    const result = filterByRegex(logs, 'auth-service')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
    expect(result[0].module).toBe('auth-service')
  })

  it('搜索级别名称能匹配到有效日志', () => {
    const result = filterByRegex(logs, 'WARN')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('3')
    expect(result[0].level).toBe('WARN')
  })

  it('搜索时间戳日期能匹配到有效日志', () => {
    const result = filterByRegex(logs, '2024-03-15')
    expect(result.length).toBe(4)
  })

  it('搜索具体时间能匹配到有效日志', () => {
    const result = filterByRegex(logs, '08:15:32')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('搜索 service 关键词匹配多个模块', () => {
    const result = filterByRegex(logs, 'service')
    expect(result.length).toBe(4)
    expect(result.map((l) => l.id)).toEqual(['1', '2', '3', '4'])
  })

  it('整行原始文本搜索能匹配内容和模块组合', () => {
    const result = filterByRegex(logs, 'auth.*登录')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })
})

describe('getHighlightRanges', () => {
  it('返回正确的高亮范围', () => {
    const text = '用户登录成功'
    const ranges = getHighlightRanges(text, '登录')
    expect(ranges.length).toBe(1)
    expect(ranges[0].start).toBe(2)
    expect(ranges[0].end).toBe(4)
    expect(ranges[0].text).toBe('登录')
  })

  it('多个匹配结果', () => {
    const text = 'error error error'
    const ranges = getHighlightRanges(text, 'error')
    expect(ranges.length).toBe(3)
    expect(ranges[0].start).toBe(0)
    expect(ranges[1].start).toBe(6)
    expect(ranges[2].start).toBe(12)
  })

  it('空模式返回空数组', () => {
    const ranges = getHighlightRanges('test', '')
    expect(ranges).toEqual([])
  })

  it('空文本返回空数组', () => {
    const ranges = getHighlightRanges('', 'test')
    expect(ranges).toEqual([])
  })

  it('大小写敏感匹配', () => {
    const text = 'Error ERROR error'
    const ranges = getHighlightRanges(text, 'error', true)
    expect(ranges.length).toBe(1)
    expect(ranges[0].start).toBe(12)
  })

  it('大小写不敏感匹配', () => {
    const text = 'Error ERROR error'
    const ranges = getHighlightRanges(text, 'error', false)
    expect(ranges.length).toBe(3)
  })

  it('无效正则返回空数组', () => {
    const ranges = getHighlightRanges('test', '[')
    expect(ranges).toEqual([])
  })
})

describe('filterByTimeRange', () => {
  const makeLog = (id, ts) => ({
    id,
    isValid: true,
    timestamp: ts,
    content: `log ${id}`,
    level: 'INFO',
    module: 'test',
  })

  const baseTime = new Date(2024, 2, 15, 12, 0, 0).getTime()
  const logs = [
    makeLog('1', baseTime - 3600000),
    makeLog('2', baseTime),
    makeLog('3', baseTime + 3600000),
    makeLog('4', baseTime + 7200000),
  ]

  it('无时间范围返回全部', () => {
    const result = filterByTimeRange(logs, null, null)
    expect(result.length).toBe(4)
  })

  it('按起始时间过滤', () => {
    const result = filterByTimeRange(logs, baseTime, null)
    expect(result.length).toBe(3)
    expect(result.map((l) => l.id)).toEqual(['2', '3', '4'])
  })

  it('按结束时间过滤', () => {
    const result = filterByTimeRange(logs, null, baseTime + 3600000)
    expect(result.length).toBe(3)
    expect(result.map((l) => l.id)).toEqual(['1', '2', '3'])
  })

  it('时间范围内过滤', () => {
    const result = filterByTimeRange(logs, baseTime - 1000, baseTime + 3600000 + 1000)
    expect(result.length).toBe(2)
    expect(result.map((l) => l.id)).toEqual(['2', '3'])
  })

  it('无效日志被排除', () => {
    const testLogs = [
      ...logs,
      { id: 'invalid', isValid: false, timestamp: null, content: 'invalid' },
    ]
    const result = filterByTimeRange(testLogs, baseTime - 100000, baseTime + 100000)
    expect(result.some((l) => l.id === 'invalid')).toBe(false)
  })

  it('起始时间字符串也能工作', () => {
    const startStr = '2024-03-15T11:00:00'
    const result = filterByTimeRange(logs, startStr, null)
    expect(result.length).toBe(4)
  })
})

describe('validateTimeRange', () => {
  it('有效时间范围返回 valid:true', () => {
    const start = new Date(2024, 2, 15).getTime()
    const end = new Date(2024, 2, 16).getTime()
    const result = validateTimeRange(start, end)
    expect(result.valid).toBe(true)
  })

  it('起始时间晚于结束时间返回错误', () => {
    const start = new Date(2024, 2, 16).getTime()
    const end = new Date(2024, 2, 15).getTime()
    const result = validateTimeRange(start, end)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('起始时间不能晚于结束时间')
  })

  it('起始时间为空返回有效', () => {
    const result = validateTimeRange(null, Date.now())
    expect(result.valid).toBe(true)
  })

  it('结束时间为空返回有效', () => {
    const result = validateTimeRange(Date.now(), null)
    expect(result.valid).toBe(true)
  })

  it('都为空返回有效', () => {
    const result = validateTimeRange(null, null)
    expect(result.valid).toBe(true)
  })

  it('时间相等返回有效', () => {
    const ts = Date.now()
    const result = validateTimeRange(ts, ts)
    expect(result.valid).toBe(true)
  })
})

describe('countByLevel', () => {
  it('正确统计各级别数量', () => {
    const logs = [
      { isValid: true, level: 'ERROR' },
      { isValid: true, level: 'ERROR' },
      { isValid: true, level: 'WARN' },
      { isValid: true, level: 'INFO' },
      { isValid: true, level: 'INFO' },
      { isValid: true, level: 'INFO' },
      { isValid: true, level: 'DEBUG' },
      { isValid: false, level: null },
    ]
    const counts = countByLevel(logs)
    expect(counts.ERROR).toBe(2)
    expect(counts.WARN).toBe(1)
    expect(counts.INFO).toBe(3)
    expect(counts.DEBUG).toBe(1)
  })

  it('空数组返回全零', () => {
    const counts = countByLevel([])
    expect(counts.ERROR).toBe(0)
    expect(counts.WARN).toBe(0)
    expect(counts.INFO).toBe(0)
    expect(counts.DEBUG).toBe(0)
  })

  it('忽略无效日志', () => {
    const logs = [
      { isValid: false, level: 'ERROR' },
      { isValid: true, level: 'INFO' },
    ]
    const counts = countByLevel(logs)
    expect(counts.ERROR).toBe(0)
    expect(counts.INFO).toBe(1)
  })
})

describe('getHourKey', () => {
  it('返回正确的小时键', () => {
    const ts = new Date(2024, 2, 15, 14, 32, 1).getTime()
    const key = getHourKey(ts)
    expect(key).toBe('2024-03-15 14:00')
  })

  it('null 返回 null', () => {
    expect(getHourKey(null)).toBe(null)
  })

  it('补零正确', () => {
    const ts = new Date(2024, 0, 5, 3, 7, 9).getTime()
    const key = getHourKey(ts)
    expect(key).toBe('2024-01-05 03:00')
  })
})

describe('countKeywordByHour', () => {
  const makeLog = (ts, content) => ({
    isValid: true,
    timestamp: ts,
    content,
    level: 'INFO',
    module: 'test',
  })

  const baseDate = new Date(2024, 2, 15)
  const h1 = new Date(baseDate).setHours(10, 0, 0, 0)
  const h2 = new Date(baseDate).setHours(11, 0, 0, 0)
  const h3 = new Date(baseDate).setHours(12, 0, 0, 0)

  const logs = [
    makeLog(h1 + 1000, '登录成功'),
    makeLog(h1 + 2000, '登录失败'),
    makeLog(h1 + 3000, '其他日志'),
    makeLog(h2 + 1000, '登录成功'),
    makeLog(h3 + 1000, '其他日志'),
    makeLog(h3 + 2000, '登录超时'),
  ]

  it('按小时统计关键词出现次数', () => {
    const result = countKeywordByHour(logs, '登录')
    expect(result.length).toBe(3)
    expect(result[0].count).toBe(2)
    expect(result[1].count).toBe(1)
    expect(result[2].count).toBe(1)
  })

  it('返回按时间排序的结果', () => {
    const result = countKeywordByHour(logs, '登录')
    for (let i = 1; i < result.length; i++) {
      expect(result[i].hour > result[i - 1].hour).toBe(true)
    }
  })

  it('空关键词返回空数组', () => {
    const result = countKeywordByHour(logs, '')
    expect(result).toEqual([])
  })

  it('无匹配返回全零数据', () => {
    const result = countKeywordByHour(logs, '不存在的关键词')
    expect(result.length).toBe(3)
    expect(result.every((r) => r.count === 0)).toBe(true)
  })

  it('大小写不敏感匹配', () => {
    const testLogs = [
      makeLog(h1, 'ERROR occurred'),
      makeLog(h2, 'error detected'),
    ]
    const result = countKeywordByHour(testLogs, 'error', false)
    expect(result[0].count).toBe(1)
    expect(result[1].count).toBe(1)
  })

  it('大小写敏感匹配', () => {
    const testLogs = [
      makeLog(h1, 'ERROR occurred'),
      makeLog(h2, 'error detected'),
    ]
    const result = countKeywordByHour(testLogs, 'ERROR', true)
    expect(result[0].count).toBe(1)
    expect(result[1].count).toBe(0)
  })

  it('空日志数组返回空数组', () => {
    const result = countKeywordByHour([], 'test')
    expect(result).toEqual([])
  })
})

describe('countMultipleKeywordsByHour', () => {
  const makeLog = (ts, content) => ({
    isValid: true,
    timestamp: ts,
    content,
    level: 'INFO',
    module: 'test',
  })

  const baseDate = new Date(2024, 2, 15)
  const h1 = new Date(baseDate).setHours(10, 0, 0, 0)
  const h2 = new Date(baseDate).setHours(11, 0, 0, 0)

  const logs = [
    makeLog(h1, '登录成功 错误异常'),
    makeLog(h2, '登录失败 错误'),
  ]

  it('统计多个关键词', () => {
    const result = countMultipleKeywordsByHour(logs, ['登录', '错误'])
    expect(result.length).toBe(2)
    expect(result[0].keyword).toBe('登录')
    expect(result[1].keyword).toBe('错误')
  })

  it('忽略空关键词', () => {
    const result = countMultipleKeywordsByHour(logs, ['登录', '', '  '])
    expect(result.length).toBe(1)
    expect(result[0].keyword).toBe('登录')
  })

  it('空关键词列表返回空数组', () => {
    const result = countMultipleKeywordsByHour(logs, [])
    expect(result).toEqual([])
  })
})

describe('isLongContent', () => {
  it('短内容返回 false', () => {
    expect(isLongContent('short text')).toBe(false)
  })

  it('超过截断长度返回 true', () => {
    const long = 'a'.repeat(TRUNCATE_LENGTH + 1)
    expect(isLongContent(long)).toBe(true)
  })

  it('正好等于截断长度返回 false', () => {
    const exact = 'a'.repeat(TRUNCATE_LENGTH)
    expect(isLongContent(exact)).toBe(false)
  })

  it('空内容返回 false', () => {
    expect(isLongContent('')).toBe(false)
  })

  it('null 返回 false', () => {
    expect(isLongContent(null)).toBe(false)
  })
})

describe('truncateContent', () => {
  it('短内容原样返回', () => {
    const text = 'hello'
    expect(truncateContent(text)).toBe(text)
  })

  it('长内容截断并添加省略号', () => {
    const long = 'a'.repeat(TRUNCATE_LENGTH + 10)
    const truncated = truncateContent(long)
    expect(truncated.length).toBe(TRUNCATE_LENGTH + 3)
    expect(truncated.endsWith('...')).toBe(true)
  })

  it('正好等于截断长度不截断', () => {
    const exact = 'a'.repeat(TRUNCATE_LENGTH)
    expect(truncateContent(exact)).toBe(exact)
  })

  it('空内容返回空字符串', () => {
    expect(truncateContent('')).toBe('')
  })

  it('null 返回空字符串', () => {
    expect(truncateContent(null)).toBe('')
  })
})

describe('formatDateTime', () => {
  it('正确格式化时间戳', () => {
    const ts = new Date(2024, 2, 15, 14, 32, 1).getTime()
    expect(formatDateTime(ts)).toBe('2024-03-15 14:32:01')
  })

  it('空值返回空字符串', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime(undefined)).toBe('')
    expect(formatDateTime(0)).toBeTruthy()
  })

  it('补零正确', () => {
    const ts = new Date(2024, 0, 5, 3, 7, 9).getTime()
    expect(formatDateTime(ts)).toBe('2024-01-05 03:07:09')
  })
})

describe('getLogLevelBadgeClass', () => {
  it('ERROR 返回正确的类名', () => {
    expect(getLogLevelBadgeClass('ERROR')).toBe('log-level-error')
  })

  it('WARN 返回正确的类名', () => {
    expect(getLogLevelBadgeClass('WARN')).toBe('log-level-warn')
  })

  it('INFO 返回正确的类名', () => {
    expect(getLogLevelBadgeClass('INFO')).toBe('log-level-info')
  })

  it('DEBUG 返回正确的类名', () => {
    expect(getLogLevelBadgeClass('DEBUG')).toBe('log-level-debug')
  })

  it('未知级别返回默认类名', () => {
    expect(getLogLevelBadgeClass('UNKNOWN')).toBe('log-level-unknown')
  })

  it('null 返回默认类名', () => {
    expect(getLogLevelBadgeClass(null)).toBe('log-level-unknown')
  })

  it('小写级别也能匹配', () => {
    expect(getLogLevelBadgeClass('error')).toBe('log-level-error')
  })
})

describe('getStatsMax', () => {
  it('返回最大值', () => {
    const counts = { ERROR: 5, WARN: 10, INFO: 3, DEBUG: 1 }
    expect(getStatsMax(counts)).toBe(10)
  })

  it('全零时返回 1', () => {
    const counts = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 }
    expect(getStatsMax(counts)).toBe(1)
  })
})
