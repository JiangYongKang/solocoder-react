export const TOOL_TYPES = {
  NONE: 'none',
  SELECT: 'select',
  ARROW: 'arrow',
  RECTANGLE: 'rectangle',
  ELLIPSE: 'ellipse',
  TEXT: 'text',
  BRUSH: 'brush',
}

export const ANNOTATION_TYPES = {
  ARROW: 'arrow',
  RECTANGLE: 'rectangle',
  ELLIPSE: 'ellipse',
  TEXT: 'text',
  BRUSH: 'brush',
}

export const HANDLE_TYPES = {
  START: 'start',
  END: 'end',
  NW: 'nw',
  NE: 'ne',
  SW: 'sw',
  SE: 'se',
  MOVE: 'move',
}

export const FILL_OPACITY_OPTIONS = {
  NONE: 0,
  HALF: 0.3,
  FULL: 0.6,
}

export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]

export const PRESET_COLORS = [
  '#ff0000',
  '#ffff00',
  '#0066ff',
  '#00cc00',
  '#ffffff',
  '#000000',
]

export const LINE_WIDTH_OPTIONS = [1, 2, 3, 5]

export const FONT_SIZE_OPTIONS = [12, 16, 20, 24]

export const DEFAULT_CANVAS_WIDTH = 900
export const DEFAULT_CANVAS_HEIGHT = 600

export const DEFAULT_COLOR = '#ff0000'
export const DEFAULT_LINE_WIDTH = 2
export const DEFAULT_FONT_SIZE = 16
export const DEFAULT_FILL_OPACITY = 0
export const DEFAULT_RECT_BORDER_RADIUS = 4

export const HISTORY_LIMIT = 50

export const STORAGE_KEY = 'screenshot_annotator_saves'
export const IMAGE_STORAGE_KEY_PREFIX = 'screenshot_annotator_image_'
export const MAX_INLINE_IMAGE_SIZE = 2 * 1024 * 1024

export const ARROW_HEAD_LENGTH = 12
export const ARROW_HEAD_ANGLE = Math.PI / 6

export const HANDLE_SIZE = 10
export const HIT_TOLERANCE = 6
