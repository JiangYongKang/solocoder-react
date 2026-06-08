export const QUESTION_TYPES = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
  FILL: 'fill',
}

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.SINGLE]: '单选题',
  [QUESTION_TYPES.MULTIPLE]: '多选题',
  [QUESTION_TYPES.FILL]: '填空题',
}

export const WRONG_ANSWER_HINT = '请仔细复习相关知识点，理解正确答案的推导过程，避免下次再犯同样的错误。'

const QUESTIONS_STORAGE_KEY = 'exam_questions'
const EXAM_DRAFT_STORAGE_PREFIX = 'exam_draft_'
const EXAM_HISTORY_STORAGE_KEY = 'exam_history'

let idCounter = 0

export function generateId(prefix = 'id') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function createQuestion(type = QUESTION_TYPES.SINGLE) {
  const base = {
    id: generateId('q'),
    type,
    stem: '',
    score: 5,
  }

  switch (type) {
    case QUESTION_TYPES.SINGLE:
    case QUESTION_TYPES.MULTIPLE:
      return {
        ...base,
        options: [
          { label: 'A', value: 'A', text: '' },
          { label: 'B', value: 'B', text: '' },
          { label: 'C', value: 'C', text: '' },
          { label: 'D', value: 'D', text: '' },
        ],
        answer: type === QUESTION_TYPES.MULTIPLE ? [] : '',
      }
    case QUESTION_TYPES.FILL:
      return {
        ...base,
        answer: '',
      }
    default:
      return base
  }
}

export function validateQuestion(question) {
  if (!question) return { valid: false, message: '题目不存在' }
  if (!question.stem || question.stem.trim() === '') {
    return { valid: false, message: '题干不能为空' }
  }
  if (!question.score || question.score <= 0) {
    return { valid: false, message: '分值必须大于 0' }
  }
  if (question.type === QUESTION_TYPES.SINGLE || question.type === QUESTION_TYPES.MULTIPLE) {
    if (!Array.isArray(question.options) || question.options.length < 2) {
      return { valid: false, message: '选择题至少需要 2 个选项' }
    }
    const filledOptions = question.options.filter((o) => o.text && o.text.trim() !== '')
    if (filledOptions.length < 2) {
      return { valid: false, message: '至少需要 2 个填写了内容的选项' }
    }
  }
  if (question.type === QUESTION_TYPES.SINGLE) {
    if (!question.answer || question.answer === '') {
      return { valid: false, message: '请设置正确答案' }
    }
  }
  if (question.type === QUESTION_TYPES.MULTIPLE) {
    if (!Array.isArray(question.answer) || question.answer.length === 0) {
      return { valid: false, message: '请设置正确答案（至少选择一个）' }
    }
  }
  if (question.type === QUESTION_TYPES.FILL) {
    if (!question.answer || String(question.answer).trim() === '') {
      return { valid: false, message: '请设置正确答案' }
    }
  }
  return { valid: true }
}

export function loadQuestions() {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(QUESTIONS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveQuestions(questions) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions))
    return true
  } catch {
    return false
  }
}

export function addQuestion(questions, question) {
  if (!Array.isArray(questions)) return [question]
  return [...questions, question]
}

export function updateQuestion(questions, questionId, updates) {
  if (!Array.isArray(questions)) return []
  return questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
}

export function deleteQuestion(questions, questionId) {
  if (!Array.isArray(questions)) return []
  return questions.filter((q) => q.id !== questionId)
}

export function filterQuestions(questions, { type = '', keyword = '' } = {}) {
  if (!Array.isArray(questions)) return []
  return questions.filter((q) => {
    if (type && q.type !== type) return false
    if (keyword) {
      const kw = keyword.trim().toLowerCase()
      if (!q.stem || !q.stem.toLowerCase().includes(kw)) return false
    }
    return true
  })
}

export function paginateQuestions(questions, page = 1, pageSize = 10) {
  if (!Array.isArray(questions)) return { items: [], total: 0, totalPages: 0, page: 1, pageSize }
  const total = questions.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const items = questions.slice(start, start + pageSize)
  return { items, total, totalPages, page: safePage, pageSize }
}

