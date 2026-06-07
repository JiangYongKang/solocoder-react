import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { formatCurrency } from './utils'

const PIE_COLORS = ['#aa3bff', '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28']

const StatsPanel = ({ trendData, pieData }) => {
  return (
    <div className="charts-grid">
      <div className="chart-card">
        <h3 className="chart-title">近 6 个月收支趋势</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text)' }} />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--text)' }}
              tickFormatter={(v) => formatCurrency(v)}
              width={70}
            />
            <Tooltip
              formatter={(v) => formatCurrency(v)}
              contentStyle={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: 'var(--text)', fontSize: 12 }}>{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="income"
              name="收入"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="支出"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">当月支出分类占比</h3>
        {pieData.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            当月暂无支出记录
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: 'var(--text)', fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default StatsPanel
