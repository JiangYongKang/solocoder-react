import { useState } from 'react'
import { filterSpaces, getPageCountInSpace } from './wikiUtils.js'

export default function SpaceSidebar({
  data,
  selectedSpaceId,
  onSelectSpace,
  onCreateSpace,
  onUpdateSpace,
  onDeleteSpace,
  globalSearchQuery,
  onGlobalSearch,
  onOpenSearch,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSpace, setEditingSpace] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState('')
  const [newSpaceDesc, setNewSpaceDesc] = useState('')

  const filteredSpaces = filterSpaces(data.spaces, searchQuery)

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleGlobalSearch = (e) => {
    const value = e.target.value
    onGlobalSearch?.(value)
    if (value.trim()) {
      onOpenSearch?.()
    }
  }

  const handleCreateSpace = () => {
    if (newSpaceName.trim()) {
      onCreateSpace?.(newSpaceName.trim(), newSpaceDesc.trim())
      setNewSpaceName('')
      setNewSpaceDesc('')
      setShowCreateModal(false)
    }
  }

  const handleDeleteSpace = (space) => {
    if (confirm(
      `确定要删除空间「${space.name}」吗？\n该空间下的所有页面将被一并删除，此操作不可恢复。`
    )) {
      onDeleteSpace?.(space.id)
    }
  }

  const handleUpdateSpace = () => {
    if (editingSpace && editingSpace.name.trim()) {
      onUpdateSpace?.(editingSpace.id, {
        name: editingSpace.name.trim(),
        description: editingSpace.description.trim(),
      })
      setEditingSpace(null)
    }
  }

  return (
    <>
      <aside className="wiki-sidebar">
        <div className="wiki-sidebar-header">
          <h2 className="wiki-sidebar-title">团队 Wiki</h2>
          <input
            type="text"
            className="wiki-search-input"
            placeholder="搜索空间..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        <div className="wiki-global-search">
          <label className="wiki-global-search-label">全文搜索</label>
          <input
            type="text"
            className="wiki-search-input"
            placeholder="搜索所有页面..."
            value={globalSearchQuery || ''}
            onChange={handleGlobalSearch}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                onOpenSearch?.()
              }
            }}
          />
        </div>

        <div className="wiki-space-list">
          {filteredSpaces.map((space) => (
            <div
              key={space.id}
              className={`wiki-space-item ${selectedSpaceId === space.id ? 'active' : ''}`}
              onClick={() => onSelectSpace?.(space.id)}
            >
              <span className="wiki-space-name">{space.name}</span>
              <div className="wiki-space-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="wiki-icon-btn"
                  title="编辑"
                  onClick={() => setEditingSpace({ ...space })}
                >
                  ✏️
                </button>
                <button
                  className="wiki-icon-btn"
                  title="删除"
                  onClick={() => handleDeleteSpace(space)}
                >
                  🗑️
                </button>
              </div>
              <span className="wiki-space-count">
                {getPageCountInSpace(data, space.id)} 页
              </span>
            </div>
          ))}
          {filteredSpaces.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
              暂无匹配的空间
            </div>
          )}
        </div>

        <div className="wiki-sidebar-footer">
          <button
            className="wiki-btn wiki-btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + 新建空间
          </button>
        </div>
      </aside>

      {showCreateModal && (
        <div className="wiki-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="wiki-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wiki-modal-header">创建新空间</div>
            <div className="wiki-modal-body">
              <div className="wiki-form-group">
                <label className="wiki-form-label">空间名称</label>
                <input
                  type="text"
                  className="wiki-form-input"
                  placeholder="请输入空间名称"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="wiki-form-group">
                <label className="wiki-form-label">空间描述</label>
                <textarea
                  className="wiki-form-textarea"
                  placeholder="请输入空间描述（可选）"
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="wiki-modal-footer">
              <button
                className="wiki-btn wiki-btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </button>
              <button
                className="wiki-btn wiki-btn-primary"
                onClick={handleCreateSpace}
                disabled={!newSpaceName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSpace && (
        <div className="wiki-modal-overlay" onClick={() => setEditingSpace(null)}>
          <div className="wiki-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wiki-modal-header">编辑空间</div>
            <div className="wiki-modal-body">
              <div className="wiki-form-group">
                <label className="wiki-form-label">空间名称</label>
                <input
                  type="text"
                  className="wiki-form-input"
                  value={editingSpace.name}
                  onChange={(e) => setEditingSpace({ ...editingSpace, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="wiki-form-group">
                <label className="wiki-form-label">空间描述</label>
                <textarea
                  className="wiki-form-textarea"
                  value={editingSpace.description}
                  onChange={(e) => setEditingSpace({ ...editingSpace, description: e.target.value })}
                />
              </div>
            </div>
            <div className="wiki-modal-footer">
              <button
                className="wiki-btn wiki-btn-secondary"
                onClick={() => setEditingSpace(null)}
              >
                取消
              </button>
              <button
                className="wiki-btn wiki-btn-primary"
                onClick={handleUpdateSpace}
                disabled={!editingSpace.name.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
