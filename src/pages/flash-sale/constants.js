export const FLASH_SALE_STATUS = {
  NOT_STARTED: 'not_started',
  ONGOING: 'ongoing',
  SOLD_OUT: 'sold_out',
  ENDED: 'ended',
}

export const FLASH_SALE_STATUS_LABELS = {
  [FLASH_SALE_STATUS.NOT_STARTED]: '即将开始',
  [FLASH_SALE_STATUS.ONGOING]: '抢购中',
  [FLASH_SALE_STATUS.SOLD_OUT]: '已售罄',
  [FLASH_SALE_STATUS.ENDED]: '已结束',
}

export const PURCHASE_RESULT = {
  SUCCESS: 'success',
  SOLD_OUT: 'sold_out',
  FAILED: 'failed',
}

export const PURCHASE_RESULT_MESSAGES = {
  [PURCHASE_RESULT.SUCCESS]: '🎉 抢购成功！',
  [PURCHASE_RESULT.SOLD_OUT]: '😢 手慢了，商品已售罄',
  [PURCHASE_RESULT.FAILED]: '😢 抢购失败，请稍后再试',
}

export const MOCK_PRODUCT = {
  id: 'flash_sale_001',
  name: '限量款无线蓝牙耳机 Pro',
  image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wireless%20bluetooth%20earbuds%20product%20photo%20on%20white%20background%20studio%20lighting&image_size=square',
  originalPrice: 599.00,
  flashPrice: 199.00,
  initialStock: 3000,
  description: '主动降噪 · 40小时续航 · IPX5防水',
}

export const START_OFFSET_MINUTES = 1
export const DURATION_MINUTES = 30

export const MIN_DELAY_MS = 500
export const MAX_DELAY_MS = 1500
export const SUCCESS_RATE = 0.9

export const STOCK_COLOR_THRESHOLDS = {
  HIGH: 0.5,
  MEDIUM: 0.2,
}

export const STOCK_COLORS = {
  HIGH: '#22c55e',
  MEDIUM: '#f97316',
  LOW: '#ef4444',
}
