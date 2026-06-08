import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  generateId,
  generateUserCouponId,
  validateCoupon,
  createCoupon,
  deleteCoupon,
  getCouponStatus,
  getUserCouponStatus,
  searchCoupons,
  filterCouponsByStatus,
  paginateCoupons,
  getCouponList,
  getClaimableCoupons,
  claimCoupon,
  filterUserCoupons,
  getAvailableCouponsForOrder,
  calculateDiscount,
  markCouponAsUsed,
  formatDate,
  formatPrice,
  formatCouponValue,
  loadCoupons,
  saveCoupons,
  loadUserCoupons,
  saveUserCoupons,
} from '../../coupon/couponUtils.js'
import {
  COUPON_TYPES,
  COUPON_STATUS,
  USER_COUPON_STATUS,
  STORAGE_KEY,
  USER_COUPONS_STORAGE_KEY,
  PAGE_SIZE,
} from '../../coupon/constants.js'

const createMockLocalStorage = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

let originalLocalStorage

beforeAll(() => {
  originalLocalStorage = globalThis.localStorage
  globalThis.localStorage = createMockLocalStorage()
})

afterAll(() => {
  globalThis.localStorage = originalLocalStorage
})

const makeValidCouponData = (overrides = {}) => ({
  name: '测试优惠券',
  type: COUPON_TYPES.FULL_REDUCTION,
  denomination: 20,
  threshold: 100,
  startDate: Date.now(),
  endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
  totalCount: 100,
  ...overrides,
})

const makeCoupon = (overrides = {}) => {
  const base = makeValidCouponData()
  return {
    id: generateId(),
    ...base,
    receivedCount: 0,
    createdAt: Date.now(),
    ...overrides,
  }
}

const makeUserCoupon = (overrides = {}) => ({
  id: generateUserCouponId(),
  couponId: 'test_coupon_id',
  name: '用户优惠券',
  type: COUPON_TYPES.FULL_REDUCTION,
  denomination: 20,
  threshold: 100,
  startDate: Date.now() - 24 * 60 * 60 * 1000,
  endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
  claimedAt: Date.now(),
  usedAt: null,
  ...overrides,
})

