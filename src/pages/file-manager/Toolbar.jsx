function IconBtn({ label, onClick, children, title, disabled }) {
  return (
    <button
      type="button"
      className="fm-toolbar-btn"
      onClick={onClick}
      title={title || label}
      aria-label={label}
      disabled={disabled}
    >
      {children}
      <span className="fm-toolbar-btn-label">{label}</span>
    </button>
  )
}

export default function Toolbar({
  viewMode,
  setViewMode,
  sortBy,
  sortOrder,
  onSort,
  onCreateFolder,
  onCreateFile,
  onToggleSidebar,
}) {
  return (
    <div className="fm-toolbar">
      <div className="fm-toolbar-left">
        <button
          type="button"
          className="fm-toolbar-icon-btn fm-sidebar-open-btn"
          onClick={onToggleSidebar}
          title="显示目录树"
          aria-label="显示目录树"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <IconBtn label="新建文件夹" onClick={onCreateFolder} title="新建文件夹">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </IconBtn>
        <IconBtn label="新建文件" onClick={onCreateFile} title="新建文件">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </IconBtn>
      </div>
      <div className="fm-toolbar-right">
        <div className="fm-sort-group">
          <span className="fm-sort-label">排序：</span>
          {[
            { key: 'name', label: '名称' },
            { key: 'type', label: '类型' },
            { key: 'size', label: '大小' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`fm-sort-btn ${sortBy === opt.key ? 'active' : ''}`}
              onClick={() => onSort(opt.key)}
              title={`按${opt.label}${sortBy === opt.key ? (sortOrder === 'asc' ? '降序' : '升序') : '升序'}`}
            >
              {opt.label}
              {sortBy === opt.key && (
                <span className="fm-sort-arrow">{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>
        <div className="fm-view-toggle" role="tablist" aria-label="视图切换">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'grid'}
            className={`fm-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="网格视图"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'list'}
            className={`fm-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="列表视图"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
