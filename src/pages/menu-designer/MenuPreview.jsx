import { useState } from 'react'
import { LAYOUT_TYPES, MENU_TYPES } from './constants.js'
import { getIconEmoji, hasChildren } from './menuDesignerCore.js'

export default function MenuPreview({ title, layout, menu }) {
  if (layout === LAYOUT_TYPES.HORIZONTAL) {
    return <HorizontalPreview title={title} menu={menu} />
  }
  if (layout === LAYOUT_TYPES.VERTICAL) {
    return <VerticalPreview title={title} menu={menu} />
  }
  return <CollapsiblePreview title={title} menu={menu} />
}

function HorizontalPreview({ title, menu }) {
  const [openMenuId, setOpenMenuId] = useState(null)

  return (
    <div
      style={{
        width: '800px',
        border: '1px solid #e8e8e8',
        borderRadius: '6px',
        overflow: 'hidden',
        background: 'white',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#001529',
          color: 'white',
          height: '48px',
          padding: '0 24px',
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 600 }}>{title}</div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#001529',
          padding: '0 16px',
          height: '48px',
          borderTop: '1px solid #002140',
        }}
      >
        {menu.map((item) => (
          <HorizontalMenuItem
            key={item.id}
            item={item}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
          />
        ))}
      </div>
      <div
        style={{
          height: '200px',
          background: '#f0f2f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '13px',
        }}
      >
        内容区域
      </div>
    </div>
  )
}

function HorizontalMenuItem({ item, openMenuId, setOpenMenuId }) {
  if (item.type === MENU_TYPES.DIVIDER) {
    return (
      <div
        style={{
          width: '1px',
          height: '24px',
          background: '#002140',
          margin: '0 8px',
        }}
      />
    )
  }

  const icon = getIconEmoji(item.icon)
  const hasChild = hasChildren(item)
  const isOpen = openMenuId === item.id

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => hasChild && setOpenMenuId(item.id)}
      onMouseLeave={() => setOpenMenuId(null)}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          height: '48px',
          color: 'rgba(255,255,255,0.85)',
          cursor: 'pointer',
          fontSize: '14px',
          background: isOpen ? '#1890ff' : 'transparent',
          transition: 'background 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {icon && <span style={{ marginRight: '6px', fontSize: '14px' }}>{icon}</span>}
        <span>{item.name}</span>
        {hasChild && (
          <span style={{ marginLeft: '4px', fontSize: '10px' }}>▼</span>
        )}
      </div>
      {hasChild && isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: 'white',
            border: '1px solid #e8e8e8',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '160px',
            padding: '4px 0',
            zIndex: 100,
          }}
        >
          {item.children.map((child) => (
            <DropdownItem key={child.id} item={child} />
          ))}
        </div>
      )}
    </div>
  )
}

function DropdownItem({ item }) {
  if (item.type === MENU_TYPES.DIVIDER) {
    return (
      <div
        style={{
          height: '1px',
          background: '#eee',
          margin: '4px 0',
        }}
      />
    )
  }

  const icon = getIconEmoji(item.icon)
  const hasChild = hasChildren(item)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        cursor: 'pointer',
        fontSize: '13px',
        color: '#333',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon && <span style={{ marginRight: '8px', fontSize: '14px' }}>{icon}</span>}
      <span style={{ flex: 1 }}>{item.name}</span>
      {hasChild && <span style={{ fontSize: '10px', color: '#999' }}>▶</span>}
    </div>
  )
}

function VerticalPreview({ title, menu }) {
  return (
    <div
      style={{
        width: '250px',
        border: '1px solid #e8e8e8',
        borderRadius: '6px',
        overflow: 'hidden',
        background: 'white',
        display: 'flex',
        height: '400px',
      }}
    >
      <div
        style={{
          width: '100%',
          background: '#001529',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            borderBottom: '1px solid #002140',
          }}
        >
          {title}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {menu.map((item) => (
            <VerticalMenuItem key={item.id} item={item} level={0} />
          ))}
        </div>
      </div>
    </div>
  )
}

function VerticalMenuItem({ item, level }) {
  const [expanded, setExpanded] = useState(false)

  if (item.type === MENU_TYPES.DIVIDER) {
    return (
      <div
        style={{
          height: '1px',
          background: '#002140',
          margin: '8px 16px',
        }}
      />
    )
  }

  const icon = getIconEmoji(item.icon)
  const hasChild = hasChildren(item)

  if (!hasChild) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          paddingLeft: `${16 + level * 16}px`,
          color: 'rgba(255,255,255,0.75)',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'white'
          e.currentTarget.style.background = '#1890ff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        {icon && <span style={{ marginRight: '10px', fontSize: '14px' }}>{icon}</span>}
        <span>{item.name}</span>
      </div>
    )
  }

  return (
    <div>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          paddingLeft: `${16 + level * 16}px`,
          color: 'rgba(255,255,255,0.75)',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'white'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
        }}
      >
        {icon && <span style={{ marginRight: '10px', fontSize: '14px' }}>{icon}</span>}
        <span style={{ flex: 1 }}>{item.name}</span>
        <span
          style={{
            fontSize: '10px',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        >
          ▶
        </span>
      </div>
      {expanded && (
        <div style={{ background: '#000c17' }}>
          {item.children.map((child) => (
            <VerticalMenuItem key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function CollapsiblePreview({ title, menu }) {
  const [expandedIds, setExpandedIds] = useState(new Set())

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div
      style={{
        width: '250px',
        border: '1px solid #e8e8e8',
        borderRadius: '6px',
        overflow: 'hidden',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        height: '400px',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          background: '#fafafa',
          borderBottom: '1px solid #e8e8e8',
          fontSize: '16px',
          fontWeight: 600,
          color: '#333',
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1, overflow: 'auto', background: 'white' }}>
        {menu.map((item) => (
          <CollapsibleItem
            key={item.id}
            item={item}
            level={0}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
          />
        ))}
      </div>
    </div>
  )
}

function CollapsibleItem({ item, level, expandedIds, toggleExpand }) {
  if (item.type === MENU_TYPES.DIVIDER) {
    return (
      <div
        style={{
          height: '1px',
          background: '#eee',
          margin: '4px 12px',
        }}
      />
    )
  }

  const icon = getIconEmoji(item.icon)
  const hasChild = hasChildren(item)
  const isExpanded = expandedIds.has(item.id)

  if (!hasChild) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          paddingLeft: `${16 + level * 16}px`,
          color: '#333',
          cursor: 'pointer',
          fontSize: '13px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{ width: '16px' }}>
          {icon && <span style={{ fontSize: '14px' }}>{icon}</span>}
        </span>
        <span style={{ marginLeft: icon ? '6px' : '0' }}>{item.name}</span>
      </div>
    )
  }

  return (
    <div>
      <div
        onClick={() => toggleExpand(item.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          paddingLeft: `${16 + level * 16}px`,
          color: '#333',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          background: isExpanded ? '#f0f7ff' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) e.currentTarget.style.background = '#f5f5f5'
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) e.currentTarget.style.background = 'transparent'
        }}
      >
        <span
          style={{
            width: '16px',
            display: 'inline-flex',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#999',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        >
          ▶
        </span>
        {icon && (
          <span style={{ marginLeft: '4px', marginRight: '6px', fontSize: '14px' }}>
            {icon}
          </span>
        )}
        <span style={{ flex: 1 }}>{item.name}</span>
      </div>
      {isExpanded && (
        <div style={{ borderLeft: `1px solid #e8e8e8`, marginLeft: `${level * 16 + 24}px` }}>
          {item.children.map((child) => (
            <CollapsibleItem
              key={child.id}
              item={child}
              level={level + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}
