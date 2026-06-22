import { getCoverageLevel, formatPercentage } from './utils'
import { COVERAGE_COLORS, COVERAGE_LABELS } from './constants'

const DonutChart = ({ value, label, size = 120, strokeWidth = 10, onClick }) => {
  const level = getCoverageLevel(value)
  const color = COVERAGE_COLORS[level]
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedValue = Math.max(0, Math.min(100, value))
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference

  return (
    <div
      className="cv-donut-chart"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <svg width={size} height={size} className="cv-donut-svg">
        <circle
          className="cv-donut-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          className="cv-donut-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="cv-donut-text"
          fill={color}
        >
          {formatPercentage(value, 0)}
        </text>
      </svg>
      <div className="cv-donut-label" style={{ color }}>
        {COVERAGE_LABELS[label] || label}
      </div>
    </div>
  )
}

export default DonutChart
