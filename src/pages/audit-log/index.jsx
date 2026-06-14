import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './audit-log.css'
import {
    DEFAULT_PAGE_SIZE,
    MAX_RETENTION_DAYS,
    MIN_RETENTION_DAYS,
    OPERATION_RESULTS,
    OPERATION_TYPES,
    PAGE_SIZE_OPTIONS
} from './constants'
import {
    buildTrendData,
    cleanupExpiredLogs,
    countRecentFailures,
    downloadCsv,
    exportToCsv,
    filterLogs,
    formatDateTime,
    initLogsIfNeeded,
    loadConfig,
    paginateLogs,
    saveConfig,
    saveLogs,
    validateRetentionDays
} from './utils'

function JsonNode({ data, path = '', defaultExpanded = 0 }) {
  const [expanded, setExpanded] = useState(defaultExpanded > 0)

  if (data === null) return <span className="json-null">null</span>
  if (typeof data === 'boolean') return <span className="json-boolean">{String(data)}</span>
  if (typeof data === 'number') return <span className="json-number">{data}</span>
  if (typeof data === 'string') return <span className="json-string">&quot;{data}&quot;</span>

  if (Array.isArray(data)) {
    if (data.length === 0) return <span>[]</span>
    return (
      <span>
        <span className="json-toggle" onClick={() => setExpanded(!expanded)}>
          <span className="json-toggle-icon">{expanded ? '▼' : '▶'}</span>[
        </span>
        {expanded ? (
          <>
            {data.map((item, i) => (
              <div key={i} style={{ paddingLeft: 16 }}>
                <JsonNode data={item} path={`${path}[${i}]`} defaultExpanded={defaultExpanded - 1} />
                {i < data.length - 1 && ','}
              </div>
            ))}
            ]
          </>
        ) : (
          <>
            <span className="json-collapsed-hint"> {data.length} 项…</span>]
          </>
        )}
      </span>
    )
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data)
    if (keys.length === 0) return <span>{'{}'}</span>
    return (
      <span>
        <span className="json-toggle" onClick={() => setExpanded(!expanded)}>
          <span className="json-toggle-icon">{expanded ? '▼' : '▶'}</span>{'{'
        }</span>
        {expanded ? (
          <>
            {keys.map((key, i) => (
              <div key={key} style={{ paddingLeft: 16 }}>
                <span className="json-key">&quot;{key}&quot;</span>:{' '}
                <JsonNode data={data[key]} path={`${path}.${key}`} defaultExpanded={defaultExpanded - 1} />
                {i < keys.length - 1 && ','}
              </div>
            ))}
            {'}'}
          </>
        ) : (
          <>
            <span className="json-collapsed-hint"> {keys.length} 字段…</span>{'}'}
          </>
        )}
      </span>
    )
  }

  return String(data)
}

function JsonViewer({ data }) {
  return (
    <div className="json-viewer">
      <JsonNode data={data} defaultExpanded={2} />
    </div>
  )
}

function TrendChart({ logs }) {
  const canvasRef = useRef(null)

  const trendData = useMemo(() => buildTrendData(logs), [logs])

  useEffect(() => {
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
    const padL = 45
    const padR = 20
    const padT = 20
    const padB = 40
    const chartW = w - padL - padR
    const chartH = h - padT - padB

    ctx.clearRect(0, 0, w, h)

    const maxTotal = Math.max(1, ...trendData.map((d) => d.total))

    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e5e4e7'
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#6b6375'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.lineWidth = 1

    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + chartW, y)
      ctx.stroke()
      const val = Math.round(maxTotal * (1 - i / 4))
      ctx.fillText(val, padL - 8, y + 4)
    }

    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#aa3bff'
    ctx.lineWidth = 2
    ctx.beginPath()
    trendData.forEach((d, i) => {
      const x = padL + (chartW / (trendData.length - 1)) * i
      const y = padT + chartH - (d.total / maxTotal) * chartH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#aa3bff'
    trendData.forEach((d, i) => {
      const x = padL + (chartW / (trendData.length - 1)) * i
      const y = padT + chartH - (d.total / maxTotal) * chartH
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    })

    trendData.forEach((d, i) => {
      if (d.isAnomaly) {
        const x = padL + (chartW / (trendData.length - 1)) * i
        const y = padT + chartH - (d.total / maxTotal) * chartH
        ctx.fillStyle = '#dc2626'
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#aa3bff'
      }
    })

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#6b6375'
    ctx.textAlign = 'center'
    ctx.font = '10px system-ui, sans-serif'
    const labelStep = trendData.length > 15 ? 5 : trendData.length > 8 ? 3 : 1
    trendData.forEach((d, i) => {
      if (i % labelStep === 0 || i === trendData.length - 1) {
        const x = padL + (chartW / (trendData.length - 1)) * i
        ctx.fillText(d.label, x, h - 8)
      }
    })
  }, [trendData])

  return <canvas ref={canvasRef} className="audit-trend-canvas" />
}

function MultiSelect({ options, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const allSelected = selected.length === options.length
  const displayText = allSelected
    ? '全部类型'
    : selected.length === 0
      ? '未选择'
      : `已选 ${selected.length} 项`

  const handleSelectAll = () => {
    onChange(options)
  }

  const handleDeselectAll = () => {
    const inverted = options.filter((opt) => !selected.includes(opt))
    onChange(inverted)
  }

  const handleToggle = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div className="multi-select-wrapper" ref={ref}>
      <div className="multi-select-trigger" onClick={() => setOpen(!open)}>
        <span>{displayText}</span>
        <span>▼</span>
      </div>
      {open && (
        <div className="multi-select-dropdown">
          <div className="multi-select-actions">
            <button className="multi-select-action" onClick={handleSelectAll}>全选</button>
            <button className="multi-select-action" onClick={handleDeselectAll}>反选</button>
          </div>
          {options.map((opt) => (
            <label key={opt} className="multi-select-option" onClick={() => handleToggle(opt)}>
              <input type="checkbox" checked={selected.includes(opt)} readOnly />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

const AuditLogPage = () => {
  const navigate = useNavigate()
  const [config, setConfig] = useState(() => loadConfig())
  const [logs, setLogs] = useState(() => {
    const initial = initLogsIfNeeded()
    const cfg = loadConfig()
    const { logs: cleaned, removedCount } = cleanupExpiredLogs(initial, cfg.retentionDays)
    if (removedCount > 0) {
      saveLogs(cleaned)
      return cleaned
    }
    return initial
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [detailLog, setDetailLog] = useState(null)
  const [configMsg, setConfigMsg] = useState(null)
  const [retentionInput, setRetentionInput] = useState(String(config.retentionDays))

  const [draftFilters, setDraftFilters] = useState({
    operator: '',
    operationTypes: [...OPERATION_TYPES],
    result: 'all',
    startDate: '',
    endDate: '',
    resource: '',
  })

  const [filters, setFilters] = useState({
    operator: '',
    operationTypes: [...OPERATION_TYPES],
    result: 'all',
    startDate: '',
    endDate: '',
    resource: '',
  })

  const debounceRef = useRef(null)

  const updateDraftFilter = useCallback((key, value) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, [key]: value }))
      setPage(1)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const filteredLogs = useMemo(() => filterLogs(logs, filters), [logs, filters])

  const pagination = useMemo(
    () => paginateLogs(filteredLogs, page, pageSize),
    [filteredLogs, page, pageSize]
  )

  const recentFailures = useMemo(() => countRecentFailures(logs, 24), [logs])

  const showAnomalyBanner = recentFailures > 10

  const handleResetFilters = () => {
    const resetValue = {
      operator: '',
      operationTypes: [...OPERATION_TYPES],
      result: 'all',
      startDate: '',
      endDate: '',
      resource: '',
    }
    setDraftFilters(resetValue)
    setFilters(resetValue)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setPage(1)
  }

  const handleExport = () => {
    if (filteredLogs.length === 0) return
    const csv = exportToCsv(filteredLogs)
    const now = new Date()
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
    downloadCsv(csv, `审计日志_${ts}.csv`)
  }

  const handleRetentionChange = (e) => {
    const val = e.target.value
    setRetentionInput(val)
    const result = validateRetentionDays(val)
    if (result.valid) {
      const newConfig = { ...config, retentionDays: result.value }
      setConfig(newConfig)
      saveConfig(newConfig)
      const { logs: cleaned, removedCount } = cleanupExpiredLogs(logs, result.value)
      if (removedCount > 0) {
        setLogs(cleaned)
        saveLogs(cleaned)
        setConfigMsg({ type: 'success', text: `保留天数已更新，已清理 ${removedCount} 条过期日志` })
      } else {
        setConfigMsg({ type: 'success', text: `保留天数已更新为 ${result.value} 天` })
      }
    } else {
      setConfigMsg({ type: 'error', text: result.error })
    }
  }

  const renderPagination = () => {
    const { total, totalPage, currentPage } = pagination
    return (
      <div className="audit-pagination">
        <div className="audit-pagination-info">
          <span>共 {total} 条</span>
          <span>共 {totalPage} 页</span>
          <span>当前第 {currentPage} 页</span>
          <label>
            每页
            <select
              className="audit-page-size-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            条
          </label>
        </div>
        <div className="audit-pagination-controls">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            上一页
          </button>
          {Array.from({ length: totalPage }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPage <= 7) return true
              if (p === 1 || p === totalPage) return true
              if (Math.abs(p - currentPage) <= 2) return true
              return false
            })
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text)' }}>…</span>
              ) : (
                <button
                  key={p}
                  className={`page-btn ${p === currentPage ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            )}
          <button
            className="page-btn"
            disabled={currentPage === totalPage}
            onClick={() => setPage(currentPage + 1)}
          >
            下一页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="audit-page">
      <div className="audit-header">
        <button className="audit-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="audit-title">审计日志系统</h1>
      </div>

      {showAnomalyBanner && (
        <div className="audit-warning-banner">
          ⚠ 检测到异常操作模式，近 24 小时有 {recentFailures} 次失败操作，请关注
        </div>
      )}

      <div className="audit-section">
        <h2 className="audit-section-title">操作趋势（近 30 天）</h2>
        <TrendChart logs={logs} />
      </div>

      <div className="audit-section">
        <h2 className="audit-section-title">筛选条件</h2>
        <div className="audit-filter-bar">
          <div className="audit-filter-group">
            <span className="audit-filter-label">操作人</span>
            <input
              className="form-input"
              type="text"
              placeholder="模糊匹配..."
              value={draftFilters.operator}
              onChange={(e) => updateDraftFilter('operator', e.target.value)}
            />
          </div>
          <div className="audit-filter-group">
            <span className="audit-filter-label">操作类型</span>
            <MultiSelect
              options={OPERATION_TYPES}
              selected={draftFilters.operationTypes}
              onChange={(val) => updateDraftFilter('operationTypes', val)}
            />
          </div>
          <div className="audit-filter-group">
            <span className="audit-filter-label">操作结果</span>
            <select
              className="form-select"
              value={draftFilters.result}
              onChange={(e) => updateDraftFilter('result', e.target.value)}
            >
              <option value="all">全部</option>
              <option value={OPERATION_RESULTS.SUCCESS}>成功</option>
              <option value={OPERATION_RESULTS.FAILURE}>失败</option>
            </select>
          </div>
          <div className="audit-filter-group">
            <span className="audit-filter-label">起始日期</span>
            <input
              className="form-input"
              type="date"
              value={draftFilters.startDate}
              onChange={(e) => updateDraftFilter('startDate', e.target.value)}
            />
          </div>
          <div className="audit-filter-group">
            <span className="audit-filter-label">结束日期</span>
            <input
              className="form-input"
              type="date"
              value={draftFilters.endDate}
              onChange={(e) => updateDraftFilter('endDate', e.target.value)}
            />
          </div>
          <div className="audit-filter-group">
            <span className="audit-filter-label">操作对象</span>
            <input
              className="form-input"
              type="text"
              placeholder="模糊匹配..."
              value={draftFilters.resource}
              onChange={(e) => updateDraftFilter('resource', e.target.value)}
            />
          </div>
          <span className="audit-filter-count">匹配 {filteredLogs.length} 条</span>
        </div>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
            重置筛选
          </button>
        </div>
      </div>

      <div className="audit-section">
        <div className="audit-toolbar">
          <h2 className="audit-section-title" style={{ margin: 0 }}>审计日志列表</h2>
          <div className="audit-toolbar-right">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleExport}
              disabled={filteredLogs.length === 0}
              title={filteredLogs.length === 0 ? '当前筛选条件下无数据可导出' : '导出 CSV'}
            >
              导出
            </button>
          </div>
        </div>

        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>操作时间</th>
                <th>操作人</th>
                <th>操作类型</th>
                <th>操作对象</th>
                <th>操作结果</th>
                <th>IP 地址</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagination.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="audit-empty">
                    暂无匹配的审计日志
                  </td>
                </tr>
              ) : (
                pagination.items.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.timestamp)}</td>
                    <td>{log.operator}</td>
                    <td>
                      <span className="op-type-badge">{log.operationType}</span>
                    </td>
                    <td>{log.resource}</td>
                    <td className={log.result === OPERATION_RESULTS.SUCCESS ? 'result-success' : 'result-failure'}>
                      {log.result}
                    </td>
                    <td>{log.ip}</td>
                    <td>
                      <button className="audit-detail-btn" onClick={() => setDetailLog(log)}>
                        详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </div>

      <div className="audit-section">
        <h2 className="audit-section-title">保留策略配置</h2>
        <div className="audit-config-row">
          <span className="audit-config-label">日志保留天数：</span>
          <input
            className="audit-config-input"
            type="number"
            min={MIN_RETENTION_DAYS}
            max={MAX_RETENTION_DAYS}
            value={retentionInput}
            onChange={handleRetentionChange}
          />
          <span className="audit-config-label">天（范围 {MIN_RETENTION_DAYS}-{MAX_RETENTION_DAYS}）</span>
        </div>
        {configMsg && (
          <div className={`audit-config-msg ${configMsg.type}`}>{configMsg.text}</div>
        )}
      </div>

      {detailLog && (
        <div className="audit-modal-backdrop" onClick={() => setDetailLog(null)}>
          <div className="audit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <h2 className="audit-modal-title">日志详情</h2>
              <button className="audit-modal-close" onClick={() => setDetailLog(null)}>✕</button>
            </div>
            <JsonViewer data={detailLog} />
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLogPage
