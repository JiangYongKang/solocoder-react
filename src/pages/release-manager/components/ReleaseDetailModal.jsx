import { useMemo } from 'react'
import {
  RELEASE_STATUS_LABEL,
  RELEASE_STATUS_COLOR,
  APPROVAL_ACTION,
  APPROVAL_ACTION_LABEL,
} from '../constants.js'
import {
  formatDate,
  simpleMarkdownToHtml,
  getStatusActions,
} from '../utils.js'
import ApprovalTimeline from './ApprovalTimeline.jsx'

export default function ReleaseDetailModal({ open, release, onClose, onEdit, onApprovalAction }) {
  const changelogHtml = useMemo(
    () => (release ? simpleMarkdownToHtml(release.changelog || '') : ''),
    [release?.changelog]
  )
  const actions = release ? getStatusActions(release) : []

  if (!open || !release) return null

  return (
    <div className="rm-modal-overlay" onClick={onClose}>
      <div className="rm-modal rm-modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="rm-modal-header">
          <div className="rm-detail-header">
            <h3>
              <span className="rm-version rm-version-lg">{release.version}</span>
              <span className="rm-detail-title">{release.title}</span>
            </h3>
            <span
              className="rm-status-tag rm-status-tag-lg"
              style={{
                background: RELEASE_STATUS_COLOR[release.status] + '22',
                color: RELEASE_STATUS_COLOR[release.status],
                borderColor: RELEASE_STATUS_COLOR[release.status],
              }}
            >
              {RELEASE_STATUS_LABEL[release.status]}
            </span>
          </div>
          <button className="rm-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="rm-modal-body rm-detail-body">
          <div className="rm-detail-meta">
            <div className="rm-meta-item">
              <span className="rm-meta-label">发布人：</span>
              <span>{release.publisher || '-'}</span>
            </div>
            <div className="rm-meta-item">
              <span className="rm-meta-label">发布日期：</span>
              <span>{release.releaseDate || '-'}</span>
            </div>
            <div className="rm-meta-item">
              <span className="rm-meta-label">创建时间：</span>
              <span>{formatDate(release.createdAt)}</span>
            </div>
            <div className="rm-meta-item">
              <span className="rm-meta-label">更新时间：</span>
              <span>{formatDate(release.updatedAt)}</span>
            </div>
          </div>

          <div className="rm-detail-section">
            <h4 className="rm-section-title">变更日志</h4>
            {release.changelog ? (
              <div
                className="rm-md-preview rm-md-preview-lg"
                dangerouslySetInnerHTML={{ __html: changelogHtml }}
              />
            ) : (
              <div className="rm-empty-block">该版本无变更日志</div>
            )}
          </div>

          <div className="rm-detail-section">
            <ApprovalTimeline release={release} />
          </div>
        </div>

        <div className="rm-modal-footer">
          {actions.includes(APPROVAL_ACTION.SUBMIT) && (
            <button
              className="rm-btn rm-btn-warn"
              onClick={() => onApprovalAction(release.id, APPROVAL_ACTION.SUBMIT)}
            >
              {APPROVAL_ACTION_LABEL[APPROVAL_ACTION.SUBMIT]}
            </button>
          )}
          {actions.includes(APPROVAL_ACTION.APPROVE) && (
            <button
              className="rm-btn rm-btn-success"
              onClick={() => onApprovalAction(release.id, APPROVAL_ACTION.APPROVE)}
            >
              {APPROVAL_ACTION_LABEL[APPROVAL_ACTION.APPROVE]}
            </button>
          )}
          {actions.includes(APPROVAL_ACTION.REJECT) && (
            <button
              className="rm-btn rm-btn-danger"
              onClick={() => onApprovalAction(release.id, APPROVAL_ACTION.REJECT)}
            >
              {APPROVAL_ACTION_LABEL[APPROVAL_ACTION.REJECT]}
            </button>
          )}
          {actions.includes(APPROVAL_ACTION.ROLLBACK) && (
            <button
              className="rm-btn rm-btn-danger"
              onClick={() => onApprovalAction(release.id, APPROVAL_ACTION.ROLLBACK)}
            >
              {APPROVAL_ACTION_LABEL[APPROVAL_ACTION.ROLLBACK]}
            </button>
          )}
          <div style={{ flex: 1 }} />
          {release.status === 'draft' && (
            <button className="rm-btn rm-btn-default" onClick={() => onEdit(release)}>
              编辑
            </button>
          )}
          <button className="rm-btn rm-btn-default" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
