import { INTEREST_FIELDS, NOTIFICATION_METHODS, USAGE_FREQUENCIES } from '../data/cities'

export default function Step3Preferences({ data, errors, onChange }) {
  const toggleInterest = (code) => {
    const current = data.interests || []
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code]
    onChange('interests', next)
  }

  return (
    <div className="step-content">
      <h2 className="step-title">偏好设置</h2>
      <p className="step-subtitle">请选择您的使用偏好</p>

      <div className="form-group">
        <label className="form-label">感兴趣的领域（可多选）</label>
        <div className="checkbox-group">
          {INTEREST_FIELDS.map((field) => (
            <label
              key={field.code}
              className={`checkbox-item ${(data.interests || []).includes(field.code) ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={(data.interests || []).includes(field.code)}
                onChange={() => toggleInterest(field.code)}
              />
              <span className="checkbox-custom" />
              <span className="checkbox-label">{field.name}</span>
            </label>
          ))}
        </div>
        {errors.interests && <p className="form-error">{errors.interests}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">接收通知方式</label>
        <div className="radio-group">
          {NOTIFICATION_METHODS.map((method) => (
            <label
              key={method.code}
              className={`radio-item ${data.notification === method.code ? 'checked' : ''}`}
            >
              <input
                type="radio"
                name="notification"
                checked={data.notification === method.code}
                onChange={() => onChange('notification', method.code)}
              />
              <span className="radio-custom" />
              <span className="radio-label">{method.name}</span>
            </label>
          ))}
        </div>
        {errors.notification && <p className="form-error">{errors.notification}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">使用频率</label>
        <div className="radio-group">
          {USAGE_FREQUENCIES.map((freq) => (
            <label
              key={freq.code}
              className={`radio-item ${data.frequency === freq.code ? 'checked' : ''}`}
            >
              <input
                type="radio"
                name="frequency"
                checked={data.frequency === freq.code}
                onChange={() => onChange('frequency', freq.code)}
              />
              <span className="radio-custom" />
              <span className="radio-label">{freq.name}</span>
            </label>
          ))}
        </div>
        {errors.frequency && <p className="form-error">{errors.frequency}</p>}
      </div>
    </div>
  )
}
