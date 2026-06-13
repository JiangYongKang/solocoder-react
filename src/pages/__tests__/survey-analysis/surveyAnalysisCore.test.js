import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    DURATION_BUCKETS,
    PAGE_SIZE,
    QUESTION_TYPES,
    QUESTION_TYPE_FILTERS,
    QUESTION_TYPE_LABELS,
    STORAGE_KEY,
} from '../../survey-analysis/constants.js'
import {
    generateMockResponses,
    getMockSurvey,
} from '../../survey-analysis/mockData.js'
import {
    clearSurveyData,
    loadSurveyData,
    regenerateMockData,
    saveSurveyData,
} from '../../survey-analysis/storage.js'
import {
    buildCrossAnalysisMatrix,
    calculateAllStats,
    calculateDurationDistribution,
    calculateMultipleChoiceStats,
    calculateRatingStats,
    calculateSingleChoiceStats,
    calculateTextStats,
    countQuestionsByType,
    filterResponses,
    formatAnswerForDisplay,
    formatDate,
    formatDateOnly,
    formatDuration,
    paginateResponses,
    responsesToCSV,
    sortResponses,
    statsToCSV,
} from '../../survey-analysis/surveyAnalysisCore.js'

const TEST_SURVEY = {
  id: 'analysis_survey',
  title: '用户体验满意度调查',
  questions: [
    {
      id: 'q1',
      type: QUESTION_TYPES.SINGLE,
      title: '您的性别是？',
      options: [
        { label: '男', value: 'male' },
        { label: '女', value: 'female' },
      ],
    },
    {
      id: 'q2',
      type: QUESTION_TYPES.SINGLE,
      title: '您的年龄段是？',
      options: [
        { label: '18岁以下', value: 'lt18' },
        { label: '18-25岁', value: '18-25' },
        { label: '26-35岁', value: '26-35' },
        { label: '36-45岁', value: '36-45' },
        { label: '46岁以上', value: 'gt46' },
      ],
    },
    {
      id: 'q3',
      type: QUESTION_TYPES.MULTIPLE,
      title: '您平时使用哪些娱乐方式？（多选）',
      options: [
        { label: '看电影', value: 'movie' },
        { label: '听音乐', value: 'music' },
        { label: '阅读书籍', value: 'reading' },
        { label: '运动健身', value: 'sports' },
        { label: '社交聚会', value: 'social' },
        { label: '游戏', value: 'games' },
      ],
    },
    {
      id: 'q4',
      type: QUESTION_TYPES.MULTIPLE,
      title: '您了解过我们产品的哪些渠道？（多选）',
      options: [
        { label: '搜索引擎', value: 'search' },
        { label: '社交媒体', value: 'social' },
        { label: '朋友推荐', value: 'friend' },
        { label: '广告投放', value: 'ad' },
        { label: '线下活动', value: 'offline' },
      ],
    },
    {
      id: 'q5',
      type: QUESTION_TYPES.RATING,
      title: '您对我们产品的整体满意度如何？',
      maxRating: 5,
    },
    {
      id: 'q6',
      type: QUESTION_TYPES.RATING,
      title: '您对客服服务的评价如何？',
      maxRating: 5,
    },
    {
      id: 'q7',
      type: QUESTION_TYPES.TEXT,
      title: '您对我们产品有什么建议？',
    },
    {
      id: 'q8',
      type: QUESTION_TYPES.TEXT,
      title: '您最希望我们改进的功能是什么？',
    },
  ],
}

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

