import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateId,
  worldToScreen,
  screenToWorld,
  clampZoom,
  getDistance,
  clusterMarkers,
  splitCluster,
  generateRoute,
  calculateRouteDistance,
  loadMarkers,
  saveMarkers,
  addMarker,
  updateMarker,
  deleteMarker,
  findMarkerById,
  searchByKeyword,
  searchPresets,
  validateMarker,
} from '@/pages/map-area/mapUtils.js';
import { STORAGE_KEY, MIN_ZOOM, MAX_ZOOM, DEFAULT_MARKERS } from '@/pages/map-area/constants.js';

function createMockStorage() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    _store: store,
  };
}

describe('mapUtils', () => {
  describe('generateId', () => {
    it('should generate non-empty string ids', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique ids', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('worldToScreen', () => {
    it('should convert world coordinates to screen coordinates at zoom 1', () => {
      const result = worldToScreen(0, 0, 0, 0, 1, 800, 600);
      expect(result.x).toBe(400);
      expect(result.y).toBe(300);
    });

    it('should handle offset world coordinates', () => {
      const result = worldToScreen(100, -50, 0, 0, 1, 800, 600);
      expect(result.x).toBe(500);
      expect(result.y).toBe(250);
    });

    it('should apply zoom scaling', () => {
      const result = worldToScreen(100, 100, 0, 0, 2, 800, 600);
      expect(result.x).toBe(600);
      expect(result.y).toBe(500);
    });

    it('should handle non-zero center', () => {
      const result = worldToScreen(0, 0, 100, 100, 1, 800, 600);
      expect(result.x).toBe(300);
      expect(result.y).toBe(200);
    });
  });

  describe('screenToWorld', () => {
    it('should be the inverse of worldToScreen at zoom 1', () => {
      const worldX = 123;
      const worldY = -456;
      const screen = worldToScreen(worldX, worldY, 0, 0, 1, 800, 600);
      const result = screenToWorld(screen.x, screen.y, 0, 0, 1, 800, 600);
      expect(result.x).toBeCloseTo(worldX);
      expect(result.y).toBeCloseTo(worldY);
    });

    it('should be the inverse of worldToScreen with zoom', () => {
      const worldX = 50;
      const worldY = 75;
      const zoom = 2.5;
      const centerX = 10;
      const centerY = -20;
      const screen = worldToScreen(worldX, worldY, centerX, centerY, zoom, 1024, 768);
      const result = screenToWorld(screen.x, screen.y, centerX, centerY, zoom, 1024, 768);
      expect(result.x).toBeCloseTo(worldX);
      expect(result.y).toBeCloseTo(worldY);
    });
  });

  describe('clampZoom', () => {
    it('should keep values within the valid range', () => {
      expect(clampZoom(1)).toBe(1);
      expect(clampZoom(MIN_ZOOM)).toBe(MIN_ZOOM);
      expect(clampZoom(MAX_ZOOM)).toBe(MAX_ZOOM);
    });

    it('should clamp values below minimum', () => {
      expect(clampZoom(0.001)).toBe(MIN_ZOOM);
      expect(clampZoom(-1)).toBe(MIN_ZOOM);
    });

    it('should clamp values above maximum', () => {
      expect(clampZoom(100)).toBe(MAX_ZOOM);
      expect(clampZoom(999)).toBe(MAX_ZOOM);
    });
  });

  describe('getDistance', () => {
    it('should calculate Euclidean distance', () => {
      expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(getDistance({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(0);
    });

    it('should handle negative coordinates', () => {
      expect(getDistance({ x: -1, y: -1 }, { x: 2, y: 3 })).toBe(5);
    });
  });

  describe('clusterMarkers', () => {
    it('should return empty array for empty input', () => {
      expect(clusterMarkers([], 1)).toEqual([]);
    });

    it('should return markers as non-clusters when few and far apart', () => {
      const markers = [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 1000, y: 1000 },
      ];
      const result = clusterMarkers(markers, 1);
      expect(result.length).toBe(2);
      expect(result.every((r) => !r.isCluster)).toBe(true);
    });

    it('should cluster nearby markers at low zoom', () => {
      const markers = [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 10, y: 10 },
        { id: 'c', x: -10, y: -10 },
        { id: 'd', x: 5, y: 5 },
      ];
      const result = clusterMarkers(markers, 0.5);
      const cluster = result.find((r) => r.isCluster);
      expect(cluster).toBeTruthy();
      expect(cluster.markers.length).toBe(4);
    });

    it('should un-cluster markers at high zoom', () => {
      const markers = [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 200, y: 200 },
        { id: 'c', x: -200, y: -200 },
        { id: 'd', x: 100, y: -100 },
      ];
      const clustered = clusterMarkers(markers, 0.2);
      expect(clustered.some((r) => r.isCluster)).toBe(true);

      const unclustered = clusterMarkers(markers, 10);
      expect(unclustered.every((r) => !r.isCluster)).toBe(true);
      expect(unclustered.length).toBe(4);
    });

    it('should compute cluster center as average of member coordinates', () => {
      const markers = [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 10, y: 0 },
        { id: 'c', x: 0, y: 10 },
      ];
      const result = clusterMarkers(markers, 0.1);
      const cluster = result.find((r) => r.isCluster);
      expect(cluster).toBeTruthy();
      expect(cluster.x).toBeCloseTo(10 / 3);
      expect(cluster.y).toBeCloseTo(10 / 3);
    });

    it('should cluster markers with chain distribution (A close to B, B close to C)', () => {
      const step = 30;
      const markers = [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: step, y: 0 },
        { id: 'c', x: step * 2, y: 0 },
        { id: 'd', x: step * 3, y: 0 },
      ];
      const zoom = 0.2;
      const result = clusterMarkers(markers, zoom);
      const cluster = result.find((r) => r.isCluster);
      expect(cluster).toBeTruthy();
      expect(cluster.markers.length).toBe(4);
    });

    it('should keep separate chains as distinct clusters', () => {
      const step = 20;
      const markers = [
        { id: 'a1', x: 0, y: 0 },
        { id: 'a2', x: step, y: 0 },
        { id: 'a3', x: step * 2, y: 0 },
        { id: 'b1', x: 1000, y: 1000 },
        { id: 'b2', x: 1000 + step, y: 1000 },
        { id: 'b3', x: 1000 + step * 2, y: 1000 },
      ];
      const zoom = 0.3;
      const result = clusterMarkers(markers, zoom);
      const clusters = result.filter((r) => r.isCluster);
      expect(clusters.length).toBe(2);
      expect(clusters[0].markers.length + clusters[1].markers.length).toBe(6);
    });
  });

  describe('splitCluster', () => {
    it('should return empty array for non-cluster or null', () => {
      expect(splitCluster(null)).toEqual([]);
      expect(splitCluster({ isCluster: false, markers: [{ id: 'a' }] })).toEqual([]);
    });

    it('should split cluster into individual markers', () => {
      const cluster = {
        isCluster: true,
        markers: [
          { id: 'a', x: 0, y: 0 },
          { id: 'b', x: 10, y: 10 },
        ],
      };
      const result = splitCluster(cluster);
      expect(result.length).toBe(2);
      expect(result.every((r) => !r.isCluster)).toBe(true);
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
    });
  });

  describe('generateRoute', () => {
    it('should return empty array for missing endpoints', () => {
      expect(generateRoute(null, null)).toEqual([]);
      expect(generateRoute({ x: 0, y: 0 }, null)).toEqual([]);
    });

    it('should generate a polyline with multiple points', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 100 };
      const points = generateRoute(start, end);
      expect(Array.isArray(points)).toBe(true);
      expect(points.length).toBeGreaterThan(2);
      expect(points[0].x).toBeCloseTo(0);
      expect(points[0].y).toBeCloseTo(0);
      expect(points[points.length - 1].x).toBeCloseTo(100);
      expect(points[points.length - 1].y).toBeCloseTo(100);
    });

    it('should produce deterministic output for the same inputs', () => {
      const start = { x: 10, y: 20 };
      const end = { x: 100, y: 200 };
      const result1 = generateRoute(start, end);
      const result2 = generateRoute(start, end);
      const result3 = generateRoute(start, end);
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
      expect(result1.length).toBe(result3.length);
    });

    it('should produce different outputs for different endpoints', () => {
      const start = { x: 0, y: 0 };
      const endA = { x: 100, y: 0 };
      const endB = { x: 0, y: 100 };
      const resultA = generateRoute(start, endA);
      const resultB = generateRoute(start, endB);
      const coordsA = resultA.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('|');
      const coordsB = resultB.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('|');
      expect(coordsA).not.toEqual(coordsB);
    });
  });

  describe('calculateRouteDistance', () => {
    it('should return 0 for insufficient points', () => {
      expect(calculateRouteDistance([])).toBe(0);
      expect(calculateRouteDistance([{ x: 0, y: 0 }])).toBe(0);
    });

    it('should sum distances between consecutive points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 3, y: 4 },
        { x: 3, y: 8 },
      ];
      expect(calculateRouteDistance(points)).toBeCloseTo(9);
    });
  });

  describe('localStorage persistence', () => {
    let storage;
    beforeEach(() => {
      storage = createMockStorage();
    });

    it('loadMarkers should return defaults and persist when storage empty', () => {
      const markers = loadMarkers(storage);
      expect(Array.isArray(markers)).toBe(true);
      expect(markers.length).toBeGreaterThan(0);
      expect(storage.getItem(STORAGE_KEY)).toBeTruthy();
    });

    it('saveMarkers and loadMarkers should round-trip correctly', () => {
      const custom = [{ id: 'test', name: 'Test', x: 1, y: 2 }];
      saveMarkers(custom, storage);
      const loaded = loadMarkers(storage);
      expect(loaded.length).toBe(1);
      expect(loaded[0].id).toBe('test');
    });

    it('loadMarkers should handle corrupted JSON', () => {
      storage.setItem(STORAGE_KEY, '{bad json');
      const markers = loadMarkers(storage);
      expect(Array.isArray(markers)).toBe(true);
      expect(markers.length).toBe(DEFAULT_MARKERS.length);
    });

    it('loadMarkers should filter out invalid entries', () => {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          { id: 'valid', x: 1, y: 2, name: 'OK' },
          { x: 1 },
          null,
          'not-an-object',
        ])
      );
      const markers = loadMarkers(storage);
      expect(markers.length).toBe(1);
      expect(markers[0].id).toBe('valid');
    });

    it('should not throw when storage is unavailable', () => {
      expect(() => loadMarkers(null)).not.toThrow();
      expect(() => saveMarkers([], null)).not.toThrow();
    });
  });

  describe('addMarker', () => {
    it('should add a valid marker', () => {
      const result = addMarker([], { name: 'Test', x: 10, y: 20 });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Test');
      expect(result[0].x).toBe(10);
      expect(result[0].y).toBe(20);
      expect(result[0].id).toBeTruthy();
    });

    it('should not mutate original array', () => {
      const original = [];
      addMarker(original, { name: 'Test', x: 1, y: 1 });
      expect(original.length).toBe(0);
    });

    it('should provide default name when missing', () => {
      const result = addMarker([], { x: 1, y: 1 });
      expect(result[0].name).toBe('未命名标记');
    });

    it('should reject markers without coordinates', () => {
      const original = [{ id: 'a', x: 0, y: 0 }];
      const result = addMarker(original, { name: 'No coords' });
      expect(result).toBe(original);
    });
  });

  describe('updateMarker', () => {
    it('should update fields of matching marker', () => {
      const markers = [{ id: 'a', name: 'Old', x: 0, y: 0 }];
      const updated = updateMarker(markers, 'a', { name: 'New', description: 'desc' });
      expect(updated[0].name).toBe('New');
      expect(updated[0].description).toBe('desc');
    });

    it('should not change other markers', () => {
      const markers = [
        { id: 'a', name: 'A', x: 0, y: 0 },
        { id: 'b', name: 'B', x: 1, y: 1 },
      ];
      const updated = updateMarker(markers, 'a', { name: 'A2' });
      expect(updated[1].name).toBe('B');
    });

    it('should return original array for non-existent id', () => {
      const markers = [{ id: 'a', name: 'A', x: 0, y: 0 }];
      const updated = updateMarker(markers, 'nope', { name: 'X' });
      expect(updated).toBe(markers);
    });
  });

  describe('deleteMarker', () => {
    it('should remove marker by id', () => {
      const markers = [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 1, y: 1 },
      ];
      const result = deleteMarker(markers, 'a');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('b');
    });

    it('should return original for non-existent id', () => {
      const markers = [{ id: 'a', x: 0, y: 0 }];
      const result = deleteMarker(markers, 'nope');
      expect(result.length).toBe(1);
    });
  });

  describe('findMarkerById', () => {
    it('should find marker by id', () => {
      const markers = [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ];
      expect(findMarkerById(markers, 'b').name).toBe('B');
    });

    it('should return null for missing id', () => {
      expect(findMarkerById([{ id: 'a' }], 'x')).toBeNull();
      expect(findMarkerById([], 'a')).toBeNull();
      expect(findMarkerById([{ id: 'a' }], null)).toBeNull();
    });
  });

  describe('searchByKeyword', () => {
    const markers = [
      { id: 'a', name: '中央公园', description: '绿地公园' },
      { id: 'b', name: '科技园区', description: '高新技术' },
      { id: 'c', name: '火车站', description: '交通枢纽' },
    ];

    it('should do case-insensitive search by name', () => {
      const result = searchByKeyword(markers, '公园');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('a');
    });

    it('should search in description', () => {
      const result = searchByKeyword(markers, '交通');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('c');
    });

    it('should return all markers for empty query', () => {
      expect(searchByKeyword(markers, '').length).toBe(3);
      expect(searchByKeyword(markers, '   ').length).toBe(3);
    });
  });

  describe('searchPresets', () => {
    it('should return results for known categories', () => {
      const results = searchPresets('餐厅');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category).toBe('餐厅');
    });

    it('should search by item name', () => {
      const results = searchPresets('中餐厅');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('中餐厅');
    });

    it('should return empty array for empty or unknown query', () => {
      expect(searchPresets('')).toEqual([]);
      expect(searchPresets('xyz不存在')).toEqual([]);
    });
  });

  describe('validateMarker', () => {
    it('should accept a valid marker', () => {
      const result = validateMarker({ name: 'OK', x: 1, y: 2 });
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should reject missing name', () => {
      expect(validateMarker({ name: '', x: 1, y: 2 }).valid).toBe(false);
      expect(validateMarker({ name: '   ', x: 1, y: 2 }).valid).toBe(false);
    });

    it('should reject invalid coordinates', () => {
      expect(validateMarker({ name: 'OK', x: NaN, y: 2 }).valid).toBe(false);
      expect(validateMarker({ name: 'OK', x: 1 }).valid).toBe(false);
    });

    it('should reject null/undefined/non-object markers', () => {
      expect(validateMarker(null).valid).toBe(false);
      expect(validateMarker(undefined).valid).toBe(false);
      expect(validateMarker('not-an-object').valid).toBe(false);
    });
  });
});
