import {
  TICKET_STATUSES,
  CATEGORIES,
  PRIORITIES,
  PRIORITY_ORDER,
  SLA_HOURS,
  STORAGE_KEY,
  PAGE_SIZE,
  TIMELINE_TYPES,
  STATUS_LABELS,
} from './constants'

export function generateTicketNumber(existingTickets) {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const dateStr = `${y}${m}${d}`
  const prefix = `TK-${dateStr}-`
  const todayTickets = (existingTickets || []).filter((t) =>
    t.ticketNumber && t.ticketNumber.startsWith(prefix)
  )
  const maxSeq = todayTickets.reduce((max, t) => {
    const seqStr = t.ticketNumber.slice(prefix.length)
    const seq = parseInt(seqStr, 10)
    return isNaN(seq) ? max : Math.max(max, seq)
  }, 0)
  const nextSeq = maxSeq + 1
  return `${prefix}${String(nextSeq).padStart(3, '0')}`
}

export function createTicket(ticketData, existingTickets) {
  const now = Date.now()
  const ticketNumber = generateTicketNumber(existingTickets)
  return {
    id: 'tk_' + now.toString(36) + Math.random().toString(36).slice(2, 8),
    ticketNumber,
    title: (ticketData.title || '').trim(),
    category: ticketData.category || CATEGORIES.OTHER,
    priority: ticketData.priority || PRIORITIES.MEDIUM,
    description: (ticketData.description || '').trim(),
    attachments: Array.isArray(ticketData.attachments) ? ticketData.attachments : [],
    status: TICKET_STATUSES.PENDING,
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        id: 'tl_' + now.toString(36) + Math.random().toString(36).slice(2, 8),
        type: TIMELINE_TYPES.CREATED,
        timestamp: now,
        description: '创建工单',
      },
    ],
  }
}

export function loadTickets(storage) {
  const s = typeof window !== 'undefined' && !storage ? window.localStorage : storage
  if (!s) return []
  try {
    const raw = s.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t) =>
        t &&
        typeof t === 'object' &&
        typeof t.id === 'string' &&
        typeof t.ticketNumber === 'string' &&
        typeof t.status === 'string'
    )
  } catch {
    return []
  }
}

export function saveTickets(tickets, storage) {
  const s = typeof window !== 'undefined' && !storage ? window.localStorage : storage
  if (!s) return
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(tickets))
  } catch {
    // ignore
  }
}

export function addTicket(tickets, ticketData) {
  const newTicket = createTicket(ticketData, tickets)
  return [newTicket, ...tickets]
}

export function updateTicketInList(tickets, ticketId, updates) {
  return tickets.map((t) => {
    if (t.id !== ticketId) return t
    return { ...t, ...updates, updatedAt: Date.now() }
  })
}

export function transitionStatus(tickets, ticketId, newStatus) {
  return tickets.map((t) => {
    if (t.id !== ticketId) return t
    const now = Date.now()
    const timelineEntry = {
      id: 'tl_' + now.toString(36) + Math.random().toString(36).slice(2, 8),
      type: TIMELINE_TYPES.STATUS_CHANGE,
      timestamp: now,
      description: `状态从「${STATUS_LABELS[t.status]}」变更为「${STATUS_LABELS[newStatus]}」`,
      fromStatus: t.status,
      toStatus: newStatus,
    }
    return {
      ...t,
      status: newStatus,
      updatedAt: now,
      timeline: [timelineEntry, ...t.timeline],
    }
  })
}

export function addComment(tickets, ticketId, comment) {
  return tickets.map((t) => {
    if (t.id !== ticketId) return t
    const now = Date.now()
    const timelineEntry = {
      id: 'tl_' + now.toString(36) + Math.random().toString(36).slice(2, 8),
      type: TIMELINE_TYPES.COMMENT,
      timestamp: now,
      description: comment.trim(),
    }
    return {
      ...t,
      updatedAt: now,
      timeline: [timelineEntry, ...t.timeline],
    }
  })
}

export function getAvailableTransitions(currentStatus) {
  switch (currentStatus) {
    case TICKET_STATUSES.PENDING:
      return [{ label: '开始处理', target: TICKET_STATUSES.IN_PROGRESS }]
    case TICKET_STATUSES.IN_PROGRESS:
      return [
        { label: '标记已解决', target: TICKET_STATUSES.RESOLVED },
        { label: '退回待处理', target: TICKET_STATUSES.PENDING },
      ]
    case TICKET_STATUSES.RESOLVED:
      return [
        { label: '关闭工单', target: TICKET_STATUSES.CLOSED },
        { label: '重开工单', target: TICKET_STATUSES.IN_PROGRESS },
      ]
    case TICKET_STATUSES.CLOSED:
      return [{ label: '重开工单', target: TICKET_STATUSES.IN_PROGRESS }]
    default:
      return []
  }
}

export function isSLAExceeded(ticket, now) {
  if (
    ticket.status === TICKET_STATUSES.RESOLVED ||
    ticket.status === TICKET_STATUSES.CLOSED
  ) {
    return false
  }
  const slaHours = SLA_HOURS[ticket.priority]
  if (!slaHours) return false
  const slaMs = slaHours * 60 * 60 * 1000
  const currentTime = now || Date.now()
  return currentTime - ticket.createdAt > slaMs
}