describe('generateId', () => {
  it('生成的ID以 c_ 开头', () => {
    expect(generateId()).toMatch(/^c_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('generateUserCouponId', () => {
  it('生成的ID以 uc_ 开头', () => {
    expect(generateUserCouponId()).toMatch(/^uc_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateUserCouponId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('validateCoupon', () => {
  it('有效的满减券数据返回空对象', () => {
    const errors = validateCoupon(makeValidCouponData())
    expect(Object.keys(errors).length).toBe(0)
  })

  it('有效的折扣券数据返回空对象', () => {
    const errors = validateCoupon(makeValidCouponData({
      type: COUPON_TYPES.DISCOUNT,
      denomination: 8.8,
    }))
    expect(Object.keys(errors).length).toBe(0)
  })

  it('有效的立减券数据返回空对象', () => {
    const errors = validateCoupon(makeValidCouponData({
      type: COUPON_TYPES.FLAT,
      denomination: 10,
      threshold: undefined,
    }))
    expect(Object.keys(errors).length).toBe(0)
  })

  it('名称为空时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ name: '' }))
    expect(errors.name).toBeTruthy()
  })

  it('名称为全空格时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ name: '   ' }))
    expect(errors.name).toBeTruthy()
  })

  it('名称超过50字符时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ name: 'a'.repeat(51) }))
    expect(errors.name).toBeTruthy()
  })

  it('类型无效时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ type: 'invalid' }))
    expect(errors.type).toBeTruthy()
  })

  it('面额为空时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ denomination: '' }))
    expect(errors.denomination).toBeTruthy()
  })

  it('面额为0时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ denomination: 0 }))
    expect(errors.denomination).toBeTruthy()
  })

  it('面额为负数时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ denomination: -10 }))
    expect(errors.denomination).toBeTruthy()
  })

  it('折扣券折扣小于1时报错', () => {
    const errors = validateCoupon(makeValidCouponData({
      type: COUPON_TYPES.DISCOUNT,
      denomination: 0.5,
    }))
    expect(errors.denomination).toBeTruthy()
  })

  it('折扣券折扣大于9.9时报错', () => {
    const errors = validateCoupon(makeValidCouponData({
      type: COUPON_TYPES.DISCOUNT,
      denomination: 10,
    }))
    expect(errors.denomination).toBeTruthy()
  })

  it('折扣券折扣在1-9.9之间验证通过', () => {
    const errors = validateCoupon(makeValidCouponData({
      type: COUPON_TYPES.DISCOUNT,
      denomination: 9.9,
    }))
    expect(errors.denomination).toBeFalsy()
  })

  it('非立减券门槛为空时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ threshold: '' }))
    expect(errors.threshold).toBeTruthy()
  })

  it('门槛为负数时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ threshold: -10 }))
    expect(errors.threshold).toBeTruthy()
  })

  it('立减券不需要门槛，不报错', () => {
    const errors = validateCoupon(makeValidCouponData({
      type: COUPON_TYPES.FLAT,
      threshold: undefined,
    }))
    expect(errors.threshold).toBeFalsy()
  })

  it('开始日期为空时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ startDate: '' }))
    expect(errors.startDate).toBeTruthy()
  })

  it('结束日期为空时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ endDate: '' }))
    expect(errors.endDate).toBeTruthy()
  })

  it('结束日期早于开始日期时报错', () => {
    const errors = validateCoupon(makeValidCouponData({
      startDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      endDate: Date.now(),
    }))
    expect(errors.endDate).toBeTruthy()
  })

  it('发放总量为空时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ totalCount: '' }))
    expect(errors.totalCount).toBeTruthy()
  })

  it('发放总量为0时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ totalCount: 0 }))
    expect(errors.totalCount).toBeTruthy()
  })

  it('发放总量为小数时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ totalCount: 1.5 }))
    expect(errors.totalCount).toBeTruthy()
  })

  it('发放总量为负数时报错', () => {
    const errors = validateCoupon(makeValidCouponData({ totalCount: -5 }))
    expect(errors.totalCount).toBeTruthy()
  })
})

