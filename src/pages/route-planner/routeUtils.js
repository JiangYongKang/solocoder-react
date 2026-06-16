import {
  TRAVEL_MODES,
  WALK_MAX_DISTANCE_KM,
  PIXELS_PER_KM,
  MIN_ZOOM,
  MAX_ZOOM,
  ROUTE_COLORS,
  ROUTE_TYPES,
  STORAGE_KEY_FAVORITES,
  DEFAULT_WAYPOINTS,
} from './constants.js';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function worldToScreen(worldX, worldY, centerX, centerY, zoom, width, height) {
  const screenX = width / 2 + (worldX - centerX) * zoom;
  const screenY = height / 2 + (worldY - centerY) * zoom;
  return { x: screenX, y: screenY };
}

export function screenToWorld(screenX, screenY, centerX, centerY, zoom, width, height) {
  const worldX = centerX + (screenX - width / 2) / zoom;
  const worldY = centerY + (screenY - height / 2) / zoom;
  return { x: worldX, y: worldY };
}

export function clampZoom(zoom) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

export function getDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function pixelsToKm(pixels) {
  if (typeof pixels !== 'number' || pixels < 0) return 0;
  return pixels / PIXELS_PER_KM;
}

export function kmToPixels(km) {
  if (typeof km !== 'number' || km < 0) return 0;
  return km * PIXELS_PER_KM;
}

export function calculateTotalPixelDistance(waypoints) {
  if (!Array.isArray(waypoints) || waypoints.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += getDistance(waypoints[i - 1], waypoints[i]);
  }
  return total;
}

export function calculateTotalKm(waypoints) {
  return pixelsToKm(calculateTotalPixelDistance(waypoints));
}

export function calculateTimeMinutes(distanceKm, travelMode) {
  if (distanceKm <= 0) return 0;
  const mode = TRAVEL_MODES[travelMode];
  if (!mode || !mode.speedKmh) return 0;
  const hours = distanceKm / mode.speedKmh;
  return hours * 60;
}

export function calculateCost(distanceKm, travelMode) {
  if (distanceKm <= 0) return 0;
  const mode = TRAVEL_MODES[travelMode];
  if (!mode) return 0;
  const baseCost = distanceKm * mode.costPerKm;
  const tollCost = distanceKm * mode.costPerKm * mode.tollFactor;
  return Math.round((baseCost + tollCost) * 100) / 100;
}

export function formatDistance(km) {
  if (km <= 0) return '0 km';
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${km.toFixed(2)} km`;
}

export function formatTime(minutes) {
  if (minutes <= 0) return '0 分钟';
  if (minutes < 60) {
    return `${Math.round(minutes)} 分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hours} 小时`;
  }
  return `${hours} 小时 ${mins} 分钟`;
}

export function formatCost(cost) {
  if (cost <= 0) return '免费';
  return `¥ ${cost.toFixed(2)}`;
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export function addWaypoint(waypoints, position, afterIndex = null) {
  if (!Array.isArray(waypoints)) return waypoints;
  if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
    return waypoints;
  }
  const newWaypoint = {
    id: generateId(),
    name: position.name || `途经点${waypoints.length}`,
    x: position.x,
    y: position.y,
  };
  if (afterIndex === null || afterIndex >= waypoints.length - 1) {
    const result = [...waypoints];
    result.splice(waypoints.length - 1, 0, newWaypoint);
    return result;
  }
  const result = [...waypoints];
  result.splice(afterIndex + 1, 0, newWaypoint);
  return result;
}

export function updateWaypoint(waypoints, waypointId, updates) {
  if (!Array.isArray(waypoints) || !waypointId || !updates) return waypoints;
  const idx = waypoints.findIndex((w) => w.id === waypointId);
  if (idx === -1) return waypoints;
  const result = waypoints.slice();
  result[idx] = { ...waypoints[idx], ...updates };
  return result;
}

export function removeWaypoint(waypoints, waypointId) {
  if (!Array.isArray(waypoints) || !waypointId) return waypoints;
  const idx = waypoints.findIndex((w) => w.id === waypointId);
  if (idx <= 0 || idx >= waypoints.length - 1) return waypoints;
  const result = waypoints.slice();
  result.splice(idx, 1);
  return result;
}

export function reorderWaypoints(waypoints, fromIndex, toIndex) {
  if (!Array.isArray(waypoints)) return waypoints;
  if (waypoints.length < 3) return waypoints;
  if (fromIndex <= 0 || fromIndex >= waypoints.length - 1) return waypoints;
  if (toIndex <= 0 || toIndex >= waypoints.length - 1) return waypoints;
  if (fromIndex === toIndex) return waypoints;
  const result = waypoints.slice();
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

export function moveWaypointUp(waypoints, index) {
  return reorderWaypoints(waypoints, index, index - 1);
}

export function moveWaypointDown(waypoints, index) {
  return reorderWaypoints(waypoints, index, index + 1);
}

export function validateWaypoints(waypoints) {
  const errors = {};
  if (!Array.isArray(waypoints)) {
    return { valid: false, errors: { waypoints: 'invalid' } };
  }
  if (waypoints.length < 2) {
    errors.length = '至少需要起点和终点两个点';
  }
  waypoints.forEach((wp, idx) => {
    if (!wp || typeof wp.x !== 'number' || typeof wp.y !== 'number') {
      errors[`waypoint_${idx}`] = `第 ${idx + 1} 个点坐标无效`;
    }
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

export function isWalkRecommended(distanceKm) {
  return distanceKm <= WALK_MAX_DISTANCE_KM;
}

function generateRoutePath(points, variation) {
  if (points.length < 2) return [];
  const result = [];
  for (let i = 1; i < points.length; i++) {
    const start = points[i - 1];
    const end = points[i];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const perpX = -dy;
    const perpY = dx;
    const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
    const offsetScale = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.12 * variation, 60);
    const seed = (Math.abs(start.x + start.y * 31 + end.x * 7 + end.y * 127 + variation * 997) % 100) / 100;
    const offsetDir = seed > 0.5 ? 1 : -1;
    const mid1X = start.x + dx * 0.33 + (perpX / len) * offsetScale * offsetDir * 0.6;
    const mid1Y = start.y + dy * 0.33 + (perpY / len) * offsetScale * offsetDir * 0.6;
    const mid2X = start.x + dx * 0.66 + (perpX / len) * offsetScale * offsetDir * 0.3;
    const mid2Y = start.y + dy * 0.66 + (perpY / len) * offsetScale * offsetDir * 0.3;
    if (i === 1) {
      result.push({ x: start.x, y: start.y });
    }
    result.push({ x: mid1X, y: mid1Y });
    result.push({ x: mid2X, y: mid2Y });
    result.push({ x: end.x, y: end.y });
  }
  return result;
}

export function calculateRoutes(waypoints, travelMode) {
  const validation = validateWaypoints(waypoints);
  if (!validation.valid) return [];
  const baseKm = calculateTotalKm(waypoints);
  const baseTime = calculateTimeMinutes(baseKm, travelMode);
  const baseCost = calculateCost(baseKm, travelMode);
  const routes = [];
  const recommended = {
    id: generateId(),
    type: 'recommended',
    name: ROUTE_TYPES[0].name,
    color: ROUTE_COLORS.recommended,
    distanceKm: Math.round(baseKm * 1.05 * 100) / 100,
    timeMinutes: Math.round(baseTime * 1.05),
    cost: Math.round(baseCost * 1.05 * 100) / 100,
    waypointCount: waypoints.length,
    travelMode,
    path: generateRoutePath(waypoints, 1),
    waypoints: waypoints.map((w) => ({ ...w })),
    transfers: travelMode === 'bus' ? Math.max(1, Math.floor(baseKm / 5)) : 0,
  };
  routes.push(recommended);
  const shortest = {
    id: generateId(),
    type: 'shortest',
    name: ROUTE_TYPES[1].name,
    color: ROUTE_COLORS.shortest,
    distanceKm: Math.round(baseKm * 100) / 100,
    timeMinutes: Math.round(baseTime * 1.15),
    cost: Math.round(baseCost * 0.9 * 100) / 100,
    waypointCount: waypoints.length,
    travelMode,
    path: generateRoutePath(waypoints, 0.5),
    waypoints: waypoints.map((w) => ({ ...w })),
    transfers: travelMode === 'bus' ? Math.max(0, Math.floor(baseKm / 8)) : 0,
  };
  routes.push(shortest);
  if (baseKm > 2) {
    const economic = {
      id: generateId(),
      type: 'economic',
      name: ROUTE_TYPES[2].name,
      color: ROUTE_COLORS.economic,
      distanceKm: Math.round(baseKm * 1.2 * 100) / 100,
      timeMinutes: Math.round(baseTime * 1.3),
      cost: Math.round(baseCost * 0.75 * 100) / 100,
      waypointCount: waypoints.length,
      travelMode,
      path: generateRoutePath(waypoints, 1.8),
      waypoints: waypoints.map((w) => ({ ...w })),
      transfers: travelMode === 'bus' ? Math.max(2, Math.floor(baseKm / 4)) : 0,
    };
    routes.push(economic);
  }
  return routes;
}

export function getLineDashPattern(style) {
  switch (style) {
    case 'solid':
      return [];
    case 'longdash':
      return [20, 10];
    case 'shortdash':
      return [10, 5];
    case 'dot':
      return [2, 4];
    default:
      return [];
  }
}

export function getDirection(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < 1 && absY < 1) return '原地';
  if (absX > absY) {
    return dx > 0 ? '向东' : '向西';
  }
  return dy > 0 ? '向南' : '向北';
}

export function generateRouteText(route) {
  if (!route || !Array.isArray(route.waypoints) || route.waypoints.length < 2) {
    return '';
  }
  const lines = [];
  lines.push(`【${route.name}】`);
  lines.push(`交通方式：${TRAVEL_MODES[route.travelMode]?.name || '未知'}`);
  lines.push('');
  const wps = route.waypoints;
  for (let i = 0; i < wps.length - 1; i++) {
    const from = wps[i];
    const to = wps[i + 1];
    const segDist = pixelsToKm(getDistance(from, to));
    const dir = getDirection(from, to);
    const segName = i === 0 ? '起点' : `途经点${i}`;
    lines.push(`${i + 1}. 从${from.name || segName}出发，${dir}行驶 ${formatDistance(segDist)}`);
  }
  lines.push(`到达 ${wps[wps.length - 1].name || '终点'}`);
  lines.push('');
  lines.push(`全程：${formatDistance(route.distanceKm)}`);
  lines.push(`预计时间：${formatTime(route.timeMinutes)}`);
  if (route.transfers) {
    lines.push(`换乘次数：${route.transfers} 次`);
  }
  lines.push(`预估费用：${formatCost(route.cost)}`);
  return lines.join('\n');
}

export function exportRouteToJSON(route) {
  if (!route) return '';
  const exportData = {
    version: '1.0',
    type: 'route',
    exportedAt: new Date().toISOString(),
    route: {
      name: route.name,
      type: route.type,
      color: route.color,
      travelMode: route.travelMode,
      distanceKm: route.distanceKm,
      timeMinutes: route.timeMinutes,
      cost: route.cost,
      transfers: route.transfers || 0,
      waypointCount: route.waypointCount,
      waypoints: route.waypoints?.map((w) => ({
        id: w.id,
        name: w.name,
        x: w.x,
        y: w.y,
      })) || [],
      path: route.path?.map((p) => ({ x: p.x, y: p.y })) || [],
    },
  };
  return JSON.stringify(exportData, null, 2);
}

export function parseRouteFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.type !== 'route' || !data.route) return null;
    return data.route;
  } catch {
    return null;
  }
}

export function downloadJSON(content, filename) {
  if (typeof window === 'undefined') return false;
  try {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'route.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function copyToClipboard(text) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function createFavorite(data) {
  if (!data) {
    return {
      id: generateId(),
      name: '未命名路线',
      waypoints: [...DEFAULT_WAYPOINTS],
      travelMode: 'car',
      createdAt: Date.now(),
    };
  }
  return {
    id: data.id || generateId(),
    name: (data.name || '未命名路线').trim(),
    waypoints: Array.isArray(data.waypoints) ? data.waypoints.map((w) => ({ ...w })) : [],
    travelMode: data.travelMode || 'car',
    distanceKm: typeof data.distanceKm === 'number' ? data.distanceKm : 0,
    timeMinutes: typeof data.timeMinutes === 'number' ? data.timeMinutes : 0,
    cost: typeof data.cost === 'number' ? data.cost : 0,
    selectedRouteType: data.selectedRouteType || 'recommended',
    createdAt: data.createdAt || Date.now(),
  };
}

export function loadFavorites(storage) {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return [];
  try {
    const raw = store.getItem(STORAGE_KEY_FAVORITES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((f) => f && typeof f.id === 'string' && Array.isArray(f.waypoints));
  } catch {
    return [];
  }
}

export function saveFavorites(favorites, storage) {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
  } catch {
    // ignore
  }
}

export function addFavorite(favorites, favorite) {
  if (!Array.isArray(favorites)) return [favorite];
  return [...favorites, favorite];
}

export function removeFavorite(favorites, favoriteId) {
  if (!Array.isArray(favorites) || !favoriteId) return favorites;
  return favorites.filter((f) => f.id !== favoriteId);
}

export function updateFavorite(favorites, favoriteId, updates) {
  if (!Array.isArray(favorites) || !favoriteId || !updates) return favorites;
  const idx = favorites.findIndex((f) => f.id === favoriteId);
  if (idx === -1) return favorites;
  const result = favorites.slice();
  result[idx] = { ...favorites[idx], ...updates };
  return result;
}

export function renameFavorite(favorites, favoriteId, newName) {
  const name = (newName || '').trim();
  if (!name) return favorites;
  return updateFavorite(favorites, favoriteId, { name });
}

export function findFavoriteById(favorites, favoriteId) {
  if (!Array.isArray(favorites) || !favoriteId) return null;
  return favorites.find((f) => f.id === favoriteId) || null;
}

export function sortFavorites(favorites, sortBy = 'time') {
  if (!Array.isArray(favorites)) return [];
  const result = favorites.slice();
  switch (sortBy) {
    case 'name':
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case 'distance':
      result.sort((a, b) => (b.distanceKm || 0) - (a.distanceKm || 0));
      break;
    case 'time':
    default:
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  return result;
}

export function searchFavorites(favorites, keyword) {
  if (!Array.isArray(favorites)) return [];
  const lower = (keyword || '').trim().toLowerCase();
  if (!lower) return favorites;
  return favorites.filter((f) => {
    const nameMatch = (f.name || '').toLowerCase().includes(lower);
    const startName = (f.waypoints?.[0]?.name || '').toLowerCase().includes(lower);
    const endName = (f.waypoints?.[f.waypoints.length - 1]?.name || '').toLowerCase().includes(lower);
    return nameMatch || startName || endName;
  });
}

export function getFavoriteSummary(favorite) {
  if (!favorite || !Array.isArray(favorite.waypoints) || favorite.waypoints.length < 2) {
    return '暂无路线';
  }
  const start = favorite.waypoints[0].name || '起点';
  const end = favorite.waypoints[favorite.waypoints.length - 1].name || '终点';
  return `${start} → ${end}`;
}

export function initializeDefaultWaypoints() {
  return DEFAULT_WAYPOINTS.map((w) => ({ ...w, id: generateId() }));
}

export function saveLastState(state, storage) {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return;
  try {
    const toSave = {
      waypoints: state.waypoints || [],
      travelMode: state.travelMode || 'car',
      center: state.center || { x: 0, y: 0 },
      zoom: state.zoom || 1,
      savedAt: Date.now(),
    };
    store.setItem('solocoder_route_planner_last_state', JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

export function loadLastState(storage) {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return null;
  try {
    const raw = store.getItem('solocoder_route_planner_last_state');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed || null;
  } catch {
    return null;
  }
}
