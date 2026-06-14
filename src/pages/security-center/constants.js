export const STORAGE_KEY_DEVICES = 'security_center_devices'
export const STORAGE_KEY_TWOFA = 'security_center_twofa'
export const STORAGE_KEY_OPERATIONS = 'security_center_operations'
export const STORAGE_KEY_FREQUENT_LOCATIONS = 'security_center_frequent_locations'

export const FREQUENT_CITY = '北京市'
export const DEFAULT_FREQUENT_LOCATIONS = ['北京市']

export const PASSWORD_STRENGTH = {
  VERY_WEAK: { label: '弱', level: 1, stars: 1, color: '#ef4444' },
  WEAK: { label: '弱', level: 1, stars: 1, color: '#ef4444' },
  MEDIUM: { label: '中', level: 2, stars: 2, color: '#f59e0b' },
  STRONG: { label: '强', level: 3, stars: 4, color: '#3b82f6' },
  VERY_STRONG: { label: '很强', level: 4, stars: 5, color: '#10b981' },
}

export const SCORE_COLORS = {
  EXCELLENT: '#10b981',
  GOOD: '#3b82f6',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
}

export const SCORE_WEIGHTS = {
  PASSWORD: 30,
  TWOFA: 30,
  REMOTE_LOGIN: 20,
  ANOMALY: 20,
}

export const OPERATION_TYPES = {
  LOGIN: '登录',
  PASSWORD_CHANGE: '密码修改',
  DEVICE_LOGOUT: '设备下线',
  TWOFA_ENABLE: '两步验证开启',
  TWOFA_DISABLE: '两步验证关闭',
  SETTINGS_CHANGE: '安全设置修改',
}

export const OPERATION_RESULTS = {
  SUCCESS: '成功',
  FAILURE: '失败',
}

export const CITIES = [
  '北京市', '上海市', '广州市', '深圳市', '杭州市',
  '成都市', '南京市', '武汉市', '西安市', '重庆市',
  '天津市', '苏州市', '郑州市', '长沙市', '沈阳市',
  '青岛市', '宁波市', '东莞市', '无锡市', '昆明市',
]

export const DEVICE_NAMES = [
  'Windows PC', 'MacBook Pro', 'iPhone 15', 'Galaxy S24',
  'iPad Air', 'ThinkPad X1', 'Surface Pro', '小米 14',
]

export const OS_LIST = [
  'Windows 11', 'macOS Sonoma', 'iOS 17', 'Android 14',
  'Windows 10', 'macOS Ventura', 'iPadOS 17',
]

export const BROWSER_LIST = [
  'Chrome 120', 'Edge 120', 'Safari 17', 'Firefox 121',
]

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50]

export const WEAK_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', 'master', 'dragon', 'login', 'princess',
  'football', 'shadow', 'sunshine', 'trustno1', 'iloveyou',
  'batman', 'access', 'hello', 'charlie', 'donald',
  'password1', 'qwerty123', 'letmein', 'welcome', 'admin',
]

export const OPERATION_TYPE_LABEL = {
  LOGIN: '登录',
  PASSWORD_CHANGE: '密码修改',
  DEVICE_LOGOUT: '设备下线',
  TWOFA_ENABLE: '两步验证开启',
  TWOFA_DISABLE: '两步验证关闭',
  SETTINGS_CHANGE: '安全设置修改',
}

export const OPERATION_RESULT_LABEL = {
  SUCCESS: '成功',
  FAILURE: '失败',
}

export const OPERATION_RESULT_COLOR = {
  SUCCESS: '#10b981',
  FAILURE: '#ef4444',
}
