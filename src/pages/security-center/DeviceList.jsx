import { useState } from 'react'
import { formatDateTime, isDeviceRemote } from './securityCenterCore'
import { CITIES } from './constants'

export default function DeviceList({ devices, onRemoveDevice, frequentLocations, onFrequentLocationsChange }) {
  const [confirmingId, setConfirmingId] = useState(null)
  const [showLocationSettings, setShowLocationSettings] = useState(false)
  const [newLocation, setNewLocation] = useState('')

  const handleLogoutClick = (device) => {
    if (device.isCurrent) return
    setConfirmingId(device.id)
  }

  const handleConfirmRemove = (device) => {
    onRemoveDevice(device)
    setConfirmingId(null)
  }

  const handleAddLocation = () => {
    const trimmed = newLocation.trim()
    if (trimmed && !frequentLocations.includes(trimmed)) {
      onFrequentLocationsChange([...frequentLocations, trimmed])
    }
    setNewLocation('')
  }

  const handleRemoveLocation = (location) => {
    if (frequentLocations.length <= 1) return
    onFrequentLocationsChange(frequentLocations.filter(l => l !== location))
  }

  const handleAddFromCities = (city) => {
    if (!frequentLocations.includes(city)) {
      onFrequentLocationsChange([...frequentLocations, city])
    }
  }

  const availableCities = CITIES.filter(c => !frequentLocations.includes(c))

  return (
    <div>
      <div className="sc-section-header">
        <h2 className="sc-section-title">登录设备管理</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="sc-btn sc-btn-sm"
            onClick={() => setShowLocationSettings(!showLocationSettings)}
          >
            {showLocationSettings ? '收起设置' : '常用地点设置'}
          </button>
          <span className="sc-tfa-badge sc-tfa-badge-on">共 {devices.length} 台设备</span>
        </div>
      </div>

      {showLocationSettings && (
        <div className="sc-location-settings">
          <div className="sc-location-settings-desc">
            配置您的常用登录城市，不在常用城市列表中的设备登录将被标记为异地登录。
          </div>
          <div className="sc-location-tags">
            {frequentLocations.map((loc) => (
              <span key={loc} className="sc-location-tag">
                {loc}
                {frequentLocations.length > 1 && (
                  <button
                    type="button"
                    className="sc-location-tag-remove"
                    onClick={() => handleRemoveLocation(loc)}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          <div className="sc-location-add-row">
            <input
              type="text"
              className="sc-location-input"
              placeholder="输入城市名称"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddLocation() }}
            />
            <button className="sc-btn sc-btn-sm sc-btn-primary" onClick={handleAddLocation}>
              添加
            </button>
          </div>
          {availableCities.length > 0 && (
            <div className="sc-location-suggestions">
              <span className="sc-location-suggestions-label">快速添加：</span>
              {availableCities.slice(0, 10).map((city) => (
                <button
                  key={city}
                  className="sc-btn sc-btn-sm"
                  onClick={() => handleAddFromCities(city)}
                >
                  + {city}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="sc-device-list">
        {devices.map((device) => {
          const isConfirming = confirmingId === device.id
          const isRemote = isDeviceRemote(device, frequentLocations)
          return (
            <div
              key={device.id}
              className={`sc-device-card ${isRemote ? 'remote' : ''} ${isConfirming ? 'remote' : ''}`}
            >
              <div className="sc-device-icon">
                {device.os.toLowerCase().includes('windows') ? '🖥️' :
                 device.os.toLowerCase().includes('mac') ? '💻' :
                 device.os.toLowerCase().includes('ios') ? '📱' : '📱'}
              </div>

              <div className="sc-device-info">
                <div className="sc-device-name-row">
                  <span className="sc-device-name">{device.name}</span>
                  {device.isCurrent && (
                    <span className="sc-device-tag sc-device-tag-current">当前设备</span>
                  )}
                  {isRemote && (
                    <span className="sc-device-tag sc-device-tag-remote">异地登录提醒</span>
                  )}
                </div>
                <div className="sc-device-meta">
                  <span>操作系统：{device.os}</span>
                  <span>浏览器：{device.browser}</span>
                </div>
                <div className="sc-device-meta">
                  <span>IP：{device.ip}</span>
                  <span>登录地点：{device.location}</span>
                </div>
                <div className="sc-device-meta">
                  <span>登录时间：{formatDateTime(device.loginTime)}</span>
                </div>
              </div>

              <div className="sc-device-action">
                {!device.isCurrent && !isConfirming && (
                  <button
                    className="sc-btn sc-btn-danger sc-btn-sm"
                    onClick={() => handleLogoutClick(device)}
                  >
                    下线
                  </button>
                )}
              </div>

              {isConfirming && (
                <div className="sc-device-action" style={{ flex: 1 }}>
                  <div className="sc-confirm-text" style={{ marginBottom: '8px' }}>
                    确定要强制下线该设备吗？该设备上的登录会话将被终止。
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="sc-btn sc-btn-sm"
                      onClick={() => setConfirmingId(null)}
                    >
                      取消
                    </button>
                    <button
                      className="sc-btn sc-btn-danger sc-btn-sm"
                      onClick={() => handleConfirmRemove(device)}
                    >
                      确认下线
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
