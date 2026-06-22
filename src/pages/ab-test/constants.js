export const EXPERIMENT_STATUS = {
  NOT_STARTED: 'not_started',
  RUNNING: 'running',
  ENDED: 'ended',
}

export const EXPERIMENT_STATUS_LABELS = {
  [EXPERIMENT_STATUS.NOT_STARTED]: '未启动',
  [EXPERIMENT_STATUS.RUNNING]: '运行中',
  [EXPERIMENT_STATUS.ENDED]: '已结束',
}

export const EXPERIMENT_STATUS_COLORS = {
  [EXPERIMENT_STATUS.NOT_STARTED]: '#6b7280',
  [EXPERIMENT_STATUS.RUNNING]: '#10b981',
  [EXPERIMENT_STATUS.ENDED]: '#ef4444',
}

export const METRICS = [
  { key: 'click_rate', label: '点击率', unit: '%', baseValue: 5 },
  { key: 'conversion_rate', label: '转化率', unit: '%', baseValue: 2 },
  { key: 'stay_duration', label: '页面停留时长', unit: 's', baseValue: 120 },
  { key: 'bounce_rate', label: '跳出率', unit: '%', baseValue: 40 },
]

export const METRIC_KEYS = METRICS.map((m) => m.key)

export const GROUP_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
]

export const STORAGE_KEY_EXPERIMENTS = 'ab_test_experiments'

export const DATA_REFRESH_INTERVAL = 3000

export const DATA_DAYS = 7

export const P_VALUE_THRESHOLD = 0.05
