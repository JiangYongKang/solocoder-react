import { STORAGE_KEYS } from './constants.js'

function safeParse(jsonStr, fallback) {
  try {
    const parsed = JSON.parse(jsonStr)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function getStorage(storage) {
  if (storage) return storage
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  return null
}

export function loadGroups(storage = null) {
  const s = getStorage(storage)
  if (!s) return []
  try {
    const data = s.getItem(STORAGE_KEYS.GROUPS)
    return safeParse(data, [])
  } catch {
    return []
  }
}

export function saveGroups(groups, storage = null) {
  const s = getStorage(storage)
  if (!s) return
  try {
    s.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups))
  } catch {
    // ignore
  }
}

export function loadCurrentUser(storage = null) {
  const s = getStorage(storage)
  if (!s) return null
  try {
    const data = s.getItem(STORAGE_KEYS.CURRENT_USER)
    return safeParse(data, null)
  } catch {
    return null
  }
}

export function saveCurrentUser(user, storage = null) {
  const s = getStorage(storage)
  if (!s) return
  try {
    s.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
  } catch {
    // ignore
  }
}

export function loadUserRecords(storage = null) {
  const s = getStorage(storage)
  if (!s) return []
  try {
    const data = s.getItem(STORAGE_KEYS.USER_RECORDS)
    return safeParse(data, [])
  } catch {
    return []
  }
}

export function saveUserRecords(records, storage = null) {
  const s = getStorage(storage)
  if (!s) return
  try {
    s.setItem(STORAGE_KEYS.USER_RECORDS, JSON.stringify(records))
  } catch {
    // ignore
  }
}

export function clearAllGroupBuyingData(storage = null) {
  const s = getStorage(storage)
  if (!s) return
  try {
    s.removeItem(STORAGE_KEYS.GROUPS)
    s.removeItem(STORAGE_KEYS.CURRENT_USER)
    s.removeItem(STORAGE_KEYS.USER_RECORDS)
  } catch {
    // ignore
  }
}
