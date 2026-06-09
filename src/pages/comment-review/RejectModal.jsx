import { useState } from 'react'
import { REJECT_REASONS } from './constants'

export default function RejectModal({
  open,
  onConfirm,
  onCancel,
  commentCount = 1,
}) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customDetail, setCustomDetail] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  const resetState = () => {
    setSelectedReason('')
    setCustomDetail('')
    setError('')
  }

  const handleCancel = () => {
    resetState()
    onCancel && onCancel()
  }

  const handleConfirm = () => {
    if (!selectedReason) {
      setError('请选择驳回原因')
      return
    }
    if (selectedReason === 'other' && !customDetail.trim()) {
      setError('请填写自定义驳回原因')
      return
    }
    const detail = selectedReason === 'other' ? customDetail.trim() : ''
    onConfirm && onConfirm(selectedReason, detail)
    resetState()
  }

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {commentCount > 1 ? `批量驳回评论（${commentCount}条）` : '驳回评论'}
          </h3>
          <button className="modal-close" onClick={handleCancel}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label className="form-label">
              选择驳回原因 <span className="required">*</span>
            </label>
            <div className="reject-reason-list">
              {REJECT_REASONS.map((reason) => (
                <div
                  key={reason.key}
                  className={`reject-reason-option ${selectedReason === reason.key ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedReason(reason.key)
                    setError('')
                  }}
                >
                  <input
                    type="radio"
                    checked={selectedReason === reason.key}
                    onChange={() => {
                      setSelectedReason(reason.key)
                      setError('')
                    }}
                  />
                  <span className="option-label">{reason.label}</span>
                </div>
              ))}
            </div>
            {selectedReason === 'other' && (
              <div className="custom-reason-input">
                <textarea
                  className="form-input form-textarea"
                  rows={3}
                  placeholder="请填写具体驳回原因..."
                  value={customDetail}
                  onChange={(e) => {
                    setCustomDetail(e.target.value)
                    if (error) setError('')
                  }}
                />
              </div>
            )}
            {error && <div className="form-error">{error}</div>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleCancel}>
            取消
          </button>
          <button className="btn btn-danger" onClick={handleConfirm}>
            确认驳回
          </button>
        </div>
      </div>
    </div>
  )
}
