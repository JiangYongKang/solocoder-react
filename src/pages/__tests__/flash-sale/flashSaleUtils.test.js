import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  padZero,
  formatCountdown,
  formatCountdownString,
  getFlashSaleStatus,
  getCountdownTarget,
  getStockPercentage,
  getSoldCount,
  getStockColor,
  formatPrice,
  generateFlashSaleTimes,
  getRandomDelay,
  shouldSucceed,
  simulatePurchase,
  isButtonClickable,
  getButtonText,
} from '../../flash-sale/flashSaleUtils.js'
import {
  FLASH_SALE_STATUS,
  PURCHASE_RESULT,
  STOCK_COLORS,
  MIN_DELAY_MS,
  MAX_DELAY_MS,
} from '../../flash-sale/constants.js'

describe('padZero', () => {
  it('个位数补零成功', () => {
    expect(padZero(0)).toBe('00')
    expect(padZero(5)).toBe('05')
    expect(padZero(9)).toBe('09')
  })

  it('两位数不补零', () => {
    expect(padZero(10)).toBe('10')
    expect(padZero(59)).toBe('59')
    expect(padZero(99)).toBe('99')
  })

  it('数字转字符串', () => {
    expect(padZero(123)).toBe('123')
  })
})

describe('formatCountdown', () => {
  it('0或负数返回全零', () => {
    expect(formatCountdown(0)).toEqual({ days: '00', hours: '00', minutes: '00', seconds: '00', total: 0 })
    expect(formatCountdown(-1000)).toEqual({ days: '00', hours: '00', minutes: '00', seconds: '00', total: 0 })
  })

  it('1天12小时35分48秒', () => {
    const ms = (1 * 86400 + 12 * 3600 + 35 * 60 + 48) * 1000
    const result = formatCountdown(ms)
    expect(result.days).toBe('01')
    expect(result.hours).toBe('12')
    expect(result.minutes).toBe('35')
    expect(result.seconds).toBe('48')
    expect(result.total).toBe(1 * 86400 + 12 * 3600 + 35 * 60 + 48)
  })

  it('不足1天时days为00', () => {
    const ms = (23 * 3600 + 59 * 60 + 59) * 1000
    const result = formatCountdown(ms)
    expect(result.days).toBe('00')
    expect(result.hours).toBe('23')
    expect(result.minutes).toBe('59')
    expect(result.seconds).toBe('59')
  })

  it('不足1小时时hours为00', () => {
    const ms = (59 * 60 + 30) * 1000
    const result = formatCountdown(ms)
    expect(result.days).toBe('00')
    expect(result.hours).toBe('00')
    expect(result.minutes).toBe('59')
    expect(result.seconds).toBe('30')
  })

  it('不足1分钟时minutes为00', () => {
    const ms = 45 * 1000
    const result = formatCountdown(ms)
    expect(result.days).toBe('00')
    expect(result.hours).toBe('00')
    expect(result.minutes).toBe('00')
    expect(result.seconds).toBe('45')
  })
})

describe('formatCountdownString', () => {
  it('格式化为天:时:分:秒', () => {
    const ms = (1 * 86400 + 12 * 3600 + 35 * 60 + 48) * 1000
    expect(formatCountdownString(ms)).toBe('01:12:35:48')
  })

  it('0毫秒返回全零', () => {
    expect(formatCountdownString(0)).toBe('00:00:00:00')
  })
})

describe('getFlashSaleStatus', () => {
  const now = Date.now()
  const startTime = now + 10 * 60 * 1000
  const endTime = now + 40 * 60 * 1000

  it('库存为0时返回SOLD_OUT', () => {
    expect(getFlashSaleStatus(startTime, endTime, 0, now)).toBe(FLASH_SALE_STATUS.SOLD_OUT)
    expect(getFlashSaleStatus(startTime, endTime, -1, now)).toBe(FLASH_SALE_STATUS.SOLD_OUT)
  })

  it('活动未开始返回NOT_STARTED', () => {
    expect(getFlashSaleStatus(startTime, endTime, 100, now - 1000)).toBe(FLASH_SALE_STATUS.NOT_STARTED)
  })

  it('活动进行中返回ONGOING', () => {
    expect(getFlashSaleStatus(startTime, endTime, 100, now + 20 * 60 * 1000)).toBe(FLASH_SALE_STATUS.ONGOING)
  })

  it('活动已结束返回ENDED', () => {
    expect(getFlashSaleStatus(startTime, endTime, 100, endTime + 1000)).toBe(FLASH_SALE_STATUS.ENDED)
  })

  it('库存为0即使在进行中时返回SOLD_OUT', () => {
    expect(getFlashSaleStatus(startTime, endTime, 0, now + 20 * 60 * 1000)).toBe(FLASH_SALE_STATUS.SOLD_OUT)
  })
})

