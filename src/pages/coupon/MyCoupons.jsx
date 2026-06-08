import { useState, useMemo } from 'react'
import {
  USER_COUPON_STATUS,
  USER_COUPON_STATUS_LABELS,
  COUPON_TYPE_LABELS,
  COUPON_TYPE_COLORS,
} from './constants.js'
import {
  filterUserCoupons,
  getUserCouponStatus,
  formatDate,
  formatCouponValue,
} from './couponUtils.js'

export default function MyCoupons({ userCoupons }) {
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(
    () => filterUserCoupons(userCoupons, filter),
    [userCoupons, filter]
  )

  const filterOptions = [
    { value: 'all', label: '全部' },
    { value: USER_COUPON_STATUS.UNUSED, label: USER_COUPON_STATUS_LABELS[USER_COUPON_STATUS.UNUSED] },
    { value: USER_COUPON_STATUS.USED, label: USER_COUPON_STATUS_LABELS[USER_COUPON_STATUS.USED] },
    { value: USER_COUPON_STATUS.EXPIRED, label: USER_COUPON_STATUS_LABELS[USER_COUPON_STATUS.EXPIRED] },
  ]

  return (
    <div>
      <h3 className="coupon-section-title">我的券包</h3>
      <div className="coupon-toolbar">
        <div className="coupon-sub-tabs" style={{ marginBottom: 0 }}>
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              className={`coupon-sub-tab ${filter === opt.value ? 'active' : ''}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="coupon-empty">
          <div className="coupon-empty-icon">🎟️</div>
          <div className="coupon-empty-text">暂无优惠券，去领券中心看看吧</div>
        </div>
      ) : (
        <div className="coupon-list">
          {filtered.map((uc) => {
            const status = getUserCouponStatus(uc)
            const isGray =
              status === USER_COUPON_STATUS.EXPIRED || status === USER_COUPON_STATUS.USED
            return (
              <div key={uc.id} className={`coupon-card ${isGray ? 'expired' : ''}`}>
                <div className="coupon-card-header">
                  <div className="coupon-card-info">
                    <h4 className="coupon-card-name">{uc.name}</h4>
                    <span
                      className="coupon-type-tag"
                      style={{ background: COUPON_TYPE_COLORS[uc.type] }}
                    >
                      {COUPON_TYPE_LABELS[uc.type]}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="coupon-card-value">
                      {uc.type === 'discount' ? (
                        <><small>{uc.denomination}</small>折</>
                      ) : (
                        <><small>¥</small>{uc.denomination}</>
                      )}
                    </p>
                    <p className="coupon-card-threshold">
                      {formatCouponValue(uc)}
                    </p>
                  </div>
                </div>
                <div className="coupon-card-body">
                  <div className="coupon-card-meta">
                    <span>有效期</span>
                    <span>{formatDate(uc.startDate)} ~ {formatDate(uc.endDate)}</span>
                  </div>
                  <div className="coupon-card-meta">
                    <span>状态</span>
                    <span style={{
                      color: status === USER_COUPON_STATUS.UNUSED ? '#10b981' :
                        status === USER_COUPON_STATUS.USED ? '#3b82f6' : '#9ca3af'
                    }}>
                      {USER_COUPON_STATUS_LABELS[status]}
                    </span>
                  </div>
                  {uc.usedAt && (
                    <div className="coupon-card-meta">
                      <span>使用时间</span>
                      <span>{formatDate(uc.usedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
