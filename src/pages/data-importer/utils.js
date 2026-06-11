import { TARGET_FIELDS, VALIDATION_STATUS, VALIDATION_MESSAGES, FAILURE_REASONS, IMPORT_DELAY_MIN, IMPORT_DELAY_MAX } from './constants.js'

export function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

export function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    return { success: false, error: 'CSV内容为空' }
  }
  try {
    const normalized = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalized.split('\n').filter((line) => line.trim().length > 0)
    if (lines.length === 0) {
      return { success: false, error: 'CSV文件为空' }
    }
    const headers = parseCSVLine(lines[0]).map((h) => h.trim())
    if (headers.length === 0 || headers.every((h) => !h)) {
      return { success: false, error: 'CSV文件没有有效的表头' }
    }
    const data = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row = {}
      headers.forEach((header, idx) => {
        row[header] = (values[idx] || '').trim()
      })
      data.push(row)
    }
    return { success: true, data, headers }
  } catch {
    return { success: false, error: 'CSV解析失败，请检查文件格式' }
  }
}

export function parseExcelData(worksheetData) {
  if (!worksheetData || !Array.isArray(worksheetData) || worksheetData.length === 0) {
    return { success: false, error: 'Excel数据为空' }
  }
  try {
    const headers = []
    const firstRow = worksheetData[0]
    if (!firstRow || typeof firstRow !== 'object') {
      return { success: false, error: 'Excel格式不正确' }
    }
    const keys = Object.keys(firstRow)
    keys.forEach((key) => {
      if (key !== '__rowNum__') {
        headers.push(String(key).trim())
      }
    })
    if (headers.length === 0) {
      return { success: false, error: 'Excel没有有效的列名' }
    }
    const data = worksheetData.map((row) => {
      const cleanRow = {}
      headers.forEach((header) => {
        cleanRow[header] = row[header] !== undefined && row[header] !== null ? String(row[header]).trim() : ''
      })
      return cleanRow
    })
    return { success: true, data, headers }
  } catch {
    return { success: false, error: 'Excel解析失败，请检查文件格式' }
  }
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false
  return /^1[3-9]\d{9}$/.test(phone.trim())
}

export function validateDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false
  const trimmed = dateStr.trim()
  let year, month, day
  const match1 = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (match1) {
    year = parseInt(match1[1], 10)
    month = parseInt(match1[2], 10)
    day = parseInt(match1[3], 10)
  } else if (/^\d{8}$/.test(trimmed)) {
    year = parseInt(trimmed.slice(0, 4), 10)
    month = parseInt(trimmed.slice(4, 6), 10)
    day = parseInt(trimmed.slice(6, 8), 10)
  } else {
    return false
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const d = new Date(year, month - 1, day)
  return !isNaN(d.getTime()) &&
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
}

export function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0
  const s1 = String(str1).toLowerCase().trim()
  const s2 = String(str2).toLowerCase().trim()
  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.8
  const longer = s1.length >= s2.length ? s1 : s2
  const shorter = s1.length >= s2.length ? s2 : s1
  if (longer.length === 0) return 0
  let matches = 0
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches++
    }
  }
  return matches / longer.length
}

export function autoMapFields(sourceHeaders, targetFields = TARGET_FIELDS) {
  const mapping = {}
  const usedSources = new Set()
  targetFields.forEach((target) => {
    let bestMatch = null
    let bestScore = 0
    sourceHeaders.forEach((source) => {
      if (usedSources.has(source)) return
      const aliasMatch = target.aliases.find((alias) => {
        const score = calculateStringSimilarity(source, alias)
        return score >= 0.7
      })
      if (aliasMatch) {
        bestMatch = source
        bestScore = 1
        return
      }
      const directScore = calculateStringSimilarity(source, target.label)
      if (directScore > bestScore) {
        bestMatch = directScore >= 0.6 ? source : null
        bestScore = directScore
      }
    })
    if (bestMatch && bestScore >= 0.6) {
      mapping[target.key] = bestMatch
      usedSources.add(bestMatch)
    }
  })
  return mapping
}

