import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  GRADING_RESULTS,
  GRADING_RESULT_LABELS,
  STUDENT_STATUS,
  STUDENT_STATUS_LABELS,
  FILTER_OPTIONS,
  FILTER_OPTION_LABELS,
  MOCK_QUESTIONS,
  MOCK_STUDENTS,
  generateId,
  generateRandomAnswer,
  generateStudentAnswers,
  autoGradeQuestion,
  createInitialGradingState,
  getQuestionGrade,
  updateQuestionGrade,
  calculateStudentScore,
  isStudentAllGraded,
  updateStudentStatus,
  initStudentStartedAt,
  toggleStudentReview,
  getGradingProgress,
  filterStudents,
  findNextUngradedStudent,
  pickRandomStudentsForReview,
  formatDurationMs,
  formatTimestamp,
  escapeCSVValue,
  generateCSVContent,
  downloadCSV,
  generateCSVFilename,
  getStudentStatusLabel,
  isAutoGradable,
  getDefaultScoreForResult,
} from '../../exam-grading/examGradingCore'

describe('QUESTION_TYPES', () => {
  it('should define single, multiple, and essay types', () => {
    expect(QUESTION_TYPES.SINGLE).toBe('single')
    expect(QUESTION_TYPES.MULTIPLE).toBe('multiple')
    expect(QUESTION_TYPES.ESSAY).toBe('essay')
  })
})

describe('GRADING_RESULTS', () => {
  it('should define correct, wrong, partial, ungraded', () => {
    expect(GRADING_RESULTS.CORRECT).toBe('correct')
    expect(GRADING_RESULTS.WRONG).toBe('wrong')
    expect(GRADING_RESULTS.PARTIAL).toBe('partial')
    expect(GRADING_RESULTS.UNGRADED).toBe('ungraded')
  })
})

describe('STUDENT_STATUS', () => {
  it('should define ungraded, graded, review', () => {
    expect(STUDENT_STATUS.UNGRADED).toBe('ungraded')
    expect(STUDENT_STATUS.GRADED).toBe('graded')
    expect(STUDENT_STATUS.REVIEW).toBe('review')
  })
})

describe('FILTER_OPTIONS', () => {
  it('should define all, graded, ungraded, review', () => {
    expect(FILTER_OPTIONS.ALL).toBe('all')
    expect(FILTER_OPTIONS.GRADED).toBe('graded')
    expect(FILTER_OPTIONS.UNGRADED).toBe('ungraded')
    expect(FILTER_OPTIONS.REVIEW).toBe('review')
  })
})

describe('LABELS constants', () => {
  it('QUESTION_TYPE_LABELS should map correctly', () => {
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.SINGLE]).toBe('单选题')
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.MULTIPLE]).toBe('多选题')
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.ESSAY]).toBe('简答题')
  })

  it('GRADING_RESULT_LABELS should map correctly', () => {
    expect(GRADING_RESULT_LABELS[GRADING_RESULTS.CORRECT]).toBe('对')
    expect(GRADING_RESULT_LABELS[GRADING_RESULTS.WRONG]).toBe('错')
    expect(GRADING_RESULT_LABELS[GRADING_RESULTS.PARTIAL]).toBe('半对')
    expect(GRADING_RESULT_LABELS[GRADING_RESULTS.UNGRADED]).toBe('未评')
  })

  it('STUDENT_STATUS_LABELS should map correctly', () => {
    expect(STUDENT_STATUS_LABELS[STUDENT_STATUS.UNGRADED]).toBe('未阅')
    expect(STUDENT_STATUS_LABELS[STUDENT_STATUS.GRADED]).toBe('已阅')
    expect(STUDENT_STATUS_LABELS[STUDENT_STATUS.REVIEW]).toBe('待复查')
  })

  it('FILTER_OPTION_LABELS should map correctly', () => {
    expect(FILTER_OPTION_LABELS[FILTER_OPTIONS.ALL]).toBe('全部')
    expect(FILTER_OPTION_LABELS[FILTER_OPTIONS.GRADED]).toBe('已阅')
    expect(FILTER_OPTION_LABELS[FILTER_OPTIONS.UNGRADED]).toBe('未阅')
    expect(FILTER_OPTION_LABELS[FILTER_OPTIONS.REVIEW]).toBe('待复查')
  })
})

describe('MOCK_QUESTIONS', () => {
  it('should have 6 questions', () => {
    expect(MOCK_QUESTIONS).toHaveLength(6)
  })

  it('should have single, multiple, and essay questions', () => {
    const types = MOCK_QUESTIONS.map((q) => q.type)
    expect(types).toContain(QUESTION_TYPES.SINGLE)
    expect(types).toContain(QUESTION_TYPES.MULTIPLE)
    expect(types).toContain(QUESTION_TYPES.ESSAY)
  })

  it('each question should have required fields', () => {
    for (const q of MOCK_QUESTIONS) {
      expect(q.id).toBeDefined()
      expect(q.type).toBeDefined()
      expect(q.stem).toBeDefined()
      expect(q.score).toBeGreaterThan(0)
    }
  })
})

