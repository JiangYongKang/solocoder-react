import { describe, it, expect, beforeEach } from 'vitest'
import {
  GRID_SIZE,
  INITIAL_SNAKE,
  INITIAL_DIRECTION,
  GAME_MODE,
  INITIAL_MOVE_INTERVAL,
  MIN_MOVE_INTERVAL,
  SCORE_PER_FOOD,
  MAX_LEADERBOARD_ENTRIES,
  MOVE_INTERVAL_DECREMENT,
  POINTS_PER_LEVEL,
  DIRECTIONS,
  OPPOSITE_DIRECTIONS,
} from '@/pages/snake/constants.js'
import {
  createInitialState,
  generateFood,
  isValidDirectionChange,
  wrapCoordinate,
  moveSnake,
  checkWallCollision,
  checkSelfCollision,
  checkCollision,
  calculateLevel,
  calculateMoveInterval,
  calculateScore,
  gameTick,
  loadLeaderboard,
  saveLeaderboard,
  addToLeaderboard,
  isHighScore,
  formatDate,
} from '@/pages/snake/snakeCore.js'

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

describe('snakeCore', () => {
  describe('createInitialState', () => {
    it('should create initial state with correct properties', () => {
      const state = createInitialState()
      expect(state.snake).toEqual(INITIAL_SNAKE.map(s => ({ ...s })))
      expect(state.direction).toBe(INITIAL_DIRECTION)
      expect(state.nextDirection).toBe(INITIAL_DIRECTION)
      expect(state.score).toBe(0)
      expect(state.level).toBe(1)
      expect(state.gameMode).toBe(GAME_MODE.WALL_DEATH)
      expect(state.food).not.toBeNull()
    })

    it('should not place food on snake', () => {
      const state = createInitialState()
      const snakeSet = new Set(state.snake.map(s => `${s.x},${s.y}`))
      expect(snakeSet.has(`${state.food.x},${state.food.y}`)).toBe(false)
    })

    it('should return a deep copy of initial snake', () => {
      const state1 = createInitialState()
      const state2 = createInitialState()
      state1.snake[0].x = 999
      expect(state2.snake[0].x).not.toBe(999)
    })
  })

  describe('generateFood', () => {
    it('should generate food within grid bounds', () => {
      for (let i = 0; i < 50; i++) {
        const food = generateFood(INITIAL_SNAKE)
        expect(food.x).toBeGreaterThanOrEqual(0)
        expect(food.x).toBeLessThan(GRID_SIZE)
        expect(food.y).toBeGreaterThanOrEqual(0)
        expect(food.y).toBeLessThan(GRID_SIZE)
      }
    })

    it('should not generate food on snake', () => {
      const snake = [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 5, y: 7 },
      ]
      for (let i = 0; i < 50; i++) {
        const food = generateFood(snake)
        const onSnake = snake.some(s => s.x === food.x && s.y === food.y)
        expect(onSnake).toBe(false)
      }
    })

    it('should return null when snake fills entire grid', () => {
      const fullSnake = []
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          fullSnake.push({ x, y })
        }
      }
      const food = generateFood(fullSnake)
      expect(food).toBeNull()
    })
  })

  describe('isValidDirectionChange', () => {
    it('should allow turning right when moving up', () => {
      expect(isValidDirectionChange('UP', 'RIGHT')).toBe(true)
    })

    it('should allow turning left when moving up', () => {
      expect(isValidDirectionChange('UP', 'LEFT')).toBe(true)
    })

    it('should not allow reversing direction (up -> down)', () => {
      expect(isValidDirectionChange('UP', 'DOWN')).toBe(false)
    })

    it('should not allow reversing direction (right -> left)', () => {
      expect(isValidDirectionChange('RIGHT', 'LEFT')).toBe(false)
    })

    it('should not allow reversing direction (down -> up)', () => {
      expect(isValidDirectionChange('DOWN', 'UP')).toBe(false)
    })

    it('should not allow reversing direction (left -> right)', () => {
      expect(isValidDirectionChange('LEFT', 'RIGHT')).toBe(false)
    })

    it('should allow moving in same direction', () => {
      expect(isValidDirectionChange('UP', 'UP')).toBe(true)
    })
  })

  describe('wrapCoordinate', () => {
    it('should wrap negative values to grid end', () => {
      expect(wrapCoordinate(-1)).toBe(GRID_SIZE - 1)
      expect(wrapCoordinate(-5)).toBe(GRID_SIZE - 5)
    })

    it('should wrap values >= GRID_SIZE to grid start', () => {
      expect(wrapCoordinate(GRID_SIZE)).toBe(0)
      expect(wrapCoordinate(GRID_SIZE + 3)).toBe(3)
    })

    it('should return value unchanged when within bounds', () => {
      expect(wrapCoordinate(0)).toBe(0)
      expect(wrapCoordinate(10)).toBe(10)
      expect(wrapCoordinate(GRID_SIZE - 1)).toBe(GRID_SIZE - 1)
    })
  })

  describe('moveSnake', () => {
    it('should move snake right correctly', () => {
      const state = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
        direction: 'RIGHT',
        food: { x: 15, y: 10 },
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = moveSnake(state)
      expect(result.newSnake).toEqual([
        { x: 11, y: 10 },
        { x: 10, y: 10 },
        { x: 9, y: 10 },
      ])
      expect(result.ateFood).toBe(false)
    })

    it('should move snake up correctly', () => {
      const state = {
        snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }],
        direction: 'UP',
        food: { x: 10, y: 5 },
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = moveSnake(state)
      expect(result.newSnake).toEqual([
        { x: 10, y: 9 },
        { x: 10, y: 10 },
        { x: 10, y: 11 },
      ])
      expect(result.ateFood).toBe(false)
    })

    it('should grow snake when eating food', () => {
      const state = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
        direction: 'RIGHT',
        food: { x: 11, y: 10 },
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = moveSnake(state)
      expect(result.newSnake).toEqual([
        { x: 11, y: 10 },
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
      ])
      expect(result.ateFood).toBe(true)
    })

    it('should wrap coordinates in THROUGH_WALL mode', () => {
      const state = {
        snake: [{ x: GRID_SIZE - 1, y: 10 }, { x: GRID_SIZE - 2, y: 10 }],
        direction: 'RIGHT',
        food: { x: 5, y: 5 },
        gameMode: GAME_MODE.THROUGH_WALL,
      }
      const result = moveSnake(state)
      expect(result.newHeadX).toBe(0)
      expect(result.newHeadY).toBe(10)
    })

    it('should not mutate original snake array', () => {
      const originalSnake = [{ x: 10, y: 10 }, { x: 9, y: 10 }]
      const state = {
        snake: originalSnake,
        direction: 'RIGHT',
        food: { x: 5, y: 5 },
        gameMode: GAME_MODE.WALL_DEATH,
      }
      moveSnake(state)
      expect(originalSnake[0].x).toBe(10)
    })
  })

  describe('checkWallCollision', () => {
    it('should return true when x is negative', () => {
      expect(checkWallCollision(-1, 10)).toBe(true)
    })

    it('should return true when x >= GRID_SIZE', () => {
      expect(checkWallCollision(GRID_SIZE, 10)).toBe(true)
      expect(checkWallCollision(GRID_SIZE + 5, 10)).toBe(true)
    })

    it('should return true when y is negative', () => {
      expect(checkWallCollision(10, -1)).toBe(true)
    })

    it('should return true when y >= GRID_SIZE', () => {
      expect(checkWallCollision(10, GRID_SIZE)).toBe(true)
    })

    it('should return false when within bounds', () => {
      expect(checkWallCollision(0, 0)).toBe(false)
      expect(checkWallCollision(GRID_SIZE - 1, GRID_SIZE - 1)).toBe(false)
      expect(checkWallCollision(10, 10)).toBe(false)
    })
  })

  describe('checkSelfCollision', () => {
    it('should return false when snake does not intersect itself', () => {
      const snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
        { x: 8, y: 11 },
      ]
      expect(checkSelfCollision(snake)).toBe(false)
    })

    it('should return true when snake head intersects body', () => {
      const snake = [
        { x: 10, y: 10 },
        { x: 11, y: 10 },
        { x: 11, y: 11 },
        { x: 10, y: 11 },
        { x: 10, y: 10 },
      ]
      expect(checkSelfCollision(snake)).toBe(true)
    })

    it('should return false for single segment snake', () => {
      const snake = [{ x: 10, y: 10 }]
      expect(checkSelfCollision(snake)).toBe(false)
    })
  })

  describe('checkCollision', () => {
    it('should detect wall collision in WALL_DEATH mode', () => {
      const state = {
        snake: [{ x: -1, y: 10 }, { x: 0, y: 10 }],
        gameMode: GAME_MODE.WALL_DEATH,
        newHeadX: -1,
        newHeadY: 10,
      }
      expect(checkCollision(state)).toBe(true)
    })

    it('should not detect wall collision in THROUGH_WALL mode', () => {
      const state = {
        snake: [{ x: 0, y: 10 }, { x: 1, y: 10 }],
        gameMode: GAME_MODE.THROUGH_WALL,
        newHeadX: -1,
        newHeadY: 10,
      }
      expect(checkCollision(state)).toBe(false)
    })

    it('should detect self collision regardless of mode', () => {
      const snake = [
        { x: 10, y: 10 },
        { x: 11, y: 10 },
        { x: 11, y: 11 },
        { x: 10, y: 11 },
        { x: 10, y: 10 },
      ]
      const state = {
        snake,
        gameMode: GAME_MODE.THROUGH_WALL,
        newHeadX: 10,
        newHeadY: 10,
      }
      expect(checkCollision(state)).toBe(true)
    })
  })

  describe('calculateLevel', () => {
    it('should return level 1 for score 0', () => {
      expect(calculateLevel(0)).toBe(1)
    })

    it('should return level 1 for score 49', () => {
      expect(calculateLevel(49)).toBe(1)
    })

    it('should return level 2 for score 50', () => {
      expect(calculateLevel(50)).toBe(2)
    })

    it('should return level 3 for score 100', () => {
      expect(calculateLevel(100)).toBe(3)
    })

    it('should calculate correctly for high scores', () => {
      expect(calculateLevel(500)).toBe(11)
    })
  })

  describe('calculateMoveInterval', () => {
    it('should return initial interval for level 1', () => {
      expect(calculateMoveInterval(1)).toBe(INITIAL_MOVE_INTERVAL)
    })

    it('should decrease by 10ms per level', () => {
      expect(calculateMoveInterval(2)).toBe(INITIAL_MOVE_INTERVAL - 10)
      expect(calculateMoveInterval(3)).toBe(INITIAL_MOVE_INTERVAL - 20)
    })

    it('should not go below minimum interval', () => {
      expect(calculateMoveInterval(100)).toBe(MIN_MOVE_INTERVAL)
    })
  })

  describe('calculateScore', () => {
    it('should add SCORE_PER_FOOD when ateFood is true', () => {
      expect(calculateScore(0, true)).toBe(SCORE_PER_FOOD)
      expect(calculateScore(50, true)).toBe(50 + SCORE_PER_FOOD)
    })

    it('should keep score unchanged when ateFood is false', () => {
      expect(calculateScore(100, false)).toBe(100)
    })
  })

  describe('gameTick', () => {
    it('should advance game state correctly', () => {
      const prevState = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        food: { x: 15, y: 10 },
        score: 0,
        level: 1,
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = gameTick(prevState)
      expect(result.snake[0]).toEqual({ x: 11, y: 10 })
      expect(result.score).toBe(0)
      expect(result.gameOver).toBe(false)
    })

    it('should update score and level when eating food', () => {
      const prevState = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        food: { x: 11, y: 10 },
        score: 45,
        level: 1,
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = gameTick(prevState)
      expect(result.score).toBe(45 + SCORE_PER_FOOD)
      expect(result.level).toBe(2)
      expect(result.snake.length).toBe(4)
    })

    it('should detect game over on wall collision', () => {
      const prevState = {
        snake: [{ x: 0, y: 10 }, { x: 1, y: 10 }],
        direction: 'LEFT',
        nextDirection: 'LEFT',
        food: { x: 5, y: 5 },
        score: 0,
        level: 1,
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = gameTick(prevState)
      expect(result.gameOver).toBe(true)
    })

    it('should detect game over on self collision', () => {
      const prevState = {
        snake: [
          { x: 5, y: 5 },
          { x: 4, y: 5 },
          { x: 4, y: 6 },
          { x: 5, y: 6 },
          { x: 6, y: 6 },
          { x: 6, y: 5 },
        ],
        direction: 'DOWN',
        nextDirection: 'DOWN',
        food: { x: 15, y: 15 },
        score: 0,
        level: 1,
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = gameTick(prevState)
      expect(result.gameOver).toBe(true)
    })

    it('should use nextDirection for movement', () => {
      const prevState = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
        direction: 'RIGHT',
        nextDirection: 'UP',
        food: { x: 5, y: 5 },
        score: 0,
        level: 1,
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = gameTick(prevState)
      expect(result.snake[0]).toEqual({ x: 10, y: 9 })
      expect(result.direction).toBe('UP')
      expect(result.nextDirection).toBe('UP')
    })

    it('should not mutate original state', () => {
      const prevState = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        food: { x: 15, y: 10 },
        score: 0,
        level: 1,
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const originalSnakeHead = { ...prevState.snake[0] }
      gameTick(prevState)
      expect(prevState.snake[0]).toEqual(originalSnakeHead)
    })
  })

  describe('localStorage persistence', () => {
    let storage

    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadLeaderboard should return empty array when storage empty', () => {
      expect(loadLeaderboard(storage)).toEqual([])
    })

    it('saveLeaderboard and loadLeaderboard should round-trip correctly', () => {
      const leaderboard = [
        { name: 'Player1', score: 100, date: '2024-01-01T00:00:00.000Z' },
      ]
      saveLeaderboard(leaderboard, storage)
      expect(loadLeaderboard(storage)).toEqual(leaderboard)
    })

    it('loadLeaderboard should return empty array for invalid JSON', () => {
      storage.setItem('snake_leaderboard', 'invalid json')
      expect(loadLeaderboard(storage)).toEqual([])
    })

    it('addToLeaderboard should add entry and sort by score descending', () => {
      addToLeaderboard(100, 'Player1', storage)
      addToLeaderboard(200, 'Player2', storage)
      addToLeaderboard(150, 'Player3', storage)

      const leaderboard = loadLeaderboard(storage)
      expect(leaderboard[0].score).toBe(200)
      expect(leaderboard[1].score).toBe(150)
      expect(leaderboard[2].score).toBe(100)
    })

    it('addToLeaderboard should trim to MAX_LEADERBOARD_ENTRIES', () => {
      for (let i = 0; i < 15; i++) {
        addToLeaderboard(i * 10, `Player${i}`, storage)
      }
      const leaderboard = loadLeaderboard(storage)
      expect(leaderboard.length).toBe(MAX_LEADERBOARD_ENTRIES)
      expect(leaderboard[0].score).toBe(140)
    })

    it('isHighScore should return true when leaderboard not full', () => {
      for (let i = 0; i < 5; i++) {
        addToLeaderboard(100, `Player${i}`, storage)
      }
      expect(isHighScore(50, storage)).toBe(true)
    })

    it('isHighScore should return true when score higher than lowest', () => {
      for (let i = 0; i < 10; i++) {
        addToLeaderboard((i + 1) * 10, `Player${i}`, storage)
      }
      expect(isHighScore(15, storage)).toBe(true)
    })

    it('isHighScore should return false when score lower than or equal to lowest', () => {
      for (let i = 0; i < 10; i++) {
        addToLeaderboard((i + 1) * 10, `Player${i}`, storage)
      }
      expect(isHighScore(10, storage)).toBe(false)
      expect(isHighScore(5, storage)).toBe(false)
    })

    it('should not throw when storage is null', () => {
      expect(() => loadLeaderboard(null)).not.toThrow()
      expect(() => saveLeaderboard([], null)).not.toThrow()
      expect(() => addToLeaderboard(100, 'Test', null)).not.toThrow()
      expect(() => isHighScore(100, null)).not.toThrow()
    })
  })

  describe('formatDate', () => {
    it('should format ISO date string correctly', () => {
      const isoString = '2024-06-15T14:30:00.000Z'
      expect(formatDate(isoString)).toBe('2024-06-15')
    })

    it('should pad single digit months and days', () => {
      const isoString = '2024-01-05T00:00:00.000Z'
      expect(formatDate(isoString)).toBe('2024-01-05')
    })

    it('should handle end of year correctly', () => {
      const isoString = '2024-12-31T23:59:59.999Z'
      expect(formatDate(isoString)).toBe('2024-12-31')
    })
  })

  describe('Constants validation', () => {
    it('DIRECTIONS should have dx/dy for all four directions', () => {
      expect(DIRECTIONS.UP).toEqual({ dx: 0, dy: -1 })
      expect(DIRECTIONS.DOWN).toEqual({ dx: 0, dy: 1 })
      expect(DIRECTIONS.LEFT).toEqual({ dx: -1, dy: 0 })
      expect(DIRECTIONS.RIGHT).toEqual({ dx: 1, dy: 0 })
    })

    it('OPPOSITE_DIRECTIONS should map correctly for all directions', () => {
      expect(OPPOSITE_DIRECTIONS.UP).toBe('DOWN')
      expect(OPPOSITE_DIRECTIONS.DOWN).toBe('UP')
      expect(OPPOSITE_DIRECTIONS.LEFT).toBe('RIGHT')
      expect(OPPOSITE_DIRECTIONS.RIGHT).toBe('LEFT')
    })

    it('MOVE_INTERVAL_DECREMENT should be 10', () => {
      expect(MOVE_INTERVAL_DECREMENT).toBe(10)
    })

    it('POINTS_PER_LEVEL should be 50', () => {
      expect(POINTS_PER_LEVEL).toBe(50)
    })

    it('INITIAL_MOVE_INTERVAL should be greater than MIN_MOVE_INTERVAL', () => {
      expect(INITIAL_MOVE_INTERVAL).toBeGreaterThan(MIN_MOVE_INTERVAL)
    })
  })

  describe('isValidDirectionChange - edge cases', () => {
    it('should not allow reversing from DOWN to UP', () => {
      expect(isValidDirectionChange('DOWN', 'UP')).toBe(false)
    })

    it('should allow turning DOWN to LEFT or RIGHT', () => {
      expect(isValidDirectionChange('DOWN', 'LEFT')).toBe(true)
      expect(isValidDirectionChange('DOWN', 'RIGHT')).toBe(true)
    })

    it('should allow turning LEFT to UP or DOWN', () => {
      expect(isValidDirectionChange('LEFT', 'UP')).toBe(true)
      expect(isValidDirectionChange('LEFT', 'DOWN')).toBe(true)
    })

    it('should not allow reversing from LEFT to RIGHT', () => {
      expect(isValidDirectionChange('LEFT', 'RIGHT')).toBe(false)
    })
  })

  describe('wrapCoordinate - additional edge cases', () => {
    it('should handle GRID_SIZE * 2 correctly', () => {
      expect(wrapCoordinate(GRID_SIZE * 2)).toBe(0)
    })

    it('should handle negative wrap with large offset', () => {
      expect(wrapCoordinate(-GRID_SIZE - 3)).toBe(GRID_SIZE - 3)
    })

    it('should handle positive wrap with large offset', () => {
      expect(wrapCoordinate(GRID_SIZE * 3 + 7)).toBe(7)
    })
  })

  describe('moveSnake - additional scenarios', () => {
    it('should move snake down correctly', () => {
      const state = {
        snake: [{ x: 10, y: 10 }, { x: 10, y: 9 }, { x: 10, y: 8 }],
        direction: 'DOWN',
        food: { x: 15, y: 15 },
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = moveSnake(state)
      expect(result.newSnake[0]).toEqual({ x: 10, y: 11 })
      expect(result.newSnake.length).toBe(3)
      expect(result.ateFood).toBe(false)
    })

    it('should move snake left correctly', () => {
      const state = {
        snake: [{ x: 10, y: 10 }, { x: 11, y: 10 }, { x: 12, y: 10 }],
        direction: 'LEFT',
        food: { x: 15, y: 15 },
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = moveSnake(state)
      expect(result.newSnake[0]).toEqual({ x: 9, y: 10 })
    })

    it('should wrap left boundary in THROUGH_WALL mode', () => {
      const state = {
        snake: [{ x: 0, y: 5 }, { x: 1, y: 5 }],
        direction: 'LEFT',
        food: { x: 15, y: 15 },
        gameMode: GAME_MODE.THROUGH_WALL,
      }
      const result = moveSnake(state)
      expect(result.newHeadX).toBe(GRID_SIZE - 1)
    })

    it('should wrap top boundary in THROUGH_WALL mode', () => {
      const state = {
        snake: [{ x: 5, y: 0 }, { x: 5, y: 1 }],
        direction: 'UP',
        food: { x: 15, y: 15 },
        gameMode: GAME_MODE.THROUGH_WALL,
      }
      const result = moveSnake(state)
      expect(result.newHeadY).toBe(GRID_SIZE - 1)
    })

    it('should wrap bottom boundary in THROUGH_WALL mode', () => {
      const state = {
        snake: [{ x: 5, y: GRID_SIZE - 1 }, { x: 5, y: GRID_SIZE - 2 }],
        direction: 'DOWN',
        food: { x: 15, y: 15 },
        gameMode: GAME_MODE.THROUGH_WALL,
      }
      const result = moveSnake(state)
      expect(result.newHeadY).toBe(0)
    })

    it('should grow snake correctly when eating food on downward move', () => {
      const state = {
        snake: [{ x: 10, y: 10 }, { x: 10, y: 9 }],
        direction: 'DOWN',
        food: { x: 10, y: 11 },
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = moveSnake(state)
      expect(result.ateFood).toBe(true)
      expect(result.newSnake.length).toBe(3)
      expect(result.newSnake[2]).toEqual({ x: 10, y: 9 })
    })
  })

  describe('checkSelfCollision - additional edge cases', () => {
    it('should return false for 2-segment snake', () => {
      const snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }]
      expect(checkSelfCollision(snake)).toBe(false)
    })

    it('should detect collision when head hits 3rd body segment', () => {
      const snake = [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 6, y: 6 },
        { x: 5, y: 6 },
        { x: 5, y: 5 },
      ]
      expect(checkSelfCollision(snake)).toBe(true)
    })
  })

  describe('calculateLevel - boundary values', () => {
    it('should return level 1 at exact boundary before level 2', () => {
      expect(calculateLevel(POINTS_PER_LEVEL - 1)).toBe(1)
    })

    it('should return level 2 at exact level up threshold', () => {
      expect(calculateLevel(POINTS_PER_LEVEL)).toBe(2)
    })

    it('should return level 2 just after threshold', () => {
      expect(calculateLevel(POINTS_PER_LEVEL + 1)).toBe(2)
    })

    it('should return correct level for double threshold', () => {
      expect(calculateLevel(POINTS_PER_LEVEL * 2)).toBe(3)
    })
  })

  describe('calculateMoveInterval - using MOVE_INTERVAL_DECREMENT constant', () => {
    it('should decrement by exactly MOVE_INTERVAL_DECREMENT per level', () => {
      expect(calculateMoveInterval(2)).toBe(INITIAL_MOVE_INTERVAL - MOVE_INTERVAL_DECREMENT)
      expect(calculateMoveInterval(3)).toBe(INITIAL_MOVE_INTERVAL - 2 * MOVE_INTERVAL_DECREMENT)
      expect(calculateMoveInterval(4)).toBe(INITIAL_MOVE_INTERVAL - 3 * MOVE_INTERVAL_DECREMENT)
    })

    it('should reach exactly MIN_MOVE_INTERVAL at boundary level', () => {
      const stepsToMin = Math.floor((INITIAL_MOVE_INTERVAL - MIN_MOVE_INTERVAL) / MOVE_INTERVAL_DECREMENT)
      const boundaryLevel = stepsToMin + 1
      expect(calculateMoveInterval(boundaryLevel)).toBe(MIN_MOVE_INTERVAL)
    })

    it('should use MIN_MOVE_INTERVAL for all levels beyond max speed', () => {
      const stepsToMin = Math.floor((INITIAL_MOVE_INTERVAL - MIN_MOVE_INTERVAL) / MOVE_INTERVAL_DECREMENT)
      expect(calculateMoveInterval(stepsToMin + 2)).toBe(MIN_MOVE_INTERVAL)
      expect(calculateMoveInterval(stepsToMin + 50)).toBe(MIN_MOVE_INTERVAL)
    })
  })

  describe('gameTick - additional scenarios', () => {
    it('should not game over in THROUGH_WALL mode when hitting boundary', () => {
      const prevState = {
        snake: [{ x: 0, y: 10 }, { x: 1, y: 10 }],
        direction: 'LEFT',
        nextDirection: 'LEFT',
        food: { x: 15, y: 15 },
        score: 0,
        level: 1,
        gameMode: GAME_MODE.THROUGH_WALL,
      }
      const result = gameTick(prevState)
      expect(result.gameOver).toBe(false)
      expect(result.snake[0].x).toBe(GRID_SIZE - 1)
    })

    it('should still game over on self collision in THROUGH_WALL mode', () => {
      const prevState = {
        snake: [
          { x: 5, y: 5 },
          { x: 4, y: 5 },
          { x: 4, y: 6 },
          { x: 5, y: 6 },
          { x: 6, y: 6 },
          { x: 6, y: 5 },
        ],
        direction: 'DOWN',
        nextDirection: 'DOWN',
        food: { x: 15, y: 15 },
        score: 0,
        level: 1,
        gameMode: GAME_MODE.THROUGH_WALL,
      }
      const result = gameTick(prevState)
      expect(result.gameOver).toBe(true)
    })

    it('should regenerate food at non-snake position after eating', () => {
      const prevState = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        food: { x: 11, y: 10 },
        score: 0,
        level: 1,
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = gameTick(prevState)
      const snakeSet = new Set(result.snake.map(s => `${s.x},${s.y}`))
      expect(snakeSet.has(`${result.food.x},${result.food.y}`)).toBe(false)
    })

    it('should trigger level up at score boundary', () => {
      const prevState = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        food: { x: 11, y: 10 },
        score: POINTS_PER_LEVEL - SCORE_PER_FOOD,
        level: 1,
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = gameTick(prevState)
      expect(result.score).toBe(POINTS_PER_LEVEL)
      expect(result.level).toBe(2)
    })

    it('should not change nextDirection when it matches direction', () => {
      const prevState = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        food: { x: 15, y: 10 },
        score: 0,
        level: 1,
        gameMode: GAME_MODE.WALL_DEATH,
      }
      const result = gameTick(prevState)
      expect(result.direction).toBe('RIGHT')
      expect(result.nextDirection).toBe('RIGHT')
    })

    it('should move through multiple ticks in succession', () => {
      let state = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        food: { x: 18, y: 10 },
        score: 0,
        level: 1,
        gameMode: GAME_MODE.WALL_DEATH,
      }
      for (let i = 0; i < 5; i++) {
        state = gameTick(state)
        expect(state.gameOver).toBe(false)
      }
      expect(state.snake[0]).toEqual({ x: 15, y: 10 })
      expect(state.score).toBe(0)
      expect(state.level).toBe(1)
    })
  })

  describe('generateFood - additional scenarios', () => {
    it('should always return valid position when grid has free space', () => {
      const snake = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }]
      for (let i = 0; i < 100; i++) {
        const food = generateFood(snake)
        expect(food).not.toBeNull()
        expect(food.x).toBeGreaterThanOrEqual(0)
        expect(food.x).toBeLessThan(GRID_SIZE)
        expect(food.y).toBeGreaterThanOrEqual(0)
        expect(food.y).toBeLessThan(GRID_SIZE)
      }
    })

    it('should return food not on snake even for large snake', () => {
      const snake = []
      for (let x = 0; x < GRID_SIZE - 1; x++) {
        snake.push({ x, y: 0 })
      }
      for (let i = 0; i < 50; i++) {
        const food = generateFood(snake)
        const onSnake = snake.some(s => s.x === food.x && s.y === food.y)
        expect(onSnake).toBe(false)
      }
    })
  })

  describe('addToLeaderboard - additional scenarios', () => {
    let storage

    beforeEach(() => {
      storage = createMockStorage()
    })

    it('should return correct rank for new high score at top', () => {
      const result = addToLeaderboard(1000, 'TopPlayer', storage)
      expect(result.rank).toBe(1)
    })

    it('should return correct rank for entry in middle', () => {
      addToLeaderboard(300, 'Player1', storage)
      addToLeaderboard(100, 'Player2', storage)
      const result = addToLeaderboard(200, 'MiddlePlayer', storage)
      expect(result.rank).toBe(2)
    })

    it('should return negative rank when score does not make the leaderboard', () => {
      for (let i = 0; i < MAX_LEADERBOARD_ENTRIES; i++) {
        addToLeaderboard((MAX_LEADERBOARD_ENTRIES - i) * 100, `Player${i}`, storage)
      }
      const result = addToLeaderboard(10, 'LowScore', storage)
      expect(result.rank).toBe(-1)
    })

    it('should maintain sorted order after multiple additions', () => {
      addToLeaderboard(50, 'P1', storage)
      addToLeaderboard(200, 'P2', storage)
      addToLeaderboard(100, 'P3', storage)
      addToLeaderboard(150, 'P4', storage)
      const lb = loadLeaderboard(storage)
      for (let i = 0; i < lb.length - 1; i++) {
        expect(lb[i].score).toBeGreaterThanOrEqual(lb[i + 1].score)
      }
    })
  })

  describe('isHighScore - additional scenarios', () => {
    let storage

    beforeEach(() => {
      storage = createMockStorage()
    })

    it('should return true for empty leaderboard', () => {
      expect(isHighScore(1, storage)).toBe(true)
    })

    it('should return true when score ties with lowest and leaderboard full', () => {
      for (let i = 0; i < MAX_LEADERBOARD_ENTRIES; i++) {
        addToLeaderboard((i + 1) * 10, `P${i}`, storage)
      }
      const lowest = loadLeaderboard(storage)[MAX_LEADERBOARD_ENTRIES - 1].score
      expect(isHighScore(lowest, storage)).toBe(false)
    })

    it('should return true when score exactly one above lowest', () => {
      for (let i = 0; i < MAX_LEADERBOARD_ENTRIES; i++) {
        addToLeaderboard((i + 1) * 10, `P${i}`, storage)
      }
      const lowest = loadLeaderboard(storage)[MAX_LEADERBOARD_ENTRIES - 1].score
      expect(isHighScore(lowest + 1, storage)).toBe(true)
    })
  })

  describe('calculateScore - additional scenarios', () => {
    it('should add SCORE_PER_FOOD to large scores correctly', () => {
      expect(calculateScore(99990, true)).toBe(99990 + SCORE_PER_FOOD)
    })

    it('should handle 0 score without eating', () => {
      expect(calculateScore(0, false)).toBe(0)
    })
  })
})
