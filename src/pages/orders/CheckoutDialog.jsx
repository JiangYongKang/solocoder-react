import { formatPrice, calcCartTotal, handleImageFallback } from './utils.js';

export default function CheckoutDialog({ isOpen, onClose, cart, address, onOpenAddress, onSubmit }) {
  if (!isOpen) return null;
  const total = calcCartTotal(cart);

  return (
    <>
      <div className="orders-modal-overlay" onClick={onClose} />
      <div className="orders-modal orders-modal-lg">
        <div className="orders-modal-header">
          <h2>确认订单</h2>
          <button type="button" className="orders-modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="orders-modal-body">
          <div className="orders-checkout-section">
            <div className="orders-section-title-row">
              <span className="orders-section-title">收货地址</span>
              <button type="button" className="orders-link-btn" onClick={onOpenAddress}>
                {address ? '修改地址' : '添加地址'}
              </button>
            </div>
            {address ? (
              <div className="orders-checkout-address">
                <div>
                  <strong>{address.receiver}</strong>
                  <span className="orders-item-address-phone">{address.phone}</span>
                </div>
                <div className="orders-item-address-detail">
                  {address.province} {address.city} {address.district} {address.detail}
                </div>
              </div>
            ) : (
              <div className="orders-empty">请先添加收货地址</div>
            )}
          </div>

          <div className="orders-checkout-section">
            <div className="orders-section-title">商品清单</div>
            <div className="orders-checkout-products">
              {cart.map((item) => (
                <div key={item.productId} className="orders-checkout-product">
                  <div className="orders-checkout-product-image">
                    <img src={item.image} alt={item.name} onError={handleImageFallback} />
                  </div>
                  <div className="orders-checkout-product-info">
                    <div className="orders-checkout-product-name">{item.name}</div>
                    <div className="orders-checkout-product-price">{formatPrice(item.price)}</div>
                  </div>
                  <div className="orders-checkout-product-qty">× {item.quantity}</div>
                  <div className="orders-checkout-product-subtotal">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="orders-checkout-total">
            <span>应付金额:</span>
            <span className="orders-checkout-total-amount">{formatPrice(total)}</span>
          </div>
        </div>
        <div className="orders-modal-footer">
          <button type="button" className="orders-btn orders-btn-ghost" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="orders-btn orders-btn-primary"
            onClick={onSubmit}
            disabled={!address || cart.length === 0}
          >
            提交订单
          </button>
        </div>
      </div>
    </>
  );
}
