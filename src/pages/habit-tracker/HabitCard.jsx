import { useState, useMemo } from 'react'
import HeatmapCalendar from './HeatmapCalendar'
import {
  calculateStreak,
  calculateMaxStreak,
  calculateWeekCompletion,
  calculateMonthCompletion,
  getFrequencyLabel,
  getProgressColor,
  getMilestones,
  getCheckinCount,
  getTodayKey,
} from './habitUtils'

export default function HabitCard({
  habit,
  checkins,
  onCheckin,
  onUncheckin,
  onArchive,
  onActivate,
  onReminderClick,
}) {
  const [yearOffset, setYearOffset] = useState(0)

  const streak = useMemo(() => calculateStreak(checkins, habit.id), [checkins, habit.id])
  const maxStreak = useMemo(() => calculateMaxStreak(checkins, habit.id), [checkins, habit.id])
  const weekComp = useMemo(
    () => calculateWeekCompletion(checkins, habit.id, habit.frequencyType, habit.frequencyCount),
    [checkins, habit.id, habit.frequencyType, habit.frequencyCount]
  )
  const monthComp = useMemo(
    () => calculateMonthCompletion(checkins, habit.id, habit.frequencyType, habit.frequencyCount),
    [checkins, habit.id, habit.frequencyType, habit.frequencyCount]
  )
  const milestones = useMemo(() => getMilestones(streak), [streak])
  const todayKey = getTodayKey()
  const todayCount = getCheckinCount(checkins, habit.id, todayKey)

  const freqLabel = getFrequencyLabel(habit.frequencyType, habit.frequencyCount)

  return (
    <div className={`habit-card ${habit.archived ? 'archived' : ''}`}>
      <div className="habit-card-header">
        <div className="habit-card-info">
          <span className="habit-icon">{habit.icon}</span>
          <div className="habit-meta">
            <h3 className="habit-name">{habit.name}</h3>
            <span className="habit-freq">{freqLabel}</span>
          </div>
        </div>
        <div className="habit-card-actions">
          {!habit.archived && (
            <>
              <button
                className="habit-action-btn checkin-btn"
                onClick={() => onCheckin(habit.id)}
                title="打卡"
              >
                ✅ 今日 {todayCount > 0 ? `(${todayCount})` : ''}
              </button>
              {todayCount > 0 && (
                <button
                  className="habit-action-btn"
                  onClick={() => onUncheckin(habit.id)}
                  title="撤销打卡"
                >
                  ↩️
                </button>
              )}
              <button
                className="habit-action-btn"
                onClick={() => onReminderClick(habit)}
                title="提醒设置"
              >
                ⏰
              </button>
              <button
                className="habit-action-btn"
                onClick={() => onArchive(habit.id)}
                title="归档"
              >
                📦
              </button>
            </>
          )}
          {habit.archived && (
            <button
              className="habit-action-btn activate-btn"
              onClick={() => onActivate(habit.id)}
              title="激活"
            >
              🔄 激活
            </button>
          )}
        </div>
      </div>

      {habit.description && (
        <p className="habit-desc">{habit.description}</p>
      )}

      <div className="habit-streak-row">
        <div className="streak-current">
          🔥 <span className="streak-num">{streak}</span>
          <span className="streak-label">天连续</span>
        </div>
        <div className="streak-max">
          最长 <span className="streak-num">{maxStreak}</span> 天
        </div>
        {milestones.length > 0 && (
          <div className="milestones">
            {milestones.map(m => (
              <span key={m.days} className="milestone-badge" title={`${m.label}里程碑`}>
                {m.icon}
              </span>
            ))}
          </div>
        )}
      </div>

      {!habit.archived && (
        <div className="habit-progress-row">
          <div className="progress-item">
            <div className="progress-label">
              <span>本周</span>
              <span className="progress-value">{weekComp.completed}/{weekComp.target}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(weekComp.rate, 100)}%`,
                  backgroundColor: getProgressColor(weekComp.rate),
                }}
              />
            </div>
          </div>
          <div className="progress-item">
            <div className="progress-label">
              <span>本月</span>
              <span className="progress-value">{monthComp.completed}/{monthComp.target}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(monthComp.rate, 100)}%`,
                  backgroundColor: getProgressColor(monthComp.rate),
                }}
              />
            </div>
          </div>
        </div>
      )}

      <HeatmapCalendar
        checkins={checkins}
        habitId={habit.id}
        yearOffset={yearOffset}
        onYearChange={setYearOffset}
      />
    </div>
  )
}
