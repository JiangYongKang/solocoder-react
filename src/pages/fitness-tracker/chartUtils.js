export function niceNumber(range, round) {
  const exponent = Math.floor(Math.log10(range))
  const fraction = range / Math.pow(10, exponent)
  let niceFraction
  if (round) {
    if (fraction < 1.5) niceFraction = 1
    else if (fraction < 3) niceFraction = 2
    else if (fraction < 7) niceFraction = 5
    else niceFraction = 10
  } else {
    if (fraction <= 1) niceFraction = 1
    else if (fraction <= 2) niceFraction = 2
    else if (fraction <= 5) niceFraction = 5
    else niceFraction = 10
  }
  return niceFraction * Math.pow(10, exponent)
}

export function niceScale(min, max, tickCount = 5) {
  if (min === max) {
    const step = Math.max(Math.abs(min) * 0.1, 1)
    return { min: min - step, max: max + step, ticks: [min - step, min, min + step] }
  }
  const range = niceNumber(max - min, false)
  const step = niceNumber(range / (tickCount - 1), true)
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  const ticks = []
  for (let v = niceMin; v <= niceMax + step * 0.5; v += step) {
    ticks.push(Math.round(v * 1e10) / 1e10)
  }
  return { min: niceMin, max: niceMax, step, ticks }
}

export function linearScale(domain, range) {
  const [domainMin, domainMax] = domain
  const [rangeMin, rangeMax] = range
  const domainRange = domainMax - domainMin
  if (domainRange === 0) return () => (rangeMin + rangeMax) / 2
  return (value) => {
    const normalized = (value - domainMin) / domainRange
    return rangeMin + normalized * (rangeMax - rangeMin)
  }
}

export function getXTickIndices(dataLength, maxTicks = 8) {
  if (dataLength <= maxTicks) {
    return Array.from({ length: dataLength }, (_, i) => i)
  }
  const step = Math.ceil(dataLength / maxTicks)
  const indices = []
  for (let i = 0; i < dataLength; i += step) {
    indices.push(i)
  }
  if (indices[indices.length - 1] !== dataLength - 1) {
    indices.push(dataLength - 1)
  }
  return indices
}

export function calculateBarLayout(data, valueKey, options = {}) {
  const { width = 600, height = 240, paddingTop = 20, paddingRight = 20, paddingBottom = 40, paddingLeft = 45 } = options
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom
  const values = data.map((d) => d[valueKey])
  const maxValue = Math.max(...values, 0)
  const { min: scaleMin, max: scaleMax, ticks: yTicks } = niceScale(0, maxValue, 5)
  const yScale = linearScale([scaleMin, scaleMax], [chartHeight, 0])
  const barWidth = chartWidth / data.length
  const innerBarWidth = Math.max(2, Math.min(barWidth * 0.7, 30))
  const bars = data.map((d, i) => {
    const x = paddingLeft + i * barWidth + (barWidth - innerBarWidth) / 2
    const value = d[valueKey] || 0
    const barHeight = chartHeight - yScale(value)
    const y = paddingTop + yScale(value)
    return {
      x,
      y,
      width: innerBarWidth,
      height: Math.max(0, barHeight),
      value,
      data: d,
      index: i,
    }
  })
  const xTickIndices = getXTickIndices(data.length, 8)
  const xTicks = xTickIndices.map((i) => ({
    x: paddingLeft + i * barWidth + barWidth / 2,
    y: paddingTop + chartHeight,
    label: data[i]?.label || String(i),
    index: i,
  }))
  const yTicksFormatted = yTicks.map((v) => ({
    x: paddingLeft,
    y: paddingTop + yScale(v),
    value: v,
    label: String(v),
  }))
  const gridLines = yTicks.map((v) => ({
    x1: paddingLeft,
    y1: paddingTop + yScale(v),
    x2: paddingLeft + chartWidth,
    y2: paddingTop + yScale(v),
  }))
  return {
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    chartWidth,
    chartHeight,
    bars,
    xTicks,
    yTicks: yTicksFormatted,
    gridLines,
    yScale,
    xScale: (i) => paddingLeft + i * barWidth + barWidth / 2,
  }
}

