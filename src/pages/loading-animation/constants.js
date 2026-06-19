export const STORAGE_KEY = 'loading-animation-generator'
export const MAX_SAVED_ANIMATIONS = 20

export const ANIMATION_TYPES = {
  spinner: {
    id: 'spinner',
    name: '旋转加载',
    description: '圆形边框旋转动画',
    className: 'spinner',
    defaultConfig: {
      primaryColor: '#3b82f6',
      secondaryColor: '#e5e7eb',
      size: 48,
      speed: 1,
      thickness: 4,
      count: 1,
    },
    supportedParams: ['primaryColor', 'secondaryColor', 'size', 'speed', 'thickness'],
  },
  pulse: {
    id: 'pulse',
    name: '脉冲加载',
    description: '圆点缩放呼吸动画',
    className: 'pulse-dot',
    defaultConfig: {
      primaryColor: '#3b82f6',
      secondaryColor: '#93c5fd',
      size: 24,
      speed: 1.5,
      thickness: 1,
      count: 1,
    },
    supportedParams: ['primaryColor', 'secondaryColor', 'size', 'speed'],
  },
  wave: {
    id: 'wave',
    name: '波浪加载',
    description: '多个竖条依次伸缩波动',
    className: 'wave-bar',
    defaultConfig: {
      primaryColor: '#3b82f6',
      secondaryColor: '#93c5fd',
      size: 40,
      speed: 1,
      thickness: 4,
      count: 5,
    },
    supportedParams: ['primaryColor', 'secondaryColor', 'size', 'speed', 'thickness', 'count'],
  },
  skeleton: {
    id: 'skeleton',
    name: '骨架屏',
    description: '矩形块渐变模拟内容加载',
    className: 'skeleton-block',
    defaultConfig: {
      primaryColor: '#e5e7eb',
      secondaryColor: '#f3f4f6',
      size: 200,
      speed: 1.5,
      thickness: 16,
      count: 3,
    },
    supportedParams: ['primaryColor', 'secondaryColor', 'size', 'speed', 'thickness', 'count'],
  },
  dots: {
    id: 'dots',
    name: '三点跳动',
    description: '三个圆点依次弹跳',
    className: 'bounce-dot',
    defaultConfig: {
      primaryColor: '#3b82f6',
      secondaryColor: '#93c5fd',
      size: 12,
      speed: 0.8,
      thickness: 1,
      count: 3,
    },
    supportedParams: ['primaryColor', 'secondaryColor', 'size', 'speed', 'count'],
  },
  progress: {
    id: 'progress',
    name: '进度条',
    description: '条状从左到右填充',
    className: 'progress-bar',
    defaultConfig: {
      primaryColor: '#3b82f6',
      secondaryColor: '#e5e7eb',
      size: 200,
      speed: 2,
      thickness: 8,
      count: 1,
    },
    supportedParams: ['primaryColor', 'secondaryColor', 'size', 'speed', 'thickness'],
  },
  circleProgress: {
    id: 'circleProgress',
    name: '圆环进度',
    description: '圆形环填充动画',
    className: 'circle-progress',
    defaultConfig: {
      primaryColor: '#3b82f6',
      secondaryColor: '#e5e7eb',
      size: 60,
      speed: 1,
      thickness: 6,
      count: 1,
    },
    supportedParams: ['primaryColor', 'secondaryColor', 'size', 'speed', 'thickness'],
  },
}

export const ANIMATION_TYPE_LIST = Object.values(ANIMATION_TYPES)

export const PARAM_RANGES = {
  size: { min: 10, max: 200, step: 1, unit: 'px' },
  speed: { min: 0.3, max: 5, step: 0.1, unit: 's' },
  thickness: { min: 1, max: 10, step: 1, unit: 'px' },
  count: { min: 3, max: 10, step: 1, unit: '' },
}

export const PARAM_LABELS = {
  primaryColor: '主色',
  secondaryColor: '辅色',
  size: '大小',
  speed: '速度',
  thickness: '粗细',
  count: '数量',
}

export const PREVIEW_SIZES = {
  small: { width: 200, height: 200, label: '小' },
  medium: { width: 400, height: 400, label: '中' },
  large: { width: 600, height: 600, label: '大' },
}

export const BACKGROUND_THEMES = {
  light: { bg: '#ffffff', grid: '#f0f0f0', label: '浅色' },
  dark: { bg: '#1f2937', grid: '#374151', label: '深色' },
}

export const MODE = {
  SINGLE: 'single',
  COMPOSITION: 'composition',
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function formatDate(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
