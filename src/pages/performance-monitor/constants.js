export const METRIC_TYPES = {
  FPS: 'fps',
  MEMORY: 'memory',
  CPU: 'cpu',
}

export const METRIC_LABELS = {
  [METRIC_TYPES.FPS]: 'FPS',
  [METRIC_TYPES.MEMORY]: '内存',
  [METRIC_TYPES.CPU]: 'CPU',
}

export const METRIC_UNITS = {
  [METRIC_TYPES.FPS]: '帧',
  [METRIC_TYPES.MEMORY]: 'MB',
  [METRIC_TYPES.CPU]: '%',
}

export const METRIC_RANGES = {
  [METRIC_TYPES.FPS]: { min: 0, max: 60 },
  [METRIC_TYPES.MEMORY]: { min: 0, max: 1024 },
  [METRIC_TYPES.CPU]: { min: 0, max: 100 },
}

export const FPS_COLOR_ZONES = [
  { from: 0, to: 15, color: '#ef4444', label: '严重卡顿' },
  { from: 15, to: 30, color: '#f59e0b', label: '卡顿' },
  { from: 30, to: 60, color: '#10b981', label: '流畅' },
]

export const ALERT_CONDITIONS = {
  LESS_THAN: 'less_than',
  GREATER_THAN: 'greater_than',
}

export const ALERT_CONDITION_LABELS = {
  [ALERT_CONDITIONS.LESS_THAN]: '低于',
  [ALERT_CONDITIONS.GREATER_THAN]: '高于',
}

export const ALERT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
}

export const WATERFALL_PHASES = [
  { key: 'dns', name: 'DNS 解析', color: '#6366f1' },
  { key: 'tcp', name: 'TCP 连接', color: '#8b5cf6' },
  { key: 'ssl', name: 'SSL 握手', color: '#a855f7' },
  { key: 'request', name: '请求发送', color: '#ec4899' },
  { key: 'ttfb', name: '等待响应(TTFB)', color: '#f43f5e' },
  { key: 'download', name: '内容下载', color: '#ef4444' },
  { key: 'dom', name: 'DOM 解析', color: '#f97316' },
  { key: 'resource', name: '资源加载', color: '#eab308' },
  { key: 'fp', name: '首次渲染(FP)', color: '#84cc16' },
  { key: 'fcp', name: '首次内容渲染(FCP)', color: '#22c55e' },
]

export const RESOURCE_TYPES = {
  JS: 'js',
  CSS: 'css',
  IMAGE: 'image',
  FONT: 'font',
  HTML: 'html',
  OTHER: 'other',
}

export const RESOURCE_TYPE_LABELS = {
  [RESOURCE_TYPES.JS]: 'JS',
  [RESOURCE_TYPES.CSS]: 'CSS',
  [RESOURCE_TYPES.IMAGE]: '图片',
  [RESOURCE_TYPES.FONT]: '字体',
  [RESOURCE_TYPES.HTML]: 'HTML',
  [RESOURCE_TYPES.OTHER]: '其他',
}

export const RESOURCE_TYPE_COLORS = {
  [RESOURCE_TYPES.JS]: '#f7b955',
  [RESOURCE_TYPES.CSS]: '#519aba',
  [RESOURCE_TYPES.IMAGE]: '#e06c75',
  [RESOURCE_TYPES.FONT]: '#98c379',
  [RESOURCE_TYPES.HTML]: '#e06c6c',
  [RESOURCE_TYPES.OTHER]: '#c678dd',
}

export const SIMULATION_RANGES = {
  fps: { min: 15, max: 60, baseline: 45, volatility: 8 },
  memory: { min: 50, max: 800, baseline: 300, volatility: 50 },
  cpu: { min: 5, max: 100, baseline: 30, volatility: 15 },
}

export const SMOOTHING_FACTOR = 0.3
export const DATA_INTERVAL_MS = 1000
export const MAX_ALERT_HISTORY = 200

export const WATERFALL_PHASE_TIME_RANGES = {
  dns: { min: 5, max: 50 },
  tcp: { min: 10, max: 80 },
  ssl: { min: 20, max: 150 },
  request: { min: 1, max: 10 },
  ttfb: { min: 50, max: 500 },
  download: { min: 20, max: 300 },
  dom: { min: 50, max: 400 },
  resource: { min: 100, max: 800 },
  fp: { min: 200, max: 800 },
  fcp: { min: 300, max: 1000 },
}
