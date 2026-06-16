import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  drawColorBackground,
  drawGradientBackground,
  drawQRCode,
  renderShareCard,
  downloadCanvasAsPNG,
} from '@/pages/share-card/canvasRenderer.js'
import { createDefaultConfig } from '@/pages/share-card/utils.js'
import { BACKGROUND_MODES, GRADIENT_DIRECTIONS } from '@/pages/share-card/constants.js'

function createMockCtx() {
  const calls = {
    fillRect: [],
    fillStyle: [],
    createLinearGradient: [],
    addColorStop: [],
    clearRect: [],
    save: [],
    restore: [],
    filter: [],
    drawImage: [],
    font: [],
    textAlign: [],
    textBaseline: [],
    fillText: [],
    measureText: [],
    beginPath: [],
    moveTo: [],
    lineTo: [],
    quadraticCurveTo: [],
    closePath: [],
    fill: [],
    clip: [],
  }

  const mockGradient = {
    addColorStop: (...args) => {
      calls.addColorStop.push(args)
    },
  }

  const ctx = {
    get calls() {
      return calls
    },
    set fillStyle(value) {
      calls.fillStyle.push(value)
    },
    get fillStyle() {
      return calls.fillStyle[calls.fillStyle.length - 1]
    },
    set filter(value) {
      calls.filter.push(value)
    },
    set font(value) {
      calls.font.push(value)
    },
    set textAlign(value) {
      calls.textAlign.push(value)
    },
    set textBaseline(value) {
      calls.textBaseline.push(value)
    },
    fillRect: (...args) => calls.fillRect.push(args),
    clearRect: (...args) => calls.clearRect.push(args),
    save: () => calls.save.push(true),
    restore: () => calls.restore.push(true),
    drawImage: (...args) => calls.drawImage.push(args),
    createLinearGradient: (...args) => {
      calls.createLinearGradient.push(args)
      return mockGradient
    },
    measureText: (text) => {
      calls.measureText.push(text)
      return { width: text.length * 10 }
    },
    fillText: (...args) => calls.fillText.push(args),
    beginPath: () => calls.beginPath.push(true),
    moveTo: (...args) => calls.moveTo.push(args),
    lineTo: (...args) => calls.lineTo.push(args),
    quadraticCurveTo: (...args) => calls.quadraticCurveTo.push(args),
    closePath: () => calls.closePath.push(true),
    fill: () => calls.fill.push(true),
    clip: () => calls.clip.push(true),
  }

  return ctx
}

function createMockCanvas(width = 600, height = 600) {
  const mockCtx = createMockCtx()
  const canvas = {
    _width: width,
    _height: height,
    get width() {
      return this._width
    },
    set width(value) {
      this._width = value
    },
    get height() {
      return this._height
    },
    set height(value) {
      this._height = value
    },
    getContext: () => mockCtx,
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock'),
    toBlob: vi.fn().mockImplementation((callback) => {
      callback(new Blob(['mock'], { type: 'image/png' }))
    }),
    get ctx() {
      return mockCtx
    },
  }
  return canvas
}

