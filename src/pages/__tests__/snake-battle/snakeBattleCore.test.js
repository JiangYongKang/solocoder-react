import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  INITIAL_LENGTH,
  SEGMENT_SIZE,
  FOOD_SIZE,
  DIRECTION_LIST,
  AI_COUNT_MIN,
  AI_COUNT_MAX,
  FOOD_COUNT,
  AI_COLORS,
  AI_NAMES,
  PLAYER_COLOR,
  PLAYER_HEAD_COLOR,
  AI_BEHAVIOR,
} from '@/pages/snake-battle/constants.js'
import {
  resetIdCounter,
  getOppositeDirection,
  canChangeDirection,
  getRandomDirection,
  getRandomPosition,
  createSnakeBody,
  createPlayerSnake,
  createAISnake,
  createInitialAISnakes,
  createFood,
  generateInitialFoods,
  generateOneFood,
  moveSnake,
  growSnake,
  checkBoundaryCollision,
  checkSnakeBodyCollision,
  checkSnakeVsSnakeCollision,
  checkAnySnakeCollision,
  checkFoodCollision,
  snakeBodyToFoods,
  findNearestFood,
  directionToTarget,
  detectDangerAhead,
  findSafeDirection,
  decideAIDirection,
  sortLeaderboard,
  respawnSnake,
  initGameState,
} from '@/pages/snake-battle/snakeBattleCore.js'

function makeSnakeAt(x, y, direction = 'RIGHT', length = 3, overrides = {}) {
  const body = createSnakeBody(x, y, direction, length)
  return {
    id: 'test_' + Math.random(),
    name: 'TestSnake',
    body,
    direction,
    nextDirection: direction,
    color: '#3b82f6',
    headColor: '#1d4ed8',
    isPlayer: false,
    alive: true,
    respawnAt: null,
    aiBehavior: AI_BEHAVIOR.FORAGE,
    lastDecisionAt: 0,
    ...overrides,
  }
}

describe('snakeBattleCore - direction helpers', () => {
  describe('getOppositeDirection', () => {
    it('should return DOWN for UP', () => {
      expect(getOppositeDirection('UP')).toBe('DOWN')
    })
    it('should return UP for DOWN', () => {
      expect(getOppositeDirection('DOWN')).toBe('UP')
    })
    it('should return RIGHT for LEFT', () => {
      expect(getOppositeDirection('LEFT')).toBe('RIGHT')
    })
    it('should return LEFT for RIGHT', () => {
      expect(getOppositeDirection('RIGHT')).toBe('LEFT')
    })
    it('should return input for invalid direction', () => {
      expect(getOppositeDirection('INVALID')).toBe('INVALID')
    })
  })

  describe('canChangeDirection', () => {
    it('should allow UP when going RIGHT', () => {
      expect(canChangeDirection('RIGHT', 'UP')).toBe(true)
    })
    it('should allow DOWN when going RIGHT', () => {
      expect(canChangeDirection('RIGHT', 'DOWN')).toBe(true)
    })
    it('should disallow LEFT when going RIGHT (opposite)', () => {
      expect(canChangeDirection('RIGHT', 'LEFT')).toBe(false)
    })
    it('should disallow DOWN when going UP (opposite)', () => {
      expect(canChangeDirection('UP', 'DOWN')).toBe(false)
    })
    it('should disallow RIGHT when going LEFT (opposite)', () => {
      expect(canChangeDirection('LEFT', 'RIGHT')).toBe(false)
    })
    it('should disallow UP when going DOWN (opposite)', () => {
      expect(canChangeDirection('DOWN', 'UP')).toBe(false)
    })
    it('should allow keeping same direction', () => {
      expect(canChangeDirection('UP', 'UP')).toBe(true)
    })
  })

  describe('getRandomDirection', () => {
    it('should return a valid direction from DIRECTION_LIST', () => {
      for (let i = 0; i < 50; i++) {
        const d = getRandomDirection()
        expect(DIRECTION_LIST).toContain(d)
      }
    })
    it('should exclude the opposite of excludeDir', () => {
      for (let i = 0; i < 50; i++) {
        const d = getRandomDirection('UP')
        expect(d).not.toBe('DOWN')
      }
    })
  })

  describe('getRandomPosition', () => {
    it('should return position with x and y within canvas bounds minus margin', () => {
      const margin = 50
      for (let i = 0; i < 50; i++) {
        const pos = getRandomPosition(margin)
        expect(pos.x).toBeGreaterThanOrEqual(margin)
        expect(pos.x).toBeLessThanOrEqual(CANVAS_WIDTH - margin)
        expect(pos.y).toBeGreaterThanOrEqual(margin)
        expect(pos.y).toBeLessThanOrEqual(CANVAS_HEIGHT - margin)
      }
    })
  })
})

