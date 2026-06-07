import { PRODUCTS } from './constants.js';
import { formatPrice, handleImageFallback } from './utils.js';

export default function ProductList({ onAddToCart, quantities, onQuantityChange }) {
  return (
    <div className="orders-product-grid">
      {PRODUCTS.map((product) => {
        const qty = quantities[product.id] || 1;
        return (
          <div key={product.id} className="orders-product-card">
            <div className="orders-product-image">
              <img src={product.image} alt={product.name} onError={handleImageFallback} />
            </div>
            <div className="orders-product-info">
              <h3 className="orders-product-name">{product.name}</h3>
              <div className="orders-product-price">{formatPrice(product.price)}</div>
              <div className="orders-product-stock">库存: {product.stock}</div>
            </div>
            <div className="orders-product-actions">
              <div className="orders-qty-selector">
                <button
                  type="button"
                  className="orders-qty-btn"
                  onClick={() => onQuantityChange(product.id, Math.max(1, qty - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  className="orders-qty-input"
                  value={qty}
                  min={1}
                  max={product.stock}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (Number.isNaN(val)) return;
                    onQuantityChange(product.id, Math.max(1, Math.min(product.stock, val)));
                  }}
                />
                <button
                  type="button"
                  className="orders-qty-btn"
                  onClick={() => onQuantityChange(product.id, Math.min(product.stock, qty + 1))}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="orders-btn orders-btn-primary"
                onClick={() => onAddToCart(product, qty)}
                disabled={product.stock <= 0}
              >
                加入购物车
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
