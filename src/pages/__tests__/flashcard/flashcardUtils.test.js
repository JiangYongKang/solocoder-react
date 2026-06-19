import { describe, it, expect, beforeEach } from 'vitest'
import {
  getIntervalDays,
  calculateNextReview,
  isCardDue,
  isNewCard,
  calculateCorrectRate,
  getAccuracyColor,
  getAccuracyColorForCard,
  isCardMastered,
  validateDeckName,
  validateCardContent,
  createDeck,
  createCard,
  reviewCard,
  getDueCards,
  getNewCards,
  sortCardsForLearning,
  sortCardsByCorrectRate,
  filterCardsByTags,
  getUniqueTags,
  calculateStreakDays,
  buildHeatmapData,
  buildHeatmapFromDates,
  buildHeatmapFromStats,
  getHeatmapLevel,
  getHeatmapCellColor,
  calculateTotalStats,
  calculateDailyProgress,
  calculateSessionStats,
  truncateText,
  addDays,
  getTodayKey,
  formatDate,
  parseDate,
} from '@/pages/flashcard/flashcardUtils'
import {
  INTERVALS,
  ACCURACY_COLOR,
  ACCURACY_THRESHOLD,
  MASTERY_THRESHOLD,
  MAX_DECK_NAME_LENGTH,
} from '@/pages/flashcard/constants'
import {
  loadDecks,
  saveDecks,
  loadCards,
  saveCards,
  loadStats,
  saveStats,
  loadSettings,
  saveSettings,
  recordStudySession,
} from '@/pages/flashcard/storage'

function createMockStorage() {
  const store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    _store: store,
  }
}

describe('艾宾浩斯间隔重复算法', () => {
  describe('getIntervalDays', () => {
    it('第1次复习间隔为1天', () => {
      expect(getIntervalDays(1)).toBe(INTERVALS[0])
    })

    it('第2次复习间隔为3天', () => {
      expect(getIntervalDays(2)).toBe(INTERVALS[1])
    })

    it('第3次复习间隔为7天', () => {
      expect(getIntervalDays(3)).toBe(INTERVALS[2])
    })

    it('第4次复习间隔为14天', () => {
      expect(getIntervalDays(4)).toBe(INTERVALS[3])
    })

    it('第5次复习间隔为30天', () => {
      expect(getIntervalDays(5)).toBe(INTERVALS[4])
    })

    it('第6次及以上复习间隔为60天', () => {
      expect(getIntervalDays(6)).toBe(INTERVALS[5])
      expect(getIntervalDays(10)).toBe(INTERVALS[5])
      expect(getIntervalDays(100)).toBe(INTERVALS[5])
    })

    it('处理 0 和负数输入', () => {
      expect(getIntervalDays(0)).toBe(INTERVALS[0])
      expect(getIntervalDays(-1)).toBe(INTERVALS[0])
    })
  })

  describe('calculateNextReview', () => {
    it('答对时根据复习次数计算下次复习日期', () => {
      const baseDate = '2024-01-01'
      expect(calculateNextReview(baseDate, 1, true)).toBe(addDays(baseDate, INTERVALS[0]))
      expect(calculateNextReview(baseDate, 2, true)).toBe(addDays(baseDate, INTERVALS[1]))
      expect(calculateNextReview(baseDate, 6, true)).toBe(addDays(baseDate, INTERVALS[5]))
    })

    it('答错时重置为1天间隔', () => {
      const baseDate = '2024-01-01'
      expect(calculateNextReview(baseDate, 5, false)).toBe(addDays(baseDate, INTERVALS[0]))
      expect(calculateNextReview(baseDate, 100, false)).toBe(addDays(baseDate, INTERVALS[0]))
    })

    it('没有上次复习日期时使用今天', () => {
      const today = getTodayKey()
      const result = calculateNextReview(null, 1, true)
      expect(result).toBe(addDays(today, INTERVALS[0]))
    })
  })

  describe('isCardDue', () => {
    it('没有 nextReview 的卡片视为到期', () => {
      expect(isCardDue({ nextReview: null })).toBe(true)
      expect(isCardDue({})).toBe(true)
    })

    it('nextReview 早于或等于今天视为到期', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      expect(isCardDue({ nextReview: today }, today)).toBe(true)
      expect(isCardDue({ nextReview: yesterday }, today)).toBe(true)
    })

    it('nextReview 晚于今天视为未到期', () => {
      const today = getTodayKey()
      const tomorrow = addDays(today, 1)
      expect(isCardDue({ nextReview: tomorrow }, today)).toBe(false)
    })
  })

  describe('isNewCard', () => {
    it('没有复习记录的是新卡片', () => {
      expect(isNewCard({ lastReview: null, reviewCount: 0 })).toBe(true)
      expect(isNewCard({ reviewCount: 0 })).toBe(true)
    })

    it('有复习记录的不是新卡片', () => {
      expect(isNewCard({ lastReview: '2024-01-01', reviewCount: 1 })).toBe(false)
      expect(isNewCard({ lastReview: null, reviewCount: 1 })).toBe(false)
    })
  })

  describe('reviewCard', () => {
    it('答对时正确更新计数和下次复习时间', () => {
      const card = {
        reviewCount: 0,
        correctCount: 0,
        wrongCount: 0,
        lastReview: null,
        nextReview: null,
      }
      const result = reviewCard(card, true)
      expect(result.reviewCount).toBe(1)
      expect(result.correctCount).toBe(1)
      expect(result.wrongCount).toBe(0)
      expect(result.lastReview).toBe(getTodayKey())
      expect(result.nextReview).toBe(addDays(getTodayKey(), INTERVALS[0]))
    })

    it('答错时正确更新计数和重置间隔', () => {
      const card = {
        reviewCount: 5,
        correctCount: 5,
        wrongCount: 0,
        lastReview: '2024-01-01',
        nextReview: '2024-02-01',
      }
      const result = reviewCard(card, false)
      expect(result.reviewCount).toBe(6)
      expect(result.correctCount).toBe(5)
      expect(result.wrongCount).toBe(1)
      expect(result.lastReview).toBe(getTodayKey())
      expect(result.nextReview).toBe(addDays(getTodayKey(), INTERVALS[0]))
    })

    it('不修改原始卡片对象', () => {
      const card = {
        reviewCount: 0,
        correctCount: 0,
        wrongCount: 0,
        lastReview: null,
        nextReview: null,
      }
      reviewCard(card, true)
      expect(card.reviewCount).toBe(0)
    })
  })
})

