import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GRID_SIZE,
  CELL_SIZE,
  GAME_STATUS,
  GAME_MODE,
  SNAKE_HEAD_COLOR,
  SNAKE_BODY_COLOR,
  FOOD_COLOR,
  GRID_LINE_COLOR,
  BG_COLOR,
  INITIAL_MOVE_INTERVAL,
} from './constants.js'
import {
  createInitialState,
  gameTick,
  isValidDirectionChange,
  calculateMoveInterval,
  loadLeaderboard,
  addToLeaderboard,
  isHighScore,
  formatDate,
} from './snakeCore.js'
import './snake.css'

function SnakePage() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const lastMoveRef = useRef(0)
  const animFrameRef = useRef(null)

  const [gameState, setGameState] = useState(() => createInitialState())
  const [status, setStatus] = useState(GAME_STATUS.READY)
  const [leaderboard, setLeaderboard] = useState(() => loadLeaderboard())
  const [showNameInput, setShowNameInput] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [currentRankInfo, setCurrentRankInfo] = useState(null)

  const stateRef = useRef({ gameState, status })

  useEffect(() => {
    stateRef.current = { gameState, status }
  }, [gameState, status])

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { gameState: state } = stateRef.current

    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = GRID_LINE_COLOR
    ctx.setLineDash([3, 3])
    ctx.lineWidth = 1
    for (let x = 0; x <= GRID_SIZE; x++) {
      ctx.beginPath()
      ctx.moveTo(x * CELL_SIZE, 0)
      ctx.lineTo(x * CELL_SIZE, GRID_SIZE * CELL_SIZE)
      ctx.stroke()
    }
    for (let y = 0; y <= GRID_SIZE; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * CELL_SIZE)
      ctx.lineTo(GRID_SIZE * CELL_SIZE, y * CELL_SIZE)
      ctx.stroke()
    }
    ctx.setLineDash([])

    if (state.food) {
      const fx = state.food.x * CELL_SIZE
      const fy = state.food.y * CELL_SIZE
      ctx.fillStyle = FOOD_COLOR
      ctx.beginPath()
      ctx.arc(fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.beginPath()
      ctx.arc(fx + CELL_SIZE / 3, fy + CELL_SIZE / 3, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    state.snake.forEach((segment, index) => {
      const x = segment.x * CELL_SIZE
      const y = segment.y * CELL_SIZE
      const padding = 1

      ctx.fillStyle = index === 0 ? SNAKE_HEAD_COLOR : SNAKE_BODY_COLOR
      ctx.beginPath()
      ctx.roundRect(x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2, 4)
      ctx.fill()

      if (index === 0) {
        ctx.fillStyle = '#fff'
        const eyeSize = 4
        const eyeOffset = 6
        const { direction } = state

        if (direction === 'UP' || direction === 'DOWN') {
          ctx.beginPath()
          ctx.arc(x + eyeOffset, y + CELL_SIZE / 2, eyeSize, 0, Math.PI * 2)
          ctx.arc(x + CELL_SIZE - eyeOffset, y + CELL_SIZE / 2, eyeSize, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(x + CELL_SIZE / 2, y + eyeOffset, eyeSize, 0, Math.PI * 2)
          ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = '#000'
        const pupilOffset = direction === 'DOWN' || direction === 'RIGHT' ? 2 : -2
        if (direction === 'UP' || direction === 'DOWN') {
          ctx.beginPath()
          ctx.arc(x + eyeOffset, y + CELL_SIZE / 2 + pupilOffset, 2, 0, Math.PI * 2)
          ctx.arc(x + CELL_SIZE - eyeOffset, y + CELL_SIZE / 2 + pupilOffset, 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(x + CELL_SIZE / 2 + pupilOffset, y + eyeOffset, 2, 0, Math.PI * 2)
          ctx.arc(x + CELL_SIZE / 2 + pupilOffset, y + CELL_SIZE - eyeOffset, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    })
  }, [])

  const handleDirectionChange = useCallback((newDir) => {
    const { gameState: state, status: st } = stateRef.current
    if (st !== GAME_STATUS.PLAYING) return

    if (isValidDirectionChange(state.direction, newDir)) {
      setGameState((prev) => ({
        ...prev,
        nextDirection: newDir,
      }))
    }
  }, [])

  const togglePause = useCallback(() => {
    const { status: st } = stateRef.current
    if (st === GAME_STATUS.PLAYING) {
      setStatus(GAME_STATUS.PAUSED)
    } else if (st === GAME_STATUS.PAUSED) {
      lastMoveRef.current = performance.now()
      setStatus(GAME_STATUS.PLAYING)
    }
  }, [])

  const startNewGame = useCallback((mode = null) => {
    const initial = createInitialState()
    if (mode) {
      initial.gameMode = mode
    }
    setGameState(initial)
    setStatus(GAME_STATUS.PLAYING)
    setShowNameInput(false)
    setPlayerName('')
    setCurrentRankInfo(null)
    lastMoveRef.current = performance.now()
  }, [])

  const handleGameOver = useCallback(() => {
    setStatus(GAME_STATUS.GAME_OVER)
    const { gameState: state } = stateRef.current
    if (isHighScore(state.score)) {
      setShowNameInput(true)
    }
  }, [])

  const handleSaveScore = useCallback(() => {
    const name = playerName.trim() || '匿名玩家'
    const { gameState: state } = stateRef.current
    const result = addToLeaderboard(state.score, name)
    setLeaderboard(result.leaderboard)
    if (result.rank > 0) {
      setCurrentRankInfo({ rank: result.rank, date: result.date })
    }
    setShowNameInput(false)
  }, [playerName])

  const handleKeyDown = useCallback((e) => {
    const { status: st } = stateRef.current

    if (e.key === 'p' || e.key === 'P' || e.key === ' ') {
      e.preventDefault()
      if (st === GAME_STATUS.PLAYING || st === GAME_STATUS.PAUSED) {
        togglePause()
      }
      return
    }

    if (st === GAME_STATUS.GAME_OVER && e.key === 'Enter') {
      e.preventDefault()
      if (showNameInput) {
        handleSaveScore()
      } else {
        startNewGame(gameState.gameMode)
      }
      return
    }

    if (st !== GAME_STATUS.PLAYING) return

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault()
        handleDirectionChange('UP')
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault()
        handleDirectionChange('DOWN')
        break
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault()
        handleDirectionChange('LEFT')
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault()
        handleDirectionChange('RIGHT')
        break
    }
  }, [togglePause, handleDirectionChange, startNewGame, showNameInput, handleSaveScore, gameState.gameMode])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    const gameLoop = (time) => {
      const { gameState: state, status: st } = stateRef.current

      if (st === GAME_STATUS.PLAYING) {
        const interval = calculateMoveInterval(state.level)
        if (time - lastMoveRef.current >= interval) {
          setGameState((prev) => {
            const next = gameTick(prev)
            if (next.gameOver) {
              setTimeout(handleGameOver, 0)
            }
            return next
          })
          lastMoveRef.current = time
        }
      }

      drawGame()
      animFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animFrameRef.current = requestAnimationFrame(gameLoop)
    lastMoveRef.current = performance.now()

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [drawGame, handleGameOver])

  const handleModeChange = useCallback((mode) => {
    if (status === GAME_STATUS.PLAYING) return
    setGameState((prev) => ({
      ...prev,
      gameMode: mode,
    }))
  }, [status])

  const canvasSize = GRID_SIZE * CELL_SIZE

  return (
    <div className="snake-page">
      <div className="snake-header">
        <div className="snake-header-left">
          <button className="snake-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="snake-title">贪吃蛇游戏</h1>
        </div>
        <button className="snake-new-game-btn" onClick={() => startNewGame(gameState.gameMode)}>
          新游戏
        </button>
      </div>

      <div className="snake-main">
        <div className="snake-game-section">
          <div className="snake-mode-bar">
            <button
              className={`snake-mode-btn ${gameState.gameMode === GAME_MODE.WALL_DEATH ? 'active' : ''}`}
              onClick={() => handleModeChange(GAME_MODE.WALL_DEATH)}
              disabled={status === GAME_STATUS.PLAYING}
            >
              边界死亡
            </button>
            <button
              className={`snake-mode-btn ${gameState.gameMode === GAME_MODE.THROUGH_WALL ? 'active' : ''}`}
              onClick={() => handleModeChange(GAME_MODE.THROUGH_WALL)}
              disabled={status === GAME_STATUS.PLAYING}
            >
              穿墙模式
            </button>
          </div>

          <div className="snake-info-bar">
            <div className="snake-info-item">
              <span className="snake-info-label">得分</span>
              <span className="snake-info-value">{gameState.score}</span>
            </div>
            <div className="snake-info-item">
              <span className="snake-info-label">等级</span>
              <span className="snake-info-value">{gameState.level}</span>
            </div>
            <div className="snake-info-item">
              <span className="snake-info-label">速度</span>
              <span className="snake-info-value">{INITIAL_MOVE_INTERVAL - (gameState.level - 1) * 10}ms</span>
            </div>
            <div className="snake-info-item">
              <span className="snake-info-label">长度</span>
              <span className="snake-info-value">{gameState.snake.length}</span>
            </div>
          </div>

          <div className="snake-canvas-wrapper">
            <canvas
              ref={canvasRef}
              className="snake-canvas"
              width={canvasSize}
              height={canvasSize}
            />

            {status === GAME_STATUS.PAUSED && (
              <div className="snake-overlay">
                <div className="snake-overlay-title">暂停中</div>
                <div className="snake-overlay-hint">按空格键或 P 键继续</div>
              </div>
            )}

            {status === GAME_STATUS.GAME_OVER && (
              <div className="snake-overlay">
                <div className="snake-overlay-title game-over">游戏结束</div>
                <div className="snake-overlay-score">最终得分：{gameState.score}</div>
                {currentRankInfo && currentRankInfo.rank > 0 && (
                  <div className="snake-overlay-highlight">
                    🏆 排行榜第 {currentRankInfo.rank} 名！
                  </div>
                )}
                {showNameInput ? (
                  <>
                    <div className="snake-overlay-highlight">🎉 恭喜进入排行榜！</div>
                    <input
                      type="text"
                      className="snake-name-input"
                      placeholder="请输入昵称"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      maxLength={12}
                      autoFocus
                    />
                    <button className="snake-restart-btn" onClick={handleSaveScore}>
                      保存成绩
                    </button>
                  </>
                ) : (
                  <button
                    className="snake-restart-btn"
                    onClick={() => startNewGame(gameState.gameMode)}
                  >
                    再来一局
                  </button>
                )}
                <div className="snake-overlay-hint">或按回车键继续</div>
              </div>
            )}
          </div>
        </div>

        <div className="snake-side-panel">
          <div className="snake-panel">
            <div className="snake-panel-title">操作说明</div>
            <div className="snake-controls-panel">
              <div>
                <span className="snake-control-key">↑</span>
                <span className="snake-control-key">W</span>
                向上
              </div>
              <div>
                <span className="snake-control-key">↓</span>
                <span className="snake-control-key">S</span>
                向下
              </div>
              <div>
                <span className="snake-control-key">←</span>
                <span className="snake-control-key">A</span>
                向左
              </div>
              <div>
                <span className="snake-control-key">→</span>
                <span className="snake-control-key">D</span>
                向右
              </div>
              <div>
                <span className="snake-control-key">Space</span>
                <span className="snake-control-key">P</span>
                暂停
              </div>
            </div>
          </div>

          <div className="snake-panel">
            <div className="snake-panel-title">排行榜</div>
            {leaderboard.length > 0 ? (
              <div className="snake-leaderboard-list">
                {leaderboard.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`snake-lb-item ${
                      currentRankInfo &&
                      currentRankInfo.rank === idx + 1 &&
                      entry.date === currentRankInfo.date
                        ? 'highlight'
                        : ''
                    }`}
                  >
                    <span className="snake-lb-rank">{idx + 1}.</span>
                    <span className="snake-lb-name">{entry.name}</span>
                    <span className="snake-lb-score">{entry.score}</span>
                    <span className="snake-lb-date">{formatDate(entry.date)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="snake-lb-empty">暂无记录</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SnakePage
