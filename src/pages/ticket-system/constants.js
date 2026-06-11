export const TICKET_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
}

export const STATUS_LABELS = {
  [TICKET_STATUSES.PENDING]: '待处理',
  [TICKET_STATUSES.IN_PROGRESS]: '处理中',
  [TICKET_STATUSES.RESOLVED]: '已解决',
  [TICKET_STATUSES.CLOSED]: '已关闭',
}

export const STATUS_ORDER = [
  TICKET_STATUSES.PENDING,
  TICKET_STATUSES.IN_PROGRESS,
  TICKET_STATUSES.RESOLVED,
  TICKET_STATUSES.CLOSED,
]

export const CATEGORIES = {
  TECHNICAL: 'technical',
  ACCOUNT: 'account',
  PAYMENT: 'payment',
  PRODUCT: 'product',
  COMPLAINT: 'complaint',
  OTHER: 'other',
}

export const CATEGORY_LABELS = {
  [CATEGORIES.TECHNICAL]: '技术问题',
  [CATEGORIES.ACCOUNT]: '账户问题',
  [CATEGORIES.PAYMENT]: '支付问题',
  [CATEGORIES.PRODUCT]: '产品咨询',
  [CATEGORIES.COMPLAINT]: '投诉建议',
  [CATEGORIES.OTHER]: '其他',
}

export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
}

export const PRIORITY_LABELS = {
  [PRIORITIES.LOW]: '低',
  [PRIORITIES.MEDIUM]: '中',
  [PRIORITIES.HIGH]: '高',
  [PRIORITIES.URGENT]: '紧急',
}

export const PRIORITY_ORDER = [
  PRIORITIES.URGENT,
  PRIORITIES.HIGH,
  PRIORITIES.MEDIUM,
  PRIORITIES.LOW,
]

export const SLA_HOURS = {
  [PRIORITIES.LOW]: 48,
  [PRIORITIES.MEDIUM]: 24,
  [PRIORITIES.HIGH]: 8,
  [PRIORITIES.URGENT]: 2,
}

export const STORAGE_KEY = 'ticket_system_tickets'

export const PAGE_SIZE = 10

export const TIMELINE_TYPES = {
  CREATED: 'created',
  STATUS_CHANGE: 'status_change',
  COMMENT: 'comment',
}

export const TIMELINE_ICONS = {
  [TIMELINE_TYPES.CREATED]: 'circle',
  [TIMELINE_TYPES.STATUS_CHANGE]: 'arrow',
  [TIMELINE_TYPES.COMMENT]: 'comment',
}
