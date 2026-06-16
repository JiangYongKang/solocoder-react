import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateId,
  clampZoom,
  worldToScreen,
  screenToWorld,
  getDistance,
  pixelsToKm,
  kmToPixels,
  calculateTotalPixelDistance,
  calculateTotalKm,
  calculateTimeMinutes,
  calculateCost,
  formatDistance,
  formatTime,
  formatCost,
  formatDateTime,
  addWaypoint,
  updateWaypoint,
  removeWaypoint,
  reorderWaypoints,
  moveWaypointUp,
  moveWaypointDown,
  validateWaypoints,
  isWalkRecommended,
  calculateRoutes,
  getLineDashPattern,
  getDirection,
  generateRouteText,
  exportRouteToJSON,
  parseRouteFromJSON,
  createFavorite,
  loadFavorites,
  saveFavorites,
  addFavorite,
  removeFavorite,
  updateFavorite,
  renameFavorite,
  findFavoriteById,
  sortFavorites,
  searchFavorites,
  getFavoriteSummary,
  initializeDefaultWaypoints,
  saveLastState,
  loadLastState,
  downloadJSON,
  copyToClipboard,
} from '@/pages/route-planner/routeUtils.js';
import {
  MIN_ZOOM,
  MAX_ZOOM,
  PIXELS_PER_KM,
  WALK_MAX_DISTANCE_KM,
  TRAVEL_MODES,
  DEFAULT_WAYPOINTS,
  STORAGE_KEY_FAVORITES,
} from '@/pages/route-planner/constants.js';

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

const mockWaypoints = [
  { id: 'w1', name: '起点', x: 0, y: 0 },
  { id: 'w2', name: '途经点1', x: 100, y: 100 },
  { id: 'w3', name: '途经点2', x: 200, y: 50 },
  { id: 'w4', name: '终点', x: 300, y: 200 },
];

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
    it('should keep values within valid range', () => {
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
    it('worldToScreen should convert world to screen at zoom 1', () => {
      const result = worldToScreen(0, 0, 0, 0, 1, 800, 600);
      expect(result.x).toBe(400);
      expect(result.y).toBe(300);
    });

    it('worldToScreen should handle offset coordinates', () => {
      const result = worldToScreen(100, -50, 0, 0, 1, 800, 600);
      expect(result.x).toBe(500);
      expect(result.y).toBe(250);
    });

    it('worldToScreen should apply zoom scaling', () => {
      const result = worldToScreen(100, 100, 0, 0, 2, 800, 600);
      expect(result.x).toBe(600);
      expect(result.y).toBe(500);
    });

    it('screenToWorld should be inverse of worldToScreen at zoom 1', () => {
      const wx = 123, wy = -456;
      const screen = worldToScreen(wx, wy, 0, 0, 1, 800, 600);
      const result = screenToWorld(screen.x, screen.y, 0, 0, 1, 800, 600);
      expect(result.x).toBeCloseTo(wx);
      expect(result.y).toBeCloseTo(wy);
    });

    it('screenToWorld should be inverse of worldToScreen with zoom', () => {
      const wx = 50, wy = 75;
      const screen = worldToScreen(wx, wy, 10, -20, 2.5, 1024, 768);
      const result = screenToWorld(screen.x, screen.y, 10, -20, 2.5, 1024, 768);
      expect(result.x).toBeCloseTo(wx);
      expect(result.y).toBeCloseTo(wy);
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

  describe('unit conversions', () => {
    it('pixelsToKm should convert pixels to kilometers', () => {
      expect(pixelsToKm(PIXELS_PER_KM)).toBe(1);
      expect(pixelsToKm(0)).toBe(0);
      expect(pixelsToKm(PIXELS_PER_KM * 5.5)).toBe(5.5);
    });

    it('pixelsToKm should handle invalid inputs', () => {
      expect(pixelsToKm(-10)).toBe(0);
      expect(pixelsToKm('abc')).toBe(0);
    });

    it('kmToPixels should convert km to pixels', () => {
      expect(kmToPixels(1)).toBe(PIXELS_PER_KM);
      expect(kmToPixels(0)).toBe(0);
      expect(kmToPixels(3)).toBe(PIXELS_PER_KM * 3);
    });

    it('kmToPixels should handle invalid inputs', () => {
      expect(kmToPixels(-5)).toBe(0);
      expect(kmToPixels(null)).toBe(0);
    });
  });

  describe('distance calculations', () => {
    it('calculateTotalPixelDistance should sum Euclidean distances', () => {
      const pts = [
        { x: 0, y: 0 },
        { x: 3, y: 4 },
        { x: 3, y: 8 },
      ];
      expect(calculateTotalPixelDistance(pts)).toBeCloseTo(9);
    });

    it('calculateTotalPixelDistance should handle fewer than 2 points', () => {
      expect(calculateTotalPixelDistance([])).toBe(0);
      expect(calculateTotalPixelDistance([{ x: 0, y: 0 }])).toBe(0);
      expect(calculateTotalPixelDistance(null)).toBe(0);
    });

    it('calculateTotalKm should compute expected km', () => {
      const pts = [
        { x: 0, y: 0 },
        { x: PIXELS_PER_KM, y: 0 },
        { x: PIXELS_PER_KM, y: PIXELS_PER_KM },
      ];
      expect(calculateTotalKm(pts)).toBeCloseTo(2);
    });
  });

  describe('time and cost calculations', () => {
    it('calculateTimeMinutes should compute based on speed', () => {
      expect(calculateTimeMinutes(5, 'walk')).toBeCloseTo(60);
      expect(calculateTimeMinutes(15, 'bike')).toBeCloseTo(60);
      expect(calculateTimeMinutes(40, 'car')).toBeCloseTo(60);
    });

    it('calculateTimeMinutes should handle invalid inputs', () => {
      expect(calculateTimeMinutes(0, 'walk')).toBe(0);
      expect(calculateTimeMinutes(10, 'nonexistent')).toBe(0);
      expect(calculateTimeMinutes(-5, 'car')).toBe(0);
    });

    it('calculateCost should compute for car with tolls', () => {
      const km = 10;
      const expected = (km * 0.8) + (km * 0.8 * 0.3);
      expect(calculateCost(km, 'car')).toBeCloseTo(expected);
    });

    it('calculateCost should be 0 for walk and bike', () => {
      expect(calculateCost(100, 'walk')).toBe(0);
      expect(calculateCost(100, 'bike')).toBe(0);
    });

    it('calculateCost should handle invalid inputs', () => {
      expect(calculateCost(0, 'car')).toBe(0);
      expect(calculateCost(-5, 'car')).toBe(0);
      expect(calculateCost(10, null)).toBe(0);
    });
  });

  describe('formatting functions', () => {
    it('formatDistance should show meters for <1km', () => {
      expect(formatDistance(0.5)).toBe('500 m');
    });

    it('formatDistance should show 0 km for <=0', () => {
      expect(formatDistance(0)).toBe('0 km');
      expect(formatDistance(-5)).toBe('0 km');
    });

    it('formatDistance should show km for >=1km', () => {
      expect(formatDistance(1.234)).toBe('1.23 km');
      expect(formatDistance(5)).toBe('5.00 km');
    });

    it('formatTime should handle minutes', () => {
      expect(formatTime(0)).toBe('0 分钟');
      expect(formatTime(30)).toBe('30 分钟');
      expect(formatTime(59)).toBe('59 分钟');
    });

    it('formatTime should handle hours', () => {
      expect(formatTime(60)).toBe('1 小时');
      expect(formatTime(90)).toBe('1 小时 30 分钟');
      expect(formatTime(150)).toBe('2 小时 30 分钟');
    });

    it('formatCost should show 免费 for 0', () => {
      expect(formatCost(0)).toBe('免费');
    });

    it('formatCost should show yuan format', () => {
      expect(formatCost(15.5)).toBe('¥ 15.50');
    });

    it('formatDateTime should format timestamp', () => {
      const ts = new Date('2025-01-15T10:30:00Z').getTime();
      const result = formatDateTime(ts);
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    });

    it('formatDateTime should return empty for falsy', () => {
      expect(formatDateTime(0)).toBe('');
      expect(formatDateTime(null)).toBe('');
    });
  });

  describe('waypoint operations', () => {
    it('addWaypoint should insert new waypoint before end', () => {
      const initial = [
        { id: 's', name: 'S', x: 0, y: 0 },
        { id: 'e', name: 'E', x: 100, y: 100 },
      ];
      const result = addWaypoint(initial, { x: 50, y: 50 });
      expect(result.length).toBe(3);
      expect(result[1].x).toBe(50);
      expect(result[1].y).toBe(50);
      expect(result[1].id).toBeTruthy();
      expect(result[1].name).toContain('途经点');
      expect(initial.length).toBe(2);
    });

    it('addWaypoint should respect afterIndex', () => {
      const initial = [
        { id: 's', name: 'S', x: 0, y: 0 },
        { id: 'w1', name: 'W1', x: 10, y: 10 },
        { id: 'e', name: 'E', x: 100, y: 100 },
      ];
      const result = addWaypoint(initial, { x: 50, y: 50 }, 0);
      expect(result[1].x).toBe(50);
      expect(result[0].id).toBe('s');
      expect(result[2].id).toBe('w1');
      expect(result[3].id).toBe('e');
    });

    it('addWaypoint should ignore invalid position', () => {
      const initial = [{ id: 's' }, { id: 'e' }];
      const result = addWaypoint(initial, null);
      expect(result).toBe(initial);
    });

    it('updateWaypoint should update matching waypoint', () => {
      const wps = [{ id: 'a', x: 0, y: 0, name: 'Old' }];
      const updated = updateWaypoint(wps, 'a', { x: 10, y: 20, name: 'New' });
      expect(updated[0].x).toBe(10);
      expect(updated[0].name).toBe('New');
    });

    it('updateWaypoint should return original for non-existent id', () => {
      const wps = [{ id: 'a' }];
      expect(updateWaypoint(wps, 'x', { x: 1 })).toBe(wps);
    });

    it('removeWaypoint should remove middle waypoint', () => {
      const wps = [
        { id: 's' },
        { id: 'm1' },
        { id: 'm2' },
        { id: 'e' },
      ];
      const result = removeWaypoint(wps, 'm1');
      expect(result.length).toBe(3);
      expect(result.map((w) => w.id)).toEqual(['s', 'm2', 'e']);
    });

    it('removeWaypoint should not remove start or end', () => {
      const wps = [{ id: 's' }, { id: 'm' }, { id: 'e' }];
      expect(removeWaypoint(wps, 's').length).toBe(3);
      expect(removeWaypoint(wps, 'e').length).toBe(3);
    });

    it('reorderWaypoints should reorder middle waypoints', () => {
      const wps = [
        { id: 's' },
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
        { id: 'e' },
      ];
      const result = reorderWaypoints(wps, 1, 3);
      expect(result.map((w) => w.id)).toEqual(['s', 'b', 'c', 'a', 'e']);
    });

    it('reorderWaypoints should not touch first and last', () => {
      const wps = [{ id: 's' }, { id: 'a' }, { id: 'e' }];
      expect(reorderWaypoints(wps, 0, 1)).toBe(wps);
      expect(reorderWaypoints(wps, 2, 1)).toBe(wps);
    });

    it('moveWaypointUp and moveWaypointDown', () => {
      const wps = [
        { id: 's' },
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
        { id: 'e' },
      ];
      const up = moveWaypointUp(wps, 2);
      expect(up[1].id).toBe('b');
      expect(up[2].id).toBe('a');
      const down = moveWaypointDown(wps, 2);
      expect(down[2].id).toBe('c');
      expect(down[3].id).toBe('b');
    });
  });

  describe('validateWaypoints', () => {
    it('should validate with start and end', () => {
      const wps = [
        { id: 's', x: 0, y: 0 },
        { id: 'e', x: 1, y: 1 },
      ];
      expect(validateWaypoints(wps).valid).toBe(true);
    });

    it('should fail for single point', () => {
      const result = validateWaypoints([{ x: 0, y: 0 }]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeTruthy();
    });

    it('should fail for missing coordinates', () => {
      const result = validateWaypoints([
        { id: 's' },
        { id: 'e', x: 1, y: 1 },
      ]);
      expect(result.valid).toBe(false);
    });
  });

  describe('isWalkRecommended', () => {
    it('should return true for short distances', () => {
      expect(isWalkRecommended(3)).toBe(true);
      expect(isWalkRecommended(WALK_MAX_DISTANCE_KM)).toBe(true);
    });

    it('should return false for long distances', () => {
      expect(isWalkRecommended(WALK_MAX_DISTANCE_KM + 1)).toBe(false);
      expect(isWalkRecommended(10)).toBe(false);
    });
  });

  describe('calculateRoutes', () => {
    it('should generate routes for valid waypoints', () => {
      const routes = calculateRoutes(mockWaypoints, 'car');
      expect(Array.isArray(routes)).toBe(true);
      expect(routes.length).toBeGreaterThanOrEqual(2);
      expect(routes[0].name).toBeTruthy();
      expect(routes[0].distanceKm).toBeGreaterThan(0);
      expect(routes[0].timeMinutes).toBeGreaterThan(0);
      expect(routes[0].travelMode).toBe('car');
      expect(routes[0].path.length).toBeGreaterThan(2);
    });

    it('should include 3 routes for longer distances', () => {
      const longWps = [
        { id: 's', x: 0, y: 0 },
        { id: 'e', x: kmToPixels(10), y: kmToPixels(10) },
      ];
      const routes = calculateRoutes(longWps, 'car');
      expect(routes.length).toBe(3);
    });

    it('should return empty for invalid waypoints', () => {
      expect(calculateRoutes([], 'car')).toEqual([]);
      expect(calculateRoutes([{ x: 0, y: 0 }], 'car')).toEqual([]);
    });

    it('should include transfers for bus mode', () => {
      const routes = calculateRoutes(mockWaypoints, 'bus');
      expect(routes[0].transfers).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getLineDashPattern', () => {
    it('should return correct patterns', () => {
      expect(getLineDashPattern('solid')).toEqual([]);
      expect(getLineDashPattern('longdash')).toEqual([20, 10]);
      expect(getLineDashPattern('shortdash')).toEqual([10, 5]);
      expect(getLineDashPattern('dot')).toEqual([2, 4]);
      expect(getLineDashPattern('unknown')).toEqual([]);
    });
  });

  describe('getDirection', () => {
    it('should return cardinal directions', () => {
      expect(getDirection({ x: 0, y: 0 }, { x: 100, y: 0 })).toBe('向东');
      expect(getDirection({ x: 0, y: 0 }, { x: -100, y: 0 })).toBe('向西');
      expect(getDirection({ x: 0, y: 0 }, { x: 0, y: 100 })).toBe('向南');
      expect(getDirection({ x: 0, y: 0 }, { x: 0, y: -100 })).toBe('向北');
    });

    it('should return 原地 for same point', () => {
      expect(getDirection({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe('原地');
    });
  });

  describe('generateRouteText', () => {
    it('should generate route description text', () => {
      const route = calculateRoutes(mockWaypoints, 'car')[0];
      const text = generateRouteText(route);
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
      expect(text).toContain(route.name);
      expect(text).toContain('驾车');
      expect(text).toContain('全程');
      expect(text).toContain('预计时间');
    });

    it('should return empty for invalid route', () => {
      expect(generateRouteText(null)).toBe('');
      expect(generateRouteText({ waypoints: [] })).toBe('');
      expect(generateRouteText({ waypoints: [{ x: 0, y: 0 }] })).toBe('');
    });
  });

  describe('exportRouteToJSON and parseRouteFromJSON', () => {
    it('should export valid JSON', () => {
      const route = calculateRoutes(mockWaypoints, 'car')[0];
      const json = exportRouteToJSON(route);
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.version).toBe('1.0');
      expect(parsed.type).toBe('route');
      expect(parsed.route.name).toBe(route.name);
      expect(parsed.route.travelMode).toBe('car');
      expect(parsed.route.waypoints.length).toBe(mockWaypoints.length);
    });

    it('should roundtrip through parseRouteFromJSON', () => {
      const route = calculateRoutes(mockWaypoints, 'car')[0];
      const json = exportRouteToJSON(route);
      const parsed = parseRouteFromJSON(json);
      expect(parsed).not.toBeNull();
      expect(parsed.name).toBe(route.name);
      expect(parsed.distanceKm).toBe(route.distanceKm);
    });

    it('parseRouteFromJSON should return null for invalid', () => {
      expect(parseRouteFromJSON('not json')).toBeNull();
      expect(parseRouteFromJSON(JSON.stringify({ type: 'other' }))).toBeNull();
    });
  });

  describe('favorites storage', () => {
    let storage;
    beforeEach(() => {
      storage = createMockStorage();
    });

    it('loadFavorites should return empty for empty storage', () => {
      expect(loadFavorites(storage)).toEqual([]);
    });

    it('saveFavorites and loadFavorites should round-trip', () => {
      const fav = createFavorite({
        name: '测试路线',
        waypoints: mockWaypoints,
        travelMode: 'car',
      });
      saveFavorites([fav], storage);
      const loaded = loadFavorites(storage);
      expect(loaded.length).toBe(1);
      expect(loaded[0].name).toBe('测试路线');
    });

    it('loadFavorites should handle corrupted JSON', () => {
      storage.setItem(STORAGE_KEY_FAVORITES, '{bad json');
      expect(loadFavorites(storage)).toEqual([]);
    });

    it('loadFavorites should filter invalid entries', () => {
      storage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify([
        { id: 'v', name: 'OK', waypoints: [], createdAt: Date.now() },
        { name: 'no id', waypoints: [] },
        null,
        'string',
      ]));
      const loaded = loadFavorites(storage);
      expect(loaded.length).toBe(1);
    });

    it('should not throw when storage unavailable', () => {
      expect(() => loadFavorites(null)).not.toThrow();
      expect(() => saveFavorites([], null)).not.toThrow();
    });
  });

  describe('createFavorite', () => {
    it('should create valid favorite object', () => {
      const fav = createFavorite({
        name: '  我的路线  ',
        waypoints: mockWaypoints,
        travelMode: 'bike',
      });
      expect(typeof fav.id).toBe('string');
      expect(fav.name).toBe('我的路线');
      expect(fav.travelMode).toBe('bike');
      expect(fav.waypoints.length).toBe(mockWaypoints.length);
      expect(typeof fav.createdAt).toBe('number');
    });

    it('should create default favorite with no data', () => {
      const fav = createFavorite(null);
      expect(fav.name).toBe('未命名路线');
      expect(fav.travelMode).toBe('car');
      expect(Array.isArray(fav.waypoints)).toBe(true);
    });
  });

  describe('favorite CRUD', () => {
    it('addFavorite should append to array', () => {
      const result = addFavorite([], { id: 'a' });
      expect(result.length).toBe(1);
    });

    it('removeFavorite should remove by id', () => {
      const favs = [{ id: 'a' }, { id: 'b' }];
      const result = removeFavorite(favs, 'a');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('b');
    });

    it('updateFavorite should update matching entry', () => {
      const favs = [{ id: 'a', name: 'Old' }];
      const result = updateFavorite(favs, 'a', { name: 'New' });
      expect(result[0].name).toBe('New');
    });

    it('renameFavorite should update name', () => {
      const favs = [{ id: 'a', name: 'Old' }];
      const result = renameFavorite(favs, 'a', '  New Name  ');
      expect(result[0].name).toBe('New Name');
    });

    it('findFavoriteById should find or return null', () => {
      const favs = [{ id: 'a', name: 'A' }];
      expect(findFavoriteById(favs, 'a').name).toBe('A');
      expect(findFavoriteById(favs, 'x')).toBeNull();
    });
  });

  describe('searchFavorites and sortFavorites', () => {
    const favs = [
      { id: 'a', name: '上班路线', waypoints: [{ name: '家' }, { name: '公司' }], createdAt: 1000, distanceKm: 5 },
      { id: 'b', name: '周末骑行', waypoints: [{ name: '起点' }, { name: '公园' }], createdAt: 2000, distanceKm: 20 },
      { id: 'c', name: '公园散步', waypoints: [{ name: '小区' }, { name: '河边' }], createdAt: 1500, distanceKm: 3 },
    ];

    it('searchFavorites should search by name', () => {
      const result = searchFavorites(favs, '上班');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('a');
    });

    it('searchFavorites should search by waypoint names', () => {
      const result = searchFavorites(favs, '公园');
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('searchFavorites should return all for empty', () => {
      expect(searchFavorites(favs, '').length).toBe(3);
    });

    it('sortFavorites should sort by time desc', () => {
      const byTime = sortFavorites(favs, 'time');
      expect(byTime.map((f) => f.id)).toEqual(['b', 'c', 'a']);
    });

    it('sortFavorites should sort by distance desc', () => {
      const byDist = sortFavorites(favs, 'distance');
      expect(byDist.map((f) => f.id)).toEqual(['b', 'a', 'c']);
    });

    it('sortFavorites should not mutate original', () => {
      const sorted = sortFavorites(favs, 'time');
      expect(sorted).not.toBe(favs);
    });
  });

  describe('getFavoriteSummary', () => {
    it('should return start to end summary', () => {
      const fav = { waypoints: [{ name: '家' }, { name: '公园' }, { name: '公司' }] };
      expect(getFavoriteSummary(fav)).toBe('家 → 公司');
    });

    it('should handle missing waypoints', () => {
      expect(getFavoriteSummary(null)).toBe('暂无路线');
      expect(getFavoriteSummary({ waypoints: [] })).toBe('暂无路线');
    });
  });

  describe('initializeDefaultWaypoints', () => {
    it('should return waypoints with generated ids', () => {
      const wps = initializeDefaultWaypoints();
      expect(Array.isArray(wps)).toBe(true);
      expect(wps.length).toBe(DEFAULT_WAYPOINTS.length);
      wps.forEach((w) => {
        expect(typeof w.id).toBe('string');
        expect(w.id.length).toBeGreaterThan(0);
      });
    });
  });

  describe('last state persistence', () => {
    let storage;
    beforeEach(() => {
      storage = createMockStorage();
    });

    it('saveLastState and loadLastState should round-trip', () => {
      const state = {
        waypoints: mockWaypoints,
        travelMode: 'bike',
        center: { x: 50, y: 50 },
        zoom: 1.5,
      };
      saveLastState(state, storage);
      const loaded = loadLastState(storage);
      expect(loaded).not.toBeNull();
      expect(loaded.travelMode).toBe('bike');
      expect(loaded.zoom).toBe(1.5);
      expect(loaded.center.x).toBe(50);
      expect(loaded.waypoints.length).toBe(mockWaypoints.length);
    });

    it('loadLastState should return null for empty', () => {
      expect(loadLastState(storage)).toBeNull();
    });
  });

  describe('TRAVEL_MODES sanity', () => {
    it('should have all 4 transport modes', () => {
      expect(TRAVEL_MODES.car).toBeTruthy();
      expect(TRAVEL_MODES.bus).toBeTruthy();
      expect(TRAVEL_MODES.bike).toBeTruthy();
      expect(TRAVEL_MODES.walk).toBeTruthy();
      expect(TRAVEL_MODES.walk.speedKmh).toBe(5);
      expect(TRAVEL_MODES.bike.speedKmh).toBe(15);
      expect(TRAVEL_MODES.car.speedKmh).toBe(40);
      expect(TRAVEL_MODES.bus.speedKmh).toBe(25);
    });
  });

  describe('downloadJSON', () => {
    let originalBlob;
    let originalURL;
    let originalDocument;
    let originalWindow;
    let createObjectURLSpy;
    let revokeObjectURLSpy;
    let createElementSpy;
    let appendChildSpy;
    let removeChildSpy;
    let clickSpy;
    let blobSpy;

    beforeEach(() => {
      clickSpy = vi.fn();
      createElementSpy = vi.fn(() => ({
        href: '',
        download: '',
        click: clickSpy,
        style: {},
      }));
      appendChildSpy = vi.fn();
      removeChildSpy = vi.fn();
      createObjectURLSpy = vi.fn(() => 'blob:test-url');
      revokeObjectURLSpy = vi.fn();
      blobSpy = vi.fn(function(content, opts) {
        return { content, opts, size: content.length, type: opts ? opts.type : '' };
      });

      originalBlob = global.Blob;
      originalURL = global.URL;
      originalDocument = global.document;
      originalWindow = global.window;

      Object.defineProperty(global, 'Blob', { value: blobSpy, writable: true, configurable: true });
      Object.defineProperty(global, 'URL', {
        value: {
          createObjectURL: createObjectURLSpy,
          revokeObjectURL: revokeObjectURLSpy,
        },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'document', {
        value: {
          createElement: createElementSpy,
          body: {
            appendChild: appendChildSpy,
            removeChild: removeChildSpy,
          },
        },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'window', {
        value: {
          Blob: blobSpy,
          URL: global.URL,
          document: global.document,
        },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, 'Blob', { value: originalBlob, writable: true, configurable: true });
      Object.defineProperty(global, 'URL', { value: originalURL, writable: true, configurable: true });
      Object.defineProperty(global, 'document', { value: originalDocument, writable: true, configurable: true });
      Object.defineProperty(global, 'window', { value: originalWindow, writable: true, configurable: true });
    });

    it('should return false when window is undefined', () => {
      Object.defineProperty(global, 'window', { value: undefined, writable: true, configurable: true });
      const result = downloadJSON('{}', 'test.json');
      expect(result).toBe(false);
    });

    it('should create Blob with JSON content and correct type', () => {
      downloadJSON('{"key":"value"}', 'data.json');
      expect(blobSpy).toHaveBeenCalledWith(
        ['{"key":"value"}'],
        { type: 'application/json' }
      );
    });

    it('should create object URL from Blob', () => {
      downloadJSON('{}', 'route.json');
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    });

    it('should create anchor element with correct attributes', () => {
      downloadJSON('{"a":1}', 'custom.json');
      expect(createElementSpy).toHaveBeenCalledWith('a');
      const mockAnchor = createElementSpy.mock.results[0].value;
      expect(mockAnchor.href).toBe('blob:test-url');
      expect(mockAnchor.download).toBe('custom.json');
    });

    it('should use default filename when not provided', () => {
      downloadJSON('{}');
      const mockAnchor = createElementSpy.mock.results[0].value;
      expect(mockAnchor.download).toBe('route.json');
    });

    it('should trigger click on anchor, append and remove from body', () => {
      downloadJSON('{}', 'test.json');
      const mockAnchor = createElementSpy.mock.results[0].value;
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
      expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
    });

    it('should revoke object URL after download', () => {
      downloadJSON('{}', 'test.json');
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');
    });

    it('should return true on successful download', () => {
      const result = downloadJSON('{}', 'test.json');
      expect(result).toBe(true);
    });

    it('should catch and handle exceptions, returning false', () => {
      createElementSpy.mockImplementation(() => {
        throw new Error('DOM error');
      });
      const result = downloadJSON('{}', 'test.json');
      expect(result).toBe(false);
      expect(() => downloadJSON('{}', 'test.json')).not.toThrow();
    });

    it('should handle Blob constructor throwing', () => {
      blobSpy.mockImplementation(() => {
        throw new Error('Blob error');
      });
      const result = downloadJSON('{}', 'test.json');
      expect(result).toBe(false);
      expect(() => downloadJSON('{}', 'test.json')).not.toThrow();
    });

    it('should handle revokeObjectURL throwing gracefully', () => {
      revokeObjectURLSpy.mockImplementation(() => {
        throw new Error('Revoke error');
      });
      const result = downloadJSON('{}', 'test.json');
      expect(result).toBe(false);
      expect(() => downloadJSON('{}', 'test.json')).not.toThrow();
    });
  });

  describe('copyToClipboard', () => {
    let originalNavigator;

    beforeEach(() => {
      originalNavigator = global.navigator;
    });

    afterEach(() => {
      Object.defineProperty(global, 'navigator', { value: originalNavigator, writable: true, configurable: true });
    });

    it('should return false when navigator is undefined', async () => {
      Object.defineProperty(global, 'navigator', { value: undefined, writable: true, configurable: true });
      const result = await copyToClipboard('test');
      expect(result).toBe(false);
    });

    it('should return false when navigator.clipboard is unavailable', async () => {
      Object.defineProperty(global, 'navigator', { value: {}, writable: true, configurable: true });
      const result = await copyToClipboard('test');
      expect(result).toBe(false);
    });

    it('should call clipboard.writeText with correct content', async () => {
      const writeTextSpy = vi.fn(() => Promise.resolve(undefined));
      Object.defineProperty(global, 'navigator', {
        value: { clipboard: { writeText: writeTextSpy } },
        writable: true,
        configurable: true,
      });
      await copyToClipboard('hello world');
      expect(writeTextSpy).toHaveBeenCalledWith('hello world');
    });

    it('should return true on successful copy', async () => {
      Object.defineProperty(global, 'navigator', {
        value: { clipboard: { writeText: vi.fn(() => Promise.resolve(undefined)) } },
        writable: true,
        configurable: true,
      });
      const result = await copyToClipboard('content');
      expect(result).toBe(true);
    });

    it('should return false and not throw when writeText rejects', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          clipboard: {
            writeText: vi.fn(() => Promise.reject(new Error('Permission denied'))),
          },
        },
        writable: true,
        configurable: true,
      });
      await expect(async () => {
        await copyToClipboard('text');
      }).not.toThrow();
      const result = await copyToClipboard('text');
      expect(result).toBe(false);
    });

    it('should handle copy with empty string', async () => {
      const writeTextSpy = vi.fn(() => Promise.resolve(undefined));
      Object.defineProperty(global, 'navigator', {
        value: { clipboard: { writeText: writeTextSpy } },
        writable: true,
        configurable: true,
      });
      const result = await copyToClipboard('');
      expect(writeTextSpy).toHaveBeenCalledWith('');
      expect(result).toBe(true);
    });

    it('should handle copy with special characters', async () => {
      const writeTextSpy = vi.fn(() => Promise.resolve(undefined));
      Object.defineProperty(global, 'navigator', {
        value: { clipboard: { writeText: writeTextSpy } },
        writable: true,
        configurable: true,
      });
      const special = '测试\n换行\t制表符 & 特殊 <符号>';
      const result = await copyToClipboard(special);
      expect(writeTextSpy).toHaveBeenCalledWith(special);
      expect(result).toBe(true);
    });

    it('should catch generic exceptions from clipboard API', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          clipboard: {
            writeText: vi.fn(() => {
              throw new Error('Corrupted clipboard');
            }),
          },
        },
        configurable: true,
        writable: true,
      });
      await expect(async () => {
        await copyToClipboard('text');
      }).not.toThrow();
      const result = await copyToClipboard('text');
      expect(result).toBe(false);
    });
  });
});
