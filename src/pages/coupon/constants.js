export const COUPON_TYPES = {
  FULL_REDUCTION: 'full_reduction',
  DISCOUNT: 'discount',
  FLAT: 'flat',
}

export const COUPON_TYPE_LABELS = {
  [COUPON_TYPES.FULL_REDUCTION]: '满减券',
  [COUPON_TYPES.DISCOUNT]: '折扣券',
  [COUPON_TYPES.FLAT]: '立减券',
}

export const COUPON_TYPE_COLORS = {
  [COUPON_TYPES.FULL_REDUCTION]: '#ef4444',
  [COUPON_TYPES.DISCOUNT]: '#f59e0b',
  [COUPON_TYPES.FLAT]: '#10b981',
}

export const COUPON_STATUS = {
  NOT_STARTED: 'not_started',
  ONGOING: 'ongoing',
  EXPIRED: 'expired',
}

export const COUPON_STATUS_LABELS = {
  [COUPON_STATUS.NOT_STARTED]: '未开始',
  [COUPON_STATUS.ONGOING]: '进行中',
  [COUPON_STATUS.EXPIRED]: '已过期',
}

export const USER_COUPON_STATUS = {
  UNUSED: 'unused',
  USED: 'used',
  EXPIRED: 'expired',
}

export const USER_COUPON_STATUS_LABELS = {
  [USER_COUPON_STATUS.UNUSED]: '未使用',
  [USER_COUPON_STATUS.USED]: '已使用',
  [USER_COUPON_STATUS.EXPIRED]: '已过期',
}

export const STORAGE_KEY = 'solocoder_coupon_list'
export const USER_COUPONS_STORAGE_KEY = 'solocoder_user_coupons'

export const PAGE_SIZE = 10

export const MOCK_COUPONS = [
  {
    id: 'c_mock_1',
    name: '新用户满减券',
    type: COUPON_TYPES.FULL_REDUCTION,
    denomination: 50,
    threshold: 200,
    startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    totalCount: 100,
    receivedCount: 23,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'c_mock_2',
    name: '全场8.8折券',
    type: COUPON_TYPES.DISCOUNT,
    denomination: 8.8,
    threshold: 100,
    startDate: Date.now() - 3 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 15 * 24 * 60 * 60 * 1000,
    totalCount: 500,
    receivedCount: 180,
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'c_mock_3',
    name: '无门槛10元券',
    type: COUPON_TYPES.FLAT,
    denomination: 10,
    threshold: 0,
    startDate: Date.now() - 1 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
    totalCount: 1000,
    receivedCount: 650,
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'c_mock_4',
    name: '大促满500减100',
    type: COUPON_TYPES.FULL_REDUCTION,
    denomination: 100,
    threshold: 500,
    startDate: Date.now() + 5 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 20 * 24 * 60 * 60 * 1000,
    totalCount: 200,
    receivedCount: 0,
    createdAt: Date.now(),
  },
  {
    id: 'c_mock_5',
    name: '过期测试券',
    type: COUPON_TYPES.FLAT,
    denomination: 20,
    threshold: 0,
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
    totalCount: 100,
    receivedCount: 100,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
]
