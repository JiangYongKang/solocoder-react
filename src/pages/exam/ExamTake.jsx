import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  saveExamDraft,
  clearExamDraft,
  loadExamHistory,
  saveExamHistory,
  addExamRecord,
  formatDuration,
} from './examCore'

function getInitialStartedAt(initialStartedAt) {
  return initialStartedAt || Date.now()
}

function getInitialRemaining(exam, initialStartedAt) {
  const totalSeconds = (exam?.duration || 60) * 60
  const startTs = getInitialStartedAt(initialStartedAt)
  const elapsed = Math.floor((Date.now() - startTs) / 1000)
  return Math.max(0, totalSeconds - elapsed)
}

export default function ExamTake({ exam, initialAnswers, initialStartedAt, onFinish }) {
  const submittedRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  const examRef = useRef(exam)
  const answersRef = useRef(initialAnswers || {})
  const startedAtRef = useRef(null)
  const progressRef = useRef({ total: 0, answered: 0, unanswered: 0 })

  const [startedAt] = useState(() => getInitialStartedAt(initialStartedAt))
  const [answers, setAnswers] = useState(initialAnswers || {})
  const [remaining, setRemaining] = useState(() => getInitialRemaining(exam, initialStartedAt))

  useEffect(() => {
    startedAtRef.current = startedAt
  }, [startedAt])

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  useEffect(() => {
    examRef.current = exam
  }, [exam])

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    saveExamDraft(exam.id, {
      exam,
      answers,
      startedAt,
    })
  }, [exam, answers, startedAt])

  const handleSubmit = useCallback((auto = false) => {
    if (submittedRef.current) return
    submittedRef.current = true

    const currentExam = examRef.current
    const currentAnswers = answersRef.current
    const currentProgress = progressRef.current
    const currentStartedAt = startedAtRef.current

    if (!auto) {
      const unanswered = currentProgress.unanswered
      if (unanswered > 0) {
        const ok = window.confirm(
          `还有 ${unanswered} 道题未作答，确定要提交试卷吗？`
        )
        if (!ok) {
          submittedRef.current = false
          return
        }
      } else {
        const ok = window.confirm('确定提交试卷吗？提交后将无法修改。')
        if (!ok) {
          submittedRef.current = false
          return
        }
      }
    }

    const finishedAt = Date.now()
    const timeUsed = Math.floor((finishedAt - currentStartedAt) / 1000)

    const record = {
      id: `record_${Date.now()}`,
      examId: currentExam.id,
      examName: currentExam.name,
      totalScore: currentExam.totalScore,
      answers: currentAnswers,
      questions: currentExam.questions,
      duration: currentExam.duration,
      timeUsed,
      startedAt: currentStartedAt,
      finishedAt,
      date: finishedAt,
    }

    const history = loadExamHistory()
    saveExamHistory(addExamRecord(history, record))
    clearExamDraft(currentExam.id)

    onFinishRef.current(record)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer)
          if (!submittedRef.current) {
            handleSubmit(true)
          }
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [handleSubmit])

  const progress = useMemo(() => {
    const total = exam?.questions?.length || 0
    let answered = 0
    ;(exam?.questions || []).forEach((q) => {
      const a = answers[q.id]
      if (q.type === QUESTION_TYPES.MULTIPLE) {
        if (Array.isArray(a) && a.length > 0) answered += 1
      } else if (a !== undefined && a !== null && String(a).trim() !== '') {
        answered += 1
      }
    })
    return { total, answered, unanswered: total - answered }
  }, [exam, answers])

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  const timerClass = remaining > 300 ? 'normal' : remaining > 60 ? 'warning' : 'danger'

  const handleSingleChange = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  const handleMultipleChange = (qId, value, checked) => {
    setAnswers((prev) => {
      const arr = Array.isArray(prev[qId]) ? [...prev[qId]] : []
      if (checked) {
        if (!arr.includes(value)) arr.push(value)
      } else {
        const i = arr.indexOf(value)
        if (i !== -1) arr.splice(i, 1)
      }
      return { ...prev, [qId]: arr }
    })
  }

  const handleFillChange = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  if (!exam) return null

  return (
    <div>
      <div className="exam-taking-header">
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#1f2328' }}>{exam.name}</h2>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            总分 {exam.totalScore} 分 · 共 {exam.questions.length} 题
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div className="exam-progress-info">
            <span>已答 <span className="answered">{progress.answered}</span></span>
            <span>未答 <span className="unanswered">{progress.unanswered}</span></span>
            <span>共 <strong>{progress.total}</strong></span>
          </div>
          <div className={`exam-timer ${timerClass}`}>{formatDuration(remaining)}</div>
        </div>
      </div>

      <div className="exam-questions-scroll">
        {exam.questions.map((q, idx) => (
          <div key={q.id} className="exam-question-card">
            <div className="exam-question-header">
              <div>
                <span className="exam-question-number">第 {idx + 1} 题</span>
                <span
                  className={`question-type-tag ${q.type}`}
                  style={{ marginLeft: 8 }}
                >
                  {QUESTION_TYPE_LABELS[q.type]}
                </span>
              </div>
              <span className="question-score">{q.score} 分</span>
            </div>

            <div className="exam-question-stem">{q.stem || '（暂无题干）'}</div>

            {q.type === QUESTION_TYPES.SINGLE && (
              <div className="exam-options-group">
                {(q.options || []).map((opt) => (
                  <label
                    key={opt.value}
                    className="exam-option-item"
                  >
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      checked={answers[q.id] === opt.value}
                      onChange={() => handleSingleChange(q.id, opt.value)}
                    />
                    <span>
                      <span className="exam-option-label">{opt.label}.</span>
                      {opt.text || '（空）'}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {q.type === QUESTION_TYPES.MULTIPLE && (
              <div className="exam-options-group">
                {(q.options || []).map((opt) => {
                  const selected = Array.isArray(answers[q.id])
                    ? answers[q.id].includes(opt.value)
                    : false
                  return (
                    <label
                      key={opt.value}
                      className="exam-option-item"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) =>
                          handleMultipleChange(q.id, opt.value, e.target.checked)
                        }
                      />
                      <span>
                        <span className="exam-option-label">{opt.label}.</span>
                        {opt.text || '（空）'}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}

            {q.type === QUESTION_TYPES.FILL && (
              <input
                type="text"
                className="exam-fill-input"
                placeholder="请输入答案"
                value={answers[q.id] || ''}
                onChange={(e) => handleFillChange(q.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="exam-submit-bar">
        <button
          className="exam-btn exam-btn-primary"
          onClick={() => handleSubmit(false)}
        >
          提交试卷
        </button>
      </div>
    </div>
  )
}
