import { formatTimeOnly } from './deviceUtils.js'

export function niceNumber(range, round) {
  if (range <= 0) return 1
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
    return { min: min - step, max: max + step, step, ticks: [min - step, min, min + step] }
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
  if (dataLength <= 0) return []
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

export function calculateLineChartLayout(data, options = {}) {
  const {
    width = 600,
    height = 240,
    paddingTop = 20,
    paddingRight = 20,
    paddingBottom = 40,
    paddingLeft = 50,
    valueKey = 'value',
    yTickCount = 5,
    xMaxTicks = 6,
    threshold = null,
  } = options

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const values = Array.isArray(data) ? data.map((d) => d[valueKey]) : []
  if (values.length === 0) {
    return {
      width,
      height,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      chartWidth,
      chartHeight,
      points: [],
      xTicks: [],
      yTicks: [],
      gridLines: [],
      thresholdLine: null,
      yScale: () => 0,
      xScale: () => 0,
    }
  }

  let minValue = Math.min(...values)
  let maxValue = Math.max(...values)

  const dataMin = minValue
  const dataMax = maxValue
  const dataRange = dataMax - dataMin || Math.max(Math.abs(dataMin), Math.abs(dataMax), 1)

  let effectiveThreshold = null
  if (threshold !== null && threshold !== undefined && !isNaN(Number(threshold))) {
    const t = Number(threshold)
    const distToMin = Math.abs(t - dataMin)
    const distToMax = Math.abs(t - dataMax)
    const maxAllowedDist = dataRange * 10
    if (distToMin <= maxAllowedDist || distToMax <= maxAllowedDist) {
      effectiveThreshold = t
      minValue = Math.min(minValue, t)
      maxValue = Math.max(maxValue, t)
    }
  }

  const yRange = maxValue - minValue
  if (yRange > 0) {
    const padding = yRange * 0.1
    minValue -= padding
    maxValue += padding
  }

  const { min: scaleMin, max: scaleMax, ticks: yTicksRaw } = niceScale(minValue, maxValue, yTickCount)
  const yScale = linearScale([scaleMin, scaleMax], [chartHeight, 0])

  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0
  const xScale = (i) => paddingLeft + i * xStep

  const points = data.map((d, i) => ({
    x: xScale(i),
    y: paddingTop + yScale(d[valueKey] || 0),
    value: d[valueKey] || 0,
    data: d,
    index: i,
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  const xTickIndices = getXTickIndices(data.length, xMaxTicks)
  const xTicks = xTickIndices.map((i) => ({
    x: xScale(i),
    y: paddingTop + chartHeight,
    label: data[i]?.timestamp ? formatTimeOnly(data[i].timestamp) : String(i),
    index: i,
  }))

  const yTicks = yTicksRaw.map((v) => ({
    x: paddingLeft,
    y: paddingTop + yScale(v),
    value: v,
    label: String(v),
  }))

  const gridLines = yTicksRaw.map((v) => ({
    x1: paddingLeft,
    y1: paddingTop + yScale(v),
    x2: paddingLeft + chartWidth,
    y2: paddingTop + yScale(v),
  }))

  let thresholdLine = null
  if (effectiveThreshold !== null) {
    const t = effectiveThreshold
    if (t >= scaleMin - 1e-9 && t <= scaleMax + 1e-9) {
      thresholdLine = {
        x1: paddingLeft,
        y1: paddingTop + yScale(t),
        x2: paddingLeft + chartWidth,
        y2: paddingTop + yScale(t),
        value: t,
      }
    }
  }

  return {
    width,
    height,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    chartWidth,
    chartHeight,
    points,
    pathD,
    xTicks,
    yTicks,
    gridLines,
    thresholdLine,
    yScale,
    xScale,
    scaleMin,
    scaleMax,
  }
}

export function findNearestPoint(points, mouseX, mouseY) {
  if (!Array.isArray(points) || points.length === 0) return null
  let nearest = null
  let minDist = Infinity
  points.forEach((p) => {
    const dx = p.x - mouseX
    const dy = p.y - mouseY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < minDist) {
      minDist = dist
      nearest = { ...p, distance: dist }
    }
  })
  return nearest
}

export function drawLineChart(ctx, layout, options = {}) {
  if (!ctx || !layout) return
  const {
    lineColor = '#1890ff',
    lineWidth = 2,
    dotColor = '#1890ff',
    dotRadius = 3,
    gridColor = '#f0f0f0',
    axisColor = '#d9d9d9',
    textColor = '#666',
    fontSize = 12,
    thresholdColor = '#f5222d',
    thresholdDash = [6, 4],
    showDots = true,
    showArea = false,
    areaColor = 'rgba(24, 144, 255, 0.1)',
  } = options

  const { chartWidth, chartHeight, paddingLeft, paddingTop, points, gridLines, xTicks, yTicks, thresholdLine } = layout

  ctx.clearRect(0, 0, layout.width, layout.height)

  ctx.strokeStyle = gridColor
  ctx.lineWidth = 1
  gridLines.forEach((line) => {
    ctx.beginPath()
    ctx.moveTo(line.x1, line.y1)
    ctx.lineTo(line.x2, line.y2)
    ctx.stroke()
  })

  ctx.strokeStyle = axisColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(paddingLeft, paddingTop)
  ctx.lineTo(paddingLeft, paddingTop + chartHeight)
  ctx.lineTo(paddingLeft + chartWidth, paddingTop + chartHeight)
  ctx.stroke()

  ctx.fillStyle = textColor
  ctx.font = `${fontSize}px sans-serif`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  yTicks.forEach((tick) => {
    ctx.fillText(tick.label, paddingLeft - 6, tick.y)
  })

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  xTicks.forEach((tick) => {
    ctx.fillText(tick.label, tick.x, tick.y + 6)
  })

  if (thresholdLine) {
    ctx.save()
    ctx.strokeStyle = thresholdColor
    ctx.lineWidth = 1.5
    ctx.setLineDash(thresholdDash)
    ctx.beginPath()
    ctx.moveTo(thresholdLine.x1, thresholdLine.y1)
    ctx.lineTo(thresholdLine.x2, thresholdLine.y2)
    ctx.stroke()
    ctx.restore()
  }

  if (showArea && points.length > 1) {
    ctx.fillStyle = areaColor
    ctx.beginPath()
    ctx.moveTo(points[0].x, paddingTop + chartHeight)
    points.forEach((p) => {
      ctx.lineTo(p.x, p.y)
    })
    ctx.lineTo(points[points.length - 1].x, paddingTop + chartHeight)
    ctx.closePath()
    ctx.fill()
  }

  if (points.length > 1) {
    ctx.strokeStyle = lineColor
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()
  }

  if (showDots && points.length > 0) {
    ctx.fillStyle = dotColor
    points.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2)
      ctx.fill()
    })
  }
}

