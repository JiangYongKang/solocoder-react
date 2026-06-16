import {
  SCORE_CONFIG,
  LEADERBOARD_STORAGE_KEY,
  MAX_LEADERBOARD_ENTRIES,
} from './constants.js'

export function calculateGridCoords(gridSize, canvasSize) {
  const pieceSize = canvasSize / gridSize
  const coords = []
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      coords.push({
        row,
        col,
        x: col * pieceSize,
        y: row * pieceSize,
        width: pieceSize,
        height: pieceSize,
      })
    }
  }
  return coords
}

export function shufflePieces(totalPieces) {
  const indices = Array.from({ length: totalPieces }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  if (indices.every((val, idx) => val === idx)) {
    if (indices.length > 1) {
      ;[indices[0], indices[1]] = [indices[1], indices[0]]
    }
  }
  return indices
}

export function isPieceCorrect(pieceCurrentPosition, pieceOriginalIndex) {
  return pieceCurrentPosition === pieceOriginalIndex
}

export function isPuzzleComplete(pieces) {
  return pieces.every((originalIndex, currentPosition) => originalIndex === currentPosition)
}

export function calculateScore(difficulty, timeSeconds, moves) {
  const config = SCORE_CONFIG[difficulty]
  if (!config) return 0

  const timeRatio = Math.max(0, 1 - timeSeconds / config.baseTime)
  const movesRatio = Math.max(0, 1 - moves / config.baseMoves)

  const performance = (timeRatio * config.timeWeight + movesRatio * config.movesWeight) / (config.timeWeight + config.movesWeight)

  const rawScore = performance * 100 + performance * config.difficultyBonus

  return Math.min(100, Math.max(0, Math.round(rawScore)))
}

export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function countIncorrectAfterSwap(pieces, posA, posB) {
  const aCorrect = pieces[posA] === posA
  const bCorrect = pieces[posB] === posB
  if (!aCorrect && !bCorrect) return 1
  return 0
}

export function loadLeaderboard(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return []
  try {
    const raw = storage.getItem(LEADERBOARD_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
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

export function sortLeaderboard(leaderboard) {
  return [...leaderboard].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.timeSeconds - b.timeSeconds
  })
}

export function addToLeaderboard(entry, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  const leaderboard = loadLeaderboard(storage)
  leaderboard.push(entry)
  const sorted = sortLeaderboard(leaderboard)
  const trimmed = sorted.slice(0, MAX_LEADERBOARD_ENTRIES)
  saveLeaderboard(trimmed, storage)
  return trimmed
}

export function clearLeaderboard(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return
  try {
    storage.removeItem(LEADERBOARD_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function getLeaderboardByDifficulty(leaderboard, difficulty) {
  return sortLeaderboard(leaderboard.filter((e) => e.difficulty === difficulty))
}

export function paginateLeaderboard(entries, page, pageSize) {
  const start = (page - 1) * pageSize
  return entries.slice(start, start + pageSize)
}

export function getTotalPages(totalItems, pageSize) {
  return Math.ceil(totalItems / pageSize)
}

export function drawDefaultImage(ctx, canvasSize) {
  const gridSize = 8
  const cellSize = canvasSize / gridSize
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
    '#F1948A', '#AED6F1', '#A3E4D7', '#FAD7A0',
  ]

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const colorIndex = (row + col) % colors.length
      ctx.fillStyle = colors[colorIndex]
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize)

      const cx = col * cellSize + cellSize / 2
      const cy = row * cellSize + cellSize / 2
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.beginPath()
      ctx.arc(cx, cy, cellSize * 0.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
