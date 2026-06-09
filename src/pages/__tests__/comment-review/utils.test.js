import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  generateId,
  formatDate,
  escapeRegExp,
  loadComments,
  saveComments,
  loadReviewRecords,
  saveReviewRecords,
  loadSensitiveWords,
  saveSensitiveWords,
  matchSensitiveWords,
  highlightSensitiveWords,
  paginate,
  getPendingComments,
  getReviewedComments,
  sortByCreatedAtDesc,
  sortByCreatedAtAsc,
  sortByReviewedAtDesc,
  getPendingList,
  filterReviewed,
  getReviewedList,
  approveComment,
  rejectComment,
  deleteComment,
  batchApproveComments,
  batchRejectComments,
  batchDeleteComments,
  addSensitiveWord,
  deleteSensitiveWord,
  filterSensitiveWords,
  sortSensitiveWords,
  getRejectReasonDisplay,
  getSensitiveWordList,
} from '../../comment-review/utils'
import {
  COMMENTS_STORAGE_KEY,
  REVIEW_RECORDS_STORAGE_KEY,
  SENSITIVE_WORDS_STORAGE_KEY,
  COMMENT_STATUS,
  REVIEW_RESULT_OPTIONS,
  SENSITIVE_LEVEL,
  REJECT_REASON_LABEL,
  PAGE_SIZE,
  MOCK_COMMENTS,
  MOCK_SENSITIVE_WORDS,
} from '../../comment-review/constants'

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

function makeComment(overrides = {}) {
  return {
    id: generateId('cmt'),
    content: 'test content',
    username: 'testuser',
    articleTitle: 'Test Article',
    status: COMMENT_STATUS.PENDING,
    createdAt: Date.now(),
    reviewedAt: null,
    rejectReason: null,
    rejectReasonDetail: null,
    ...overrides,
  }
}

