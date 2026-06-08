import { useState, useMemo } from 'react'
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  loadQuestions,
  generateExam,
  saveExamDraft,
} from './examCore'

export default function ExamCreate({ onStartExam }) {
  const questions = useMemo(() => loadQuestions(), [])
  const [examName, setExamName] = useState('')
  const [duration, setDuration] = useState(60)
  const [totalScore, setTotalScore] = useState(100)
  const [currentExam, setCurrentExam] = useState(null)
  const [error, setError] = useState('')

  const totalBankScore = questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0)

  const handleGenerate = () => {
    setError('')
    if (!examName.trim()) {
      setError('请输入考试名称')
      return
    }
    if (!duration || duration < 1) {
      setError('考试时长必须大于 0 分钟')
      return
    }
    if (!totalScore || totalScore < 1) {
      setError('总分值必须大于 0')
      return
    }
    const result = generateExam(questions, {
      name: examName.trim(),
      duration: Number(duration),
      totalScore: Number(totalScore),
    })
    if (!result.ok) {
      setError(result.message)
      return
    }
    setCurrentExam(result.exam)
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  const handleStart = () => {
    if (!currentExam) return
    saveExamDraft(currentExam.id, {
      exam: currentExam,
      answers: {},
      startedAt: Date.now(),
    })
    onStartExam(currentExam)
  }

  return (
    <div>
      <div className="exam-create-form">
        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label>考试名称</label>
          <input
            type="text"
            className="exam-input"
            placeholder="例如：2024 期末模拟考试"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>考试时长（分钟）</label>
            <input
              type="number"
              min="1"
              className="exam-input"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="form-group">
            <label>试卷总分</label>
            <input
              type="number"
              min="1"
              className="exam-input"
              value={totalScore}
              onChange={(e) => setTotalScore(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>

        <div className="form-group">
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            当前题库共有 <strong>{questions.length}</strong> 道题，总分{' '}
            <strong>{totalBankScore}</strong> 分
          </div>
        </div>

        <button
          className="exam-btn exam-btn-primary"
          onClick={handleGenerate}
          disabled={questions.length === 0}
        >
          {currentExam ? '重新随机组卷' : '开始随机组卷'}
        </button>
      </div>

      {currentExam && (
        <div className="exam-preview">
          <div className="exam-preview-header">
            <h3>试卷预览：{currentExam.name}</h3>
            <div className="exam-preview-meta">
              <span>时长：{currentExam.duration} 分钟</span>
              <span>题数：{currentExam.questions.length} 道</span>
              <span>总分：{currentExam.totalScore} 分</span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <button className="exam-btn exam-btn-secondary" onClick={handleRegenerate}>
              🔄 换一组
            </button>
            <button
              className="exam-btn exam-btn-primary"
              style={{ marginLeft: 8 }}
              onClick={handleStart}
            >
              ▶ 开始考试
            </button>
          </div>

          <div className="question-list">
            {currentExam.questions.map((q, idx) => (
              <div key={q.id} className="exam-preview-question">
                <span className="exam-preview-question-score">{q.score} 分</span>
                <div>
                  <span className="exam-preview-question-index">{idx + 1}.</span>
                  <span
                    className={`question-type-tag ${q.type}`}
                    style={{ marginRight: 8 }}
                  >
                    {QUESTION_TYPE_LABELS[q.type]}
                  </span>
                  <span className="exam-preview-question-stem">
                    {q.stem || '（暂无题干）'}
                  </span>
                </div>
                {(q.type === QUESTION_TYPES.SINGLE || q.type === QUESTION_TYPES.MULTIPLE) && (
                  <div className="question-options-preview" style={{ marginTop: 8 }}>
                    {(q.options || []).map((opt) => (
                      <div key={opt.value} className="question-option-item">
                        {opt.label}. {opt.text || '（空）'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
