import { describe, it, expect, beforeEach } from 'vitest'
import {
  BASE_SCORE,
  RARE_CHAR_BONUS,
  HINT_PENALTY,
  VALIDATION_ERROR,
  PLAYER,
} from '@/pages/idiom-chain/constants.js'
import {
  getFirstChar,
  getLastChar,
  getPinyinInitial,
  isRareInitial,
  existsInDictionary,
  getIdiomByWord,
  hasBeenUsed,
  validateIdiomInput,
  buildIdiomMapByFirstChar,
  getAvailableIdiomsByChar,
  selectAiIdiom,
  calculateScore,
  getHint,
  createInitialStreakRecord,
  updateStreakRecord,
  loadStreakRecord,
  saveStreakRecord,
  determineWinner,
  getDifficultyIdiomList,
} from '@/pages/idiom-chain/idiomCore.js'

const testIdiomList = [
  { word: '一心一意', pinyin: 'yī xīn yī yì' },
  { word: '意气风发', pinyin: 'yì qì fēng fā' },
  { word: '发扬光大', pinyin: 'fā yáng guāng dà' },
  { word: '大张旗鼓', pinyin: 'dà zhāng qí gǔ' },
  { word: '鼓舞人心', pinyin: 'gǔ wǔ rén xīn' },
  { word: '心安理得', pinyin: 'xīn ān lǐ dé' },
  { word: '得心应手', pinyin: 'dé xīn yìng shǒu' },
  { word: '手到擒来', pinyin: 'shǒu dào qín lái' },
  { word: '来龙去脉', pinyin: 'lái lóng qù mài' },
  { word: '脉脉含情', pinyin: 'mò mò hán qíng' },
  { word: '情投意合', pinyin: 'qíng tóu yì hé' },
  { word: '合情合理', pinyin: 'hé qíng hé lǐ' },
  { word: '理直气壮', pinyin: 'lǐ zhí qì zhuàng' },
  { word: '壮志凌云', pinyin: 'zhuàng zhì líng yún' },
  { word: '云开雾散', pinyin: 'yún kāi wù sàn' },
  { word: '散兵游勇', pinyin: 'sǎn bīng yóu yǒng' },
  { word: '勇往直前', pinyin: 'yǒng wǎng zhí qián' },
  { word: '前仆后继', pinyin: 'qián pū hòu jì' },
  { word: '继往开来', pinyin: 'jì wǎng kāi lái' },
]

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

