import { useState } from 'react'
import { TAG_COLORS } from './constants'
import { validateCardContent } from './flashcardUtils'

export default function CardEditModal({ card, onClose, onSave }) {
  const [front, setFront] = useState(card ? card.front || '' : '')
  const [back, setBack] = useState(card ? card.back || '' : '')
  const [tags, setTags] = useState(card ? card.tags || [] : [])
  const [newTagText, setNewTagText] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value)
  const [error, setError] = useState('')

  const handleAddTag = () => {
    const text = newTagText.trim()
    if (!text) return
    if (tags.some(t => t.text === text)) return
    setTags([...tags, { text, color: newTagColor }])
    setNewTagText('')
  }

  const handleRemoveTag = (textToRemove) => {
    setTags(tags.filter(t => t.text !== textToRemove))
  }

  const handleSubmit = () => {
    const validation = validateCardContent(front, back)
    if (!validation.valid) {
      setError(validation.error)
      return
    }
    onSave({
      front: front.trim(),
      back: back.trim(),
      tags,
    })
  }

  return (
    <div className="fc-modal-overlay" onClick={onClose}>
      <div className="fc-modal fc-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="fc-modal-header">
          <h3 className="fc-modal-title">{card ? '编辑卡片' : '添加卡片'}</h3>
          <button className="fc-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="fc-form-group">
          <label className="fc-form-label">正面</label>
          <textarea
            className="fc-form-input fc-form-textarea"
            value={front}
            onChange={e => setFront(e.target.value)}
            placeholder="输入卡片正面内容（如：单词 Apple）"
          />
        </div>

        <div className="fc-form-group">
          <label className="fc-form-label">反面</label>
          <textarea
            className="fc-form-input fc-form-textarea"
            value={back}
            onChange={e => setBack(e.target.value)}
            placeholder="输入卡片反面内容（如：苹果 / 一种水果）"
          />
        </div>

        <div className="fc-form-group">
          <label className="fc-form-label">标签</label>
          <div className="fc-tag-input-wrap">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="fc-tag-chip"
                style={{ background: tag.color }}
              >
                {tag.text}
                <button
                  className="fc-tag-chip-remove"
                  onClick={() => handleRemoveTag(tag.text)}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              className="fc-form-input"
              style={{
                flex: 1,
                minWidth: 100,
                border: 'none',
                background: 'transparent',
                padding: '4px 8px',
              }}
              placeholder="添加标签..."
              value={newTagText}
              onChange={e => setNewTagText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
            />
          </div>
          <div className="fc-tag-color-picker">
            {TAG_COLORS.map((c, idx) => (
              <div
                key={idx}
                className={`fc-tag-color-option ${newTagColor === c.value ? 'selected' : ''}`}
                style={{ background: c.value }}
                title={c.name}
                onClick={() => setNewTagColor(c.value)}
              />
            ))}
          </div>
        </div>

        {error && <div className="fc-form-error">{error}</div>}

        <div className="fc-form-actions">
          <button className="fc-btn" onClick={onClose}>取消</button>
          <button className="fc-btn fc-btn-primary" onClick={handleSubmit}>
            {card ? '保存' : '添加'}
          </button>
        </div>
      </div>
    </div>
  )
}
