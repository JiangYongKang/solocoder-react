import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  generateId,
  generateOrderId,
  loadPoints,
  savePoints,
  loadHistory,
  saveHistory,
  loadOrders,
  saveOrders,
  loadProducts,
  saveProducts,
  loadUserProductLimits,
  saveUserProductLimits,
  getUserProductExchangeCount,
  createTransaction,
  addTransaction,
  calculateBalanceAfterTransaction,
  canExchange,
  checkPurchaseLimit,
  exchangeProduct,
  earnPoints,
  adjustPoints,
  processExpiredPoints,
  getExpiringWarning,
  filterHistory,
  sortHistory,
  filterOrders,
  getOrderById,
  formatDateTime,
  formatDate,
  buildTrendData,
  calculateMonthlyStats,
} from '../../points-mall/pointsMallUtils.js'
import {
  STORAGE_KEY_POINTS,
  STORAGE_KEY_HISTORY,
  STORAGE_KEY_ORDERS,
  STORAGE_KEY_PRODUCTS,
  STORAGE_KEY_USER_PRODUCT_LIMITS,
  DEFAULT_POINTS,
  TRANSACTION_TYPES,
  ORDER_STATUS,
  POINTS_VALIDITY_DAYS,
  EXPIRE_WARNING_DAYS,
  MOCK_PRODUCTS,
} from '../../points-mall/constants.js'

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

const makeProduct = (overrides = {}) => ({
  id: 'p_test',
  name: '测试商品',
  emoji: '🎁',
  points: 500,
  stock: 10,
  limitPerUser: 3,
  description: '测试商品描述',
  ...overrides,
})

describe('generateId', () => {
  it('生成的ID以指定前缀开头', () => {
    expect(generateId('tx')).toMatch(/^tx_/)
    expect(generateId('order')).toMatch(/^order_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('generateOrderId', () => {
  it('生成的订单号以 PO 开头', () => {
    expect(generateOrderId()).toMatch(/^PO/)
  })

  it('生成的订单号不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateOrderId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('savePoints 保存积分到 localStorage', () => {
    const result = savePoints(1000)
    expect(result).toBe(true)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY_POINTS))).toBe(1000)
  })

  it('savePoints 负数保存失败', () => {
    const result = savePoints(-100)
    expect(result).toBe(false)
  })

  it('savePoints 非数字保存失败', () => {
    const result = savePoints('abc')
    expect(result).toBe(false)
  })

  it('loadPoints 从 localStorage 读取积分', () => {
    localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(2000))
    expect(loadPoints()).toBe(2000)
  })

  it('loadPoints localStorage 为空时返回默认值', () => {
    expect(loadPoints()).toBe(DEFAULT_POINTS)
  })

  it('loadPoints localStorage 数据损坏时返回默认值', () => {
    localStorage.setItem(STORAGE_KEY_POINTS, 'invalid-json')
    expect(loadPoints()).toBe(DEFAULT_POINTS)
  })

  it('loadPoints localStorage 存负数时返回默认值', () => {
    localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(-500))
    expect(loadPoints()).toBe(DEFAULT_POINTS)
  })

  it('saveHistory 保存流水到 localStorage', () => {
    const history = [{ id: 'tx_1', type: TRANSACTION_TYPES.EARN, amount: 100 }]
    const result = saveHistory(history)
    expect(result).toBe(true)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY))).toEqual(history)
  })

  it('loadHistory 从 localStorage 读取流水', () => {
    const history = [{ id: 'tx_1', type: TRANSACTION_TYPES.EARN, amount: 100 }]
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history))
    expect(loadHistory()).toEqual(history)
  })

  it('loadHistory localStorage 为空时返回空数组', () => {
    expect(loadHistory()).toEqual([])
  })

  it('saveOrders 保存订单到 localStorage', () => {
    const orders = [{ id: 'PO123', status: ORDER_STATUS.PENDING }]
    const result = saveOrders(orders)
    expect(result).toBe(true)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS))).toEqual(orders)
  })

  it('loadOrders 从 localStorage 读取订单', () => {
    const orders = [{ id: 'PO123', status: ORDER_STATUS.PENDING }]
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders))
    expect(loadOrders()).toEqual(orders)
  })

  it('loadOrders localStorage 为空时返回空数组', () => {
    expect(loadOrders()).toEqual([])
  })

  it('saveProducts 保存商品到 localStorage', () => {
    const products = [makeProduct()]
    const result = saveProducts(products)
    expect(result).toBe(true)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY_PRODUCTS))).toEqual(products)
  })

  it('loadProducts 从 localStorage 读取商品', () => {
    const products = [makeProduct({ id: 'p_custom' })]
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products))
    expect(loadProducts()).toEqual(products)
  })

  it('loadProducts localStorage 为空时返回 mock 数据', () => {
    const products = loadProducts()
    expect(Array.isArray(products)).toBe(true)
    expect(products.length).toBe(MOCK_PRODUCTS.length)
  })

  it('saveUserProductLimits 保存限购记录到 localStorage', () => {
    const limits = { p_001: 2 }
    const result = saveUserProductLimits(limits)
    expect(result).toBe(true)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY_USER_PRODUCT_LIMITS))).toEqual(limits)
  })

  it('loadUserProductLimits 从 localStorage 读取限购记录', () => {
    const limits = { p_001: 2 }
    localStorage.setItem(STORAGE_KEY_USER_PRODUCT_LIMITS, JSON.stringify(limits))
    expect(loadUserProductLimits()).toEqual(limits)
  })

  it('loadUserProductLimits localStorage 为空时返回空对象', () => {
    expect(loadUserProductLimits()).toEqual({})
  })
})

