import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DIFFICULTY,
  DIFFICULTY_CONFIG,
  MAX_SHUFFLES,
  CELL_SIZE,
  BORDER_PADDING,
} from './constants.js'
import {
  createGrid,
  findPath,
  eliminatePair,
  isGameComplete,
  findHintPair,
  shuffleRemainingIcons,
  hasAnyValidPair,
  formatTime,
  calculateScore,
  loadLeaderboard,
  addToLeaderboard,
  formatDate,
} from './linkGameCore.js'
import './link-game.css'

const GAME_STATUS = {
  SETUP: 'setup',
  PLAYING: 'playing',
  COMPLETE: 'complete',
}

function LinkGamePage() {
  const navigate = useNavigate()

  const [gameStatus, setGameStatus] = useState(GAME_STATUS.SETUP)
  const [difficulty, setDifficulty] = useState(DIFFICULTY.NORMAL)
  const [customRows, setCustomRows] = useState(8)
  const [customCols, setCustomCols] = useState(8)

  const [grid, setGrid] = useState(null)
  const [rows, setRows] = useState(0)
  const [cols, setCols] = useState(0)

  const [selected, setSelected] = useState(null)
  const [eliminating, setEliminating] = useState(new Set())
  const [shaking, setShaking] = useState(null)
  const [hintPair, setHintPair] = useState(null)
  const [pathPoints, setPathPoints] = useState(null)

  const [elapsedTime, setElapsedTime] = useState(0)
  const [steps, setSteps] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [shufflesUsed, setShufflesUsed] = useState(0)
  const [shufflesRemaining, setShufflesRemaining] = useState(MAX_SHUFFLES)

  const [leaderboard, setLeaderboard] = useState(() => loadLeaderboard())
  const [leaderboardTab, setLeaderboardTab] = useState(DIFFICULTY.NORMAL)
  const [currentEntry, setCurrentEntry] = useState(null)
  const [isNewRecord, setIsNewRecord] = useState(false)

  const timerRef = useRef(null)
  const pathTimeoutRef = useRef(null)
  const hintTimeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pathTimeoutRef.current) clearTimeout(pathTimeoutRef.current)
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current)
    }
  }, [])

  const startGame = useCallback(() => {
    let r, c
    if (difficulty === DIFFICULTY.CUSTOM) {
      r = Math.max(4, Math.min(12, customRows))
      c = Math.max(4, Math.min(12, customCols))
      if (r % 2 !== 0) r += 1
      if (c % 2 !== 0) c += 1
    } else {
      const config = DIFFICULTY_CONFIG[difficulty]
      r = config.rows
      c = config.cols
    }

    const newGrid = createGrid(r, c)
    setGrid(newGrid)
    setRows(r)
    setCols(c)
    setSelected(null)
    setEliminating(new Set())
    setShaking(null)
    setHintPair(null)
    setPathPoints(null)
    setElapsedTime(0)
    setSteps(0)
    setHintsUsed(0)
    setShufflesUsed(0)
    setShufflesRemaining(MAX_SHUFFLES)
    setCurrentEntry(null)
    setIsNewRecord(false)
    setGameStatus(GAME_STATUS.PLAYING)

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setElapsedTime((t) => t + 1)
    }, 1000)
  }, [difficulty, customRows, customCols])

  const handleCellClick = useCallback(
    (r, c) => {
      if (gameStatus !== GAME_STATUS.PLAYING) return
      if (grid[r][c] === null) return
      if (eliminating.size > 0) return

      if (!selected) {
        setSelected([r, c])
        return
      }

      const [sr, sc] = selected
      if (sr === r && sc === c) {
        setSelected(null)
        return
      }

      setSteps((s) => s + 1)

      if (grid[sr][sc] !== grid[r][c]) {
        setShaking([r, c])
        setTimeout(() => {
          setShaking(null)
          setSelected(null)
        }, 400)
        return
      }

      const path = findPath(grid, sr, sc, r, c, 2)

      if (!path) {
        setShaking([r, c])
        setTimeout(() => {
          setShaking(null)
          setSelected(null)
        }, 400)
        return
      }

      setPathPoints(path)

      const elimKey1 = `${sr}-${sc}`
      const elimKey2 = `${r}-${c}`
      const newEliminating = new Set([elimKey1, elimKey2])
      setEliminating(newEliminating)

      pathTimeoutRef.current = setTimeout(() => {
        setGrid((g) => eliminatePair(g, sr, sc, r, c))
        setPathPoints(null)
        setEliminating(new Set())
        setSelected(null)

        setGrid((currentGrid) => {
          const newGrid = eliminatePair(currentGrid, sr, sc, r, c)

          if (isGameComplete(newGrid)) {
            if (timerRef.current) clearInterval(timerRef.current)

            const score = calculateScore({
              difficulty,
              timeSeconds: elapsedTime,
              steps: steps + 1,
              hintsUsed,
              shufflesUsed,
            })

            const entry = {
              score,
              difficulty,
              timeSeconds: elapsedTime,
              steps: steps + 1,
              date: new Date().toISOString(),
            }

            const { leaderboard: newLb, rank } = addToLeaderboard(entry)
            setLeaderboard(newLb)
            setLeaderboardTab(difficulty)
            setCurrentEntry(entry)
            setIsNewRecord(rank <= 3 && rank > 0)
            setGameStatus(GAME_STATUS.COMPLETE)
          } else if (!hasAnyValidPair(newGrid)) {
            const reshuffled = shuffleRemainingIcons(newGrid)
            return reshuffled
          }

          return newGrid
        })
      }, 500)
    },
    [gameStatus, grid, selected, eliminating, difficulty, elapsedTime, steps, hintsUsed, shufflesUsed]
  )

  const handleHint = useCallback(() => {
    if (gameStatus !== GAME_STATUS.PLAYING) return
    if (hintPair) return

    const result = findHintPair(grid)
    if (!result) return

    const config = DIFFICULTY_CONFIG[difficulty]
    setSteps((s) => s + config.hintPenalty)
    setHintsUsed((h) => h + 1)
    setHintPair(result.pair)

    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current)
    hintTimeoutRef.current = setTimeout(() => {
      setHintPair(null)
    }, 2000)
  }, [gameStatus, grid, difficulty, hintPair])

  const handleShuffle = useCallback(() => {
    if (gameStatus !== GAME_STATUS.PLAYING) return
    if (shufflesRemaining <= 0) return

    setGrid((g) => shuffleRemainingIcons(g))
    setShufflesRemaining((s) => s - 1)
    setShufflesUsed((s) => s + 1)
    setSelected(null)
  }, [gameStatus, shufflesRemaining])

  const cellIsHint = (r, c) => {
    if (!hintPair) return false
    return hintPair.some(([hr, hc]) => hr === r && hc === c)
  }

  const cellKey = (r, c) => `${r}-${c}`

  const getPathSvgPoints = () => {
    if (!pathPoints) return ''
    const halfCell = CELL_SIZE / 2
    const gap = 4
    return pathPoints
      .map(([r, c]) => {
        const x = c * (CELL_SIZE + gap) + halfCell
        const y = r * (CELL_SIZE + gap) + halfCell
        return `${x},${y}`
      })
      .join(' ')
  }

  const renderSetupPanel = () => (
    <div className="link-game-panel">
      <div className="link-game-panel-title">选择难度</div>
      <div className="link-game-difficulty-options">
        {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
          <div
            key={key}
            className={`link-game-difficulty-option ${difficulty === key ? 'active' : ''}`}
            onClick={() => setDifficulty(key)}
          >
            <span style={{ flex: 1 }}>{cfg.label}</span>
            {key !== DIFFICULTY.CUSTOM && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {cfg.rows}×{cfg.cols}
              </span>
            )}
          </div>
        ))}
      </div>
      {difficulty === DIFFICULTY.CUSTOM && (
        <div className="link-game-custom-size">
          <label>行数</label>
          <input
            type="number"
            min={4}
            max={12}
            step={2}
            value={customRows}
            onChange={(e) => setCustomRows(Number(e.target.value))}
          />
          <label>列数</label>
          <input
            type="number"
            min={4}
            max={12}
            step={2}
            value={customCols}
            onChange={(e) => setCustomCols(Number(e.target.value))}
          />
        </div>
      )}
      <button
        className="link-game-btn link-game-start-btn"
        onClick={startGame}
      >
        开始游戏
      </button>
    </div>
  )

  const renderGameInfoPanel = () => (
    <div className="link-game-panel">
      <div className="link-game-panel-title">游戏信息</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>难度</span>
          <span style={{ fontWeight: 'bold', color: '#f093fb' }}>
            {DIFFICULTY_CONFIG[difficulty].label}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>网格</span>
          <span>{rows}×{cols}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>剩余重排</span>
          <span style={{ fontWeight: 'bold' }}>{shufflesRemaining} / {MAX_SHUFFLES}</span>
        </div>
      </div>
      <button
        className="link-game-btn link-game-start-btn"
        onClick={() => {
          if (timerRef.current) clearInterval(timerRef.current)
          setGameStatus(GAME_STATUS.SETUP)
        }}
        style={{ marginTop: 16 }}
      >
        返回设置
      </button>
    </div>
  )

  const renderLeaderboardPanel = () => {
    const currentLb = leaderboard[leaderboardTab] || []

    return (
      <div className="link-game-panel">
        <div className="link-game-panel-title">排行榜</div>
        <div className="link-game-leaderboard-tabs">
          {Object.entries(DIFFICULTY_CONFIG)
            .filter(([k]) => k !== DIFFICULTY.CUSTOM)
            .map(([key, cfg]) => (
              <button
                key={key}
                className={`link-game-leaderboard-tab ${leaderboardTab === key ? 'active' : ''}`}
                onClick={() => setLeaderboardTab(key)}
              >
                {cfg.label}
              </button>
            ))}
        </div>
        <div className="link-game-leaderboard-list">
          {currentLb.length === 0 ? (
            <div className="link-game-leaderboard-empty">暂无记录</div>
          ) : (
            currentLb.map((entry, idx) => {
              const isCurrent =
                currentEntry &&
                entry.score === currentEntry.score &&
                entry.timeSeconds === currentEntry.timeSeconds &&
                entry.steps === currentEntry.steps &&
                entry.date === currentEntry.date

              const rankClass = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''

              return (
                <div
                  key={`${entry.date}-${idx}`}
                  className={`link-game-leaderboard-item ${isCurrent ? 'current' : ''}`}
                >
                  <div className={`link-game-leaderboard-rank ${rankClass}`}>
                    {idx + 1}
                  </div>
                  <div className="link-game-leaderboard-info">
                    <div className="link-game-leaderboard-score">{entry.score} 分</div>
                    <div className="link-game-leaderboard-meta">
                      {formatTime(entry.timeSeconds)} · {entry.steps} 步
                    </div>
                  </div>
                  <div className="link-game-leaderboard-date">
                    {formatDate(entry.date)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  const renderBoard = () => {
    if (!grid) return null

    const gap = 4
    const fullRows = rows + BORDER_PADDING * 2
    const fullCols = cols + BORDER_PADDING * 2
    const boardWidth = fullCols * CELL_SIZE + (fullCols - 1) * gap
    const boardHeight = fullRows * CELL_SIZE + (fullRows - 1) * gap

    return (
      <div className="link-game-board-wrapper">
        <div
          className="link-game-board"
          style={{
            gridTemplateColumns: `repeat(${fullCols}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${fullRows}, ${CELL_SIZE}px)`,
            gap: `${gap}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isEmpty = cell === null
              const isSelected =
                selected && selected[0] === r && selected[1] === c
              const isEliminating = eliminating.has(cellKey(r, c))
              const isShaking = shaking && shaking[0] === r && shaking[1] === c
              const isHint = cellIsHint(r, c)

              let className = 'link-game-cell'
              if (isEmpty) className += ' link-game-cell-empty'
              if (isSelected) className += ' link-game-cell-selected'
              if (isHint) className += ' link-game-cell-hint'
              if (isShaking) className += ' link-game-cell-shake'
              if (isEliminating) className += ' link-game-cell-eliminating'

              return (
                <div
                  key={cellKey(r, c)}
                  className={className}
                  onClick={() => !isEmpty && handleCellClick(r, c)}
                >
                  {!isEmpty && cell}
                </div>
              )
            })
          )}
          {pathPoints && (
            <svg
              className="link-game-path-svg"
              width={boardWidth}
              height={boardHeight}
              style={{ top: 0, left: 0 }}
            >
              <polyline
                className="link-game-path-line"
                points={getPathSvgPoints()}
                strokeDasharray="1000"
                strokeDashoffset="1000"
                style={{
                  animation: 'pathDraw 0.4s ease-out forwards',
                }}
              />
              <style>
                {`@keyframes pathDraw {
                  to { stroke-dashoffset: 0; }
                }`}
              </style>
            </svg>
          )}
        </div>
        {gameStatus === GAME_STATUS.COMPLETE && (
          <div className="link-game-overlay">
            <div className="link-game-overlay-title">🎉 恭喜通关！</div>
            {isNewRecord && (
              <div className="link-game-overlay-new-record">✨ 新纪录！ ✨</div>
            )}
            <div className="link-game-overlay-score">
              {calculateScore({
                difficulty,
                timeSeconds: elapsedTime,
                steps,
                hintsUsed,
                shufflesUsed,
              })}{' '}
              分
            </div>
            <div className="link-game-overlay-stats">
              <div className="link-game-overlay-stat">
                <span className="link-game-overlay-stat-label">用时</span>
                <span className="link-game-overlay-stat-value">
                  {formatTime(elapsedTime)}
                </span>
              </div>
              <div className="link-game-overlay-stat">
                <span className="link-game-overlay-stat-label">步数</span>
                <span className="link-game-overlay-stat-value">{steps}</span>
              </div>
              <div className="link-game-overlay-stat">
                <span className="link-game-overlay-stat-label">提示</span>
                <span className="link-game-overlay-stat-value">{hintsUsed}</span>
              </div>
              <div className="link-game-overlay-stat">
                <span className="link-game-overlay-stat-label">重排</span>
                <span className="link-game-overlay-stat-value">{shufflesUsed}</span>
              </div>
            </div>
            <button
              className="link-game-btn link-game-btn-secondary"
              onClick={startGame}
              style={{ padding: '12px 32px', fontSize: 16 }}
            >
              再玩一次
            </button>
            <button
              className="link-game-btn"
              onClick={() => setGameStatus(GAME_STATUS.SETUP)}
            >
              返回设置
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="link-game-page">
      <div className="link-game-header">
        <div className="link-game-header-left">
          <button className="link-game-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="link-game-title">连连看</h1>
        </div>
      </div>

      <div className="link-game-main">
        <div className="link-game-content">
          {gameStatus !== GAME_STATUS.SETUP && (
            <>
              <div className="link-game-stats-bar">
                <div className="link-game-stat">
                  <span className="link-game-stat-label">用时</span>
                  <span className="link-game-stat-value">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
                <div className="link-game-stat">
                  <span className="link-game-stat-label">步数</span>
                  <span className="link-game-stat-value">{steps}</span>
                </div>
              </div>

              {gameStatus === GAME_STATUS.PLAYING && (
                <div className="link-game-controls">
                  <button
                    className="link-game-btn link-game-btn-secondary"
                    onClick={handleHint}
                    disabled={hintPair !== null}
                  >
                    💡 提示
                  </button>
                  <button
                    className="link-game-btn link-game-btn-danger"
                    onClick={handleShuffle}
                    disabled={shufflesRemaining <= 0}
                  >
                    🔀 重排 ({shufflesRemaining})
                  </button>
                  <button className="link-game-btn" onClick={startGame}>
                    🔄 重新开始
                  </button>
                </div>
              )}
            </>
          )}

          {gameStatus === GAME_STATUS.SETUP ? (
            <div style={{ width: 500, marginTop: 40 }}>
              {renderSetupPanel()}
            </div>
          ) : (
            renderBoard()
          )}
        </div>

        <div className="link-game-side-panel">
          {gameStatus !== GAME_STATUS.SETUP && renderGameInfoPanel()}
          {renderLeaderboardPanel()}
        </div>
      </div>
    </div>
  )
}

export default LinkGamePage
