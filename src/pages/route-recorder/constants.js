export const STORAGE_KEY = 'route-recorder-favorites'

export const MIN_ZOOM = 0.3
export const MAX_ZOOM = 3.0
export const DEFAULT_ZOOM = 1.0
export const ZOOM_STEP = 0.1

export const DEFAULT_CENTER = { x: 0, y: 0 }

export const PIXELS_PER_METER = 1 / 50
export const METERS_PER_PIXEL = 50

export const TRAVEL_MODES = {
  walk: { label: '步行', speedKmh: 5, emoji: '🚶' },
  bike: { label: '骑行', speedKmh: 15, emoji: '🚴' },
  car: { label: '驾车', speedKmh: 40, emoji: '🚗' },
}

export const MARKER_COLORS = {
  start: '#22c55e',
  end: '#ef4444',
  waypoint: '#3b82f6',
}

export const MARKER_RADIUS = 14

export const MAX_WAYPOINTS = 10

export const GRID_SPACING = 80
export const MAP_BACKGROUND = '#e8f5e9'
export const ROAD_COLOR = '#90a4ae'
export const ROAD_MAJOR_COLOR = '#78909c'

export const SORT_OPTIONS = {
  time: { label: '按创建时间', value: 'time' },
  distance: { label: '按距离', value: 'distance' },
}

export const ELEVATION_MIN = 100
export const ELEVATION_MAX = 800
export const ELEVATION_START_MIN = 100
export const ELEVATION_START_MAX = 500
