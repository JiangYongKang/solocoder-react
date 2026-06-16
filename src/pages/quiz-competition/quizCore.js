export const QUESTION_TYPE = 'single'
export const QUESTION_TYPE_LABEL = '单选题'

export const DEFAULT_TIME_LIMIT = 15
export const DEFAULT_QUESTIONS_PER_ROUND = 10
export const BASE_SCORE = 10
export const WRONG_PENALTY = 5
export const TIMEOUT_PENALTY = 5
export const CORRECT_COIN_REWARD = 5
export const FULL_MARKS_BONUS = 20

export const ITEMS = {
  SKIP: 'skip',
  TIME: 'time',
  DOUBLE: 'double',
}

export const ITEM_INFO = {
  [ITEMS.SKIP]: {
    name: '跳过',
    cost: 30,
    description: '跳过当前题目，视为答对但不加分',
    icon: '⏭️',
  },
  [ITEMS.TIME]: {
    name: '加时',
    cost: 20,
    description: '当前题倒计时延长 10 秒',
    icon: '⏰',
  },
  [ITEMS.DOUBLE]: {
    name: '双倍',
    cost: 40,
    description: '下一题答对得分翻倍',
    icon: '✨',
  },
}

const QUESTIONS_STORAGE_KEY = 'quiz_competition_questions'
const RANKING_STORAGE_KEY = 'quiz_competition_ranking'
const COINS_STORAGE_KEY = 'quiz_competition_coins'
const INVENTORY_STORAGE_KEY = 'quiz_competition_inventory'

let idCounter = 0

