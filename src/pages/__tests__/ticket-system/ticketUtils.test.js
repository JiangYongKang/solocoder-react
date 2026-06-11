import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  TICKET_STATUSES,
  CATEGORIES,
  PRIORITIES,
  SLA_HOURS,
  STORAGE_KEY,
  TIMELINE_TYPES,
} from '../../ticket-system/constants'
import {
  generateTicketNumber,
  createTicket,
  loadTickets,
  saveTickets,
  addTicket,
  updateTicketInList,
  transitionStatus,
  addComment,
  getAvailableTransitions,
  isSLAExceeded,
  getSLAExceededHours,
  filterTickets,
  sortTickets,
  paginateTickets,
  calculateStatusCounts,
  calculateCategoryCounts,
  getLast7Days,
  buildTrendData,
  calculateAvgResolutionTime,
  calculateSLAComplianceRate,
  countSLAExceeded,
  formatDuration,
  formatDateTime,
} from '../../ticket-system/ticketUtils'

const createMockLocalStorage = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

let originalLocalStorage

beforeAll(() => {
  originalLocalStorage = globalThis.localStorage
})

afterAll(() => {
  globalThis.localStorage = originalLocalStorage
})

function makeTicket(overrides = {}) {
  const now = Date.now()
  return {
    id: 'tk_' + now.toString(36) + Math.random().toString(36).slice(2, 8),
    ticketNumber: 'TK-20240601-001',
    title: '测试工单',
    category: CATEGORIES.TECHNICAL,
    priority: PRIORITIES.MEDIUM,
    description: '测试描述',
    attachments: [],
    status: TICKET_STATUSES.PENDING,
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        id: 'tl_1',
        type: TIMELINE_TYPES.CREATED,
        timestamp: now,
        description: '创建工单',
      },
    ],
    ...overrides,
  }
}

describe('generateTicketNumber', () => {
  it('生成格式为 TK-YYYYMMDD-NNN 的工单编号', () => {
    const num = generateTicketNumber([])
    expect(num).toMatch(/^TK-\d{8}-\d{3}$/)
  })

  it('第一个工单编号序号为 001', () => {
    const num = generateTicketNumber([])
    expect(num).toMatch(/-\d{3}$/)
    const seq = num.split('-').pop()
    expect(seq).toBe('001')
  })

  it('同一天的工单序号递增', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const todayPrefix = `TK-${y}${m}${d}`
    const existing = [makeTicket({ ticketNumber: `${todayPrefix}-001` })]
    const num = generateTicketNumber(existing)
    const seq = num.split('-').pop()
    expect(seq).toBe('002')
  })

  it('不同天的工单序号重新从 001 开始', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const y = yesterday.getFullYear()
    const m = String(yesterday.getMonth() + 1).padStart(2, '0')
    const d = String(yesterday.getDate()).padStart(2, '0')
    const existing = [makeTicket({ ticketNumber: `TK-${y}${m}${d}-005` })]
    const num = generateTicketNumber(existing)
    const seq = num.split('-').pop()
    expect(seq).toBe('001')
  })
})

describe('createTicket', () => {
  it('创建工单包含所有必要字段', () => {
    const ticket = createTicket({
      title: '新工单',
      category: CATEGORIES.ACCOUNT,
      priority: PRIORITIES.HIGH,
      description: '问题描述',
    }, [])
    expect(ticket.id).toBeTruthy()
    expect(ticket.ticketNumber).toBeTruthy()
    expect(ticket.title).toBe('新工单')
    expect(ticket.category).toBe(CATEGORIES.ACCOUNT)
    expect(ticket.priority).toBe(PRIORITIES.HIGH)
    expect(ticket.description).toBe('问题描述')
    expect(ticket.status).toBe(TICKET_STATUSES.PENDING)
    expect(ticket.createdAt).toBeGreaterThan(0)
    expect(ticket.timeline.length).toBe(1)
    expect(ticket.timeline[0].type).toBe(TIMELINE_TYPES.CREATED)
  })

  it('默认分类为 OTHER，优先级为 MEDIUM', () => {
    const ticket = createTicket({ title: 'T', description: 'D' }, [])
    expect(ticket.category).toBe(CATEGORIES.OTHER)
    expect(ticket.priority).toBe(PRIORITIES.MEDIUM)
  })

  it('标题和描述去除首尾空格', () => {
    const ticket = createTicket({ title: '  测试  ', description: '  描述  ' }, [])
    expect(ticket.title).toBe('测试')
    expect(ticket.description).toBe('描述')
  })
})

