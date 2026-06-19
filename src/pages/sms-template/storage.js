import { STORAGE_KEY, getInitialState } from './constants.js'

export function saveData(data, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    return false
  }
}

export function loadData(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return getInitialState()
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return getInitialState()
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.groups) || !Array.isArray(parsed.templates)) {
      return getInitialState()
    }
    return parsed
  } catch (e) {
    return getInitialState()
  }
}

export function clearData(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return false
  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch (e) {
    return false
  }
}

export function downloadJSONFile(content, filename) {
  try {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
    return true
  } catch (e) {
    return false
  }
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('文件不存在'))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e.target.error || new Error('文件读取失败'))
    reader.readAsText(file, 'utf-8')
  })
}
