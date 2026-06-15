import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SEGMENT_SIZE,
  HEAD_SIZE,
  FOOD_SIZE,
  DIRECTIONS,
  DIRECTION_LIST,
  INITIAL_LENGTH,
  MOVE_STEP,
  AI_COUNT_MIN,
  AI_COUNT_MAX,
  AI_COLORS,
  AI_NAMES,
  AI_BEHAVIOR,
  FOOD_COUNT,
  FOOD_COLORS,
  PLAYER_COLOR,
  PLAYER_HEAD_COLOR,
} from './constants.js'

let _idCounter = 1
export function resetIdCounter() {
  _idCounter = 1
}
function nextId() {
  return _idCounter++
}

export function getOppositeDirection(dir) {
  const map = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT',
  }
  return map[dir] || dir
}

export function canChangeDirection(currentDir, newDir) {
  return getOppositeDirection(currentDir) !== newDir
}

export function getRandomDirection(excludeDir = null) {
  const available = DIRECTION_LIST.filter((d) => d !== excludeDir && d !== getOppositeDirection(excludeDir || ''))
  if (available.length === 0) return DIRECTION_LIST[Math.floor(Math.random() * DIRECTION_LIST.length)]
  return available[Math.floor(Math.random() * available.length)]
}

export function getRandomPosition(margin = 50) {
  return {
    x: margin + Math.random() * (CANVAS_WIDTH - margin * 2),
    y: margin + Math.random() * (CANVAS_HEIGHT - margin * 2),
  }
}

export function createSnakeBody(startX, startY, direction, length) {
  const body = []
  const dir = DIRECTIONS[direction]
  for (let i = 0; i < length; i++) {
    body.push({
      x: startX - dir.x * i * SEGMENT_SIZE,
      y: startY - dir.y * i * SEGMENT_SIZE,
    })
  }
  return body
}

export function createPlayerSnake() {
  const direction = getRandomDirection()
  const pos = getRandomPosition()
  return {
    id: 'player',
    name: '你',
    body: createSnakeBody(pos.x, pos.y, direction, INITIAL_LENGTH),
    direction,
    nextDirection: direction,
    color: PLAYER_COLOR,
    headColor: PLAYER_HEAD_COLOR,
    isPlayer: true,
    alive: true,
    respawnAt: null,
    aiBehavior: null,
    lastDecisionAt: 0,
  }
}

export function createAISnake(index) {
  const colorIdx = index % AI_COLORS.length
  const nameIdx = index % AI_NAMES.length
  const direction = getRandomDirection()
  const pos = getRandomPosition(80)
  return {
    id: `ai_${nextId()}`,
    name: AI_NAMES[nameIdx],
    body: createSnakeBody(pos.x, pos.y, direction, INITIAL_LENGTH),
    direction,
    nextDirection: direction,
    color: AI_COLORS[colorIdx].body,
    headColor: AI_COLORS[colorIdx].head,
    isPlayer: false,
    alive: true,
    respawnAt: null,
    aiBehavior: AI_BEHAVIOR.FORAGE,
    lastDecisionAt: 0,
  }
}

export function createInitialAISnakes() {
  const count = AI_COUNT_MIN + Math.floor(Math.random() * (AI_COUNT_MAX - AI_COUNT_MIN + 1))
  const snakes = []
  for (let i = 0; i < count; i++) {
    snakes.push(createAISnake(i))
  }
  return snakes
}

export function createFood(x, y) {
  return {
    id: `food_${nextId()}`,
    x,
    y,
    color: FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)],
    size: FOOD_SIZE,
  }
}

export function generateInitialFoods(count = FOOD_COUNT) {
  const foods = []
  const margin = 30
  for (let i = 0; i < count; i++) {
    const x = margin + Math.random() * (CANVAS_WIDTH - margin * 2)
    const y = margin + Math.random() * (CANVAS_HEIGHT - margin * 2)
    foods.push(createFood(x, y))
  }
  return foods
}

export function generateOneFood() {
  const margin = 30
  const x = margin + Math.random() * (CANVAS_WIDTH - margin * 2)
  const y = margin + Math.random() * (CANVAS_HEIGHT - margin * 2)
  return createFood(x, y)
}

export function moveSnake(snake) {
  if (!snake.alive) return snake
  const dir = DIRECTIONS[snake.nextDirection] || DIRECTIONS[snake.direction]
  const head = snake.body[0]
  const newHead = {
    x: head.x + dir.x * MOVE_STEP,
    y: head.y + dir.y * MOVE_STEP,
  }
  const newBody = [newHead, ...snake.body.slice(0, -1)]
  return {
    ...snake,
    body: newBody,
    direction: snake.nextDirection,
  }
}

export function growSnake(snake) {
  const last = snake.body[snake.body.length - 1]
  return {
    ...snake,
    body: [...snake.body, { ...last }],
  }
}

export function checkBoundaryCollision(snake) {
  const head = snake.body[0]
  const halfHead = HEAD_SIZE / 2
  return (
    head.x - halfHead < 0 ||
    head.x + halfHead > CANVAS_WIDTH ||
    head.y - halfHead < 0 ||
    head.y + halfHead > CANVAS_HEIGHT
  )
}

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

export function checkSnakeBodyCollision(head, body, skipFirstN = 0) {
  const threshold = SEGMENT_SIZE * 0.7
  for (let i = skipFirstN; i < body.length; i++) {
    if (distance(head, body[i]) < threshold) {
      return true
    }
  }
  return false
}

export function checkSnakeVsSnakeCollision(snakeA, snakeB) {
  if (!snakeA.alive || !snakeB.alive) return false
  if (snakeA.id === snakeB.id) return false
  const headA = snakeA.body[0]
  const threshold = (HEAD_SIZE + SEGMENT_SIZE) / 2
  for (let i = 0; i < snakeB.body.length; i++) {
    if (distance(headA, snakeB.body[i]) < threshold) {
      return true
    }
  }
  return false
}

export function checkAnySnakeCollision(snake, allSnakes) {
  if (!snake.alive) return false
  if (checkSnakeBodyCollision(snake.body[0], snake.body, 3)) {
    return true
  }
  for (const other of allSnakes) {
    if (checkSnakeVsSnakeCollision(snake, other)) {
      return true
    }
  }
  return false
}

export function checkFoodCollision(snake, foods) {
  if (!snake.alive) return null
  const head = snake.body[0]
  const threshold = (HEAD_SIZE + FOOD_SIZE) / 2
  for (let i = 0; i < foods.length; i++) {
    if (distance(head, foods[i]) < threshold) {
      return i
    }
  }
  return null
}

export function snakeBodyToFoods(snake) {
  const newFoods = []
  for (let i = 0; i < snake.body.length; i++) {
    const seg = snake.body[i]
    newFoods.push(createFood(
      seg.x + (Math.random() - 0.5) * 10,
      seg.y + (Math.random() - 0.5) * 10,
    ))
  }
  return newFoods
}

export function findNearestFood(snake, foods) {
  if (!snake.alive || foods.length === 0) return null
  let nearest = null
  let minDist = Infinity
  const head = snake.body[0]
  for (const food of foods) {
    const d = distance(head, food)
    if (d < minDist) {
      minDist = d
      nearest = food
    }
  }
  return nearest
}

export function directionToTarget(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'RIGHT' : 'LEFT'
  }
  return dy > 0 ? 'DOWN' : 'UP'
}

export function detectDangerAhead(snake, allSnakes, lookAhead = 3) {
  if (!snake.alive) return { danger: false, direction: null }
  const dir = DIRECTIONS[snake.direction]
  const head = snake.body[0]
  const threshold = (HEAD_SIZE + SEGMENT_SIZE) / 2
  const halfHead = HEAD_SIZE / 2

  for (let step = 1; step <= lookAhead; step++) {
    const checkPoint = {
      x: head.x + dir.x * MOVE_STEP * step,
      y: head.y + dir.y * MOVE_STEP * step,
    }

    if (
      checkPoint.x - halfHead < 0 ||
      checkPoint.x + halfHead > CANVAS_WIDTH ||
      checkPoint.y - halfHead < 0 ||
      checkPoint.y + halfHead > CANVAS_HEIGHT
    ) {
      return { danger: true, direction: snake.direction, reason: 'boundary' }
    }

    for (const other of allSnakes) {
      if (!other.alive) continue
      const bodyToCheck = other.id === snake.id ? other.body.slice(3) : other.body
      for (const seg of bodyToCheck) {
        if (distance(checkPoint, seg) < threshold) {
          return { danger: true, direction: snake.direction, reason: 'snake' }
        }
      }
    }
  }

  return { danger: false, direction: null }
}

export function findSafeDirection(snake, allSnakes) {
  const shuffled = DIRECTION_LIST.filter((d) => canChangeDirection(snake.direction, d))
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  for (const d of shuffled) {
    const testSnake = { ...snake, direction: d, nextDirection: d }
    const { danger } = detectDangerAhead(testSnake, allSnakes, 2)
    if (!danger) return d
  }
  return shuffled[0] || snake.direction
}

export function decideAIDirection(snake, allSnakes, foods, now) {
  if (!snake.alive) return { direction: snake.direction, behavior: snake.aiBehavior, updated: false }

  const shouldUpdate = now - snake.lastDecisionAt >= 500
  let behavior = snake.aiBehavior
  let newDirection = snake.direction

  if (shouldUpdate) {
    const danger = detectDangerAhead(snake, allSnakes, 2)
    if (danger.danger) {
      behavior = AI_BEHAVIOR.AVOID
    } else {
      const r = Math.random()
      if (r < 0.6) {
        behavior = AI_BEHAVIOR.FORAGE
      } else if (r < 0.85) {
        behavior = AI_BEHAVIOR.RANDOM
      } else {
        behavior = AI_BEHAVIOR.AVOID
      }
    }

    if (behavior === AI_BEHAVIOR.AVOID) {
      newDirection = findSafeDirection(snake, allSnakes)
    } else if (behavior === AI_BEHAVIOR.FORAGE) {
      const nearest = findNearestFood(snake, foods)
      if (nearest) {
        const desired = directionToTarget(snake.body[0], nearest)
        if (canChangeDirection(snake.direction, desired)) {
          newDirection = desired
        } else {
          newDirection = findSafeDirection(snake, allSnakes)
        }
      } else {
        newDirection = findSafeDirection(snake, allSnakes)
      }
    } else {
      if (Math.random() < 0.4) {
        newDirection = getRandomDirection(snake.direction)
      }
    }
  }

  return { direction: newDirection, behavior, updated: shouldUpdate }
}

export function sortLeaderboard(snakes) {
  return [...snakes].sort((a, b) => {
    const lenA = a.alive ? a.body.length : 0
    const lenB = b.alive ? b.body.length : 0
    if (lenB !== lenA) return lenB - lenA
    return a.name.localeCompare(b.name)
  }).map((s, idx) => ({
    rank: idx + 1,
    id: s.id,
    name: s.name,
    color: s.color,
    length: s.alive ? s.body.length : 0,
    alive: s.alive,
    isPlayer: s.isPlayer,
  }))
}

export function respawnSnake(snake, isPlayer = false) {
  const direction = getRandomDirection()
  const pos = getRandomPosition(80)
  const color = isPlayer
    ? { body: PLAYER_COLOR, head: PLAYER_HEAD_COLOR }
    : null
  return {
    ...snake,
    body: createSnakeBody(pos.x, pos.y, direction, INITIAL_LENGTH),
    direction,
    nextDirection: direction,
    color: color ? color.body : snake.color,
    headColor: color ? color.head : snake.headColor,
    alive: true,
    respawnAt: null,
  }
}

export function initGameState() {
  resetIdCounter()
  return {
    player: createPlayerSnake(),
    aiSnakes: createInitialAISnakes(),
    foods: generateInitialFoods(),
    score: 0,
  }
}
