import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  DEFAULT_FLAGS,
  buildFlagsString,
  parseFlagsString,
  isValidRegex,
  createRegex,
  findAllMatches,
  hasCaptureGroups,
  replaceText,
  buildHighlightSegments,
  escapeRegex,
  truncateText,
} from '../../regex-tester/regexUtils'

describe('DEFAULT_FLAGS', () => {
  it('应该包含正确的默认标志位', () => {
    expect(DEFAULT_FLAGS).toEqual({
      global: true,
      ignoreCase: false,
      multiline: false,
      dotAll: false,
    })
  })
})

describe('buildFlagsString', () => {
  it('应该根据标志位对象构建正确的标志字符串', () => {
    expect(buildFlagsString({ global: true, ignoreCase: false, multiline: false, dotAll: false })).toBe('g')
    expect(buildFlagsString({ global: true, ignoreCase: true, multiline: false, dotAll: false })).toBe('gi')
    expect(buildFlagsString({ global: true, ignoreCase: true, multiline: true, dotAll: true })).toBe('gims')
    expect(buildFlagsString({ global: false, ignoreCase: false, multiline: false, dotAll: false })).toBe('')
  })

  it('非对象或 null 输入应该返回默认值 g', () => {
    expect(buildFlagsString(null)).toBe('g')
    expect(buildFlagsString(undefined)).toBe('g')
    expect(buildFlagsString('')).toBe('g')
    expect(buildFlagsString(123)).toBe('g')
  })
})

describe('parseFlagsString', () => {
  it('应该正确解析标志字符串为标志位对象', () => {
    expect(parseFlagsString('g')).toEqual({
      global: true,
      ignoreCase: false,
      multiline: false,
      dotAll: false,
    })
    expect(parseFlagsString('gi')).toEqual({
      global: true,
      ignoreCase: true,
      multiline: false,
      dotAll: false,
    })
    expect(parseFlagsString('gims')).toEqual({
      global: true,
      ignoreCase: true,
      multiline: true,
      dotAll: true,
    })
  })

  it('应该忽略不认识的标志字符', () => {
    const result = parseFlagsString('gxiyzms')
    expect(result.global).toBe(true)
    expect(result.ignoreCase).toBe(true)
    expect(result.multiline).toBe(true)
    expect(result.dotAll).toBe(true)
  })

  it('非字符串输入应该返回全 false 的标志对象', () => {
    const expected = { global: false, ignoreCase: false, multiline: false, dotAll: false }
    expect(parseFlagsString(null)).toEqual(expected)
    expect(parseFlagsString(undefined)).toEqual(expected)
    expect(parseFlagsString(123)).toEqual(expected)
  })
})

describe('isValidRegex', () => {
  it('应该正确验证有效正则', () => {
    expect(isValidRegex('hello')).toBe(true)
    expect(isValidRegex('\\d+')).toBe(true)
    expect(isValidRegex('[a-z]+')).toBe(true)
    expect(isValidRegex('(foo|bar)')).toBe(true)
  })

  it('应该正确识别无效正则', () => {
    expect(isValidRegex('[')).toBe(false)
    expect(isValidRegex('(')).toBe(false)
    expect(isValidRegex('*')).toBe(false)
    expect(isValidRegex('\\')).toBe(false)
  })

  it('非字符串输入应该返回 false', () => {
    expect(isValidRegex(null)).toBe(false)
    expect(isValidRegex(undefined)).toBe(false)
    expect(isValidRegex(123)).toBe(false)
    expect(isValidRegex({})).toBe(false)
  })
})

describe('createRegex', () => {
  it('应该成功创建有效的正则表达式', () => {
    const result = createRegex('\\d+', { global: true, ignoreCase: false, multiline: false, dotAll: false })
    expect(result.success).toBe(true)
    expect(result.regex).toBeInstanceOf(RegExp)
    expect(result.error).toBeNull()
    expect(result.regex.source).toBe('\\d+')
    expect(result.regex.flags).toBe('g')
  })

  it('应该在正则无效时返回错误信息', () => {
    const result = createRegex('[', DEFAULT_FLAGS)
    expect(result.success).toBe(false)
    expect(result.regex).toBeNull()
    expect(typeof result.error).toBe('string')
    expect(result.error.length).toBeGreaterThan(0)
  })

  it('应该正确应用多种标志位', () => {
    const result = createRegex('test', { global: true, ignoreCase: true, multiline: true, dotAll: true })
    expect(result.success).toBe(true)
    expect(result.regex.flags).toBe('gims')
  })
})

