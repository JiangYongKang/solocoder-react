import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    DATE_PRESETS,
    GROUP_COLORS,
    MAX_GROUPS,
    MAX_STEPS,
    MIN_STEPS,
} from './constants'
import './funnel-analysis.css'
import {
    addGroup,
    addStep,
    calculateConversionRate,
    calculateDropOff,
    calculateOverallConversionRate,
    downloadCSV,
    exportToCSV,
    fillGroupWithRandomData,
    generateRandomData,
    getBarGradientColor,
    getBarWidthPercentage,
    getDatePresetRange,
    getDefaultState,
    getDropOffCause,
    getDropOffColor,
    getDropOffLevel,
    isValidDateRange,
    loadState,
    removeGroup,
    removeStep,
    reorderSteps,
    saveState,
    updateGroupData,
    updateGroupName,
    updateStepName,
    validateFunnelData,
} from './utils'

function SortableStepItem({ step, index, onNameChange, onDelete, canDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`fa-step-item ${isDragging ? 'dragging' : ''}`}
    >
      <span className="fa-step-handle" {...attributes} {...listeners}>
        ⠿
      </span>
      <span className="fa-step-index">{index + 1}</span>
      <input
        className="fa-step-name-input"
        value={step.name}
        onChange={(e) => onNameChange(step.id, e.target.value)}
      />
      {canDelete && (
        <button className="fa-step-delete" onClick={() => onDelete(step.id)} title="删除步骤">
          ×
        </button>
      )}
    </div>
  )
}

