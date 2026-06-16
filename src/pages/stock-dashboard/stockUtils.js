import {
  PRICE_MIN,
  PRICE_MAX,
  PRICE_FLUCTUATION_RATE,
  KLINE_DAYS,
  TIMESHARE_MINUTES,
  ALERT_TYPE_UPPER,
  ALERT_TYPE_LOWER,
  ALERT_STATUS_ENABLED,
  SORT_ORDER_DESC,
  LIST_TYPE_GAINERS,
  LIST_TYPE_LOSERS,
  LIST_TYPE_ALL,
} from './constants'

export function generateBasePrice() {
  return Math.floor(Math.random() * (PRICE_MAX - PRICE_MIN + 1)) + PRICE_MIN
}

export function generateNextPrice(currentPrice, fluctuationRate = PRICE_FLUCTUATION_RATE) {
  const change = (Math.random() * 2 - 1) * fluctuationRate * currentPrice
  const nextPrice = currentPrice + change
  return Math.max(0.01, Number(nextPrice.toFixed(2)))
}

export function calculateChange(currentPrice, prevClose) {
  const change = Number((currentPrice - prevClose).toFixed(2))
  const changePercent = prevClose > 0
    ? Number(((currentPrice - prevClose) / prevClose * 100).toFixed(2))
    : 0
  return { change, changePercent }
}

export function getPriceColor(change) {
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'flat'
}

export function formatPrice(price) {
  return Number(price).toFixed(2)
}

export function formatPercent(percent) {
  const sign = percent > 0 ? '+' : ''
  return sign + Number(percent).toFixed(2) + '%'
}

export function formatChange(change) {
  const sign = change > 0 ? '+' : ''
  return sign + Number(change).toFixed(2)
}

export function generateKLineData(basePrice, days = KLINE_DAYS) {
  const data = []
  let price = basePrice
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    const open = price
    const volatility = 0.03
    const closeChange = (Math.random() * 2 - 1) * volatility * price
    const close = Number((open + closeChange).toFixed(2))
    const highExtra = Math.random() * 0.02 * price
    const lowExtra = Math.random() * 0.02 * price
    const high = Number((Math.max(open, close) + highExtra).toFixed(2))
    const low = Number((Math.min(open, close) - lowExtra).toFixed(2))
    const volume = Math.floor(Math.random() * 10000000) + 1000000

    data.push({
      date: formatDate(date),
      open,
      close,
      high,
      low,
      volume,
      isUp: close >= open,
    })

    price = close
  }

  return data
}

export function generateTimeShareData(prevClose) {
  const data = []
  const totalMinutes = TIMESHARE_MINUTES
  let price = prevClose
  const startTime = 9 * 60 + 30

  for (let i = 0; i <= totalMinutes; i++) {
    const minutesFromStart = i
    const totalMin = startTime + minutesFromStart
    const hour = Math.floor(totalMin / 60)
    const minute = totalMin % 60
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

    if (i > 0) {
      const change = (Math.random() * 2 - 1) * 0.002 * prevClose
      price = Number((price + change).toFixed(2))
    }

    data.push({
      time,
      price,
      minute: i,
    })
  }

  return data
}

export function generateId() {
  return 'stock_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatDate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function checkAlertTrigger(alert, currentPrice) {
  if (alert.status !== ALERT_STATUS_ENABLED) return false

  if (alert.type === ALERT_TYPE_UPPER) {
    return currentPrice >= alert.targetPrice
  }
  if (alert.type === ALERT_TYPE_LOWER) {
    return currentPrice <= alert.targetPrice
  }
  return false
}

export function createAlert(stockCode, stockName, type, targetPrice, notify = true) {
  return {
    id: generateId(),
    stockCode,
    stockName,
    type,
    targetPrice: Number(targetPrice),
    notify,
    status: ALERT_STATUS_ENABLED,
    createdAt: Date.now(),
  }
}

export function updateAlertStatus(alerts, alertId, status) {
  return alerts.map((a) =>
    a.id === alertId ? { ...a, status } : a
  )
}

export function deleteAlert(alerts, alertId) {
  return alerts.filter((a) => a.id !== alertId)
}

export function getAlertsByStockCode(alerts, stockCode) {
  return alerts.filter((a) => a.stockCode === stockCode)
}

export function sortStocks(stocks, sortBy, sortOrder) {
  const order = sortOrder === SORT_ORDER_DESC ? -1 : 1
  return [...stocks].sort((a, b) => {
    if (sortBy === 'changePercent') {
      return (a.changePercent - b.changePercent) * order
    }
    if (sortBy === 'change') {
      return (a.change - b.change) * order
    }
    if (sortBy === 'price') {
      return (a.price - b.price) * order
    }
    if (sortBy === 'volume') {
      return (a.volume - b.volume) * order
    }
    if (sortBy === 'amount') {
      return (a.amount - b.amount) * order
    }
    if (sortBy === 'code') {
      return a.code.localeCompare(b.code) * order
    }
    return 0
  })
}

export function filterStockList(stocks, listType) {
  if (listType === LIST_TYPE_ALL) return stocks

  const sorted = sortStocks(stocks, 'changePercent', SORT_ORDER_DESC)

  if (listType === LIST_TYPE_GAINERS) {
    return sorted.filter((s) => s.changePercent > 0).slice(0, 10)
  }

  if (listType === LIST_TYPE_LOSERS) {
    return sorted.filter((s) => s.changePercent < 0).slice(-10).reverse()
  }

  return stocks
}

export function validateStockCode(code) {
  if (!code || !code.trim()) return false
  const trimmed = code.trim().toUpperCase()
  const usPattern = /^[A-Z]{1,5}$/
  const cnPattern = /^\d{6}$/
  return usPattern.test(trimmed) || cnPattern.test(trimmed)
}

export function initializeStockData(stock) {
  const basePrice = generateBasePrice()
  const prevClose = Number((basePrice * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2))
  const open = Number((prevClose * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2))
  const price = open
  const { change, changePercent } = calculateChange(price, prevClose)
  const high = Number((price * (1 + Math.random() * 0.03)).toFixed(2))
  const low = Number((price * (1 - Math.random() * 0.03)).toFixed(2))
  const volume = Math.floor(Math.random() * 50000000) + 5000000
  const amount = Math.floor(price * volume)

  return {
    ...stock,
    code: stock.code.toUpperCase(),
    price,
    prevClose,
    open,
    high: Math.max(high, price),
    low: Math.min(low, price),
    volume,
    amount,
    change,
    changePercent,
  }
}

export function updateStockPrice(stock) {
  const newPrice = generateNextPrice(stock.price)
  const { change, changePercent } = calculateChange(newPrice, stock.prevClose)
  const high = Math.max(stock.high, newPrice)
  const low = Math.min(stock.low, newPrice)
  const volumeIncrease = Math.floor(Math.random() * 100000)
  const volume = stock.volume + volumeIncrease
  const amount = Math.floor(stock.amount + newPrice * volumeIncrease)

  return {
    ...stock,
    price: Number(newPrice.toFixed(2)),
    change,
    changePercent,
    high: Number(high.toFixed(2)),
    low: Number(low.toFixed(2)),
    volume,
    amount,
  }
}

export function moveWatchlistItem(watchlist, fromIndex, toIndex) {
  const result = [...watchlist]
  const [item] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, item)
  return result
}
