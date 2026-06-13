export const VIDEO_DURATION = 300
export const DEFAULT_VIDEO_WIDTH = 800
export const DEFAULT_VIDEO_HEIGHT = 450
export const SCROLL_DURATION = 8000
export const FIXED_DURATION = 3000
export const FADE_DURATION = 500
export const MAX_DANMAKU_LENGTH = 50

export const DANMAKU_POSITIONS = {
  SCROLL: 'scroll',
  TOP: 'top',
  MIDDLE: 'middle',
  BOTTOM: 'bottom',
}

export const POSITION_LABELS = {
  [DANMAKU_POSITIONS.SCROLL]: '滚动',
  [DANMAKU_POSITIONS.TOP]: '顶部',
  [DANMAKU_POSITIONS.MIDDLE]: '中间',
  [DANMAKU_POSITIONS.BOTTOM]: '底部',
}

export const DANMAKU_COLORS = [
  '#FFFFFF',
  '#FF4D4F',
  '#FAAD14',
  '#1890FF',
  '#52C41A',
  '#722ED1',
  '#FA8C16',
  '#13C2C2',
]

export const COLOR_LABELS = [
  '白',
  '红',
  '黄',
  '蓝',
  '绿',
  '紫',
  '橙',
  '青',
]

export const FONT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
}

export const FONT_SIZE_LABELS = {
  [FONT_SIZES.SMALL]: '小',
  [FONT_SIZES.MEDIUM]: '中',
  [FONT_SIZES.LARGE]: '大',
}

export const FONT_SIZE_PX = {
  [FONT_SIZES.SMALL]: 16,
  [FONT_SIZES.MEDIUM]: 22,
  [FONT_SIZES.LARGE]: 28,
}

export const DENSITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
}

export const DENSITY_CONFIG = {
  [DENSITY_LEVELS.LOW]: {
    label: '低密度',
    trackCount: 3,
    verticalSpacing: 40,
  },
  [DENSITY_LEVELS.MEDIUM]: {
    label: '中密度',
    trackCount: 5,
    verticalSpacing: 30,
  },
  [DENSITY_LEVELS.HIGH]: {
    label: '高密度',
    trackCount: 8,
    verticalSpacing: 20,
  },
}

export const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2]

export const STORAGE_KEY_SETTINGS = 'danmaku_player_settings'

export const DEFAULT_SETTINGS = {
  danmakuEnabled: true,
  danmakuOpacity: 1,
  density: DENSITY_LEVELS.MEDIUM,
  volume: 0.8,
  playbackSpeed: 1,
}

export const RANDOM_USERNAMES = [
  '星空漫步者',
  '云端旅人',
  '代码诗人',
  '夜行者',
  '追光者',
  '梦想家',
  '海风轻语',
  '山间明月',
  '墨香书生',
  '独行侠',
  '咖啡爱好者',
  '音乐发烧友',
  '书虫小白',
  '阳光少年',
  '雨夜听风',
]
