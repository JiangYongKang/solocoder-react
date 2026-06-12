import { useState } from 'react'
import './release-manager.css'
import { useReleaseManager } from './useReleaseManager.js'
import StatsCards from './components/StatsCards.jsx'
import FilterBar from './components/FilterBar.jsx'
import ReleaseList from './components/ReleaseList.jsx'
import Pagination from './components/Pagination.jsx'
import ReleaseFormModal from './components/ReleaseFormModal.jsx'
import ReleaseDetailModal from './components/ReleaseDetailModal.jsx'
import ApprovalActionModal from './components/ApprovalActionModal.jsx'
import DiffPanel from './components/DiffPanel.jsx'

export default function ReleaseManager() {
  const manager = useReleaseManager()
  const [actionModalState, setActionModalState] = useState({
    open: false,
    action: null,
    release: null,
  })
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2500)
  }

  const handleApprovalAction = (id, action) => {
    const release = manager.releases.find((r) => r.id === id)
    setActionModalState({ open: true, action, release })
  }

  const confirmApprovalAction = (remark) => {
    const { release, action } = actionModalState
    if (!release || !action) return
    const result = manager.handleApprovalAction(release.id, action, remark)
    setActionModalState({ open: false, action: null, release: null })
    if (result.success) {
      showToast('操作成功', 'success')
    } else {
      showToast(result.error || '操作失败', 'error')
    }
  }

  const handleDiffSelector = (which, release) => {
    if (which === 'base') {
      manager.handleCloseDiff()
      setTimeout(() => {
        manager.handleOpenDiff(release)
      }, 0)
    } else {
      manager.handleSelectCompareId(release.id)
    }
  }

  return (
    <div className="release-manager-page">
      <div className="rm-page-header">
        <h1 className="rm-page-title">版本发布管理</h1>
        <p className="rm-page-desc">管理软件版本的全生命周期，包括版本创建、审批流程和回滚操作</p>
      </div>

      <StatsCards
        stats={manager.stats}
        activeFilter={manager.statusFilter}
        onFilterClick={manager.setStatusFilter}
      />

      <FilterBar
        statusFilter={manager.statusFilter}
        onStatusChange={manager.setStatusFilter}
        onCreate={manager.handleCreate}
      />

      <ReleaseList
        items={manager.paginatedResult.items}
        onEdit={manager.handleEdit}
        onDetail={manager.handleOpenDetail}
        onDiff={manager.handleOpenDiff}
        onApprovalAction={handleApprovalAction}
        isDiffSelectMode={false}
      />

      <Pagination
        total={manager.paginatedResult.total}
        currentPage={manager.paginatedResult.currentPage}
        totalPage={manager.paginatedResult.totalPage}
        pageSize={manager.paginatedResult.pageSize}
        onPageChange={manager.setCurrentPage}
      />

      <ReleaseFormModal
        key={`${manager.formModalOpen}-${manager.editingRelease?.id || 'new'}`}
        open={manager.formModalOpen}
        editingRelease={manager.editingRelease}
        existingReleases={manager.releases}
        onClose={manager.handleCloseForm}
        onSubmit={manager.handleSubmitForm}
      />

      <ReleaseDetailModal
        open={!!manager.detailRelease}
        release={manager.detailRelease}
        onClose={manager.handleCloseDetail}
        onEdit={(r) => {
          manager.handleCloseDetail()
          setTimeout(() => manager.handleEdit(r), 0)
        }}
        onApprovalAction={(id, action) => {
          const release = manager.releases.find((r) => r.id === id)
          if (release) {
            manager.handleCloseDetail()
            setTimeout(() => handleApprovalAction(id, action), 0)
          }
        }}
      />

      <ApprovalActionModal
        key={`${actionModalState.open}-${actionModalState.action || 'none'}-${actionModalState.release?.id || 'none'}`}
        open={actionModalState.open}
        action={actionModalState.action}
        release={actionModalState.release}
        onClose={() => setActionModalState({ open: false, action: null, release: null })}
        onConfirm={confirmApprovalAction}
      />

      <DiffPanel
        open={manager.diffModalOpen}
        allReleases={manager.releases}
        baseRelease={manager.diffBaseRelease}
        compareRelease={manager.diffCompareRelease}
        onSelectCompare={handleDiffSelector}
        onSwap={manager.handleSwapDiff}
        onClose={manager.handleCloseDiff}
      />

      {toast.show && (
        <div className={`rm-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
