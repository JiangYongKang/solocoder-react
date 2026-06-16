import { useMemo } from 'react'
import { formatDuration } from './utils'

function WaterfallChart({ data, onRefresh }) {
  const { phases, totalTime } = data || { phases: [], totalTime: 0 }

  const sortedPhases = useMemo(() => {
    return [...phases].sort((a, b) => a.start - b.start)
  }, [phases])

  const chartWidth = 800
  const rowHeight = 36
  const labelWidth = 140
  const padding = { top: 20, right: 60, bottom: 30, left: labelWidth + 15 }
  const availableWidth = chartWidth - padding.left - padding.right
  const scale = totalTime > 0 ? availableWidth / totalTime : 1
  const chartHeight = sortedPhases.length * rowHeight + padding.top + padding.bottom

  const maxTime = totalTime || 1
  const tickCount = 6
  const ticks = []
  for (let i = 0; i <= tickCount; i++) {
    const t = (i / tickCount) * maxTime
    ticks.push({
      label: `${Math.round(t)}ms`,
      x: padding.left + (t / maxTime) * availableWidth,
    })
  }

  return (
    <div className="waterfall-container">
      <div className="waterfall-header">
        <h3 className="waterfall-title">页面加载耗时瀑布图</h3>
        <button className="btn btn-primary btn-sm" onClick={onRefresh}>
          🔄 重新加载
        </button>
      </div>
      <div className="waterfall-chart" style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          width={chartWidth}
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ display: 'block', margin: '0 auto' }}
        >
          {ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.x}
                y1={padding.top - 8}
                x2={tick.x}
                y2={chartHeight - padding.bottom + 8}
                stroke="#e5e4e7"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <text
                x={tick.x}
                y={chartHeight - padding.bottom + 22}
                fontSize="10"
                fill="#6b6375"
                textAnchor="middle"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {sortedPhases.map((phase, idx) => {
            const y = padding.top + idx * rowHeight + rowHeight / 2
            const x = padding.left + phase.start * scale
            const w = Math.max(2, phase.duration * scale)

            return (
              <g key={phase.key}>
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fontSize="11"
                  fill="#333"
                  textAnchor="end"
                >
                  {phase.name}
                </text>
                <rect
                  x={x}
                  y={y - 10}
                  width={w}
                  height={20}
                  rx={3}
                  fill={phase.color}
                  opacity={0.85}
                  style={{ transition: 'width 0.3s ease, x 0.3s ease' }}
                />
                <text
                  x={x + w + 6}
                  y={y + 4}
                  fontSize="10"
                  fill="#666"
                  textAnchor="start"
                >
                  {phase.duration}ms
                </text>
              </g>
            )
          })}

          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom + 8}
            x2={padding.left + availableWidth}
            y2={chartHeight - padding.bottom + 8}
            stroke="#ccc"
            strokeWidth={2}
          />
        </svg>
      </div>
      <div className="waterfall-footer">
        <div className="waterfall-legend">
          <span className="waterfall-legend-title">图例：</span>
          {sortedPhases.map((p) => (
            <span key={p.key} className="waterfall-legend-item">
              <span
                className="waterfall-legend-color"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
            </span>
          ))}
        </div>
        <div className="waterfall-total-time">
          总加载时间：
          <span className="waterfall-total-value">{totalTime}ms</span>
          <span className="waterfall-total-human">（{formatDuration(totalTime)}）</span>
        </div>
      </div>
    </div>
  )
}

export default WaterfallChart
