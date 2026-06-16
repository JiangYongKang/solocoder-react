import { useState, useMemo } from 'react'
import {
  loadQuestions,
  saveQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  createQuestion,
  validateQuestion,
  filterQuestionsByCategory,
  getCategories,
  QUESTION_TYPE_LABEL,
} from './quizCore'

export default function QuestionBank() {
  const [questions, setQuestions] = useState(() => loadQuestions())
  const [category, setCategory] = useState('')
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  const categories = useMemo(() => getCategories(questions), [questions])
  const filteredQuestions = useMemo(
    () => filterQuestionsByCategory(questions, category),
    [questions, category]
  )

  const handleAdd = () => {
    setEditingQuestion(createQuestion())
    setError('')
    setShowModal(true)
  }

  const handleEdit = (q) => {
    setEditingQuestion({
      ...q,
      options: q.options.map((o) => ({ ...o })),
    })
    setError('')
    setShowModal(true)
  }

  const handleDelete = (q) => {
    if (!window.confirm(`确定删除题目"${q.stem}"吗？`)) return
    setQuestions((prev) => {
      const updated = deleteQuestion(prev, q.id)
      saveQuestions(updated)
      return updated
    })
  }

  const handleSave = () => {
    const validation = validateQuestion(editingQuestion)
    if (!validation.valid) {
      setError(validation.message)
      return
    }
    setQuestions((prev) => {
      let updated
      const exists = prev.some((q) => q.id === editingQuestion.id)
      if (exists) {
        updated = updateQuestion(prev, editingQuestion.id, editingQuestion)
      } else {
        updated = addQuestion(prev, editingQuestion)
      }
      saveQuestions(updated)
      return updated
    })
    setShowModal(false)
    setEditingQuestion(null)
  }

  const handleCancel = () => {
    setShowModal(false)
    setEditingQuestion(null)
    setError('')
  }

  const handleOptionChange = (idx, value) => {
    setEditingQuestion((prev) => {
      const newOptions = [...prev.options]
      newOptions[idx] = { ...newOptions[idx], text: value }
      return { ...prev, options: newOptions }
    })
  }

  return (
    <div className="quiz-bank">
      <div className="quiz-bank-header">
        <div className="quiz-bank-stats">
          <span>共 {questions.length} 道题</span>
          <span>当前筛选：{filteredQuestions.length} 道</span>
        </div>
        <div className="quiz-bank-actions">
          <select
            className="quiz-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">全部分类</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button className="quiz-btn quiz-btn-primary" onClick={handleAdd}>
            + 新增题目
          </button>
        </div>
      </div>

      <div className="quiz-bank-list">
        {filteredQuestions.length === 0 ? (
          <div className="quiz-empty">暂无题目</div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div key={q.id} className="quiz-bank-item">
              <div className="quiz-bank-item-index">{idx + 1}</div>
              <div className="quiz-bank-item-content">
                <div className="quiz-bank-item-stem">{q.stem}</div>
                <div className="quiz-bank-item-meta">
                  <span className="quiz-tag">{QUESTION_TYPE_LABEL}</span>
                  <span className="quiz-tag quiz-tag-category">{q.category || '未分类'}</span>
                  <span className="quiz-bank-answer">正确答案：{q.answer}</span>
                </div>
              </div>
              <div className="quiz-bank-item-actions">
                <button className="quiz-btn quiz-btn-sm" onClick={() => handleEdit(q)}>
                  编辑
                </button>
                <button
                  className="quiz-btn quiz-btn-sm quiz-btn-danger"
                  onClick={() => handleDelete(q)}
                >
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && editingQuestion && (
        <div className="quiz-modal-overlay" onClick={handleCancel}>
          <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quiz-modal-header">
              <h3>{questions.some((q) => q.id === editingQuestion.id) ? '编辑题目' : '新增题目'}</h3>
            </div>
            <div className="quiz-modal-body">
              {error && <div className="quiz-error">{error}</div>}

              <div className="quiz-form-group">
                <label className="quiz-form-label">题目内容</label>
                <textarea
                  className="quiz-form-textarea"
                  value={editingQuestion.stem}
                  onChange={(e) =>
                    setEditingQuestion((prev) => ({ ...prev, stem: e.target.value }))
                  }
                  placeholder="请输入题目内容"
                  rows={3}
                />
              </div>

              <div className="quiz-form-group">
                <label className="quiz-form-label">选项</label>
                {editingQuestion.options.map((opt, idx) => (
                  <div key={opt.value} className="quiz-option-input">
                    <span className="quiz-option-label">{opt.label}.</span>
                    <input
                      type="text"
                      className="quiz-form-input"
                      value={opt.text}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`请输入选项 ${opt.label} 的内容`}
                    />
                  </div>
                ))}
              </div>

              <div className="quiz-form-row">
                <div className="quiz-form-group">
                  <label className="quiz-form-label">正确答案</label>
                  <select
                    className="quiz-select"
                    value={editingQuestion.answer}
                    onChange={(e) =>
                      setEditingQuestion((prev) => ({ ...prev, answer: e.target.value }))
                    }
                  >
                    <option value="">请选择</option>
                    {editingQuestion.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="quiz-form-group">
                  <label className="quiz-form-label">分类标签</label>
                  <input
                    type="text"
                    className="quiz-form-input"
                    value={editingQuestion.category}
                    onChange={(e) =>
                      setEditingQuestion((prev) => ({ ...prev, category: e.target.value }))
                    }
                    placeholder="如：React、JavaScript"
                    list="category-list"
                  />
                  <datalist id="category-list">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
            <div className="quiz-modal-footer">
              <button className="quiz-btn" onClick={handleCancel}>
                取消
              </button>
              <button className="quiz-btn quiz-btn-primary" onClick={handleSave}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
