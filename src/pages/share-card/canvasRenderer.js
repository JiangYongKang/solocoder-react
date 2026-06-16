import {
  getCardDimensions,
  getGradientCoords,
  calculateLogoPosition,
  calculateQRCodePosition,
  calculateTextPosition,
  generateQRMatrix,
  wrapText,
} from './utils.js'
import { BACKGROUND_MODES } from './constants.js'

export function drawBackground(ctx, config, width, height, deps = {}) {
  const { background } = config
  const { mode } = background

  ctx.clearRect(0, 0, width, height)

  switch (mode) {
    case BACKGROUND_MODES.IMAGE:
      drawImageBackground(ctx, background, width, height, deps)
      break
    case BACKGROUND_MODES.GRADIENT:
      drawGradientBackground(ctx, background, width, height)
      break
    case BACKGROUND_MODES.COLOR:
    default:
      drawColorBackground(ctx, background, width, height)
      break
  }
}

export function drawColorBackground(ctx, background, width, height) {
  ctx.fillStyle = background.color || '#ffffff'
  ctx.fillRect(0, 0, width, height)
}

export function drawGradientBackground(ctx, background, width, height) {
  const { gradientStart = '#667eea', gradientEnd = '#764ba2', gradientDirection = 'diagonal' } = background
  const coords = getGradientCoords(gradientDirection, width, height)
  const gradient = ctx.createLinearGradient(coords.x1, coords.y1, coords.x2, coords.y2)
  gradient.addColorStop(0, gradientStart)
  gradient.addColorStop(1, gradientEnd)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

export function drawImageBackground(ctx, background, width, height, deps = {}) {
  const { blur = 0, overlayColor = 'rgba(0,0,0,0)' } = background
  const { backgroundImage: bgImage } = deps

  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, width, height)

  if (bgImage && bgImage.complete) {
    ctx.save()
    if (blur > 0) {
      ctx.filter = `blur(${blur}px)`
    }
    const imgRatio = bgImage.width / bgImage.height
    const canvasRatio = width / height
    let drawWidth, drawHeight, drawX, drawY

    if (imgRatio > canvasRatio) {
      drawHeight = height
      drawWidth = height * imgRatio
      drawX = (width - drawWidth) / 2
      drawY = 0
    } else {
      drawWidth = width
      drawHeight = width / imgRatio
      drawX = 0
      drawY = (height - drawHeight) / 2
    }
    ctx.drawImage(bgImage, drawX, drawY, drawWidth, drawHeight)
    ctx.restore()
  }

  if (overlayColor && overlayColor !== 'rgba(0,0,0,0)') {
    ctx.fillStyle = overlayColor
    ctx.fillRect(0, 0, width, height)
  }
}

export function drawText(ctx, config) {
  drawTitle(ctx, config)
  drawDescription(ctx, config)
}

function setupTextStyle(ctx, textConfig) {
  const { fontSize, color, alignment, bold } = textConfig
  const fontWeight = bold ? 'bold' : 'normal'
  ctx.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = alignment
  ctx.textBaseline = 'top'
}

export function drawTitle(ctx, config) {
  const { title, cardSize } = config
  if (!title.text) return

  const layout = calculateTextPosition(cardSize, 'title')
  setupTextStyle(ctx, title)

  const lines = wrapText(ctx, title.text, layout.maxWidth)
  const lineHeight = title.fontSize * 1.3
  const totalHeight = lines.length * lineHeight
  let startY = layout.y - totalHeight / 2

  lines.forEach((line, index) => {
    const y = startY + index * lineHeight
    ctx.fillText(line, layout.x, y)
  })
}

export function drawDescription(ctx, config) {
  const { description, cardSize } = config
  if (!description.text) return

  const layout = calculateTextPosition(cardSize, 'description')
  setupTextStyle(ctx, description)

  const lines = wrapText(ctx, description.text, layout.maxWidth)
  const lineHeight = description.fontSize * (layout.lineHeight || 1.6)
  const totalHeight = lines.length * lineHeight
  let startY = layout.y - totalHeight / 2

  lines.forEach((line, index) => {
    const y = startY + index * lineHeight
    ctx.fillText(line, layout.x, y)
  })
}

export function drawLogo(ctx, config, deps = {}) {
  const { logo, cardSize } = config
  if (!logo.enabled || !deps.logoImage || !deps.logoImage.complete) return

  const { size, position } = logo
  const pos = calculateLogoPosition(cardSize, position, size)
  const img = deps.logoImage

  const imgRatio = img.width / img.height
  let drawWidth, drawHeight

  if (imgRatio >= 1) {
    drawWidth = size
    drawHeight = size / imgRatio
  } else {
    drawHeight = size
    drawWidth = size * imgRatio
  }

  const x = pos.x - drawWidth / 2
  const y = pos.y - drawHeight / 2

  ctx.save()
  const padding = 8
  const radius = 8

  roundRect(ctx, x - padding, y - padding, drawWidth + padding * 2, drawHeight + padding * 2, radius)
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.fill()

  ctx.save()
  roundRect(ctx, x, y, drawWidth, drawHeight, radius - 2)
  ctx.clip()
  ctx.drawImage(img, x, y, drawWidth, drawHeight)
  ctx.restore()

  ctx.restore()
}

export function drawQRCode(ctx, config) {
  const { qrcode, cardSize } = config
  if (!qrcode.enabled || !qrcode.content) return

  const { content, size, position } = qrcode
  const pos = calculateQRCodePosition(cardSize, position, size)

  const padding = size * 0.05
  const innerSize = size - padding * 2
  const matrixSize = 25
  const matrix = generateQRMatrix(content, matrixSize)
  const cellSize = innerSize / matrixSize

  ctx.save()

  const bgX = pos.x - 4
  const bgY = pos.y - 4
  const bgSize = size + 8
  roundRect(ctx, bgX, bgY, bgSize, bgSize, 8)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  const qrX = pos.x + padding
  const qrY = pos.y + padding

  ctx.fillStyle = '#000000'
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        const x = qrX + c * cellSize
        const y = qrY + r * cellSize
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cellSize) + 0.5, Math.ceil(cellSize) + 0.5)
      }
    }
  }

  const centerX = qrX + innerSize / 2
  const centerY = qrY + innerSize / 2
  const logoSize = innerSize * 0.22
  const logoX = centerX - logoSize / 2
  const logoY = centerY - logoSize / 2

  roundRect(ctx, logoX - 2, logoY - 2, logoSize + 4, logoSize + 4, 3)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  roundRect(ctx, logoX, logoY, logoSize, logoSize, 2)
  ctx.fillStyle = '#2563eb'
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.floor(logoSize * 0.5)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('QR', centerX, centerY)

  ctx.restore()
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function renderShareCard(canvas, config, deps = {}) {
  const { width, height } = getCardDimensions(config.cardSize)
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')

  drawBackground(ctx, config, width, height, deps)
  drawText(ctx, config)
  drawLogo(ctx, config, deps)
  drawQRCode(ctx, config)

  return { width, height }
}

export function downloadCanvasAsPNG(canvas, filename) {
  const link = document.createElement('a')
  link.download = filename || `share-card-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function copyCanvasToClipboard(canvas) {
  if (!navigator.clipboard || !navigator.clipboard.write) {
    throw new Error('浏览器不支持剪贴板 API')
  }
  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })
  const item = new ClipboardItem({ 'image/png': blob })
  await navigator.clipboard.write([item])
  return true
}