function FunnelBar({ step, index, total, value, maxValue, prevValue }) {
  const widthPct = getBarWidthPercentage(value, maxValue)
  const convRate = prevValue != null ? calculateConversionRate(value, prevValue) : 100
  const overallRate = maxValue > 0 ? calculateOverallConversionRate(value, maxValue) : 0
  const bgColor = getBarGradientColor(index, total)

  return (
    <div className="fa-funnel-step">
      <div className="fa-bar-row">
        <div className="fa-bar-wrapper">
          <div
            className="fa-bar"
            style={{ width: `${Math.max(widthPct, 8)}%`, backgroundColor: bgColor }}
          >
            <span className="fa-bar-label">{step.name}</span>
            <span className="fa-bar-count">{value.toLocaleString()}</span>
            {prevValue != null && (
              <span className="fa-bar-rate">{convRate.toFixed(1)}%</span>
            )}
          </div>
        </div>
        <div className="fa-step-info">
          {prevValue != null && <span className="rate">转化 {convRate.toFixed(1)}%</span>}
          <span className="overall">总转化 {overallRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}

function DropOffRow({ prevValue, currentValue, stepId }) {
  const { count, rate } = calculateDropOff(currentValue, prevValue)
  const level = getDropOffLevel(rate)
  const color = getDropOffColor(rate)
  const cause = getDropOffCause(rate, stepId)

  return (
    <div className="fa-dropoff-row">
      <div className="fa-dropoff-connector">
        <svg viewBox="0 0 14 14" fill="none">
          <path d="M7 0L7 10" stroke={color} strokeWidth="1.5" />
          <path d="M3 8L7 12L11 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className={`fa-dropoff-info ${level.toLowerCase()}`}>
        <span>流失 {count.toLocaleString()}</span>
        <span>流失率 {rate.toFixed(1)}%</span>
        <div className="fa-dropoff-tooltip">
          <div className="fa-dropoff-tooltip-title">流失详情</div>
          <div>流失用户数：{count.toLocaleString()}</div>
          <div>流失率：{rate.toFixed(1)}%</div>
          <div>可能原因：{cause}</div>
        </div>
      </div>
    </div>
  )
}

function FunnelConnector({ topWidthPct, bottomWidthPct, color }) {
  const topW = Math.max(topWidthPct, 8)
  const botW = Math.max(bottomWidthPct, 8)
  return (
    <div className="fa-funnel-connector">
      <svg
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        style={{ width: '100%', height: 20, display: 'block' }}
      >
        <polygon
          points={`0,0 ${topW},0 ${botW},20 0,20`}
          fill={color}
          opacity="0.35"
        />
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="20"
          stroke={color}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <line
          x1={topW}
          y1="0"
          x2={botW}
          y2="20"
          stroke={color}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <polygon
          points={`2,14 5,19 8,14`}
          fill={color}
          opacity="0.7"
        />
      </svg>
    </div>
  )
}

function SingleFunnelView({ steps, group }) {
  const maxValue = Math.max(...steps.map((s) => group.data[s.id] || 0), 1)

  return (
    <div className="fa-funnel-chart">
      {steps.map((step, i) => {
        const value = group.data[step.id] || 0
        const prevValue = i > 0 ? group.data[steps[i - 1].id] || 0 : null
        const widthPct = getBarWidthPercentage(value, maxValue)
        const nextValue = i < steps.length - 1 ? (group.data[steps[i + 1].id] || 0) : null
        const nextWidthPct = nextValue != null ? getBarWidthPercentage(nextValue, maxValue) : null
        return (
          <div key={step.id}>
            <FunnelBar
              step={step}
              index={i}
              total={steps.length}
              value={value}
              maxValue={maxValue}
              prevValue={prevValue}
            />
            {i < steps.length - 1 && (
              <>
                <FunnelConnector
                  topWidthPct={Math.max(widthPct, 8)}
                  bottomWidthPct={Math.max(nextWidthPct, 8)}
                  color={getBarGradientColor(i, steps.length)}
                />
                <DropOffRow prevValue={value} currentValue={nextValue} stepId={steps[i + 1].id} />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MultiFunnelView({ steps, groups }) {
  return (
    <div className="fa-multi-chart">
      {groups.map((group, gi) => {
        const color = GROUP_COLORS[gi % GROUP_COLORS.length]
        return (
          <div key={group.id} className="fa-multi-chart-col">
            <div className="fa-group-label">
              <span className="fa-group-dot" style={{ backgroundColor: color.primary }} />
              {group.name}
            </div>
            <div className="fa-funnel-chart">
              {steps.map((step, i) => {
                const value = group.data[step.id] || 0
                const maxValue = Math.max(...steps.map((s) => group.data[s.id] || 0), 1)
                const prevValue = i > 0 ? group.data[steps[i - 1].id] || 0 : null
                const widthPct = getBarWidthPercentage(value, maxValue)
                const nextValue = i < steps.length - 1 ? (group.data[steps[i + 1].id] || 0) : null
                const nextWidthPct = nextValue != null ? getBarWidthPercentage(nextValue, maxValue) : null
                return (
                  <div key={step.id}>
                    <div className="fa-bar-row">
                      <div className="fa-bar-wrapper">
                        <div
                          className="fa-bar"
                          style={{
                            width: `${Math.max(widthPct, 8)}%`,
                            backgroundColor: color.primary,
                          }}
                        >
                          <span className="fa-bar-label">{step.name}</span>
                          <span className="fa-bar-count">{value.toLocaleString()}</span>
                          {prevValue != null && (
                            <span className="fa-bar-rate">
                              {calculateConversionRate(value, prevValue).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="fa-step-info">
                        {prevValue != null && (
                          <span className="rate">
                            转化 {calculateConversionRate(value, prevValue).toFixed(1)}%
                          </span>
                        )}
                        <span className="overall">
                          总转化 {calculateOverallConversionRate(value, maxValue).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {i < steps.length - 1 && (
                      <>
                        <FunnelConnector
                          topWidthPct={Math.max(widthPct, 8)}
                          bottomWidthPct={Math.max(nextWidthPct, 8)}
                          color={color.primary}
                        />
                        <DropOffRow
                          prevValue={value}
                          currentValue={nextValue}
                          stepId={steps[i + 1].id}
                        />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DataEditorPanel({ steps, groups, onGroupDataChange }) {
  const [editData, setEditData] = useState(() => {
    const d = {}
    groups.forEach((g) => {
      d[g.id] = { ...g.data }
    })
    return d
  })
  const [errors, setErrors] = useState({})

  const handleValueChange = (groupId, stepId, rawValue) => {
    const numVal = rawValue === '' ? 0 : Number(rawValue)
    const newEditData = {
      ...editData,
      [groupId]: { ...editData[groupId], [stepId]: rawValue === '' ? 0 : numVal },
    }
    setEditData(newEditData)

    const groupErrors = validateFunnelData(steps, newEditData[groupId])
    const newErrors = { ...errors }
    if (Object.keys(groupErrors).length > 0) {
      newErrors[groupId] = groupErrors
    } else {
      delete newErrors[groupId]
    }
    setErrors(newErrors)

    if (Object.keys(groupErrors).length === 0) {
      onGroupDataChange(groupId, stepId, numVal)
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="fa-panel">
      <div className="fa-panel-title">
        <span>数据编辑</span>
        {hasErrors && <span style={{ color: '#dc2626', fontSize: 12, fontWeight: 400 }}>存在校验错误，请修正</span>}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="fa-data-table">
          <thead>
            <tr>
              <th>步骤</th>
              {groups.map((g) => (
                <th key={g.id}>{g.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {steps.map((step, i) => (
              <tr key={step.id}>
                <td>
                  <span style={{ marginRight: 6, color: 'var(--text)', fontSize: 11 }}>{i + 1}.</span>
                  {step.name}
                </td>
                {groups.map((g) => {
                  const val = editData[g.id]?.[step.id] ?? g.data[step.id] ?? 0
                  const errMsg = errors[g.id]?.[step.id]
                  return (
                    <td key={g.id}>
                      <input
                        className={`fa-data-input ${errMsg ? 'error' : ''}`}
                        type="number"
                        min="0"
                        value={val || ''}
                        onChange={(e) => handleValueChange(g.id, step.id, e.target.value)}
                      />
                      {errMsg && <div className="fa-data-error">{errMsg}</div>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function FunnelAnalysisPage() {
  const navigate = useNavigate()
  const [state, setState] = useState(() => loadState() || getDefaultState())
  const [editMode, setEditMode] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [activePreset, setActivePreset] = useState('last30')

  const { steps, groups, dateRange } = state

  useEffect(() => {
    saveState(state)
  }, [state])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setState((prev) => {
      const newSteps = reorderSteps(prev.steps, active.id, over.id)
      const newGroups = prev.groups.map((g) => {
        const newData = {}
        newSteps.forEach((s) => {
          newData[s.id] = g.data[s.id] || 0
        })
        return { ...g, data: newData }
      })
      return { ...prev, steps: newSteps, groups: newGroups }
    })
  }, [])

  const handleAddStep = () => {
    const result = addStep(steps)
    if (!result.success) return
    const newStep = result.steps[result.steps.length - 1]
    const newGroups = groups.map((g) => ({
      ...g,
      data: { ...g.data, [newStep.id]: 0 },
    }))
    setState((prev) => ({ ...prev, steps: result.steps, groups: newGroups }))
  }

  const handleRemoveStep = (stepId) => {
    const result = removeStep(steps, stepId, groups)
    if (!result.success) return
    setState((prev) => ({ ...prev, steps: result.steps, groups: result.groups }))
  }

  const handleStepNameChange = (stepId, name) => {
    setState((prev) => ({
      ...prev,
      steps: updateStepName(prev.steps, stepId, name),
    }))
  }

  const handleAddGroup = () => {
    const result = addGroup(groups)
    if (!result.success) return
    const newGroup = result.groups[result.groups.length - 1]
    const data = generateRandomData(steps)
    const filledGroup = { ...newGroup, data }
    setState((prev) => ({
      ...prev,
      groups: [...prev.groups, filledGroup],
    }))
  }

  const handleRemoveGroup = (groupId) => {
    const result = removeGroup(groups, groupId)
    if (!result.success) return
    setState((prev) => ({ ...prev, groups: result.groups }))
  }

  const handleGroupNameChange = (groupId, name) => {
    setState((prev) => ({
      ...prev,
      groups: updateGroupName(prev.groups, groupId, name),
    }))
  }

  const handleGroupDataChange = (groupId, stepId, value) => {
    setState((prev) => ({
      ...prev,
      groups: updateGroupData(prev.groups, groupId, stepId, value),
    }))
  }

  const handleRandomFill = (groupId) => {
    setState((prev) => ({
      ...prev,
      groups: fillGroupWithRandomData(prev.groups, groupId, prev.steps),
    }))
  }

  const handleDatePreset = (key) => {
    const range = getDatePresetRange(key)
    setActivePreset(key)
    setState((prev) => ({ ...prev, dateRange: range }))
  }

  const handleStartDateChange = (e) => {
    const val = e.target.value
    setActivePreset('')
    if (val && dateRange.endDate && !isValidDateRange(val, dateRange.endDate)) return
    setState((prev) => ({ ...prev, dateRange: { ...prev.dateRange, startDate: val } }))
  }

  const handleEndDateChange = (e) => {
    const val = e.target.value
    setActivePreset('')
    if (dateRange.startDate && val && !isValidDateRange(dateRange.startDate, val)) return
    setState((prev) => ({ ...prev, dateRange: { ...prev.dateRange, endDate: val } }))
  }

  const handleExportCSV = () => {
    const csv = exportToCSV(steps, groups)
    if (csv) downloadCSV(csv)
  }

  const activeGroup = groups[0]
  const displayGroups = compareMode ? groups : [activeGroup]

  return (
    <div className="fa-page">
      <div className="fa-header">
        <button className="fa-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="fa-title">漏斗分析</h1>
      </div>

      <div className="fa-toolbar">
        <div className="fa-toolbar-group">
          <span style={{ fontSize: 13, color: 'var(--text)' }}>日期范围：</span>
          <input
            className="fa-date-input"
            type="date"
            value={dateRange.startDate}
            onChange={handleStartDateChange}
          />
          <span style={{ fontSize: 13, color: 'var(--text)' }}>至</span>
          <input
            className="fa-date-input"
            type="date"
            value={dateRange.endDate}
            onChange={handleEndDateChange}
          />
          {DATE_PRESETS.map((p) => (
            <button
              key={p.key}
              className={`fa-preset-btn ${activePreset === p.key ? 'active' : ''}`}
              onClick={() => handleDatePreset(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="fa-toolbar-divider" />
        <div className="fa-toolbar-group">
          <label className="fa-switch" onClick={() => setEditMode(!editMode)}>
            <span>编辑数据</span>
            <div className={`fa-switch-track ${editMode ? 'active' : ''}`}>
              <div className="fa-switch-thumb" />
            </div>
          </label>
          <label className="fa-switch" onClick={() => setCompareMode(!compareMode)}>
            <span>多组对比</span>
            <div className={`fa-switch-track ${compareMode ? 'active' : ''}`}>
              <div className="fa-switch-thumb" />
            </div>
          </label>
        </div>
        <div className="fa-toolbar-divider" />
        <button className="fa-btn fa-btn-secondary" onClick={handleExportCSV}>
          导出 CSV
        </button>
      </div>

      <div className="fa-layout">
        <div className="fa-sidebar">
          <div className="fa-panel">
            <div className="fa-panel-title">
              <span>漏斗步骤</span>
              {steps.length < MAX_STEPS && (
                <button className="fa-btn fa-btn-sm fa-btn-primary" onClick={handleAddStep}>
                  + 添加步骤
                </button>
              )}
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="fa-step-list">
                  {steps.map((step, i) => (
                    <SortableStepItem
                      key={step.id}
                      step={step}
                      index={i}
                      onNameChange={handleStepNameChange}
                      onDelete={handleRemoveStep}
                      canDelete={steps.length > MIN_STEPS}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {editMode && (
            <DataEditorPanel
              key={groups.map((g) => g.id + JSON.stringify(g.data)).join('|')}
              steps={steps}
              groups={groups}
              onGroupDataChange={handleGroupDataChange}
            />
          )}

          {compareMode && (
            <div className="fa-panel">
              <div className="fa-panel-title">
                <span>对比组</span>
                {groups.length < MAX_GROUPS && (
                  <button className="fa-btn fa-btn-sm fa-btn-primary" onClick={handleAddGroup}>
                    + 添加对比组
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {groups.map((g, gi) => (
                  <div key={g.id} className="fa-group-section">
                    <div className="fa-group-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          className="fa-group-dot"
                          style={{ backgroundColor: GROUP_COLORS[gi % GROUP_COLORS.length].primary }}
                        />
                        <input
                          className="fa-group-name-input"
                          value={g.name}
                          onChange={(e) => handleGroupNameChange(g.id, e.target.value)}
                        />
                      </div>
                      <div className="fa-group-actions">
                        <button
                          className="fa-btn fa-btn-sm fa-btn-secondary"
                          onClick={() => handleRandomFill(g.id)}
                        >
                          随机数据
                        </button>
                        {groups.length > 1 && (
                          <button
                            className="fa-btn fa-btn-sm fa-btn-danger"
                            onClick={() => handleRemoveGroup(g.id)}
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="fa-main">
          <div className="fa-funnel-container">
            <div className="fa-funnel-title">
              漏斗图
              <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 400, marginLeft: 8 }}>
                {dateRange.startDate} ~ {dateRange.endDate}
              </span>
            </div>
            {compareMode ? (
              <MultiFunnelView steps={steps} groups={displayGroups} />
            ) : (
              <SingleFunnelView steps={steps} group={activeGroup} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