describe('createCoupon', () => {
  it('数据无效时返回失败', () => {
    const result = createCoupon([], { name: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功创建优惠券并返回新列表', () => {
    const data = makeValidCouponData()
    const result = createCoupon([], data)
    expect(result.success).toBe(true)
    expect(result.coupon.id).toBeTruthy()
    expect(result.coupon.name).toBe('测试优惠券')
    expect(result.coupon.receivedCount).toBe(0)
    expect(result.coupon.createdAt).toBeTruthy()
    expect(result.coupons.length).toBe(1)
    expect(result.coupons[0]).toBe(result.coupon)
  })

  it('立减券自动将门槛设为0', () => {
    const result = createCoupon([], makeValidCouponData({
      type: COUPON_TYPES.FLAT,
      threshold: undefined,
    }))
    expect(result.success).toBe(true)
    expect(result.coupon.threshold).toBe(0)
  })

  it('新优惠券放在列表最前面', () => {
    const existing = [{ id: 'old', name: '旧券' }]
    const result = createCoupon(existing, makeValidCouponData())
    expect(result.coupons[0].id).toBe(result.coupon.id)
    expect(result.coupons[1].id).toBe('old')
  })
})

describe('deleteCoupon', () => {
  it('id为空时返回失败', () => {
    const result = deleteCoupon([{ id: '1' }], '')
    expect(result.success).toBe(false)
  })

  it('优惠券不存在时返回失败', () => {
    const result = deleteCoupon([], 'not-exist')
    expect(result.success).toBe(false)
    expect(result.coupons.length).toBe(0)
  })

  it('成功删除优惠券', () => {
    const existing = [
      { id: '1', name: '券1' },
      { id: '2', name: '券2' },
    ]
    const result = deleteCoupon(existing, '1')
    expect(result.success).toBe(true)
    expect(result.coupons.length).toBe(1)
    expect(result.coupons[0].id).toBe('2')
  })
})

describe('getCouponStatus', () => {
  const now = Date.now()

  it('未开始的优惠券返回 NOT_STARTED', () => {
    const coupon = makeCoupon({
      startDate: now + 10 * 24 * 60 * 60 * 1000,
      endDate: now + 30 * 24 * 60 * 60 * 1000,
    })
    expect(getCouponStatus(coupon, now)).toBe(COUPON_STATUS.NOT_STARTED)
  })

  it('进行中的优惠券返回 ONGOING', () => {
    const coupon = makeCoupon({
      startDate: now - 10 * 24 * 60 * 60 * 1000,
      endDate: now + 30 * 24 * 60 * 60 * 1000,
    })
    expect(getCouponStatus(coupon, now)).toBe(COUPON_STATUS.ONGOING)
  })

  it('已过期的优惠券返回 EXPIRED', () => {
    const coupon = makeCoupon({
      startDate: now - 30 * 24 * 60 * 60 * 1000,
      endDate: now - 10 * 24 * 60 * 60 * 1000,
    })
    expect(getCouponStatus(coupon, now)).toBe(COUPON_STATUS.EXPIRED)
  })

  it('传入null返回null', () => {
    expect(getCouponStatus(null)).toBe(null)
  })
})

describe('getUserCouponStatus', () => {
  const now = Date.now()

  it('未使用且未过期返回 UNUSED', () => {
    const uc = makeUserCoupon({
      startDate: now - 24 * 60 * 60 * 1000,
      endDate: now + 30 * 24 * 60 * 60 * 1000,
      usedAt: null,
    })
    expect(getUserCouponStatus(uc, now)).toBe(USER_COUPON_STATUS.UNUSED)
  })

  it('已使用返回 USED', () => {
    const uc = makeUserCoupon({
      usedAt: now - 60 * 60 * 1000,
    })
    expect(getUserCouponStatus(uc, now)).toBe(USER_COUPON_STATUS.USED)
  })

  it('未使用但已过期返回 EXPIRED', () => {
    const uc = makeUserCoupon({
      endDate: now - 24 * 60 * 60 * 1000,
      usedAt: null,
    })
    expect(getUserCouponStatus(uc, now)).toBe(USER_COUPON_STATUS.EXPIRED)
  })

  it('传入null返回null', () => {
    expect(getUserCouponStatus(null)).toBe(null)
  })
})

describe('searchCoupons', () => {
  const coupons = [
    { name: '新用户满减券' },
    { name: '全场8.8折券' },
    { name: '新用户专享券' },
  ]

  it('非数组输入返回空数组', () => {
    expect(searchCoupons(null, '新')).toEqual([])
  })

  it('空关键词返回全部', () => {
    expect(searchCoupons(coupons, '')).toEqual(coupons)
    expect(searchCoupons(coupons, '   ')).toEqual(coupons)
  })

  it('按名称模糊搜索', () => {
    const result = searchCoupons(coupons, '新用户')
    expect(result.length).toBe(2)
  })

  it('搜索不区分大小写', () => {
    const result = searchCoupons(coupons, 'FULL')
    expect(result.length).toBe(0)
  })
})

describe('filterCouponsByStatus', () => {
  const now = Date.now()
  const coupons = [
    makeCoupon({ startDate: now - 10 * 86400000, endDate: now + 10 * 86400000 }),
    makeCoupon({ startDate: now + 5 * 86400000, endDate: now + 20 * 86400000 }),
    makeCoupon({ startDate: now - 20 * 86400000, endDate: now - 5 * 86400000 }),
  ]

  it('非数组输入返回空数组', () => {
    expect(filterCouponsByStatus(null, COUPON_STATUS.ONGOING)).toEqual([])
  })

  it('all或空值返回全部', () => {
    expect(filterCouponsByStatus(coupons, 'all').length).toBe(3)
    expect(filterCouponsByStatus(coupons, '').length).toBe(3)
  })

  it('按状态筛选进行中', () => {
    const result = filterCouponsByStatus(coupons, COUPON_STATUS.ONGOING)
    expect(result.length).toBe(1)
    expect(getCouponStatus(result[0], now)).toBe(COUPON_STATUS.ONGOING)
  })

  it('按状态筛选未开始', () => {
    const result = filterCouponsByStatus(coupons, COUPON_STATUS.NOT_STARTED)
    expect(result.length).toBe(1)
    expect(getCouponStatus(result[0], now)).toBe(COUPON_STATUS.NOT_STARTED)
  })

  it('按状态筛选已过期', () => {
    const result = filterCouponsByStatus(coupons, COUPON_STATUS.EXPIRED)
    expect(result.length).toBe(1)
    expect(getCouponStatus(result[0], now)).toBe(COUPON_STATUS.EXPIRED)
  })
})

describe('paginateCoupons', () => {
  const coupons = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }))

  it('非数组返回空分页结果', () => {
    const result = paginateCoupons(null, 1, 10)
    expect(result.items).toEqual([])
    expect(result.totalPages).toBe(1)
    expect(result.currentPage).toBe(1)
  })

  it('第一页正确', () => {
    const result = paginateCoupons(coupons, 1, 10)
    expect(result.items.length).toBe(10)
    expect(result.items[0].id).toBe('1')
    expect(result.items[9].id).toBe('10')
    expect(result.currentPage).toBe(1)
    expect(result.totalPages).toBe(3)
    expect(result.total).toBe(25)
  })

  it('最后一页正确', () => {
    const result = paginateCoupons(coupons, 3, 10)
    expect(result.items.length).toBe(5)
    expect(result.currentPage).toBe(3)
  })

  it('页码超出范围时修正', () => {
    const result = paginateCoupons(coupons, 100, 10)
    expect(result.currentPage).toBe(3)
  })

  it('页码小于1时修正', () => {
    const result = paginateCoupons(coupons, 0, 10)
    expect(result.currentPage).toBe(1)
  })

  it('空列表返回第一页', () => {
    const result = paginateCoupons([], 1, 10)
    expect(result.items.length).toBe(0)
    expect(result.totalPages).toBe(1)
  })
})

