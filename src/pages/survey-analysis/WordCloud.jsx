import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { CHART_COLORS } from './constants.js'

function rectsOverlap(a, b) {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y)
}

function spiralPlace(word, placed, cx, cy, ctx, maxAttempts) {
  ctx.font = `${word.fontWeight} ${word.fontSize}px sans-serif`
  const metrics = ctx.measureText(word.word)
  const tw = metrics.width + 6
  const th = word.fontSize + 4

  const startX = cx - tw / 2
  const startY = cy - th / 2
  const rect = { x: startX, y: startY, w: tw, h: th }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let overlaps = false
    for (let i = 0; i < placed.length; i++) {
      if (rectsOverlap(rect, placed[i])) {
        overlaps = true
        break
      }
    }
    if (!overlaps) {
      return rect
    }
    const angle = attempt * 0.5
    const radius = 2 + attempt * 1.5
    rect.x = startX + Math.cos(angle) * radius
    rect.y = startY + Math.sin(angle) * radius
  }
  return null
}

const WordCloud = forwardRef(function WordCloud({ data, width = 500, height = 280 }, ref) {
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
    const actualWidth = width
    const actualHeight = height

    canvas.width = actualWidth * dpr
    canvas.height = actualHeight * dpr
    canvas.style.width = `${actualWidth}px`
    canvas.style.height = `${actualHeight}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, actualWidth, actualHeight)

    if (!Array.isArray(data) || data.length === 0) {
      ctx.fillStyle = '#9ca3af'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('暂无数据', actualWidth / 2, actualHeight / 2)
      return
    }

    const maxCount = Math.max(...data.map((d) => d.count))
    const minCount = Math.min(...data.map((d) => d.count))
    const range = Math.max(1, maxCount - minCount)

    const words = data.map((d, idx) => {
      const ratio = range === 0 ? 1 : (d.count - minCount) / range
      const fontSize = 14 + ratio * 28
      return {
        word: d.word,
        count: d.count,
        fontSize: Math.round(fontSize),
        color: CHART_COLORS[idx % CHART_COLORS.length],
        fontWeight: 500 + Math.round(ratio * 400),
      }
    })

    const cx = actualWidth / 2
    const cy = actualHeight / 2
    const placed = []
    const maxAttempts = 500

    ctx.textBaseline = 'top'

    words.forEach((word) => {
      const result = spiralPlace(word, placed, cx, cy, ctx, maxAttempts)
      if (result) {
        ctx.font = `${word.fontWeight} ${word.fontSize}px sans-serif`
        ctx.fillStyle = word.color
        ctx.fillText(word.word, result.x + 3, result.y + 2)
        placed.push(result)
      }
    })
  }, [data, width, height])

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="sa-wordcloud-empty">
        <span>暂无数据</span>
      </div>
    )
  }

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
})

export default WordCloud
