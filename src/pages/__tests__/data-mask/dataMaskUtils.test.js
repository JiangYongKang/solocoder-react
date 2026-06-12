import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    applyRule,
    applyRules,
    buildHighlightSegments,
    countSensitiveInfo,
    debounce,
    generateCSV,
    getStatsSummary,
    processBatchLines,
    validateRegex,
} from '../../data-mask/dataMaskUtils'

const phoneRule = {
  id: 'phone',
  name: '手机号脱敏',
  pattern: '1\\d{10}',
  groupPattern: '(1\\d{2})(\\d{4})(\\d{4})',
  replacement: '$1****$3',
  description: '匹配1开头的11位数字',
  enabled: true,
}

const emailRule = {
  id: 'email',
  name: '邮箱脱敏',
  pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
  groupPattern: '([a-zA-Z0-9._%+\\-])[a-zA-Z0-9._%+\\-]*@([a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,})',
  replacement: '$1***@$2',
  description: '保留第一个字符和@后域名',
  enabled: true,
}

const disabledRule = {
  id: 'disabled',
  name: '禁用规则',
  pattern: '\\d+',
  replacement: '***',
  enabled: false,
}

describe('applyRule', () => {
  it('应该正确脱敏手机号', () => {
    const { result, matches } = applyRule('手机号13812345678请保存', phoneRule)
    expect(result).toBe('手机号138****5678请保存')
    expect(matches.length).toBe(1)
    expect(matches[0].original).toBe('13812345678')
    expect(matches[0].ruleId).toBe('phone')
  })

  it('应该正确脱敏邮箱', () => {
    const { result, matches } = applyRule('联系test@example.com', emailRule)
    expect(result).toBe('联系t***@example.com')
    expect(matches.length).toBe(1)
    expect(matches[0].ruleId).toBe('email')
  })

  it('禁用规则不应处理文本', () => {
    const { result, matches } = applyRule('12345', disabledRule)
    expect(result).toBe('12345')
    expect(matches.length).toBe(0)
  })

  it('空文本应返回空', () => {
    const { result, matches } = applyRule('', phoneRule)
    expect(result).toBe('')
    expect(matches.length).toBe(0)
  })

  it('无匹配时应返回原文', () => {
    const { result, matches } = applyRule('hello world', phoneRule)
    expect(result).toBe('hello world')
    expect(matches.length).toBe(0)
  })

  it('无效正则应返回原文', () => {
    const badRule = { ...phoneRule, groupPattern: '([invalid', enabled: true }
    const { result, matches } = applyRule('13812345678', badRule)
    expect(result).toBe('13812345678')
    expect(matches.length).toBe(0)
  })

  it('null规则应返回原文', () => {
    const { result, matches } = applyRule('hello', null)
    expect(result).toBe('hello')
    expect(matches.length).toBe(0)
  })

  it('应匹配多个敏感信息', () => {
    const { matches } = applyRule('手机13812345678和15698765432', phoneRule)
    expect(matches.length).toBe(2)
  })

  it('自定义规则的捕获组替换模板应该生效', () => {
    const customRule = {
      id: 'custom',
      name: '自定义测试',
      pattern: '([A-Z]{2})-(\\d{4})',
      groupPattern: '([A-Z]{2})-(\\d{4})',
      replacement: '$1-****',
      enabled: true,
    }
    const { result } = applyRule('订单号AB-1234已完成', customRule)
    expect(result).toBe('订单号AB-****已完成')
  })

  it('自定义规则替换模板$2引用应该生效', () => {
    const customRule = {
      id: 'custom',
      name: '自定义',
      pattern: '(\\d{3})-(\\d{4})',
      groupPattern: '(\\d{3})-(\\d{4})',
      replacement: '***-$2',
      enabled: true,
    }
    const { result } = applyRule('编号123-4567', customRule)
    expect(result).toBe('编号***-4567')
  })

  it('双位数捕获组$10应该正确处理，不被$1误替换', () => {
    const manyGroupsRule = {
      id: 'many',
      name: '多组捕获',
      pattern: '^(A)(B)(C)(D)(E)(F)(G)(H)(I)(J)$',
      groupPattern: '^(A)(B)(C)(D)(E)(F)(G)(H)(I)(J)$',
      replacement: '[$10][$1]',
      enabled: true,
    }
    const { result } = applyRule('ABCDEFGHIJ', manyGroupsRule)
    expect(result).toBe('[J][A]')
  })

  it('$1和$10混合应该正确解析', () => {
    const rule = {
      id: 'mix',
      name: '混合',
      pattern: '^(x)(y)(z)(w)(v)(u)(t)(s)(r)(q)$',
      groupPattern: '^(x)(y)(z)(w)(v)(u)(t)(s)(r)(q)$',
      replacement: '$10-$1',
      enabled: true,
    }
    const { result } = applyRule('xyzwvutsrq', rule)
    expect(result).toBe('q-x')
  })

  it('不存在的捕获组引用应该保留原字符串', () => {
    const rule = {
      id: 't',
      name: 'test',
      pattern: '^(a)(b)$',
      groupPattern: '^(a)(b)$',
      replacement: '$1-$3-$50',
      enabled: true,
    }
    const { result } = applyRule('ab', rule)
    expect(result).toBe('a-$3-$50')
  })

  it('$&应该替换为完整匹配文本', () => {
    const rule = {
      id: 'amp',
      name: 'amp测试',
      pattern: 'hello',
      groupPattern: 'hello',
      replacement: '[$&]',
      enabled: true,
    }
    const { result } = applyRule('say hello world', rule)
    expect(result).toBe('say [hello] world')
  })
})