describe('generateId', () => {
  it('generates ID with prefix', () => {
    expect(generateId('cmt')).toMatch(/^cmt_/)
    expect(generateId('sw')).toMatch(/^sw_/)
  })

  it('generates unique IDs', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('formatDate', () => {
  it('formats timestamp to date string', () => {
    const ts = new Date('2024-01-15T10:30:00').getTime()
    const result = formatDate(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(result).toContain('2024')
    expect(result).toContain('10:30')
  })
})

describe('escapeRegExp', () => {
  it('escapes regex special characters', () => {
    expect(escapeRegExp('a.b')).toBe('a\\.b')
    expect(escapeRegExp('foo*bar')).toBe('foo\\*bar')
    expect(escapeRegExp('(test)')).toBe('\\(test\\)')
  })

  it('returns normal characters unchanged', () => {
    expect(escapeRegExp('hello')).toBe('hello')
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveComments stores to localStorage', () => {
    const comments = [{ id: '1', content: 'test' }]
    const result = saveComments(comments)
    expect(result).toBe(true)
    expect(localStorage.getItem(COMMENTS_STORAGE_KEY)).toBe(JSON.stringify(comments))
  })

  it('loadComments reads from localStorage', () => {
    const comments = [{ id: '1', content: 'test' }]
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments))
    const result = loadComments()
    expect(result).toEqual(comments)
  })

  it('loadComments returns mock data when empty', () => {
    const result = loadComments()
    expect(result.length).toBe(MOCK_COMMENTS.length)
  })

  it('loadComments returns mock data on invalid JSON', () => {
    localStorage.setItem(COMMENTS_STORAGE_KEY, 'invalid')
    const result = loadComments()
    expect(result.length).toBe(MOCK_COMMENTS.length)
  })

  it('saveReviewRecords stores to localStorage', () => {
    const records = [{ id: '1' }]
    const result = saveReviewRecords(records)
    expect(result).toBe(true)
    expect(localStorage.getItem(REVIEW_RECORDS_STORAGE_KEY)).toBe(JSON.stringify(records))
  })

  it('loadReviewRecords returns empty array when empty', () => {
    expect(loadReviewRecords()).toEqual([])
  })

  it('saveSensitiveWords stores to localStorage', () => {
    const words = [{ id: '1', word: 'test' }]
    const result = saveSensitiveWords(words)
    expect(result).toBe(true)
    expect(localStorage.getItem(SENSITIVE_WORDS_STORAGE_KEY)).toBe(JSON.stringify(words))
  })

  it('loadSensitiveWords returns mock data when empty', () => {
    const result = loadSensitiveWords()
    expect(result.length).toBe(MOCK_SENSITIVE_WORDS.length)
  })
})

describe('matchSensitiveWords', () => {
  const words = [
    { id: '1', word: '傻子', level: SENSITIVE_LEVEL.MEDIUM },
    { id: '2', word: '色情', level: SENSITIVE_LEVEL.HIGH },
    { id: '3', word: '广告', level: SENSITIVE_LEVEL.LOW },
  ]

  it('returns no match for empty content', () => {
    const result = matchSensitiveWords('', words)
    expect(result.matched).toBe(false)
    expect(result.words).toEqual([])
    expect(result.hasHighLevel).toBe(false)
  })

  it('returns no match for empty words list', () => {
    const result = matchSensitiveWords('some content', [])
    expect(result.matched).toBe(false)
    expect(result.words).toEqual([])
  })

  it('matches single sensitive word', () => {
    const result = matchSensitiveWords('这个人是傻子吗', words)
    expect(result.matched).toBe(true)
    expect(result.words.length).toBe(1)
    expect(result.words[0].word).toBe('傻子')
    expect(result.hasHighLevel).toBe(false)
  })

  it('matches multiple sensitive words', () => {
    const result = matchSensitiveWords('傻子和色情内容', words)
    expect(result.matched).toBe(true)
    expect(result.words.length).toBe(2)
    expect(result.hasHighLevel).toBe(true)
  })

  it('matches case insensitively', () => {
    const lowerWords = [{ id: '1', word: 'BuyCheap', level: SENSITIVE_LEVEL.LOW }]
    const result = matchSensitiveWords('buycheap is here', lowerWords)
    expect(result.matched).toBe(true)
  })

  it('detects high level correctly', () => {
    const result = matchSensitiveWords('contains 色情 here', words)
    expect(result.hasHighLevel).toBe(true)
  })

  it('does not have high level when only medium/low', () => {
    const result = matchSensitiveWords('傻子 here', words)
    expect(result.hasHighLevel).toBe(false)
  })
})

describe('highlightSensitiveWords', () => {
  const words = [
    { id: '1', word: '傻子', level: SENSITIVE_LEVEL.MEDIUM },
    { id: '2', word: '色情', level: SENSITIVE_LEVEL.HIGH },
  ]

  it('returns content unchanged when no words', () => {
    expect(highlightSensitiveWords('hello world', [])).toBe('hello world')
  })

  it('returns content unchanged when no match', () => {
    expect(highlightSensitiveWords('hello world', words)).toBe('hello world')
  })

  it('wraps matched words', () => {
    const result = highlightSensitiveWords('傻子来了', words)
    expect(result).toContain('|||HIGHLIGHT|||傻子|||/HIGHLIGHT|||')
  })

  it('handles empty content', () => {
    expect(highlightSensitiveWords('', words)).toBe('')
  })

  it('handles multiple matches', () => {
    const result = highlightSensitiveWords('傻子和色情都有', words)
    expect(result).toContain('|||HIGHLIGHT|||傻子|||/HIGHLIGHT|||')
    expect(result).toContain('|||HIGHLIGHT|||色情|||/HIGHLIGHT|||')
  })

  it('prioritizes longer matches', () => {
    const testWords = [
      { id: '1', word: '傻子' },
      { id: '2', word: '傻子来了' },
    ]
    const result = highlightSensitiveWords('傻子来了', testWords)
    expect(result).toContain('傻子来了')
  })
})

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }))

  it('paginates first page correctly', () => {
    const result = paginate(items, 1, 10)
    expect(result.items.length).toBe(10)
    expect(result.items[0].id).toBe('1')
    expect(result.currentPage).toBe(1)
    expect(result.totalPage).toBe(3)
    expect(result.total).toBe(25)
  })

  it('paginates last page correctly', () => {
    const result = paginate(items, 3, 10)
    expect(result.items.length).toBe(5)
    expect(result.currentPage).toBe(3)
  })

  it('clamps page number to valid range', () => {
    expect(paginate(items, 100, 10).currentPage).toBe(3)
    expect(paginate(items, 0, 10).currentPage).toBe(1)
  })

  it('handles empty list', () => {
    const result = paginate([], 1, 10)
    expect(result.items.length).toBe(0)
    expect(result.totalPage).toBe(1)
  })

  it('uses default PAGE_SIZE', () => {
    const result = paginate(items, 1)
    expect(result.pageSize).toBe(PAGE_SIZE)
  })
})

