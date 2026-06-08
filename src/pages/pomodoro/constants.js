export const PHASES = {
  WORK: 'work',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
}

export const PHASE_LABELS = {
  [PHASES.WORK]: '工作中',
  [PHASES.SHORT_BREAK]: '短休息',
  [PHASES.LONG_BREAK]: '长休息',
}

export const PHASE_COLORS = {
  [PHASES.WORK]: '#ef4444',
  [PHASES.SHORT_BREAK]: '#22c55e',
  [PHASES.LONG_BREAK]: '#3b82f6',
}

export const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
}

export const WHITE_NOISE_OPTIONS = [
  { id: 'rain', label: '雨声', icon: '🌧️', description: '轻柔的下雨声' },
  { id: 'cafe', label: '咖啡馆', icon: '☕', description: '咖啡馆环境音' },
  { id: 'forest', label: '森林', icon: '🌲', description: '森林自然声' },
  { id: 'white', label: '白噪音', icon: '📻', description: '经典白噪音' },
  { id: 'silent', label: '静音', icon: '🔇', description: '无背景音乐' },
]

export const STORAGE_KEY_SETTINGS = 'pomodoro_settings'
export const STORAGE_KEY_RECORDS = 'pomodoro_records'
