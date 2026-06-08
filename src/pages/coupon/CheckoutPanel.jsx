import { useState, useMemo } from 'react'
import {
  USER_COUPON_STATUS,
  COUPON_TYPE_LABELS,
  COUPON_TYPE_COLORS,
} from './constants.js'
import {
  getAvailableCouponsForOrder,
  getUserCouponStatus,
  calculateDiscount,
  markCouponAsUsed,
  formatPrice,
  formatCouponValue,
} from './couponUtils.js'

export default function CheckoutPanel({ userCoupons, onUserCouponsChange }) {
  const [orderAmount, setOrderAmount] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [tip, setTip] = useState('')
  const [errorTip, setErrorTip] = useState('')

  const amount = Number(orderAmount) || 0

  const available = useMemo(
    () => getAvailableCouponsForOrder(userCoupons, amount),
    [userCoupons, amount]
  )

  const selectedCoupon = useMemo(() => {
    if (!selectedId) return null
    const uc = userCoupons.find((c) => c.id === selectedId)
    if (!uc) return null
    const status = getUserCouponStatus(uc)
    if (status !== USER_COUPON_STATUS.UNUSED) return null
    if (amount < uc.threshold) return null
    return uc
  }, [selectedId, userCoupons, amount])

  const discountResult = useMemo(
    () => calculateDiscount(selectedCoupon, amount),
    [selectedCoupon, amount]
  )

  const handleUse = () => {
    setTip('')
    setErrorTip('')
    if (!selectedCoupon) {
      setErrorTip('请先选择一张优惠券')
      setTimeout(() => setErrorTip(''), 2500)
      return
    }
    const result = markCouponAsUsed(userCoupons, selectedCoupon.id)
    if (!result.success) {
      setErrorTip(result.error || '使用失败')
      setTimeout(() => setErrorTip(''), 2500)
      return
    }
    onUserCouponsChange(result.userCoupons)
    setTip(`使用成功！已优惠 ${formatPrice(discountResult.discountAmount)}，实付 ${formatPrice(discountResult.discountedAmount)}`)
    setSelectedId(null)
    setTimeout(() => setTip(''), 3500)
  }

  return (
    <div className="checkout-panel">
      <h3 className="coupon-section-title">模拟结算</h3>
      {tip && <div className="coupon-success-tip">{tip}</div>}
      {errorTip && <div className="coupon-error-tip">{errorTip}</div>}

      <div>
        <label className="coupon-form-label">
          订单金额（元）
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          className="checkout-amount-input"
          placeholder="请输入订单金额"
          value={orderAmount}
          onChange={(e) => {
            setOrderAmount(e.target.value)
            setSelectedId(null)
          }}
        />
      </div>

      <div className="checkout-summary">
        <div className="checkout-summary-row">
          <span>订单金额</span>
          <span>{formatPrice(amount)}</span>
        </div>
        {selectedCoupon && discountResult.discountAmount > 0 && (
          <div className="checkout-summary-row discount">
            <span>优惠金额（{selectedCoupon.name}）</span>
            <span>-{formatPrice(discountResult.discountAmount)}</span>
          </div>
        )}
        <div className="checkout-summary-row total">
          <span>实付金额</span>
          <span style={{ color: selectedCoupon ? '#ef4444' : 'var(--text-h)' }}>
            {formatPrice(discountResult.discountedAmount)}
          </span>
        </div>
      </div>

      <div className="checkout-coupon-list">
        <h4 className="checkout-coupon-list-title">可用优惠券</h4>
        {!amount || amount <= 0 ? (
          <div className="coupon-empty" style={{ padding: '30px 20px' }}>
            <div className="coupon-empty-text">请先输入订单金额</div>
          </div>
        ) : available.length === 0 ? (
          <div className="coupon-empty" style={{ padding: '30px 20px' }}>
            <div className="coupon-empty-text">当前订单暂无可使用的优惠券</div>
          </div>
        ) : (
          <>
            {available.map((uc) => {
              const isSelected = selectedId === uc.id
              const thisDiscount = calculateDiscount(uc, amount)
              return (
                <div
                  key={uc.id}
                  className={`checkout-coupon-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedId(uc.id)}
                >
                  <input
                    type="radio"
                    name="coupon"
                    checked={isSelected}
                    onChange={() => setSelectedId(uc.id)}
                  />
                  <div className="checkout-coupon-info">
                    <strong style={{
                      color: COUPON_TYPE_COLORS[uc.type],
                      marginRight: 8,
                    }}>
                      {COUPON_TYPE_LABELS[uc.type]}
                    </strong>
                    <strong>{uc.name}</strong>
                    <div className="checkout-coupon-hint">
                      {formatCouponValue(uc)} · 可省 {formatPrice(thisDiscount.discountAmount)}
                    </div>
                  </div>
                </div>
              )
            })}
            {selectedId && (
              <div className="checkout-warning">
                ⚠️ 优惠券不可叠加使用，一次只能选择一张
              </div>
            )}
          </>
        )}
      </div>

      <div className="coupon-form-actions" style={{ borderTop: 'none', marginTop: 20, paddingTop: 0 }}>
        <button
          className="coupon-btn coupon-btn-primary"
          onClick={handleUse}
          disabled={!selectedCoupon}
        >
          确认用券
        </button>
      </div>
    </div>
  )
}
