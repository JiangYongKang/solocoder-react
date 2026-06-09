import { useState } from 'react'
import { CUSTOMER_SOURCES, CUSTOMER_STATUS, CUSTOMER_STATUS_LABEL } from './constants.js'
import { validateCustomer } from './utils.js'

function getInitialFormData(initialData) {
  if (initialData) {
    return {
      name: initialData.name || '',
      company: initialData.company || '',
      phone: initialData.phone || '',
      email: initialData.email || '',
      source: initialData.source || CUSTOMER_SOURCES[0],
      status: initialData.status || CUSTOMER_STATUS.NEW,
      remark: initialData.remark || '',
    }
  }
  return {
    name: '',
    company: '',
    phone: '',
    email: '',
    source: CUSTOMER_SOURCES[0],
    status: CUSTOMER_STATUS.NEW,
    remark: '',
  }
}

export default function CustomerForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(() => getInitialFormData(initialData))
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (submitted) {
      const next = { ...formData, [field]: value }
      setErrors(validateCustomer(next))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    const validationErrors = validateCustomer(formData)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }
    const result = onSubmit(formData)
    if (result && result.success === false && result.errors) {
      setErrors(result.errors)
    }
  }

  return (
    <form className="customer-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-row">
          <label className="form-label">
            客户名称<span className="required">*</span>
          </label>
          <input
            type="text"
            className={`form-input ${errors.name ? 'has-error' : ''}`}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="请输入客户名称"
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>
        <div className="form-row">
          <label className="form-label">公司</label>
          <input
            type="text"
            className="form-input"
            value={formData.company}
            onChange={(e) => handleChange('company', e.target.value)}
            placeholder="请输入公司名称"
          />
        </div>
        <div className="form-row">
          <label className="form-label">
            联系电话<span className="required">*</span>
          </label>
          <input
            type="tel"
            className={`form-input ${errors.phone ? 'has-error' : ''}`}
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="请输入手机号码"
          />
          {errors.phone && <span className="form-error">{errors.phone}</span>}
        </div>
        <div className="form-row">
          <label className="form-label">邮箱</label>
          <input
            type="email"
            className={`form-input ${errors.email ? 'has-error' : ''}`}
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="请输入邮箱地址"
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>
        <div className="form-row">
          <label className="form-label">客户来源</label>
          <select
            className="form-select"
            value={formData.source}
            onChange={(e) => handleChange('source', e.target.value)}
          >
            {CUSTOMER_SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label className="form-label">客户状态</label>
          <select
            className="form-select"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            {Object.entries(CUSTOMER_STATUS_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <label className="form-label">备注</label>
        <textarea
          className="form-textarea"
          value={formData.remark}
          onChange={(e) => handleChange('remark', e.target.value)}
          placeholder="请输入备注信息"
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn btn-primary">
          {initialData ? '保存' : '创建'}
        </button>
      </div>
    </form>
  )
}
