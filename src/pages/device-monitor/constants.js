export const DEVICE_STORAGE_KEY = 'device_monitor_devices'
export const ALERT_RULE_STORAGE_KEY = 'device_monitor_alert_rules'
export const ALERT_RECORD_STORAGE_KEY = 'device_monitor_alert_records'

export const DEVICE_TYPES = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  ACCESS: 'access',
  CAMERA: 'camera',
  GATEWAY: 'gateway',
}

export const DEVICE_TYPE_LABELS = {
  [DEVICE_TYPES.TEMPERATURE]: '温度传感器',
  [DEVICE_TYPES.HUMIDITY]: '湿度传感器',
  [DEVICE_TYPES.ACCESS]: '门禁设备',
  [DEVICE_TYPES.CAMERA]: '摄像头',
  [DEVICE_TYPES.GATEWAY]: '网关设备',
}

export const DEVICE_TYPE_ICONS = {
  [DEVICE_TYPES.TEMPERATURE]: '🌡️',
  [DEVICE_TYPES.HUMIDITY]: '💧',
  [DEVICE_TYPES.ACCESS]: '🚪',
  [DEVICE_TYPES.CAMERA]: '📷',
  [DEVICE_TYPES.GATEWAY]: '📡',
}

export const DEVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  ALERT: 'alert',
}

export const DEVICE_STATUS_LABELS = {
  [DEVICE_STATUS.ONLINE]: '在线',
  [DEVICE_STATUS.OFFLINE]: '离线',
  [DEVICE_STATUS.ALERT]: '告警',
}

export const METRIC_TYPES = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  ACCESS_STATE: 'accessState',
  CAMERA_STATUS: 'cameraStatus',
  NETWORK_QUALITY: 'networkQuality',
}

export const METRIC_LABELS = {
  [METRIC_TYPES.TEMPERATURE]: '温度',
  [METRIC_TYPES.HUMIDITY]: '湿度',
  [METRIC_TYPES.ACCESS_STATE]: '开关状态',
  [METRIC_TYPES.CAMERA_STATUS]: '摄像头状态',
  [METRIC_TYPES.NETWORK_QUALITY]: '网络质量',
}

export const METRIC_UNITS = {
  [METRIC_TYPES.TEMPERATURE]: '°C',
  [METRIC_TYPES.HUMIDITY]: '%',
  [METRIC_TYPES.ACCESS_STATE]: '',
  [METRIC_TYPES.CAMERA_STATUS]: '',
  [METRIC_TYPES.NETWORK_QUALITY]: '%',
}

export const DEVICE_METRIC_MAP = {
  [DEVICE_TYPES.TEMPERATURE]: METRIC_TYPES.TEMPERATURE,
  [DEVICE_TYPES.HUMIDITY]: METRIC_TYPES.HUMIDITY,
  [DEVICE_TYPES.ACCESS]: METRIC_TYPES.ACCESS_STATE,
  [DEVICE_TYPES.CAMERA]: METRIC_TYPES.CAMERA_STATUS,
  [DEVICE_TYPES.GATEWAY]: METRIC_TYPES.NETWORK_QUALITY,
}

export const ALERT_CONDITIONS = {
  GREATER_THAN: 'gt',
  LESS_THAN: 'lt',
  EQUAL: 'eq',
}

export const ALERT_CONDITION_LABELS = {
  [ALERT_CONDITIONS.GREATER_THAN]: '大于',
  [ALERT_CONDITIONS.LESS_THAN]: '小于',
  [ALERT_CONDITIONS.EQUAL]: '等于',
}

export const ALERT_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
}

export const ALERT_LEVEL_LABELS = {
  [ALERT_LEVELS.INFO]: '提示',
  [ALERT_LEVELS.WARNING]: '警告',
  [ALERT_LEVELS.CRITICAL]: '严重',
}

export const ALERT_LEVEL_COLORS = {
  [ALERT_LEVELS.INFO]: '#1890ff',
  [ALERT_LEVELS.WARNING]: '#fa8c16',
  [ALERT_LEVELS.CRITICAL]: '#f5222d',
}

export const ALERT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  RESOLVED: 'resolved',
}

export const ALERT_STATUS_LABELS = {
  [ALERT_STATUS.PENDING]: '未处理',
  [ALERT_STATUS.CONFIRMED]: '已确认',
  [ALERT_STATUS.RESOLVED]: '已解决',
}

export const DATA_POINT_COUNT = 100
export const DATA_INTERVAL_MS = 3000
export const STATUS_CHANGE_MIN_MS = 10000
export const STATUS_CHANGE_MAX_MS = 30000

export const DEFAULT_METRIC_RANGES = {
  [METRIC_TYPES.TEMPERATURE]: { min: 15, max: 35 },
  [METRIC_TYPES.HUMIDITY]: { min: 30, max: 80 },
  [METRIC_TYPES.ACCESS_STATE]: { min: 0, max: 1 },
  [METRIC_TYPES.CAMERA_STATUS]: { min: 0, max: 1 },
  [METRIC_TYPES.NETWORK_QUALITY]: { min: 50, max: 100 },
}

export const ACCESS_STATE_LABELS = {
  0: '关',
  1: '开',
}

export const CAMERA_STATUS_LABELS = {
  0: '空闲',
  1: '录制中',
}

export const LOCATIONS = [
  '一楼大厅', '一楼走廊', '一楼会议室A', '一楼会议室B',
  '二楼办公区', '二楼机房', '二楼仓库',
  '三楼办公区', '三楼前台', '三楼休息室',
]

export const FIRMWARE_VERSIONS = {
  [DEVICE_TYPES.TEMPERATURE]: ['v1.2.0', 'v1.3.1', 'v2.0.0'],
  [DEVICE_TYPES.HUMIDITY]: ['v1.1.5', 'v1.2.0', 'v1.3.0'],
  [DEVICE_TYPES.ACCESS]: ['v2.1.0', 'v2.2.1', 'v3.0.0'],
  [DEVICE_TYPES.CAMERA]: ['v1.5.0', 'v1.6.2', 'v2.0.1'],
  [DEVICE_TYPES.GATEWAY]: ['v3.0.0', 'v3.1.0', 'v3.2.0'],
}
