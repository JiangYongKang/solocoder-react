export const TOOL_TABS = [
  { key: 'palette', name: '调色板生成', icon: '🎨' },
  { key: 'converter', name: '格式互转', icon: '🔄' },
  { key: 'colorblind', name: '色盲模拟', icon: '👁️' },
  { key: 'gradient', name: '渐变生成', icon: '🌈' },
  { key: 'brand', name: '品牌色提取', icon: '🏷️' },
  { key: 'favorites', name: '收藏管理', icon: '⭐' },
]

export const TOOL_SOURCES = {
  PALETTE: '调色板生成',
  CONVERTER: '格式互转',
  COLORBLIND: '色盲模拟',
  BRAND: '品牌色提取',
  GRADIENT: '渐变生成',
}

export const PALETTE_TYPES = [
  { key: 'complementary', name: '互补色调色板', description: '基准色及其色轮对面 180° 的颜色' },
  { key: 'analogous', name: '类似色调色板', description: '基准色及其色轮相邻 ±30° 的颜色' },
  { key: 'triadic', name: '三色调色板', description: '基准色及其色轮 ±120° 的两个颜色' },
]

export const DEFAULT_BASE_COLOR = '#FF5733'
export const DEFAULT_GRADIENT_START = '#FF5733'
export const DEFAULT_GRADIENT_END = '#33FF57'
export const DEFAULT_COLORBLIND_COLOR = '#FF5733'

export const CLIPBOARD_DELAY = 2000

export const STORAGE_KEY = 'color-toolkit-favorites'
