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

  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < markers.length; i++) {
    if (visited.has(markers[i].id)) continue;

    const cluster = {
      id: `cluster_${generateId()}`,
      markers: [markers[i]],
      x: markers[i].x,
      y: markers[i].y,
    };
    visited.add(markers[i].id);

    for (let j = i + 1; j < markers.length; j++) {
      if (visited.has(markers[j].id)) continue;
      const dist = getDistance(markers[i], markers[j]);
      if (dist <= effectiveDistance) {
        cluster.markers.push(markers[j]);
        visited.add(markers[j].id);
      }
    }

    if (cluster.markers.length >= CLUSTER_THRESHOLD) {
      let sumX = 0;
      let sumY = 0;
      cluster.markers.forEach((m) => {
        sumX += m.x;
        sumY += m.y;
      });
      cluster.x = sumX / cluster.markers.length;
      cluster.y = sumY / cluster.markers.length;
      cluster.isCluster = true;
      clusters.push(cluster);
    } else {
      cluster.markers.forEach((m) => {
        clusters.push({ ...m, isCluster: false });
      });
    }
  }

  return clusters;
}

export function splitCluster(cluster) {
  if (!cluster || !cluster.isCluster) return [];
  return cluster.markers.map((m) => ({ ...m, isCluster: false }));
}

export function generateRoute(start, end) {
  if (!start || !end) return [];

  const points = [];
  const steps = 10;
  const midX = (start.x + end.x) / 2 + (Math.random() - 0.5) * 80;
  const midY = (start.y + end.y) / 2 + (Math.random() - 0.5) * 80;

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
