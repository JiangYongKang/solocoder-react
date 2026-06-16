import { useState, useEffect, useMemo, useCallback } from 'react';
import RouteMapCanvas from './RouteMapCanvas.jsx';
import WaypointList from './WaypointList.jsx';
import RouteComparisonTable from './RouteComparisonTable.jsx';
import FavoritesPanel from './FavoritesPanel.jsx';
import {
  TRAVEL_MODES,
  DEFAULT_ZOOM,
  DEFAULT_CENTER,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_WAYPOINTS,
  WALK_MAX_DISTANCE_KM,
} from './constants.js';
import {
  generateId,
  clampZoom,
  calculateRoutes,
  addWaypoint,
  updateWaypoint,
  removeWaypoint,
  reorderWaypoints,
  moveWaypointUp,
  moveWaypointDown,
  calculateTotalKm,
  validateWaypoints,
  isWalkRecommended,
  generateRouteText,
  exportRouteToJSON,
  downloadJSON,
  copyToClipboard,
  createFavorite,
  loadFavorites,
  saveFavorites,
  addFavorite as addFav,
  removeFavorite,
  renameFavorite as renameFav,
  formatDistance,
  formatTime,
  formatCost,
  calculateTimeMinutes,
  calculateCost,
  loadLastState,
  saveLastState,
} from './routeUtils.js';
import './route-planner.css';

export default function RoutePlannerPage() {
  const [waypoints, setWaypoints] = useState(() => {
    const saved = loadLastState();
    if (saved && Array.isArray(saved.waypoints)) {
      return saved.waypoints;
    }
    return DEFAULT_WAYPOINTS.map((w) => ({ ...w, id: generateId() }));
  });
  const [selectedWaypointId, setSelectedWaypointId] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [travelMode, setTravelMode] = useState(() => {
    const saved = loadLastState();
    return saved?.travelMode || 'car';
  });
  const [center, setCenter] = useState(() => {
    const saved = loadLastState();
    return saved?.center || DEFAULT_CENTER;
  });
  const [zoom, setZoom] = useState(() => {
    const saved = loadLastState();
    return clampZoom(saved?.zoom || DEFAULT_ZOOM);
  });
  const [favorites, setFavorites] = useState(() => loadFavorites());
  const [toastMessage, setToastMessage] = useState(null);
  const [showFavorites, setShowFavorites] = useState(true);

  const totalKm = useMemo(() => calculateTotalKm(waypoints), [waypoints]);
  const totalTime = useMemo(
    () => calculateTimeMinutes(totalKm, travelMode),
    [totalKm, travelMode]
  );
  const totalCost = useMemo(
    () => calculateCost(totalKm, travelMode),
    [totalKm, travelMode]
  );

  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) || null,
    [routes, selectedRouteId]
  );

  const showWalkWarning = travelMode === 'walk' && !isWalkRecommended(totalKm);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    saveLastState({ waypoints, travelMode, center, zoom });
  }, [waypoints, travelMode, center, zoom]);

  const handleCanvasClick = useCallback((world) => {
    setWaypoints((prev) => {
      const count = prev.length;
      if (count < 2) return prev;
      return addWaypoint(prev, { x: world.x, y: world.y }, count - 2);
    });
  }, []);

  const handleAddWaypoint = useCallback(() => {
    if (waypoints.length >= 2) {
      const idx = waypoints.length - 1;
      const prev = waypoints[waypoints.length - 2] || waypoints[0];
      const next = waypoints[waypoints.length - 1];
      const midX = (prev.x + next.x) / 2;
      const midY = (prev.y + next.y) / 2;
      setWaypoints((prevWps) =>
        addWaypoint(prevWps, { x: midX, y: midY }, idx - 1)
      );
    }
  }, [waypoints]);

  const handleWaypointUpdate = useCallback((id, updates) => {
    setWaypoints((prev) => updateWaypoint(prev, id, updates));
    setRoutes([]);
    setSelectedRouteId(null);
  }, []);

  const handleWaypointRemove = useCallback((id) => {
    setWaypoints((prev) => removeWaypoint(prev, id));
    setSelectedWaypointId(null);
    setRoutes([]);
    setSelectedRouteId(null);
  }, []);

  const handleWaypointReorder = useCallback((prevWps, from, to) => {
    setWaypoints(reorderWaypoints(prevWps, from, to));
    setRoutes([]);
    setSelectedRouteId(null);
  }, []);

  const handleWaypointMoveUp = useCallback((idx) => {
    setWaypoints((prev) => moveWaypointUp(prev, idx));
    setRoutes([]);
    setSelectedRouteId(null);
  }, []);

  const handleWaypointMoveDown = useCallback((idx) => {
    setWaypoints((prev) => moveWaypointDown(prev, idx));
    setRoutes([]);
    setSelectedRouteId(null);
  }, []);

  const handleWaypointDragEnd = useCallback((updated) => {
    setWaypoints(updated);
    setRoutes([]);
    setSelectedRouteId(null);
  }, []);

  const handleCalculateRoutes = useCallback(() => {
    const validation = validateWaypoints(waypoints);
    if (!validation.valid) {
      showToast('请确保至少设置起点和终点');
      return;
    }
    if (travelMode === 'walk' && !isWalkRecommended(calculateTotalKm(waypoints))) {
      if (!confirm(`步行距离超过 ${WALK_MAX_DISTANCE_KM} 公里，建议选择其他交通方式？`)) {
        // 用户取消就继续计算
      }
    }
    const newRoutes = calculateRoutes(waypoints, travelMode);
    setRoutes(newRoutes);
    if (newRoutes.length > 0) {
      setSelectedRouteId(newRoutes[0].id);
      showToast('路线计算完成');
    }
  }, [waypoints, travelMode, showToast]);

  const handleTravelModeChange = useCallback((mode) => {
    setTravelMode(mode);
    setRoutes([]);
    setSelectedRouteId(null);
  }, []);

  const handleRouteSelect = useCallback((routeId) => {
    setSelectedRouteId(routeId);
  }, []);

  const handleExportJSON = useCallback(() => {
    if (!selectedRoute) {
      showToast('请先选择一条路线');
      return;
    }
    const json = exportRouteToJSON(selectedRoute);
    const filename = `route_${selectedRoute.type}_${Date.now()}.json`;
    const ok = downloadJSON(json, filename);
    showToast(ok ? '已导出 JSON 文件' : '导出失败');
  }, [selectedRoute, showToast]);

  const handleCopyText = useCallback(async () => {
    if (!selectedRoute) {
      showToast('请先选择一条路线');
      return;
    }
    const text = generateRouteText(selectedRoute);
    const ok = await copyToClipboard(text);
    showToast(ok ? '路线指引已复制到剪贴板' : '复制失败');
  }, [selectedRoute, showToast]);

  const handleSaveFavorite = useCallback(() => {
    const validation = validateWaypoints(waypoints);
    if (!validation.valid) {
      showToast('请设置至少设置起点和终点');
      return;
    }
    const fav = createFavorite({
      name: `${waypoints[0]?.name || '起点'} - ${waypoints[waypoints.length - 1]?.name || '终点'} 路线`,
      waypoints,
      travelMode,
      distanceKm: totalKm,
      timeMinutes: totalTime,
      cost: totalCost,
      selectedRouteType: selectedRoute?.type,
    });
    setFavorites((prev) => addFav(prev, fav));
    showToast('已收藏路线');
  }, [waypoints, travelMode, totalKm, totalTime, totalCost, selectedRoute, showToast]);

  const handleFavoriteSelect = useCallback((fav) => {
    if (!fav || !Array.isArray(fav.waypoints)) {
      return;
    }
    setWaypoints(fav.waypoints.map((w) => ({ ...w })));
    setTravelMode(fav.travelMode || 'car');
    setRoutes([]);
    setSelectedRouteId(null);
    showToast(`已加载：${fav.name}`);
  }, [showToast]);

  const handleFavoriteRemove = useCallback((favId) => {
    if (confirm('确定删除此收藏？')) {
      setFavorites((prev) => removeFavorite(prev, favId));
      showToast('已删除收藏');
    }
  }, [showToast]);

  const handleFavoriteRename = useCallback((favId, newName) => {
    setFavorites((prev) => renameFav(prev, favId, newName));
  }, []);

  const handleResetMap = useCallback(() => {
    if (confirm('确定重置地图和路线？')) {
      setWaypoints(DEFAULT_WAYPOINTS.map((w) => ({ ...w, id: generateId() })));
      setSelectedWaypointId(null);
      setRoutes([]);
      setSelectedRouteId(null);
      setTravelMode('car');
      setCenter(DEFAULT_CENTER);
      setZoom(DEFAULT_ZOOM);
      showToast('已重置');
    }
  }, [showToast]);

  const handleZoomIn = () => setZoom((z) => clampZoom(z + 0.2));
  const handleZoomOut = () => setZoom((z) => clampZoom(z - 0.2));
  const handleResetView = () => {
    setCenter(DEFAULT_CENTER);
    setZoom(DEFAULT_ZOOM);
  };

  return (
    <div className="route-planner-page">
      <header className="rp-header">
        <h1 className="rp-title">🗺️ 路线规划编辑器</h1>
        <div className="rp-header-actions">
          <button className="rp-btn secondary" onClick={handleResetMap}>
            🔄 重置</button>
        </div>
      </header>

      <div className="rp-main-layout">
        <aside className={`rp-sidebar ${showFavorites ? 'expanded' : 'collapsed'}`}>
          <div className="rp-sidebar-toggle" onClick={() => setShowFavorites(!showFavorites)}>
            {showFavorites ? '◀ 收起收藏' : '▶ 展开收藏'}
          </div>
          {showFavorites && (
            <FavoritesPanel
              favorites={favorites}
              onFavoriteSelect={handleFavoriteSelect}
              onFavoriteRemove={handleFavoriteRemove}
              onFavoriteRename={handleFavoriteRename}
            />
          )}
        </aside>

        <main className="rp-center">
          <div className="rp-map-section">
            <div className="rp-map-toolbar">
              <div className="rp-travel-modes">
              {Object.values(TRAVEL_MODES).map((mode) => (
                <button
                  key={mode.key}
                  className={`rp-mode-btn ${travelMode === mode.key ? 'active' : ''}`}
                  onClick={() => handleTravelModeChange(mode.key)}
                  title={mode.name}
                >
                  <span className="mode-icon">{mode.icon}</span>
                  <span className="mode-name">{mode.name}</span>
                </button>
              ))}
              </div>
              <div className="rp-map-controls">
                <button className="rp-zoom-btn" onClick={handleZoomIn} title="放大">＋</button>
                <div className="rp-zoom-level">{Math.round(zoom * 100)}%</div>
                <button className="rp-zoom-btn" onClick={handleZoomOut} title="缩小">－</button>
                <button className="rp-zoom-btn" onClick={handleResetView} title="重置视图">⌂</button>
              </div>
            </div>

            {showWalkWarning && (
              <div className="rp-warning-banner">
                ⚠️ 步行距离超过 {WALK_MAX_DISTANCE_KM} 公里，不建议步行
              </div>
            )}

            <RouteMapCanvas
              waypoints={waypoints}
              selectedWaypointId={selectedWaypointId}
              routes={routes}
              selectedRouteId={selectedRouteId}
              travelMode={travelMode}
              center={center}
              zoom={zoom}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onCenterChange={setCenter}
              onZoomChange={setZoom}
              onCanvasClick={handleCanvasClick}
              onWaypointSelect={setSelectedWaypointId}
              onWaypointDragEnd={handleWaypointDragEnd}
            />

            <div className="rp-route-summary">
              <div className="summary-item">
                <span className="summary-label">总距离</span>
                <span className="summary-value">{formatDistance(totalKm)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">预计时间</span>
                <span className="summary-value">{formatTime(totalTime)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">预估费用</span>
                <span className="summary-value">{formatCost(totalCost)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">途经点数</span>
                <span className="summary-value">{waypoints.length}</span>
              </div>
              </div>
          </div>

          <RouteComparisonTable
            routes={routes}
            selectedRouteId={selectedRouteId}
            onRouteSelect={handleRouteSelect}
          />
        </main>

        <aside className="rp-right-panel">
          <WaypointList
            waypoints={waypoints}
            selectedWaypointId={selectedWaypointId}
            onWaypointSelect={setSelectedWaypointId}
            onWaypointUpdate={handleWaypointUpdate}
            onWaypointRemove={handleWaypointRemove}
            onWaypointReorder={handleWaypointReorder}
            onWaypointMoveUp={handleWaypointMoveUp}
            onWaypointMoveDown={handleWaypointMoveDown}
            onAddWaypoint={handleAddWaypoint}
          />

          <div className="rp-action-buttons">
            <button
              className="rp-btn primary" onClick={handleCalculateRoutes}>
              🧭 计算路线
            </button>
            <button
              className="rp-btn"
              onClick={handleSaveFavorite}>
              ⭐ 收藏路线
            </button>
            <div className="rp-export-group">
              <button
                className="rp-btn"
                onClick={handleExportJSON}
                disabled={!selectedRoute}>
                📤 导出 JSON
              </button>
              <button
                className="rp-btn"
                onClick={handleCopyText}
                disabled={!selectedRoute}>
                📋 复制路线文本
              </button>
            </div>
          </div>

            {selectedRoute && (
              <div className="rp-route-detail">
                <h4>路线指引</h4>
                <pre className="rp-route-text">
                  {generateRouteText(selectedRoute)}
                </pre>
              </div>
            )}
        </aside>
      </div>

      {toastMessage && (
        <div className="rp-toast">{toastMessage}</div>
      )}
    </div>
  );
}
