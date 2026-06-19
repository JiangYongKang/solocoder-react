import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  generateId,
  formatDate,
  formatDateOnly,
  isValidCategory,
  isValidStatus,
  validateTitle,
  validateDescription,
  validateAttachmentType,
  validateAttachmentSize,
  validateAttachmentCount,
  validateAttachment,
  validateFeedbackData,
  loadFeedbacks,
  saveFeedbacks,
  canTransitionStatus,
  getNextStatus,
  transitionStatus,
  setRating,
  calculateAverageRating,
  createFeedback,
  searchByKeyword,
  filterByCategory,
  filterByStatus,
  paginateFeedbacks,
  getFilteredAndPaginatedList,
  getOverviewStats,
  getCategoryTrendData,
} from '../../feedback/utils.js'

import {
  STORAGE_KEY,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUS,
  STATUS_TRANSITIONS,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE,
  PAGE_SIZE,
  TREND_DAYS,
} from '../../feedback/constants.js'

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
  globalThis.localStorage = createMockLocalStorage()
})

afterAll(() => {
  globalThis.localStorage = originalLocalStorage
})

const makeValidFeedbackData = (overrides = {}) => ({
  category: FEEDBACK_CATEGORIES.FEATURE,
  title: '测试反馈标题',
  description: '这是测试反馈的详细描述内容，需要足够长的内容。',
  attachments: [],
  ...overrides,
})

const makeFeedback = (overrides = {}) => {
  const base = makeValidFeedbackData()
  const now = Date.now()
  return {
    id: generateId(),
    ...base,
    status: FEEDBACK_STATUS.SUBMITTED,
    rating: null,
    createdAt: now,
    statusTimeline: [{ status: FEEDBACK_STATUS.SUBMITTED, timestamp: now }],
    ...overrides,
  }
}

