
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatNumber } from '../utils/dataUtils'
import { METRIC_CONFIG } from '../data/mockData'

const METRIC_OPTIONS = [
  { key: 'totalSales', label: '总销售额' },
  { key: 'orderCount', label: '订单数' },
  { key: 'userCount', label: '活跃用户' },
  { key: 'conversionRate', label: '转化率' },
]

const LineChartCard = ({ id, data, selectedCategory, metricKey, onMetricChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const config = METRIC_CONFIG[metricKey] || METRIC_CONFIG.totalSales

  const title = selectedCategory
    ? `${config.label}趋势 - ${selectedCategory}`
    : `${config.label}趋势`

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="db-chart-card"
    >
      <div className="db-chart-header">
        <h3 className="db-chart-title">{title}</h3>
        <select
          className="db-metric-select"
          value={metricKey}
          onChange={(e) => onMetricChange?.(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {METRIC_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="db-chart-body">
        <ResponsiveContainer width="100%" height={280}>
          <RechartsLineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: 'var(--text)' }}
              tickFormatter={(v) => v.slice(5)}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--text)' }}
              tickFormatter={(v) => formatNumber(v, config.format)}
              width={60}
            />
            <Tooltip
              formatter={(v) => [formatNumber(v, config.format), config.label]}
              labelFormatter={(l) => `日期: ${l}`}
              contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#aa3bff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#aa3bff' }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default LineChartCard
