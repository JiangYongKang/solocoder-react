export const STORAGE_KEY = 'solocoder_calendar_events'

export const VIEW_TYPES = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
}

export const VIEW_LABELS = {
  [VIEW_TYPES.DAY]: '日视图',
  [VIEW_TYPES.WEEK]: '周视图',
  [VIEW_TYPES.MONTH]: '月视图',
}

export const CATEGORIES = [
  { id: 'work', label: '工作', color: '#3b82f6' },
  { id: 'personal', label: '个人', color: '#10b981' },
  { id: 'meeting', label: '会议', color: '#f59e0b' },
  { id: 'study', label: '学习', color: '#8b5cf6' },
  { id: 'other', label: '其他', color: '#6b7280' },
]

export const COLORS = CATEGORIES.map((c) => c.color)

export const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export const HOURS = Array.from({ length: 24 }, (_, i) => i)

export const SLOT_MINUTES = 30

export const MIN_EVENT_MINUTES = 15
