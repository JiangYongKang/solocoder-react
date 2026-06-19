import {
  createNewSession,
  DEFAULT_QUICK_OPTIONS,
  parseQuickOptions,
  serializeQuickOptions,
} from './chatbotCore.js'

export const STORAGE_KEY_SESSIONS = 'chatbot_sessions_v1'
export const STORAGE_KEY_CURRENT_SESSION = 'chatbot_current_session_v1'
export const STORAGE_KEY_QUICK_OPTIONS = 'chatbot_quick_options_v1'

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

export function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function loadSessions() {
  const sessions = safeGetItem(STORAGE_KEY_SESSIONS, null)
  if (sessions && Array.isArray(sessions) && sessions.length > 0) {
    return sessions
  }
  const defaultSession = createNewSession('智能助手')
  saveSessions([defaultSession])
  return [defaultSession]
}

export function saveSessions(sessions) {
  return safeSetItem(STORAGE_KEY_SESSIONS, sessions)
}

export function loadCurrentSessionId() {
  const id = safeGetItem(STORAGE_KEY_CURRENT_SESSION, null)
  if (typeof id === 'string' && id) {
    return id
  }
  const sessions = loadSessions()
  if (sessions.length > 0) {
    const firstId = sessions[0].id
    saveCurrentSessionId(firstId)
    return firstId
  }
  return null
}

export function saveCurrentSessionId(sessionId) {
  return safeSetItem(STORAGE_KEY_CURRENT_SESSION, sessionId)
}

export function loadQuickOptions() {
  const raw = localStorage.getItem(STORAGE_KEY_QUICK_OPTIONS)
  return parseQuickOptions(raw, DEFAULT_QUICK_OPTIONS)
}

export function saveQuickOptions(options) {
  const json = serializeQuickOptions(options)
  try {
    localStorage.setItem(STORAGE_KEY_QUICK_OPTIONS, json)
    return true
  } catch {
    return false
  }
}

export function getSessionById(sessions, sessionId) {
  if (!Array.isArray(sessions) || !sessionId) return null
  return sessions.find((s) => s.id === sessionId) || null
}

export function updateSessionMessages(sessions, sessionId, messages) {
  return sessions.map((s) => {
    if (s.id !== sessionId) return s
    return {
      ...s,
      messages,
      updatedAt: Date.now(),
    }
  })
}

export function updateSessionHumanFlag(sessions, sessionId, isHuman) {
  return sessions.map((s) => {
    if (s.id !== sessionId) return s
    return {
      ...s,
      isHuman,
      updatedAt: Date.now(),
    }
  })
}

export function renameSession(sessions, sessionId, newName) {
  return sessions.map((s) => {
    if (s.id !== sessionId) return s
    return {
      ...s,
      name: newName || s.name,
      updatedAt: Date.now(),
    }
  })
}

export function addSession(sessions, session) {
  return [...sessions, session]
}

export function removeSession(sessions, sessionId) {
  return sessions.filter((s) => s.id !== sessionId)
}
