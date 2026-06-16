const STORAGE_KEYS = {
  REQUEST_RULES: 'ni-request-rules',
  RESPONSE_RULES: 'ni-response-rules',
  MOCK_TEMPLATES: 'ni-mock-templates',
  LOGS: 'ni-logs',
}

export function loadRequestRules() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REQUEST_RULES)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveRequestRules(rules) {
  try {
    localStorage.setItem(STORAGE_KEYS.REQUEST_RULES, JSON.stringify(rules))
  } catch {
    // ignore
  }
}

export function loadResponseRules() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RESPONSE_RULES)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveResponseRules(rules) {
  try {
    localStorage.setItem(STORAGE_KEYS.RESPONSE_RULES, JSON.stringify(rules))
  } catch {
    // ignore
  }
}

export function loadMockTemplates() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MOCK_TEMPLATES)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveMockTemplates(templates) {
  try {
    localStorage.setItem(STORAGE_KEYS.MOCK_TEMPLATES, JSON.stringify(templates))
  } catch {
    // ignore
  }
}

export function loadLogs() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs))
  } catch {
    // ignore
  }
}

export function clearAllStorage() {
  localStorage.removeItem(STORAGE_KEYS.REQUEST_RULES)
  localStorage.removeItem(STORAGE_KEYS.RESPONSE_RULES)
  localStorage.removeItem(STORAGE_KEYS.MOCK_TEMPLATES)
  localStorage.removeItem(STORAGE_KEYS.LOGS)
}
