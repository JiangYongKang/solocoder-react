import { useEffect, useRef, useState, useCallback } from 'react'
import { calculateFrequency, getMaxFrequency } from './eventDebuggerUtils'

const WINDOW_SECONDS = 30
const KEY_COLOR = '#3498db'
const MOUSE_COLOR = '#e74c3c'
const GRID_COLOR = 'var(--border)'
const TEXT_COLOR = 'var(--text)'

function FrequencyChart({ keyEvents, mouseEvents }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [now, setNow] = useState(() => Date.now())

  const keyFrequencyRef = useRef([])
  const mouseFrequencyRef = useRef([])

  keyFrequencyRef.current = calculateFrequency(keyEvents, WINDOW_SECONDS, now)
  mouseFrequencyRef.current = calculateFrequency(mouseEvents, WINDOW_SECONDS, now)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const keyFrequency = keyFrequencyRef.current
    const mouseFrequency = mouseFrequencyRef.current

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height

    const paddingLeft = 50
    const paddingRight = 20
    const paddingTop = 20
    const paddingBottom = 30

    const chartWidth = width - paddingLeft - paddingRight
    const chartHeight = height - paddingTop - paddingBottom

    ctx.clearRect(0, 0, width, height)

    const maxVal = Math.max(
      getMaxFrequency(keyFrequency),
      getMaxFrequency(mouseFrequency)
    )

    ctx.strokeStyle = GRID_COLOR
    ctx.lineWidth = 1
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = TEXT_COLOR
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    const yTicks = 5
    for (let i = 0; i <= yTicks; i++) {
      const y = paddingTop + (chartHeight * i) / yTicks
      const value = Math.round(maxVal - (maxVal * i) / yTicks)

      ctx.beginPath()
      ctx.moveTo(paddingLeft, y)
      ctx.lineTo(width - paddingRight, y)
      ctx.stroke()

      ctx.fillText(String(value), paddingLeft - 8, y)
    }

    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const xTicks = 6
    for (let i = 0; i <= xTicks; i++) {
      const x = paddingLeft + (chartWidth * i) / xTicks
      const seconds = Math.round((WINDOW_SECONDS * i) / xTicks)
      const label = `-${WINDOW_SECONDS - seconds}s`

      ctx.fillText(label, x, height - paddingBottom + 8)
    }

    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('频率 (次/秒)', paddingLeft, 4)

    const drawLine = (data, color) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()

      const step = chartWidth / (WINDOW_SECONDS - 1)

      for (let i = 0; i < data.length; i++) {
        const x = paddingLeft + i * step
        const y = paddingTop + chartHeight - (data[i] / maxVal) * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()

      ctx.fillStyle = color
      for (let i = 0; i < data.length; i++) {
        const x = paddingLeft + i * step
        const y = paddingTop + chartHeight - (data[i] / maxVal) * chartHeight
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    drawLine(keyFrequency, KEY_COLOR)
    drawLine(mouseFrequency, MOUSE_COLOR)

    const legendY = paddingTop + 8
    const legendX = width - paddingRight - 120

    ctx.fillStyle = KEY_COLOR
    ctx.fillRect(legendX, legendY, 12, 12)
    ctx.fillStyle = TEXT_COLOR
    ctx.fillText('按键事件', legendX + 18, legendY + 1)

    ctx.fillStyle = MOUSE_COLOR
    ctx.fillRect(legendX, legendY + 18, 12, 12)
    ctx.fillStyle = TEXT_COLOR
    ctx.fillText('鼠标事件', legendX + 18, legendY + 19)
  }, [])

  useEffect(() => {
    draw()
  }, [now, keyEvents, mouseEvents, draw])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(() => {
      draw()
    })
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [draw])

  return (
    <div className="ed-panel">
      <div className="ed-panel-header">
        <h3 className="ed-panel-title">触发频率波形图（最近 30 秒）</h3>
      </div>
      <div className="ed-chart-container" ref={containerRef}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  )
}

export default FrequencyChart
