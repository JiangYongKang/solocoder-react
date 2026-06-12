import {
  ORDER_STATUSES,
  STATUS_NEXT_MAP,
  STATUS_ORDER,
  STATUS_LABELS,
  MAX_ADDRESSES,
} from './constants.js';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatPrice(price) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return '¥0.00';
  return `¥${Number(price).toFixed(2)}`;
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function buildSpecKey(selectedSpecs) {
  if (!selectedSpecs || Object.keys(selectedSpecs).length === 0) return '';
  return Object.values(selectedSpecs).join('/');
}

export function getSpecPrice(product, selectedSpecs) {
  if (!product) return 0;
  if (!product.specs || product.specs.length === 0) return product.price;
  const key = buildSpecKey(selectedSpecs);
  if (product.specPrices && product.specPrices[key] !== undefined) {
    return product.specPrices[key];
  }
  return product.price;
}

export function hasMultipleSpecs(product) {
  return !!(product && product.specs && product.specs.length > 0);
}

export function addToCart(cart, product, selectedSpecs, quantity = 1) {
  if (!product || !product.id) return cart;
  const specKey = buildSpecKey(selectedSpecs);
  const price = getSpecPrice(product, selectedSpecs);
  const safeQty = Math.max(1, Number(quantity) || 1);
  const cartItemId = specKey ? `${product.id}__${specKey}` : product.id;
  const existing = cart.find((item) => item.cartItemId === cartItemId);
  if (existing) {
    return cart.map((item) =>
      item.cartItemId === cartItemId
        ? { ...item, quantity: item.quantity + safeQty }
        : item
    );
  }
  return [
    ...cart,
    {
      cartItemId,
      productId: product.id,
      name: product.name,
      price,
      specKey,
      quantity: safeQty,
      shopId: product.shopId || '',
    },
  ];
}

export function updateCartQuantity(cart, cartItemId, quantity) {
  if (!cartItemId) return cart;
  const safeQty = Number(quantity) || 0;
  if (safeQty <= 0) {
    return cart.filter((item) => item.cartItemId !== cartItemId);
  }
  return cart.map((item) =>
    item.cartItemId === cartItemId ? { ...item, quantity: safeQty } : item
  );
}

export function removeFromCart(cart, cartItemId) {
  if (!cartItemId) return cart;
  return cart.filter((item) => item.cartItemId !== cartItemId);
}

export function clearCart() {
  return [];
}

export function calcCartTotal(cart) {
  if (!Array.isArray(cart)) return 0;
  return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
}

