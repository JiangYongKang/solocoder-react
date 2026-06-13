import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  niceNumber,
  niceScale,
  linearScale,
  getXTickIndices,
  calculateLineChartLayout,
  findNearestPoint,
  drawLineChart,
  drawTooltip,
} from '../../device-monitor/chartUtils.js'

describe('niceNumber', () => {
  it('当 range <= 0 时返回 1', () => {
    expect(niceNumber(0, true)).toBe(1)
    expect(niceNumber(-5, false)).toBe(1)
  })

  it('round=true 时正确分段处理 fraction', () => {
    expect(niceNumber(1.2, true)).toBe(1)
    expect(niceNumber(20, true)).toBe(20)
    expect(niceNumber(500, true)).toBe(500)
    expect(niceNumber(8000, true)).toBe(10000)
  })

  it('round=false 时正确分段处理 fraction', () => {
    expect(niceNumber(1, false)).toBe(1)
    expect(niceNumber(1.5, false)).toBe(2)
    expect(niceNumber(30, false)).toBe(50)
    expect(niceNumber(700, false)).toBe(1000)
  })

  it('对各种范围生成美观的数字', () => {
    expect(niceNumber(3, true)).toBe(5)
    expect(niceNumber(37, true)).toBe(50)
    expect(niceNumber(0.48, true)).toBe(0.5)
    expect(niceNumber(0.072, true)).toBe(0.1)
  })
})

describe('niceScale', () => {
  it('当 min === max 时返回对称的范围', () => {
    const result = niceScale(10, 10, 5)
    expect(result.min).toBeLessThan(10)
    expect(result.max).toBeGreaterThan(10)
    expect(result.ticks).toHaveLength(3)
    expect(result.ticks[1]).toBe(10)
  })

  it('当 min === max 且值为 0 时返回合理范围', () => {
    const result = niceScale(0, 0, 5)
    expect(result.min).toBe(-1)
    expect(result.max).toBe(1)
    expect(result.step).toBe(1)
  })

  it('正常范围生成美观刻度', () => {
    const result = niceScale(0, 100, 5)
    expect(result.min).toBeLessThanOrEqual(0)
    expect(result.max).toBeGreaterThanOrEqual(100)
    expect(result.ticks.length).toBeGreaterThanOrEqual(5)
    expect(result.step).toBeGreaterThan(0)
    result.ticks.forEach((t, i) => {
      if (i > 0) {
        expect(Math.round((t - result.ticks[i - 1]) * 1e10) / 1e10).toBeCloseTo(result.step)
      }
    })
  })

  it('小范围数值生成正确刻度', () => {
    const result = niceScale(10, 20, 6)
    expect(result.min).toBeLessThanOrEqual(10)
    expect(result.max).toBeGreaterThanOrEqual(20)
    expect(result.ticks.length).toBeGreaterThanOrEqual(2)
  })

  it('负数范围也能处理', () => {
    const result = niceScale(-50, 50, 5)
    expect(result.min).toBeLessThanOrEqual(-50)
    expect(result.max).toBeGreaterThanOrEqual(50)
    expect(result.ticks).toContain(0)
  })

  it('最后一个刻度不超过 niceMax + step*0.5', () => {
    const result = niceScale(3, 97, 5)
    const lastTick = result.ticks[result.ticks.length - 1]
    expect(lastTick).toBeLessThanOrEqual(result.max + result.step * 0.5 + 1e-9)
  })
})

describe('linearScale', () => {
  it('返回线性映射函数', () => {
    const scale = linearScale([0, 10], [0, 100])
    expect(scale(0)).toBe(0)
    expect(scale(5)).toBe(50)
    expect(scale(10)).toBe(100)
  })

  it('支持反向范围映射', () => {
    const scale = linearScale([0, 10], [100, 0])
    expect(scale(0)).toBe(100)
    expect(scale(5)).toBe(50)
    expect(scale(10)).toBe(0)
  })

  it('当 domain 范围为 0 时返回中点值', () => {
    const scale = linearScale([5, 5], [0, 100])
    expect(scale(5)).toBe(50)
    expect(scale(999)).toBe(50)
  })

  it('能正确映射超出 domain 的值（外插）', () => {
    const scale = linearScale([0, 10], [0, 100])
    expect(scale(-5)).toBe(-50)
    expect(scale(15)).toBe(150)
  })
})

