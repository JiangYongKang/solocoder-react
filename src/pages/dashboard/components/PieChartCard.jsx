
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatNumber } from '../utils/dataUtils'

const CATEGORY_COLORS = ['#aa3bff', '#8884d8', '#82ca9d', '#ffc658', '#ff8042']
const SUB_COLORS = ['#aa3bff', '#c084fc', '#6d28d9']

const PieChartCard = ({ id, data, selectedCategory, onCategoryClick }) => {
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
    if (entry.name && onCategoryClick) {
      onCategoryClick(entry.name)
    }
  }

  const title = selectedCategory
    ? `${selectedCategory} - 指标构成`
    : '品类销售占比'

  const hint = selectedCategory
    ? '点击任意扇区返回品类视图'
    : '点击扇区可下钻查看子指标'

  const colors = selectedCategory ? SUB_COLORS : CATEGORY_COLORS

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
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={90}
              innerRadius={selectedCategory ? 40 : 0}
              dataKey="value"
              onClick={handleClick}
              cursor="pointer"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, _name, item) => {
                const entry = item?.payload || {}
                const fmt = entry.metric === 'sales' ? 'currency' : 'number'
                const label = entry.name || ''
                return [formatNumber(v, fmt), label]
              }}
              contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}
            />
            <Legend
              formatter={(value) => <span style={{ color: 'var(--text)', fontSize: 12 }}>{value}</span>}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default PieChartCard
