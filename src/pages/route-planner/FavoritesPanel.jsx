import { useState } from 'react';
import { TRAVEL_MODES } from './constants.js';
import {
  formatDateTime,
  getFavoriteSummary,
  formatDistance,
  searchFavorites,
  sortFavorites,
} from './routeUtils.js';

export default function FavoritesPanel({
  favorites,
  onFavoriteSelect,
  onFavoriteRemove,
  onFavoriteRename,
}) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('time');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const filtered = sortFavorites(
    searchFavorites(favorites, searchKeyword),
    sortBy
  );

  const startEdit = (favorite) => {
    setEditingId(favorite.id);
    setEditingName(favorite.name);
  };

  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      onFavoriteRename && onFavoriteRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="favorites-panel">
      <div className="favorites-header">
        <h3>收藏路线 ({favorites.length})</h3>
      </div>

      <div className="favorites-toolbar">
        <input
          type="text"
          className="favorites-search"
          placeholder="搜索路线..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <select
          className="favorites-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="time">按时间</option>
          <option value="name">按名称</option>
          <option value="distance">按距离</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="favorites-empty">
          <div className="empty-icon">⭐</div>
          <p>{searchKeyword ? '没有匹配的路线' : '暂无收藏路线'}</p>
          <p className="empty-hint">点击「收藏路线」保存当前方案</p>
        </div>
      ) : (
        <div className="favorites-list">
          {filtered.map((fav) => {
            const mode = TRAVEL_MODES[fav.travelMode];
            const isEditing = editingId === fav.id;
            return (
              <div
                key={fav.id}
                className="favorite-item"
                onClick={() => !isEditing && onFavoriteSelect && onFavoriteSelect(fav)}
              >
                <div className="favorite-header">
                  {isEditing ? (
                    <input
                      type="text"
                      className="favorite-name-edit"
                      value={editingName}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="favorite-name" title={fav.name}>
                      {fav.name}
                    </span>
                  )}
                  <span className="favorite-mode-icon" title={mode?.name}>
                    {mode?.icon || '🚗'}
                  </span>
                </div>
                <div className="favorite-summary">{getFavoriteSummary(fav)}</div>
                {fav.distanceKm > 0 && (
                  <div className="favorite-meta">
                    <span>{formatDistance(fav.distanceKm)}</span>
                  </div>
                )}
                <div className="favorite-time">{formatDateTime(fav.createdAt)}</div>
                <div className="favorite-actions" onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <>
                      <button
                        className="fav-action-btn confirm"
                        onClick={saveEdit}
                        title="保存"
                      >
                        ✓
                      </button>
                      <button
                        className="fav-action-btn cancel"
                        onClick={cancelEdit}
                        title="取消"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="fav-action-btn edit"
                        onClick={() => startEdit(fav)}
                        title="重命名"
                      >
                        ✎
                      </button>
                      <button
                        className="fav-action-btn delete"
                        onClick={() => onFavoriteRemove && onFavoriteRemove(fav.id)}
                        title="删除"
                      >
                        🗑
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
