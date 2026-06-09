import {
  COUPON_TYPES,
  COUPON_STATUS,
  USER_COUPON_STATUS,
  STORAGE_KEY,
  USER_COUPONS_STORAGE_KEY,
  PAGE_SIZE,
  MOCK_COUPONS,
} from './constants.js'

export function generateId() {
  return 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function generateUserCouponId() {
  return 'uc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function loadCoupons() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore
  }
  return [...MOCK_COUPONS]
}

export function saveCoupons(coupons) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons))
    return true
  } catch {
    return false
  }
}

export function loadUserCoupons() {
  try {
    const raw = localStorage.getItem(USER_COUPONS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore
  }
  return []
}

export function saveUserCoupons(userCoupons) {
  try {
    localStorage.setItem(USER_COUPONS_STORAGE_KEY, JSON.stringify(userCoupons))
    return true
  } catch {
    return false
  }
}

export function validateCoupon(data) {
  const errors = {}
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.name = '优惠券名称不能为空'
  } else if (data.name.trim().length > 50) {
    errors.name = '优惠券名称不能超过50个字符'
  }
  if (!data.type || !Object.values(COUPON_TYPES).includes(data.type)) {
    errors.type = '请选择优惠券类型'
  }
  if (data.denomination === undefined || data.denomination === null || data.denomination === '') {
    errors.denomination = '请填写面额'
  } else {
    const denom = Number(data.denomination)
    if (isNaN(denom) || denom <= 0) {
      errors.denomination = '面额必须为正数'
    } else if (data.type === COUPON_TYPES.DISCOUNT && (denom < 1 || denom > 9.9)) {
      errors.denomination = '折扣券的折扣必须在1-9.9之间'
    }
  }
  if (data.type !== COUPON_TYPES.FLAT) {
    if (data.threshold === undefined || data.threshold === null || data.threshold === '') {
      errors.threshold = '请填写使用门槛'
    } else {
      const th = Number(data.threshold)
      if (isNaN(th) || th <= 0) {
        errors.threshold = '门槛必须为正数'
      }
    }
  }
  if (!data.startDate) {
    errors.startDate = '请选择开始日期'
  }
  if (!data.endDate) {
    errors.endDate = '请选择结束日期'
  }
  if (data.startDate && data.endDate) {
    const start = typeof data.startDate === 'number' ? data.startDate : new Date(data.startDate).getTime()
    const end = typeof data.endDate === 'number' ? data.endDate : new Date(data.endDate).getTime()
    if (end < start) {
      errors.endDate = '结束日期不能早于开始日期'
    }
  }
  if (data.totalCount === undefined || data.totalCount === null || data.totalCount === '') {
    errors.totalCount = '请填写发放总量'
  } else {
    const tc = Number(data.totalCount)
    if (isNaN(tc) || !Number.isInteger(tc) || tc <= 0) {
      errors.totalCount = '发放总量必须是正整数'
    }
  }
  return errors
}

