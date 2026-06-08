import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  WRONG_ANSWER_HINT,
  generateId,
  createQuestion,
  validateQuestion,
  loadQuestions,
  saveQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  filterQuestions,
  paginateQuestions,
  generateExam,
  loadExamDraft,
  saveExamDraft,
  clearExamDraft,
  gradeQuestion,
  gradeExam,
  loadExamHistory,
  saveExamHistory,
  addExamRecord,
  formatDuration,
  formatDate,
  getUserAnswerDisplay,
  getCorrectAnswerDisplay,
} from '../../exam/examCore'

describe('QUESTION_TYPES', () => {
  it('should contain 3 question types', () => {
    expect(Object.keys(QUESTION_TYPES)).toHaveLength(3)
    expect(QUESTION_TYPES.SINGLE).toBe('single')
    expect(QUESTION_TYPES.MULTIPLE).toBe('multiple')
    expect(QUESTION_TYPES.FILL).toBe('fill')
  })
})

describe('QUESTION_TYPE_LABELS', () => {
  it('should map types to Chinese labels', () => {
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.SINGLE]).toBe('单选题')
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.MULTIPLE]).toBe('多选题')
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.FILL]).toBe('填空题')
  })
})

describe('WRONG_ANSWER_HINT', () => {
  it('should be a non-empty string', () => {
    expect(typeof WRONG_ANSWER_HINT).toBe('string')
    expect(WRONG_ANSWER_HINT.length).toBeGreaterThan(0)
  })
})

describe('generateId', () => {
  it('should generate string ids with prefix', () => {
    const id = generateId('test')
    expect(typeof id).toBe('string')
    expect(id.startsWith('test_')).toBe(true)
  })

  it('should generate unique ids', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i += 1) {
      ids.add(generateId('q'))
    }
    expect(ids.size).toBe(100)
  })

  it('should use default prefix "id"', () => {
    const id = generateId()
    expect(id.startsWith('id_')).toBe(true)
  })
})

describe('createQuestion', () => {
  it('should create a single choice question by default', () => {
    const q = createQuestion()
    expect(q.id).toBeDefined()
    expect(q.type).toBe(QUESTION_TYPES.SINGLE)
    expect(q.stem).toBe('')
    expect(q.score).toBe(5)
    expect(Array.isArray(q.options)).toBe(true)
    expect(q.options).toHaveLength(4)
    expect(q.options[0]).toEqual({ label: 'A', value: 'A', text: '' })
    expect(q.answer).toBe('')
  })

  it('should create a single choice question explicitly', () => {
    const q = createQuestion(QUESTION_TYPES.SINGLE)
    expect(q.type).toBe(QUESTION_TYPES.SINGLE)
    expect(q.options).toHaveLength(4)
    expect(typeof q.answer).toBe('string')
  })

  it('should create a multiple choice question', () => {
    const q = createQuestion(QUESTION_TYPES.MULTIPLE)
    expect(q.type).toBe(QUESTION_TYPES.MULTIPLE)
    expect(q.options).toHaveLength(4)
    expect(Array.isArray(q.answer)).toBe(true)
    expect(q.answer).toEqual([])
  })

  it('should create a fill-in-the-blank question', () => {
    const q = createQuestion(QUESTION_TYPES.FILL)
    expect(q.type).toBe(QUESTION_TYPES.FILL)
    expect(q.options).toBeUndefined()
    expect(q.answer).toBe('')
  })
})