describe('getCouponList', () => {
  const now = Date.now()
  const coupons = [
    makeCoupon({ id: '1', name: '蓝牙耳机券', startDate: now - 10 * 86400000, endDate: now + 10 * 86400000, createdAt: 100 }),
    makeCoupon({ id: '2', name: '运动T恤券', startDate: now + 5 * 86400000, endDate: now + 20 * 86400000, createdAt: 200 }),
    makeCoupon({ id: '3', name: '蓝牙音箱券', startDate: now - 10 * 86400000, endDate: now + 10 * 86400000, createdAt: 300 }),
    makeCoupon({ id: '4', name: '咖啡豆券', startDate: now - 20 * 86400000, endDate: now - 5 * 86400000, createdAt: 400 }),
  ]

  it('无选项时按创建时间倒序返回全部', () => {
    const result = getCouponList(coupons, {})
    expect(result.items.length).toBe(4)
    expect(result.items[0].createdAt).toBeGreaterThan(result.items[3].createdAt)
  })

  it('组合搜索和状态筛选', () => {
    const result = getCouponList(coupons, {
      keyword: '蓝牙',
      status: COUPON_STATUS.ONGOING,
      page: 1,
      pageSize: 10,
    })
    expect(result.items.length).toBe(2)
  })
})

describe('getClaimableCoupons', () => {
  const now = Date.now()

  it('非数组返回空数组', () => {
    expect(getClaimableCoupons(null)).toEqual([])
  })

  it('只返回进行中、有库存、未领取过的优惠券', () => {
    const coupons = [
      makeCoupon({ id: 'c1', startDate: now - 86400000, endDate: now + 86400000 * 10, totalCount: 100, receivedCount: 50 }),
      makeCoupon({ id: 'c2', startDate: now - 86400000, endDate: now + 86400000 * 10, totalCount: 100, receivedCount: 100 }),
      makeCoupon({ id: 'c3', startDate: now + 86400000 * 5, endDate: now + 86400000 * 20, totalCount: 100, receivedCount: 0 }),
      makeCoupon({ id: 'c4', startDate: now - 86400000 * 20, endDate: now - 86400000 * 5, totalCount: 100, receivedCount: 10 }),
    ]
    const userCoupons = [{ couponId: 'c1' }]
    const result = getClaimableCoupons(coupons, userCoupons)
    expect(result.length).toBe(0)
  })

  it('排除已领取过的优惠券', () => {
    const coupons = [
      makeCoupon({ id: 'c1', startDate: now - 86400000, endDate: now + 86400000 * 10, totalCount: 100, receivedCount: 50 }),
      makeCoupon({ id: 'c2', startDate: now - 86400000, endDate: now + 86400000 * 10, totalCount: 100, receivedCount: 30 }),
    ]
    const userCoupons = [{ couponId: 'c1' }]
    const result = getClaimableCoupons(coupons, userCoupons)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('c2')
  })
})

