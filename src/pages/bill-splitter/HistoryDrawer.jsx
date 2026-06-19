import { useState } from 'react'
import { formatDateTime } from './utils'
import { formatCurrency } from './constants'

export function SaveModal({ open, onClose, onSave, initialName }) {
  const [name, setName] = useState(initialName)

  if (!open) return null

  const handleSave = () => {
    const finalName = name.trim() || initialName
    onSave(finalName)
    setName('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">保存账单</h3>
        <div className="form-group">
          <label className="form-label">账单名称</label>
          <input
            type="text"
            className="form-input"
            placeholder="如：2024-03-15 聚餐"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            maxLength={50}
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HistoryDrawer({
  open,
  onClose,
  history,
  onRestore,
  onDelete,
}) {
  return (
    <>
      <div
        className={`drawer-backdrop ${open ? 'open' : ''}`}
        onClick={onClose}
      />
      <aside className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3 className="drawer-title">历史记录</h3>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>
        <div className="drawer-body">
          {history.length === 0 ? (
            <div className="empty-hint">还没有历史记录，保存当前账单后会出现在这里</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((bill) => (
                <div key={bill.id} className="history-card">
                  <div className="history-card-header">
                    <div>
                      <div
                        className="history-name"
                        onClick={() => {
                          onRestore(bill)
                          onClose()
                        }}
                        title="点击恢复此账单"
                      >
                        {bill.name}
                      </div>
                      <div className="history-time">{formatDateTime(bill.savedAt)}</div>
                    </div>
                  </div>
                  <div className="history-stats">
                    <div>
                      参与人数：
                      <span className="history-stat-value">{bill.participantCount}</span>
                    </div>
                    <div>
                      总金额：
                      <span className="history-stat-value">
                        {formatCurrency(bill.totalAmount)}
                      </span>
                    </div>
                  </div>
                  <div className="history-card-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        onRestore(bill)
                        onClose()
                      }}
                    >
                      恢复
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => onDelete(bill.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
