import {
  STORAGE_KEY_POINTS,
  STORAGE_KEY_HISTORY,
  STORAGE_KEY_ORDERS,
  STORAGE_KEY_PRODUCTS,
  STORAGE_KEY_USER_PRODUCT_LIMITS,
  DEFAULT_POINTS,
  TRANSACTION_TYPES,
  ORDER_STATUS,
  MOCK_PRODUCTS,
  POINTS_VALIDITY_DAYS,
  EXPIRE_WARNING_DAYS,
} from './constants.js'

export function generateId(prefix = 'id') {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function generateOrderId() {
  return 'PO' + Date.now().toString() + Math.random().toString(36).slice(2, 6).toUpperCase()
}

export function loadPoints() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POINTS)
    if (raw !== null) {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'number' && !isNaN(parsed) && parsed >= 0) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_POINTS
}

export function savePoints(points) {
  try {
    const numPoints = Number(points)
    if (!isNaN(numPoints) && numPoints >= 0) {
      localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(numPoints))
      return true
    }
    return false
  } catch {
    return false
  }
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return []
}

export function saveHistory(history) {
  try {
    if (Array.isArray(history)) {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history))
      return true
    }
    return false
  } catch {
    return false
  }
}

export function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return []
}

export function saveOrders(orders) {
  try {
    if (Array.isArray(orders)) {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders))
      return true
    }
    return false
  } catch {
    return false
  }
}

export function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return [...MOCK_PRODUCTS]
}

export function saveProducts(products) {
  try {
    if (Array.isArray(products)) {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products))
      return true
    }
    return false
  } catch {
    return false
  }
}

export function loadUserProductLimits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_PRODUCT_LIMITS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return {}
}

export function saveUserProductLimits(limits) {
  try {
    if (typeof limits === 'object' && limits !== null) {
      localStorage.setItem(STORAGE_KEY_USER_PRODUCT_LIMITS, JSON.stringify(limits))
      return true
    }
    return false
  } catch {
    return false
  }
}

export function getUserProductExchangeCount(limits, productId) {
  if (!limits || !productId) return 0
  return Number(limits[productId]) || 0
}

export function createTransaction(type, amount, description = '', now = Date.now()) {
  return {
    id: generateId('tx'),
    type,
    amount: Number(amount),
    description,
    createdAt: now,
  }
}

export function addTransaction(history, transaction, currentBalance) {
  if (!transaction) return { history, balance: currentBalance }
  const balanceAfter = calculateBalanceAfterTransaction(currentBalance, transaction)
  const txWithBalance = { ...transaction, balanceAfter }
  const updated = [txWithBalance, ...(Array.isArray(history) ? history : [])]
  return { history: updated, balance: balanceAfter }
}

export function calculateBalanceAfterTransaction(currentBalance, transaction) {
  if (!transaction) return Number(currentBalance) || 0
  const balance = Number(currentBalance) || 0
  const amount = Number(transaction.amount) || 0
  if (transaction.type === TRANSACTION_TYPES.EARN || transaction.type === TRANSACTION_TYPES.ADJUST) {
    return Math.max(0, balance + amount)
  }
  if (transaction.type === TRANSACTION_TYPES.EXCHANGE || transaction.type === TRANSACTION_TYPES.EXPIRE) {
    return Math.max(0, balance - amount)
  }
  return balance
}

export function canExchange(points, product) {
  if (!product) return { can: false, reason: '商品不存在' }
  if (points < product.points) {
    return { can: false, reason: '积分不足', diff: product.points - points }
  }
  if (product.stock <= 0) {
    return { can: false, reason: '商品已兑完' }
  }
  return { can: true }
}

export function checkPurchaseLimit(limits, product) {
  if (!product) return { reached: false, count: 0, limit: 0 }
  const count = getUserProductExchangeCount(limits, product.id)
  const limit = Number(product.limitPerUser) || 0
  return { reached: limit > 0 && count >= limit, count, limit }
}

export function exchangeProduct(points, products, history, orders, limits, productId) {
  const product = products.find((p) => p.id === productId)
  if (!product) {
    return { success: false, error: '商品不存在' }
  }

  const checkResult = canExchange(points, product)
  if (!checkResult.can) {
    return { success: false, error: checkResult.reason, diff: checkResult.diff }
  }

  const limitCheck = checkPurchaseLimit(limits, product)
  if (limitCheck.reached) {
    return { success: false, error: '已达限购数量' }
  }

  const now = Date.now()
  const newPoints = points - product.points

  const updatedProducts = products.map((p) =>
    p.id === productId ? { ...p, stock: Math.max(0, p.stock - 1) } : p
  )

  const tx = createTransaction(
    TRANSACTION_TYPES.EXCHANGE,
    product.points,
    `兑换商品：${product.name}`,
    now
  )
  const { history: updatedHistory, balance } = addTransaction(history, tx, points)

  const order = {
    id: generateOrderId(),
    productId: product.id,
    productName: product.name,
    productEmoji: product.emoji,
    points: product.points,
    status: ORDER_STATUS.PENDING,
    createdAt: now,
  }
  const updatedOrders = [order, ...orders]

  const updatedLimits = { ...limits }
  updatedLimits[productId] = (updatedLimits[productId] || 0) + 1

  return {
    success: true,
    points: newPoints,
    products: updatedProducts,
    history: updatedHistory,
    orders: updatedOrders,
    limits: updatedLimits,
    order,
    balance,
  }
}

export function earnPoints(points, history, amount, description = '', now = Date.now()) {
  const numAmount = Number(amount)
  if (isNaN(numAmount) || numAmount <= 0) {
    return { success: false, error: '积分数量无效' }
  }
  const tx = createTransaction(TRANSACTION_TYPES.EARN, numAmount, description, now)
  const result = addTransaction(history, tx, points)
  return {
    success: true,
    points: result.balance,
    history: result.history,
  }
}

export function adjustPoints(points, history, amount, description = '', now = Date.now()) {
  const numAmount = Number(amount)
  if (isNaN(numAmount)) {
    return { success: false, error: '积分数量无效' }
  }
  if (numAmount === 0) {
    return { success: true, points, history }
  }
  const tx = createTransaction(TRANSACTION_TYPES.ADJUST, numAmount, description, now)
  const result = addTransaction(history, tx, points)
  return { success: true, points: result.balance, history: result.history }
}

export function processExpiredPoints(points, history, now = Date.now()) {
  if (!Array.isArray(history) || history.length === 0) {
    return { points, history, expired: 0 }
  }

  const expireThreshold = now - POINTS_VALIDITY_DAYS * 24 * 60 * 60 * 1000
  const earnRecords = history.filter(
    (tx) =>
      (tx.type === TRANSACTION_TYPES.EARN || tx.type === TRANSACTION_TYPES.ADJUST) &&
      tx.amount > 0 &&
      tx.createdAt < expireThreshold &&
      !tx.expired
  )

  if (earnRecords.length === 0) {
    return { points, history, expired: 0 }
  }

  let expiredTotal = 0
  const expiredTxIds = new Set()

  for (const tx of earnRecords) {
    expiredTotal += tx.amount
    expiredTxIds.add(tx.id)
  }

  if (expiredTotal <= 0) {
    return { points, history, expired: 0 }
  }

  const actualExpired = Math.min(expiredTotal, points)
  const newPoints = Math.max(0, points - actualExpired)

  const updatedHistory = history.map((tx) =>
    expiredTxIds.has(tx.id) ? { ...tx, expired: true } : tx
  )

  if (actualExpired > 0) {
    const expireTx = {
      id: generateId('tx'),
      type: TRANSACTION_TYPES.EXPIRE,
      amount: actualExpired,
      description: '积分过期自动扣除',
      createdAt: now,
      balanceAfter: newPoints,
    }
    updatedHistory.unshift(expireTx)
  }

  return {
    points: newPoints,
    history: updatedHistory,
    expired: actualExpired,
  }
}

export function getExpiringWarning(history, now = Date.now()) {
  if (!Array.isArray(history) || history.length === 0) {
    return { hasWarning: false, expiringPoints: 0, daysLeft: 0 }
  }

  let expiringPoints = 0
  let earliestExpireTime = Infinity

  for (const tx of history) {
    if ((tx.type === TRANSACTION_TYPES.EARN || tx.type === TRANSACTION_TYPES.ADJUST) &&
        tx.amount > 0 &&
        !tx.expired) {
      const expireTime = tx.createdAt + POINTS_VALIDITY_DAYS * 24 * 60 * 60 * 1000
      const daysUntilExpire = Math.ceil((expireTime - now) / (24 * 60 * 60 * 1000))

      if (daysUntilExpire > 0 && daysUntilExpire <= EXPIRE_WARNING_DAYS) {
        expiringPoints += tx.amount
        if (expireTime < earliestExpireTime) {
          earliestExpireTime = expireTime
        }
      }
    }
  }

  if (expiringPoints > 0) {
    const daysLeft = Math.max(1, Math.ceil((earliestExpireTime - now) / (24 * 60 * 60 * 1000)))
    return { hasWarning: true, expiringPoints, daysLeft }
  }

  return { hasWarning: false, expiringPoints: 0, daysLeft: 0 }
}

export function filterHistory(history, options = {}) {
  if (!Array.isArray(history)) return []
  let result = [...history]

  if (options.type && options.type !== 'all') {
    result = result.filter((tx) => tx.type === options.type)
  }

  if (options.startDate) {
    const start = new Date(options.startDate).setHours(0, 0, 0, 0)
    result = result.filter((tx) => tx.createdAt >= start)
  }

  if (options.endDate) {
    const end = new Date(options.endDate).setHours(23, 59, 59, 999)
    result = result.filter((tx) => tx.createdAt <= end)
  }

  return result
}

export function sortHistory(history, sortBy = 'createdAt', sortOrder = 'desc') {
  if (!Array.isArray(history)) return []
  const order = sortOrder === 'desc' ? -1 : 1
  return [...history].sort((a, b) => {
    const aVal = a[sortBy] || 0
    const bVal = b[sortBy] || 0
    return (aVal - bVal) * order
  })
}

export function filterOrders(orders, status = 'all') {
  if (!Array.isArray(orders)) return []
  if (!status || status === 'all') return orders
  return orders.filter((o) => o.status === status)
}

export function getOrderById(orders, orderId) {
  if (!Array.isArray(orders) || !orderId) return null
  return orders.find((o) => o.id === orderId) || null
}

export function formatDateTime(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getDateKey(timestamp) {
  return formatDate(timestamp)
}

export function buildTrendData(history, days = 30, now = Date.now()) {
  const dailyBalances = []
  const dayMs = 24 * 60 * 60 * 1000

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * dayMs)
    const dateKey = formatDate(date)
    dailyBalances.push({ date: dateKey, label: dateKey.slice(5), balance: 0 })
  }

  if (!Array.isArray(history) || history.length === 0) {
    return dailyBalances
  }

  const sortedTx = sortHistory(history, 'createdAt', 'asc')
  let runningBalance = 0

  sortedTx.forEach((tx) => {
    const txDateKey = formatDate(tx.createdAt)
    const idx = dailyBalances.findIndex((d) => d.date === txDateKey)
    if (idx !== -1) {
      runningBalance = tx.balanceAfter !== undefined ? tx.balanceAfter : runningBalance
      for (let j = idx; j < dailyBalances.length; j++) {
        dailyBalances[j].balance = runningBalance
      }
    }
  })

  return dailyBalances
}

export function calculateMonthlyStats(history, now = Date.now()) {
  if (!Array.isArray(history)) {
    return { earned: 0, spent: 0, net: 0 }
  }

  const currentMonth = new Date(now).getMonth()
  const currentYear = new Date(now).getFullYear()
  let earned = 0
  let spent = 0

  history.forEach((tx) => {
    const txDate = new Date(tx.createdAt)
    if (txDate.getMonth() !== currentMonth || txDate.getFullYear() !== currentYear) {
      return
    }
    const amount = Number(tx.amount) || 0
    if (tx.type === TRANSACTION_TYPES.EARN) {
      earned += amount
    } else if (tx.type === TRANSACTION_TYPES.ADJUST) {
      if (amount > 0) {
        earned += amount
      } else {
        spent += Math.abs(amount)
      }
    } else if (tx.type === TRANSACTION_TYPES.EXCHANGE || tx.type === TRANSACTION_TYPES.EXPIRE) {
      spent += amount
    }
  })

  return {
    earned,
    spent,
    net: earned - spent,
  }
}