export function shuffleArray(arr) {
  if (!Array.isArray(arr)) return []
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = result[i]
    result[i] = result[j]
    result[j] = tmp
  }
  return result
}

function greedyPick(questions, targetScore) {
  const shuffled = shuffleArray(questions)
  const selected = []
  let accumulated = 0
  for (const q of shuffled) {
    if (accumulated >= targetScore) break
    const qScore = Number(q.score) || 0
    if (accumulated + qScore <= targetScore) {
      selected.push(q)
      accumulated += qScore
    }
  }
  return { selected, accumulated }
}

export function generateExam(questions, { name = '', duration = 60, totalScore = 100 } = {}) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return { ok: false, message: '题库为空，请先添加题目' }
  }
  const targetScore = Number(totalScore) || 100
  const totalBankScore = questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0)
  if (totalBankScore < targetScore) {
    return {
      ok: false,
      message: `题库总分（${totalBankScore}）不足，无法组出总分 ${targetScore} 的试卷`,
    }
  }

  // 重试次数与题库规模正相关：题库越大，潜在组合越多，需要更多尝试才能找到精确匹配
  // 基础 50 次，每 10 道题额外增加 10 次，上限 500 次避免极端情况耗时过长
  const MAX_ATTEMPTS = Math.min(500, 50 + Math.floor(questions.length / 10) * 10)

  let best = null
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const pick = greedyPick(questions, targetScore)
    if (pick.accumulated === targetScore) {
      best = pick
      break
    }
    if (!best || Math.abs(pick.accumulated - targetScore) < Math.abs(best.accumulated - targetScore)) {
      best = pick
    }
  }

  if (!best || best.selected.length === 0) {
    return { ok: false, message: '未能选出合适的题目，请调整总分或检查题库' }
  }

  const exam = {
    id: generateId('exam'),
    name: name || `考试_${new Date().toLocaleDateString()}`,
    duration: Number(duration) || 60,
    totalScore: best.accumulated,
    targetScore,
    questions: best.selected,
    isExactScore: best.accumulated === targetScore,
    createdAt: Date.now(),
  }

  return { ok: true, exam }
}

export function loadExamDraft(examId) {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    const raw = window.localStorage.getItem(EXAM_DRAFT_STORAGE_PREFIX + examId)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveExamDraft(examId, data) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.setItem(
      EXAM_DRAFT_STORAGE_PREFIX + examId,
      JSON.stringify({ ...data, savedAt: Date.now() })
    )
    return true
  } catch {
    return false
  }
}

export function clearExamDraft(examId) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.removeItem(EXAM_DRAFT_STORAGE_PREFIX + examId)
    return true
  } catch {
    return false
  }
}

export function isDraftExpired(draft, now = Date.now()) {
  if (!draft || !draft.exam) return true
  const durationMs = (Number(draft.exam.duration) || 0) * 60 * 1000
  const startedAt = Number(draft.startedAt) || 0
  if (durationMs <= 0 || startedAt <= 0) return false
  return now - startedAt >= durationMs
}

function getAllExamDrafts() {
  if (typeof window === 'undefined' || !window.localStorage) return []
  const prefixLen = EXAM_DRAFT_STORAGE_PREFIX.length
  const drafts = []
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (key && key.startsWith(EXAM_DRAFT_STORAGE_PREFIX)) {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue
      try {
        const parsed = JSON.parse(raw)
        if (parsed && parsed.exam) {
          drafts.push({
            examId: key.slice(prefixLen),
            draft: parsed,
          })
        }
      } catch {
        // ignore corrupted entry
      }
    }
  }
  return drafts
}

export function cleanupExpiredExamDrafts() {
  if (typeof window === 'undefined' || !window.localStorage) return 0
  let removed = 0
  const drafts = getAllExamDrafts()
  for (const { examId, draft } of drafts) {
    if (isDraftExpired(draft)) {
      window.localStorage.removeItem(EXAM_DRAFT_STORAGE_PREFIX + examId)
      removed += 1
    }
  }
  return removed
}

