import { useState, useMemo } from 'react'
import {
  COUPON_TYPE_LABELS,
  COUPON_TYPE_COLORS,
} from './constants.js'
import {
  getClaimableCoupons,
  claimCoupon,
  formatDate,
  formatCouponValue,
} from './couponUtils.js'

export default function CouponCenter({ coupons, userCoupons, onCouponsChange, onUserCouponsChange }) {
  const [tip, setTip] = useState('')
  const [errorTip, setErrorTip] = useState('')

  const claimable = useMemo(
    () => getClaimableCoupons(coupons, userCoupons),
    [coupons, userCoupons]
  )

  const handleClaim = (couponId) => {
    setTip('')
    setErrorTip('')
    const result = claimCoupon(coupons, userCoupons, couponId)
    if (!result.success) {
      setErrorTip(result.error || '领取失败')
      setTimeout(() => setErrorTip(''), 2500)
      return
    }
    onCouponsChange(result.coupons)
    onUserCouponsChange(result.userCoupons)
    setTip('领取成功！可在"我的券包"中查看')
    setTimeout(() => setTip(''), 2500)
  }

  return (
    <div>
      <h3 className="coupon-section-title">领券中心</h3>
      {tip && <div className="coupon-success-tip">{tip}</div>}
      {errorTip && <div className="coupon-error-tip">{errorTip}</div>}

      {claimable.length === 0 ? (
        <div className="coupon-empty">
          <div className="coupon-empty-icon">🎁</div>
          <div className="coupon-empty-text">暂无可领取的优惠券</div>
        </div>
      ) : (
        <div className="coupon-list">
          {claimable.map((coupon) => (
            <div key={coupon.id} className="coupon-card">
              <div className="coupon-card-header">
                <div className="coupon-card-info">
                  <h4 className="coupon-card-name">{coupon.name}</h4>
                  <span
                    className="coupon-type-tag"
                    style={{ background: COUPON_TYPE_COLORS[coupon.type] }}
                  >
                    {COUPON_TYPE_LABELS[coupon.type]}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="coupon-card-value">
                    {coupon.type === 'discount' ? (
                      <><small>{coupon.denomination}</small>折</>
                    ) : (
                      <><small>¥</small>{coupon.denomination}</>
                    )}
                  </p>
                  <p className="coupon-card-threshold">
                    {formatCouponValue(coupon)}
                  </p>
                </div>
              </div>
              <div className="coupon-card-body">
                <div className="coupon-card-meta">
                  <span>有效期</span>
                  <span>{formatDate(coupon.startDate)} ~ {formatDate(coupon.endDate)}</span>
                </div>
                <div className="coupon-card-stock">
                  剩余库存：<strong>{coupon.totalCount - coupon.receivedCount}</strong> / {coupon.totalCount}
                </div>
              </div>
              <div className="coupon-card-footer">
                <button
                  className="coupon-btn coupon-btn-primary"
                  onClick={() => handleClaim(coupon.id)}
                >
                  立即领取
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
