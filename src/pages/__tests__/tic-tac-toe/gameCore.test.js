import { describe, it, expect, beforeEach } from 'vitest'
import { WIN_LENGTHS, GAME_MODE, PLAYERS, HISTORY_STORAGE_KEY } from '@/pages/tic-tac-toe/constants.js'
import {
  getWinLength,
  createEmptyBoard,
  getEmptyPositions,
  checkWinner,
  isDraw,
  getGameStatus,
  findWinningMove,
  countThreats,
  evaluatePosition,
  getAIMove,
  loadHistory,
  saveHistory,
  addGameResult,
  clearHistory,
  formatDate,
} from '@/pages/tic-tac-toe/gameCore.js'

function createMockStorage() {
  const store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
    _store: store,
  }
}

describe('tic-tac-toe gameCore', () => {
  describe('getWinLength', () => {
    it('should return 3 for board size 3', () => {
      expect(getWinLength(3)).toBe(3)
    })
    it('should return 4 for board size 4', () => {
      expect(getWinLength(4)).toBe(4)
    })
    it('should return 4 for board size 5', () => {
      expect(getWinLength(5)).toBe(4)
    })
    it('should return 3 as default for unknown size', () => {
      expect(getWinLength(7)).toBe(3)
    })
  })

  describe('createEmptyBoard', () => {
    it('should create 3x3 board filled with null', () => {
      const board = createEmptyBoard(3)
      expect(board.length).toBe(3)
      board.forEach(row => {
        expect(row.length).toBe(3)
        row.forEach(cell => expect(cell).toBeNull())
      })
    })
    it('should create 5x5 board filled with null', () => {
      const board = createEmptyBoard(5)
      expect(board.length).toBe(5)
      board.forEach(row => expect(row.length).toBe(5))
    })
  })

  describe('getEmptyPositions', () => {
    it('should return all positions for empty board', () => {
      const board = createEmptyBoard(3)
      const empty = getEmptyPositions(board, 3)
      expect(empty.length).toBe(9)
    })
    it('should exclude occupied positions', () => {
      const board = createEmptyBoard(3)
      board[0][0] = PLAYERS.X
      board[1][1] = PLAYERS.O
      const empty = getEmptyPositions(board, 3)
      expect(empty.length).toBe(7)
      expect(empty.some(p => p.row === 0 && p.col === 0)).toBe(false)
      expect(empty.some(p => p.row === 1 && p.col === 1)).toBe(false)
    })
    it('should return empty array for full board', () => {
      const board = [
        [PLAYERS.X, PLAYERS.O, PLAYERS.X],
        [PLAYERS.O, PLAYERS.X, PLAYERS.O],
        [PLAYERS.O, PLAYERS.X, PLAYERS.O],
      ]
      expect(getEmptyPositions(board, 3).length).toBe(0)
    })
  })

  describe('checkWinner', () => {
    it('should detect horizontal win on 3x3', () => {
      const board = [
        [PLAYERS.X, PLAYERS.X, PLAYERS.X],
        [PLAYERS.O, null, PLAYERS.O],
        [null, null, null],
      ]
      const result = checkWinner(board, 3)
      expect(result).not.toBeNull()
      expect(result.winner).toBe(PLAYERS.X)
      expect(result.line).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ])
    })

    it('should detect vertical win on 3x3', () => {
      const board = [
        [PLAYERS.O, PLAYERS.X, null],
        [PLAYERS.O, PLAYERS.X, null],
        [PLAYERS.O, null, null],
      ]
      const result = checkWinner(board, 3)
      expect(result.winner).toBe(PLAYERS.O)
    })

    it('should detect diagonal win (top-left to bottom-right) on 3x3', () => {
      const board = [
        [PLAYERS.X, PLAYERS.O, null],
        [null, PLAYERS.X, PLAYERS.O],
        [null, null, PLAYERS.X],
      ]
      const result = checkWinner(board, 3)
      expect(result.winner).toBe(PLAYERS.X)
    })

    it('should detect diagonal win (top-right to bottom-left) on 3x3', () => {
      const board = [
        [null, PLAYERS.O, PLAYERS.X],
        [null, PLAYERS.X, PLAYERS.O],
        [PLAYERS.X, null, null],
      ]
      const result = checkWinner(board, 3)
      expect(result.winner).toBe(PLAYERS.X)
    })

    it('should return null when no winner', () => {
      const board = [
        [PLAYERS.X, PLAYERS.O, PLAYERS.X],
        [PLAYERS.O, PLAYERS.X, PLAYERS.O],
        [PLAYERS.O, PLAYERS.X, PLAYERS.O],
      ]
      expect(checkWinner(board, 3)).toBeNull()
    })

    it('should return null for empty board', () => {
      const board = createEmptyBoard(3)
      expect(checkWinner(board, 3)).toBeNull()
    })

    it('should detect win on 4x4 board with 4 in a row', () => {
      const board = createEmptyBoard(4)
      board[1][0] = PLAYERS.O
      board[1][1] = PLAYERS.O
      board[1][2] = PLAYERS.O
      board[1][3] = PLAYERS.O
      const result = checkWinner(board, 4)
      expect(result.winner).toBe(PLAYERS.O)
      expect(result.line.length).toBe(4)
    })

    it('should not declare winner with 3 in a row on 4x4 board', () => {
      const board = createEmptyBoard(4)
      board[0][0] = PLAYERS.X
      board[0][1] = PLAYERS.X
      board[0][2] = PLAYERS.X
      expect(checkWinner(board, 4)).toBeNull()
    })

    it('should detect diagonal win on 5x5 board', () => {
      const board = createEmptyBoard(5)
      board[0][0] = PLAYERS.X
      board[1][1] = PLAYERS.X
      board[2][2] = PLAYERS.X
      board[3][3] = PLAYERS.X
      const result = checkWinner(board, 5)
      expect(result.winner).toBe(PLAYERS.X)
      expect(result.line.length).toBe(4)
    })

    it('should detect win on anti-diagonal for 5x5', () => {
      const board = createEmptyBoard(5)
      board[0][4] = PLAYERS.O
      board[1][3] = PLAYERS.O
      board[2][2] = PLAYERS.O
      board[3][1] = PLAYERS.O
      const result = checkWinner(board, 5)
      expect(result.winner).toBe(PLAYERS.O)
    })

    it('3 in a row on 5x5 should not win (need 4)', () => {
      const board = createEmptyBoard(5)
      board[0][0] = PLAYERS.X
      board[0][1] = PLAYERS.X
      board[0][2] = PLAYERS.X
      expect(checkWinner(board, 5)).toBeNull()
    })
  })

  describe('isDraw', () => {
    it('should return false when board has empty cells and no winner', () => {
      const board = createEmptyBoard(3)
      expect(isDraw(board, 3)).toBe(false)
    })

    it('should return true when board is full with no winner', () => {
      const board = [
        [PLAYERS.X, PLAYERS.O, PLAYERS.X],
        [PLAYERS.O, PLAYERS.X, PLAYERS.O],
        [PLAYERS.O, PLAYERS.X, PLAYERS.O],
      ]
      expect(isDraw(board, 3)).toBe(true)
    })

    it('should return false when there is a winner even if board is full', () => {
      const board = [
        [PLAYERS.X, PLAYERS.X, PLAYERS.X],
        [PLAYERS.O, PLAYERS.O, null],
        [PLAYERS.O, null, null],
      ]
      expect(isDraw(board, 3)).toBe(false)
    })

    it('should return false for partially filled board', () => {
      const board = [
        [PLAYERS.X, null, null],
        [null, PLAYERS.O, null],
        [null, null, PLAYERS.X],
      ]
      expect(isDraw(board, 3)).toBe(false)
    })
  })

  describe('getGameStatus', () => {
    it('should return game over with winner', () => {
      const board = [
        [PLAYERS.X, PLAYERS.X, PLAYERS.X],
        [null, null, null],
        [null, null, null],
      ]
      const status = getGameStatus(board, 3)
      expect(status.over).toBe(true)
      expect(status.winner).toBe(PLAYERS.X)
      expect(status.line).toBeDefined()
    })

    it('should return draw', () => {
      const board = [
        [PLAYERS.X, PLAYERS.O, PLAYERS.X],
        [PLAYERS.O, PLAYERS.X, PLAYERS.O],
        [PLAYERS.O, PLAYERS.X, PLAYERS.O],
      ]
      const status = getGameStatus(board, 3)
      expect(status.over).toBe(true)
      expect(status.winner).toBe('draw')
      expect(status.line).toBeNull()
    })

    it('should return game not over', () => {
      const board = createEmptyBoard(3)
      const status = getGameStatus(board, 3)
      expect(status.over).toBe(false)
      expect(status.winner).toBeNull()
    })
  })

  describe('findWinningMove', () => {
    it('should find winning move for X on 3x3', () => {
      const board = [
        [PLAYERS.X, PLAYERS.X, null],
        [PLAYERS.O, PLAYERS.O, null],
        [null, null, null],
      ]
      const move = findWinningMove(board, 3, PLAYERS.X)
      expect(move).toEqual({ row: 0, col: 2 })
    })

    it('should find winning move for O on 3x3', () => {
      const board = [
        [PLAYERS.X, null, null],
        [PLAYERS.O, PLAYERS.O, null],
        [PLAYERS.X, null, null],
      ]
      const move = findWinningMove(board, 3, PLAYERS.O)
      expect(move).toEqual({ row: 1, col: 2 })
    })

    it('should return null when no winning move exists', () => {
      const board = createEmptyBoard(3)
      expect(findWinningMove(board, 3, PLAYERS.X)).toBeNull()
    })

    it('should find winning move on 4x4', () => {
      const board = createEmptyBoard(4)
      board[0][0] = PLAYERS.X
      board[0][1] = PLAYERS.X
      board[0][2] = PLAYERS.X
      const move = findWinningMove(board, 4, PLAYERS.X)
      expect(move).toEqual({ row: 0, col: 3 })
    })

    it('should find vertical winning move', () => {
      const board = createEmptyBoard(3)
      board[0][1] = PLAYERS.O
      board[1][1] = PLAYERS.O
      const move = findWinningMove(board, 3, PLAYERS.O)
      expect(move).toEqual({ row: 2, col: 1 })
    })

    it('should find diagonal winning move', () => {
      const board = createEmptyBoard(3)
      board[0][0] = PLAYERS.X
      board[1][1] = PLAYERS.X
      const move = findWinningMove(board, 3, PLAYERS.X)
      expect(move).toEqual({ row: 2, col: 2 })
    })
  })

  describe('countThreats', () => {
    it('should count one threat for X with 2 in a row on 3x3', () => {
      const board = createEmptyBoard(3)
      board[0][0] = PLAYERS.X
      board[0][1] = PLAYERS.X
      expect(countThreats(board, 3, PLAYERS.X)).toBe(1)
    })

    it('should count threats for both players independently', () => {
      const board = createEmptyBoard(3)
      board[0][0] = PLAYERS.X
      board[0][1] = PLAYERS.X
      board[1][0] = PLAYERS.O
      board[1][1] = PLAYERS.O
      expect(countThreats(board, 3, PLAYERS.X)).toBe(1)
      expect(countThreats(board, 3, PLAYERS.O)).toBe(1)
    })

    it('should return 0 for no threats', () => {
      const board = createEmptyBoard(3)
      expect(countThreats(board, 3, PLAYERS.X)).toBe(0)
    })

    it('should not count blocked lines as threats', () => {
      const board = createEmptyBoard(3)
      board[0][0] = PLAYERS.X
      board[0][1] = PLAYERS.X
      board[0][2] = PLAYERS.O
      expect(countThreats(board, 3, PLAYERS.X)).toBe(0)
    })

    it('should count diagonal threats on 4x4', () => {
      const board = createEmptyBoard(4)
      board[0][0] = PLAYERS.X
      board[1][1] = PLAYERS.X
      board[2][2] = PLAYERS.X
      expect(countThreats(board, 4, PLAYERS.X)).toBe(1)
    })
  })

  describe('evaluatePosition', () => {
    it('should give highest score to center', () => {
      const centerScore = evaluatePosition(1, 1, 3)
      expect(centerScore).toBe(10)
    })

    it('should give corner score of 5', () => {
      expect(evaluatePosition(0, 0, 3)).toBe(5)
      expect(evaluatePosition(0, 2, 3)).toBe(5)
      expect(evaluatePosition(2, 0, 3)).toBe(5)
      expect(evaluatePosition(2, 2, 3)).toBe(5)
    })

    it('should give edge score less than center and corner', () => {
      const edgeScore = evaluatePosition(0, 1, 3)
      expect(edgeScore).toBeLessThan(10)
      expect(edgeScore).toBeLessThan(5)
    })

    it('should give center of 5x5 highest score', () => {
      const centerScore = evaluatePosition(2, 2, 5)
      expect(centerScore).toBe(10)
    })
  })

  describe('getAIMove', () => {
    it('should take winning move on 3x3', () => {
      const board = createEmptyBoard(3)
      board[0][0] = PLAYERS.O
      board[0][1] = PLAYERS.O
      const move = getAIMove(board, 3, PLAYERS.O, PLAYERS.X)
      expect(move).toEqual({ row: 0, col: 2 })
    })

    it('should block opponent winning move on 3x3', () => {
      const board = createEmptyBoard(3)
      board[0][0] = PLAYERS.X
      board[0][1] = PLAYERS.X
      board[1][0] = PLAYERS.O
      const move = getAIMove(board, 3, PLAYERS.O, PLAYERS.X)
      expect(move).toEqual({ row: 0, col: 2 })
    })

    it('should prioritize winning over blocking', () => {
      const board = createEmptyBoard(3)
      board[0][0] = PLAYERS.O
      board[0][1] = PLAYERS.O
      board[1][0] = PLAYERS.X
      board[1][1] = PLAYERS.X
      const move = getAIMove(board, 3, PLAYERS.O, PLAYERS.X)
      expect(move).toEqual({ row: 0, col: 2 })
    })

    it('should return a valid move for empty 3x3 board', () => {
      const board = createEmptyBoard(3)
      const move = getAIMove(board, 3, PLAYERS.O, PLAYERS.X)
      expect(move).not.toBeNull()
      expect(move.row).toBeGreaterThanOrEqual(0)
      expect(move.row).toBeLessThan(3)
      expect(move.col).toBeGreaterThanOrEqual(0)
      expect(move.col).toBeLessThan(3)
    })

    it('should return null for full board', () => {
      const board = [
        [PLAYERS.X, PLAYERS.O, PLAYERS.X],
        [PLAYERS.O, PLAYERS.X, PLAYERS.O],
        [PLAYERS.O, PLAYERS.X, PLAYERS.O],
      ]
      expect(getAIMove(board, 3, PLAYERS.O, PLAYERS.X)).toBeNull()
    })

    it('should take winning move on 4x4 board', () => {
      const board = createEmptyBoard(4)
      board[0][0] = PLAYERS.O
      board[0][1] = PLAYERS.O
      board[0][2] = PLAYERS.O
      const move = getAIMove(board, 4, PLAYERS.O, PLAYERS.X)
      expect(move).toEqual({ row: 0, col: 3 })
    })

    it('should block opponent on 4x4 board', () => {
      const board = createEmptyBoard(4)
      board[1][0] = PLAYERS.X
      board[1][1] = PLAYERS.X
      board[1][2] = PLAYERS.X
      board[0][0] = PLAYERS.O
      const move = getAIMove(board, 4, PLAYERS.O, PLAYERS.X)
      expect(move).toEqual({ row: 1, col: 3 })
    })

    it('should take winning move on 5x5 board', () => {
      const board = createEmptyBoard(5)
      board[2][0] = PLAYERS.O
      board[2][1] = PLAYERS.O
      board[2][2] = PLAYERS.O
      const move = getAIMove(board, 5, PLAYERS.O, PLAYERS.X)
      expect(move).toEqual({ row: 2, col: 3 })
    })

    it('AI should not lose immediately in 3x3 as O (play 100 games)', () => {
      for (let game = 0; game < 100; game++) {
        const board = createEmptyBoard(3)
        let current = PLAYERS.X
        let moves = 0
        while (moves < 9) {
          if (current === PLAYERS.X) {
            const empty = getEmptyPositions(board, 3)
            const randomMove = empty[Math.floor(Math.random() * empty.length)]
            board[randomMove.row][randomMove.col] = PLAYERS.X
          } else {
            const aiMove = getAIMove(board, 3, PLAYERS.O, PLAYERS.X)
            if (!aiMove) break
            board[aiMove.row][aiMove.col] = PLAYERS.O
          }
          moves++
          const status = getGameStatus(board, 3)
          if (status.over) {
            expect(status.winner).not.toBe(PLAYERS.X)
            break
          }
          current = current === PLAYERS.X ? PLAYERS.O : PLAYERS.X
        }
      }
    })

    it('should return a move on an empty cell', () => {
      const board = createEmptyBoard(4)
      board[0][0] = PLAYERS.X
      board[1][1] = PLAYERS.O
      const move = getAIMove(board, 4, PLAYERS.O, PLAYERS.X)
      expect(board[move.row][move.col]).toBeNull()
    })
  })

  describe('localStorage persistence', () => {
    let storage

    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadHistory should return empty array when storage empty', () => {
      expect(loadHistory(storage)).toEqual([])
    })

    it('saveHistory and loadHistory should round-trip correctly', () => {
      const history = [
        { date: '2024-01-01T00:00:00.000Z', boardSize: 3, mode: 'pve', result: 'X', totalMoves: 7 },
      ]
      saveHistory(history, storage)
      expect(loadHistory(storage)).toEqual(history)
    })

    it('loadHistory should return empty array for invalid JSON', () => {
      storage.setItem(HISTORY_STORAGE_KEY, 'invalid json')
      expect(loadHistory(storage)).toEqual([])
    })

    it('addGameResult should add entry at the beginning', () => {
      addGameResult({ boardSize: 3, mode: GAME_MODE.PVE, result: PLAYERS.X, totalMoves: 7 }, storage)
      addGameResult({ boardSize: 4, mode: GAME_MODE.PVP, result: 'draw', totalMoves: 16 }, storage)
      const history = loadHistory(storage)
      expect(history.length).toBe(2)
      expect(history[0].boardSize).toBe(4)
      expect(history[1].boardSize).toBe(3)
    })

    it('addGameResult should include date and all fields', () => {
      addGameResult({ boardSize: 3, mode: GAME_MODE.PVE, result: PLAYERS.O, totalMoves: 8 }, storage)
      const history = loadHistory(storage)
      expect(history[0].date).toBeDefined()
      expect(history[0].boardSize).toBe(3)
      expect(history[0].mode).toBe(GAME_MODE.PVE)
      expect(history[0].result).toBe(PLAYERS.O)
      expect(history[0].totalMoves).toBe(8)
    })

    it('clearHistory should remove all entries', () => {
      addGameResult({ boardSize: 3, mode: GAME_MODE.PVE, result: PLAYERS.X, totalMoves: 5 }, storage)
      addGameResult({ boardSize: 5, mode: GAME_MODE.PVP, result: 'draw', totalMoves: 25 }, storage)
      clearHistory(storage)
      expect(loadHistory(storage)).toEqual([])
    })

    it('should not throw when storage is null', () => {
      expect(() => loadHistory(null)).not.toThrow()
      expect(() => saveHistory([], null)).not.toThrow()
      expect(() => addGameResult({ boardSize: 3, mode: GAME_MODE.PVE, result: 'X', totalMoves: 5 }, null)).not.toThrow()
      expect(() => clearHistory(null)).not.toThrow()
    })

    it('loadHistory should return empty array for non-array JSON', () => {
      storage.setItem(HISTORY_STORAGE_KEY, '"not an array"')
      expect(loadHistory(storage)).toEqual([])
    })
  })

  describe('formatDate', () => {
    it('should format ISO date string with time', () => {
      const isoString = '2024-06-15T14:30:00.000Z'
      const formatted = formatDate(isoString)
      expect(formatted).toContain('2024')
      expect(formatted).toContain('06')
      expect(formatted).toContain('15')
    })

    it('should pad single digit months and days', () => {
      const isoString = '2024-01-05T00:00:00.000Z'
      const formatted = formatDate(isoString)
      expect(formatted).toContain('2024-01-05')
    })
  })

  describe('WIN_LENGTHS constants', () => {
    it('should define correct win lengths for all board sizes', () => {
      expect(WIN_LENGTHS[3]).toBe(3)
      expect(WIN_LENGTHS[4]).toBe(4)
      expect(WIN_LENGTHS[5]).toBe(4)
    })
  })

  describe('checkWinner - edge cases on larger boards', () => {
    it('should detect win starting from non-zero position on 5x5', () => {
      const board = createEmptyBoard(5)
      board[2][1] = PLAYERS.X
      board[2][2] = PLAYERS.X
      board[2][3] = PLAYERS.X
      board[2][4] = PLAYERS.X
      const result = checkWinner(board, 5)
      expect(result.winner).toBe(PLAYERS.X)
    })

    it('should detect vertical win on 5x5', () => {
      const board = createEmptyBoard(5)
      board[0][3] = PLAYERS.O
      board[1][3] = PLAYERS.O
      board[2][3] = PLAYERS.O
      board[3][3] = PLAYERS.O
      const result = checkWinner(board, 5)
      expect(result.winner).toBe(PLAYERS.O)
    })

    it('should not detect 3 in a row as win on 4x4', () => {
      const board = createEmptyBoard(4)
      board[0][0] = PLAYERS.X
      board[1][0] = PLAYERS.X
      board[2][0] = PLAYERS.X
      expect(checkWinner(board, 4)).toBeNull()
    })
  })

  describe('findWinningMove - additional scenarios', () => {
    it('should find winning move in center column on 4x4', () => {
      const board = createEmptyBoard(4)
      board[0][2] = PLAYERS.X
      board[1][2] = PLAYERS.X
      board[2][2] = PLAYERS.X
      const move = findWinningMove(board, 4, PLAYERS.X)
      expect(move).toEqual({ row: 3, col: 2 })
    })

    it('should find diagonal winning move on 4x4', () => {
      const board = createEmptyBoard(4)
      board[0][0] = PLAYERS.O
      board[1][1] = PLAYERS.O
      board[2][2] = PLAYERS.O
      const move = findWinningMove(board, 4, PLAYERS.O)
      expect(move).toEqual({ row: 3, col: 3 })
    })

    it('should return null when all remaining moves do not win', () => {
      const board = [
        [PLAYERS.X, PLAYERS.O, PLAYERS.X],
        [PLAYERS.O, PLAYERS.X, PLAYERS.O],
        [PLAYERS.O, PLAYERS.X, null],
      ]
      expect(findWinningMove(board, 3, PLAYERS.O)).toBeNull()
    })
  })

  describe('isDraw - larger boards', () => {
    it('should return false for partially filled 4x4', () => {
      const board = createEmptyBoard(4)
      board[0][0] = PLAYERS.X
      expect(isDraw(board, 4)).toBe(false)
    })

    it('should return true for full 4x4 with no winner', () => {
      const board = [
        [PLAYERS.X, PLAYERS.O, PLAYERS.X, PLAYERS.O],
        [PLAYERS.X, PLAYERS.O, PLAYERS.X, PLAYERS.O],
        [PLAYERS.O, PLAYERS.X, PLAYERS.O, PLAYERS.X],
        [PLAYERS.O, PLAYERS.X, PLAYERS.O, PLAYERS.X],
      ]
      expect(isDraw(board, 4)).toBe(true)
    })
  })

  describe('countThreats - additional scenarios', () => {
    it('should count multiple threats for same player', () => {
      const board = createEmptyBoard(3)
      board[0][0] = PLAYERS.X
      board[0][1] = PLAYERS.X
      board[1][0] = PLAYERS.X
      board[1][1] = null
      const threats = countThreats(board, 3, PLAYERS.X)
      expect(threats).toBeGreaterThanOrEqual(2)
    })

    it('should not count lines with both players as threats', () => {
      const board = createEmptyBoard(3)
      board[0][0] = PLAYERS.X
      board[0][1] = PLAYERS.O
      expect(countThreats(board, 3, PLAYERS.X)).toBe(0)
      expect(countThreats(board, 3, PLAYERS.O)).toBe(0)
    })
  })

  describe('addGameResult - multiple results', () => {
    let storage

    beforeEach(() => {
      storage = createMockStorage()
    })

    it('should maintain reverse chronological order', () => {
      addGameResult({ boardSize: 3, mode: GAME_MODE.PVE, result: PLAYERS.X, totalMoves: 5 }, storage)
      addGameResult({ boardSize: 4, mode: GAME_MODE.PVP, result: 'draw', totalMoves: 16 }, storage)
      addGameResult({ boardSize: 5, mode: GAME_MODE.PVE, result: PLAYERS.O, totalMoves: 20 }, storage)
      const history = loadHistory(storage)
      expect(history[0].boardSize).toBe(5)
      expect(history[1].boardSize).toBe(4)
      expect(history[2].boardSize).toBe(3)
    })

    it('should persist across multiple save/load cycles', () => {
      addGameResult({ boardSize: 3, mode: GAME_MODE.PVE, result: PLAYERS.X, totalMoves: 7 }, storage)
      const h1 = loadHistory(storage)
      expect(h1.length).toBe(1)
      addGameResult({ boardSize: 3, mode: GAME_MODE.PVE, result: 'draw', totalMoves: 9 }, storage)
      const h2 = loadHistory(storage)
      expect(h2.length).toBe(2)
    })
  })
})
