export const STORAGE_KEY = 'solocoder_map_markers';

export const DEFAULT_CENTER = { x: 0, y: 0 };
export const DEFAULT_ZOOM = 1;
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 5;
export const ZOOM_STEP = 0.1;

export const GRID_SIZE = 100;

export const CLUSTER_THRESHOLD = 3;
export const CLUSTER_DISTANCE = 80;

export const MARKER_RADIUS = 12;
export const CLUSTER_RADIUS = 20;

export const DEFAULT_MARKERS = [
  { id: 'm1', name: '中央公园', description: '城市中心的绿地公园，适合休闲散步。', x: 0, y: 0 },
  { id: 'm2', name: '科技园区', description: '高新技术企业聚集地。', x: 200, y: -150 },
  { id: 'm3', name: '老城区', description: '历史文化街区，保留传统建筑。', x: -250, y: 100 },
  { id: 'm4', name: '火车站', description: '城市交通枢纽。', x: 150, y: 200 },
  { id: 'm5', name: '图书馆', description: '市立公共图书馆，藏书丰富。', x: -100, y: -180 },
];

export const SEARCH_PRESETS = {
  餐厅: [{ name: '中餐厅', description: '传统中式美食', offsetX: 80, offsetY: 60 },
    { name: '西餐厅', description: '欧式风味料理', offsetX: -120, offsetY: 40 },
    { name: '日料店', description: '正宗日本料理', offsetX: 50, offsetY: -90 }],
  商店: [{ name: '购物中心', description: '大型综合商场', offsetX: -60, offsetY: 150 },
    { name: '便利店', description: '24小时便民商店', offsetX: 180, offsetY: -50 }],
  景点: [{ name: '博物馆', description: '展示本地历史文化', offsetX: -200, offsetY: -100 },
    { name: '艺术馆', description: '现当代艺术展览', offsetX: 100, offsetY: 180 }],
  学校: [{ name: '大学', description: '综合性高等学府', offsetX: -150, offsetY: -220 },
    { name: '中学', description: '市重点中学', offsetX: 220, offsetY: 100 }],
  医院: [{ name: '综合医院', description: '三甲综合医院', offsetX: -50, offsetY: -50 },
    { name: '社区诊所', description: '基层医疗服务', offsetX: 250, offsetY: -150 }],
};
