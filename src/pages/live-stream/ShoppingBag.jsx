import { useState } from 'react';
import {
  addToBag,
  updateBagQuantity,
  removeFromBag,
  calcBagCount,
  calcBagTotal,
  formatPrice,
  getInitialSpecs,
} from './utils.js';

export default function ShoppingBag({
  bag,
  setBag,
  currentProduct,
  coupons,
  isOpen,
  setIsOpen,
}) {
  const [addQuantity, setAddQuantity] = useState(1);
  const [selectedSpecs, setSelectedSpecs] = useState(() => getInitialSpecs(currentProduct));

  const count = calcBagCount(bag);
  const totalInfo = calcBagTotal(bag, coupons);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleAddCurrent = () => {
    if (!currentProduct) return;
    setBag((prev) => addToBag(prev, currentProduct, selectedSpecs, addQuantity));
    setAddQuantity(1);
  };

  const handleQuantityChange = (cartItemId, delta) => {
    const item = bag.find((i) => i.cartItemId === cartItemId);
    if (!item) return;
    setBag((prev) => updateBagQuantity(prev, cartItemId, item.quantity + delta));
  };

  const handleRemove = (cartItemId) => {
    setBag((prev) => removeFromBag(prev, cartItemId));
  };

  const handleCheckout = () => {
    if (bag.length === 0) return;
    alert(`模拟结算成功！\n共 ${count} 件商品\n合计：${formatPrice(totalInfo.total)}\n${totalInfo.appliedCoupon ? `已使用：${totalInfo.appliedCoupon.name}` : ''}`);
  };

  const handleSpecChange = (specName, option) => {
    setSelectedSpecs((prev) => ({ ...prev, [specName]: option }));
  };

  return (
    <>
      <button
        className={`ls-bag-fab ${isOpen ? 'is-open' : ''}`}
        onClick={handleToggle}
        aria-label="打开购物袋"
      >
        🛍️
        {count > 0 && <span className="ls-bag-fab-count">{count}</span>}
      </button>

      <div className={`ls-shopping-bag ${isOpen ? 'is-open' : ''}`}>
        <div className="ls-bag-header">
          <h3 className="ls-bag-title">🛒 我的购物袋</h3>
          <button className="ls-bag-close" onClick={handleToggle} aria-label="关闭">×</button>
        </div>

        <div className="ls-bag-add-current">
          <div className="ls-add-title">快速添加「讲解中」商品</div>
          <div className="ls-add-product">
            <div
              className="ls-add-thumb"
              style={{ background: currentProduct?.bgColor || '#ddd' }}
            >
              <img src={currentProduct?.image} alt="" />
            </div>
            <div className="ls-add-info">
              <div className="ls-add-name">{currentProduct?.name}</div>
              <div className="ls-add-price-row">
                <span className="ls-add-price">{formatPrice(currentProduct?.livePrice)}</span>
                <span className="ls-add-orig">{formatPrice(currentProduct?.originalPrice)}</span>
              </div>
            </div>
          </div>

          {currentProduct?.specs?.length > 0 && (
            <div className="ls-specs-group">
              {currentProduct.specs.map((spec) => (
                <div key={spec.name} className="ls-spec-row">
                  <div className="ls-spec-label">{spec.name}</div>
                  <div className="ls-spec-options">
                    {spec.options.map((opt) => (
                      <button
                        key={opt}
                        className={`ls-spec-option ${
                          selectedSpecs[spec.name] === opt ? 'is-selected' : ''
                        }`}
                        onClick={() => handleSpecChange(spec.name, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="ls-add-qty-row">
            <span>数量</span>
            <div className="ls-qty-ctrl">
              <button
                onClick={() => setAddQuantity((q) => Math.max(1, q - 1))}
                disabled={addQuantity <= 1}
              >-</button>
              <span>{addQuantity}</span>
              <button onClick={() => setAddQuantity((q) => q + 1)}>+</button>
            </div>
            <button className="ls-btn-primary ls-add-btn" onClick={handleAddCurrent}>
              加入购物袋
            </button>
          </div>
        </div>

        <div className="ls-bag-divider" />
        <div className="ls-bag-list-title">
          已选商品 <span className="ls-bag-list-count">({count}件)</span>
        </div>
        <div className="ls-bag-list">
          {bag.length === 0 ? (
            <div className="ls-bag-empty">购物袋空空如也～<br />快去添加好物吧！</div>
          ) : (
            bag.map((item) => (
              <div key={item.cartItemId} className="ls-bag-item">
                <div
                  className="ls-bag-item-thumb"
                  style={{ background: item.bgColor || '#ddd' }}
                >
                  <img src={item.image} alt="" />
                </div>
                <div className="ls-bag-item-info">
                  <div className="ls-bag-item-name">{item.name}</div>
                  {item.specKey && (
                    <div className="ls-bag-item-spec">{item.specKey}</div>
                  )}
                  <div className="ls-bag-item-bottom">
                    <span className="ls-bag-item-price">{formatPrice(item.price)}</span>
                    <div className="ls-qty-ctrl ls-qty-ctrl--sm">
                      <button
                        onClick={() => handleQuantityChange(item.cartItemId, -1)}
                        disabled={item.quantity <= 1}
                      >-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item.cartItemId, 1)}>+</button>
                    </div>
                  </div>
                </div>
                <button
                  className="ls-bag-item-remove"
                  onClick={() => handleRemove(item.cartItemId)}
                  aria-label="删除"
                >×</button>
              </div>
            ))
          )}
        </div>

        {coupons?.length > 0 && (
          <div className="ls-bag-coupons">
            <div className="ls-coupons-title">🎫 可用优惠券</div>
            <div className="ls-coupons-list">
              {coupons.map((c) => {
                const usable = totalInfo.subtotal >= c.threshold;
                const isApplied = totalInfo.appliedCoupon?.id === c.id;
                return (
                  <div
                    key={c.id}
                    className={`ls-coupon-chip ${usable ? 'is-usable' : 'is-disabled'} ${isApplied ? 'is-applied' : ''}`}
                  >
                    <div className="ls-coupon-chip-amount">¥{c.amount}</div>
                    <div className="ls-coupon-chip-info">
                      <div className="ls-coupon-chip-name">{c.name}</div>
                      <div className="ls-coupon-chip-threshold">满{c.threshold}可用</div>
                    </div>
                    {isApplied && <div className="ls-coupon-chip-tag">已抵扣</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="ls-bag-footer">
          <div className="ls-bag-sum-row">
            <span>商品合计</span>
            <span>{formatPrice(totalInfo.subtotal)}</span>
          </div>
          {totalInfo.discount > 0 && (
            <div className="ls-bag-sum-row ls-bag-discount-row">
              <span>优惠抵扣</span>
              <span className="ls-bag-discount-val">-{formatPrice(totalInfo.discount)}</span>
            </div>
          )}
          <div className="ls-bag-total-row">
            <span>应付总额</span>
            <span className="ls-bag-total-val">{formatPrice(totalInfo.total)}</span>
          </div>
          <button
            className="ls-btn-checkout"
            onClick={handleCheckout}
            disabled={bag.length === 0}
          >
            去结算 ({count})
          </button>
        </div>
      </div>
    </>
  );
}
