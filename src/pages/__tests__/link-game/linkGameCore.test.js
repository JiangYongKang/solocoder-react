import { describe, it, expect, beforeEach } from 'vitest'
import {
  DIFFICULTY,
  DIFFICULTY_CONFIG,
  ICONS,
  BORDER_PADDING,
  MAX_SHUFFLES,
  BASE_SCORE,
  TIME_PENALTY_PER_SECOND,
  STEP_PENALTY,
  BONUS_UNUSED_HINT,
  BONUS_UNUSED_SHUFFLE,
} from '@/pages/link-game/constants.js'
import {
  createGrid,
  findPath,
  canConnect,
  eliminatePair,
  isGameComplete,
  findHintPair,
  hasAnyValidPair,
  shuffleRemainingIcons,
  formatTime,
  calculateScore,
  loadLeaderboard,
  saveLeaderboard,
  addToLeaderboard,
  formatDate,
} from '@/pages/link-game/linkGameCore.js'

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

function createSimpleGrid(rows, cols, innerSetup) {
  const fullRows = rows + BORDER_PADDING * 2
  const fullCols = cols + BORDER_PADDING * 2
  const grid = []
  for (let r = 0; r < fullRows; r++) {
    const row = []
    for (let c = 0; c < fullCols; c++) {
      row.push(null)
    }
    grid.push(row)
  }
  if (innerSetup) {
    for (const [r, c, val] of innerSetup) {
      grid[r + BORDER_PADDING][c + BORDER_PADDING] = val
    }
  }
  return grid
}

