import { useMemo } from 'react'
import { ALERT_STATUS } from './constants'
import {
  confirmAlertRecord,
  confirmAllAlertRecords,
  exportAlertRecordsToCsv,
  downloadCsv,
  formatDateTime,
  sortAlertRecords,
} from './utils'

function AlertHistoryPanel({ alertRecords, onRecordsChange }) {
  const sortedRecords = useMemo(
    () => sortAlertRecords(alertRecords, 'triggeredAt', 'desc'),
    [alertRecords]
  )

  const pendingCount = sortedRecords.filter(
    (r) => r.status === ALERT_STATUS.PENDING
  ).length

  const handleConfirm = (recordId) => {
    const result = confirmAlertRecord(alertRecords, recordId)
    if (result.success) {
      onRecordsChange(result.records)
    }
  }

  const handleConfirmAll = () => {
    const result = confirmAllAlertRecords(alertRecords)
    if (result.success) {
      onRecordsChange(result.records)
    }
  }

  const handleExport = () => {
    const csv = exportAlertRecordsToCsv(sortedRecords)
    if (!csv) return
    const now = new Date()
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
    downloadCsv(csv, `告警记录_${ts}.csv`)
  }

  return (
    <div className="alert-history-panel">
      <div className="alert-history-header">
        <div className="alert-history-title-row">
          <h3 className="alert-history-title">告警历史记录</h3>
          {pendingCount > 0 && (
            <span className="alert-pending-badge">
              {pendingCount} 条待确认
            </span>
          )}
        </div>
        <div className="alert-history-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleConfirmAll}
            disabled={pendingCount === 0}
          >
            全部确认
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleExport}
            disabled={sortedRecords.length === 0}
          >
            导出记录
          </button>
        </div>
      </div>

      <div className="alert-history-summary">
        共 {sortedRecords.length} 条记录
        {' · '}
        待确认 {pendingCount} 条
        {' · '}
        已确认 {sortedRecords.length - pendingCount} 条
      </div>

      <div className="alert-history-list">
        {sortedRecords.length === 0 ? (
          <div className="alert-history-empty">
            暂无告警记录
          </div>
        ) : (
          <table className="alert-history-table">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>触发时间</th>
                <th style={{ width: '25%' }}>规则描述</th>
                <th style={{ width: '25%' }}>触发信息</th>
                <th style={{ width: '12%' }}>状态</th>
                <th style={{ width: '10%' }}>确认时间</th>
                <th style={{ width: '10%' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((record) => {
                const isPending = record.status === ALERT_STATUS.PENDING
                return (
                  <tr
                    key={record.id}
                    className={isPending ? 'alert-row-pending' : ''}
                  >
                    <td className="alert-time-cell">
                      {formatDateTime(record.triggeredAt)}
                    </td>
                    <td className="alert-rule-cell">
                      <span className="alert-rule-desc">
                        {record.ruleDescription}
                      </span>
                    </td>
                    <td className="alert-info-cell">
                      <code className="alert-trigger-info">
                        {record.triggerInfo}
                      </code>
                    </td>
                    <td className="alert-status-cell">
                      {isPending ? (
                        <span className="alert-status-badge pending">
                          待确认
                        </span>
                      ) : (
                        <span className="alert-status-badge confirmed">
                          已确认
                        </span>
                      )}
                    </td>
                    <td className="alert-confirm-cell">
                      {record.confirmedAt
                        ? formatDateTime(record.confirmedAt)
                        : '-'}
                    </td>
                    <td className="alert-action-cell">
                      {isPending ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleConfirm(record.id)}
                        >
                          确认
                        </button>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AlertHistoryPanel
