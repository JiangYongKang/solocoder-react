export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert',
}

export const DIFFICULTY_CONFIG = {
  [DIFFICULTY.EASY]: { name: '简单', removeMin: 30, removeMax: 35 },
  [DIFFICULTY.MEDIUM]: { name: '中等', removeMin: 40, removeMax: 45 },
  [DIFFICULTY.HARD]: { name: '困难', removeMin: 50, removeMax: 55 },
  [DIFFICULTY.EXPERT]: { name: '专家', removeMin: 55, removeMax: 60 },
}

export const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
  COMPLETE: 'complete',
}

export const STORAGE_KEY = 'sudoku_game_state'

export const MAX_HINTS = 3

export const CELL_SIZE = 48