describe('getUserProductExchangeCount', () => {
  it('正确获取用户已兑换数量', () => {
    const limits = { p_001: 3, p_002: 1 }
    expect(getUserProductExchangeCount(limits, 'p_001')).toBe(3)
    expect(getUserProductExchangeCount(limits, 'p_002')).toBe(1)
  })

  it('未兑换过的商品返回 0', () => {
    expect(getUserProductExchangeCount({}, 'p_003')).toBe(0)
  })

  it('无效参数返回 0', () => {
    expect(getUserProductExchangeCount(null, 'p_001')).toBe(0)
    expect(getUserProductExchangeCount({}, '')).toBe(0)
  })
})

describe('createTransaction', () => {
  it('正确创建获取类型交易记录', () => {
    const tx = createTransaction(TRANSACTION_TYPES.EARN, 100, '每日签到')
    expect(tx.id).toBeTruthy()
    expect(tx.type).toBe(TRANSACTION_TYPES.EARN)
    expect(tx.amount).toBe(100)
    expect(tx.description).toBe('每日签到')
    expect(tx.createdAt).toBeTruthy()
  })

  it('amount 转换为数字', () => {
    const tx = createTransaction(TRANSACTION_TYPES.EARN, '50')
    expect(tx.amount).toBe(50)
  })
})

describe('addTransaction', () => {
  it('正确添加交易记录并计算余额', () => {
    const result = addTransaction(
      [],
      { type: TRANSACTION_TYPES.EARN, amount: 100 },
      500
    )
    expect(result.history.length).toBe(1)
    expect(result.history[0].balanceAfter).toBe(600)
    expect(result.balance).toBe(600)
  })

  it('兑换类型交易记录正确扣减余额', () => {
    const result = addTransaction(
      [],
      { type: TRANSACTION_TYPES.EXCHANGE, amount: 200 },
      500
    )
    expect(result.balance).toBe(300)
  })

  it('新记录添加在列表最前面', () => {
    const oldTx = { id: 'old', balanceAfter: 500 }
    const result = addTransaction(
      [oldTx],
      { type: TRANSACTION_TYPES.EARN, amount: 100 },
      500
    )
    expect(result.history.length).toBe(2)
    expect(result.history[0]).not.toBe(oldTx)
    expect(result.history[1]).toBe(oldTx)
  })

  it('传入 null transaction 不改变数据', () => {
    const result = addTransaction([], null, 500)
    expect(result.history).toEqual([])
    expect(result.balance).toBe(500)
  })
})