describe('comment filtering and sorting', () => {
  const comments = [
    { id: '1', status: COMMENT_STATUS.PENDING, createdAt: 1000, reviewedAt: null },
    { id: '2', status: COMMENT_STATUS.APPROVED, createdAt: 2000, reviewedAt: 5000 },
    { id: '3', status: COMMENT_STATUS.REJECTED, createdAt: 3000, reviewedAt: 4000 },
    { id: '4', status: COMMENT_STATUS.PENDING, createdAt: 4000, reviewedAt: null },
  ]

  it('getPendingComments filters pending only', () => {
    const result = getPendingComments(comments)
    expect(result.length).toBe(2)
    expect(result.every((c) => c.status === COMMENT_STATUS.PENDING)).toBe(true)
  })

  it('getReviewedComments filters reviewed only', () => {
    const result = getReviewedComments(comments)
    expect(result.length).toBe(2)
    expect(result.every((c) => c.status !== COMMENT_STATUS.PENDING)).toBe(true)
  })

  it('sortByCreatedAtDesc sorts descending', () => {
    const result = sortByCreatedAtDesc(comments)
    expect(result.map((c) => c.id)).toEqual(['4', '3', '2', '1'])
  })

  it('sortByCreatedAtAsc sorts ascending', () => {
    const result = sortByCreatedAtAsc(comments)
    expect(result.map((c) => c.id)).toEqual(['1', '2', '3', '4'])
  })

  it('sortByReviewedAtDesc sorts by reviewedAt descending', () => {
    const result = sortByReviewedAtDesc(comments)
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('3')
  })

  it('does not mutate original array', () => {
    const original = [...comments]
    sortByCreatedAtDesc(comments)
    expect(comments).toEqual(original)
  })
})

describe('getPendingList', () => {
  const manyPending = Array.from({ length: 30 }, (_, i) => ({
    id: String(i + 1),
    status: COMMENT_STATUS.PENDING,
    createdAt: 1000 + i * 100,
  }))
  const reviewed = [
    { id: 'r1', status: COMMENT_STATUS.APPROVED, createdAt: 9999 },
  ]
  const all = [...manyPending, ...reviewed]

  it('returns only pending comments paginated', () => {
    const result = getPendingList(all, { page: 1, pageSize: 10 })
    expect(result.items.length).toBe(10)
    expect(result.items.every((c) => c.status === COMMENT_STATUS.PENDING)).toBe(true)
    expect(result.total).toBe(30)
  })

  it('sorts by createdAt descending', () => {
    const result = getPendingList(all, { page: 1, pageSize: 10 })
    expect(result.items[0].createdAt).toBeGreaterThan(result.items[1].createdAt)
  })

  it('defaults to page 1', () => {
    const result = getPendingList(all)
    expect(result.currentPage).toBe(1)
  })
})

