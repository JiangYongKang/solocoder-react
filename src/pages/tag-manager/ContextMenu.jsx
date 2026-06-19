import { useEffect } from 'react'

export default function ContextMenu({ x, y, items, onClose }) {
  useEffect(() => {
    const handleClick = () => onClose()
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  const handleItemClick = (item, e) => {
    e.stopPropagation()
    if (!item.disabled) {
      item.onClick()
    }
    onClose()
  }

  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.divider ? (
            <div className="context-menu-divider" />
          ) : (
            <button
              className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
              onClick={(e) => handleItemClick(item, e)}
              disabled={item.disabled}
            >
              <span className="context-menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
