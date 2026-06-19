import { useState, useMemo, useCallback } from 'react'
import ContextMenu from './ContextMenu.jsx'
import {
  flatToTree,
  filterTagsByKeyword,
  canMoveTag,
} from './utils.js'

function TagTreeNode({
  node,
  depth,
  selectedIds,
  expandedIds,
  matchedIds,
  searchKeyword,
  onToggleExpand,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  dragState,
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedIds.has(node.id)
  const isDragOver = dragState?.overId === node.id
  const isDragging = dragState?.dragId === node.id

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu(e.clientX, e.clientY, node)
  }

  const handleClick = (e) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      onSelect(node.id, true)
    } else {
      onSelect(node.id, false)
    }
  }

  const handleToggle = (e) => {
    e.stopPropagation()
    onToggleExpand(node.id)
  }

  const handleDragStart = (e) => {
    e.stopPropagation()
    onDragStart(node.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    onDragOver(node.id)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // 防止快速移动时闪烁
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height
    let position = 'inside'
    if (y < height * 0.25) {
      position = 'before'
    } else if (y > height * 0.75) {
      position = 'after'
    }
    onDrop(node.id, position)
  }

  const handleDragEnd = () => {
    onDragEnd()
  }

  const highlightText = (text, keyword) => {
    if (!keyword || !text) return text
    const lowerText = text.toLowerCase()
    const lowerKw = keyword.toLowerCase()
    const index = lowerText.indexOf(lowerKw)
    if (index === -1) return text
    return (
      <>
        {text.slice(0, index)}
        <span className="highlight">
          {text.slice(index, index + keyword.length)}
        </span>
        {text.slice(index + keyword.length)}
      </>
    )
  }

  return (
    <div>
      <div
        className={`tag-tree-node ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{ paddingLeft: depth * 24 + 8 }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      >
        <div className="tree-node-content">
          <div className="tree-node-left">
            <div className="tree-lines">
              {depth > 0 && (
                <span
                  className="tree-line"
                  style={{ left: -16, width: 12 }}
                />
              )}
            </div>
            <button
              className={`expand-btn ${hasChildren ? '' : 'empty'}`}
              onClick={handleToggle}
              tabIndex={-1}
            >
              {hasChildren && (
                <span className={`arrow ${isExpanded ? 'expanded' : ''}`}>
                  ▶
                </span>
              )}
            </button>
            <input
              type="checkbox"
              className="node-checkbox"
              checked={isSelected}
              onChange={() => onSelect(node.id, true)}
              onClick={(e) => e.stopPropagation()}
            />
            <span
              className="tag-color-dot"
              style={{ backgroundColor: node.color }}
            />
            <span
              className="tag-name"
              style={{ color: node.color }}
              title={node.name}
            >
              {highlightText(node.name, searchKeyword)}
            </span>
          </div>
          <span className="tag-count" style={{ color: node.color }}>
            ({node.resourceCount || 0})
          </span>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="tag-tree-children">
          {node.children.map((child) => (
            <TagTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              matchedIds={matchedIds}
              searchKeyword={searchKeyword}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
              dragState={dragState}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TagTree({
  tags,
  selectedIds,
  onSelectionChange,
  onTagClick,
  onEdit,
  onDelete,
  onAddChild,
  onMove,
}) {
  const [expandedIds, setExpandedIds] = useState(new Set(tags.filter(t => !t.parentId).map(t => t.id)))
  const [searchKeyword, setSearchKeyword] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [dragState, setDragState] = useState(null)
  const [dropMenu, setDropMenu] = useState(null)

  const { filtered, matchedIds, expandedIds: autoExpandedIds } = useMemo(() => {
    return filterTagsByKeyword(tags, searchKeyword)
  }, [tags, searchKeyword])

  const effectiveExpandedIds = useMemo(() => {
    if (searchKeyword.trim()) {
      const merged = new Set([...expandedIds, ...autoExpandedIds])
      return merged
    }
    return expandedIds
  }, [expandedIds, autoExpandedIds, searchKeyword])

  const treeData = useMemo(() => {
    return flatToTree(filtered)
  }, [filtered])

  const handleToggleExpand = useCallback((tagId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) {
        next.delete(tagId)
      } else {
        next.add(tagId)
      }
      return next
    })
  }, [])

  const handleSelect = useCallback(
    (tagId, multiSelect) => {
      if (multiSelect) {
        const next = new Set(selectedIds)
        if (next.has(tagId)) {
          next.delete(tagId)
        } else {
          next.add(tagId)
        }
        onSelectionChange(Array.from(next))
      } else {
        onSelectionChange([tagId])
        onTagClick(tagId)
      }
    },
    [selectedIds, onSelectionChange, onTagClick]
  )

  const handleContextMenu = useCallback((x, y, node) => {
    setContextMenu({ x, y, node })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleDragStart = useCallback((dragId) => {
    setDragState({ dragId, overId: null })
  }, [])

  const handleDragOver = useCallback((overId) => {
    setDragState((prev) => (prev ? { ...prev, overId } : null))
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragState(null)
    setDropMenu(null)
  }, [])

  const handleDrop = useCallback(
    (targetId, position) => {
      if (!dragState || dragState.dragId === targetId) {
        setDragState(null)
        return
      }
      const sourceId = dragState.dragId
      const canMove = canMoveTag(sourceId, targetId, tags, position)
      if (!canMove) {
        alert('不能将标签移动到自身的子标签下')
        setDragState(null)
        return
      }
      setDropMenu({
        x: null,
        y: null,
        sourceId,
        targetId,
        position,
      })
      setDragState(null)
    },
    [dragState, tags]
  )

  const confirmDrop = useCallback(
    (sourceId, targetId, position) => {
      onMove(sourceId, targetId, position)
      setDropMenu(null)
    },
    [onMove]
  )

  const contextMenuItems = contextMenu
    ? [
        { icon: '✏️', label: '编辑', onClick: () => onEdit(contextMenu.node) },
        {
          icon: '➕',
          label: '建子标签',
          onClick: () => onAddChild(contextMenu.node),
        },
        { divider: true },
        {
          icon: '🗑️',
          label: '删除',
          danger: true,
          onClick: () => onDelete(contextMenu.node),
        },
      ]
    : []

  return (
    <div className="tag-tree">
      <div className="tag-tree-header">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="搜索标签..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          {searchKeyword && (
            <button
              className="clear-btn"
              onClick={() => setSearchKeyword('')}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="tag-tree-list">
        {treeData.length > 0 ? (
          treeData.map((node) => (
            <TagTreeNode
              key={node.id}
              node={node}
              depth={0}
              selectedIds={selectedIds}
              expandedIds={effectiveExpandedIds}
              matchedIds={matchedIds}
              searchKeyword={searchKeyword}
              onToggleExpand={handleToggleExpand}
              onSelect={handleSelect}
              onContextMenu={handleContextMenu}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              dragState={dragState}
            />
          ))
        ) : (
          <div className="empty-tree">
            <div className="empty-icon">🏷️</div>
            <div className="empty-text">暂无标签</div>
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />
      )}

      {dropMenu && (
        <div className="modal-overlay" onClick={() => setDropMenu(null)}>
          <div
            className="modal-content modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">选择移动方式</h3>
              <button
                className="modal-close"
                onClick={() => setDropMenu(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="drop-actions">
                <button
                  className="btn btn-secondary full-width"
                  onClick={() =>
                    confirmDrop(dropMenu.sourceId, dropMenu.targetId, 'inside')
                  }
                >
                  📂 移入为子标签
                </button>
                <button
                  className="btn btn-secondary full-width"
                  onClick={() =>
                    confirmDrop(dropMenu.sourceId, dropMenu.targetId, 'before')
                  }
                >
                  ⬆️ 移到上方
                </button>
                <button
                  className="btn btn-secondary full-width"
                  onClick={() =>
                    confirmDrop(dropMenu.sourceId, dropMenu.targetId, 'after')
                  }
                >
                  ⬇️ 移到下方
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
