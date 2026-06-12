import { useState, useRef, useEffect } from 'react'
import { NODE_TYPES } from './constants.js'
import { getChildren } from './noteUtils.js'

const NODE_ICONS = {
  [NODE_TYPES.NOTEBOOK]: '📒',
  [NODE_TYPES.FOLDER]: '📁',
  [NODE_TYPES.NOTE]: '📄',
}

export default function TreeNode({
  node,
  data,
  selectedNoteId,
  onSelect,
  onToggle,
  onContextMenu,
  onRename,
  onDrop,
  onDragStart,
  editingId,
  setEditingId,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef(null)

  const children = getChildren(data, node.id)
  const hasChildren = children.length > 0
  const isExpanded = node.expanded !== false
  const isNote = node.type === NODE_TYPES.NOTE
  const isSelected = selectedNoteId === node.id
  const isEditing = editingId === node.id
  const displayName = isNote ? node.title : node.name

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  function handleDoubleClick(e) {
    e.stopPropagation()
    setEditValue(displayName)
    setEditingId(node.id)
  }

  function handleEditBlur() {
    const newValue = editValue.trim()
    if (newValue && newValue !== displayName) {
      onRename(node.id, newValue)
    }
    setEditingId(null)
  }

  function handleEditKeyDown(e) {
    if (e.key === 'Enter') {
      handleEditBlur()
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  function handleClick(e) {
    e.stopPropagation()
    if (isEditing) return
    if (isNote) {
      onSelect(node.id)
    } else {
      onToggle(node.id)
    }
  }

  function handleContextMenu(e) {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu(e, node)
  }

  function handleDragStart(e) {
    if (node.type === NODE_TYPES.NOTEBOOK) {
      e.preventDefault()
      return
    }
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', node.id)
    e.dataTransfer.effectAllowed = 'move'
    if (onDragStart) onDragStart(node.id)
  }

  function handleDragEnd() {
    setIsDragging(false)
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    if (node.type === NODE_TYPES.NOTE) return
    setIsDragOver(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId && draggedId !== node.id && node.type !== NODE_TYPES.NOTE) {
      onDrop(draggedId, node.id)
    }
  }

  return (
    <div className="tree-node">
      <div
        className={`tree-node-content ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        draggable={node.type !== NODE_TYPES.NOTEBOOK}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!isNote && (
          <span
            className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.id)
            }}
          >
            {hasChildren ? '▶' : ''}
          </span>
        )}
        {isNote && <span className="expand-icon" />}
        <span className="node-icon">{NODE_ICONS[node.type]}</span>
        {isEditing ? (
          <input
            ref={inputRef}
            className="node-name editing"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditBlur}
            onKeyDown={handleEditKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="node-name" title={displayName}>
            {displayName}
          </span>
        )}
      </div>
      {!isNote && isExpanded && hasChildren && (
        <div className="tree-children">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              data={data}
              selectedNoteId={selectedNoteId}
              onSelect={onSelect}
              onToggle={onToggle}
              onContextMenu={onContextMenu}
              onRename={onRename}
              onDrop={onDrop}
              onDragStart={onDragStart}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