describe('答对率颜色判定逻辑', () => {
  describe('calculateCorrectRate', () => {
    it('未复习时答对率为0', () => {
      expect(calculateCorrectRate(null)).toBe(0)
      expect(calculateCorrectRate({})).toBe(0)
      expect(calculateCorrectRate({ reviewCount: 0 })).toBe(0)
    })

    it('计算正确的答对率', () => {
      expect(calculateCorrectRate({ reviewCount: 10, correctCount: 8 })).toBe(0.8)
      expect(calculateCorrectRate({ reviewCount: 2, correctCount: 1 })).toBe(0.5)
      expect(calculateCorrectRate({ reviewCount: 5, correctCount: 0 })).toBe(0)
    })
  })

  describe('getAccuracyColor', () => {
    it('答对率>=80%返回绿色', () => {
      expect(getAccuracyColor(0.8)).toBe(ACCURACY_COLOR.HIGH)
      expect(getAccuracyColor(0.9)).toBe(ACCURACY_COLOR.HIGH)
      expect(getAccuracyColor(1.0)).toBe(ACCURACY_COLOR.HIGH)
    })

    it('答对率50%-80%返回黄色', () => {
      expect(getAccuracyColor(0.5)).toBe(ACCURACY_COLOR.MEDIUM)
      expect(getAccuracyColor(0.6)).toBe(ACCURACY_COLOR.MEDIUM)
      expect(getAccuracyColor(0.79)).toBe(ACCURACY_COLOR.MEDIUM)
    })

    it('答对率<50%返回红色', () => {
      expect(getAccuracyColor(0.49)).toBe(ACCURACY_COLOR.LOW)
      expect(getAccuracyColor(0.2)).toBe(ACCURACY_COLOR.LOW)
      expect(getAccuracyColor(0)).toBe(ACCURACY_COLOR.LOW)
    })
  })

  describe('isCardMastered', () => {
    it('答对率>=80%且复习>=3次视为已掌握', () => {
      expect(isCardMastered({ reviewCount: 3, correctCount: 3 })).toBe(true)
      expect(isCardMastered({ reviewCount: 10, correctCount: 8 })).toBe(true)
    })

    it('答对率不足不视为已掌握', () => {
      expect(isCardMastered({ reviewCount: 3, correctCount: 2 })).toBe(false)
      expect(isCardMastered({ reviewCount: 10, correctCount: 7 })).toBe(false)
    })

    it('复习次数不足不视为已掌握', () => {
      expect(isCardMastered({ reviewCount: 2, correctCount: 2 })).toBe(false)
    })

    it('空卡片不视为已掌握', () => {
      expect(isCardMastered(null)).toBe(false)
      expect(isCardMastered(undefined)).toBe(false)
    })
  })
})

