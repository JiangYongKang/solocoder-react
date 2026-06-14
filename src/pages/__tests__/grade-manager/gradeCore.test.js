import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_SUBJECTS,
  SCORE_RANGES,
  VIEWS,
  createInitialState,
  loadGradeData,
  saveGradeData,
  loadPreviousData,
  snapshotPreviousData,
  validateScore,
  addStudent,
  removeStudent,
  addSubject,
  removeSubject,
  updateScore,
  getStudentTotal,
  getStudentAverage,
  getSubjectScores,
  calculateMean,
  calculateMedian,
  calculateStandardDeviation,
  getSubjectStats,
  getAllSubjectStats,
  getScoreDistribution,
  calculateRankings,
  calculateRankChanges,
  parsePastedData,
  exportToCSV,
  downloadCSV,
  escapeCSVValue,
} from '../../grade-manager/gradeCore'

function createMockLocalStorage() {
  const store = new Map()
  return {
    get length() {
      return store.size
    },
    key: (i) => {
      const keys = Array.from(store.keys())
      return keys[i] ?? null
    },
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

function createMockData() {
  return {
    students: ['张三', '李四', '王五'],
    subjects: ['语文', '数学', '英语'],
    scores: {
      张三: { 语文: 85, 数学: 92, 英语: 78 },
      李四: { 语文: 76, 数学: 88, 英语: 90 },
      王五: { 语文: 92, 数学: 79, 英语: 85 },
    },
  }
}

describe('DEFAULT_SUBJECTS', () => {
  it('should contain default subjects', () => {
    expect(DEFAULT_SUBJECTS).toEqual(['语文', '数学', '英语', '物理', '化学'])
  })
})

describe('SCORE_RANGES', () => {
  it('should have 6 score ranges', () => {
    expect(SCORE_RANGES).toHaveLength(6)
    expect(SCORE_RANGES[0].label).toBe('不及格')
    expect(SCORE_RANGES[5].label).toBe('异常')
  })
})

describe('VIEWS', () => {
  it('should define student and subject views', () => {
    expect(VIEWS.STUDENT).toBe('student')
    expect(VIEWS.SUBJECT).toBe('subject')
  })
})

describe('createInitialState', () => {
  it('should create initial state with default subjects and no extra fields', () => {
    const state = createInitialState()
    expect(state.students).toEqual([])
    expect(state.subjects).toEqual(DEFAULT_SUBJECTS)
    expect(state.scores).toEqual({})
    expect(Object.keys(state)).toEqual(['students', 'subjects', 'scores'])
  })
})

describe('validateScore', () => {
  it('should reject non-numeric scores', () => {
    expect(validateScore('abc').valid).toBe(false)
    expect(validateScore('').valid).toBe(false)
    expect(validateScore(null).valid).toBe(false)
  })

  it('should reject out of range scores', () => {
    expect(validateScore(-1).valid).toBe(false)
    expect(validateScore(151).valid).toBe(false)
  })

  it('should accept valid scores', () => {
    expect(validateScore(0).valid).toBe(true)
    expect(validateScore(75).valid).toBe(true)
    expect(validateScore(150).valid).toBe(true)
    expect(validateScore('85').value).toBe(85)
  })
})

describe('addStudent', () => {
  it('should return error for empty name', () => {
    const data = createInitialState()
    const result = addStudent(data, '')
    expect(result.error).toBe('学生姓名不能为空')
  })

  it('should return error for duplicate name', () => {
    const data = { ...createInitialState(), students: ['张三'] }
    const result = addStudent(data, '张三')
    expect(result.error).toBe('学生姓名已存在')
  })

  it('should return pure data object on success (no error field)', () => {
    const data = createInitialState()
    const result = addStudent(data, '张三')
    expect(result.error).toBeUndefined()
    expect(Object.keys(result)).toEqual(['students', 'subjects', 'scores'])
    expect(result.students).toContain('张三')
  })

  it('should add new student with null scores for all subjects', () => {
    const data = createInitialState()
    const result = addStudent(data, '张三')
    expect(result.scores['张三']).toBeDefined()
    for (const subject of data.subjects) {
      expect(result.scores['张三'][subject]).toBeNull()
    }
  })

  it('should trim student name', () => {
    const data = createInitialState()
    const result = addStudent(data, '  李四  ')
    expect(result.students).toContain('李四')
    expect(result.students).not.toContain('  李四  ')
  })
})

describe('removeStudent', () => {
  it('should remove student and their scores', () => {
    const data = createMockData()
    const result = removeStudent(data, '张三')
    expect(result.students).not.toContain('张三')
    expect(result.scores['张三']).toBeUndefined()
    expect(result.students).toHaveLength(2)
    expect(Object.keys(result)).toEqual(['students', 'subjects', 'scores'])
  })
})

describe('addSubject', () => {
  it('should return error for empty name', () => {
    const data = createInitialState()
    const result = addSubject(data, '')
    expect(result.error).toBe('科目名称不能为空')
  })

  it('should return error for duplicate subject', () => {
    const data = createInitialState()
    const result = addSubject(data, '语文')
    expect(result.error).toBe('科目已存在')
  })

  it('should return pure data object on success (no error field)', () => {
    const data = createMockData()
    const result = addSubject(data, '物理')
    expect(result.error).toBeUndefined()
    expect(Object.keys(result)).toEqual(['students', 'subjects', 'scores'])
    expect(result.subjects).toContain('物理')
  })

  it('should add new subject with null scores for all students', () => {
    const data = createMockData()
    const result = addSubject(data, '物理')
    for (const student of data.students) {
      expect(result.scores[student]['物理']).toBeNull()
    }
  })
})

describe('removeSubject', () => {
  it('should remove subject and all scores for that subject', () => {
    const data = createMockData()
    const result = removeSubject(data, '语文')
    expect(result.subjects).not.toContain('语文')
    for (const student of data.students) {
      expect(result.scores[student]['语文']).toBeUndefined()
    }
    expect(Object.keys(result)).toEqual(['students', 'subjects', 'scores'])
  })
})

describe('updateScore', () => {
  it('should return error for invalid score', () => {
    const data = createMockData()
    const result = updateScore(data, '张三', '语文', 200)
    expect(result.error).toBeDefined()
  })

  it('should return pure data object on success (no error field)', () => {
    const data = createMockData()
    const result = updateScore(data, '张三', '语文', 95)
    expect(result.error).toBeUndefined()
    expect(Object.keys(result)).toEqual(['students', 'subjects', 'scores'])
    expect(result.scores['张三']['语文']).toBe(95)
  })

  it('should set null score when value is empty', () => {
    const data = createMockData()
    const result = updateScore(data, '张三', '语文', '')
    expect(result.scores['张三']['语文']).toBeNull()
    expect(result.error).toBeUndefined()
  })

  it('should set null score when value is null', () => {
    const data = createMockData()
    const result = updateScore(data, '张三', '语文', null)
    expect(result.scores['张三']['语文']).toBeNull()
    expect(result.error).toBeUndefined()
  })
})

describe('getStudentTotal', () => {
  it('should calculate total correctly', () => {
    const data = createMockData()
    expect(getStudentTotal(data, '张三')).toBe(85 + 92 + 78)
  })

  it('should handle missing student', () => {
    const data = createMockData()
    expect(getStudentTotal(data, '不存在')).toBe(0)
  })

  it('should ignore null scores', () => {
    const data = {
      students: ['张三'],
      subjects: ['语文', '数学'],
      scores: { 张三: { 语文: 80, 数学: null } },
    }
    expect(getStudentTotal(data, '张三')).toBe(80)
  })
})

describe('getStudentAverage', () => {
  it('should calculate average correctly', () => {
    const data = createMockData()
    expect(getStudentAverage(data, '张三')).toBeCloseTo((85 + 92 + 78) / 3)
  })

  it('should return 0 for no valid scores', () => {
    const data = {
      students: ['张三'],
      subjects: ['语文', '数学'],
      scores: { 张三: { 语文: null, 数学: null } },
    }
    expect(getStudentAverage(data, '张三')).toBe(0)
  })

  it('should ignore null scores in average', () => {
    const data = {
      students: ['张三'],
      subjects: ['语文', '数学', '英语'],
      scores: { 张三: { 语文: 80, 数学: 90, 英语: null } },
    }
    expect(getStudentAverage(data, '张三')).toBeCloseTo(85)
  })
})

describe('getSubjectScores', () => {
  it('should get all valid scores for a subject', () => {
    const data = createMockData()
    const scores = getSubjectScores(data, '语文')
    expect(scores).toEqual([85, 76, 92])
  })

  it('should filter out null scores', () => {
    const data = {
      students: ['张三', '李四', '王五'],
      subjects: ['语文'],
      scores: {
        张三: { 语文: 85 },
        李四: { 语文: null },
        王五: { 语文: 76 },
      },
    }
    const scores = getSubjectScores(data, '语文')
    expect(scores).toEqual([85, 76])
  })
})

describe('calculateMean', () => {
  it('should return 0 for empty array', () => {
    expect(calculateMean([])).toBe(0)
  })

  it('should calculate mean correctly', () => {
    expect(calculateMean([2, 4, 6])).toBe(4)
    expect(calculateMean([1, 2, 3, 4])).toBe(2.5)
  })

  it('should handle invalid input', () => {
    expect(calculateMean(null)).toBe(0)
  })
})

describe('calculateMedian', () => {
  it('should return 0 for empty array', () => {
    expect(calculateMedian([])).toBe(0)
  })

  it('should calculate median for odd length', () => {
    expect(calculateMedian([1, 3, 2])).toBe(2)
    expect(calculateMedian([5, 1, 3, 2, 4])).toBe(3)
  })

  it('should calculate median for even length (average of middle two)', () => {
    expect(calculateMedian([1, 2, 3, 4])).toBe(2.5)
    expect(calculateMedian([1, 3])).toBe(2)
  })

  it('should handle invalid input', () => {
    expect(calculateMedian(null)).toBe(0)
  })
})

describe('calculateStandardDeviation', () => {
  it('should return 0 for empty array', () => {
    expect(calculateStandardDeviation([])).toBe(0)
  })

  it('should calculate population std dev correctly', () => {
    expect(calculateStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2)
  })

  it('should return 0 for identical values', () => {
    expect(calculateStandardDeviation([5, 5, 5, 5])).toBe(0)
  })
})

describe('getSubjectStats', () => {
  it('should return zeros for no scores', () => {
    const data = {
      students: ['张三'],
      subjects: ['语文'],
      scores: { 张三: { 语文: null } },
    }
    const stats = getSubjectStats(data, '语文')
    expect(stats.mean).toBe(0)
    expect(stats.max).toBe(0)
    expect(stats.min).toBe(0)
    expect(stats.median).toBe(0)
    expect(stats.stdDev).toBe(0)
    expect(stats.count).toBe(0)
  })

  it('should calculate stats correctly', () => {
    const data = createMockData()
    const stats = getSubjectStats(data, '语文')
    expect(stats.mean).toBeCloseTo(84.33)
    expect(stats.max).toBe(92)
    expect(stats.min).toBe(76)
    expect(stats.median).toBe(85)
    expect(stats.count).toBe(3)
  })
})

describe('getAllSubjectStats', () => {
  it('should return stats for all subjects', () => {
    const data = createMockData()
    const allStats = getAllSubjectStats(data)
    expect(allStats).toHaveLength(3)
    expect(allStats[0].subject).toBe('语文')
    expect(allStats[1].subject).toBe('数学')
    expect(allStats[2].subject).toBe('英语')
  })
})

describe('getScoreDistribution', () => {
  it('should return correct distribution', () => {
    const scores = [45, 59, 65, 75, 85, 95, 110, 100]
    const distribution = getScoreDistribution(scores)
    expect(distribution[0].count).toBe(2)
    expect(distribution[1].count).toBe(1)
    expect(distribution[2].count).toBe(1)
    expect(distribution[3].count).toBe(1)
    expect(distribution[4].count).toBe(2)
    expect(distribution[5].count).toBe(1)
  })

  it('should handle empty scores', () => {
    const distribution = getScoreDistribution([])
    for (const d of distribution) {
      expect(d.count).toBe(0)
    }
  })
})

describe('calculateRankings', () => {
  it('should rank by total by default', () => {
    const data = createMockData()
    const rankings = calculateRankings(data)
    expect(rankings[0].name).toBe('王五')
    expect(rankings[0].total).toBe(256)
    expect(rankings[1].name).toBe('张三')
    expect(rankings[1].total).toBe(255)
    expect(rankings[2].name).toBe('李四')
    expect(rankings[2].total).toBe(254)
  })

  it('should handle same score ranking (skip next rank)', () => {
    const data = {
      students: ['A', 'B', 'C', 'D'],
      subjects: ['语文'],
      scores: {
        A: { 语文: 90 },
        B: { 语文: 90 },
        C: { 语文: 80 },
        D: { 语文: 70 },
      },
    }
    const rankings = calculateRankings(data, '语文')
    expect(rankings[0].rank).toBe(1)
    expect(rankings[1].rank).toBe(1)
    expect(rankings[2].rank).toBe(3)
    expect(rankings[3].rank).toBe(4)
  })

  it('should rank by specific subject', () => {
    const data = createMockData()
    const rankings = calculateRankings(data, '数学')
    expect(rankings[0].name).toBe('张三')
    expect(rankings[0].scores['数学']).toBe(92)
  })

  it('should handle empty student list', () => {
    const data = createInitialState()
    const rankings = calculateRankings(data)
    expect(rankings).toEqual([])
  })
})

describe('calculateRankChanges', () => {
  it('should return 0 change when no previous data', () => {
    const current = [{ name: '张三', rank: 1 }, { name: '李四', rank: 2 }]
    const result = calculateRankChanges(current, null)
    expect(result[0].change).toBe(0)
    expect(result[1].change).toBe(0)
  })

  it('should calculate rank changes by total by default', () => {
    const current = [
      { name: '张三', rank: 1 },
      { name: '李四', rank: 2 },
      { name: '王五', rank: 3 },
    ]
    const previousData = {
      students: ['李四', '张三', '王五'],
      subjects: ['语文'],
      scores: {
        李四: { 语文: 100 },
        张三: { 语文: 90 },
        王五: { 语文: 80 },
      },
    }
    const result = calculateRankChanges(current, previousData)
    expect(result.find((r) => r.name === '张三').change).toBe(1)
    expect(result.find((r) => r.name === '李四').change).toBe(-1)
    expect(result.find((r) => r.name === '王五').change).toBe(0)
  })

  it('should calculate rank changes by subject when sortBy is subject', () => {
    const currentData = {
      students: ['张三', '李四', '王五'],
      subjects: ['语文', '数学'],
      scores: {
        张三: { 语文: 95, 数学: 70 },
        李四: { 语文: 90, 数学: 95 },
        王五: { 语文: 85, 数学: 85 },
      },
    }
    const previousData = {
      students: ['张三', '李四', '王五'],
      subjects: ['语文', '数学'],
      scores: {
        张三: { 语文: 80, 数学: 90 },
        李四: { 语文: 85, 数学: 85 },
        王五: { 语文: 90, 数学: 80 },
      },
    }
    const currentRankings = calculateRankings(currentData, '数学')
    const result = calculateRankChanges(currentRankings, previousData, '数学')

    const zhangsan = result.find((r) => r.name === '张三')
    const lisi = result.find((r) => r.name === '李四')
    const wangwu = result.find((r) => r.name === '王五')

    expect(zhangsan.change).toBe(-2)
    expect(lisi.change).toBe(1)
    expect(wangwu.change).toBe(1)
  })

  it('should produce different results for sortBy=total vs sortBy=subject', () => {
    const currentData = {
      students: ['张三', '李四'],
      subjects: ['语文', '数学'],
      scores: {
        张三: { 语文: 100, 数学: 50 },
        李四: { 语文: 60, 数学: 90 },
      },
    }
    const previousData = {
      students: ['张三', '李四'],
      subjects: ['语文', '数学'],
      scores: {
        张三: { 语文: 50, 数学: 90 },
        李四: { 语文: 90, 数学: 50 },
      },
    }

    const currentTotalRankings = calculateRankings(currentData, 'total')
    const resultTotal = calculateRankChanges(currentTotalRankings, previousData, 'total')

    const currentMathRankings = calculateRankings(currentData, '数学')
    const resultMath = calculateRankChanges(currentMathRankings, previousData, '数学')

    const zhangsanTotal = resultTotal.find((r) => r.name === '张三')
    const zhangsanMath = resultMath.find((r) => r.name === '张三')

    expect(zhangsanTotal.change).not.toBe(zhangsanMath.change)
  })

  it('should return null change for new students', () => {
    const current = [{ name: '新学生', rank: 1 }]
    const previousData = createMockData()
    const result = calculateRankChanges(current, previousData)
    expect(result[0].change).toBeNull()
  })
})

describe('parsePastedData', () => {
  it('should parse tab-separated data', () => {
    const data = createInitialState()
    const text = '张三\t85\t92\t78\n李四\t76\t88\t90'
    const result = parsePastedData(text, data)
    expect(result.students).toContain('张三')
    expect(result.students).toContain('李四')
    expect(result.scores['张三']['语文']).toBe(85)
    expect(result.scores['李四']['数学']).toBe(88)
    expect(result.errors).toHaveLength(0)
  })

  it('should handle comma-separated data', () => {
    const data = createInitialState()
    const text = '张三,85,92,78'
    const result = parsePastedData(text, data)
    expect(result.scores['张三']['语文']).toBe(85)
  })

  it('should report errors for invalid scores', () => {
    const data = createInitialState()
    const text = '张三\tabc\t92\t78'
    const result = parsePastedData(text, data)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('语文')
  })

  it('should report errors for empty student name', () => {
    const data = createInitialState()
    const text = '\t85\t92\t78'
    const result = parsePastedData(text, data)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('姓名不能为空')
  })

  it('should handle empty scores as null', () => {
    const data = createInitialState()
    const text = '张三\t-\t92\t'
    const result = parsePastedData(text, data)
    expect(result.scores['张三']['语文']).toBeNull()
    expect(result.scores['张三']['数学']).toBe(92)
    expect(result.scores['张三']['英语']).toBeNull()
  })
})

describe('escapeCSVValue', () => {
  it('should return value as-is when no special characters', () => {
    expect(escapeCSVValue('张三')).toBe('张三')
    expect(escapeCSVValue('85')).toBe('85')
    expect(escapeCSVValue('')).toBe('')
  })

  it('should handle null and undefined as empty string', () => {
    expect(escapeCSVValue(null)).toBe('')
    expect(escapeCSVValue(undefined)).toBe('')
  })

  it('should wrap value in quotes when contains comma', () => {
    expect(escapeCSVValue('张,三')).toBe('"张,三"')
  })

  it('should wrap value in quotes when contains double quote and escape it', () => {
    expect(escapeCSVValue('张"三')).toBe('"张""三"')
  })

  it('should wrap value in quotes when contains newline', () => {
    expect(escapeCSVValue('张\n三')).toBe('"张\n三"')
  })

  it('should wrap value in quotes when contains carriage return', () => {
    expect(escapeCSVValue('张\r三')).toBe('"张\r三"')
  })

  it('should handle combined special characters', () => {
    expect(escapeCSVValue('张,"三"\n四')).toBe('"张,""三""\n四"')
  })

  it('should convert numbers to strings', () => {
    expect(escapeCSVValue(85)).toBe('85')
    expect(escapeCSVValue(85.5)).toBe('85.5')
  })
})

describe('exportToCSV', () => {
  it('should generate correct CSV content', () => {
    const data = createMockData()
    const result = exportToCSV(data)
    expect(result.csvContent).toContain('姓名,语文,数学,英语,总分,平均分')
    expect(result.csvContent).toContain('张三,85,92,78,255,85.00')
    expect(result.filename).toMatch(/^成绩表_\d{8}_\d{6}\.csv$/)
  })

  it('should handle empty scores in CSV', () => {
    const data = {
      students: ['张三'],
      subjects: ['语文', '数学'],
      scores: { 张三: { 语文: 85, 数学: null } },
    }
    const result = exportToCSV(data)
    expect(result.csvContent).toContain('张三,85,,85,85.00')
  })

  it('should escape student names containing commas', () => {
    const data = {
      students: ['张,三'],
      subjects: ['语文'],
      scores: { '张,三': { 语文: 85 } },
    }
    const result = exportToCSV(data)
    expect(result.csvContent).toContain('"张,三",85,85,85.00')
    const headerIndex = result.csvContent.indexOf('\n')
    const firstLine = result.csvContent.slice(headerIndex + 1)
    expect(firstLine.startsWith('"张,三"')).toBe(true)
  })

  it('should escape values containing double quotes', () => {
    const data = {
      students: ['张"三'],
      subjects: ['语文'],
      scores: { '张"三': { 语文: 85 } },
    }
    const result = exportToCSV(data)
    expect(result.csvContent).toContain('"张""三"')
  })

  it('should properly count commas per line (no column shift)', () => {
    const data = {
      students: ['张,三', '李四'],
      subjects: ['语文', '数学'],
      scores: {
        '张,三': { 语文: 85, 数学: 90 },
        李四: { 语文: 75, 数学: 80 },
      },
    }
    const result = exportToCSV(data)
    const lines = result.csvContent.split('\n')
    expect(lines[0].split(',').length).toBe(5)
    for (let i = 1; i < lines.length; i += 1) {
      const insideQuotes = (lines[i].match(/"/g) || []).length
      const totalCommas = (lines[i].match(/,/g) || []).length
      const commasOutsideQuotes = totalCommas - insideQuotes / 2
      expect(commasOutsideQuotes).toBe(4)
    }
  })
})

describe('snapshotPreviousData', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('should save current data to previous storage key', () => {
    const data = createMockData()
    saveGradeData(data)
    expect(snapshotPreviousData()).toBe(true)
    const previous = loadPreviousData()
    expect(previous.students).toEqual(data.students)
    expect(previous.subjects).toEqual(data.subjects)
    expect(previous.scores).toEqual(data.scores)
  })

  it('should not update previous when saveGradeData is called multiple times', () => {
    const data1 = { ...createMockData(), students: ['快照学生'] }
    saveGradeData(data1)
    snapshotPreviousData()

    const data2 = { ...createMockData(), students: ['编辑后'] }
    saveGradeData(data2)
    saveGradeData({ ...createMockData(), students: ['再次编辑'] })

    const previous = loadPreviousData()
    expect(previous.students).toEqual(['快照学生'])
  })

  it('should return false when window is undefined', () => {
    vi.stubGlobal('window', undefined)
    expect(snapshotPreviousData()).toBe(false)
  })

  it('should return false when localStorage throws', () => {
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
    expect(snapshotPreviousData()).toBe(false)
  })

  it('should NOT overwrite when valid previous snapshot already exists', () => {
    const initialData = { ...createMockData(), students: ['首次快照'] }
    saveGradeData(initialData)
    expect(snapshotPreviousData()).toBe(true)

    const newData = { ...createMockData(), students: ['新数据'] }
    saveGradeData(newData)
    expect(snapshotPreviousData()).toBe(false)

    const previous = loadPreviousData()
    expect(previous.students).toEqual(['首次快照'])
  })

  it('should overwrite when previous snapshot contains invalid JSON', () => {
    mockStorage.setItem('grade_manager_previous_data', 'not valid json')
    const data = { ...createMockData(), students: ['有效数据'] }
    saveGradeData(data)
    expect(snapshotPreviousData()).toBe(true)
    const previous = loadPreviousData()
    expect(previous.students).toEqual(['有效数据'])
  })

  it('should overwrite when previous snapshot is missing required fields', () => {
    mockStorage.setItem('grade_manager_previous_data', JSON.stringify({ foo: 'bar' }))
    const data = { ...createMockData(), students: ['正确数据'] }
    saveGradeData(data)
    expect(snapshotPreviousData()).toBe(true)
    const previous = loadPreviousData()
    expect(previous.students).toEqual(['正确数据'])
  })

  it('should overwrite when students field is not an array', () => {
    mockStorage.setItem(
      'grade_manager_previous_data',
      JSON.stringify({ students: null, subjects: [], scores: {} })
    )
    const data = { ...createMockData(), students: ['修复后数据'] }
    saveGradeData(data)
    expect(snapshotPreviousData()).toBe(true)
    const previous = loadPreviousData()
    expect(previous.students).toEqual(['修复后数据'])
  })

  it('should overwrite when subjects field is not an array', () => {
    mockStorage.setItem(
      'grade_manager_previous_data',
      JSON.stringify({ students: [], subjects: 'not array', scores: {} })
    )
    const data = { ...createMockData(), students: ['修复后数据2'] }
    saveGradeData(data)
    expect(snapshotPreviousData()).toBe(true)
    const previous = loadPreviousData()
    expect(previous.students).toEqual(['修复后数据2'])
  })

  it('should overwrite when scores field is not an object', () => {
    mockStorage.setItem(
      'grade_manager_previous_data',
      JSON.stringify({ students: [], subjects: [], scores: null })
    )
    const data = { ...createMockData(), students: ['修复后数据3'] }
    saveGradeData(data)
    expect(snapshotPreviousData()).toBe(true)
    const previous = loadPreviousData()
    expect(previous.students).toEqual(['修复后数据3'])
  })

  it('should overwrite when scores field is an array instead of object', () => {
    mockStorage.setItem(
      'grade_manager_previous_data',
      JSON.stringify({ students: [], subjects: [], scores: ['score1', 'score2'] })
    )
    const data = { ...createMockData(), students: ['修复后数据5'] }
    saveGradeData(data)
    expect(snapshotPreviousData()).toBe(true)
    const previous = loadPreviousData()
    expect(previous.students).toEqual(['修复后数据5'])
  })

  it('should overwrite when subjects field is an object instead of array', () => {
    mockStorage.setItem(
      'grade_manager_previous_data',
      JSON.stringify({ students: [], subjects: { 0: '语文' }, scores: {} })
    )
    const data = { ...createMockData(), students: ['修复后数据6'] }
    saveGradeData(data)
    expect(snapshotPreviousData()).toBe(true)
    const previous = loadPreviousData()
    expect(previous.students).toEqual(['修复后数据6'])
  })

  it('should overwrite when students field is an object instead of array', () => {
    mockStorage.setItem(
      'grade_manager_previous_data',
      JSON.stringify({ students: { 0: '张三' }, subjects: [], scores: {} })
    )
    const data = { ...createMockData(), students: ['修复后数据4'] }
    saveGradeData(data)
    expect(snapshotPreviousData()).toBe(true)
    const previous = loadPreviousData()
    expect(previous.students).toEqual(['修复后数据4'])
  })
})

describe('localStorage functions', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('loadGradeData should return initial state when nothing stored', () => {
    expect(loadGradeData()).toEqual(createInitialState())
  })

  it('saveGradeData and loadGradeData should round trip', () => {
    const data = createMockData()
    expect(saveGradeData(data)).toBe(true)
    const loaded = loadGradeData()
    expect(loaded.students).toEqual(data.students)
    expect(loaded.subjects).toEqual(data.subjects)
    expect(loaded.scores).toEqual(data.scores)
  })

  it('saveGradeData should strip extra fields (error field)', () => {
    const data = {
      ...createMockData(),
      error: '这个错误字段不应该被保存',
      extraField: '也不应该被保存',
    }
    saveGradeData(data)
    const loaded = loadGradeData()
    expect(loaded.error).toBeUndefined()
    expect(loaded.extraField).toBeUndefined()
    expect(Object.keys(loaded)).toEqual(['students', 'subjects', 'scores'])
  })

  it('loadGradeData should handle invalid JSON', () => {
    mockStorage.setItem('grade_manager_data', 'not json')
    expect(loadGradeData()).toEqual(createInitialState())
  })

  it('loadPreviousData should return previous saved via snapshotPreviousData', () => {
    const data1 = { ...createMockData(), students: ['旧学生'] }
    saveGradeData(data1)
    snapshotPreviousData()

    const data2 = { ...createMockData(), students: ['新学生'] }
    saveGradeData(data2)

    const previous = loadPreviousData()
    expect(previous.students).toContain('旧学生')
  })

  it('loadPreviousData should return null when no previous data', () => {
    expect(loadPreviousData()).toBeNull()
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
    expect(loadGradeData()).toEqual(createInitialState())
    expect(saveGradeData({})).toBe(false)
    expect(loadPreviousData()).toBeNull()
  })

  it('should handle undefined window', () => {
    vi.stubGlobal('window', undefined)
    expect(loadGradeData()).toEqual(createInitialState())
    expect(saveGradeData({})).toBe(false)
    expect(loadPreviousData()).toBeNull()
  })
})

describe('downloadCSV', () => {
  it('should return false when window is undefined', () => {
    vi.stubGlobal('window', undefined)
    expect(downloadCSV('test', 'test.csv')).toBe(false)
  })

  it('should return false when download fails', () => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('document', {
      createElement: () => {
        throw new Error('fail')
      },
    })
    expect(downloadCSV('test', 'test.csv')).toBe(false)
  })

  it('should return true for successful download', () => {
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    }
    const mockBlob = vi.fn()
    const mockURL = {
      createObjectURL: vi.fn(() => 'blob:url'),
      revokeObjectURL: vi.fn(),
    }

    vi.stubGlobal('window', {})
    vi.stubGlobal('document', {
      createElement: () => mockLink,
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    })
    vi.stubGlobal('Blob', mockBlob)
    vi.stubGlobal('URL', mockURL)

    expect(downloadCSV('test content', 'test.csv')).toBe(true)
    expect(mockBlob).toHaveBeenCalled()
    expect(mockLink.click).toHaveBeenCalled()
    expect(mockURL.revokeObjectURL).toHaveBeenCalled()
  })
})
