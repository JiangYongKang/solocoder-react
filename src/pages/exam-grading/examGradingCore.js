export const QUESTION_TYPES = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
  ESSAY: 'essay',
}

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.SINGLE]: '单选题',
  [QUESTION_TYPES.MULTIPLE]: '多选题',
  [QUESTION_TYPES.ESSAY]: '简答题',
}

export const GRADING_RESULTS = {
  CORRECT: 'correct',
  WRONG: 'wrong',
  PARTIAL: 'partial',
  UNGRADED: 'ungraded',
}

export const GRADING_RESULT_LABELS = {
  [GRADING_RESULTS.CORRECT]: '对',
  [GRADING_RESULTS.WRONG]: '错',
  [GRADING_RESULTS.PARTIAL]: '半对',
  [GRADING_RESULTS.UNGRADED]: '未评',
}

export const STUDENT_STATUS = {
  UNGRADED: 'ungraded',
  GRADED: 'graded',
  REVIEW: 'review',
}

export const STUDENT_STATUS_LABELS = {
  [STUDENT_STATUS.UNGRADED]: '未阅',
  [STUDENT_STATUS.GRADED]: '已阅',
  [STUDENT_STATUS.REVIEW]: '待复查',
}

export const FILTER_OPTIONS = {
  ALL: 'all',
  GRADED: 'graded',
  UNGRADED: 'ungraded',
  REVIEW: 'review',
}

export const FILTER_OPTION_LABELS = {
  [FILTER_OPTIONS.ALL]: '全部',
  [FILTER_OPTIONS.GRADED]: '已阅',
  [FILTER_OPTIONS.UNGRADED]: '未阅',
  [FILTER_OPTIONS.REVIEW]: '待复查',
}

export const MOCK_QUESTIONS = [
  {
    id: 'q1',
    type: QUESTION_TYPES.SINGLE,
    stem: '下列哪个选项中，哪个是 JavaScript 的基本数据类型？',
    score: 5,
    options: [
      { label: 'A', value: 'A', text: 'Object' },
      { label: 'B', value: 'B', text: 'Array' },
      { label: 'C', value: 'C', text: 'String' },
      { label: 'D', value: 'D', text: 'Function' },
    ],
    answer: 'C',
  },
  {
    id: 'q2',
    type: QUESTION_TYPES.SINGLE,
    stem: 'React 中用于管理组件状态的 Hook 是？',
    score: 5,
    options: [
      { label: 'A', value: 'A', text: 'useEffect' },
      { label: 'B', value: 'B', text: 'useState' },
      { label: 'C', value: 'C', text: 'useContext' },
      { label: 'D', value: 'D', text: 'useMemo' },
    ],
    answer: 'B',
  },
  {
    id: 'q3',
    type: QUESTION_TYPES.MULTIPLE,
    stem: '以下哪些是 React 的 Hook？（多选）',
    score: 10,
    options: [
      { label: 'A', value: 'A', text: 'useState' },
      { label: 'B', value: 'B', text: 'useEffect' },
      { label: 'C', value: 'C', text: 'useCallback' },
      { label: 'D', value: 'D', text: 'useData' },
    ],
    answer: ['A', 'B', 'C'],
  },
  {
    id: 'q4',
    type: QUESTION_TYPES.ESSAY,
    stem: '请简述 React 中虚拟 DOM 的工作原理及其优势。',
    score: 20,
    answer: '虚拟 DOM 是 React 的核心概念之一。工作原理：1) 当状态变化时，React 会重新渲染整个组件树，生成新的虚拟 DOM 树；2) 通过 Diff 算法对比新旧虚拟 DOM 树的差异；3) 将差异部分批量更新到真实 DOM 中。优势：1) 减少直接操作真实 DOM 的次数，提高性能；2) 提供声明式编程模型，简化开发；3) 跨平台能力，可用于 React Native 等。',
  },
  {
    id: 'q5',
    type: QUESTION_TYPES.ESSAY,
    stem: '请解释什么是闭包（Closure），并举一个实际应用场景。',
    score: 20,
    answer: '闭包是指一个函数能够访问其词法作用域中的变量，即使该函数在其词法作用域之外执行。闭包的实际应用场景包括：1) 数据私有化和封装；2) 函数柯里化；3) 回调函数和事件处理程序；4) 模块化编程。例如：function counter() { let count = 0; return function() { return ++count; }; }',
  },
  {
    id: 'q6',
    type: QUESTION_TYPES.ESSAY,
    stem: '什么是 HTTP 协议？请列举至少 3 种常见的 HTTP 请求方法及其用途。',
    answer: 'HTTP（超文本传输协议）是用于在 Web 浏览器和服务器之间传输超文本的应用层协议。常见请求方法：1) GET：获取资源；2) POST：提交数据创建资源；3) PUT：更新资源；4) DELETE：删除资源；5) PATCH：部分更新资源；6) HEAD：获取响应头；7) OPTIONS：获取服务器支持的方法。',
    score: 15,
  },
]