describe('getXTickIndices', () => {
  it('dataLength <= 0 返回空数组', () => {
    expect(getXTickIndices(0)).toEqual([])
    expect(getXTickIndices(-5)).toEqual([])
  })

  it('dataLength <= maxTicks 返回全部索引', () => {
    expect(getXTickIndices(5, 8)).toEqual([0, 1, 2, 3, 4])
    expect(getXTickIndices(8, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('dataLength > maxTicks 时均匀采样并包含首尾', () => {
    const result = getXTickIndices(100, 6)
    expect(result[0]).toBe(0)
    expect(result[result.length - 1]).toBe(99)
    expect(result.length).toBeLessThanOrEqual(7)
    result.forEach((idx) => {
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(100)
    })
  })

  it('索引严格递增', () => {
    const result = getXTickIndices(57, 8)
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1])
    }
  })

  it('默认 maxTicks = 8', () => {
    const result = getXTickIndices(20)
    expect(result[0]).toBe(0)
    expect(result[result.length - 1]).toBe(19)
    expect(result.length).toBeLessThanOrEqual(9)
  })
})

function makeSampleData(count, startValue = 20, step = 0.5) {
  return Array.from({ length: count }, (_, i) => ({
    value: startValue + i * step,
    timestamp: Date.now() - (count - 1 - i) * 3000,
  }))
}

describe('calculateLineChartLayout', () => {
  it('空数据返回默认结构和空 points', () => {
    const layout = calculateLineChartLayout([], { width: 800, height: 300 })
    expect(layout.width).toBe(800)
    expect(layout.height).toBe(300)
    expect(layout.points).toEqual([])
    expect(layout.xTicks).toEqual([])
    expect(layout.yTicks).toEqual([])
    expect(layout.gridLines).toEqual([])
    expect(layout.thresholdLine).toBeNull()
    expect(typeof layout.yScale).toBe('function')
    expect(typeof layout.xScale).toBe('function')
  })

  it('非数组数据按空数据处理', () => {
    const layout = calculateLineChartLayout(null)
    expect(layout.points).toEqual([])
  })

  it('正常数据生成正确结构', () => {
    const data = makeSampleData(10)
    const layout = calculateLineChartLayout(data, { width: 600, height: 240 })

    expect(layout.points).toHaveLength(10)
    expect(layout.pathD).toMatch(/^M[\s\S]+L/)
    expect(layout.chartWidth).toBe(600 - 50 - 20)
    expect(layout.chartHeight).toBe(240 - 20 - 40)

    layout.points.forEach((p, i) => {
      expect(p).toHaveProperty('x')
      expect(p).toHaveProperty('y')
      expect(p.value).toBe(data[i].value)
      expect(p.index).toBe(i)
    })

    expect(layout.xTicks.length).toBeGreaterThan(0)
    expect(layout.yTicks.length).toBeGreaterThanOrEqual(2)
    expect(layout.gridLines.length).toBe(layout.yTicks.length)

    expect(layout.scaleMin).toBeLessThanOrEqual(Math.min(...data.map((d) => d.value)))
    expect(layout.scaleMax).toBeGreaterThanOrEqual(Math.max(...data.map((d) => d.value)))
  })

  it('单个数据点能正确处理', () => {
    const data = makeSampleData(1)
    const layout = calculateLineChartLayout(data, { width: 600, height: 240 })
    expect(layout.points).toHaveLength(1)
    expect(layout.pathD).toMatch(/^M/)
  })

  it('阈值在范围内时生成 thresholdLine', () => {
    const data = makeSampleData(20, 10, 0.5)
    const layout = calculateLineChartLayout(data, { width: 600, height: 240, threshold: 15 })
    expect(layout.thresholdLine).not.toBeNull()
    expect(layout.thresholdLine.value).toBe(15)
    expect(layout.thresholdLine.x1).toBe(50)
    expect(layout.thresholdLine.x2).toBe(50 + layout.chartWidth)
  })

  it('阈值超出范围时不生成 thresholdLine', () => {
    const data = makeSampleData(10, 20, 0.5)
    const layout = calculateLineChartLayout(data, { width: 600, height: 240, threshold: 9999 })
    expect(layout.thresholdLine).toBeNull()
  })

  it('无效阈值忽略处理', () => {
    const data = makeSampleData(10)
    const layout = calculateLineChartLayout(data, { threshold: NaN })
    expect(layout.thresholdLine).toBeNull()
  })

  it('阈值包含在 y 轴范围内', () => {
    const data = makeSampleData(10, 20, 0.5)
    const threshold = 50
    const layout = calculateLineChartLayout(data, { threshold })
    expect(layout.scaleMin).toBeLessThanOrEqual(threshold)
    expect(layout.scaleMax).toBeGreaterThanOrEqual(threshold)
  })

  it('自定义 padding 影响图表尺寸', () => {
    const data = makeSampleData(10)
    const opts = {
      width: 800,
      height: 300,
      paddingTop: 30,
      paddingRight: 40,
      paddingBottom: 50,
      paddingLeft: 60,
    }
    const layout = calculateLineChartLayout(data, opts)
    expect(layout.chartWidth).toBe(800 - 60 - 40)
    expect(layout.chartHeight).toBe(300 - 30 - 50)
  })

  it('每个 point 都包含原始数据引用', () => {
    const data = makeSampleData(5)
    const layout = calculateLineChartLayout(data)
    layout.points.forEach((p, i) => {
      expect(p.data).toBe(data[i])
    })
  })
})

describe('findNearestPoint', () => {
  it('空数组返回 null', () => {
    expect(findNearestPoint([], 100, 100)).toBeNull()
    expect(findNearestPoint(null, 100, 100)).toBeNull()
  })

  it('单个点返回该点', () => {
    const points = [{ x: 100, y: 200, value: 42 }]
    const result = findNearestPoint(points, 100, 200)
    expect(result).not.toBeNull()
    expect(result.value).toBe(42)
    expect(result.distance).toBeCloseTo(0)
  })

  it('返回最近的点', () => {
    const points = [
      { x: 100, y: 100, value: 1 },
      { x: 200, y: 200, value: 2 },
      { x: 300, y: 300, value: 3 },
    ]
    const result = findNearestPoint(points, 210, 210)
    expect(result).not.toBeNull()
    expect(result.value).toBe(2)
  })

  it('返回的点带有 distance 属性', () => {
    const points = [{ x: 0, y: 0, value: 1 }]
    const result = findNearestPoint(points, 3, 4)
    expect(result.distance).toBeCloseTo(5)
  })

  it('不修改原始点对象', () => {
    const points = [{ x: 100, y: 200, value: 1 }]
    const originalKeys = Object.keys(points[0])
    findNearestPoint(points, 100, 200)
    expect(Object.keys(points[0])).toEqual(originalKeys)
  })
})

describe('drawLineChart', () => {
  let mockCtx
  let layout

  beforeEach(() => {
    mockCtx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setLineDash: vi.fn(),
      closePath: vi.fn(),
    }
    mockCtx.canvas = { width: 600, height: 240 }
    const data = makeSampleData(10)
    layout = calculateLineChartLayout(data, { width: 600, height: 240 })
  })

  it('调用 clearRect 清除画布', () => {
    drawLineChart(mockCtx, layout)
    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 600, 240)
  })

  it('调用 stroke 绘制网格线和坐标轴', () => {
    drawLineChart(mockCtx, layout)
    expect(mockCtx.stroke).toHaveBeenCalled()
  })

  it('对空 points 不报错', () => {
    const emptyLayout = { ...layout, points: [], gridLines: [], xTicks: [], yTicks: [] }
    expect(() => drawLineChart(mockCtx, emptyLayout)).not.toThrow()
  })

  it('null ctx 不报错', () => {
    expect(() => drawLineChart(null, layout)).not.toThrow()
  })

  it('null layout 不报错', () => {
    expect(() => drawLineChart(mockCtx, null)).not.toThrow()
  })

  it('有 thresholdLine 时调用 save/setLineDash/restore', () => {
    const layoutWithThreshold = {
      ...layout,
      thresholdLine: { x1: 50, y1: 100, x2: 530, y2: 100, value: 30 },
    }
    drawLineChart(mockCtx, layoutWithThreshold)
    expect(mockCtx.save).toHaveBeenCalled()
    expect(mockCtx.setLineDash).toHaveBeenCalledWith([6, 4])
    expect(mockCtx.restore).toHaveBeenCalled()
  })

  it('showArea=true 时填充区域', () => {
    drawLineChart(mockCtx, layout, { showArea: true })
    expect(mockCtx.closePath).toHaveBeenCalled()
  })

  it('showDots=true 时调用 arc 绘制点', () => {
    drawLineChart(mockCtx, layout, { showDots: true })
    expect(mockCtx.arc).toHaveBeenCalled()
  })

  it('绘制 y 轴刻度标签', () => {
    drawLineChart(mockCtx, layout)
    expect(mockCtx.fillText).toHaveBeenCalled()
  })
})

