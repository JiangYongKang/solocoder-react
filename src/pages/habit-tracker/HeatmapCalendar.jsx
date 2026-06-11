import { useState, useMemo } from 'react'
import { HEATMAP_CELL_SIZE, HEATMAP_GAP, HEATMAP_DAY_LABELS } from './constants'
import { buildHeatmapGrid, getHeatmapColor, parseDate } from './habitUtils'

const CELL = HEATMAP_CELL_SIZE
const GAP = HEATMAP_GAP
const STEP = CELL + GAP
const LABEL_WIDTH = 28
const MONTH_LABEL_HEIGHT = 18

export default function HeatmapCalendar({ checkins, habitId, yearOffset, onYearChange }) {
  const [tooltip, setTooltip] = useState(null)

  const weeks = useMemo(
    () => buildHeatmapGrid(checkins, habitId, yearOffset),
    [checkins, habitId, yearOffset]
  )

  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = -1
    weeks.forEach((week, weekIdx) => {
      const firstDay = week.find(d => d.inRange)
      if (firstDay) {
        const d = parseDate(firstDay.date)
        const m = d.getMonth()
        if (m !== lastMonth) {
          labels.push({ month: m, weekIdx })
          lastMonth = m
        }
      }
    })
    return labels
  }, [weeks])

  const svgWidth = LABEL_WIDTH + weeks.length * STEP + 4
  const svgHeight = MONTH_LABEL_HEIGHT + 7 * STEP

  const handleMouseEnter = (cell, e) => {
    if (!cell.inRange) return
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      date: cell.date,
      count: cell.count,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    })
  }

  const handleMouseLeave = () => {
    setTooltip(null)
  }

  const yearLabel = useMemo(() => {
    if (weeks.length === 0) return ''
    const first = weeks[0].find(d => d.inRange)
    const last = weeks[weeks.length - 1].find(d => d.inRange)
    if (!first || !last) return ''
    return `${first.date.slice(0, 4)}年`
  }, [weeks])

  return (
    <div className="heatmap-container">
      <div className="heatmap-nav">
        <button
          className="heatmap-nav-btn"
          onClick={() => onYearChange(yearOffset + 1)}
          disabled={yearOffset >= 5}
        >
          ←
        </button>
        <span className="heatmap-year">
          {yearOffset === 0 ? '最近一年' : `${yearLabel} (${yearOffset}年前)`}
        </span>
        <button
          className="heatmap-nav-btn"
          onClick={() => onYearChange(Math.max(0, yearOffset - 1))}
          disabled={yearOffset <= 0}
        >
          →
        </button>
      </div>
      <div className="heatmap-scroll">
        <svg width={svgWidth} height={svgHeight}>
          {HEATMAP_DAY_LABELS.map((label, i) => (
            label && (
              <text
                key={i}
                x={LABEL_WIDTH - 4}
                y={MONTH_LABEL_HEIGHT + i * STEP + CELL * 0.8}
                textAnchor="end"
                fontSize={9}
                fill="var(--text)"
              >
                {label}
              </text>
            )
          ))}
          {monthLabels.map(({ month, weekIdx }) => (
            <text
              key={`${month}-${weekIdx}`}
              x={LABEL_WIDTH + weekIdx * STEP}
              y={10}
              fontSize={9}
              fill="var(--text)"
            >
              {month + 1}月
            </text>
          ))}
          {weeks.map((week, weekIdx) =>
            week.map((cell, dayIdx) => {
              if (!cell.inRange) return null
              const x = LABEL_WIDTH + weekIdx * STEP
              const y = MONTH_LABEL_HEIGHT + dayIdx * STEP
              return (
                <rect
                  key={cell.date}
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={getHeatmapColor(cell.count)}
                  stroke={cell.isToday ? '#f59e0b' : 'none'}
                  strokeWidth={cell.isToday ? 2 : 0}
                  onMouseEnter={(e) => handleMouseEnter(cell, e)}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: 'pointer' }}
                />
              )
            })
          )}
        </svg>
      </div>
      {tooltip && (
        <div
          className="heatmap-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="heatmap-tooltip-date">{tooltip.date}</div>
          <div className="heatmap-tooltip-count">
            {tooltip.count > 0 ? `打卡 ${tooltip.count} 次` : '未打卡'}
          </div>
        </div>
      )}
    </div>
  )
}
