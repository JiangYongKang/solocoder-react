import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  generateId,
  createQuestion,
  createSurvey,
  addQuestion,
  deleteQuestion,
  updateQuestion,
  reorderQuestions,
  addOption,
  updateOption,
  deleteOption,
  addMatrixRow,
  updateMatrixRow,
  deleteMatrixRow,
  addMatrixColumn,
  updateMatrixColumn,
  deleteMatrixColumn,
  publishSurvey,
  loadSurveys,
  saveSurveys,
  upsertSurvey,
  removeSurvey,
  loadDraft,
  saveDraft,
  clearDraft,
  loadResponses,
  saveResponse,
  clearResponses,
  deleteSurveyData,
  validateAnswer,
  validateAllAnswers,
  calculateStatistics,
  exportStatisticsToCSV,
} from '../../survey/surveyCore'

describe('QUESTION_TYPES', () => {
  it('should contain all 5 question types', () => {
    expect(Object.keys(QUESTION_TYPES)).toHaveLength(5)
    expect(QUESTION_TYPES.SINGLE).toBe('single')
    expect(QUESTION_TYPES.MULTIPLE).toBe('multiple')
    expect(QUESTION_TYPES.RATING).toBe('rating')
    expect(QUESTION_TYPES.TEXT).toBe('text')
    expect(QUESTION_TYPES.MATRIX).toBe('matrix')
  })
})

describe('QUESTION_TYPE_LABELS', () => {
  it('should map all types to Chinese labels', () => {
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.SINGLE]).toBe('单选题')
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.MULTIPLE]).toBe('多选题')
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.RATING]).toBe('评分题')
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.TEXT]).toBe('填空题')
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.MATRIX]).toBe('矩阵量表题')
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
  it('should create a single choice question with default options', () => {
    const q = createQuestion(QUESTION_TYPES.SINGLE)
    expect(q.id).toBeDefined()
    expect(q.type).toBe(QUESTION_TYPES.SINGLE)
    expect(q.title).toBe('单选题')
    expect(q.required).toBe(false)
    expect(Array.isArray(q.options)).toBe(true)
    expect(q.options).toHaveLength(2)
    expect(q.options[0]).toEqual({ label: '选项1', value: 'option1' })
  })

  it('should create a multiple choice question with default options', () => {
    const q = createQuestion(QUESTION_TYPES.MULTIPLE)
    expect(q.type).toBe(QUESTION_TYPES.MULTIPLE)
    expect(q.options).toHaveLength(2)
  })

  it('should create a rating question with maxRating 5', () => {
    const q = createQuestion(QUESTION_TYPES.RATING)
    expect(q.type).toBe(QUESTION_TYPES.RATING)
    expect(q.maxRating).toBe(5)
    expect(q.options).toBeUndefined()
  })

  it('should create a text question with placeholder', () => {
    const q = createQuestion(QUESTION_TYPES.TEXT)
    expect(q.type).toBe(QUESTION_TYPES.TEXT)
    expect(q.placeholder).toBe('请输入您的回答')
  })

  it('should create a matrix question with rows and columns', () => {
    const q = createQuestion(QUESTION_TYPES.MATRIX)
    expect(q.type).toBe(QUESTION_TYPES.MATRIX)
    expect(Array.isArray(q.rows)).toBe(true)
    expect(Array.isArray(q.columns)).toBe(true)
    expect(q.rows).toHaveLength(2)
    expect(q.columns).toHaveLength(5)
    expect(q.rows[0].value).toBe('row1')
    expect(q.columns[0].value).toBe('1')
  })
})

describe('createSurvey', () => {
  it('should create a survey with default values', () => {
    const s = createSurvey()
    expect(s.id).toBeDefined()
    expect(s.title).toBe('未命名问卷')
    expect(s.description).toBe('')
    expect(Array.isArray(s.questions)).toBe(true)
    expect(s.questions).toHaveLength(0)
    expect(s.status).toBe('draft')
    expect(typeof s.createdAt).toBe('number')
    expect(typeof s.updatedAt).toBe('number')
  })

  it('should create a survey with custom title', () => {
    const s = createSurvey('用户满意度调查')
    expect(s.title).toBe('用户满意度调查')
  })
})

