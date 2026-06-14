const STORAGE_KEY = 'grade_manager_data'
const PREVIOUS_STORAGE_KEY = 'grade_manager_previous_data'

export const DEFAULT_SUBJECTS = ['语文', '数学', '英语', '物理', '化学']

export const SCORE_RANGES = [
  { label: '不及格', min: 0, max: 59, color: '#ff6b6b' },
  { label: '及格', min: 60, max: 69, color: '#ffa94d' },
  { label: '中等', min: 70, max: 79, color: '#ffd43b' },
  { label: '良好', min: 80, max: 89, color: '#69db7c' },
  { label: '优秀', min: 90, max: 100, color: '#339af0' },
  { label: '异常', min: 101, max: 150, color: '#845ef7' },
]

export const VIEWS = {
  STUDENT: 'student',
  SUBJECT: 'subject',
}

export function createInitialState() {
  return {
    students: [],
    subjects: [...DEFAULT_SUBJECTS],
    scores: {},
  }
}

export function loadGradeData() {
  if (typeof window === 'undefined' || !window.localStorage) return createInitialState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw)
    if (!parsed.students || !parsed.subjects || !parsed.scores) return createInitialState()
    return {
      students: parsed.students,
      subjects: parsed.subjects,
      scores: parsed.scores,
    }
  } catch {
    return createInitialState()
  }
}

export function saveGradeData(data) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    const cleanData = {
      students: data.students,
      subjects: data.subjects,
      scores: data.scores,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData))
    return true
  } catch {
    return false
  }
}

export function snapshotPreviousData() {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    const existingRaw = window.localStorage.getItem(PREVIOUS_STORAGE_KEY)
    if (existingRaw) {
      try {
        const existing = JSON.parse(existingRaw)
        if (
          existing &&
          Array.isArray(existing.students) &&
          Array.isArray(existing.subjects) &&
          existing.scores &&
          typeof existing.scores === 'object' &&
          !Array.isArray(existing.scores)
        ) {
          return false
        }
      } catch {
      }
    }
    const current = loadGradeData()
    window.localStorage.setItem(PREVIOUS_STORAGE_KEY, JSON.stringify(current))
    return true
  } catch {
    return false
  }
}

