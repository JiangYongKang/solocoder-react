import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateFullBoard,
  isValidPlacement,
  generatePuzzle,
  getConflicts,
  getAllConflicts,
  getUsedNumbers,
  autoRemoveNotes,
  formatTime,
  isGameComplete,
  createInitialNotes,
  serializeNotes,
  deserializeNotes,
  saveGameState,
  loadGameState,
  clearSavedGame,
  createUndoAction,
  applyUndo,
  applyRedo,
  getHintCell,
  findFirstEmptyCell,
} from '@/pages/sudoku/sudokuCore.js'
import { DIFFICULTY, MAX_HINTS, STORAGE_KEY } from '@/pages/sudoku/constants.js'

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

describe('sudokuCore', () => {
  describe('generateFullBoard', () => {
    it('should return a 9x9 board', () => {
      const board = generateFullBoard()
      expect(board.length).toBe(9)
      board.forEach((row) => expect(row.length).toBe(9))
    })

    it('should fill every cell with numbers 1-9', () => {
      const board = generateFullBoard()
      board.forEach((row) => {
        row.forEach((cell) => {
          expect(cell).toBeGreaterThanOrEqual(1)
          expect(cell).toBeLessThanOrEqual(9)
        })
      })
    })

    it('should have valid rows (no duplicates)', () => {
      const board = generateFullBoard()
      board.forEach((row) => {
        expect(new Set(row).size).toBe(9)
      })
    })

    it('should have valid columns (no duplicates)', () => {
      const board = generateFullBoard()
      for (let c = 0; c < 9; c++) {
        const col = board.map((row) => row[c])
        expect(new Set(col).size).toBe(9)
      }
    })

    it('should have valid 3x3 boxes (no duplicates)', () => {
      const board = generateFullBoard()
      for (let boxR = 0; boxR < 3; boxR++) {
        for (let boxC = 0; boxC < 3; boxC++) {
          const nums = []
          for (let r = boxR * 3; r < boxR * 3 + 3; r++) {
            for (let c = boxC * 3; c < boxC * 3 + 3; c++) {
              nums.push(board[r][c])
            }
          }
          expect(new Set(nums).size).toBe(9)
        }
      }
    })
  })

  describe('isValidPlacement', () => {
    it('should return true for valid placement in empty board', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      expect(isValidPlacement(board, 0, 0, 5)).toBe(true)
    })

    it('should return false for duplicate in row', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      board[0][3] = 5
      expect(isValidPlacement(board, 0, 0, 5)).toBe(false)
    })

    it('should return false for duplicate in column', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      board[3][0] = 5
      expect(isValidPlacement(board, 0, 0, 5)).toBe(false)
    })

    it('should return false for duplicate in 3x3 box', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      board[1][1] = 5
      expect(isValidPlacement(board, 0, 0, 5)).toBe(false)
    })

    it('should return true when number is in different box row and col', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      board[0][0] = 5
      expect(isValidPlacement(board, 3, 3, 5)).toBe(true)
    })
  })

  describe('generatePuzzle', () => {
    it('should return puzzle and solution', () => {
      const { puzzle, solution } = generatePuzzle(DIFFICULTY.EASY)
      expect(puzzle.length).toBe(9)
      expect(solution.length).toBe(9)
    })

    it('should have empty cells in puzzle', () => {
      const { puzzle } = generatePuzzle(DIFFICULTY.EASY)
      let emptyCount = 0
      puzzle.forEach((row) => row.forEach((cell) => {
        if (cell === 0) emptyCount++
      }))
      expect(emptyCount).toBeGreaterThan(0)
    })

    it('solution should be a valid complete board', () => {
      const { solution } = generatePuzzle(DIFFICULTY.EASY)
      solution.forEach((row) => {
        expect(new Set(row).size).toBe(9)
      })
    })

    it('puzzle clues should match solution', () => {
      const { puzzle, solution } = generatePuzzle(DIFFICULTY.EASY)
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (puzzle[r][c] !== 0) {
            expect(puzzle[r][c]).toBe(solution[r][c])
          }
        }
      }
    })

    it('easy difficulty should remove fewer cells than expert', () => {
      const easy = generatePuzzle(DIFFICULTY.EASY)
      const expert = generatePuzzle(DIFFICULTY.EXPERT)
      const easyEmpty = easy.puzzle.flat().filter((c) => c === 0).length
      const expertEmpty = expert.puzzle.flat().filter((c) => c === 0).length
      expect(easyEmpty).toBeLessThan(expertEmpty)
    })
  })

  describe('getConflicts', () => {
    it('should return empty array for non-conflicting cell', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      board[0][0] = 5
      expect(getConflicts(board, 0, 0)).toEqual([])
    })

    it('should detect row conflicts', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      board[0][0] = 5
      board[0][3] = 5
      const conflicts = getConflicts(board, 0, 0)
      expect(conflicts).toContainEqual([0, 3])
    })

    it('should detect column conflicts', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      board[0][0] = 5
      board[3][0] = 5
      const conflicts = getConflicts(board, 0, 0)
      expect(conflicts).toContainEqual([3, 0])
    })

    it('should detect box conflicts', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      board[0][0] = 5
      board[2][2] = 5
      const conflicts = getConflicts(board, 0, 0)
      expect(conflicts).toContainEqual([2, 2])
    })

    it('should return empty for cell with 0', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      expect(getConflicts(board, 0, 0)).toEqual([])
    })
  })

  describe('getAllConflicts', () => {
    it('should return empty set for valid board', () => {
      const board = generateFullBoard()
      const conflicts = getAllConflicts(board)
      expect(conflicts.size).toBe(0)
    })

    it('should detect conflict cells', () => {
      const board = generateFullBoard()
      board[0][0] = board[0][1]
      const conflicts = getAllConflicts(board)
      expect(conflicts.size).toBeGreaterThan(0)
      expect(conflicts.has('0-0')).toBe(true)
      expect(conflicts.has('0-1')).toBe(true)
    })
  })

  describe('getUsedNumbers', () => {
    it('should return numbers in same row, column, and box', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      board[0][1] = 1
      board[1][0] = 2
      board[1][1] = 3
      const used = getUsedNumbers(board, 0, 0)
      expect(used.has(1)).toBe(true)
      expect(used.has(2)).toBe(true)
      expect(used.has(3)).toBe(true)
    })

    it('should not include 0 in used numbers', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      const used = getUsedNumbers(board, 0, 0)
      expect(used.has(0)).toBe(false)
      expect(used.size).toBe(0)
    })
  })

  describe('autoRemoveNotes', () => {
    it('should remove the number from notes in same row, column, and box', () => {
      const notes = createInitialNotes()
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          notes[r][c] = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9])
        }
      }
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      const updated = autoRemoveNotes(notes, board, 0, 0, 5)
      expect(updated[0][0].size).toBe(0)
      for (let c = 1; c < 9; c++) {
        expect(updated[0][c].has(5)).toBe(false)
      }
      for (let r = 1; r < 9; r++) {
        expect(updated[r][0].has(5)).toBe(false)
      }
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          expect(updated[r][c].has(5)).toBe(false)
        }
      }
      expect(updated[3][3].has(5)).toBe(true)
    })

    it('should not mutate original notes', () => {
      const notes = createInitialNotes()
      notes[0][0] = new Set([1, 2, 3])
      notes[0][1] = new Set([1, 4, 5])
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      autoRemoveNotes(notes, board, 0, 0, 1)
      expect(notes[0][1].has(1)).toBe(true)
    })
  })

  describe('formatTime', () => {
    it('should format 0 seconds', () => {
      expect(formatTime(0)).toBe('00:00')
    })

    it('should format seconds less than 60', () => {
      expect(formatTime(45)).toBe('00:45')
    })

    it('should format minutes and seconds', () => {
      expect(formatTime(125)).toBe('02:05')
    })

    it('should pad single digits with zero', () => {
      expect(formatTime(9)).toBe('00:09')
      expect(formatTime(60)).toBe('01:00')
    })
  })

  describe('isGameComplete', () => {
    it('should return true when board matches solution', () => {
      const solution = generateFullBoard()
      expect(isGameComplete(solution, solution)).toBe(true)
    })

    it('should return false when board has empty cells', () => {
      const solution = generateFullBoard()
      const board = solution.map((row) => [...row])
      board[0][0] = 0
      expect(isGameComplete(board, solution)).toBe(false)
    })

    it('should return false when board has wrong numbers', () => {
      const solution = generateFullBoard()
      const board = solution.map((row) => [...row])
      board[0][0] = board[0][0] === 9 ? 1 : 9
      expect(isGameComplete(board, solution)).toBe(false)
    })
  })

  describe('createInitialNotes', () => {
    it('should create a 9x9 grid of empty sets', () => {
      const notes = createInitialNotes()
      expect(notes.length).toBe(9)
      notes.forEach((row) => {
        expect(row.length).toBe(9)
        row.forEach((cell) => {
          expect(cell instanceof Set).toBe(true)
          expect(cell.size).toBe(0)
        })
      })
    })
  })

  describe('serializeNotes / deserializeNotes', () => {
    it('should round-trip correctly', () => {
      const notes = createInitialNotes()
      notes[0][0] = new Set([1, 3, 5])
      notes[4][4] = new Set([2, 7])
      const serialized = serializeNotes(notes)
      const deserialized = deserializeNotes(serialized)
      expect(deserialized[0][0]).toEqual(new Set([1, 3, 5]))
      expect(deserialized[4][4]).toEqual(new Set([2, 7]))
      expect(deserialized[8][8]).toEqual(new Set())
    })

    it('should serialize empty notes as empty string', () => {
      const notes = createInitialNotes()
      const serialized = serializeNotes(notes)
      expect(serialized[0][0]).toBe('')
    })

    it('should deserialize empty string as empty set', () => {
      const deserialized = deserializeNotes([['']])
      expect(deserialized[0][0]).toEqual(new Set())
    })
  })

  describe('createUndoAction', () => {
    it('should create action object with all fields', () => {
      const action = createUndoAction('fill', 0, 0, 0, 5, [1, 2, 3])
      expect(action.type).toBe('fill')
      expect(action.row).toBe(0)
      expect(action.col).toBe(0)
      expect(action.prevValue).toBe(0)
      expect(action.newValue).toBe(5)
      expect(action.prevNotes).toEqual([1, 2, 3])
    })
  })

  describe('applyUndo', () => {
    it('should restore previous value', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      board[0][0] = 5
      const action = createUndoAction('fill', 0, 0, 0, 5, [])
      const result = applyUndo(board, action)
      expect(result[0][0]).toBe(0)
    })

    it('should not mutate original board', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      board[0][0] = 5
      const action = createUndoAction('fill', 0, 0, 0, 5, [])
      applyUndo(board, action)
      expect(board[0][0]).toBe(5)
    })
  })

  describe('applyRedo', () => {
    it('should apply new value', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      const action = createUndoAction('fill', 0, 0, 0, 5, [])
      const result = applyRedo(board, action)
      expect(result[0][0]).toBe(5)
    })

    it('should not mutate original board', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      const action = createUndoAction('fill', 0, 0, 0, 5, [])
      applyRedo(board, action)
      expect(board[0][0]).toBe(0)
    })
  })

  describe('getHintCell', () => {
    it('should return correct value for empty cell', () => {
      const solution = generateFullBoard()
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      const hint = getHintCell(solution, board, 0, 0)
      expect(hint).toBe(solution[0][0])
    })

    it('should return null for already correct cell', () => {
      const solution = generateFullBoard()
      const board = solution.map((row) => [...row])
      const hint = getHintCell(solution, board, 0, 0)
      expect(hint).toBeNull()
    })
  })

  describe('findFirstEmptyCell', () => {
    it('should return coordinates of first empty cell', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      board[0][0] = 5
      const result = findFirstEmptyCell(board)
      expect(result).toEqual([0, 1])
    })

    it('should return null for full board', () => {
      const board = generateFullBoard()
      const result = findFirstEmptyCell(board)
      expect(result).toBeNull()
    })

    it('should return first cell if all empty', () => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      const result = findFirstEmptyCell(board)
      expect(result).toEqual([0, 0])
    })
  })

  describe('localStorage persistence', () => {
    let storage
    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadGameState should return null when no saved game', () => {
      expect(loadGameState(storage)).toBeNull()
    })

    it('saveGameState and loadGameState should round-trip', () => {
      const notes = createInitialNotes()
      notes[0][0] = new Set([1, 2])
      const state = {
        puzzle: Array.from({ length: 9 }, () => Array(9).fill(0)),
        solution: generateFullBoard(),
        board: Array.from({ length: 9 }, () => Array(9).fill(0)),
        notes,
        elapsedTime: 120,
        difficulty: DIFFICULTY.EASY,
        hintsRemaining: 2,
        undoStack: [],
        redoStack: [],
        autoRemoveEnabled: true,
      }
      saveGameState(state, storage)
      const loaded = loadGameState(storage)
      expect(loaded).not.toBeNull()
      expect(loaded.elapsedTime).toBe(120)
      expect(loaded.difficulty).toBe(DIFFICULTY.EASY)
      expect(loaded.hintsRemaining).toBe(2)
      expect(loaded.autoRemoveEnabled).toBe(true)
      expect(loaded.notes[0][0]).toEqual(new Set([1, 2]))
    })

    it('clearSavedGame should remove saved data', () => {
      const state = {
        puzzle: Array.from({ length: 9 }, () => Array(9).fill(0)),
        solution: generateFullBoard(),
        board: Array.from({ length: 9 }, () => Array(9).fill(0)),
        notes: createInitialNotes(),
        elapsedTime: 0,
        difficulty: DIFFICULTY.EASY,
        hintsRemaining: MAX_HINTS,
        undoStack: [],
        redoStack: [],
        autoRemoveEnabled: false,
      }
      saveGameState(state, storage)
      clearSavedGame(storage)
      expect(loadGameState(storage)).toBeNull()
    })

    it('loadGameState should return null for invalid JSON', () => {
      storage.setItem(STORAGE_KEY, 'not-json')
      expect(loadGameState(storage)).toBeNull()
    })

    it('should not throw when storage is null', () => {
      expect(() => loadGameState(null)).not.toThrow()
      expect(() => saveGameState({}, null)).not.toThrow()
      expect(() => clearSavedGame(null)).not.toThrow()
    })
  })
})
