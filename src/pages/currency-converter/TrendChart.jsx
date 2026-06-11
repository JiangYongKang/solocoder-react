import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { generateTrendData, calculateTrendChartLayout } from './currencyUtils.js'
import { interpolateLayout } from './chartUtils.js'
import { TIME_RANGES } from './constants.js'

const ANIMATION_DURATION = 500

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