describe('MOCK_STUDENTS', () => {
  it('should have 8 students', () => {
    expect(MOCK_STUDENTS).toHaveLength(8)
  })

  it('each student should have id, name, studentNo', () => {
    for (const s of MOCK_STUDENTS) {
      expect(s.id).toBeDefined()
      expect(s.name).toBeDefined()
      expect(s.studentNo).toBeDefined()
    }
  })
})

describe('generateId', () => {
  it('should generate unique ids with prefix', () => {
    const ids = new Set()
    for (let i = 0; i < 50; i++) {
      ids.add(generateId('test'))
    }
    expect(ids.size).toBe(50)
  })

  it('should start with the given prefix', () => {
    expect(generateId('abc').startsWith('abc_')).toBe(true)
  })
})

describe('generateRandomAnswer', () => {
  it('should return null for null question', () => {
    expect(generateRandomAnswer(null)).toBe(null)
  })

  it('should generate a single choice answer from options', () => {
    const q = {
      type: QUESTION_TYPES.SINGLE,
      options: [
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
      ],
    }
    const answer = generateRandomAnswer(q)
    expect(['A', 'B']).toContain(answer)
  })

  it('should return empty string for single choice with no options', () => {
    const q = { type: QUESTION_TYPES.SINGLE, options: [] }
    expect(generateRandomAnswer(q)).toBe('')
  })

  it('should generate a multiple choice answer (array)', () => {
    const q = {
      type: QUESTION_TYPES.MULTIPLE,
      options: [
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
        { label: 'C', value: 'C' },
      ],
    }
    const answer = generateRandomAnswer(q)
    expect(Array.isArray(answer)).toBe(true)
    expect(answer.length).toBeGreaterThanOrEqual(1)
  })

  it('should return empty array for multiple choice with no options', () => {
    const q = { type: QUESTION_TYPES.MULTIPLE, options: [] }
    expect(generateRandomAnswer(q)).toEqual([])
  })

  it('should generate an essay answer (string)', () => {
    const q = { type: QUESTION_TYPES.ESSAY }
    const answer = generateRandomAnswer(q)
    expect(typeof answer).toBe('string')
  })
})

describe('generateStudentAnswers', () => {
  it('should return empty object for non-array input', () => {
    expect(generateStudentAnswers(null)).toEqual({})
    expect(generateStudentAnswers('invalid')).toEqual({})
  })

  it('should generate answer for each question', () => {
    const questions = [
      { id: 'q1', type: QUESTION_TYPES.SINGLE, options: [{ label: 'A', value: 'A' }], score: 5 },
      { id: 'q2', type: QUESTION_TYPES.ESSAY, score: 10 },
    ]
    const answers = generateStudentAnswers(questions)
    expect(answers.q1).toBeDefined()
    expect(answers.q2).toBeDefined()
  })
})

describe('autoGradeQuestion', () => {
  it('should return UNGRADED for null question', () => {
    const result = autoGradeQuestion(null, 'A')
    expect(result.result).toBe(GRADING_RESULTS.UNGRADED)
    expect(result.score).toBe(0)
  })

  it('should grade single choice correctly', () => {
    const q = { type: QUESTION_TYPES.SINGLE, answer: 'C', score: 5 }
    expect(autoGradeQuestion(q, 'C')).toEqual({ result: GRADING_RESULTS.CORRECT, score: 5 })
    expect(autoGradeQuestion(q, 'A')).toEqual({ result: GRADING_RESULTS.WRONG, score: 0 })
  })

  it('should grade multiple choice correctly', () => {
    const q = { type: QUESTION_TYPES.MULTIPLE, answer: ['A', 'B', 'C'], score: 10 }
    expect(autoGradeQuestion(q, ['A', 'B', 'C'])).toEqual({ result: GRADING_RESULTS.CORRECT, score: 10 })
    expect(autoGradeQuestion(q, ['C', 'B', 'A'])).toEqual({ result: GRADING_RESULTS.CORRECT, score: 10 })
    expect(autoGradeQuestion(q, ['A', 'B'])).toEqual({ result: GRADING_RESULTS.WRONG, score: 0 })
  })

  it('should return UNGRADED for essay questions', () => {
    const q = { type: QUESTION_TYPES.ESSAY, score: 20 }
    expect(autoGradeQuestion(q, 'some answer')).toEqual({ result: GRADING_RESULTS.UNGRADED, score: 0 })
  })
})

describe('createInitialGradingState', () => {
  it('should create grading entry for each student', () => {
    const students = [
      { id: 's1', name: 'A', studentNo: '001' },
      { id: 's2', name: 'B', studentNo: '002' },
    ]
    const state = createInitialGradingState(MOCK_QUESTIONS, students)
    expect(state.s1).toBeDefined()
    expect(state.s2).toBeDefined()
  })

  it('should set initial status to UNGRADED', () => {
    const students = [{ id: 's1', name: 'A', studentNo: '001' }]
    const state = createInitialGradingState(MOCK_QUESTIONS, students)
    expect(state.s1.status).toBe(STUDENT_STATUS.UNGRADED)
    expect(state.s1.needsReview).toBe(false)
    expect(state.s1.completedAt).toBe(null)
  })

  it('should auto-grade choice questions', () => {
    const students = [{ id: 's1', name: 'A', studentNo: '001' }]
    const state = createInitialGradingState(MOCK_QUESTIONS, students)
    for (const q of MOCK_QUESTIONS) {
      const grade = state.s1.questionGrades[q.id]
      expect(grade).toBeDefined()
      if (isAutoGradable(q)) {
        expect([GRADING_RESULTS.CORRECT, GRADING_RESULTS.WRONG]).toContain(grade.result)
      } else {
        expect(grade.result).toBe(GRADING_RESULTS.UNGRADED)
      }
    }
  })
})

describe('getQuestionGrade', () => {
  const state = {
    s1: {
      questionGrades: {
        q1: { result: GRADING_RESULTS.CORRECT, score: 5, comment: '' },
      },
    },
  }

  it('should return grade for valid student and question', () => {
    expect(getQuestionGrade(state, 's1', 'q1')).toEqual({
      result: GRADING_RESULTS.CORRECT,
      score: 5,
      comment: '',
    })
  })

  it('should return null for missing student', () => {
    expect(getQuestionGrade(state, 's2', 'q1')).toBe(null)
  })

  it('should return null for missing question', () => {
    expect(getQuestionGrade(state, 's1', 'q999')).toBe(null)
  })

  it('should return null for null state', () => {
    expect(getQuestionGrade(null, 's1', 'q1')).toBe(null)
  })
})

describe('updateQuestionGrade', () => {
  const state = {
    s1: {
      questionGrades: {
        q1: { result: GRADING_RESULTS.UNGRADED, score: 0, comment: '' },
      },
    },
  }

  it('should update grade for valid student and question', () => {
    const next = updateQuestionGrade(state, 's1', 'q1', {
      result: GRADING_RESULTS.CORRECT,
      score: 5,
    })
    expect(next.s1.questionGrades.q1.result).toBe(GRADING_RESULTS.CORRECT)
    expect(next.s1.questionGrades.q1.score).toBe(5)
    expect(next.s1.questionGrades.q1.comment).toBe('')
  })

  it('should not mutate the original state', () => {
    const original = JSON.parse(JSON.stringify(state))
    updateQuestionGrade(state, 's1', 'q1', { result: GRADING_RESULTS.CORRECT, score: 5 })
    expect(state).toEqual(original)
  })

  it('should return original state for missing student', () => {
    const result = updateQuestionGrade(state, 's2', 'q1', { result: GRADING_RESULTS.CORRECT, score: 5 })
    expect(result).toBe(state)
  })

  it('should handle null state', () => {
    expect(updateQuestionGrade(null, 's1', 'q1', {})).toBe(null)
  })
})

describe('calculateStudentScore', () => {
  it('should return zeros for missing student', () => {
    const result = calculateStudentScore({}, 's1', MOCK_QUESTIONS)
    expect(result.total).toBe(0)
    expect(result.maxScore).toBe(0)
    expect(result.details).toEqual([])
  })

  it('should calculate total score correctly', () => {
    const questions = [
      { id: 'q1', score: 5 },
      { id: 'q2', score: 10 },
      { id: 'q3', score: 15 },
    ]
    const state = {
      s1: {
        questionGrades: {
          q1: { result: GRADING_RESULTS.CORRECT, score: 5 },
          q2: { result: GRADING_RESULTS.WRONG, score: 0 },
          q3: { result: GRADING_RESULTS.PARTIAL, score: 8 },
        },
      },
    }
    const result = calculateStudentScore(state, 's1', questions)
    expect(result.total).toBe(13)
    expect(result.maxScore).toBe(30)
    expect(result.details).toHaveLength(3)
    expect(result.details[0]).toEqual({
      questionId: 'q1',
      questionIndex: 1,
      maxScore: 5,
      score: 5,
      result: GRADING_RESULTS.CORRECT,
    })
  })

  it('should handle missing question grades', () => {
    const questions = [{ id: 'q1', score: 5 }]
    const state = {
      s1: { questionGrades: {} },
    }
    const result = calculateStudentScore(state, 's1', questions)
    expect(result.total).toBe(0)
    expect(result.maxScore).toBe(5)
    expect(result.details[0].result).toBe(GRADING_RESULTS.UNGRADED)
  })
})

