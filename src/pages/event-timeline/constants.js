export const STORAGE_KEY = 'event_timeline_data';
export const PREFS_KEY = 'event_timeline_prefs';

export const GROUP_MODE = {
  DECADE: 'decade',
  MONTH: 'month',
};

export const GROUP_MODE_LABELS = {
  [GROUP_MODE.DECADE]: '按年代',
  [GROUP_MODE.MONTH]: '按月份',
};

export const ZOOM_LEVEL = {
  YEAR: 'year',
  QUARTER: 'quarter',
  MONTH: 'month',
  WEEK: 'week',
};

export const ZOOM_LEVEL_LABELS = {
  [ZOOM_LEVEL.YEAR]: '年',
  [ZOOM_LEVEL.QUARTER]: '季',
  [ZOOM_LEVEL.MONTH]: '月',
  [ZOOM_LEVEL.WEEK]: '周',
};

export const ZOOM_LEVEL_ORDER = [ZOOM_LEVEL.YEAR, ZOOM_LEVEL.QUARTER, ZOOM_LEVEL.MONTH, ZOOM_LEVEL.WEEK];

export const VIEW_MODE = {
  TIMELINE: 'timeline',
  CARD: 'card',
  LIST: 'list',
};

export const VIEW_MODE_LABELS = {
  [VIEW_MODE.TIMELINE]: '时间轴视图',
  [VIEW_MODE.CARD]: '卡片视图',
  [VIEW_MODE.LIST]: '列表视图',
};

export const DEFAULT_TAGS = ['个人', '工作', '旅行', '学习'];

export const EMOJI_OPTIONS = [
  '📅', '🎉', '💼', '📚', '✈️', '🏠', '❤️', '⭐',
  '🎯', '💡', '🚀', '🏆', '🎨', '🎵', '🍕', '☕',
  '🌸', '🌍', '📝', '🔥', '✨', '💪', '🎓', '💍',
];

export const DEFAULT_EVENTS = [
  {
    id: 'demo_1',
    title: '入职新公司',
    date: '2024-03-15',
    endDate: null,
    description: '加入了一家创新科技公司，担任高级前端工程师，负责核心产品的开发工作。',
    tags: ['工作'],
    icon: '💼',
  },
  {
    id: 'demo_2',
    title: '东京旅行',
    date: '2024-05-01',
    endDate: '2024-05-07',
    description: '和家人一起去东京旅行，游览了浅草寺、东京塔、迪士尼乐园等著名景点。',
    tags: ['旅行', '个人'],
    icon: '✈️',
  },
  {
    id: 'demo_3',
    title: '完成在线课程',
    date: '2023-11-20',
    endDate: null,
    description: '完成了为期三个月的机器学习在线课程，获得结业证书。',
    tags: ['学习'],
    icon: '🎓',
  },
];
