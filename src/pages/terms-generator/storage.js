import { STORAGE_KEYS, MAX_VERSIONS } from './constants.js'

const safeGetStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  return null
}

export const loadVariables = (storage = safeGetStorage()) => {
  if (!storage) return {}
  try {
    const raw = storage.getItem(STORAGE_KEYS.VARIABLES)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export const saveVariables = (variables, storage = safeGetStorage()) => {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEYS.VARIABLES, JSON.stringify(variables || {}))
  } catch {
    // ignore
  }
}

export const loadVersions = (storage = safeGetStorage()) => {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEYS.VERSIONS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_VERSIONS) : []
  } catch {
    return []
  }
}

export const saveVersions = (versions, storage = safeGetStorage()) => {
  if (!storage) return
  try {
    const limited = Array.isArray(versions) ? versions.slice(0, MAX_VERSIONS) : []
    storage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(limited))
  } catch {
    // ignore
  }
}

export const addVersion = (versionData, storage = safeGetStorage()) => {
  const versions = loadVersions(storage)
  const newVersion = {
    id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    versionNumber: versions.length + 1,
    timestamp: Date.now(),
    note: versionData?.note || '',
    content: versionData?.content || '',
    variables: versionData?.variables || {},
    templateId: versionData?.templateId || null,
  }
  versions.unshift(newVersion)
  const limited = versions.slice(0, MAX_VERSIONS)
  saveVersions(limited, storage)
  return {
    versions: limited,
    isMaxReached: limited.length >= MAX_VERSIONS,
    newVersion,
  }
}

export const deleteVersion = (versionId, storage = safeGetStorage()) => {
  const versions = loadVersions(storage)
  const filtered = versions.filter((v) => v.id !== versionId)
  filtered.forEach((v, idx) => {
    v.versionNumber = filtered.length - idx
  })
  saveVersions(filtered, storage)
  return filtered
}

export const clearVersions = (storage = safeGetStorage()) => {
  if (!storage) return []
  try {
    storage.removeItem(STORAGE_KEYS.VERSIONS)
  } catch {
    // ignore
  }
  return []
}

export const loadCustomTemplates = (storage = safeGetStorage()) => {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const saveCustomTemplates = (templates, storage = safeGetStorage()) => {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(Array.isArray(templates) ? templates : []))
  } catch {
    // ignore
  }
}

export const addCustomTemplate = (template, storage = safeGetStorage()) => {
  const templates = loadCustomTemplates(storage)
  const newTemplate = {
    id: template?.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: template?.name || '自定义模板',
    description: template?.description || '',
    isDefault: false,
    variables: template?.variables || [],
    content: template?.content || '',
    createdAt: template?.createdAt || Date.now(),
  }
  const updated = [...templates, newTemplate]
  saveCustomTemplates(updated, storage)
  return updated
}

export const deleteCustomTemplate = (templateId, storage = safeGetStorage()) => {
  const templates = loadCustomTemplates(storage)
  const filtered = templates.filter((t) => t.id !== templateId)
  saveCustomTemplates(filtered, storage)
  return filtered
}
