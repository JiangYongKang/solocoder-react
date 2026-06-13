import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { CHART_COLORS } from './constants.js'

const HorizontalBarChart = forwardRef(function HorizontalBarChart({ data, width = 500 }, ref) {
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

    const labelPadding = 140
    const valuePadding = 80
    const barHeight = 28
    const gap = 10
    const topPadding = 10
    const bottomPadding = 10
    const leftPadding = 20

    const height = topPadding + bottomPadding + data.length * (barHeight + gap)
    const actualWidth = Math.max(width, 400)

    canvas.width = actualWidth * dpr
    canvas.height = height * dpr
    canvas.style.width = `${actualWidth}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, actualWidth, height)

    const maxCount = Math.max(1, ...data.map((d) => d.count))
    const barAreaWidth = actualWidth - leftPadding - labelPadding - valuePadding - 20

    data.forEach((d, idx) => {
      const y = topPadding + idx * (barHeight + gap)
      const barWidth = (d.count / maxCount) * barAreaWidth

      ctx.fillStyle = CHART_COLORS[idx % CHART_COLORS.length]
      roundRect(ctx, leftPadding + labelPadding, y, barWidth, barHeight, 4)
      ctx.fill()

      ctx.fillStyle = '#1f2937'
      ctx.font = '13px sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      const label = d.label.length > 12 ? d.label.slice(0, 12) + '...' : d.label
      ctx.fillText(label, leftPadding + labelPadding - 8, y + barHeight / 2)

      const pct = d.ratio.toFixed(1) + '%'
      ctx.fillStyle = '#4b5563'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(
        `${d.count}人 (${pct})`,
        leftPadding + labelPadding + barWidth + 8,
        y + barHeight / 2
      )
    })
  }, [data, width])

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

export default HorizontalBarChart
