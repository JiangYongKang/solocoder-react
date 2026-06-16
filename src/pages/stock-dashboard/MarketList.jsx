import { useState, useMemo } from 'react'
import { formatPrice, formatChange, formatPercent, sortStocks, filterStockList } from './stockUtils'
import {
  SORT_ORDER_ASC,
  SORT_ORDER_DESC,
  LIST_TYPE_ALL,
  LIST_TYPE_GAINERS,
  LIST_TYPE_LOSERS,
} from './constants'

const MarketList = ({ stocks, onSelectStock }) => {
  const [listType, setListType] = useState(LIST_TYPE_ALL)
  const [sortBy, setSortBy] = useState('changePercent')
  const [sortOrder, setSortOrder] = useState(SORT_ORDER_DESC)

  const displayStocks = useMemo(() => {
    const filtered = filterStockList(stocks, listType)
    return sortStocks(filtered, sortBy, sortOrder)
  }, [stocks, listType, sortBy, sortOrder])

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === SORT_ORDER_DESC ? SORT_ORDER_ASC : SORT_ORDER_DESC)
    } else {
      setSortBy(field)
      setSortOrder(SORT_ORDER_DESC)
    }
  }

  const formatVolume = (volume) => {
    if (volume >= 100000000) {
      return (volume / 100000000).toFixed(2) + '亿'
    }
    if (volume >= 10000) {
      return (volume / 10000).toFixed(0) + '万'
    }
    return volume.toString()
  }

  const formatAmount = (amount) => {
    if (amount >= 100000000) {
      return (amount / 100000000).toFixed(2) + '亿'
    }
    if (amount >= 10000) {
      return (amount / 10000).toFixed(0) + '万'
    }
    return amount.toString()
  }

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕'
    return sortOrder === SORT_ORDER_DESC ? '↓' : '↑'
  }

  const isTopGainer = (index) => {
    return listType === LIST_TYPE_ALL && sortBy === 'changePercent' && sortOrder === SORT_ORDER_DESC && index < 3
  }

  return (
    <div className="market-list-container">
      <div className="market-list-toolbar">
        <button
          className={`list-type-btn ${listType === LIST_TYPE_ALL ? 'active' : ''}`}
          onClick={() => setListType(LIST_TYPE_ALL)}
        >
          全部
        </button>
        <button
          className={`list-type-btn ${listType === LIST_TYPE_GAINERS ? 'active' : ''}`}
          onClick={() => {
            setListType(LIST_TYPE_GAINERS)
            setSortBy('changePercent')
            setSortOrder(SORT_ORDER_DESC)
          }}
        >
          涨幅榜
        </button>
        <button
          className={`list-type-btn ${listType === LIST_TYPE_LOSERS ? 'active' : ''}`}
          onClick={() => {
            setListType(LIST_TYPE_LOSERS)
            setSortBy('changePercent')
            setSortOrder(SORT_ORDER_ASC)
          }}
        >
          跌幅榜
        </button>
      </div>

      <div className="market-table-wrapper">
        <table className="market-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('code')}>
                代码 <span className="sort-icon">{getSortIcon('code')}</span>
              </th>
              <th>名称</th>
              <th onClick={() => handleSort('price')}>
                最新价 <span className="sort-icon">{getSortIcon('price')}</span>
              </th>
              <th onClick={() => handleSort('change')}>
                涨跌额 <span className="sort-icon">{getSortIcon('change')}</span>
              </th>
              <th onClick={() => handleSort('changePercent')}>
                涨跌幅 <span className="sort-icon">{getSortIcon('changePercent')}</span>
              </th>
              <th onClick={() => handleSort('volume')}>
                成交量 <span className="sort-icon">{getSortIcon('volume')}</span>
              </th>
              <th onClick={() => handleSort('amount')}>
                成交额 <span className="sort-icon">{getSortIcon('amount')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayStocks.map((stock, index) => {
              const priceClass = stock.change > 0 ? 'price-up' : stock.change < 0 ? 'price-down' : 'price-flat'
              return (
                <tr
                  key={stock.code}
                  onClick={() => onSelectStock?.(stock.code)}
                  style={{ cursor: onSelectStock ? 'pointer' : 'default' }}
                >
                  <td>
                    {isTopGainer(index) && <span className="star-badge">★</span>}
                    {stock.code}
                  </td>
                  <td>{stock.name}</td>
                  <td className={priceClass}>{formatPrice(stock.price)}</td>
                  <td className={priceClass}>{formatChange(stock.change)}</td>
                  <td className={priceClass}>{formatPercent(stock.changePercent)}</td>
                  <td>{formatVolume(stock.volume)}</td>
                  <td>{formatAmount(stock.amount)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MarketList
