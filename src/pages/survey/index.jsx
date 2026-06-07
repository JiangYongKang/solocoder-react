import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  createSurvey,
  addQuestion,
  deleteQuestion,
  updateQuestion,
  addOption,
  updateOption,
  deleteOption,
  addMatrixRow,
  updateMatrixRow,
  deleteMatrixRow,
  addMatrixColumn,
  updateMatrixColumn,
  deleteMatrixColumn,
  publishSurvey,
  loadSurveys,
  saveSurveys,
  upsertSurvey,
  removeSurvey,
  loadDraft,
  saveDraft,
  clearDraft,
  loadResponses,
  saveResponse,
  validateAllAnswers,
  calculateStatistics,
  exportStatisticsToCSV,
  downloadCSV,
} from './surveyCore'

import './survey.css'

const COLORS = ['#aa3bff', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

function SortableQuestionCard({ question, index, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="sv-question-card">
      <div className="sv-question-card-header">
        <span className="sv-question-drag-handle" {...attributes} {...listeners}>⋮⋮</span>
        <span className="sv-question-index">Q{index + 1}</span>
        <span className="sv-question-type">{QUESTION_TYPE_LABELS[question.type]}</span>
        {question.required && <span className="sv-question-required">必填</span>}
        <div className="sv-question-actions">
          <button className="sv-btn-icon" onClick={() => onEdit(question.id)}>编辑</button>
          <button className="sv-btn-icon sv-btn-danger" onClick={() => onDelete(question.id)}>删除</button>
        </div>
      </div>
      <div className="sv-question-title">{question.title}</div>
    </div>
  )
}

function QuestionEditor({ question, onUpdate, onClose }) {
  if (!question) return null

  const handleTitleChange = (e) => {
    onUpdate(question.id, { title: e.target.value })
  }

  const handleRequiredChange = (e) => {
    onUpdate(question.id, { required: e.target.checked })
  }

  return (
    <div className="sv-editor-overlay" onClick={onClose}>
      <div className="sv-editor-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sv-editor-header">
          <h3>编辑题目</h3>
          <button className="sv-btn-icon" onClick={onClose}>×</button>
        </div>
        <div className="sv-editor-body">
          <div className="sv-form-group">
            <label>题目标题</label>
            <input
              type="text"
              className="sv-input"
              value={question.title}
              onChange={handleTitleChange}
            />
          </div>
          <div className="sv-form-group">
            <label className="sv-checkbox-label">
              <input
                type="checkbox"
                checked={question.required}
                onChange={handleRequiredChange}
              />
              <span>设为必填</span>
            </label>
          </div>

          {question.type === QUESTION_TYPES.SINGLE || question.type === QUESTION_TYPES.MULTIPLE ? (
            <div className="sv-form-group">
              <label>选项列表</label>
              {question.options.map((opt, idx) => (
                <div key={idx} className="sv-option-row">
                  <input
                    type="text"
                    className="sv-input"
                    value={opt.label}
                    onChange={(e) => onUpdate(question.id, null, { type: 'option', index: idx, updates: { label: e.target.value, value: e.target.value } })}
                    placeholder={`选项${idx + 1}`}
                  />
                  <button
                    className="sv-btn-icon sv-btn-danger"
                    onClick={() => onUpdate(question.id, null, { type: 'deleteOption', index: idx })}
                  >
                    删除
                  </button>
                </div>
              ))}
              <button
                className="sv-btn sv-btn-secondary"
                onClick={() => onUpdate(question.id, null, { type: 'addOption' })}
              >
                + 添加选项
              </button>
            </div>
          ) : null}

          {question.type === QUESTION_TYPES.RATING ? (
            <div className="sv-form-group">
              <label>最高星级：{question.maxRating || 5}</label>
              <input
                type="range"
                min="3"
                max="10"
                value={question.maxRating || 5}
                onChange={(e) => onUpdate(question.id, { maxRating: Number(e.target.value) })}
              />
            </div>
          ) : null}

          {question.type === QUESTION_TYPES.TEXT ? (
            <div className="sv-form-group">
              <label>占位提示</label>
              <input
                type="text"
                className="sv-input"
                value={question.placeholder || ''}
                onChange={(e) => onUpdate(question.id, { placeholder: e.target.value })}
                placeholder="请输入您的回答"
              />
            </div>
          ) : null}

          {question.type === QUESTION_TYPES.MATRIX ? (
            <>
              <div className="sv-form-group">
                <label>维度（行）</label>
                {question.rows.map((row, idx) => (
                  <div key={idx} className="sv-option-row">
                    <input
                      type="text"
                      className="sv-input"
                      value={row.label}
                      onChange={(e) => onUpdate(question.id, null, { type: 'updateRow', index: idx, updates: { label: e.target.value, value: e.target.value } })}
                    />
                    <button
                      className="sv-btn-icon sv-btn-danger"
                      onClick={() => onUpdate(question.id, null, { type: 'deleteRow', index: idx })}
                    >
                      删除
                    </button>
                  </div>
                ))}
                <button
                  className="sv-btn sv-btn-secondary"
                  onClick={() => onUpdate(question.id, null, { type: 'addRow' })}
                >
                  + 添加维度
                </button>
              </div>
              <div className="sv-form-group">
                <label>评分项（列）</label>
                {question.columns.map((col, idx) => (
                  <div key={idx} className="sv-option-row">
                    <input
                      type="text"
                      className="sv-input"
                      value={col.label}
                      onChange={(e) => onUpdate(question.id, null, { type: 'updateColumn', index: idx, updates: { label: e.target.value, value: e.target.value } })}
                    />
                    <button
                      className="sv-btn-icon sv-btn-danger"
                      onClick={() => onUpdate(question.id, null, { type: 'deleteColumn', index: idx })}
                    >
                      删除
                    </button>
                  </div>
                ))}
                <button
                  className="sv-btn sv-btn-secondary"
                  onClick={() => onUpdate(question.id, null, { type: 'addColumn' })}
                >
                  + 添加评分项
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function StarRating({ value, max, onChange, readonly }) {
  return (
    <div className="sv-star-rating">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={`sv-star ${n <= value ? 'sv-star-active' : ''}`}
          onClick={() => !readonly && onChange?.(n)}
          disabled={readonly}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function SurveyListPage({ surveys, onSelectSurvey, onEditSurvey, onViewStats, onNewSurvey, onDeleteSurvey, responsesMap }) {
  return (
    <div className="sv-content">
      <div className="sv-toolbar">
        <button className="sv-btn sv-btn-primary" onClick={onNewSurvey}>
          + 创建新问卷
        </button>
      </div>
      {surveys.length === 0 ? (
        <div className="sv-empty-state">
          <p>暂无问卷，点击上方按钮创建第一份问卷</p>
        </div>
      ) : (
        <div className="sv-survey-list">
          {surveys.map((s) => (
            <div key={s.id} className="sv-survey-card">
              <div className="sv-survey-card-header">
                <h3 className="sv-survey-title">{s.title}</h3>
                <span className={`sv-badge ${s.status === 'published' ? 'sv-badge-published' : 'sv-badge-draft'}`}>
                  {s.status === 'published' ? '已发布' : '草稿'}
                </span>
              </div>
              {s.description && <p className="sv-survey-desc">{s.description}</p>}
              <div className="sv-survey-meta">
                <span>题目数：{s.questions.length}</span>
                <span>作答数：{responsesMap[s.id] || 0}</span>
              </div>
              <div className="sv-survey-actions">
                {s.status === 'draft' ? (
                  <button className="sv-btn sv-btn-secondary" onClick={() => onEditSurvey(s.id)}>
                    编辑
                  </button>
                ) : (
                  <button className="sv-btn sv-btn-primary" onClick={() => onSelectSurvey(s.id)}>
                    开始作答
                  </button>
                )}
                <button className="sv-btn sv-btn-secondary" onClick={() => onViewStats(s.id)}>
                  查看统计
                </button>
                <button className="sv-btn sv-btn-danger" onClick={() => onDeleteSurvey(s.id)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SurveyEditorPage({ survey, setSurvey, onBack, onSaveAndPublish }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const [editingQuestionId, setEditingQuestionId] = useState(null)

  const editingQuestion = useMemo(
    () => survey.questions.find((q) => q.id === editingQuestionId) || null,
    [survey.questions, editingQuestionId]
  )

  const handleAddQuestion = (type) => {
    setSurvey((prev) => addQuestion(prev, type))
  }

  const handleDeleteQuestion = (questionId) => {
    setSurvey((prev) => deleteQuestion(prev, questionId))
  }

  const handleEditQuestion = (questionId) => {
    setEditingQuestionId(questionId)
  }

  const handleUpdateQuestion = (questionId, updates, optionAction) => {
    if (optionAction) {
      setSurvey((prev) => {
        let result = prev
        switch (optionAction.type) {
          case 'addOption':
            result = addOption(prev, questionId)
            break
          case 'deleteOption':
            result = deleteOption(prev, questionId, optionAction.index)
            break
          case 'option':
            result = updateOption(prev, questionId, optionAction.index, optionAction.updates)
            break
          case 'addRow':
            result = addMatrixRow(prev, questionId)
            break
          case 'deleteRow':
            result = deleteMatrixRow(prev, questionId, optionAction.index)
            break
          case 'updateRow':
            result = updateMatrixRow(prev, questionId, optionAction.index, optionAction.updates)
            break
          case 'addColumn':
            result = addMatrixColumn(prev, questionId)
            break
          case 'deleteColumn':
            result = deleteMatrixColumn(prev, questionId, optionAction.index)
            break
          case 'updateColumn':
            result = updateMatrixColumn(prev, questionId, optionAction.index, optionAction.updates)
            break
          default:
            break
        }
        return result
      })
      return
    }
    setSurvey((prev) => updateQuestion(prev, questionId, updates))
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSurvey((prev) => {
        const oldIndex = prev.questions.findIndex((q) => q.id === active.id)
        const newIndex = prev.questions.findIndex((q) => q.id === over.id)
        const newQuestions = arrayMove(prev.questions, oldIndex, newIndex)
        return { ...prev, questions: newQuestions, updatedAt: Date.now() }
      })
    }
  }

  return (
    <div className="sv-content">
      <div className="sv-toolbar">
        <button className="sv-btn sv-btn-secondary" onClick={onBack}>← 返回列表</button>
        <button className="sv-btn sv-btn-primary" onClick={onSaveAndPublish} disabled={survey.questions.length === 0}>
          保存并发布
        </button>
      </div>

      <div className="sv-survey-meta-edit">
        <input
          type="text"
          className="sv-input sv-title-input"
          value={survey.title}
          onChange={(e) => setSurvey((prev) => ({ ...prev, title: e.target.value, updatedAt: Date.now() }))}
          placeholder="请输入问卷标题"
        />
        <textarea
          className="sv-input sv-textarea"
          value={survey.description}
          onChange={(e) => setSurvey((prev) => ({ ...prev, description: e.target.value, updatedAt: Date.now() }))}
          placeholder="请输入问卷描述（可选）"
          rows={2}
        />
      </div>

      <div className="sv-section">
        <h3 className="sv-section-title">添加题目</h3>
        <div className="sv-add-question-buttons">
          {Object.entries(QUESTION_TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              className="sv-btn sv-btn-secondary"
              onClick={() => handleAddQuestion(type)}
            >
              + {label}
            </button>
          ))}
        </div>
      </div>

      <div className="sv-section">
        <h3 className="sv-section-title">题目列表（拖拽排序）</h3>
        {survey.questions.length === 0 ? (
          <div className="sv-empty-state"><p>还没有题目，点击上方按钮添加</p></div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={survey.questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="sv-question-list">
                {survey.questions.map((q, idx) => (
                  <SortableQuestionCard
                    key={q.id}
                    question={q}
                    index={idx}
                    onEdit={handleEditQuestion}
                    onDelete={handleDeleteQuestion}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {editingQuestion && (
        <QuestionEditor
          question={editingQuestion}
          onUpdate={handleUpdateQuestion}
          onClose={() => setEditingQuestionId(null)}
        />
      )}
    </div>
  )
}

function SurveyAnswerPage({ survey, onBack, onSubmit }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState(() => {
    const draft = loadDraft(survey.id)
    return draft?.answers || {}
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    saveDraft(survey.id, answers)
  }, [survey.id, answers])

  const currentQuestion = survey.questions[currentIndex]
  const totalQuestions = survey.questions.length

  const handleSingleChange = (value) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
    if (errors[currentQuestion.id]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[currentQuestion.id]
        return next
      })
    }
  }

  const handleMultipleChange = (value, checked) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[currentQuestion.id]) ? [...prev[currentQuestion.id]] : []
      if (checked) {
        if (!current.includes(value)) current.push(value)
      } else {
        const idx = current.indexOf(value)
        if (idx !== -1) current.splice(idx, 1)
      }
      return { ...prev, [currentQuestion.id]: current }
    })
    if (errors[currentQuestion.id]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[currentQuestion.id]
        return next
      })
    }
  }

  const handleTextChange = (e) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))
    if (errors[currentQuestion.id]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[currentQuestion.id]
        return next
      })
    }
  }

  const handleRatingChange = (rating) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: rating }))
    if (errors[currentQuestion.id]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[currentQuestion.id]
        return next
      })
    }
  }

  const handleMatrixChange = (rowValue, colValue) => {
    setAnswers((prev) => {
      const current = prev[currentQuestion.id] || {}
      return {
        ...prev,
        [currentQuestion.id]: { ...current, [rowValue]: colValue },
      }
    })
    if (errors[currentQuestion.id]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[currentQuestion.id]
        return next
      })
    }
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    }
  }

  const handleSubmitAll = () => {
    const validation = validateAllAnswers(survey.questions, answers)
    if (!validation.valid) {
      setErrors(validation.errors)
      const firstErrorKey = Object.keys(validation.errors)[0]
      const firstErrorIdx = survey.questions.findIndex((q) => q.id === firstErrorKey)
      if (firstErrorIdx !== -1) setCurrentIndex(firstErrorIdx)
      return
    }
    saveResponse(survey.id, answers)
    clearDraft(survey.id)
    onSubmit()
  }

  const renderQuestionInput = () => {
    if (!currentQuestion) return null
    switch (currentQuestion.type) {
      case QUESTION_TYPES.SINGLE:
        return (
          <div className="sv-options-group">
            {currentQuestion.options.map((opt) => (
              <label key={opt.value} className="sv-option-item">
                <input
                  type="radio"
                  name={currentQuestion.id}
                  checked={answers[currentQuestion.id] === opt.value}
                  onChange={() => handleSingleChange(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )
      case QUESTION_TYPES.MULTIPLE: {
        const selected = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] : []
        return (
          <div className="sv-options-group">
            {currentQuestion.options.map((opt) => (
              <label key={opt.value} className="sv-option-item">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={(e) => handleMultipleChange(opt.value, e.target.checked)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )
      }
      case QUESTION_TYPES.RATING:
        return (
          <StarRating
            value={answers[currentQuestion.id] || 0}
            max={currentQuestion.maxRating || 5}
            onChange={handleRatingChange}
          />
        )
      case QUESTION_TYPES.TEXT:
        return (
          <textarea
            className="sv-input sv-textarea"
            value={answers[currentQuestion.id] || ''}
            onChange={handleTextChange}
            placeholder={currentQuestion.placeholder || '请输入您的回答'}
            rows={4}
          />
        )
      case QUESTION_TYPES.MATRIX: {
        const matrixAnswer = answers[currentQuestion.id] || {}
        return (
          <div className="sv-matrix-table-wrapper">
            <table className="sv-matrix-table">
              <thead>
                <tr>
                  <th></th>
                  {currentQuestion.columns.map((col) => (
                    <th key={col.value}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentQuestion.rows.map((row) => (
                  <tr key={row.value}>
                    <td className="sv-matrix-row-label">{row.label}</td>
                    {currentQuestion.columns.map((col) => (
                      <td key={col.value} className="sv-matrix-cell">
                        <input
                          type="radio"
                          name={`${currentQuestion.id}_${row.value}`}
                          checked={matrixAnswer[row.value] === col.value}
                          onChange={() => handleMatrixChange(row.value, col.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <div className="sv-content">
      <div className="sv-toolbar">
        <button className="sv-btn sv-btn-secondary" onClick={onBack}>← 返回列表</button>
        <div className="sv-progress">
          {currentIndex + 1} / {totalQuestions}
        </div>
      </div>

      <div className="sv-progress-bar">
        <div
          className="sv-progress-bar-fill"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      <div className="sv-answer-card">
        <div className="sv-answer-question-header">
          <span className="sv-question-index">Q{currentIndex + 1}</span>
          {currentQuestion?.required && <span className="sv-question-required">必填</span>}
        </div>
        <h2 className="sv-answer-question-title">{currentQuestion?.title}</h2>
        {errors[currentQuestion?.id] && (
          <div className="sv-error-text">{errors[currentQuestion.id]}</div>
        )}
        <div className="sv-answer-input-area">
          {renderQuestionInput()}
        </div>
      </div>

      <div className="sv-answer-nav">
        <button
          className="sv-btn sv-btn-secondary"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          上一题
        </button>
        {currentIndex === totalQuestions - 1 ? (
          <button className="sv-btn sv-btn-primary" onClick={handleSubmitAll}>
            提交问卷
          </button>
        ) : (
          <button className="sv-btn sv-btn-primary" onClick={handleNext}>
            下一题
          </button>
        )}
      </div>
    </div>
  )
}

function SurveyStatsPage({ survey, responses, onBack }) {
  const statistics = useMemo(
    () => calculateStatistics(survey.questions, responses),
    [survey.questions, responses]
  )

  const handleExportCSV = () => {
    const csv = exportStatisticsToCSV(survey.questions, statistics)
    downloadCSV(csv, `${survey.title}-统计结果.csv`)
  }

  const renderStat = (question) => {
    const stat = statistics[question.id]
    if (!stat) return null

    switch (question.type) {
      case QUESTION_TYPES.SINGLE: {
        const pieData = stat.optionCounts.map((oc) => ({
          name: oc.label,
          value: oc.count,
        }))
        return (
          <div className="sv-stat-chart">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )
      }
      case QUESTION_TYPES.MULTIPLE: {
        const barData = stat.optionCounts.map((oc) => ({
          name: oc.label,
          count: oc.count,
        }))
        return (
          <div className="sv-stat-chart">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#aa3bff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      }
      case QUESTION_TYPES.RATING: {
        const barData = stat.ratingCounts.map((rc) => ({
          name: `${rc.rating}星`,
          count: rc.count,
        }))
        return (
          <div>
            <div className="sv-rating-avg">平均分：{stat.average}</div>
            <div className="sv-stat-chart">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      }
      case QUESTION_TYPES.TEXT:
        return (
          <div className="sv-text-answers">
            {stat.textAnswers.length === 0 ? (
              <p className="sv-muted">暂无回答</p>
            ) : (
              <ul>
                {stat.textAnswers.map((ta, idx) => (
                  <li key={idx} className="sv-text-answer-item">{idx + 1}. {ta}</li>
                ))}
              </ul>
            )}
          </div>
        )
      case QUESTION_TYPES.MATRIX: {
        const dataKeys = stat.columnLabels
        const chartData = stat.matrixStats.map((row) => {
          const obj = { name: row.rowLabel }
          row.colCounts.forEach((cc, i) => {
            obj[dataKeys[i]] = cc.count
          })
          return obj
        })
        return (
          <div className="sv-stat-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {dataKeys.map((key, idx) => (
                  <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <div className="sv-content">
      <div className="sv-toolbar">
        <button className="sv-btn sv-btn-secondary" onClick={onBack}>← 返回列表</button>
        <button className="sv-btn sv-btn-primary" onClick={handleExportCSV}>
          导出 CSV
        </button>
      </div>

      <div className="sv-stats-header">
        <h2 className="sv-stats-title">{survey.title}</h2>
        <div className="sv-stats-count">总作答数：{responses.length}</div>
      </div>

      {survey.questions.length === 0 ? (
        <div className="sv-empty-state"><p>此问卷暂无题目</p></div>
      ) : (
        <div className="sv-stats-list">
          {survey.questions.map((q, idx) => (
            <div key={q.id} className="sv-stat-card">
              <div className="sv-stat-header">
                <span className="sv-question-index">Q{idx + 1}</span>
                <span className="sv-question-type">{QUESTION_TYPE_LABELS[q.type]}</span>
              </div>
              <h3 className="sv-stat-title">{q.title}</h3>
              {renderStat(q)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const VIEWS = {
  LIST: 'list',
  EDITOR: 'editor',
  ANSWER: 'answer',
  STATS: 'stats',
}

export default function SurveyPage() {
  const navigate = useNavigate()
  const [view, setView] = useState(VIEWS.LIST)
  const [surveys, setSurveys] = useState(() => loadSurveys())
  const [currentSurveyId, setCurrentSurveyId] = useState(null)
  const [editingSurvey, setEditingSurvey] = useState(null)

  useEffect(() => {
    saveSurveys(surveys)
  }, [surveys])

  const responsesMap = useMemo(() => {
    const map = {}
    surveys.forEach((s) => {
      map[s.id] = loadResponses(s.id).length
    })
    return map
  }, [surveys])

  const currentSurvey = useMemo(
    () => surveys.find((s) => s.id === currentSurveyId) || null,
    [surveys, currentSurveyId]
  )

  const handleNewSurvey = useCallback(() => {
    const newS = createSurvey()
    setEditingSurvey(newS)
    setView(VIEWS.EDITOR)
  }, [])

  const handleEditSurvey = useCallback((id) => {
    const s = surveys.find((x) => x.id === id)
    if (s) {
      setEditingSurvey({ ...s })
      setView(VIEWS.EDITOR)
    }
  }, [surveys])

  const handleBackToList = useCallback(() => {
    setView(VIEWS.LIST)
    setCurrentSurveyId(null)
    setEditingSurvey(null)
  }, [])

  const handleSaveAndPublish = useCallback(() => {
    if (!editingSurvey) return
    const published = publishSurvey(editingSurvey)
    setSurveys((prev) => upsertSurvey(prev, published))
    setEditingSurvey(null)
    setView(VIEWS.LIST)
  }, [editingSurvey])

  const handleSelectSurvey = useCallback((id) => {
    setCurrentSurveyId(id)
    setView(VIEWS.ANSWER)
  }, [])

  const handleViewStats = useCallback((id) => {
    setCurrentSurveyId(id)
    setView(VIEWS.STATS)
  }, [])

  const handleDeleteSurvey = useCallback((id) => {
    if (window.confirm('确定要删除这份问卷吗？相关的作答数据也会被删除。')) {
      setSurveys((prev) => removeSurvey(prev, id))
    }
  }, [])

  const handleSubmitComplete = useCallback(() => {
    alert('问卷提交成功！感谢您的参与。')
    setView(VIEWS.LIST)
    setCurrentSurveyId(null)
  }, [])

  return (
    <div className="sv-page">
      <div className="sv-header">
        <button className="sv-back-btn" onClick={() => navigate('/')} aria-label="返回首页">
          ← 返回首页
        </button>
        <h1 className="sv-title">问卷调查系统</h1>
      </div>

      {view === VIEWS.LIST && (
        <SurveyListPage
          surveys={surveys}
          responsesMap={responsesMap}
          onNewSurvey={handleNewSurvey}
          onEditSurvey={handleEditSurvey}
          onSelectSurvey={handleSelectSurvey}
          onViewStats={handleViewStats}
          onDeleteSurvey={handleDeleteSurvey}
        />
      )}

      {view === VIEWS.EDITOR && editingSurvey && (
        <SurveyEditorPage
          survey={editingSurvey}
          setSurvey={setEditingSurvey}
          onBack={handleBackToList}
          onSaveAndPublish={handleSaveAndPublish}
        />
      )}

      {view === VIEWS.ANSWER && currentSurvey && (
        <SurveyAnswerPage
          survey={currentSurvey}
          onBack={handleBackToList}
          onSubmit={handleSubmitComplete}
        />
      )}

      {view === VIEWS.STATS && currentSurvey && (
        <SurveyStatsPage
          survey={currentSurvey}
          responses={loadResponses(currentSurvey.id)}
          onBack={handleBackToList}
        />
      )}
    </div>
  )
}
