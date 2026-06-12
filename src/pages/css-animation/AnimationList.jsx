import { useState } from 'react'
import { MAX_ANIMATIONS } from './constants.js'
import { formatDate } from './cssAnimationCore.js'

export default function AnimationList({
  animations,
  currentAnimationId,
  onSelectAnimation,
  onNewAnimation,
  onRenameAnimation,
  onDeleteAnimation,
}) {
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const handleRenameClick = (e, animation) => {
    e.stopPropagation()
    setEditingId(animation.id)
    setEditingName(animation.name)
  }

  const handleRenameSubmit = (e) => {
    e.preventDefault()
    if (editingId && editingName.trim()) {
      onRenameAnimation(editingId, editingName.trim())
    }
    setEditingId(null)
    setEditingName('')
  }

  const handleRenameBlur = () => {
    if (editingId && editingName.trim()) {
      onRenameAnimation(editingId, editingName.trim())
    }
    setEditingId(null)
    setEditingName('')
  }

  const handleDeleteClick = (e, animationId) => {
    e.stopPropagation()
    if (confirm('确定要删除这个动画吗？')) {
      onDeleteAnimation(animationId)
    }
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>🎬 我的动画</h2>
        <button className="new-animation-btn" onClick={onNewAnimation}>
          + 新建动画
        </button>
        <div style={{ fontSize: 11, color: '#8892b0', marginTop: 8, textAlign: 'center' }}>
          {animations.length} / {MAX_ANIMATIONS} 个动画
        </div>
      </div>

      <div className="animation-list">
        {animations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✨</div>
            <div className="empty-state-text">
              还没有保存的动画<br />点击上方按钮创建
            </div>
          </div>
        ) : (
          animations.map((animation) => (
            <div
              key={animation.id}
              className={`animation-item ${currentAnimationId === animation.id ? 'active' : ''}`}
              onClick={() => onSelectAnimation(animation)}
            >
              {editingId === animation.id ? (
                <form onSubmit={handleRenameSubmit}>
                  <input
                    className="rename-input"
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleRenameBlur}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </form>
              ) : (
                <>
                  <div className="animation-item-name">{animation.name}</div>
                  <div className="animation-item-meta">
                    <span>⏱ {animation.duration}s</span>
                    <span>📊 {animation.tracks.length} 属性</span>
                  </div>
                  <div className="animation-item-meta" style={{ marginTop: 4 }}>
                    <span>📅 {formatDate(animation.createdAt)}</span>
                  </div>
                  <div className="animation-item-actions">
                    <button
                      onClick={(e) => handleRenameClick(e, animation)}
                      title="重命名"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, animation.id)}
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
