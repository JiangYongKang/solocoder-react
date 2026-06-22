import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import MagicCube3D from './MagicCube3D.jsx'
import {
  createInitialFaces,
  rotateFace,
  isSolved,
  generateScramble,
  generateSolutionSteps,
  movesToStrings,
} from './magicCubeCore.js'
import { FACE_NAMES, FACE_KEY_MAP, ANIMATION_DURATION } from './constants.js'
import './magic-cube.css'

const DEFAULT_VIEW = { x: -25, y: -35 }
const DEFAULT_ZOOM = 1
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2
const ZOOM_STEP = 0.1

export default function MagicCubePage() {
  const navigate = useNavigate()
  const [faces, setFaces] = useState(createInitialFaces)
  const [viewRotation, setViewRotation] = useState(DEFAULT_VIEW)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animatingFace, setAnimatingFace] = useState(null)
  const [animatingClockwise, setAnimatingClockwise] = useState(true)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [scrambleHistory, setScrambleHistory] = useState([])
  const [showSolution, setShowSolution] = useState(false)
  const [solutionSteps, setSolutionSteps] = useState([])
  const [isScrambling, setIsScrambling] = useState(false)
  const [isSolving, setIsSolving] = useState(false)

  const isDraggingRef = useRef(false)
  const lastMousePosRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef(null)
  const animationStartTimeRef = useRef(0)
  const stateRef = useRef({ faces, isAnimating })
  const scrambleQueueRef = useRef([])
  const processScrambleQueueRef = useRef(null)
  const processSolveQueueRef = useRef(null)

  useEffect(() => {
    stateRef.current = { faces, isAnimating }
  }, [faces, isAnimating])

  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const runAnimation = useCallback((face, clockwise, onComplete) => {
    setAnimatingFace(face)
    setAnimatingClockwise(clockwise)
    setAnimationProgress(0)
    setIsAnimating(true)

    animationStartTimeRef.current = performance.now()

    const animate = (now) => {
      const elapsed = now - animationStartTimeRef.current
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setAnimationProgress(eased)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setFaces((prev) => rotateFace(prev, face, clockwise))
        setAnimatingFace(null)
        setAnimationProgress(0)
        setIsAnimating(false)
        animationFrameRef.current = null
        if (onComplete) onComplete()
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [])

  const handleRotate = useCallback((face, clockwise = true) => {
    if (stateRef.current.isAnimating || isScrambling || isSolving) return
    runAnimation(face, clockwise)
  }, [runAnimation, isScrambling, isSolving])

  const processScrambleQueue = useCallback(() => {
    if (scrambleQueueRef.current.length === 0) {
      setIsScrambling(false)
      const steps = scrambleQueueRef._originalMoves || []
      setSolutionSteps(movesToStrings(generateSolutionSteps(steps)))
      return
    }

    const next = scrambleQueueRef.current.shift()
    runAnimation(next.face, next.clockwise, () => {
      processScrambleQueueRef.current && processScrambleQueueRef.current()
    })
  }, [runAnimation])

  useEffect(() => {
    processScrambleQueueRef.current = processScrambleQueue
  }, [processScrambleQueue])

  const handleScramble = useCallback(() => {
    if (stateRef.current.isAnimating || isScrambling || isSolving) return

    const moves = generateScramble()
    scrambleQueueRef.current = [...moves]
    scrambleQueueRef._originalMoves = moves
    setScrambleHistory(moves)
    setShowSolution(false)
    setSolutionSteps([])
    setIsScrambling(true)

    setTimeout(() => {
      processScrambleQueueRef.current && processScrambleQueueRef.current()
    }, 100)
  }, [isScrambling, isSolving])

  const handleReset = useCallback(() => {
    if (isScrambling || isSolving) return
    cancelAnimation()
    setFaces(createInitialFaces())
    setScrambleHistory([])
    setShowSolution(false)
    setSolutionSteps([])
    setIsAnimating(false)
    setAnimatingFace(null)
    setAnimationProgress(0)
  }, [cancelAnimation, isScrambling, isSolving])

  const processSolveQueue = useCallback((steps) => {
    if (steps.length === 0) {
      setIsSolving(false)
      return
    }

    const next = steps.shift()
    runAnimation(next.face, next.clockwise, () => {
      processSolveQueueRef.current && processSolveQueueRef.current(steps)
    })
  }, [runAnimation])

  useEffect(() => {
    processSolveQueueRef.current = processSolveQueue
  }, [processSolveQueue])

  const handleShowSolution = useCallback(() => {
    if (scrambleHistory.length === 0) return
    setShowSolution((prev) => !prev)
  }, [scrambleHistory])

  const handleAutoSolve = useCallback(() => {
    if (stateRef.current.isAnimating || isScrambling || isSolving) return
    if (scrambleHistory.length === 0) return

    const solveSteps = generateSolutionSteps(scrambleHistory)
    scrambleQueueRef.current = []
    setIsSolving(true)
    setShowSolution(false)

    setTimeout(() => {
      processSolveQueueRef.current && processSolveQueueRef.current(solveSteps)
    }, 100)
  }, [scrambleHistory, isScrambling, isSolving])

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase()
      if (FACE_KEY_MAP[key]) {
        e.preventDefault()
        const clockwise = !e.shiftKey
        handleRotate(FACE_KEY_MAP[key], clockwise)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleRotate])

  const handleMouseDown = useCallback((e) => {
    isDraggingRef.current = true
    lastMousePosRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return

    const deltaX = e.clientX - lastMousePosRef.current.x
    const deltaY = e.clientY - lastMousePosRef.current.y

    setViewRotation((prev) => ({
      x: prev.x + deltaY * 0.4,
      y: prev.y + deltaX * 0.4,
    }))

    lastMousePosRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    setZoom((prev) => {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      return Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM)
    })
  }, [])

  const handleResetView = useCallback(() => {
    setViewRotation(DEFAULT_VIEW)
    setZoom(DEFAULT_ZOOM)
  }, [])

  useEffect(() => {
    return () => {
      cancelAnimation()
    }
  }, [cancelAnimation])

  const solved = isSolved(faces)
  const scrambled = scrambleHistory.length > 0 && !solved

  const getStatusText = () => {
    if (isSolving) return { text: '还原中...', className: 'status-badge-solving' }
    if (isScrambling) return { text: '打乱中...', className: 'status-badge-solving' }
    if (solved) return { text: '已还原', className: 'status-badge-solved' }
    if (scrambled) return { text: '已打乱', className: 'status-badge-scrambled' }
    return { text: '初始状态', className: 'status-badge-solved' }
  }

  const status = getStatusText()

  return (
    <div className="magic-cube-page">
      <div className="magic-cube-header">
        <h1 className="magic-cube-title">🧊 魔术方块</h1>
        <p className="magic-cube-subtitle">
          拖拽旋转视角 · 滚轮缩放 · 点击按钮或按键盘快捷键旋转面
        </p>
      </div>

      <div className="magic-cube-container">
        <div className="status-bar">
          <div className="status-item">
            <span>状态：</span>
            <span className={`status-badge ${status.className}`}>{status.text}</span>
          </div>
          <div className="status-item">
            <span>打乱步数：</span>
            <span>{scrambleHistory.length}</span>
          </div>
          <div className="status-item">
            <span>缩放：</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <button
            className="action-btn"
            onClick={handleResetView}
            style={{
              padding: '4px 12px',
              minWidth: 'auto',
              fontSize: '12px',
              background: 'linear-gradient(135deg, #74b9ff, #0984e3)',
            }}
          >
            重置视角
          </button>
        </div>

        <div
          className="magic-cube-stage"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div className="magic-cube-stage-info">
            💡 拖拽旋转 · 滚轮缩放
          </div>
          <MagicCube3D
            faces={faces}
            viewRotation={viewRotation}
            zoom={zoom}
            animatingFace={animatingFace}
            animatingClockwise={animatingClockwise}
            animationProgress={animationProgress}
          />
        </div>

        <div className="magic-cube-controls">
          <div className="control-section">
            <h3 className="control-section-title">面旋转按钮（Shift=逆时针）</h3>
            <div className="face-buttons">
              {Object.keys(FACE_NAMES).map((face) => (
                <button
                  key={face}
                  className={`face-btn face-btn-${face}`}
                  onClick={() => handleRotate(face, true)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    handleRotate(face, false)
                  }}
                  disabled={isAnimating || isScrambling || isSolving}
                  title={`${FACE_NAMES[face]}面 (${face}) - 右键/Shift+点击逆时针`}
                >
                  <div style={{ fontSize: '16px' }}>{FACE_NAMES[face]}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>{face}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <h3 className="control-section-title">键盘快捷键</h3>
            <div className="keyboard-hints">
              <div className="keyboard-hint-item">
                <span className="keyboard-key">F</span>
                <span>前面顺时针</span>
              </div>
              <div className="keyboard-hint-item">
                <span className="keyboard-key">B</span>
                <span>后面顺时针</span>
              </div>
              <div className="keyboard-hint-item">
                <span className="keyboard-key">L</span>
                <span>左面顺时针</span>
              </div>
              <div className="keyboard-hint-item">
                <span className="keyboard-key">R</span>
                <span>右面顺时针</span>
              </div>
              <div className="keyboard-hint-item">
                <span className="keyboard-key">U</span>
                <span>上面顺时针</span>
              </div>
              <div className="keyboard-hint-item">
                <span className="keyboard-key">D</span>
                <span>下面顺时针</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px', marginBottom: 0 }}>
              按住 Shift + 按键 = 逆时针旋转
            </p>
          </div>

          <div className="control-section">
            <h3 className="control-section-title">操作</h3>
            <div className="action-buttons">
              <button
                className="action-btn action-btn-scramble"
                onClick={handleScramble}
                disabled={isAnimating || isScrambling || isSolving}
              >
                🎲 打乱
              </button>
              <button
                className="action-btn action-btn-reset"
                onClick={handleReset}
                disabled={isScrambling || isSolving}
              >
                🔄 还原
              </button>
              <button
                className="action-btn action-btn-solve"
                onClick={handleShowSolution}
                disabled={scrambleHistory.length === 0 || isScrambling || isSolving}
              >
                📝 {showSolution ? '隐藏还原步骤' : '显示还原步骤'}
              </button>
              <button
                className="action-btn action-btn-solve"
                onClick={handleAutoSolve}
                disabled={scrambleHistory.length === 0 || isAnimating || isScrambling || isSolving}
                style={{ background: 'linear-gradient(135deg, #fd79a8, #e84393)' }}
              >
                ✨ 自动还原
              </button>
            </div>
          </div>

          {showSolution && solutionSteps.length > 0 && (
            <div className="solve-steps">
              <h4 className="solve-steps-title">
                🔧 还原步骤（共 {solutionSteps.length} 步）：
              </h4>
              <div className="solve-steps-content">
                {solutionSteps.map((step, idx) => (
                  <span key={idx} className="solve-step-tag">
                    {idx + 1}. {step}
                  </span>
                ))}
              </div>
            </div>
          )}

          {scrambleHistory.length > 0 && !showSolution && (
            <div className="solve-steps">
              <h4 className="solve-steps-title" style={{ color: '#ff7675' }}>
                📋 打乱步骤：
              </h4>
              <div className="solve-steps-content">
                {movesToStrings(scrambleHistory).map((step, idx) => (
                  <span
                    key={idx}
                    className="solve-step-tag"
                    style={{
                      background: 'rgba(255, 118, 117, 0.15)',
                      color: '#ff7675',
                      borderColor: 'rgba(255, 118, 117, 0.3)',
                    }}
                  >
                    {idx + 1}. {step}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="action-btn action-btn-back" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
      </div>
    </div>
  )
}