export function loadPreviousData() {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    const raw = window.localStorage.getItem(PREVIOUS_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function validateScore(score) {
  if (score === '' || score === null || score === undefined) {
    return { valid: false, message: '分数不能为空' }
  }
  const num = Number(score)
  if (Number.isNaN(num)) return { valid: false, message: '分数必须是数字' }
  if (num < 0 || num > 150) return { valid: false, message: '分数范围必须在 0-150 之间' }
  return { valid: true, value: num }
}

export function addStudent(data, studentName) {
  const name = studentName?.trim()
  if (!name) return { error: '学生姓名不能为空' }
  if (data.students.includes(name)) return { error: '学生姓名已存在' }

  const newScores = { ...data.scores }
  if (!newScores[name]) newScores[name] = {}
  for (const subject of data.subjects) {
    if (newScores[name][subject] === undefined) {
      newScores[name][subject] = null
    }
  }

  return {
    students: [...data.students, name],
    subjects: data.subjects,
    scores: newScores,
  }
}

export function removeStudent(data, studentName) {
  const newScores = { ...data.scores }
  delete newScores[studentName]

  return {
    students: data.students.filter((s) => s !== studentName),
    subjects: data.subjects,
    scores: newScores,
  }
}

export function addSubject(data, subjectName) {
  const name = subjectName?.trim()
  if (!name) return { error: '科目名称不能为空' }
  if (data.subjects.includes(name)) return { error: '科目已存在' }

  const newScores = { ...data.scores }
  for (const student of data.students) {
    if (!newScores[student]) newScores[student] = {}
    newScores[student][name] = null
  }

  return {
    students: data.students,
    subjects: [...data.subjects, name],
    scores: newScores,
  }
}

export function removeSubject(data, subjectName) {
  const newScores = { ...data.scores }
  for (const student of data.students) {
    if (newScores[student]) {
      const { [subjectName]: _, ...rest } = newScores[student]
      newScores[student] = rest
    }
  }

  return {
    students: data.students,
    subjects: data.subjects.filter((s) => s !== subjectName),
    scores: newScores,
  }
}

export function updateScore(data, studentName, subjectName, score) {
  if (score === null || score === undefined || score === '') {
    const newScores = {
      ...data.scores,
      [studentName]: {
        ...data.scores[studentName],
        [subjectName]: null,
      },
    }
    return {
      students: data.students,
      subjects: data.subjects,
      scores: newScores,
    }
  }

  const validation = validateScore(score)
  if (!validation.valid) return { error: validation.message }

  const newScores = {
    ...data.scores,
    [studentName]: {
      ...data.scores[studentName],
      [subjectName]: validation.value,
    },
  }

  return {
    students: data.students,
    subjects: data.subjects,
    scores: newScores,
  }
}

export function getStudentTotal(data, studentName) {
  const scores = data.scores[studentName]
  if (!scores) return 0
  return data.subjects.reduce((sum, subject) => {
    const score = scores[subject]
    return sum + (score !== null && score !== undefined ? Number(score) : 0)
  }, 0)
}

export function getStudentAverage(data, studentName) {
  const scores = data.scores[studentName]
  if (!scores) return 0
  const validScores = data.subjects.filter(
    (subject) => scores[subject] !== null && scores[subject] !== undefined
  )
  if (validScores.length === 0) return 0
  const total = validScores.reduce((sum, subject) => sum + Number(scores[subject]), 0)
  return total / validScores.length
}

export function getSubjectScores(data, subjectName) {
  return data.students
    .map((student) => {
      const score = data.scores[student]?.[subjectName]
      return score !== null && score !== undefined ? Number(score) : null
    })
    .filter((s) => s !== null)
}

export function calculateMean(scores) {
  if (!Array.isArray(scores) || scores.length === 0) return 0
  const sum = scores.reduce((acc, s) => acc + Number(s), 0)
  return sum / scores.length
}

export function calculateMedian(scores) {
  if (!Array.isArray(scores) || scores.length === 0) return 0
  const sorted = [...scores].map(Number).sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

export function calculateStandardDeviation(scores) {
  if (!Array.isArray(scores) || scores.length === 0) return 0
  const mean = calculateMean(scores)
  const squaredDiffs = scores.map((s) => Math.pow(Number(s) - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((acc, d) => acc + d, 0) / scores.length
  return Math.sqrt(avgSquaredDiff)
}

export function getSubjectStats(data, subjectName) {
  const scores = getSubjectScores(data, subjectName)
  if (scores.length === 0) {
    return {
      subject: subjectName,
      mean: 0,
      max: 0,
      min: 0,
      median: 0,
      stdDev: 0,
      count: 0,
    }
  }
  return {
    subject: subjectName,
    mean: Number(calculateMean(scores).toFixed(2)),
    max: Number(Math.max(...scores).toFixed(2)),
    min: Number(Math.min(...scores).toFixed(2)),
    median: Number(calculateMedian(scores).toFixed(2)),
    stdDev: Number(calculateStandardDeviation(scores).toFixed(2)),
    count: scores.length,
  }
}

export function getAllSubjectStats(data) {
  return data.subjects.map((subject) => getSubjectStats(data, subject))
}

export function getScoreDistribution(scores) {
  const distribution = SCORE_RANGES.map((range) => ({
    ...range,
    count: 0,
  }))

  for (const score of scores) {
    const num = Number(score)
    for (let i = 0; i < distribution.length; i += 1) {
      const range = distribution[i]
      if (num >= range.min && num <= range.max) {
        range.count += 1
        break
      }
    }
  }

  return distribution
}

export function calculateRankings(data, sortBy = 'total') {
  const studentsWithStats = data.students.map((student) => {
    const total = getStudentTotal(data, student)
    const average = getStudentAverage(data, student)
    const scores = { ...data.scores[student] }
    return { name: student, total, average, scores }
  })

  let sorted
  if (sortBy === 'total') {
    sorted = [...studentsWithStats].sort((a, b) => b.total - a.total)
  } else if (data.subjects.includes(sortBy)) {
    sorted = [...studentsWithStats].sort((a, b) => {
      const scoreA = a.scores[sortBy] ?? -1
      const scoreB = b.scores[sortBy] ?? -1
      return Number(scoreB) - Number(scoreA)
    })
  } else {
    sorted = [...studentsWithStats].sort((a, b) => b.total - a.total)
  }

  const rankings = []
  let currentRank = 1
  let previousValue = null

  for (let i = 0; i < sorted.length; i += 1) {
    const student = sorted[i]
    const currentValue = sortBy === 'total' ? student.total : student.scores[sortBy] ?? -1

    if (i > 0 && currentValue !== previousValue) {
      currentRank = i + 1
    }

    rankings.push({
      rank: currentRank,
      ...student,
    })

    previousValue = currentValue
  }

  return rankings
}

export function calculateRankChanges(currentRankings, previousData, sortBy = 'total') {
  if (!previousData || !previousData.students || previousData.students.length === 0) {
    return currentRankings.map((r) => ({ ...r, change: 0 }))
  }

  const previousRankings = calculateRankings(previousData, sortBy)
  const previousRankMap = new Map()
  for (const r of previousRankings) {
    previousRankMap.set(r.name, r.rank)
  }

  return currentRankings.map((r) => {
    const previousRank = previousRankMap.get(r.name)
    if (previousRank === undefined) {
      return { ...r, change: null }
    }
    return { ...r, change: previousRank - r.rank }
  })
}

export function parsePastedData(text, data) {
  const lines = text.split('\n')
  const result = {
    students: [...data.students],
    subjects: [...data.subjects],
    scores: { ...data.scores },
    errors: [],
    addedStudents: [],
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (!line.trim()) continue

    const parts = line.split(/\t|,|，/).map((p) => p.trim())
    const studentName = parts[0]

    if (!studentName) {
      result.errors.push(`第 ${i + 1} 行：学生姓名不能为空`)
      continue
    }

    if (!result.students.includes(studentName)) {
      result.students.push(studentName)
      result.addedStudents.push(studentName)
      result.scores[studentName] = {}
      for (const subject of result.subjects) {
        result.scores[studentName][subject] = null
      }
    }

    for (let j = 1; j < parts.length; j += 1) {
      const subjectIndex = j - 1
      if (subjectIndex >= result.subjects.length) break

      const subject = result.subjects[subjectIndex]
      const scoreStr = parts[j]

      if (scoreStr === '' || scoreStr === '-' || scoreStr === '—') {
        result.scores[studentName][subject] = null
        continue
      }

      const validation = validateScore(scoreStr)
      if (!validation.valid) {
        result.errors.push(`第 ${i + 1} 行 ${subject}：${validation.message}`)
        continue
      }

      result.scores[studentName][subject] = validation.value
    }
  }

  return result
}

export function escapeCSVValue(value) {
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportToCSV(data) {
  const header = ['姓名', ...data.subjects, '总分', '平均分']
  const rows = data.students.map((student) => {
    const scores = data.subjects.map((subject) => {
      const score = data.scores[student]?.[subject]
      return score !== null && score !== undefined ? score : ''
    })
    const total = getStudentTotal(data, student)
    const average = getStudentAverage(data, student).toFixed(2)
    return [student, ...scores, total, average]
  })

  const csvContent = [header, ...rows]
    .map((row) => row.map(escapeCSVValue).join(','))
    .join('\n')

  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const filename = `成绩表_${timestamp}.csv`

  return { csvContent, filename }
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
