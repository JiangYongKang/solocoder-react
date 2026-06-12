import { RELEASE_STATUS_LABEL, APPROVAL_ACTION_LABEL, RELEASE_STATUS_COLOR } from '../constants.js'
import { formatDate, getTimelineColor, getApprovalTimeline } from '../utils.js'

export default function ApprovalTimeline({ release }) {
  const records = getApprovalTimeline(release)

  return (
    <div className="rm-timeline-wrap">
      <h4 className="rm-timeline-title">审批记录时间线</h4>
      {records.length === 0 ? (
        <div className="rm-timeline-empty">暂无审批记录</div>
      ) : (
        <div className="rm-timeline">
          {records.map((record) => {
            const color = getTimelineColor(record.toStatus, record.action)
            return (
              <div key={record.id} className="rm-timeline-item">
                <div
                  className="rm-timeline-dot"
                  style={{
                    background: color,
                    boxShadow: `0 0 0 3px ${color}33`,
                  }}
                />
                <div className="rm-timeline-line" />
                <div className="rm-timeline-content">
                  <div className="rm-timeline-header">
                    <span className="rm-timeline-action" style={{ color }}>
                      {APPROVAL_ACTION_LABEL[record.action]}
                    </span>
                    <span className="rm-timeline-status-transition">
                      <span
                        className="rm-mini-tag"
                        style={{
                          background: (RELEASE_STATUS_COLOR[record.fromStatus] || '#6b7280') + '22',
                          color: RELEASE_STATUS_COLOR[record.fromStatus] || '#6b7280',
                        }}
                      >
                        {RELEASE_STATUS_LABEL[record.fromStatus]}
                      </span>
                      <span className="rm-arrow">→</span>
                      <span
                        className="rm-mini-tag"
                        style={{
                          background: (RELEASE_STATUS_COLOR[record.toStatus] || '#6b7280') + '22',
                          color: RELEASE_STATUS_COLOR[record.toStatus] || '#6b7280',
                        }}
                      >
                        {RELEASE_STATUS_LABEL[record.toStatus]}
                      </span>
                    </span>
                  </div>
                  <div className="rm-timeline-meta">
                    <span>操作人：{record.operator}</span>
                    <span>时间：{formatDate(record.timestamp)}</span>
                  </div>
                  {record.remark && <div className="rm-timeline-remark">{record.remark}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
