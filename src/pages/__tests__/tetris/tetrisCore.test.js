import { describe, it, expect, beforeEach } from 'vitest'
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TETROMINO_TYPES,
  TETROMINO_SHAPES,
  INITIAL_DROP_INTERVAL,
  MIN_DROP_INTERVAL,
  MAX_LEVEL,
} from '@/pages/tetris/constants.js'
import {
  createEmptyBoard,
  randomTetrominoType,
  getTetrominoShape,
  createPiece,
  rotateMatrix,
  rotatePiece,
  checkCollision,
  mergePieceToBoard,
  clearCompletedLines,
  calculateScore,
  calculateLevel,
  getDropInterval,
  movePiece,
  getGhostY,
  hardDrop,
  loadHighScore,
  saveHighScore,
} from '@/pages/tetris/tetrisCore.js'

function createMockStorage() {
  const store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    _store: store,
  }
}

function createPartialBoard(rows) {
  const board = createEmptyBoard()
  for (let i = 0; i < rows.length && i < BOARD_HEIGHT; i++) {
    const row = rows[i]
    for (let j = 0; j < row.length && j < BOARD_WIDTH; j++) {
      board[BOARD_HEIGHT - rows.length + i][j] = row[j]
    }
  }
  return board
}

describe('tetrisCore', () => {
  describe('createEmptyBoard', () => {
    it('should create a board with correct dimensions', () => {
      const board = createEmptyBoard()
      expect(board.length).toBe(BOARD_HEIGHT)
      board.forEach((row) => {
        expect(row.length).toBe(BOARD_WIDTH)
      })
    })

    it('should fill all cells with null', () => {
      const board = createEmptyBoard()
      board.forEach((row) => {
        row.forEach((cell) => {
          expect(cell).toBeNull()
        })
      })
    })
  })

  describe('randomTetrominoType', () => {
    it('should return a valid tetromino type', () => {
      const types = Object.values(TETROMINO_TYPES)
      for (let i = 0; i < 50; i++) {
        const type = randomTetrominoType()
        expect(types).toContain(type)
      }
    })
  })

  describe('getTetrominoShape', () => {
    it('should return correct shape for each type', () => {
      Object.values(TETROMINO_TYPES).forEach((type) => {
        const shape = getTetrominoShape(type)
        expect(shape).toEqual(TETROMINO_SHAPES[type].map((row) => [...row]))
      })
    })

    it('should return null for invalid type', () => {
      expect(getTetrominoShape('INVALID')).toBeNull()
    })

    it('should return a deep copy of the shape', () => {
      const shape1 = getTetrominoShape(TETROMINO_TYPES.T)
      const shape2 = getTetrominoShape(TETROMINO_TYPES.T)
      shape1[0][0] = 999
      expect(shape2[0][0]).toBe(0)
    })
  })

  describe('createPiece', () => {
    it('should create a valid piece with correct type and shape', () => {
      const piece = createPiece(TETROMINO_TYPES.T)
      expect(piece.type).toBe(TETROMINO_TYPES.T)
      expect(piece.shape).toEqual(TETROMINO_SHAPES.T)
      expect(typeof piece.x).toBe('number')
      expect(typeof piece.y).toBe('number')
    })

    it('should position piece horizontally centered', () => {
      const piece = createPiece(TETROMINO_TYPES.T)
      const expectedX = Math.floor((BOARD_WIDTH - piece.shape[0].length) / 2)
      expect(piece.x).toBe(expectedX)
    })

    it('should position piece at the top (y=0)', () => {
      const piece = createPiece(TETROMINO_TYPES.T)
      expect(piece.y).toBe(0)
    })

    it('should return null for invalid type', () => {
      expect(createPiece('INVALID')).toBeNull()
    })
  })

  describe('rotateMatrix', () => {
    it('should rotate a 3x3 matrix 90 degrees clockwise', () => {
      const original = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]
      const rotated = [
        [7, 4, 1],
        [8, 5, 2],
        [9, 6, 3],
      ]
      expect(rotateMatrix(original)).toEqual(rotated)
    })

    it('should rotate I tetromino correctly', () => {
      const shape = getTetrominoShape(TETROMINO_TYPES.I)
      const rotated = rotateMatrix(shape)
      expect(rotated[0][2]).toBe(1)
      expect(rotated[1][2]).toBe(1)
      expect(rotated[2][2]).toBe(1)
      expect(rotated[3][2]).toBe(1)
    })

    it('should not mutate the original matrix', () => {
      const original = [
        [1, 0],
        [0, 1],
      ]
      const originalCopy = original.map((row) => [...row])
      rotateMatrix(original)
      expect(original).toEqual(originalCopy)
    })
  })

  describe('rotatePiece', () => {
    it('should return a new piece with rotated shape', () => {
      const piece = createPiece(TETROMINO_TYPES.T)
      const rotated = rotatePiece(piece)
      expect(rotated).not.toBe(piece)
      expect(rotated.shape).not.toEqual(piece.shape)
      expect(rotated.type).toBe(piece.type)
      expect(rotated.x).toBe(piece.x)
      expect(rotated.y).toBe(piece.y)
    })
  })

  describe('checkCollision', () => {
    it('should return false when piece is within empty board', () => {
      const board = createEmptyBoard()
      const piece = createPiece(TETROMINO_TYPES.T)
      expect(checkCollision(board, piece)).toBe(false)
    })

    it('should return true when piece moves past left boundary', () => {
      const board = createEmptyBoard()
      const piece = createPiece(TETROMINO_TYPES.T)
      piece.x = -1
      expect(checkCollision(board, piece)).toBe(true)
    })

    it('should return true when piece moves past right boundary', () => {
      const board = createEmptyBoard()
      const piece = createPiece(TETROMINO_TYPES.T)
      piece.x = BOARD_WIDTH - 2
      expect(checkCollision(board, piece)).toBe(true)
    })

    it('should return true when piece moves past bottom boundary', () => {
      const board = createEmptyBoard()
      const piece = createPiece(TETROMINO_TYPES.T)
      piece.y = BOARD_HEIGHT - 1
      expect(checkCollision(board, piece)).toBe(true)
    })

    it('should return true when piece overlaps existing blocks', () => {
      const board = createEmptyBoard()
      const piece = createPiece(TETROMINO_TYPES.T)
      board[piece.y + 1][piece.x + 1] = TETROMINO_TYPES.O
      expect(checkCollision(board, piece)).toBe(true)
    })

    it('should use offset parameters correctly', () => {
      const board = createEmptyBoard()
      const piece = createPiece(TETROMINO_TYPES.T)
      expect(checkCollision(board, piece, 100, 0)).toBe(true)
      expect(checkCollision(board, piece, 0, 100)).toBe(true)
    })

    it('should accept custom shape parameter', () => {
      const board = createEmptyBoard()
      const piece = createPiece(TETROMINO_TYPES.T)
      const customShape = [[1]]
      piece.x = BOARD_WIDTH
      expect(checkCollision(board, piece, 0, 0, customShape)).toBe(true)
    })
  })

  describe('mergePieceToBoard', () => {
    it('should merge piece cells into the board', () => {
      const board = createEmptyBoard()
      const piece = createPiece(TETROMINO_TYPES.O)
      piece.x = 0
      piece.y = BOARD_HEIGHT - 2
      const merged = mergePieceToBoard(board, piece)
      expect(merged[BOARD_HEIGHT - 2][0]).toBe(TETROMINO_TYPES.O)
      expect(merged[BOARD_HEIGHT - 2][1]).toBe(TETROMINO_TYPES.O)
      expect(merged[BOARD_HEIGHT - 1][0]).toBe(TETROMINO_TYPES.O)
      expect(merged[BOARD_HEIGHT - 1][1]).toBe(TETROMINO_TYPES.O)
    })

    it('should not mutate the original board', () => {
      const board = createEmptyBoard()
      const piece = createPiece(TETROMINO_TYPES.O)
      piece.y = BOARD_HEIGHT - 2
      mergePieceToBoard(board, piece)
      expect(board[BOARD_HEIGHT - 1][0]).toBeNull()
    })

    it('should ignore cells above the board (y < 0)', () => {
      const board = createEmptyBoard()
      const piece = createPiece(TETROMINO_TYPES.T)
      piece.y = -2
      const merged = mergePieceToBoard(board, piece)
      expect(merged[0][piece.x]).toBeNull()
      expect(merged[0][piece.x + 1]).toBeNull()
    })
  })

  describe('clearCompletedLines', () => {
    it('should clear a single completed line', () => {
      const fullRow = new Array(BOARD_WIDTH).fill(TETROMINO_TYPES.O)
      const board = createPartialBoard([fullRow])
      const { board: cleared, clearedCount } = clearCompletedLines(board)
      expect(clearedCount).toBe(1)
      expect(cleared[BOARD_HEIGHT - 1].every((c) => c === null)).toBe(true)
    })

    it('should clear multiple completed lines', () => {
      const fullRow = new Array(BOARD_WIDTH).fill(TETROMINO_TYPES.O)
      const board = createPartialBoard([fullRow, fullRow])
      const { board: cleared, clearedCount } = clearCompletedLines(board)
      expect(clearedCount).toBe(2)
      expect(cleared[BOARD_HEIGHT - 1].every((c) => c === null)).toBe(true)
      expect(cleared[BOARD_HEIGHT - 2].every((c) => c === null)).toBe(true)
    })

    it('should not clear incomplete lines', () => {
      const partialRow = new Array(BOARD_WIDTH).fill(null)
      partialRow[0] = TETROMINO_TYPES.O
      const board = createPartialBoard([partialRow])
      const { board: cleared, clearedCount } = clearCompletedLines(board)
      expect(clearedCount).toBe(0)
      expect(cleared[BOARD_HEIGHT - 1][0]).toBe(TETROMINO_TYPES.O)
    })

    it('should shift remaining rows down after clearing', () => {
      const fullRow = new Array(BOARD_WIDTH).fill(TETROMINO_TYPES.O)
      const markedRow = new Array(BOARD_WIDTH).fill(null)
      markedRow[0] = TETROMINO_TYPES.T
      const board = createPartialBoard([fullRow, markedRow])
      const { board: cleared } = clearCompletedLines(board)
      expect(cleared[BOARD_HEIGHT - 1][0]).toBe(TETROMINO_TYPES.T)
    })

    it('should pad top with empty rows', () => {
      const fullRow = new Array(BOARD_WIDTH).fill(TETROMINO_TYPES.O)
      const board = createPartialBoard([fullRow])
      const { board: cleared } = clearCompletedLines(board)
      expect(cleared[0].every((c) => c === null)).toBe(true)
      expect(cleared.length).toBe(BOARD_HEIGHT)
    })

    it('should return 0 cleared for empty board', () => {
      const board = createEmptyBoard()
      const { clearedCount } = clearCompletedLines(board)
      expect(clearedCount).toBe(0)
    })
  })

  describe('calculateScore', () => {
    it('should return 100 for 1 line at level 1', () => {
      expect(calculateScore(1, 1)).toBe(100)
    })

    it('should return 300 for 2 lines at level 1', () => {
      expect(calculateScore(2, 1)).toBe(300)
    })

    it('should return 500 for 3 lines at level 1', () => {
      expect(calculateScore(3, 1)).toBe(500)
    })

    it('should return 800 for 4 lines (Tetris) at level 1', () => {
      expect(calculateScore(4, 1)).toBe(800)
    })

    it('should multiply score by level', () => {
      expect(calculateScore(1, 3)).toBe(300)
      expect(calculateScore(2, 5)).toBe(1500)
      expect(calculateScore(4, 10)).toBe(8000)
    })

    it('should return 0 for invalid line count', () => {
      expect(calculateScore(0, 1)).toBe(0)
      expect(calculateScore(5, 1)).toBe(0)
      expect(calculateScore(-1, 1)).toBe(0)
    })

    it('should default to level 1 when not specified', () => {
      expect(calculateScore(1)).toBe(100)
    })
  })

  describe('calculateLevel', () => {
    it('should return level 1 for 0 lines', () => {
      expect(calculateLevel(0)).toBe(1)
    })

    it('should return level 1 for 9 lines', () => {
      expect(calculateLevel(9)).toBe(1)
    })

    it('should return level 2 for 10 lines', () => {
      expect(calculateLevel(10)).toBe(2)
    })

    it('should return level 3 for 20 lines', () => {
      expect(calculateLevel(20)).toBe(3)
    })

    it('should cap level at MAX_LEVEL', () => {
      expect(calculateLevel(1000)).toBe(MAX_LEVEL)
      expect(calculateLevel(9999)).toBe(MAX_LEVEL)
    })
  })

  describe('getDropInterval', () => {
    it('should return initial interval for level 1', () => {
      expect(getDropInterval(1)).toBe(INITIAL_DROP_INTERVAL)
    })

    it('should decrease by 50ms per level', () => {
      expect(getDropInterval(2)).toBe(INITIAL_DROP_INTERVAL - 50)
      expect(getDropInterval(3)).toBe(INITIAL_DROP_INTERVAL - 100)
    })

    it('should not go below minimum interval', () => {
      expect(getDropInterval(100)).toBe(MIN_DROP_INTERVAL)
      expect(getDropInterval(MAX_LEVEL)).toBeLessThanOrEqual(INITIAL_DROP_INTERVAL)
    })
  })

  describe('movePiece', () => {
    it('should move piece by delta', () => {
      const piece = createPiece(TETROMINO_TYPES.T)
      piece.x = 3
      piece.y = 5
      const moved = movePiece(piece, 1, 2)
      expect(moved.x).toBe(4)
      expect(moved.y).toBe(7)
    })

    it('should not mutate the original piece', () => {
      const piece = createPiece(TETROMINO_TYPES.T)
      const originalX = piece.x
      const originalY = piece.y
      movePiece(piece, 10, 10)
      expect(piece.x).toBe(originalX)
      expect(piece.y).toBe(originalY)
    })
  })

  describe('getGhostY', () => {
    it('should return y at bottom for empty board', () => {
      const board = createEmptyBoard()
      const piece = createPiece(TETROMINO_TYPES.O)
      const ghostY = getGhostY(board, piece)
      expect(ghostY).toBe(BOARD_HEIGHT - piece.shape.length)
    })

    it('should stop above existing blocks', () => {
      const board = createEmptyBoard()
      const blockY = BOARD_HEIGHT - 5
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[blockY][x] = TETROMINO_TYPES.O
      }
      const piece = createPiece(TETROMINO_TYPES.O)
      const ghostY = getGhostY(board, piece)
      expect(ghostY).toBe(blockY - piece.shape.length)
    })
  })

  describe('hardDrop', () => {
    it('should drop piece to the bottom of empty board', () => {
      const board = createEmptyBoard()
      const piece = createPiece(TETROMINO_TYPES.O)
      const { board: merged, piece: dropped, dropDistance } = hardDrop(board, piece)
      expect(dropped.y).toBe(BOARD_HEIGHT - piece.shape.length)
      expect(dropDistance).toBe(BOARD_HEIGHT - piece.shape.length)
      expect(merged[BOARD_HEIGHT - 1][piece.x]).toBe(TETROMINO_TYPES.O)
    })

    it('should drop piece just above existing blocks', () => {
      const board = createEmptyBoard()
      const blockY = BOARD_HEIGHT - 5
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[blockY][x] = TETROMINO_TYPES.O
      }
      const piece = createPiece(TETROMINO_TYPES.O)
      const { piece: dropped } = hardDrop(board, piece)
      expect(dropped.y).toBe(blockY - piece.shape.length)
    })
  })

  describe('localStorage persistence', () => {
    let storage
    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadHighScore should return 0 when storage empty', () => {
      expect(loadHighScore(storage)).toBe(0)
    })

    it('saveHighScore and loadHighScore should round-trip correctly', () => {
      saveHighScore(1234, storage)
      expect(loadHighScore(storage)).toBe(1234)
    })

    it('loadHighScore should return 0 for invalid data', () => {
      storage.setItem('tetris_high_score', 'not-a-number')
      expect(loadHighScore(storage)).toBe(0)
    })

    it('loadHighScore should return 0 for negative scores', () => {
      storage.setItem('tetris_high_score', '-100')
      expect(loadHighScore(storage)).toBe(0)
    })

    it('should not throw when storage is null', () => {
      expect(() => loadHighScore(null)).not.toThrow()
      expect(() => saveHighScore(100, null)).not.toThrow()
    })
  })
})
