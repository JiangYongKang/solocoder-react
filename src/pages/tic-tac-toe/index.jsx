import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BOARD_SIZES, GAME_MODE, PLAYERS, AI_DELAY_MIN, AI_DELAY_MAX } from './constants.js'
import {
  createEmptyBoard,
  getGameStatus,
  getAIMove,
  loadHistory,
  addGameResult,
  clearHistory,
  formatDate,
} from './gameCore.js'
import './tic-tac-toe.css'

const CELL_SIZES = { 3: 72, 4: 60, 5: 52 }
const PADDING = 36
const PIECE_R = { 3: 22, 4: 18, 5: 15 }

function TicTacToePage() {
  const navigate = useNavigate()
  const aiTimerRef = useRef(null)

  const [boardSize, setBoardSize] = useState(3)
  const [mode, setMode] = useState(GAME_MODE.PVE)
  const [board, setBoard] = useState(() => createEmptyBoard(3))
  const [currentPlayer, setCurrentPlayer] = useState(PLAYERS.X)
  const [moveHistory, setMoveHistory] = useState([])
  const [gameResult, setGameResult] = useState(null)
  const [winningLine, setWinningLine] = useState(null)
  const [aiThinking, setAiThinking] = useState(false)
  const [history, setHistory] = useState(() => loadHistory())

  const gameOver = gameResult !== null

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    }
  }, [])

  const resetGame = useCallback((size, gameMode) => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    setBoardSize(size)
    setMode(gameMode)
    setBoard(createEmptyBoard(size))
    setCurrentPlayer(PLAYERS.X)
    setMoveHistory([])
    setGameResult(null)
    setWinningLine(null)
    setAiThinking(false)
  }, [])

  const handleSizeChange = useCallback((size) => {
    resetGame(size, mode)
  }, [mode, resetGame])

  const handleModeChange = useCallback((newMode) => {
    resetGame(boardSize, newMode)
  }, [boardSize, resetGame])

  const handleCellClick = useCallback((row, col) => {
    if (gameOver || aiThinking) return
    if (board[row][col] !== null) return
    if (mode === GAME_MODE.PVE && currentPlayer === PLAYERS.O) return

    const newBoard = board.map(r => [...r])
    newBoard[row][col] = currentPlayer
    const newMoveHistory = [...moveHistory, { row, col, player: currentPlayer }]

    const status = getGameStatus(newBoard, boardSize)
    if (status.over) {
      setBoard(newBoard)
      setMoveHistory(newMoveHistory)
      setGameResult(status.winner)
      setWinningLine(status.line)
      const result = status.winner === 'draw' ? 'draw' : status.winner
      addGameResult({ boardSize, mode, result, totalMoves: newMoveHistory.length })
      setHistory(loadHistory())
      return
    }

    setBoard(newBoard)
    setMoveHistory(newMoveHistory)
    const nextPlayer = currentPlayer === PLAYERS.X ? PLAYERS.O : PLAYERS.X
    setCurrentPlayer(nextPlayer)

    if (mode === GAME_MODE.PVE && nextPlayer === PLAYERS.O) {
      setAiThinking(true)
      const delay = AI_DELAY_MIN + Math.random() * (AI_DELAY_MAX - AI_DELAY_MIN)
      aiTimerRef.current = setTimeout(() => {
        const aiMove = getAIMove(newBoard, boardSize, PLAYERS.O, PLAYERS.X)
        if (!aiMove) {
          setAiThinking(false)
          return
        }

        const aiBoard = newBoard.map(r => [...r])
        aiBoard[aiMove.row][aiMove.col] = PLAYERS.O
        const aiMoveHistory = [...newMoveHistory, { row: aiMove.row, col: aiMove.col, player: PLAYERS.O }]

        const aiStatus = getGameStatus(aiBoard, boardSize)
        if (aiStatus.over) {
          setBoard(aiBoard)
          setMoveHistory(aiMoveHistory)
          setGameResult(aiStatus.winner)
          setWinningLine(aiStatus.line)
          setAiThinking(false)
          const result = aiStatus.winner === 'draw' ? 'draw' : aiStatus.winner
          addGameResult({ boardSize, mode, result, totalMoves: aiMoveHistory.length })
          setHistory(loadHistory())
          return
        }

        setBoard(aiBoard)
        setMoveHistory(aiMoveHistory)
        setCurrentPlayer(PLAYERS.X)
        setAiThinking(false)
      }, delay)
    }
  }, [board, boardSize, currentPlayer, gameOver, aiThinking, mode, moveHistory])

  const handleUndo = useCallback(() => {
    if (gameOver || aiThinking) return
    if (moveHistory.length === 0) return

    let undoCount = 1
    if (mode === GAME_MODE.PVE) {
      if (moveHistory.length >= 2 && moveHistory[moveHistory.length - 1].player === PLAYERS.O) {
        undoCount = 2
      } else if (moveHistory.length >= 2) {
        undoCount = 2
      }
    }

    const newMoveHistory = moveHistory.slice(0, moveHistory.length - undoCount)
    const newBoard = createEmptyBoard(boardSize)
    for (const move of newMoveHistory) {
      newBoard[move.row][move.col] = move.player
    }

    const nextPlayer = newMoveHistory.length > 0
      ? (newMoveHistory[newMoveHistory.length - 1].player === PLAYERS.X ? PLAYERS.O : PLAYERS.X)
      : PLAYERS.X

    if (mode === GAME_MODE.PVE && nextPlayer === PLAYERS.O && newMoveHistory.length > 0) {
      const correctedPlayer = PLAYERS.X
      setBoard(newBoard)
      setMoveHistory(newMoveHistory)
      setCurrentPlayer(correctedPlayer)
    } else {
      setBoard(newBoard)
      setMoveHistory(newMoveHistory)
      setCurrentPlayer(nextPlayer)
    }
  }, [gameOver, aiThinking, moveHistory, mode, boardSize])

  const handleClearHistory = useCallback(() => {
    clearHistory()
    setHistory([])
  }, [])

  const handleNewGame = useCallback(() => {
    resetGame(boardSize, mode)
  }, [boardSize, mode, resetGame])

  const isWinCell = (row, col) => {
    if (!winningLine) return false
    return winningLine.some(c => c.row === row && c.col === col)
  }

  const isDrawGame = gameResult === 'draw'

  const svgParams = useMemo(() => {
    const cellSize = CELL_SIZES[boardSize] || 60
    const pieceR = PIECE_R[boardSize] || 18
    const boardPx = PADDING * 2 + cellSize * (boardSize - 1)
    return { cellSize, pieceR, boardPx }
  }, [boardSize])

  const getIntersectionCoords = useCallback((row, col) => {
    const { cellSize } = svgParams
    return {
      x: PADDING + col * cellSize,
      y: PADDING + row * cellSize,
    }
  }, [svgParams])

  const renderPiece = (row, col) => {
    const value = board[row][col]
    if (!value) return null
    const { x, y } = getIntersectionCoords(row, col)
    const { pieceR } = svgParams
    const isWin = isWinCell(row, col)
    const isDrawCell = isDrawGame

    let cls = 'ttt-piece'
    if (value === PLAYERS.X) cls += ' x-piece'
    if (value === PLAYERS.O) cls += ' o-piece'
    if (isWin) cls += ' ttt-winning'
    if (isDrawCell) cls += ' ttt-draw'

    if (value === PLAYERS.X) {
      return (
        <g key={`p-${row}-${col}`} className={cls}>
          <line
            x1={x - pieceR * 0.7} y1={y - pieceR * 0.7}
            x2={x + pieceR * 0.7} y2={y + pieceR * 0.7}
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <line
            x1={x + pieceR * 0.7} y1={y - pieceR * 0.7}
            x2={x - pieceR * 0.7} y2={y + pieceR * 0.7}
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      )
    } else {
      return (
        <g key={`p-${row}-${col}`} className={cls}>
          <circle
            cx={x} cy={y} r={pieceR * 0.7}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
          />
        </g>
      )
    }
  }

  const renderClickTargets = () => {
    const targets = []
    const { pieceR } = svgParams
    const hitR = pieceR * 1.1
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const { x, y } = getIntersectionCoords(row, col)
        const isOccupied = board[row][col] !== null
        const isDisabled = gameOver || aiThinking
        targets.push(
          <circle
            key={`t-${row}-${col}`}
            cx={x}
            cy={y}
            r={hitR}
            fill="transparent"
            className={`ttt-hit-target ${isOccupied ? 'occupied' : ''} ${isDisabled ? 'disabled' : ''}`}
            onClick={() => handleCellClick(row, col)}
            style={{ cursor: (isDisabled || isOccupied) ? 'default' : 'pointer' }}
          />
        )
      }
    }
    return targets
  }

  const renderBoardSVG = () => {
    const { cellSize, boardPx } = svgParams
    const lines = []

    for (let i = 0; i < boardSize; i++) {
      const y = PADDING + i * cellSize
      lines.push(
        <line
          key={`h-${i}`}
          x1={PADDING} y1={y}
          x2={boardPx - PADDING} y2={y}
          stroke="#475569"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )
    }

    for (let i = 0; i < boardSize; i++) {
      const x = PADDING + i * cellSize
      lines.push(
        <line
          key={`v-${i}`}
          x1={x} y1={PADDING}
          x2={x} y2={boardPx - PADDING}
          stroke="#475569"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )
    }

    const pieces = []
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        if (board[r][c]) pieces.push(renderPiece(r, c))
      }
    }

    return (
      <svg
        width={boardPx}
        height={boardPx}
        className="ttt-board-svg"
        viewBox={`0 0 ${boardPx} ${boardPx}`}
      >
        <rect x="0" y="0" width={boardPx} height={boardPx} fill="#1e293b" rx="8" />
        <g>{lines}</g>
        <g>{renderClickTargets()}</g>
        <g>{pieces}</g>
      </svg>
    )
  }

  const turnText = () => {
    if (gameOver) return ''
    if (aiThinking) {
      return (
        <>
          <span className="o-turn">AI 思考中</span>
          <span className="ttt-ai-thinking">
            <span></span><span></span><span></span>
          </span>
        </>
      )
    }
    const cls = currentPlayer === PLAYERS.X ? 'x-turn' : 'o-turn'
    const label = currentPlayer === PLAYERS.X ? 'X' : 'O'
    const suffix = mode === GAME_MODE.PVE ? (currentPlayer === PLAYERS.X ? '（你）' : '（AI）') : ''
    return <span className={cls}>轮到 {label} 方落子{suffix}</span>
  }

  const resultLabel = () => {
    if (!gameResult) return ''
    if (gameResult === 'draw') return '平局！'
    if (gameResult === PLAYERS.X) {
      return mode === GAME_MODE.PVE ? '你赢了！' : 'X 方获胜！'
    }
    return mode === GAME_MODE.PVE ? 'AI 获胜！' : 'O 方获胜！'
  }

  const resultCls = () => {
    if (gameResult === 'draw') return 'draw-result'
    if (gameResult === PLAYERS.X) return 'x-wins'
    return 'o-wins'
  }

  return (
    <div className="ttt-page">
      <div className="ttt-header">
        <div className="ttt-header-left">
          <button className="ttt-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="ttt-title">井字棋</h1>
        </div>
      </div>

      <div className="ttt-main">
        <div className="ttt-game-section">
          <div className="ttt-bar">
            {BOARD_SIZES.map(s => (
              <button
                key={s}
                className={`ttt-bar-btn ${boardSize === s ? 'active' : ''}`}
                onClick={() => handleSizeChange(s)}
              >
                {s}×{s}
              </button>
            ))}
          </div>

          <div className="ttt-bar">
            <button
              className={`ttt-bar-btn ${mode === GAME_MODE.PVE ? 'active' : ''}`}
              onClick={() => handleModeChange(GAME_MODE.PVE)}
            >
              人机对战
            </button>
            <button
              className={`ttt-bar-btn ${mode === GAME_MODE.PVP ? 'active' : ''}`}
              onClick={() => handleModeChange(GAME_MODE.PVP)}
            >
              双人对战
            </button>
          </div>

          <div className="ttt-turn-info">
            {turnText()}
          </div>

          <div className="ttt-board-container">
            {renderBoardSVG()}

            {gameOver && (
              <div className="ttt-overlay">
                <div className={`ttt-overlay-title ${resultCls()}`}>
                  {resultLabel()}
                </div>
                <div className="ttt-overlay-subtitle">
                  {gameResult === 'draw' ? '棋盘已满，不分胜负' : `共 ${moveHistory.length} 步`}
                </div>
                <button className="ttt-overlay-btn" onClick={handleNewGame}>
                  再来一局
                </button>
              </div>
            )}
          </div>

          <div className="ttt-actions">
            <button
              className="ttt-action-btn"
              onClick={handleUndo}
              disabled={moveHistory.length === 0 || gameOver || aiThinking}
            >
              悔棋
            </button>
            <button
              className="ttt-action-btn ttt-new-game-btn"
              onClick={handleNewGame}
            >
              新游戏
            </button>
          </div>
        </div>

        <div className="ttt-side-panel">
          <div className="ttt-panel">
            <div className="ttt-panel-header">
              <div className="ttt-panel-title">历史战绩</div>
              {history.length > 0 && (
                <button className="ttt-clear-btn" onClick={handleClearHistory}>
                  清空
                </button>
              )}
            </div>
            {history.length > 0 ? (
              <div className="ttt-history-list">
                {history.map((entry, idx) => {
                  const resultCls = entry.result === PLAYERS.X ? 'x-win'
                    : entry.result === PLAYERS.O ? 'o-win' : 'draw-label'
                  const resultText = entry.result === 'draw' ? '平局'
                    : `${entry.result} 胜`
                  const modeText = entry.mode === GAME_MODE.PVE ? '人机' : '双人'
                  return (
                    <div key={idx} className="ttt-history-item">
                      <span className={`ttt-history-result ${resultCls}`}>{resultText}</span>
                      <span className="ttt-history-detail">
                        {entry.boardSize}×{entry.boardSize} {modeText} {entry.totalMoves}步
                      </span>
                      <span className="ttt-history-date">{formatDate(entry.date)}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="ttt-history-empty">暂无记录</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicTacToePage
