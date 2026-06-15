import {
  GRID_SIZE,
  INITIAL_SNAKE,
  INITIAL_DIRECTION,
  DIRECTIONS,
  OPPOSITE_DIRECTIONS,
  GAME_MODE,
  SCORE_PER_FOOD,
  POINTS_PER_LEVEL,
  INITIAL_MOVE_INTERVAL,
  MIN_MOVE_INTERVAL,
  MOVE_INTERVAL_DECREMENT,
  LEADERBOARD_STORAGE_KEY,
  MAX_LEADERBOARD_ENTRIES,
} from './constants.js'

export function createInitialState() {
  return {
    snake: INITIAL_SNAKE.map(s => ({ ...s })),
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    food: generateFood(INITIAL_SNAKE),
    score: 0,
    level: 1,
    gameMode: GAME_MODE.WALL_DEATH,
  }
}

export function generateFood(snake) {
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`))
  const available = []
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) {
        available.push({ x, y })
      }
    }
  }
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

export function isValidDirectionChange(currentDir, newDir) {
  return OPPOSITE_DIRECTIONS[currentDir] !== newDir
}

export function wrapCoordinate(value) {
  let result = value % GRID_SIZE
  if (result < 0) result += GRID_SIZE
  return result === 0 ? 0 : result
}

export function moveSnake(state) {
  const { snake, direction: currentDirection, food, gameMode } = state
  const dir = DIRECTIONS[currentDirection]
  const head = snake[0]

  let newHeadX = head.x + dir.dx
  let newHeadY = head.y + dir.dy

  if (gameMode === GAME_MODE.THROUGH_WALL) {
    newHeadX = wrapCoordinate(newHeadX)
    newHeadY = wrapCoordinate(newHeadY)
  }

  const newSnake = [{ x: newHeadX, y: newHeadY }, ...snake]

  const ateFood = food && newHeadX === food.x && newHeadY === food.y

  if (!ateFood) {
    newSnake.pop()
  }

  return {
    newSnake,
    ateFood,
    newHeadX,
    newHeadY,
  }
}

export function checkWallCollision(x, y) {
  return x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE
}

export function checkSelfCollision(snake) {
  const head = snake[0]
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      return true
    }
  }
  return false
}

export function checkCollision(state) {
  const { snake, gameMode, newHeadX, newHeadY } = state

  if (gameMode === GAME_MODE.WALL_DEATH) {
    if (checkWallCollision(newHeadX, newHeadY)) {
      return true
    }
  }

  return checkSelfCollision(snake)
}

export function calculateLevel(score) {
  return Math.floor(score / POINTS_PER_LEVEL) + 1
}

export function calculateMoveInterval(level) {
  const interval = INITIAL_MOVE_INTERVAL - (level - 1) * MOVE_INTERVAL_DECREMENT
  return Math.max(interval, MIN_MOVE_INTERVAL)
}

export function calculateScore(prevScore, ateFood) {
  return ateFood ? prevScore + SCORE_PER_FOOD : prevScore
}

export function gameTick(prevState) {
  const direction = prevState.nextDirection || prevState.direction

  const { newSnake, ateFood, newHeadX, newHeadY } = moveSnake({
    ...prevState,
    direction,
  })

  const collisionState = {
    snake: newSnake,
    gameMode: prevState.gameMode,
    newHeadX,
    newHeadY,
  }

  if (checkCollision(collisionState)) {
    return {
      ...prevState,
      snake: newSnake,
      direction,
      gameOver: true,
    }
  }

  const newScore = calculateScore(prevState.score, ateFood)
  const newLevel = calculateLevel(newScore)
  const newFood = ateFood ? generateFood(newSnake) : prevState.food

  return {
    ...prevState,
    snake: newSnake,
    direction,
    nextDirection: direction,
    food: newFood,
    score: newScore,
    level: newLevel,
    gameOver: false,
  }
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

export function addToLeaderboard(score, name, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  const leaderboard = loadLeaderboard(storage)
  const entry = {
    name,
    score,
    date: new Date().toISOString(),
  }

  leaderboard.push(entry)
  leaderboard.sort((a, b) => b.score - a.score)

  const trimmed = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES)

  const rank = trimmed.findIndex(
    (e) => e.date === entry.date && e.score === entry.score && e.name === entry.name
  )

  saveLeaderboard(trimmed, storage)

  return {
    leaderboard: trimmed,
    rank: rank >= 0 ? rank + 1 : -1,
    date: entry.date,
  }
}

export function isHighScore(score, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  const leaderboard = loadLeaderboard(storage)
  if (leaderboard.length < MAX_LEADERBOARD_ENTRIES) return true
  return score > leaderboard[leaderboard.length - 1].score
}

export function formatDate(isoString) {
  const d = new Date(isoString)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
