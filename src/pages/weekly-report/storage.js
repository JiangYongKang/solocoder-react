import {
  STORAGE_KEY_WEEKLY_REPORTS,
  STORAGE_KEY_CURRENT_DRAFT,
  STORAGE_KEY_SELECTED_TEMPLATE
} from './constants.js'
import { sortReportsByDate } from './utils.js'

export function safeGetItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
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

export function loadReports() {
  const data = safeGetItem(STORAGE_KEY_WEEKLY_REPORTS, [])
  return sortReportsByDate(Array.isArray(data) ? data : [])
}

export function saveReports(reports) {
  return safeSetItem(STORAGE_KEY_WEEKLY_REPORTS, reports)
}

export function loadCurrentDraft() {
  return safeGetItem(STORAGE_KEY_CURRENT_DRAFT, null)
}

export function saveCurrentDraft(draft) {
  return safeSetItem(STORAGE_KEY_CURRENT_DRAFT, draft)
}

export function clearCurrentDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_DRAFT)
    return true
  } catch {
    return false
  }
}

export function loadSelectedTemplate() {
  return safeGetItem(STORAGE_KEY_SELECTED_TEMPLATE, 'concise')
}

export function saveSelectedTemplate(templateId) {
  return safeSetItem(STORAGE_KEY_SELECTED_TEMPLATE, templateId)
}
