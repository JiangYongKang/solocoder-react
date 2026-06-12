import { useMemo, useState } from 'react';
import {
  searchFavorites,
  sortFavorites,
  formatDistance,
  formatDateTime,
} from './routeUtils.js';
import { SORT_OPTIONS } from './constants.js';

function FavoritesPanel({
  favorites,
  searchKeyword,
  onSearchChange,
  sortKey,
  onSortChange,
  onLoad,
  onDelete,
  onShare,
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const displayed = useMemo(() => {
    const searched = searchFavorites(favorites, searchKeyword);
    return sortFavorites(searched, sortKey);
  }, [favorites, searchKeyword, sortKey]);

  return (
    <div className="favorites-section">
      <div className="section-header">
        <h3 className="section-title">
          收藏路线 <span className="count-badge">{favorites.length}</span>
        </h3>
      </div>

      <div className="favorites-toolbar">
        <div className="search-input-wrap">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l3 3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="搜索路线名称..."
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select
          className="sort-select"
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value)}
        >
          {Object.values(SORT_OPTIONS).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="favorites-list-scroll">
        {displayed.length === 0 ? (
          <div className="empty-favorites">
            <div className="empty-icon">🗺️</div>
            <div className="empty-title">
              {searchKeyword ? '未找到匹配的路线' : '暂无收藏路线'}
            </div>
            <div className="empty-desc">
              {searchKeyword ? '请尝试其他关键词' : '编辑路线后点击"收藏"按钮保存'}
            </div>
          </div>
        ) : (
          <div className="favorites-list">
            {displayed.map((f) => (
              <div key={f.id} className="favorite-card">
                <div className="favorite-card-head">
                  <div className="favorite-name" title={f.name}>{f.name}</div>
                  {confirmDeleteId === f.id ? (
                    <div className="delete-confirm">
                      <button
                        className="confirm-btn confirm-ok"
                        onClick={() => {
                          onDelete(f.id);
                          setConfirmDeleteId(null);
                        }}
                      >确定</button>
                      <button
                        className="confirm-btn confirm-cancel"
                        onClick={() => setConfirmDeleteId(null)}
                      >取消</button>
                    </div>
                  ) : (
                    <button
                      className="card-icon-btn"
                      title="删除"
                      onClick={() => setConfirmDeleteId(f.id)}
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <div className="favorite-meta">
                  <span className="meta-item">📏 {formatDistance(f.distance)}</span>
                  <span className="meta-item">📍 {f.waypointCount || 0} 途经</span>
                </div>
                <div className="favorite-time">⏱️ {formatDateTime(f.createdAt)}</div>
                <div className="favorite-actions">
                  <button className="action-btn action-load" onClick={() => onLoad(f)}>
                    加载
                  </button>
                  <button className="action-btn action-share" onClick={() => onShare(f)}>
                    分享
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoritesPanel;
