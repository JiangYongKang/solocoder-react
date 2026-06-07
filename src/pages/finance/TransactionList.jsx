import { TRANSACTION_TYPES, CATEGORY_MAP } from './constants'
import { formatCurrency } from './utils'

const TransactionList = ({ items, onEdit, onDelete }) => {
  if (items.length === 0) {
    return <div className="empty-state">暂无记录，快去添加第一笔吧～</div>
  }

  return (
    <div className="transaction-list">
      {items.map((tx) => {
        const cat = CATEGORY_MAP[tx.category] || {}
        const sign = tx.type === TRANSACTION_TYPES.INCOME ? '+' : '-'
        return (
          <div key={tx.id} className="transaction-item">
            <div className="tx-icon">{cat.icon || '📝'}</div>
            <div className="tx-info">
              <div className="tx-category">{cat.label || tx.category}</div>
              <div className="tx-note">{tx.note || '—'}</div>
            </div>
            <div className="tx-date">{tx.date}</div>
            <div className={`tx-amount ${tx.type}`}>
              {sign}
              {formatCurrency(tx.amount)}
            </div>
            <div className="tx-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => onEdit(tx)}>
                编辑
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => onDelete(tx)}>
                删除
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TransactionList