describe('applyRules', () => {
  it('应该按顺序应用多个规则', () => {
    const rules = [phoneRule, emailRule]
    const text = '手机13812345678，邮箱test@example.com'
    const { matches, stats } = applyRules(text, rules)
    expect(matches.length).toBe(2)
    expect(stats.phone).toBe(1)
    expect(stats.email).toBe(1)
  })

  it('空规则列表应返回原文', () => {
    const { result, matches, stats } = applyRules('hello', [])
    expect(result).toBe('hello')
    expect(matches.length).toBe(0)
    expect(Object.keys(stats).length).toBe(0)
  })

  it('全部禁用规则应返回原文', () => {
    const rules = [disabledRule]
    const { result, matches } = applyRules('12345', rules)
    expect(result).toBe('12345')
    expect(matches.length).toBe(0)
  })

  it('空文本应返回空', () => {
    const { result } = applyRules('', [phoneRule])
    expect(result).toBe('')
  })

  it('null文本应返回空', () => {
    const { result } = applyRules(null, [phoneRule])
    expect(result).toBe('')
  })

  it('null规则应返回原文', () => {
    const { result } = applyRules('hello', null)
    expect(result).toBe('hello')
  })

  it('多条规则不应该相互干扰 - 先脱敏的星号不应被后续规则匹配', () => {
    const starMatchingRule = {
      id: 'stars',
      name: '星号匹配',
      pattern: '\\*{4}',
      replacement: 'XXXX',
      enabled: true,
    }
    const rules = [phoneRule, starMatchingRule]
    const text = '手机13812345678'
    const { result, stats } = applyRules(text, rules)
    expect(result).toBe('手机138****5678')
    expect(stats.phone).toBe(1)
    expect(stats.stars).toBeUndefined()
  })

  it('重叠匹配区间应该只处理最先匹配到的规则', () => {
    const ruleA = {
      id: 'a',
      name: '规则A',
      pattern: '1\\d{2}',
      groupPattern: '1\\d{2}',
      replacement: 'AAA',
      enabled: true,
    }
    const ruleB = {
      id: 'b',
      name: '规则B',
      pattern: '\\d{4}',
      groupPattern: '\\d{4}',
      replacement: 'BBBB',
      enabled: true,
    }
    const rules = [ruleA, ruleB]
    const text = '1234'
    const { result, matches } = applyRules(text, rules)
    expect(matches.length).toBe(1)
    expect(matches[0].ruleId).toBe('a')
    expect(result).toBe('AAA4')
  })

  it('非重叠区间两个规则都应生效', () => {
    const ruleA = {
      id: 'a',
      name: '规则A',
      pattern: 'ABC',
      replacement: '***',
      enabled: true,
    }
    const ruleB = {
      id: 'b',
      name: '规则B',
      pattern: 'XYZ',
      replacement: '###',
      enabled: true,
    }
    const rules = [ruleA, ruleB]
    const text = 'ABC-XYZ'
    const { result, stats } = applyRules(text, rules)
    expect(result).toBe('***-###')
    expect(stats.a).toBe(1)
    expect(stats.b).toBe(1)
  })

  it('自定义规则捕获组替换在多规则场景下也应生效', () => {
    const customRule = {
      id: 'custom',
      name: 'IP脱敏',
      pattern: '(\\d{1,3})\\.(\\d{1,3})\\.\\d{1,3}\\.\\d{1,3}',
      groupPattern: '(\\d{1,3})\\.(\\d{1,3})\\.\\d{1,3}\\.\\d{1,3}',
      replacement: '$1.$2.***.***',
      enabled: true,
    }
    const rules = [phoneRule, customRule]
    const text = '服务器IP 192.168.1.100，手机13812345678'
    const { result, stats } = applyRules(text, rules)
    expect(result).toBe('服务器IP 192.168.***.***，手机138****5678')
    expect(stats.phone).toBe(1)
    expect(stats.custom).toBe(1)
  })
})