describe('snakeBattleCore - snake creation', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('createSnakeBody', () => {
    it('should create body with correct length', () => {
      const body = createSnakeBody(100, 100, 'RIGHT', 5)
      expect(body.length).toBe(5)
    })
    it('should place first segment at start position for RIGHT direction', () => {
      const body = createSnakeBody(100, 100, 'RIGHT', 3)
      expect(body[0].x).toBe(100)
      expect(body[0].y).toBe(100)
      expect(body[1].x).toBe(100 - SEGMENT_SIZE)
      expect(body[2].x).toBe(100 - 2 * SEGMENT_SIZE)
    })
    it('should place segments above head for DOWN direction', () => {
      const body = createSnakeBody(100, 100, 'DOWN', 3)
      expect(body[0].x).toBe(100)
      expect(body[0].y).toBe(100)
      expect(body[1].y).toBe(100 - SEGMENT_SIZE)
      expect(body[2].y).toBe(100 - 2 * SEGMENT_SIZE)
    })
    it('should place segments to right of head for LEFT direction', () => {
      const body = createSnakeBody(100, 100, 'LEFT', 3)
      expect(body[0].x).toBe(100)
      expect(body[1].x).toBe(100 + SEGMENT_SIZE)
      expect(body[2].x).toBe(100 + 2 * SEGMENT_SIZE)
    })
  })

  describe('createPlayerSnake', () => {
    it('should create a player snake with correct properties', () => {
      const snake = createPlayerSnake()
      expect(snake.id).toBe('player')
      expect(snake.name).toBe('你')
      expect(snake.isPlayer).toBe(true)
      expect(snake.alive).toBe(true)
      expect(snake.color).toBe(PLAYER_COLOR)
      expect(snake.headColor).toBe(PLAYER_HEAD_COLOR)
      expect(snake.body.length).toBe(INITIAL_LENGTH)
      expect(DIRECTION_LIST).toContain(snake.direction)
    })
  })

  describe('createAISnake', () => {
    it('should create an AI snake with correct properties', () => {
      const snake = createAISnake(0)
      expect(snake.id).toMatch(/^ai_/)
      expect(snake.isPlayer).toBe(false)
      expect(snake.alive).toBe(true)
      expect(snake.body.length).toBe(INITIAL_LENGTH)
      expect(AI_NAMES).toContain(snake.name)
    })
    it('should cycle through AI colors by index', () => {
      const snake0 = createAISnake(0)
      const snake8 = createAISnake(8)
      expect(snake0.color).toBe(AI_COLORS[0].body)
      expect(snake8.color).toBe(AI_COLORS[0].body)
    })
    it('should cycle through AI names by index', () => {
      const snake0 = createAISnake(0)
      const snake8 = createAISnake(8)
      expect(snake0.name).toBe(AI_NAMES[0])
      expect(snake8.name).toBe(AI_NAMES[0])
    })
  })

  describe('createInitialAISnakes', () => {
    it('should create between min and max AI snakes', () => {
      const snakes = createInitialAISnakes()
      expect(snakes.length).toBeGreaterThanOrEqual(AI_COUNT_MIN)
      expect(snakes.length).toBeLessThanOrEqual(AI_COUNT_MAX)
    })
    it('should create all snakes alive with correct length', () => {
      const snakes = createInitialAISnakes()
      snakes.forEach((s) => {
        expect(s.alive).toBe(true)
        expect(s.body.length).toBe(INITIAL_LENGTH)
        expect(s.isPlayer).toBe(false)
      })
    })
    it('should give each snake a unique id', () => {
      const snakes = createInitialAISnakes()
      const ids = snakes.map((s) => s.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })
})

describe('snakeBattleCore - food generation', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('createFood', () => {
    it('should create food with given coordinates', () => {
      const food = createFood(150, 200)
      expect(food.x).toBe(150)
      expect(food.y).toBe(200)
      expect(food.size).toBe(FOOD_SIZE)
      expect(food.id).toMatch(/^food_/)
    })
  })

  describe('generateInitialFoods', () => {
    it('should generate correct number of foods', () => {
      const foods = generateInitialFoods(FOOD_COUNT)
      expect(foods.length).toBe(FOOD_COUNT)
    })
    it('should generate all foods within canvas bounds', () => {
      const foods = generateInitialFoods(100)
      const margin = 30
      foods.forEach((f) => {
        expect(f.x).toBeGreaterThanOrEqual(margin)
        expect(f.x).toBeLessThanOrEqual(CANVAS_WIDTH - margin)
        expect(f.y).toBeGreaterThanOrEqual(margin)
        expect(f.y).toBeLessThanOrEqual(CANVAS_HEIGHT - margin)
      })
    })
    it('should give each food a unique id', () => {
      const foods = generateInitialFoods(20)
      const ids = foods.map((f) => f.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('generateOneFood', () => {
    it('should generate a single food within bounds', () => {
      const margin = 30
      for (let i = 0; i < 20; i++) {
        const food = generateOneFood()
        expect(food.x).toBeGreaterThanOrEqual(margin)
        expect(food.x).toBeLessThanOrEqual(CANVAS_WIDTH - margin)
        expect(food.y).toBeGreaterThanOrEqual(margin)
        expect(food.y).toBeLessThanOrEqual(CANVAS_HEIGHT - margin)
        expect(typeof food.id).toBe('string')
      }
    })
  })
})

describe('snakeBattleCore - movement and growth', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('moveSnake', () => {
    it('should move snake right by SEGMENT_SIZE', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3)
      const moved = moveSnake(snake)
      expect(moved.body[0].x).toBe(100 + SEGMENT_SIZE)
      expect(moved.body[0].y).toBe(100)
    })
    it('should move snake up by SEGMENT_SIZE', () => {
      const snake = makeSnakeAt(100, 100, 'UP', 3)
      const moved = moveSnake(snake)
      expect(moved.body[0].x).toBe(100)
      expect(moved.body[0].y).toBe(100 - SEGMENT_SIZE)
    })
    it('should keep same body length when moving', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 5)
      const moved = moveSnake(snake)
      expect(moved.body.length).toBe(5)
    })
    it('should drop the tail segment when moving', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3)
      const oldTail = snake.body[2]
      const moved = moveSnake(snake)
      expect(moved.body[2].x).not.toBe(oldTail.x)
    })
    it('should not move a dead snake', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3, { alive: false })
      const moved = moveSnake(snake)
      expect(moved.body[0].x).toBe(100)
    })
    it('should use nextDirection over direction if set', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3, { nextDirection: 'UP' })
      const moved = moveSnake(snake)
      expect(moved.body[0].y).toBe(100 - SEGMENT_SIZE)
      expect(moved.direction).toBe('UP')
    })
  })

  describe('growSnake', () => {
    it('should increase body length by 1', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3)
      const grown = growSnake(snake)
      expect(grown.body.length).toBe(4)
    })
    it('should duplicate the last segment', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3)
      const tail = snake.body[snake.body.length - 1]
      const grown = growSnake(snake)
      const newTail = grown.body[grown.body.length - 1]
      expect(newTail.x).toBe(tail.x)
      expect(newTail.y).toBe(tail.y)
    })
    it('should not affect the head position', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3)
      const grown = growSnake(snake)
      expect(grown.body[0].x).toBe(100)
      expect(grown.body[0].y).toBe(100)
    })
  })
})

