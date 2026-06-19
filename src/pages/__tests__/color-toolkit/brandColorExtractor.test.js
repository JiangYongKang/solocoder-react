import { describe, it, expect } from 'vitest'
import { extractColorsFromImageData } from '../../color-toolkit/brandColorExtractor.js'

describe('extractColorsFromImageData', () => {
  const createMockImageData = (width, height, pixelData) => {
    return {
      width,
      height,
      data: new Uint8ClampedArray(pixelData),
    }
  }

  it('should return empty array for null input', () => {
    expect(extractColorsFromImageData(null)).toEqual([])
    expect(extractColorsFromImageData(undefined)).toEqual([])
    expect(extractColorsFromImageData({})).toEqual([])
  })

  it('should extract colors from single-color image', () => {
    const imageData = createMockImageData(4, 4, [
      255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
      255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
      255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
      255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
    ])

    const colors = extractColorsFromImageData(imageData)
    expect(colors.length).toBeGreaterThan(0)
    expect(colors[0].hex).toBe('#FF0000')
    expect(colors[0].percentage).toBeCloseTo(100, 0)
  })

  it('should extract multiple colors', () => {
    const pixelData = []
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (i < 2) {
          pixelData.push(255, 0, 0, 255)
        } else {
          pixelData.push(0, 255, 0, 255)
        }
      }
    }

    const imageData = createMockImageData(4, 4, pixelData)
    const colors = extractColorsFromImageData(imageData, 2, 1)

    expect(colors.length).toBe(2)
    expect(colors[0].percentage).toBeCloseTo(50, 0)
    expect(colors[1].percentage).toBeCloseTo(50, 0)
  })

  it('should sort colors by frequency', () => {
    const pixelData = []
    for (let i = 0; i < 12; i++) pixelData.push(255, 0, 0, 255)
    for (let i = 0; i < 3; i++) pixelData.push(0, 255, 0, 255)
    for (let i = 0; i < 1; i++) pixelData.push(0, 0, 255, 255)

    const imageData = createMockImageData(4, 4, pixelData)
    const colors = extractColorsFromImageData(imageData, 3, 1)

    expect(colors.length).toBe(3)
    expect(colors[0].hex).toBe('#FF0000')
    expect(colors[1].hex).toBe('#00FF00')
    expect(colors[2].hex).toBe('#0000FF')
    expect(colors[0].count).toBeGreaterThan(colors[1].count)
    expect(colors[1].count).toBeGreaterThan(colors[2].count)
  })

  it('should skip transparent pixels', () => {
    const pixelData = []
    for (let i = 0; i < 8; i++) {
      if (i < 4) {
        pixelData.push(255, 0, 0, 100)
      } else {
        pixelData.push(0, 255, 0, 255)
      }
    }

    const imageData = createMockImageData(2, 4, pixelData)
    const colors = extractColorsFromImageData(imageData, 2, 1)

    expect(colors.length).toBeGreaterThan(0)
    expect(colors[0].hex).toBe('#00FF00')
  })

  it('should return empty array when all pixels are transparent', () => {
    const pixelData = new Array(64).fill(0).map((_, i) => (i + 1) % 4 === 0 ? 100 : 0)
    const imageData = createMockImageData(4, 4, pixelData)
    const colors = extractColorsFromImageData(imageData)

    expect(colors).toEqual([])
  })

  it('should limit the number of returned colors', () => {
    const pixelData = []
    for (let c = 0; c < 10; c++) {
      for (let i = 0; i < 2; i++) {
        pixelData.push(c * 20, 100, 100, 255)
      }
    }

    const imageData = createMockImageData(4, 5, pixelData)
    const colors = extractColorsFromImageData(imageData, 5, 1)

    expect(colors.length).toBeLessThanOrEqual(5)
  })

  it('should merge similar colors', () => {
    const pixelData = []
    for (let i = 0; i < 4; i++) {
      pixelData.push(255, 0, 0, 255)
      pixelData.push(250, 5, 5, 255)
      pixelData.push(245, 10, 10, 255)
      pixelData.push(0, 255, 0, 255)
    }

    const imageData = createMockImageData(4, 4, pixelData)
    const colors = extractColorsFromImageData(imageData, 2, 1)

    expect(colors.length).toBe(2)
  })

  it('should include count and percentage for each color', () => {
    const pixelData = []
    for (let i = 0; i < 12; i++) pixelData.push(255, 0, 0, 255)
    for (let i = 0; i < 4; i++) pixelData.push(0, 255, 0, 255)

    const imageData = createMockImageData(4, 4, pixelData)
    const colors = extractColorsFromImageData(imageData, 2, 1)

    colors.forEach((color) => {
      expect(color).toHaveProperty('hex')
      expect(color).toHaveProperty('rgb')
      expect(color).toHaveProperty('count')
      expect(color).toHaveProperty('percentage')
      expect(typeof color.count).toBe('number')
      expect(typeof color.percentage).toBe('number')
      expect(color.percentage).toBeGreaterThan(0)
      expect(color.percentage).toBeLessThanOrEqual(100)
    })
  })

  it('should use sampling factor to skip pixels', () => {
    const pixelData = []
    for (let i = 0; i < 64; i++) {
      if (i % 16 < 8) {
        pixelData.push(255, 0, 0, 255)
      } else {
        pixelData.push(0, 255, 0, 255)
      }
    }

    const imageData = createMockImageData(8, 8, pixelData)
    const colors1 = extractColorsFromImageData(imageData, 2, 1)
    const colors2 = extractColorsFromImageData(imageData, 2, 4)

    expect(colors1.length).toBeGreaterThan(0)
    expect(colors2.length).toBeGreaterThan(0)
  })
})