describe('calculateBalanceAfterTransaction', () => {
  it('获取类型增加余额', () => {
    expect(
      calculateBalanceAfterTransaction(500, { type: TRANSACTION_TYPES.EARN, amount: 100 })
    ).toBe(600)
  })

  it('兑换类型减少余额', () => {
    expect(
      calculateBalanceAfterTransaction(500, { type: TRANSACTION_TYPES.EXCHANGE, amount: 200 })
    ).toBe(300)
  })

  it('过期类型减少余额', () => {
    expect(
      calculateBalanceAfterTransaction(500, { type: TRANSACTION_TYPES.EXPIRE, amount: 100 })
    ).toBe(400)
  })

  it('调整类型增加余额', () => {
    expect(
      calculateBalanceAfterTransaction(500, { type: TRANSACTION_TYPES.ADJUST, amount: 50 })
    ).toBe(550)
  })

  it('余额不会低于 0', () => {
    expect(
      calculateBalanceAfterTransaction(100, { type: TRANSACTION_TYPES.EXCHANGE, amount: 500 })
    ).toBe(0)
  })

  it('传入 null 返回当前余额', () => {
    expect(calculateBalanceAfterTransaction(500, null)).toBe(500)
  })
})

describe('canExchange', () => {
  it('积分充足且有库存时可以兑换', () => {
    const result = canExchange(1000, makeProduct())
    expect(result.can).toBe(true)
  })

  it('积分不足时返回正确差额', () => {
    const result = canExchange(200, makeProduct({ points: 500 }))
    expect(result.can).toBe(false)
    expect(result.reason).toBe('积分不足')
    expect(result.diff).toBe(300)
  })

  it('库存为 0 时不能兑换', () => {
    const result = canExchange(1000, makeProduct({ stock: 0 }))
    expect(result.can).toBe(false)
    expect(result.reason).toBe('商品已兑完')
  })

  it('商品不存在时不能兑换', () => {
    const result = canExchange(1000, null)
    expect(result.can).toBe(false)
    expect(result.reason).toBe('商品不存在')
  })
})

describe('checkPurchaseLimit', () => {
  it('未达限购时返回未达上限', () => {
    const result = checkPurchaseLimit({ p_test: 1 }, makeProduct({ limitPerUser: 3 }))
    expect(result.reached).toBe(false)
    expect(result.count).toBe(1)
    expect(result.limit).toBe(3)
  })

  it('达到限购时返回已达上限', () => {
    const result = checkPurchaseLimit({ p_test: 3 }, makeProduct({ limitPerUser: 3 }))
    expect(result.reached).toBe(true)
    expect(result.count).toBe(3)
    expect(result.limit).toBe(3)
  })

  it('超过限购时返回已达上限', () => {
    const result = checkPurchaseLimit({ p_test: 5 }, makeProduct({ limitPerUser: 3 }))
    expect(result.reached).toBe(true)
  })

  it('limitPerUser 为 0 时不限制', () => {
    const result = checkPurchaseLimit({ p_test: 10 }, makeProduct({ limitPerUser: 0 }))
    expect(result.reached).toBe(false)
  })

  it('商品不存在时返回默认值', () => {
    const result = checkPurchaseLimit({}, null)
    expect(result.reached).toBe(false)
    expect(result.count).toBe(0)
  })
})

