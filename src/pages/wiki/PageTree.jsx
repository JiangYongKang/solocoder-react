import { useState } from 'react'
import { getChildPages, getRootPages, filterPagesByTag } from './wikiUtils.js'

function TreeNode({
  page,
  data,
  selectedPageId,
  expandedNodes,
  onSelectPage,
  onToggleExpand,
  onCreateChild,
  onDeletePage,
}) {
  const [showContextMenu, setShowContextMenu] = useState(null)
  const children = getChildPages(data, page.id)
  const hasChildren = children && children.length > 0
  const isExpanded = expandedNodes[page.id]

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowContextMenu({ x: e.clientX, y: e.clientY })
  }

  const handleCreateChild = () => {
    onCreateChild?.(page.id)
    setShowContextMenu(null)
  }

  const handleDelete = () => {
    if (confirm(
      `确定要删除页面「${page.title}」吗？\n其子页面将被一并删除。`
    )) {
      onDeletePage?.(page.id)
    }
    setShowContextMenu(null)
  }

  return (
    <div className="wiki-tree-node">
      <div
        className={`wiki-tree-node-header ${selectedPageId === page.id ? 'active' : ''}`}
        onClick={() => onSelectPage?.(page.id)}
        onContextMenu={handleContextMenu}
      >
        <span
          className="wiki-tree-toggle"
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) {
              onToggleExpand?.(page.id)
            }
          }}
          style={{ cursor: hasChildren ? 'pointer' : 'default' }}
        >
          {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
        </span>
        <span className="wiki-tree-icon">📄</span>
        <span className="wiki-tree-title" title={page.title}>
          {page.title}
        </span>
        <div className="wiki-tree-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="wiki-icon-btn"
            title="添加子页面"
            onClick={handleCreateChild}
          >
            +
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="wiki-tree-children">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              page={child}
              data={data}
              selectedPageId={selectedPageId}
              expandedNodes={expandedNodes}
              onSelectPage={onSelectPage}
              onToggleExpand={onToggleExpand}
              onCreateChild={onCreateChild}
              onDeletePage={onDeletePage}
            />
          ))}
        </div>
      )}

      {showContextMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 49,
            }}
            onClick={() => setShowContextMenu(null)}
          />
          <div
            className="wiki-context-menu"
            style={{
              position: 'fixed',
              left: showContextMenu.x,
              top: showContextMenu.y,
            }}
          >
            <div className="wiki-context-menu-item" onClick={handleCreateChild}>
              添加子页面
            </div>
            <div className="wiki-context-menu-item" onClick={() => setShowContextMenu(null)}>
              重命名
            </div>
            <div className="wiki-context-menu-item danger" onClick={handleDelete}>
              删除页面
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function PageTree({
  data,
  spaceId,
  selectedPageId,
  selectedTag,
  expandedNodes,
  onSelectPage,
  onToggleExpand,
  onCreateRoot,
  onCreateChild,
  onDeletePage,
}) {
  const [newPageTitle, setNewPageTitle] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [parentId, setParentId] = useState(null)

  const rootPages = getRootPages(data.pages, spaceId)
  const filteredRootPages = selectedTag
    ? filterPagesByTag(data, spaceId, selectedTag).filter((p) => !p.parentId)
    : rootPages

  const handleCreateRoot = () => {
    setParentId(null)
    setNewPageTitle('')
    setShowCreateModal(true)
  }

  const handleCreateChild = (pId) => {
    setParentId(pId)
    setNewPageTitle('')
    setShowCreateModal(true)
  }

  const handleCreate = () => {
    if (newPageTitle.trim()) {
      if (parentId) {
        onCreateChild?.(parentId, newPageTitle.trim())
      } else {
        onCreateRoot?.(newPageTitle.trim())
      }
      setShowCreateModal(false)
      setNewPageTitle('')
      setParentId(null)
    }
  }

  return (
    <>
      <aside className="wiki-page-tree">
        <div className="wiki-page-tree-header">
          <span className="wiki-page-tree-title">页面列表</span>
          <button
            className="wiki-icon-btn"
            title="新建页面"
            onClick={handleCreateRoot}
          >
            +
          </button>
        </div>

        <div className="wiki-page-tree-content">
          {filteredRootPages.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
              {selectedTag ? '暂无带此标签的页面' : '暂无页面'}
            </div>
          ) : (
            filteredRootPages.map((page) => (
              <TreeNode
                key={page.id}
                page={page}
                data={data}
                selectedPageId={selectedPageId}
                expandedNodes={expandedNodes}
                onSelectPage={onSelectPage}
                onToggleExpand={onToggleExpand}
                onCreateChild={handleCreateChild}
                onDeletePage={onDeletePage}
              />
            ))
          )}
        </div>
      </aside>

      {showCreateModal && (
        <div className="wiki-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="wiki-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wiki-modal-header">
              {parentId ? '创建子页面' : '创建新页面'}
            </div>
            <div className="wiki-modal-body">
              <div className="wiki-form-group">
                <label className="wiki-form-label">页面标题</label>
                <input
                  type="text"
                  className="wiki-form-input"
                  placeholder="请输入页面标题"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPageTitle.trim()) {
                      handleCreate()
                    }
                  }}
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
                onClick={handleCreate}
                disabled={!newPageTitle.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