describe('常量定义', () => {
  it('QUESTION_TYPES 应该包含所有题型', () => {
    expect(Object.keys(QUESTION_TYPES)).toHaveLength(4)
    expect(QUESTION_TYPES.SINGLE).toBe('single')
    expect(QUESTION_TYPES.MULTIPLE).toBe('multiple')
    expect(QUESTION_TYPES.TEXT).toBe('text')
    expect(QUESTION_TYPES.RATING).toBe('rating')
  })

  it('QUESTION_TYPE_LABELS 应该正确映射中文标签', () => {
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.SINGLE]).toBe('单选题')
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.MULTIPLE]).toBe('多选题')
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.TEXT]).toBe('填空题')
    expect(QUESTION_TYPE_LABELS[QUESTION_TYPES.RATING]).toBe('评分题')
  })

  it('QUESTION_TYPE_FILTERS 应该包含所有筛选类型', () => {
    expect(QUESTION_TYPE_FILTERS).toHaveLength(5)
    expect(QUESTION_TYPE_FILTERS[0]).toEqual({ key: 'all', label: '全部' })
    expect(QUESTION_TYPE_FILTERS[1]).toEqual({ key: 'single', label: '单选题' })
    expect(QUESTION_TYPE_FILTERS[2]).toEqual({ key: 'multiple', label: '多选题' })
    expect(QUESTION_TYPE_FILTERS[3]).toEqual({ key: 'text', label: '填空题' })
    expect(QUESTION_TYPE_FILTERS[4]).toEqual({ key: 'rating', label: '评分题' })
  })

  it('DURATION_BUCKETS 应该包含6个时间段', () => {
    expect(DURATION_BUCKETS).toHaveLength(6)
    expect(DURATION_BUCKETS[0]).toEqual({ label: '0-30秒', min: 0, max: 30 })
    expect(DURATION_BUCKETS[1]).toEqual({ label: '30秒-1分钟', min: 30, max: 60 })
    expect(DURATION_BUCKETS[2]).toEqual({ label: '1-2分钟', min: 60, max: 120 })
    expect(DURATION_BUCKETS[3]).toEqual({ label: '2-5分钟', min: 120, max: 300 })
    expect(DURATION_BUCKETS[4]).toEqual({ label: '5-10分钟', min: 300, max: 600 })
    expect(DURATION_BUCKETS[5]).toEqual({ label: '10分钟以上', min: 600, max: Infinity })
  })

  it('STORAGE_KEY 和 PAGE_SIZE 应该正确定义', () => {
    expect(typeof STORAGE_KEY).toBe('string')
    expect(PAGE_SIZE).toBe(20)
  })
})

describe('formatDuration', () => {
  it('应该格式化秒数', () => {
    expect(formatDuration(0)).toBe('0秒')
    expect(formatDuration(30)).toBe('30秒')
    expect(formatDuration(59)).toBe('59秒')
  })

  it('应该格式化分钟', () => {
    expect(formatDuration(60)).toBe('1分钟')
    expect(formatDuration(90)).toBe('1分30秒')
    expect(formatDuration(120)).toBe('2分钟')
  })

  it('应该格式化小时', () => {
    expect(formatDuration(3600)).toBe('1小时')
    expect(formatDuration(3660)).toBe('1小时1分')
    expect(formatDuration(3661)).toBe('1小时1分')
  })

  it('null 和 NaN 应该返回 "-"', () => {
    expect(formatDuration(null)).toBe('-')
    expect(formatDuration(undefined)).toBe('-')
    expect(formatDuration(NaN)).toBe('-')
  })
})

describe('formatDate & formatDateOnly', () => {
  it('formatDate 应该格式化时间戳', () => {
    const ts = new Date('2025-06-15T14:30:00').getTime()
    expect(formatDate(ts)).toBe('2025-06-15 14:30')
  })

  it('formatDate 应该补零', () => {
    const ts = new Date('2025-01-05T09:05:00').getTime()
    expect(formatDate(ts)).toBe('2025-01-05 09:05')
  })

  it('formatDateOnly 应该只返回日期部分', () => {
    const ts = new Date('2025-06-15T14:30:00').getTime()
    expect(formatDateOnly(ts)).toBe('2025-06-15')
  })

  it('null 应该返回空字符串', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDateOnly(null)).toBe('')
  })
})

