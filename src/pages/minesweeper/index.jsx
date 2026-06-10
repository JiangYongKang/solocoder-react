import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DIFFICULTY,
  DIFFICULTY_CONFIG,
  DIFFICULTY_LABELS,
  CELL_STATE,
  GAME_STATUS,
  NUMBER_COLORS,
  CELL_SIZE,
} from './constants.js'
import {
  initializeGame,
  revealCell,
  toggleFlag,
  getRemainingMines,
  revealAllMines,
  formatTime,
  loadLeaderboard,
  addToLeaderboard,
  formatDate,
  validateCustomConfig,
} from './minesweeperCore.js'
import './minesweeper.css'

function MinesweeperPage() {
  const navigate = useNavigate()

  const [difficulty, setDifficulty] = useState(DIFFICULTY.BEGINNER)
  const [customConfig, setCustomConfig] = useState({ rows: 10, cols: 10, mines: 15 })
  const [customError, setCustomError] = useState('')
  const [game, setGame] = useState(() => {
    const cfg = DIFFICULTY_CONFIG[DIFFICULTY.BEGINNER]
    return initializeGame(cfg.rows, cfg.cols, cfg.mines)
  })
  const [time, setTime] = useState(0)
  const [leaderboard, setLeaderboard] = useState(() => loadLeaderboard())
  const [currentRankInfo, setCurrentRankInfo] = useState(null)

  const timerRef = useRef(null)

  useEffect(() => {
    if (game.status === GAME_STATUS.PLAYING) {
      timerRef.current = setInterval(() => {
        setTime((t) => Math.min(t + 1, 999))
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [game.status])

  const startNewGame = useCallback((diff, custom = null) => {
    setCurrentRankInfo(null)
    setTime(0)
    let rows, cols, mines
    if (diff === DIFFICULTY.CUSTOM && custom) {
      rows = custom.rows
      cols = custom.cols
      mines = custom.mines
    } else {
      const cfg = DIFFICULTY_CONFIG[diff]
      rows = cfg.rows
      cols = cfg.cols
      mines = cfg.mines
    }
    setDifficulty(diff)
    setGame(initializeGame(rows, cols, mines))
  }, [])

  const handleDifficultyClick = (diff) => {
    if (diff === DIFFICULTY.CUSTOM) {
      setDifficulty(DIFFICULTY.CUSTOM)
      return
    }
    startNewGame(diff)
  }

  const handleCustomStart = () => {
    const rowsVal = parseInt(customConfig.rows, 10)
    const colsVal = parseInt(customConfig.cols, 10)
    const minesVal = parseInt(customConfig.mines, 10)
    const validation = validateCustomConfig(rowsVal, colsVal, minesVal)
    if (!validation.valid) {
      setCustomError(validation.error)
      return
    }
    setCustomError('')
    startNewGame(DIFFICULTY.CUSTOM, {
      rows: rowsVal,
      cols: colsVal,
      mines: minesVal,
    })
  }

  const handleCellClick = (row, col) => {
    if (game.status === GAME_STATUS.WON || game.status === GAME_STATUS.LOST) return

    const revealed = revealCell(game, row, col)

    if (revealed.status === GAME_STATUS.WON && !currentRankInfo) {
      const customCfg = difficulty === DIFFICULTY.CUSTOM
        ? { rows: game.rows, cols: game.cols, mines: game.mineCount }
        : null
      const result = addToLeaderboard(difficulty, time, undefined, customCfg)
      setLeaderboard(result.leaderboard)
      if (result.rank > 0) {
        setCurrentRankInfo({ rank: result.rank, date: result.date })
      }
      setGame(revealed)
      return
    }

    if (revealed.status === GAME_STATUS.LOST) {
      setGame(revealAllMines(revealed))
      return
    }

    setGame(revealed)
  }

  const handleCellRightClick = (e, row, col) => {
    e.preventDefault()
    if (game.status === GAME_STATUS.WON || game.status === GAME_STATUS.LOST) return
    setGame((g) => toggleFlag(g, row, col))
  }

  const renderCell = (cell) => {
    const { row, col, state, isMine, neighborMines } = cell
    const isHitMine = game.hitMine && game.hitMine.row === row && game.hitMine.col === col

    let content = null
    let className = 'ms-cell'

    if (state === CELL_STATE.HIDDEN) {
      className += ' ms-cell-hidden'
    } else if (state === CELL_STATE.FLAGGED) {
      className += ' ms-cell-flagged'
      content = <span className="ms-flag">🚩</span>
    } else if (state === CELL_STATE.REVEALED) {
      className += ' ms-cell-revealed'
      if (isMine) {
        className += isHitMine ? ' ms-cell-mine-hit' : ' ms-cell-mine'
        content = <span className="ms-mine">💣</span>
      } else if (neighborMines > 0) {
        content = (
          <span className="ms-number" style={{ color: NUMBER_COLORS[neighborMines] }}>
            {neighborMines}
          </span>
        )
      }
    }

    if (game.status === GAME_STATUS.LOST && state === CELL_STATE.FLAGGED && !isMine) {
      className += ' ms-cell-wrong-flag'
      content = <span className="ms-wrong-flag">❌</span>
    }

    return (
      <div
        key={`${row}-${col}`}
        className={className}
        onClick={() => handleCellClick(row, col)}
        onContextMenu={(e) => handleCellRightClick(e, row, col)}
      >
        {content}
      </div>
    )
  }

  const getDifficultyName = () => {
    if (difficulty === DIFFICULTY.CUSTOM) {
      return `自定义 (${game.rows}×${game.cols}, ${game.mineCount}雷)`
    }
    return DIFFICULTY_LABELS[difficulty]
  }

  const allDifficulties = [
    { key: DIFFICULTY.BEGINNER, name: DIFFICULTY_CONFIG[DIFFICULTY.BEGINNER].name },
    { key: DIFFICULTY.INTERMEDIATE, name: DIFFICULTY_CONFIG[DIFFICULTY.INTERMEDIATE].name },
    { key: DIFFICULTY.EXPERT, name: DIFFICULTY_CONFIG[DIFFICULTY.EXPERT].name },
    { key: DIFFICULTY.CUSTOM, name: '自定义' },
  ]

  return (
    <div className="ms-page">
      <div className="ms-header">
        <div className="ms-header-left">
          <button className="ms-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="ms-title">扫雷游戏</h1>
        </div>
        <button
          className="ms-new-game-btn"
          onClick={() =>
            startNewGame(difficulty, difficulty === DIFFICULTY.CUSTOM ? customConfig : null)
          }
        >
          新游戏
        </button>
      </div>

      <div className="ms-main">
        <div className="ms-game-section">
          <div className="ms-difficulty-bar">
            {[DIFFICULTY.BEGINNER, DIFFICULTY.INTERMEDIATE, DIFFICULTY.EXPERT].map((diff) => (
              <button
                key={diff}
                className={`ms-diff-btn ${difficulty === diff ? 'active' : ''}`}
                onClick={() => handleDifficultyClick(diff)}
              >
                {DIFFICULTY_CONFIG[diff].name}
              </button>
            ))}
            <button
              className={`ms-diff-btn ${difficulty === DIFFICULTY.CUSTOM ? 'active' : ''}`}
              onClick={() => handleDifficultyClick(DIFFICULTY.CUSTOM)}
            >
              自定义
            </button>
          </div>

          {difficulty === DIFFICULTY.CUSTOM && (
            <div className="ms-custom-config">
              <label>
                行数:
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={customConfig.rows}
                  onChange={(e) => setCustomConfig({ ...customConfig, rows: e.target.value })}
                />
              </label>
              <label>
                列数:
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={customConfig.cols}
                  onChange={(e) => setCustomConfig({ ...customConfig, cols: e.target.value })}
                />
              </label>
              <label>
                雷数:
                <input
                  type="number"
                  min="1"
                  value={customConfig.mines}
                  onChange={(e) => setCustomConfig({ ...customConfig, mines: e.target.value })}
                />
              </label>
              <button className="ms-custom-start-btn" onClick={handleCustomStart}>
                开始
              </button>
              {customError && <span className="ms-custom-error">{customError}</span>}
            </div>
          )}

          <div className="ms-difficulty-label">
            当前难度：<span>{getDifficultyName()}</span>
          </div>

          <div className="ms-status-bar">
            <div className="ms-counter">
              <span className="ms-counter-icon">💣</span>
              <span className="ms-counter-value">{getRemainingMines(game)}</span>
            </div>
            <div
              className={`ms-face ${
                game.status === GAME_STATUS.WON
                  ? 'ms-face-win'
                  : game.status === GAME_STATUS.LOST
                  ? 'ms-face-lose'
                  : ''
              }`}
              onClick={() =>
                startNewGame(difficulty, difficulty === DIFFICULTY.CUSTOM ? customConfig : null)
              }
            >
              {game.status === GAME_STATUS.WON ? '😎' : game.status === GAME_STATUS.LOST ? '😵' : '🙂'}
            </div>
            <div className="ms-counter">
              <span className="ms-counter-icon">⏱️</span>
              <span className="ms-counter-value">{formatTime(time)}</span>
            </div>
          </div>

          <div className="ms-board-container">
            <div
              className="ms-board"
              style={{
                gridTemplateColumns: `repeat(${game.cols}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${game.rows}, ${CELL_SIZE}px)`,
              }}
            >
              {game.board.flat().map((cell) => renderCell(cell))}
            </div>

            {game.status === GAME_STATUS.WON && (
              <div className="ms-overlay">
                <div className="ms-overlay-title">🎉 恭喜通关！</div>
                <div className="ms-overlay-info">用时：{formatTime(time)}</div>
                {currentRankInfo && currentRankInfo.rank > 0 && (
                  <div className="ms-overlay-rank">🏆 排行榜第 {currentRankInfo.rank} 名！</div>
                )}
                <button
                  className="ms-overlay-btn"
                  onClick={() =>
                    startNewGame(difficulty, difficulty === DIFFICULTY.CUSTOM ? customConfig : null)
                  }
                >
                  再来一局
                </button>
              </div>
            )}

            {game.status === GAME_STATUS.LOST && (
              <div className="ms-overlay">
                <div className="ms-overlay-title ms-overlay-lose">💥 游戏结束</div>
                <div className="ms-overlay-info">踩到雷了！</div>
                <button
                  className="ms-overlay-btn"
                  onClick={() =>
                    startNewGame(difficulty, difficulty === DIFFICULTY.CUSTOM ? customConfig : null)
                  }
                >
                  重新开始
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="ms-side-panel">
          <div className="ms-panel">
            <div className="ms-panel-title">操作说明</div>
            <div className="ms-controls">
              <div>
                <span className="ms-key">左键</span> 翻开格子
              </div>
              <div>
                <span className="ms-key">右键</span> 插旗/取消
              </div>
              <div>
                <span className="ms-key">表情</span> 重新开始
              </div>
            </div>
          </div>

          <div className="ms-panel">
            <div className="ms-panel-title">排行榜</div>
            <div className="ms-leaderboard">
              {allDifficulties.map(({ key: diff, name }) => (
                <div key={diff} className="ms-lb-group">
                  <div className="ms-lb-group-title">{name}</div>
                  {leaderboard[diff] && leaderboard[diff].length > 0 ? (
                    <div className="ms-lb-list">
                      {leaderboard[diff].map((entry, idx) => (
                        <div
                          key={idx}
                          className={`ms-lb-item ${
                            currentRankInfo &&
                            currentRankInfo.rank === idx + 1 &&
                            entry.date === currentRankInfo.date &&
                            difficulty === diff
                              ? 'ms-lb-highlight'
                              : ''
                          }`}
                        >
                          <span className="ms-lb-rank">{idx + 1}.</span>
                          <span className="ms-lb-time">{formatTime(entry.time)}</span>
                          <span className="ms-lb-date">
                            {diff === DIFFICULTY.CUSTOM && entry.rows
                              ? `${entry.rows}×${entry.cols}/${entry.mines}雷 · ${formatDate(entry.date)}`
                              : formatDate(entry.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ms-lb-empty">暂无记录</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MinesweeperPage
