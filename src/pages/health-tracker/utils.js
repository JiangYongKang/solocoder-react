import {
  STORAGE_KEY_RECORDS,
  STORAGE_KEY_GOALS,
  FIELD_CONFIG,
  NORMAL_RANGES,
  BMI_RANGES,
  INDICATOR_KEYS,
  PAGE_SIZE,
  DEFAULT_GOALS,
} from './constants'

export function generateId() {
  return 'ht_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatDate(date) {
  if (!date) return ''
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getTodayKey() {
  return formatDate(new Date())
}

export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) return null
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  return Math.round(bmi * 10) / 10
}

export function getBMICategory(bmi) {
  if (bmi === null || bmi === undefined) return null
  if (bmi < BMI_RANGES.underweight.max) return 'underweight'
  if (bmi < BMI_RANGES.normal.max) return 'normal'
  if (bmi < BMI_RANGES.overweight.max) return 'overweight'
  return 'obese'
}

export function getBMIColor(bmi) {
  const category = getBMICategory(bmi)
  if (!category) return '#999'
  return BMI_RANGES[category].color
}

export function isAbnormal(fieldKey, value) {
  if (value === null || value === undefined || value === '') return false
  const range = NORMAL_RANGES[fieldKey]
  if (!range) return false
  const num = Number(value)
  if (isNaN(num)) return false
  return num < range.min || num > range.max
}

export function validateField(fieldKey, value) {
  const config = FIELD_CONFIG[fieldKey]
  if (!config) return ''
  if (value === '' || value === null || value === undefined) return ''
  const num = Number(value)
  if (isNaN(num)) return `${config.label}必须为数字`
  if (num < config.min || num > config.max) {
    return `${config.label}范围为${config.min}-${config.max}${config.unit}`
  }
  return ''
}

export function validateRecord(data) {
  const errors = {}
  let hasAnyField = false
  for (const key of INDICATOR_KEYS) {
    const val = data[key]
    if (val !== '' && val !== null && val !== undefined) {
      hasAnyField = true
      const err = validateField(key, val)
      if (err) errors[key] = err
    }
  }
  if (!hasAnyField) {
    errors._form = '请至少填写一项健康指标'
  }
  if (!data.date) {
    errors.date = '请选择记录日期'
  }
  return errors
}

export function createRecord(records, data) {
  const errors = validateRecord(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const record = {
    id: generateId(),
    date: data.date,
  }
  for (const key of INDICATOR_KEYS) {
    const val = data[key]
    if (val !== '' && val !== null && val !== undefined) {
      record[key] = Number(val)
    }
  }
  if (record.height && record.weight) {
    record.bmi = calculateBMI(record.weight, record.height)
  }
  record.abnormalFields = INDICATOR_KEYS.filter(
    (key) => record[key] !== undefined && isAbnormal(key, record[key])
  )
  const updated = [record, ...records]
  return { success: true, record, records: updated }
}

export function deleteRecord(records, id) {
  const exists = records.some((r) => r.id === id)
  if (!exists) return { success: false, records }
  return { success: true, records: records.filter((r) => r.id !== id) }
}

export function countAbnormalRecords(records) {
  return records.filter((r) => r.abnormalFields && r.abnormalFields.length > 0).length
}

export function filterRecords(records, showAbnormalOnly = false) {
  if (!showAbnormalOnly) return records
  return records.filter((r) => r.abnormalFields && r.abnormalFields.length > 0)
}

export function paginateRecords(records, page, pageSize = PAGE_SIZE) {
  const totalPage = Math.max(1, Math.ceil(records.length / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  return {
    items: records.slice(start, start + pageSize),
    total: records.length,
    totalPage,
    currentPage,
  }
}

export function buildTrendData(records, days = 30) {
  const result = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateKey = formatDate(d)
    const dayRecords = records.filter((r) => r.date === dateKey)
    const entry = {
      date: dateKey,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
    }
    for (const key of INDICATOR_KEYS) {
      const values = dayRecords
        .map((r) => r[key])
        .filter((v) => v !== undefined && v !== null)
      entry[key] = values.length > 0 ? values[values.length - 1] : null
    }
    const bmiValues = dayRecords
      .map((r) => r.bmi)
      .filter((v) => v !== undefined && v !== null)
    entry.bmi = bmiValues.length > 0 ? bmiValues[bmiValues.length - 1] : null
    result.push(entry)
  }
  return result
}

export function generateTrendSummary(trendData) {
  const summaries = {}
  const allKeys = [...INDICATOR_KEYS, 'bmi']
  for (const key of allKeys) {
    const values = trendData
      .map((d) => d[key])
      .filter((v) => v !== null && v !== undefined)
    if (values.length < 2) {
      summaries[key] = { trend: '数据不足', description: '数据点不足，无法判断趋势' }
      continue
    }
    const first = values[0]
    const last = values[values.length - 1]
    const diff = last - first
    const absDiff = Math.abs(diff)
    const threshold = key === 'bmi' ? 0.5 : key === 'bloodSugar' ? 0.3 : 2
    let trend, description
    if (absDiff <= threshold) {
      trend = 'stable'
      description = `${getFieldLabel(key)}近30天基本稳定`
    } else if (diff > 0) {
      trend = 'rising'
      description = `${getFieldLabel(key)}近30天呈上升趋势（${first} → ${last}）`
    } else {
      trend = 'falling'
      description = `${getFieldLabel(key)}近30天呈下降趋势（${first} → ${last}）`
    }
    summaries[key] = { trend, description }
  }
  return summaries
}

function getFieldLabel(key) {
  const labels = {
    height: '身高',
    weight: '体重',
    systolic: '收缩压',
    diastolic: '舒张压',
    bloodSugar: '空腹血糖',
    bmi: 'BMI',
  }
  return labels[key] || key
}

export function calculateWeightProgress(currentWeight, targetWeight) {
  if (!currentWeight || !targetWeight) return null
  if (targetWeight <= 0 || currentWeight <= 0) return null
  const startWeight = currentWeight
  const totalNeeded = Math.abs(startWeight - targetWeight)
  if (totalNeeded === 0) return { percent: 100, isCompleted: true, currentWeight, targetWeight }
  const currentDiff = Math.abs(startWeight - targetWeight)
  const lost = Math.abs(startWeight - currentWeight)
  const percent = Math.min((lost / totalNeeded) * 100, 100)
  const isCompleted = currentDiff <= 0.1
  return { percent: Math.round(percent * 10) / 10, isCompleted, currentWeight, targetWeight }
}

export function calculateExerciseProgress(weeklyDone, weeklyGoal) {
  if (!weeklyGoal || weeklyGoal <= 0) return null
  const percent = Math.min((weeklyDone / weeklyGoal) * 100, 100)
  const isCompleted = weeklyDone >= weeklyGoal
  return { percent: Math.round(percent * 10) / 10, isCompleted, current: weeklyDone, goal: weeklyGoal }
}

export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}

export function loadGoals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GOALS)
    if (!raw) return { ...DEFAULT_GOALS }
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_GOALS }
    return {
      weightTarget: typeof parsed.weightTarget === 'number' ? parsed.weightTarget : null,
      weightDeadline: typeof parsed.weightDeadline === 'string' ? parsed.weightDeadline : '',
      weeklyExercise: typeof parsed.weeklyExercise === 'number' ? parsed.weeklyExercise : DEFAULT_GOALS.weeklyExercise,
      weeklyExerciseDone: typeof parsed.weeklyExerciseDone === 'number' ? parsed.weeklyExerciseDone : 0,
    }
  } catch {
    return { ...DEFAULT_GOALS }
  }
}

