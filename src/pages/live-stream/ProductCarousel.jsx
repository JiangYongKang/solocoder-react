import { useEffect, useRef, useState } from 'react';
import { DEFAULT_PRODUCTS, CAROUSEL_INTERVAL } from './constants.js';
import {
  formatPrice,
  getDiscountPercent,
  getNextCarouselIndex,
  getPrevCarouselIndex,
  getClampedCarouselIndex,
} from './utils.js';

export default function ProductCarousel({ currentIndex, setCurrentIndex, products = DEFAULT_PRODUCTS, onManualChange }) {
  const [touchStartX, setTouchStartX] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoTimerRef = useRef(null);
  const safeIndex = getClampedCarouselIndex(currentIndex, products.length);

  useEffect(() => {
    if (!isAutoPlaying) return;
    autoTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => getNextCarouselIndex(prev, products.length));
    }, CAROUSEL_INTERVAL);
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [isAutoPlaying, products.length, setCurrentIndex]);

  const handlePrev = () => {
    setIsAutoPlaying(true);
    const next = getPrevCarouselIndex(safeIndex, products.length);
    setCurrentIndex(next);
    onManualChange && onManualChange(next);
  };

  const handleNext = () => {
    setIsAutoPlaying(true);
    const next = getNextCarouselIndex(safeIndex, products.length);
    setCurrentIndex(next);
    onManualChange && onManualChange(next);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setIsAutoPlaying(false);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0) handleNext();
      else handlePrev();
    }
    setTouchStartX(null);
    setTimeout(() => setIsAutoPlaying(true), 500);
  };

  const handleMouseDown = (e) => {
    setTouchStartX(e.clientX);
    setIsAutoPlaying(false);
  };

  const handleMouseUp = (e) => {
    if (touchStartX === null) return;
    const diff = e.clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0) handleNext();
      else handlePrev();
    }
    setTouchStartX(null);
    setTimeout(() => setIsAutoPlaying(true), 500);
  };

  const product = products[safeIndex];

  return (
    <div className="ls-product-carousel">
      <button className="ls-carousel-btn ls-carousel-prev" onClick={handlePrev} aria-label="上一个商品">‹</button>

      <div
        className="ls-carousel-viewport"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div
          className="ls-carousel-track"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {products.map((p, idx) => {
            const isActive = idx === safeIndex;
            const pDiscount = getDiscountPercent(p.originalPrice, p.livePrice);
            return (
              <div
                key={p.id}
                className={`ls-product-card ${isActive ? 'ls-product-card--active' : ''}`}
                onClick={() => {
                  setCurrentIndex(idx);
                  onManualChange && onManualChange(idx);
                }}
              >
                {isActive && <div className="ls-product-glow" />}
                {isActive && <div className="ls-speaking-tag">🔥 讲解中</div>}
                <div
                  className="ls-product-image"
                  style={{ background: p.bgColor || '#f0f0f0' }}
                >
                  <img src={p.image} alt={p.name} loading="lazy" />
                  {pDiscount > 0 && (
                    <div className="ls-product-discount-badge">省{pDiscount}%</div>
                  )}
                </div>
                <div className="ls-product-info">
                  <h3 className="ls-product-name">{p.name}</h3>
                  <p className="ls-product-desc">{p.description}</p>
                  <div className="ls-product-prices">
                    <span className="ls-product-liveprice">{formatPrice(p.livePrice)}</span>
                    <span className="ls-product-origprice">{formatPrice(p.originalPrice)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="ls-carousel-btn ls-carousel-next" onClick={handleNext} aria-label="下一个商品">›</button>

      <div className="ls-carousel-dots">
        {products.map((_, idx) => (
          <button
            key={idx}
            className={`ls-carousel-dot ${idx === safeIndex ? 'ls-carousel-dot--active' : ''}`}
            onClick={() => {
              setCurrentIndex(idx);
              onManualChange && onManualChange(idx);
            }}
            aria-label={`切换到第${idx + 1}个商品`}
          />
        ))}
      </div>

      <div className="ls-product-highlight-info">
        <div className="ls-highlight-left">
          <span className="ls-highlight-label">正在讲解</span>
          <span className="ls-highlight-name">{product.name}</span>
        </div>
        <div className="ls-highlight-right">
          <span className="ls-highlight-price">{formatPrice(product.livePrice)}</span>
          <span className="ls-highlight-tag">直播间专享</span>
        </div>
      </div>
    </div>
  );
}
