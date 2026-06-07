export const QUESTION_TYPES = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
  RATING: 'rating',
  TEXT: 'text',
  MATRIX: 'matrix',
}

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.SINGLE]: '单选题',
  [QUESTION_TYPES.MULTIPLE]: '多选题',
  [QUESTION_TYPES.RATING]: '评分题',
  [QUESTION_TYPES.TEXT]: '填空题',
  [QUESTION_TYPES.MATRIX]: '矩阵量表题',
}

const SURVEYS_STORAGE_KEY = 'survey_surveys'
const DRAFT_STORAGE_PREFIX = 'survey_draft_'
const RESPONSES_STORAGE_PREFIX = 'survey_responses_'

let idCounter = 0

export function generateId(prefix = 'id') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function createQuestion(type) {
  const base = {
    id: generateId('q'),
    type,
    title: QUESTION_TYPE_LABELS[type],
    required: false,
  }

  switch (type) {
    case QUESTION_TYPES.SINGLE:
    case QUESTION_TYPES.MULTIPLE:
      return {
        ...base,
        options: [
          { label: '选项1', value: 'option1' },
          { label: '选项2', value: 'option2' },
        ],
      }
    case QUESTION_TYPES.RATING:
      return {
        ...base,
        maxRating: 5,
      }
    case QUESTION_TYPES.TEXT:
      return {
        ...base,
        placeholder: '请输入您的回答',
      }
    case QUESTION_TYPES.MATRIX:
      return {
        ...base,
        rows: [
          { label: '维度1', value: 'row1' },
          { label: '维度2', value: 'row2' },
        ],
        columns: [
          { label: '非常不满意', value: '1' },
          { label: '不满意', value: '2' },
          { label: '一般', value: '3' },
          { label: '满意', value: '4' },
          { label: '非常满意', value: '5' },
        ],
      }
    default:
      return base
  }
}