export function validateMapping(mapping, targetFields = TARGET_FIELDS) {
  const requiredFields = targetFields.filter((f) => f.required)
  const missingRequired = []
  requiredFields.forEach((field) => {
    if (!mapping[field.key]) {
      missingRequired.push(field)
    }
  })
  const sourceCounts = {}
  const duplicates = []
  Object.values(mapping).forEach((source) => {
    if (source) {
      sourceCounts[source] = (sourceCounts[source] || 0) + 1
      if (sourceCounts[source] > 1 && !duplicates.includes(source)) {
        duplicates.push(source)
      }
    }
  })
  return {
    valid: missingRequired.length === 0 && duplicates.length === 0,
    missingRequired,
    duplicateSources: duplicates,
  }
}

export function applyMapping(rawData, mapping, targetFields = TARGET_FIELDS) {
  if (!Array.isArray(rawData)) return []
  return rawData.map((row) => {
    const mapped = {}
    targetFields.forEach((target) => {
      const sourceKey = mapping[target.key]
      mapped[target.key] = sourceKey && row[sourceKey] !== undefined ? row[sourceKey] : ''
    })
    return mapped
  })
}

export function validateRow(row, targetFields = TARGET_FIELDS) {
  const issues = []
  let status = VALIDATION_STATUS.VALID
  targetFields.forEach((field) => {
    const value = row[field.key]
    const isEmpty = !value || (typeof value === 'string' && value.trim().length === 0)
    if (field.required && isEmpty) {
      issues.push({ field: field.key, message: VALIDATION_MESSAGES.REQUIRED_EMPTY, type: VALIDATION_STATUS.ERROR })
      if (status !== VALIDATION_STATUS.ERROR) {
        status = VALIDATION_STATUS.ERROR
      }
      return
    }
    if (!isEmpty && field.type === 'email' && !validateEmail(value)) {
      issues.push({ field: field.key, message: VALIDATION_MESSAGES.INVALID_EMAIL, type: VALIDATION_STATUS.WARNING })
      if (status === VALIDATION_STATUS.VALID) {
        status = VALIDATION_STATUS.WARNING
      }
    }
    if (!isEmpty && field.type === 'phone' && !validatePhone(value)) {
      issues.push({ field: field.key, message: VALIDATION_MESSAGES.INVALID_PHONE, type: VALIDATION_STATUS.WARNING })
      if (status === VALIDATION_STATUS.VALID) {
        status = VALIDATION_STATUS.WARNING
      }
    }
    if (!isEmpty && field.type === 'date' && !validateDate(value)) {
      issues.push({ field: field.key, message: VALIDATION_MESSAGES.INVALID_DATE, type: VALIDATION_STATUS.WARNING })
      if (status === VALIDATION_STATUS.VALID) {
        status = VALIDATION_STATUS.WARNING
      }
    }
  })
  return { status, issues }
}

export function findDuplicateRows(rows, targetFields = TARGET_FIELDS) {
  const seen = new Map()
  const duplicates = new Set()
  const keys = targetFields.map((f) => f.key)
  rows.forEach((row, index) => {
    const signature = keys.map((k) => String(row[k] || '')).join('|||')
    if (seen.has(signature)) {
      duplicates.add(index)
      duplicates.add(seen.get(signature))
    } else {
      seen.set(signature, index)
    }
  })
  return duplicates
}

export function isDataEqual(data1, data2) {
  if (data1 === data2) return true
  if (!Array.isArray(data1) || !Array.isArray(data2)) return false
  if (data1.length !== data2.length) return false
  for (let i = 0; i < data1.length; i++) {
    const row1 = data1[i]
    const row2 = data2[i]
    if (row1 === row2) continue
    if (typeof row1 !== 'object' || row1 === null ||
        typeof row2 !== 'object' || row2 === null) {
      return false
    }
    const keys1 = Object.keys(row1)
    const keys2 = Object.keys(row2)
    if (keys1.length !== keys2.length) return false
    for (let j = 0; j < keys1.length; j++) {
      const key = keys1[j]
      if (!Object.prototype.hasOwnProperty.call(row2, key)) return false
      if (row1[key] !== row2[key]) return false
    }
  }
  return true
}

