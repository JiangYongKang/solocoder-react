import { formatFileSize, formatDate } from './utils'

function getFileIcon(fileType) {
  switch (fileType) {
    case 'pdf':
      return '📄'
    case 'doc':
    case 'docx':
      return '📝'
    case 'txt':
      return '📃'
    case 'md':
      return '📋'
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return '🖼️'
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return '💻'
    case 'json':
      return '🔧'
    default:
      return '📄'
  }
}

function GridView({ items, onItemClick, onItemContextMenu, selectedId }) {
  if (items.length === 0) {
    return <div className="fm-empty">此文件夹为空</div>
  }
  return (
    <div className="fm-grid-view">
      {items.map((item) => (
        <div
          key={item.id}
          className={`fm-grid-card ${selectedId === item.id ? 'selected' : ''}`}
          onClick={() => onItemClick(item)}
          onContextMenu={(e) => onItemContextMenu(e, item)}
        >
          <div className="fm-grid-icon">
            {item.type === 'folder' ? '📁' : getFileIcon(item.fileType)}
          </div>
          <div className="fm-grid-name" title={item.name}>{item.name}</div>
        </div>
      ))}
    </div>
  )
}

function ListView({ items, onItemClick, onItemContextMenu, selectedId, sortBy, sortOrder, onSort }) {
  if (items.length === 0) {
    return <div className="fm-empty">此文件夹为空</div>
  }

  const headers = [
    { key: 'name', label: '名称' },
    { key: 'type', label: '类型' },
    { key: 'size', label: '大小' },
    { key: 'date', label: '修改时间' },
  ]

  return (
    <div className="fm-list-view">
      <table className="fm-list-table">
        <thead>
          <tr>
            {headers.map((h) => {
              const sortKey = h.key === 'date' ? null : h.key
              const isActive = sortBy === sortKey
              return (
                <th
                  key={h.key}
                  className={`fm-list-th ${sortKey ? 'sortable' : ''} ${isActive ? 'active' : ''}`}
                  onClick={sortKey ? () => onSort(sortKey) : undefined}
                >
                  {h.label}
                  {isActive && <span className="fm-sort-arrow">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={`fm-list-row ${selectedId === item.id ? 'selected' : ''}`}
              onClick={() => onItemClick(item)}
              onContextMenu={(e) => onItemContextMenu(e, item)}
            >
              <td className="fm-list-td name">
                <span className="fm-list-icon">
                  {item.type === 'folder' ? '📁' : getFileIcon(item.fileType)}
                </span>
                <span className="fm-list-name">{item.name}</span>
              </td>
              <td className="fm-list-td type">
                {item.type === 'folder' ? '文件夹' : (item.fileType || '文件').toUpperCase()}
              </td>
              <td className="fm-list-td size">
                {item.type === 'folder' ? '-' : formatFileSize(item.size)}
              </td>
              <td className="fm-list-td date">
                {formatDate(item.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function FileList({
  viewMode,
  items,
  onItemClick,
  onItemContextMenu,
  selectedId,
  sortBy,
  sortOrder,
  onSort,
}) {
  return viewMode === 'grid' ? (
    <GridView
      items={items}
      onItemClick={onItemClick}
      onItemContextMenu={onItemContextMenu}
      selectedId={selectedId}
    />
  ) : (
    <ListView
      items={items}
      onItemClick={onItemClick}
      onItemContextMenu={onItemContextMenu}
      selectedId={selectedId}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
    />
  )
}