export function createSurvey(title = '未命名问卷') {
  return {
    id: generateId('s'),
    title,
    description: '',
    questions: [],
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function addQuestion(survey, type) {
  if (!survey) return survey
  const newQuestion = createQuestion(type)
  return {
    ...survey,
    questions: [...survey.questions, newQuestion],
    updatedAt: Date.now(),
  }
}

export function deleteQuestion(survey, questionId) {
  if (!survey || !Array.isArray(survey.questions)) return survey
  return {
    ...survey,
    questions: survey.questions.filter((q) => q.id !== questionId),
    updatedAt: Date.now(),
  }
}

export function updateQuestion(survey, questionId, updates) {
  if (!survey || !Array.isArray(survey.questions)) return survey
  return {
    ...survey,
    questions: survey.questions.map((q) =>
      q.id === questionId ? { ...q, ...updates } : q
    ),
    updatedAt: Date.now(),
  }
}

export function reorderQuestions(survey, fromIndex, toIndex) {
  if (!survey || !Array.isArray(survey.questions)) return survey
  if (fromIndex < 0 || fromIndex >= survey.questions.length) return survey
  if (toIndex < 0 || toIndex >= survey.questions.length) return survey
  if (fromIndex === toIndex) return survey

  const result = [...survey.questions]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return {
    ...survey,
    questions: result,
    updatedAt: Date.now(),
  }
}

export function addOption(survey, questionId) {
  if (!survey || !Array.isArray(survey.questions)) return survey
  return {
    ...survey,
    questions: survey.questions.map((q) => {
      if (q.id !== questionId) return q
      if (!Array.isArray(q.options)) return q
      const idx = q.options.length + 1
      return {
        ...q,
        options: [...q.options, { label: `选项${idx}`, value: `option${idx}` }],
      }
    }),
    updatedAt: Date.now(),
  }
}

export function updateOption(survey, questionId, optionIndex, updates) {
  if (!survey || !Array.isArray(survey.questions)) return survey
  return {
    ...survey,
    questions: survey.questions.map((q) => {
      if (q.id !== questionId) return q
      if (!Array.isArray(q.options)) return q
      if (optionIndex < 0 || optionIndex >= q.options.length) return q
      return {
        ...q,
        options: q.options.map((opt, i) =>
          i === optionIndex ? { ...opt, ...updates } : opt
        ),
      }
    }),
    updatedAt: Date.now(),
  }
}

export function deleteOption(survey, questionId, optionIndex) {
  if (!survey || !Array.isArray(survey.questions)) return survey
  return {
    ...survey,
    questions: survey.questions.map((q) => {
      if (q.id !== questionId) return q
      if (!Array.isArray(q.options)) return q
      if (optionIndex < 0 || optionIndex >= q.options.length) return q
      return {
        ...q,
        options: q.options.filter((_, i) => i !== optionIndex),
      }
    }),
    updatedAt: Date.now(),
  }
}

export function addMatrixRow(survey, questionId) {
  if (!survey || !Array.isArray(survey.questions)) return survey
  return {
    ...survey,
    questions: survey.questions.map((q) => {
      if (q.id !== questionId) return q
      if (!Array.isArray(q.rows)) return q
      const idx = q.rows.length + 1
      return {
        ...q,
        rows: [...q.rows, { label: `维度${idx}`, value: `row${idx}` }],
      }
    }),
    updatedAt: Date.now(),
  }
}

export function updateMatrixRow(survey, questionId, rowIndex, updates) {
  if (!survey || !Array.isArray(survey.questions)) return survey
  return {
    ...survey,
    questions: survey.questions.map((q) => {
      if (q.id !== questionId) return q
      if (!Array.isArray(q.rows)) return q
      if (rowIndex < 0 || rowIndex >= q.rows.length) return q
      return {
        ...q,
        rows: q.rows.map((row, i) =>
          i === rowIndex ? { ...row, ...updates } : row
        ),
      }
    }),
    updatedAt: Date.now(),
  }
}

export function deleteMatrixRow(survey, questionId, rowIndex) {
  if (!survey || !Array.isArray(survey.questions)) return survey
  return {
    ...survey,
    questions: survey.questions.map((q) => {
      if (q.id !== questionId) return q
      if (!Array.isArray(q.rows)) return q
      if (rowIndex < 0 || rowIndex >= q.rows.length) return q
      return {
        ...q,
        rows: q.rows.filter((_, i) => i !== rowIndex),
      }
    }),
    updatedAt: Date.now(),
  }
}

export function addMatrixColumn(survey, questionId) {
  if (!survey || !Array.isArray(survey.questions)) return survey
  return {
    ...survey,
    questions: survey.questions.map((q) => {
      if (q.id !== questionId) return q
      if (!Array.isArray(q.columns)) return q
      const idx = q.columns.length + 1
      return {
        ...q,
        columns: [...q.columns, { label: `列${idx}`, value: `${idx}` }],
      }
    }),
    updatedAt: Date.now(),
  }
}

export function updateMatrixColumn(survey, questionId, colIndex, updates) {
  if (!survey || !Array.isArray(survey.questions)) return survey
  return {
    ...survey,
    questions: survey.questions.map((q) => {
      if (q.id !== questionId) return q
      if (!Array.isArray(q.columns)) return q
      if (colIndex < 0 || colIndex >= q.columns.length) return q
      return {
        ...q,
        columns: q.columns.map((col, i) =>
          i === colIndex ? { ...col, ...updates } : col
        ),
      }
    }),
    updatedAt: Date.now(),
  }
}

export function deleteMatrixColumn(survey, questionId, colIndex) {
  if (!survey || !Array.isArray(survey.questions)) return survey
  return {
    ...survey,
    questions: survey.questions.map((q) => {
      if (q.id !== questionId) return q
      if (!Array.isArray(q.columns)) return q
      if (colIndex < 0 || colIndex >= q.columns.length) return q
      return {
        ...q,
        columns: q.columns.filter((_, i) => i !== colIndex),
      }
    }),
    updatedAt: Date.now(),
  }
}

export function publishSurvey(survey) {
  if (!survey) return survey
  return {
    ...survey,
    status: 'published',
    updatedAt: Date.now(),
  }
}

export function loadSurveys() {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(SURVEYS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveSurveys(surveys) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.setItem(SURVEYS_STORAGE_KEY, JSON.stringify(surveys))
    return true
  } catch {
    return false
  }
}

export function upsertSurvey(surveys, survey) {
  if (!Array.isArray(surveys)) return [survey]
  const idx = surveys.findIndex((s) => s.id === survey.id)
  if (idx === -1) {
    return [...surveys, survey]
  }
  const result = [...surveys]
  result[idx] = survey
  return result
}

export function removeSurvey(surveys, surveyId) {
  if (!Array.isArray(surveys)) return []
  return surveys.filter((s) => s.id !== surveyId)
}

export function loadDraft(surveyId) {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_PREFIX + surveyId)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveDraft(surveyId, answers) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.setItem(
      DRAFT_STORAGE_PREFIX + surveyId,
      JSON.stringify({ answers, savedAt: Date.now() })
    )
    return true
  } catch {
    return false
  }
}

