export const STORAGE_KEY_BUDGETS = 'budget_tracker_budgets'
export const STORAGE_KEY_EXPENSES = 'budget_tracker_expenses'
export const STORAGE_KEY_ADJUSTMENTS = 'budget_tracker_adjustments'

export const CATEGORIES = [
  { key: 'food', label: '餐饮', icon: '🍜', color: '#ef4444' },
  { key: 'transport', label: '交通', icon: '🚗', color: '#3b82f6' },
  { key: 'shopping', label: '购物', icon: '🛒', color: '#8b5cf6' },
  { key: 'entertainment', label: '娱乐', icon: '🎮', color: '#f59e0b' },
  { key: 'housing', label: '居住', icon: '🏠', color: '#10b981' },
  { key: 'medical', label: '医疗', icon: '💊', color: '#ec4899' },
  { key: 'education', label: '教育', icon: '📚', color: '#06b6d4' },
  { key: 'other', label: '其他', icon: '📦', color: '#6b7280' },
]

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key)

export const CATEGORY_MAP = CATEGORIES.reduce((map, cat) => {
  map[cat.key] = cat
  return map
}, {})

export const PROGRESS_NORMAL_THRESHOLD = 80
export const PROGRESS_WARNING_THRESHOLD = 100

export const DAILY_BUDGET_WARNING_THRESHOLD = 50

export const ADJUSTMENT_PAGE_SIZE = 5