describe('question CRUD operations', () => {
  it('addQuestion should add a question to survey', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.SINGLE)
    expect(survey.questions).toHaveLength(1)
    expect(survey.questions[0].type).toBe(QUESTION_TYPES.SINGLE)
    expect(survey.updatedAt).toBeGreaterThanOrEqual(survey.createdAt)
  })

  it('addQuestion should return survey as-is when null', () => {
    expect(addQuestion(null, QUESTION_TYPES.SINGLE)).toBe(null)
  })

  it('deleteQuestion should remove question by id', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.SINGLE)
    const qId = survey.questions[0].id
    survey = addQuestion(survey, QUESTION_TYPES.TEXT)
    survey = deleteQuestion(survey, qId)
    expect(survey.questions).toHaveLength(1)
    expect(survey.questions[0].type).toBe(QUESTION_TYPES.TEXT)
  })

  it('deleteQuestion should handle null survey', () => {
    expect(deleteQuestion(null, 'x')).toBe(null)
  })

  it('updateQuestion should update a question by id', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.SINGLE)
    const qId = survey.questions[0].id
    survey = updateQuestion(survey, qId, { title: '新标题', required: true })
    expect(survey.questions[0].title).toBe('新标题')
    expect(survey.questions[0].required).toBe(true)
  })

  it('updateQuestion should handle null survey', () => {
    expect(updateQuestion(null, 'x', {})).toBe(null)
  })

  it('reorderQuestions should reorder correctly', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.SINGLE)
    survey = addQuestion(survey, QUESTION_TYPES.TEXT)
    survey = addQuestion(survey, QUESTION_TYPES.RATING)
    const idsBefore = survey.questions.map((q) => q.type)
    expect(idsBefore).toEqual(['single', 'text', 'rating'])
    survey = reorderQuestions(survey, 2, 0)
    const idsAfter = survey.questions.map((q) => q.type)
    expect(idsAfter).toEqual(['rating', 'single', 'text'])
  })

  it('reorderQuestions should handle edge cases', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.SINGLE)
    const unchanged = reorderQuestions(survey, -1, 0)
    expect(unchanged).toBe(survey)
    const unchanged2 = reorderQuestions(survey, 0, 0)
    expect(unchanged2).toBe(survey)
    expect(reorderQuestions(null, 0, 1)).toBe(null)
  })
})

describe('option operations for single/multiple', () => {
  it('addOption should add a new option', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.SINGLE)
    const qId = survey.questions[0].id
    survey = addOption(survey, qId)
    expect(survey.questions[0].options).toHaveLength(3)
    expect(survey.questions[0].options[2].label).toBe('选项3')
  })

  it('updateOption should update option at index', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.SINGLE)
    const qId = survey.questions[0].id
    survey = updateOption(survey, qId, 0, { label: '男', value: 'male' })
    expect(survey.questions[0].options[0]).toEqual({ label: '男', value: 'male' })
  })

  it('deleteOption should remove option at index', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.SINGLE)
    const qId = survey.questions[0].id
    survey = deleteOption(survey, qId, 0)
    expect(survey.questions[0].options).toHaveLength(1)
    expect(survey.questions[0].options[0].value).toBe('option2')
  })

  it('option operations should handle invalid inputs', () => {
    expect(addOption(null, 'x')).toBe(null)
    expect(updateOption(null, 'x', 0, {})).toBe(null)
    expect(deleteOption(null, 'x', 0)).toBe(null)
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.TEXT)
    const qId = survey.questions[0].id
    const unchanged = addOption(survey, qId)
    expect(unchanged.questions[0].options).toBeUndefined()
  })
})

