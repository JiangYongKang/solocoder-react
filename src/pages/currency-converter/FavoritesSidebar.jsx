import { useMemo } from 'react'
import { getRate, formatRate, formatChange, generateDailyChanges, getCurrencyByCode } from './currencyUtils.js'

const FavoritesSidebar = ({ favorites, onRemove, onSelect }) => {
  const favChanges = useMemo(() => {
    const result = {}
    favorites.forEach((fav) => {
      const changes = generateDailyChanges(fav.base)
      result[`${fav.base}-${fav.target}`] = changes[fav.target] || 0
    })
    return result
  }, [favorites])

  if (favorites.length === 0) {
    return (
      <div className="cc-sidebar">
        <div className="cc-sidebar-card">
          <div className="cc-sidebar-title">⭐ 收藏列表</div>
          <div className="cc-sidebar-empty">暂无收藏货币对</div>
        </div>
      </div>
    )
  }

  return (
    <div className="cc-sidebar">
      <div className="cc-sidebar-card">
        <div className="cc-sidebar-title">⭐ 收藏列表</div>
        <div className="cc-fav-list">
          {favorites.map((fav) => {
            const baseCurrency = getCurrencyByCode(fav.base)
            const targetCurrency = getCurrencyByCode(fav.target)
            const rate = getRate(fav.base, fav.target)
            const change = favChanges[`${fav.base}-${fav.target}`] || 0

            return (
              <div
                key={`${fav.base}-${fav.target}`}
                className="cc-fav-item"
                onClick={() => onSelect(fav.base, fav.target)}
              >
                <div className="cc-fav-info">
                  <div className="cc-fav-pair">
                    <span>{baseCurrency?.flag || ''}</span>
                    <span className="cc-fav-base">{fav.base}</span>
                    <span className="cc-fav-arrow">→</span>
                    <span>{targetCurrency?.flag || ''}</span>
                    <span className="cc-fav-target">{fav.target}</span>
                  </div>
                  <div className="cc-fav-rate-row">
                    <span className="cc-fav-rate">{formatRate(rate)}</span>
                    <span className={`cc-fav-change ${change > 0 ? 'positive' : change < 0 ? 'negative' : ''}`}>
                      {formatChange(change)}
                    </span>
                  </div>
                </div>
                <button
                  className="cc-fav-remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(fav.base, fav.target)
                  }}
                  title="删除收藏"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default FavoritesSidebar
