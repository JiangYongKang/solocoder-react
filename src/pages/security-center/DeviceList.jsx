import { useState } from 'react'
import { formatDateTime } from './securityCenterCore'

export default function DeviceList({ devices, onRemoveDevice }) {
  const [confirmingId, setConfirmingId] = useState(null)

  const handleLogoutClick = (device) => {
    if (device.isCurrent) return
    setConfirmingId(device.id)
  }

  const handleConfirmRemove = (device) => {
    onRemoveDevice(device)
    setConfirmingId(null)
  }

  return (
    <div>
      <div className="sc-section-header">
        <h2 className="sc-section-title">登录设备管理</h2>
        <span className="sc-tfa-badge sc-tfa-badge-on">共 {devices.length} 台设备</span>
      </div>

      <div className="sc-device-list">
        {devices.map((device) => {
          const isConfirming = confirmingId === device.id
          const isRemote = device.isRemote && !device.isCurrent
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
