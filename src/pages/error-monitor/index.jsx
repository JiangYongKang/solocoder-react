import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ERROR_TYPE_COLORS,
  ERROR_TYPE_LIST,
  TIME_RANGE_OPTIONS,
  SORT_OPTIONS,
  PAGE_SIZE,
} from './constants.js'
import { generateMockErrors, generateDailySummaries } from './mockData.js'
import {
  getTimeRange,
  filterErrorsByTimeRange,
  filterErrorsByResolved,
  filterErrorsByType,
  sortErrors,
  paginateErrors,
  getSummaryStats,
  getErrorTypeDistribution,
  getTrendData,
  markErrorResolved,
  markAllResolved,
  formatNumber,
  getTodayCount,
} from './utils.js'
import { drawLineChart, drawPieChart } from './chartUtils.js'
import './error-monitor.css'

const ErrorMonitor = () => {
  const navigate = useNavigate()

  const [allErrors, setAllErrors] = useState(() => generateMockErrors(200, 30))

  const [timeRangeKey, setTimeRangeKey] = useState('7d')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [chartIncludeResolved, setChartIncludeResolved] = useState(false)
  const [sortKey, setSortKey] = useState('time-desc')
  const [selectedTypes, setSelectedTypes] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedErrorId, setSelectedErrorId] = useState(null)
  const [expandedStackLevels, setExpandedStackLevels] = useState({})
  const [highlightedStackLevel, setHighlightedStackLevel] = useState(null)
  const [lineHoverIndex, setLineHoverIndex] = useState(-1)
  const [pieHoverIndex, setPieHoverIndex] = useState(-1)
  const [expandedDays, setExpandedDays] = useState({})

  const lineChartRef = useRef(null)
  const pieChartRef = useRef(null)

  const timeRange = useMemo(() => {
    let customStart = null
    let customEnd = null
    if (timeRangeKey === 'custom' && customStartDate && customEndDate) {
      customStart = new Date(customStartDate).setHours(0, 0, 0, 0)
      customEnd = new Date(customEndDate).setHours(23, 59, 59, 999)
    }
    return getTimeRange(timeRangeKey, customStart, customEnd)
  }, [timeRangeKey, customStartDate, customEndDate])

  const filteredErrors = useMemo(() => {
    let result = filterErrorsByTimeRange(allErrors, timeRange.startTime, timeRange.endTime)
    result = filterErrorsByResolved(result, showResolved)
    if (selectedTypes.length > 0) {
      result = filterErrorsByType(result, selectedTypes)
    }
    result = sortErrors(result, sortKey)
    return result
  }, [allErrors, timeRange, showResolved, selectedTypes, sortKey])

  const paginatedData = useMemo(() => {
    return paginateErrors(filteredErrors, currentPage, PAGE_SIZE)
  }, [filteredErrors, currentPage])

  const summaryStats = useMemo(() => {
    return getSummaryStats(filteredErrors)
  }, [filteredErrors])

  const pieData = useMemo(() => {
    const dataForChart = chartIncludeResolved
      ? filteredErrors
      : filterErrorsByResolved(filteredErrors, false)
    return getErrorTypeDistribution(dataForChart)
  }, [filteredErrors, chartIncludeResolved])

  const trendData = useMemo(() => {
    const dataForChart = chartIncludeResolved
      ? filteredErrors
      : filterErrorsByResolved(filteredErrors, false)
    return getTrendData(dataForChart, timeRangeKey, timeRange.startTime, timeRange.endTime)
  }, [filteredErrors, chartIncludeResolved, timeRangeKey, timeRange])

  const dailySummaries = useMemo(() => {
    return generateDailySummaries(allErrors, 30)
  }, [allErrors])

  const activeFilterTags = useMemo(() => {
    const tags = []
    const rangeOption = TIME_RANGE_OPTIONS.find((o) => o.key === timeRangeKey)
    if (rangeOption) {
      tags.push({ type: 'timeRange', label: rangeOption.label, key: timeRangeKey })
    }
    if (timeRangeKey === 'custom' && customStartDate && customEndDate) {
      tags.push({ type: 'customRange', label: `${customStartDate} 至 ${customEndDate}`, key: 'custom' })
    }
    selectedTypes.forEach((type) => {
      tags.push({ type: 'errorType', label: type, key: type })
    })
    if (showResolved) {
      tags.push({ type: 'resolved', label: '包含已解决', key: 'resolved' })
    }
    return tags
  }, [timeRangeKey, customStartDate, customEndDate, selectedTypes, showResolved])

  useEffect(() => {
    const canvas = lineChartRef.current
    if (!canvas || trendData.length === 0) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    drawLineChart(ctx, trendData, ERROR_TYPE_LIST, ERROR_TYPE_COLORS, {
      width: rect.width,
      height: rect.height,
      hoverIndex: lineHoverIndex,
    })
  }, [trendData, lineHoverIndex])

  useEffect(() => {
    const canvas = pieChartRef.current
    if (!canvas || pieData.length === 0) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    drawPieChart(ctx, pieData, {
      width: rect.width,
      height: rect.height,
      hoverIndex: pieHoverIndex,
    })
  }, [pieData, pieHoverIndex])

  const handleTimeRangeChange = (key) => {
    setTimeRangeKey(key)
    setCurrentPage(1)
  }

  const handleTypeToggle = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
    setCurrentPage(1)
  }

  const handleSortChange = (key) => {
    setSortKey(key)
    setCurrentPage(1)
  }

  const handleShowResolvedChange = (checked) => {
    setShowResolved(checked)
    setCurrentPage(1)
  }

  const handleRemoveTag = (tag) => {
    if (tag.type === 'timeRange' || tag.type === 'customRange') {
      setTimeRangeKey('7d')
      setCustomStartDate('')
      setCustomEndDate('')
    } else if (tag.type === 'errorType') {
      setSelectedTypes((prev) => prev.filter((t) => t !== tag.key))
    } else if (tag.type === 'resolved') {
      setShowResolved(false)
    }
    setCurrentPage(1)
  }

  const handleRowClick = (errorId) => {
    setSelectedErrorId((prev) => (prev === errorId ? null : errorId))
    setExpandedStackLevels({})
    setHighlightedStackLevel(null)
  }

  const toggleStackLevel = (level) => {
    setExpandedStackLevels((prev) => ({
      ...prev,
      [level]: !prev[level],
    }))
  }

  const handleMarkResolved = (errorId) => {
    setAllErrors((prev) => markErrorResolved(prev, errorId, true))
  }

  const handleMarkUnresolved = (errorId) => {
    setAllErrors((prev) => markErrorResolved(prev, errorId, false))
  }

  const handleMarkAllResolved = () => {
    setAllErrors((prev) => markAllResolved(prev))
  }

  const handleLineChartMouseMove = (e) => {
    const canvas = lineChartRef.current
    if (!canvas || trendData.length === 0) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const paddingLeft = 50
    const paddingRight = 20
    const chartWidth = rect.width - paddingLeft - paddingRight

    if (x < paddingLeft || x > rect.width - paddingRight) {
      setLineHoverIndex(-1)
      return
    }

    const xStep = trendData.length > 1 ? chartWidth / (trendData.length - 1) : chartWidth
    const index = Math.round((x - paddingLeft) / xStep)
    setLineHoverIndex(Math.max(0, Math.min(trendData.length - 1, index)))
  }

  const handlePieChartMouseMove = (e) => {
    const canvas = pieChartRef.current
    if (!canvas || pieData.length === 0) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const cx = rect.width / 2
    const cy = rect.height / 2 - 10
    const outerRadius = 100
    const innerRadius = 60

    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < innerRadius || dist > outerRadius + 10) {
      setPieHoverIndex(-1)
      return
    }

    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    angle = (angle + 360) % 360

    const total = pieData.reduce((sum, d) => sum + (d.value || 0), 0)
    if (total === 0) {
      setPieHoverIndex(-1)
      return
    }

    const paddingAngle = 2
    const availableAngle = 360 - paddingAngle * pieData.length
    let currentAngle = 0

    let foundIndex = -1
    pieData.forEach((d, i) => {
      if (foundIndex >= 0) return
      const sliceAngle = ((d.value || 0) / total) * availableAngle
      const startAngle = currentAngle - 90
      const endAngle = currentAngle + sliceAngle - 90

      let normalizedAngle = angle
      if (normalizedAngle > 270) normalizedAngle -= 360

      if (normalizedAngle >= startAngle && normalizedAngle <= endAngle) {
        foundIndex = i
      }
      currentAngle += sliceAngle + paddingAngle
    })

    setPieHoverIndex(foundIndex)
  }

  const toggleDayExpand = (date) => {
    setExpandedDays((prev) => ({
      ...prev,
      [date]: !prev[date],
    }))
  }

  const todayCount = useMemo(() => getTodayCount(allErrors), [allErrors])

  return (
    <div className="em-page">
      <div className="em-header">
        <button className="em-back-btn" onClick={() => navigate('/')} aria-label="返回首页">
          ← 返回首页
        </button>
        <h1 className="em-title">错误监控面板</h1>
      </div>

      <div className="em-summary-cards">
        <div className="em-summary-card">
          <div className="em-summary-label">总错误数</div>
          <div className="em-summary-value">{formatNumber(summaryStats.total)}</div>
          <div className="em-summary-sub">当前筛选范围内</div>
        </div>
        <div className="em-summary-card em-summary-card--warning">
          <div className="em-summary-label">今日新增</div>
          <div className="em-summary-value">{formatNumber(todayCount)}</div>
          <div className="em-summary-sub">24 小时内</div>
        </div>
        <div className="em-summary-card em-summary-card--danger">
          <div className="em-summary-label">未解决</div>
          <div className="em-summary-value">{formatNumber(summaryStats.unresolved)}</div>
          <div className="em-summary-sub">待处理错误</div>
        </div>
      </div>

      <div className="em-filter-bar">
        <div className="em-filter-section">
          <span className="em-filter-label">时间范围：</span>
          <div className="em-time-options">
            {TIME_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                className={`em-time-btn ${timeRangeKey === opt.key ? 'active' : ''}`}
                onClick={() => handleTimeRangeChange(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {timeRangeKey === 'custom' && (
          <div className="em-filter-section">
            <label>
              开始：
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </label>
            <label>
              结束：
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </label>
          </div>
        )}

        <div className="em-filter-section">
          <span className="em-filter-label">排序：</span>
          <select
            value={sortKey}
            onChange={(e) => handleSortChange(e.target.value)}
            className="em-select"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="em-filter-section">
          <label className="em-toggle-label">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => handleShowResolvedChange(e.target.checked)}
            />
            显示已解决
          </label>
        </div>

        <div className="em-filter-section">
          <button
            className="em-bulk-btn"
            onClick={handleMarkAllResolved}
            disabled={filteredErrors.filter((e) => !e.resolved).length === 0}
          >
            全部标记已解决
          </button>
        </div>
      </div>

      <div className="em-type-filter">
        <span className="em-filter-label">错误类型：</span>
        {ERROR_TYPE_LIST.map((type) => (
          <button
            key={type}
            className={`em-type-tag ${selectedTypes.includes(type) ? 'active' : ''}`}
            style={{ borderColor: ERROR_TYPE_COLORS[type], color: ERROR_TYPE_COLORS[type] }}
            onClick={() => handleTypeToggle(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {activeFilterTags.length > 0 && (
        <div className="em-filter-tags">
          {activeFilterTags.map((tag, i) => (
            <span key={`${tag.key}-${i}`} className="em-filter-tag">
              {tag.label}
              <button onClick={() => handleRemoveTag(tag)} aria-label="移除筛选">×</button>
            </span>
          ))}
        </div>
      )}

      <div className="em-charts-row">
        <div className="em-chart-card em-chart-card--line">
          <div className="em-chart-header">
            <h3 className="em-chart-title">错误趋势</h3>
            <label className="em-chart-toggle">
              <input
                type="checkbox"
                checked={chartIncludeResolved}
                onChange={(e) => setChartIncludeResolved(e.target.checked)}
              />
              含已解决
            </label>
          </div>
          <div className="em-chart-body">
            <canvas
              ref={lineChartRef}
              className="em-canvas"
              onMouseMove={handleLineChartMouseMove}
              onMouseLeave={() => setLineHoverIndex(-1)}
            />
            {lineHoverIndex >= 0 && trendData[lineHoverIndex] && (
              <div className="em-chart-tooltip">
                <div className="em-tooltip-time">{trendData[lineHoverIndex].label}</div>
                {ERROR_TYPE_LIST.map((type) => (
                  <div key={type} className="em-tooltip-item">
                    <span
                      className="em-tooltip-dot"
                      style={{ backgroundColor: ERROR_TYPE_COLORS[type] }}
                    />
                    <span className="em-tooltip-label">{type}：</span>
                    <span className="em-tooltip-value">
                      {trendData[lineHoverIndex].types[type] || 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="em-chart-card em-chart-card--pie">
          <div className="em-chart-header">
            <h3 className="em-chart-title">错误类型分布</h3>
          </div>
          <div className="em-chart-body">
            <canvas
              ref={pieChartRef}
              className="em-canvas"
              onMouseMove={handlePieChartMouseMove}
              onMouseLeave={() => setPieHoverIndex(-1)}
            />
            {pieHoverIndex >= 0 && pieData[pieHoverIndex] && (
              <div className="em-chart-tooltip em-pie-tooltip">
                <div className="em-tooltip-item">
                  <span
                    className="em-tooltip-dot"
                    style={{ backgroundColor: pieData[pieHoverIndex].color }}
                  />
                  <span className="em-tooltip-label">{pieData[pieHoverIndex].name}：</span>
                  <span className="em-tooltip-value">{pieData[pieHoverIndex].value}</span>
                </div>
                <div className="em-tooltip-percent">
                  占比：{pieData[pieHoverIndex].value > 0
                    ? ((pieData[pieHoverIndex].value / pieData.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="em-main-content">
        <div className="em-error-list">
          <div className="em-list-header">
            <h3 className="em-list-title">错误列表</h3>
            <span className="em-list-count">共 {filteredErrors.length} 条</span>
          </div>

          <table className="em-table">
            <thead>
              <tr>
                <th style={{ width: 120 }}>错误类型</th>
                <th>错误消息</th>
                <th style={{ width: 180 }}>发生时间</th>
                <th style={{ width: 100 }}>发生次数</th>
                <th style={{ width: 120 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.data.map((err) => (
                <>
                  <tr
                    key={err.id}
                    className={`em-table-row ${err.resolved ? 'resolved' : ''} ${selectedErrorId === err.id ? 'selected' : ''}`}
                    onClick={() => handleRowClick(err.id)}
                  >
                    <td>
                      <span
                        className="em-type-badge"
                        style={{ backgroundColor: ERROR_TYPE_COLORS[err.type] + '20', color: ERROR_TYPE_COLORS[err.type] }}
                      >
                        {err.type}
                      </span>
                    </td>
                    <td>
                      <div className="em-error-message">{err.message}</div>
                    </td>
                    <td>{err.occurredAtFormatted}</td>
                    <td>
                      <span className="em-count-badge">{err.count} 次</span>
                    </td>
                    <td>
                      <button
                        className="em-resolve-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          err.resolved ? handleMarkUnresolved(err.id) : handleMarkResolved(err.id)
                        }}
                      >
                        {err.resolved ? '取消解决' : '标记已解决'}
                      </button>
                    </td>
                  </tr>
                  {selectedErrorId === err.id && err.callStack && (
                    <tr className="em-detail-row">
                      <td colSpan={5}>
                        <div className="em-error-detail">
                          <div className="em-detail-section">
                            <h4>错误详情</h4>
                            <p className="em-detail-message">{err.message}</p>
                            <div className="em-detail-meta">
                              <span>类型：{err.type}</span>
                              <span>发生时间：{err.occurredAtFormatted}</span>
                              <span>发生次数：{err.count} 次</span>
                              <span>状态：{err.resolved ? '已解决' : '未解决'}</span>
                            </div>
                          </div>

                          <div className="em-detail-section">
                            <h4>调用栈</h4>
                            <div className="em-call-stack">
                              {err.callStack.map((frame, idx) => (
                                <div
                                  key={idx}
                                  className={`em-stack-frame ${highlightedStackLevel === idx ? 'highlighted' : ''}`}
                                  onClick={() => setHighlightedStackLevel(idx === highlightedStackLevel ? null : idx)}
                                >
                                  <div className="em-stack-header">
                                    <span className="em-stack-function">{frame.function}</span>
                                    <span className="em-stack-file">
                                      {frame.file}:{frame.line}:{frame.column}
                                    </span>
                                  </div>
                                  {expandedStackLevels[idx] && (
                                    <div className="em-stack-details">
                                      <p>文件路径：/src/{frame.file}</p>
                                      <p>行号：{frame.line}，列号：{frame.column}</p>
                                    </div>
                                  )}
                                  <button
                                    className="em-stack-toggle"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleStackLevel(idx)
                                    }}
                                  >
                                    {expandedStackLevels[idx] ? '收起' : '展开'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="em-detail-actions">
                            <button
                              className="em-primary-btn"
                              onClick={() => {
                                err.resolved ? handleMarkUnresolved(err.id) : handleMarkResolved(err.id)
                              }}
                            >
                              {err.resolved ? '取消解决' : '标记已解决'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {paginatedData.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="em-empty-cell">
                    暂无错误数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {paginatedData.totalPages > 1 && (
            <div className="em-pagination">
              <button
                className="em-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </button>
              <span className="em-page-info">
                {currentPage} / {paginatedData.totalPages}
              </span>
              <button
                className="em-page-btn"
                disabled={currentPage === paginatedData.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(paginatedData.totalPages, p + 1))}
              >
                下一页
              </button>
            </div>
          )}
        </div>

        <div className="em-daily-summary">
          <div className="em-summary-header">
            <h3 className="em-summary-title">每日错误摘要</h3>
            <span className="em-summary-sub">最近 30 天</span>
          </div>
          <div className="em-daily-list">
            {dailySummaries.slice(0, 30).map((day) => (
              <div key={day.date} className="em-daily-item">
                <div className="em-daily-header" onClick={() => toggleDayExpand(day.date)}>
                  <span className="em-daily-date">{day.date}</span>
                  <span className="em-daily-expand-icon">{expandedDays[day.date] ? '▼' : '▶'}</span>
                </div>
                <div className="em-daily-stats">
                  <div className="em-daily-stat">
                    <span className="em-daily-stat-value">{day.total}</span>
                    <span className="em-daily-stat-label">总计</span>
                  </div>
                  <div className="em-daily-stat em-daily-stat--resolved">
                    <span className="em-daily-stat-value">{day.resolved}</span>
                    <span className="em-daily-stat-label">已解决</span>
                  </div>
                  <div className="em-daily-stat em-daily-stat--unresolved">
                    <span className="em-daily-stat-value">{day.unresolved}</span>
                    <span className="em-daily-stat-label">未解决</span>
                  </div>
                  <div className="em-daily-stat em-daily-stat--types">
                    <span className="em-daily-stat-value">{day.newTypes}</span>
                    <span className="em-daily-stat-label">类型</span>
                  </div>
                </div>
                {expandedDays[day.date] && day.errorIds.length > 0 && (
                  <div className="em-daily-errors">
                    {day.errorIds.slice(0, 5).map((errId) => {
                      const err = allErrors.find((e) => e.id === errId)
                      if (!err) return null
                      return (
                        <div key={err.id} className="em-daily-error-item">
                          <span
                            className="em-type-badge em-type-badge--sm"
                            style={{ backgroundColor: ERROR_TYPE_COLORS[err.type] + '20', color: ERROR_TYPE_COLORS[err.type] }}
                          >
                            {err.type}
                          </span>
                          <span className="em-daily-error-msg">{err.message}</span>
                          <span className="em-daily-error-count">{err.count}次</span>
                        </div>
                      )
                    })}
                    {day.errorIds.length > 5 && (
                      <div className="em-daily-more">还有 {day.errorIds.length - 5} 条...</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorMonitor
