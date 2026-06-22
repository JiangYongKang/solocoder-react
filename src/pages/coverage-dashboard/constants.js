export const COVERAGE_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  NONE: 'none',
}

export const COVERAGE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 50,
  LOW: 0,
}

export const COVERAGE_COLORS = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#ef4444',
  none: '#9ca3af',
}

export const COVERAGE_LABELS = {
  statements: '语句覆盖率',
  branches: '分支覆盖率',
  functions: '函数覆盖率',
  lines: '行覆盖率',
}

export const METRIC_KEYS = ['statements', 'branches', 'functions', 'lines']

export const VIEW_MODES = {
  FILE_TREE: 'fileTree',
  DIRECTORY: 'directory',
}

export const TREND_DAYS = 30
