import { useState, useMemo } from 'react'
import { generateTrendData, calculateTrendChartLayout } from './currencyUtils.js'
import { TIME_RANGES } from './constants.js'

const TrendChart = ({ baseCode, targetCode }) => {
  const [rangeIdx, setRangeIdx] = useState(0)
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const days = TIME_RANGES[rangeIdx].days

  const trendData = useMemo(
    () => generateTrendData(baseCode, targetCode, days),
    [baseCode, targetCode, days]
  )

  const layout = useMemo(
    () => calculateTrendChartLayout(trendData, { width: 700, height: 300 }),
    [trendData]
  )

  const handleHoverAreaMove = (e, idx) => {
    setHoveredIdx(idx)
  }

  const handleHoverAreaLeave = () => {
    setHoveredIdx(null)
  }

  const hoveredPoint = hoveredIdx !== null && layout.points[hoveredIdx]
    ? layout.points[hoveredIdx]
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
              onClick={() => {
                setRangeIdx(i)
                setHoveredIdx(null)
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="cc-trend-chart-container">
        {trendData.length === 0 ? (
          <div className="cc-trend-empty">暂无数据</div>
        ) : (
          <svg
            className="cc-trend-chart"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {layout.gridLines.map((g, i) => (
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

            {layout.yTicks.map((t, i) => (
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

            {layout.xTicks.map((t, i) => (
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

            {layout.points.length > 1 && (
              <defs>
                <linearGradient id={`areaGrad-${baseCode}-${targetCode}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>
              </defs>
            )}

            {layout.points.length > 1 && (
              <path
                d={`${layout.pathD} L ${layout.points[layout.points.length - 1].x.toFixed(2)} ${layout.paddingTop + layout.chartHeight} L ${layout.points[0].x.toFixed(2)} ${layout.paddingTop + layout.chartHeight} Z`}
                fill={`url(#areaGrad-${baseCode}-${targetCode})`}
              />
            )}

            <path
              d={layout.pathD}
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
                  y1={layout.paddingTop}
                  x2={hoveredPoint.x}
                  y2={layout.paddingTop + layout.chartHeight}
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

            {layout.hoverAreas.map((area, i) => (
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
          <div className="cc-trend-tooltip" style={{ left: `${(hoveredPoint.x / layout.width) * 100}%` }}>
            <span className="cc-tooltip-date">{hoveredPoint.date}</span>
            <span className="cc-tooltip-value">{hoveredPoint.value.toFixed(4)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrendChart
