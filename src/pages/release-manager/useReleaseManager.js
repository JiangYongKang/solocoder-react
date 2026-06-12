import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  loadReleases,
  saveReleases,
  createRelease,
  updateRelease,
  performApprovalAction,
  getReleaseList,
  getReleaseStats,
} from './utils.js'

export function useReleaseManager() {
  const [releases, setReleases] = useState(() => loadReleases())
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [detailReleaseId, setDetailReleaseId] = useState(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingRelease, setEditingRelease] = useState(null)
  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [diffBaseId, setDiffBaseId] = useState(null)
  const [diffCompareId, setDiffCompareId] = useState(null)

  useEffect(() => {
    saveReleases(releases)
  }, [releases])

  const paginatedResult = useMemo(
    () => getReleaseList(releases, { status: statusFilter, page: currentPage }),
    [releases, statusFilter, currentPage]
  )

  const stats = useMemo(() => getReleaseStats(releases), [releases])

  const detailRelease = useMemo(
    () => (detailReleaseId ? releases.find((r) => r.id === detailReleaseId) : null),
    [detailReleaseId, releases]
  )

  const handleStatusFilterChange = useCallback((status) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
  }, [])

  const handleCreate = useCallback(() => {
    setEditingRelease(null)
    setFormModalOpen(true)
  }, [])

  const handleEdit = useCallback((release) => {
    setEditingRelease(release)
    setFormModalOpen(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setFormModalOpen(false)
    setEditingRelease(null)
  }, [])

  const handleSubmitForm = useCallback(
    (formData) => {
      if (editingRelease) {
        const result = updateRelease(releases, editingRelease.id, formData)
        if (result.success) {
          setReleases(result.releases)
          setFormModalOpen(false)
          setEditingRelease(null)
          return { success: true }
        }
        return result
      } else {
        const result = createRelease(releases, formData)
        if (result.success) {
          setReleases(result.releases)
          setFormModalOpen(false)
          return { success: true }
        }
        return result
      }
    },
    [editingRelease, releases]
  )

  const handleApprovalAction = useCallback((id, action, remark = '') => {
    const result = performApprovalAction(releases, id, action, remark)
    if (result.success) {
      setReleases(result.releases)
    }
    return result
  }, [releases])

  const handleOpenDetail = useCallback((release) => {
    setDetailReleaseId(release.id)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setDetailReleaseId(null)
  }, [])

  const handleOpenDiff = useCallback((baseRelease) => {
    setDiffBaseId(baseRelease.id)
    setDiffCompareId(null)
    setDiffModalOpen(true)
  }, [])

  const handleCloseDiff = useCallback(() => {
    setDiffModalOpen(false)
    setDiffBaseId(null)
    setDiffCompareId(null)
  }, [])

  const handleSelectCompareId = useCallback((id) => {
    setDiffCompareId(id)
  }, [])

  const handleSwapDiff = useCallback(() => {
    setDiffBaseId((prevBase) => {
      const prevCompare = diffCompareId
      setDiffCompareId(prevBase)
      return prevCompare
    })
  }, [diffCompareId])

  const diffBaseRelease = useMemo(
    () => (diffBaseId ? releases.find((r) => r.id === diffBaseId) : null),
    [diffBaseId, releases]
  )

  const diffCompareRelease = useMemo(
    () => (diffCompareId ? releases.find((r) => r.id === diffCompareId) : null),
    [diffCompareId, releases]
  )

  return {
    releases,
    statusFilter,
    currentPage,
    paginatedResult,
    stats,
    detailRelease,
    formModalOpen,
    editingRelease,
    diffModalOpen,
    diffBaseId,
    diffCompareId,
    diffBaseRelease,
    diffCompareRelease,
    setStatusFilter: handleStatusFilterChange,
    setCurrentPage: handlePageChange,
    handleCreate,
    handleEdit,
    handleCloseForm,
    handleSubmitForm,
    handleApprovalAction,
    handleOpenDetail,
    handleCloseDetail,
    handleOpenDiff,
    handleCloseDiff,
    handleSelectCompareId,
    handleSwapDiff,
  }
}
