import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
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
} from '../../budget-tracker/constants'
import {
  generateId,
  formatCurrency,
  formatDate,
  formatDateTime,
  getMonthKey,
  getCurrentMonthKey,
  getLastMonthKey,
  getDaysRemainingInMonth,
  loadBudgets,
  saveBudgets,
  getBudget,
  validateBudgetAmount,
  setBudget,
  loadExpenses,
  saveExpenses,
  validateExpense,
  addExpense,
  deleteExpense,
  filterExpensesByMonth,
  filterExpensesByCategory,
  calculateCategorySpent,
  calculateTotalSpent,
  calculateTotalBudget,
  getProgressStatus,
  getCategoryProgress,
  getAllCategoryProgress,
  calculateRemainingBudget,
  calculateDailyBudget,
  isDailyBudgetLow,
  calculateMonthOverMonth,
  getCategoryMoM,
  getAllCategoryMoM,
  getTotalMoM,
  loadAdjustments,
  saveAdjustments,
  addAdjustment,
  sortAdjustmentsByTime,
  paginateAdjustments,
} from '../../budget-tracker/utils'

const createMockLocalStorage = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

let originalLocalStorage

beforeAll(() => {
  originalLocalStorage = globalThis.localStorage
  globalThis.localStorage = createMockLocalStorage()
})

afterAll(() => {
  globalThis.localStorage = originalLocalStorage
})

describe('generateId', () => {
  it('生成的ID以 bt_ 开头', () => {
    expect(generateId()).toMatch(/^bt_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('formatCurrency', () => {
  it('格式化金额为人民币带千分位', () => {
    expect(formatCurrency(1200)).toBe('¥1,200.00')
    expect(formatCurrency(99)).toBe('¥99.00')
    expect(formatCurrency(0)).toBe('¥0.00')
    expect(formatCurrency(undefined)).toBe('¥0.00')
    expect(formatCurrency('abc')).toBe('¥0.00')
  })
})

describe('formatDate', () => {
  it('格式化日期字符串为 YYYY-MM-DD', () => {
    expect(formatDate('2025-01-15')).toBe('2025-01-15')
    expect(formatDate('2025/01/15')).toBe('2025-01-15')
    expect(formatDate('')).toBe('')
    expect(formatDate('invalid')).toBe('')
  })
})

describe('formatDateTime', () => {
  it('格式化时间戳为日期时间字符串', () => {
    const ts = new Date('2025-01-15T10:30:00').getTime()
    expect(formatDateTime(ts)).toMatch(/^2025-01-15 \d{2}:\d{2}$/)
    expect(formatDateTime('')).toBe('')
    expect(formatDateTime('invalid')).toBe('')
  })
})

describe('getMonthKey', () => {
  it('提取月份 key', () => {
    expect(getMonthKey('2025-01-15')).toBe('2025-01')
    expect(getMonthKey('2025-12-31')).toBe('2025-12')
    expect(getMonthKey('')).toBe('')
    expect(getMonthKey('invalid')).toBe('')
  })
})

describe('getCurrentMonthKey', () => {
  it('返回当前月份的 key', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(getCurrentMonthKey()).toBe(expected)
  })
})

describe('getLastMonthKey', () => {
  it('获取上个月的 key', () => {
    expect(getLastMonthKey('2025-01')).toBe('2024-12')
    expect(getLastMonthKey('2025-06')).toBe('2025-05')
    expect(getLastMonthKey('')).toBe('')
    expect(getLastMonthKey('invalid')).toBe('')
  })
})

describe('getDaysRemainingInMonth', () => {
  it('返回大于等于0的天数', () => {
    const days = getDaysRemainingInMonth('2025-06')
    expect(typeof days).toBe('number')
    expect(days).toBeGreaterThanOrEqual(0)
  })
})

describe('Budget localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveBudgets 保存到 localStorage', () => {
    const budgets = { '2025-01': { food: 1000 } }
    const result = saveBudgets(budgets)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_BUDGETS)).toBe(JSON.stringify(budgets))
  })

  it('loadBudgets 从 localStorage 读取', () => {
    const budgets = { '2025-01': { food: 1000 } }
    localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets))
    const result = loadBudgets()
    expect(result).toEqual(budgets)
  })

  it('loadBudgets localStorage 为空时返回空对象', () => {
    expect(loadBudgets()).toEqual({})
  })

  it('loadBudgets 数据损坏时返回空对象', () => {
    localStorage.setItem(STORAGE_KEY_BUDGETS, 'invalid')
    expect(loadBudgets()).toEqual({})
  })
})