describe('snakeBattleCore - collision detection', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('checkBoundaryCollision', () => {
    it('should return false when snake is fully inside canvas', () => {
      const snake = makeSnakeAt(400, 300, 'RIGHT', 5)
      expect(checkBoundaryCollision(snake)).toBe(false)
    })
    it('should return true when head is past left boundary', () => {
      const snake = makeSnakeAt(5, 300, 'LEFT', 3)
      expect(checkBoundaryCollision(snake)).toBe(true)
    })
    it('should return true when head is past right boundary', () => {
      const snake = makeSnakeAt(CANVAS_WIDTH - 5, 300, 'RIGHT', 3)
      expect(checkBoundaryCollision(snake)).toBe(true)
    })
    it('should return true when head is past top boundary', () => {
      const snake = makeSnakeAt(400, 5, 'UP', 3)
      expect(checkBoundaryCollision(snake)).toBe(true)
    })
    it('should return true when head is past bottom boundary', () => {
      const snake = makeSnakeAt(400, CANVAS_HEIGHT - 5, 'DOWN', 3)
      expect(checkBoundaryCollision(snake)).toBe(true)
    })
  })

  describe('checkSnakeBodyCollision', () => {
    it('should return false when head is not touching body', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 5)
      expect(checkSnakeBodyCollision(snake.body[0], snake.body, 3)).toBe(false)
    })
    it('should return true when head collides with body', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 5)
      const collidingHead = { ...snake.body[3] }
      expect(checkSnakeBodyCollision(collidingHead, snake.body, 0)).toBe(true)
    })
  })

  describe('checkSnakeVsSnakeCollision', () => {
    it('should return false for same snake id', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3, { id: 'same' })
      expect(checkSnakeVsSnakeCollision(snake, { ...snake, id: 'same' })).toBe(false)
    })
    it('should return false when snakes are far apart', () => {
      const a = makeSnakeAt(100, 100, 'RIGHT', 3, { id: 'a' })
      const b = makeSnakeAt(500, 500, 'LEFT', 3, { id: 'b' })
      expect(checkSnakeVsSnakeCollision(a, b)).toBe(false)
    })
    it('should return true when snake A head overlaps snake B body', () => {
      const a = makeSnakeAt(100, 100, 'RIGHT', 3, { id: 'a' })
      const b = makeSnakeAt(100, 100, 'DOWN', 5, { id: 'b' })
      expect(checkSnakeVsSnakeCollision(a, b)).toBe(true)
    })
    it('should return false if either snake is dead', () => {
      const a = makeSnakeAt(100, 100, 'RIGHT', 3, { id: 'a', alive: false })
      const b = makeSnakeAt(100, 100, 'DOWN', 5, { id: 'b' })
      expect(checkSnakeVsSnakeCollision(a, b)).toBe(false)
    })
  })

  describe('checkAnySnakeCollision', () => {
    it('should return true when snake collides with another snake', () => {
      const a = makeSnakeAt(100, 100, 'RIGHT', 3, { id: 'a' })
      const b = makeSnakeAt(100, 100, 'DOWN', 5, { id: 'b' })
      expect(checkAnySnakeCollision(a, [a, b])).toBe(true)
    })
    it('should return false when no collisions', () => {
      const a = makeSnakeAt(100, 100, 'RIGHT', 3, { id: 'a' })
      const b = makeSnakeAt(500, 500, 'LEFT', 3, { id: 'b' })
      expect(checkAnySnakeCollision(a, [a, b])).toBe(false)
    })
  })

  describe('checkFoodCollision', () => {
    it('should return food index when head overlaps food', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3)
      const foods = [
        createFood(500, 500),
        createFood(100, 100),
        createFood(300, 300),
      ]
      expect(checkFoodCollision(snake, foods)).toBe(1)
    })
    it('should return null when no food near head', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3)
      const foods = [
        createFood(500, 500),
        createFood(600, 400),
      ]
      expect(checkFoodCollision(snake, foods)).toBe(null)
    })
    it('should return null for dead snake', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3, { alive: false })
      const foods = [createFood(100, 100)]
      expect(checkFoodCollision(snake, foods)).toBe(null)
    })
  })
})