export function generateId(prefix = 'id') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export const PRESET_QUESTIONS = [
  {
    id: 'preset_1',
    type: QUESTION_TYPE,
    stem: 'React 中用于管理组件状态的 Hook 是？',
    options: [
      { label: 'A', value: 'A', text: 'useEffect' },
      { label: 'B', value: 'B', text: 'useState' },
      { label: 'C', value: 'C', text: 'useMemo' },
      { label: 'D', value: 'D', text: 'useRef' },
    ],
    answer: 'B',
    category: 'React',
  },
  {
    id: 'preset_2',
    type: QUESTION_TYPE,
    stem: 'JavaScript 中哪个方法用于向数组末尾添加元素？',
    options: [
      { label: 'A', value: 'A', text: 'push()' },
      { label: 'B', value: 'B', text: 'pop()' },
      { label: 'C', value: 'C', text: 'shift()' },
      { label: 'D', value: 'D', text: 'unshift()' },
    ],
    answer: 'A',
    category: 'JavaScript',
  },
  {
    id: 'preset_3',
    type: QUESTION_TYPE,
    stem: 'CSS 中 flex 布局的主轴对齐方式属性是？',
    options: [
      { label: 'A', value: 'A', text: 'align-items' },
      { label: 'B', value: 'B', text: 'justify-content' },
      { label: 'C', value: 'C', text: 'flex-direction' },
      { label: 'D', value: 'D', text: 'flex-wrap' },
    ],
    answer: 'B',
    category: 'CSS',
  },
  {
    id: 'preset_4',
    type: QUESTION_TYPE,
    stem: 'HTML5 中用于绘图的标签是？',
    options: [
      { label: 'A', value: 'A', text: 'svg' },
      { label: 'B', value: 'B', text: 'canvas' },
      { label: 'C', value: 'C', text: 'image' },
      { label: 'D', value: 'D', text: 'paint' },
    ],
    answer: 'B',
    category: 'HTML',
  },
  {
    id: 'preset_5',
    type: QUESTION_TYPE,
    stem: '以下哪个不是 JavaScript 的基本数据类型？',
    options: [
      { label: 'A', value: 'A', text: 'string' },
      { label: 'B', value: 'B', text: 'number' },
      { label: 'C', value: 'C', text: 'array' },
      { label: 'D', value: 'D', text: 'boolean' },
    ],
    answer: 'C',
    category: 'JavaScript',
  },
  {
    id: 'preset_6',
    type: QUESTION_TYPE,
    stem: 'React 中组件的生命周期方法 componentDidMount 对应的 Hook 是？',
    options: [
      { label: 'A', value: 'A', text: 'useState' },
      { label: 'B', value: 'B', text: 'useEffect' },
      { label: 'C', value: 'C', text: 'useCallback' },
      { label: 'D', value: 'D', text: 'useMemo' },
    ],
    answer: 'B',
    category: 'React',
  },
  {
    id: 'preset_7',
    type: QUESTION_TYPE,
    stem: 'CSS 中 position: absolute 的定位基准是？',
    options: [
      { label: 'A', value: 'A', text: '浏览器窗口' },
      { label: 'B', value: 'B', text: '父元素' },
      { label: 'C', value: 'C', text: '最近的定位祖先元素' },
      { label: 'D', value: 'D', text: '文档流' },
    ],
    answer: 'C',
    category: 'CSS',
  },
  {
    id: 'preset_8',
    type: QUESTION_TYPE,
    stem: 'ES6 中用于定义常量的关键字是？',
    options: [
      { label: 'A', value: 'A', text: 'var' },
      { label: 'B', value: 'B', text: 'let' },
      { label: 'C', value: 'C', text: 'const' },
      { label: 'D', value: 'D', text: 'constant' },
    ],
    answer: 'C',
    category: 'JavaScript',
  },
  {
    id: 'preset_9',
    type: QUESTION_TYPE,
    stem: 'HTTP 状态码 404 表示什么？',
    options: [
      { label: 'A', value: 'A', text: '服务器错误' },
      { label: 'B', value: 'B', text: '资源未找到' },
      { label: 'C', value: 'C', text: '请求成功' },
      { label: 'D', value: 'D', text: '重定向' },
    ],
    answer: 'B',
    category: '网络',
  },
  {
    id: 'preset_10',
    type: QUESTION_TYPE,
    stem: 'Git 中用于查看提交历史的命令是？',
    options: [
      { label: 'A', value: 'A', text: 'git status' },
      { label: 'B', value: 'B', text: 'git log' },
      { label: 'C', value: 'C', text: 'git diff' },
      { label: 'D', value: 'D', text: 'git show' },
    ],
    answer: 'B',
    category: 'Git',
  },
  {
    id: 'preset_11',
    type: QUESTION_TYPE,
    stem: 'React Router 中用于路由跳转的 Hook 是？',
    options: [
      { label: 'A', value: 'A', text: 'useHistory' },
      { label: 'B', value: 'B', text: 'useNavigate' },
      { label: 'C', value: 'C', text: 'useLocation' },
      { label: 'D', value: 'D', text: 'useParams' },
    ],
    answer: 'B',
    category: 'React',
  },
  {
    id: 'preset_12',
    type: QUESTION_TYPE,
    stem: 'JavaScript 中 Promise 的三种状态不包括？',
    options: [
      { label: 'A', value: 'A', text: 'pending' },
      { label: 'B', value: 'B', text: 'fulfilled' },
      { label: 'C', value: 'C', text: 'rejected' },
      { label: 'D', value: 'D', text: 'completed' },
    ],
    answer: 'D',
    category: 'JavaScript',
  },
  {
    id: 'preset_13',
    type: QUESTION_TYPE,
    stem: 'CSS 中实现圆角的属性是？',
    options: [
      { label: 'A', value: 'A', text: 'border-style' },
      { label: 'B', value: 'B', text: 'border-radius' },
      { label: 'C', value: 'C', text: 'border-width' },
      { label: 'D', value: 'D', text: 'border-color' },
    ],
    answer: 'B',
    category: 'CSS',
  },
  {
    id: 'preset_14',
    type: QUESTION_TYPE,
    stem: 'HTML 中用于定义元数据的标签是？',
    options: [
      { label: 'A', value: 'A', text: 'meta' },
      { label: 'B', value: 'B', text: 'head' },
      { label: 'C', value: 'C', text: 'title' },
      { label: 'D', value: 'D', text: 'link' },
    ],
    answer: 'A',
    category: 'HTML',
  },
  {
    id: 'preset_15',
    type: QUESTION_TYPE,
    stem: '以下哪个是 React 的核心特性？',
    options: [
      { label: 'A', value: 'A', text: '双向数据绑定' },
      { label: 'B', value: 'B', text: '虚拟 DOM' },
      { label: 'C', value: 'C', text: '依赖注入' },
      { label: 'D', value: 'D', text: '模板引擎' },
    ],
    answer: 'B',
    category: 'React',
  },
  {
    id: 'preset_16',
    type: QUESTION_TYPE,
    stem: 'JavaScript 中哪个方法可以将数组转换为字符串？',
    options: [
      { label: 'A', value: 'A', text: 'toString()' },
      { label: 'B', value: 'B', text: 'valueOf()' },
      { label: 'C', value: 'C', text: 'join()' },
      { label: 'D', value: 'D', text: '以上都是' },
    ],
    answer: 'D',
    category: 'JavaScript',
  },
  {
    id: 'preset_17',
    type: QUESTION_TYPE,
    stem: 'CSS 选择器中，#id 和 .class 的优先级哪个更高？',
    options: [
      { label: 'A', value: 'A', text: '#id 更高' },
      { label: 'B', value: 'B', text: '.class 更高' },
      { label: 'C', value: 'C', text: '一样高' },
      { label: 'D', value: 'D', text: '取决于位置' },
    ],
    answer: 'A',
    category: 'CSS',
  },
  {
    id: 'preset_18',
    type: QUESTION_TYPE,
    stem: 'HTTP 方法中，幂等的方法是？',
    options: [
      { label: 'A', value: 'A', text: 'POST' },
      { label: 'B', value: 'B', text: 'GET' },
      { label: 'C', value: 'C', text: 'PATCH' },
      { label: 'D', value: 'D', text: '以上都不是' },
    ],
    answer: 'B',
    category: '网络',
  },
  {
    id: 'preset_19',
    type: QUESTION_TYPE,
    stem: 'Git 中用于创建分支的命令是？',
    options: [
      { label: 'A', value: 'A', text: 'git new' },
      { label: 'B', value: 'B', text: 'git branch' },
      { label: 'C', value: 'C', text: 'git create' },
      { label: 'D', value: 'D', text: 'git make' },
    ],
    answer: 'B',
    category: 'Git',
  },
  {
    id: 'preset_20',
    type: QUESTION_TYPE,
    stem: 'React 中 useCallback 和 useMemo 的区别是？',
    options: [
      { label: 'A', value: 'A', text: '没有区别' },
      { label: 'B', value: 'B', text: 'useCallback 缓存函数，useMemo 缓存计算结果' },
      { label: 'C', value: 'C', text: 'useMemo 缓存函数，useCallback 缓存计算结果' },
      { label: 'D', value: 'D', text: 'useCallback 用于类组件，useMemo 用于函数组件' },
    ],
    answer: 'B',
    category: 'React',
  },
  {
    id: 'preset_21',
    type: QUESTION_TYPE,
    stem: 'JavaScript 中 typeof null 的结果是？',
    options: [
      { label: 'A', value: 'A', text: 'null' },
      { label: 'B', value: 'B', text: 'undefined' },
      { label: 'C', value: 'C', text: 'object' },
      { label: 'D', value: 'D', text: 'number' },
    ],
    answer: 'C',
    category: 'JavaScript',
  },
  {
    id: 'preset_22',
    type: QUESTION_TYPE,
    stem: 'CSS 中实现文字溢出省略号的属性不包括？',
    options: [
      { label: 'A', value: 'A', text: 'overflow: hidden' },
      { label: 'B', value: 'B', text: 'white-space: nowrap' },
      { label: 'C', value: 'C', text: 'text-overflow: ellipsis' },
      { label: 'D', value: 'D', text: 'text-decoration: none' },
    ],
    answer: 'D',
    category: 'CSS',
  },
  {
    id: 'preset_23',
    type: QUESTION_TYPE,
    stem: 'HTML5 新增的语义化标签不包括？',
    options: [
      { label: 'A', value: 'A', text: 'header' },
      { label: 'B', value: 'B', text: 'footer' },
      { label: 'C', value: 'C', text: 'section' },
      { label: 'D', value: 'D', text: 'container' },
    ],
    answer: 'D',
    category: 'HTML',
  },
  {
    id: 'preset_24',
    type: QUESTION_TYPE,
    stem: '以下哪个不是 HTTP 请求方法？',
    options: [
      { label: 'A', value: 'A', text: 'PUT' },
      { label: 'B', value: 'B', text: 'DELETE' },
      { label: 'C', value: 'C', text: 'SEND' },
      { label: 'D', value: 'D', text: 'OPTIONS' },
    ],
    answer: 'C',
    category: '网络',
  },
  {
    id: 'preset_25',
    type: QUESTION_TYPE,
    stem: 'Git 中用于暂存修改的命令是？',
    options: [
      { label: 'A', value: 'A', text: 'git save' },
      { label: 'B', value: 'B', text: 'git stash' },
      { label: 'C', value: 'C', text: 'git store' },
      { label: 'D', value: 'D', text: 'git keep' },
    ],
    answer: 'B',
    category: 'Git',
  },
]

