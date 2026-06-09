import { useState } from 'react'
import {
  COUPON_TYPES,
  COUPON_TYPE_LABELS,
} from './constants.js'
import { validateCoupon, createCoupon, formatDate } from './couponUtils.js'

function todayStr() {
  return formatDate(Date.now())
}

export default function CouponCreateForm({ coupons, onCouponsChange }) {
  const [form, setForm] = useState({
    name: '',
    type: COUPON_TYPES.FULL_REDUCTION,
    denomination: '',
    threshold: '',
    startDate: todayStr(),
    endDate: '',
    totalCount: '',
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSuccess('')
    const validationErrors = validateCoupon(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    const result = createCoupon(coupons, form)
    if (!result.success) {
      setErrors(result.errors || {})
      return
    }
    onCouponsChange(result.coupons)
    setSuccess('优惠券创建成功！')
    setForm({
      name: '',
      type: COUPON_TYPES.FULL_REDUCTION,
      denomination: '',
      threshold: '',
      startDate: todayStr(),
      endDate: '',
      totalCount: '',
    })
    setTimeout(() => setSuccess(''), 2500)
  }

  const denominationPlaceholder =
    form.type === COUPON_TYPES.DISCOUNT ? '请输入折扣（1-9.9），例如8.8' : '请输入面额（元）'

  const showThreshold = form.type !== COUPON_TYPES.FLAT

  return (
    <div className="coupon-form-card">
      <h3 className="coupon-section-title">创建优惠券</h3>
      {success && <div className="coupon-success-tip">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="coupon-form-full">
          <label className="coupon-form-label">
            优惠券名称<span className="required">*</span>
          </label>
          <input
            type="text"
            className="coupon-form-input"
            placeholder="请输入优惠券名称，最多50字"
            value={form.name}
            maxLength={50}
            onChange={(e) => handleChange('name', e.target.value)}
          />
          {errors.name && <div className="coupon-form-error">{errors.name}</div>}
        </div>

        <div className="coupon-form-row">
          <div>
            <label className="coupon-form-label">
              优惠券类型<span className="required">*</span>
            </label>
            <select
              className="coupon-form-select"
              value={form.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value={COUPON_TYPES.FULL_REDUCTION}>{COUPON_TYPE_LABELS[COUPON_TYPES.FULL_REDUCTION]}</option>
              <option value={COUPON_TYPES.DISCOUNT}>{COUPON_TYPE_LABELS[COUPON_TYPES.DISCOUNT]}</option>
              <option value={COUPON_TYPES.FLAT}>{COUPON_TYPE_LABELS[COUPON_TYPES.FLAT]}</option>
            </select>
            {errors.type && <div className="coupon-form-error">{errors.type}</div>}
          </div>
          <div>
            <label className="coupon-form-label">
              {form.type === COUPON_TYPES.DISCOUNT ? '折扣' : '面额'}<span className="required">*</span>
            </label>
            <input
              type="number"
              step={form.type === COUPON_TYPES.DISCOUNT ? '0.1' : '0.01'}
              min={form.type === COUPON_TYPES.DISCOUNT ? '1' : '0.01'}
              max={form.type === COUPON_TYPES.DISCOUNT ? '9.9' : undefined}
              className="coupon-form-input"
              placeholder={denominationPlaceholder}
              value={form.denomination}
              onChange={(e) => handleChange('denomination', e.target.value)}
            />
            {errors.denomination && <div className="coupon-form-error">{errors.denomination}</div>}
          </div>
        </div>

        <div className="coupon-form-row">
          {showThreshold ? (
            <div>
              <label className="coupon-form-label">
                使用门槛（元）<span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="coupon-form-input"
                placeholder="请输入最低消费金额（元），必须为正数"
                value={form.threshold}
                onChange={(e) => handleChange('threshold', e.target.value)}
              />
              {errors.threshold && <div className="coupon-form-error">{errors.threshold}</div>}
            </div>
          ) : (
            <div>
              <label className="coupon-form-label">使用门槛</label>
              <input type="text" className="coupon-form-input" value="无门槛" disabled />
            </div>
          )}
          <div>
            <label className="coupon-form-label">
              发放总量<span className="required">*</span>
            </label>
            <input
              type="number"
              step="1"
              min="1"
              className="coupon-form-input"
              placeholder="请输入发放总数量"
              value={form.totalCount}
              onChange={(e) => handleChange('totalCount', e.target.value)}
            />
            {errors.totalCount && <div className="coupon-form-error">{errors.totalCount}</div>}
          </div>
        </div>

        <div className="coupon-form-row">
          <div>
            <label className="coupon-form-label">
              开始日期<span className="required">*</span>
            </label>
            <input
              type="date"
              className="coupon-form-input"
              value={form.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
            {errors.startDate && <div className="coupon-form-error">{errors.startDate}</div>}
          </div>
          <div>
            <label className="coupon-form-label">
              结束日期<span className="required">*</span>
            </label>
            <input
              type="date"
              className="coupon-form-input"
              value={form.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
            {errors.endDate && <div className="coupon-form-error">{errors.endDate}</div>}
          </div>
        </div>

        <div className="coupon-form-actions">
          <button type="submit" className="coupon-btn coupon-btn-primary">
            创建优惠券
          </button>
          <button
            type="button"
            className="coupon-btn"
            onClick={() => {
              setForm({
                name: '',
                type: COUPON_TYPES.FULL_REDUCTION,
                denomination: '',
                threshold: '',
                startDate: todayStr(),
                endDate: '',
                totalCount: '',
              })
              setErrors({})
            }}
          >
            重置
          </button>
        </div>
      </form>
    </div>
  )
}
