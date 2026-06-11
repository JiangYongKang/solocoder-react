import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { generateTrendData, calculateTrendChartLayout } from './currencyUtils.js'
import { TIME_RANGES } from './constants.js'

const ANIMATION_DURATION = 500

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function resampleData(data, targetCount) {
  if (data.length === targetCount) return data
  if (data.length === 0) return []

  const result = []
  const step = (data.length - 1) / (targetCount - 1 || 1)

  for (let i = 0; i < targetCount; i++) {
    const pos = i * step
    const idx = Math.floor(pos)
    const frac = pos - idx
    const nextIdx = Math.min(idx + 1, data.length - 1)

    const curr = data[idx]
    const next = data[nextIdx]

    result.push({
      date: curr.date,
      value: curr.value + (next.value - curr.value) * frac,
    })
  }

  return result
}

function interpolateLayout(fromLayout, toLayout, progress) {
  if (!fromLayout || fromLayout.points.length === 0) return toLayout
  if (progress >= 1) return toLayout

  const p = easeOutCubic(progress)

  const pointCount = toLayout.points.length
  const fromPoints = fromLayout.points.length === pointCount
    ? fromLayout.points
    : resampleData(fromLayout.points, pointCount).map((d, i) => {
        const x = toLayout.points[i]?.x || 0
        return { ...d, x }
      })

  const points = toLayout.points.map((to, i) => {
    const fromPt = fromPoints[i] || to
    return {
      ...to,
      y: fromPt.y + (to.y - fromPt.y) * p,
      value: fromPt.value + (to.value - fromPt.value) * p,
    }
  })

  const pathD = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
    .join(' ')

  const yTicks = toLayout.yTicks.map((to, i) => {
    const fromT = fromLayout.yTicks[i] || to
    const val = fromT.value + (to.value - fromT.value) * p
    return {
      ...to,
      y: fromT.y + (to.y - fromT.y) * p,
      value: val,
      label: val.toFixed(4),
    }
  })

  const gridLines = toLayout.gridLines.map((to, i) => {
    const fromG = fromLayout.gridLines[i] || to
    return {
      ...to,
      y1: fromG.y1 + (to.y1 - fromG.y1) * p,
      y2: fromG.y2 + (to.y2 - fromG.y2) * p,
    }
  })

  const hoverAreas = toLayout.hoverAreas.map((to, i) => ({
    ...to,
    point: points[i] || to.point,
  }))

  return {
    ...toLayout,
    points,
    pathD,
    yTicks,
    gridLines,
    hoverAreas,
  }
}

