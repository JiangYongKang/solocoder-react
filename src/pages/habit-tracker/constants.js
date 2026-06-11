export const STORAGE_KEY_HABITS = 'habit_tracker_habits'
export const STORAGE_KEY_CHECKINS = 'habit_tracker_checkins'
export const STORAGE_KEY_REMINDERS = 'habit_tracker_reminders'

export const HABIT_ICONS = ['🏃', '📚', '💧', '🧘', '🎸', '✍️', '💤', '🚿', '🥗']

export const FREQUENCY_TYPES = [
  { type: 'daily', label: '每天' },
  { type: 'weekly', label: '每周 X 次' },
  { type: 'monthly', label: '每月 X 天' },
]

export const REMINDER_TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00',
  '12:00', '14:00', '16:00', '18:00', '20:00',
  '21:00', '22:00',
]

export const MILESTONES = [
  { days: 7, icon: '🌟', label: '7天' },
  { days: 30, icon: '💪', label: '30天' },
  { days: 100, icon: '👑', label: '100天' },
]

export const HEATMAP_CELL_SIZE = 11
export const HEATMAP_GAP = 2
export const HEATMAP_DAY_LABELS = ['', '一', '', '三', '', '五', '']
export const HEATMAP_MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
