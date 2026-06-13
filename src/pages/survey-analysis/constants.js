export const QUESTION_TYPES = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
  TEXT: 'text',
  RATING: 'rating',
}

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.SINGLE]: '单选题',
  [QUESTION_TYPES.MULTIPLE]: '多选题',
  [QUESTION_TYPES.TEXT]: '填空题',
  [QUESTION_TYPES.RATING]: '评分题',
}

export const QUESTION_TYPE_FILTERS = [
  { key: 'all', label: '全部' },
  { key: QUESTION_TYPES.SINGLE, label: '单选题' },
  { key: QUESTION_TYPES.MULTIPLE, label: '多选题' },
  { key: QUESTION_TYPES.TEXT, label: '填空题' },
  { key: QUESTION_TYPES.RATING, label: '评分题' },
]

export const STORAGE_KEY = 'survey_analysis_data_v1'

export const PAGE_SIZE = 20

export const DURATION_BUCKETS = [
  { label: '0-30秒', min: 0, max: 30 },
  { label: '30秒-1分钟', min: 30, max: 60 },
  { label: '1-2分钟', min: 60, max: 120 },
  { label: '2-5分钟', min: 120, max: 300 },
  { label: '5-10分钟', min: 300, max: 600 },
  { label: '10分钟以上', min: 600, max: Infinity },
]

export const CHART_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#64748b',
]

export const VIEW_MODES = {
  ANALYSIS: 'analysis',
  RAW: 'raw',
}
