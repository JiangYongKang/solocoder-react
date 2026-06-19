export const GRADIENT_TYPES = {
  LINEAR: 'linear',
  RADIAL: 'radial',
}

export const LINEAR_DIRECTIONS = [
  { key: 'to top', name: '向上', angle: 'to top' },
  { key: 'to bottom', name: '向下', angle: 'to bottom' },
  { key: 'to left', name: '向左', angle: 'to left' },
  { key: 'to right', name: '向右', angle: 'to right' },
  { key: 'to top left', name: '左上', angle: 'to top left' },
  { key: 'to top right', name: '右上', angle: 'to top right' },
  { key: 'to bottom left', name: '左下', angle: 'to bottom left' },
  { key: 'to bottom right', name: '右下', angle: 'to bottom right' },
]

export const DEFAULT_DIRECTION = 'to right'

export const generateLinearGradient = (startColor, endColor, direction = DEFAULT_DIRECTION) => {
  if (!startColor || !endColor) return ''

  const validDirection = LINEAR_DIRECTIONS.find((d) => d.key === direction)
  const dir = validDirection ? validDirection.angle : DEFAULT_DIRECTION

  return `linear-gradient(${dir}, ${startColor}, ${endColor})`
}

export const isValidDirection = (direction) => {
  return LINEAR_DIRECTIONS.some((d) => d.key === direction)
}

export const generateRadialGradient = (startColor, endColor) => {
  if (!startColor || !endColor) return ''
  return `radial-gradient(circle, ${startColor}, ${endColor})`
}

export const generateGradientCSS = (startColor, endColor, type = 'linear', direction = 'to right') => {
  if (type === GRADIENT_TYPES.RADIAL) {
    return generateRadialGradient(startColor, endColor)
  }
  return generateLinearGradient(startColor, endColor, direction)
}

export const generateFullGradientCSS = (startColor, endColor, type = 'linear', direction = 'to right') => {
  const gradient = generateGradientCSS(startColor, endColor, type, direction)
  return `background: ${gradient};`
}