describe('Share Card - Canvas Renderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('drawColorBackground', () => {
    it('should fill canvas with specified color', () => {
      const ctx = createMockCtx()
      const background = { color: '#ff0000' }

      drawColorBackground(ctx, background, 600, 600)

      expect(ctx.calls.fillStyle).toContain('#ff0000')
      expect(ctx.calls.fillRect).toContainEqual([0, 0, 600, 600])
    })

    it('should fallback to white when color is not provided', () => {
      const ctx = createMockCtx()
      const background = {}

      drawColorBackground(ctx, background, 600, 600)

      expect(ctx.calls.fillStyle).toContain('#ffffff')
      expect(ctx.calls.fillRect).toContainEqual([0, 0, 600, 600])
    })

    it('should use correct dimensions for portrait canvas', () => {
      const ctx = createMockCtx()
      const background = { color: '#00ff00' }

      drawColorBackground(ctx, background, 600, 1000)

      expect(ctx.calls.fillRect).toContainEqual([0, 0, 600, 1000])
    })
  })

  describe('drawGradientBackground', () => {
    it('should create horizontal gradient with correct coords', () => {
      const ctx = createMockCtx()
      const background = {
        gradientStart: '#ff0000',
        gradientEnd: '#0000ff',
        gradientDirection: GRADIENT_DIRECTIONS.HORIZONTAL,
      }

      drawGradientBackground(ctx, background, 600, 600)

      expect(ctx.calls.createLinearGradient).toContainEqual([0, 0, 600, 0])
      expect(ctx.calls.addColorStop).toEqual([
        [0, '#ff0000'],
        [1, '#0000ff'],
      ])
    })

    it('should create vertical gradient with correct coords', () => {
      const ctx = createMockCtx()
      const background = {
        gradientStart: '#ff0000',
        gradientEnd: '#0000ff',
        gradientDirection: GRADIENT_DIRECTIONS.VERTICAL,
      }

      drawGradientBackground(ctx, background, 600, 600)

      expect(ctx.calls.createLinearGradient).toContainEqual([0, 0, 0, 600])
    })

    it('should create diagonal gradient with correct coords', () => {
      const ctx = createMockCtx()
      const background = {
        gradientStart: '#ff0000',
        gradientEnd: '#0000ff',
        gradientDirection: GRADIENT_DIRECTIONS.DIAGONAL,
      }

      drawGradientBackground(ctx, background, 600, 1000)

      expect(ctx.calls.createLinearGradient).toContainEqual([0, 0, 600, 1000])
    })

    it('should use default colors when not provided', () => {
      const ctx = createMockCtx()
      const background = {}

      drawGradientBackground(ctx, background, 600, 600)

      expect(ctx.calls.addColorStop).toEqual([
        [0, '#667eea'],
        [1, '#764ba2'],
      ])
    })

    it('should default to diagonal gradient for invalid direction', () => {
      const ctx = createMockCtx()
      const background = {
        gradientStart: '#ff0000',
        gradientEnd: '#0000ff',
        gradientDirection: 'invalid',
      }

      drawGradientBackground(ctx, background, 600, 600)

      expect(ctx.calls.createLinearGradient).toContainEqual([0, 0, 600, 600])
    })
  })

  describe('drawQRCode - coordinate calculations', () => {
    it('should return early when qrcode is not enabled', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: false, content: 'test', size: 120, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      expect(ctx.calls.fillRect.length).toBe(0)
      expect(ctx.calls.beginPath.length).toBe(0)
    })

    it('should return early when content is empty', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: '', size: 120, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      expect(ctx.calls.fillRect.length).toBe(0)
    })

    it('should calculate QR position correctly for square card', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        cardSize: 'square',
        qrcode: { enabled: true, content: 'test', size: 120, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      const expectedBgX = 300 - 120 / 2 - 4
      const expectedBgY = 500 - 120 / 2 - 4

      expect(ctx.calls.moveTo.some((call) => {
        const r = Math.min(8, (120 + 8) / 2, (120 + 8) / 2)
        return Math.abs(call[0] - (expectedBgX + r)) < 1 && Math.abs(call[1] - expectedBgY) < 1
      })).toBe(true)

      expect(ctx.calls.fillStyle).toContain('#ffffff')
      expect(ctx.calls.fillStyle).toContain('#000000')
    })

    it('should calculate QR position correctly for portrait card', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        cardSize: 'portrait',
        qrcode: { enabled: true, content: 'test', size: 140, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      const expectedBgX = 300 - 140 / 2 - 4
      const expectedBgY = 860 - 140 / 2 - 4
      const bgSize = 140 + 8
      const r = Math.min(8, bgSize / 2, bgSize / 2)

      let backgroundDrawn = false
      for (let i = 0; i < ctx.calls.moveTo.length; i++) {
        const moveCall = ctx.calls.moveTo[i]
        const styleIndex = Math.floor(i / 8)
        if (Math.abs(moveCall[0] - (expectedBgX + r)) < 1 &&
            Math.abs(moveCall[1] - expectedBgY) < 1) {
          if (ctx.calls.fillStyle[styleIndex] === '#ffffff') {
            backgroundDrawn = true
            break
          }
        }
      }
      expect(backgroundDrawn).toBe(true)
    })

    it('should draw QR matrix with fillRect for each cell', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'https://example.com', size: 100, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      expect(ctx.calls.fillRect.length).toBeGreaterThan(100)
      expect(ctx.calls.fillRect.length).toBeLessThanOrEqual(25 * 25)
    })

    it('should generate different patterns for different content', () => {
      const ctx1 = createMockCtx()
      const ctx2 = createMockCtx()

      const config1 = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'Content A', size: 100, position: 'bottom' },
      }
      const config2 = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'Content B', size: 100, position: 'bottom' },
      }

      drawQRCode(ctx1, config1)
      drawQRCode(ctx2, config2)

      const fillRects1 = JSON.stringify(ctx1.calls.fillRect)
      const fillRects2 = JSON.stringify(ctx2.calls.fillRect)

      expect(fillRects1).not.toBe(fillRects2)
    })

    it('should draw center QR logo with correct style', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'test', size: 200, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      const blueFillCount = ctx.calls.fillStyle.filter((c) => c === '#2563eb').length
      expect(blueFillCount).toBeGreaterThan(0)

      expect(ctx.calls.fillStyle).toContain('#2563eb')
      expect(ctx.calls.fillStyle).toContain('#ffffff')
      expect(ctx.calls.fillText.length).toBeGreaterThan(0)
      expect(ctx.calls.fillText.some((call) => call[0] === 'QR')).toBe(true)
    })

    it('should position QR at top when specified', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        cardSize: 'square',
        qrcode: { enabled: true, content: 'test', size: 100, position: 'top' },
      }

      drawQRCode(ctx, config)

      const expectedBgY = 80 - 100 / 2 - 4

      let foundTopPosition = false
      for (const call of ctx.calls.moveTo) {
        if (Math.abs(call[1] - expectedBgY) < 5) {
          foundTopPosition = true
          break
        }
      }
      expect(foundTopPosition).toBe(true)
    })
  })

  describe('renderShareCard - dimension and mode tests', () => {
    it('should set canvas dimensions for square card', () => {
      const canvas = createMockCanvas()
      const config = {
        ...createDefaultConfig(),
        cardSize: 'square',
      }

      const result = renderShareCard(canvas, config)

      expect(canvas.width).toBe(600)
      expect(canvas.height).toBe(600)
      expect(result).toEqual({ width: 600, height: 600 })
    })

    it('should set canvas dimensions for portrait card', () => {
      const canvas = createMockCanvas()
      const config = {
        ...createDefaultConfig(),
        cardSize: 'portrait',
      }

      const result = renderShareCard(canvas, config)

      expect(canvas.width).toBe(600)
      expect(canvas.height).toBe(1000)
      expect(result).toEqual({ width: 600, height: 1000 })
    })

    it('should clear canvas before drawing', () => {
      const canvas = createMockCanvas()
      const config = {
        ...createDefaultConfig(),
        cardSize: 'square',
      }

      renderShareCard(canvas, config)

      expect(canvas.ctx.calls.clearRect).toContainEqual([0, 0, 600, 600])
    })

    it('should draw color background when mode is color', () => {
      const canvas = createMockCanvas()
      const config = {
        ...createDefaultConfig(),
        background: {
          mode: BACKGROUND_MODES.COLOR,
          color: '#ff0000',
        },
      }

      renderShareCard(canvas, config)

      expect(canvas.ctx.calls.fillStyle).toContain('#ff0000')
    })

    it('should draw gradient background when mode is gradient', () => {
      const canvas = createMockCanvas()
      const config = {
        ...createDefaultConfig(),
        background: {
          mode: BACKGROUND_MODES.GRADIENT,
          gradientStart: '#ff0000',
          gradientEnd: '#0000ff',
          gradientDirection: GRADIENT_DIRECTIONS.HORIZONTAL,
        },
      }

      renderShareCard(canvas, config)

      expect(canvas.ctx.calls.createLinearGradient.length).toBeGreaterThan(0)
      expect(canvas.ctx.calls.addColorStop).toContainEqual([0, '#ff0000'])
      expect(canvas.ctx.calls.addColorStop).toContainEqual([1, '#0000ff'])
    })

    it('should default to color background for invalid mode', () => {
      const canvas = createMockCanvas()
      const config = {
        ...createDefaultConfig(),
        background: {
          mode: 'invalid-mode',
          color: '#00ff00',
        },
      }

      renderShareCard(canvas, config)

      expect(canvas.ctx.calls.fillStyle).toContain('#00ff00')
    })

    it('should draw overlay color for image background mode', () => {
      const canvas = createMockCanvas()
      const config = {
        ...createDefaultConfig(),
        background: {
          mode: BACKGROUND_MODES.IMAGE,
          overlayColor: 'rgba(0,0,0,0.5)',
        },
      }

      renderShareCard(canvas, config, {})

      expect(canvas.ctx.calls.fillStyle).toContain('rgba(0,0,0,0.5)')
      expect(canvas.ctx.calls.fillRect).toContainEqual([0, 0, 600, 600])
    })

    it('should skip overlay color when fully transparent', () => {
      const canvas = createMockCanvas()
      const config = {
        ...createDefaultConfig(),
        background: {
          mode: BACKGROUND_MODES.IMAGE,
          overlayColor: 'rgba(0,0,0,0)',
        },
      }

      renderShareCard(canvas, config, {})

      const overlayFills = canvas.ctx.calls.fillRect.filter((call, i) => {
        return canvas.ctx.calls.fillStyle[i] === 'rgba(0,0,0,0)'
      })
      expect(overlayFills.length).toBe(0)
    })

    it('should draw title text when provided', () => {
      const canvas = createMockCanvas()
      const config = {
        ...createDefaultConfig(),
        title: {
          text: 'Test Title',
          fontSize: 36,
          color: '#ffffff',
          alignment: 'center',
          bold: true,
        },
      }

      renderShareCard(canvas, config)

      expect(canvas.ctx.calls.font).toContain('bold 36px -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'PingFang SC\', \'Microsoft YaHei\', sans-serif')
      expect(canvas.ctx.calls.fillStyle).toContain('#ffffff')
      expect(canvas.ctx.calls.fillText.some((call) => call[0] === 'Test Title')).toBe(true)
    })

    it('should skip drawing logo when not enabled', () => {
      const canvas = createMockCanvas()
      const config = {
        ...createDefaultConfig(),
        logo: { enabled: false, size: 80, position: 'top' },
      }
      const deps = {
        logoImage: { complete: true, width: 100, height: 100 },
      }

      renderShareCard(canvas, config, deps)

      expect(canvas.ctx.calls.drawImage.length).toBe(0)
    })

    it('should skip drawing logo when image not provided', () => {
      const canvas = createMockCanvas()
      const config = {
        ...createDefaultConfig(),
        logo: { enabled: true, size: 80, position: 'top' },
      }

      renderShareCard(canvas, config, {})

      expect(canvas.ctx.calls.drawImage.length).toBe(0)
    })

    it('should not throw when drawing image background without image', () => {
      const canvas = createMockCanvas()
      const config = {
        ...createDefaultConfig(),
        background: {
          mode: BACKGROUND_MODES.IMAGE,
          blur: 0,
          overlayColor: 'rgba(0,0,0,0)',
        },
      }

      expect(() => renderShareCard(canvas, config, {})).not.toThrow()
    })
  })

  describe('downloadCanvasAsPNG - filename logic', () => {
    function createMockDocument() {
      const mockLink = {
        click: vi.fn(),
        href: '',
        download: '',
      }
      globalThis.document = {
        createElement: vi.fn().mockReturnValue(mockLink),
        body: {
          appendChild: vi.fn().mockImplementation(() => mockLink),
          removeChild: vi.fn().mockImplementation(() => mockLink),
        },
      }
      return mockLink
    }

    function cleanupMockDocument() {
      delete globalThis.document
    }

    beforeEach(() => {
      cleanupMockDocument()
    })

    it('should use provided filename when available', () => {
      const canvas = createMockCanvas()
      const mockLink = createMockDocument()

      downloadCanvasAsPNG(canvas, 'custom-name.png')

      expect(mockLink.download).toBe('custom-name.png')
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('should use fallback filename with timestamp when not provided', () => {
      const canvas = createMockCanvas()
      const mockLink = createMockDocument()

      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1234567890)

      downloadCanvasAsPNG(canvas)

      expect(mockLink.download).toBe('share-card-1234567890.png')
      expect(mockLink.download).toMatch(/^share-card-\d+\.png$/)
      expect(mockLink.click).toHaveBeenCalled()

      mockDateNow.mockRestore()
    })

    it('should use fallback filename when null is passed', () => {
      const canvas = createMockCanvas()
      const mockLink = createMockDocument()

      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(9876543210)

      downloadCanvasAsPNG(canvas, null)

      expect(mockLink.download).toBe('share-card-9876543210.png')

      mockDateNow.mockRestore()
    })

    it('should use fallback filename when empty string is passed', () => {
      const canvas = createMockCanvas()
      const mockLink = createMockDocument()

      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1111111111)

      downloadCanvasAsPNG(canvas, '')

      expect(mockLink.download).toBe('share-card-1111111111.png')

      mockDateNow.mockRestore()
    })

    it('should set href to canvas data URL', () => {
      const canvas = createMockCanvas()
      canvas.toDataURL.mockReturnValue('data:image/png;base64,test123')
      const mockLink = createMockDocument()

      downloadCanvasAsPNG(canvas, 'test.png')

      expect(mockLink.href).toBe('data:image/png;base64,test123')
    })
  })
})
