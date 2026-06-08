import { useState, useMemo } from 'react'
import {
  COUPON_STATUS,
  COUPON_STATUS_LABELS,
  COUPON_TYPE_LABELS,
  COUPON_TYPE_COLORS,
} from './constants.js'
import {
  getCouponList,
  getCouponStatus,
  formatDate,
  deleteCoupon,
  formatCouponValue,
} from './couponUtils.js'

export default function CouponList({ coupons, onCouponsChange }) {
  const [status, setStatus] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  const pagination = useMemo(
    () => getCouponList(coupons, { status, keyword, page }),
    [coupons, status, keyword, page]
  )

  const statusOptions = [
    { value: 'all', label: '全部' },
    { value: COUPON_STATUS.NOT_STARTED, label: COUPON_STATUS_LABELS[COUPON_STATUS.NOT_STARTED] },
    { value: COUPON_STATUS.ONGOING, label: COUPON_STATUS_LABELS[COUPON_STATUS.ONGOING] },
    { value: COUPON_STATUS.EXPIRED, label: COUPON_STATUS_LABELS[COUPON_STATUS.EXPIRED] },
  ]

  const handleDelete = (id) => {
    if (!window.confirm('确定要删除该优惠券吗？')) return
    const result = deleteCoupon(coupons, id)
    if (result.success) {
      onCouponsChange(result.coupons)
    }
  }

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null
    const pages = []
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(i)
    }
    return (
      <div className="coupon-pagination">
        <button
          className="coupon-pagination-btn"
          disabled={pagination.currentPage <= 1}
          onClick={() => setPage(pagination.currentPage - 1)}
        >
          上一页
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`coupon-pagination-btn ${p === pagination.currentPage ? 'active' : ''}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="coupon-pagination-btn"
          disabled={pagination.currentPage >= pagination.totalPages}
          onClick={() => setPage(pagination.currentPage + 1)}
        >
          下一页
        </button>
        <span className="coupon-pagination-info">
          共 {pagination.total} 条
        </span>
      </div>
    )
  }

  return (
    <div>
      <h3 className="coupon-section-title">优惠券列表</h3>
      <div className="coupon-toolbar">
        <div className="coupon-sub-tabs" style={{ marginBottom: 0 }}>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              className={`coupon-sub-tab ${status === opt.value ? 'active' : ''}`}
              onClick={() => {
                setStatus(opt.value)
                setPage(1)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="coupon-search"
          placeholder="搜索优惠券名称..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {pagination.items.length === 0 ? (
        <div className="coupon-empty">
          <div className="coupon-empty-icon">🎫</div>
          <div className="coupon-empty-text">暂无优惠券</div>
        </div>
      ) : (
        <>
          <div className="coupon-list">
            {pagination.items.map((coupon) => {
              const cs = getCouponStatus(coupon)
              const isExpired = cs === COUPON_STATUS.EXPIRED
              return (
                <div key={coupon.id} className={`coupon-card ${isExpired ? 'expired' : ''}`}>
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
                    <div className="coupon-card-meta">
                      <span>状态</span>
                      <span style={{
                        color: cs === COUPON_STATUS.ONGOING ? '#10b981' :
                          cs === COUPON_STATUS.NOT_STARTED ? '#f59e0b' : '#9ca3af'
                      }}>
                        {COUPON_STATUS_LABELS[cs]}
                      </span>
                    </div>
                    <div className="coupon-card-stock">
                      剩余库存：<strong>{coupon.totalCount - coupon.receivedCount}</strong> / {coupon.totalCount}
                    </div>
                  </div>
                  <div className="coupon-card-footer">
                    <button
                      className="coupon-btn coupon-btn-danger"
                      onClick={() => handleDelete(coupon.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  )
}
