import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import {
  EXPERIMENT_STATUS,
  EXPERIMENT_STATUS_LABELS,
  EXPERIMENT_STATUS_COLORS,
  METRICS,
  GROUP_COLORS,
  DATA_REFRESH_INTERVAL,
  P_VALUE_THRESHOLD,
} from './constants.js'

import {
  createExperiment,
  createGroup,
  adjustTrafficAllocation,
  validateTrafficAllocation,
  canStartExperiment,
  canStopExperiment,
  startExperiment,
  stopExperiment,
  updateTimeSeriesData,
  calculateSignificance,
  hasSignificantResult,
  getControlGroup,
  getExperimentGroups,
  generateGroupId,
} from './abTestCore.js'

import {
  loadExperiments,
  addExperiment,
  updateExperiment,
  getExperimentById,
} from './storage.js'

import './ab-test.css'

function formatDate(timestamp) {
  if (!timestamp) return '-'
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function ExperimentCreateForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [controlGroup, setControlGroup] = useState({
    id: generateGroupId(),
    name: '对照组 A',
    traffic: 50,
    config: {},
    isControl: true,
  })
  const [experimentGroups, setExperimentGroups] = useState([
    {
      id: generateGroupId(),
      name: '实验组 B',
      traffic: 50,
      config: {},
      isControl: false,
    },
  ])
  const [selectedMetrics, setSelectedMetrics] = useState(['click_rate', 'conversion_rate'])
  const [errors, setErrors] = useState({})

  const allGroups = useMemo(() => [controlGroup, ...experimentGroups], [controlGroup, experimentGroups])
  const totalTraffic = useMemo(() => allGroups.reduce((sum, g) => sum + g.traffic, 0), [allGroups])
  const isTotalValid = Math.abs(totalTraffic - 100) < 0.01

  const handleTrafficChange = useCallback((groupId, newValue) => {
    const updatedGroups = adjustTrafficAllocation(allGroups, groupId, newValue)

    const controlUpdated = updatedGroups.find((g) => g.isControl)
    const expUpdated = updatedGroups.filter((g) => !g.isControl)

    if (controlUpdated) setControlGroup(controlUpdated)
    setExperimentGroups(expUpdated)
  }, [allGroups])

  const addExperimentGroup = useCallback(() => {
    if (experimentGroups.length >= 6) return
    const newGroup = {
      id: generateGroupId(),
      name: `实验组 ${String.fromCharCode(66 + experimentGroups.length)}`,
      traffic: 0,
      config: {},
      isControl: false,
    }
    const allGroupsWithNew = [...allGroups, newGroup]
    const balanced = allGroupsWithNew.map((g) => ({ ...g, traffic: Math.round(100 / allGroupsWithNew.length * 100) / 100 }))

    const total = balanced.reduce((sum, g) => sum + g.traffic, 0)
    if (Math.abs(total - 100) > 0.01) {
      balanced[0] = { ...balanced[0], traffic: Math.round((balanced[0].traffic + (100 - total)) * 100) / 100 }
    }

    setControlGroup(balanced.find((g) => g.isControl))
    setExperimentGroups(balanced.filter((g) => !g.isControl))
  }, [allGroups, experimentGroups.length])

  const removeExperimentGroup = useCallback((groupId) => {
    if (experimentGroups.length <= 1) return

    const remaining = allGroups.filter((g) => g.id !== groupId)
    const balanced = remaining.map((g) => ({ ...g, traffic: Math.round(100 / remaining.length * 100) / 100 }))

    const total = balanced.reduce((sum, g) => sum + g.traffic, 0)
    if (Math.abs(total - 100) > 0.01) {
      balanced[0] = { ...balanced[0], traffic: Math.round((balanced[0].traffic + (100 - total)) * 100) / 100 }
    }

    setControlGroup(balanced.find((g) => g.isControl))
    setExperimentGroups(balanced.filter((g) => !g.isControl))
  }, [allGroups, experimentGroups.length])

  const toggleMetric = useCallback((metricKey) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricKey) ? prev.filter((m) => m !== metricKey) : [...prev, metricKey]
    )
  }, [])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    const newErrors = {}

    if (!name.trim()) {
      newErrors.name = '请输入实验名称'
    }

    const validation = validateTrafficAllocation(allGroups)
    if (!validation.valid) {
      newErrors.traffic = validation.error
    }

    if (selectedMetrics.length === 0) {
      newErrors.metrics = '请至少选择一个监控指标'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const exp = createExperiment({
      name: name.trim(),
      description: description.trim(),
      controlGroup: createGroup(controlGroup.name, controlGroup.traffic, controlGroup.config),
      experimentGroups: experimentGroups.map((g) => createGroup(g.name, g.traffic, g.config)),
      metrics: selectedMetrics,
    })

    onSubmit(exp)
  }, [name, description, controlGroup, experimentGroups, selectedMetrics, allGroups, onSubmit])

  return (
    <div className="ab-form-overlay" onClick={onCancel}>
      <div className="ab-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ab-form-header">
          <h2 className="ab-form-title">创建新实验</h2>
          <button className="ab-form-close" onClick={onCancel} aria-label="关闭">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ab-form-body">
            <div className="ab-form-group">
              <label className="ab-form-label">实验名称 *</label>
              <input
                type="text"
                className="ab-form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入实验名称"
              />
              {errors.name && <div className="ab-form-error">{errors.name}</div>}
            </div>

            <div className="ab-form-group">
              <label className="ab-form-label">实验描述</label>
              <textarea
                className="ab-form-input ab-form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入实验描述"
              />
            </div>

            <div className="ab-form-group">
              <label className="ab-form-label">组配置 *</label>

              <div
                className="ab-group-config"
                style={{ borderLeft: `4px solid ${GROUP_COLORS[0]}` }}
              >
                <div className="ab-group-header">
                  <div className="ab-group-title">
                    <span className="ab-color-dot" style={{ background: GROUP_COLORS[0] }}></span>
                    <input
                      type="text"
                      className="ab-form-input"
                      value={controlGroup.name}
                      onChange={(e) => setControlGroup({ ...controlGroup, name: e.target.value })}
                      style={{ padding: '4px 8px', fontSize: '13px', width: '180px' }}
                    />
                    <span className="ab-group-badge">对照组</span>
                  </div>
                </div>
                <div className="ab-traffic-slider">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={controlGroup.traffic}
                    onChange={(e) => handleTrafficChange(controlGroup.id, Number(e.target.value))}
                  />
                  <span className="ab-traffic-value">{controlGroup.traffic.toFixed(0)}%</span>
                </div>
                <div className="ab-form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                  <input
                    type="text"
                    className="ab-form-input"
                    value={controlGroup.config.description || ''}
                    onChange={(e) => setControlGroup({ ...controlGroup, config: { ...controlGroup.config, description: e.target.value } })}
                    placeholder="配置描述（如：现有版本 A）"
                  />
                </div>
              </div>

              {experimentGroups.map((group, index) => (
                <div
                  key={group.id}
                  className="ab-group-config"
                  style={{ borderLeft: `4px solid ${GROUP_COLORS[index + 1]}` }}
                >
                  <div className="ab-group-header">
                    <div className="ab-group-title">
                      <span className="ab-color-dot" style={{ background: GROUP_COLORS[index + 1] }}></span>
                      <input
                        type="text"
                        className="ab-form-input"
                        value={group.name}
                        onChange={(e) => {
                          setExperimentGroups((prev) =>
                            prev.map((g) => (g.id === group.id ? { ...g, name: e.target.value } : g))
                          )
                        }}
                        style={{ padding: '4px 8px', fontSize: '13px', width: '180px' }}
                      />
                    </div>
                    {experimentGroups.length > 1 && (
                      <button
                        type="button"
                        className="ab-remove-group-btn"
                        onClick={() => removeExperimentGroup(group.id)}
                        aria-label="删除组"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="ab-traffic-slider">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={group.traffic}
                      onChange={(e) => handleTrafficChange(group.id, Number(e.target.value))}
                    />
                    <span className="ab-traffic-value">{group.traffic.toFixed(0)}%</span>
                  </div>
                  <div className="ab-form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                    <input
                      type="text"
                      className="ab-form-input"
                      value={group.config.description || ''}
                      onChange={(e) => {
                        setExperimentGroups((prev) =>
                          prev.map((g) => (g.id === group.id ? { ...g, config: { ...g.config, description: e.target.value } } : g))
                        )
                      }}
                      placeholder="配置描述"
                    />
                  </div>
                </div>
              ))}

              {experimentGroups.length < 6 && (
                <button
                  type="button"
                  className="ab-add-group-btn"
                  onClick={addExperimentGroup}
                >
                  + 添加实验组
                </button>
              )}

              <div className={`ab-traffic-total ${isTotalValid ? 'valid' : 'invalid'}`}>
                总流量: {totalTraffic.toFixed(0)}% / 100%
              </div>
              {errors.traffic && <div className="ab-form-error">{errors.traffic}</div>}
            </div>

            <div className="ab-form-group">
              <label className="ab-form-label">监控指标 *</label>
              <div className="ab-metrics-grid">
                {METRICS.map((metric) => (
                  <label
                    key={metric.key}
                    className={`ab-metric-item ${selectedMetrics.includes(metric.key) ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.key)}
                      onChange={() => toggleMetric(metric.key)}
                    />
                    <span className="ab-metric-label">
                      {metric.label} ({metric.unit})
                    </span>
                  </label>
                ))}
              </div>
              {errors.metrics && <div className="ab-form-error">{errors.metrics}</div>}
            </div>
          </div>

          <div className="ab-form-footer">
            <button type="button" className="ab-btn ab-btn-secondary" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="ab-btn ab-btn-primary">
              创建实验
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ExperimentCard({ experiment, onView, onStart, onStop }) {
  const controlGroup = getControlGroup(experiment.groups)
  const expGroups = getExperimentGroups(experiment.groups)

  return (
    <div className="ab-experiment-card">
      <div className="ab-experiment-info">
        <h3 className="ab-experiment-name">
          {experiment.name}
          <span
            className="ab-status-badge"
            style={{
              background: `${EXPERIMENT_STATUS_COLORS[experiment.status]}20`,
              color: EXPERIMENT_STATUS_COLORS[experiment.status],
            }}
          >
            {EXPERIMENT_STATUS_LABELS[experiment.status]}
          </span>
        </h3>
        <p className="ab-experiment-desc">{experiment.description || '暂无描述'}</p>
        <div className="ab-experiment-meta">
          <span>对照组: {controlGroup?.name || '-'}</span>
          <span>实验组: {expGroups.length} 个</span>
          <span>指标: {experiment.metrics.length} 个</span>
          <span>创建时间: {formatDate(experiment.createdAt)}</span>
        </div>
      </div>
      <div className="ab-experiment-actions">
        {canStartExperiment(experiment) && (
          <button className="ab-btn ab-btn-success ab-btn-sm" onClick={() => onStart(experiment.id)}>
            启动
          </button>
        )}
        {canStopExperiment(experiment) && (
          <button className="ab-btn ab-btn-danger ab-btn-sm" onClick={() => onStop(experiment.id)}>
            停止
          </button>
        )}
        <button className="ab-btn ab-btn-secondary ab-btn-sm" onClick={() => onView(experiment.id)}>
          详情
        </button>
      </div>
    </div>
  )
}

function MetricChart({ experiment, metricKey }) {
  const metric = METRICS.find((m) => m.key === metricKey)
  const data = experiment.timeSeriesData[metricKey] || []

  if (!metric || !data || data.length === 0) {
    return <div style={{ color: 'var(--text-m)' }}>暂无数据</div>
  }

  const controlGroup = getControlGroup(experiment.groups)

  return (
    <div className="ab-chart-card">
      <h3 className="ab-chart-title">{metric.label} 趋势对比</h3>
      <div className="ab-legend">
        {experiment.groups.map((group, index) => (
          <div key={group.id} className="ab-legend-item">
            <span className="ab-color-dot" style={{ background: GROUP_COLORS[index] }}></span>
            {group.name}
            {group.isControl && <span style={{ color: 'var(--text-m)' }}>(对照组)</span>}
          </div>
        ))}
      </div>
      <div className="ab-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              stroke="var(--text-m)"
              tick={{ fill: 'var(--text-m)', fontSize: 12 }}
            />
            <YAxis
              stroke="var(--text-m)"
              tick={{ fill: 'var(--text-m)', fontSize: 12 }}
              label={{
                value: metric.unit,
                angle: -90,
                position: 'insideLeft',
                fill: 'var(--text-m)',
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text)',
              }}
              formatter={(value) => [`${value} ${metric.unit}`, '']}
            />
            {experiment.groups.map((group, index) => (
              <Line
                key={group.id}
                type="monotone"
                dataKey={group.id}
                name={group.name}
                stroke={GROUP_COLORS[index]}
                strokeWidth={controlGroup?.id === group.id ? 3 : 2}
                dot={{ r: 3, fill: GROUP_COLORS[index] }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function SignificanceTable({ experiment }) {
  const allResults = []

  experiment.metrics.forEach((metricKey) => {
    const results = calculateSignificance(experiment, metricKey)
    const metric = METRICS.find((m) => m.key === metricKey)
    results.forEach((r) => {
      allResults.push({ ...r, metricLabel: metric?.label || metricKey })
    })
  })

  if (allResults.length === 0) {
    return <div style={{ color: 'var(--text-m)' }}>暂无显著性数据</div>
  }

  return (
    <div className="ab-chart-card">
      <h3 className="ab-chart-title">显著性分析</h3>
      <table className="ab-significance-table">
        <thead>
          <tr>
            <th>实验组</th>
            <th>指标</th>
            <th>对照组均值</th>
            <th>实验组均值</th>
            <th>提升幅度</th>
            <th>p 值</th>
            <th>显著性</th>
          </tr>
        </thead>
        <tbody>
          {allResults.map((result, index) => (
            <tr key={index}>
              <td>{result.groupName}</td>
              <td>{result.metricLabel}</td>
              <td>{result.controlMean}</td>
              <td>{result.expMean}</td>
              <td className={result.liftPercent >= 0 ? 'ab-lift-positive' : 'ab-lift-negative'}>
                {result.liftPercent >= 0 ? '+' : ''}{result.liftPercent.toFixed(2)}%
              </td>
              <td>{result.pValue.toFixed(4)}</td>
              <td>
                {result.isSignificant ? (
                  <span className="ab-significant-badge">显著</span>
                ) : (
                  <span className="ab-not-significant-badge">不显著</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-m)' }}>
        注：p 值 &lt; {P_VALUE_THRESHOLD} 被认为具有统计显著性
      </div>
    </div>
  )
}

function ExperimentDetail({ experiment, onBack, onStart, onStop }) {
  const [currentExperiment, setCurrentExperiment] = useState(experiment)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setCurrentExperiment(experiment)
  }, [experiment])

  useEffect(() => {
    if (currentExperiment.status !== EXPERIMENT_STATUS.RUNNING) return

    const interval = setInterval(() => {
      setCurrentExperiment((prev) => {
        if (!prev || prev.status !== EXPERIMENT_STATUS.RUNNING) return prev
        const updated = updateTimeSeriesData(prev)
        onStart(prev.id, updated)
        return updated
      })
      setIsRefreshing(true)
      setTimeout(() => setIsRefreshing(false), 500)
    }, DATA_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [currentExperiment.status, onStart])

  const hasSignificant = hasSignificantResult(currentExperiment)

  const handleStart = () => {
    const updated = startExperiment(currentExperiment)
    onStart(currentExperiment.id, updated)
    setCurrentExperiment(updated)
  }

  const handleStop = () => {
    const updated = stopExperiment(currentExperiment)
    onStop(currentExperiment.id, updated)
    setCurrentExperiment(updated)
  }

  return (
    <div>
      <div className="ab-detail-header">
        <h2 className="ab-detail-title">
          {currentExperiment.name}
          <span
            className="ab-status-badge"
            style={{
              background: `${EXPERIMENT_STATUS_COLORS[currentExperiment.status]}20`,
              color: EXPERIMENT_STATUS_COLORS[currentExperiment.status],
            }}
          >
            {EXPERIMENT_STATUS_LABELS[currentExperiment.status]}
          </span>
          {isRefreshing && (
            <span className="ab-refresh-indicator">
              <span className="dot"></span>
              数据更新中
            </span>
          )}
        </h2>
        <p className="ab-detail-desc">{currentExperiment.description || '暂无描述'}</p>

        <div className="ab-detail-meta">
          <span>创建时间: {formatDate(currentExperiment.createdAt)}</span>
          {currentExperiment.startedAt && <span>启动时间: {formatDate(currentExperiment.startedAt)}</span>}
          {currentExperiment.endedAt && <span>结束时间: {formatDate(currentExperiment.endedAt)}</span>}
          <span>监控指标: {currentExperiment.metrics.length} 个</span>
        </div>

        <div className="ab-detail-actions">
          {canStartExperiment(currentExperiment) && (
            <button className="ab-btn ab-btn-success" onClick={handleStart}>
              启动实验
            </button>
          )}
          {canStopExperiment(currentExperiment) && (
            <button className="ab-btn ab-btn-danger" onClick={handleStop}>
              停止实验
            </button>
          )}
          <button className="ab-btn ab-btn-secondary" onClick={onBack}>
            返回列表
          </button>
        </div>
      </div>

      {hasSignificant && currentExperiment.status === EXPERIMENT_STATUS.RUNNING && (
        <div className="ab-alert ab-alert-success">
          <span className="ab-alert-icon">✓</span>
          实验已达到统计显著水平，可以考虑停止实验并作出决策。
        </div>
      )}

      <div className="ab-groups-overview">
        {currentExperiment.groups.map((group, index) => (
          <div
            key={group.id}
            className="ab-group-card"
            style={{ '--group-color': GROUP_COLORS[index] }}
          >
            <h4 className="ab-group-card-name">
              <span className="ab-color-dot" style={{ background: GROUP_COLORS[index] }}></span>
              {group.name}
              {group.isControl && <span className="ab-group-badge">对照</span>}
            </h4>
            <div className="ab-group-card-traffic">流量分配: {group.traffic.toFixed(0)}%</div>
            {group.config.description && (
              <div className="ab-group-card-config">配置: {group.config.description}</div>
            )}
          </div>
        ))}
      </div>

      {currentExperiment.status !== EXPERIMENT_STATUS.NOT_STARTED && (
        <>
          <div className="ab-charts-section">
            {currentExperiment.metrics.map((metricKey) => (
              <MetricChart key={metricKey} experiment={currentExperiment} metricKey={metricKey} />
            ))}
          </div>

          <div className="ab-significance-section">
            <SignificanceTable experiment={currentExperiment} />
          </div>
        </>
      )}

      {currentExperiment.status === EXPERIMENT_STATUS.NOT_STARTED && (
        <div className="ab-empty">
          <div className="ab-empty-icon">📊</div>
          <p>实验尚未启动，启动后将开始收集数据并展示图表分析</p>
        </div>
      )}
    </div>
  )
}

function ABTestPage() {
  const navigate = useNavigate()
  const { experimentId } = useParams()

  const [experiments, setExperiments] = useState(() => loadExperiments())
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [viewingExperiment, setViewingExperiment] = useState(null)

  useEffect(() => {
    if (experimentId) {
      const exp = getExperimentById(experiments, experimentId)
      if (exp) {
        setViewingExperiment(exp)
      }
    }
  }, [experimentId, experiments])

  const handleCreateExperiment = useCallback((experiment) => {
    const updated = addExperiment(experiments, experiment)
    setExperiments(updated)
    setShowCreateForm(false)
  }, [experiments])

  const handleStartExperiment = useCallback((id, updatedExp) => {
    if (updatedExp) {
      const updated = updateExperiment(experiments, id, updatedExp)
      setExperiments(updated)
      if (viewingExperiment?.id === id) {
        setViewingExperiment(updatedExp)
      }
    } else {
      setExperiments((prev) => {
        const exp = prev.find((e) => e.id === id)
        if (!exp) return prev
        const updated = startExperiment(exp)
        const list = updateExperiment(prev, id, updated)
        if (viewingExperiment?.id === id) {
          setViewingExperiment(updated)
        }
        return list
      })
    }
  }, [experiments, viewingExperiment])

  const handleStopExperiment = useCallback((id, updatedExp) => {
    if (updatedExp) {
      const updated = updateExperiment(experiments, id, updatedExp)
      setExperiments(updated)
      if (viewingExperiment?.id === id) {
        setViewingExperiment(updatedExp)
      }
    } else {
      setExperiments((prev) => {
        const exp = prev.find((e) => e.id === id)
        if (!exp) return prev
        const updated = stopExperiment(exp)
        const list = updateExperiment(prev, id, updated)
        if (viewingExperiment?.id === id) {
          setViewingExperiment(updated)
        }
        return list
      })
    }
  }, [experiments, viewingExperiment])

  const handleViewExperiment = useCallback((id) => {
    navigate(`/ab-test/${id}`)
  }, [navigate])

  const handleBackToList = useCallback(() => {
    setViewingExperiment(null)
    navigate('/ab-test')
  }, [navigate])

  return (
    <div className="ab-page">
      <div className="ab-header">
        <button className="ab-back-btn" onClick={() => navigate('/')} aria-label="返回首页">
          ← 返回首页
        </button>
        <h1 className="ab-title">
          {viewingExperiment ? '实验详情' : 'A/B 测试配置平台'}
        </h1>
      </div>

      {viewingExperiment ? (
        <ExperimentDetail
          experiment={viewingExperiment}
          onBack={handleBackToList}
          onStart={handleStartExperiment}
          onStop={handleStopExperiment}
        />
      ) : (
        <>
          <div className="ab-toolbar">
            <div style={{ color: 'var(--text-m)', fontSize: '14px' }}>
              共 {experiments.length} 个实验
            </div>
            <button className="ab-btn ab-btn-primary" onClick={() => setShowCreateForm(true)}>
              + 创建实验
            </button>
          </div>

          {experiments.length === 0 ? (
            <div className="ab-empty">
              <div className="ab-empty-icon">🧪</div>
              <p>暂无实验，点击上方按钮创建你的第一个 A/B 测试实验</p>
            </div>
          ) : (
            <div className="ab-experiment-list">
              {[...experiments].reverse().map((experiment) => (
                <ExperimentCard
                  key={experiment.id}
                  experiment={experiment}
                  onView={handleViewExperiment}
                  onStart={handleStartExperiment}
                  onStop={handleStopExperiment}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showCreateForm && (
        <ExperimentCreateForm
          onSubmit={handleCreateExperiment}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  )
}

export default ABTestPage
