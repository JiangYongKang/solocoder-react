export const STORAGE_KEY_BILLS = 'bill_splitter_history'
export const MAX_HISTORY_ITEMS = 20

export const SPLIT_MODE = {
  EQUAL: 'equal',
  CUSTOM: 'custom',
}

export const AVATAR_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#64748b',
]

export function generateId(prefix = 'id') {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatCurrency(value) {
  const num = Number(value) || 0
  return '¥' + num.toFixed(2)
}

export function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  hash = Math.abs(hash)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
