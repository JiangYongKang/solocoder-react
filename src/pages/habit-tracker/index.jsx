import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './habit-tracker.css'
import HabitCard from './HabitCard'
import CreateHabitModal from './CreateHabitModal'
import ReminderModal from './ReminderModal'
import OverviewRing from './OverviewRing'
import {
  loadHabits,
  saveHabits,
  loadCheckins,
  saveCheckins,
  loadReminders,
  saveReminders,
  createHabit,
  archiveHabit,
  activateHabit,
  checkin,
  uncheckin,
  getTodayKey,
} from './habitUtils'

export default function HabitTrackerPage() {
  const navigate = useNavigate()

  const [habits, setHabits] = useState(() => loadHabits())
  const [checkins, setCheckins] = useState(() => loadCheckins())
  const [reminders, setReminders] = useState(() => loadReminders())

  const [tab, setTab] = useState('active')
  const [showCreate, setShowCreate] = useState(false)
  const [reminderHabit, setReminderHabit] = useState(null)
  const [notifications, setNotifications] = useState([])

  const reminderIntervalRef = useRef(null)
  const lastCheckRef = useRef('')

  useEffect(() => {
    saveHabits(habits)
  }, [habits])

  useEffect(() => {
    saveCheckins(checkins)
  }, [checkins])

  useEffect(() => {
    saveReminders(reminders)
  }, [reminders])

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      if (currentTime === lastCheckRef.current) return
      lastCheckRef.current = currentTime

      const activeHabits = habits.filter(h => !h.archived)
      const newNotifications = []

      activeHabits.forEach(h => {
        const r = reminders[h.id]
        if (r && r.enabled && r.time === currentTime) {
          newNotifications.push({
            id: `${h.id}-${currentTime}`,
            habitName: h.name,
            habitIcon: h.icon,
          })
        }
      })

      if (newNotifications.length > 0) {
        setNotifications(prev => [...prev, ...newNotifications])
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => !newNotifications.some(nn => nn.id === n.id)))
        }, 5000)
      }
    }

    checkReminders()
    reminderIntervalRef.current = setInterval(checkReminders, 30000)
    return () => clearInterval(reminderIntervalRef.current)
  }, [habits, reminders])

  const handleCreate = useCallback((data) => {
    const result = createHabit(habits, data)
    if (result.success) {
      setHabits(result.habits)
      setShowCreate(false)
    }
    return result
  }, [habits])

  const handleCheckin = useCallback((habitId) => {
    setCheckins(prev => checkin(prev, habitId, getTodayKey()))
  }, [])

  const handleUncheckin = useCallback((habitId) => {
    setCheckins(prev => uncheckin(prev, habitId, getTodayKey()))
  }, [])

  const handleArchive = useCallback((habitId) => {
    setHabits(prev => archiveHabit(prev, habitId))
  }, [])

  const handleActivate = useCallback((habitId) => {
    setHabits(prev => activateHabit(prev, habitId))
  }, [])

  const handleReminderClick = useCallback((habit) => {
    setReminderHabit(habit)
  }, [])

  const handleReminderSave = useCallback((habitId, data) => {
    setReminders(prev => ({ ...prev, [habitId]: data }))
  }, [])

  const handleDismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const activeHabits = habits.filter(h => !h.archived)
  const archivedHabits = habits.filter(h => h.archived)
  const displayedHabits = tab === 'active' ? activeHabits : archivedHabits

  return (
    <div className="ht-page">
      <div className="ht-header">
        <button className="ht-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="ht-title">习惯养成追踪</h1>
      </div>

      {notifications.map(n => (
        <div key={n.id} className="ht-notification">
          <span>🔔 该打卡啦！—— {n.habitIcon} {n.habitName}</span>
          <button
            className="ht-notification-close"
            onClick={() => handleDismissNotification(n.id)}
          >
            ✕
          </button>
        </div>
      ))}

      <div className="ht-top-bar">
        <div className="ht-tabs">
          <button
            className={`ht-tab ${tab === 'active' ? 'active' : ''}`}
            onClick={() => setTab('active')}
          >
            活跃 ({activeHabits.length})
          </button>
          <button
            className={`ht-tab ${tab === 'archived' ? 'active' : ''}`}
            onClick={() => setTab('archived')}
          >
            已归档 ({archivedHabits.length})
          </button>
        </div>
        <button className="ht-create-btn" onClick={() => setShowCreate(true)}>
          + 新建习惯
        </button>
      </div>

      {tab === 'active' && activeHabits.length > 0 && (
        <div className="ht-overview">
          <OverviewRing habits={habits} checkins={checkins} />
          <div className="overview-info">
            <h3>整体完成概览</h3>
            <p>
              你当前有 <strong>{activeHabits.length}</strong> 个活跃习惯。
              坚持每天打卡，保持连胜记录！
              达到 7 天、30 天、100 天里程碑可获得徽章。
            </p>
          </div>
        </div>
      )}

      <div className="ht-list">
        {displayedHabits.length > 0 ? (
          displayedHabits.map(h => (
            <HabitCard
              key={h.id}
              habit={h}
              checkins={checkins}
              onCheckin={handleCheckin}
              onUncheckin={handleUncheckin}
              onArchive={handleArchive}
              onActivate={handleActivate}
              onReminderClick={handleReminderClick}
            />
          ))
        ) : (
          <div className="ht-empty">
            {tab === 'active'
              ? '暂无活跃习惯，点击「新建习惯」开始吧！'
              : '暂无已归档的习惯'}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateHabitModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {reminderHabit && (
        <ReminderModal
          habit={reminderHabit}
          reminder={reminders[reminderHabit.id]}
          onClose={() => setReminderHabit(null)}
          onSave={handleReminderSave}
        />
      )}
    </div>
  )
}