describe('isStudentAllGraded', () => {
  it('should return false for null or missing student', () => {
    expect(isStudentAllGraded({}, 's1', MOCK_QUESTIONS)).toBe(false)
    expect(isStudentAllGraded(null, 's1', MOCK_QUESTIONS)).toBe(false)
  })

  it('should return true when all questions are graded', () => {
    const questions = [
      { id: 'q1', score: 5 },
      { id: 'q2', score: 10 },
    ]
    const state = {
      s1: {
        questionGrades: {
          q1: { result: GRADING_RESULTS.CORRECT, score: 5 },
          q2: { result: GRADING_RESULTS.WRONG, score: 0 },
        },
      },
    }
    expect(isStudentAllGraded(state, 's1', questions)).toBe(true)
  })

  it('should return false when any question is ungraded', () => {
    const questions = [
      { id: 'q1', score: 5 },
      { id: 'q2', score: 10 },
    ]
    const state = {
      s1: {
        questionGrades: {
          q1: { result: GRADING_RESULTS.CORRECT, score: 5 },
          q2: { result: GRADING_RESULTS.UNGRADED, score: 0 },
        },
      },
    }
    expect(isStudentAllGraded(state, 's1', questions)).toBe(false)
  })
})

describe('updateStudentStatus', () => {
  it('should update status to GRADED and set completedAt', () => {
    const state = {
      s1: {
        status: STUDENT_STATUS.UNGRADED,
        startedAt: Date.now() - 60000,
        completedAt: null,
        needsReview: false,
      },
    }
    const next = updateStudentStatus(state, 's1', STUDENT_STATUS.GRADED)
    expect(next.s1.status).toBe(STUDENT_STATUS.GRADED)
    expect(next.s1.completedAt).toBeDefined()
    expect(next.s1.completedAt).toBeGreaterThan(0)
  })

  it('should not overwrite completedAt if already graded', () => {
    const originalCompletedAt = 1000
    const state = {
      s1: {
        status: STUDENT_STATUS.GRADED,
        startedAt: 500,
        completedAt: originalCompletedAt,
        needsReview: false,
      },
    }
    const next = updateStudentStatus(state, 's1', STUDENT_STATUS.GRADED)
    expect(next.s1.completedAt).toBe(originalCompletedAt)
  })

  it('should set startedAt for UNGRADED student when startedAt is null', () => {
    const state = {
      s1: {
        status: STUDENT_STATUS.UNGRADED,
        startedAt: null,
        completedAt: null,
        needsReview: false,
      },
    }
    const next = updateStudentStatus(state, 's1', STUDENT_STATUS.UNGRADED)
    expect(next.s1.startedAt).toBeGreaterThan(0)
  })

  it('should return original state for missing student', () => {
    const state = {}
    expect(updateStudentStatus(state, 's1', STUDENT_STATUS.GRADED)).toBe(state)
  })

  it('should handle null state', () => {
    expect(updateStudentStatus(null, 's1', STUDENT_STATUS.GRADED)).toBe(null)
  })
})

describe('initStudentStartedAt', () => {
  it('should return original state for null gradingState', () => {
    expect(initStudentStartedAt(null, 's1')).toBe(null)
  })

  it('should return original state for missing student', () => {
    const state = {}
    expect(initStudentStartedAt(state, 's1')).toBe(state)
  })

  it('should return original state if startedAt is already set', () => {
    const originalStartedAt = Date.now() - 60000
    const state = {
      s1: {
        status: STUDENT_STATUS.REVIEW,
        startedAt: originalStartedAt,
        completedAt: null,
        needsReview: true,
      },
    }
    const result = initStudentStartedAt(state, 's1')
    expect(result).toBe(state)
    expect(result.s1.startedAt).toBe(originalStartedAt)
  })

  it('should set startedAt without changing status when status is REVIEW', () => {
    const state = {
      s1: {
        status: STUDENT_STATUS.REVIEW,
        startedAt: null,
        completedAt: null,
        needsReview: true,
      },
    }
    const next = initStudentStartedAt(state, 's1')
    expect(next.s1.startedAt).toBeGreaterThan(0)
    expect(next.s1.status).toBe(STUDENT_STATUS.REVIEW)
    expect(next.s1.needsReview).toBe(true)
  })

  it('should set startedAt without changing status when status is GRADED', () => {
    const state = {
      s1: {
        status: STUDENT_STATUS.GRADED,
        startedAt: null,
        completedAt: 2000,
        needsReview: false,
      },
    }
    const next = initStudentStartedAt(state, 's1')
    expect(next.s1.startedAt).toBeGreaterThan(0)
    expect(next.s1.status).toBe(STUDENT_STATUS.GRADED)
    expect(next.s1.completedAt).toBe(2000)
  })

  it('should set startedAt without changing status when status is UNGRADED', () => {
    const state = {
      s1: {
        status: STUDENT_STATUS.UNGRADED,
        startedAt: null,
        completedAt: null,
        needsReview: false,
      },
    }
    const next = initStudentStartedAt(state, 's1')
    expect(next.s1.startedAt).toBeGreaterThan(0)
    expect(next.s1.status).toBe(STUDENT_STATUS.UNGRADED)
  })

  it('should not mutate the original state', () => {
    const state = {
      s1: {
        status: STUDENT_STATUS.REVIEW,
        startedAt: null,
        completedAt: null,
        needsReview: true,
      },
    }
    const original = JSON.parse(JSON.stringify(state))
    initStudentStartedAt(state, 's1')
    expect(state.s1.startedAt).toBe(original.s1.startedAt)
  })
})

