import { formatPrice, calcCartTotal, calcCartCount, handleImageFallback } from './utils.js';

export default function CartPanel({ isOpen, onClose, cart, onUpdateQuantity, onRemove, onClear, onCheckout }) {
  const total = calcCartTotal(cart);
  const count = calcCartCount(cart);

  return (
    <>
      {isOpen && <div className="orders-cart-overlay" onClick={onClose} />}
      <aside className={`orders-cart-panel ${isOpen ? 'orders-cart-panel-open' : ''}`}>
        <div className="orders-cart-header">
          <h2 className="orders-cart-title">购物车 ({count})</h2>
          <button type="button" className="orders-cart-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="orders-cart-body">
          {cart.length === 0 ? (
            <div className="orders-empty">购物车是空的，快去添加商品吧～</div>
          ) : (
            <div className="orders-cart-items">
              {cart.map((item) => (
                <div key={item.productId} className="orders-cart-item">
                  <div className="orders-cart-item-image">
                    <img src={item.image} alt={item.name} onError={handleImageFallback} />
                  </div>
                  <div className="orders-cart-item-info">
                    <div className="orders-cart-item-name">{item.name}</div>
                    <div className="orders-cart-item-price">{formatPrice(item.price)}</div>
                    <div className="orders-cart-item-actions">
                      <div className="orders-qty-selector orders-qty-selector-sm">
                        <button
                          type="button"
                          className="orders-qty-btn"
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1, item.stock)}
                        >
                          −
                        </button>
                        <span className="orders-qty-display">{item.quantity}</span>
                        <button
                          type="button"
                          className="orders-qty-btn"
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1, item.stock)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="orders-cart-remove"
                        onClick={() => onRemove(item.productId)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <div className="orders-cart-item-subtotal">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="orders-cart-footer">
          <div className="orders-cart-footer-top">
            {cart.length > 0 && (
              <button type="button" className="orders-btn orders-btn-ghost" onClick={onClear}>
                清空购物车
              </button>
            )}
            <div className="orders-cart-total">
              <span>合计:</span>
              <span className="orders-cart-total-amount">{formatPrice(total)}</span>
            </div>
          </div>
          <button
            type="button"
            className="orders-btn orders-btn-primary orders-btn-block"
            onClick={onCheckout}
            disabled={cart.length === 0}
          >
            去结算
          </button>
        </div>
      </aside>
    </>
  );
}