export function findActiveExamDraft() {
  const drafts = getAllExamDrafts()
  let latest = null
  for (const { examId, draft } of drafts) {
    if (isDraftExpired(draft)) continue
    if (!latest || (draft.savedAt || 0) >= (latest.draft.savedAt || 0)) {
      latest = { examId, draft }
    }
  }
  if (!latest) return null
  return { ...latest.draft, examId: latest.examId }
}

function arraysEqualAsSets(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  const setA = new Set(a.map((x) => String(x)))
  const setB = new Set(b.map((x) => String(x)))
  if (setA.size !== setB.size) return false
  for (const item of setA) {
    if (!setB.has(item)) return false
  }
  return true
}

export function gradeQuestion(question, userAnswer) {
  if (!question) return { score: 0, correct: false }
  const fullScore = Number(question.score) || 0

  switch (question.type) {
    case QUESTION_TYPES.SINGLE: {
      const correct = String(userAnswer) === String(question.answer)
      return { score: correct ? fullScore : 0, correct }
    }
    case QUESTION_TYPES.MULTIPLE: {
      const correct = arraysEqualAsSets(userAnswer, question.answer)
      return { score: correct ? fullScore : 0, correct }
    }
    case QUESTION_TYPES.FILL: {
      const userStr = String(userAnswer ?? '').trim()
      const answerStr = String(question.answer ?? '').trim()
      const correct = userStr === answerStr
      return { score: correct ? fullScore : 0, correct }
    }
    default:
      return { score: 0, correct: false }
  }
}

export function gradeExam(exam, answers) {
  if (!exam || !Array.isArray(exam.questions)) {
    return { totalScore: 0, maxScore: 0, results: [] }
  }
  const results = exam.questions.map((q) => {
    const userAnswer = answers?.[q.id]
    const graded = gradeQuestion(q, userAnswer)
    return {
      questionId: q.id,
      question: q,
      userAnswer,
      correctAnswer: q.answer,
      score: graded.score,
      maxScore: Number(q.score) || 0,
      correct: graded.correct,
      hint: graded.correct ? '' : WRONG_ANSWER_HINT,
    }
  })
  const totalScore = results.reduce((sum, r) => sum + r.score, 0)
  const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0)
  return { totalScore, maxScore, results }
}

export function loadExamHistory() {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(EXAM_HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveExamHistory(history) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.setItem(EXAM_HISTORY_STORAGE_KEY, JSON.stringify(history))
    return true
  } catch {
    return false
  }
}

export function addExamRecord(history, record) {
  if (!Array.isArray(history)) return [record]
  return [...history, record]
}

export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0分0秒'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}

export function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function getUserAnswerDisplay(question, userAnswer) {
  if (!question) return ''
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return '（未作答）'
  }
  switch (question.type) {
    case QUESTION_TYPES.SINGLE: {
      const opt = (question.options || []).find((o) => String(o.value) === String(userAnswer))
      return opt ? `${opt.label}. ${opt.text}` : String(userAnswer)
    }
    case QUESTION_TYPES.MULTIPLE: {
      if (!Array.isArray(userAnswer)) return '（未作答）'
      if (userAnswer.length === 0) return '（未作答）'
      return userAnswer
        .map((v) => {
          const opt = (question.options || []).find((o) => String(o.value) === String(v))
          return opt ? `${opt.label}. ${opt.text}` : String(v)
        })
        .join('；')
    }
    case QUESTION_TYPES.FILL:
      return String(userAnswer)
    default:
      return String(userAnswer)
  }
}

export function getCorrectAnswerDisplay(question) {
  if (!question) return ''
  switch (question.type) {
    case QUESTION_TYPES.SINGLE: {
      const opt = (question.options || []).find((o) => String(o.value) === String(question.answer))
      return opt ? `${opt.label}. ${opt.text}` : String(question.answer)
    }
    case QUESTION_TYPES.MULTIPLE: {
      if (!Array.isArray(question.answer)) return ''
      return question.answer
        .map((v) => {
          const opt = (question.options || []).find((o) => String(o.value) === String(v))
          return opt ? `${opt.label}. ${opt.text}` : String(v)
        })
        .join('；')
    }
    case QUESTION_TYPES.FILL:
      return String(question.answer)
    default:
      return String(question.answer)
  }
}