describe('toggleStudentReview', () => {
  it('should toggle needsReview flag on', () => {
    const state = {
      s1: {
        status: STUDENT_STATUS.GRADED,
        startedAt: 100,
        completedAt: 200,
        needsReview: false,
      },
    }
    const next = toggleStudentReview(state, 's1')
    expect(next.s1.needsReview).toBe(true)
    expect(next.s1.status).toBe(STUDENT_STATUS.REVIEW)
  })

  it('should toggle needsReview flag off and restore status', () => {
    const state = {
      s1: {
        status: STUDENT_STATUS.REVIEW,
        startedAt: 100,
        completedAt: 200,
        needsReview: true,
      },
    }
    const next = toggleStudentReview(state, 's1')
    expect(next.s1.needsReview).toBe(false)
    expect(next.s1.status).toBe(STUDENT_STATUS.GRADED)
  })

  it('should restore to UNGRADED if no completedAt', () => {
    const state = {
      s1: {
        status: STUDENT_STATUS.REVIEW,
        startedAt: 100,
        completedAt: null,
        needsReview: true,
      },
    }
    const next = toggleStudentReview(state, 's1')
    expect(next.s1.needsReview).toBe(false)
    expect(next.s1.status).toBe(STUDENT_STATUS.UNGRADED)
  })

  it('should return original state for missing student', () => {
    const state = {}
    expect(toggleStudentReview(state, 's1')).toBe(state)
  })
})

describe('getGradingProgress', () => {
  it('should return zero stats for no students', () => {
    const result = getGradingProgress({}, [])
    expect(result.total).toBe(0)
    expect(result.gradedCount).toBe(0)
    expect(result.percentage).toBe(0)
  })

  it('should count graded, ungraded, and review students', () => {
    const now = Date.now()
    const state = {
      s1: { status: STUDENT_STATUS.GRADED, startedAt: now - 60000, completedAt: now - 30000, needsReview: false },
      s2: { status: STUDENT_STATUS.UNGRADED, startedAt: null, completedAt: null, needsReview: false },
      s3: { status: STUDENT_STATUS.REVIEW, startedAt: now - 60000, completedAt: now, needsReview: true },
    }
    const students = [
      { id: 's1', name: 'A' },
      { id: 's2', name: 'B' },
      { id: 's3', name: 'C' },
    ]
    const result = getGradingProgress(state, students)
    expect(result.total).toBe(3)
    expect(result.gradedCount).toBe(1)
    expect(result.ungradedCount).toBe(1)
    expect(result.reviewCount).toBe(1)
    expect(result.percentage).toBe(33)
  })

  it('should calculate duration stats for graded students', () => {
    const now = Date.now()
    const state = {
      s1: { status: STUDENT_STATUS.GRADED, startedAt: now - 30000, completedAt: now, needsReview: false },
      s2: { status: STUDENT_STATUS.GRADED, startedAt: now - 60000, completedAt: now, needsReview: false },
    }
    const students = [{ id: 's1' }, { id: 's2' }]
    const result = getGradingProgress(state, students)
    expect(result.avgDuration).toBe(45000)
    expect(result.minDuration).toBe(30000)
    expect(result.maxDuration).toBe(60000)
    expect(result.estimatedRemainingMs).toBe(0)
  })

  it('should calculate estimated remaining time', () => {
    const now = Date.now()
    const state = {
      s1: { status: STUDENT_STATUS.GRADED, startedAt: now - 60000, completedAt: now, needsReview: false },
      s2: { status: STUDENT_STATUS.UNGRADED, startedAt: null, completedAt: null, needsReview: false },
      s3: { status: STUDENT_STATUS.UNGRADED, startedAt: null, completedAt: null, needsReview: false },
    }
    const students = [{ id: 's1' }, { id: 's2' }, { id: 's3' }]
    const result = getGradingProgress(state, students)
    expect(result.estimatedRemainingMs).toBe(120000)
  })

  it('should handle missing grading entries', () => {
    const students = [{ id: 's1' }, { id: 's2' }]
    const state = { s1: { status: STUDENT_STATUS.UNGRADED, startedAt: null, completedAt: null, needsReview: false } }
    const result = getGradingProgress(state, students)
    expect(result.ungradedCount).toBe(2)
    expect(result.gradedCount).toBe(0)
  })
})

