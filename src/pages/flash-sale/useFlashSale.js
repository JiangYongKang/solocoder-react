import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  MOCK_PRODUCT,
  PURCHASE_RESULT_MESSAGES,
} from './constants.js'
import {
  getFlashSaleStatus,
  getCountdownTarget,
  formatCountdown,
  simulatePurchase,
  getStockPercentage,
  getSoldCount,
  getStockColor,
  isButtonClickable,
  getButtonText,
  generateFlashSaleTimes,
} from './flashSaleUtils.js'

export function useFlashSale() {
  const { startTime, endTime } = useMemo(() => generateFlashSaleTimes(), [])
  const [currentStock, setCurrentStock] = useState(MOCK_PRODUCT.initialStock)
  const [now, setNow] = useState(() => Date.now())
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [toast, setToast] = useState(null)
  const purchasingLock = useRef(false)
  const toastTimerRef = useRef(null)

  const status = useMemo(
    () => getFlashSaleStatus(startTime, endTime, currentStock, now),
    [startTime, endTime, currentStock, now]
  )

  const countdownMs = useMemo(
    () => getCountdownTarget(startTime, endTime, status),
    [startTime, endTime, status]
  )

  const countdown = useMemo(() => formatCountdown(countdownMs), [countdownMs])

  const stockPercentage = useMemo(
    () => getStockPercentage(currentStock, MOCK_PRODUCT.initialStock),
    [currentStock]
  )

  const soldCount = useMemo(
    () => getSoldCount(currentStock, MOCK_PRODUCT.initialStock),
    [currentStock]
  )

  const stockColor = useMemo(
    () => getStockColor(currentStock, MOCK_PRODUCT.initialStock),
    [currentStock]
  )

  const buttonClickable = useMemo(
    () => isButtonClickable(status) && !isPurchasing,
    [status, isPurchasing]
  )

  const buttonText = useMemo(
    () => getButtonText(status, isPurchasing),
    [status, isPurchasing]
  )

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    setToast({ message, type })
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 2500)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  const handlePurchase = useCallback(async () => {
    if (purchasingLock.current || !isButtonClickable(status)) {
      return
    }
    purchasingLock.current = true
    setIsPurchasing(true)

    try {
      const result = await simulatePurchase(currentStock)
      setCurrentStock(result.newStock)
      const message = PURCHASE_RESULT_MESSAGES[result.result] || '抢购结果'
      showToast(message, result.result)
    } finally {
      setIsPurchasing(false)
      purchasingLock.current = false
    }
  }, [status, currentStock, showToast])

  return {
    product: MOCK_PRODUCT,
    status,
    countdown,
    countdownMs,
    currentStock,
    stockPercentage,
    soldCount,
    stockColor,
    isPurchasing,
    buttonClickable,
    buttonText,
    toast,
    startTime,
    endTime,
    handlePurchase,
  }
}
