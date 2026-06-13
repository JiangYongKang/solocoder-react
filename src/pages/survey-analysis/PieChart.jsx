import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { CHART_COLORS } from './constants.js'

const PieChart = forwardRef(function PieChart({ data, size = 240 }, ref) {
  const canvasRef = useRef(null)

  useImperativeHandle(ref, () => ({
    toDataURL: () => {
      return canvasRef.current?.toDataURL('image/png') || ''
    },
    getCanvas: () => canvasRef.current,
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)

    const total = data.reduce((sum, d) => sum + Math.max(0, d.count), 0)
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 10
    const innerRadius = radius * 0.55

    let startAngle = -Math.PI / 2
    const nonZeroData = data.filter((d) => d.count > 0)

    if (total === 0 || nonZeroData.length === 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = '#e5e7eb'
      ctx.fill()
      return
    }

    nonZeroData.forEach((d, idx) => {
      const sliceAngle = (d.count / total) * Math.PI * 2
      const endAngle = startAngle + sliceAngle

      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(startAngle) * innerRadius, cy + Math.sin(startAngle) * innerRadius)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true)
      ctx.closePath()
      ctx.fillStyle = CHART_COLORS[idx % CHART_COLORS.length]
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      const midAngle = startAngle + sliceAngle / 2
      const labelRadius = (radius + innerRadius) / 2
      if (sliceAngle > 0.15) {
        const lx = cx + Math.cos(midAngle) * labelRadius
        const ly = cy + Math.sin(midAngle) * labelRadius
        const pct = ((d.count / total) * 100).toFixed(0) + '%'
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(pct, lx, ly)
      }

      startAngle = endAngle
    })
  }, [data, size])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
})

export default PieChart
