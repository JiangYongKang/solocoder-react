export const STORAGE_KEY = 'solocoder_products'

export const CATEGORIES = ['电子产品', '服装鞋帽', '食品饮料', '家居日用', '图书文具', '运动户外']

export const SORT_FIELDS = {
  PRICE: 'price',
  CREATED_AT: 'createdAt',
  STOCK: 'stock',
}

export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc',
}

export const PRODUCT_STATUS = {
  ON_SHELF: 'on_shelf',
  OFF_SHELF: 'off_shelf',
}

export const PRODUCT_STATUS_LABEL = {
  [PRODUCT_STATUS.ON_SHELF]: '上架',
  [PRODUCT_STATUS.OFF_SHELF]: '下架',
}

export const PAGE_SIZE = 10

const FIXED_BASE_TIME = 1700000000000
const DAY_MS = 86400000

export const MOCK_PRODUCTS = [
  {
    id: 'p_001',
    name: '无线蓝牙耳机 Pro',
    price: 599,
    category: '电子产品',
    stock: 128,
    status: PRODUCT_STATUS.ON_SHELF,
    image: '',
    createdAt: FIXED_BASE_TIME - DAY_MS * 30,
  },
  {
    id: 'p_002',
    name: '纯棉休闲T恤',
    price: 89,
    category: '服装鞋帽',
    stock: 256,
    status: PRODUCT_STATUS.ON_SHELF,
    image: '',
    createdAt: FIXED_BASE_TIME - DAY_MS * 20,
  },
  {
    id: 'p_003',
    name: '进口有机咖啡豆',
    price: 128,
    category: '食品饮料',
    stock: 64,
    status: PRODUCT_STATUS.OFF_SHELF,
    image: '',
    createdAt: FIXED_BASE_TIME - DAY_MS * 15,
  },
  {
    id: 'p_004',
    name: '北欧风简约台灯',
    price: 199,
    category: '家居日用',
    stock: 32,
    status: PRODUCT_STATUS.ON_SHELF,
    image: '',
    createdAt: FIXED_BASE_TIME - DAY_MS * 10,
  },
  {
    id: 'p_005',
    name: 'JavaScript高级程序设计',
    price: 108,
    category: '图书文具',
    stock: 50,
    status: PRODUCT_STATUS.ON_SHELF,
    image: '',
    createdAt: FIXED_BASE_TIME - DAY_MS * 5,
  },
  {
    id: 'p_006',
    name: '专业跑步运动鞋',
    price: 459,
    category: '运动户外',
    stock: 0,
    status: PRODUCT_STATUS.OFF_SHELF,
    image: '',
    createdAt: FIXED_BASE_TIME - DAY_MS * 3,
  },
]
