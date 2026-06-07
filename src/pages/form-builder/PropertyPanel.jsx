import { FIELD_TYPES, FIELD_TYPE_LABELS } from './formBuilderCore'
import {
  addOption,
  updateOption,
  deleteOption,
} from './formBuilderCore'

function PropertyPanel({ selectedField, onUpdateField }) {
  if (!selectedField) {
    return (
      <div className="fb-panel fb-property-panel">
        <h3 className="fb-panel-title">属性配置</h3>
        <div className="fb-empty-hint">请选择画布中的字段以编辑属性</div>
      </div>
    )
  }

  const handleChange = (key, value) => {
    onUpdateField(selectedField.id, { [key]: value })
  }

  const handleAddOption = () => {
    const updated = addOption(selectedField)
    onUpdateField(selectedField.id, { options: updated.options })
  }

  const handleUpdateOption = (index, updates) => {
    const updated = updateOption(selectedField, index, updates)
    onUpdateField(selectedField.id, { options: updated.options })
  }

  const handleDeleteOption = (index) => {
    const updated = deleteOption(selectedField, index)
    onUpdateField(selectedField.id, { options: updated.options })
  }

  const hasOptions = [
    FIELD_TYPES.SELECT,
    FIELD_TYPES.RADIO,
    FIELD_TYPES.CHECKBOX,
  ].includes(selectedField.type)

  const isNumber = selectedField.type === FIELD_TYPES.NUMBER

  return (
    <div className="fb-panel fb-property-panel">
      <h3 className="fb-panel-title">属性配置</h3>
      <div className="fb-prop-type">
        类型：<strong>{FIELD_TYPE_LABELS[selectedField.type]}</strong>
      </div>

      <div className="fb-prop-group">
        <label className="fb-prop-label">字段标签</label>
        <input
          type="text"
          className="fb-input"
          value={selectedField.label}
          onChange={(e) => handleChange('label', e.target.value)}
        />
      </div>

      <div className="fb-prop-group">
        <label className="fb-prop-checkbox-label">
          <input
            type="checkbox"
            checked={selectedField.required}
            onChange={(e) => handleChange('required', e.target.checked)}
          />
          <span>是否必填</span>
        </label>
      </div>

      {selectedField.type !== FIELD_TYPES.SWITCH && (
        <div className="fb-prop-group">
          <label className="fb-prop-label">占位符文字</label>
          <input
            type="text"
            className="fb-input"
            value={selectedField.placeholder || ''}
            onChange={(e) => handleChange('placeholder', e.target.value)}
          />
        </div>
      )}

      {isNumber && (
        <>
          <div className="fb-prop-group">
            <label className="fb-prop-label">最小值</label>
            <input
              type="number"
              className="fb-input"
              value={selectedField.min ?? ''}
              onChange={(e) =>
                handleChange(
                  'min',
                  e.target.value === '' ? null : Number(e.target.value)
                )
              }
            />
          </div>
          <div className="fb-prop-group">
            <label className="fb-prop-label">最大值</label>
            <input
              type="number"
              className="fb-input"
              value={selectedField.max ?? ''}
              onChange={(e) =>
                handleChange(
                  'max',
                  e.target.value === '' ? null : Number(e.target.value)
                )
              }
            />
          </div>
        </>
      )}

      {hasOptions && (
        <div className="fb-prop-group">
          <label className="fb-prop-label">
            选项列表
            <button
              type="button"
              className="fb-btn fb-btn-small fb-btn-primary"
              onClick={handleAddOption}
            >
              + 添加
            </button>
          </label>
          <div className="fb-options-list">
            {(selectedField.options || []).map((opt, idx) => (
              <div key={idx} className="fb-option-row">
                <input
                  type="text"
                  className="fb-input fb-option-input"
                  placeholder="标签"
                  value={opt.label}
                  onChange={(e) =>
                    handleUpdateOption(idx, { label: e.target.value })
                  }
                />
                <input
                  type="text"
                  className="fb-input fb-option-input"
                  placeholder="值"
                  value={opt.value}
                  onChange={(e) =>
                    handleUpdateOption(idx, { value: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="fb-btn fb-btn-small fb-btn-danger"
                  onClick={() => handleDeleteOption(idx)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyPanel
