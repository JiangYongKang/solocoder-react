export const FAVORITES_STORAGE_KEY = 'weather_favorites'
export const HISTORY_STORAGE_KEY = 'weather_history'
export const MAX_HISTORY_ITEMS = 10

export const WEATHER_TYPES = {
  SUNNY: 'sunny',
  CLOUDY: 'cloudy',
  RAINY: 'rainy',
  SNOWY: 'snowy',
}

export const WEATHER_ICONS = {
  [WEATHER_TYPES.SUNNY]: '☀️',
  [WEATHER_TYPES.CLOUDY]: '⛅',
  [WEATHER_TYPES.RAINY]: '🌧️',
  [WEATHER_TYPES.SNOWY]: '❄️',
}

export const WEATHER_LABELS = {
  [WEATHER_TYPES.SUNNY]: '晴',
  [WEATHER_TYPES.CLOUDY]: '多云',
  [WEATHER_TYPES.RAINY]: '雨',
  [WEATHER_TYPES.SNOWY]: '雪',
}

export const WEATHER_THEMES = {
  [WEATHER_TYPES.SUNNY]: {
    from: '#ff9a56',
    via: '#ff6a88',
    to: '#ff99ac',
    text: '#4a2c00',
    cardBg: 'rgba(255, 255, 255, 0.85)',
  },
  [WEATHER_TYPES.CLOUDY]: {
    from: '#8e9eab',
    via: '#a3b1bf',
    to: '#c5d0dc',
    text: '#2c3e50',
    cardBg: 'rgba(255, 255, 255, 0.85)',
  },
  [WEATHER_TYPES.RAINY]: {
    from: '#373b44',
    via: '#4a5568',
    to: '#5a6778',
    text: '#e2e8f0',
    cardBg: 'rgba(255, 255, 255, 0.15)',
  },
  [WEATHER_TYPES.SNOWY]: {
    from: '#e6dada',
    via: '#f0f4f8',
    to: '#ffffff',
    text: '#2c5282',
    cardBg: 'rgba(255, 255, 255, 0.9)',
  },
}

export const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export const CITIES = [
  { id: '1', name: '北京', province: '北京市' },
  { id: '2', name: '上海', province: '上海市' },
  { id: '3', name: '广州', province: '广东省' },
  { id: '4', name: '深圳', province: '广东省' },
  { id: '5', name: '杭州', province: '浙江省' },
  { id: '6', name: '南京', province: '江苏省' },
  { id: '7', name: '成都', province: '四川省' },
  { id: '8', name: '重庆', province: '重庆市' },
  { id: '9', name: '武汉', province: '湖北省' },
  { id: '10', name: '西安', province: '陕西省' },
  { id: '11', name: '苏州', province: '江苏省' },
  { id: '12', name: '天津', province: '天津市' },
  { id: '13', name: '长沙', province: '湖南省' },
  { id: '14', name: '青岛', province: '山东省' },
  { id: '15', name: '大连', province: '辽宁省' },
  { id: '16', name: '厦门', province: '福建省' },
  { id: '17', name: '福州', province: '福建省' },
  { id: '18', name: '济南', province: '山东省' },
  { id: '19', name: '郑州', province: '河南省' },
  { id: '20', name: '合肥', province: '安徽省' },
  { id: '21', name: '昆明', province: '云南省' },
  { id: '22', name: '贵阳', province: '贵州省' },
  { id: '23', name: '南宁', province: '广西壮族自治区' },
  { id: '24', name: '哈尔滨', province: '黑龙江省' },
  { id: '25', name: '沈阳', province: '辽宁省' },
  { id: '26', name: '长春', province: '吉林省' },
  { id: '27', name: '石家庄', province: '河北省' },
  { id: '28', name: '太原', province: '山西省' },
  { id: '29', name: '南昌', province: '江西省' },
  { id: '30', name: '兰州', province: '甘肃省' },
]