describe('exchangeProduct', () => {
  it('成功兑换商品', () => {
    const product = makeProduct({ id: 'p_1', stock: 10, points: 500 })
    const result = exchangeProduct(1000, [product], [], [], {}, 'p_1')
    expect(result.success).toBe(true)
    expect(result.points).toBe(500)
    expect(result.products[0].stock).toBe(9)
    expect(result.history.length).toBe(1)
    expect(result.history[0].type).toBe(TRANSACTION_TYPES.EXCHANGE)
    expect(result.history[0].amount).toBe(500)
    expect(result.orders.length).toBe(1)
    expect(result.orders[0].productId).toBe('p_1')
    expect(result.orders[0].status).toBe(ORDER_STATUS.PENDING)
    expect(result.limits.p_1).toBe(1)
  })

  it('积分不足兑换失败', () => {
    const product = makeProduct({ points: 1000 })
    const result = exchangeProduct(200, [product], [], [], {}, product.id)
    expect(result.success).toBe(false)
    expect(result.error).toBe('积分不足')
    expect(result.diff).toBe(800)
  })

  it('库存不足兑换失败', () => {
    const product = makeProduct({ stock: 0 })
    const result = exchangeProduct(1000, [product], [], [], {}, product.id)
    expect(result.success).toBe(false)
    expect(result.error).toBe('商品已兑完')
  })

  it('达到限购兑换失败', () => {
    const product = makeProduct({ limitPerUser: 2 })
    const result = exchangeProduct(1000, [product], [], [], { [product.id]: 2 }, product.id)
    expect(result.success).toBe(false)
    expect(result.error).toBe('已达限购数量')
  })

  it('商品不存在兑换失败', () => {
    const result = exchangeProduct(1000, [], [], [], {}, 'not-exist')
    expect(result.success).toBe(false)
    expect(result.error).toBe('商品不存在')
  })

  it('限购计数正确累加', () => {
    const product = makeProduct({ id: 'p_1', limitPerUser: 5 })
    let state = { points: 5000, products: [product], history: [], orders: [], limits: {} }
    for (let i = 0; i < 3; i++) {
      const result = exchangeProduct(
        state.points, state.products, state.history, state.orders, state.limits, 'p_1'
      )
      state = {
        points: result.points,
        products: result.products,
        history: result.history,
        orders: result.orders,
        limits: result.limits,
      }
    }
    expect(state.limits.p_1).toBe(3)
    expect(state.products[0].stock).toBe(7)
  })
})

describe('earnPoints', () => {
  it('成功增加积分', () => {
    const result = earnPoints(500, [], 200, '每日签到')
    expect(result.success).toBe(true)
    expect(result.points).toBe(700)
    expect(result.history.length).toBe(1)
    expect(result.history[0].type).toBe(TRANSACTION_TYPES.EARN)
    expect(result.history[0].amount).toBe(200)
  })

  it('增加 0 或负数积分失败', () => {
    expect(earnPoints(500, [], 0).success).toBe(false)
    expect(earnPoints(500, [], -100).success).toBe(false)
  })

  it('非数字积分数量失败', () => {
    expect(earnPoints(500, [], 'abc').success).toBe(false)
  })
})

describe('adjustPoints', () => {
  it('正数调整增加积分', () => {
    const result = adjustPoints(500, [], 300, '测试增加')
    expect(result.success).toBe(true)
    expect(result.points).toBe(800)
    expect(result.history[0].type).toBe(TRANSACTION_TYPES.ADJUST)
    expect(result.history[0].amount).toBe(300)
    expect(result.history[0].balanceAfter).toBe(800)
  })

  it('负数调整扣减积分', () => {
    const result = adjustPoints(500, [], -200, '测试扣减')
    expect(result.success).toBe(true)
    expect(result.points).toBe(300)
    expect(result.history[0].type).toBe(TRANSACTION_TYPES.ADJUST)
    expect(result.history[0].amount).toBe(-200)
    expect(result.history[0].balanceAfter).toBe(300)
  })

  it('调整为 0 不改变', () => {
    const result = adjustPoints(500, [], 0)
    expect(result.success).toBe(true)
    expect(result.points).toBe(500)
    expect(result.history.length).toBe(0)
  })

  it('扣减后余额不为负', () => {
    const result = adjustPoints(100, [], -500)
    expect(result.success).toBe(true)
    expect(result.points).toBe(0)
    expect(result.history[0].balanceAfter).toBe(0)
  })

  it('非数字调整失败', () => {
    expect(adjustPoints(500, [], 'abc').success).toBe(false)
  })

  it('正负分支都通过 addTransaction 统一处理余额', () => {
    const pos = adjustPoints(100, [], 50)
    const neg = adjustPoints(100, [], -50)
    expect(pos.history[0]).toHaveProperty('balanceAfter')
    expect(neg.history[0]).toHaveProperty('balanceAfter')
    expect(pos.history[0].balanceAfter).toBe(150)
    expect(neg.history[0].balanceAfter).toBe(50)
  })
})