describe('filterStudents', () => {
  const now = Date.now()
  const state = {
    s1: { status: STUDENT_STATUS.GRADED, startedAt: now - 60000, completedAt: now, needsReview: false },
    s2: { status: STUDENT_STATUS.UNGRADED, startedAt: null, completedAt: null, needsReview: false },
    s3: { status: STUDENT_STATUS.REVIEW, startedAt: now, completedAt: null, needsReview: true },
  }
  const students = [
    { id: 's1', name: 'A' },
    { id: 's2', name: 'B' },
    { id: 's3', name: 'C' },
  ]

  it('should return all students for ALL filter', () => {
    expect(filterStudents(students, state, FILTER_OPTIONS.ALL)).toHaveLength(3)
  })

  it('should return only graded students', () => {
    const result = filterStudents(students, state, FILTER_OPTIONS.GRADED)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('s1')
  })

  it('should return only ungraded students', () => {
    const result = filterStudents(students, state, FILTER_OPTIONS.UNGRADED)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('s2')
  })

  it('should return only review students', () => {
    const result = filterStudents(students, state, FILTER_OPTIONS.REVIEW)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('s3')
  })

  it('should return empty for null/undefined students', () => {
    expect(filterStudents(null, state, FILTER_OPTIONS.ALL)).toEqual([])
    expect(filterStudents(undefined, state, FILTER_OPTIONS.ALL)).toEqual([])
  })

  it('should treat missing grading entry as ungraded', () => {
    const studentsWithMissing = [
      { id: 's1', name: 'A' },
      { id: 's99', name: 'Z' },
    ]
    const statePartial = { s1: { status: STUDENT_STATUS.GRADED, startedAt: now, completedAt: now, needsReview: false } }
    const ungraded = filterStudents(studentsWithMissing, statePartial, FILTER_OPTIONS.UNGRADED)
    expect(ungraded).toHaveLength(1)
    expect(ungraded[0].id).toBe('s99')
  })
})

describe('findNextUngradedStudent', () => {
  const now = Date.now()
  const state = {
    s1: { status: STUDENT_STATUS.GRADED, startedAt: now, completedAt: now, needsReview: false },
    s2: { status: STUDENT_STATUS.UNGRADED, startedAt: null, completedAt: null, needsReview: false },
    s3: { status: STUDENT_STATUS.GRADED, startedAt: now, completedAt: now, needsReview: false },
    s4: { status: STUDENT_STATUS.UNGRADED, startedAt: null, completedAt: null, needsReview: false },
  }
  const students = [
    { id: 's1', name: 'A' },
    { id: 's2', name: 'B' },
    { id: 's3', name: 'C' },
    { id: 's4', name: 'D' },
  ]

  it('should find next ungraded after current', () => {
    const next = findNextUngradedStudent(students, state, 's1')
    expect(next.id).toBe('s2')
  })

  it('should wrap around to find ungraded from beginning', () => {
    const next = findNextUngradedStudent(students, state, 's3')
    expect(next.id).toBe('s4')
  })

  it('should return null if all students are graded', () => {
    const allGradedState = {
      s1: { status: STUDENT_STATUS.GRADED, startedAt: now, completedAt: now, needsReview: false },
      s2: { status: STUDENT_STATUS.GRADED, startedAt: now, completedAt: now, needsReview: false },
    }
    const twoStudents = [{ id: 's1' }, { id: 's2' }]
    expect(findNextUngradedStudent(twoStudents, allGradedState, 's1')).toBe(null)
  })

  it('should return null for empty students array', () => {
    expect(findNextUngradedStudent([], state, 's1')).toBe(null)
  })

  it('should handle missing grading entry as ungraded', () => {
    const partialState = {
      s1: { status: STUDENT_STATUS.GRADED, startedAt: now, completedAt: now, needsReview: false },
    }
    const twoStudents = [{ id: 's1' }, { id: 's2' }]
    const next = findNextUngradedStudent(twoStudents, partialState, 's1')
    expect(next.id).toBe('s2')
  })
})

