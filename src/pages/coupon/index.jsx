import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './coupon.css'
import {
  loadCoupons,
  saveCoupons,
  loadUserCoupons,
  saveUserCoupons,
} from './couponUtils.js'
import CouponCreateForm from './CouponCreateForm.jsx'
import CouponList from './CouponList.jsx'
import CouponCenter from './CouponCenter.jsx'
import MyCoupons from './MyCoupons.jsx'
import CheckoutPanel from './CheckoutPanel.jsx'

const VIEW_MERCHANT = 'merchant'
const VIEW_USER = 'user'

export default function CouponPage() {
  const navigate = useNavigate()
  const [view, setView] = useState(VIEW_MERCHANT)
  const [userSubTab, setUserSubTab] = useState('center')
  const [coupons, setCoupons] = useState(() => loadCoupons())
  const [userCoupons, setUserCoupons] = useState(() => loadUserCoupons())

  const handleCouponsChange = (next) => {
    setCoupons(next)
    saveCoupons(next)
  }

  const handleUserCouponsChange = (next) => {
    setUserCoupons(next)
    saveUserCoupons(next)
  }

  return (
    <div className="coupon-page">
      <button
        className="coupon-btn"
        style={{ alignSelf: 'flex-start', marginBottom: 16 }}
        onClick={() => navigate('/')}
      >
        ← 返回首页
      </button>
      <h1 className="coupon-page-title">优惠券管理系统</h1>
      <p className="coupon-page-desc">模拟电商平台优惠券全生命周期管理，支持商家发券与用户领券用券</p>

      <div className="coupon-tabs">
        <button
          className={`coupon-tab ${view === VIEW_MERCHANT ? 'active' : ''}`}
          onClick={() => setView(VIEW_MERCHANT)}
        >
          🏪 商家视角
        </button>
        <button
          className={`coupon-tab ${view === VIEW_USER ? 'active' : ''}`}
          onClick={() => setView(VIEW_USER)}
        >
          🛒 用户视角
        </button>
      </div>

      {view === VIEW_MERCHANT && (
        <>
          <CouponCreateForm coupons={coupons} onCouponsChange={handleCouponsChange} />
          <CouponList coupons={coupons} onCouponsChange={handleCouponsChange} />
        </>
      )}

      {view === VIEW_USER && (
        <>
          <div className="coupon-sub-tabs">
            <button
              className={`coupon-sub-tab ${userSubTab === 'center' ? 'active' : ''}`}
              onClick={() => setUserSubTab('center')}
            >
              领券中心
            </button>
            <button
              className={`coupon-sub-tab ${userSubTab === 'my' ? 'active' : ''}`}
              onClick={() => setUserSubTab('my')}
            >
              我的券包
            </button>
            <button
              className={`coupon-sub-tab ${userSubTab === 'checkout' ? 'active' : ''}`}
              onClick={() => setUserSubTab('checkout')}
            >
              下单用券
            </button>
          </div>
          {userSubTab === 'center' && (
            <CouponCenter
              coupons={coupons}
              userCoupons={userCoupons}
              onCouponsChange={handleCouponsChange}
              onUserCouponsChange={handleUserCouponsChange}
            />
          )}
          {userSubTab === 'my' && <MyCoupons userCoupons={userCoupons} />}
          {userSubTab === 'checkout' && (
            <CheckoutPanel
              userCoupons={userCoupons}
              onUserCouponsChange={handleUserCouponsChange}
            />
          )}
        </>
      )}
    </div>
  )
}
