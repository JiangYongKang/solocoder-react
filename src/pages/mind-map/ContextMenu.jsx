import { useState, useEffect, useRef } from 'react'
import { PRESET_COLORS, PRESET_ICONS } from './constants.js'
import { getIconEmoji } from './mindMapCore.js'

function ContextMenu({ x, y, node, onClose, onColorChange, onIconChange, onAddChild, onAddSibling, onEdit, onDelete }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const currentEmoji = node?.icon ? getIconEmoji(node.icon) : null

  return (
    <div
      ref={menuRef}
      className="mind-context-menu"
      style={{
        left: Math.min(x, window.innerWidth - 260),
        top: Math.min(y, window.innerHeight - 320),
      }}
    >
      <div className="mind-context-section">
        <div className="mind-context-label">颜色</div>
        <div className="mind-color-picker">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className={`mind-color-swatch ${node?.color === color ? 'selected' : ''}`}
              style={{ background: color }}
              onClick={() => onColorChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="mind-context-section">
        <div className="mind-context-label">图标</div>
        <div className="mind-icon-picker">
          <button
            className={`mind-icon-swatch clear ${!node?.icon ? 'selected' : ''}`}
            onClick={() => onIconChange(null)}
            title="清除图标"
          >
            ✕
          </button>
          {PRESET_ICONS.map((icon) => (
            <button
              key={icon.id}
              className={`mind-icon-swatch ${node?.icon === icon.id ? 'selected' : ''}`}
              onClick={() => onIconChange(icon.id)}
              title={icon.label}
            >
              {icon.emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="mind-context-section">
        <div className="mind-context-actions">
          <button className="mind-context-action" onClick={() => { onAddChild(); onClose() }}>
            ➕ 添加子节点 <kbd style={{ marginLeft: 'auto', background: 'var(--code-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: 'var(--text)' }}>Tab</kbd>
          </button>
          <button className="mind-context-action" onClick={() => { onAddSibling(); onClose() }}>
            ↔ 添加同级 <kbd style={{ marginLeft: 'auto', background: 'var(--code-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: 'var(--text)' }}>Enter</kbd>
          </button>
          <button className="mind-context-action" onClick={() => { onEdit(); onClose() }}>
            ✏️ 编辑文字 <kbd style={{ marginLeft: 'auto', background: 'var(--code-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: 'var(--text)' }}>F2</kbd>
          </button>
          <button className="mind-context-action danger" onClick={() => { onDelete(); onClose() }}>
            🗑️ 删除节点 <kbd style={{ marginLeft: 'auto', background: 'var(--code-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: 'var(--text)' }}>Del</kbd>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContextMenu
