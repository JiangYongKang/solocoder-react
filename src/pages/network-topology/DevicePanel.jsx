import { DEVICE_TYPES, DEVICE_TYPE_LABELS, DEVICE_TYPE_ICONS, DEVICE_TYPE_COLORS, DEVICE_TYPE_SHAPES } from './constants.js'

const deviceList = [
  DEVICE_TYPES.SERVER,
  DEVICE_TYPES.ROUTER,
  DEVICE_TYPES.SWITCH,
  DEVICE_TYPES.FIREWALL,
  DEVICE_TYPES.WORKSTATION,
  DEVICE_TYPES.CLOUD,
]

function DeviceShape({ type, size = 48 }) {
  const colors = DEVICE_TYPE_COLORS[type]
  const shape = DEVICE_TYPE_SHAPES[type]
  const half = size / 2

  switch (shape) {
    case 'rect':
      return (
        <rect
          x={2}
          y={size * 0.2}
          width={size - 4}
          height={size * 0.6}
          rx={4}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={2}
        />
      )
    case 'circle':
      return (
        <circle
          cx={half}
          cy={half}
          r={half - 4}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={2}
        />
      )
    case 'square':
      return (
        <rect
          x={4}
          y={4}
          width={size - 8}
          height={size - 8}
          rx={4}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={2}
        />
      )
    case 'hexagon': {
      const points = []
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const px = half + (half - 4) * Math.cos(angle)
        const py = half + (half - 4) * Math.sin(angle)
        points.push(`${px},${py}`)
      }
      return (
        <polygon
          points={points.join(' ')}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={2}
        />
      )
    }
    case 'diamond': {
      const pts = `${half},4 ${size - 4},${half} ${half},${size - 4} 4,${half}`
      return (
        <polygon
          points={pts}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={2}
        />
      )
    }
    case 'cloud':
      return (
        <g>
          <ellipse cx={half} cy={half + 4} rx={half - 6} ry={half - 12} fill={colors.fill} stroke={colors.stroke} strokeWidth={2} />
          <circle cx={half - 10} cy={half - 2} r={12} fill={colors.fill} stroke={colors.stroke} strokeWidth={2} />
          <circle cx={half + 6} cy={half - 6} r={14} fill={colors.fill} stroke={colors.stroke} strokeWidth={2} />
        </g>
      )
    default:
      return <rect x={4} y={4} width={size - 8} height={size - 8} fill={colors.fill} />
  }
}

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
              <DeviceShape type={type} size={48} />
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
