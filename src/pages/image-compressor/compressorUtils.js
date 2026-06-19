import {
  OUTPUT_FORMATS,
  FORMAT_EXTENSIONS,
  ACCEPTED_IMAGE_TYPES,
  PARAM_RANGES,
  COMPRESSION_PRESETS,
} from './constants.js'

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export const validateQuality = (quality) => {
  const { min, max } = PARAM_RANGES.quality
  return clamp(Number(quality) || min, min, max)
}

export const validateScale = (scale) => {
  const { min, max } = PARAM_RANGES.scale
  return clamp(Number(scale) || max, min, max)
}

export const validateFormat = (format) => {
  return Object.values(OUTPUT_FORMATS).includes(format)
    ? format
    : OUTPUT_FORMATS.WEBP
}

export const validateParams = (params) => {
  const quality = validateQuality(params?.quality)
  const scale = validateScale(params?.scale)
  const format = validateFormat(params?.format)
  const maintainAspectRatio = params?.maintainAspectRatio !== false
  const width = params?.width ? Math.max(1, Number(params.width)) : null
  const height = params?.height ? Math.max(1, Number(params.height)) : null

  return {
    quality,
    scale,
    format,
    maintainAspectRatio,
    width,
    height,
  }
}

export const formatFileSize = (bytes, decimals = 2) => {
  if (typeof bytes !== 'number' || isNaN(bytes)) return '0 B'
  if (bytes === 0) return '0 B'
  if (bytes < 0) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const parseFileSizeToBytes = (sizeStr) => {
  if (!sizeStr || typeof sizeStr !== 'string') return 0

  const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i)
  if (!match) return 0

  const value = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  const units = { B: 0, KB: 1, MB: 2, GB: 3, TB: 4 }

  return Math.round(value * Math.pow(1024, units[unit]))
}

export const calculateSavingsPercent = (originalSize, compressedSize) => {
  if (!originalSize || originalSize <= 0) return 0
  if (!compressedSize || compressedSize < 0) return 0
  if (compressedSize >= originalSize) return 0

  const savings = originalSize - compressedSize
  return Number(((savings / originalSize) * 100).toFixed(2))
}

export const calculateTotalSavings = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      totalOriginal: 0,
      totalCompressed: 0,
      totalSavings: 0,
      savingsPercent: 0,
    }
  }

  const totalOriginal = items.reduce((sum, item) => sum + (item.originalSize || 0), 0)
  const totalCompressed = items.reduce((sum, item) => sum + (item.compressedSize || 0), 0)
  const totalSavings = Math.max(0, totalOriginal - totalCompressed)
  const savingsPercent = calculateSavingsPercent(totalOriginal, totalCompressed)

  return {
    totalOriginal,
    totalCompressed,
    totalSavings,
    savingsPercent,
  }
}

export const calculateScaledDimensions = (originalWidth, originalHeight, scale, targetWidth, targetHeight, maintainAspectRatio = true) => {
  if (!originalWidth || !originalHeight || originalWidth <= 0 || originalHeight <= 0) {
    return { width: 0, height: 0 }
  }

  const scalePercent = validateScale(scale) / 100

  if (maintainAspectRatio) {
    if (targetWidth && targetHeight) {
      const widthRatio = targetWidth / originalWidth
      const heightRatio = targetHeight / originalHeight
      const ratio = Math.min(widthRatio, heightRatio)
      return {
        width: Math.round(originalWidth * ratio),
        height: Math.round(originalHeight * ratio),
      }
    }

    if (targetWidth) {
      const ratio = targetWidth / originalWidth
      return {
        width: Math.round(targetWidth),
        height: Math.round(originalHeight * ratio),
      }
    }

    if (targetHeight) {
      const ratio = targetHeight / originalHeight
      return {
        width: Math.round(originalWidth * ratio),
        height: Math.round(targetHeight),
      }
    }

    return {
      width: Math.round(originalWidth * scalePercent),
      height: Math.round(originalHeight * scalePercent),
    }
  }

  const width = targetWidth || Math.round(originalWidth * scalePercent)
  const height = targetHeight || Math.round(originalHeight * scalePercent)

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  }
}

