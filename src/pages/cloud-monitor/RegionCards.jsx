import { formatCost } from './utils'

const RegionCards = ({ regionData, selectedRegion, onSelectRegion }) => {
  return (
    <div>
      <div className="cm-region-filter-row">
        <button
          className={`cm-btn${selectedRegion === 'all' ? ' active' : ''}`}
          onClick={() => onSelectRegion('all')}
        >
          全部地域
        </button>
      </div>
      <div className="cm-region-grid">
        {regionData.map((r) => (
          <div
            key={r.id}
            className={`cm-region-card${selectedRegion === r.id ? ' selected' : ''}`}
            style={{ background: r.bg, color: r.color }}
            onClick={() => onSelectRegion(selectedRegion === r.id ? 'all' : r.id)}
          >
            {r.alerts > 0 && (
              <div className="cm-region-alert-badge">{r.alerts}</div>
            )}
            <div className="cm-region-name">{r.name}</div>
            <div className="cm-region-stat">
              <span>运行实例</span>
              <span className="cm-region-stat-val">{r.instances}</span>
            </div>
            <div className="cm-region-stat">
              <span>告警数</span>
              <span className="cm-region-stat-val" style={{ color: r.alerts > 0 ? '#ef4444' : 'inherit' }}>
                {r.alerts}
              </span>
            </div>
            <div className="cm-region-stat">
              <span>本月费用</span>
              <span className="cm-region-stat-val">{formatCost(r.cost)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RegionCards
