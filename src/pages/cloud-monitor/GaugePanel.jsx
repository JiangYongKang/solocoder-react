import { useRef, useEffect } from 'react'
import { METRIC_LABELS } from './constants'
import { getGaugeColor } from './utils'

const GaugePanel = ({ metrics, serverName }) => {
  return (
    <div className="cm-gauges-row">
      <SingleGauge type="cpu" value={metrics.cpu} serverName={serverName} />
      <SingleGauge type="memory" value={metrics.memory} serverName={serverName} />
      <SingleGauge type="disk" value={metrics.disk} serverName={serverName} />
    </div>
  )
}

const SingleGauge = ({ type, value, serverName }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const w = 180
    const h = 110
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const cx = w / 2
    const cy = h - 10
    const r = 70
    const startAngle = Math.PI
    const endAngle = 2 * Math.PI

    ctx.beginPath()
    ctx.arc(cx, cy, r, startAngle, endAngle)
    ctx.lineWidth = 12
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineCap = 'round'
    ctx.stroke()

    const clampedValue = Math.max(0, Math.min(100, value))
    const valueAngle = startAngle + (clampedValue / 100) * Math.PI

    const gradient = ctx.createLinearGradient(cx - r, cy, cx + r, cy)
    gradient.addColorStop(0, '#10b981')
    gradient.addColorStop(0.5, '#f59e0b')
    gradient.addColorStop(1, '#ef4444')

    ctx.beginPath()
    ctx.arc(cx, cy, r, startAngle, valueAngle)
    ctx.lineWidth = 12
    ctx.strokeStyle = gradient
    ctx.lineCap = 'round'
    ctx.stroke()

    const pointerAngle = valueAngle
    const pointerLen = r - 20
    const px = cx + Math.cos(pointerAngle) * pointerLen
    const py = cy + Math.sin(pointerAngle) * pointerLen

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(px, py)
    ctx.lineWidth = 2.5
    ctx.strokeStyle = getGaugeColor(value)
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.fillStyle = getGaugeColor(value)
    ctx.fill()

    for (let i = 0; i <= 10; i++) {
      const tickAngle = startAngle + (i / 10) * Math.PI
      const isMajor = i % 5 === 0
      const innerR = r + (isMajor ? 8 : 10)
      const outerR = r + (isMajor ? 16 : 14)
      const x1 = cx + Math.cos(tickAngle) * innerR
      const y1 = cy + Math.sin(tickAngle) * innerR
      const x2 = cx + Math.cos(tickAngle) * outerR
      const y2 = cy + Math.sin(tickAngle) * outerR
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.lineWidth = isMajor ? 1.5 : 0.8
      ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'
      ctx.stroke()
    }
  }, [value])

  const isAlerting = value >= 80

  return (
    <div className={`cm-gauge-panel${isAlerting ? ' alerting' : ''}`}>
      <div className="cm-gauge-label">{METRIC_LABELS[type]} · {serverName}</div>
      <div className="cm-gauge-canvas-wrap">
        <canvas ref={canvasRef} />
        <div className="cm-gauge-value">{Math.round(value)}%</div>
      </div>
    </div>
  )
}

export default GaugePanel
