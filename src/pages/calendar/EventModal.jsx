import { useState, useEffect } from 'react'
import { CATEGORIES } from './constants.js'
import { validateEvent, formatDate, formatTime } from './calendarUtils.js'

export default function EventModal({
  isOpen,
  event,
  defaultStartTime,
  defaultEndTime,
  allEvents,
  onClose,
  onSave,
  onDelete,
}) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0].id)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isOpen) return
    if (event) {
      const s = new Date(event.startTime)
      const e = new Date(event.endTime)
      setTitle(event.title || '')
      setStartDate(formatDate(s))
      setStartTime(formatTime(s))
      setEndDate(formatDate(e))
      setEndTime(formatTime(e))
      setCategory(event.category || CATEGORIES[0].id)
    } else {
      const s = defaultStartTime ? new Date(defaultStartTime) : new Date()
      const e = defaultEndTime
        ? new Date(defaultEndTime)
        : new Date(s.getTime() + 60 * 60 * 1000)
      setTitle('')
      setStartDate(formatDate(s))
      setStartTime(formatTime(s))
      setEndDate(formatDate(e))
      setEndTime(formatTime(e))
      setCategory(CATEGORIES[0].id)
    }
    setErrors({})
  }, [isOpen, event, defaultStartTime, defaultEndTime])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      title,
      startTime: `${startDate}T${startTime}:00`,
      endTime: `${endDate}T${endTime}:00`,
      category,
    }
    const { valid, errors: validationErrors } = validateEvent(
      payload,
      allEvents || [],
      event ? event.id : null
    )
    if (!valid) {
      setErrors(validationErrors)
      return
    }
    onSave && onSave(payload)
  }

  const handleDelete = () => {
    if (onDelete && window.confirm('确定要删除这个事件吗？')) {
      onDelete()
    }
  }

  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cal-modal-header">
          <h2>{event ? '编辑事件' : '新建事件'}</h2>
          <button type="button" className="cal-modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <form className="cal-modal-body" onSubmit={handleSubmit}>
          <div className="cal-form-field">
            <label>标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入事件标题"
              className={errors.title ? 'cal-input-error' : ''}
            />
            {errors.title && <div className="cal-error">{errors.title}</div>}
          </div>

          <div className="cal-form-row">
            <div className="cal-form-field">
              <label>开始日期 *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={errors.startTime ? 'cal-input-error' : ''}
              />
            </div>
            <div className="cal-form-field">
              <label>开始时间 *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={errors.startTime ? 'cal-input-error' : ''}
              />
            </div>
          </div>
          {errors.startTime && <div className="cal-error">{errors.startTime}</div>}

          <div className="cal-form-row">
            <div className="cal-form-field">
              <label>结束日期 *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={errors.endTime ? 'cal-input-error' : ''}
              />
            </div>
            <div className="cal-form-field">
              <label>结束时间 *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={errors.endTime ? 'cal-input-error' : ''}
              />
            </div>
          </div>
          {errors.endTime && <div className="cal-error">{errors.endTime}</div>}

          <div className="cal-form-field">
            <label>分类 *</label>
            <div className="cal-category-options">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  className={`cal-category-option ${category === cat.id ? 'cal-category-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.id}
                    checked={category === cat.id}
                    onChange={() => setCategory(cat.id)}
                  />
                  <span
                    className="cal-category-dot"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.label}
                </label>
              ))}
            </div>
            {errors.category && <div className="cal-error">{errors.category}</div>}
          </div>

          {errors.conflict && (
            <div className="cal-conflict-warning">{errors.conflict}</div>
          )}

          <div className="cal-modal-actions">
            {event && (
              <button type="button" className="cal-btn cal-btn-danger" onClick={handleDelete}>
                删除
              </button>
            )}
            <div className="cal-modal-actions-right">
              <button type="button" className="cal-btn cal-btn-ghost" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="cal-btn cal-btn-primary">
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
