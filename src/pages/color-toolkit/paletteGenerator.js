import { hexToHsl, hslToHex, generateColorVariations } from './colorUtils.js'

const normalizeAngle = (angle) => ((angle % 360) + 360) % 360

export const getComplementaryColors = (baseHex) => {
  const baseHsl = hexToHsl(baseHex)
  if (!baseHsl) return []

  const complementaryAngle = normalizeAngle(baseHsl.h + 180)
  const complementaryHex = hslToHex(complementaryAngle, baseHsl.s, baseHsl.l)

  const baseVariations = generateColorVariations(baseHex)
  const complementaryVariations = generateColorVariations(complementaryHex)

  return [
    { hex: baseHex, type: 'base', angle: baseHsl.h },
    ...baseVariations.slice(1, 3).map((v) => ({
      hex: v.hex,
      type: 'base-variant',
      angle: baseHsl.h,
      lightness: v.lightness,
    })),
    { hex: complementaryHex, type: 'complementary', angle: complementaryAngle },
    ...complementaryVariations.slice(3, 5).map((v) => ({
      hex: v.hex,
      type: 'complementary-variant',
      angle: complementaryAngle,
      lightness: v.lightness,
    })),
  ]
}

export const getAnalogousColors = (baseHex) => {
  const baseHsl = hexToHsl(baseHex)
  if (!baseHsl) return []

  const leftAngle = normalizeAngle(baseHsl.h - 30)
  const rightAngle = normalizeAngle(baseHsl.h + 30)

  const leftHex = hslToHex(leftAngle, baseHsl.s, baseHsl.l)
  const rightHex = hslToHex(rightAngle, baseHsl.s, baseHsl.l)

  const leftVariations = generateColorVariations(leftHex)
  const baseVariations = generateColorVariations(baseHex)
  const rightVariations = generateColorVariations(rightHex)

  return [
    { hex: leftHex, type: 'analogous-left', angle: leftAngle },
    ...leftVariations.slice(2, 4).map((v) => ({
      hex: v.hex,
      type: 'analogous-left-variant',
      angle: leftAngle,
      lightness: v.lightness,
    })),
    { hex: baseHex, type: 'base', angle: baseHsl.h },
    ...baseVariations.slice(2, 4).map((v) => ({
      hex: v.hex,
      type: 'base-variant',
      angle: baseHsl.h,
      lightness: v.lightness,
    })),
    { hex: rightHex, type: 'analogous-right', angle: rightAngle },
    ...rightVariations.slice(2, 4).map((v) => ({
      hex: v.hex,
      type: 'analogous-right-variant',
      angle: rightAngle,
      lightness: v.lightness,
    })),
  ]
}

export const getTriadicColors = (baseHex) => {
  const baseHsl = hexToHsl(baseHex)
  if (!baseHsl) return []

  const angle1 = normalizeAngle(baseHsl.h + 120)
  const angle2 = normalizeAngle(baseHsl.h - 120)

  const hex1 = hslToHex(angle1, baseHsl.s, baseHsl.l)
  const hex2 = hslToHex(angle2, baseHsl.s, baseHsl.l)

  const variations1 = generateColorVariations(hex1)
  const baseVariations = generateColorVariations(baseHex)
  const variations2 = generateColorVariations(hex2)

  return [
    { hex: baseHex, type: 'base', angle: baseHsl.h },
    ...baseVariations.slice(2, 4).map((v) => ({
      hex: v.hex,
      type: 'base-variant',
      angle: baseHsl.h,
      lightness: v.lightness,
    })),
    { hex: hex1, type: 'triadic-1', angle: angle1 },
    ...variations1.slice(2, 4).map((v) => ({
      hex: v.hex,
      type: 'triadic-1-variant',
      angle: angle1,
      lightness: v.lightness,
    })),
    { hex: hex2, type: 'triadic-2', angle: angle2 },
    ...variations2.slice(2, 4).map((v) => ({
      hex: v.hex,
      type: 'triadic-2-variant',
      angle: angle2,
      lightness: v.lightness,
    })),
  ]
}

export const generateAllPalettes = (baseHex) => {
  return {
    complementary: getComplementaryColors(baseHex),
    analogous: getAnalogousColors(baseHex),
    triadic: getTriadicColors(baseHex),
  }
}
