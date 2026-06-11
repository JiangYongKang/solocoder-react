import { useState, useMemo } from 'react'
import { generateRateTable, formatRate, formatChange, isFavorite } from './currencyUtils.js'

const ExchangeRateTable = ({ baseCode, onToggleFavorite, favorites }) => {
  const [sortField, setSortField] = useState('code')
  const [sortAsc, setSortAsc] = useState(true)

  const tableData = useMemo(() => generateRateTable(baseCode), [baseCode])

  const sorted = useMemo(() => {
    const arr = [...tableData]
    arr.sort((a, b) => {
      let va, vb
      if (sortField === 'rate') {
        va = a.rate ?? -Infinity
        vb = b.rate ?? -Infinity
      } else if (sortField === 'change') {
        va = a.change ?? -Infinity
        vb = b.change ?? -Infinity
      } else {
        va = a.code
        vb = b.code
      }
      if (va < vb) return sortAsc ? -1 : 1
      if (va > vb) return sortAsc ? 1 : -1
      return 0
    })
    return arr
  }, [tableData, sortField, sortAsc])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const sortIcon = (field) => {
    if (sortField !== field) return '↕'
    return sortAsc ? '↑' : '↓'
  }

  return (
    <div className="cc-rate-table-wrap">
      <h3 className="cc-section-title">汇率表格</h3>
      <div className="cc-rate-table-container">
        <table className="cc-rate-table">
          <thead>
            <tr>
              <th className="cc-th-star">★</th>
              <th onClick={() => handleSort('code')} className="cc-th-sortable">
                货币 {sortIcon('code')}
              </th>
              <th>名称</th>
              <th onClick={() => handleSort('rate')} className="cc-th-sortable">
                汇率 {sortIcon('rate')}
              </th>
              <th onClick={() => handleSort('change')} className="cc-th-sortable">
                涨跌幅 {sortIcon('change')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.code} className="cc-rate-row">
                <td className="cc-td-star">
                  <button
                    className={`cc-star-btn ${isFavorite(favorites, baseCode, row.code) ? 'starred' : ''}`}
                    onClick={() => onToggleFavorite(baseCode, row.code)}
                    title={isFavorite(favorites, baseCode, row.code) ? '取消收藏' : '收藏'}
                  >
                    {isFavorite(favorites, baseCode, row.code) ? '★' : '☆'}
                  </button>
                </td>
                <td className="cc-td-code">
                  <span className="cc-flag">{row.flag}</span>
                  <span className="cc-code">{row.code}</span>
                </td>
                <td className="cc-td-name">{row.name}</td>
                <td className="cc-td-rate">{row.rate !== null ? formatRate(row.rate) : '--'}</td>
                <td className={`cc-td-change ${row.change > 0 ? 'positive' : row.change < 0 ? 'negative' : ''}`}>
                  {formatChange(row.change)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ExchangeRateTable
