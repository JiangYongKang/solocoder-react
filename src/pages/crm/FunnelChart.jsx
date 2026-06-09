import { CUSTOMER_STATUS_COLOR } from './constants.js'

export default function FunnelChart({ funnelData }) {
  if (!funnelData || !funnelData.stages || funnelData.stages.length === 0) {
    return (
      <div className="empty-state">暂无漏斗数据</div>
    )
  }

  const { stages } = funnelData
  const maxCount = Math.max(...stages.map((s) => s.count), 1)
  const stageHeight = 60
  const gap = 12
  const padding = 40
  const chartWidth = 600
  const chartHeight = stages.length * (stageHeight + gap) + padding * 2

  return (
    <svg
      className="funnel-chart"
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {stages.map((stage, index) => {
        const currentWidth = (stage.count / maxCount) * (chartWidth - padding * 2) * 0.85
        const nextWidth =
          index < stages.length - 1
            ? (stages[index + 1].count / maxCount) * (chartWidth - padding * 2) * 0.85
            : currentWidth * 0.8

        const topLeft = (chartWidth - currentWidth) / 2
        const topRight = (chartWidth + currentWidth) / 2
        const bottomLeft = (chartWidth - nextWidth) / 2
        const bottomRight = (chartWidth + nextWidth) / 2

        const y = padding + index * (stageHeight + gap)

        const path = `
          M ${topLeft} ${y}
          L ${topRight} ${y}
          L ${bottomRight} ${y + stageHeight}
          L ${bottomLeft} ${y + stageHeight}
          Z
        `

        const centerX = chartWidth / 2
        const centerY = y + stageHeight / 2

        return (
          <g key={stage.key}>
            <path
              d={path}
              fill={CUSTOMER_STATUS_COLOR[stage.key] || '#6b7280'}
              opacity={0.85 - index * 0.1}
              rx="4"
            />
            <text
              x={centerX}
              y={centerY - 8}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="16"
              fontWeight="600"
            >
              {stage.label}
            </text>
            <text
              x={centerX}
              y={centerY + 14}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="13"
              opacity="0.9"
            >
              {stage.count} 人 · {stage.overallRate.toFixed(1)}%
            </text>
            {index < stages.length - 1 && (
              <text
                x={chartWidth - 10}
                y={y + stageHeight + gap / 2 + 4}
                textAnchor="end"
                fill="var(--text)"
                fontSize="12"
              >
                转化率 {stage.conversionRate.toFixed(1)}%
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