describe('snakeBattleCore - death and food conversion', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('snakeBodyToFoods', () => {
    it('should create as many foods as body segments', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 5)
      const foods = snakeBodyToFoods(snake)
      expect(foods.length).toBe(5)
    })
    it('should create foods with valid ids', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3)
      const foods = snakeBodyToFoods(snake)
      foods.forEach((f) => {
        expect(f.id).toMatch(/^food_/)
        expect(typeof f.x).toBe('number')
        expect(typeof f.y).toBe('number')
      })
    })
  })
})

describe('snakeBattleCore - AI behavior', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('findNearestFood', () => {
    it('should return null for empty food list', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3)
      expect(findNearestFood(snake, [])).toBeNull()
    })
    it('should return null for dead snake', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3, { alive: false })
      const foods = [createFood(100, 100)]
      expect(findNearestFood(snake, foods)).toBeNull()
    })
    it('should return the nearest food', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3)
      const foods = [
        createFood(500, 500),
        createFood(120, 120),
        createFood(200, 200),
      ]
      const nearest = findNearestFood(snake, foods)
      expect(nearest.x).toBe(120)
      expect(nearest.y).toBe(120)
    })
  })

  describe('directionToTarget', () => {
    it('should return RIGHT when target is to the right (dx dominates)', () => {
      const from = { x: 100, y: 100 }
      const to = { x: 300, y: 110 }
      expect(directionToTarget(from, to)).toBe('RIGHT')
    })
    it('should return LEFT when target is to the left (dx dominates)', () => {
      const from = { x: 300, y: 100 }
      const to = { x: 100, y: 110 }
      expect(directionToTarget(from, to)).toBe('LEFT')
    })
    it('should return DOWN when target is below (dy dominates)', () => {
      const from = { x: 100, y: 100 }
      const to = { x: 110, y: 300 }
      expect(directionToTarget(from, to)).toBe('DOWN')
    })
    it('should return UP when target is above (dy dominates)', () => {
      const from = { x: 100, y: 300 }
      const to = { x: 110, y: 100 }
      expect(directionToTarget(from, to)).toBe('UP')
    })
  })

  describe('detectDangerAhead', () => {
    it('should detect boundary danger when heading for edge', () => {
      const snake = makeSnakeAt(10, 300, 'LEFT', 3)
      const danger = detectDangerAhead(snake, [], 3)
      expect(danger.danger).toBe(true)
      expect(danger.reason).toBe('boundary')
    })
    it('should not detect danger when far from boundary', () => {
      const snake = makeSnakeAt(400, 300, 'RIGHT', 3)
      const danger = detectDangerAhead(snake, [], 3)
      expect(danger.danger).toBe(false)
    })
    it('should detect snake body danger', () => {
      const movingSnake = makeSnakeAt(300, 300, 'RIGHT', 3)
      const obstacle = makeSnakeAt(300 + SEGMENT_SIZE * 2, 300, 'DOWN', 10, { id: 'obs' })
      const danger = detectDangerAhead(movingSnake, [obstacle], 3)
      expect(danger.danger).toBe(true)
      expect(danger.reason).toBe('snake')
    })
  })

  describe('findSafeDirection', () => {
    it('should return a valid direction', () => {
      const snake = makeSnakeAt(400, 300, 'RIGHT', 3)
      for (let i = 0; i < 20; i++) {
        const d = findSafeDirection(snake, [])
        expect(DIRECTION_LIST).toContain(d)
      }
    })
    it('should not return opposite direction', () => {
      const snake = makeSnakeAt(400, 300, 'RIGHT', 3)
      for (let i = 0; i < 20; i++) {
        const d = findSafeDirection(snake, [])
        expect(d).not.toBe('LEFT')
      }
    })
  })

  describe('decideAIDirection', () => {
    describe('dead snake handling', () => {
      it('should return original direction and behavior for dead snake', () => {
        const snake = makeSnakeAt(400, 300, 'RIGHT', 3, { alive: false, aiBehavior: AI_BEHAVIOR.FORAGE })
        const result = decideAIDirection(snake, [], [], 1000)
        expect(result.direction).toBe('RIGHT')
        expect(result.behavior).toBe(AI_BEHAVIOR.FORAGE)
        expect(result.updated).toBe(false)
      })
    })

    describe('decision interval (500ms)', () => {
      it('should return updated=false and keep direction when within 500ms', () => {
        const snake = makeSnakeAt(400, 300, 'RIGHT', 3, {
          lastDecisionAt: 1000,
          aiBehavior: AI_BEHAVIOR.FORAGE,
        })
        const result = decideAIDirection(snake, [], [], 1200)
        expect(result.updated).toBe(false)
        expect(result.direction).toBe('RIGHT')
        expect(result.behavior).toBe(AI_BEHAVIOR.FORAGE)
      })

      it('should return updated=true when at or beyond 500ms', () => {
        const snake = makeSnakeAt(400, 300, 'RIGHT', 3, {
          lastDecisionAt: 1000,
          aiBehavior: AI_BEHAVIOR.FORAGE,
        })
        const result = decideAIDirection(snake, [], [], 1500)
        expect(result.updated).toBe(true)
      })
    })

    describe('AVOID mode - boundary danger', () => {
      it('should switch to AVOID mode when heading for left boundary', () => {
        const snake = makeSnakeAt(15, 300, 'LEFT', 3, { lastDecisionAt: 0 })
        const result = decideAIDirection(snake, [], [], 1000)
        expect(result.behavior).toBe(AI_BEHAVIOR.AVOID)
        expect(result.updated).toBe(true)
      })

      it('should switch to AVOID mode when heading for right boundary', () => {
        const snake = makeSnakeAt(CANVAS_WIDTH - 15, 300, 'RIGHT', 3, { lastDecisionAt: 0 })
        const result = decideAIDirection(snake, [], [], 1000)
        expect(result.behavior).toBe(AI_BEHAVIOR.AVOID)
      })

      it('should switch to AVOID mode when heading for top boundary', () => {
        const snake = makeSnakeAt(400, 15, 'UP', 3, { lastDecisionAt: 0 })
        const result = decideAIDirection(snake, [], [], 1000)
        expect(result.behavior).toBe(AI_BEHAVIOR.AVOID)
      })

      it('should switch to AVOID mode when heading for bottom boundary', () => {
        const snake = makeSnakeAt(400, CANVAS_HEIGHT - 15, 'DOWN', 3, { lastDecisionAt: 0 })
        const result = decideAIDirection(snake, [], [], 1000)
        expect(result.behavior).toBe(AI_BEHAVIOR.AVOID)
      })

      it('should pick a safe direction (not opposite) when in AVOID mode', () => {
        const snake = makeSnakeAt(15, 300, 'LEFT', 3, { lastDecisionAt: 0 })
        const result = decideAIDirection(snake, [], [], 1000)
        expect(DIRECTION_LIST).toContain(result.direction)
        expect(result.direction).not.toBe('RIGHT')
      })
    })

    describe('AVOID mode - snake body danger', () => {
      it('should switch to AVOID mode when another snake is directly ahead', () => {
        const snake = makeSnakeAt(300, 300, 'RIGHT', 3, { id: 'ai1', lastDecisionAt: 0 })
        const obstacle = makeSnakeAt(300 + SEGMENT_SIZE * 2, 300, 'DOWN', 10, { id: 'obs' })
        const result = decideAIDirection(snake, [snake, obstacle], [], 1000)
        expect(result.behavior).toBe(AI_BEHAVIOR.AVOID)
      })
    })

    describe('FORAGE mode - head toward nearest food', () => {
      beforeEach(() => {
        vi.clearAllMocks()
      })

      it('should select FORAGE mode when random value is in FORAGE range', () => {
        const snake = makeSnakeAt(400, 300, 'DOWN', 3, { lastDecisionAt: 0 })
        const foods = [createFood(450, 300)]
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.3)
        const result = decideAIDirection(snake, [], foods, 1000)
        expect(result.behavior).toBe(AI_BEHAVIOR.FORAGE)
        randomSpy.mockRestore()
      })

      it('should turn RIGHT when nearest food is to the right', () => {
        const snake = makeSnakeAt(400, 300, 'DOWN', 3, { lastDecisionAt: 0 })
        const foods = [createFood(500, 300)]
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.3)
        const result = decideAIDirection(snake, [], foods, 1000)
        expect(result.direction).toBe('RIGHT')
        randomSpy.mockRestore()
      })

      it('should turn LEFT when nearest food is to the left', () => {
        const snake = makeSnakeAt(400, 300, 'UP', 3, { lastDecisionAt: 0 })
        const foods = [createFood(300, 300)]
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.3)
        const result = decideAIDirection(snake, [], foods, 1000)
        expect(result.direction).toBe('LEFT')
        randomSpy.mockRestore()
      })

      it('should turn DOWN when nearest food is below', () => {
        const snake = makeSnakeAt(400, 300, 'RIGHT', 3, { lastDecisionAt: 0 })
        const foods = [createFood(400, 400)]
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.3)
        const result = decideAIDirection(snake, [], foods, 1000)
        expect(result.direction).toBe('DOWN')
        randomSpy.mockRestore()
      })

      it('should turn UP when nearest food is above', () => {
        const snake = makeSnakeAt(400, 300, 'LEFT', 3, { lastDecisionAt: 0 })
        const foods = [createFood(400, 200)]
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.3)
        const result = decideAIDirection(snake, [], foods, 1000)
        expect(result.direction).toBe('UP')
        randomSpy.mockRestore()
      })

      it('should target the nearest food among multiple foods', () => {
        const snake = makeSnakeAt(400, 300, 'UP', 3, { lastDecisionAt: 0 })
        const foods = [
          createFood(600, 300),
          createFood(350, 300),
          createFood(200, 200),
        ]
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.3)
        const result = decideAIDirection(snake, [], foods, 1000)
        expect(result.direction).toBe('LEFT')
        randomSpy.mockRestore()
      })

      it('should fall back to safe direction if desired direction is opposite', () => {
        const snake = makeSnakeAt(400, 300, 'LEFT', 3, { lastDecisionAt: 0 })
        const foods = [createFood(500, 300)]
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.3)
        const result = decideAIDirection(snake, [], foods, 1000)
        expect(DIRECTION_LIST).toContain(result.direction)
        expect(result.direction).not.toBe('RIGHT')
        randomSpy.mockRestore()
      })

      it('should use safe direction when foods list is empty', () => {
        const snake = makeSnakeAt(400, 300, 'RIGHT', 3, { lastDecisionAt: 0 })
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.3)
        const result = decideAIDirection(snake, [], [], 1000)
        expect(DIRECTION_LIST).toContain(result.direction)
        randomSpy.mockRestore()
      })
    })

    describe('RANDOM mode - natural wandering', () => {
      beforeEach(() => {
        vi.clearAllMocks()
      })

      it('should select RANDOM mode when random value is in RANDOM range', () => {
        const snake = makeSnakeAt(400, 300, 'RIGHT', 3, { lastDecisionAt: 0 })
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.7)
        const result = decideAIDirection(snake, [], [], 1000)
        expect(result.behavior).toBe(AI_BEHAVIOR.RANDOM)
        randomSpy.mockRestore()
      })

      it('should keep direction when random deflection does not trigger', () => {
        const snake = makeSnakeAt(400, 300, 'RIGHT', 3, { lastDecisionAt: 0 })
        const randomSpy = vi.spyOn(Math, 'random')
        randomSpy
          .mockReturnValueOnce(0.7)
          .mockReturnValueOnce(0.9)
        const result = decideAIDirection(snake, [], [], 1000)
        expect(result.direction).toBe('RIGHT')
        expect(result.behavior).toBe(AI_BEHAVIOR.RANDOM)
        randomSpy.mockRestore()
      })

      it('should change direction when random deflection triggers', () => {
        const snake = makeSnakeAt(400, 300, 'RIGHT', 3, { lastDecisionAt: 0 })
        const randomSpy = vi.spyOn(Math, 'random')
        randomSpy
          .mockReturnValueOnce(0.7)
          .mockReturnValueOnce(0.1)
        const result = decideAIDirection(snake, [], [], 1000)
        expect(result.behavior).toBe(AI_BEHAVIOR.RANDOM)
        expect(DIRECTION_LIST).toContain(result.direction)
        expect(result.direction).not.toBe('LEFT')
        randomSpy.mockRestore()
      })

      it('should never turn 180 degrees in RANDOM mode', () => {
        const snake = makeSnakeAt(400, 300, 'RIGHT', 3, { lastDecisionAt: 0 })
        const randomSpy = vi.spyOn(Math, 'random')
        for (let i = 0; i < 100; i++) {
          randomSpy
            .mockReturnValueOnce(0.7)
            .mockReturnValueOnce(0.1)
          const result = decideAIDirection(snake, [], [], 1000 + i * 600)
          expect(result.direction).not.toBe('LEFT')
        }
        randomSpy.mockRestore()
      })
    })

    describe('mode selection probabilities', () => {
      it('should select AVOID mode when forced by danger (regardless of random)', () => {
        const snake = makeSnakeAt(10, 300, 'LEFT', 3, { lastDecisionAt: 0 })
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
        const result = decideAIDirection(snake, [], [], 1000)
        expect(result.behavior).toBe(AI_BEHAVIOR.AVOID)
        randomSpy.mockRestore()
      })
    })
  })
})

