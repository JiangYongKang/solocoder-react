import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CartSidebar from './CartSidebar.jsx';
import CheckoutPage from './CheckoutPage.jsx';
import './food-order.css';
import OrderHistory from './OrderHistory.jsx';
import OrderTracking from './OrderTracking.jsx';
import ShopDetail from './ShopDetail.jsx';
import ShopList from './ShopList.jsx';
import {
    loadAddresses,
    loadCart,
    loadOrders,
    saveAddresses,
    saveCart,
    saveOrders,
} from './storage.js';
import {
    addAddress,
    addOrderToList,
    addToCart,
    calcCartCount,
    calcCartTotal,
    clearCart as clearCartUtil,
    createOrder,
    filterCartByShop,
    formatPrice,
    removeFromCart,
    updateCartQuantity,
    updateOrderInList
} from './utils.js';

const VIEWS = {
  SHOP_LIST: 'shop_list',
  SHOP_DETAIL: 'shop_detail',
  CHECKOUT: 'checkout',
  ORDER_TRACKING: 'order_tracking',
  ORDER_HISTORY: 'order_history',
};

export default function FoodOrderPage() {
  const [cart, setCart] = useState(() => loadCart());
  const [addresses, setAddresses] = useState(() => loadAddresses());
  const [orders, setOrders] = useState(() => loadOrders());

  const [view, setView] = useState(VIEWS.SHOP_LIST);
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('shop');

  useEffect(() => saveCart(cart), [cart]);
  useEffect(() => saveAddresses(addresses), [addresses]);
  useEffect(() => saveOrders(orders), [orders]);

  const handleShopClick = (shop) => {
    setSelectedShop(shop);
    setView(VIEWS.SHOP_DETAIL);
  };

  const handleAddToCart = (product, selectedSpecs) => {
    const productWithShopId = { ...product, shopId: selectedShop?.id || '' };
    setCart((prev) => addToCart(prev, productWithShopId, selectedSpecs));
  };

  const handleUpdateCartQuantity = (cartItemId, quantity) => {
    setCart((prev) => updateCartQuantity(prev, cartItemId, quantity));
  };

  const handleRemoveFromCart = (cartItemId) => {
    setCart((prev) => removeFromCart(prev, cartItemId));
  };

  const handleClearCart = () => {
    setCart(clearCartUtil());
  };

  const handleCheckout = () => {
    setCartOpen(false);
    if (addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses[0]);
    }
    setView(VIEWS.CHECKOUT);
  };

  const handleSelectAddress = (addr) => {
    setSelectedAddress(addr);
  };

  const handleAddNewAddress = (addrObj) => {
    const result = addAddress(addresses, addrObj);
    if (result.error) {
      alert(result.error);
      return;
    }
    setAddresses(result.result);
    setSelectedAddress(result.result[0]);
  };

  const handleSubmitOrder = ({ address, remark }) => {
    if (!address) return;
    const shopCart = selectedShop
      ? filterCartByShop(cart, selectedShop.id)
      : cart;
    if (shopCart.length === 0) return;
    const shopName = selectedShop?.name || '未知店铺';
    const shopId = selectedShop?.id || '';
    const order = createOrder(shopCart, address, shopId, shopName, remark);
    if (!order) return;
    setOrders((prev) => addOrderToList(prev, order));
    const orderedIds = new Set(shopCart.map((i) => i.cartItemId));
    setCart((prev) => prev.filter((i) => !orderedIds.has(i.cartItemId)));
    setCurrentOrder(order);
    setView(VIEWS.ORDER_TRACKING);
  };

  const handleOrderUpdate = (updatedOrder) => {
    setCurrentOrder(updatedOrder);
    setOrders((prev) => updateOrderInList(prev, updatedOrder.id, updatedOrder));
  };

  const handleViewOrder = (order) => {
    setCurrentOrder(order);
    setView(VIEWS.ORDER_TRACKING);
  };

  const handleBack = () => {
    if (view === VIEWS.SHOP_DETAIL) {
      setView(VIEWS.SHOP_LIST);
      setSelectedShop(null);
    } else if (view === VIEWS.CHECKOUT) {
      setView(VIEWS.SHOP_DETAIL);
    } else if (view === VIEWS.ORDER_TRACKING) {
      setView(VIEWS.ORDER_HISTORY);
      setActiveSection('orders');
    } else if (view === VIEWS.ORDER_HISTORY) {
      setView(VIEWS.SHOP_LIST);
      setActiveSection('shop');
    } else {
      setView(VIEWS.SHOP_LIST);
    }
  };

  const cartCount = calcCartCount(cart);
  const cartTotal = calcCartTotal(cart);

  const renderHeader = () => {
    if (view === VIEWS.SHOP_DETAIL || view === VIEWS.CHECKOUT || view === VIEWS.ORDER_TRACKING || view === VIEWS.ORDER_HISTORY) {
      return null;
    }
    return (
      <div className="fo-header">
        <div className="fo-header-left">
          <Link to="/" className="fo-back-link">← 返回首页</Link>
          <h1 className="fo-title">外卖点餐</h1>
        </div>
        <div className="fo-header-right">
          <button
            type="button"
            className={`fo-nav-btn ${activeSection === 'shop' ? 'fo-nav-btn-active' : ''}`}
            onClick={() => { setActiveSection('shop'); setView(VIEWS.SHOP_LIST); }}
          >
            店铺
          </button>
          <button
            type="button"
            className={`fo-nav-btn ${activeSection === 'orders' ? 'fo-nav-btn-active' : ''}`}
            onClick={() => { setActiveSection('orders'); setView(VIEWS.ORDER_HISTORY); }}
          >
            我的订单 ({orders.length})
          </button>
          <button
            type="button"
            className="fo-cart-btn"
            onClick={() => setCartOpen(true)}
          >
            🛒
            {cartCount > 0 && <span className="fo-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    );
  };

  const renderBottomBar = () => {
    if (view !== VIEWS.SHOP_DETAIL) return null;
    const shopCart = selectedShop ? filterCartByShop(cart, selectedShop.id) : [];
    const shopCount = calcCartCount(shopCart);
    const shopTotal = calcCartTotal(shopCart);
    return (
      <div className="fo-bottom-bar">
        <div className="fo-bottom-bar-cart" onClick={() => setCartOpen(true)}>
          🛒
          {shopCount > 0 && <span className="fo-bottom-bar-badge">{shopCount}</span>}
        </div>
        <div className="fo-bottom-bar-info">
          <span className="fo-bottom-bar-total">{shopCount > 0 ? formatPrice(shopTotal) : '未选购商品'}</span>
          {shopCount > 0 && <span className="fo-bottom-bar-count">共{shopCount}件</span>}
        </div>
        <button
          type="button"
          className="fo-bottom-bar-submit"
          disabled={shopCount === 0}
          onClick={handleCheckout}
        >
          去结算
        </button>
      </div>
    );
  };

  const renderView = () => {
    switch (view) {
      case VIEWS.SHOP_LIST:
        return <ShopList onShopClick={handleShopClick} />;
      case VIEWS.SHOP_DETAIL:
        return (
          <ShopDetail
            shop={selectedShop}
            cart={selectedShop ? filterCartByShop(cart, selectedShop.id) : []}
            onAddToCart={handleAddToCart}
            onBack={handleBack}
          />
        );
      case VIEWS.CHECKOUT:
        return (
          <CheckoutPage
            cart={selectedShop ? filterCartByShop(cart, selectedShop.id) : cart}
            addresses={addresses}
            selectedAddress={selectedAddress}
            onSubmit={handleSubmitOrder}
            onBack={handleBack}
            onSelectAddress={handleSelectAddress}
            onAddNewAddress={handleAddNewAddress}
          />
        );
      case VIEWS.ORDER_TRACKING:
        return (
          <OrderTracking
            order={currentOrder}
            onBack={handleBack}
            onOrderUpdate={handleOrderUpdate}
          />
        );
      case VIEWS.ORDER_HISTORY:
        return (
          <OrderHistory
            orders={orders}
            onViewOrder={handleViewOrder}
            onBack={handleBack}
          />
        );
      default:
        return <ShopList onShopClick={handleShopClick} />;
    }
  };

  return (
    <div className="fo-page">
      {renderHeader()}
      <div className="fo-content">
        {renderView()}
      </div>
      {renderBottomBar()}
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemove={handleRemoveFromCart}
        onClear={handleClearCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
