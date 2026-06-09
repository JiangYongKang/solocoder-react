import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TETROMINO_SHAPES,
  TETROMINO_LIST,
  SCORE_TABLE,
  LINES_PER_LEVEL,
  MAX_LEVEL,
  INITIAL_DROP_INTERVAL,
  MIN_DROP_INTERVAL,
  DROP_INTERVAL_DECREMENT,
  STORAGE_KEY,
} from './constants.js'

export function createEmptyBoard() {
  const board = []
  for (let row = 0; row < BOARD_HEIGHT; row++) {
    board.push(new Array(BOARD_WIDTH).fill(null))
  }
  return board
}

export function randomTetrominoType() {
  return TETROMINO_LIST[Math.floor(Math.random() * TETROMINO_LIST.length)]
}

export function getTetrominoShape(type) {
  const shape = TETROMINO_SHAPES[type]
  return shape ? shape.map((row) => [...row]) : null
}

export function createPiece(type) {
  const shape = getTetrominoShape(type)
  if (!shape) return null
  return {
    type,
    shape,
    x: Math.floor((BOARD_WIDTH - shape[0].length) / 2),
    y: 0,
  }
}

export function rotateMatrix(matrix) {
  const n = matrix.length
  const result = []
  for (let i = 0; i < n; i++) {
    result.push([])
    for (let j = 0; j < n; j++) {
      result[i].push(matrix[n - 1 - j][i])
    }
  }
  return result
}

export function rotatePiece(piece) {
  return {
    ...piece,
    shape: rotateMatrix(piece.shape),
  }
}

export function checkCollision(board, piece, offsetX = 0, offsetY = 0, shape = null) {
  const useShape = shape || piece.shape
  for (let row = 0; row < useShape.length; row++) {
    for (let col = 0; col < useShape[row].length; col++) {
      if (!useShape[row][col]) continue
      const newX = piece.x + col + offsetX
      const newY = piece.y + row + offsetY
      if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
        return true
      }
      if (newY >= 0 && board[newY][newX]) {
        return true
      }
    }
  }
  return false
}

export function mergePieceToBoard(board, piece) {
  const newBoard = board.map((row) => [...row])
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const boardY = piece.y + row
        const boardX = piece.x + col
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = piece.type
        }
      }
    }
  }
  return newBoard
}

export function clearCompletedLines(board) {
  const newBoard = []
  let clearedCount = 0
  for (let row = 0; row < board.length; row++) {
    const isComplete = board[row].every((cell) => cell !== null)
    if (isComplete) {
      clearedCount++
    } else {
      newBoard.push([...board[row]])
    }
  }
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(new Array(BOARD_WIDTH).fill(null))
  }
  return { board: newBoard, clearedCount }
}

export function calculateScore(linesCleared) {
  return SCORE_TABLE[linesCleared] || 0
}

export function calculateLevel(totalLines) {
  const level = Math.floor(totalLines / LINES_PER_LEVEL) + 1
  return Math.min(level, MAX_LEVEL)
}

export function getDropInterval(level) {
  const interval = INITIAL_DROP_INTERVAL - (level - 1) * DROP_INTERVAL_DECREMENT
  return Math.max(interval, MIN_DROP_INTERVAL)
}

export function movePiece(piece, dx, dy) {
  return {
    ...piece,
    x: piece.x + dx,
    y: piece.y + dy,
  }
}

export function getGhostY(board, piece) {
  let ghostY = piece.y
  while (!checkCollision(board, { ...piece, y: ghostY + 1 })) {
    ghostY++
  }
  return ghostY
}

export function hardDrop(board, piece) {
  const ghostY = getGhostY(board, piece)
  const droppedPiece = { ...piece, y: ghostY }
  const mergedBoard = mergePieceToBoard(board, droppedPiece)
  const dropDistance = ghostY - piece.y
  return { board: mergedBoard, piece: droppedPiece, dropDistance }
}

export function loadHighScore(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return 0
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const parsed = parseInt(raw, 10)
    return isNaN(parsed) ? 0 : Math.max(0, parsed)
  } catch {
    return 0
  }
}

export function saveHighScore(score, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, String(score))
  } catch {
    // ignore
  }
}
