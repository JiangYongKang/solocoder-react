import { describe, it, expect } from 'vitest'
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  hexToHsl,
  hslToHex,
  detectColorFormat,
  parseColorInput,
  getContrastColor,
  generateColorVariations,
} from '../../color-toolkit/colorUtils.js'

describe('hexToRgb', () => {
  it('should convert 6-digit hex to rgb', () => {
    expect(hexToRgb('#FF5733')).toEqual({ r: 255, g: 87, b: 51 })
  })

  it('should convert 3-digit hex to rgb', () => {
    expect(hexToRgb('#F53')).toEqual({ r: 255, g: 85, b: 51 })
  })

  it('should handle hex without # prefix', () => {
    expect(hexToRgb('FF5733')).toEqual({ r: 255, g: 87, b: 51 })
  })

  it('should handle lowercase hex', () => {
    expect(hexToRgb('#ff5733')).toEqual({ r: 255, g: 87, b: 51 })
  })

  it('should return null for invalid hex', () => {
    expect(hexToRgb('#GGGGGG')).toBeNull()
    expect(hexToRgb('#FF57')).toBeNull()
    expect(hexToRgb('')).toBeNull()
    expect(hexToRgb(null)).toBeNull()
    expect(hexToRgb(123)).toBeNull()
  })

  it('should convert white', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('should convert black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
  })
})

describe('rgbToHex', () => {
  it('should convert rgb to hex', () => {
    expect(rgbToHex(255, 87, 51)).toBe('#FF5733')
  })

  it('should clamp values between 0 and 255', () => {
    expect(rgbToHex(300, -10, 128)).toBe('#FF0080')
  })

  it('should round decimal values', () => {
    expect(rgbToHex(255.4, 87.6, 51.2)).toBe('#FF5833')
  })

  it('should return null for non-numeric values', () => {
    expect(rgbToHex('255', 87, 51)).toBeNull()
    expect(rgbToHex(null, 87, 51)).toBeNull()
    expect(rgbToHex(255)).toBeNull()
  })

  it('should convert white', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF')
  })

  it('should convert black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
  })
})

describe('rgbToHsl', () => {
  it('should convert rgb to hsl - red', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 })
  })

  it('should convert rgb to hsl - green', () => {
    expect(rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 })
  })

  it('should convert rgb to hsl - blue', () => {
    expect(rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 })
  })

  it('should convert rgb to hsl - white', () => {
    expect(rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 })
  })

  it('should convert rgb to hsl - black', () => {
    expect(rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 })
  })

  it('should convert rgb to hsl - gray', () => {
    expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 })
  })

  it('should return null for non-numeric values', () => {
    expect(rgbToHsl('255', 0, 0)).toBeNull()
    expect(rgbToHsl(null, 0, 0)).toBeNull()
  })

  it('should clamp values', () => {
    expect(rgbToHsl(300, -10, 256)).toEqual({ h: 300, s: 100, l: 50 })
  })
})