describe('validateQuestion', () => {
  it('should reject null question', () => {
    expect(validateQuestion(null).valid).toBe(false)
  })

  it('should reject question with empty stem', () => {
    const q = createQuestion(QUESTION_TYPES.SINGLE)
    expect(validateQuestion(q).valid).toBe(false)
  })

  it('should reject question with score <= 0', () => {
    const q = { ...createQuestion(QUESTION_TYPES.SINGLE), stem: 'Test', score: 0 }
    expect(validateQuestion(q).valid).toBe(false)
  })

  it('should reject single choice without options', () => {
    const q = { ...createQuestion(QUESTION_TYPES.SINGLE), stem: 'Test', options: [] }
    expect(validateQuestion(q).valid).toBe(false)
  })

  it('should reject single choice without filled options', () => {
    const q = {
      ...createQuestion(QUESTION_TYPES.SINGLE),
      stem: 'Test',
      options: [
        { label: 'A', value: 'A', text: '' },
        { label: 'B', value: 'B', text: '' },
      ],
    }
    expect(validateQuestion(q).valid).toBe(false)
  })

  it('should reject single choice without answer', () => {
    const q = {
      ...createQuestion(QUESTION_TYPES.SINGLE),
      stem: 'Test',
      options: [
        { label: 'A', value: 'A', text: 'Option A' },
        { label: 'B', value: 'B', text: 'Option B' },
      ],
      answer: '',
    }
    expect(validateQuestion(q).valid).toBe(false)
  })

  it('should accept valid single choice question', () => {
    const q = {
      ...createQuestion(QUESTION_TYPES.SINGLE),
      stem: 'What is 1+1?',
      options: [
        { label: 'A', value: 'A', text: '1' },
        { label: 'B', value: 'B', text: '2' },
        { label: 'C', value: 'C', text: '3' },
        { label: 'D', value: 'D', text: '4' },
      ],
      answer: 'B',
    }
    expect(validateQuestion(q).valid).toBe(true)
  })

  it('should reject multiple choice without answer', () => {
    const q = {
      ...createQuestion(QUESTION_TYPES.MULTIPLE),
      stem: 'Test',
      options: [
        { label: 'A', value: 'A', text: 'Option A' },
        { label: 'B', value: 'B', text: 'Option B' },
      ],
      answer: [],
    }
    expect(validateQuestion(q).valid).toBe(false)
  })

  it('should accept valid multiple choice question', () => {
    const q = {
      ...createQuestion(QUESTION_TYPES.MULTIPLE),
      stem: 'Which are prime numbers?',
      options: [
        { label: 'A', value: 'A', text: '2' },
        { label: 'B', value: 'B', text: '4' },
        { label: 'C', value: 'C', text: '3' },
      ],
      answer: ['A', 'C'],
    }
    expect(validateQuestion(q).valid).toBe(true)
  })

  it('should reject fill question with empty answer', () => {
    const q = { ...createQuestion(QUESTION_TYPES.FILL), stem: 'Test', answer: '' }
    expect(validateQuestion(q).valid).toBe(false)
  })

  it('should accept valid fill question', () => {
    const q = {
      ...createQuestion(QUESTION_TYPES.FILL),
      stem: 'Capital of France?',
      answer: 'Paris',
    }
    expect(validateQuestion(q).valid).toBe(true)
  })
})

describe('question CRUD array operations', () => {
  it('addQuestion should add to empty list', () => {
    const q = createQuestion(QUESTION_TYPES.SINGLE)
    expect(addQuestion(null, q)).toEqual([q])
    expect(addQuestion([], q)).toEqual([q])
  })

  it('addQuestion should append to existing list', () => {
    const q1 = createQuestion(QUESTION_TYPES.SINGLE)
    const q2 = createQuestion(QUESTION_TYPES.FILL)
    const result = addQuestion([q1], q2)
    expect(result).toHaveLength(2)
    expect(result[1].id).toBe(q2.id)
  })

  it('updateQuestion should update matching question', () => {
    const q1 = { ...createQuestion(QUESTION_TYPES.SINGLE), stem: 'Old' }
    const q2 = createQuestion(QUESTION_TYPES.FILL)
    const result = updateQuestion([q1, q2], q1.id, { stem: 'New' })
    expect(result[0].stem).toBe('New')
    expect(result[1].id).toBe(q2.id)
  })

  it('updateQuestion should handle invalid input', () => {
    expect(updateQuestion(null, 'x', {})).toEqual([])
  })

  it('deleteQuestion should remove by id', () => {
    const q1 = createQuestion(QUESTION_TYPES.SINGLE)
    const q2 = createQuestion(QUESTION_TYPES.FILL)
    const result = deleteQuestion([q1, q2], q1.id)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(q2.id)
  })

  it('deleteQuestion should handle invalid input', () => {
    expect(deleteQuestion(null, 'x')).toEqual([])
  })
})

