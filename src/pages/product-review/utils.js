import {
  STORAGE_KEY,
  VOTES_STORAGE_KEY,
  MOCK_REVIEWS,
  SORT_OPTIONS,
  FILTER_RATINGS,
  PAGE_SIZE,
  MAX_IMAGES,
  CURRENT_USER,
} from './constants'

export function generateId(prefix = 'r') {
  return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function loadReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {}
  return [...MOCK_REVIEWS]
}

export function saveReviews(reviews) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
    return true
  } catch {
    return false
  }
}

export function loadVotes() {
  try {
    const raw = localStorage.getItem(VOTES_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {}
  return {}
}

export function saveVotes(votes) {
  try {
    localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votes))
    return true
  } catch {
    return false
  }
}

export function validateReview(data) {
  const errors = {}
  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.rating = '请选择 1-5 星评分'
  }
  if (!data.content || data.content.trim().length === 0) {
    errors.content = '评价内容不能为空'
  } else if (data.content.trim().length > 500) {
    errors.content = '评价内容不能超过 500 个字符'
  }
  if (data.images && data.images.length > MAX_IMAGES) {
    errors.images = `最多只能上传 ${MAX_IMAGES} 张图片`
  }
  return errors
}

export function createReview(reviews, data) {
  const errors = validateReview(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const newReview = {
    id: generateId('r'),
    userId: CURRENT_USER,
    username: data.username || '我',
    rating: data.rating,
    content: data.content.trim(),
    images: data.images || [],
    createdAt: Date.now(),
    usefulCount: 0,
    uselessCount: 0,
    followUps: [],
    merchantReply: null,
  }
  const updated = [newReview, ...reviews]
  return { success: true, review: newReview, reviews: updated }
}

export function calculateRatingStats(reviews) {
  if (!reviews || reviews.length === 0) {
    return {
      average: 0,
      total: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    }
  }
  const total = reviews.length
  let sum = 0
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  for (const r of reviews) {
    sum += r.rating
    distribution[r.rating] = (distribution[r.rating] || 0) + 1
  }
  const average = sum / total
  const percentages = {}
  for (let i = 1; i <= 5; i++) {
    percentages[i] = Math.round((distribution[i] / total) * 100)
  }
  return { average, total, distribution, percentages }
}

export function filterByRating(reviews, rating) {
  if (!rating || rating === FILTER_RATINGS.ALL) {
    return reviews
  }
  return reviews.filter((r) => r.rating === Number(rating))
}

export function sortReviews(reviews, sortOption) {
  const result = [...reviews]
  switch (sortOption) {
    case SORT_OPTIONS.NEWEST:
      return result.sort((a, b) => b.createdAt - a.createdAt)
    case SORT_OPTIONS.OLDEST:
      return result.sort((a, b) => a.createdAt - b.createdAt)
    case SORT_OPTIONS.MOST_USEFUL:
      return result.sort((a, b) => b.usefulCount - a.usefulCount)
    default:
      return result
  }
}

export function paginateReviews(reviews, page, pageSize = PAGE_SIZE) {
  const totalPage = Math.max(1, Math.ceil(reviews.length / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: reviews.slice(start, end),
    total: reviews.length,
    totalPage,
    currentPage,
    pageSize,
  }
}

export function getReviewList(reviews, options = {}) {
  let result = [...reviews]
  result = filterByRating(result, options.rating)
  result = sortReviews(result, options.sort)
  const pagination = paginateReviews(result, options.page || 1, options.pageSize)
  return pagination
}

export function hasUserVoted(votes, userId, reviewId) {
  const key = `${userId}_${reviewId}`
  return votes[key] !== undefined
}

export function getUserVote(votes, userId, reviewId) {
  const key = `${userId}_${reviewId}`
  return votes[key] || null
}

export function castVote(reviews, votes, userId, reviewId, voteType) {
  const key = `${userId}_${reviewId}`
  if (votes[key] !== undefined) {
    return { success: false, error: '已投票，不能重复投票', reviews, votes }
  }
  if (voteType !== 'useful' && voteType !== 'useless') {
    return { success: false, error: '无效的投票类型', reviews, votes }
  }
  const reviewIndex = reviews.findIndex((r) => r.id === reviewId)
  if (reviewIndex === -1) {
    return { success: false, error: '评价不存在', reviews, votes }
  }
  const updatedReviews = [...reviews]
  const review = { ...updatedReviews[reviewIndex] }
  if (voteType === 'useful') {
    review.usefulCount = (review.usefulCount || 0) + 1
  } else {
    review.uselessCount = (review.uselessCount || 0) + 1
  }
  updatedReviews[reviewIndex] = review
  const updatedVotes = { ...votes, [key]: voteType }
  return { success: true, reviews: updatedReviews, votes: updatedVotes }
}

export function addFollowUp(reviews, reviewId, content) {
  if (!content || content.trim().length === 0) {
    return { success: false, error: '追评内容不能为空', reviews }
  }
  if (content.trim().length > 500) {
    return { success: false, error: '追评内容不能超过 500 个字符', reviews }
  }
  const reviewIndex = reviews.findIndex((r) => r.id === reviewId)
  if (reviewIndex === -1) {
    return { success: false, error: '评价不存在', reviews }
  }
  const updatedReviews = [...reviews]
  const review = { ...updatedReviews[reviewIndex] }
  const followUp = {
    id: generateId('f'),
    content: content.trim(),
    createdAt: Date.now(),
  }
  review.followUps = [...(review.followUps || []), followUp]
  updatedReviews[reviewIndex] = review
  return { success: true, reviews: updatedReviews, followUp }
}

export function addMerchantReply(reviews, reviewId, content) {
  if (!content || content.trim().length === 0) {
    return { success: false, error: '回复内容不能为空', reviews }
  }
  if (content.trim().length > 500) {
    return { success: false, error: '回复内容不能超过 500 个字符', reviews }
  }
  const reviewIndex = reviews.findIndex((r) => r.id === reviewId)
  if (reviewIndex === -1) {
    return { success: false, error: '评价不存在', reviews }
  }
  const updatedReviews = [...reviews]
  const review = { ...updatedReviews[reviewIndex] }
  review.merchantReply = {
    content: content.trim(),
    createdAt: Date.now(),
  }
  updatedReviews[reviewIndex] = review
  return { success: true, reviews: updatedReviews, reply: review.merchantReply }
}

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'))
      return
    }
    if (!file.type || !file.type.startsWith('image/')) {
      reject(new Error('File must be an image'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function formatDate(timestamp) {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export function formatRatingOneDecimal(average) {
  return Number(average).toFixed(1)
}
