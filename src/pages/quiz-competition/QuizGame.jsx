import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  drawRandomQuestions,
  calculateScore,
  calculateRoundResult,
  calculateCoins,
  loadQuestions,
  loadCoins,
  saveCoins,
  loadInventory,
  saveInventory,
  consumeItem,
  ITEMS,
  ITEM_INFO,
  DEFAULT_TIME_LIMIT,
  DEFAULT_QUESTIONS_PER_ROUND,
  formatDuration,
  formatAccuracy,
} from './quizCore'

const ANIMATION_DURATION = 1000

export default function QuizGame({ onFinish, onBack, roundNumber = 1 }) {
  const [questions] = useState(() => {
    const qs = loadQuestions()
    return drawRandomQuestions(qs, DEFAULT_QUESTIONS_PER_ROUND)
  })
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME_LIMIT)
  const [totalTime, setTotalTime] = useState(DEFAULT_TIME_LIMIT)
  const [answers, setAnswers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [scoreAnimation, setScoreAnimation] = useState(null)
  const [coins, setCoins] = useState(() => loadCoins())
  const [inventory, setInventory] = useState(() => loadInventory())
  const [doubleNext, setDoubleNext] = useState(false)
  const [showRoundSummary, setShowRoundSummary] = useState(false)
  const [roundResult, setRoundResult] = useState(null)
  const [earnedCoins, setEarnedCoins] = useState(0)

  const timerRef = useRef(null)
  const startTimeRef = useRef(0)

  const currentQuestion = questions[currentIdx]

  const handleTimeout = useCallback(() => {
    setIsAnswered(true)
    setScoreAnimation({ type: 'timeout', value: `-${5}` })
    setAnswers((prev) => [...prev, null])
  }, [])

  const goToNextQuestion = useCallback(() => {
    setIsAnswered(false)
    setSelectedAnswer(null)
    setScoreAnimation(null)

    setCurrentIdx((prevIdx) => {
      if (prevIdx + 1 >= questions.length) {
        const duration = (Date.now() - (startTimeRef.current || 0)) / 1000
        const result = calculateRoundResult(questions, answers)
        const earned = calculateCoins(result.correctCount, result.isFullMarks)
        setRoundResult({ ...result, duration })
        setEarnedCoins(earned)
        setShowRoundSummary(true)

        setCoins((prevCoins) => {
          const newCoins = prevCoins + earned
          saveCoins(newCoins)
          return newCoins
        })

        return prevIdx
      }
      setTimeLeft(DEFAULT_TIME_LIMIT)
      setTotalTime(DEFAULT_TIME_LIMIT)
      return prevIdx + 1
    })
  }, [questions, answers])

  useEffect(() => {
    startTimeRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (isAnswered || !currentQuestion || showRoundSummary) {
      return undefined
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [currentIdx, isAnswered, currentQuestion, showRoundSummary, handleTimeout])

  useEffect(() => {
    if (isAnswered && !showRoundSummary) {
      const timer = setTimeout(() => {
        goToNextQuestion()
      }, ANIMATION_DURATION)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isAnswered, showRoundSummary, goToNextQuestion])

  const handleAnswer = (optionValue) => {
    if (isAnswered || !currentQuestion) return

    clearInterval(timerRef.current)
    setIsAnswered(true)
    setSelectedAnswer(optionValue)

    const isCorrect = optionValue === currentQuestion.answer
    const scoreChange = calculateScore(isCorrect, false, doubleNext)

    setScoreAnimation({
      type: isCorrect ? 'correct' : 'wrong',
      value: scoreChange > 0 ? `+${scoreChange}` : `${scoreChange}`,
    })

    const answerRecord = {
      selected: optionValue,
      correct: isCorrect,
      doubleNext: false,
    }

    if (doubleNext) {
      setDoubleNext(false)
    }

    setAnswers((prev) => [...prev, answerRecord])
  }

  const handleUseSkip = () => {
    if (isAnswered || !currentQuestion) return
    const result = consumeItem(inventory, ITEMS.SKIP)
    if (!result.success) {
      alert(result.message)
      return
    }
    setInventory(result.inventory)
    saveInventory(result.inventory)

    clearInterval(timerRef.current)
    setIsAnswered(true)
    setScoreAnimation({ type: 'skip', value: '跳过' })

    const answerRecord = {
      selected: currentQuestion.answer,
      skipped: true,
      correct: true,
    }
    setAnswers((prev) => [...prev, answerRecord])
  }

  const handleUseTime = () => {
    if (isAnswered || !currentQuestion) return
    const result = consumeItem(inventory, ITEMS.TIME)
    if (!result.success) {
      alert(result.message)
      return
    }
    setInventory(result.inventory)
    saveInventory(result.inventory)

    setTimeLeft((prev) => prev + 10)
    setTotalTime((prev) => prev + 10)
  }

  const handleUseDouble = () => {
    if (isAnswered || !currentQuestion) return
    if (doubleNext) {
      alert('双倍效果已激活')
      return
    }
    const result = consumeItem(inventory, ITEMS.DOUBLE)
    if (!result.success) {
      alert(result.message)
      return
    }
    setInventory(result.inventory)
    saveInventory(result.inventory)
    setDoubleNext(true)
  }

  const handleNextRound = () => {
    onFinish?.(roundResult, earnedCoins, true)
  }

  const handleFinish = () => {
    onFinish?.(roundResult, earnedCoins, false)
  }

  const progressPercent = useMemo(() => {
    if (questions.length === 0) return 0
    return ((currentIdx + (isAnswered ? 1 : 0)) / questions.length) * 100
  }, [currentIdx, questions.length, isAnswered])

  const timePercent = useMemo(() => {
    if (totalTime <= 0) return 0
    return (timeLeft / totalTime) * 100
  }, [timeLeft, totalTime])

  if (questions.length === 0) {
    return <div className="quiz-loading">加载中...</div>
  }

  if (showRoundSummary && roundResult) {
    return (
      <div className="quiz-round-summary">
        <div className="quiz-summary-card">
          <h2>第 {roundNumber} 轮结束</h2>
          <div className="quiz-summary-score">
            <span className="quiz-summary-score-label">本轮得分</span>
            <span className="quiz-summary-score-value">{roundResult.totalScore}</span>
          </div>
          <div className="quiz-summary-stats">
            <div className="quiz-summary-stat">
              <span className="quiz-summary-stat-label">答对</span>
              <span className="quiz-summary-stat-value correct">{roundResult.correctCount}</span>
            </div>
            <div className="quiz-summary-stat">
              <span className="quiz-summary-stat-label">答错</span>
              <span className="quiz-summary-stat-value wrong">{roundResult.wrongCount}</span>
            </div>
            <div className="quiz-summary-stat">
              <span className="quiz-summary-stat-label">超时</span>
              <span className="quiz-summary-stat-value timeout">{roundResult.timeoutCount}</span>
            </div>
          </div>
          <div className="quiz-summary-info">
            <div className="quiz-summary-info-item">
              <span>正确率：</span>
              <strong>{formatAccuracy(roundResult.accuracy)}</strong>
            </div>
            <div className="quiz-summary-info-item">
              <span>用时：</span>
              <strong>{formatDuration(roundResult.duration)}</strong>
            </div>
            <div className="quiz-summary-info-item">
              <span>获得金币：</span>
              <strong className="coin-reward">+{earnedCoins} 🪙</strong>
            </div>
          </div>
          {roundResult.isFullMarks && (
            <div className="quiz-full-marks">🎉 满分！额外奖励 {20} 金币！</div>
          )}
          <div className="quiz-summary-actions">
            <button className="quiz-btn" onClick={handleFinish}>
              结束答题
            </button>
            <button className="quiz-btn quiz-btn-primary" onClick={handleNextRound}>
              再来一局
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-game">
      <div className="quiz-game-header">
        <button className="quiz-back-btn" onClick={onBack}>
          ← 返回
        </button>
        <div className="quiz-game-info">
          <span className="quiz-round-info">第 {roundNumber} 轮</span>
          <span className="quiz-coin-balance">🪙 {coins}</span>
        </div>
      </div>

      <div className="quiz-progress-bar">
        <div
          className="quiz-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
        <span className="quiz-progress-text">
          第 {currentIdx + 1}/{questions.length} 题
        </span>
      </div>

      <div className="quiz-timer">
        <svg className="quiz-timer-ring" viewBox="0 0 100 100">
          <circle
            className="quiz-timer-bg"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
          />
          <circle
            className={`quiz-timer-progress ${timeLeft <= 5 ? 'warning' : ''}`}
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeDasharray="283"
            strokeDashoffset={283 - (283 * timePercent) / 100}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="quiz-timer-text">{timeLeft}</div>
      </div>

      {doubleNext && (
        <div className="quiz-double-hint">✨ 双倍得分效果已激活</div>
      )}

      <div className="quiz-question">
        <h3 className="quiz-question-stem">{currentQuestion?.stem}</h3>
        {scoreAnimation && (
          <div className={`quiz-score-animation ${scoreAnimation.type}`}>
            {scoreAnimation.value}
          </div>
        )}
      </div>

      <div className="quiz-options">
        {currentQuestion?.options.map((opt) => {
          let optionClass = 'quiz-option'
          if (isAnswered) {
            if (opt.value === currentQuestion.answer) {
              optionClass += ' correct'
            } else if (opt.value === selectedAnswer) {
              optionClass += ' wrong'
            } else {
              optionClass += ' disabled'
            }
          }
          return (
            <button
              key={opt.value}
              className={optionClass}
              onClick={() => handleAnswer(opt.value)}
              disabled={isAnswered}
            >
              <span className="quiz-option-letter">{opt.label}</span>
              <span className="quiz-option-text">{opt.text}</span>
            </button>
          )
        })}
      </div>

      <div className="quiz-items-bar">
        <div className="quiz-item" onClick={handleUseSkip} title={ITEM_INFO[ITEMS.SKIP].description}>
          <span className="quiz-item-icon">{ITEM_INFO[ITEMS.SKIP].icon}</span>
          <span className="quiz-item-name">{ITEM_INFO[ITEMS.SKIP].name}</span>
          <span className="quiz-item-count">×{inventory[ITEMS.SKIP] || 0}</span>
        </div>
        <div className="quiz-item" onClick={handleUseTime} title={ITEM_INFO[ITEMS.TIME].description}>
          <span className="quiz-item-icon">{ITEM_INFO[ITEMS.TIME].icon}</span>
          <span className="quiz-item-name">{ITEM_INFO[ITEMS.TIME].name}</span>
          <span className="quiz-item-count">×{inventory[ITEMS.TIME] || 0}</span>
        </div>
        <div className="quiz-item" onClick={handleUseDouble} title={ITEM_INFO[ITEMS.DOUBLE].description}>
          <span className="quiz-item-icon">{ITEM_INFO[ITEMS.DOUBLE].icon}</span>
          <span className="quiz-item-name">{ITEM_INFO[ITEMS.DOUBLE].name}</span>
          <span className="quiz-item-count">×{inventory[ITEMS.DOUBLE] || 0}</span>
        </div>
      </div>
    </div>
  )
}
