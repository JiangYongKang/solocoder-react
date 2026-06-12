import { useState, useRef, useEffect, useCallback } from 'react';
import { SHOP_PRODUCTS_GROUPS } from './constants.js';
import {
  formatPrice,
  groupProducts,
  getShopProductGroups,
  hasMultipleSpecs,
  getSpecPrice,
  renderStars,
  generateProductColor,
} from './utils.js';

export default function ShopDetail({ shop, cart, onAddToCart, onBack }) {
  const scrollRef = useRef(null);
  const [activeGroup, setActiveGroup] = useState('');
  const [specPopup, setSpecPopup] = useState(null);
  const [selectedSpecs, setSelectedSpecs] = useState({});
  const [plusAnimation, setPlusAnimation] = useState(null);
  const observerRef = useRef(null);
  const groupElementsRef = useRef({});

  const groups = shop ? getShopProductGroups(shop, SHOP_PRODUCTS_GROUPS) : [];
  const grouped = shop ? groupProducts(shop.products) : {};

  useEffect(() => {
    if (groups.length > 0 && !activeGroup) {
      setActiveGroup(groups[0]);
    }
  }, [groups, activeGroup]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topEntry = visible.reduce((a, b) => {
            const ra = a.boundingClientRect;
            const rb = b.boundingClientRect;
            return ra.top < rb.top ? a : b;
          });
          const groupName = topEntry.target.getAttribute('data-group');
          if (groupName) {
            setActiveGroup(groupName);
          }
        }
      },
      {
        root: container,
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    );

    Object.values(groupElementsRef.current).forEach((el) => {
      if (el) observerRef.current.observe(el);
    });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [groups, grouped]);

  const registerGroupElement = useCallback((groupName, el) => {
    groupElementsRef.current[groupName] = el;
    if (observerRef.current && el) {
      observerRef.current.observe(el);
    }
  }, []);

  const handleTabClick = (groupName) => {
    setActiveGroup(groupName);
    const el = document.getElementById(`fo-group-${groupName}`);
    const container = scrollRef.current;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      container.scrollTop += elRect.top - containerRect.top - 8;
    }
  };

  const handleAddNoSpec = (product, e) => {
    onAddToCart(product, {});
    const rect = e.currentTarget.getBoundingClientRect();
    setPlusAnimation({ x: rect.left, y: rect.top, id: Date.now() });
    setTimeout(() => setPlusAnimation(null), 600);
  };

  const handleOpenSpec = (product) => {
    setSpecPopup(product);
    setSelectedSpecs({});
  };

  const handleSelectSpec = (specName, option) => {
    setSelectedSpecs((prev) => ({ ...prev, [specName]: option }));
  };

  const allSpecsSelected = specPopup
    ? specPopup.specs.every((s) => selectedSpecs[s.name])
    : false;

  const handleConfirmSpec = () => {
    if (!specPopup || !allSpecsSelected) return;
    onAddToCart(specPopup, selectedSpecs);
    setSpecPopup(null);
    setSelectedSpecs({});
  };

  const handleCloseSpec = () => {
    setSpecPopup(null);
    setSelectedSpecs({});
  };

  if (!shop) return null;

  const starChars = { full: '★', half: '½', empty: '☆' };

  return (
    <div className="fo-shop-detail" ref={scrollRef}>
      <button className="fo-back-link" onClick={onBack}>← 返回</button>

      <div className="fo-shop-header">
        <div className="fo-shop-header-name">{shop.name}</div>
        <div className="fo-shop-header-rating">
          {renderStars(shop.rating).map((s, i) => (
            <span key={i}>{starChars[s]}</span>
          ))}
          <span>{shop.rating}</span>
        </div>
        {shop.announcement && (
          <div className="fo-shop-header-announce">{shop.announcement}</div>
        )}
        {shop.promotion && (
          <div className="fo-shop-header-promo">{shop.promotion}</div>
        )}
      </div>

      <div className="fo-group-bar">
        {groups.map((g) => (
          <button
            key={g}
            className={`fo-group-tab ${activeGroup === g ? 'fo-group-tab-active' : ''}`}
            onClick={() => handleTabClick(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {groups.map((g) => {
        const products = grouped[g] || [];
        if (products.length === 0) return null;
        return (
          <div
            key={g}
            id={`fo-group-${g}`}
            data-group={g}
            className="fo-product-section"
            ref={(el) => registerGroupElement(g, el)}
          >
            <h3 className="fo-group-title">{g}</h3>
            {products.map((product) => (
              <div key={product.id} className="fo-product-item">
                <div
                  className="fo-product-img"
                  style={{ backgroundColor: generateProductColor(product.name) }}
                >
                  {product.name.charAt(0)}
                </div>
                <div className="fo-product-info">
                  <div className="fo-product-name">{product.name}</div>
                  <div className="fo-product-desc">{product.description}</div>
                  <div className="fo-product-sales">月售{product.monthlySales}</div>
                </div>
                <div className="fo-product-bottom">
                  <span className="fo-product-price">{formatPrice(product.price)}</span>
                  <button
                    className="fo-product-add-btn"
                    onClick={(e) => {
                      if (hasMultipleSpecs(product)) {
                        handleOpenSpec(product);
                      } else {
                        handleAddNoSpec(product, e);
                      }
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {plusAnimation && (
        <span
          key={plusAnimation.id}
          className="fo-plus-anim"
          style={{ left: plusAnimation.x, top: plusAnimation.y }}
        >
          +1
        </span>
      )}

      {specPopup && (
        <div className="fo-spec-overlay" onClick={handleCloseSpec}>
          <div className="fo-spec-popup" onClick={(e) => e.stopPropagation()}>
            <div className="fo-spec-header">
              <div className="fo-spec-title">{specPopup.name}</div>
              <button className="fo-spec-close" onClick={handleCloseSpec}>✕</button>
            </div>
            <div className="fo-spec-body">
              {specPopup.specs.map((spec) => (
                <div key={spec.name} className="fo-spec-group">
                  <div className="fo-spec-group-label">{spec.name}</div>
                  <div className="fo-spec-options">
                    {spec.options.map((option) => (
                      <button
                        key={option}
                        className={`fo-spec-option ${selectedSpecs[spec.name] === option ? 'fo-spec-option-active' : ''}`}
                        onClick={() => handleSelectSpec(spec.name, option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="fo-spec-footer">
              <div className="fo-spec-price">
                {formatPrice(getSpecPrice(specPopup, selectedSpecs))}
              </div>
              <button
                className="fo-spec-confirm"
                disabled={!allSpecsSelected}
                onClick={handleConfirmSpec}
              >
                加入购物车
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