const TrendChart = ({ baseCode, targetCode }) => {
  const [rangeIdx, setRangeIdx] = useState(0)
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [fromLayout, setFromLayout] = useState(null)
  const [animProgress, setAnimProgress] = useState(1)
  const animRef = useRef(null)
  const startTimeRef = useRef(0)

  const days = TIME_RANGES[rangeIdx].days

  const targetLayout = useMemo(() => {
    const data = generateTrendData(baseCode, targetCode, days)
    return calculateTrendChartLayout(data, { width: 700, height: 300 })
  }, [baseCode, targetCode, days])

  const displayLayout = useMemo(
    () => interpolateLayout(fromLayout, targetLayout, animProgress),
    [fromLayout, targetLayout, animProgress]
  )

  const animate = useCallback(function animateFn(now) {
    const elapsed = now - startTimeRef.current
    const progress = Math.min(elapsed / ANIMATION_DURATION, 1)
    setAnimProgress(progress)

    if (progress < 1) {
      animRef.current = requestAnimationFrame(animateFn)
    } else {
      animRef.current = null
    }
  }, [])

  const startAnimation = useCallback((from) => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
    setFromLayout(from)
    setAnimProgress(0)
    startTimeRef.current = performance.now()
    animRef.current = requestAnimationFrame(animate)
  }, [animate])

  const handleRangeChange = useCallback((idx) => {
    if (idx === rangeIdx) return

    startAnimation(displayLayout)
    setRangeIdx(idx)
    setHoveredIdx(null)
  }, [rangeIdx, displayLayout, startAnimation])

  useEffect(() => {
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current)
      }
    }
  }, [])

  const handleHoverAreaMove = useCallback((e, idx) => {
    setHoveredIdx(idx)
  }, [])

  const handleHoverAreaLeave = useCallback(() => {
    setHoveredIdx(null)
  }, [])

  const hoveredPoint = hoveredIdx !== null && displayLayout.points[hoveredIdx]
    ? displayLayout.points[hoveredIdx]
    : null

  return (
    <div className="cc-trend-wrap">
      <div className="cc-trend-header">
        <h3 className="cc-section-title">汇率走势</h3>
        <div className="cc-range-btns">
          {TIME_RANGES.map((r, i) => (
            <button
              key={r.days}
              className={`cc-range-btn ${i === rangeIdx ? 'active' : ''}`}
              onClick={() => handleRangeChange(i)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="cc-trend-chart-container">
        {displayLayout.points.length === 0 ? (
          <div className="cc-trend-empty">暂无数据</div>
        ) : (
          <svg
            className="cc-trend-chart"
            viewBox={`0 0 ${displayLayout.width} ${displayLayout.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {displayLayout.gridLines.map((g, i) => (
              <line
                key={`grid-${i}`}
                x1={g.x1}
                y1={g.y1}
                x2={g.x2}
                y2={g.y2}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeDasharray="4 4"
              />
            ))}

            {displayLayout.yTicks.map((t, i) => (
              <text
                key={`yt-${i}`}
                x={t.x - 10}
                y={t.y + 4}
                textAnchor="end"
                fontSize="11"
                fill="currentColor"
                fillOpacity="0.6"
              >
                {t.label}
              </text>
            ))}

            {displayLayout.xTicks.map((t, i) => (
              <text
                key={`xt-${i}`}
                x={t.x}
                y={t.y + 22}
                textAnchor="middle"
                fontSize="11"
                fill="currentColor"
                fillOpacity="0.6"
              >
                {t.label}
              </text>
            ))}

            {displayLayout.points.length > 1 && (
              <defs>
                <linearGradient id={`areaGrad-${baseCode}-${targetCode}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>
              </defs>
            )}

            {displayLayout.points.length > 1 && (
              <path
                d={`${displayLayout.pathD} L ${displayLayout.points[displayLayout.points.length - 1].x.toFixed(2)} ${displayLayout.paddingTop + displayLayout.chartHeight} L ${displayLayout.points[0].x.toFixed(2)} ${displayLayout.paddingTop + displayLayout.chartHeight} Z`}
                fill={`url(#areaGrad-${baseCode}-${targetCode})`}
              />
            )}

            <path
              d={displayLayout.pathD}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {hoveredPoint && (
              <>
                <line
                  x1={hoveredPoint.x}
                  y1={displayLayout.paddingTop}
                  x2={hoveredPoint.x}
                  y2={displayLayout.paddingTop + displayLayout.chartHeight}
                  stroke="#3b82f6"
                  strokeOpacity="0.3"
                  strokeDasharray="4 4"
                />
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="5"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                />
              </>
            )}

            {displayLayout.hoverAreas.map((area, i) => (
              <rect
                key={`hover-${i}`}
                x={area.x}
                y={area.y}
                width={area.width}
                height={area.height}
                fill="transparent"
                onMouseMove={(e) => handleHoverAreaMove(e, i)}
                onMouseLeave={handleHoverAreaLeave}
                style={{ cursor: 'crosshair' }}
              />
            ))}
          </svg>
        )}
        {hoveredPoint && (
          <div className="cc-trend-tooltip" style={{ left: `${(hoveredPoint.x / displayLayout.width) * 100}%` }}>
            <span className="cc-tooltip-date">{hoveredPoint.date}</span>
            <span className="cc-tooltip-value">{hoveredPoint.value.toFixed(4)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrendChart
