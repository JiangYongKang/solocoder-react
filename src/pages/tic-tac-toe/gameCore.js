import { WIN_LENGTHS, HISTORY_STORAGE_KEY } from './constants.js'

export function getWinLength(size) {
  return WIN_LENGTHS[size] || 3
}

export function createEmptyBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(null))
}

export function getEmptyPositions(board, size) {
  const positions = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null) positions.push({ row: r, col: c })
    }
  }
  return positions
}

export function checkWinner(board, size) {
  const winLen = getWinLength(size)
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 },
  ]

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const player = board[r][c]
      if (player === null) continue

      for (const { dr, dc } of directions) {
        const endR = r + (winLen - 1) * dr
        const endC = c + (winLen - 1) * dc
        if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue

        let won = true
        const line = []
        for (let i = 0; i < winLen; i++) {
          const cr = r + i * dr
          const cc = c + i * dc
          if (board[cr][cc] !== player) { won = false; break }
          line.push({ row: cr, col: cc })
        }
        if (won) return { winner: player, line }
      }
    }
  }
  return null
}

export function isDraw(board, size) {
  if (checkWinner(board, size)) return false
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null) return false
    }
  }
  return true
}

export function getGameStatus(board, size) {
  const winResult = checkWinner(board, size)
  if (winResult) return { over: true, winner: winResult.winner, line: winResult.line }
  if (isDraw(board, size)) return { over: true, winner: 'draw', line: null }
  return { over: false, winner: null, line: null }
}

export function findWinningMove(board, size, player) {
  const empty = getEmptyPositions(board, size)
  for (const { row, col } of empty) {
    board[row][col] = player
    const result = checkWinner(board, size)
    board[row][col] = null
    if (result && result.winner === player) return { row, col }
  }
  return null
}

export function countThreats(board, size, player) {
  const winLen = getWinLength(size)
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 },
  ]
  let threats = 0

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const { dr, dc } of directions) {
        const endR = r + (winLen - 1) * dr
        const endC = c + (winLen - 1) * dc
        if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue

        let playerCount = 0
        let emptyCount = 0
        let blocked = false
        for (let i = 0; i < winLen; i++) {
          const cr = r + i * dr
          const cc = c + i * dc
          if (board[cr][cc] === player) playerCount++
          else if (board[cr][cc] === null) emptyCount++
          else { blocked = true; break }
        }
        if (!blocked && playerCount === winLen - 1 && emptyCount === 1) threats++
      }
    }
  }
  return threats
}

export function evaluatePosition(row, col, size) {
  const center = (size - 1) / 2
  const dist = Math.abs(row - center) + Math.abs(col - center)
  if (row === Math.floor(center) && col === Math.floor(center)) return 10
  const isCorner = (row === 0 || row === size - 1) && (col === 0 || col === size - 1)
  if (isCorner) return 5
  return Math.max(0, 5 - dist)
}

function minimax(board, size, depth, isMaximizing, aiPlayer, humanPlayer, alpha, beta) {
  const status = getGameStatus(board, size)
  if (status.over) {
    if (status.winner === aiPlayer) return 10 - depth
    if (status.winner === humanPlayer) return depth - 10
    return 0
  }
  if (depth >= 9) return 0

  const empty = getEmptyPositions(board, size)
  if (empty.length === 0) return 0

  if (isMaximizing) {
    let maxEval = -Infinity
    for (const { row, col } of empty) {
      board[row][col] = aiPlayer
      const evalScore = minimax(board, size, depth + 1, false, aiPlayer, humanPlayer, alpha, beta)
      board[row][col] = null
      maxEval = Math.max(maxEval, evalScore)
      alpha = Math.max(alpha, evalScore)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const { row, col } of empty) {
      board[row][col] = humanPlayer
      const evalScore = minimax(board, size, depth + 1, true, aiPlayer, humanPlayer, alpha, beta)
      board[row][col] = null
      minEval = Math.min(minEval, evalScore)
      beta = Math.min(beta, evalScore)
      if (beta <= alpha) break
    }
    return minEval
  }
}

function getMinimaxMove(board, size, aiPlayer, humanPlayer) {
  const empty = getEmptyPositions(board, size)
  let bestScore = -Infinity
  let bestMoves = []

  for (const { row, col } of empty) {
    board[row][col] = aiPlayer
    const score = minimax(board, size, 0, false, aiPlayer, humanPlayer, -Infinity, Infinity)
    board[row][col] = null

    if (score > bestScore) {
      bestScore = score
      bestMoves = [{ row, col }]
    } else if (score === bestScore) {
      bestMoves.push({ row, col })
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)]
}

function getHeuristicMove(board, size, aiPlayer, humanPlayer) {
  const empty = getEmptyPositions(board, size)

  const winMove = findWinningMove(board, size, aiPlayer)
  if (winMove) return winMove

  const blockMove = findWinningMove(board, size, humanPlayer)
  if (blockMove) return blockMove

  const scored = empty.map(({ row, col }) => {
    let score = 0

    score += evaluatePosition(row, col, size) * 2

    board[row][col] = aiPlayer
    const aiThreatsAfter = countThreats(board, size, aiPlayer)
    board[row][col] = null

    board[row][col] = humanPlayer
    const humanThreatsAfter = countThreats(board, size, humanPlayer)
    board[row][col] = null

    score += aiThreatsAfter * 3
    score += humanThreatsAfter * 2

    const randomness = size >= 5 ? Math.random() * 4 : Math.random() * 1.5
    score += randomness

    return { row, col, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return { row: scored[0].row, col: scored[0].col }
}

export function getAIMove(board, size, aiPlayer, humanPlayer) {
  const empty = getEmptyPositions(board, size)
  if (empty.length === 0) return null

  const winMove = findWinningMove(board, size, aiPlayer)
  if (winMove) return winMove

  const blockMove = findWinningMove(board, size, humanPlayer)
  if (blockMove) return blockMove

  if (size === 3) {
    return getMinimaxMove(board, size, aiPlayer, humanPlayer)
  }

  return getHeuristicMove(board, size, aiPlayer, humanPlayer)
}

export function loadHistory(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return []
  try {
    const raw = storage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveHistory(history, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  } catch { /* ignore */ }
}

export function addGameResult(result, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  const history = loadHistory(storage)
  const entry = {
    date: new Date().toISOString(),
    boardSize: result.boardSize,
    mode: result.mode,
    result: result.result,
    totalMoves: result.totalMoves,
  }
  history.unshift(entry)
  saveHistory(history, storage)
  return history
}

export function clearHistory(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.removeItem(HISTORY_STORAGE_KEY)
  } catch { /* ignore */ }
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
