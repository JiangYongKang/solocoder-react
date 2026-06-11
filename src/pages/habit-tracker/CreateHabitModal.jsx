import { useState } from 'react'
import { HABIT_ICONS, FREQUENCY_TYPES } from './constants'

export default function CreateHabitModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: '',
    frequencyType: 'daily',
    frequencyCount: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = () => {
    const result = onCreate(form)
    if (!result.success) {
      setErrors(result.errors || {})
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">新建习惯</h2>
        <div className="habit-form">
          <div className="form-group">
            <label className="form-label">习惯名称</label>
            <input
              className="form-input"
              type="text"
              maxLength={50}
              placeholder="例如：每天跑步"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
            />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">习惯描述（选填）</label>
            <input
              className="form-input"
              type="text"
              placeholder="简要描述这个习惯"
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">习惯图标</label>
            <div className="icon-picker">
              {HABIT_ICONS.map(icon => (
                <button
                  key={icon}
                  className={`icon-picker-btn ${form.icon === icon ? 'active' : ''}`}
                  type="button"
                  onClick={() => handleChange('icon', icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
            {errors.icon && <div className="form-error">{errors.icon}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">目标频率</label>
            <select
              className="form-select"
              value={form.frequencyType}
              onChange={e => handleChange('frequencyType', e.target.value)}
            >
              {FREQUENCY_TYPES.map(f => (
                <option key={f.type} value={f.type}>{f.label}</option>
              ))}
            </select>
            {errors.frequencyType && <div className="form-error">{errors.frequencyType}</div>}
          </div>
          {form.frequencyType !== 'daily' && (
            <div className="form-group">
              <label className="form-label">
                {form.frequencyType === 'weekly' ? '每周次数' : '每月天数'}
              </label>
              <input
                className="form-input"
                type="number"
                min={1}
                max={form.frequencyType === 'weekly' ? 7 : 31}
                placeholder={form.frequencyType === 'weekly' ? '1-7' : '1-31'}
                value={form.frequencyCount}
                onChange={e => handleChange('frequencyCount', e.target.value)}
              />
              {errors.frequencyCount && <div className="form-error">{errors.frequencyCount}</div>}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>创建</button>
        </div>
      </div>
    </div>
  )
}
