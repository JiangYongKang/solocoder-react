import { useMemo, useState } from 'react'
import { calculatePieLayout, getChartColors } from './chartUtils'

const DonutChart = ({ data, valueKey = 'value', width = 300, height = 240, innerRadius = 40, outerRadius = 80 }) => {
  const [hoverIndex, setHoverIndex] = useState(null)

  const layout = useMemo(
    () => calculatePieLayout(data, valueKey, { width, height, innerRadius, outerRadius }),
    [data, valueKey, width, height, innerRadius, outerRadius]
  )

  const colors = useMemo(() => getChartColors(data.length), [data.length])

  if (!data || data.length === 0) return null

  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#6b7280'
  const textHColor = getComputedStyle(document.documentElement).getPropertyValue('--text-h').trim() || '#111827'

  const hoveredItem = hoverIndex !== null ? data[hoverIndex] : null

  return (
    <div>
      <div style={{ position: 'relative', width: '100%', height: height }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          {layout.slices.map((slice, i) => (
            <path
              key={i}
              d={slice.path}
              fill={colors[i % colors.length]}
              opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.4}
              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          ))}
          <text
            x={layout.cx}
            y={layout.cy - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={textHColor}
            fontSize="18"
            fontWeight="600"
          >
            {layout.total}
          </text>
          <text
            x={layout.cx}
            y={layout.cy + 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={textColor}
            fontSize="11"
          >
            总分钟
          </text>
        </svg>

        {hoveredItem && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 8,
              transform: 'translateX(-50%)',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '6px 10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: '13px', color: 'var(--text-h)', fontWeight: 500 }}>
              {hoveredItem.icon} {hoveredItem.name}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text)', marginLeft: 8 }}>
              {hoveredItem[valueKey]} 分钟
            </span>
          </div>
        )}
      </div>
      <div className="pie-legend">
        {data.map((item, index) => (
          <div key={item.key} className="pie-legend-item">
            <span
              className="pie-legend-color"
              style={{ background: colors[index % colors.length] }}
            />
            <span>{item.icon} {item.name}: {item[valueKey]}分钟</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DonutChart
