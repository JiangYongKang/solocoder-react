export const STORAGE_KEY_RECORDS = 'health_records'
export const STORAGE_KEY_GOALS = 'health_goals'

export const FIELD_CONFIG = {
  height: { key: 'height', label: '身高', unit: 'cm', min: 50, max: 250, step: 1 },
  weight: { key: 'weight', label: '体重', unit: 'kg', min: 20, max: 300, step: 0.1 },
  systolic: { key: 'systolic', label: '收缩压', unit: 'mmHg', min: 60, max: 250, step: 1 },
  diastolic: { key: 'diastolic', label: '舒张压', unit: 'mmHg', min: 30, max: 150, step: 1 },
  bloodSugar: { key: 'bloodSugar', label: '空腹血糖', unit: 'mmol/L', min: 2.0, max: 30.0, step: 0.1 },
}

export const NORMAL_RANGES = {
  systolic: { min: 90, max: 140 },
  diastolic: { min: 60, max: 90 },
  bloodSugar: { min: 3.9, max: 6.1 },
}

export const BMI_RANGES = {
  underweight: { max: 18.5, color: '#3b82f6', label: '偏瘦' },
  normal: { min: 18.5, max: 24, color: '#16a34a', label: '正常' },
  overweight: { min: 24, max: 28, color: '#f59e0b', label: '偏胖' },
  obese: { min: 28, color: '#dc2626', label: '肥胖' },
}

export const INDICATOR_KEYS = ['height', 'weight', 'systolic', 'diastolic', 'bloodSugar']

export const INDICATOR_COLORS = {
  height: '#6366f1',
  weight: '#10b981',
  systolic: '#f59e0b',
  diastolic: '#8b5cf6',
  bloodSugar: '#06b6d4',
  bmi: '#ec4899',
}

export const PAGE_SIZE = 10

export const DEFAULT_GOALS = {
  weightTarget: null,
  weightStart: null,
  weightDeadline: '',
  weeklyExercise: 3,
  weeklyExerciseDone: 0,
}
