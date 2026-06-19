import { describe, it, expect } from 'vitest'
import {
  extractColorsFromImageData,
  quantizeColor,
  getColorDistance,
  estimateColorDiversity,
  computeAdaptiveQuantFactor,
  computeAdaptiveMergeThreshold,
  mergeSimilarColors,
} from '../../color-toolkit/brandColorExtractor.js'

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

  it('should extract 5 distinct colors from diverse image', () => {
    const pixelData = []
    const colors = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [255, 255, 0],
      [255, 0, 255],
    ]
    for (let i = 0; i < 20; i++) {
      const color = colors[i % colors.length]
      pixelData.push(color[0], color[1], color[2], 255)
    }

    const imageData = createMockImageData(10, 2, pixelData)
    const result = extractColorsFromImageData(imageData, 5, 1)

    expect(result.length).toBe(5)
  })
})

describe('quantizeColor', () => {
  it('should quantize colors with given factor', () => {
    expect(quantizeColor(15, 20, 30, 16)).toEqual({ r: 16, g: 16, b: 32 })
    expect(quantizeColor(128, 128, 128, 32)).toEqual({ r: 128, g: 128, b: 128 })
    expect(quantizeColor(255, 255, 255, 32)).toEqual({ r: 256, g: 256, b: 256 })
  })

  it('should handle zero values', () => {
    expect(quantizeColor(0, 0, 0, 16)).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('should work with different factors', () => {
    const result1 = quantizeColor(100, 150, 200, 8)
    const result2 = quantizeColor(100, 150, 200, 64)
    expect(result1.r % 8).toBe(0)
    expect(result2.r % 64).toBe(0)
  })
})

describe('getColorDistance', () => {
  it('should calculate Euclidean distance between colors', () => {
    const c1 = { r: 255, g: 0, b: 0 }
    const c2 = { r: 0, g: 0, b: 0 }
    expect(getColorDistance(c1, c2)).toBe(255)
  })

  it('should return 0 for identical colors', () => {
    const c = { r: 100, g: 150, b: 200 }
    expect(getColorDistance(c, c)).toBe(0)
  })

  it('should be symmetric', () => {
    const c1 = { r: 255, g: 0, b: 0 }
    const c2 = { r: 0, g: 255, b: 0 }
    expect(getColorDistance(c1, c2)).toBe(getColorDistance(c2, c1))
  })
})

describe('estimateColorDiversity', () => {
  it('should return 0 for fewer than 2 colors', () => {
    expect(estimateColorDiversity([])).toBe(0)
    expect(estimateColorDiversity([{ r: 255, g: 0, b: 0 }])).toBe(0)
  })

  it('should return higher diversity for varied colors', () => {
    const diverseColors = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
    ]
    const similarColors = [
      { r: 255, g: 0, b: 0 },
      { r: 250, g: 5, b: 5 },
      { r: 245, g: 10, b: 10 },
    ]
    expect(estimateColorDiversity(diverseColors)).toBeGreaterThan(
      estimateColorDiversity(similarColors)
    )
  })
})

describe('computeAdaptiveQuantFactor', () => {
  const createMockImageData = (width, height, pixelData) => {
    return {
      width,
      height,
      data: new Uint8ClampedArray(pixelData),
    }
  }

  it('should return smaller factor for diverse image', () => {
    const diversePixels = []
    for (let i = 0; i < 100; i++) {
      diversePixels.push(
        (i * 25) % 256,
        (i * 50) % 256,
        (i * 75) % 256,
        255
      )
    }
    const diverseImage = createMockImageData(10, 10, diversePixels)

    const similarPixels = []
    for (let i = 0; i < 100; i++) {
      similarPixels.push(250 + (i % 5), 0, 0, 255)
    }
    const similarImage = createMockImageData(10, 10, similarPixels)

    const diverseFactor = computeAdaptiveQuantFactor(diverseImage, 1)
    const similarFactor = computeAdaptiveQuantFactor(similarImage, 1)

    expect(diverseFactor).toBeLessThanOrEqual(similarFactor)
  })

  it('should handle single-color image', () => {
    const pixelData = new Array(4 * 100).fill(0).map((_, i) => {
      if ((i + 1) % 4 === 0) return 255
      return 255
    })
    const imageData = createMockImageData(10, 10, pixelData)
    const factor = computeAdaptiveQuantFactor(imageData, 1)
    expect(factor).toBeGreaterThan(0)
    expect(factor).toBeLessThanOrEqual(48)
  })
})

describe('computeAdaptiveMergeThreshold', () => {
  const createMockImageData = (width, height, pixelData) => {
    return {
      width,
      height,
      data: new Uint8ClampedArray(pixelData),
    }
  }

  it('should return a positive threshold', () => {
    const pixelData = []
    for (let i = 0; i < 64; i++) {
      pixelData.push(i % 256, (i * 2) % 256, (i * 3) % 256, 255)
    }
    const imageData = createMockImageData(8, 8, pixelData)
    const threshold = computeAdaptiveMergeThreshold(imageData, 32, 1)
    expect(threshold).toBeGreaterThan(0)
  })
})

describe('mergeSimilarColors', () => {
  it('should merge similar colors using weighted average', () => {
    const sortedColors = [
      { hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 }, count: 10, percentage: 50 },
      { hex: '#FA0505', rgb: { r: 250, g: 5, b: 5 }, count: 5, percentage: 25 },
      { hex: '#00FF00', rgb: { r: 0, g: 255, b: 0 }, count: 5, percentage: 25 },
    ]

    const result = mergeSimilarColors(sortedColors, 2, 50)

    expect(result.length).toBe(2)
    expect(result[0].count).toBe(15)
    expect(result[0].rgb.r).toBeGreaterThan(250)
    expect(result[0].rgb.r).toBeLessThanOrEqual(255)
  })

  it('should return all colors when they are distinct', () => {
    const sortedColors = [
      { hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 }, count: 10, percentage: 33 },
      { hex: '#00FF00', rgb: { r: 0, g: 255, b: 0 }, count: 10, percentage: 33 },
      { hex: '#0000FF', rgb: { r: 0, g: 0, b: 255 }, count: 10, percentage: 34 },
    ]

    const result = mergeSimilarColors(sortedColors, 3, 50)

    expect(result.length).toBe(3)
  })

  it('should respect maxColors limit', () => {
    const sortedColors = []
    for (let i = 0; i < 20; i++) {
      sortedColors.push({
        hex: '#AAAAAA',
        rgb: { r: i * 10, g: i * 10, b: i * 10 },
        count: 1,
        percentage: 5,
      })
    }

    const result = mergeSimilarColors(sortedColors, 3, 100)

    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('should sort merged colors by count descending', () => {
    const sortedColors = [
      { hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 }, count: 20, percentage: 50 },
      { hex: '#00FF00', rgb: { r: 0, g: 255, b: 0 }, count: 15, percentage: 37.5 },
      { hex: '#0000FF', rgb: { r: 0, g: 0, b: 255 }, count: 5, percentage: 12.5 },
    ]

    const result = mergeSimilarColors(sortedColors, 3, 10)

    expect(result.length).toBe(3)
    expect(result[0].count).toBeGreaterThanOrEqual(result[1].count)
    expect(result[1].count).toBeGreaterThanOrEqual(result[2].count)
  })
})
