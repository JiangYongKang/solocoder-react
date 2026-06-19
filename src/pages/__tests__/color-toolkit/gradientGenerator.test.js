import { describe, it, expect } from 'vitest'
import {
  generateLinearGradient,
  generateRadialGradient,
  generateGradientCSS,
  generateFullGradientCSS,
  GRADIENT_TYPES,
  LINEAR_DIRECTIONS,
} from '../../color-toolkit/gradientGenerator.js'

describe('LINEAR_DIRECTIONS', () => {
  it('should have 8 directions', () => {
    expect(LINEAR_DIRECTIONS.length).toBe(8)
  })

  it('should include all required directions', () => {
    const keys = LINEAR_DIRECTIONS.map((d) => d.key)
    expect(keys).toContain('to top')
    expect(keys).toContain('to bottom')
    expect(keys).toContain('to left')
    expect(keys).toContain('to right')
    expect(keys).toContain('to top left')
    expect(keys).toContain('to top right')
    expect(keys).toContain('to bottom left')
    expect(keys).toContain('to bottom right')
  })

  it('should have name and angle for each direction', () => {
    LINEAR_DIRECTIONS.forEach((d) => {
      expect(d).toHaveProperty('key')
      expect(d).toHaveProperty('name')
      expect(d).toHaveProperty('angle')
      expect(typeof d.name).toBe('string')
      expect(d.name.length).toBeGreaterThan(0)
    })
  })
})

describe('generateLinearGradient', () => {
  it('should generate linear gradient with default direction', () => {
    const result = generateLinearGradient('#FF5733', '#33FF57')
    expect(result).toBe('linear-gradient(to right, #FF5733, #33FF57)')
  })

  it('should generate linear gradient with custom direction', () => {
    const result = generateLinearGradient('#FF5733', '#33FF57', 'to bottom')
    expect(result).toBe('linear-gradient(to bottom, #FF5733, #33FF57)')
  })

  it('should handle diagonal directions', () => {
    const result = generateLinearGradient('#FF5733', '#33FF57', 'to bottom right')
    expect(result).toBe('linear-gradient(to bottom right, #FF5733, #33FF57)')
  })

  it('should return empty string for missing colors', () => {
    expect(generateLinearGradient('', '#33FF57')).toBe('')
    expect(generateLinearGradient('#FF5733', '')).toBe('')
    expect(generateLinearGradient(null, '#33FF57')).toBe('')
  })
})

describe('generateRadialGradient', () => {
  it('should generate radial gradient', () => {
    const result = generateRadialGradient('#FF5733', '#33FF57')
    expect(result).toBe('radial-gradient(circle, #FF5733, #33FF57)')
  })

  it('should return empty string for missing colors', () => {
    expect(generateRadialGradient('', '#33FF57')).toBe('')
    expect(generateRadialGradient('#FF5733', '')).toBe('')
  })
})

describe('generateGradientCSS', () => {
  it('should generate linear gradient by default', () => {
    const result = generateGradientCSS('#FF5733', '#33FF57')
    expect(result).toBe('linear-gradient(to right, #FF5733, #33FF57)')
  })

  it('should generate linear gradient when type is linear', () => {
    const result = generateGradientCSS('#FF5733', '#33FF57', GRADIENT_TYPES.LINEAR, 'to top')
    expect(result).toBe('linear-gradient(to top, #FF5733, #33FF57)')
  })

  it('should generate radial gradient when type is radial', () => {
    const result = generateGradientCSS('#FF5733', '#33FF57', GRADIENT_TYPES.RADIAL)
    expect(result).toBe('radial-gradient(circle, #FF5733, #33FF57)')
  })

  it('should default to linear for unknown type', () => {
    const result = generateGradientCSS('#FF5733', '#33FF57', 'unknown')
    expect(result).toContain('linear-gradient')
  })
})

describe('generateFullGradientCSS', () => {
  it('should generate full CSS with background property', () => {
    const result = generateFullGradientCSS('#FF5733', '#33FF57')
    expect(result).toBe('background: linear-gradient(to right, #FF5733, #33FF57);')
  })

  it('should generate full CSS for radial gradient', () => {
    const result = generateFullGradientCSS('#FF5733', '#33FF57', GRADIENT_TYPES.RADIAL)
    expect(result).toBe('background: radial-gradient(circle, #FF5733, #33FF57);')
  })
})

describe('GRADIENT_TYPES', () => {
  it('should have LINEAR and RADIAL types', () => {
    expect(GRADIENT_TYPES.LINEAR).toBe('linear')
    expect(GRADIENT_TYPES.RADIAL).toBe('radial')
  })
})
