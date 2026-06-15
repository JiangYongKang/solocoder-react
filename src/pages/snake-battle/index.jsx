import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SIZE,
  SEGMENT_SIZE,
  HEAD_SIZE,
  GAME_SPEEDS,
  PLAYER_RESPAWN_DELAY,
  MINIMAP_WIDTH,
  MINIMAP_HEIGHT,
  BG_COLOR,
  GRID_COLOR,
} from './constants.js'
import {
  moveSnake,
  growSnake,
  checkBoundaryCollision,
  checkAnySnakeCollision,
  checkFoodCollision,
  snakeBodyToFoods,
  decideAIDirection,
  sortLeaderboard,
  respawnSnake,
  generateOneFood,
  canChangeDirection,
  resetIdCounter,
  createInitialAISnakes,
  createPlayerSnake,
  generateInitialFoods,
} from './snakeBattleCore.js'
import './snake-battle.css'

const SPEED_KEYS = ['SLOW', 'NORMAL', 'FAST']

function SnakeBattlePage() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const minimapCanvasRef = useRef(null)
  const animRef = useRef(null)
  const lastMoveRef = useRef(0)
  const stateRef = useRef(null)

  const [speedKey, setSpeedKey] = useState('NORMAL')
  const [paused, setPaused] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [playerInfo, setPlayerInfo] = useState({ rank: '-', length: 3 })
  const [minimapBlink, setMinimapBlink] = useState(true)

  const updateLeaderboard = useCallback((state) => {
    const allSnakes = [state.player, ...state.aiSnakes]
    const sorted = sortLeaderboard(allSnakes)
    setLeaderboard(sorted)
    const playerEntry = sorted.find((s) => s.isPlayer)
    if (playerEntry) {
      setPlayerInfo({ rank: playerEntry.rank, length: playerEntry.length })
    }
  }, [])

  const resetGame = useCallback(() => {
    resetIdCounter()
    const state = {
      player: createPlayerSnake(),
      aiSnakes: createInitialAISnakes(),
      foods: generateInitialFoods(),
    }
    stateRef.current = state
    lastMoveRef.current = performance.now()
    updateLeaderboard(state)
  }, [updateLeaderboard])

  useEffect(() => {
    const id = requestAnimationFrame(() => resetGame())
    return () => cancelAnimationFrame(id)
  }, [resetGame])

  useEffect(() => {
    const interval = setInterval(() => {
      setMinimapBlink((b) => !b)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const drawBackground = useCallback((ctx) => {
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.strokeStyle = GRID_COLOR
    ctx.lineWidth = 1
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
    }
  }, [])

  const drawFood = useCallback((ctx, food) => {
    ctx.beginPath()
    ctx.arc(food.x, food.y, food.size / 2, 0, Math.PI * 2)
    ctx.fillStyle = food.color
    ctx.fill()
    ctx.shadowColor = food.color
    ctx.shadowBlur = 8
    ctx.fill()
    ctx.shadowBlur = 0
  }, [])

  const drawSnakeSegment = useCallback((ctx, x, y, color, size) => {
    const half = size / 2
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, half, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  const drawSnakeEyes = useCallback((ctx, headX, headY, direction, headSize) => {
    const dir = {
      UP: { x: 0, y: -1 },
      DOWN: { x: 0, y: 1 },
      LEFT: { x: -1, y: 0 },
      RIGHT: { x: 1, y: 0 },
    }[direction] || { x: 1, y: 0 }

    const eyeOffset = headSize * 0.3
    const eyeSize = 3
    const pupilSize = 1.5

    let perpX = -dir.y
    let perpY = dir.x

    const eye1X = headX + dir.x * eyeOffset * 0.6 + perpX * eyeOffset
    const eye1Y = headY + dir.y * eyeOffset * 0.6 + perpY * eyeOffset
    const eye2X = headX + dir.x * eyeOffset * 0.6 - perpX * eyeOffset
    const eye2Y = headY + dir.y * eyeOffset * 0.6 - perpY * eyeOffset

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2)
    ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.arc(eye1X + dir.x * 0.8, eye1Y + dir.y * 0.8, pupilSize, 0, Math.PI * 2)
    ctx.arc(eye2X + dir.x * 0.8, eye2Y + dir.y * 0.8, pupilSize, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  const drawSnake = useCallback((ctx, snake) => {
    if (!snake.alive) return
    for (let i = snake.body.length - 1; i >= 1; i--) {
      const seg = snake.body[i]
      drawSnakeSegment(ctx, seg.x, seg.y, snake.color, SEGMENT_SIZE)
    }
    const head = snake.body[0]
    drawSnakeSegment(ctx, head.x, head.y, snake.headColor, HEAD_SIZE)
    drawSnakeEyes(ctx, head.x, head.y, snake.direction, HEAD_SIZE)
  }, [drawSnakeSegment, drawSnakeEyes])

  const drawMinimap = useCallback(() => {
    const canvas = minimapCanvasRef.current
    if (!canvas || !stateRef.current) return
    const ctx = canvas.getContext('2d')
    const scaleX = MINIMAP_WIDTH / CANVAS_WIDTH
    const scaleY = MINIMAP_HEIGHT / CANVAS_HEIGHT

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'
    ctx.strokeRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT)

    const { player, aiSnakes } = stateRef.current
    const drawDot = (snake, isPlayer) => {
      if (!snake.alive) return
      const x = snake.body[0].x * scaleX
      const y = snake.body[0].y * scaleY
      const size = isPlayer ? (minimapBlink ? 6 : 4) : 3
      ctx.fillStyle = snake.color
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
      if (isPlayer) {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    aiSnakes.forEach((s) => drawDot(s, false))
    drawDot(player, true)
  }, [minimapBlink])

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !stateRef.current) return
    const ctx = canvas.getContext('2d')

    drawBackground(ctx)

    for (const food of stateRef.current.foods) {
      drawFood(ctx, food)
    }

    for (const ai of stateRef.current.aiSnakes) {
      drawSnake(ctx, ai)
    }
    drawSnake(ctx, stateRef.current.player)

    if (paused) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = '#f8fafc'
      ctx.font = 'bold 48px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('已暂停', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.font = '18px system-ui, sans-serif'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('点击"继续"按钮恢复游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
    }

    drawMinimap()
  }, [drawBackground, drawFood, drawSnake, drawMinimap, paused])

  const gameTick = useCallback((now) => {
    const state = stateRef.current
    if (!state) return
    const speed = GAME_SPEEDS[speedKey]
    const interval = 1000 / (speed.fps / 2)

    if (paused || now - lastMoveRef.current < interval) {
      return
    }
    lastMoveRef.current = now

    if (state.player.alive) {
      state.player = moveSnake(state.player)
      let dead = false
      if (checkBoundaryCollision(state.player)) {
        dead = true
      }
      const playerAllSnakes = [state.player, ...state.aiSnakes]
      if (!dead && checkAnySnakeCollision(state.player, playerAllSnakes)) {
        dead = true
      }
      if (dead) {
        state.player.alive = false
        state.player.respawnAt = now + PLAYER_RESPAWN_DELAY
        state.foods.push(...snakeBodyToFoods(state.player))
      } else {
        const foodIdx = checkFoodCollision(state.player, state.foods)
        if (foodIdx !== null) {
          state.foods.splice(foodIdx, 1)
          state.player = growSnake(state.player)
          state.foods.push(generateOneFood())
        }
      }
    } else if (state.player.respawnAt && now >= state.player.respawnAt) {
      state.player = respawnSnake(state.player, true)
    }

    for (let i = 0; i < state.aiSnakes.length; i++) {
      const ai = state.aiSnakes[i]
      if (ai.alive) {
        const allSnakesSnapshot = [state.player, ...state.aiSnakes]
        const decision = decideAIDirection(ai, allSnakesSnapshot, state.foods, now)
        ai.nextDirection = decision.direction
        ai.aiBehavior = decision.behavior
        if (decision.updated) {
          ai.lastDecisionAt = now
        }
        state.aiSnakes[i] = moveSnake(ai)

        let dead = false
        if (checkBoundaryCollision(state.aiSnakes[i])) {
          dead = true
        }
        const allForCollision = [state.player, ...state.aiSnakes]
        if (!dead && checkAnySnakeCollision(state.aiSnakes[i], allForCollision)) {
          dead = true
        }
        if (dead) {
          state.aiSnakes[i].alive = false
          state.aiSnakes[i].respawnAt = now + PLAYER_RESPAWN_DELAY
          state.foods.push(...snakeBodyToFoods(state.aiSnakes[i]))
        } else {
          const foodIdx = checkFoodCollision(state.aiSnakes[i], state.foods)
          if (foodIdx !== null) {
            state.foods.splice(foodIdx, 1)
            state.aiSnakes[i] = growSnake(state.aiSnakes[i])
            state.foods.push(generateOneFood())
          }
        }
      } else if (ai.respawnAt && now >= ai.respawnAt) {
        state.aiSnakes[i] = respawnSnake(ai, false)
      }
    }

    updateLeaderboard(state)
  }, [speedKey, paused, updateLeaderboard])

  useEffect(() => {
    const loop = (time) => {
      gameTick(time)
      drawGame()
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [gameTick, drawGame])

  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = stateRef.current
      if (!state || !state.player.alive) return
      const keyMap = {
        ArrowUp: 'UP',
        w: 'UP',
        W: 'UP',
        ArrowDown: 'DOWN',
        s: 'DOWN',
        S: 'DOWN',
        ArrowLeft: 'LEFT',
        a: 'LEFT',
        A: 'LEFT',
        ArrowRight: 'RIGHT',
        d: 'RIGHT',
        D: 'RIGHT',
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        setPaused((p) => !p)
        return
      }
      const newDir = keyMap[e.key]
      if (!newDir) return
      e.preventDefault()
      if (canChangeDirection(state.player.direction, newDir)) {
        state.player.nextDirection = newDir
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="snake-battle-page">
      <div className="snake-battle-header">
        <div className="snake-battle-header-left">
          <button className="snake-battle-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="snake-battle-title">贪吃蛇大作战</h1>
        </div>
        <div className="snake-battle-toolbar">
          <div className="speed-controls">
            <span className="toolbar-label">速度：</span>
            {SPEED_KEYS.map((key) => (
              <button
                key={key}
                className={`speed-btn ${speedKey === key ? 'active' : ''}`}
                onClick={() => setSpeedKey(key)}
              >
                {GAME_SPEEDS[key].label}
              </button>
            ))}
          </div>
          <button
            className="pause-btn"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? '继续' : '暂停'}
          </button>
          <button className="reset-btn" onClick={resetGame}>
            重新开始
          </button>
        </div>
      </div>

      <div className="snake-battle-main">
        <div className="snake-battle-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="snake-battle-canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          />
          <canvas
            ref={minimapCanvasRef}
            className="snake-battle-minimap"
            width={MINIMAP_WIDTH}
            height={MINIMAP_HEIGHT}
          />
        </div>

        <div className="snake-battle-side">
          <div className="player-info-card">
            <div className="player-info-title">我的状态</div>
            <div className="player-info-row">
              <span className="player-info-label">排名</span>
              <span className="player-info-value player-rank">第 {playerInfo.rank} 名</span>
            </div>
            <div className="player-info-row">
              <span className="player-info-label">长度</span>
              <span className="player-info-value">{playerInfo.length} 节</span>
            </div>
          </div>

          <div className="leaderboard-card">
            <div className="leaderboard-title">击杀榜</div>
            <div className="leaderboard-list">
              {leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className={`leaderboard-item ${entry.isPlayer ? 'is-player' : ''} ${!entry.alive ? 'is-dead' : ''}`}
                >
                  <div className="leaderboard-rank">#{entry.rank}</div>
                  <div
                    className="leaderboard-color"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="leaderboard-name">
                    {entry.name}
                    {!entry.alive && <span className="dead-tag"> (阵亡)</span>}
                  </div>
                  <div className="leaderboard-length">{entry.length}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="controls-card">
            <div className="controls-title">操作说明</div>
            <div className="controls-row">
              <span className="key">↑</span><span className="key">W</span> 向上
            </div>
            <div className="controls-row">
              <span className="key">↓</span><span className="key">S</span> 向下
            </div>
            <div className="controls-row">
              <span className="key">←</span><span className="key">A</span> 向左
            </div>
            <div className="controls-row">
              <span className="key">→</span><span className="key">D</span> 向右
            </div>
            <div className="controls-row">
              <span className="key">P</span> 暂停/继续
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SnakeBattlePage