describe('filterQuestions', () => {
  const q1 = { ...createQuestion(QUESTION_TYPES.SINGLE), stem: 'What is React?' }
  const q2 = { ...createQuestion(QUESTION_TYPES.MULTIPLE), stem: 'Vue features' }
  const q3 = { ...createQuestion(QUESTION_TYPES.FILL), stem: 'React hooks' }
  const questions = [q1, q2, q3]

  it('should return all without filters', () => {
    expect(filterQuestions(questions)).toHaveLength(3)
  })

  it('should filter by type', () => {
    expect(filterQuestions(questions, { type: QUESTION_TYPES.SINGLE })).toHaveLength(1)
    expect(filterQuestions(questions, { type: QUESTION_TYPES.MULTIPLE })).toHaveLength(1)
  })

  it('should filter by keyword (case insensitive)', () => {
    expect(filterQuestions(questions, { keyword: 'react' })).toHaveLength(2)
    expect(filterQuestions(questions, { keyword: 'VUE' })).toHaveLength(1)
  })

  it('should combine type and keyword filters', () => {
    const result = filterQuestions(questions, {
      type: QUESTION_TYPES.FILL,
      keyword: 'react',
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(q3.id)
  })

  it('should handle invalid input', () => {
    expect(filterQuestions(null)).toEqual([])
  })
})

describe('paginateQuestions', () => {
  const questions = Array.from({ length: 23 }, (_, i) => ({
    ...createQuestion(QUESTION_TYPES.SINGLE),
    stem: `Q${i}`,
  }))

  it('should paginate correctly', () => {
    const result = paginateQuestions(questions, 1, 10)
    expect(result.items).toHaveLength(10)
    expect(result.total).toBe(23)
    expect(result.totalPages).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
  })

  it('should handle last page', () => {
    const result = paginateQuestions(questions, 3, 10)
    expect(result.items).toHaveLength(3)
    expect(result.page).toBe(3)
  })

  it('should clamp out of range page', () => {
    const result = paginateQuestions(questions, 99, 10)
    expect(result.page).toBe(3)
  })

  it('should handle empty list', () => {
    const result = paginateQuestions([], 1, 10)
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(1)
  })

  it('should handle invalid input', () => {
    const result = paginateQuestions(null)
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
  })
})

function createMockLocalStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value))
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}

describe('question localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('loadQuestions should return empty array when nothing stored', () => {
    expect(loadQuestions()).toEqual([])
  })

  it('saveQuestions and loadQuestions should round trip', () => {
    const q = createQuestion(QUESTION_TYPES.SINGLE)
    expect(saveQuestions([q])).toBe(true)
    const loaded = loadQuestions()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe(q.id)
  })

  it('loadQuestions should return empty for invalid JSON', () => {
    mockStorage.setItem('exam_questions', 'not json')
    expect(loadQuestions()).toEqual([])
  })

  it('loadQuestions should return empty for non-array data', () => {
    mockStorage.setItem('exam_questions', JSON.stringify({ foo: 1 }))
    expect(loadQuestions()).toEqual([])
  })

  it('should handle localStorage throws', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('fail')
        },
        setItem: () => {
          throw new Error('fail')
        },
      },
    })
    expect(loadQuestions()).toEqual([])
    expect(saveQuestions([])).toBe(false)
  })
})

describe('exam draft localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('loadExamDraft should return null when empty', () => {
    expect(loadExamDraft('exam1')).toBe(null)
  })

  it('saveExamDraft and loadExamDraft should round trip', () => {
    const answers = { q1: 'A' }
    expect(saveExamDraft('exam1', { answers })).toBe(true)
    const loaded = loadExamDraft('exam1')
    expect(loaded.answers).toEqual(answers)
    expect(typeof loaded.savedAt).toBe('number')
  })

  it('clearExamDraft should remove draft', () => {
    saveExamDraft('exam1', { answers: {} })
    expect(clearExamDraft('exam1')).toBe(true)
    expect(loadExamDraft('exam1')).toBe(null)
  })

  it('should handle localStorage throws', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('fail')
        },
        setItem: () => {
          throw new Error('fail')
        },
        removeItem: () => {
          throw new Error('fail')
        },
      },
    })
    expect(loadExamDraft('x')).toBe(null)
    expect(saveExamDraft('x', {})).toBe(false)
    expect(clearExamDraft('x')).toBe(false)
  })
})

describe('exam history localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('loadExamHistory should return empty when nothing stored', () => {
    expect(loadExamHistory()).toEqual([])
  })

  it('saveExamHistory and loadExamHistory should work', () => {
    const record = { id: 'r1', examName: 'Test', score: 80 }
    expect(saveExamHistory([record])).toBe(true)
    expect(loadExamHistory()).toHaveLength(1)
  })

  it('addExamRecord should append record', () => {
    const r1 = { id: 'r1' }
    const r2 = { id: 'r2' }
    expect(addExamRecord([r1], r2)).toEqual([r1, r2])
    expect(addExamRecord(null, r1)).toEqual([r1])
  })

  it('should handle localStorage throws', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('fail')
        },
        setItem: () => {
          throw new Error('fail')
        },
      },
    })
    expect(loadExamHistory()).toEqual([])
    expect(saveExamHistory([])).toBe(false)
  })
})