describe('getCountdownTarget', () => {
  const now = 1700000000000
  const startTime = now + 10 * 60 * 1000
  const endTime = now + 40 * 60 * 1000

  it('NOT_STARTED状态返回开始时间差', () => {
    const target = getCountdownTarget(startTime, endTime, FLASH_SALE_STATUS.NOT_STARTED, now)
    expect(target).toBe(startTime - now)
    expect(target).toBeGreaterThan(0)
  })

  it('ONGOING状态返回结束时间差', () => {
    const target = getCountdownTarget(startTime, endTime, FLASH_SALE_STATUS.ONGOING, now)
    expect(target).toBe(endTime - now)
    expect(target).toBeGreaterThan(0)
  })

  it('SOLD_OUT状态返回0', () => {
    expect(getCountdownTarget(startTime, endTime, FLASH_SALE_STATUS.SOLD_OUT, now)).toBe(0)
  })

  it('ENDED状态返回0', () => {
    expect(getCountdownTarget(startTime, endTime, FLASH_SALE_STATUS.ENDED, now)).toBe(0)
  })
})

describe('getStockPercentage', () => {
  it('初始库存为0返回0', () => {
    expect(getStockPercentage(100, 0)).toBe(0)
  })

  it('当前库存为0返回0', () => {
    expect(getStockPercentage(0, 100)).toBe(0)
  })

  it('库存满返回100', () => {
    expect(getStockPercentage(100, 100)).toBe(100)
  })

  it('库存超过初始值返回100', () => {
    expect(getStockPercentage(150, 100)).toBe(100)
  })

  it('50%库存', () => {
    expect(getStockPercentage(50, 100)).toBe(50)
  })

  it('四舍五入到整数', () => {
    expect(getStockPercentage(33, 100)).toBe(33)
    expect(getStockPercentage(67, 100)).toBe(67)
  })
})

describe('getSoldCount', () => {
  it('初始库存减当前库存', () => {
    expect(getSoldCount(800, 1000)).toBe(200)
  })

  it('当前库存为初始库存时已抢0', () => {
    expect(getSoldCount(1000, 1000)).toBe(0)
  })

  it('当前库存超过初始库存返回0', () => {
    expect(getSoldCount(1200, 1000)).toBe(0)
  })

  it('库存为0时已抢全部', () => {
    expect(getSoldCount(0, 1000)).toBe(1000)
  })
})

describe('getStockColor', () => {
  it('库存>=50%返回绿色', () => {
    expect(getStockColor(50, 100)).toBe(STOCK_COLORS.HIGH)
    expect(getStockColor(60, 100)).toBe(STOCK_COLORS.HIGH)
    expect(getStockColor(100, 100)).toBe(STOCK_COLORS.HIGH)
  })

  it('库存20%-50%返回橙色', () => {
    expect(getStockColor(20, 100)).toBe(STOCK_COLORS.MEDIUM)
    expect(getStockColor(49, 100)).toBe(STOCK_COLORS.MEDIUM)
  })

  it('库存<20%返回红色', () => {
    expect(getStockColor(19, 100)).toBe(STOCK_COLORS.LOW)
    expect(getStockColor(0, 100)).toBe(STOCK_COLORS.LOW)
  })
})

describe('formatPrice', () => {
  it('null或undefined返回¥0.00', () => {
    expect(formatPrice(null)).toBe('¥0.00')
    expect(formatPrice(undefined)).toBe('¥0.00')
  })

  it('NaN返回¥0.00', () => {
    expect(formatPrice(NaN)).toBe('¥0.00')
  })

  it('整数价格', () => {
    expect(formatPrice(99)).toBe('¥99.00')
  })

  it('小数价格', () => {
    expect(formatPrice(99.9)).toBe('¥99.90')
    expect(formatPrice(199.99)).toBe('¥199.99')
  })

  it('字符串数字', () => {
    expect(formatPrice('123.45')).toBe('¥123.45')
  })
})

