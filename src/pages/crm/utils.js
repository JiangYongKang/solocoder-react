import {
  STORAGE_KEY,
  FOLLOWUP_STORAGE_KEY,
  CURRENT_USER_KEY,
  MOCK_CUSTOMERS,
  MOCK_FOLLOWUPS,
  SORT_ORDERS,
  PAGE_SIZE,
  CUSTOMER_STATUS,
  CUSTOMER_STATUS_LABEL,
  CUSTOMER_SOURCES,
  USERS,
  DEFAULT_CURRENT_USER_ID,
} from './constants.js'

export function generateCustomerId() {
  return 'c_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function generateFollowupId() {
  return 'f_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function loadCustomers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    /* ignore */
  }
  return [...MOCK_CUSTOMERS]
}

export function saveCustomers(customers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
    return true
  } catch {
    return false
  }
}

export function loadFollowups() {
  try {
    const raw = localStorage.getItem(FOLLOWUP_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    /* ignore */
  }
  return [...MOCK_FOLLOWUPS]
}

export function saveFollowups(followups) {
  try {
    localStorage.setItem(FOLLOWUP_STORAGE_KEY, JSON.stringify(followups))
    return true
  } catch {
    return false
  }
}

export function loadCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    if (raw) {
      return raw
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_CURRENT_USER_ID
}

export function saveCurrentUser(userId) {
  try {
    localStorage.setItem(CURRENT_USER_KEY, String(userId))
    return true
  } catch {
    return false
  }
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false
  return /^1[3-9]\d{9}$/.test(phone.trim())
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function validateCustomer(data) {
  const errors = {}
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.name = '客户名称不能为空'
  } else if (data.name.trim().length > 50) {
    errors.name = '客户名称不能超过50个字符'
  }
  if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length === 0) {
    errors.phone = '联系电话不能为空'
  } else if (!validatePhone(data.phone)) {
    errors.phone = '请输入正确的手机号格式'
  }
  if (data.email && data.email.trim().length > 0) {
    if (!validateEmail(data.email)) {
      errors.email = '请输入正确的邮箱格式'
    }
  }
  if (data.source && !CUSTOMER_SOURCES.includes(data.source)) {
    errors.source = '无效的客户来源'
  }
  return errors
}

export function validateFollowup(data) {
  const errors = {}
  if (!data.method || typeof data.method !== 'string' || data.method.trim().length === 0) {
    errors.method = '请选择跟进方式'
  }
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.content = '跟进内容不能为空'
  }
  return errors
}

export function createCustomer(customers, data) {
  const errors = validateCustomer(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const newCustomer = {
    id: generateCustomerId(),
    name: data.name.trim(),
    company: data.company ? data.company.trim() : '',
    phone: data.phone.trim(),
    email: data.email ? data.email.trim() : '',
    source: data.source || '其他',
    status: data.status || CUSTOMER_STATUS.NEW,
    ownerId: data.ownerId !== undefined ? data.ownerId : null,
    remark: data.remark ? data.remark.trim() : '',
    createdAt: Date.now(),
  }
  const updated = [newCustomer, ...customers]
  return { success: true, customer: newCustomer, customers: updated }
}

export function updateCustomer(customers, id, data) {
  const errors = validateCustomer(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const index = customers.findIndex((c) => c.id === id)
  if (index === -1) {
    return { success: false, errors: { id: '客户不存在' } }
  }
  const updated = [...customers]
  updated[index] = {
    ...updated[index],
    name: data.name.trim(),
    company: data.company ? data.company.trim() : '',
    phone: data.phone.trim(),
    email: data.email ? data.email.trim() : '',
    source: data.source || updated[index].source,
    status: data.status || updated[index].status,
    remark: data.remark !== undefined ? data.remark.trim() : updated[index].remark,
  }
  return { success: true, customer: updated[index], customers: updated }
}

export function deleteCustomer(customers, id) {
  const exists = customers.some((c) => c.id === id)
  if (!exists) {
    return { success: false, customers }
  }
  return { success: true, customers: customers.filter((c) => c.id !== id) }
}

export function claimCustomer(customers, id, userId) {
  const index = customers.findIndex((c) => c.id === id)
  if (index === -1) {
    return { success: false, customers, error: '客户不存在' }
  }
  if (customers[index].ownerId) {
    return { success: false, customers, error: '该客户已有归属人' }
  }
  const updated = [...customers]
  updated[index] = { ...updated[index], ownerId: userId }
  return { success: true, customer: updated[index], customers: updated }
}

export function releaseCustomer(customers, id) {
  const index = customers.findIndex((c) => c.id === id)
  if (index === -1) {
    return { success: false, customers, error: '客户不存在' }
  }
  const updated = [...customers]
  updated[index] = { ...updated[index], ownerId: null }
  return { success: true, customer: updated[index], customers: updated }
}

export function transferCustomer(customers, id, targetUserId) {
  const index = customers.findIndex((c) => c.id === id)
  if (index === -1) {
    return { success: false, customers, error: '客户不存在' }
  }
  const userExists = USERS.some((u) => u.id === targetUserId)
  if (!userExists) {
    return { success: false, customers, error: '目标用户不存在' }
  }
  const updated = [...customers]
  updated[index] = { ...updated[index], ownerId: targetUserId }
  return { success: true, customer: updated[index], customers: updated }
}

export function searchCustomers(customers, keyword) {
  if (!Array.isArray(customers)) return []
  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
    return customers
  }
  const kw = keyword.trim().toLowerCase()
  return customers.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(kw)) ||
      (c.company && c.company.toLowerCase().includes(kw))
  )
}

export function filterBySource(customers, source) {
  if (!Array.isArray(customers)) return []
  if (!source || source === 'all') {
    return customers
  }
  return customers.filter((c) => c.source === source)
}

export function filterByOwner(customers, ownerType, currentUserId) {
  if (!Array.isArray(customers)) return []
  if (ownerType === 'mine') {
    return customers.filter((c) => c.ownerId === currentUserId)
  } else if (ownerType === 'pool') {
    return customers.filter((c) => !c.ownerId)
  }
  return customers
}

export function filterByDateRange(customers, startDate, endDate) {
  if (!Array.isArray(customers)) return []
  let result = customers
  if (startDate) {
    const startTs = new Date(startDate).getTime()
    result = result.filter((c) => c.createdAt >= startTs)
  }
  if (endDate) {
    const endTs = new Date(endDate).getTime() + 86400000 - 1
    result = result.filter((c) => c.createdAt <= endTs)
  }
  return result
}

export function sortCustomers(customers, sortField, sortOrder) {
  if (!Array.isArray(customers)) return []
  if (!sortField) return customers
  const order = sortOrder === SORT_ORDERS.DESC ? -1 : 1
  return [...customers].sort((a, b) => {
    let va = a[sortField]
    let vb = b[sortField]
    if (va === null || va === undefined) va = ''
    if (vb === null || vb === undefined) vb = ''
    if (typeof va === 'string' && typeof vb === 'string') {
      return va.localeCompare(vb, 'zh-CN') * order
    }
    return (va - vb) * order
  })
}

export function paginateCustomers(customers, page, pageSize = PAGE_SIZE) {
  if (!Array.isArray(customers)) {
    return { items: [], total: 0, totalPage: 1, currentPage: 1, pageSize }
  }
  const total = customers.length
  const totalPage = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: customers.slice(start, end),
    total,
    totalPage,
    currentPage,
    pageSize,
  }
}

export function getCustomerList(customers, options = {}) {
  if (!Array.isArray(customers)) {
    return paginateCustomers([], 1, options.pageSize)
  }
  let result = [...customers]
  if (options.ownerType && options.currentUserId) {
    result = filterByOwner(result, options.ownerType, options.currentUserId)
  }
  result = searchCustomers(result, options.keyword)
  result = filterBySource(result, options.source)
  result = filterByDateRange(result, options.startDate, options.endDate)
  result = sortCustomers(result, options.sortField, options.sortOrder)
  return paginateCustomers(result, options.page || 1, options.pageSize)
}

