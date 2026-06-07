const TYPE_LABELS = {
  image: '图片',
  video: '视频',
  audio: '音频',
  document: '文档',
  other: '其他',
}

export default function FilterBar({
  allTags,
  allTypes,
  allDates,
  selectedTags,
  selectedTypes,
  selectedDates,
  searchTerm,
  favoriteOnly,
  sortBy,
  sortOrder,
  selectMode,
  selectedCount,
  totalCount,
  onToggleTag,
  onToggleType,
  onToggleDate,
  onSearchChange,
  onToggleFavoriteOnly,
  onSortChange,
  onSortOrderToggle,
  onToggleSelectMode,
  onSelectAll,
  onClearSelection,
  onBatchFavorite,
  onBatchUnfavorite,
  onBatchDelete,
  onUpload,
  onBack,
}) {
  const toggleInArray = (arr, value, setter) => {
    if (arr.includes(value)) {
      setter(arr.filter((v) => v !== value))
    } else {
      setter([...arr, value])
    }
  }

  return (
    <div className="mg-filterbar">
      <div className="mg-filterbar-top">
        <div className="mg-filterbar-left">
          <button type="button" className="mg-back-btn" onClick={onBack} aria-label="返回首页">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>返回</span>
          </button>
          <h1 className="mg-title">媒体资源库</h1>
          <span className="mg-count">共 {totalCount} 项</span>
        </div>

        <div className="mg-filterbar-right">
          <div className="mg-search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="搜索文件名或标签..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={`mg-fav-filter ${favoriteOnly ? 'mg-fav-filter-active' : ''}`}
            onClick={onToggleFavoriteOnly}
            title={favoriteOnly ? '显示全部' : '只显示收藏'}
            aria-label={favoriteOnly ? '显示全部' : '只显示收藏'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={favoriteOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>

          <button
            type="button"
            className={`mg-btn ${selectMode ? 'mg-btn-primary' : ''}`}
            onClick={onToggleSelectMode}
          >
            {selectMode ? `取消选择 (${selectedCount})` : '多选'}
          </button>

          <button type="button" className="mg-btn mg-btn-primary" onClick={onUpload}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>上传</span>
          </button>
        </div>
      </div>

      <div className="mg-filterbar-bottom">
        <div className="mg-filter-row">
          <span className="mg-filter-label">类型：</span>
          <div className="mg-filter-chips">
            {allTypes.length === 0 && <span className="mg-filter-empty">暂无</span>}
            {allTypes.map((t) => (
              <button
                key={t}
                type="button"
                className={`mg-chip ${selectedTypes.includes(t) ? 'mg-chip-active' : ''}`}
                onClick={() => toggleInArray(selectedTypes, t, onToggleType)}
              >
                {TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>
        </div>

        <div className="mg-filter-row">
          <span className="mg-filter-label">标签：</span>
          <div className="mg-filter-chips">
            {allTags.length === 0 && <span className="mg-filter-empty">暂无</span>}
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`mg-chip ${selectedTags.includes(tag) ? 'mg-chip-active' : ''}`}
                onClick={() => toggleInArray(selectedTags, tag, onToggleTag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="mg-filter-row">
          <span className="mg-filter-label">日期：</span>
          <div className="mg-filter-chips">
            {allDates.length === 0 && <span className="mg-filter-empty">暂无</span>}
            {allDates.slice(0, 10).map((d) => (
              <button
                key={d}
                type="button"
                className={`mg-chip ${selectedDates.includes(d) ? 'mg-chip-active' : ''}`}
                onClick={() => toggleInArray(selectedDates, d, onToggleDate)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="mg-filter-row mg-filter-row-right">
          {selectMode && (
            <div className="mg-batch-actions">
              <button type="button" className="mg-btn mg-btn-sm" onClick={onSelectAll}>
                全选
              </button>
              <button type="button" className="mg-btn mg-btn-sm" onClick={onClearSelection}>
                清除
              </button>
              <button
                type="button"
                className="mg-btn mg-btn-sm"
                onClick={onBatchFavorite}
                disabled={selectedCount === 0}
              >
                收藏
              </button>
              <button
                type="button"
                className="mg-btn mg-btn-sm"
                onClick={onBatchUnfavorite}
                disabled={selectedCount === 0}
              >
                取消收藏
              </button>
              <button
                type="button"
                className="mg-btn mg-btn-sm mg-btn-danger"
                onClick={onBatchDelete}
                disabled={selectedCount === 0}
              >
                删除
              </button>
            </div>
          )}

          {!selectMode && (
            <div className="mg-sort-box">
              <span className="mg-filter-label">排序：</span>
              <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
                <option value="date">日期</option>
                <option value="name">名称</option>
                <option value="size">大小</option>
              </select>
              <button type="button" className="mg-sort-order-btn" onClick={onSortOrderToggle} title={sortOrder === 'desc' ? '降序' : '升序'}>
                {sortOrder === 'desc' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
