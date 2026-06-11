import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import TicketForm from './TicketForm.jsx'
import FilterBar from './FilterBar.jsx'
import Dashboard from './Dashboard.jsx'
import {
  TICKET_STATUSES,
  STATUS_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
} from './constants'
import {
  loadTickets,
  saveTickets,
  addTicket,
  transitionStatus,
  addComment,
  filterTickets,
  sortTickets,
  paginateTickets,
  getAvailableTransitions,
  isSLAExceeded,
  getSLAExceededHours,
  countSLAExceeded,
  formatDateTime,
} from './ticketUtils'
import './ticket-system.css'

const DEFAULT_FILTERS = {
  statuses: [],
  categories: [],
  priorities: [],
  dateFrom: '',
  dateTo: '',
  keyword: '',
}

export default function TicketSystemPage() {
  const [tickets, setTickets] = useState(() => loadTickets())
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [currentPage, setCurrentPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [activeTab, setActiveTab] = useState('list')
  const [now, setNow] = useState(0)
  const nowRef = useRef(0)

  useEffect(() => {
    nowRef.current = Date.now()
    setNow(nowRef.current)
    const timer = setInterval(() => {
      nowRef.current = Date.now()
      setNow(nowRef.current)
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    saveTickets(tickets)
  }, [tickets])

  const filteredTickets = filterTickets(tickets, filters)
  const sortedTickets = sortTickets(filteredTickets, 'createdAt', 'desc')
  const { items, currentPage: page, totalPages, totalItems } = paginateTickets(sortedTickets, currentPage)
  const slaExceededCount = countSLAExceeded(tickets, now)

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }, [])

  const handleCreateTicket = useCallback((ticketData) => {
    setTickets((prev) => addTicket(prev, ticketData))
    setShowForm(false)
    setCurrentPage(1)
  }, [])

  const handleStatusTransition = useCallback((ticketId, newStatus) => {
    setTickets((prev) => transitionStatus(prev, ticketId, newStatus))
  }, [])

  const handleAddComment = useCallback((ticketId) => {
    if (!commentText.trim()) return
    setTickets((prev) => addComment(prev, ticketId, commentText))
    setCommentText('')
  }, [commentText])

  const handleRowClick = useCallback((ticket) => {
    const latest = tickets.find((t) => t.id === ticket.id) || ticket
    setSelectedTicket(latest)
  }, [tickets])

  const handleCloseDetail = useCallback(() => {
    setSelectedTicket(null)
    setCommentText('')
  }, [])

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage)
  }, [])

  const detailTicket = selectedTicket
    ? tickets.find((t) => t.id === selectedTicket.id) || selectedTicket
    : null

  return (
    <div className="ts-page">
      <div className="ts-header">
        <div className="ts-header-left">
          <Link to="/" className="ts-back-link">← 返回首页</Link>
          <h1 className="ts-title">客服工单系统</h1>
        </div>
        <div className="ts-header-right">
          <button className="ts-btn ts-btn-primary" onClick={() => setShowForm(true)}>
            + 新建工单
          </button>
        </div>
      </div>

      {slaExceededCount > 0 && (
        <div className="ts-sla-banner">
          <span className="ts-sla-dot" />
          当前有 {slaExceededCount} 个工单超过SLA响应时间
        </div>
      )}

      <div className="ts-main">
        <div className="ts-list-section">
          <div className="ts-tabs">
            <button
              className={`ts-tab ${activeTab === 'list' ? 'ts-tab-active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              工单列表
            </button>
            <button
              className={`ts-tab ${activeTab === 'dashboard' ? 'ts-tab-active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              统计仪表盘
            </button>
          </div>

          {activeTab === 'list' ? (
            <>
              <FilterBar filters={filters} onChange={handleFilterChange} />

              {detailTicket ? (
                <div className="ts-detail-panel">
                  <div className="ts-detail-header">
                    <div className="ts-detail-title-area">
                      <div className="ts-detail-ticket-number">{detailTicket.ticketNumber}</div>
                      <h2 className="ts-detail-title">{detailTicket.title}</h2>
                      <div className="ts-detail-meta">
                        <span className={`ts-status-badge ts-status-${detailTicket.status}`}>
                          {STATUS_LABELS[detailTicket.status]}
                        </span>
                        <span className={`ts-priority-badge ts-priority-${detailTicket.priority}`}>
                          {PRIORITY_LABELS[detailTicket.priority]}
                        </span>
                        <span>{CATEGORY_LABELS[detailTicket.category]}</span>
                        <span>创建于 {formatDateTime(detailTicket.createdAt)}</span>
                      </div>
                    </div>
                    <div className="ts-detail-actions">
                      {getAvailableTransitions(detailTicket.status).map((trans) => (
                        <button
                          key={trans.target}
                          className={`ts-btn ts-btn-sm ${
                            trans.target === TICKET_STATUSES.CLOSED
                              ? 'ts-btn-danger'
                              : trans.target === TICKET_STATUSES.RESOLVED
                                ? 'ts-btn-success'
                                : trans.target === TICKET_STATUSES.PENDING
                                  ? 'ts-btn-warning'
                                  : 'ts-btn-primary'
                          }`}
                          onClick={() => handleStatusTransition(detailTicket.id, trans.target)}
                        >
                          {trans.label}
                        </button>
                      ))}
                      <button className="ts-btn ts-btn-sm" onClick={handleCloseDetail}>
                        关闭
                      </button>
                    </div>
                  </div>

                  <div className="ts-detail-body">
                    <div className="ts-detail-description">{detailTicket.description}</div>

                    {detailTicket.attachments && detailTicket.attachments.length > 0 && (
                      <div className="ts-detail-attachments">
                        <div className="ts-detail-attachments-title">附件</div>
                        <div className="ts-attachment-list">
                          {detailTicket.attachments.map((att, i) => (
                            <div key={i} className="ts-attachment-item">
                              <span className="ts-attachment-icon">📎</span>
                              {att.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="ts-timeline">
                      {detailTicket.timeline.map((entry) => (
                        <div key={entry.id} className="ts-timeline-item">
                          <div className={`ts-timeline-dot ts-timeline-dot-${entry.type}`}>
                            {entry.type === 'created' && '●'}
                            {entry.type === 'status_change' && '→'}
                            {entry.type === 'comment' && '💬'}
                          </div>
                          <div className="ts-timeline-time">{formatDateTime(entry.timestamp)}</div>
                          <div className="ts-timeline-desc">{entry.description}</div>
                        </div>
                      ))}
                    </div>

                    {detailTicket.status !== TICKET_STATUSES.CLOSED && (
                      <div className="ts-comment-form">
                        <input
                          type="text"
                          className="ts-comment-input"
                          placeholder="添加备注..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(detailTicket.id)
                          }}
                        />
                        <button
                          className="ts-btn ts-btn-primary ts-btn-sm"
                          onClick={() => handleAddComment(detailTicket.id)}
                          disabled={!commentText.trim()}
                        >
                          添加
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {totalItems === 0 ? (
                    <div className="ts-empty">暂无工单数据</div>
                  ) : (
                    <table className="ts-table">
                      <thead>
                        <tr>
                          <th>工单编号</th>
                          <th>标题</th>
                          <th>分类</th>
                          <th>优先级</th>
                          <th>状态</th>
                          <th>创建时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((ticket) => {
                          const slaEx = isSLAExceeded(ticket, now)
                          const slaHours = slaEx ? getSLAExceededHours(ticket, now) : 0
                          const isClosed = ticket.status === TICKET_STATUSES.CLOSED
                          const rowClass = [
                            'ts-table-row',
                            isClosed ? 'ts-table-row-closed' : '',
                            slaEx ? 'ts-table-row-sla-exceeded' : '',
                          ].filter(Boolean).join(' ')
                          return (
                            <tr
                              key={ticket.id}
                              className={rowClass}
                              onClick={() => handleRowClick(ticket)}
                            >
                              <td>
                                <span className="ts-ticket-number">{ticket.ticketNumber}</span>
                                {slaEx && (
                                  <span className="ts-sla-tag">
                                    超时 {Math.floor(slaHours)} 小时
                                  </span>
                                )}
                              </td>
                              <td>{ticket.title}</td>
                              <td>{CATEGORY_LABELS[ticket.category]}</td>
                              <td>
                                <span className={`ts-priority-badge ts-priority-${ticket.priority}`}>
                                  {PRIORITY_LABELS[ticket.priority]}
                                </span>
                              </td>
                              <td>
                                <span className={`ts-status-badge ts-status-${ticket.status}`}>
                                  {STATUS_LABELS[ticket.status]}
                                </span>
                              </td>
                              <td>{formatDateTime(ticket.createdAt)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}

                  {totalPages > 1 && (
                    <div className="ts-pagination">
                      <button
                        className="ts-page-btn"
                        disabled={page <= 1}
                        onClick={() => handlePageChange(page - 1)}
                      >
                        上一页
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          className={`ts-page-btn ${p === page ? 'ts-page-btn-active' : ''}`}
                          onClick={() => handlePageChange(p)}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        className="ts-page-btn"
                        disabled={page >= totalPages}
                        onClick={() => handlePageChange(page + 1)}
                      >
                        下一页
                      </button>
                      <span className="ts-page-info">
                        共 {totalItems} 条 / {totalPages} 页
                      </span>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <Dashboard tickets={filteredTickets} now={now} />
          )}
        </div>
      </div>

      <TicketForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleCreateTicket}
      />
    </div>
  )
}
