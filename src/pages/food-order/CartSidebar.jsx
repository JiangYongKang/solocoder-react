import { useState } from 'react';
import { formatPrice, calcCartTotal, calcCartCount } from './utils.js';

export default function CartSidebar({ isOpen, onClose, cart, onUpdateQuantity, onRemove, onClear, onCheckout }) {
  const [selectedItems, setSelectedItems] = useState(new Set());

  const allSelected = cart.length > 0 && cart.every((item) => selectedItems.has(item.cartItemId));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cart.map((item) => item.cartItemId)));
    }
  };

  const handleToggleItem = (cartItemId) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(cartItemId)) {
        next.delete(cartItemId);
      } else {
        next.add(cartItemId);
      }
      return next;
    });
  };

  const handleDecrease = (item) => {
    if (item.quantity <= 1) {
      onRemove(item.cartItemId);
      setSelectedItems((prev) => {
        const next = new Set(prev);
        next.delete(item.cartItemId);
        return next;
      });
    } else {
      onUpdateQuantity(item.cartItemId, item.quantity - 1);
    }
  };

  const handleIncrease = (item) => {
    onUpdateQuantity(item.cartItemId, item.quantity + 1);
  };

  const handleClear = () => {
    onClear();
    setSelectedItems(new Set());
  };

  const selectedCart = cart.filter((item) => selectedItems.has(item.cartItemId));
  const totalCount = calcCartCount(selectedCart);
  const totalAmount = calcCartTotal(selectedCart);
  const hasSelected = selectedCart.length > 0;

  return (
    <>
      {isOpen && <div className="fo-cart-overlay" onClick={onClose} />}
      <div className={`fo-cart-panel${isOpen ? ' fo-cart-panel-open' : ''}`}>
        <div className="fo-cart-header">
          <div className="fo-cart-header-left">
            <label className="fo-cart-select-all">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleToggleSelectAll}
              />
              <span>全选</span>
            </label>
          </div>
          <span className="fo-cart-title">购物车</span>
          <button className="fo-cart-clear" onClick={handleClear}>清空</button>
          <button className="fo-cart-close" onClick={onClose}>✕</button>
        </div>

        <div className="fo-cart-body">
          {cart.length === 0 ? (
            <div className="fo-cart-empty">
              🛒 购物车空空如也，快去挑选美食吧～
            </div>
          ) : (
            <div className="fo-cart-items">
              {cart.map((item) => (
                <div className="fo-cart-item" key={item.cartItemId}>
                  <div className="fo-cart-item-check">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.cartItemId)}
                      onChange={() => handleToggleItem(item.cartItemId)}
                    />
                  </div>
                  <div className="fo-cart-item-info">
                    <span className="fo-cart-item-name">{item.name}</span>
                    {item.specKey && (
                      <span className="fo-cart-item-spec">{item.specKey}</span>
                    )}
                  </div>
                  <div className="fo-cart-item-price-row">
                    <span className="fo-cart-item-price">{formatPrice(item.price)}</span>
                    <div className="fo-cart-qty">
                      <button className="fo-cart-qty-btn" onClick={() => handleDecrease(item)}>−</button>
                      <span className="fo-cart-qty-num">{item.quantity}</span>
                      <button className="fo-cart-qty-btn" onClick={() => handleIncrease(item)}>+</button>
                    </div>
                    <span className="fo-cart-item-subtotal">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="fo-cart-footer">
          <div className="fo-cart-total">
            共{totalCount}件 合计：<span className="fo-cart-total-amount">{formatPrice(totalAmount)}</span>
          </div>
          <button
            className="fo-cart-checkout-btn"
            disabled={!hasSelected}
            onClick={onCheckout}
          >
            去结算
          </button>
        </div>
      </div>
    </>
  );
}