describe('drawTooltip', () => {
  let mockCtx

  beforeEach(() => {
    mockCtx = {
      font: '',
      measureText: vi.fn((text) => ({ width: String(text).length * 8 })),
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
    }
    mockCtx.canvas = { width: 600, height: 300 }
  })

  it('null ctx 不报错', () => {
    expect(() => drawTooltip(null, 100, 100, 'test')).not.toThrow()
  })

  it('绘制单行文本', () => {
    const result = drawTooltip(mockCtx, 100, 100, 'Hello World')
    expect(result).toHaveProperty('x')
    expect(result).toHaveProperty('y')
    expect(result).toHaveProperty('width')
    expect(result).toHaveProperty('height')
    expect(mockCtx.fill).toHaveBeenCalled()
  })

  it('绘制多行文本数组', () => {
    const lines = ['Line 1', 'Line 2', 'Line 3']
    drawTooltip(mockCtx, 100, 100, lines)
    expect(mockCtx.fillText).toHaveBeenCalledTimes(3)
  })

  it('当位置靠近右边界时翻转到左侧', () => {
    const result = drawTooltip(mockCtx, 550, 100, 'A very long tooltip text here')
    expect(result.x + result.width).toBeLessThanOrEqual(550)
  })

  it('当位置靠近顶部时翻转到底部', () => {
    const result = drawTooltip(mockCtx, 100, 10, 'Test')
    expect(result.y).toBeGreaterThanOrEqual(10)
  })

  it('返回正确的 tooltip 位置和尺寸', () => {
    const result = drawTooltip(mockCtx, 100, 150, 'Test')
    expect(typeof result.x).toBe('number')
    expect(typeof result.y).toBe('number')
    expect(result.width).toBeGreaterThan(0)
    expect(result.height).toBeGreaterThan(0)
  })
})
