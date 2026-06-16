export const DEVICE_TYPES = {
  SERVER: 'server',
  ROUTER: 'router',
  SWITCH: 'switch',
  FIREWALL: 'firewall',
  WORKSTATION: 'workstation',
  CLOUD: 'cloud',
}

export const DEVICE_TYPE_LABELS = {
  [DEVICE_TYPES.SERVER]: '服务器',
  [DEVICE_TYPES.ROUTER]: '路由器',
  [DEVICE_TYPES.SWITCH]: '交换机',
  [DEVICE_TYPES.FIREWALL]: '防火墙',
  [DEVICE_TYPES.WORKSTATION]: '工作站',
  [DEVICE_TYPES.CLOUD]: '云服务',
}

export const DEVICE_TYPE_ICONS = {
  [DEVICE_TYPES.SERVER]: '🖥️',
  [DEVICE_TYPES.ROUTER]: '🔀',
  [DEVICE_TYPES.SWITCH]: '🔌',
  [DEVICE_TYPES.FIREWALL]: '🛡️',
  [DEVICE_TYPES.WORKSTATION]: '💻',
  [DEVICE_TYPES.CLOUD]: '☁️',
}

export const DEVICE_TYPE_SHAPES = {
  [DEVICE_TYPES.SERVER]: 'rect',
  [DEVICE_TYPES.ROUTER]: 'circle',
  [DEVICE_TYPES.SWITCH]: 'square',
  [DEVICE_TYPES.FIREWALL]: 'hexagon',
  [DEVICE_TYPES.WORKSTATION]: 'diamond',
  [DEVICE_TYPES.CLOUD]: 'cloud',
}

export const DEVICE_TYPE_COLORS = {
  [DEVICE_TYPES.SERVER]: { fill: '#3B82F6', stroke: '#1D4ED8', border: '#2563EB' },
  [DEVICE_TYPES.ROUTER]: { fill: '#F97316', stroke: '#C2410C', border: '#EA580C' },
  [DEVICE_TYPES.SWITCH]: { fill: '#10B981', stroke: '#047857', border: '#059669' },
  [DEVICE_TYPES.FIREWALL]: { fill: '#EF4444', stroke: '#B91C1C', border: '#DC2626' },
  [DEVICE_TYPES.WORKSTATION]: { fill: '#8B5CF6', stroke: '#6D28D9', border: '#7C3AED' },
  [DEVICE_TYPES.CLOUD]: { fill: '#06B6D4', stroke: '#0E7490', border: '#0891B2' },
}

export const DEVICE_TYPE_DEFAULT_NAMES = {
  [DEVICE_TYPES.SERVER]: '服务器',
  [DEVICE_TYPES.ROUTER]: '路由器',
  [DEVICE_TYPES.SWITCH]: '交换机',
  [DEVICE_TYPES.FIREWALL]: '防火墙',
  [DEVICE_TYPES.WORKSTATION]: '工作站',
  [DEVICE_TYPES.CLOUD]: '云服务',
}

export const NODE_WIDTH = 120
export const NODE_HEIGHT = 80
export const PORT_RADIUS = 6
export const PORT_GAP = 8

export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 4
export const DEFAULT_ZOOM = 1

export const LINE_STYLES = {
  SOLID: 'solid',
  DASHED: 'dashed',
}

export const LINE_STYLE_LABELS = {
  [LINE_STYLES.SOLID]: '实线',
  [LINE_STYLES.DASHED]: '虚线',
}

export const LINE_CURVE_STYLES = {
  BEZIER: 'bezier',
  STRAIGHT: 'straight',
}

export const LINE_CURVE_STYLE_LABELS = {
  [LINE_CURVE_STYLES.BEZIER]: '曲线',
  [LINE_CURVE_STYLES.STRAIGHT]: '直线',
}

export const DEFAULT_LINE_WIDTH = 2
export const MIN_LINE_WIDTH = 1
export const MAX_LINE_WIDTH = 8

export const LAYOUT_DIRECTION = {
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
}

export const LAYOUT_DIRECTION_LABELS = {
  [LAYOUT_DIRECTION.VERTICAL]: '垂直布局',
  [LAYOUT_DIRECTION.HORIZONTAL]: '水平布局',
}

export const STORAGE_KEY = 'network-topology-state'

export const DATA_VERSION = '1.0'
