import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ConversionPanel from './ConversionPanel.jsx'
import ExchangeRateTable from './ExchangeRateTable.jsx'
import TrendChart from './TrendChart.jsx'
import FavoritesSidebar from './FavoritesSidebar.jsx'
import {
  loadFavorites,
  saveFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  convertCurrency,
} from './currencyUtils.js'

import './currency-converter.css'

const CurrencyConverterPage = () => {
  const navigate = useNavigate()
  const [baseCode, setBaseCode] = useState('USD')
  const [targetCode, setTargetCode] = useState('CNY')
  const [baseAmount, setBaseAmount] = useState('1')
  const [targetAmount, setTargetAmount] = useState(() => {
    const rate = convertCurrency(1, 'USD', 'CNY')
    return rate !== null ? String(rate) : ''
  })
  const [favorites, setFavorites] = useState(() => loadFavorites())

  useEffect(() => {
    saveFavorites(favorites)
  }, [favorites])

  const handleSwap = useCallback(() => {
    const newBaseCode = targetCode
    const newTargetCode = baseCode
    const newBaseAmount = targetAmount

    setBaseCode(newBaseCode)
    setTargetCode(newTargetCode)
    setBaseAmount(newBaseAmount)

    const num = parseFloat(newBaseAmount) || 0
    if (num > 0) {
      const converted = convertCurrency(num, newBaseCode, newTargetCode)
      setTargetAmount(converted !== null ? String(converted) : '')
    } else {
      setTargetAmount('')
    }
  }, [baseCode, targetCode, targetAmount])

  const handleToggleFavorite = useCallback((base, target) => {
    setFavorites((prev) => {
      if (isFavorite(prev, base, target)) {
        return removeFavorite(prev, base, target)
      }
      return addFavorite(prev, base, target)
    })
  }, [])

  const handleRemoveFavorite = useCallback((base, target) => {
    setFavorites((prev) => removeFavorite(prev, base, target))
  }, [])

  const handleSelectFavorite = useCallback((base, target) => {
    setBaseCode(base)
    setTargetCode(target)
    const num = parseFloat(baseAmount) || 0
    if (num > 0) {
      const converted = convertCurrency(num, base, target)
      setTargetAmount(converted !== null ? String(converted) : '')
    }
  }, [baseAmount])

  return (
    <div className="cc-page">
      <div className="cc-container">
        <div className="cc-header">
          <button className="cc-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="cc-title">实时汇率换算器</h1>
        </div>

        <div className="cc-main">
          <aside className="cc-sidebar-area">
            <FavoritesSidebar
              favorites={favorites}
              onRemove={handleRemoveFavorite}
              onSelect={handleSelectFavorite}
            />
          </aside>

          <main className="cc-content">
            <div className="cc-card">
              <ConversionPanel
                baseCode={baseCode}
                targetCode={targetCode}
                baseAmount={baseAmount}
                targetAmount={targetAmount}
                onBaseChange={setBaseCode}
                onTargetChange={setTargetCode}
                onBaseAmountChange={setBaseAmount}
                onTargetAmountChange={setTargetAmount}
                onSwap={handleSwap}
              />
            </div>

            <div className="cc-card">
              <ExchangeRateTable
                baseCode={baseCode}
                onToggleFavorite={handleToggleFavorite}
                favorites={favorites}
              />
            </div>

            <div className="cc-card">
              <TrendChart
                baseCode={baseCode}
                targetCode={targetCode}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default CurrencyConverterPage
