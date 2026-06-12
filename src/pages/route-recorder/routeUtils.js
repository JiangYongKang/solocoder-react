import {
    ELEVATION_MAX,
    ELEVATION_MIN,
    ELEVATION_START_MAX,
    ELEVATION_START_MIN,
    MAX_WAYPOINTS,
    MAX_ZOOM,
    METERS_PER_PIXEL,
    MIN_ZOOM,
    STORAGE_KEY,
    TRAVEL_MODES,
} from './constants.js';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function clampZoom(zoom) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
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

export function getDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getRoutePoints(start, waypoints, end) {
  const points = [];
  if (start) points.push({ ...start, type: 'start' });
  if (Array.isArray(waypoints)) {
    waypoints.forEach((w, i) => points.push({ ...w, type: 'waypoint', index: i }));
  }
  if (end) points.push({ ...end, type: 'end' });
  return points;
}

export function calculatePixelDistance(start, waypoints, end) {
  const points = getRoutePoints(start, waypoints, end);
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += getDistance(points[i - 1], points[i]);
  }
  return total;
}

export function pixelsToMeters(pixels) {
  return pixels * METERS_PER_PIXEL;
}

export function metersToKilometers(meters) {
  return meters / 1000;
}

export function calculateKilometers(start, waypoints, end) {
  const pixelDist = calculatePixelDistance(start, waypoints, end);
  return metersToKilometers(pixelsToMeters(pixelDist));
}

export function calculateTimeHours(kilometers, modeKey) {
  const mode = TRAVEL_MODES[modeKey];
  if (!mode || !mode.speedKmh || kilometers <= 0) return 0;
  return kilometers / mode.speedKmh;
}

export function formatTime(hours) {
  if (!hours || hours <= 0) return '0 分钟';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} 分钟`;
  if (m === 0) return `${h} 小时`;
  return `${h} 小时 ${m} 分钟`;
}

export function formatDistance(kilometers) {
  if (!kilometers || kilometers <= 0) return '0 km';
  if (kilometers < 1) {
    const meters = Math.round(kilometers * 1000);
    return `${meters} m`;
  }
  return `${kilometers.toFixed(2)} km`;
}

export function canAddWaypoint(waypoints) {
  return Array.isArray(waypoints) && waypoints.length < MAX_WAYPOINTS;
}

export function addWaypoint(waypoints, point) {
  if (!canAddWaypoint(waypoints) || !point) return waypoints;
  const newPoint = {
    id: point.id || generateId(),
    x: point.x,
    y: point.y,
  };
  return [...waypoints, newPoint];
}

export function updateWaypoint(waypoints, id, updates) {
  if (!id || !updates) return waypoints;
  const idx = waypoints.findIndex((w) => w.id === id);
  if (idx === -1) return waypoints;
  const result = waypoints.slice();
  result[idx] = { ...waypoints[idx], ...updates };
  return result;
}

export function removeWaypoint(waypoints, id) {
  if (!id) return waypoints;
  const hasId = waypoints.some((w) => w.id === id);
  if (!hasId) return waypoints;
  return waypoints.filter((w) => w.id !== id);
}

export function reorderWaypoints(waypoints, fromIndex, toIndex) {
  if (!Array.isArray(waypoints) || waypoints.length < 2) return waypoints;
  if (fromIndex < 0 || fromIndex >= waypoints.length) return waypoints;
  if (toIndex < 0 || toIndex >= waypoints.length) return waypoints;
  if (fromIndex === toIndex) return waypoints;
  const result = waypoints.slice();
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function coordinateSeed(x, y) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  return Math.abs(xi * 73856093 ^ yi * 19349663) || 1;
}

export function generateElevation(start, waypoints, end) {
  const points = getRoutePoints(start, waypoints, end);
  if (points.length === 0) return { elevations: [], climb: 0, descent: 0 };

  const elevations = [];
  let climb = 0;
  let descent = 0;

  const startSeed = start ? coordinateSeed(start.x, start.y) : 42;
  const rand = seededRandom(startSeed);

  const startElev = ELEVATION_START_MIN + rand() * (ELEVATION_START_MAX - ELEVATION_START_MIN);
  elevations.push({ elevation: Math.round(startElev), point: points[0] });

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const segDist = getDistance(prev, cur);
    const baseSeed = coordinateSeed((prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
    const segRand = seededRandom(baseSeed + i * 131);
    const variation = (segRand() - 0.5) * 2;
    const distFactor = Math.min(segDist / 100, 2);
    const delta = variation * 80 * distFactor;
    const prevElev = elevations[i - 1].elevation;
    let newElev = prevElev + delta;
    newElev = Math.max(ELEVATION_MIN, Math.min(ELEVATION_MAX, newElev));
    newElev = Math.round(newElev);

    const diff = newElev - prevElev;
    if (diff > 0) climb += diff;
    else descent -= diff;

    elevations.push({ elevation: newElev, point: cur });
  }

  return { elevations, climb: Math.round(climb), descent: Math.round(descent) };
}

export function loadFavorites(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => {
      if (!item || typeof item !== 'object') return false;
      if (typeof item.id !== 'string') return false;
      if (typeof item.name !== 'string') return false;
      if (typeof item.createdAt !== 'number') return false;
      return true;
    });
  } catch {
    return [];
  }
}

export function saveFavorites(favorites, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // ignore
  }
}

export function createFavorite(routeData) {
  const { name, start, waypoints, end, climb, descent, elevations } = routeData || {};
  const distance = calculateKilometers(start, waypoints, end);
  const elevData = generateElevation(start, waypoints, end);
  return {
    id: generateId(),
    name: (name || '未命名路线').trim(),
    start: start ? { x: start.x, y: start.y } : null,
    waypoints: Array.isArray(waypoints) ? waypoints.map((w) => ({ id: w.id || generateId(), x: w.x, y: w.y })) : [],
    end: end ? { x: end.x, y: end.y } : null,
    distance,
    waypointCount: Array.isArray(waypoints) ? waypoints.length : 0,
    climb: typeof climb === 'number' ? climb : (elevData?.climb || 0),
    descent: typeof descent === 'number' ? descent : (elevData?.descent || 0),
    elevations: Array.isArray(elevations)
      ? elevations.slice()
      : (elevData?.elevations ? elevData.elevations.map((e) => e.elevation) : []),
    createdAt: Date.now(),
  };
}

export function addFavorite(favorites, favorite) {
  if (!favorite || !favorite.id) return favorites;
  return [...favorites, favorite];
}

export function removeFavorite(favorites, id) {
  if (!id) return favorites;
  return favorites.filter((f) => f.id !== id);
}

export function findFavoriteById(favorites, id) {
  if (!id || !Array.isArray(favorites)) return null;
  return favorites.find((f) => f.id === id) || null;
}

export function searchFavorites(favorites, keyword) {
  if (!Array.isArray(favorites)) return [];
  const lower = (keyword || '').trim().toLowerCase();
  if (!lower) return favorites;
  return favorites.filter((f) => f.name?.toLowerCase().includes(lower));
}

export function sortFavorites(favorites, sortKey) {
  if (!Array.isArray(favorites)) return [];
  const result = favorites.slice();
  if (sortKey === 'distance') {
    result.sort((a, b) => (b.distance || 0) - (a.distance || 0));
  } else {
    result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  return result;
}

export function generateShareText(favorite) {
  if (!favorite) return '';
  const lines = [];
  lines.push(`【路线分享】${favorite.name}`);
  lines.push('---');
  const startText = favorite.start ? `(${favorite.start.x.toFixed(0)}, ${favorite.start.y.toFixed(0)})` : '未设置';
  const endText = favorite.end ? `(${favorite.end.x.toFixed(0)}, ${favorite.end.y.toFixed(0)})` : '未设置';
  lines.push(`起点: ${startText}`);
  lines.push(`终点: ${endText}`);
  lines.push(`距离: ${formatDistance(favorite.distance)}`);
  lines.push(`途经点: ${favorite.waypointCount || 0} 个`);
  lines.push(`累计爬升: ${favorite.climb || 0} m`);
  lines.push(`累计下降: ${favorite.descent || 0} m`);
  lines.push('---');
  const structured = {
    version: '1.0',
    type: 'route',
    name: favorite.name,
    start: favorite.start ? { x: favorite.start.x, y: favorite.start.y } : null,
    end: favorite.end ? { x: favorite.end.x, y: favorite.end.y } : null,
    waypoints: Array.isArray(favorite.waypoints)
      ? favorite.waypoints.map((w) => ({ x: w.x, y: w.y }))
      : [],
    distance: favorite.distance || 0,
    waypointCount: favorite.waypointCount || 0,
    climb: favorite.climb || 0,
    descent: favorite.descent || 0,
    createdAt: favorite.createdAt || Date.now(),
  };
  lines.push(`DATA:${JSON.stringify(structured)}`);
  return lines.join('\n');
}

export function parseShareText(text) {
  if (typeof text !== 'string' || !text) return null;
  const match = text.match(/DATA:(\{.*\})/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (!parsed || parsed.type !== 'route' || parsed.version !== '1.0') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export function isValidCoordinate(x, y) {
  return typeof x === 'number' && !Number.isNaN(x) && typeof y === 'number' && !Number.isNaN(y);
}

export function parseCoordinate(str) {
  if (typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[,，\s]+/).filter(Boolean);
  if (parts.length < 2) return null;
  const x = parseFloat(parts[0]);
  const y = parseFloat(parts[1]);
  if (!isValidCoordinate(x, y)) return null;
  return { x, y };
}
