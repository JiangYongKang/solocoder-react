export const OPERATION_TYPES = {
  COMPARE: 'compare',
  SWAP: 'swap',
  SORTED: 'sorted',
  PIVOT: 'pivot',
  COMPLETE: 'complete',
}

export const MIN_BAR_COUNT = 3
export const DEFAULT_BAR_COUNT = 30
export const MAX_BAR_COUNT = 50

export const MIN_VALUE = 1
export const DEFAULT_MIN_VALUE = 1
export const DEFAULT_MAX_VALUE = 100
export const MAX_VALUE = 999

export const SPEED_CONFIG = {
  MIN_SPEED: 1,
  MAX_SPEED: 10,
  DEFAULT_SPEED: 5,
  MAX_DELAY: 500,
  MIN_DELAY: 50,
  DEFAULT_DELAY: 100,
}

export const BAR_COLORS = {
  DEFAULT: '#3b82f6',
  COMPARE: '#eab308',
  SWAP: '#ef4444',
  SORTED: '#22c55e',
  PIVOT: '#a855f7',
}

export const ALGORITHMS = {
  BUBBLE: 'bubble',
  SELECTION: 'selection',
  INSERTION: 'insertion',
  QUICK: 'quick',
}

export const ALGORITHM_NAMES = {
  [ALGORITHMS.BUBBLE]: '冒泡排序',
  [ALGORITHMS.SELECTION]: '选择排序',
  [ALGORITHMS.INSERTION]: '插入排序',
  [ALGORITHMS.QUICK]: '快速排序',
}

export function speedToDelay(speed) {
  const s = Math.max(SPEED_CONFIG.MIN_SPEED, Math.min(SPEED_CONFIG.MAX_SPEED, speed))
  return Math.round(SPEED_CONFIG.MAX_DELAY / s)
}
