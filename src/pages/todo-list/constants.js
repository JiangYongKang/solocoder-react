export const STORAGE_KEY_GROUPS = 'todo_list_groups'
export const STORAGE_KEY_TASKS = 'todo_list_tasks'
export const STORAGE_KEY_CHECKINS = 'todo_list_checkins'

export const PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

export const PRIORITY_LABELS = {
  [PRIORITIES.HIGH]: '高',
  [PRIORITIES.MEDIUM]: '中',
  [PRIORITIES.LOW]: '低',
}

export const PRIORITY_COLORS = {
  [PRIORITIES.HIGH]: '#ef4444',
  [PRIORITIES.MEDIUM]: '#f59e0b',
  [PRIORITIES.LOW]: '#9ca3af',
}

export const PRIORITY_BG_COLORS = {
  [PRIORITIES.HIGH]: 'rgba(239, 68, 68, 0.15)',
  [PRIORITIES.MEDIUM]: 'rgba(245, 158, 11, 0.15)',
  [PRIORITIES.LOW]: 'rgba(156, 163, 175, 0.15)',
}

export const GROUP_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
]

export const DEFAULT_GROUPS = [
  { id: 'grp_work', name: '工作', color: '#3b82f6' },
  { id: 'grp_personal', name: '个人', color: '#10b981' },
  { id: 'grp_study', name: '学习', color: '#f59e0b' },
]

export const FILTER_PRIORITY_ALL = 'all'
export const FILTER_STATUS_ALL = 'all'
export const FILTER_STATUS_PENDING = 'pending'
export const FILTER_STATUS_DONE = 'done'
export const FILTER_DUE_ALL = 'all'
export const FILTER_DUE_TODAY = 'today'
export const FILTER_DUE_WEEK = 'week'
export const FILTER_DUE_OVERDUE = 'overdue'

export const ALL_TASKS_VIEW = '__all__'
