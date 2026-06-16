import { DEVICE_TYPES, DEVICE_TYPE_LABELS, DEVICE_TYPE_ICONS } from './constants.js'
import DeviceShape from './DeviceShape.jsx'

const deviceList = [
  DEVICE_TYPES.SERVER,
  DEVICE_TYPES.ROUTER,
  DEVICE_TYPES.SWITCH,
  DEVICE_TYPES.FIREWALL,
  DEVICE_TYPES.WORKSTATION,
  DEVICE_TYPES.CLOUD,
]

export default function DevicePanel() {
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('application/network-device', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="nt-device-panel">
      <div className="nt-panel-header">
        <span className="nt-panel-title">设备面板</span>
      </div>
      <div className="nt-device-list">
        {deviceList.map((type) => (
          <div
            key={type}
            className="nt-device-card"
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
          >
            <svg width={48} height={48} viewBox="0 0 48 48" className="nt-device-icon">
              <DeviceShape type={type} width={48} height={48} />
            </svg>
            <div className="nt-device-info">
              <div className="nt-device-icon-emoji">{DEVICE_TYPE_ICONS[type]}</div>
              <div className="nt-device-name">{DEVICE_TYPE_LABELS[type]}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="nt-panel-tip">
        <p>拖拽设备到画布</p>
        <p>选中节点后拖拽端口连线</p>
      </div>
    </div>
  )
}