describe('generateExam', () => {
  const baseQ = (score, type = QUESTION_TYPES.SINGLE) => ({
    ...createQuestion(type),
    stem: `Question with ${score} points`,
    score,
    options: [
      { label: 'A', value: 'A', text: 'A' },
      { label: 'B', value: 'B', text: 'B' },
    ],
    answer: type === QUESTION_TYPES.MULTIPLE ? ['A'] : 'A',
  })

  it('should fail with empty question bank', () => {
    const result = generateExam([], { name: 'Test', totalScore: 100 })
    expect(result.ok).toBe(false)
  })

  it('should fail when bank total is less than target', () => {
    const questions = [baseQ(5), baseQ(5)]
    const result = generateExam(questions, { name: 'Test', totalScore: 100 })
    expect(result.ok).toBe(false)
    expect(result.message).toContain('不足')
  })

  it('should generate exam with score approximately matching target', () => {
    const questions = []
    for (let i = 0; i < 20; i += 1) {
      questions.push(baseQ(5))
    }
    for (let i = 0; i < 10; i += 1) {
      questions.push(baseQ(10))
    }
    const result = generateExam(questions, { name: 'Midterm', duration: 60, totalScore: 100 })
    expect(result.ok).toBe(true)
    expect(result.exam.name).toBe('Midterm')
    expect(result.exam.duration).toBe(60)
    expect(result.exam.questions.length).toBeGreaterThan(0)
    const totalScore = result.exam.questions.reduce((s, q) => s + q.score, 0)
    expect(totalScore).toBeGreaterThanOrEqual(90)
    expect(totalScore).toBeLessThanOrEqual(105)
  })

  it('should generate exam with default params', () => {
    const questions = [baseQ(5), baseQ(5), baseQ(5), baseQ(5)]
    const result = generateExam(questions, { totalScore: 15 })
    expect(result.ok).toBe(true)
    expect(typeof result.exam.name).toBe('string')
    expect(result.exam.id).toBeDefined()
  })
})

describe('gradeQuestion', () => {
  it('should return 0 for null question', () => {
    expect(gradeQuestion(null, 'A')).toEqual({ score: 0, correct: false })
  })

  it('should grade single choice correctly', () => {
    const q = { type: QUESTION_TYPES.SINGLE, answer: 'B', score: 10 }
    expect(gradeQuestion(q, 'B')).toEqual({ score: 10, correct: true })
    expect(gradeQuestion(q, 'A')).toEqual({ score: 0, correct: false })
    expect(gradeQuestion(q, undefined)).toEqual({ score: 0, correct: false })
  })

  it('should grade multiple choice correctly (exact match)', () => {
    const q = { type: QUESTION_TYPES.MULTIPLE, answer: ['A', 'C'], score: 10 }
    expect(gradeQuestion(q, ['A', 'C'])).toEqual({ score: 10, correct: true })
    expect(gradeQuestion(q, ['C', 'A'])).toEqual({ score: 10, correct: true })
    expect(gradeQuestion(q, ['A'])).toEqual({ score: 0, correct: false })
    expect(gradeQuestion(q, ['A', 'B', 'C'])).toEqual({ score: 0, correct: false })
    expect(gradeQuestion(q, [])).toEqual({ score: 0, correct: false })
  })

  it('should grade fill-in correctly (exact string match, trimmed)', () => {
    const q = { type: QUESTION_TYPES.FILL, answer: 'Paris', score: 5 }
    expect(gradeQuestion(q, 'Paris')).toEqual({ score: 5, correct: true })
    expect(gradeQuestion(q, ' Paris ')).toEqual({ score: 5, correct: true })
    expect(gradeQuestion(q, 'paris')).toEqual({ score: 0, correct: false })
    expect(gradeQuestion(q, '')).toEqual({ score: 0, correct: false })
    expect(gradeQuestion(q, undefined)).toEqual({ score: 0, correct: false })
  })
})

