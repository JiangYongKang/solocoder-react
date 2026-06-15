import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GRID_SIZE, ANIMATION_DURATION } from './constants.js'
import {
  initializeGame,
  move,
  addRandomTile,
  canMove,
  hasWon,
  loadHighScore,
  saveHighScore,
  createUndoState,
  addToUndoStack,
  canUndo,
  undo,
} from './game2048Core.js'
import './game-2048.css'

const CELL_SIZE = 100
const CELL_GAP = 12

function getTilePosition(row, col) {
  return {
    x: col * (CELL_SIZE + CELL_GAP),
    y: row * (CELL_SIZE + CELL_GAP),
  }
}

function getTileClass(value) {
  if (value <= 2048) {
    return `game-2048-tile-${value}`
  }
  return 'game-2048-tile-super'
}

function gridToTilesWithId(grid, prevTiles, startId) {
  const newTiles = []
  const tileMap = new Map()

  prevTiles.forEach((tile) => {
    tileMap.set(`${tile.row}-${tile.col}`, tile)
  })

  let idCounter = startId

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = grid[row][col]
      if (value !== 0) {
        const existingTile = tileMap.get(`${row}-${col}`)
        if (existingTile && existingTile.value === value) {
          newTiles.push({ ...existingTile, isNew: false, isMerged: false })
        } else {
          idCounter++
          newTiles.push({
            id: idCounter,
            row,
            col,
            value,
            isNew: true,
            isMerged: false,
          })
        }
      }
    }
  }

  return { tiles: newTiles, nextId: idCounter }
}

