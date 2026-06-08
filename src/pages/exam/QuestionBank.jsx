import { useState, useMemo, useEffect } from 'react'
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  createQuestion,
  validateQuestion,
  loadQuestions,
  saveQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  filterQuestions,
  paginateQuestions,
} from './examCore'

const PAGE_SIZE = 5

function QuestionForm({ question, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({
    type: question?.type || QUESTION_TYPES.SINGLE,
    stem: question?.stem || '',
    score: question?.score ?? 5,
    options: question?.options
      ? question.options.map((o) => ({ ...o }))
      : [
          { label: 'A', value: 'A', text: '' },
          { label: 'B', value: 'B', text: '' },
          { label: 'C', value: 'C', text: '' },
          { label: 'D', value: 'D', text: '' },
        ],
    answer: question?.answer ?? (question?.type === QUESTION_TYPES.MULTIPLE ? [] : ''),
  }))
  const [error, setError] = useState('')

  const handleTypeChange = (e) => {
    const newType = e.target.value
    setForm((prev) => {
      let answer
      let options = prev.options
      if (newType === QUESTION_TYPES.MULTIPLE) {
        answer = Array.isArray(prev.answer) ? prev.answer : []
      } else if (newType === QUESTION_TYPES.SINGLE) {
        answer = Array.isArray(prev.answer) ? prev.answer[0] || '' : prev.answer || ''
      } else {
        answer = ''
      }
      if (
        (newType === QUESTION_TYPES.SINGLE || newType === QUESTION_TYPES.MULTIPLE) &&
        !options
      ) {
        options = [
          { label: 'A', value: 'A', text: '' },
          { label: 'B', value: 'B', text: '' },
          { label: 'C', value: 'C', text: '' },
          { label: 'D', value: 'D', text: '' },
        ]
      }
      return { ...prev, type: newType, answer, options }
    })
  }

  const handleOptionTextChange = (idx, text) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === idx ? { ...o, text } : o)),
    }))
  }

  const handleSingleAnswerChange = (value) => {
    setForm((prev) => ({ ...prev, answer: value }))
  }

  const handleMultipleAnswerChange = (value, checked) => {
    setForm((prev) => {
      const arr = Array.isArray(prev.answer) ? [...prev.answer] : []
      if (checked) {
        if (!arr.includes(value)) arr.push(value)
      } else {
        const i = arr.indexOf(value)
        if (i !== -1) arr.splice(i, 1)
      }
      return { ...prev, answer: arr }
    })
  }

  const handleAddOption = () => {
    setForm((prev) => {
      const nextLabel = String.fromCharCode(65 + (prev.options?.length || 0))
      return {
        ...prev,
        options: [
          ...(prev.options || []),
          { label: nextLabel, value: nextLabel, text: '' },
        ],
      }
    })
  }

  const handleRemoveOption = (idx) => {
    setForm((prev) => {
      const newOptions = prev.options.filter((_, i) => i !== idx)
      const remapped = newOptions.map((o, i) => ({
        label: String.fromCharCode(65 + i),
        value: String.fromCharCode(65 + i),
        text: o.text,
      }))
      let newAnswer = prev.answer
      if (prev.type === QUESTION_TYPES.SINGLE) {
        const removedLabel = prev.options[idx].value
        if (newAnswer === removedLabel) newAnswer = ''
        else {
          const newIdx = prev.options.findIndex((o) => o.value === newAnswer)
          if (newIdx > idx) {
            newAnswer = remapped[newIdx - 1]?.value || ''
          }
        }
      } else if (prev.type === QUESTION_TYPES.MULTIPLE && Array.isArray(prev.answer)) {
        const removedLabel = prev.options[idx].value
        newAnswer = prev.answer.filter((a) => a !== removedLabel).map((a) => {
          const oldIdx = prev.options.findIndex((o) => o.value === a)
          return oldIdx > idx ? remapped[oldIdx - 1]?.value : a
        })
      }
      return { ...prev, options: remapped, answer: newAnswer }
    })
  }

  const handleSubmit = () => {
    const toValidate = {
      ...form,
      id: question?.id,
    }
    const result = validateQuestion(toValidate)
    if (!result.valid) {
      setError(result.message)
      return
    }
    setError('')
    onSubmit({
      ...(question || {}),
      ...form,
    })
  }

  const isChoice = form.type === QUESTION_TYPES.SINGLE || form.type === QUESTION_TYPES.MULTIPLE

  return (
    <div className="question-form-overlay" onClick={onCancel}>
      <div className="question-form-panel" onClick={(e) => e.stopPropagation()}>
        <div className="question-form-header">
          <h3>{question ? '编辑题目' : '添加题目'}</h3>
          <button className="question-form-close" onClick={onCancel}>×</button>
        </div>
        <div className="question-form-body">
          {error && <div className="form-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>题型</label>
              <select className="exam-input" value={form.type} onChange={handleTypeChange}>
                {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>分值</label>
              <input
                type="number"
                min="1"
                className="exam-input"
                value={form.score}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, score: Math.max(1, Number(e.target.value) || 1) }))
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label>题干</label>
            <textarea
              className="exam-input"
              placeholder="请输入题目内容"
              value={form.stem}
              onChange={(e) => setForm((prev) => ({ ...prev, stem: e.target.value }))}
            />
          </div>

          {isChoice && (
            <div className="form-group">
              <label>
                选项
                {form.type === QUESTION_TYPES.SINGLE && '（选择正确选项）'}
                {form.type === QUESTION_TYPES.MULTIPLE && '（选择所有正确选项）'}
              </label>
              {form.options.map((opt, idx) => (
                <div key={idx} className="option-editor-row">
                  <span className="option-editor-label">{opt.label}</span>
                  <input
                    type="text"
                    className="exam-input"
                    placeholder={`请输入选项 ${opt.label} 的内容`}
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                  />
                  <label className="option-correct-toggle">
                    {form.type === QUESTION_TYPES.SINGLE ? (
                      <input
                        type="radio"
                        name="correct-answer"
                        checked={form.answer === opt.value}
                        onChange={() => handleSingleAnswerChange(opt.value)}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(form.answer) && form.answer.includes(opt.value)
                        }
                        onChange={(e) =>
                          handleMultipleAnswerChange(opt.value, e.target.checked)
                        }
                      />
                    )}
                    正确
                  </label>
                  {form.options.length > 2 && (
                    <button
                      className="exam-btn exam-btn-danger"
                      onClick={() => handleRemoveOption(idx)}
                    >
                      删除
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="exam-btn exam-btn-secondary"
                style={{ marginTop: 8 }}
                onClick={handleAddOption}
              >
                + 添加选项
              </button>
            </div>
          )}

          {form.type === QUESTION_TYPES.FILL && (
            <div className="form-group">
              <label>正确答案</label>
              <input
                type="text"
                className="exam-input"
                placeholder="请输入填空题的正确答案（精确匹配）"
                value={form.answer}
                onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
              />
            </div>
          )}
        </div>
        <div className="question-form-footer">
          <button className="exam-btn exam-btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button className="exam-btn exam-btn-primary" onClick={handleSubmit}>
            {question ? '保存修改' : '添加题目'}
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestionCard({ question, onEdit, onDelete }) {
  const renderAnswer = () => {
    if (question.type === QUESTION_TYPES.SINGLE) {
      const opt = (question.options || []).find((o) => o.value === question.answer)
      return opt ? `正确答案：${opt.label}. ${opt.text}` : `正确答案：${question.answer}`
    }
    if (question.type === QUESTION_TYPES.MULTIPLE) {
      const answers = Array.isArray(question.answer) ? question.answer : []
      const texts = answers
        .map((v) => {
          const opt = (question.options || []).find((o) => o.value === v)
          return opt ? `${opt.label}. ${opt.text}` : v
        })
        .join('、')
      return `正确答案：${texts}`
    }
    return `正确答案：${question.answer}`
  }

  return (
    <div className="question-card">
      <div className="question-card-header">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`question-type-tag ${question.type}`}>
            {QUESTION_TYPE_LABELS[question.type]}
          </span>
          <span className="question-score">{question.score} 分</span>
        </div>
      </div>
      <div className="question-stem">{question.stem || '（暂无题干）'}</div>
      {(question.type === QUESTION_TYPES.SINGLE || question.type === QUESTION_TYPES.MULTIPLE) && (
        <div className="question-options-preview">
          {(question.options || []).map((opt) => (
            <div
              key={opt.value}
              className={`question-option-item ${
                question.type === QUESTION_TYPES.SINGLE
                  ? question.answer === opt.value
                    ? 'correct'
                    : ''
                  : Array.isArray(question.answer) && question.answer.includes(opt.value)
                  ? 'correct'
                  : ''
              }`}
            >
              {opt.label}. {opt.text || '（空）'}
            </div>
          ))}
        </div>
      )}
      {question.type === QUESTION_TYPES.FILL && (
        <div className="question-option-item correct">{renderAnswer()}</div>
      )}
      <div className="question-card-actions">
        <button className="exam-btn exam-btn-secondary" onClick={onEdit}>
          编辑
        </button>
        <button className="exam-btn exam-btn-danger" onClick={onDelete}>
          删除
        </button>
      </div>
    </div>
  )
}

export default function QuestionBank() {
  const [questions, setQuestions] = useState(() => loadQuestions())
  const [filterType, setFilterType] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    saveQuestions(questions)
  }, [questions])

  const filtered = useMemo(
    () => filterQuestions(questions, { type: filterType, keyword }),
    [questions, filterType, keyword]
  )

  const safePage = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    return Math.min(Math.max(1, page), totalPages)
  }, [filtered.length, page])

  const paginated = useMemo(
    () => paginateQuestions(filtered, safePage, PAGE_SIZE),
    [filtered, safePage]
  )

  const handleAdd = () => {
    setEditing(null)
    setShowForm(true)
  }

  const handleEdit = (q) => {
    setEditing(q)
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('确定删除该题目？')) {
      setQuestions((prev) => deleteQuestion(prev, id))
    }
  }

  const handleFormSubmit = (data) => {
    if (editing) {
      setQuestions((prev) => updateQuestion(prev, editing.id, data))
    } else {
      const newQ = createQuestion(data.type)
      setQuestions((prev) => addQuestion(prev, { ...newQ, ...data }))
    }
    setShowForm(false)
    setEditing(null)
  }

  return (
    <div>
      <div className="exam-toolbar">
        <input
          type="text"
          className="exam-input wide"
          placeholder="搜索题干..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            setPage(1)
          }}
        />
        <select
          className="exam-input"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value)
            setPage(1)
          }}
        >
          <option value="">全部题型</option>
          {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button className="exam-btn exam-btn-primary" onClick={handleAdd}>
          + 添加题目
        </button>
      </div>

      {paginated.items.length === 0 ? (
        <div className="exam-empty">
          {questions.length === 0
            ? '题库为空，点击右上角按钮添加第一道题目'
            : '没有符合条件的题目'}
        </div>
      ) : (
        <div className="question-list">
          {paginated.items.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onEdit={() => handleEdit(q)}
              onDelete={() => handleDelete(q.id)}
            />
          ))}
        </div>
      )}

      {paginated.totalPages > 1 && (
        <div className="exam-pagination">
          <button
            className="exam-btn exam-btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </button>
          <span className="exam-pagination-info">
            第 {page} / {paginated.totalPages} 页，共 {paginated.total} 题
          </span>
          <button
            className="exam-btn exam-btn-secondary"
            disabled={page >= paginated.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </button>
        </div>
      )}

      {showForm && (
        <QuestionForm
          question={editing}
          onCancel={() => {
            setShowForm(false)
            setEditing(null)
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}
