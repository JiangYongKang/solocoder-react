import { STORAGE_KEY, generateId } from './constants.js'
import {
  createInitialConfig,
  deserializeConfig,
  serializeConfig,
  validateImportJSON,
} from './gridGeneratorCore.js'

export function getStorage(storage) {
  if (storage) return storage
  if (typeof localStorage !== 'undefined') return localStorage
  return null
}

export function loadLayouts(storage) {
  try {
    const s = getStorage(storage)
    if (!s) return []
    const raw = s.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.filter((item) => item && item.id && item.config)
  } catch {
    return []
  }
}

export function saveLayouts(layouts, storage) {
  try {
    const s = getStorage(storage)
    if (!s) return false
    s.setItem(STORAGE_KEY, JSON.stringify(layouts))
    return true
  } catch {
    return false
  }
}

export function saveNewLayout(layouts, config, name) {
  if (!config) return { layouts, wasAdded: false, error: 'No config provided' }
  const layoutName = (name && String(name).trim()) || `布局 ${layouts.length + 1}`
  const newEntry = {
    id: generateId('layout'),
    name: layoutName,
    timestamp: Date.now(),
    config,
  }
  const newLayouts = [newEntry, ...layouts]
  return { layouts: newLayouts, wasAdded: true, entry: newEntry }
}

export function updateExistingLayout(layouts, layoutId, updates) {
  if (!layoutId) return layouts
  const exists = layouts.some((l) => l.id === layoutId)
  if (!exists) return layouts
  return layouts.map((l) => {
    if (l.id !== layoutId) return l
    return {
      ...l,
      ...(updates.name ? { name: String(updates.name).trim() } : {}),
      ...(updates.config ? { config: updates.config } : {}),
      timestamp: Date.now(),
    }
  })
}

export function deleteLayout(layouts, layoutId) {
  if (!layoutId) return layouts
  return layouts.filter((l) => l.id !== layoutId)
}

export function renameLayout(layouts, layoutId, newName) {
  return updateExistingLayout(layouts, layoutId, { name: newName })
}

export function persistLayout(layouts, config, storage, name) {
  const result = saveNewLayout(layouts, config, name)
  if (result.wasAdded) {
    saveLayouts(result.layouts, storage)
  }
  return result
}

export function loadLayoutById(layouts, layoutId) {
  const layout = layouts.find((l) => l.id === layoutId)
  if (!layout) return null
  return { config: layout.config, name: layout.name, id: layout.id, timestamp: layout.timestamp }
}

export function importLayoutFromJSON(jsonString) {
  const validation = validateImportJSON(jsonString)
  if (!validation.ok) {
    return { success: false, error: validation.error }
  }
  const { data } = validation
  const entry = {
    id: generateId('layout'),
    name: data.name || 'Imported Layout',
    timestamp: data.timestamp || Date.now(),
    config: data.config,
  }
  return { success: true, entry }
}

export function exportLayoutToJSON(entry) {
  if (!entry || !entry.config) {
    return null
  }
  return serializeConfig(entry.config, entry.name)
}

export function clearAllLayouts(storage) {
  try {
    const s = getStorage(storage)
    if (!s) return false
    s.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export { createInitialConfig, deserializeConfig }
