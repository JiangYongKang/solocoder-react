import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  loadReleases,
  saveReleases,
  createRelease,
  updateRelease,
  performApprovalAction,
  getReleaseList,
  getReleaseStats,
} from './utils.js'
import { AVAILABLE_USERS } from './constants.js'

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
  const [currentUserId, setCurrentUserId] = useState(AVAILABLE_USERS[0].id)
  const [processingIds, setProcessingIds] = useState(() => new Set())

  const currentUser = useMemo(
    () => AVAILABLE_USERS.find((u) => u.id === currentUserId) || AVAILABLE_USERS[0],
    [currentUserId]
  )

  const releasesRef = useRef(releases)
  useEffect(() => {
    releasesRef.current = releases
  }, [releases])

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
      const currentReleases = releasesRef.current
      if (editingRelease) {
        const result = updateRelease(currentReleases, editingRelease.id, formData)
        if (result.success) {
          releasesRef.current = result.releases
          setReleases(result.releases)
          setFormModalOpen(false)
          setEditingRelease(null)
          return { success: true }
        }
        return result
      } else {
        const result = createRelease(currentReleases, formData, currentUser)
        if (result.success) {
          releasesRef.current = result.releases
          setReleases(result.releases)
          setFormModalOpen(false)
          return { success: true }
        }
        return result
      }
    },
    [editingRelease, currentUser]
  )

  const isProcessing = useCallback((id) => processingIds.has(id), [processingIds])

  const handleApprovalAction = useCallback((id, action, remark = '') => {
    if (processingIds.has(id)) {
      return { success: false, error: '操作进行中，请稍候' }
    }

    const currentReleases = releasesRef.current
    const release = currentReleases.find((r) => r.id === id)
    if (!release) {
      return { success: false, error: '版本不存在' }
    }

    setProcessingIds((prev) => new Set(prev).add(id))

    try {
      const result = performApprovalAction(
        currentReleases,
        id,
        action,
        remark,
        currentUser,
        release.updatedAt
      )
      if (result.success) {
        releasesRef.current = result.releases
        setReleases(result.releases)
      }
      return result
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [currentUser, processingIds])

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
    currentUser,
    setCurrentUserId,
    isProcessing,
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
