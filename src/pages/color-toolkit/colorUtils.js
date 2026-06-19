const HEX_REGEX = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
const RGB_REGEX = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i
const HSL_REGEX = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string') return null

  const match = hex.trim().match(HEX_REGEX)
  if (!match) return null

  let hexStr = match[1]
  if (hexStr.length === 3) {
    hexStr = hexStr.split('').map((c) => c + c).join('')
  }

  const r = parseInt(hexStr.slice(0, 2), 16)
  const g = parseInt(hexStr.slice(2, 4), 16)
  const b = parseInt(hexStr.slice(4, 6), 16)

  return { r, g, b }
}

export const rgbToHex = (r, g, b) => {
  if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') {
    return null
  }

  const rr = clamp(Math.round(r), 0, 255)
  const gg = clamp(Math.round(g), 0, 255)
  const bb = clamp(Math.round(b), 0, 255)

  const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase()
  return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`
}

export const rgbToHsl = (r, g, b) => {
  if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') {
    return null
  }

  const rr = clamp(r, 0, 255) / 255
  const gg = clamp(g, 0, 255) / 255
  const bb = clamp(b, 0, 255) / 255

  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case rr:
        h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6
        break
      case gg:
        h = ((bb - rr) / d + 2) / 6
        break
      case bb:
        h = ((rr - gg) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export const hslToRgb = (h, s, l) => {
  if (typeof h !== 'number' || typeof s !== 'number' || typeof l !== 'number') {
    return null
  }

  const hh = ((h % 360) + 360) % 360 / 360
  const ss = clamp(s, 0, 100) / 100
  const ll = clamp(l, 0, 100) / 100

  let r, g, b

  if (ss === 0) {
    r = g = b = ll
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss
    const p = 2 * ll - q
    r = hue2rgb(p, q, hh + 1 / 3)
    g = hue2rgb(p, q, hh)
    b = hue2rgb(p, q, hh - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

export const hexToHsl = (hex) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

export const hslToHex = (h, s, l) => {
  const rgb = hslToRgb(h, s, l)
  if (!rgb) return null
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

export const detectColorFormat = (input) => {
  if (!input || typeof input !== 'string') return null

  const trimmed = input.trim()

  if (HEX_REGEX.test(trimmed)) return 'hex'
  if (RGB_REGEX.test(trimmed)) return 'rgb'
  if (HSL_REGEX.test(trimmed)) return 'hsl'

  return null
}

export const parseColorInput = (input) => {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: '请输入颜色值' }
  }

  const trimmed = input.trim()
  const format = detectColorFormat(trimmed)

  if (!format) {
    return {
      valid: false,
      error: '格式无效。合法格式：HEX (#FF5733 或 #F53)、RGB (rgb(255, 87, 51))、HSL (hsl(9, 100%, 60%))',
    }
  }

  let r, g, b

  if (format === 'hex') {
    const rgb = hexToRgb(trimmed)
    if (!rgb) return { valid: false, error: 'HEX 格式无效' }
    r = rgb.r
    g = rgb.g
    b = rgb.b
  } else if (format === 'rgb') {
    const match = trimmed.match(RGB_REGEX)
    r = parseInt(match[1], 10)
    g = parseInt(match[2], 10)
    b = parseInt(match[3], 10)

    if (r > 255 || g > 255 || b > 255) {
      return { valid: false, error: 'RGB 值必须在 0-255 之间' }
    }
  } else if (format === 'hsl') {
    const match = trimmed.match(HSL_REGEX)
    const h = parseInt(match[1], 10)
    const s = parseInt(match[2], 10)
    const l = parseInt(match[3], 10)

    if (h > 360) {
      return { valid: false, error: 'HSL 色相必须在 0-360 之间' }
    }
    if (s > 100 || l > 100) {
      return { valid: false, error: 'HSL 饱和度和亮度必须在 0-100 之间' }
    }

    const rgb = hslToRgb(h, s, l)
    r = rgb.r
    g = rgb.g
    b = rgb.b
  }

  const hex = rgbToHex(r, g, b)
  const hsl = rgbToHsl(r, g, b)

  return {
    valid: true,
    format,
    hex,
    rgb: { r, g, b },
    hsl,
    rgbString: `rgb(${r}, ${g}, ${b})`,
    hslString: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
  }
}

export const getContrastColor = (hex) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#000000'

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

export const generateColorVariations = (hex) => {
  const hsl = hexToHsl(hex)
  if (!hsl) return []

  const variations = []
  const lightnessSteps = [10, 25, 40, 55, 70, 85]

  for (const l of lightnessSteps) {
    const variationHex = hslToHex(hsl.h, hsl.s, l)
    variations.push({
      hex: variationHex,
      lightness: l,
    })
  }

  return variations
}
