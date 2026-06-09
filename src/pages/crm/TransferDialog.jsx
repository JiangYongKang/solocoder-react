import { useState } from 'react'
import { USERS } from './constants.js'

export default function TransferDialog({
  open,
  customer,
  currentUserId,
  onConfirm,
  onCancel,
}) {
  const [targetUserId, setTargetUserId] = useState('')

  if (!open || !customer) return null

  const handleConfirm = () => {
    if (targetUserId) {
      onConfirm(targetUserId)
      setTargetUserId('')
    }
  }

  const handleCancel = () => {
    setTargetUserId('')
    onCancel()
  }

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">转移客户</h3>
          <button className="modal-close" onClick={handleCancel}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="confirm-message">
            将客户「<strong>{customer.name}</strong>」转移给其他用户：
          </p>
          <div className="form-row">
            <label className="form-label">选择目标用户</label>
            <select
              className="form-select transfer-dialog-user"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
            >
              <option value="">请选择用户</option>
              {USERS.filter((u) => u.id !== currentUserId).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions" style={{ marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={handleCancel}>
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={!targetUserId}
            >
              确认转移
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
