import { describe, it, expect } from 'vitest'
import {
  normalizeText,
  tokenizeWords,
  splitIntoChars,
  splitIntoLines,
  computeDiffCount,
  computeCharDiffCount,
  computeWordDiffCount,
  computeLineDiffCount,
  computeSimilarity,
  computeCharSimilarity,
  computeWordSimilarity,
  computeLineSimilarity,
  computeAllDiffStats,
  computeWordFrequency,
  computeCombinedWordFrequency,
  getSimilarityColor,
  buildLineDiffPairs,
  computeCharDiffForLine,
} from '../../text-diff/textDiffStats'

describe('normalizeText', () => {
  it('应该将文本转换为小写', () => {
    expect(normalizeText('Hello World')).toBe('hello world')
  })

  it('应该移除标点符号', () => {
    expect(normalizeText('Hello, World!')).toBe('hello world')
  })

  it('应该保留中文字符', () => {
    expect(normalizeText('你好，世界！')).toBe('你好世界')
  })

  it('非字符串输入应该返回空字符串', () => {
    expect(normalizeText(null)).toBe('')
    expect(normalizeText(undefined)).toBe('')
    expect(normalizeText(123)).toBe('')
    expect(normalizeText({})).toBe('')
  })

  it('空字符串应该返回空字符串', () => {
    expect(normalizeText('')).toBe('')
  })

  it('应该移除特殊符号但保留空格', () => {
    expect(normalizeText('foo@bar#baz$qux')).toBe('foobarbazqux')
    expect(normalizeText('a b c')).toBe('a b c')
  })
})

