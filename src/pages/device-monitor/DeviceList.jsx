import { useState, useMemo, useEffect } from 'react'
import {
  DEVICE_TYPES,
  DEVICE_TYPE_LABELS,
  DEVICE_TYPE_ICONS,
  DEVICE_STATUS,
} from './constants.js'
import {
  groupDevicesByType,
  getGroupStatistics,
  filterDevicesBySearch,
  getDeviceStatistics,
} from './deviceUtils.js'

const DeviceList = ({ devices, selectedDeviceId, onSelectDevice, searchKeyword, onSearchChange }) => {
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const expanded = {}
    Object.values(DEVICE_TYPES).forEach((t) => {
      expanded[t] = true
    })
    return expanded
  })

  const filteredDevices = useMemo(
    () => filterDevicesBySearch(devices, searchKeyword),
    [devices, searchKeyword]
  )

  const groupedDevices = useMemo(
    () => groupDevicesByType(filteredDevices),
    [filteredDevices]
  )

  const totalStats = useMemo(
    () => getDeviceStatistics(devices),
    [devices]
  )

  const [nowTs, setNowTs] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const toggleGroup = (type) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }

  const getStatusDotClass = (device) => {
    if (device.isAlerting) return 'status-dot alert'
    if (device.status === DEVICE_STATUS.ONLINE) return 'status-dot online'
    return 'status-dot offline'
  }

  const isStatusChanging = (device) => {
    if (!device.statusChangeAt) return false
    return nowTs - device.statusChangeAt < 2000
  }

  return (
    <div className="device-list-panel">
      <div className="device-list-header">
        <h2 className="panel-title">设备列表</h2>
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="搜索设备名称或ID..."
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      <div className="device-group-list">
        {Object.values(DEVICE_TYPES).map((type) => {
          const groupDevices = groupedDevices[type] || []
          const stats = getGroupStatistics(groupDevices)
          const isExpanded = expandedGroups[type]

          return (
            <div key={type} className="device-group">
              <div
                className="device-group-header"
                onClick={() => toggleGroup(type)}
              >
                <span className={`group-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
                <span className="group-icon">{DEVICE_TYPE_ICONS[type]}</span>
                <span className="group-name">{DEVICE_TYPE_LABELS[type]}</span>
                <span className="group-count">
                  {stats.online}/{stats.total}
                </span>
              </div>

              {isExpanded && (
                <div className="device-items">
                  {groupDevices.length === 0 ? (
                    <div className="empty-group">暂无设备</div>
                  ) : (
                    groupDevices.map((device) => (
                      <div
                        key={device.id}
                        className={`device-item ${selectedDeviceId === device.id ? 'selected' : ''}`}
                        onClick={() => onSelectDevice(device.id)}
                      >
                        <div className={`${getStatusDotClass(device)} ${isStatusChanging(device) ? 'changing' : ''}`} />
                        <div className="device-info">
                          <div className="device-name">{device.name}</div>
                          <div className="device-id">{device.id}</div>
                        </div>
                        {device.isAlerting && (
                          <span className="alert-badge">!</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="device-list-footer">
        <div className="stat-item">
          <span className="stat-label">总设备</span>
          <span className="stat-value total">{totalStats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-dot online" />
          <span className="stat-value">{totalStats.online}</span>
        </div>
        <div className="stat-item">
          <span className="stat-dot offline" />
          <span className="stat-value">{totalStats.offline}</span>
        </div>
        <div className="stat-item">
          <span className="stat-dot alert" />
          <span className="stat-value">{totalStats.alert}</span>
        </div>
      </div>
    </div>
  )
}

export default DeviceList
