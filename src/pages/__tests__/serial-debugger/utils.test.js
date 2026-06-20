/* eslint-disable no-undef */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  asciiToHex,
  hexToAscii,
  isValidHex,
  formatHexString,
  formatTimestamp,
  validateBaudRate,
  validateDataBits,
  validateStopBits,
  validateParity,
  validatePort,
  validateConfig,
  formatConfigSummary,
  addHistoryItem,
  filterHistoryByKeyword,
  togglePinnedItem,
  truncateText,
  formatLogEntry,
  buildExportContent,
  loadConfigFromStorage,
  saveConfigToStorage,
  loadHistoryFromStorage,
  saveHistoryToStorage,
  loadPinnedFromStorage,
  savePinnedToStorage,
} from '../../serial-debugger/utils'
import {
  MAX_HISTORY_ITEMS,
  MAX_PINNED_ITEMS,
  DEFAULT_CONFIG,
  DIRECTIONS,
  EXPORT_FORMATS,
} from '../../serial-debugger/constants'

describe('Hex 与 ASCII 互转', () => {
  describe('asciiToHex', () => {
    it('应该正确转换 ASCII 字符串为十六进制', () => {
      expect(asciiToHex('Hello')).toBe('48 65 6C 6C 6F')
      expect(asciiToHex('ABC')).toBe('41 42 43')
    })

    it('空字符串应该返回空字符串', () => {
      expect(asciiToHex('')).toBe('')
    })

    it('非字符串输入应该返回空字符串', () => {
      expect(asciiToHex(null)).toBe('')
      expect(asciiToHex(undefined)).toBe('')
      expect(asciiToHex(123)).toBe('')
    })

    it('单个字符应该正确转换', () => {
      expect(asciiToHex('A')).toBe('41')
      expect(asciiToHex('\0')).toBe('00')
    })

    it('特殊字符应该正确转换', () => {
      expect(asciiToHex('\n')).toBe('0A')
      expect(asciiToHex('\r')).toBe('0D')
      expect(asciiToHex('\t')).toBe('09')
      expect(hexToAscii('0D 0A')).toBe('\r\n')
    })
  })

  describe('hexToAscii', () => {
    it('应该正确转换十六进制为 ASCII 字符串', () => {
      expect(hexToAscii('48 65 6C 6C 6F')).toBe('Hello')
      expect(hexToAscii('41 42 43')).toBe('ABC')
    })

    it('无空格的十六进制字符串应该正确转换', () => {
      expect(hexToAscii('48656C6C6F')).toBe('Hello')
    })

    it('空字符串应该返回空字符串', () => {
      expect(hexToAscii('')).toBe('')
    })

    it('非字符串输入应该返回空字符串', () => {
      expect(hexToAscii(null)).toBe('')
      expect(hexToAscii(undefined)).toBe('')
    })

    it('无效的十六进制应该返回空字符串', () => {
      expect(hexToAscii('ZZ')).toBe('')
      expect(hexToAscii('4G')).toBe('')
    })

    it('奇数长度的十六进制应该返回空字符串', () => {
      expect(hexToAscii('486')).toBe('')
    })

    it('大小写混合的十六进制应该正确转换', () => {
      expect(hexToAscii('48 65 6c 6C 6F')).toBe('Hello')
    })
  })

  describe('isValidHex', () => {
    it('应该正确验证有效的十六进制字符串', () => {
      expect(isValidHex('48 65 6C 6C 6F')).toBe(true)
      expect(isValidHex('48656C6C6F')).toBe(true)
      expect(isValidHex('')).toBe(true)
    })

    it('应该正确验证无效的十六进制字符串', () => {
      expect(isValidHex('ZZ')).toBe(false)
      expect(isValidHex('4G')).toBe(false)
      expect(isValidHex('486')).toBe(false)
    })

    it('非字符串输入应该返回 false', () => {
      expect(isValidHex(null)).toBe(false)
      expect(isValidHex(undefined)).toBe(false)
      expect(isValidHex(123)).toBe(false)
    })
  })

  describe('formatHexString', () => {
    it('应该格式化十六进制字符串，每两个字符加空格', () => {
      expect(formatHexString('48656C6C6F')).toBe('48 65 6C 6C 6F')
    })

    it('应该将小写转为大写', () => {
      expect(formatHexString('48656c6c6f')).toBe('48 65 6C 6C 6F')
    })

    it('已经有空格的应该重新格式化', () => {
      expect(formatHexString('48  65 6C  6C 6F')).toBe('48 65 6C 6C 6F')
    })

    it('空字符串应该返回空字符串', () => {
      expect(formatHexString('')).toBe('')
    })

    it('非字符串输入应该返回空字符串', () => {
      expect(formatHexString(null)).toBe('')
      expect(formatHexString(undefined)).toBe('')
    })
  })
})