describe('filterResponses', () => {
  const baseTime = new Date('2025-06-01T00:00:00').getTime()
  const responses = [
    { id: 'r1', submittedAt: baseTime + 86400000, duration: 30, answers: {} },
    { id: 'r2', submittedAt: baseTime + 86400000 * 5, duration: 90, answers: {} },
    { id: 'r3', submittedAt: baseTime + 86400000 * 10, duration: 300, answers: {} },
    { id: 'r4', submittedAt: baseTime + 86400000 * 15, duration: 600, answers: {} },
  ]

  it('空数组应该返回空数组', () => {
    expect(filterResponses(null, {})).toEqual([])
    expect(filterResponses([], {})).toEqual([])
  })

  it('没有过滤条件时应该返回所有数据', () => {
    expect(filterResponses(responses, {})).toHaveLength(4)
  })

  it('应该按起始日期过滤', () => {
    const result = filterResponses(responses, { startDate: '2025-06-05' })
    expect(result.map((r) => r.id)).toEqual(['r2', 'r3', 'r4'])
  })

  it('应该按结束日期过滤', () => {
    const result = filterResponses(responses, { endDate: '2025-06-10' })
    expect(result.map((r) => r.id)).toEqual(['r1', 'r2', 'r3'])
  })

  it('应该按日期范围过滤', () => {
    const result = filterResponses(responses, { startDate: '2025-06-05', endDate: '2025-06-12' })
    expect(result.map((r) => r.id)).toEqual(['r2', 'r3'])
  })

  it('应该按时长范围过滤', () => {
    const result = filterResponses(responses, { minDuration: 90, maxDuration: 300 })
    expect(result.map((r) => r.id)).toEqual(['r2', 'r3'])
  })

  it('应该同时按日期和时长过滤', () => {
    const result = filterResponses(responses, {
      startDate: '2025-06-03',
      endDate: '2025-06-12',
      minDuration: 60,
      maxDuration: 400,
    })
    expect(result.map((r) => r.id)).toEqual(['r2', 'r3'])
  })

  it('空字符串时长应该被忽略', () => {
    const result = filterResponses(responses, { minDuration: '', maxDuration: '' })
    expect(result).toHaveLength(4)
  })
})

describe('countQuestionsByType', () => {
  it('应该正确统计各题型数量', () => {
    const counts = countQuestionsByType(TEST_SURVEY.questions)
    expect(counts.single).toBe(2)
    expect(counts.multiple).toBe(2)
    expect(counts.text).toBe(2)
    expect(counts.rating).toBe(2)
  })

  it('空数组应该返回零计数', () => {
    const counts = countQuestionsByType([])
    expect(counts).toEqual({ single: 0, multiple: 0, text: 0, rating: 0 })
  })

  it('null 应该返回零计数', () => {
    const counts = countQuestionsByType(null)
    expect(counts).toEqual({ single: 0, multiple: 0, text: 0, rating: 0 })
  })
})

describe('calculateSingleChoiceStats', () => {
  const question = TEST_SURVEY.questions[0]

  it('应该正确计算单选题统计', () => {
    const responses = [
      { answers: { q1: 'male' } },
      { answers: { q1: 'male' } },
      { answers: { q1: 'female' } },
      { answers: { q1: 'male' } },
      { answers: { q1: 'female' } },
    ]
    const stats = calculateSingleChoiceStats(question, responses)
    expect(stats.type).toBe(QUESTION_TYPES.SINGLE)
    expect(stats.total).toBe(5)
    expect(stats.data[0].count).toBe(3)
    expect(stats.data[0].ratio).toBeCloseTo(60)
    expect(stats.data[1].count).toBe(2)
    expect(stats.data[1].ratio).toBeCloseTo(40)
  })

  it('空问卷应该返回零统计', () => {
    const stats = calculateSingleChoiceStats(question, [])
    expect(stats.total).toBe(0)
    stats.data.forEach((d) => {
      expect(d.count).toBe(0)
      expect(d.ratio).toBe(0)
    })
  })

  it('null question 应该返回默认值', () => {
    const stats = calculateSingleChoiceStats(null, [])
    expect(stats.total).toBe(0)
    expect(stats.data).toEqual([])
  })
})

describe('calculateMultipleChoiceStats', () => {
  const question = TEST_SURVEY.questions[2]

  it('应该正确计算多选题统计', () => {
    const responses = [
      { answers: { q3: ['movie', 'music'] } },
      { answers: { q3: ['movie', 'reading'] } },
      { answers: { q3: ['music'] } },
      { answers: { q3: ['movie', 'music', 'sports'] } },
    ]
    const stats = calculateMultipleChoiceStats(question, responses)
    expect(stats.type).toBe(QUESTION_TYPES.MULTIPLE)
    expect(stats.total).toBe(4)
    const movieStat = stats.data.find((d) => d.value === 'movie')
    const musicStat = stats.data.find((d) => d.value === 'music')
    const sportsStat = stats.data.find((d) => d.value === 'sports')
    expect(movieStat.count).toBe(3)
    expect(musicStat.count).toBe(3)
    expect(sportsStat.count).toBe(1)
  })

  it('多选题百分比总和可能超过100%', () => {
    const responses = [
      { answers: { q3: ['movie', 'music'] } },
      { answers: { q3: ['movie', 'music'] } },
    ]
    const stats = calculateMultipleChoiceStats(question, responses)
    const totalRatio = stats.data.slice(0, 2).reduce((s, d) => s + d.ratio, 0)
    expect(totalRatio).toBeGreaterThan(100)
  })

  it('null question 应该返回默认值', () => {
    const stats = calculateMultipleChoiceStats(null, [])
    expect(stats.total).toBe(0)
    expect(stats.data).toEqual([])
  })
})

