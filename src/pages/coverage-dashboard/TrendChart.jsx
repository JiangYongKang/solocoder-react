import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { calculateTrendChange, getTrendDirection, formatPercentage } from './utils'
import { COVERAGE_COLORS } from './constants'

const TrendChart = ({ trendData }) => {
  const statementsChange = calculateTrendChange(trendData, 'statements')
  const linesChange = calculateTrendChange(trendData, 'lines')
  const statementsDirection = getTrendDirection(trendData, 'statements')
  const linesDirection = getTrendDirection(trendData, 'lines')

  const getDirectionIcon = (direction) => {
    if (direction === 'up') return '↑'
    if (direction === 'down') return '↓'
    return '→'
  }

  const getDirectionColor = (direction) => {
    if (direction === 'up') return '#10b981'
    if (direction === 'down') return '#ef4444'
    return '#6b7280'
  }

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="cv-tooltip">
          <div className="cv-tooltip-date">{label}</div>
          {payload.map((entry) => (
            <div key={entry.dataKey} className="cv-tooltip-item">
              <span
                className="cv-tooltip-dot"
                style={{ backgroundColor: entry.color }}
              />
              <span className="cv-tooltip-label">
                {entry.dataKey === 'statements' ? '语句覆盖率' : '行覆盖率'}
              </span>
              <span className="cv-tooltip-value">
                {formatPercentage(entry.value, 1)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="cv-trend-chart">
      <div className="cv-trend-header">
        <h3 className="cv-trend-title">覆盖率历史趋势</h3>
        <div className="cv-trend-summary">
          <div className="cv-trend-stat">
            <span className="cv-trend-stat-label">语句覆盖率趋势</span>
            <span
              className="cv-trend-stat-value"
              style={{ color: getDirectionColor(statementsDirection) }}
            >
              {getDirectionIcon(statementsDirection)} {statementsChange.change >= 0 ? '+' : ''}
              {statementsChange.change.toFixed(1)}%
            </span>
          </div>
          <div className="cv-trend-stat">
            <span className="cv-trend-stat-label">行覆盖率趋势</span>
            <span
              className="cv-trend-stat-value"
              style={{ color: getDirectionColor(linesDirection) }}
            >
              {getDirectionIcon(linesDirection)} {linesChange.change >= 0 ? '+' : ''}
              {linesChange.change.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="cv-trend-chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
              width={50}
            />
            <Tooltip content={customTooltip} />
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => (
                <span style={{ color: '#374151', fontSize: 12 }}>
                  {value === 'statements' ? '语句覆盖率' : '行覆盖率'}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="statements"
              stroke={COVERAGE_COLORS.high}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              name="statements"
            />
            <Line
              type="monotone"
              dataKey="lines"
              stroke={COVERAGE_COLORS.medium}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              name="lines"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TrendChart
