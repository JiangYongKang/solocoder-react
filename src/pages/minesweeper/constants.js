export const DIFFICULTY = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  EXPERT: 'expert',
  CUSTOM: 'custom',
}

export const DIFFICULTY_CONFIG = {
  [DIFFICULTY.BEGINNER]: {
    name: '初级',
    rows: 9,
    cols: 9,
    mines: 10,
  },
  [DIFFICULTY.INTERMEDIATE]: {
    name: '中级',
    rows: 16,
    cols: 16,
    mines: 40,
  },
  [DIFFICULTY.EXPERT]: {
    name: '高级',
    rows: 16,
    cols: 30,
    mines: 99,
  },
}

export const DIFFICULTY_LABELS = {
  [DIFFICULTY.BEGINNER]: '初级 (9×9, 10雷)',
  [DIFFICULTY.INTERMEDIATE]: '中级 (16×16, 40雷)',
  [DIFFICULTY.EXPERT]: '高级 (30×16, 99雷)',
  [DIFFICULTY.CUSTOM]: '自定义',
}

export const CELL_STATE = {
  HIDDEN: 'hidden',
  REVEALED: 'revealed',
  FLAGGED: 'flagged',
}

export const GAME_STATUS = {
  READY: 'ready',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
}

export const NUMBER_COLORS = {
  1: '#1976d2',
  2: '#388e3c',
  3: '#d32f2f',
  4: '#7b1fa2',
  5: '#ff6f00',
  6: '#0097a7',
  7: '#455a64',
  8: '#000000',
}

export const LEADERBOARD_STORAGE_KEY = 'minesweeper_leaderboard'
export const MAX_LEADERBOARD_ENTRIES = 10
export const MAX_TIME = 999
export const CELL_SIZE = 32
