export const REGIONS = [
  { id: 'east', name: '华东', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', server: 'ecs-east-01' },
  { id: 'north', name: '华北', color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)', server: 'ecs-north-01' },
  { id: 'south', name: '华南', color: '#10b981', bg: 'rgba(16,185,129,0.10)', server: 'ecs-south-01' },
  { id: 'west', name: '西南', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', server: 'ecs-west-01' },
  { id: 'overseas', name: '海外', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', server: 'ecs-overseas-01' },
]

export const ALERT_LEVELS = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
}

export const ALERT_LEVEL_CONFIG = {
  [ALERT_LEVELS.CRITICAL]: { label: '严重', color: '#ef4444', icon: '🔴' },
  [ALERT_LEVELS.WARNING]: { label: '警告', color: '#f59e0b', icon: '🟡' },
  [ALERT_LEVELS.INFO]: { label: '信息', color: '#3b82f6', icon: '🔵' },
}

export const METRIC_TYPES = {
  CPU: 'cpu',
  MEMORY: 'memory',
  DISK: 'disk',
}

export const METRIC_LABELS = {
  [METRIC_TYPES.CPU]: 'CPU',
  [METRIC_TYPES.MEMORY]: '内存',
  [METRIC_TYPES.DISK]: '磁盘',
}

export const METRIC_COLORS = {
  [METRIC_TYPES.CPU]: '#3b82f6',
  [METRIC_TYPES.MEMORY]: '#8b5cf6',
  [METRIC_TYPES.DISK]: '#10b981',
}

export const HEALTH_WEIGHTS = {
  [METRIC_TYPES.CPU]: 0.4,
  [METRIC_TYPES.MEMORY]: 0.35,
  [METRIC_TYPES.DISK]: 0.25,
}

export const DATA_REFRESH_INTERVAL = 5000
export const CARD_REFRESH_INTERVAL = 10000
export const TREND_APPEND_INTERVAL = 5000
export const MAX_ALERT_COUNT = 50
export const SILENCE_DURATION = 5 * 60 * 1000
export const TREND_TIME_RANGE_MS = 30 * 60 * 1000
export const TREND_DATA_POINT_INTERVAL = 5000
export const MAX_TREND_POINTS = Math.ceil(TREND_TIME_RANGE_MS / TREND_DATA_POINT_INTERVAL)

export const AUTO_REFRESH_STORAGE_KEY = 'cloud-monitor-auto-refresh'

export const ALERT_TITLES = [
  'CPU 使用率过高',
  '内存使用率过高',
  '磁盘空间不足',
  '网络延迟异常',
  '实例响应超时',
  '连接池耗尽',
  '磁盘 I/O 过高',
  '负载均衡异常',
  '服务健康检查失败',
  '带宽使用率过高',
]

export const ALERT_RESOURCES = [
  'ecs-prod-01',
  'ecs-prod-02',
  'rds-master',
  'rds-slave-01',
  'oss-bucket-main',
  'cdn-edge-node',
  'slb-public',
  'redis-cluster',
  'mq-broker-01',
  'nas-storage',
]
