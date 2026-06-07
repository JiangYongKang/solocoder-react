const STORAGE_KEY = 'wizard_draft'
const TOTAL_STEPS = 4

export function getStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null
}

export function createEmptyDraft() {
  return {
    currentStep: 0,
    data: {
      name: '',
      email: '',
      phone: '',
      province: '',
      city: '',
      address: '',
      interests: [],
      notification: '',
      frequency: '',
    },
  }
}

export function saveDraft(draft) {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export function loadDraft() {
  const storage = getStorage()
  if (!storage) return createEmptyDraft()
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyDraft()
    const parsed = JSON.parse(raw)
    return mergeWithDefaults(parsed)
  } catch {
    return createEmptyDraft()
  }
}

export function clampStep(step) {
  if (typeof step !== 'number' || Number.isNaN(step)) return 0
  return Math.max(0, Math.min(TOTAL_STEPS - 1, Math.floor(step)))
}

export function mergeWithDefaults(parsed) {
  const defaults = createEmptyDraft()
  return {
    currentStep: clampStep(parsed.currentStep),
    data: {
      ...defaults.data,
      ...(parsed.data || {}),
      interests: Array.isArray(parsed.data?.interests) ? parsed.data.interests : [],
    },
  }
}

export function clearDraft() {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
