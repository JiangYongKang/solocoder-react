import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  generateId,
  validateReview,
  createReview,
  calculateRatingStats,
  filterByRating,
  sortReviews,
  paginateReviews,
  getReviewList,
  hasUserVoted,
  getUserVote,
  castVote,
  addFollowUp,
  addMerchantReply,
  formatDate,
  formatRatingOneDecimal,
  loadReviews,
  saveReviews,
  loadVotes,
  saveVotes,
} from '../../product-review/utils'
import {
  STORAGE_KEY,
  VOTES_STORAGE_KEY,
  MOCK_REVIEWS,
  SORT_OPTIONS,
  FILTER_RATINGS,
  MAX_IMAGES,
  CURRENT_USER,
} from '../../product-review/constants'

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

describe('generateId', () => {
  it('生成的ID包含前缀', () => {
    expect(generateId('r')).toMatch(/^r_/)
    expect(generateId('f')).toMatch(/^f_/)
  })

  it('默认前缀为 r', () => {
    expect(generateId()).toMatch(/^r_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('validateReview', () => {
  it('验证通过时返回空对象', () => {
    const errors = validateReview({ rating: 5, content: '很好', images: [] })
    expect(Object.keys(errors).length).toBe(0)
  })

  it('未评分时报错', () => {
    const errors = validateReview({ content: '很好' })
    expect(errors.rating).toBeTruthy()
  })

  it('评分小于1时报错', () => {
    const errors = validateReview({ rating: 0, content: '很好' })
    expect(errors.rating).toBeTruthy()
  })

  it('评分大于5时报错', () => {
    const errors = validateReview({ rating: 6, content: '很好' })
    expect(errors.rating).toBeTruthy()
  })

  it('内容为空时报错', () => {
    const errors = validateReview({ rating: 5, content: '' })
    expect(errors.content).toBeTruthy()
  })

  it('内容全空格时报错', () => {
    const errors = validateReview({ rating: 5, content: '   ' })
    expect(errors.content).toBeTruthy()
  })

  it('内容超过500字符时报错', () => {
    const errors = validateReview({ rating: 5, content: 'a'.repeat(501) })
    expect(errors.content).toBeTruthy()
  })

  it('图片超过最大数量时报错', () => {
    const images = Array.from({ length: MAX_IMAGES + 1 }, (_, i) => `img_${i}`)
    const errors = validateReview({ rating: 5, content: '很好', images })
    expect(errors.images).toBeTruthy()
  })

  it('图片数量不超过最大数量时不报错', () => {
    const images = Array.from({ length: MAX_IMAGES }, (_, i) => `img_${i}`)
    const errors = validateReview({ rating: 5, content: '很好', images })
    expect(errors.images).toBeFalsy()
  })
})

describe('createReview', () => {
  it('数据无效时返回失败', () => {
    const result = createReview([], { content: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功创建评价并返回新列表', () => {
    const data = { rating: 5, content: '非常好的商品', username: '测试用户', images: [] }
    const result = createReview([], data)
    expect(result.success).toBe(true)
    expect(result.review.id).toBeTruthy()
    expect(result.review.rating).toBe(5)
    expect(result.review.content).toBe('非常好的商品')
    expect(result.review.username).toBe('测试用户')
    expect(result.review.createdAt).toBeTruthy()
    expect(result.review.usefulCount).toBe(0)
    expect(result.review.uselessCount).toBe(0)
    expect(result.review.followUps).toEqual([])
    expect(result.review.merchantReply).toBeNull()
    expect(result.reviews.length).toBe(1)
    expect(result.reviews[0]).toBe(result.review)
  })

  it('新评价放在列表最前面', () => {
    const existing = [{ id: 'old', content: '旧评价' }]
    const result = createReview(existing, { rating: 4, content: '新评价' })
    expect(result.reviews[0].id).toBe(result.review.id)
    expect(result.reviews[1].id).toBe('old')
  })

  it('默认用户名为"我"', () => {
    const result = createReview([], { rating: 5, content: '很好' })
    expect(result.review.username).toBe('我')
    expect(result.review.userId).toBe(CURRENT_USER)
  })
})

describe('calculateRatingStats', () => {
  it('空列表时返回默认值', () => {
    const stats = calculateRatingStats([])
    expect(stats.average).toBe(0)
    expect(stats.total).toBe(0)
    expect(stats.distribution).toEqual({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })
    expect(stats.percentages).toEqual({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })
  })

  it('正确计算平均分和分布', () => {
    const reviews = [
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
      { rating: 3 },
      { rating: 1 },
    ]
    const stats = calculateRatingStats(reviews)
    expect(stats.total).toBe(5)
    expect(stats.average).toBe(3.6)
    expect(stats.distribution[5]).toBe(2)
    expect(stats.distribution[4]).toBe(1)
    expect(stats.distribution[3]).toBe(1)
    expect(stats.distribution[2]).toBe(0)
    expect(stats.distribution[1]).toBe(1)
  })

  it('正确计算百分比', () => {
    const reviews = [
      { rating: 5 },
      { rating: 5 },
      { rating: 5 },
      { rating: 5 },
      { rating: 5 },
    ]
    const stats = calculateRatingStats(reviews)
    expect(stats.percentages[5]).toBe(100)
    expect(stats.percentages[4]).toBe(0)
  })
})

describe('filterByRating', () => {
  const reviews = [
    { id: '1', rating: 5 },
    { id: '2', rating: 4 },
    { id: '3', rating: 5 },
    { id: '4', rating: 3 },
    { id: '5', rating: 1 },
  ]

  it('all 或空值返回全部', () => {
    expect(filterByRating(reviews, FILTER_RATINGS.ALL).length).toBe(5)
    expect(filterByRating(reviews, '').length).toBe(5)
  })

  it('按指定评分筛选', () => {
    const result = filterByRating(reviews, 5)
    expect(result.length).toBe(2)
    expect(result.every((r) => r.rating === 5)).toBe(true)
  })

  it('字符串数字也能正确筛选', () => {
    const result = filterByRating(reviews, '5')
    expect(result.length).toBe(2)
  })
})

describe('sortReviews', () => {
  const reviews = [
    { id: '1', createdAt: 1000, usefulCount: 5 },
    { id: '2', createdAt: 3000, usefulCount: 2 },
    { id: '3', createdAt: 2000, usefulCount: 10 },
  ]

  it('默认返回原顺序', () => {
    const result = sortReviews(reviews, null)
    expect(result.map((r) => r.id)).toEqual(['1', '2', '3'])
  })

  it('按最新排序（时间降序）', () => {
    const result = sortReviews(reviews, SORT_OPTIONS.NEWEST)
    expect(result.map((r) => r.id)).toEqual(['2', '3', '1'])
  })

  it('按最早排序（时间升序）', () => {
    const result = sortReviews(reviews, SORT_OPTIONS.OLDEST)
    expect(result.map((r) => r.id)).toEqual(['1', '3', '2'])
  })

  it('按有用数排序', () => {
    const result = sortReviews(reviews, SORT_OPTIONS.MOST_USEFUL)
    expect(result.map((r) => r.id)).toEqual(['3', '1', '2'])
  })

  it('不修改原数组', () => {
    const original = [...reviews]
    sortReviews(reviews, SORT_OPTIONS.NEWEST)
    expect(reviews).toEqual(original)
  })
})

describe('paginateReviews', () => {
  const reviews = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }))

  it('第一页正确', () => {
    const result = paginateReviews(reviews, 1, 10)
    expect(result.items.length).toBe(10)
    expect(result.items[0].id).toBe('1')
    expect(result.items[9].id).toBe('10')
    expect(result.currentPage).toBe(1)
    expect(result.totalPage).toBe(3)
    expect(result.total).toBe(25)
  })

  it('最后一页正确', () => {
    const result = paginateReviews(reviews, 3, 10)
    expect(result.items.length).toBe(5)
    expect(result.currentPage).toBe(3)
  })

  it('页码超出范围时修正', () => {
    const result = paginateReviews(reviews, 100, 10)
    expect(result.currentPage).toBe(3)
  })

  it('页码小于1时修正', () => {
    const result = paginateReviews(reviews, 0, 10)
    expect(result.currentPage).toBe(1)
  })

  it('空列表返回第一页', () => {
    const result = paginateReviews([], 1, 10)
    expect(result.items.length).toBe(0)
    expect(result.totalPage).toBe(1)
  })
})

describe('getReviewList', () => {
  const reviews = [
    { id: '1', rating: 5, createdAt: 100, usefulCount: 3 },
    { id: '2', rating: 4, createdAt: 300, usefulCount: 1 },
    { id: '3', rating: 5, createdAt: 200, usefulCount: 5 },
    { id: '4', rating: 3, createdAt: 400, usefulCount: 2 },
  ]

  it('组合筛选、排序、分页', () => {
    const result = getReviewList(reviews, {
      rating: 5,
      sort: SORT_OPTIONS.MOST_USEFUL,
      page: 1,
      pageSize: 10,
    })
    expect(result.items.length).toBe(2)
    expect(result.items[0].id).toBe('3')
    expect(result.items[1].id).toBe('1')
  })

  it('无选项时返回全部', () => {
    const result = getReviewList(reviews, {})
    expect(result.items.length).toBe(4)
  })
})

describe('vote functions', () => {
  const reviews = [
    { id: 'r1', usefulCount: 0, uselessCount: 0 },
  ]

  it('hasUserVoted 未投票时返回 false', () => {
    expect(hasUserVoted({}, 'user1', 'r1')).toBe(false)
  })

  it('hasUserVoted 已投票时返回 true', () => {
    const votes = { user1_r1: 'useful' }
    expect(hasUserVoted(votes, 'user1', 'r1')).toBe(true)
  })

  it('getUserVote 未投票时返回 null', () => {
    expect(getUserVote({}, 'user1', 'r1')).toBeNull()
  })

  it('getUserVote 已投票时返回投票类型', () => {
    const votes = { user1_r1: 'useful' }
    expect(getUserVote(votes, 'user1', 'r1')).toBe('useful')
  })

  it('castVote 成功投有用', () => {
    const result = castVote(reviews, {}, 'user1', 'r1', 'useful')
    expect(result.success).toBe(true)
    expect(result.reviews[0].usefulCount).toBe(1)
    expect(result.reviews[0].uselessCount).toBe(0)
    expect(result.votes.user1_r1).toBe('useful')
  })

  it('castVote 成功投无用', () => {
    const result = castVote(reviews, {}, 'user1', 'r1', 'useless')
    expect(result.success).toBe(true)
    expect(result.reviews[0].uselessCount).toBe(1)
  })

  it('castVote 重复投票失败', () => {
    const votes = { user1_r1: 'useful' }
    const result = castVote(reviews, votes, 'user1', 'r1', 'useless')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('castVote 无效投票类型失败', () => {
    const result = castVote(reviews, {}, 'user1', 'r1', 'invalid')
    expect(result.success).toBe(false)
  })

  it('castVote 评价不存在时失败', () => {
    const result = castVote(reviews, {}, 'user1', 'not-exist', 'useful')
    expect(result.success).toBe(false)
  })
})

describe('addFollowUp', () => {
  const reviews = [
    { id: 'r1', followUps: [] },
  ]

  it('内容为空时失败', () => {
    const result = addFollowUp(reviews, 'r1', '')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('内容超过500字符时失败', () => {
    const result = addFollowUp(reviews, 'r1', 'a'.repeat(501))
    expect(result.success).toBe(false)
  })

  it('评价不存在时失败', () => {
    const result = addFollowUp(reviews, 'not-exist', '追评内容')
    expect(result.success).toBe(false)
  })

  it('成功添加追评', () => {
    const result = addFollowUp(reviews, 'r1', '这是追评内容')
    expect(result.success).toBe(true)
    expect(result.reviews[0].followUps.length).toBe(1)
    expect(result.reviews[0].followUps[0].content).toBe('这是追评内容')
    expect(result.reviews[0].followUps[0].createdAt).toBeTruthy()
    expect(result.followUp).toBeTruthy()
  })

  it('支持多条追评', () => {
    let result = addFollowUp(reviews, 'r1', '第一条追评')
    result = addFollowUp(result.reviews, 'r1', '第二条追评')
    expect(result.reviews[0].followUps.length).toBe(2)
  })
})

describe('addMerchantReply', () => {
  const reviews = [
    { id: 'r1', merchantReply: null },
  ]

  it('内容为空时失败', () => {
    const result = addMerchantReply(reviews, 'r1', '')
    expect(result.success).toBe(false)
  })

  it('内容超过500字符时失败', () => {
    const result = addMerchantReply(reviews, 'r1', 'a'.repeat(501))
    expect(result.success).toBe(false)
  })

  it('评价不存在时失败', () => {
    const result = addMerchantReply(reviews, 'not-exist', '回复')
    expect(result.success).toBe(false)
  })

  it('成功添加商家回复', () => {
    const result = addMerchantReply(reviews, 'r1', '感谢您的评价')
    expect(result.success).toBe(true)
    expect(result.reviews[0].merchantReply.content).toBe('感谢您的评价')
    expect(result.reviews[0].merchantReply.createdAt).toBeTruthy()
  })

  it('覆盖之前的商家回复', () => {
    let result = addMerchantReply(reviews, 'r1', '第一次回复')
    result = addMerchantReply(result.reviews, 'r1', '第二次回复')
    expect(result.reviews[0].merchantReply.content).toBe('第二次回复')
  })
})

describe('formatDate', () => {
  it('格式化时间戳为日期字符串', () => {
    const ts = new Date('2024-01-15T10:30:00').getTime()
    const result = formatDate(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(result).toContain('2024')
    expect(result).toContain('10:30')
  })
})

describe('formatRatingOneDecimal', () => {
  it('保留一位小数', () => {
    expect(formatRatingOneDecimal(4.567)).toBe('4.6')
    expect(formatRatingOneDecimal(5)).toBe('5.0')
    expect(formatRatingOneDecimal(0)).toBe('0.0')
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveReviews 保存到 localStorage', () => {
    const reviews = [{ id: '1', content: 'test' }]
    const result = saveReviews(reviews)
    expect(result).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(reviews))
  })

  it('loadReviews 从 localStorage 读取', () => {
    const reviews = [{ id: '1', content: 'test' }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
    const result = loadReviews()
    expect(result).toEqual(reviews)
  })

  it('loadReviews localStorage 为空时返回 mock 数据', () => {
    const result = loadReviews()
    expect(result.length).toBe(MOCK_REVIEWS.length)
  })

  it('loadReviews localStorage 数据损坏时返回 mock 数据', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json')
    const result = loadReviews()
    expect(result.length).toBe(MOCK_REVIEWS.length)
  })

  it('saveVotes 保存投票记录', () => {
    const votes = { user1_r1: 'useful' }
    const result = saveVotes(votes)
    expect(result).toBe(true)
    expect(localStorage.getItem(VOTES_STORAGE_KEY)).toBe(JSON.stringify(votes))
  })

  it('loadVotes 从 localStorage 读取', () => {
    const votes = { user1_r1: 'useful' }
    localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votes))
    const result = loadVotes()
    expect(result).toEqual(votes)
  })

  it('loadVotes localStorage 为空时返回空对象', () => {
    expect(loadVotes()).toEqual({})
  })
})
