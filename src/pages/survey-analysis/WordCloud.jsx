import { useMemo, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { CHART_COLORS } from './constants.js'

const WordCloud = forwardRef(function WordCloud({ data }, ref) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  const words = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return []
    const maxCount = Math.max(...data.map((d) => d.count))
    const minCount = Math.min(...data.map((d) => d.count))
    const range = Math.max(1, maxCount - minCount)
    return data.map((d, idx) => {
      const ratio = (d.count - minCount) / range
      const fontSize = 14 + ratio * 28
      return {
        word: d.word,
        count: d.count,
        fontSize: Math.round(fontSize),
        color: CHART_COLORS[idx % CHART_COLORS.length],
        weight: 500 + Math.round(ratio * 400),
      }
    })
  }, [data])

  useImperativeHandle(ref, () => ({
    toDataURL: () => {
      const container = containerRef.current
      if (!container) return ''
      const canvas = canvasRef.current || document.createElement('canvas')
      const dpr = window.devicePixelRatio || 1
      const w = container.offsetWidth
      const h = container.offsetHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      const spans = container.querySelectorAll('.sa-word-item')
      const rect = container.getBoundingClientRect()
      spans.forEach((span) => {
        const sr = span.getBoundingClientRect()
        ctx.font = `${span.style.fontWeight} ${span.style.fontSize} sans-serif`
        ctx.fillStyle = span.style.color
        ctx.textBaseline = 'top'
        ctx.fillText(
          span.textContent,
          sr.left - rect.left,
          sr.top - rect.top
        )
      })
      return canvas.toDataURL('image/png')
    },
  }))

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.display = 'none'
    }
  }, [])

  if (words.length === 0) {
    return (
      <div className="sa-wordcloud-empty">
        <span>暂无数据</span>
      </div>
    )
  }

  return (
    <>
      <canvas ref={canvasRef} />
      <div ref={containerRef} className="sa-wordcloud">
        {words.map((w, idx) => (
          <span
            key={idx}
            className="sa-word-item"
            style={{
              fontSize: `${w.fontSize}px`,
              color: w.color,
              fontWeight: w.weight,
            }}
            title={`${w.word}: ${w.count}次`}
          >
            {w.word}
          </span>
        ))}
      </div>
    </>
  )
})

export default WordCloud