describe('hslToRgb', () => {
  it('should convert hsl to rgb - red', () => {
    expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('should convert hsl to rgb - green', () => {
    expect(hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 })
  })

  it('should convert hsl to rgb - blue', () => {
    expect(hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 })
  })

  it('should convert hsl to rgb - white', () => {
    expect(hslToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('should convert hsl to rgb - black', () => {
    expect(hslToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('should handle hue > 360', () => {
    expect(hslToRgb(720, 100, 50)).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('should handle negative hue', () => {
    expect(hslToRgb(-120, 100, 50)).toEqual({ r: 0, g: 0, b: 255 })
  })

  it('should clamp saturation and lightness', () => {
    expect(hslToRgb(0, 150, -10)).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('should return null for non-numeric values', () => {
    expect(hslToRgb('0', 100, 50)).toBeNull()
    expect(hslToRgb(null, 100, 50)).toBeNull()
  })
})

describe('hexToHsl', () => {
  it('should convert hex to hsl', () => {
    expect(hexToHsl('#FF0000')).toEqual({ h: 0, s: 100, l: 50 })
  })

  it('should return null for invalid hex', () => {
    expect(hexToHsl('invalid')).toBeNull()
  })
})

describe('hslToHex', () => {
  it('should convert hsl to hex', () => {
    expect(hslToHex(0, 100, 50)).toBe('#FF0000')
  })

  it('should return null for invalid input', () => {
    expect(hslToHex('0', 100, 50)).toBeNull()
  })
})

describe('detectColorFormat', () => {
  it('should detect hex format', () => {
    expect(detectColorFormat('#FF5733')).toBe('hex')
    expect(detectColorFormat('FF5733')).toBe('hex')
    expect(detectColorFormat('#F53')).toBe('hex')
  })

  it('should detect rgb format', () => {
    expect(detectColorFormat('rgb(255, 87, 51)')).toBe('rgb')
    expect(detectColorFormat('RGB(255,87,51)')).toBe('rgb')
  })

  it('should detect hsl format', () => {
    expect(detectColorFormat('hsl(9, 100%, 60%)')).toBe('hsl')
    expect(detectColorFormat('HSL(9,100%,60%)')).toBe('hsl')
  })

  it('should return null for invalid format', () => {
    expect(detectColorFormat('invalid')).toBeNull()
    expect(detectColorFormat('')).toBeNull()
    expect(detectColorFormat(null)).toBeNull()
  })
})

describe('parseColorInput', () => {
  it('should parse hex input', () => {
    const result = parseColorInput('#FF5733')
    expect(result.valid).toBe(true)
    expect(result.format).toBe('hex')
    expect(result.hex).toBe('#FF5733')
    expect(result.rgb).toEqual({ r: 255, g: 87, b: 51 })
    expect(result.rgbString).toBe('rgb(255, 87, 51)')
    expect(result.hslString).toMatch(/^hsl\(1[01], \d+%, \d+%\)$/)
  })

  it('should parse rgb input', () => {
    const result = parseColorInput('rgb(255, 87, 51)')
    expect(result.valid).toBe(true)
    expect(result.format).toBe('rgb')
    expect(result.hex).toBe('#FF5733')
  })

  it('should parse hsl input', () => {
    const result = parseColorInput('hsl(0, 100%, 50%)')
    expect(result.valid).toBe(true)
    expect(result.format).toBe('hsl')
    expect(result.hex).toBe('#FF0000')
  })

  it('should return error for empty input', () => {
    const result = parseColorInput('')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('should return error for invalid format', () => {
    const result = parseColorInput('invalid')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('格式无效')
  })

  it('should return error for rgb values out of range', () => {
    const result = parseColorInput('rgb(300, 87, 51)')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('0-255')
  })

  it('should return error for hsl hue out of range', () => {
    const result = parseColorInput('hsl(400, 100%, 50%)')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('0-360')
  })

  it('should return error for hsl saturation out of range', () => {
    const result = parseColorInput('hsl(0, 150%, 50%)')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('0-100')
  })
})

describe('getContrastColor', () => {
  it('should return black for light colors', () => {
    expect(getContrastColor('#FFFFFF')).toBe('#000000')
    expect(getContrastColor('#FFFF00')).toBe('#000000')
  })

  it('should return white for dark colors', () => {
    expect(getContrastColor('#000000')).toBe('#FFFFFF')
    expect(getContrastColor('#0000FF')).toBe('#FFFFFF')
  })

  it('should return black for invalid hex', () => {
    expect(getContrastColor('invalid')).toBe('#000000')
  })
})

describe('generateColorVariations', () => {
  it('should generate 6 color variations', () => {
    const variations = generateColorVariations('#FF5733')
    expect(variations.length).toBe(6)
    variations.forEach((v) => {
      expect(v.hex).toMatch(/^#[A-F0-9]{6}$/)
      expect(typeof v.lightness).toBe('number')
    })
  })

  it('should return empty array for invalid hex', () => {
    expect(generateColorVariations('invalid')).toEqual([])
  })

  it('should have increasing lightness values', () => {
    const variations = generateColorVariations('#FF5733')
    for (let i = 1; i < variations.length; i++) {
      expect(variations[i].lightness).toBeGreaterThan(variations[i - 1].lightness)
    }
  })
})
