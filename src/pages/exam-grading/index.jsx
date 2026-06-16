import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  GRADING_RESULTS,
  GRADING_RESULT_LABELS,
  STUDENT_STATUS,
  STUDENT_STATUS_LABELS,
  FILTER_OPTIONS,
  FILTER_OPTION_LABELS,
  MOCK_QUESTIONS,
  MOCK_STUDENTS,
  createInitialGradingState,
  getQuestionGrade,
  updateQuestionGrade,
  calculateStudentScore,
  isStudentAllGraded,
  updateStudentStatus,
  toggleStudentReview,
  getGradingProgress,
  filterStudents,
  findNextUngradedStudent,
  pickRandomStudentsForReview,
  formatDurationMs,
  formatTimestamp,
  escapeCSVValue,
  generateCSVContent,
  downloadCSV,
  generateCSVFilename,
  getStudentStatusLabel,
  isAutoGradable,
  getDefaultScoreForResult,
} from './examGradingCore'
import './exam-grading.css'

function StudentList({
  students,
  gradingState,
  currentStudentId,
  onSelectStudent,
  filter,
  onFilterChange,
}) {
  const filtered = useMemo(
    () => filterStudents(students, gradingState, filter),
    [students, gradingState, filter]
  )

  return (
    <div className="eg-panel">
      <div className="eg-panel-header">
        <h3 className="eg-panel-title">学生列表</h3>
        <span style={{ fontSize: 13, color: 'var(--text)' }}>
          {filtered.length} 人
        </span>
      </div>
      <div className="eg-filter-tabs">
        {Object.keys(FILTER_OPTIONS).map((key) => (
          <button
            key={key}
            className={`eg-filter-tab ${filter === FILTER_OPTIONS[key] ? 'active' : ''}`}
            onClick={() => onFilterChange(FILTER_OPTIONS[key])}
          >
            {FILTER_OPTION_LABELS[FILTER_OPTIONS[key]]}
          </button>
        ))}
      </div>
      <div className="eg-panel-body">
        {filtered.length === 0 ? (
          <div className="eg-empty-state">暂无学生</div>
        ) : (
          <div className="eg-student-list">
            {filtered.map((s) => {
              const g = gradingState[s.id]
              const isGraded = g && (g.status === STUDENT_STATUS.GRADED || (g.completedAt && !g.needsReview))
              const needsReview = g && g.needsReview
              const isActive = s.id === currentStudentId
              return (
                <div
                  key={s.id}
                  className={`eg-student-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectStudent(s.id)}
                >
                  <span
                    className={`eg-status-icon ${
                      needsReview
                        ? 'review'
                        : isGraded
                          ? 'graded'
                          : 'ungraded'
                    }`}
                  >
                    {needsReview ? '⚑' : isGraded ? '✓' : '○'}
                  </span>
                  <div className="eg-student-info">
                    <div className="eg-student-name">{s.name}</div>
                    <div className="eg-student-no">{s.studentNo}</div>
                  </div>
                  {needsReview && <span className="eg-review-flag">⚑</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function QuestionPanel({
  questions,
  gradingState,
  currentStudentId,
  currentQuestionIndex,
  onSelectQuestion,
  onGradeQuestion,
  onScoreChange,
  onCommentChange,
}) {
  const studentGrading = gradingState[currentStudentId]
  if (!studentGrading) {
    return (
      <div className="eg-panel">
        <div className="eg-empty-state">请选择一位学生开始阅卷</div>
      </div>
    )
  }

  const question = questions[currentQuestionIndex]
  if (!question) return null

  const grade = getQuestionGrade(gradingState, currentStudentId, question.id)
  const studentAnswer = studentGrading.answers[question.id]
  const auto = isAutoGradable(question)

  const handleGrade = (result) => {
    const defaultScore = getDefaultScoreForResult(question, result)
    onGradeQuestion(question.id, result, result === GRADING_RESULTS.PARTIAL ? (grade?.score ?? defaultScore) : defaultScore)
  }

  const handleScoreInput = (e) => {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val >= 0 && val <= question.score) {
      onScoreChange(question.id, val)
    }
  }

  const handleCommentInput = (e) => {
    onCommentChange(question.id, e.target.value)
  }

  return (
    <div className="eg-question-list">
      <div className="eg-question-card">
        <div className="eg-question-header">
          <span className="eg-question-index">第 {currentQuestionIndex + 1} 题</span>
          <span className="eg-question-type">{QUESTION_TYPE_LABELS[question.type]}</span>
          <span className="eg-question-score">满分 {question.score} 分</span>
          <span className={`eg-question-result ${grade?.result || 'ungraded'}`}>
            {grade?.result ? GRADING_RESULT_LABELS[grade.result] : GRADING_RESULT_LABELS[GRADING_RESULTS.UNGRADED]}
          </span>
        </div>

        <div className="eg-question-stem">{question.stem}</div>

        {question.type === QUESTION_TYPES.SINGLE && (
          <div className="eg-options-group">
            {question.options.map((opt) => {
              const isStudentAnswer = String(studentAnswer) === String(opt.value)
              const isCorrectAnswer = String(question.answer) === String(opt.value)
              let cls = 'eg-option-item'
              if (isStudentAnswer && isCorrectAnswer) cls += ' correct-answer'
              else if (isStudentAnswer) cls += ' student-answer'
              else if (isCorrectAnswer && auto) cls += ' correct-answer'
              return (
                <div key={opt.value} className={cls}>
                  <span className="eg-option-label">{opt.label}</span>
                  <span>{opt.text}</span>
                  {isStudentAnswer && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)' }}>学生答案</span>}
                  {isCorrectAnswer && !isStudentAnswer && auto && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#10b981' }}>正确答案</span>}
                  {isStudentAnswer && isCorrectAnswer && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#10b981' }}>✓ 正确</span>}
                </div>
              )
            })}
          </div>
        )}

        {question.type === QUESTION_TYPES.MULTIPLE && (
          <div className="eg-options-group">
            {question.options.map((opt) => {
              const isStudentAnswer = Array.isArray(studentAnswer) && studentAnswer.includes(opt.value)
              const isCorrectAnswer = Array.isArray(question.answer) && question.answer.includes(opt.value)
              let cls = 'eg-option-item'
              if (isStudentAnswer && isCorrectAnswer) cls += ' correct-answer'
              else if (isStudentAnswer) cls += ' student-answer'
              else if (isCorrectAnswer && auto) cls += ' correct-answer'
              return (
                <div key={opt.value} className={cls}>
                  <span className="eg-option-label">{opt.label}</span>
                  <span>{opt.text}</span>
                  {isStudentAnswer && !isCorrectAnswer && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)' }}>学生答案</span>}
                  {isCorrectAnswer && !isStudentAnswer && auto && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#10b981' }}>正确答案</span>}
                  {isStudentAnswer && isCorrectAnswer && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#10b981' }}>✓</span>}
                </div>
              )
            })}
          </div>
        )}

        {question.type === QUESTION_TYPES.ESSAY && (
          <>
            <div className="eg-section-block">
              <div className="eg-section-label">参考答案</div>
              <div className="eg-answer-text">{question.answer}</div>
            </div>
            <div className="eg-section-block">
              <div className="eg-section-label">学生答案</div>
              <div className={`eg-answer-text ${!studentAnswer ? 'empty' : ''}`}>
                {studentAnswer || '（未作答）'}
              </div>
            </div>
          </>
        )}

        {question.type === QUESTION_TYPES.SINGLE && (
          <div className="eg-section-block" style={{ marginTop: 12 }}>
            <div className="eg-section-label">参考答案</div>
            <div className="eg-answer-text" style={{ color: '#10b981' }}>
              {question.answer}
            </div>
          </div>
        )}

        {question.type === QUESTION_TYPES.MULTIPLE && (
          <div className="eg-section-block" style={{ marginTop: 12 }}>
            <div className="eg-section-label">参考答案</div>
            <div className="eg-answer-text" style={{ color: '#10b981' }}>
              {Array.isArray(question.answer) ? question.answer.sort().join(', ') : ''}
            </div>
          </div>
        )}

        <div className="eg-grading-area">
          <div className="eg-grading-buttons">
            <button
              className={`eg-grade-btn correct ${grade?.result === GRADING_RESULTS.CORRECT ? 'active' : ''}`}
              onClick={() => handleGrade(GRADING_RESULTS.CORRECT)}
            >
              ✓ 正确
            </button>
            <button
              className={`eg-grade-btn wrong ${grade?.result === GRADING_RESULTS.WRONG ? 'active' : ''}`}
              onClick={() => handleGrade(GRADING_RESULTS.WRONG)}
            >
              ✗ 错误
            </button>
            <button
              className={`eg-grade-btn partial ${grade?.result === GRADING_RESULTS.PARTIAL ? 'active' : ''}`}
              onClick={() => handleGrade(GRADING_RESULTS.PARTIAL)}
            >
              ⚐ 半对
            </button>
          </div>

          <div className="eg-score-input-wrapper">
            <span style={{ fontSize: 14, color: 'var(--text)' }}>得分</span>
            <input
              type="number"
              className="eg-score-input"
              min={0}
              max={question.score}
              value={grade?.result !== GRADING_RESULTS.UNGRADED ? (grade?.score ?? 0) : ''}
              onChange={handleScoreInput}
            />
            <span className="eg-score-max">/ {question.score} 分</span>
          </div>

          <textarea
            className="eg-comment-input"
            placeholder="填写评语（可选）"
            value={grade?.comment || ''}
            onChange={handleCommentInput}
          />
        </div>
      </div>

      <div className="eg-nav-buttons" style={{ padding: '0 4px' }}>
        <button
          className="eg-btn eg-btn-secondary"
          disabled={currentQuestionIndex === 0}
          onClick={() => onSelectQuestion(currentQuestionIndex - 1)}
        >
          ← 上一题
        </button>
        <button
          className="eg-btn eg-btn-secondary"
          disabled={currentQuestionIndex === questions.length - 1}
          onClick={() => onSelectQuestion(currentQuestionIndex + 1)}
        >
          下一题 →
        </button>
      </div>
    </div>
  )
}

function ScoreSummary({ questions, gradingState, currentStudentId }) {
  const scoreData = calculateStudentScore(gradingState, currentStudentId, questions)

  return (
    <div className="eg-panel eg-score-panel">
      <div className="eg-panel-header">
        <h3 className="eg-panel-title">得分汇总</h3>
      </div>
      <div className="eg-score-summary">
        <div className="eg-total-score">{scoreData.total}</div>
        <div className="eg-total-max">/ {scoreData.maxScore} 分</div>
      </div>
      <div className="eg-panel-body">
        <div className="eg-score-breakdown">
          {scoreData.details.map((d) => (
            <div key={d.questionId} className="eg-score-row">
              <span className="eg-score-q">第 {d.questionIndex} 题</span>
              <span className="eg-score-val">
                <span className={`eg-score-num ${d.result}`}>{d.score}</span>
                <span style={{ color: 'var(--text)', fontSize: 12 }}>/ {d.maxScore}</span>
                <span className={`eg-result-badge ${d.result}`}>
                  {GRADING_RESULT_LABELS[d.result]}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CSVPreviewModal({ students, questions, gradingState, onClose, onExport }) {
  const { csvContent, header, rows } = useMemo(
    () => generateCSVContent(students, questions, gradingState),
    [students, questions, gradingState]
  )

  return (
    <div className="eg-modal-overlay" onClick={onClose}>
      <div className="eg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="eg-modal-header">
          <h3>导出成绩预览</h3>
          <button className="eg-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="eg-modal-body">
          <div className="eg-csv-preview">
            <table className="eg-csv-table">
              <thead>
                <tr>
                  {header.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="eg-modal-footer">
          <button className="eg-btn eg-btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            className="eg-btn eg-btn-primary"
            onClick={() => {
              onExport(csvContent)
              onClose()
            }}
          >
            确认导出
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ExamGradingPage() {
  const navigate = useNavigate()
  const [gradingState, setGradingState] = useState(() =>
    createInitialGradingState(MOCK_QUESTIONS, MOCK_STUDENTS)
  )
  const [currentStudentId, setCurrentStudentId] = useState(() => {
    const first = MOCK_STUDENTS[0]
    return first ? first.id : null
  })
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [filter, setFilter] = useState(FILTER_OPTIONS.ALL)
  const [showCSVPreview, setShowCSVPreview] = useState(false)

  const progress = useMemo(
    () => getGradingProgress(gradingState, MOCK_STUDENTS),
    [gradingState]
  )

  const currentStudent = useMemo(
    () => MOCK_STUDENTS.find((s) => s.id === currentStudentId),
    [currentStudentId]
  )

  useEffect(() => {
    if (!currentStudentId) return
    setGradingState((prev) => {
      const g = prev[currentStudentId]
      if (!g || g.startedAt !== null) return prev
      return updateStudentStatus(prev, currentStudentId, STUDENT_STATUS.UNGRADED)
    })
  }, [currentStudentId])

  const handleSelectStudent = useCallback((studentId) => {
    setCurrentStudentId(studentId)
    setCurrentQuestionIndex(0)
  }, [])

  const handleGradeQuestion = useCallback(
    (questionId, result, score) => {
      if (!currentStudentId) return
      let nextStudent = null
      let allGraded = false

      setGradingState((prev) => {
        let next = prev
        const currentGrading = next[currentStudentId]
        if (currentGrading && currentGrading.startedAt === null) {
          next = updateStudentStatus(next, currentStudentId, STUDENT_STATUS.UNGRADED)
        }
        next = updateQuestionGrade(next, currentStudentId, questionId, {
          result,
          score,
        })
        if (isStudentAllGraded(next, currentStudentId, MOCK_QUESTIONS)) {
          next = updateStudentStatus(next, currentStudentId, STUDENT_STATUS.GRADED)
          allGraded = true
          nextStudent = findNextUngradedStudent(MOCK_STUDENTS, next, currentStudentId)
        }
        return next
      })

      const qIndex = MOCK_QUESTIONS.findIndex((q) => q.id === questionId)
      if (allGraded) {
        if (nextStudent) {
          setTimeout(() => {
            setCurrentStudentId(nextStudent.id)
            setCurrentQuestionIndex(0)
          }, 300)
        }
      } else if (qIndex < MOCK_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(qIndex + 1)
      }
    },
    [currentStudentId]
  )

  const handleScoreChange = useCallback(
    (questionId, score) => {
      if (!currentStudentId) return
      setGradingState((prev) =>
        updateQuestionGrade(prev, currentStudentId, questionId, { score })
      )
    },
    [currentStudentId]
  )

  const handleCommentChange = useCallback(
    (questionId, comment) => {
      if (!currentStudentId) return
      setGradingState((prev) =>
        updateQuestionGrade(prev, currentStudentId, questionId, { comment })
      )
    },
    [currentStudentId]
  )

  const handleToggleReview = useCallback(() => {
    if (!currentStudentId) return
    setGradingState((prev) => toggleStudentReview(prev, currentStudentId))
  }, [currentStudentId])

  const handleRandomReview = useCallback(() => {
    const count = Math.floor(Math.random() * 2) + 2
    const picked = pickRandomStudentsForReview(MOCK_STUDENTS, gradingState, count)
    if (picked.length === 0) return
    setGradingState((prev) => {
      let next = prev
      for (const s of picked) {
        if (!next[s.id].needsReview) {
          next = toggleStudentReview(next, s.id)
        }
      }
      return next
    })
  }, [gradingState])

  const handleExportCSV = useCallback((csvContent) => {
    const filename = generateCSVFilename()
    downloadCSV(csvContent, filename)
  }, [])

  return (
    <div className="eg-page">
      <div className="eg-header">
        <button className="eg-back-btn" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="eg-title">考试阅卷系统</h1>
      </div>

      <div className="eg-progress-section">
        <div className="eg-progress-bar-wrapper">
          <div className="eg-progress-bar">
            <div
              className="eg-progress-bar-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className="eg-progress-text">
            已阅 {progress.gradedCount} / {progress.total} 人（{progress.percentage}%）
          </span>
        </div>
        <div className="eg-progress-stats">
          <div className="eg-stat-item">
            <span className="eg-stat-label">已阅人数</span>
            <span className="eg-stat-value">{progress.gradedCount}</span>
          </div>
          <div className="eg-stat-item">
            <span className="eg-stat-label">未阅人数</span>
            <span className="eg-stat-value">{progress.ungradedCount}</span>
          </div>
          <div className="eg-stat-item">
            <span className="eg-stat-label">待复查</span>
            <span className="eg-stat-value">{progress.reviewCount}</span>
          </div>
          <div className="eg-stat-item">
            <span className="eg-stat-label">平均耗时</span>
            <span className="eg-stat-value">{formatDurationMs(progress.avgDuration)}</span>
          </div>
          <div className="eg-stat-item">
            <span className="eg-stat-label">最快耗时</span>
            <span className="eg-stat-value">{formatDurationMs(progress.minDuration)}</span>
          </div>
          <div className="eg-stat-item">
            <span className="eg-stat-label">最慢耗时</span>
            <span className="eg-stat-value">{formatDurationMs(progress.maxDuration)}</span>
          </div>
          <div className="eg-stat-item">
            <span className="eg-stat-label">预估剩余时间</span>
            <span className="eg-stat-value">{formatDurationMs(progress.estimatedRemainingMs)}</span>
          </div>
        </div>
      </div>

      <div className="eg-toolbar">
        <div className="eg-toolbar-left">
          <button className="eg-btn eg-btn-warning" onClick={handleRandomReview}>
            随机抽查
          </button>
          {currentStudentId && (
            <button className="eg-btn eg-btn-warning" onClick={handleToggleReview}>
              {gradingState[currentStudentId]?.needsReview ? '取消复查标记' : '标记为待复查'}
            </button>
          )}
        </div>
        <div className="eg-toolbar-right">
          <button
            className="eg-btn eg-btn-primary"
            onClick={() => setShowCSVPreview(true)}
          >
            导出成绩
          </button>
        </div>
      </div>

      <div className="eg-main-layout">
        <StudentList
          students={MOCK_STUDENTS}
          gradingState={gradingState}
          currentStudentId={currentStudentId}
          onSelectStudent={handleSelectStudent}
          filter={filter}
          onFilterChange={setFilter}
        />

        <div className="eg-middle-panel">
          {currentStudent ? (
            <>
              <div className="eg-student-header">
                <div className="eg-student-header-info">
                  <h3>
                    {currentStudent.name}（{currentStudent.studentNo}）
                  </h3>
                  <p>
                    状态：{getStudentStatusLabel(gradingState, currentStudentId)}
                    {gradingState[currentStudentId]?.completedAt &&
                      ` | 完成时间：${formatTimestamp(gradingState[currentStudentId].completedAt)}`}
                  </p>
                </div>
                <div className="eg-student-header-actions">
                  <button className="eg-btn eg-btn-warning" onClick={handleToggleReview}>
                    {gradingState[currentStudentId]?.needsReview ? '取消复查' : '⚑ 待复查'}
                  </button>
                </div>
              </div>
              <QuestionPanel
                questions={MOCK_QUESTIONS}
                gradingState={gradingState}
                currentStudentId={currentStudentId}
                currentQuestionIndex={currentQuestionIndex}
                onSelectQuestion={setCurrentQuestionIndex}
                onGradeQuestion={handleGradeQuestion}
                onScoreChange={handleScoreChange}
                onCommentChange={handleCommentChange}
              />
            </>
          ) : (
            <div className="eg-panel">
              <div className="eg-empty-state">请从左侧选择一位学生开始阅卷</div>
            </div>
          )}
        </div>

        {currentStudentId && (
          <ScoreSummary
            questions={MOCK_QUESTIONS}
            gradingState={gradingState}
            currentStudentId={currentStudentId}
          />
        )}
      </div>

      {showCSVPreview && (
        <CSVPreviewModal
          students={MOCK_STUDENTS}
          questions={MOCK_QUESTIONS}
          gradingState={gradingState}
          onClose={() => setShowCSVPreview(false)}
          onExport={handleExportCSV}
        />
      )}
    </div>
  )
}
