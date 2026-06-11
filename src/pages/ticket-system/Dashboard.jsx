import { useMemo } from 'react'
import {
  calculateStatusCounts,
  calculateCategoryCounts,
  getLast7Days,
  buildTrendData,
  calculateAvgResolutionTime,
  calculateSLAComplianceRate,
  formatDuration,
} from './ticketUtils'
import {
  TICKET_STATUSES,
  STATUS_LABELS,
  CATEGORIES,
  CATEGORY_LABELS,
} from './constants'

const STATUS_COLORS = {
  [TICKET_STATUSES.PENDING]: '#f59e0b',
  [TICKET_STATUSES.IN_PROGRESS]: '#3b82f6',
  [TICKET_STATUSES.RESOLVED]: '#22c55e',
  [TICKET_STATUSES.CLOSED]: '#9ca3af',
}

const CATEGORY_COLORS = {
  [CATEGORIES.TECHNICAL]: '#6366f1',
  [CATEGORIES.ACCOUNT]: '#8b5cf6',
  [CATEGORIES.PAYMENT]: '#ec4899',
  [CATEGORIES.PRODUCT]: '#14b8a6',
  [CATEGORIES.COMPLAINT]: '#f97316',
  [CATEGORIES.OTHER]: '#6b7280',
}

const STATUS_ORDER = [
  TICKET_STATUSES.PENDING,
  TICKET_STATUSES.IN_PROGRESS,
  TICKET_STATUSES.RESOLVED,
  TICKET_STATUSES.CLOSED,
]

const CATEGORY_ORDER = [
  CATEGORIES.TECHNICAL,
  CATEGORIES.ACCOUNT,
  CATEGORIES.PAYMENT,
  CATEGORIES.PRODUCT,
  CATEGORIES.COMPLAINT,
  CATEGORIES.OTHER,
]

