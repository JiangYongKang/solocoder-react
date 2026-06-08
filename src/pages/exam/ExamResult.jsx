import { useMemo } from 'react'
import {
  QUESTION_TYPE_LABELS,
  gradeExam,
  formatDuration,
  formatDate,
  getUserAnswerDisplay,
  getCorrectAnswerDisplay,
} from './examCore'

export default function ExamResult({ record, onBack, onRetry }) {
  const graded = useMemo(
    () => gradeExam({ questions: record.questions }, record.answers),
    [record]
  )

  const correctCount = graded.results.filter((r) => r.correct).length
  const accuracy = graded.maxScore > 0
    ? Math.round((graded.totalScore / graded.maxScore) * 100)
    : 0

  return (
    <div>
      <div className="exam-result-header">
        <div style={{ fontSize: 14, opacity: 0.9 }}>{record.examName}</div>
        <div className="exam-result-score">
          {graded.totalScore}
          <span style={{ fontSize: 18, fontWeight: 400, opacity: 0.8 }}>
            {' '}/ {graded.maxScore} 分
          </span>
        </div>
        <div className="exam-result-meta">
          <span>正确率 {accuracy}%</span>
          <span>答对 {correctCount}/{graded.results.length} 题</span>
          <span>用时 {formatDuration(record.timeUsed)}</span>
          <span>{formatDate(record.finishedAt)}</span>
        </div>
      </div>

      <div className="exam-toolbar" style={{ justifyContent: 'flex-end', marginTop: 0 }}>
        <button className="exam-btn exam-btn-secondary" onClick={onBack}>
          返回列表
        </button>
        {onRetry && (
          <button className="exam-btn exam-btn-primary" onClick={onRetry}>
            再考一次
          </button>
        )}
      </div>

      <div className="exam-result-detail">
        {graded.results.map((r, idx) => (
          <div
            key={r.questionId}
            className={`exam-result-item ${r.correct ? 'correct' : 'wrong'}`}
          >
            <div className="exam-result-item-header">
              <div>
                <span className="exam-question-number">第 {idx + 1} 题</span>
                <span
                  className={`question-type-tag ${r.question.type}`}
                  style={{ marginLeft: 8 }}
                >
                  {QUESTION_TYPE_LABELS[r.question.type]}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`exam-result-status ${r.correct ? 'correct' : 'wrong'}`}>
                  {r.correct ? '✓ 正确' : '✗ 错误'}
                </span>
                <span className="exam-result-score-line">
                  {r.score}/{r.maxScore} 分
                </span>
              </div>
            </div>
            <div className="exam-result-stem">{r.question.stem || '（暂无题干）'}</div>

            {(r.question.type === 'single' || r.question.type === 'multiple') && (
              <div className="question-options-preview" style={{ marginBottom: 8 }}>
                {(r.question.options || []).map((opt) => {
                  const isCorrect =
                    r.question.type === 'single'
                      ? r.question.answer === opt.value
                      : Array.isArray(r.question.answer) &&
                        r.question.answer.includes(opt.value)
                  const isUserSelected =
                    r.question.type === 'single'
                      ? r.userAnswer === opt.value
                      : Array.isArray(r.userAnswer) && r.userAnswer.includes(opt.value)
                  let styleClass = 'question-option-item'
                  if (isCorrect) styleClass += ' correct'
                  return (
                    <div key={opt.value} className={styleClass}>
                      {opt.label}. {opt.text || '（空）'}
                      {isCorrect && ' ✓'}
                      {isUserSelected && !isCorrect && ' ✗（你的选择）'}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="exam-result-row correct-answer">
              <span className="label">正确答案：</span>
              <span className="value">{getCorrectAnswerDisplay(r.question)}</span>
            </div>
            <div className={`exam-result-row user-answer ${r.correct ? '' : ''}`}>
              <span className="label">你的答案：</span>
              <span className="value">{getUserAnswerDisplay(r.question, r.userAnswer)}</span>
            </div>

            {!r.correct && r.hint && (
              <div className="exam-result-hint">💡 解析提示：{r.hint}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
