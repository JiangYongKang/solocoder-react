export const STORAGE_KEY_POINTS = 'solocoder_points_balance'
export const STORAGE_KEY_HISTORY = 'solocoder_points_history'
export const STORAGE_KEY_ORDERS = 'solocoder_points_orders'
export const STORAGE_KEY_PRODUCTS = 'solocoder_points_products'
export const STORAGE_KEY_USER_PRODUCT_LIMITS = 'solocoder_points_user_limits'

export const DEFAULT_POINTS = 5000

export const POINTS_VALIDITY_DAYS = 365
export const EXPIRE_WARNING_DAYS = 30

export const TRANSACTION_TYPES = {
  EARN: 'earn',
  EXCHANGE: 'exchange',
  EXPIRE: 'expire',
  ADJUST: 'adjust',
}

export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.EARN]: '获取',
  [TRANSACTION_TYPES.EXCHANGE]: '兑换',
  [TRANSACTION_TYPES.EXPIRE]: '过期',
  [TRANSACTION_TYPES.ADJUST]: '调整',
}

export const TRANSACTION_TYPE_COLORS = {
  [TRANSACTION_TYPES.EARN]: '#10b981',
  [TRANSACTION_TYPES.EXCHANGE]: '#ef4444',
  [TRANSACTION_TYPES.EXPIRE]: '#6b7280',
  [TRANSACTION_TYPES.ADJUST]: '#f59e0b',
}

export const TRANSACTION_TYPE_ICONS = {
  [TRANSACTION_TYPES.EARN]: '⬆️',
  [TRANSACTION_TYPES.EXCHANGE]: '⬇️',
  [TRANSACTION_TYPES.EXPIRE]: '⏰',
  [TRANSACTION_TYPES.ADJUST]: '⚙️',
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
}

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: '待发货',
  [ORDER_STATUS.SHIPPED]: '已发货',
  [ORDER_STATUS.COMPLETED]: '已完成',
}

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: '#f59e0b',
  [ORDER_STATUS.SHIPPED]: '#3b82f6',
  [ORDER_STATUS.COMPLETED]: '#10b981',
}

export const POINTS_RULES = [
  { id: 'checkin', name: '每日签到', points: 10, desc: '每日首次签到可获得积分' },
  { id: 'consume', name: '消费返积分', points: 1, desc: '每消费1元可获得1积分' },
  { id: 'invite', name: '邀请好友', points: 100, desc: '成功邀请好友注册可获得积分' },
  { id: 'review', name: '发表评价', points: 20, desc: '完成订单后发表评价可获得积分' },
  { id: 'share', name: '分享活动', points: 15, desc: '分享平台活动至社交平台可获得积分' },
  { id: 'birthday', name: '生日福利', points: 500, desc: '生日当天可领取积分福利' },
]

export const MOCK_PRODUCTS = [
  {
    id: 'p_001',
    name: '精美马克杯',
    emoji: '☕',
    points: 500,
    stock: 50,
    limitPerUser: 3,
    description: '陶瓷马克杯，容量350ml，多种颜色可选',
  },
  {
    id: 'p_002',
    name: '蓝牙耳机',
    emoji: '🎧',
    points: 2000,
    stock: 20,
    limitPerUser: 1,
    description: 'TWS真无线蓝牙耳机，降噪功能',
  },
  {
    id: 'p_003',
    name: '笔记本套装',
    emoji: '📒',
    points: 800,
    stock: 30,
    limitPerUser: 2,
    description: '高级笔记本+签字笔套装，商务办公首选',
  },
  {
    id: 'p_004',
    name: '电影券',
    emoji: '🎬',
    points: 1500,
    stock: 100,
    limitPerUser: 5,
    description: '全国通用电影兑换券，2D/3D通兑',
  },
  {
    id: 'p_005',
    name: '咖啡券',
    emoji: '☕',
    points: 300,
    stock: 200,
    limitPerUser: 10,
    description: '连锁咖啡店中杯饮品兑换券',
  },
  {
    id: 'p_006',
    name: '运动水杯',
    emoji: '💧',
    points: 600,
    stock: 0,
    limitPerUser: 2,
    description: '不锈钢运动保温杯，容量500ml',
  },
  {
    id: 'p_007',
    name: '充电宝',
    emoji: '🔋',
    points: 1800,
    stock: 15,
    limitPerUser: 1,
    description: '10000mAh轻薄便携充电宝',
  },
  {
    id: 'p_008',
    name: '玩偶公仔',
    emoji: '🧸',
    points: 1200,
    stock: 40,
    limitPerUser: 3,
    description: '可爱毛绒公仔，高约30cm',
  },
  {
    id: 'p_009',
    name: '雨伞',
    emoji: '☂️',
    points: 400,
    stock: 80,
    limitPerUser: 2,
    description: '折叠晴雨伞，黑胶防晒涂层',
  },
  {
    id: 'p_010',
    name: '机械键盘',
    emoji: '⌨️',
    points: 3500,
    stock: 10,
    limitPerUser: 1,
    description: '87键青轴机械键盘，RGB背光',
  },
  {
    id: 'p_011',
    name: '加湿器',
    emoji: '💨',
    points: 900,
    stock: 25,
    limitPerUser: 1,
    description: '桌面静音加湿器，容量2L',
  },
  {
    id: 'p_012',
    name: '台灯',
    emoji: '💡',
    points: 700,
    stock: 35,
    limitPerUser: 2,
    description: '护眼LED台灯，三档亮度调节',
  },
]