describe('snakeBattleCore - leaderboard', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('sortLeaderboard', () => {
    it('should sort snakes by body length descending', () => {
      const a = makeSnakeAt(100, 100, 'RIGHT', 3, { id: 'a', name: 'Short', body: createSnakeBody(100, 100, 'RIGHT', 3) })
      const b = makeSnakeAt(200, 200, 'RIGHT', 10, { id: 'b', name: 'Long', body: createSnakeBody(200, 200, 'RIGHT', 10) })
      const c = makeSnakeAt(300, 300, 'RIGHT', 5, { id: 'c', name: 'Medium', body: createSnakeBody(300, 300, 'RIGHT', 5) })
      const sorted = sortLeaderboard([a, b, c])
      expect(sorted[0].name).toBe('Long')
      expect(sorted[0].length).toBe(10)
      expect(sorted[1].name).toBe('Medium')
      expect(sorted[2].name).toBe('Short')
    })
    it('should assign ranks starting at 1', () => {
      const a = makeSnakeAt(100, 100, 'RIGHT', 3, { id: 'a', name: 'A' })
      const b = makeSnakeAt(200, 200, 'RIGHT', 5, { id: 'b', name: 'B' })
      const sorted = sortLeaderboard([a, b])
      expect(sorted[0].rank).toBe(1)
      expect(sorted[1].rank).toBe(2)
    })
    it('should treat dead snakes as length 0', () => {
      const a = makeSnakeAt(100, 100, 'RIGHT', 10, { id: 'a', name: 'DeadLong', alive: false })
      const b = makeSnakeAt(200, 200, 'RIGHT', 3, { id: 'b', name: 'AliveShort' })
      const sorted = sortLeaderboard([a, b])
      expect(sorted[0].name).toBe('AliveShort')
      expect(sorted[1].name).toBe('DeadLong')
      expect(sorted[1].length).toBe(0)
    })
    it('should break ties by name alphabetically', () => {
      const a = makeSnakeAt(100, 100, 'RIGHT', 3, { id: 'a', name: 'Zobra' })
      const b = makeSnakeAt(200, 200, 'RIGHT', 3, { id: 'b', name: 'Alpha' })
      const sorted = sortLeaderboard([a, b])
      expect(sorted[0].name).toBe('Alpha')
      expect(sorted[1].name).toBe('Zobra')
    })
    it('should preserve player flag', () => {
      const p = makeSnakeAt(100, 100, 'RIGHT', 5, { id: 'player', name: '你', isPlayer: true })
      const ai = makeSnakeAt(200, 200, 'RIGHT', 3, { id: 'ai', name: 'Bot' })
      const sorted = sortLeaderboard([p, ai])
      const playerEntry = sorted.find((s) => s.isPlayer)
      expect(playerEntry).toBeDefined()
      expect(playerEntry.name).toBe('你')
    })
  })
})

