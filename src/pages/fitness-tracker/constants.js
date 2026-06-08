export const STORAGE_KEY_RECORDS = 'fitness_records'
export const STORAGE_KEY_GOALS = 'fitness_goals'

export const SPORT_TYPES = [
  { key: 'running', label: '跑步', icon: '🏃', met: 9.8, hasDistance: true },
  { key: 'swimming', label: '游泳', icon: '🏊', met: 8.0, hasDistance: true },
  { key: 'cycling', label: '骑行', icon: '🚴', met: 7.5, hasDistance: true },
  { key: 'jumpRope', label: '跳绳', icon: '🪢', met: 12.0, hasDistance: false },
  { key: 'fitness', label: '健身', icon: '🏋️', met: 6.0, hasDistance: false },
  { key: 'yoga', label: '瑜伽', icon: '🧘', met: 2.5, hasDistance: false },
  { key: 'basketball', label: '篮球', icon: '🏀', met: 8.0, hasDistance: false },
  { key: 'football', label: '足球', icon: '⚽', met: 10.0, hasDistance: false },
]

export const SPORT_MAP = SPORT_TYPES.reduce((map, sport) => {
  map[sport.key] = sport
  return map
}, {})

export const SPORT_KEYS = SPORT_TYPES.map((s) => s.key)

export const PAGE_SIZE = 10

export const DEFAULT_GOALS = {
  dailyMinutes: 30,
  weeklySessions: 3,
}

export const DEFAULT_BODY_WEIGHT = 60