export function calculateLineLayout(data, valueKey, options = {}) {
  const { width = 600, height = 240, paddingTop = 20, paddingRight = 20, paddingBottom = 40, paddingLeft = 45 } = options
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom
  const values = data.map((d) => d[valueKey])
  const maxValue = Math.max(...values, 0)
  const { min: scaleMin, max: scaleMax, ticks: yTicks } = niceScale(0, maxValue, 5)
  const yScale = linearScale([scaleMin, scaleMax], [chartHeight, 0])
  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0
  const points = data.map((d, i) => ({
    x: paddingLeft + i * xStep,
    y: paddingTop + yScale(d[valueKey] || 0),
    value: d[valueKey] || 0,
    data: d,
    index: i,
  }))
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')
  const areaD = pathD +
    ` L ${points[points.length - 1].x.toFixed(2)} ${(paddingTop + chartHeight).toFixed(2)}` +
    ` L ${points[0].x.toFixed(2)} ${(paddingTop + chartHeight).toFixed(2)} Z`
  const xTickIndices = getXTickIndices(data.length, 8)
  const xTicks = xTickIndices.map((i) => ({
    x: paddingLeft + i * xStep,
    y: paddingTop + chartHeight,
    label: data[i]?.label || String(i),
    index: i,
  }))
  const yTicksFormatted = yTicks.map((v) => ({
    x: paddingLeft,
    y: paddingTop + yScale(v),
    value: v,
    label: String(v),
  }))
  const gridLines = yTicks.map((v) => ({
    x1: paddingLeft,
    y1: paddingTop + yScale(v),
    x2: paddingLeft + chartWidth,
    y2: paddingTop + yScale(v),
  }))
  return {
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    chartWidth,
    chartHeight,
    points,
    pathD,
    areaD,
    xTicks,
    yTicks: yTicksFormatted,
    gridLines,
    yScale,
    xScale: (i) => paddingLeft + i * xStep,
  }
}

export function polarToCartesian(cx, cy, radius, angleDegrees) {
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleRadians),
    y: cy + radius * Math.sin(angleRadians),
  }
}

export function describeArc(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle)
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle)
  const startInner = polarToCartesian(cx, cy, innerRadius, startAngle)
  const endInner = polarToCartesian(cx, cy, innerRadius, endAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
  return [
    'M', startOuter.x, startOuter.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    'L', startInner.x, startInner.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, endInner.x, endInner.y,
    'Z',
  ].join(' ')
}

export function calculatePieLayout(data, valueKey, options = {}) {
  const { width = 300, height = 240, cx, cy, innerRadius = 40, outerRadius = 80, paddingAngle = 2 } = options
  const centerX = cx !== undefined ? cx : width / 2
  const centerY = cy !== undefined ? cy : height / 2
  const total = data.reduce((sum, d) => sum + (d[valueKey] || 0), 0)
  if (total === 0) {
    return {
      width,
      height,
      cx: centerX,
      cy: centerY,
      innerRadius,
      outerRadius,
      slices: [],
      total: 0,
    }
  }
  const slices = []
  let currentAngle = 0
  const availableAngle = 360 - paddingAngle * data.length
  data.forEach((d, i) => {
    const value = d[valueKey] || 0
    const sliceAngle = (value / total) * availableAngle
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    const midAngle = (startAngle + endAngle) / 2
    const path = describeArc(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle)
    const labelPos = polarToCartesian(centerX, centerY, (innerRadius + outerRadius) / 2, midAngle)
    slices.push({
      path,
      startAngle,
      endAngle,
      midAngle,
      value,
      percent: (value / total) * 100,
      labelPos,
      data: d,
      index: i,
    })
    currentAngle = endAngle + paddingAngle
  })
  return {
    width,
    height,
    cx: centerX,
    cy: centerY,
    innerRadius,
    outerRadius,
    slices,
    total,
  }
}

export function getChartColors(count = 8) {
  const palette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']
  return Array.from({ length: count }, (_, i) => palette[i % palette.length])
}
