import { describe, it, expect } from 'vitest'
import {
  DIFF_TYPE,
  splitLines,
  computeLCSMatrix,
  computeLineDiff,
  mergeModifiedLines,
  computeCharDiff,
  buildSideBySideDiff,
  getDiffStats,
} from '../../git-browser/diffUtils'

describe('DIFF_TYPE', () => {
  it('应包含正确的常量值', () => {
    expect(DIFF_TYPE.EQUAL).toBe('equal')
    expect(DIFF_TYPE.ADDED).toBe('added')
    expect(DIFF_TYPE.REMOVED).toBe('removed')
    expect(DIFF_TYPE.MODIFIED).toBe('modified')
  })
})

describe('splitLines', () => {
  it('应按换行符分割文本', () => {
    expect(splitLines('a\nb\nc')).toEqual(['a', 'b', 'c'])
    expect(splitLines('single')).toEqual(['single'])
  })

  it('空字符串应返回空数组', () => {
    expect(splitLines('')).toEqual([])
  })

  it('非字符串应返回空数组', () => {
    expect(splitLines(null)).toEqual([])
    expect(splitLines(undefined)).toEqual([])
    expect(splitLines(123)).toEqual([])
  })
})

describe('computeLCSMatrix', () => {
  it('应计算正确的 LCS 矩阵', () => {
    const arr1 = ['a', 'b', 'c']
    const arr2 = ['a', 'c', 'd']
    const dp = computeLCSMatrix(arr1, arr2)
    expect(dp.length).toBe(arr1.length + 1)
    expect(dp[0].length).toBe(arr2.length + 1)
    expect(dp[arr1.length][arr2.length]).toBe(2)
  })

  it('空数组应返回全零矩阵', () => {
    const dp = computeLCSMatrix([], [])
    expect(dp.length).toBe(1)
    expect(dp[0].length).toBe(1)
    expect(dp[0][0]).toBe(0)
  })

  it('完全相同的数组 LCS 长度应等于数组长度', () => {
    const arr = ['x', 'y', 'z']
    const dp = computeLCSMatrix(arr, arr)
    expect(dp[arr.length][arr.length]).toBe(arr.length)
  })
})

describe('computeLineDiff', () => {
  it('完全相同的文本应返回全部 EQUAL', () => {
    const diff = computeLineDiff(['a', 'b'], ['a', 'b'])
    expect(diff.every((d) => d.type === DIFF_TYPE.EQUAL)).toBe(true)
    expect(diff.length).toBe(2)
  })

  it('完全不同的文本应返回 ADDED 和 REMOVED', () => {
    const diff = computeLineDiff(['a'], ['b'])
    expect(diff.length).toBe(2)
    expect(diff[0].type).toBe(DIFF_TYPE.REMOVED)
    expect(diff[1].type).toBe(DIFF_TYPE.ADDED)
  })

  it('新增行应标记为 ADDED', () => {
    const diff = computeLineDiff(['a'], ['a', 'b'])
    expect(diff[1].type).toBe(DIFF_TYPE.ADDED)
    expect(diff[1].newLine).toBe('b')
  })

  it('删除行应标记为 REMOVED', () => {
    const diff = computeLineDiff(['a', 'b'], ['a'])
    expect(diff[1].type).toBe(DIFF_TYPE.REMOVED)
    expect(diff[1].oldLine).toBe('b')
  })

  it('支持字符串输入（自动按行分割）', () => {
    const diff = computeLineDiff('a\nb', 'a\nb')
    expect(diff.length).toBe(2)
    expect(diff.every((d) => d.type === DIFF_TYPE.EQUAL)).toBe(true)
  })
})

describe('mergeModifiedLines', () => {
  it('应将连续的 REMOVED+ADDED 合并为 MODIFIED', () => {
    const input = [
      { type: DIFF_TYPE.REMOVED, oldLine: 'old', oldIndex: 0 },
      { type: DIFF_TYPE.ADDED, newLine: 'new', newIndex: 0 },
    ]
    const merged = mergeModifiedLines(input)
    expect(merged.length).toBe(1)
    expect(merged[0].type).toBe(DIFF_TYPE.MODIFIED)
    expect(merged[0].oldLine).toBe('old')
    expect(merged[0].newLine).toBe('new')
  })

  it('非数组输入应返回空数组', () => {
    expect(mergeModifiedLines(null)).toEqual([])
    expect(mergeModifiedLines(undefined)).toEqual([])
  })

  it('不连续的 REMOVED 和 ADDED 不应合并', () => {
    const input = [
      { type: DIFF_TYPE.REMOVED, oldLine: 'a', oldIndex: 0 },
      { type: DIFF_TYPE.EQUAL, oldLine: 'b', newLine: 'b', oldIndex: 1, newIndex: 1 },
      { type: DIFF_TYPE.ADDED, newLine: 'c', newIndex: 2 },
    ]
    const merged = mergeModifiedLines(input)
    expect(merged.length).toBe(3)
    expect(merged[0].type).toBe(DIFF_TYPE.REMOVED)
    expect(merged[2].type).toBe(DIFF_TYPE.ADDED)
  })
})

