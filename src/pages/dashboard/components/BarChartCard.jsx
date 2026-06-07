
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatNumber } from '../utils/dataUtils'

const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#aa3bff']
const SUB_COLORS = ['#aa3bff', '#c084fc', '#6d28d9']

const BarChartCard = ({ id, data, selectedCategory, onCategoryClick }) => {
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

  const handleClick = (entry) => {
    if (!entry) return
    if (selectedCategory) {
      onCategoryClick?.(null)
      return
    }
    if (entry.category && onCategoryClick) {
      onCategoryClick(entry.category)
    }
  }

  const title = selectedCategory
    ? `${selectedCategory} - 指标细分`
    : '各品类销售额对比'

  const hint = selectedCategory
    ? '点击任意柱子返回品类视图'
    : '点击柱子可下钻查看子指标'

  const colors = selectedCategory ? SUB_COLORS : DEFAULT_COLORS

  const isCategory = !selectedCategory

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
        <span className="db-chart-hint">{hint}</span>
      </div>
      <div className="db-chart-body">
        <ResponsiveContainer width="100%" height={280}>
          <RechartsBarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 12, fill: 'var(--text)' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--text)' }}
              tickFormatter={(v) => formatNumber(v, isCategory ? 'currency' : 'number')}
              width={60}
            />
            <Tooltip
              formatter={(v, _name, item) => {
                const entry = item?.payload || {}
                const fmt = entry.metric === 'sales' ? 'currency' : 'number'
                const label = entry.category || ''
                return [formatNumber(v, fmt), label]
              }}
              contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}
              cursor={{ fill: 'rgba(170, 59, 255, 0.08)' }}
            />
            <Bar dataKey="value" onClick={handleClick} cursor="pointer" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default BarChartCard
