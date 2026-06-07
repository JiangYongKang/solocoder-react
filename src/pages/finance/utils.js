import {
  STORAGE_KEY_TRANSACTIONS,
  STORAGE_KEY_BUDGETS,
  TRANSACTION_TYPES,
  EXPENSE_CATEGORY_KEYS,
  PAGE_SIZE,
  getCategoryType,
  CATEGORY_MAP,
} from './constants'

export function generateId() {
  return 'tx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatCurrency(value) {
  const num = Number(value) || 0
  return '¥' + num.toFixed(2)
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getMonthKey(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function getCurrentMonthKey() {
  return getMonthKey(new Date().toISOString())
}

export function getLast6Months() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: getMonthKey(d.toISOString()),
      label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    })
  }
  return months
}

export function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions))
    return true
  } catch {
    return false
  }
}

export function validateTransaction(data) {
  const errors = {}
  const amount = Number(data.amount)
  if (data.amount === undefined || data.amount === null || data.amount === '') {
    errors.amount = '请输入金额'
  } else if (isNaN(amount) || amount <= 0) {
    errors.amount = '金额必须是正数'
  }
  if (!data.category) {
    errors.category = '请选择分类'
  } else if (!getCategoryType(data.category)) {
    errors.category = '分类无效'
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

export function createTransaction(transactions, data) {
  const errors = validateTransaction(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const categoryType = getCategoryType(data.category)
  const newTx = {
    id: generateId(),
    amount: Number(data.amount),
    category: data.category,
    type: categoryType,
    date: formatDate(data.date),
    note: (data.note || '').trim(),
    createdAt: Date.now(),
  }
  const updated = [newTx, ...transactions]
  return { success: true, transaction: newTx, transactions: updated }
}

export function updateTransaction(transactions, id, data) {
  const errors = validateTransaction(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const index = transactions.findIndex((t) => t.id === id)
  if (index === -1) {
    return { success: false, errors: { id: '记录不存在' } }
  }
  const categoryType = getCategoryType(data.category)
  const updated = [...transactions]
  updated[index] = {
    ...updated[index],
    amount: Number(data.amount),
    category: data.category,
    type: categoryType,
    date: formatDate(data.date),
    note: (data.note || '').trim(),
  }
  return { success: true, transaction: updated[index], transactions: updated }
}

export function deleteTransaction(transactions, id) {
  const exists = transactions.some((t) => t.id === id)
  if (!exists) {
    return { success: false, transactions }
  }
  return { success: true, transactions: transactions.filter((t) => t.id !== id) }
}

export function filterTransactions(transactions, options = {}) {
  let result = [...transactions]

  if (options.month) {
    result = result.filter((t) => getMonthKey(t.date) === options.month)
  }

  if (options.type) {
    result = result.filter((t) => t.type === options.type)
  }

  if (options.category && options.category !== 'all') {
    result = result.filter((t) => t.category === options.category)
  }

  if (options.keyword && options.keyword.trim()) {
    const kw = options.keyword.trim().toLowerCase()
    result = result.filter((t) => {
      if (t.note && t.note.toLowerCase().includes(kw)) return true
      const cat = CATEGORY_MAP[t.category]
      if (cat && cat.label.toLowerCase().includes(kw)) return true
      return false
    })
  }

  return result
}

export function sortTransactions(transactions, sortBy = 'date', sortOrder = 'desc') {
  const order = sortOrder === 'desc' ? -1 : 1
  return [...transactions].sort((a, b) => {
    if (sortBy === 'date') {
      return (new Date(a.date) - new Date(b.date)) * order
    }
    if (sortBy === 'amount') {
      return (a.amount - b.amount) * order
    }
    if (sortBy === 'createdAt') {
      return (a.createdAt - b.createdAt) * order
    }
    return 0
  })
}

export function paginateTransactions(transactions, page, pageSize = PAGE_SIZE) {
  const totalPage = Math.max(1, Math.ceil(transactions.length / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: transactions.slice(start, end),
    total: transactions.length,
    totalPage,
    currentPage,
    pageSize,
  }
}

export function getTransactionList(transactions, options = {}) {
  let result = filterTransactions(transactions, options)
  result = sortTransactions(result, options.sortBy || 'date', options.sortOrder || 'desc')
  return paginateTransactions(result, options.page || 1, options.pageSize || PAGE_SIZE)
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

export function setBudget(budgets, monthKey, categoryKey, amount) {
  const numAmount = Number(amount)
  if (isNaN(numAmount) || numAmount < 0) {
    return { success: false, error: '预算金额必须是非负数' }
  }
  if (!EXPENSE_CATEGORY_KEYS.includes(categoryKey)) {
    return { success: false, error: '只能为支出分类设置预算' }
  }
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

export function getBudget(budgets, monthKey, categoryKey) {
  return budgets[monthKey]?.[categoryKey] || 0
}

export function calculateCategorySpent(transactions, monthKey, categoryKey) {
  return transactions
    .filter((t) => {
      if (t.type !== TRANSACTION_TYPES.EXPENSE) return false
      if (getMonthKey(t.date) !== monthKey) return false
      if (categoryKey && t.category !== categoryKey) return false
      return true
    })
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getBudgetProgressList(transactions, budgets, monthKey) {
  return EXPENSE_CATEGORY_KEYS.map((catKey) => {
    const budget = getBudget(budgets, monthKey, catKey)
    const spent = calculateCategorySpent(transactions, monthKey, catKey)
    const percent = budget > 0 ? Math.min((spent / budget) * 100, 999) : 0
    const isOverBudget = budget > 0 && spent > budget
    return {
      categoryKey: catKey,
      categoryLabel: CATEGORY_MAP[catKey]?.label || catKey,
      budget,
      spent,
      percent,
      isOverBudget,
    }
  })
}

export function calculateMonthlySummary(transactions, monthKey) {
  let income = 0
  let expense = 0
  transactions.forEach((t) => {
    if (getMonthKey(t.date) !== monthKey) return
    if (t.type === TRANSACTION_TYPES.INCOME) income += t.amount
    if (t.type === TRANSACTION_TYPES.EXPENSE) expense += t.amount
  })
  return {
    income,
    expense,
    balance: income - expense,
  }
}

export function buildTrendData(transactions) {
  const months = getLast6Months()
  return months.map((m) => {
    const summary = calculateMonthlySummary(transactions, m.key)
    return {
      month: m.label.slice(5),
      income: Number(summary.income.toFixed(2)),
      expense: Number(summary.expense.toFixed(2)),
    }
  })
}

export function buildPieData(transactions, monthKey) {
  const categoryTotals = {}
  transactions
    .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE && getMonthKey(t.date) === monthKey)
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
    })
  const result = Object.entries(categoryTotals)
    .map(([key, value]) => ({
      name: CATEGORY_MAP[key]?.label || key,
      value: Number(value.toFixed(2)),
    }))
    .sort((a, b) => b.value - a.value)
  return result
}
