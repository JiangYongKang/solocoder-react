import { useState } from 'react'
import {
  APPROVAL_ACTION,
  APPROVAL_ACTION_LABEL,
} from '../constants.js'
import { actionRequiresRemark } from '../utils.js'

export default function ApprovalActionModal({ open, action, release, onClose, onConfirm }) {
  const [remark, setRemark] = useState('')
  const [localError, setLocalError] = useState('')

  if (!open || !action) return null

  const requiresRemark = actionRequiresRemark(action)
  const isReject = action === APPROVAL_ACTION.REJECT
  const isRollback = action === APPROVAL_ACTION.ROLLBACK
  const isApprove = action === APPROVAL_ACTION.APPROVE
  const isSubmit = action === APPROVAL_ACTION.SUBMIT

  const handleConfirm = () => {
    if (requiresRemark && !remark.trim()) {
      setLocalError(isReject ? '请填写驳回原因' : '请填写回滚原因')
      return
    }
    onConfirm(remark)
  }

  const renderContent = () => {
    if (isSubmit) {
      return (
        <div>
          <p>确认将版本 <strong>{release?.version} - {release?.title}</strong> 提交审核？</p>
          <p className="rm-hint-text">提交后状态将变为「待审核」，版本内容将不可编辑。</p>
          <div className="rm-form-item">
            <label className="rm-form-label">备注（选填）</label>
            <textarea
              className="rm-textarea"
              rows={3}
              placeholder="可填写提交说明..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
        </div>
      )
    }
    if (isApprove) {
      return (
        <div>
          <p>确认审核通过版本 <strong>{release?.version} - {release?.title}</strong>？</p>
          <p className="rm-hint-text">审核通过后版本将正式发布。</p>
          <div className="rm-form-item">
            <label className="rm-form-label">审核意见（选填）</label>
            <textarea
              className="rm-textarea"
              rows={3}
              placeholder="可填写审核意见..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
        </div>
      )
    }
    if (isReject) {
      return (
        <div>
          <p>确认驳回版本 <strong>{release?.version} - {release?.title}</strong>？</p>
          <p className="rm-hint-text">驳回后状态将退回为「草稿」，请务必填写驳回原因以便开发者修改。</p>
          <div className="rm-form-item">
            <label className="rm-form-label">
              驳回原因 <span className="rm-required">*</span>
            </label>
            <textarea
              className={`rm-textarea ${localError ? 'error' : ''}`}
              rows={4}
              placeholder="请详细填写驳回原因..."
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value)
                if (localError && e.target.value.trim()) setLocalError('')
              }}
            />
            {localError && <div className="rm-form-error">{localError}</div>}
          </div>
        </div>
      )
    }
    if (isRollback) {
      return (
        <div>
          <p style={{ color: '#dc2626' }}>
            <strong>⚠️ 警告：此操作不可撤销！</strong>
          </p>
          <p>确认回滚已发布版本 <strong>{release?.version} - {release?.title}</strong>？</p>
          <p className="rm-hint-text">回滚后状态将变为「已回滚」，该版本不能再进行任何操作。</p>
          <div className="rm-form-item">
            <label className="rm-form-label">
              回滚原因 <span className="rm-required">*</span>
            </label>
            <textarea
              className={`rm-textarea ${localError ? 'error' : ''}`}
              rows={4}
              placeholder="请详细填写回滚原因..."
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value)
                if (localError && e.target.value.trim()) setLocalError('')
              }}
            />
            {localError && <div className="rm-form-error">{localError}</div>}
          </div>
        </div>
      )
    }
    return null
  }

  const confirmBtnClass = isRollback || isReject ? 'rm-btn rm-btn-danger' : 'rm-btn rm-btn-success'

  return (
    <div className="rm-modal-overlay" onClick={onClose}>
      <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rm-modal-header">
          <h3>确认{APPROVAL_ACTION_LABEL[action]}</h3>
          <button className="rm-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="rm-modal-body">{renderContent()}</div>
        <div className="rm-modal-footer">
          <button type="button" className="rm-btn rm-btn-default" onClick={onClose}>
            取消
          </button>
          <button type="button" className={confirmBtnClass} onClick={handleConfirm}>
            确认{APPROVAL_ACTION_LABEL[action]}
          </button>
        </div>
      </div>
    </div>
  )
}
