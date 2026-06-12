export const STORAGE_KEY = 'css-animation-generator'
export const MAX_ANIMATIONS = 20

export const ANIMATION_PROPERTIES = {
  translateX: { label: '位移 X', unit: 'px', min: -500, max: 500, default: 0, step: 1, cssProp: 'transform' },
  translateY: { label: '位移 Y', unit: 'px', min: -500, max: 500, default: 0, step: 1, cssProp: 'transform' },
  scale: { label: '缩放', unit: '', min: 0.1, max: 5, default: 1, step: 0.1, cssProp: 'transform' },
  rotate: { label: '旋转', unit: 'deg', min: 0, max: 360, default: 0, step: 1, cssProp: 'transform' },
  opacity: { label: '透明度', unit: '', min: 0, max: 1, default: 1, step: 0.01, cssProp: 'opacity' },
  'background-color': { label: '背景颜色', unit: '', min: null, max: null, default: '#4a90d9', step: null, cssProp: 'background-color' },
  'border-radius': { label: '圆角', unit: 'px', min: 0, max: 200, default: 0, step: 1, cssProp: 'border-radius' },
  width: { label: '宽度', unit: 'px', min: 0, max: 500, default: 100, step: 1, cssProp: 'width' },
  height: { label: '高度', unit: 'px', min: 0, max: 500, default: 100, step: 1, cssProp: 'height' },
}

export const PRESET_EASINGS = [
  { label: 'linear', value: 'linear' },
  { label: 'ease', value: 'ease' },
  { label: 'ease-in', value: 'ease-in' },
  { label: 'ease-out', value: 'ease-out' },
  { label: 'ease-in-out', value: 'ease-in-out' },
]

export const PLAYBACK_SPEEDS = [0.5, 1, 2]

export const TIMELINE_TICKS = [0, 25, 50, 75, 100]

export const TRANSFORM_PROPERTIES = ['translateX', 'translateY', 'scale', 'rotate']

export const COLOR_PROPERTIES = ['background-color']