export function saveGoals(goals) {
  try {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals))
    return true
  } catch {
    return false
  }
}

export function validateGoals(goals) {
  const errors = {}
  if (goals.weightTarget !== null && goals.weightTarget !== undefined && goals.weightTarget !== '') {
    const wt = Number(goals.weightTarget)
    if (isNaN(wt) || wt < 20 || wt > 300) {
      errors.weightTarget = '体重目标范围为20-300kg'
    }
  }
  if (goals.weightDeadline) {
    const d = new Date(goals.weightDeadline)
    if (isNaN(d.getTime())) {
      errors.weightDeadline = '日期格式无效'
    }
  }
  const we = Number(goals.weeklyExercise)
  if (goals.weeklyExercise === undefined || goals.weeklyExercise === null || goals.weeklyExercise === '') {
    errors.weeklyExercise = '请输入每周运动次数'
  } else if (!Number.isInteger(we) || we < 0 || we > 7) {
    errors.weeklyExercise = '每周运动次数范围为0-7'
  }
  return errors
}

export function setGoals(currentGoals, newGoals) {
  const errors = validateGoals(newGoals)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const updated = {
    weightTarget: newGoals.weightTarget !== '' && newGoals.weightTarget !== null && newGoals.weightTarget !== undefined
      ? Number(newGoals.weightTarget) : null,
    weightDeadline: newGoals.weightDeadline || '',
    weeklyExercise: Number(newGoals.weeklyExercise),
    weeklyExerciseDone: currentGoals.weeklyExerciseDone || 0,
  }
  return { success: true, goals: updated }
}

export function getLatestValues(records) {
  const latest = {}
  for (const key of INDICATOR_KEYS) {
    for (const r of records) {
      if (r[key] !== undefined && r[key] !== null) {
        latest[key] = r[key]
        break
      }
    }
  }
  for (const r of records) {
    if (r.bmi !== undefined && r.bmi !== null) {
      latest.bmi = r.bmi
      break
    }
  }
  return latest
}

export function generateReportContent(records, trendSummary) {
  const latest = getLatestValues(records)
  const abnormalList = []
  for (const key of Object.keys(NORMAL_RANGES)) {
    if (latest[key] !== undefined) {
      if (isAbnormal(key, latest[key])) {
        abnormalList.push({
          field: getFieldLabel(key),
          value: latest[key],
          normalRange: NORMAL_RANGES[key],
        })
      }
    }
  }
  const trendLines = Object.entries(trendSummary)
    .filter(([, v]) => v.trend !== '数据不足')
    .map(([, v]) => v.description)
  const now = new Date()
  return {
    title: '个人健康报告',
    date: formatDate(now) + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
    latestValues: latest,
    normalRanges: NORMAL_RANGES,
    abnormalList,
    trendLines,
  }
}
