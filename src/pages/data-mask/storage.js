const CUSTOM_RULES_KEY = 'data-mask-custom-rules'
const SCHEMES_KEY = 'data-mask-schemes'
const ENABLED_RULES_KEY = 'data-mask-enabled-rules'

const isBrowser = () => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

const safeParseJSON = (str) => {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export const loadCustomRules = () => {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(CUSTOM_RULES_KEY)
    if (!raw) return []
    const parsed = safeParseJSON(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export const saveCustomRules = (rules) => {
  if (!isBrowser()) return false
  try {
    const arr = Array.isArray(rules) ? rules : []
    window.localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(arr))
    return true
  } catch {
    return false
  }
}

export const addCustomRule = (name, pattern, replacement, existingRules) => {
  const rules = Array.isArray(existingRules) ? [...existingRules] : []
  const newRule = {
    id: 'custom_' + generateId(),
    name: name || '自定义规则',
    pattern: pattern || '',
    groupPattern: pattern || '',
    replacement: replacement || '***',
    description: `自定义正则: ${pattern}`,
    example: `${pattern} → ${replacement}`,
    category: 'custom',
    enabled: true,
    createdAt: Date.now(),
  }
  rules.push(newRule)
  saveCustomRules(rules)
  return { rules, newRule }
}

export const deleteCustomRule = (id, existingRules) => {
  const rules = Array.isArray(existingRules) ? [...existingRules] : []
  const filtered = rules.filter((r) => r.id !== id)
  saveCustomRules(filtered)
  return filtered
}

export const updateCustomRule = (id, updates, existingRules) => {
  const rules = Array.isArray(existingRules) ? [...existingRules] : []
  const idx = rules.findIndex((r) => r.id === id)
  if (idx >= 0) {
    rules[idx] = { ...rules[idx], ...updates }
    if (updates.pattern) {
      rules[idx].groupPattern = updates.pattern
      rules[idx].description = `自定义正则: ${updates.pattern}`
    }
    saveCustomRules(rules)
  }
  return rules
}

export const loadSchemes = () => {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(SCHEMES_KEY)
    if (!raw) return []
    const parsed = safeParseJSON(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export const saveSchemes = (schemes) => {
  if (!isBrowser()) return false
  try {
    const arr = Array.isArray(schemes) ? schemes : []
    window.localStorage.setItem(SCHEMES_KEY, JSON.stringify(arr))
    return true
  } catch {
    return false
  }
}

export const addScheme = (name, enabledRuleIds, existingSchemes) => {
  const schemes = Array.isArray(existingSchemes) ? [...existingSchemes] : []
  const newScheme = {
    id: 'scheme_' + generateId(),
    name: name || '未命名方案',
    enabledRuleIds: Array.isArray(enabledRuleIds) ? [...enabledRuleIds] : [],
    createdAt: Date.now(),
  }
  schemes.push(newScheme)
  saveSchemes(schemes)
  return { schemes, newScheme }
}

export const deleteScheme = (id, existingSchemes) => {
  const schemes = Array.isArray(existingSchemes) ? [...existingSchemes] : []
  const filtered = schemes.filter((s) => s.id !== id)
  saveSchemes(filtered)
  return filtered
}

export const updateScheme = (id, updates, existingSchemes) => {
  const schemes = Array.isArray(existingSchemes) ? [...existingSchemes] : []
  const idx = schemes.findIndex((s) => s.id === id)
  if (idx >= 0) {
    schemes[idx] = { ...schemes[idx], ...updates }
    saveSchemes(schemes)
  }
  return schemes
}

export const loadEnabledRuleIds = () => {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(ENABLED_RULES_KEY)
    if (!raw) return null
    const parsed = safeParseJSON(raw)
    if (!Array.isArray(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export const saveEnabledRuleIds = (ids) => {
  if (!isBrowser()) return false
  try {
    const arr = Array.isArray(ids) ? ids : []
    window.localStorage.setItem(ENABLED_RULES_KEY, JSON.stringify(arr))
    return true
  } catch {
    return false
  }
}

export { generateId, isBrowser, safeParseJSON }
