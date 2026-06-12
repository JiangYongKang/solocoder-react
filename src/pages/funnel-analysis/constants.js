export const STORAGE_KEY = 'funnel-analysis-data'

export const MIN_STEPS = 3
export const MAX_STEPS = 10
export const MAX_GROUPS = 5

export const DEFAULT_STEPS = [
  { id: 's1', name: '页面访问' },
  { id: 's2', name: '注册' },
  { id: 's3', name: '加购' },
  { id: 's4', name: '下单' },
  { id: 's5', name: '支付' },
]

export const GROUP_COLORS = [
  { primary: '#4f6ef7', light: '#8fa4f9', label: '蓝色' },
  { primary: '#f56565', light: '#fc8181', label: '红色' },
  { primary: '#38b2ac', light: '#68d5ce', label: '青色' },
  { primary: '#ed8936', light: '#f6ad55', label: '橙色' },
  { primary: '#9f7aea', light: '#b794f4', label: '紫色' },
]

export const DATE_PRESETS = [
  { key: 'last7', label: '最近 7 天', days: 7 },
  { key: 'last30', label: '最近 30 天', days: 30 },
  { key: 'thisMonth', label: '本月' },
  { key: 'thisQuarter', label: '本季度' },
]

export const DROP_OFF_LEVELS = {
  HIGH: { threshold: 50, color: '#e53e3e', label: '高' },
  MEDIUM: { threshold: 30, color: '#dd6b20', label: '中' },
  LOW: { threshold: 0, color: '#a0aec0', label: '低' },
}

export const DROP_OFF_CAUSES = [
  '该环节可能存在用户体验问题，建议优化交互流程',
  '表单填写过于繁琐，用户可能中途放弃',
  '页面加载速度过慢，导致用户流失',
  '功能引导不够清晰，用户未能理解操作方式',
  '价格或费用信息不透明，用户产生疑虑',
  '缺少信任背书，用户对安全性存在顾虑',
]
