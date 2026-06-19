import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './log-analyzer.css'
import {
  KEYWORD_COLORS,
  LOG_LEVEL_COLORS,
  MAX_KEYWORDS,
  VIRTUAL_SCROLL_THRESHOLD,
} from './constants'
import {
  countByLevel,
  countMultipleKeywordsByHour,
  filterByRegex,
  filterByTimeRange,
  getHighlightRanges,
  getLogLevelBadgeClass,
  getStatsMax,
  isLongContent,
  isValidRegex,
  parseLogs,
  truncateContent,
  validateTimeRange,
} from './utils'

const SAMPLE_LOGS = `[2024-03-15 08:15:32] [INFO] [auth-service] 用户登录成功，用户ID: 10086
[2024-03-15 08:16:01] [INFO] [order-service] 创建订单 #ORD-20240315-001
[2024-03-15 08:16:45] [DEBUG] [payment-service] 支付回调处理中，金额: 299.00
[2024-03-15 08:17:10] [WARN] [inventory-service] 库存不足，商品ID: SKU-5001
[2024-03-15 08:18:22] [ERROR] [auth-service] 用户登录失败：密码错误，用户: admin@example.com
[2024-03-15 09:00:15] [INFO] [scheduler-service] 定时任务开始执行: daily_report
[2024-03-15 09:05:33] [INFO] [notification-service] 发送邮件通知，收件人: user@example.com
[2024-03-15 09:10:00] [ERROR] [payment-service] 支付网关超时，订单号: ORD-20240315-002
[2024-03-15 09:15:20] [WARN] [api-gateway] 请求频率过高，IP: 192.168.1.100
[2024-03-15 10:00:00] [INFO] [analytics-service] 数据统计任务完成，处理记录数: 12580
[2024-03-15 10:30:45] [DEBUG] [cache-service] 缓存命中率: 87.5%
[2024-03-15 11:00:00] [ERROR] [database-service] 数据库连接池耗尽，当前连接数: 100/100
这是一行无法解析的日志文本
[2024-03-15 11:15:00] [INFO] [database-service] 数据库连接池已恢复
[2024-03-15 12:00:00] [INFO] [auth-service] 用户登出，用户ID: 10086
[2024-03-15 13:30:00] [WARN] [file-service] 磁盘使用率超过80%，当前: 82.3%
[2024-03-15 14:00:00] [INFO] [backup-service] 数据备份开始，预计耗时: 30分钟
[2024-03-15 14:32:01] [ERROR] [auth-service] 用户登录失败：密码错误，用户: test@example.com
[2024-03-15 15:00:00] [INFO] [backup-service] 数据备份完成，文件大小: 2.5GB
[2024-03-15 16:00:00] [INFO] [scheduler-service] 定时任务执行完成: hourly_cleanup`

function HighlightedText({ text, pattern, caseSensitive }) {
  const ranges = useMemo(
    () => getHighlightRanges(text, pattern, caseSensitive),
    [text, pattern, caseSensitive]
  )

  if (ranges.length === 0 || !pattern) {
    return <span>{text}</span>
  }

  const parts = []
  let lastEnd = 0

  for (let i = 0; i < ranges.length; i++) {
    const { start, end, text: matchText } = ranges[i]
    if (start > lastEnd) {
      parts.push(<span key={`text-${i}`}>{text.slice(lastEnd, start)}</span>)
    }
    parts.push(
      <mark key={`highlight-${i}`} className="log-highlight">
        {matchText}
      </mark>
    )
    lastEnd = end
  }

  if (lastEnd < text.length) {
    parts.push(<span key="text-end">{text.slice(lastEnd)}</span>)
  }

  return <>{parts}</>
}

