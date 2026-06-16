import { STORAGE_KEY_WATCHLIST, STORAGE_KEY_ALERTS } from './constants'

export function loadWatchlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WATCHLIST)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveWatchlist(watchlist) {
  try {
    localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(watchlist))
    return true
  } catch {
    return false
  }
}

export function loadAlerts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALERTS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveAlerts(alerts) {
  try {
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts))
    return true
  } catch {
    return false
  }
}
