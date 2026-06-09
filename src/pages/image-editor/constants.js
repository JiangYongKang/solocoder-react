export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export const TOOL_TYPES = {
  NONE: 'none',
  CROP: 'crop',
  TEXT: 'text',
  BRUSH: 'brush',
}

export const CROP_RATIOS = {
  FREE: 'free',
  RATIO_1_1: '1:1',
  RATIO_4_3: '4:3',
  RATIO_16_9: '16:9',
}

export const RATIO_VALUES = {
  [CROP_RATIOS.FREE]: null,
  [CROP_RATIOS.RATIO_1_1]: 1,
  [CROP_RATIOS.RATIO_4_3]: 4 / 3,
  [CROP_RATIOS.RATIO_16_9]: 16 / 9,
}

export const DEFAULT_FILTERS = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  blur: 0,
}

export const FILTER_RANGES = {
  brightness: { min: -100, max: 100, step: 1 },
  contrast: { min: -100, max: 100, step: 1 },
  saturation: { min: -100, max: 100, step: 1 },
  hue: { min: -100, max: 100, step: 1 },
  blur: { min: 0, max: 50, step: 1 },
}

export const EXPORT_FORMATS = {
  PNG: 'image/png',
  JPEG: 'image/jpeg',
}

export const EXPORT_FORMAT_NAMES = {
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
}

export const DEFAULT_FONT_SIZE = 24
export const MIN_FONT_SIZE = 8
export const MAX_FONT_SIZE = 72

export const DEFAULT_BRUSH_SIZE = 4
export const MIN_BRUSH_SIZE = 1
export const MAX_BRUSH_SIZE = 50

export const DEFAULT_COLOR = '#ff0000'

export const PRESET_COLORS = [
  '#000000',
  '#ffffff',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
  '#ff8800',
  '#8800ff',
  '#88ff00',
  '#00ff88',
]

export const HISTORY_LIMIT = 50

export const MIN_CROP_SIZE = 10
