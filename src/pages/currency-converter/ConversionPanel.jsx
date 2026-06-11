import { useCallback } from 'react'
import CurrencySelector from './CurrencySelector.jsx'
import { convertCurrency, formatRate } from './currencyUtils.js'

const ConversionPanel = ({
  baseCode,
  targetCode,
  baseAmount,
  targetAmount,
  onBaseChange,
  onTargetChange,
  onBaseAmountChange,
  onTargetAmountChange,
  onSwap,
}) => {
  const handleBaseAmountChange = useCallback((e) => {
    const val = e.target.value
    onBaseAmountChange(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num >= 0) {
      const converted = convertCurrency(num, baseCode, targetCode)
      onTargetAmountChange(converted !== null ? String(converted) : '')
    } else {
      onTargetAmountChange('')
    }
  }, [baseCode, targetCode, onBaseAmountChange, onTargetAmountChange])

  const handleTargetAmountChange = useCallback((e) => {
    const val = e.target.value
    onTargetAmountChange(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num >= 0) {
      const converted = convertCurrency(num, targetCode, baseCode)
      onBaseAmountChange(converted !== null ? String(converted) : '')
    } else {
      onBaseAmountChange('')
    }
  }, [baseCode, targetCode, onBaseAmountChange, onTargetAmountChange])

  const handleBaseCurrencyChange = useCallback((code) => {
    onBaseChange(code)
    const num = parseFloat(baseAmount) || 0
    if (num > 0) {
      const converted = convertCurrency(num, code, targetCode)
      onTargetAmountChange(converted !== null ? String(converted) : '')
    }
  }, [baseAmount, targetCode, onBaseChange, onTargetAmountChange])

  const handleTargetCurrencyChange = useCallback((code) => {
    onTargetChange(code)
    const num = parseFloat(baseAmount) || 0
    if (num > 0) {
      const converted = convertCurrency(num, baseCode, code)
      onTargetAmountChange(converted !== null ? String(converted) : '')
    }
  }, [baseAmount, baseCode, onTargetChange, onTargetAmountChange])

  const rate = convertCurrency(1, baseCode, targetCode)
  const rateDisplay = rate !== null ? formatRate(rate) : '--'

  return (
    <div className="cc-conversion-panel">
      <div className="cc-conversion-row">
        <div className="cc-conversion-side">
          <CurrencySelector
            value={baseCode}
            onChange={handleBaseCurrencyChange}
            label="基准货币"
          />
          <div className="cc-amount-input-wrap">
            <input
              className="cc-amount-input"
              type="number"
              min="0"
              step="any"
              value={baseAmount}
              onChange={handleBaseAmountChange}
              placeholder="输入金额"
            />
          </div>
        </div>

        <button className="cc-swap-btn" onClick={onSwap} title="互换货币">
          ⇄
        </button>

        <div className="cc-conversion-side">
          <CurrencySelector
            value={targetCode}
            onChange={handleTargetCurrencyChange}
            label="目标货币"
          />
          <div className="cc-amount-input-wrap">
            <input
              className="cc-amount-input"
              type="number"
              min="0"
              step="any"
              value={targetAmount}
              onChange={handleTargetAmountChange}
              placeholder="换算结果"
            />
          </div>
        </div>
      </div>
      <div className="cc-rate-info">
        1 {baseCode} = {rateDisplay} {targetCode}
      </div>
    </div>
  )
}

export default ConversionPanel
