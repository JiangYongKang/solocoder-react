export const CANVAS_SIZE = 500

export const DIFFICULTIES = {
  EASY: 3,
  MEDIUM: 4,
  HARD: 5,
}

export const DIFFICULTY_LABELS = {
  [DIFFICULTIES.EASY]: '简单 (3×3)',
  [DIFFICULTIES.MEDIUM]: '中等 (4×4)',
  [DIFFICULTIES.HARD]: '困难 (5×5)',
}

export const GAME_PHASE = {
  UPLOAD: 'upload',
  SELECT_DIFFICULTY: 'select_difficulty',
  PLAYING: 'playing',
  PAUSED: 'paused',
  COMPLETED: 'completed',
}

export const LEADERBOARD_STORAGE_KEY = 'puzzle_game_leaderboard'
export const MAX_LEADERBOARD_ENTRIES = 50
export const PAGE_SIZE = 10

export const SWAP_MODE = {
  DRAG: 'drag',
  CLICK: 'click',
}

export const FLASH_DURATION = 2000

export const CELEBRATION_WAVE_DELAY = 80

export const SCORE_CONFIG = {
  [DIFFICULTIES.EASY]: { baseTime: 60, baseMoves: 20, timeWeight: 0.4, movesWeight: 0.4, difficultyBonus: 10 },
  [DIFFICULTIES.MEDIUM]: { baseTime: 180, baseMoves: 50, timeWeight: 0.35, movesWeight: 0.35, difficultyBonus: 30 },
  [DIFFICULTIES.HARD]: { baseTime: 360, baseMoves: 100, timeWeight: 0.3, movesWeight: 0.3, difficultyBonus: 50 },
}

export const PIECE_BORDER_WIDTH = 2
export const PIECE_HIGHLIGHT_COLOR = 'rgba(255, 215, 0, 0.8)'
export const PIECE_CORRECT_COLOR = 'rgba(0, 200, 0, 0.3)'
export const PIECE_DRAG_OPACITY = 0.6