describe('matrix row/column operations', () => {
  it('addMatrixRow should add a new row', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.MATRIX)
    const qId = survey.questions[0].id
    survey = addMatrixRow(survey, qId)
    expect(survey.questions[0].rows).toHaveLength(3)
    expect(survey.questions[0].rows[2].label).toBe('维度3')
  })

  it('updateMatrixRow should update row at index', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.MATRIX)
    const qId = survey.questions[0].id
    survey = updateMatrixRow(survey, qId, 0, { label: '服务态度', value: 'service' })
    expect(survey.questions[0].rows[0].label).toBe('服务态度')
  })

  it('deleteMatrixRow should remove row at index', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.MATRIX)
    const qId = survey.questions[0].id
    survey = deleteMatrixRow(survey, qId, 0)
    expect(survey.questions[0].rows).toHaveLength(1)
  })

  it('addMatrixColumn should add a new column', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.MATRIX)
    const qId = survey.questions[0].id
    survey = addMatrixColumn(survey, qId)
    expect(survey.questions[0].columns).toHaveLength(6)
  })

  it('updateMatrixColumn should update column at index', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.MATRIX)
    const qId = survey.questions[0].id
    survey = updateMatrixColumn(survey, qId, 0, { label: '极差', value: 'terrible' })
    expect(survey.questions[0].columns[0].label).toBe('极差')
  })

  it('deleteMatrixColumn should remove column at index', () => {
    let survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.MATRIX)
    const qId = survey.questions[0].id
    survey = deleteMatrixColumn(survey, qId, 0)
    expect(survey.questions[0].columns).toHaveLength(4)
  })

  it('matrix operations should handle invalid inputs', () => {
    expect(addMatrixRow(null, 'x')).toBe(null)
    expect(updateMatrixRow(null, 'x', 0, {})).toBe(null)
    expect(deleteMatrixRow(null, 'x', 0)).toBe(null)
    expect(addMatrixColumn(null, 'x')).toBe(null)
  })
})

describe('publishSurvey', () => {
  it('should change status to published', () => {
    const survey = createSurvey()
    const published = publishSurvey(survey)
    expect(published.status).toBe('published')
    expect(published.updatedAt).toBeGreaterThanOrEqual(survey.updatedAt)
  })

  it('should handle null survey', () => {
    expect(publishSurvey(null)).toBe(null)
  })
})

function createMockLocalStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)) },
    removeItem: (key) => { store.delete(key) },
    clear: () => { store.clear() },
  }
}

describe('survey localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('loadSurveys should return empty array when nothing stored', () => {
    expect(loadSurveys()).toEqual([])
  })

  it('saveSurveys and loadSurveys should work correctly', () => {
    const s = createSurvey()
    const saved = saveSurveys([s])
    expect(saved).toBe(true)
    const loaded = loadSurveys()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe(s.id)
  })

  it('loadSurveys should return empty for invalid JSON', () => {
    mockStorage.setItem('survey_surveys', 'not-json')
    expect(loadSurveys()).toEqual([])
  })

  it('loadSurveys should return empty for non-array data', () => {
    mockStorage.setItem('survey_surveys', JSON.stringify({ foo: 'bar' }))
    expect(loadSurveys()).toEqual([])
  })

  it('upsertSurvey should add new survey', () => {
    const s1 = createSurvey()
    const s2 = createSurvey()
    let list = upsertSurvey([], s1)
    expect(list).toHaveLength(1)
    list = upsertSurvey(list, s2)
    expect(list).toHaveLength(2)
  })

  it('upsertSurvey should update existing survey', () => {
    const s = createSurvey('原标题')
    let list = upsertSurvey([], s)
    const updated = { ...s, title: '新标题' }
    list = upsertSurvey(list, updated)
    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('新标题')
  })

  it('removeSurvey should remove by id', () => {
    const s1 = createSurvey()
    const s2 = createSurvey()
    let list = [s1, s2]
    list = removeSurvey(list, s1.id)
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(s2.id)
  })

  it('draft functions should work correctly', () => {
    expect(loadDraft('survey1')).toBe(null)
    const answers = { q1: 'a' }
    const saved = saveDraft('survey1', answers)
    expect(saved).toBe(true)
    const loaded = loadDraft('survey1')
    expect(loaded.answers).toEqual(answers)
    expect(typeof loaded.savedAt).toBe('number')
    expect(clearDraft('survey1')).toBe(true)
    expect(loadDraft('survey1')).toBe(null)
  })

  it('response functions should work correctly', () => {
    expect(loadResponses('survey1')).toEqual([])
    expect(saveResponse('survey1', { q1: 'a' })).toBe(true)
    expect(saveResponse('survey1', { q1: 'b' })).toBe(true)
    const responses = loadResponses('survey1')
    expect(responses).toHaveLength(2)
    expect(responses[0].answers).toEqual({ q1: 'a' })
    expect(clearResponses('survey1')).toBe(true)
    expect(loadResponses('survey1')).toEqual([])
  })

  it('should handle localStorage throws gracefully', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => { throw new Error('fail') },
        setItem: () => { throw new Error('fail') },
        removeItem: () => { throw new Error('fail') },
      },
    })
    expect(loadSurveys()).toEqual([])
    expect(saveSurveys([])).toBe(false)
    expect(loadDraft('x')).toBe(null)
    expect(saveDraft('x', {})).toBe(false)
    expect(clearDraft('x')).toBe(false)
    expect(loadResponses('x')).toEqual([])
    expect(saveResponse('x', {})).toBe(false)
    expect(clearResponses('x')).toBe(false)
  })
})

