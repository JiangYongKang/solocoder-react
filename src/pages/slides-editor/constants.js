export const STORAGE_KEY = 'slides-editor-state'

export const ELEMENT_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  SHAPE: 'shape',
}

export const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TRIANGLE: 'triangle',
}

export const SHAPE_TYPE_LABELS = {
  [SHAPE_TYPES.RECTANGLE]: '矩形',
  [SHAPE_TYPES.CIRCLE]: '圆形',
  [SHAPE_TYPES.TRIANGLE]: '三角形',
}

export const CANVAS_ASPECT_RATIO = 16 / 9
export const CANVAS_WIDTH = 960
export const CANVAS_HEIGHT = CANVAS_WIDTH / CANVAS_ASPECT_RATIO

export const DEFAULT_COLORS = {
  TEXT: '#333333',
  FILL: '#4f7cff',
  BORDER: '#2563eb',
  BACKGROUND: '#ffffff',
}

export const DEFAULT_FONT_SIZE = 24
export const MIN_FONT_SIZE = 10
export const MAX_FONT_SIZE = 96

export const MIN_ELEMENT_SIZE = 20
export const MAX_ELEMENT_SIZE = 2000

export const DEFAULT_BORDER_WIDTH = 2

export const PRESET_COLORS = [
  '#000000', '#ffffff', '#e74c3c', '#e67e22', '#f1c40f',
  '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#34495e',
  '#7f8c8d', '#95a5a6', '#d35400', '#c0392b', '#16a085',
  '#27ae60', '#2980b9', '#8e44ad', '#2c3e50', '#4f7cff',
]

export const TRANSITION_ANIMATION = {
  DURATION: 400,
  NAME: 'fade',
}
