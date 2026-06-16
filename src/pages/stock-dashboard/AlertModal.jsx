import { useState, useEffect } from 'react'
import { ALERT_TYPE_UPPER, ALERT_TYPE_LOWER } from './constants'

const AlertModal = ({ isOpen, onClose, onSave, stock, currentPrice }) => {
  const [type, setType] = useState(ALERT_TYPE_UPPER)
  const [targetPrice, setTargetPrice] = useState('')
  const [notify, setNotify] = useState(true)

  useEffect(() => {
    if (isOpen && currentPrice) {
      setTargetPrice(currentPrice.toFixed(2))
    }
  }, [isOpen, currentPrice])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const price = parseFloat(targetPrice)
    if (isNaN(price) || price <= 0) {
      alert('请输入有效的预警价格')
      return
    }
    onSave({
      type,
      targetPrice: price,
      notify,
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">设置价格预警 - {stock?.name} ({stock?.code})</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">预警类型</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value={ALERT_TYPE_UPPER}>价格上限（涨破触发）</option>
              <option value={ALERT_TYPE_LOWER}>价格下限（跌破触发）</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">预警价格</label>
            <input
              type="number"
              className="form-input"
              step="0.01"
              min="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="请输入预警价格"
            />
          </div>

          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
              />
              触发时弹出通知
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AlertModal