describe('processExpiredPoints', () => {
  const now = Date.now()

  it('没有过期积分时不改变', () => {
    const history = [
      { id: 'tx1', type: TRANSACTION_TYPES.EARN, amount: 500, createdAt: now - 10 * 86400000 },
    ]
    const result = processExpiredPoints(500, history, now)
    expect(result.expired).toBe(0)
    expect(result.points).toBe(500)
  })

  it('过期积分自动扣除', () => {
    const history = [
      {
        id: 'tx1',
        type: TRANSACTION_TYPES.EARN,
        amount: 300,
        createdAt: now - (POINTS_VALIDITY_DAYS + 10) * 86400000,
      },
      {
        id: 'tx2',
        type: TRANSACTION_TYPES.EARN,
        amount: 200,
        createdAt: now - 10 * 86400000,
      },
    ]
    const result = processExpiredPoints(500, history, now)
    expect(result.expired).toBe(300)
    expect(result.points).toBe(200)
    expect(result.history[0].type).toBe(TRANSACTION_TYPES.EXPIRE)
    expect(result.history.find((t) => t.id === 'tx1').expired).toBe(true)
  })

  it('已经标记过期的积分不重复扣除', () => {
    const history = [
      {
        id: 'tx1',
        type: TRANSACTION_TYPES.EARN,
        amount: 300,
        createdAt: now - (POINTS_VALIDITY_DAYS + 10) * 86400000,
        expired: true,
      },
    ]
    const result = processExpiredPoints(200, history, now)
    expect(result.expired).toBe(0)
    expect(result.points).toBe(200)
  })

  it('余额不足时最多扣除全部余额', () => {
    const history = [
      {
        id: 'tx1',
        type: TRANSACTION_TYPES.EARN,
        amount: 1000,
        createdAt: now - (POINTS_VALIDITY_DAYS + 10) * 86400000,
      },
    ]
    const result = processExpiredPoints(200, history, now)
    expect(result.expired).toBe(200)
    expect(result.points).toBe(0)
  })
})

describe('getExpiringWarning', () => {
  const now = Date.now()

  it('没有即将过期的积分时无警告', () => {
    const history = [
      { id: 'tx1', type: TRANSACTION_TYPES.EARN, amount: 500, createdAt: now - 10 * 86400000 },
    ]
    const result = getExpiringWarning(history, now)
    expect(result.hasWarning).toBe(false)
  })

  it('检测到即将过期的积分', () => {
    const daysUntilExpire = EXPIRE_WARNING_DAYS - 5
    const createdAt = now - (POINTS_VALIDITY_DAYS - daysUntilExpire) * 86400000
    const history = [
      { id: 'tx1', type: TRANSACTION_TYPES.EARN, amount: 300, createdAt },
    ]
    const result = getExpiringWarning(history, now)
    expect(result.hasWarning).toBe(true)
    expect(result.expiringPoints).toBe(300)
    expect(result.daysLeft).toBeGreaterThan(0)
    expect(result.daysLeft).toBeLessThanOrEqual(EXPIRE_WARNING_DAYS)
  })

  it('已过期的积分不计入警告', () => {
    const history = [
      {
        id: 'tx1',
        type: TRANSACTION_TYPES.EARN,
        amount: 300,
        createdAt: now - (POINTS_VALIDITY_DAYS + 10) * 86400000,
      },
    ]
    const result = getExpiringWarning(history, now)
    expect(result.hasWarning).toBe(false)
  })

  it('空历史记录无警告', () => {
    const result = getExpiringWarning([], now)
    expect(result.hasWarning).toBe(false)
  })
})

