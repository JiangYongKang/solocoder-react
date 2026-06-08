import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import {
  DIFF_TYPE,
  splitLines,
  computeLCSMatrix,
  computeLineDiff,
  mergeModifiedLines,
  computeCharDiff,
  buildSideBySideDiff,
  extractChangeBlocks,
  getChangeTypeLabel,
  isSupportedFileType,
  readClipboardText,
  readFileAsText,
  getDiffStats,
} from '../../text-diff/diffUtils'

describe('DIFF_TYPE 常量', () => {
  it('应该定义正确的差异类型常量', () => {
    expect(DIFF_TYPE.EQUAL).toBe('equal')
    expect(DIFF_TYPE.ADDED).toBe('added')
    expect(DIFF_TYPE.REMOVED).toBe('removed')
    expect(DIFF_TYPE.MODIFIED).toBe('modified')
  })
})

describe('splitLines', () => {
  it('应该正确按换行符分割文本', () => {
    const result = splitLines('a\nb\nc')
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('空字符串应该返回空数组', () => {
    expect(splitLines('')).toEqual([])
  })

  it('非字符串输入应该返回空数组', () => {
    expect(splitLines(null)).toEqual([])
    expect(splitLines(undefined)).toEqual([])
    expect(splitLines(123)).toEqual([])
    expect(splitLines({})).toEqual([])
  })

  it('单个换行符应该分割为两个空字符串', () => {
    expect(splitLines('\n')).toEqual(['', ''])
  })

  it('应该保留末尾换行后的空行', () => {
    expect(splitLines('a\n')).toEqual(['a', ''])
  })
})

describe('computeLCSMatrix', () => {
  it('应该正确计算两个数组的 LCS 矩阵', () => {
    const arr1 = ['a', 'b', 'c']
    const arr2 = ['a', 'c', 'd']
    const dp = computeLCSMatrix(arr1, arr2)
    expect(dp).toBeInstanceOf(Array)
    expect(dp.length).toBe(4)
    expect(dp[0].length).toBe(4)
    expect(dp[3][3]).toBe(2)
  })

  it('两个空数组应该返回全零矩阵', () => {
    const dp = computeLCSMatrix([], [])
    expect(dp.length).toBe(1)
    expect(dp[0].length).toBe(1)
    expect(dp[0][0]).toBe(0)
  })

  it('完全相同的数组应该返回正确的 LCS 长度', () => {
    const arr = ['x', 'y', 'z']
    const dp = computeLCSMatrix(arr, arr)
    expect(dp[3][3]).toBe(3)
  })

  it('完全不同的数组应该返回 0', () => {
    const dp = computeLCSMatrix(['a', 'b'], ['c', 'd'])
    expect(dp[2][2]).toBe(0)
  })
})

describe('computeLineDiff', () => {
  it('相同内容的文本应该全部返回 EQUAL 类型', () => {
    const diff = computeLineDiff(['a', 'b'], ['a', 'b'])
    expect(diff.length).toBe(2)
    expect(diff[0].type).toBe(DIFF_TYPE.EQUAL)
    expect(diff[1].type).toBe(DIFF_TYPE.EQUAL)
  })

  it('应该正确识别新增的行', () => {
    const diff = computeLineDiff(['a'], ['a', 'b'])
    const types = diff.map((d) => d.type)
    expect(types).toContain(DIFF_TYPE.ADDED)
    expect(diff.find((d) => d.type === DIFF_TYPE.ADDED).newLine).toBe('b')
  })

  it('应该正确识别删除的行', () => {
    const diff = computeLineDiff(['a', 'b'], ['a'])
    const types = diff.map((d) => d.type)
    expect(types).toContain(DIFF_TYPE.REMOVED)
    expect(diff.find((d) => d.type === DIFF_TYPE.REMOVED).oldLine).toBe('b')
  })

  it('空文本应该返回空数组', () => {
    expect(computeLineDiff([], [])).toEqual([])
  })

  it('每行应该包含 oldIndex 和 newIndex', () => {
    const diff = computeLineDiff(['a'], ['b'])
    expect(diff[0]).toHaveProperty('oldIndex')
    expect(diff[0]).toHaveProperty('newIndex')
  })

  it('支持字符串输入（自动按行分割）', () => {
    const diff = computeLineDiff('a\nb', 'a\nc')
    expect(diff.length).toBe(3)
    expect(diff[0].type).toBe(DIFF_TYPE.EQUAL)
    expect(diff[0].oldLine).toBe('a')
    expect(diff[1].type).toBe(DIFF_TYPE.REMOVED)
    expect(diff[1].oldLine).toBe('b')
    expect(diff[2].type).toBe(DIFF_TYPE.ADDED)
    expect(diff[2].newLine).toBe('c')
  })

  it('字符串输入时应正确识别新增行', () => {
    const diff = computeLineDiff('hello', 'hello\nworld')
    const types = diff.map((d) => d.type)
    expect(types).toEqual([DIFF_TYPE.EQUAL, DIFF_TYPE.ADDED])
    expect(diff[1].newLine).toBe('world')
  })

  it('字符串输入时应正确识别删除行', () => {
    const diff = computeLineDiff('foo\nbar', 'foo')
    const types = diff.map((d) => d.type)
    expect(types).toEqual([DIFF_TYPE.EQUAL, DIFF_TYPE.REMOVED])
    expect(diff[1].oldLine).toBe('bar')
  })

  it('字符串输入空字符串应返回空数组', () => {
    expect(computeLineDiff('', '')).toEqual([])
  })
})

describe('mergeModifiedLines', () => {
  it('应该将相邻的 REMOVED 和 ADDED 合并为 MODIFIED', () => {
    const input = [
      { type: DIFF_TYPE.REMOVED, oldLine: 'old', oldIndex: 0, newIndex: null },
      { type: DIFF_TYPE.ADDED, newLine: 'new', oldIndex: null, newIndex: 0 },
    ]
    const result = mergeModifiedLines(input)
    expect(result.length).toBe(1)
    expect(result[0].type).toBe(DIFF_TYPE.MODIFIED)
    expect(result[0].oldLine).toBe('old')
    expect(result[0].newLine).toBe('new')
  })

  it('非数组输入应该返回空数组', () => {
    expect(mergeModifiedLines(null)).toEqual([])
    expect(mergeModifiedLines(undefined)).toEqual([])
  })

  it('不相邻的 REMOVED 和 ADDED 不应该合并', () => {
    const input = [
      { type: DIFF_TYPE.REMOVED, oldLine: 'a', oldIndex: 0, newIndex: null },
      { type: DIFF_TYPE.EQUAL, oldLine: 'b', newLine: 'b', oldIndex: 1, newIndex: 0 },
      { type: DIFF_TYPE.ADDED, newLine: 'c', oldIndex: null, newIndex: 1 },
    ]
    const result = mergeModifiedLines(input)
    expect(result.length).toBe(3)
    expect(result[0].type).toBe(DIFF_TYPE.REMOVED)
    expect(result[2].type).toBe(DIFF_TYPE.ADDED)
  })

  it('应该保持其他类型不变', () => {
    const input = [{ type: DIFF_TYPE.EQUAL, oldLine: 'a', newLine: 'a', oldIndex: 0, newIndex: 0 }]
    const result = mergeModifiedLines(input)
    expect(result.length).toBe(1)
    expect(result[0].type).toBe(DIFF_TYPE.EQUAL)
  })
})

describe('computeCharDiff', () => {
  it('相同字符串应该返回单个 EQUAL 片段', () => {
    const result = computeCharDiff('hello', 'hello')
    expect(result.length).toBe(1)
    expect(result[0].type).toBe(DIFF_TYPE.EQUAL)
    expect(result[0].value).toBe('hello')
  })

  it('应该正确识别新增字符', () => {
    const result = computeCharDiff('helo', 'hello')
    const types = result.map((r) => r.type)
    expect(types).toContain(DIFF_TYPE.ADDED)
  })

  it('应该正确识别删除字符', () => {
    const result = computeCharDiff('hello', 'helo')
    const types = result.map((r) => r.type)
    expect(types).toContain(DIFF_TYPE.REMOVED)
  })

  it('非字符串输入应该安全处理', () => {
    const result = computeCharDiff(null, undefined)
    expect(Array.isArray(result)).toBe(true)
  })

  it('连续相同类型的字符应该合并', () => {
    const result = computeCharDiff('abc', 'xyz')
    result.forEach((segment) => {
      expect(typeof segment.value).toBe('string')
      expect(segment.value.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('空字符串应该返回空的 EQUAL 片段', () => {
    const result = computeCharDiff('', '')
    expect(result.length).toBe(1)
    expect(result[0].type).toBe(DIFF_TYPE.EQUAL)
    expect(result[0].value).toBe('')
  })
})

describe('buildSideBySideDiff', () => {
  it('应该返回 leftRows、rightRows、unifiedRows 和 lineDiff', () => {
    const result = buildSideBySideDiff('a\nb', 'a\nc')
    expect(result).toHaveProperty('leftRows')
    expect(result).toHaveProperty('rightRows')
    expect(result).toHaveProperty('unifiedRows')
    expect(result).toHaveProperty('lineDiff')
  })

  it('leftRows 和 rightRows 应该长度相同', () => {
    const result = buildSideBySideDiff('a\nb', 'a\nc\nd')
    expect(result.leftRows.length).toBe(result.rightRows.length)
  })

  it('每一行应该包含行号和内容', () => {
    const result = buildSideBySideDiff('hello', 'world')
    expect(result.leftRows[0]).toHaveProperty('lineNum')
    expect(result.leftRows[0]).toHaveProperty('content')
    expect(result.rightRows[0]).toHaveProperty('lineNum')
    expect(result.rightRows[0]).toHaveProperty('content')
  })

  it('MODIFIED 类型的行应该包含 charDiff', () => {
    const result = buildSideBySideDiff('hello', 'hallo')
    const modifiedRow = result.leftRows.find((r) => r.type === DIFF_TYPE.MODIFIED)
    expect(modifiedRow).toBeDefined()
    expect(modifiedRow.charDiff).toBeDefined()
    expect(Array.isArray(modifiedRow.charDiff)).toBe(true)
  })

  it('unifiedRows 应该包含 prefix 字段', () => {
    const result = buildSideBySideDiff('a', 'b')
    result.unifiedRows.forEach((row) => {
      expect(row).toHaveProperty('prefix')
      expect([' ', '+', '-']).toContain(row.prefix)
    })
  })

  it('空文本应该返回空的行', () => {
    const result = buildSideBySideDiff('', '')
    expect(result.leftRows.length).toBe(0)
    expect(result.rightRows.length).toBe(0)
    expect(result.unifiedRows.length).toBe(0)
  })

  it('新增行在左侧应该显示空行号', () => {
    const result = buildSideBySideDiff('', 'new')
    expect(result.leftRows[0].lineNum).toBeNull()
    expect(result.rightRows[0].lineNum).toBe(1)
  })

  it('删除行在右侧应该显示空行号', () => {
    const result = buildSideBySideDiff('old', '')
    expect(result.leftRows[0].lineNum).toBe(1)
    expect(result.rightRows[0].lineNum).toBeNull()
  })
})

describe('extractChangeBlocks', () => {
  it('应该将连续的变更聚合成块', () => {
    const lineDiff = [
      { type: DIFF_TYPE.EQUAL, oldIndex: 0, newIndex: 0 },
      { type: DIFF_TYPE.REMOVED, oldIndex: 1, newIndex: null },
      { type: DIFF_TYPE.ADDED, oldIndex: null, newIndex: 1 },
      { type: DIFF_TYPE.EQUAL, oldIndex: 2, newIndex: 2 },
    ]
    const blocks = extractChangeBlocks(lineDiff)
    expect(blocks.length).toBe(1)
    expect(blocks[0].startIndex).toBe(1)
    expect(blocks[0].endIndex).toBe(2)
  })

  it('非数组输入应该返回空数组', () => {
    expect(extractChangeBlocks(null)).toEqual([])
    expect(extractChangeBlocks(undefined)).toEqual([])
  })

  it('没有变更时应该返回空数组', () => {
    const lineDiff = [
      { type: DIFF_TYPE.EQUAL, oldIndex: 0, newIndex: 0 },
      { type: DIFF_TYPE.EQUAL, oldIndex: 1, newIndex: 1 },
    ]
    expect(extractChangeBlocks(lineDiff)).toEqual([])
  })

  it('每个块应该包含 startIndex、endIndex、type 和 rows', () => {
    const lineDiff = [
      { type: DIFF_TYPE.ADDED, oldIndex: null, newIndex: 0 },
    ]
    const blocks = extractChangeBlocks(lineDiff)
    expect(blocks.length).toBe(1)
    expect(blocks[0]).toHaveProperty('startIndex')
    expect(blocks[0]).toHaveProperty('endIndex')
    expect(blocks[0]).toHaveProperty('type')
    expect(blocks[0]).toHaveProperty('rows')
    expect(Array.isArray(blocks[0].rows)).toBe(true)
  })

  it('连续的增删操作应该标记为 MODIFIED 类型', () => {
    const lineDiff = [
      { type: DIFF_TYPE.REMOVED, oldIndex: 0, newIndex: null },
      { type: DIFF_TYPE.ADDED, oldIndex: null, newIndex: 0 },
    ]
    const blocks = extractChangeBlocks(lineDiff)
    expect(blocks[0].type).toBe(DIFF_TYPE.MODIFIED)
  })
})

describe('getChangeTypeLabel', () => {
  it('应该返回正确的中文标签', () => {
    expect(getChangeTypeLabel(DIFF_TYPE.ADDED)).toBe('新增')
    expect(getChangeTypeLabel(DIFF_TYPE.REMOVED)).toBe('删除')
    expect(getChangeTypeLabel(DIFF_TYPE.MODIFIED)).toBe('修改')
    expect(getChangeTypeLabel(DIFF_TYPE.EQUAL)).toBe('相同')
  })

  it('未知类型应该返回默认值', () => {
    expect(getChangeTypeLabel('unknown')).toBe('相同')
    expect(getChangeTypeLabel(null)).toBe('相同')
    expect(getChangeTypeLabel(undefined)).toBe('相同')
  })
})

describe('isSupportedFileType', () => {
  it('应该接受 .txt 文件', () => {
    expect(isSupportedFileType({ name: 'test.txt' })).toBe(true)
    expect(isSupportedFileType({ name: 'TEST.TXT' })).toBe(true)
  })

  it('应该接受 .md 和 .markdown 文件', () => {
    expect(isSupportedFileType({ name: 'readme.md' })).toBe(true)
    expect(isSupportedFileType({ name: 'README.MD' })).toBe(true)
    expect(isSupportedFileType({ name: 'doc.markdown' })).toBe(true)
  })

  it('应该接受正确 MIME 类型的文件', () => {
    expect(isSupportedFileType({ name: 'file', type: 'text/plain' })).toBe(true)
    expect(isSupportedFileType({ name: 'file', type: 'text/markdown' })).toBe(true)
  })

  it('应该拒绝不支持的文件类型', () => {
    expect(isSupportedFileType({ name: 'image.png' })).toBe(false)
    expect(isSupportedFileType({ name: 'script.js' })).toBe(false)
    expect(isSupportedFileType(null)).toBe(false)
    expect(isSupportedFileType(undefined)).toBe(false)
  })
})

describe('readFileAsText', () => {
  let originalFileReader

  beforeEach(() => {
    originalFileReader = globalThis.FileReader
  })

  afterEach(() => {
    if (originalFileReader) {
      globalThis.FileReader = originalFileReader
    } else {
      delete globalThis.FileReader
    }
  })

  it('应该成功读取文件内容', async () => {
    class MockFileReader {
      constructor() {
        this.readyState = 0
        this.result = ''
        this.error = null
        this.onload = null
        this.onerror = null
      }
      readAsText() {
        this.result = 'mock file content'
        if (this.onload) {
          this.onload({ target: this })
        }
      }
    }
    globalThis.FileReader = MockFileReader

    const mockFile = new Blob(['hello world'], { type: 'text/plain' })
    const content = await readFileAsText(mockFile)
    expect(content).toBe('mock file content')
  })

  it('文件读取失败时应该 reject', async () => {
    class MockFileReader {
      constructor() {
        this.readyState = 0
        this.result = ''
        this.error = null
        this.onload = null
        this.onerror = null
      }
      readAsText() {
        this.error = new Error('read error')
        if (this.onerror) {
          this.onerror({ target: this })
        }
      }
    }
    globalThis.FileReader = MockFileReader

    const mockFile = new Blob(['hello'], { type: 'text/plain' })
    await expect(readFileAsText(mockFile)).rejects.toThrow('read error')
  })

  it('传入 null 或 undefined 应该 reject', async () => {
    await expect(readFileAsText(null)).rejects.toThrow('Invalid file')
    await expect(readFileAsText(undefined)).rejects.toThrow('Invalid file')
  })

  it('传入非 Blob 对象应该 reject', async () => {
    await expect(readFileAsText({})).rejects.toThrow('Invalid file')
    await expect(readFileAsText('not a blob')).rejects.toThrow('Invalid file')
  })

  it('文件内容为空字符串时应该正常返回', async () => {
    class MockFileReader {
      constructor() {
        this.readyState = 0
        this.result = ''
        this.error = null
        this.onload = null
        this.onerror = null
      }
      readAsText() {
        this.result = ''
        if (this.onload) {
          this.onload({ target: this })
        }
      }
    }
    globalThis.FileReader = MockFileReader

    const mockFile = new Blob([''], { type: 'text/plain' })
    const content = await readFileAsText(mockFile)
    expect(content).toBe('')
  })
})

describe('readClipboardText', () => {
  const originalClipboard = globalThis.navigator?.clipboard

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(globalThis.navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
      })
    } else {
      delete globalThis.navigator?.clipboard
    }
  })

  it('剪贴板可用时应该成功读取文本', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: {
        readText: vi.fn().mockResolvedValue('clipboard content'),
      },
      configurable: true,
    })
    const result = await readClipboardText()
    expect(result.success).toBe(true)
    expect(result.text).toBe('clipboard content')
  })

  it('剪贴板不可用时应该返回失败', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    })
    const result = await readClipboardText()
    expect(result.success).toBe(false)
  })

  it('剪贴板读取异常时应该返回失败', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: {
        readText: vi.fn().mockRejectedValue(new Error('permission denied')),
      },
      configurable: true,
    })
    const result = await readClipboardText()
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('getDiffStats', () => {
  it('应该正确统计各种类型的行数', () => {
    const lineDiff = [
      { type: DIFF_TYPE.EQUAL },
      { type: DIFF_TYPE.ADDED },
      { type: DIFF_TYPE.ADDED },
      { type: DIFF_TYPE.REMOVED },
      { type: DIFF_TYPE.MODIFIED },
    ]
    const stats = getDiffStats(lineDiff)
    expect(stats.added).toBe(2)
    expect(stats.removed).toBe(1)
    expect(stats.modified).toBe(1)
    expect(stats.equal).toBe(1)
  })

  it('非数组输入应该返回全零统计', () => {
    expect(getDiffStats(null)).toEqual({ added: 0, removed: 0, modified: 0, equal: 0 })
    expect(getDiffStats(undefined)).toEqual({ added: 0, removed: 0, modified: 0, equal: 0 })
  })

  it('空数组应该返回全零统计', () => {
    expect(getDiffStats([])).toEqual({ added: 0, removed: 0, modified: 0, equal: 0 })
  })
})
