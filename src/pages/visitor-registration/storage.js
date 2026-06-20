import { STORAGE_KEY_RECORDS, STORAGE_KEY_RECENT } from './constants'

export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}

export function loadRecentHosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveRecentHosts(hosts) {
  try {
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(hosts))
    return true
  } catch {
    return false
  }
}
