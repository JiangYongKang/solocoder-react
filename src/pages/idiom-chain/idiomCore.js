import {
  VALIDATION_ERROR,
  PLAYER,
  BASE_SCORE,
  RARE_CHAR_BONUS,
  HINT_PENALTY,
  RARE_PINYIN_INITIALS,
  STORAGE_KEYS,
} from './constants.js'

export function getFirstChar(word) {
  if (!word || word.length === 0) return ''
  return word.charAt(0)
}

export function getLastChar(word) {
  if (!word || word.length === 0) return ''
  return word.charAt(word.length - 1)
}

export function getPinyinInitial(word, idiomList) {
  const idiom = getIdiomByWord(word, idiomList)
  if (!idiom || !idiom.pinyin) return ''
  const firstPinyin = idiom.pinyin.split(' ')[0]
  if (!firstPinyin) return ''
  return firstPinyin.charAt(0).toLowerCase()
}

export function isRareInitial(initial) {
  return RARE_PINYIN_INITIALS.has(initial)
}

export function getIdiomByWord(word, idiomList) {
  for (let i = 0; i < idiomList.length; i++) {
    if (idiomList[i].word === word) {
      return idiomList[i]
    }
  }
  return null
}

export function existsInDictionary(word, idiomList) {
  return getIdiomByWord(word, idiomList) !== null
}

export function hasBeenUsed(word, usedWords) {
  if (usedWords instanceof Set) {
    return usedWords.has(word)
  }
  if (Array.isArray(usedWords)) {
    return usedWords.indexOf(word) !== -1
  }
  return false
}

export function validateIdiomInput(inputWord, lastIdiom, idiomList, usedWords) {
  if (!existsInDictionary(inputWord, idiomList)) {
    return { valid: false, error: VALIDATION_ERROR.NOT_IN_DICTIONARY }
  }
  if (lastIdiom) {
    const expectedChar = getLastChar(lastIdiom.word || lastIdiom)
    const firstChar = getFirstChar(inputWord)
    if (firstChar !== expectedChar) {
      return {
        valid: false,
        error: VALIDATION_ERROR.FIRST_CHAR_MISMATCH,
        expectedChar,
      }
    }
  }
  if (hasBeenUsed(inputWord, usedWords)) {
    return { valid: false, error: VALIDATION_ERROR.ALREADY_USED }
  }
  return { valid: true }
}

export function buildIdiomMapByFirstChar(idiomList) {
  const map = new Map()
  for (let i = 0; i < idiomList.length; i++) {
    const idiom = idiomList[i]
    const firstChar = getFirstChar(idiom.word)
    if (!map.has(firstChar)) {
      map.set(firstChar, [])
    }
    map.get(firstChar).push(idiom)
  }
  return map
}

export function getAvailableIdiomsByChar(startChar, idiomMapByFirstChar, usedWords) {
  const list = idiomMapByFirstChar.get(startChar)
  if (!list) return []
  const result = []
  for (let i = 0; i < list.length; i++) {
    if (!hasBeenUsed(list[i].word, usedWords)) {
      result.push(list[i])
    }
  }
  return result
}

export function selectAiIdiom(startChar, idiomMapByFirstChar, usedWords, difficultyConfig) {
  const available = getAvailableIdiomsByChar(startChar, idiomMapByFirstChar, usedWords)
  if (available.length === 0) return null

  const isHard = difficultyConfig && difficultyConfig.id === 'hard'
  const preferRare = difficultyConfig && difficultyConfig.preferRareEndChar

  if (isHard && preferRare) {
    const candidatesWithCount = available.map((idiom) => {
      const endChar = getLastChar(idiom.word)
      const nextAvailable = getAvailableIdiomsByChar(endChar, idiomMapByFirstChar, usedWords)
      return { idiom, count: nextAvailable.length }
    })
    candidatesWithCount.sort((a, b) => a.count - b.count)
    const minCount = candidatesWithCount[0].count
    const topCandidates = candidatesWithCount.filter((c) => c.count === minCount)
    const randomIndex = Math.floor(Math.random() * topCandidates.length)
    return topCandidates[randomIndex].idiom
  }

  const randomIndex = Math.floor(Math.random() * available.length)
  return available[randomIndex]
}

export function calculateScore(idiom, idiomList, chain, isHinted = false) {
  let score = BASE_SCORE
  const initial = getPinyinInitial(idiom.word, idiomList)

  let sameEndCharCount = 0
  const currentStartChar = getFirstChar(idiom.word)
  const recentChain = chain.slice(-3)
  for (let i = 0; i < recentChain.length; i++) {
    const item = recentChain[i]
    const word = typeof item === 'string' ? item : item.word
    if (getLastChar(word) === currentStartChar) {
      sameEndCharCount++
    }
  }

  if (isRareInitial(initial) && sameEndCharCount < 3) {
    score += RARE_CHAR_BONUS
  }

  if (isHinted) {
    score -= HINT_PENALTY
  }

  return Math.max(0, score)
}

export function getHint(startChar, idiomMapByFirstChar, usedWords) {
  const available = getAvailableIdiomsByChar(startChar, idiomMapByFirstChar, usedWords)
  if (available.length === 0) return null
  const randomIndex = Math.floor(Math.random() * available.length)
  return available[randomIndex]
}

export function createInitialStreakRecord() {
  return {
    currentStreak: 0,
    maxStreak: 0,
    totalGames: 0,
  }
}

export function updateStreakRecord(prevRecord, playerWon) {
  const newRecord = {
    ...prevRecord,
    totalGames: prevRecord.totalGames + 1,
  }
  if (playerWon) {
    newRecord.currentStreak = prevRecord.currentStreak + 1
    newRecord.maxStreak = Math.max(prevRecord.maxStreak, newRecord.currentStreak)
  } else {
    newRecord.currentStreak = 0
  }
  return newRecord
}

export function loadStreakRecord(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return createInitialStreakRecord()
  try {
    const raw = storage.getItem(STORAGE_KEYS.STREAK)
    if (!raw) return createInitialStreakRecord()
    const parsed = JSON.parse(raw)
    return {
      currentStreak: typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0,
      maxStreak: typeof parsed.maxStreak === 'number' ? parsed.maxStreak : 0,
      totalGames: typeof parsed.totalGames === 'number' ? parsed.totalGames : 0,
    }
  } catch {
    return createInitialStreakRecord()
  }
}

export function saveStreakRecord(record, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(record))
  } catch {
    // ignore storage errors
  }
}

export function determineWinner(humanScore, aiScore) {
  if (humanScore > aiScore) {
    return { winner: PLAYER.HUMAN, result: 'win' }
  }
  if (humanScore < aiScore) {
    return { winner: PLAYER.AI, result: 'lose' }
  }
  return { winner: 'draw', result: 'draw' }
}

export function getDifficultyIdiomList(fullList, difficulty) {
  const count = difficulty && typeof difficulty.wordCount === 'number' ? difficulty.wordCount : fullList.length
  const sliced = fullList.slice(0, count)
  const seen = new Set()
  const deduped = []
  for (let i = 0; i < sliced.length; i++) {
    const idiom = sliced[i]
    if (!seen.has(idiom.word)) {
      seen.add(idiom.word)
      deduped.push(idiom)
    }
  }
  return deduped
}
