import { useState } from 'react'
import {
  TRANSACTION_TYPES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  getCategoryType,
} from './constants'
import { formatDate } from './utils'

const TransactionForm = ({ initialData, onSubmit, onCancel }) => {
  const initialType = initialData?.category
    ? getCategoryType(initialData.category) || TRANSACTION_TYPES.EXPENSE
    : TRANSACTION_TYPES.EXPENSE

  const [type, setType] = useState(initialType)
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [date, setDate] = useState(initialData?.date || formatDate(new Date().toISOString()))
  const [note, setNote] = useState(initialData?.note || '')
  const [errors, setErrors] = useState({})

  const categories = type === TRANSACTION_TYPES.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const categoryKeys = categories.map((c) => c.key)

  const handleTypeChange = (newType) => {
    setType(newType)
    const newCategories = newType === TRANSACTION_TYPES.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    const newKeys = newCategories.map((c) => c.key)
    if (category && !newKeys.includes(category)) {
      setCategory('')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = onSubmit({
      amount,
      category,
      date,
      note,
    })
    if (result && result.success === false) {
      setErrors(result.errors || {})
    } else {
      if (!initialData) {
        setAmount('')
        setCategory('')
        setDate(formatDate(new Date().toISOString()))
        setNote('')
        setErrors({})
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">类型</label>
          <div className="type-tabs">
            <button
              type="button"
              className={`type-tab ${type === TRANSACTION_TYPES.EXPENSE ? 'active' : ''}`}
              onClick={() => handleTypeChange(TRANSACTION_TYPES.EXPENSE)}
            >
              支出
            </button>
            <button
              type="button"
              className={`type-tab ${type === TRANSACTION_TYPES.INCOME ? 'active' : ''}`}
              onClick={() => handleTypeChange(TRANSACTION_TYPES.INCOME)}
            >
              收入
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">金额</label>
          <input
            type="number"
            step="0.01"
            className="form-input"
            placeholder="请输入金额"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {errors.amount && <span className="form-error">{errors.amount}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">分类</label>
          <select
            className="form-select"
            value={categoryKeys.includes(category) ? category : ''}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">请选择分类</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
          {errors.category && <span className="form-error">{errors.category}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">日期</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date && <span className="form-error">{errors.date}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">&nbsp;</label>
          <button type="submit" className="btn btn-primary">
            {initialData ? '保存修改' : '添加记录'}
          </button>
        </div>

        <div className="form-group full-width">
          <label className="form-label">备注</label>
          <textarea
            className="form-textarea"
            placeholder="可选，最多200字"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          {errors.note && <span className="form-error">{errors.note}</span>}
        </div>
      </div>

      {initialData && onCancel && (
        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
        </div>
      )}
    </form>
  )
}

export default TransactionForm
