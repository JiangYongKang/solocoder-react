import { DEFAULT_MARKERS, STORAGE_KEY, CLUSTER_DISTANCE, CLUSTER_THRESHOLD, MIN_ZOOM, MAX_ZOOM, SEARCH_PRESETS } from './constants.js';

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
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function clusterMarkers(markers, zoom) {
  if (!Array.isArray(markers) || markers.length === 0) return [];

  const effectiveDistance = CLUSTER_DISTANCE / zoom;
  const n = markers.length;

  const adjacency = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (getDistance(markers[i], markers[j]) <= effectiveDistance) {
        adjacency[i].push(j);
        adjacency[j].push(i);
      }
    }
  }

  const visited = new Array(n).fill(false);
  const components = [];

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    const queue = [i];
    visited[i] = true;
    const component = [];
    while (queue.length > 0) {
      const cur = queue.shift();
      component.push(cur);
      for (const neighbor of adjacency[cur]) {
        if (!visited[neighbor]) {
          visited[neighbor] = true;
          queue.push(neighbor);
        }
      }
    }
    components.push(component);
  }

  const result = [];
  for (const comp of components) {
    const compMarkers = comp.map((idx) => markers[idx]);
    if (compMarkers.length >= CLUSTER_THRESHOLD) {
      let sumX = 0;
      let sumY = 0;
      compMarkers.forEach((m) => {
        sumX += m.x;
        sumY += m.y;
      });
      result.push({
        id: `cluster_${generateId()}`,
        markers: compMarkers,
        x: sumX / compMarkers.length,
        y: sumY / compMarkers.length,
        isCluster: true,
      });
    } else {
      compMarkers.forEach((m) => {
        result.push({ ...m, isCluster: false });
      });
    }
  }

  return result;
}

export function splitCluster(cluster) {
  if (!cluster || !cluster.isCluster) return [];
  return cluster.markers.map((m) => ({ ...m, isCluster: false }));
}

export function generateRoute(start, end) {
  if (!start || !end) return [];

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const perpX = -dy;
  const perpY = dx;
  const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
  const offsetScale = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.15, 40);

  const seed = (Math.abs(start.x + start.y * 31 + end.x * 7 + end.y * 127) % 100) / 100;
  const offsetDir = seed > 0.5 ? 1 : -1;

  const midX = (start.x + end.x) / 2 + (perpX / len) * offsetScale * offsetDir;
  const midY = (start.y + end.y) / 2 + (perpY / len) * offsetScale * offsetDir;

  const points = [];
  const steps = 10;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let x, y;
    if (t < 0.5) {
      const t2 = t * 2;
      x = start.x + (midX - start.x) * t2;
      y = start.y + (midY - start.y) * t2;
    } else {
      const t2 = (t - 0.5) * 2;
      x = midX + (end.x - midX) * t2;
      y = midY + (end.y - midY) * t2;
    }
    points.push({ x, y });
  }

  return points;
}

export function calculateRouteDistance(points) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += getDistance(points[i - 1], points[i]);
  }
  return total;
}

export function loadMarkers(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return [...DEFAULT_MARKERS];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = [...DEFAULT_MARKERS];
      saveMarkers(defaults, storage);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_MARKERS];
    return parsed.filter((m) => m && typeof m.id === 'string' && typeof m.x === 'number' && typeof m.y === 'number');
  } catch {
    return [...DEFAULT_MARKERS];
  }
}

export function saveMarkers(markers, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(markers));
  } catch {
    // ignore storage errors
  }
}

export function addMarker(markers, marker) {
  if (!marker || typeof marker.x !== 'number' || typeof marker.y !== 'number') {
    return markers;
  }
  const newMarker = {
    id: marker.id || generateId(),
    name: marker.name || '未命名标记',
    description: marker.description || '',
    x: marker.x,
    y: marker.y,
  };
  return [...markers, newMarker];
}

export function updateMarker(markers, markerId, updates) {
  if (!markerId || !updates) return markers;
  const idx = markers.findIndex((m) => m.id === markerId);
  if (idx === -1) return markers;
  const result = markers.slice();
  result[idx] = { ...markers[idx], ...updates };
  return result;
}

export function deleteMarker(markers, markerId) {
  if (!markerId) return markers;
  return markers.filter((m) => m.id !== markerId);
}

export function findMarkerById(markers, markerId) {
  if (!markerId) return null;
  return markers.find((m) => m.id === markerId) || null;
}

export function searchByKeyword(markers, keyword) {
  if (!keyword) return markers;
  const lower = keyword.trim().toLowerCase();
  if (!lower) return markers;
  return markers.filter((m) => {
    const nameMatch = m.name?.toLowerCase().includes(lower);
    const descMatch = m.description?.toLowerCase().includes(lower);
    return nameMatch || descMatch;
  });
}

export function searchPresets(keyword) {
  if (!keyword) return [];
  const lower = keyword.trim().toLowerCase();
  if (!lower) return [];

  const results = [];
  Object.entries(SEARCH_PRESETS).forEach(([category, items]) => {
    if (category.toLowerCase().includes(lower)) {
      items.forEach((item) => results.push({ category, ...item }));
    } else {
      items.forEach((item) => {
        if (item.name.toLowerCase().includes(lower) || item.description.toLowerCase().includes(lower)) {
          results.push({ category, ...item });
        }
      });
    }
  });
  return results;
}

export function validateMarker(marker) {
  const errors = {};
  if (!marker || typeof marker !== 'object') {
    return { valid: false, errors: { marker: 'invalid' } };
  }
  if (typeof marker.x !== 'number' || Number.isNaN(marker.x)) {
    errors.x = '坐标 X 无效';
  }
  if (typeof marker.y !== 'number' || Number.isNaN(marker.y)) {
    errors.y = '坐标 Y 无效';
  }
  if (!marker.name || typeof marker.name !== 'string' || !marker.name.trim()) {
    errors.name = '名称不能为空';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