export function drawTooltip(ctx, x, y, text, options = {}) {
  if (!ctx) return
  const {
    backgroundColor = 'rgba(0, 0, 0, 0.75)',
    textColor = '#fff',
    fontSize = 12,
    paddingX = 8,
    paddingY = 6,
    borderRadius = 4,
    offsetX = 10,
    offsetY = -10,
  } = options

  ctx.font = `${fontSize}px sans-serif`
  const lines = Array.isArray(text) ? text : [text]
  const lineHeight = fontSize + 4
  const textWidth = Math.max(...lines.map((l) => ctx.measureText(l).width))
  const boxWidth = textWidth + paddingX * 2
  const boxHeight = lines.length * lineHeight + paddingY * 2 - 4

  let posX = x + offsetX
  let posY = y - boxHeight + offsetY

  if (posX + boxWidth > ctx.canvas.width) {
    posX = x - boxWidth - offsetX
  }
  if (posY < 0) {
    posY = y + Math.abs(offsetY)
  }

  ctx.fillStyle = backgroundColor
  ctx.beginPath()
  ctx.roundRect(posX, posY, boxWidth, boxHeight, borderRadius)
  ctx.fill()

  ctx.fillStyle = textColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  lines.forEach((line, i) => {
    ctx.fillText(line, posX + paddingX, posY + paddingY + i * lineHeight)
  })

  return { x: posX, y: posY, width: boxWidth, height: boxHeight }
}
