import { useState, useRef, useCallback } from 'react'
import {
  getIconEmoji,
  findParentInfo,
  hasChildren,
  collectDescendantIds,
} from './menuDesignerCore.js'
import { MENU_TYPES } from './constants.js'

function getTypeLabel(type) {
  switch (type) {
    case MENU_TYPES.LINK:
      return '链接'
    case MENU_TYPES.GROUP:
      return '菜单组'
    case MENU_TYPES.DIVIDER:
      return '分割线'
    default:
      return type
  }
}

function TreeNode({
  item,
  level,
  selectedId,
  onSelect,
  onContextMenu,
  onToggleCollapse,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  dragOverId,
  dragOverPosition,
}) {
  const isSelected = selectedId === item.id
  const isDivider = item.type === MENU_TYPES.DIVIDER
  const hasChild = hasChildren(item)
  const collapsed = item.collapsed
  const icon = getIconEmoji(item.icon)

  const handleDragStart = (e) => {
    if (isDivider) return
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)
    onDragStart(item.id)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isDivider) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height
    let position
    if (y < height / 3) {
      position = 'before'
    } else if (y > (height * 2) / 3) {
      position = 'after'
    } else {
      position = 'child'
    }
    onDragOver(item.id, position)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const sourceId = e.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === item.id) return
    onDrop(sourceId, item.id, dragOverPosition || 'after')
  }

  const handleClick = () => {
    if (!isDivider) {
      onSelect(item.id)
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu(e, item)
  }

  const handleToggle = (e) => {
    e.stopPropagation()
    if (hasChild) {
      onToggleCollapse(item.id)
    }
  }

  const showDropIndicator = dragOverId === item.id
  const indicatorBefore = showDropIndicator && dragOverPosition === 'before'
  const indicatorAfter = showDropIndicator && dragOverPosition === 'after'
  const indicatorChild = showDropIndicator && dragOverPosition === 'child'

  if (isDivider) {
    return (
      <div
        style={{
          paddingLeft: `${level * 20 + 8}px`,
          paddingTop: '4px',
          paddingBottom: '4px',
        }}
      >
        <div
          style={{
            height: '1px',
            background: '#ddd',
            margin: '0 8px',
          }}
        />
      </div>
    )
  }

  return (
    <>
      <div
        draggable={!isDivider}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={(e) => {
          e.stopPropagation()
          onDragLeave(item.id)
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 8px',
          paddingLeft: `${level * 20 + 8}px`,
          cursor: 'pointer',
          background: isSelected ? '#e6f4ff' : 'transparent',
          borderLeft: isSelected ? '3px solid #1677ff' : '3px solid transparent',
          borderTop: indicatorBefore ? '2px solid #1677ff' : 'none',
          borderBottom: indicatorAfter ? '2px solid #1677ff' : 'none',
          borderRadius: indicatorChild ? '4px' : '0',
          boxShadow: indicatorChild ? '0 0 0 2px #1677ff' : 'none',
          userSelect: 'none',
          fontSize: '13px',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = '#f5f5f5'
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'transparent'
        }}
      >
        <span
          onClick={handleToggle}
          style={{
            width: '16px',
            display: 'inline-flex',
            justifyContent: 'center',
            cursor: hasChild ? 'pointer' : 'default',
            color: '#999',
            marginRight: '4px',
            transform: hasChild && !collapsed ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        >
          {hasChild ? '▶' : ''}
        </span>
        {icon && (
          <span style={{ marginRight: '6px', fontSize: '14px' }}>{icon}</span>
        )}
        <span style={{ flex: 1, color: '#333' }}>{item.name}</span>
        <span
          style={{
            fontSize: '11px',
            color: '#999',
            background: '#f0f0f0',
            padding: '1px 6px',
            borderRadius: '3px',
            marginLeft: '6px',
          }}
        >
          {getTypeLabel(item.type)}
        </span>
      </div>
      {hasChild && !collapsed && (
        <>
          {item.children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              onToggleCollapse={onToggleCollapse}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragLeave={onDragLeave}
              dragOverId={dragOverId}
              dragOverPosition={dragOverPosition}
            />
          ))}
        </>
      )}
    </>
  )
}

function ContextMenu({ x, y, item, menu, onAction }) {
  const isDivider = item.type === MENU_TYPES.DIVIDER
  const descendantCount = isDivider ? 0 : collectDescendantIds(menu, item.id).length - 1
  const hasParent = !!findParentInfo(menu, item.id)?.parent

  const menuItems = [
    { key: 'addChild', label: '➕ 添加子菜单', disabled: isDivider },
    { key: 'addBefore', label: '⬆️ 在上方添加', disabled: !hasParent },
    { key: 'addAfter', label: '⬇️ 在下方添加', disabled: !hasParent },
    { key: 'divider1', type: 'divider' },
    { key: 'edit', label: '✏️ 编辑', disabled: isDivider },
    { key: 'divider2', type: 'divider' },
    {
      key: 'delete',
      label: descendantCount > 0 ? `🗑️ 删除（含 ${descendantCount} 个子项）` : '🗑️ 删除',
      danger: true,
    },
  ]

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        background: 'white',
        border: '1px solid #e8e8e8',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '4px 0',
        minWidth: '180px',
        zIndex: 1000,
      }}
    >
      {menuItems.map((m, idx) => {
        if (m.type === 'divider') {
          return (
            <div
              key={idx}
              style={{ height: '1px', background: '#eee', margin: '4px 0' }}
            />
          )
        }
        return (
          <div
            key={m.key}
            onClick={() => !m.disabled && onAction(m.key, item)}
            style={{
              padding: '8px 16px',
              cursor: m.disabled ? 'not-allowed' : 'pointer',
              color: m.danger ? '#ff4d4f' : '#333',
              opacity: m.disabled ? 0.5 : 1,
              fontSize: '13px',
            }}
            onMouseEnter={(e) => {
              if (!m.disabled) e.currentTarget.style.background = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            {m.label}
          </div>
        )
      })}
    </div>
  )
}

export default function TreeEditor({
  menu,
  selectedId,
  onSelect,
  onAddChild,
  onAddBefore,
  onAddAfter,
  onDelete,
  onMove,
  onToggleCollapse,
}) {
  const [contextMenu, setContextMenu] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [dragOverPosition, setDragOverPosition] = useState(null)
  const containerRef = useRef(null)

  const handleContextMenu = useCallback((e, item) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    })
  }, [])

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleContextAction = useCallback(
    (action, item) => {
      setContextMenu(null)
      switch (action) {
        case 'addChild':
          onAddChild(item.id)
          break
        case 'addBefore':
          onAddBefore(item.id)
          break
        case 'addAfter':
          onAddAfter(item.id)
          break
        case 'edit':
          onSelect(item.id)
          break
        case 'delete':
          onDelete(item.id)
          break
        default:
          break
      }
    },
    [onAddChild, onAddBefore, onAddAfter, onSelect, onDelete]
  )

  const handleDragOver = useCallback((id, position) => {
    setDragOverId(id)
    setDragOverPosition(position)
  }, [])

  const handleDragLeave = useCallback((id) => {
    if (dragOverId === id) {
      setDragOverId(null)
      setDragOverPosition(null)
    }
  }, [dragOverId])

  const handleDrop = useCallback(
    (sourceId, targetId, position) => {
      setDragOverId(null)
      setDragOverPosition(null)
      onMove(sourceId, targetId, position)
    },
    [onMove]
  )

  return (
    <div
      ref={containerRef}
      onClick={handleCloseContextMenu}
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px',
        background: '#fafafa',
      }}
    >
      {menu.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: '#999',
            fontSize: '13px',
          }}
        >
          暂无菜单项，点击顶部"添加菜单"按钮开始创建
        </div>
      ) : (
        menu.map((item) => (
          <TreeNode
            key={item.id}
            item={item}
            level={0}
            selectedId={selectedId}
            onSelect={onSelect}
            onContextMenu={handleContextMenu}
            onToggleCollapse={onToggleCollapse}
            onDragStart={() => {}}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            dragOverId={dragOverId}
            dragOverPosition={dragOverPosition}
          />
        ))
      )}
      {contextMenu && (
        <>
          <div
            onClick={handleCloseContextMenu}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
            }}
          />
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            item={contextMenu.item}
            menu={menu}
            onAction={handleContextAction}
            onClose={handleCloseContextMenu}
          />
        </>
      )}
    </div>
  )
}
