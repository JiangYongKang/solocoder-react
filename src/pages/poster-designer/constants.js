export const CANVAS_SIZES = [
  { label: '1080×1920 手机海报', width: 1080, height: 1920 },
  { label: '1920×1080 横版海报', width: 1920, height: 1080 },
  { label: '800×800 方形海报', width: 800, height: 800 },
]

export const DEFAULT_CANVAS_SIZE = CANVAS_SIZES[0]

export const CHINESE_FONTS = [
  { label: '默认黑体', value: 'SimHei, Heiti SC, sans-serif' },
  { label: '宋体', value: 'SimSun, Songti SC, serif' },
  { label: '楷体', value: 'KaiTi, STKaiti, serif' },
  { label: '仿宋', value: 'FangSong, STFangsong, serif' },
  { label: '微软雅黑', value: 'Microsoft YaHei, PingFang SC, sans-serif' },
  { label: '华文行楷', value: 'STXingkai, serif' },
]

export const DEFAULT_FONT = CHINESE_FONTS[0].value

export const DEFAULT_FONT_SIZE = 48
export const MIN_FONT_SIZE = 12
export const MAX_FONT_SIZE = 200

export const DEFAULT_TEXT_COLOR = '#ffffff'
export const DEFAULT_STROKE_COLOR = '#000000'
export const DEFAULT_STROKE_WIDTH = 0
export const MIN_STROKE_WIDTH = 0
export const MAX_STROKE_WIDTH = 20

export const DEFAULT_SHADOW_COLOR = '#000000'
export const DEFAULT_SHADOW_BLUR = 0
export const DEFAULT_SHADOW_OFFSET_X = 0
export const DEFAULT_SHADOW_OFFSET_Y = 0
export const MIN_SHADOW_BLUR = 0
export const MAX_SHADOW_BLUR = 50
export const MIN_SHADOW_OFFSET = -50
export const MAX_SHADOW_OFFSET = 50

export const DEFAULT_BG_COLOR = '#4a90d9'
export const MIN_BG_OPACITY = 0
export const MAX_BG_OPACITY = 1

export const MAX_HISTORY = 50

export const PRESET_COLORS = [
  '#ffffff', '#000000', '#ff0000', '#ff6600', '#ffcc00',
  '#33cc33', '#0099ff', '#6633ff', '#ff3399', '#996633',
  '#4a90d9', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
  '#1abc9c', '#34495e', '#ecf0f1', '#e67e22', '#95a5a6',
]
