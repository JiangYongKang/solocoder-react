import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './budget-tracker.css'
import { CATEGORIES, CATEGORY_MAP, ADJUSTMENT_PAGE_SIZE } from './constants'
import {
  loadBudgets,
  saveBudgets,
  loadExpenses,
  saveExpenses,
  loadAdjustments,
  saveAdjustments,
  getCurrentMonthKey,
  getDaysRemainingInMonth,
  setBudget,
  getBudget,
  addExpense,
  deleteExpense,
  filterExpensesByMonth,
  filterExpensesByCategory,
  getAllCategoryProgress,
  calculateRemainingBudget,
  calculateDailyBudget,
  isDailyBudgetLow,
  getTotalMoM,
  getAllCategoryMoM,
  addAdjustment,
  paginateAdjustments,
  formatCurrency,
  formatDate,
  formatDateTime,
} from './utils'

const BudgetTracker = () => {
  const navigate = useNavigate()
  const currentMonth = getCurrentMonthKey()

  const [budgets, setBudgetsState] = useState(() => loadBudgets())
  const [expenses, setExpensesState] = useState(() => loadExpenses())
  const [adjustments, setAdjustmentsState] = useState(() => loadAdjustments())

  const [editingBudgetCat, setEditingBudgetCat] = useState(null)
  const [editingBudgetValue, setEditingBudgetValue] = useState('')
  const [budgetError, setBudgetError] = useState('')

  const [expandedCategory, setExpandedCategory] = useState(null)

  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newExpenseNote, setNewExpenseNote] = useState('')
  const [newExpenseCategory, setNewExpenseCategory] = useState(CATEGORIES[0].key)
  const [newExpenseDate, setNewExpenseDate] = useState(formatDate(new Date().toISOString()))
  const [expenseErrors, setExpenseErrors] = useState({})

  const [adjustmentPage, setAdjustmentPage] = useState(1)

  useEffect(() => {
    saveBudgets(budgets)
  }, [budgets])

  useEffect(() => {
    saveExpenses(expenses)
  }, [expenses])

  useEffect(() => {
    saveAdjustments(adjustments)
  }, [adjustments])

  const categoryProgress = useMemo(
    () => getAllCategoryProgress(expenses, budgets, currentMonth),
    [expenses, budgets, currentMonth]
  )

  const daysRemaining = useMemo(() => getDaysRemainingInMonth(currentMonth), [currentMonth])
  const remainingBudget = useMemo(
    () => calculateRemainingBudget(budgets, expenses, currentMonth),
    [budgets, expenses, currentMonth]
  )
  const dailyBudget = useMemo(
    () => calculateDailyBudget(budgets, expenses, currentMonth),
    [budgets, expenses, currentMonth]
  )
  const isDailyLow = useMemo(
    () => isDailyBudgetLow(budgets, expenses, currentMonth),
    [budgets, expenses, currentMonth]
  )

  const totalMoM = useMemo(() => getTotalMoM(expenses, currentMonth), [expenses, currentMonth])
  const categoryMoM = useMemo(
    () => getAllCategoryMoM(expenses, budgets, currentMonth),
    [expenses, budgets, currentMonth]
  )

  const adjustmentPagination = useMemo(
    () => paginateAdjustments(adjustments, adjustmentPage, ADJUSTMENT_PAGE_SIZE),
    [adjustments, adjustmentPage]
  )

  const handleStartEditBudget = (categoryKey) => {
    const current = getBudget(budgets, currentMonth, categoryKey)
    setEditingBudgetCat(categoryKey)
    setEditingBudgetValue(current > 0 ? String(current) : '')
    setBudgetError('')
  }

  const handleCancelEditBudget = () => {
    setEditingBudgetCat(null)
    setEditingBudgetValue('')
    setBudgetError('')
  }

  const handleSaveBudget = () => {
    if (!editingBudgetCat) return
    const oldBudget = getBudget(budgets, currentMonth, editingBudgetCat)
    const result = setBudget(budgets, currentMonth, editingBudgetCat, editingBudgetValue)
    if (!result.success) {
      setBudgetError(result.error)
      return
    }
    const newBudget = Number(editingBudgetValue) || 0
    if (oldBudget !== newBudget) {
      const adjResult = addAdjustment(adjustments, {
        categoryKey: editingBudgetCat,
        oldBudget,
        newBudget,
        monthKey: currentMonth,
      })
      if (adjResult.success) {
        setAdjustmentsState(adjResult.adjustments)
      }
    }
    setBudgetsState(result.budgets)
    setEditingBudgetCat(null)
    setEditingBudgetValue('')
    setBudgetError('')
  }

  const handleToggleCategory = (categoryKey) => {
    setExpandedCategory(expandedCategory === categoryKey ? null : categoryKey)
    if (expandedCategory !== categoryKey) {
      setNewExpenseCategory(categoryKey)
    }
  }

  const handleAddExpense = () => {
    const result = addExpense(expenses, {
      amount: newExpenseAmount,
      category: newExpenseCategory,
      date: newExpenseDate,
      note: newExpenseNote,
    })
    if (!result.success) {
      setExpenseErrors(result.errors)
      return
    }
    setExpensesState(result.expenses)
    setNewExpenseAmount('')
    setNewExpenseNote('')
    setNewExpenseDate(formatDate(new Date().toISOString()))
    setExpenseErrors({})
  }

  const handleDeleteExpense = (id) => {
    const result = deleteExpense(expenses, id)
    if (result.success) {
      setExpensesState(result.expenses)
    }
  }

  const getCategoryExpenses = (categoryKey) => {
    const monthExpenses = filterExpensesByMonth(expenses, currentMonth)
    return filterExpensesByCategory(monthExpenses, categoryKey).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )
  }

  const renderProgressBar = (progress) => {
    let barClass = 'progress-fill'
    if (progress.status === 'warning') barClass += ' warning'
    if (progress.status === 'danger') barClass += ' danger'
    const width = Math.min(progress.percent, 100)
    return (
      <div className="progress-bar">
        <div className={barClass} style={{ width: `${width}%` }} />
      </div>
    )
  }

  const renderMoMArrow = (mom) => {
    if (mom.isSame) return <span className="mom-same">—</span>
    if (mom.isIncrease) {
      return (
        <span className="mom-increase">
          ↑ {formatCurrency(Math.abs(mom.diff))} ({mom.percent}%)
        </span>
      )
    }
    return (
      <span className="mom-decrease">
        ↓ {formatCurrency(Math.abs(mom.diff))} ({Math.abs(mom.percent)}%)
      </span>
    )
  }

  const renderAdjustmentPagination = () => {
    const { total, totalPage, currentPage } = adjustmentPagination
    if (totalPage <= 1) return null
    const pages = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPage, start + 4)
    for (let i = start; i <= end; i++) pages.push(i)
    return (
      <div className="pagination">
        <div className="pagination-info">共 {total} 条记录</div>
        <div className="pagination-controls">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setAdjustmentPage(currentPage - 1)}
          >
            上一页
          </button>
          {pages.map((p) => (
            <button
              key={p}
              className={`page-btn ${p === currentPage ? 'active' : ''}`}
              onClick={() => setAdjustmentPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            disabled={currentPage === totalPage}
            onClick={() => setAdjustmentPage(currentPage + 1)}
          >
            下一页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="budget-tracker-page">
      <div className="bt-header">
        <button className="bt-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="bt-title">记账预算管理</h1>
      </div>

      <div className="bt-summary">
        <div className="summary-card">
          <div className="summary-label">本月剩余天数</div>
          <div className="summary-value">{daysRemaining} 天</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">剩余总预算</div>
          <div className="summary-value">{formatCurrency(remainingBudget)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">日均可用额度</div>
          <div className={`summary-value ${isDailyLow ? 'warning' : ''}`}>
            {formatCurrency(dailyBudget)}
            {isDailyLow && <span className="daily-warn">⚠ 偏低</span>}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">本月消费环比</div>
          <div className="summary-value">{renderMoMArrow(totalMoM)}</div>
        </div>
      </div>

      <div className="bt-section">
        <h2 className="section-title">分类消费环比（本月 vs 上月）</h2>
        <div className="mom-grid">
          {categoryMoM.map((item) => (
            <div key={item.categoryKey} className="mom-card">
              <div className="mom-header">
                <span className="mom-icon">{item.categoryIcon}</span>
                <span className="mom-label">{item.categoryLabel}</span>
              </div>
              <div className="mom-amount">
                本月: {formatCurrency(item.currentSpent)}
              </div>
              <div className="mom-arrow">{renderMoMArrow(item)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bt-section">
        <h2 className="section-title">分类预算（{currentMonth}）</h2>
        <div className="category-grid">
          {categoryProgress.map((progress) => {
            const isEditing = editingBudgetCat === progress.categoryKey
            const catExpenses = getCategoryExpenses(progress.categoryKey)
            const isExpanded = expandedCategory === progress.categoryKey
            return (
              <div
                key={progress.categoryKey}
                className={`category-card ${progress.isOverBudget ? 'over-budget' : ''}`}
              >
                <div className="category-header">
                  <div className="category-title">
                    <span className="category-icon">{progress.categoryIcon}</span>
                    <span className="category-name">{progress.categoryLabel}</span>
                  </div>
                  <div className="category-budget-edit">
                    {isEditing ? (
                      <div className="budget-edit-row">
                        <input
                          type="number"
                          className="budget-input"
                          value={editingBudgetValue}
                          onChange={(e) => setEditingBudgetValue(e.target.value)}
                          placeholder="预算金额"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveBudget()
                            if (e.key === 'Escape') handleCancelEditBudget()
                          }}
                        />
                        <button className="btn btn-sm btn-primary" onClick={handleSaveBudget}>
                          确定
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={handleCancelEditBudget}>
                          取消
                        </button>
                      </div>
                    ) : (
                      <span
                        className="budget-amount"
                        onClick={() => handleStartEditBudget(progress.categoryKey)}
                      >
                        预算 {formatCurrency(progress.budget)}
                      </span>
                    )}
                  </div>
                </div>
                {budgetError && isEditing && (
                  <div className="budget-error">{budgetError}</div>
                )}
                <div className="category-spent">
                  <span className="spent-text">
                    已花 {formatCurrency(progress.spent)} / 预算 {formatCurrency(progress.budget)}
                  </span>
                  <span className={`spent-percent ${progress.status}`}>
                    {progress.percent.toFixed(1)}%
                  </span>
                </div>
                {renderProgressBar(progress)}
                {progress.isOverBudget && (
                  <div className="over-warning">
                    ⚠ 已超支 {formatCurrency(progress.overAmount)}
                  </div>
                )}

                <button
                  className="expand-btn"
                  onClick={() => handleToggleCategory(progress.categoryKey)}
                >
                  {isExpanded ? '收起明细 ▲' : `查看明细 (${catExpenses.length}) ▼`}
                </button>

                {isExpanded && (
                  <div className="expense-detail">
                    <div className="expense-list">
                      {catExpenses.length === 0 ? (
                        <div className="empty-state">暂无消费记录</div>
                      ) : (
                        catExpenses.map((exp) => (
                          <div key={exp.id} className="expense-item">
                            <div className="expense-info">
                              <div className="expense-date">{exp.date}</div>
                              <div className="expense-note">{exp.note || '无备注'}</div>
                            </div>
                            <div className="expense-amount">-{formatCurrency(exp.amount)}</div>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteExpense(exp.id)}
                            >
                              删除
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="add-expense-form">
                      <h4>新增消费</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">金额</label>
                          <input
                            type="number"
                            className="form-input"
                            value={newExpenseAmount}
                            onChange={(e) => setNewExpenseAmount(e.target.value)}
                            placeholder="消费金额"
                          />
                          {expenseErrors.amount && (
                            <div className="form-error">{expenseErrors.amount}</div>
                          )}
                        </div>
                        <div className="form-group">
                          <label className="form-label">日期</label>
                          <input
                            type="date"
                            className="form-input"
                            value={newExpenseDate}
                            onChange={(e) => setNewExpenseDate(e.target.value)}
                          />
                          {expenseErrors.date && (
                            <div className="form-error">{expenseErrors.date}</div>
                          )}
                        </div>
                        <div className="form-group">
                          <label className="form-label">分类</label>
                          <select
                            className="form-select"
                            value={newExpenseCategory}
                            onChange={(e) => setNewExpenseCategory(e.target.value)}
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.icon} {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">备注</label>
                          <input
                            type="text"
                            className="form-input"
                            value={newExpenseNote}
                            onChange={(e) => setNewExpenseNote(e.target.value)}
                            placeholder="消费备注（可选）"
                          />
                          {expenseErrors.note && (
                            <div className="form-error">{expenseErrors.note}</div>
                          )}
                        </div>
                        <div className="form-group form-group-btn">
                          <button className="btn btn-primary" onClick={handleAddExpense}>
                            添加
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bt-section">
        <h2 className="section-title">预算调整记录</h2>
        {adjustments.length === 0 ? (
          <div className="empty-state">暂无调整记录</div>
        ) : (
          <>
            <div className="timeline">
              {adjustmentPagination.items.map((adj) => (
                <div key={adj.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-icon">{adj.categoryIcon}</span>
                      <span className="timeline-cat">{adj.categoryLabel}</span>
                      <span className="timeline-month">{adj.monthKey}</span>
                      <span className="timeline-time">{formatDateTime(adj.createdAt)}</span>
                    </div>
                    <div className="timeline-body">
                      原预算: {formatCurrency(adj.oldBudget)} → 新预算:{' '}
                      {formatCurrency(adj.newBudget)}
                      <span className={`timeline-diff ${adj.diff >= 0 ? 'increase' : 'decrease'}`}>
                        {adj.diff >= 0 ? '+' : ''}
                        {formatCurrency(adj.diff)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {renderAdjustmentPagination()}
          </>
        )}
      </div>
    </div>
  )
}

export default BudgetTracker
