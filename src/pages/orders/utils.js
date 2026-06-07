import {
  ORDER_STATUSES,
  STATUS_NEXT_MAP,
  LOGISTICS_TEMPLATE,
  PAGE_SIZE,
  PRODUCTS,
} from './constants.js';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatPrice(price) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return '¥0.00';
  return `¥${Number(price).toFixed(2)}`;
}

export function createEmptyCart() {
  return [];
}

export function addToCart(cart, product, quantity = 1) {
  if (!product || !product.id) return cart;
  const safeQty = Math.max(1, Math.min(Number(quantity) || 1, product.stock || Number.MAX_SAFE_INTEGER));
  const existing = cart.find((item) => item.productId === product.id);
  if (existing) {
    return cart.map((item) =>
      item.productId === product.id
        ? { ...item, quantity: Math.min(item.quantity + safeQty, product.stock || Number.MAX_SAFE_INTEGER) }
        : item
    );
  }
  return [
    ...cart,
    {
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: safeQty,
    },
  ];
}

export function updateCartQuantity(cart, productId, quantity, stock) {
  if (!productId) return cart;
  const safeQty = Number(quantity) || 0;
  if (safeQty <= 0) {
    return cart.filter((item) => item.productId !== productId);
  }
  const maxStock = typeof stock === 'number' ? stock : safeQty;
  return cart.map((item) =>
    item.productId === productId
      ? { ...item, quantity: Math.min(safeQty, maxStock) }
      : item
  );
}

export function removeFromCart(cart, productId) {
  if (!productId) return cart;
  return cart.filter((item) => item.productId !== productId);
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

export function createOrder(cart, address) {
  if (!Array.isArray(cart) || cart.length === 0) return null;
  const total = calcCartTotal(cart);
  return {
    id: generateId(),
    status: ORDER_STATUSES.PENDING_PAYMENT,
    items: cart.map((item) => ({ ...item })),
    total,
    address: { ...address },
    createdAt: Date.now(),
    history: [
      { status: ORDER_STATUSES.PENDING_PAYMENT, time: Date.now(), note: '订单已创建，等待付款' },
    ],
  };
}

export function advanceOrderStatus(order) {
  if (!order) return null;
  const next = STATUS_NEXT_MAP[order.status];
  if (!next) return order;
  const notes = {
    [ORDER_STATUSES.PAID]: '付款成功，等待商家发货',
    [ORDER_STATUSES.SHIPPED]: '商家已发货，等待收货',
    [ORDER_STATUSES.COMPLETED]: '订单已完成，感谢购买',
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
  if (order.status === ORDER_STATUSES.COMPLETED || order.status === ORDER_STATUSES.CANCELLED) return order;
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

export function filterOrdersByStatus(orders, status) {
  if (!Array.isArray(orders)) return [];
  if (!status) return orders;
  return orders.filter((order) => order.status === status);
}

export function paginateOrders(orders, page, pageSize = PAGE_SIZE) {
  if (!Array.isArray(orders)) return { items: [], totalPages: 1, currentPage: 1 };
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.max(1, Number(pageSize) || PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(orders.length / safeSize));
  const start = (safePage - 1) * safeSize;
  return {
    items: orders.slice(start, start + safeSize),
    totalPages,
    currentPage: Math.min(safePage, totalPages),
  };
}

export function buildLogisticsTimeline(order) {
  if (!order || order.status === ORDER_STATUSES.PENDING_PAYMENT) return [];
  if (order.status === ORDER_STATUSES.PAID) {
    return [
      { status: ORDER_STATUSES.PAID, time: order.createdAt, label: '已付款，等待商家发货', isLatest: true },
    ];
  }
  const shippedEntry = (order.history || []).find((h) => h.status === ORDER_STATUSES.SHIPPED);
  const shippedTime = shippedEntry ? shippedEntry.time : order.createdAt;
  const total = LOGISTICS_TEMPLATE.length;
  let visible;
  if (order.status === ORDER_STATUSES.SHIPPED) {
    visible = Math.ceil(total / 2);
  } else if (order.status === ORDER_STATUSES.COMPLETED) {
    visible = total;
  } else {
    visible = 1;
  }
  const timeline = [];
  for (let i = 0; i < visible; i++) {
    const tpl = LOGISTICS_TEMPLATE[i];
    timeline.push({
      label: tpl.label,
      time: shippedTime + tpl.offsetHours * 60 * 60 * 1000,
      isLatest: i === visible - 1,
    });
  }
  return timeline.reverse();
}

export function getProductById(productId) {
  if (!productId) return null;
  return PRODUCTS.find((p) => p.id === productId) || null;
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