describe('tokenizeWords', () => {
  it('应该按空格分割单词', () => {
    const result = tokenizeWords('hello world')
    expect(result).toEqual(['hello', 'world'])
  })

  it('应该忽略大小写和标点', () => {
    const result = tokenizeWords('Hello, World!')
    expect(result).toEqual(['hello', 'world'])
  })

  it('空字符串应该返回空数组', () => {
    expect(tokenizeWords('')).toEqual([])
    expect(tokenizeWords('   ')).toEqual([])
  })

  it('非字符串输入应该返回空数组', () => {
    expect(tokenizeWords(null)).toEqual([])
    expect(tokenizeWords(undefined)).toEqual([])
  })

  it('多个连续空格应该视为单个分隔符', () => {
    const result = tokenizeWords('a   b    c')
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('应该支持中文词语分割', () => {
    const result = tokenizeWords('你好 世界')
    expect(result).toEqual(['你好', '世界'])
  })
})

describe('splitIntoChars', () => {
  it('应该将字符串分割为字符数组', () => {
    expect(splitIntoChars('abc')).toEqual(['a', 'b', 'c'])
  })

  it('空字符串应该返回空数组', () => {
    expect(splitIntoChars('')).toEqual([])
  })

  it('非字符串输入应该返回空数组', () => {
    expect(splitIntoChars(null)).toEqual([])
    expect(splitIntoChars(undefined)).toEqual([])
    expect(splitIntoChars(123)).toEqual([])
  })
})

describe('splitIntoLines', () => {
  it('应该按换行符分割文本', () => {
    const result = splitIntoLines('a\nb\nc')
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('空字符串应该返回空数组', () => {
    expect(splitIntoLines('')).toEqual([])
  })

  it('非字符串输入应该返回空数组', () => {
    expect(splitIntoLines(null)).toEqual([])
    expect(splitIntoLines(undefined)).toEqual([])
    expect(splitIntoLines(123)).toEqual([])
  })

  it('单个换行符应该分割为两个空字符串', () => {
    expect(splitIntoLines('\n')).toEqual(['', ''])
  })

  it('应该保留末尾换行后的空行', () => {
    expect(splitIntoLines('a\n')).toEqual(['a', ''])
  })
})

describe('computeDiffCount', () => {
  it('完全相同的数组应该返回 0 差异', () => {
    const result = computeDiffCount(['a', 'b'], ['a', 'b'])
    expect(result.diff).toBe(0)
    expect(result.totalA).toBe(2)
    expect(result.totalB).toBe(2)
    expect(result.lcsLength).toBe(2)
  })

  it('完全不同的数组应该返回最大差异', () => {
    const result = computeDiffCount(['a', 'b'], ['c', 'd'])
    expect(result.diff).toBe(2)
    expect(result.lcsLength).toBe(0)
  })

  it('部分相同的数组应该计算正确的差异数', () => {
    const result = computeDiffCount(['a', 'b', 'c'], ['a', 'c', 'd'])
    expect(result.diff).toBe(1)
    expect(result.lcsLength).toBe(2)
  })

  it('空数组应该返回 0 差异', () => {
    const result = computeDiffCount([], [])
    expect(result.diff).toBe(0)
    expect(result.totalA).toBe(0)
    expect(result.totalB).toBe(0)
  })

  it('一侧为空数组时应该返回另一侧的长度', () => {
    const result = computeDiffCount(['a', 'b'], [])
    expect(result.diff).toBe(2)
    expect(result.totalA).toBe(2)
    expect(result.totalB).toBe(0)
  })

  it('非数组输入应该返回零值', () => {
    const result = computeDiffCount(null, undefined)
    expect(result.diff).toBe(0)
    expect(result.totalA).toBe(0)
    expect(result.totalB).toBe(0)
  })
})

describe('computeCharDiffCount', () => {
  it('应该正确计算字符级差异', () => {
    const result = computeCharDiffCount('abc', 'abd')
    expect(result.diff).toBe(1)
    expect(result.totalA).toBe(3)
    expect(result.totalB).toBe(3)
  })

  it('完全相同的字符串应该返回 0 差异', () => {
    const result = computeCharDiffCount('hello', 'hello')
    expect(result.diff).toBe(0)
  })

  it('空字符串应该返回 0 差异', () => {
    const result = computeCharDiffCount('', '')
    expect(result.diff).toBe(0)
  })
})

describe('computeWordDiffCount', () => {
  it('应该正确计算单词级差异', () => {
    const result = computeWordDiffCount('hello world', 'hello there')
    expect(result.diff).toBe(1)
  })

  it('忽略大小写和标点', () => {
    const result = computeWordDiffCount('Hello, World!', 'hello world')
    expect(result.diff).toBe(0)
  })

  it('空文本应该返回 0 差异', () => {
    const result = computeWordDiffCount('', '')
    expect(result.diff).toBe(0)
  })
})

describe('computeLineDiffCount', () => {
  it('应该正确计算行级差异', () => {
    const result = computeLineDiffCount('a\nb\nc', 'a\nd\nc')
    expect(result.diff).toBe(1)
  })

  it('完全相同的文本应该返回 0 差异', () => {
    const result = computeLineDiffCount('a\nb', 'a\nb')
    expect(result.diff).toBe(0)
  })
})

describe('computeSimilarity', () => {
  it('完全相同应该返回 100% 相似度', () => {
    const result = computeSimilarity({ diff: 0, totalA: 5, totalB: 5 })
    expect(result).toBe(100)
  })

  it('完全不同应该返回 0% 相似度', () => {
    const result = computeSimilarity({ diff: 5, totalA: 5, totalB: 5 })
    expect(result).toBe(0)
  })

  it('一半相同应该返回 50% 相似度', () => {
    const result = computeSimilarity({ diff: 2, totalA: 4, totalB: 4 })
    expect(result).toBe(50)
  })

  it('两端数量不同时以较大值为基准', () => {
    const result = computeSimilarity({ diff: 2, totalA: 2, totalB: 4 })
    expect(result).toBe(50)
  })

  it('两侧都为空应该返回 100% 相似度', () => {
    const result = computeSimilarity({ diff: 0, totalA: 0, totalB: 0 })
    expect(result).toBe(100)
  })

  it('非对象输入应该返回 0', () => {
    expect(computeSimilarity(null)).toBe(0)
    expect(computeSimilarity(undefined)).toBe(0)
  })
})

describe('computeCharSimilarity', () => {
  it('相同字符串应该返回 100%', () => {
    expect(computeCharSimilarity('hello', 'hello')).toBe(100)
  })

  it('完全不同应该返回 0%', () => {
    expect(computeCharSimilarity('abc', 'xyz')).toBe(0)
  })

  it('部分相同应该返回正确的相似度', () => {
    const sim = computeCharSimilarity('abcde', 'abxde')
    expect(sim).toBeGreaterThan(0)
    expect(sim).toBeLessThan(100)
  })
})

describe('computeWordSimilarity', () => {
  it('相同内容应该返回 100%', () => {
    expect(computeWordSimilarity('hello world', 'hello world')).toBe(100)
  })

  it('忽略大小写和标点', () => {
    expect(computeWordSimilarity('Hello, World!', 'hello world')).toBe(100)
  })
})

describe('computeLineSimilarity', () => {
  it('相同内容应该返回 100%', () => {
    expect(computeLineSimilarity('a\nb\nc', 'a\nb\nc')).toBe(100)
  })
})

describe('computeAllDiffStats', () => {
  it('应该返回三个维度的统计结果', () => {
    const result = computeAllDiffStats('hello world', 'hello there')
    expect(result).toHaveProperty('char')
    expect(result).toHaveProperty('word')
    expect(result).toHaveProperty('line')
    expect(result.char).toHaveProperty('diff')
    expect(result.char).toHaveProperty('similarity')
    expect(result.word).toHaveProperty('diff')
    expect(result.word).toHaveProperty('similarity')
    expect(result.line).toHaveProperty('diff')
    expect(result.line).toHaveProperty('similarity')
  })
})

describe('computeWordFrequency', () => {
  it('应该正确统计词频', () => {
    const result = computeWordFrequency('hello world hello')
    expect(result.length).toBe(2)
    expect(result.find((r) => r.word === 'hello').count).toBe(2)
    expect(result.find((r) => r.word === 'world').count).toBe(1)
  })

  it('应该按出现次数降序排列', () => {
    const result = computeWordFrequency('a b b c c c')
    expect(result[0].word).toBe('c')
    expect(result[0].count).toBe(3)
    expect(result[1].word).toBe('b')
    expect(result[1].count).toBe(2)
    expect(result[2].word).toBe('a')
    expect(result[2].count).toBe(1)
  })

  it('空文本应该返回空数组', () => {
    expect(computeWordFrequency('')).toEqual([])
  })

  it('应该包含百分比', () => {
    const result = computeWordFrequency('a a b')
    expect(result[0].percentage).toBeCloseTo(66.67, 1)
    expect(result[1].percentage).toBeCloseTo(33.33, 1)
  })
})

describe('computeCombinedWordFrequency', () => {
  it('应该合并两侧的词频统计', () => {
    const result = computeCombinedWordFrequency('hello world', 'hello there')
    const helloItem = result.find((r) => r.word === 'hello')
    expect(helloItem).toBeDefined()
    expect(helloItem.countA).toBe(1)
    expect(helloItem.countB).toBe(1)
  })

  it('只在一侧出现的单词也应该被统计', () => {
    const result = computeCombinedWordFrequency('foo', 'bar')
    expect(result.some((r) => r.word === 'foo')).toBe(true)
    expect(result.some((r) => r.word === 'bar')).toBe(true)
  })

  it('onlyDiff 为 true 时应该过滤掉两侧次数相同的单词', () => {
    const result = computeCombinedWordFrequency('a b', 'a c', 0, true)
    const aItem = result.find((r) => r.word === 'a')
    expect(aItem).toBeUndefined()
    expect(result.some((r) => r.word === 'b')).toBe(true)
    expect(result.some((r) => r.word === 'c')).toBe(true)
  })

  it('topN 应该限制返回数量', () => {
    const result = computeCombinedWordFrequency('a b c d e', 'a b c d e', 3)
    expect(result.length).toBe(3)
  })

  it('topN 为 0 时应该返回全部结果', () => {
    const result = computeCombinedWordFrequency('a b c d e', 'a b c d e', 0)
    expect(result.length).toBe(5)
  })
})

describe('getSimilarityColor', () => {
  it('应该返回有效的 RGB 颜色字符串', () => {
    const color = getSimilarityColor(50)
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  })

  it('0% 相似度应该偏红色', () => {
    const color = getSimilarityColor(0)
    expect(color).toMatch(/rgb\(255, \d+, \d+\)/)
  })

  it('100% 相似度应该偏绿色', () => {
    const color = getSimilarityColor(100)
    expect(color).toMatch(/rgb\(0, \d+, \d+\)/)
  })

  it('应该正确处理超出范围的值', () => {
    expect(() => getSimilarityColor(-10)).not.toThrow()
    expect(() => getSimilarityColor(200)).not.toThrow()
  })
})

describe('buildLineDiffPairs', () => {
  it('应该返回行对比对和原始行数组', () => {
    const result = buildLineDiffPairs('a\nb', 'a\nc')
    expect(result).toHaveProperty('pairs')
    expect(result).toHaveProperty('leftLines')
    expect(result).toHaveProperty('rightLines')
    expect(Array.isArray(result.pairs)).toBe(true)
    expect(result.leftLines).toEqual(['a', 'b'])
    expect(result.rightLines).toEqual(['a', 'c'])
  })

  it('应该正确识别相同的行', () => {
    const result = buildLineDiffPairs('a', 'a')
    expect(result.pairs.length).toBe(1)
    expect(result.pairs[0].type).toBe('equal')
  })

  it('应该正确识别新增的行', () => {
    const result = buildLineDiffPairs('', 'new')
    expect(result.pairs[0].type).toBe('added')
    expect(result.pairs[0].leftIndex).toBeNull()
    expect(result.pairs[0].rightIndex).toBe(0)
  })

  it('应该正确识别删除的行', () => {
    const result = buildLineDiffPairs('old', '')
    expect(result.pairs[0].type).toBe('removed')
    expect(result.pairs[0].leftIndex).toBe(0)
    expect(result.pairs[0].rightIndex).toBeNull()
  })

  it('每个 pair 应该包含左右内容', () => {
    const result = buildLineDiffPairs('hello', 'world')
    expect(result.pairs[0]).toHaveProperty('leftContent')
    expect(result.pairs[0]).toHaveProperty('rightContent')
  })
})

describe('computeCharDiffForLine', () => {
  it('相同字符串应该返回单个 equal 片段', () => {
    const result = computeCharDiffForLine('hello', 'hello')
    expect(result.length).toBe(1)
    expect(result[0].type).toBe('equal')
    expect(result[0].value).toBe('hello')
  })

  it('应该识别新增的字符', () => {
    const result = computeCharDiffForLine('helo', 'hello')
    const hasAdded = result.some((r) => r.type === 'added')
    expect(hasAdded).toBe(true)
  })

  it('应该识别删除的字符', () => {
    const result = computeCharDiffForLine('hello', 'helo')
    const hasRemoved = result.some((r) => r.type === 'removed')
    expect(hasRemoved).toBe(true)
  })

  it('连续相同类型的字符应该合并', () => {
    const result = computeCharDiffForLine('abc', 'xyz')
    result.forEach((segment) => {
      expect(typeof segment.value).toBe('string')
      expect(segment.value.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('空字符串应该返回单个 equal 片段', () => {
    const result = computeCharDiffForLine('', '')
    expect(result.length).toBe(1)
    expect(result[0].type).toBe('equal')
  })

  it('非字符串输入应该安全处理', () => {
    const result = computeCharDiffForLine(null, undefined)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })
})
