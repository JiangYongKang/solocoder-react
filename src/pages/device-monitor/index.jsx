import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ALERT_LEVELS,
  ALERT_LEVEL_COLORS,
  ALERT_STATUS,
  DATA_INTERVAL_MS,
  STATUS_CHANGE_MAX_MS,
  STATUS_CHANGE_MIN_MS,
} from './constants.js'
import './device-monitor.css'
import DeviceList from './DeviceList.jsx'
import DeviceDetail from './DeviceDetail.jsx'
import AlertRulePanel from './AlertRulePanel.jsx'
import AlertRecordPanel from './AlertRecordPanel.jsx'
import {
  createAlertRecord,
  evaluateDeviceAlerts,
  generateNextDataPoint,
  getDeviceStatistics,
  loadAlertRecords,
  loadAlertRules,
  loadDevices,
  randomInt,
  saveAlertRecords,
  saveAlertRules,
  saveDevices,
  updateRandomDeviceStatuses,
} from './deviceUtils.js'

function DeviceMonitorPage() {
  const navigate = useNavigate()

  const dataTimerRef = useRef(null)
  const statusTimerRef = useRef(null)
  const alertingDeviceMapRef = useRef({})

  const [devices, setDevices] = useState(() => loadDevices())
  const [alertRules, setAlertRules] = useState(() => loadAlertRules())
  const [alertRecords, setAlertRecords] = useState(() => loadAlertRecords())

  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showAlertRules, setShowAlertRules] = useState(false)
  const [showAlertRecords, setShowAlertRecords] = useState(false)
  const [alertNotifications, setAlertNotifications] = useState([])

  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId) return null
    return devices.find((d) => d.id === selectedDeviceId) || null
  }, [devices, selectedDeviceId])

  const totalStats = useMemo(() => getDeviceStatistics(devices), [devices])

  const pendingAlertCount = useMemo(
    () => alertRecords.filter((r) => r.status === ALERT_STATUS.PENDING).length,
    [alertRecords]
  )

  useEffect(() => {
    saveDevices(devices)
  }, [devices])

  useEffect(() => {
    saveAlertRules(alertRules)
  }, [alertRules])

  useEffect(() => {
    saveAlertRecords(alertRecords)
  }, [alertRecords])

  const processDeviceDataUpdate = useCallback(
    (prevDevices) => {
      const newDevices = prevDevices.map((device) => {
        const next = generateNextDataPoint(device)
        if (!next) return device

        const alertResult = evaluateDeviceAlerts(next, alertRules)
        const wasAlerting = !!alertingDeviceMapRef.current[device.id]

        if (alertResult.isAlerting) {
          alertingDeviceMapRef.current[device.id] = true
          if (!wasAlerting && alertResult.triggeredRules.length > 0) {
            const newRecords = alertResult.triggeredRules.map((rule) =>
              createAlertRecord(next, rule, next.currentValue)
            )
            setAlertRecords((prevRecords) => [...newRecords, ...prevRecords])
            setAlertNotifications((prevNotifs) => {
              const notifs = newRecords.map((r) => ({
                id: r.id,
                message: r.message,
                level: r.level,
                deviceId: r.deviceId,
                createdAt: Date.now(),
              }))
              return [...notifs, ...prevNotifs].slice(0, 10)
            })
          }
        } else {
          delete alertingDeviceMapRef.current[device.id]
        }

        return {
          ...next,
          isAlerting: alertResult.isAlerting,
          alertLevel: alertResult.alertLevel,
        }
      })
      return newDevices
    },
    [alertRules]
  )

  const scheduleStatusChange = useCallback(() => {
    const delay = randomInt(STATUS_CHANGE_MIN_MS, STATUS_CHANGE_MAX_MS)
    statusTimerRef.current = setTimeout(() => {
      setDevices((prev) => {
        const updated = updateRandomDeviceStatuses(prev)
        const result = updated.map((d) => ({
          ...d,
          isAlerting: false,
        }))
        return result
      })
      scheduleStatusChange()
    }, delay)
  }, [])

  useEffect(() => {
    dataTimerRef.current = setInterval(() => {
      setDevices(processDeviceDataUpdate)
    }, DATA_INTERVAL_MS)

    scheduleStatusChange()

    return () => {
      if (dataTimerRef.current) {
        clearInterval(dataTimerRef.current)
      }
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current)
      }
    }
  }, [processDeviceDataUpdate, scheduleStatusChange])

  useEffect(() => {
    if (alertNotifications.length === 0) return
    const now = Date.now()
    const remaining = alertNotifications.filter((n) => now - n.createdAt < 8000)
    if (remaining.length !== alertNotifications.length) {
      setAlertNotifications(remaining)
    }
    const cleanupTimer = setInterval(() => {
      const t = Date.now()
      setAlertNotifications((prev) => prev.filter((n) => t - n.createdAt < 8000))
    }, 2000)
    return () => clearInterval(cleanupTimer)
  }, [alertNotifications])

  const handleSelectDevice = (deviceId) => {
    setSelectedDeviceId(deviceId)
  }

  const handleRulesChange = (newRules) => {
    setAlertRules(newRules)
  }

  const handleRecordsChange = (newRecords) => {
    setAlertRecords(newRecords)
  }

  const handleDismissNotification = (notifId) => {
    setAlertNotifications((prev) => prev.filter((n) => n.id !== notifId))
  }

  const handleResetData = () => {
    if (window.confirm('确定要重置所有设备数据、告警规则和记录吗？此操作不可恢复。')) {
      alertingDeviceMapRef.current = {}
      try {
        window.localStorage.removeItem('device_monitor_devices')
        window.localStorage.removeItem('device_monitor_alert_rules')
        window.localStorage.removeItem('device_monitor_alert_records')
      } catch (e) {
        // ignore
      }
      setDevices(loadDevices())
      setAlertRules([])
      setAlertRecords([])
      setSelectedDeviceId(null)
      setAlertNotifications([])
    }
  }

  return (
    <div className="device-monitor-page">
      <header className="dm-header">
        <div className="dm-header-left">
          <button className="dm-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="dm-title">
            <span className="dm-title-icon">📡</span>
            IoT 设备监控控制台
          </h1>
        </div>
        <div className="dm-header-right">
          <div className="dm-summary-cards">
            <div className="dm-summary-card dm-summary-total">
              <span className="dm-summary-label">总设备</span>
              <span className="dm-summary-value">{totalStats.total}</span>
            </div>
            <div className="dm-summary-card dm-summary-online">
              <span className="dm-summary-label">在线</span>
              <span className="dm-summary-value">{totalStats.online}</span>
            </div>
            <div className="dm-summary-card dm-summary-offline">
              <span className="dm-summary-label">离线</span>
              <span className="dm-summary-value">{totalStats.offline}</span>
            </div>
            <div className="dm-summary-card dm-summary-alert">
              <span className="dm-summary-label">告警</span>
              <span className="dm-summary-value">{totalStats.alert}</span>
            </div>
          </div>
          <div className="dm-toolbar">
            <button
              className="btn btn-primary"
              onClick={() => setShowAlertRules(true)}
            >
              ⚙️ 告警规则
            </button>
            <button
              className="btn btn-warning"
              onClick={() => setShowAlertRecords(true)}
            >
              🔔 告警记录
              {pendingAlertCount > 0 && (
                <span className="dm-badge">{pendingAlertCount}</span>
              )}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleResetData}
            >
              🔄 重置数据
            </button>
          </div>
        </div>
      </header>

      <div className="dm-main-layout">
        <aside className="dm-sidebar">
          <DeviceList
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={handleSelectDevice}
            searchKeyword={searchKeyword}
            onSearchChange={setSearchKeyword}
          />
        </aside>
        <main className="dm-content">
          <DeviceDetail device={selectedDevice} alertRules={alertRules} />
        </main>
      </div>

      {alertNotifications.length > 0 && (
        <div className="dm-notification-stack">
          {alertNotifications.map((notif) => (
            <div
              key={notif.id}
              className="dm-alert-notification"
              style={{
                borderLeftColor: ALERT_LEVEL_COLORS[notif.level] || '#999',
                background: `linear-gradient(90deg, ${ALERT_LEVEL_COLORS[notif.level] || '#999'}10 0%, var(--code-bg) 100%)`,
              }}
              onClick={() => {
                handleDismissNotification(notif.id)
                handleSelectDevice(notif.deviceId)
              }}
            >
              <div className="dm-notif-level">
                {notif.level === ALERT_LEVELS.CRITICAL && '🔴'}
                {notif.level === ALERT_LEVELS.WARNING && '🟠'}
                {notif.level === ALERT_LEVELS.INFO && '🔵'}
              </div>
              <div className="dm-notif-content">
                <div className="dm-notif-message">{notif.message}</div>
                <div className="dm-notif-time">刚刚</div>
              </div>
              <button
                className="dm-notif-close"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDismissNotification(notif.id)
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showAlertRules && (
        <AlertRulePanel
          rules={alertRules}
          onRulesChange={handleRulesChange}
          onClose={() => setShowAlertRules(false)}
        />
      )}

      {showAlertRecords && (
        <AlertRecordPanel
          records={alertRecords}
          onRecordsChange={handleRecordsChange}
          onClose={() => setShowAlertRecords(false)}
        />
      )}
    </div>
  )
}

export default DeviceMonitorPage
