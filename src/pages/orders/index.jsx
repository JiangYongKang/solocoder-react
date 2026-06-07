import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductList from './ProductList.jsx';
import CartPanel from './CartPanel.jsx';
import AddressForm from './AddressForm.jsx';
import CheckoutDialog from './CheckoutDialog.jsx';
import OrderList from './OrderList.jsx';
import {
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  calcCartCount,
  createOrder,
  advanceOrderStatus,
  cancelOrder,
  addOrderToList,
  updateOrderInList,
  generateId,
} from './utils.js';
import {
  loadCart,
  saveCart,
  loadAddresses,
  saveAddresses,
  loadOrders,
  saveOrders,
} from './storage.js';
import './orders.css';

export default function OrdersPage() {
  const [cart, setCart] = useState(() => loadCart());
  const [addresses, setAddresses] = useState(() => loadAddresses());
  const [orders, setOrders] = useState(() => loadOrders());

  const [cartOpen, setCartOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [productQuantities, setProductQuantities] = useState({});
  const [activeSection, setActiveSection] = useState('shop');

  useEffect(() => saveCart(cart), [cart]);
  useEffect(() => saveAddresses(addresses), [addresses]);
  useEffect(() => saveOrders(orders), [orders]);

  const handleAddToCart = (product, qty) => {
    setCart((prev) => addToCart(prev, product, qty));
    setCartOpen(true);
  };

  const handleQuantityChange = (productId, value) => {
    setProductQuantities((prev) => ({ ...prev, [productId]: value }));
  };

  const handleUpdateCartQuantity = (productId, qty) => {
    setCart((prev) => updateCartQuantity(prev, productId, qty));
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prev) => removeFromCart(prev, productId));
  };

  const handleClearCart = () => {
    setCart(clearCart());
  };

  const handleCheckout = () => {
    setCartOpen(false);
    if (addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses[0]);
    }
    setCheckoutOpen(true);
  };

  const handleSaveAddress = (addressData) => {
    const newAddress = { ...addressData, id: generateId() };
    const newList = [newAddress, ...addresses];
    setAddresses(newList);
    setSelectedAddress(newAddress);
    setAddressOpen(false);
  };

  const handleSelectAddress = (addr) => {
    setSelectedAddress(addr);
  };

  const handleSubmitOrder = () => {
    if (!selectedAddress || cart.length === 0) return;
    const order = createOrder(cart, selectedAddress);
    if (!order) return;
    setOrders((prev) => addOrderToList(prev, order));
    setCart(clearCart());
    setCheckoutOpen(false);
    setActiveSection('orders');
  };

  const handleAdvanceOrder = (orderId) => {
    setOrders((prev) => updateOrderInList(prev, orderId, (o) => advanceOrderStatus(o)));
  };

  const handleCancelOrder = (orderId) => {
    setOrders((prev) => updateOrderInList(prev, orderId, (o) => cancelOrder(o)));
  };

  const cartCount = calcCartCount(cart);

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div className="orders-header-left">
          <Link to="/" className="orders-back-link">← 返回首页</Link>
          <h1 className="orders-title">电商订单系统</h1>
        </div>
        <div className="orders-header-right">
          <button
            type="button"
            className={`orders-section-toggle ${activeSection === 'shop' ? 'orders-section-toggle-active' : ''}`}
            onClick={() => setActiveSection('shop')}
          >
            商品
          </button>
          <button
            type="button"
            className={`orders-section-toggle ${activeSection === 'orders' ? 'orders-section-toggle-active' : ''}`}
            onClick={() => setActiveSection('orders')}
          >
            我的订单 ({orders.length})
          </button>
          <button
            type="button"
            className="orders-cart-button"
            onClick={() => setCartOpen(true)}
          >
            🛒 购物车
            {cartCount > 0 && <span className="orders-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>

      {activeSection === 'shop' ? (
        <div className="orders-content">
          <div className="orders-section-heading">
            <h2>精选商品</h2>
            <p>浏览商品，加入购物车后下单</p>
          </div>
          <ProductList
            onAddToCart={handleAddToCart}
            quantities={productQuantities}
            onQuantityChange={handleQuantityChange}
          />
        </div>
      ) : (
        <div className="orders-content">
          <div className="orders-section-heading">
            <h2>我的订单</h2>
            <p>查看订单状态，跟进物流信息</p>
          </div>
          <OrderList
            orders={orders}
            onAdvance={handleAdvanceOrder}
            onCancel={handleCancelOrder}
          />
        </div>
      )}

      <CartPanel
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemove={handleRemoveFromCart}
        onClear={handleClearCart}
        onCheckout={handleCheckout}
      />

      <AddressForm
        isOpen={addressOpen}
        onClose={() => setAddressOpen(false)}
        onSave={handleSaveAddress}
        existingAddresses={addresses}
        onSelectAddress={handleSelectAddress}
        selectedAddressId={selectedAddress?.id}
      />

      <CheckoutDialog
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        address={selectedAddress}
        onOpenAddress={() => setAddressOpen(true)}
        onSubmit={handleSubmitOrder}
      />
    </div>
  );
}