describe('pickRandomStudentsForReview', () => {
  it('should return empty for empty students array', () => {
    expect(pickRandomStudentsForReview([], {})).toEqual([])
  })

  it('should return at most count students', () => {
    const now = Date.now()
    const state = {
      s1: { status: STUDENT_STATUS.GRADED, startedAt: now, completedAt: now, needsReview: false },
      s2: { status: STUDENT_STATUS.GRADED, startedAt: now, completedAt: now, needsReview: false },
      s3: { status: STUDENT_STATUS.GRADED, startedAt: now, completedAt: now, needsReview: false },
    }
    const students = [{ id: 's1' }, { id: 's2' }, { id: 's3' }]
    const picked = pickRandomStudentsForReview(students, state, 2)
    expect(picked.length).toBeLessThanOrEqual(2)
  })

  it('should not pick students already marked for review', () => {
    const state = {
      s1: { status: STUDENT_STATUS.REVIEW, needsReview: true },
      s2: { status: STUDENT_STATUS.GRADED, needsReview: false },
    }
    const students = [{ id: 's1' }, { id: 's2' }]
    const picked = pickRandomStudentsForReview(students, state, 2)
    for (const s of picked) {
      expect(s.id).not.toBe('s1')
    }
  })

  it('should return empty when all students need review', () => {
    const state = {
      s1: { status: STUDENT_STATUS.REVIEW, needsReview: true },
      s2: { status: STUDENT_STATUS.REVIEW, needsReview: true },
    }
    const students = [{ id: 's1' }, { id: 's2' }]
    expect(pickRandomStudentsForReview(students, state, 2)).toEqual([])
  })
})

describe('formatDurationMs', () => {
  it('should handle zero and negative', () => {
    expect(formatDurationMs(0)).toBe('0秒')
    expect(formatDurationMs(-1)).toBe('0秒')
  })

  it('should format seconds only', () => {
    expect(formatDurationMs(5000)).toBe('5秒')
  })

  it('should format minutes and seconds', () => {
    expect(formatDurationMs(90000)).toBe('1分30秒')
  })

  it('should format hours, minutes and seconds', () => {
    expect(formatDurationMs(3661000)).toBe('1小时1分1秒')
  })
})

describe('formatTimestamp', () => {
  it('should return empty for falsy timestamp', () => {
    expect(formatTimestamp(0)).toBe('')
    expect(formatTimestamp(null)).toBe('')
    expect(formatTimestamp(undefined)).toBe('')
  })

  it('should format date correctly', () => {
    const ts = new Date('2024-06-15T10:30:45').getTime()
    const result = formatTimestamp(ts)
    expect(result).toContain('2024')
    expect(result).toContain('06')
    expect(result).toContain('15')
    expect(result).toContain('10')
    expect(result).toContain('30')
    expect(result).toContain('45')
  })
})

describe('escapeCSVValue', () => {
  it('should return empty string for null/undefined', () => {
    expect(escapeCSVValue(null)).toBe('')
    expect(escapeCSVValue(undefined)).toBe('')
  })

  it('should return plain string as-is', () => {
    expect(escapeCSVValue('hello')).toBe('hello')
  })

  it('should escape values with commas', () => {
    expect(escapeCSVValue('a,b')).toBe('"a,b"')
  })

  it('should escape values with quotes', () => {
    expect(escapeCSVValue('say "hi"')).toBe('"say ""hi"""')
  })

  it('should escape values with newlines', () => {
    expect(escapeCSVValue('line1\nline2')).toBe('"line1\nline2"')
  })

  it('should escape values with carriage returns', () => {
    expect(escapeCSVValue('a\rb')).toBe('"a\rb"')
  })

  it('should convert numbers to strings', () => {
    expect(escapeCSVValue(42)).toBe('42')
  })
})