describe('snakeBattleCore - respawn and init', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  describe('respawnSnake', () => {
    it('should set alive to true and clear respawnAt', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3, { alive: false, respawnAt: 5000 })
      const respawned = respawnSnake(snake, false)
      expect(respawned.alive).toBe(true)
      expect(respawned.respawnAt).toBeNull()
    })
    it('should reset body to initial length', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 20, { alive: false })
      const respawned = respawnSnake(snake, false)
      expect(respawned.body.length).toBe(INITIAL_LENGTH)
    })
    it('should use player colors when isPlayer=true', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3, { alive: false, color: '#ff0000', headColor: '#000' })
      const respawned = respawnSnake(snake, true)
      expect(respawned.color).toBe(PLAYER_COLOR)
      expect(respawned.headColor).toBe(PLAYER_HEAD_COLOR)
    })
    it('should preserve AI colors when isPlayer=false', () => {
      const snake = makeSnakeAt(100, 100, 'RIGHT', 3, { alive: false, color: '#ff0000', headColor: '#aa0000' })
      const respawned = respawnSnake(snake, false)
      expect(respawned.color).toBe('#ff0000')
      expect(respawned.headColor).toBe('#aa0000')
    })
  })

  describe('initGameState', () => {
    it('should return state with player, ai snakes, and foods', () => {
      const state = initGameState()
      expect(state.player).toBeDefined()
      expect(state.aiSnakes).toBeDefined()
      expect(state.foods).toBeDefined()
      expect(Array.isArray(state.aiSnakes)).toBe(true)
      expect(Array.isArray(state.foods)).toBe(true)
    })
    it('should create player as alive with correct id', () => {
      const state = initGameState()
      expect(state.player.id).toBe('player')
      expect(state.player.alive).toBe(true)
    })
    it('should create correct number of foods', () => {
      const state = initGameState()
      expect(state.foods.length).toBe(FOOD_COUNT)
    })
    it('should create ai snakes within min/max range', () => {
      const state = initGameState()
      expect(state.aiSnakes.length).toBeGreaterThanOrEqual(AI_COUNT_MIN)
      expect(state.aiSnakes.length).toBeLessThanOrEqual(AI_COUNT_MAX)
    })
  })
})
