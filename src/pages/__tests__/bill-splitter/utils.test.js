import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  splitEqual,
  validateCustomRatios,
  splitCustom,
  calculateShare,
  calculateExpenseSharePerPerson,
  calculatePaidPerPerson,
  calculateBalances,
  calculateSettlements,
  validateExpense,
  validateParticipant,
  calculateTotalAmount,
  addToHistory,
  deleteFromHistory,
  createBillRecord,
  round2,
  loadHistory,
  saveHistory,
} from '../../bill-splitter/utils'
import { SPLIT_MODE, MAX_HISTORY_ITEMS } from '../../bill-splitter/constants'

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

beforeEach(() => {
  globalThis.localStorage.clear()
})

describe('round2', () => {
  it('正确保留两位小数', () => {
    expect(round2(3.1415)).toBe(3.14)
    expect(round2(3.145)).toBe(3.15)
    expect(round2(2)).toBe(2)
    expect(round2(2.5)).toBe(2.5)
    expect(round2(0.1 + 0.2)).toBe(0.3)
  })

  it('负数正确保留两位小数', () => {
    expect(round2(-3.1415)).toBe(-3.14)
    expect(round2(-10.999)).toBe(-11)
    expect(round2(-0.01)).toBe(-0.01)
  })
})

describe('splitEqual', () => {
  it('空数组返回空对象', () => {
    expect(splitEqual(100, [])).toEqual({})
    expect(splitEqual(100, null)).toEqual({})
    expect(splitEqual(100, undefined)).toEqual({})
  })

  it('单个人承担全部金额', () => {
    const result = splitEqual(100, ['p1'])
    expect(result).toEqual({ p1: 100 })
  })

  it('两人平分整数金额', () => {
    const result = splitEqual(100, ['p1', 'p2'])
    expect(result).toEqual({ p1: 50, p2: 50 })
    const sum = Object.values(result).reduce((a, b) => a + b, 0)
    expect(sum).toBe(100)
  })

  it('平分含小数差值补齐（最后一人）', () => {
    const result = splitEqual(10, ['p1', 'p2', 'p3'])
    const vals = Object.values(result)
    expect(vals[0]).toBe(3.33)
    expect(vals[1]).toBe(3.33)
    expect(vals[2]).toBe(3.34)
    const sum = vals.reduce((a, b) => a + b, 0)
    expect(sum).toBe(10)
  })

  it('任意人数平分总和等于原金额（两位小数）', () => {
    const amounts = [1, 5.55, 7, 23.67, 100.01, 9999.99]
    for (const amount of amounts) {
      for (let n = 1; n <= 7; n++) {
        const ids = Array.from({ length: n }, (_, i) => `p${i}`)
        const result = splitEqual(amount, ids)
        const sum = Object.values(result).reduce((a, b) => a + b, 0)
        expect(round2(sum)).toBe(round2(amount))
        Object.values(result).forEach((v) => {
          expect(Math.round(v * 100) / 100).toBe(v)
        })
      }
    }
  })
})

describe('validateCustomRatios', () => {
  it('总和100%合法', () => {
    expect(validateCustomRatios({ p1: 50, p2: 50 })).toEqual({ valid: true, sum: 100 })
    expect(validateCustomRatios({ p1: 33.33, p2: 33.33, p3: 33.34 })).toEqual({ valid: true, sum: 100 })
  })

  it('总和不等于100%非法', () => {
    expect(validateCustomRatios({ p1: 50, p2: 49 }).valid).toBe(false)
    expect(validateCustomRatios({ p1: 50 }).valid).toBe(false)
  })

  it('空对象总和为0', () => {
    expect(validateCustomRatios({})).toEqual({ valid: false, sum: 0 })
    expect(validateCustomRatios(null)).toEqual({ valid: false, sum: 0 })
  })

  it('负值非法', () => {
    expect(validateCustomRatios({ p1: 100, p2: -10, p3: 10 }).valid).toBe(false)
  })
})

describe('splitCustom', () => {
  it('合法比例正确分摊', () => {
    const result = splitCustom(100, { p1: 30, p2: 70 })
    expect(result.p1).toBe(30)
    expect(result.p2).toBe(70)
  })

  it('差值补齐最后一人', () => {
    const result = splitCustom(10, { p1: 33.33, p2: 33.33, p3: 33.34 })
    const sum = Object.values(result).reduce((a, b) => a + b, 0)
    expect(round2(sum)).toBe(10)
  })

  it('非法比例返回空对象', () => {
    expect(splitCustom(100, { p1: 50 })).toEqual({})
    expect(splitCustom(100, { p1: 30, p2: 60 })).toEqual({})
  })

  it('分摊金额均为两位小数', () => {
    const ratios = { p1: 12.5, p2: 37.5, p3: 50 }
    const result = splitCustom(99.99, ratios)
    for (const v of Object.values(result)) {
      expect((v * 100) % 1).toBe(0)
    }
    const sum = Object.values(result).reduce((a, b) => a + b, 0)
    expect(round2(sum)).toBe(99.99)
  })
})

describe('calculateShare', () => {
  it('平分模式调用splitEqual', () => {
    const exp = {
      amount: 100,
      splitMode: SPLIT_MODE.EQUAL,
      sharedWith: ['p1', 'p2'],
    }
    expect(calculateShare(exp)).toEqual({ p1: 50, p2: 50 })
  })

  it('自定义比例模式调用splitCustom', () => {
    const exp = {
      amount: 100,
      splitMode: SPLIT_MODE.CUSTOM,
      ratios: { p1: 40, p2: 60 },
    }
    expect(calculateShare(exp)).toEqual({ p1: 40, p2: 60 })
  })
})

describe('calculateExpenseSharePerPerson', () => {
  it('单条费用分摊正确', () => {
    const expenses = [
      {
        id: 'e1',
        amount: 100,
        payerId: 'p1',
        splitMode: SPLIT_MODE.EQUAL,
        sharedWith: ['p1', 'p2', 'p3'],
      },
    ]
    const result = calculateExpenseSharePerPerson(expenses)
    expect(result.p1).toBe(33.33)
    expect(result.p2).toBe(33.33)
    expect(result.p3).toBe(33.34)
  })

  it('多条费用累加分摊', () => {
    const expenses = [
      {
        id: 'e1',
        amount: 100,
        payerId: 'p1',
        splitMode: SPLIT_MODE.EQUAL,
        sharedWith: ['p1', 'p2'],
      },
      {
        id: 'e2',
        amount: 60,
        payerId: 'p2',
        splitMode: SPLIT_MODE.CUSTOM,
        ratios: { p1: 50, p2: 50 },
      },
    ]
    const result = calculateExpenseSharePerPerson(expenses)
    expect(result.p1).toBe(80)
    expect(result.p2).toBe(80)
  })

  it('无费用返回空', () => {
    expect(calculateExpenseSharePerPerson([])).toEqual({})
  })
})

describe('calculatePaidPerPerson', () => {
  it('正确统计每人支付金额', () => {
    const expenses = [
      { id: 'e1', amount: 100, payerId: 'p1' },
      { id: 'e2', amount: 50.5, payerId: 'p2' },
      { id: 'e3', amount: 30, payerId: 'p1' },
    ]
    const result = calculatePaidPerPerson(expenses)
    expect(result.p1).toBe(130)
    expect(result.p2).toBe(50.5)
    expect(result.p3).toBeUndefined()
  })

  it('无费用返回空', () => {
    expect(calculatePaidPerPerson([])).toEqual({})
  })
})

describe('calculateBalances', () => {
  it('两人简单场景', () => {
    const participants = [{ id: 'p1' }, { id: 'p2' }]
    const expenses = [
      {
        id: 'e1',
        amount: 100,
        payerId: 'p1',
        splitMode: SPLIT_MODE.EQUAL,
        sharedWith: ['p1', 'p2'],
      },
    ]
    const balances = calculateBalances(participants, expenses)
    expect(balances.p1).toBe(50)
    expect(balances.p2).toBe(-50)
  })

  it('完全平账', () => {
    const participants = [{ id: 'p1' }, { id: 'p2' }]
    const expenses = [
      {
        id: 'e1',
        amount: 100,
        payerId: 'p1',
        splitMode: SPLIT_MODE.EQUAL,
        sharedWith: ['p1', 'p2'],
      },
      {
        id: 'e2',
        amount: 100,
        payerId: 'p2',
        splitMode: SPLIT_MODE.EQUAL,
        sharedWith: ['p1', 'p2'],
      },
    ]
    const balances = calculateBalances(participants, expenses)
    expect(balances.p1).toBe(0)
    expect(balances.p2).toBe(0)
  })

  it('多参与者复杂场景', () => {
    const participants = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }]
    const expenses = [
      {
        id: 'e1',
        amount: 400,
        payerId: 'p1',
        splitMode: SPLIT_MODE.EQUAL,
        sharedWith: ['p1', 'p2', 'p3', 'p4'],
      },
    ]
    const balances = calculateBalances(participants, expenses)
    expect(balances.p1).toBe(300)
    expect(balances.p2).toBe(-100)
    expect(balances.p3).toBe(-100)
    expect(balances.p4).toBe(-100)
  })
})

describe('calculateSettlements', () => {
  it('简单两人结算', () => {
    const participants = [{ id: 'p1' }, { id: 'p2' }]
    const expenses = [
      {
        id: 'e1',
        amount: 100,
        payerId: 'p1',
        splitMode: SPLIT_MODE.EQUAL,
        sharedWith: ['p1', 'p2'],
      },
    ]
    const { settlements, balances } = calculateSettlements(participants, expenses)
    expect(balances.p1).toBe(50)
    expect(balances.p2).toBe(-50)
    expect(settlements.length).toBe(1)
    expect(settlements[0]).toEqual({ from: 'p2', to: 'p1', amount: 50 })
  })

  it('平账无需结算', () => {
    const participants = [{ id: 'p1' }, { id: 'p2' }]
    const expenses = [
      {
        id: 'e1',
        amount: 100,
        payerId: 'p1',
        splitMode: SPLIT_MODE.EQUAL,
        sharedWith: ['p1', 'p2'],
      },
      {
        id: 'e2',
        amount: 100,
        payerId: 'p2',
        splitMode: SPLIT_MODE.EQUAL,
        sharedWith: ['p1', 'p2'],
      },
    ]
    const { settlements } = calculateSettlements(participants, expenses)
    expect(settlements.length).toBe(0)
  })

  it('最简结算方案 - 减少转账次数', () => {
    const participants = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
    const expenses = [
      {
        id: 'e1',
        amount: 30,
        payerId: 'B',
        splitMode: SPLIT_MODE.EQUAL,
        sharedWith: ['A', 'B', 'C'],
      },
      {
        id: 'e2',
        amount: 15,
        payerId: 'C',
        splitMode: SPLIT_MODE.EQUAL,
        sharedWith: ['B', 'C'],
      },
    ]
    const { balances, settlements } = calculateSettlements(participants, expenses)
    expect(balances.A).toBe(-10)
    expect(balances.B).toBe(12.5)
    expect(balances.C).toBe(-2.5)
    expect(settlements.length).toBeLessThanOrEqual(2)
    const total = settlements.reduce((s, t) => s + t.amount, 0)
    expect(total).toBe(12.5)
    let aOut = 0, cOut = 0, bIn = 0
    for (const s of settlements) {
      if (s.from === 'A') aOut += s.amount
      if (s.from === 'C') cOut += s.amount
      if (s.to === 'B') bIn += s.amount
    }
    expect(round2(aOut)).toBe(10)
    expect(round2(cOut)).toBe(2.5)
    expect(round2(bIn)).toBe(12.5)
  })

  it('结算金额均为两位小数', () => {
    const participants = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }]
    const expenses = [
      {
        id: 'e1',
        amount: 99.99,
        payerId: 'p1',
        splitMode: SPLIT_MODE.EQUAL,
        sharedWith: ['p1', 'p2', 'p3', 'p4'],
      },
    ]
    const { settlements } = calculateSettlements(participants, expenses)
    for (const s of settlements) {
      expect((s.amount * 100) % 1).toBe(0)
    }
  })

  it('无费用时无结算', () => {
    const participants = [{ id: 'p1' }, { id: 'p2' }]
    const { settlements } = calculateSettlements(participants, [])
    expect(settlements.length).toBe(0)
  })
})

describe('validateExpense', () => {
  const participants = [{ id: 'p1' }, { id: 'p2' }]

  it('正确描述必填', () => {
    const exp = {
      description: '',
      amount: 100,
      payerId: 'p1',
      sharedWith: ['p1', 'p2'],
      splitMode: SPLIT_MODE.EQUAL,
    }
    expect(validateExpense(exp, participants).description).toBeTruthy()
  })

  it('金额必须大于0', () => {
    const exp = {
      description: 'test',
      amount: 0,
      payerId: 'p1',
      sharedWith: ['p1', 'p2'],
      splitMode: SPLIT_MODE.EQUAL,
    }
    expect(validateExpense(exp, participants).amount).toBeTruthy()
  })

  it('金额最多两位小数', () => {
    const exp = {
      description: 'test',
      amount: 10.123,
      payerId: 'p1',
      sharedWith: ['p1', 'p2'],
      splitMode: SPLIT_MODE.EQUAL,
    }
    expect(validateExpense(exp, participants).amount).toBeTruthy()
  })

  it('支付人必填', () => {
    const exp = {
      description: 'test',
      amount: 100,
      payerId: '',
      sharedWith: ['p1', 'p2'],
      splitMode: SPLIT_MODE.EQUAL,
    }
    expect(validateExpense(exp, participants).payerId).toBeTruthy()
  })

  it('分摊人至少选一人', () => {
    const exp = {
      description: 'test',
      amount: 100,
      payerId: 'p1',
      sharedWith: [],
      splitMode: SPLIT_MODE.EQUAL,
    }
    expect(validateExpense(exp, participants).sharedWith).toBeTruthy()
  })

  it('自定义比例必须100%', () => {
    const exp = {
      description: 'test',
      amount: 100,
      payerId: 'p1',
      sharedWith: ['p1', 'p2'],
      splitMode: SPLIT_MODE.CUSTOM,
      ratios: { p1: 50, p2: 40 },
    }
    expect(validateExpense(exp, participants).ratios).toBeTruthy()
  })

  it('合法的费用无错误', () => {
    const exp = {
      description: 'test',
      amount: 100.5,
      payerId: 'p1',
      sharedWith: ['p1', 'p2'],
      splitMode: SPLIT_MODE.EQUAL,
    }
    expect(Object.keys(validateExpense(exp, participants)).length).toBe(0)
  })
})

describe('validateParticipant', () => {
  const participants = [{ id: 'p1', name: '张三' }, { id: 'p2', name: '李四' }]

  it('名称不能为空', () => {
    expect(validateParticipant('', participants)).toBeTruthy()
    expect(validateParticipant('   ', participants)).toBeTruthy()
  })

  it('名称不能重复', () => {
    expect(validateParticipant('张三', participants)).toBe('参与者已存在')
  })

  it('excludeId排除自身', () => {
    expect(validateParticipant('张三', participants, 'p1')).toBeNull()
  })

  it('新名称合法', () => {
    expect(validateParticipant('王五', participants)).toBeNull()
  })
})

describe('calculateTotalAmount', () => {
  it('正确累加', () => {
    const expenses = [{ amount: 100 }, { amount: 50.5 }, { amount: 0.33 }]
    expect(calculateTotalAmount(expenses)).toBe(150.83)
  })

  it('空列表为0', () => {
    expect(calculateTotalAmount([])).toBe(0)
  })
})

describe('历史记录', () => {
  it('添加到历史记录且按时间倒序', () => {
    const b1 = { id: 'b1', savedAt: 1000 }
    const b2 = { id: 'b2', savedAt: 2000 }
    const result = addToHistory(b2, [b1])
    expect(result[0].id).toBe('b2')
    expect(result[1].id).toBe('b1')
  })

  it('超过最大数量时丢弃最旧的', () => {
    const history = []
    for (let i = 0; i < MAX_HISTORY_ITEMS + 5; i++) {
      history.push({ id: `b${i}`, savedAt: i })
    }
    const newest = { id: 'new', savedAt: 9999 }
    const result = addToHistory(newest, history)
    expect(result.length).toBe(MAX_HISTORY_ITEMS)
    expect(result[0].id).toBe('new')
  })

  it('删除历史记录', () => {
    const history = [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }]
    const result = deleteFromHistory(history, 'b2')
    expect(result.length).toBe(2)
    expect(result.find((b) => b.id === 'b2')).toBeUndefined()
  })

  it('createBillRecord生成正确结构', () => {
    const participants = [{ id: 'p1', name: '张三' }]
    const expenses = [{ id: 'e1', amount: 100 }]
    const bill = createBillRecord('测试账单', participants, expenses)
    expect(bill.id).toMatch(/^bill_/)
    expect(bill.name).toBe('测试账单')
    expect(bill.participants).toEqual(participants)
    expect(bill.expenses).toEqual(expenses)
    expect(bill.participantCount).toBe(1)
    expect(bill.totalAmount).toBe(100)
    expect(typeof bill.savedAt).toBe('number')
  })

  it('saveHistory和loadHistory持久化', () => {
    const history = [{ id: 'b1', name: 'test' }]
    saveHistory(history)
    const loaded = loadHistory()
    expect(loaded).toEqual(history)
  })
})
