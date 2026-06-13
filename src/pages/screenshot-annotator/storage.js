import { cloneAnnotations, formatTimestamp, generateId } from './annotatorCore.js'
import {
    IMAGE_STORAGE_KEY_PREFIX,
    MAX_INLINE_IMAGE_SIZE,
    STORAGE_KEY,
} from './constants.js'

const getStorage = () => {
  if (typeof localStorage === 'undefined') return null
  return localStorage
}

const safeParseJSON = (str) => {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

export const listSavedAnnotations = () => {
  const storage = getStorage()
  if (!storage) return []
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) return []
  const parsed = safeParseJSON(raw)
  if (!Array.isArray(parsed)) return []
  return parsed.map((item) => {
    const result = { ...item }
    if (result.annotations) {
      result.annotations = cloneAnnotations(result.annotations)
    }
    if (result.annotationsCount === undefined && result.annotations) {
      result.annotationsCount = result.annotations.length
    }
    return result
  })
}

const writeList = (list) => {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

const readListFull = () => {
  const storage = getStorage()
  if (!storage) return []
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) return []
  const parsed = safeParseJSON(raw)
  if (!Array.isArray(parsed)) return []
  return parsed
}

export const saveAnnotations = (name, annotations, imageDataUrl) => {
  const storage = getStorage()
  if (!storage) return null

  const displayName = name && name.trim() ? name.trim() : `标注_${formatTimestamp(Date.now())}`
  const id = generateId('save')
  const now = Date.now()

  const clonedAnnotations = cloneAnnotations(annotations)
  const annotationsCount = clonedAnnotations.length

  let imageData = null
  let imageHasExternalStorage = false
  let imageStorageId = null

  if (imageDataUrl) {
    if (imageDataUrl.length > MAX_INLINE_IMAGE_SIZE) {
      imageStorageId = IMAGE_STORAGE_KEY_PREFIX + id
      try {
        storage.setItem(imageStorageId, imageDataUrl)
        imageHasExternalStorage = true
      } catch {
        return null
      }
    } else {
      imageData = imageDataUrl
    }
  }

  const record = {
    id,
    name: displayName,
    createdAt: now,
    updatedAt: now,
    annotationsCount,
    annotations: clonedAnnotations,
    imageData,
    imageHasExternalStorage,
    imageStorageId,
  }

  const list = readListFull()
  list.push(record)

  if (!writeList(list)) {
    if (imageHasExternalStorage && imageStorageId) {
      try {
        storage.removeItem(imageStorageId)
      } catch {
        // ignore
      }
    }
    return null
  }

  return {
    id,
    name: displayName,
    createdAt: now,
    updatedAt: now,
    annotationsCount,
    imageData,
    imageHasExternalStorage,
    imageStorageId,
  }
}

export const loadAnnotation = (id) => {
  const storage = getStorage()
  if (!storage || !id) return null
  const list = readListFull()
  const record = list.find((r) => r.id === id)
  if (!record) return null

  let imageDataUrl = record.imageData || null
  if (record.imageHasExternalStorage && record.imageStorageId) {
    const stored = storage.getItem(record.imageStorageId)
    if (stored) {
      imageDataUrl = stored
    }
  }

  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    annotationsCount: record.annotationsCount || 0,
    annotations: cloneAnnotations(record.annotations || []),
    imageDataUrl,
  }
}

export const deleteSavedAnnotation = (id) => {
  const storage = getStorage()
  if (!storage || !id) return false
  const list = readListFull()
  const idx = list.findIndex((r) => r.id === id)
  if (idx === -1) return false

  const record = list[idx]
  list.splice(idx, 1)

  if (record.imageHasExternalStorage && record.imageStorageId) {
    try {
      storage.removeItem(record.imageStorageId)
    } catch {
      // ignore
    }
  }

  return writeList(list)
}

export const renameSavedAnnotation = (id, newName) => {
  const storage = getStorage()
  if (!storage || !id) return null
  const list = readListFull()
  const idx = list.findIndex((r) => r.id === id)
  if (idx === -1) return null

  const displayName = newName && newName.trim() ? newName.trim() : list[idx].name
  const now = Date.now()
  list[idx] = {
    ...list[idx],
    name: displayName,
    updatedAt: now,
  }

  if (!writeList(list)) return null

  return {
    id,
    name: displayName,
    createdAt: list[idx].createdAt,
    updatedAt: now,
    annotationsCount: list[idx].annotationsCount || 0,
  }
}

export const clearAllSavedAnnotations = () => {
  const storage = getStorage()
  if (!storage) return
  const list = readListFull()
  for (const record of list) {
    if (record.imageHasExternalStorage && record.imageStorageId) {
      try {
        storage.removeItem(record.imageStorageId)
      } catch {
        // ignore
      }
    }
  }
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
