import { useEffect, useRef, useState } from 'react'

export function InputDialog({ visible, title, initialValue, placeholder, confirmText, onCancel, onConfirm }) {
  const inputRef = useRef(null)
  const [value, setValue] = useState(initialValue || '')

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, 0)
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [visible, onCancel])

  if (!visible) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(value.trim())
  }

  return (
    <div className="fm-modal-overlay" onClick={onCancel}>
      <div className="fm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="fm-input-title">
        <h3 id="fm-input-title" className="fm-modal-title">{title}</h3>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="fm-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
          />
          <div className="fm-modal-actions">
            <button type="button" className="fm-btn fm-btn-secondary" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="fm-btn fm-btn-primary">
              {confirmText || '确定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ConfirmDialog({ visible, title, message, confirmText, onCancel, onConfirm }) {
  useEffect(() => {
    if (!visible) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [visible, onCancel])

  if (!visible) return null

  return (
    <div className="fm-modal-overlay" onClick={onCancel}>
      <div className="fm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="fm-confirm-title">
        <h3 id="fm-confirm-title" className="fm-modal-title">{title}</h3>
        {message && <p className="fm-modal-message">{message}</p>}
        <div className="fm-modal-actions">
          <button type="button" className="fm-btn fm-btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="fm-btn fm-btn-danger" onClick={onConfirm} autoFocus>
            {confirmText || '删除'}
          </button>
        </div>
      </div>
    </div>
  )
}