describe('calculateRatingStats', () => {
  const question = TEST_SURVEY.questions[4]

  it('应该正确计算评分题统计', () => {
    const responses = [
      { answers: { q5: 5 } },
      { answers: { q5: 4 } },
      { answers: { q5: 5 } },
      { answers: { q5: 3 } },
      { answers: { q5: 4 } },
    ]
    const stats = calculateRatingStats(question, responses)
    expect(stats.type).toBe(QUESTION_TYPES.RATING)
    expect(stats.total).toBe(5)
    expect(stats.average).toBe(4.2)
    expect(stats.median).toBe(4)
    expect(stats.data.find((d) => d.rating === 5).count).toBe(2)
    expect(stats.data.find((d) => d.rating === 4).count).toBe(2)
    expect(stats.data.find((d) => d.rating === 3).count).toBe(1)
  })

  it('应该正确计算中位数（偶数个数据）', () => {
    const responses = [
      { answers: { q5: 1 } },
      { answers: { q5: 2 } },
      { answers: { q5: 4 } },
      { answers: { q5: 5 } },
    ]
    const stats = calculateRatingStats(question, responses)
    expect(stats.median).toBe(3)
  })

  it('没有有效评分时平均分和中位数应该为0', () => {
    const responses = [{ answers: { q5: null } }]
    const stats = calculateRatingStats(question, responses)
    expect(stats.average).toBe(0)
    expect(stats.median).toBe(0)
  })

  it('null question 应该返回默认值（使用默认 maxRating=5 的数据）', () => {
    const stats = calculateRatingStats(null, [])
    expect(stats.total).toBe(0)
    expect(stats.data).toHaveLength(5)
    stats.data.forEach((d) => {
      expect(d.count).toBe(0)
      expect(d.ratio).toBe(0)
    })
    expect(stats.average).toBe(0)
    expect(stats.median).toBe(0)
  })

  it('应该支持不同的 maxRating', () => {
    const q10 = { ...question, maxRating: 10 }
    const responses = [{ answers: { q5: 10 } }, { answers: { q5: 8 } }]
    const stats = calculateRatingStats(q10, responses)
    expect(stats.data).toHaveLength(10)
    expect(stats.data.find((d) => d.rating === 10).count).toBe(1)
  })
})

describe('calculateTextStats', () => {
  const question = TEST_SURVEY.questions[6]

  it('应该正确计算填空题词频统计', () => {
    const responses = [
      { answers: { q7: '界面很好' } },
      { answers: { q7: '需要改进' } },
      { answers: { q7: '界面很好' } },
      { answers: { q7: '' } },
      { answers: { q7: '  界面很好  ' } },
      { answers: { q7: '加油' } },
    ]
    const stats = calculateTextStats(question, responses)
    expect(stats.type).toBe(QUESTION_TYPES.TEXT)
    expect(stats.total).toBe(6)
    expect(stats.answeredCount).toBe(5)
    expect(stats.frequentWords.length).toBeGreaterThan(0)
  })

  it('应该只返回 TOP N', () => {
    const words = ['aaa', 'bbb', 'ccc', 'ddd', 'eee', 'fff']
    const responses = words.map((w) => ({ answers: { q7: w } }))
    const stats = calculateTextStats(question, responses, 3)
    expect(stats.frequentWords.length).toBeLessThanOrEqual(3)
  })

  it('空字符串和空白应该被忽略', () => {
    const responses = [
      { answers: { q7: '' } },
      { answers: { q7: '   ' } },
      { answers: { q7: null } },
    ]
    const stats = calculateTextStats(question, responses)
    expect(stats.answeredCount).toBe(0)
    expect(stats.frequentWords).toHaveLength(0)
  })

  it('null question 应该返回默认值', () => {
    const stats = calculateTextStats(null, [])
    expect(stats.total).toBe(0)
    expect(stats.answeredCount).toBe(0)
    expect(stats.frequentWords).toEqual([])
    expect(stats.sampleAnswers).toEqual([])
  })
})

