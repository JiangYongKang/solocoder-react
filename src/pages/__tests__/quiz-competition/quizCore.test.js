import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  QUESTION_TYPE,
  QUESTION_TYPE_LABEL,
  DEFAULT_TIME_LIMIT,
  DEFAULT_QUESTIONS_PER_ROUND,
  BASE_SCORE,
  WRONG_PENALTY,
  TIMEOUT_PENALTY,
  CORRECT_COIN_REWARD,
  FULL_MARKS_BONUS,
  ITEMS,
  ITEM_INFO,
  PRESET_QUESTIONS,
  generateId,
  createQuestion,
  validateQuestion,
  loadQuestions,
  saveQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  filterQuestionsByCategory,
  getCategories,
  shuffleArray,
  drawRandomQuestions,
  calculateScore,
  calculateRoundResult,
  calculateCoins,
  loadCoins,
  saveCoins,
  canAffordItem,
  buyItem,
  loadInventory,
  saveInventory,
  consumeItem,
  createRankingRecord,
  loadRanking,
  saveRanking,
  addRankingRecord,
  sortRanking,
  paginateRanking,
  formatDuration,
  formatDate,
  formatAccuracy,
} from '../../quiz-competition/quizCore'

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

describe('常量定义', () => {
  it('应定义正确的题目类型', () => {
    expect(QUESTION_TYPE).toBe('single')
    expect(QUESTION_TYPE_LABEL).toBe('单选题')
  })

  it('应定义正确的默认值', () => {
    expect(DEFAULT_TIME_LIMIT).toBe(15)
    expect(DEFAULT_QUESTIONS_PER_ROUND).toBe(10)
    expect(BASE_SCORE).toBe(10)
    expect(WRONG_PENALTY).toBe(5)
    expect(TIMEOUT_PENALTY).toBe(5)
    expect(CORRECT_COIN_REWARD).toBe(5)
    expect(FULL_MARKS_BONUS).toBe(20)
  })

  it('应定义道具信息', () => {
    expect(Object.keys(ITEMS)).toHaveLength(3)
    expect(ITEMS.SKIP).toBe('skip')
    expect(ITEMS.TIME).toBe('time')
    expect(ITEMS.DOUBLE).toBe('double')

    expect(ITEM_INFO[ITEMS.SKIP].name).toBe('跳过')
    expect(ITEM_INFO[ITEMS.SKIP].cost).toBe(30)
    expect(ITEM_INFO[ITEMS.TIME].name).toBe('加时')
    expect(ITEM_INFO[ITEMS.TIME].cost).toBe(20)
    expect(ITEM_INFO[ITEMS.DOUBLE].name).toBe('双倍')
    expect(ITEM_INFO[ITEMS.DOUBLE].cost).toBe(40)
  })

  it('应包含至少 20 道预置题目', () => {
    expect(PRESET_QUESTIONS.length).toBeGreaterThanOrEqual(20)
  })

  it('预置题目格式正确', () => {
    const q = PRESET_QUESTIONS[0]
    expect(q.id).toBeDefined()
    expect(q.type).toBe(QUESTION_TYPE)
    expect(typeof q.stem).toBe('string')
    expect(q.stem.length).toBeGreaterThan(0)
    expect(Array.isArray(q.options)).toBe(true)
    expect(q.options).toHaveLength(4)
    expect(q.answer).toBeDefined()
    expect(typeof q.category).toBe('string')
  })
})

describe('generateId', () => {
  it('应生成带前缀的字符串 ID', () => {
    const id = generateId('test')
    expect(typeof id).toBe('string')
    expect(id.startsWith('test_')).toBe(true)
  })

  it('应生成唯一 ID', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i += 1) {
      ids.add(generateId('q'))
    }
    expect(ids.size).toBe(100)
  })

  it('默认前缀为 id', () => {
    const id = generateId()
    expect(id.startsWith('id_')).toBe(true)
  })
})

describe('createQuestion', () => {
  it('应创建一个单选题', () => {
    const q = createQuestion()
    expect(q.id).toBeDefined()
    expect(q.type).toBe(QUESTION_TYPE)
    expect(q.stem).toBe('')
    expect(Array.isArray(q.options)).toBe(true)
    expect(q.options).toHaveLength(4)
    expect(q.answer).toBe('')
    expect(q.category).toBe('')
  })

  it('选项格式正确', () => {
    const q = createQuestion()
    expect(q.options[0]).toEqual({ label: 'A', value: 'A', text: '' })
    expect(q.options[1]).toEqual({ label: 'B', value: 'B', text: '' })
    expect(q.options[2]).toEqual({ label: 'C', value: 'C', text: '' })
    expect(q.options[3]).toEqual({ label: 'D', value: 'D', text: '' })
  })
})

