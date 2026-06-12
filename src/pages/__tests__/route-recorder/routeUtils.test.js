import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateId,
  clampZoom,
  worldToScreen,
  screenToWorld,
  getDistance,
  getRoutePoints,
  calculatePixelDistance,
  pixelsToMeters,
  metersToKilometers,
  calculateKilometers,
  calculateTimeHours,
  formatTime,
  formatDistance,
  canAddWaypoint,
  addWaypoint,
  updateWaypoint,
  removeWaypoint,
  reorderWaypoints,
  generateElevation,
  loadFavorites,
  saveFavorites,
  createFavorite,
  addFavorite,
  removeFavorite,
  findFavoriteById,
  searchFavorites,
  sortFavorites,
  generateShareText,
  parseShareText,
  formatDateTime,
  isValidCoordinate,
  parseCoordinate,
} from '@/pages/route-recorder/routeUtils.js';
import {
  STORAGE_KEY,
  MIN_ZOOM,
  MAX_ZOOM,
  MAX_WAYPOINTS,
  METERS_PER_PIXEL,
  TRAVEL_MODES,
  SORT_OPTIONS,
} from '@/pages/route-recorder/constants.js';

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

describe('routeUtils', () => {
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

  describe('coordinate conversion', () => {
    it('worldToScreen should convert world coordinates to screen coordinates at zoom 1', () => {
      const result = worldToScreen(0, 0, 0, 0, 1, 800, 600);
      expect(result.x).toBe(400);
      expect(result.y).toBe(300);
    });

    it('worldToScreen should handle offset world coordinates', () => {
      const result = worldToScreen(100, -50, 0, 0, 1, 800, 600);
      expect(result.x).toBe(500);
      expect(result.y).toBe(250);
    });

    it('worldToScreen should apply zoom scaling', () => {
      const result = worldToScreen(100, 100, 0, 0, 2, 800, 600);
      expect(result.x).toBe(600);
      expect(result.y).toBe(500);
    });

    it('worldToScreen should handle non-zero center', () => {
      const result = worldToScreen(0, 0, 100, 100, 1, 800, 600);
      expect(result.x).toBe(300);
      expect(result.y).toBe(200);
    });

    it('screenToWorld should be the inverse of worldToScreen at zoom 1', () => {
      const worldX = 123;
      const worldY = -456;
      const screen = worldToScreen(worldX, worldY, 0, 0, 1, 800, 600);
      const result = screenToWorld(screen.x, screen.y, 0, 0, 1, 800, 600);
      expect(result.x).toBeCloseTo(worldX);
      expect(result.y).toBeCloseTo(worldY);
    });

    it('screenToWorld should be the inverse of worldToScreen with zoom', () => {
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

  describe('getDistance', () => {
    it('should calculate Euclidean distance', () => {
      expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(getDistance({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(0);
    });

    it('should handle negative coordinates', () => {
      expect(getDistance({ x: -1, y: -1 }, { x: 2, y: 3 })).toBe(5);
    });

    it('should return 0 for null points', () => {
      expect(getDistance(null, { x: 1, y: 1 })).toBe(0);
      expect(getDistance({ x: 1, y: 1 }, null)).toBe(0);
    });
  });

  describe('getRoutePoints', () => {
    it('should return empty array when no points', () => {
      expect(getRoutePoints(null, [], null)).toEqual([]);
    });

    it('should include start only', () => {
      const start = { x: 0, y: 0 };
      const result = getRoutePoints(start, [], null);
      expect(result.length).toBe(1);
      expect(result[0].type).toBe('start');
    });

    it('should include all points in correct order: start -> waypoints -> end', () => {
      const start = { x: 0, y: 0 };
      const waypoints = [{ id: 'w1', x: 1, y: 1 }, { id: 'w2', x: 2, y: 2 }];
      const end = { x: 3, y: 3 };
      const result = getRoutePoints(start, waypoints, end);
      expect(result.length).toBe(4);
      expect(result[0].type).toBe('start');
      expect(result[1].type).toBe('waypoint');
      expect(result[1].index).toBe(0);
      expect(result[2].type).toBe('waypoint');
      expect(result[2].index).toBe(1);
      expect(result[3].type).toBe('end');
    });
  });

  describe('distance calculations', () => {
    it('calculatePixelDistance should return 0 for fewer than 2 points', () => {
      expect(calculatePixelDistance(null, [], null)).toBe(0);
      expect(calculatePixelDistance({ x: 0, y: 0 }, [], null)).toBe(0);
    });

    it('calculatePixelDistance should sum Euclidean distances', () => {
      const start = { x: 0, y: 0 };
      const waypoints = [{ id: 'w1', x: 3, y: 4 }];
      const end = { x: 3, y: 8 };
      const dist = calculatePixelDistance(start, waypoints, end);
      expect(dist).toBeCloseTo(9);
    });

    it('pixelsToMeters conversion', () => {
      expect(pixelsToMeters(1)).toBe(METERS_PER_PIXEL);
      expect(pixelsToMeters(0)).toBe(0);
    });

    it('metersToKilometers conversion', () => {
      expect(metersToKilometers(1000)).toBe(1);
      expect(metersToKilometers(1500)).toBe(1.5);
    });

    it('calculateKilometers should produce expected km', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 0 };
      const km = calculateKilometers(start, [], end);
      expect(km).toBeCloseTo(100 * METERS_PER_PIXEL / 1000);
    });
  });

  describe('time calculation', () => {
    it('calculateTimeHours should compute time based on speed', () => {
      expect(calculateTimeHours(5, 'walk')).toBeCloseTo(1);
      expect(calculateTimeHours(15, 'bike')).toBeCloseTo(1);
      expect(calculateTimeHours(40, 'car')).toBeCloseTo(1);
    });

    it('calculateTimeHours should handle invalid inputs', () => {
      expect(calculateTimeHours(0, 'walk')).toBe(0);
      expect(calculateTimeHours(10, 'nonexistent')).toBe(0);
    });

    it('formatTime should format correctly', () => {
      expect(formatTime(0)).toBe('0 分钟');
      expect(formatTime(0.5)).toBe('30 分钟');
      expect(formatTime(1)).toBe('1 小时');
      expect(formatTime(1.5)).toBe('1 小时 30 分钟');
    });

    it('formatDistance should format correctly', () => {
      expect(formatDistance(0)).toBe('0 km');
      expect(formatDistance(0.5)).toBe('500 m');
      expect(formatDistance(1.234)).toBe('1.23 km');
    });
  });

  describe('waypoint operations', () => {
    it('canAddWaypoint should enforce MAX_WAYPOINTS', () => {
      expect(canAddWaypoint([])).toBe(true);
      const max = Array.from({ length: MAX_WAYPOINTS }, (_, i) => ({ id: String(i) }));
      expect(canAddWaypoint(max)).toBe(false);
      expect(canAddWaypoint(max.slice(0, -1))).toBe(true);
    });

    it('addWaypoint should append new waypoint with id', () => {
      const initial = [];
      const result = addWaypoint(initial, { x: 1, y: 2 });
      expect(result.length).toBe(1);
      expect(result[0].x).toBe(1);
      expect(result[0].y).toBe(2);
      expect(result[0].id).toBeTruthy();
      expect(initial.length).toBe(0);
    });

    it('addWaypoint should not add when at max capacity', () => {
      const max = Array.from({ length: MAX_WAYPOINTS }, (_, i) => ({ id: String(i) }));
      const result = addWaypoint(max, { x: 1, y: 1 });
      expect(result).toBe(max);
    });

    it('updateWaypoint should update matching waypoint', () => {
      const wps = [{ id: 'a', x: 0, y: 0 }];
      const updated = updateWaypoint(wps, 'a', { x: 10, y: 20 });
      expect(updated[0].x).toBe(10);
      expect(updated[0].y).toBe(20);
    });

    it('updateWaypoint should not change other waypoints', () => {
      const wps = [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 1, y: 1 },
      ];
      const updated = updateWaypoint(wps, 'a', { x: 99 });
      expect(updated[1].x).toBe(1);
    });

    it('updateWaypoint should return original for non-existent id', () => {
      const wps = [{ id: 'a' }];
      const updated = updateWaypoint(wps, 'nope', { x: 1 });
      expect(updated).toBe(wps);
    });

    it('removeWaypoint should remove by id', () => {
      const wps = [{ id: 'a' }, { id: 'b' }];
      const result = removeWaypoint(wps, 'a');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('b');
    });

    it('removeWaypoint should return original for missing id', () => {
      const wps = [{ id: 'a' }];
      const result = removeWaypoint(wps, 'nope');
      expect(result).toBe(wps);
    });

    it('reorderWaypoints should swap order', () => {
      const wps = [
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
      ];
      const result = reorderWaypoints(wps, 0, 2);
      expect(result.map((w) => w.id)).toEqual(['b', 'c', 'a']);
    });

    it('reorderWaypoints should return original for invalid index', () => {
      const wps = [{ id: 'a' }];
      expect(reorderWaypoints(wps, 0, 1)).toBe(wps);
      expect(reorderWaypoints(wps, -1, 0)).toBe(wps);
      expect(reorderWaypoints(wps, 0, 0)).toBe(wps);
      expect(reorderWaypoints([], 0, 0)).toEqual([]);
    });
  });

  describe('generateElevation', () => {
    it('should return empty result for no points', () => {
      const result = generateElevation(null, [], null);
      expect(result.elevations).toEqual([]);
      expect(result.climb).toBe(0);
      expect(result.descent).toBe(0);
    });

    it('should produce elevation array matching point count', () => {
      const start = { x: 0, y: 0 };
      const waypoints = [
        { id: 'w1', x: 100, y: 100 },
        { id: 'w2', x: 200, y: 200 },
      ];
      const end = { x: 300, y: 300 };
      const result = generateElevation(start, waypoints, end);
      expect(result.elevations.length).toBe(4);
      expect(typeof result.elevations[0].elevation).toBe('number');
      expect(typeof result.climb).toBe('number');
      expect(typeof result.descent).toBe('number');
      expect(result.climb).toBeGreaterThanOrEqual(0);
      expect(result.descent).toBeGreaterThanOrEqual(0);
    });

    it('should be deterministic for same inputs', () => {
      const start = { x: 10, y: 20 };
      const end = { x: 100, y: 200 };
      const a = generateElevation(start, [], end);
      const b = generateElevation(start, [], end);
      expect(a.elevations.map((e) => e.elevation)).toEqual(b.elevations.map((e) => e.elevation));
      expect(a.climb).toBe(b.climb);
      expect(a.descent).toBe(b.descent);
    });
  });

  describe('localStorage persistence', () => {
    let storage;
    beforeEach(() => {
      storage = createMockStorage();
    });

    it('loadFavorites should return empty array for empty storage', () => {
      const favs = loadFavorites(storage);
      expect(Array.isArray(favs)).toBe(true);
      expect(favs.length).toBe(0);
    });

    it('saveFavorites and loadFavorites should round-trip correctly', () => {
      const fav = createFavorite({
        name: '测试路线',
        start: { x: 0, y: 0 },
        waypoints: [],
        end: { x: 100, y: 100 },
      });
      saveFavorites([fav], storage);
      const loaded = loadFavorites(storage);
      expect(loaded.length).toBe(1);
      expect(loaded[0].name).toBe('测试路线');
    });

    it('loadFavorites should handle corrupted JSON', () => {
      storage.setItem(STORAGE_KEY, '{bad json');
      const favs = loadFavorites(storage);
      expect(Array.isArray(favs)).toBe(true);
      expect(favs.length).toBe(0);
    });

    it('loadFavorites should filter out invalid entries', () => {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          { id: 'valid', name: 'OK', createdAt: Date.now() },
          { name: 'no id', createdAt: Date.now() },
          null,
          'string',
        ])
      );
      const favs = loadFavorites(storage);
      expect(favs.length).toBe(1);
      expect(favs[0].id).toBe('valid');
    });

    it('should not throw when storage is unavailable', () => {
      expect(() => loadFavorites(null)).not.toThrow();
      expect(() => saveFavorites([], null)).not.toThrow();
    });
  });

  describe('createFavorite', () => {
    it('should create a valid favorite object', () => {
      const fav = createFavorite({
        name: '  我的路线  ',
        start: { x: 0, y: 0 },
        waypoints: [{ x: 10, y: 10 }],
        end: { x: 100, y: 100 },
      });
      expect(typeof fav.id).toBe('string');
      expect(fav.name).toBe('我的路线');
      expect(fav.start).toEqual({ x: 0, y: 0 });
      expect(fav.waypoints.length).toBe(1);
      expect(fav.end).toEqual({ x: 100, y: 100 });
      expect(typeof fav.distance).toBe('number');
      expect(fav.waypointCount).toBe(1);
      expect(typeof fav.createdAt).toBe('number');
    });

    it('should handle missing start/end gracefully', () => {
      const fav = createFavorite({ name: '空路线' });
      expect(fav.start).toBeNull();
      expect(fav.end).toBeNull();
      expect(fav.waypoints).toEqual([]);
      expect(fav.distance).toBe(0);
    });
  });

  describe('favorite CRUD', () => {
    it('addFavorite should append new favorite', () => {
      const fav = { id: 'a', name: 'A' };
      const result = addFavorite([], fav);
      expect(result.length).toBe(1);
    });

    it('removeFavorite should remove by id', () => {
      const favs = [{ id: 'a' }, { id: 'b' }];
      const result = removeFavorite(favs, 'a');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('b');
    });

    it('findFavoriteById should find or return null', () => {
      const favs = [{ id: 'a', name: 'A' }];
      expect(findFavoriteById(favs, 'a').name).toBe('A');
      expect(findFavoriteById(favs, 'x')).toBeNull();
      expect(findFavoriteById(null, 'a')).toBeNull();
    });
  });

  describe('searchFavorites', () => {
    const favs = [
      { id: 'a', name: '上班路线' },
      { id: 'b', name: '周末骑行' },
      { id: 'c', name: '公园散步' },
    ];

    it('should do case-insensitive search by name', () => {
      const result = searchFavorites(favs, '上班');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('a');
    });

    it('should return all favorites for empty query', () => {
      expect(searchFavorites(favs, '').length).toBe(3);
      expect(searchFavorites(favs, '   ').length).toBe(3);
    });

    it('should return empty array for no match', () => {
      expect(searchFavorites(favs, 'xyz').length).toBe(0);
    });
  });

  describe('sortFavorites', () => {
    it('should sort by time descending by default', () => {
      const favs = [
        { id: 'a', createdAt: 1000, distance: 1 },
        { id: 'b', createdAt: 2000, distance: 3 },
        { id: 'c', createdAt: 1500, distance: 2 },
      ];
      const byTime = sortFavorites(favs, SORT_OPTIONS.time.value);
      expect(byTime.map((f) => f.id)).toEqual(['b', 'c', 'a']);
    });

    it('should sort by distance descending', () => {
      const favs = [
        { id: 'a', createdAt: 1000, distance: 1 },
        { id: 'b', createdAt: 2000, distance: 3 },
        { id: 'c', createdAt: 1500, distance: 2 },
      ];
      const byDist = sortFavorites(favs, SORT_OPTIONS.distance.value);
      expect(byDist.map((f) => f.id)).toEqual(['b', 'c', 'a']);
    });

    it('should not mutate original array', () => {
      const favs = [{ id: 'a' }, { id: 'b' }];
      const sorted = sortFavorites(favs, 'time');
      expect(sorted).not.toBe(favs);
    });
  });

  describe('generateShareText', () => {
    it('should generate share text for favorite', () => {
      const fav = {
        name: '测试路线',
        start: { x: 12.3, y: 45.6 },
        end: { x: 78.9, y: 10.1 },
        distance: 5.5,
        waypointCount: 3,
        climb: 120,
        descent: 80,
      };
      const text = generateShareText(fav);
      expect(text).toContain('测试路线');
      expect(text).toContain('起点');
      expect(text).toContain('终点');
      expect(text).toContain('距离');
      expect(text).toContain('途经点');
      expect(text).toContain('3 个');
      expect(text).toContain('累计爬升: 120 m');
      expect(text).toContain('累计下降: 80 m');
    });

    it('should include structured JSON data with DATA: prefix', () => {
      const fav = {
        name: '结构化路线',
        start: { x: 10, y: 20 },
        end: { x: 30, y: 40 },
        waypoints: [{ x: 15, y: 25 }, { x: 20, y: 30 }],
        distance: 2.5,
        waypointCount: 2,
        climb: 200,
        descent: 150,
        createdAt: 1700000000000,
      };
      const text = generateShareText(fav);
      const dataMatch = text.match(/DATA:(\{.*\})/);
      expect(dataMatch).not.toBeNull();
      const parsed = JSON.parse(dataMatch[1]);
      expect(parsed.version).toBe('1.0');
      expect(parsed.type).toBe('route');
      expect(parsed.name).toBe('结构化路线');
      expect(parsed.start).toEqual({ x: 10, y: 20 });
      expect(parsed.end).toEqual({ x: 30, y: 40 });
      expect(parsed.waypoints).toEqual([{ x: 15, y: 25 }, { x: 20, y: 30 }]);
      expect(parsed.distance).toBe(2.5);
      expect(parsed.waypointCount).toBe(2);
      expect(parsed.climb).toBe(200);
      expect(parsed.descent).toBe(150);
      expect(parsed.createdAt).toBe(1700000000000);
    });

    it('should handle missing start/end in structured data', () => {
      const text = generateShareText({
        name: '无',
        distance: 0,
        waypointCount: 0,
      });
      expect(text).toContain('未设置');
      const dataMatch = text.match(/DATA:(\{.*\})/);
      expect(dataMatch).not.toBeNull();
      const parsed = JSON.parse(dataMatch[1]);
      expect(parsed.start).toBeNull();
      expect(parsed.end).toBeNull();
      expect(parsed.waypoints).toEqual([]);
      expect(parsed.climb).toBe(0);
      expect(parsed.descent).toBe(0);
    });

    it('should return empty string for null', () => {
      expect(generateShareText(null)).toBe('');
    });
  });

  describe('parseShareText', () => {
    it('should parse structured data from generated share text', () => {
      const fav = {
        name: '解析测试',
        start: { x: 100, y: 200 },
        end: { x: 300, y: 400 },
        waypoints: [{ x: 150, y: 250 }],
        distance: 1.5,
        waypointCount: 1,
        climb: 50,
        descent: 30,
        createdAt: 1700000000000,
      };
      const text = generateShareText(fav);
      const parsed = parseShareText(text);
      expect(parsed).not.toBeNull();
      expect(parsed.version).toBe('1.0');
      expect(parsed.type).toBe('route');
      expect(parsed.name).toBe('解析测试');
      expect(parsed.start).toEqual({ x: 100, y: 200 });
      expect(parsed.end).toEqual({ x: 300, y: 400 });
      expect(parsed.waypoints).toEqual([{ x: 150, y: 250 }]);
      expect(parsed.distance).toBe(1.5);
      expect(parsed.waypointCount).toBe(1);
      expect(parsed.climb).toBe(50);
      expect(parsed.descent).toBe(30);
      expect(parsed.createdAt).toBe(1700000000000);
    });

    it('should return null for non-string input', () => {
      expect(parseShareText(null)).toBeNull();
      expect(parseShareText(undefined)).toBeNull();
      expect(parseShareText(123)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseShareText('')).toBeNull();
    });

    it('should return null for text without DATA: prefix', () => {
      expect(parseShareText('some random text')).toBeNull();
    });

    it('should return null for invalid JSON after DATA:', () => {
      expect(parseShareText('DATA:not json')).toBeNull();
      expect(parseShareText('DATA:{broken')).toBeNull();
    });

    it('should return null if type is not route', () => {
      const data = JSON.stringify({ version: '1.0', type: 'other' });
      expect(parseShareText(`DATA:${data}`)).toBeNull();
    });

    it('should return null if version is missing', () => {
      const data = JSON.stringify({ type: 'route' });
      expect(parseShareText(`DATA:${data}`)).toBeNull();
    });

    it('should round-trip through generateShareText and parseShareText', () => {
      const fav = createFavorite({
        name: '往返测试',
        start: { x: 0, y: 0 },
        waypoints: [{ x: 50, y: 50 }],
        end: { x: 100, y: 100 },
      });
      const text = generateShareText(fav);
      const parsed = parseShareText(text);
      expect(parsed.name).toBe('往返测试');
      expect(parsed.start).toEqual({ x: 0, y: 0 });
      expect(parsed.end).toEqual({ x: 100, y: 100 });
      expect(parsed.waypoints.length).toBe(1);
      expect(parsed.waypointCount).toBe(1);
    });
  });

  describe('formatDateTime', () => {
    it('should format timestamp', () => {
      const ts = new Date('2025-01-15T10:30:00Z').getTime();
      const result = formatDateTime(ts);
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    });

    it('should return empty string for falsy', () => {
      expect(formatDateTime(0)).toBe('');
      expect(formatDateTime(null)).toBe('');
    });
  });

  describe('coordinate validation and parsing', () => {
    it('isValidCoordinate should validate numbers', () => {
      expect(isValidCoordinate(1, 2)).toBe(true);
      expect(isValidCoordinate(NaN, 1)).toBe(false);
      expect(isValidCoordinate('1', 2)).toBe(false);
    });

    it('parseCoordinate should parse comma separated', () => {
      expect(parseCoordinate('10, 20')).toEqual({ x: 10, y: 20 });
      expect(parseCoordinate('  100 ， 200  ')).toEqual({ x: 100, y: 200 });
    });

    it('parseCoordinate should parse space separated', () => {
      expect(parseCoordinate('5 7')).toEqual({ x: 5, y: 7 });
    });

    it('parseCoordinate should return null for invalid', () => {
      expect(parseCoordinate('')).toBeNull();
      expect(parseCoordinate('abc')).toBeNull();
      expect(parseCoordinate('10')).toBeNull();
      expect(parseCoordinate(null)).toBeNull();
    });
  });

  describe('TRAVEL_MODES sanity', () => {
    it('should have walk, bike, car entries', () => {
      expect(TRAVEL_MODES.walk).toBeTruthy();
      expect(TRAVEL_MODES.bike).toBeTruthy();
      expect(TRAVEL_MODES.car).toBeTruthy();
      expect(TRAVEL_MODES.walk.speedKmh).toBe(5);
      expect(TRAVEL_MODES.bike.speedKmh).toBe(15);
      expect(TRAVEL_MODES.car.speedKmh).toBe(40);
    });
  });
});
