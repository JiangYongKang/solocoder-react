import { SPLIT_MODE } from './constants'
import {
  createExpense,
  validateExpense,
  calculateShare,
  round2,
  validateCustomRatios,
} from './utils'

function ExpenseItem({ expense, participants, onChange, onDelete, index }) {
  const errors = validateExpense(expense, participants)
  const shareResult = calculateShare(expense)
  const ratioValidation = validateCustomRatios(expense.ratios || {})

  const updateField = (field, value) => {
    onChange(expense.id, { ...expense, [field]: value })
  }

  const toggleSharedWith = (pid) => {
    const prev = expense.sharedWith || []
    let next
    if (prev.includes(pid)) {
      next = prev.filter((id) => id !== pid)
    } else {
      next = [...prev, pid]
    }
    const nextRatios = { ...expense.ratios }
    for (const id of next) {
      if (nextRatios[id] === undefined) nextRatios[id] = 0
    }
    for (const id of Object.keys(nextRatios)) {
      if (!next.includes(id)) delete nextRatios[id]
    }
    if (expense.splitMode === SPLIT_MODE.EQUAL) {
      if (next.length > 0) {
        const each = round2(100 / next.length)
        let sum = 0
        for (let i = 0; i < next.length - 1; i++) {
          nextRatios[next[i]] = each
          sum += each
        }
        nextRatios[next[next.length - 1]] = round2(100 - sum)
      }
    }
    onChange(expense.id, { ...expense, sharedWith: next, ratios: nextRatios })
  }

  const setRatio = (pid, rawValue) => {
    const num = rawValue === '' ? '' : Number(rawValue)
    const next = { ...expense.ratios }
    next[pid] = num
    onChange(expense.id, { ...expense, ratios: next })
  }

  const participantMap = new Map(participants.map((p) => [p.id, p]))

  return (
    <div className="expense-card">
      <div className="expense-card-header">
        <span className="expense-card-title">费用 #{index + 1}</span>
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={() => onDelete(expense.id)}
        >
          删除
        </button>
      </div>

      <div className="expense-form-row">
        <div className="form-group">
          <label className="form-label">描述 *</label>
          <input
            type="text"
            className={`form-input ${errors.description ? 'error' : ''}`}
            placeholder="如：午餐"
            value={expense.description}
            onChange={(e) => updateField('description', e.target.value)}
            maxLength={50}
          />
          {errors.description && <div className="error-text">{errors.description}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">金额 *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={`form-input ${errors.amount ? 'error' : ''}`}
            placeholder="0.00"
            value={expense.amount}
            onChange={(e) => updateField('amount', e.target.value)}
          />
          {errors.amount && <div className="error-text">{errors.amount}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">支付人 *</label>
          <select
            className={`form-select ${errors.payerId ? 'error' : ''}`}
            value={expense.payerId}
            onChange={(e) => updateField('payerId', e.target.value)}
          >
            <option value="">请选择</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.payerId && <div className="error-text">{errors.payerId}</div>}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label">分摊人 *</label>
        <div className="splitter-checkbox-list">
          {participants.map((p) => {
            const checked = (expense.sharedWith || []).includes(p.id)
            return (
              <label
                key={p.id}
                className={`splitter-checkbox-item ${checked ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSharedWith(p.id)}
                />
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: p.color,
                    color: '#fff',
                    fontSize: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {p.name.charAt(0)}
                </span>
                <span>{p.name}</span>
              </label>
            )
          })}
        </div>
        {errors.sharedWith && <div className="error-text">{errors.sharedWith}</div>}
      </div>

      <div className="split-mode-toggle">
        <div
          className={`split-mode-option ${
            expense.splitMode === SPLIT_MODE.EQUAL ? 'active' : ''
          }`}
          onClick={() => updateField('splitMode', SPLIT_MODE.EQUAL)}
        >
          平分
        </div>
        <div
          className={`split-mode-option ${
            expense.splitMode === SPLIT_MODE.CUSTOM ? 'active' : ''
          }`}
          onClick={() => updateField('splitMode', SPLIT_MODE.CUSTOM)}
        >
          自定义比例
        </div>
      </div>

      {expense.splitMode === SPLIT_MODE.CUSTOM && (
        <>
          {!ratioValidation.valid && (
            <div className="error-text" style={{ marginBottom: 8 }}>
              分摊比例之和必须为 100%（当前：{isNaN(ratioValidation.sum) ? '无效' : ratioValidation.sum + '%'}）
            </div>
          )}
          <div style={{ paddingLeft: 4 }}>
            {(expense.sharedWith || []).map((pid) => {
              const p = participantMap.get(pid)
              if (!p) return null
              const ratio = expense.ratios?.[pid] ?? 0
              const amount = shareResult[pid] ?? 0
              return (
                <div key={pid} className="splitter-ratio-row">
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: p.color,
                      color: '#fff',
                      fontSize: 10,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {p.name.charAt(0)}
                  </span>
                  <span className="splitter-ratio-name">{p.name}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="splitter-ratio-input"
                    value={ratio}
                    onChange={(e) => setRatio(pid, e.target.value)}
                  />
                  <span className="splitter-ratio-percent">%</span>
                  <span className="splitter-ratio-amount">¥{amount.toFixed(2)}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {expense.splitMode === SPLIT_MODE.EQUAL && (
        <div style={{ paddingLeft: 4 }}>
          {(expense.sharedWith || []).map((pid) => {
            const p = participantMap.get(pid)
            if (!p) return null
            const amount = shareResult[pid] ?? 0
            return (
              <div key={pid} className="splitter-ratio-row">
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: p.color,
                    color: '#fff',
                    fontSize: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {p.name.charAt(0)}
                </span>
                <span className="splitter-ratio-name" style={{ width: 100 }}>
                  {p.name}
                </span>
                <span className="splitter-ratio-amount" style={{ marginLeft: 0 }}>
                  ¥{amount.toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ExpensePanel({
  expenses,
  setExpenses,
  participants,
  totalAmount,
}) {
  const handleAdd = () => {
    if (participants.length < 2) return
    setExpenses([...expenses, createExpense(participants)])
  }

  const handleChange = (id, updated) => {
    setExpenses(expenses.map((e) => (e.id === id ? updated : e)))
  }

  const handleDelete = (id) => {
    setExpenses(expenses.filter((e) => e.id !== id))
  }

  return (
    <section className="bill-splitter-section">
      <h2 className="section-title">
        <span>费用明细</span>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={handleAdd}
          disabled={participants.length < 2}
        >
          + 添加费用
        </button>
      </h2>

      {expenses.length === 0 && (
        <div className="empty-hint">
          {participants.length < 2
            ? '添加参与者后可添加费用'
            : '还没有费用，点击「添加费用」开始记录'}
        </div>
      )}

      {expenses.length > 0 && (
        <div className="expenses-list">
          {expenses.map((exp, idx) => (
            <ExpenseItem
              key={exp.id}
              expense={exp}
              participants={participants}
              onChange={handleChange}
              onDelete={handleDelete}
              index={idx}
            />
          ))}
        </div>
      )}

      <div className="total-footer">
        <span className="total-label">总费用</span>
        <span className="total-amount">¥{totalAmount.toFixed(2)}</span>
      </div>
    </section>
  )
}
