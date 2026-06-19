import { rgbToHex } from './colorUtils.js'

const quantizeColor = (r, g, b, factor = 32) => {
  return {
    r: Math.round(r / factor) * factor,
    g: Math.round(g / factor) * factor,
    b: Math.round(b / factor) * factor,
  }
}

const getColorKey = (r, g, b) => `${r},${g},${b}`

export const extractColorsFromImageData = (imageData, maxColors = 5, samplingFactor = 4) => {
  if (!imageData || !imageData.data) return []

  const { data, width, height } = imageData
  const colorCount = new Map()
  let totalPixels = 0

  for (let y = 0; y < height; y += samplingFactor) {
    for (let x = 0; x < width; x += samplingFactor) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const a = data[idx + 3]

      if (a < 128) continue

      const quantized = quantizeColor(r, g, b)
      const key = getColorKey(quantized.r, quantized.g, quantized.b)

      colorCount.set(key, (colorCount.get(key) || 0) + 1)
      totalPixels++
    }
  }

  if (totalPixels === 0) return []

  const sortedColors = Array.from(colorCount.entries())
    .map(([key, count]) => {
      const [r, g, b] = key.split(',').map(Number)
      const hex = rgbToHex(r, g, b)
      return {
        hex,
        rgb: { r, g, b },
        count,
        percentage: (count / totalPixels) * 100,
      }
    })
    .sort((a, b) => b.count - a.count)

  const mergedColors = []
  for (const color of sortedColors) {
    const isDuplicate = mergedColors.some((existing) => {
      const dr = Math.abs(color.rgb.r - existing.rgb.r)
      const dg = Math.abs(color.rgb.g - existing.rgb.g)
      const db = Math.abs(color.rgb.b - existing.rgb.b)
      return dr < 40 && dg < 40 && db < 40
    })

    if (!isDuplicate) {
      mergedColors.push(color)
      if (mergedColors.length >= maxColors) break
    }
  }

  return mergedColors.map((c) => ({
    ...c,
    percentage: Math.round(c.percentage * 10) / 10,
  }))
}

export const loadImageAndExtractColors = (file, maxColors = 5) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('请上传图片文件 (png, jpg, webp)'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const imageData = ctx.getImageData(0, 0, width, height)
        const colors = extractColorsFromImageData(imageData, maxColors)

        resolve(colors)
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}
