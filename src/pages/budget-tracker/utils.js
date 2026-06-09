import {
  STORAGE_KEY_BUDGETS,
  STORAGE_KEY_EXPENSES,
  STORAGE_KEY_ADJUSTMENTS,
  CATEGORY_KEYS,
  CATEGORY_MAP,
  PROGRESS_NORMAL_THRESHOLD,
  PROGRESS_WARNING_THRESHOLD,
  DAILY_BUDGET_WARNING_THRESHOLD,
  ADJUSTMENT_PAGE_SIZE,
} from './constants'

export function generateId() {
  return 'bt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatCurrency(value) {
  const num = Number(value) || 0
  return '¥' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateTime(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

export function getMonthKey(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function getCurrentMonthKey() {
  return getMonthKey(new Date().toISOString())
}

export function getLastMonthKey(monthKey) {
  if (!monthKey) return ''
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return ''
  const d = new Date(year, month - 2, 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function getDaysRemainingInMonth(monthKey) {
  if (!monthKey) return 0
  const now = new Date()
  const currentMonthKey = getCurrentMonthKey()
  if (monthKey !== currentMonthKey) {
    const [year, month] = monthKey.split('-').map(Number)
    const lastDay = new Date(year, month, 0).getDate()
    return lastDay
  }
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Math.max(0, lastDay - now.getDate())
}

export function loadBudgets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUDGETS)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed
  } catch {
    return {}
  }
}

export function saveBudgets(budgets) {
  try {
    localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets))
    return true
  } catch {
    return false
  }
}

export function getBudget(budgets, monthKey, categoryKey) {
  return budgets[monthKey]?.[categoryKey] || 0
}

export function validateBudgetAmount(amount) {
  const num = Number(amount)
  if (amount === undefined || amount === null || amount === '') {
    return '请输入预算金额'
  }
  if (isNaN(num) || num < 0) {
    return '预算金额必须是非负数'
  }
  return null
}

export function setBudget(budgets, monthKey, categoryKey, amount) {
  const error = validateBudgetAmount(amount)
  if (error) {
    return { success: false, error }
  }
  if (!CATEGORY_KEYS.includes(categoryKey)) {
    return { success: false, error: '无效的分类' }
  }
  const numAmount = Number(amount)
  const monthBudgets = { ...(budgets[monthKey] || {}) }
  if (numAmount === 0) {
    delete monthBudgets[categoryKey]
  } else {
    monthBudgets[categoryKey] = numAmount
  }
  const updated = { ...budgets }
  if (Object.keys(monthBudgets).length === 0) {
    delete updated[monthKey]
  } else {
    updated[monthKey] = monthBudgets
  }
  return { success: true, budgets: updated }
}

export function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPENSES)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveExpenses(expenses) {
  try {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses))
    return true
  } catch {
    return false
  }
}

export function validateExpense(data) {
  const errors = {}
  const amount = Number(data.amount)
  if (data.amount === undefined || data.amount === null || data.amount === '') {
    errors.amount = '请输入金额'
  } else if (isNaN(amount) || amount <= 0) {
    errors.amount = '金额必须是正数'
  }
  if (!data.category || !CATEGORY_KEYS.includes(data.category)) {
    errors.category = '请选择分类'
  }
  if (!data.date) {
    errors.date = '请选择日期'
  } else if (isNaN(new Date(data.date).getTime())) {
    errors.date = '日期格式无效'
  }
  if (data.note && data.note.length > 200) {
    errors.note = '备注不能超过200个字符'
  }
  return errors
}

