export const STORAGE_KEY = 'grid-generator-layouts'

export const MIN_ROWS = 1
export const MAX_ROWS = 12
export const MIN_COLS = 1
export const MAX_COLS = 12

export const DEFAULT_ROWS = 3
export const DEFAULT_COLS = 3

export const MIN_GAP = 0
export const MAX_GAP = 50
export const DEFAULT_ROW_GAP = 8
export const DEFAULT_COL_GAP = 8

export const SIZE_MODES = {
  PIXEL: 'px',
  PERCENT: '%',
  FR: 'fr',
}

export const DEFAULT_SIZE_MODE = SIZE_MODES.FR
export const DEFAULT_PIXEL_SIZE = 80
export const DEFAULT_PERCENT_SIZE = 100 / 3
export const DEFAULT_FR_SIZE = 1

export const JUSTIFY_CONTENT_OPTIONS = [
  { value: 'start', label: 'start', icon: '⯇' },
  { value: 'center', label: 'center', icon: '⬌' },
  { value: 'end', label: 'end', icon: '⯈' },
  { value: 'stretch', label: 'stretch', icon: '⇔' },
  { value: 'space-between', label: 'space-between', icon: '⇾⇽' },
  { value: 'space-around', label: 'space-around', icon: '⇜⇝' },
  { value: 'space-evenly', label: 'space-evenly', icon: '⇆' },
]

export const ALIGN_CONTENT_OPTIONS = [
  { value: 'start', label: 'start', icon: '⯅' },
  { value: 'center', label: 'center', icon: '≓' },
  { value: 'end', label: 'end', icon: '⯆' },
  { value: 'stretch', label: 'stretch', icon: '⇕' },
  { value: 'space-between', label: 'space-between', icon: '⇿' },
  { value: 'space-around', label: 'space-around', icon: '⇞⇟' },
  { value: 'space-evenly', label: 'space-evenly', icon: '⇅' },
]

export const PLACE_ITEMS_OPTIONS = [
  { value: 'start', label: 'start', icon: '↖' },
  { value: 'center', label: 'center', icon: '⊕' },
  { value: 'end', label: 'end', icon: '↘' },
  { value: 'stretch', label: 'stretch', icon: '▣' },
]

export const DEFAULT_JUSTIFY_CONTENT = 'stretch'
export const DEFAULT_ALIGN_CONTENT = 'stretch'
export const DEFAULT_PLACE_ITEMS = 'stretch'

export const PRESET_COLORS = [
  '#F87171',
  '#FB923C',
  '#FBBF24',
  '#A3E635',
  '#4ADE80',
  '#34D399',
  '#22D3EE',
  '#60A5FA',
  '#818CF8',
  '#A78BFA',
  '#F472B6',
  '#FB7185',
]

export const DEFAULT_CELL_COLOR = '#E5E7EB'

export function generateId(prefix = 'cell') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function formatTimestamp(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
