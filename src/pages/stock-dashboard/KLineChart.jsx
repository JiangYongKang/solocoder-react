import { useRef, useEffect, useState, useCallback } from 'react'

const COLOR_UP = '#dc2626'
const COLOR_DOWN = '#16a34a'
const COLOR_GRID = '#e5e7eb'
const COLOR_TEXT = '#6b7280'
const PADDING_TOP = 20
const PADDING_RIGHT = 60
const PADDING_BOTTOM = 30
const PADDING_LEFT = 10
const VOLUME_HEIGHT_RATIO = 0.25

const KLineChart = ({ data }) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !data || data.length === 0) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const chartHeight = height * (1 - VOLUME_HEIGHT_RATIO)
    const volumeTop = height * (1 - VOLUME_HEIGHT_RATIO)
    const volumeHeight = height * VOLUME_HEIGHT_RATIO - PADDING_BOTTOM

    let minPrice = Infinity
    let maxPrice = -Infinity
    let maxVolume = 0

    data.forEach((item) => {
      if (item.low < minPrice) minPrice = item.low
      if (item.high > maxPrice) maxPrice = item.high
      if (item.volume > maxVolume) maxVolume = item.volume
    })

    const priceRange = maxPrice - minPrice
    const pricePadding = priceRange * 0.1
    minPrice -= pricePadding
    maxPrice += pricePadding

    const chartWidth = width - PADDING_LEFT - PADDING_RIGHT
    const barWidth = Math.max(2, (chartWidth / data.length) * 0.7)
    const gap = chartWidth / data.length

    ctx.strokeStyle = COLOR_GRID
    ctx.lineWidth = 0.5

    const priceSteps = 5
    for (let i = 0; i <= priceSteps; i++) {
      const y = PADDING_TOP + (chartHeight - PADDING_TOP) * (i / priceSteps)
      ctx.beginPath()
      ctx.moveTo(PADDING_LEFT, y)
      ctx.lineTo(width - PADDING_RIGHT, y)
      ctx.stroke()

      const price = maxPrice - ((maxPrice - minPrice) * i) / priceSteps
      ctx.fillStyle = COLOR_TEXT
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(price.toFixed(2), width - PADDING_RIGHT + 5, y + 4)
    }

    const dateStep = Math.max(1, Math.floor(data.length / 6))
    for (let i = 0; i < data.length; i += dateStep) {
      const x = PADDING_LEFT + i * gap + gap / 2
      ctx.fillStyle = COLOR_TEXT
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(data[i].date.slice(5), x, height - 10)
    }

    ctx.strokeStyle = COLOR_GRID
    ctx.beginPath()
    ctx.moveTo(PADDING_LEFT, volumeTop)
    ctx.lineTo(width - PADDING_RIGHT, volumeTop)
    ctx.stroke()

    data.forEach((item, index) => {
      const x = PADDING_LEFT + index * gap + gap / 2
      const color = item.isUp ? COLOR_UP : COLOR_DOWN

      const highY = PADDING_TOP + ((maxPrice - item.high) / (maxPrice - minPrice)) * (chartHeight - PADDING_TOP)
      const lowY = PADDING_TOP + ((maxPrice - item.low) / (maxPrice - minPrice)) * (chartHeight - PADDING_TOP)
      const openY = PADDING_TOP + ((maxPrice - item.open) / (maxPrice - minPrice)) * (chartHeight - PADDING_TOP)
      const closeY = PADDING_TOP + ((maxPrice - item.close) / (maxPrice - minPrice)) * (chartHeight - PADDING_TOP)

      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, highY)
      ctx.lineTo(x, lowY)
      ctx.stroke()

      const bodyTop = Math.min(openY, closeY)
      const bodyHeight = Math.max(1, Math.abs(closeY - openY))

      ctx.fillStyle = color
      ctx.fillRect(x - barWidth / 2, bodyTop, barWidth, bodyHeight)

      const volHeight = (item.volume / maxVolume) * volumeHeight
      const volY = volumeTop + volumeHeight - volHeight

      ctx.fillStyle = color
      ctx.globalAlpha = 0.7
      ctx.fillRect(x - barWidth / 2, volY, barWidth, volHeight)
      ctx.globalAlpha = 1
    })

    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length) {
      const x = PADDING_LEFT + hoverIndex * gap + gap / 2
      ctx.strokeStyle = '#9ca3af'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, PADDING_TOP)
      ctx.lineTo(x, volumeTop + volumeHeight)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [data, hoverIndex])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  useEffect(() => {
    const handleResize = () => drawChart()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawChart])

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !data || data.length === 0) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const chartWidth = rect.width - PADDING_LEFT - PADDING_RIGHT
    const gap = chartWidth / data.length

    const index = Math.floor((x - PADDING_LEFT) / gap)
    if (index >= 0 && index < data.length) {
      setHoverIndex(index)
      setTooltipPos({ x, y })
    } else {
      setHoverIndex(null)
    }
  }

  const handleMouseLeave = () => {
    setHoverIndex(null)
  }

  const tooltipData = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null

  return (
    <div className="chart-canvas-wrapper" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="chart-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltipData && (
        <div
          className="chart-tooltip"
          style={{
            left: Math.min(tooltipPos.x + 10, 400),
            top: tooltipPos.y + 10,
          }}
        >
          <div><span className="tooltip-label">日期:</span>{tooltipData.date}</div>
          <div><span className="tooltip-label">开盘:</span><span className={tooltipData.isUp ? 'tooltip-value up' : 'tooltip-value down'}>{tooltipData.open.toFixed(2)}</span></div>
          <div><span className="tooltip-label">收盘:</span><span className={tooltipData.isUp ? 'tooltip-value up' : 'tooltip-value down'}>{tooltipData.close.toFixed(2)}</span></div>
          <div><span className="tooltip-label">最高:</span>{tooltipData.high.toFixed(2)}</div>
          <div><span className="tooltip-label">最低:</span>{tooltipData.low.toFixed(2)}</div>
          <div><span className="tooltip-label">成交量:</span>{(tooltipData.volume / 10000).toFixed(0)}万</div>
        </div>
      )}
    </div>
  )
}

export default KLineChart