export function addExpense(expenses, data) {
  const errors = validateExpense(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const newExpense = {
    id: generateId(),
    amount: Number(data.amount),
    category: data.category,
    date: formatDate(data.date),
    note: (data.note || '').trim(),
    createdAt: Date.now(),
  }
  const updated = [newExpense, ...expenses]
  return { success: true, expense: newExpense, expenses: updated }
}

export function deleteExpense(expenses, id) {
  const exists = expenses.some((e) => e.id === id)
  if (!exists) {
    return { success: false, expenses }
  }
  return { success: true, expenses: expenses.filter((e) => e.id !== id) }
}

export function filterExpensesByMonth(expenses, monthKey) {
  return expenses.filter((e) => getMonthKey(e.date) === monthKey)
}

export function filterExpensesByCategory(expenses, categoryKey) {
  return expenses.filter((e) => e.category === categoryKey)
}

export function calculateCategorySpent(expenses, monthKey, categoryKey) {
  return expenses
    .filter((e) => {
      if (getMonthKey(e.date) !== monthKey) return false
      if (categoryKey && e.category !== categoryKey) return false
      return true
    })
    .reduce((sum, e) => sum + e.amount, 0)
}

export function calculateTotalSpent(expenses, monthKey) {
  return calculateCategorySpent(expenses, monthKey, null)
}

export function calculateTotalBudget(budgets, monthKey) {
  const monthBudgets = budgets[monthKey] || {}
  return Object.values(monthBudgets).reduce((sum, v) => sum + (Number(v) || 0), 0)
}

export function getProgressStatus(percent) {
  if (percent >= PROGRESS_WARNING_THRESHOLD) return 'danger'
  if (percent >= PROGRESS_NORMAL_THRESHOLD) return 'warning'
  return 'normal'
}

export function getCategoryProgress(expenses, budgets, monthKey, categoryKey) {
  const budget = getBudget(budgets, monthKey, categoryKey)
  const spent = calculateCategorySpent(expenses, monthKey, categoryKey)
  const percent = budget > 0 ? Math.min((spent / budget) * 100, 999) : 0
  const status = getProgressStatus(percent)
  const isOverBudget = budget > 0 && spent > budget
  const remaining = Math.max(0, budget - spent)
  const overAmount = isOverBudget ? spent - budget : 0
  return {
    categoryKey,
    categoryLabel: CATEGORY_MAP[categoryKey]?.label || categoryKey,
    categoryIcon: CATEGORY_MAP[categoryKey]?.icon || '📦',
    categoryColor: CATEGORY_MAP[categoryKey]?.color || '#6b7280',
    budget,
    spent,
    percent,
    status,
    isOverBudget,
    remaining,
    overAmount,
  }
}

export function getAllCategoryProgress(expenses, budgets, monthKey) {
  return CATEGORY_KEYS.map((key) => getCategoryProgress(expenses, budgets, monthKey, key))
}

export function calculateRemainingBudget(budgets, expenses, monthKey) {
  const totalBudget = calculateTotalBudget(budgets, monthKey)
  const totalSpent = calculateTotalSpent(expenses, monthKey)
  return Math.max(0, totalBudget - totalSpent)
}

export function calculateDailyBudget(budgets, expenses, monthKey) {
  const remaining = calculateRemainingBudget(budgets, expenses, monthKey)
  const days = getDaysRemainingInMonth(monthKey)
  if (days <= 0) return remaining
  return remaining / days
}

export function isDailyBudgetLow(budgets, expenses, monthKey) {
  const daily = calculateDailyBudget(budgets, expenses, monthKey)
  return daily < DAILY_BUDGET_WARNING_THRESHOLD
}

export function calculateMonthOverMonth(currentAmount, lastAmount) {
  const diff = currentAmount - lastAmount
  let percent = 0
  if (lastAmount > 0) {
    percent = ((currentAmount - lastAmount) / lastAmount) * 100
  } else if (currentAmount > 0) {
    percent = 100
  }
  return {
    diff,
    percent: Number(percent.toFixed(2)),
    isIncrease: diff > 0,
    isDecrease: diff < 0,
    isSame: diff === 0,
  }
}

export function getCategoryMoM(expenses, budgets, currentMonth, categoryKey) {
  const lastMonth = getLastMonthKey(currentMonth)
  const currentSpent = calculateCategorySpent(expenses, currentMonth, categoryKey)
  const lastSpent = calculateCategorySpent(expenses, lastMonth, categoryKey)
  return {
    categoryKey,
    categoryLabel: CATEGORY_MAP[categoryKey]?.label || categoryKey,
    categoryIcon: CATEGORY_MAP[categoryKey]?.icon || '📦',
    currentSpent,
    lastSpent,
    ...calculateMonthOverMonth(currentSpent, lastSpent),
  }
}

export function getAllCategoryMoM(expenses, budgets, monthKey) {
  return CATEGORY_KEYS.map((key) => getCategoryMoM(expenses, budgets, monthKey, key))
}

export function getTotalMoM(expenses, monthKey) {
  const lastMonth = getLastMonthKey(monthKey)
  const currentSpent = calculateTotalSpent(expenses, monthKey)
  const lastSpent = calculateTotalSpent(expenses, lastMonth)
  return {
    currentSpent,
    lastSpent,
    ...calculateMonthOverMonth(currentSpent, lastSpent),
  }
}

export function loadAdjustments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADJUSTMENTS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveAdjustments(adjustments) {
  try {
    localStorage.setItem(STORAGE_KEY_ADJUSTMENTS, JSON.stringify(adjustments))
    return true
  } catch {
    return false
  }
}

export function addAdjustment(adjustments, data) {
  if (!data.categoryKey || !CATEGORY_KEYS.includes(data.categoryKey)) {
    return { success: false, error: '无效的分类' }
  }
  if (data.oldBudget === undefined || data.oldBudget === null) {
    return { success: false, error: '缺少原预算' }
  }
  if (data.newBudget === undefined || data.newBudget === null) {
    return { success: false, error: '缺少新预算' }
  }
  const oldBudget = Number(data.oldBudget) || 0
  const newBudget = Number(data.newBudget) || 0
  const newRecord = {
    id: generateId(),
    categoryKey: data.categoryKey,
    categoryLabel: CATEGORY_MAP[data.categoryKey]?.label || data.categoryKey,
    categoryIcon: CATEGORY_MAP[data.categoryKey]?.icon || '📦',
    oldBudget,
    newBudget,
    diff: newBudget - oldBudget,
    monthKey: data.monthKey || getCurrentMonthKey(),
    createdAt: Date.now(),
  }
  const updated = [newRecord, ...adjustments]
  return { success: true, adjustment: newRecord, adjustments: updated }
}

export function sortAdjustmentsByTime(adjustments, order = 'desc') {
  const o = order === 'asc' ? 1 : -1
  return [...adjustments].sort((a, b) => (a.createdAt - b.createdAt) * o)
}

export function paginateAdjustments(adjustments, page, pageSize = ADJUSTMENT_PAGE_SIZE) {
  const sorted = sortAdjustmentsByTime(adjustments)
  const totalPage = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: sorted.slice(start, end),
    total: sorted.length,
    totalPage,
    currentPage,
    pageSize,
  }
}
