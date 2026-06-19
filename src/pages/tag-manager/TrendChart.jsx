import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { getTopTags, calculateMaxDepth, countRootTags, getTotalResourceCount } from './utils.js'
import { TOP_TREND_TAGS } from './constants.js'

export default function TrendChart({ tags, trendData }) {
  const [chartType, setChartType] = useState('line')
  const [showTop, setShowTop] = useState(true)

  const displayTags = useMemo(() => {
    if (showTop) {
      return getTopTags(tags, TOP_TREND_TAGS)
    }
    return tags
  }, [tags, showTop])

  const tagIdToName = useMemo(() => {
    const map = {}
    tags.forEach((t) => {
      map[t.id] = t.name
    })
    return map
  }, [tags])

  const stats = useMemo(() => {
    return {
      totalTags: tags.length,
      rootTags: countRootTags(tags),
      maxDepth: calculateMaxDepth(tags),
      totalResources: getTotalResourceCount(tags),
    }
  }, [tags])

  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            formatter={(value, name) => [value, tagIdToName[name] || name]}
          />
          <Legend formatter={(value) => tagIdToName[value] || value} />
          {displayTags.map((tag) => (
            <Line
              key={tag.id}
              type="monotone"
              dataKey={tag.id}
              stroke={tag.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      )
    }
    return (
      <BarChart data={trendData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          formatter={(value, name) => [value, tagIdToName[name] || name]}
        />
        <Legend formatter={(value) => tagIdToName[value] || value} />
        {displayTags.map((tag) => (
          <Bar key={tag.id} dataKey={tag.id} fill={tag.color} />
        ))}
      </BarChart>
    )
  }

  return (
    <div className="trend-chart">
      <div className="trend-header">
        <h3 className="trend-title">标签使用趋势</h3>
        <div className="trend-controls">
          <div className="chart-type-toggle">
            <button
              className={`toggle-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => setChartType('line')}
            >
              折线图
            </button>
            <button
              className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
              onClick={() => setChartType('bar')}
            >
              柱状图
            </button>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showTop}
              onChange={(e) => setShowTop(e.target.checked)}
            />
            仅显示前 {TOP_TREND_TAGS} 个
          </label>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.totalTags}</div>
          <div className="stat-label">标签总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.rootTags}</div>
          <div className="stat-label">根标签数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.maxDepth}</div>
          <div className="stat-label">最大层级</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalResources}</div>
          <div className="stat-label">总资源数</div>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