function DonutChart({ counts, total }) {
  const r = 60
  const cx = 90
  const cy = 90
  const circumference = 2 * Math.PI * r
  const strokeWidth = 24

  const segments = useMemo(() => {
    return STATUS_ORDER.reduce((acc, status) => {
      const count = counts[status] || 0
      const pct = total > 0 ? count / total : 0
      const dash = pct * circumference
      const gap = circumference - dash
      const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0
      acc.push({ status, count, pct, dash, gap, offset: prevOffset })
      return acc
    }, [])
  }, [counts, total, circumference])

  return (
    <div className="ts-chart-container">
      <svg viewBox="0 0 180 180" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {segments.map((seg) =>
          seg.count > 0 ? (
            <circle
              key={seg.status}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={STATUS_COLORS[seg.status]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={-seg.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ) : null
        )}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-h)"
          fontSize="20"
          fontWeight="600"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text)"
          fontSize="11"
        >
          工单总数
        </text>
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center', marginTop: 8 }}>
        {STATUS_ORDER.map((status) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLORS[status], flexShrink: 0 }} />
            <span style={{ color: 'var(--text)' }}>{STATUS_LABELS[status]}</span>
            <span style={{ color: 'var(--text-h)', fontWeight: 600 }}>{counts[status] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChart({ counts }) {
  const maxValue = Math.max(...CATEGORY_ORDER.map((c) => counts[c] || 0), 1)

  const bars = useMemo(() => {
    return CATEGORY_ORDER.map((category) => {
      const count = counts[category] || 0
      return { category, count, height: (count / maxValue) * 100 }
    })
  }, [counts, maxValue])

  return (
    <div className="ts-chart-container">
      <svg viewBox="0 0 360 195" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {bars.map((bar, i) => {
          const barWidth = 28
          const gap = (360 - CATEGORY_ORDER.length * barWidth) / (CATEGORY_ORDER.length + 1)
          const x = gap + i * (barWidth + gap)
          const chartHeight = 130
          const barH = (bar.count / maxValue) * chartHeight
          const y = chartHeight - barH + 10
          return (
            <g key={bar.category}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill={CATEGORY_COLORS[bar.category]}
                rx={3}
                ry={3}
              />
              {bar.count > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fill="var(--text-h)"
                  fontSize="11"
                  fontWeight="600"
                >
                  {bar.count}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 24}
                textAnchor="middle"
                fill="var(--text)"
                fontSize="9"
              >
                {CATEGORY_LABELS[bar.category]}
              </text>
            </g>
          )
        })}
        <line
          x1={0}
          y1={140}
          x2={360}
          y2={140}
          stroke="var(--border)"
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

function TrendChart({ trendData }) {
  const maxValue = Math.max(...trendData.map((d) => d.count), 1)

  const points = useMemo(() => {
    const paddingX = 30
    const paddingTop = 10
    const chartWidth = 240
    const chartHeight = 130
    const stepX = trendData.length > 1 ? chartWidth / (trendData.length - 1) : 0

    return trendData.map((d, i) => ({
      x: paddingX + i * stepX,
      y: paddingTop + chartHeight - (d.count / maxValue) * chartHeight,
      ...d,
    }))
  }, [trendData, maxValue])

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div className="ts-chart-container">
      <svg viewBox="0 0 300 180" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <line x1={30} y1={140} x2={270} y2={140} stroke="var(--border)" strokeWidth="1" />
        <line x1={30} y1={10} x2={30} y2={140} stroke="var(--border)" strokeWidth="1" />
        {points.map((p, i) => {
          const prevCount = i > 0 ? trendData[i - 1].count : 0
          if (i === 0 || p.count !== prevCount) {
            return (
              <text
                key={`label-${i}`}
                x={p.x}
                y={8}
                textAnchor="middle"
                fill="var(--text)"
                fontSize="10"
              >
                {p.count}
              </text>
            )
          }
          return null
        })}
        {points.map((p, i) => (
          <text
            key={`x-${i}`}
            x={p.x}
            y={158}
            textAnchor="middle"
            fill="var(--text)"
            fontSize="10"
          >
            {p.label}
          </text>
        ))}
        {points.length > 1 && (
          <polyline
            points={polyline}
            fill="none"
            stroke="#aa3bff"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#aa3bff"
            stroke="var(--bg)"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  )
}

export default function Dashboard({ tickets, now }) {
  const statusCounts = useMemo(() => calculateStatusCounts(tickets), [tickets])
  const categoryCounts = useMemo(() => calculateCategoryCounts(tickets), [tickets])
  const totalTickets = tickets.length
  const days = useMemo(() => getLast7Days(), [])
  const trendData = useMemo(() => buildTrendData(tickets, days), [tickets, days])
  const avgResolution = useMemo(() => calculateAvgResolutionTime(tickets), [tickets])
  const slaRate = useMemo(() => calculateSLAComplianceRate(tickets, now), [tickets, now])

  return (
    <div className="ts-dashboard-panel">
      <div className="ts-dashboard-title">统计概览</div>

      <div className="ts-dashboard-card">
        <div className="ts-dashboard-card-title">状态分布</div>
        <DonutChart counts={statusCounts} total={totalTickets} />
      </div>

      <div className="ts-dashboard-card">
        <div className="ts-dashboard-card-title">类别分布</div>
        <BarChart counts={categoryCounts} />
      </div>

      <div className="ts-dashboard-card">
        <div className="ts-dashboard-card-title">近7天工单趋势</div>
        <TrendChart trendData={trendData} />
      </div>

      <div className="ts-dashboard-card">
        <div className="ts-dashboard-card-title">关键指标</div>
        <div className="ts-stat-row">
          <span className="ts-stat-label">平均解决时间</span>
          <span className="ts-stat-value">{formatDuration(avgResolution)}</span>
        </div>
        <div className="ts-stat-row">
          <span className="ts-stat-label">SLA达标率</span>
          <span className="ts-stat-value">{slaRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}
