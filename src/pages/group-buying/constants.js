export const GROUP_BUYING_STATUS = {
  ONGOING: 'ongoing',
  SUCCESS: 'success',
  FAILED: 'failed',
}

export const GROUP_BUYING_STATUS_LABELS = {
  [GROUP_BUYING_STATUS.ONGOING]: '进行中',
  [GROUP_BUYING_STATUS.SUCCESS]: '拼团成功',
  [GROUP_BUYING_STATUS.FAILED]: '拼团失败',
}

export const SORT_TYPE = {
  LATEST: 'latest',
  TIME_LEFT: 'time_left',
  MOST_PEOPLE: 'most_people',
}

export const SORT_TYPE_LABELS = {
  [SORT_TYPE.LATEST]: '最新发起',
  [SORT_TYPE.TIME_LEFT]: '剩余时间最少',
  [SORT_TYPE.MOST_PEOPLE]: '人数最多',
}

export const STORAGE_KEYS = {
  GROUPS: 'group_buying_groups',
  USER_RECORDS: 'group_buying_user_records',
  CURRENT_USER: 'group_buying_current_user',
}

export const PRODUCTS = [
  {
    id: 'p1',
    name: '无线蓝牙耳机 Pro',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wireless%20bluetooth%20earbuds%20product%20photo%20white%20background&image_size=square',
    originalPrice: 299,
    groupPrice: 159,
    groupSize: 5,
    description: '主动降噪，续航30小时，高清音质',
  },
  {
    id: 'p2',
    name: '智能运动手环',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20fitness%20band%20product%20photo%20white%20background&image_size=square',
    originalPrice: 199,
    groupPrice: 89,
    groupSize: 10,
    description: '心率监测，睡眠追踪，50米防水',
  },
  {
    id: 'p3',
    name: '便携蓝牙音箱',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portable%20bluetooth%20speaker%20product%20photo%20white%20background&image_size=square',
    originalPrice: 259,
    groupPrice: 129,
    groupSize: 8,
    description: '360度环绕音效，IPX7防水，12小时续航',
  },
]

export const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="20" fill="%23ddd"/><ellipse cx="50" cy="85" rx="30" ry="25" fill="%23ddd"/></svg>'

export const FAILED_REASON = {
  TIMEOUT: '超时未满员',
}

export const ACTIVITY_DURATION_HOURS = 24

export const REFRESH_INTERVAL_MS = 5000

export const COUNTDOWN_WARNING_THRESHOLD_MS = 30 * 60 * 1000

export const PROGRESS_WARNING_THRESHOLD = 80

export const PROGRESS_COMPLETE_THRESHOLD = 100