describe('配置参数校验', () => {
  describe('validateBaudRate', () => {
    it('应该通过有效的波特率', () => {
      expect(validateBaudRate(9600).valid).toBe(true)
      expect(validateBaudRate(115200).valid).toBe(true)
      expect(validateBaudRate(300).valid).toBe(true)
      expect(validateBaudRate(921600).valid).toBe(true)
    })

    it('应该拒绝非数字输入', () => {
      expect(validateBaudRate('abc').valid).toBe(false)
      expect(validateBaudRate(null).valid).toBe(false)
      expect(validateBaudRate(undefined).valid).toBe(false)
    })

    it('应该拒绝非整数输入', () => {
      expect(validateBaudRate(9600.5).valid).toBe(false)
    })

    it('应该拒绝负数和零', () => {
      expect(validateBaudRate(0).valid).toBe(false)
      expect(validateBaudRate(-9600).valid).toBe(false)
    })

    it('应该拒绝超出范围的波特率', () => {
      expect(validateBaudRate(299).valid).toBe(false)
      expect(validateBaudRate(921601).valid).toBe(false)
    })

    it('字符串形式的数字应该有效', () => {
      expect(validateBaudRate('9600').valid).toBe(true)
    })
  })

  describe('validateDataBits', () => {
    it('应该通过有效的数据位', () => {
      expect(validateDataBits(5).valid).toBe(true)
      expect(validateDataBits(6).valid).toBe(true)
      expect(validateDataBits(7).valid).toBe(true)
      expect(validateDataBits(8).valid).toBe(true)
    })

    it('应该拒绝无效的数据位', () => {
      expect(validateDataBits(4).valid).toBe(false)
      expect(validateDataBits(9).valid).toBe(false)
      expect(validateDataBits(7.5).valid).toBe(false)
    })

    it('字符串形式的有效数字应该通过', () => {
      expect(validateDataBits('8').valid).toBe(true)
    })
  })

  describe('validateStopBits', () => {
    it('应该通过有效的停止位', () => {
      expect(validateStopBits(1).valid).toBe(true)
      expect(validateStopBits(1.5).valid).toBe(true)
      expect(validateStopBits(2).valid).toBe(true)
    })

    it('应该拒绝无效的停止位', () => {
      expect(validateStopBits(0).valid).toBe(false)
      expect(validateStopBits(3).valid).toBe(false)
      expect(validateStopBits(1.2).valid).toBe(false)
    })
  })

  describe('validateParity', () => {
    it('应该通过有效的校验位', () => {
      expect(validateParity('none').valid).toBe(true)
      expect(validateParity('odd').valid).toBe(true)
      expect(validateParity('even').valid).toBe(true)
    })

    it('应该拒绝无效的校验位', () => {
      expect(validateParity('mark').valid).toBe(false)
      expect(validateParity('space').valid).toBe(false)
      expect(validateParity('').valid).toBe(false)
    })
  })

  describe('validatePort', () => {
    it('应该通过有效的串口号', () => {
      expect(validatePort('COM1').valid).toBe(true)
      expect(validatePort('COM3').valid).toBe(true)
      expect(validatePort('COM8').valid).toBe(true)
    })

    it('应该拒绝空串口号', () => {
      expect(validatePort('').valid).toBe(false)
      expect(validatePort(null).valid).toBe(false)
      expect(validatePort(undefined).valid).toBe(false)
    })

    it('应该拒绝不在 COM1-COM8 范围内的串口号', () => {
      expect(validatePort('COM0').valid).toBe(false)
      expect(validatePort('COM9').valid).toBe(false)
      expect(validatePort('COM10').valid).toBe(false)
      expect(validatePort('COM99').valid).toBe(false)
    })

    it('应该拒绝格式不正确的串口号', () => {
      expect(validatePort('com1').valid).toBe(false)
      expect(validatePort('COM').valid).toBe(false)
      expect(validatePort('abc').valid).toBe(false)
      expect(validatePort('SERIAL1').valid).toBe(false)
    })

    it('拒绝时应包含有意义的错误信息', () => {
      const result = validatePort('COM9')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('COM1')
      expect(result.error).toContain('COM8')
    })
  })

  describe('validateConfig', () => {
    it('应该通过有效的完整配置', () => {
      const config = {
        port: 'COM3',
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
      }
      expect(validateConfig(config).valid).toBe(true)
    })

    it('应该拒绝无效的配置对象', () => {
      expect(validateConfig(null).valid).toBe(false)
      expect(validateConfig(undefined).valid).toBe(false)
      expect(validateConfig('').valid).toBe(false)
    })

    it('应该检测无效的波特率', () => {
      const config = {
        port: 'COM3',
        baudRate: -1,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
      }
      expect(validateConfig(config).valid).toBe(false)
      expect(validateConfig(config).error).toBeDefined()
    })

    it('应该检测无效的数据位', () => {
      const config = {
        port: 'COM3',
        baudRate: 9600,
        dataBits: 9,
        stopBits: 1,
        parity: 'none',
      }
      expect(validateConfig(config).valid).toBe(false)
    })

    it('应该检测非法串口号 COM9', () => {
      const config = {
        port: 'COM9',
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
      }
      expect(validateConfig(config).valid).toBe(false)
      expect(validateConfig(config).error).toContain('COM1')
    })

    it('应该检测空串口号', () => {
      const config = {
        port: '',
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
      }
      expect(validateConfig(config).valid).toBe(false)
    })
  })

  describe('formatConfigSummary', () => {
    it('应该正确格式化配置摘要', () => {
      const config = {
        port: 'COM3',
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
      }
      expect(formatConfigSummary(config)).toBe('COM3 9600-8-N-1')
    })

    it('奇校验应该显示 O', () => {
      const config = {
        port: 'COM1',
        baudRate: 115200,
        dataBits: 7,
        stopBits: 2,
        parity: 'odd',
      }
      expect(formatConfigSummary(config)).toBe('COM1 115200-7-O-2')
    })

    it('偶校验应该显示 E', () => {
      const config = {
        ...DEFAULT_CONFIG,
        parity: 'even',
      }
      expect(formatConfigSummary(config)).toContain('-E-')
    })

    it('空配置应该返回空字符串', () => {
      expect(formatConfigSummary(null)).toBe('')
      expect(formatConfigSummary(undefined)).toBe('')
    })
  })
})

