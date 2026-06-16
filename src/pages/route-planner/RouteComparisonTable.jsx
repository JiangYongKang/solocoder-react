import { formatDistance, formatTime, formatCost } from './routeUtils.js';

export default function RouteComparisonTable({
  routes,
  selectedRouteId,
  onRouteSelect,
}) {
  if (!Array.isArray(routes) || routes.length === 0) {
    return (
      <div className="route-comparison-empty">
        <div className="empty-icon">🛣️</div>
        <p>点击「计算路线」生成路线方案</p>
      </div>
    );
  }

  return (
    <div className="route-comparison-table">
      <h3>路线方案对比</h3>
      <table>
        <thead>
          <tr>
            <th>路线</th>
            <th>距离</th>
            <th>时间</th>
            <th>费用</th>
            <th>途经点</th>
            {routes.some((r) => r.transfers) && <th>换乘</th>}
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr
              key={route.id}
              className={route.id === selectedRouteId ? 'selected' : ''}
              onClick={() => onRouteSelect && onRouteSelect(route.id)}
            >
              <td>
                <div className="route-name-cell">
                  <span
                    className="route-color-dot"
                    style={{ backgroundColor: route.color }}
                  />
                  <span className="route-name">{route.name}</span>
                  {route.type === 'recommended' && (
                    <span className="route-badge">推荐</span>
                  )}
                </div>
              </td>
              <td className="route-distance">{formatDistance(route.distanceKm)}</td>
              <td className="route-time">{formatTime(route.timeMinutes)}</td>
              <td className="route-cost">{formatCost(route.cost)}</td>
              <td className="route-waypoints">{route.waypointCount}</td>
              {routes.some((r) => r.transfers) && (
                <td className="route-transfers">
                  {route.transfers ? `${route.transfers} 次` : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
