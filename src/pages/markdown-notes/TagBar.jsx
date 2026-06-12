import { useState } from 'react'

export default function TagBar({ tags, onAddTag, onRemoveTag }) {
  const [inputValue, setInputValue] = useState('')

  function handleInputKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = inputValue.trim()
      if (tag && !tags.includes(tag)) {
        onAddTag(tag)
      }
      setInputValue('')
    }
  }

  return (
    <div className="tag-bar">
      <span className="tag-bar-label">标签:</span>
      {tags.map((tag) => (
        <span key={tag} className="tag-chip">
          {tag}
          <button
            className="remove-btn"
            onClick={() => onRemoveTag(tag)}
            title="移除标签"
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="tag-input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="输入标签后回车"
      />
    </div>
  )
}
