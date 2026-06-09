import { sanitizeHtml, formatFullDateTime } from './emailUtils'

export default function EmailDetail({ email, onReply, onForward }) {
  if (!email) {
    return (
      <div className="ec-detail-panel">
        <div className="ec-detail-empty">请选择一封邮件查看详情</div>
      </div>
    )
  }

  const senderName = email.from.match(/([^<]+)/)?.[1]?.trim() || email.from
  const initial = senderName.charAt(0).toUpperCase()

  return (
    <div className="ec-detail-panel">
      <div className="ec-detail-header">
        <h2 className="ec-detail-subject">{email.subject}</h2>
        <div className="ec-detail-meta">
          <div className="ec-detail-sender-info">
            <div className="ec-detail-avatar">{initial}</div>
            <div>
              <div className="ec-detail-sender">{email.from}</div>
              <div className="ec-detail-recipients">收件人: {email.to}</div>
            </div>
          </div>
          <div className="ec-detail-time">{formatFullDateTime(email.sentAt)}</div>
        </div>
      </div>
      <div
        className="ec-detail-body"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.body) }}
      />
      <div className="ec-detail-footer">
        <button type="button" className="ec-reply-btn" onClick={onReply}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 17 4 12 9 7" />
            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
          </svg>
          回复
        </button>
        <button type="button" className="ec-forward-btn" onClick={onForward}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 17 20 12 15 7" />
            <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
          </svg>
          转发
        </button>
      </div>
    </div>
  )
}
