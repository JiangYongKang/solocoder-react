import { useState, useRef, useEffect } from 'react'
import { getChildCategories } from './kbUtils'

function FolderIcon({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <path d="M6 14l1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
      ) : (
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      )}
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function TreeNode({
  node,
  categories,
  selectedId,
  onSelect,
  onToggleExpand,
  onAddChild,
  onRename,
  onDelete,
  onMove,
  depth = 0,
}) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(node.name)
  const [dragOver, setDragOver] = useState(null)
  const renameInputRef = useRef(null)
  const children = getChildCategories(categories, node.id)
  const isExpanded = !!node.isExpanded

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [isRenaming])

  const handleStartRename = (e) => {
    e.stopPropagation()
    setIsRenaming(true)
    setRenameValue(node.name)
  }

  const handleCommitRename = () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== node.name) {
      onRename(node.id, trimmed)
    }
    setIsRenaming(false)
  }

  const handleCancelRename = () => {
    setRenameValue(node.name)
    setIsRenaming(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCommitRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelRename()
    }
  }

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/category-id', node.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    if (node.id === 'cat-root') {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      const rect = e.currentTarget.getBoundingClientRect()
      const y = e.clientY - rect.top
      const h = rect.height
      if (y < h * 0.25) {
        setDragOver('before')
      } else if (y > h * 0.75) {
        setDragOver('after')
      } else {
        setDragOver('inside')
      }
    } else {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      const rect = e.currentTarget.getBoundingClientRect()
      const y = e.clientY - rect.top
      const h = rect.height
      if (y < h * 0.25) {
        setDragOver('before')
      } else if (y > h * 0.75) {
        setDragOver('after')
      } else {
        setDragOver('inside')
      }
    }
  }

  const handleDragLeave = () => {
    setDragOver(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const sourceId = e.dataTransfer.getData('text/category-id')
    if (sourceId && dragOver) {
      onMove(sourceId, node.id, dragOver)
    }
    setDragOver(null)
  }

  const itemClass = [
    'kb-tree-item',
    selectedId === node.id ? 'active' : '',
    dragOver === 'inside' ? 'drop-inside' : '',
    dragOver === 'before' ? 'drop-before' : '',
    dragOver === 'after' ? 'drop-after' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="kb-tree-node">
      <div
        className={itemClass}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(node.id)}
        draggable={node.id !== 'cat-root'}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          type="button"
          className={`kb-tree-chevron ${isExpanded ? 'expanded' : ''} ${children.length === 0 ? 'no-children' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            if (children.length > 0) onToggleExpand(node.id)
          }}
          aria-label={isExpanded ? '折叠' : '展开'}
        >
          <ChevronIcon />
        </button>
        <span className="kb-tree-icon">
          <FolderIcon open={isExpanded} />
        </span>
        {isRenaming ? (
          <input
            ref={renameInputRef}
            className="kb-tree-rename-input"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleCommitRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="kb-tree-name">{node.name}</span>
        )}
        {!isRenaming && (
          <div className="kb-tree-actions">
            {node.id !== 'cat-root' && (
              <>
                <button
                  type="button"
                  className="kb-tree-action-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddChild(node.id)
                  }}
                  title="新建子分类"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="kb-tree-action-btn"
                  onClick={handleStartRename}
                  title="重命名"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="kb-tree-action-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(node.id)
                  }}
                  title="删除"
                  style={{ color: '#ef4444' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </>
            )}
            {node.id === 'cat-root' && (
              <button
                type="button"
                className="kb-tree-action-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddChild(node.id)
                }}
                title="新建分类"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      {isExpanded && children.length > 0 && (
        <div className="kb-tree-children">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              categories={categories}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
              onRename={onRename}
              onDelete={onDelete}
              onMove={onMove}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CategoryTree({
  categories,
  selectedId,
  onSelect,
  onToggleExpand,
  onAddRoot,
  onAddChild,
  onRename,
  onDelete,
  onMove,
}) {
  const root = categories.find((c) => c.id === 'cat-root')
  if (!root) return null

  return (
    <div>
      <div className="kb-tree-header">
        <span className="kb-tree-title">分类目录</span>
        <button type="button" className="kb-btn" onClick={onAddRoot}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新建
        </button>
      </div>
      <TreeNode
        node={root}
        categories={categories}
        selectedId={selectedId}
        onSelect={onSelect}
        onToggleExpand={onToggleExpand}
        onAddChild={onAddChild}
        onRename={onRename}
        onDelete={onDelete}
        onMove={onMove}
        depth={0}
      />
    </div>
  )
}
