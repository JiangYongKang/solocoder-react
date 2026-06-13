import { getScoreColor, getScoreLabel } from './securityCenterCore.js'

export default function SecurityGauge({ score, breakdown, suggestions }) {
  const color = getScoreColor(score)
  const label = getScoreLabel(score)
  const radius = 70
  const stroke = 14
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, score))
  const offset = circumference - (progress / 100) * circumference

  const breakdownItems = [
    breakdown.password,
    breakdown.twoFA,
    breakdown.remoteLogin,
    breakdown.anomaly,
  ].filter(Boolean)

  return (
    <div>
      <div className="sc-section-header">
        <h2 className="sc-section-title">账户安全评分</h2>
        <span className="sc-gauge-level" style={{ background: color + '22', color }}>
          {label}
        </span>
      </div>

      <div className="sc-dashboard-layout">
        <div className="sc-gauge-container">
          <svg className="sc-gauge-svg" viewBox="0 0 220 220">
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth={stroke}
            />
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 110 110)"
              style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
            />
            <text x="110" y="105" textAnchor="middle" className="sc-gauge-score">
              {score}
            </text>
            <text x="110" y="130" textAnchor="middle" className="sc-gauge-label">
              安全评分
            </text>
          </svg>
        </div>

        <div className="sc-score-details">
          {breakdownItems.map((item, i) => (
            <div className="sc-score-item" key={i}>
              <span className="sc-score-item-label">{item.label}</span>
              <div className="sc-score-item-bar">
                <div
                  className="sc-score-item-fill"
                  style={{
                    width: `${(item.score / item.max) * 100}%`,
                    backgroundColor: item.score < item.max ? '#f59e0b' : '#10b981',
                  }}
                />
              </div>
              <span className="sc-score-item-value" style={{ color: item.score < item.max ? '#f59e0b' : '#10b981' }}>
                {item.score}/{item.max}
              </span>
            </div>
          ))}
        </div>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="sc-suggestions">
          <h3 className="sc-suggestions-title">安全建议</h3>
          {suggestions.map((s, i) => (
            <div key={i} className="sc-suggestion-item">
              <span
                className="sc-suggestion-icon"
                style={{
                  background: i === 0 ? '#ef4444' : '#f59e0b',
                }}
              >
                !
              </span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
