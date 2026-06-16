import { formatSize, hasNewerVersion, detectVersionConflict } from './packageUtils.js'

export default function PackageDetail({ pkg, onClose, onUpgrade }) {
  if (!pkg) {
    return (
      <div className="pm-detail-panel">
        <div className="pm-detail-empty">
          <div className="pm-detail-empty-icon">📦</div>
          <div className="pm-detail-empty-text">点击包节点查看详情</div>
        </div>
      </div>
    )
  }

  const hasConflict = detectVersionConflict(pkg.installedVersion, pkg.versionRange)
  const upgradable = hasNewerVersion(pkg.installedVersion || pkg.version, pkg.latestVersion)

  return (
    <div className="pm-detail-panel">
      <div className="pm-detail-header">
        <h3 className="pm-detail-title">{pkg.name}</h3>
        <button type="button" className="pm-detail-close" onClick={onClose}>×</button>
      </div>

      <div className="pm-detail-body">
        <div className="pm-detail-section">
          <div className="pm-detail-label">当前版本</div>
          <div className="pm-detail-value pm-installed-version">
            {pkg.installedVersion || pkg.version}
          </div>
        </div>

        <div className="pm-detail-section">
          <div className="pm-detail-label">版本范围</div>
          <div className="pm-detail-value">
            <span className="pm-range">{pkg.versionRange}</span>
            {hasConflict && <span className="pm-badge pm-badge-conflict">版本冲突</span>}
          </div>
        </div>

        <div className="pm-detail-section">
          <div className="pm-detail-label">最新版本</div>
          <div className="pm-detail-value">
            <span className="pm-latest-version">{pkg.latestVersion}</span>
            {upgradable && <span className="pm-badge pm-badge-upgradable">可升级</span>}
          </div>
        </div>

        <div className="pm-detail-section">
          <div className="pm-detail-label">协议</div>
          <div className="pm-detail-value">{pkg.license || '-'}</div>
        </div>

        <div className="pm-detail-section">
          <div className="pm-detail-label">大小</div>
          <div className="pm-detail-value">{formatSize(pkg.size)}</div>
        </div>

        <div className="pm-detail-section">
          <div className="pm-detail-label">子依赖</div>
          <div className="pm-detail-value">
            {pkg.dependencies && pkg.dependencies.length > 0
              ? `${pkg.dependencies.length} 个`
              : '无'}
          </div>
        </div>

        {pkg.dependencies && pkg.dependencies.length > 0 && (
          <div className="pm-detail-section">
            <div className="pm-detail-label">子依赖列表</div>
            <div className="pm-subdeps-list">
              {pkg.dependencies.map((dep) => (
                <div key={dep.name} className="pm-subdep-item">
                  <span className="pm-subdep-name">{dep.name}</span>
                  <span className="pm-subdep-version">{dep.installedVersion || dep.version}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {upgradable && (
        <div className="pm-detail-footer">
          <button
            type="button"
            className="pm-btn pm-btn-primary pm-btn-block"
            onClick={() => onUpgrade && onUpgrade(pkg)}
          >
            升级到 {pkg.latestVersion}
          </button>
        </div>
      )}
    </div>
  )
}
