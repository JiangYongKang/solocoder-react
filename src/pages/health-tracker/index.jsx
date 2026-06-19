import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './health-tracker.css'
import {
  FIELD_CONFIG,
  INDICATOR_KEYS,
  NORMAL_RANGES,
  BMI_RANGES,
  INDICATOR_COLORS,
} from './constants'
import {
  loadRecords,
  saveRecords,
  loadGoals,
  saveGoals,
  createRecord,
  deleteRecord,
  countAbnormalRecords,
  filterRecords,
  paginateRecords,
  buildTrendData,
  getBMIColor,
  isAbnormal,
  getTodayKey,
  setGoals,
  calculateWeightProgress,
  calculateExerciseProgress,
  generateTrendSummary,
  generateReportContent,
  getLatestValues,
} from './utils'

const HealthTrackerPage = () => {
  const navigate = useNavigate()
  const [records, setRecords] = useState(() => loadRecords())
  const [goals, setGoalsState] = useState(() => loadGoals())
  const [formData, setFormData] = useState(() => {
    const init = { date: getTodayKey() }
    INDICATOR_KEYS.forEach((k) => { init[k] = '' })
    return init
  })
  const [formErrors, setFormErrors] = useState({})
  const [showAbnormalOnly, setShowAbnormalOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedIndicators, setSelectedIndicators] = useState({
    height: false,
    weight: true,
    systolic: true,
    diastolic: true,
    bloodSugar: true,
    bmi: true,
  })
  const [reportOpen, setReportOpen] = useState(false)
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [goalFormData, setGoalFormData] = useState({})
  const [goalFormErrors, setGoalFormErrors] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, record: null })
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const svgRef = useRef(null)

  useEffect(() => { saveRecords(records) }, [records])
  useEffect(() => { saveGoals(goals) }, [goals])

  const abnormalCount = useMemo(() => countAbnormalRecords(records), [records])

  const filteredRecords = useMemo(
    () => filterRecords(records, showAbnormalOnly),
    [records, showAbnormalOnly]
  )

  const pagination = useMemo(
    () => paginateRecords(filteredRecords, page),
    [filteredRecords, page]
  )

  const trendData = useMemo(() => buildTrendData(records, 30), [records])

  const trendSummary = useMemo(
    () => generateTrendSummary(trendData),
    [trendData]
  )

  const latestValues = useMemo(() => getLatestValues(records), [records])

  const weightProgress = useMemo(() => {
    if (goals.weightTarget && latestValues.weight) {
      return calculateWeightProgress(latestValues.weight, goals.weightTarget)
    }
    return null
  }, [goals.weightTarget, latestValues.weight])

  const exerciseProgress = useMemo(
    () => calculateExerciseProgress(goals.weeklyExerciseDone, goals.weeklyExercise),
    [goals.weeklyExerciseDone, goals.weeklyExercise]
  )

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

  const handleSubmit = () => {
    const result = createRecord(records, formData)
    if (result.success) {
      setRecords(result.records)
      const newFormData = { date: getTodayKey() }
      INDICATOR_KEYS.forEach((k) => { newFormData[k] = '' })
      setFormData(newFormData)
      setFormErrors({})
      setPage(1)
    } else {
      setFormErrors(result.errors || {})
    }
  }

  const handleDelete = (record) => {
    setDeleteConfirm({ open: true, record })
  }

  const confirmDelete = () => {
    if (deleteConfirm.record) {
      const result = deleteRecord(records, deleteConfirm.record.id)
      if (result.success) setRecords(result.records)
    }
    setDeleteConfirm({ open: false, record: null })
  }

  const toggleIndicator = (key) => {
    setSelectedIndicators((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleOpenGoalModal = () => {
    setGoalFormData({
      weightTarget: goals.weightTarget !== null ? String(goals.weightTarget) : '',
      weightDeadline: goals.weightDeadline || '',
      weeklyExercise: String(goals.weeklyExercise),
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

  const handleExerciseIncrement = () => {
    setGoalsState((prev) => ({
      ...prev,
      weeklyExerciseDone: Math.min(prev.weeklyExerciseDone + 1, 7),
    }))
  }

  const handleExerciseDecrement = () => {
    setGoalsState((prev) => ({
      ...prev,
      weeklyExerciseDone: Math.max(prev.weeklyExerciseDone - 1, 0),
    }))
  }

  const handleGenerateReport = () => {
    setReportOpen(true)
  }

  const handlePrintReport = () => {
    window.print()
  }

  const renderPagination = () => {
    const { total, totalPage, currentPage } = pagination
    if (totalPage <= 1) return null
    const pages = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPage, start + 4)
    for (let i = start; i <= end; i++) pages.push(i)
    return (
      <div className="ht-pagination">
        <div className="ht-pagination-info">共 {total} 条记录</div>
        <div className="ht-pagination-controls">
          <button className="ht-page-btn" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>上一页</button>
          {pages.map((p) => (
            <button key={p} className={`ht-page-btn ${p === currentPage ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="ht-page-btn" disabled={currentPage === totalPage} onClick={() => setPage(currentPage + 1)}>下一页</button>
        </div>
      </div>
    )
  }

  const renderChart = () => {
    const activeKeys = Object.entries(selectedIndicators)
      .filter(([, v]) => v)
      .map(([k]) => k)

    if (activeKeys.length === 0) {
      return <div className="ht-empty-state">请选择至少一项指标显示</div>
    }

    const width = 900
    const height = 300
    const paddingTop = 20
    const paddingRight = 20
    const paddingBottom = 50
    const paddingLeft = 50
    const chartWidth = width - paddingLeft - paddingRight
    const chartHeight = height - paddingTop - paddingBottom

    let globalMin = Infinity
    let globalMax = -Infinity
    const seriesData = {}

    for (const key of activeKeys) {
      seriesData[key] = []
      for (let i = 0; i < trendData.length; i++) {
        const val = trendData[i][key]
        seriesData[key].push(val)
        if (val !== null && val !== undefined) {
          if (val < globalMin) globalMin = val
          if (val > globalMax) globalMax = val
        }
      }
    }

    if (globalMin === Infinity) {
      globalMin = 0
      globalMax = 100
    }

    const range = globalMax - globalMin || 1
    const scaleMin = globalMin - range * 0.1
    const scaleMax = globalMax + range * 0.1
    const scaleRange = scaleMax - scaleMin

    const yScale = (val) => paddingTop + chartHeight - ((val - scaleMin) / scaleRange) * chartHeight
    const xStep = trendData.length > 1 ? chartWidth / (trendData.length - 1) : 0

    const xTickStep = Math.ceil(trendData.length / 8)
    const xTicks = []
    for (let i = 0; i < trendData.length; i += xTickStep) {
      xTicks.push({ x: paddingLeft + i * xStep, label: trendData[i].label, index: i })
    }
    if (xTicks.length > 0 && xTicks[xTicks.length - 1].index !== trendData.length - 1) {
      xTicks.push({ x: paddingLeft + (trendData.length - 1) * xStep, label: trendData[trendData.length - 1].label, index: trendData.length - 1 })
    }

    const yTickCount = 5
    const yTicks = []
    for (let i = 0; i <= yTickCount; i++) {
      const val = scaleMin + (scaleRange / yTickCount) * i
      yTicks.push({ y: yScale(val), label: Math.round(val * 10) / 10 })
    }

    const gridLines = yTicks.map((t) => ({
      x1: paddingLeft, y1: t.y, x2: paddingLeft + chartWidth, y2: t.y,
    }))

    const buildPath = (values) => {
      const points = []
      for (let i = 0; i < values.length; i++) {
        if (values[i] !== null && values[i] !== undefined) {
          points.push({ x: paddingLeft + i * xStep, y: yScale(values[i]), index: i, value: values[i] })
        }
      }
      if (points.length === 0) return { pathD: '', points: [] }
      const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
      return { pathD, points }
    }

    const bmiBandY = (val) => yScale(val)

    const bmiBands = selectedIndicators.bmi ? [
      { min: 0, max: 18.5, color: BMI_RANGES.underweight.color, opacity: 0.08 },
      { min: 18.5, max: 24, color: BMI_RANGES.normal.color, opacity: 0.12 },
      { min: 24, max: 28, color: BMI_RANGES.overweight.color, opacity: 0.08 },
      { min: 28, max: 50, color: BMI_RANGES.obese.color, opacity: 0.08 },
    ] : []

    const hoveredItem = hoveredIndex !== null ? trendData[hoveredIndex] : null

    return (
      <div className="ht-chart-container">
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          {gridLines.map((line, i) => (
            <line key={`grid-${i}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="var(--border)" strokeDasharray="3,3" strokeWidth="1" />
          ))}
          {yTicks.map((t, i) => (
            <g key={`yt-${i}`}>
              <line x1={paddingLeft - 4} y1={t.y} x2={paddingLeft} y2={t.y} stroke="var(--text)" strokeWidth="1" />
              <text x={paddingLeft - 8} y={t.y} textAnchor="end" dominantBaseline="middle" fill="var(--text)" fontSize="11">{t.label}</text>
            </g>
          ))}
          {xTicks.map((t, i) => (
            <g key={`xt-${i}`}>
              <line x1={t.x} y1={paddingTop + chartHeight} x2={t.x} y2={paddingTop + chartHeight + 4} stroke="var(--text)" strokeWidth="1" />
              <text x={t.x} y={paddingTop + chartHeight + 18} textAnchor="middle" fill="var(--text)" fontSize="11">{t.label}</text>
            </g>
          ))}
          <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={paddingLeft + chartWidth} y2={paddingTop + chartHeight} stroke="var(--text)" strokeWidth="1" />
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + chartHeight} stroke="var(--text)" strokeWidth="1" />

          {selectedIndicators.bmi && bmiBands.map((band, i) => {
            const y1 = bmiBandY(band.max)
            const y2 = bmiBandY(band.min)
            const rectH = y2 - y1
            if (rectH <= 0) return null
            return (
              <rect key={`bmi-band-${i}`} x={paddingLeft} y={y1} width={chartWidth} height={rectH} fill={band.color} opacity={band.opacity} />
            )
          })}

          {activeKeys.map((key) => {
            const { pathD, points } = buildPath(seriesData[key])
            if (!pathD) return null
            const color = INDICATOR_COLORS[key]
            const isBmiKey = key === 'bmi'
            return (
              <g key={`series-${key}`}>
                <path d={pathD} fill="none" stroke={color} strokeWidth={isBmiKey ? 2.5 : 2} strokeLinejoin="round" strokeLinecap="round" />
                {points.map((p) => {
                  const isAbn = key !== 'height' && key !== 'weight' && key !== 'bmi' && NORMAL_RANGES[key] && isAbnormal(key, p.value)
                  return (
                    <circle
                      key={`dot-${key}-${p.index}`}
                      cx={p.x}
                      cy={p.y}
                      r={hoveredIndex === p.index ? 5 : 3}
                      fill={isAbn ? '#dc2626' : color}
                      stroke={isAbn ? '#dc2626' : color}
                      strokeWidth={isAbn ? 2 : 0}
                      onMouseEnter={() => setHoveredIndex(p.index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      style={{ cursor: 'pointer' }}
                    />
                  )
                })}
              </g>
            )
          })}
        </svg>

        {hoveredItem && (() => {
          const tipX = paddingLeft + hoveredIndex * xStep
          const firstVal = Object.values(seriesData).find((v) => v[hoveredIndex] !== null && v[hoveredIndex] !== undefined)
          const tipY = firstVal ? yScale(firstVal[hoveredIndex]) : paddingTop
          return (
            <div className="ht-chart-tooltip" style={{ left: `${(tipX / width) * 100}%`, top: `${(tipY / height) * 100}%` }}>
              <div className="ht-chart-tooltip-date">{hoveredItem.date}</div>
              {activeKeys.map((key) => {
                const val = hoveredItem[key]
                if (val === null || val === undefined) return null
                return (
                  <div key={key} className="ht-chart-tooltip-row">
                    <span className="ht-chart-tooltip-dot" style={{ background: INDICATOR_COLORS[key] }} />
                    {FIELD_CONFIG[key]?.label || 'BMI'}: {val} {FIELD_CONFIG[key]?.unit || ''}
                  </div>
                )
              })}
            </div>
          )
        })()}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
          {activeKeys.map((key) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text)' }}>
              <span style={{ width: 12, height: 3, background: INDICATOR_COLORS[key], borderRadius: 2, display: 'inline-block' }} />
              {FIELD_CONFIG[key]?.label || 'BMI'}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const reportContent = useMemo(
    () => generateReportContent(records, trendSummary),
    [records, trendSummary]
  )

  const renderReport = () => {
    if (!reportOpen) return null
    const r = reportContent
    return (
      <div className="ht-report-overlay" onClick={() => setReportOpen(false)}>
        <div className="ht-report-modal" onClick={(e) => e.stopPropagation()}>
          <h1 className="ht-report-title">{r.title}</h1>
          <div className="ht-report-date">生成日期：{r.date}</div>

          <div className="ht-report-section-title">各项指标最新值及正常范围</div>
          <table className="ht-report-table">
            <thead>
              <tr>
                <th>指标</th>
                <th>最新值</th>
                <th>正常范围</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {INDICATOR_KEYS.map((key) => {
                const val = r.latestValues[key]
                if (val === undefined) return null
                const range = NORMAL_RANGES[key]
                const abn = range ? isAbnormal(key, val) : false
                return (
                  <tr key={key}>
                    <td>{FIELD_CONFIG[key].label}</td>
                    <td className={abn ? 'ht-report-abnormal' : ''}>{val} {FIELD_CONFIG[key].unit}</td>
                    <td>{range ? `${range.min}-${range.max}` : '-'}</td>
                    <td className={abn ? 'ht-report-abnormal' : ''}>{abn ? '异常' : '正常'}</td>
                  </tr>
                )
              })}
              {r.latestValues.bmi !== undefined && (
                <tr>
                  <td>BMI</td>
                  <td>{r.latestValues.bmi}</td>
                  <td>18.5-24（正常）</td>
                  <td className={r.latestValues.bmi < 18.5 || r.latestValues.bmi >= 24 ? 'ht-report-abnormal' : ''}>
                    {r.latestValues.bmi < 18.5 ? '偏瘦' : r.latestValues.bmi < 24 ? '正常' : r.latestValues.bmi < 28 ? '偏胖' : '肥胖'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="ht-report-section-title">30天趋势摘要</div>
          {r.trendLines.length > 0 ? (
            r.trendLines.map((line, i) => (
              <div key={i} className="ht-report-trend-item">{line}</div>
            ))
          ) : (
            <div className="ht-report-trend-item">数据不足，无法生成趋势分析</div>
          )}

          {r.abnormalList.length > 0 && (
            <>
              <div className="ht-report-section-title">异常项</div>
              {r.abnormalList.map((item, i) => (
                <div key={i} className="ht-report-abnormal-item">
                  {item.field}：{item.value}（正常范围 {item.normalRange.min}-{item.normalRange.max}）
                </div>
              ))}
            </>
          )}

          <div className="ht-report-actions">
            <button className="ht-btn ht-btn-secondary" onClick={() => setReportOpen(false)}>关闭</button>
            <button className="ht-report-print-btn" onClick={handlePrintReport}>打印报告</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ht-page">
      <div className="ht-header">
        <button className="ht-back-btn" onClick={() => navigate('/')}>← 返回首页</button>
        <h1 className="ht-title">个人健康档案</h1>
        <button className="ht-btn ht-btn-primary" onClick={handleGenerateReport}>生成健康报告</button>
      </div>

      <div className="ht-section">
        <h2 className="ht-section-title">健康数据录入</h2>
        <div className="ht-form-grid">
          <div className="ht-form-group">
            <label className="ht-form-label">记录日期</label>
            <input
              className="ht-form-input"
              type="date"
              value={formData.date}
              onChange={(e) => handleFormChange('date', e.target.value)}
            />
            {formErrors.date && <div className="ht-form-error">{formErrors.date}</div>}
          </div>
          {INDICATOR_KEYS.map((key) => {
            const config = FIELD_CONFIG[key]
            const hasError = !!formErrors[key]
            const val = formData[key]
            const isRangeError = val !== '' && val !== null && val !== undefined && (Number(val) < config.min || Number(val) > config.max)
            return (
              <div className="ht-form-group" key={key}>
                <label className="ht-form-label">{config.label}（{config.unit}）</label>
                <input
                  className={`ht-form-input ${hasError || isRangeError ? 'ht-error' : ''}`}
                  type="number"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  placeholder={`${config.min}-${config.max}`}
                  value={formData[key]}
                  onChange={(e) => handleFormChange(key, e.target.value)}
                />
                {(hasError || isRangeError) && (
                  <div className="ht-form-error">{formErrors[key] || `${config.label}范围为${config.min}-${config.max}${config.unit}`}</div>
                )}
              </div>
            )
          })}
          <div className="ht-form-group">
            <button className="ht-btn ht-btn-primary" onClick={handleSubmit}>提交记录</button>
          </div>
        </div>
        {formErrors._form && <div className="ht-form-error" style={{ marginTop: 8 }}>{formErrors._form}</div>}
      </div>

      <div className="ht-section">
        <h2 className="ht-section-title">趋势折线图</h2>
        <div className="ht-chart-filters">
          {Object.entries(selectedIndicators).map(([key, checked]) => (
            <label key={key} className="ht-chart-filter-label">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleIndicator(key)}
              />
              <span style={{ color: INDICATOR_COLORS[key] }}>{key === 'bmi' ? 'BMI' : FIELD_CONFIG[key]?.label || key}</span>
            </label>
          ))}
        </div>
        {renderChart()}
      </div>

      <div className="ht-section">
        <h2 className="ht-section-title">健康记录</h2>
        {abnormalCount > 0 && (
          <div
            className={`ht-abnormal-bar ${showAbnormalOnly ? 'ht-abnormal-bar-active' : ''}`}
            onClick={() => { setShowAbnormalOnly(!showAbnormalOnly); setPage(1) }}
          >
            <span className="ht-abnormal-bar-text">共 {abnormalCount} 条异常记录{showAbnormalOnly ? '（点击查看全部）' : '（点击筛选异常）'}</span>
          </div>
        )}
        {pagination.items.length > 0 ? (
          <div className="ht-record-list">
            {pagination.items.map((record) => {
              const isAbn = record.abnormalFields && record.abnormalFields.length > 0
              return (
                <div key={record.id} className={`ht-record-item ${isAbn ? 'ht-abnormal' : ''}`}>
                  <div className="ht-record-date">{record.date}</div>
                  <div className="ht-record-values">
                    {INDICATOR_KEYS.map((key) => {
                      if (record[key] === undefined || record[key] === null) return null
                      const config = FIELD_CONFIG[key]
                      const abn = record.abnormalFields && record.abnormalFields.includes(key)
                      return (
                        <span key={key} className={`ht-record-value ${abn ? 'ht-abnormal-val' : ''}`}>
                          {config.label}: {record[key]}<span>{config.unit}</span>
                        </span>
                      )
                    })}
                    {record.bmi !== undefined && record.bmi !== null && (
                      <span className="ht-record-value" style={{ color: getBMIColor(record.bmi) }}>
                        BMI: {record.bmi}
                      </span>
                    )}
                  </div>
                  <div className="ht-record-actions">
                    <button className="ht-btn ht-btn-danger ht-btn-sm" onClick={() => handleDelete(record)}>删除</button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="ht-empty-state">{showAbnormalOnly ? '暂无异常记录' : '暂无健康记录，快去添加第一条吧！'}</div>
        )}
        {renderPagination()}
      </div>

      <div className="ht-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="ht-section-title" style={{ margin: 0 }}>目标设定追踪</h2>
          <button className="ht-btn ht-btn-primary ht-btn-sm" onClick={handleOpenGoalModal}>修改目标</button>
        </div>
        <div className="ht-goals-panel">
          <div className="ht-goal-card">
            <div className="ht-goal-label">
              <span>体重目标</span>
              <span className={`ht-goal-value ${weightProgress?.isCompleted ? 'completed' : ''}`}>
                {goals.weightTarget ? `${latestValues.weight || '-'} → ${goals.weightTarget} kg` : '未设定'}
              </span>
            </div>
            <div className="ht-progress-bar">
              <div
                className={`ht-progress-fill ${weightProgress?.isCompleted ? 'completed' : ''}`}
                style={{ width: `${weightProgress?.percent || 0}%` }}
              />
            </div>
            {goals.weightDeadline && (
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text)' }}>截止日期：{goals.weightDeadline}</div>
            )}
            {weightProgress?.isCompleted && (
              <div className="ht-goal-completed-tip">✅ 已达成体重目标！</div>
            )}
          </div>
          <div className="ht-goal-card">
            <div className="ht-goal-label">
              <span>每周运动次数</span>
              <span className={`ht-goal-value ${exerciseProgress?.isCompleted ? 'completed' : ''}`}>
                {goals.weeklyExerciseDone} / {goals.weeklyExercise} 次
              </span>
            </div>
            <div className="ht-progress-bar">
              <div
                className={`ht-progress-fill ${exerciseProgress?.isCompleted ? 'completed' : ''}`}
                style={{ width: `${exerciseProgress?.percent || 0}%` }}
              />
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button className="ht-btn ht-btn-secondary ht-btn-sm" onClick={handleExerciseDecrement} disabled={goals.weeklyExerciseDone <= 0}>-</button>
              <button className="ht-btn ht-btn-primary ht-btn-sm" onClick={handleExerciseIncrement} disabled={goals.weeklyExerciseDone >= 7}>+</button>
            </div>
            {exerciseProgress?.isCompleted && (
              <div className="ht-goal-completed-tip">🎉 已完成本周运动目标！</div>
            )}
          </div>
        </div>
      </div>

      {renderReport()}

      {deleteConfirm.open && (
        <div className="ht-modal-backdrop" onClick={() => setDeleteConfirm({ open: false, record: null })}>
          <div className="ht-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="ht-modal-title">确认删除</h2>
            <p className="ht-confirm-message">确定要删除这条健康记录吗？此操作不可恢复。</p>
            <div className="ht-modal-actions">
              <button className="ht-btn ht-btn-secondary" onClick={() => setDeleteConfirm({ open: false, record: null })}>取消</button>
              <button className="ht-btn ht-btn-danger" onClick={confirmDelete}>删除</button>
            </div>
          </div>
        </div>
      )}

      {goalModalOpen && (
        <div className="ht-modal-backdrop" onClick={() => setGoalModalOpen(false)}>
          <div className="ht-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="ht-modal-title">设定健康目标</h2>
            <div className="ht-goal-form-grid">
              <div className="ht-form-group">
                <label className="ht-form-label">目标体重（kg）</label>
                <input
                  className="ht-form-input"
                  type="number"
                  min="20"
                  max="300"
                  step="0.1"
                  placeholder="例如：65"
                  value={goalFormData.weightTarget}
                  onChange={(e) => handleGoalFormChange('weightTarget', e.target.value)}
                />
                {goalFormErrors.weightTarget && <div className="ht-form-error">{goalFormErrors.weightTarget}</div>}
              </div>
              <div className="ht-form-group">
                <label className="ht-form-label">截止日期</label>
                <input
                  className="ht-form-input"
                  type="date"
                  value={goalFormData.weightDeadline}
                  onChange={(e) => handleGoalFormChange('weightDeadline', e.target.value)}
                />
                {goalFormErrors.weightDeadline && <div className="ht-form-error">{goalFormErrors.weightDeadline}</div>}
              </div>
              <div className="ht-form-group">
                <label className="ht-form-label">每周运动次数（0-7）</label>
                <input
                  className="ht-form-input"
                  type="number"
                  min="0"
                  max="7"
                  step="1"
                  value={goalFormData.weeklyExercise}
                  onChange={(e) => handleGoalFormChange('weeklyExercise', e.target.value)}
                />
                {goalFormErrors.weeklyExercise && <div className="ht-form-error">{goalFormErrors.weeklyExercise}</div>}
              </div>
            </div>
            <div className="ht-modal-actions">
              <button className="ht-btn ht-btn-secondary" onClick={() => setGoalModalOpen(false)}>取消</button>
              <button className="ht-btn ht-btn-primary" onClick={handleSaveGoals}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HealthTrackerPage