describe('时间戳格式化', () => {
  describe('formatTimestamp', () => {
    it('应该格式化为 [HH:MM:SS.mmm] 格式', () => {
      const date = new Date('2024-01-01T12:34:56.789Z')
      const result = formatTimestamp(date)
      expect(result).toMatch(/^\[\d{2}:\d{2}:\d{2}\.\d{3}\]$/)
    })

    it('毫秒应该是三位', () => {
      const date = new Date()
      const result = formatTimestamp(date)
      const msPart = result.match(/\.(\d{3})\]/)
      expect(msPart).not.toBeNull()
      expect(msPart[1].length).toBe(3)
    })

    it('无效日期应该返回空字符串', () => {
      expect(formatTimestamp('invalid')).toBe('')
      expect(formatTimestamp(null)).toBe('')
      expect(formatTimestamp(undefined)).toBe('')
    })

    it('时间戳数字应该有效', () => {
      const timestamp = Date.now()
      const result = formatTimestamp(timestamp)
      expect(result).toMatch(/^\[\d{2}:\d{2}:\d{2}\.\d{3}\]$/)
    })
  })
})

describe('发送历史 LRU 淘汰逻辑', () => {
  describe('addHistoryItem', () => {
    it('应该将新条目添加到开头', () => {
      const item = { content: 'test', format: 'ascii' }
      const result = addHistoryItem([], item)

      expect(result.history).toHaveLength(1)
      expect(result.history[0].content).toBe('test')
      expect(result.history[0].format).toBe('ascii')
      expect(result.evicted).toBe(0)
    })

    it('新条目应该包含 id 和 timestamp', () => {
      const item = { content: 'test' }
      const result = addHistoryItem([], item)

      expect(result.history[0].id).toBeDefined()
      expect(typeof result.history[0].id).toBe('string')
      expect(result.history[0].timestamp).toBeDefined()
      expect(typeof result.history[0].timestamp).toBe('number')
    })

    it('超过最大条数时应该淘汰最旧的', () => {
      const maxItems = 5
      let history = []

      for (let i = 0; i < 10; i++) {
        const result = addHistoryItem(history, { content: String(i) }, maxItems)
        history = result.history
      }

      expect(history).toHaveLength(5)
      expect(history[0].content).toBe('9')
      expect(history[4].content).toBe('5')
    })

    it('应该返回正确的淘汰数量', () => {
      const maxItems = 3
      let history = []

      for (let i = 0; i < 3; i++) {
        const result = addHistoryItem(history, { content: String(i) }, maxItems)
        history = result.history
        expect(result.evicted).toBe(0)
      }

      const result = addHistoryItem(history, { content: 'new' }, maxItems)
      expect(result.evicted).toBe(1)
    })

    it('默认应该使用 MAX_HISTORY_ITEMS', () => {
      const item = { content: 'test' }
      const result = addHistoryItem([], item)
      expect(result.evicted).toBe(0)
      expect(MAX_HISTORY_ITEMS).toBe(50)
    })

    it('非数组输入应该视为空数组', () => {
      const item = { content: 'test' }
      const result = addHistoryItem(null, item)
      expect(result.history).toHaveLength(1)
      expect(result.evicted).toBe(0)
    })
  })

  describe('filterHistoryByKeyword', () => {
    const testHistory = [
      { id: '1', content: 'Hello World', format: 'ascii', timestamp: Date.now() },
      { id: '2', content: '48 65 6C 6C 6F', format: 'hex', timestamp: Date.now() },
      { id: '3', content: 'Test Message', format: 'ascii', timestamp: Date.now() },
    ]

    it('空关键词应该返回所有历史', () => {
      const result = filterHistoryByKeyword(testHistory, '')
      expect(result).toHaveLength(3)
    })

    it('空白关键词应该返回所有历史', () => {
      const result = filterHistoryByKeyword(testHistory, '   ')
      expect(result).toHaveLength(3)
    })

    it('应该按内容过滤', () => {
      const result = filterHistoryByKeyword(testHistory, 'Hello')
      expect(result).toHaveLength(1)
      expect(result[0].content).toBe('Hello World')
    })

    it('应该按格式过滤', () => {
      const result = filterHistoryByKeyword(testHistory, 'hex')
      expect(result).toHaveLength(1)
      expect(result[0].format).toBe('hex')
    })

    it('应该不区分大小写', () => {
      const result1 = filterHistoryByKeyword(testHistory, 'hello')
      const result2 = filterHistoryByKeyword(testHistory, 'HELLO')
      expect(result1).toHaveLength(1)
      expect(result2).toHaveLength(1)
    })

    it('非数组输入应该返回空数组', () => {
      const result = filterHistoryByKeyword(null, 'test')
      expect(result).toEqual([])
    })
  })

  describe('togglePinnedItem', () => {
    it('应该添加新的固定项', () => {
      const item = { id: '1', content: 'test' }
      const result = togglePinnedItem([], item)

      expect(result.pinned).toHaveLength(1)
      expect(result.added).toBe(true)
      expect(result.error).toBeNull()
      expect(result.pinned[0].pinned).toBe(true)
    })

    it('应该移除已存在的固定项', () => {
      const item = { id: '1', content: 'test' }
      const firstResult = togglePinnedItem([], item)
      const secondResult = togglePinnedItem(firstResult.pinned, item)

      expect(secondResult.pinned).toHaveLength(0)
      expect(secondResult.added).toBe(false)
      expect(secondResult.error).toBeNull()
    })

    it('超过最大固定数量时应该返回错误', () => {
      let pinned = []
      for (let i = 0; i < MAX_PINNED_ITEMS; i++) {
        const result = togglePinnedItem(pinned, { id: String(i), content: `test${i}` })
        pinned = result.pinned
      }

      const result = togglePinnedItem(pinned, { id: 'new', content: 'new' })
      expect(result.pinned).toHaveLength(MAX_PINNED_ITEMS)
      expect(result.added).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('非数组输入应该视为空数组', () => {
      const item = { id: '1', content: 'test' }
      const result = togglePinnedItem(null, item)
      expect(result.pinned).toHaveLength(1)
    })
  })

  describe('truncateText', () => {
    it('短文本不应该被截断', () => {
      expect(truncateText('Hello', 10)).toBe('Hello')
    })

    it('长文本应该被截断并添加省略号', () => {
      const result = truncateText('Hello World', 5)
      expect(result).toBe('Hello...')
      expect(result.length).toBe(8)
    })

    it('默认应该截断 50 个字符', () => {
      const longText = 'a'.repeat(100)
      const result = truncateText(longText)
      expect(result.length).toBe(53)
      expect(result.endsWith('...')).toBe(true)
    })

    it('非字符串输入应该返回空字符串', () => {
      expect(truncateText(null)).toBe('')
      expect(truncateText(undefined)).toBe('')
      expect(truncateText(123)).toBe('')
    })
  })
})

describe('日志导出文本拼接格式化', () => {
  describe('formatLogEntry', () => {
    const entry = {
      content: 'Hello',
      format: 'ascii',
      direction: DIRECTIONS.SEND,
      timestamp: Date.now(),
    }

    it('默认应该包含时间戳和方向标记', () => {
      const result = formatLogEntry(entry)
      expect(result).toContain('[')
      expect(result).toContain(']')
      expect(result).toContain('→')
      expect(result).toContain('Hello')
      expect(result.endsWith('\n')).toBe(true)
    })

    it('可以隐藏时间戳', () => {
      const result = formatLogEntry(entry, { showTimestamp: false })
      expect(result).not.toContain('[')
      expect(result).toContain('→')
      expect(result).toContain('Hello')
    })

    it('可以隐藏方向标记', () => {
      const result = formatLogEntry(entry, { showDirection: false })
      expect(result).toContain('[')
      expect(result).not.toContain('→')
      expect(result).not.toContain('←')
    })

    it('可以禁用自动换行', () => {
      const result = formatLogEntry(entry, { autoWrap: false })
      expect(result.endsWith('\n')).toBe(false)
    })

    it('接收方向应该显示向左箭头', () => {
      const receiveEntry = { ...entry, direction: DIRECTIONS.RECEIVE }
      const result = formatLogEntry(receiveEntry)
      expect(result).toContain('←')
    })

    it('Hex 模式下 ASCII 内容应该转换为 Hex', () => {
      const result = formatLogEntry(entry, { isHex: true })
      expect(result).toContain('48 65 6C 6C 6F')
    })

    it('ASCII 模式下 Hex 内容应该转换为 ASCII', () => {
      const hexEntry = {
        content: '48 65 6C 6C 6F',
        format: 'hex',
        direction: DIRECTIONS.SEND,
        timestamp: Date.now(),
      }
      const result = formatLogEntry(hexEntry, { isHex: false })
      expect(result).toContain('Hello')
    })
  })

  describe('buildExportContent', () => {
    const config = {
      port: 'COM3',
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
    }

    const receiveLog = [
      { content: 'Hello', format: 'ascii', direction: DIRECTIONS.SEND, timestamp: Date.now() },
      { content: 'World', format: 'ascii', direction: DIRECTIONS.RECEIVE, timestamp: Date.now() },
    ]

    const history = [
      { content: 'Hello', format: 'ascii', timestamp: Date.now() },
      { content: '48 65 6C 6C 6F', format: 'hex', timestamp: Date.now() },
    ]

    it('纯文本格式应该包含接收日志和历史', () => {
      const result = buildExportContent(receiveLog, history, config, EXPORT_FORMATS.PLAIN_TEXT)
      expect(result).toContain('Hello')
      expect(result).toContain('World')
      expect(result).toContain('发送历史')
    })

    it('带配置头格式应该包含配置信息', () => {
      const result = buildExportContent(receiveLog, history, config, EXPORT_FORMATS.WITH_HEADER)
      expect(result).toContain('串口调试日志')
      expect(result).toContain('导出时间')
      expect(result).toContain('COM3')
      expect(result).toContain('9600')
      expect(result).toContain('接收区日志')
      expect(result).toContain('发送历史')
    })

    it('空数据应该返回合理内容', () => {
      const result = buildExportContent([], [], null, EXPORT_FORMATS.PLAIN_TEXT)
      expect(typeof result).toBe('string')
    })

    it('默认格式应该是纯文本', () => {
      const result = buildExportContent(receiveLog, history, config)
      expect(result).not.toContain('串口调试日志')
    })

    it('isHex=true 时接收区日志应保留 Hex 格式而非转换为 ASCII', () => {
      const hexReceiveLog = [
        { content: '48 65 6C 6C 6F', format: 'hex', direction: DIRECTIONS.SEND, timestamp: Date.now() },
      ]
      const result = buildExportContent(hexReceiveLog, [], config, EXPORT_FORMATS.PLAIN_TEXT, true)
      expect(result).toContain('48 65 6C 6C 6F')
      expect(result).not.toContain('Hello')
    })

    it('isHex=false 时 Hex 格式内容应转换为 ASCII', () => {
      const hexReceiveLog = [
        { content: '48 65 6C 6C 6F', format: 'hex', direction: DIRECTIONS.SEND, timestamp: Date.now() },
      ]
      const result = buildExportContent(hexReceiveLog, [], config, EXPORT_FORMATS.PLAIN_TEXT, false)
      expect(result).toContain('Hello')
    })

    it('isHex=true 时 ASCII 格式内容应转换为 Hex 显示', () => {
      const asciiReceiveLog = [
        { content: 'Hello', format: 'ascii', direction: DIRECTIONS.SEND, timestamp: Date.now() },
      ]
      const result = buildExportContent(asciiReceiveLog, [], config, EXPORT_FORMATS.PLAIN_TEXT, true)
      expect(result).toContain('48 65 6C 6C 6F')
    })

    it('isHex 默认为 false，与用户不传参时的行为一致', () => {
      const hexReceiveLog = [
        { content: '48 65 6C 6C 6F', format: 'hex', direction: DIRECTIONS.SEND, timestamp: Date.now() },
      ]
      const resultDefault = buildExportContent(hexReceiveLog, [], config, EXPORT_FORMATS.PLAIN_TEXT)
      const resultExplicit = buildExportContent(hexReceiveLog, [], config, EXPORT_FORMATS.PLAIN_TEXT, false)
      expect(resultDefault).toBe(resultExplicit)
    })

    it('isHex=true 且带配置头格式时应同时包含配置头和 Hex 内容', () => {
      const hexReceiveLog = [
        { content: '48 65 6C 6C 6F', format: 'hex', direction: DIRECTIONS.RECEIVE, timestamp: Date.now() },
      ]
      const result = buildExportContent(hexReceiveLog, [], config, EXPORT_FORMATS.WITH_HEADER, true)
      expect(result).toContain('串口调试日志')
      expect(result).toContain('48 65 6C 6C 6F')
      expect(result).not.toContain('Hello')
    })
  })
})

describe('localStorage 存储', () => {
  const originalLocalStorage = global.localStorage

  beforeEach(() => {
    const store = {}
    global.localStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = String(value)
      }),
      removeItem: vi.fn((key) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        for (const key of Object.keys(store)) {
          delete store[key]
        }
      }),
    }
  })

  afterEach(() => {
    global.localStorage = originalLocalStorage
    vi.restoreAllMocks()
  })

  describe('saveConfigToStorage / loadConfigFromStorage', () => {
    it('应该保存并加载配置', () => {
      const config = { port: 'COM5', baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none' }
      const saveResult = saveConfigToStorage(config)
      expect(saveResult).toBe(true)

      const loaded = loadConfigFromStorage()
      expect(loaded).toEqual(config)
    })

    it('无数据时应该返回 null', () => {
      const loaded = loadConfigFromStorage()
      expect(loaded).toBeNull()
    })

    it('无效 JSON 应该返回 null', () => {
      global.localStorage.setItem('serial_debugger_config', 'invalid json')
      const loaded = loadConfigFromStorage()
      expect(loaded).toBeNull()
    })
  })

  describe('saveHistoryToStorage / loadHistoryFromStorage', () => {
    it('应该保存并加载历史记录', () => {
      const history = [{ id: '1', content: 'test', format: 'ascii' }]
      const saveResult = saveHistoryToStorage(history)
      expect(saveResult).toBe(true)

      const loaded = loadHistoryFromStorage()
      expect(loaded).toEqual(history)
    })

    it('无数据时应该返回空数组', () => {
      const loaded = loadHistoryFromStorage()
      expect(loaded).toEqual([])
    })

    it('非数组数据应该返回空数组', () => {
      global.localStorage.setItem('serial_debugger_history', '"not an array"')
      const loaded = loadHistoryFromStorage()
      expect(loaded).toEqual([])
    })
  })

  describe('savePinnedToStorage / loadPinnedFromStorage', () => {
    it('应该保存并加载固定项', () => {
      const pinned = [{ id: '1', content: 'test', pinned: true }]
      const saveResult = savePinnedToStorage(pinned)
      expect(saveResult).toBe(true)

      const loaded = loadPinnedFromStorage()
      expect(loaded).toEqual(pinned)
    })

    it('无数据时应该返回空数组', () => {
      const loaded = loadPinnedFromStorage()
      expect(loaded).toEqual([])
    })
  })
})
