import { DIFFICULTY, DIFFICULTY_CONFIG, STORAGE_KEY, MAX_HINTS } from './constants.js'

export function generateFullBoard() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0))
  fillBoard(board)
  return board
}

function fillBoard(board) {
  const empty = findEmpty(board)
  if (!empty) return true
  const [row, col] = empty
  const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])
  for (const num of nums) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col] = num
      if (fillBoard(board)) return true
      board[row][col] = 0
    }
  }
  return false
}

function findEmpty(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return [r, c]
    }
  }
  return null
}

export function isValidPlacement(board, row, col, num) {
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false
  }
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false
  }
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false
    }
  }
  return true
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generatePuzzle(difficulty) {
  const solution = generateFullBoard()
  const puzzle = solution.map((row) => [...row])
  const config = DIFFICULTY_CONFIG[difficulty]
  const removeCount = randomInRange(config.removeMin, config.removeMax)
  const positions = shuffleArray(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
  )
  let removed = 0
  for (const [r, c] of positions) {
    if (removed >= removeCount) break
    const backup = puzzle[r][c]
    puzzle[r][c] = 0
    if (countSolutions(puzzle.map((row) => [...row])) === 1) {
      removed++
    } else {
      puzzle[r][c] = backup
    }
  }
  return { puzzle, solution }
}

function countSolutions(board, limit = 2) {
  const empty = findEmpty(board)
  if (!empty) return 1
  const [row, col] = empty
  let count = 0
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col] = num
      count += countSolutions(board, limit - count)
      board[row][col] = 0
      if (count >= limit) return count
    }
  }
  return count
}

function randomInRange(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function getConflicts(board, row, col) {
  const num = board[row][col]
  if (num === 0) return []
  const conflicts = []
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === num) {
      conflicts.push([row, c])
    }
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === num) {
      conflicts.push([r, col])
    }
  }
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c] === num) {
        conflicts.push([r, c])
      }
    }
  }
  return conflicts
}

export function getAllConflicts(board) {
  const set = new Set()
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) {
        const conflicts = getConflicts(board, r, c)
        for (const [cr, cc] of conflicts) {
          set.add(`${cr}-${cc}`)
          set.add(`${r}-${c}`)
        }
      }
    }
  }
  return set
}

export function getUsedNumbers(board, row, col) {
  const used = new Set()
  for (let c = 0; c < 9; c++) {
    if (board[row][c] !== 0) used.add(board[row][c])
  }
  for (let r = 0; r < 9; r++) {
    if (board[r][col] !== 0) used.add(board[r][col])
  }
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] !== 0) used.add(board[r][c])
    }
  }
  return used
}

export function autoRemoveNotes(notes, board, row, col, num) {
  const updated = notes.map((r) => r.map((c) => new Set(c)))
  updated[row][col] = new Set()
  for (let c = 0; c < 9; c++) {
    updated[row][c].delete(num)
  }
  for (let r = 0; r < 9; r++) {
    updated[r][col].delete(num)
  }
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      updated[r][c].delete(num)
    }
  }
  return updated
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function isGameComplete(board, solution) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== solution[r][c]) return false
    }
  }
  return true
}

export function createInitialNotes() {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set())
  )
}

export function serializeNotes(notes) {
  return notes.map((row) =>
    row.map((cellSet) => [...cellSet].sort().join(','))
  )
}

export function deserializeNotes(serialized) {
  return serialized.map((row) =>
    row.map((cellStr) => {
      if (!cellStr) return new Set()
      return new Set(cellStr.split(',').filter(Boolean).map(Number))
    })
  )
}

export function saveGameState(state, storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    if (!s) return
    const data = {
      puzzle: state.puzzle,
      solution: state.solution,
      board: state.board,
      notes: serializeNotes(state.notes),
      elapsedTime: state.elapsedTime,
      difficulty: state.difficulty,
      hintsRemaining: state.hintsRemaining,
      undoStack: state.undoStack,
      redoStack: state.redoStack,
      autoRemoveEnabled: state.autoRemoveEnabled,
    }
    s.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* storage unavailable */ }
}

export function loadGameState(storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    if (!s) return null
    const raw = s.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return {
      puzzle: data.puzzle,
      solution: data.solution,
      board: data.board,
      notes: deserializeNotes(data.notes),
      elapsedTime: data.elapsedTime || 0,
      difficulty: data.difficulty || DIFFICULTY.EASY,
      hintsRemaining: data.hintsRemaining ?? MAX_HINTS,
      undoStack: data.undoStack || [],
      redoStack: data.redoStack || [],
      autoRemoveEnabled: data.autoRemoveEnabled ?? false,
    }
  } catch {
    return null
  }
}

export function clearSavedGame(storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    if (s) s.removeItem(STORAGE_KEY)
  } catch { /* storage unavailable */ }
}

export function createUndoAction(type, row, col, prevValue, newValue, prevNotes) {
  return { type, row, col, prevValue, newValue, prevNotes }
}

export function applyUndo(board, action) {
  const newBoard = board.map((r) => [...r])
  newBoard[action.row][action.col] = action.prevValue
  return newBoard
}

export function applyRedo(board, action) {
  const newBoard = board.map((r) => [...r])
  newBoard[action.row][action.col] = action.newValue
  return newBoard
}

export function getHintCell(solution, board, row, col) {
  if (board[row][col] === solution[row][col]) return null
  return solution[row][col]
}

export function findFirstEmptyCell(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return [r, c]
    }
  }
  return null
}