describe('validateBudgetAmount', () => {
  it('空值报错', () => {
    expect(validateBudgetAmount('')).toBeTruthy()
    expect(validateBudgetAmount(undefined)).toBeTruthy()
    expect(validateBudgetAmount(null)).toBeTruthy()
  })

  it('负数报错', () => {
    expect(validateBudgetAmount(-100)).toBeTruthy()
  })

  it('非负数通过', () => {
    expect(validateBudgetAmount(0)).toBeNull()
    expect(validateBudgetAmount(100)).toBeNull()
    expect(validateBudgetAmount('100')).toBeNull()
  })
})

describe('setBudget', () => {
  it('成功设置预算', () => {
    const result = setBudget({}, '2025-01', 'food', 1000)
    expect(result.success).toBe(true)
    expect(result.budgets['2025-01'].food).toBe(1000)
  })

  it('无效金额报错', () => {
    const result = setBudget({}, '2025-01', 'food', -100)
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('无效分类报错', () => {
    const result = setBudget({}, '2025-01', 'invalid', 100)
    expect(result.success).toBe(false)
  })

  it('金额为0时删除该分类预算', () => {
    const budgets = { '2025-01': { food: 1000, transport: 500 } }
    const result = setBudget(budgets, '2025-01', 'food', 0)
    expect(result.budgets['2025-01'].food).toBeUndefined()
    expect(result.budgets['2025-01'].transport).toBe(500)
  })

  it('月份下全为0时删除该月份', () => {
    const budgets = { '2025-01': { food: 1000 } }
    const result = setBudget(budgets, '2025-01', 'food', 0)
    expect(result.budgets['2025-01']).toBeUndefined()
  })
})

describe('getBudget', () => {
  it('获取指定月份分类的预算', () => {
    const budgets = { '2025-01': { food: 1000 } }
    expect(getBudget(budgets, '2025-01', 'food')).toBe(1000)
    expect(getBudget(budgets, '2025-01', 'transport')).toBe(0)
    expect(getBudget(budgets, '2025-02', 'food')).toBe(0)
  })
})

describe('Expense localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveExpenses 保存到 localStorage', () => {
    const expenses = [{ id: '1', amount: 100 }]
    const result = saveExpenses(expenses)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_EXPENSES)).toBe(JSON.stringify(expenses))
  })

  it('loadExpenses 从 localStorage 读取', () => {
    const expenses = [{ id: '1', amount: 100 }]
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses))
    const result = loadExpenses()
    expect(result).toEqual(expenses)
  })

  it('loadExpenses 空时返回空数组', () => {
    expect(loadExpenses()).toEqual([])
  })

  it('loadExpenses 损坏数据返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_EXPENSES, 'invalid')
    expect(loadExpenses()).toEqual([])
  })
})

describe('validateExpense', () => {
  it('数据有效返回空对象', () => {
    const errors = validateExpense({
      amount: 100,
      category: 'food',
      date: '2025-01-15',
      note: '午饭',
    })
    expect(Object.keys(errors).length).toBe(0)
  })

  it('金额为空时报错', () => {
    expect(validateExpense({ amount: '', category: 'food', date: '2025-01-15' }).amount).toBeTruthy()
  })

  it('金额非正数报错', () => {
    expect(validateExpense({ amount: 0, category: 'food', date: '2025-01-15' }).amount).toBeTruthy()
    expect(validateExpense({ amount: -10, category: 'food', date: '2025-01-15' }).amount).toBeTruthy()
  })

  it('分类无效报错', () => {
    expect(validateExpense({ amount: 100, category: '', date: '2025-01-15' }).category).toBeTruthy()
    expect(validateExpense({ amount: 100, category: 'invalid', date: '2025-01-15' }).category).toBeTruthy()
  })

  it('日期无效报错', () => {
    expect(validateExpense({ amount: 100, category: 'food', date: '' }).date).toBeTruthy()
    expect(validateExpense({ amount: 100, category: 'food', date: 'invalid' }).date).toBeTruthy()
  })

  it('备注超过200字符报错', () => {
    const errors = validateExpense({
      amount: 100,
      category: 'food',
      date: '2025-01-15',
      note: 'a'.repeat(201),
    })
    expect(errors.note).toBeTruthy()
  })
})

describe('addExpense', () => {
  it('数据无效返回失败', () => {
    const result = addExpense([], { amount: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功添加消费记录', () => {
    const result = addExpense([], {
      amount: 100,
      category: 'food',
      date: '2025-01-15',
      note: '午饭',
    })
    expect(result.success).toBe(true)
    expect(result.expense.id).toBeTruthy()
    expect(result.expense.amount).toBe(100)
    expect(result.expense.category).toBe('food')
    expect(result.expense.date).toBe('2025-01-15')
    expect(result.expense.note).toBe('午饭')
    expect(result.expense.createdAt).toBeTruthy()
    expect(result.expenses.length).toBe(1)
  })

  it('新记录放在最前面', () => {
    const existing = [{ id: 'old', amount: 50 }]
    const result = addExpense(existing, {
      amount: 100,
      category: 'food',
      date: '2025-01-15',
    })
    expect(result.expenses[0].id).toBe(result.expense.id)
    expect(result.expenses[1].id).toBe('old')
  })

  it('去除备注首尾空格', () => {
    const result = addExpense([], {
      amount: 100,
      category: 'food',
      date: '2025-01-15',
      note: '  午饭  ',
    })
    expect(result.expense.note).toBe('午饭')
  })
})

describe('deleteExpense', () => {
  it('记录不存在返回失败', () => {
    const result = deleteExpense([], 'not-exist')
    expect(result.success).toBe(false)
  })

  it('成功删除记录', () => {
    const existing = [
      { id: '1', amount: 100 },
      { id: '2', amount: 200 },
    ]
    const result = deleteExpense(existing, '1')
    expect(result.success).toBe(true)
    expect(result.expenses.length).toBe(1)
    expect(result.expenses[0].id).toBe('2')
  })
})

describe('filterExpenses', () => {
  const expenses = [
    { id: '1', category: 'food', date: '2025-01-10', amount: 100 },
    { id: '2', category: 'transport', date: '2025-01-20', amount: 50 },
    { id: '3', category: 'food', date: '2025-02-05', amount: 200 },
  ]

  it('按月份筛选', () => {
    expect(filterExpensesByMonth(expenses, '2025-01').length).toBe(2)
    expect(filterExpensesByMonth(expenses, '2025-02').length).toBe(1)
  })

  it('按分类筛选', () => {
    expect(filterExpensesByCategory(expenses, 'food').length).toBe(2)
    expect(filterExpensesByCategory(expenses, 'transport').length).toBe(1)
  })
})

describe('calculateCategorySpent', () => {
  const expenses = [
    { id: '1', category: 'food', date: '2025-01-10', amount: 100 },
    { id: '2', category: 'food', date: '2025-01-20', amount: 200 },
    { id: '3', category: 'food', date: '2025-02-01', amount: 50 },
    { id: '4', category: 'transport', date: '2025-01-15', amount: 30 },
  ]

  it('计算指定月份指定分类的消费总和', () => {
    expect(calculateCategorySpent(expenses, '2025-01', 'food')).toBe(300)
    expect(calculateCategorySpent(expenses, '2025-01', 'transport')).toBe(30)
    expect(calculateCategorySpent(expenses, '2025-02', 'food')).toBe(50)
  })

  it('categoryKey 为 null 时计算所有分类', () => {
    expect(calculateCategorySpent(expenses, '2025-01', null)).toBe(330)
  })
})

describe('calculateTotalSpent', () => {
  it('计算月度总消费', () => {
    const expenses = [
      { id: '1', category: 'food', date: '2025-01-10', amount: 100 },
      { id: '2', category: 'transport', date: '2025-01-20', amount: 50 },
      { id: '3', category: 'food', date: '2025-02-01', amount: 200 },
    ]
    expect(calculateTotalSpent(expenses, '2025-01')).toBe(150)
    expect(calculateTotalSpent(expenses, '2025-02')).toBe(200)
  })
})

describe('calculateTotalBudget', () => {
  it('计算月度总预算', () => {
    const budgets = {
      '2025-01': { food: 1000, transport: 500 },
      '2025-02': { food: 800 },
    }
    expect(calculateTotalBudget(budgets, '2025-01')).toBe(1500)
    expect(calculateTotalBudget(budgets, '2025-02')).toBe(800)
    expect(calculateTotalBudget(budgets, '2025-03')).toBe(0)
  })
})

describe('getProgressStatus', () => {
  it('进度正常返回 normal', () => {
    expect(getProgressStatus(0)).toBe('normal')
    expect(getProgressStatus(50)).toBe('normal')
    expect(getProgressStatus(PROGRESS_NORMAL_THRESHOLD - 1)).toBe('normal')
  })

  it('进度警告返回 warning', () => {
    expect(getProgressStatus(PROGRESS_NORMAL_THRESHOLD)).toBe('warning')
    expect(getProgressStatus(90)).toBe('warning')
    expect(getProgressStatus(PROGRESS_WARNING_THRESHOLD - 1)).toBe('warning')
  })

  it('进度超支返回 danger', () => {
    expect(getProgressStatus(PROGRESS_WARNING_THRESHOLD)).toBe('danger')
    expect(getProgressStatus(150)).toBe('danger')
  })
})

describe('getCategoryProgress', () => {
  const expenses = [
    { id: '1', category: 'food', date: '2025-01-10', amount: 600 },
  ]
  const budgets = { '2025-01': { food: 1000 } }

  it('正常进度', () => {
    const progress = getCategoryProgress(expenses, budgets, '2025-01', 'food')
    expect(progress.budget).toBe(1000)
    expect(progress.spent).toBe(600)
    expect(progress.percent).toBe(60)
    expect(progress.status).toBe('normal')
    expect(progress.isOverBudget).toBe(false)
    expect(progress.remaining).toBe(400)
    expect(progress.overAmount).toBe(0)
  })

  it('超支状态', () => {
    const overExpenses = [
      { id: '1', category: 'food', date: '2025-01-10', amount: 1500 },
    ]
    const progress = getCategoryProgress(overExpenses, budgets, '2025-01', 'food')
    expect(progress.isOverBudget).toBe(true)
    expect(progress.status).toBe('danger')
    expect(progress.overAmount).toBe(500)
    expect(progress.remaining).toBe(0)
  })

  it('预算为0时不报错', () => {
    const progress = getCategoryProgress([], {}, '2025-01', 'food')
    expect(progress.budget).toBe(0)
    expect(progress.spent).toBe(0)
    expect(progress.percent).toBe(0)
  })
})

describe('getAllCategoryProgress', () => {
  it('返回所有分类的进度', () => {
    const progressList = getAllCategoryProgress([], {}, '2025-01')
    expect(progressList.length).toBe(CATEGORY_KEYS.length)
    progressList.forEach((p) => {
      expect(CATEGORY_KEYS.includes(p.categoryKey)).toBe(true)
    })
  })
})

describe('calculateRemainingBudget', () => {
  it('计算剩余预算', () => {
    const budgets = { '2025-01': { food: 1000, transport: 500 } }
    const expenses = [
      { id: '1', category: 'food', date: '2025-01-10', amount: 300 },
    ]
    expect(calculateRemainingBudget(budgets, expenses, '2025-01')).toBe(1200)
  })

  it('超支时剩余预算为0', () => {
    const budgets = { '2025-01': { food: 500 } }
    const expenses = [
      { id: '1', category: 'food', date: '2025-01-10', amount: 800 },
    ]
    expect(calculateRemainingBudget(budgets, expenses, '2025-01')).toBe(0)
  })
})

describe('calculateDailyBudget', () => {
  it('日均预算不小于0', () => {
    const budgets = { '2025-01': { food: 1000 } }
    const daily = calculateDailyBudget(budgets, [], '2025-01')
    expect(typeof daily).toBe('number')
    expect(daily).toBeGreaterThanOrEqual(0)
  })
})

describe('isDailyBudgetLow', () => {
  it('判断日均预算是否偏低', () => {
    const highBudgets = { '2025-01': { food: 10000, transport: 5000 } }
    expect(isDailyBudgetLow(highBudgets, [], '2025-01')).toBe(false)
  })
})

describe('calculateMonthOverMonth', () => {
  it('消费上升', () => {
    const result = calculateMonthOverMonth(1500, 1000)
    expect(result.diff).toBe(500)
    expect(result.percent).toBe(50)
    expect(result.isIncrease).toBe(true)
    expect(result.isDecrease).toBe(false)
  })

  it('消费下降', () => {
    const result = calculateMonthOverMonth(800, 1000)
    expect(result.diff).toBe(-200)
    expect(result.percent).toBe(-20)
    expect(result.isIncrease).toBe(false)
    expect(result.isDecrease).toBe(true)
  })

  it('消费持平', () => {
    const result = calculateMonthOverMonth(1000, 1000)
    expect(result.diff).toBe(0)
    expect(result.isSame).toBe(true)
  })

  it('上月为0时的处理', () => {
    const result = calculateMonthOverMonth(500, 0)
    expect(result.isIncrease).toBe(true)
    expect(result.percent).toBe(100)
  })
})

describe('getCategoryMoM', () => {
  it('获取分类环比数据', () => {
    const expenses = [
      { id: '1', category: 'food', date: '2025-01-10', amount: 1000 },
      { id: '2', category: 'food', date: '2024-12-10', amount: 800 },
    ]
    const mom = getCategoryMoM(expenses, {}, '2025-01', 'food')
    expect(mom.currentSpent).toBe(1000)
    expect(mom.lastSpent).toBe(800)
    expect(mom.isIncrease).toBe(true)
  })
})

describe('getAllCategoryMoM', () => {
  it('返回所有分类的环比数据', () => {
    const momList = getAllCategoryMoM([], {}, '2025-01')
    expect(momList.length).toBe(CATEGORY_KEYS.length)
  })
})

describe('getTotalMoM', () => {
  it('获取总消费环比', () => {
    const expenses = [
      { id: '1', category: 'food', date: '2025-01-10', amount: 1000 },
      { id: '2', category: 'food', date: '2024-12-10', amount: 800 },
    ]
    const mom = getTotalMoM(expenses, '2025-01')
    expect(mom.currentSpent).toBe(1000)
    expect(mom.lastSpent).toBe(800)
  })
})

describe('Adjustment operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveAdjustments 保存到 localStorage', () => {
    const adjustments = [{ id: '1', oldBudget: 0, newBudget: 1000 }]
    const result = saveAdjustments(adjustments)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_ADJUSTMENTS)).toBe(JSON.stringify(adjustments))
  })

  it('loadAdjustments 从 localStorage 读取', () => {
    const adjustments = [{ id: '1', oldBudget: 0, newBudget: 1000 }]
    localStorage.setItem(STORAGE_KEY_ADJUSTMENTS, JSON.stringify(adjustments))
    const result = loadAdjustments()
    expect(result).toEqual(adjustments)
  })

  it('loadAdjustments 空时返回空数组', () => {
    expect(loadAdjustments()).toEqual([])
  })

  it('loadAdjustments 损坏数据返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_ADJUSTMENTS, 'invalid')
    expect(loadAdjustments()).toEqual([])
  })
})

