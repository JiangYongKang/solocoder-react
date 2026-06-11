import { useState } from 'react'
import { REMINDER_TIME_OPTIONS } from './constants'

export default function ReminderModal({ habit, reminder, onClose, onSave }) {
  const [enabled, setEnabled] = useState(reminder?.enabled || false)
  const [time, setTime] = useState(reminder?.time || '08:00')

  const handleSave = () => {
    onSave(habit.id, { enabled, time })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">提醒设置 — {habit.icon} {habit.name}</h2>
        <div className="reminder-form">
          <div className="form-group">
            <label className="form-label">开启提醒</label>
            <button
              className={`toggle-btn ${enabled ? 'active' : ''}`}
              type="button"
              onClick={() => setEnabled(!enabled)}
            >
              {enabled ? '已开启' : '已关闭'}
            </button>
          </div>
          {enabled && (
            <div className="form-group">
              <label className="form-label">提醒时间</label>
              <div className="time-picker">
                {REMINDER_TIME_OPTIONS.map(t => (
                  <button
                    key={t}
                    className={`time-picker-btn ${time === t ? 'active' : ''}`}
                    type="button"
                    onClick={() => setTime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  )
}
