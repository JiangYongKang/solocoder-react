import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './crm.css'
import CustomerTable from './CustomerTable.jsx'
import CustomerForm from './CustomerForm.jsx'
import CustomerDetail from './CustomerDetail.jsx'
import FunnelChart from './FunnelChart.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import TransferDialog from './TransferDialog.jsx'
import CSVImportDialog from './CSVImportDialog.jsx'
import {
  CUSTOMER_SOURCES,
  SORT_ORDERS,
  SORT_FIELDS,
  PAGE_SIZE,
  USERS,
} from './constants.js'
import {
  loadCustomers,
  saveCustomers,
  loadFollowups,
  saveFollowups,
  loadCurrentUser,
  saveCurrentUser,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  claimCustomer,
  releaseCustomer,
  transferCustomer,
  addFollowup,
  getCustomerList,
  getFollowupsByCustomer,
  getFunnelData,
  customersToCSV,
  downloadCSV,
  batchCreateCustomers,
  deleteFollowupsByCustomer,
} from './utils.js'

export default function CRMPage() {
  const navigate = useNavigate()

  const [customers, setCustomers] = useState(() => loadCustomers())
  const [followups, setFollowups] = useState(() => loadFollowups())
  const [currentUserId, setCurrentUserId] = useState(() => loadCurrentUser())

  const [viewMode, setViewMode] = useState('mine')
  const [keyword, setKeyword] = useState('')
  const [source, setSource] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortField, setSortField] = useState(SORT_FIELDS.CREATED_AT)
  const [sortOrder, setSortOrder] = useState(SORT_ORDERS.DESC)
  const [page, setPage] = useState(1)

  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formKey, setFormKey] = useState(0)

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, customer: null })
  const [releaseConfirm, setReleaseConfirm] = useState({ open: false, customer: null })
  const [transferDialog, setTransferDialog] = useState({ open: false, customer: null })
  const [csvImportOpen, setCSVImportOpen] = useState(false)

  const prevViewModeRef = useRef('mine')
  const prevKeywordRef = useRef('')
  const prevSourceRef = useRef('all')
  const prevStartDateRef = useRef('')
  const prevEndDateRef = useRef('')

  const handleCustomersUpdate = (next) => {
    setCustomers(next)
    queueMicrotask(() => saveCustomers(next))
  }

  const handleFollowupsUpdate = (next) => {
    setFollowups(next)
    queueMicrotask(() => saveFollowups(next))
  }

  const handleCurrentUserChange = (userId) => {
    setCurrentUserId(userId)
    saveCurrentUser(userId)
    setSelectedCustomer(null)
  }

  const handleViewModeChange = (mode) => {
    if (mode !== prevViewModeRef.current) {
      prevViewModeRef.current = mode
      setPage(1)
    }
    setViewMode(mode)
    setSelectedCustomer(null)
  }

  const handleKeywordChange = (value) => {
    setKeyword(value)
    if (value !== prevKeywordRef.current) {
      prevKeywordRef.current = value
      setPage(1)
    }
  }

  const handleSourceChange = (value) => {
    setSource(value)
    if (value !== prevSourceRef.current) {
      prevSourceRef.current = value
      setPage(1)
    }
  }

  const handleStartDateChange = (value) => {
    setStartDate(value)
    if (value !== prevStartDateRef.current) {
      prevStartDateRef.current = value
      setPage(1)
    }
  }

  const handleEndDateChange = (value) => {
    setEndDate(value)
    if (value !== prevEndDateRef.current) {
      prevEndDateRef.current = value
      setPage(1)
    }
  }

  const pagination = useMemo(
    () =>
      getCustomerList(customers, {
        ownerType: viewMode,
        currentUserId,
        keyword,
        source,
        startDate,
        endDate,
        sortField,
        sortOrder,
        page,
        pageSize: PAGE_SIZE,
      }),
    [customers, viewMode, currentUserId, keyword, source, startDate, endDate, sortField, sortOrder, page]
  )

  const currentViewCustomers = useMemo(() => {
    if (viewMode === 'mine') {
      return customers.filter((c) => c.ownerId === currentUserId)
    } else if (viewMode === 'pool') {
      return customers.filter((c) => !c.ownerId)
    }
    return customers
  }, [customers, viewMode, currentUserId])

  const currentViewFunnel = useMemo(() => getFunnelData(currentViewCustomers), [currentViewCustomers])

  const customerFollowups = useMemo(
    () => (selectedCustomer ? getFollowupsByCustomer(followups, selectedCustomer.id) : []),
    [followups, selectedCustomer]
  )

  function handleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === SORT_ORDERS.ASC ? SORT_ORDERS.DESC : SORT_ORDERS.ASC)
    } else {
      setSortField(field)
      setSortOrder(SORT_ORDERS.ASC)
    }
  }

  function handleOpenCreate() {
    setEditingCustomer(null)
    setFormKey((k) => k + 1)
    setFormModalOpen(true)
  }

  function handleOpenEdit(customer) {
    setEditingCustomer(customer)
    setFormKey((k) => k + 1)
    setFormModalOpen(true)
  }

  function handleFormSubmit(data) {
    let result
    if (editingCustomer) {
      result = updateCustomer(customers, editingCustomer.id, data)
      if (result.success) {
        handleCustomersUpdate(result.customers)
        if (selectedCustomer && selectedCustomer.id === editingCustomer.id) {
          setSelectedCustomer(result.customer)
        }
        setFormModalOpen(false)
        setEditingCustomer(null)
      }
    } else {
      const ownerId = viewMode === 'mine' ? currentUserId : null
      result = createCustomer(customers, { ...data, ownerId })
      if (result.success) {
        handleCustomersUpdate(result.customers)
        setFormModalOpen(false)
      }
    }
    return result
  }

  function handleAskDelete(customer) {
    setDeleteConfirm({ open: true, customer })
  }

  function handleConfirmDelete() {
    if (deleteConfirm.customer) {
      const result = deleteCustomer(customers, deleteConfirm.customer.id)
      if (result.success) {
        handleCustomersUpdate(result.customers)
        const updatedFollowups = deleteFollowupsByCustomer(followups, deleteConfirm.customer.id)
        handleFollowupsUpdate(updatedFollowups)
        if (selectedCustomer && selectedCustomer.id === deleteConfirm.customer.id) {
          setSelectedCustomer(null)
        }
      }
    }
    setDeleteConfirm({ open: false, customer: null })
  }

  function handleClaim(customer) {
    const result = claimCustomer(customers, customer.id, currentUserId)
    if (result.success) {
      handleCustomersUpdate(result.customers)
      if (selectedCustomer && selectedCustomer.id === customer.id) {
        setSelectedCustomer(result.customer)
      }
    }
  }

  function handleAskRelease(customer) {
    setReleaseConfirm({ open: true, customer })
  }

  function handleConfirmRelease() {
    if (releaseConfirm.customer) {
      const result = releaseCustomer(customers, releaseConfirm.customer.id)
      if (result.success) {
        handleCustomersUpdate(result.customers)
        if (selectedCustomer && selectedCustomer.id === releaseConfirm.customer.id) {
          setSelectedCustomer(result.customer)
        }
      }
    }
    setReleaseConfirm({ open: false, customer: null })
  }

  function handleAskTransfer(customer) {
    setTransferDialog({ open: true, customer })
  }

  function handleConfirmTransfer(targetUserId) {
    if (transferDialog.customer) {
      const result = transferCustomer(customers, transferDialog.customer.id, targetUserId)
      if (result.success) {
        handleCustomersUpdate(result.customers)
        if (selectedCustomer && selectedCustomer.id === transferDialog.customer.id) {
          setSelectedCustomer(null)
        }
      }
    }
    setTransferDialog({ open: false, customer: null })
  }

  function handleAddFollowup(data) {
    if (!selectedCustomer) return { success: false }
    const result = addFollowup(followups, selectedCustomer.id, data)
    if (result.success) {
      handleFollowupsUpdate(result.followups)
    }
    return result
  }

  function handleExportCSV() {
    const csv = customersToCSV(currentViewCustomers)
    if (csv) {
      const filename = viewMode === 'mine' ? 'my_customers.csv' : 'customer_pool.csv'
      downloadCSV(csv, filename)
    }
  }

  function handleCSVImportConfirm(validRows) {
    const ownerId = viewMode === 'mine' ? currentUserId : null
    const { customers: updated } = batchCreateCustomers(customers, validRows, ownerId)
    handleCustomersUpdate(updated)
    setCSVImportOpen(false)
  }

  function renderPagination() {
    const { total, totalPage, currentPage, pageSize } = pagination
    const pages = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPage, start + 4)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return (
      <div className="pagination">
        <div className="pagination-info">
          共 {total} 条，每页 {pageSize} 条
        </div>
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

  return (
    <div className="crm-page">
      <div className="page-header">
        <button className="btn btn-back" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="page-title">CRM 客户关系管理</h1>
        <div className="user-select-row">
          <span className="current-user-label">当前用户：</span>
          <select
            className="form-select"
            style={{ width: 120 }}
            value={currentUserId}
            onChange={(e) => handleCurrentUserChange(e.target.value)}
          >
            {USERS.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedCustomer && (
        <>
          <div className="crm-tabs">
            <button
              className={`crm-tab ${viewMode === 'mine' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('mine')}
            >
              我的客户
            </button>
            <button
              className={`crm-tab ${viewMode === 'pool' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('pool')}
            >
              客户公海
            </button>
          </div>

          <div className="crm-stats">
            <div className="stat-card">
              <div className="stat-card-label">客户总数</div>
              <div className="stat-card-value primary">{currentViewFunnel.total}</div>
            </div>
            {currentViewFunnel.stages.map((stage) => (
              <div className="stat-card" key={stage.key}>
                <div className="stat-card-label">{stage.label}</div>
                <div className="stat-card-value">{stage.count}</div>
              </div>
            ))}
          </div>

          <div className="funnel-section">
            <h3 className="funnel-title">
              {viewMode === 'mine' ? '我的客户' : '客户公海'} · 转化漏斗
            </h3>
            <FunnelChart funnelData={currentViewFunnel} />
          </div>

          <div className="toolbar">
            <div className="toolbar-left">
              <input
                className="form-input search-input"
                type="text"
                placeholder="按客户名称或公司搜索..."
                value={keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
              />
              <select
                className="form-select filter-select"
                value={source}
                onChange={(e) => handleSourceChange(e.target.value)}
              >
                <option value="all">全部来源</option>
                {CUSTOMER_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="form-input filter-date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
              <span style={{ color: 'var(--text)' }}>至</span>
              <input
                type="date"
                className="form-input filter-date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </div>
            <div className="toolbar-right">
              <button className="btn btn-secondary" onClick={() => setCSVImportOpen(true)}>
                导入 CSV
              </button>
              <button className="btn btn-secondary" onClick={handleExportCSV}>
                导出 CSV
              </button>
              <button className="btn btn-primary" onClick={handleOpenCreate}>
                + 新增客户
              </button>
            </div>
          </div>

          <CustomerTable
            items={pagination.items}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            onEdit={handleOpenEdit}
            onDelete={handleAskDelete}
            onClaim={handleClaim}
            onRelease={handleAskRelease}
            onTransfer={handleAskTransfer}
            onRowClick={setSelectedCustomer}
            viewMode={viewMode}
          />

          {renderPagination()}
        </>
      )}

      {selectedCustomer && (
        <CustomerDetail
          customer={selectedCustomer}
          followups={customerFollowups}
          onBack={() => setSelectedCustomer(null)}
          onEdit={() => handleOpenEdit(selectedCustomer)}
          onDelete={() => handleAskDelete(selectedCustomer)}
          onClaim={() => handleClaim(selectedCustomer)}
          onRelease={() => handleAskRelease(selectedCustomer)}
          onTransfer={() => handleAskTransfer(selectedCustomer)}
          onAddFollowup={handleAddFollowup}
          currentUserId={currentUserId}
        />
      )}

      {formModalOpen && (
        <div className="modal-overlay" onClick={() => setFormModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCustomer ? '编辑客户' : '新增客户'}
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  setFormModalOpen(false)
                  setEditingCustomer(null)
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <CustomerForm
                key={formKey}
                initialData={editingCustomer}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setFormModalOpen(false)
                  setEditingCustomer(null)
                }}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        title="确认删除"
        message={
          deleteConfirm.customer
            ? `确定要删除客户「${deleteConfirm.customer.name}」吗？此操作不可恢复，相关跟进记录也会被删除。`
            : ''
        }
        confirmText="删除"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, customer: null })}
      />

      <ConfirmDialog
        open={releaseConfirm.open}
        title="确认释放"
        message={
          releaseConfirm.customer
            ? `确定要将客户「${releaseConfirm.customer.name}」释放到公海吗？释放后其他用户可以领取该客户。`
            : ''
        }
        confirmText="释放"
        onConfirm={handleConfirmRelease}
        onCancel={() => setReleaseConfirm({ open: false, customer: null })}
      />

      <TransferDialog
        open={transferDialog.open}
        customer={transferDialog.customer}
        currentUserId={currentUserId}
        onConfirm={handleConfirmTransfer}
        onCancel={() => setTransferDialog({ open: false, customer: null })}
      />

      <CSVImportDialog
        open={csvImportOpen}
        onConfirm={handleCSVImportConfirm}
        onCancel={() => setCSVImportOpen(false)}
      />
    </div>
  )
}
