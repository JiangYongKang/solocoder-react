import {
  STORAGE_KEY,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUS,
  STATUS_TRANSITIONS,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE,
  ALLOWED_IMAGE_TYPES,
  PAGE_SIZE,
  TREND_DAYS,
} from './constants.js'

export const generateId = () => {
  return 'fb_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

export const formatDate = (timestamp) => {
  if (!timestamp && timestamp !== 0) return ''
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export const formatDateOnly = (timestamp) => {
  if (!timestamp && timestamp !== 0) return ''
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const isValidCategory = (category) => {
  return Object.values(FEEDBACK_CATEGORIES).includes(category)
}

export const isValidStatus = (status) => {
  return Object.values(FEEDBACK_STATUS).includes(status)
}

export const validateTitle = (title) => {
  if (typeof title !== 'string') return false
  const trimmed = title.trim()
  if (trimmed.length === 0) return false
  if (trimmed.length > MAX_TITLE_LENGTH) return false
  return true
}

export const validateDescription = (description) => {
  if (typeof description !== 'string') return false
  const trimmed = description.trim()
  if (trimmed.length === 0) return false
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) return false
  return true
}

export const validateAttachmentType = (fileType) => {
  return ALLOWED_IMAGE_TYPES.includes(fileType)
}

export const validateAttachmentSize = (fileSize) => {
  if (typeof fileSize !== 'number' || fileSize <= 0) return false
  return fileSize <= MAX_ATTACHMENT_SIZE
}

export const validateAttachmentCount = (currentCount) => {
  return currentCount < MAX_ATTACHMENTS
}

export const validateAttachment = (file, currentCount = 0) => {
  const errors = {}
  if (!file) {
    errors.file = '文件不存在'
    return { valid: false, errors }
  }
  if (!validateAttachmentCount(currentCount)) {
    errors.count = `最多只能上传 ${MAX_ATTACHMENTS} 张图片`
  }
  if (!validateAttachmentType(file.type)) {
    errors.type = '仅支持 JPG/PNG/GIF/WebP 格式的图片'
  }
  if (!validateAttachmentSize(file.size)) {
    errors.size = `单张图片不能超过 ${MAX_ATTACHMENT_SIZE / 1024 / 1024}MB`
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

export const validateFeedbackData = (data) => {
  const errors = {}
  if (!data) {
    return { valid: false, errors: { data: '数据为空' } }
  }
  if (!isValidCategory(data.category)) {
    errors.category = '请选择有效的反馈分类'
  }
  if (!validateTitle(data.title)) {
    errors.title = `标题不能为空且不超过 ${MAX_TITLE_LENGTH} 字`
  }
  if (!validateDescription(data.description)) {
    errors.description = `描述不能为空且不超过 ${MAX_DESCRIPTION_LENGTH} 字`
  }
  if (data.attachments && !Array.isArray(data.attachments)) {
    errors.attachments = '附件数据格式错误'
  }
  if (data.attachments && Array.isArray(data.attachments) && data.attachments.length > MAX_ATTACHMENTS) {
    errors.attachments = `附件数量不能超过 ${MAX_ATTACHMENTS} 张`
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

export const loadFeedbacks = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return generateMockData()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return generateMockData()
    return parsed
  } catch {
    return generateMockData()
  }
}

export const saveFeedbacks = (feedbacks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks))
    return true
  } catch {
    return false
  }
}

export const canTransitionStatus = (currentStatus) => {
  if (!isValidStatus(currentStatus)) return false
  return STATUS_TRANSITIONS[currentStatus] !== null
}

export const getNextStatus = (currentStatus) => {
  if (!isValidStatus(currentStatus)) return null
  return STATUS_TRANSITIONS[currentStatus]
}

export const transitionStatus = (feedbacks, feedbackId) => {
  if (!Array.isArray(feedbacks)) {
    return { success: false, error: '数据格式错误', feedbacks: null, feedback: null }
  }
  const index = feedbacks.findIndex((f) => f.id === feedbackId)
  if (index === -1) {
    return { success: false, error: '反馈不存在', feedbacks: null, feedback: null }
  }
  const current = feedbacks[index]
  if (!canTransitionStatus(current.status)) {
    return { success: false, error: '当前状态无法流转', feedbacks: null, feedback: null }
  }
  const nextStatus = getNextStatus(current.status)
  const now = Date.now()
  const updated = {
    ...current,
    status: nextStatus,
    statusTimeline: [
      ...(current.statusTimeline || []),
      { status: nextStatus, timestamp: now },
    ],
  }
  const newFeedbacks = [...feedbacks]
  newFeedbacks[index] = updated
  return { success: true, feedbacks: newFeedbacks, feedback: updated }
}

export const setRating = (feedbacks, feedbackId, rating) => {
  if (!Array.isArray(feedbacks)) {
    return { success: false, error: '数据格式错误', feedbacks: null, feedback: null }
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return { success: false, error: '评分必须是 1-5 的整数', feedbacks: null, feedback: null }
  }
  const index = feedbacks.findIndex((f) => f.id === feedbackId)
  if (index === -1) {
    return { success: false, error: '反馈不存在', feedbacks: null, feedback: null }
  }
  const current = feedbacks[index]
  if (current.status !== FEEDBACK_STATUS.RESOLVED) {
    return { success: false, error: '仅已解决的反馈可以评分', feedbacks: null, feedback: null }
  }
  const updated = { ...current, rating }
  const newFeedbacks = [...feedbacks]
  newFeedbacks[index] = updated
  return { success: true, feedbacks: newFeedbacks, feedback: updated }
}

export const calculateAverageRating = (feedbacks) => {
  if (!Array.isArray(feedbacks)) return 0
  const rated = feedbacks.filter((f) => typeof f.rating === 'number' && f.rating >= 1 && f.rating <= 5)
  if (rated.length === 0) return 0
  const sum = rated.reduce((acc, f) => acc + f.rating, 0)
  return Math.round((sum / rated.length) * 10) / 10
}

export const createFeedback = (feedbacks, data) => {
  const validation = validateFeedbackData(data)
  if (!validation.valid) {
    return { success: false, errors: validation.errors, feedback: null, feedbacks: null }
  }
  const now = Date.now()
  const newFeedback = {
    id: generateId(),
    category: data.category,
    title: data.title.trim(),
    description: data.description.trim(),
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    status: FEEDBACK_STATUS.SUBMITTED,
    rating: null,
    createdAt: now,
    statusTimeline: [{ status: FEEDBACK_STATUS.SUBMITTED, timestamp: now }],
  }
  const newFeedbacks = [newFeedback, ...(Array.isArray(feedbacks) ? feedbacks : [])]
  return { success: true, feedback: newFeedback, feedbacks: newFeedbacks, errors: {} }
}

export const searchByKeyword = (feedbacks, keyword) => {
  if (!Array.isArray(feedbacks)) return []
  if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') return feedbacks
  const kw = keyword.trim().toLowerCase()
  return feedbacks.filter((f) => {
    return (f.title && f.title.toLowerCase().includes(kw))
  })
}

export const filterByCategory = (feedbacks, category) => {
  if (!Array.isArray(feedbacks)) return []
  if (!category || category === 'all') return feedbacks
  return feedbacks.filter((f) => f.category === category)
}

export const filterByStatus = (feedbacks, status) => {
  if (!Array.isArray(feedbacks)) return []
  if (!status || status === 'all') return feedbacks
  return feedbacks.filter((f) => f.status === status)
}

export const paginateFeedbacks = (feedbacks, page = 1, pageSize = PAGE_SIZE) => {
  if (!Array.isArray(feedbacks)) {
    return { items: [], total: 0, totalPage: 1, currentPage: 1, pageSize }
  }
  const total = feedbacks.length
  const totalPage = Math.max(1, Math.ceil(total / pageSize))
  let currentPage = Number(page)
  if (!Number.isInteger(currentPage) || currentPage < 1) currentPage = 1
  if (currentPage > totalPage) currentPage = totalPage
  const start = (currentPage - 1) * pageSize
  const items = feedbacks.slice(start, start + pageSize)
  return { items, total, totalPage, currentPage, pageSize }
}

export const getFilteredAndPaginatedList = (feedbacks, options = {}) => {
  const { keyword = '', category = 'all', status = 'all', page = 1, pageSize = PAGE_SIZE } = options
  let result = Array.isArray(feedbacks) ? [...feedbacks] : []
  result = searchByKeyword(result, keyword)
  result = filterByCategory(result, category)
  result = filterByStatus(result, status)
  result.sort((a, b) => b.createdAt - a.createdAt)
  return paginateFeedbacks(result, page, pageSize)
}

export const getOverviewStats = (feedbacks) => {
  if (!Array.isArray(feedbacks)) {
    return { total: 0, pending: 0, resolved: 0, averageRating: 0 }
  }
  const total = feedbacks.length
  const pending = feedbacks.filter(
    (f) => f.status === FEEDBACK_STATUS.SUBMITTED || f.status === FEEDBACK_STATUS.PROCESSING
  ).length
  const resolved = feedbacks.filter((f) => f.status === FEEDBACK_STATUS.RESOLVED).length
  const averageRating = calculateAverageRating(feedbacks)
  return { total, pending, resolved, averageRating }
}

const getLastNDays = (n) => {
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(formatDateOnly(d.getTime()))
  }
  return days
}

