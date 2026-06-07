import { createInitialMedia } from './mockData'

const STORAGE_KEY = 'media-gallery-data'

export const MEDIA_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  OTHER: 'other',
}

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
const VIDEO_EXT = ['mp4', 'webm', 'mov', 'avi', 'mkv']
const AUDIO_EXT = ['mp3', 'wav', 'ogg', 'flac', 'm4a']
const DOCUMENT_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md']

export function loadMediaData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  const initial = createInitialMedia()
  saveMediaData(initial)
  return initial
}

export function saveMediaData(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export function generateMediaId() {
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getFileExtension(filename) {
  const idx = filename.lastIndexOf('.')
  if (idx > 0 && idx < filename.length - 1) {
    return filename.slice(idx + 1).toLowerCase()
  }
  return ''
}

export function getMediaType(filename) {
  const ext = getFileExtension(filename)
  if (IMAGE_EXT.includes(ext)) return MEDIA_TYPES.IMAGE
  if (VIDEO_EXT.includes(ext)) return MEDIA_TYPES.VIDEO
  if (AUDIO_EXT.includes(ext)) return MEDIA_TYPES.AUDIO
  if (DOCUMENT_EXT.includes(ext)) return MEDIA_TYPES.DOCUMENT
  return MEDIA_TYPES.OTHER
}

export function formatDate(timestamp) {
  if (timestamp == null || Number.isNaN(timestamp)) return '-'
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatDateTime(timestamp) {
  if (timestamp == null || Number.isNaN(timestamp)) return '-'
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatFileSize(bytes) {
  if (bytes == null || isNaN(bytes)) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function extractDateFromItem(item) {
  if (item.createdAt) return formatDate(item.createdAt)
  return '-'
}

export function getAllTags(items) {
  const tagSet = new Set()
  for (const item of items) {
    if (Array.isArray(item.tags)) {
      for (const tag of item.tags) {
        tagSet.add(tag)
      }
    }
  }
  return Array.from(tagSet).sort()
}

export function getAllTypes(items) {
  const typeSet = new Set()
  for (const item of items) {
    if (item.type) {
      typeSet.add(item.type)
    }
  }
  return Array.from(typeSet).sort()
}

export function getAllDates(items) {
  const dateSet = new Set()
  for (const item of items) {
    const date = extractDateFromItem(item)
    if (date && date !== '-') {
      dateSet.add(date)
    }
  }
  return Array.from(dateSet).sort().reverse()
}

export function filterMedia(items, { tags = [], types = [], dates = [], favoriteOnly = false, searchTerm = '' } = {}) {
  return items.filter((item) => {
    if (favoriteOnly && !item.favorite) return false

    if (tags.length > 0) {
      const itemTags = item.tags || []
      const hasMatch = tags.some((t) => itemTags.includes(t))
      if (!hasMatch) return false
    }

    if (types.length > 0 && !types.includes(item.type)) {
      return false
    }

    if (dates.length > 0) {
      const itemDate = extractDateFromItem(item)
      if (!dates.includes(itemDate)) return false
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const nameMatch = item.name && item.name.toLowerCase().includes(term)
      const tagMatch = (item.tags || []).some((t) => t.toLowerCase().includes(term))
      if (!nameMatch && !tagMatch) return false
    }

    return true
  })
}

export function sortMedia(items, sortBy = 'date', sortOrder = 'desc') {
  const sorted = [...items]
  const multiplier = sortOrder === 'asc' ? 1 : -1
  sorted.sort((a, b) => {
    let va
    let vb
    switch (sortBy) {
      case 'name':
        va = a.name || ''
        vb = b.name || ''
        if (va < vb) return -1 * multiplier
        if (va > vb) return 1 * multiplier
        return 0
      case 'size':
        va = a.size || 0
        vb = b.size || 0
        return (va - vb) * multiplier
      case 'date':
      default:
        va = a.createdAt || 0
        vb = b.createdAt || 0
        return (va - vb) * multiplier
    }
  })
  return sorted
}

export function createMediaItem({ name, size, dataUrl, type, tags = [] }) {
  const now = Date.now()
  const mediaType = type || getMediaType(name)
  return {
    id: generateMediaId(),
    name,
    size,
    type: mediaType,
    dataUrl: dataUrl || null,
    tags,
    favorite: false,
    createdAt: now,
    updatedAt: now,
  }
}

export function addMediaItem(items, newItem) {
  return [...items, newItem]
}

export function deleteMediaItems(items, idsToDelete) {
  const deleteSet = new Set(idsToDelete)
  return items.filter((item) => !deleteSet.has(item.id))
}

export function toggleFavorite(items, id) {
  return items.map((item) =>
    item.id === id ? { ...item, favorite: !item.favorite, updatedAt: Date.now() } : item
  )
}

export function setFavoriteBatch(items, ids, favorite) {
  const idSet = new Set(ids)
  return items.map((item) =>
    idSet.has(item.id) ? { ...item, favorite, updatedAt: Date.now() } : item
  )
}

export function updateMediaTags(items, id, tags) {
  return items.map((item) =>
    item.id === id ? { ...item, tags, updatedAt: Date.now() } : item
  )
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