describe('loadTickets / saveTickets', () => {
  let storage

  beforeEach(() => {
    storage = createMockLocalStorage()
  })

  it('localStorage 为空时返回空数组', () => {
    expect(loadTickets(storage)).toEqual([])
  })

  it('保存和加载工单', () => {
    const tickets = [makeTicket()]
    saveTickets(tickets, storage)
    const loaded = loadTickets(storage)
    expect(loaded.length).toBe(1)
    expect(loaded[0].id).toBe(tickets[0].id)
  })

  it('损坏数据返回空数组', () => {
    storage.setItem(STORAGE_KEY, 'invalid json')
    expect(loadTickets(storage)).toEqual([])
  })

  it('非数组数据返回空数组', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ not: 'array' }))
    expect(loadTickets(storage)).toEqual([])
  })

  it('过滤缺少必要字段的记录', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify([{ title: 'bad' }, null, 42]))
    expect(loadTickets(storage)).toEqual([])
  })
})

describe('addTicket', () => {
  it('添加工单到列表开头', () => {
    const existing = [makeTicket({ id: 'old' })]
    const result = addTicket(existing, {
      title: '新工单',
      category: CATEGORIES.TECHNICAL,
      priority: PRIORITIES.LOW,
      description: '描述',
    })
    expect(result.length).toBe(2)
    expect(result[0].title).toBe('新工单')
    expect(result[1].id).toBe('old')
  })
})

describe('updateTicketInList', () => {
  it('更新指定工单的字段', () => {
    const ticket = makeTicket({ id: 'tk_1', title: '旧标题' })
    const result = updateTicketInList([ticket], 'tk_1', { title: '新标题' })
    expect(result[0].title).toBe('新标题')
  })

  it('不匹配的工单不变', () => {
    const ticket = makeTicket({ id: 'tk_1', title: '标题' })
    const result = updateTicketInList([ticket], 'tk_2', { title: '新标题' })
    expect(result[0].title).toBe('标题')
  })
})

describe('transitionStatus', () => {
  it('状态变更并追加时间线记录', () => {
    const ticket = makeTicket({ id: 'tk_1', status: TICKET_STATUSES.PENDING })
    const result = transitionStatus([ticket], 'tk_1', TICKET_STATUSES.IN_PROGRESS)
    expect(result[0].status).toBe(TICKET_STATUSES.IN_PROGRESS)
    expect(result[0].timeline.length).toBe(2)
    expect(result[0].timeline[0].type).toBe(TIMELINE_TYPES.STATUS_CHANGE)
    expect(result[0].timeline[0].fromStatus).toBe(TICKET_STATUSES.PENDING)
    expect(result[0].timeline[0].toStatus).toBe(TICKET_STATUSES.IN_PROGRESS)
  })

  it('不匹配的工单不变', () => {
    const ticket = makeTicket({ id: 'tk_1', status: TICKET_STATUSES.PENDING })
    const result = transitionStatus([ticket], 'tk_2', TICKET_STATUSES.IN_PROGRESS)
    expect(result[0].status).toBe(TICKET_STATUSES.PENDING)
  })
})

describe('addComment', () => {
  it('追加备注到时间线', () => {
    const ticket = makeTicket({ id: 'tk_1' })
    const result = addComment([ticket], 'tk_1', '测试备注')
    expect(result[0].timeline.length).toBe(2)
    expect(result[0].timeline[0].type).toBe(TIMELINE_TYPES.COMMENT)
    expect(result[0].timeline[0].description).toBe('测试备注')
  })
})