export function clearDraft(surveyId) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_PREFIX + surveyId)
    return true
  } catch {
    return false
  }
}

export function loadResponses(surveyId) {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(RESPONSES_STORAGE_PREFIX + surveyId)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveResponse(surveyId, answers) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    const responses = loadResponses(surveyId)
    const newResponse = {
      id: generateId('r'),
      answers,
      submittedAt: Date.now(),
    }
    window.localStorage.setItem(
      RESPONSES_STORAGE_PREFIX + surveyId,
      JSON.stringify([...responses, newResponse])
    )
    return true
  } catch {
    return false
  }
}

export function clearResponses(surveyId) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.removeItem(RESPONSES_STORAGE_PREFIX + surveyId)
    return true
  } catch {
    return false
  }
}

export function validateAnswer(question, answer) {
  if (!question) return { valid: true }
  if (!question.required) return { valid: true }

  switch (question.type) {
    case QUESTION_TYPES.SINGLE:
      if (answer === undefined || answer === null || answer === '') {
        return { valid: false, message: '请选择一个选项' }
      }
      return { valid: true }
    case QUESTION_TYPES.MULTIPLE:
      if (!Array.isArray(answer) || answer.length === 0) {
        return { valid: false, message: '请至少选择一个选项' }
      }
      return { valid: true }
    case QUESTION_TYPES.RATING:
      if (answer === undefined || answer === null || answer === 0) {
        return { valid: false, message: '请进行评分' }
      }
      return { valid: true }
    case QUESTION_TYPES.TEXT:
      if (answer === undefined || answer === null || String(answer).trim() === '') {
        return { valid: false, message: '请填写内容' }
      }
      return { valid: true }
    case QUESTION_TYPES.MATRIX: {
      if (!answer || typeof answer !== 'object') {
        return { valid: false, message: '请完成所有维度的评分' }
      }
      const rowValues = question.rows || []
      for (const row of rowValues) {
        if (!answer[row.value] || answer[row.value] === '') {
          return { valid: false, message: '请完成所有维度的评分' }
        }
      }
      return { valid: true }
    }
    default:
      return { valid: true }
  }
}

export function validateAllAnswers(questions, answers) {
  if (!Array.isArray(questions)) return { valid: true, errors: {} }
  const errors = {}
  let valid = true
  questions.forEach((q) => {
    const result = validateAnswer(q, answers[q.id])
    if (!result.valid) {
      valid = false
      errors[q.id] = result.message
    }
  })
  return { valid, errors }
}

function countOption(responses, questionId, optionValue) {
  let count = 0
  responses.forEach((r) => {
    const answer = r.answers?.[questionId]
    if (answer === optionValue) count += 1
    if (Array.isArray(answer) && answer.includes(optionValue)) count += 1
  })
  return count
}