describe('牌组和卡片验证', () => {
  describe('validateDeckName', () => {
    it('空名称验证失败', () => {
      expect(validateDeckName('')).toEqual({ valid: false, error: expect.any(String) })
      expect(validateDeckName('   ')).toEqual({ valid: false, error: expect.any(String) })
    })

    it('超过最大长度验证失败', () => {
      const longName = 'a'.repeat(MAX_DECK_NAME_LENGTH + 1)
      expect(validateDeckName(longName)).toEqual({ valid: false, error: expect.any(String) })
    })

    it('重复名称验证失败', () => {
      expect(validateDeckName('Test', ['Test'])).toEqual({ valid: false, error: expect.any(String) })
      expect(validateDeckName('test', ['Test'])).toEqual({ valid: false, error: expect.any(String) })
    })

    it('有效名称验证通过', () => {
      expect(validateDeckName('英语单词')).toEqual({ valid: true })
      expect(validateDeckName('Test', ['Other'])).toEqual({ valid: true })
    })
  })

  describe('validateCardContent', () => {
    it('正面为空验证失败', () => {
      expect(validateCardContent('', 'back')).toEqual({ valid: false, error: expect.any(String) })
      expect(validateCardContent('   ', 'back')).toEqual({ valid: false, error: expect.any(String) })
    })

    it('反面为空验证失败', () => {
      expect(validateCardContent('front', '')).toEqual({ valid: false, error: expect.any(String) })
      expect(validateCardContent('front', '   ')).toEqual({ valid: false, error: expect.any(String) })
    })

    it('有效内容验证通过', () => {
      expect(validateCardContent('Apple', '苹果')).toEqual({ valid: true })
    })
  })
})

describe('连续打卡天数计算', () => {
  describe('calculateStreakDays', () => {
    it('空数组返回0', () => {
      expect(calculateStreakDays([])).toBe(0)
      expect(calculateStreakDays(null)).toBe(0)
    })

    it('今天有记录则从今天开始计数', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      const twoDaysAgo = addDays(today, -2)
      expect(calculateStreakDays([today])).toBe(1)
      expect(calculateStreakDays([twoDaysAgo, yesterday, today])).toBe(3)
    })

    it('今天没记录但昨天有则从昨天开始计数', () => {
      const yesterday = addDays(getTodayKey(), -1)
      const twoDaysAgo = addDays(getTodayKey(), -2)
      expect(calculateStreakDays([yesterday])).toBe(1)
      expect(calculateStreakDays([twoDaysAgo, yesterday])).toBe(2)
    })

    it('昨天和今天都没记录返回0', () => {
      const threeDaysAgo = addDays(getTodayKey(), -3)
      expect(calculateStreakDays([threeDaysAgo])).toBe(0)
    })

    it('有间断则只计连续部分', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      const threeDaysAgo = addDays(today, -3)
      expect(calculateStreakDays([threeDaysAgo, yesterday, today])).toBe(2)
    })

    it('处理重复日期', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      expect(calculateStreakDays([yesterday, yesterday, today, today])).toBe(2)
    })
  })
})

