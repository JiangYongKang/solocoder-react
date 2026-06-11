import { describe, it, expect } from 'vitest'
import {
  easeOutCubic,
  resampleData,
  interpolateLayout,
} from '../../currency-converter/chartUtils.js'

function createMockLayout(points, extra = {}) {
  const yTicks = [
    { x: 55, y: 30, value: 6.9, label: '6.9000' },
    { x: 55, y: 97.5, value: 7.0, label: '7.0000' },
    { x: 55, y: 165, value: 7.1, label: '7.1000' },
    { x: 55, y: 232.5, value: 7.2, label: '7.2000' },
    { x: 55, y: 300, value: 7.3, label: '7.3000' },
  ]
  const gridLines = yTicks.map((t) => ({
    x1: 55, y1: t.y, x2: 670, y2: t.y,
  }))
  const hoverAreas = points.map((p) => ({
    x: p.x - 30, y: 30, width: 60, height: 230, point: p,
  }))
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  return {
    width: 700,
    height: 300,
    paddingLeft: 55,
    paddingRight: 30,
    paddingTop: 30,
    paddingBottom: 40,
    chartWidth: 615,
    chartHeight: 230,
    points,
    pathD,
    xTicks: points.filter((_, i) => i % 2 === 0).map((p) => ({
      x: p.x, y: 260, label: p.date.slice(5), date: p.date, index: p.index,
    })),
    yTicks,
    gridLines,
    hoverAreas,
    ...extra,
  }
}

function createPoints(count) {
  const result = []
  const xStep = count > 1 ? 615 / (count - 1) : 0
  const baseY = 7.2
  for (let i = 0; i < count; i++) {
    const value = baseY + (i - count / 2) * 0.005
    result.push({
      x: 55 + i * xStep,
      y: 30 + 230 * (1 - (value - 6.9) / 0.4),
      value,
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      index: i,
    })
  }
  return result
}

describe('easeOutCubic', () => {
  it('t=0 返回 0', () => {
    expect(easeOutCubic(0)).toBeCloseTo(0, 10)
  })

  it('t=1 返回 1', () => {
    expect(easeOutCubic(1)).toBeCloseTo(1, 10)
  })

  it('t=0.5 返回正确的缓动值', () => {
    const expected = 1 - Math.pow(0.5, 3)
    expect(easeOutCubic(0.5)).toBeCloseTo(expected, 10)
  })

  it('输出在 [0, 1] 范围内单调递增', () => {
    let prev = -1
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const v = easeOutCubic(t)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })
})

