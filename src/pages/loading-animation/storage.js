import { STORAGE_KEY, MAX_SAVED_ANIMATIONS } from './constants.js'
import { deserializeConfig, deserializeComposition } from './loadingAnimationCore.js'

export const MAX_SAVED_COUNT = MAX_SAVED_ANIMATIONS

export { STORAGE_KEY }

export function getStorage(storage) {
  if (storage) return storage
  if (typeof localStorage !== 'undefined') return localStorage
  return null
}

export function loadSavedAnimations(storage) {
  try {
    const s = getStorage(storage)
    if (!s) return []

    const raw = s.getItem(STORAGE_KEY)
    if (!raw) return []

    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []

    return data.filter(item => item && item.id && item.animationType)
  } catch {
    return []
  }
}

export function saveAnimations(animations, storage) {
  try {
    const s = getStorage(storage)
    if (!s) return false

    s.setItem(STORAGE_KEY, JSON.stringify(animations))
    return true
  } catch {
    return false
  }
}

export function saveAnimation(savedAnimations, animationData, maxCount = MAX_SAVED_ANIMATIONS) {
  if (!animationData || !animationData.id || !animationData.animationType) {
    return { saved: savedAnimations, wasAdded: false, removedOldest: null }
  }

  const existingIndex = savedAnimations.findIndex(a => a.id === animationData.id)
  const updatedAnimation = {
    ...animationData,
    updatedAt: Date.now(),
  }

  let newList
  let wasAdded = true
  let removedOldest = null

  if (existingIndex >= 0) {
    wasAdded = false
    newList = savedAnimations.map((a, i) =>
      i === existingIndex ? updatedAnimation : a
    )
  } else {
    newList = [updatedAnimation, ...savedAnimations]
    if (newList.length > maxCount) {
      removedOldest = newList[newList.length - 1]
      newList = newList.slice(0, maxCount)
    }
  }

  return { saved: newList, wasAdded, removedOldest }
}

export function deleteAnimation(savedAnimations, animationId) {
  return savedAnimations.filter(a => a.id !== animationId)
}

export function renameAnimation(savedAnimations, animationId, newName) {
  return savedAnimations.map(a =>
    a.id === animationId
      ? { ...a, name: newName, updatedAt: Date.now() }
      : a
  )
}

export function addToSaved(savedAnimations, animationData, storage, maxCount = MAX_SAVED_ANIMATIONS) {
  const result = saveAnimation(savedAnimations, animationData, maxCount)
  saveAnimations(result.saved, storage)
  return result
}

export function removeFromSaved(savedAnimations, animationId, storage) {
  const newList = deleteAnimation(savedAnimations, animationId)
  saveAnimations(newList, storage)
  return newList
}

export function exportAnimationJSON(animationData) {
  return JSON.stringify(animationData, null, 2)
}

export function importAnimationJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString)

    if (!data || typeof data !== 'object') {
      return { success: false, error: '数据必须是对象' }
    }

    if (!data.type) {
      return { success: false, error: '缺少 type 字段' }
    }

    if (!data.data) {
      return { success: false, error: 'Missing data field' }
    }

    if (data.type === 'single') {
      const singleData = data.data
      const validation = deserializeConfig(JSON.stringify(singleData))
      if (!validation.valid) {
        return { success: false, error: validation.error || 'Invalid single animation config' }
      }
      return { success: true, data: { ...singleData, type: 'single' } }
    } else if (data.type === 'composition') {
      const compData = data.data
      const validation = deserializeComposition(JSON.stringify(compData))
      if (!validation.valid) {
        return { success: false, error: validation.error || 'Invalid composition config' }
      }
      return { success: true, data: { ...compData, type: 'composition' } }
    } else {
      return { success: false, error: 'Unknown import type: ' + data.type }
    }
  } catch (e) {
    return { success: false, error: 'JSON 格式解析失败: ' + e.message }
  }
}

export function clearStorage(storage) {
  try {
    const s = getStorage(storage)
    if (!s) return false
    s.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function getStorageCount(storage) {
  return loadSavedAnimations(storage).length
}

export function isStorageFull(storage, maxCount = MAX_SAVED_ANIMATIONS) {
  return getStorageCount(storage) >= maxCount
}
