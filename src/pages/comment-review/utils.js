import {
  COMMENTS_STORAGE_KEY,
  REVIEW_RECORDS_STORAGE_KEY,
  SENSITIVE_WORDS_STORAGE_KEY,
  COMMENT_STATUS,
  REVIEW_RESULT_OPTIONS,
  PAGE_SIZE,
  MOCK_COMMENTS,
  MOCK_SENSITIVE_WORDS,
  SENSITIVE_LEVEL,
  REJECT_REASON_LABEL,
} from './constants'

export function generateId(prefix = 'id') {
  return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
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

export function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function loadComments() {
  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {}
  return [...MOCK_COMMENTS]
}

export function saveComments(comments) {
  try {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments))
    return true
  } catch {
    return false
  }
}

export function loadReviewRecords() {
  try {
    const raw = localStorage.getItem(REVIEW_RECORDS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {}
  return []
}

export function saveReviewRecords(records) {
  try {
    localStorage.setItem(REVIEW_RECORDS_STORAGE_KEY, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}

export function loadSensitiveWords() {
  try {
    const raw = localStorage.getItem(SENSITIVE_WORDS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {}
  return [...MOCK_SENSITIVE_WORDS]
}

export function saveSensitiveWords(words) {
  try {
    localStorage.setItem(SENSITIVE_WORDS_STORAGE_KEY, JSON.stringify(words))
    return true
  } catch {
    return false
  }
}

export function matchSensitiveWords(content, sensitiveWords) {
  if (!content || !sensitiveWords || sensitiveWords.length === 0) {
    return { matched: false, words: [], hasHighLevel: false }
  }
  const matched = []
  for (const sw of sensitiveWords) {
    if (!sw.word) continue
    const lowerContent = content.toLowerCase()
    const lowerWord = sw.word.toLowerCase()
    if (lowerContent.includes(lowerWord)) {
      matched.push(sw)
    }
  }
  const hasHighLevel = matched.some((w) => w.level === SENSITIVE_LEVEL.HIGH)
  return {
    matched: matched.length > 0,
    words: matched,
    hasHighLevel,
  }
}

export function highlightSensitiveWords(content, sensitiveWords) {
  if (!content || !sensitiveWords || sensitiveWords.length === 0) {
    return content
  }
  const uniqueWords = Array.from(new Set(sensitiveWords.map((w) => w.word))).sort(
    (a, b) => b.length - a.length
  )
  if (uniqueWords.length === 0) return content
  const pattern = uniqueWords.map(escapeRegExp).join('|')
  const regex = new RegExp(`(${pattern})`, 'gi')
  return content.replace(regex, '|||HIGHLIGHT|||$1|||/HIGHLIGHT|||')
}

export function paginate(items, page, pageSize = PAGE_SIZE) {
  const totalPage = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: items.slice(start, end),
    total: items.length,
    totalPage,
    currentPage,
    pageSize,
  }
}

export function getPendingComments(comments) {
  return comments.filter((c) => c.status === COMMENT_STATUS.PENDING)
}

export function getReviewedComments(comments) {
  return comments.filter(
    (c) => c.status === COMMENT_STATUS.APPROVED || c.status === COMMENT_STATUS.REJECTED
  )
}

export function sortByCreatedAtDesc(comments) {
  return [...comments].sort((a, b) => b.createdAt - a.createdAt)
}

export function sortByReviewedAtDesc(comments) {
  return [...comments].sort((a, b) => (b.reviewedAt || 0) - (a.reviewedAt || 0))
}

export function sortByCreatedAtAsc(comments) {
  return [...comments].sort((a, b) => a.createdAt - b.createdAt)
}

export function getPendingList(comments, options = {}) {
  let result = getPendingComments(comments)
  result = sortByCreatedAtDesc(result)
  return paginate(result, options.page || 1, options.pageSize || PAGE_SIZE)
}

export function filterReviewed(comments, options = {}) {
  let result = getReviewedComments(comments)
  if (options.result && options.result !== REVIEW_RESULT_OPTIONS.ALL) {
    result = result.filter((c) => c.status === options.result)
  }
  if (options.rejectReason) {
    result = result.filter((c) => c.rejectReason === options.rejectReason)
  }
  if (options.startDate) {
    const startTs = new Date(options.startDate).setHours(0, 0, 0, 0)
    result = result.filter((c) => c.reviewedAt && c.reviewedAt >= startTs)
  }
  if (options.endDate) {
    const endTs = new Date(options.endDate).setHours(23, 59, 59, 999)
    result = result.filter((c) => c.reviewedAt && c.reviewedAt <= endTs)
  }
  return result
}

export function getReviewedList(comments, options = {}) {
  let result = filterReviewed(comments, options)
  result = sortByReviewedAtDesc(result)
  return paginate(result, options.page || 1, options.pageSize || PAGE_SIZE)
}

export function approveComment(comments, commentId, records = []) {
  const idx = comments.findIndex((c) => c.id === commentId)
  if (idx === -1) {
    return { success: false, error: '评论不存在', comments, records }
  }
  if (comments[idx].status !== COMMENT_STATUS.PENDING) {
    return { success: false, error: '评论状态不是待审核', comments, records }
  }
  const now = Date.now()
  const updatedComments = [...comments]
  updatedComments[idx] = {
    ...updatedComments[idx],
    status: COMMENT_STATUS.APPROVED,
    reviewedAt: now,
  }
  const newRecord = {
    id: generateId('rr'),
    commentId,
    result: COMMENT_STATUS.APPROVED,
    rejectReason: null,
    rejectReasonDetail: null,
    reviewedAt: now,
  }
  const updatedRecords = [...records, newRecord]
  return { success: true, comments: updatedComments, records: updatedRecords }
}

export function rejectComment(comments, commentId, rejectReason, rejectReasonDetail, records = []) {
  if (!rejectReason) {
    return { success: false, error: '请选择驳回原因', comments, records }
  }
  const idx = comments.findIndex((c) => c.id === commentId)
  if (idx === -1) {
    return { success: false, error: '评论不存在', comments, records }
  }
  if (comments[idx].status !== COMMENT_STATUS.PENDING) {
    return { success: false, error: '评论状态不是待审核', comments, records }
  }
  const now = Date.now()
  const updatedComments = [...comments]
  updatedComments[idx] = {
    ...updatedComments[idx],
    status: COMMENT_STATUS.REJECTED,
    reviewedAt: now,
    rejectReason,
    rejectReasonDetail: rejectReasonDetail || null,
  }
  const newRecord = {
    id: generateId('rr'),
    commentId,
    result: COMMENT_STATUS.REJECTED,
    rejectReason,
    rejectReasonDetail: rejectReasonDetail || null,
    reviewedAt: now,
  }
  const updatedRecords = [...records, newRecord]
  return { success: true, comments: updatedComments, records: updatedRecords }
}

export function deleteComment(comments, commentId) {
  const idx = comments.findIndex((c) => c.id === commentId)
  if (idx === -1) {
    return { success: false, error: '评论不存在', comments }
  }
  const updatedComments = comments.filter((c) => c.id !== commentId)
  return { success: true, comments: updatedComments }
}

export function batchApproveComments(comments, ids, records = []) {
  if (!ids || ids.length === 0) {
    return { success: false, error: '未选择评论', comments, records }
  }
  const now = Date.now()
  let updatedCount = 0
  const updatedComments = comments.map((c) => {
    if (ids.includes(c.id) && c.status === COMMENT_STATUS.PENDING) {
      updatedCount++
      return { ...c, status: COMMENT_STATUS.APPROVED, reviewedAt: now }
    }
    return c
  })
  const newRecords = []
  for (const id of ids) {
    const original = comments.find((c) => c.id === id)
    if (original && original.status === COMMENT_STATUS.PENDING) {
      newRecords.push({
        id: generateId('rr'),
        commentId: id,
        result: COMMENT_STATUS.APPROVED,
        rejectReason: null,
        rejectReasonDetail: null,
        reviewedAt: now,
      })
    }
  }
  if (updatedCount === 0) {
    return { success: false, error: '没有可审核的评论', comments, records }
  }
  return {
    success: true,
    updatedCount,
    comments: updatedComments,
    records: [...records, ...newRecords],
  }
}

export function batchRejectComments(comments, ids, rejectReason, rejectReasonDetail, records = []) {
  if (!ids || ids.length === 0) {
    return { success: false, error: '未选择评论', comments, records }
  }
  if (!rejectReason) {
    return { success: false, error: '请选择驳回原因', comments, records }
  }
  const now = Date.now()
  let updatedCount = 0
  const updatedComments = comments.map((c) => {
    if (ids.includes(c.id) && c.status === COMMENT_STATUS.PENDING) {
      updatedCount++
      return {
        ...c,
        status: COMMENT_STATUS.REJECTED,
        reviewedAt: now,
        rejectReason,
        rejectReasonDetail: rejectReasonDetail || null,
      }
    }
    return c
  })
  const newRecords = []
  for (const id of ids) {
    const original = comments.find((c) => c.id === id)
    if (original && original.status === COMMENT_STATUS.PENDING) {
      newRecords.push({
        id: generateId('rr'),
        commentId: id,
        result: COMMENT_STATUS.REJECTED,
        rejectReason,
        rejectReasonDetail: rejectReasonDetail || null,
        reviewedAt: now,
      })
    }
  }
  if (updatedCount === 0) {
    return { success: false, error: '没有可审核的评论', comments, records }
  }
  return {
    success: true,
    updatedCount,
    comments: updatedComments,
    records: [...records, ...newRecords],
  }
}

export function batchDeleteComments(comments, ids) {
  if (!ids || ids.length === 0) {
    return { success: false, error: '未选择评论', comments }
  }
  const updatedComments = comments.filter((c) => !ids.includes(c.id))
  const deletedCount = comments.length - updatedComments.length
  if (deletedCount === 0) {
    return { success: false, error: '没有可删除的评论', comments }
  }
  return { success: true, deletedCount, comments: updatedComments }
}

export function addSensitiveWord(words, word, level) {
  if (!word || !word.trim()) {
    return { success: false, error: '敏感词不能为空', words }
  }
  const trimmedWord = word.trim()
  if (words.some((w) => w.word.toLowerCase() === trimmedWord.toLowerCase())) {
    return { success: false, error: '该敏感词已存在', words }
  }
  if (!level || !Object.values(SENSITIVE_LEVEL).includes(level)) {
    return { success: false, error: '请选择正确的敏感等级', words }
  }
  const newWord = {
    id: generateId('sw'),
    word: trimmedWord,
    level,
    createdAt: Date.now(),
  }
  return { success: true, word: newWord, words: [newWord, ...words] }
}

export function deleteSensitiveWord(words, wordId) {
  const idx = words.findIndex((w) => w.id === wordId)
  if (idx === -1) {
    return { success: false, error: '敏感词不存在', words }
  }
  const updatedWords = words.filter((w) => w.id !== wordId)
  return { success: true, words: updatedWords }
}

export function filterSensitiveWords(words, keyword) {
  if (!keyword || !keyword.trim()) {
    return words
  }
  const lowerKw = keyword.trim().toLowerCase()
  return words.filter((w) => w.word.toLowerCase().includes(lowerKw))
}

export function sortSensitiveWords(words) {
  return [...words].sort((a, b) => b.createdAt - a.createdAt)
}

export function getRejectReasonDisplay(reasonKey, detail) {
  if (!reasonKey) return ''
  const label = REJECT_REASON_LABEL[reasonKey] || reasonKey
  if (detail) {
    return `${label}：${detail}`
  }
  return label
}

export function getSensitiveWordList(words, keyword = '') {
  let result = filterSensitiveWords(words, keyword)
  result = sortSensitiveWords(result)
  return result
}
