import { useState } from 'react'
import {
  CUSTOMER_STATUS_LABEL,
  CUSTOMER_STATUS_COLOR,
  FOLLOWUP_METHODS,
  USERS,
} from './constants.js'
import {
  formatDate,
  validateFollowup,
} from './utils.js'

function getOwnerInfo(ownerId) {
  if (!ownerId) {
    return { name: '公海', avatar: '海', isPool: true }
  }
  const user = USERS.find((u) => u.id === ownerId)
  if (user) {
    return { name: user.name, avatar: user.avatar, isPool: false }
  }
  return { name: '未知', avatar: '?', isPool: false }
}

export default function CustomerDetail({
  customer,
  followups,
  onBack,
  onEdit,
  onDelete,
  onClaim,
  onRelease,
  onTransfer,
  onAddFollowup,
  currentUserId,
}) {
  const [showFollowupForm, setShowFollowupForm] = useState(false)
  const [followupData, setFollowupData] = useState({
    method: FOLLOWUP_METHODS[0],
    content: '',
    result: '',
  })
  const [followupErrors, setFollowupErrors] = useState({})

  const owner = getOwnerInfo(customer.ownerId)
  const isOwner = customer.ownerId === currentUserId
  const isPool = !customer.ownerId

  const handleAddFollowup = (e) => {
    e.preventDefault()
    const errors = validateFollowup(followupData)
    setFollowupErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }
    const result = onAddFollowup(followupData)
    if (result && result.success) {
      setFollowupData({ method: FOLLOWUP_METHODS[0], content: '', result: '' })
      setShowFollowupForm(false)
      setFollowupErrors({})
    } else if (result && result.errors) {
      setFollowupErrors(result.errors)
    }
  }

  return (
    <div className="detail-page">
      <div>
        <div className="detail-card">
          <div className="detail-header">
            <button className="detail-back" onClick={onBack}>
              ← 返回列表
            </button>
          </div>
          <h2 className="detail-name">{customer.name}</h2>
          <p className="detail-company">{customer.company || '暂无公司信息'}</p>
          <ul className="detail-info-list">
            <li className="detail-info-item">
              <span className="detail-info-label">联系电话</span>
              <span className="detail-info-value">{customer.phone}</span>
            </li>
            <li className="detail-info-item">
              <span className="detail-info-label">邮箱</span>
              <span className="detail-info-value">{customer.email || '-'}</span>
            </li>
            <li className="detail-info-item">
              <span className="detail-info-label">客户来源</span>
              <span className="detail-info-value">
                <span className="source-tag">{customer.source}</span>
              </span>
            </li>
            <li className="detail-info-item">
              <span className="detail-info-label">客户状态</span>
              <span className="detail-info-value">
                <span
                  className="status-tag"
                  style={{
                    background: `${CUSTOMER_STATUS_COLOR[customer.status]}20`,
                    color: CUSTOMER_STATUS_COLOR[customer.status],
                  }}
                >
                  {CUSTOMER_STATUS_LABEL[customer.status]}
                </span>
              </span>
            </li>
            <li className="detail-info-item">
              <span className="detail-info-label">归属人</span>
              <span className="detail-info-value">
                <span className="owner-badge">
                  <span className={`owner-avatar ${owner.isPool ? 'pool' : ''}`}>
                    {owner.avatar}
                  </span>
                  {owner.name}
                </span>
              </span>
            </li>
            <li className="detail-info-item">
              <span className="detail-info-label">创建时间</span>
              <span className="detail-info-value">{formatDate(customer.createdAt)}</span>
            </li>
            {customer.remark && (
              <li className="detail-info-item">
                <span className="detail-info-label">备注</span>
                <span className="detail-info-value">{customer.remark}</span>
              </li>
            )}
          </ul>
          <div className="detail-actions">
            {(isOwner || isPool) && (
              <button className="btn btn-sm btn-secondary" onClick={onEdit}>
                编辑
              </button>
            )}
            {isPool && (
              <button className="btn btn-sm btn-primary" onClick={onClaim}>
                领取客户
              </button>
            )}
            {isOwner && (
              <>
                <button className="btn btn-sm btn-secondary" onClick={onTransfer}>
                  转移
                </button>
                <button className="btn btn-sm" onClick={onRelease}>
                  释放到公海
                </button>
              </>
            )}
            {(isOwner || isPool) && (
              <button className="btn btn-sm btn-danger" onClick={onDelete}>
                删除
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="timeline-section">
        <div className="timeline-header">
          <h3 className="timeline-title">跟进记录</h3>
          {(isOwner || isPool) && (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setShowFollowupForm(!showFollowupForm)}
            >
              {showFollowupForm ? '取消' : '+ 添加跟进'}
            </button>
          )}
        </div>

        {showFollowupForm && (isOwner || isPool) && (
          <form
            className="followup-form"
            style={{ marginBottom: 24, padding: 16, background: 'var(--code-bg)', borderRadius: 8 }}
            onSubmit={handleAddFollowup}
          >
            <div className="form-grid">
              <div className="form-row">
                <label className="form-label">
                  跟进方式<span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={followupData.method}
                  onChange={(e) =>
                    setFollowupData((prev) => ({ ...prev, method: e.target.value }))
                  }
                >
                  {FOLLOWUP_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                {followupErrors.method && (
                  <span className="form-error">{followupErrors.method}</span>
                )}
              </div>
              <div className="form-row">
                <label className="form-label">跟进结果</label>
                <input
                  type="text"
                  className="form-input"
                  value={followupData.result}
                  onChange={(e) =>
                    setFollowupData((prev) => ({ ...prev, result: e.target.value }))
                  }
                  placeholder="请输入跟进结果"
                />
              </div>
            </div>
            <div className="form-row">
              <label className="form-label">
                跟进内容<span className="required">*</span>
              </label>
              <textarea
                className={`form-textarea ${followupErrors.content ? 'has-error' : ''}`}
                value={followupData.content}
                onChange={(e) =>
                  setFollowupData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="请输入跟进内容"
              />
              {followupErrors.content && (
                <span className="form-error">{followupErrors.content}</span>
              )}
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowFollowupForm(false)
                  setFollowupData({ method: FOLLOWUP_METHODS[0], content: '', result: '' })
                  setFollowupErrors({})
                }}
              >
                取消
              </button>
              <button type="submit" className="btn btn-sm btn-primary">
                保存跟进
              </button>
            </div>
          </form>
        )}

        {followups && followups.length > 0 ? (
          <div className="timeline">
            {followups.map((item) => (
              <div key={item.id} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-time">{formatDate(item.createdAt)}</div>
                <span className="timeline-method">{item.method}</span>
                <div className="timeline-content">{item.content}</div>
                {item.result && <div className="timeline-result">结果：{item.result}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">暂无跟进记录</div>
        )}
      </div>
    </div>
  )
}
