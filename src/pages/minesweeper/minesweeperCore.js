import {
  CELL_STATE,
  GAME_STATUS,
  LEADERBOARD_STORAGE_KEY,
  MAX_LEADERBOARD_ENTRIES,
  MAX_TIME,
  DIFFICULTY,
} from './constants.js'

export function createEmptyBoard(rows, cols) {
  const board = []
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        neighborMines: 0,
        state: CELL_STATE.HIDDEN,
      })
    }
    board.push(row)
  }
  return board
}

export function getNeighbors(rows, cols, row, col) {
  const neighbors = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = row + dr
      const nc = col + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push([nr, nc])
      }
    }
  }
  return neighbors
}

export function placeMines(board, mineCount, safeRow, safeCol) {
  const rows = board.length
  const cols = board[0].length
  const safePositions = new Set()

  safePositions.add(`${safeRow},${safeCol}`)
  const safeNeighbors = getNeighbors(rows, cols, safeRow, safeCol)
  for (const [nr, nc] of safeNeighbors) {
    safePositions.add(`${nr},${nc}`)
  }

  const availablePositions = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safePositions.has(`${r},${c}`)) {
        availablePositions.push([r, c])
      }
    }
  }

  const actualMineCount = Math.min(mineCount, availablePositions.length)
  const shuffled = [...availablePositions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })))
  for (let i = 0; i < actualMineCount; i++) {
    const [r, c] = shuffled[i]
    newBoard[r][c].isMine = true
  }

  return newBoard
}

export function calculateNeighborMineCounts(board) {
  const rows = board.length
  const cols = board[0].length
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })))

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newBoard[r][c].isMine) continue
      const neighbors = getNeighbors(rows, cols, r, c)
      let count = 0
      for (const [nr, nc] of neighbors) {
        if (newBoard[nr][nc].isMine) count++
      }
      newBoard[r][c].neighborMines = count
    }
  }

  return newBoard
}

export function initializeGame(rows, cols, mineCount) {
  const board = createEmptyBoard(rows, cols)
  return {
    board,
    rows,
    cols,
    mineCount,
    status: GAME_STATUS.READY,
    minesPlaced: false,
    revealedCount: 0,
    flagCount: 0,
    hitMine: null,
  }
}

export function revealCellFlood(game, row, col) {
  const { board, rows, cols } = game
  if (board[row][col].state !== CELL_STATE.HIDDEN) {
    return { ...game }
  }

  const newBoard = board.map((r) => r.map((cell) => ({ ...cell })))
  const queue = [[row, col]]
  const visited = new Set()
  let revealedCount = game.revealedCount

  while (queue.length > 0) {
    const [cr, cc] = queue.shift()
    const key = `${cr},${cc}`
    if (visited.has(key)) continue
    visited.add(key)

    const cell = newBoard[cr][cc]
    if (cell.state !== CELL_STATE.HIDDEN) continue
    if (cell.isMine) continue

    cell.state = CELL_STATE.REVEALED
    revealedCount++

    if (cell.neighborMines === 0) {
      const neighbors = getNeighbors(rows, cols, cr, cc)
      for (const [nr, nc] of neighbors) {
        if (!visited.has(`${nr},${nc}`)) {
          queue.push([nr, nc])
        }
      }
    }
  }

  return {
    ...game,
    board: newBoard,
    revealedCount,
  }
}

export function revealCell(game, row, col) {
  const { board } = game
  const cell = board[row][col]

  if (cell.state !== CELL_STATE.HIDDEN) {
    return { ...game }
  }

  let currentGame = { ...game }

  if (!game.minesPlaced) {
    let placedBoard = placeMines(board, game.mineCount, row, col)
    placedBoard = calculateNeighborMineCounts(placedBoard)
    currentGame = {
      ...currentGame,
      board: placedBoard,
      minesPlaced: true,
      status: GAME_STATUS.PLAYING,
    }
  }

  const targetCell = currentGame.board[row][col]
  if (targetCell.isMine) {
    const newBoard = currentGame.board.map((r) => r.map((c) => ({ ...c })))
    newBoard[row][col].state = CELL_STATE.REVEALED
    return {
      ...currentGame,
      board: newBoard,
      status: GAME_STATUS.LOST,
      hitMine: { row, col },
    }
  }

  const afterReveal = revealCellFlood(currentGame, row, col)

  const totalNonMineCells = afterReveal.rows * afterReveal.cols - afterReveal.mineCount
  if (afterReveal.revealedCount >= totalNonMineCells) {
    return {
      ...afterReveal,
      status: GAME_STATUS.WON,
    }
  }

  return afterReveal
}

