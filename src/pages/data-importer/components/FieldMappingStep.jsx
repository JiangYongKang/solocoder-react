import React from 'react'
import { TARGET_FIELDS } from '../constants.js'
import { autoMapFields, validateMapping } from '../utils.js'

export default class FieldMappingStep extends React.Component {
  constructor(props) {
    super(props)
    this.handleTargetChange = this.handleTargetChange.bind(this)
    this.handleAutoMap = this.handleAutoMap.bind(this)
    this.handleClearAll = this.handleClearAll.bind(this)
  }

  handleTargetChange(targetKey, sourceValue) {
    const { mapping, onMappingChange } = this.props
    const newMapping = { ...mapping }
    if (sourceValue === '') {
      delete newMapping[targetKey]
    } else {
      newMapping[targetKey] = sourceValue
    }
    onMappingChange(newMapping)
  }

  handleAutoMap() {
    const { sourceHeaders, onMappingChange } = this.props
    const autoMapping = autoMapFields(sourceHeaders, TARGET_FIELDS)
    onMappingChange(autoMapping)
  }

  handleClearAll() {
    this.props.onMappingChange({})
  }

  render() {
    const { mapping, sourceHeaders } = this.props
    const validation = validateMapping(mapping, TARGET_FIELDS)
    const sourceUsageCounts = {}
    Object.values(mapping).forEach((s) => {
      if (s) {
        sourceUsageCounts[s] = (sourceUsageCounts[s] || 0) + 1
      }
    })

    return (
      <div>
        <div className="mapping-actions">
          <button className="btn btn-secondary btn-sm" onClick={this.handleAutoMap}>
            🔄 自动映射
          </button>
          <button className="btn btn-secondary btn-sm" onClick={this.handleClearAll}>
            🗑️ 清除所有映射
          </button>
        </div>

        <div className="field-list">
          {TARGET_FIELDS.map((target) => {
            const currentSource = mapping[target.key] || ''
            const hasDuplicate = currentSource && sourceUsageCounts[currentSource] > 1
            return (
              <div key={target.key} className="field-item">
                <div className="target-field">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="target-label">{target.label}</span>
                    {target.required ? (
                      <span className="required-badge">必填</span>
                    ) : (
                      <span className="optional-badge">可选</span>
                    )}
                  </div>
                  <select
                    className="form-select target-select"
                    value={currentSource}
                    onChange={(e) => this.handleTargetChange(target.key, e.target.value)}
                    style={{ borderColor: hasDuplicate ? '#ef4444' : undefined }}
                  >
                    <option value="">-- 不映射 --</option>
                    {sourceHeaders.map((source) => {
                      const isUsed = source !== currentSource && Object.values(mapping).includes(source)
                      return (
                        <option key={source} value={source} disabled={isUsed}>
                          {source}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
            )
          })}
        </div>

        {(!validation.valid || validation.duplicateSources.length > 0) && (
          <div className="mapping-warnings">
            {validation.missingRequired.map((field) => (
              <div key={field.key} className="mapping-warning-item">
                ⚠️ 「{field.label}」为必填字段，请建立映射
              </div>
            ))}
            {validation.duplicateSources.map((source) => (
              <div key={source} className="mapping-warning-item">
                ❌ 源字段「{source}」被映射到多个目标字段，请调整
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
}
