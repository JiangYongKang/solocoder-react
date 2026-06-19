import {
  STORAGE_KEY_BILLS,
  MAX_HISTORY_ITEMS,
  SPLIT_MODE,
  generateId,
} from './constants'

export function round2(value) {
  const rounded = Math.round(value * 100) / 100
  return Number(rounded.toFixed(2))
}

export function splitEqual(amount, participantIds) {
  if (!participantIds || participantIds.length === 0) {
    return {}
  }
  const n = participantIds.length
  const each = round2(amount / n)
  const result = {}
  let sum = 0
  for (let i = 0; i < n - 1; i++) {
    result[participantIds[i]] = each
    sum += each
  }
  const last = round2(amount - sum)
  result[participantIds[n - 1]] = last
  return result
}

export function validateCustomRatios(ratios) {
  if (!ratios) return { valid: false, sum: 0 }
  const values = Object.values(ratios)
  if (values.some((v) => isNaN(v) || v < 0)) {
    return { valid: false, sum: NaN }
  }
  const sum = values.reduce((acc, v) => acc + Number(v), 0)
  const rounded = round2(sum)
  return {
    valid: rounded === 100,
    sum: rounded,
  }
}

export function splitCustom(amount, ratios) {
  const { valid } = validateCustomRatios(ratios)
  if (!valid) return {}
  const entries = Object.entries(ratios)
  const result = {}
  let sum = 0
  const n = entries.length
  for (let i = 0; i < n - 1; i++) {
    const [id, ratio] = entries[i]
    const share = round2((amount * Number(ratio)) / 100)
    result[id] = share
    sum += share
  }
  const last = round2(amount - sum)
  if (n > 0) {
    const [lastId] = entries[n - 1]
    result[lastId] = last
  }
  return result
}

export function calculateShare(expense) {
  if (expense.splitMode === SPLIT_MODE.CUSTOM) {
    return splitCustom(expense.amount, expense.ratios || {})
  }
  return splitEqual(expense.amount, expense.sharedWith || [])
}

export function calculateExpenseSharePerPerson(expenses) {
  const shares = {}
  for (const exp of expenses) {
    if (!exp.payerId) continue
    const expShares = calculateShare(exp)
    for (const [personId, amount] of Object.entries(expShares)) {
      if (!shares[personId]) shares[personId] = 0
      shares[personId] += amount
    }
  }
  for (const id in shares) {
    shares[id] = round2(shares[id])
  }
  return shares
}

export function calculatePaidPerPerson(expenses) {
  const paid = {}
  for (const exp of expenses) {
    if (!exp.payerId) continue
    if (!paid[exp.payerId]) paid[exp.payerId] = 0
    paid[exp.payerId] += Number(exp.amount) || 0
  }
  for (const id in paid) {
    paid[id] = round2(paid[id])
  }
  return paid
}

export function calculateBalances(participants, expenses) {
  const balances = {}
  const participantIds = participants.map((p) => p.id)

  for (const id of participantIds) {
    balances[id] = 0
  }

  const paid = calculatePaidPerPerson(expenses)
  const shares = calculateExpenseSharePerPerson(expenses)

  for (const id of participantIds) {
    balances[id] = round2((paid[id] || 0) - (shares[id] || 0))
  }

  return balances
}

export function calculateSettlements(participants, expenses) {
  const balances = calculateBalances(participants, expenses)
  const debtors = []
  const creditors = []

  for (const [id, balance] of Object.entries(balances)) {
    if (balance < -0.005) {
      debtors.push({ id, amount: round2(-balance) })
    } else if (balance > 0.005) {
      creditors.push({ id, amount: round2(balance) })
    }
  }

  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  const settlements = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = round2(Math.min(debtor.amount, creditor.amount))

    if (amount > 0.005) {
      settlements.push({
        from: debtor.id,
        to: creditor.id,
        amount,
      })
    }

    debtor.amount = round2(debtor.amount - amount)
    creditor.amount = round2(creditor.amount - amount)

    if (debtor.amount < 0.005) i++
    if (creditor.amount < 0.005) j++
  }

  return {
    balances,
    settlements,
  }
}

export function validateExpense(expense, participants) {
  const errors = {}
  if (!expense.description || !expense.description.trim()) {
    errors.description = '请输入费用描述'
  }
  const amount = Number(expense.amount)
  if (expense.amount === undefined || expense.amount === null || expense.amount === '') {
    errors.amount = '请输入金额'
  } else if (isNaN(amount) || amount <= 0) {
    errors.amount = '金额必须大于0'
  } else {
    const decimals = (expense.amount.toString().split('.')[1] || '').length
    if (decimals > 2) {
      errors.amount = '最多支持两位小数'
    }
  }
  if (!expense.payerId) {
    errors.payerId = '请选择支付人'
  } else if (participants.length > 0 && !participants.find((p) => p.id === expense.payerId)) {
    errors.payerId = '支付人不存在'
  }
  if (!expense.sharedWith || expense.sharedWith.length === 0) {
    errors.sharedWith = '请至少选择一个分摊人'
  }

  if (expense.splitMode === SPLIT_MODE.CUSTOM) {
    const { valid } = validateCustomRatios(expense.ratios || {})
    if (!valid) {
      errors.ratios = '分摊比例之和必须为100%'
    }
  }

  return errors
}

export function validateParticipant(name, existingParticipants, excludeId = null) {
  if (!name || !name.trim()) {
    return '请输入参与者名称'
  }
  const trimmed = name.trim()
  const exists = existingParticipants.some(
    (p) => p.name === trimmed && (excludeId === null || p.id !== excludeId)
  )
  if (exists) {
    return '参与者已存在'
  }
  return null
}

export function createExpense(participants, payerIndex = 0) {
  const sharedWith = participants.map((p) => p.id)
  const ratios = {}
  if (sharedWith.length > 0) {
    const each = round2(100 / sharedWith.length)
    let sum = 0
    for (let i = 0; i < sharedWith.length - 1; i++) {
      ratios[sharedWith[i]] = each
      sum += each
    }
    ratios[sharedWith[sharedWith.length - 1]] = round2(100 - sum)
  }
  return {
    id: generateId('exp'),
    description: '',
    amount: '',
    payerId: participants.length > 0 ? participants[payerIndex].id : '',
    sharedWith,
    splitMode: SPLIT_MODE.EQUAL,
    ratios,
  }
}

export function calculateTotalAmount(expenses) {
  return round2(
    expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
  )
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BILLS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY_BILLS, JSON.stringify(history))
    return true
  } catch {
    return false
  }
}

export function addToHistory(bill, existingHistory = []) {
  const toSave = [bill, ...existingHistory]
  if (toSave.length > MAX_HISTORY_ITEMS) {
    toSave.length = MAX_HISTORY_ITEMS
  }
  return toSave
}

export function deleteFromHistory(history, billId) {
  return history.filter((b) => b.id !== billId)
}

export function createBillRecord(name, participants, expenses) {
  return {
    id: generateId('bill'),
    name,
    participants,
    expenses,
    participantCount: participants.length,
    totalAmount: calculateTotalAmount(expenses),
    savedAt: Date.now(),
  }
}

export function validateAllExpenses(expenses, participants) {
  if (!expenses || expenses.length === 0) {
    return { valid: false, message: '至少需要一条费用条目', errors: {} }
  }
  for (let i = 0; i < expenses.length; i++) {
    const errors = validateExpense(expenses[i], participants)
    if (Object.keys(errors).length > 0) {
      const firstError = errors[Object.keys(errors)[0]]
      return {
        valid: false,
        message: `费用 #${i + 1}：${firstError}`,
        errors,
        expenseIndex: i,
      }
    }
  }
  return { valid: true, message: '', errors: {} }
}

export function formatDateTime(timestamp) {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}
