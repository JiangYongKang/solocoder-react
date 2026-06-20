export const PRESET_GROUPS = ['全部', '社交', '邮箱', '金融', '工作', '其他']

export const PASSWORD_MASK = '••••••••'

export const LOCK_THRESHOLD = 3
export const LOCK_DURATION_MS = 30000

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 64
export const PASSWORD_DEFAULT_LENGTH = 16

export const MASTER_PASSWORD_MIN_LENGTH = 6

export const SHOW_PASSWORD_DURATION_MS = 3000
export const COPIED_FEEDBACK_DURATION_MS = 2000

export const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
}

export const STRENGTH_LEVELS = {
  weak: { label: '弱', color: '#ef4444' },
  medium: { label: '中', color: '#eab308' },
  strong: { label: '强', color: '#22c55e' },
}
