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
    const expandedSize = size + 80
    canvas.width = expandedSize * dpr
    canvas.height = expandedSize * dpr
    canvas.style.width = `${expandedSize}px`
    canvas.style.height = `${expandedSize}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, expandedSize, expandedSize)

    const total = data.reduce((sum, d) => sum + Math.max(0, d.count), 0)
    const cx = expandedSize / 2
    const cy = expandedSize / 2
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

    const slices = []
    nonZeroData.forEach((d, idx) => {
      const sliceAngle = (d.count / total) * Math.PI * 2
      const endAngle = startAngle + sliceAngle

      ctx.beginPath()
      ctx.moveTo(
        cx + Math.cos(startAngle) * innerRadius,
        cy + Math.sin(startAngle) * innerRadius
      )
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true)
      ctx.closePath()
      ctx.fillStyle = CHART_COLORS[idx % CHART_COLORS.length]
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      slices.push({
        midAngle: startAngle + sliceAngle / 2,
        sliceAngle,
        pct: ((d.count / total) * 100).toFixed(0) + '%',
        idx,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      })

      startAngle = endAngle
    })

    const labelRadius = radius + 18
    ctx.font = 'bold 11px sans-serif'
    const labelHeight = 14
    const labelPositions = slices.map((s) => {
      const lx = cx + Math.cos(s.midAngle) * labelRadius
      const ly = cy + Math.sin(s.midAngle) * labelRadius
      const textW = ctx.measureText(s.pct).width
      return {
        x: lx,
        y: ly,
        midAngle: s.midAngle,
        sliceAngle: s.sliceAngle,
        pct: s.pct,
        idx: s.idx,
        color: s.color,
        width: textW,
      }
    })

    for (let iteration = 0; iteration < 30; iteration++) {
      let moved = false
      for (let i = 0; i < labelPositions.length; i++) {
        for (let j = i + 1; j < labelPositions.length; j++) {
          const a = labelPositions[i]
          const b = labelPositions[j]
          const maxWidth = Math.max(a.width, b.width)
          const minDistX = maxWidth + 6
          const minDistY = labelHeight + 4
          let dx = a.x - b.x
          let dy = a.y - b.y
          if (Math.abs(dx) < minDistX && Math.abs(dy) < minDistY) {
            const overlapX = minDistX - Math.abs(dx)
            const overlapY = minDistY - Math.abs(dy)
            let dirX
            if (dx === 0) {
              const angleA = Math.atan2(a.y - cy, a.x - cx)
              const angleB = Math.atan2(b.y - cy, b.x - cx)
              const diff = ((angleA - angleB + Math.PI * 3) % (Math.PI * 2)) - Math.PI
              dirX = diff >= 0 ? 1 : -1
            } else {
              dirX = dx
            }
            let dirY
            if (dy === 0) {
              const angleA = Math.atan2(a.y - cy, a.x - cx)
              const angleB = Math.atan2(b.y - cy, b.x - cx)
              const avgAngle = (angleA + angleB) / 2
              dirY = Math.sin(avgAngle) >= 0 ? 1 : -1
            } else {
              dirY = dy
            }
            const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1
            dirX /= len
            dirY /= len
            const pushFactor = Math.max(overlapX, overlapY) / 2 + 1
            a.x += dirX * pushFactor
            a.y += dirY * pushFactor
            b.x -= dirX * pushFactor
            b.y -= dirY * pushFactor
            moved = true
          }
        }
      }
      if (!moved) break
    }

    labelPositions.forEach((lp) => {
      ctx.fillStyle = '#374151'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(lp.pct, lp.x, lp.y)

      const lineStartR = radius + 2
      const lineEndR = labelRadius - 6
      ctx.beginPath()
      ctx.moveTo(
        cx + Math.cos(lp.midAngle) * lineStartR,
        cy + Math.sin(lp.midAngle) * lineStartR
      )
      const midLineX = cx + Math.cos(lp.midAngle) * lineEndR
      const midLineY = cy + Math.sin(lp.midAngle) * lineEndR
      ctx.lineTo(midLineX, midLineY)
      ctx.lineTo(lp.x, lp.y)
      ctx.strokeStyle = lp.color
      ctx.lineWidth = 1.2
      ctx.stroke()
    })
  }, [data, size])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
})

export default PieChart
