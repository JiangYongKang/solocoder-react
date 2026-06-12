import { useState } from 'react';
import { CATEGORIES, SHOPS } from './constants.js';
import { filterShopsByCategory, renderStars } from './utils.js';

export default function ShopList({ onShopClick }) {
  const [activeCategory, setActiveCategory] = useState('全部');

  const filteredShops = filterShopsByCategory(SHOPS, activeCategory);

  return (
    <div>
      <div className="fo-category-bar">
        {CATEGORIES.map((cat) => (
          <span
            key={cat}
            className={`fo-category-tag${cat === activeCategory ? ' fo-category-tag-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="fo-shop-grid">
        {filteredShops.map((shop) => (
          <div
            key={shop.id}
            className="fo-shop-card"
            onClick={() => onShopClick(shop)}
          >
            <div className="fo-shop-name">{shop.name}</div>
            <div className="fo-shop-meta">
              <span className="fo-shop-rating">
                {renderStars(shop.rating).map((type, i) => (
                  <span key={i}>{type === 'full' || type === 'half' ? '★' : '☆'}</span>
                ))}
                {shop.rating}
              </span>
              <span>月售{shop.monthlySales}</span>
              <span>{shop.deliveryTime}</span>
            </div>
            <div className="fo-shop-delivery">
              <span>¥{shop.minOrder}起送</span>
              <span>配送费¥{shop.deliveryFee}</span>
            </div>
            {shop.promotion && (
              <div className="fo-shop-promo">{shop.promotion}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
