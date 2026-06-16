import { useRef, useEffect, useState, useCallback } from 'react'

const COLOR_UP = '#dc2626'
const COLOR_DOWN = '#16a34a'
const COLOR_GRID = '#e5e7eb'
const COLOR_TEXT = '#6b7280'
const COLOR_PREV_CLOSE = '#9ca3af'
const PADDING_TOP = 20
const PADDING_RIGHT = 60
const PADDING_BOTTOM = 30
const PADDING_LEFT = 10

const TimeShareChart = ({ data, prevClose }) => {
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

    const chartWidth = width - PADDING_LEFT - PADDING_RIGHT
    const chartHeight = height - PADDING_TOP - PADDING_BOTTOM

    let minPrice = Infinity
    let maxPrice = -Infinity

    data.forEach((item) => {
      if (item.price < minPrice) minPrice = item.price
      if (item.price > maxPrice) maxPrice = item.price
    })

    minPrice = Math.min(minPrice, prevClose)
    maxPrice = Math.max(maxPrice, prevClose)

    const priceRange = maxPrice - minPrice
    const pricePadding = priceRange * 0.1 || prevClose * 0.02
    minPrice -= pricePadding
    maxPrice += pricePadding

    const priceToY = (price) => {
      return PADDING_TOP + ((maxPrice - price) / (maxPrice - minPrice)) * chartHeight
    }

    const minuteToX = (minute) => {
      const totalMinutes = data[data.length - 1].minute
      return PADDING_LEFT + (minute / totalMinutes) * chartWidth
    }

    ctx.strokeStyle = COLOR_GRID
    ctx.lineWidth = 0.5

    const priceSteps = 5
    for (let i = 0; i <= priceSteps; i++) {
      const y = PADDING_TOP + chartHeight * (i / priceSteps)
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

    const prevCloseY = priceToY(prevClose)
    ctx.strokeStyle = COLOR_PREV_CLOSE
    ctx.setLineDash([6, 4])
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PADDING_LEFT, prevCloseY)
    ctx.lineTo(width - PADDING_RIGHT, prevCloseY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = COLOR_TEXT
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('昨收:' + prevClose.toFixed(2), PADDING_LEFT + 5, prevCloseY - 5)

    const timePoints = [
      { minute: 0, label: '09:30' },
      { minute: 60, label: '10:30' },
      { minute: 120, label: '11:30/13:00' },
      { minute: 210, label: '14:00' },
      { minute: 300, label: '15:00' },
      { minute: 390, label: '16:00' },
    ]

    timePoints.forEach((tp) => {
      const x = minuteToX(tp.minute)
      if (x >= PADDING_LEFT && x <= width - PADDING_RIGHT) {
        ctx.fillStyle = COLOR_TEXT
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(tp.label, x, height - 10)
      }
    })

    const isAbove = data[0]?.price >= prevClose

    ctx.beginPath()
    ctx.moveTo(minuteToX(data[0].minute), priceToY(prevClose))

    for (let i = 0; i < data.length; i++) {
      const x = minuteToX(data[i].minute)
      const y = priceToY(data[i].price)
      ctx.lineTo(x, y)
    }

    ctx.lineTo(minuteToX(data[data.length - 1].minute), priceToY(prevClose))
    ctx.closePath()

    const gradient = ctx.createLinearGradient(0, PADDING_TOP, 0, PADDING_TOP + chartHeight)
    if (data[data.length - 1]?.price >= prevClose) {
      gradient.addColorStop(0, 'rgba(220, 38, 38, 0.3)')
      gradient.addColorStop(1, 'rgba(220, 38, 38, 0.05)')
    } else {
      gradient.addColorStop(0, 'rgba(22, 163, 74, 0.3)')
      gradient.addColorStop(1, 'rgba(22, 163, 74, 0.05)')
    }
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(minuteToX(data[0].minute), priceToY(data[0].price))

    for (let i = 1; i < data.length; i++) {
      const x = minuteToX(data[i].minute)
      const y = priceToY(data[i].price)
      ctx.lineTo(x, y)
    }

    const lastPrice = data[data.length - 1]?.price || prevClose
    const lineColor = lastPrice >= prevClose ? COLOR_UP : COLOR_DOWN
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1.5
    ctx.stroke()

    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length) {
      const item = data[hoverIndex]
      const x = minuteToX(item.minute)
      ctx.strokeStyle = '#9ca3af'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, PADDING_TOP)
      ctx.lineTo(x, height - PADDING_BOTTOM)
      ctx.stroke()
      ctx.setLineDash([])

      const y = priceToY(item.price)
      ctx.fillStyle = item.price >= prevClose ? COLOR_UP : COLOR_DOWN
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }, [data, prevClose, hoverIndex])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  useEffect(() => {
    const handleResize = () => drawChart()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawChart])

  const handleMouseMove = (e) => {
    const container = containerRef.current
    if (!container || !data || data.length === 0) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const chartWidth = rect.width - PADDING_LEFT - PADDING_RIGHT
    const totalMinutes = data[data.length - 1].minute
    const minute = ((x - PADDING_LEFT) / chartWidth) * totalMinutes

    const index = Math.round(minute)
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
          <div><span className="tooltip-label">时间:</span>{tooltipData.time}</div>
          <div>
            <span className="tooltip-label">价格:</span>
            <span className={tooltipData.price >= prevClose ? 'tooltip-value up' : 'tooltip-value down'}>
              {tooltipData.price.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="tooltip-label">涨跌:</span>
            <span className={tooltipData.price >= prevClose ? 'tooltip-value up' : 'tooltip-value down'}>
              {tooltipData.price >= prevClose ? '+' : ''}
              {(tooltipData.price - prevClose).toFixed(2)}
              ({tooltipData.price >= prevClose ? '+' : ''}
              {((tooltipData.price - prevClose) / prevClose * 100).toFixed(2)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeShareChart
