import { useState } from 'react'
import { CATEGORY_MAP } from './constants'
import { formatCurrency } from './utils'

const BudgetPanel = ({ progressList, onSetBudget }) => {
  const [editingCat, setEditingCat] = useState(null)
  const [editValue, setEditValue] = useState('')

  const handleStartEdit = (catKey, currentBudget) => {
    setEditingCat(catKey)
    setEditValue(currentBudget ? currentBudget.toString() : '')
  }

  const handleSaveEdit = (catKey) => {
    onSetBudget(catKey, editValue || 0)
    setEditingCat(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingCat(null)
    setEditValue('')
  }

  return (
    <div className="budget-list">
      {progressList.map((item) => {
        const cat = CATEGORY_MAP[item.categoryKey] || {}
        const isEditing = editingCat === item.categoryKey
        const displayPercent = Math.min(item.percent, 100)

        return (
          <div key={item.categoryKey} className="budget-item">
            <div className="budget-header">
              <div className="budget-category">
                <span>{cat.icon}</span>
                <span>{item.categoryLabel}</span>
              </div>
              {isEditing ? (
                <div className="budget-input-row">
                  <input
                    type="number"
                    className="budget-input"
                    placeholder="预算金额"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                  />
                  <button className="btn btn-sm btn-primary" onClick={() => handleSaveEdit(item.categoryKey)}>
                    保存
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={handleCancelEdit}>
                    取消
                  </button>
                </div>
              ) : (
                <div className={`budget-amounts ${item.isOverBudget ? 'over' : ''}`}>
                  {formatCurrency(item.spent)} / {item.budget > 0 ? formatCurrency(item.budget) : '未设置'}
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ marginLeft: 8 }}
                    onClick={() => handleStartEdit(item.categoryKey, item.budget)}
                  >
                    {item.budget > 0 ? '修改' : '设置'}
                  </button>
                </div>
              )}
            </div>
            {item.budget > 0 && (
              <>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${item.isOverBudget ? 'over' : ''}`}
                    style={{ width: `${displayPercent}%` }}
                  />
                </div>
                {item.isOverBudget && (
                  <div className="budget-warning">
                    ⚠️ 已超出预算 {formatCurrency(item.spent - item.budget)}
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default BudgetPanel
