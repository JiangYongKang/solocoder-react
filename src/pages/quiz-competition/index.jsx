import { useState } from 'react'
import QuestionBank from './QuestionBank'
import QuizGame from './QuizGame'
import Leaderboard from './Leaderboard'
import ItemShop from './ItemShop'
import {
  loadRanking,
  saveRanking,
  addRankingRecord,
  createRankingRecord,
  loadCoins,
} from './quizCore'
import './quiz.css'

const VIEWS = {
  HOME: 'home',
  BANK: 'bank',
  GAME: 'game',
  RANKING: 'ranking',
  SHOP: 'shop',
}

const TABS = [
  { key: VIEWS.BANK, label: '题库管理' },
  { key: VIEWS.RANKING, label: '排行榜' },
  { key: VIEWS.SHOP, label: '道具商店' },
]

export default function QuizCompetition() {
  const [view, setView] = useState(VIEWS.HOME)
  const [nickname, setNickname] = useState('')
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [multiRoundData, setMultiRoundData] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const [coins] = useState(() => loadCoins())

  const handleStartGame = (multiRound = false) => {
    const ranking = loadRanking()
    if (ranking.length > 0 && !nickname) {
      setShowNicknameModal(true)
      return
    }
    if (multiRound) {
      setMultiRoundData({
        totalScore: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalTimeout: 0,
        rounds: 0,
        totalDuration: 0,
        totalEarnedCoins: 0,
      })
    } else {
      setMultiRoundData(null)
    }
    setGameKey((k) => k + 1)
    setView(VIEWS.GAME)
  }

  const handleConfirmNickname = () => {
    if (!nickname.trim()) {
      alert('请输入昵称')
      return
    }
    setShowNicknameModal(false)
    setGameKey((k) => k + 1)
    setView(VIEWS.GAME)
  }

  const handleGameFinish = (roundResult, earnedCoins, continueNext) => {
    if (multiRoundData) {
      const updated = {
        totalScore: multiRoundData.totalScore + roundResult.totalScore,
        totalCorrect: multiRoundData.totalCorrect + roundResult.correctCount,
        totalWrong: multiRoundData.totalWrong + roundResult.wrongCount,
        totalTimeout: multiRoundData.totalTimeout + roundResult.timeoutCount,
        rounds: multiRoundData.rounds + 1,
        totalDuration: multiRoundData.totalDuration + roundResult.duration,
        totalEarnedCoins: multiRoundData.totalEarnedCoins + earnedCoins,
      }
      setMultiRoundData(updated)

      if (continueNext) {
        setGameKey((k) => k + 1)
        return
      }

      const record = createRankingRecord({
        nickname: nickname || '匿名玩家',
        score: roundResult.totalScore,
        correctCount: updated.totalCorrect,
        wrongCount: updated.totalWrong,
        timeoutCount: updated.totalTimeout,
        rounds: updated.rounds,
        totalScore: updated.totalScore,
        duration: updated.totalDuration,
      })

      const ranking = loadRanking()
      const updatedRanking = addRankingRecord(ranking, record)
      saveRanking(updatedRanking)
      setView(VIEWS.RANKING)
      setMultiRoundData(null)
    } else {
      const record = createRankingRecord({
        nickname: nickname || '匿名玩家',
        score: roundResult.totalScore,
        correctCount: roundResult.correctCount,
        wrongCount: roundResult.wrongCount,
        timeoutCount: roundResult.timeoutCount,
        rounds: 1,
        totalScore: roundResult.totalScore,
        duration: roundResult.duration,
      })

      const ranking = loadRanking()
      const updatedRanking = addRankingRecord(ranking, record)
      saveRanking(updatedRanking)
      setView(VIEWS.RANKING)
    }
  }

  const handleBackToHome = () => {
    if (view === VIEWS.GAME) {
      if (!window.confirm('正在答题中，确定要离开吗？')) {
        return
      }
      setMultiRoundData(null)
    }
    setView(VIEWS.HOME)
  }

  const roundNumber = multiRoundData ? multiRoundData.rounds + 1 : 1

  return (
    <div className="quiz-competition">
      <div className="quiz-header">
        {view !== VIEWS.HOME && (
          <button className="quiz-back-btn" onClick={handleBackToHome}>
            ← 返回首页
          </button>
        )}
        <h1 className="quiz-title">
          {view === VIEWS.HOME && '🏆 答题竞赛'}
          {view === VIEWS.BANK && '📚 题库管理'}
          {view === VIEWS.GAME && '🎮 答题中'}
          {view === VIEWS.RANKING && '🏅 排行榜'}
          {view === VIEWS.SHOP && '🛒 道具商店'}
        </h1>
        {view !== VIEWS.GAME && view !== VIEWS.HOME && (
          <div className="quiz-coin-badge">🪙 {coins}</div>
        )}
      </div>

      {view === VIEWS.HOME && (
        <div className="quiz-home">
          <div className="quiz-home-hero">
            <div className="quiz-hero-title">答题竞赛</div>
            <div className="quiz-hero-subtitle">挑战你的知识极限，赢取金币奖励！</div>
          </div>

          <div className="quiz-home-actions">
            <button
              className="quiz-btn quiz-btn-large quiz-btn-primary"
              onClick={() => handleStartGame(false)}
            >
              🎯 单局挑战
            </button>
            <button
              className="quiz-btn quiz-btn-large quiz-btn-secondary"
              onClick={() => handleStartGame(true)}
            >
              🔥 多轮对战
            </button>
          </div>

          <div className="quiz-home-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className="quiz-home-tab"
                onClick={() => setView(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="quiz-home-info">
            <div className="quiz-info-card">
              <div className="quiz-info-icon">⏱️</div>
              <div className="quiz-info-title">限时答题</div>
              <div className="quiz-info-desc">每题 15 秒，紧张刺激</div>
            </div>
            <div className="quiz-info-card">
              <div className="quiz-info-icon">💰</div>
              <div className="quiz-info-title">赢取金币</div>
              <div className="quiz-info-desc">答对得金币，换道具</div>
            </div>
            <div className="quiz-info-card">
              <div className="quiz-info-icon">🏆</div>
              <div className="quiz-info-title">排行榜</div>
              <div className="quiz-info-desc">与自己比拼，挑战极限</div>
            </div>
          </div>
        </div>
      )}

      {view === VIEWS.BANK && <QuestionBank />}

      {view === VIEWS.GAME && (
        <QuizGame
          key={gameKey}
          onFinish={handleGameFinish}
          onBack={handleBackToHome}
          roundNumber={roundNumber}
        />
      )}

      {view === VIEWS.RANKING && <Leaderboard />}

      {view === VIEWS.SHOP && <ItemShop />}

      {showNicknameModal && (
        <div className="quiz-modal-overlay" onClick={() => setShowNicknameModal(false)}>
          <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quiz-modal-header">
              <h3>输入昵称</h3>
            </div>
            <div className="quiz-modal-body">
              <div className="quiz-form-group">
                <label className="quiz-form-label">你的昵称</label>
                <input
                  type="text"
                  className="quiz-form-input"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="请输入昵称"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmNickname()
                  }}
                />
              </div>
            </div>
            <div className="quiz-modal-footer">
              <button className="quiz-btn" onClick={() => setShowNicknameModal(false)}>
                取消
              </button>
              <button className="quiz-btn quiz-btn-primary" onClick={handleConfirmNickname}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
