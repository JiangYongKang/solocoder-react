import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateId,
  formatPrice,
  formatDateTime,
  buildSpecKey,
  getSpecPrice,
  hasMultipleSpecs,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  calcCartTotal,
  calcCartCount,
  filterCartByShop,
  validateAddress,
  addAddress,
  createOrder,
  advanceOrderStatus,
  cancelOrder,
  addOrderToList,
  updateOrderInList,
  filterOrdersByStatus,
  buildOrderTimeline,
  getAdvancementDelay,
  filterShopsByCategory,
  groupProducts,
  getShopProductGroups,
  renderStars,
  generateProductColor,
} from '@/pages/food-order/utils.js';
import {
  ORDER_STATUSES,
  STATUS_ORDER,
  MAX_ADDRESSES,
  SHOPS,
  SHOP_PRODUCTS_GROUPS,
} from '@/pages/food-order/constants.js';

function createMockStorage() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    _store: store,
  };
}

describe('food-order/utils', () => {
  describe('generateId', () => {
    it('generates non-empty string ids', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('generates unique ids', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) ids.add(generateId());
      expect(ids.size).toBe(100);
    });
  });

  describe('formatPrice', () => {
    it('formats price as RMB with 2 decimals', () => {
      expect(formatPrice(99)).toBe('¥99.00');
      expect(formatPrice(99.9)).toBe('¥99.90');
      expect(formatPrice(0)).toBe('¥0.00');
    });

    it('handles null/undefined/NaN gracefully', () => {
      expect(formatPrice(null)).toBe('¥0.00');
      expect(formatPrice(undefined)).toBe('¥0.00');
      expect(formatPrice(NaN)).toBe('¥0.00');
    });

    it('handles string numbers', () => {
      expect(formatPrice('128.5')).toBe('¥128.50');
    });

    it('handles negative numbers', () => {
      expect(formatPrice(-10)).toBe('¥-10.00');
    });

    it('ensures currency symbol appears only once', () => {
      const result = formatPrice(25.5);
      const yuanCount = (result.match(/¥/g) || []).length;
      expect(yuanCount).toBe(1);
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

  describe('buildSpecKey', () => {
    it('builds spec key from selected specs', () => {
      expect(buildSpecKey({ 规格: '大杯', 温度: '冰' })).toBe('大杯/冰');
    });

    it('returns empty string for empty/null specs', () => {
      expect(buildSpecKey({})).toBe('');
      expect(buildSpecKey(null)).toBe('');
      expect(buildSpecKey(undefined)).toBe('');
    });
  });

  describe('getSpecPrice', () => {
    const productWithSpecs = {
      id: 'p1',
      price: 15,
      specs: [
        { name: '规格', options: ['中杯', '大杯'] },
        { name: '温度', options: ['常温', '冰'] },
      ],
      specPrices: { '中杯/常温': 15, '中杯/冰': 16, '大杯/常温': 19, '大杯/冰': 20 },
    };

    const productNoSpecs = {
      id: 'p2',
      price: 22,
      specs: [],
    };

    it('returns spec price for matching key', () => {
      expect(getSpecPrice(productWithSpecs, { 规格: '大杯', 温度: '冰' })).toBe(20);
      expect(getSpecPrice(productWithSpecs, { 规格: '中杯', 温度: '常温' })).toBe(15);
    });

    it('returns base price for product without specs', () => {
      expect(getSpecPrice(productNoSpecs, {})).toBe(22);
    });

    it('returns base price when spec key not found', () => {
      expect(getSpecPrice(productWithSpecs, { 规格: '超大杯' })).toBe(15);
    });

    it('handles null product', () => {
      expect(getSpecPrice(null, {})).toBe(0);
    });
  });

  describe('hasMultipleSpecs', () => {
    it('returns true for product with specs', () => {
      expect(hasMultipleSpecs({ specs: [{ name: '规格', options: ['大', '小'] }] })).toBe(true);
    });

    it('returns false for product without specs', () => {
      expect(hasMultipleSpecs({ specs: [] })).toBe(false);
      expect(hasMultipleSpecs({})).toBe(false);
      expect(hasMultipleSpecs(null)).toBe(false);
    });
  });

  describe('cart operations', () => {
    const simpleProduct = { id: 'p1', name: '回锅肉', price: 36, specs: [], shopId: 'shop-1' };
    const specProduct = {
      id: 'p2', name: '杨枝甘露', price: 22, shopId: 'shop-5',
      specs: [
        { name: '规格', options: ['中杯', '大杯'] },
        { name: '温度', options: ['常温', '冰'] },
      ],
      specPrices: { '中杯/常温': 22, '中杯/冰': 22, '大杯/常温': 28, '大杯/冰': 28 },
    };

    it('addToCart adds product without specs', () => {
      const cart = addToCart([], simpleProduct, {}, 1);
      expect(cart.length).toBe(1);
      expect(cart[0].cartItemId).toBe('p1');
      expect(cart[0].quantity).toBe(1);
      expect(cart[0].price).toBe(36);
    });

    it('addToCart adds product with specs using spec key', () => {
      const specs = { 规格: '大杯', 温度: '冰' };
      const cart = addToCart([], specProduct, specs, 1);
      expect(cart.length).toBe(1);
      expect(cart[0].cartItemId).toBe('p2__大杯/冰');
      expect(cart[0].specKey).toBe('大杯/冰');
      expect(cart[0].price).toBe(28);
    });

    it('addToCart merges same product same spec', () => {
      const specs = { 规格: '中杯', 温度: '常温' };
      let cart = addToCart([], specProduct, specs, 1);
      cart = addToCart(cart, specProduct, specs, 2);
      expect(cart.length).toBe(1);
      expect(cart[0].quantity).toBe(3);
    });

    it('addToCart treats different specs as different items', () => {
      const specs1 = { 规格: '中杯', 温度: '常温' };
      const specs2 = { 规格: '大杯', 温度: '冰' };
      let cart = addToCart([], specProduct, specs1, 1);
      cart = addToCart(cart, specProduct, specs2, 1);
      expect(cart.length).toBe(2);
      expect(cart[0].price).toBe(22);
      expect(cart[1].price).toBe(28);
    });

    it('addToCart handles invalid product', () => {
      expect(addToCart([], null, {}, 1)).toEqual([]);
      expect(addToCart([], {}, {}, 1)).toEqual([]);
    });

    it('addToCart clamps quantity to at least 1', () => {
      const cart = addToCart([], simpleProduct, {}, -5);
      expect(cart[0].quantity).toBe(1);
    });

    it('addToCart handles non-numeric quantity', () => {
      const cart = addToCart([], simpleProduct, {}, 'abc');
      expect(cart[0].quantity).toBe(1);
    });

    it('updateCartQuantity changes quantity', () => {
      let cart = addToCart([], simpleProduct, {}, 2);
      cart = updateCartQuantity(cart, 'p1', 5);
      expect(cart[0].quantity).toBe(5);
    });

    it('updateCartQuantity removes item when quantity <= 0', () => {
      let cart = addToCart([], simpleProduct, {}, 2);
      cart = updateCartQuantity(cart, 'p1', 0);
      expect(cart.length).toBe(0);
    });

    it('updateCartQuantity handles non-numeric quantity', () => {
      let cart = addToCart([], simpleProduct, {}, 2);
      cart = updateCartQuantity(cart, 'p1', 'invalid');
      expect(cart.length).toBe(0);
    });

    it('updateCartQuantity handles empty cartItemId', () => {
      const cart = [{ cartItemId: 'p1', quantity: 2 }];
      expect(updateCartQuantity(cart, '', 5)).toEqual(cart);
    });

    it('removeFromCart removes item', () => {
      let cart = addToCart([], simpleProduct, {}, 1);
      cart = removeFromCart(cart, 'p1');
      expect(cart.length).toBe(0);
    });

    it('removeFromCart handles empty cartItemId', () => {
      const cart = [{ cartItemId: 'p1' }];
      expect(removeFromCart(cart, '')).toEqual(cart);
    });

    it('clearCart returns empty array', () => {
      expect(clearCart()).toEqual([]);
    });

    it('calcCartTotal sums correctly', () => {
      const cart = [
        { price: 22, quantity: 2 },
        { price: 28, quantity: 1 },
      ];
      expect(calcCartTotal(cart)).toBe(72);
    });

    it('calcCartCount sums quantities', () => {
      const cart = [
        { quantity: 2 },
        { quantity: 3 },
      ];
      expect(calcCartCount(cart)).toBe(5);
    });

    it('calcCartTotal/calcCartCount handle invalid input', () => {
      expect(calcCartTotal(null)).toBe(0);
      expect(calcCartTotal(undefined)).toBe(0);
      expect(calcCartCount(null)).toBe(0);
    });

    it('filterCartByShop filters by shopId', () => {
      const cart = [
        { cartItemId: '1', shopId: 'shop-1', name: 'A' },
        { cartItemId: '2', shopId: 'shop-2', name: 'B' },
        { cartItemId: '3', shopId: 'shop-1', name: 'C' },
      ];
      expect(filterCartByShop(cart, 'shop-1').length).toBe(2);
      expect(filterCartByShop(cart, 'shop-2').length).toBe(1);
    });

    it('filterCartByShop returns all when no shopId', () => {
      const cart = [{ cartItemId: '1', shopId: 'shop-1' }];
      expect(filterCartByShop(cart, '')).toEqual(cart);
      expect(filterCartByShop(cart, null)).toEqual(cart);
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
      expect(validateAddress({ ...validAddress, receiver: '' }).valid).toBe(false);
    });

    it('rejects invalid phone format', () => {
      expect(validateAddress({ ...validAddress, phone: '12345' }).valid).toBe(false);
      expect(validateAddress({ ...validAddress, phone: '010-12345678' }).valid).toBe(false);
    });

    it('accepts valid phone starting with 1[3-9]', () => {
      expect(validateAddress({ ...validAddress, phone: '13912345678' }).valid).toBe(true);
      expect(validateAddress({ ...validAddress, phone: '18912345678' }).valid).toBe(true);
    });

    it('handles null/undefined address', () => {
      expect(validateAddress(null).valid).toBe(false);
      expect(validateAddress(undefined).valid).toBe(false);
    });

    it('returns correct error messages for missing fields', () => {
      const result = validateAddress({ receiver: '', phone: '', province: '', city: '', district: '', detail: '' });
      expect(result.errors.receiver).toBeTruthy();
      expect(result.errors.phone).toBeTruthy();
      expect(result.errors.province).toBeTruthy();
      expect(result.errors.city).toBeTruthy();
      expect(result.errors.district).toBeTruthy();
      expect(result.errors.detail).toBeTruthy();
    });

    it('rejects phone with wrong length', () => {
      const result = validateAddress({ ...validAddress, phone: '1380013800' });
      expect(result.valid).toBe(false);
      expect(result.errors.phone).toBeTruthy();
    });
  });

  describe('addAddress', () => {
    it('adds new address with generated id', () => {
      const result = addAddress([], { receiver: '张三' });
      expect(result.result).toBeTruthy();
      expect(result.result[0].id).toBeTruthy();
      expect(result.result[0].receiver).toBe('张三');
      expect(result.error).toBeNull();
    });

    it('returns error when max addresses reached', () => {
      const existing = Array.from({ length: MAX_ADDRESSES }, (_, i) => ({ id: `a${i}` }));
      const result = addAddress(existing, { receiver: '新' });
      expect(result.error).toBeTruthy();
      expect(result.result.length).toBe(MAX_ADDRESSES);
    });

    it('prepends new address', () => {
      const existing = [{ id: 'a0', receiver: '旧' }];
      const result = addAddress(existing, { receiver: '新' });
      expect(result.result[0].receiver).toBe('新');
      expect(result.result[1].receiver).toBe('旧');
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
      { cartItemId: 'c1', productId: 'p1', name: '麻婆豆腐', price: 22, quantity: 1, specKey: '微辣', shopId: 'shop-1' },
      { cartItemId: 'c2', productId: 'p2', name: '米饭', price: 3, quantity: 2, specKey: '', shopId: 'shop-1' },
    ];

    it('createOrder builds a placed order', () => {
      const order = createOrder(cart, validAddress, 'shop-1', '川味居', '不要辣');
      expect(order).toBeTruthy();
      expect(order.status).toBe(ORDER_STATUSES.PLACED);
      expect(order.shopId).toBe('shop-1');
      expect(order.shopName).toBe('川味居');
      expect(order.items.length).toBe(2);
      expect(order.total).toBe(22 + 3 * 2);
      expect(order.remark).toBe('不要辣');
      expect(order.estimatedDelivery).toBeGreaterThan(0);
      expect(order.history.length).toBe(1);
    });

    it('createOrder returns null for empty cart', () => {
      expect(createOrder([], validAddress, 'shop-1', 'test')).toBeNull();
      expect(createOrder(null, validAddress, 'shop-1', 'test')).toBeNull();
    });

    it('advanceOrderStatus progresses through statuses', () => {
      let order = createOrder(cart, validAddress, 'shop-1', '川味居', '');
      expect(order.status).toBe(ORDER_STATUSES.PLACED);

      order = advanceOrderStatus(order);
      expect(order.status).toBe(ORDER_STATUSES.ACCEPTED);
      expect(order.history.length).toBe(2);

      order = advanceOrderStatus(order);
      expect(order.status).toBe(ORDER_STATUSES.PICKED_UP);

      order = advanceOrderStatus(order);
      expect(order.status).toBe(ORDER_STATUSES.DELIVERING);

      order = advanceOrderStatus(order);
      expect(order.status).toBe(ORDER_STATUSES.DELIVERED);
      expect(order.history.length).toBe(5);
    });

    it('advanceOrderStatus stops at delivered', () => {
      let order = createOrder(cart, validAddress, 'shop-1', 'test', '');
      for (let i = 0; i < 10; i++) order = advanceOrderStatus(order);
      expect(order.status).toBe(ORDER_STATUSES.DELIVERED);
    });

    it('advanceOrderStatus handles null', () => {
      expect(advanceOrderStatus(null)).toBeNull();
    });

    it('cancelOrder cancels active orders', () => {
      let order = createOrder(cart, validAddress, 'shop-1', 'test', '');
      order = cancelOrder(order);
      expect(order.status).toBe(ORDER_STATUSES.CANCELLED);
      expect(order.history.length).toBe(2);
    });

    it('cancelOrder does nothing for delivered orders', () => {
      let order = createOrder(cart, validAddress, 'shop-1', 'test', '');
      for (let i = 0; i < 4; i++) order = advanceOrderStatus(order);
      const cancelled = cancelOrder(order);
      expect(cancelled.status).toBe(ORDER_STATUSES.DELIVERED);
    });
  });

  describe('order list operations', () => {
    const baseOrder = (id, status) => ({
      id, status, items: [], total: 0, address: {}, createdAt: Date.now(),
      history: [{ status, time: Date.now() }],
    });

    it('addOrderToList prepends order', () => {
      const list = [baseOrder('o1', ORDER_STATUSES.PLACED)];
      const o2 = baseOrder('o2', ORDER_STATUSES.ACCEPTED);
      const updated = addOrderToList(list, o2);
      expect(updated[0].id).toBe('o2');
    });

    it('addOrderToList handles null order', () => {
      const list = [baseOrder('o1')];
      expect(addOrderToList(list, null)).toBe(list);
    });

    it('updateOrderInList with function updater', () => {
      const list = [baseOrder('o1', ORDER_STATUSES.PLACED)];
      const updated = updateOrderInList(list, 'o1', (o) => advanceOrderStatus(o));
      expect(updated[0].status).toBe(ORDER_STATUSES.ACCEPTED);
    });

    it('updateOrderInList with object merge', () => {
      const list = [baseOrder('o1', ORDER_STATUSES.PLACED)];
      const updated = updateOrderInList(list, 'o1', { total: 999 });
      expect(updated[0].total).toBe(999);
    });

    it('updateOrderInList handles invalid inputs', () => {
      expect(updateOrderInList(null, 'o1', {})).toEqual([]);
      const list = [baseOrder('o1')];
      expect(updateOrderInList(list, '', {})).toEqual(list);
    });
  });

  describe('filterOrdersByStatus', () => {
    const baseOrder = (id, status) => ({
      id, status, items: [], total: 0, address: {}, createdAt: Date.now(),
      history: [{ status, time: Date.now() }],
    });

    it('returns all for "all" filter', () => {
      const list = [
        baseOrder('o1', ORDER_STATUSES.PLACED),
        baseOrder('o2', ORDER_STATUSES.DELIVERED),
      ];
      expect(filterOrdersByStatus(list, 'all').length).toBe(2);
    });

    it('returns in_progress orders', () => {
      const list = [
        baseOrder('o1', ORDER_STATUSES.PLACED),
        baseOrder('o2', ORDER_STATUSES.ACCEPTED),
        baseOrder('o3', ORDER_STATUSES.DELIVERED),
        baseOrder('o4', ORDER_STATUSES.CANCELLED),
      ];
      const filtered = filterOrdersByStatus(list, 'in_progress');
      expect(filtered.length).toBe(2);
      expect(filtered.every((o) => [ORDER_STATUSES.PLACED, ORDER_STATUSES.ACCEPTED].includes(o.status))).toBe(true);
    });

    it('returns delivered orders', () => {
      const list = [
        baseOrder('o1', ORDER_STATUSES.DELIVERED),
        baseOrder('o2', ORDER_STATUSES.PLACED),
      ];
      expect(filterOrdersByStatus(list, 'delivered').length).toBe(1);
    });

    it('returns cancelled orders', () => {
      const list = [
        baseOrder('o1', ORDER_STATUSES.CANCELLED),
        baseOrder('o2', ORDER_STATUSES.PLACED),
      ];
      expect(filterOrdersByStatus(list, 'cancelled').length).toBe(1);
    });

    it('handles invalid input', () => {
      expect(filterOrdersByStatus(null, 'all')).toEqual([]);
    });
  });

  describe('buildOrderTimeline', () => {
    it('builds timeline with completed and pending statuses', () => {
      const order = {
        status: ORDER_STATUSES.ACCEPTED,
        history: [
          { status: ORDER_STATUSES.PLACED, time: 1000, note: '已提交' },
          { status: ORDER_STATUSES.ACCEPTED, time: 2000, note: '已接单' },
        ],
      };
      const timeline = buildOrderTimeline(order);
      expect(timeline.length).toBe(5);
      const placed = timeline.find((t) => t.status === ORDER_STATUSES.PLACED);
      expect(placed.completed).toBe(true);
      expect(placed.time).toBe(1000);
      const accepted = timeline.find((t) => t.status === ORDER_STATUSES.ACCEPTED);
      expect(accepted.isCurrent).toBe(true);
      const delivering = timeline.find((t) => t.status === ORDER_STATUSES.DELIVERING);
      expect(delivering.completed).toBe(false);
      expect(delivering.time).toBeNull();
    });

    it('handles cancelled order', () => {
      const order = {
        status: ORDER_STATUSES.CANCELLED,
        history: [
          { status: ORDER_STATUSES.PLACED, time: 1000, note: '已提交' },
          { status: ORDER_STATUSES.CANCELLED, time: 2000, note: '已取消' },
        ],
      };
      const timeline = buildOrderTimeline(order);
      const cancelled = timeline.find((t) => t.status === ORDER_STATUSES.CANCELLED);
      expect(cancelled).toBeTruthy();
      expect(cancelled.isCurrent).toBe(true);
    });

    it('handles null order', () => {
      expect(buildOrderTimeline(null)).toEqual([]);
    });
  });

  describe('getAdvancementDelay', () => {
    it('returns 30000 for placed status', () => {
      expect(getAdvancementDelay(ORDER_STATUSES.PLACED)).toBe(30000);
    });

    it('returns 20000 for accepted status', () => {
      expect(getAdvancementDelay(ORDER_STATUSES.ACCEPTED)).toBe(20000);
    });

    it('returns 20000 for picked_up status', () => {
      expect(getAdvancementDelay(ORDER_STATUSES.PICKED_UP)).toBe(20000);
    });

    it('returns 25000 for delivering status', () => {
      expect(getAdvancementDelay(ORDER_STATUSES.DELIVERING)).toBe(25000);
    });

    it('returns null for terminal status', () => {
      expect(getAdvancementDelay(ORDER_STATUSES.DELIVERED)).toBeNull();
      expect(getAdvancementDelay(ORDER_STATUSES.CANCELLED)).toBeNull();
    });

    it('returns null for unknown status', () => {
      expect(getAdvancementDelay('unknown')).toBeNull();
    });
  });

  describe('filterShopsByCategory', () => {
    it('filters shops by category', () => {
      const filtered = filterShopsByCategory(SHOPS, '中餐');
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((s) => s.category === '中餐')).toBe(true);
    });

    it('returns all for "全部" category', () => {
      expect(filterShopsByCategory(SHOPS, '全部')).toEqual(SHOPS);
    });

    it('returns all for empty category', () => {
      expect(filterShopsByCategory(SHOPS, '')).toEqual(SHOPS);
    });

    it('handles invalid input', () => {
      expect(filterShopsByCategory(null, '中餐')).toEqual([]);
    });
  });

  describe('groupProducts', () => {
    it('groups products by group field', () => {
      const products = [
        { id: '1', group: '热销' },
        { id: '2', group: '主食' },
        { id: '3', group: '热销' },
      ];
      const groups = groupProducts(products);
      expect(groups['热销'].length).toBe(2);
      expect(groups['主食'].length).toBe(1);
    });

    it('handles empty/invalid input', () => {
      expect(groupProducts([])).toEqual({});
      expect(groupProducts(null)).toEqual({});
    });
  });

  describe('getShopProductGroups', () => {
    it('returns only groups present in shop products', () => {
      const shop = { products: [{ group: '热销' }, { group: '主食' }] };
      const result = getShopProductGroups(shop, SHOP_PRODUCTS_GROUPS);
      expect(result).toContain('热销');
      expect(result).toContain('主食');
      expect(result).not.toContain('饮品');
    });

    it('handles null shop', () => {
      expect(getShopProductGroups(null, SHOP_PRODUCTS_GROUPS)).toEqual(SHOP_PRODUCTS_GROUPS);
    });
  });

  describe('renderStars', () => {
    it('renders full and empty stars for integer rating', () => {
      const stars = renderStars(4);
      expect(stars.filter((s) => s === 'full').length).toBe(4);
      expect(stars.filter((s) => s === 'empty').length).toBe(1);
    });

    it('renders half star for 4.5 rating', () => {
      const stars = renderStars(4.5);
      expect(stars.filter((s) => s === 'full').length).toBe(4);
      expect(stars.filter((s) => s === 'half').length).toBe(1);
      expect(stars.filter((s) => s === 'empty').length).toBe(0);
    });

    it('handles 0 rating', () => {
      const stars = renderStars(0);
      expect(stars.filter((s) => s === 'empty').length).toBe(5);
    });

    it('handles negative rating', () => {
      const stars = renderStars(-1);
      expect(stars.length).toBe(0);
    });

    it('caps rating at 5', () => {
      const stars = renderStars(10);
      expect(stars.length).toBe(5);
      expect(stars.every((s) => s === 'full')).toBe(true);
    });

    it('handles null/undefined rating', () => {
      expect(renderStars(null)).toEqual([]);
      expect(renderStars(undefined)).toEqual([]);
    });

    it('handles 2.3 rating (rounds down to no half)', () => {
      const stars = renderStars(2.3);
      expect(stars.filter((s) => s === 'full').length).toBe(2);
      expect(stars.filter((s) => s === 'half').length).toBe(0);
      expect(stars.filter((s) => s === 'empty').length).toBe(3);
    });

    it('handles 2.6 rating (rounds to half)', () => {
      const stars = renderStars(2.6);
      expect(stars.filter((s) => s === 'full').length).toBe(2);
      expect(stars.filter((s) => s === 'half').length).toBe(1);
      expect(stars.filter((s) => s === 'empty').length).toBe(2);
    });
  });

  describe('generateProductColor', () => {
    it('generates an hsl color string', () => {
      const color = generateProductColor('麻婆豆腐');
      expect(color).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/);
    });

    it('generates consistent color for same name', () => {
      expect(generateProductColor('米饭')).toBe(generateProductColor('米饭'));
    });

    it('generates different colors for different names', () => {
      expect(generateProductColor('米饭')).not.toBe(generateProductColor('面条'));
    });

    it('handles empty/null name', () => {
      expect(generateProductColor('')).toBe('#888');
      expect(generateProductColor(null)).toBe('#888');
    });
  });
});

describe('food-order/storage', () => {
  let storage;
  beforeEach(() => {
    storage = createMockStorage();
  });

  it('saveCart and loadCart round-trip', async () => {
    const { saveCart, loadCart } = await import('@/pages/food-order/storage.js');
    saveCart([{ cartItemId: 'c1', name: 'foo', price: 99, quantity: 2 }], storage);
    const loaded = loadCart(storage);
    expect(loaded.length).toBe(1);
    expect(loaded[0].cartItemId).toBe('c1');
  });

  it('loadCart defaults to empty array', async () => {
    const { loadCart } = await import('@/pages/food-order/storage.js');
    expect(loadCart(storage)).toEqual([]);
  });

  it('saveAddresses and loadAddresses round-trip', async () => {
    const { saveAddresses, loadAddresses } = await import('@/pages/food-order/storage.js');
    const addr = { id: 'a1', receiver: '张三' };
    saveAddresses([addr], storage);
    expect(loadAddresses(storage)).toEqual([addr]);
  });

  it('saveOrders and loadOrders round-trip', async () => {
    const { saveOrders, loadOrders } = await import('@/pages/food-order/storage.js');
    const order = { id: 'o1', status: ORDER_STATUSES.PLACED };
    saveOrders([order], storage);
    expect(loadOrders(storage)).toEqual([order]);
  });

  it('handles corrupted JSON gracefully', async () => {
    const { loadCart } = await import('@/pages/food-order/storage.js');
    storage.setItem('food_order_cart', '{bad json');
    expect(loadCart(storage)).toEqual([]);
  });

  it('does not throw when storage is null', async () => {
    const { saveCart, loadCart, saveOrders, loadOrders } = await import('@/pages/food-order/storage.js');
    expect(() => saveCart([], null)).not.toThrow();
    expect(() => loadCart(null)).not.toThrow();
    expect(() => saveOrders([], null)).not.toThrow();
    expect(() => loadOrders(null)).not.toThrow();
  });
});
