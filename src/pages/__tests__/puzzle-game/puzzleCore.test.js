import { describe, it, expect, beforeEach } from 'vitest'
import {
  DIFFICULTIES,
  SCORE_CONFIG,
  MAX_LEADERBOARD_ENTRIES,
} from '@/pages/puzzle-game/constants.js'
import {
  calculateGridCoords,
  shufflePieces,
  isPieceCorrect,
  isPuzzleComplete,
  calculateScore,
  formatTime,
  countIncorrectAfterSwap,
  loadLeaderboard,
  saveLeaderboard,
  sortLeaderboard,
  addToLeaderboard,
  clearLeaderboard,
  getLeaderboardByDifficulty,
  paginateLeaderboard,
  getTotalPages,
} from '@/pages/puzzle-game/puzzleCore.js'

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

describe('puzzleCore', () => {
  describe('calculateGridCoords', () => {
    it('should return correct number of coords for 3x3 grid', () => {
      const coords = calculateGridCoords(3, 500)
      expect(coords).toHaveLength(9)
    })

    it('should return correct number of coords for 4x4 grid', () => {
      const coords = calculateGridCoords(4, 500)
      expect(coords).toHaveLength(16)
    })

    it('should return correct number of coords for 5x5 grid', () => {
      const coords = calculateGridCoords(5, 500)
      expect(coords).toHaveLength(25)
    })

    it('should calculate correct coordinates for 3x3 grid', () => {
      const coords = calculateGridCoords(3, 500)
      const pieceSize = 500 / 3
      expect(coords[0]).toEqual({
        row: 0, col: 0, x: 0, y: 0, width: pieceSize, height: pieceSize,
      })
      expect(coords[1]).toEqual({
        row: 0, col: 1, x: pieceSize, y: 0, width: pieceSize, height: pieceSize,
      })
      expect(coords[3]).toEqual({
        row: 1, col: 0, x: 0, y: pieceSize, width: pieceSize, height: pieceSize,
      })
      expect(coords[8]).toEqual({
        row: 2, col: 2, x: pieceSize * 2, y: pieceSize * 2, width: pieceSize, height: pieceSize,
      })
    })

    it('should calculate correct coordinates for 4x4 grid', () => {
      const coords = calculateGridCoords(4, 500)
      const pieceSize = 500 / 4
      expect(coords[0].x).toBe(0)
      expect(coords[0].y).toBe(0)
      expect(coords[5].x).toBe(pieceSize)
      expect(coords[5].y).toBe(pieceSize)
      expect(coords[15].x).toBeCloseTo(pieceSize * 3)
      expect(coords[15].y).toBeCloseTo(pieceSize * 3)
    })

    it('should have all pieces with equal width and height', () => {
      const coords = calculateGridCoords(5, 500)
      const pieceSize = 500 / 5
      coords.forEach((c) => {
        expect(c.width).toBeCloseTo(pieceSize)
        expect(c.height).toBeCloseTo(pieceSize)
      })
    })

    it('should cover entire canvas without gaps', () => {
      const coords = calculateGridCoords(3, 500)
      const last = coords[coords.length - 1]
      expect(last.x + last.width).toBeCloseTo(500)
      expect(last.y + last.height).toBeCloseTo(500)
    })

    it('should work with different canvas sizes', () => {
      const coords = calculateGridCoords(3, 600)
      const pieceSize = 600 / 3
      expect(coords).toHaveLength(9)
      expect(coords[0].width).toBe(pieceSize)
      expect(coords[4].x).toBe(pieceSize)
      expect(coords[4].y).toBe(pieceSize)
    })
  })

  describe('shufflePieces', () => {
    it('should return array of same length as input', () => {
      expect(shufflePieces(9)).toHaveLength(9)
      expect(shufflePieces(16)).toHaveLength(16)
      expect(shufflePieces(25)).toHaveLength(25)
    })

    it('should contain all indices from 0 to n-1', () => {
      const result = shufflePieces(9)
      const sorted = [...result].sort((a, b) => a - b)
      expect(sorted).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    })

    it('should not return already-solved puzzle', () => {
      for (let i = 0; i < 20; i++) {
        const result = shufflePieces(9)
        const isSolved = result.every((val, idx) => val === idx)
        expect(isSolved).toBe(false)
      }
    })

    it('should produce different shuffles on multiple calls', () => {
      const results = new Set()
      for (let i = 0; i < 10; i++) {
        results.add(shufflePieces(9).join(','))
      }
      expect(results.size).toBeGreaterThan(1)
    })

    it('should handle small arrays (2 pieces)', () => {
      const result = shufflePieces(2)
      expect(result).toHaveLength(2)
      const sorted = [...result].sort((a, b) => a - b)
      expect(sorted).toEqual([0, 1])
    })

    it('should handle single piece', () => {
      const result = shufflePieces(1)
      expect(result).toEqual([0])
    })
  })

  describe('isPieceCorrect', () => {
    it('should return true when piece is in correct position', () => {
      expect(isPieceCorrect(0, 0)).toBe(true)
      expect(isPieceCorrect(5, 5)).toBe(true)
    })

    it('should return false when piece is in wrong position', () => {
      expect(isPieceCorrect(0, 1)).toBe(false)
      expect(isPieceCorrect(3, 7)).toBe(false)
    })
  })

  describe('isPuzzleComplete', () => {
    it('should return true when all pieces are in correct positions', () => {
      expect(isPuzzleComplete([0, 1, 2, 3, 4, 5, 6, 7, 8])).toBe(true)
    })

    it('should return false when any piece is in wrong position', () => {
      expect(isPuzzleComplete([1, 0, 2, 3, 4, 5, 6, 7, 8])).toBe(false)
      expect(isPuzzleComplete([0, 1, 2, 3, 4, 5, 6, 8, 7])).toBe(false)
    })

    it('should return true for empty array', () => {
      expect(isPuzzleComplete([])).toBe(true)
    })

    it('should return true for single piece', () => {
      expect(isPuzzleComplete([0])).toBe(true)
    })

    it('should return false for single piece in wrong position', () => {
      expect(isPuzzleComplete([1])).toBe(false)
    })
  })

  describe('calculateScore', () => {
    it('should return high score for fast completion with few moves', () => {
      const score = calculateScore(DIFFICULTIES.EASY, 5, 2)
      expect(score).toBeGreaterThan(80)
    })

    it('should return lower score for slow completion with many moves', () => {
      const score = calculateScore(DIFFICULTIES.EASY, 120, 50)
      expect(score).toBeLessThan(50)
    })

    it('should return 0 for extremely slow completion', () => {
      const score = calculateScore(DIFFICULTIES.EASY, 9999, 9999)
      expect(score).toBe(0)
    })

    it('should give higher scores for harder difficulties with same time and moves', () => {
      const easyScore = calculateScore(DIFFICULTIES.EASY, 45, 18)
      const mediumScore = calculateScore(DIFFICULTIES.MEDIUM, 45, 18)
      const hardScore = calculateScore(DIFFICULTIES.HARD, 45, 18)
      expect(hardScore).toBeGreaterThan(mediumScore)
      expect(mediumScore).toBeGreaterThan(easyScore)
    })

    it('should cap score at 100', () => {
      const score = calculateScore(DIFFICULTIES.HARD, 0, 0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should not return negative scores', () => {
      const score = calculateScore(DIFFICULTIES.EASY, 9999, 9999)
      expect(score).toBeGreaterThanOrEqual(0)
    })

    it('should return 0 for unknown difficulty', () => {
      expect(calculateScore(99, 30, 10)).toBe(0)
    })

    it('should give a perfect score for instant completion on hard', () => {
      const score = calculateScore(DIFFICULTIES.HARD, 0, 0)
      expect(score).toBe(100)
    })

    it('should decrease score as time increases', () => {
      const score1 = calculateScore(DIFFICULTIES.EASY, 10, 5)
      const score2 = calculateScore(DIFFICULTIES.EASY, 50, 5)
      expect(score1).toBeGreaterThan(score2)
    })

    it('should decrease score as moves increase', () => {
      const score1 = calculateScore(DIFFICULTIES.EASY, 30, 5)
      const score2 = calculateScore(DIFFICULTIES.EASY, 30, 30)
      expect(score1).toBeGreaterThan(score2)
    })
  })

  describe('formatTime', () => {
    it('should format 0 seconds as 00:00', () => {
      expect(formatTime(0)).toBe('00:00')
    })

    it('should format 65 seconds as 01:05', () => {
      expect(formatTime(65)).toBe('01:05')
    })

    it('should format 3661 seconds as 61:01', () => {
      expect(formatTime(3661)).toBe('61:01')
    })

    it('should format 5999 seconds correctly', () => {
      expect(formatTime(5999)).toBe('99:59')
    })

    it('should pad single digit seconds', () => {
      expect(formatTime(9)).toBe('00:09')
    })

    it('should pad single digit minutes', () => {
      expect(formatTime(60)).toBe('01:00')
    })

    it('should format 30 seconds as 00:30', () => {
      expect(formatTime(30)).toBe('00:30')
    })

    it('should format 90 seconds as 01:30', () => {
      expect(formatTime(90)).toBe('01:30')
    })
  })

  describe('countIncorrectAfterSwap', () => {
    it('should return 1 when both pieces are not in correct positions before swap', () => {
      const pieces = [1, 0, 2]
      expect(countIncorrectAfterSwap(pieces, 0, 1)).toBe(1)
    })

    it('should return 0 when first piece is in correct position', () => {
      const pieces = [0, 1, 2]
      expect(countIncorrectAfterSwap(pieces, 0, 1)).toBe(0)
    })

    it('should return 0 when second piece is in correct position', () => {
      const pieces = [1, 0, 2]
      expect(countIncorrectAfterSwap(pieces, 1, 2)).toBe(0)
    })

    it('should return 0 when both pieces are in correct positions', () => {
      const pieces = [0, 1, 2]
      expect(countIncorrectAfterSwap(pieces, 0, 2)).toBe(0)
    })
  })

  describe('localStorage persistence', () => {
    let storage

    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadLeaderboard should return empty array when storage is empty', () => {
      expect(loadLeaderboard(storage)).toEqual([])
    })

    it('saveLeaderboard and loadLeaderboard should round-trip correctly', () => {
      const lb = [{ name: 'Player1', score: 90, difficulty: 3, timeSeconds: 30, moves: 5, completedAt: '2024-01-01T00:00:00.000Z' }]
      saveLeaderboard(lb, storage)
      expect(loadLeaderboard(storage)).toEqual(lb)
    })

    it('loadLeaderboard should return empty array for invalid JSON', () => {
      storage.setItem('puzzle_game_leaderboard', 'not json')
      expect(loadLeaderboard(storage)).toEqual([])
    })

    it('addToLeaderboard should add entry and sort correctly', () => {
      addToLeaderboard({ name: 'P1', score: 80, difficulty: 3, timeSeconds: 30, moves: 10, completedAt: '2024-01-01T00:00:00.000Z' }, storage)
      addToLeaderboard({ name: 'P2', score: 95, difficulty: 3, timeSeconds: 10, moves: 5, completedAt: '2024-01-02T00:00:00.000Z' }, storage)
      addToLeaderboard({ name: 'P3', score: 88, difficulty: 3, timeSeconds: 25, moves: 8, completedAt: '2024-01-03T00:00:00.000Z' }, storage)

      const lb = loadLeaderboard(storage)
      expect(lb[0].score).toBe(95)
      expect(lb[1].score).toBe(88)
      expect(lb[2].score).toBe(80)
    })

    it('should sort by score descending, then time ascending when scores equal', () => {
      addToLeaderboard({ name: 'P1', score: 80, difficulty: 3, timeSeconds: 50, moves: 10, completedAt: '2024-01-01T00:00:00.000Z' }, storage)
      addToLeaderboard({ name: 'P2', score: 80, difficulty: 3, timeSeconds: 30, moves: 8, completedAt: '2024-01-02T00:00:00.000Z' }, storage)

      const lb = loadLeaderboard(storage)
      expect(lb[0].timeSeconds).toBe(30)
      expect(lb[1].timeSeconds).toBe(50)
    })

    it('should trim to MAX_LEADERBOARD_ENTRIES', () => {
      for (let i = 0; i < MAX_LEADERBOARD_ENTRIES + 10; i++) {
        addToLeaderboard({
          name: `P${i}`,
          score: i,
          difficulty: 3,
          timeSeconds: 60 - i,
          moves: 10,
          completedAt: new Date(Date.now() + i).toISOString(),
        }, storage)
      }
      const lb = loadLeaderboard(storage)
      expect(lb.length).toBe(MAX_LEADERBOARD_ENTRIES)
    })

    it('clearLeaderboard should remove all entries', () => {
      addToLeaderboard({ name: 'P1', score: 80, difficulty: 3, timeSeconds: 30, moves: 10, completedAt: '2024-01-01T00:00:00.000Z' }, storage)
      expect(loadLeaderboard(storage)).toHaveLength(1)
      clearLeaderboard(storage)
      expect(loadLeaderboard(storage)).toEqual([])
    })

    it('should not throw when storage is null', () => {
      expect(() => loadLeaderboard(null)).not.toThrow()
      expect(() => saveLeaderboard([], null)).not.toThrow()
      expect(() => addToLeaderboard({ name: 'T', score: 50, difficulty: 3, timeSeconds: 30, moves: 10, completedAt: '2024-01-01T00:00:00.000Z' }, null)).not.toThrow()
      expect(() => clearLeaderboard(null)).not.toThrow()
    })
  })

  describe('sortLeaderboard', () => {
    it('should sort by score descending', () => {
      const lb = [
        { name: 'P1', score: 50, timeSeconds: 30 },
        { name: 'P2', score: 90, timeSeconds: 20 },
        { name: 'P3', score: 70, timeSeconds: 25 },
      ]
      const sorted = sortLeaderboard(lb)
      expect(sorted[0].score).toBe(90)
      expect(sorted[1].score).toBe(70)
      expect(sorted[2].score).toBe(50)
    })

    it('should sort by time ascending when scores are equal', () => {
      const lb = [
        { name: 'P1', score: 80, timeSeconds: 50 },
        { name: 'P2', score: 80, timeSeconds: 30 },
        { name: 'P3', score: 80, timeSeconds: 40 },
      ]
      const sorted = sortLeaderboard(lb)
      expect(sorted[0].timeSeconds).toBe(30)
      expect(sorted[1].timeSeconds).toBe(40)
      expect(sorted[2].timeSeconds).toBe(50)
    })

    it('should not mutate original array', () => {
      const lb = [
        { name: 'P1', score: 50, timeSeconds: 30 },
        { name: 'P2', score: 90, timeSeconds: 20 },
      ]
      const sorted = sortLeaderboard(lb)
      expect(lb[0].score).toBe(50)
      expect(sorted[0].score).toBe(90)
    })
  })

  describe('getLeaderboardByDifficulty', () => {
    it('should filter entries by difficulty', () => {
      const lb = [
        { name: 'P1', score: 90, difficulty: 3, timeSeconds: 10 },
        { name: 'P2', score: 85, difficulty: 4, timeSeconds: 20 },
        { name: 'P3', score: 80, difficulty: 3, timeSeconds: 30 },
        { name: 'P4', score: 75, difficulty: 5, timeSeconds: 40 },
      ]
      const easy = getLeaderboardByDifficulty(lb, 3)
      expect(easy).toHaveLength(2)
      expect(easy.every((e) => e.difficulty === 3)).toBe(true)
    })

    it('should return sorted results', () => {
      const lb = [
        { name: 'P1', score: 80, difficulty: 3, timeSeconds: 30 },
        { name: 'P2', score: 90, difficulty: 3, timeSeconds: 10 },
      ]
      const result = getLeaderboardByDifficulty(lb, 3)
      expect(result[0].score).toBe(90)
    })

    it('should return empty array when no matching entries', () => {
      const lb = [
        { name: 'P1', score: 90, difficulty: 3, timeSeconds: 10 },
      ]
      expect(getLeaderboardByDifficulty(lb, 5)).toEqual([])
    })
  })

  describe('paginateLeaderboard', () => {
    it('should return correct page of entries', () => {
      const entries = Array.from({ length: 25 }, (_, i) => ({ name: `P${i}`, score: 100 - i }))
      const page1 = paginateLeaderboard(entries, 1, 10)
      expect(page1).toHaveLength(10)
      expect(page1[0].name).toBe('P0')
      expect(page1[9].name).toBe('P9')
    })

    it('should return partial last page', () => {
      const entries = Array.from({ length: 25 }, (_, i) => ({ name: `P${i}`, score: 100 - i }))
      const page3 = paginateLeaderboard(entries, 3, 10)
      expect(page3).toHaveLength(5)
    })

    it('should return empty for page beyond data', () => {
      const entries = Array.from({ length: 5 }, (_, i) => ({ name: `P${i}`, score: 100 - i }))
      const page = paginateLeaderboard(entries, 2, 10)
      expect(page).toEqual([])
    })

    it('should handle page 1 with less than pageSize entries', () => {
      const entries = Array.from({ length: 3 }, (_, i) => ({ name: `P${i}`, score: 100 - i }))
      const page = paginateLeaderboard(entries, 1, 10)
      expect(page).toHaveLength(3)
    })
  })

  describe('getTotalPages', () => {
    it('should return 1 for exactly one page of items', () => {
      expect(getTotalPages(10, 10)).toBe(1)
    })

    it('should return 2 for 11 items with page size 10', () => {
      expect(getTotalPages(11, 10)).toBe(2)
    })

    it('should return 0 for 0 items', () => {
      expect(getTotalPages(0, 10)).toBe(0)
    })

    it('should return 5 for 50 items with page size 10', () => {
      expect(getTotalPages(50, 10)).toBe(5)
    })

    it('should return 3 for 25 items with page size 10', () => {
      expect(getTotalPages(25, 10)).toBe(3)
    })
  })

  describe('SCORE_CONFIG', () => {
    it('should have config for all three difficulties', () => {
      expect(SCORE_CONFIG[DIFFICULTIES.EASY]).toBeDefined()
      expect(SCORE_CONFIG[DIFFICULTIES.MEDIUM]).toBeDefined()
      expect(SCORE_CONFIG[DIFFICULTIES.HARD]).toBeDefined()
    })

    it('should have difficulty bonus increase with difficulty', () => {
      expect(SCORE_CONFIG[DIFFICULTIES.HARD].difficultyBonus).toBeGreaterThan(
        SCORE_CONFIG[DIFFICULTIES.MEDIUM].difficultyBonus
      )
      expect(SCORE_CONFIG[DIFFICULTIES.MEDIUM].difficultyBonus).toBeGreaterThan(
        SCORE_CONFIG[DIFFICULTIES.EASY].difficultyBonus
      )
    })

    it('should have timeWeight + movesWeight <= 1', () => {
      Object.values(SCORE_CONFIG).forEach((config) => {
        expect(config.timeWeight + config.movesWeight).toBeLessThanOrEqual(1)
      })
    })
  })
})