describe('generateId', () => {
  it('生成的ID以 fb_ 开头', () => {
    expect(generateId()).toMatch(/^fb_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('formatDate', () => {
  it('空值返回空字符串', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })

  it('timestamp=0 正常格式化', () => {
    const result = formatDate(0)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(result).toContain('1970')
  })

  it('正确格式化时间戳为 YYYY-MM-DD HH:mm', () => {
    const ts = new Date('2024-01-15T10:30:00').getTime()
    const result = formatDate(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(result).toContain('2024-01-15')
  })
})

describe('formatDateOnly', () => {
  it('空值返回空字符串', () => {
    expect(formatDateOnly(null)).toBe('')
    expect(formatDateOnly(undefined)).toBe('')
  })

  it('正确格式化时间戳为 YYYY-MM-DD', () => {
    const ts = new Date('2024-01-15T10:30:00').getTime()
    expect(formatDateOnly(ts)).toBe('2024-01-15')
  })
})

describe('isValidCategory', () => {
  it('有效的分类返回 true', () => {
    Object.values(FEEDBACK_CATEGORIES).forEach((cat) => {
      expect(isValidCategory(cat)).toBe(true)
    })
  })

  it('无效的分类返回 false', () => {
    expect(isValidCategory('invalid')).toBe(false)
    expect(isValidCategory('')).toBe(false)
    expect(isValidCategory(null)).toBe(false)
    expect(isValidCategory(undefined)).toBe(false)
    expect(isValidCategory(123)).toBe(false)
  })
})

describe('isValidStatus', () => {
  it('有效的状态返回 true', () => {
    Object.values(FEEDBACK_STATUS).forEach((st) => {
      expect(isValidStatus(st)).toBe(true)
    })
  })

  it('无效的状态返回 false', () => {
    expect(isValidStatus('invalid')).toBe(false)
    expect(isValidStatus('deleted')).toBe(false)
    expect(isValidStatus(null)).toBe(false)
  })
})

describe('validateTitle', () => {
  it('有效的标题返回 true', () => {
    expect(validateTitle('正常标题')).toBe(true)
    expect(validateTitle('短')).toBe(true)
    expect(validateTitle('a'.repeat(MAX_TITLE_LENGTH))).toBe(true)
  })

  it('空标题或空白标题返回 false', () => {
    expect(validateTitle('')).toBe(false)
    expect(validateTitle('   ')).toBe(false)
    expect(validateTitle(null)).toBe(false)
    expect(validateTitle(undefined)).toBe(false)
    expect(validateTitle(123)).toBe(false)
  })

  it('超出最大长度返回 false', () => {
    expect(validateTitle('a'.repeat(MAX_TITLE_LENGTH + 1))).toBe(false)
  })
})

describe('validateDescription', () => {
  it('有效的描述返回 true', () => {
    expect(validateDescription('正常描述内容')).toBe(true)
    expect(validateDescription('a'.repeat(MAX_DESCRIPTION_LENGTH))).toBe(true)
  })

  it('空描述或空白描述返回 false', () => {
    expect(validateDescription('')).toBe(false)
    expect(validateDescription('   ')).toBe(false)
    expect(validateDescription(null)).toBe(false)
  })

  it('超出最大长度返回 false', () => {
    expect(validateDescription('a'.repeat(MAX_DESCRIPTION_LENGTH + 1))).toBe(false)
  })
})

describe('validateAttachmentType', () => {
  it('支持的图片类型返回 true', () => {
    expect(validateAttachmentType('image/jpeg')).toBe(true)
    expect(validateAttachmentType('image/png')).toBe(true)
    expect(validateAttachmentType('image/gif')).toBe(true)
    expect(validateAttachmentType('image/webp')).toBe(true)
  })

  it('不支持的类型返回 false', () => {
    expect(validateAttachmentType('image/bmp')).toBe(false)
    expect(validateAttachmentType('application/pdf')).toBe(false)
    expect(validateAttachmentType('text/plain')).toBe(false)
    expect(validateAttachmentType('')).toBe(false)
    expect(validateAttachmentType(null)).toBe(false)
  })
})

describe('validateAttachmentSize', () => {
  it('有效的文件大小返回 true', () => {
    expect(validateAttachmentSize(1024)).toBe(true)
    expect(validateAttachmentSize(MAX_ATTACHMENT_SIZE)).toBe(true)
    expect(validateAttachmentSize(MAX_ATTACHMENT_SIZE - 1)).toBe(true)
  })

  it('无效的文件大小返回 false', () => {
    expect(validateAttachmentSize(MAX_ATTACHMENT_SIZE + 1)).toBe(false)
    expect(validateAttachmentSize(0)).toBe(false)
    expect(validateAttachmentSize(-1)).toBe(false)
    expect(validateAttachmentSize('1024')).toBe(false)
    expect(validateAttachmentSize(null)).toBe(false)
  })
})

describe('validateAttachmentCount', () => {
  it('未达到上限返回 true', () => {
    expect(validateAttachmentCount(0)).toBe(true)
    expect(validateAttachmentCount(MAX_ATTACHMENTS - 1)).toBe(true)
  })

  it('达到或超过上限返回 false', () => {
    expect(validateAttachmentCount(MAX_ATTACHMENTS)).toBe(false)
    expect(validateAttachmentCount(MAX_ATTACHMENTS + 1)).toBe(false)
  })
})

describe('validateAttachment', () => {
  it('文件为空返回失败', () => {
    const result = validateAttachment(null)
    expect(result.valid).toBe(false)
    expect(result.errors.file).toBeTruthy()
  })

  it('文件数量超出限制返回失败', () => {
    const file = { type: 'image/jpeg', size: 1024 }
    const result = validateAttachment(file, MAX_ATTACHMENTS)
    expect(result.valid).toBe(false)
    expect(result.errors.count).toBeTruthy()
  })

  it('文件类型不支持返回失败', () => {
    const file = { type: 'application/pdf', size: 1024 }
    const result = validateAttachment(file, 0)
    expect(result.valid).toBe(false)
    expect(result.errors.type).toBeTruthy()
  })

  it('文件大小超出返回失败', () => {
    const file = { type: 'image/jpeg', size: MAX_ATTACHMENT_SIZE + 1 }
    const result = validateAttachment(file, 0)
    expect(result.valid).toBe(false)
    expect(result.errors.size).toBeTruthy()
  })

  it('完全有效的文件返回成功', () => {
    const file = { type: 'image/png', size: 1024 * 1024 }
    const result = validateAttachment(file, 0)
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors).length).toBe(0)
  })

  it('同时有多个错误时全部返回', () => {
    const file = { type: 'application/pdf', size: MAX_ATTACHMENT_SIZE + 1 }
    const result = validateAttachment(file, MAX_ATTACHMENTS)
    expect(result.valid).toBe(false)
    expect(result.errors.count).toBeTruthy()
    expect(result.errors.type).toBeTruthy()
    expect(result.errors.size).toBeTruthy()
  })
})

describe('validateFeedbackData', () => {
  it('有效的数据返回空错误', () => {
    const result = validateFeedbackData(makeValidFeedbackData())
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors).length).toBe(0)
  })

  it('数据为空返回失败', () => {
    expect(validateFeedbackData(null).valid).toBe(false)
    expect(validateFeedbackData(undefined).valid).toBe(false)
  })

  it('分类无效时报错', () => {
    expect(validateFeedbackData(makeValidFeedbackData({ category: 'invalid' })).errors.category).toBeTruthy()
  })

  it('标题无效时报错', () => {
    expect(validateFeedbackData(makeValidFeedbackData({ title: '' })).errors.title).toBeTruthy()
    expect(validateFeedbackData(makeValidFeedbackData({ title: 'a'.repeat(MAX_TITLE_LENGTH + 1) })).errors.title).toBeTruthy()
  })

  it('描述无效时报错', () => {
    expect(validateFeedbackData(makeValidFeedbackData({ description: '' })).errors.description).toBeTruthy()
    expect(validateFeedbackData(makeValidFeedbackData({ description: 'a'.repeat(MAX_DESCRIPTION_LENGTH + 1) })).errors.description).toBeTruthy()
  })

  it('附件格式错误时报错', () => {
    expect(validateFeedbackData(makeValidFeedbackData({ attachments: 'not-array' })).errors.attachments).toBeTruthy()
  })

  it('附件数量超出时报错', () => {
    const many = Array.from({ length: MAX_ATTACHMENTS + 1 }, (_, i) => ({ id: i }))
    expect(validateFeedbackData(makeValidFeedbackData({ attachments: many })).errors.attachments).toBeTruthy()
  })

  it('多个错误同时存在时全部返回', () => {
    const data = { category: 'invalid', title: '', description: '' }
    const result = validateFeedbackData(data)
    expect(result.valid).toBe(false)
    expect(result.errors.category).toBeTruthy()
    expect(result.errors.title).toBeTruthy()
    expect(result.errors.description).toBeTruthy()
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveFeedbacks 成功保存返回 true', () => {
    const list = [makeFeedback({ id: 'test1' })]
    const result = saveFeedbacks(list)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(list))
  })

  it('loadFeedbacks 从 localStorage 读取成功', () => {
    const list = [makeFeedback({ id: 'test1' })]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    const result = loadFeedbacks()
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('test1')
  })

  it('loadFeedbacks localStorage 为空时返回 mock 数据', () => {
    const result = loadFeedbacks()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('loadFeedbacks localStorage 数据损坏时返回 mock 数据', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json{{')
    const result = loadFeedbacks()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('mock 数据包含所有必要字段', () => {
    const list = loadFeedbacks()
    list.forEach((item) => {
      expect(item.id).toBeTruthy()
      expect(isValidCategory(item.category)).toBe(true)
      expect(isValidStatus(item.status)).toBe(true)
      expect(typeof item.createdAt).toBe('number')
      expect(Array.isArray(item.statusTimeline)).toBe(true)
    })
  })
})

describe('canTransitionStatus', () => {
  it('已提交可以流转', () => {
    expect(canTransitionStatus(FEEDBACK_STATUS.SUBMITTED)).toBe(true)
  })

  it('处理中可以流转', () => {
    expect(canTransitionStatus(FEEDBACK_STATUS.PROCESSING)).toBe(true)
  })

  it('已解决不能再流转', () => {
    expect(canTransitionStatus(FEEDBACK_STATUS.RESOLVED)).toBe(false)
  })

  it('无效状态返回 false', () => {
    expect(canTransitionStatus('invalid')).toBe(false)
    expect(canTransitionStatus(null)).toBe(false)
  })
})

describe('getNextStatus', () => {
  it('已提交 -> 处理中', () => {
    expect(getNextStatus(FEEDBACK_STATUS.SUBMITTED)).toBe(FEEDBACK_STATUS.PROCESSING)
  })

  it('处理中 -> 已解决', () => {
    expect(getNextStatus(FEEDBACK_STATUS.PROCESSING)).toBe(FEEDBACK_STATUS.RESOLVED)
  })

  it('已解决返回 null', () => {
    expect(getNextStatus(FEEDBACK_STATUS.RESOLVED)).toBe(null)
  })

  it('无效状态返回 null', () => {
    expect(getNextStatus('invalid')).toBe(null)
  })
})

describe('transitionStatus', () => {
  it('非数组输入返回失败', () => {
    const result = transitionStatus(null, 'fb_test')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('反馈不存在返回失败', () => {
    const result = transitionStatus([], 'not-exist')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('状态不能流转时返回失败', () => {
    const fb = makeFeedback({ id: 'fb_1', status: FEEDBACK_STATUS.RESOLVED })
    const result = transitionStatus([fb], 'fb_1')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('已提交成功流转到处理中', () => {
    const fb = makeFeedback({ id: 'fb_1', status: FEEDBACK_STATUS.SUBMITTED })
    const result = transitionStatus([fb], 'fb_1')
    expect(result.success).toBe(true)
    expect(result.feedback.status).toBe(FEEDBACK_STATUS.PROCESSING)
    expect(result.feedbacks[0].status).toBe(FEEDBACK_STATUS.PROCESSING)
  })

  it('处理中成功流转到已解决', () => {
    const fb = makeFeedback({ id: 'fb_1', status: FEEDBACK_STATUS.PROCESSING })
    const result = transitionStatus([fb], 'fb_1')
    expect(result.success).toBe(true)
    expect(result.feedback.status).toBe(FEEDBACK_STATUS.RESOLVED)
  })

  it('流转时记录到时间线', () => {
    const fb = makeFeedback({ id: 'fb_1', status: FEEDBACK_STATUS.SUBMITTED })
    const beforeLen = fb.statusTimeline.length
    const result = transitionStatus([fb], 'fb_1')
    expect(result.feedback.statusTimeline.length).toBe(beforeLen + 1)
    const last = result.feedback.statusTimeline[result.feedback.statusTimeline.length - 1]
    expect(last.status).toBe(FEEDBACK_STATUS.PROCESSING)
    expect(typeof last.timestamp).toBe('number')
  })

  it('不修改其他反馈', () => {
    const fb1 = makeFeedback({ id: 'fb_1', status: FEEDBACK_STATUS.SUBMITTED, title: '反馈1' })
    const fb2 = makeFeedback({ id: 'fb_2', status: FEEDBACK_STATUS.SUBMITTED, title: '反馈2' })
    const result = transitionStatus([fb1, fb2], 'fb_1')
    expect(result.feedbacks.find((f) => f.id === 'fb_2').status).toBe(FEEDBACK_STATUS.SUBMITTED)
  })
})

describe('setRating', () => {
  it('非数组输入返回失败', () => {
    const result = setRating(null, 'fb_1', 5)
    expect(result.success).toBe(false)
  })

  it('评分无效返回失败', () => {
    const fb = makeFeedback({ id: 'fb_1', status: FEEDBACK_STATUS.RESOLVED })
    expect(setRating([fb], 'fb_1', 0).success).toBe(false)
    expect(setRating([fb], 'fb_1', 6).success).toBe(false)
    expect(setRating([fb], 'fb_1', 3.5).success).toBe(false)
    expect(setRating([fb], 'fb_1', '5').success).toBe(false)
  })

  it('反馈不存在返回失败', () => {
    const result = setRating([], 'not-exist', 5)
    expect(result.success).toBe(false)
  })

  it('非已解决状态不能评分', () => {
    const fb1 = makeFeedback({ id: 'fb_1', status: FEEDBACK_STATUS.SUBMITTED })
    const fb2 = makeFeedback({ id: 'fb_2', status: FEEDBACK_STATUS.PROCESSING })
    expect(setRating([fb1], 'fb_1', 5).success).toBe(false)
    expect(setRating([fb2], 'fb_2', 5).success).toBe(false)
  })

  it('已解决的反馈可以成功评分', () => {
    const fb = makeFeedback({ id: 'fb_1', status: FEEDBACK_STATUS.RESOLVED })
    const result = setRating([fb], 'fb_1', 4)
    expect(result.success).toBe(true)
    expect(result.feedback.rating).toBe(4)
    expect(result.feedbacks[0].rating).toBe(4)
  })
})

describe('calculateAverageRating', () => {
  it('非数组返回 0', () => {
    expect(calculateAverageRating(null)).toBe(0)
    expect(calculateAverageRating(undefined)).toBe(0)
  })

  it('空数组返回 0', () => {
    expect(calculateAverageRating([])).toBe(0)
  })

  it('没有评分的反馈返回 0', () => {
    const list = [
      makeFeedback({ rating: null }),
      makeFeedback({ rating: undefined }),
    ]
    expect(calculateAverageRating(list)).toBe(0)
  })

  it('正确计算平均分', () => {
    const list = [
      makeFeedback({ id: '1', rating: 5 }),
      makeFeedback({ id: '2', rating: 4 }),
      makeFeedback({ id: '3', rating: 3 }),
    ]
    expect(calculateAverageRating(list)).toBe(4.0)
  })

  it('平均分保留一位小数并四舍五入', () => {
    const list = [
      makeFeedback({ id: '1', rating: 5 }),
      makeFeedback({ id: '2', rating: 5 }),
      makeFeedback({ id: '3', rating: 4 }),
    ]
    expect(calculateAverageRating(list)).toBe(4.7)
  })

  it('忽略未评分的反馈', () => {
    const list = [
      makeFeedback({ id: '1', rating: 5 }),
      makeFeedback({ id: '2', rating: null }),
      makeFeedback({ id: '3', status: FEEDBACK_STATUS.SUBMITTED, rating: null }),
    ]
    expect(calculateAverageRating(list)).toBe(5.0)
  })
})

describe('createFeedback', () => {
  it('数据无效时返回失败', () => {
    const result = createFeedback([], { title: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功创建反馈并返回新列表', () => {
    const data = makeValidFeedbackData()
    const result = createFeedback([], data)
    expect(result.success).toBe(true)
    expect(result.feedback.id).toBeTruthy()
    expect(result.feedback.status).toBe(FEEDBACK_STATUS.SUBMITTED)
    expect(result.feedback.createdAt).toBeTruthy()
    expect(result.feedbacks.length).toBe(1)
    expect(result.feedbacks[0]).toBe(result.feedback)
  })

  it('新反馈放在列表最前面', () => {
    const old = makeFeedback({ id: 'old_id', title: '旧反馈' })
    const data = makeValidFeedbackData({ title: '新反馈' })
    const result = createFeedback([old], data)
    expect(result.feedbacks[0].id).toBe(result.feedback.id)
    expect(result.feedbacks[0].title).toBe('新反馈')
    expect(result.feedbacks[1].id).toBe('old_id')
  })

  it('创建时记录初始状态时间线', () => {
    const data = makeValidFeedbackData()
    const result = createFeedback([], data)
    expect(Array.isArray(result.feedback.statusTimeline)).toBe(true)
    expect(result.feedback.statusTimeline.length).toBe(1)
    expect(result.feedback.statusTimeline[0].status).toBe(FEEDBACK_STATUS.SUBMITTED)
    expect(typeof result.feedback.statusTimeline[0].timestamp).toBe('number')
  })

  it('标题和描述被 trim 处理', () => {
    const data = makeValidFeedbackData({
      title: '   带空格的标题   ',
      description: '   带空格的描述   ',
    })
    const result = createFeedback([], data)
    expect(result.feedback.title).toBe('带空格的标题')
    expect(result.feedback.description).toBe('带空格的描述')
  })
})

describe('searchByKeyword', () => {
  const list = [
    { title: '登录问题', description: '无法登录系统' },
    { title: '支付功能', description: '支付宝支付失败' },
    { title: '界面建议', description: '登录界面颜色调整' },
  ]

  it('非数组返回空数组', () => {
    expect(searchByKeyword(null, '登录')).toEqual([])
  })

  it('空关键词返回全部', () => {
    expect(searchByKeyword(list, '')).toEqual(list)
    expect(searchByKeyword(list, '   ')).toEqual(list)
  })

  it('按标题搜索', () => {
    const result = searchByKeyword(list, '登录')
    expect(result.length).toBe(2)
    expect(result.some((r) => r.title === '登录问题')).toBe(true)
    expect(result.some((r) => r.title === '界面建议')).toBe(true)
  })

  it('按描述搜索', () => {
    const result = searchByKeyword(list, '支付')
    expect(result.length).toBe(1)
    expect(result[0].title).toBe('支付功能')
  })

  it('搜索不区分大小写', () => {
    const mixed = [{ title: 'ABC System', description: 'test' }]
    const result = searchByKeyword(mixed, 'abc')
    expect(result.length).toBe(1)
  })
})

describe('filterByCategory', () => {
  const list = [
    { id: '1', category: FEEDBACK_CATEGORIES.FEATURE },
    { id: '2', category: FEEDBACK_CATEGORIES.BUG },
    { id: '3', category: FEEDBACK_CATEGORIES.EXPERIENCE },
  ]

  it('非数组返回空数组', () => {
    expect(filterByCategory(null, FEEDBACK_CATEGORIES.BUG)).toEqual([])
  })

  it('all 或空值返回全部', () => {
    expect(filterByCategory(list, 'all').length).toBe(3)
    expect(filterByCategory(list, '').length).toBe(3)
  })

  it('按分类筛选正确', () => {
    const result = filterByCategory(list, FEEDBACK_CATEGORIES.BUG)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('2')
  })
})

describe('filterByStatus', () => {
  const list = [
    { id: '1', status: FEEDBACK_STATUS.SUBMITTED },
    { id: '2', status: FEEDBACK_STATUS.PROCESSING },
    { id: '3', status: FEEDBACK_STATUS.RESOLVED },
  ]

  it('非数组返回空数组', () => {
    expect(filterByStatus(null, FEEDBACK_STATUS.SUBMITTED)).toEqual([])
  })

  it('all 或空值返回全部', () => {
    expect(filterByStatus(list, 'all').length).toBe(3)
    expect(filterByStatus(list, '').length).toBe(3)
  })

  it('按状态筛选正确', () => {
    const result = filterByStatus(list, FEEDBACK_STATUS.RESOLVED)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('3')
  })
})

describe('paginateFeedbacks', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }))

  it('非数组返回空分页结果', () => {
    const result = paginateFeedbacks(null, 1, 10)
    expect(result.items).toEqual([])
    expect(result.totalPage).toBe(1)
    expect(result.currentPage).toBe(1)
    expect(result.total).toBe(0)
  })

  it('第一页正确', () => {
    const result = paginateFeedbacks(items, 1, 10)
    expect(result.items.length).toBe(10)
    expect(result.items[0].id).toBe('1')
    expect(result.items[9].id).toBe('10')
    expect(result.currentPage).toBe(1)
    expect(result.totalPage).toBe(3)
    expect(result.total).toBe(25)
    expect(result.pageSize).toBe(10)
  })

  it('最后一页正确', () => {
    const result = paginateFeedbacks(items, 3, 10)
    expect(result.items.length).toBe(5)
    expect(result.currentPage).toBe(3)
    expect(result.items[0].id).toBe('21')
  })

  it('页码超出范围修正到最后一页', () => {
    const result = paginateFeedbacks(items, 100, 10)
    expect(result.currentPage).toBe(3)
  })

  it('页码小于 1 修正为 1', () => {
    const result = paginateFeedbacks(items, 0, 10)
    expect(result.currentPage).toBe(1)
    const result2 = paginateFeedbacks(items, -5, 10)
    expect(result2.currentPage).toBe(1)
  })

  it('空列表返回第一页', () => {
    const result = paginateFeedbacks([], 1, 10)
    expect(result.items.length).toBe(0)
    expect(result.totalPage).toBe(1)
  })

  it('默认使用 PAGE_SIZE 常量', () => {
    const many = Array.from({ length: PAGE_SIZE * 2 + 5 }, (_, i) => ({ id: i }))
    const result = paginateFeedbacks(many, 1)
    expect(result.pageSize).toBe(PAGE_SIZE)
    expect(result.items.length).toBe(PAGE_SIZE)
  })
})

describe('getFilteredAndPaginatedList', () => {
  const makeList = () => {
    const now = Date.now()
    return [
      { id: '1', category: FEEDBACK_CATEGORIES.BUG, status: FEEDBACK_STATUS.SUBMITTED, title: '登录Bug', description: '', createdAt: now - 1000 },
      { id: '2', category: FEEDBACK_CATEGORIES.FEATURE, status: FEEDBACK_STATUS.PROCESSING, title: '新功能', description: '', createdAt: now - 2000 },
      { id: '3', category: FEEDBACK_CATEGORIES.BUG, status: FEEDBACK_STATUS.RESOLVED, title: '支付Bug修复', description: '', createdAt: now - 3000 },
    ]
  }

  it('非数组返回空分页结果', () => {
    const result = getFilteredAndPaginatedList(null, {})
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
  })

  it('综合筛选和分页正确', () => {
    const list = makeList()
    const result = getFilteredAndPaginatedList(list, {
      keyword: 'Bug',
      category: FEEDBACK_CATEGORIES.BUG,
      page: 1,
      pageSize: 10,
    })
    expect(result.items.length).toBe(2)
    expect(result.items.every((i) => i.category === FEEDBACK_CATEGORIES.BUG)).toBe(true)
  })

  it('按创建时间降序排序', () => {
    const list = makeList()
    const result = getFilteredAndPaginatedList(list, {})
    expect(result.items[0].id).toBe('1')
    expect(result.items[1].id).toBe('2')
    expect(result.items[2].id).toBe('3')
  })
})

describe('getOverviewStats', () => {
  it('非数组返回默认值', () => {
    const result = getOverviewStats(null)
    expect(result.total).toBe(0)
    expect(result.pending).toBe(0)
    expect(result.resolved).toBe(0)
    expect(result.averageRating).toBe(0)
  })

  it('正确统计各维度数据', () => {
    const list = [
      makeFeedback({ id: '1', status: FEEDBACK_STATUS.SUBMITTED }),
      makeFeedback({ id: '2', status: FEEDBACK_STATUS.PROCESSING }),
      makeFeedback({ id: '3', status: FEEDBACK_STATUS.RESOLVED, rating: 5 }),
      makeFeedback({ id: '4', status: FEEDBACK_STATUS.RESOLVED, rating: 3 }),
    ]
    const result = getOverviewStats(list)
    expect(result.total).toBe(4)
    expect(result.pending).toBe(2)
    expect(result.resolved).toBe(2)
    expect(result.averageRating).toBe(4.0)
  })

  it('没有评分时平均分为 0', () => {
    const list = [
      makeFeedback({ status: FEEDBACK_STATUS.RESOLVED, rating: null }),
    ]
    const result = getOverviewStats(list)
    expect(result.averageRating).toBe(0)
  })
})

describe('getCategoryTrendData', () => {
  it('非数组输入时正常处理', () => {
    const result = getCategoryTrendData(null)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(TREND_DAYS)
  })

  it('返回 TREND_DAYS 天的数据', () => {
    const result = getCategoryTrendData([])
    expect(result.length).toBe(TREND_DAYS)
    result.forEach((day) => {
      expect(typeof day.date).toBe('string')
      Object.values(FEEDBACK_CATEGORIES).forEach((cat) => {
        expect(typeof day[cat]).toBe('number')
      })
    })
  })

  it('正确统计各分类每天的数量', () => {
    const now = Date.now()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = today.getTime() - 24 * 60 * 60 * 1000

    const list = [
      makeFeedback({ category: FEEDBACK_CATEGORIES.BUG, createdAt: now }),
      makeFeedback({ category: FEEDBACK_CATEGORIES.BUG, createdAt: now }),
      makeFeedback({ category: FEEDBACK_CATEGORIES.FEATURE, createdAt: now }),
      makeFeedback({ category: FEEDBACK_CATEGORIES.BUG, createdAt: yesterday + 1000 }),
    ]
    const result = getCategoryTrendData(list)
    const todayKey = formatDateOnly(today.getTime())
    const yesterdayKey = formatDateOnly(yesterday)

    const todayData = result.find((d) => d.date === todayKey)
    const yesterdayData = result.find((d) => d.date === yesterdayKey)

    expect(todayData[FEEDBACK_CATEGORIES.BUG]).toBe(2)
    expect(todayData[FEEDBACK_CATEGORIES.FEATURE]).toBe(1)
    expect(yesterdayData[FEEDBACK_CATEGORIES.BUG]).toBe(1)
  })

  it('按分类筛选正确', () => {
    const now = Date.now()
    const list = [
      makeFeedback({ category: FEEDBACK_CATEGORIES.BUG, createdAt: now }),
      makeFeedback({ category: FEEDBACK_CATEGORIES.FEATURE, createdAt: now }),
    ]
    const result = getCategoryTrendData(list, FEEDBACK_CATEGORIES.BUG)
    const todayKey = formatDateOnly(now)
    const todayData = result.find((d) => d.date === todayKey)
    expect(todayData[FEEDBACK_CATEGORIES.BUG]).toBe(1)
    expect(todayData[FEEDBACK_CATEGORIES.FEATURE]).toBe(0)
  })

  it('按状态筛选正确', () => {
    const now = Date.now()
    const list = [
      makeFeedback({ category: FEEDBACK_CATEGORIES.BUG, status: FEEDBACK_STATUS.RESOLVED, createdAt: now }),
      makeFeedback({ category: FEEDBACK_CATEGORIES.BUG, status: FEEDBACK_STATUS.SUBMITTED, createdAt: now }),
    ]
    const result = getCategoryTrendData(list, 'all', FEEDBACK_STATUS.RESOLVED)
    const todayKey = formatDateOnly(now)
    const todayData = result.find((d) => d.date === todayKey)
    expect(todayData[FEEDBACK_CATEGORIES.BUG]).toBe(1)
  })

  it('日期格式连续正确', () => {
    const result = getCategoryTrendData([])
    for (let i = 1; i < result.length; i++) {
      const prev = new Date(result[i - 1].date).getTime()
      const curr = new Date(result[i].date).getTime()
      expect(curr - prev).toBe(24 * 60 * 60 * 1000)
    }
  })
})

describe('STATUS_TRANSITIONS 常量完整性', () => {
  it('所有状态都在流转映射中', () => {
    Object.values(FEEDBACK_STATUS).forEach((st) => {
      expect(Object.keys(STATUS_TRANSITIONS)).toContain(st)
    })
  })

  it('流转符合 已提交 -> 处理中 -> 已解决', () => {
    expect(STATUS_TRANSITIONS[FEEDBACK_STATUS.SUBMITTED]).toBe(FEEDBACK_STATUS.PROCESSING)
    expect(STATUS_TRANSITIONS[FEEDBACK_STATUS.PROCESSING]).toBe(FEEDBACK_STATUS.RESOLVED)
    expect(STATUS_TRANSITIONS[FEEDBACK_STATUS.RESOLVED]).toBe(null)
  })
})