describe('validateQuestion', () => {
  it('应拒绝 null/undefined 题目', () => {
    expect(validateQuestion(null).valid).toBe(false)
    expect(validateQuestion(undefined).valid).toBe(false)
  })

  it('应拒绝空题干', () => {
    const q = createQuestion()
    expect(validateQuestion(q).valid).toBe(false)
  })

  it('应拒绝选项数量不正确', () => {
    const q = { ...createQuestion(), stem: 'Test', options: [] }
    expect(validateQuestion(q).valid).toBe(false)
  })

  it('应拒绝有空选项内容', () => {
    const q = {
      ...createQuestion(),
      stem: 'Test',
      options: [
        { label: 'A', value: 'A', text: 'Option A' },
        { label: 'B', value: 'B', text: '' },
        { label: 'C', value: 'C', text: '' },
        { label: 'D', value: 'D', text: '' },
      ],
    }
    expect(validateQuestion(q).valid).toBe(false)
  })

  it('应拒绝未设置答案', () => {
    const q = {
      ...createQuestion(),
      stem: 'Test',
      options: [
        { label: 'A', value: 'A', text: 'A' },
        { label: 'B', value: 'B', text: 'B' },
        { label: 'C', value: 'C', text: 'C' },
        { label: 'D', value: 'D', text: 'D' },
      ],
      answer: '',
    }
    expect(validateQuestion(q).valid).toBe(false)
  })

  it('应接受有效题目', () => {
    const q = {
      ...createQuestion(),
      stem: '1+1=?',
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
})

describe('题目 CRUD 操作', () => {
  it('addQuestion 应添加到空列表', () => {
    const q = createQuestion()
    expect(addQuestion(null, q)).toEqual([q])
    expect(addQuestion([], q)).toEqual([q])
  })

  it('addQuestion 应追加到现有列表', () => {
    const q1 = createQuestion()
    const q2 = createQuestion()
    const result = addQuestion([q1], q2)
    expect(result).toHaveLength(2)
    expect(result[1].id).toBe(q2.id)
  })

  it('updateQuestion 应更新匹配题目', () => {
    const q1 = { ...createQuestion(), stem: 'Old' }
    const q2 = createQuestion()
    const result = updateQuestion([q1, q2], q1.id, { stem: 'New' })
    expect(result[0].stem).toBe('New')
    expect(result[1].id).toBe(q2.id)
  })

  it('updateQuestion 应处理无效输入', () => {
    expect(updateQuestion(null, 'x', {})).toEqual([])
  })

  it('deleteQuestion 应按 ID 删除', () => {
    const q1 = createQuestion()
    const q2 = createQuestion()
    const result = deleteQuestion([q1, q2], q1.id)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(q2.id)
  })

  it('deleteQuestion 应处理无效输入', () => {
    expect(deleteQuestion(null, 'x')).toEqual([])
  })
})

describe('题目分类筛选', () => {
  const q1 = { ...createQuestion(), stem: 'Q1', category: 'React' }
  const q2 = { ...createQuestion(), stem: 'Q2', category: 'JavaScript' }
  const q3 = { ...createQuestion(), stem: 'Q3', category: 'React' }
  const q4 = { ...createQuestion(), stem: 'Q4', category: '' }
  const questions = [q1, q2, q3, q4]

  it('空分类应返回所有题目', () => {
    expect(filterQuestionsByCategory(questions)).toHaveLength(4)
    expect(filterQuestionsByCategory(questions, '')).toHaveLength(4)
  })

  it('按分类筛选', () => {
    const result = filterQuestionsByCategory(questions, 'React')
    expect(result).toHaveLength(2)
    expect(result.every((q) => q.category === 'React')).toBe(true)
  })

  it('getCategories 应获取所有分类', () => {
    const cats = getCategories(questions)
    expect(cats).toContain('React')
    expect(cats).toContain('JavaScript')
    expect(cats).not.toContain('')
    expect(cats.length).toBe(2)
  })

  it('应处理无效输入', () => {
    expect(filterQuestionsByCategory(null)).toEqual([])
    expect(getCategories(null)).toEqual([])
  })
})

describe('shuffleArray', () => {
  it('应处理无效输入', () => {
    expect(shuffleArray(null)).toEqual([])
    expect(shuffleArray(undefined)).toEqual([])
  })

  it('空数组应返回空数组', () => {
    expect(shuffleArray([])).toEqual([])
  })

  it('应返回相同元素（长度和值相同）', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const shuffled = shuffleArray(arr)
    expect(shuffled).toHaveLength(arr.length)
    expect(shuffled.sort()).toEqual([...arr].sort())
  })

  it('不应修改原数组', () => {
    const arr = [1, 2, 3, 4, 5]
    const frozen = [...arr]
    shuffleArray(arr)
    expect(arr).toEqual(frozen)
  })

  it('多次运行应产生不同顺序（概率性）', () => {
    const arr = [1, 2, 3, 4, 5, 6]
    const orderings = new Set()
    for (let i = 0; i < 50; i += 1) {
      orderings.add(JSON.stringify(shuffleArray(arr)))
    }
    expect(orderings.size).toBeGreaterThan(1)
  })
})

describe('drawRandomQuestions', () => {
  const questions = Array.from({ length: 20 }, (_, i) => ({
    ...createQuestion(),
    id: `q_${i}`,
    stem: `Q${i}`,
  }))

  it('应处理空题库', () => {
    expect(drawRandomQuestions([], 5)).toEqual([])
    expect(drawRandomQuestions(null, 5)).toEqual([])
  })

  it('应抽取指定数量的题目', () => {
    const result = drawRandomQuestions(questions, 5)
    expect(result).toHaveLength(5)
  })

  it('抽取数量不应超过题库总数', () => {
    const result = drawRandomQuestions(questions, 100)
    expect(result).toHaveLength(questions.length)
  })

  it('至少抽 1 题', () => {
    const result = drawRandomQuestions(questions, 0)
    expect(result).toHaveLength(1)
  })

  it('抽取的题目不重复', () => {
    const result = drawRandomQuestions(questions, 10)
    const ids = result.map((q) => q.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(10)
  })

  it('默认抽取数量应为 DEFAULT_QUESTIONS_PER_ROUND', () => {
    const result = drawRandomQuestions(questions)
    expect(result).toHaveLength(DEFAULT_QUESTIONS_PER_ROUND)
  })
})

describe('calculateScore', () => {
  it('答对得基础分', () => {
    expect(calculateScore(true)).toBe(BASE_SCORE)
  })

  it('答错扣分', () => {
    expect(calculateScore(false)).toBe(-WRONG_PENALTY)
  })

  it('超时扣分', () => {
    expect(calculateScore(false, true)).toBe(-TIMEOUT_PENALTY)
  })

  it('双倍道具时答对得双倍分', () => {
    expect(calculateScore(true, false, true)).toBe(BASE_SCORE * 2)
  })

  it('双倍道具不影响答错扣分', () => {
    expect(calculateScore(false, false, true)).toBe(-WRONG_PENALTY)
  })

  it('双倍道具不影响超时扣分', () => {
    expect(calculateScore(false, true, true)).toBe(-TIMEOUT_PENALTY)
  })
})

describe('calculateRoundResult', () => {
  const questions = [
    { ...createQuestion(), id: 'q1', answer: 'A' },
    { ...createQuestion(), id: 'q2', answer: 'B' },
    { ...createQuestion(), id: 'q3', answer: 'C' },
    { ...createQuestion(), id: 'q4', answer: 'D' },
    { ...createQuestion(), id: 'q5', answer: 'A' },
  ]

  it('应处理无效输入', () => {
    const result = calculateRoundResult(null, null)
    expect(result.totalScore).toBe(0)
    expect(result.correctCount).toBe(0)
    expect(result.wrongCount).toBe(0)
    expect(result.timeoutCount).toBe(0)
    expect(result.accuracy).toBe(0)
    expect(result.isFullMarks).toBe(false)
  })

  it('全对的情况', () => {
    const answers = questions.map((q) => ({ selected: q.answer, correct: true }))
    const result = calculateRoundResult(questions, answers)
    expect(result.correctCount).toBe(5)
    expect(result.wrongCount).toBe(0)
    expect(result.timeoutCount).toBe(0)
    expect(result.totalScore).toBe(5 * BASE_SCORE)
    expect(result.accuracy).toBe(1)
    expect(result.isFullMarks).toBe(true)
  })

  it('全错的情况', () => {
    const answers = questions.map(() => ({ selected: 'Z', correct: false }))
    const result = calculateRoundResult(questions, answers)
    expect(result.correctCount).toBe(0)
    expect(result.wrongCount).toBe(5)
    expect(result.timeoutCount).toBe(0)
    expect(result.totalScore).toBe(5 * -WRONG_PENALTY)
    expect(result.accuracy).toBe(0)
    expect(result.isFullMarks).toBe(false)
  })

  it('全超时的情况', () => {
    const answers = [null, null, null, null, null]
    const result = calculateRoundResult(questions, answers)
    expect(result.correctCount).toBe(0)
    expect(result.wrongCount).toBe(0)
    expect(result.timeoutCount).toBe(5)
    expect(result.totalScore).toBe(5 * -TIMEOUT_PENALTY)
    expect(result.accuracy).toBe(0)
  })

  it('混合情况', () => {
    const answers = [
      { selected: 'A', correct: true },
      { selected: 'A', correct: false },
      null,
      { selected: 'D', correct: true },
      { selected: 'B', correct: false },
    ]
    const result = calculateRoundResult(questions, answers)
    expect(result.correctCount).toBe(2)
    expect(result.wrongCount).toBe(2)
    expect(result.timeoutCount).toBe(1)
    expect(result.totalScore).toBe(2 * BASE_SCORE + 2 * -WRONG_PENALTY + -TIMEOUT_PENALTY)
    expect(result.accuracy).toBe(2 / 5)
  })

  it('跳过的题目计为正确但不加分', () => {
    const answers = [
      { selected: 'A', correct: true },
      { selected: 'B', skipped: true, correct: true },
      { selected: 'C', correct: true },
      { selected: 'D', skipped: true, correct: true },
      { selected: 'A', correct: true },
    ]
    const result = calculateRoundResult(questions, answers)
    expect(result.correctCount).toBe(5)
    expect(result.isFullMarks).toBe(true)
    expect(result.totalScore).toBe(3 * BASE_SCORE)
  })

  it('双倍道具效果', () => {
    const answers = [
      { selected: 'A', correct: true, doubleNext: true },
      { selected: 'B', correct: true },
      { selected: 'C', correct: true },
    ]
    const result = calculateRoundResult(questions.slice(0, 3), answers)
    expect(result.correctCount).toBe(3)
    expect(result.totalScore).toBe(BASE_SCORE + BASE_SCORE * 2 + BASE_SCORE)
  })
})

describe('calculateCoins', () => {
  it('答对题目获得金币', () => {
    expect(calculateCoins(5, false)).toBe(5 * CORRECT_COIN_REWARD)
  })

  it('满分额外奖励金币', () => {
    expect(calculateCoins(10, true)).toBe(10 * CORRECT_COIN_REWARD + FULL_MARKS_BONUS)
  })

  it('0 题答对得 0 金币', () => {
    expect(calculateCoins(0, false)).toBe(0)
  })
})

describe('金币 localStorage', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('loadCoins 无数据时返回 0', () => {
    expect(loadCoins()).toBe(0)
  })

  it('saveCoins 和 loadCoins 应正常工作', () => {
    expect(saveCoins(100)).toBe(true)
    expect(loadCoins()).toBe(100)
  })

  it('金币不能为负数', () => {
    saveCoins(-50)
    expect(loadCoins()).toBe(0)
  })

  it('无效数据返回 0', () => {
    mockStorage.setItem('quiz_competition_coins', 'not_a_number')
    expect(loadCoins()).toBe(0)
  })

  it('应处理 localStorage 异常', () => {
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
    expect(loadCoins()).toBe(0)
    expect(saveCoins(100)).toBe(false)
  })
})

describe('道具系统', () => {
  it('canAffordItem 应检查金币是否足够', () => {
    expect(canAffordItem(50, ITEMS.SKIP)).toBe(true)
    expect(canAffordItem(20, ITEMS.SKIP)).toBe(false)
    expect(canAffordItem(100, ITEMS.INVALID)).toBe(false)
  })

  it('buyItem 购买成功应扣金币加道具', () => {
    const result = buyItem(100, {}, ITEMS.SKIP)
    expect(result.success).toBe(true)
    expect(result.coins).toBe(70)
    expect(result.inventory[ITEMS.SKIP]).toBe(1)
  })

  it('buyItem 金币不足应失败', () => {
    const result = buyItem(10, {}, ITEMS.SKIP)
    expect(result.success).toBe(false)
    expect(result.coins).toBe(10)
    expect(result.message).toBe('金币不足')
  })

  it('buyItem 购买多个道具', () => {
    let result = buyItem(100, {}, ITEMS.SKIP)
    result = buyItem(result.coins, result.inventory, ITEMS.SKIP)
    result = buyItem(result.coins, result.inventory, ITEMS.TIME)
    expect(result.success).toBe(true)
    expect(result.coins).toBe(100 - 30 - 30 - 20)
    expect(result.inventory[ITEMS.SKIP]).toBe(2)
    expect(result.inventory[ITEMS.TIME]).toBe(1)
  })

  it('buyItem 无效道具类型应失败', () => {
    const result = buyItem(100, {}, 'invalid')
    expect(result.success).toBe(false)
  })

  it('consumeItem 使用道具成功', () => {
    const inventory = { [ITEMS.SKIP]: 3 }
    const result = consumeItem(inventory, ITEMS.SKIP)
    expect(result.success).toBe(true)
    expect(result.inventory[ITEMS.SKIP]).toBe(2)
  })

  it('consumeItem 道具不足应失败', () => {
    const result = consumeItem({}, ITEMS.SKIP)
    expect(result.success).toBe(false)
    expect(result.message).toBe('道具不足')
  })

  it('consumeItem 道具为 0 应失败', () => {
    const inventory = { [ITEMS.SKIP]: 0 }
    const result = consumeItem(inventory, ITEMS.SKIP)
    expect(result.success).toBe(false)
  })
})

describe('背包 localStorage', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('loadInventory 无数据时返回空对象', () => {
    expect(loadInventory()).toEqual({})
  })

  it('saveInventory 和 loadInventory 应正常工作', () => {
    const inv = { [ITEMS.SKIP]: 5, [ITEMS.TIME]: 3 }
    expect(saveInventory(inv)).toBe(true)
    const loaded = loadInventory()
    expect(loaded[ITEMS.SKIP]).toBe(5)
    expect(loaded[ITEMS.TIME]).toBe(3)
  })

  it('应处理无效 JSON', () => {
    mockStorage.setItem('quiz_competition_inventory', 'bad json')
    expect(loadInventory()).toEqual({})
  })

  it('应处理 localStorage 异常', () => {
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
    expect(loadInventory()).toEqual({})
    expect(saveInventory({})).toBe(false)
  })
})

describe('排行榜', () => {
  it('createRankingRecord 应创建正确的记录', () => {
    const record = createRankingRecord({
      nickname: 'TestPlayer',
      score: 80,
      correctCount: 8,
      wrongCount: 2,
      timeoutCount: 0,
      rounds: 1,
      totalScore: 80,
      duration: 60,
    })
    expect(record.id).toBeDefined()
    expect(record.nickname).toBe('TestPlayer')
    expect(record.score).toBe(80)
    expect(record.correctCount).toBe(8)
    expect(record.wrongCount).toBe(2)
    expect(record.rounds).toBe(1)
    expect(record.totalScore).toBe(80)
    expect(record.accuracy).toBe(0.8)
    expect(record.createdAt).toBeDefined()
  })

  it('createRankingRecord 应有默认值', () => {
    const record = createRankingRecord({})
    expect(record.nickname).toBe('匿名玩家')
    expect(record.score).toBe(0)
    expect(record.rounds).toBe(1)
    expect(record.accuracy).toBe(0)
  })

  it('addRankingRecord 应添加记录', () => {
    const r1 = createRankingRecord({ nickname: 'A' })
    const r2 = createRankingRecord({ nickname: 'B' })
    const result = addRankingRecord([r1], r2)
    expect(result).toHaveLength(2)
  })

  it('addRankingRecord 应处理空列表', () => {
    const r = createRankingRecord({})
    expect(addRankingRecord(null, r)).toEqual([r])
  })

  it('sortRanking 按总分降序排列', () => {
    const records = [
      { id: '1', totalScore: 50, createdAt: 100 },
      { id: '2', totalScore: 100, createdAt: 200 },
      { id: '3', totalScore: 75, createdAt: 150 },
    ]
    const sorted = sortRanking(records, 'totalScore')
    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('3')
    expect(sorted[2].id).toBe('1')
  })

  it('sortRanking 总分相同按时间降序', () => {
    const records = [
      { id: '1', totalScore: 100, createdAt: 100 },
      { id: '2', totalScore: 100, createdAt: 200 },
    ]
    const sorted = sortRanking(records, 'totalScore')
    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('1')
  })

  it('sortRanking 应处理无效输入', () => {
    expect(sortRanking(null)).toEqual([])
  })

  it('paginateRanking 应正确分页', () => {
    const records = Array.from({ length: 25 }, (_, i) => ({ id: `r${i}`, totalScore: 100 - i }))
    const result = paginateRanking(records, 1, 10)
    expect(result.items).toHaveLength(10)
    expect(result.total).toBe(25)
    expect(result.totalPages).toBe(3)
    expect(result.page).toBe(1)
    expect(result.items[0].id).toBe('r0')
  })

  it('paginateRanking 最后一页', () => {
    const records = Array.from({ length: 25 }, (_, i) => ({ id: `r${i}` }))
    const result = paginateRanking(records, 3, 10)
    expect(result.items).toHaveLength(5)
    expect(result.page).toBe(3)
  })

  it('paginateRanking 越界页码应被限制', () => {
    const records = Array.from({ length: 15 }, (_, i) => ({ id: `r${i}` }))
    const result = paginateRanking(records, 99, 10)
    expect(result.page).toBe(2)
  })

  it('paginateRanking 空列表', () => {
    const result = paginateRanking([], 1, 10)
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(1)
  })

  it('paginateRanking 应处理无效输入', () => {
    const result = paginateRanking(null)
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
  })
})

describe('排行榜 localStorage', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('loadRanking 无数据时返回空数组', () => {
    expect(loadRanking()).toEqual([])
  })

  it('saveRanking 和 loadRanking 应正常工作', () => {
    const record = createRankingRecord({ nickname: 'Test' })
    expect(saveRanking([record])).toBe(true)
    const loaded = loadRanking()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].nickname).toBe('Test')
  })

  it('应处理无效 JSON', () => {
    mockStorage.setItem('quiz_competition_ranking', 'bad json')
    expect(loadRanking()).toEqual([])
  })

  it('应处理 localStorage 异常', () => {
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
    expect(loadRanking()).toEqual([])
    expect(saveRanking([])).toBe(false)
  })
})

