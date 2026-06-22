import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './live-stream.css';
import ProductCarousel from './ProductCarousel.jsx';
import DanmakuArea from './DanmakuArea.jsx';
import ShoppingBag from './ShoppingBag.jsx';
import CouponTimer from './CouponTimer.jsx';
import { LikeButton, OnlineCounter, LiveHeader } from './LiveWidgets.jsx';
import { DEFAULT_PRODUCTS, DEFAULT_COUPONS, LIVE_STATS_INITIAL } from './constants.js';

export default function LiveStreamPage() {
  const navigate = useNavigate();

  const [products] = useState(DEFAULT_PRODUCTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bag, setBag] = useState([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [claimedCoupons, setClaimedCoupons] = useState([]);
  const [likeCount, setLikeCount] = useState(LIVE_STATS_INITIAL.likeCount);

  const currentProduct = products[currentIndex];

  const handleClaimCoupon = useCallback((coupon) => {
    setClaimedCoupons((prev) => {
      if (prev.some((c) => c.id === coupon.id)) return prev;
      return [...prev, coupon];
    });
    setBagOpen(true);
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="ls-page">
      <div className="ls-top-bar">
        <button className="ls-back-btn" onClick={handleBack}>
          ← 返回
        </button>
        <LiveHeader />
        <OnlineCounter />
      </div>

      <CouponTimer
        coupons={DEFAULT_COUPONS}
        claimedIds={claimedCoupons.map((c) => c.id)}
        onClaim={handleClaimCoupon}
      />

      <ProductCarousel
        products={products}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
      />

      <div className="ls-main-row">
        <DanmakuArea currentProduct={currentProduct} />
        <div style={{
          padding: '16px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px',
          backdropFilter: 'blur(6px)',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>🎁 直播间福利</h3>
          <ul style={{
            margin: 0,
            paddingLeft: 20,
            lineHeight: 1.9,
            fontSize: 13,
            color: 'rgba(255,255,255,0.8)',
          }}>
            <li>全部商品 <b style={{ color: '#ffd700' }}>包邮</b>，7天无理由退换</li>
            <li>下单即赠 <b style={{ color: '#ffd700' }}>精美礼品袋</b></li>
            <li>前 <b style={{ color: '#ff006e' }}>100 名</b> 下单再减 20 元</li>
            <li>点赞破 <b style={{ color: '#c77dff' }}>5 万</b> 抽免单</li>
            <li>分享直播间得 <b style={{ color: '#10b981' }}>专属折扣码</b></li>
          </ul>
          <div style={{
            marginTop: 16,
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(255,77,109,0.2), rgba(199,125,255,0.18))',
            borderRadius: 12,
            fontSize: 13,
            lineHeight: 1.6,
          }}>
            💡 提示：点击 <b>🛍️ 购物袋</b> 查看/添加商品，
            点击右下角 <b>❤️ 点赞</b> 为直播间打call～
            <br />
            优惠券倒计时结束会自动切换到下一张，记得准时领取哦！
          </div>
        </div>
      </div>

      <ShoppingBag
        bag={bag}
        setBag={setBag}
        currentProduct={currentProduct}
        coupons={claimedCoupons}
        isOpen={bagOpen}
        setIsOpen={setBagOpen}
      />

      <LikeButton likeCount={likeCount} setLikeCount={setLikeCount} />
    </div>
  );
}
