import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getCardsByDeckId,
  sortCardsForLearning,
  isCardDue,
  isNewCard,
  reviewCard,
  calculateSessionStats,
} from './flashcardUtils'

export default function StudyMode({
  cards,
  deckId,
  onFinish,
  onCardReviewed,
}) {
  const deckCards = useMemo(() => getCardsByDeckId(cards, deckId), [cards, deckId])
  const learningQueue = useMemo(() => sortCardsForLearning(deckCards), [deckCards])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState([])
  const [finished, setFinished] = useState(false)

  const currentCard = learningQueue[currentIndex]

  const handleFlip = useCallback(() => {
    setFlipped(prev => !prev)
  }, [])

  const handleAnswer = useCallback((remembered) => {
    if (!currentCard || !flipped) return

    const wasDue = isCardDue(currentCard) && !isNewCard(currentCard)
    const updatedCard = reviewCard(currentCard, remembered)

    onCardReviewed(updatedCard)
    setResults(prev => [...prev, { cardId: currentCard.id, remembered, wasDue }])

    if (currentIndex < learningQueue.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setFlipped(false)
    } else {
      setFinished(true)
      onFinish(results)
    }
  }, [currentCard, currentIndex, flipped, learningQueue, onCardReviewed, onFinish, results])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (!flipped) handleFlip()
      } else if (e.code === 'ArrowRight' || e.key === '1') {
        if (flipped) handleAnswer(true)
      } else if (e.code === 'ArrowLeft' || e.key === '2') {
        if (flipped) handleAnswer(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flipped, handleFlip, handleAnswer])

  if (learningQueue.length === 0) {
    return (
      <div className="fc-panel">
        <div className="fc-empty">当前牌组没有需要学习的卡片</div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="fc-btn" onClick={() => onFinish([])}>返回</button>
        </div>
      </div>
    )
  }

  if (finished) {
    const finalStats = calculateSessionStats(results)

    return (
      <div className="fc-panel">
        <div className="fc-session-summary">
          <h2 className="fc-session-title">学习完成！</h2>
          <div className="fc-session-stats">
            <div className="fc-session-stat">
              <div className="fc-session-stat-value">{finalStats.total}</div>
              <div className="fc-session-stat-label">已学数量</div>
            </div>
            <div className="fc-session-stat">
              <div className="fc-session-stat-value">{finalStats.remembered}</div>
              <div className="fc-session-stat-label">记住数量</div>
            </div>
            <div className="fc-session-stat">
              <div className="fc-session-stat-value">{finalStats.forgotten}</div>
              <div className="fc-session-stat-label">没记住数量</div>
            </div>
            <div className="fc-session-stat">
              <div className="fc-session-stat-value">{Math.round(finalStats.rate)}%</div>
              <div className="fc-session-stat-label">掌握率</div>
            </div>
          </div>
          <button className="fc-btn fc-btn-primary" onClick={() => onFinish(results)}>
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fc-panel">
      <div className="fc-study-mode">
        <div className="fc-study-progress">
          进度：{currentIndex + 1} / {learningQueue.length}
          {isNewCard(currentCard) ? '（新卡片）' : isCardDue(currentCard) ? '（复习）' : ''}
        </div>

        <div
          className={`fc-flashcard ${flipped ? 'flipped' : ''}`}
          onClick={handleFlip}
        >
          <div className="fc-flashcard-inner">
            <div className="fc-flashcard-face fc-flashcard-front">
              <div className="fc-flashcard-content">{currentCard?.front}</div>
              <div className="fc-flashcard-hint">点击卡片或按空格键翻牌</div>
            </div>
            <div className="fc-flashcard-face fc-flashcard-back">
              <div className="fc-flashcard-content">{currentCard?.back}</div>
              <div className="fc-flashcard-hint" style={{ color: 'rgba(255,255,255,0.7)' }}>
                记住了？选择结果（← 没记住 / → 记住了）
              </div>
            </div>
          </div>
        </div>

        {flipped && (
          <div className="fc-study-actions">
            <button
              className="fc-study-btn fc-btn-danger"
              onClick={() => handleAnswer(false)}
            >
              没记住
            </button>
            <button
              className="fc-study-btn fc-btn-success"
              onClick={() => handleAnswer(true)}
            >
              记住了
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
