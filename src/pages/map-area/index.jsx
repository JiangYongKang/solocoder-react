import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MapCanvas from './MapCanvas.jsx';
import SearchBar from './SearchBar.jsx';
import MarkerInfoCard from './MarkerInfoCard.jsx';
import AddMarkerModal from './AddMarkerModal.jsx';
import RoutePanel from './RoutePanel.jsx';
import {
  loadMarkers,
  saveMarkers,
  addMarker,
  updateMarker,
  deleteMarker,
  findMarkerById,
  clusterMarkers,
  splitCluster,
  generateRoute,
  clampZoom,
  searchPresets,
  generateId,
} from './mapUtils.js';
import { DEFAULT_CENTER, DEFAULT_ZOOM, ZOOM_STEP } from './constants.js';
import './map-area.css';

function MapAreaPage() {
  const [markers, setMarkers] = useState(() => loadMarkers());
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [selectedRouteIds, setSelectedRouteIds] = useState([]);
  const [routePoints, setRoutePoints] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingPosition, setPendingPosition] = useState(null);
  const [routePlanningMode, setRoutePlanningMode] = useState(false);
  const [searchNoResult, setSearchNoResult] = useState(false);

  useEffect(() => {
    saveMarkers(markers);
  }, [markers]);

  const clusters = useMemo(() => clusterMarkers(markers, zoom), [markers, zoom]);

  const selectedMarker = useMemo(
    () => findMarkerById(markers, selectedMarkerId),
    [markers, selectedMarkerId]
  );

  const handleCanvasClick = useCallback((world) => {
    if (routePlanningMode) return;
    setPendingPosition(world);
    setShowAddModal(true);
    setSelectedMarkerId(null);
  }, [routePlanningMode]);

  const handleMarkerClick = useCallback((marker) => {
    if (routePlanningMode) {
      setSelectedRouteIds((prev) => {
        if (prev.includes(marker.id)) {
          const filtered = prev.filter((id) => id !== marker.id);
          if (filtered.length < 2) setRoutePoints([]);
          return filtered;
        }
        if (prev.length >= 2) {
          return [prev[1], marker.id];
        }
        const newIds = [...prev, marker.id];
        if (newIds.length === 2) {
          const start = findMarkerById(markers, newIds[0]);
          const end = findMarkerById(markers, newIds[1]);
          if (start && end) {
            setRoutePoints(generateRoute(start, end));
          }
        }
        return newIds;
      });
    } else {
      setSelectedMarkerId(marker.id);
    }
  }, [routePlanningMode, markers]);

  const handleClusterClick = useCallback((cluster) => {
    const newMarkers = splitCluster(cluster);
    setMarkers((prev) => {
      const withoutCluster = prev.filter((m) => !cluster.markers.some((cm) => cm.id === m.id));
      return [...withoutCluster, ...newMarkers];
    });
    setCenter({ x: cluster.x, y: cluster.y });
    setZoom((z) => clampZoom(z * 1.5));
  }, []);

  const handleAddMarker = useCallback((data) => {
    const newMarker = { ...data, id: generateId() };
    setMarkers((prev) => addMarker(prev, newMarker));
    setShowAddModal(false);
    setPendingPosition(null);
    setSelectedMarkerId(newMarker.id);
  }, []);

  const handleUpdateMarker = useCallback((updates) => {
    if (!selectedMarkerId) return;
    setMarkers((prev) => updateMarker(prev, selectedMarkerId, updates));
  }, [selectedMarkerId]);

  const handleDeleteMarker = useCallback(() => {
    if (!selectedMarkerId) return;
    setMarkers((prev) => deleteMarker(prev, selectedMarkerId));
    setSelectedMarkerId(null);
    setSelectedRouteIds((prev) => prev.filter((id) => id !== selectedMarkerId));
  }, [selectedMarkerId]);

  const handleSearch = useCallback((keyword, preset, hasPresets) => {
    setSearchNoResult(false);
    if (preset) {
      const x = center.x + (preset.offsetX || 0);
      const y = center.y + (preset.offsetY || 0);
      const newMarker = {
        id: generateId(),
        name: preset.name,
        description: preset.description,
        x,
        y,
      };
      setMarkers((prev) => addMarker(prev, newMarker));
      setCenter({ x, y });
      setSelectedMarkerId(newMarker.id);
    } else {
      const presets = searchPresets(keyword);
      if (presets.length > 0) {
        const p = presets[0];
        const x = center.x + (p.offsetX || 0);
        const y = center.y + (p.offsetY || 0);
        const newMarker = {
          id: generateId(),
          name: p.name,
          description: p.description,
          x,
          y,
        };
        setMarkers((prev) => addMarker(prev, newMarker));
        setCenter({ x, y });
        setSelectedMarkerId(newMarker.id);
      } else {
        if (hasPresets === false) {
          setSearchNoResult(true);
          setTimeout(() => setSearchNoResult(false), 2500);
        }
      }
    }
  }, [center]);

  const handleZoomIn = () => setZoom((z) => clampZoom(z + ZOOM_STEP * 5));
  const handleZoomOut = () => setZoom((z) => clampZoom(z - ZOOM_STEP * 5));
  const handleReset = () => {
    setCenter(DEFAULT_CENTER);
    setZoom(DEFAULT_ZOOM);
  };

  const handleToggleRoute = useCallback(() => {
    if (!routePlanningMode) {
      setRoutePlanningMode(true);
      if (selectedMarkerId) {
        setSelectedRouteIds([selectedMarkerId]);
      }
    } else {
      setRoutePlanningMode(false);
      setSelectedRouteIds([]);
      setRoutePoints([]);
    }
  }, [routePlanningMode, selectedMarkerId]);

  const handleSwapRoute = useCallback(() => {
    setSelectedRouteIds((prev) => {
      if (prev.length !== 2) return prev;
      const swapped = [prev[1], prev[0]];
      const start = findMarkerById(markers, swapped[0]);
      const end = findMarkerById(markers, swapped[1]);
      if (start && end) {
        setRoutePoints(generateRoute(start, end));
      }
      return swapped;
    });
  }, [markers]);

  const handleClearRoute = useCallback(() => {
    setSelectedRouteIds([]);
    setRoutePoints([]);
    setRoutePlanningMode(false);
  }, []);

  return (
    <div className="map-area-page">
      <div className="map-area-header">
        <div className="map-area-header-left">
          <Link to="/" className="map-back-link">← 返回首页</Link>
          <h1 className="map-area-title">交互式地图</h1>
        </div>
        <div className="map-area-header-right">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      <div className="map-area-toolbar">
        <div className="map-zoom-controls">
          <button className="map-btn map-btn-icon" onClick={handleZoomIn} title="放大">+</button>
          <button className="map-btn map-btn-icon" onClick={handleZoomOut} title="缩小">−</button>
          <button className="map-btn" onClick={handleReset} title="重置">重置</button>
        </div>
        <div className="map-zoom-info">
          缩放: {(zoom * 100).toFixed(0)}%
        </div>
        <button
          className={`map-btn ${routePlanningMode ? 'map-btn-primary' : ''}`}
          onClick={handleToggleRoute}
        >
          {routePlanningMode ? '取消路线' : '路线规划'}
        </button>
      </div>

      <div className="map-canvas-container">
        {searchNoResult && (
          <div className="map-toast">未找到匹配的地点，请尝试其他关键字</div>
        )}
        <MapCanvas
          center={center}
          zoom={zoom}
          onCenterChange={setCenter}
          onZoomChange={setZoom}
          onCanvasClick={handleCanvasClick}
          clusters={clusters}
          onMarkerClick={handleMarkerClick}
          onClusterClick={handleClusterClick}
          selectedMarkerId={selectedMarkerId}
          routePoints={routePoints}
          selectedRouteIds={selectedRouteIds}
        />

        {selectedMarker && !routePlanningMode && (
          <MarkerInfoCard
            marker={selectedMarker}
            onClose={() => setSelectedMarkerId(null)}
            onEdit={handleUpdateMarker}
            onDelete={handleDeleteMarker}
            onToggleRoute={handleToggleRoute}
          />
        )}

        {(routePlanningMode || selectedRouteIds.length > 0) && (
          <RoutePanel
            selectedIds={selectedRouteIds}
            markers={markers}
            routePoints={routePoints}
            onClear={handleClearRoute}
            onSwap={handleSwapRoute}
          />
        )}

        {routePlanningMode && (
          <div className="map-mode-banner">
            路线规划模式：点击标记点选择起点和终点
          </div>
        )}
      </div>

      {showAddModal && pendingPosition && (
        <AddMarkerModal
          key={`${pendingPosition.x.toFixed(2)}-${pendingPosition.y.toFixed(2)}`}
          position={pendingPosition}
          onClose={() => {
            setShowAddModal(false);
            setPendingPosition(null);
          }}
          onSave={handleAddMarker}
        />
      )}
    </div>
  );
}

export default MapAreaPage;
