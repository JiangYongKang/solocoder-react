import { PRESET_GROUPS } from './constants'
import { encodeBase64 } from './utils'

const STORAGE_KEY_ENTRIES = 'pm_entries_v1'
const STORAGE_KEY_GROUPS = 'pm_groups_v1'
const STORAGE_KEY_MASTER = 'pm_master_v1'
const STORAGE_KEY_LOCK = 'pm_lock_v1'

function safeGetItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadEntries() {
  return safeGetItem(STORAGE_KEY_ENTRIES, [])
}

export function saveEntries(entries) {
  return safeSetItem(STORAGE_KEY_ENTRIES, entries)
}

export function loadGroups() {
  const stored = safeGetItem(STORAGE_KEY_GROUPS, null)
  if (stored && Array.isArray(stored) && stored.length > 0) return stored
  const defaults = PRESET_GROUPS.map((name, idx) => ({
    id: idx === 0 ? 'all' : `preset_${name}`,
    name,
    isPreset: true,
  }))
  saveGroups(defaults)
  return defaults
}

export function saveGroups(groups) {
  return safeSetItem(STORAGE_KEY_GROUPS, groups)
}

export function addGroup(groups, name) {
  const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const newGroup = { id, name, isPreset: false }
  return [...groups, newGroup]
}

export function renameGroup(groups, groupId, newName) {
  return groups.map((g) =>
    g.id === groupId ? { ...g, name: newName } : g
  )
}

export function deleteGroup(groups, groupId) {
  return groups.filter((g) => g.id !== groupId)
}

export function isGroupNameDuplicate(groups, name, excludeId) {
  return groups.some(
    (g) => g.name === name && g.id !== excludeId
  )
}

export function isGroupEmpty(entries, groupId) {
  return entries.filter((e) => e.groupId === groupId).length === 0
}

export function loadMasterPassword() {
  return localStorage.getItem(STORAGE_KEY_MASTER) || ''
}

export function saveMasterPassword(password) {
  try {
    localStorage.setItem(STORAGE_KEY_MASTER, encodeBase64(password))
    return true
  } catch {
    return false
  }
}

export function hasMasterPassword() {
  return !!localStorage.getItem(STORAGE_KEY_MASTER)
}

export function loadLockState() {
  return safeGetItem(STORAGE_KEY_LOCK, { attempts: 0, lockedUntil: null })
}

export function saveLockState(lockState) {
  return safeSetItem(STORAGE_KEY_LOCK, lockState)
}

export function addEntry(entries, entry) {
  return [...entries, entry]
}

export function updateEntry(entries, entryId, updates) {
  return entries.map((e) =>
    e.id === entryId ? { ...e, ...updates, updatedAt: Date.now() } : e
  )
}

export function deleteEntry(entries, entryId) {
  return entries.filter((e) => e.id !== entryId)
}