describe('computeCharDiff', () => {
  it('相同字符串应返回单个 EQUAL 片段', () => {
    const diff = computeCharDiff('hello', 'hello')
    expect(diff.length).toBe(1)
    expect(diff[0].type).toBe(DIFF_TYPE.EQUAL)
    expect(diff[0].value).toBe('hello')
  })

  it('应检测字符级差异', () => {
    const diff = computeCharDiff('abc', 'axc')
    const types = diff.map((d) => d.type)
    expect(types).toContain(DIFF_TYPE.EQUAL)
    expect(types).toContain(DIFF_TYPE.REMOVED)
    expect(types).toContain(DIFF_TYPE.ADDED)
  })

  it('非字符串输入应安全处理', () => {
    const diff = computeCharDiff(null, undefined)
    expect(Array.isArray(diff)).toBe(true)
  })

  it('完全不同的字符串应正确标记', () => {
    const diff = computeCharDiff('abc', 'xyz')
    expect(diff.some((d) => d.type === DIFF_TYPE.REMOVED)).toBe(true)
    expect(diff.some((d) => d.type === DIFF_TYPE.ADDED)).toBe(true)
  })
})

describe('buildSideBySideDiff', () => {
  it('应返回左右分栏和统一视图的行数据', () => {
    const result = buildSideBySideDiff('line1\nline2', 'line1\nline2\nline3')
    expect(result).toHaveProperty('leftRows')
    expect(result).toHaveProperty('rightRows')
    expect(result).toHaveProperty('unifiedRows')
    expect(result).toHaveProperty('lineDiff')
    expect(Array.isArray(result.leftRows)).toBe(true)
    expect(Array.isArray(result.rightRows)).toBe(true)
    expect(Array.isArray(result.unifiedRows)).toBe(true)
  })

  it('新增的行应在右侧出现而左侧为空', () => {
    const result = buildSideBySideDiff('a', 'a\nb')
    const addedRight = result.rightRows.find((r) => r.type === DIFF_TYPE.ADDED)
    expect(addedRight).not.toBeUndefined()
    expect(addedRight.content).toBe('b')
    expect(result.leftRows.some((r) => r.empty)).toBe(true)
  })

  it('删除的行应在左侧出现而右侧为空', () => {
    const result = buildSideBySideDiff('a\nb', 'a')
    const removedLeft = result.leftRows.find((r) => r.type === DIFF_TYPE.REMOVED)
    expect(removedLeft).not.toBeUndefined()
    expect(removedLeft.content).toBe('b')
  })

  it('修改的行应生成字符级 diff', () => {
    const result = buildSideBySideDiff('hello world', 'hello there')
    const modifiedRows = result.leftRows.filter((r) => r.type === DIFF_TYPE.MODIFIED)
    expect(modifiedRows.length).toBeGreaterThan(0)
    expect(modifiedRows[0].charDiff).not.toBeNull()
  })

  it('unifiedRows 中新增行前缀应为 +，删除行为 -', () => {
    const result = buildSideBySideDiff('a\nb', 'a\nc')
    const plusRow = result.unifiedRows.find((r) => r.prefix === '+')
    const minusRow = result.unifiedRows.find((r) => r.prefix === '-')
    expect(plusRow).not.toBeUndefined()
    expect(minusRow).not.toBeUndefined()
  })
})

describe('getDiffStats', () => {
  it('应正确统计各类差异数量', () => {
    const lineDiff = [
      { type: DIFF_TYPE.EQUAL },
      { type: DIFF_TYPE.ADDED },
      { type: DIFF_TYPE.ADDED },
      { type: DIFF_TYPE.REMOVED },
      { type: DIFF_TYPE.MODIFIED },
    ]
    const stats = getDiffStats(lineDiff)
    expect(stats.equal).toBe(1)
    expect(stats.added).toBe(2)
    expect(stats.removed).toBe(1)
    expect(stats.modified).toBe(1)
  })

  it('非数组输入应返回全零', () => {
    expect(getDiffStats(null)).toEqual({ added: 0, removed: 0, modified: 0, equal: 0 })
    expect(getDiffStats(undefined)).toEqual({ added: 0, removed: 0, modified: 0, equal: 0 })
  })

  it('空数组应返回全零', () => {
    expect(getDiffStats([])).toEqual({ added: 0, removed: 0, modified: 0, equal: 0 })
  })
})