export function createQuestion() {
  return {
    id: generateId('q'),
    type: QUESTION_TYPE,
    stem: '',
    options: [
      { label: 'A', value: 'A', text: '' },
      { label: 'B', value: 'B', text: '' },
      { label: 'C', value: 'C', text: '' },
      { label: 'D', value: 'D', text: '' },
    ],
    answer: '',
    category: '',
  }
}

export function validateQuestion(question) {
  if (!question) return { valid: false, message: '题目不存在' }
  if (!question.stem || question.stem.trim() === '') {
    return { valid: false, message: '题目内容不能为空' }
  }
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    return { valid: false, message: '必须有 4 个选项' }
  }
  const filledOptions = question.options.filter((o) => o.text && o.text.trim() !== '')
  if (filledOptions.length < 4) {
    return { valid: false, message: '所有选项都必须填写内容' }
  }
  if (!question.answer || question.answer === '') {
    return { valid: false, message: '请设置正确答案' }
  }
  return { valid: true }
}

export function loadQuestions() {
  if (typeof window === 'undefined' || !window.localStorage) return [...PRESET_QUESTIONS]
  try {
    const raw = window.localStorage.getItem(QUESTIONS_STORAGE_KEY)
    if (!raw) return [...PRESET_QUESTIONS]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return [...PRESET_QUESTIONS]
    return parsed
  } catch {
    return [...PRESET_QUESTIONS]
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

export function filterQuestionsByCategory(questions, category = '') {
  if (!Array.isArray(questions)) return []
  if (!category || category.trim() === '') return [...questions]
  return questions.filter((q) => q.category === category)
}

export function getCategories(questions) {
  if (!Array.isArray(questions)) return []
  const set = new Set()
  questions.forEach((q) => {
    if (q.category && q.category.trim() !== '') {
      set.add(q.category)
    }
  })
  return [...set]
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

export function drawRandomQuestions(questions, count = DEFAULT_QUESTIONS_PER_ROUND) {
  if (!Array.isArray(questions) || questions.length === 0) return []
  const safeCount = Math.max(1, Math.min(count, questions.length))
  const shuffled = shuffleArray(questions)
  return shuffled.slice(0, safeCount)
}

export function calculateScore(isCorrect, isTimeout = false, hasDoubleItem = false) {
  if (isTimeout) return -TIMEOUT_PENALTY
  if (isCorrect) {
    const base = BASE_SCORE
    return hasDoubleItem ? base * 2 : base
  }
  return -WRONG_PENALTY
}

export function calculateRoundResult(questions, answers) {
  if (!Array.isArray(questions) || !Array.isArray(answers)) {
    return { totalScore: 0, correctCount: 0, wrongCount: 0, timeoutCount: 0, accuracy: 0, isFullMarks: false }
  }
  let correctCount = 0
  let wrongCount = 0
  let timeoutCount = 0
  let totalScore = 0
  let doubleNext = false

  questions.forEach((q, idx) => {
    const ans = answers[idx]
    if (!ans) {
      timeoutCount += 1
      totalScore += -TIMEOUT_PENALTY
      doubleNext = false
      return
    }
    if (ans.skipped) {
      correctCount += 1
      doubleNext = false
      return
    }
    const isCorrect = ans.selected === q.answer
    if (isCorrect) {
      correctCount += 1
      const score = calculateScore(true, false, doubleNext)
      totalScore += score
      doubleNext = false
    } else {
      wrongCount += 1
      totalScore += calculateScore(false)
      doubleNext = false
    }
    if (ans.doubleNext) {
      doubleNext = true
    }
  })

  const total = questions.length
  const accuracy = total > 0 ? correctCount / total : 0
  const isFullMarks = correctCount === total

  return {
    totalScore,
    correctCount,
    wrongCount,
    timeoutCount,
    accuracy,
    isFullMarks,
  }
}

export function calculateCoins(correctCount, isFullMarks) {
  const baseCoins = correctCount * CORRECT_COIN_REWARD
  const bonusCoins = isFullMarks ? FULL_MARKS_BONUS : 0
  return baseCoins + bonusCoins
}

export function loadCoins() {
  if (typeof window === 'undefined' || !window.localStorage) return 0
  try {
    const raw = window.localStorage.getItem(COINS_STORAGE_KEY)
    if (!raw) return 0
    const num = Number(raw)
    return Number.isFinite(num) && num >= 0 ? num : 0
  } catch {
    return 0
  }
}

export function saveCoins(coins) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.setItem(COINS_STORAGE_KEY, String(Math.max(0, coins)))
    return true
  } catch {
    return false
  }
}

export function canAffordItem(coins, itemType) {
  const info = ITEM_INFO[itemType]
  if (!info) return false
  return coins >= info.cost
}

export function buyItem(coins, inventory, itemType) {
  const info = ITEM_INFO[itemType]
  if (!info || coins < info.cost) {
    return { success: false, coins, inventory, message: '金币不足' }
  }
  const newCoins = coins - info.cost
  const newInventory = {
    ...inventory,
    [itemType]: (inventory?.[itemType] || 0) + 1,
  }
  return { success: true, coins: newCoins, inventory: newInventory }
}

export function loadInventory() {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    const raw = window.localStorage.getItem(INVENTORY_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed
  } catch {
    return {}
  }
}

export function saveInventory(inventory) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory || {}))
    return true
  } catch {
    return false
  }
}