describe('calculateAllStats', () => {
  it('应该根据题型调用正确的统计函数', () => {
    const stats = calculateAllStats(TEST_SURVEY.questions, [])
    expect(Object.keys(stats)).toHaveLength(TEST_SURVEY.questions.length)
    expect(stats.q1.type).toBe(QUESTION_TYPES.SINGLE)
    expect(stats.q3.type).toBe(QUESTION_TYPES.MULTIPLE)
    expect(stats.q5.type).toBe(QUESTION_TYPES.RATING)
    expect(stats.q7.type).toBe(QUESTION_TYPES.TEXT)
  })

  it('空 questions 应该返回空对象', () => {
    expect(calculateAllStats(null, [])).toEqual({})
    expect(calculateAllStats([], [])).toEqual({})
  })
})

describe('calculateDurationDistribution', () => {
  it('应该正确计算时长分布', () => {
    const responses = [
      { duration: 15 },
      { duration: 25 },
      { duration: 45 },
      { duration: 90 },
      { duration: 200 },
      { duration: 400 },
      { duration: 700 },
    ]
    const result = calculateDurationDistribution(responses)
    expect(result.total).toBe(7)
    expect(result.data[0].count).toBe(2)
    expect(result.data[1].count).toBe(1)
    expect(result.data[2].count).toBe(1)
    expect(result.data[3].count).toBe(1)
    expect(result.data[4].count).toBe(1)
    expect(result.data[5].count).toBe(1)
  })

  it('应该正确计算统计数据', () => {
    const responses = [
      { duration: 10 },
      { duration: 20 },
      { duration: 30 },
      { duration: 40 },
      { duration: 50 },
    ]
    const result = calculateDurationDistribution(responses)
    expect(result.statistics.min).toBe(10)
    expect(result.statistics.max).toBe(50)
    expect(result.statistics.average).toBe(30)
    expect(result.statistics.median).toBe(30)
  })

  it('偶数个数据时中位数应该取中间两个的平均', () => {
    const responses = [{ duration: 10 }, { duration: 30 }]
    const result = calculateDurationDistribution(responses)
    expect(result.statistics.median).toBe(20)
  })

  it('空数组应该返回零统计', () => {
    const result = calculateDurationDistribution([])
    expect(result.total).toBe(0)
    expect(result.data.every((d) => d.count === 0)).toBe(true)
    expect(result.statistics.min).toBe(0)
    expect(result.statistics.max).toBe(0)
    expect(result.statistics.average).toBe(0)
    expect(result.statistics.median).toBe(0)
  })

  it('null 应该返回默认值', () => {
    const result = calculateDurationDistribution(null)
    expect(result.total).toBe(0)
  })

  it('边界值应该分配到正确的桶（>=min 且 <max）', () => {
    const responses = [
      { duration: 29 },
      { duration: 59 },
      { duration: 119 },
      { duration: 299 },
      { duration: 599 },
      { duration: 600 },
    ]
    const result = calculateDurationDistribution(responses)
    expect(result.data[0].count).toBe(1)
    expect(result.data[1].count).toBe(1)
    expect(result.data[2].count).toBe(1)
    expect(result.data[3].count).toBe(1)
    expect(result.data[4].count).toBe(1)
    expect(result.data[5].count).toBe(1)
  })
})

