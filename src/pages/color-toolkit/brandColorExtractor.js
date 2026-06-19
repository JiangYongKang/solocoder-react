import { rgbToHex } from './colorUtils.js'

const clampByte = (value) => Math.max(0, Math.min(255, value))

const quantizeColor = (r, g, b, factor) => {
  return {
    r: clampByte(Math.round(r / factor) * factor),
    g: clampByte(Math.round(g / factor) * factor),
    b: clampByte(Math.round(b / factor) * factor),
  }
}

const getColorKey = (r, g, b) => `${r},${g},${b}`

const getColorDistance = (c1, c2) => {
  const dr = c1.r - c2.r
  const dg = c1.g - c2.g
  const db = c1.b - c2.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

const estimateColorDiversity = (colors) => {
  if (colors.length < 2) return 0

  let totalDist = 0
  let pairCount = 0
  const sampleSize = Math.min(colors.length, 50)
  const step = Math.floor(colors.length / sampleSize)

  for (let i = 0; i < colors.length; i += step) {
    for (let j = i + step; j < colors.length; j += step) {
      totalDist += getColorDistance(colors[i], colors[j])
      pairCount++
    }
  }

  return pairCount > 0 ? totalDist / pairCount : 0
}

const computeAdaptiveQuantFactor = (imageData, samplingFactor = 4) => {
  const { data, width, height } = imageData
  const sampleColors = []

  for (let y = 0; y < height; y += samplingFactor * 4) {
    for (let x = 0; x < width; x += samplingFactor * 4) {
      const idx = (y * width + x) * 4
      const a = data[idx + 3]
      if (a < 128) continue
      sampleColors.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
      })
    }
  }

  const diversity = estimateColorDiversity(sampleColors)

  if (diversity > 150) return 16
  if (diversity > 100) return 24
  if (diversity > 60) return 32
  return 48
}

const computeAdaptiveMergeThreshold = (imageData, quantFactor, samplingFactor = 4) => {
  const { data, width, height } = imageData
  const colorMap = new Map()

  for (let y = 0; y < height; y += samplingFactor * 2) {
    for (let x = 0; x < width; x += samplingFactor * 2) {
      const idx = (y * width + x) * 4
      const a = data[idx + 3]
      if (a < 128) continue

      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const quantized = quantizeColor(r, g, b, quantFactor)
      const key = getColorKey(quantized.r, quantized.g, quantized.b)
      colorMap.set(key, (colorMap.get(key) || 0) + 1)
    }
  }

  const colorList = Array.from(colorMap.keys()).map((key) => {
    const [r, g, b] = key.split(',').map(Number)
    return { r, g, b }
  })

  const diversity = estimateColorDiversity(colorList)

  if (diversity > 120) return 30
  if (diversity > 80) return 45
  if (diversity > 50) return 60
  return 75
}

const mergeSimilarColors = (sortedColors, maxColors, mergeThreshold) => {
  const clusters = []

  for (const color of sortedColors) {
    let nearestCluster = null
    let nearestDist = Infinity

    for (const cluster of clusters) {
      const dist = getColorDistance(color.rgb, cluster.centroid)
      if (dist < mergeThreshold && dist < nearestDist) {
        nearestDist = dist
        nearestCluster = cluster
      }
    }

    if (nearestCluster) {
      const totalCount = nearestCluster.totalCount + color.count
      nearestCluster.centroid = {
        r: Math.round(
          (nearestCluster.centroid.r * nearestCluster.totalCount + color.rgb.r * color.count) / totalCount
        ),
        g: Math.round(
          (nearestCluster.centroid.g * nearestCluster.totalCount + color.rgb.g * color.count) / totalCount
        ),
        b: Math.round(
          (nearestCluster.centroid.b * nearestCluster.totalCount + color.rgb.b * color.count) / totalCount
        ),
      }
      nearestCluster.totalCount = totalCount
      nearestCluster.colors.push(color)
    } else {
      clusters.push({
        centroid: { ...color.rgb },
        totalCount: color.count,
        colors: [color],
      })
    }
  }

  clusters.sort((a, b) => b.totalCount - a.totalCount)

  return clusters.slice(0, maxColors).map((cluster) => ({
    rgb: cluster.centroid,
    hex: rgbToHex(cluster.centroid.r, cluster.centroid.g, cluster.centroid.b),
    count: cluster.totalCount,
  }))
}

export const extractColorsFromImageData = (imageData, maxColors = 5, samplingFactor = 4) => {
  if (!imageData || !imageData.data) return []

  const { data, width, height } = imageData
  const colorCount = new Map()
  let totalPixels = 0

  const quantFactor = computeAdaptiveQuantFactor(imageData, samplingFactor)
  const mergeThreshold = computeAdaptiveMergeThreshold(imageData, quantFactor, samplingFactor)

  for (let y = 0; y < height; y += samplingFactor) {
    for (let x = 0; x < width; x += samplingFactor) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const a = data[idx + 3]

      if (a < 128) continue

      const quantized = quantizeColor(r, g, b, quantFactor)
      const key = getColorKey(quantized.r, quantized.g, quantized.b)

      const current = colorCount.get(key) || { count: 0, sumR: 0, sumG: 0, sumB: 0 }
      current.count += 1
      current.sumR += r
      current.sumG += g
      current.sumB += b
      colorCount.set(key, current)

      totalPixels++
    }
  }

  if (totalPixels === 0) return []

  const sortedColors = Array.from(colorCount.entries())
    .map(([key, value]) => {
      const avgR = Math.round(value.sumR / value.count)
      const avgG = Math.round(value.sumG / value.count)
      const avgB = Math.round(value.sumB / value.count)
      const hex = rgbToHex(avgR, avgG, avgB)
      return {
        hex,
        rgb: { r: avgR, g: avgG, b: avgB },
        count: value.count,
        percentage: (value.count / totalPixels) * 100,
      }
    })
    .sort((a, b) => b.count - a.count)

  const mergedColors = mergeSimilarColors(sortedColors, maxColors, mergeThreshold)

  return mergedColors.map((c) => ({
    ...c,
    percentage: Math.round((c.count / totalPixels) * 100 * 10) / 10,
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

export {
  quantizeColor,
  getColorDistance,
  estimateColorDiversity,
  computeAdaptiveQuantFactor,
  computeAdaptiveMergeThreshold,
  mergeSimilarColors,
}
