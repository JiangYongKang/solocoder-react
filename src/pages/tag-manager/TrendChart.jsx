import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { getTopTags, calculateMaxDepth, countRootTags, getTotalResourceCount, drawLineChart, drawBarChart } from './utils.js'
import { TOP_TREND_TAGS } from './constants.js'

export default function TrendChart({ tags, trendData }) {
  const [chartType, setChartType] = useState('line')
  const [showTop, setShowTop] = useState(true)
  const canvasRef = useRef(null)

  const displayTags = useMemo(() => {
    if (showTop) {
      return getTopTags(tags, TOP_TREND_TAGS)
    }
    return tags
  }, [tags, showTop])

  const stats = useMemo(() => {
    return {
      totalTags: tags.length,
      rootTags: countRootTags(tags),
      maxDepth: calculateMaxDepth(tags),
      totalResources: getTotalResourceCount(tags),
    }
  }, [tags])

  const paintChart = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.parentElement.getBoundingClientRect()
    const width = rect.width
    const height = 300
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    if (chartType === 'line') {
      drawLineChart(ctx, width, height, trendData, displayTags)
    } else {
      drawBarChart(ctx, width, height, trendData, displayTags)
    }
  }, [chartType, trendData, displayTags])

  useEffect(() => {
    paintChart()
  }, [paintChart])

  useEffect(() => {
    const handleResize = () => paintChart()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [paintChart])

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

      <div className="chart-legend">
        {displayTags.map((tag) => (
          <span key={tag.id} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: tag.color }} />
            <span className="legend-label">{tag.name}</span>
          </span>
        ))}
      </div>

      <div className="chart-container">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
