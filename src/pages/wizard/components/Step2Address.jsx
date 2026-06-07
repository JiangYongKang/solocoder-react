import { PROVINCES, CITIES } from '../data/cities'

export default function Step2Address({ data, errors, onChange }) {
  const cityList = data.province ? CITIES[data.province] || [] : []

  const handleProvinceChange = (value) => {
    onChange('province', value)
    onChange('city', '')
  }

  return (
    <div className="step-content">
      <h2 className="step-title">地址信息</h2>
      <p className="step-subtitle">请填写您的联系地址</p>

      <div className="form-group">
        <label className="form-label">省份</label>
        <select
          className={`form-select ${errors.province ? 'input-error' : ''}`}
          value={data.province}
          onChange={(e) => handleProvinceChange(e.target.value)}
        >
          <option value="">请选择省份</option>
          {PROVINCES.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
        {errors.province && <p className="form-error">{errors.province}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">城市</label>
        <select
          className={`form-select ${errors.city ? 'input-error' : ''}`}
          value={data.city}
          onChange={(e) => onChange('city', e.target.value)}
          disabled={!data.province}
        >
          <option value="">{data.province ? '请选择城市' : '请先选择省份'}</option>
          {cityList.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.city && <p className="form-error">{errors.city}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">详细地址</label>
        <textarea
          className={`form-textarea ${errors.address ? 'input-error' : ''}`}
          placeholder="请输入详细地址（不超过 200 字符）"
          maxLength={200}
          rows={3}
          value={data.address}
          onChange={(e) => onChange('address', e.target.value)}
        />
        <div className="char-counter">{data.address?.length || 0}/200</div>
        {errors.address && <p className="form-error">{errors.address}</p>}
      </div>
    </div>
  )
}
