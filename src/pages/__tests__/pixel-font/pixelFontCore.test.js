import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_GRID_SIZE,
  MIN_GRID_SIZE,
  MAX_GRID_SIZE,
  DEFAULT_FONT_FAMILY,
  EXPORT_FORMAT_VERSION,
  STORAGE_KEY,
} from '@/pages/pixel-font/constants.js'
import {
  createEmptyGlyph,
  cloneGlyph,
  setPixel,
  getPixel,
  togglePixel,
  clearGlyph,
  resizeGlyph,
  encodeGlyphToBase64,
  decodeGlyphFromBase64,
  encodeGlyphToHex,
  generateCSSFontFace,
  exportToJSON,
  validateAndParseJSON,
  initializeGlyphs,
  addCharacter,
  removeCharacter,
  validateGridSize,
  isGlyphEmpty,
  countFilledPixels,
  flipGlyphHorizontal,
  flipGlyphVertical,
  rotateGlyph90,
  shiftGlyph,
  getCharacterFromCodePoint,
  getCodePointString,
  safeGetItem,
  safeSetItem,
  saveFontData,
  loadFontData,
  clearFontData,
} from '@/pages/pixel-font/pixelFontCore.js'

function createMockStorage() {
  const store = {}
  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k])
    }),
    _store: store,
  }
}

function createTestGlyph(size, fillValue = 0) {
  const glyph = []
  for (let y = 0; y < size; y++) {
    const row = []
    for (let x = 0; x < size; x++) {
      row.push(fillValue)
    }
    glyph.push(row)
  }
  return glyph
}

function createPatternGlyph(size) {
  const glyph = createTestGlyph(size, 0)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if ((x + y) % 2 === 0) {
        glyph[y][x] = 1
      }
    }
  }
  return glyph
}

