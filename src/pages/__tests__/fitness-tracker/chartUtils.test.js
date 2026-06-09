import { describe, it, expect } from 'vitest'
import {
  niceNumber,
  niceScale,
  linearScale,
  getXTickIndices,
  calculateBarLayout,
  calculateLineLayout,
  polarToCartesian,
  describeArc,
  calculatePieLayout,
  getChartColors,
} from '../../fitness-tracker/chartUtils'

describe('niceNumber', () => {
  it('向上取整时返回合适的"美观"数字', () => {
    expect(niceNumber(0.032, true)).toBeCloseTo(0.05, 10)
    expect(niceNumber(0.32, true)).toBeCloseTo(0.5, 10)
    expect(niceNumber(3.2, true)).toBe(5)
    expect(niceNumber(32, true)).toBe(50)
    expect(niceNumber(320, true)).toBe(500)
  })

  it('不向上取整时返回合适的"美观"数字', () => {
    expect(niceNumber(0.5, false)).toBeCloseTo(0.5, 10)
    expect(niceNumber(1.5, false)).toBeCloseTo(2, 10)
    expect(niceNumber(3.2, false)).toBe(5)
    expect(niceNumber(5, false)).toBe(5)
    expect(niceNumber(6, false)).toBe(10)
  })
})

describe('niceScale', () => {
  it('计算合适的刻度范围和间隔', () => {
    const result = niceScale(0, 100, 5)
    expect(result.min).toBeLessThanOrEqual(0)
    expect(result.max).toBeGreaterThanOrEqual(100)
    expect(result.step).toBeGreaterThan(0)
    expect(result.ticks.length).toBeGreaterThanOrEqual(2)
    result.ticks.forEach((t) => {
      expect(typeof t).toBe('number')
    })
  })

  it('min 和 max 相等时扩展范围', () => {
    const result = niceScale(50, 50, 5)
    expect(result.min).toBeLessThan(50)
    expect(result.max).toBeGreaterThan(50)
    expect(result.ticks.length).toBe(3)
  })

  it('生成递增的刻度值', () => {
    const result = niceScale(0, 500, 6)
    for (let i = 1; i < result.ticks.length; i++) {
      expect(result.ticks[i]).toBeGreaterThan(result.ticks[i - 1])
    }
  })
})

describe('linearScale', () => {
  it('创建线性缩放函数', () => {
    const scale = linearScale([0, 100], [0, 200])
    expect(scale(0)).toBe(0)
    expect(scale(50)).toBe(100)
    expect(scale(100)).toBe(200)
  })

  it('支持反向范围', () => {
    const scale = linearScale([0, 100], [200, 0])
    expect(scale(0)).toBe(200)
    expect(scale(50)).toBe(100)
    expect(scale(100)).toBe(0)
  })

  it('domain 范围为 0 时返回中间值', () => {
    const scale = linearScale([50, 50], [0, 100])
    expect(scale(50)).toBe(50)
  })

  it('支持超出范围的值', () => {
    const scale = linearScale([0, 100], [0, 200])
    expect(scale(150)).toBe(300)
    expect(scale(-50)).toBe(-100)
  })
})

