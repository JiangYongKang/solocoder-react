import { useState, useMemo } from 'react'
import {
  paginateOperations,
  formatDateTime,
  formatRelativeTime,
} from './securityCenterCore.js'
import {
  OPERATION_RESULT_LABEL,
  OPERATION_RESULT_COLOR,
  PAGE_SIZE,
  OPERATION_RESULTS,
} from './constants.js'

export default function OperationLogs({ operations }) {
  const [showAll, setShowAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const displayOperations = useMemo(() => {
    if (showAll) {
      return operations
    }
    return operations.slice(0, 10)
  }, [operations, showAll])

  const pagination = useMemo(() => {
    if (!showAll) return null
    return paginateOperations(operations, currentPage, PAGE_SIZE)
  }, [operations, showAll, currentPage])

  const visibleItems = showAll ? (pagination?.items || []) : displayOperations

  const getResultClass = (result) => {
    if (result === OPERATION_RESULTS.SUCCESS) return 'success'
    if (result === OPERATION_RESULTS.FAILURE) return 'fail'
    return ''
  }

  const getDotClass = (op) => {
    if (op.isAnomaly) return 'anomaly'
    if (op.result === OPERATION_RESULTS.SUCCESS) return 'success'
    return ''
  }

  function renderPagination() {
    if (!showAll || !pagination) return null
    const { total, totalPage, currentPage: cp } = pagination
    const pages = []
    const start = Math.max(1, cp - 2)
    const end = Math.min(totalPage, start + 4)
    for (let i = start; i <= end; i++) pages.push(i)
    return (
      <div className="sc-pagination">
        <span className="sc-pagination-info">共 {total} 条记录</span>
        <button
          className="sc-btn sc-btn-sm"
          disabled={cp === 1}
          onClick={() => setCurrentPage(cp - 1)}
        >
          上一页
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`sc-btn sc-btn-sm ${p === cp ? 'sc-btn-primary' : ''}`}
            onClick={() => setCurrentPage(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="sc-btn sc-btn-sm"
          disabled={cp === totalPage}
          onClick={() => setCurrentPage(cp + 1)}
        >
          下一页
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="sc-section-header">
        <h2 className="sc-section-title">最近操作记录</h2>
        <span className="sc-tfa-badge sc-tfa-badge-on">{operations.length} 条</span>
      </div>

      <div className="sc-section-body">
        <div className="sc-timeline">
          {visibleItems.map((op) => (
            <div key={op.id} className="sc-timeline-item">
              <div className={`sc-timeline-dot ${getDotClass(op)}`} />
              <div
                className={`sc-timeline-card ${op.isAnomaly ? 'anomaly' : ''}`}
              >
                <div className="sc-timeline-header">
                  <span className="sc-timeline-type">{op.type}</span>
                  <span
                    className={`sc-timeline-result ${getResultClass(op.result)}`}
                    style={{
                      color: OPERATION_RESULT_COLOR[op.result],
                      background: (OPERATION_RESULT_COLOR[op.result] || '#888') + '22',
                    }}
                  >
                    {OPERATION_RESULT_LABEL[op.result] || op.result}
                  </span>
                </div>
                <div className="sc-timeline-detail">{op.detail}</div>
                <div className="sc-timeline-meta">
                  <span>
                    {formatDateTime(op.timestamp)} · {formatRelativeTime(op.timestamp)}
                  </span>
                  <span>IP：{op.ip}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!showAll && operations.length > 10 && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              className="sc-btn sc-btn-sm"
              onClick={() => {
                setShowAll(true)
                setCurrentPage(1)
              }}
            >
              查看全部 →
            </button>
          </div>
        )}

        {showAll && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              className="sc-btn sc-btn-sm"
              onClick={() => {
                setShowAll(false)
                setCurrentPage(1)
              }}
            >
              ← 收起
            </button>
          </div>
        )}

        {renderPagination()}
      </div>
    </div>
  )
}
