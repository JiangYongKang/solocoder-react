import { useState } from 'react'
import {
  DEVICE_TYPES,
  DEVICE_TYPE_LABELS,
  METRIC_TYPES,
  METRIC_LABELS,
  METRIC_UNITS,
  ALERT_CONDITIONS,
  ALERT_CONDITION_LABELS,
  ALERT_LEVELS,
  ALERT_LEVEL_LABELS,
  ALERT_LEVEL_COLORS,
  DEVICE_METRIC_MAP,
} from './constants.js'
import {
  addAlertRule,
  deleteAlertRule,
  toggleAlertRule,
  getRuleSummary,
} from './deviceUtils.js'

const AlertRulePanel = ({ rules, onRulesChange, onClose }) => {
  const [formData, setFormData] = useState({
    deviceType: DEVICE_TYPES.TEMPERATURE,
    metricType: METRIC_TYPES.TEMPERATURE,
    condition: ALERT_CONDITIONS.GREATER_THAN,
    threshold: '',
    level: ALERT_LEVELS.WARNING,
  })
  const [formErrors, setFormErrors] = useState({})

  const handleDeviceTypeChange = (deviceType) => {
    const metricType = DEVICE_METRIC_MAP[deviceType] || METRIC_TYPES.TEMPERATURE
    setFormData((prev) => ({ ...prev, deviceType, metricType }))
    setFormErrors((prev) => {
      const next = { ...prev }
      delete next.deviceType
      delete next.metricType
      return next
    })
  }

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleAddRule = () => {
    const result = addAlertRule(rules, formData)
    if (result.success) {
      onRulesChange(result.rules)
      setFormData((prev) => ({ ...prev, threshold: '' }))
      setFormErrors({})
    } else {
      setFormErrors(result.errors || {})
    }
  }

  const handleToggleRule = (ruleId) => {
    const result = toggleAlertRule(rules, ruleId)
    if (result.success) {
      onRulesChange(result.rules)
    }
  }

  const handleDeleteRule = (ruleId) => {
    const result = deleteAlertRule(rules, ruleId)
    if (result.success) {
      onRulesChange(result.rules)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal alert-rule-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">告警规则配置</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="rule-form">
            <h3 className="form-section-title">添加规则</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">设备类型</label>
                <select
                  className="form-select"
                  value={formData.deviceType}
                  onChange={(e) => handleDeviceTypeChange(e.target.value)}
                >
                  {Object.values(DEVICE_TYPES).map((type) => (
                    <option key={type} value={type}>
                      {DEVICE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
                {formErrors.deviceType && (
                  <div className="form-error">{formErrors.deviceType}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">监控指标</label>
                <select
                  className="form-select"
                  value={formData.metricType}
                  onChange={(e) => handleFieldChange('metricType', e.target.value)}
                >
                  {Object.values(METRIC_TYPES).map((metric) => (
                    <option key={metric} value={metric}>
                      {METRIC_LABELS[metric]}
                    </option>
                  ))}
                </select>
                {formErrors.metricType && (
                  <div className="form-error">{formErrors.metricType}</div>
                )}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">告警条件</label>
                <select
                  className="form-select"
                  value={formData.condition}
                  onChange={(e) => handleFieldChange('condition', e.target.value)}
                >
                  {Object.values(ALERT_CONDITIONS).map((cond) => (
                    <option key={cond} value={cond}>
                      {ALERT_CONDITION_LABELS[cond]}
                    </option>
                  ))}
                </select>
                {formErrors.condition && (
                  <div className="form-error">{formErrors.condition}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">
                  阈值 ({METRIC_UNITS[formData.metricType] || ''})
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.threshold}
                  onChange={(e) => handleFieldChange('threshold', e.target.value)}
                  placeholder="请输入阈值"
                />
                {formErrors.threshold && (
                  <div className="form-error">{formErrors.threshold}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">告警级别</label>
                <select
                  className="form-select"
                  value={formData.level}
                  onChange={(e) => handleFieldChange('level', e.target.value)}
                >
                  {Object.values(ALERT_LEVELS).map((level) => (
                    <option key={level} value={level}>
                      {ALERT_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </select>
                {formErrors.level && (
                  <div className="form-error">{formErrors.level}</div>
                )}
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleAddRule}>
              添加规则
            </button>
          </div>

          <div className="rule-list-section">
            <h3 className="form-section-title">
              已配置规则 ({rules.length})
            </h3>
            {rules.length === 0 ? (
              <div className="empty-rules">暂无告警规则</div>
            ) : (
              <div className="rule-list">
                {rules.map((rule) => (
                  <div key={rule.id} className={`rule-item ${!rule.enabled ? 'disabled' : ''}`}>
                    <div className="rule-info">
                      <div className="rule-summary">{getRuleSummary(rule)}</div>
                      <div className="rule-meta">
                        <span
                          className="level-tag"
                          style={{ backgroundColor: ALERT_LEVEL_COLORS[rule.level] + '20', color: ALERT_LEVEL_COLORS[rule.level] }}
                        >
                          {ALERT_LEVEL_LABELS[rule.level]}
                        </span>
                        <span className="rule-status">
                          {rule.enabled ? '已启用' : '已禁用'}
                        </span>
                      </div>
                    </div>
                    <div className="rule-actions">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => handleToggleRule(rule.id)}
                        />
                        <span className="slider" />
                      </label>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertRulePanel
