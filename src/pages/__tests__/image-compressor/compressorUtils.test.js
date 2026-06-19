import { describe, it, expect, beforeEach } from 'vitest'

class LocalStorageMock {
  constructor() {
    this.store = {}
  }
  getItem(key) {
    return this.store[key] || null
  }
  setItem(key, value) {
    this.store[key] = String(value)
  }
  removeItem(key) {
    delete this.store[key]
  }
  clear() {
    this.store = {}
  }
}

globalThis.localStorage = new LocalStorageMock()

import {
  clamp,
  validateQuality,
  validateScale,
  validateFormat,
  validateParams,
  formatFileSize,
  parseFileSizeToBytes,
  calculateSavingsPercent,
  calculateTotalSavings,
  calculateScaledDimensions,
  calculateAspectRatioDimensions,
  generateCompressedFileName,
  getFileExtension,
  validateImageType,
  applyPreset,
  createImageItem,
  generateId,
} from '../../image-compressor/compressorUtils.js'
import {
  addToHistory,
  addBatchToHistory,
  getHistory,
  removeFromHistory,
  clearHistory,
  lruEvict,
  accessHistoryItem,
  formatHistoryItemDisplay,
  safeLocalStorage,
} from '../../image-compressor/storage.js'
import {
  OUTPUT_FORMATS,
  COMPRESSION_PRESETS,
  PARAM_RANGES,
  MAX_HISTORY_ITEMS,
} from '../../image-compressor/constants.js'

describe('compressorUtils - clamp', () => {
  it('should clamp value within range', () => {
    expect(clamp(50, 10, 100)).toBe(50)
    expect(clamp(5, 10, 100)).toBe(10)
    expect(clamp(150, 10, 100)).toBe(100)
    expect(clamp(10, 10, 100)).toBe(10)
    expect(clamp(100, 10, 100)).toBe(100)
  })
})

describe('compressorUtils - validateQuality', () => {
  it('should clamp quality within valid range', () => {
    expect(validateQuality(50)).toBe(50)
    expect(validateQuality(5)).toBe(PARAM_RANGES.quality.min)
    expect(validateQuality(150)).toBe(PARAM_RANGES.quality.max)
    expect(validateQuality('80')).toBe(80)
    expect(validateQuality(null)).toBe(PARAM_RANGES.quality.min)
    expect(validateQuality(undefined)).toBe(PARAM_RANGES.quality.min)
  })
})

describe('compressorUtils - validateScale', () => {
  it('should clamp scale within valid range', () => {
    expect(validateScale(50)).toBe(50)
    expect(validateScale(5)).toBe(PARAM_RANGES.scale.min)
    expect(validateScale(150)).toBe(PARAM_RANGES.scale.max)
    expect(validateScale('80')).toBe(80)
    expect(validateScale(null)).toBe(PARAM_RANGES.scale.max)
    expect(validateScale(undefined)).toBe(PARAM_RANGES.scale.max)
  })
})

describe('compressorUtils - validateFormat', () => {
  it('should return valid format', () => {
    expect(validateFormat(OUTPUT_FORMATS.JPG)).toBe(OUTPUT_FORMATS.JPG)
    expect(validateFormat(OUTPUT_FORMATS.PNG)).toBe(OUTPUT_FORMATS.PNG)
    expect(validateFormat(OUTPUT_FORMATS.WEBP)).toBe(OUTPUT_FORMATS.WEBP)
  })

  it('should default to WEBP for invalid formats', () => {
    expect(validateFormat('image/gif')).toBe(OUTPUT_FORMATS.WEBP)
    expect(validateFormat(null)).toBe(OUTPUT_FORMATS.WEBP)
    expect(validateFormat(undefined)).toBe(OUTPUT_FORMATS.WEBP)
    expect(validateFormat('')).toBe(OUTPUT_FORMATS.WEBP)
  })
})

describe('compressorUtils - validateParams', () => {
  it('should validate and return all params', () => {
    const params = {
      quality: 80,
      scale: 100,
      format: OUTPUT_FORMATS.JPG,
      maintainAspectRatio: true,
    }
    const result = validateParams(params)
    expect(result.quality).toBe(80)
    expect(result.scale).toBe(100)
    expect(result.format).toBe(OUTPUT_FORMATS.JPG)
    expect(result.maintainAspectRatio).toBe(true)
    expect(result.width).toBeNull()
    expect(result.height).toBeNull()
  })

  it('should clamp invalid params', () => {
    const params = {
      quality: 5,
      scale: 150,
      format: 'invalid',
      maintainAspectRatio: false,
      width: '800',
      height: '600',
    }
    const result = validateParams(params)
    expect(result.quality).toBe(PARAM_RANGES.quality.min)
    expect(result.scale).toBe(PARAM_RANGES.scale.max)
    expect(result.format).toBe(OUTPUT_FORMATS.WEBP)
    expect(result.maintainAspectRatio).toBe(false)
    expect(result.width).toBe(800)
    expect(result.height).toBe(600)
  })

  it('should handle null and undefined params', () => {
    const result = validateParams(null)
    expect(result.quality).toBeDefined()
    expect(result.scale).toBeDefined()
    expect(result.format).toBeDefined()
    expect(result.maintainAspectRatio).toBe(true)
  })
})

describe('compressorUtils - formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1023)).toBe('1023 B')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB')
  })

  it('should handle decimal places', () => {
    expect(formatFileSize(1536, 0)).toBe('2 KB')
    expect(formatFileSize(1536, 1)).toBe('1.5 KB')
    expect(formatFileSize(1536, 2)).toBe('1.5 KB')
  })

  it('should handle invalid inputs', () => {
    expect(formatFileSize(-100)).toBe('0 B')
    expect(formatFileSize(null)).toBe('0 B')
    expect(formatFileSize(undefined)).toBe('0 B')
    expect(formatFileSize('100')).toBe('0 B')
  })
})

describe('compressorUtils - parseFileSizeToBytes', () => {
  it('should parse size strings correctly', () => {
    expect(parseFileSizeToBytes('1023 B')).toBe(1023)
    expect(parseFileSizeToBytes('1 KB')).toBe(1024)
    expect(parseFileSizeToBytes('1 MB')).toBe(1024 * 1024)
    expect(parseFileSizeToBytes('1 GB')).toBe(1024 * 1024 * 1024)
    expect(parseFileSizeToBytes('1 TB')).toBe(1024 * 1024 * 1024 * 1024)
  })

  it('should handle decimal values', () => {
    expect(parseFileSizeToBytes('1.5 KB')).toBe(1536)
    expect(parseFileSizeToBytes('2.5 MB')).toBe(Math.round(2.5 * 1024 * 1024))
  })

  it('should handle lowercase units', () => {
    expect(parseFileSizeToBytes('1 kb')).toBe(1024)
    expect(parseFileSizeToBytes('1 mb')).toBe(1024 * 1024)
  })

  it('should return 0 for invalid inputs', () => {
    expect(parseFileSizeToBytes('')).toBe(0)
    expect(parseFileSizeToBytes('invalid')).toBe(0)
    expect(parseFileSizeToBytes(null)).toBe(0)
    expect(parseFileSizeToBytes(undefined)).toBe(0)
    expect(parseFileSizeToBytes(1024)).toBe(0)
  })
})

describe('compressorUtils - calculateSavingsPercent', () => {
  it('should calculate savings correctly', () => {
    expect(calculateSavingsPercent(1000, 500)).toBe(50)
    expect(calculateSavingsPercent(1000, 100)).toBe(90)
    expect(calculateSavingsPercent(1000, 900)).toBe(10)
  })

  it('should return 0 for edge cases', () => {
    expect(calculateSavingsPercent(0, 500)).toBe(0)
    expect(calculateSavingsPercent(1000, 0)).toBe(0)
    expect(calculateSavingsPercent(1000, 1000)).toBe(0)
    expect(calculateSavingsPercent(1000, 1500)).toBe(0)
    expect(calculateSavingsPercent(null, 500)).toBe(0)
    expect(calculateSavingsPercent(1000, null)).toBe(0)
    expect(calculateSavingsPercent(-1000, 500)).toBe(0)
    expect(calculateSavingsPercent(1000, -500)).toBe(0)
  })

  it('should return number with 2 decimal places', () => {
    expect(calculateSavingsPercent(1000, 333)).toBe(66.7)
    expect(calculateSavingsPercent(1000, 666)).toBe(33.4)
  })
})

describe('compressorUtils - calculateTotalSavings', () => {
  it('should calculate total savings for multiple items', () => {
    const items = [
      { originalSize: 1000, compressedSize: 500 },
      { originalSize: 2000, compressedSize: 1000 },
      { originalSize: 3000, compressedSize: 1500 },
    ]
    const result = calculateTotalSavings(items)
    expect(result.totalOriginal).toBe(6000)
    expect(result.totalCompressed).toBe(3000)
    expect(result.totalSavings).toBe(3000)
    expect(result.savingsPercent).toBe(50)
  })

  it('should handle empty array', () => {
    const result = calculateTotalSavings([])
    expect(result.totalOriginal).toBe(0)
    expect(result.totalCompressed).toBe(0)
    expect(result.totalSavings).toBe(0)
    expect(result.savingsPercent).toBe(0)
  })

  it('should handle non-array input', () => {
    const result = calculateTotalSavings(null)
    expect(result.totalOriginal).toBe(0)
    expect(result.totalCompressed).toBe(0)
    expect(result.totalSavings).toBe(0)
    expect(result.savingsPercent).toBe(0)
  })

  it('should handle items with missing sizes', () => {
    const items = [
      { originalSize: 1000 },
      { compressedSize: 500 },
      {},
    ]
    const result = calculateTotalSavings(items)
    expect(result.totalOriginal).toBe(1000)
    expect(result.totalCompressed).toBe(500)
    expect(result.totalSavings).toBe(500)
    expect(result.savingsPercent).toBe(50)
  })
})

describe('compressorUtils - calculateScaledDimensions', () => {
  it('should scale by percentage with aspect ratio maintained', () => {
    const result = calculateScaledDimensions(1000, 500, 50, null, null, true)
    expect(result.width).toBe(500)
    expect(result.height).toBe(250)
  })

  it('should scale by target width with aspect ratio maintained', () => {
    const result = calculateScaledDimensions(1000, 500, 100, 500, null, true)
    expect(result.width).toBe(500)
    expect(result.height).toBe(250)
  })

  it('should scale by target height with aspect ratio maintained', () => {
    const result = calculateScaledDimensions(1000, 500, 100, null, 250, true)
    expect(result.width).toBe(500)
    expect(result.height).toBe(250)
  })

  it('should use min ratio when both width and height are provided', () => {
    const result = calculateScaledDimensions(1000, 500, 100, 800, 100, true)
    expect(result.width).toBe(200)
    expect(result.height).toBe(100)
  })

  it('should allow independent scaling when aspect ratio not maintained', () => {
    const result = calculateScaledDimensions(1000, 500, 100, 800, 300, false)
    expect(result.width).toBe(800)
    expect(result.height).toBe(300)
  })

  it('should handle invalid inputs', () => {
    const result = calculateScaledDimensions(0, 0, 50, null, null, true)
    expect(result.width).toBe(0)
    expect(result.height).toBe(0)

    const result2 = calculateScaledDimensions(-100, -50, 50, null, null, true)
    expect(result2.width).toBe(0)
    expect(result2.height).toBe(0)
  })

  it('should ensure minimum dimensions of 1px', () => {
    const result = calculateScaledDimensions(10, 10, 1, null, null, false)
    expect(result.width).toBeGreaterThanOrEqual(1)
    expect(result.height).toBeGreaterThanOrEqual(1)
  })
})

describe('compressorUtils - calculateAspectRatioDimensions', () => {
  it('should calculate height from width', () => {
    const result = calculateAspectRatioDimensions(1920, 1080, 960, true)
    expect(result.width).toBe(960)
    expect(result.height).toBe(540)
  })

  it('should calculate width from height', () => {
    const result = calculateAspectRatioDimensions(1920, 1080, 540, false)
    expect(result.width).toBe(960)
    expect(result.height).toBe(540)
  })

  it('should handle invalid inputs', () => {
    const result = calculateAspectRatioDimensions(0, 0, 500, true)
    expect(result.width).toBe(0)
    expect(result.height).toBe(0)

    const result2 = calculateAspectRatioDimensions(1920, 1080, 0, true)
    expect(result2.width).toBe(1920)
    expect(result2.height).toBe(1080)

    const result3 = calculateAspectRatioDimensions(1920, 1080, -100, true)
    expect(result3.width).toBe(1920)
    expect(result3.height).toBe(1080)
  })
})

describe('compressorUtils - generateCompressedFileName', () => {
  it('should generate correct filename', () => {
    expect(generateCompressedFileName('photo.jpg', OUTPUT_FORMATS.WEBP))
      .toBe('photo_compressed.webp')
    expect(generateCompressedFileName('image.png', OUTPUT_FORMATS.JPG))
      .toBe('image_compressed.jpg')
    expect(generateCompressedFileName('test.file.name.png', OUTPUT_FORMATS.PNG))
      .toBe('test.file.name_compressed.png')
  })

  it('should handle empty filename', () => {
    expect(generateCompressedFileName('', OUTPUT_FORMATS.WEBP))
      .toBe('compressed.webp')
    expect(generateCompressedFileName(null, OUTPUT_FORMATS.JPG))
      .toBe('compressed.jpg')
    expect(generateCompressedFileName(undefined, OUTPUT_FORMATS.PNG))
      .toBe('compressed.png')
  })

  it('should handle invalid format', () => {
    expect(generateCompressedFileName('photo', 'invalid'))
      .toBe('photo_compressed.webp')
  })
})

describe('compressorUtils - getFileExtension', () => {
  it('should return correct extension', () => {
    expect(getFileExtension({ type: 'image/jpeg' })).toBe('jpg')
    expect(getFileExtension({ type: 'image/png' })).toBe('png')
    expect(getFileExtension({ type: 'image/webp' })).toBe('webp')
  })

  it('should default to png', () => {
    expect(getFileExtension({ type: 'image/gif' })).toBe('png')
    expect(getFileExtension({})).toBe('png')
    expect(getFileExtension(null)).toBe('png')
    expect(getFileExtension(undefined)).toBe('png')
  })
})

describe('compressorUtils - validateImageType', () => {
  it('should accept valid image types', () => {
    expect(validateImageType({ type: 'image/jpeg' })).toBe(true)
    expect(validateImageType({ type: 'image/png' })).toBe(true)
    expect(validateImageType({ type: 'image/webp' })).toBe(true)
  })

  it('should reject invalid types', () => {
    expect(validateImageType({ type: 'image/gif' })).toBe(false)
    expect(validateImageType({ type: 'application/pdf' })).toBe(false)
    expect(validateImageType({ type: 'text/plain' })).toBe(false)
  })

  it('should handle null/undefined', () => {
    expect(validateImageType(null)).toBe(false)
    expect(validateImageType(undefined)).toBe(false)
    expect(validateImageType({})).toBe(false)
  })
})

describe('compressorUtils - applyPreset', () => {
  it('should apply extreme compression preset', () => {
    const result = applyPreset('EXTREME', OUTPUT_FORMATS.JPG)
    expect(result.quality).toBe(COMPRESSION_PRESETS.EXTREME.quality)
    expect(result.scale).toBe(COMPRESSION_PRESETS.EXTREME.scale)
    expect(result.format).toBe(OUTPUT_FORMATS.JPG)
    expect(result.maintainAspectRatio).toBe(true)
  })

  it('should apply balanced compression preset', () => {
    const result = applyPreset('BALANCED', OUTPUT_FORMATS.PNG)
    expect(result.quality).toBe(COMPRESSION_PRESETS.BALANCED.quality)
    expect(result.scale).toBe(COMPRESSION_PRESETS.BALANCED.scale)
    expect(result.format).toBe(OUTPUT_FORMATS.PNG)
  })

  it('should apply light compression preset', () => {
    const result = applyPreset('LIGHT', OUTPUT_FORMATS.WEBP)
    expect(result.quality).toBe(COMPRESSION_PRESETS.LIGHT.quality)
    expect(result.scale).toBe(COMPRESSION_PRESETS.LIGHT.scale)
  })

  it('should apply format only preset', () => {
    const result = applyPreset('FORMAT_ONLY', OUTPUT_FORMATS.JPG)
    expect(result.quality).toBe(COMPRESSION_PRESETS.FORMAT_ONLY.quality)
    expect(result.scale).toBe(COMPRESSION_PRESETS.FORMAT_ONLY.scale)
  })

  it('should return null for unknown preset', () => {
    const result = applyPreset('UNKNOWN', OUTPUT_FORMATS.JPG)
    expect(result).toBeNull()
  })

  it('should default format to WEBP if not provided', () => {
    const result = applyPreset('LIGHT')
    expect(result.format).toBe(OUTPUT_FORMATS.WEBP)
  })
})

describe('compressorUtils - generateId', () => {
  it('should generate unique ids', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^img_\d+_\d+$/)
  })

  it('should use custom prefix', () => {
    const id = generateId('test')
    expect(id).toMatch(/^test_\d+_\d+$/)
  })
})

describe('compressorUtils - createImageItem', () => {
  it('should create valid image item', () => {
    const file = { name: 'test.jpg', size: 100000 }
    const item = createImageItem(file, 'data:image/jpeg;base64,...', 1920, 1080)
    expect(item.id).toBeDefined()
    expect(item.name).toBe('test.jpg')
    expect(item.originalSize).toBe(100000)
    expect(item.originalWidth).toBe(1920)
    expect(item.originalHeight).toBe(1080)
    expect(item.dataUrl).toBe('data:image/jpeg;base64,...')
    expect(item.status).toBe('pending')
    expect(item.progress).toBe(0)
  })

  it('should handle missing file', () => {
    const item = createImageItem(null, 'data:...', 800, 600)
    expect(item.name).toBe('unknown')
    expect(item.originalSize).toBe(0)
  })
})

describe('storage - safeLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should set and get items', () => {
    safeLocalStorage.setItem('test', 'value')
    expect(safeLocalStorage.getItem('test')).toBe('value')
  })

  it('should remove items', () => {
    safeLocalStorage.setItem('test', 'value')
    safeLocalStorage.removeItem('test')
    expect(safeLocalStorage.getItem('test')).toBeNull()
  })
})

describe('storage - history management', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should add item to history', () => {
    const item = {
      id: 'test1',
      name: 'test.jpg',
      quality: 80,
      scale: 100,
      format: OUTPUT_FORMATS.JPG,
      originalSize: 1000,
      compressedSize: 500,
    }
    const history = addToHistory(item)
    expect(history).toHaveLength(1)
    expect(history[0].id).toBe('test1')
  })

  it('should not exceed max history items', () => {
    for (let i = 0; i < 25; i++) {
      addToHistory({
        id: `test${i}`,
        name: `test${i}.jpg`,
        quality: 80,
        scale: 100,
        format: OUTPUT_FORMATS.JPG,
        originalSize: 1000,
        compressedSize: 500,
      })
    }
    const history = getHistory()
    expect(history.length).toBeLessThanOrEqual(MAX_HISTORY_ITEMS)
    expect(history.length).toBe(MAX_HISTORY_ITEMS)
  })

  it('should respect custom max items', () => {
    for (let i = 0; i < 10; i++) {
      addToHistory({
        id: `test${i}`,
        name: `test${i}.jpg`,
        quality: 80,
        scale: 100,
        format: OUTPUT_FORMATS.JPG,
        originalSize: 1000,
        compressedSize: 500,
      }, 5)
    }
    const history = getHistory()
    expect(history.length).toBe(5)
  })

  it('should replace existing item with same id', () => {
    addToHistory({
      id: 'test1',
      name: 'old.jpg',
      quality: 80,
      scale: 100,
      format: OUTPUT_FORMATS.JPG,
      originalSize: 1000,
      compressedSize: 500,
    })
    addToHistory({
      id: 'test1',
      name: 'new.jpg',
      quality: 60,
      scale: 80,
      format: OUTPUT_FORMATS.WEBP,
      originalSize: 1000,
      compressedSize: 300,
    })
    const history = getHistory()
    expect(history).toHaveLength(1)
    expect(history[0].name).toBe('new.jpg')
  })

  it('should remove item from history', () => {
    addToHistory({
      id: 'test1',
      name: 'test.jpg',
      quality: 80,
      scale: 100,
      format: OUTPUT_FORMATS.JPG,
      originalSize: 1000,
      compressedSize: 500,
    })
    const history = removeFromHistory('test1')
    expect(history).toHaveLength(0)
    expect(getHistory()).toHaveLength(0)
  })

  it('should clear all history', () => {
    addToHistory({
      id: 'test1',
      name: 'test.jpg',
      quality: 80,
      scale: 100,
      format: OUTPUT_FORMATS.JPG,
      originalSize: 1000,
      compressedSize: 500,
    })
    const history = clearHistory()
    expect(history).toHaveLength(0)
    expect(getHistory()).toHaveLength(0)
  })

  it('should handle null item when adding', () => {
    const history = addToHistory(null)
    expect(history).toEqual(getHistory())
  })
})

describe('storage - batch history', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should add multiple items to history', () => {
    const items = [
      {
        id: 'batch1',
        name: 'test1.jpg',
        quality: 80,
        scale: 100,
        format: OUTPUT_FORMATS.JPG,
        originalSize: 1000,
        compressedSize: 500,
      },
      {
        id: 'batch2',
        name: 'test2.jpg',
        quality: 80,
        scale: 100,
        format: OUTPUT_FORMATS.JPG,
        originalSize: 2000,
        compressedSize: 1000,
      },
    ]
    const history = addBatchToHistory(items)
    expect(history).toHaveLength(2)
  })

  it('should handle empty batch', () => {
    const history = addBatchToHistory([])
    expect(history).toEqual(getHistory())
  })

  it('should not add duplicate ids', () => {
    addToHistory({
      id: 'existing',
      name: 'existing.jpg',
      quality: 80,
      scale: 100,
      format: OUTPUT_FORMATS.JPG,
      originalSize: 1000,
      compressedSize: 500,
    })
    const items = [
      {
        id: 'existing',
        name: 'should-not-add.jpg',
        quality: 80,
        scale: 100,
        format: OUTPUT_FORMATS.JPG,
        originalSize: 1000,
        compressedSize: 500,
      },
      {
        id: 'new',
        name: 'new.jpg',
        quality: 80,
        scale: 100,
        format: OUTPUT_FORMATS.JPG,
        originalSize: 1000,
        compressedSize: 500,
      },
    ]
    const history = addBatchToHistory(items)
    expect(history).toHaveLength(2)
  })
})

describe('storage - LRU eviction', () => {
  it('should evict oldest items when over limit', () => {
    const history = Array.from({ length: 30 }, (_, i) => ({
      id: `item${i}`,
      name: `item${i}.jpg`,
    }))
    const result = lruEvict(history, 20)
    expect(result.length).toBe(20)
    expect(result[0].id).toBe('item0')
    expect(result[19].id).toBe('item19')
  })

  it('should not evict when under limit', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      id: `item${i}`,
      name: `item${i}.jpg`,
    }))
    const result = lruEvict(history, 20)
    expect(result.length).toBe(10)
  })

  it('should handle non-array input', () => {
    const result = lruEvict(null, 20)
    expect(result).toEqual([])
  })
})

describe('storage - access history item', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should move accessed item to front', () => {
    addToHistory({
      id: 'item1',
      name: 'item1.jpg',
      quality: 80,
      scale: 100,
      format: OUTPUT_FORMATS.JPG,
      originalSize: 1000,
      compressedSize: 500,
    })
    addToHistory({
      id: 'item2',
      name: 'item2.jpg',
      quality: 80,
      scale: 100,
      format: OUTPUT_FORMATS.JPG,
      originalSize: 1000,
      compressedSize: 500,
    })
    addToHistory({
      id: 'item3',
      name: 'item3.jpg',
      quality: 80,
      scale: 100,
      format: OUTPUT_FORMATS.JPG,
      originalSize: 1000,
      compressedSize: 500,
    })

    const history = accessHistoryItem('item1')
    expect(history[0].id).toBe('item1')
    expect(history[1].id).toBe('item3')
    expect(history[2].id).toBe('item2')
  })

  it('should return unchanged history for non-existent id', () => {
    addToHistory({
      id: 'item1',
      name: 'item1.jpg',
      quality: 80,
      scale: 100,
      format: OUTPUT_FORMATS.JPG,
      originalSize: 1000,
      compressedSize: 500,
    })
    const original = getHistory()
    const result = accessHistoryItem('nonexistent')
    expect(result).toEqual(original)
  })
})

describe('storage - formatHistoryItemDisplay', () => {
  it('should format history item for display', () => {
    const item = {
      id: 'test1',
      name: 'test.jpg',
      quality: 80,
      scale: 100,
      format: OUTPUT_FORMATS.JPG,
      originalSize: 1000,
      compressedSize: 500,
      compressedAt: new Date().toISOString(),
    }
    const result = formatHistoryItemDisplay(item)
    expect(result.formatName).toBe('JPG')
    expect(result.savingsPercent).toBe(50)
  })

  it('should handle null item', () => {
    const result = formatHistoryItemDisplay(null)
    expect(result).toBeNull()
  })

  it('should handle zero original size', () => {
    const item = {
      id: 'test1',
      name: 'test.jpg',
      quality: 80,
      scale: 100,
      format: OUTPUT_FORMATS.JPG,
      originalSize: 0,
      compressedSize: 500,
    }
    const result = formatHistoryItemDisplay(item)
    expect(result.savingsPercent).toBe(0)
  })
})
