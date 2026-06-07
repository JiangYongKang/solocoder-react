export const ORDER_STATUSES = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const STATUS_LABELS = {
  [ORDER_STATUSES.PENDING_PAYMENT]: '待付款',
  [ORDER_STATUSES.PAID]: '已付款',
  [ORDER_STATUSES.SHIPPED]: '已发货',
  [ORDER_STATUSES.COMPLETED]: '已完成',
  [ORDER_STATUSES.CANCELLED]: '已取消',
};

export const STATUS_ORDER = [
  ORDER_STATUSES.PENDING_PAYMENT,
  ORDER_STATUSES.PAID,
  ORDER_STATUSES.SHIPPED,
  ORDER_STATUSES.COMPLETED,
];

export const STATUS_NEXT_MAP = {
  [ORDER_STATUSES.PENDING_PAYMENT]: ORDER_STATUSES.PAID,
  [ORDER_STATUSES.PAID]: ORDER_STATUSES.SHIPPED,
  [ORDER_STATUSES.SHIPPED]: ORDER_STATUSES.COMPLETED,
};

export const STATUS_NEXT_LABEL = {
  [ORDER_STATUSES.PENDING_PAYMENT]: '模拟支付',
  [ORDER_STATUSES.PAID]: '确认发货',
  [ORDER_STATUSES.SHIPPED]: '确认收货',
};

export const STATUS_COLORS = {
  [ORDER_STATUSES.PENDING_PAYMENT]: '#f59e0b',
  [ORDER_STATUSES.PAID]: '#3b82f6',
  [ORDER_STATUSES.SHIPPED]: '#8b5cf6',
  [ORDER_STATUSES.COMPLETED]: '#22c55e',
  [ORDER_STATUSES.CANCELLED]: '#9ca3af',
};

export const PRODUCTS = [
  {
    id: 'p1',
    name: '机械键盘',
    price: 399,
    stock: 50,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mechanical%20keyboard%20product%20photo%20on%20white%20background&image_size=square',
  },
  {
    id: 'p2',
    name: '无线鼠标',
    price: 159,
    stock: 120,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wireless%20mouse%20product%20photo%20on%20white%20background&image_size=square',
  },
  {
    id: 'p3',
    name: '显示器支架',
    price: 249,
    stock: 35,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=monitor%20arm%20stand%20product%20photo%20on%20white%20background&image_size=square',
  },
  {
    id: 'p4',
    name: 'USB-C 集线器',
    price: 189,
    stock: 80,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=USB-C%20hub%20product%20photo%20on%20white%20background&image_size=square',
  },
  {
    id: 'p5',
    name: '头戴式耳机',
    price: 599,
    stock: 25,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=over-ear%20headphones%20product%20photo%20on%20white%20background&image_size=square',
  },
  {
    id: 'p6',
    name: '桌面台灯',
    price: 129,
    stock: 100,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20desk%20lamp%20product%20photo%20on%20white%20background&image_size=square',
  },
  {
    id: 'p7',
    name: '人体工学椅',
    price: 1999,
    stock: 15,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ergonomic%20office%20chair%20product%20photo%20on%20white%20background&image_size=square',
  },
  {
    id: 'p8',
    name: '升降桌',
    price: 1599,
    stock: 20,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=standing%20desk%20height%20adjustable%20product%20photo%20on%20white%20background&image_size=square',
  },
];

export const STORAGE_KEYS = {
  CART: 'orders_cart',
  ADDRESSES: 'orders_addresses',
  ORDERS: 'orders_orders',
};

export const PAGE_SIZE = 5;

export const LOGISTICS_TEMPLATE = [
  { label: '包裹已出库', offsetHours: 0 },
  { label: '快递员已揽收', offsetHours: 2 },
  { label: '到达【北京分拨中心】', offsetHours: 8 },
  { label: '到达【上海转运中心】', offsetHours: 24 },
  { label: '包裹正在派送中', offsetHours: 48 },
  { label: '已签收', offsetHours: 50 },
];

export const CHINA_PROVINCES = [
  '北京市',
  '上海市',
  '广东省',
  '江苏省',
  '浙江省',
  '四川省',
  '湖北省',
  '山东省',
  '河南省',
  '福建省',
  '湖南省',
  '安徽省',
  '陕西省',
  '辽宁省',
  '重庆市',
  '天津市',
  '江西省',
  '云南省',
  '贵州省',
  '黑龙江省',
];
