export const CAROUSEL_INTERVAL = 3000;

export const MIN_ONLINE_COUNT = 1000;
export const MAX_ONLINE_COUNT = 10000;
export const ONLINE_CHANGE_INTERVAL_MIN = 2000;
export const ONLINE_CHANGE_INTERVAL_MAX = 5000;
export const ONLINE_CHANGE_AMOUNT_MIN = 20;
export const ONLINE_CHANGE_AMOUNT_MAX = 80;

export const COUPON_DURATION_MS = 5 * 60 * 1000;

export const DANMAKU_TYPES = {
  COMMENT: 'comment',
  PURCHASE: 'purchase',
  LIKE: 'like',
};

export const DANMAKU_COLORS = {
  [DANMAKU_TYPES.COMMENT]: '#ffffff',
  [DANMAKU_TYPES.PURCHASE]: '#ffd700',
  [DANMAKU_TYPES.LIKE]: '#ff6b9d',
};

export const DANMAKU_SCROLL_DURATION = 8000;
export const DANMAKU_MAX_HISTORY = 100;

export const DEFAULT_PRODUCTS = [
  {
    id: 'p-001',
    name: '轻奢真皮手提包',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80',
    originalPrice: 1299,
    livePrice: 599,
    description: '头层牛皮，时尚百搭',
    specs: [
      { name: '颜色', options: ['黑色', '棕色', '米白'] },
      { name: '尺寸', options: ['小号', '中号', '大号'] },
    ],
    bgColor: '#8B4513',
  },
  {
    id: 'p-002',
    name: '智能蓝牙降噪耳机',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    originalPrice: 899,
    livePrice: 399,
    description: '主动降噪，超长续航',
    specs: [
      { name: '颜色', options: ['星空黑', '珍珠白', '玫瑰金'] },
    ],
    bgColor: '#1a1a2e',
  },
  {
    id: 'p-003',
    name: '进口葡萄籽精华套装',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80',
    originalPrice: 498,
    livePrice: 199,
    description: '抗氧化，美容养颜',
    specs: [
      { name: '规格', options: ['单瓶装', '双瓶装', '三瓶装'] },
    ],
    bgColor: '#6b8e23',
  },
  {
    id: 'p-004',
    name: '北欧风纯棉四件套',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80',
    originalPrice: 799,
    livePrice: 299,
    description: '60支长绒棉，亲肤透气',
    specs: [
      { name: '颜色', options: ['雾霾蓝', '藕粉', '浅灰'] },
      { name: '尺寸', options: ['1.5m床', '1.8m床', '2.0m床'] },
    ],
    bgColor: '#708090',
  },
  {
    id: 'p-005',
    name: '多功能家用空气炸锅',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80',
    originalPrice: 699,
    livePrice: 299,
    description: '无油烹饪，健康低脂',
    specs: [
      { name: '容量', options: ['3L', '5L', '7L'] },
      { name: '颜色', options: ['薄荷绿', '奶白色'] },
    ],
    bgColor: '#cd853f',
  },
  {
    id: 'p-006',
    name: '高端骨瓷餐具十二件套',
    image: 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?w=600&q=80',
    originalPrice: 1080,
    livePrice: 459,
    description: '手工描金，送礼佳品',
    specs: [
      { name: '款式', options: ['简约金边', '复古花纹'] },
    ],
    bgColor: '#deb887',
  },
];

export const DEFAULT_COUPONS = [
  {
    id: 'c-001',
    amount: 50,
    threshold: 299,
    name: '满299减50',
  },
  {
    id: 'c-002',
    amount: 100,
    threshold: 599,
    name: '满599减100',
  },
  {
    id: 'c-003',
    amount: 200,
    threshold: 999,
    name: '满999减200',
  },
];

export const MOCK_USERNAMES = [
  '爱购物的小美', '快乐吃货', '阳光明媚', '夜空中的星',
  '佛系买家', '剁手达人', '生活需要仪式感', '省钱小能手',
  '认真生活的人', '精致的猪猪女孩', '努力搬砖的打工人', '幸运星',
  '开心果', '向日葵', '小确幸', '买买买不停', '精打细算王',
  '品质追求者', '简约生活家', '梦想家',
];

export const MOCK_COMMENTS = [
  '这个颜色好漂亮！', '主播讲得好详细', '价格真的很划算',
  '之前买过，质量很好', '已下单，期待收货', '有赠品吗？',
  '库存还有吗？', '适合送人吗？', '新人有优惠吗？', '太好看了吧',
  '主播推荐的都很好', '上次买的用完了', '家人都说好',
  '回购第三次了', '有没有小一点的尺寸', '包装怎么样？',
  '可以包邮吗？', '抢到了！开心', '蹲一个优惠券',
];

export const PURCHASE_NOTICE_TEMPLATES = [
  '{username} 刚刚购买了 {product}',
  '{username} 下单成功了 {product}',
  '{username} 秒了 {product}',
];

export const LIKE_FLOAT_DURATION = 1500;
export const LIKE_MAX_FLOATING = 20;

export const LIVE_STATS_INITIAL = {
  likeCount: 12580,
};
