import { describe, it, expect, beforeEach } from 'vitest'
import {
  CELL_STATE,
  GAME_STATUS,
  DIFFICULTY,
  DIFFICULTY_CONFIG,
  MAX_LEADERBOARD_ENTRIES,
} from '@/pages/minesweeper/constants.js'
import {
  createEmptyBoard,
  getNeighbors,
  placeMines,
  calculateNeighborMineCounts,
  initializeGame,
  revealCellFlood,
  revealCell,
  toggleFlag,
  getRemainingMines,
  checkWin,
  getWrongFlags,
  revealAllMines,
  formatTime,
  loadLeaderboard,
  saveLeaderboard,
  addToLeaderboard,
  validateCustomConfig,
} from '@/pages/minesweeper/minesweeperCore.js'

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

function createTestGameWithMines(minePositions) {
  const rows = 9
  const cols = 9
  const board = createEmptyBoard(rows, cols)
  for (const [r, c] of minePositions) {
    board[r][c].isMine = true
  }
  const withCounts = calculateNeighborMineCounts(board)
  return {
    ...initializeGame(rows, cols, minePositions.length),
    board: withCounts,
    minesPlaced: true,
    status: GAME_STATUS.PLAYING,
  }
}

describe('minesweeperCore', () => {
  describe('createEmptyBoard', () => {
    it('should create a board with correct dimensions', () => {
      const rows = 9
      const cols = 9
      const board = createEmptyBoard(rows, cols)
      expect(board.length).toBe(rows)
      board.forEach((row) => {
        expect(row.length).toBe(cols)
      })
    })

    it('should initialize cells with correct default values', () => {
      const board = createEmptyBoard(5, 5)
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const cell = board[r][c]
          expect(cell.row).toBe(r)
          expect(cell.col).toBe(c)
          expect(cell.isMine).toBe(false)
          expect(cell.neighborMines).toBe(0)
          expect(cell.state).toBe(CELL_STATE.HIDDEN)
        }
      }
    })
  })

  describe('getNeighbors', () => {
    it('should return 8 neighbors for inner cell', () => {
      const neighbors = getNeighbors(10, 10, 5, 5)
      expect(neighbors.length).toBe(8)
      expect(neighbors).toContainEqual([4, 4])
      expect(neighbors).toContainEqual([4, 5])
      expect(neighbors).toContainEqual([4, 6])
      expect(neighbors).toContainEqual([5, 4])
      expect(neighbors).toContainEqual([5, 6])
      expect(neighbors).toContainEqual([6, 4])
      expect(neighbors).toContainEqual([6, 5])
      expect(neighbors).toContainEqual([6, 6])
    })

    it('should return 3 neighbors for corner cell', () => {
      const neighbors = getNeighbors(10, 10, 0, 0)
      expect(neighbors.length).toBe(3)
      expect(neighbors).toContainEqual([0, 1])
      expect(neighbors).toContainEqual([1, 0])
      expect(neighbors).toContainEqual([1, 1])
    })

    it('should return 5 neighbors for edge cell', () => {
      const neighbors = getNeighbors(10, 10, 0, 5)
      expect(neighbors.length).toBe(5)
      expect(neighbors).toContainEqual([0, 4])
      expect(neighbors).toContainEqual([0, 6])
      expect(neighbors).toContainEqual([1, 4])
      expect(neighbors).toContainEqual([1, 5])
      expect(neighbors).toContainEqual([1, 6])
    })
  })

  describe('placeMines', () => {
    it('should place correct number of mines', () => {
      const board = createEmptyBoard(9, 9)
      const result = placeMines(board, 10, 0, 0)
      let mineCount = 0
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (result[r][c].isMine) mineCount++
        }
      }
      expect(mineCount).toBe(10)
    })

    it('should not place mines on or around first click position', () => {
      const board = createEmptyBoard(9, 9)
      const safeRow = 4
      const safeCol = 4
      const result = placeMines(board, 80, safeRow, safeCol)

      expect(result[safeRow][safeCol].isMine).toBe(false)
      const neighbors = getNeighbors(9, 9, safeRow, safeCol)
      for (const [nr, nc] of neighbors) {
        expect(result[nr][nc].isMine).toBe(false)
      }
    })

    it('should not mutate original board', () => {
      const board = createEmptyBoard(5, 5)
      const result = placeMines(board, 5, 0, 0)
      expect(board[0][0].isMine).toBe(false)
      expect(result).not.toBe(board)
    })
  })

  describe('calculateNeighborMineCounts', () => {
    it('should correctly count neighbor mines', () => {
      const board = createEmptyBoard(5, 5)
      board[0][0].isMine = true
      board[0][1].isMine = true
      board[2][2].isMine = true
      const result = calculateNeighborMineCounts(board)

      expect(result[1][1].neighborMines).toBe(3)
      expect(result[1][0].neighborMines).toBe(2)
      expect(result[0][2].neighborMines).toBe(1)
      expect(result[1][2].neighborMines).toBe(2)
    })

    it('should not count mine cell itself', () => {
      const board = createEmptyBoard(3, 3)
      board[1][1].isMine = true
      const result = calculateNeighborMineCounts(board)
      expect(result[1][1].neighborMines).toBe(0)
    })

    it('should return 0 for cells with no mine neighbors', () => {
      const board = createEmptyBoard(5, 5)
      board[0][0].isMine = true
      const result = calculateNeighborMineCounts(board)
      expect(result[4][4].neighborMines).toBe(0)
    })
  })

  describe('initializeGame', () => {
    it('should initialize game with correct state', () => {
      const game = initializeGame(9, 9, 10)
      expect(game.rows).toBe(9)
      expect(game.cols).toBe(9)
      expect(game.mineCount).toBe(10)
      expect(game.status).toBe(GAME_STATUS.READY)
      expect(game.minesPlaced).toBe(false)
      expect(game.revealedCount).toBe(0)
      expect(game.flagCount).toBe(0)
      expect(game.hitMine).toBeNull()
      expect(game.board.length).toBe(9)
    })

    it('should match beginner difficulty config', () => {
      const cfg = DIFFICULTY_CONFIG[DIFFICULTY.BEGINNER]
      const game = initializeGame(cfg.rows, cfg.cols, cfg.mines)
      expect(game.rows).toBe(9)
      expect(game.cols).toBe(9)
      expect(game.mineCount).toBe(10)
    })
  })

  describe('revealCell', () => {
    it('should place mines on first reveal', () => {
      const game = initializeGame(9, 9, 10)
      expect(game.minesPlaced).toBe(false)
      const result = revealCell(game, 4, 4)
      expect(result.minesPlaced).toBe(true)
      expect(result.status).toBe(GAME_STATUS.PLAYING)
    })

    it('should lose game when hitting a mine', () => {
      const game = createTestGameWithMines([[2, 2]])
      const result = revealCell(game, 2, 2)
      expect(result.status).toBe(GAME_STATUS.LOST)
      expect(result.hitMine).toEqual({ row: 2, col: 2 })
      expect(result.board[2][2].state).toBe(CELL_STATE.REVEALED)
    })

    it('should detect win when all non-mine cells revealed', () => {
      const game = createTestGameWithMines([[0, 0]])
      let current = game
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (r === 0 && c === 0) continue
          if (current.status === GAME_STATUS.WON) break
          current = revealCell(current, r, c)
        }
      }
      expect(current.status).toBe(GAME_STATUS.WON)
    })

    it('should do nothing for already revealed cell', () => {
      const game = createTestGameWithMines([[0, 0]])
      const revealed = revealCell(game, 5, 5)
      const again = revealCell(revealed, 5, 5)
      expect(again.revealedCount).toBe(revealed.revealedCount)
    })

    it('should do nothing for flagged cell', () => {
      const game = createTestGameWithMines([[0, 0]])
      const flagged = toggleFlag(game, 5, 5)
      const result = revealCell(flagged, 5, 5)
      expect(result.board[5][5].state).toBe(CELL_STATE.FLAGGED)
      expect(result.revealedCount).toBe(0)
    })
  })

  describe('revealCellFlood', () => {
    it('should flood reveal when cell has 0 neighbor mines', () => {
      const game = createTestGameWithMines([[0, 0]])
      const result = revealCellFlood(game, 8, 8)
      expect(result.revealedCount).toBeGreaterThan(1)
      expect(result.board[8][8].state).toBe(CELL_STATE.REVEALED)
    })

    it('should only reveal single cell when it has neighbor mines', () => {
      const game = createTestGameWithMines([[0, 0]])
      const result = revealCellFlood(game, 0, 1)
      expect(result.revealedCount).toBe(1)
      expect(result.board[0][1].state).toBe(CELL_STATE.REVEALED)
      expect(result.board[0][1].neighborMines).toBe(1)
    })

    it('should not reveal mines during flood', () => {
      const game = createTestGameWithMines([[0, 0]])
      const result = revealCellFlood(game, 8, 8)
      expect(result.board[0][0].state).toBe(CELL_STATE.HIDDEN)
    })
  })

  describe('toggleFlag', () => {
    it('should flag a hidden cell', () => {
      const game = initializeGame(5, 5, 3)
      const result = toggleFlag(game, 2, 2)
      expect(result.board[2][2].state).toBe(CELL_STATE.FLAGGED)
      expect(result.flagCount).toBe(1)
    })

    it('should unflag a flagged cell', () => {
      const game = initializeGame(5, 5, 3)
      const flagged = toggleFlag(game, 2, 2)
      const unflagged = toggleFlag(flagged, 2, 2)
      expect(unflagged.board[2][2].state).toBe(CELL_STATE.HIDDEN)
      expect(unflagged.flagCount).toBe(0)
    })

    it('should do nothing for revealed cell', () => {
      const game = createTestGameWithMines([[0, 0]])
      const revealed = revealCell(game, 4, 4)
      const result = toggleFlag(revealed, 4, 4)
      expect(result.board[4][4].state).toBe(CELL_STATE.REVEALED)
      expect(result.flagCount).toBe(0)
    })
  })

  describe('getRemainingMines', () => {
    it('should return total mines when no flags', () => {
      const game = initializeGame(9, 9, 10)
      expect(getRemainingMines(game)).toBe(10)
    })

    it('should subtract flag count from total mines', () => {
      const game = initializeGame(9, 9, 10)
      let flagged = toggleFlag(game, 0, 0)
      flagged = toggleFlag(flagged, 1, 1)
      expect(getRemainingMines(flagged)).toBe(8)
    })

    it('can be negative if more flags than mines', () => {
      const game = initializeGame(5, 5, 3)
      let flagged = game
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          flagged = toggleFlag(flagged, r, c)
        }
      }
      expect(getRemainingMines(flagged)).toBeLessThan(0)
    })
  })

  describe('checkWin', () => {
    it('should return false when game starts', () => {
      const game = initializeGame(9, 9, 10)
      expect(checkWin(game)).toBe(false)
    })

    it('should return true when all non-mine cells revealed', () => {
      const game = createTestGameWithMines([[0, 0]])
      let current = game
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (r === 0 && c === 0) continue
          current = revealCell(current, r, c)
        }
      }
      expect(checkWin(current)).toBe(true)
    })
  })

  describe('getWrongFlags', () => {
    it('should return empty when no flags', () => {
      const game = createTestGameWithMines([[0, 0]])
      expect(getWrongFlags(game)).toEqual([])
    })

    it('should detect flags on non-mine cells', () => {
      const game = createTestGameWithMines([[0, 0]])
      const flagged = toggleFlag(game, 5, 5)
      const wrong = getWrongFlags(flagged)
      expect(wrong.length).toBe(1)
      expect(wrong[0]).toEqual({ row: 5, col: 5 })
    })

    it('should not include correct flags', () => {
      const game = createTestGameWithMines([[0, 0]])
      const flagged = toggleFlag(game, 0, 0)
      const wrong = getWrongFlags(flagged)
      expect(wrong).toEqual([])
    })
  })

  describe('revealAllMines', () => {
    it('should reveal all hidden mines', () => {
      const game = createTestGameWithMines([[0, 0], [2, 2], [4, 4]])
      const result = revealAllMines(game)
      expect(result.board[0][0].state).toBe(CELL_STATE.REVEALED)
      expect(result.board[2][2].state).toBe(CELL_STATE.REVEALED)
      expect(result.board[4][4].state).toBe(CELL_STATE.REVEALED)
    })

    it('should not reveal flagged mines', () => {
      const game = createTestGameWithMines([[0, 0], [2, 2]])
      const flagged = toggleFlag(game, 0, 0)
      const result = revealAllMines(flagged)
      expect(result.board[0][0].state).toBe(CELL_STATE.FLAGGED)
      expect(result.board[2][2].state).toBe(CELL_STATE.REVEALED)
    })
  })

  describe('formatTime', () => {
    it('should format 0 seconds as 00:00', () => {
      expect(formatTime(0)).toBe('00:00')
    })

    it('should format seconds correctly', () => {
      expect(formatTime(5)).toBe('00:05')
      expect(formatTime(30)).toBe('00:30')
    })

    it('should format minutes correctly', () => {
      expect(formatTime(60)).toBe('01:00')
      expect(formatTime(90)).toBe('01:30')
      expect(formatTime(125)).toBe('02:05')
    })

    it('should cap at max time 999', () => {
      expect(formatTime(999)).toBe('16:39')
      expect(formatTime(1000)).toBe('16:39')
      expect(formatTime(9999)).toBe('16:39')
    })

    it('should handle negative input as 0', () => {
      expect(formatTime(-1)).toBe('00:00')
    })
  })

  describe('leaderboard', () => {
    let storage
    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadLeaderboard should return empty structure when storage empty', () => {
      const result = loadLeaderboard(storage)
      expect(result).toEqual({ beginner: [], intermediate: [], expert: [], custom: [] })
    })

    it('saveLeaderboard and loadLeaderboard should round-trip correctly', () => {
      const data = {
        beginner: [{ time: 30, date: '2025-01-01T00:00:00.000Z' }],
        intermediate: [],
        expert: [],
        custom: [],
      }
      saveLeaderboard(data, storage)
      const loaded = loadLeaderboard(storage)
      expect(loaded).toEqual(data)
    })

    it('addToLeaderboard should add entry sorted by time ascending', () => {
      addToLeaderboard(DIFFICULTY.BEGINNER, 100, storage)
      addToLeaderboard(DIFFICULTY.BEGINNER, 50, storage)
      addToLeaderboard(DIFFICULTY.BEGINNER, 75, storage)
      const loaded = loadLeaderboard(storage)
      expect(loaded.beginner.length).toBe(3)
      expect(loaded.beginner[0].time).toBe(50)
      expect(loaded.beginner[1].time).toBe(75)
      expect(loaded.beginner[2].time).toBe(100)
    })

    it('addToLeaderboard should limit to MAX_LEADERBOARD_ENTRIES', () => {
      for (let i = 0; i < MAX_LEADERBOARD_ENTRIES + 5; i++) {
        addToLeaderboard(DIFFICULTY.BEGINNER, i + 1, storage)
      }
      const loaded = loadLeaderboard(storage)
      expect(loaded.beginner.length).toBe(MAX_LEADERBOARD_ENTRIES)
      expect(loaded.beginner[0].time).toBe(1)
      expect(loaded.beginner[MAX_LEADERBOARD_ENTRIES - 1].time).toBe(MAX_LEADERBOARD_ENTRIES)
    })

    it('addToLeaderboard should return rank for new entry', () => {
      addToLeaderboard(DIFFICULTY.BEGINNER, 100, storage)
      const result = addToLeaderboard(DIFFICULTY.BEGINNER, 50, storage)
      expect(result.rank).toBe(1)
    })

    it('addToLeaderboard should not add custom difficulty entries', () => {
      const result = addToLeaderboard(DIFFICULTY.CUSTOM, 50, storage)
      expect(result.rank).toBe(-1)
      const loaded = loadLeaderboard(storage)
      expect(loaded.custom).toEqual([])
    })

    it('loadLeaderboard should handle invalid data gracefully', () => {
      storage.setItem('minesweeper_leaderboard', 'not-json')
      expect(() => loadLeaderboard(storage)).not.toThrow()
      const result = loadLeaderboard(storage)
      expect(result).toEqual({ beginner: [], intermediate: [], expert: [], custom: [] })
    })

    it('should not throw when storage is null', () => {
      expect(() => loadLeaderboard(null)).not.toThrow()
      expect(() => saveLeaderboard({}, null)).not.toThrow()
    })
  })

  describe('validateCustomConfig', () => {
    it('should accept valid beginner-like config', () => {
      const result = validateCustomConfig(9, 9, 10)
      expect(result.valid).toBe(true)
    })

    it('should reject rows too small', () => {
      const result = validateCustomConfig(4, 10, 10)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('行数')
    })

    it('should reject rows too large', () => {
      const result = validateCustomConfig(51, 10, 10)
      expect(result.valid).toBe(false)
    })

    it('should reject cols too small', () => {
      const result = validateCustomConfig(10, 4, 10)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('列数')
    })

    it('should reject cols too large', () => {
      const result = validateCustomConfig(10, 51, 10)
      expect(result.valid).toBe(false)
    })

    it('should reject zero mines', () => {
      const result = validateCustomConfig(10, 10, 0)
      expect(result.valid).toBe(false)
    })

    it('should reject mines exceeding half of total cells', () => {
      const result = validateCustomConfig(10, 10, 50)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('雷数需小于总格数的一半')
    })

    it('should accept mines just under the limit', () => {
      const result = validateCustomConfig(10, 10, 49)
      expect(result.valid).toBe(true)
      const result2 = validateCustomConfig(10, 10, 50)
      expect(result2.valid).toBe(false)
      const result3 = validateCustomConfig(10, 10, 40)
      expect(result3.valid).toBe(true)
    })
  })
})