describe('findAllMatches', () => {
  it('空文本应该返回空结果', () => {
    const result = findAllMatches('\\d+', DEFAULT_FLAGS, '')
    expect(result.matches).toEqual([])
    expect(result.error).toBeNull()
  })

  it('非字符串文本应该返回空结果', () => {
    const result = findAllMatches('\\d+', DEFAULT_FLAGS, null)
    expect(result.matches).toEqual([])
  })

  it('应该在全局模式下找到所有匹配', () => {
    const result = findAllMatches('\\d+', DEFAULT_FLAGS, 'abc123def456ghi789')
    expect(result.matches.length).toBe(3)
    expect(result.matches[0].text).toBe('123')
    expect(result.matches[0].start).toBe(3)
    expect(result.matches[0].end).toBe(6)
    expect(result.matches[1].text).toBe('456')
    expect(result.matches[2].text).toBe('789')
  })

  it('应该在非全局模式下只找到第一个匹配', () => {
    const flags = { ...DEFAULT_FLAGS, global: false }
    const result = findAllMatches('\\d+', flags, 'abc123def456')
    expect(result.matches.length).toBe(1)
    expect(result.matches[0].text).toBe('123')
  })

  it('无效正则应该返回错误', () => {
    const result = findAllMatches('[', DEFAULT_FLAGS, 'test')
    expect(result.matches).toEqual([])
    expect(result.error).toBeDefined()
  })

  it('应该正确提取捕获组', () => {
    const result = findAllMatches('(\\w+)@(\\w+)\\.(\\w+)', DEFAULT_FLAGS, 'a@b.c, x@y.z')
    expect(result.matches.length).toBe(2)
    expect(result.matches[0].groups.length).toBe(3)
    expect(result.matches[0].groups[0].value).toBe('a')
    expect(result.matches[0].groups[1].value).toBe('b')
    expect(result.matches[0].groups[2].value).toBe('c')
  })

  it('应该正确处理命名捕获组', () => {
    const result = findAllMatches('(?<user>\\w+)@(?<domain>\\w+)', DEFAULT_FLAGS, 'test@example')
    expect(result.matches.length).toBe(1)
    expect(result.matches[0].namedGroups).toEqual({ user: 'test', domain: 'example' })
  })

  it('应该给每个匹配分配正确的索引', () => {
    const result = findAllMatches('a', DEFAULT_FLAGS, 'aaa')
    expect(result.matches.length).toBe(3)
    expect(result.matches[0].index).toBe(0)
    expect(result.matches[1].index).toBe(1)
    expect(result.matches[2].index).toBe(2)
  })

  it('忽略大小写标志应该生效', () => {
    const flags = { ...DEFAULT_FLAGS, ignoreCase: true }
    const result = findAllMatches('hello', flags, 'Hello HELLO hello')
    expect(result.matches.length).toBe(3)
  })

  it('没有匹配时应该返回空数组', () => {
    const result = findAllMatches('xyz', DEFAULT_FLAGS, 'abc def ghi')
    expect(result.matches).toEqual([])
    expect(result.error).toBeNull()
  })
})

describe('hasCaptureGroups', () => {
  it('应该正确识别普通捕获组', () => {
    expect(hasCaptureGroups('(abc)')).toBe(true)
    expect(hasCaptureGroups('(\\d+)-(\\w+)')).toBe(true)
  })

  it('应该识别命名捕获组', () => {
    expect(hasCaptureGroups('(?<name>\\w+)')).toBe(true)
  })

  it('应该排除非捕获组', () => {
    expect(hasCaptureGroups('(?:abc)')).toBe(false)
    expect(hasCaptureGroups('(?:foo)(bar)')).toBe(true)
  })

  it('应该排除正向先行断言', () => {
    expect(hasCaptureGroups('foo(?=bar)')).toBe(false)
  })

  it('应该排除负向先行断言', () => {
    expect(hasCaptureGroups('foo(?!bar)')).toBe(false)
  })

  it('空字符串应该返回 false', () => {
    expect(hasCaptureGroups('')).toBe(false)
  })

  it('非字符串输入应该返回 false', () => {
    expect(hasCaptureGroups(null)).toBe(false)
    expect(hasCaptureGroups(undefined)).toBe(false)
    expect(hasCaptureGroups(123)).toBe(false)
  })

  it('字符类中的括号不应该被识别', () => {
    expect(hasCaptureGroups('[()]')).toBe(false)
    expect(hasCaptureGroups('[(]foo[)]')).toBe(false)
  })

  it('转义的括号不应该被识别', () => {
    expect(hasCaptureGroups('\\(abc\\)')).toBe(false)
  })
})