export function consumeItem(inventory, itemType) {
  if (!inventory || !inventory[itemType] || inventory[itemType] <= 0) {
    return { success: false, inventory, message: '道具不足' }
  }
  const newInventory = {
    ...inventory,
    [itemType]: inventory[itemType] - 1,
  }
  return { success: true, inventory: newInventory }
}

export function createRankingRecord({
  nickname = '匿名玩家',
  score = 0,
  correctCount = 0,
  wrongCount = 0,
  timeoutCount = 0,
  rounds = 1,
  totalScore = 0,
  duration = 0,
}) {
  return {
    id: generateId('r'),
    nickname,
    score,
    correctCount,
    wrongCount,
    timeoutCount,
    rounds,
    totalScore,
    duration,
    accuracy: correctCount + wrongCount + timeoutCount > 0
      ? correctCount / (correctCount + wrongCount + timeoutCount)
      : 0,
    createdAt: Date.now(),
  }
}

export function loadRanking() {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(RANKING_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveRanking(ranking) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(ranking || []))
    return true
  } catch {
    return false
  }
}

export function addRankingRecord(ranking, record) {
  if (!Array.isArray(ranking)) return [record]
  return [...ranking, record]
}

export function sortRanking(ranking, sortBy = 'totalScore') {
  if (!Array.isArray(ranking)) return []
  const sorted = [...ranking]
  sorted.sort((a, b) => {
    const aVal = a[sortBy] || 0
    const bVal = b[sortBy] || 0
    if (bVal !== aVal) return bVal - aVal
    return (b.createdAt || 0) - (a.createdAt || 0)
  })
  return sorted
}

export function paginateRanking(ranking, page = 1, pageSize = 10) {
  if (!Array.isArray(ranking)) return { items: [], total: 0, totalPages: 0, page: 1, pageSize }
  const total = ranking.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const items = ranking.slice(start, start + pageSize)
  return { items, total, totalPages, page: safePage, pageSize }
}

export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0分0秒'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}分${secs}秒`
}

export function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatAccuracy(accuracy) {
  if (!accuracy || accuracy < 0) return '0%'
  return `${Math.round(accuracy * 100)}%`
}
