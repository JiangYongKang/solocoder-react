import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './pomodoro.css'
import {
  PHASES,
  PHASE_LABELS,
  PHASE_COLORS,
} from './constants'
import {
  formatTime,
  getPhaseDuration,
  getNextPhase,
  validateSettings,
  normalizeSettings,
  loadSettings,
  saveSettings,
  loadRecords,
  saveRecords,
  addRecord,
  createPomodoroRecord,
  getLastNDays,
  buildDailyStats,
  calculateSummary,
  updateDocumentTitle,
  resetDocumentTitle,
  requestNotificationPermission,
  sendNotification,
  playBeep,
  getDateKey,
} from './pomodoroUtils'
import StatsChart from './StatsChart'
import WhiteNoiseSelector from './WhiteNoiseSelector'

const PomodoroPage = () => {
  const navigate = useNavigate()

  const [settings, setSettings] = useState(() => loadSettings())
  const [records, setRecords] = useState(() => loadRecords())

  const [currentPhase, setCurrentPhase] = useState(PHASES.WORK)
  const [completedWorkPomodoros, setCompletedWorkPomodoros] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(() => getPhaseDuration(PHASES.WORK, loadSettings()))
  const [remainingSeconds, setRemainingSeconds] = useState(() => getPhaseDuration(PHASES.WORK, loadSettings()))
  const [isRunning, setIsRunning] = useState(false)

  const [taskName, setTaskName] = useState('')
  const [currentTask, setCurrentTask] = useState('')

  const [whiteNoise, setWhiteNoise] = useState('silent')

  const [settingsForm, setSettingsForm] = useState(() => ({
    workMinutes: String(loadSettings().workMinutes),
    shortBreakMinutes: String(loadSettings().shortBreakMinutes),
    longBreakMinutes: String(loadSettings().longBreakMinutes),
    longBreakInterval: String(loadSettings().longBreakInterval),
  }))
  const [settingsErrors, setSettingsErrors] = useState({})

  const [statsRange, setStatsRange] = useState(7)
  const [statsChartType, setStatsChartType] = useState('bar')

  const [notificationRequested, setNotificationRequested] = useState(false)

  const intervalRef = useRef(null)
  const phaseRef = useRef(currentPhase)
  const taskRef = useRef(currentTask)
  const settingsRef = useRef(settings)
  const workCountRef = useRef(completedWorkPomodoros)

  useEffect(() => {
    phaseRef.current = currentPhase
  }, [currentPhase])

  useEffect(() => {
    taskRef.current = currentTask
  }, [currentTask])

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    workCountRef.current = completedWorkPomodoros
  }, [completedWorkPomodoros])

  useEffect(() => {
    saveRecords(records)
  }, [records])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      resetDocumentTitle()
    }
  }, [])

  useEffect(() => {
    if (!notificationRequested && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      requestNotificationPermission().then(() => {
        setNotificationRequested(true)
      })
    }
  }, [notificationRequested])

  useEffect(() => {
    updateDocumentTitle(remainingSeconds, PHASE_LABELS[currentPhase])
  }, [remainingSeconds, currentPhase])

  const handlePhaseComplete = useCallback(() => {
    playBeep()

    if (phaseRef.current === PHASES.WORK) {
      const actualDuration = settingsRef.current.workMinutes
      const newRecord = createPomodoroRecord(
        taskRef.current,
        actualDuration,
        PHASES.WORK
      )
      setRecords((prev) => addRecord(prev, newRecord))
      sendNotification('🍅 工作完成！', `任务「${taskRef.current || '未命名任务'}」已完成一个番茄，休息一下吧~`)
    } else if (phaseRef.current === PHASES.SHORT_BREAK) {
      sendNotification('☕ 短休结束！', '休息时间到，准备开始下一个番茄吧~')
    } else if (phaseRef.current === PHASES.LONG_BREAK) {
      sendNotification('🌿 长休结束！', '充分休息了，开始新一轮专注吧~')
    }

    const next = getNextPhase(phaseRef.current, workCountRef.current, settingsRef.current)
    setCurrentPhase(next.phase)
    setCompletedWorkPomodoros(next.completedWorkPomodoros)
    const nextDuration = getPhaseDuration(next.phase, settingsRef.current)
    setTotalSeconds(nextDuration)
    setRemainingSeconds(nextDuration)
  }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setIsRunning(false)
            handlePhaseComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, handlePhaseComplete])

  const handleStart = async () => {
    if (!notificationRequested) {
      await requestNotificationPermission()
      setNotificationRequested(true)
    }
    if (!isRunning && remainingSeconds === totalSeconds) {
      setCurrentTask(taskName)
    }
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleStop = () => {
    setIsRunning(false)
    setRemainingSeconds(totalSeconds)
  }

  const handlePhaseChange = (phase) => {
    if (isRunning) return
    setCurrentPhase(phase)
    const duration = getPhaseDuration(phase, settings)
    setTotalSeconds(duration)
    setRemainingSeconds(duration)
  }

  const handleSettingsChange = (field, value) => {
    setSettingsForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveSettings = () => {
    const errors = validateSettings(settingsForm)
    if (Object.keys(errors).length > 0) {
      setSettingsErrors(errors)
      return
    }
    const normalized = normalizeSettings(settingsForm)
    if (!normalized.success) {
      setSettingsErrors(normalized.errors || {})
      return
    }
    const result = saveSettings(normalized.settings)
    if (result.success) {
      setSettings(result.settings)
      setSettingsErrors({})
      if (!isRunning) {
        const duration = getPhaseDuration(currentPhase, result.settings)
        setTotalSeconds(duration)
        setRemainingSeconds(duration)
      }
    } else {
      setSettingsErrors(result.errors || {})
    }
  }

  const circumference = 2 * Math.PI * 120
  const progress = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0
  const dashOffset = circumference * (1 - progress)

  const statsData = useMemo(() => {
    const days = getLastNDays(statsRange)
    return buildDailyStats(records, days)
  }, [records, statsRange])

  const summary = useMemo(() => calculateSummary(records), [records])

  const recentRecords = useMemo(() => {
    return records
      .filter((r) => r.phase === PHASES.WORK)
      .slice(0, 5)
      .map((r) => ({
        ...r,
        dateLabel: getDateKey(r.completedAt),
      }))
  }, [records])

  return (
    <div className="pomodoro-page">
      <div className="pomodoro-header">
        <button className="pomodoro-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="pomodoro-title">番茄钟计时器</h1>
      </div>

      <div className="pomodoro-main-grid">
        <div className="timer-card">
          <div className="phase-tabs">
            {Object.values(PHASES).map((phase) => (
              <button
                key={phase}
                className={`phase-tab ${currentPhase === phase ? 'active' : ''}`}
                onClick={() => handlePhaseChange(phase)}
                disabled={isRunning}
              >
                {PHASE_LABELS[phase]}
              </button>
            ))}
          </div>

          <div className="timer-circle-wrapper">
            <svg className="timer-svg" viewBox="0 0 280 280">
              <circle className="timer-bg-circle" cx="140" cy="140" r="120" />
              <circle
                className="timer-progress-circle"
                cx="140"
                cy="140"
                r="120"
                stroke={PHASE_COLORS[currentPhase]}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="timer-text-wrapper">
              <p className="timer-time">{formatTime(remainingSeconds)}</p>
              <span className="timer-phase-label">{PHASE_LABELS[currentPhase]}</span>
            </div>
          </div>

          <div className="timer-controls">
            {!isRunning ? (
              <button className="timer-btn primary" onClick={handleStart}>
                {remainingSeconds < totalSeconds ? '继续' : '开始'}
              </button>
            ) : (
              <button className="timer-btn secondary" onClick={handlePause}>
                暂停
              </button>
            )}
            <button className="timer-btn danger" onClick={handleStop} disabled={!isRunning && remainingSeconds === totalSeconds}>
              停止
            </button>
          </div>

          <div className="timer-info">
            {!isRunning && remainingSeconds === totalSeconds ? (
              <div className="task-input-wrapper">
                <label className="task-input-label">当前任务</label>
                <input
                  className="task-input"
                  type="text"
                  placeholder="输入你正在处理的任务..."
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  maxLength={100}
                />
              </div>
            ) : (
              currentTask && (
                <div className="current-task-display">
                  <div className="current-task-label">当前任务</div>
                  <div className="current-task-name">{currentTask}</div>
                </div>
              )
            )}

            <div className="pomodoro-counter">
              <span className="counter-icon">🍅</span>
              <span className="counter-label">本轮已完成</span>
              <span className="counter-value">{completedWorkPomodoros} 个</span>
            </div>
          </div>
        </div>

        <div className="side-panels">
          <div className="settings-card">
            <h3 className="card-title">时间设置</h3>
            <div className="settings-form">
              <div className="settings-row">
                <label className="settings-label">工作时长</label>
                <input
                  className="settings-input"
                  type="number"
                  min="1"
                  max="120"
                  value={settingsForm.workMinutes}
                  onChange={(e) => handleSettingsChange('workMinutes', e.target.value)}
                  disabled={isRunning}
                />
                <span className="settings-unit">分钟</span>
              </div>
              {settingsErrors.workMinutes && (
                <div className="settings-error">{settingsErrors.workMinutes}</div>
              )}

              <div className="settings-row">
                <label className="settings-label">短休时长</label>
                <input
                  className="settings-input"
                  type="number"
                  min="1"
                  max="60"
                  value={settingsForm.shortBreakMinutes}
                  onChange={(e) => handleSettingsChange('shortBreakMinutes', e.target.value)}
                  disabled={isRunning}
                />
                <span className="settings-unit">分钟</span>
              </div>
              {settingsErrors.shortBreakMinutes && (
                <div className="settings-error">{settingsErrors.shortBreakMinutes}</div>
              )}

              <div className="settings-row">
                <label className="settings-label">长休时长</label>
                <input
                  className="settings-input"
                  type="number"
                  min="1"
                  max="120"
                  value={settingsForm.longBreakMinutes}
                  onChange={(e) => handleSettingsChange('longBreakMinutes', e.target.value)}
                  disabled={isRunning}
                />
                <span className="settings-unit">分钟</span>
              </div>
              {settingsErrors.longBreakMinutes && (
                <div className="settings-error">{settingsErrors.longBreakMinutes}</div>
              )}

              <div className="settings-row">
                <label className="settings-label">长休间隔</label>
                <input
                  className="settings-input"
                  type="number"
                  min="2"
                  max="6"
                  value={settingsForm.longBreakInterval}
                  onChange={(e) => handleSettingsChange('longBreakInterval', e.target.value)}
                  disabled={isRunning}
                />
                <span className="settings-unit">个番茄</span>
              </div>
              {settingsErrors.longBreakInterval && (
                <div className="settings-error">{settingsErrors.longBreakInterval}</div>
              )}

              <button className="save-settings-btn" onClick={handleSaveSettings} disabled={isRunning}>
                保存设置
              </button>
            </div>
          </div>

          <div className="white-noise-card">
            <h3 className="card-title">白噪音</h3>
            <WhiteNoiseSelector selectedId={whiteNoise} onSelect={setWhiteNoise} />
          </div>
        </div>
      </div>

      <div className="stats-card">
        <div className="stats-header">
          <h3 className="card-title" style={{ marginBottom: 0 }}>统计数据</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="stats-range-tabs">
              <button
                className={`stats-range-tab ${statsRange === 7 ? 'active' : ''}`}
                onClick={() => setStatsRange(7)}
              >
                近7天
              </button>
              <button
                className={`stats-range-tab ${statsRange === 30 ? 'active' : ''}`}
                onClick={() => setStatsRange(30)}
              >
                近30天
              </button>
            </div>
            <div className="stats-range-tabs">
              <button
                className={`stats-range-tab ${statsChartType === 'bar' ? 'active' : ''}`}
                onClick={() => setStatsChartType('bar')}
              >
                柱状图
              </button>
              <button
                className={`stats-range-tab ${statsChartType === 'line' ? 'active' : ''}`}
                onClick={() => setStatsChartType('line')}
              >
                折线图
              </button>
            </div>
          </div>
        </div>

        <div className="stats-summary">
          <div className="stats-summary-item">
            <div className="stats-summary-label">总番茄数</div>
            <div className="stats-summary-value">
              {summary.totalPomodoros}
              <span className="stats-summary-unit">个</span>
            </div>
          </div>
          <div className="stats-summary-item">
            <div className="stats-summary-label">总专注时长</div>
            <div className="stats-summary-value">
              {summary.totalHours > 0 ? `${summary.totalHours}h` : ''}
              {summary.remainingMinutes > 0 ? `${summary.remainingMinutes}m` : summary.totalHours === 0 ? '0m' : ''}
            </div>
          </div>
          <div className="stats-summary-item">
            <div className="stats-summary-label">日均番茄</div>
            <div className="stats-summary-value">
              {summary.dailyAvg}
              <span className="stats-summary-unit">个</span>
            </div>
          </div>
        </div>

        <div className="stats-chart-wrapper">
          <StatsChart data={statsData} chartType={statsChartType} />
        </div>

        {recentRecords.length > 0 && (
          <div className="recent-records">
            <h4 className="recent-records-title">最近完成</h4>
            <div className="records-list">
              {recentRecords.map((r) => (
                <div key={r.id} className="record-item">
                  <span className="record-icon">🍅</span>
                  <span className="record-task" title={r.taskName}>
                    {r.taskName}
                  </span>
                  <span className="record-meta">
                    {r.dateLabel} · {r.durationMinutes}分钟
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PomodoroPage