describe('buildCrossAnalysisMatrix', () => {
  const q3 = TEST_SURVEY.questions[2]
  const q4 = TEST_SURVEY.questions[3]

  it('应该正确构建交叉分析矩阵', () => {
    const responses = [
      { answers: { q3: ['movie', 'music'], q4: ['search', 'social'] } },
      { answers: { q3: ['movie'], q4: ['search'] } },
      { answers: { q3: ['music'], q4: ['social', 'friend'] } },
    ]
    const matrix = buildCrossAnalysisMatrix(q3, q4, responses)
    expect(matrix).not.toBe(null)
    expect(matrix.totalResponses).toBe(3)
    expect(matrix.rowLabels).toHaveLength(q3.options.length)
    expect(matrix.colLabels).toHaveLength(q4.options.length)
    const movieIdx = q3.options.findIndex((o) => o.value === 'movie')
    const searchIdx = q4.options.findIndex((o) => o.value === 'search')
    expect(matrix.matrix[movieIdx][searchIdx].count).toBe(2)
  })

  it('应该返回行总计和列总计', () => {
    const responses = [
      { answers: { q3: ['movie'], q4: ['search'] } },
      { answers: { q3: ['music'], q4: ['social'] } },
    ]
    const matrix = buildCrossAnalysisMatrix(q3, q4, responses)
    const movieIdx = q3.options.findIndex((o) => o.value === 'movie')
    expect(matrix.rowTotals[movieIdx].count).toBe(1)
    const searchIdx = q4.options.findIndex((o) => o.value === 'search')
    expect(matrix.colTotals[searchIdx].count).toBe(1)
  })

  it('相同题目 ID 应该让主页面逻辑给出错误提示（此处返回 null）', () => {
    const m = buildCrossAnalysisMatrix(q3, q3, [])
    expect(m).not.toBe(null)
  })

  it('非多选题应该返回 null', () => {
    const singleQ = TEST_SURVEY.questions[0]
    expect(buildCrossAnalysisMatrix(singleQ, q4, [])).toBe(null)
    expect(buildCrossAnalysisMatrix(q3, singleQ, [])).toBe(null)
  })

  it('null 参数应该返回 null', () => {
    expect(buildCrossAnalysisMatrix(null, q4, [])).toBe(null)
    expect(buildCrossAnalysisMatrix(q3, null, [])).toBe(null)
  })
})

describe('paginateResponses', () => {
  const responses = Array.from({ length: 55 }, (_, i) => ({ id: `r${i}` }))

  it('应该正确分页', () => {
    const result = paginateResponses(responses, 1, 20)
    expect(result.items).toHaveLength(20)
    expect(result.total).toBe(55)
    expect(result.totalPage).toBe(3)
    expect(result.currentPage).toBe(1)
    expect(result.items[0].id).toBe('r0')
  })

  it('第二页应该从第21条开始', () => {
    const result = paginateResponses(responses, 2, 20)
    expect(result.items[0].id).toBe('r20')
    expect(result.items).toHaveLength(20)
  })

  it('最后一页应该只包含剩余数据', () => {
    const result = paginateResponses(responses, 3, 20)
    expect(result.items).toHaveLength(15)
    expect(result.items[0].id).toBe('r40')
  })

  it('无效页码应该被修正', () => {
    const result1 = paginateResponses(responses, 0, 20)
    expect(result1.currentPage).toBe(1)
    const result2 = paginateResponses(responses, 999, 20)
    expect(result2.currentPage).toBe(3)
  })

  it('null 应该返回默认分页', () => {
    const result = paginateResponses(null, 1, 20)
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(result.totalPage).toBe(1)
  })
})

describe('sortResponses', () => {
  const r1 = { id: 'r1', submittedAt: 1000, duration: 30 }
  const r2 = { id: 'r2', submittedAt: 2000, duration: 60 }
  const r3 = { id: 'r3', submittedAt: 3000, duration: 45 }
  const responses = [r1, r2, r3]

  it('应该按提交时间升序排序', () => {
    const shuffled = [r3, r1, r2]
    const sorted = sortResponses(shuffled, 'submittedAt', 'asc')
    expect(sorted.map((r) => r.id)).toEqual(['r1', 'r2', 'r3'])
  })

  it('应该按提交时间降序排序', () => {
    const shuffled = [r1, r3, r2]
    const sorted = sortResponses(shuffled, 'submittedAt', 'desc')
    expect(sorted.map((r) => r.id)).toEqual(['r3', 'r2', 'r1'])
  })

  it('不应该修改原数组', () => {
    const original = [r3, r1, r2]
    const originalIds = [...original.map((r) => r.id)]
    sortResponses(original, 'submittedAt', 'asc')
    expect(original.map((r) => r.id)).toEqual(originalIds)
  })

  it('null 应该返回空数组', () => {
    expect(sortResponses(null, 'submittedAt', 'asc')).toEqual([])
  })
})

