export const STORAGE_KEY_FAVORITES = 'solocoder_route_planner_favorites';
export const STORAGE_KEY_LAST_STATE = 'solocoder_route_planner_last_state';

export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 3;
export const DEFAULT_ZOOM = 1;
export const ZOOM_STEP = 0.1;

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const DEFAULT_CENTER = { x: 0, y: 0 };

export const PIXELS_PER_KM = 100;

export const TRAVEL_MODES = {
  car: {
    key: 'car',
    name: '驾车',
    icon: '🚗',
    speedKmh: 40,
    costPerKm: 0.8,
    tollFactor: 0.3,
    lineStyle: 'solid',
    color: '#3B82F6',
  },
  bus: {
    key: 'bus',
    name: '公交',
    icon: '🚌',
    speedKmh: 25,
    costPerKm: 0.15,
    tollFactor: 0,
    lineStyle: 'longdash',
    color: '#F59E0B',
  },
  bike: {
    key: 'bike',
    name: '骑行',
    icon: '🚴',
    speedKmh: 15,
    costPerKm: 0,
    tollFactor: 0,
    lineStyle: 'shortdash',
    color: '#10B981',
  },
  walk: {
    key: 'walk',
    name: '步行',
    icon: '🚶',
    speedKmh: 5,
    costPerKm: 0,
    tollFactor: 0,
    lineStyle: 'dot',
    color: '#EF4444',
  },
};

export const WALK_MAX_DISTANCE_KM = 5;

export const ROUTE_COLORS = {
  recommended: '#3B82F6',
  shortest: '#10B981',
  economic: '#F59E0B',
};

export const ROUTE_TYPES = [
  { key: 'recommended', name: '推荐路线' },
  { key: 'shortest', name: '最短路径' },
  { key: 'economic', name: '经济路线' },
];

export const MAP_ELEMENTS = {
  buildings: [
    { id: 'b1', name: '火车站', x: -300, y: -200, width: 120, height: 80, color: '#6366F1' },
    { id: 'b2', name: '机场', x: 400, y: -350, width: 160, height: 100, color: '#8B5CF6' },
    { id: 'b3', name: '市中心', x: 0, y: 0, width: 100, height: 100, color: '#EC4899' },
    { id: 'b4', name: '科技园', x: 350, y: 200, width: 140, height: 90, color: '#14B8A6' },
    { id: 'b5', name: '大学城', x: -400, y: 250, width: 130, height: 110, color: '#F97316' },
  ],
  mainRoads: [
    { id: 'r1', points: [{ x: -500, y: 0 }, { x: 500, y: 0 }], width: 8, color: '#94A3B8' },
    { id: 'r2', points: [{ x: 0, y: -400 }, { x: 0, y: 400 }], width: 8, color: '#94A3B8' },
    { id: 'r3', points: [{ x: -400, y: -300 }, { x: 400, y: 300 }], width: 6, color: '#A1A1AA' },
    { id: 'r4', points: [{ x: -300, y: 300 }, { x: 300, y: -300 }], width: 6, color: '#A1A1AA' },
  ],
  minorRoads: [
    { id: 'mr1', points: [{ x: -250, y: 0 }, { x: -250, y: 200 }, { x: 0, y: 200 }], width: 3, color: '#CBD5E1' },
    { id: 'mr2', points: [{ x: 250, y: 0 }, { x: 250, y: -200 }, { x: 0, y: -200 }], width: 3, color: '#CBD5E1' },
    { id: 'mr3', points: [{ x: 0, y: -150 }, { x: 200, y: -150 }, { x: 200, y: 100 }], width: 3, color: '#CBD5E1' },
    { id: 'mr4', points: [{ x: 0, y: 150 }, { x: -200, y: 150 }, { x: -200, y: -100 }], width: 3, color: '#CBD5E1' },
    { id: 'mr5', points: [{ x: -350, y: 100 }, { x: -350, y: 350 }, { x: -100, y: 350 }], width: 3, color: '#CBD5E1' },
    { id: 'mr6', points: [{ x: 350, y: -100 }, { x: 350, y: -350 }, { x: 100, y: -350 }], width: 3, color: '#CBD5E1' },
  ],
  rivers: [
    { id: 'rv1', points: [{ x: -500, y: -250 }, { x: -200, y: -180 }, { x: 100, y: -120 }, { x: 300, y: -50 }, { x: 500, y: 80 }] },
  ],
  parks: [
    { id: 'p1', x: -150, y: 80, width: 80, height: 60, color: '#86EFAC' },
    { id: 'p2', x: 180, y: -250, width: 100, height: 70, color: '#86EFAC' },
    { id: 'p3', x: 50, y: 280, width: 90, height: 65, color: '#86EFAC' },
  ],
};

export const WAYPOINT_DEFAULT_NAMES = ['起点', '途经点', '终点'];

export const DEFAULT_WAYPOINTS = [
  { id: 'start', name: '家', x: -350, y: 150 },
  { id: 'end', name: '公司', x: 300, y: 180 },
];
