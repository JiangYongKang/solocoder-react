import { useState, useEffect, useRef } from 'react'
import { ALERT_LEVELS, ALERT_LEVEL_CONFIG, SILENCE_DURATION } from './constants'
import { filterAlertsByLevel, formatTimeAgo } from './utils'

const AlertList = ({ alerts, onSilenceChange }) => {
  const [filterLevel, setFilterLevel] = useState('all')
  const [silenced, setSilenced] = useState(false)
  const [silenceEnd, setSilenceEnd] = useState(null)
  const [silenceRemaining, setSilenceRemaining] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (silenced && silenceEnd) {
      const update = () => {
        const remaining = Math.max(0, Math.ceil((silenceEnd - Date.now()) / 60000))
        setSilenceRemaining(remaining)
        if (remaining <= 0) {
          setSilenced(false)
          setSilenceEnd(null)
          onSilenceChange(false)
        }
      }
      update()
      timerRef.current = setInterval(update, 1000)
      return () => clearInterval(timerRef.current)
    }
  }, [silenced, silenceEnd, onSilenceChange])

  const displaySilenceRemaining = silenced ? silenceRemaining : 0

  const handleSilence = () => {
    if (silenced) {
      setSilenced(false)
      setSilenceEnd(null)
      onSilenceChange(false)
    } else {
      const end = Date.now() + SILENCE_DURATION
      setSilenced(true)
      setSilenceEnd(end)
      onSilenceChange(true)
    }
  }

  const displayAlerts = filterAlertsByLevel(alerts, filterLevel)

  return (
    <div>
      <div className="cm-alert-header">
        <div className="cm-alert-header-left">
          <span className="cm-section-title" style={{ margin: 0 }}>实时告警</span>
          <span className="cm-alert-count-badge">{alerts.length}</span>
        </div>
        <button
          className={`cm-silence-btn${silenced ? ' silenced' : ''}`}
          onClick={handleSilence}
        >
          {silenced ? `静默中 ${displaySilenceRemaining}min` : '静默告警'}
        </button>
      </div>
      <div className="cm-alert-filters">
        <button
          className={`cm-alert-filter-btn${filterLevel === 'all' ? ' active' : ''}`}
          onClick={() => setFilterLevel('all')}
        >
          全部
        </button>
        {Object.entries(ALERT_LEVEL_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            className={`cm-alert-filter-btn${filterLevel === key ? ' active' : ''}`}
            onClick={() => setFilterLevel(key)}
          >
            {cfg.icon} {cfg.label}
          </button>
        ))}
      </div>
      <div className="cm-alert-list">
        {displayAlerts.length === 0 && (
          <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>
            暂无告警
          </div>
        )}
        {displayAlerts.map((alert) => {
          const cfg = ALERT_LEVEL_CONFIG[alert.level] || ALERT_LEVEL_CONFIG[ALERT_LEVELS.INFO]
          return (
            <div
              key={alert.id}
              className="cm-alert-item"
              style={{ borderLeftColor: cfg.color }}
            >
              <div className="cm-alert-item-title">
                {cfg.icon} {alert.title}
              </div>
              <div className="cm-alert-item-meta">
                <span>{alert.resource}</span>
                <span>{formatTimeAgo(alert.time)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AlertList
