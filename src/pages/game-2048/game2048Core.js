import { GRID_SIZE, STORAGE_KEY, MAX_UNDO_STEPS, WIN_VALUE } from './constants.js'

export function createEmptyGrid() {
  const grid = []
  for (let i = 0; i < GRID_SIZE; i++) {
    grid.push(new Array(GRID_SIZE).fill(0))
  }
  return grid
}

export function getEmptyCells(grid) {
  const cells = []
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        cells.push({ row, col })
      }
    }
  }
  return cells
}

export function addRandomTile(grid, randomFn = Math.random) {
  const emptyCells = getEmptyCells(grid)
  if (emptyCells.length === 0) return grid

  const newGrid = grid.map((row) => [...row])
  const randomCell = emptyCells[Math.floor(randomFn() * emptyCells.length)]
  const value = randomFn() < 0.9 ? 2 : 4
  newGrid[randomCell.row][randomCell.col] = value
  return newGrid
}

export function initializeGame(randomFn = Math.random) {
  let grid = createEmptyGrid()
  grid = addRandomTile(grid, randomFn)
  grid = addRandomTile(grid, randomFn)
  return {
    grid,
    score: 0,
    gameOver: false,
    won: false,
    continueAfterWin: false,
  }
}

function slideRowLeft(row) {
  const filtered = row.filter((val) => val !== 0)
  const result = []
  let scoreGained = 0

  let i = 0
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2
      result.push(merged)
      scoreGained += merged
      i += 2
    } else {
      result.push(filtered[i])
      i += 1
    }
  }

  while (result.length < GRID_SIZE) {
    result.push(0)
  }

  return { row: result, scoreGained }
}

function rotateGridClockwise(grid) {
  const rotated = createEmptyGrid()
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      rotated[col][GRID_SIZE - 1 - row] = grid[row][col]
    }
  }
  return rotated
}

function rotateGridCounterClockwise(grid) {
  const rotated = createEmptyGrid()
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      rotated[GRID_SIZE - 1 - col][row] = grid[row][col]
    }
  }
  return rotated
}

function rotateGrid180(grid) {
  const rotated = createEmptyGrid()
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      rotated[GRID_SIZE - 1 - row][GRID_SIZE - 1 - col] = grid[row][col]
    }
  }
  return rotated
}

function gridsEqual(grid1, grid2) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid1[row][col] !== grid2[row][col]) {
        return false
      }
    }
  }
  return true
}

export function move(grid, direction) {
  let workingGrid = grid.map((row) => [...row])

  switch (direction) {
    case 'left':
      break
    case 'right':
      workingGrid = rotateGrid180(workingGrid)
      break
    case 'up':
      workingGrid = rotateGridCounterClockwise(workingGrid)
      break
    case 'down':
      workingGrid = rotateGridClockwise(workingGrid)
      break
    default:
      return { grid, scoreGained: 0, moved: false }
  }

  let totalScore = 0
  const newGrid = []

  for (let row = 0; row < GRID_SIZE; row++) {
    const { row: newRow, scoreGained } = slideRowLeft(workingGrid[row])
    newGrid.push(newRow)
    totalScore += scoreGained
  }

  switch (direction) {
    case 'left':
      workingGrid = newGrid
      break
    case 'right':
      workingGrid = rotateGrid180(newGrid)
      break
    case 'up':
      workingGrid = rotateGridClockwise(newGrid)
      break
    case 'down':
      workingGrid = rotateGridCounterClockwise(newGrid)
      break
    default:
      workingGrid = newGrid
  }

  const moved = !gridsEqual(grid, workingGrid)

  return {
    grid: workingGrid,
    scoreGained: totalScore,
    moved,
  }
}

export function canMove(grid) {
  if (getEmptyCells(grid).length > 0) return true

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const current = grid[row][col]
      if (col + 1 < GRID_SIZE && grid[row][col + 1] === current) {
        return true
      }
      if (row + 1 < GRID_SIZE && grid[row + 1][col] === current) {
        return true
      }
    }
  }

  return false
}

export function hasWon(grid) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] >= WIN_VALUE) {
        return true
      }
    }
  }
  return false
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

export function createUndoState(grid, score) {
  return {
    grid: grid.map((row) => [...row]),
    score,
  }
}

export function addToUndoStack(undoStack, state) {
  const newStack = [...undoStack, state]
  if (newStack.length > MAX_UNDO_STEPS) {
    newStack.shift()
  }
  return newStack
}

export function canUndo(undoStack) {
  return undoStack.length > 0
}

export function undo(undoStack) {
  if (!canUndo(undoStack)) {
    return { state: null, newStack: undoStack }
  }
  const newStack = [...undoStack]
  const state = newStack.pop()
  return { state, newStack }
}

export function deepCloneGrid(grid) {
  return grid.map((row) => [...row])
}
