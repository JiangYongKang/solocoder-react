import { hexToRgb, rgbToHex } from './colorUtils.js'

const PROTANOPIA_MATRIX = [
  [0.567, 0.433, 0],
  [0.558, 0.442, 0],
  [0, 0.242, 0.758],
]

const DEUTERANOPIA_MATRIX = [
  [0.625, 0.375, 0],
  [0.7, 0.3, 0],
  [0, 0.3, 0.7],
]

const TRITANOPIA_MATRIX = [
  [0.95, 0.05, 0],
  [0, 0.433, 0.567],
  [0, 0.475, 0.525],
]

const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)))

export const applyColorMatrix = (r, g, b, matrix) => {
  if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') {
    return null
  }
  if (!Array.isArray(matrix) || matrix.length !== 3 || matrix[0].length !== 3) {
    return null
  }

  const newR = r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2]
  const newG = r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2]
  const newB = r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2]

  return {
    r: clamp(newR),
    g: clamp(newG),
    b: clamp(newB),
  }
}

export const simulateProtanopia = (r, g, b) => {
  return applyColorMatrix(r, g, b, PROTANOPIA_MATRIX)
}

export const simulateDeuteranopia = (r, g, b) => {
  return applyColorMatrix(r, g, b, DEUTERANOPIA_MATRIX)
}

export const simulateTritanopia = (r, g, b) => {
  return applyColorMatrix(r, g, b, TRITANOPIA_MATRIX)
}

export const simulateColorBlindness = (hex) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return null

  const protanopiaRgb = simulateProtanopia(rgb.r, rgb.g, rgb.b)
  const deuteranopiaRgb = simulateDeuteranopia(rgb.r, rgb.g, rgb.b)
  const tritanopiaRgb = simulateTritanopia(rgb.r, rgb.g, rgb.b)

  return {
    original: {
      hex,
      rgb,
    },
    protanopia: {
      name: '红色盲',
      hex: rgbToHex(protanopiaRgb.r, protanopiaRgb.g, protanopiaRgb.b),
      rgb: protanopiaRgb,
    },
    deuteranopia: {
      name: '绿色盲',
      hex: rgbToHex(deuteranopiaRgb.r, deuteranopiaRgb.g, deuteranopiaRgb.b),
      rgb: deuteranopiaRgb,
    },
    tritanopia: {
      name: '蓝黄色盲',
      hex: rgbToHex(tritanopiaRgb.r, tritanopiaRgb.g, tritanopiaRgb.b),
      rgb: tritanopiaRgb,
    },
  }
}

export const COLOR_BLINDNESS_TYPES = [
  { key: 'protanopia', name: '红色盲 (Protanopia)', description: '红色感知缺失' },
  { key: 'deuteranopia', name: '绿色盲 (Deuteranopia)', description: '绿色感知缺失' },
  { key: 'tritanopia', name: '蓝黄色盲 (Tritanopia)', description: '蓝色感知缺失' },
]
