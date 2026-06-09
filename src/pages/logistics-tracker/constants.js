export const EXPRESS_COMPANIES = [
  { id: 'sf', name: '顺丰速运' },
  { id: 'yt', name: '圆通速递' },
  { id: 'zt', name: '中通快递' },
  { id: 'yd', name: '韵达快递' },
  { id: 'jd', name: '京东物流' },
  { id: 'ems', name: 'EMS' },
]

export const STATUS_TYPES = {
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  ARRIVED: 'arrived',
  DELIVERING: 'delivering',
  SIGNED: 'signed',
  EXCEPTION: 'exception',
}

export const STATUS_META = {
  [STATUS_TYPES.PICKED_UP]: { label: '已揽收', icon: '📦', color: '#1890ff' },
  [STATUS_TYPES.IN_TRANSIT]: { label: '运输中', icon: '🚚', color: '#52c41a' },
  [STATUS_TYPES.ARRIVED]: { label: '到达网点', icon: '🏢', color: '#faad14' },
  [STATUS_TYPES.DELIVERING]: { label: '派送中', icon: '🛵', color: '#722ed1' },
  [STATUS_TYPES.SIGNED]: { label: '已签收', icon: '✅', color: '#52c41a' },
  [STATUS_TYPES.EXCEPTION]: { label: '异常', icon: '⚠️', color: '#f5222d' },
}

export const EXCEPTION_REASONS = {
  DELAYED: '包裹滞留，延迟派送',
  RETURNED: '包裹退回',
  DAMAGED: '包裹破损',
  BAD_ADDRESS: '地址不详，无法派送',
  REFUSED: '收件人拒收',
  LOST: '包裹丢失',
}

export const STORAGE_KEY = 'logistics_query_history'
export const MAX_HISTORY = 10

export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 500

export const CITY_COORDINATES = {
  '北京': { x: 580, y: 130 },
  '上海': { x: 620, y: 280 },
  '广州': { x: 500, y: 420 },
  '深圳': { x: 490, y: 430 },
  '杭州': { x: 600, y: 300 },
  '成都': { x: 350, y: 300 },
  '武汉': { x: 500, y: 290 },
  '西安': { x: 420, y: 230 },
  '南京': { x: 590, y: 280 },
  '重庆': { x: 380, y: 320 },
  '天津': { x: 590, y: 140 },
  '苏州': { x: 610, y: 290 },
  '青岛': { x: 600, y: 190 },
  '长沙': { x: 480, y: 340 },
  '郑州': { x: 510, y: 220 },
  '东莞': { x: 500, y: 425 },
  '沈阳': { x: 650, y: 90 },
  '合肥': { x: 560, y: 280 },
  '济南': { x: 570, y: 180 },
  '厦门': { x: 550, y: 410 },
}