describe('getAvailableTransitions', () => {
  it('待处理状态可开始处理', () => {
    const transitions = getAvailableTransitions(TICKET_STATUSES.PENDING)
    expect(transitions).toEqual([
      { label: '开始处理', target: TICKET_STATUSES.IN_PROGRESS },
    ])
  })

  it('处理中可标记已解决或退回待处理', () => {
    const transitions = getAvailableTransitions(TICKET_STATUSES.IN_PROGRESS)
    expect(transitions).toEqual([
      { label: '标记已解决', target: TICKET_STATUSES.RESOLVED },
      { label: '退回待处理', target: TICKET_STATUSES.PENDING },
    ])
  })

  it('已解决可关闭或重开', () => {
    const transitions = getAvailableTransitions(TICKET_STATUSES.RESOLVED)
    expect(transitions).toEqual([
      { label: '关闭工单', target: TICKET_STATUSES.CLOSED },
      { label: '重开工单', target: TICKET_STATUSES.IN_PROGRESS },
    ])
  })

  it('已关闭可重开', () => {
    const transitions = getAvailableTransitions(TICKET_STATUSES.CLOSED)
    expect(transitions).toEqual([
      { label: '重开工单', target: TICKET_STATUSES.IN_PROGRESS },
    ])
  })

  it('未知状态返回空数组', () => {
    expect(getAvailableTransitions('unknown')).toEqual([])
  })
})

describe('isSLAExceeded', () => {
  it('已解决工单不超时', () => {
    const ticket = makeTicket({
      status: TICKET_STATUSES.RESOLVED,
      priority: PRIORITIES.URGENT,
      createdAt: Date.now() - 100000,
    })
    expect(isSLAExceeded(ticket)).toBe(false)
  })

  it('已关闭工单不超时', () => {
    const ticket = makeTicket({
      status: TICKET_STATUSES.CLOSED,
      priority: PRIORITIES.URGENT,
      createdAt: Date.now() - 100000,
    })
    expect(isSLAExceeded(ticket)).toBe(false)
  })

  it('低优先级超过48小时超时', () => {
    const now = Date.now()
    const ticket = makeTicket({
      status: TICKET_STATUSES.PENDING,
      priority: PRIORITIES.LOW,
      createdAt: now - 49 * 60 * 60 * 1000,
    })
    expect(isSLAExceeded(ticket, now)).toBe(true)
  })

  it('低优先级未超48小时不超时', () => {
    const now = Date.now()
    const ticket = makeTicket({
      status: TICKET_STATUSES.PENDING,
      priority: PRIORITIES.LOW,
      createdAt: now - 47 * 60 * 60 * 1000,
    })
    expect(isSLAExceeded(ticket, now)).toBe(false)
  })

  it('中优先级超过24小时超时', () => {
    const now = Date.now()
    const ticket = makeTicket({
      status: TICKET_STATUSES.IN_PROGRESS,
      priority: PRIORITIES.MEDIUM,
      createdAt: now - 25 * 60 * 60 * 1000,
    })
    expect(isSLAExceeded(ticket, now)).toBe(true)
  })

  it('高优先级超过8小时超时', () => {
    const now = Date.now()
    const ticket = makeTicket({
      status: TICKET_STATUSES.PENDING,
      priority: PRIORITIES.HIGH,
      createdAt: now - 9 * 60 * 60 * 1000,
    })
    expect(isSLAExceeded(ticket, now)).toBe(true)
  })

  it('紧急优先级超过2小时超时', () => {
    const now = Date.now()
    const ticket = makeTicket({
      status: TICKET_STATUSES.PENDING,
      priority: PRIORITIES.URGENT,
      createdAt: now - 3 * 60 * 60 * 1000,
    })
    expect(isSLAExceeded(ticket, now)).toBe(true)
  })

  it('紧急优先级未超2小时不超时', () => {
    const now = Date.now()
    const ticket = makeTicket({
      status: TICKET_STATUSES.PENDING,
      priority: PRIORITIES.URGENT,
      createdAt: now - 1 * 60 * 60 * 1000,
    })
    expect(isSLAExceeded(ticket, now)).toBe(false)
  })
})