export function getFollowupsByCustomer(followups, customerId) {
  if (!Array.isArray(followups)) return []
  return followups
    .filter((f) => f.customerId === customerId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function addFollowup(followups, customerId, data) {
  const errors = validateFollowup(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const newFollowup = {
    id: generateFollowupId(),
    customerId,
    method: data.method,
    content: data.content.trim(),
    result: data.result ? data.result.trim() : '',
    createdAt: Date.now(),
  }
  const updated = [newFollowup, ...followups]
  return { success: true, followup: newFollowup, followups: updated }
}

export function deleteFollowupsByCustomer(followups, customerId) {
  if (!Array.isArray(followups)) return []
  return followups.filter((f) => f.customerId !== customerId)
}

export function getFunnelData(customers) {
  if (!Array.isArray(customers)) {
    return { stages: [], total: 0 }
  }
  const stages = [
    { key: CUSTOMER_STATUS.NEW, label: CUSTOMER_STATUS_LABEL[CUSTOMER_STATUS.NEW], count: 0 },
    { key: CUSTOMER_STATUS.INTENTION, label: CUSTOMER_STATUS_LABEL[CUSTOMER_STATUS.INTENTION], count: 0 },
    { key: CUSTOMER_STATUS.NEGOTIATION, label: CUSTOMER_STATUS_LABEL[CUSTOMER_STATUS.NEGOTIATION], count: 0 },
    { key: CUSTOMER_STATUS.CLOSED, label: CUSTOMER_STATUS_LABEL[CUSTOMER_STATUS.CLOSED], count: 0 },
  ]
  customers.forEach((c) => {
    const stage = stages.find((s) => s.key === c.status)
    if (stage) {
      stage.count += 1
    }
  })
  const total = customers.length
  for (let i = 0; i < stages.length; i++) {
    if (i === 0) {
      stages[i].conversionRate = total > 0 ? (stages[i].count / total) * 100 : 0
    } else {
      stages[i].conversionRate = stages[i - 1].count > 0 ? (stages[i].count / stages[i - 1].count) * 100 : 0
    }
    stages[i].overallRate = total > 0 ? (stages[i].count / total) * 100 : 0
  }
  return { stages, total }
}

export function getUserName(userId) {
  if (!userId) return '公海'
  const user = USERS.find((u) => u.id === userId)
  return user ? user.name : '未知'
}

export function formatDate(timestamp) {
  if (timestamp == null) return ''
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export function formatDateOnly(timestamp) {
  if (timestamp == null) return ''
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function escapeCSVValue(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export function customersToCSV(customers) {
  if (!Array.isArray(customers) || customers.length === 0) {
    return ''
  }
  const headers = ['客户名称', '公司', '联系电话', '邮箱', '客户来源', '状态', '归属人', '备注', '创建时间']
  const rows = customers.map((c) => [
    c.name || '',
    c.company || '',
    c.phone || '',
    c.email || '',
    c.source || '',
    CUSTOMER_STATUS_LABEL[c.status] || c.status || '',
    getUserName(c.ownerId),
    c.remark || '',
    formatDate(c.createdAt),
  ])
  const allRows = [headers, ...rows]
  return allRows.map((row) => row.map(escapeCSVValue).join(',')).join('\n')
}

export function downloadCSV(content, filename = 'customers.csv') {
  if (typeof window === 'undefined' || !window.Blob) return false
  try {
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

export function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    return { success: false, error: 'CSV内容为空' }
  }
  try {
    const normalized = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalized.split('\n').filter((line) => line.trim().length > 0)
    if (lines.length === 0) {
      return { success: false, error: 'CSV文件为空' }
    }
    const headers = parseCSVLine(lines[0]).map((h) => h.trim())
    const headerMap = {
      '客户名称': 'name',
      '公司': 'company',
      '联系电话': 'phone',
      '邮箱': 'email',
      '客户来源': 'source',
      '备注': 'remark',
    }
    const data = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row = {}
      headers.forEach((header, idx) => {
        const field = headerMap[header]
        if (field) {
          row[field] = (values[idx] || '').trim()
        }
      })
      data.push(row)
    }
    return { success: true, data, headers }
  } catch {
    return { success: false, error: 'CSV解析失败' }
  }
}

export function validateImportData(rows) {
  if (!Array.isArray(rows)) {
    return { valid: [], invalid: [], errors: [] }
  }
  const valid = []
  const invalid = []
  const errors = []
  rows.forEach((row, index) => {
    const rowErrors = {}
    if (!row.name || row.name.trim().length === 0) {
      rowErrors.name = '客户名称不能为空'
    }
    if (!row.phone || row.phone.trim().length === 0) {
      rowErrors.phone = '联系电话不能为空'
    } else if (!validatePhone(row.phone)) {
      rowErrors.phone = '手机号格式不正确'
    }
    if (Object.keys(rowErrors).length > 0) {
      invalid.push({ row, index: index + 2, errors: rowErrors })
      errors.push({ index: index + 2, errors: rowErrors })
    } else {
      valid.push({
        name: row.name.trim(),
        company: row.company ? row.company.trim() : '',
        phone: row.phone.trim(),
        email: row.email ? row.email.trim() : '',
        source: row.source && CUSTOMER_SOURCES.includes(row.source) ? row.source : '其他',
        remark: row.remark ? row.remark.trim() : '',
      })
    }
  })
  return { valid, invalid, errors }
}

export function batchCreateCustomers(customers, validRows, ownerId) {
  if (!Array.isArray(validRows) || validRows.length === 0) {
    return { customers, created: 0 }
  }
  const newCustomers = validRows.map((row) => ({
    id: generateCustomerId(),
    name: row.name,
    company: row.company,
    phone: row.phone,
    email: row.email,
    source: row.source,
    status: CUSTOMER_STATUS.NEW,
    ownerId: ownerId !== undefined ? ownerId : null,
    remark: row.remark,
    createdAt: Date.now(),
  }))
  return {
    customers: [...newCustomers, ...customers],
    created: newCustomers.length,
  }
}