export const MOCK_STUDENTS = [
  { id: 's1', name: '张三', studentNo: '2024001' },
  { id: 's2', name: '李四', studentNo: '2024002' },
  { id: 's3', name: '王五', studentNo: '2024003' },
  { id: 's4', name: '赵六', studentNo: '2024004' },
  { id: 's5', name: '孙七', studentNo: '2024005' },
  { id: 's6', name: '周八', studentNo: '2024006' },
  { id: 's7', name: '吴九', studentNo: '2024007' },
  { id: 's8', name: '郑十', studentNo: '2024008' },
]

const ESSAY_ANSWER_SAMPLES = [
  '虚拟 DOM 的工作原理是通过在内存中构建 DOM 树，然后对比差异来优化渲染。它的优势是性能好，开发效率高。',
  '闭包就是函数里面套函数，内部函数可以访问外部函数的变量。常用在封装数据。',
  'HTTP 是网络协议，GET 用来获取，POST 用来提交。',
  '我对这个问题不太清楚，简单说一下我的理解吧。',
  '',
]

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function generateRandomAnswer(question) {
  if (!question) return null
  switch (question.type) {
    case QUESTION_TYPES.SINGLE: {
      const opts = question.options || []
      if (opts.length === 0) return ''
      const randomIndex = Math.floor(Math.random() * opts.length)
      return opts[randomIndex].value
    }
    case QUESTION_TYPES.MULTIPLE: {
      const opts = question.options || []
      if (opts.length === 0) return []
      const count = Math.floor(Math.random() * (opts.length - 1)) + 1
      const shuffled = [...opts].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, count).map((o) => o.value).sort()
    }
    case QUESTION_TYPES.ESSAY: {
      return ESSAY_ANSWER_SAMPLES[Math.floor(Math.random() * ESSAY_ANSWER_SAMPLES.length)]
    }
    default:
      return null
  }
}

