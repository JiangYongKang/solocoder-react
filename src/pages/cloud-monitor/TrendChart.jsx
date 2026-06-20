import { useRef, useEffect, useState, useCallback } from 'react'
import { METRIC_COLORS, METRIC_TYPES } from './constants'
import { computeTrendStats } from './utils'

const TrendChart = ({ trendData, visibleMetrics }) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [containerWidth, setContainerWidth] = useState(600)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const w = container.clientWidth
    const h = 260
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const pad = { top: 20, right: 20, bottom: 30, left: 45 }
    const chartW = w - pad.left - pad.right
    const chartH = h - pad.top - pad.bottom

    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (i / 5) * chartH
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(pad.left + chartW, y)
      ctx.stroke()

      ctx.fillStyle = '#64748b'
      ctx.font = '11px system-ui'
      ctx.textAlign = 'right'
      ctx.fillText((100 - i * 20) + '%', pad.left - 8, y + 4)
    }

    if (trendData.length < 2) return

    const timeMin = trendData[0].time
    const timeMax = trendData[trendData.length - 1].time
    const timeRange = Math.max(timeMax - timeMin, 1)

    const xScale = (ts) => pad.left + ((ts - timeMin) / timeRange) * chartW
    const yScale = (v) => pad.top + (1 - v / 100) * chartH

    const timeLabels = 6
    for (let i = 0; i <= timeLabels; i++) {
      const t = timeMin + (i / timeLabels) * timeRange
      const x = xScale(t)
      const d = new Date(t)
      const label = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      ctx.fillStyle = '#64748b'
      ctx.font = '11px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(label, x, h - 8)
    }

    const metrics = [METRIC_TYPES.CPU, METRIC_TYPES.MEMORY, METRIC_TYPES.DISK]
    for (const metric of metrics) {
      if (!visibleMetrics[metric]) continue
      const color = METRIC_COLORS[metric]
      const points = trendData.map((p) => ({ x: xScale(p.time), y: yScale(p[metric]) }))

      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        const cpx = (prev.x + curr.x) / 2
        ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y)
      }
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()

      const fillPoints = [...points, { x: points[points.length - 1].x, y: yScale(0) }, { x: points[0].x, y: yScale(0) }]
      ctx.beginPath()
      ctx.moveTo(fillPoints[0].x, fillPoints[0].y)
      for (let i = 1; i < fillPoints.length - 2; i++) {
        const prev = fillPoints[i - 1]
        const curr = fillPoints[i]
        const cpx = (prev.x + curr.x) / 2
        ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y)
      }
      ctx.lineTo(fillPoints[fillPoints.length - 1].x, fillPoints[fillPoints.length - 1].y)
      ctx.lineTo(fillPoints[fillPoints.length - 2].x, fillPoints[fillPoints.length - 2].y)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH)
      grad.addColorStop(0, color + '30')
      grad.addColorStop(1, color + '05')
      ctx.fillStyle = grad
      ctx.fill()
    }
  }, [trendData, visibleMetrics])

  useEffect(() => {
    draw()
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
      draw()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [draw])

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas || trendData.length < 2) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pad = { left: 45, right: 20 }
    const chartW = rect.width - pad.left - pad.right
    const ratio = (x - pad.left) / chartW
    if (ratio < 0 || ratio > 1) {
      setTooltip(null)
      return
    }
    const timeMin = trendData[0].time
    const timeMax = trendData[trendData.length - 1].time
    const targetTime = timeMin + ratio * (timeMax - timeMin)
    let closest = trendData[0]
    let minDiff = Math.abs(trendData[0].time - targetTime)
    for (const p of trendData) {
      const diff = Math.abs(p.time - targetTime)
      if (diff < minDiff) {
        minDiff = diff
        closest = p
      }
    }
    const d = new Date(closest.time)
    setTooltip({
      x,
      time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`,
      cpu: Math.round(closest.cpu * 10) / 10,
      memory: Math.round(closest.memory * 10) / 10,
      disk: Math.round(closest.disk * 10) / 10,
    })
  }

  const handleMouseLeave = () => setTooltip(null)

  const cpuStats = computeTrendStats(trendData, 'cpu')
  const memStats = computeTrendStats(trendData, 'memory')
  const diskStats = computeTrendStats(trendData, 'disk')

  return (
    <div className="cm-trend-section">
      <div className="cm-trend-stats">
        {visibleMetrics.cpu && (
          <div className="cm-trend-stat-item" style={{ color: METRIC_COLORS.cpu }}>
            CPU: 最大 <span>{cpuStats.max}%</span> / 最小 <span>{cpuStats.min}%</span> / 均值 <span>{cpuStats.avg}%</span>
          </div>
        )}
        {visibleMetrics.memory && (
          <div className="cm-trend-stat-item" style={{ color: METRIC_COLORS.memory }}>
            内存: 最大 <span>{memStats.max}%</span> / 最小 <span>{memStats.min}%</span> / 均值 <span>{memStats.avg}%</span>
          </div>
        )}
        {visibleMetrics.disk && (
          <div className="cm-trend-stat-item" style={{ color: METRIC_COLORS.disk }}>
            磁盘: 最大 <span>{diskStats.max}%</span> / 最小 <span>{diskStats.min}%</span> / 均值 <span>{diskStats.avg}%</span>
          </div>
        )}
      </div>
      <div className="cm-trend-canvas-wrap" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {tooltip && (
          <div className="cm-tooltip" style={{ left: Math.min(tooltip.x, containerWidth - 160), top: 10 }}>
            <div>{tooltip.time}</div>
            {visibleMetrics.cpu && <div style={{ color: METRIC_COLORS.cpu }}>CPU: {tooltip.cpu}%</div>}
            {visibleMetrics.memory && <div style={{ color: METRIC_COLORS.memory }}>内存: {tooltip.memory}%</div>}
            {visibleMetrics.disk && <div style={{ color: METRIC_COLORS.disk }}>磁盘: {tooltip.disk}%</div>}
          </div>
        )}
      </div>
    </div>
  )
}

export default TrendChart