describe('validateAnswer', () => {
  it('should always pass when question is null', () => {
    expect(validateAnswer(null, null).valid).toBe(true)
  })

  it('should always pass when question is not required', () => {
    const q = { id: 'q1', type: QUESTION_TYPES.SINGLE, required: false, options: [] }
    expect(validateAnswer(q, '').valid).toBe(true)
    expect(validateAnswer(q, null).valid).toBe(true)
  })

  it('should validate single choice required', () => {
    const q = { id: 'q1', type: QUESTION_TYPES.SINGLE, required: true, options: [] }
    expect(validateAnswer(q, '').valid).toBe(false)
    expect(validateAnswer(q, null).valid).toBe(false)
    expect(validateAnswer(q, 'option1').valid).toBe(true)
  })

  it('should validate multiple choice required', () => {
    const q = { id: 'q1', type: QUESTION_TYPES.MULTIPLE, required: true, options: [] }
    expect(validateAnswer(q, []).valid).toBe(false)
    expect(validateAnswer(q, null).valid).toBe(false)
    expect(validateAnswer(q, ['a']).valid).toBe(true)
  })

  it('should validate rating required', () => {
    const q = { id: 'q1', type: QUESTION_TYPES.RATING, required: true }
    expect(validateAnswer(q, 0).valid).toBe(false)
    expect(validateAnswer(q, null).valid).toBe(false)
    expect(validateAnswer(q, 3).valid).toBe(true)
  })

  it('should validate text required', () => {
    const q = { id: 'q1', type: QUESTION_TYPES.TEXT, required: true }
    expect(validateAnswer(q, '').valid).toBe(false)
    expect(validateAnswer(q, '   ').valid).toBe(false)
    expect(validateAnswer(q, null).valid).toBe(false)
    expect(validateAnswer(q, 'hello').valid).toBe(true)
  })

  it('should validate matrix required', () => {
    const q = {
      id: 'q1',
      type: QUESTION_TYPES.MATRIX,
      required: true,
      rows: [{ value: 'row1' }, { value: 'row2' }],
      columns: [],
    }
    expect(validateAnswer(q, null).valid).toBe(false)
    expect(validateAnswer(q, {}).valid).toBe(false)
    expect(validateAnswer(q, { row1: '1' }).valid).toBe(false)
    expect(validateAnswer(q, { row1: '1', row2: '2' }).valid).toBe(true)
  })
})