describe('gradeExam', () => {
  it('should handle invalid input', () => {
    const result = gradeExam(null, {})
    expect(result.totalScore).toBe(0)
    expect(result.maxScore).toBe(0)
    expect(result.results).toEqual([])
  })

  it('should grade entire exam correctly', () => {
    const exam = {
      questions: [
        { id: 'q1', type: QUESTION_TYPES.SINGLE, answer: 'A', score: 10, stem: 'Q1' },
        { id: 'q2', type: QUESTION_TYPES.MULTIPLE, answer: ['B', 'C'], score: 10, stem: 'Q2' },
        { id: 'q3', type: QUESTION_TYPES.FILL, answer: 'Hello', score: 10, stem: 'Q3' },
      ],
    }
    const answers = {
      q1: 'A',
      q2: ['B', 'C'],
      q3: 'Hello',
    }
    const result = gradeExam(exam, answers)
    expect(result.totalScore).toBe(30)
    expect(result.maxScore).toBe(30)
    expect(result.results.every((r) => r.correct)).toBe(true)
    expect(result.results.every((r) => r.hint === '')).toBe(true)
  })

  it('should include hint for wrong answers', () => {
    const exam = {
      questions: [
        { id: 'q1', type: QUESTION_TYPES.SINGLE, answer: 'A', score: 10, stem: 'Q1' },
      ],
    }
    const result = gradeExam(exam, { q1: 'B' })
    expect(result.totalScore).toBe(0)
    expect(result.results[0].correct).toBe(false)
    expect(result.results[0].hint).toBe(WRONG_ANSWER_HINT)
  })
})

describe('formatDuration', () => {
  it('should handle 0 and negative', () => {
    expect(formatDuration(0)).toBe('0分0秒')
    expect(formatDuration(-5)).toBe('0分0秒')
  })

  it('should format correctly', () => {
    expect(formatDuration(65)).toBe('1分5秒')
    expect(formatDuration(3661)).toBe('61分1秒')
  })
})

describe('formatDate', () => {
  it('should handle falsy', () => {
    expect(formatDate(0)).toBe('')
    expect(formatDate(null)).toBe('')
  })

  it('should format date string', () => {
    const ts = new Date('2024-01-15T10:30:00').getTime()
    const result = formatDate(ts)
    expect(result).toContain('2024')
    expect(result).toContain('01')
    expect(result).toContain('15')
  })
})

describe('getUserAnswerDisplay and getCorrectAnswerDisplay', () => {
  const singleQ = {
    type: QUESTION_TYPES.SINGLE,
    options: [
      { label: 'A', value: 'A', text: 'Apple' },
      { label: 'B', value: 'B', text: 'Banana' },
    ],
    answer: 'A',
  }

  const multiQ = {
    type: QUESTION_TYPES.MULTIPLE,
    options: [
      { label: 'A', value: 'A', text: 'Apple' },
      { label: 'B', value: 'B', text: 'Banana' },
    ],
    answer: ['A', 'B'],
  }

  const fillQ = { type: QUESTION_TYPES.FILL, answer: 'Paris' }

  it('should display empty for unanswered single', () => {
    expect(getUserAnswerDisplay(singleQ, undefined)).toBe('（未作答）')
    expect(getUserAnswerDisplay(singleQ, '')).toBe('（未作答）')
  })

  it('should display single choice user answer', () => {
    expect(getUserAnswerDisplay(singleQ, 'A')).toContain('A. Apple')
  })

  it('should display multiple choice user answer', () => {
    expect(getUserAnswerDisplay(multiQ, ['A', 'B'])).toContain('A. Apple')
    expect(getUserAnswerDisplay(multiQ, ['A', 'B'])).toContain('B. Banana')
    expect(getUserAnswerDisplay(multiQ, [])).toBe('（未作答）')
  })

  it('should display fill user answer', () => {
    expect(getUserAnswerDisplay(fillQ, 'Paris')).toBe('Paris')
  })

  it('should display correct answer for single', () => {
    expect(getCorrectAnswerDisplay(singleQ)).toContain('A. Apple')
  })

  it('should display correct answer for multiple', () => {
    expect(getCorrectAnswerDisplay(multiQ)).toContain('A. Apple')
    expect(getCorrectAnswerDisplay(multiQ)).toContain('B. Banana')
  })

  it('should display correct answer for fill', () => {
    expect(getCorrectAnswerDisplay(fillQ)).toBe('Paris')
  })

  it('should handle null question', () => {
    expect(getUserAnswerDisplay(null, 'x')).toBe('')
    expect(getCorrectAnswerDisplay(null)).toBe('')
  })
})
