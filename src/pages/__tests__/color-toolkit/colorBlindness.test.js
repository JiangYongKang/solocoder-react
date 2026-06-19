import { describe, it, expect } from 'vitest'
import {
  applyColorMatrix,
  simulateProtanopia,
  simulateDeuteranopia,
  simulateTritanopia,
  simulateColorBlindness,
} from '../../color-toolkit/colorBlindness.js'

describe('applyColorMatrix', () => {
  it('should apply identity matrix without changing colors', () => {
    const identityMatrix = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]
    expect(applyColorMatrix(255, 100, 50, identityMatrix)).toEqual({ r: 255, g: 100, b: 50 })
  })

  it('should clamp output values between 0 and 255', () => {
    const amplifyMatrix = [
      [2, 0, 0],
      [0, 2, 0],
      [0, 0, 2],
    ]
    const result = applyColorMatrix(200, 200, 200, amplifyMatrix)
    expect(result.r).toBe(255)
    expect(result.g).toBe(255)
    expect(result.b).toBe(255)
  })

  it('should round output values to integers', () => {
    const testMatrix = [
      [0.5, 0, 0],
      [0, 0.333, 0],
      [0, 0, 0.666],
    ]
    const result = applyColorMatrix(100, 100, 100, testMatrix)
    expect(Number.isInteger(result.r)).toBe(true)
    expect(Number.isInteger(result.g)).toBe(true)
    expect(Number.isInteger(result.b)).toBe(true)
  })

  it('should return null for non-numeric rgb values', () => {
    const testMatrix = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]
    expect(applyColorMatrix('255', 100, 50, testMatrix)).toBeNull()
    expect(applyColorMatrix(null, 100, 50, testMatrix)).toBeNull()
  })

  it('should return null for invalid matrix', () => {
    expect(applyColorMatrix(255, 100, 50, null)).toBeNull()
    expect(applyColorMatrix(255, 100, 50, [])).toBeNull()
    expect(applyColorMatrix(255, 100, 50, [[1]])).toBeNull()
  })
})

describe('simulateProtanopia', () => {
  it('should transform red color', () => {
    const result = simulateProtanopia(255, 0, 0)
    expect(result).toBeDefined()
    expect(result.r).toBeLessThan(255)
    expect(result.g).toBeGreaterThan(0)
    expect(result.b).toBe(0)
  })

  it('should return valid rgb values', () => {
    const result = simulateProtanopia(128, 64, 200)
    expect(result.r).toBeGreaterThanOrEqual(0)
    expect(result.r).toBeLessThanOrEqual(255)
    expect(result.g).toBeGreaterThanOrEqual(0)
    expect(result.g).toBeLessThanOrEqual(255)
    expect(result.b).toBeGreaterThanOrEqual(0)
    expect(result.b).toBeLessThanOrEqual(255)
  })
})

describe('simulateDeuteranopia', () => {
  it('should transform green color', () => {
    const result = simulateDeuteranopia(0, 255, 0)
    expect(result).toBeDefined()
    expect(result.r).toBeGreaterThan(0)
    expect(result.g).toBeLessThan(255)
    expect(result.b).toBeGreaterThan(0)
  })

  it('should return valid rgb values', () => {
    const result = simulateDeuteranopia(128, 64, 200)
    expect(result.r).toBeGreaterThanOrEqual(0)
    expect(result.r).toBeLessThanOrEqual(255)
    expect(result.g).toBeGreaterThanOrEqual(0)
    expect(result.g).toBeLessThanOrEqual(255)
    expect(result.b).toBeGreaterThanOrEqual(0)
    expect(result.b).toBeLessThanOrEqual(255)
  })
})

describe('simulateTritanopia', () => {
  it('should transform blue color', () => {
    const result = simulateTritanopia(0, 0, 255)
    expect(result).toBeDefined()
    expect(result.r).toBe(0)
    expect(result.g).toBeGreaterThan(0)
    expect(result.b).toBeLessThan(255)
  })

  it('should return valid rgb values', () => {
    const result = simulateTritanopia(128, 64, 200)
    expect(result.r).toBeGreaterThanOrEqual(0)
    expect(result.r).toBeLessThanOrEqual(255)
    expect(result.g).toBeGreaterThanOrEqual(0)
    expect(result.g).toBeLessThanOrEqual(255)
    expect(result.b).toBeGreaterThanOrEqual(0)
    expect(result.b).toBeLessThanOrEqual(255)
  })
})

describe('simulateColorBlindness', () => {
  it('should return all simulation types', () => {
    const result = simulateColorBlindness('#FF5733')

    expect(result).not.toBeNull()
    expect(result).toHaveProperty('original')
    expect(result).toHaveProperty('protanopia')
    expect(result).toHaveProperty('deuteranopia')
    expect(result).toHaveProperty('tritanopia')
  })

  it('should preserve original color', () => {
    const result = simulateColorBlindness('#FF5733')
    expect(result.original.hex).toBe('#FF5733')
    expect(result.original.rgb).toEqual({ r: 255, g: 87, b: 51 })
  })

  it('should include hex and rgb for each simulation', () => {
    const result = simulateColorBlindness('#FF5733')

    expect(result.protanopia.hex).toMatch(/^#[A-F0-9]{6}$/)
    expect(result.protanopia.rgb).toBeDefined()

    expect(result.deuteranopia.hex).toMatch(/^#[A-F0-9]{6}$/)
    expect(result.deuteranopia.rgb).toBeDefined()

    expect(result.tritanopia.hex).toMatch(/^#[A-F0-9]{6}$/)
    expect(result.tritanopia.rgb).toBeDefined()
  })

  it('should include name for each simulation type', () => {
    const result = simulateColorBlindness('#FF5733')

    expect(result.protanopia.name).toBe('红色盲')
    expect(result.deuteranopia.name).toBe('绿色盲')
    expect(result.tritanopia.name).toBe('蓝黄色盲')
  })

  it('should return null for invalid hex', () => {
    expect(simulateColorBlindness('invalid')).toBeNull()
    expect(simulateColorBlindness('')).toBeNull()
  })

  it('should produce different results for different types', () => {
    const result = simulateColorBlindness('#00FF00')

    expect(result.protanopia.hex).not.toEqual(result.deuteranopia.hex)
    expect(result.protanopia.hex).not.toEqual(result.tritanopia.hex)
    expect(result.deuteranopia.hex).not.toEqual(result.tritanopia.hex)
  })
})
