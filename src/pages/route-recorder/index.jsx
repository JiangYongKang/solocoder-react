import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import RouteMapCanvas from './RouteMapCanvas.jsx';
import ElevationChart from './ElevationChart.jsx';
import WaypointList from './WaypointList.jsx';
import FavoritesPanel from './FavoritesPanel.jsx';
import {
  clampZoom,
  calculateKilometers,
  calculateTimeHours,
  formatDistance,
  formatTime,
  generateElevation,
  loadFavorites,
  saveFavorites,
  addFavorite,
  removeFavorite,
  createFavorite,
  canAddWaypoint,
  addWaypoint,
  removeWaypoint,
  reorderWaypoints,
  generateShareText,
  generateId,
} from './routeUtils.js';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  ZOOM_STEP,
  TRAVEL_MODES,
  SORT_OPTIONS,
} from './constants.js';
import './route-recorder.css';

function Toast({ message, type }) {
  if (!message) return null;
  return <div className={`toast ${type === 'error' ? 'error' : ''}`}>{message}</div>;
}

function SaveFavoriteModal({ onClose, onSave }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSave(trimmed);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h3>收藏路线</h3>
            <button type="button" className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>路线名称</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入路线名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={50}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="route-btn" onClick={onClose}>取消</button>
            <button type="submit" className="route-btn route-btn-primary" disabled={!name.trim()}>
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RouteRecorderPage() {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [travelMode, setTravelMode] = useState('walk');
  const [favorites, setFavorites] = useState(() => loadFavorites());
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortKey, setSortKey] = useState(SORT_OPTIONS.time.value);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [startCoordInput, setStartCoordInput] = useState('');
  const [endCoordInput, setEndCoordInput] = useState('');

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 2200);
  }, []);

  const distanceKm = useMemo(
    () => calculateKilometers(start, waypoints, end),
    [start, waypoints, end]
  );

  const timeHours = useMemo(
    () => calculateTimeHours(distanceKm, travelMode),
    [distanceKm, travelMode]
  );

  const elevationData = useMemo(
    () => generateElevation(start, waypoints, end),
    [start, waypoints, end]
  );

  const handleCanvasClick = useCallback((world) => {
    if (!start) {
      setStart({ id: generateId(), x: world.x, y: world.y });
      showToast('已设置起点');
    } else if (!end) {
      setEnd({ id: generateId(), x: world.x, y: world.y });
      showToast('已设置终点');
    } else {
      if (canAddWaypoint(waypoints)) {
        setWaypoints((prev) => addWaypoint(prev, { x: world.x, y: world.y }));
        showToast(`已添加途经点 ${waypoints.length + 1}`);
      } else {
        showToast('途经点已达上限（最多10个）', 'error');
      }
    }
  }, [start, end, waypoints, showToast]);

  const handleMarkerDragStart = useCallback(() => {}, []);

  const handleMarkerDrag = useCallback((marker, world) => {
    if (marker.type === 'start' || (start && marker.id === start.id)) {
      setStart((s) => (s ? { ...s, x: world.x, y: world.y } : s));
    } else if (marker.type === 'end' || (end && marker.id === end.id)) {
      setEnd((e) => (e ? { ...e, x: world.x, y: world.y } : e));
    } else {
      setWaypoints((prev) => prev.map((w) => (w.id === marker.id ? { ...w, x: world.x, y: world.y } : w)));
    }
  }, [start, end]);

  const handleMarkerDragEnd = useCallback((marker, world, didMove) => {
    if (didMove) showToast('标记位置已更新');
    else handleMarkerDrag(marker, world);
  }, [handleMarkerDrag, showToast]);

  const parseCoordStr = (str) => {
    const parts = str.trim().split(/[,，\s]+/).filter(Boolean);
    if (parts.length < 2) return null;
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    if (Number.isNaN(x) || Number.isNaN(y)) return null;
    return { x, y };
  };

  const handleSetStartByCoord = () => {
    const p = parseCoordStr(startCoordInput);
    if (p) {
      setStart({ id: generateId(), x: p.x, y: p.y });
      setStartCoordInput('');
      showToast('起点已更新');
    } else {
      showToast('坐标格式无效，格式：x, y', 'error');
    }
  };

  const handleSetEndByCoord = () => {
    const p = parseCoordStr(endCoordInput);
    if (p) {
      setEnd({ id: generateId(), x: p.x, y: p.y });
      setEndCoordInput('');
      showToast('终点已更新');
    } else {
      showToast('坐标格式无效，格式：x, y', 'error');
    }
  };

  const handleAddWaypointByCoord = (p) => {
    if (canAddWaypoint(waypoints)) {
      setWaypoints((prev) => addWaypoint(prev, p));
      showToast(`已添加途经点 ${waypoints.length + 1}`);
    } else {
      showToast('途经点已达上限（最多10个）', 'error');
    }
  };

  const handleReorderWaypoints = (newArr) => {
    setWaypoints(newArr);
  };

  const handleRemoveWaypoint = (id) => {
    setWaypoints((prev) => removeWaypoint(prev, id));
  };

  const handleReset = () => {
    setStart(null);
    setEnd(null);
    setWaypoints([]);
    setCenter(DEFAULT_CENTER);
    setZoom(DEFAULT_ZOOM);
    showToast('已重置路线');
  };

  const handleZoomIn = () => setZoom((z) => clampZoom(z + ZOOM_STEP * 5));
  const handleZoomOut = () => setZoom((z) => clampZoom(z - ZOOM_STEP * 5));
  const handleCenterReset = () => setCenter(DEFAULT_CENTER);

  const handleAddFavorite = (name) => {
    const fav = createFavorite({
      name,
      start,
      waypoints,
      end,
    });
    setFavorites((prev) => addFavorite(prev, fav));
    setShowSaveModal(false);
    showToast(`已收藏：${name}`);
  };

  const handleLoadFavorite = (fav) => {
    setStart(fav.start ? { ...fav.start, id: generateId() } : null);
    setEnd(fav.end ? { ...fav.end, id: generateId() } : null);
    setWaypoints(
      Array.isArray(fav.waypoints)
        ? fav.waypoints.map((w) => ({ ...w, id: generateId() }))
        : []
    );
    showToast(`已加载路线：${fav.name}`);
  };

  const handleDeleteFavorite = (id) => {
    setFavorites((prev) => removeFavorite(prev, id));
    showToast('收藏已删除');
  };

  const handleShareFavorite = (fav) => {
    const text = generateShareText(fav);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        () => showToast('分享文本已复制到剪贴板'),
        () => {
          fallbackCopy(text);
        }
      );
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(ok ? '分享文本已复制到剪贴板' : '复制失败，请手动复制', ok ? 'success' : 'error');
    } catch {
      showToast('复制失败', 'error');
    }
  };

  const handleShareCurrent = () => {
    if (!start && !end) {
      showToast('请先设置起点或终点', 'error');
      return;
    }
    const fav = createFavorite({
      name: '当前路线',
      start,
      waypoints,
      end,
    });
    handleShareFavorite(fav);
  };

  const canSave = !!(start || end || waypoints.length > 0);

  return (
    <div className="route-recorder-page">
      <div className="route-recorder-header">
        <div className="route-recorder-header-left">
          <Link to="/" className="route-back-link">← 返回首页</Link>
          <h1 className="route-recorder-title">🗺️ 路线记录器</h1>
        </div>
        <div className="route-header-right">
          <button
            className="route-btn route-btn-primary"
            onClick={() => setShowSaveModal(true)}
            disabled={!canSave}
            title="保存当前路线到收藏"
          >
            ⭐ 收藏
          </button>
          <button
            className="route-btn"
            onClick={handleShareCurrent}
            disabled={!canSave}
            title="分享当前路线"
          >
            📤 分享
          </button>
          <button className="route-btn route-btn-danger" onClick={handleReset} title="清除所有标记">
            🗑️ 重置
          </button>
        </div>
      </div>

      <div className="route-main">
        <div className="route-map-area">
          <div className="route-toolbar">
            <div className="route-zoom-controls">
              <button className="route-btn route-btn-icon" onClick={handleZoomIn} title="放大">+</button>
              <button className="route-btn route-btn-icon" onClick={handleZoomOut} title="缩小">−</button>
              <button className="route-btn" onClick={handleCenterReset} title="重置视图">视图</button>
            </div>
            <div className="route-zoom-info">
              缩放 {(zoom * 100).toFixed(0)}%
            </div>
            <div style={{ flex: 1 }} />
            <div className="route-zoom-info">
              {start ? '✅ 已设起点' : '点击地图设置起点'}
              {' · '}
              {end ? '✅ 已设终点' : '再点一次设终点'}
            </div>
          </div>

          <div className="route-map-container">
            <RouteMapCanvas
              center={center}
              zoom={zoom}
              onCenterChange={setCenter}
              onZoomChange={setZoom}
              start={start}
              waypoints={waypoints}
              end={end}
              onCanvasClick={handleCanvasClick}
              onMarkerDragStart={handleMarkerDragStart}
              onMarkerDrag={handleMarkerDrag}
              onMarkerDragEnd={handleMarkerDragEnd}
            />

            {!start && (
              <div className="route-mode-banner">
                💡 首次点击地图 = 起点，第二次 = 终点，之后 = 途经点
              </div>
            )}
          </div>
        </div>

        <aside className="route-sidebar">
          <div className="sidebar-scroll">
            <div className="info-panel">
              <h4 className="info-panel-title">📊 路线信息</h4>
              <div className="info-stats">
                <div className="info-stat">
                  <span className="info-stat-label">总距离</span>
                  <span className="info-stat-value">{formatDistance(distanceKm)}</span>
                </div>
                <div className="info-stat">
                  <span className="info-stat-label">预计时间</span>
                  <span className="info-stat-value">{formatTime(timeHours)}</span>
                </div>
                <div className="info-stat">
                  <span className="info-stat-label">途经点</span>
                  <span className="info-stat-value">{waypoints.length}</span>
                </div>
                <div className="info-stat">
                  <span className="info-stat-label">标记总数</span>
                  <span className="info-stat-value">
                    {(start ? 1 : 0) + (end ? 1 : 0) + waypoints.length}
                  </span>
                </div>
              </div>
              <div className="travel-mode-tabs">
                {Object.entries(TRAVEL_MODES).map(([key, mode]) => (
                  <button
                    key={key}
                    type="button"
                    className={`travel-mode-btn ${travelMode === key ? 'active' : ''}`}
                    onClick={() => setTravelMode(key)}
                    title={`${mode.label} ${mode.speedKmh}km/h`}
                  >
                    <span className="travel-mode-emoji">{mode.emoji}</span>
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="coord-input-section">
              <div className="section-header">
                <h3 className="section-title">📍 坐标输入</h3>
              </div>
              <div className="coord-input-row">
                <input
                  type="text"
                  className="coord-input"
                  placeholder="起点坐标，如：100, 200"
                  value={startCoordInput}
                  onChange={(e) => setStartCoordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSetStartByCoord()}
                />
                <button className="coord-add-btn" onClick={handleSetStartByCoord}>
                  起点
                </button>
              </div>
              <div className="coord-input-row">
                <input
                  type="text"
                  className="coord-input"
                  placeholder="终点坐标，如：500, 400"
                  value={endCoordInput}
                  onChange={(e) => setEndCoordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSetEndByCoord()}
                />
                <button className="coord-add-btn" onClick={handleSetEndByCoord}>
                  终点
                </button>
              </div>
            </div>

            <WaypointList
              waypoints={waypoints}
              onReorder={handleReorderWaypoints}
              onRemove={handleRemoveWaypoint}
              onAddByCoord={handleAddWaypointByCoord}
              canAdd={canAddWaypoint(waypoints)}
            />

            <div className="elevation-section">
              <div className="section-header">
                <h3 className="section-title">📈 海拔剖面</h3>
              </div>
              <ElevationChart elevationData={elevationData} />
            </div>

            <FavoritesPanel
              favorites={favorites}
              searchKeyword={searchKeyword}
              onSearchChange={setSearchKeyword}
              sortKey={sortKey}
              onSortChange={setSortKey}
              onLoad={handleLoadFavorite}
              onDelete={handleDeleteFavorite}
              onShare={handleShareFavorite}
            />
          </div>
        </aside>
      </div>

      {showSaveModal && (
        <SaveFavoriteModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleAddFavorite}
        />
      )}

      <Toast message={toast.msg} type={toast.type} />
    </div>
  );
}

export default RouteRecorderPage;
