import { useState, useCallback, useEffect } from 'react'
import FolderNav from './FolderNav'
import EmailList from './EmailList'
import EmailDetail from './EmailDetail'
import ComposeModal from './ComposeModal'
import ConfirmDialog from './ConfirmDialog'
import { FOLDERS } from './constants'
import {
  loadEmails,
  saveEmails,
  markEmailRead,
  toggleEmailStarred,
  markAsSpam,
  moveToTrash,
  deletePermanently,
  restoreFromTrash,
  emptyTrash,
  sendEmail,
  saveDraft,
  createReplyEmail,
  createForwardEmail,
} from './emailUtils'
import './email-client.css'

export default function EmailClient() {
  const [emails, setEmails] = useState(() => loadEmails())
  const [activeFolder, setActiveFolder] = useState(FOLDERS.INBOX)
  const [selectedEmailId, setSelectedEmailId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showCompose, setShowCompose] = useState(false)
  const [composeInitial, setComposeInitial] = useState(null)
  const [composeKey, setComposeKey] = useState(0)
  const [toast, setToast] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: '确认',
  })

  useEffect(() => {
    saveEmails(emails)
  }, [emails])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || null

  const handleEmailClick = useCallback((emailId) => {
    setSelectedEmailId(emailId)
    setEmails((prev) => markEmailRead(prev, emailId))
  }, [])

  const handleToggleStar = useCallback((emailId) => {
    setEmails((prev) => toggleEmailStarred(prev, emailId))
  }, [])

  const handleToggleSelect = useCallback((emailId, checked) => {
    setSelectedIds((prev) => {
      if (checked) {
        return [...prev, emailId]
      }
      return prev.filter((id) => id !== emailId)
    })
  }, [])

  const handleToggleSelectAll = useCallback((pageEmailIds, checked) => {
    setSelectedIds((prev) => {
      if (checked) {
        const newSet = new Set([...prev, ...pageEmailIds])
        return Array.from(newSet)
      }
      return prev.filter((id) => !pageEmailIds.includes(id))
    })
  }, [])

  const handleBatchMarkRead = useCallback(() => {
    setEmails((prev) => {
      let result = prev
      selectedIds.forEach((id) => {
        result = result.map((e) => (e.id === id ? { ...e, isRead: true } : e))
      })
      return result
    })
    setSelectedIds([])
    showToast('已标记为已读')
  }, [selectedIds, showToast])

  const handleBatchMarkUnread = useCallback(() => {
    setEmails((prev) => {
      let result = prev
      selectedIds.forEach((id) => {
        result = result.map((e) => (e.id === id ? { ...e, isRead: false } : e))
      })
      return result
    })
    setSelectedIds([])
    showToast('已标记为未读')
  }, [selectedIds, showToast])

  const handleMarkAsSpam = useCallback((emailId) => {
    setEmails((prev) => markAsSpam(prev, [emailId]))
    if (selectedEmailId === emailId) {
      setSelectedEmailId(null)
    }
    showToast('已标记为垃圾邮件')
  }, [selectedEmailId, showToast])

  const handleBatchMarkAsSpam = useCallback(() => {
    if (selectedIds.length === 0) return
    setEmails((prev) => markAsSpam(prev, selectedIds))
    setSelectedIds([])
    if (selectedIds.includes(selectedEmailId)) {
      setSelectedEmailId(null)
    }
    showToast('已标记为垃圾邮件')
  }, [selectedIds, selectedEmailId, showToast])

  const handleBatchDelete = useCallback(() => {
    if (selectedIds.length === 0) return

    if (activeFolder === FOLDERS.TRASH) {
      setConfirmDialog({
        visible: true,
        title: '确认彻底删除',
        message: `确定要彻底删除选中的 ${selectedIds.length} 封邮件吗？此操作不可撤销。`,
        confirmText: '彻底删除',
        onConfirm: () => {
          setEmails((prev) => deletePermanently(prev, selectedIds))
          setSelectedIds([])
          if (selectedIds.includes(selectedEmailId)) {
            setSelectedEmailId(null)
          }
          showToast('已彻底删除')
          setConfirmDialog((prev) => ({ ...prev, visible: false }))
        },
      })
    } else {
      setConfirmDialog({
        visible: true,
        title: '确认删除',
        message: `确定要将选中的 ${selectedIds.length} 封邮件移入垃圾箱吗？`,
        confirmText: '删除',
        onConfirm: () => {
          setEmails((prev) => moveToTrash(prev, selectedIds))
          setSelectedIds([])
          if (selectedIds.includes(selectedEmailId)) {
            setSelectedEmailId(null)
          }
          showToast('已移入垃圾箱')
          setConfirmDialog((prev) => ({ ...prev, visible: false }))
        },
      })
    }
  }, [selectedIds, activeFolder, selectedEmailId, showToast])

  const handleBatchRestore = useCallback(() => {
    if (selectedIds.length === 0) return
    setEmails((prev) => restoreFromTrash(prev, selectedIds))
    setSelectedIds([])
    if (selectedIds.includes(selectedEmailId)) {
      setSelectedEmailId(null)
    }
    showToast('已恢复到收件箱')
  }, [selectedIds, selectedEmailId, showToast])

  const handleEmptyTrash = useCallback(() => {
    setConfirmDialog({
      visible: true,
      title: '清空垃圾箱',
      message: '确定要清空垃圾箱吗？所有邮件将被彻底删除，此操作不可撤销。',
      confirmText: '清空',
      onConfirm: () => {
        setEmails((prev) => emptyTrash(prev))
        setSelectedEmailId(null)
        showToast('垃圾箱已清空')
        setConfirmDialog((prev) => ({ ...prev, visible: false }))
      },
    })
  }, [showToast])

  const handleSend = useCallback((data) => {
    setEmails((prev) => sendEmail(prev, data))
    setShowCompose(false)
    setComposeInitial(null)
    showToast('发送成功')
  }, [showToast])

  const handleSaveDraft = useCallback((data) => {
    setEmails((prev) => saveDraft(prev, data))
    setShowCompose(false)
    setComposeInitial(null)
    showToast('草稿已保存')
  }, [showToast])

  const handleReply = useCallback(() => {
    if (!selectedEmail) return
    setComposeInitial(createReplyEmail(selectedEmail))
    setComposeKey((prev) => prev + 1)
    setShowCompose(true)
  }, [selectedEmail])

  const handleForward = useCallback(() => {
    if (!selectedEmail) return
    setComposeInitial(createForwardEmail(selectedEmail))
    setComposeKey((prev) => prev + 1)
    setShowCompose(true)
  }, [selectedEmail])

  const handleOpenCompose = useCallback(() => {
    setComposeInitial(null)
    setComposeKey((prev) => prev + 1)
    setShowCompose(true)
  }, [])

  const handleFolderChange = useCallback((folder) => {
    setActiveFolder(folder)
    setSelectedEmailId(null)
    setCurrentPage(1)
    setSelectedIds([])
  }, [])

  return (
    <div className="ec-page">
      <header className="ec-header">
        <button type="button" className="ec-back-btn" onClick={() => window.history.back()} aria-label="返回首页">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>返回</span>
        </button>
        <h1 className="ec-title">邮件客户端</h1>
        <button type="button" className="ec-compose-btn" onClick={handleOpenCompose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          写邮件
        </button>
      </header>

      <div className="ec-body">
        <FolderNav
          activeFolder={activeFolder}
          emails={emails}
          onFolderChange={handleFolderChange}
        />
        <EmailList
          emails={emails}
          folder={activeFolder}
          selectedEmailId={selectedEmailId}
          selectedIds={selectedIds}
          currentPage={currentPage}
          onEmailClick={handleEmailClick}
          onToggleStar={handleToggleStar}
          onMarkAsSpam={handleMarkAsSpam}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onBatchMarkRead={handleBatchMarkRead}
          onBatchMarkUnread={handleBatchMarkUnread}
          onBatchMarkAsSpam={handleBatchMarkAsSpam}
          onBatchDelete={handleBatchDelete}
          onBatchRestore={handleBatchRestore}
          onEmptyTrash={handleEmptyTrash}
          onPageChange={setCurrentPage}
        />
        <EmailDetail
          email={selectedEmail}
          onReply={handleReply}
          onForward={handleForward}
          onMarkAsSpam={handleMarkAsSpam}
        />
      </div>

      <ComposeModal
        key={composeKey}
        visible={showCompose}
        initialData={composeInitial}
        onClose={() => {
          setShowCompose(false)
          setComposeInitial(null)
        }}
        onSend={handleSend}
        onSaveDraft={handleSaveDraft}
      />

      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, visible: false }))}
        onConfirm={confirmDialog.onConfirm}
      />

      {toast && (
        <div className={`ec-toast ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  )
}