describe('countSensitiveInfo', () => {
  it('应该正确统计敏感信息数量', () => {
    const rules = [phoneRule, emailRule]
    const text = '手机13812345678和15698765432，邮箱a@b.com'
    const { total, details } = countSensitiveInfo(text, rules)
    expect(total).toBe(3)
    expect(details.phone.count).toBe(2)
    expect(details.email.count).toBe(1)
  })

  it('空文本应返回零', () => {
    const { total } = countSensitiveInfo('', [phoneRule])
    expect(total).toBe(0)
  })

  it('无规则应返回零', () => {
    const { total } = countSensitiveInfo('hello', [])
    expect(total).toBe(0)
  })

  it('禁用规则不应计数', () => {
    const { total, details } = countSensitiveInfo('12345', [disabledRule])
    expect(total).toBe(0)
    expect(details.disabled).toBeUndefined()
  })

  it('无效正则应跳过', () => {
    const badRule = { id: 'bad', name: 'bad', pattern: '([invalid', enabled: true }
    const { total } = countSensitiveInfo('hello', [badRule])
    expect(total).toBe(0)
  })

  it('统计时不应将脱敏替换后的星号当作敏感信息', () => {
    const starRule = {
      id: 'stars',
      name: '星号匹配',
      pattern: '\\*{4}',
      enabled: true,
    }
    const rules = [phoneRule, starRule]
    const text = '手机13812345678'
    const { total, details } = countSensitiveInfo(text, rules)
    expect(total).toBe(1)
    expect(details.phone.count).toBe(1)
    expect(details.stars).toBeUndefined()
  })

  it('重叠区间只应计数一次', () => {
    const ruleA = { id: 'a', name: 'A', pattern: '1\\d{2}', enabled: true }
    const ruleB = { id: 'b', name: 'B', pattern: '\\d{4}', enabled: true }
    const { total } = countSensitiveInfo('1234', [ruleA, ruleB])
    expect(total).toBe(1)
  })
})

describe('buildHighlightSegments', () => {
  it('应该正确构建高亮片段（只接收2个参数）', () => {
    const rules = [phoneRule]
    const text = '手机13812345678联系'
    const segments = buildHighlightSegments(text, rules)
    expect(segments.length).toBe(3)
    expect(segments[0].type).toBe('normal')
    expect(segments[0].value).toBe('手机')
    expect(segments[1].type).toBe('masked')
    expect(segments[1].value).toBe('13812345678')
    expect(segments[2].type).toBe('normal')
    expect(segments[2].value).toBe('联系')
  })

  it('无匹配时应返回正常片段', () => {
    const segments = buildHighlightSegments('hello', [phoneRule])
    expect(segments.length).toBe(1)
    expect(segments[0].type).toBe('normal')
    expect(segments[0].value).toBe('hello')
  })

  it('空文本应返回空数组', () => {
    const segments = buildHighlightSegments('', [phoneRule])
    expect(segments).toEqual([])
  })

  it('空规则应返回正常片段', () => {
    const segments = buildHighlightSegments('hello', [])
    expect(segments.length).toBe(1)
    expect(segments[0].type).toBe('normal')
  })

  it('全部禁用规则应返回正常片段', () => {
    const segments = buildHighlightSegments('hello', [disabledRule])
    expect(segments.length).toBe(1)
    expect(segments[0].type).toBe('normal')
  })

  it('多个匹配应生成多个高亮片段', () => {
    const rules = [phoneRule]
    const text = '13812345678和15698765432'
    const segments = buildHighlightSegments(text, rules)
    const masked = segments.filter((s) => s.type === 'masked')
    expect(masked.length).toBe(2)
  })

  it('重叠区间应该合并且只高亮一次', () => {
    const overlapRule1 = { id: 'a', name: 'A', pattern: '1\\d{2}', enabled: true }
    const overlapRule2 = { id: 'b', name: 'B', pattern: '1\\d{3}', enabled: true }
    const text = '1381'
    const segments = buildHighlightSegments(text, [overlapRule1, overlapRule2])
    const masked = segments.filter((s) => s.type === 'masked')
    expect(masked.length).toBe(1)
  })

  it('高亮片段不应该被脱敏结果干扰', () => {
    const starRule = {
      id: 'stars',
      name: '星号匹配',
      pattern: '\\*{4}',
      enabled: true,
    }
    const rules = [phoneRule, starRule]
    const text = '手机13812345678'
    const segments = buildHighlightSegments(text, rules)
    const masked = segments.filter((s) => s.type === 'masked')
    expect(masked.length).toBe(1)
    expect(masked[0].value).toBe('13812345678')
  })
})

