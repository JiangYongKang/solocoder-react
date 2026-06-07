import { FIELD_TYPES } from './formBuilderCore'

function FormField({ field, isPreview, formValue, onFormValueChange }) {
  const commonLabel = (
    <label className="fb-field-label-el">
      {field.label}
      {field.required && <span className="fb-required"> *</span>}
    </label>
  )

  if (isPreview) {
    return (
      <div className="fb-form-field">
        {commonLabel}
        <div className="fb-field-control">
          {renderPreviewControl(field, formValue, onFormValueChange)}
        </div>
      </div>
    )
  }

  return (
    <div className="fb-form-field">
      {commonLabel}
      <div className="fb-field-control">
        {renderDesignControl(field)}
      </div>
    </div>
  )
}

function renderDesignControl(field) {
  switch (field.type) {
    case FIELD_TYPES.TEXT:
      return (
        <input
          type="text"
          className="fb-input"
          placeholder={field.placeholder || '单行文本'}
          disabled
        />
      )
    case FIELD_TYPES.TEXTAREA:
      return (
        <textarea
          className="fb-textarea"
          placeholder={field.placeholder || '多行文本'}
          disabled
          rows={3}
        />
      )
    case FIELD_TYPES.SELECT:
      return (
        <select className="fb-select" disabled>
          <option value="">{field.placeholder || '请选择...'}</option>
          {(field.options || []).map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )
    case FIELD_TYPES.RADIO:
      return (
        <div className="fb-radio-group">
          {(field.options || []).map((opt, i) => (
            <label key={i} className="fb-radio-item">
              <input type="radio" disabled />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )
    case FIELD_TYPES.CHECKBOX:
      return (
        <div className="fb-checkbox-group">
          {(field.options || []).map((opt, i) => (
            <label key={i} className="fb-checkbox-item">
              <input type="checkbox" disabled />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )
    case FIELD_TYPES.DATE:
      return (
        <input
          type="date"
          className="fb-input fb-date-input"
          disabled
        />
      )
    case FIELD_TYPES.NUMBER:
      return (
        <input
          type="number"
          className="fb-input fb-number-input"
          placeholder={field.placeholder || '请输入数字'}
          min={field.min}
          max={field.max}
          disabled
        />
      )
    case FIELD_TYPES.SWITCH:
      return (
        <label className="fb-switch">
          <input type="checkbox" disabled />
          <span className="fb-switch-slider" />
        </label>
      )
    default:
      return null
  }
}

function renderPreviewControl(field, value, onChange) {
  const handleChange = (e) => {
    if (!onChange) return
    onChange(field.id, e.target.value)
  }

  const handleCheckboxGroupChange = (e) => {
    if (!onChange) return
    const current = Array.isArray(value) ? [...value] : []
    if (e.target.checked) {
      current.push(e.target.value)
    } else {
      const idx = current.indexOf(e.target.value)
      if (idx > -1) current.splice(idx, 1)
    }
    onChange(field.id, current)
  }

  const handleSwitchChange = (e) => {
    if (!onChange) return
    onChange(field.id, e.target.checked)
  }

  switch (field.type) {
    case FIELD_TYPES.TEXT:
      return (
        <input
          type="text"
          className="fb-input"
          placeholder={field.placeholder || '请输入'}
          value={value || ''}
          onChange={handleChange}
        />
      )
    case FIELD_TYPES.TEXTAREA:
      return (
        <textarea
          className="fb-textarea"
          placeholder={field.placeholder || '请输入'}
          rows={3}
          value={value || ''}
          onChange={handleChange}
        />
      )
    case FIELD_TYPES.SELECT:
      return (
        <select className="fb-select" value={value || ''} onChange={handleChange}>
          <option value="">{field.placeholder || '请选择...'}</option>
          {(field.options || []).map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )
    case FIELD_TYPES.RADIO:
      return (
        <div className="fb-radio-group">
          {(field.options || []).map((opt, i) => (
            <label key={i} className="fb-radio-item">
              <input
                type="radio"
                name={`radio-${field.id}`}
                value={opt.value}
                checked={value === opt.value}
                onChange={handleChange}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )
    case FIELD_TYPES.CHECKBOX: {
      const checkedValues = Array.isArray(value) ? value : []
      return (
        <div className="fb-checkbox-group">
          {(field.options || []).map((opt, i) => (
            <label key={i} className="fb-checkbox-item">
              <input
                type="checkbox"
                value={opt.value}
                checked={checkedValues.includes(opt.value)}
                onChange={handleCheckboxGroupChange}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )
    }
    case FIELD_TYPES.DATE:
      return (
        <input
          type="date"
          className="fb-input fb-date-input"
          value={value || ''}
          onChange={handleChange}
        />
      )
    case FIELD_TYPES.NUMBER:
      return (
        <input
          type="number"
          className="fb-input fb-number-input"
          placeholder={field.placeholder || '请输入数字'}
          min={field.min}
          max={field.max}
          value={value ?? ''}
          onChange={(e) => {
            if (!onChange) return
            const val = e.target.value === '' ? '' : Number(e.target.value)
            onChange(field.id, val)
          }}
        />
      )
    case FIELD_TYPES.SWITCH:
      return (
        <label className="fb-switch">
          <input
            type="checkbox"
            checked={!!value}
            onChange={handleSwitchChange}
          />
          <span className="fb-switch-slider" />
        </label>
      )
    default:
      return null
  }
}

export default FormField
