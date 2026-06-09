import { useMemo } from 'react'
import {
  getReviewedList,
  formatDate,
  getRejectReasonDisplay,
} from './utils'
import {
  REVIEW_RESULT_OPTIONS,
  REVIEW_RESULT_LABEL,
  COMMENT_STATUS_LABEL,
  REJECT_REASONS,
  COMMENT_STATUS,
  PAGE_SIZE,
} from './constants'

export default function ReviewedList({
  comments,
  page,
  onPageChange,
  filterResult,
  onFilterResultChange,
  filterRejectReason,
  onFilterRejectReasonChange,
  filterStartDate,
  onFilterStartDateChange,
  filterEndDate,
  onFilterEndDateChange,
}) {
  const pagination = useMemo(
    () =>
      getReviewedList(comments, {
        result: filterResult,
        rejectReason: filterRejectReason,
        startDate: filterStartDate,
        endDate: filterEndDate,
        page,
        pageSize: PAGE_SIZE,
      }),
    [
      comments,
      filterResult,
      filterRejectReason,
      filterStartDate,
      filterEndDate,
      page,
    ]
  )

  const showRejectReasonFilter =
    filterResult === COMMENT_STATUS.REJECTED ||
    filterResult === REVIEW_RESULT_OPTIONS.ALL

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
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="filter-row">
            <span className="filter-label">审核结果：</span>
            <select
              className="inline-select"
              value={filterResult}
              onChange={(e) => onFilterResultChange(e.target.value)}
            >
              {Object.entries(REVIEW_RESULT_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {showRejectReasonFilter && (
            <div className="filter-row">
              <span className="filter-label">驳回原因：</span>
              <select
                className="inline-select"
                value={filterRejectReason}
                onChange={(e) => onFilterRejectReasonChange(e.target.value)}
              >
                <option value="">全部原因</option>
                {REJECT_REASONS.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="filter-row">
            <span className="filter-label">审核时间：</span>
            <input
              type="date"
              className="form-input filter-date"
              value={filterStartDate}
              onChange={(e) => onFilterStartDateChange(e.target.value)}
            />
            <span className="filter-separator">至</span>
            <input
              type="date"
              className="form-input filter-date"
              value={filterEndDate}
              onChange={(e) => onFilterEndDateChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="cr-table">
          <thead>
            <tr>
              <th className="col-content">评论内容</th>
              <th className="col-user">评论人</th>
              <th className="col-article">所属文章</th>
              <th className="col-status">审核结果</th>
              <th className="col-reason">驳回原因</th>
              <th className="col-review-time">审核时间</th>
            </tr>
          </thead>
          <tbody>
            {pagination.items.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">暂无审核记录</div>
                </td>
              </tr>
            ) : (
              pagination.items.map((comment) => (
                <tr key={comment.id}>
                  <td className="col-content">
                    <span className="comment-content">{comment.content}</span>
                  </td>
                  <td className="col-user">
                    <span className="comment-username">{comment.username}</span>
                  </td>
                  <td className="col-article">
                    <span className="comment-article">{comment.articleTitle}</span>
                  </td>
                  <td className="col-status">
                    <span className={`status-tag ${comment.status}`}>
                      {COMMENT_STATUS_LABEL[comment.status]}
                    </span>
                  </td>
                  <td className="col-reason">
                    {comment.status === COMMENT_STATUS.REJECTED ? (
                      <span className="reject-reason">
                        {getRejectReasonDisplay(
                          comment.rejectReason,
                          comment.rejectReasonDetail
                        )}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text)', fontSize: 13 }}>-</span>
                    )}
                  </td>
                  <td className="col-review-time">
                    <span className="comment-time">
                      {comment.reviewedAt ? formatDate(comment.reviewedAt) : '-'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPage > 1 && renderPagination()}
    </div>
  )
}