export const getCategoryTrendData = (feedbacks, categoryFilter = 'all', statusFilter = 'all') => {
  if (!Array.isArray(feedbacks)) feedbacks = []
  const days = getLastNDays(TREND_DAYS)
  const categories = Object.values(FEEDBACK_CATEGORIES)
  const result = days.map((day) => {
    const entry = { date: day }
    categories.forEach((cat) => {
      entry[cat] = 0
    })
    return entry
  })
  feedbacks.forEach((f) => {
    const day = formatDateOnly(f.createdAt)
    const dayIndex = days.indexOf(day)
    if (dayIndex === -1) return
    if (statusFilter !== 'all' && f.status !== statusFilter) return
    if (categoryFilter !== 'all' && f.category !== categoryFilter) {
      return
    }
    result[dayIndex][f.category] += 1
  })
  return result
}

const generateMockData = () => {
  const now = Date.now()
  const categories = Object.values(FEEDBACK_CATEGORIES)
  const statuses = Object.values(FEEDBACK_STATUS)
  const mockData = []
  const titles = [
    '登录页面加载缓慢',
    '建议增加夜间模式',
    '导出功能无法正常使用',
    '移动端适配问题',
    '文章内容存在错别字',
    '搜索功能体验优化',
    '数据同步出现延迟',
    '界面按钮样式建议',
    '消息通知不及时',
    '文档内容需要补充',
  ]
  const descriptions = [
    '在使用过程中发现该问题，希望能够尽快解决。已经尝试过多次，问题复现率很高。',
    '希望能够增加相关功能，对于用户体验会有很大提升。当前的使用场景下有些不便。',
    '在特定操作条件下出现了异常，错误信息不够明确。建议增加详细的日志输出。',
    '详细描述如下：问题出现的频率较高，影响正常使用。环境信息：Chrome 浏览器。',
    '建议参考其他同类产品的设计，进行相应的优化改进。期待后续的更新版本。',
  ]
  for (let i = 0; i < 15; i++) {
    const id = generateId()
    const category = categories[i % categories.length]
    const statusIdx = i < 5 ? 2 : i < 10 ? 1 : 0
    const status = statuses[statusIdx]
    const daysAgo = Math.floor(Math.random() * TREND_DAYS)
    const createdAt = now - daysAgo * 24 * 60 * 60 * 1000 - Math.floor(Math.random() * 3600000)
    const item = {
      id,
      category,
      title: titles[i % titles.length],
      description: descriptions[i % descriptions.length],
      attachments: [],
      status,
      rating: status === FEEDBACK_STATUS.RESOLVED ? Math.floor(Math.random() * 3) + 3 : null,
      createdAt,
      statusTimeline: [{ status: FEEDBACK_STATUS.SUBMITTED, timestamp: createdAt }],
    }
    if (statusIdx >= 1) {
      item.statusTimeline.push({
        status: FEEDBACK_STATUS.PROCESSING,
        timestamp: createdAt + 3600000,
      })
    }
    if (statusIdx >= 2) {
      item.statusTimeline.push({
        status: FEEDBACK_STATUS.RESOLVED,
        timestamp: createdAt + 7200000,
      })
    }
    mockData.push(item)
  }
  mockData.sort((a, b) => b.createdAt - a.createdAt)
  return mockData
}
