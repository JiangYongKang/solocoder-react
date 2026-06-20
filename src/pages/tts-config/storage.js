import {
  addToHistory,
  createHistoryRecord,
  serializeConfig,
  deserializeConfig,
  validateConfig,
  DEFAULT_SPEED,
  DEFAULT_PITCH,
  DEFAULT_VOLUME,
  DEFAULT_VOICE_ID,
  MAX_HISTORY_ITEMS,
} from './ttsConfigCore.js'

export const STORAGE_KEY_HISTORY = 'tts_history_v1'
export const STORAGE_KEY_CONFIGS = 'tts_configs_v1'

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

export function loadHistory() {
  const history = safeGetItem(STORAGE_KEY_HISTORY, [])
  if (!Array.isArray(history)) return []
  return history
}

export function saveHistory(history) {
  return safeSetItem(STORAGE_KEY_HISTORY, history)
}

export function addRecordToHistory(text, voiceId, speed) {
  const history = loadHistory()
  const record = createHistoryRecord(text, voiceId, speed)
  const updated = addToHistory(history, record, MAX_HISTORY_ITEMS)
  saveHistory(updated)
  return updated
}

export function loadSavedConfigs() {
  const configs = safeGetItem(STORAGE_KEY_CONFIGS, [])
  if (!Array.isArray(configs)) return []
  return configs.filter(validateConfig)
}

export function saveSavedConfigs(configs) {
  return safeSetItem(STORAGE_KEY_CONFIGS, configs)
}

export function saveConfigPreset(name, config) {
  const configs = loadSavedConfigs()
  const serialized = serializeConfig(config)
  const parsed = deserializeConfig(serialized)
  if (!parsed) return configs
  const entry = {
    id: `cfg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name || '未命名配置',
    config: parsed,
    savedAt: Date.now(),
  }
  const updated = [...configs, entry]
  saveSavedConfigs(updated)
  return updated
}

export function deleteConfigPreset(configId) {
  const configs = loadSavedConfigs()
  const updated = configs.filter((c) => c.id !== configId)
  saveSavedConfigs(updated)
  return updated
}

export function loadDefaultConfig() {
  return {
    speed: DEFAULT_SPEED,
    pitch: DEFAULT_PITCH,
    volume: DEFAULT_VOLUME,
    voiceId: DEFAULT_VOICE_ID,
  }
}
