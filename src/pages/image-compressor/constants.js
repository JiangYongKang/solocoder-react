export const OUTPUT_FORMATS = {
  JPG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp',
}

export const FORMAT_NAMES = {
  [OUTPUT_FORMATS.JPG]: 'JPG',
  [OUTPUT_FORMATS.PNG]: 'PNG',
  [OUTPUT_FORMATS.WEBP]: 'WEBP',
}

export const FORMAT_EXTENSIONS = {
  [OUTPUT_FORMATS.JPG]: 'jpg',
  [OUTPUT_FORMATS.PNG]: 'png',
  [OUTPUT_FORMATS.WEBP]: 'webp',
}

export const ACCEPTED_IMAGE_TYPES = [
  OUTPUT_FORMATS.JPG,
  OUTPUT_FORMATS.PNG,
  OUTPUT_FORMATS.WEBP,
]

export const COMPRESSION_PRESETS = {
  EXTREME: {
    name: '极致压缩',
    quality: 30,
    scale: 50,
    description: '质量 30%，尺寸 50%',
  },
  BALANCED: {
    name: '均衡压缩',
    quality: 60,
    scale: 80,
    description: '质量 60%，尺寸 80%',
  },
  LIGHT: {
    name: '轻度压缩',
    quality: 85,
    scale: 100,
    description: '质量 85%，尺寸 100%',
  },
  FORMAT_ONLY: {
    name: '仅改格式',
    quality: 100,
    scale: 100,
    description: '质量 100%，尺寸 100%，仅切换格式',
  },
}

export const DEFAULT_PARAMS = {
  quality: 80,
  scale: 100,
  format: OUTPUT_FORMATS.WEBP,
  maintainAspectRatio: true,
}

export const PARAM_RANGES = {
  quality: { min: 10, max: 100, step: 1 },
  scale: { min: 10, max: 100, step: 1 },
}

export const HISTORY_KEY = 'image-compressor-history'
export const MAX_HISTORY_ITEMS = 20

export const COMPARE_MODES = {
  SIDE_BY_SIDE: 'side-by-side',
  ORIGINAL_ONLY: 'original-only',
  COMPRESSED_ONLY: 'compressed-only',
}

export const PROCESSING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
}
