export const STORAGE_KEY_TRANSACTIONS = 'finance_transactions'
export const STORAGE_KEY_BUDGETS = 'finance_budgets'

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
}

export const INCOME_CATEGORIES = [
  { key: 'salary', label: '工资', icon: '💰' },
  { key: 'investment', label: '理财', icon: '📈' },
  { key: 'bonus', label: '奖金', icon: '🎁' },
  { key: 'parttime', label: '兼职', icon: '💼' },
  { key: 'other_income', label: '其他收入', icon: '📦' },
]

export const EXPENSE_CATEGORIES = [
  { key: 'food', label: '餐饮', icon: '🍜' },
  { key: 'transport', label: '交通', icon: '🚗' },
  { key: 'shopping', label: '购物', icon: '🛒' },
  { key: 'entertainment', label: '娱乐', icon: '🎮' },
  { key: 'housing', label: '居住', icon: '🏠' },
  { key: 'medical', label: '医疗', icon: '💊' },
  { key: 'education', label: '教育', icon: '📚' },
  { key: 'other_expense', label: '其他支出', icon: '📦' },
]

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

export const CATEGORY_MAP = ALL_CATEGORIES.reduce((map, cat) => {
  map[cat.key] = cat
  return map
}, {})

export const INCOME_CATEGORY_KEYS = INCOME_CATEGORIES.map((c) => c.key)
export const EXPENSE_CATEGORY_KEYS = EXPENSE_CATEGORIES.map((c) => c.key)

export const PAGE_SIZE = 10

export function getCategoryType(categoryKey) {
  if (INCOME_CATEGORY_KEYS.includes(categoryKey)) return TRANSACTION_TYPES.INCOME
  if (EXPENSE_CATEGORY_KEYS.includes(categoryKey)) return TRANSACTION_TYPES.EXPENSE
  return null
}