export function calcCartCount(cart) {
  if (!Array.isArray(cart)) return 0;
  return cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

export function filterCartByShop(cart, shopId) {
  if (!Array.isArray(cart)) return [];
  if (!shopId) return cart;
  return cart.filter((item) => item.shopId === shopId);
}

export function validateAddress(address) {
  const errors = {};
  if (!address || typeof address !== 'object') return { valid: false, errors: { address: 'invalid' } };
  if (!address.receiver || typeof address.receiver !== 'string' || !address.receiver.trim()) {
    errors.receiver = '收货人不能为空';
  }
  if (!address.phone || typeof address.phone !== 'string') {
    errors.phone = '手机号不能为空';
  } else if (!/^1[3-9]\d{9}$/.test(address.phone.trim())) {
    errors.phone = '手机号格式不正确';
  }
  if (!address.province || typeof address.province !== 'string' || !address.province.trim()) {
    errors.province = '请选择省份';
  }
  if (!address.city || typeof address.city !== 'string' || !address.city.trim()) {
    errors.city = '请填写城市';
  }
  if (!address.district || typeof address.district !== 'string' || !address.district.trim()) {
    errors.district = '请填写区/县';
  }
  if (!address.detail || typeof address.detail !== 'string' || !address.detail.trim()) {
    errors.detail = '详细地址不能为空';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function addAddress(addresses, newAddress) {
  if (!Array.isArray(addresses)) return [newAddress];
  if (addresses.length >= MAX_ADDRESSES) {
    return { result: addresses, error: `最多保存${MAX_ADDRESSES}个地址` };
  }
  return { result: [{ ...newAddress, id: generateId() }, ...addresses], error: null };
}

export function createOrder(cart, address, shopId, shopName, remark) {
  if (!Array.isArray(cart) || cart.length === 0) return null;
  const total = calcCartTotal(cart);
  const estimatedDelivery = Date.now() + (30 + Math.floor(Math.random() * 20)) * 60 * 1000;
  return {
    id: generateId(),
    shopId,
    shopName,
    status: ORDER_STATUSES.PLACED,
    items: cart.map((item) => ({ ...item })),
    total,
    address: { ...address },
    remark: remark || '',
    createdAt: Date.now(),
    estimatedDelivery,
    history: [
      { status: ORDER_STATUSES.PLACED, time: Date.now(), note: '订单已提交，等待商家接单' },
    ],
  };
}

export function advanceOrderStatus(order) {
  if (!order) return null;
  const next = STATUS_NEXT_MAP[order.status];
  if (!next) return order;
  const notes = {
    [ORDER_STATUSES.ACCEPTED]: '商家已接单，正在准备餐品',
    [ORDER_STATUSES.PICKED_UP]: '骑手已取餐，即将配送',
    [ORDER_STATUSES.DELIVERING]: '骑手正在配送中，请耐心等待',
    [ORDER_STATUSES.DELIVERED]: '订单已送达，祝您用餐愉快',
  };
  return {
    ...order,
    status: next,
    history: [
      ...(order.history || []),
      { status: next, time: Date.now(), note: notes[next] || '' },
    ],
  };
}

export function cancelOrder(order) {
  if (!order) return null;
  if (order.status === ORDER_STATUSES.DELIVERED || order.status === ORDER_STATUSES.CANCELLED) return order;
  return {
    ...order,
    status: ORDER_STATUSES.CANCELLED,
    history: [
      ...(order.history || []),
      { status: ORDER_STATUSES.CANCELLED, time: Date.now(), note: '订单已取消' },
    ],
  };
}

export function addOrderToList(orders, order) {
  if (!order) return orders;
  return [order, ...(Array.isArray(orders) ? orders : [])];
}

export function updateOrderInList(orders, orderId, updater) {
  if (!Array.isArray(orders)) return [];
  if (!orderId) return orders;
  return orders.map((order) => {
    if (order.id !== orderId) return order;
    if (typeof updater === 'function') return updater(order);
    return { ...order, ...updater };
  });
}

export function filterOrdersByStatus(orders, statusFilter) {
  if (!Array.isArray(orders)) return [];
  if (!statusFilter || statusFilter === 'all') return orders;
  const inProgressStatuses = [
    ORDER_STATUSES.PLACED,
    ORDER_STATUSES.ACCEPTED,
    ORDER_STATUSES.PICKED_UP,
    ORDER_STATUSES.DELIVERING,
  ];
  if (statusFilter === 'in_progress') {
    return orders.filter((o) => inProgressStatuses.includes(o.status));
  }
  if (statusFilter === 'delivered') {
    return orders.filter((o) => o.status === ORDER_STATUSES.DELIVERED);
  }
  if (statusFilter === 'cancelled') {
    return orders.filter((o) => o.status === ORDER_STATUSES.CANCELLED);
  }
  return orders.filter((o) => o.status === statusFilter);
}

export function buildOrderTimeline(order) {
  if (!order) return [];
  const result = STATUS_ORDER.map((status) => {
    const historyEntry = (order.history || []).find((h) => h.status === status);
    const currentIdx = STATUS_ORDER.indexOf(order.status);
    const statusIdx = STATUS_ORDER.indexOf(status);
    return {
      status,
      label: STATUS_LABELS[status],
      time: historyEntry ? historyEntry.time : null,
      note: historyEntry ? historyEntry.note : '',
      completed: statusIdx <= currentIdx && order.status !== ORDER_STATUSES.CANCELLED,
      isCurrent: status === order.status,
    };
  });
  if (order.status === ORDER_STATUSES.CANCELLED) {
    const cancelEntry = (order.history || []).find((h) => h.status === ORDER_STATUSES.CANCELLED);
    result.push({
      status: ORDER_STATUSES.CANCELLED,
      label: STATUS_LABELS[ORDER_STATUSES.CANCELLED],
      time: cancelEntry ? cancelEntry.time : null,
      note: cancelEntry ? cancelEntry.note : '',
      completed: true,
      isCurrent: true,
    });
  }
  return result;
}

export function getAdvancementDelay(currentStatus) {
  switch (currentStatus) {
    case ORDER_STATUSES.PLACED: return 30000;
    case ORDER_STATUSES.ACCEPTED: return 20000;
    case ORDER_STATUSES.PICKED_UP: return 20000;
    case ORDER_STATUSES.DELIVERING: return 25000;
    default: return null;
  }
}

export function filterShopsByCategory(shops, category) {
  if (!Array.isArray(shops)) return [];
  if (!category || category === '全部') return shops;
  return shops.filter((s) => s.category === category);
}

export function groupProducts(products) {
  if (!Array.isArray(products)) return {};
  const groups = {};
  products.forEach((p) => {
    const g = p.group || '其他';
    if (!groups[g]) groups[g] = [];
    groups[g].push(p);
  });
  return groups;
}

export function getShopProductGroups(shop, allGroups) {
  if (!shop || !shop.products) return allGroups;
  const present = new Set(shop.products.map((p) => p.group));
  return allGroups.filter((g) => present.has(g));
}

export function renderStars(rating) {
  if (rating === null || rating === undefined || rating < 0) return [];
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.floor(r);
  const half = r - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  const stars = [];
  for (let i = 0; i < full; i++) stars.push('full');
  if (half) stars.push('half');
  for (let i = 0; i < empty; i++) stars.push('empty');
  return stars;
}

export function generateProductColor(name) {
  if (!name) return '#888';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 65%)`;
}