describe('resampleData', () => {
  it('空数据返回空数组', () => {
    expect(resampleData([], 5)).toEqual([])
  })

  it('目标长度与原长度相同返回相同数据', () => {
    const data = createPoints(5)
    const result = resampleData(data, 5)
    expect(result).toHaveLength(5)
    result.forEach((p, i) => {
      expect(p.x).toBe(data[i].x)
      expect(p.y).toBe(data[i].y)
      expect(p.value).toBe(data[i].value)
    })
  })

  it('单点输入返回单点', () => {
    const data = createPoints(1)
    const result = resampleData(data, 1)
    expect(result).toHaveLength(1)
    expect(result[0].x).toBe(data[0].x)
    expect(result[0].y).toBe(data[0].y)
  })

  it('单点输入上采样返回多个相同值的副本', () => {
    const data = createPoints(1)
    const result = resampleData(data, 3)
    expect(result).toHaveLength(3)
    result.forEach((p) => {
      expect(p.x).toBe(data[0].x)
      expect(p.y).toBe(data[0].y)
      expect(p.value).toBe(data[0].value)
    })
  })

  it('目标长度为1返回中间点', () => {
    const data = createPoints(5)
    const result = resampleData(data, 1)
    expect(result).toHaveLength(1)
    const mid = data[2]
    expect(result[0].x).toBe(mid.x)
    expect(result[0].y).toBe(mid.y)
    expect(result[0].value).toBe(mid.value)
  })

  it('上采样：7个点到30个点，每个点都有有效的 y 和 value', () => {
    const data = createPoints(7)
    const result = resampleData(data, 30)
    expect(result).toHaveLength(30)
    result.forEach((p) => {
      expect(typeof p.x).toBe('number')
      expect(typeof p.y).toBe('number')
      expect(typeof p.value).toBe('number')
      expect(Number.isFinite(p.y)).toBe(true)
      expect(Number.isFinite(p.value)).toBe(true)
      expect(p.date).toBeDefined()
    })
  })

  it('上采样：7个点到90个点，首尾点与原始一致', () => {
    const data = createPoints(7)
    const result = resampleData(data, 90)
    expect(result).toHaveLength(90)
    expect(result[0].x).toBeCloseTo(data[0].x, 8)
    expect(result[0].y).toBeCloseTo(data[0].y, 8)
    expect(result[0].value).toBeCloseTo(data[0].value, 8)
    expect(result[89].x).toBeCloseTo(data[6].x, 8)
    expect(result[89].y).toBeCloseTo(data[6].y, 8)
    expect(result[89].value).toBeCloseTo(data[6].value, 8)
  })

  it('下采样：30个点到7个点，保留 x,y,value 属性', () => {
    const data = createPoints(30)
    const result = resampleData(data, 7)
    expect(result).toHaveLength(7)
    result.forEach((p) => {
      expect(typeof p.x).toBe('number')
      expect(typeof p.y).toBe('number')
      expect(typeof p.value).toBe('number')
      expect(Number.isFinite(p.y)).toBe(true)
    })
  })

  it('不对 index 属性插值（index 保持为原始第一个相邻点的整数）', () => {
    const data = createPoints(3)
    const result = resampleData(data, 5)
    expect(result).toHaveLength(5)
    expect(Number.isInteger(result[0].index)).toBe(true)
    expect(Number.isInteger(result[4].index)).toBe(true)
    for (const p of result) {
      expect(p.index).toBeGreaterThanOrEqual(0)
      expect(p.index).toBeLessThanOrEqual(2)
    }
  })

  it('只对 x, y, value 三个数值属性做插值，其他数值属性不插值', () => {
    const data = [
      { x: 0, y: 0, value: 0, index: 0, customNum: 100 },
      { x: 100, y: 100, value: 1, index: 1, customNum: 200 },
    ]
    const result = resampleData(data, 3)
    expect(result).toHaveLength(3)
    expect(result[1].x).toBeCloseTo(50, 8)
    expect(result[1].y).toBeCloseTo(50, 8)
    expect(result[1].value).toBeCloseTo(0.5, 8)
    expect(result[1].index).toBe(0)
    expect(result[1].customNum).toBe(100)
  })

  it('上采样产生的 y 值在原始 y 范围内', () => {
    const data = createPoints(7)
    const ys = data.map((p) => p.y)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const result = resampleData(data, 30)
    for (const p of result) {
      expect(p.y).toBeGreaterThanOrEqual(minY - 0.001)
      expect(p.y).toBeLessThanOrEqual(maxY + 0.001)
    }
  })
})

