import { useMemo } from 'react'
import { calculateOverallCompletion } from './habitUtils'

export default function OverviewRing({ habits, checkins }) {
  const completion = useMemo(() => calculateOverallCompletion(habits, checkins), [habits, checkins])

  const { rate, completed, target } = completion
  const size = 120
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(rate, 100) / 100) * circumference

  let ringColor = '#9ca3af'
  if (rate > 100) ringColor = '#fbbf24'
  else if (rate >= 80) ringColor = '#10b981'
  else if (rate >= 60) ringColor = '#3b82f6'

  return (
    <div className="overview-ring">
      <svg width={size} height={size}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          fontSize={20}
          fontWeight={700}
          fill="var(--text-h)"
        >
          {Math.round(rate)}%
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          fontSize={10}
          fill="var(--text)"
        >
          本周完成率
        </text>
      </svg>
      <div className="overview-stats">
        <span className="overview-stat">已完成 {completed}/{target}</span>
      </div>
    </div>
  )
}