export function toggleFlag(game, row, col) {
  const { board } = game
  const cell = board[row][col]

  if (cell.state === CELL_STATE.REVEALED) {
    return { ...game }
  }

  const newBoard = board.map((r) => r.map((c) => ({ ...c })))
  let flagCount = game.flagCount

  if (cell.state === CELL_STATE.HIDDEN) {
    newBoard[row][col].state = CELL_STATE.FLAGGED
    flagCount++
  } else if (cell.state === CELL_STATE.FLAGGED) {
    newBoard[row][col].state = CELL_STATE.HIDDEN
    flagCount--
  }

  return {
    ...game,
    board: newBoard,
    flagCount,
  }
}

export function getRemainingMines(game) {
  return game.mineCount - game.flagCount
}

export function checkWin(game) {
  const { board, rows, cols, mineCount } = game
  let revealedCount = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].state === CELL_STATE.REVEALED) {
        revealedCount++
      }
    }
  }
  return revealedCount >= rows * cols - mineCount
}

export function getWrongFlags(game) {
  const { board, rows, cols } = game
  const wrong = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c]
      if (cell.state === CELL_STATE.FLAGGED && !cell.isMine) {
        wrong.push({ row: r, col: c })
      }
    }
  }
  return wrong
}

export function revealAllMines(game) {
  const { board, rows, cols } = game
  const newBoard = board.map((r) => r.map((c) => ({ ...c })))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newBoard[r][c].isMine && newBoard[r][c].state === CELL_STATE.HIDDEN) {
        newBoard[r][c].state = CELL_STATE.REVEALED
      }
    }
  }
  return {
    ...game,
    board: newBoard,
  }
}

export function formatTime(seconds) {
  const sec = Math.min(Math.max(0, seconds), MAX_TIME)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function loadLeaderboard(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { beginner: [], intermediate: [], expert: [], custom: [] }
  try {
    const raw = storage.getItem(LEADERBOARD_STORAGE_KEY)
    if (!raw) return { beginner: [], intermediate: [], expert: [], custom: [] }
    const parsed = JSON.parse(raw)
    return {
      beginner: parsed.beginner || [],
      intermediate: parsed.intermediate || [],
      expert: parsed.expert || [],
      custom: parsed.custom || [],
    }
  } catch {
    return { beginner: [], intermediate: [], expert: [], custom: [] }
  }
}

export function saveLeaderboard(leaderboard, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(leaderboard))
  } catch {
    // ignore
  }
}

export function addToLeaderboard(difficulty, time, storage = typeof window !== 'undefined' ? window.localStorage : null, customConfig = null) {
  const leaderboard = loadLeaderboard(storage)
  const entry = {
    time,
    date: new Date().toISOString(),
  }

  if (difficulty === DIFFICULTY.CUSTOM && customConfig) {
    entry.rows = customConfig.rows
    entry.cols = customConfig.cols
    entry.mines = customConfig.mines
  }

  const list = leaderboard[difficulty] || []
  list.push(entry)
  list.sort((a, b) => a.time - b.time)

  const trimmed = list.slice(0, MAX_LEADERBOARD_ENTRIES)
  leaderboard[difficulty] = trimmed

  const rank = trimmed.findIndex((e) => e.date === entry.date && e.time === entry.time)

  saveLeaderboard(leaderboard, storage)
  return { leaderboard, rank: rank >= 0 ? rank + 1 : -1, date: entry.date }
}

export function formatDate(isoString) {
  const d = new Date(isoString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export function validateCustomConfig(rows, cols, mines) {
  if (rows < 5 || rows > 50) return { valid: false, error: '行数需在 5-50 之间' }
  if (cols < 5 || cols > 50) return { valid: false, error: '列数需在 5-50 之间' }
  const totalCells = rows * cols
  const maxMines = Math.floor(totalCells / 2) - 1
  if (mines < 1) return { valid: false, error: '至少需要 1 颗雷' }
  if (mines > maxMines) return { valid: false, error: `雷数需小于总格数的一半（最多 ${maxMines} 颗）` }
  return { valid: true }
}