export function calculateStatistics(questions, responses) {
  if (!Array.isArray(questions) || !Array.isArray(responses)) {
    return {}
  }

  const stats = {}
  const totalResponses = responses.length

  questions.forEach((q) => {
    switch (q.type) {
      case QUESTION_TYPES.SINGLE:
      case QUESTION_TYPES.MULTIPLE: {
        const optionCounts = (q.options || []).map((opt) => ({
          label: opt.label,
          value: opt.value,
          count: countOption(responses, q.id, opt.value),
        }))
        stats[q.id] = {
          type: q.type,
          title: q.title,
          total: totalResponses,
          optionCounts,
        }
        break
      }
      case QUESTION_TYPES.RATING: {
        const max = q.maxRating || 5
        const ratingCounts = {}
        for (let i = 1; i <= max; i += 1) {
          ratingCounts[i] = 0
        }
        let sum = 0
        let ratedCount = 0
        responses.forEach((r) => {
          const rating = r.answers?.[q.id]
          if (rating && rating >= 1 && rating <= max) {
            ratingCounts[rating] += 1
            sum += rating
            ratedCount += 1
          }
        })
        stats[q.id] = {
          type: q.type,
          title: q.title,
          total: totalResponses,
          ratingCounts: Object.entries(ratingCounts).map(([k, v]) => ({
            rating: Number(k),
            count: v,
          })),
          average: ratedCount > 0 ? Number((sum / ratedCount).toFixed(2)) : 0,
        }
        break
      }
      case QUESTION_TYPES.TEXT: {
        const textAnswers = []
        responses.forEach((r) => {
          const text = r.answers?.[q.id]
          if (text && String(text).trim() !== '') {
            textAnswers.push(String(text).trim())
          }
        })
        stats[q.id] = {
          type: q.type,
          title: q.title,
          total: totalResponses,
          textAnswers,
        }
        break
      }
      case QUESTION_TYPES.MATRIX: {
        const rows = q.rows || []
        const columns = q.columns || []
        const matrixStats = rows.map((row) => {
          const colCounts = columns.map((col) => ({
            label: col.label,
            value: col.value,
            count: 0,
          }))
          responses.forEach((r) => {
            const answer = r.answers?.[q.id]?.[row.value]
            const colIdx = colCounts.findIndex((c) => c.value === answer)
            if (colIdx !== -1) {
              colCounts[colIdx].count += 1
            }
          })
          return {
            rowLabel: row.label,
            rowValue: row.value,
            colCounts,
          }
        })
        stats[q.id] = {
          type: q.type,
          title: q.title,
          total: totalResponses,
          columnLabels: columns.map((c) => c.label),
          matrixStats,
        }
        break
      }
      default:
        break
    }
  })

  return stats
}

function csvEscape(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportStatisticsToCSV(questions, statistics) {
  if (!Array.isArray(questions)) return ''
  const lines = []

  questions.forEach((q) => {
    const stat = statistics[q.id]
    if (!stat) return

    lines.push(csvEscape(q.title))
    switch (q.type) {
      case QUESTION_TYPES.SINGLE:
      case QUESTION_TYPES.MULTIPLE: {
        lines.push('选项,数量,占比')
        stat.optionCounts.forEach((oc) => {
          const ratio = stat.total > 0 ? ((oc.count / stat.total) * 100).toFixed(1) + '%' : '0%'
          lines.push(`${csvEscape(oc.label)},${oc.count},${ratio}`)
        })
        break
      }
      case QUESTION_TYPES.RATING: {
        lines.push('评分,数量,占比')
        stat.ratingCounts.forEach((rc) => {
          const ratio = stat.total > 0 ? ((rc.count / stat.total) * 100).toFixed(1) + '%' : '0%'
          lines.push(`${rc.rating}星,${rc.count},${ratio}`)
        })
        lines.push(`,平均分,${stat.average}`)
        break
      }
      case QUESTION_TYPES.TEXT: {
        lines.push('回答内容')
        stat.textAnswers.forEach((ta) => {
          lines.push(csvEscape(ta))
        })
        break
      }
      case QUESTION_TYPES.MATRIX: {
        const header = ['维度', ...stat.columnLabels].map(csvEscape).join(',')
        lines.push(header)
        stat.matrixStats.forEach((row) => {
          const rowLine = [
            csvEscape(row.rowLabel),
            ...row.colCounts.map((c) => c.count),
          ].join(',')
          lines.push(rowLine)
        })
        break
      }
      default:
        break
    }
    lines.push('')
  })

  return lines.join('\n')
}

export function downloadCSV(csvContent, filename = 'survey-statistics.csv') {
  if (typeof window === 'undefined' || !window.document) return false
  try {
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}