export const calculateAspectRatioDimensions = (originalWidth, originalHeight, targetDimension, isWidth = true) => {
  if (!originalWidth || !originalHeight || originalWidth <= 0 || originalHeight <= 0) {
    return { width: 0, height: 0 }
  }

  if (targetDimension <= 0) {
    return { width: originalWidth, height: originalHeight }
  }

  const aspectRatio = originalWidth / originalHeight

  if (isWidth) {
    return {
      width: Math.round(targetDimension),
      height: Math.round(targetDimension / aspectRatio),
    }
  }

  return {
    width: Math.round(targetDimension * aspectRatio),
    height: Math.round(targetDimension),
  }
}

export const generateCompressedFileName = (originalName, outputFormat) => {
  if (!originalName) return `compressed.${FORMAT_EXTENSIONS[outputFormat] || 'webp'}`

  const ext = FORMAT_EXTENSIONS[outputFormat] || 'webp'
  const baseName = originalName.replace(/\.[^/.]+$/, '')

  return `${baseName}_compressed.${ext}`
}

export const getFileExtension = (file) => {
  if (!file || !file.type) return 'png'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/webp') return 'webp'
  return 'png'
}

export const validateImageType = (file) => {
  if (!file || !file.type) return false
  return ACCEPTED_IMAGE_TYPES.includes(file.type)
}

export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    if (!validateImageType(file)) {
      reject(new Error('不支持的图片格式，仅支持 JPG、PNG、WebP'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

export const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('图片源为空'))
      return
    }
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('加载图片失败'))
    img.src = src
  })
}

let idCounter = 0

export const generateId = (prefix = 'img') => {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export const createImageItem = (file, dataUrl, width, height) => {
  return {
    id: generateId(),
    file,
    name: file?.name || 'unknown',
    originalSize: file?.size || 0,
    originalWidth: width || 0,
    originalHeight: height || 0,
    dataUrl,
    compressedDataUrl: null,
    compressedSize: 0,
    compressedWidth: 0,
    compressedHeight: 0,
    status: 'pending',
    progress: 0,
    error: null,
  }
}

export const applyPreset = (presetKey, currentFormat) => {
  const preset = COMPRESSION_PRESETS[presetKey]
  if (!preset) return null

  return {
    quality: preset.quality,
    scale: preset.scale,
    format: currentFormat || OUTPUT_FORMATS.WEBP,
    maintainAspectRatio: true,
  }
}

export const compressImage = (img, params) => {
  return new Promise((resolve, reject) => {
    try {
      const validated = validateParams(params)
      const { quality, scale, format, maintainAspectRatio, width, height } = validated

      const dimensions = calculateScaledDimensions(
        img.width,
        img.height,
        scale,
        width,
        height,
        maintainAspectRatio
      )

      if (dimensions.width <= 0 || dimensions.height <= 0) {
        reject(new Error('无效的输出尺寸'))
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)

      const mimeType = format
      const qualityValue = format === OUTPUT_FORMATS.PNG ? undefined : quality / 100

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('压缩失败'))
            return
          }

          const compressedDataUrl = URL.createObjectURL(blob)
          resolve({
            blob,
            compressedDataUrl,
            compressedSize: blob.size,
            compressedWidth: dimensions.width,
            compressedHeight: dimensions.height,
          })
        },
        mimeType,
        qualityValue
      )
    } catch (err) {
      reject(err)
    }
  })
}

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const compareModes = {
  SIDE_BY_SIDE: 'side-by-side',
  SLIDER: 'slider',
  ORIGINAL: 'original',
  COMPRESSED: 'compressed',
}