describe('formatAnswerForDisplay', () => {
  it('单选题应该返回选项标签', () => {
    const q = TEST_SURVEY.questions[0]
    expect(formatAnswerForDisplay(q, 'male')).toBe('男')
    expect(formatAnswerForDisplay(q, 'unknown')).toBe('unknown')
  })

  it('多选题应该用顿号连接选项标签', () => {
    const q = TEST_SURVEY.questions[2]
    expect(formatAnswerForDisplay(q, ['movie', 'music'])).toBe('看电影、听音乐')
    expect(formatAnswerForDisplay(q, ['unknown'])).toBe('-')
  })

  it('评分题应该加星号后缀', () => {
    const q = TEST_SURVEY.questions[4]
    expect(formatAnswerForDisplay(q, 5)).toBe('5星')
  })

  it('填空题应该截断超长文本', () => {
    const q = TEST_SURVEY.questions[6]
    const longText = 'a'.repeat(60)
    expect(formatAnswerForDisplay(q, longText)).toHaveLength(53)
    expect(formatAnswerForDisplay(q, longText)).toContain('...')
  })

  it('空值应该返回 "-"', () => {
    const q = TEST_SURVEY.questions[0]
    expect(formatAnswerForDisplay(q, null)).toBe('-')
    expect(formatAnswerForDisplay(q, undefined)).toBe('-')
    expect(formatAnswerForDisplay(q, '')).toBe('-')
  })

  it('null question 应该返回 "-"', () => {
    expect(formatAnswerForDisplay(null, 'test')).toBe('-')
  })
})

describe('statsToCSV', () => {
  it('单选题应该正确导出 CSV', () => {
    const question = TEST_SURVEY.questions[0]
    const stats = {
      data: [
        { label: '男', count: 30, ratio: 60 },
        { label: '女', count: 20, ratio: 40 },
      ],
    }
    const csv = statsToCSV(question, stats)
    expect(csv).toContain('您的性别是？')
    expect(csv).toContain('选项,人数,占比')
    expect(csv).toContain('男,30,60.00%')
    expect(csv).toContain('女,20,40.00%')
  })

  it('评分题应该正确导出 CSV 含平均分和中位数', () => {
    const question = TEST_SURVEY.questions[4]
    const stats = {
      data: [
        { rating: 1, count: 2, ratio: 4 },
        { rating: 2, count: 3, ratio: 6 },
        { rating: 3, count: 10, ratio: 20 },
        { rating: 4, count: 20, ratio: 40 },
        { rating: 5, count: 15, ratio: 30 },
      ],
      average: 4.0,
      median: 4,
    }
    const csv = statsToCSV(question, stats)
    expect(csv).toContain('您对我们产品的整体满意度如何？')
    expect(csv).toContain('分值,人数,占比')
    expect(csv).toContain('5星,15,30.00%')
    expect(csv).toContain('平均分,4')
    expect(csv).toContain('中位数,4')
  })

  it('填空题应该正确导出 CSV', () => {
    const question = TEST_SURVEY.questions[6]
    const stats = {
      frequentWords: [
        { word: '界面很好', count: 10 },
        { word: '需要改进', count: 5 },
      ],
    }
    const csv = statsToCSV(question, stats)
    expect(csv).toContain('您对我们产品有什么建议？')
    expect(csv).toContain('高频词,出现次数')
    expect(csv).toContain('界面很好,10')
  })

  it('null 参数应该返回空字符串', () => {
    expect(statsToCSV(null, null)).toBe('')
  })
})

describe('responsesToCSV', () => {
  it('应该包含正确的表头', () => {
    const csv = responsesToCSV(TEST_SURVEY.questions, [])
    const headers = csv.split('\n')[0]
    expect(headers).toContain('答卷编号')
    expect(headers).toContain('提交时间')
    expect(headers).toContain('填写时长(秒)')
    TEST_SURVEY.questions.forEach((q) => {
      expect(headers).toContain(q.title)
    })
  })

  it('应该正确格式化答卷数据', () => {
    const ts = new Date('2025-06-15T14:30:00').getTime()
    const responses = [
      {
        id: 'r1',
        submittedAt: ts,
        duration: 120,
        answers: {
          q1: 'male',
          q2: '18-25',
          q3: ['movie', 'music'],
          q4: ['search'],
          q5: 5,
          q6: 4,
          q7: '很好',
          q8: '功能',
        },
      },
    ]
    const csv = responsesToCSV(TEST_SURVEY.questions, responses)
    expect(csv).toContain('r1')
    expect(csv).toContain('2025-06-15 14:30')
    expect(csv).toContain('120')
    expect(csv).toContain('男')
    expect(csv).toContain('看电影、听音乐')
    expect(csv).toContain('5星')
    expect(csv).toContain('很好')
  })

  it('null 参数应该返回空字符串', () => {
    expect(responsesToCSV(null, [])).toBe('')
  })
})