describe('validateAllAnswers', () => {
  it('should handle empty questions', () => {
    const result = validateAllAnswers(null, {})
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('should validate all questions and collect errors', () => {
    const questions = [
      { id: 'q1', type: QUESTION_TYPES.SINGLE, required: true, options: [] },
      { id: 'q2', type: QUESTION_TYPES.TEXT, required: true },
      { id: 'q3', type: QUESTION_TYPES.TEXT, required: false },
    ]
    const result = validateAllAnswers(questions, { q1: '', q2: '', q3: '' })
    expect(result.valid).toBe(false)
    expect(Object.keys(result.errors)).toHaveLength(2)
    expect(result.errors.q1).toBeDefined()
    expect(result.errors.q2).toBeDefined()
    expect(result.errors.q3).toBeUndefined()
  })

  it('should return valid when all answers are provided', () => {
    const questions = [
      { id: 'q1', type: QUESTION_TYPES.SINGLE, required: true, options: [] },
      { id: 'q2', type: QUESTION_TYPES.TEXT, required: true },
    ]
    const result = validateAllAnswers(questions, { q1: 'a', q2: 'hello' })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })
})

describe('calculateStatistics', () => {
  it('should return empty object for invalid input', () => {
    expect(calculateStatistics(null, null)).toEqual({})
    expect(calculateStatistics([], [])).toEqual({})
  })

  it('should calculate single choice statistics', () => {
    const questions = [
      {
        id: 'q1',
        type: QUESTION_TYPES.SINGLE,
        title: '性别',
        options: [
          { label: '男', value: 'male' },
          { label: '女', value: 'female' },
        ],
      },
    ]
    const responses = [
      { answers: { q1: 'male' } },
      { answers: { q1: 'male' } },
      { answers: { q1: 'female' } },
    ]
    const stats = calculateStatistics(questions, responses)
    expect(stats.q1.total).toBe(3)
    expect(stats.q1.optionCounts[0].count).toBe(2)
    expect(stats.q1.optionCounts[1].count).toBe(1)
  })

  it('should calculate multiple choice statistics', () => {
    const questions = [
      {
        id: 'q1',
        type: QUESTION_TYPES.MULTIPLE,
        title: '爱好',
        options: [
          { label: '读书', value: 'read' },
          { label: '运动', value: 'sport' },
        ],
      },
    ]
    const responses = [
      { answers: { q1: ['read', 'sport'] } },
      { answers: { q1: ['read'] } },
    ]
    const stats = calculateStatistics(questions, responses)
    expect(stats.q1.optionCounts[0].count).toBe(2)
    expect(stats.q1.optionCounts[1].count).toBe(1)
  })

  it('should calculate rating statistics with average', () => {
    const questions = [
      { id: 'q1', type: QUESTION_TYPES.RATING, title: '评分', maxRating: 5 },
    ]
    const responses = [
      { answers: { q1: 4 } },
      { answers: { q1: 5 } },
      { answers: { q1: 3 } },
    ]
    const stats = calculateStatistics(questions, responses)
    expect(stats.q1.average).toBe(4)
    expect(stats.q1.ratingCounts.find((r) => r.rating === 4).count).toBe(1)
    expect(stats.q1.ratingCounts.find((r) => r.rating === 5).count).toBe(1)
  })

  it('should calculate text answers', () => {
    const questions = [
      { id: 'q1', type: QUESTION_TYPES.TEXT, title: '建议' },
    ]
    const responses = [
      { answers: { q1: '很好' } },
      { answers: { q1: '  需要改进  ' } },
      { answers: { q1: '' } },
    ]
    const stats = calculateStatistics(questions, responses)
    expect(stats.q1.textAnswers).toEqual(['很好', '需要改进'])
    expect(stats.q1.total).toBe(3)
  })

  it('should calculate matrix statistics', () => {
    const questions = [
      {
        id: 'q1',
        type: QUESTION_TYPES.MATRIX,
        title: '满意度',
        rows: [
          { label: '服务', value: 'service' },
          { label: '产品', value: 'product' },
        ],
        columns: [
          { label: '满意', value: 'ok' },
          { label: '不满意', value: 'bad' },
        ],
      },
    ]
    const responses = [
      { answers: { q1: { service: 'ok', product: 'ok' } } },
      { answers: { q1: { service: 'bad', product: 'ok' } } },
    ]
    const stats = calculateStatistics(questions, responses)
    expect(stats.q1.total).toBe(2)
    expect(stats.q1.columnLabels).toEqual(['满意', '不满意'])
    const serviceRow = stats.q1.matrixStats.find((r) => r.rowValue === 'service')
    expect(serviceRow.colCounts[0].count).toBe(1)
    expect(serviceRow.colCounts[1].count).toBe(1)
    const productRow = stats.q1.matrixStats.find((r) => r.rowValue === 'product')
    expect(productRow.colCounts[0].count).toBe(2)
    expect(productRow.colCounts[1].count).toBe(0)
  })
})

describe('exportStatisticsToCSV', () => {
  it('should return empty string for non-array questions', () => {
    expect(exportStatisticsToCSV(null, {})).toBe('')
  })

  it('should export single/multiple choice stats with percentage', () => {
    const questions = [
      {
        id: 'q1',
        type: QUESTION_TYPES.SINGLE,
        title: '性别',
        options: [
          { label: '男', value: 'male' },
          { label: '女', value: 'female' },
        ],
      },
    ]
    const responses = [
      { answers: { q1: 'male' } },
      { answers: { q1: 'male' } },
    ]
    const stats = calculateStatistics(questions, responses)
    const csv = exportStatisticsToCSV(questions, stats)
    expect(csv).toContain('性别')
    expect(csv).toContain('选项,数量,占比')
    expect(csv).toContain('男,2,100.0%')
    expect(csv).toContain('女,0,0.0%')
  })

  it('should export rating stats with average', () => {
    const questions = [
      { id: 'q1', type: QUESTION_TYPES.RATING, title: '评分', maxRating: 3 },
    ]
    const responses = [
      { answers: { q1: 3 } },
      { answers: { q1: 1 } },
    ]
    const stats = calculateStatistics(questions, responses)
    const csv = exportStatisticsToCSV(questions, stats)
    expect(csv).toContain('评分')
    expect(csv).toContain('评分,数量,占比')
    expect(csv).toContain('平均分,2')
  })

  it('should export text answers', () => {
    const questions = [
      { id: 'q1', type: QUESTION_TYPES.TEXT, title: '建议' },
    ]
    const responses = [
      { answers: { q1: 'hello' } },
    ]
    const stats = calculateStatistics(questions, responses)
    const csv = exportStatisticsToCSV(questions, stats)
    expect(csv).toContain('建议')
    expect(csv).toContain('回答内容')
    expect(csv).toContain('hello')
  })

  it('should export matrix stats as table', () => {
    const questions = [
      {
        id: 'q1',
        type: QUESTION_TYPES.MATRIX,
        title: '评价',
        rows: [{ label: '服务', value: 's' }],
        columns: [
          { label: '好', value: 'g' },
          { label: '差', value: 'b' },
        ],
      },
    ]
    const responses = [{ answers: { q1: { s: 'g' } } }]
    const stats = calculateStatistics(questions, responses)
    const csv = exportStatisticsToCSV(questions, stats)
    expect(csv).toContain('评价')
    expect(csv).toContain('维度,好,差')
    expect(csv).toContain('服务,1,0')
  })

  it('should escape special characters in CSV', () => {
    const questions = [
      { id: 'q1', type: QUESTION_TYPES.TEXT, title: '含,逗号和"引号' },
    ]
    const responses = [{ answers: { q1: 'hello, world' } }]
    const stats = calculateStatistics(questions, responses)
    const csv = exportStatisticsToCSV(questions, stats)
    expect(csv).toContain('"含,逗号和""引号"')
    expect(csv).toContain('"hello, world"')
  })
})

describe('validateAnswer matrix edge cases', () => {
  const baseMatrixQ = {
    id: 'q1',
    type: QUESTION_TYPES.MATRIX,
    required: true,
    rows: [{ value: 'row1' }, { value: 'row2' }],
    columns: [],
  }

  it('should treat numeric 0 as a valid answer', () => {
    const result = validateAnswer(baseMatrixQ, { row1: 0, row2: 1 })
    expect(result.valid).toBe(true)
  })

  it('should treat string "0" as a valid answer', () => {
    const result = validateAnswer(baseMatrixQ, { row1: '0', row2: '1' })
    expect(result.valid).toBe(true)
  })

  it('should treat boolean false as a valid answer', () => {
    const result = validateAnswer(baseMatrixQ, { row1: false, row2: true })
    expect(result.valid).toBe(true)
  })

  it('should still reject undefined/null/empty string', () => {
    expect(validateAnswer(baseMatrixQ, { row1: undefined, row2: '1' }).valid).toBe(false)
    expect(validateAnswer(baseMatrixQ, { row1: null, row2: '1' }).valid).toBe(false)
    expect(validateAnswer(baseMatrixQ, { row1: '', row2: '1' }).valid).toBe(false)
  })
})

describe('deleteSurveyData', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('should clear both draft and responses for a survey', () => {
    saveDraft('s1', { q1: 'a' })
    saveResponse('s1', { q1: 'a' })
    expect(loadDraft('s1')).not.toBe(null)
    expect(loadResponses('s1')).toHaveLength(1)

    const result = deleteSurveyData('s1')
    expect(result.draft).toBe(true)
    expect(result.responses).toBe(true)
    expect(loadDraft('s1')).toBe(null)
    expect(loadResponses('s1')).toEqual([])
  })

  it('should not affect other surveys data', () => {
    saveDraft('s1', {})
    saveResponse('s1', {})
    saveDraft('s2', {})
    saveResponse('s2', {})

    deleteSurveyData('s1')
    expect(loadDraft('s2')).not.toBe(null)
    expect(loadResponses('s2')).toHaveLength(1)
  })

  it('should handle missing window.localStorage gracefully', () => {
    vi.stubGlobal('window', undefined)
    const result = deleteSurveyData('s1')
    expect(result).toEqual({ draft: false, responses: false })
  })
})

describe('reorderQuestions edge cases', () => {
  let survey
  beforeEach(() => {
    survey = createSurvey()
    survey = addQuestion(survey, QUESTION_TYPES.SINGLE)
    survey = addQuestion(survey, QUESTION_TYPES.TEXT)
    survey = addQuestion(survey, QUESTION_TYPES.RATING)
  })

  it('should return survey unchanged when fromIndex is out of bounds (negative)', () => {
    const result = reorderQuestions(survey, -1, 0)
    expect(result).toBe(survey)
  })

  it('should return survey unchanged when fromIndex is out of bounds (>= length)', () => {
    const result = reorderQuestions(survey, 99, 0)
    expect(result).toBe(survey)
  })

  it('should return survey unchanged when toIndex is out of bounds', () => {
    const result = reorderQuestions(survey, 0, 99)
    expect(result).toBe(survey)
  })

  it('should return survey unchanged when fromIndex equals toIndex', () => {
    const result = reorderQuestions(survey, 1, 1)
    expect(result).toBe(survey)
  })

  it('should return survey unchanged when survey is null', () => {
    expect(reorderQuestions(null, 0, 1)).toBe(null)
  })

  it('should return survey unchanged when questions is not array', () => {
    const badSurvey = { ...survey, questions: null }
    expect(reorderQuestions(badSurvey, 0, 1)).toBe(badSurvey)
  })

  it('should correctly move first question to last', () => {
    const originalTypes = survey.questions.map((q) => q.type)
    const result = reorderQuestions(survey, 0, 2)
    const newTypes = result.questions.map((q) => q.type)
    expect(newTypes).toEqual([originalTypes[1], originalTypes[2], originalTypes[0]])
    expect(result.updatedAt).toBeGreaterThanOrEqual(survey.updatedAt)
  })
})

describe('createQuestion rating default maxRating', () => {
  it('should default rating maxRating to 5 (1-5 star requirement)', () => {
    const q = createQuestion(QUESTION_TYPES.RATING)
    expect(q.maxRating).toBe(5)
  })
})
