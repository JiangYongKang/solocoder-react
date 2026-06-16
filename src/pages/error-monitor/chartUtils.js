const niceNumber = (range, round) => {
  if (range === 0) return 1
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

const niceScale = (min, max, tickCount = 5) => {
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

const drawLineChart = (
  ctx,
  data,
  typeKeys,
  typeColors,
  options = {}
) => {
  const {
    width = 600,
    height = 280,
    paddingTop = 20,
    paddingRight = 20,
    paddingBottom = 40,
    paddingLeft = 50,
    hoverIndex = -1,
  } = options

  ctx.clearRect(0, 0, width, height)

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  let maxValue = 0
  data.forEach((point) => {
    typeKeys.forEach((typeKey) => {
      const val = point.types[typeKey] || 0
      if (val > maxValue) maxValue = val
    })
  })

  const { min: yMin, max: yMax, ticks: yTicks } = niceScale(0, maxValue, 5)

  const yScale = (value) => {
    if (yMax === yMin) return chartHeight / 2
    return chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight
  }

  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth
  const xScale = (index) => paddingLeft + index * xStep

  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  yTicks.forEach((tick) => {
    const y = paddingTop + yScale(tick)
    ctx.beginPath()
    ctx.moveTo(paddingLeft, y)
    ctx.lineTo(width - paddingRight, y)
    ctx.stroke()
  })

  ctx.fillStyle = '#6b7280'
  ctx.font = '12px system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  yTicks.forEach((tick) => {
    const y = paddingTop + yScale(tick)
    ctx.fillText(String(tick), paddingLeft - 8, y)
  })

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const labelStep = Math.ceil(data.length / 8)
  data.forEach((point, i) => {
    if (i % labelStep === 0 || i === data.length - 1) {
      const x = xScale(i)
      ctx.fillText(point.label, x, height - paddingBottom + 8)
    }
  })

  typeKeys.forEach((typeKey) => {
    const color = typeColors[typeKey] || '#666'

    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    data.forEach((point, i) => {
      const val = point.types[typeKey] || 0
      const x = xScale(i)
      const y = paddingTop + yScale(val)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    data.forEach((point, i) => {
      const val = point.types[typeKey] || 0
      const x = xScale(i)
      const y = paddingTop + yScale(val)

      ctx.beginPath()
      ctx.fillStyle = '#fff'
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.stroke()
    })
  })

  if (hoverIndex >= 0 && hoverIndex < data.length) {
    const x = xScale(hoverIndex)

    ctx.beginPath()
    ctx.strokeStyle = '#9ca3af'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.moveTo(x, paddingTop)
    ctx.lineTo(x, height - paddingBottom)
    ctx.stroke()
    ctx.setLineDash([])

    typeKeys.forEach((typeKey) => {
      const val = data[hoverIndex].types[typeKey] || 0
      const y = paddingTop + yScale(val)
      ctx.beginPath()
      ctx.fillStyle = typeColors[typeKey] || '#666'
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  return {
    xScale,
    yScale,
    chartWidth,
    chartHeight,
    paddingLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
  }
}

const drawPieChart = (ctx, data, options = {}) => {
  const {
    width = 300,
    height = 280,
    cx,
    cy,
    outerRadius = 100,
    innerRadius = 60,
    paddingAngle = 2,
    hoverIndex = -1,
  } = options

  ctx.clearRect(0, 0, width, height)

  const centerX = cx !== undefined ? cx : width / 2
  const centerY = cy !== undefined ? cy : height / 2 - 10

  const total = data.reduce((sum, d) => sum + (d.value || 0), 0)

  if (total === 0) {
    ctx.fillStyle = '#9ca3af'
    ctx.font = '14px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('暂无数据', centerX, centerY)
    return { cx: centerX, cy: centerY, slices: [], total: 0 }
  }

  const slices = []
  let currentAngle = -90
  const availableAngle = 360 - paddingAngle * data.length

  data.forEach((d, i) => {
    const value = d.value || 0
    const sliceAngle = (value / total) * availableAngle
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    const midAngle = (startAngle + endAngle) / 2

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const isHovered = i === hoverIndex
    const offset = isHovered ? 8 : 0
    const offsetX = offset * Math.cos((midAngle * Math.PI) / 180)
    const offsetY = offset * Math.sin((midAngle * Math.PI) / 180)

    const sx = centerX + offsetX + outerRadius * Math.cos(startRad)
    const sy = centerY + offsetY + outerRadius * Math.sin(startRad)
    const iex = centerX + offsetX + innerRadius * Math.cos(endRad)
    const iey = centerY + offsetY + innerRadius * Math.sin(endRad)

    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.arc(centerX + offsetX, centerY + offsetY, outerRadius, startRad, endRad, false)
    ctx.lineTo(iex, iey)
    ctx.arc(centerX + offsetX, centerY + offsetY, innerRadius, endRad, startRad, true)
    ctx.closePath()
    ctx.fillStyle = d.color || '#666'
    ctx.fill()

    slices.push({
      index: i,
      startAngle,
      endAngle,
      midAngle,
      value,
      percent: (value / total) * 100,
      data: d,
      centerX: centerX + offsetX,
      centerY: centerY + offsetY,
      outerRadius,
      innerRadius,
    })

    currentAngle = endAngle + paddingAngle
  })

  ctx.fillStyle = '#374151'
  ctx.font = 'bold 20px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(total), centerX, centerY - 8)
  ctx.fillStyle = '#6b7280'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('总错误数', centerX, centerY + 14)

  const legendY = centerY + outerRadius + 30
  const legendItemWidth = width / Math.min(data.length, 3)
  data.forEach((d, i) => {
    const row = Math.floor(i / 3)
    const col = i % 3
    const lx = 30 + col * legendItemWidth
    const ly = legendY + row * 22

    ctx.fillStyle = d.color || '#666'
    ctx.fillRect(lx, ly - 7, 12, 12)

    ctx.fillStyle = '#374151'
    ctx.font = '12px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const label = d.name || d.type || ''
    ctx.fillText(label.length > 10 ? label.slice(0, 10) + '...' : label, lx + 18, ly)
  })

  return {
    cx: centerX,
    cy: centerY,
    outerRadius,
    innerRadius,
    slices,
    total,
  }
}

const getChartColors = (count = 8) => {
  const palette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']
  return Array.from({ length: count }, (_, i) => palette[i % palette.length])
}

export {
  niceNumber,
  niceScale,
  drawLineChart,
  drawPieChart,
  getChartColors,
}