describe('filterHistory', () => {
  const now = Date.now()
  const history = [
    { id: '1', type: TRANSACTION_TYPES.EARN, amount: 100, createdAt: now - 5 * 86400000 },
    { id: '2', type: TRANSACTION_TYPES.EXCHANGE, amount: 50, createdAt: now - 3 * 86400000 },
    { id: '3', type: TRANSACTION_TYPES.EARN, amount: 200, createdAt: now - 1 * 86400000 },
    { id: '4', type: TRANSACTION_TYPES.EXPIRE, amount: 30, createdAt: now },
  ]

  it('按类型筛选', () => {
    const result = filterHistory(history, { type: TRANSACTION_TYPES.EARN })
    expect(result.length).toBe(2)
    result.forEach((tx) => expect(tx.type).toBe(TRANSACTION_TYPES.EARN))
  })

  it('type 为 all 时返回全部', () => {
    const result = filterHistory(history, { type: 'all' })
    expect(result.length).toBe(4)
  })

  it('按日期范围筛选', () => {
    const startDate = formatDate(now - 4 * 86400000)
    const endDate = formatDate(now - 2 * 86400000)
    const result = filterHistory(history, { startDate, endDate })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('2')
  })

  it('非数组返回空数组', () => {
    expect(filterHistory(null)).toEqual([])
  })
})

describe('sortHistory', () => {
  it('按创建时间倒序排列', () => {
    const history = [
      { id: '1', createdAt: 1000 },
      { id: '3', createdAt: 3000 },
      { id: '2', createdAt: 2000 },
    ]
    const result = sortHistory(history, 'createdAt', 'desc')
    expect(result[0].id).toBe('3')
    expect(result[1].id).toBe('2')
    expect(result[2].id).toBe('1')
  })

  it('按创建时间正序排列', () => {
    const history = [
      { id: '3', createdAt: 3000 },
      { id: '1', createdAt: 1000 },
      { id: '2', createdAt: 2000 },
    ]
    const result = sortHistory(history, 'createdAt', 'asc')
    expect(result[0].id).toBe('1')
    expect(result[1].id).toBe('2')
    expect(result[2].id).toBe('3')
  })

  it('非数组返回空数组', () => {
    expect(sortHistory(null)).toEqual([])
  })
})

describe('filterOrders', () => {
  const orders = [
    { id: '1', status: ORDER_STATUS.PENDING },
    { id: '2', status: ORDER_STATUS.SHIPPED },
    { id: '3', status: ORDER_STATUS.COMPLETED },
    { id: '4', status: ORDER_STATUS.PENDING },
  ]

  it('按状态筛选', () => {
    const result = filterOrders(orders, ORDER_STATUS.PENDING)
    expect(result.length).toBe(2)
    result.forEach((o) => expect(o.status).toBe(ORDER_STATUS.PENDING))
  })

  it('status 为 all 时返回全部', () => {
    expect(filterOrders(orders, 'all').length).toBe(4)
  })

  it('非数组返回空数组', () => {
    expect(filterOrders(null)).toEqual([])
  })
})

describe('getOrderById', () => {
  const orders = [
    { id: 'PO1', status: ORDER_STATUS.PENDING },
    { id: 'PO2', status: ORDER_STATUS.SHIPPED },
  ]

  it('按 ID 查找订单', () => {
    expect(getOrderById(orders, 'PO1')).toEqual(orders[0])
    expect(getOrderById(orders, 'PO2')).toEqual(orders[1])
  })

  it('找不到订单返回 null', () => {
    expect(getOrderById(orders, 'PO999')).toBe(null)
  })

  it('无效参数返回 null', () => {
    expect(getOrderById(null, 'PO1')).toBe(null)
    expect(getOrderById(orders, '')).toBe(null)
  })
})

describe('formatDateTime', () => {
  it('格式化时间戳为日期时间', () => {
    const ts = new Date('2024-06-15T10:30:00').getTime()
    const result = formatDateTime(ts)
    expect(result).toContain('2024')
    expect(result).toContain('06')
    expect(result).toContain('15')
    expect(result).toContain('10')
    expect(result).toContain('30')
  })

  it('空值返回空字符串', () => {
    expect(formatDateTime(null)).toBe('')
  })
})