export function generateStudentAnswers(questions) {
  if (!Array.isArray(questions)) return {}
  const answers = {}
  for (const q of questions) {
    answers[q.id] = generateRandomAnswer(q)
  }
  return answers
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

export function autoGradeQuestion(question, studentAnswer) {
  if (!question) return { result: GRADING_RESULTS.UNGRADED, score: 0 }
  const fullScore = Number(question.score) || 0
  switch (question.type) {
    case QUESTION_TYPES.SINGLE: {
      const correct = String(studentAnswer) === String(question.answer)
      return {
        result: correct ? GRADING_RESULTS.CORRECT : GRADING_RESULTS.WRONG,
        score: correct ? fullScore : 0,
      }
    }
    case QUESTION_TYPES.MULTIPLE: {
      const correct = arraysEqualAsSets(studentAnswer, question.answer)
      return {
        result: correct ? GRADING_RESULTS.CORRECT : GRADING_RESULTS.WRONG,
        score: correct ? fullScore : 0,
      }
    }
    case QUESTION_TYPES.ESSAY:
    default:
      return { result: GRADING_RESULTS.UNGRADED, score: 0 }
  }
}

export function createInitialGradingState(questions, students) {
  const grading = {}
  for (const student of students) {
    const answers = generateStudentAnswers(questions)
    const questionGrades = {}
    for (const q of questions) {
      const autoGraded = autoGradeQuestion(q, answers[q.id])
      questionGrades[q.id] = {
        result: autoGraded.result,
        score: autoGraded.score,
        comment: '',
      }
    }
    grading[student.id] = {
      studentId: student.id,
      answers,
      questionGrades,
      status: STUDENT_STATUS.UNGRADED,
      startedAt: null,
      completedAt: null,
      needsReview: false,
    }
  }
  return grading
}

export function getQuestionGrade(gradingState, studentId, questionId) {
  return gradingState?.[studentId]?.questionGrades?.[questionId] || null
}

export function updateQuestionGrade(gradingState, studentId, questionId, updates) {
  if (!gradingState || !gradingState[studentId]) return gradingState
  const current = gradingState[studentId].questionGrades[questionId] || { result: GRADING_RESULTS.UNGRADED, score: 0, comment: '' }
  return {
    ...gradingState,
    [studentId]: {
      ...gradingState[studentId],
      questionGrades: {
        ...gradingState[studentId].questionGrades,
        [questionId]: { ...current, ...updates },
      },
    },
  }
}

export function calculateStudentScore(gradingState, studentId, questions) {
  const studentGrading = gradingState?.[studentId]
  if (!studentGrading || !Array.isArray(questions)) return { total: 0, maxScore: 0, details: [] }
  const details = questions.map((q) => {
    const grade = studentGrading.questionGrades[q.id] || { result: GRADING_RESULTS.UNGRADED, score: 0 }
    return {
      questionId: q.id,
      questionIndex: questions.indexOf(q) + 1,
      maxScore: Number(q.score) || 0,
      score: Number(grade.score) || 0,
      result: grade.result,
    }
  })
  const total = details.reduce((sum, d) => sum + d.score, 0)
  const maxScore = details.reduce((sum, d) => sum + d.maxScore, 0)
  return { total, maxScore, details }
}

export function isStudentAllGraded(gradingState, studentId, questions) {
  const studentGrading = gradingState?.[studentId]
  if (!studentGrading || !Array.isArray(questions)) return false
  return questions.every((q) => {
    const grade = studentGrading.questionGrades[q.id]
    return grade && grade.result !== GRADING_RESULTS.UNGRADED
  })
}

export function updateStudentStatus(gradingState, studentId, status) {
  if (!gradingState || !gradingState[studentId]) return gradingState
  const current = gradingState[studentId]
  const updates = { status }
  if (status === STUDENT_STATUS.GRADED && current.status !== STUDENT_STATUS.GRADED) {
    updates.completedAt = Date.now()
  }
  if (status === STUDENT_STATUS.UNGRADED && current.startedAt === null) {
    updates.startedAt = Date.now()
  }
  return {
    ...gradingState,
    [studentId]: { ...current, ...updates },
  }
}

export function toggleStudentReview(gradingState, studentId) {
  if (!gradingState || !gradingState[studentId]) return gradingState
  const current = gradingState[studentId]
  const needsReview = !current.needsReview
  return {
    ...gradingState,
    [studentId]: {
      ...current,
      needsReview,
      status: needsReview ? STUDENT_STATUS.REVIEW : (current.completedAt ? STUDENT_STATUS.GRADED : STUDENT_STATUS.UNGRADED),
    },
  }
}

export function getGradingProgress(gradingState, students) {
  const total = students.length
  let gradedCount = 0
  let reviewCount = 0
  let ungradedCount = 0
  const durations = []
  for (const s of students) {
    const g = gradingState[s.id]
    if (g) {
      if (g.status === STUDENT_STATUS.GRADED && !g.needsReview) {
        gradedCount += 1
        if (g.startedAt && g.completedAt) {
          durations.push(g.completedAt - g.startedAt)
        }
      } else if (g.needsReview || g.status === STUDENT_STATUS.REVIEW) {
        reviewCount += 1
      } else {
        ungradedCount += 1
      }
    } else {
      ungradedCount += 1
    }
  }
  const percentage = total === 0 ? 0 : Math.round((gradedCount / total) * 100)
  const avgDuration = durations.length === 0 ? 0 : durations.reduce((a, b) => a + b, 0) / durations.length
  const minDuration = durations.length === 0 ? 0 : Math.min(...durations)
  const maxDuration = durations.length === 0 ? 0 : Math.max(...durations)
  const remainingCount = total - gradedCount
  const estimatedRemainingMs = remainingCount * avgDuration
  return {
    total,
    gradedCount,
    ungradedCount,
    reviewCount,
    percentage,
    avgDuration,
    minDuration,
    maxDuration,
    estimatedRemainingMs,
  }
}

export function filterStudents(students, gradingState, filter) {
  if (!Array.isArray(students)) return []
  if (!filter || filter === FILTER_OPTIONS.ALL) return students
  return students.filter((s) => {
    const g = gradingState[s.id]
    if (!g) return filter === FILTER_OPTIONS.UNGRADED
    switch (filter) {
      case FILTER_OPTIONS.GRADED:
        return g.status === STUDENT_STATUS.GRADED && !g.needsReview
      case FILTER_OPTIONS.UNGRADED:
        return g.status === STUDENT_STATUS.UNGRADED && !g.needsReview
      case FILTER_OPTIONS.REVIEW:
        return g.needsReview || g.status === STUDENT_STATUS.REVIEW
      default:
        return true
    }
  })
}

export function findNextUngradedStudent(students, gradingState, currentStudentId) {
  if (!Array.isArray(students)) return null
  const currentIndex = students.findIndex((s) => s.id === currentStudentId)
  for (let i = currentIndex + 1; i < students.length; i += 1) {
    const g = gradingState[students[i].id]
    if (!g || g.status === STUDENT_STATUS.UNGRADED) {
      return students[i]
    }
  }
  for (let i = 0; i < currentIndex; i += 1) {
    const g = gradingState[students[i].id]
    if (!g || g.status === STUDENT_STATUS.UNGRADED) {
      return students[i]
    }
  }
  return null
}

export function pickRandomStudentsForReview(students, gradingState, count = 2) {
  if (!Array.isArray(students) || students.length === 0) return []
  const candidates = students.filter((s) => {
    const g = gradingState[s.id]
    return g && !g.needsReview
  })
  if (candidates.length === 0) return []
  const safeCount = Math.min(count, candidates.length)
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, safeCount)
}

