export const ICONS = [
  '🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑',
  '🍕', '🍔', '🌮', '🍩', '🎂', '⚽', '🏀', '🎸',
  '🚀', '🌟', '🎯', '🎨', '🎮', '🎪', '🎭', '🎰',
]

export const DIFFICULTY = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
  CUSTOM: 'custom',
}

export const DIFFICULTY_CONFIG = {
  [DIFFICULTY.EASY]: { rows: 6, cols: 6, hintPenalty: 2, label: '简单' },
  [DIFFICULTY.NORMAL]: { rows: 8, cols: 8, hintPenalty: 3, label: '普通' },
  [DIFFICULTY.HARD]: { rows: 10, cols: 10, hintPenalty: 4, label: '困难' },
  [DIFFICULTY.CUSTOM]: { rows: 8, cols: 8, hintPenalty: 3, label: '自定义' },
}

export const MAX_SHUFFLES = 3

export const STORAGE_KEY_LEADERBOARD = 'link_game_leaderboard'

export const CELL_SIZE = 56

export const BORDER_PADDING = 1

export const BASE_SCORE = 1000
export const TIME_PENALTY_PER_SECOND = 2
export const STEP_PENALTY = 5
export const BONUS_UNUSED_HINT = 200
export const BONUS_UNUSED_SHUFFLE = 300
