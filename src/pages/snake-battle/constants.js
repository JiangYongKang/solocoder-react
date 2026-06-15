export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600
export const GRID_SIZE = 20
export const SEGMENT_SIZE = 16
export const HEAD_SIZE = 20
export const FOOD_SIZE = 8

export const PLAYER_COLOR = '#22c55e'
export const PLAYER_HEAD_COLOR = '#15803d'

export const AI_COLORS = [
  { body: '#3b82f6', head: '#1d4ed8' },
  { body: '#ef4444', head: '#b91c1c' },
  { body: '#f97316', head: '#c2410c' },
  { body: '#a855f7', head: '#7e22ce' },
  { body: '#06b6d4', head: '#0e7490' },
  { body: '#ec4899', head: '#be185d' },
  { body: '#eab308', head: '#a16207' },
  { body: '#f8fafc', head: '#cbd5e1' },
]

export const AI_NAMES = [
  'SnakeBot01',
  'SnakeBot02',
  'SnakeBot03',
  'SnakeBot04',
  'SnakeBot05',
  'SnakeBot06',
  'SnakeBot07',
  'SnakeBot08',
]

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

export const DIRECTION_LIST = ['UP', 'DOWN', 'LEFT', 'RIGHT']

export const INITIAL_LENGTH = 3
export const MOVE_STEP = SEGMENT_SIZE

export const AI_COUNT_MIN = 5
export const AI_COUNT_MAX = 8

export const AI_DECISION_INTERVAL = 500

export const AI_BEHAVIOR = {
  FORAGE: 'forage',
  AVOID: 'avoid',
  RANDOM: 'random',
}

export const FOOD_COUNT = 30
export const FOOD_COLORS = ['#fca5a5', '#fdba74', '#fde047', '#86efac', '#67e8f9', '#93c5fd', '#c4b5fd', '#f9a8d4']

export const GAME_SPEEDS = {
  SLOW: { label: '0.5×', fps: 30, multiplier: 0.5 },
  NORMAL: { label: '1×', fps: 60, multiplier: 1 },
  FAST: { label: '2×', fps: 120, multiplier: 2 },
}

export const PLAYER_RESPAWN_DELAY = 3000

export const MINIMAP_WIDTH = 200
export const MINIMAP_HEIGHT = 150
export const MINIMAP_PADDING = 10

export const BG_COLOR = '#0f172a'
export const GRID_COLOR = 'rgba(148, 163, 184, 0.1)'
