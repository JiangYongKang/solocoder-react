import { STORAGE_KEY_EXPERIMENTS } from './constants.js'

export function safeGetItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadExperiments() {
  return safeGetItem(STORAGE_KEY_EXPERIMENTS, [])
}

export function saveExperiments(experiments) {
  return safeSetItem(STORAGE_KEY_EXPERIMENTS, experiments)
}

export function addExperiment(experiments, experiment) {
  const updated = [...experiments, experiment]
  saveExperiments(updated)
  return updated
}

export function updateExperiment(experiments, experimentId, updater) {
  const updated = experiments.map((exp) => {
    if (exp.id === experimentId) {
      return typeof updater === 'function' ? updater(exp) : updater
    }
    return exp
  })
  saveExperiments(updated)
  return updated
}

export function removeExperiment(experiments, experimentId) {
  const updated = experiments.filter((exp) => exp.id !== experimentId)
  saveExperiments(updated)
  return updated
}

export function getExperimentById(experiments, experimentId) {
  return experiments.find((exp) => exp.id === experimentId) || null
}
