import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '8px 12px',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ fontSize: '13px', color: 'var(--text-h)', fontWeight: 500 }}>{d.label}</div>
        <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '4px' }}>
          完成 {d.count} 个番茄 · {d.minutes} 分钟
        </div>
      </div>
    )
  }
  return null
}

const StatsChart = ({ data, chartType = 'bar' }) => {
  const formattedData = data.map((d) => ({
    ...d,
    番茄数: d.count,
  }))

  const hasData = formattedData.some((d) => d.count > 0)

  if (!hasData) {
    return <div className="empty-state">暂无数据，完成第一个番茄后将显示统计</div>
  }

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'line' ? (
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              stroke="var(--text)"
              fontSize={12}
              tick={{ fill: 'var(--text)' }}
            />
            <YAxis
              stroke="var(--text)"
              fontSize={12}
              tick={{ fill: 'var(--text)' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="番茄数"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ fill: 'var(--accent)', r: 4 }}
              activeDot={{ r: 6, fill: 'var(--accent)' }}
            />
          </LineChart>
        ) : (
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              stroke="var(--text)"
              fontSize={12}
              tick={{ fill: 'var(--text)' }}
            />
            <YAxis
              stroke="var(--text)"
              fontSize={12}
              tick={{ fill: 'var(--text)' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="番茄数" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export default StatsChart
