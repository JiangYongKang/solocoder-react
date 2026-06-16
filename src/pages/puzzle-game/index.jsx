import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CANVAS_SIZE,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  GAME_PHASE,
  SWAP_MODE,
  FLASH_DURATION,
  CELEBRATION_WAVE_DELAY,
  PIECE_BORDER_WIDTH,
  PIECE_HIGHLIGHT_COLOR,
  PIECE_CORRECT_COLOR,
  PIECE_DRAG_OPACITY,
  PAGE_SIZE,
} from './constants.js'
import {
  calculateGridCoords,
  shufflePieces,
  isPieceCorrect,
  isPuzzleComplete,
  calculateScore,
  formatTime,
  countIncorrectAfterSwap,
  loadLeaderboard,
  addToLeaderboard,
  getLeaderboardByDifficulty,
  clearLeaderboard,
  paginateLeaderboard,
  getTotalPages,
  drawDefaultImage,
} from './puzzleCore.js'
import './puzzle-game.css'

function generateConfettiPieces() {
  return Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#DDA0DD', '#96CEB4'][i % 6],
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 8,
    shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'square' : 'triangle',
  }))
}

function PuzzleGamePage() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const sourceCanvasRef = useRef(null)
  const animFrameRef = useRef(null)

  const [phase, setPhase] = useState(GAME_PHASE.UPLOAD)
  const [difficulty, setDifficulty] = useState(DIFFICULTIES.EASY)
  const [pieces, setPieces] = useState([])
  const [moves, setMoves] = useState(0)
  const [timeSeconds, setTimeSeconds] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const [swapMode, setSwapMode] = useState(SWAP_MODE.DRAG)
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [dragState, setDragState] = useState(null)

  const [showPreview, setShowPreview] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 })
  const [previewDragging, setPreviewDragging] = useState(false)
  const [previewDragOffset, setPreviewDragOffset] = useState({ x: 0, y: 0 })

  const [showCompletion, setShowCompletion] = useState(false)
  const [score, setScore] = useState(0)
  const [celebrationProgress, setCelebrationProgress] = useState(-1)
  const [playerName, setPlayerName] = useState('')
  const [confettiPieces, setConfettiPieces] = useState([])

  const [leaderboard, setLeaderboard] = useState(() => loadLeaderboard())
  const [lbTab, setLbTab] = useState(DIFFICULTIES.EASY)
  const [lbPage, setLbPage] = useState(1)

  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const stateRef = useRef({ pieces, moves, timeSeconds, difficulty, phase, hasStarted, timerActive })
  useEffect(() => {
    stateRef.current = { pieces, moves, timeSeconds, difficulty, phase, hasStarted, timerActive }
  })

  const initDefaultImage = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    const ctx = canvas.getContext('2d')
    drawDefaultImage(ctx, CANVAS_SIZE)
    sourceCanvasRef.current = canvas
  }, [])

  useEffect(() => {
    if (!sourceCanvasRef.current) {
      initDefaultImage()
    }
  }, [initDefaultImage])

  const handleImageUpload = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = CANVAS_SIZE
        canvas.height = CANVAS_SIZE
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
        const scale = Math.min(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height)
        const w = img.width * scale
        const h = img.height * scale
        const x = (CANVAS_SIZE - w) / 2
        const y = (CANVAS_SIZE - h) / 2
        ctx.drawImage(img, x, y, w, h)
        sourceCanvasRef.current = canvas
        setPhase(GAME_PHASE.SELECT_DIFFICULTY)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    const file = e.dataTransfer.files[0]
    handleImageUpload(file)
  }, [handleImageUpload])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.currentTarget.classList.add('drag-over')
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.currentTarget.classList.remove('drag-over')
  }, [])

  const startGame = useCallback((diff) => {
    setDifficulty(diff)
    const total = diff * diff
    const shuffled = shufflePieces(total)
    setPieces(shuffled)
    setMoves(0)
    setTimeSeconds(0)
    setTimerActive(false)
    setHasStarted(false)
    setSelectedPiece(null)
    setDragState(null)
    setShowCompletion(false)
    setCelebrationProgress(-1)
    setScore(0)
    setPlayerName('')
    setPhase(GAME_PHASE.PLAYING)
  }, [])

  const reshufflePieces = useCallback(() => {
    const total = difficulty * difficulty
    const shuffled = shufflePieces(total)
    setPieces(shuffled)
    setMoves(0)
    setTimeSeconds(0)
    setTimerActive(false)
    setHasStarted(false)
    setSelectedPiece(null)
    setDragState(null)
    setShowCompletion(false)
    setCelebrationProgress(-1)
    setScore(0)
  }, [difficulty])

  const giveUp = useCallback(() => {
    setPhase(GAME_PHASE.SELECT_DIFFICULTY)
    setTimerActive(false)
    setSelectedPiece(null)
    setDragState(null)
  }, [])

  const togglePause = useCallback(() => {
    if (phase === GAME_PHASE.PLAYING) {
      setPhase(GAME_PHASE.PAUSED)
      setTimerActive(false)
    } else if (phase === GAME_PHASE.PAUSED) {
      setPhase(GAME_PHASE.PLAYING)
      setTimerActive(true)
    }
  }, [phase])

  useEffect(() => {
    if (!timerActive) return
    const id = setInterval(() => {
      setTimeSeconds((t) => t + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [timerActive])

  const handlePuzzleComplete = useCallback(() => {
    setTimerActive(false)
    const s = stateRef.current
    const finalScore = calculateScore(s.difficulty, s.timeSeconds, s.moves)
    setScore(finalScore)
    setPhase(GAME_PHASE.COMPLETED)
    setShowCompletion(true)
    setCelebrationProgress(0)
    setConfettiPieces(generateConfettiPieces())
  }, [])

  const swapPieces = useCallback((posA, posB) => {
    if (posA === posB) return
    const shouldCount = countIncorrectAfterSwap(stateRef.current.pieces, posA, posB)
    setPieces((prev) => {
      const next = [...prev]
      ;[next[posA], next[posB]] = [next[posB], next[posA]]

      if (isPuzzleComplete(next) && stateRef.current.hasStarted) {
        setTimeout(handlePuzzleComplete, 0)
      }

      return next
    })
    if (!stateRef.current.hasStarted) {
      setHasStarted(true)
      setTimerActive(true)
    }
    if (shouldCount) {
      setMoves((m) => m + 1)
    }
    setSelectedPiece(null)
    setDragState(null)
  }, [handlePuzzleComplete])

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current
    const source = sourceCanvasRef.current
    if (!canvas || !source) return
    const ctx = canvas.getContext('2d')
    const currentPieces = stateRef.current.pieces
    const currentPhase = stateRef.current.phase
    const currentDrag = dragState
    const currentSelected = selectedPiece
    const gridN = difficulty
    const pieceSize = CANVAS_SIZE / gridN
    const gridCoords = calculateGridCoords(gridN, CANVAS_SIZE)

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    for (let i = 0; i < currentPieces.length; i++) {
      if (currentDrag && currentDrag.sourceIndex === i) continue

      const origIdx = currentPieces[i]
      const srcCoord = gridCoords[origIdx]
      const dstX = (i % gridN) * pieceSize
      const dstY = Math.floor(i / gridN) * pieceSize

      ctx.globalAlpha = 1
      ctx.drawImage(
        source,
        srcCoord.x, srcCoord.y, srcCoord.width, srcCoord.height,
        dstX, dstY, pieceSize, pieceSize
      )

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = PIECE_BORDER_WIDTH
      ctx.strokeRect(dstX, dstY, pieceSize, pieceSize)

      if (isPieceCorrect(i, origIdx) && currentPhase === GAME_PHASE.PLAYING) {
        ctx.fillStyle = PIECE_CORRECT_COLOR
        ctx.fillRect(dstX, dstY, pieceSize, pieceSize)
      }

      if (currentSelected === i) {
        ctx.strokeStyle = PIECE_HIGHLIGHT_COLOR
        ctx.lineWidth = 3
        ctx.strokeRect(dstX + 1, dstY + 1, pieceSize - 2, pieceSize - 2)
      }

      if (currentDrag && currentDrag.targetIndex === i && currentDrag.sourceIndex !== i) {
        ctx.strokeStyle = PIECE_HIGHLIGHT_COLOR
        ctx.lineWidth = 3
        ctx.strokeRect(dstX + 1, dstY + 1, pieceSize - 2, pieceSize - 2)
      }

      if (celebrationProgress >= 0) {
        const pieceDelay = i * CELEBRATION_WAVE_DELAY
        const elapsed = celebrationProgress * 16 - pieceDelay
        if (elapsed > 0 && elapsed < 500) {
          const t = elapsed / 500
          const scale = 1 + 0.15 * Math.sin(t * Math.PI)
          const cx = dstX + pieceSize / 2
          const cy = dstY + pieceSize / 2
          ctx.save()
          ctx.translate(cx, cy)
          ctx.scale(scale, scale)
          ctx.translate(-cx, -cy)
          ctx.drawImage(
            source,
            srcCoord.x, srcCoord.y, srcCoord.width, srcCoord.height,
            dstX, dstY, pieceSize, pieceSize
          )
          ctx.restore()
        }
      }
    }

    if (currentDrag) {
      const origIdx = currentPieces[currentDrag.sourceIndex]
      const srcCoord = gridCoords[origIdx]
      ctx.globalAlpha = PIECE_DRAG_OPACITY
      ctx.drawImage(
        source,
        srcCoord.x, srcCoord.y, srcCoord.width, srcCoord.height,
        currentDrag.x - pieceSize / 2,
        currentDrag.y - pieceSize / 2,
        pieceSize,
        pieceSize
      )
      ctx.globalAlpha = 1
    }
  }, [difficulty, dragState, selectedPiece, celebrationProgress])

  useEffect(() => {
    if (phase !== GAME_PHASE.PLAYING && phase !== GAME_PHASE.PAUSED && phase !== GAME_PHASE.COMPLETED) return
    const loop = () => {
      drawBoard()
      animFrameRef.current = requestAnimationFrame(loop)
    }
    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [drawBoard, phase])

  useEffect(() => {
    if (celebrationProgress < 0) return
    const totalFrames = (pieces.length * CELEBRATION_WAVE_DELAY / 16) + 40
    if (celebrationProgress < totalFrames) {
      const id = setTimeout(() => setCelebrationProgress((p) => p + 1), 16)
      return () => clearTimeout(id)
    }
  }, [celebrationProgress, pieces.length])

  const getPieceIndexAt = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return -1
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_SIZE / rect.width
    const scaleY = CANVAS_SIZE / rect.height
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY
    const pieceSize = CANVAS_SIZE / difficulty
    const col = Math.floor(x / pieceSize)
    const row = Math.floor(y / pieceSize)
    if (col < 0 || col >= difficulty || row < 0 || row >= difficulty) return -1
    return row * difficulty + col
  }, [difficulty])

  const handleCanvasMouseDown = useCallback((e) => {
    if (phase !== GAME_PHASE.PLAYING) return
    const idx = getPieceIndexAt(e.clientX, e.clientY)
    if (idx < 0) return

    if (swapMode === SWAP_MODE.CLICK) {
      if (selectedPiece === null) {
        setSelectedPiece(idx)
      } else if (selectedPiece === idx) {
        setSelectedPiece(null)
      } else {
        swapPieces(selectedPiece, idx)
      }
      return
    }

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    setDragState({
      sourceIndex: idx,
      targetIndex: -1,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [phase, swapMode, selectedPiece, getPieceIndexAt, swapPieces])

  const handleCanvasMouseMove = useCallback((e) => {
    if (!dragState) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const targetIdx = getPieceIndexAt(e.clientX, e.clientY)
    setDragState((prev) => ({
      ...prev,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      targetIndex: targetIdx >= 0 && targetIdx !== prev.sourceIndex ? targetIdx : -1,
    }))
  }, [dragState, getPieceIndexAt])

  const handleCanvasMouseUp = useCallback((e) => {
    if (!dragState) return
    const targetIdx = getPieceIndexAt(e.clientX, e.clientY)
    if (targetIdx >= 0 && targetIdx !== dragState.sourceIndex) {
      swapPieces(dragState.sourceIndex, targetIdx)
    } else {
      setDragState(null)
    }
  }, [dragState, getPieceIndexAt, swapPieces])

  const handleFlashPreview = useCallback(() => {
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), FLASH_DURATION)
  }, [])

  const handlePreviewMouseDown = useCallback((e) => {
    if (e.target.closest('.puzzle-preview-close')) return
    setPreviewDragging(true)
    const modal = e.currentTarget
    const rect = modal.getBoundingClientRect()
    setPreviewDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  useEffect(() => {
    if (!previewDragging) return
    const handleMove = (e) => {
      setPreviewPos({
        x: e.clientX - previewDragOffset.x,
        y: e.clientY - previewDragOffset.y,
      })
    }
    const handleUp = () => {
      setPreviewDragging(false)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [previewDragging, previewDragOffset])

  const handleSaveScore = useCallback(() => {
    const name = playerName.trim() || '玩家'
    const entry = {
      name,
      difficulty,
      timeSeconds: stateRef.current.timeSeconds,
      moves: stateRef.current.moves,
      score,
      completedAt: new Date().toISOString(),
    }
    const updated = addToLeaderboard(entry)
    setLeaderboard(updated)
    setShowCompletion(false)
  }, [playerName, difficulty, score])

  const handlePlayAgain = useCallback(() => {
    startGame(difficulty)
  }, [difficulty, startGame])

  const handleClearLeaderboard = useCallback(() => {
    clearLeaderboard()
    setLeaderboard([])
    setShowClearConfirm(false)
    setLbPage(1)
  }, [])

  const handlePreviewCanvasRef = useCallback((el) => {
    if (el && sourceCanvasRef.current) {
      const pCtx = el.getContext('2d')
      pCtx.drawImage(sourceCanvasRef.current, 0, 0)
    }
  }, [])

  const handleFlashCanvasRef = useCallback((el) => {
    if (el && sourceCanvasRef.current) {
      const fCtx = el.getContext('2d')
      fCtx.drawImage(sourceCanvasRef.current, 0, 0)
    }
  }, [])

  const lbEntries = useMemo(() => getLeaderboardByDifficulty(leaderboard, lbTab), [leaderboard, lbTab])
  const totalPages = getTotalPages(lbEntries.length, PAGE_SIZE)
  const pageEntries = paginateLeaderboard(lbEntries, lbPage, PAGE_SIZE)

  return (
    <div className="puzzle-page">
      <div className="puzzle-header">
        <div className="puzzle-header-left">
          <button className="puzzle-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="puzzle-title">拼图游戏</h1>
        </div>
      </div>

      <div className="puzzle-main">
        <div className="puzzle-game-section">
          {phase === GAME_PHASE.UPLOAD && (
            <div
              className="puzzle-upload-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => {
                  if (e.target.files[0]) handleImageUpload(e.target.files[0])
                }
                input.click()
              }}
            >
              <div className="puzzle-upload-icon">🖼️</div>
              <div className="puzzle-upload-text">拖拽图片到此处或点击上传</div>
              <div className="puzzle-upload-hint">支持 JPG、PNG 等常见图片格式</div>
            </div>
          )}

          {phase === GAME_PHASE.SELECT_DIFFICULTY && (
            <div className="puzzle-difficulty-select">
              <div className="puzzle-difficulty-title">选择难度</div>
              <div className="puzzle-difficulty-buttons">
                <button
                  className="puzzle-difficulty-btn easy"
                  onClick={() => startGame(DIFFICULTIES.EASY)}
                >
                  <div className="puzzle-difficulty-label">简单</div>
                  <div className="puzzle-difficulty-desc">3×3 · 9 块拼块</div>
                </button>
                <button
                  className="puzzle-difficulty-btn medium"
                  onClick={() => startGame(DIFFICULTIES.MEDIUM)}
                >
                  <div className="puzzle-difficulty-label">中等</div>
                  <div className="puzzle-difficulty-desc">4×4 · 16 块拼块</div>
                </button>
                <button
                  className="puzzle-difficulty-btn hard"
                  onClick={() => startGame(DIFFICULTIES.HARD)}
                >
                  <div className="puzzle-difficulty-label">困难</div>
                  <div className="puzzle-difficulty-desc">5×5 · 25 块拼块</div>
                </button>
              </div>
              <button
                className="puzzle-btn"
                onClick={() => {
                  initDefaultImage()
                  setPhase(GAME_PHASE.SELECT_DIFFICULTY)
                }}
              >
                📤 重新上传图片
              </button>
            </div>
          )}

          {(phase === GAME_PHASE.PLAYING || phase === GAME_PHASE.PAUSED) && (
            <>
              <div className="puzzle-info-bar">
                <div className="puzzle-info-item">
                  <span className="puzzle-info-label">难度</span>
                  <span className="puzzle-info-value">{DIFFICULTY_LABELS[difficulty]}</span>
                </div>
                <div className="puzzle-info-separator" />
                <div className="puzzle-info-item">
                  <span className="puzzle-info-label">用时</span>
                  <span className="puzzle-info-value">{formatTime(timeSeconds)}</span>
                </div>
                <div className="puzzle-info-separator" />
                <div className="puzzle-info-item">
                  <span className="puzzle-info-label">步数</span>
                  <span className="puzzle-info-value">{moves}</span>
                </div>
              </div>

              <div className="puzzle-toolbar">
                <button
                  className={`puzzle-btn ${swapMode === SWAP_MODE.DRAG ? 'active' : ''}`}
                  onClick={() => setSwapMode(SWAP_MODE.DRAG)}
                >
                  🖱️ 拖拽交换
                </button>
                <button
                  className={`puzzle-btn ${swapMode === SWAP_MODE.CLICK ? 'active' : ''}`}
                  onClick={() => setSwapMode(SWAP_MODE.CLICK)}
                >
                  👆 点击交换
                </button>
                <button className="puzzle-btn" onClick={() => setShowPreview(true)}>
                  👁️ 预览原图
                </button>
                <button className="puzzle-btn" onClick={handleFlashPreview} disabled={showFlash}>
                  ⚡ 闪示原图
                </button>
                <button className="puzzle-btn" onClick={togglePause}>
                  {phase === GAME_PHASE.PAUSED ? '▶️ 继续' : '⏸️ 暂停'}
                </button>
                <button className="puzzle-btn" onClick={reshufflePieces}>
                  🔀 重新打乱
                </button>
                <button className="puzzle-btn danger" onClick={giveUp}>
                  🚫 放弃
                </button>
              </div>

              <div className="puzzle-canvas-wrapper">
                <canvas
                  ref={canvasRef}
                  className="puzzle-canvas"
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={() => { if (dragState) setDragState(null) }}
                />

                {phase === GAME_PHASE.PAUSED && (
                  <div className="puzzle-pause-overlay">
                    <div className="puzzle-pause-text">暂停中</div>
                  </div>
                )}

                {showFlash && (
                  <div className="puzzle-flash-overlay">
                    <canvas
                      width={CANVAS_SIZE}
                      height={CANVAS_SIZE}
                      ref={handleFlashCanvasRef}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {phase === GAME_PHASE.COMPLETED && (
            <>
              <div className="puzzle-info-bar">
                <div className="puzzle-info-item">
                  <span className="puzzle-info-label">难度</span>
                  <span className="puzzle-info-value">{DIFFICULTY_LABELS[difficulty]}</span>
                </div>
                <div className="puzzle-info-separator" />
                <div className="puzzle-info-item">
                  <span className="puzzle-info-label">用时</span>
                  <span className="puzzle-info-value">{formatTime(timeSeconds)}</span>
                </div>
                <div className="puzzle-info-separator" />
                <div className="puzzle-info-item">
                  <span className="puzzle-info-label">步数</span>
                  <span className="puzzle-info-value">{moves}</span>
                </div>
                <div className="puzzle-info-separator" />
                <div className="puzzle-info-item">
                  <span className="puzzle-info-label">得分</span>
                  <span className="puzzle-info-value" style={{ color: '#4ECDC4' }}>{score}</span>
                </div>
              </div>

              <div className="puzzle-toolbar">
                <button className="puzzle-btn primary" onClick={handlePlayAgain}>
                  🔄 再来一局
                </button>
                <button className="puzzle-btn" onClick={() => setPhase(GAME_PHASE.SELECT_DIFFICULTY)}>
                  🎯 换难度
                </button>
                <button className="puzzle-btn" onClick={() => { initDefaultImage(); setPhase(GAME_PHASE.UPLOAD) }}>
                  📤 换图片
                </button>
              </div>

              <div className="puzzle-canvas-wrapper">
                <canvas
                  ref={canvasRef}
                  className="puzzle-canvas"
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  style={{ cursor: 'default' }}
                />
              </div>
            </>
          )}
        </div>

        <div className="puzzle-side-panel">
          <div className="puzzle-panel">
            <div className="puzzle-panel-title">操作说明</div>
            <div className="puzzle-instructions">
              <strong>拖拽模式：</strong>按住拼块拖到目标位置释放，两块交换<br />
              <strong>点击模式：</strong>先点击选中一块（高亮），再点击另一块完成交换<br />
              <strong>预览原图：</strong>可拖拽移动预览窗口，半透明覆盖在游戏区上方<br />
              <strong>闪示原图：</strong>短暂显示原图 2 秒后自动隐藏<br />
              绿色标记表示该拼块已在正确位置
            </div>
          </div>

          <div className="puzzle-panel">
            <div className="puzzle-panel-title">排行榜</div>
            <div className="puzzle-leaderboard-tabs">
              {[DIFFICULTIES.EASY, DIFFICULTIES.MEDIUM, DIFFICULTIES.HARD].map((d) => (
                <button
                  key={d}
                  className={`puzzle-lb-tab ${lbTab === d ? 'active' : ''}`}
                  onClick={() => { setLbTab(d); setLbPage(1) }}
                >
                  {d}×{d}
                </button>
              ))}
            </div>

            {pageEntries.length > 0 ? (
              <>
                <table className="puzzle-lb-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>玩家</th>
                      <th>得分</th>
                      <th>用时</th>
                      <th>步数</th>
                      <th>日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageEntries.map((entry, idx) => {
                      const globalIdx = (lbPage - 1) * PAGE_SIZE + idx
                      const rankClass = globalIdx === 0 ? 'gold' : globalIdx === 1 ? 'silver' : globalIdx === 2 ? 'bronze' : ''
                      return (
                        <tr key={`${entry.completedAt}-${idx}`}>
                          <td className={`puzzle-lb-rank ${rankClass}`}>{globalIdx + 1}</td>
                          <td>{entry.name}</td>
                          <td>{entry.score}</td>
                          <td>{formatTime(entry.timeSeconds)}</td>
                          <td>{entry.moves}</td>
                          <td>{entry.completedAt ? entry.completedAt.slice(0, 10) : ''}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div className="puzzle-lb-pagination">
                    <button
                      className="puzzle-lb-page-btn"
                      disabled={lbPage <= 1}
                      onClick={() => setLbPage((p) => p - 1)}
                    >
                      上一页
                    </button>
                    <span className="puzzle-lb-page-info">{lbPage} / {totalPages}</span>
                    <button
                      className="puzzle-lb-page-btn"
                      disabled={lbPage >= totalPages}
                      onClick={() => setLbPage((p) => p + 1)}
                    >
                      下一页
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="puzzle-lb-empty">暂无记录</div>
            )}

            <button className="puzzle-lb-clear" onClick={() => setShowClearConfirm(true)}>
              清空排行榜
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="puzzle-preview-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowPreview(false)
        }}>
          <div
            className={`puzzle-preview-modal ${previewDragging ? 'dragging' : ''}`}
            style={{ left: previewPos.x || '50%', top: previewPos.y || '50%', transform: previewPos.x ? 'none' : 'translate(-50%, -50%)' }}
            onMouseDown={handlePreviewMouseDown}
          >
            <div className="puzzle-preview-header">
              <span className="puzzle-preview-title">原图预览</span>
              <button className="puzzle-preview-close" onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <canvas
              className="puzzle-preview-canvas"
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              ref={handlePreviewCanvasRef}
            />
          </div>
        </div>
      )}

      {showCompletion && (
        <>
          <div className="puzzle-confetti-container">
            {confettiPieces.map((p) => (
              <div
                key={p.id}
                className="puzzle-confetti-piece"
                style={{
                  left: `${p.left}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.shape === 'triangle' ? 'transparent' : p.color,
                  border: p.shape === 'triangle' ? `8px solid ${p.color}` : 'none',
                  borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '0',
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                }}
              />
            ))}
          </div>
          <div className="puzzle-completion-card">
            <div className="puzzle-completion-title">🎉 拼图完成！</div>
            <div className="puzzle-completion-score">{score}分</div>
            <div className="puzzle-completion-details">
              <div className="puzzle-completion-detail">
                <div className="puzzle-completion-detail-label">用时</div>
                <div className="puzzle-completion-detail-value">{formatTime(timeSeconds)}</div>
              </div>
              <div className="puzzle-completion-detail">
                <div className="puzzle-completion-detail-label">步数</div>
                <div className="puzzle-completion-detail-value">{moves}</div>
              </div>
              <div className="puzzle-completion-detail">
                <div className="puzzle-completion-detail-label">难度</div>
                <div className="puzzle-completion-detail-value">{difficulty}×{difficulty}</div>
              </div>
            </div>
            <input
              className="puzzle-completion-name"
              type="text"
              placeholder="输入昵称（默认：玩家）"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={12}
              autoFocus
            />
            <div className="puzzle-completion-actions">
              <button className="puzzle-btn primary" onClick={handleSaveScore}>
                💾 保存成绩
              </button>
              <button className="puzzle-btn" onClick={handlePlayAgain}>
                🔄 再来一局
              </button>
            </div>
          </div>
        </>
      )}

      {showClearConfirm && (
        <div className="puzzle-confirm-overlay">
          <div className="puzzle-confirm-dialog">
            <div className="puzzle-confirm-text">确定要清空所有排行榜数据吗？此操作不可恢复。</div>
            <div className="puzzle-confirm-actions">
              <button className="puzzle-btn danger" onClick={handleClearLeaderboard}>
                确认清空
              </button>
              <button className="puzzle-btn" onClick={() => setShowClearConfirm(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PuzzleGamePage
