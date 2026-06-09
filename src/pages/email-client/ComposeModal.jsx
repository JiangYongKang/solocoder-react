import { useState } from 'react'
import { validateEmailInput } from './emailUtils'

export default function ComposeModal({ visible, initialData, onClose, onSend, onSaveDraft }) {
  const [to, setTo] = useState(() => initialData?.to || '')
  const [subject, setSubject] = useState(() => initialData?.subject || '')
  const [body, setBody] = useState(() => initialData?.body || '')
  const [errors, setErrors] = useState({})

  if (!visible) return null

  const handleSend = () => {
    const validationErrors = validateEmailInput({ to, subject })
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    onSend({ to, subject, body })
  }

  const handleSaveDraft = () => {
    onSaveDraft({ to, subject, body, id: initialData?.id })
  }

  return (
    <div className="ec-modal-overlay" onClick={onClose}>
      <div className="ec-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ec-modal-header">
          <h3 className="ec-modal-title">写邮件</h3>
          <button type="button" className="ec-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="ec-compose-body">
          <div className="ec-form-row">
            <label className="ec-form-label">收件人</label>
            <input
              type="text"
              className={`ec-form-input ${errors.to ? 'error' : ''}`}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="请输入收件人邮箱，多个用逗号分隔"
            />
            {errors.to && <div className="ec-form-error">{errors.to}</div>}
          </div>
          <div className="ec-form-row">
            <label className="ec-form-label">主题</label>
            <input
              type="text"
              className={`ec-form-input ${errors.subject ? 'error' : ''}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="请输入主题"
            />
            {errors.subject && <div className="ec-form-error">{errors.subject}</div>}
          </div>
          <div className="ec-form-row">
            <label className="ec-form-label">正文</label>
            <textarea
              className="ec-form-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="请输入邮件正文..."
            />
          </div>
        </div>
        <div className="ec-modal-footer">
          <button type="button" className="ec-cancel-btn" onClick={handleSaveDraft}>
            保存草稿
          </button>
          <button type="button" className="ec-cancel-btn" onClick={onClose}>
            取消
          </button>
          <button type="button" className="ec-send-btn" onClick={handleSend}>
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