export function validateAllRows(mappedData, targetFields = TARGET_FIELDS) {
  if (!Array.isArray(mappedData)) {
    return { rows: [], stats: { total: 0, valid: 0, warning: 0, error: 0, duplicate: 0 } }
  }
  const duplicateIndices = findDuplicateRows(mappedData, targetFields)
  const rows = mappedData.map((row, index) => {
    const result = validateRow(row, targetFields)
    let status = result.status
    const issues = [...result.issues]
    if (duplicateIndices.has(index)) {
      status = VALIDATION_STATUS.DUPLICATE
      issues.push({ field: null, message: VALIDATION_MESSAGES.DUPLICATE_ROW, type: VALIDATION_STATUS.DUPLICATE })
    }
    return {
      index,
      data: row,
      status,
      issues,
    }
  })
  const stats = {
    total: rows.length,
    valid: rows.filter((r) => r.status === VALIDATION_STATUS.VALID).length,
    warning: rows.filter((r) => r.status === VALIDATION_STATUS.WARNING).length,
    error: rows.filter((r) => r.status === VALIDATION_STATUS.ERROR).length,
    duplicate: rows.filter((r) => r.status === VALIDATION_STATUS.DUPLICATE).length,
  }
  return { rows, stats }
}

export function getRowFailureReasons(rowResult) {
  const reasons = []
  if (rowResult.status === VALIDATION_STATUS.ERROR) {
    rowResult.issues.forEach((issue) => {
      if (issue.type === VALIDATION_STATUS.ERROR) {
        if (issue.message === VALIDATION_MESSAGES.REQUIRED_EMPTY) {
          reasons.push(FAILURE_REASONS.REQUIRED_MISSING)
        }
      }
    })
  }
  if (rowResult.status === VALIDATION_STATUS.WARNING) {
    reasons.push(FAILURE_REASONS.FORMAT_ERROR)
  }
  if (rowResult.status === VALIDATION_STATUS.DUPLICATE) {
    reasons.push(FAILURE_REASONS.DUPLICATE_ROW)
  }
  return [...new Set(reasons)]
}

export function generateImportDelay() {
  return Math.floor(Math.random() * (IMPORT_DELAY_MAX - IMPORT_DELAY_MIN + 1)) + IMPORT_DELAY_MIN
}

export function shouldSkipRow(rowResult) {
  return rowResult.status === VALIDATION_STATUS.ERROR ||
    rowResult.status === VALIDATION_STATUS.DUPLICATE
}

export function getImportResult(validatedRows) {
  const successRows = []
  const skippedRows = []
  validatedRows.forEach((row) => {
    if (shouldSkipRow(row)) {
      skippedRows.push({
        ...row,
        reasons: getRowFailureReasons(row),
      })
    } else {
      successRows.push(row)
    }
  })
  return { successRows, skippedRows }
}

export function exportFailedRowsToCSV(failedRows, targetFields = TARGET_FIELDS) {
  if (!Array.isArray(failedRows) || failedRows.length === 0) {
    return ''
  }
  const escapeCSVValue = (value) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }
  const headers = ['行号', ...targetFields.map((f) => f.label), '失败原因']
  const rows = failedRows.map((row) => {
    const dataValues = targetFields.map((f) => row.data[f.key] || '')
    const reasonsText = row.reasons ? row.reasons.join('; ') : ''
    return [row.index + 1, ...dataValues, reasonsText]
  })
  const allRows = [headers, ...rows]
  return allRows.map((r) => r.map(escapeCSVValue).join(',')).join('\n')
}

export function downloadCSV(content, filename = 'failed_rows.csv') {
  if (typeof window === 'undefined' || !window.Blob) return false
  try {
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

export function buildRowDisplayText(row, targetFields = TARGET_FIELDS) {
  return targetFields
    .map((f) => row.data[f.key])
    .filter((v) => v && v.trim().length > 0)
    .join(' | ')
}
