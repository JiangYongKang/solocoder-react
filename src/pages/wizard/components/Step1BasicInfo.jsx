export default function Step1BasicInfo({ data, errors, onChange }) {
  return (
    <div className="step-content">
      <h2 className="step-title">基本信息</h2>
      <p className="step-subtitle">请填写您的基本个人信息</p>

      <div className="form-group">
        <label className="form-label">姓名</label>
        <input
          type="text"
          className={`form-input ${errors.name ? 'input-error' : ''}`}
          placeholder="请输入姓名（2-20 字符）"
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">邮箱</label>
        <input
          type="email"
          className={`form-input ${errors.email ? 'input-error' : ''}`}
          placeholder="请输入邮箱地址"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
        />
        {errors.email && <p className="form-error">{errors.email}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">手机号</label>
        <input
          type="text"
          className={`form-input ${errors.phone ? 'input-error' : ''}`}
          placeholder="请输入 11 位手机号"
          maxLength={11}
          inputMode="numeric"
          value={data.phone}
          onChange={(e) => onChange('phone', e.target.value.replace(/\D/g, ''))}
        />
        {errors.phone && <p className="form-error">{errors.phone}</p>}
      </div>
    </div>
  )
}
