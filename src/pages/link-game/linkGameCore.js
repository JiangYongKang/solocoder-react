import {
  ICONS,
  DIFFICULTY_CONFIG,
  MAX_SHUFFLES,
  STORAGE_KEY_LEADERBOARD,
  BORDER_PADDING,
  BASE_SCORE,
  TIME_PENALTY_PER_SECOND,
  STEP_PENALTY,
  BONUS_UNUSED_HINT,
  BONUS_UNUSED_SHUFFLE,
} from './constants.js'

export function createGrid(rows, cols, customIcons = ICONS) {
  const totalCells = rows * cols
  const pairsNeeded = totalCells / 2
  const iconCount = customIcons.length

  const icons = []
  for (let i = 0; i < pairsNeeded; i++) {
    const iconIndex = i % iconCount
    icons.push(customIcons[iconIndex])
    icons.push(customIcons[iconIndex])
  }

  for (let i = icons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[icons[i], icons[j]] = [icons[j], icons[i]]
  }

  const innerGrid = []
  let idx = 0
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < cols; c++) {
      row.push(icons[idx++])
    }
    innerGrid.push(row)
  }

  const fullRows = rows + BORDER_PADDING * 2
  const fullCols = cols + BORDER_PADDING * 2
  const grid = []
  for (let r = 0; r < fullRows; r++) {
    const row = []
    for (let c = 0; c < fullCols; c++) {
      if (
        r >= BORDER_PADDING &&
        r < fullRows - BORDER_PADDING &&
        c >= BORDER_PADDING &&
        c < fullCols - BORDER_PADDING
      ) {
        row.push(innerGrid[r - BORDER_PADDING][c - BORDER_PADDING])
      } else {
        row.push(null)
      }
    }
    grid.push(row)
  }

  return grid
}

export function shuffleRemainingIcons(grid) {
  const rows = grid.length
  const cols = grid[0].length
  const positions = []
  const icons = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== null) {
        positions.push([r, c])
        icons.push(grid[r][c])
      }
    }
  }

  for (let i = icons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[icons[i], icons[j]] = [icons[j], icons[i]]
  }

  const newGrid = grid.map((row) => [...row])
  for (let i = 0; i < positions.length; i++) {
    const [r, c] = positions[i]
    newGrid[r][c] = icons[i]
  }

  return newGrid
}

const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]

export function findPath(grid, r1, c1, r2, c2, maxTurns = 2) {
  if (r1 === r2 && c1 === c2) return null
  if (grid[r1][c1] === null || grid[r2][c2] === null) return null
  if (grid[r1][c1] !== grid[r2][c2]) return null

  const rows = grid.length
  const cols = grid[0].length

  const queue = []
  const visited = new Map()

  for (let d = 0; d < 4; d++) {
    queue.push({
      r: r1,
      c: c1,
      dir: d,
      turns: 0,
      path: [[r1, c1]],
    })
  }

  while (queue.length > 0) {
    const { r, c, dir, turns, path } = queue.shift()

    const [dr, dc] = DIRECTIONS[dir]
    const nr = r + dr
    const nc = c + dc

    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue

    if (nr === r2 && nc === c2) {
      return [...path, [nr, nc]]
    }

    if (grid[nr][nc] !== null) continue

    const key = `${nr},${nc},${dir}`
    const prevBest = visited.get(key)
    if (prevBest !== undefined && prevBest <= turns) continue
    visited.set(key, turns)

    queue.push({
      r: nr,
      c: nc,
      dir,
      turns,
      path: [...path, [nr, nc]],
    })

    if (turns < maxTurns) {
      for (let d = 0; d < 4; d++) {
        if (d === dir) continue
        const oppositeDir = dir % 2 === 0 ? dir + 1 : dir - 1
        if (d === oppositeDir) continue

        const turnKey = `${nr},${nc},${d}`
        const prevTurnBest = visited.get(turnKey)
        if (prevTurnBest !== undefined && prevTurnBest <= turns + 1) continue
        visited.set(turnKey, turns + 1)

        queue.push({
          r: nr,
          c: nc,
          dir: d,
          turns: turns + 1,
          path: [...path, [nr, nc]],
        })
      }
    }
  }

  return null
}

export function canConnect(grid, r1, c1, r2, c2) {
  return findPath(grid, r1, c1, r2, c2, 2) !== null
}

export function eliminatePair(grid, r1, c1, r2, c2) {
  const newGrid = grid.map((row) => [...row])
  newGrid[r1][c1] = null
  newGrid[r2][c2] = null
  return newGrid
}

export function isGameComplete(grid) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] !== null) return false
    }
  }
  return true
}

export function findHintPair(grid) {
  const rows = grid.length
  const cols = grid[0].length
  const positions = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== null) {
        positions.push([r, c])
      }
    }
  }

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const [r1, c1] = positions[i]
      const [r2, c2] = positions[j]
      if (grid[r1][c1] === grid[r2][c2]) {
        const path = findPath(grid, r1, c1, r2, c2, 2)
        if (path) {
          return { pair: [[r1, c1], [r2, c2]], path }
        }
      }
    }
  }

  return null
}

export function hasAnyValidPair(grid) {
  return findHintPair(grid) !== null
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function calculateScore(params) {
  const {
    difficulty,
    timeSeconds,
    steps,
    hintsUsed = 0,
    shufflesUsed = 0,
  } = params

  const config = DIFFICULTY_CONFIG[difficulty]
  const maxHints = 1
  const maxShuffles = MAX_SHUFFLES

  const unusedHintsBonus = Math.max(0, maxHints - hintsUsed) * BONUS_UNUSED_HINT
  const unusedShufflesBonus = Math.max(0, maxShuffles - shufflesUsed) * BONUS_UNUSED_SHUFFLE

  const score =
    BASE_SCORE -
    timeSeconds * TIME_PENALTY_PER_SECOND -
    steps * STEP_PENALTY +
    unusedHintsBonus +
    unusedShufflesBonus

  return Math.max(0, Math.floor(score))
}

export function loadLeaderboard(storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    if (!s) return {}
    const raw = s.getItem(STORAGE_KEY_LEADERBOARD)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function saveLeaderboard(leaderboard, storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    if (!s) return
    s.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(leaderboard))
  } catch {
    // ignore
  }
}

export function addToLeaderboard(entry, storage) {
  const leaderboard = loadLeaderboard(storage)
  const difficulty = entry.difficulty

  if (!leaderboard[difficulty]) {
    leaderboard[difficulty] = []
  }

  leaderboard[difficulty].push({
    ...entry,
    date: entry.date || new Date().toISOString(),
  })

  leaderboard[difficulty].sort((a, b) => b.score - a.score)

  if (leaderboard[difficulty].length > 10) {
    leaderboard[difficulty] = leaderboard[difficulty].slice(0, 10)
  }

  saveLeaderboard(leaderboard, storage)

  const rank = leaderboard[difficulty].findIndex(
    (e) =>
      e.score === entry.score &&
      e.timeSeconds === entry.timeSeconds &&
      e.steps === entry.steps &&
      e.date === entry.date
  )

  return { leaderboard, rank: rank >= 0 ? rank + 1 : -1 }
}

export function formatDate(dateStr) {
  try {
    const d = new Date(dateStr)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    if (isNaN(y) || isNaN(m) || isNaN(day)) {
      return dateStr
    }
    return `${y}-${m}-${day}`
  } catch {
    return dateStr
  }
}
