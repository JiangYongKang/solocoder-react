import {
  STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  RATINGS_STORAGE_KEY,
} from './constants'
import {
  createDefaultResumeState,
  validateModule,
} from './resumeTemplatesCore'

function isBrowser() {
  return typeof window !== 'undefined' && !!window.localStorage
}

export function loadResumeState() {
  if (!isBrowser()) {
    return createDefaultResumeState()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultResumeState()
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.selectedTemplateId || !Array.isArray(parsed.modules)) {
      return createDefaultResumeState()
    }
    const allValid = parsed.modules.every((m) => validateModule(m).valid)
    if (!allValid) {
      return createDefaultResumeState()
    }
    return parsed
  } catch {
    return createDefaultResumeState()
  }
}

export function saveResumeState(state) {
  if (!isBrowser()) return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearResumeState() {
  if (!isBrowser()) return false
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function loadFavorites() {
  if (!isBrowser()) return {}
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

export function saveFavorites(favorites) {
  if (!isBrowser()) return false
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
    return true
  } catch {
    return false
  }
}

export function clearFavorites() {
  if (!isBrowser()) return false
  try {
    window.localStorage.removeItem(FAVORITES_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function loadRatings() {
  if (!isBrowser()) return {}
  try {
    const raw = window.localStorage.getItem(RATINGS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

export function saveRatings(ratings) {
  if (!isBrowser()) return false
  try {
    window.localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings))
    return true
  } catch {
    return false
  }
}

export function clearRatings() {
  if (!isBrowser()) return false
  try {
    window.localStorage.removeItem(RATINGS_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function clearAllStorage() {
  return (
    clearResumeState() &&
    clearFavorites() &&
    clearRatings()
  )
}
