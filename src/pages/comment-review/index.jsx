import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './comment-review.css'
import PendingQueue from './PendingQueue.jsx'
import ReviewedList from './ReviewedList.jsx'
import SensitiveWords from './SensitiveWords.jsx'
import RejectModal from './RejectModal.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { TABS, TAB_LABEL, REVIEW_RESULT_OPTIONS } from './constants'
import {
  loadComments,
  saveComments,
  loadReviewRecords,
  saveReviewRecords,
  loadSensitiveWords,
  saveSensitiveWords,
  approveComment,
  rejectComment,
  deleteComment,
  batchApproveComments,
  batchRejectComments,
  batchDeleteComments,
  getPendingComments,
} from './utils'

export default function CommentReviewPage() {
  const navigate = useNavigate()

  const [comments, setComments] = useState(() => loadComments())
  const [reviewRecords, setReviewRecords] = useState(() => loadReviewRecords())
  const [sensitiveWords, setSensitiveWords] = useState(() => loadSensitiveWords())

  const [activeTab, setActiveTab] = useState(TABS.PENDING)

  const [pendingPage, setPendingPage] = useState(1)
  const [reviewedPage, setReviewedPage] = useState(1)

  const [selectedIds, setSelectedIds] = useState([])

  const [reviewedFilterResult, setReviewedFilterResult] = useState(REVIEW_RESULT_OPTIONS.ALL)
  const [reviewedFilterRejectReason, setReviewedFilterRejectReason] = useState('')
  const [reviewedFilterStartDate, setReviewedFilterStartDate] = useState('')
  const [reviewedFilterEndDate, setReviewedFilterEndDate] = useState('')

  const [sensitiveKeyword, setSensitiveKeyword] = useState('')

  const prevReviewedFilterRef = useRef({
    result: REVIEW_RESULT_OPTIONS.ALL,
    rejectReason: '',
    startDate: '',
    endDate: '',
  })

  const [rejectModal, setRejectModal] = useState({
    open: false,
    isBatch: false,
    targetComment: null,
  })

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    danger: false,
    onConfirm: null,
  })

  const handleCommentsUpdate = (next) => {
    setComments(next)
    queueMicrotask(() => saveComments(next))
  }

  const handleReviewRecordsUpdate = (next) => {
    setReviewRecords(next)
    queueMicrotask(() => saveReviewRecords(next))
  }

  const handleSensitiveWordsUpdate = (next) => {
    setSensitiveWords(next)
    queueMicrotask(() => saveSensitiveWords(next))
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPendingPage(1)
    setReviewedPage(1)
  }

  const handlePendingPageChange = (page) => {
    setPendingPage(page)
  }

  const handleReviewedPageChange = (page) => {
    setReviewedPage(page)
  }

  const handleReviewedFilterResultChange = (value) => {
    setReviewedFilterResult(value)
    if (value !== prevReviewedFilterRef.current.result) {
      prevReviewedFilterRef.current.result = value
      setReviewedPage(1)
    }
  }

  const handleReviewedFilterRejectReasonChange = (value) => {
    setReviewedFilterRejectReason(value)
    if (value !== prevReviewedFilterRef.current.rejectReason) {
      prevReviewedFilterRef.current.rejectReason = value
      setReviewedPage(1)
    }
  }

  const handleReviewedFilterStartDateChange = (value) => {
    setReviewedFilterStartDate(value)
    if (value !== prevReviewedFilterRef.current.startDate) {
      prevReviewedFilterRef.current.startDate = value
      setReviewedPage(1)
    }
  }

  const handleReviewedFilterEndDateChange = (value) => {
    setReviewedFilterEndDate(value)
    if (value !== prevReviewedFilterRef.current.endDate) {
      prevReviewedFilterRef.current.endDate = value
      setReviewedPage(1)
    }
  }

  const handleSelectAll = (checked) => {
    const pending = getPendingComments(comments)
    const startIdx = (pendingPage - 1) * 20
    const endIdx = startIdx + 20
    const visibleIds = pending.slice(startIdx, endIdx).map((c) => c.id)
    if (checked) {
      setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])))
    } else {
      setSelectedIds(selectedIds.filter((id) => !visibleIds.includes(id)))
    }
  }

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((x) => x !== id))
    }
  }

  const handleApprove = (comment) => {
    const result = approveComment(comments, comment.id, reviewRecords)
    if (result.success) {
      handleCommentsUpdate(result.comments)
      handleReviewRecordsUpdate(result.records)
      setSelectedIds(selectedIds.filter((id) => id !== comment.id))
    }
  }

  const handleReject = (comment) => {
    setRejectModal({
      open: true,
      isBatch: false,
      targetComment: comment,
    })
  }

  const handleDelete = (comment) => {
    setConfirmDialog({
      open: true,
      title: '确认删除',
      message: `确定要删除该评论吗？此操作不可恢复。`,
      danger: true,
      onConfirm: () => {
        const result = deleteComment(comments, comment.id)
        if (result.success) {
          handleCommentsUpdate(result.comments)
          setSelectedIds(selectedIds.filter((id) => id !== comment.id))
        }
        setConfirmDialog({ open: false, title: '', message: '', danger: false, onConfirm: null })
      },
    })
  }

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return
    setConfirmDialog({
      open: true,
      title: '批量通过',
      message: `确定要批量通过选中的 ${selectedIds.length} 条评论吗？`,
      danger: false,
      onConfirm: () => {
        const result = batchApproveComments(comments, selectedIds, reviewRecords)
        if (result.success) {
          handleCommentsUpdate(result.comments)
          handleReviewRecordsUpdate(result.records)
          setSelectedIds([])
        }
        setConfirmDialog({ open: false, title: '', message: '', danger: false, onConfirm: null })
      },
    })
  }

  const handleBatchReject = () => {
    if (selectedIds.length === 0) return
    setRejectModal({
      open: true,
      isBatch: true,
      targetComment: null,
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmDialog({
      open: true,
      title: '批量删除',
      message: `确定要批量删除选中的 ${selectedIds.length} 条评论吗？此操作不可恢复。`,
      danger: true,
      onConfirm: () => {
        const result = batchDeleteComments(comments, selectedIds)
        if (result.success) {
          handleCommentsUpdate(result.comments)
          setSelectedIds([])
        }
        setConfirmDialog({ open: false, title: '', message: '', danger: false, onConfirm: null })
      },
    })
  }

  const handleRejectConfirm = (reason, detail) => {
    if (rejectModal.isBatch) {
      const result = batchRejectComments(comments, selectedIds, reason, detail, reviewRecords)
      if (result.success) {
        handleCommentsUpdate(result.comments)
        handleReviewRecordsUpdate(result.records)
        setSelectedIds([])
      }
    } else if (rejectModal.targetComment) {
      const result = rejectComment(
        comments,
        rejectModal.targetComment.id,
        reason,
        detail,
        reviewRecords
      )
      if (result.success) {
        handleCommentsUpdate(result.comments)
        handleReviewRecordsUpdate(result.records)
        setSelectedIds(selectedIds.filter((id) => id !== rejectModal.targetComment.id))
      }
    }
    setRejectModal({ open: false, isBatch: false, targetComment: null })
  }

  const handleRejectCancel = () => {
    setRejectModal({ open: false, isBatch: false, targetComment: null })
  }

  const handleConfirmCancel = () => {
    setConfirmDialog({ open: false, title: '', message: '', danger: false, onConfirm: null })
  }

  return (
    <div className="comment-review-page">
      <div className="page-header">
        <button className="btn btn-back" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="page-title">评论审核系统</h1>
      </div>

      <div className="cr-tabs">
        {Object.entries(TAB_LABEL).map(([key, label]) => (
          <button
            key={key}
            className={`cr-tab ${activeTab === key ? 'active' : ''}`}
            onClick={() => handleTabChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === TABS.PENDING && (
        <PendingQueue
          comments={comments}
          sensitiveWords={sensitiveWords}
          page={pendingPage}
          onPageChange={handlePendingPageChange}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
          onBatchApprove={handleBatchApprove}
          onBatchReject={handleBatchReject}
          onBatchDelete={handleBatchDelete}
        />
      )}

      {activeTab === TABS.REVIEWED && (
        <ReviewedList
          comments={comments}
          page={reviewedPage}
          onPageChange={handleReviewedPageChange}
          filterResult={reviewedFilterResult}
          onFilterResultChange={handleReviewedFilterResultChange}
          filterRejectReason={reviewedFilterRejectReason}
          onFilterRejectReasonChange={handleReviewedFilterRejectReasonChange}
          filterStartDate={reviewedFilterStartDate}
          onFilterStartDateChange={handleReviewedFilterStartDateChange}
          filterEndDate={reviewedFilterEndDate}
          onFilterEndDateChange={handleReviewedFilterEndDateChange}
        />
      )}

      {activeTab === TABS.SENSITIVE && (
        <SensitiveWords
          words={sensitiveWords}
          onWordsChange={handleSensitiveWordsUpdate}
          keyword={sensitiveKeyword}
          onKeywordChange={setSensitiveKeyword}
        />
      )}

      <RejectModal
        open={rejectModal.open}
        commentCount={rejectModal.isBatch ? selectedIds.length : 1}
        onConfirm={handleRejectConfirm}
        onCancel={handleRejectCancel}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        danger={confirmDialog.danger}
        confirmText="确认"
        onConfirm={confirmDialog.onConfirm}
        onCancel={handleConfirmCancel}
      />
    </div>
  )
}
