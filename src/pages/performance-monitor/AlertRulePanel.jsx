import { useState } from 'react'
import {
  METRIC_TYPES,
  METRIC_LABELS,
  METRIC_UNITS,
  ALERT_CONDITIONS,
  ALERT_CONDITION_LABELS,
  METRIC_RANGES,
} from './constants'
import {
  addAlertRule,
  deleteAlertRule,
  getRuleDescription,
  formatDateTime,
  toggleAlertRule,
  validateAlertRule,
} from './utils'

function AlertRulePanel({ alertRules, onRulesChange, currentlyTriggeredIds }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    metricType: METRIC_TYPES.FPS,
    condition: ALERT_CONDITIONS.LESS_THAN,
    threshold: '',
  })
  const [errors, setErrors] = useState({})

  const metricOptions = Object.values(METRIC_TYPES).map((type) => ({
    value: type,
    label: `${METRIC_LABELS[type]} (${METRIC_UNITS[type]})`,
    range: METRIC_RANGES[type],
  }))

  const conditionOptions = Object.values(ALERT_CONDITIONS).map((cond) => ({
    value: cond,
    label: ALERT_CONDITION_LABELS[cond],
  }))

  const handleChange = (field, value) => {
    const next = { ...formData, [field]: value }
    setFormData(next)
    if (Object.keys(errors).length > 0) {
      setErrors(validateAlertRule(next))
    }
  }

  const handleAddRule = () => {
    const validateErrors = validateAlertRule(formData)
    if (Object.keys(validateErrors).length > 0) {
      setErrors(validateErrors)
      return
    }

    const result = addAlertRule(alertRules, formData)
    if (result.success) {
      onRulesChange(result.rules)
      setFormData({
        metricType: METRIC_TYPES.FPS,
        condition: ALERT_CONDITIONS.LESS_THAN,
        threshold: '',
      })
      setErrors({})
      setShowForm(false)
    } else {
      setErrors(result.errors || {})
    }
  }

  const handleToggle = (ruleId) => {
    const result = toggleAlertRule(alertRules, ruleId)
    if (result.success) {
      onRulesChange(result.rules)
    }
  }

  const handleDelete = (ruleId) => {
    const result = deleteAlertRule(alertRules, ruleId)
    if (result.success) {
      onRulesChange(result.rules)
    }
  }

  const currentRange = METRIC_RANGES[formData.metricType]

  return (
    <div className="alert-rule-panel">
      <div className="alert-rule-header">
        <h3 className="alert-rule-title">告警规则配置</h3>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '取消' : '+ 新增规则'}
        </button>
      </div>

      {showForm && (
        <div className="alert-rule-form">
          <div className="form-row">
            <div className="form-group">
              <label>指标类型</label>
              <select
                className="form-select"
                value={formData.metricType}
                onChange={(e) => handleChange('metricType', e.target.value)}
              >
                {metricOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.metricType && (
                <div className="form-error">{errors.metricType}</div>
              )}
            </div>

            <div className="form-group">
              <label>条件</label>
              <select
                className="form-select"
                value={formData.condition}
                onChange={(e) => handleChange('condition', e.target.value)}
              >
                {conditionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.condition && (
                <div className="form-error">{errors.condition}</div>
              )}
            </div>

            <div className="form-group">
              <label>
                阈值 ({METRIC_UNITS[formData.metricType]})
                {currentRange && (
                  <span className="field-hint">
                    {' '}范围: {currentRange.min}-{currentRange.max}
                  </span>
                )}
              </label>
              <input
                type="number"
                className="form-input"
                min={currentRange?.min}
                max={currentRange?.max}
                value={formData.threshold}
                onChange={(e) => handleChange('threshold', e.target.value)}
                placeholder="请输入阈值"
              />
              {errors.threshold && (
                <div className="form-error">{errors.threshold}</div>
              )}
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleAddRule}>
                添加规则
              </button>
            </div>
          </div>

          <div className="form-preview">
            预览：
            <strong className="rule-preview-text">
              {METRIC_LABELS[formData.metricType]}{' '}
              {ALERT_CONDITION_LABELS[formData.condition]}{' '}
              {formData.threshold || '?'}{METRIC_UNITS[formData.metricType]}
            </strong>
          </div>
        </div>
      )}

      <div className="alert-rule-list">
        {alertRules.length === 0 ? (
          <div className="alert-rule-empty">
            暂无告警规则，点击"新增规则"按钮创建
          </div>
        ) : (
          <table className="alert-rule-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>规则描述</th>
                <th style={{ width: '20%' }}>创建时间</th>
                <th style={{ width: '20%' }}>最后触发时间</th>
                <th style={{ width: '10%' }}>状态</th>
                <th style={{ width: '10%' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {alertRules.map((rule) => {
                const isTriggered = currentlyTriggeredIds?.includes(rule.id)
                return (
                  <tr
                    key={rule.id}
                    className={`
                      ${rule.enabled ? '' : 'rule-disabled'}
                      ${isTriggered ? 'rule-triggered' : ''}
                    `}
                  >
                    <td>
                      <div className="rule-desc">{getRuleDescription(rule)}</div>
                    </td>
                    <td className="rule-time">
                      {formatDateTime(rule.createdAt)}
                    </td>
                    <td className="rule-time">
                      {rule.lastTriggeredAt
                        ? formatDateTime(rule.lastTriggeredAt)
                        : '-'}
                    </td>
                    <td>
                      <label className="switch-label">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => handleToggle(rule.id)}
                        />
                        <span className="switch-slider" />
                        <span className="switch-text">
                          {rule.enabled ? '启用' : '禁用'}
                        </span>
                      </label>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(rule.id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AlertRulePanel
