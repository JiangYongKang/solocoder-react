import { useMemo } from 'react'
import {
  matchSensitiveWords,
  highlightSensitiveWords,
  getPendingList,
  formatDate,
  getPendingComments,
} from './utils'
import { PAGE_SIZE } from './constants'

function renderHighlightedContent(content, sensitiveWords) {
  if (!content) return null
  const highlighted = highlightSensitiveWords(content, sensitiveWords)
  if (highlighted === content) return <span className="comment-content">{content}</span>
  const parts = highlighted.split(/\|\|\|HIGHLIGHT\|\|\|(.+?)\|\|\|\/HIGHLIGHT\|\|\|/)
  return (
    <span className="comment-content">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="sensitive-highlight">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

export default function PendingQueue({
  comments,
  sensitiveWords,
  page,
  onPageChange,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onApprove,
  onReject,
  onDelete,
  onBatchApprove,
  onBatchReject,
  onBatchDelete,
}) {
  const pagination = useMemo(
    () => getPendingList(comments, { page, pageSize: PAGE_SIZE }),
    [comments, page]
  )

  const visibleIds = useMemo(() => pagination.items.map((c) => c.id), [pagination])
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))
  const someSelected = visibleIds.some((id) => selectedIds.includes(id))

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
          共 {total} 条，每页 {pageSize} 条，共 {totalPage} 页
        </div>
        <div className="pagination-controls">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            上一页
          </button>
          {pages.map((p) => (
            <button
              key={p}
              className={`page-btn ${p === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            disabled={currentPage === totalPage}
            onClick={() => onPageChange(currentPage + 1)}
          >
            下一页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {selectedIds.length > 0 && (
        <div className="batch-bar">
          <span>已选择 {selectedIds.length} 项</span>
          <button className="btn btn-sm btn-success" onClick={onBatchApprove}>
            批量通过
          </button>
          <button className="btn btn-sm btn-warning" onClick={onBatchReject}>
            批量驳回
          </button>
          <button className="btn btn-sm btn-danger" onClick={onBatchDelete}>
            批量删除
          </button>
          <button
            className="btn-link"
            onClick={() => {
              for (const id of visibleIds) {
                onSelectOne(id, false)
              }
            }}
          >
              取消选择
            </button>
          </div>
      </div>

      <div className="table-wrap">
        <table className="cr-table">
          <thead>
            <tr>
              <th className="col-checkbox">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                    el.indeterminate = !allSelected && someSelected
                  }
                }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
              <th className="col-content">评论内容</th>
              <th className="col-user">评论人</th>
              <th className="col-article">所属文章</th>
              <th className="col-time">评论时间</th>
              <th className="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {pagination.items.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">暂无待审核评论</div>
                </td>
              </tr>
            ) : (
              pagination.items.map((comment) => {
                const matchInfo = matchSensitiveWords(comment.content, sensitiveWords)
                const isSensitive = matchInfo.matched
                return (
                  <tr
                    key={comment.id}
                    className={isSensitive ? 'comment-sensitive' : ''}
                  >
                    <td className="col-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(comment.id)}
                        onChange={(e) => onSelectOne(comment.id, e.target.checked)}
                      />
                    </td>
                    <td className="col-content">
                      <div className="comment-content-cell">
                        {matchInfo.hasHighLevel && (
                          <span className="warning-icon" title="包含重度敏感词">!</span>
                        )}
                        <div>
                          {renderHighlightedContent(comment.content, sensitiveWords)}
                          {isSensitive && (
                            <div className="sensitive-tags">
                              {matchInfo.words.map((w) => (
                                <span
                                  key={w.id}
                                  className={`sensitive-tag ${w.level}`}
                                >
                                  {w.word}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="col-user">
                      <span className="comment-username">{comment.username}</span>
                    </td>
                    <td className="col-article">
                      <span className="comment-article">{comment.articleTitle}</span>
                    </td>
                    <td className="col-time">
                      <span className="comment-time">
                        {formatDate(comment.createdAt)}
                      </span>
                    </td>
                    <td className="col-actions">
                      <div className="row-actions">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => onApprove(comment)}
                        >
                          通过
                        </button>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => onReject(comment)}
                        >
                          驳回
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => onDelete(comment)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPage > 1 && renderPagination()}
    </div>
  )
}
