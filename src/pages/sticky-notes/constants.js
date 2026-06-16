export const STORAGE_KEY_NOTES = 'sticky_notes_data'
export const STORAGE_KEY_VIEW = 'sticky_notes_view'
export const STORAGE_KEY_TRASH = 'sticky_notes_trash'
export const STORAGE_KEY_ARCHIVE = 'sticky_notes_archive'

export const NOTE_COLORS = [
  '#fff3cd',
  '#d1ecf1',
  '#d4edda',
  '#f8d7da',
  '#e2e3e5',
  '#d6d8db',
  '#c3e6cb',
  '#ffeeba',
]

export const DEFAULT_TAGS = ['工作', '个人', '学习', '紧急', '待办']

export const TAG_COLORS = {
  '工作': '#3b82f6',
  '个人': '#10b981',
  '学习': '#f59e0b',
  '紧急': '#ef4444',
  '待办': '#8b5cf6',
}

export const VIEW_GRID = 'grid'
export const VIEW_LIST = 'list'

export const TRASH_RETENTION_DAYS = 30

export const EXPIRE_OPTIONS = [
  { label: '3天后', value: '3days' },
  { label: '1周后', value: '1week' },
  { label: '2周后', value: '2weeks' },
  { label: '1个月后', value: '1month' },
  { label: '自定义日期', value: 'custom' },
]

export const VIEW_MAIN = 'main'
export const VIEW_ARCHIVE = 'archive'
export const VIEW_TRASH = 'trash'

export const REMINDER_STATUS_PENDING = 'pending'
export const REMINDER_STATUS_TRIGGERED = 'triggered'
export const REMINDER_STATUS_DISMISSED = 'dismissed'
