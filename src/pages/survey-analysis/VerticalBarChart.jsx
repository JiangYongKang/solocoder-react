import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { CHART_COLORS } from './constants.js'

const VerticalBarChart = forwardRef(function VerticalBarChart(
  { data, xLabels, width = 500, height = 260, showValue = true, color },
  ref
) {
  const canvasRef = useRef(null)

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL('image/png') || '',
    getCanvas: () => canvasRef.current,
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    const leftPadding = 50
    const rightPadding = 20
    const topPadding = 20
    const bottomPadding = 50

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const chartWidth = width - leftPadding - rightPadding
    const chartHeight = height - topPadding - bottomPadding

    const maxValue = Math.max(1, ...data.map((d) => d.count))
    const yStep = Math.ceil(maxValue / 5)
    const yMax = yStep * 5

    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.fillStyle = '#9ca3af'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= 5; i++) {
      const yVal = yStep * i
      const y = topPadding + chartHeight - (yVal / yMax) * chartHeight
      ctx.beginPath()
      ctx.moveTo(leftPadding, y)
      ctx.lineTo(leftPadding + chartWidth, y)
      ctx.stroke()
      ctx.fillText(String(yVal), leftPadding - 6, y)
    }

    const barCount = data.length
    const barGap = 16
    const totalGap = barGap * (barCount + 1)
    const barWidth = Math.max(16, (chartWidth - totalGap) / barCount)

    data.forEach((d, idx) => {
      const x = leftPadding + barGap + idx * (barWidth + barGap)
      const barH = (d.count / yMax) * chartHeight
      const y = topPadding + chartHeight - barH

      const fillColor = color || CHART_COLORS[idx % CHART_COLORS.length]
      ctx.fillStyle = fillColor
      roundRect(ctx, x, y, barWidth, barH, 4)
      ctx.fill()

      if (showValue) {
        ctx.fillStyle = '#374151'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(String(d.count), x + barWidth / 2, y - 4)
      }

      const label = xLabels ? xLabels[idx] : d.label || String(idx + 1)
      ctx.fillStyle = '#4b5563'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      const shortLabel = label.length > 6 ? label.slice(0, 6) : label
      ctx.fillText(shortLabel, x + barWidth / 2, topPadding + chartHeight + 8)

      if (d.ratio !== undefined) {
        ctx.fillStyle = '#9ca3af'
        ctx.font = '10px sans-serif'
        ctx.fillText(d.ratio.toFixed(0) + '%', x + barWidth / 2, topPadding + chartHeight + 26)
      }
    })
  }, [data, xLabels, width, height, showValue, color])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
})

function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2
  if (h < 2 * r) r = h / 2
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export default VerticalBarChart
