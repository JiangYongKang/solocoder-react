export const STORAGE_KEY_DECKS = 'flashcard_decks'
export const STORAGE_KEY_CARDS = 'flashcard_cards'
export const STORAGE_KEY_STATS = 'flashcard_stats'
export const STORAGE_KEY_SETTINGS = 'flashcard_settings'

export const INTERVALS = [1, 3, 7, 14, 30, 60]

export const MAX_DECK_NAME_LENGTH = 30
export const DEFAULT_DAILY_GOAL = 20

export const TAG_COLORS = [
  { name: '红色', value: '#ef4444' },
  { name: '橙色', value: '#f97316' },
  { name: '黄色', value: '#eab308' },
  { name: '绿色', value: '#22c55e' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '紫色', value: '#a855f7' },
  { name: '粉色', value: '#ec4899' },
  { name: '灰色', value: '#6b7280' },
]

export const MASTERY_THRESHOLD = {
  correctRate: 0.8,
  minReviews: 3,
}

export const ACCURACY_COLOR = {
  HIGH: '#22c55e',
  MEDIUM: '#eab308',
  LOW: '#ef4444',
}

export const ACCURACY_THRESHOLD = {
  HIGH: 0.8,
  MEDIUM: 0.5,
}
