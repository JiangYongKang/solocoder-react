export default function UpgradePanel({ upgrades, onRemove, onClear }) {
  if (!upgrades || upgrades.length === 0) {
    return (
      <div className="pm-upgrade-panel">
        <div className="pm-upgrade-header">
          <h3>待升级列表</h3>
          <span className="pm-upgrade-count">0 个包</span>
        </div>
        <div className="pm-empty">暂未选择要升级的包</div>
      </div>
    )
  }

  return (
    <div className="pm-upgrade-panel">
      <div className="pm-upgrade-header">
        <h3>待升级列表</h3>
        <div className="pm-upgrade-actions">
          <span className="pm-upgrade-count">{upgrades.length} 个包</span>
          <button type="button" className="pm-btn pm-btn-xs pm-btn-danger" onClick={onClear}>
            清空
          </button>
        </div>
      </div>
      <div className="pm-upgrade-list">
        {upgrades.map((item) => (
          <div key={item.name} className="pm-upgrade-item">
            <div className="pm-upgrade-info">
              <div className="pm-upgrade-name">{item.name}</div>
              <div className="pm-upgrade-versions">
              <span className="pm-version-old">{item.currentVersion}</span>
              <span className="pm-arrow">→</span>
              <span className="pm-version-new">{item.targetVersion}</span>
            </div>
            </div>
            <button
              type="button"
              className="pm-upgrade-remove"
              onClick={() => onRemove(item.name)}
              title="移除"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