describe('getSLAExceededHours', () => {
  it('返回超时的小时数', () => {
    const now = Date.now()
    const ticket = makeTicket({
      status: TICKET_STATUSES.PENDING,
      priority: PRIORITIES.URGENT,
      createdAt: now - 5 * 60 * 60 * 1000,
    })
    const hours = getSLAExceededHours(ticket, now)
    expect(hours).toBeCloseTo(3, 0)
  })

  it('未超时返回0', () => {
    const now = Date.now()
    const ticket = makeTicket({
      status: TICKET_STATUSES.PENDING,
      priority: PRIORITIES.URGENT,
      createdAt: now - 1 * 60 * 60 * 1000,
    })
    expect(getSLAExceededHours(ticket, now)).toBe(0)
  })
})

describe('filterTickets', () => {
  const tickets = [
    makeTicket({ id: '1', status: TICKET_STATUSES.PENDING, category: CATEGORIES.TECHNICAL, priority: PRIORITIES.HIGH, title: '登录问题', description: '无法登录', createdAt: 1000 }),
    makeTicket({ id: '2', status: TICKET_STATUSES.IN_PROGRESS, category: CATEGORIES.ACCOUNT, priority: PRIORITIES.LOW, title: '注册失败', description: '注册报错', createdAt: 2000 }),
    makeTicket({ id: '3', status: TICKET_STATUSES.RESOLVED, category: CATEGORIES.PAYMENT, priority: PRIORITIES.URGENT, title: '支付超时', description: '付款失败', createdAt: 3000 }),
  ]

  it('按状态筛选', () => {
    const result = filterTickets(tickets, { statuses: [TICKET_STATUSES.PENDING] })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('按分类筛选', () => {
    const result = filterTickets(tickets, { categories: [CATEGORIES.ACCOUNT] })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('2')
  })

  it('按优先级筛选', () => {
    const result = filterTickets(tickets, { priorities: [PRIORITIES.URGENT] })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('3')
  })

  it('按关键词搜索标题', () => {
    const result = filterTickets(tickets, { keyword: '登录' })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('按关键词搜索描述', () => {
    const result = filterTickets(tickets, { keyword: '付款' })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('3')
  })

  it('多条件AND关系', () => {
    const result = filterTickets(tickets, {
      statuses: [TICKET_STATUSES.PENDING],
      priorities: [PRIORITIES.HIGH],
    })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('AND关系无匹配时返回空', () => {
    const result = filterTickets(tickets, {
      statuses: [TICKET_STATUSES.PENDING],
      priorities: [PRIORITIES.LOW],
    })
    expect(result.length).toBe(0)
  })

  it('按日期范围筛选', () => {
    const result = filterTickets(tickets, { dateFrom: '1970-01-01', dateTo: '1970-01-01' })
    expect(result.length).toBe(3)
  })

  it('空筛选条件返回全部', () => {
    const result = filterTickets(tickets, {})
    expect(result.length).toBe(3)
  })
})

describe('sortTickets', () => {
  it('按创建时间降序排序', () => {
    const tickets = [
      makeTicket({ createdAt: 1000 }),
      makeTicket({ createdAt: 3000 }),
      makeTicket({ createdAt: 2000 }),
    ]
    const result = sortTickets(tickets, 'createdAt', 'desc')
    expect(result[0].createdAt).toBe(3000)
    expect(result[2].createdAt).toBe(1000)
  })

  it('按创建时间升序排序', () => {
    const tickets = [
      makeTicket({ createdAt: 3000 }),
      makeTicket({ createdAt: 1000 }),
    ]
    const result = sortTickets(tickets, 'createdAt', 'asc')
    expect(result[0].createdAt).toBe(1000)
  })

  it('按优先级排序（紧急优先）', () => {
    const tickets = [
      makeTicket({ priority: PRIORITIES.LOW }),
      makeTicket({ priority: PRIORITIES.URGENT }),
      makeTicket({ priority: PRIORITIES.MEDIUM }),
    ]
    const result = sortTickets(tickets, 'priority', 'asc')
    expect(result[0].priority).toBe(PRIORITIES.URGENT)
  })

  it('默认按创建时间降序', () => {
    const tickets = [
      makeTicket({ createdAt: 1000 }),
      makeTicket({ createdAt: 3000 }),
    ]
    const result = sortTickets(tickets)
    expect(result[0].createdAt).toBe(3000)
  })
})

describe('paginateTickets', () => {
  it('第一页返回正确数据', () => {
    const tickets = Array.from({ length: 25 }, (_, i) => makeTicket({ id: String(i) }))
    const result = paginateTickets(tickets, 1)
    expect(result.items.length).toBe(10)
    expect(result.currentPage).toBe(1)
    expect(result.totalPages).toBe(3)
    expect(result.totalItems).toBe(25)
  })

  it('最后一页返回剩余数据', () => {
    const tickets = Array.from({ length: 25 }, (_, i) => makeTicket({ id: String(i) }))
    const result = paginateTickets(tickets, 3)
    expect(result.items.length).toBe(5)
    expect(result.currentPage).toBe(3)
  })

  it('空列表返回空结果', () => {
    const result = paginateTickets([], 1)
    expect(result.items).toEqual([])
    expect(result.totalPages).toBe(1)
    expect(result.totalItems).toBe(0)
  })

  it('页码超出范围时修正为最近的有效页', () => {
    const tickets = Array.from({ length: 15 }, (_, i) => makeTicket({ id: String(i) }))
    const result = paginateTickets(tickets, 99)
    expect(result.currentPage).toBe(2)
  })
})

describe('calculateStatusCounts', () => {
  it('统计各状态工单数', () => {
    const tickets = [
      makeTicket({ status: TICKET_STATUSES.PENDING }),
      makeTicket({ status: TICKET_STATUSES.PENDING }),
      makeTicket({ status: TICKET_STATUSES.IN_PROGRESS }),
    ]
    const counts = calculateStatusCounts(tickets)
    expect(counts[TICKET_STATUSES.PENDING]).toBe(2)
    expect(counts[TICKET_STATUSES.IN_PROGRESS]).toBe(1)
    expect(counts[TICKET_STATUSES.RESOLVED]).toBe(0)
    expect(counts[TICKET_STATUSES.CLOSED]).toBe(0)
  })

  it('空数组所有状态为0', () => {
    const counts = calculateStatusCounts([])
    Object.values(TICKET_STATUSES).forEach((s) => {
      expect(counts[s]).toBe(0)
    })
  })
})

describe('calculateCategoryCounts', () => {
  it('统计各分类工单数', () => {
    const tickets = [
      makeTicket({ category: CATEGORIES.TECHNICAL }),
      makeTicket({ category: CATEGORIES.TECHNICAL }),
      makeTicket({ category: CATEGORIES.ACCOUNT }),
    ]
    const counts = calculateCategoryCounts(tickets)
    expect(counts[CATEGORIES.TECHNICAL]).toBe(2)
    expect(counts[CATEGORIES.ACCOUNT]).toBe(1)
  })
})

describe('getLast7Days', () => {
  it('返回7天数据', () => {
    const days = getLast7Days()
    expect(days.length).toBe(7)
  })

  it('按时间顺序排列', () => {
    const days = getLast7Days()
    for (let i = 1; i < days.length; i++) {
      expect(days[i].timestamp).toBeGreaterThan(days[i - 1].timestamp)
    }
  })

  it('每个条目包含 key, label, timestamp', () => {
    const days = getLast7Days()
    days.forEach((d) => {
      expect(d.key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(d.label).toBeTruthy()
      expect(typeof d.timestamp).toBe('number')
    })
  })
})

describe('buildTrendData', () => {
  it('构建7天趋势数据', () => {
    const days = getLast7Days()
    const tickets = [makeTicket({ createdAt: days[6].timestamp })]
    const trend = buildTrendData(tickets, days)
    expect(trend.length).toBe(7)
    expect(trend[6].count).toBe(1)
    expect(trend[0].count).toBe(0)
  })

  it('无工单时每天计数为0', () => {
    const days = getLast7Days()
    const trend = buildTrendData([], days)
    trend.forEach((d) => {
      expect(d.count).toBe(0)
    })
  })
})

describe('calculateAvgResolutionTime', () => {
  it('计算已关闭工单的平均处理时长', () => {
    const now = Date.now()
    const ticket = makeTicket({
      status: TICKET_STATUSES.CLOSED,
      createdAt: now - 100000,
      updatedAt: now,
      timeline: [
        { id: 'tl_3', type: TIMELINE_TYPES.STATUS_CHANGE, timestamp: now, description: '关闭', toStatus: TICKET_STATUSES.CLOSED },
        { id: 'tl_2', type: TIMELINE_TYPES.STATUS_CHANGE, timestamp: now - 50000, description: '处理' },
        { id: 'tl_1', type: TIMELINE_TYPES.CREATED, timestamp: now - 100000, description: '创建' },
      ],
    })
    const avg = calculateAvgResolutionTime([ticket])
    expect(avg).toBeGreaterThan(0)
  })

  it('无已关闭工单返回0', () => {
    expect(calculateAvgResolutionTime([])).toBe(0)
  })
})

describe('calculateSLAComplianceRate', () => {
  it('无工单时达标率100', () => {
    expect(calculateSLAComplianceRate([], Date.now())).toBe(100)
  })

  it('全部超时达标率0', () => {
    const now = Date.now()
    const tickets = [
      makeTicket({ status: TICKET_STATUSES.PENDING, priority: PRIORITIES.URGENT, createdAt: now - 10 * 60 * 60 * 1000 }),
    ]
    expect(calculateSLAComplianceRate(tickets, now)).toBe(0)
  })

  it('部分超时计算达标率', () => {
    const now = Date.now()
    const tickets = [
      makeTicket({ status: TICKET_STATUSES.PENDING, priority: PRIORITIES.URGENT, createdAt: now - 10 * 60 * 60 * 1000 }),
      makeTicket({ status: TICKET_STATUSES.PENDING, priority: PRIORITIES.LOW, createdAt: now - 1000 }),
    ]
    expect(calculateSLAComplianceRate(tickets, now)).toBe(50)
  })
})

describe('countSLAExceeded', () => {
  it('统计超时工单数', () => {
    const now = Date.now()
    const tickets = [
      makeTicket({ status: TICKET_STATUSES.PENDING, priority: PRIORITIES.URGENT, createdAt: now - 5 * 60 * 60 * 1000 }),
      makeTicket({ status: TICKET_STATUSES.PENDING, priority: PRIORITIES.LOW, createdAt: now - 1000 }),
    ]
    expect(countSLAExceeded(tickets, now)).toBe(1)
  })
})

describe('formatDuration', () => {
  it('格式化小时和分钟', () => {
    expect(formatDuration(90 * 60 * 1000)).toBe('1小时30分钟')
  })

  it('仅小时', () => {
    expect(formatDuration(120 * 60 * 1000)).toBe('2小时')
  })

  it('仅分钟', () => {
    expect(formatDuration(30 * 60 * 1000)).toBe('30分钟')
  })

  it('0或负数返回0小时', () => {
    expect(formatDuration(0)).toBe('0小时')
    expect(formatDuration(-1)).toBe('0小时')
  })
})

describe('formatDateTime', () => {
  it('格式化时间戳为 YYYY-MM-DD HH:mm:ss', () => {
    const d = new Date(2024, 5, 1, 14, 30, 45)
    expect(formatDateTime(d.getTime())).toBe('2024-06-01 14:30:45')
  })

  it('月日时分秒补零', () => {
    const d = new Date(2024, 0, 5, 3, 7, 9)
    expect(formatDateTime(d.getTime())).toBe('2024-01-05 03:07:09')
  })
})
