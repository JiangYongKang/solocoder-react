import { formatPrice } from './stockUtils'
import {
  ALERT_TYPE_UPPER,
  ALERT_STATUS_ENABLED,
  ALERT_STATUS_TRIGGERED,
  ALERT_STATUS_DISABLED,
} from './constants'

const AlertPanel = ({ alerts, onEnable, onDisable, onDelete }) => {
  const getStatusLabel = (status) => {
    switch (status) {
      case ALERT_STATUS_ENABLED:
        return '启用中'
      case ALERT_STATUS_TRIGGERED:
        return '已触发'
      case ALERT_STATUS_DISABLED:
        return '已停用'
      default:
        return status
    }
  }

  const getTypeLabel = (type) => {
    return type === ALERT_TYPE_UPPER ? '上限' : '下限'
  }

  if (alerts.length === 0) {
    return (
      <div className="alert-sidebar">
        <h3 className="alert-sidebar-title">价格预警</h3>
        <div className="empty-state" style={{ padding: '20px 0' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.5 }}>🔔</div>
          <div style={{ fontSize: '12px' }}>暂无预警</div>
        </div>
      </div>
    )
  }

  return (
    <div className="alert-sidebar">
      <h3 className="alert-sidebar-title">价格预警 ({alerts.length})</h3>
      <div className="alert-list">
        {alerts.map((alert) => (
          <div key={alert.id} className="alert-item">
            <div className="alert-item-header">
              <span className="alert-stock-name">
                {alert.stockName} ({alert.stockCode})
              </span>
              <span className={`alert-status ${alert.status}`}>
                {getStatusLabel(alert.status)}
              </span>
            </div>
            <div className="alert-item-body">
              {getTypeLabel(alert.type)}: {formatPrice(alert.targetPrice)}
            </div>
            <div className="alert-item-actions">
              {alert.status === ALERT_STATUS_ENABLED ? (
                <button
                  className="alert-action-btn"
                  onClick={() => onDisable(alert.id)}
                >
                  停用
                </button>
              ) : (
                <button
                  className="alert-action-btn"
                  onClick={() => onEnable(alert.id)}
                >
                  启用
                </button>
              )}
              <button
                className="alert-action-btn"
                onClick={() => onDelete(alert.id)}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AlertPanel