describe('filterReviewed', () => {
  const DAY = 86400000
  const baseTs = 1700000000000
  const comments = [
    makeComment({
      id: 'a1',
      status: COMMENT_STATUS.APPROVED,
      reviewedAt: baseTs + DAY * 1,
    }),
    makeComment({
      id: 'a2',
      status: COMMENT_STATUS.REJECTED,
      reviewedAt: baseTs + DAY * 2,
      rejectReason: 'ad',
      rejectReasonDetail: null,
    }),
    makeComment({
      id: 'a3',
      status: COMMENT_STATUS.REJECTED,
      reviewedAt: baseTs + DAY * 3,
      rejectReason: 'attack',
    }),
    makeComment({
      id: 'a4',
      status: COMMENT_STATUS.PENDING,
      reviewedAt: null,
    }),
  ]

  it('filters by result approved', () => {
    const result = filterReviewed(comments, { result: REVIEW_RESULT_OPTIONS.APPROVED })
    expect(result.length).toBe(1)
    expect(result[0].status).toBe(COMMENT_STATUS.APPROVED)
  })

  it('filters by result rejected', () => {
    const result = filterReviewed(comments, { result: REVIEW_RESULT_OPTIONS.REJECTED })
    expect(result.length).toBe(2)
  })

  it('filters by rejectReason', () => {
    const result = filterReviewed(comments, { rejectReason: 'ad' })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('a2')
  })

  it('filters by date range', () => {
    const startDate = new Date(baseTs + DAY * 2 - 1000)
    const endDate = new Date(baseTs + DAY * 2 + 1000)
    const result = filterReviewed(comments, {
      startDate: startDate,
      endDate: endDate,
    })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('a2')
  })

  it('returns empty with no filters', () => {
    const result = filterReviewed(comments, {})
    expect(result.length).toBe(3)
  })
})

describe('getReviewedList', () => {
  it('combines filter, sort, and pagination', () => {
    const DAY = 86400000
    const baseTs = 1700000000000
    const comments = [
      makeComment({ id: 'a1', status: COMMENT_STATUS.APPROVED, reviewedAt: baseTs + DAY * 1 }),
      makeComment({ id: 'a2', status: COMMENT_STATUS.REJECTED, reviewedAt: baseTs + DAY * 2, rejectReason: 'ad' }),
    ]
    const result = getReviewedList(comments, {
      result: REVIEW_RESULT_OPTIONS.REJECTED,
      page: 1,
      pageSize: 10,
    })
    expect(result.items.length).toBe(1)
    expect(result.items[0].id).toBe('a2')
  })
})

