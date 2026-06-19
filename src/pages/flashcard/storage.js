import {
  STORAGE_KEY_DECKS,
  STORAGE_KEY_CARDS,
  STORAGE_KEY_STATS,
  STORAGE_KEY_SETTINGS,
  DEFAULT_DAILY_GOAL,
} from './constants'
import { getTodayKey } from './flashcardUtils'

function getStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

export function loadDecks(storage = getStorage()) {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY_DECKS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveDecks(decks, storage = getStorage()) {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY_DECKS, JSON.stringify(decks))
    return true
  } catch {
    return false
  }
}

export function loadCards(storage = getStorage()) {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY_CARDS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveCards(cards, storage = getStorage()) {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards))
    return true
  } catch {
    return false
  }
}

export function loadStats(storage = getStorage()) {
  if (!storage) return {}
  try {
    const raw = storage.getItem(STORAGE_KEY_STATS)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed
  } catch {
    return {}
  }
}

export function saveStats(stats, storage = getStorage()) {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats))
    return true
  } catch {
    return false
  }
}

export function recordStudySession(stats, sessionResults, todayKey = getTodayKey()) {
  const dayStats = stats[todayKey] || { studied: 0, reviewed: 0, correct: 0, wrong: 0, total: 0 }
  const correctCount = sessionResults.filter(r => r.remembered).length
  const wrongCount = sessionResults.length - correctCount
  const reviewedCount = sessionResults.filter(r => r.wasDue).length
  const newCount = sessionResults.length - reviewedCount

  return {
    ...stats,
    [todayKey]: {
      studied: dayStats.studied + newCount,
      reviewed: dayStats.reviewed + reviewedCount,
      correct: dayStats.correct + correctCount,
      wrong: dayStats.wrong + wrongCount,
      total: dayStats.total + sessionResults.length,
    },
  }
}

export function loadSettings(storage = getStorage()) {
  if (!storage) return { dailyGoal: DEFAULT_DAILY_GOAL }
  try {
    const raw = storage.getItem(STORAGE_KEY_SETTINGS)
    if (!raw) return { dailyGoal: DEFAULT_DAILY_GOAL }
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return { dailyGoal: DEFAULT_DAILY_GOAL }
    }
    return {
      dailyGoal: parsed.dailyGoal || DEFAULT_DAILY_GOAL,
    }
  } catch {
    return { dailyGoal: DEFAULT_DAILY_GOAL }
  }
}

export function saveSettings(settings, storage = getStorage()) {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

export function addDeck(decks, deck) {
  if (!Array.isArray(decks)) return [deck]
  return [...decks, deck]
}

export function updateDeck(decks, deckId, updates) {
  if (!Array.isArray(decks)) return []
  return decks.map(d => (d.id === deckId ? { ...d, ...updates } : d))
}

export function deleteDeck(decks, deckId) {
  if (!Array.isArray(decks)) return []
  return decks.filter(d => d.id !== deckId)
}

export function addCard(cards, card) {
  if (!Array.isArray(cards)) return [card]
  return [...cards, card]
}

export function updateCard(cards, cardId, updates) {
  if (!Array.isArray(cards)) return []
  return cards.map(c => (c.id === cardId ? { ...c, ...updates } : c))
}

export function deleteCard(cards, cardId) {
  if (!Array.isArray(cards)) return []
  return cards.filter(c => c.id !== cardId)
}

export function deleteCardsByDeckId(cards, deckId) {
  if (!Array.isArray(cards)) return []
  return cards.filter(c => c.deckId !== deckId)
}
