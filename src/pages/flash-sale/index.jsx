import { useNavigate } from 'react-router-dom'
import './flash-sale.css'
import { useFlashSale } from './useFlashSale.js'
import { FLASH_SALE_STATUS, FLASH_SALE_STATUS_LABELS } from './constants.js'
import { formatPrice } from './flashSaleUtils.js'

const FlashSalePage = () => {
  const navigate = useNavigate()
  const {
    product,
    status,
    countdown,
    currentStock,
    stockPercentage,
    soldCount,
    stockColor,
    isPurchasing,
    buttonClickable,
    buttonText,
    toast,
    handlePurchase,
  } = useFlashSale()

  const countdownLabel =
    status === FLASH_SALE_STATUS.NOT_STARTED
      ? '距离活动开始还有'
      : status === FLASH_SALE_STATUS.ONGOING
      ? '距离活动结束还有'
      : '活动已'

  const discountPercent = Math.round(
    (1 - product.flashPrice / product.originalPrice) * 100
  )

  return (
    <div className="flash-sale-page">
      <div className="flash-sale-header">
        <button className="flash-sale-back-btn" onClick={() => navigate('/')}>
          ← 返回
        </button>
        <h1 className="flash-sale-title">秒杀抢购</h1>
      </div>

      <div className="countdown-section">
        <div className="countdown-label">{countdownLabel}</div>
        <div className="countdown-timer">
          <div className="countdown-item">
            <div className="countdown-number">{countdown.days}</div>
            <div className="countdown-unit">天</div>
          </div>
          <div className="countdown-separator">:</div>
          <div className="countdown-item">
            <div className="countdown-number">{countdown.hours}</div>
            <div className="countdown-unit">时</div>
          </div>
          <div className="countdown-separator">:</div>
          <div className="countdown-item">
            <div className="countdown-number">{countdown.minutes}</div>
            <div className="countdown-unit">分</div>
          </div>
          <div className="countdown-separator">:</div>
          <div className="countdown-item">
            <div className="countdown-number">{countdown.seconds}</div>
            <div className="countdown-unit">秒</div>
          </div>
        </div>
        <div className="countdown-status-badge">
          {FLASH_SALE_STATUS_LABELS[status]}
        </div>
      </div>

      <div className="product-section">
        <div className="product-image-wrapper">
          <img className="product-image" src={product.image} alt={product.name} />
        </div>
        <h2 className="product-name">{product.name}</h2>
        <p className="product-description">{product.description}</p>

        <div className="price-section">
          <span className="flash-price">
            <span className="flash-price-symbol">¥</span>
            {product.flashPrice.toFixed(2)}
          </span>
          <span className="original-price">{formatPrice(product.originalPrice)}</span>
          <span className="discount-badge">省{discountPercent}%</span>
        </div>

        <div className="stock-section">
          <div className="stock-info">
            <span className="stock-text">
              已抢 <strong>{soldCount}</strong> 件，剩余 <strong>{currentStock}</strong> 件
            </span>
            <span
              className="stock-percentage"
              style={{ color: stockColor }}
            >
              {stockPercentage}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${stockPercentage}%`,
                backgroundColor: stockColor,
              }}
            />
          </div>
        </div>
      </div>

      <div className="action-section">
        <button
          className={`purchase-btn ${buttonClickable ? 'active' : 'disabled'} ${isPurchasing ? 'loading' : ''}`}
          onClick={handlePurchase}
          disabled={!buttonClickable}
        >
          {isPurchasing && <div className="loading-spinner" />}
          {buttonText}
        </button>
      </div>

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}

export default FlashSalePage
