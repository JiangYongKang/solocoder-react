import { useState, useMemo } from 'react'
import {
  PAGE_SIZE,
} from './constants.js'
import {
  paginateResponses,
  sortResponses,
  formatAnswerForDisplay,
  formatDate,
  formatDuration,
  responsesToCSV,
  downloadCSV,
} from './surveyAnalysisCore.js'

function RawDataTable({ questions, responses, filteredResponses }) {
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState('submittedAt')
  const [sortOrder, setSortOrder] = useState('desc')

  const sortedResponses = useMemo(() => {
    return sortResponses(filteredResponses, sortField, sortOrder)
  }, [filteredResponses, sortField, sortOrder])

  const pageData = useMemo(() => {
    return paginateResponses(sortedResponses, page, PAGE_SIZE)
  }, [sortedResponses, page])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const renderPageNumbers = () => {
    const { totalPage, currentPage } = pageData
    const pages = []
    const maxVisible = 7
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPage, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    if (start > 1) {
      pages.push(
        <button
          key="first"
          className="sa-page-btn"
          onClick={() => setPage(1)}
        >
          1
        </button>
      )
      if (start > 2) {
        pages.push(<span key="ellipsis1" className="sa-page-ellipsis">...</span>)
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          className={`sa-page-btn ${i === currentPage ? 'sa-page-btn-active' : ''}`}
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      )
    }

    if (end < totalPage) {
      if (end < totalPage - 1) {
        pages.push(<span key="ellipsis2" className="sa-page-ellipsis">...</span>)
      }
      pages.push(
        <button
          key="last"
          className="sa-page-btn"
          onClick={() => setPage(totalPage)}
        >
          {totalPage}
        </button>
      )
    }

    return pages
  }

  const handleExportCSV = () => {
    const csv = responsesToCSV(questions, sortedResponses)
    downloadCSV(csv, '原始答卷数据.csv')
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <span className="sa-sort-icon">↕</span>
    }
    return (
      <span className={`sa-sort-icon sa-sort-icon-active`}>
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="sa-btn sa-btn-secondary" onClick={handleExportCSV}>
          📄 导出全部 CSV
        </button>
      </div>

      <div className="sa-raw-table-wrap">
        <table className="sa-raw-table">
          <thead>
            <tr>
              <th>答卷编号</th>
              <th>
                <span className="sa-sortable" onClick={() => handleSort('submittedAt')}>
                  提交时间
                  <SortIcon field="submittedAt" />
                </span>
              </th>
              <th>
                <span className="sa-sortable" onClick={() => handleSort('duration')}>
                  填写时长
                  <SortIcon field="duration" />
                </span>
              </th>
              {questions.map((q) => (
                <th key={q.id} title={q.title}>
                  {q.title.length > 10 ? q.title.slice(0, 10) + '...' : q.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.items.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{formatDate(r.submittedAt)}</td>
                <td>{formatDuration(r.duration)}</td>
                {questions.map((q) => (
                  <td key={q.id}>
                    {formatAnswerForDisplay(q, r.answers?.[q.id])}
                  </td>
                ))}
              </tr>
            ))}
            {pageData.items.length === 0 && (
              <tr>
                <td
                  colSpan={questions.length + 3}
                  style={{ textAlign: 'center', padding: 40, color: 'var(--text)' }}
                >
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sa-pagination">
        <div className="sa-page-info">
          共 <strong>{pageData.total}</strong> 条记录，当前第{' '}
          <strong>{pageData.currentPage}</strong> / {pageData.totalPage} 页
        </div>
        <div className="sa-page-buttons">
          <button
            className="sa-page-btn"
            onClick={() => setPage(1)}
            disabled={pageData.currentPage <= 1}
          >
            首页
          </button>
          <button
            className="sa-page-btn"
            onClick={() => setPage(Math.max(1, pageData.currentPage - 1))}
            disabled={pageData.currentPage <= 1}
          >
            上一页
          </button>
          {renderPageNumbers()}
          <button
            className="sa-page-btn"
            onClick={() => setPage(Math.min(pageData.totalPage, pageData.currentPage + 1))}
            disabled={pageData.currentPage >= pageData.totalPage}
          >
            下一页
          </button>
          <button
            className="sa-page-btn"
            onClick={() => setPage(pageData.totalPage)}
            disabled={pageData.currentPage >= pageData.totalPage}
          >
            末页
          </button>
        </div>
      </div>
    </div>
  )
}

export default RawDataTable