export function createCoupon(coupons, data) {
  const errors = validateCoupon(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const startDate = typeof data.startDate === 'number' ? data.startDate : new Date(data.startDate).getTime()
  const endDate = typeof data.endDate === 'number' ? data.endDate : new Date(data.endDate).getTime()
  const newCoupon = {
    id: generateId(),
    name: data.name.trim(),
    type: data.type,
    denomination: Number(data.denomination),
    threshold: data.type === COUPON_TYPES.FLAT ? 0 : Number(data.threshold),
    startDate,
    endDate,
    totalCount: Number(data.totalCount),
    receivedCount: 0,
    createdAt: Date.now(),
  }
  const updated = [newCoupon, ...(Array.isArray(coupons) ? coupons : [])]
  return { success: true, coupon: newCoupon, coupons: updated }
}

export function deleteCoupon(coupons, id) {
  if (!id) return { success: false, coupons }
  const exists = coupons.some((c) => c.id === id)
  if (!exists) {
    return { success: false, coupons }
  }
  return { success: true, coupons: coupons.filter((c) => c.id !== id) }
}

export function getCouponStatus(coupon, now = Date.now()) {
  if (!coupon) return null
  if (now < coupon.startDate) {
    return COUPON_STATUS.NOT_STARTED
  }
  if (now > coupon.endDate) {
    return COUPON_STATUS.EXPIRED
  }
  return COUPON_STATUS.ONGOING
}

export function getUserCouponStatus(userCoupon, now = Date.now()) {
  if (!userCoupon) return null
  if (userCoupon.usedAt) {
    return USER_COUPON_STATUS.USED
  }
  if (now > userCoupon.endDate) {
    return USER_COUPON_STATUS.EXPIRED
  }
  return USER_COUPON_STATUS.UNUSED
}

export function searchCoupons(coupons, keyword) {
  if (!Array.isArray(coupons)) return []
  if (!keyword || !keyword.trim()) return coupons
  const kw = keyword.trim().toLowerCase()
  return coupons.filter((c) => c.name && c.name.toLowerCase().includes(kw))
}

export function filterCouponsByStatus(coupons, status) {
  if (!Array.isArray(coupons)) return []
  if (!status || status === 'all') return coupons
  return coupons.filter((c) => getCouponStatus(c) === status)
}

export function paginateCoupons(coupons, page, pageSize = PAGE_SIZE) {
  if (!Array.isArray(coupons)) return { items: [], totalPages: 1, currentPage: 1, total: 0 }
  const safePage = Math.max(1, Number(page) || 1)
  const safeSize = Math.max(1, Number(pageSize) || PAGE_SIZE)
  const total = coupons.length
  const totalPages = Math.max(1, Math.ceil(total / safeSize))
  const currentPage = Math.min(safePage, totalPages)
  const start = (currentPage - 1) * safeSize
  return {
    items: coupons.slice(start, start + safeSize),
    total,
    totalPages,
    currentPage,
    pageSize: safeSize,
  }
}

export function getCouponList(coupons, options = {}) {
  let result = Array.isArray(coupons) ? [...coupons] : []
  result = searchCoupons(result, options.keyword)
  result = filterCouponsByStatus(result, options.status)
  result = result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  return paginateCoupons(result, options.page || 1, options.pageSize)
}

export function getClaimableCoupons(coupons, userCoupons = []) {
  if (!Array.isArray(coupons)) return []
  const now = Date.now()
  const claimedIds = new Set(
    userCoupons
      .filter((uc) => uc && uc.couponId)
      .map((uc) => uc.couponId)
  )
  return coupons.filter((c) => {
    if (!c) return false
    const status = getCouponStatus(c, now)
    return (
      status === COUPON_STATUS.ONGOING &&
      c.receivedCount < c.totalCount &&
      !claimedIds.has(c.id)
    )
  })
}

export function claimCoupon(coupons, userCoupons, couponId) {
  if (!couponId) return { success: false, error: '参数错误' }
  const coupon = coupons.find((c) => c.id === couponId)
  if (!coupon) return { success: false, error: '优惠券不存在' }
  const status = getCouponStatus(coupon)
  if (status !== COUPON_STATUS.ONGOING) {
    return { success: false, error: '优惠券不在有效期内' }
  }
  if (coupon.receivedCount >= coupon.totalCount) {
    return { success: false, error: '优惠券已被领完' }
  }
  const alreadyClaimed = userCoupons.some((uc) => uc.couponId === couponId)
  if (alreadyClaimed) {
    return { success: false, error: '您已领取过该优惠券' }
  }
  const updatedCoupons = coupons.map((c) =>
    c.id === couponId ? { ...c, receivedCount: c.receivedCount + 1 } : c
  )
  const userCoupon = {
    id: generateUserCouponId(),
    couponId: coupon.id,
    name: coupon.name,
    type: coupon.type,
    denomination: coupon.denomination,
    threshold: coupon.threshold,
    startDate: coupon.startDate,
    endDate: coupon.endDate,
    claimedAt: Date.now(),
    usedAt: null,
  }
  const updatedUserCoupons = [userCoupon, ...userCoupons]
  return {
    success: true,
    userCoupon,
    coupons: updatedCoupons,
    userCoupons: updatedUserCoupons,
  }
}

export function filterUserCoupons(userCoupons, status) {
  if (!Array.isArray(userCoupons)) return []
  if (!status || status === 'all') return userCoupons
  return userCoupons.filter((uc) => getUserCouponStatus(uc) === status)
}

export function getAvailableCouponsForOrder(userCoupons, orderAmount) {
  if (!Array.isArray(userCoupons) || !orderAmount || orderAmount <= 0) return []
  const now = Date.now()
  return userCoupons.filter((uc) => {
    if (!uc) return false
    const status = getUserCouponStatus(uc, now)
    if (status !== USER_COUPON_STATUS.UNUSED) return false
    if (orderAmount < uc.threshold) return false
    return true
  })
}

export function calculateDiscount(coupon, orderAmount) {
  if (!coupon || !orderAmount || orderAmount <= 0) {
    return { discountedAmount: orderAmount || 0, discountAmount: 0 }
  }
  const amount = Number(orderAmount)
  switch (coupon.type) {
    case COUPON_TYPES.FULL_REDUCTION:
      if (amount >= coupon.threshold) {
        const discountAmount = Math.min(coupon.denomination, amount)
        return {
          discountedAmount: Math.max(0, amount - discountAmount),
          discountAmount,
        }
      }
      return { discountedAmount: amount, discountAmount: 0 }
    case COUPON_TYPES.DISCOUNT:
      if (amount >= coupon.threshold) {
        const discountedAmount = Math.max(0, Number((amount * coupon.denomination / 10).toFixed(2)))
        return {
          discountedAmount,
          discountAmount: Number((amount - discountedAmount).toFixed(2)),
        }
      }
      return { discountedAmount: amount, discountAmount: 0 }
    case COUPON_TYPES.FLAT: {
      const discountAmount = Math.min(coupon.denomination, amount)
      return {
        discountedAmount: Math.max(0, amount - discountAmount),
        discountAmount,
      }
    }
    default:
      return { discountedAmount: amount, discountAmount: 0 }
  }
}

export function markCouponAsUsed(userCoupons, userCouponId) {
  if (!userCouponId) return { success: false, userCoupons }
  const exists = userCoupons.find((uc) => uc.id === userCouponId)
  if (!exists) return { success: false, userCoupons }
  const status = getUserCouponStatus(exists)
  if (status !== USER_COUPON_STATUS.UNUSED) {
    return { success: false, userCoupons, error: '优惠券不可用' }
  }
  const updated = userCoupons.map((uc) =>
    uc.id === userCouponId ? { ...uc, usedAt: Date.now() } : uc
  )
  return { success: true, userCoupons: updated }
}

export function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatPrice(price) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return '¥0.00'
  return `¥${Number(price).toFixed(2)}`
}

export function formatCouponValue(coupon) {
  if (!coupon) return ''
  switch (coupon.type) {
    case COUPON_TYPES.FULL_REDUCTION:
      return `满${coupon.threshold}减${coupon.denomination}`
    case COUPON_TYPES.DISCOUNT:
      return `满${coupon.threshold}打${coupon.denomination}折`
    case COUPON_TYPES.FLAT:
      return `立减${coupon.denomination}元`
    default:
      return ''
  }
}
