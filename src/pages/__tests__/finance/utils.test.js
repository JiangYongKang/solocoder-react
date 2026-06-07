import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  TRANSACTION_TYPES,
  STORAGE_KEY_TRANSACTIONS,
  STORAGE_KEY_BUDGETS,
  INCOME_CATEGORY_KEYS,
  EXPENSE_CATEGORY_KEYS,
  getCategoryType,
} from '../../finance/constants'
import {
  generateId,
  formatCurrency,
  formatDate,
  getMonthKey,
  getCurrentMonthKey,
  getLast6Months,
  getLast6MonthsFrom,
  loadTransactions,
  saveTransactions,
  loadBudgets,
  saveBudgets,
  validateTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  filterTransactions,
  sortTransactions,
  paginateTransactions,
  getTransactionList,
  setBudget,
  getBudget,
  calculateCategorySpent,
  getBudgetProgressList,
  calculateMonthlySummary,
  buildTrendData,
  buildPieData,
} from '../../finance/utils'

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

const makeValidTx = (overrides = {}) => ({
  amount: 100,
  category: 'food',
  date: '2025-01-15',
  note: '午饭',
  ...overrides,
})

describe('generateId', () => {
  it('生成的ID以 tx_ 开头', () => {
    expect(generateId()).toMatch(/^tx_/)
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
  it('格式化金额为人民币', () => {
    expect(formatCurrency(99)).toBe('¥99.00')
    expect(formatCurrency(99.9)).toBe('¥99.90')
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
  })
})

describe('getMonthKey', () => {
  it('提取月份 key', () => {
    expect(getMonthKey('2025-01-15')).toBe('2025-01')
    expect(getMonthKey('2025-12-31')).toBe('2025-12')
    expect(getMonthKey('')).toBe('')
  })
})

describe('getCurrentMonthKey', () => {
  it('返回当前月份的 key', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(getCurrentMonthKey()).toBe(expected)
  })
})

describe('getLast6Months', () => {
  it('返回最近6个月', () => {
    const months = getLast6Months()
    expect(months.length).toBe(6)
    months.forEach((m) => {
      expect(m.key).toMatch(/^\d{4}-\d{2}$/)
      expect(m.label).toMatch(/^\d{4}-\d{2}$/)
    })
  })
})

describe('getLast6MonthsFrom', () => {
  it('从指定月份返回近6个月', () => {
    const months = getLast6MonthsFrom('2025-06')
    expect(months.length).toBe(6)
    expect(months[0].key).toBe('2025-01')
    expect(months[1].key).toBe('2025-02')
    expect(months[2].key).toBe('2025-03')
    expect(months[3].key).toBe('2025-04')
    expect(months[4].key).toBe('2025-05')
    expect(months[5].key).toBe('2025-06')
  })

  it('跨年正确处理', () => {
    const months = getLast6MonthsFrom('2025-03')
    expect(months.length).toBe(6)
    expect(months[0].key).toBe('2024-10')
    expect(months[1].key).toBe('2024-11')
    expect(months[2].key).toBe('2024-12')
    expect(months[3].key).toBe('2025-01')
    expect(months[4].key).toBe('2025-02')
    expect(months[5].key).toBe('2025-03')
  })

  it('月份key和label一致', () => {
    const months = getLast6MonthsFrom('2025-06')
    months.forEach((m) => {
      expect(m.key).toBe(m.label)
    })
  })
})

describe('getCategoryType', () => {
  it('识别收入分类', () => {
    INCOME_CATEGORY_KEYS.forEach((k) => {
      expect(getCategoryType(k)).toBe(TRANSACTION_TYPES.INCOME)
    })
  })

  it('识别支出分类', () => {
    EXPENSE_CATEGORY_KEYS.forEach((k) => {
      expect(getCategoryType(k)).toBe(TRANSACTION_TYPES.EXPENSE)
    })
  })

  it('无效分类返回 null', () => {
    expect(getCategoryType('invalid')).toBe(null)
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveTransactions 保存到 localStorage', () => {
    const txs = [{ id: '1', amount: 100 }]
    const result = saveTransactions(txs)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY_TRANSACTIONS)).toBe(JSON.stringify(txs))
  })

  it('loadTransactions 从 localStorage 读取', () => {
    const txs = [{ id: '1', amount: 100 }]
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(txs))
    const result = loadTransactions()
    expect(result).toEqual(txs)
  })

  it('loadTransactions localStorage 为空时返回空数组', () => {
    expect(loadTransactions()).toEqual([])
  })

  it('loadTransactions localStorage 数据损坏时返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, 'invalid-json')
    expect(loadTransactions()).toEqual([])
  })

  it('loadTransactions localStorage 数据非数组时返回空数组', () => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify({ not: 'array' }))
    expect(loadTransactions()).toEqual([])
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

describe('validateTransaction', () => {
  it('验证通过时返回空对象', () => {
    const errors = validateTransaction(makeValidTx())
    expect(Object.keys(errors).length).toBe(0)
  })

  it('金额为空时报错', () => {
    expect(validateTransaction(makeValidTx({ amount: '' })).amount).toBeTruthy()
  })

  it('金额为非正数时报错', () => {
    expect(validateTransaction(makeValidTx({ amount: 0 })).amount).toBeTruthy()
    expect(validateTransaction(makeValidTx({ amount: -10 })).amount).toBeTruthy()
    expect(validateTransaction(makeValidTx({ amount: 'abc' })).amount).toBeTruthy()
  })

  it('分类为空时报错', () => {
    expect(validateTransaction(makeValidTx({ category: '' })).category).toBeTruthy()
  })

  it('分类无效时报错', () => {
    expect(validateTransaction(makeValidTx({ category: 'invalid' })).category).toBeTruthy()
  })

  it('日期为空时报错', () => {
    expect(validateTransaction(makeValidTx({ date: '' })).date).toBeTruthy()
  })

  it('日期无效时报错', () => {
    expect(validateTransaction(makeValidTx({ date: 'not-a-date' })).date).toBeTruthy()
  })

  it('备注超过200字符时报错', () => {
    expect(validateTransaction(makeValidTx({ note: 'a'.repeat(201) })).note).toBeTruthy()
  })

  it('备注不超过200字符时通过', () => {
    expect(validateTransaction(makeValidTx({ note: 'a'.repeat(200) })).note).toBeFalsy()
  })
})

describe('createTransaction', () => {
  it('数据无效时返回失败', () => {
    const result = createTransaction([], { amount: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功创建支出记录', () => {
    const result = createTransaction([], makeValidTx())
    expect(result.success).toBe(true)
    expect(result.transaction.id).toBeTruthy()
    expect(result.transaction.type).toBe(TRANSACTION_TYPES.EXPENSE)
    expect(result.transaction.amount).toBe(100)
    expect(result.transaction.date).toBe('2025-01-15')
    expect(result.transaction.note).toBe('午饭')
    expect(result.transaction.createdAt).toBeTruthy()
    expect(result.transactions.length).toBe(1)
  })

  it('成功创建收入记录', () => {
    const result = createTransaction([], makeValidTx({ category: 'salary', amount: 10000 }))
    expect(result.success).toBe(true)
    expect(result.transaction.type).toBe(TRANSACTION_TYPES.INCOME)
    expect(result.transaction.amount).toBe(10000)
  })

  it('新记录放在列表最前面', () => {
    const existing = [{ id: 'old', amount: 50 }]
    const result = createTransaction(existing, makeValidTx())
    expect(result.transactions[0].id).toBe(result.transaction.id)
    expect(result.transactions[1].id).toBe('old')
  })

  it('去除备注首尾空格', () => {
    const result = createTransaction([], makeValidTx({ note: '  午饭  ' }))
    expect(result.transaction.note).toBe('午饭')
  })
})

describe('updateTransaction', () => {
  it('数据无效时返回失败', () => {
    const result = updateTransaction([{ id: '1' }], '1', { amount: '' })
    expect(result.success).toBe(false)
  })

  it('记录不存在时返回失败', () => {
    const result = updateTransaction([], 'not-exist', makeValidTx())
    expect(result.success).toBe(false)
  })

  it('成功更新记录', () => {
    const existing = [
      { id: '1', amount: 100, category: 'food', type: 'expense', date: '2025-01-15', note: '午饭' },
    ]
    const result = updateTransaction(existing, '1', makeValidTx({ amount: 200, note: '晚饭' }))
    expect(result.success).toBe(true)
    expect(result.transaction.amount).toBe(200)
    expect(result.transaction.note).toBe('晚饭')
    expect(result.transactions[0].amount).toBe(200)
  })
})

describe('deleteTransaction', () => {
  it('记录不存在时返回失败', () => {
    const result = deleteTransaction([], 'not-exist')
    expect(result.success).toBe(false)
  })

  it('成功删除记录', () => {
    const existing = [
      { id: '1', amount: 100 },
      { id: '2', amount: 200 },
    ]
    const result = deleteTransaction(existing, '1')
    expect(result.success).toBe(true)
    expect(result.transactions.length).toBe(1)
    expect(result.transactions[0].id).toBe('2')
  })
})

describe('filterTransactions', () => {
  const makeTx = (id, overrides) => ({
    id,
    amount: 100,
    category: 'food',
    type: 'expense',
    date: '2025-01-15',
    note: '',
    ...overrides,
  })
  const transactions = [
    makeTx('1', { date: '2025-01-10', category: 'food', note: '午饭' }),
    makeTx('2', { date: '2025-01-20', category: 'transport', note: '打车' }),
    makeTx('3', { date: '2025-02-05', category: 'food', note: '晚饭' }),
    makeTx('4', { date: '2025-01-15', category: 'salary', type: 'income', note: '工资' }),
  ]

  it('无筛选条件返回全部', () => {
    expect(filterTransactions(transactions, {}).length).toBe(4)
  })

  it('按月份筛选', () => {
    expect(filterTransactions(transactions, { month: '2025-01' }).length).toBe(3)
    expect(filterTransactions(transactions, { month: '2025-02' }).length).toBe(1)
  })

  it('按类型筛选', () => {
    expect(filterTransactions(transactions, { type: TRANSACTION_TYPES.EXPENSE }).length).toBe(3)
    expect(filterTransactions(transactions, { type: TRANSACTION_TYPES.INCOME }).length).toBe(1)
  })

  it('按分类筛选', () => {
    expect(filterTransactions(transactions, { category: 'food' }).length).toBe(2)
    expect(filterTransactions(transactions, { category: 'all' }).length).toBe(4)
  })

  it('按关键词搜索备注', () => {
    expect(filterTransactions(transactions, { keyword: '午饭' }).length).toBe(1)
    expect(filterTransactions(transactions, { keyword: '饭' }).length).toBe(2)
  })

  it('按关键词搜索分类名', () => {
    expect(filterTransactions(transactions, { keyword: '交通' }).length).toBe(1)
  })

  it('组合筛选', () => {
    const result = filterTransactions(transactions, { month: '2025-01', category: 'food' })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('空关键词不筛选', () => {
    expect(filterTransactions(transactions, { keyword: '   ' }).length).toBe(4)
  })
})

describe('sortTransactions', () => {
  const transactions = [
    { id: '1', amount: 100, date: '2025-01-10', createdAt: 100 },
    { id: '2', amount: 300, date: '2025-01-20', createdAt: 300 },
    { id: '3', amount: 200, date: '2025-01-05', createdAt: 200 },
  ]

  it('按日期降序（默认）', () => {
    const result = sortTransactions(transactions)
    expect(result.map((t) => t.id)).toEqual(['2', '1', '3'])
  })

  it('按日期升序', () => {
    const result = sortTransactions(transactions, 'date', 'asc')
    expect(result.map((t) => t.id)).toEqual(['3', '1', '2'])
  })

  it('按金额降序', () => {
    const result = sortTransactions(transactions, 'amount', 'desc')
    expect(result.map((t) => t.amount)).toEqual([300, 200, 100])
  })

  it('按金额升序', () => {
    const result = sortTransactions(transactions, 'amount', 'asc')
    expect(result.map((t) => t.amount)).toEqual([100, 200, 300])
  })

  it('按创建时间降序', () => {
    const result = sortTransactions(transactions, 'createdAt', 'desc')
    expect(result.map((t) => t.createdAt)).toEqual([300, 200, 100])
  })

  it('不修改原数组', () => {
    const original = [...transactions]
    sortTransactions(transactions, 'amount')
    expect(transactions).toEqual(original)
  })
})

describe('paginateTransactions', () => {
  const transactions = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }))

  it('第一页正确', () => {
    const result = paginateTransactions(transactions, 1, 10)
    expect(result.items.length).toBe(10)
    expect(result.items[0].id).toBe('1')
    expect(result.items[9].id).toBe('10')
    expect(result.currentPage).toBe(1)
    expect(result.totalPage).toBe(3)
    expect(result.total).toBe(25)
  })

  it('最后一页正确', () => {
    const result = paginateTransactions(transactions, 3, 10)
    expect(result.items.length).toBe(5)
    expect(result.currentPage).toBe(3)
  })

  it('页码超出范围时修正', () => {
    const result = paginateTransactions(transactions, 100, 10)
    expect(result.currentPage).toBe(3)
  })

  it('页码小于1时修正', () => {
    const result = paginateTransactions(transactions, 0, 10)
    expect(result.currentPage).toBe(1)
  })

  it('空列表返回第一页', () => {
    const result = paginateTransactions([], 1, 10)
    expect(result.items.length).toBe(0)
    expect(result.totalPage).toBe(1)
  })
})

describe('getTransactionList', () => {
  const transactions = [
    { id: '1', amount: 100, category: 'food', type: 'expense', date: '2025-01-15', note: '午饭', createdAt: 300 },
    { id: '2', amount: 50, category: 'transport', type: 'expense', date: '2025-01-10', note: '地铁', createdAt: 200 },
    { id: '3', amount: 10000, category: 'salary', type: 'income', date: '2025-01-05', note: '工资', createdAt: 100 },
  ]

  it('组合筛选、排序、分页', () => {
    const result = getTransactionList(transactions, {
      month: '2025-01',
      sortBy: 'amount',
      sortOrder: 'desc',
      page: 1,
      pageSize: 10,
    })
    expect(result.items.length).toBe(3)
    expect(result.items[0].amount).toBe(10000)
    expect(result.items[2].amount).toBe(50)
  })

  it('无选项时返回全部并按日期降序', () => {
    const result = getTransactionList(transactions, {})
    expect(result.items.length).toBe(3)
    expect(result.items[0].date).toBe('2025-01-15')
  })
})

describe('Budget functions', () => {
  it('setBudget 成功设置预算', () => {
    const result = setBudget({}, '2025-01', 'food', 1000)
    expect(result.success).toBe(true)
    expect(result.budgets['2025-01'].food).toBe(1000)
  })

  it('setBudget 金额为0时删除预算', () => {
    const budgets = { '2025-01': { food: 1000, transport: 500 } }
    const result = setBudget(budgets, '2025-01', 'food', 0)
    expect(result.budgets['2025-01'].food).toBeUndefined()
    expect(result.budgets['2025-01'].transport).toBe(500)
  })

  it('setBudget 月份预算全为0时删除月份', () => {
    const budgets = { '2025-01': { food: 1000 } }
    const result = setBudget(budgets, '2025-01', 'food', 0)
    expect(result.budgets['2025-01']).toBeUndefined()
  })

  it('setBudget 负金额时报错', () => {
    const result = setBudget({}, '2025-01', 'food', -100)
    expect(result.success).toBe(false)
  })

  it('setBudget 非支出分类报错', () => {
    const result = setBudget({}, '2025-01', 'salary', 1000)
    expect(result.success).toBe(false)
  })

  it('getBudget 获取预算', () => {
    const budgets = { '2025-01': { food: 1000 } }
    expect(getBudget(budgets, '2025-01', 'food')).toBe(1000)
    expect(getBudget(budgets, '2025-01', 'transport')).toBe(0)
    expect(getBudget(budgets, '2025-02', 'food')).toBe(0)
  })

  it('calculateCategorySpent 计算分类支出', () => {
    const transactions = [
      { id: '1', type: 'expense', category: 'food', amount: 100, date: '2025-01-10' },
      { id: '2', type: 'expense', category: 'food', amount: 200, date: '2025-01-20' },
      { id: '3', type: 'expense', category: 'food', amount: 50, date: '2025-02-01' },
      { id: '4', type: 'income', category: 'salary', amount: 10000, date: '2025-01-05' },
    ]
    expect(calculateCategorySpent(transactions, '2025-01', 'food')).toBe(300)
    expect(calculateCategorySpent(transactions, '2025-02', 'food')).toBe(50)
  })

  it('getBudgetProgressList 获取预算进度', () => {
    const transactions = [
      { id: '1', type: 'expense', category: 'food', amount: 1500, date: '2025-01-10' },
    ]
    const budgets = { '2025-01': { food: 1000 } }
    const list = getBudgetProgressList(transactions, budgets, '2025-01')
    const foodItem = list.find((i) => i.categoryKey === 'food')
    expect(foodItem.spent).toBe(1500)
    expect(foodItem.budget).toBe(1000)
    expect(foodItem.isOverBudget).toBe(true)
  })
})

describe('calculateMonthlySummary', () => {
  it('计算月度收支汇总', () => {
    const transactions = [
      { id: '1', type: 'income', amount: 10000, date: '2025-01-05' },
      { id: '2', type: 'expense', amount: 3000, date: '2025-01-10' },
      { id: '3', type: 'expense', amount: 2000, date: '2025-01-20' },
      { id: '4', type: 'income', amount: 5000, date: '2025-02-01' },
    ]
    const summary = calculateMonthlySummary(transactions, '2025-01')
    expect(summary.income).toBe(10000)
    expect(summary.expense).toBe(5000)
    expect(summary.balance).toBe(5000)
  })

  it('无数据时返回0', () => {
    const summary = calculateMonthlySummary([], '2025-01')
    expect(summary.income).toBe(0)
    expect(summary.expense).toBe(0)
    expect(summary.balance).toBe(0)
  })
})

describe('buildTrendData', () => {
  it('构建近6个月趋势数据（默认当前月份）', () => {
    const data = buildTrendData([])
    expect(data.length).toBe(6)
    data.forEach((d) => {
      expect(d.month).toMatch(/^\d{2}$/)
      expect(typeof d.income).toBe('number')
      expect(typeof d.expense).toBe('number')
    })
  })

  it('基于指定月份构建趋势数据', () => {
    const data = buildTrendData([], '2025-06')
    expect(data.length).toBe(6)
    expect(data[0].month).toBe('01')
    expect(data[1].month).toBe('02')
    expect(data[2].month).toBe('03')
    expect(data[3].month).toBe('04')
    expect(data[4].month).toBe('05')
    expect(data[5].month).toBe('06')
  })

  it('正确统计各月收入和支出', () => {
    const transactions = [
      { id: '1', type: 'income', amount: 10000, date: '2025-04-05' },
      { id: '2', type: 'expense', amount: 3000, date: '2025-04-10' },
      { id: '3', type: 'income', amount: 8000, date: '2025-05-05' },
      { id: '4', type: 'expense', amount: 5000, date: '2025-05-15' },
      { id: '5', type: 'income', amount: 12000, date: '2025-06-01' },
      { id: '6', type: 'expense', amount: 4000, date: '2025-06-20' },
    ]
    const data = buildTrendData(transactions, '2025-06')
    const april = data.find((d) => d.month === '04')
    const may = data.find((d) => d.month === '05')
    const june = data.find((d) => d.month === '06')
    expect(april.income).toBe(10000)
    expect(april.expense).toBe(3000)
    expect(may.income).toBe(8000)
    expect(may.expense).toBe(5000)
    expect(june.income).toBe(12000)
    expect(june.expense).toBe(4000)
  })

  it('跨年正确构建趋势数据', () => {
    const transactions = [
      { id: '1', type: 'income', amount: 10000, date: '2024-12-05' },
      { id: '2', type: 'income', amount: 11000, date: '2025-01-05' },
    ]
    const data = buildTrendData(transactions, '2025-03')
    const dec = data.find((d) => d.month === '12')
    const jan = data.find((d) => d.month === '01')
    expect(dec.income).toBe(10000)
    expect(jan.income).toBe(11000)
  })
})

describe('buildPieData', () => {
  it('构建饼图数据', () => {
    const transactions = [
      { id: '1', type: 'expense', category: 'food', amount: 500, date: '2025-01-10' },
      { id: '2', type: 'expense', category: 'food', amount: 300, date: '2025-01-20' },
      { id: '3', type: 'expense', category: 'transport', amount: 200, date: '2025-01-15' },
      { id: '4', type: 'income', category: 'salary', amount: 10000, date: '2025-01-05' },
    ]
    const data = buildPieData(transactions, '2025-01')
    expect(data.length).toBe(2)
    expect(data[0].name).toBe('餐饮')
    expect(data[0].value).toBe(800)
    expect(data[1].name).toBe('交通')
    expect(data[1].value).toBe(200)
  })

  it('无支出数据时返回空数组', () => {
    const data = buildPieData([], '2025-01')
    expect(data).toEqual([])
  })
})
