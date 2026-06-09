import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  CELL_SIZE,
  PREVIEW_GRID_SIZE,
  PREVIEW_CELL_SIZE,
  TETROMINO_COLORS,
} from './constants.js'
import {
  createEmptyBoard,
  randomTetrominoType,
  createPiece,
  rotatePiece,
  checkCollision,
  mergePieceToBoard,
  clearCompletedLines,
  calculateScore,
  calculateLevel,
  getDropInterval,
  movePiece,
  getGhostY,
  hardDrop,
  loadHighScore,
  saveHighScore,
} from './tetrisCore.js'
import './tetris.css'

const GAME_STATUS = {
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
}

function TetrisPage() {
  const navigate = useNavigate()
  const boardCanvasRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const lastDropRef = useRef(0)

  const initialNext = createPiece(randomTetrominoType())
  const initialCurrent = createPiece(randomTetrominoType())

  const [board, setBoard] = useState(() => createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState(initialCurrent)
  const [nextPiece, setNextPiece] = useState(initialNext)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [highScore, setHighScore] = useState(() => loadHighScore())
  const [status, setStatus] = useState(GAME_STATUS.PLAYING)
  const [isNewRecord, setIsNewRecord] = useState(false)

  const stateRef = useRef({ board, currentPiece, nextPiece, score, lines, level, status })

  useEffect(() => {
    stateRef.current = { board, currentPiece, nextPiece, score, lines, level, status }
  }, [board, currentPiece, nextPiece, score, lines, level, status])

  useEffect(() => {
    lastDropRef.current = performance.now()
  }, [])

  const drawCell = useCallback((ctx, x, y, color, size) => {
    const px = x * size
    const py = y * size
    ctx.fillStyle = color
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fillRect(px + 1, py + 1, size - 2, 3)
    ctx.fillRect(px + 1, py + 1, 3, size - 2)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(px + 1, py + size - 4, size - 2, 3)
    ctx.fillRect(px + size - 4, py + 1, 3, size - 2)
  }, [])

  const drawBoard = useCallback(() => {
    const canvas = boardCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { board: currentBoard, currentPiece: piece } = stateRef.current

    ctx.fillStyle = '#0f0f1e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
    ctx.setLineDash([2, 4])
    ctx.lineWidth = 1
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath()
      ctx.moveTo(x * CELL_SIZE, 0)
      ctx.lineTo(x * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE)
      ctx.stroke()
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * CELL_SIZE)
      ctx.lineTo(BOARD_WIDTH * CELL_SIZE, y * CELL_SIZE)
      ctx.stroke()
    }
    ctx.setLineDash([])

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = currentBoard[y][x]
        if (cell) {
          drawCell(ctx, x, y, TETROMINO_COLORS[cell], CELL_SIZE)
        }
      }
    }

    if (piece) {
      const ghostY = getGhostY(currentBoard, piece)
      for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
          if (piece.shape[row][col]) {
            const x = piece.x + col
            const y = ghostY + row
            if (y >= 0) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
              const px = x * CELL_SIZE
              const py = y * CELL_SIZE
              ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
            }
          }
        }
      }
    }

    if (piece) {
      for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
          if (piece.shape[row][col]) {
            const x = piece.x + col
            const y = piece.y + row
            if (y >= 0) {
              drawCell(ctx, x, y, TETROMINO_COLORS[piece.type], CELL_SIZE)
            }
          }
        }
      }
    }
  }, [drawCell])

  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { nextPiece: piece } = stateRef.current

    ctx.fillStyle = '#0f0f1e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
    ctx.setLineDash([2, 4])
    ctx.lineWidth = 1
    for (let x = 0; x <= PREVIEW_GRID_SIZE; x++) {
      ctx.beginPath()
      ctx.moveTo(x * PREVIEW_CELL_SIZE, 0)
      ctx.lineTo(x * PREVIEW_CELL_SIZE, PREVIEW_GRID_SIZE * PREVIEW_CELL_SIZE)
      ctx.stroke()
    }
    for (let y = 0; y <= PREVIEW_GRID_SIZE; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * PREVIEW_CELL_SIZE)
      ctx.lineTo(PREVIEW_GRID_SIZE * PREVIEW_CELL_SIZE, y * PREVIEW_CELL_SIZE)
      ctx.stroke()
    }
    ctx.setLineDash([])

    if (!piece) return

    const shape = piece.shape
    const offsetX = Math.floor((PREVIEW_GRID_SIZE - shape[0].length) / 2)
    const offsetY = Math.floor((PREVIEW_GRID_SIZE - shape.length) / 2)

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          drawCell(ctx, offsetX + col, offsetY + row, TETROMINO_COLORS[piece.type], PREVIEW_CELL_SIZE)
        }
      }
    }
  }, [drawCell])

  const spawnPiece = useCallback(() => {
    const { nextPiece } = stateRef.current
    const newCurrent = nextPiece || createPiece(randomTetrominoType())
    const newNext = createPiece(randomTetrominoType())

    if (checkCollision(stateRef.current.board, newCurrent)) {
      const finalScore = stateRef.current.score
      const currentHigh = loadHighScore()
      const newRecord = finalScore > currentHigh
      if (newRecord) {
        saveHighScore(finalScore)
        setHighScore(finalScore)
      }
      setIsNewRecord(newRecord)
      setStatus(GAME_STATUS.GAME_OVER)
      return
    }

    setCurrentPiece(newCurrent)
    setNextPiece(newNext)
  }, [])

  const lockPiece = useCallback(() => {
    const { board: b, currentPiece: piece, score: s, lines: l } = stateRef.current
    if (!piece) return

    const merged = mergePieceToBoard(b, piece)
    const { board: clearedBoard, clearedCount } = clearCompletedLines(merged)

    setBoard(clearedBoard)

    if (clearedCount > 0) {
      const newLines = l + clearedCount
      const newScore = s + calculateScore(clearedCount)
      const newLevel = calculateLevel(newLines)
      setLines(newLines)
      setScore(newScore)
      setLevel(newLevel)
    }

    spawnPiece()
  }, [spawnPiece])

  const tryMove = useCallback((dx, dy) => {
    const { board: b, currentPiece: piece, status: st } = stateRef.current
    if (st !== GAME_STATUS.PLAYING || !piece) return false
    if (!checkCollision(b, piece, dx, dy)) {
      setCurrentPiece(movePiece(piece, dx, dy))
      return true
    }
    if (dy > 0) {
      lockPiece()
    }
    return false
  }, [lockPiece])

  const tryRotate = useCallback(() => {
    const { board: b, currentPiece: piece, status: st } = stateRef.current
    if (st !== GAME_STATUS.PLAYING || !piece) return
    const rotated = rotatePiece(piece)
    const kicks = [0, -1, 1, -2, 2]
    for (const kick of kicks) {
      if (!checkCollision(b, { ...rotated, x: rotated.x + kick })) {
        setCurrentPiece({ ...rotated, x: rotated.x + kick })
        return
      }
    }
  }, [])

  const doHardDrop = useCallback(() => {
    const { board: b, currentPiece: piece, status: st, score: s, lines: l } = stateRef.current
    if (st !== GAME_STATUS.PLAYING || !piece) return
    const { board: mergedBoard } = hardDrop(b, piece)
    const { board: clearedBoard, clearedCount } = clearCompletedLines(mergedBoard)
    setBoard(clearedBoard)
    setCurrentPiece(null)
    if (clearedCount > 0) {
      const newLines = l + clearedCount
      const newScore = s + calculateScore(clearedCount)
      const newLevel = calculateLevel(newLines)
      setLines(newLines)
      setScore(newScore)
      setLevel(newLevel)
    }
    setTimeout(() => spawnPiece(), 0)
  }, [spawnPiece])

  const startNewGame = useCallback(() => {
    const newBoard = createEmptyBoard()
    const firstNext = createPiece(randomTetrominoType())
    const firstCurrent = createPiece(randomTetrominoType())
    setBoard(newBoard)
    setCurrentPiece(firstCurrent)
    setNextPiece(firstNext)
    setScore(0)
    setLines(0)
    setLevel(1)
    setIsNewRecord(false)
    setStatus(GAME_STATUS.PLAYING)
    lastDropRef.current = performance.now()
  }, [])

  const togglePause = useCallback(() => {
    const { status: st } = stateRef.current
    if (st === GAME_STATUS.PLAYING) {
      setStatus(GAME_STATUS.PAUSED)
    } else if (st === GAME_STATUS.PAUSED) {
      lastDropRef.current = performance.now()
      setStatus(GAME_STATUS.PLAYING)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      const { status: st } = stateRef.current
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        togglePause()
        return
      }
      if (st === GAME_STATUS.GAME_OVER && e.key === 'Enter') {
        e.preventDefault()
        startNewGame()
        return
      }
      if (st !== GAME_STATUS.PLAYING) return

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          tryMove(-1, 0)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          tryMove(1, 0)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          tryMove(0, 1)
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          tryRotate()
          break
        case ' ':
          e.preventDefault()
          doHardDrop()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tryMove, tryRotate, doHardDrop, togglePause, startNewGame])

  useEffect(() => {
    let animId
    const loop = (time) => {
      const { status: st, level: lv } = stateRef.current
      if (st === GAME_STATUS.PLAYING) {
        const interval = getDropInterval(lv)
        if (time - lastDropRef.current >= interval) {
          tryMove(0, 1)
          lastDropRef.current = time
        }
      }
      drawBoard()
      drawPreview()
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [drawBoard, drawPreview, tryMove])

  return (
    <div className="tetris-page">
      <div className="tetris-header">
        <div className="tetris-header-left">
          <button className="tetris-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="tetris-title">俄罗斯方块</h1>
        </div>
        <button className="tetris-new-game-btn" onClick={startNewGame}>
          新游戏
        </button>
      </div>

      <div className="tetris-main">
        <div className="tetris-game-area">
          <canvas
            ref={boardCanvasRef}
            className="tetris-board-canvas"
            width={BOARD_WIDTH * CELL_SIZE}
            height={BOARD_HEIGHT * CELL_SIZE}
          />
          {status === GAME_STATUS.PAUSED && (
            <div className="tetris-overlay">
              <div className="tetris-overlay-title">暂停中</div>
              <div className="tetris-overlay-hint">按 P 键继续</div>
            </div>
          )}
          {status === GAME_STATUS.GAME_OVER && (
            <div className="tetris-overlay">
              <div className="tetris-overlay-title">游戏结束</div>
              <div className="tetris-overlay-score">最终得分：{score}</div>
              {isNewRecord && <div className="tetris-overlay-new-record">新纪录！</div>}
              <button className="tetris-restart-btn" onClick={startNewGame}>
                重新开始
              </button>
              <div className="tetris-overlay-hint">或按回车键重新开始</div>
            </div>
          )}
        </div>

        <div className="tetris-side-panel">
          <div className="tetris-panel">
            <div className="tetris-panel-title">下一个</div>
            <canvas
              ref={previewCanvasRef}
              className="tetris-preview-canvas"
              width={PREVIEW_GRID_SIZE * PREVIEW_CELL_SIZE}
              height={PREVIEW_GRID_SIZE * PREVIEW_CELL_SIZE}
            />
          </div>

          <div className="tetris-panel">
            <div className="tetris-panel-title">游戏信息</div>
            <div className="tetris-info-row">
              <span className="tetris-info-label">得分</span>
              <span className="tetris-info-value">{score}</span>
            </div>
            <div className="tetris-info-row">
              <span className="tetris-info-label">等级</span>
              <span className="tetris-info-value">{level}</span>
            </div>
            <div className="tetris-info-row">
              <span className="tetris-info-label">消行</span>
              <span className="tetris-info-value">{lines}</span>
            </div>
            <div className="tetris-info-row">
              <span className="tetris-info-label">最高分</span>
              <span className="tetris-info-value tetris-high-score">{highScore}</span>
            </div>
          </div>

          <div className="tetris-panel">
            <div className="tetris-panel-title">操作说明</div>
            <div className="tetris-controls-panel">
              <div><span className="tetris-control-key">←</span><span className="tetris-control-key">→</span> 左右移动</div>
              <div><span className="tetris-control-key">A</span><span className="tetris-control-key">D</span> 左右移动</div>
              <div><span className="tetris-control-key">↓</span><span className="tetris-control-key">S</span> 加速下落</div>
              <div><span className="tetris-control-key">↑</span><span className="tetris-control-key">W</span> 旋转</div>
              <div><span className="tetris-control-key">Space</span> 硬降</div>
              <div><span className="tetris-control-key">P</span> 暂停</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TetrisPage
