import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DIFFICULTY,
  TIME_LIMIT,
  GAME_STATUS,
  GAME_OVER_REASON,
  VALIDATION_ERROR,
  PLAYER,
  HINT_PENALTY,
} from './constants.js'
import {
  validateIdiomInput,
  buildIdiomMapByFirstChar,
  selectAiIdiom,
  calculateScore,
  getHint,
  getLastChar,
  loadStreakRecord,
  saveStreakRecord,
  updateStreakRecord,
  determineWinner,
  getDifficultyIdiomList,
  getFirstChar,
} from './idiomCore.js'
import IDIOM_DATABASE from './idiomData.js'
import './idiomChain.css'

function IdiomChainPage() {
  const navigate = useNavigate()

  const [gameStatus, setGameStatus] = useState(GAME_STATUS.IDLE)
  const [difficulty, setDifficulty] = useState(null)
  const [chain, setChain] = useState([])
  const [usedWords, setUsedWords] = useState(() => new Set())
  const [idiomMapByFirstChar, setIdiomMapByFirstChar] = useState(() => new Map())
  const [currentIdiomList, setCurrentIdiomList] = useState([])
  const [humanScore, setHumanScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [validationError, setValidationError] = useState(null)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [showGameOverModal, setShowGameOverModal] = useState(false)
  const [gameOverReason, setGameOverReason] = useState(null)
  const [expandedCardIndex, setExpandedCardIndex] = useState(null)
  const [streakRecord, setStreakRecord] = useState(() => loadStreakRecord())
  const [hintIdiom, setHintIdiom] = useState(null)

  const chainContainerRef = useRef(null)
  const timerRef = useRef(null)
  const aiTimeoutRef = useRef(null)
  const lastIsHintedRef = useRef(false)

  const scrollToBottom = useCallback(() => {
    if (chainContainerRef.current) {
      chainContainerRef.current.scrollTop = chainContainerRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chain, scrollToBottom])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (gameStatus !== GAME_STATUS.PLAYING) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          handleGameOver(GAME_OVER_REASON.TIMEOUT)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [gameStatus])

  const handleGameOver = useCallback((reason) => {
    setGameStatus(GAME_STATUS.GAME_OVER)
    setGameOverReason(reason)
    setShowGameOverModal(true)

    const winnerResult = determineWinner(humanScore, aiScore)
    const playerWon = winnerResult.winner === PLAYER.HUMAN
    const newRecord = updateStreakRecord(streakRecord, playerWon)
    setStreakRecord(newRecord)
    saveStreakRecord(newRecord)
  }, [humanScore, aiScore, streakRecord])

  const startGame = useCallback((diff) => {
    const idiomList = getDifficultyIdiomList(IDIOM_DATABASE, diff)
    const idiomMap = buildIdiomMapByFirstChar(idiomList)

    setDifficulty(diff)
    setCurrentIdiomList(idiomList)
    setIdiomMapByFirstChar(idiomMap)
    setHumanScore(0)
    setAiScore(0)
    setChain([])
    setUsedWords(new Set())
    setInputValue('')
    setValidationError(null)
    setHintIdiom(null)
    setExpandedCardIndex(null)
    lastIsHintedRef.current = false

    const randomIndex = Math.floor(Math.random() * idiomList.length)
    const startIdiom = idiomList[randomIndex]
    const startChainItem = {
      idiom: startIdiom,
      player: PLAYER.AI,
      isNew: true,
    }

    setChain([startChainItem])
    const used = new Set()
    used.add(startIdiom.word)
    setUsedWords(used)

    setTimeLeft(TIME_LIMIT)
    setGameOverReason(null)
    setShowGameOverModal(false)
    setGameStatus(GAME_STATUS.PLAYING)

    setTimeout(() => {
      setChain((prev) => prev.map((item) => ({ ...item, isNew: false })))
    }, 500)
  }, [])

  const handleSubmit = useCallback(() => {
    if (gameStatus !== GAME_STATUS.PLAYING || !inputValue.trim()) return

    setHintIdiom(null)
    const lastChainItem = chain[chain.length - 1]
    const lastIdiom = lastChainItem ? lastChainItem.idiom : null
    const inputWord = inputValue.trim()

    const validation = validateIdiomInput(inputWord, lastIdiom, currentIdiomList, usedWords)
    if (!validation.valid) {
      setValidationError({
        type: validation.error,
        expectedChar: validation.expectedChar,
      })
      return
    }

    const newIdiom = currentIdiomList.find((item) => item.word === inputWord)
    const isHinted = lastIsHintedRef.current
    const score = calculateScore(newIdiom, currentIdiomList, chain, isHinted)

    setHumanScore((prev) => prev + score)
    lastIsHintedRef.current = false

    const newChainItem = {
      idiom: newIdiom,
      player: PLAYER.HUMAN,
      isHinted,
      isNew: true,
    }

    const newChain = [...chain, newChainItem]
    setChain(newChain)

    const newUsed = new Set(usedWords)
    newUsed.add(inputWord)
    setUsedWords(newUsed)

    setInputValue('')
    setValidationError(null)

    setGameStatus(GAME_STATUS.AI_THINKING)

    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current)
    }

    aiTimeoutRef.current = setTimeout(() => {
      const startChar = getLastChar(inputWord)
      const aiChoice = selectAiIdiom(startChar, idiomMapByFirstChar, newUsed, difficulty)

      if (!aiChoice) {
        handleGameOver(GAME_OVER_REASON.AI_CANNOT_RESPOND)
        return
      }

      const aiScoreGain = calculateScore(aiChoice, currentIdiomList, newChain, false)
      setAiScore((prev) => prev + aiScoreGain)

      const aiChainItem = {
        idiom: aiChoice,
        player: PLAYER.AI,
        isNew: true,
      }

      setChain((prev) => [...prev, aiChainItem])
      setUsedWords((prev) => {
        const s = new Set(prev)
        s.add(aiChoice.word)
        return s
      })

      setTimeLeft(TIME_LIMIT)
      setGameStatus(GAME_STATUS.PLAYING)

      setTimeout(() => {
        setChain((prev) => prev.map((item) => ({ ...item, isNew: false })))
      }, 500)
    }, difficulty.aiDelay)
  }, [gameStatus, inputValue, chain, currentIdiomList, usedWords, idiomMapByFirstChar, difficulty, handleGameOver])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const handleHint = useCallback(() => {
    if (gameStatus !== GAME_STATUS.PLAYING) return
    const lastChainItem = chain[chain.length - 1]
    const lastIdiom = lastChainItem ? lastChainItem.idiom : null
    if (!lastIdiom) return

    const startChar = getLastChar(lastIdiom.word)
    const hint = getHint(startChar, idiomMapByFirstChar, usedWords)
    if (hint) {
      setHintIdiom(hint)
      setInputValue(hint.word)
      lastIsHintedRef.current = true
    }
  }, [gameStatus, chain, idiomMapByFirstChar, usedWords])

  const handleSurrender = useCallback(() => {
    if (gameStatus !== GAME_STATUS.PLAYING) return
    handleGameOver(GAME_OVER_REASON.PLAYER_SURRENDER)
  }, [gameStatus, handleGameOver])

  const handlePlayAgain = useCallback(() => {
    setGameStatus(GAME_STATUS.IDLE)
    setShowGameOverModal(false)
    setChain([])
    setUsedWords(new Set())
    setDifficulty(null)
  }, [])

  const toggleCardExpand = useCallback((index) => {
    setExpandedCardIndex((prev) => (prev === index ? null : index))
  }, [])

  const getValidationErrorMessage = () => {
    if (!validationError) return ''
    switch (validationError.type) {
      case VALIDATION_ERROR.NOT_IN_DICTIONARY:
        return '不是合法成语'
      case VALIDATION_ERROR.FIRST_CHAR_MISMATCH:
        return `首字不匹配，应以'${validationError.expectedChar}'字开头`
      case VALIDATION_ERROR.ALREADY_USED:
        return '该成语已使用过'
      default:
        return ''
    }
  }

  const getGameOverReasonText = () => {
    switch (gameOverReason) {
      case GAME_OVER_REASON.TIMEOUT:
        return '超时未作答'
      case GAME_OVER_REASON.AI_CANNOT_RESPOND:
        return 'AI无法接龙'
      case GAME_OVER_REASON.PLAYER_SURRENDER:
        return '玩家认输'
      case GAME_OVER_REASON.INVALID_INPUT:
        return '输入无效'
      default:
        return ''
    }
  }

  const getWinnerText = () => {
    const result = determineWinner(humanScore, aiScore)
    switch (result.result) {
      case 'win':
        return { text: '你赢了！', cls: 'win' }
      case 'lose':
        return { text: '你输了', cls: 'lose' }
      default:
        return { text: '平局', cls: 'draw' }
    }
  }

  const renderWordWithHighlight = (word) => {
    const chars = word.split('')
    const firstIdx = 0
    const lastIdx = chars.length - 1

    return (
      <span className="char-highlight">
        {chars.map((char, idx) => {
          let cls = ''
          if (idx === firstIdx) cls = 'first'
          if (idx === lastIdx) cls = 'last'
          return (
            <span key={idx} className={cls}>
              {char}
            </span>
          )
        })}
      </span>
    )
  }

  const winnerInfo = getWinnerText()

  return (
    <div className="idiom-chain-page">
      <header className="game-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            style={{
              padding: '6px 12px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
            }}
            onClick={() => navigate('/')}
          >
            ← 返回
          </button>
          <h1 style={{ fontSize: 22, margin: 0, color: '#333' }}>成语接龙</h1>
        </div>
        <div className="streak-info">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#999' }}>当前连胜</span>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#faad14' }}>
              {streakRecord.currentStreak}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#999' }}>最高连胜</span>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
              {streakRecord.maxStreak}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#999' }}>总场次</span>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1677ff' }}>
              {streakRecord.totalGames}
            </span>
          </div>
        </div>
      </header>

      <main>
        {gameStatus === GAME_STATUS.IDLE && (
          <div className="difficulty-panel">
            <h2 className="difficulty-title">选择难度开始游戏</h2>
            <div className="difficulty-cards">
              {Object.values(DIFFICULTY).map((diff) => (
                <div
                  key={diff.id}
                  className={`difficulty-card ${diff.id}`}
                  onClick={() => startGame(diff)}
                >
                  <h3>{diff.name}</h3>
                  <div className="desc">{diff.description}</div>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>
                    词库：{diff.wordCount} 条
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(gameStatus === GAME_STATUS.PLAYING ||
          gameStatus === GAME_STATUS.AI_THINKING ||
          gameStatus === GAME_STATUS.GAME_OVER) && (
          <div className="game-body">
            <div className="score-panel" style={{ marginBottom: 20, justifyContent: 'space-between' }}>
              <div className="score-item player-human">
                <div className="label">玩家得分</div>
                <div className="value">{humanScore}</div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '4px 12px',
                  background: '#f0f0f0',
                  borderRadius: 20,
                  fontSize: 13,
                  color: '#555',
                  alignSelf: 'center',
                }}
              >
                {difficulty?.name}
              </div>
              <div className="score-item player-ai">
                <div className="label">AI得分</div>
                <div className="value">{aiScore}</div>
              </div>
            </div>

            <div className="timer-bar">
              <div
                className="timer-bar-fill"
                style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
              />
            </div>
            <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 13, color: '#888' }}>
              剩余时间：{timeLeft}s
            </div>

            <div className="chain-container" ref={chainContainerRef}>
              {chain.map((item, idx) => (
                <div
                  key={idx}
                  className={`idiom-card player-${item.player} ${
                    idx !== chain.length - 1 ? 'is-old' : ''
                  }`}
                  onClick={() => toggleCardExpand(idx)}
                >
                  <div className="idiom-card-header">
                    <span className={`player-tag ${item.player === PLAYER.HUMAN ? 'human' : 'ai'}`}>
                      {item.player === PLAYER.HUMAN ? '玩家' : 'AI'}
                    </span>
                    {item.isHinted && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 6px',
                          background: '#faad14',
                          color: '#fff',
                          borderRadius: 4,
                        }}
                      >
                        提示
                      </span>
                    )}
                  </div>
                  <div className="idiom-word">
                    {renderWordWithHighlight(item.idiom.word)}
                  </div>
                  {expandedCardIndex === idx && (
                    <div className="idiom-detail">
                      <div className="pinyin">{item.idiom.pinyin}</div>
                      <div className="meaning">{item.idiom.meaning}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {gameStatus === GAME_STATUS.AI_THINKING && (
              <div className="ai-thinking">
                <span className="dots">AI正在思考</span>
              </div>
            )}

            <div className="input-area">
              <input
                type="text"
                className="idiom-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={gameStatus !== GAME_STATUS.PLAYING}
                placeholder="请输入成语，按回车提交..."
                autoFocus
              />
              <div className="error-text">{getValidationErrorMessage()}</div>
              <div className="input-actions">
                <button
                  className="action-btn btn-hint"
                  onClick={handleHint}
                  disabled={gameStatus !== GAME_STATUS.PLAYING}
                >
                  提示（扣{HINT_PENALTY}分）
                </button>
                <button
                  className="action-btn btn-submit"
                  onClick={handleSubmit}
                  disabled={gameStatus !== GAME_STATUS.PLAYING || !inputValue}
                >
                  提交
                </button>
                <button
                  className="action-btn btn-surrender"
                  onClick={handleSurrender}
                  disabled={gameStatus !== GAME_STATUS.PLAYING}
                >
                  认输
                </button>
              </div>
              {hintIdiom && (
                <div className="hint-text">
                  💡 提示：{hintIdiom.word}（提示所得分将扣除{HINT_PENALTY}分）
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showGameOverModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>游戏结束！</h2>
            <div className={`result-banner ${winnerInfo.cls}`}>{winnerInfo.text}</div>
            <div style={{ textAlign: 'center', color: '#888', fontSize: 13, marginBottom: 8 }}>
              结束原因：{getGameOverReasonText()}
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">总回合数</div>
                <div className="stat-value">{chain.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">玩家得分</div>
                <div className="stat-value" style={{ color: '#1677ff' }}>{humanScore}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">AI得分</div>
                <div className="stat-value" style={{ color: '#ff4d4f' }}>{aiScore}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">独特成语</div>
                <div className="stat-value">{usedWords.size}</div>
              </div>
            </div>
            <div className="streak-highlight">
              🏆 当前连胜 <strong style={{ color: '#faad14' }}>{streakRecord.currentStreak}</strong> 场 |
              最高连胜 <strong style={{ color: '#52c41a' }}>{streakRecord.maxStreak}</strong> 场 |
              总计 <strong style={{ color: '#1677ff' }}>{streakRecord.totalGames}</strong> 场
            </div>
            <button className="action-btn btn-restart modal-close-btn" onClick={handlePlayAgain}>
              再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default IdiomChainPage
