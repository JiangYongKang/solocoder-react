export const STORAGE_KEY = 'svg-path-editor-data'

export const COMMAND_TYPES = {
  M: 'M',
  L: 'L',
  C: 'C',
  Q: 'Q',
  A: 'A',
  Z: 'Z',
}

export const COMMAND_PARAM_COUNT = {
  M: 2,
  L: 2,
  C: 6,
  Q: 4,
  A: 7,
  Z: 0,
}

export const ANCHOR_RADIUS = 6
export const HANDLE_RADIUS = 5
export const HIT_RADIUS = 10
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 10
export const DEFAULT_ZOOM = 1
export const GRID_SIZE = 20

export const DEFAULT_STROKE = '#333333'
export const DEFAULT_FILL = 'none'
export const DEFAULT_STROKE_WIDTH = 2
export const DEFAULT_LINECAP = 'butt'
export const DEFAULT_LINEJOIN = 'miter'
export const DEFAULT_DASHARRAY = ''

export const PRESET_COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#ff6600', '#ffcc00', '#33cc33', '#0099ff', '#6633cc',
  '#ff3399', '#996633', '#00cccc', '#336699',
]

export const LINECAP_OPTIONS = [
  { value: 'butt', label: '平头' },
  { value: 'round', label: '圆头' },
  { value: 'square', label: '方头' },
]

export const LINEJOIN_OPTIONS = [
  { value: 'miter', label: '尖角' },
  { value: 'round', label: '圆角' },
  { value: 'bevel', label: '斜角' },
]

export const FILL_TYPES = [
  { value: 'none', label: '无填充' },
  { value: 'solid', label: '纯色' },
  { value: 'linearGradient', label: '线性渐变' },
  { value: 'radialGradient', label: '径向渐变' },
]

export const DASH_PRESETS = [
  { value: '', label: '实线' },
  { value: '5,5', label: '短虚线' },
  { value: '10,5', label: '中虚线' },
  { value: '15,5,5,5', label: '点划线' },
  { value: '2,3', label: '点线' },
]

export function createDefaultPathData() {
  return 'M 100 200 C 150 100 250 100 300 200 C 350 300 450 300 500 200'
}

export function createDefaultPathStyle() {
  return {
    fill: DEFAULT_FILL,
    fillType: 'none',
    fillGradientStart: '#ffffff',
    fillGradientEnd: '#000000',
    fillGradientAngle: 0,
    stroke: DEFAULT_STROKE,
    strokeWidth: DEFAULT_STROKE_WIDTH,
    linecap: DEFAULT_LINECAP,
    linejoin: DEFAULT_LINEJOIN,
    dasharray: DEFAULT_DASHARRAY,
  }
}

export function createDefaultPath(name = '路径 1') {
  return {
    id: `path_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    d: createDefaultPathData(),
    style: createDefaultPathStyle(),
    visible: true,
  }
}