describe('pixelFontCore', () => {
  describe('createEmptyGlyph', () => {
    it('应该创建默认尺寸的空字形', () => {
      const glyph = createEmptyGlyph()
      expect(glyph.length).toBe(DEFAULT_GRID_SIZE)
      glyph.forEach((row) => {
        expect(row.length).toBe(DEFAULT_GRID_SIZE)
        row.forEach((cell) => {
          expect(cell).toBe(0)
        })
      })
    })

    it('应该创建指定尺寸的空字形', () => {
      const glyph = createEmptyGlyph(12)
      expect(glyph.length).toBe(12)
      glyph.forEach((row) => {
        expect(row.length).toBe(12)
        row.forEach((cell) => {
          expect(cell).toBe(0)
        })
      })
    })

    it('应该钳制尺寸在有效范围内', () => {
      const smallGlyph = createEmptyGlyph(8)
      expect(smallGlyph.length).toBe(MIN_GRID_SIZE)

      const largeGlyph = createEmptyGlyph(100)
      expect(largeGlyph.length).toBe(MAX_GRID_SIZE)
    })
  })

  describe('cloneGlyph', () => {
    it('应该深拷贝字形', () => {
      const original = createPatternGlyph(4)
      const cloned = cloneGlyph(original)
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned[0]).not.toBe(original[0])
    })

    it('修改克隆不应该影响原字形', () => {
      const original = createTestGlyph(4, 0)
      const cloned = cloneGlyph(original)
      cloned[0][0] = 1
      expect(original[0][0]).toBe(0)
    })

    it('处理 null 或无效输入应该返回空数组', () => {
      expect(cloneGlyph(null)).toEqual([])
      expect(cloneGlyph(undefined)).toEqual([])
      expect(cloneGlyph('invalid')).toEqual([])
    })
  })

  describe('setPixel / getPixel / togglePixel', () => {
    it('setPixel 应该设置指定位置的像素', () => {
      const glyph = createTestGlyph(4, 0)
      const result = setPixel(glyph, 1, 2, 1)
      expect(result[2][1]).toBe(1)
    })

    it('setPixel 不应该修改原字形', () => {
      const glyph = createTestGlyph(4, 0)
      const result = setPixel(glyph, 0, 0, 1)
      expect(glyph[0][0]).toBe(0)
      expect(result[0][0]).toBe(1)
    })

    it('setPixel 越界时应该返回原字形', () => {
      const glyph = createTestGlyph(4, 0)
      const result = setPixel(glyph, 10, 10, 1)
      expect(result).toEqual(glyph)
    })

    it('getPixel 应该返回正确的像素值', () => {
      const glyph = createTestGlyph(4, 0)
      glyph[2][3] = 1
      expect(getPixel(glyph, 3, 2)).toBe(1)
      expect(getPixel(glyph, 0, 0)).toBe(0)
    })

    it('getPixel 越界时应该返回 0', () => {
      const glyph = createTestGlyph(4, 1)
      expect(getPixel(glyph, 10, 10)).toBe(0)
      expect(getPixel(glyph, -1, -1)).toBe(0)
    })

    it('togglePixel 应该切换像素状态', () => {
      const glyph = createTestGlyph(4, 0)
      const result1 = togglePixel(glyph, 0, 0)
      expect(result1[0][0]).toBe(1)

      const result2 = togglePixel(result1, 0, 0)
      expect(result2[0][0]).toBe(0)
    })
  })

  describe('clearGlyph', () => {
    it('应该将所有像素设置为 0', () => {
      const glyph = createTestGlyph(4, 1)
      const result = clearGlyph(glyph)
      result.forEach((row) => {
        row.forEach((cell) => {
          expect(cell).toBe(0)
        })
      })
    })

    it('应该保持相同尺寸', () => {
      const glyph = createTestGlyph(12, 1)
      const result = clearGlyph(glyph)
      expect(result.length).toBe(12)
      result.forEach((row) => {
        expect(row.length).toBe(12)
      })
    })
  })

  describe('resizeGlyph', () => {
    it('放大时应该居中保留原有内容', () => {
      const small = createTestGlyph(12, 0)
      small[1][1] = 1
      small[2][2] = 1

      const resized = resizeGlyph(small, 16)
      expect(resized.length).toBe(16)
      expect(resized[3][3]).toBe(1)
      expect(resized[4][4]).toBe(1)
      expect(resized[0][0]).toBe(0)
    })

    it('缩小时应该裁剪超出范围的内容', () => {
      const large = createTestGlyph(16, 0)
      large[0][0] = 1
      large[15][15] = 1
      large[3][3] = 1

      const resized = resizeGlyph(large, 12)
      expect(resized.length).toBe(12)
      expect(resized[1][1]).toBe(1)
      expect(resized[0][0]).toBe(0)
      expect(resized[11][11]).toBe(0)
    })

    it('preserveContent 为 false 时不保留内容', () => {
      const glyph = createTestGlyph(12, 1)
      const resized = resizeGlyph(glyph, 16, false)
      resized.forEach((row) => {
        row.forEach((cell) => {
          expect(cell).toBe(0)
        })
      })
    })

    it('相同尺寸时应该返回相同内容', () => {
      const glyph = createPatternGlyph(16)
      const resized = resizeGlyph(glyph, 16)
      expect(resized).toEqual(glyph)
    })
  })

  describe('编码解码', () => {
    describe('encodeGlyphToBase64 / decodeGlyphFromBase64', () => {
      it('编码后解码应该得到相同内容', () => {
        const original = createPatternGlyph(16)
        const encoded = encodeGlyphToBase64(original)
        expect(typeof encoded).toBe('string')
        expect(encoded.length).toBeGreaterThan(0)

        const decoded = decodeGlyphFromBase64(encoded, 16)
        expect(decoded).toEqual(original)
      })

      it('全 0 字形应该编码为空或全 0', () => {
        const glyph = createTestGlyph(16, 0)
        const encoded = encodeGlyphToBase64(glyph)
        const decoded = decodeGlyphFromBase64(encoded, 16)
        expect(decoded).toEqual(glyph)
      })

      it('全 1 字形应该正确编解码', () => {
        const glyph = createTestGlyph(16, 1)
        const encoded = encodeGlyphToBase64(glyph)
        const decoded = decodeGlyphFromBase64(encoded, 16)
        expect(decoded).toEqual(glyph)
      })

      it('解码无效 base64 应该返回空字形', () => {
        const decoded = decodeGlyphFromBase64('invalid-base64', 16)
        expect(decoded.length).toBe(16)
        decoded.forEach((row) => {
          row.forEach((cell) => {
            expect(cell).toBe(0)
          })
        })
      })

      it('解码空值应该返回空字形', () => {
        expect(decodeGlyphFromBase64('', 16)).toEqual(createTestGlyph(16, 0))
        expect(decodeGlyphFromBase64(null, 16)).toEqual(createTestGlyph(16, 0))
        expect(decodeGlyphFromBase64(undefined, 16)).toEqual(createTestGlyph(16, 0))
      })
    })

    describe('encodeGlyphToHex', () => {
      it('应该返回十六进制编码字符串', () => {
        const glyph = createTestGlyph(4, 1)
        const hex = encodeGlyphToHex(glyph)
        expect(typeof hex).toBe('string')
        expect(hex.length).toBeGreaterThan(0)
      })

      it('全 0 字形应该返回全 0 的十六进制', () => {
        const glyph = createTestGlyph(4, 0)
        const hex = encodeGlyphToHex(glyph)
        expect(hex).toBe('0,0,0,0')
      })

      it('每行应该用逗号分隔', () => {
        const glyph = createTestGlyph(4, 1)
        const hex = encodeGlyphToHex(glyph)
        const parts = hex.split(',')
        expect(parts.length).toBe(4)
      })
    })
  })

  describe('CSS 生成', () => {
    describe('generateCSSFontFace', () => {
      it('应该生成有效的 CSS @font-face 规则', () => {
        const glyphs = {
          A: { glyph: createPatternGlyph(16) },
          B: { glyph: createTestGlyph(16, 1) },
        }
        const css = generateCSSFontFace(glyphs, 'MyFont')
        expect(typeof css).toBe('string')
        expect(css).toContain('@font-face')
        expect(css).toContain('font-family: "MyFont"')
        expect(css).toContain('src: url(')
        expect(css).toContain('--pixel-font-family')
      })

      it('空字形对象应该返回空字符串', () => {
        expect(generateCSSFontFace({})).toBe('')
        expect(generateCSSFontFace(null)).toBe('')
        expect(generateCSSFontFace(undefined)).toBe('')
      })

      it('应该包含字符的 Unicode 码点注释', () => {
        const glyphs = {
          A: { glyph: createTestGlyph(16, 0) },
        }
        const css = generateCSSFontFace(glyphs)
        expect(css).toContain('U+0041')
      })

      it('应该使用默认字体名称', () => {
        const glyphs = { A: { glyph: createTestGlyph(16, 0) } }
        const css = generateCSSFontFace(glyphs)
        expect(css).toContain(`font-family: "${DEFAULT_FONT_FAMILY}"`)
      })
    })
  })

  describe('JSON 导入导出', () => {
    describe('exportToJSON', () => {
      it('应该生成有效的 JSON 字符串', () => {
        const glyphs = {
          A: { glyph: createPatternGlyph(16) },
        }
        const json = exportToJSON(glyphs, 16, 'TestFont')
        const parsed = JSON.parse(json)
        expect(parsed.version).toBe(EXPORT_FORMAT_VERSION)
        expect(parsed.gridSize).toBe(16)
        expect(parsed.fontFamily).toBe('TestFont')
        expect(parsed.glyphs).toBeDefined()
        expect(parsed.glyphs.A).toBeDefined()
        expect(parsed.glyphs.A.base64).toBeDefined()
        expect(parsed.glyphs.A.hex).toBeDefined()
      })

      it('应该包含创建时间', () => {
        const glyphs = { A: { glyph: createTestGlyph(16, 0) } }
        const json = exportToJSON(glyphs, 16)
        const parsed = JSON.parse(json)
        expect(parsed.createdAt).toBeDefined()
      })
    })

    describe('validateAndParseJSON', () => {
      it('应该验证并解析有效的 JSON', () => {
        const glyph = createPatternGlyph(16)
        const jsonString = JSON.stringify({
          version: EXPORT_FORMAT_VERSION,
          gridSize: 16,
          fontFamily: 'Test',
          glyphs: {
            A: { glyph },
          },
        })
        const result = validateAndParseJSON(jsonString)
        expect(result.valid).toBe(true)
        expect(result.data.gridSize).toBe(16)
        expect(result.data.glyphs.A.glyph).toEqual(glyph)
      })

      it('应该拒绝无效的 JSON 格式', () => {
        const result = validateAndParseJSON('not json')
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })

      it('应该拒绝不支持的版本', () => {
        const jsonString = JSON.stringify({
          version: 999,
          gridSize: 16,
          glyphs: {},
        })
        const result = validateAndParseJSON(jsonString)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('版本')
      })

      it('应该拒绝无效的网格尺寸', () => {
        const jsonString = JSON.stringify({
          version: EXPORT_FORMAT_VERSION,
          gridSize: 100,
          glyphs: {},
        })
        const result = validateAndParseJSON(jsonString)
        expect(result.valid).toBe(false)
      })

      it('应该拒绝缺少字形数据', () => {
        const jsonString = JSON.stringify({
          version: EXPORT_FORMAT_VERSION,
          gridSize: 16,
        })
        const result = validateAndParseJSON(jsonString)
        expect(result.valid).toBe(false)
      })

      it('应该拒绝字形尺寸不匹配', () => {
        const jsonString = JSON.stringify({
          version: EXPORT_FORMAT_VERSION,
          gridSize: 16,
          glyphs: {
            A: { glyph: createTestGlyph(8, 0) },
          },
        })
        const result = validateAndParseJSON(jsonString)
        expect(result.valid).toBe(false)
      })

      it('应该拒绝无效的像素值', () => {
        const badGlyph = createTestGlyph(16, 0)
        badGlyph[0][0] = 2
        const jsonString = JSON.stringify({
          version: EXPORT_FORMAT_VERSION,
          gridSize: 16,
          glyphs: { A: { glyph: badGlyph } },
        })
        const result = validateAndParseJSON(jsonString)
        expect(result.valid).toBe(false)
      })

      it('空值应该返回无效', () => {
        expect(validateAndParseJSON('').valid).toBe(false)
        expect(validateAndParseJSON(null).valid).toBe(false)
        expect(validateAndParseJSON(undefined).valid).toBe(false)
      })

      it('缺少 fontFamily 时应该使用默认值', () => {
        const jsonString = JSON.stringify({
          version: EXPORT_FORMAT_VERSION,
          gridSize: 16,
          glyphs: { A: { glyph: createTestGlyph(16, 0) } },
        })
        const result = validateAndParseJSON(jsonString)
        expect(result.valid).toBe(true)
        expect(result.data.fontFamily).toBe(DEFAULT_FONT_FAMILY)
      })
    })
  })

  describe('字形管理', () => {
    describe('initializeGlyphs', () => {
      it('应该为每个字符创建空字形', () => {
        const chars = ['A', 'B', 'C']
        const glyphs = initializeGlyphs(chars, 16)
        expect(Object.keys(glyphs)).toEqual(chars)
        expect(glyphs.A.glyph.length).toBe(16)
        expect(isGlyphEmpty(glyphs.A.glyph)).toBe(true)
      })

      it('应该使用默认字符和尺寸', () => {
        const glyphs = initializeGlyphs()
        expect(Object.keys(glyphs).length).toBeGreaterThan(0)
        expect(glyphs['A'].glyph.length).toBe(DEFAULT_GRID_SIZE)
      })
    })

    describe('addCharacter', () => {
      it('应该添加新字符', () => {
        const glyphs = initializeGlyphs(['A'], 16)
        const result = addCharacter(glyphs, 'B', 16)
        expect(Object.keys(result)).toEqual(['A', 'B'])
        expect(result.B.glyph.length).toBe(16)
      })

      it('不应该添加已存在的字符', () => {
        const glyphs = initializeGlyphs(['A'], 16)
        const result = addCharacter(glyphs, 'A', 16)
        expect(Object.keys(result)).toEqual(['A'])
      })

      it('无效字符应该返回原字形', () => {
        const glyphs = initializeGlyphs(['A'], 16)
        const result1 = addCharacter(glyphs, '', 16)
        const result2 = addCharacter(glyphs, null, 16)
        const result3 = addCharacter(glyphs, undefined, 16)
        expect(result1).toBe(glyphs)
        expect(result2).toBe(glyphs)
        expect(result3).toBe(glyphs)
      })
    })

    describe('removeCharacter', () => {
      it('应该移除指定字符', () => {
        const glyphs = initializeGlyphs(['A', 'B', 'C'], 16)
        const result = removeCharacter(glyphs, 'B')
        expect(Object.keys(result)).toEqual(['A', 'C'])
      })

      it('不存在的字符应该返回原字形', () => {
        const glyphs = initializeGlyphs(['A'], 16)
        const result = removeCharacter(glyphs, 'X')
        expect(result).toEqual(glyphs)
      })

      it('空值应该返回原字形', () => {
        const glyphs = initializeGlyphs(['A'], 16)
        expect(removeCharacter(null, 'A')).toBe(null)
        expect(removeCharacter(glyphs, null)).toBe(glyphs)
      })
    })
  })

  describe('工具函数', () => {
    describe('validateGridSize', () => {
      it('应该接受有效范围内的尺寸', () => {
        expect(validateGridSize(16).valid).toBe(true)
        expect(validateGridSize(16).size).toBe(16)
        expect(validateGridSize(MIN_GRID_SIZE).valid).toBe(true)
        expect(validateGridSize(MAX_GRID_SIZE).valid).toBe(true)
      })

      it('应该拒绝范围外的尺寸', () => {
        const result1 = validateGridSize(8)
        expect(result1.valid).toBe(false)
        expect(result1.size).toBe(MIN_GRID_SIZE)

        const result2 = validateGridSize(100)
        expect(result2.valid).toBe(false)
        expect(result2.size).toBe(MAX_GRID_SIZE)
      })

      it('应该拒绝非整数', () => {
        expect(validateGridSize(16.5).valid).toBe(false)
        expect(validateGridSize('abc').valid).toBe(false)
        expect(validateGridSize(null).valid).toBe(false)
      })

      it('应该处理字符串数字', () => {
        const result = validateGridSize('20')
        expect(result.valid).toBe(true)
        expect(result.size).toBe(20)
      })
    })

    describe('isGlyphEmpty', () => {
      it('空字形应该返回 true', () => {
        expect(isGlyphEmpty(createTestGlyph(16, 0))).toBe(true)
      })

      it('非空字形应该返回 false', () => {
        const glyph = createTestGlyph(16, 0)
        glyph[0][0] = 1
        expect(isGlyphEmpty(glyph)).toBe(false)
      })

      it('null 或无效输入应该返回 true', () => {
        expect(isGlyphEmpty(null)).toBe(true)
        expect(isGlyphEmpty(undefined)).toBe(true)
        expect(isGlyphEmpty([])).toBe(true)
      })
    })

    describe('countFilledPixels', () => {
      it('应该正确计算填充像素数量', () => {
        const glyph = createTestGlyph(4, 0)
        glyph[0][0] = 1
        glyph[1][1] = 1
        glyph[2][2] = 1
        expect(countFilledPixels(glyph)).toBe(3)
      })

      it('全 0 字形应该返回 0', () => {
        expect(countFilledPixels(createTestGlyph(16, 0))).toBe(0)
      })

      it('全 1 字形应该返回总数', () => {
        expect(countFilledPixels(createTestGlyph(4, 1))).toBe(16)
      })

      it('null 或无效输入应该返回 0', () => {
        expect(countFilledPixels(null)).toBe(0)
        expect(countFilledPixels(undefined)).toBe(0)
      })
    })

    describe('字形变换', () => {
      it('flipGlyphHorizontal 应该水平翻转', () => {
        const glyph = createTestGlyph(3, 0)
        glyph[0][0] = 1
        const flipped = flipGlyphHorizontal(glyph)
        expect(flipped[0][2]).toBe(1)
        expect(flipped[0][0]).toBe(0)
      })

      it('flipGlyphVertical 应该垂直翻转', () => {
        const glyph = createTestGlyph(3, 0)
        glyph[0][0] = 1
        const flipped = flipGlyphVertical(glyph)
        expect(flipped[2][0]).toBe(1)
        expect(flipped[0][0]).toBe(0)
      })

      it('rotateGlyph90 应该顺时针旋转 90 度', () => {
        const glyph = createTestGlyph(3, 0)
        glyph[0][0] = 1
        const rotated = rotateGlyph90(glyph)
        expect(rotated[0][2]).toBe(1)
      })

      describe('shiftGlyph', () => {
        it('应该向左移动', () => {
          const glyph = createTestGlyph(4, 0)
          glyph[1][2] = 1
          const shifted = shiftGlyph(glyph, 'left', 1)
          expect(shifted[1][1]).toBe(1)
          expect(shifted[1][2]).toBe(0)
        })

        it('应该向右移动', () => {
          const glyph = createTestGlyph(4, 0)
          glyph[1][1] = 1
          const shifted = shiftGlyph(glyph, 'right', 1)
          expect(shifted[1][2]).toBe(1)
        })

        it('应该向上移动', () => {
          const glyph = createTestGlyph(4, 0)
          glyph[2][1] = 1
          const shifted = shiftGlyph(glyph, 'up', 1)
          expect(shifted[1][1]).toBe(1)
        })

        it('应该向下移动', () => {
          const glyph = createTestGlyph(4, 0)
          glyph[1][1] = 1
          const shifted = shiftGlyph(glyph, 'down', 1)
          expect(shifted[2][1]).toBe(1)
        })

        it('移出边界的像素应该被丢弃', () => {
          const glyph = createTestGlyph(4, 0)
          glyph[0][0] = 1
          const shifted = shiftGlyph(glyph, 'left', 1)
          expect(shifted[0][0]).toBe(0)
        })
      })
    })

    describe('Unicode 工具', () => {
      it('getCharacterFromCodePoint 应该转换码点为字符', () => {
        expect(getCharacterFromCodePoint('0041')).toBe('A')
        expect(getCharacterFromCodePoint('4E2D')).toBe('中')
      })

      it('无效码点应该返回 null', () => {
        expect(getCharacterFromCodePoint('invalid')).toBeNull()
        expect(getCharacterFromCodePoint('')).toBeNull()
      })

      it('getCodePointString 应该返回格式化的码点', () => {
        expect(getCodePointString('A')).toBe('U+0041')
        expect(getCodePointString('中')).toBe('U+4E2D')
      })

      it('空字符应该返回空字符串', () => {
        expect(getCodePointString('')).toBe('')
        expect(getCodePointString(null)).toBe('')
        expect(getCodePointString(undefined)).toBe('')
      })
    })
  })

  describe('localStorage 持久化', () => {
    let storage

    beforeEach(() => {
      storage = createMockStorage()
    })

    describe('safeGetItem / safeSetItem', () => {
      it('应该正确保存和读取 JSON 数据', () => {
        safeSetItem('test', { a: 1 }, storage)
        expect(safeGetItem('test', null, storage)).toEqual({ a: 1 })
      })

      it('key 不存在时应该返回 fallback', () => {
        expect(safeGetItem('not-exist', 'fallback', storage)).toBe('fallback')
      })

      it('无效 JSON 应该返回 fallback', () => {
        storage.setItem('bad', '{not json')
        expect(safeGetItem('bad', 'fallback', storage)).toBe('fallback')
      })

      it('safeSetItem 失败时应该返回 false', () => {
        const badStorage = {
          getItem: vi.fn(),
          setItem: vi.fn(() => { throw new Error('quota exceeded') }),
          removeItem: vi.fn(),
        }
        expect(safeSetItem('k', 'v', badStorage)).toBe(false)
      })
    })

    describe('saveFontData / loadFontData / clearFontData', () => {
      it('应该正确保存和读取字体数据', () => {
        const data = {
          gridSize: 16,
          fontFamily: 'Test',
          glyphs: {},
        }
        expect(saveFontData(data, storage)).toBe(true)
        expect(loadFontData(storage)).toEqual(data)
      })

      it('loadFontData 空存储时应该返回 null', () => {
        expect(loadFontData(storage)).toBeNull()
      })

      it('clearFontData 应该删除存储数据', () => {
        saveFontData({ test: true }, storage)
        expect(clearFontData(storage)).toBe(true)
        expect(loadFontData(storage)).toBeNull()
      })

      it('storage 为 null 时不应该抛出', () => {
        expect(() => saveFontData({}, null)).not.toThrow()
        expect(() => loadFontData(null)).not.toThrow()
        expect(() => clearFontData(null)).not.toThrow()
      })

      it('应该使用正确的存储 key', () => {
        saveFontData({ test: true }, storage)
        expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String))
      })
    })
  })

  describe('编码解码集成测试', () => {
    it('Base64 编解码应该支持所有有效尺寸', () => {
      for (let size = MIN_GRID_SIZE; size <= MAX_GRID_SIZE; size += 4) {
        const original = createPatternGlyph(size)
        const encoded = encodeGlyphToBase64(original)
        const decoded = decodeGlyphFromBase64(encoded, size)
        expect(decoded).toEqual(original)
      }
    })

    it('复杂图案应该正确编解码', () => {
      const glyph = createTestGlyph(16, 0)
      for (let i = 0; i < 16; i++) {
        glyph[i][i] = 1
        glyph[i][15 - i] = 1
      }
      const encoded = encodeGlyphToBase64(glyph)
      const decoded = decodeGlyphFromBase64(encoded, 16)
      expect(decoded).toEqual(glyph)
    })
  })

  describe('resizeGlyph 边界情况', () => {
    it('从小尺寸放大到最大尺寸', () => {
      const small = createTestGlyph(MIN_GRID_SIZE, 0)
      small[0][0] = 1
      const resized = resizeGlyph(small, MAX_GRID_SIZE)
      expect(resized.length).toBe(MAX_GRID_SIZE)
      const offset = Math.floor((MAX_GRID_SIZE - MIN_GRID_SIZE) / 2)
      expect(resized[offset][offset]).toBe(1)
    })

    it('从最大尺寸缩小到最小尺寸', () => {
      const large = createTestGlyph(MAX_GRID_SIZE, 0)
      const center = Math.floor(MAX_GRID_SIZE / 2)
      large[center][center] = 1
      const resized = resizeGlyph(large, MIN_GRID_SIZE)
      expect(resized.length).toBe(MIN_GRID_SIZE)
    })
  })
})