function Game2048Page() {
  const navigate = useNavigate()
  const initialState = initializeGame()
  const initialTileData = gridToTilesWithId(initialState.grid, [], 0)
  const [gameState, setGameState] = useState(initialState)
  const [highScore, setHighScore] = useState(() => loadHighScore())
  const [undoStack, setUndoStack] = useState([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [showWinModal, setShowWinModal] = useState(false)
  const [tiles, setTiles] = useState(initialTileData.tiles)
  const tileIdRef = useRef(initialTileData.nextId)

  const stateRef = useRef({ gameState, highScore, undoStack, isAnimating })

  useEffect(() => {
    stateRef.current = { gameState, highScore, undoStack, isAnimating }
  }, [gameState, highScore, undoStack, isAnimating])

  const updateGameAndTiles = useCallback((newGameState) => {
    setTiles((prevTiles) => {
      const result = gridToTilesWithId(newGameState.grid, prevTiles, tileIdRef.current)
      tileIdRef.current = result.nextId
      return result.tiles
    })
    setGameState(newGameState)
  }, [])

  const handleMove = useCallback((direction) => {
    const { gameState: currentState, undoStack: currentStack, isAnimating: animating } = stateRef.current
    if (animating) return
    if (currentState.gameOver) return

    const undoState = createUndoState(
      currentState.grid,
      currentState.score,
      currentState.won,
      currentState.continueAfterWin
    )

    const { grid: movedGrid, scoreGained, moved } = move(currentState.grid, direction)

    if (!moved) return

    setIsAnimating(true)
    setUndoStack(addToUndoStack(currentStack, undoState))

    setTimeout(() => {
      const newGrid = addRandomTile(movedGrid)
      const newScore = currentState.score + scoreGained
      const won = hasWon(newGrid)
      const gameOver = !canMove(newGrid)

      const continueAfterWin = currentState.continueAfterWin
      const showWin = won && !continueAfterWin

      const newGameState = {
        grid: newGrid,
        score: newScore,
        gameOver,
        won,
        continueAfterWin,
      }

      updateGameAndTiles(newGameState)

      if (gameOver) {
        const currentHighScore = stateRef.current.highScore
        if (newScore > currentHighScore) {
          saveHighScore(newScore)
          setHighScore(newScore)
          setIsNewRecord(true)
          setTimeout(() => setIsNewRecord(false), 2000)
        }
      }

      if (showWin) {
        setShowWinModal(true)
      }

      setTimeout(() => {
        setIsAnimating(false)
      }, ANIMATION_DURATION)
    }, ANIMATION_DURATION)
  }, [updateGameAndTiles])

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          handleMove('up')
          break
        case 'ArrowDown':
          e.preventDefault()
          handleMove('down')
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleMove('left')
          break
        case 'ArrowRight':
          e.preventDefault()
          handleMove('right')
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleMove])

  const touchStartRef = useRef({ x: 0, y: 0 })

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback((e) => {
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const minSwipeDistance = 30

    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      return
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        handleMove('right')
      } else {
        handleMove('left')
      }
    } else {
      if (deltaY > 0) {
        handleMove('down')
      } else {
        handleMove('up')
      }
    }
  }, [handleMove])

  const startNewGame = useCallback(() => {
    const newGameState = initializeGame()
    const tileData = gridToTilesWithId(newGameState.grid, [], 0)
    tileIdRef.current = tileData.nextId
    setTiles(tileData.tiles)
    setGameState(newGameState)
    setUndoStack([])
    setIsNewRecord(false)
    setShowWinModal(false)
  }, [])

  const handleUndo = useCallback(() => {
    const { undoStack: currentStack } = stateRef.current
    if (!canUndo(currentStack)) return

    const { state: prevState, newStack } = undo(currentStack)
    if (!prevState) return

    setUndoStack(newStack)
    const newGameState = {
      grid: prevState.grid,
      score: prevState.score,
      gameOver: false,
      won: prevState.won,
      continueAfterWin: prevState.continueAfterWin,
    }
    updateGameAndTiles(newGameState)
    setShowWinModal(false)
  }, [updateGameAndTiles])

  const handleContinue = useCallback(() => {
    setShowWinModal(false)
    setGameState((prev) => ({
      ...prev,
      continueAfterWin: true,
    }))
  }, [])

  return (
    <div className="game-2048-page">
      <div className="game-2048-header">
        <h1 className="game-2048-title">2048</h1>
        <div className="game-2048-scores">
          <div className="game-2048-score-box">
            <div className="game-2048-score-label">得分</div>
            <div className="game-2048-score-value">{gameState.score}</div>
          </div>
          <div className="game-2048-score-box">
            <div className="game-2048-score-label">最高分</div>
            <div className="game-2048-score-value">{highScore}</div>
            {isNewRecord && <div className="game-2048-new-record">新纪录！</div>}
          </div>
        </div>
      </div>

      <div className="game-2048-subheader">
        <div className="game-2048-subtitle">合并数字，达到 2048！</div>
        <div className="game-2048-buttons">
          <button
            className="game-2048-btn"
            onClick={handleUndo}
            disabled={!canUndo(undoStack) || isAnimating}
          >
            撤销
          </button>
          <button className="game-2048-btn" onClick={startNewGame}>
            新游戏
          </button>
        </div>
      </div>

      <div
        className="game-2048-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="game-2048-grid">
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
            <div key={i} className="game-2048-cell" />
          ))}
        </div>
        <div className="game-2048-tiles">
          {tiles.map((tile) => {
            const pos = getTilePosition(tile.row, tile.col)
            const tileClass = getTileClass(tile.value)
            let className = `game-2048-tile ${tileClass}`
            if (tile.isNew) className += ' game-2048-tile-new'
            if (tile.isMerged) className += ' game-2048-tile-merged'

            return (
              <div
                key={tile.id}
                className={className}
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                }}
              >
                {tile.value}
              </div>
            )
          })}
        </div>

        {showWinModal && (
          <div className="game-2048-overlay game-2048-overlay-won">
            <div className="game-2048-overlay-title">恭喜达到 2048！</div>
            <div className="game-2048-overlay-buttons">
              <button className="game-2048-btn" onClick={handleContinue}>
                继续挑战
              </button>
              <button className="game-2048-btn" onClick={startNewGame}>
                重新开始
              </button>
            </div>
          </div>
        )}

        {gameState.gameOver && !showWinModal && (
          <div className="game-2048-overlay">
            <div className="game-2048-overlay-title">游戏结束</div>
            <div className="game-2048-overlay-title" style={{ fontSize: '24px' }}>
              最终得分：{gameState.score}
            </div>
            {isNewRecord && <div className="game-2048-new-record">新纪录！</div>}
            <button className="game-2048-btn" onClick={startNewGame} style={{ marginTop: '20px' }}>
              重新开始
            </button>
          </div>
        )}
      </div>

      <div className="game-2048-footer">
        <p>使用方向键或滑动来移动方块</p>
        <button className="game-2048-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
      </div>
    </div>
  )
}

export default Game2048Page
