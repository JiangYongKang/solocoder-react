import { describe, it, expect, beforeEach } from 'vitest'
import {
  GRID_SIZE,
  STORAGE_KEY,
  MAX_UNDO_STEPS,
} from '@/pages/game-2048/constants.js'
import {
  createEmptyGrid,
  getEmptyCells,
  addRandomTile,
  initializeGame,
  move,
  canMove,
  hasWon,
  loadHighScore,
  saveHighScore,
  createUndoState,
  addToUndoStack,
  canUndo,
  undo,
  deepCloneGrid,
} from '@/pages/game-2048/game2048Core.js'

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

function createGridFromRows(rows) {
  const grid = createEmptyGrid()
  for (let i = 0; i < rows.length && i < GRID_SIZE; i++) {
    for (let j = 0; j < rows[i].length && j < GRID_SIZE; j++) {
      grid[i][j] = rows[i][j]
    }
  }
  return grid
}

describe('game2048Core', () => {
  describe('createEmptyGrid', () => {
    it('should create a GRID_SIZE x GRID_SIZE grid', () => {
      const grid = createEmptyGrid()
      expect(grid.length).toBe(GRID_SIZE)
      grid.forEach((row) => {
        expect(row.length).toBe(GRID_SIZE)
      })
    })

    it('should fill all cells with 0', () => {
      const grid = createEmptyGrid()
      grid.forEach((row) => {
        row.forEach((cell) => {
          expect(cell).toBe(0)
        })
      })
    })
  })

  describe('getEmptyCells', () => {
    it('should return all cells for empty grid', () => {
      const grid = createEmptyGrid()
      const emptyCells = getEmptyCells(grid)
      expect(emptyCells.length).toBe(GRID_SIZE * GRID_SIZE)
    })

    it('should return empty array for full grid', () => {
      const grid = createEmptyGrid()
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          grid[i][j] = 2
        }
      }
      const emptyCells = getEmptyCells(grid)
      expect(emptyCells.length).toBe(0)
    })

    it('should return correct empty cells', () => {
      const grid = createGridFromRows([
        [2, 0, 0, 4],
        [0, 2, 0, 0],
        [0, 0, 4, 0],
        [2, 0, 0, 0],
      ])
      const emptyCells = getEmptyCells(grid)
      expect(emptyCells.length).toBe(11)
    })
  })

  describe('addRandomTile', () => {
    it('should add a tile to an empty grid', () => {
      const grid = createEmptyGrid()
      const newGrid = addRandomTile(grid, () => 0)
      const emptyCells = getEmptyCells(newGrid)
      expect(emptyCells.length).toBe(GRID_SIZE * GRID_SIZE - 1)
    })

    it('should not change a full grid', () => {
      const grid = createEmptyGrid()
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          grid[i][j] = 2
        }
      }
      const newGrid = addRandomTile(grid)
      expect(newGrid).toEqual(grid)
    })

    it('should generate 2 with 90% probability', () => {
      const grid = createEmptyGrid()
      let count2 = 0
      const iterations = 1000
      for (let i = 0; i < iterations; i++) {
        const newGrid = addRandomTile(grid, () => 0.5)
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            if (newGrid[row][col] === 2) count2++
          }
        }
      }
      expect(count2).toBeGreaterThan(0)
    })

    it('should generate 4 with 10% probability', () => {
      const grid = createEmptyGrid()
      let count4 = 0
      const iterations = 100
      for (let i = 0; i < iterations; i++) {
        const newGrid = addRandomTile(grid, () => 0.95)
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            if (newGrid[row][col] === 4) count4++
          }
        }
      }
      expect(count4).toBeGreaterThan(0)
    })

    it('should not mutate the original grid', () => {
      const grid = createEmptyGrid()
      const gridCopy = deepCloneGrid(grid)
      addRandomTile(grid)
      expect(grid).toEqual(gridCopy)
    })
  })

  describe('initializeGame', () => {
    it('should create a game with two tiles', () => {
      const game = initializeGame(() => 0.1)
      const emptyCells = getEmptyCells(game.grid)
      expect(emptyCells.length).toBe(GRID_SIZE * GRID_SIZE - 2)
    })

    it('should start with score 0', () => {
      const game = initializeGame()
      expect(game.score).toBe(0)
    })

    it('should start with gameOver false', () => {
      const game = initializeGame()
      expect(game.gameOver).toBe(false)
    })

    it('should start with won false', () => {
      const game = initializeGame()
      expect(game.won).toBe(false)
    })
  })

  describe('move - left direction', () => {
    it('should slide tiles to the left', () => {
      const grid = createGridFromRows([
        [0, 0, 0, 2],
        [0, 2, 0, 0],
        [0, 0, 2, 0],
        [2, 0, 0, 0],
      ])
      const result = move(grid, 'left')
      expect(result.grid[0][0]).toBe(2)
      expect(result.grid[1][0]).toBe(2)
      expect(result.grid[2][0]).toBe(2)
      expect(result.grid[3][0]).toBe(2)
      expect(result.moved).toBe(true)
    })

    it('should merge identical tiles', () => {
      const grid = createGridFromRows([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ])
      const result = move(grid, 'left')
      expect(result.grid[0][0]).toBe(4)
      expect(result.grid[0][1]).toBe(0)
      expect(result.scoreGained).toBe(4)
      expect(result.moved).toBe(true)
    })

    it('should merge only once per move', () => {
      const grid = createGridFromRows([
        [2, 2, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ])
      const result = move(grid, 'left')
      expect(result.grid[0][0]).toBe(4)
      expect(result.grid[0][1]).toBe(4)
      expect(result.grid[0][2]).toBe(0)
      expect(result.scoreGained).toBe(8)
      expect(result.moved).toBe(true)
    })

    it('should not move when nothing to move', () => {
      const grid = createGridFromRows([
        [2, 4, 8, 16],
        [2, 4, 8, 16],
        [2, 4, 8, 16],
        [2, 4, 8, 16],
      ])
      const result = move(grid, 'left')
      expect(result.moved).toBe(false)
      expect(result.scoreGained).toBe(0)
    })
  })

  describe('move - right direction', () => {
    it('should slide tiles to the right', () => {
      const grid = createGridFromRows([
        [2, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 2, 0],
        [0, 0, 0, 2],
      ])
      const result = move(grid, 'right')
      expect(result.grid[0][3]).toBe(2)
      expect(result.grid[1][3]).toBe(2)
      expect(result.grid[2][3]).toBe(2)
      expect(result.grid[3][3]).toBe(2)
      expect(result.moved).toBe(true)
    })

    it('should merge identical tiles', () => {
      const grid = createGridFromRows([
        [0, 0, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ])
      const result = move(grid, 'right')
      expect(result.grid[0][3]).toBe(4)
      expect(result.scoreGained).toBe(4)
      expect(result.moved).toBe(true)
    })
  })

  describe('move - up direction', () => {
    it('should slide tiles up', () => {
      const grid = createGridFromRows([
        [0, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 2, 2],
      ])
      const result = move(grid, 'up')
      expect(result.grid[0][0]).toBe(2)
      expect(result.grid[0][1]).toBe(2)
      expect(result.grid[0][2]).toBe(2)
      expect(result.grid[0][3]).toBe(2)
      expect(result.moved).toBe(true)
    })

    it('should merge identical tiles', () => {
      const grid = createGridFromRows([
        [2, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ])
      const result = move(grid, 'up')
      expect(result.grid[0][0]).toBe(4)
      expect(result.grid[1][0]).toBe(0)
      expect(result.scoreGained).toBe(4)
      expect(result.moved).toBe(true)
    })
  })

  describe('move - down direction', () => {
    it('should slide tiles down', () => {
      const grid = createGridFromRows([
        [2, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 2, 0],
        [0, 0, 0, 0],
      ])
      const result = move(grid, 'down')
      expect(result.grid[3][0]).toBe(2)
      expect(result.grid[3][1]).toBe(2)
      expect(result.grid[3][2]).toBe(2)
      expect(result.moved).toBe(true)
    })

    it('should merge identical tiles', () => {
      const grid = createGridFromRows([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [2, 0, 0, 0],
        [2, 0, 0, 0],
      ])
      const result = move(grid, 'down')
      expect(result.grid[3][0]).toBe(4)
      expect(result.grid[2][0]).toBe(0)
      expect(result.scoreGained).toBe(4)
      expect(result.moved).toBe(true)
    })
  })

  describe('move - score calculation', () => {
    it('should accumulate score from multiple merges', () => {
      const grid = createGridFromRows([
        [2, 2, 4, 4],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ])
      const result = move(grid, 'left')
      expect(result.scoreGained).toBe(4 + 8)
    })

    it('should return 0 score when no merge but tiles move', () => {
      const grid = createGridFromRows([
        [0, 2, 4, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ])
      const result = move(grid, 'left')
      expect(result.scoreGained).toBe(0)
      expect(result.moved).toBe(true)
    })
  })

  describe('canMove', () => {
    it('should return true when there are empty cells', () => {
      const grid = createEmptyGrid()
      grid[0][0] = 2
      expect(canMove(grid)).toBe(true)
    })

    it('should return true when adjacent tiles can merge horizontally', () => {
      const grid = createGridFromRows([
        [2, 2, 4, 8],
        [4, 8, 16, 32],
        [8, 16, 32, 64],
        [16, 32, 64, 128],
      ])
      expect(canMove(grid)).toBe(true)
    })

    it('should return true when adjacent tiles can merge vertically', () => {
      const grid = createGridFromRows([
        [2, 4, 8, 16],
        [2, 8, 16, 32],
        [4, 16, 32, 64],
        [8, 32, 64, 128],
      ])
      expect(canMove(grid)).toBe(true)
    })

    it('should return false when grid is full and no merges possible', () => {
      const grid = createGridFromRows([
        [2, 4, 8, 16],
        [4, 8, 16, 32],
        [8, 16, 32, 64],
        [16, 32, 64, 128],
      ])
      expect(canMove(grid)).toBe(false)
    })
  })

  describe('hasWon', () => {
    it('should return false when no tile reaches WIN_VALUE', () => {
      const grid = createGridFromRows([
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2, 4],
        [8, 16, 32, 64],
      ])
      expect(hasWon(grid)).toBe(false)
    })

    it('should return true when a tile reaches WIN_VALUE', () => {
      const grid = createGridFromRows([
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4],
        [8, 16, 32, 64],
      ])
      expect(hasWon(grid)).toBe(true)
    })

    it('should return true when a tile exceeds WIN_VALUE', () => {
      const grid = createGridFromRows([
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 4096, 4],
        [8, 16, 32, 64],
      ])
      expect(hasWon(grid)).toBe(true)
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
      storage.setItem(STORAGE_KEY, 'not-a-number')
      expect(loadHighScore(storage)).toBe(0)
    })

    it('loadHighScore should return 0 for negative scores', () => {
      storage.setItem(STORAGE_KEY, '-100')
      expect(loadHighScore(storage)).toBe(0)
    })

    it('should not throw when storage is null', () => {
      expect(() => loadHighScore(null)).not.toThrow()
      expect(() => saveHighScore(100, null)).not.toThrow()
    })
  })

  describe('undo functionality', () => {
    it('createUndoState should create a deep copy', () => {
      const grid = createGridFromRows([
        [2, 4, 8, 16],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ])
      const state = createUndoState(grid, 100)
      expect(state.score).toBe(100)
      state.grid[0][0] = 999
      expect(grid[0][0]).toBe(2)
    })

    it('addToUndoStack should add state to stack', () => {
      const state = createUndoState(createEmptyGrid(), 0)
      const stack = addToUndoStack([], state)
      expect(stack.length).toBe(1)
    })

    it('addToUndoStack should limit to MAX_UNDO_STEPS', () => {
      let stack = []
      for (let i = 0; i < 10; i++) {
        const state = createUndoState(createEmptyGrid(), i)
        stack = addToUndoStack(stack, state)
      }
      expect(stack.length).toBe(MAX_UNDO_STEPS)
      expect(stack[0].score).toBe(5)
      expect(stack[MAX_UNDO_STEPS - 1].score).toBe(9)
    })

    it('canUndo should return false for empty stack', () => {
      expect(canUndo([])).toBe(false)
    })

    it('canUndo should return true for non-empty stack', () => {
      const state = createUndoState(createEmptyGrid(), 0)
      expect(canUndo([state])).toBe(true)
    })

    it('undo should pop and return the last state', () => {
      const state1 = createUndoState(createEmptyGrid(), 10)
      const state2 = createUndoState(createEmptyGrid(), 20)
      const stack = [state1, state2]
      const result = undo(stack)
      expect(result.state.score).toBe(20)
      expect(result.newStack.length).toBe(1)
      expect(result.newStack[0].score).toBe(10)
    })

    it('undo should return null for empty stack', () => {
      const result = undo([])
      expect(result.state).toBeNull()
      expect(result.newStack.length).toBe(0)
    })
  })

  describe('deepCloneGrid', () => {
    it('should create a deep copy of the grid', () => {
      const grid = createGridFromRows([
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 2],
        [4, 8, 16, 32],
      ])
      const cloned = deepCloneGrid(grid)
      expect(cloned).toEqual(grid)
      cloned[0][0] = 999
      expect(grid[0][0]).toBe(2)
    })
  })

  describe('move - edge cases', () => {
    it('should handle all zeros', () => {
      const grid = createEmptyGrid()
      const result = move(grid, 'left')
      expect(result.moved).toBe(false)
      expect(result.scoreGained).toBe(0)
    })

    it('should handle single tile', () => {
      const grid = createEmptyGrid()
      grid[0][0] = 2
      const result = move(grid, 'left')
      expect(result.moved).toBe(false)
    })

    it('should return moved=false for invalid direction', () => {
      const grid = createGridFromRows([
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ])
      const result = move(grid, 'invalid')
      expect(result.moved).toBe(false)
    })
  })
})
