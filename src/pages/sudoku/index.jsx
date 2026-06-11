import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DIFFICULTY,
  DIFFICULTY_CONFIG,
  GAME_STATUS,
  MAX_HINTS,
} from './constants.js'
import {
  generatePuzzle,
  getAllConflicts,
  getUsedNumbers,
  autoRemoveNotes,
  formatTime,
  isGameComplete,
  createInitialNotes,
  createUndoAction,
  applyUndo,
  applyRedo,
  getHintCell,
  saveGameState,
  loadGameState,
  clearSavedGame,
} from './sudokuCore.js'
import './sudoku.css'

function SudokuPage() {
  const navigate = useNavigate()

  const [difficulty, setDifficulty] = useState(DIFFICULTY.EASY)
  const [puzzle, setPuzzle] = useState(null)
  const [solution, setSolution] = useState(null)
  const [board, setBoard] = useState(null)
  const [notes, setNotes] = useState(createInitialNotes)
  const [selectedCell, setSelectedCell] = useState(null)
  const [noteMode, setNoteMode] = useState(false)
  const [gameStatus, setGameStatus] = useState(GAME_STATUS.IDLE)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [hintsRemaining, setHintsRemaining] = useState(MAX_HINTS)
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [autoRemoveEnabled, setAutoRemoveEnabled] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(() => {
    const loaded = loadGameState()
    return loaded !== null
  })
  const [savedState, setSavedState] = useState(() => loadGameState())

  const timerRef = useRef(null)

  useEffect(() => {
    if (gameStatus === GAME_STATUS.PLAYING) {
      timerRef.current = setInterval(() => {
        setElapsedTime((t) => t + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameStatus])

  useEffect(() => {
    if (
      puzzle &&
      solution &&
      board &&
      gameStatus !== GAME_STATUS.IDLE &&
      gameStatus !== GAME_STATUS.COMPLETE
    ) {
      saveGameState({
        puzzle,
        solution,
        board,
        notes,
        elapsedTime,
        difficulty,
        hintsRemaining,
        undoStack,
        redoStack,
        autoRemoveEnabled,
      })
    }
  }, [board, notes, elapsedTime, difficulty, hintsRemaining, undoStack, redoStack, autoRemoveEnabled, puzzle, solution, gameStatus])

  const startNewGame = useCallback(
    (diff) => {
      clearSavedGame()
      setDifficulty(diff)
      const { puzzle: p, solution: s } = generatePuzzle(diff)
      setPuzzle(p)
      setSolution(s)
      setBoard(p.map((row) => [...row]))
      setNotes(createInitialNotes())
      setSelectedCell(null)
      setNoteMode(false)
      setGameStatus(GAME_STATUS.PLAYING)
      setElapsedTime(0)
      setHintsRemaining(MAX_HINTS)
      setUndoStack([])
      setRedoStack([])
    },
    []
  )

  const restoreGame = useCallback(() => {
    if (!savedState) return
    setDifficulty(savedState.difficulty)
    setPuzzle(savedState.puzzle)
    setSolution(savedState.solution)
    setBoard(savedState.board.map((row) => [...row]))
    setNotes(savedState.notes)
    setElapsedTime(savedState.elapsedTime)
    setHintsRemaining(savedState.hintsRemaining)
    setUndoStack(savedState.undoStack)
    setRedoStack(savedState.redoStack)
    setAutoRemoveEnabled(savedState.autoRemoveEnabled)
    setGameStatus(GAME_STATUS.PLAYING)
    setSelectedCell(null)
    setNoteMode(false)
    setShowRestoreDialog(false)
    setSavedState(null)
  }, [savedState])

  const handleNewInstead = useCallback(() => {
    setShowRestoreDialog(false)
    setSavedState(null)
    clearSavedGame()
    startNewGame(DIFFICULTY.EASY)
  }, [startNewGame])

  useEffect(() => {
    if (!showRestoreDialog && !puzzle && !savedState) {
      const rafId = requestAnimationFrame(() => {
        startNewGame(DIFFICULTY.EASY)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [showRestoreDialog, puzzle, savedState, startNewGame])

  const handleCellClick = useCallback(
    (row, col) => {
      if (gameStatus !== GAME_STATUS.PLAYING) return
      if (puzzle[row][col] !== 0) {
        setSelectedCell([row, col])
        return
      }
      setSelectedCell([row, col])
    },
    [gameStatus, puzzle]
  )

  const handleNumberInput = useCallback(
    (num) => {
      if (!selectedCell || gameStatus !== GAME_STATUS.PLAYING) return
      const [row, col] = selectedCell
      if (puzzle[row][col] !== 0) return

      if (noteMode) {
        const newNotes = notes.map((r) => r.map((c) => new Set(c)))
        const prevNoteSet = new Set(notes[row][col])
        if (newNotes[row][col].has(num)) {
          newNotes[row][col].delete(num)
        } else {
          newNotes[row][col].add(num)
        }
        const action = createUndoAction(
          'note',
          row,
          col,
          board[row][col],
          board[row][col],
          [...prevNoteSet]
        )
        setUndoStack((prev) => [...prev, action])
        setRedoStack([])
        setNotes(newNotes)
      } else {
        const prevValue = board[row][col]
        const newBoard = board.map((r) => [...r])
        newBoard[row][col] = num
        const prevNoteSet = new Set(notes[row][col])
        const action = createUndoAction(
          'fill',
          row,
          col,
          prevValue,
          num,
          [...prevNoteSet]
        )
        setUndoStack((prev) => [...prev, action])
        setRedoStack([])

        let newNotes = notes.map((r) => r.map((c) => new Set(c)))
        newNotes[row][col] = new Set()

        if (autoRemoveEnabled) {
          newNotes = autoRemoveNotes(newNotes, newBoard, row, col, num)
        }

        setBoard(newBoard)
        setNotes(newNotes)

        if (isGameComplete(newBoard, solution)) {
          setGameStatus(GAME_STATUS.COMPLETE)
          clearSavedGame()
        }
      }
    },
    [selectedCell, gameStatus, puzzle, noteMode, notes, board, solution, autoRemoveEnabled]
  )

  const handleErase = useCallback(() => {
    if (!selectedCell || gameStatus !== GAME_STATUS.PLAYING) return
    const [row, col] = selectedCell
    if (puzzle[row][col] !== 0) return
    if (board[row][col] === 0 && notes[row][col].size === 0) return

    const prevValue = board[row][col]
    const prevNoteSet = new Set(notes[row][col])
    const newBoard = board.map((r) => [...r])
    newBoard[row][col] = 0
    const newNotes = notes.map((r) => r.map((c) => new Set(c)))
    newNotes[row][col] = new Set()
    const action = createUndoAction('erase', row, col, prevValue, 0, [...prevNoteSet])
    setUndoStack((prev) => [...prev, action])
    setRedoStack([])
    setBoard(newBoard)
    setNotes(newNotes)
  }, [selectedCell, gameStatus, puzzle, board, notes])

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || gameStatus !== GAME_STATUS.PLAYING) return
    const action = undoStack[undoStack.length - 1]
    const newBoard = applyUndo(board, action)
    const newNotes = notes.map((r) => r.map((c) => new Set(c)))
    if (action.prevNotes) {
      newNotes[action.row][action.col] = new Set(action.prevNotes)
    }
    setBoard(newBoard)
    setNotes(newNotes)
    setUndoStack((prev) => prev.slice(0, -1))
    setRedoStack((prev) => [...prev, action])

    if (isGameComplete(newBoard, solution)) {
      setGameStatus(GAME_STATUS.COMPLETE)
      clearSavedGame()
    }
  }, [undoStack, board, notes, gameStatus, solution])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || gameStatus !== GAME_STATUS.PLAYING) return
    const action = redoStack[redoStack.length - 1]
    const newBoard = applyRedo(board, action)
    const newNotes = notes.map((r) => r.map((c) => new Set(c)))
    if (action.type === 'fill') {
      newNotes[action.row][action.col] = new Set()
      if (autoRemoveEnabled) {
        const updatedNotes = autoRemoveNotes(newNotes, newBoard, action.row, action.col, action.newValue)
        setNotes(updatedNotes)
      } else {
        setNotes(newNotes)
      }
    } else if (action.type === 'note') {
      setNotes(newNotes)
    } else {
      newNotes[action.row][action.col] = new Set()
      setNotes(newNotes)
    }
    setBoard(newBoard)
    setRedoStack((prev) => prev.slice(0, -1))
    setUndoStack((prev) => [...prev, action])

    if (isGameComplete(newBoard, solution)) {
      setGameStatus(GAME_STATUS.COMPLETE)
      clearSavedGame()
    }
  }, [redoStack, board, notes, gameStatus, solution, autoRemoveEnabled])

  const handleHint = useCallback(() => {
    if (hintsRemaining <= 0 || gameStatus !== GAME_STATUS.PLAYING) return
    let targetCell = selectedCell
    if (!targetCell) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] !== solution[r][c]) {
            targetCell = [r, c]
            break
          }
        }
        if (targetCell) break
      }
    }
    if (!targetCell) return
    const [row, col] = targetCell
    if (board[row][col] === solution[row][col]) return

    const hintValue = getHintCell(solution, board, row, col)
    if (hintValue === null) return

    const newBoard = board.map((r) => [...r])
    newBoard[row][col] = hintValue
    const newNotes = notes.map((r) => r.map((c) => new Set(c)))
    newNotes[row][col] = new Set()
    if (autoRemoveEnabled) {
      const updatedNotes = autoRemoveNotes(newNotes, newBoard, row, col, hintValue)
      setNotes(updatedNotes)
    } else {
      setNotes(newNotes)
    }
    setBoard(newBoard)
    setHintsRemaining((prev) => prev - 1)
    setSelectedCell([row, col])

    if (isGameComplete(newBoard, solution)) {
      setGameStatus(GAME_STATUS.COMPLETE)
      clearSavedGame()
    }
  }, [hintsRemaining, gameStatus, selectedCell, board, solution, notes, autoRemoveEnabled])

  const handlePause = useCallback(() => {
    if (gameStatus === GAME_STATUS.PLAYING) {
      setGameStatus(GAME_STATUS.PAUSED)
    }
  }, [gameStatus])

  const handleResume = useCallback(() => {
    if (gameStatus === GAME_STATUS.PAUSED) {
      setGameStatus(GAME_STATUS.PLAYING)
    }
  }, [gameStatus])

  const renderCell = (row, col) => {
    if (!board) return null
    const value = board[row][col]
    const isGiven = puzzle && puzzle[row][col] !== 0
    const isSelected =
      selectedCell && selectedCell[0] === row && selectedCell[1] === col
    const cellNotes = notes[row][col]

    let className = 'sudoku-cell'
    if (isSelected) className += ' selected'

    if (selectedCell && !isSelected) {
      const [sr, sc] = selectedCell
      const sameRow = sr === row
      const sameCol = sc === col
      const sameBox =
        Math.floor(sr / 3) === Math.floor(row / 3) &&
        Math.floor(sc / 3) === Math.floor(col / 3)
      if (sameRow || sameCol || sameBox) {
        className += ' same-row-col-box'
      }
      if (value !== 0 && board[sr][sc] === value) {
        className += ' same-number'
      }
    }

    if (isGiven) {
      className += ' given'
    } else if (value !== 0) {
      if (
        hintsRemaining < MAX_HINTS &&
        value === solution[row][col]
      ) {
        const hadUndoForThisCell = undoStack.some(
          (a) => a.row === row && a.col === col
        )
        className += hadUndoForThisCell ? ' user-filled' : ' hint-filled'
      } else {
        className += ' user-filled'
      }
    }

    const conflictSet = board ? getAllConflicts(board) : new Set()
    if (conflictSet.has(`${row}-${col}`) && !isGiven) {
      className += ' conflict'
    }

    if (col === 2 || col === 5) className += ' border-right-thick'
    if (row === 2 || row === 5) className += ' border-bottom-thick'

    return (
      <div
        key={`${row}-${col}`}
        className={className}
        onClick={() => handleCellClick(row, col)}
      >
        {value !== 0 ? (
          <span>{value}</span>
        ) : cellNotes.size > 0 ? (
          <div className="sudoku-notes">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <span key={n} className="sudoku-note-num">
                {cellNotes.has(n) ? n : ''}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  const usedNumbers =
    selectedCell && board
      ? getUsedNumbers(board, selectedCell[0], selectedCell[1])
      : new Set()

  const difficultyName = DIFFICULTY_CONFIG[difficulty]?.name || ''

  if (!board) return null

  return (
    <div className="sudoku-page">
      {showRestoreDialog && (
        <div className="sudoku-restore-dialog">
          <div className="sudoku-restore-dialog-inner">
            <div className="sudoku-restore-dialog-title">
              检测到未完成的游戏，是否继续？
            </div>
            <div className="sudoku-restore-dialog-btns">
              <button
                className="sudoku-restore-continue-btn"
                onClick={restoreGame}
              >
                继续游戏
              </button>
              <button
                className="sudoku-restore-new-btn"
                onClick={handleNewInstead}
              >
                重新开始
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sudoku-header">
        <div className="sudoku-header-left">
          <button className="sudoku-back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="sudoku-title">数独游戏</h1>
        </div>
        <div className="sudoku-header-right">
          <div className="sudoku-hints-badge">
            💡 {hintsRemaining}/{MAX_HINTS}
          </div>
          <div className="sudoku-timer">{formatTime(elapsedTime)}</div>
          <button className="sudoku-pause-btn" onClick={handlePause}>
            ⏸ 暂停
          </button>
          <button
            className="sudoku-undo-btn"
            onClick={handleUndo}
            disabled={undoStack.length === 0 || gameStatus !== GAME_STATUS.PLAYING}
          >
            ↩ 撤销
          </button>
          <button
            className="sudoku-redo-btn"
            onClick={handleRedo}
            disabled={redoStack.length === 0 || gameStatus !== GAME_STATUS.PLAYING}
          >
            ↪ 重做
          </button>
          <button
            className="sudoku-hint-btn"
            onClick={handleHint}
            disabled={hintsRemaining <= 0 || gameStatus !== GAME_STATUS.PLAYING}
          >
            💡 提示
          </button>
        </div>
      </div>

      <div className="sudoku-main">
        <div className="sudoku-game-section">
          <div className="sudoku-difficulty-bar">
            {Object.values(DIFFICULTY).map((diff) => (
              <button
                key={diff}
                className={`sudoku-diff-btn ${difficulty === diff ? 'active' : ''}`}
                onClick={() => startNewGame(diff)}
              >
                {DIFFICULTY_CONFIG[diff].name}
              </button>
            ))}
          </div>

          <div className="sudoku-difficulty-label">
            当前难度：<span>{difficultyName}</span>
          </div>

          <div className="sudoku-toolbar">
            <div className="sudoku-mode-toggle">
              <button
                className={`sudoku-mode-btn ${!noteMode ? 'active' : ''}`}
                onClick={() => setNoteMode(false)}
              >
                填写模式
              </button>
              <button
                className={`sudoku-mode-btn ${noteMode ? 'active' : ''}`}
                onClick={() => setNoteMode(true)}
              >
                笔记模式
              </button>
            </div>
            <button className="sudoku-erase-btn" onClick={handleErase}>
              🗑 清除
            </button>
            <label className="sudoku-auto-remove-label">
              <input
                type="checkbox"
                checked={autoRemoveEnabled}
                onChange={(e) => setAutoRemoveEnabled(e.target.checked)}
              />
              自动移除候选项
            </label>
          </div>

          <div className="sudoku-board-container">
            <div className="sudoku-board">
              {Array.from({ length: 9 }, (_, r) =>
                Array.from({ length: 9 }, (_, c) => renderCell(r, c))
              )}
            </div>

            {gameStatus === GAME_STATUS.PAUSED && (
              <div className="sudoku-pause-overlay" onClick={handleResume}>
                <div className="sudoku-pause-text">游 戏 暂 停</div>
                <button className="sudoku-resume-btn" onClick={handleResume}>
                  继续游戏
                </button>
              </div>
            )}

            {gameStatus === GAME_STATUS.COMPLETE && (
              <div className="sudoku-complete-overlay">
                <div className="sudoku-complete-title">🎉 恭喜通关！</div>
                <div className="sudoku-complete-info">
                  用时：{formatTime(elapsedTime)}
                </div>
                <button
                  className="sudoku-new-game-overlay-btn"
                  onClick={() => startNewGame(difficulty)}
                >
                  再来一局
                </button>
              </div>
            )}
          </div>

          <div className="sudoku-numpad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                className={`sudoku-num-btn ${usedNumbers.has(num) ? 'disabled' : ''}`}
                onClick={() => handleNumberInput(num)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="sudoku-side-panel">
          <div className="sudoku-panel">
            <div className="sudoku-panel-title">操作说明</div>
            <div className="sudoku-controls">
              <div>
                <span className="sudoku-key">点击格子</span> 选中
              </div>
              <div>
                <span className="sudoku-key">数字面板</span> 填入/笔记
              </div>
              <div>
                <span className="sudoku-key">填写模式</span> 直接填入数字
              </div>
              <div>
                <span className="sudoku-key">笔记模式</span> 添加候选数字
              </div>
              <div>
                <span className="sudoku-key">清除</span> 删除填入/笔记
              </div>
              <div>
                <span className="sudoku-key">撤销</span> 回退上一步
              </div>
              <div>
                <span className="sudoku-key">重做</span> 恢复已撤销
              </div>
              <div>
                <span className="sudoku-key">提示</span> 自动填入答案
              </div>
              <div>
                <span className="sudoku-key">暂停</span> 暂停并遮盖
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SudokuPage
