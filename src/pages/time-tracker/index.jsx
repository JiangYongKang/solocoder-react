import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './time-tracker.css'
import { DEFAULT_PROJECTS, DATE_RANGE_PRESETS } from './constants'
import {
  formatTimerDisplay,
  formatDate,
  formatTimeHHMM,
  getProjectLabel,
  getProjectColor,
  validateManualEntry,
  createRecord,
  createTimerRecord,
  updateRecord,
  deleteRecord,
  loadRecords,
  saveRecords,
  loadBudgets,
  saveBudgets,
  loadTimerState,
  saveTimerState,
  clearTimerState,
  getDateRange,
  filterRecordsByDateRange,
  filterRecordsByProject,
  groupRecordsByDate,
  groupRecordsByProject,
  calculateProjectSubtotals,
  buildBarChartData,
  getBudgetProgress,
  setBudget,
  recordToFormData,
  generateCSV,
  getCSVFilename,
  downloadCSV,
  updateDocumentTitle,
  resetDocumentTitle,
  msToFormattedHours,
} from './utils'

const TimeTrackerPage = () => {
  const navigate = useNavigate()

  const [records, setRecords] = useState(() => loadRecords())
  const [budgets, setBudgets] = useState(() => loadBudgets())

  const savedTimer = useMemo(() => loadTimerState(), [])

  const [timerProject, setTimerProject] = useState(() =>
    savedTimer?.project || DEFAULT_PROJECTS[0].key
  )
  const [timerRunning, setTimerRunning] = useState(() =>
    !!(savedTimer && savedTimer.startTime)
  )
  const [timerPaused, setTimerPaused] = useState(() =>
    !!(savedTimer && savedTimer.paused)
  )
  const [timerStart, setTimerStart] = useState(() => savedTimer?.startTime || null)
  const [elapsedBeforePause, setElapsedBeforePause] = useState(() =>
    savedTimer?.elapsedBeforePause || 0
  )
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    savedTimer && savedTimer.paused ? (savedTimer.elapsedBeforePause || 0) : 0
  )

  const [manualForm, setManualForm] = useState({
    project: DEFAULT_PROJECTS[0].key,
    date: formatDate(new Date().toISOString()),
    startTime: '09:00',
    endTime: '17:00',
    note: '',
  })
  const [manualErrors, setManualErrors] = useState({})

  const [dateRangePreset, setDateRangePreset] = useState(DATE_RANGE_PRESETS.THIS_MONTH)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [chartFilterProject, setChartFilterProject] = useState(null)

  const [editModal, setEditModal] = useState({ open: false, record: null })
  const [editForm, setEditForm] = useState({})
  const [editErrors, setEditErrors] = useState({})

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, record: null })

  const intervalRef = useRef(null)
  const timerStartRef = useRef(timerStart)
  const elapsedBeforeRef = useRef(elapsedBeforePause)

  useEffect(() => {
    timerStartRef.current = timerStart
  }, [timerStart])

  useEffect(() => {
    elapsedBeforeRef.current = elapsedBeforePause
  }, [elapsedBeforePause])

  useEffect(() => {
    saveRecords(records)
  }, [records])

  useEffect(() => {
    saveBudgets(budgets)
  }, [budgets])

  useEffect(() => {
    if (timerRunning && !timerPaused) {
      intervalRef.current = setInterval(() => {
        const startMs = new Date(timerStartRef.current).getTime()
        const nowMs = Date.now()
        const total = elapsedBeforeRef.current + Math.floor((nowMs - startMs) / 1000)
        setElapsedSeconds(total)
      }, 200)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerRunning, timerPaused])

  useEffect(() => {
    if (timerRunning && !timerPaused) {
      updateDocumentTitle(elapsedSeconds, getProjectLabel(timerProject))
    }
  }, [elapsedSeconds, timerRunning, timerPaused, timerProject])

  useEffect(() => {
    if (timerRunning) {
      saveTimerState({
        project: timerProject,
        startTime: timerStartRef.current,
        elapsedBeforePause: elapsedBeforeRef.current,
        paused: timerPaused,
      })
    }
  }, [timerRunning, timerPaused, timerProject])

  useEffect(() => {
    return () => {
      resetDocumentTitle()
    }
  }, [])

  const handleTimerStart = useCallback(() => {
    if (timerPaused) {
      setTimerStart(new Date().toISOString())
      setTimerPaused(false)
    } else {
      setTimerStart(new Date().toISOString())
      setElapsedBeforePause(0)
      setElapsedSeconds(0)
      setTimerRunning(true)
      setTimerPaused(false)
    }
  }, [timerPaused])

  const handleTimerPause = useCallback(() => {
    setElapsedBeforePause(elapsedSeconds)
    setTimerPaused(true)
    resetDocumentTitle()
  }, [elapsedSeconds])

  const handleTimerStop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    const end = new Date()
    const start = new Date(timerStartRef.current)
    const newRecord = createTimerRecord(timerProject, start.toISOString(), end.toISOString())
    setRecords((prev) => [newRecord, ...prev])
    setTimerRunning(false)
    setTimerPaused(false)
    setElapsedSeconds(0)
    setElapsedBeforePause(0)
    setTimerStart(null)
    clearTimerState()
    resetDocumentTitle()
  }, [timerProject])

  const handleManualChange = (field, value) => {
    setManualForm((prev) => ({ ...prev, [field]: value }))
    setManualErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    const errors = validateManualEntry(manualForm)
    if (Object.keys(errors).length > 0) {
      setManualErrors(errors)
      return
    }
    const newRecord = createRecord(manualForm)
    setRecords((prev) => [newRecord, ...prev])
    setManualForm({
      project: DEFAULT_PROJECTS[0].key,
      date: formatDate(new Date().toISOString()),
      startTime: '09:00',
      endTime: '17:00',
      note: '',
    })
    setManualErrors({})
  }

  const dateRange = useMemo(
    () => getDateRange(dateRangePreset, customStart, customEnd),
    [dateRangePreset, customStart, customEnd]
  )

  const barChartData = useMemo(
    () => buildBarChartData(records, dateRange),
    [records, dateRange]
  )

  const maxBarHours = useMemo(() => {
    if (barChartData.length === 0) return 1
    return Math.max(...barChartData.map((d) => d.hours), 1)
  }, [barChartData])

  const displayRecords = useMemo(() => {
    let filtered = filterRecordsByDateRange(records, dateRange)
    if (chartFilterProject) {
      filtered = filterRecordsByProject(filtered, chartFilterProject)
    }
    return filtered
  }, [records, dateRange, chartFilterProject])

  const dateGroups = useMemo(() => groupRecordsByDate(displayRecords), [displayRecords])

  const budgetProgress = useMemo(
    () => getBudgetProgress(records, budgets),
    [records, budgets]
  )

  const handleBarClick = (projectKey) => {
    setChartFilterProject((prev) => (prev === projectKey ? null : projectKey))
  }

  const handleExportCSV = () => {
    const csv = generateCSV(records, chartFilterProject, dateRange)
    const filename = getCSVFilename(dateRange)
    downloadCSV(csv, filename)
  }

  const handleOpenEdit = (record) => {
    const formData = recordToFormData(record)
    setEditForm(formData)
    setEditErrors({})
    setEditModal({ open: true, record })
  }

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
    setEditErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    const errors = validateManualEntry(editForm)
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }
    const updated = updateRecord(records, editModal.record.id, editForm)
    setRecords(updated)
    setEditModal({ open: false, record: null })
  }

  const handleAskDelete = (record) => {
    setDeleteConfirm({ open: true, record })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirm.record) {
      const updated = deleteRecord(records, deleteConfirm.record.id)
      setRecords(updated)
    }
    setDeleteConfirm({ open: false, record: null })
  }

  const handleSetBudget = (projectKey, hours) => {
    const result = setBudget(budgets, projectKey, hours)
    if (result.success) {
      setBudgets(result.budgets)
    }
  }

  const renderDateGroups = () => {
    if (dateGroups.length === 0) {
      return <div className="tt-empty">暂无工时记录</div>
    }
    return dateGroups.map((group) => {
      const projectGroups = groupRecordsByProject(group.records)
      const projectSubtotals = calculateProjectSubtotals(group.records)
      return (
        <div key={group.date} className="tt-date-group">
          <div className="tt-date-header">{group.date}</div>
          {Object.keys(projectGroups).map((pk) => (
            <div key={pk} className="tt-project-group">
              <div className="tt-project-header">
                <span
                  className="tt-budget-dot"
                  style={{ background: getProjectColor(pk) }}
                />
                <span>{getProjectLabel(pk)}</span>
                <span className="tt-project-subtotal">
                  {msToFormattedHours(projectSubtotals[pk])}h
                </span>
              </div>
              <div className="tt-record-list">
                {projectGroups[pk].map((r) => (
                  <div key={r.id} className="tt-record-item">
                    <span
                      className="tt-record-dot"
                      style={{ background: getProjectColor(r.project) }}
                    />
                    <div className="tt-record-info">
                      <div className="tt-record-time">
                        {formatTimeHHMM(new Date(r.startTime))} -{' '}
                        {formatTimeHHMM(new Date(r.endTime))}
                      </div>
                      {r.note && <div className="tt-record-note">{r.note}</div>}
                    </div>
                    <div className="tt-record-duration">
                      {msToFormattedHours(r.durationMs)}h
                    </div>
                    <div className="tt-record-actions">
                      <button
                        className="tt-btn tt-btn-secondary tt-btn-sm"
                        onClick={() => handleOpenEdit(r)}
                      >
                        编辑
                      </button>
                      <button
                        className="tt-btn tt-btn-danger tt-btn-sm"
                        onClick={() => handleAskDelete(r)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    })
  }

  return (
    <div className="tt-page">
      <div className="tt-header">
        <button className="tt-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="tt-title">工时统计</h1>
      </div>

      <div className="tt-section">
        <h2 className="tt-section-title">任务计时器</h2>
        <div className="tt-timer-panel">
          <select
            className="tt-timer-select"
            value={timerProject}
            onChange={(e) => setTimerProject(e.target.value)}
            disabled={timerRunning && !timerPaused}
          >
            {DEFAULT_PROJECTS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="tt-timer-display">{formatTimerDisplay(elapsedSeconds)}</div>
          {!timerRunning ? (
            <button className="tt-timer-btn start" onClick={handleTimerStart}>
              开始
            </button>
          ) : (
            <>
              {!timerPaused ? (
                <button className="tt-timer-btn pause" onClick={handleTimerPause}>
                  暂停
                </button>
              ) : (
                <button className="tt-timer-btn start" onClick={handleTimerStart}>
                  继续
                </button>
              )}
              <button className="tt-timer-btn stop" onClick={handleTimerStop}>
                停止
              </button>
            </>
          )}
        </div>
      </div>

      <div className="tt-section">
        <h2 className="tt-section-title">手动登记工时</h2>
        <form onSubmit={handleManualSubmit}>
          <div className="tt-form-grid">
            <div className="tt-form-group">
              <label className="tt-form-label">项目</label>
              <select
                className="tt-form-select"
                value={manualForm.project}
                onChange={(e) => handleManualChange('project', e.target.value)}
              >
                {DEFAULT_PROJECTS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
              {manualErrors.project && (
                <div className="tt-form-error">{manualErrors.project}</div>
              )}
            </div>
            <div className="tt-form-group">
              <label className="tt-form-label">日期</label>
              <input
                className="tt-form-input"
                type="date"
                value={manualForm.date}
                onChange={(e) => handleManualChange('date', e.target.value)}
              />
              {manualErrors.date && (
                <div className="tt-form-error">{manualErrors.date}</div>
              )}
            </div>
            <div className="tt-form-group">
              <label className="tt-form-label">开始时间</label>
              <input
                className="tt-form-input"
                type="time"
                value={manualForm.startTime}
                onChange={(e) => handleManualChange('startTime', e.target.value)}
              />
              {manualErrors.startTime && (
                <div className="tt-form-error">{manualErrors.startTime}</div>
              )}
            </div>
            <div className="tt-form-group">
              <label className="tt-form-label">结束时间</label>
              <input
                className="tt-form-input"
                type="time"
                value={manualForm.endTime}
                onChange={(e) => handleManualChange('endTime', e.target.value)}
              />
              {manualErrors.endTime && (
                <div className="tt-form-error">{manualErrors.endTime}</div>
              )}
            </div>
            <div className="tt-form-group">
              <label className="tt-form-label">备注</label>
              <input
                className="tt-form-input"
                type="text"
                value={manualForm.note}
                onChange={(e) => handleManualChange('note', e.target.value)}
                maxLength={200}
                placeholder="工作内容备注"
              />
            </div>
            <div className="tt-form-group" style={{ justifyContent: 'flex-end' }}>
              <button className="tt-btn tt-btn-primary" type="submit">
                添加记录
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="tt-section">
        <div className="tt-toolbar" style={{ marginBottom: 16 }}>
          <h2 className="tt-section-title" style={{ margin: 0 }}>
            工时统计图表
          </h2>
        </div>
        <div className="tt-toolbar">
          <div className="tt-range-tabs">
            {Object.entries(DATE_RANGE_PRESETS).map(([key, value]) => (
              <button
                key={key}
                className={`tt-range-tab ${dateRangePreset === value ? 'active' : ''}`}
                onClick={() => setDateRangePreset(value)}
              >
                {key === 'THIS_WEEK'
                  ? '本周'
                  : key === 'THIS_MONTH'
                  ? '本月'
                  : key === 'LAST_MONTH'
                  ? '上月'
                  : key === 'THIS_QUARTER'
                  ? '本季'
                  : '自定义'}
              </button>
            ))}
          </div>
          {dateRangePreset === DATE_RANGE_PRESETS.CUSTOM && (
            <>
              <input
                className="tt-form-input"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{ width: 'auto' }}
              />
              <span style={{ color: 'var(--text)' }}>至</span>
              <input
                className="tt-form-input"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{ width: 'auto' }}
              />
            </>
          )}
          {chartFilterProject && (
            <span style={{ fontSize: 13, color: 'var(--accent)' }}>
              筛选：{getProjectLabel(chartFilterProject)}{' '}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
                onClick={() => setChartFilterProject(null)}
              >
                ✕ 清除
              </button>
            </span>
          )}
        </div>

        {barChartData.length > 0 ? (
          <div className="tt-bar-chart">
            {barChartData.map((item) => {
              const heightPercent = maxBarHours > 0 ? (item.hours / maxBarHours) * 180 : 0
              return (
                <div
                  key={item.projectKey}
                  className={`tt-bar-item ${chartFilterProject === item.projectKey ? 'active' : ''}`}
                  onClick={() => handleBarClick(item.projectKey)}
                  title={`${item.projectLabel}: ${item.hours.toFixed(2)}h`}
                >
                  <div className="tt-bar-value">{item.hours.toFixed(1)}h</div>
                  <div
                    className="tt-bar-fill"
                    style={{
                      height: `${Math.max(heightPercent, 4)}px`,
                      background: item.color,
                    }}
                  />
                  <div className="tt-bar-label">{item.projectLabel}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="tt-bar-empty">选定日期范围内暂无工时数据</div>
        )}
      </div>

      {budgetProgress.length > 0 && (
        <div className="tt-section">
          <h2 className="tt-section-title">月度预算进度</h2>
          <div className="tt-budget-list">
            {budgetProgress.map((item) => (
              <div key={item.projectKey} className="tt-budget-item">
                <div className="tt-budget-header">
                  <div className="tt-budget-project">
                    <span
                      className="tt-budget-dot"
                      style={{ background: item.color }}
                    />
                    {item.projectLabel}
                  </div>
                  <div
                    className={`tt-budget-amounts ${item.status === 'over' ? 'over' : item.status === 'warning' ? 'warning' : ''}`}
                  >
                    {item.used.toFixed(1)}h / {item.budget}h
                    {item.status !== 'over' && (
                      <span style={{ marginLeft: 8, opacity: 0.7 }}>
                        剩余 {item.remaining.toFixed(1)}h
                      </span>
                    )}
                  </div>
                </div>
                <div className="tt-progress-bar">
                  <div
                    className={`tt-progress-fill ${item.status}`}
                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                  />
                </div>
                <div className="tt-budget-input-row" style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>
                    设置月度预算：
                  </span>
                  <input
                    className="tt-budget-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="小时"
                    defaultValue={item.budget || ''}
                    onBlur={(e) => {
                      const val = e.target.value
                      if (val !== '') handleSetBudget(item.projectKey, val)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = e.target.value
                        if (val !== '') handleSetBudget(item.projectKey, val)
                      }
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>小时</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {budgetProgress.length === 0 && (
        <div className="tt-section">
          <h2 className="tt-section-title">月度预算进度</h2>
          <div className="tt-budget-list">
            {DEFAULT_PROJECTS.map((p) => (
              <div key={p.key} className="tt-budget-item">
                <div className="tt-budget-header">
                  <div className="tt-budget-project">
                    <span
                      className="tt-budget-dot"
                      style={{ background: p.color }}
                    />
                    {p.label}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>
                    未设置预算
                  </span>
                </div>
                <div className="tt-budget-input-row" style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>
                    设置月度预算：
                  </span>
                  <input
                    className="tt-budget-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="小时"
                    onBlur={(e) => {
                      const val = e.target.value
                      if (val !== '') handleSetBudget(p.key, val)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = e.target.value
                        if (val !== '') handleSetBudget(p.key, val)
                      }
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>小时</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tt-section">
        <div className="tt-toolbar" style={{ marginBottom: 0 }}>
          <h2 className="tt-section-title" style={{ margin: 0 }}>
            工时记录
          </h2>
          <button className="tt-btn tt-btn-primary" onClick={handleExportCSV}>
            导出 CSV
          </button>
        </div>
        <div style={{ marginTop: 16 }}>{renderDateGroups()}</div>
      </div>

      {editModal.open && (
        <div
          className="tt-modal-backdrop"
          onClick={() => setEditModal({ open: false, record: null })}
        >
          <div className="tt-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="tt-modal-title">编辑工时记录</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="tt-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="tt-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tt-form-label">项目</label>
                  <select
                    className="tt-form-select"
                    value={editForm.project}
                    onChange={(e) => handleEditChange('project', e.target.value)}
                  >
                    {DEFAULT_PROJECTS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  {editErrors.project && (
                    <div className="tt-form-error">{editErrors.project}</div>
                  )}
                </div>
                <div className="tt-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tt-form-label">日期</label>
                  <input
                    className="tt-form-input"
                    type="date"
                    value={editForm.date}
                    onChange={(e) => handleEditChange('date', e.target.value)}
                  />
                  {editErrors.date && (
                    <div className="tt-form-error">{editErrors.date}</div>
                  )}
                </div>
                <div className="tt-form-group">
                  <label className="tt-form-label">开始时间</label>
                  <input
                    className="tt-form-input"
                    type="time"
                    value={editForm.startTime}
                    onChange={(e) => handleEditChange('startTime', e.target.value)}
                  />
                  {editErrors.startTime && (
                    <div className="tt-form-error">{editErrors.startTime}</div>
                  )}
                </div>
                <div className="tt-form-group">
                  <label className="tt-form-label">结束时间</label>
                  <input
                    className="tt-form-input"
                    type="time"
                    value={editForm.endTime}
                    onChange={(e) => handleEditChange('endTime', e.target.value)}
                  />
                  {editErrors.endTime && (
                    <div className="tt-form-error">{editErrors.endTime}</div>
                  )}
                </div>
                <div className="tt-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tt-form-label">备注</label>
                  <input
                    className="tt-form-input"
                    type="text"
                    value={editForm.note}
                    onChange={(e) => handleEditChange('note', e.target.value)}
                    maxLength={200}
                  />
                </div>
              </div>
              <div className="tt-modal-actions">
                <button
                  className="tt-btn tt-btn-secondary"
                  type="button"
                  onClick={() => setEditModal({ open: false, record: null })}
                >
                  取消
                </button>
                <button className="tt-btn tt-btn-primary" type="submit">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm.open && (
        <div
          className="tt-modal-backdrop"
          onClick={() => setDeleteConfirm({ open: false, record: null })}
        >
          <div className="tt-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="tt-modal-title">确认删除</h2>
            <p className="tt-confirm-message">
              确定要删除这条工时记录吗？此操作不可恢复。
            </p>
            <div className="tt-modal-actions">
              <button
                className="tt-btn tt-btn-secondary"
                onClick={() => setDeleteConfirm({ open: false, record: null })}
              >
                取消
              </button>
              <button className="tt-btn tt-btn-danger" onClick={handleConfirmDelete}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeTrackerPage
