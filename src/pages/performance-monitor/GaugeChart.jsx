import { useEffect, useRef } from 'react'
import { METRIC_RANGES, METRIC_LABELS, METRIC_UNITS, FPS_COLOR_ZONES } from './constants'
import { getFpsStatus } from './utils'

function GaugeChart({ metricType, value, size = 220 }) {
  const canvasRef = useRef(null)
  const animRef = useRef({ angle: null, rafId: null })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    if (rect.width === 0 || rect.height === 0) return

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const cx = w / 2
    const cy = h * 0.62
    const radius = Math.min(w, h * 2) * 0.38
    const innerRadius = radius * 0.65

    const range = METRIC_RANGES[metricType] || { min: 0, max: 100 }
    const startAngle = Math.PI
    const endAngle = 2 * Math.PI
    const totalAngle = endAngle - startAngle

    const clampedValue = Math.max(range.min, Math.min(range.max, value || 0))
    const ratio = (clampedValue - range.min) / (range.max - range.min)
    const targetAngle = startAngle + ratio * totalAngle

    ctx.clearRect(0, 0, w, h)

    const bgGradient = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, radius)
    bgGradient.addColorStop(0, 'rgba(255,255,255,0.05)')
    bgGradient.addColorStop(1, 'rgba(255,255,255,0.02)')

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--card-bg') || '#ffffff'
    ctx.beginPath()
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = bgGradient
    ctx.fill()

    if (metricType === 'fps') {
      FPS_COLOR_ZONES.forEach((zone) => {
        const zoneStartRatio = (zone.from - range.min) / (range.max - range.min)
        const zoneEndRatio = (zone.to - range.min) / (range.max - range.min)
        const zoneStartAngle = startAngle + zoneStartRatio * totalAngle
        const zoneEndAngle = startAngle + zoneEndRatio * totalAngle

        ctx.beginPath()
        ctx.arc(cx, cy, radius, zoneStartAngle, zoneEndAngle)
        ctx.arc(cx, cy, innerRadius, zoneEndAngle, zoneStartAngle, true)
        ctx.closePath()
        ctx.fillStyle = zone.color + '66'
        ctx.fill()
        ctx.strokeStyle = zone.color
        ctx.lineWidth = 1
        ctx.stroke()
      })
    } else {
      const zoneCount = 10
      for (let i = 0; i < zoneCount; i++) {
        const zs = startAngle + (i / zoneCount) * totalAngle
        const ze = startAngle + ((i + 1) / zoneCount) * totalAngle
        const intensity = 0.3 + (i / zoneCount) * 0.4
        const hue = metricType === 'memory'
          ? `hsl(${210 - i * 10}, ${60 + i * 2}%, ${50 + i}%)`
          : `hsl(${0 + i * 10}, ${70}%, ${55}%)`
        ctx.beginPath()
        ctx.arc(cx, cy, radius, zs, ze)
        ctx.arc(cx, cy, innerRadius, ze, zs, true)
        ctx.closePath()
        ctx.fillStyle = hue.replace(')', `, ${intensity})`).replace('hsl', 'hsla')
        ctx.fill()
      }
    }

    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#aa3bff'
    ctx.strokeStyle = accent
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 2, startAngle, endAngle)
    ctx.stroke()

    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#333'
    ctx.fillStyle = textColor
    ctx.font = `${Math.max(10, w * 0.045)}px system-ui, -apple-system, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let i = 0; i <= 5; i++) {
      const r = i / 5
      const angle = startAngle + r * totalAngle
      const tickValue = range.min + r * (range.max - range.min)
      const tx = cx + Math.cos(angle) * (radius - 16)
      const ty = cy + Math.sin(angle) * (radius - 16)

      ctx.fillStyle = textColor + '99'
      ctx.font = `${Math.max(9, w * 0.038)}px system-ui, sans-serif`
      let label
      if (metricType === 'fps') {
        label = Math.round(tickValue).toString()
      } else if (metricType === 'memory') {
        label = Math.round(tickValue).toString()
      } else {
        label = Math.round(tickValue) + '%'
      }
      ctx.fillText(label, tx, ty)
    }

    const animate = () => {
      if (animRef.current.angle === null) {
        animRef.current.angle = startAngle
      }

      const currentAngle = animRef.current.angle
      const angleDiff = targetAngle - currentAngle
      if (Math.abs(angleDiff) > 0.005) {
        animRef.current.angle = currentAngle + angleDiff * 0.2
        animRef.current.rafId = requestAnimationFrame(draw)
      } else {
        animRef.current.angle = targetAngle
        draw()
      }
    }

    const draw = () => {
      ctx.save()
      ctx.clearRect(cx - radius - 10, cy - radius - 10, radius * 2 + 20, radius * 2 + 20)

      if (metricType === 'fps') {
        FPS_COLOR_ZONES.forEach((zone) => {
          const zoneStartRatio = (zone.from - range.min) / (range.max - range.min)
          const zoneEndRatio = (zone.to - range.min) / (range.max - range.min)
          const zoneStartAngle = startAngle + zoneStartRatio * totalAngle
          const zoneEndAngle = startAngle + zoneEndRatio * totalAngle

          ctx.beginPath()
          ctx.arc(cx, cy, radius, zoneStartAngle, zoneEndAngle)
          ctx.arc(cx, cy, innerRadius, zoneEndAngle, zoneStartAngle, true)
          ctx.closePath()
          ctx.fillStyle = zone.color + '55'
          ctx.fill()
        })
      } else {
        const zoneCount = 10
        for (let i = 0; i < zoneCount; i++) {
          const zs = startAngle + (i / zoneCount) * totalAngle
          const ze = startAngle + ((i + 1) / zoneCount) * totalAngle
          ctx.beginPath()
          ctx.arc(cx, cy, radius, zs, ze)
          ctx.arc(cx, cy, innerRadius, ze, zs, true)
          ctx.closePath()
          const intensity = 0.25 + (i / zoneCount) * 0.3
          const hue = metricType === 'memory'
            ? `hsla(${210 - i * 10}, 65%, 55%, ${intensity})`
            : `hsla(${0 + i * 10}, 70%, 55%, ${intensity})`
          ctx.fillStyle = hue
          ctx.fill()
        }
      }

      const pAngle = animRef.current.angle || targetAngle
      const needleLen = radius - 30
      const needleX = cx + Math.cos(pAngle) * needleLen
      const needleY = cy + Math.sin(pAngle) * needleLen

      let needleColor
      if (metricType === 'fps') {
        const fpsVal = range.min + ((pAngle - startAngle) / totalAngle) * (range.max - range.min)
        needleColor = getFpsStatus(fpsVal).color
      } else if (metricType === 'memory') {
        const memVal = range.min + ((pAngle - startAngle) / totalAngle) * (range.max - range.min)
        if (memVal > 800) needleColor = '#ef4444'
        else if (memVal > 600) needleColor = '#f59e0b'
        else needleColor = '#10b981'
      } else {
        const cpuVal = range.min + ((pAngle - startAngle) / totalAngle) * (range.max - range.min)
        if (cpuVal > 90) needleColor = '#ef4444'
        else if (cpuVal > 70) needleColor = '#f59e0b'
        else needleColor = '#10b981'
      }

      ctx.shadowColor = needleColor
      ctx.shadowBlur = 8

      ctx.strokeStyle = needleColor
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(needleX, needleY)
      ctx.stroke()

      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'

      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = needleColor
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = needleColor
      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()

      const currentDisplayAngle = animRef.current.angle || targetAngle
      if (Math.abs(currentDisplayAngle - targetAngle) > 0.005) {
        animRef.current.rafId = requestAnimationFrame(animate)
      }
    }

    draw()
    animate()

    const currentRef = animRef.current
    return () => {
      if (currentRef.rafId) {
        cancelAnimationFrame(currentRef.rafId)
      }
    }
  }, [value, metricType, size])

  let valueColor
  if (metricType === 'fps') {
    valueColor = getFpsStatus(value).color
  } else if (metricType === 'memory') {
    if (value > 800) valueColor = '#ef4444'
    else if (value > 600) valueColor = '#f59e0b'
    else valueColor = '#10b981'
  } else {
    if (value > 90) valueColor = '#ef4444'
    else if (value > 70) valueColor = '#f59e0b'
    else valueColor = '#10b981'
  }

  const unit = METRIC_UNITS[metricType] || ''
  const displayValue = typeof value === 'number'
    ? (metricType === 'fps' ? Math.round(value) : value.toFixed(1))
    : '-'

  return (
    <div className="gauge-card" style={{ width: size, height: size * 0.85 }}>
      <div className="gauge-title">{METRIC_LABELS[metricType]}</div>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size * 0.7, display: 'block' }}
      />
      <div className="gauge-value" style={{ color: valueColor }}>
        {displayValue} <span className="gauge-unit">{unit}</span>
      </div>
    </div>
  )
}

export default GaugeChart