describe('formatDate', () => {
  it('格式化时间戳为日期', () => {
    const ts = new Date('2024-06-15T10:30:00').getTime()
    const result = formatDate(ts)
    expect(result).toBe('2024-06-15')
  })

  it('空值返回空字符串', () => {
    expect(formatDate(null)).toBe('')
  })
})

describe('buildTrendData', () => {
  const now = Date.now()

  it('生成 30 天趋势数据', () => {
    const result = buildTrendData([], 30, now)
    expect(result.length).toBe(30)
    result.forEach((item) => {
      expect(item).toHaveProperty('date')
      expect(item).toHaveProperty('label')
      expect(item).toHaveProperty('balance')
    })
  })

  it('无历史记录时余额为 0', () => {
    const result = buildTrendData([], 5, now)
    result.forEach((item) => expect(item.balance).toBe(0))
  })

  it('根据历史记录正确计算每日余额', () => {
    const history = [
      {
        id: 'tx1',
        type: TRANSACTION_TYPES.EARN,
        amount: 500,
        createdAt: now - 2 * 86400000,
        balanceAfter: 500,
      },
      {
        id: 'tx2',
        type: TRANSACTION_TYPES.EXCHANGE,
        amount: 200,
        createdAt: now - 1 * 86400000,
        balanceAfter: 300,
      },
    ]
    const result = buildTrendData(history, 5, now)
    expect(result[result.length - 1].balance).toBe(300)
    expect(result[result.length - 2].balance).toBe(300)
  })
})

describe('calculateMonthlyStats', () => {
  const now = new Date('2024-06-15T12:00:00').getTime()

  it('正确计算本月统计数据', () => {
    const history = [
      { id: '1', type: TRANSACTION_TYPES.EARN, amount: 500, createdAt: new Date('2024-06-01').getTime() },
      { id: '2', type: TRANSACTION_TYPES.EXCHANGE, amount: 200, createdAt: new Date('2024-06-10').getTime() },
      { id: '3', type: TRANSACTION_TYPES.EARN, amount: 300, createdAt: new Date('2024-05-30').getTime() },
      { id: '4', type: TRANSACTION_TYPES.EXPIRE, amount: 50, createdAt: new Date('2024-06-12').getTime() },
    ]
    const result = calculateMonthlyStats(history, now)
    expect(result.earned).toBe(500)
    expect(result.spent).toBe(250)
    expect(result.net).toBe(250)
  })

  it('ADJUST 正数计入获取，负数计入消费', () => {
    const history = [
      { id: '1', type: TRANSACTION_TYPES.ADJUST, amount: 300, createdAt: new Date('2024-06-01').getTime() },
      { id: '2', type: TRANSACTION_TYPES.ADJUST, amount: -200, createdAt: new Date('2024-06-10').getTime() },
    ]
    const result = calculateMonthlyStats(history, now)
    expect(result.earned).toBe(300)
    expect(result.spent).toBe(200)
    expect(result.net).toBe(100)
  })

  it('无数据时返回 0', () => {
    const result = calculateMonthlyStats([], now)
    expect(result.earned).toBe(0)
    expect(result.spent).toBe(0)
    expect(result.net).toBe(0)
  })
})

describe('STORAGE_KEY constants', () => {
  it('存储键定义正确', () => {
    expect(STORAGE_KEY_POINTS).toBeTruthy()
    expect(STORAGE_KEY_HISTORY).toBeTruthy()
    expect(STORAGE_KEY_ORDERS).toBeTruthy()
    expect(STORAGE_KEY_PRODUCTS).toBeTruthy()
    expect(STORAGE_KEY_USER_PRODUCT_LIMITS).toBeTruthy()
  })

  it('默认积分值为 5000', () => {
    expect(DEFAULT_POINTS).toBe(5000)
  })
})
