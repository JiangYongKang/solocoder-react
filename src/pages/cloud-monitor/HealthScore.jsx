import { useRef, useEffect } from 'react'
import { getHealthColor, getHealthLabel } from './utils'

const HealthScore = ({ score, prevScore }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const size = 140
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)

    const cx = size / 2
    const cy = size / 2
    const r = 56
    const lineWidth = 10

    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.stroke()

    const clampedScore = Math.max(0, Math.min(100, score))
    const angle = (clampedScore / 100) * Math.PI * 2
    const color = getHealthColor(score)

    ctx.beginPath()
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + angle)
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = color
    ctx.lineCap = 'round'
    ctx.stroke()
  }, [score])

  const diff = prevScore !== null && prevScore !== undefined ? score - prevScore : 0
  const diffClass = diff > 0 ? 'up' : diff < 0 ? 'down' : ''
  const diffArrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→'

  return (
    <div className="cm-health-wrap">
      <div className="cm-health-ring">
        <canvas ref={canvasRef} />
        <div className="cm-health-score" style={{ color: getHealthColor(score) }}>
          {score}
        </div>
      </div>
      <div className="cm-health-label" style={{ color: getHealthColor(score) }}>
        {getHealthLabel(score)}
      </div>
      {(prevScore !== null && prevScore !== undefined) && (
        <div className={`cm-health-diff ${diffClass}`}>
          {diffArrow} {Math.abs(diff)}
        </div>
      )}
    </div>
  )
}

export default HealthScore