describe('新卡片与到期卡片优先级排序', () => {
  describe('sortCardsForLearning', () => {
    it('到期复习卡片排在新卡片前面', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      const tomorrow = addDays(today, 1)

      const dueCard = { id: 'due', nextReview: yesterday, reviewCount: 1, lastReview: yesterday }
      const newCard = { id: 'new', nextReview: null, reviewCount: 0, lastReview: null }
      const futureCard = { id: 'future', nextReview: tomorrow, reviewCount: 1, lastReview: yesterday }

      const sorted = sortCardsForLearning([futureCard, newCard, dueCard], today)
      expect(sorted[0].id).toBe('due')
      expect(sorted[1].id).toBe('new')
      expect(sorted).not.toContainEqual(expect.objectContaining({ id: 'future' }))
    })

    it('空数组返回空', () => {
      expect(sortCardsForLearning([])).toEqual([])
      expect(sortCardsForLearning(null)).toEqual([])
    })

    it('只有到期卡片时正确返回', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      const dueCard = { id: 'due', nextReview: yesterday, reviewCount: 1, lastReview: yesterday }
      const sorted = sortCardsForLearning([dueCard], today)
      expect(sorted.length).toBe(1)
      expect(sorted[0].id).toBe('due')
    })

    it('只有新卡片时正确返回', () => {
      const newCard = { id: 'new', nextReview: null, reviewCount: 0, lastReview: null }
      const sorted = sortCardsForLearning([newCard])
      expect(sorted.length).toBe(1)
      expect(sorted[0].id).toBe('new')
    })
  })

  describe('getDueCards', () => {
    it('正确筛选到期卡片', () => {
      const today = getTodayKey()
      const cards = [
        { id: '1', nextReview: addDays(today, -1) },
        { id: '2', nextReview: today },
        { id: '3', nextReview: addDays(today, 1) },
        { id: '4', nextReview: null },
      ]
      const due = getDueCards(cards, today)
      expect(due.map(c => c.id)).toEqual(['1', '2', '4'])
    })
  })

  describe('getNewCards', () => {
    it('正确筛选新卡片', () => {
      const cards = [
        { id: '1', reviewCount: 0, lastReview: null },
        { id: '2', reviewCount: 1, lastReview: '2024-01-01' },
        { id: '3', reviewCount: 0, lastReview: '2024-01-01' },
      ]
      const news = getNewCards(cards)
      expect(news.map(c => c.id)).toEqual(['1'])
    })
  })

  describe('sortCardsByCorrectRate', () => {
    it('降序排列', () => {
      const cards = [
        { id: 'a', reviewCount: 10, correctCount: 5 },
        { id: 'b', reviewCount: 10, correctCount: 9 },
        { id: 'c', reviewCount: 10, correctCount: 7 },
      ]
      const sorted = sortCardsByCorrectRate(cards, false)
      expect(sorted.map(c => c.id)).toEqual(['b', 'c', 'a'])
    })

    it('升序排列', () => {
      const cards = [
        { id: 'a', reviewCount: 10, correctCount: 5 },
        { id: 'b', reviewCount: 10, correctCount: 9 },
        { id: 'c', reviewCount: 10, correctCount: 7 },
      ]
      const sorted = sortCardsByCorrectRate(cards, true)
      expect(sorted.map(c => c.id)).toEqual(['a', 'c', 'b'])
    })

    it('不修改原数组', () => {
      const cards = [
        { id: 'a', reviewCount: 10, correctCount: 5 },
        { id: 'b', reviewCount: 10, correctCount: 9 },
      ]
      const idsBefore = cards.map(c => c.id)
      sortCardsByCorrectRate(cards)
      expect(cards.map(c => c.id)).toEqual(idsBefore)
    })
  })

  describe('filterCardsByTags', () => {
    it('按字符串标签筛选', () => {
      const cards = [
        { id: '1', tags: ['易错', '重点'] },
        { id: '2', tags: ['重点'] },
        { id: '3', tags: [] },
        { id: '4' },
      ]
      const filtered = filterCardsByTags(cards, ['易错'])
      expect(filtered.map(c => c.id)).toEqual(['1'])

      const filtered2 = filterCardsByTags(cards, ['重点'])
      expect(filtered2.map(c => c.id)).toEqual(['1', '2'])
    })

    it('按对象格式标签筛选', () => {
      const cards = [
        { id: '1', tags: [{ text: '易错', color: '#ef4444' }, { text: '重点', color: '#f97316' }] },
        { id: '2', tags: [{ text: '重点', color: '#f97316' }] },
        { id: '3', tags: [] },
      ]
      const filtered = filterCardsByTags(cards, ['易错'])
      expect(filtered.map(c => c.id)).toEqual(['1'])

      const filtered2 = filterCardsByTags(cards, [{ text: '重点', color: '#f97316' }])
      expect(filtered2.map(c => c.id)).toEqual(['1', '2'])
    })

    it('混合格式标签也能筛选', () => {
      const cards = [
        { id: '1', tags: [{ text: '易错', color: '#ef4444' }] },
        { id: '2', tags: ['重点'] },
      ]
      const filtered = filterCardsByTags(cards, ['易错', '重点'])
      expect(filtered.map(c => c.id)).toEqual(['1', '2'])
    })

    it('空筛选条件返回全部', () => {
      const cards = [{ id: '1' }, { id: '2' }]
      expect(filterCardsByTags(cards, [])).toEqual(cards)
    })
  })

  describe('getUniqueTags', () => {
    it('获取所有不重复字符串标签', () => {
      const cards = [
        { tags: ['易错', '重点'] },
        { tags: ['重点', '生词'] },
        {},
        { tags: [] },
      ]
      const tags = getUniqueTags(cards)
      expect(tags).toHaveLength(3)
      const texts = tags.map(t => (typeof t === 'object' ? t.text : t))
      expect(texts).toContain('易错')
      expect(texts).toContain('重点')
      expect(texts).toContain('生词')
    })

    it('对象格式标签返回带 color 的对象', () => {
      const cards = [
        { tags: [{ text: '易错', color: '#ef4444' }, { text: '重点', color: '#f97316' }] },
        { tags: [{ text: '重点', color: '#f97316' }, { text: '生词', color: '#3b82f6' }] },
      ]
      const tags = getUniqueTags(cards)
      expect(tags).toHaveLength(3)
      expect(tags).toContainEqual({ text: '易错', color: '#ef4444' })
      expect(tags).toContainEqual({ text: '重点', color: '#f97316' })
      expect(tags).toContainEqual({ text: '生词', color: '#3b82f6' })
    })

    it('同 text 的标签去重，保留首次出现的 color', () => {
      const cards = [
        { tags: [{ text: '重点', color: '#ef4444' }] },
        { tags: [{ text: '重点', color: '#3b82f6' }] },
      ]
      const tags = getUniqueTags(cards)
      expect(tags).toHaveLength(1)
      expect(tags[0]).toEqual({ text: '重点', color: '#ef4444' })
    })

    it('字符串标签转换为带默认 color 的对象', () => {
      const cards = [
        { tags: ['易错'] },
      ]
      const tags = getUniqueTags(cards)
      expect(tags).toHaveLength(1)
      expect(tags[0]).toEqual({ text: '易错', color: '#6b7280' })
    })

    it('对象格式缺 color 时使用默认值兜底', () => {
      const cards = [
        { tags: [{ text: '重点' }] },
        { tags: [{ text: '生词', color: '' }] },
        { tags: [{ text: '其他', color: null }] },
      ]
      const tags = getUniqueTags(cards)
      expect(tags).toHaveLength(3)
      tags.forEach(t => {
        expect(t.color).toBeDefined()
        expect(typeof t.color).toBe('string')
        expect(t.color.length).toBeGreaterThan(0)
      })
      expect(tags.find(t => t.text === '重点').color).toBe('#6b7280')
      expect(tags.find(t => t.text === '生词').color).toBe('#6b7280')
      expect(tags.find(t => t.text === '其他').color).toBe('#6b7280')
    })
  })
})