describe('addAdjustment', () => {
  it('成功添加调整记录', () => {
    const result = addAdjustment([], {
      categoryKey: 'food',
      oldBudget: 0,
      newBudget: 1000,
      monthKey: '2025-01',
    })
    expect(result.success).toBe(true)
    expect(result.adjustment.categoryKey).toBe('food')
    expect(result.adjustment.oldBudget).toBe(0)
    expect(result.adjustment.newBudget).toBe(1000)
    expect(result.adjustment.diff).toBe(1000)
    expect(result.adjustments.length).toBe(1)
  })

  it('无效分类返回失败', () => {
    const result = addAdjustment([], {
      categoryKey: 'invalid',
      oldBudget: 0,
      newBudget: 1000,
    })
    expect(result.success).toBe(false)
  })

  it('缺少原预算返回失败', () => {
    const result = addAdjustment([], {
      categoryKey: 'food',
      newBudget: 1000,
    })
    expect(result.success).toBe(false)
  })

  it('缺少新预算返回失败', () => {
    const result = addAdjustment([], {
      categoryKey: 'food',
      oldBudget: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe('sortAdjustmentsByTime', () => {
  const adjustments = [
    { id: '1', createdAt: 100 },
    { id: '2', createdAt: 300 },
    { id: '3', createdAt: 200 },
  ]

  it('默认降序（最新在前）', () => {
    const result = sortAdjustmentsByTime(adjustments)
    expect(result.map((a) => a.id)).toEqual(['2', '3', '1'])
  })

  it('升序排列', () => {
    const result = sortAdjustmentsByTime(adjustments, 'asc')
    expect(result.map((a) => a.id)).toEqual(['1', '3', '2'])
  })

  it('不修改原数组', () => {
    const original = [...adjustments]
    sortAdjustmentsByTime(adjustments)
    expect(adjustments).toEqual(original)
  })
})

describe('paginateAdjustments', () => {
  const adjustments = Array.from({ length: 12 }, (_, i) => ({
    id: String(i + 1),
    createdAt: 100 + i * 100,
  }))

  it('第一页正确', () => {
    const result = paginateAdjustments(adjustments, 1, ADJUSTMENT_PAGE_SIZE)
    expect(result.items.length).toBe(ADJUSTMENT_PAGE_SIZE)
    expect(result.currentPage).toBe(1)
    expect(result.total).toBe(12)
  })

  it('最后一页正确', () => {
    const result = paginateAdjustments(adjustments, 3, ADJUSTMENT_PAGE_SIZE)
    expect(result.items.length).toBe(2)
    expect(result.currentPage).toBe(3)
  })

  it('页码超出范围时修正', () => {
    const result = paginateAdjustments(adjustments, 100, ADJUSTMENT_PAGE_SIZE)
    expect(result.currentPage).toBe(3)
  })

  it('按时间降序排列', () => {
    const result = paginateAdjustments(adjustments, 1, ADJUSTMENT_PAGE_SIZE)
    expect(result.items[0].createdAt).toBeGreaterThan(result.items[1].createdAt)
  })
})
