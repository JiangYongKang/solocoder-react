import { formatDate } from './packageUtils.js'

export default function OperationHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="pm-history-container">
        <div className="pm-history-header">
          <h3>操作历史</h3>
        </div>
        <div className="pm-empty">暂无操作记录</div>
      </div>
    )
  }

  return (
    <div className="pm-history-container">
      <div className="pm-history-header">
        <h3>操作历史</h3>
        <span className="pm-history-count">{history.length} 条记录</span>
      </div>
      <div className="pm-history-list">
        {history.map((item) => (
          <div key={item.id} className="pm-history-item">
            <div className="pm-history-type">
              {item.type === 'upgrade' ? '⬆️ 升级' : '📦 安装'}
            </div>
            <div className="pm-history-content">
              <div className="pm-history-summary">
                <span className="pm-history-count-tag">{item.packageCount} 个包</span>
                <span className="pm-history-desc">{item.summary}</span>
              </div>
              <div className="pm-history-time">{formatDate(item.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