describe('linkGameCore', () => {
  describe('createGrid', () => {
    it('should create grid with correct dimensions including border padding', () => {
      const rows = 6
      const cols = 6
      const grid = createGrid(rows, cols)
      expect(grid.length).toBe(rows + BORDER_PADDING * 2)
      grid.forEach((row) => {
        expect(row.length).toBe(cols + BORDER_PADDING * 2)
      })
    })

    it('should have null values only in border padding cells', () => {
      const rows = 4
      const cols = 4
      const grid = createGrid(rows, cols)
      const fullRows = rows + BORDER_PADDING * 2
      const fullCols = cols + BORDER_PADDING * 2

      for (let r = 0; r < fullRows; r++) {
        for (let c = 0; c < fullCols; c++) {
          const isBorder =
            r < BORDER_PADDING ||
            r >= fullRows - BORDER_PADDING ||
            c < BORDER_PADDING ||
            c >= fullCols - BORDER_PADDING
          if (isBorder) {
            expect(grid[r][c]).toBeNull()
          } else {
            expect(grid[r][c]).not.toBeNull()
          }
        }
      }
    })

    it('should ensure each icon appears an even number of times', () => {
      const rows = 6
      const cols = 6
      const grid = createGrid(rows, cols)
      const counts = {}

      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
          const cell = grid[r][c]
          if (cell !== null) {
            counts[cell] = (counts[cell] || 0) + 1
          }
        }
      }

      Object.values(counts).forEach((count) => {
        expect(count % 2).toBe(0)
      })
    })

    it('should use correct number of unique icons', () => {
      const rows = 4
      const cols = 4
      const grid = createGrid(rows, cols)
      const unique = new Set()
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
          if (grid[r][c] !== null) unique.add(grid[r][c])
        }
      }
      expect(unique.size).toBeGreaterThan(0)
      expect(unique.size).toBeLessThanOrEqual(ICONS.length)
    })

    it('should work with custom icons', () => {
      const customIcons = ['A', 'B']
      const rows = 4
      const cols = 4
      const grid = createGrid(rows, cols, customIcons)
      const unique = new Set()
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
          if (grid[r][c] !== null) unique.add(grid[r][c])
        }
      }
      expect(unique.size).toBeLessThanOrEqual(customIcons.length)
    })
  })

  describe('shuffleRemainingIcons', () => {
    it('should not change the count of each icon', () => {
      const grid = createGrid(6, 6)
      const countsBefore = {}
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
          const cell = grid[r][c]
          if (cell !== null) {
            countsBefore[cell] = (countsBefore[cell] || 0) + 1
          }
        }
      }

      const shuffled = shuffleRemainingIcons(grid)
      const countsAfter = {}
      for (let r = 0; r < shuffled.length; r++) {
        for (let c = 0; c < shuffled[0].length; c++) {
          const cell = shuffled[r][c]
          if (cell !== null) {
            countsAfter[cell] = (countsAfter[cell] || 0) + 1
          }
        }
      }

      expect(countsAfter).toEqual(countsBefore)
    })

    it('should keep null cells at the same positions', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [0, 1, 'A'],
      ])
      grid[BORDER_PADDING + 1][BORDER_PADDING + 0] = null

      const shuffled = shuffleRemainingIcons(grid)
      expect(shuffled[BORDER_PADDING + 1][BORDER_PADDING + 0]).toBeNull()
    })
  })

  describe('findPath', () => {
    it('should return null for same cell', () => {
      const grid = createSimpleGrid(4, 4, [[0, 0, 'A']])
      const r = BORDER_PADDING + 0
      const c = BORDER_PADDING + 0
      expect(findPath(grid, r, c, r, c, 2)).toBeNull()
    })

    it('should return null for different icons', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [0, 1, 'B'],
      ])
      const r1 = BORDER_PADDING + 0
      const c1 = BORDER_PADDING + 0
      const r2 = BORDER_PADDING + 0
      const c2 = BORDER_PADDING + 1
      expect(findPath(grid, r1, c1, r2, c2, 2)).toBeNull()
    })

    it('should return null when either cell is empty', () => {
      const grid = createSimpleGrid(4, 4, [[0, 0, 'A']])
      const r1 = BORDER_PADDING + 0
      const c1 = BORDER_PADDING + 0
      const r2 = BORDER_PADDING + 0
      const c2 = BORDER_PADDING + 1
      expect(findPath(grid, r1, c1, r2, c2, 2)).toBeNull()
    })

    it('should find straight horizontal path (0 turns)', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [0, 3, 'A'],
      ])
      const r1 = BORDER_PADDING + 0
      const c1 = BORDER_PADDING + 0
      const r2 = BORDER_PADDING + 0
      const c2 = BORDER_PADDING + 3
      const path = findPath(grid, r1, c1, r2, c2, 2)
      expect(path).not.toBeNull()
      expect(path[0]).toEqual([r1, c1])
      expect(path[path.length - 1]).toEqual([r2, c2])
    })

    it('should find straight vertical path (0 turns)', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [3, 0, 'A'],
      ])
      const r1 = BORDER_PADDING + 0
      const c1 = BORDER_PADDING + 0
      const r2 = BORDER_PADDING + 3
      const c2 = BORDER_PADDING + 0
      const path = findPath(grid, r1, c1, r2, c2, 2)
      expect(path).not.toBeNull()
    })

    it('should find path with 1 turn (L-shape)', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [2, 2, 'A'],
      ])
      const r1 = BORDER_PADDING + 0
      const c1 = BORDER_PADDING + 0
      const r2 = BORDER_PADDING + 2
      const c2 = BORDER_PADDING + 2
      const path = findPath(grid, r1, c1, r2, c2, 2)
      expect(path).not.toBeNull()
    })

    it('should find path with 2 turns', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [3, 3, 'A'],
      ])
      const r1 = BORDER_PADDING + 0
      const c1 = BORDER_PADDING + 0
      const r2 = BORDER_PADDING + 3
      const c2 = BORDER_PADDING + 3
      const path = findPath(grid, r1, c1, r2, c2, 2)
      expect(path).not.toBeNull()
    })

    it('should respect maxTurns parameter - 0 turns only allows straight line', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [2, 2, 'A'],
      ])
      const r1 = BORDER_PADDING + 0
      const c1 = BORDER_PADDING + 0
      const r2 = BORDER_PADDING + 2
      const c2 = BORDER_PADDING + 2
      expect(findPath(grid, r1, c1, r2, c2, 0)).toBeNull()
    })

    it('should respect maxTurns parameter - 1 turn allows L-shape but not Z-shape', () => {
      const grid = []
      for (let r = 0; r < 6; r++) {
        const row = []
        for (let c = 0; c < 6; c++) {
          row.push(null)
        }
        grid.push(row)
      }
      grid[0][0] = 'A'
      grid[5][5] = 'A'
      for (let i = 0; i < 6; i++) {
        if (i !== 0) grid[0][i] = 'B'
        if (i !== 5) grid[5][i] = 'B'
        if (i !== 0) grid[i][0] = 'B'
        if (i !== 5) grid[i][5] = 'B'
      }
      expect(findPath(grid, 0, 0, 5, 5, 1)).toBeNull()
    })

    it('should find path going through outer border', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [3, 0, 'A'],
        [1, 0, 'B'],
        [2, 0, 'B'],
      ])
      const r1 = BORDER_PADDING + 0
      const c1 = BORDER_PADDING + 0
      const r2 = BORDER_PADDING + 3
      const c2 = BORDER_PADDING + 0
      const path = findPath(grid, r1, c1, r2, c2, 2)
      expect(path).not.toBeNull()
    })
  })

  describe('canConnect', () => {
    it('should return true when path exists', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [0, 3, 'A'],
      ])
      const r1 = BORDER_PADDING + 0
      const c1 = BORDER_PADDING + 0
      const r2 = BORDER_PADDING + 0
      const c2 = BORDER_PADDING + 3
      expect(canConnect(grid, r1, c1, r2, c2)).toBe(true)
    })

    it('should return false when no path exists', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [3, 3, 'A'],
      ])
      grid[BORDER_PADDING + 0][BORDER_PADDING + 1] = 'B'
      grid[BORDER_PADDING + 1][BORDER_PADDING + 0] = 'B'
      grid[BORDER_PADDING + 0][BORDER_PADDING + 2] = 'B'
      grid[BORDER_PADDING + 2][BORDER_PADDING + 0] = 'B'
      grid[BORDER_PADDING + 1][BORDER_PADDING + 3] = 'B'
      grid[BORDER_PADDING + 3][BORDER_PADDING + 1] = 'B'
      grid[BORDER_PADDING + 2][BORDER_PADDING + 3] = 'B'
      grid[BORDER_PADDING + 3][BORDER_PADDING + 2] = 'B'
      const r1 = BORDER_PADDING + 0
      const c1 = BORDER_PADDING + 0
      const r2 = BORDER_PADDING + 3
      const c2 = BORDER_PADDING + 3
      expect(canConnect(grid, r1, c1, r2, c2)).toBe(false)
    })
  })

  describe('eliminatePair', () => {
    it('should set both cells to null', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [0, 1, 'A'],
      ])
      const r1 = BORDER_PADDING + 0
      const c1 = BORDER_PADDING + 0
      const r2 = BORDER_PADDING + 0
      const c2 = BORDER_PADDING + 1
      const result = eliminatePair(grid, r1, c1, r2, c2)
      expect(result[r1][c1]).toBeNull()
      expect(result[r2][c2]).toBeNull()
    })

    it('should not mutate original grid', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [0, 1, 'A'],
      ])
      const r1 = BORDER_PADDING + 0
      const c1 = BORDER_PADDING + 0
      const r2 = BORDER_PADDING + 0
      const c2 = BORDER_PADDING + 1
      const originalR1C1 = grid[r1][c1]
      const originalR2C2 = grid[r2][c2]
      eliminatePair(grid, r1, c1, r2, c2)
      expect(grid[r1][c1]).toBe(originalR1C1)
      expect(grid[r2][c2]).toBe(originalR2C2)
    })
  })

  describe('isGameComplete', () => {
    it('should return true when all cells are null', () => {
      const grid = createSimpleGrid(4, 4)
      expect(isGameComplete(grid)).toBe(true)
    })

    it('should return false when any cell is not null', () => {
      const grid = createSimpleGrid(4, 4, [[0, 0, 'A']])
      expect(isGameComplete(grid)).toBe(false)
    })
  })

  describe('findHintPair', () => {
    it('should find a valid connectable pair', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [0, 3, 'A'],
      ])
      const result = findHintPair(grid)
      expect(result).not.toBeNull()
      expect(result.pair).toHaveLength(2)
      expect(result.path).not.toBeNull()
    })

    it('should return null when no valid pairs exist', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [0, 1, 'B'],
      ])
      const result = findHintPair(grid)
      expect(result).toBeNull()
    })

    it('should return null when grid is empty', () => {
      const grid = createSimpleGrid(4, 4)
      expect(findHintPair(grid)).toBeNull()
    })
  })

  describe('hasAnyValidPair', () => {
    it('should return true when valid pair exists', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [0, 3, 'A'],
      ])
      expect(hasAnyValidPair(grid)).toBe(true)
    })

    it('should return false when no valid pairs', () => {
      const grid = createSimpleGrid(4, 4, [
        [0, 0, 'A'],
        [0, 1, 'B'],
      ])
      expect(hasAnyValidPair(grid)).toBe(false)
    })
  })

  describe('formatTime', () => {
    it('should format 0 seconds as 00:00', () => {
      expect(formatTime(0)).toBe('00:00')
    })

    it('should format seconds less than 60 with leading zero', () => {
      expect(formatTime(5)).toBe('00:05')
      expect(formatTime(59)).toBe('00:59')
    })

    it('should format minutes and seconds correctly', () => {
      expect(formatTime(60)).toBe('01:00')
      expect(formatTime(125)).toBe('02:05')
      expect(formatTime(3600)).toBe('60:00')
    })

    it('should pad minutes with leading zero', () => {
      expect(formatTime(60)).toBe('01:00')
      expect(formatTime(540)).toBe('09:00')
    })
  })

  describe('calculateScore', () => {
    it('should return at least 0', () => {
      const score = calculateScore({
        timeSeconds: 999999,
        steps: 999999,
        hintsUsed: 999,
        shufflesUsed: 999,
      })
      expect(score).toBe(0)
      expect(score).toBeGreaterThanOrEqual(0)
    })

    it('should subtract time penalty', () => {
      const baseScore = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 0,
        shufflesUsed: 0,
      })
      const penaltyScore = calculateScore({
        timeSeconds: 100,
        steps: 0,
        hintsUsed: 0,
        shufflesUsed: 0,
      })
      expect(baseScore - penaltyScore).toBe(100 * TIME_PENALTY_PER_SECOND)
    })

    it('should subtract step penalty', () => {
      const baseScore = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 0,
        shufflesUsed: 0,
      })
      const penaltyScore = calculateScore({
        timeSeconds: 0,
        steps: 10,
        hintsUsed: 0,
        shufflesUsed: 0,
      })
      expect(baseScore - penaltyScore).toBe(10 * STEP_PENALTY)
    })

    it('should give full hint bonus when hintsUsed is exactly 0', () => {
      const noBonus = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 1,
        shufflesUsed: MAX_SHUFFLES,
      })
      const withBonus = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 0,
        shufflesUsed: MAX_SHUFFLES,
      })
      expect(withBonus - noBonus).toBe(BONUS_UNUSED_HINT)
    })

    it('should give no hint bonus when hintsUsed is 1 or more', () => {
      const scoreWith1Hint = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 1,
        shufflesUsed: MAX_SHUFFLES,
      })
      const scoreWith2Hints = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 2,
        shufflesUsed: MAX_SHUFFLES,
      })
      const scoreWith5Hints = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 5,
        shufflesUsed: MAX_SHUFFLES,
      })
      expect(scoreWith1Hint).toBe(scoreWith2Hints)
      expect(scoreWith2Hints).toBe(scoreWith5Hints)
    })

    it('should give bonus for unused shuffles', () => {
      const noBonus = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 1,
        shufflesUsed: MAX_SHUFFLES,
      })
      const withBonus = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 1,
        shufflesUsed: 0,
      })
      expect(withBonus - noBonus).toBe(MAX_SHUFFLES * BONUS_UNUSED_SHUFFLE)
    })

    it('should give no shuffle bonus when shufflesUsed >= MAX_SHUFFLES', () => {
      const scoreAtMax = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 1,
        shufflesUsed: MAX_SHUFFLES,
      })
      const scoreAboveMax = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 1,
        shufflesUsed: MAX_SHUFFLES + 1,
      })
      const scoreFarAboveMax = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 1,
        shufflesUsed: MAX_SHUFFLES + 10,
      })
      expect(scoreAtMax).toBe(scoreAboveMax)
      expect(scoreAboveMax).toBe(scoreFarAboveMax)
    })

    it('should give partial shuffle bonus when some shuffles used', () => {
      const scoreFullBonus = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 1,
        shufflesUsed: 0,
      })
      const scoreOneUsed = calculateScore({
        timeSeconds: 0,
        steps: 0,
        hintsUsed: 1,
        shufflesUsed: 1,
      })
      expect(scoreFullBonus - scoreOneUsed).toBe(BONUS_UNUSED_SHUFFLE)
    })

    it('perfect game should have high score', () => {
      const score = calculateScore({
        timeSeconds: 10,
        steps: 32,
        hintsUsed: 0,
        shufflesUsed: 0,
      })
      expect(score).toBeGreaterThan(BASE_SCORE - 10 * 2 - 32 * 5 + BONUS_UNUSED_HINT + MAX_SHUFFLES * BONUS_UNUSED_SHUFFLE - 1)
    })

    it('should work without difficulty parameter', () => {
      expect(() =>
        calculateScore({
          timeSeconds: 60,
          steps: 10,
          hintsUsed: 0,
          shufflesUsed: 0,
        })
      ).not.toThrow()
      const score = calculateScore({
        timeSeconds: 60,
        steps: 10,
        hintsUsed: 0,
        shufflesUsed: 0,
      })
      expect(typeof score).toBe('number')
    })
  })

  describe('localStorage leaderboard', () => {
    let storage

    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadLeaderboard should return empty object when storage empty', () => {
      expect(loadLeaderboard(storage)).toEqual({})
    })

    it('saveLeaderboard and loadLeaderboard should round-trip correctly', () => {
      const data = {
        easy: [{ score: 100, timeSeconds: 60, steps: 10, date: '2024-01-01' }],
      }
      saveLeaderboard(data, storage)
      expect(loadLeaderboard(storage)).toEqual(data)
    })

    it('addToLeaderboard should add entry to correct difficulty', () => {
      const entry = {
        score: 500,
        difficulty: DIFFICULTY.EASY,
        timeSeconds: 30,
        steps: 5,
        date: '2024-01-01T00:00:00.000Z',
      }
      const { leaderboard, rank } = addToLeaderboard(entry, storage)
      expect(leaderboard[DIFFICULTY.EASY]).toHaveLength(1)
      expect(leaderboard[DIFFICULTY.EASY][0].score).toBe(500)
      expect(rank).toBe(1)
    })

    it('addToLeaderboard should sort entries by score descending', () => {
      addToLeaderboard(
        { score: 200, difficulty: DIFFICULTY.EASY, timeSeconds: 10, steps: 2, date: '2024-01-01' },
        storage
      )
      addToLeaderboard(
        { score: 500, difficulty: DIFFICULTY.EASY, timeSeconds: 5, steps: 1, date: '2024-01-02' },
        storage
      )
      addToLeaderboard(
        { score: 300, difficulty: DIFFICULTY.EASY, timeSeconds: 8, steps: 3, date: '2024-01-03' },
        storage
      )
      const leaderboard = loadLeaderboard(storage)
      const scores = leaderboard[DIFFICULTY.EASY].map((e) => e.score)
      expect(scores).toEqual([500, 300, 200])
    })

    it('addToLeaderboard should keep only top 10 entries', () => {
      for (let i = 0; i < 15; i++) {
        addToLeaderboard(
          {
            score: i * 10,
            difficulty: DIFFICULTY.EASY,
            timeSeconds: i,
            steps: i,
            date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          },
          storage
        )
      }
      const leaderboard = loadLeaderboard(storage)
      expect(leaderboard[DIFFICULTY.EASY]).toHaveLength(10)
      expect(leaderboard[DIFFICULTY.EASY][0].score).toBe(140)
    })

    it('should not throw when storage is null', () => {
      expect(() => loadLeaderboard(null)).not.toThrow()
      expect(() => saveLeaderboard({}, null)).not.toThrow()
      expect(() =>
        addToLeaderboard(
          { score: 100, difficulty: DIFFICULTY.EASY, timeSeconds: 1, steps: 1 },
          null
        )
      ).not.toThrow()
    })

    it('loadLeaderboard should return empty object for invalid JSON', () => {
      storage.setItem('link_game_leaderboard', 'invalid-json')
      expect(loadLeaderboard(storage)).toEqual({})
    })
  })

  describe('formatDate', () => {
    it('should format ISO date string as YYYY-MM-DD', () => {
      expect(formatDate('2024-06-15T12:00:00.000Z')).toBe('2024-06-15')
      expect(formatDate('2024-01-01T00:00:00.000Z')).toBe('2024-01-01')
    })

    it('should return original string for invalid date', () => {
      expect(formatDate('invalid')).toBe('invalid')
    })
  })
})
