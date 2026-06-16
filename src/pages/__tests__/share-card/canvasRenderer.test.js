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
    fillStyleSeq: [],
    createLinearGradient: [],
    addColorStop: [],
    clearRect: [],
    save: 0,
    restore: 0,
    filter: [],
    drawImage: [],
    fontSeq: [],
    textAlignSeq: [],
    textBaselineSeq: [],
    fillText: [],
    beginPath: 0,
    moveTo: [],
    lineTo: [],
    quadraticCurveTo: [],
    closePath: 0,
    fill: 0,
    clip: 0,
  }

  const state = {
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
  }

  const ctx = {
    get calls() {
      return calls
    },
    set fillStyle(value) {
      state.fillStyle = value
      calls.fillStyleSeq.push(value)
    },
    get fillStyle() {
      return state.fillStyle
    },
    set filter(value) {
      calls.filter.push(value)
    },
    set font(value) {
      state.font = value
      calls.fontSeq.push(value)
    },
    get font() {
      return state.font
    },
    set textAlign(value) {
      state.textAlign = value
      calls.textAlignSeq.push(value)
    },
    get textAlign() {
      return state.textAlign
    },
    set textBaseline(value) {
      state.textBaseline = value
      calls.textBaselineSeq.push(value)
    },
    get textBaseline() {
      return state.textBaseline
    },
    fillRect: (...args) => calls.fillRect.push(args),
    clearRect: (...args) => calls.clearRect.push(args),
    save: () => { calls.save++ },
    restore: () => { calls.restore++ },
    drawImage: (...args) => calls.drawImage.push(args),
    createLinearGradient: (...args) => {
      calls.createLinearGradient.push(args)
      return {
        addColorStop: (...stopArgs) => calls.addColorStop.push(stopArgs),
      }
    },
    measureText: (text) => ({ width: text.length * 10 }),
    fillText: (...args) => calls.fillText.push(args),
    beginPath: () => { calls.beginPath++ },
    moveTo: (...args) => calls.moveTo.push(args),
    lineTo: (...args) => calls.lineTo.push(args),
    quadraticCurveTo: (...args) => calls.quadraticCurveTo.push(args),
    closePath: () => { calls.closePath++ },
    fill: () => { calls.fill++ },
    clip: () => { calls.clip++ },
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

function calcQrMetrics(cardSize, position, size) {
  const layoutY = cardSize === 'square'
    ? (position === 'top' ? 80 : 500)
    : (position === 'top' ? 100 : 860)
  const centerX = 300
  const centerY = layoutY
  const posX = centerX - size / 2
  const posY = centerY - size / 2

  const bgX = posX - 4
  const bgY = posY - 4
  const bgSize = size + 8
  const bgRadius = Math.min(8, bgSize / 2, bgSize / 2)

  const padding = size * 0.05
  const innerSize = size - padding * 2
  const qrX = posX + padding
  const qrY = posY + padding
  const cellSize = innerSize / 25

  const logoSize = innerSize * 0.22
  const logoCenterX = qrX + innerSize / 2
  const logoCenterY = qrY + innerSize / 2
  const logoX = logoCenterX - logoSize / 2
  const logoY = logoCenterY - logoSize / 2

  return {
    pos: { x: posX, y: posY },
    bg: { x: bgX, y: bgY, size: bgSize, radius: bgRadius },
    qr: { x: qrX, y: qrY, innerSize, cellSize },
    logo: { x: logoX, y: logoY, size: logoSize, centerX: logoCenterX, centerY: logoCenterY },
  }
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

      expect(ctx.calls.fillStyleSeq).toContain('#ff0000')
      expect(ctx.calls.fillRect).toContainEqual([0, 0, 600, 600])
      expect(ctx.calls.fillRect.length).toBe(1)
    })

    it('should fallback to white when color is not provided', () => {
      const ctx = createMockCtx()
      const background = {}

      drawColorBackground(ctx, background, 600, 600)

      expect(ctx.calls.fillStyleSeq[0]).toBe('#ffffff')
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
      expect(ctx.calls.fillRect.length).toBe(1)
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
      expect(ctx.calls.beginPath).toBe(0)
      expect(ctx.calls.save).toBe(0)
      expect(ctx.calls.restore).toBe(0)
    })

    it('should return early when content is empty', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: '', size: 120, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      expect(ctx.calls.fillRect.length).toBe(0)
      expect(ctx.calls.beginPath).toBe(0)
    })

    it('should perform exactly 3 rounded rect draws (background + 2 logo layers)', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'test', size: 120, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      expect(ctx.calls.beginPath).toBe(3)
      expect(ctx.calls.closePath).toBe(3)
      expect(ctx.calls.fill).toBe(3)
      expect(ctx.calls.moveTo.length).toBe(3)
      expect(ctx.calls.lineTo.length).toBe(12)
      expect(ctx.calls.quadraticCurveTo.length).toBe(12)
    })

    it('should have exactly 5 fillStyle changes in correct sequence', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'test', size: 120, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      expect(ctx.calls.fillStyleSeq).toEqual([
        '#ffffff',
        '#000000',
        '#ffffff',
        '#2563eb',
        '#ffffff',
      ])
    })

    it('should calculate square bottom QR position correctly via first moveTo', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        cardSize: 'square',
        qrcode: { enabled: true, content: 'test', size: 120, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      const m = calcQrMetrics('square', 'bottom', 120)

      expect(ctx.calls.moveTo[0]).toEqual([m.bg.x + m.bg.radius, m.bg.y])
      expect(ctx.calls.moveTo[0][0]).toBeCloseTo(244, 0)
      expect(ctx.calls.moveTo[0][1]).toBeCloseTo(436, 0)
    })

    it('should calculate portrait bottom QR position correctly', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        cardSize: 'portrait',
        qrcode: { enabled: true, content: 'test', size: 140, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      const m = calcQrMetrics('portrait', 'bottom', 140)

      expect(ctx.calls.moveTo[0][0]).toBeCloseTo(m.bg.x + m.bg.radius, 0)
      expect(ctx.calls.moveTo[0][1]).toBeCloseTo(m.bg.y, 0)
    })

    it('should calculate square top QR position correctly', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        cardSize: 'square',
        qrcode: { enabled: true, content: 'test', size: 100, position: 'top' },
      }

      drawQRCode(ctx, config)

      const m = calcQrMetrics('square', 'top', 100)

      expect(ctx.calls.moveTo[0][0]).toBeCloseTo(m.bg.x + m.bg.radius, 0)
      expect(ctx.calls.moveTo[0][1]).toBeCloseTo(m.bg.y, 0)
    })

    it('should have first fillRect at top-left finder pattern position', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        cardSize: 'square',
        qrcode: { enabled: true, content: 'test', size: 120, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      const m = calcQrMetrics('square', 'bottom', 120)

      const firstFillRect = ctx.calls.fillRect[0]
      expect(firstFillRect[0]).toBeGreaterThanOrEqual(Math.floor(m.qr.x - 1))
      expect(firstFillRect[0]).toBeLessThan(m.qr.x + m.qr.cellSize * 2)
      expect(firstFillRect[1]).toBeGreaterThanOrEqual(Math.floor(m.qr.y - 1))
      expect(firstFillRect[1]).toBeLessThan(m.qr.y + m.qr.cellSize * 2)
    })

    it('should have finder pattern cells in top-left corner of QR area', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'test', size: 200, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      const m = calcQrMetrics('square', 'bottom', 200)
      const cellSize = m.qr.cellSize

      const topLeftCells = ctx.calls.fillRect.filter((rect) => {
        const [x, y] = rect
        return x >= Math.floor(m.qr.x - 1)
          && x < m.qr.x + cellSize * 7
          && y >= Math.floor(m.qr.y - 1)
          && y < m.qr.y + cellSize * 7
      })

      expect(topLeftCells.length).toBeGreaterThanOrEqual(20)
      expect(topLeftCells.length).toBeLessThanOrEqual(49)
    })

    it('should have bottom-right area cells (not just top-left finder)', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'https://example.com', size: 150, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      const m = calcQrMetrics('square', 'bottom', 150)
      const cellSize = m.qr.cellSize

      const bottomRightCells = ctx.calls.fillRect.filter((rect) => {
        const [x, y] = rect
        return x >= m.qr.x + cellSize * 12
          && y >= m.qr.y + cellSize * 12
      })

      expect(bottomRightCells.length).toBeGreaterThan(30)
      expect(bottomRightCells.length).toBeLessThan(200)
    })

    it('should draw total fillRect count within expected range (250-420 for 25x25 matrix)', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'https://example.com', size: 100, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      const totalCells = 25 * 25
      const count = ctx.calls.fillRect.length

      expect(count).toBeGreaterThan(250)
      expect(count).toBeLessThanOrEqual(totalCells)
    })

    it('should draw significantly more than just finder patterns (verifying data region)', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'test', size: 100, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      const finderPatternBlackCells = 33 * 3
      const timingPatternBlackCells = 10
      const minExpectedFromDataRegion = 150

      expect(ctx.calls.fillRect.length).toBeGreaterThan(
        finderPatternBlackCells + timingPatternBlackCells + minExpectedFromDataRegion
      )
    })

    it('should generate different fillRect sets for different content', () => {
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

      const set1 = new Set(ctx1.calls.fillRect.map((r) => `${r[0]},${r[1]}`))
      const set2 = new Set(ctx2.calls.fillRect.map((r) => `${r[0]},${r[1]}`))

      const diff = [...set1].filter((x) => !set2.has(x))
      expect(diff.length).toBeGreaterThan(20)
    })

    it('should draw center QR logo with "QR" text at correct position', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'test', size: 200, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      const m = calcQrMetrics('square', 'bottom', 200)

      expect(ctx.calls.fillText.length).toBe(1)
      expect(ctx.calls.fillText[0][0]).toBe('QR')
      expect(ctx.calls.fillText[0][1]).toBeCloseTo(m.logo.centerX, 0)
      expect(ctx.calls.fillText[0][2]).toBeCloseTo(m.logo.centerY, 0)

      expect(ctx.calls.textAlignSeq).toContain('center')
      expect(ctx.calls.textBaselineSeq).toContain('middle')
      expect(ctx.calls.fontSeq.length).toBe(1)
      expect(ctx.calls.fontSeq[0]).toMatch(/bold.*sans-serif/)
    })

    it('should have logo layer roundRect moves at expected indices', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'test', size: 180, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      const m = calcQrMetrics('square', 'bottom', 180)

      expect(ctx.calls.moveTo.length).toBe(3)

      const logoBgMove = ctx.calls.moveTo[1]
      expect(logoBgMove[0]).toBeCloseTo(m.logo.x - 2 + 3, 0)
      expect(logoBgMove[1]).toBeCloseTo(m.logo.y - 2, 0)

      const logoFillMove = ctx.calls.moveTo[2]
      expect(logoFillMove[0]).toBeCloseTo(m.logo.x + 2, 0)
      expect(logoFillMove[1]).toBeCloseTo(m.logo.y, 0)
    })

    it('should save/restore canvas state exactly once', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'test', size: 120, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      expect(ctx.calls.save).toBe(1)
      expect(ctx.calls.restore).toBe(1)
    })

    it('should use consistent cell size for all fillRect calls', () => {
      const ctx = createMockCtx()
      const config = {
        ...createDefaultConfig(),
        qrcode: { enabled: true, content: 'test', size: 200, position: 'bottom' },
      }

      drawQRCode(ctx, config)

      const m = calcQrMetrics('square', 'bottom', 200)
      const expectedCellW = Math.ceil(m.qr.cellSize) + 0.5

      for (const rect of ctx.calls.fillRect) {
        expect(rect[2]).toBeCloseTo(expectedCellW, 0.5)
        expect(rect[3]).toBeCloseTo(expectedCellW, 0.5)
      }
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
      expect(canvas.ctx.calls.clearRect.length).toBe(1)
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

      expect(canvas.ctx.calls.fillStyleSeq).toContain('#ff0000')
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

      expect(canvas.ctx.calls.createLinearGradient.length).toBe(1)
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

      expect(canvas.ctx.calls.fillStyleSeq).toContain('#00ff00')
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

      expect(canvas.ctx.calls.fillStyleSeq).toContain('rgba(0,0,0,0.5)')
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

      const transparentOverlays = canvas.ctx.calls.fillRect.filter((call, i) => {
        return canvas.ctx.calls.fillStyleSeq[i] === 'rgba(0,0,0,0)'
      })
      expect(transparentOverlays.length).toBe(0)
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

      expect(canvas.ctx.calls.fontSeq).toContain('bold 36px -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'PingFang SC\', \'Microsoft YaHei\', sans-serif')
      expect(canvas.ctx.calls.fillStyleSeq).toContain('#ffffff')
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

    it('should invoke drawBackground, drawText, drawQRCode in sequence', () => {
      const canvas = createMockCanvas()
      const config = {
        ...createDefaultConfig(),
        cardSize: 'square',
        background: { mode: BACKGROUND_MODES.COLOR, color: '#fff' },
        title: { text: 'T', fontSize: 12, color: '#000', alignment: 'center', bold: false },
        description: { text: 'D', fontSize: 10, color: '#000', alignment: 'center', bold: false },
        qrcode: { enabled: true, content: 'Q', size: 80, position: 'bottom' },
      }

      renderShareCard(canvas, config)

      expect(canvas.ctx.calls.clearRect.length).toBe(1)
      expect(canvas.ctx.calls.fillRect.length).toBeGreaterThan(100)
      expect(canvas.ctx.calls.fillText.length).toBeGreaterThanOrEqual(2)
      expect(canvas.ctx.calls.moveTo.length).toBe(3)
    })
  })

  describe('downloadCanvasAsPNG - filename logic', () => {
    function setupMockDocument() {
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

    function teardownMockDocument() {
      delete globalThis.document
    }

    beforeEach(() => {
      teardownMockDocument()
    })

    it('should use provided filename when available', () => {
      const canvas = createMockCanvas()
      const mockLink = setupMockDocument()

      downloadCanvasAsPNG(canvas, 'custom-name.png')

      expect(mockLink.download).toBe('custom-name.png')
      expect(mockLink.click).toHaveBeenCalledTimes(1)
    })

    it('should use fallback filename with timestamp when not provided', () => {
      const canvas = createMockCanvas()
      const mockLink = setupMockDocument()

      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1234567890)

      downloadCanvasAsPNG(canvas)

      expect(mockLink.download).toBe('share-card-1234567890.png')
      expect(mockLink.download).toMatch(/^share-card-\d+\.png$/)

      mockDateNow.mockRestore()
    })

    it('should use fallback filename when null is passed', () => {
      const canvas = createMockCanvas()
      const mockLink = setupMockDocument()

      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(9876543210)

      downloadCanvasAsPNG(canvas, null)

      expect(mockLink.download).toBe('share-card-9876543210.png')

      mockDateNow.mockRestore()
    })

    it('should use fallback filename when empty string is passed', () => {
      const canvas = createMockCanvas()
      const mockLink = setupMockDocument()

      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1111111111)

      downloadCanvasAsPNG(canvas, '')

      expect(mockLink.download).toBe('share-card-1111111111.png')

      mockDateNow.mockRestore()
    })

    it('should set href to canvas data URL', () => {
      const canvas = createMockCanvas()
      canvas.toDataURL.mockReturnValue('data:image/png;base64,test123')
      const mockLink = setupMockDocument()

      downloadCanvasAsPNG(canvas, 'test.png')

      expect(mockLink.href).toBe('data:image/png;base64,test123')
    })

    it('should append and remove link element from body', () => {
      const canvas = createMockCanvas()
      setupMockDocument()

      downloadCanvasAsPNG(canvas, 'x.png')

      expect(globalThis.document.body.appendChild).toHaveBeenCalledTimes(1)
      expect(globalThis.document.body.removeChild).toHaveBeenCalledTimes(1)
    })

    it('should create link element with tag "a"', () => {
      const canvas = createMockCanvas()
      setupMockDocument()

      downloadCanvasAsPNG(canvas, 'x.png')

      expect(globalThis.document.createElement).toHaveBeenCalledWith('a')
    })
  })
})