describe('题目 localStorage', () => {
  let mockStorage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('window', { localStorage: mockStorage })
    mockStorage.clear()
  })

  it('loadQuestions 无数据时返回预置题目', () => {
    const loaded = loadQuestions()
    expect(loaded).toHaveLength(PRESET_QUESTIONS.length)
  })

  it('saveQuestions 和 loadQuestions 应正常工作', () => {
    const testQuestions = [{ id: 'test1', stem: 'Test' }]
    expect(saveQuestions(testQuestions)).toBe(true)
    const loaded = loadQuestions()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe('test1')
  })

  it('应处理无效 JSON', () => {
    mockStorage.setItem('quiz_competition_questions', 'bad json')
    const loaded = loadQuestions()
    expect(loaded).toHaveLength(PRESET_QUESTIONS.length)
  })

  it('空数组应返回预置题目', () => {
    saveQuestions([])
    const loaded = loadQuestions()
    expect(loaded).toHaveLength(PRESET_QUESTIONS.length)
  })

  it('应处理 localStorage 异常', () => {
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
    const loaded = loadQuestions()
    expect(loaded).toHaveLength(PRESET_QUESTIONS.length)
    expect(saveQuestions([])).toBe(false)
  })
})

describe('格式化函数', () => {
  it('formatDuration 应格式化时间', () => {
    expect(formatDuration(0)).toBe('0分0秒')
    expect(formatDuration(65)).toBe('1分5秒')
    expect(formatDuration(3661)).toBe('61分1秒')
    expect(formatDuration(-5)).toBe('0分0秒')
  })

  it('formatDate 应格式化日期', () => {
    const ts = new Date('2024-01-15T10:30:00').getTime()
    const result = formatDate(ts)
    expect(result).toContain('2024')
    expect(result).toContain('01')
    expect(result).toContain('15')
    expect(result).toContain('10')
    expect(result).toContain('30')
  })

  it('formatDate 应处理假值', () => {
    expect(formatDate(0)).toBe('')
    expect(formatDate(null)).toBe('')
  })

  it('formatAccuracy 应格式化为百分比', () => {
    expect(formatAccuracy(0)).toBe('0%')
    expect(formatAccuracy(0.5)).toBe('50%')
    expect(formatAccuracy(1)).toBe('100%')
    expect(formatAccuracy(0.857)).toBe('86%')
    expect(formatAccuracy(-0.5)).toBe('0%')
  })
})