describe('generateFlashSaleTimes', () => {
  const now = 1700000000000

  it('生成的开始时间在当前时间之后', () => {
    const { startTime, endTime } = generateFlashSaleTimes(5, 30, now)
    expect(startTime).toBeGreaterThan(now)
    expect(startTime - now).toBe(5 * 60 * 1000)
  })

  it('生成的结束时间在开始时间之后', () => {
    const { startTime, endTime } = generateFlashSaleTimes(5, 30, now)
    expect(endTime).toBeGreaterThan(startTime)
    expect(endTime - startTime).toBe(30 * 60 * 1000)
  })

  it('使用默认参数', () => {
    const { startTime, endTime } = generateFlashSaleTimes(undefined, undefined, now)
    expect(startTime).toBe(now + 60 * 1000)
    expect(endTime).toBe(startTime + 30 * 60 * 1000)
  })
})

describe('getRandomDelay', () => {
  it('返回值在范围内', () => {
    for (let i = 0; i < 100; i++) {
      const delay = getRandomDelay()
      expect(delay).toBeGreaterThanOrEqual(MIN_DELAY_MS)
      expect(delay).toBeLessThanOrEqual(MAX_DELAY_MS)
      expect(Number.isInteger(delay)).toBe(true)
    }
  })

  it('自定义范围', () => {
    for (let i = 0; i < 100; i++) {
      const delay = getRandomDelay(100, 200)
      expect(delay).toBeGreaterThanOrEqual(100)
      expect(delay).toBeLessThanOrEqual(200)
    }
  })
})

describe('shouldSucceed', () => {
  it('成功率1时总是成功', () => {
    for (let i = 0; i < 100; i++) {
      expect(shouldSucceed(1)).toBe(true)
    }
  })

  it('成功率0时总是失败', () => {
    for (let i = 0; i < 100; i++) {
      expect(shouldSucceed(0)).toBe(false)
    }
  })

  it('成功率0.5时有成功有失败', () => {
    let success = 0
    for (let i = 0; i < 1000; i++) {
      if (shouldSucceed(0.5)) success++
    }
    expect(success).toBeGreaterThan(200)
    expect(success).toBeLessThan(800)
  })
})

describe('simulatePurchase', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('库存为0时返回售罄', async () => {
    const promise = simulatePurchase(0)
    vi.advanceTimersByTime(MAX_DELAY_MS)
    const result = await promise
    expect(result.result).toBe(PURCHASE_RESULT.SOLD_OUT)
    expect(result.newStock).toBe(0)
  })

  it('库存充足且成功时扣减库存', async () => {
    const originalMathRandom = Math.random
    Math.random = () => 0.1
    const promise = simulatePurchase(100)
    vi.advanceTimersByTime(MAX_DELAY_MS)
    const result = await promise
    expect(result.result).toBe(PURCHASE_RESULT.SUCCESS)
    expect(result.newStock).toBe(99)
    Math.random = originalMathRandom
  })

  it('库存充足但失败时不扣减库存', async () => {
    const originalMathRandom = Math.random
    Math.random = () => 0.99
    const promise = simulatePurchase(100)
    vi.advanceTimersByTime(MAX_DELAY_MS)
    const result = await promise
    expect(result.result).toBe(PURCHASE_RESULT.FAILED)
    expect(result.newStock).toBe(100)
    Math.random = originalMathRandom
  })
})

describe('isButtonClickable', () => {
  it('ONGOING状态可点击', () => {
    expect(isButtonClickable(FLASH_SALE_STATUS.ONGOING)).toBe(true)
  })

  it('其他状态不可点击', () => {
    expect(isButtonClickable(FLASH_SALE_STATUS.NOT_STARTED)).toBe(false)
    expect(isButtonClickable(FLASH_SALE_STATUS.SOLD_OUT)).toBe(false)
    expect(isButtonClickable(FLASH_SALE_STATUS.ENDED)).toBe(false)
  })
})

describe('getButtonText', () => {
  it('抢购中显示抢购中...', () => {
    expect(getButtonText(FLASH_SALE_STATUS.ONGOING, true)).toBe('抢购中...')
  })

  it('即将开始显示即将开始', () => {
    expect(getButtonText(FLASH_SALE_STATUS.NOT_STARTED, false)).toBe('即将开始')
  })

  it('抢购中显示立即抢购', () => {
    expect(getButtonText(FLASH_SALE_STATUS.ONGOING, false)).toBe('立即抢购')
  })

  it('已售罄显示已售罄', () => {
    expect(getButtonText(FLASH_SALE_STATUS.SOLD_OUT, false)).toBe('已售罄')
  })

  it('已结束显示已结束', () => {
    expect(getButtonText(FLASH_SALE_STATUS.ENDED, false)).toBe('已结束')
  })
})
