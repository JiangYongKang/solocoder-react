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
  REGEX_TOKEN_TYPES,
  tokenizeRegexPattern,
  debounce,
  computeDiff,
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

describe('REGEX_TOKEN_TYPES', () => {
  it('应该包含所有必需的 token 类型', () => {
    expect(REGEX_TOKEN_TYPES).toBeDefined()
    expect(REGEX_TOKEN_TYPES.PLAIN).toBe('plain')
    expect(REGEX_TOKEN_TYPES.ESCAPE).toBe('escape')
    expect(REGEX_TOKEN_TYPES.CHAR_CLASS).toBe('charClass')
    expect(REGEX_TOKEN_TYPES.QUANTIFIER).toBe('quantifier')
    expect(REGEX_TOKEN_TYPES.GROUP).toBe('group')
    expect(REGEX_TOKEN_TYPES.NAMED_GROUP).toBe('namedGroup')
    expect(REGEX_TOKEN_TYPES.ALTERNATION).toBe('alternation')
    expect(REGEX_TOKEN_TYPES.ANCHOR).toBe('anchor')
    expect(REGEX_TOKEN_TYPES.SPECIAL).toBe('special')
  })
})

describe('tokenizeRegexPattern', () => {
  it('空字符串或非字符串应该返回空数组', () => {
    expect(tokenizeRegexPattern('')).toEqual([])
    expect(tokenizeRegexPattern(null)).toEqual([])
    expect(tokenizeRegexPattern(undefined)).toEqual([])
    expect(tokenizeRegexPattern(123)).toEqual([])
  })

  it('普通字符应该被识别为 plain 并合并为单个 token', () => {
    const tokens = tokenizeRegexPattern('abc')
    expect(tokens.length).toBe(1)
    expect(tokens.every((t) => t.type === 'plain')).toBe(true)
    expect(tokens[0].value).toBe('abc')
    expect(tokens[0].start).toBe(0)
    expect(tokens[0].end).toBe(3)
  })

  it('转义字符 \\d, \\w, \\s 等应该被识别为 escape 并合并', () => {
    const tokens = tokenizeRegexPattern('\\d\\w\\s')
    expect(tokens.length).toBe(1)
    expect(tokens[0].type).toBe('escape')
    expect(tokens[0].value).toBe('\\d\\w\\s')
  })

  it('普通转义字符也应该识别为 escape 并合并', () => {
    const tokens = tokenizeRegexPattern('\\.\\+\\*')
    expect(tokens.length).toBe(1)
    expect(tokens[0].type).toBe('escape')
    expect(tokens[0].value).toBe('\\.\\+\\*')
  })

  it('字符类 [...] 应该被识别为 charClass', () => {
    const tokens = tokenizeRegexPattern('[a-z]')
    expect(tokens.length).toBe(1)
    expect(tokens[0].type).toBe('charClass')
    expect(tokens[0].value).toBe('[a-z]')
  })

  it('否定字符类 [^...] 应该被识别为 charClass', () => {
    const tokens = tokenizeRegexPattern('[^0-9]')
    expect(tokens.length).toBe(1)
    expect(tokens[0].type).toBe('charClass')
    expect(tokens[0].value).toBe('[^0-9]')
  })

  it('字符类中的转义字符应该被正确处理', () => {
    const tokens = tokenizeRegexPattern('[a\\]z]')
    expect(tokens.length).toBe(1)
    expect(tokens[0].type).toBe('charClass')
    expect(tokens[0].value).toBe('[a\\]z]')
  })

  it('普通捕获组括号 ( ) 应该被识别为 group', () => {
    const tokens = tokenizeRegexPattern('(abc)')
    expect(tokens.length).toBe(3)
    expect(tokens[0].type).toBe('group')
    expect(tokens[0].value).toBe('(')
    expect(tokens[1].type).toBe('plain')
    expect(tokens[1].value).toBe('abc')
    expect(tokens[2].type).toBe('group')
    expect(tokens[2].value).toBe(')')
  })

  it('非捕获组 (?:...) 应该被识别为 group', () => {
    const tokens = tokenizeRegexPattern('(?:abc)')
    expect(tokens[0].type).toBe('group')
    expect(tokens[0].value).toBe('(?:')
  })

  it('命名捕获组 (?<name>...) 应该被识别为 namedGroup', () => {
    const tokens = tokenizeRegexPattern('(?<user>\\w+)')
    expect(tokens[0].type).toBe('namedGroup')
    expect(tokens[0].value).toBe('(?<user>')
  })

  it('正向前瞻 (?=...) 应该被识别为 group', () => {
    const tokens = tokenizeRegexPattern('foo(?=bar)')
    const groups = tokens.filter((t) => t.type === 'group')
    expect(groups.length).toBe(2)
    expect(groups[0].value).toBe('(?=')
  })

  it('负向前瞻 (?!...) 应该被识别为 group', () => {
    const tokens = tokenizeRegexPattern('foo(?!bar)')
    const groups = tokens.filter((t) => t.type === 'group')
    expect(groups.length).toBe(2)
    expect(groups[0].value).toBe('(?!')
  })

  it('量词 *, +, ? 应该被识别为 quantifier', () => {
    const tokens = tokenizeRegexPattern('a*b+c?')
    const quants = tokens.filter((t) => t.type === 'quantifier')
    expect(quants.length).toBe(3)
    expect(quants.map((q) => q.value)).toEqual(['*', '+', '?'])
  })

  it('惰性量词 *?, +?, ?? 应该被识别为 quantifier', () => {
    const tokens = tokenizeRegexPattern('a*?b+?c??')
    const quants = tokens.filter((t) => t.type === 'quantifier')
    expect(quants.length).toBe(3)
    expect(quants.map((q) => q.value)).toEqual(['*?', '+?', '??'])
  })

  it('范围量词 {n}, {n,m} 应该被识别为 quantifier', () => {
    const tokens = tokenizeRegexPattern('a{3}b{2,5}c{1,}')
    const quants = tokens.filter((t) => t.type === 'quantifier')
    expect(quants.length).toBe(3)
    expect(quants.map((q) => q.value)).toEqual(['{3}', '{2,5}', '{1,}'])
  })

  it('锚点 ^ 和 $ 应该被识别为 anchor', () => {
    const tokens = tokenizeRegexPattern('^abc$')
    const anchors = tokens.filter((t) => t.type === 'anchor')
    expect(anchors.length).toBe(2)
    expect(anchors[0].value).toBe('^')
    expect(anchors[1].value).toBe('$')
  })

  it('选择符 | 应该被识别为 alternation', () => {
    const tokens = tokenizeRegexPattern('a|b')
    expect(tokens[1].type).toBe('alternation')
    expect(tokens[1].value).toBe('|')
  })

  it('点号 . 应该被识别为 special', () => {
    const tokens = tokenizeRegexPattern('a.b')
    expect(tokens[1].type).toBe('special')
    expect(tokens[1].value).toBe('.')
  })

  it('token 应该包含正确的 start 和 end 位置', () => {
    const tokens = tokenizeRegexPattern('a\\d[b]')
    expect(tokens[0].start).toBe(0)
    expect(tokens[0].end).toBe(1)
    expect(tokens[1].start).toBe(1)
    expect(tokens[1].end).toBe(3)
    expect(tokens[2].start).toBe(3)
    expect(tokens[2].end).toBe(6)
  })

  it('复杂正则应该被正确 token 化', () => {
    const tokens = tokenizeRegexPattern('^(\\w+)@.+(\\w+)$')
    const types = tokens.map((t) => t.type)
    expect(types).toContain('anchor')
    expect(types).toContain('group')
    expect(types).toContain('escape')
    expect(types).toContain('plain')
    expect(types).toContain('special')
  })

  it('所有 token 的 value 拼接起来应该等于原始正则', () => {
    const patterns = [
      '',
      'abc',
      '^\\w+@\\w+\\.\\w+$',
      '(?:a|b)*c{2,3}',
      '[a-z0-9]+',
      '(?<name>\\w+)',
      'foo(?=bar)(?!baz)',
    ]
    for (const p of patterns) {
      const tokens = tokenizeRegexPattern(p)
      const reconstructed = tokens.map((t) => t.value).join('')
      expect(reconstructed).toBe(p)
    }
  })

  it('连续的同类 token 应该被正确合并', () => {
    const tokens = tokenizeRegexPattern('hello')
    expect(tokens.length).toBe(1)
    expect(tokens[0].type).toBe('plain')
    expect(tokens[0].value).toBe('hello')
  })

  it('合并后 token 的 start 和 end 应该正确', () => {
    const tokens = tokenizeRegexPattern('foo\\d\\dbar')
    expect(tokens.length).toBe(3)
    expect(tokens[0].type).toBe('plain')
    expect(tokens[0].value).toBe('foo')
    expect(tokens[0].start).toBe(0)
    expect(tokens[0].end).toBe(3)
    expect(tokens[1].type).toBe('escape')
    expect(tokens[1].value).toBe('\\d\\d')
    expect(tokens[1].start).toBe(3)
    expect(tokens[1].end).toBe(7)
    expect(tokens[2].type).toBe('plain')
    expect(tokens[2].value).toBe('bar')
    expect(tokens[2].start).toBe(7)
    expect(tokens[2].end).toBe(10)
  })

  it('连续的量词 token 不应该被错误合并（通常不会连续出现）', () => {
    const tokens = tokenizeRegexPattern('a*?+')
    expect(tokens.length).toBe(2)
    expect(tokens[0].type).toBe('plain')
    expect(tokens[1].type).toBe('quantifier')
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该在等待时间后执行函数', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('重复调用应该重置计时器', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    vi.advanceTimersByTime(50)
    debounced()
    vi.advanceTimersByTime(50)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('应该传递参数给被包装函数', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced('a', 'b', 'c')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith('a', 'b', 'c')
  })

  it('应该保持正确的 this 上下文', () => {
    const context = { value: 42 }
    const fn = vi.fn(function () {
      return this.value
    })
    const debounced = debounce(fn, 100)
    debounced.call(context)
    vi.advanceTimersByTime(100)
    expect(fn).toHaveReturnedWith(42)
  })

  it('cancel 方法应该取消待执行的函数', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(100)
    expect(fn).not.toHaveBeenCalled()
  })

  it('flush 方法应该立即执行待执行的函数', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    expect(fn).not.toHaveBeenCalled()
    debounced.flush()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('flush 方法应该正确传递参数和上下文', () => {
    const context = { value: 99 }
    const fn = vi.fn(function (x, y) {
      return this.value + x + y
    })
    const debounced = debounce(fn, 100)
    debounced.call(context, 1, 2)
    debounced.flush()
    expect(fn).toHaveBeenCalledWith(1, 2)
    expect(fn).toHaveReturnedWith(102)
  })

  it('flush 在没有待执行函数时不应该调用', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced.flush()
    expect(fn).not.toHaveBeenCalled()
  })

  it('flush 执行后，等待时间内不应该再次执行', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    debounced.flush()
    expect(fn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('传入非函数参数应该抛出 TypeError', () => {
    expect(() => debounce(null, 100)).toThrow(TypeError)
    expect(() => debounce('not a function', 100)).toThrow(TypeError)
  })
})

describe('computeDiff', () => {
  it('相同字符串应该返回单个 equal 操作', () => {
    const diff = computeDiff('abc', 'abc')
    expect(diff).toEqual([{ type: 'equal', value: 'abc' }])
  })

  it('空字符串应该返回正确结果', () => {
    expect(computeDiff('', '')).toEqual([{ type: 'equal', value: '' }])
    expect(computeDiff('', 'abc')).toEqual([{ type: 'insert', value: 'abc' }])
    expect(computeDiff('abc', '')).toEqual([{ type: 'delete', value: 'abc' }])
  })

  it('应该正确处理完全不同的字符串', () => {
    const diff = computeDiff('abc', 'xyz')
    expect(diff.some((op) => op.type === 'delete')).toBe(true)
    expect(diff.some((op) => op.type === 'insert')).toBe(true)
    const reconstructed = diff
      .filter((op) => op.type !== 'delete')
      .map((op) => op.value)
      .join('')
    expect(reconstructed).toBe('xyz')
  })

  it('应该正确处理共同前缀', () => {
    const diff = computeDiff('hello world', 'hello there')
    expect(diff[0].type).toBe('equal')
    expect(diff[0].value).toBe('hello ')
  })

  it('应该正确处理共同后缀', () => {
    const diff = computeDiff('abc_end', 'xyz_end')
    const last = diff[diff.length - 1]
    expect(last.type).toBe('equal')
    expect(last.value).toBe('_end')
  })

  it('应该正确处理中间的变更', () => {
    const diff = computeDiff('prefixOLDsuffix', 'prefixNEWsuffix')
    expect(diff[0].type).toBe('equal')
    expect(diff[0].value).toBe('prefix')
    const middleOps = diff.slice(1, -1)
    expect(middleOps.some((op) => op.type === 'delete')).toBe(true)
    expect(middleOps.some((op) => op.type === 'insert')).toBe(true)
    expect(diff[diff.length - 1].type).toBe('equal')
    expect(diff[diff.length - 1].value).toBe('suffix')
  })

  it('重建结果应该等于新字符串', () => {
    const cases = [
      ['abc', 'abc'],
      ['', 'abc'],
      ['abc', ''],
      ['abc', 'xyz'],
      ['hello world', 'hello there'],
      ['a', 'aa'],
      ['aa', 'a'],
      ['kitten', 'sitting'],
      ['saturday', 'sunday'],
    ]
    for (const [oldStr, newStr] of cases) {
      const diff = computeDiff(oldStr, newStr)
      const reconstructed = diff
        .filter((op) => op.type !== 'delete')
        .map((op) => op.value)
        .join('')
      expect(reconstructed).toBe(newStr)
    }
  })

  it('原始字符串通过 equal 和 delete 重建应该等于旧字符串', () => {
    const cases = [
      ['abc', 'xyz'],
      ['hello world', 'hello there'],
      ['kitten', 'sitting'],
      ['saturday', 'sunday'],
      ['prefixOLDsuffix', 'prefixNEWsuffix'],
    ]
    for (const [oldStr, newStr] of cases) {
      const diff = computeDiff(oldStr, newStr)
      const reconstructed = diff
        .filter((op) => op.type !== 'insert')
        .map((op) => op.value)
        .join('')
      expect(reconstructed).toBe(oldStr)
    }
  })

  it('非字符串输入应该被当作空字符串', () => {
    expect(computeDiff(null, undefined)).toEqual([{ type: 'equal', value: '' }])
    expect(computeDiff(123, 'abc')).toEqual([{ type: 'insert', value: 'abc' }])
  })

  it('相邻的相同类型操作应该被合并', () => {
    const diff = computeDiff('aaaa', 'bbbb')
    let lastType = null
    for (const op of diff) {
      if (op.type === lastType && lastType !== 'equal') {
        throw new Error(`相邻的 ${lastType} 操作应该被合并`)
      }
      lastType = op.type
    }
  })

  it('应该正确处理 Unicode 字符串', () => {
    const diff = computeDiff('你好世界', '你好中国')
    expect(diff[0].type).toBe('equal')
    expect(diff[0].value).toBe('你好')
    const reconstructed = diff
      .filter((op) => op.type !== 'delete')
      .map((op) => op.value)
      .join('')
    expect(reconstructed).toBe('你好中国')
  })

  describe('多路径 LCS 场景（锁定操作顺序）', () => {
    it("'ab' -> 'ba'：LCS 可选 'a' 或 'b'，算法应优先删除，输出 delete-a, equal-b, insert-a", () => {
      const diff = computeDiff('ab', 'ba')
      expect(diff).toEqual([
        { type: 'delete', value: 'a' },
        { type: 'equal', value: 'b' },
        { type: 'insert', value: 'a' },
      ])
    })

    it("'xy' -> 'yx'：应优先删除 x，匹配 y，最后插入 x", () => {
      const diff = computeDiff('xy', 'yx')
      expect(diff).toEqual([
        { type: 'delete', value: 'x' },
        { type: 'equal', value: 'y' },
        { type: 'insert', value: 'x' },
      ])
    })

    it("'12' -> '21'：应优先删除 1，匹配 2，最后插入 1", () => {
      const diff = computeDiff('12', '21')
      expect(diff).toEqual([
        { type: 'delete', value: '1' },
        { type: 'equal', value: '2' },
        { type: 'insert', value: '1' },
      ])
    })

    it("'abc' -> 'cba'：多字符反转，优先连续删除 ab，匹配 c，最后插入 ba", () => {
      const diff = computeDiff('abc', 'cba')
      expect(diff).toEqual([
        { type: 'delete', value: 'ab' },
        { type: 'equal', value: 'c' },
        { type: 'insert', value: 'ba' },
      ])
    })

    it("'acb' -> 'bca'：优先连续删除 ac，匹配 b，最后插入 ca", () => {
      const diff = computeDiff('acb', 'bca')
      expect(diff).toEqual([
        { type: 'delete', value: 'ac' },
        { type: 'equal', value: 'b' },
        { type: 'insert', value: 'ca' },
      ])
    })

    it("'aab' -> 'aba'：LCS 长度为 2，应 equal-a, delete-a, equal-b, insert-a", () => {
      const diff = computeDiff('aab', 'aba')
      expect(diff).toEqual([
        { type: 'equal', value: 'a' },
        { type: 'delete', value: 'a' },
        { type: 'equal', value: 'b' },
        { type: 'insert', value: 'a' },
      ])
    })

    it("'abba' -> 'baab'：LCS 长度为 2，交错的 delete/equal/insert 顺序应可预期", () => {
      const diff = computeDiff('abba', 'baab')
      expect(diff).toEqual([
        { type: 'delete', value: 'a' },
        { type: 'equal', value: 'b' },
        { type: 'delete', value: 'b' },
        { type: 'equal', value: 'a' },
        { type: 'insert', value: 'ab' },
      ])
    })

    it("'kitten' -> 'sitting'：复杂多路径场景应输出确定的操作序列", () => {
      const diff = computeDiff('kitten', 'sitting')
      expect(diff).toEqual([
        { type: 'delete', value: 'k' },
        { type: 'insert', value: 's' },
        { type: 'equal', value: 'itt' },
        { type: 'delete', value: 'e' },
        { type: 'insert', value: 'i' },
        { type: 'equal', value: 'n' },
        { type: 'insert', value: 'g' },
      ])
    })

    it("dp[i+1][j] === dp[i][j+1] 时应稳定地优先选择删除而非插入", () => {
      const diff1 = computeDiff('ab', 'ba')
      const diff2 = computeDiff('ab', 'ba')
      const diff3 = computeDiff('ab', 'ba')
      expect(diff1).toEqual(diff2)
      expect(diff2).toEqual(diff3)
      expect(diff1[0].type).toBe('delete')
    })
  })
})
