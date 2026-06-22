import { describe, it, expect } from 'vitest'
import {
  getCoverageLevel,
  formatPercentage,
  calculateAverageCoverage,
  flattenFileTree,
  countFiles,
  countDirectories,
  findFileByPath,
  getUncoveredLines,
  calculateOverallCoverage,
  sortFilesByCoverage,
  filterFilesByLevel,
  getCoverageStats,
  calculateTrendChange,
  getTrendDirection,
} from '../../coverage-dashboard/utils.js'

import { COVERAGE_LEVELS } from '../../coverage-dashboard/constants.js'

describe('coverage-dashboard utils', () => {
  describe('getCoverageLevel', () => {
    it('应该返回 high 当覆盖率 >= 80%', () => {
      expect(getCoverageLevel(95)).toBe(COVERAGE_LEVELS.HIGH)
      expect(getCoverageLevel(80)).toBe(COVERAGE_LEVELS.HIGH)
      expect(getCoverageLevel(100)).toBe(COVERAGE_LEVELS.HIGH)
    })

    it('应该返回 medium 当覆盖率在 50%-80% 之间', () => {
      expect(getCoverageLevel(65)).toBe(COVERAGE_LEVELS.MEDIUM)
      expect(getCoverageLevel(50)).toBe(COVERAGE_LEVELS.MEDIUM)
      expect(getCoverageLevel(79.9)).toBe(COVERAGE_LEVELS.MEDIUM)
    })

    it('应该返回 low 当覆盖率在 0%-50% 之间', () => {
      expect(getCoverageLevel(30)).toBe(COVERAGE_LEVELS.LOW)
      expect(getCoverageLevel(49.9)).toBe(COVERAGE_LEVELS.LOW)
      expect(getCoverageLevel(0.1)).toBe(COVERAGE_LEVELS.LOW)
    })

    it('应该返回 none 当覆盖率为 0%', () => {
      expect(getCoverageLevel(0)).toBe(COVERAGE_LEVELS.NONE)
    })

    it('应该返回 none 当输入不是有效数字', () => {
      expect(getCoverageLevel(null)).toBe(COVERAGE_LEVELS.NONE)
      expect(getCoverageLevel(undefined)).toBe(COVERAGE_LEVELS.NONE)
      expect(getCoverageLevel('abc')).toBe(COVERAGE_LEVELS.NONE)
      expect(getCoverageLevel(NaN)).toBe(COVERAGE_LEVELS.NONE)
    })

    it('应该返回 none 当输入为负数', () => {
      expect(getCoverageLevel(-10)).toBe(COVERAGE_LEVELS.NONE)
    })
  })

  describe('formatPercentage', () => {
    it('应该正确格式化百分比', () => {
      expect(formatPercentage(75.5)).toBe('75.5%')
      expect(formatPercentage(100)).toBe('100.0%')
      expect(formatPercentage(0)).toBe('0.0%')
    })

    it('应该支持自定义小数位数', () => {
      expect(formatPercentage(75.567, 2)).toBe('75.57%')
      expect(formatPercentage(75.567, 0)).toBe('76%')
    })

    it('应该将值限制在 0-100 范围内', () => {
      expect(formatPercentage(150)).toBe('100.0%')
      expect(formatPercentage(-10)).toBe('0.0%')
    })

    it('当输入无效时返回 0.0%', () => {
      expect(formatPercentage(null)).toBe('0.0%')
      expect(formatPercentage(undefined)).toBe('0.0%')
      expect(formatPercentage('abc')).toBe('0.0%')
      expect(formatPercentage(NaN)).toBe('0.0%')
    })
  })

  describe('calculateAverageCoverage', () => {
    it('应该计算多个覆盖率对象的平均值', () => {
      const coverages = [
        { statements: 80, branches: 70, functions: 90, lines: 85 },
        { statements: 60, branches: 50, functions: 70, lines: 65 },
      ]
      const result = calculateAverageCoverage(coverages)
      expect(result.statements).toBe(70)
      expect(result.branches).toBe(60)
      expect(result.functions).toBe(80)
      expect(result.lines).toBe(75)
    })

    it('空数组应返回全零', () => {
      const result = calculateAverageCoverage([])
      expect(result.statements).toBe(0)
      expect(result.branches).toBe(0)
      expect(result.functions).toBe(0)
      expect(result.lines).toBe(0)
    })

    it('非数组输入应返回全零', () => {
      const result = calculateAverageCoverage(null)
      expect(result.statements).toBe(0)
      expect(result.branches).toBe(0)
      expect(result.functions).toBe(0)
      expect(result.lines).toBe(0)
    })

    it('应该跳过无效的覆盖率对象', () => {
      const coverages = [
        { statements: 80, branches: 70, functions: 90, lines: 85 },
        null,
        undefined,
        {},
      ]
      const result = calculateAverageCoverage(coverages)
      expect(result.statements).toBe(80)
      expect(result.lines).toBe(85)
    })

    it('应该保留一位小数', () => {
      const coverages = [
        { statements: 80.5, branches: 70.5, functions: 90.5, lines: 85.5 },
        { statements: 60.5, branches: 50.5, functions: 70.5, lines: 65.5 },
      ]
      const result = calculateAverageCoverage(coverages)
      expect(result.statements).toBe(70.5)
    })
  })

  describe('flattenFileTree', () => {
    const mockTree = {
      name: 'src',
      type: 'directory',
      path: 'src',
      children: [
        {
          name: 'components',
          type: 'directory',
          path: 'src/components',
          children: [
            { name: 'Button.jsx', type: 'file', path: 'src/components/Button.jsx' },
            { name: 'Input.jsx', type: 'file', path: 'src/components/Input.jsx' },
          ],
        },
        { name: 'App.jsx', type: 'file', path: 'src/App.jsx' },
      ],
    }

    it('应该将文件树扁平化为文件数组', () => {
      const files = flattenFileTree(mockTree)
      expect(files).toHaveLength(3)
      expect(files.map((f) => f.path)).toEqual([
        'src/components/Button.jsx',
        'src/components/Input.jsx',
        'src/App.jsx',
      ])
    })

    it('单个文件节点应返回包含该文件的数组', () => {
      const file = { name: 'test.js', type: 'file', path: 'test.js' }
      const result = flattenFileTree(file)
      expect(result).toHaveLength(1)
      expect(result[0].path).toBe('test.js')
    })

    it('空节点应返回空数组', () => {
      expect(flattenFileTree(null)).toEqual([])
      expect(flattenFileTree(undefined)).toEqual([])
    })

    it('空目录应返回空数组', () => {
      const emptyDir = {
        name: 'empty',
        type: 'directory',
        path: 'empty',
        children: [],
      }
      expect(flattenFileTree(emptyDir)).toEqual([])
    })
  })

  describe('countFiles', () => {
    const mockTree = {
      name: 'src',
      type: 'directory',
      path: 'src',
      children: [
        {
          name: 'components',
          type: 'directory',
          path: 'src/components',
          children: [
            { name: 'Button.jsx', type: 'file', path: 'src/components/Button.jsx' },
            { name: 'Input.jsx', type: 'file', path: 'src/components/Input.jsx' },
          ],
        },
        { name: 'App.jsx', type: 'file', path: 'src/App.jsx' },
      ],
    }

    it('应该正确计算文件数量', () => {
      expect(countFiles(mockTree)).toBe(3)
    })

    it('单个文件应返回 1', () => {
      const file = { name: 'test.js', type: 'file', path: 'test.js' }
      expect(countFiles(file)).toBe(1)
    })

    it('空节点应返回 0', () => {
      expect(countFiles(null)).toBe(0)
      expect(countFiles(undefined)).toBe(0)
    })
  })

  describe('countDirectories', () => {
    const mockTree = {
      name: 'src',
      type: 'directory',
      path: 'src',
      children: [
        {
          name: 'components',
          type: 'directory',
          path: 'src/components',
          children: [
            { name: 'Button.jsx', type: 'file', path: 'src/components/Button.jsx' },
          ],
        },
        {
          name: 'utils',
          type: 'directory',
          path: 'src/utils',
          children: [],
        },
        { name: 'App.jsx', type: 'file', path: 'src/App.jsx' },
      ],
    }

    it('应该正确计算目录数量（包含根目录）', () => {
      expect(countDirectories(mockTree)).toBe(3)
    })

    it('文件节点应返回 0', () => {
      const file = { name: 'test.js', type: 'file', path: 'test.js' }
      expect(countDirectories(file)).toBe(0)
    })

    it('空节点应返回 0', () => {
      expect(countDirectories(null)).toBe(0)
      expect(countDirectories(undefined)).toBe(0)
    })
  })

  describe('findFileByPath', () => {
    const mockTree = {
      name: 'src',
      type: 'directory',
      path: 'src',
      children: [
        {
          name: 'components',
          type: 'directory',
          path: 'src/components',
          children: [
            { name: 'Button.jsx', type: 'file', path: 'src/components/Button.jsx' },
            { name: 'Input.jsx', type: 'file', path: 'src/components/Input.jsx' },
          ],
        },
        { name: 'App.jsx', type: 'file', path: 'src/App.jsx' },
      ],
    }

    it('应该根据路径找到文件', () => {
      const file = findFileByPath(mockTree, 'src/components/Button.jsx')
      expect(file).not.toBeNull()
      expect(file.name).toBe('Button.jsx')
    })

    it('找不到文件时返回 null', () => {
      const file = findFileByPath(mockTree, 'src/nonexistent.js')
      expect(file).toBeNull()
    })

    it('空输入返回 null', () => {
      expect(findFileByPath(null, 'test')).toBeNull()
      expect(findFileByPath(mockTree, '')).toBeNull()
      expect(findFileByPath(mockTree, null)).toBeNull()
    })
  })

  describe('getUncoveredLines', () => {
    const mockFile = {
      lines: [
        { line: 1, code: 'import React from "react"' },
        { line: 2, code: '' },
        { line: 3, code: 'function App() {' },
        { line: 4, code: '  return <div />' },
        { line: 5, code: '}' },
      ],
      uncoveredLines: [2, 4],
    }

    it('应该返回未覆盖的代码行', () => {
      const uncovered = getUncoveredLines(mockFile)
      expect(uncovered).toHaveLength(2)
      expect(uncovered.map((l) => l.line)).toEqual([2, 4])
    })

    it('没有未覆盖行时返回空数组', () => {
      const file = { ...mockFile, uncoveredLines: [] }
      expect(getUncoveredLines(file)).toEqual([])
    })

    it('无效输入返回空数组', () => {
      expect(getUncoveredLines(null)).toEqual([])
      expect(getUncoveredLines(undefined)).toEqual([])
      expect(getUncoveredLines({})).toEqual([])
    })
  })

  describe('calculateOverallCoverage', () => {
    const mockFiles = [
      { coverage: { statements: 80, branches: 70, functions: 90, lines: 85 } },
      { coverage: { statements: 60, branches: 50, functions: 70, lines: 65 } },
      { coverage: { statements: 100, branches: 100, functions: 100, lines: 100 } },
    ]

    it('应该计算所有文件的平均覆盖率', () => {
      const result = calculateOverallCoverage(mockFiles)
      expect(result.statements).toBe(80)
      expect(result.lines).toBeCloseTo(83.3, 0)
    })

    it('空数组返回全零', () => {
      const result = calculateOverallCoverage([])
      expect(result.statements).toBe(0)
      expect(result.lines).toBe(0)
    })

    it('非数组返回全零', () => {
      const result = calculateOverallCoverage(null)
      expect(result.statements).toBe(0)
    })
  })

  describe('sortFilesByCoverage', () => {
    const mockFiles = [
      { name: 'a.js', coverage: { lines: 80, statements: 75 } },
      { name: 'b.js', coverage: { lines: 50, statements: 45 } },
      { name: 'c.js', coverage: { lines: 95, statements: 90 } },
    ]

    it('应该按行覆盖率升序排序', () => {
      const sorted = sortFilesByCoverage(mockFiles, 'lines', true)
      expect(sorted.map((f) => f.name)).toEqual(['b.js', 'a.js', 'c.js'])
    })

    it('应该按行覆盖率降序排序', () => {
      const sorted = sortFilesByCoverage(mockFiles, 'lines', false)
      expect(sorted.map((f) => f.name)).toEqual(['c.js', 'a.js', 'b.js'])
    })

    it('应该支持按其他指标排序', () => {
      const sorted = sortFilesByCoverage(mockFiles, 'statements', true)
      expect(sorted.map((f) => f.name)).toEqual(['b.js', 'a.js', 'c.js'])
    })

    it('空数组返回空数组', () => {
      expect(sortFilesByCoverage([])).toEqual([])
    })

    it('非数组返回空数组', () => {
      expect(sortFilesByCoverage(null)).toEqual([])
    })

    it('不应该修改原数组', () => {
      const original = [...mockFiles]
      sortFilesByCoverage(mockFiles, 'lines', true)
      expect(mockFiles).toEqual(original)
    })
  })

  describe('filterFilesByLevel', () => {
    const mockFiles = [
      { name: 'high.js', coverage: { lines: 90 } },
      { name: 'medium.js', coverage: { lines: 65 } },
      { name: 'low.js', coverage: { lines: 30 } },
      { name: 'none.js', coverage: { lines: 0 } },
    ]

    it('应该按高覆盖率过滤', () => {
      const filtered = filterFilesByLevel(mockFiles, COVERAGE_LEVELS.HIGH)
      expect(filtered.map((f) => f.name)).toEqual(['high.js'])
    })

    it('应该按中覆盖率过滤', () => {
      const filtered = filterFilesByLevel(mockFiles, COVERAGE_LEVELS.MEDIUM)
      expect(filtered.map((f) => f.name)).toEqual(['medium.js'])
    })

    it('应该按低覆盖率过滤', () => {
      const filtered = filterFilesByLevel(mockFiles, COVERAGE_LEVELS.LOW)
      expect(filtered.map((f) => f.name)).toEqual(['low.js'])
    })

    it('应该按无覆盖率过滤', () => {
      const filtered = filterFilesByLevel(mockFiles, COVERAGE_LEVELS.NONE)
      expect(filtered.map((f) => f.name)).toEqual(['none.js'])
    })

    it('level 为空时返回全部文件', () => {
      const filtered = filterFilesByLevel(mockFiles, null)
      expect(filtered).toHaveLength(4)
    })

    it('空数组返回空数组', () => {
      expect(filterFilesByLevel([], COVERAGE_LEVELS.HIGH)).toEqual([])
    })

    it('非数组返回空数组', () => {
      expect(filterFilesByLevel(null, COVERAGE_LEVELS.HIGH)).toEqual([])
    })
  })

  describe('getCoverageStats', () => {
    const mockFiles = [
      { name: 'a.js', coverage: { lines: 90 } },
      { name: 'b.js', coverage: { lines: 65 } },
      { name: 'c.js', coverage: { lines: 30 } },
      { name: 'd.js', coverage: { lines: 0 } },
      { name: 'e.js', coverage: { lines: 85 } },
    ]

    it('应该返回正确的统计数据', () => {
      const stats = getCoverageStats(mockFiles)
      expect(stats.total).toBe(5)
      expect(stats.high).toBe(2)
      expect(stats.medium).toBe(1)
      expect(stats.low).toBe(1)
      expect(stats.none).toBe(1)
    })

    it('空数组返回全零统计', () => {
      const stats = getCoverageStats([])
      expect(stats.total).toBe(0)
      expect(stats.high).toBe(0)
      expect(stats.medium).toBe(0)
      expect(stats.low).toBe(0)
      expect(stats.none).toBe(0)
    })

    it('非数组返回全零统计', () => {
      const stats = getCoverageStats(null)
      expect(stats.total).toBe(0)
    })
  })

  describe('calculateTrendChange', () => {
    const mockTrendData = [
      { date: '1/1', statements: 60, lines: 55 },
      { date: '1/2', statements: 62, lines: 57 },
      { date: '1/3', statements: 65, lines: 60 },
      { date: '1/4', statements: 68, lines: 63 },
      { date: '1/5', statements: 70, lines: 65 },
    ]

    it('应该计算语句覆盖率的变化', () => {
      const result = calculateTrendChange(mockTrendData, 'statements')
      expect(result.change).toBe(10)
      expect(result.percentage).toBeCloseTo(16.7, 0)
    })

    it('应该计算行覆盖率的变化', () => {
      const result = calculateTrendChange(mockTrendData, 'lines')
      expect(result.change).toBe(10)
    })

    it('数据不足时返回零变化', () => {
      const result = calculateTrendChange([{ statements: 60 }], 'statements')
      expect(result.change).toBe(0)
      expect(result.percentage).toBe(0)
    })

    it('空数据返回零变化', () => {
      const result = calculateTrendChange([], 'statements')
      expect(result.change).toBe(0)
    })

    it('应该支持负变化', () => {
      const data = [
        { statements: 70 },
        { statements: 65 },
        { statements: 60 },
      ]
      const result = calculateTrendChange(data, 'statements')
      expect(result.change).toBe(-10)
    })
  })

  describe('getTrendDirection', () => {
    it('上升趋势返回 up', () => {
      const data = [
        { statements: 60 },
        { statements: 65 },
        { statements: 70 },
      ]
      expect(getTrendDirection(data, 'statements')).toBe('up')
    })

    it('下降趋势返回 down', () => {
      const data = [
        { statements: 70 },
        { statements: 65 },
        { statements: 60 },
      ]
      expect(getTrendDirection(data, 'statements')).toBe('down')
    })

    it('平稳趋势返回 stable', () => {
      const data = [
        { statements: 70 },
        { statements: 70.2 },
        { statements: 70.3 },
      ]
      expect(getTrendDirection(data, 'statements')).toBe('stable')
    })

    it('数据不足返回 stable', () => {
      expect(getTrendDirection([], 'statements')).toBe('stable')
      expect(getTrendDirection([{ statements: 70 }], 'statements')).toBe('stable')
    })
  })
})
