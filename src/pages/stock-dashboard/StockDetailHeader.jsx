import { formatPrice, formatChange, formatPercent, getPriceColor } from './stockUtils'

const StockDetailHeader = ({ stock }) => {
  if (!stock) {
    return (
      <div className="stock-detail-header">
        <div className="empty-state">
          <div className="empty-state-icon">📈</div>
          <div>请选择一只股票查看详情</div>
        </div>
      </div>
    )
  }

  const priceColor = getPriceColor(stock.change)

  return (
    <div className="stock-detail-header">
      <div className="detail-header-top">
        <div>
          <h2 className="detail-stock-name">{stock.name}</h2>
          <span className="detail-stock-code">{stock.code}</span>
        </div>
      </div>

      <div className="detail-price-section">
        <span className={`detail-current-price ${priceColor}`}>
          {formatPrice(stock.price)}
        </span>
        <div className="detail-change-info">
          <span className={`detail-change ${priceColor}`}>
            {formatChange(stock.change)}
          </span>
          <span className={`detail-change ${priceColor}`}>
            {formatPercent(stock.changePercent)}
          </span>
        </div>
      </div>

      <div className="detail-stats">
        <div className="stat-item">
          <span className="stat-label">今日开盘</span>
          <span className="stat-value">{formatPrice(stock.open)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">昨日收盘</span>
          <span className="stat-value">{formatPrice(stock.prevClose)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">今日最高</span>
          <span className="stat-value price-up">{formatPrice(stock.high)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">今日最低</span>
          <span className="stat-value price-down">{formatPrice(stock.low)}</span>
        </div>
      </div>
    </div>
  )
}

export default StockDetailHeader