describe('mockData 生成器', () => {
  it('getMockSurvey 应该返回包含题目的问卷', () => {
    const survey = getMockSurvey()
    expect(survey.id).toBeDefined()
    expect(survey.title).toBeDefined()
    expect(Array.isArray(survey.questions)).toBe(true)
    expect(survey.questions.length).toBeGreaterThan(0)
  })

  it('generateMockResponses 应该生成指定数量的答卷', () => {
    const survey = getMockSurvey()
    const count = 10
    const responses = generateMockResponses(survey.questions, count)
    expect(responses).toHaveLength(count)
  })

  it('每份答卷应该包含所有题目的答案', () => {
    const survey = getMockSurvey()
    const responses = generateMockResponses(survey.questions, 5)
    responses.forEach((r) => {
      expect(r.id).toBeDefined()
      expect(r.submittedAt).toBeDefined()
      expect(r.duration).toBeDefined()
      expect(r.answers).toBeDefined()
      survey.questions.forEach((q) => {
        expect(r.answers[q.id]).toBeDefined()
      })
    })
  })

  it('提交时间应该按升序排列', () => {
    const survey = getMockSurvey()
    const responses = generateMockResponses(survey.questions, 10)
    for (let i = 1; i < responses.length; i += 1) {
      expect(responses[i].submittedAt).toBeGreaterThanOrEqual(responses[i - 1].submittedAt)
    }
  })
})

describe('localStorage 存储函数', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('saveSurveyData 应该正确保存数据', () => {
    const data = { survey: TEST_SURVEY, responses: [{ id: 'r1' }] }
    const result = saveSurveyData(data)
    expect(result).toBe(true)
    const saved = JSON.parse(mockStorage.getItem(STORAGE_KEY))
    expect(saved.survey.id).toBe(TEST_SURVEY.id)
    expect(saved.responses).toHaveLength(1)
  })

  it('loadSurveyData 没有数据时应该生成新数据', () => {
    const data = loadSurveyData()
    expect(data.survey).toBeDefined()
    expect(data.responses.length).toBeGreaterThanOrEqual(100)
    expect(data.responses.length).toBeLessThanOrEqual(200)
  })

  it('loadSurveyData 有数据时应该从 localStorage 加载', () => {
    const testData = { survey: TEST_SURVEY, responses: [{ id: 'r999' }] }
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(testData))
    const data = loadSurveyData()
    expect(data.survey.id).toBe(TEST_SURVEY.id)
    expect(data.responses).toHaveLength(1)
  })

  it('loadSurveyData 应该处理无效 JSON', () => {
    mockStorage.setItem(STORAGE_KEY, 'invalid-json')
    const data = loadSurveyData()
    expect(data.survey).toBeDefined()
    expect(data.responses.length).toBeGreaterThanOrEqual(100)
  })

  it('clearSurveyData 应该清除 localStorage 数据', () => {
    mockStorage.setItem(STORAGE_KEY, JSON.stringify({}))
    expect(mockStorage.getItem(STORAGE_KEY)).not.toBe(null)
    const result = clearSurveyData()
    expect(result).toBe(true)
    expect(mockStorage.getItem(STORAGE_KEY)).toBe(null)
  })

  it('regenerateMockData 应该重新生成数据', () => {
    const data1 = regenerateMockData()
    expect(data1.survey).toBeDefined()
    expect(data1.responses.length).toBeGreaterThanOrEqual(100)
  })

  it('localStorage 出错时应该优雅处理', () => {
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
    expect(saveSurveyData({})).toBe(false)
    expect(clearSurveyData()).toBe(false)
  })

  it('没有 window 对象时应该优雅处理', () => {
    vi.stubGlobal('window', undefined)
    const data = loadSurveyData()
    expect(data.survey).toBeDefined()
    expect(saveSurveyData({})).toBe(false)
    expect(clearSurveyData()).toBe(false)
  })
})
