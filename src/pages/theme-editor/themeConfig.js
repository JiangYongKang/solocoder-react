export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
}

export const LIGHT_COLORS = {
  primary: '#aa3bff',
  background: '#ffffff',
  surface: '#f4f3ec',
  text: '#08060d',
  textSecondary: '#6b6375',
  border: '#e5e4e7',
  accent: '#aa3bff',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
}

export const DARK_COLORS = {
  primary: '#c084fc',
  background: '#16171d',
  surface: '#1f2028',
  text: '#f3f4f6',
  textSecondary: '#9ca3af',
  border: '#2e303a',
  accent: '#c084fc',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
}

export const DEFAULT_TYPOGRAPHY = {
  fontSize: 16,
  lineHeight: 1.6,
  paragraphSpacing: 16,
}

export const COLOR_LABELS = {
  primary: '主色',
  background: '背景色',
  surface: '表面色',
  text: '文字色',
  textSecondary: '次要文字色',
  border: '边框色',
  accent: '强调色',
  success: '成功色',
  warning: '警告色',
  error: '错误色',
}

export const getDefaultConfig = () => ({
  mode: THEME_MODES.LIGHT,
  colors: { ...LIGHT_COLORS },
  typography: { ...DEFAULT_TYPOGRAPHY },
})

export const getColorsByMode = (mode) =>
  mode === THEME_MODES.DARK ? { ...DARK_COLORS } : { ...LIGHT_COLORS }