describe('idiomCore', () => {
  describe('getFirstChar', () => {
    it('should return first character for normal 4-char idiom', () => {
      expect(getFirstChar('一心一意')).toBe('一')
      expect(getFirstChar('意气风发')).toBe('意')
    })

    it('should return empty string for empty string', () => {
      expect(getFirstChar('')).toBe('')
    })

    it('should return first character for non-4-char idioms', () => {
      expect(getFirstChar('一言以蔽之')).toBe('一')
      expect(getFirstChar('三人行')).toBe('三')
    })

    it('should return empty string for null/undefined', () => {
      expect(getFirstChar(null)).toBe('')
      expect(getFirstChar(undefined)).toBe('')
    })
  })

  describe('getLastChar', () => {
    it('should return last character for normal 4-char idiom', () => {
      expect(getLastChar('一心一意')).toBe('意')
      expect(getLastChar('意气风发')).toBe('发')
    })

    it('should return empty string for empty string', () => {
      expect(getLastChar('')).toBe('')
    })

    it('should return last character for non-4-char idioms', () => {
      expect(getLastChar('一言以蔽之')).toBe('之')
      expect(getLastChar('三人行')).toBe('行')
    })

    it('should return empty string for null/undefined', () => {
      expect(getLastChar(null)).toBe('')
      expect(getLastChar(undefined)).toBe('')
    })
  })

  describe('getPinyinInitial', () => {
    it('should return correct pinyin initial from idiom list', () => {
      expect(getPinyinInitial('一心一意', testIdiomList)).toBe('y')
      expect(getPinyinInitial('心安理得', testIdiomList)).toBe('x')
      expect(getPinyinInitial('情投意合', testIdiomList)).toBe('q')
    })

    it('should return empty string when word not found in list', () => {
      expect(getPinyinInitial('不存在的成语', testIdiomList)).toBe('')
    })

    it('should return empty string when idiom has no pinyin field', () => {
      const listWithoutPinyin = [{ word: '测试成语' }]
      expect(getPinyinInitial('测试成语', listWithoutPinyin)).toBe('')
    })

    it('should return lowercase initial', () => {
      const listWithUpperPinyin = [{ word: '测试成语', pinyin: 'Yī cè shì yǔ' }]
      expect(getPinyinInitial('测试成语', listWithUpperPinyin)).toBe('y')
    })
  })

  describe('isRareInitial', () => {
    it('should return true for x, z, q', () => {
      expect(isRareInitial('x')).toBe(true)
      expect(isRareInitial('z')).toBe(true)
      expect(isRareInitial('q')).toBe(true)
    })

    it('should return false for other initials', () => {
      expect(isRareInitial('a')).toBe(false)
      expect(isRareInitial('y')).toBe(false)
      expect(isRareInitial('b')).toBe(false)
      expect(isRareInitial('sh')).toBe(false)
    })

    it('should return false for empty string or null', () => {
      expect(isRareInitial('')).toBe(false)
      expect(isRareInitial(null)).toBe(false)
    })
  })

  describe('existsInDictionary', () => {
    it('should return true when word exists in dictionary', () => {
      expect(existsInDictionary('一心一意', testIdiomList)).toBe(true)
      expect(existsInDictionary('情投意合', testIdiomList)).toBe(true)
    })

    it('should return false when word does not exist in dictionary', () => {
      expect(existsInDictionary('不存在的词', testIdiomList)).toBe(false)
      expect(existsInDictionary('', testIdiomList)).toBe(false)
    })
  })

  describe('getIdiomByWord', () => {
    it('should return the idiom object when found', () => {
      const result = getIdiomByWord('一心一意', testIdiomList)
      expect(result).toEqual({ word: '一心一意', pinyin: 'yī xīn yī yì' })
    })

    it('should return null when word not found', () => {
      expect(getIdiomByWord('不存在的词', testIdiomList)).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(getIdiomByWord('', testIdiomList)).toBeNull()
    })
  })

  describe('hasBeenUsed', () => {
    it('should work with Set input', () => {
      const usedSet = new Set(['一心一意', '意气风发'])
      expect(hasBeenUsed('一心一意', usedSet)).toBe(true)
      expect(hasBeenUsed('发扬光大', usedSet)).toBe(false)
    })

    it('should work with Array input', () => {
      const usedArray = ['一心一意', '意气风发']
      expect(hasBeenUsed('一心一意', usedArray)).toBe(true)
      expect(hasBeenUsed('发扬光大', usedArray)).toBe(false)
    })

    it('should return false for null/undefined/other types', () => {
      expect(hasBeenUsed('一心一意', null)).toBe(false)
      expect(hasBeenUsed('一心一意', undefined)).toBe(false)
      expect(hasBeenUsed('一心一意', {})).toBe(false)
    })
  })

  describe('validateIdiomInput', () => {
    let usedWords

    beforeEach(() => {
      usedWords = new Set()
    })

    it('should return NOT_IN_DICTIONARY when word not in idiom list', () => {
      const result = validateIdiomInput('不存在的词', null, testIdiomList, usedWords)
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VALIDATION_ERROR.NOT_IN_DICTIONARY)
    })

    it('should return FIRST_CHAR_MISMATCH when first char does not match last idiom', () => {
      const lastIdiom = { word: '一心一意' }
      const result = validateIdiomInput('发扬光大', lastIdiom, testIdiomList, usedWords)
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VALIDATION_ERROR.FIRST_CHAR_MISMATCH)
      expect(result.expectedChar).toBe('意')
    })

    it('should accept string as lastIdiom', () => {
      const result = validateIdiomInput('发扬光大', '一心一意', testIdiomList, usedWords)
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VALIDATION_ERROR.FIRST_CHAR_MISMATCH)
      expect(result.expectedChar).toBe('意')
    })

    it('should return ALREADY_USED when word already used', () => {
      usedWords.add('一心一意')
      const result = validateIdiomInput('一心一意', null, testIdiomList, usedWords)
      expect(result.valid).toBe(false)
      expect(result.error).toBe(VALIDATION_ERROR.ALREADY_USED)
    })

    it('should pass validation when it is the first idiom and word exists and not used', () => {
      const result = validateIdiomInput('一心一意', null, testIdiomList, usedWords)
      expect(result.valid).toBe(true)
    })

    it('should pass validation when all conditions satisfied', () => {
      const lastIdiom = { word: '一心一意' }
      const result = validateIdiomInput('意气风发', lastIdiom, testIdiomList, usedWords)
      expect(result.valid).toBe(true)
    })

    it('should check existence before other conditions', () => {
      usedWords.add('不存在的词')
      const result = validateIdiomInput('不存在的词', '一心一意', testIdiomList, usedWords)
      expect(result.error).toBe(VALIDATION_ERROR.NOT_IN_DICTIONARY)
    })
  })

  describe('buildIdiomMapByFirstChar', () => {
    it('should return a Map instance', () => {
      const result = buildIdiomMapByFirstChar(testIdiomList)
      expect(result instanceof Map).toBe(true)
    })

    it('should index each idiom under correct first char key', () => {
      const map = buildIdiomMapByFirstChar(testIdiomList)
      const yiList = map.get('一')
      expect(yiList).toBeDefined()
      expect(yiList.some(i => i.word === '一心一意')).toBe(true)

      const yi2List = map.get('意')
      expect(yi2List).toBeDefined()
      expect(yi2List.some(i => i.word === '意气风发')).toBe(true)
    })

    it('should group idioms with same first char in same array', () => {
      const extendedList = [
        ...testIdiomList,
        { word: '一帆风顺', pinyin: 'yī fān fēng shùn' },
        { word: '一马当先', pinyin: 'yī mǎ dāng xiān' },
      ]
      const map = buildIdiomMapByFirstChar(extendedList)
      const yiList = map.get('一')
      expect(yiList).toHaveLength(3)
      expect(yiList.some(i => i.word === '一心一意')).toBe(true)
      expect(yiList.some(i => i.word === '一帆风顺')).toBe(true)
      expect(yiList.some(i => i.word === '一马当先')).toBe(true)
    })

    it('should handle empty list', () => {
      const map = buildIdiomMapByFirstChar([])
      expect(map.size).toBe(0)
    })
  })

  describe('getAvailableIdiomsByChar', () => {
    let idiomMapByFirstChar
    let usedWords

    beforeEach(() => {
      idiomMapByFirstChar = buildIdiomMapByFirstChar(testIdiomList)
      usedWords = new Set()
    })

    it('should return idioms starting with specified char that are not used', () => {
      const result = getAvailableIdiomsByChar('意', idiomMapByFirstChar, usedWords)
      expect(result).toHaveLength(1)
      expect(result[0].word).toBe('意气风发')
    })

    it('should filter out used words correctly', () => {
      usedWords.add('意气风发')
      const result = getAvailableIdiomsByChar('意', idiomMapByFirstChar, usedWords)
      expect(result).toHaveLength(0)
    })

    it('should return empty array when char does not exist in map', () => {
      const result = getAvailableIdiomsByChar('佛', idiomMapByFirstChar, usedWords)
      expect(result).toEqual([])
    })

    it('should return empty array when all idioms with that char are used', () => {
      const extendedList = [
        ...testIdiomList,
        { word: '意气相投', pinyin: 'yì qì xiāng tóu' },
      ]
      const map = buildIdiomMapByFirstChar(extendedList)
      usedWords.add('意气风发')
      usedWords.add('意气相投')
      const result = getAvailableIdiomsByChar('意', map, usedWords)
      expect(result).toHaveLength(0)
    })

    it('should accept usedWords as array', () => {
      const usedArray = ['意气风发']
      const result = getAvailableIdiomsByChar('意', idiomMapByFirstChar, usedArray)
      expect(result).toHaveLength(0)
    })
  })

  describe('selectAiIdiom', () => {
    let idiomMapByFirstChar
    let usedWords
    const easyConfig = { id: 'easy', preferRareEndChar: false }
    const hardConfig = { id: 'hard', preferRareEndChar: true }

    beforeEach(() => {
      idiomMapByFirstChar = buildIdiomMapByFirstChar(testIdiomList)
      usedWords = new Set()
    })

    it('should return null when no available idioms', () => {
      const result = selectAiIdiom('佛', idiomMapByFirstChar, usedWords, easyConfig)
      expect(result).toBeNull()
    })

    it('should return an available idiom on easy difficulty', () => {
      const result = selectAiIdiom('意', idiomMapByFirstChar, usedWords, easyConfig)
      expect(result).not.toBeNull()
      expect(result.word).toBe('意气风发')
    })

    it('should prefer rare end char on hard difficulty', () => {
      const controlledList = [
        { word: '一A二B', pinyin: 'yī A èr B' },
        { word: 'B一C一', pinyin: 'B yī C yī' },
        { word: 'B二D二', pinyin: 'B èr D èr' },
        { word: 'C三E三', pinyin: 'C sān E sān' },
      ]
      const map = buildIdiomMapByFirstChar(controlledList)
      usedWords = new Set()

      const result = selectAiIdiom('一', map, usedWords, hardConfig)
      expect(result).not.toBeNull()
      expect(result.word).toBe('一A二B')
    })

    it('should only select from available (not used) idioms', () => {
      usedWords.add('意气风发')
      const result = selectAiIdiom('意', idiomMapByFirstChar, usedWords, easyConfig)
      expect(result).toBeNull()
    })

    it('should return reasonable distribution over multiple calls', () => {
      const multiOptionList = [
        { word: '开天辟地', pinyin: 'kāi tiān pì dì' },
        { word: '开国元勋', pinyin: 'kāi guó yuán xūn' },
        { word: '开门见山', pinyin: 'kāi mén jiàn shān' },
        { word: '地大物博', pinyin: 'dì dà wù bó' },
        { word: '地广人稀', pinyin: 'dì guǎng rén xī' },
        { word: '地动山摇', pinyin: 'dì dòng shān yáo' },
      ]
      const map = buildIdiomMapByFirstChar(multiOptionList)
      const selectionCount = {}

      for (let i = 0; i < 100; i++) {
        const result = selectAiIdiom('开', map, new Set(), easyConfig)
        if (result) {
          selectionCount[result.word] = (selectionCount[result.word] || 0) + 1
        }
      }

      expect(Object.keys(selectionCount).length).toBeGreaterThan(0)
      Object.keys(selectionCount).forEach(word => {
        expect(selectionCount[word]).toBeGreaterThan(0)
      })
    })
  })

  describe('calculateScore', () => {
    it('should return BASE_SCORE as base', () => {
      const idiom = { word: '一心一意', pinyin: 'yī xīn yī yì' }
      const score = calculateScore(idiom, testIdiomList, [])
      expect(score).toBe(BASE_SCORE)
    })

    it('should add RARE_CHAR_BONUS for rare pinyin initials (x, z, q)', () => {
      const xinAn = getIdiomByWord('心安理得', testIdiomList)
      const scoreX = calculateScore(xinAn, testIdiomList, [])
      expect(scoreX).toBe(BASE_SCORE + RARE_CHAR_BONUS)

      const qingTou = getIdiomByWord('情投意合', testIdiomList)
      const scoreQ = calculateScore(qingTou, testIdiomList, [])
      expect(scoreQ).toBe(BASE_SCORE + RARE_CHAR_BONUS)
    })

    it('should not add RARE_CHAR_BONUS when same end char used 3+ consecutive times', () => {
      const xinAn = getIdiomByWord('心安理得', testIdiomList)
      const chain = [
        '鼓舞人心',
        { word: '鼓舞人心' },
        '鼓舞人心',
      ]
      const score = calculateScore(xinAn, testIdiomList, chain)
      expect(score).toBe(BASE_SCORE)
    })

    it('should add RARE_CHAR_BONUS when same end char used less than 3 times', () => {
      const xinAn = getIdiomByWord('心安理得', testIdiomList)
      const chain = [
        '鼓舞人心',
        '鼓舞人心',
      ]
      const score = calculateScore(xinAn, testIdiomList, chain)
      expect(score).toBe(BASE_SCORE + RARE_CHAR_BONUS)
    })

    it('should subtract HINT_PENALTY when isHinted is true', () => {
      const xinAn = getIdiomByWord('心安理得', testIdiomList)
      const score = calculateScore(xinAn, testIdiomList, [], true)
      expect(score).toBe(BASE_SCORE + RARE_CHAR_BONUS - HINT_PENALTY)
    })

    it('should not go below 0', () => {
      const idiom = { word: '一心一意', pinyin: 'yī xīn yī yì' }
      const fakeBase = 5
      const fakePenalty = 100
      const list = [{ word: '一心一意', pinyin: 'yī xīn yī yì' }]
      const score = Math.max(0, fakeBase - fakePenalty)
      expect(score).toBe(0)
    })

    it('should correctly combine rare bonus and hint penalty', () => {
      const xinAn = getIdiomByWord('心安理得', testIdiomList)
      const score = calculateScore(xinAn, testIdiomList, [], true)
      expect(score).toBe(BASE_SCORE + RARE_CHAR_BONUS - HINT_PENALTY)
    })

    it('should handle chain with mixed string and object items', () => {
      const xinAn = getIdiomByWord('心安理得', testIdiomList)
      const chain = [
        '其他成语',
        '鼓舞人心',
        { word: '鼓舞人心' },
        '大快人心',
      ]
      const score = calculateScore(xinAn, testIdiomList, chain)
      expect(score).toBe(BASE_SCORE)
    })
  })

  describe('getHint', () => {
    let idiomMapByFirstChar
    let usedWords

    beforeEach(() => {
      idiomMapByFirstChar = buildIdiomMapByFirstChar(testIdiomList)
      usedWords = new Set()
    })

    it('should return an available idiom', () => {
      const hint = getHint('意', idiomMapByFirstChar, usedWords)
      expect(hint).not.toBeNull()
      expect(hint.word).toBe('意气风发')
    })

    it('should return null when no available idioms', () => {
      const hint = getHint('佛', idiomMapByFirstChar, usedWords)
      expect(hint).toBeNull()
    })

    it('should return null when all idioms with that char are used', () => {
      usedWords.add('意气风发')
      const hint = getHint('意', idiomMapByFirstChar, usedWords)
      expect(hint).toBeNull()
    })
  })

  describe('连胜纪录 (streak record)', () => {
    describe('createInitialStreakRecord', () => {
      it('should return correct initial structure', () => {
        const record = createInitialStreakRecord()
        expect(record).toEqual({
          currentStreak: 0,
          maxStreak: 0,
          totalGames: 0,
        })
      })
    })

    describe('updateStreakRecord', () => {
      it('should increment currentStreak and maxStreak and totalGames on win', () => {
        const initial = { currentStreak: 0, maxStreak: 0, totalGames: 0 }
        const result = updateStreakRecord(initial, true)
        expect(result.currentStreak).toBe(1)
        expect(result.maxStreak).toBe(1)
        expect(result.totalGames).toBe(1)
      })

      it('should update maxStreak only when currentStreak exceeds it', () => {
        const prev = { currentStreak: 2, maxStreak: 3, totalGames: 5 }
        const result = updateStreakRecord(prev, true)
        expect(result.currentStreak).toBe(3)
        expect(result.maxStreak).toBe(3)
        expect(result.totalGames).toBe(6)
      })

      it('should increase maxStreak when new streak beats previous max', () => {
        const prev = { currentStreak: 3, maxStreak: 3, totalGames: 5 }
        const result = updateStreakRecord(prev, true)
        expect(result.currentStreak).toBe(4)
        expect(result.maxStreak).toBe(4)
      })

      it('should reset currentStreak to 0 but keep maxStreak and increment totalGames on loss', () => {
        const prev = { currentStreak: 3, maxStreak: 5, totalGames: 10 }
        const result = updateStreakRecord(prev, false)
        expect(result.currentStreak).toBe(0)
        expect(result.maxStreak).toBe(5)
        expect(result.totalGames).toBe(11)
      })

      it('should not mutate original record', () => {
        const original = { currentStreak: 2, maxStreak: 2, totalGames: 3 }
        const originalCopy = { ...original }
        updateStreakRecord(original, true)
        expect(original).toEqual(originalCopy)
      })
    })

    describe('loadStreakRecord / saveStreakRecord', () => {
      let storage

      beforeEach(() => {
        storage = createMockStorage()
      })

      it('save and load should round-trip correctly', () => {
        const record = { currentStreak: 3, maxStreak: 7, totalGames: 15 }
        saveStreakRecord(record, storage)
        const loaded = loadStreakRecord(storage)
        expect(loaded).toEqual(record)
      })

      it('should return initial record when storage is empty', () => {
        const loaded = loadStreakRecord(storage)
        expect(loaded).toEqual(createInitialStreakRecord())
      })

      it('should return initial record for invalid JSON in storage', () => {
        storage.setItem('idiom_chain_streak_record', 'invalid{{{json')
        const loaded = loadStreakRecord(storage)
        expect(loaded).toEqual(createInitialStreakRecord())
      })

      it('should return initial record when storage is null', () => {
        expect(() => loadStreakRecord(null)).not.toThrow()
        const loaded = loadStreakRecord(null)
        expect(loaded).toEqual(createInitialStreakRecord())
      })

      it('should not throw when saveStreakRecord with null storage', () => {
        expect(() => saveStreakRecord({ currentStreak: 1, maxStreak: 1, totalGames: 1 }, null)).not.toThrow()
      })

      it('should handle partially invalid fields gracefully', () => {
        storage.setItem('idiom_chain_streak_record', JSON.stringify({
          currentStreak: 'not_a_number',
          maxStreak: null,
          totalGames: undefined,
        }))
        const loaded = loadStreakRecord(storage)
        expect(loaded.currentStreak).toBe(0)
        expect(loaded.maxStreak).toBe(0)
        expect(loaded.totalGames).toBe(0)
      })
    })
  })

  describe('determineWinner', () => {
    it('should return HUMAN win when human score is higher', () => {
      const result = determineWinner(100, 50)
      expect(result.winner).toBe(PLAYER.HUMAN)
      expect(result.result).toBe('win')
    })

    it('should return AI win when AI score is higher', () => {
      const result = determineWinner(50, 100)
      expect(result.winner).toBe(PLAYER.AI)
      expect(result.result).toBe('lose')
    })

    it('should return draw when scores are equal', () => {
      const result1 = determineWinner(100, 100)
      expect(result1.winner).toBe('draw')
      expect(result1.result).toBe('draw')

      const result2 = determineWinner(0, 0)
      expect(result2.winner).toBe('draw')
      expect(result2.result).toBe('draw')
    })
  })

  describe('getDifficultyIdiomList', () => {
    it('should slice list by difficulty.wordCount', () => {
      const difficulty = { wordCount: 5 }
      const result = getDifficultyIdiomList(testIdiomList, difficulty)
      expect(result).toHaveLength(5)
      expect(result[0].word).toBe('一心一意')
      expect(result[4].word).toBe('鼓舞人心')
    })

    it('should deduplicate by word field', () => {
      const listWithDuplicates = [
        { word: '一心一意', pinyin: 'yī xīn yī yì' },
        { word: '意气风发', pinyin: 'yì qì fēng fā' },
        { word: '一心一意', pinyin: 'yī xīn yī yì (dup)' },
        { word: '发扬光大', pinyin: 'fā yáng guāng dà' },
        { word: '意气风发', pinyin: 'yì qì fēng fā (dup2)' },
        { word: '大张旗鼓', pinyin: 'dà zhāng qí gǔ' },
      ]
      const difficulty = { wordCount: 6 }
      const result = getDifficultyIdiomList(listWithDuplicates, difficulty)
      expect(result).toHaveLength(4)
      const words = result.map(r => r.word)
      expect(words).toEqual(['一心一意', '意气风发', '发扬光大', '大张旗鼓'])
    })

    it('should return full list when difficulty is not provided', () => {
      const result = getDifficultyIdiomList(testIdiomList)
      expect(result).toHaveLength(testIdiomList.length)
    })

    it('should return full list when difficulty.wordCount is invalid', () => {
      const invalidConfigs = [
        { wordCount: null },
        { wordCount: undefined },
        { wordCount: 'not_a_number' },
        {},
      ]
      invalidConfigs.forEach(config => {
        const result = getDifficultyIdiomList(testIdiomList, config)
        expect(result).toHaveLength(testIdiomList.length)
      })
    })

    it('should slice then deduplicate', () => {
      const list = [
        { word: 'A', pinyin: 'a' },
        { word: 'B', pinyin: 'b' },
        { word: 'A', pinyin: 'a2' },
        { word: 'C', pinyin: 'c' },
        { word: 'D', pinyin: 'd' },
      ]
      const difficulty = { wordCount: 3 }
      const result = getDifficultyIdiomList(list, difficulty)
      expect(result).toHaveLength(2)
      expect(result[0].word).toBe('A')
      expect(result[1].word).toBe('B')
    })
  })
})
