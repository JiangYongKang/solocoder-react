import { FOLDERS, PAGE_SIZE } from './constants'
import { filterEmailsByFolder, sortEmails, paginateEmails, getTotalPages, formatDateTime, getPreview } from './emailUtils'

export default function EmailList({
  emails,
  folder,
  selectedEmailId,
  selectedIds,
  currentPage,
  onEmailClick,
  onToggleStar,
  onMarkAsSpam,
  onToggleSelect,
  onToggleSelectAll,
  onBatchMarkRead,
  onBatchMarkUnread,
  onBatchMarkAsSpam,
  onBatchDelete,
  onBatchRestore,
  onEmptyTrash,
  onPageChange,
}) {
  const folderEmails = filterEmailsByFolder(emails, folder)
  const sortedEmails = sortEmails(folderEmails)
  const totalPages = getTotalPages(sortedEmails.length, PAGE_SIZE)
  const pageEmails = paginateEmails(sortedEmails, currentPage, PAGE_SIZE)

  const pageEmailIds = pageEmails.map((e) => e.id)
  const allSelected = pageEmailIds.length > 0 && pageEmailIds.every((id) => selectedIds.includes(id))
  const hasSelected = selectedIds.length > 0

  return (
    <div className="ec-list-panel">
      <div className="ec-list-toolbar">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) => onToggleSelectAll(pageEmailIds, e.target.checked)}
        />
        {hasSelected && (
          <>
            <button type="button" className="ec-toolbar-btn" onClick={onBatchMarkRead}>
              已读
            </button>
            <button type="button" className="ec-toolbar-btn" onClick={onBatchMarkUnread}>
              未读
            </button>
            {folder !== FOLDERS.TRASH && (
              <button type="button" className="ec-toolbar-btn" onClick={onBatchMarkAsSpam}>
                垃圾
              </button>
            )}
            <button type="button" className="ec-toolbar-btn" onClick={onBatchDelete}>
              {folder === FOLDERS.TRASH ? '彻底删除' : '删除'}
            </button>
            {folder === FOLDERS.TRASH && (
              <button type="button" className="ec-toolbar-btn" onClick={onBatchRestore}>
                恢复
              </button>
            )}
          </>
        )}
        {folder === FOLDERS.TRASH && (
          <button
            type="button"
            className="ec-toolbar-btn"
            onClick={onEmptyTrash}
            style={{ marginLeft: 'auto' }}
          >
            清空垃圾箱
          </button>
        )}
      </div>

      <div className="ec-list-body">
        {pageEmails.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text)', fontSize: '14px' }}>
            暂无邮件
          </div>
        )}
        {pageEmails.map((email) => (
          <div
            key={email.id}
            className={`ec-email-item ${email.id === selectedEmailId ? 'selected' : ''} ${!email.isRead ? 'unread' : ''}`}
            onClick={() => onEmailClick(email.id)}
          >
            <input
              type="checkbox"
              className="ec-email-checkbox"
              checked={selectedIds.includes(email.id)}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onToggleSelect(email.id, e.target.checked)}
            />
            <span className={`ec-unread-dot ${email.isRead ? 'hidden' : ''}`} />
            <button
              type="button"
              className={`ec-email-star ${email.isStarred ? 'starred' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onToggleStar(email.id)
              }}
              aria-label={email.isStarred ? '取消星标' : '添加星标'}
            >
              {email.isStarred ? '★' : '☆'}
            </button>
            {folder !== FOLDERS.TRASH && (
              <button
                type="button"
                className="ec-email-star"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsSpam(email.id)
                }}
                aria-label="标记为垃圾邮件"
                title="标记为垃圾邮件"
              >
                🚫
              </button>
            )}
            <div className="ec-email-content">
              <div className="ec-email-header">
                <span className="ec-email-sender">{email.from}</span>
                <span className="ec-email-time">{formatDateTime(email.sentAt)}</span>
              </div>
              <div className="ec-email-subject">{email.subject}</div>
              <div className="ec-email-preview">{getPreview(email.body, 80)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="ec-pagination">
        <button
          type="button"
          className="ec-page-btn"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
        >
          «
        </button>
        <button
          type="button"
          className="ec-page-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          ‹
        </button>
        <span className="ec-page-info">
          {currentPage} / {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="ec-page-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          ›
        </button>
        <button
          type="button"
          className="ec-page-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
        >
          »
        </button>
      </div>
    </div>
  )
}
