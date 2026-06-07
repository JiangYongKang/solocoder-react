import { useEffect, useRef } from 'react'

export default function ContextMenu({ position, visible, onClose, onAction, targetNode }) {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!visible) return

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
  }, [visible, onClose])

  if (!visible) return null

  const isFolder = targetNode?.type === 'folder'

  const menuItems = [
    { key: 'newFolder', label: '新建文件夹', icon: 'folder', show: true },
    { key: 'newFile', label: '新建文件', icon: 'file', show: true },
    { key: 'rename', label: '重命名', icon: 'edit', show: !!targetNode },
    { key: 'delete', label: '删除', icon: 'trash', show: !!targetNode, danger: true },
  ]

  return (
    <div
      ref={menuRef}
      className="fm-context-menu"
      style={{ top: position.y, left: position.x }}
      role="menu"
    >
      {menuItems
        .filter((item) => item.show)
        .map((item) => (
          <button
            key={item.key}
            type="button"
            className={`fm-context-menu-item ${item.danger ? 'danger' : ''}`}
            onClick={() => {
              onAction(item.key, targetNode, isFolder)
              onClose()
            }}
            role="menuitem"
          >
            <span className="fm-context-menu-label">{item.label}</span>
          </button>
        ))}
    </div>
  )
}
