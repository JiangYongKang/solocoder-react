import {
  DEFAULT_PAGE_SIZE,
  TIMEOUT_HOURS,
  VISITOR_STATUS,
  RECENT_HOST_LIMIT,
} from './constants'

export function generateId() {
  return 'vr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

export function maskPhone(phone) {
  if (!phone) return ''
  const str = String(phone)
  if (str.length !== 11) return str
  return str.slice(0, 3) + '****' + str.slice(7)
}

export function maskIdCard(idCard) {
  if (!idCard) return ''
  const str = String(idCard)
  if (str.length !== 18) return str
  return str.slice(0, 6) + '********' + str.slice(14)
}

export function getVisitorStatus(record, now = Date.now()) {
  if (record.checkOutTime) {
    return VISITOR_STATUS.CHECKED_OUT
  }
  const registerTime = new Date(record.registerTime).getTime()
  const hoursElapsed = (now - registerTime) / (1000 * 60 * 60)
  if (hoursElapsed > TIMEOUT_HOURS) {
    return VISITOR_STATUS.OVERDUE
  }
  return VISITOR_STATUS.VISITING
}

export function sortRecords(records, now = Date.now()) {
  const sorted = [...records].sort((a, b) => {
    const statusA = getVisitorStatus(a, now)
    const statusB = getVisitorStatus(b, now)
    if (statusA === VISITOR_STATUS.OVERDUE && statusB !== VISITOR_STATUS.OVERDUE) return -1
    if (statusB === VISITOR_STATUS.OVERDUE && statusA !== VISITOR_STATUS.OVERDUE) return 1
    return new Date(b.registerTime).getTime() - new Date(a.registerTime).getTime()
  })
  return sorted
}

export function filterRecords(records, filters = {}, now = Date.now()) {
  let result = [...records]

  if (filters.keyword && filters.keyword.trim()) {
    const kw = filters.keyword.trim().toLowerCase()
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(kw) ||
        r.phone.includes(kw) ||
        maskPhone(r.phone).includes(kw)
    )
  }

  if (filters.status && filters.status !== 'all') {
    result = result.filter((r) => getVisitorStatus(r, now) === filters.status)
  }

  if (filters.startDate) {
    const startTs = new Date(filters.startDate).setHours(0, 0, 0, 0)
    if (!isNaN(startTs)) {
      result = result.filter((r) => new Date(r.registerTime).getTime() >= startTs)
    }
  }

  if (filters.endDate) {
    const endTs = new Date(filters.endDate).setHours(23, 59, 59, 999)
    if (!isNaN(endTs)) {
      result = result.filter((r) => new Date(r.registerTime).getTime() <= endTs)
    }
  }

  return result
}

export function paginateRecords(records, page, pageSize = DEFAULT_PAGE_SIZE) {
  const total = records.length
  const totalPage = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: records.slice(start, end),
    total,
    totalPage,
    currentPage,
    pageSize,
  }
}

export function exportRecordsToCsv(records, now = Date.now()) {
  const headers = [
    '姓名',
    '手机号',
    '身份证号',
    '访问事由',
    '被访人',
    '被访人部门',
    '登记时间',
    '签退时间',
    '状态',
  ]
  const statusLabels = {
    [VISITOR_STATUS.VISITING]: '访问中',
    [VISITOR_STATUS.CHECKED_OUT]: '已签退',
    [VISITOR_STATUS.OVERDUE]: '超时未签退',
  }
  const rows = records.map((r) => [
    r.name,
    r.phone,
    r.idCard,
    r.reason,
    r.host?.name || '',
    r.host?.department || '',
    formatDateTime(r.registerTime),
    formatDateTime(r.checkOutTime),
    statusLabels[getVisitorStatus(r, now)] || '',
  ])
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  return csvContent
}

export function downloadCsv(csvContent, filename) {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function updateRecentHosts(recentHosts, host, limit = RECENT_HOST_LIMIT) {
  if (!host) return recentHosts
  const filtered = recentHosts.filter((h) => h.id !== host.id)
  const updated = [host, ...filtered]
  return updated.slice(0, limit)
}

export function searchHosts(hostList, keyword) {
  if (!keyword || !keyword.trim()) return hostList
  const kw = keyword.trim().toLowerCase()
  return hostList.filter((h) => h.name.toLowerCase().includes(kw))
}

export function checkOutRecord(record, checkOutTime = Date.now()) {
  return {
    ...record,
    checkOutTime,
  }
}

export function batchCheckOutRecords(records, ids, checkOutTime = Date.now()) {
  const idSet = new Set(ids)
  return records.map((r) =>
    idSet.has(r.id) && !r.checkOutTime ? { ...r, checkOutTime } : r
  )
}

export function createFormInitialState(timestamp = Date.now()) {
  return {
    name: '',
    phone: '',
    idCard: '',
    reason: '',
    host: null,
    photo: '',
    registerTime: formatDateTime(timestamp),
    _registerTimestamp: timestamp,
  }
}

export function createRegistrationRecord(formData, idGenerator = generateId) {
  const registerTimestamp = formData._registerTimestamp || Date.now()
  return {
    id: idGenerator(),
    name: formData.name.trim(),
    phone: formData.phone.trim(),
    idCard: formData.idCard.trim(),
    reason: formData.reason.trim(),
    host: formData.host,
    photo: formData.photo,
    registerTime: registerTimestamp,
    checkOutTime: null,
  }
}