describe('统计和进度计算', () => {
  describe('calculateTotalStats', () => {
    it('正确计算累计统计', () => {
      const cards = [
        { reviewCount: 5, correctCount: 4, wrongCount: 1 },
        { reviewCount: 3, correctCount: 3, wrongCount: 0 },
        { reviewCount: 0, correctCount: 0, wrongCount: 0 },
      ]
      const stats = calculateTotalStats(cards)
      expect(stats.totalCards).toBe(3)
      expect(stats.totalReviews).toBe(8)
      expect(stats.totalCorrect).toBe(7)
      expect(stats.totalWrong).toBe(1)
    })

    it('已掌握卡片计数正确', () => {
      const cards = [
        { reviewCount: 5, correctCount: 5 },
        { reviewCount: 3, correctCount: 3 },
        { reviewCount: 2, correctCount: 2 },
      ]
      const stats = calculateTotalStats(cards)
      expect(stats.masteredCards).toBe(2)
    })

    it('空数组返回默认值', () => {
      const stats = calculateTotalStats(null)
      expect(stats).toEqual({
        totalCards: 0,
        masteredCards: 0,
        totalReviews: 0,
        totalCorrect: 0,
        totalWrong: 0,
      })
    })
  })

  describe('calculateDailyProgress', () => {
    it('正确计算日进度', () => {
      const today = getTodayKey()
      const stats = { [today]: { total: 10 } }
      const progress = calculateDailyProgress([], stats, 20, today)
      expect(progress.completed).toBe(10)
      expect(progress.goal).toBe(20)
      expect(progress.rate).toBe(50)
    })

    it('进度超过100%时截断为100%', () => {
      const today = getTodayKey()
      const stats = { [today]: { total: 30 } }
      const progress = calculateDailyProgress([], stats, 20, today)
      expect(progress.rate).toBe(100)
    })

    it('目标为0时不除零', () => {
      const progress = calculateDailyProgress([], {}, 0)
      expect(progress.rate).toBe(0)
    })
  })

  describe('calculateSessionStats', () => {
    it('正确计算会话统计', () => {
      const results = [
        { remembered: true },
        { remembered: true },
        { remembered: false },
      ]
      const stats = calculateSessionStats(results)
      expect(stats.total).toBe(3)
      expect(stats.remembered).toBe(2)
      expect(stats.forgotten).toBe(1)
      expect(stats.rate).toBeCloseTo(66.67, 0)
    })

    it('空结果返回0值', () => {
      const stats = calculateSessionStats([])
      expect(stats).toEqual({ total: 0, remembered: 0, forgotten: 0, rate: 0 })
    })
  })

  describe('buildHeatmapFromDates', () => {
    it('从日期数组生成30天数据，count 为 0 或 1', () => {
      const result = buildHeatmapFromDates([], 30)
      expect(result.length).toBe(30)
      result.forEach(item => {
        expect(item).toHaveProperty('date')
        expect(item).toHaveProperty('studied')
        expect(item).toHaveProperty('count')
        expect([0, 1]).toContain(item.count)
        expect(item).toHaveProperty('dayOfWeek')
      })
    })

    it('正确标记学习日并设置 count=1', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      const result = buildHeatmapFromDates([today, yesterday], 30)
      const todayItem = result.find(r => r.date === today)
      const yesterdayItem = result.find(r => r.date === yesterday)
      expect(todayItem.studied).toBe(true)
      expect(todayItem.count).toBe(1)
      expect(yesterdayItem.studied).toBe(true)
      expect(yesterdayItem.count).toBe(1)
    })

    it('未学习的日期 count=0', () => {
      const today = getTodayKey()
      const result = buildHeatmapFromDates([], 30)
      const todayItem = result.find(r => r.date === today)
      expect(todayItem.studied).toBe(false)
      expect(todayItem.count).toBe(0)
    })
  })

  describe('buildHeatmapFromStats', () => {
    it('从 stats 对象生成30天数据，count 为每日学习总数', () => {
      const today = getTodayKey()
      const yesterday = addDays(today, -1)
      const stats = {
        [today]: { total: 25, studied: 10, reviewed: 15 },
        [yesterday]: { total: 5, studied: 3, reviewed: 2 },
      }
      const result = buildHeatmapFromStats(stats, 30)
      const todayItem = result.find(r => r.date === today)
      const yesterdayItem = result.find(r => r.date === yesterday)
      expect(todayItem.studied).toBe(true)
      expect(todayItem.count).toBe(25)
      expect(yesterdayItem.studied).toBe(true)
      expect(yesterdayItem.count).toBe(5)
    })

    it('无学习记录的日期 count=0 且 studied=false', () => {
      const result = buildHeatmapFromStats({}, 30)
      result.forEach(item => {
        expect(item.studied).toBe(false)
        expect(item.count).toBe(0)
      })
    })

    it('stats 为 null/undefined 时不报错，全部返回未学习', () => {
      expect(() => buildHeatmapFromStats(null, 30)).not.toThrow()
      expect(() => buildHeatmapFromStats(undefined, 30)).not.toThrow()
      const result = buildHeatmapFromStats(null, 30)
      result.forEach(item => {
        expect(item.studied).toBe(false)
        expect(item.count).toBe(0)
      })
    })
  })

  describe('buildHeatmapData（兼容入口）', () => {
    it('传入数组时委托给 buildHeatmapFromDates', () => {
      const today = getTodayKey()
      const fromArray = buildHeatmapData([today], 30)
      const fromDates = buildHeatmapFromDates([today], 30)
      expect(fromArray).toEqual(fromDates)
    })

    it('传入对象时委托给 buildHeatmapFromStats', () => {
      const today = getTodayKey()
      const stats = { [today]: { total: 10 } }
      const fromData = buildHeatmapData(stats, 30)
      const fromStats = buildHeatmapFromStats(stats, 30)
      expect(fromData).toEqual(fromStats)
    })
  })

  describe('getHeatmapLevel（对数分级）', () => {
    it('count<=0 返回等级 0', () => {
      expect(getHeatmapLevel(0)).toBe(0)
      expect(getHeatmapLevel(-5)).toBe(0)
      expect(getHeatmapLevel(null)).toBe(0)
      expect(getHeatmapLevel(undefined)).toBe(0)
    })

    it('小数量区分不同等级', () => {
      expect(getHeatmapLevel(1)).toBe(0)
      expect(getHeatmapLevel(2)).toBe(1)
      expect(getHeatmapLevel(3)).toBe(1)
    })

    it('中等数量递增到更高等级', () => {
      expect(getHeatmapLevel(7)).toBe(2)
      expect(getHeatmapLevel(20)).toBe(3)
    })

    it('大数量不超过最高等级（对数尺度）', () => {
      expect(getHeatmapLevel(50)).toBe(3)
      expect(getHeatmapLevel(100)).toBe(3)
      expect(getHeatmapLevel(1000)).toBe(3)
    })

    it('3张和50张等级不同（修复前均为最深色的问题）', () => {
      const level3 = getHeatmapLevel(3)
      const level50 = getHeatmapLevel(50)
      expect(level3).not.toBe(level50)
      expect(level50).toBeGreaterThan(level3)
    })
  })

  describe('getHeatmapCellColor', () => {
    it('未学习返回浅灰，无论 count 多少', () => {
      expect(getHeatmapCellColor(false)).toBe('#ebedf0')
      expect(getHeatmapCellColor(false, 10)).toBe('#ebedf0')
      expect(getHeatmapCellColor(false, 100)).toBe('#ebedf0')
    })

    it('学习后按对数等级返回不同绿色', () => {
      expect(getHeatmapCellColor(true, 1)).toBe('#9be9a8')
      expect(getHeatmapCellColor(true, 2)).toBe('#40c463')
      expect(getHeatmapCellColor(true, 7)).toBe('#30a14e')
      expect(getHeatmapCellColor(true, 20)).toBe('#216e39')
    })

    it('学3张和学50张颜色不同（修复前同色的问题）', () => {
      const color3 = getHeatmapCellColor(true, 3)
      const color50 = getHeatmapCellColor(true, 50)
      expect(color3).not.toBe(color50)
    })

    it('大数量被裁剪到最高等级颜色', () => {
      const color50 = getHeatmapCellColor(true, 50)
      const color100 = getHeatmapCellColor(true, 100)
      const color1000 = getHeatmapCellColor(true, 1000)
      expect(color50).toBe(color100)
      expect(color100).toBe(color1000)
      expect(color1000).toBe('#216e39')
    })
  })
})