export function getSLAExceededHours(ticket, now) {
  const slaHours = SLA_HOURS[ticket.priority]
  if (!slaHours) return 0
  const slaMs = slaHours * 60 * 60 * 1000
  const currentTime = now || Date.now()
  const exceededMs = currentTime - ticket.createdAt - slaMs
  return exceededMs > 0 ? exceededMs / (60 * 60 * 1000) : 0
}

export function filterTickets(tickets, filters) {
  let result = tickets
  if (filters.statuses && filters.statuses.length > 0) {
    result = result.filter((t) => filters.statuses.includes(t.status))
  }
  if (filters.categories && filters.categories.length > 0) {
    result = result.filter((t) => filters.categories.includes(t.category))
  }
  if (filters.priorities && filters.priorities.length > 0) {
    result = result.filter((t) => filters.priorities.includes(t.priority))
  }
  if (filters.dateFrom) {
    const fromMs = new Date(filters.dateFrom).getTime()
    if (!isNaN(fromMs)) {
      result = result.filter((t) => t.createdAt >= fromMs)
    }
  }
  if (filters.dateTo) {
    const toMs = new Date(filters.dateTo).getTime() + 24 * 60 * 60 * 1000 - 1
    if (!isNaN(toMs)) {
      result = result.filter((t) => t.createdAt <= toMs)
    }
  }
  if (filters.keyword) {
    const kw = filters.keyword.trim().toLowerCase()
    if (kw) {
      result = result.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(kw)) ||
          (t.description && t.description.toLowerCase().includes(kw))
      )
    }
  }
  return result
}

export function sortTickets(tickets, sortBy, sortOrder) {
  const sorted = [...tickets]
  const order = sortOrder === 'asc' ? 1 : -1
  switch (sortBy) {
    case 'createdAt':
      sorted.sort((a, b) => (a.createdAt - b.createdAt) * order)
      break
    case 'priority':
      sorted.sort((a, b) => {
        const ai = PRIORITY_ORDER.indexOf(a.priority)
        const bi = PRIORITY_ORDER.indexOf(b.priority)
        return (ai - bi) * order
      })
      break
    case 'updatedAt':
      sorted.sort((a, b) => (a.updatedAt - b.updatedAt) * order)
      break
    case 'status':
      sorted.sort((a, b) => {
        const orderList = [TICKET_STATUSES.PENDING, TICKET_STATUSES.IN_PROGRESS, TICKET_STATUSES.RESOLVED, TICKET_STATUSES.CLOSED]
        const ai = orderList.indexOf(a.status)
        const bi = orderList.indexOf(b.status)
        return (ai - bi) * order
      })
      break
    default:
      sorted.sort((a, b) => (b.createdAt - a.createdAt))
  }
  return sorted
}

export function paginateTickets(tickets, page) {
  const totalPages = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE))
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const start = (currentPage - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return {
    items: tickets.slice(start, end),
    currentPage,
    totalPages,
    totalItems: tickets.length,
  }
}

export function calculateStatusCounts(tickets) {
  const counts = {}
  Object.values(TICKET_STATUSES).forEach((s) => {
    counts[s] = 0
  })
  tickets.forEach((t) => {
    if (counts[t.status] !== undefined) {
      counts[t.status]++
    }
  })
  return counts
}

export function calculateCategoryCounts(tickets) {
  const counts = {}
  Object.values(CATEGORIES).forEach((c) => {
    counts[c] = 0
  })
  tickets.forEach((t) => {
    if (counts[t.category] !== undefined) {
      counts[t.category]++
    }
  })
  return counts
}

export function getLast7Days() {
  const days = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    days.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      timestamp: d.getTime(),
    })
  }
  return days
}

export function buildTrendData(tickets, days) {
  const dayMap = {}
  days.forEach((d) => {
    dayMap[d.key] = { date: d.key, label: d.label, count: 0 }
  })
  tickets.forEach((t) => {
    const d = new Date(t.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (dayMap[key]) {
      dayMap[key].count++
    }
  })
  return days.map((d) => dayMap[d.key])
}

export function calculateAvgResolutionTime(tickets) {
  const closed = tickets.filter(
    (t) => t.status === TICKET_STATUSES.CLOSED
  )
  if (closed.length === 0) return 0
  const totalTime = closed.reduce((sum, t) => {
    const createdEvent = [...t.timeline].reverse().find(
      (e) => e.type === TIMELINE_TYPES.CREATED
    )
    const closeEvent = t.timeline.find(
      (e) =>
        e.type === TIMELINE_TYPES.STATUS_CHANGE &&
        e.toStatus === TICKET_STATUSES.CLOSED
    )
    if (createdEvent && closeEvent) {
      return sum + (closeEvent.timestamp - createdEvent.timestamp)
    }
    return sum + (t.updatedAt - t.createdAt)
  }, 0)
  return totalTime / closed.length
}

export function calculateSLAComplianceRate(tickets, now) {
  if (tickets.length === 0) return 100
  const exceeded = tickets.filter((t) => isSLAExceeded(t, now)).length
  return ((tickets.length - exceeded) / tickets.length) * 100
}

export function countSLAExceeded(tickets, now) {
  return tickets.filter((t) => isSLAExceeded(t, now)).length
}

export function formatDuration(ms) {
  if (!ms || ms <= 0) return '0小时'
  const hours = Math.floor(ms / (60 * 60 * 1000))
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  if (hours === 0) return `${minutes}分钟`
  if (minutes === 0) return `${hours}小时`
  return `${hours}小时${minutes}分钟`
}

export function formatDateTime(timestamp) {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}
