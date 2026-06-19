import {
  INTERVALS,
  MAX_DECK_NAME_LENGTH,
  ACCURACY_COLOR,
  ACCURACY_THRESHOLD,
  MASTERY_THRESHOLD,
} from './constants'

export function generateId(prefix = 'fc') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function formatDate(date) {
  if (!date) return ''
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getTodayKey() {
  return formatDate(new Date())
}

export function parseDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(dateKey, days) {
  const d = parseDate(dateKey)
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

export function getIntervalDays(reviewCount) {
  const count = Math.max(1, Math.floor(reviewCount))
  if (count <= 0) return INTERVALS[0]
  if (count >= INTERVALS.length) return INTERVALS[INTERVALS.length - 1]
  return INTERVALS[count - 1]
}

export function calculateNextReview(lastReviewDate, reviewCount, remembered) {
  const baseDate = lastReviewDate || getTodayKey()
  if (!remembered) {
    return addDays(baseDate, INTERVALS[0])
  }
  const days = getIntervalDays(reviewCount)
  return addDays(baseDate, days)
}

export function isCardDue(card, todayKey = getTodayKey()) {
  if (!card.nextReview) return true
  return card.nextReview <= todayKey
}

export function isNewCard(card) {
  return !card.lastReview && card.reviewCount === 0
}

export function calculateCorrectRate(card) {
  if (!card || !card.reviewCount || card.reviewCount === 0) return 0
  return card.correctCount / card.reviewCount
}

export function getAccuracyColor(correctRate) {
  if (correctRate >= ACCURACY_THRESHOLD.HIGH) return ACCURACY_COLOR.HIGH
  if (correctRate >= ACCURACY_THRESHOLD.MEDIUM) return ACCURACY_COLOR.MEDIUM
  return ACCURACY_COLOR.LOW
}

export function getAccuracyColorForCard(card) {
  return getAccuracyColor(calculateCorrectRate(card))
}

export function isCardMastered(card) {
  if (!card) return false
  const correctRate = calculateCorrectRate(card)
  return correctRate >= MASTERY_THRESHOLD.correctRate && card.reviewCount >= MASTERY_THRESHOLD.minReviews
}

export function validateDeckName(name, existingNames = []) {
  const trimmed = (name || '').trim()
  if (!trimmed) return { valid: false, error: '牌组名称不能为空' }
  if (trimmed.length > MAX_DECK_NAME_LENGTH) {
    return { valid: false, error: `牌组名称不能超过 ${MAX_DECK_NAME_LENGTH} 个字符` }
  }
  const lowerNames = existingNames.map(n => (n || '').trim().toLowerCase())
  if (lowerNames.includes(trimmed.toLowerCase())) {
    return { valid: false, error: '牌组名称已存在' }
  }
  return { valid: true }
}

export function validateCardContent(front, back) {
  const frontTrimmed = (front || '').trim()
  const backTrimmed = (back || '').trim()
  if (!frontTrimmed) return { valid: false, error: '正面内容不能为空' }
  if (!backTrimmed) return { valid: false, error: '反面内容不能为空' }
  return { valid: true }
}

export function createDeck(name) {
  return {
    id: generateId('deck'),
    name: name.trim(),
    createdAt: Date.now(),
  }
}

export function createCard(deckId, front, back, tags = []) {
  return {
    id: generateId('card'),
    deckId,
    front: front.trim(),
    back: back.trim(),
    tags,
    reviewCount: 0,
    correctCount: 0,
    wrongCount: 0,
    lastReview: null,
    nextReview: null,
    createdAt: Date.now(),
  }
}

export function reviewCard(card, remembered) {
  const newReviewCount = card.reviewCount + 1
  const newCorrectCount = card.correctCount + (remembered ? 1 : 0)
  const newWrongCount = card.wrongCount + (remembered ? 0 : 1)
  const today = getTodayKey()
  const nextReviewCount = remembered ? newReviewCount : 1
  const nextReview = calculateNextReview(today, nextReviewCount, remembered)

  return {
    ...card,
    reviewCount: newReviewCount,
    correctCount: newCorrectCount,
    wrongCount: newWrongCount,
    lastReview: today,
    nextReview,
  }
}

export function getCardsByDeckId(cards, deckId) {
  if (!Array.isArray(cards)) return []
  return cards.filter(c => c.deckId === deckId)
}

export function getDueCards(cards, todayKey = getTodayKey()) {
  if (!Array.isArray(cards)) return []
  return cards.filter(c => isCardDue(c, todayKey))
}

export function getNewCards(cards) {
  if (!Array.isArray(cards)) return []
  return cards.filter(c => isNewCard(c))
}

export function sortCardsForLearning(cards, todayKey = getTodayKey()) {
  if (!Array.isArray(cards)) return []
  const dueCards = getDueCards(cards, todayKey).filter(c => !isNewCard(c))
  const newCards = getNewCards(cards)
  return [...dueCards, ...newCards]
}

export function getDueCardCountForDeck(cards, deckId, todayKey = getTodayKey()) {
  const deckCards = getCardsByDeckId(cards, deckId)
  return getDueCards(deckCards, todayKey).length
}

export function sortCardsByCorrectRate(cards, ascending = false) {
  if (!Array.isArray(cards)) return []
  return [...cards].sort((a, b) => {
    const rateA = calculateCorrectRate(a)
    const rateB = calculateCorrectRate(b)
    return ascending ? rateA - rateB : rateB - rateA
  })
}

export function filterCardsByTags(cards, tags) {
  if (!Array.isArray(cards)) return []
  if (!Array.isArray(tags) || tags.length === 0) return cards
  return cards.filter(card => {
    if (!Array.isArray(card.tags)) return false
    return tags.some(tag => card.tags.includes(tag))
  })
}

export function getUniqueTags(cards) {
  if (!Array.isArray(cards)) return []
  const tagSet = new Set()
  cards.forEach(card => {
    if (Array.isArray(card.tags)) {
      card.tags.forEach(tag => tagSet.add(tag))
    }
  })
  return Array.from(tagSet)
}

export function getDayDifference(dateKey1, dateKey2) {
  const d1 = parseDate(dateKey1)
  const d2 = parseDate(dateKey2)
  const msPerDay = 86400000
  return Math.round((d2 - d1) / msPerDay)
}

export function calculateStreakDays(studyDates) {
  if (!Array.isArray(studyDates) || studyDates.length === 0) return 0
  const uniqueDates = Array.from(new Set(studyDates)).sort()
  const today = getTodayKey()
  const yesterday = addDays(today, -1)

  if (uniqueDates[uniqueDates.length - 1] !== today && uniqueDates[uniqueDates.length - 1] !== yesterday) {
    return 0
  }

  let streak = 1
  for (let i = uniqueDates.length - 2; i >= 0; i--) {
    const diff = getDayDifference(uniqueDates[i], uniqueDates[i + 1])
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

export function getStudyDatesFromStats(studyStats) {
  if (!studyStats || typeof studyStats !== 'object') return []
  return Object.keys(studyStats).filter(dateKey => {
    const dayStats = studyStats[dateKey]
    return dayStats && (dayStats.studied || dayStats.reviewed || dayStats.total > 0)
  })
}

export function buildHeatmapData(studyDates, days = 30) {
  const result = []
  const dateSet = new Set(studyDates || [])
  const today = parseDate(getTodayKey())

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateKey = formatDate(d)
    result.push({
      date: dateKey,
      studied: dateSet.has(dateKey),
      dayOfWeek: d.getDay(),
    })
  }

  return result
}

export function getHeatmapCellColor(studied, count = 0) {
  if (!studied) return '#ebedf0'
  if (count <= 0) return '#9be9a8'
  if (count === 1) return '#40c463'
  if (count === 2) return '#30a14e'
  return '#216e39'
}

export function calculateTotalStats(cards) {
  if (!Array.isArray(cards)) {
    return {
      totalCards: 0,
      masteredCards: 0,
      totalReviews: 0,
      totalCorrect: 0,
      totalWrong: 0,
    }
  }

  return cards.reduce(
    (acc, card) => ({
      totalCards: acc.totalCards + 1,
      masteredCards: acc.masteredCards + (isCardMastered(card) ? 1 : 0),
      totalReviews: acc.totalReviews + (card.reviewCount || 0),
      totalCorrect: acc.totalCorrect + (card.correctCount || 0),
      totalWrong: acc.totalWrong + (card.wrongCount || 0),
    }),
    { totalCards: 0, masteredCards: 0, totalReviews: 0, totalCorrect: 0, totalWrong: 0 }
  )
}

export function calculateDailyProgress(cards, studyStats, dailyGoal, todayKey = getTodayKey()) {
  const todayStats = studyStats?.[todayKey] || {}
  const completed = todayStats.total || 0
  const rate = dailyGoal > 0 ? Math.min(100, (completed / dailyGoal) * 100) : 0
  return {
    completed,
    goal: dailyGoal,
    rate,
  }
}

export function calculateSessionStats(results) {
  if (!Array.isArray(results)) {
    return { total: 0, remembered: 0, forgotten: 0, rate: 0 }
  }
  const total = results.length
  const remembered = results.filter(r => r.remembered).length
  const forgotten = total - remembered
  const rate = total > 0 ? (remembered / total) * 100 : 0
  return { total, remembered, forgotten, rate }
}

export function truncateText(text, maxLength = 50) {
  if (!text) return ''
  const clean = String(text).trim()
  if (clean.length <= maxLength) return clean
  return clean.slice(0, maxLength) + '...'
}
