import { useEffect, useState } from 'react';
import { COUPON_DURATION_MS, DEFAULT_COUPONS } from './constants.js';
import {
  formatCountdown,
  nextCouponIndex,
} from './utils.js';

export default function CouponTimer({ coupons = DEFAULT_COUPONS, onClaim, claimedIds = [] }) {
  const [couponIndex, setCouponIndex] = useState(0);
  const [remainingMs, setRemainingMs] = useState(COUPON_DURATION_MS);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) {
          setCouponIndex((idx) => nextCouponIndex(idx, coupons.length));
          return COUPON_DURATION_MS;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [coupons.length]);

  const coupon = coupons[couponIndex] || coupons[0];
  const countdown = formatCountdown(remainingMs);
  const isClaimed = claimedIds.includes(coupon?.id);

  const handleClaim = () => {
    if (!coupon || isClaimed) return;
    onClaim && onClaim(coupon);
  };

  if (!coupon) return null;

  return (
    <div className={`ls-coupon-timer ${isClaimed ? 'is-claimed' : ''}`}>
      <div className="ls-coupon-left">
        <div className="ls-coupon-amount">{coupon.amount}</div>
        <div className="ls-coupon-unit">元券</div>
      </div>
      <div className="ls-coupon-divider">
        <span className="ls-coupon-notch ls-coupon-notch--top" />
        <span className="ls-coupon-notch ls-coupon-notch--bottom" />
      </div>
      <div className="ls-coupon-right">
        <div className="ls-coupon-name">{coupon.name}</div>
        <div className="ls-coupon-threshold">满{coupon.threshold}元可用</div>
        <div className="ls-coupon-countdown">
          {countdown.expired ? (
            <span className="ls-countdown-expired">已过期</span>
          ) : (
            <>
              <span className="ls-countdown-label">⏰ 领取倒计时</span>
              <span className="ls-countdown-time">
                <i>{countdown.minutes}</i>
                <em>:</em>
                <i>{countdown.seconds}</i>
              </span>
            </>
          )}
        </div>
        <button
          className={`ls-coupon-claim-btn ${isClaimed ? 'is-claimed' : ''}`}
          onClick={handleClaim}
          disabled={isClaimed || countdown.expired}
        >
          {isClaimed ? '✓ 已领取' : '立即领取'}
        </button>
      </div>
    </div>
  );
}