describe('replaceText', () => {
  it('应该正确执行全部替换', () => {
    const result = replaceText('\\d+', DEFAULT_FLAGS, 'a1b22c333', 'X', true)
    expect(result.success).toBe(true)
    expect(result.result).toBe('aXbXcX')
  })

  it('应该正确执行替换第一个', () => {
    const result = replaceText('\\d+', DEFAULT_FLAGS, 'a1b22c333', 'X', false)
    expect(result.success).toBe(true)
    expect(result.result).toBe('aXb22c333')
  })

  it('应该支持捕获组引用 $1, $2', () => {
    const result = replaceText('(\\w+) (\\w+)', DEFAULT_FLAGS, 'hello world', '$2, $1', true)
    expect(result.success).toBe(true)
    expect(result.result).toBe('world, hello')
  })

  it('无效正则应该返回错误', () => {
    const result = replaceText('[', DEFAULT_FLAGS, 'test', 'x', true)
    expect(result.success).toBe(false)
    expect(result.result).toBe('')
    expect(result.error).toBeDefined()
  })

  it('非字符串文本应该返回错误', () => {
    const result = replaceText('a', DEFAULT_FLAGS, null, 'b', true)
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('无匹配时应该返回原文本', () => {
    const result = replaceText('xyz', DEFAULT_FLAGS, 'abc', 'replacement', true)
    expect(result.success).toBe(true)
    expect(result.result).toBe('abc')
  })
})

describe('buildHighlightSegments', () => {
  it('空文本应该返回空数组', () => {
    expect(buildHighlightSegments('', [{ start: 0, end: 3, index: 0 }])).toEqual([])
  })

  it('无匹配时应该返回单个 text 段', () => {
    const result = buildHighlightSegments('hello world', [])
    expect(result.length).toBe(1)
    expect(result[0].type).toBe('text')
    expect(result[0].value).toBe('hello world')
    expect(result[0].start).toBe(0)
    expect(result[0].end).toBe(11)
  })

  it('应该正确构建匹配和文本段', () => {
    const text = 'abc123def'
    const matches = [{ index: 0, text: '123', start: 3, end: 6 }]
    const result = buildHighlightSegments(text, matches)
    expect(result.length).toBe(3)
    expect(result[0].type).toBe('text')
    expect(result[0].value).toBe('abc')
    expect(result[1].type).toBe('match')
    expect(result[1].value).toBe('123')
    expect(result[1].matchIndex).toBe(0)
    expect(result[2].type).toBe('text')
    expect(result[2].value).toBe('def')
  })

  it('应该正确处理连续匹配', () => {
    const text = '123456'
    const matches = [
      { index: 0, text: '123', start: 0, end: 3 },
      { index: 1, text: '456', start: 3, end: 6 },
    ]
    const result = buildHighlightSegments(text, matches)
    expect(result.length).toBe(2)
    expect(result[0].type).toBe('match')
    expect(result[1].type).toBe('match')
  })

  it('非数组匹配应该被视为空', () => {
    const result = buildHighlightSegments('hello', null)
    expect(result.length).toBe(1)
    expect(result[0].type).toBe('text')
  })
})

describe('escapeRegex', () => {
  it('应该转义所有正则特殊字符', () => {
    expect(escapeRegex('a.b*c+d?e^f$g(h)i[j]k{l}m|n\\o')).toBe(
      'a\\.b\\*c\\+d\\?e\\^f\\$g\\(h\\)i\\[j\\]k\\{l\\}m\\|n\\\\o'
    )
  })

  it('空字符串应该返回空字符串', () => {
    expect(escapeRegex('')).toBe('')
  })

  it('非字符串输入应该返回空字符串', () => {
    expect(escapeRegex(null)).toBe('')
    expect(escapeRegex(undefined)).toBe('')
    expect(escapeRegex(123)).toBe('')
  })

  it('无特殊字符的字符串应该保持不变', () => {
    expect(escapeRegex('hello world')).toBe('hello world')
  })
})

describe('truncateText', () => {
  it('短文本不应该被截断', () => {
    expect(truncateText('hello', 50)).toBe('hello')
  })

  it('长文本应该被截断并添加省略号', () => {
    const long = 'a'.repeat(100)
    const result = truncateText(long, 50)
    expect(result.length).toBe(53)
    expect(result.endsWith('...')).toBe(true)
    expect(result.startsWith('a'.repeat(50))).toBe(true)
  })

  it('应该支持自定义最大长度', () => {
    expect(truncateText('hello world', 5)).toBe('hello...')
  })

  it('非字符串输入应该返回空字符串', () => {
    expect(truncateText(null)).toBe('')
    expect(truncateText(undefined)).toBe('')
    expect(truncateText(123)).toBe('')
  })

  it('默认最大长度应该为 50', () => {
    const text = 'a'.repeat(60)
    const result = truncateText(text)
    expect(result.length).toBe(53)
  })
})
