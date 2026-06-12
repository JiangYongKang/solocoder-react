import { useState, useRef, useEffect, useCallback } from 'react'
import { PRESET_EASINGS } from './constants.js'
import { cubicBezierToString, parseCubicBezier } from './cssAnimationCore.js'

const PRESET_BEZIERS = {
  linear: { p1x: 0, p1y: 0, p2x: 1, p2y: 1 },
  ease: { p1x: 0.25, p1y: 0.1, p2x: 0.25, p2y: 1 },
  'ease-in': { p1x: 0.42, p1y: 0, p2x: 1, p2y: 1 },
  'ease-out': { p1x: 0, p1y: 0, p2x: 0.58, p2y: 1 },
  'ease-in-out': { p1x: 0.42, p1y: 0, p2x: 0.58, p2y: 1 },
}

export default function BezierEditor({ initialEasing = 'linear', onClose, onSave }) {
  const canvasRef = useRef(null)
  const [bezier, setBezier] = useState(() => {
    const parsed = parseCubicBezier(initialEasing)
    if (parsed) return parsed
    return PRESET_BEZIERS[initialEasing] || PRESET_BEZIERS.linear
  })
  const [activePreset, setActivePreset] = useState(() => {
    const parsed = parseCubicBezier(initialEasing)
    if (!parsed) {
      return PRESET_BEZIERS[initialEasing] ? initialEasing : 'custom'
    }
    for (const [name, preset] of Object.entries(PRESET_BEZIERS)) {
      if (
        Math.abs(preset.p1x - parsed.p1x) < 0.01 &&
        Math.abs(preset.p1y - parsed.p1y) < 0.01 &&
        Math.abs(preset.p2x - parsed.p2x) < 0.01 &&
        Math.abs(preset.p2y - parsed.p2y) < 0.01
      ) {
        return name
      }
    }
    return 'custom'
  })
  const [dragging, setDragging] = useState(null)

  const drawCurve = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const padding = 40

    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = '#0f3460'
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * (width - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()

      const y = padding + (i / 10) * (height - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(padding, height - padding)
    ctx.lineTo(width - padding, padding)
    ctx.stroke()
    ctx.setLineDash([])

    const p0 = { x: padding, y: height - padding }
    const p1 = {
      x: padding + bezier.p1x * (width - 2 * padding),
      y: height - padding - bezier.p1y * (height - 2 * padding),
    }
    const p2 = {
      x: padding + bezier.p2x * (width - 2 * padding),
      y: height - padding - bezier.p2y * (height - 2 * padding),
    }
    const p3 = { x: width - padding, y: padding }

    ctx.strokeStyle = '#8892b0'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(p0.x, p0.y)
    ctx.lineTo(p1.x, p1.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(p3.x, p3.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()

    ctx.strokeStyle = '#e94560'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(p0.x, p0.y)
    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
    ctx.stroke()

    ctx.fillStyle = '#e94560'
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.arc(p1.x, p1.y, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(p2.x, p2.y, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(p0.x, p0.y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(p3.x, p3.y, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#8892b0'
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * (width - 2 * padding)
      ctx.fillText(`${i * 10}%`, x, height - padding + 20)
    }
  }, [bezier])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      const ctx = canvas.getContext('2d')
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      drawCurve()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [drawCurve])

  useEffect(() => {
    drawCurve()
  }, [drawCurve])

  const getPositionFromEvent = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const width = rect.width
    const height = rect.height
    const padding = 40

    return {
      x: Math.max(0, Math.min(1, (x - padding) / (width - 2 * padding))),
      y: Math.max(-0.5, Math.min(1.5, (height - padding - y) / (height - 2 * padding))),
    }
  }

  const handleMouseDown = (e) => {
    const pos = getPositionFromEvent(e)
    const d1 = Math.sqrt(
      Math.pow(pos.x - bezier.p1x, 2) + Math.pow(pos.y - bezier.p1y, 2)
    )
    const d2 = Math.sqrt(
      Math.pow(pos.x - bezier.p2x, 2) + Math.pow(pos.y - bezier.p2y, 2)
    )

    if (d1 < 0.08) {
      setDragging('p1')
    } else if (d2 < 0.08) {
      setDragging('p2')
    }
  }

  const handleMouseMove = (e) => {
    if (!dragging) return
    const pos = getPositionFromEvent(e)

    if (dragging === 'p1') {
      setBezier((prev) => ({ ...prev, p1x: pos.x, p1y: pos.y }))
    } else if (dragging === 'p2') {
      setBezier((prev) => ({ ...prev, p2x: pos.x, p2y: pos.y }))
    }
    setActivePreset('custom')
  }

  const handleMouseUp = () => {
    setDragging(null)
  }

  const handlePresetClick = (preset) => {
    if (PRESET_BEZIERS[preset]) {
      setBezier(PRESET_BEZIERS[preset])
      setActivePreset(preset)
    }
  }

  const handleSave = () => {
    const easing = cubicBezierToString(bezier.p1x, bezier.p1y, bezier.p2x, bezier.p2y)
    onSave?.(easing)
    onClose?.()
  }

  const currentEasing = activePreset !== 'custom' && PRESET_BEZIERS[activePreset]
    ? activePreset
    : cubicBezierToString(bezier.p1x, bezier.p1y, bezier.p2x, bezier.p2y)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">编辑缓动曲线</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="bezier-editor">
          <div className="bezier-canvas-container">
            <canvas
              ref={canvasRef}
              className="bezier-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <div className="bezier-output">
              transition-timing-function: {currentEasing};
            </div>
          </div>

          <div className="preset-easings">
            {PRESET_EASINGS.map((preset) => (
              <button
                key={preset.value}
                className={`preset-easing-btn ${activePreset === preset.value ? 'active' : ''}`}
                onClick={() => handlePresetClick(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button className="toolbar-btn" onClick={onClose}>
            取消
          </button>
          <button className="toolbar-btn primary" onClick={handleSave}>
            应用
          </button>
        </div>
      </div>
    </div>
  )
}