describe('generateCSVContent', () => {
  it('should generate valid CSV with headers and rows', () => {
    const now = Date.now()
    const questions = [
      { id: 'q1', score: 5 },
      { id: 'q2', score: 10 },
    ]
    const students = [
      { id: 's1', name: '张三', studentNo: '001' },
      { id: 's2', name: '李四', studentNo: '002' },
    ]
    const state = {
      s1: {
        status: STUDENT_STATUS.GRADED,
        startedAt: now - 60000,
        completedAt: now,
        needsReview: false,
        questionGrades: {
          q1: { result: GRADING_RESULTS.CORRECT, score: 5, comment: '' },
          q2: { result: GRADING_RESULTS.WRONG, score: 0, comment: '' },
        },
      },
      s2: {
        status: STUDENT_STATUS.UNGRADED,
        startedAt: null,
        completedAt: null,
        needsReview: false,
        questionGrades: {
          q1: { result: GRADING_RESULTS.UNGRADED, score: 0, comment: '' },
          q2: { result: GRADING_RESULTS.UNGRADED, score: 0, comment: '' },
        },
      },
    }

    const { csvContent, header, rows } = generateCSVContent(students, questions, state)

    expect(header).toContain('学生姓名')
    expect(header).toContain('学号')
    expect(header).toContain('总分')
    expect(header).toContain('第1题得分')
    expect(header).toContain('第2题得分')
    expect(header).toContain('阅卷状态')
    expect(header).toContain('阅卷完成时间')
    expect(rows).toHaveLength(2)

    expect(rows[0][0]).toBe('张三')
    expect(rows[0][1]).toBe('001')
    expect(rows[0][2]).toBe('5')
    expect(rows[0][3]).toBe('5')
    expect(rows[0][4]).toBe('0')
    expect(rows[0][5]).toBe('已阅')

    expect(rows[1][0]).toBe('李四')
    expect(rows[1][2]).toBe('0')
    expect(rows[1][3]).toBe('')
    expect(rows[1][4]).toBe('')
    expect(rows[1][5]).toBe('未阅')

    expect(csvContent).toContain('学生姓名')
    expect(csvContent.split('\n').length).toBe(3)
  })

  it('should mark review students correctly', () => {
    const questions = [{ id: 'q1', score: 5 }]
    const students = [{ id: 's1', name: '王五', studentNo: '003' }]
    const state = {
      s1: {
        status: STUDENT_STATUS.REVIEW,
        startedAt: Date.now() - 60000,
        completedAt: Date.now(),
        needsReview: true,
        questionGrades: {
          q1: { result: GRADING_RESULTS.CORRECT, score: 5, comment: '' },
        },
      },
    }
    const { rows } = generateCSVContent(students, questions, state)
    expect(rows[0][4]).toBe('待复查')
  })
})

describe('getStudentStatusLabel', () => {
  it('should return 未阅 for missing student', () => {
    expect(getStudentStatusLabel({}, 's1')).toBe('未阅')
  })

  it('should return 待复查 for review student', () => {
    const state = { s1: { status: STUDENT_STATUS.GRADED, needsReview: true } }
    expect(getStudentStatusLabel(state, 's1')).toBe('待复查')
  })

  it('should return correct label for graded student', () => {
    const state = { s1: { status: STUDENT_STATUS.GRADED, needsReview: false } }
    expect(getStudentStatusLabel(state, 's1')).toBe('已阅')
  })

  it('should return correct label for ungraded student', () => {
    const state = { s1: { status: STUDENT_STATUS.UNGRADED, needsReview: false } }
    expect(getStudentStatusLabel(state, 's1')).toBe('未阅')
  })
})

describe('isAutoGradable', () => {
  it('should return false for null question', () => {
    expect(isAutoGradable(null)).toBe(false)
  })

  it('should return true for single choice', () => {
    expect(isAutoGradable({ type: QUESTION_TYPES.SINGLE })).toBe(true)
  })

  it('should return true for multiple choice', () => {
    expect(isAutoGradable({ type: QUESTION_TYPES.MULTIPLE })).toBe(true)
  })

  it('should return false for essay', () => {
    expect(isAutoGradable({ type: QUESTION_TYPES.ESSAY })).toBe(false)
  })
})

describe('getDefaultScoreForResult', () => {
  const question = { score: 20 }

  it('should return full score for CORRECT', () => {
    expect(getDefaultScoreForResult(question, GRADING_RESULTS.CORRECT)).toBe(20)
  })

  it('should return 0 for WRONG', () => {
    expect(getDefaultScoreForResult(question, GRADING_RESULTS.WRONG)).toBe(0)
  })

  it('should return half score for PARTIAL', () => {
    expect(getDefaultScoreForResult(question, GRADING_RESULTS.PARTIAL)).toBe(10)
  })

  it('should return 0 for UNGRADED', () => {
    expect(getDefaultScoreForResult(question, GRADING_RESULTS.UNGRADED)).toBe(0)
  })

  it('should handle null question', () => {
    expect(getDefaultScoreForResult(null, GRADING_RESULTS.CORRECT)).toBe(0)
  })

  it('should round half for odd scores', () => {
    const q = { score: 15 }
    expect(getDefaultScoreForResult(q, GRADING_RESULTS.PARTIAL)).toBe(8)
  })
})

describe('downloadCSV', () => {
  it('should return false when window is undefined', () => {
    const originalWindow = global.window
    Object.defineProperty(global, 'window', { value: undefined, writable: true })
    expect(downloadCSV('test', 'test.csv')).toBe(false)
    Object.defineProperty(global, 'window', { value: originalWindow, writable: true })
  })
})

describe('generateCSVFilename', () => {
  it('should generate filename with current date and time', () => {
    const filename = generateCSVFilename()
    expect(filename).toMatch(/^阅卷成绩_\d{8}_\d{6}\.csv$/)
  })
})