function LogItem({ log, pattern, caseSensitive, onToggleCollapse, defaultCollapsed }) {
  const [contentExpanded, setContentExpanded] = useState(!isLongContent(log.content))
  const [rowCollapsed, setRowCollapsed] = useState(defaultCollapsed || false)

  const longContent = isLongContent(log.content)

  const displayContent = useMemo(() => {
    if (!log.isValid) return log.raw
    return contentExpanded ? log.content : truncateContent(log.content)
  }, [log, contentExpanded])

  const handleRowClick = useCallback(() => {
    setRowCollapsed((prev) => !prev)
    if (onToggleCollapse) {
      onToggleCollapse(log.id, !rowCollapsed)
    }
  }, [log.id, rowCollapsed, onToggleCollapse])

  const handleExpandMore = useCallback((e) => {
    e.stopPropagation()
    setContentExpanded((prev) => !prev)
  }, [])

  if (!log.isValid) {
    return (
      <div className="log-item log-item-invalid" data-log-id={log.id}>
        <div className="log-invalid-badge">无法解析</div>
        <div className="log-invalid-content">
          <HighlightedText text={log.raw} pattern={pattern} caseSensitive={caseSensitive} />
        </div>
      </div>
    )
  }

  return (
    <div className={`log-item ${rowCollapsed ? 'log-item-collapsed' : ''}`} data-log-id={log.id}>
      <div className="log-item-header" onClick={handleRowClick}>
        <span className="log-collapse-icon">{rowCollapsed ? '▶' : '▼'}</span>
        <span className="log-timestamp">
          <HighlightedText text={log.timestampStr} pattern={pattern} caseSensitive={caseSensitive} />
        </span>
        <span className={`log-level-badge ${getLogLevelBadgeClass(log.level)}`}>
          <HighlightedText text={log.level} pattern={pattern} caseSensitive={caseSensitive} />
        </span>
        {!rowCollapsed && (
          <>
            <span className="log-module">
              [<HighlightedText text={log.module} pattern={pattern} caseSensitive={caseSensitive} />]
            </span>
            <span className="log-content-preview">
              <HighlightedText
                text={longContent ? displayContent : log.content}
                pattern={pattern}
                caseSensitive={caseSensitive}
              />
              {longContent && !contentExpanded && (
                <span className="log-expand-more" onClick={handleExpandMore}>
                  展开更多
                </span>
              )}
              {longContent && contentExpanded && (
                <span className="log-expand-more" onClick={handleExpandMore}>
                  收起
                </span>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function VirtualLogList({ logs, pattern, caseSensitive, allCollapsed }) {
  const containerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [itemHeights, setItemHeights] = useState({})

  const estimatedItemHeight = 48
  const overscan = 5

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateHeight = () => {
      setContainerHeight(container.clientHeight)
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  const getItemHeight = useCallback((index) => {
    const log = logs[index]
    if (!log) return estimatedItemHeight
    const cached = itemHeights[log.id]
    return cached != null ? cached : estimatedItemHeight
  }, [logs, itemHeights])

  const getOffset = useCallback((index) => {
    let offset = 0
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i)
    }
    return offset
  }, [getItemHeight])

  const totalHeight = useMemo(() => {
    let h = 0
    for (let i = 0; i < logs.length; i++) {
      h += getItemHeight(i)
    }
    return h
  }, [logs, getItemHeight])

  const findStartIndex = useCallback(() => {
    let result = 0
    let acc = 0

    for (let i = 0; i < logs.length; i++) {
      if (acc + getItemHeight(i) > scrollTop) {
        result = i
        break
      }
      acc += getItemHeight(i)
      result = i + 1
    }

    return Math.max(0, result - overscan)
  }, [logs, scrollTop, getItemHeight])

  const findEndIndex = useCallback((startIdx) => {
    let acc = 0
    for (let i = 0; i < startIdx; i++) {
      acc += getItemHeight(i)
    }

    let endIdx = startIdx
    while (endIdx < logs.length && acc < scrollTop + containerHeight) {
      acc += getItemHeight(endIdx)
      endIdx++
    }

    return Math.min(logs.length, endIdx + overscan)
  }, [logs, scrollTop, containerHeight, getItemHeight])

  const startIndex = findStartIndex()
  const endIndex = findEndIndex(startIndex)
  const visibleLogs = logs.slice(startIndex, endIndex)
  const offsetY = getOffset(startIndex)

  const measureItem = useCallback((logId, height) => {
    setItemHeights((prev) => {
      if (prev[logId] === height) return prev
      return { ...prev, [logId]: height }
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const node = entry.target
        const logId = node.getAttribute('data-log-id')
        if (logId) {
          measureItem(logId, entry.contentRect.height)
        }
      }
    })

    const observeVisibleItems = () => {
      const items = container.querySelectorAll('[data-log-id]')
      items.forEach((item) => {
        resizeObserver.observe(item)
      })
    }

    observeVisibleItems()

    const mutationObserver = new MutationObserver(observeVisibleItems)
    mutationObserver.observe(container, { childList: true, subtree: true })

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [visibleLogs, measureItem])

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  return (
    <div
      ref={containerRef}
      className="log-list-container"
      onScroll={handleScroll}
    >
      <div className="log-list-phantom" style={{ height: totalHeight }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleLogs.map((log) => (
            <LogItem
              key={log.id}
              log={log}
              pattern={pattern}
              caseSensitive={caseSensitive}
              defaultCollapsed={allCollapsed}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const CHART_LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG']

function LevelBarChart({ counts }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [hoveredLevel, setHoveredLevel] = useState(null)
  const [barRects, setBarRects] = useState([])

  const maxValue = useMemo(() => getStatsMax(counts), [counts])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const padL = 50
    const padR = 20
    const padT = 20
    const padB = 40
    const chartW = w - padL - padR
    const chartH = h - padT - padB
    const barCount = CHART_LEVELS.length
    const barGap = chartW / barCount
    const barWidth = barGap * 0.6

    ctx.clearRect(0, 0, w, h)

    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e5e4e7'
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#6b6375'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.lineWidth = 1

    const gridLines = 4
    for (let i = 0; i <= gridLines; i++) {
      const y = padT + (chartH / gridLines) * i
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + chartW, y)
      ctx.stroke()
      const val = Math.round(maxValue * (1 - i / gridLines))
      ctx.fillText(val, padL - 8, y + 4)
    }

    const rects = []
    CHART_LEVELS.forEach((level, i) => {
      const count = counts[level] || 0
      const barHeight = (count / maxValue) * chartH
      const x = padL + barGap * i + (barGap - barWidth) / 2
      const y = padT + chartH - barHeight

      rects.push({ level, x, y, width: barWidth, height: barHeight, count })

      if (hoveredLevel === level) {
        ctx.fillStyle = LOG_LEVEL_COLORS[level]
        ctx.globalAlpha = 0.7
        ctx.fillRect(x, y, barWidth, barHeight)
        ctx.globalAlpha = 1
      } else {
        ctx.fillStyle = LOG_LEVEL_COLORS[level]
        ctx.fillRect(x, y, barWidth, barHeight)
      }

      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#6b6375'
      ctx.textAlign = 'center'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText(level, x + barWidth / 2, h - 15)
    })
    setBarRects(rects)
  }, [counts, maxValue, hoveredLevel])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      draw()
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [draw])

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let found = null
    for (const bar of barRects) {
      if (x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height) {
        found = bar
        break
      }
    }

    setHoveredLevel(found ? found.level : null)
  }, [barRects])

  const handleMouseLeave = useCallback(() => {
    setHoveredLevel(null)
  }, [])

  const hoveredBar = barRects.find((b) => b.level === hoveredLevel)

  return (
    <div className="chart-container" ref={containerRef}>
      <div className="bar-chart-wrapper">
        <canvas
          ref={canvasRef}
          className="bar-chart-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {hoveredBar && (
          <div
            className="chart-tooltip"
            style={{
              left: hoveredBar.x + hoveredBar.width / 2,
              top: hoveredBar.y - 8,
            }}
          >
            {hoveredBar.count} 条
          </div>
        )}
      </div>
      <div className="chart-legend">
        {CHART_LEVELS.map((level) => (
          <div key={level} className="chart-legend-item">
            <span
              className="chart-legend-color"
              style={{ background: LOG_LEVEL_COLORS[level] }}
            />
            <span className="chart-legend-label">{level}</span>
            <span className="chart-legend-value">{counts[level] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KeywordLineChart({ keywordResults }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  const allHours = useMemo(() => {
    const keySet = new Set()
    for (const result of keywordResults) {
      for (const item of result.data) {
        keySet.add(item.hour)
      }
    }
    return Array.from(keySet).sort()
  }, [keywordResults])

  const maxValue = useMemo(() => {
    let max = 0
    for (const result of keywordResults) {
      for (const item of result.data) {
        if (item.count > max) max = item.count
      }
    }
    return Math.max(1, max)
  }, [keywordResults])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const padL = 50
    const padR = 20
    const padT = 20
    const padB = 50
    const chartW = w - padL - padR
    const chartH = h - padT - padB

    ctx.clearRect(0, 0, w, h)

    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e5e4e7'
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#6b6375'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.lineWidth = 1

    const gridLines = 4
    for (let i = 0; i <= gridLines; i++) {
      const y = padT + (chartH / gridLines) * i
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + chartW, y)
      ctx.stroke()
      const val = Math.round(maxValue * (1 - i / gridLines))
      ctx.fillText(val, padL - 8, y + 4)
    }

    const hourCount = allHours.length
    if (hourCount > 0) {
      const step = chartW / Math.max(1, hourCount - 1)

      keywordResults.forEach((result, idx) => {
        const color = KEYWORD_COLORS[idx % KEYWORD_COLORS.length]
        const countMap = {}
        for (const item of result.data) {
          countMap[item.hour] = item.count
        }

        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()

        let started = false
        allHours.forEach((hour, i) => {
          const count = countMap[hour] || 0
          const x = padL + step * i
          const y = padT + chartH - (count / maxValue) * chartH

          if (!started) {
            ctx.moveTo(x, y)
            started = true
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.stroke()

        ctx.fillStyle = color
        allHours.forEach((hour, i) => {
          const count = countMap[hour] || 0
          const x = padL + step * i
          const y = padT + chartH - (count / maxValue) * chartH
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fill()
        })
      })

      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#6b6375'
      ctx.textAlign = 'center'
      ctx.font = '10px system-ui, sans-serif'

      const labelStep = Math.max(1, Math.floor(hourCount / 8))
      allHours.forEach((hour, i) => {
        if (i % labelStep === 0 || i === hourCount - 1) {
          const x = padL + step * i
          const displayHour = hour.split(' ')[1] || hour
          ctx.fillText(displayHour, x, h - 25)
        }
      })
    }
  }, [keywordResults, allHours, maxValue])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      draw()
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [draw])

  return (
    <div className="chart-container" ref={containerRef}>
      <canvas ref={canvasRef} className="line-chart-canvas" />
      <div className="chart-legend">
        {keywordResults.map((result, idx) => (
          <div key={result.keyword} className="chart-legend-item">
            <span
              className="chart-legend-line"
              style={{ background: KEYWORD_COLORS[idx % KEYWORD_COLORS.length] }}
            />
            <span className="chart-legend-label">{result.keyword}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const LogAnalyzerPage = () => {
  const navigate = useNavigate()
  const [rawText, setRawText] = useState(SAMPLE_LOGS)
  const [logs, setLogs] = useState(() => parseLogs(SAMPLE_LOGS))
  const [parseVersion, setParseVersion] = useState(0)

  const [regexPattern, setRegexPattern] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(true)

  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const [keywords, setKeywords] = useState(['登录', 'ERROR'])
  const [keywordInput, setKeywordInput] = useState('')

  const [allCollapsed, setAllCollapsed] = useState(false)

  const regexError = useMemo(() => {
    if (!regexPattern) return ''
    return isValidRegex(regexPattern) ? '' : '正则表达式语法错误'
  }, [regexPattern])

  const timeRangeError = useMemo(() => {
    const validation = validateTimeRange(startTime, endTime)
    return validation.valid ? '' : validation.error
  }, [startTime, endTime])

  const filteredLogs = useMemo(() => {
    let result = logs

    if (regexPattern && !regexError) {
      result = filterByRegex(result, regexPattern, caseSensitive)
    }

    if ((startTime || endTime) && !timeRangeError) {
      const startTs = startTime ? new Date(startTime).getTime() : null
      const endTs = endTime ? new Date(endTime).getTime() : null
      result = filterByTimeRange(result, startTs, endTs)
    }

    return result
  }, [logs, regexPattern, caseSensitive, regexError, startTime, endTime, timeRangeError])

  const levelCounts = useMemo(() => countByLevel(filteredLogs), [filteredLogs])

  const keywordResults = useMemo(() => {
    const validKeywords = keywords.filter((k) => k && k.trim())
    return countMultipleKeywordsByHour(filteredLogs, validKeywords, false)
  }, [filteredLogs, keywords])

  const handleParse = useCallback(() => {
    const parsedLogs = parseLogs(rawText)
    setLogs(parsedLogs)
    setParseVersion((v) => v + 1)
  }, [rawText])

  const handleClearFilter = useCallback(() => {
    setRegexPattern('')
    setCaseSensitive(true)
    setStartTime('')
    setEndTime('')
  }, [])

  const handleExpandAll = useCallback(() => {
    setAllCollapsed(false)
  }, [])

  const handleCollapseAll = useCallback(() => {
    setAllCollapsed(true)
  }, [])

  const handleAddKeyword = useCallback(() => {
    if (!keywordInput || !keywordInput.trim()) return
    if (keywords.length >= MAX_KEYWORDS) return
    if (keywords.includes(keywordInput.trim())) return
    setKeywords([...keywords, keywordInput.trim()])
    setKeywordInput('')
  }, [keywordInput, keywords])

  const handleRemoveKeyword = useCallback((keyword) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }, [keywords])

  const useVirtualScroll = logs.length > VIRTUAL_SCROLL_THRESHOLD

  return (
    <div className="log-analyzer-page">
      <div className="log-analyzer-header">
        <button className="log-analyzer-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="log-analyzer-title">日志分析器</h1>
      </div>

      <div className="log-analyzer-layout">
        <div className="log-analyzer-left">
          <div className="log-analyzer-section">
            <h2 className="log-analyzer-section-title">日志输入</h2>
            <textarea
              className="log-input-textarea"
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value)
              }}
              placeholder="粘贴日志文本，每行一条..."
              rows={12}
            />
            <div className="log-input-actions">
              <button className="btn btn-primary btn-sm" onClick={handleParse}>
                解析
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setRawText('')
                  setLogs([])
                  setParseVersion((v) => v + 1)
                }}
              >
                清空
              </button>
              <span className="log-count-info">
                共 {logs.length} 条日志
              </span>
            </div>
          </div>

          <div className="log-analyzer-section">
            <h2 className="log-analyzer-section-title">筛选条件</h2>

            <div className="filter-row">
              <div className="filter-group filter-group-full">
                <label className="filter-label">正则表达式过滤</label>
                <div className="filter-input-row">
                  <input
                    type="text"
                    className="form-input filter-input"
                    value={regexPattern}
                    onChange={(e) => setRegexPattern(e.target.value)}
                    placeholder="输入正则表达式..."
                  />
                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={caseSensitive}
                      onChange={(e) => setCaseSensitive(e.target.checked)}
                    />
                    大小写敏感
                  </label>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleClearFilter}
                  >
                    清除过滤
                  </button>
                </div>
                {regexError && (
                  <div className="filter-error">{regexError}</div>
                )}
                <div className="filter-count">
                  已过滤 {filteredLogs.length} 行 / 总 {logs.length} 行
                </div>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">起始时间</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">结束时间</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            {timeRangeError && (
              <div className="filter-error">{timeRangeError}</div>
            )}
          </div>

          <div className="log-analyzer-section">
            <div className="log-list-header">
              <h2 className="log-analyzer-section-title" style={{ margin: 0 }}>
                日志列表
              </h2>
              <div className="log-list-actions">
                <button className="btn btn-secondary btn-sm" onClick={handleExpandAll}>
                  全部展开
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleCollapseAll}>
                  全部折叠
                </button>
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="log-empty">请先输入并解析日志</div>
            ) : filteredLogs.length === 0 ? (
              <div className="log-empty">没有匹配的日志</div>
            ) : useVirtualScroll ? (
              <VirtualLogList
                key={parseVersion}
                logs={filteredLogs}
                pattern={regexPattern}
                caseSensitive={caseSensitive}
                allCollapsed={allCollapsed}
              />
            ) : (
              <div className="log-list">
                {filteredLogs.map((log) => (
                  <LogItem
                    key={log.id}
                    log={log}
                    pattern={regexPattern}
                    caseSensitive={caseSensitive}
                    defaultCollapsed={allCollapsed}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="log-analyzer-right">
          <div className="log-analyzer-section">
            <h2 className="log-analyzer-section-title">级别分类统计</h2>
            <LevelBarChart counts={levelCounts} />
          </div>

          <div className="log-analyzer-section">
            <h2 className="log-analyzer-section-title">关键词趋势</h2>

            <div className="keyword-input-row">
              <input
                type="text"
                className="form-input keyword-input"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="输入关键词..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddKeyword()
                }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddKeyword}
                disabled={keywords.length >= MAX_KEYWORDS}
              >
                添加
              </button>
            </div>
            <div className="keyword-hint">
              最多支持 {MAX_KEYWORDS} 个关键词
            </div>

            <div className="keyword-tags">
              {keywords.map((kw, idx) => (
                <span
                  key={kw}
                  className="keyword-tag"
                  style={{ borderColor: KEYWORD_COLORS[idx % KEYWORD_COLORS.length] }}
                >
                  <span
                    className="keyword-tag-color"
                    style={{ background: KEYWORD_COLORS[idx % KEYWORD_COLORS.length] }}
                  />
                  {kw}
                  <button
                    className="keyword-tag-close"
                    onClick={() => handleRemoveKeyword(kw)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {keywordResults.length > 0 ? (
              <KeywordLineChart keywordResults={keywordResults} />
            ) : (
              <div className="chart-empty">请添加关键词查看趋势</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogAnalyzerPage
