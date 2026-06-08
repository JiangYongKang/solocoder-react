export const STORAGE_KEY = 'solocoder-meeting-room-bookings'

export const CURRENT_USER_KEY = 'solocoder-meeting-room-current-user'

export const DEFAULT_CURRENT_USER = '张三'

export const MEETING_ROOMS = [
  { id: 'A', name: '会议室 A', capacity: 8 },
  { id: 'B', name: '会议室 B', capacity: 12 },
  { id: 'C', name: '会议室 C', capacity: 20 },
]

export const START_HOUR = 8
export const END_HOUR = 20

export const VIEW_MODES = {
  GRID: 'grid',
  MY_BOOKINGS: 'my_bookings',
  ALL_BOOKINGS: 'all_bookings',
}

export const VIEW_MODE_LABELS = {
  [VIEW_MODES.GRID]: '时间网格',
  [VIEW_MODES.MY_BOOKINGS]: '我的预约',
  [VIEW_MODES.ALL_BOOKINGS]: '全部预约',
}
