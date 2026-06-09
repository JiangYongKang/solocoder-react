import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './fitness-tracker.css'
import { SPORT_TYPES, SPORT_MAP } from './constants'
import {
  loadRecords,
  saveRecords,
  loadGoals,
  saveGoals,
  createRecord,
  deleteRecord,
  getRecordList,
  calculateDailySummary,
  calculateSummaryByDimension,
  buildTrendData,
  buildSportDistribution,
  setGoals,
  calculateDailyProgress,
  calculateWeeklyProgress,
  formatDateTime,
  getTodayKey,
} from './utils'
import TrendChart from './TrendChart'
import DonutChart from './DonutChart'

const FitnessTrackerPage = () => {
  const navigate = useNavigate()

  const [records, setRecords] = useState(() => loadRecords())
  const [goals, setGoalsState] = useState(() => loadGoals())

  const [formData, setFormData] = useState({ sportKey: '', duration: '', distance: '' })
  const [formErrors, setFormErrors] = useState({})

  const [filterSport, setFilterSport] = useState('all')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [page, setPage] = useState(1)

  const [statsDimension, setStatsDimension] = useState('day')
  const [trendChartType, setTrendChartType] = useState('bar')

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, record: null })
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [goalFormData, setGoalFormData] = useState({ dailyMinutes: '', weeklySessions: '' })
  const [goalFormErrors, setGoalFormErrors] = useState({})

  useEffect(() => {
    saveRecords(records)
  }, [records])

  useEffect(() => {
    saveGoals(goals)
  }, [goals])

  const selectedSport = useMemo(
    () => (formData.sportKey ? SPORT_MAP[formData.sportKey] : null),
    [formData.sportKey]
  )

  const pagination = useMemo(
    () =>
      getRecordList(records, {
        sportKey: filterSport,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
        page,
      }),
    [records, filterSport, filterStartDate, filterEndDate, page]
  )

  const todaySummary = useMemo(
    () => calculateDailySummary(records, getTodayKey()),
    [records]
  )

  const statsSummary = useMemo(
    () => calculateSummaryByDimension(records, statsDimension),
    [records, statsDimension]
  )

  const trendData = useMemo(() => buildTrendData(records, 30), [records])
  const pieData = useMemo(() => buildSportDistribution(records), [records])

  const dailyProgress = useMemo(
    () => calculateDailyProgress(records, goals.dailyMinutes),
    [records, goals.dailyMinutes]
  )

  const weeklyProgress = useMemo(
    () => calculateWeeklyProgress(records, goals.weeklySessions),
    [records, goals.weeklySessions]
  )

  const hasTrendData = trendData.some((d) => d.calories > 0)
  const hasPieData = pieData.length > 0

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleAddRecord = () => {
    const result = createRecord(records, formData)
    if (result.success) {
      setRecords(result.records)
      setFormData({ sportKey: '', duration: '', distance: '' })
      setFormErrors({})
      setPage(1)
    } else {
      setFormErrors(result.errors || {})
    }
  }

  const handleAskDelete = (record) => {
    setDeleteConfirm({ open: true, record })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirm.record) {
      const result = deleteRecord(records, deleteConfirm.record.id)
      if (result.success) {
        setRecords(result.records)
      }
    }
    setDeleteConfirm({ open: false, record: null })
  }

  const handleFilterSportChange = (value) => {
    setFilterSport(value)
    setPage(1)
  }

  const handleFilterDateChange = (field, value) => {
    if (field === 'start') setFilterStartDate(value)
    else setFilterEndDate(value)
    setPage(1)
  }

  const handleOpenGoalModal = () => {
    setGoalFormData({
      dailyMinutes: String(goals.dailyMinutes),
      weeklySessions: String(goals.weeklySessions),
    })
    setGoalFormErrors({})
    setGoalModalOpen(true)
  }

  const handleGoalFormChange = (field, value) => {
    setGoalFormData((prev) => ({ ...prev, [field]: value }))
    if (goalFormErrors[field]) {
      setGoalFormErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSaveGoals = () => {
    const result = setGoals(goals, goalFormData)
    if (result.success) {
      setGoalsState(result.goals)
      setGoalModalOpen(false)
    } else {
      setGoalFormErrors(result.errors || {})
    }
  }

  const renderPagination = () => {
    const { total, totalPage, currentPage } = pagination
    if (totalPage <= 1) return null
    const pages = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPage, start + 4)
    for (let i = start; i <= end; i++) pages.push(i)
    return (
      <div className="pagination">
        <div className="pagination-info">共 {total} 条记录</div>
        <div className="pagination-controls">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            上一页
          </button>
          {pages.map((p) => (
            <button
              key={p}
              className={`page-btn ${p === currentPage ? 'active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
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
    <div className="fitness-page">
      <div className="fitness-header">
        <button className="fitness-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="fitness-title">健身运动追踪</h1>
      </div>

      <div className="goals-progress">
        <div className="goal-card">
          <div className="goal-label">
            <span>今日运动目标</span>
            <span className={`goal-value ${dailyProgress.isCompleted ? 'completed' : ''}`}>
              {dailyProgress.currentMinutes} / {dailyProgress.goalMinutes} 分钟
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${dailyProgress.isCompleted ? 'completed' : ''}`}
              style={{ width: `${dailyProgress.percent}%` }}
            />
          </div>
          {dailyProgress.isCompleted && (
            <div className="goal-completed-tip">🎉 恭喜完成今日目标！</div>
          )}
        </div>
        <div className="goal-card">
          <div className="goal-label">
            <span>本周运动目标</span>
            <span className={`goal-value ${weeklyProgress.isCompleted ? 'completed' : ''}`}>
              {weeklyProgress.currentSessions} / {weeklyProgress.goalSessions} 次
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${weeklyProgress.isCompleted ? 'completed' : ''}`}
              style={{ width: `${weeklyProgress.percent}%` }}
            />
          </div>
          {weeklyProgress.isCompleted && (
            <div className="goal-completed-tip">🎉 恭喜完成本周目标！</div>
          )}
        </div>
      </div>

      <div className="daily-summary">
        <div className="summary-card">
          <div className="summary-label">今日运动时长</div>
          <div className="summary-value">
            {todaySummary.totalDuration}
            <span className="summary-unit">分钟</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">今日消耗热量</div>
          <div className="summary-value">
            {todaySummary.totalCalories}
            <span className="summary-unit">千卡</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">今日运动距离</div>
          <div className="summary-value">
            {todaySummary.totalDistance.toFixed(2)}
            <span className="summary-unit">公里</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">今日运动次数</div>
          <div className="summary-value">
            {todaySummary.sessionCount}
            <span className="summary-unit">次</span>
          </div>
        </div>
      </div>

      <div className="fitness-section">
        <h2 className="section-title">添加运动记录</h2>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">运动类型</label>
            <select
              className="form-select"
              value={formData.sportKey}
              onChange={(e) => handleFormChange('sportKey', e.target.value)}
            >
              <option value="">请选择运动类型</option>
              {SPORT_TYPES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.icon} {s.label}
                </option>
              ))}
            </select>
            {formErrors.sportKey && (
              <div className="form-error">{formErrors.sportKey}</div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">运动时长（分钟）</label>
            <input
              className="form-input"
              type="number"
              min="1"
              max="600"
              placeholder="例如：30"
              value={formData.duration}
              onChange={(e) => handleFormChange('duration', e.target.value)}
            />
            {formErrors.duration && (
              <div className="form-error">{formErrors.duration}</div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">
              运动距离（公里）
              {selectedSport && !selectedSport.hasDistance && (
                <span style={{ color: 'var(--text)', fontWeight: 400, marginLeft: 4 }}>
                  （可选）
                </span>
              )}
            </label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.1"
              placeholder={selectedSport && !selectedSport.hasDistance ? '非必填' : '例如：5.0'}
              value={formData.distance}
              onChange={(e) => handleFormChange('distance', e.target.value)}
            />
            {formErrors.distance && (
              <div className="form-error">{formErrors.distance}</div>
            )}
          </div>
          <div className="form-group">
            <button className="btn btn-primary" onClick={handleAddRecord}>
              添加记录
            </button>
          </div>
        </div>
      </div>

      <div className="fitness-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>统计汇总</h2>
          <div className="dimension-tabs">
            <button
              className={`dimension-tab ${statsDimension === 'day' ? 'active' : ''}`}
              onClick={() => setStatsDimension('day')}
            >
              日
            </button>
            <button
              className={`dimension-tab ${statsDimension === 'week' ? 'active' : ''}`}
              onClick={() => setStatsDimension('week')}
            >
              周
            </button>
            <button
              className={`dimension-tab ${statsDimension === 'month' ? 'active' : ''}`}
              onClick={() => setStatsDimension('month')}
            >
              月
            </button>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">运动次数</div>
            <div className="stat-value">
              {statsSummary.sessionCount}
              <span className="stat-unit">次</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">总时长</div>
            <div className="stat-value">
              {statsSummary.totalDuration}
              <span className="stat-unit">分钟</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">总距离</div>
            <div className="stat-value">
              {statsSummary.totalDistance.toFixed(2)}
              <span className="stat-unit">公里</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">
              {statsDimension === 'day' ? '消耗热量' : '总消耗热量'}
            </div>
            <div className="stat-value">
              {statsSummary.totalCalories}
              <span className="stat-unit">千卡</span>
            </div>
          </div>
        </div>
        {(statsDimension === 'week' || statsDimension === 'month') && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text)' }}>
            日均运动时长：<strong style={{ color: 'var(--text-h)' }}>{statsSummary.avgDailyMinutes} 分钟</strong>
          </div>
        )}
      </div>

      <div className="fitness-section">
        <h2 className="section-title">趋势图表</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="chart-title" style={{ margin: 0 }}>近30天热量消耗趋势</h3>
              <div className="dimension-tabs" style={{ margin: 0 }}>
                <button
                  className={`dimension-tab ${trendChartType === 'bar' ? 'active' : ''}`}
                  onClick={() => setTrendChartType('bar')}
                >
                  柱状图
                </button>
                <button
                  className={`dimension-tab ${trendChartType === 'line' ? 'active' : ''}`}
                  onClick={() => setTrendChartType('line')}
                >
                  折线图
                </button>
              </div>
            </div>
            {hasTrendData ? (
              <div className="chart-container">
                <TrendChart
                  data={trendData}
                  type={trendChartType}
                  valueKey="calories"
                  width={600}
                  height={240}
                />
              </div>
            ) : (
              <div className="empty-state">暂无运动数据</div>
            )}
          </div>
          <div className="chart-card">
            <h3 className="chart-title">运动类型时长占比</h3>
            {hasPieData ? (
              <DonutChart
                data={pieData}
                valueKey="value"
                width={300}
                height={240}
                innerRadius={40}
                outerRadius={80}
              />
            ) : (
              <div className="empty-state">暂无运动数据</div>
            )}
          </div>
        </div>
      </div>

      <div className="fitness-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>运动记录</h2>
        </div>
        <div className="toolbar">
          <select
            className="form-select"
            value={filterSport}
            onChange={(e) => handleFilterSportChange(e.target.value)}
          >
            <option value="all">全部类型</option>
            {SPORT_TYPES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.icon} {s.label}
              </option>
            ))}
          </select>
          <input
            className="form-input"
            type="date"
            value={filterStartDate}
            onChange={(e) => handleFilterDateChange('start', e.target.value)}
            placeholder="开始日期"
          />
          <span style={{ color: 'var(--text)' }}>至</span>
          <input
            className="form-input"
            type="date"
            value={filterEndDate}
            onChange={(e) => handleFilterDateChange('end', e.target.value)}
            placeholder="结束日期"
          />
          {(filterStartDate || filterEndDate) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setFilterStartDate('')
                setFilterEndDate('')
                setPage(1)
              }}
            >
              清除日期
            </button>
          )}
        </div>

        {pagination.items.length > 0 ? (
          <div className="record-list">
            {pagination.items.map((record) => {
              const sport = SPORT_MAP[record.sportKey]
              return (
                <div key={record.id} className="record-item">
                  <div className="record-icon">{sport?.icon || '🏃'}</div>
                  <div className="record-info">
                    <div className="record-sport">{sport?.label || record.sportKey}</div>
                    <div className="record-meta">
                      <span className="record-meta-item">⏱ {record.duration} 分钟</span>
                      {record.distance !== null && record.distance !== undefined && (
                        <span className="record-meta-item">📍 {record.distance} 公里</span>
                      )}
                      <span className="record-meta-item">🔥 {record.calories} 千卡</span>
                    </div>
                  </div>
                  <div className="record-datetime">{formatDateTime(record.timestamp)}</div>
                  <div className="record-actions">
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleAskDelete(record)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">暂无运动记录，快去添加第一条吧！</div>
        )}

        {renderPagination()}
      </div>

      <div className="fitness-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-title" style={{ margin: 0 }}>目标设定</h2>
          <button className="btn btn-primary btn-sm" onClick={handleOpenGoalModal}>
            修改目标
          </button>
        </div>
        <div className="goal-form-grid">
          <div className="form-group">
            <label className="form-label">每日运动目标（分钟）</label>
            <input
              className="form-input"
              type="number"
              value={goals.dailyMinutes}
              disabled
            />
          </div>
          <div className="form-group">
            <label className="form-label">每周运动目标（次数）</label>
            <input
              className="form-input"
              type="number"
              value={goals.weeklySessions}
              disabled
            />
          </div>
        </div>
      </div>

      {deleteConfirm.open && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm({ open: false, record: null })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">确认删除</h2>
            <p className="confirm-message">
              确定要删除这条运动记录吗？此操作不可恢复。
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm({ open: false, record: null })}
              >
                取消
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {goalModalOpen && (
        <div className="modal-backdrop" onClick={() => setGoalModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">设定运动目标</h2>
            <div className="goal-form-grid">
              <div className="form-group">
                <label className="form-label">每日运动目标（分钟）</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="1440"
                  value={goalFormData.dailyMinutes}
                  onChange={(e) => handleGoalFormChange('dailyMinutes', e.target.value)}
                />
                {goalFormErrors.dailyMinutes && (
                  <div className="form-error">{goalFormErrors.dailyMinutes}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">每周运动目标（次数）</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="50"
                  value={goalFormData.weeklySessions}
                  onChange={(e) => handleGoalFormChange('weeklySessions', e.target.value)}
                />
                {goalFormErrors.weeklySessions && (
                  <div className="form-error">{goalFormErrors.weeklySessions}</div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setGoalModalOpen(false)}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSaveGoals}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FitnessTrackerPage
