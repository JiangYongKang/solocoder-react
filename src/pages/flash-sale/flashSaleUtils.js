import {
  FLASH_SALE_STATUS,
  PURCHASE_RESULT,
  MIN_DELAY_MS,
  MAX_DELAY_MS,
  SUCCESS_RATE,
  STOCK_COLOR_THRESHOLDS,
  STOCK_COLORS,
  START_OFFSET_MINUTES,
  DURATION_MINUTES,
} from './constants.js'

export function padZero(num) {
  return String(num).padStart(2, '0')
}

export function formatCountdown(ms) {
  if (ms <= 0) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00', total: 0 }
  }
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return {
    days: padZero(days),
    hours: padZero(hours),
    minutes: padZero(minutes),
    seconds: padZero(seconds),
    total: totalSeconds,
  }
}

export function formatCountdownString(ms) {
  const { days, hours, minutes, seconds } = formatCountdown(ms)
  return `${days}:${hours}:${minutes}:${seconds}`
}

export function getFlashSaleStatus(startTime, endTime, currentStock, now = Date.now()) {
  if (currentStock <= 0) {
    return FLASH_SALE_STATUS.SOLD_OUT
  }
  if (now < startTime) {
    return FLASH_SALE_STATUS.NOT_STARTED
  }
  if (now > endTime) {
    return FLASH_SALE_STATUS.ENDED
  }
  return FLASH_SALE_STATUS.ONGOING
}

export function getCountdownTarget(startTime, endTime, status, now = Date.now()) {
  if (status === FLASH_SALE_STATUS.NOT_STARTED) {
    return startTime - now
  }
  if (status === FLASH_SALE_STATUS.ONGOING) {
    return endTime - now
  }
  return 0
}

export function getStockPercentage(currentStock, initialStock) {
  if (!initialStock || initialStock <= 0) return 0
  if (currentStock <= 0) return 0
  if (currentStock >= initialStock) return 100
  return Math.round((currentStock / initialStock) * 100)
}

export function getSoldCount(currentStock, initialStock) {
  const sold = initialStock - currentStock
  return Math.max(0, sold)
}

export function getStockColor(currentStock, initialStock) {
  const percentage = getStockPercentage(currentStock, initialStock) / 100
  if (percentage >= STOCK_COLOR_THRESHOLDS.HIGH) {
    return STOCK_COLORS.HIGH
  }
  if (percentage >= STOCK_COLOR_THRESHOLDS.MEDIUM) {
    return STOCK_COLORS.MEDIUM
  }
  return STOCK_COLORS.LOW
}

export function formatPrice(price) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return '¥0.00'
  return `¥${Number(price).toFixed(2)}`
}

export function generateFlashSaleTimes(startOffsetMinutes = START_OFFSET_MINUTES, durationMinutes = DURATION_MINUTES, now = Date.now()) {
  const startTime = now + startOffsetMinutes * 60 * 1000
  const endTime = startTime + durationMinutes * 60 * 1000
  return { startTime, endTime }
}

export function getRandomDelay(min = MIN_DELAY_MS, max = MAX_DELAY_MS) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function shouldSucceed(successRate = SUCCESS_RATE) {
  return Math.random() < successRate
}

export function simulatePurchase(currentStock) {
  return new Promise((resolve) => {
    const delay = getRandomDelay()
    setTimeout(() => {
      if (currentStock <= 0) {
        resolve({ result: PURCHASE_RESULT.SOLD_OUT, newStock: currentStock })
        return
      }
      if (shouldSucceed()) {
        resolve({ result: PURCHASE_RESULT.SUCCESS, newStock: currentStock - 1 })
      } else {
        resolve({ result: PURCHASE_RESULT.FAILED, newStock: currentStock })
      }
    }, delay)
  })
}

export function isButtonClickable(status) {
  return status === FLASH_SALE_STATUS.ONGOING
}

export function getButtonText(status, isPurchasing) {
  if (isPurchasing) return '抢购中...'
  switch (status) {
    case FLASH_SALE_STATUS.NOT_STARTED:
      return '即将开始'
    case FLASH_SALE_STATUS.ONGOING:
      return '立即抢购'
    case FLASH_SALE_STATUS.SOLD_OUT:
      return '已售罄'
    case FLASH_SALE_STATUS.ENDED:
      return '已结束'
    default:
      return '立即抢购'
  }
}