describe('approveComment', () => {
  it('approves a pending comment', () => {
    const comment = makeComment({ id: 'c1', status: COMMENT_STATUS.PENDING })
    const comments = [comment]
    const result = approveComment(comments, 'c1', [])
    expect(result.success).toBe(true)
    expect(result.comments[0].status).toBe(COMMENT_STATUS.APPROVED)
    expect(result.comments[0].reviewedAt).toBeTruthy()
    expect(result.records.length).toBe(1)
    expect(result.records[0].result).toBe(COMMENT_STATUS.APPROVED)
  })

  it('fails for non-existent comment', () => {
    const result = approveComment([], 'not-exist', [])
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('fails for already reviewed comment', () => {
    const comment = makeComment({ id: 'c1', status: COMMENT_STATUS.APPROVED })
    const result = approveComment([comment], 'c1', [])
    expect(result.success).toBe(false)
  })

  it('does not mutate original comments', () => {
    const comment = makeComment({ id: 'c1', status: COMMENT_STATUS.PENDING })
    const original = [{ ...comment }]
    approveComment(original, 'c1', [])
    expect(original[0].status).toBe(COMMENT_STATUS.PENDING)
  })
})

describe('rejectComment', () => {
  it('rejects a pending comment with reason', () => {
    const comment = makeComment({ id: 'c1', status: COMMENT_STATUS.PENDING })
    const result = rejectComment([comment], 'c1', 'ad', '包含链接', [])
    expect(result.success).toBe(true)
    expect(result.comments[0].status).toBe(COMMENT_STATUS.REJECTED)
    expect(result.comments[0].rejectReason).toBe('ad')
    expect(result.comments[0].rejectReasonDetail).toBe('包含链接')
    expect(result.records[0].rejectReason).toBe('ad')
  })

  it('rejects without detail when reason is empty', () => {
    const comment = makeComment({ id: 'c1', status: COMMENT_STATUS.PENDING })
    const result = rejectComment([comment], 'c1', 'ad', '', [])
    expect(result.success).toBe(true)
    expect(result.comments[0].rejectReasonDetail).toBe(null)
  })

  it('fails when no reason provided', () => {
    const comment = makeComment({ id: 'c1', status: COMMENT_STATUS.PENDING })
    const result = rejectComment([comment], 'c1', '', null, [])
    expect(result.success).toBe(false)
  })

  it('fails for non-existent comment', () => {
    const result = rejectComment([], 'c1', 'ad', null, [])
    expect(result.success).toBe(false)
  })
})

describe('deleteComment', () => {
  it('deletes a comment', () => {
    const c1 = makeComment({ id: 'c1' })
    const c2 = makeComment({ id: 'c2' })
    const result = deleteComment([c1, c2], 'c1')
    expect(result.success).toBe(true)
    expect(result.comments.length).toBe(1)
    expect(result.comments[0].id).toBe('c2')
  })

  it('fails for non-existent comment', () => {
    const result = deleteComment([], 'not-exist')
    expect(result.success).toBe(false)
  })
})

describe('batchApproveComments', () => {
  const comments = [
    makeComment({ id: 'c1', status: COMMENT_STATUS.PENDING }),
    makeComment({ id: 'c2', status: COMMENT_STATUS.PENDING }),
    makeComment({ id: 'c3', status: COMMENT_STATUS.APPROVED }),
  ]

  it('approves multiple pending comments', () => {
    const result = batchApproveComments(comments, ['c1', 'c2'], [])
    expect(result.success).toBe(true)
    expect(result.updatedCount).toBe(2)
    expect(result.comments.filter((c) => c.status === COMMENT_STATUS.APPROVED).length).toBe(3)
    expect(result.records.length).toBe(2)
  })

  it('fails when no IDs provided', () => {
    const result = batchApproveComments(comments, [], [])
    expect(result.success).toBe(false)
  })

  it('fails when no pending comments match', () => {
    const result = batchApproveComments(comments, ['c3'], [])
    expect(result.success).toBe(false)
  })
})

describe('batchRejectComments', () => {
  const comments = [
    makeComment({ id: 'c1', status: COMMENT_STATUS.PENDING }),
    makeComment({ id: 'c2', status: COMMENT_STATUS.PENDING }),
  ]

  it('rejects multiple pending comments', () => {
    const result = batchRejectComments(comments, ['c1', 'c2'], 'ad', '推广', [])
    expect(result.success).toBe(true)
    expect(result.updatedCount).toBe(2)
    expect(result.comments.every((c) => c.status === COMMENT_STATUS.REJECTED)).toBe(true)
    expect(result.records.length).toBe(2)
  })

  it('fails when no reason', () => {
    const result = batchRejectComments(comments, ['c1'], '', null, [])
    expect(result.success).toBe(false)
  })

  it('fails when no IDs', () => {
    const result = batchRejectComments(comments, [], 'ad', null, [])
    expect(result.success).toBe(false)
  })
})

describe('batchDeleteComments', () => {
  const comments = [
    makeComment({ id: 'c1' }),
    makeComment({ id: 'c2' }),
    makeComment({ id: 'c3' }),
  ]

  it('deletes multiple comments', () => {
    const result = batchDeleteComments(comments, ['c1', 'c2'])
    expect(result.success).toBe(true)
    expect(result.deletedCount).toBe(2)
    expect(result.comments.length).toBe(1)
  })

  it('fails when no IDs', () => {
    const result = batchDeleteComments(comments, [])
    expect(result.success).toBe(false)
  })
})

describe('addSensitiveWord', () => {
  const words = [{ id: '1', word: 'existing', level: SENSITIVE_LEVEL.MEDIUM }]

  it('adds new word', () => {
    const result = addSensitiveWord(words, 'newword', SENSITIVE_LEVEL.LOW)
    expect(result.success).toBe(true)
    expect(result.words.length).toBe(2)
    expect(result.words[0].word).toBe('newword')
    expect(result.words[0].level).toBe(SENSITIVE_LEVEL.LOW)
    expect(result.words[0].createdAt).toBeTruthy()
    expect(result.words[0].id).toBeTruthy()
  })

  it('trims the word', () => {
    const result = addSensitiveWord(words, '  spaced  ', SENSITIVE_LEVEL.LOW)
    expect(result.success).toBe(true)
    expect(result.words[0].word).toBe('spaced')
  })

  it('fails when word is empty', () => {
    const result = addSensitiveWord(words, '', SENSITIVE_LEVEL.LOW)
    expect(result.success).toBe(false)
  })

  it('fails when word is only spaces', () => {
    const result = addSensitiveWord(words, '   ', SENSITIVE_LEVEL.LOW)
    expect(result.success).toBe(false)
  })

  it('fails when word exists (case insensitive', () => {
    const result = addSensitiveWord(words, 'EXISTING', SENSITIVE_LEVEL.LOW)
    expect(result.success).toBe(false)
  })

  it('fails when level is invalid', () => {
    const result = addSensitiveWord(words, 'test', 'invalid')
    expect(result.success).toBe(false)
  })
})

describe('deleteSensitiveWord', () => {
  const words = [
    { id: '1', word: 'test' },
  ]

  it('deletes a word', () => {
    const result = deleteSensitiveWord(words, '1')
    expect(result.success).toBe(true)
    expect(result.words.length).toBe(0)
  })

  it('fails for non-existent', () => {
    const result = deleteSensitiveWord(words, 'not-exist')
    expect(result.success).toBe(false)
  })
})

describe('filterSensitiveWords', () => {
  const words = [
    { id: '1', word: 'advertisement' },
    { id: '2', word: 'pornography' },
    { id: '3', word: 'violence' },
  ]

  it('filters by keyword', () => {
    const result = filterSensitiveWords(words, 'ad')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('filters case insensitively', () => {
    const result = filterSensitiveWords(words, 'AD')
    expect(result.length).toBe(1)
  })

  it('returns all when keyword empty', () => {
    expect(filterSensitiveWords(words, '')).toEqual(words)
  })

  it('returns all when keyword is null', () => {
    expect(filterSensitiveWords(words, null)).toEqual(words)
  })
})

describe('sortSensitiveWords', () => {
  const words = [
    { id: '1', createdAt: 1000 },
    { id: '2', createdAt: 3000 },
    { id: '3', createdAt: 2000 },
  ]

  it('sorts by createdAt descending', () => {
    const result = sortSensitiveWords(words)
    expect(result.map((w) => w.id)).toEqual(['2', '3', '1'])
  })

  it('does not mutate original', () => {
    const original = [...words]
    sortSensitiveWords(words)
    expect(words).toEqual(original)
  })
})

describe('getRejectReasonDisplay', () => {
  it('shows reason with no detail', () => {
    expect(getRejectReasonDisplay('ad', null)).toBe(REJECT_REASON_LABEL.ad)
  })

  it('shows reason with detail', () => {
    expect(getRejectReasonDisplay('ad', 'some detail')).toContain(REJECT_REASON_LABEL.ad)
    expect(getRejectReasonDisplay('ad', 'some detail')).toContain('some detail')
  })

  it('returns empty string for null', () => {
    expect(getRejectReasonDisplay(null, null)).toBe('')
  })
})

describe('getSensitiveWordList', () => {
  const words = [
    { id: '1', word: 'apple', createdAt: 1000 },
    { id: '2', word: 'banana', createdAt: 2000 },
    { id: '3', word: 'cherry', createdAt: 1500 },
  ]

  it('combines filter and sort', () => {
    const result = getSensitiveWordList(words, 'app')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('sorts by createdAt descending', () => {
    const result = getSensitiveWordList(words, '')
    expect(result.map((w) => w.id)).toEqual(['2', '3', '1'])
  })
})
