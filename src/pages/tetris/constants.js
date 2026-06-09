export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20
export const CELL_SIZE = 30
export const PREVIEW_GRID_SIZE = 6
export const PREVIEW_CELL_SIZE = 25

export const STORAGE_KEY = 'tetris_high_score'

export const INITIAL_DROP_INTERVAL = 1000
export const MIN_DROP_INTERVAL = 200
export const DROP_INTERVAL_DECREMENT = 50
export const LINES_PER_LEVEL = 10
export const MAX_LEVEL = 15

export const SCORE_TABLE = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
}

export const TETROMINO_TYPES = {
  I: 'I',
  O: 'O',
  T: 'T',
  S: 'S',
  Z: 'Z',
  J: 'J',
  L: 'L',
}

export const TETROMINO_COLORS = {
  [TETROMINO_TYPES.I]: '#00f0f0',
  [TETROMINO_TYPES.O]: '#f0f000',
  [TETROMINO_TYPES.T]: '#a000f0',
  [TETROMINO_TYPES.S]: '#00f000',
  [TETROMINO_TYPES.Z]: '#f00000',
  [TETROMINO_TYPES.J]: '#0000f0',
  [TETROMINO_TYPES.L]: '#f0a000',
}

export const TETROMINO_SHAPES = {
  [TETROMINO_TYPES.I]: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [TETROMINO_TYPES.O]: [
    [1, 1],
    [1, 1],
  ],
  [TETROMINO_TYPES.T]: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [TETROMINO_TYPES.S]: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  [TETROMINO_TYPES.Z]: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  [TETROMINO_TYPES.J]: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [TETROMINO_TYPES.L]: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
}

export const TETROMINO_LIST = Object.values(TETROMINO_TYPES)