describe('日期工具函数', () => {
  it('addDays 正确计算偏移', () => {
    expect(addDays('2024-01-01', 1)).toBe('2024-01-02')
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01')
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01')
    expect(addDays('2024-01-01', -1)).toBe('2023-12-31')
  })

  it('formatDate 和 parseDate 互逆', () => {
    const original = new Date(2024, 0, 15, 10, 30, 0)
    const formatted = formatDate(original)
    expect(formatted).toBe('2024-01-15')
    const parsed = parseDate(formatted)
    expect(parsed.getFullYear()).toBe(2024)
    expect(parsed.getMonth()).toBe(0)
    expect(parsed.getDate()).toBe(15)
  })

  it('getTodayKey 返回今天的日期字符串', () => {
    const today = getTodayKey()
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(today).toBe(expected)
  })
})

describe('truncateText', () => {
  it('短文本不截断', () => {
    expect(truncateText('hello', 10)).toBe('hello')
  })

  it('长文本截断并加省略号', () => {
    expect(truncateText('1234567890abcdef', 10)).toBe('1234567890...')
  })

  it('空值处理', () => {
    expect(truncateText(null)).toBe('')
    expect(truncateText(undefined)).toBe('')
    expect(truncateText('')).toBe('')
  })
})

describe('localStorage 数据持久化', () => {
  let storage

  beforeEach(() => {
    storage = createMockStorage()
  })

  it('loadDecks 没有数据返回空数组', () => {
    expect(loadDecks(storage)).toEqual([])
  })

  it('saveDecks 和 loadDecks 正确存取', () => {
    const decks = [{ id: '1', name: 'Test' }]
    saveDecks(decks, storage)
    expect(loadDecks(storage)).toEqual(decks)
  })

  it('loadCards 没有数据返回空数组', () => {
    expect(loadCards(storage)).toEqual([])
  })

  it('saveCards 和 loadCards 正确存取', () => {
    const cards = [{ id: '1', deckId: 'd1', front: 'A', back: 'B' }]
    saveCards(cards, storage)
    expect(loadCards(storage)).toEqual(cards)
  })

  it('loadStats 没有数据返回空对象', () => {
    expect(loadStats(storage)).toEqual({})
  })

  it('saveStats 和 loadStats 正确存取', () => {
    const stats = { '2024-01-01': { total: 10 } }
    saveStats(stats, storage)
    expect(loadStats(storage)).toEqual(stats)
  })

  it('loadSettings 没有数据返回默认值', () => {
    const settings = loadSettings(storage)
    expect(settings.dailyGoal).toBe(20)
  })

  it('saveSettings 和 loadSettings 正确存取', () => {
    saveSettings({ dailyGoal: 50 }, storage)
    expect(loadSettings(storage)).toEqual({ dailyGoal: 50 })
  })

  it('loadDecks 解析失败返回空数组', () => {
    storage.setItem('flashcard_decks', 'invalid json')
    expect(loadDecks(storage)).toEqual([])
  })

  it('storage 为 null 时不报错', () => {
    expect(() => loadDecks(null)).not.toThrow()
    expect(() => saveDecks([], null)).not.toThrow()
  })

  it('recordStudySession 正确累加', () => {
    const today = getTodayKey()
    const initial = { [today]: { studied: 2, reviewed: 3, correct: 4, wrong: 1, total: 5 } }
    const results = [
      { remembered: true, wasDue: true },
      { remembered: false, wasDue: false },
    ]
    const updated = recordStudySession(initial, results, today)
    expect(updated[today].studied).toBe(3)
    expect(updated[today].reviewed).toBe(4)
    expect(updated[today].correct).toBe(5)
    expect(updated[today].wrong).toBe(2)
    expect(updated[today].total).toBe(7)
  })

  it('recordStudySession 首次记录当天', () => {
    const today = getTodayKey()
    const results = [{ remembered: true, wasDue: false }]
    const updated = recordStudySession({}, results, today)
    expect(updated[today].total).toBe(1)
    expect(updated[today].correct).toBe(1)
  })
})

describe('工厂函数', () => {
  describe('createDeck', () => {
    it('创建带 id 和时间戳的牌组', () => {
      const deck = createDeck('英语单词')
      expect(deck.id).toMatch(/^deck_/)
      expect(deck.name).toBe('英语单词')
      expect(deck.createdAt).toBeGreaterThan(0)
    })

    it('自动去除名称两端空格', () => {
      const deck = createDeck('  测试  ')
      expect(deck.name).toBe('测试')
    })
  })

  describe('createCard', () => {
    it('创建带默认字段的卡片', () => {
      const card = createCard('deck1', 'Apple', '苹果', ['重点'])
      expect(card.id).toMatch(/^card_/)
      expect(card.deckId).toBe('deck1')
      expect(card.front).toBe('Apple')
      expect(card.back).toBe('苹果')
      expect(card.tags).toEqual(['重点'])
      expect(card.reviewCount).toBe(0)
      expect(card.correctCount).toBe(0)
      expect(card.wrongCount).toBe(0)
      expect(card.lastReview).toBeNull()
      expect(card.nextReview).toBeNull()
    })
  })
})
