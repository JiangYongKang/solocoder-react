import {
  DANMAKU_TYPES,
  DANMAKU_COLORS,
  DANMAKU_MAX_HISTORY,
  MIN_ONLINE_COUNT,
  MAX_ONLINE_COUNT,
  ONLINE_CHANGE_AMOUNT_MIN,
  ONLINE_CHANGE_AMOUNT_MAX,
  MOCK_USERNAMES,
  MOCK_COMMENTS,
  PURCHASE_NOTICE_TEMPLATES,
} from './constants.js';

export function formatPrice(price) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return '¥0.00';
  return `¥${Number(price).toFixed(2)}`;
}

export function getDiscountPercent(originalPrice, livePrice) {
  const orig = Number(originalPrice);
  const live = Number(livePrice);
  if (!orig || orig <= 0 || live <= 0) return 0;
  const percent = Math.round(((orig - live) / orig) * 100);
  return Math.max(0, Math.min(100, percent));
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getNextCarouselIndex(currentIndex, totalCount) {
  const count = Number(totalCount);
  const current = Number(currentIndex);
  if (!count || count <= 0) return 0;
  return (current + 1) % count;
}

export function getPrevCarouselIndex(currentIndex, totalCount) {
  const count = Number(totalCount);
  const current = Number(currentIndex);
  if (!count || count <= 0) return 0;
  return (current - 1 + count) % count;
}

export function getClampedCarouselIndex(index, totalCount) {
  const count = Number(totalCount);
  const idx = Number(index);
  if (!count || count <= 0) return 0;
  if (idx < 0) return 0;
  if (idx >= count) return count - 1;
  return Math.floor(idx);
}

export function buildSpecKey(selectedSpecs) {
  if (!selectedSpecs || Object.keys(selectedSpecs).length === 0) return '';
  return Object.entries(selectedSpecs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
    .join(' / ');
}

export function getInitialSpecs(product) {
  if (!product || !product.specs || product.specs.length === 0) return {};
  const result = {};
  for (const spec of product.specs) {
    if (spec.options && spec.options.length > 0) {
      result[spec.name] = spec.options[0];
    }
  }
  return result;
}

export function addToBag(bag, product, selectedSpecs, quantity = 1) {
  if (!Array.isArray(bag)) return [];
  if (!product || !product.id) return bag;

  const specKey = buildSpecKey(selectedSpecs);
  const cartItemId = specKey ? `${product.id}__${specKey.replace(/\s*\/\s*/g, '-')}` : product.id;
  const safeQty = Math.max(1, Math.floor(Number(quantity) || 1));

  const existing = bag.find((item) => item.cartItemId === cartItemId);
  if (existing) {
    return bag.map((item) =>
      item.cartItemId === cartItemId
        ? { ...item, quantity: item.quantity + safeQty }
        : item
    );
  }

  return [
    ...bag,
    {
      cartItemId,
      productId: product.id,
      name: product.name,
      price: product.livePrice,
      originalPrice: product.originalPrice,
      specKey,
      quantity: safeQty,
      image: product.image,
      bgColor: product.bgColor,
    },
  ];
}

export function updateBagQuantity(bag, cartItemId, quantity) {
  if (!Array.isArray(bag)) return [];
  if (!cartItemId) return bag;
  const safeQty = Math.floor(Number(quantity) || 0);
  if (safeQty <= 0) {
    return bag.filter((item) => item.cartItemId !== cartItemId);
  }
  return bag.map((item) =>
    item.cartItemId === cartItemId ? { ...item, quantity: safeQty } : item
  );
}

export function removeFromBag(bag, cartItemId) {
  if (!Array.isArray(bag)) return [];
  if (!cartItemId) return bag;
  return bag.filter((item) => item.cartItemId !== cartItemId);
}

export function clearBag() {
  return [];
}

export function calcBagSubtotal(bag) {
  if (!Array.isArray(bag)) return 0;
  return bag.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );
}

export function calcBagCount(bag) {
  if (!Array.isArray(bag)) return 0;
  return bag.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

export function getBestApplicableCoupon(totalAmount, coupons) {
  if (!Array.isArray(coupons) || coupons.length === 0) return null;
  const total = Number(totalAmount) || 0;
  let best = null;
  for (const coupon of coupons) {
    if (!coupon || !coupon.amount || !coupon.threshold) continue;
    if (total >= coupon.threshold) {
      if (!best || coupon.amount > best.amount) {
        best = coupon;
      }
    }
  }
  return best;
}

export function calcBagTotal(bag, coupons) {
  const subtotal = calcBagSubtotal(bag);
  const bestCoupon = getBestApplicableCoupon(subtotal, coupons);
  const discount = bestCoupon ? Number(bestCoupon.amount) || 0 : 0;
  const total = Math.max(0, subtotal - discount);
  return {
    subtotal,
    discount,
    total,
    appliedCoupon: bestCoupon,
  };
}

export function padZero(num) {
  return String(Math.floor(Number(num) || 0)).padStart(2, '0');
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(Number(ms) || 0));
  const totalSeconds = Math.floor(total / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    minutes: padZero(minutes),
    seconds: padZero(seconds),
    totalSeconds,
    totalMs: total,
    expired: total <= 0,
  };
}

export function pickRandom(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomUsername() {
  return pickRandom(MOCK_USERNAMES) || '匿名用户';
}

export function createDanmaku(options = {}) {
  const {
    type = DANMAKU_TYPES.COMMENT,
    content = '',
    username = '',
  } = options;

  const validTypes = Object.values(DANMAKU_TYPES);
  const safeType = validTypes.includes(type) ? type : DANMAKU_TYPES.COMMENT;

  return {
    id: generateId('dmk'),
    type: safeType,
    content: String(content),
    username: username || pickRandomUsername(),
    color: DANMAKU_COLORS[safeType] || DANMAKU_COLORS[DANMAKU_TYPES.COMMENT],
    createdAt: Date.now(),
  };
}

export function generateRandomCommentDanmaku() {
  return createDanmaku({
    type: DANMAKU_TYPES.COMMENT,
    content: pickRandom(MOCK_COMMENTS) || '666',
  });
}

export function generateRandomPurchaseDanmaku(productName) {
  const template = pickRandom(PURCHASE_NOTICE_TEMPLATES) || '{username} 购买了 {product}';
  const content = template
    .replace('{username}', pickRandomUsername())
    .replace('{product}', productName || '商品');
  return createDanmaku({
    type: DANMAKU_TYPES.PURCHASE,
    content,
  });
}

export function generateRandomLikeDanmaku() {
  const emojis = ['❤️', '💕', '💖', '💗', '💘', '💝'];
  return createDanmaku({
    type: DANMAKU_TYPES.LIKE,
    content: pickRandom(emojis) || '❤️',
  });
}

export function pushDanmaku(history, danmaku) {
  if (!Array.isArray(history)) return [];
  if (!danmaku) return history;
  const next = [...history, danmaku];
  if (next.length > DANMAKU_MAX_HISTORY) {
    return next.slice(next.length - DANMAKU_MAX_HISTORY);
  }
  return next;
}

export function nextOnlineCount(current) {
  const currentCount = Number(current) || 0;
  const changeAmount =
    ONLINE_CHANGE_AMOUNT_MIN +
    Math.floor(Math.random() * (ONLINE_CHANGE_AMOUNT_MAX - ONLINE_CHANGE_AMOUNT_MIN + 1));
  const direction = Math.random() < 0.5 ? -1 : 1;
  let next = currentCount + direction * changeAmount;
  next = Math.max(MIN_ONLINE_COUNT, next);
  next = Math.min(MAX_ONLINE_COUNT, next);
  return next;
}

export function generateInitialOnlineCount() {
  return (
    MIN_ONLINE_COUNT +
    Math.floor(Math.random() * (MAX_ONLINE_COUNT - MIN_ONLINE_COUNT + 1))
  );
}

export function nextCouponIndex(currentIndex, totalCount) {
  const count = Number(totalCount);
  if (!count || count <= 0) return 0;
  const current = Number(currentIndex) || 0;
  return (current + 1) % count;
}
