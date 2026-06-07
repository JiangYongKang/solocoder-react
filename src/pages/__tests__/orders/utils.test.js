import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateId,
  formatPrice,
  createEmptyCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  calcCartTotal,
  calcCartCount,
  validateAddress,
  createOrder,
  advanceOrderStatus,
  cancelOrder,
  addOrderToList,
  updateOrderInList,
  filterOrdersByStatus,
  paginateOrders,
  buildLogisticsTimeline,
  formatDateTime,
  handleImageFallback,
  FALLBACK_PRODUCT_IMAGE,
} from '@/pages/orders/utils.js';
import {
  ORDER_STATUSES,
  PAGE_SIZE,
} from '@/pages/orders/constants.js';

function createMockStorage() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    _store: store,
  };
}

describe('orders/utils', () => {
  describe('generateId', () => {
    it('should generate non-empty string ids', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique ids', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) ids.add(generateId());
      expect(ids.size).toBe(100);
    });
  });

  describe('formatPrice', () => {
    it('should format price as RMB with 2 decimals', () => {
      expect(formatPrice(99)).toBe('¥99.00');
      expect(formatPrice(99.9)).toBe('¥99.90');
      expect(formatPrice(0)).toBe('¥0.00');
    });

    it('should handle null/undefined/NaN gracefully', () => {
      expect(formatPrice(null)).toBe('¥0.00');
      expect(formatPrice(undefined)).toBe('¥0.00');
      expect(formatPrice(NaN)).toBe('¥0.00');
    });

    it('should handle string numbers', () => {
      expect(formatPrice('128.5')).toBe('¥128.50');
    });
  });

  describe('cart operations', () => {
    const sampleProduct = { id: 'p1', name: '键盘', price: 399, stock: 50, image: 'x' };
    const sampleProduct2 = { id: 'p2', name: '鼠标', price: 159, stock: 120, image: 'y' };

    it('createEmptyCart returns empty array', () => {
      expect(createEmptyCart()).toEqual([]);
    });

    it('addToCart adds new product', () => {
      const cart = addToCart([], sampleProduct, 2);
      expect(cart.length).toBe(1);
      expect(cart[0].productId).toBe('p1');
      expect(cart[0].quantity).toBe(2);
      expect(cart[0].price).toBe(399);
    });

    it('addToCart increments quantity when product exists', () => {
      let cart = addToCart([], sampleProduct, 1);
      cart = addToCart(cart, sampleProduct, 3);
      expect(cart[0].quantity).toBe(4);
      expect(cart.length).toBe(1);
    });

    it('addToCart caps quantity by stock', () => {
      const cart = addToCart([], sampleProduct, 1000);
      expect(cart[0].quantity).toBe(50);
    });

    it('addToCart is immutable', () => {
      const original = [];
      addToCart(original, sampleProduct, 1);
      expect(original).toEqual([]);
    });

    it('addToCart without product returns original', () => {
      expect(addToCart([], null)).toEqual([]);
      expect(addToCart([], {})).toEqual([]);
    });

    it('updateCartQuantity changes quantity', () => {
      let cart = addToCart([], sampleProduct, 2);
      cart = updateCartQuantity(cart, 'p1', 5, 50);
      expect(cart[0].quantity).toBe(5);
    });

    it('updateCartQuantity removes when quantity <= 0', () => {
      let cart = addToCart([], sampleProduct, 2);
      cart = updateCartQuantity(cart, 'p1', 0);
      expect(cart.length).toBe(0);
      cart = addToCart([], sampleProduct, 2);
      cart = updateCartQuantity(cart, 'p1', -1);
      expect(cart.length).toBe(0);
    });

    it('updateCartQuantity caps by stock', () => {
      let cart = addToCart([], sampleProduct, 1);
      cart = updateCartQuantity(cart, 'p1', 999, 50);
      expect(cart[0].quantity).toBe(50);
    });

    it('removeFromCart removes product', () => {
      let cart = addToCart([], sampleProduct, 1);
      cart = addToCart(cart, sampleProduct2, 1);
      cart = removeFromCart(cart, 'p1');
      expect(cart.length).toBe(1);
      expect(cart[0].productId).toBe('p2');
    });

    it('removeFromCart with no productId returns original', () => {
      const cart = [{ productId: 'p1' }];
      expect(removeFromCart(cart, '')).toEqual(cart);
    });

    it('clearCart returns empty array', () => {
      expect(clearCart()).toEqual([]);
    });

    it('calcCartTotal sums correctly', () => {
      const cart = [
        { productId: 'p1', price: 100, quantity: 2 },
        { productId: 'p2', price: 50, quantity: 3 },
      ];
      expect(calcCartTotal(cart)).toBe(350);
    });

    it('calcCartTotal handles empty/invalid input', () => {
      expect(calcCartTotal([])).toBe(0);
      expect(calcCartTotal(null)).toBe(0);
      expect(calcCartTotal(undefined)).toBe(0);
    });

    it('calcCartCount sums quantities', () => {
      const cart = [
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', quantity: 3 },
      ];
      expect(calcCartCount(cart)).toBe(5);
    });

    it('calcCartCount handles empty/invalid', () => {
      expect(calcCartCount([])).toBe(0);
      expect(calcCartCount(null)).toBe(0);
    });
  });

  describe('validateAddress', () => {
    const validAddress = {
      receiver: '张三',
      phone: '13800138000',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detail: '某某街道1号',
    };

    it('accepts a valid address', () => {
      expect(validateAddress(validAddress).valid).toBe(true);
    });

    it('rejects empty receiver', () => {
      const r = validateAddress({ ...validAddress, receiver: '' });
      expect(r.valid).toBe(false);
      expect(r.errors.receiver).toBeTruthy();
    });

    it('rejects invalid phone format', () => {
      expect(validateAddress({ ...validAddress, phone: '12345' }).valid).toBe(false);
      expect(validateAddress({ ...validAddress, phone: '010-12345678' }).valid).toBe(false);
      expect(validateAddress({ ...validAddress, phone: '23800138000' }).valid).toBe(false);
    });

    it('accepts valid phone numbers starting with 1[3-9]', () => {
      expect(validateAddress({ ...validAddress, phone: '13912345678' }).valid).toBe(true);
      expect(validateAddress({ ...validAddress, phone: '15012345678' }).valid).toBe(true);
      expect(validateAddress({ ...validAddress, phone: '18912345678' }).valid).toBe(true);
    });

    it('rejects missing province/city/district/detail', () => {
      expect(validateAddress({ ...validAddress, province: '' }).errors.province).toBeTruthy();
      expect(validateAddress({ ...validAddress, city: '' }).errors.city).toBeTruthy();
      expect(validateAddress({ ...validAddress, district: '' }).errors.district).toBeTruthy();
      expect(validateAddress({ ...validAddress, detail: '' }).errors.detail).toBeTruthy();
    });

    it('handles null/undefined address', () => {
      expect(validateAddress(null).valid).toBe(false);
      expect(validateAddress(undefined).valid).toBe(false);
    });
  });

  describe('order creation and status progression', () => {
    const validAddress = {
      receiver: '张三',
      phone: '13800138000',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detail: '某某街道1号',
    };
    const cart = [
      { productId: 'p1', name: '键盘', price: 399, quantity: 1, image: 'x' },
      { productId: 'p2', name: '鼠标', price: 159, quantity: 2, image: 'y' },
    ];

    it('createOrder builds a pending_payment order', () => {
      const order = createOrder(cart, validAddress);
      expect(order).toBeTruthy();
      expect(order.status).toBe(ORDER_STATUSES.PENDING_PAYMENT);
      expect(order.items.length).toBe(2);
      expect(order.total).toBe(399 + 159 * 2);
      expect(order.address.receiver).toBe('张三');
      expect(order.history.length).toBe(1);
      expect(order.id).toBeTruthy();
      expect(order.createdAt).toBeGreaterThan(0);
    });

    it('createOrder returns null for empty cart', () => {
      expect(createOrder([], validAddress)).toBeNull();
      expect(createOrder(null, validAddress)).toBeNull();
    });

    it('advanceOrderStatus moves to next status', () => {
      let order = createOrder(cart, validAddress);
      order = advanceOrderStatus(order);
      expect(order.status).toBe(ORDER_STATUSES.PAID);
      expect(order.history.length).toBe(2);
      order = advanceOrderStatus(order);
      expect(order.status).toBe(ORDER_STATUSES.SHIPPED);
      order = advanceOrderStatus(order);
      expect(order.status).toBe(ORDER_STATUSES.COMPLETED);
      expect(order.history.length).toBe(4);
    });

    it('advanceOrderStatus does nothing for terminal status', () => {
      let order = createOrder(cart, validAddress);
      for (let i = 0; i < 5; i++) order = advanceOrderStatus(order);
      expect(order.status).toBe(ORDER_STATUSES.COMPLETED);
    });

    it('advanceOrderStatus handles null', () => {
      expect(advanceOrderStatus(null)).toBeNull();
    });

    it('cancelOrder cancels only pending_payment orders', () => {
      let order = createOrder(cart, validAddress);
      order = cancelOrder(order);
      expect(order.status).toBe(ORDER_STATUSES.CANCELLED);
      expect(order.history.length).toBe(2);
    });

    it('cancelOrder does nothing for completed', () => {
      let order = createOrder(cart, validAddress);
      for (let i = 0; i < 3; i++) order = advanceOrderStatus(order);
      const cancelled = cancelOrder(order);
      expect(cancelled.status).toBe(ORDER_STATUSES.COMPLETED);
    });
  });

  describe('order list operations', () => {
    const baseOrder = (id, status) => ({
      id,
      status,
      items: [],
      total: 0,
      address: {},
      createdAt: Date.now(),
      history: [{ status, time: Date.now() }],
    });

    it('addOrderToList prepends order', () => {
      const list = [baseOrder('o1', ORDER_STATUSES.COMPLETED)];
      const o2 = baseOrder('o2', ORDER_STATUSES.PENDING_PAYMENT);
      const updated = addOrderToList(list, o2);
      expect(updated[0].id).toBe('o2');
      expect(updated[1].id).toBe('o1');
    });

    it('addOrderToList handles null order', () => {
      const list = [baseOrder('o1')];
      expect(addOrderToList(list, null)).toBe(list);
    });

    it('updateOrderInList with function updater', () => {
      const list = [baseOrder('o1', ORDER_STATUSES.PENDING_PAYMENT)];
      const updated = updateOrderInList(list, 'o1', (o) => ({ ...o, status: ORDER_STATUSES.PAID }));
      expect(updated[0].status).toBe(ORDER_STATUSES.PAID);
    });

    it('updateOrderInList with object merge', () => {
      const list = [baseOrder('o1', ORDER_STATUSES.PENDING_PAYMENT)];
      const updated = updateOrderInList(list, 'o1', { total: 999 });
      expect(updated[0].total).toBe(999);
    });

    it('updateOrderInList handles missing id and invalid input', () => {
      const list = [baseOrder('o1')];
      expect(updateOrderInList(list, 'nope', {})).toEqual(list);
      expect(updateOrderInList(null, 'o1', {})).toEqual([]);
    });

    it('filterOrdersByStatus filters correctly', () => {
      const list = [
        baseOrder('o1', ORDER_STATUSES.PENDING_PAYMENT),
        baseOrder('o2', ORDER_STATUSES.PAID),
        baseOrder('o3', ORDER_STATUSES.PENDING_PAYMENT),
      ];
      expect(filterOrdersByStatus(list, ORDER_STATUSES.PENDING_PAYMENT).length).toBe(2);
      expect(filterOrdersByStatus(list, ORDER_STATUSES.COMPLETED).length).toBe(0);
      expect(filterOrdersByStatus(list, '').length).toBe(3);
      expect(filterOrdersByStatus(null, ORDER_STATUSES.PAID)).toEqual([]);
    });
  });

  describe('pagination', () => {
    const buildList = (n) => Array.from({ length: n }, (_, i) => ({ id: `o${i}` }));

    it('paginateOrders returns correct page slice', () => {
      const list = buildList(12);
      const p1 = paginateOrders(list, 1, 5);
      expect(p1.items.length).toBe(5);
      expect(p1.items[0].id).toBe('o0');
      expect(p1.currentPage).toBe(1);
      expect(p1.totalPages).toBe(3);

      const p2 = paginateOrders(list, 2, 5);
      expect(p2.items[0].id).toBe('o5');

      const p3 = paginateOrders(list, 3, 5);
      expect(p3.items.length).toBe(2);
      expect(p3.items[0].id).toBe('o10');
    });

    it('paginateOrders clamps page', () => {
      const list = buildList(3);
      const p = paginateOrders(list, 99, PAGE_SIZE);
      expect(p.currentPage).toBe(1);
    });

    it('paginateOrders handles invalid inputs', () => {
      const r = paginateOrders(null, 1);
      expect(r.items).toEqual([]);
      expect(r.totalPages).toBe(1);
    });
  });

  describe('buildLogisticsTimeline', () => {
    const baseOrder = (status) => ({
      id: 'o1',
      status,
      createdAt: 1700000000000,
      history: [{ status, time: 1700000000000 }],
    });

    it('returns empty for pending payment', () => {
      expect(buildLogisticsTimeline(baseOrder(ORDER_STATUSES.PENDING_PAYMENT))).toEqual([]);
    });

    it('returns payment info for paid status', () => {
      const t = buildLogisticsTimeline(baseOrder(ORDER_STATUSES.PAID));
      expect(t.length).toBe(1);
      expect(t[0].label).toContain('已付款');
    });

    it('returns logistics entries for shipped status', () => {
      const order = {
        ...baseOrder(ORDER_STATUSES.SHIPPED),
        history: [
          { status: ORDER_STATUSES.PENDING_PAYMENT, time: 1700000000000 },
          { status: ORDER_STATUSES.PAID, time: 1700000010000 },
          { status: ORDER_STATUSES.SHIPPED, time: 1700000020000 },
        ],
      };
      const t = buildLogisticsTimeline(order);
      expect(t.length).toBeGreaterThan(0);
      expect(t[0].label).toBeTruthy();
      expect(t[0].time).toBeGreaterThanOrEqual(1700000020000);
      expect(t[0].isLatest).toBe(true);
    });

    it('returns full timeline for completed', () => {
      const order = {
        ...baseOrder(ORDER_STATUSES.COMPLETED),
        history: [
          { status: ORDER_STATUSES.PENDING_PAYMENT, time: 1700000000000 },
          { status: ORDER_STATUSES.PAID, time: 1700000010000 },
          { status: ORDER_STATUSES.SHIPPED, time: 1700000020000 },
          { status: ORDER_STATUSES.COMPLETED, time: 1700000030000 },
        ],
      };
      const t = buildLogisticsTimeline(order);
      expect(t.length).toBeGreaterThanOrEqual(6);
      expect(t[0].isLatest).toBe(true);
    });
  });

  describe('formatDateTime', () => {
    it('formats timestamp to readable string', () => {
      const s = formatDateTime(1700000000000);
      expect(s).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('handles falsy values', () => {
      expect(formatDateTime(0)).toBe('');
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
    });
  });

  describe('cart stock preservation and enforcement', () => {
    const sampleProduct = { id: 'p1', name: '键盘', price: 399, stock: 5, image: 'x' };

    it('addToCart preserves stock field on new cart item', () => {
      const cart = addToCart([], sampleProduct, 1);
      expect(cart[0].stock).toBe(5);
    });

    it('addToCart updates stock when adding existing product', () => {
      let cart = addToCart([], sampleProduct, 1);
      const updatedProduct = { ...sampleProduct, stock: 8 };
      cart = addToCart(cart, updatedProduct, 1);
      expect(cart[0].stock).toBe(8);
    });

    it('updateCartQuantity respects stock cap when called with stock arg (CartPanel scenario)', () => {
      const cart = addToCart([], sampleProduct, 2);
      const cartItem = cart[0];
      const after = updateCartQuantity(cart, cartItem.productId, 999, cartItem.stock);
      expect(after[0].quantity).toBe(5);
    });

    it('updateCartQuantity still caps when stock is omitted but value is within safe range', () => {
      const cart = addToCart([], sampleProduct, 2);
      const after = updateCartQuantity(cart, 'p1', 3);
      expect(after[0].quantity).toBe(3);
    });
  });

  describe('image fallback', () => {
    it('FALLBACK_PRODUCT_IMAGE is a non-empty data URL', () => {
      expect(typeof FALLBACK_PRODUCT_IMAGE).toBe('string');
      expect(FALLBACK_PRODUCT_IMAGE.startsWith('data:image/svg+xml;utf8,')).toBe(true);
      expect(FALLBACK_PRODUCT_IMAGE.length).toBeGreaterThan(50);
    });

    it('handleImageFallback sets target src to fallback URL', () => {
      const target = { src: 'https://broken.example.com/img.png' };
      const event = { target };
      handleImageFallback(event);
      expect(target.src).toBe(FALLBACK_PRODUCT_IMAGE);
    });

    it('handleImageFallback does not change src when it already equals fallback', () => {
      const target = { src: FALLBACK_PRODUCT_IMAGE };
      const event = { target };
      handleImageFallback(event);
      expect(target.src).toBe(FALLBACK_PRODUCT_IMAGE);
    });

    it('handleImageFallback handles null/undefined safely', () => {
      expect(() => handleImageFallback(null)).not.toThrow();
      expect(() => handleImageFallback(undefined)).not.toThrow();
      expect(() => handleImageFallback({})).not.toThrow();
      expect(() => handleImageFallback({ target: null })).not.toThrow();
    });
  });

  describe('order filtering by cancelled status', () => {
    const baseOrder = (id, status) => ({
      id,
      status,
      items: [],
      total: 0,
      address: {},
      createdAt: Date.now(),
      history: [{ status, time: Date.now() }],
    });

    it('filterOrdersByStatus returns only cancelled orders', () => {
      const list = [
        baseOrder('o1', ORDER_STATUSES.PENDING_PAYMENT),
        baseOrder('o2', ORDER_STATUSES.CANCELLED),
        baseOrder('o3', ORDER_STATUSES.COMPLETED),
        baseOrder('o4', ORDER_STATUSES.CANCELLED),
      ];
      const cancelled = filterOrdersByStatus(list, ORDER_STATUSES.CANCELLED);
      expect(cancelled.length).toBe(2);
      expect(cancelled.every((o) => o.status === ORDER_STATUSES.CANCELLED)).toBe(true);
    });

    it('cancelOrder adds cancelled status and can then be filtered', () => {
      const validAddress = {
        receiver: '张三',
        phone: '13800138000',
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        detail: '某某街道1号',
      };
      const cart = [{ productId: 'p1', name: '键盘', price: 399, quantity: 1, image: 'x' }];
      let order = createOrder(cart, validAddress);
      order = cancelOrder(order);
      const result = filterOrdersByStatus([order], ORDER_STATUSES.CANCELLED);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(order.id);
    });
  });
});

describe('orders/storage', () => {
  let storage;
  beforeEach(() => {
    storage = createMockStorage();
  });

  it('saveCart and loadCart round-trip', async () => {
    const { saveCart, loadCart } = await import('@/pages/orders/storage.js');
    saveCart([{ productId: 'p1', quantity: 2 }], storage);
    const loaded = loadCart(storage);
    expect(loaded).toEqual([{ productId: 'p1', quantity: 2 }]);
  });

  it('loadCart defaults to empty array', async () => {
    const { loadCart } = await import('@/pages/orders/storage.js');
    expect(loadCart(storage)).toEqual([]);
  });

  it('saveAddresses and loadAddresses round-trip', async () => {
    const { saveAddresses, loadAddresses } = await import('@/pages/orders/storage.js');
    const addr = { id: 'a1', receiver: '张三' };
    saveAddresses([addr], storage);
    expect(loadAddresses(storage)).toEqual([addr]);
  });

  it('saveOrders and loadOrders round-trip', async () => {
    const { saveOrders, loadOrders } = await import('@/pages/orders/storage.js');
    const order = { id: 'o1', status: ORDER_STATUSES.PENDING_PAYMENT };
    saveOrders([order], storage);
    expect(loadOrders(storage)).toEqual([order]);
  });

  it('handles corrupted JSON gracefully', async () => {
    const { loadCart } = await import('@/pages/orders/storage.js');
    storage.setItem('orders_cart', '{bad json');
    expect(loadCart(storage)).toEqual([]);
  });

  it('does not throw when storage is null', async () => {
    const { saveCart, loadCart, saveOrders, loadOrders } = await import('@/pages/orders/storage.js');
    expect(() => saveCart([], null)).not.toThrow();
    expect(() => loadCart(null)).not.toThrow();
    expect(() => saveOrders([], null)).not.toThrow();
    expect(() => loadOrders(null)).not.toThrow();
  });
});
