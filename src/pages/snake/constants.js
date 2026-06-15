export const GRID_SIZE = 20
export const CELL_SIZE = 25

export const INITIAL_DIRECTION = 'RIGHT'

export const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
]

export const DIRECTIONS = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
}

export const OPPOSITE_DIRECTIONS = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
}

export const GAME_STATUS = {
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
}

export const GAME_MODE = {
  WALL_DEATH: 'wall_death',
  THROUGH_WALL: 'through_wall',
}

export const SCORE_PER_FOOD = 10
export const POINTS_PER_LEVEL = 50

export const INITIAL_MOVE_INTERVAL = 150
export const MIN_MOVE_INTERVAL = 50
export const MOVE_INTERVAL_DECREMENT = 10

export const LEADERBOARD_STORAGE_KEY = 'snake_leaderboard'
export const MAX_LEADERBOARD_ENTRIES = 10

export const SNAKE_HEAD_COLOR = '#4ade80'
export const SNAKE_BODY_COLOR = '#22c55e'
export const FOOD_COLOR = '#ef4444'
export const GRID_LINE_COLOR = 'rgba(255, 255, 255, 0.1)'
export const BG_COLOR = '#0f172a'
