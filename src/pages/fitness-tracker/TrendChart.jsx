import { useMemo, useState } from 'react'
import { calculateBarLayout, calculateLineLayout } from './chartUtils'

const TrendChart = ({ data, type = 'bar', valueKey = 'calories', width = 600, height = 240 }) => {
  const [hoverIndex, setHoverIndex] = useState(null)

  const layout = useMemo(() => {
    const options = { width, height }
    return type === 'line'
      ? calculateLineLayout(data, valueKey, options)
      : calculateBarLayout(data, valueKey, options)
  }, [data, type, valueKey, width, height])

  if (!data || data.length === 0) return null

  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6366f1'
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e5e7eb'
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#6b7280'

  const hoveredItem = hoverIndex !== null ? data[hoverIndex] : null
  const tooltipStyle = useMemo(() => {
    if (hoverIndex === null) return { display: 'none' }
    if (type === 'bar') {
      const bar = layout.bars[hoverIndex]
      return {
        left: `${bar.x + bar.width / 2}px`,
        top: `${bar.y}px`,
      }
    }
    const point = layout.points[hoverIndex]
    return {
      left: `${point.x}px`,
      top: `${point.y}px`,
    }
  }, [hoverIndex, type, layout])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {layout.gridLines.map((line, i) => (
          <line
            key={`grid-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={borderColor}
            strokeDasharray="3,3"
            strokeWidth="1"
          />
        ))}
        {layout.yTicks.map((t, i) => (
          <g key={`ytick-${i}`}>
            <line
              x1={layout.paddingLeft - 4}
              y1={t.y}
              x2={layout.paddingLeft}
              y2={t.y}
              stroke={textColor}
              strokeWidth="1"
            />
            <text
              x={layout.paddingLeft - 8}
              y={t.y}
              textAnchor="end"
              dominantBaseline="middle"
              fill={textColor}
              fontSize="11"
            >
              {t.label}
            </text>
          </g>
        ))}
        {layout.xTicks.map((t, i) => (
          <g key={`xtick-${i}`}>
            <line
              x1={t.x}
              y1={layout.paddingTop + layout.chartHeight}
              x2={t.x}
              y2={layout.paddingTop + layout.chartHeight + 4}
              stroke={textColor}
              strokeWidth="1"
            />
            <text
              x={t.x}
              y={layout.paddingTop + layout.chartHeight + 18}
              textAnchor="middle"
              fill={textColor}
              fontSize="11"
            >
              {t.label}
            </text>
          </g>
        ))}
        <line
          x1={layout.paddingLeft}
          y1={layout.paddingTop + layout.chartHeight}
          x2={layout.paddingLeft + layout.chartWidth}
          y2={layout.paddingTop + layout.chartHeight}
          stroke={textColor}
          strokeWidth="1"
        />
        <line
          x1={layout.paddingLeft}
          y1={layout.paddingTop}
          x2={layout.paddingLeft}
          y2={layout.paddingTop + layout.chartHeight}
          stroke={textColor}
          strokeWidth="1"
        />

        {type === 'bar' ? (
          layout.bars.map((bar, i) => (
            <g key={`bar-${i}`} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                fill={accentColor}
                rx="3"
                ry="3"
                opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.4}
              />
            </g>
          ))
        ) : (
          <>
            <defs>
              <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={layout.areaD} fill="url(#trendAreaGradient)" />
            <path d={layout.pathD} fill="none" stroke={accentColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {layout.points.map((p, i) => (
              <circle
                key={`dot-${i}`}
                cx={p.x}
                cy={p.y}
                r={hoverIndex === i ? 5 : 3}
                fill={accentColor}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </>
        )}
      </svg>

      {hoveredItem && (
        <div
          style={{
            position: 'absolute',
            transform: 'translate(-50%, -100%)',
            marginTop: -10,
            ...tooltipStyle,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-h)', fontWeight: 500 }}>
            {hoveredItem.date}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '4px' }}>
            消耗热量: {hoveredItem.calories} 千卡
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text)' }}>
            运动时长: {hoveredItem.minutes} 分钟
          </div>
        </div>
      )}
    </div>
  )
}

export default TrendChart