describe('claimCoupon', () => {
  const now = Date.now()

  it('无couponId返回失败', () => {
    const result = claimCoupon([], [], '')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('优惠券不存在返回失败', () => {
    const result = claimCoupon([], [], 'not-exist')
    expect(result.success).toBe(false)
  })

  it('优惠券不在有效期内返回失败', () => {
    const coupons = [makeCoupon({
      id: 'c1',
      startDate: now - 86400000 * 20,
      endDate: now - 86400000 * 5,
      totalCount: 100,
      receivedCount: 10,
    })]
    const result = claimCoupon(coupons, [], 'c1')
    expect(result.success).toBe(false)
  })

  it('优惠券已被领完返回失败', () => {
    const coupons = [makeCoupon({
      id: 'c1',
      startDate: now - 86400000,
      endDate: now + 86400000 * 10,
      totalCount: 100,
      receivedCount: 100,
    })]
    const result = claimCoupon(coupons, [], 'c1')
    expect(result.success).toBe(false)
  })

  it('用户已领取过返回失败', () => {
    const coupons = [makeCoupon({
      id: 'c1',
      startDate: now - 86400000,
      endDate: now + 86400000 * 10,
      totalCount: 100,
      receivedCount: 50,
    })]
    const userCoupons = [{ couponId: 'c1' }]
    const result = claimCoupon(coupons, userCoupons, 'c1')
    expect(result.success).toBe(false)
  })

  it('成功领取优惠券', () => {
    const coupons = [makeCoupon({
      id: 'c1',
      name: '测试券',
      type: COUPON_TYPES.FLAT,
      denomination: 10,
      threshold: 0,
      startDate: now - 86400000,
      endDate: now + 86400000 * 10,
      totalCount: 100,
      receivedCount: 50,
    })]
    const result = claimCoupon(coupons, [], 'c1')
    expect(result.success).toBe(true)
    expect(result.userCoupon).toBeTruthy()
    expect(result.userCoupon.couponId).toBe('c1')
    expect(result.coupons[0].receivedCount).toBe(51)
    expect(result.userCoupons.length).toBe(1)
  })
})

describe('filterUserCoupons', () => {
  const now = Date.now()

  it('非数组返回空数组', () => {
    expect(filterUserCoupons(null, USER_COUPON_STATUS.UNUSED)).toEqual([])
  })

  it('all或空值返回全部', () => {
    const ucs = [makeUserCoupon(), makeUserCoupon()]
    expect(filterUserCoupons(ucs, 'all').length).toBe(2)
    expect(filterUserCoupons(ucs, '').length).toBe(2)
  })

  it('按状态筛选', () => {
    const ucs = [
      makeUserCoupon({ usedAt: null, endDate: now + 86400000 * 10 }),
      makeUserCoupon({ usedAt: now - 3600000, endDate: now + 86400000 * 10 }),
      makeUserCoupon({ usedAt: null, endDate: now - 86400000 }),
    ]
    expect(filterUserCoupons(ucs, USER_COUPON_STATUS.UNUSED).length).toBe(1)
    expect(filterUserCoupons(ucs, USER_COUPON_STATUS.USED).length).toBe(1)
    expect(filterUserCoupons(ucs, USER_COUPON_STATUS.EXPIRED).length).toBe(1)
  })
})

describe('getAvailableCouponsForOrder', () => {
  const now = Date.now()

  it('非数组或无订单金额返回空数组', () => {
    expect(getAvailableCouponsForOrder(null, 100)).toEqual([])
    expect(getAvailableCouponsForOrder([], 0)).toEqual([])
    expect(getAvailableCouponsForOrder([], -10)).toEqual([])
  })

  it('只返回未使用、未过期、满足门槛的优惠券', () => {
    const ucs = [
      makeUserCoupon({ id: '1', threshold: 50, usedAt: null, endDate: now + 86400000 * 10 }),
      makeUserCoupon({ id: '2', threshold: 200, usedAt: null, endDate: now + 86400000 * 10 }),
      makeUserCoupon({ id: '3', threshold: 50, usedAt: now - 3600000, endDate: now + 86400000 * 10 }),
      makeUserCoupon({ id: '4', threshold: 50, usedAt: null, endDate: now - 86400000 }),
    ]
    const result = getAvailableCouponsForOrder(ucs, 100)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })
})

describe('calculateDiscount', () => {
  it('无优惠券或无效订单金额返回原值', () => {
    expect(calculateDiscount(null, 100)).toEqual({ discountedAmount: 100, discountAmount: 0 })
    expect(calculateDiscount({}, 0)).toEqual({ discountedAmount: 0, discountAmount: 0 })
  })

  it('满减券：满足门槛时正确减免', () => {
    const coupon = makeCoupon({ type: COUPON_TYPES.FULL_REDUCTION, denomination: 20, threshold: 100 })
    const result = calculateDiscount(coupon, 200)
    expect(result.discountedAmount).toBe(180)
    expect(result.discountAmount).toBe(20)
  })

  it('满减券：不满足门槛时不减免', () => {
    const coupon = makeCoupon({ type: COUPON_TYPES.FULL_REDUCTION, denomination: 20, threshold: 100 })
    const result = calculateDiscount(coupon, 50)
    expect(result.discountedAmount).toBe(50)
    expect(result.discountAmount).toBe(0)
  })

  it('满减券：优惠后金额不低于0', () => {
    const coupon = makeCoupon({ type: COUPON_TYPES.FULL_REDUCTION, denomination: 200, threshold: 100 })
    const result = calculateDiscount(coupon, 100)
    expect(result.discountedAmount).toBe(0)
    expect(result.discountAmount).toBe(100)
  })

  it('折扣券：满足门槛时正确打折', () => {
    const coupon = makeCoupon({ type: COUPON_TYPES.DISCOUNT, denomination: 8, threshold: 100 })
    const result = calculateDiscount(coupon, 200)
    expect(result.discountedAmount).toBe(160)
    expect(result.discountAmount).toBe(40)
  })

  it('折扣券：8.8折正确计算', () => {
    const coupon = makeCoupon({ type: COUPON_TYPES.DISCOUNT, denomination: 8.8, threshold: 100 })
    const result = calculateDiscount(coupon, 100)
    expect(result.discountedAmount).toBe(88)
    expect(result.discountAmount).toBe(12)
  })

  it('折扣券：不满足门槛时不打折', () => {
    const coupon = makeCoupon({ type: COUPON_TYPES.DISCOUNT, denomination: 8, threshold: 100 })
    const result = calculateDiscount(coupon, 50)
    expect(result.discountedAmount).toBe(50)
    expect(result.discountAmount).toBe(0)
  })

  it('立减券：直接减免', () => {
    const coupon = makeCoupon({ type: COUPON_TYPES.FLAT, denomination: 10, threshold: 0 })
    const result = calculateDiscount(coupon, 100)
    expect(result.discountedAmount).toBe(90)
    expect(result.discountAmount).toBe(10)
  })

  it('立减券：优惠后金额不低于0', () => {
    const coupon = makeCoupon({ type: COUPON_TYPES.FLAT, denomination: 100, threshold: 0 })
    const result = calculateDiscount(coupon, 50)
    expect(result.discountedAmount).toBe(0)
    expect(result.discountAmount).toBe(50)
  })
})

describe('markCouponAsUsed', () => {
  const now = Date.now()

  it('无id返回失败', () => {
    const result = markCouponAsUsed([], '')
    expect(result.success).toBe(false)
  })

  it('优惠券不存在返回失败', () => {
    const result = markCouponAsUsed([], 'not-exist')
    expect(result.success).toBe(false)
  })

  it('已使用的优惠券不可再次使用', () => {
    const ucs = [makeUserCoupon({ id: 'uc1', usedAt: now - 3600000 })]
    const result = markCouponAsUsed(ucs, 'uc1')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('已过期的优惠券不可使用', () => {
    const ucs = [makeUserCoupon({ id: 'uc1', usedAt: null, endDate: now - 86400000 })]
    const result = markCouponAsUsed(ucs, 'uc1')
    expect(result.success).toBe(false)
  })

  it('成功使用优惠券', () => {
    const ucs = [makeUserCoupon({
      id: 'uc1',
      usedAt: null,
      endDate: now + 86400000 * 10,
    })]
    const result = markCouponAsUsed(ucs, 'uc1')
    expect(result.success).toBe(true)
    expect(result.userCoupons[0].usedAt).toBeTruthy()
  })
})

describe('formatDate', () => {
  it('空值返回空字符串', () => {
    expect(formatDate(null)).toBe('')
  })

  it('格式化时间戳为YYYY-MM-DD', () => {
    const ts = new Date('2024-01-15T10:30:00').getTime()
    const result = formatDate(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result).toContain('2024')
    expect(result).toContain('01')
    expect(result).toContain('15')
  })
})

describe('formatPrice', () => {
  it('无效值返回¥0.00', () => {
    expect(formatPrice(null)).toBe('¥0.00')
    expect(formatPrice(undefined)).toBe('¥0.00')
    expect(formatPrice('abc')).toBe('¥0.00')
  })

  it('格式化价格为人民币', () => {
    expect(formatPrice(99)).toBe('¥99.00')
    expect(formatPrice(99.9)).toBe('¥99.90')
    expect(formatPrice(0)).toBe('¥0.00')
  })
})

describe('formatCouponValue', () => {
  it('null返回空字符串', () => {
    expect(formatCouponValue(null)).toBe('')
  })

  it('满减券正确格式化', () => {
    const coupon = makeCoupon({ type: COUPON_TYPES.FULL_REDUCTION, denomination: 20, threshold: 100 })
    expect(formatCouponValue(coupon)).toBe('满100减20')
  })

  it('折扣券正确格式化', () => {
    const coupon = makeCoupon({ type: COUPON_TYPES.DISCOUNT, denomination: 8.8, threshold: 100 })
    expect(formatCouponValue(coupon)).toBe('满100打8.8折')
  })

  it('立减券正确格式化', () => {
    const coupon = makeCoupon({ type: COUPON_TYPES.FLAT, denomination: 10 })
    expect(formatCouponValue(coupon)).toBe('立减10元')
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveCoupons 保存到 localStorage', () => {
    const coupons = [{ id: '1', name: '测试券' }]
    const result = saveCoupons(coupons)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(coupons))
  })

  it('loadCoupons 从 localStorage 读取', () => {
    const coupons = [{ id: '1', name: '测试券' }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons))
    const result = loadCoupons()
    expect(result).toEqual(coupons)
  })

  it('loadCoupons localStorage 为空时返回 mock 数据', () => {
    const result = loadCoupons()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('loadCoupons localStorage 数据损坏时返回 mock 数据', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json')
    const result = loadCoupons()
    expect(Array.isArray(result)).toBe(true)
  })

  it('saveUserCoupons 保存到 localStorage', () => {
    const ucs = [{ id: 'uc1', couponId: 'c1' }]
    const result = saveUserCoupons(ucs)
    expect(result).toBe(true)
    expect(localStorage.getItem(USER_COUPONS_STORAGE_KEY)).toBe(JSON.stringify(ucs))
  })

  it('loadUserCoupons 从 localStorage 读取', () => {
    const ucs = [{ id: 'uc1', couponId: 'c1' }]
    localStorage.setItem(USER_COUPONS_STORAGE_KEY, JSON.stringify(ucs))
    const result = loadUserCoupons()
    expect(result).toEqual(ucs)
  })

  it('loadUserCoupons localStorage 为空时返回空数组', () => {
    const result = loadUserCoupons()
    expect(result).toEqual([])
  })
})

describe('PAGE_SIZE constant', () => {
  it('默认每页10条', () => {
    expect(PAGE_SIZE).toBe(10)
  })
})