export function formatDurationMs(ms) {
  if (!ms || ms <= 0) return '0秒'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}小时${minutes}分${seconds}秒`
  }
  if (minutes > 0) {
    return `${minutes}分${seconds}秒`
  }
  return `${seconds}秒`
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function escapeCSVValue(value) {
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function generateCSVContent(students, questions, gradingState) {
  const questionHeaders = questions.map((q, i) => `第${i + 1}题得分`)
  const header = ['学生姓名', '学号', '总分', ...questionHeaders, '阅卷状态', '阅卷完成时间']
  const rows = students.map((student) => {
    const g = gradingState[student.id]
    const { total } = calculateStudentScore(gradingState, student.id, questions)
    const statusLabel = g
      ? (g.needsReview
        ? STUDENT_STATUS_LABELS[STUDENT_STATUS.REVIEW]
        : STUDENT_STATUS_LABELS[g.status])
      : STUDENT_STATUS_LABELS[STUDENT_STATUS.UNGRADED]
    const completedAt = g?.completedAt ? formatTimestamp(g.completedAt) : ''
    const questionScores = questions.map((q) => {
      const grade = g?.questionGrades?.[q.id]
      const hasScore = grade && grade.result !== GRADING_RESULTS.UNGRADED
      return hasScore ? String(grade.score) : ''
    })
    return [student.name, student.studentNo, String(total), ...questionScores, statusLabel, completedAt]
  })
  const csvContent = [header, ...rows].map((row) => row.map(escapeCSVValue).join(',')).join('\n')
  return { csvContent, header, rows }
}

export function getStudentStatusLabel(gradingState, studentId) {
  const g = gradingState?.[studentId]
  if (!g) return STUDENT_STATUS_LABELS[STUDENT_STATUS.UNGRADED]
  if (g.needsReview) return STUDENT_STATUS_LABELS[STUDENT_STATUS.REVIEW]
  return STUDENT_STATUS_LABELS[g.status]
}

export function isAutoGradable(question) {
  if (!question) return false
  return question.type === QUESTION_TYPES.SINGLE || question.type === QUESTION_TYPES.MULTIPLE
}

export function getDefaultScoreForResult(question, result) {
  const fullScore = Number(question?.score) || 0
  switch (result) {
    case GRADING_RESULTS.CORRECT:
      return fullScore
    case GRADING_RESULTS.WRONG:
      return 0
    case GRADING_RESULTS.PARTIAL:
      return Math.round(fullScore / 2)
    default:
      return 0
  }
}

export function downloadCSV(csvContent, filename) {
  if (typeof window === 'undefined') return false
  try {
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

export function generateCSVFilename() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `阅卷成绩_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.csv`
}