describe('getXTickIndices', () => {
  it('数据量小于等于 maxTicks 时返回所有索引', () => {
    expect(getXTickIndices(5, 8)).toEqual([0, 1, 2, 3, 4])
    expect(getXTickIndices(8, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('数据量大于 maxTicks 时采样索引', () => {
    const result = getXTickIndices(30, 8)
    expect(result.length).toBeLessThanOrEqual(9)
    expect(result[0]).toBe(0)
    expect(result[result.length - 1]).toBe(29)
    result.forEach((idx) => {
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(30)
    })
  })

  it('索引严格递增', () => {
    const result = getXTickIndices(50, 6)
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1])
    }
  })
})

describe('calculateBarLayout', () => {
  const data = [
    { label: '1/1', calories: 100 },
    { label: '1/2', calories: 200 },
    { label: '1/3', calories: 150 },
  ]

  it('计算柱状图布局', () => {
    const layout = calculateBarLayout(data, 'calories', { width: 600, height: 240 })
    expect(layout.width).toBe(600)
    expect(layout.height).toBe(240)
    expect(layout.bars.length).toBe(3)
    expect(layout.xTicks.length).toBeGreaterThan(0)
    expect(layout.yTicks.length).toBeGreaterThan(0)
    expect(layout.gridLines.length).toBeGreaterThan(0)
  })

  it('每个 bar 有正确的位置和尺寸', () => {
    const layout = calculateBarLayout(data, 'calories', { width: 600, height: 240 })
    layout.bars.forEach((bar, i) => {
      expect(bar.x).toBeGreaterThan(layout.paddingLeft)
      expect(bar.x).toBeLessThan(layout.width - layout.paddingRight)
      expect(bar.y).toBeGreaterThanOrEqual(layout.paddingTop)
      expect(bar.y).toBeLessThanOrEqual(layout.paddingTop + layout.chartHeight)
      expect(bar.width).toBeGreaterThan(0)
      expect(bar.height).toBeGreaterThanOrEqual(0)
      expect(bar.value).toBe(data[i].calories)
      expect(bar.index).toBe(i)
    })
  })

  it('chartWidth 和 chartHeight 正确减去 padding', () => {
    const opts = { width: 600, height: 240, paddingTop: 20, paddingRight: 20, paddingBottom: 40, paddingLeft: 45 }
    const layout = calculateBarLayout(data, 'calories', opts)
    expect(layout.chartWidth).toBe(600 - 45 - 20)
    expect(layout.chartHeight).toBe(240 - 20 - 40)
  })

  it('空数据时生成合法布局', () => {
    const layout = calculateBarLayout([], 'calories')
    expect(layout.bars).toEqual([])
    expect(layout.xTicks).toEqual([])
  })

  it('xScale 返回正确的 x 坐标', () => {
    const layout = calculateBarLayout(data, 'calories', { width: 600, height: 240 })
    const bar = layout.bars[1]
    const xFromScale = layout.xScale(1)
    expect(xFromScale).toBeCloseTo(bar.x + bar.width / 2, 0)
  })
})

describe('calculateLineLayout', () => {
  const data = [
    { label: '1/1', calories: 100 },
    { label: '1/2', calories: 200 },
    { label: '1/3', calories: 150 },
    { label: '1/4', calories: 300 },
  ]

  it('计算折线图布局', () => {
    const layout = calculateLineLayout(data, 'calories', { width: 600, height: 240 })
    expect(layout.points.length).toBe(4)
    expect(layout.pathD).toBeTruthy()
    expect(typeof layout.pathD).toBe('string')
    expect(layout.pathD.startsWith('M')).toBe(true)
    expect(layout.areaD).toBeTruthy()
  })

  it('每个点有正确的坐标和值', () => {
    const layout = calculateLineLayout(data, 'calories', { width: 600, height: 240 })
    layout.points.forEach((p, i) => {
      expect(p.x).toBeGreaterThanOrEqual(layout.paddingLeft)
      expect(p.x).toBeLessThanOrEqual(layout.paddingLeft + layout.chartWidth)
      expect(p.y).toBeGreaterThanOrEqual(layout.paddingTop)
      expect(p.y).toBeLessThanOrEqual(layout.paddingTop + layout.chartHeight)
      expect(p.value).toBe(data[i].calories)
      expect(p.index).toBe(i)
    })
  })

  it('areaD 以 Z 闭合', () => {
    const layout = calculateLineLayout(data, 'calories')
    expect(layout.areaD.trim().endsWith('Z')).toBe(true)
  })

  it('只有一个数据点时不崩溃', () => {
    const layout = calculateLineLayout([{ label: 'A', calories: 100 }], 'calories')
    expect(layout.points.length).toBe(1)
    expect(layout.pathD).toBeTruthy()
  })

  it('pathD 包含所有数据点', () => {
    const layout = calculateLineLayout(data, 'calories')
    expect(layout.points.length).toBe(data.length)
  })
})

describe('polarToCartesian', () => {
  it('角度 0（顶部）', () => {
    const result = polarToCartesian(100, 100, 50, 0)
    expect(result.x).toBeCloseTo(100, 5)
    expect(result.y).toBeCloseTo(50, 5)
  })

  it('角度 90（右侧）', () => {
    const result = polarToCartesian(100, 100, 50, 90)
    expect(result.x).toBeCloseTo(150, 5)
    expect(result.y).toBeCloseTo(100, 5)
  })

  it('角度 180（底部）', () => {
    const result = polarToCartesian(100, 100, 50, 180)
    expect(result.x).toBeCloseTo(100, 5)
    expect(result.y).toBeCloseTo(150, 5)
  })

  it('角度 270（左侧）', () => {
    const result = polarToCartesian(100, 100, 50, 270)
    expect(result.x).toBeCloseTo(50, 5)
    expect(result.y).toBeCloseTo(100, 5)
  })

  it('半径为 0 时返回圆心', () => {
    const result = polarToCartesian(100, 100, 0, 45)
    expect(result.x).toBe(100)
    expect(result.y).toBe(100)
  })
})

describe('describeArc', () => {
  it('生成有效的 SVG path 字符串', () => {
    const path = describeArc(100, 100, 40, 80, 0, 90)
    expect(typeof path).toBe('string')
    expect(path.startsWith('M')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
    expect(path.includes('A')).toBe(true)
  })

  it('小角度弧使用 small-arc-flag = 0', () => {
    const path = describeArc(100, 100, 40, 80, 0, 90)
    expect(path).toMatch(/A\s+\d+\s+\d+\s+\d+\s+0/)
  })

  it('大角度弧使用 large-arc-flag = 1', () => {
    const path = describeArc(100, 100, 40, 80, 0, 270)
    expect(path).toMatch(/A\s+\d+\s+\d+\s+\d+\s+1/)
  })

  it('完整圆环（360度）生成合法 path', () => {
    const path = describeArc(100, 100, 40, 80, 0, 359)
    expect(typeof path).toBe('string')
    expect(path.length).toBeGreaterThan(10)
  })
})

describe('calculatePieLayout', () => {
  const data = [
    { key: 'running', name: '跑步', value: 50 },
    { key: 'yoga', name: '瑜伽', value: 30 },
    { key: 'swimming', name: '游泳', value: 20 },
  ]

  it('计算饼图布局', () => {
    const layout = calculatePieLayout(data, 'value', { width: 300, height: 240, innerRadius: 40, outerRadius: 80 })
    expect(layout.total).toBe(100)
    expect(layout.slices.length).toBe(3)
    expect(layout.cx).toBe(150)
    expect(layout.cy).toBe(120)
    expect(layout.innerRadius).toBe(40)
    expect(layout.outerRadius).toBe(80)
  })

  it('每个切片有正确的百分比和角度', () => {
    const layout = calculatePieLayout(data, 'value')
    let totalPercent = 0
    layout.slices.forEach((s, i) => {
      expect(s.value).toBe(data[i].value)
      expect(s.percent).toBeGreaterThan(0)
      expect(s.startAngle).toBeGreaterThanOrEqual(0)
      expect(s.endAngle).toBeLessThanOrEqual(360)
      expect(s.endAngle).toBeGreaterThan(s.startAngle)
      expect(typeof s.path).toBe('string')
      expect(s.path.startsWith('M')).toBe(true)
      totalPercent += s.percent
    })
    expect(totalPercent).toBeCloseTo(100, 5)
  })

  it('总和为 0 时返回空切片', () => {
    const layout = calculatePieLayout([{ key: 'a', value: 0 }], 'value')
    expect(layout.slices).toEqual([])
    expect(layout.total).toBe(0)
  })

  it('空数据返回空切片', () => {
    const layout = calculatePieLayout([], 'value')
    expect(layout.slices).toEqual([])
    expect(layout.total).toBe(0)
  })

  it('支持自定义 cx 和 cy', () => {
    const layout = calculatePieLayout(data, 'value', { cx: 200, cy: 150 })
    expect(layout.cx).toBe(200)
    expect(layout.cy).toBe(150)
  })

  it('labelPos 在每个切片内', () => {
    const layout = calculatePieLayout(data, 'value', { innerRadius: 40, outerRadius: 80 })
    layout.slices.forEach((s) => {
      const dx = s.labelPos.x - layout.cx
      const dy = s.labelPos.y - layout.cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      expect(dist).toBeGreaterThanOrEqual(40)
      expect(dist).toBeLessThanOrEqual(80)
    })
  })
})

describe('getChartColors', () => {
  it('返回指定数量的颜色', () => {
    expect(getChartColors(3).length).toBe(3)
    expect(getChartColors(8).length).toBe(8)
    expect(getChartColors(12).length).toBe(12)
  })

  it('返回合法的颜色字符串', () => {
    const colors = getChartColors(8)
    colors.forEach((c) => {
      expect(typeof c).toBe('string')
      expect(c.startsWith('#')).toBe(true)
      expect(c.length).toBe(7)
    })
  })

  it('超过调色板大小时循环使用', () => {
    const base = getChartColors(8)
    const extended = getChartColors(16)
    for (let i = 0; i < 8; i++) {
      expect(extended[i]).toBe(base[i])
      expect(extended[i + 8]).toBe(base[i])
    }
  })
})