describe('processBatchLines', () => {
  it('应该按行处理文本', () => {
    const rules = [phoneRule]
    const text = '13812345678\n15698765432'
    const results = processBatchLines(text, rules)
    expect(results.length).toBe(2)
    expect(results[0].lineNum).toBe(1)
    expect(results[0].original).toBe('13812345678')
    expect(results[0].masked).toBe('138****5678')
    expect(results[1].lineNum).toBe(2)
  })

  it('空文本应返回空数组', () => {
    const results = processBatchLines('', [phoneRule])
    expect(results).toEqual([])
  })

  it('null文本应返回空数组', () => {
    const results = processBatchLines(null, [phoneRule])
    expect(results).toEqual([])
  })

  it('每行应独立应用规则', () => {
    const rules = [phoneRule, emailRule]
    const text = '13812345678\ntest@example.com'
    const results = processBatchLines(text, rules)
    expect(results[0].stats.phone).toBe(1)
    expect(results[1].stats.email).toBe(1)
  })

  it('批量处理时规则不相互干扰', () => {
    const starRule = {
      id: 'stars',
      name: '星号匹配',
      pattern: '\\*{4}',
      replacement: 'XXXX',
      enabled: true,
    }
    const rules = [phoneRule, starRule]
    const text = '13812345678'
    const results = processBatchLines(text, rules)
    expect(results[0].masked).toBe('138****5678')
    expect(results[0].stats.stars).toBeUndefined()
  })
})

describe('generateCSV', () => {
  it('批量模式应生成正确的CSV', () => {
    const data = [
      { original: '13812345678', masked: '138****5678' },
      { original: 'test@example.com', masked: 't***@example.com' },
    ]
    const csv = generateCSV(data, true)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('原文本')
    expect(csv).toContain('脱敏结果')
    expect(csv).toContain('13812345678')
    expect(csv).toContain('138****5678')
  })

  it('普通模式应生成两行CSV', () => {
    const data = { original: '13812345678', masked: '138****5678' }
    const csv = generateCSV(data, false)
    expect(csv).toContain('原文本')
    expect(csv).toContain('13812345678')
  })

  it('包含逗号的值应加引号', () => {
    const data = [{ original: 'a,b', masked: 'x,y' }]
    const csv = generateCSV(data, true)
    expect(csv).toContain('"a,b"')
    expect(csv).toContain('"x,y"')
  })

  it('包含双引号的值应转义', () => {
    const data = [{ original: 'a"b', masked: 'x' }]
    const csv = generateCSV(data, true)
    expect(csv).toContain('"a""b"')
  })

  it('包含换行的值应加引号', () => {
    const data = [{ original: 'a\nb', masked: 'x' }]
    const csv = generateCSV(data, true)
    expect(csv).toContain('"a\nb"')
  })

  it('null值应转为空字符串', () => {
    const data = [{ original: null, masked: null }]
    const csv = generateCSV(data, true)
    expect(csv).not.toContain('null')
  })
})

describe('validateRegex', () => {
  it('有效正则应返回valid', () => {
    expect(validateRegex('\\d+').valid).toBe(true)
    expect(validateRegex('abc').valid).toBe(true)
    expect(validateRegex('[a-z]+').valid).toBe(true)
  })

  it('无效正则应返回错误', () => {
    const result = validateRegex('([invalid')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('空字符串应返回错误', () => {
    const result = validateRegex('')
    expect(result.valid).toBe(false)
  })

  it('null应返回错误', () => {
    const result = validateRegex(null)
    expect(result.valid).toBe(false)
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该在延迟后调用函数', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('a')
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('连续调用应该只执行最后一次', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('a')
    debounced('b')
    debounced('c')
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('cancel应该取消执行', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('a')
    debounced.cancel()
    vi.advanceTimersByTime(300)
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('getStatsSummary', () => {
  it('应该正确汇总统计', () => {
    const stats = { phone: 3, email: 2 }
    const rules = [
      { id: 'phone', name: '手机号脱敏' },
      { id: 'email', name: '邮箱脱敏' },
      { id: 'idcard', name: '身份证脱敏' },
    ]
    const { total, details } = getStatsSummary(stats, rules)
    expect(total).toBe(5)
    expect(details.length).toBe(2)
    expect(details[0].name).toBe('手机号脱敏')
    expect(details[0].count).toBe(3)
    expect(details[1].name).toBe('邮箱脱敏')
    expect(details[1].count).toBe(2)
  })

  it('空统计应返回零', () => {
    const { total, details } = getStatsSummary({}, [])
    expect(total).toBe(0)
    expect(details).toEqual([])
  })
})
