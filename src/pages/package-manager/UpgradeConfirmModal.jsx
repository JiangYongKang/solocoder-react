export default function UpgradeConfirmModal({ isOpen, upgrades, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="pm-modal-overlay" onClick={onCancel}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-header">
          <h3 className="pm-modal-title">确认升级</h3>
          <button type="button" className="pm-modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="pm-modal-body">
          <p className="pm-modal-desc">
            即将升级 <strong>{upgrades.length}</strong> 个包，请确认以下变更：
          </p>
          <div className="pm-upgrade-confirm-list">
            {upgrades.map((item) => (
              <div key={item.name} className="pm-upgrade-confirm-item">
                <span className="pm-upgrade-confirm-name">{item.name}</span>
                <div className="pm-upgrade-confirm-versions">
                  <span className="pm-version-old">{item.currentVersion}</span>
                  <span className="pm-arrow">→</span>
                  <span className="pm-version-new">{item.targetVersion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pm-modal-footer">
          <button
            type="button"
            className="pm-btn pm-btn-secondary"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="button"
            className="pm-btn pm-btn-primary"
            onClick={onConfirm}
          >
            确认升级
          </button>
        </div>
      </div>
    </div>
  )
}
