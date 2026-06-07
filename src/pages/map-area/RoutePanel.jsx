import { findMarkerById, calculateRouteDistance } from './mapUtils.js';

function RoutePanel({ selectedIds, markers, routePoints, onClear, onSwap }) {
  if (selectedIds.length === 0) return null;

  const startMarker = selectedIds[0] ? findMarkerById(markers, selectedIds[0]) : null;
  const endMarker = selectedIds[1] ? findMarkerById(markers, selectedIds[1]) : null;
  const distance = routePoints.length > 0 ? calculateRouteDistance(routePoints) : 0;

  return (
    <div className="route-panel">
      <div className="route-panel-header">
        <h4>路线规划</h4>
        <button className="marker-info-close" onClick={onClear}>×</button>
      </div>
      <div className="route-panel-body">
        <div className="route-point">
          <span className="route-point-icon route-start">起</span>
          <span className="route-point-name">
            {startMarker ? startMarker.name : '请选择起点'}
          </span>
        </div>
        <div className="route-point-divider" />
        <div className="route-point">
          <span className="route-point-icon route-end">终</span>
          <span className="route-point-name">
            {endMarker ? endMarker.name : '请选择终点'}
          </span>
        </div>
        {routePoints.length > 0 && (
          <div className="route-distance">
            <span>路径长度：</span>
            <code>{distance.toFixed(1)} 单位</code>
          </div>
        )}
      </div>
      {startMarker && endMarker && (
        <div className="route-panel-footer">
          <button className="map-btn" onClick={onSwap}>交换起终点</button>
          <button className="map-btn" onClick={onClear}>清除路线</button>
        </div>
      )}
      {!endMarker && startMarker && (
        <div className="route-hint">
          请点击地图上另一个标记点作为终点
        </div>
      )}
    </div>
  );
}

export default RoutePanel;
