import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './finance.css'
import TransactionForm from './TransactionForm'
import TransactionList from './TransactionList'
import BudgetPanel from './BudgetPanel'
import StatsPanel from './StatsPanel'
import {
  TRANSACTION_TYPES,
  ALL_CATEGORIES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from './constants'
import {
  loadTransactions,
  saveTransactions,
  loadBudgets,
  saveBudgets,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  setBudget,
  getTransactionList,
  getCurrentMonthKey,
  getBudgetProgressList,
  calculateMonthlySummary,
  buildTrendData,
  buildPieData,
  formatCurrency,
} from './utils'

const FinancePage = () => {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState(() => loadTransactions())
  const [budgets, setBudgets] = useState(() => loadBudgets())
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey())
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, tx: null })

  useEffect(() => {
    saveTransactions(transactions)
  }, [transactions])

  useEffect(() => {
    saveBudgets(budgets)
  }, [budgets])

  const pagination = useMemo(
    () =>
      getTransactionList(transactions, {
        month: selectedMonth,
        type: filterType === 'all' ? null : filterType,
        category: filterCategory,
        keyword,
        page,
      }),
    [transactions, selectedMonth, filterType, filterCategory, keyword, page]
  )

  const summary = useMemo(
    () => calculateMonthlySummary(transactions, selectedMonth),
    [transactions, selectedMonth]
  )

  const budgetProgress = useMemo(
    () => getBudgetProgressList(transactions, budgets, selectedMonth),
    [transactions, budgets, selectedMonth]
  )

  const trendData = useMemo(() => buildTrendData(transactions, selectedMonth), [transactions, selectedMonth])
  const pieData = useMemo(() => buildPieData(transactions, selectedMonth), [transactions, selectedMonth])

  const availableCategories = useMemo(() => {
    if (filterType === 'all') return ALL_CATEGORIES
    if (filterType === TRANSACTION_TYPES.INCOME) return INCOME_CATEGORIES
    return EXPENSE_CATEGORIES
  }, [filterType])

  const handleCreate = (data) => {
    const result = createTransaction(transactions, data)
    if (result.success) {
      setTransactions(result.transactions)
      setPage(1)
    }
    return result
  }

  const handleOpenEdit = (tx) => {
    setEditingTx(tx)
    setEditModalOpen(true)
  }

  const handleEditSubmit = (data) => {
    if (!editingTx) return { success: false }
    const result = updateTransaction(transactions, editingTx.id, data)
    if (result.success) {
      setTransactions(result.transactions)
      setEditModalOpen(false)
      setEditingTx(null)
    }
    return result
  }

  const handleAskDelete = (tx) => {
    setDeleteConfirm({ open: true, tx })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirm.tx) {
      const result = deleteTransaction(transactions, deleteConfirm.tx.id)
      if (result.success) {
        setTransactions(result.transactions)
      }
    }
    setDeleteConfirm({ open: false, tx: null })
  }

  const handleSetBudget = (categoryKey, amount) => {
    const result = setBudget(budgets, selectedMonth, categoryKey, amount)
    if (result.success) {
      setBudgets(result.budgets)
    }
  }

  const handleMonthChange = (value) => {
    setSelectedMonth(value)
    setPage(1)
  }

  const handleFilterTypeChange = (value) => {
    setFilterType(value)
    setFilterCategory('all')
    setPage(1)
  }

  const handleCategoryChange = (value) => {
    setFilterCategory(value)
    setPage(1)
  }

  const handleKeywordChange = (e) => {
    setKeyword(e.target.value)
    setPage(1)
  }

  const renderPagination = () => {
    const { total, totalPage, currentPage } = pagination
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
            onClick={() => setPage(currentPage - 1)}
          >
            上一页
          </button>
          {pages.map((p) => (
            <button
              key={p}
              className={`page-btn ${p === currentPage ? 'active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            disabled={currentPage === totalPage}
            onClick={() => setPage(currentPage + 1)}
          >
            下一页
          </button>
        </div>
      </div>
    )
  }

  const getMonthOptions = () => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      options.push({ value: `${y}-${m}`, label: `${y}-${m}` })
    }
    return options
  }

  return (
    <div className="finance-page">
      <div className="finance-header">
        <button className="finance-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="finance-title">个人财务管理</h1>
      </div>

      <div className="finance-summary">
        <div className="summary-card">
          <div className="summary-label">本月收入</div>
          <div className="summary-value income">{formatCurrency(summary.income)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">本月支出</div>
          <div className="summary-value expense">{formatCurrency(summary.expense)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">本月结余</div>
          <div className={`summary-value ${summary.balance >= 0 ? 'income' : 'expense'}`}>
            {formatCurrency(summary.balance)}
          </div>
        </div>
      </div>

      <div className="finance-section">
        <h2 className="section-title">记一笔</h2>
        <TransactionForm onSubmit={handleCreate} />
      </div>

      <div className="finance-section">
        <h2 className="section-title">统计图表</h2>
        <div className="toolbar">
          <select
            className="form-select"
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
          >
            {getMonthOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <StatsPanel trendData={trendData} pieData={pieData} />
      </div>

      <div className="finance-section">
        <h2 className="section-title">预算管理（{selectedMonth}）</h2>
        <BudgetPanel
          progressList={budgetProgress}
          onSetBudget={handleSetBudget}
        />
      </div>

      <div className="finance-section">
        <h2 className="section-title">收支明细</h2>
        <div className="toolbar">
          <select
            className="form-select"
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
          >
            {getMonthOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            value={filterType}
            onChange={(e) => handleFilterTypeChange(e.target.value)}
          >
            <option value="all">全部类型</option>
            <option value={TRANSACTION_TYPES.INCOME}>仅收入</option>
            <option value={TRANSACTION_TYPES.EXPENSE}>仅支出</option>
          </select>
          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="all">全部分类</option>
            {availableCategories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            className="form-input search-input"
            type="text"
            placeholder="搜索备注或分类..."
            value={keyword}
            onChange={handleKeywordChange}
          />
        </div>

        <TransactionList
          items={pagination.items}
          onEdit={handleOpenEdit}
          onDelete={handleAskDelete}
        />

        {renderPagination()}
      </div>

      {editModalOpen && (
        <div className="modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">编辑记录</h2>
            <TransactionForm
              initialData={editingTx}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setEditModalOpen(false)
                setEditingTx(null)
              }}
            />
          </div>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm({ open: false, tx: null })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">确认删除</h2>
            <p className="confirm-message">
              确定要删除这条记录吗？此操作不可恢复。
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm({ open: false, tx: null })}
              >
                取消
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinancePage
