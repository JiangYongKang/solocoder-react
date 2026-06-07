import { useMemo } from 'react'

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

function ChevronIcon({ expanded }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function TreeNode({ nodeId, fs, depth = 0 }) {
  const node = fs.data.nodes[nodeId]
  const isExpanded = fs.isFolderExpanded(nodeId)
  const isActive = fs.currentFolderId === nodeId
  const childCount = fs.getFolderChildCount(nodeId)
  const childFolders = useMemo(() => {
    if (!node) return []
    return (node.children || [])
      .map((id) => fs.data.nodes[id])
      .filter((n) => n && n.type === 'folder')
      .map((n) => n.id)
  }, [fs.data.nodes, node])

  if (!node || node.type !== 'folder') return null

  const handleToggle = (e) => {
    e.stopPropagation()
    fs.toggleFolder(nodeId)
  }

  const handleClick = () => {
    fs.selectFolder(nodeId)
  }

  return (
    <div className="fm-tree-node">
      <div
        className={`fm-tree-item ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={handleClick}
      >
        <button
          type="button"
          className="fm-tree-chevron"
          onClick={handleToggle}
          aria-label={isExpanded ? '折叠' : '展开'}
        >
          <ChevronIcon expanded={isExpanded} />
        </button>
        <span className="fm-tree-icon">
          <FolderIcon open={isExpanded} />
        </span>
        <span className="fm-tree-name">{node.name}</span>
        <span className="fm-tree-count">({childCount})</span>
      </div>
      {isExpanded && childFolders.length > 0 && (
        <div className="fm-tree-children">
          {childFolders.map((childId) => (
            <TreeNode key={childId} nodeId={childId} fs={fs} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FolderTree({ fs, onToggleSidebar }) {
  return (
    <div className="fm-sidebar">
      <div className="fm-sidebar-header">
        <span className="fm-sidebar-title">目录树</span>
        <button type="button" className="fm-sidebar-toggle" onClick={onToggleSidebar} aria-label="收起侧边栏">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
      <div className="fm-tree">
        <TreeNode nodeId={fs.data.rootId} fs={fs} depth={0} />
      </div>
    </div>
  )
}
