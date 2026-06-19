import { describe, it, expect } from 'vitest'
import {
  getComplementaryColors,
  getAnalogousColors,
  getTriadicColors,
  generateAllPalettes,
} from '../../color-toolkit/paletteGenerator.js'
import { hexToHsl } from '../../color-toolkit/colorUtils.js'

describe('getComplementaryColors', () => {
  it('should generate complementary palette with 6 colors', () => {
    const colors = getComplementaryColors('#FF5733')
    expect(colors.length).toBe(6)
    colors.forEach((c) => {
      expect(c.hex).toMatch(/^#[A-F0-9]{6}$/)
      expect(typeof c.angle).toBe('number')
    })
  })

  it('should have base color as first color', () => {
    const colors = getComplementaryColors('#FF5733')
    expect(colors[0].hex).toBe('#FF5733')
    expect(colors[0].type).toBe('base')
  })

  it('should have complementary color at 180 degrees offset', () => {
    const baseHsl = hexToHsl('#FF5733')
    const colors = getComplementaryColors('#FF5733')
    const complementary = colors.find((c) => c.type === 'complementary')

    expect(complementary).toBeDefined()
    const expectedAngle = ((baseHsl.h + 180) % 360)
    expect(Math.abs(complementary.angle - expectedAngle)).toBeLessThan(1)
  })

  it('should return empty array for invalid hex', () => {
    expect(getComplementaryColors('invalid')).toEqual([])
  })

  it('should include variant colors', () => {
    const colors = getComplementaryColors('#FF5733')
    const baseVariants = colors.filter((c) => c.type === 'base-variant')
    const complementaryVariants = colors.filter((c) => c.type === 'complementary-variant')

    expect(baseVariants.length).toBeGreaterThan(0)
    expect(complementaryVariants.length).toBeGreaterThan(0)
  })
})

describe('getAnalogousColors', () => {
  it('should generate analogous palette with 8 colors', () => {
    const colors = getAnalogousColors('#FF5733')
    expect(colors.length).toBe(9)
    colors.forEach((c) => {
      expect(c.hex).toMatch(/^#[A-F0-9]{6}$/)
    })
  })

  it('should have base color in the middle', () => {
    const colors = getAnalogousColors('#FF5733')
    const baseColor = colors.find((c) => c.type === 'base')
    expect(baseColor.hex).toBe('#FF5733')
  })

  it('should have analogous colors at ±30 degrees', () => {
    const baseHsl = hexToHsl('#FF5733')
    const colors = getAnalogousColors('#FF5733')

    const leftColor = colors.find((c) => c.type === 'analogous-left')
    const rightColor = colors.find((c) => c.type === 'analogous-right')

    expect(leftColor).toBeDefined()
    expect(rightColor).toBeDefined()

    const expectedLeftAngle = ((baseHsl.h - 30 + 360) % 360)
    const expectedRightAngle = ((baseHsl.h + 30) % 360)

    expect(Math.abs(leftColor.angle - expectedLeftAngle)).toBeLessThan(1)
    expect(Math.abs(rightColor.angle - expectedRightAngle)).toBeLessThan(1)
  })

  it('should handle negative angles correctly (normalize to 0-360)', () => {
    const colors = getAnalogousColors('#00FFFF')
    const leftColor = colors.find((c) => c.type === 'analogous-left')
    expect(leftColor.angle).toBeGreaterThanOrEqual(0)
    expect(leftColor.angle).toBeLessThan(360)
  })

  it('should return empty array for invalid hex', () => {
    expect(getAnalogousColors('invalid')).toEqual([])
  })
})

describe('getTriadicColors', () => {
  it('should generate triadic palette with 9 colors', () => {
    const colors = getTriadicColors('#FF5733')
    expect(colors.length).toBe(9)
    colors.forEach((c) => {
      expect(c.hex).toMatch(/^#[A-F0-9]{6}$/)
    })
  })

  it('should have base color as first color', () => {
    const colors = getTriadicColors('#FF5733')
    expect(colors[0].hex).toBe('#FF5733')
    expect(colors[0].type).toBe('base')
  })

  it('should have triadic colors at ±120 degrees', () => {
    const baseHsl = hexToHsl('#FF5733')
    const colors = getTriadicColors('#FF5733')

    const triadic1 = colors.find((c) => c.type === 'triadic-1')
    const triadic2 = colors.find((c) => c.type === 'triadic-2')

    expect(triadic1).toBeDefined()
    expect(triadic2).toBeDefined()

    const expectedAngle1 = ((baseHsl.h + 120) % 360)
    const expectedAngle2 = ((baseHsl.h - 120 + 360) % 360)

    expect(Math.abs(triadic1.angle - expectedAngle1)).toBeLessThan(1)
    expect(Math.abs(triadic2.angle - expectedAngle2)).toBeLessThan(1)
  })

  it('should return empty array for invalid hex', () => {
    expect(getTriadicColors('invalid')).toEqual([])
  })

  it('should have all unique colors', () => {
    const colors = getTriadicColors('#FF5733')
    const hexes = colors.map((c) => c.hex)
    const uniqueHexes = new Set(hexes)
    expect(uniqueHexes.size).toBe(hexes.length)
  })
})

describe('generateAllPalettes', () => {
  it('should generate all three palette types', () => {
    const palettes = generateAllPalettes('#FF5733')

    expect(palettes).toHaveProperty('complementary')
    expect(palettes).toHaveProperty('analogous')
    expect(palettes).toHaveProperty('triadic')

    expect(Array.isArray(palettes.complementary)).toBe(true)
    expect(Array.isArray(palettes.analogous)).toBe(true)
    expect(Array.isArray(palettes.triadic)).toBe(true)
  })

  it('should handle invalid hex gracefully', () => {
    const palettes = generateAllPalettes('invalid')

    expect(palettes.complementary).toEqual([])
    expect(palettes.analogous).toEqual([])
    expect(palettes.triadic).toEqual([])
  })

  it('should maintain color properties in all palettes', () => {
    const palettes = generateAllPalettes('#FF5733')

    Object.values(palettes).forEach((colors) => {
      colors.forEach((c) => {
        expect(c).toHaveProperty('hex')
        expect(c).toHaveProperty('type')
        expect(c).toHaveProperty('angle')
      })
    })
  })
})
