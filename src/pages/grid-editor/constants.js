export const STORAGE_KEY = 'grid-editor-state'

export const MIN_COLS = 1
export const MAX_COLS = 12
export const MIN_ROWS = 1
export const MAX_ROWS = 12
export const DEFAULT_COLS = 3
export const DEFAULT_ROWS = 3

export const MIN_CELL_WIDTH = 40
export const MAX_CELL_WIDTH = 200
export const DEFAULT_CELL_WIDTH = 100

export const MIN_CELL_HEIGHT = 40
export const MAX_CELL_HEIGHT = 200
export const DEFAULT_CELL_HEIGHT = 100

export const MIN_BORDER_WIDTH = 1
export const MAX_BORDER_WIDTH = 5
export const DEFAULT_BORDER_WIDTH = 1

export const HORIZONTAL_ALIGN = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
}

export const VERTICAL_ALIGN = {
  TOP: 'top',
  CENTER: 'center',
  BOTTOM: 'bottom',
}

export const BORDER_STYLE = {
  SOLID: 'solid',
  DASHED: 'dashed',
  DOTTED: 'dotted',
}

export const HORIZONTAL_ALIGN_LABELS = {
  [HORIZONTAL_ALIGN.LEFT]: '左对齐',
  [HORIZONTAL_ALIGN.CENTER]: '居中',
  [HORIZONTAL_ALIGN.RIGHT]: '右对齐',
}

export const VERTICAL_ALIGN_LABELS = {
  [VERTICAL_ALIGN.TOP]: '顶部',
  [VERTICAL_ALIGN.CENTER]: '居中',
  [VERTICAL_ALIGN.BOTTOM]: '底部',
}

export const BORDER_STYLE_LABELS = {
  [BORDER_STYLE.SOLID]: '实线',
  [BORDER_STYLE.DASHED]: '虚线',
  [BORDER_STYLE.DOTTED]: '点线',
}

export const DEFAULT_BORDER_COLOR = '#333333'
export const DEFAULT_HORIZONTAL_ALIGN = HORIZONTAL_ALIGN.CENTER
export const DEFAULT_VERTICAL_ALIGN = VERTICAL_ALIGN.CENTER
export const DEFAULT_BORDER_STYLE = BORDER_STYLE.SOLID