describe('interpolateLayout', () => {
  it('fromLayout 为 null 时直接返回 toLayout', () => {
    const to = createMockLayout(createPoints(7))
    const result = interpolateLayout(null, to, 0.5)
    expect(result).toBe(to)
  })

  it('fromLayout.points 为空时直接返回 toLayout', () => {
    const from = createMockLayout([])
    const to = createMockLayout(createPoints(7))
    const result = interpolateLayout(from, to, 0.5)
    expect(result).toBe(to)
  })

  it('progress=1 时直接返回 toLayout', () => {
    const from = createMockLayout(createPoints(7))
    const to = createMockLayout(createPoints(30))
    const result = interpolateLayout(from, to, 1)
    expect(result).toBe(to)
  })

  it('progress=0 时返回接近 fromLayout 的布局（坐标点相等）', () => {
    const fromPoints = createPoints(7)
    const toPoints = createPoints(30)
    const from = createMockLayout(fromPoints)
    const to = createMockLayout(toPoints)
    const result = interpolateLayout(from, to, 0)
    expect(result.points).toHaveLength(30)
    const resampledFrom = resampleData(fromPoints, 30)
    result.points.forEach((p, i) => {
      const fromPt = resampledFrom[i] || toPoints[i]
      const fromY = typeof fromPt.y === 'number' ? fromPt.y : toPoints[i].y
      const fromVal = typeof fromPt.value === 'number' ? fromPt.value : toPoints[i].value
      expect(p.y).toBeCloseTo(fromY, 8)
      expect(p.value).toBeCloseTo(fromVal, 8)
    })
  })

  it('点数相同：progress=0.5 时坐标在两者中间', () => {
    const fromPoints = [
      { x: 55, y: 100, value: 7.0, date: '2025-01-01', index: 0 },
      { x: 670, y: 200, value: 7.2, date: '2025-01-02', index: 1 },
    ]
    const toPoints = [
      { x: 55, y: 200, value: 7.2, date: '2025-01-01', index: 0 },
      { x: 670, y: 100, value: 7.0, date: '2025-01-02', index: 1 },
    ]
    const from = createMockLayout(fromPoints)
    const to = createMockLayout(toPoints)
    const result = interpolateLayout(from, to, 0.5)
    const p = easeOutCubic(0.5)
    expect(result.points[0].y).toBeCloseTo(100 + (200 - 100) * p, 6)
    expect(result.points[0].value).toBeCloseTo(7.0 + (7.2 - 7.0) * p, 6)
    expect(result.points[1].y).toBeCloseTo(200 + (100 - 200) * p, 6)
    expect(result.points[1].value).toBeCloseTo(7.2 + (7.0 - 7.2) * p, 6)
  })

  it('点数不同（7→30）：progress=0.5 时所有 y, value 都是有限数无 NaN', () => {
    const from = createMockLayout(createPoints(7))
    const to = createMockLayout(createPoints(30))
    const result = interpolateLayout(from, to, 0.5)
    expect(result.points).toHaveLength(30)
    result.points.forEach((p) => {
      expect(Number.isFinite(p.y)).toBe(true)
      expect(Number.isFinite(p.value)).toBe(true)
      expect(Number.isNaN(p.y)).toBe(false)
      expect(Number.isNaN(p.value)).toBe(false)
    })
    expect(result.pathD).not.toContain('NaN')
    result.yTicks.forEach((t) => {
      expect(Number.isFinite(t.y)).toBe(true)
      expect(Number.isFinite(t.value)).toBe(true)
    })
    result.gridLines.forEach((g) => {
      expect(Number.isFinite(g.y1)).toBe(true)
      expect(Number.isFinite(g.y2)).toBe(true)
    })
  })

  it('点数不同（90→7）：progress=0.3 时数据正确', () => {
    const from = createMockLayout(createPoints(90))
    const to = createMockLayout(createPoints(7))
    const result = interpolateLayout(from, to, 0.3)
    expect(result.points).toHaveLength(7)
    result.points.forEach((p) => {
      expect(Number.isFinite(p.y)).toBe(true)
      expect(Number.isFinite(p.value)).toBe(true)
    })
    expect(result.pathD).not.toContain('NaN')
  })

  it('pathD 是有效的 SVG path 字符串（M 开头，L 连接，无 NaN）', () => {
    const from = createMockLayout(createPoints(7))
    const to = createMockLayout(createPoints(30))
    for (const progress of [0, 0.25, 0.5, 0.75, 0.99]) {
      const result = interpolateLayout(from, to, progress)
      expect(result.pathD.charAt(0)).toBe('M')
      expect(result.pathD).toContain('L')
      expect(result.pathD).not.toContain('NaN')
      expect(result.pathD).not.toContain('undefined')
    }
  })

  it('yTicks 在动画过程中 value 在 from 和 to 之间', () => {
    const from = createMockLayout(createPoints(7))
    const to = createMockLayout(createPoints(30))
    const result = interpolateLayout(from, to, 0.5)
    result.yTicks.forEach((t, i) => {
      const fromT = from.yTicks[i]
      const toT = to.yTicks[i]
      if (fromT && toT) {
        const minVal = Math.min(fromT.value, toT.value)
        const maxVal = Math.max(fromT.value, toT.value)
        expect(t.value).toBeGreaterThanOrEqual(minVal - 0.001)
        expect(t.value).toBeLessThanOrEqual(maxVal + 0.001)
      }
    })
  })

  it('gridLines 在动画过程中 y1, y2 有限', () => {
    const from = createMockLayout(createPoints(7))
    const to = createMockLayout(createPoints(30))
    const result = interpolateLayout(from, to, 0.5)
    result.gridLines.forEach((g) => {
      expect(Number.isFinite(g.y1)).toBe(true)
      expect(Number.isFinite(g.y2)).toBe(true)
      expect(g.y1).toBeCloseTo(g.y2, 6)
    })
  })

  it('hoverAreas 长度与 target 点数一致，point 引用对应的插值点', () => {
    const from = createMockLayout(createPoints(7))
    const to = createMockLayout(createPoints(30))
    const result = interpolateLayout(from, to, 0.5)
    expect(result.hoverAreas).toHaveLength(30)
    result.hoverAreas.forEach((area, i) => {
      expect(area.point).toBe(result.points[i])
    })
  })

  it('progress 大于 1 时返回 toLayout', () => {
    const from = createMockLayout(createPoints(7))
    const to = createMockLayout(createPoints(30))
    expect(interpolateLayout(from, to, 1.5)).toBe(to)
    expect(interpolateLayout(from, to, 2)).toBe(to)
  })
})
